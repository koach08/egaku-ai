# OAuth認証プロバイダー セットアップガイド

EGAKU AIに Google / Discord / GitHub / X(Twitter) ログインを追加する手順。
各プロバイダーは独立しているので、好きな順番でOK。

---

## 前提

- Supabase プロジェクトにアクセスできること
- Supabase Dashboard: https://supabase.com/dashboard
- サイトURL: `https://egaku-ai.com`

**Supabase側の共通リダイレクトURL（全プロバイダー共通）:**
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```
これは Supabase Dashboard → Authentication → URL Configuration に表示されている。

---

## 1. Google OAuth

### Step 1: Google Cloud Console でプロジェクト作成

1. https://console.cloud.google.com/ にアクセス
2. 上部の「プロジェクトを選択」→「新しいプロジェクト」
   - プロジェクト名: `EGAKU AI` （なんでもOK）
3. 作成したプロジェクトを選択

### Step 2: OAuth 同意画面を設定

1. 左メニュー「APIとサービス」→「OAuth 同意画面」
2. User Type: 「外部」を選択 →「作成」
3. アプリ情報:
   - アプリ名: `EGAKU AI`
   - ユーザーサポートメール: 自分のメール
   - デベロッパーの連絡先: 自分のメール
4. スコープ: 何も追加せず「保存して続行」
5. テストユーザー: 何も追加せず「保存して続行」
6. **「アプリを公開」ボタンを押す**（本番利用のため。押さないとテストユーザーしかログインできない）

### Step 3: OAuth クライアントID作成

1. 左メニュー「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuthクライアントID」
3. アプリケーションの種類: 「ウェブアプリケーション」
4. 名前: `EGAKU AI Web`
5. **承認済みのリダイレクトURI** に追加:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   （SupabaseのプロジェクトrefはDashboardのSettings → General で確認）
6. 「作成」→ **Client ID** と **Client Secret** をメモ

### Step 4: Supabase に登録

1. Supabase Dashboard → Authentication → Providers
2. 「Google」を見つけてONにする
3. `Client ID` と `Client Secret` を貼り付け
4. 「Save」

### 完了確認
egaku-ai.com のログインページで「Continue with Google」が使えるようになる。

---

## 2. Discord OAuth

### Step 1: Discord Developer Portal

1. https://discord.com/developers/applications にアクセス
2. 「New Application」→ 名前: `EGAKU AI` →「Create」

### Step 2: OAuth2 設定

1. 左メニュー「OAuth2」→「General」
2. **Client ID** をメモ
3. 「Reset Secret」→ **Client Secret** をメモ
4. 「Redirects」に追加:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
5. 「Save Changes」

### Step 3: Supabase に登録

1. Supabase Dashboard → Authentication → Providers
2. 「Discord」をONにする
3. `Client ID` と `Client Secret` を貼り付け
4. 「Save」

### 完了確認
ログインページで「Continue with Discord」が使えるようになる。

---

## 3. GitHub OAuth

### Step 1: GitHub OAuth App 作成

1. https://github.com/settings/developers にアクセス
2. 「OAuth Apps」→「New OAuth App」
3. 入力:
   - Application name: `EGAKU AI`
   - Homepage URL: `https://egaku-ai.com`
   - Authorization callback URL:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
4. 「Register application」

### Step 2: Secret 生成

1. 作成されたアプリページで **Client ID** をメモ
2. 「Generate a new client secret」→ **Client Secret** をメモ（この画面を閉じると二度と見れない）

### Step 3: Supabase に登録

1. Supabase Dashboard → Authentication → Providers
2. 「GitHub」をONにする
3. `Client ID` と `Client Secret` を貼り付け
4. 「Save」

---

## 4. X (Twitter) OAuth

### Step 1: Twitter Developer Portal

1. https://developer.twitter.com/en/portal/dashboard にアクセス
2. Developer アカウントがなければ申請（Free tierでOK）
3. 「Projects & Apps」→ プロジェクト作成 → App作成

### Step 2: OAuth 2.0 設定

1. App Settings → 「User authentication settings」→「Set up」
2. Type of App: 「Web App」
3. App permissions: 「Read」でOK
4. 入力:
   - Callback URL:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
   - Website URL: `https://egaku-ai.com`
5. 「Save」
6. **Client ID** と **Client Secret** をメモ

### Step 3: Supabase に登録

1. Supabase Dashboard → Authentication → Providers
2. 「Twitter」をONにする
3. `Client ID` と `Client Secret` を貼り付け
4. 「Save」

### 注意
- Twitter Developer の Free tier は月1500ツイートまで（ログインには十分）
- 申請に1-2日かかることがある
- 急がないならスキップしてOK（Google + Discord で十分）

---

## 5. Supabase 側の共通設定（重要）

### リダイレクトURL の許可

1. Supabase Dashboard → Authentication → URL Configuration
2. 「Redirect URLs」に以下を追加:
   ```
   https://egaku-ai.com/**
   https://egaku-ai.com/generate
   http://localhost:3000/**
   ```
3. 「Save」

### Site URL の設定

1. 同じ画面で「Site URL」を確認:
   ```
   https://egaku-ai.com
   ```

---

## 設定後のテスト

1. https://egaku-ai.com/login にアクセス
2. 各「Continue with ...」ボタンをクリック
3. プロバイダーの認証画面が表示される
4. 認証後、`/generate` にリダイレクトされれば成功

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| 「リダイレクトURIが一致しない」 | callback URLのtypo | Supabase Dashboard → Settings → General でproject refを確認し、プロバイダー側のcallback URLを再確認 |
| Google「このアプリは確認されていません」 | OAuth同意画面が未公開 | Google Console → OAuth同意画面 →「アプリを公開」 |
| ログイン後にエラー | Redirect URL未許可 | Supabase → Auth → URL Config で `https://egaku-ai.com/**` を追加 |
| Discord「不明なエラー」 | Client Secretの期限切れ | Discord Developer → Reset Secret → Supabaseに再登録 |

---

## 優先順位（おすすめ順）

1. **Google** ← 最優先。ほぼ全員持ってる
2. **Discord** ← AI/ゲーム界隈に強い
3. **GitHub** ← 技術者向け
4. **X (Twitter)** ← 急がなくてOK
