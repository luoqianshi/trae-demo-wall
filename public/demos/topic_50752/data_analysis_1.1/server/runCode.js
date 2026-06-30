import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNNER_PATH = path.join(__dirname, "..", "python", "runner.py");
const SENTINEL = "@@RUNCODE_RESULT@@";

const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");

export class PythonKernel {
  constructor() {
    this.proc = null;
    this.buffer = "";
    this.pending = new Map();
    this.ready = null;
    this._started = false;
  }

  start() {
    if (this._started && this.proc) return this.ready;

    const self = this;
    this.buffer = "";
    this.pending.clear();

    this.proc = spawn(PYTHON_BIN, ["-u", RUNNER_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    // 先绑定 stdout 监听器，确保不丢失数据
    this.proc.stdout.setEncoding("utf-8");
    this.proc.stdout.on("data", function (chunk) {
      self.buffer += chunk;
      let idx;
      while ((idx = self.buffer.indexOf("\n")) >= 0) {
        const line = self.buffer.slice(0, idx);
        self.buffer = self.buffer.slice(idx + 1);
        const pos = line.indexOf(SENTINEL);
        if (pos < 0) continue;
        const jsonStr = line.slice(pos + SENTINEL.length);
        let obj;
        try {
          obj = JSON.parse(jsonStr);
        } catch {
          continue;
        }
        const id = obj.id;
        const p = self.pending.get(id);
        if (p) {
          self.pending.delete(id);
          p.resolve(obj);
        }
      }
    });

    this.proc.stderr.setEncoding("utf-8");
    this.proc.stderr.on("data", function (chunk) {
      process.stderr.write(`[kernel] ${chunk}`);
    });

    this.proc.on("error", function (err) {
      console.error("[kernel] spawn error:", err.message);
    });

    this.proc.on("exit", function (code) {
      for (const [, p] of self.pending) {
        p.resolve({ ok: false, stdout: "", stderr: "", error: `Python 内核已退出 (code ${code})` });
      }
      self.pending.clear();
      self.proc = null;
      self._started = false;
    });

    // 再创建 Promise——此时监听器已全部就位
    this.ready = new Promise((resolve, reject) => {
      self.pending.set("__ready__", { resolve, reject });
      setTimeout(() => {
        if (self.pending.has("__ready__")) {
          self.pending.delete("__ready__");
          reject(new Error("Python 内核启动超时"));
        }
      }, 15000);
    });

    this._started = true;
    return this.ready;
  }

  _request(payload) {
    const self = this;
    return new Promise((resolve, reject) => {
      const id = payload.id || nanoid();
      payload.id = id;
      self.pending.set(id, { resolve, reject });
      if (!self.proc || !self.proc.stdin.writable) {
        self.pending.delete(id);
        reject(new Error("Python 内核未就绪"));
        return;
      }
      self.proc.stdin.write(JSON.stringify(payload) + "\n");
      // 超时保护
      setTimeout(() => {
        if (self.pending.has(id)) {
          self.pending.delete(id);
          reject(new Error("run_code 执行超时"));
        }
      }, 120000);
    });
  }

  async setContext(filePath) {
    await this.start();
    return this._request({ cmd: "set_context", file_path: filePath });
  }

  async runCode(code) {
    await this.start();
    const code_b64 = Buffer.from(code, "utf-8").toString("base64");
    return this._request({ code_b64 });
  }

  stop() {
    this._started = false;
    if (this.proc) {
      try { this.proc.kill(); } catch { /* ignore */ }
      this.proc = null;
    }
  }
}