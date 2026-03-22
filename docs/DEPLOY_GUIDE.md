# EGAKU AI — Self-Hosted Deployment Guide

## Prerequisites

- Node.js 20+
- Python 3.11+
- Accounts: [Supabase](https://supabase.com), [Vercel](https://vercel.com), [Railway](https://railway.app) (or any Python hosting), [fal.ai](https://fal.ai), [Stripe](https://stripe.com)

## 1. Supabase Setup (Database + Auth)

1. Create a new Supabase project
2. Go to **SQL Editor** and run `backend/supabase_schema.sql`
3. Run all files in `backend/migrations/` in order
4. Go to **Authentication** > **Providers** and enable:
   - Email (disable "Confirm email" for faster testing)
   - Google, Discord, GitHub (optional)
5. Copy your **Project URL** and **Anon Key** from Settings > API

## 2. fal.ai Setup (GPU Backend)

1. Sign up at [fal.ai](https://fal.ai)
2. Go to Dashboard > API Keys and create a key
3. Add credits to your account (pay-as-you-go)

## 3. Stripe Setup (Payments)

1. Create subscription products for each plan (Lite, Basic, Pro, Unlimited, Studio)
2. Create a one-time product for the Local License
3. Copy each Price ID
4. Set up a webhook pointing to `https://your-backend-url/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Copy the Webhook Secret

## 4. Backend Deployment (Railway)

1. Create a new Railway project, deploy from GitHub or `railway up`
2. Set environment variables:

```
MODE=cloud
APP_NAME=Your App Name
CORS_ORIGINS=["https://your-frontend-domain.com"]

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# fal.ai
FAL_API_KEY=your-fal-key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_LITE=price_xxxxx
STRIPE_PRICE_BASIC=price_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_UNLIMITED=price_xxxxx
STRIPE_PRICE_STUDIO=price_xxxxx
STRIPE_PRICE_LOCAL_LICENSE=price_xxxxx

# Optional
REPLICATE_API_TOKEN=your-replicate-token
REDIS_URL=redis://xxxxx
OPENAI_API_KEY=your-openai-key
CIVITAI_API_KEY=your-civitai-key
```

3. The backend runs on `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## 5. Frontend Deployment (Vercel)

1. Push the `frontend/` directory to a GitHub repo (or deploy with `vercel --prod`)
2. Set environment variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-backend-url/api
```

3. Set the Root Directory to `frontend/` in Vercel project settings

## 6. Verify

1. Visit your frontend URL
2. Register an account
3. Try generating an image (free tier = 50 credits)
4. Test a paid plan checkout flow

## Adding New Models

To add a new fal.ai model:

1. Edit `backend/app/services/fal_ai.py`
2. Add an entry to `MODELS` (image) or `VIDEO_MODELS` (video):
```python
"your_model_id": {
    "fal_id": "fal-ai/model-name",
    "name": "Display Name",
    "category": "category",
    "description": "Description",
    "min_plan": "free",  # or lite, basic, pro
    "credits": 3,
},
```
3. Add the model to `MODEL_MIN_PLAN` in `backend/app/api/generate.py`
4. Add the model to the frontend MODELS array in `frontend/src/app/[locale]/(dashboard)/generate/page.tsx`
5. Redeploy both backend and frontend

## Architecture

```
User → Vercel (Next.js) → Railway (FastAPI) → fal.ai (GPU)
                ↓                    ↓
           Supabase Auth      Supabase DB + Stripe
```

## Support

This is sold as-is. No support is included with the standard license.
