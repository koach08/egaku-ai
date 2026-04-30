# EGAKU AI 競合機能ギャップ分析（2026/04/30）

調査対象: OpenArt, PixVerse, Vidu, Higgsfield, Runway, Pika, Luma, Playground

## EGAKU AIに「ない」機能（SFW集客効果順）

### Tier A: 導入すればユーザー増に直結する可能性が高い

| # | 機能 | 競合 | なぜ効く |
|---|------|------|----------|
| 1 | **Sketch to Image** | OpenArt, Higgsfield | 絵が描けない人がラフ描き→プロ画像。参入障壁が最も低い。「落書きがアートに」はバズりやすい |
| 2 | **VFX / Motion Effects** | Higgsfield (150+) | 火・水・変身・崩壊エフェクト。TikTok/Reels映え。1枚の写真→派手な動画で拡散力極大 |
| 3 | **AI Templates（ワンタップ生成）** | PixVerse, Vidu | 「人気テンプレからワンタップ」でプロンプト不要。初心者の離脱防止。バイラルフォーマット対応 |
| 4 | **Multi-Angle Shots** | Higgsfield | 1枚の画像→9角度の写真。ECサイト・キャラクター設定に実用的 |
| 5 | **Object Removal（消しゴム）** | OpenArt | 画像から不要な物を消す。Adobe Firefly的な機能。写真編集ニーズの入口 |
| 6 | **Outpaint / Expand Image** | OpenArt, Higgsfield | 画像の外側を生成して拡張。SNS用にアスペクト比を変えたい需要 |
| 7 | **Virtual Try-On / Fashion** | Higgsfield | 自分の写真+服→試着。ファッションEC・個人利用どちらも需要大 |

### Tier B: あると差別化になるが実装コスト・効果を見極める

| # | 機能 | 競合 | 備考 |
|---|------|------|------|
| 8 | **Find & Replace（物体置換）** | OpenArt | 画像内の物体をAIで別のものに差し替え。Inpaintingの上位互換 |
| 9 | **Sound Effects Generator** | Vidu | 効果音をAI生成。動画制作と組み合わせると強い |
| 10 | **Multi-Frame Control（始点・終点指定）** | PixVerse, Vidu | 動画の最初と最後のフレームを指定→中間を生成。ストーリー制御に有効 |
| 11 | **Agent Mode（会話型生成）** | PixVerse | 「こんな感じの動画作って」→AIが対話で詰めて生成。初心者に優しい |
| 12 | **Multi-Shot（自動マルチアングル動画）** | PixVerse | 1プロンプト→複数カメラアングルの連続ショット自動生成 |
| 13 | **Canvas / Workspace** | Higgsfield, Leonardo | Photoshop的な無限キャンバスでAI画像を配置・編集 |
| 14 | **Reference Library（再利用素材）** | Vidu | キャラ・小道具・背景を保存→次の生成で再利用。ヘビーユーザー向け |
| 15 | **Artistic QR Code** | OpenArt | QRコードをアート化。SNS映え+実用性 |

### Tier C: 競合の目玉だがEGAKU AIの規模では優先度低

| # | 機能 | 競合 | 理由 |
|---|------|------|------|
| 16 | AI Apps Marketplace（100+ミニツール） | Higgsfield | 開発・メンテコスト膨大 |
| 17 | Marketing Studio（UGC自動制作） | Higgsfield | 企業向け。個人クリエイター路線とずれる |
| 18 | Collab（チームワークスペース） | Higgsfield | B2B向け機能。ユーザー数少ない段階では不要 |
| 19 | World Simulation / Interactive Video | Runway | 技術的に別次元。研究段階 |
| 20 | Off-Peak Free Mode | Vidu | 収益モデルと相性悪い。無料枠で対応済み |
| 21 | MCP Integration | Higgsfield | 開発者向け。一般ユーザーに訴求しない |

## EGAKU AIが既に持っていて競合にない（差別化ポイント）

- **CivitAI 100K+モデル対応**（OpenArt以外にはない）
- **Prompt Battle**（どこにもない独自機能）
- **30+モデル一括アクセス**（Higgsfield以外は自社モデル中心）
- **NSFW対応**（大手は全てNG or 別サービス）
- **低価格**（月480円から。Higgsfield $9, Leonardo $10, OpenArt $12）
- **5言語対応**（EN/JA/ES/ZH/PT）
- **Crypto決済**
- **Self-hosted版販売**

## 実装推奨順（SFW充実・1人開発・効果重視）

1. **Sketch to Image** - fal.aiにScribble ControlNetがある。既存ControlNet基盤を活用
2. **VFX Effects** - 写真1枚→短い動画+エフェクト。テンプレ化すればフロントのみ
3. **AI Templates** - DBにテンプレプロンプト保存。フロントでワンタップUI。実装最速
4. **Object Removal** - fal.aiのLaMa / PowerPaint等。API1本
5. **Outpaint** - 既存Inpainting UIの拡張。マスク範囲を画像外に設定
6. **Multi-Angle** - Flux + ControlNet + depth推定で実現可能
7. **Sound Effects** - ElevenLabs / Stable Audio等のAPI連携
