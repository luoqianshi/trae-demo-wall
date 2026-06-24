import { BrowserWindow, app } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rendererUrl = process.env.QN_RENDERER_URL || "http://127.0.0.1:5173";

function createWindow(query) {
  const window = new BrowserWindow({
    width: query.mode === "overlay" ? 960 : 420,
    height: query.mode === "overlay" ? 240 : 760,
    frame: query.mode !== "overlay",
    transparent: query.mode === "overlay",
    backgroundColor: query.mode === "overlay" ? "#00000000" : "#101726",
    alwaysOnTop: query.mode === "overlay",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  window.loadURL(`${rendererUrl}?mode=${query.mode}`);
  return window;
}

app.whenReady().then(() => {
  createWindow({ mode: "control" });
  createWindow({ mode: "overlay" });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow({ mode: "control" });
      createWindow({ mode: "overlay" });
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
