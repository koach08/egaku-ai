# EGAKU AI - RunPod セットアップ状況引き継ぎ

## プロジェクト概要
- **サービス名**: EGAKU AI（AI画像/動画生成SaaS）
- **URL**: https://egaku-ai.com
- **構成**: Next.js (Vercel) + FastAPI (Railway) + Supabase + Stripe
- **GPU**: RunPod Serverless（ComfyUI ベース）

---

## 現在のRunPod状況

### アカウント情報
- **API Key**: `rpa_YOUR_API_KEY_HERE`

### 既存エンドポイント（2つ）
| ID | 名前 | GPU | Workers |
|----|------|-----|---------|
| `your-endpoint-id-1` | ComfyUI 5.5.1 -fb | ADA_24 (RTX 4090等) | 0-3 |
| `your-endpoint-id-2` | ComfyUI 5.5.1 -fb | ADA_24 (RTX 4090等) | 0-3 |

- **テンプレート**: "comfyUI"（Flux モデルのみ内蔵）
- **内蔵モデル**: `flux1-dev-fp8.safetensors` のみ
- **Network Volume**: なし（未作成）

### 問題点
1. **GPU在庫切れ**: 2026/03/09時点で全GPUタイプが在庫なし（15種類試行済み）
2. **Fluxしかない**: SD1.5、AnimateDiff、ControlNet、RealESRGAN等のモデルが入っていない
3. **Network Volumeがない**: 追加モデルを保存する場所がない

---

## やりたいこと（優先順）

### 1. まず画像生成を動くようにする
- 既存の Flux エンドポイントで txt2img が動くことを確認
- GPU在庫が回復すれば、サーバーレスワーカーが自動起動するはず
- **テスト方法**:
```bash
curl -X POST "https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run" \
  -H "Authorization: Bearer YOUR_RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "workflow": {
        "6": {
          "class_type": "CLIPTextEncode",
          "inputs": {
            "text": "a beautiful anime girl, cherry blossom background",
            "clip": ["30", 1]
          }
        },
        "8": {
          "class_type": "VAEDecode",
          "inputs": {
            "samples": ["13", 0],
            "vae": ["30", 2]
          }
        },
        "9": {
          "class_type": "SaveImage",
          "inputs": {
            "filename_prefix": "egaku",
            "images": ["8", 0]
          }
        },
        "13": {
          "class_type": "KSampler",
          "inputs": {
            "seed": 42,
            "steps": 20,
            "cfg": 1.0,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1.0,
            "model": ["30", 0],
            "positive": ["6", 0],
            "negative": ["33", 0],
            "latent_image": ["27", 0]
          }
        },
        "27": {
          "class_type": "EmptyLatentImage",
          "inputs": {
            "width": 1024,
            "height": 1024,
            "batch_size": 1
          }
        },
        "30": {
          "class_type": "CheckpointLoaderSimple",
          "inputs": {
            "ckpt_name": "flux1-dev-fp8.safetensors"
          }
        },
        "33": {
          "class_type": "CLIPTextEncode",
          "inputs": {
            "text": "",
            "clip": ["30", 1]
          }
        }
      }
    }
  }'
```

### 2. Network Volume を作成してモデルを追加
- RunPod で Network Volume を作成（50-100GB推奨）
- 以下のモデルをダウンロードする必要がある:

| モデル | 用途 | サイズ |
|--------|------|--------|
| v1-5-pruned-emaonly.safetensors | SD1.5 ベース | ~4GB |
| mm_sd_v15_v2.ckpt | AnimateDiff (動画) | ~1.8GB |
| RealESRGAN_x4plus.pth | アップスケール | ~64MB |
| control_v11p_sd15_canny.pth | ControlNet Canny | ~1.4GB |
| control_v11p_sd15_openpose.pth | ControlNet OpenPose | ~1.4GB |

### 3. エンドポイントをNetwork Volume付きに再作成
- テンプレート: "Comfy (network volume)"
- Network Volumeを接続
- GPU: RTX 4090 (ADA_24) または RTX 3090等

---

## バックエンド側の設定（Railway 環境変数）

現在設定済みの環境変数:
```
RUNPOD_API_KEY=your-runpod-api-key
RUNPOD_ENDPOINT_ID=your-endpoint-id
RUNPOD_VIDEO_ENDPOINT_ID=your-video-endpoint-id
```

Network Volume + 新エンドポイント作成後に更新が必要。

---

## 機能ごとのモデル要件

### 現在動くはず（Flux のみで OK）
| 機能 | バックエンドコード | 状態 |
|------|-------------------|------|
| txt2img | `app/api/generate.py` | GPU さえあれば動く |
| img2img | `app/api/generate_advanced.py` | Flux 対応済み |
| style_transfer | `app/api/generate_advanced.py` | Flux 対応済み |
| inpaint | `app/api/generate_advanced.py` | Flux 対応済み |

### Network Volume + 追加モデルが必要
| 機能 | 必要なモデル | バックエンドの状態 |
|------|-------------|-------------------|
| txt2vid | AnimateDiff + SD1.5 | コード済み、503返却中 |
| img2vid | AnimateDiff + SD1.5 | コード済み、503返却中 |
| vid2vid | AnimateDiff + SD1.5 | コード済み、503返却中 |
| upscale | RealESRGAN | コード済み、503返却中 |
| controlnet | ControlNet models | コード済み、503返却中 |
| remove_bg | rembg/SAM | コード済み |

### 503を解除するコード箇所
`backend/app/api/generate_advanced.py` で各エンドポイントの先頭に:
```python
raise HTTPException(status_code=503, detail="Coming soon...")
```
が入っている。モデル準備完了後に削除する。

`backend/app/api/generate.py` の動画生成も同様:
```python
raise HTTPException(status_code=503, detail="Video generation coming soon...")
```

---

## 代替案: RunPod が使えない場合

RunPodのGPU在庫が長期間回復しない場合の代替:

| サービス | Flux対応 | 料金/枚 | メリット |
|---------|---------|---------|---------|
| Replicate | Schnell/Dev | ~$0.003 | 安定、簡単なAPI |
| fal.ai | Schnell/Dev | ~$0.002 | 最速、安い |
| Together AI | Schnell | ~$0.003 | 安定 |

バックエンドにフォールバック機能を追加すれば、RunPod不可時に自動切り替え可能。

---

## ファイル構成（関連ファイルのみ）

```
ai-studio/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate.py          # txt2img, video endpoints
│   │   │   ├── generate_advanced.py  # img2img, upscale, etc.
│   │   │   ├── gallery.py           # community gallery + follows
│   │   │   └── auth.py              # login, profile update
│   │   ├── services/
│   │   │   ├── workflows.py         # ComfyUI workflow JSON builders
│   │   │   ├── runpod.py            # RunPod API client
│   │   │   ├── cache.py             # Prompt hash caching
│   │   │   └── queue.py             # Job queue management
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic schemas, plan limits
│   │   └── core/
│   │       └── config.py            # Settings (env vars)
│   └── requirements.txt
├── frontend/
│   └── src/app/
│       ├── (dashboard)/generate/    # 生成ページ
│       ├── (public)/gallery/        # コミュニティギャラリー
│       └── (public)/user/[userId]/  # ユーザープロフィール
├── SUPABASE_SCHEMA.sql              # DB schema (実行済み)
└── RUNPOD_SETUP_GUIDE.md            # このファイル
```

---

## 質問する際のポイント

Claude Chat に以下を伝えると効率的:
1. 「RunPod Serverless で ComfyUI エンドポイントを設定したい」
2. 「現在 Flux モデルのみ。SD1.5 + AnimateDiff を追加したい」
3. 「GPU在庫切れの場合、Replicate等のフォールバックも検討」
4. 「Network Volume の作成方法と、モデルのダウンロード手順を知りたい」
