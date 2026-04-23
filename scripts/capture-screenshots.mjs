#!/usr/bin/env node
/**
 * EGAKU AI screenshot capture script
 *
 * Captures screenshots of the public pages automatically.
 * For pages that require login, it opens an interactive browser
 * and waits for you to log in, then captures once you press Enter.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs
 *
 * Output: ~/Desktop/egaku-screenshots/
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import readline from "readline";

const OUTPUT_DIR = join(homedir(), "Desktop", "egaku-screenshots");
const BASE_URL = "https://egaku-ai.com";

// 1920x1080 for desktop screenshots (standard for directory submissions)
const VIEWPORT = { width: 1920, height: 1080 };

const PUBLIC_SHOTS = [
  {
    name: "01-homepage.png",
    url: `${BASE_URL}/`,
    waitFor: 2500,
    scroll: 0,
    description: "Homepage hero + gallery",
  },
  {
    name: "02-gallery.png",
    url: `${BASE_URL}/gallery`,
    waitFor: 3500,
    scroll: 0,
    description: "Community gallery",
  },
  {
    name: "03-tools.png",
    url: `${BASE_URL}/tools`,
    waitFor: 2000,
    scroll: 0,
    description: "All tools overview",
  },
  {
    name: "04-pricing.png",
    url: `${BASE_URL}/#pricing`,
    waitFor: 2500,
    scroll: 1200,
    description: "Pricing section",
  },
];

const AUTH_SHOTS = [
  {
    name: "05-generate.png",
    url: `${BASE_URL}/generate`,
    waitFor: 3000,
    scroll: 0,
    description: "Generate page",
  },
  {
    name: "06-photo-booth.png",
    url: `${BASE_URL}/photo-booth`,
    waitFor: 2000,
    scroll: 0,
    description: "AI Photo Booth",
  },
  {
    name: "07-battle.png",
    url: `${BASE_URL}/battle`,
    waitFor: 2500,
    scroll: 0,
    description: "Prompt Battle",
  },
  {
    name: "08-shorts.png",
    url: `${BASE_URL}/shorts`,
    waitFor: 2000,
    scroll: 0,
    description: "Video Shorts",
  },
];

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function capture(page, shot) {
  const path = join(OUTPUT_DIR, shot.name);
  console.log(`  → ${shot.name} (${shot.description})`);
  await page.goto(shot.url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(shot.waitFor);
  if (shot.scroll) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), shot.scroll);
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path, fullPage: false });
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Output: ${OUTPUT_DIR}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  console.log("=== Public pages (no login required) ===");
  for (const shot of PUBLIC_SHOTS) await capture(page, shot);

  console.log("\n=== Authenticated pages ===");
  console.log("The browser is now at the login page.");
  console.log("Please log in manually, then come back here.\n");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" }).catch(() => {});

  await prompt("Press Enter after you've logged in... ");

  for (const shot of AUTH_SHOTS) await capture(page, shot);

  console.log("\nDone! Screenshots saved to:");
  console.log(`  ${OUTPUT_DIR}\n`);
  await browser.close();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
