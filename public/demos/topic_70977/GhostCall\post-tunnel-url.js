const fs = require('fs');
const http = require('http');

const LOG_FILE = process.argv[2] || 'cf.log';
const SERVER_URL = 'http://localhost:8080/api/tunnel-url';
const POLL_INTERVAL = 500; // ms
const TIMEOUT = 30000;     // 30s

const startTime = Date.now();
let lastSize = 0;

function postUrl(url) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ url });
    const req = http.request(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('[post-tunnel-url] URL posted to server:', url);
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function poll() {
  if (Date.now() - startTime > TIMEOUT) {
    console.error('[post-tunnel-url] Timeout: no tunnel URL found in', LOG_FILE);
    process.exit(0); // 不阻塞 start.bat 后续流程
  }

  try {
    const stat = fs.statSync(LOG_FILE);
    if (stat.size === lastSize) {
      setTimeout(poll, POLL_INTERVAL);
      return;
    }
    lastSize = stat.size;

    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const match = content.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match) {
      postUrl(match[0])
        .then(() => process.exit(0))
        .catch(err => {
          console.error('[post-tunnel-url] POST failed:', err.message);
          process.exit(0); // 不阻塞 start.bat 后续流程
        });
      return;
    }
  } catch (e) {
    // File may not exist yet
  }

  setTimeout(poll, POLL_INTERVAL);
}

console.log('[post-tunnel-url] Polling', LOG_FILE, '...');
poll();
