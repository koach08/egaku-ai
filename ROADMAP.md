# EGAKU AI - Commercial Version Implementation Roadmap

## Phase 0: Foundation (DONE)
- [x] Local version AI-diffusion Studio complete
- [x] Image generation (txt2img)
- [x] Video generation (AnimateDiff txt2vid / img2vid)
- [x] AI Assistant (Claude / OpenAI / Grok)
- [x] CivitAI integration (search/DL/upload)
- [x] RunPod Cloud GPU switching
- [x] Legal framework (legal.py: policy, disclaimer, region rules, keyword filter)
- [x] Commercial codebase cloned (ai-studio/)

---

## Phase 1: Scalable Backend (API Server)
**Goal**: Multi-user, auto-scaling, handle thousands of concurrent users

### 1-1. FastAPI Backend (`ai-studio/backend/`)
```
backend/
├── app/
│   ├── main.py              # FastAPI app entry
│   ├── api/
│   │   ├── generate.py      # POST /api/generate/image, /api/generate/video
│   │   ├── auth.py          # Login/register/verify
│   │   ├── credits.py       # Credit balance, purchase, usage
│   │   ├── gallery.py       # User gallery, download, share
│   │   ├── prompt.py        # Prompt generator API
│   │   └── admin.py         # Admin dashboard API
│   ├── core/
│   │   ├── config.py        # Environment config
│   │   ├── security.py      # JWT, rate limiting, IP detection
│   │   ├── legal.py         # Content policy, prompt filter
│   │   └── region.py        # GeoIP, region rules
│   ├── services/
│   │   ├── runpod.py        # RunPod Serverless worker dispatch
│   │   ├── storage.py       # Cloudflare R2 upload/download
│   │   ├── stripe_svc.py    # Stripe payment processing
│   │   ├── moderation.py    # NSFW classifier, content moderation
│   │   └── queue.py         # Job queue (Redis/BullMQ)
│   ├── models/              # SQLAlchemy / Supabase models
│   │   ├── user.py
│   │   ├── generation.py
│   │   ├── credit.py
│   │   └── report.py
│   └── workers/
│       └── gpu_worker.py    # RunPod Serverless handler
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

- [ ] FastAPI project setup
- [ ] Generation API (image + video)
- [ ] RunPod Serverless integration (not Pods - serverless scales automatically)
- [ ] Prompt filter API (legal.py integrated)
- [ ] Result storage (Cloudflare R2)
- [ ] Rate limiting (per user, per plan)
- [ ] Job queue with Redis (handle burst traffic)
- [ ] WebSocket for generation progress updates
- [ ] Health check / monitoring endpoints

### 1-2. Database (Supabase PostgreSQL)
```sql
-- Core tables
users (id, email, display_name, age_verified, region_code, plan, created_at)
credits (user_id, balance, lifetime_used)
credit_transactions (id, user_id, amount, type, description, created_at)
generations (id, user_id, prompt, negative_prompt, model, params_json,
             nsfw_flag, image_url, video_url, credits_used, created_at)
reports (id, reporter_id, generation_id, reason, status, created_at)
```

- [ ] Supabase project setup
- [ ] Schema migration
- [ ] Row Level Security (RLS) policies
- [ ] Indexes for performance (user_id, created_at)

### 1-3. Auth + Region
- [ ] Supabase Auth (Email + Google + Discord + X login)
- [ ] Age verification flow (18+ checkbox + ToS agreement, stored in DB)
- [ ] GeoIP region detection (MaxMind GeoLite2 or Cloudflare headers)
- [ ] Region-based content rules applied server-side
- [ ] JWT tokens with region + age_verified claims

---

## Phase 2: Frontend (Next.js)
**Goal**: Production-quality SaaS web app, mobile-responsive

### 2-1. Project Setup (`ai-studio/frontend/`)
```
frontend/
├── app/
│   ├── (marketing)/        # Landing page, pricing (public)
│   ├── (auth)/              # Login, register, verify-age
│   ├── (dashboard)/         # Protected routes
│   │   ├── generate/        # Image + video generation
│   │   ├── gallery/         # User's generated images
│   │   ├── prompt-builder/  # Prompt generator
│   │   ├── settings/        # Account, billing, preferences
│   │   └── admin/           # Admin panel (owner only)
│   └── api/                 # Next.js API routes (BFF)
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── generation/          # Generation form, preview
│   ├── gallery/             # Image grid, blur overlay
│   └── prompt/              # Tag builder, AI converter
├── lib/
│   ├── api.ts               # Backend API client
│   ├── auth.ts              # Supabase auth helpers
│   └── i18n.ts              # Internationalization
└── messages/
    ├── en.json              # English
    └── ja.json              # Japanese
```

- [ ] Next.js 15 + Tailwind + shadcn/ui
- [ ] i18n (next-intl: English + Japanese, expandable)
- [ ] Landing page (features, pricing, demo images)
- [ ] Auth pages (login, register, age verification)
- [ ] Dashboard layout

### 2-2. Generation UI
- [ ] Image generation page (prompt, model, params, generate button)
- [ ] Video generation page (txt2vid, img2vid)
- [ ] Real-time progress (WebSocket: queued → processing → done)
- [ ] Result display with download button
- [ ] Credit cost shown before generation

### 2-3. NSFW Blur System
- [ ] CSS blur overlay on NSFW images (default ON)
- [ ] Click to reveal (18+ verified users only)
- [ ] User preference: "Always show NSFW" toggle (age verified only)
- [ ] Gallery thumbnails: blurred by default
- [ ] Share links: always blurred for non-verified viewers
- [ ] Server-side: NSFW flag set during generation (AI classifier or user tag)

### 2-4. Gallery
- [ ] Grid view of all generated images/videos
- [ ] Filter: SFW / NSFW / All
- [ ] Download (original resolution)
- [ ] Share link (with blur for NSFW)
- [ ] Delete
- [ ] Batch operations

---

## Phase 3: Payment + Credits
**Goal**: Revenue from day 1

### 3-1. Stripe Integration
- [ ] Stripe account setup
- [ ] Products + Prices (4 plans)
- [ ] Checkout Session for subscriptions
- [ ] Customer Portal (manage subscription)
- [ ] Webhooks: checkout.session.completed → add credits
- [ ] Webhooks: invoice.payment_failed → suspend account
- [ ] One-time credit pack purchases
- [ ] Multi-currency support (JPY default, auto-convert for international)

### 3-2. Credit System
| Action | Credits |
|--------|---------|
| Image (SD1.5, 512x) | 1 |
| Image (SDXL, 1024x) | 2 |
| Video (16 frames) | 5 |
| Video (32 frames) | 10 |
| Prompt Generator | 0 (free) |
| Upscale | 1 |

### 3-3. Plans
| Plan | Price | Credits/mo | NSFW | Video | Priority |
|------|-------|-----------|------|-------|----------|
| Free | 0 | 50 | No | No | Low |
| Basic | 980 JPY/mo (~$6.50) | 500 | Yes | Yes | Normal |
| Pro | 2,980 JPY/mo (~$20) | 2,000 | Yes | Yes | High |
| Unlimited | 5,980 JPY/mo (~$40) | Unlimited | Yes | Yes | Highest |

---

## Phase 4: Prompt Generator
**Goal**: Killer feature, differentiator

### 4-1. Tag Builder (no API, instant)
- [ ] Tag database by category (JSON):
  - Quality, Subject, Style, Lighting, Composition
  - Hair, Clothing, Expression, Background, Action
  - NSFW categories (18+ only)
- [ ] Click-to-select tag builder UI
- [ ] Live preview of generated prompt
- [ ] Save/load prompt presets
- [ ] Copy to generation page with one click

### 4-2. AI Prompt Conversion
- [ ] Japanese/Chinese/Korean → optimized English prompt (Claude Haiku - cheap)
- [ ] Prompt enhancement (short → detailed)
- [ ] Random inspiration generator (genre-based)
- [ ] Auto negative prompt generation
- [ ] Model-specific optimization (SD1.5 vs SDXL prompt differences)

---

## Phase 5: Safety & Moderation (Scale-Ready)
**Goal**: Handle abuse at 10,000+ users

- [ ] NSFW classifier (open-source: LAION safety classifier)
- [ ] Multi-language prohibited keyword filter (EN/JA/ZH/KO/RU/ES)
- [ ] Server-side prompt scanning (before GPU dispatch)
- [ ] Auto-mosaic API for JP users (OpenCV-based genital detection + mosaic)
- [ ] User report system (flag → admin queue)
- [ ] Admin dashboard:
  - Flagged content review
  - User management (warn / suspend / ban)
  - Generation log audit
  - Usage statistics
- [ ] DMCA takedown workflow
- [ ] Automated suspicious pattern detection (e.g., repeated policy violations)
- [ ] IP-based abuse detection (multiple accounts, VPN bypass attempts)

---

## Phase 6: Scalability Architecture
**Goal**: Handle 1,000 → 10,000 → 100,000 users without rewriting

### Auto-Scaling Stack
```
                     Cloudflare CDN (cache + DDoS protection)
                            |
                     Vercel (Frontend, auto-scales)
                            |
                     Railway (Backend API, horizontal scale)
                            |
              ┌─────────────┼─────────────┐
              |             |             |
         Redis Queue   Supabase DB   Cloudflare R2
              |                        (images)
              |
     RunPod Serverless GPU
     (auto-scales 0→N workers)
     - Pay per second
     - No idle cost
     - Scales to hundreds of GPUs
```

### Why RunPod Serverless (not Pods)
| | Pods (current local ver) | Serverless (commercial) |
|---|---|---|
| Billing | Per hour (even idle) | Per second (only when running) |
| Scaling | Manual | Auto (0→N) |
| Cold start | None | ~10-30 sec (first request) |
| Cost at 100 users | ~$200/mo | ~$50/mo |
| Cost at 10,000 users | Unmanageable | ~$2,000/mo (scales linearly) |

- [ ] RunPod Serverless endpoint setup
- [ ] Custom Docker image (ComfyUI + models pre-loaded)
- [ ] Worker handler (receive prompt → generate → upload to R2 → return URL)
- [ ] Model caching on workers (avoid re-download)
- [ ] Queue priority (Unlimited > Pro > Basic > Free)
- [ ] Concurrency limits per plan

### Database Scaling
- [ ] Supabase Pro plan when >10,000 users ($25/mo)
- [ ] Connection pooling (PgBouncer, built into Supabase)
- [ ] Read replicas if needed (Supabase handles)
- [ ] Generation logs: archive old records to cold storage

### CDN / Storage
- [ ] Cloudflare R2: auto-scales, no egress fees
- [ ] Image optimization (WebP thumbnails, lazy loading)
- [ ] Expiring signed URLs for NSFW content
- [ ] Cleanup: delete unaccessed images after 90 days (Free plan)

---

## Phase 7: Launch & Marketing
**Goal**: Rapid user acquisition, worldwide

### 7-1. Pre-Launch
- [ ] Domain purchase (short, memorable, .ai or .app)
- [ ] Landing page with email waitlist
- [ ] Create social accounts (X, Reddit, Discord)
- [ ] Generate showcase images/videos with the platform
- [ ] Beta test with 10-20 users (Discord community)

### 7-2. Launch Day
- [ ] Product Hunt launch
- [ ] Reddit posts:
  - r/StableDiffusion (950K members)
  - r/aiArt (200K)
  - r/comfyui (50K)
  - r/NSFW_AI (specific subs, large audience)
  - r/SideProject
  - r/startups
- [ ] Hacker News "Show HN"
- [ ] X/Twitter announcement thread
- [ ] Discord server open

### 7-3. Ongoing Marketing (Free)
| Channel | Action | Frequency |
|---------|--------|-----------|
| Reddit | Share AI art + link to platform | 3x/week |
| X/Twitter | Post generated images, tips | Daily |
| CivitAI | Upload art with watermark/link | 3x/week |
| YouTube | Tutorials "How to generate..." | 2x/month |
| TikTok | Short generation demos | 3x/week |
| Pixiv | Japanese audience art posts | Weekly |
| note.com | Japanese tutorials/articles | 2x/month |
| Discord | Community building, support | Daily |
| Dev.to / Zenn | Technical articles about the stack | Monthly |

### 7-4. Paid Marketing (if ROI positive)
| Channel | Budget | Expected CPA |
|---------|--------|-------------|
| Reddit Ads (AI subs) | $5-10/day | $2-5/user |
| X/Twitter Ads | $5-10/day | $3-8/user |
| Google Ads ("AI image generator") | $10-20/day | $5-15/user |

### 7-5. Growth Hacks
- [ ] Referral program: invite a friend → both get 50 free credits
- [ ] Free tier as funnel (50 credits/mo → taste it → upgrade)
- [ ] "Made with EGAKU AI" watermark on free tier (free advertising)
- [ ] Community gallery (public showcase, SEO juice)
- [ ] Prompt sharing (users share prompts → attract new users via search)
- [ ] Affiliate program (creators earn 20% recurring for referrals)

---

## Initial Investment Estimate

### One-Time Costs
| Item | Cost | Notes |
|------|------|-------|
| Domain (.ai or .app) | $15-50/year | |
| Stripe setup | $0 | Free to setup, 3.6% per transaction |
| Supabase | $0 | Free tier to start |
| RunPod credits | $25 | Initial testing |
| Logo / branding | $0-50 | Canva or AI-generated |
| **Total** | **~$40-125** | |

### Monthly Costs (at launch, ~0-50 users)
| Service | Cost | Notes |
|---------|------|-------|
| Vercel | $0 | Free tier (100GB bandwidth) |
| Railway | $5 | Starter plan |
| Supabase | $0 | Free tier (50K rows, 500MB) |
| Cloudflare R2 | $0 | Free tier (10GB) |
| RunPod Serverless | $10-30 | Pay per use only |
| Claude API (Prompt Gen) | $5-10 | Haiku is cheap |
| MaxMind GeoIP | $0 | GeoLite2 free tier |
| **Total** | **~$20-45/mo** | |

### Monthly Costs (at 1,000 users)
| Service | Cost |
|---------|------|
| Vercel | $20 |
| Railway | $20 |
| Supabase Pro | $25 |
| Cloudflare R2 | $5 |
| RunPod Serverless | $200-400 |
| Claude API | $30 |
| **Total** | **~$300-500/mo** |
| **Revenue** (avg $10/user) | **~$10,000/mo** |
| **Profit** | **~$9,500-9,700/mo** |

### Break-Even
- Fixed costs: ~$20-45/mo
- Variable cost per generation: ~$0.002
- Revenue per Basic user: ~$6.50/mo
- **Break-even: 4-7 paying users**

---

## Priority Order (Implementation Sequence)

```
Week 1-2:  Phase 1 (Backend API + DB + Auth)
Week 3-4:  Phase 2 (Frontend MVP: generate + gallery)
Week 5:    Phase 3 (Stripe + Credits)
Week 6:    Phase 5 (Basic safety: prompt filter + NSFW blur)
Week 7:    Phase 6 (Deploy: Vercel + Railway + RunPod Serverless)
Week 8:    Phase 7 (Launch: Product Hunt + Reddit + X)
Week 9+:   Phase 4 (Prompt Generator) + iterate based on feedback
```

MVP launch in ~7 weeks. Prompt Generator is a post-launch feature (adds value, drives upgrades).

---

## Tech Stack Summary

| Layer | Technology | Scaling |
|-------|-----------|---------|
| Frontend | Next.js 15 + Tailwind + shadcn/ui | Vercel auto-scale |
| Backend API | Python FastAPI | Railway horizontal scale |
| Auth | Supabase Auth | Managed |
| Database | Supabase PostgreSQL | Managed + read replicas |
| GPU Inference | RunPod Serverless | Auto-scale 0→N |
| Job Queue | Redis (Upstash) | Serverless |
| Image Storage | Cloudflare R2 | Unlimited |
| Payment | Stripe | Managed |
| CDN | Cloudflare | Global |
| GeoIP | MaxMind GeoLite2 | Embedded |
| i18n | next-intl | EN/JA + expandable |
| Monitoring | Sentry + Vercel Analytics | Managed |
| Email | Resend | Transactional |
