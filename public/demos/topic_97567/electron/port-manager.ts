import * as net from 'net';

/**
 * 查找一个可用的 TCP 端口。
 * 从 3000 开始尝试，最多尝试 50 个端口。
 * 如果全部占用则抛出错误。
 */
export async function findAvailablePort(startPort = 3000, maxAttempts = 50): Promise<number> {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    const tryPort = (port: number) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => {
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error(`无法找到可用端口（尝试了 ${maxAttempts} 次）`));
          return;
        }
        currentPort++;
        tryPort(currentPort);
      });
      server.listen(port, '127.0.0.1', () => {
        server.close(() => resolve(port));
      });
    };

    tryPort(currentPort);
  });
}
