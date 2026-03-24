"""Create Stripe products & prices for Adult Expression plans.

Usage:
  STRIPE_SECRET_KEY=sk_test_xxx python scripts/create_adult_stripe_prices.py

Or set the key in backend/.env and run:
  cd backend && .venv/bin/python scripts/create_adult_stripe_prices.py
"""

import os
import sys

# Try loading from .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import stripe

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
if not stripe.api_key:
    print("ERROR: Set STRIPE_SECRET_KEY environment variable first.")
    print("  export STRIPE_SECRET_KEY=sk_test_xxx")
    sys.exit(1)

print(f"Using Stripe key: {stripe.api_key[:12]}...{stripe.api_key[-4:]}")
print(f"Mode: {'LIVE' if 'live' in stripe.api_key else 'TEST'}\n")

PLANS = [
    {
        "name": "EGAKU Adult Starter",
        "description": "100 generations/month - Basic NSFW models",
        "price_jpy": 980,
        "metadata": {"plan": "adult_starter", "type": "adult", "credits": "100"},
    },
    {
        "name": "EGAKU Adult Creator",
        "description": "500 generations/month - HD models + mosaic control",
        "price_jpy": 2480,
        "metadata": {"plan": "adult_creator", "type": "adult", "credits": "500"},
    },
    {
        "name": "EGAKU Adult Studio",
        "description": "2000 generations/month - Custom LoRA + video",
        "price_jpy": 4980,
        "metadata": {"plan": "adult_studio", "type": "adult", "credits": "2000"},
    },
    {
        "name": "EGAKU Adult Patron",
        "description": "Unlimited generations - Priority GPU + API access",
        "price_jpy": 9800,
        "metadata": {"plan": "adult_patron", "type": "adult", "credits": "999999"},
    },
]

results = []

for plan in PLANS:
    print(f"Creating product: {plan['name']}...")
    product = stripe.Product.create(
        name=plan["name"],
        description=plan["description"],
        metadata=plan["metadata"],
    )
    print(f"  Product ID: {product.id}")

    price = stripe.Price.create(
        product=product.id,
        unit_amount=plan["price_jpy"],  # JPY is zero-decimal
        currency="jpy",
        recurring={"interval": "month"},
        metadata=plan["metadata"],
    )
    print(f"  Price ID: {price.id}")
    print(f"  Amount: JPY {plan['price_jpy']}/month\n")

    results.append({
        "plan_key": plan["metadata"]["plan"],
        "product_id": product.id,
        "price_id": price.id,
    })

print("=" * 60)
print("DONE! Copy these Price IDs to billing.py:\n")
print("ADULT_PLAN_PRICES = {")
for r in results:
    print(f'    "{r["plan_key"]}": "{r["price_id"]}",')
print("}")

print("\n\nProduct/Price mapping:")
for r in results:
    print(f"  {r['plan_key']}: product={r['product_id']} price={r['price_id']}")
