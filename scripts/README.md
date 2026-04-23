# Screenshot automation

## First time setup (one-time)
```bash
cd ~/Desktop/アプリ開発プロジェクト/ai-studio/scripts
npm init -y
npm install playwright
npx playwright install chromium
```

## Run
```bash
cd ~/Desktop/アプリ開発プロジェクト/ai-studio
node scripts/capture-screenshots.mjs
```

The browser will open automatically. For the authenticated pages, log in
manually when it shows the login page, then press Enter in the terminal.

Screenshots are saved to: `~/Desktop/egaku-screenshots/`
