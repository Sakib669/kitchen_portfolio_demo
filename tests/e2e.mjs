import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:3100";
let server;

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try { const response = await fetch(`${base}/en`); if (response.ok) return; } catch { /* still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Site did not start at ${base}`);
}

try {
  if (!process.env.BASE_URL) {
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3100"], { stdio: "ignore" });
    await waitForServer();
  }
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/en`);
    await page.getByRole("heading", { name: "A kitchen shaped around living." }).waitFor();
    await page.goto(`${base}/bn`);
    await page.getByRole("heading", { name: "যে রান্নাঘরে জীবনের গল্প জমে।" }).waitFor();

    await page.goto(`${base}/en/collections/soft-naturals`);
    await page.getByRole("link", { name: /Sora/ }).first().click();
    await page.getByRole("heading", { name: "Sora" }).waitFor();
    await page.getByRole("link", { name: /Enquire about this kitchen/ }).click();
    await page.getByLabel("Your name").fill("Test Visitor");
    await page.getByLabel("Email address").fill("test@example.com");
    await page.getByLabel("Tell us about your space").fill("A compact family kitchen.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /Save on this device/ }).click();
    await page.getByText("Saved on this device, not sent.", { exact: true }).first().waitFor();

    await page.goto(`${base}/studio`);
    await page.getByRole("button", { name: "Saved notes" }).click();
    await page.getByText("Test Visitor").waitFor();
    await page.getByRole("button", { name: "Brand" }).click();
    await page.getByLabel("English tagline").fill("A better everyday");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.reload();
    assert.equal(await page.getByLabel("English tagline").inputValue(), "A better everyday");

    await page.getByRole("button", { name: "Backup" }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export JSON/ }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), "aangan-browser-backup.json");
    console.log("E2E passed: locales, collection flow, local inquiry, edit persistence, JSON export");
  } finally { await browser.close(); }
} finally { server?.kill(); }
