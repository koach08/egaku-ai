# EGAKU AI

**AI画像・動画生成SaaSプラットフォーム / AI Image & Video Generation SaaS Platform**

Website: [https://egaku-ai.com](https://egaku-ai.com)

---

## 概要 / Overview

EGAKU AI（描くAI）は、ブラウザベースのAI画像・動画生成プラットフォームです。Flux.1、SDXL、Stable Diffusion 3.5など15以上のAIモデルを搭載し、テキストから高品質な画像・動画を生成できます。

EGAKU AI is a browser-based AI image and video generation platform. It supports 15+ AI models including Flux.1, SDXL, and Stable Diffusion 3.5, enabling high-quality image and video generation from text prompts.

---

## 主な機能 / Features

- **テキストから画像生成 / Text-to-Image** - Flux.1 Dev/Schnell, SDXL, SD 3.5, RealVisXL, Recraft V3, anime models
- **画像から画像 / Image-to-Image** - Style transfer, transformation
- **動画生成 / Video Generation** - Text-to-video, image-to-video (AnimateDiff, LTX)
- **アップスケーリング / Upscaling** - 4x super-resolution (Real-ESRGAN)
- **背景除去 / Background Removal** - AI-powered background removal
- **コミュニティギャラリー / Community Gallery** - Share, like, follow system
- **CivitAIモデルブラウザ / CivitAI Model Browser** - Browse and use community models with LoRA support
- **クレジット課金 / Credit-based Pricing** - Free tier with 50 credits/month
- **多言語対応 / i18n** - English + Japanese

---

## 技術スタック / Tech Stack

| レイヤー / Layer | 技術 / Technology | 役割 / Role |
|---|---|---|
| Frontend | Next.js 16 + Tailwind CSS + shadcn/ui | SPA with i18n (next-intl) |
| Backend | Python FastAPI | REST API server |
| Auth & DB | Supabase (PostgreSQL + Auth) | Authentication, database, RLS |
| GPU | RunPod Serverless / Replicate / fal.ai | AI model inference |
| Storage | Cloudflare R2 | Image/video storage |
| Payment | Stripe | Subscription & credit billing |
| CDN | Cloudflare | Global CDN + DDoS protection |
| Domain | egaku-ai.com (Cloudflare) | Custom domain |
| Deploy | Vercel (Frontend) + Railway (Backend) | Auto-scaling hosting |

---

## アーキテクチャ / Architecture

```
User --> Cloudflare CDN --> Vercel (Next.js Frontend)
                                  |
                           Railway (FastAPI Backend)
                                  |
                +-----------------+-----------------+
                |                 |                 |
          GPU Backends      Supabase DB      Cloudflare R2
       (RunPod/Replicate    (PostgreSQL)     (Image/Video)
        /fal.ai)
```

---

## セットアップ / Setup

### 前提条件 / Prerequisites

- Node.js 20+ (LTS)
- Python 3.12+
- Supabase account
- Stripe account (for payments)
- GPU backend account (RunPod / Replicate / fal.ai)

### 1. リポジトリをクローン / Clone

```bash
git clone https://github.com/koach08/egaku-ai.git
cd egaku-ai
```

### 2. フロントエンド / Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

### 3. バックエンド / Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn app.main:app --reload --port 8001
```

Backend runs at `http://localhost:8001`
API docs at `http://localhost:8001/api/docs`

### 4. データベース / Database

Run `SUPABASE_SCHEMA.sql` in the Supabase SQL Editor to create the required tables and RLS policies.

---

## 環境変数 / Environment Variables

See `.env.example` files in `frontend/` and `backend/` directories for required variables.

### Frontend (`frontend/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_API_URL` | Backend API URL |

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `RUNPOD_API_KEY` | RunPod API key |
| `REPLICATE_API_TOKEN` | Replicate API token |
| `FAL_API_KEY` | fal.ai API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `R2_*` | Cloudflare R2 credentials |
| `REDIS_URL` | Redis URL (optional) |

---

## プロジェクト構成 / Project Structure

```
egaku-ai/
├── frontend/                # Next.js 16 frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   └── [locale]/    # i18n routes (en/ja)
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities, API client, auth
│   │   ├── i18n/            # Internationalization config
│   │   └── messages/        # Translation files (en.json, ja.json)
│   └── package.json
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/             # API endpoints
│   │   ├── core/            # Config, security, legal
│   │   ├── services/        # RunPod, storage, queue, etc.
│   │   ├── models/          # Pydantic schemas
│   │   └── workers/         # GPU worker handlers
│   ├── requirements.txt
│   └── Dockerfile
├── app/                     # Gradio prototype (reference)
├── SUPABASE_SCHEMA.sql      # Database schema
├── HANDOFF.md               # Project handoff document
├── ROADMAP.md               # Full implementation roadmap
└── README.md
```

---

## ライセンス / License

MIT License

Copyright (c) 2026 EGAKU AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
