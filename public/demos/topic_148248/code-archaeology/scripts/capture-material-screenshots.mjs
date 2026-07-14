import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "screenshots", "material");
const userDataDir = join(root, ".tmp-chrome-material");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9228;
const baseUrl = "http://localhost:8876/";

await mkdir(outDir, { recursive: true });
await rm(userDataDir, { recursive: true, force: true });

const proc = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "--window-size=1600,1200",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(path) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`);
  if (!response.ok) throw new Error(`CDP endpoint failed: ${path}`);
  return response.json();
}

async function waitForDebugger() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const tabs = await getJson("/json/list");
      const tab = tabs.find((item) => item.type === "page");
      if (tab?.webSocketDebuggerUrl) return tab.webSocketDebuggerUrl;
    } catch {
      await sleep(200);
    }
  }
  throw new Error("Chrome remote debugger did not start.");
}

const socket = new WebSocket(await waitForDebugger());
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let id = 0;
const pending = new Map();

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
});

function send(method, params = {}) {
  id += 1;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  return send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
}

async function runScript(script) {
  return evaluate(`(async () => { ${script} })()`);
}

async function capture(name, script) {
  await runScript(script);
  await sleep(900);
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  await writeFile(join(outDir, name), Buffer.from(screenshot.data, "base64"));
}

async function captureElement(name, selector, padding = 12) {
  const result = await evaluate(`
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = el.getBoundingClientRect();
      return {
        x: Math.max(0, rect.left + window.scrollX - ${padding}),
        y: Math.max(0, rect.top + window.scrollY - ${padding}),
        width: rect.width + ${padding * 2},
        height: rect.height + ${padding * 2}
      };
    })()
  `);
  const clip = result.result?.value;
  if (!clip) throw new Error(`Element not found: ${selector}`);
  await sleep(500);
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { ...clip, scale: 1 },
  });
  await writeFile(join(outDir, name), Buffer.from(screenshot.data, "base64"));
}

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: baseUrl });
  await sleep(1800);

  await capture("01-hero.png", "window.scrollTo(0, 0);");

  await runScript(`
    document.querySelector('#live-demo')?.scrollIntoView({ block: 'start' });
    await new Promise((resolve) => setTimeout(resolve, 300));
    document.querySelector('.question-btn[data-q="modify"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 300));
  `);
  await captureElement("02-demo-operation.png", "#live-demo .demo-col-input");

  await runScript(`
    document.querySelector('#archaeologistBtn')?.click();
    await new Promise((resolve) => setTimeout(resolve, 5200));
    document.querySelector('#live-demo .step-expand')?.click();
    await new Promise((resolve) => setTimeout(resolve, 400));
  `);
  await captureElement("03-demo-reasoning.png", "#live-demo .demo-col-thinking");
  await captureElement("04-demo-result.png", "#live-demo .demo-col-output");

  await capture("05-live-demo-overview.png", `
    document.querySelector('#live-demo .mode-panel.active .demo-grid')?.scrollIntoView({ block: 'center' });
  `);
  await capture("06-award-moment.png", "document.querySelector('#award-moment')?.scrollIntoView({ block: 'start' });");
  await capture("07-implementation-roadmap.png", "document.querySelector('#business')?.scrollIntoView({ block: 'start' });");
} finally {
  socket.close();
  proc.kill();
  await sleep(300);
  try {
    await rm(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } catch (error) {
    console.warn(`Skipped Chrome temp cleanup: ${error.message}`);
  }
}
