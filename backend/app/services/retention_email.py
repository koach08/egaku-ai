"""Retention email — nudge inactive users back to EGAKU AI."""

import logging
from datetime import datetime, timedelta, timezone

import httpx

logger = logging.getLogger(__name__)

# Email templates (plain text fallback + HTML)
TEMPLATES = {
    "inactive_7d": {
        "subject": "We miss you on EGAKU AI — new models are waiting",
        "html": """
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #e2e8f0; background: #0f0f23;">
  <h1 style="font-size: 24px; margin-bottom: 8px; color: #fff;">Hey, it's been a while</h1>
  <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
    We've added new AI models since your last visit:
  </p>
  <ul style="font-size: 14px; color: #c4b5fd; line-height: 2; padding-left: 20px;">
    <li><strong>Veo 3</strong> — video with native audio (Google)</li>
    <li><strong>Grok Imagine</strong> — xAI's image + video model</li>
    <li><strong>Kling 3.0</strong> — native 4K cinematic video</li>
    <li><strong>30+ models</strong> total now</li>
  </ul>
  <p style="font-size: 14px; color: #94a3b8;">
    Your account still has credits waiting. Come create something.
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://egaku-ai.com/generate" style="background: #fff; color: #000; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
      Start Creating
    </a>
  </div>
  <p style="font-size: 11px; color: #475569; text-align: center;">
    EGAKU AI · egaku-ai.com<br>
    <a href="https://egaku-ai.com/settings" style="color: #475569;">Unsubscribe</a>
  </p>
</div>
""",
    },
    "new_model": {
        "subject": "New on EGAKU AI: {model_name} is now available",
        "html": """
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #e2e8f0; background: #0f0f23;">
  <h1 style="font-size: 24px; margin-bottom: 8px; color: #fff;">New Model: {model_name}</h1>
  <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
    {model_description}
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://egaku-ai.com/generate" style="background: #fff; color: #000; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
      Try {model_name} Now
    </a>
  </div>
  <p style="font-size: 11px; color: #475569; text-align: center;">
    EGAKU AI · egaku-ai.com<br>
    <a href="https://egaku-ai.com/settings" style="color: #475569;">Unsubscribe</a>
  </p>
</div>
""",
    },
}


async def send_retention_emails(
    supabase_url: str,
    supabase_key: str,
    resend_api_key: str,
    from_email: str = "EGAKU AI <noreply@language-smartlearning.com>",
    days_inactive: int = 7,
    dry_run: bool = False,
) -> dict:
    """Find users inactive for N days and send retention email.

    Returns {"sent": N, "skipped": N, "errors": N}
    """
    sb_headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}

    # Get users who haven't generated anything in N days
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days_inactive)).strftime("%Y-%m-%dT%H:%M:%S%z")

    # Get all users with email
    r = httpx.get(
        f"{supabase_url}/rest/v1/users?select=id,email,created_at",
        headers=sb_headers, timeout=30,
    )
    all_users = r.json() if isinstance(r.json(), list) else []

    # Get users who generated recently (after cutoff)
    r2 = httpx.get(
        f"{supabase_url}/rest/v1/generations?select=user_id&created_at=gte.{cutoff}&limit=1000",
        headers=sb_headers, timeout=30,
    )
    gen_data = r2.json() if isinstance(r2.json(), list) else []
    active_user_ids = {g["user_id"] for g in gen_data if isinstance(g, dict) and g.get("user_id")}

    # Inactive = registered but no recent generation
    inactive = [
        u for u in all_users
        if u["id"] not in active_user_ids
        and u.get("email")
        and "@" in u["email"]
        and u.get("created_at", "") < cutoff  # Don't email brand new users
    ]

    # Skip disposable emails
    disposable = ["spymail", "snapbx", "mailtowin", "maximail", "10mail", "emlhub", "mail2me"]
    inactive = [
        u for u in inactive
        if not any(d in u["email"].split("@")[-1].lower() for d in disposable)
    ]

    logger.info(f"Retention: {len(inactive)} inactive users (>{days_inactive}d), {len(active_user_ids)} active")

    sent = skipped = errors = 0
    template = TEMPLATES["inactive_7d"]

    for user in inactive:
        email = user["email"]

        if dry_run:
            logger.info(f"  [DRY RUN] Would email: {email}")
            skipped += 1
            continue

        try:
            r = httpx.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": from_email,
                    "to": [email],
                    "subject": template["subject"],
                    "html": template["html"],
                },
                timeout=10,
            )
            if r.status_code in (200, 201):
                sent += 1
                logger.info(f"  Sent to {email}")
            else:
                errors += 1
                logger.warning(f"  Failed {email}: {r.status_code} {r.text[:100]}")
        except Exception as e:
            errors += 1
            logger.warning(f"  Error {email}: {e}")

    return {"sent": sent, "skipped": skipped, "errors": errors, "total_inactive": len(inactive)}
