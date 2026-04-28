# EGAKU AI Discord サーバーセットアップガイド

## 1. チャンネル構成

カテゴリとチャンネルを以下の通り作成。

```
EGAKU AI
├── INFO
│   ├── #welcome          (読み取り専用) ウェルカム + ルール
│   ├── #announcements    (読み取り専用) 更新情報
│   └── #roadmap          (読み取り専用) 開発ロードマップ
├── COMMUNITY
│   ├── #general          雑談
│   ├── #showcase         (読み取り専用 — Bot投稿のみ) 生成作品自動投稿
│   ├── #share-your-work  ユーザーが自分の作品を投稿
│   ├── #prompts-tips     プロンプトの共有・コツ
│   └── #feature-requests 機能リクエスト
├── SUPPORT
│   ├── #help             使い方の質問
│   └── #bug-reports      バグ報告
└── NSFW (年齢制限カテゴリ)
    └── #nsfw-showcase    NSFW作品（年齢認証済みロールのみ）
```

## 2. サーバー設定

### 基本設定
- サーバーアイコン: EGAKUロゴ
- サーバーバナー: 生成した高品質画像（サイトのヒーロー画像など）
- サーバー説明: `AI image & video creation platform. 30+ models including Veo 3, Grok, Flux, Kling 3.0. Free to start.`
- コミュニティ機能: ON（サーバー設定 → コミュニティを有効化）

### ロール
| ロール | 色 | 用途 |
|--------|------|------|
| `@Admin` | 赤 | 管理者 |
| `@Creator` | 紫 | 作品を投稿したユーザー（自動付与可） |
| `@NSFW Verified` | グレー | 年齢認証済み（#nsfwアクセス用） |
| `@New` | 白 | 参加直後（ウェルカム後に自動削除） |

## 3. ウェルカムメッセージ

サーバー設定 → オンボーディング → ウェルカム画面を設定。

`#welcome` に固定メッセージを投稿:

```
Welcome to EGAKU AI

Create stunning images and videos with 30+ AI models.
Veo 3 · Grok · Flux · Kling 3.0 · Sora 2 and more.

Get started: https://egaku-ai.com/register
50 free credits, no credit card required.

Rules:
1. No real-person deepfakes or CSAM (zero tolerance)
2. NSFW content only in #nsfw-showcase (age verification required)
3. Be respectful
4. Share your prompts and help others

Channels:
#showcase — Auto-posted creations from EGAKU AI
#share-your-work — Post your own creations
#prompts-tips — Share prompt techniques
#feature-requests — Tell us what you want built
```

## 4. Showcase Webhook（自動投稿）

### 4-1. Discord Webhook URL を取得
1. `#showcase` チャンネルの設定を開く
2. 連携サービス → Webhook → 新しいWebhook
3. 名前: `EGAKU AI Bot`
4. アイコン: EGAKUロゴ
5. Webhook URLをコピー

### 4-2. Railway環境変数に追加
```
DISCORD_SHOWCASE_WEBHOOK_URL=https://discord.com/api/webhooks/xxxxx/yyyyy
```

### 4-3. バックエンド実装（すでに準備済み or 次セッションで実装）
生成完了時にWebhookへ自動POST:
- 画像URL + プロンプト + モデル名
- 「Try it yourself → egaku-ai.com」リンク付き
- SFWのみ（NSFWは投稿しない）

投稿フォーマット:
```json
{
  "embeds": [{
    "title": "New Creation on EGAKU AI",
    "description": "Prompt: ...",
    "image": {"url": "画像URL"},
    "color": 9442302,
    "footer": {"text": "Model: Flux Pro · Try free → egaku-ai.com"}
  }]
}
```

## 5. NSFW チャンネル設定

1. NSFWカテゴリを作成
2. カテ��リ設定 → 「年齢制限チャンネル」をON
3. `@NSFW Verified` ロールのみ閲覧可に設定
4. `#welcome` に認証方法を記載（リアクションで`@NSFW Verified`付与など）

## 6. Bot導入（オプシ��ン）

### MEE6 (無料プランで十分)
- ウェルカムメッセージ自動送信
- ロール自動付与
- 自動モデレーション

### 設定手順
1. https://mee6.xyz にアクセス
2. EGAKUサーバーに追加
3. Welcome → 有効化、`#welcome`に送信設定
4. Auto Role → `@New` を参加時に自動付与

## 7. サーバーブースト施策

Discordサーバー検索で見つけてもらうために:
- コミュニティ機能をON
- サーバーディスカバリーに登録（設定 → ディスカバリー）
- タグ: `ai`, `art`, `image-generation`, `video`, `creative`

## 8. X (Twitter) 連携で集客

投稿テンプレート:
```
[生成画像/動画を添付]

Made with EGAKU AI 🎨
30+ AI models, free to start.

→ egaku-ai.com
→ Discord: discord.gg/YqgYjJFjp2

#AIart #AIgenerated #EgakuAI
```

## 優先順位

1. チャンネル構成整理 (10分)
2. ウェルカムメッセージ固定 (5分)
3. Webhook URL取得 → Railway環境変数追加 (5分)
4. バックエンド自動投稿実装 (次セッション)
5. ロール・権限設定 (15分)
6. MEE6導入 (10分)
