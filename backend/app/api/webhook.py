"""Webhook endpoints for RunPod job completion and Stripe events."""

import json
import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.config import Settings, get_settings
from app.services.queue import JobQueue
from app.services.supabase import get_supabase, save_generation

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Monthly credit allocations per plan
PLAN_CREDITS = {"free": 50, "lite": 150, "basic": 500, "pro": 2000, "unlimited": 999999, "studio": 999999}
ADULT_PLAN_CREDITS = {"adult_starter": 100, "adult_creator": 500, "adult_studio": 2000, "adult_patron": 999999}


@router.post("/runpod")
async def runpod_webhook(request: Request, settings: Settings = Depends(get_settings)):
    """RunPod calls this when a generation job completes."""
    body = await request.json()
    job_id = body.get("id")
    status = body.get("status")

    if not job_id:
        raise HTTPException(status_code=400, detail="Missing job id")

    queue = JobQueue(settings)

    if status == "COMPLETED":
        output = body.get("output", {})
        result_url = output.get("url")

        await queue.set_status(job_id, "completed", {"url": result_url})

        # Save to generations table
        job_data_raw = await queue.redis.get(f"job:{job_id}")
        if job_data_raw:
            job_data = json.loads(job_data_raw)
            supabase = get_supabase(settings)
            await save_generation(supabase, {
                "id": job_id,
                "user_id": job_data["user_id"],
                "prompt": job_data["params"].get("prompt", ""),
                "negative_prompt": job_data["params"].get("negative_prompt", ""),
                "model": job_data["params"].get("model", ""),
                "params_json": job_data["params"],
                "nsfw_flag": job_data["params"].get("nsfw", False),
                "image_url": result_url if job_data["type"] == "txt2img" else None,
                "video_url": result_url if job_data["type"] != "txt2img" else None,
                "credits_used": 1,
            })
    elif status == "FAILED":
        error = body.get("error", "Unknown error")
        await queue.set_status(job_id, "failed", {"error": error})
        # TODO: refund credits on failure

    return {"received": True}


def _find_user_by_customer(supabase, customer_id: str) -> dict | None:
    """Find user by Stripe customer ID."""
    result = (
        supabase.table("users")
        .select("*")
        .eq("stripe_customer_id", customer_id)
        .maybe_single()
        .execute()
    )
    return result.data


def _find_user_by_email(supabase, email: str) -> dict | None:
    """Find user by email."""
    result = (
        supabase.table("users")
        .select("*")
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    return result.data


def _update_adult_plan(supabase, user_id: str, plan: str):
    """Update user's adult plan and add adult credits."""
    supabase.table("users").update({"adult_plan": plan}).eq("id", user_id).execute()
    credits = ADULT_PLAN_CREDITS.get(plan, 100)
    # Adult credits add on top of existing balance
    current = supabase.table("credits").select("balance").eq("user_id", user_id).maybe_single().execute()
    new_balance = (current.data["balance"] if current.data else 0) + credits
    supabase.table("credits").upsert({"user_id": user_id, "balance": new_balance}).execute()
    supabase.table("credit_transactions").insert({
        "user_id": user_id,
        "amount": credits,
        "type": "adult_subscription",
        "description": f"Monthly {plan} adult plan credits",
    }).execute()
    logger.info(f"Adult plan updated: user={user_id} plan={plan} credits={credits}")


def _update_user_plan(supabase, user_id: str, plan: str):
    """Update user plan and reset credits."""
    supabase.table("users").update({"plan": plan}).eq("id", user_id).execute()
    credits = PLAN_CREDITS.get(plan, 50)
    supabase.table("credits").upsert({
        "user_id": user_id,
        "balance": credits,
    }).execute()
    supabase.table("credit_transactions").insert({
        "user_id": user_id,
        "amount": credits,
        "type": "subscription",
        "description": f"Monthly {plan} plan credits",
    }).execute()


@router.post("/stripe")
async def stripe_webhook(request: Request, settings: Settings = Depends(get_settings)):
    """Handle Stripe webhook events (subscription, payment)."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    stripe.api_key = settings.stripe_secret_key

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except Exception as e:
        if "SignatureVerification" in type(e).__name__:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
        logger.error(f"Stripe webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook verification failed")

    supabase = get_supabase(settings)
    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        # New subscription or one-time purchase completed
        customer_id = data.get("customer")
        metadata = data.get("metadata", {})
        plan = metadata.get("plan", "basic")
        user_id = metadata.get("user_id")

        if user_id:
            # Link Stripe customer to user
            supabase.table("users").update(
                {"stripe_customer_id": customer_id}
            ).eq("id", user_id).execute()

            if data.get("mode") == "subscription":
                plan_type = metadata.get("type", "main")
                # Adult plans are now on CCBill, NOT Stripe.
                # If somehow an old adult checkout comes through, ignore it.
                if plan_type == "adult":
                    logger.warning(f"Ignoring Stripe adult checkout (deprecated): user={user_id}")
                else:
                    _update_user_plan(supabase, user_id, plan)
            elif data.get("mode") == "payment":
                # One-time purchase (local license)
                supabase.table("users").update(
                    {"local_license": True}
                ).eq("id", user_id).execute()

        logger.info(f"Checkout completed: user={user_id} plan={plan}")

    elif event_type == "customer.subscription.updated":
        # Plan change or renewal
        customer_id = data.get("customer")
        user = _find_user_by_customer(supabase, customer_id)
        if user and data.get("status") == "active":
            # Get plan from price metadata or subscription metadata
            items = data.get("items", {}).get("data", [])
            plan = data.get("metadata", {}).get("plan")
            if not plan and items:
                plan = items[0].get("price", {}).get("metadata", {}).get("plan")
            if plan:
                _update_user_plan(supabase, user["id"], plan)

    elif event_type == "customer.subscription.deleted":
        # Subscription cancelled
        customer_id = data.get("customer")
        user = _find_user_by_customer(supabase, customer_id)
        if user:
            _update_user_plan(supabase, user["id"], "free")
            logger.info(f"Subscription cancelled: user={user['id']}")

    elif event_type == "invoice.payment_failed":
        # Payment failed
        customer_id = data.get("customer")
        user = _find_user_by_customer(supabase, customer_id)
        if user:
            logger.warning(f"Payment failed for user={user['id']}")
            # Don't immediately downgrade - Stripe will retry

    elif event_type == "invoice.paid":
        # Recurring payment succeeded - refresh credits
        customer_id = data.get("customer")
        user = _find_user_by_customer(supabase, customer_id)
        if user and user["plan"] != "free":
            credits = PLAN_CREDITS.get(user["plan"], 50)
            supabase.table("credits").update(
                {"balance": credits}
            ).eq("user_id", user["id"]).execute()
            supabase.table("credit_transactions").insert({
                "user_id": user["id"],
                "amount": credits,
                "type": "renewal",
                "description": f"Monthly {user['plan']} plan renewal",
            }).execute()

    return {"received": True}


@router.post("/nowpayments")
async def nowpayments_webhook(request: Request, settings: Settings = Depends(get_settings)):
    """Handle NOWPayments IPN (crypto payment confirmation)."""
    body = await request.body()
    signature = request.headers.get("x-nowpayments-sig", "")

    if settings.nowpayments_ipn_secret:
        from app.services.crypto_pay import CryptoPayClient
        crypto = CryptoPayClient(settings.nowpayments_api_key, settings.nowpayments_ipn_secret)
        if not crypto.verify_webhook(body, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    data = await request.json()
    payment_status = data.get("payment_status")
    order_id = data.get("order_id", "")

    logger.info(f"NOWPayments webhook: status={payment_status} order={order_id}")

    if payment_status in ("finished", "confirmed"):
        parts = order_id.split("_", 2)
        if len(parts) >= 3:
            prefix = parts[0]
            plan_name = parts[1]
            user_id = parts[2]

            supabase = get_supabase(settings)

            if prefix == "adult":
                # Adult plan: "adult_{plan}_{user_id}"
                _update_adult_plan(supabase, user_id, f"adult_{plan_name}")
                logger.info(f"Crypto adult plan confirmed: user={user_id} plan=adult_{plan_name}")
            elif prefix == "main":
                # Regular plan: "main_{plan}_{user_id}"
                _update_user_plan(supabase, user_id, plan_name)
                logger.info(f"Crypto main plan confirmed: user={user_id} plan={plan_name}")

    return {"ok": True}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CCBill Webhook — Adult Plan Payments
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/ccbill")
async def ccbill_webhook(request: Request, settings: Settings = Depends(get_settings)):
    """Handle CCBill webhook events for adult subscriptions.

    CCBill sends POST with form-encoded data for these events:
    - NewSaleSuccess: New subscription created
    - NewSaleFailure: Payment failed
    - RenewalSuccess: Recurring payment succeeded
    - RenewalFailure: Recurring payment failed
    - Cancellation: Subscription cancelled
    - Chargeback: Dispute filed
    - Refund: Refund issued

    Webhook URL: https://api.egaku-ai.com/api/webhooks/ccbill
    Configure in CCBill Admin → SubAccount → Webhooks
    """
    # CCBill sends form-encoded POST data
    try:
        form = await request.form()
        data = dict(form)
    except Exception:
        body = await request.body()
        data = dict(x.split("=", 1) for x in body.decode().split("&") if "=" in x)

    event_type = data.get("eventType", "")
    transaction_id = data.get("transactionId", data.get("subscription_id", ""))
    user_id = data.get("X-customer_userId", data.get("customer_userId", ""))
    plan = data.get("X-customer_plan", data.get("customer_plan", ""))

    logger.info(f"CCBill webhook: type={event_type} tx={transaction_id} user={user_id} plan={plan}")

    if not user_id:
        logger.warning(f"CCBill webhook missing user_id: {data}")
        return {"ok": True}  # Don't fail — CCBill retries on error

    supabase = get_supabase(settings)

    if event_type in ("NewSaleSuccess", "RenewalSuccess"):
        # Activate or renew adult plan
        if plan and plan.startswith("adult_"):
            _update_adult_plan(supabase, user_id, plan)
            logger.info(f"CCBill adult plan activated: user={user_id} plan={plan} tx={transaction_id}")

            # Store CCBill subscription ID for cancellation management
            try:
                supabase.table("users").update({
                    "ccbill_subscription_id": data.get("subscriptionId", transaction_id),
                }).eq("id", user_id).execute()
            except Exception as e:
                logger.warning(f"Failed to store CCBill subscription ID: {e}")

    elif event_type == "Cancellation":
        # Downgrade to no adult plan
        try:
            supabase.table("users").update({
                "adult_plan": "none",
                "ccbill_subscription_id": None,
            }).eq("id", user_id).execute()
            logger.info(f"CCBill adult plan cancelled: user={user_id}")
        except Exception as e:
            logger.error(f"Failed to cancel adult plan: {e}")

    elif event_type in ("Chargeback", "Refund"):
        # Immediate plan removal on dispute/refund
        try:
            supabase.table("users").update({
                "adult_plan": "none",
                "ccbill_subscription_id": None,
            }).eq("id", user_id).execute()
            logger.warning(f"CCBill chargeback/refund: user={user_id} type={event_type}")
        except Exception as e:
            logger.error(f"Failed to handle chargeback/refund: {e}")

    elif event_type in ("NewSaleFailure", "RenewalFailure"):
        logger.warning(f"CCBill payment failed: user={user_id} type={event_type}")

    return {"ok": True}
