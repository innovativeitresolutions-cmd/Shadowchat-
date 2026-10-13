import { chromium } from "playwright";
import assert from "node:assert/strict";

const url = process.env.LOCAL_AI_TEST_URL || "http://127.0.0.1:10000";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: {width: 1200, height: 1000} });
page.on("pageerror", err => console.error("Browser exception:", err.message.slice(0,250)));
page.on("console", msg => {
  if (msg.type() === "error") console.error("Browser console error:", msg.text().slice(0,300));
});
try {
  await page.goto(url, {waitUntil:"domcontentloaded",timeout:30000});
  await page.locator("#local-ai-start").waitFor({state:"visible"});
  assert.match(await page.locator("#local-ai").innerText(),/real|genuine|model/i);
  await page.locator("#local-ai-start").click();
  await page.waitForFunction(() => {
    const panel = document.querySelector("#local-ai-form");
    const message = document.querySelector("#local-ai-status")?.textContent || "";
    return (panel && !panel.hidden) || message.includes("could not start");
  }, null, {timeout:360000});
  const ready = await page.locator("#local-ai-form").isVisible();
  if (!ready) throw new Error("Real model did not load: " + (await page.locator("#local-ai-status").textContent()));
  await page.locator("#local-ai-prompt").fill("In one short sentence, what does a software test do?");
  await page.locator("#local-ai-send").click();
  await page.locator(".local-ai-message.assistant").first().waitFor({state:"visible",timeout:240000});
  const actual = (await page.locator(".local-ai-message.assistant").first().innerText()).trim();
  assert.ok(actual.length > 20, "No substantial local-model response: " + actual);
  console.log("PASS: real on-device model generated conversational text in Chromium");
  await page.locator("#local-ai-stop").click();
  assert.equal(await page.locator(".local-ai-message").count(),0);
  console.log("PASS: closing model wipes transient UI chat");
} catch (e) {
  console.error("Status at failure:",(await page.locator("#local-ai-status").textContent().catch(()=>"<not visible>")).slice(0,300));
  throw e;
} finally {
  await browser.close();
}
