const { createServer } = require('./src/server');
const { createNotifier } = require('./src/notifier');
const express = require('express');

const demoConfig = {
  serverPort: 19224,
  email: {
    enabled: true,
    from: 's**@********',
    to: 'm*@******',
    password: 'demo-pass-xxxx',
    smtpHost: '',
    smtpPort: 0,
    smtpSecure: null
  },
  tunnel: { enabled: false, subdomain: '' }
};

const mockDialog = {
  projectName: 'my-blog',
  fileName: 'package.json',
  windowTitle: 'package.json - my-blog - TRAE IDE',
  instanceLabel: 'my-blog',
  portLabel: '',
  title: 'Terminal Command',
  message: 'TRAE wants to execute the following command in the terminal:\n\n> npm install express nodemailer --save\n\nThis will install the "express" and "nodemailer" packages from npm and add them to your package.json dependencies.\n\nDirectory: C:\\Users\\dev\\projects\\my-blog',
  cmdSnippet: 'npm install express nodemailer --save',
  approveBtnText: 'Approve',
  denyBtnText: 'Deny',
  signature: 'mock1',
  requestId: 'demo001',
  page: { evaluate: async () => ({ clicked: true, found: true }) }
};

const mockDialog2 = {
  projectName: 'backend-api',
  fileName: 'db-init.js',
  windowTitle: 'db-init.js - backend-api - TRAE IDE',
  instanceLabel: 'backend-api',
  portLabel: '',
  title: 'Risky Command',
  message: 'WARNING: This command may delete files.\n\nTRAE wants to execute:\n\n> rm -rf ./tmp/cache && mkdir -p ./data/logs\n\nPlease review carefully before approving.',
  cmdSnippet: 'rm -rf ./tmp/cache && mkdir -p ./data/logs',
  approveBtnText: 'Allow Always',
  denyBtnText: 'Deny',
  signature: 'mock2',
  requestId: 'demo002',
  page: { evaluate: async () => ({ clicked: true, found: true }) }
};

const server = createServer(demoConfig, async ({ decision, dialog }) => {
  console.log(`[Demo] Clicked ${decision} for ${dialog.projectName}`);
});

const emailPreviewApp = express();
emailPreviewApp.get('/', (req, res) => {
  let capturedHtml = '';
  const origTransport = require('nodemailer').createTransport;
  require('nodemailer').createTransport = () => ({
    sendMail: async (opts) => { capturedHtml = opts.html; return { messageId: 'x' }; },
    verify: async () => true,
    close: () => {}
  });
  delete require.cache[require.resolve('./src/notifier')];
  const { createNotifier: makeN } = require('./src/notifier');
  const n = makeN(demoConfig);
  n.notify(mockDialog, {
    approve: '#approve',
    deny: '#deny',
    view: '#view',
    dashboard: 'http://127.0.0.1:19224/'
  });
  setTimeout(() => {
    require('nodemailer').createTransport = origTransport;
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>邮件预览 - TRAE Guard</title>
<style>
body{margin:0;padding:30px 20px;background:#333;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
h2{color:#fff;text-align:center;font-size:20px;margin-bottom:20px}
.phone{max-width:420px;margin:0 auto;background:#f5f5f5;border-radius:32px;padding:20px 12px;box-shadow:0 10px 40px rgba(0,0,0,.4)}
.phone-label{color:#b2bec3;text-align:center;font-size:12px;margin-bottom:12px}
.frame{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.2)}
.back{text-align:center;margin-top:20px}
.back a{color:#b2bec3;text-decoration:none;font-size:14px}
</style></head><body>
<h2>📧 邮件通知预览（手机收到的邮件效果）</h2>
<div class="phone">
<div class="phone-label">📱 手机邮件客户端</div>
<div class="frame">${capturedHtml}</div>
</div>
<div class="back"><a href="http://127.0.0.1:19224/">← 返回到审批面板</a></div>
</body></html>`);
  }, 200);
});

emailPreviewApp.listen(19225, () => {
  console.log('Email preview: http://127.0.0.1:19225/');
});

server.start().then(info => {
  console.log('Dashboard:', info.url);
  server.registerRequest(mockDialog);
  server.registerRequest(mockDialog2);
  console.log('Demo ready.');
  console.log(' - Dashboard (both requests):', info.url);
  console.log(' - Email preview: http://127.0.0.1:19225/');
});
