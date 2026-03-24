"""NOWPayments crypto payment integration for adult subscriptions.

Supports 150+ cryptocurrencies. No content restrictions.
https://nowpayments.io/

Flow:
1. User clicks "Pay with Crypto" → create invoice via NOWPayments API
2. User pays in their chosen cryptocurrency
3. NOWPayments sends webhook → we activate the plan
"""

import hashlib
import hmac
import json
import logging
from typing import Literal

import httpx

logger = logging.getLogger(__name__)

NOWPAYMENTS_API = "https://api.nowpayments.io/v1"

# Adult plan prices in USD (NOWPayments converts to crypto)
ADULT_PLAN_USD = {
    "adult_starter": 6.50,    # ~¥980
    "adult_creator": 16.50,   # ~¥2,480
    "adult_studio": 33.00,    # ~¥4,980
    "adult_patron": 65.00,    # ~¥9,800
}

# Plan duration in days
PLAN_DURATION_DAYS = 30


class CryptoPayClient:
    def __init__(self, api_key: str, ipn_secret: str = ""):
        self.api_key = api_key
        self.ipn_secret = ipn_secret
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
        }

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def get_available_currencies(self) -> list[str]:
        """Get list of available cryptocurrencies."""
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{NOWPAYMENTS_API}/currencies",
                headers=self.headers,
            )
            r.raise_for_status()
            return r.json().get("currencies", [])

    async def get_min_amount(self, currency: str = "btc") -> float:
        """Get minimum payment amount for a currency."""
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{NOWPAYMENTS_API}/min-amount",
                headers=self.headers,
                params={"currency_from": "usd", "currency_to": currency},
            )
            r.raise_for_status()
            return r.json().get("min_amount", 0)

    async def create_invoice(
        self,
        plan: str,
        user_id: str,
        success_url: str = "",
        cancel_url: str = "",
    ) -> dict:
        """Create a payment invoice for an adult plan.

        Returns dict with invoice_url (redirect user here to pay).
        """
        price_usd = ADULT_PLAN_USD.get(plan)
        if not price_usd:
            raise ValueError(f"Unknown plan: {plan}")

        data = {
            "price_amount": price_usd,
            "price_currency": "usd",
            "order_id": f"adult_{plan}_{user_id}",
            "order_description": f"EGAKU AI Adult {plan.replace('adult_', '').title()} Plan (30 days)",
            "success_url": success_url or "https://egaku-ai.com/adult?crypto=success",
            "cancel_url": cancel_url or "https://egaku-ai.com/adult?crypto=cancel",
        }

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"{NOWPAYMENTS_API}/invoice",
                json=data,
                headers=self.headers,
            )
            r.raise_for_status()
            result = r.json()

            logger.info(
                "Crypto invoice created: id=%s plan=%s amount=$%s",
                result.get("id"),
                plan,
                price_usd,
            )

            return {
                "invoice_id": result.get("id"),
                "invoice_url": result.get("invoice_url"),
                "price_usd": price_usd,
                "plan": plan,
                "order_id": data["order_id"],
            }

    async def get_payment_status(self, payment_id: str) -> dict:
        """Check payment status."""
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{NOWPAYMENTS_API}/payment/{payment_id}",
                headers=self.headers,
            )
            r.raise_for_status()
            return r.json()

    def verify_webhook(self, body: bytes, signature: str) -> bool:
        """Verify NOWPayments IPN webhook signature."""
        if not self.ipn_secret:
            return True  # No secret configured, skip verification

        # NOWPayments uses HMAC-SHA512
        sorted_body = json.dumps(
            json.loads(body), sort_keys=True, separators=(",", ":")
        )
        expected = hmac.new(
            self.ipn_secret.encode(),
            sorted_body.encode(),
            hashlib.sha512,
        ).hexdigest()

        return hmac.compare_digest(expected, signature)
