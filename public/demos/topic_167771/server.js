const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8"
};

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(message);
}

function createStaticServer({ rootDir = __dirname } = {}) {
  const absoluteRoot = path.resolve(rootDir);

  return http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendText(response, 405, "Method Not Allowed");
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
      sendText(response, 400, "Bad Request");
      return;
    }

    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = path.resolve(absoluteRoot, relativePath);
    const isInsideRoot = filePath === absoluteRoot || filePath.startsWith(`${absoluteRoot}${path.sep}`);

    if (!isInsideRoot) {
      sendText(response, 403, "Forbidden");
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        sendText(response, 404, "Not Found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "Content-Length": stats.size,
        "Cache-Control": "no-cache"
      });

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      const stream = fs.createReadStream(filePath);
      stream.on("error", () => {
        if (!response.headersSent) sendText(response, 500, "Internal Server Error");
        else response.destroy();
      });
      stream.pipe(response);
    });
  });
}

function openBrowser(url) {
  const commands = {
    darwin: ["open", [url]],
    win32: ["powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "Start-Process -FilePath $env:WEB_PREVIEW_URL"
    ]]
  };
  const [command, args] = commands[process.platform] || ["xdg-open", [url]];
  const child = spawn(command, args, {
    detached: true,
    env: { ...process.env, WEB_PREVIEW_URL: url },
    stdio: "ignore"
  });
  child.unref();
}

function readPort(args) {
  const portIndex = args.indexOf("--port");
  const value = portIndex >= 0 ? Number(args[portIndex + 1]) : 8080;
  return Number.isInteger(value) && value > 0 && value <= 65535 ? value : 8080;
}

function listen(server, host, startPort, attemptsLeft = 10) {
  return new Promise((resolve, reject) => {
    const handleError = (error) => {
      server.off("listening", handleListening);
      if (error.code === "EADDRINUSE" && attemptsLeft > 1) {
        resolve(listen(server, host, startPort + 1, attemptsLeft - 1));
      } else {
        reject(error);
      }
    };
    const handleListening = () => {
      server.off("error", handleError);
      resolve(server.address().port);
    };

    server.once("error", handleError);
    server.once("listening", handleListening);
    server.listen(startPort, host);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const host = "127.0.0.1";
  const server = createStaticServer();
  const port = await listen(server, host, readPort(args));
  const url = `http://${host}:${port}/`;

  console.log(`Web 前端已启动：${url}`);
  console.log("关闭此窗口或按 Ctrl+C 即可停止服务。");

  if (args.includes("--open")) openBrowser(url);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`启动失败：${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { createStaticServer, listen, readPort };
