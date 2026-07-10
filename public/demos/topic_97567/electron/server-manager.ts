import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as http from 'http';

export interface ServerHandle {
  process: ChildProcess;
  port: number;
  url: string;
}

/**
 * 等待服务器在指定端口就绪。
 * 每 200ms 轮询一次，最多等待 30 秒。
 */
async function waitForServer(port: number, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await checkPort(port);
    if (ready) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`服务器在 ${timeoutMs}ms 内未就绪（端口 ${port}）`);
}

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      res.resume();
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * 启动 Next.js standalone 服务器。
 *
 * 生产环境：从打包资源中启动 server.js
 * 开发环境：直接运行 `next dev`
 *
 * @param port 服务器监听端口
 * @param dataFile 本地数据文件路径（通过 LOCAL_DB_FILE 环境变量传递）
 * @param isDev 是否为开发模式
 */
export async function startServer(
  port: number,
  dataFile: string,
  isDev = false,
): Promise<ServerHandle> {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: '127.0.0.1',
    LOCAL_DB_FILE: dataFile,
    NODE_ENV: isDev ? 'development' : 'production',
  };

  // 生产模式下 process.execPath 指向 Electron 可执行文件，
  // 需要设置 ELECTRON_RUN_AS_NODE=1 让其以纯 Node.js 模式运行 server.js
  if (!isDev) {
    env.ELECTRON_RUN_AS_NODE = '1';
  }

  let child: ChildProcess;

  if (isDev) {
    // 开发模式：使用 next dev（需要项目根目录）
    child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', String(port)], {
      env,
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } else {
    // 生产模式：启动 standalone 服务器
    const serverPath = path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js');
    child = spawn(process.execPath, [serverPath], {
      env,
      cwd: path.dirname(serverPath),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  // 转发服务器日志到主进程 stdout/stderr，便于调试
  child.stdout?.on('data', (data) => {
    console.log(`[next-server] ${data.toString().trim()}`);
  });
  child.stderr?.on('data', (data) => {
    console.error(`[next-server] ${data.toString().trim()}`);
  });

  child.on('exit', (code) => {
    console.log(`[next-server] 进程退出，退出码 ${code}`);
  });

  child.on('error', (err) => {
    console.error(`[next-server] 进程错误: ${err.message}`);
  });

  await waitForServer(port);

  return {
    process: child,
    port,
    url: `http://127.0.0.1:${port}`,
  };
}

/**
 * 停止 Next.js 服务器。
 */
export function stopServer(server: ServerHandle | null): void {
  if (!server) return;
  try {
    if (!server.process.killed) {
      server.process.kill('SIGTERM');
      // 强制兜底：1 秒后若仍未退出则 SIGKILL
      setTimeout(() => {
        try {
          if (!server.process.killed) {
            server.process.kill('SIGKILL');
          }
        } catch {
          // 进程可能已退出，忽略
        }
      }, 1000);
    }
  } catch (e) {
    console.error('[server-manager] 停止服务器失败:', e);
  }
}
