import { chromium } from "playwright";
import assert from "node:assert/strict";

const url=process.env.LOCAL_AI_TEST_URL||"http://127.0.0.1:10000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage({viewport:{width:1200,height:1000},acceptDownloads:true});
page.on("pageerror",err=>console.error("Browser exception:",err.message.slice(0,250)));
page.on("console",msg=>{
  if(msg.type()==="error")console.error("Browser console error:",msg.text().slice(0,250));
});
async function waitDone(){
  await page.waitForFunction(()=>{
    const message=document.querySelector("#local-ai-status")?.textContent||"";
    return message.includes("Response generated")||message.includes("Could not generate");
  },null,{timeout:240000});
  const state=await page.locator("#local-ai-status").innerText();
  assert.match(state,/Response generated/,state);
}
try {
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
  await page.locator("#local-ai-start").waitFor({state:"visible"});
  assert.match(await page.locator("#local-ai").innerText(),/open-weight|language model/i);
  assert.equal(await page.locator("#local-ai-model").inputValue(),"quick");
  await page.locator("#local-ai-start").click();
  await page.waitForFunction(()=>{
    const panel=document.querySelector("#local-ai-form");
    const msg=document.querySelector("#local-ai-status")?.textContent||"";
    return (panel&&!panel.hidden)||msg.includes("Could not load");
  },null,{timeout:360000});
  const ready=await page.locator("#local-ai-form").isVisible();
  if(!ready)throw new Error("Real model failed to load: "+await page.locator("#local-ai-status").innerText());
  await page.locator("#local-ai-prompt").fill("In one short sentence, what does a software test do?");
  await page.locator("#local-ai-send").click();
  await waitDone();
  let replies=page.locator(".local-ai-message.assistant");
  assert.equal(await replies.count(),1);
  const actual=(await replies.first().innerText()).trim();
  assert.ok(actual.length>20,"No substantial generated reply: "+actual);
  console.log("PASS: actual, completed local language-model generation in Chromium");

  await page.locator("#local-ai-prompt").fill("Give one practical example.");
  await page.locator("#local-ai-send").click();
  await waitDone();
  assert.equal(await replies.count(),2);
  assert.equal(await page.locator(".local-ai-message.user").count(),2);
  console.log("PASS: two real conversational turns preserved in UI");
  const downloaded=page.waitForEvent("download");
  await page.locator("#local-ai-export").click();
  const file=await downloaded;
  assert.equal(file.suggestedFilename(),"hopeai-chat.txt");
  console.log("PASS: portable transcript export");
  await page.locator("#local-ai-new").click();
  assert.equal(await page.locator(".local-ai-message").count(),0);
  assert.equal(await page.locator("#local-ai-form").isVisible(),true);
  console.log("PASS: New chat resets conversation without reloading model");
  await page.locator("#local-ai-prompt").fill("Who is Skyler Blue Spillers?");
  await page.locator("#local-ai-send").click();
  const grounded = await page.locator(".local-ai-message.assistant").last().innerText();
  assert.match(grounded,/SKYCOIN4444/);
  assert.match(grounded,/not AI-generated/);
  assert.doesNotMatch(grounded,/scyelinder|car accident|soundwave|beach near my house/i);
  console.log("PASS: Skyler identity uses disclosed project facts, not hallucinated biography");
  await page.locator("#local-ai-stop").click();
  assert.equal(await page.locator(".local-ai-message").count(),0);
  assert.equal(await page.locator("#local-ai-form").isVisible(),false);
  console.log("PASS: stop unloads model and clears tab data");
} catch (e) {
  console.error("Status at failure:",(await page.locator("#local-ai-status").textContent().catch(()=>"<not visible>")).slice(0,300));
  throw e;
} finally { await browser.close(); }
