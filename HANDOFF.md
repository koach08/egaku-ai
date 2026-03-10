# EGAKU AI - Commercial Version Handoff

## Overview
AI画像・動画生成SaaSプラットフォーム。世界市場向け、NSFW対応、クレジット課金制。
ローカル版（AI-diffusion）をベースに、FastAPI + Next.js のマルチユーザーSaaSに発展させる。

---

## Current State (Phase 0 Complete)

### Files in ai-studio/
```
ai-studio/
├── app/                          # Gradio版ベースコード（参考用）
│   ├── main.py                   # 商用版UI（Legal tab追加済み）
│   ├── config.py                 # 設定管理
│   ├── comfyui_api.py            # ComfyUI API（txt2img, animatediff, img2vid）
│   ├── runpod_manager.py         # RunPod管理（Pods版、Serverlessに移行予定）
│   ├── civitai_api.py            # CivitAI連携
│   ├── ai_assistant.py           # AI Assistant（Claude/OpenAI/Grok）
│   ├── guide.py                  # ガイド・テンプレート
│   ├── legal.py                  # *** 法的フレームワーク ***
│   │                               - Content Policy (EN/JA)
│   │                               - Terms of Service (EN/JA)
│   │                               - Self-Hosted Warning (EN/JA)
│   │                               - Regional Guidelines (EN/JA)
│   │                               - Region Rules (JP: mosaic, US/UK/DE: self-responsibility)
│   │                               - Prohibited keyword filter
│   │                               - Prompt compliance checker
│   └── settings.json             # 空テンプレート（APIキーなし）
├── ROADMAP.md                    # *** 全実装計画 ***
├── launch.command
├── launch_studio.command
└── launch_comfyui.command
```

### What's Already Implemented
- Prompt compliance checker (check_prompt_compliance in legal.py)
- CSAM/minor-related keyword filter (EN/JA)
- Region rules config (JP=mosaic, KR=mosaic, US/UK/DE/AU=self-responsibility)
- Content policy, ToS, disclaimer in bilingual (EN/JA)
- Regional guidelines with per-country rules table
- Adult tab: 18+ warning (EN/JA)
- Generate functions: prompt filter integrated (blocks prohibited content)
- Legal tab in UI: 4 sub-tabs (Disclaimer, Policy, ToS, Regional)

### What Needs To Be Built (see ROADMAP.md for full detail)

**Phase 1 (Week 1-2): Backend**
- FastAPI project in `ai-studio/backend/`
- Supabase DB (users, credits, generations, reports)
- Supabase Auth (Email + Google + Discord)
- RunPod Serverless GPU worker
- Redis job queue
- GeoIP region detection

**Phase 2 (Week 3-4): Frontend**
- Next.js 15 + Tailwind + shadcn/ui in `ai-studio/frontend/`
- i18n (EN/JA)
- Generation UI with real-time progress (WebSocket)
- NSFW blur system (CivitAI-style)
- User gallery

**Phase 3 (Week 5): Payment**
- Stripe subscriptions (Free/Basic/Pro/Unlimited)
- Credit system (1 credit = 1 image)
- Plans: Free(0)/Basic(980JPY)/Pro(2980JPY)/Unlimited(5980JPY)

**Phase 4 (Post-launch): Prompt Generator**
- Tag builder (click-to-select, no API)
- AI prompt conversion (JP→EN, enhancement)

**Phase 5 (Week 6): Safety**
- NSFW classifier
- Multi-language filter
- Auto-mosaic for JP users
- Admin dashboard
- Report system

**Phase 6-7 (Week 7-8): Deploy + Launch**
- Vercel (FE) + Railway (BE) + RunPod Serverless (GPU)
- Cloudflare R2 (storage) + Supabase (DB)
- Product Hunt, Reddit, X launch

---

## Architecture (Target)

```
User → Cloudflare CDN → Vercel (Next.js Frontend)
                              ↓
                         Railway (FastAPI Backend)
                              ↓
              ┌───────────────┼───────────────┐
              |               |               |
         Redis Queue    Supabase DB    Cloudflare R2
         (Upstash)      (PostgreSQL)   (Image/Video)
              |
              ↓
       RunPod Serverless
       (ComfyUI GPU Workers)
       Auto-scales 0 → N
```

---

## Key Business Decisions Made

### Pricing (JPY-based, cheaper than competitors)
- Competitors: $10-12/mo = 1500-1800 JPY
- EGAKU AI: 980 JPY/mo (~$6.50) = ~40% cheaper
- Break-even: 4-7 paying users

### Content Policy
- NSFW allowed for fictional 18+ characters
- CSAM/minors: zero tolerance, reported to authorities
- Non-consensual deepfakes: prohibited
- Region-based rules:
  - Japan/Korea: genital mosaic required (auto-applied)
  - Others: self-responsibility with warning
- NSFW blur by default, toggle for verified 18+ users

### Scaling Strategy
- RunPod Serverless (not Pods) for auto-scaling GPU
- All infrastructure auto-scales or managed
- No architecture changes needed from 100 → 100,000 users

### Marketing (mostly free)
- Reddit (r/StableDiffusion, r/aiArt, r/comfyui, NSFW subs)
- Product Hunt launch
- X/Twitter, YouTube, TikTok
- Referral program (invite → 50 credits each)
- Free tier watermark = free advertising

---

## Related Project

Local personal version:
```
~/Desktop/アプリ開発プロジェクト/AI-diffusion/
```
See `AI-diffusion/HANDOFF.md` for local version details.
The commercial version was cloned from this and will diverge as it becomes a SaaS.

---

## Environment Info

- Mac: M3 Pro, 18GB RAM
- Python: 3.12 (3.14 is incompatible with some deps)
- Node.js: use latest LTS for Next.js
- Package manager: npm or bun for frontend

---

## Next Action

Start Phase 1: Create `ai-studio/backend/` with FastAPI project structure.
Follow the directory layout in ROADMAP.md Phase 1-1.
