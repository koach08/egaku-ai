# EGAKU AI β公開ガイド

3つを同時に進める。上から順にやればOK。

---

## 1. Discord コミュニティサーバー作成（10分）

### Step 1: サーバー作成
1. Discord を開く → 左の「＋」→「自分で作成」→「コミュニティ向け」
2. サーバー名: `EGAKU AI`
3. アイコン: サイトのロゴ or AI生成画像

### Step 2: チャンネル作成

以下のチャンネルを作る（カテゴリ → チャンネルの順）:

**カテゴリ: INFO**
```
#welcome-rules     （読み取り専用）
#announcements     （読み取り専用）
```

**カテゴリ: GENERAL**
```
#general
#showcase          （作品共有）
#prompt-tips
#日本語
```

**カテゴリ: SUPPORT**
```
#bug-reports
#feature-requests
```

**カテゴリ: NSFW（年齢制限付き）**
```
#nsfw-showcase     （NSFWチャンネルとしてマーク）
```

### Step 3: #welcome-rules にメッセージを投稿

以下をコピペ：

```
Welcome to EGAKU AI! 🎨

EGAKU AI is a browser-based AI image & video generation platform.

Rules:
1. Be respectful to everyone
2. No real person deepfakes
3. NSFW content only in designated channels
4. No CSAM - zero tolerance, instant ban
5. Share your creations in #showcase!

Get started: https://egaku-ai.com (50 free credits)

Links:
• Website: https://egaku-ai.com
• Bug reports: #bug-reports
• Feature requests: #feature-requests
```

### Step 4: 招待リンク作成
1. サーバー設定 → 招待 → 「招待リンクを編集」
2. 有効期限: 「なし」
3. リンクをコピー（例: `https://discord.gg/xxxxx`）
4. **このリンクを教えてください** → サイトに追加します

### Step 5: コミュニティ機能を有効化（任意）
サーバー設定 → コミュニティを有効にする → サーバーディスカバリーに表示

---

## 2. Reddit 投稿（20分）

### 投稿先と投稿文（コピペ用）

**重要ルール:**
- 各サブレディットのルールを先に確認
- 自己宣伝比率に注意（投稿の10%以下が目安）
- 先に数日間、他の投稿にコメントしてからの方が安全
- 「I built this」形式が受け入れられやすい

---

### 投稿1: r/StableDiffusion （最重要）

**タイトル:**
```
I built a free browser-based Flux.1 image generator - no install, no GPU needed
```

**本文:**
```
Hey r/StableDiffusion,

I've been working on EGAKU AI (https://egaku-ai.com), a web-based image generation platform. Wanted to share and get feedback.

What it does:
- Text-to-image with Flux.1 Dev (currently live)
- Style transfer, img2img, upscaling, background removal (rolling out)
- Video generation with AnimateDiff (coming soon)
- NSFW-friendly for verified 18+ users

Tech stack for anyone curious: Next.js frontend, FastAPI backend, RunPod Serverless for GPU, Supabase for auth/DB, Stripe for payments.

Free tier gives you 50 credits/month to try it out. No credit card needed.

Still in beta so definitely rough around the edges. Would appreciate any feedback - especially on image quality and UI.

Site: https://egaku-ai.com
```

---

### 投稿2: r/aiArt

**タイトル:**
```
Made a free tool to turn any photo into Ghibli/anime/oil painting style with AI
```

**本文:**
```
Just launched EGAKU AI - a free browser-based AI art generator.

Features:
- Text-to-image (Flux.1, SD1.5)
- Style transfer: upload a photo → get it in Ghibli, anime, watercolor, cyberpunk, pixel art, ukiyo-e, or oil painting style
- Image upscaling and background removal
- More features coming (video, inpainting, ControlNet)

50 free credits to start, no credit card: https://egaku-ai.com

Would love feedback! What styles or features would you want to see?
```

---

### 投稿3: r/SideProject

**タイトル:**
```
Launched my AI image generation SaaS - break-even at 5 users
```

**本文:**
```
Just launched EGAKU AI (https://egaku-ai.com), an AI image/video generation platform.

The numbers:
- Monthly server cost: ~$30-50
- Stack: Next.js (Vercel, free) + FastAPI (Railway, $5) + RunPod Serverless GPU (pay-per-use) + Supabase (free tier)
- Break-even: ~5 paying users at ¥980/mo ($6.50)
- Built solo over the past few weeks

Features: text-to-image, style transfer, img2img, upscaling, background removal, video generation (coming soon).

Free tier with 50 credits. Paid plans from ¥480/mo.

What would you do differently? Open to feedback on pricing, features, or marketing strategy.
```

---

### 投稿4: r/comfyui

**タイトル:**
```
Built a web UI around ComfyUI workflows - runs on RunPod Serverless
```

**本文:**
```
I built EGAKU AI, a web-based front-end that generates ComfyUI workflow JSON and submits it to RunPod Serverless endpoints.

Currently running:
- Flux.1 Dev (CheckpointLoaderSimple workflow)
- Planning: AnimateDiff, ControlNet, inpainting

The interesting part is the workflow builder - it constructs the full ComfyUI node graph in Python based on user parameters, then sends it as JSON to RunPod's ComfyUI worker.

Free to try: https://egaku-ai.com

Anyone else running ComfyUI on serverless? Curious about cold start optimization.
```

---

### 投稿5: r/webdev (技術寄り)

**タイトル:**
```
Built an AI SaaS with Next.js + FastAPI + RunPod Serverless - lessons learned
```

**本文:**
```
Just launched https://egaku-ai.com - an AI image generation platform. Here's the stack and what I learned:

Frontend: Next.js 15 + Tailwind + shadcn/ui on Vercel
Backend: Python FastAPI on Railway
GPU: RunPod Serverless (auto-scales, pay per second)
Auth: Supabase (Google/Discord/GitHub OAuth)
DB: Supabase PostgreSQL
Payments: Stripe
Queue: Redis (Upstash)

Key learnings:
1. RunPod Serverless cold starts are 30-60s for first request, then 2-3s after
2. Base64 image responses from GPU workers are too large for URLs - serve via API endpoint instead
3. Supabase Auth + OAuth providers took 30 min total to set up

Happy to answer any architecture questions.
```

---

### 投稿タイミング
- 米国時間の火〜木の午前中（日本時間だと火〜木の深夜0時〜朝6時頃）が最もエンゲージメント高い
- 1日1投稿まで（同日に複数サブレディットに投稿するとスパム判定される可能性）
- 投稿順: r/StableDiffusion → r/SideProject → r/aiArt → r/comfyui → r/webdev

---

## 3. RunPod ビデオ/追加モデル セットアップ

### 現状
- 画像生成（Flux.1 Dev）: 動作中
- その他全て: RunPodに必要なモデル/ノードが未インストール

### やること: 新しいServerlessエンドポイント作成

1. https://www.runpod.io/ にログイン
2. 「**Serverless**」→「**New Endpoint**」

### テンプレート選択
「**comfyui**」で検索して、以下の条件を満たすテンプレートを選ぶ:
- ComfyUI が入っている
- カスタムノードを追加できる（Network Volumeがある）

**おすすめ**: `timpietruskycomfyui` テンプレート（人気のComfyUI Serverless template）

### Network Volume にモデルを追加
RunPod の Network Volume を作成し、以下のモデルをダウンロード:

**チェックポイント（/comfyui/models/checkpoints/）:**
```
v1-5-pruned-emaonly.safetensors    (SD1.5 base)
```
ダウンロードURL: https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors

**モーションモデル（/comfyui/models/animatediff_models/）:**
```
mm_sd_v15_v2.ckpt                 (AnimateDiff v2)
```
ダウンロードURL: https://huggingface.co/guoyww/animatediff/resolve/main/mm_sd_v15_v2.ckpt

**アップスケールモデル（/comfyui/models/upscale_models/）:**
```
RealESRGAN_x4plus.pth
```
ダウンロードURL: https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth

**ControlNetモデル（/comfyui/models/controlnet/）:**
```
control_v11p_sd15_canny.pth
control_v11f1p_sd15_depth.pth
control_v11p_sd15_openpose.pth
```
ダウンロードURL（全てHugging Faceから）:
- https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_canny.pth
- https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11f1p_sd15_depth.pth
- https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_openpose.pth

### カスタムノード（拡張機能）
ComfyUI に以下の拡張をインストール:
```
comfyui-animatediff-evolved     (AnimateDiff)
ComfyUI-VideoHelperSuite        (VHS_VideoCombine)
comfyui_controlnet_aux          (ControlNet preprocessors)
ComfyUI-rembg                   (背景除去)
```

### エンドポイント設定
- GPU: RTX 4000 以上（16GB VRAM推奨）
- Min Workers: 0（コスト節約）
- Max Workers: 3
- Idle Timeout: 5秒

### Railway 環境変数に追加
エンドポイント作成後、endpoint IDをコピーして:
```
RUNPOD_VIDEO_ENDPOINT_ID=<新しいendpoint ID>
```
Railway Dashboard → EGAKU AI service → Variables → 追加

---

## チェックリスト

### すぐやる（今日）
- [ ] Discord サーバー作成 → 招待リンクを取得
- [ ] 招待リンクをこちらに伝える → サイトに追加
- [ ] Reddit r/StableDiffusion に投稿

### 今週中
- [ ] Reddit 他のサブレディットに1日1投稿
- [ ] X/Twitter アカウント作成 → 生成画像を投稿
- [ ] RunPod ビデオ用エンドポイント作成

### 来週
- [ ] Product Hunt 投稿
- [ ] YouTube チュートリアル動画
- [ ] CivitAI に生成画像投稿
