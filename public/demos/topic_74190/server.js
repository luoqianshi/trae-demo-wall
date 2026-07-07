const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 8080;

const MIME = {
  'html': 'text/html; charset=utf-8',
  'css': 'text/css',
  'js': 'application/javascript',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'svg': 'image/svg+xml',
  'json': 'application/json',
};

function proxyFetch(targetUrl, clientRes, maxRedirects) {
  if (maxRedirects <= 0) {
    console.warn('[proxy] too many redirects:', targetUrl);
    clientRes.writeHead(502);
    clientRes.end('Too many redirects');
    return;
  }

  const parsed = new URL(targetUrl);
  const mod = parsed.protocol === 'https:' ? https : http;
  console.log('[proxy] fetching:', targetUrl);

  mod.get(targetUrl, (proxyRes) => {
    const status = proxyRes.statusCode;
    console.log('[proxy] status:', status, 'content-type:', proxyRes.headers['content-type']);

    if (status >= 300 && status < 400 && proxyRes.headers.location) {
      const redirectUrl = new URL(proxyRes.headers.location, targetUrl).href;
      console.log('[proxy] redirect to:', redirectUrl);
      proxyRes.resume();
      proxyFetch(redirectUrl, clientRes, maxRedirects - 1);
      return;
    }

    const contentType = proxyRes.headers['content-type'] || 'image/jpeg';
    clientRes.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=31536000',
    });
    proxyRes.pipe(clientRes);
  }).on('error', (err) => {
    console.warn('[proxy] fetch error:', err.message);
    clientRes.writeHead(502);
    clientRes.end('Proxy fetch failed');
  });
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

  // ---- Image Proxy (bypass CORS, follow redirects) ----
  if (reqUrl.pathname === '/proxy-image') {
    const imageUrl = reqUrl.searchParams.get('url');
    if (!imageUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing url parameter');
      return;
    }

    proxyFetch(imageUrl, res, 5);
    return;
  }

  // ---- Static file serving ----
  let filePath = path.join(__dirname, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404');
      return;
    }
    const ext = path.extname(filePath).slice(1);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));