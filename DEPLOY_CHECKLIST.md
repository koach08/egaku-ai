# EGAKU AI - Deployment Checklist

## 1. Supabase (Database)

Run this SQL in Supabase SQL Editor to create the `user_models` table:

```sql
-- File: backend/migrations/001_user_models.sql
-- Copy and paste the contents of that file into Supabase SQL Editor
```

## 2. Railway (Backend)

Set these environment variables in Railway dashboard:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | YES | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | YES | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | YES | Supabase service role key |
| `FAL_API_KEY` | YES | Get from https://fal.ai/dashboard/keys |
| `REPLICATE_API_TOKEN` | YES | Get from https://replicate.com/account/api-tokens |
| `CORS_ORIGINS` | YES | `["https://egaku-ai.com"]` |
| `CIVITAI_API_KEY` | Optional | For gated CivitAI model downloads |
| `STRIPE_SECRET_KEY` | Later | For payments |
| `STRIPE_WEBHOOK_SECRET` | Later | For Stripe webhooks |
| `REDIS_URL` | Optional | For job queue (not required - has in-memory fallback) |

**Critical:** Without `FAL_API_KEY`, no image generation will work with fal.ai models (the instant ones).
Without `REPLICATE_API_TOKEN`, Replicate models won't work.

## 3. Vercel (Frontend)

Set these environment variables in Vercel dashboard:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RAILWAY-APP.railway.app/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

**Critical:** `NEXT_PUBLIC_API_URL` must point to your Railway backend URL, NOT localhost.

## 4. API Keys to Get

### fal.ai (Primary GPU backend - instant results)
1. Go to https://fal.ai
2. Sign up / Sign in
3. Go to Dashboard > Keys
4. Create a new key
5. Add to Railway as `FAL_API_KEY`
- Free tier: ~$10 worth of credits to start
- Pay-as-you-go after that

### Replicate (Secondary GPU backend - async)
1. Go to https://replicate.com
2. Sign up / Sign in
3. Go to Account > API Tokens
4. Copy token
5. Add to Railway as `REPLICATE_API_TOKEN`
- Pay-per-use, typically $0.001-$0.05 per generation

### CivitAI (Optional - for gated model downloads)
1. Go to https://civitai.com
2. Sign up / Sign in
3. Go to Account Settings > API Keys
4. Create a new key
5. Add to Railway as `CIVITAI_API_KEY`
- Most models work without a key
- Only needed for early access / gated models

## 5. Feature Status

| Feature | Status | Backend |
|---------|--------|---------|
| Text-to-Image (15+ models) | Working | fal.ai (instant) / Replicate (async) |
| Image-to-Image | Working | Replicate |
| Style Transfer | Working | Replicate |
| Text-to-Video | Working | fal.ai LTX 2.3 (NSFW OK) / Replicate Wan 2.5 |
| Image-to-Video | Working | fal.ai / Replicate |
| Upscale | Working | Replicate (Real-ESRGAN) |
| Inpaint | Working | Replicate (SDXL) |
| Background Removal | Working | Replicate (rembg) |
| CivitAI Model Browser | Working | CivitAI API + fal.ai LoRA |
| CivitAI LoRA Generation | Working | fal.ai flux-lora / lora |
| NSFW Generation | Working | fal.ai (no safety checker) |
| Gallery | Working | Supabase |
| User Profiles | Working | Supabase |
| Follow System | Working | Supabase |
