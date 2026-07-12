const express = require('express');
const localtunnel = require('localtunnel');
const os = require('os');
const chalk = require('chalk');
const { saveConfig, isEmailConfigured } = require('./config');
const { EMAIL_PRESETS, detectPresetByEmail, buildSmtpConfig } = require('./email-presets');

const log = {
  info: (...args) => console.log(chalk.cyan('[server]'), ...args),
  warn: (...args) => console.log(chalk.yellow('[server]'), ...args),
  error: (...args) => console.log(chalk.red('[server]'), ...args),
  ok: (...args) => console.log(chalk.green('[server]'), ...args)
};

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

function createServer(config, onDecision, onConfigSaved) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const pendingRequests = new Map();
  let tunnelInstance = null;
  let tunnelUrl = null;
  let httpServer = null;
  let currentConfig = { ...config };
  let setupComplete = isEmailConfigured(config);

  const COMMON_STYLE = `
*{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;background:#f0f2f5;color:#2d3436;margin:0}
a{text-decoration:none}
.container{max-width:640px;margin:0 auto;padding:20px}
.btn{display:inline-block;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;border:none;text-align:center;transition:all .15s}
.btn-primary{background:#6c5ce7;color:#fff}
.btn-primary:hover{background:#5a4bd1}
.btn-success{background:#00b894;color:#fff}
.btn-success:hover{background:#00a381}
.btn-danger{background:#d63031;color:#fff}
.btn-danger:hover{background:#b71c1c}
.btn-block{display:block;width:100%;padding:14px;font-size:16px;margin:8px 0}
.btn-outline{background:#fff;color:#6c5ce7;border:2px solid #6c5ce7}
.btn-outline:hover{background:#6c5ce7;color:#fff}
.footer{text-align:center;font-size:12px;color:#999;margin:24px 0}
h1{color:#2d3436;margin:0 0 8px;font-weight:700}
.card{background:#fff;border-radius:14px;padding:28px;margin:16px 0;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.muted{color:#999;font-size:13px}
.flex{display:flex}.flex-col{flex-direction:column}.gap{gap:12px}.center{align-items:center}.between{justify-content:space-between}
.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
.badge-purple{background:#6c5ce7;color:#fff}
.badge-yellow{background:#ffeaa7;color:#d63031}
.badge-green{background:#55efc4;color:#006266}
`;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function validEmail(e) {
    return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  function buildSetupPage(message = '', error = '') {
    const email = currentConfig.email || {};
    const preset = detectPresetByEmail(email.from);
    const presetName = preset ? preset.name : '';
    const presetNote = preset ? preset.note : '';
    const messageHtml = message ? `<div class="card" style="background:#d4edda;border-left:4px solid #00b894;color:#006266">${esc(message)}</div>` : '';
    const errorHtml = error ? `<div class="card" style="background:#fdd;border-left:4px solid #d63031;color:#d63031">${esc(error)}</div>` : '';

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRAE Guard · 邮箱配置</title>
<style>
${COMMON_STYLE}
input{width:100%;padding:12px 14px;border:2px solid #dfe6e9;border-radius:8px;font-size:15px;margin:6px 0 14px;box-sizing:border-box;transition:border-color .15s}
input:focus{outline:none;border-color:#6c5ce7}
label{display:block;font-size:13px;font-weight:600;color:#636e72;margin-top:8px}
.preset-card{background:#f8f9fa;padding:14px 16px;border-radius:8px;border-left:4px solid #6c5ce7;margin:14px 0;font-size:13px;line-height:1.6}
.preset-card.warn{border-left-color:#fdcb6e;background:#fff9e6}
.preset-unknown{color:#999;font-style:italic}
.tip{font-size:12px;color:#b2bec3;margin-top:-10px;margin-bottom:10px}
.logo{font-size:48px;text-align:center;margin-bottom:8px}
.subtitle{text-align:center;color:#636e72;margin-bottom:16px;font-size:14px}
.saved-badge{float:right}
.field-help{font-size:12px;color:#636e72;margin-top:-10px;margin-bottom:14px}
</style></head><body>
<div class="container">
  <div class="logo">🛡️</div>
  <h1 style="text-align:center">TRAE Guard 配置</h1>
  <p class="subtitle">配置邮箱以接收风险指令审批通知</p>
  ${setupComplete ? '<div style="text-align:center"><span class="badge badge-green">✓ 邮箱已配置，可直接开始监控</span></div>' : ''}
  ${messageHtml}
  ${errorHtml}
  <div class="card">
    <form method="POST" action="/api/save-config">
      <label>📤 发送邮箱 (From) <span class="saved-badge muted">用于发送审批通知</span></label>
      <input type="email" name="from" id="fromInput" placeholder="y*********@******" value="${esc(email.from || '')}" required autocomplete="email">
      <div id="presetInfo" class="${preset ? 'preset-card' : 'preset-unknown'}" style="${preset ? '' : 'display:none'}">
        ${preset ? `<strong>✅ 已识别: ${esc(presetName)}</strong><br>SMTP: <code>${esc(preset.host)}:${preset.port}</code>${presetNote ? '<br><span style="color:#d63031">⚠ ' + esc(presetNote) + '</span>' : ''}` : ''}
      </div>

      <label>🔐 邮箱授权码/密码 <span class="saved-badge muted">保存在本地</span></label>
      <input type="password" name="password" id="passInput" placeholder="${email.password ? '•••••••• (已保存，不修改可留空)' : '请输入授权码'}" autocomplete="current-password">
      <div class="field-help">⚠ 绝大多数邮箱（QQ、163、Gmail、iCloud等）需要使用<strong>授权码</strong>而非登录密码</div>

      <label>📥 接收邮箱 (To) <span class="saved-badge muted">审批通知发到这里</span></label>
      <input type="email" name="to" id="toInput" placeholder="y********@*********" value="${esc(email.to || '')}" required autocomplete="email">

      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
        <button type="button" class="btn btn-outline" id="testBtn" style="flex:1;min-width:140px">📧 测试并发送邮件</button>
        <button type="submit" class="btn btn-success" style="flex:2;min-width:200px">${setupComplete ? '✓ 确认并开始监控' : '保存并开始监控'}</button>
      </div>
      ${setupComplete ? '<div style="margin-top:8px"><button type="submit" name="skip" value="1" class="btn btn-block btn-primary" style="background:#636e72">保持现有配置，直接进入 →</button></div>' : ''}
    </form>
    <div id="testResult" style="margin-top:12px;font-size:13px"></div>
  </div>

  <div class="card" style="background:#f8f9fa">
    <strong style="font-size:14px">📋 支持的主流邮箱 (自动识别):</strong>
    <p class="muted" style="margin:8px 0 0">QQ邮箱 · 网易163/126 · Gmail · 新浪邮箱 · Apple iCloud · Outlook/Hotmail · 阿里云邮箱 · 搜狐邮箱 · 腾讯企业邮</p>
    <p class="muted" style="margin:6px 0 0">其他邮箱可手动配置 SMTP 服务器地址</p>
  </div>

  <div class="footer">TRAE Guard · 配置将保存在 ~/.trae-guard/config.json</div>
</div>
<script>
const presets = ${JSON.stringify(EMAIL_PRESETS)};
const fromInput = document.getElementById('fromInput');
const presetInfo = document.getElementById('presetInfo');
const passInput = document.getElementById('passInput');
const testBtn = document.getElementById('testBtn');
const testResult = document.getElementById('testResult');

function detectPreset(email) {
  if (!email || !email.includes('@')) return null;
  const domain = email.slice(email.lastIndexOf('@')+1).toLowerCase().trim();
  for (const p of presets) {
    if (p.domains.some(d => d === domain || domain.endsWith('.'+d))) return p;
  }
  return null;
}

function updatePreset() {
  const p = detectPreset(fromInput.value);
  if (p) {
    presetInfo.style.display = 'block';
    presetInfo.className = p.note ? 'preset-card warn' : 'preset-card';
    presetInfo.innerHTML = '<strong>✅ 已识别: ' + p.name + '</strong><br>SMTP: <code>' + p.host + ':' + p.port + '</code>' + (p.note ? '<br><span style="color:#d63031">⚠ ' + p.note + '</span>' : '');
  } else {
    presetInfo.style.display = 'none';
  }
}
fromInput.addEventListener('input', updatePreset);
updatePreset();

testBtn.addEventListener('click', async () => {
  const from = fromInput.value.trim();
  const password = passInput.value;
  const to = document.getElementById('toInput').value.trim();
  testResult.textContent = '正在测试连接并发送测试邮件...';
  testResult.style.color = '#636e72';
  try {
    const resp = await fetch('/api/test-email', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({from, password, to})
    });
    const data = await resp.json();
    if (data.ok) {
      testResult.style.color = '#00b894';
      if (data.emailSent) {
        testResult.innerHTML = '✓ 连接成功！测试邮件已发送到 <strong>' + to + '</strong>，请查收';
      } else if (data.mailError) {
        testResult.innerHTML = '✓ 连接成功，但发送测试邮件失败: ' + data.mailError;
      } else {
        testResult.textContent = '✓ 连接成功！';
      }
    } else {
      testResult.style.color = '#d63031';
      testResult.textContent = '✗ 连接失败: ' + (data.reason || '未知错误');
    }
  } catch(e) {
    testResult.style.color = '#d63031';
    testResult.textContent = '✗ 请求失败: ' + e.message;
  }
});
</script>
</body></html>`;
  }

  function buildDashboardPage(items) {
    const listHtml = items.length === 0
      ? `<div class="card" style="text-align:center;color:#999"><div style="font-size:40px;margin-bottom:8px">⏳</div><p style="font-size:16px;margin:0 0 8px">等待审批请求...</p><p style="color:#b2bec3;font-size:13px;margin:0">当 TRAE IDE 中出现需要确认的风险指令时，会自动显示在这里并发送邮件通知。</p></div>`
      : items.map(r => renderRequestCard(r, false)).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="3">
<title>TRAE Guard · 审批面板</title>
<style>
${COMMON_STYLE}
.project-badge{display:inline-block;background:#6c5ce7;color:#fff;padding:6px 14px;border-radius:20px;font-size:15px;font-weight:600;margin-right:6px}
.file-badge{display:inline-block;background:#81ecec;color:#006266;padding:3px 10px;border-radius:12px;font-size:12px}
.snippet{background:#fdcb6e33;border-left:4px solid #fdcb6e;padding:12px 16px;border-radius:8px;margin:14px 0;font-family:'SF Mono',Consolas,monospace;font-size:14px;word-break:break-all;color:#2d3436}
.cmd{background:#2d3436;color:#b2bec3;padding:16px;border-radius:10px;font-family:'SF Mono',Consolas,monospace;font-size:13px;white-space:pre-wrap;word-break:break-all;max-height:280px;overflow:auto;line-height:1.6;margin:12px 0}
.btn{padding:16px;border-radius:10px;font-size:17px;margin:8px 0}
.row{display:flex;gap:12px;margin-top:18px}
.row a{flex:1;margin:0}
.count{text-align:center;color:#666;margin-bottom:8px;font-size:14px}
.win-meta{font-size:12px;color:#636e72;margin-top:6px;opacity:.75;word-break:break-all}
.card-title{font-size:17px;font-weight:600;margin:12px 0 4px;color:#d63031}
.config-link{text-align:right;margin:10px 0 -6px}
.config-link a{color:#999;font-size:12px}
</style></head><body>
<div class="container">
  <h1 style="text-align:center">🛡️ TRAE Guard</h1>
  <div class="config-link"><a href="/setup">⚙ 修改邮箱配置</a></div>
  ${items.length > 0 ? `<div class="count">${items.length} 个待处理请求</div>` : ''}
  ${listHtml}
  <div class="footer">每3秒自动刷新 · ${new Date().toLocaleTimeString()}</div>
</div>
</body></html>`;
  }

  function renderRequestCard(r, isFullPage) {
    const { id, dialog } = r;
    const projectName = (dialog.projectName || '').trim();
    const fileName = (dialog.fileName || '').trim();
    const instanceLabel = dialog.instanceLabel || '';
    const displayName = projectName || instanceLabel || 'TRAE IDE';
    const windowTitle = (dialog.windowTitle || '').trim();
    const message = esc(dialog.message || '(No message content)');
    const snippet = dialog.cmdSnippet ? esc(dialog.cmdSnippet) : '';
    const approveLabel = esc(dialog.approveBtnText || 'Approve');
    const denyLabel = esc(dialog.denyBtnText || 'Deny');
    const portLabel = dialog.portLabel || '';

    const fileBadge = fileName ? `<span class="file-badge">${esc(fileName)}</span>` : '';
    const portMeta = (portLabel && projectName && instanceLabel.includes(portLabel))
      ? ''
      : (portLabel ? `<div class="win-meta">${esc(portLabel)}</div>` : '');
    const winMeta = (windowTitle && windowTitle !== projectName && windowTitle !== instanceLabel)
      ? `<div class="win-meta">🗔 ${esc(windowTitle)}</div>`
      : '';
    const snippetHtml = snippet ? `<div class="snippet">⚡ ${snippet}</div>` : '';
    const cmdBlock = isFullPage
      ? `<div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin:10px 0 4px">对话框详情</div><div class="cmd">${message}</div>`
      : `<details><summary style="cursor:pointer;color:#6c5ce7;font-size:13px;margin:10px 0">查看完整对话框内容</summary><div class="cmd">${message}</div></details>`;

    return `<div class="card">
  <div style="display:flex;align-items:center;flex-wrap:wrap">
    <span class="project-badge">📁 ${esc(displayName)}</span>
    ${fileBadge}
  </div>
  ${portMeta}
  ${winMeta}
  <div class="card-title">⚠ 需要您批准执行风险指令</div>
  ${snippetHtml}
  ${cmdBlock}
  <div class="row">
    <a class="btn btn-success" href="/approve/${id}">✓ ${approveLabel}</a>
    <a class="btn btn-danger" href="/deny/${id}">✗ ${denyLabel}</a>
  </div>
</div>`;
  }

  function buildResultPage(action, req_) {
    const isApprove = action === 'approved';
    const color = isApprove ? '#00b894' : '#d63031';
    const icon = isApprove ? '✓' : '✗';
    const msg = isApprove ? '已批准执行' : '已拒绝执行';
    const projectName = req_ && req_.dialog && req_.dialog.projectName;
    const projectLine = projectName
      ? `<p style="color:#6c5ce7;font-weight:600;margin:8px 0">📁 ${esc(projectName)}</p>`
      : '';
    const snippet = req_ && req_.dialog && req_.dialog.cmdSnippet
      ? `<p style="color:#666;font-family:Consolas,monospace;font-size:13px;background:#f0f0f0;padding:12px;border-radius:8px;word-break:break-all">${esc(req_.dialog.cmdSnippet)}</p>`
      : '';
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRAE Guard - ${msg}</title>
<style>${COMMON_STYLE}
body{text-align:center}.big{font-size:64px;margin:20px 0 0;color:${color}}.msg{font-size:22px;color:${color};margin:8px 0}
</style></head><body>
<div class="container">
  <div class="card">
    <div class="big">${icon}</div>
    <h2 class="msg">${msg}</h2>
    ${projectLine}
    ${snippet}
    <p style="color:#636e72">操作已发送至 TRAE IDE。</p>
    <p style="margin-top:20px"><a class="btn btn-primary" href="/">← 返回审批面板</a></p>
  </div>
</div>
</body></html>`;
  }

  app.get('/setup', (req, res) => {
    res.send(buildSetupPage());
  });

  app.get('/', (req, res) => {
    if (!setupComplete) return res.redirect('/setup');
    const items = Array.from(pendingRequests.values());
    res.send(buildDashboardPage(items));
  });

  app.get('/request/:id', (req, res) => {
    const id = req.params.id;
    const req_ = pendingRequests.get(id);
    if (!req_) {
      return res.status(404).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>已过期</title><style>${COMMON_STYLE}</style></head><body><div class="container"><div class="card" style="text-align:center"><h2>请求不存在或已处理</h2><p style="color:#999">这个审批请求已经被处理过或已过期。</p><a class="btn btn-primary" href="/">← 返回面板</a></div></div></body></html>`);
    }
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TRAE Guard - 需要批准</title><style>${COMMON_STYLE}
h2.pt{color:#d63031;text-align:center;font-size:20px}
.project-badge{display:inline-block;background:#6c5ce7;color:#fff;padding:6px 14px;border-radius:20px;font-size:15px;font-weight:600}
.win-meta{font-size:12px;color:#636e72;margin:8px 0;opacity:.75;word-break:break-all}
.snippet{background:#fdcb6e33;border-left:4px solid #fdcb6e;padding:12px 16px;border-radius:8px;margin:14px 0;font-family:Consolas,monospace;font-size:14px;word-break:break-all;color:#2d3436}
.cmd{background:#2d3436;color:#b2bec3;padding:16px;border-radius:10px;font-family:Consolas,monospace;font-size:13px;white-space:pre-wrap;word-break:break-all;max-height:400px;overflow:auto;line-height:1.6;margin:12px 0}
.btn{padding:16px;border-radius:10px;font-size:17px;flex:1;margin:0;text-align:center}
.row{display:flex;gap:12px;margin-top:18px}
</style></head><body>
<div class="container">
<h2 class="pt">⚠ 指令审批</h2>
${renderRequestCard(req_, true)}
<div class="footer"><a href="/" style="color:#6c5ce7">返回面板</a> · Request ID: ${id}</div>
</div>
</body></html>`);
  });

  app.post('/api/save-config', async (req, res) => {
    try {
      const { from, to, password, skip } = req.body || {};

      if (skip === '1') {
        setupComplete = true;
        return res.redirect('/');
      }

      const trimmedFrom = (from || '').trim();
      const trimmedTo = (to || '').trim();

      if (!validEmail(trimmedFrom)) {
        return res.send(buildSetupPage('', '发送邮箱格式不正确'));
      }
      if (!validEmail(trimmedTo)) {
        return res.send(buildSetupPage('', '接收邮箱格式不正确'));
      }

      const newPassword = (password || '').trim();
      const oldEmail = currentConfig.email || {};
      const finalPassword = newPassword || oldEmail.password || '';
      if (!finalPassword) {
        return res.send(buildSetupPage('', '请输入邮箱授权码/密码'));
      }

      const preset = detectPresetByEmail(trimmedFrom);
      const newEmailCfg = {
        enabled: true,
        from: trimmedFrom,
        to: trimmedTo,
        password: finalPassword,
        smtpHost: (preset && preset.host) || oldEmail.smtpHost || '',
        smtpPort: (preset && preset.port) || oldEmail.smtpPort || 0,
        smtpSecure: preset ? !!preset.secure : (oldEmail.smtpSecure !== undefined ? oldEmail.smtpSecure : null)
      };

      currentConfig.email = newEmailCfg;
      saveConfig(currentConfig);

      const { createNotifier } = require('./notifier');
      const testNotifier = createNotifier(currentConfig);
      const test = await testNotifier.testConnection();
      if (!test.ok) {
        currentConfig.email = oldEmail;
        saveConfig(currentConfig);
        return res.send(buildSetupPage('', `SMTP连接失败: ${test.reason}。请检查授权码是否正确，或确认邮箱已开启SMTP服务。`));
      }

      setupComplete = true;
      if (onConfigSaved) onConfigSaved(currentConfig);
      res.redirect('/');
    } catch (e) {
      res.status(500).send(buildSetupPage('', '保存失败: ' + e.message));
    }
  });

  app.post('/api/test-email', async (req, res) => {
    try {
      const { from, to, password } = req.body || {};
      const oldEmail = currentConfig.email || {};
      const finalPassword = (password || '').trim() || oldEmail.password || '';
      if (!validEmail(from) || !validEmail(to) || !finalPassword) {
        return res.json({ ok: false, reason: '请填写完整的邮箱和密码/授权码' });
      }
      const { createNotifier } = require('./notifier');
      const testCfg = {
        ...currentConfig,
        email: {
          enabled: true,
          from: from.trim(),
          to: to.trim(),
          password: finalPassword,
          smtpHost: '',
          smtpPort: 0,
          smtpSecure: null
        }
      };
      const tn = createNotifier(testCfg);
      const result = await tn.testConnection();
      if (!result.ok) {
        return res.json(result);
      }
      const mailResult = await tn.sendTestEmail();
      if (mailResult.ok) {
        return res.json({ ok: true, emailSent: true });
      }
      return res.json({ ok: true, emailSent: false, mailError: mailResult.reason });
    } catch (e) {
      res.json({ ok: false, reason: e.message });
    }
  });

  app.get('/approve/:id', async (req, res) => {
    const id = req.params.id;
    const req_ = pendingRequests.get(id);
    if (!req_) return res.status(404).send('请求不存在或已处理。');
    pendingRequests.delete(id);
    log.ok(`Decision: APPROVE for request ${id}`);
    try {
      await onDecision({ decision: 'approve', dialog: req_.dialog, requestId: id });
      res.send(buildResultPage('approved', req_));
    } catch (e) {
      log.error('Error executing approve:', e.message);
      res.status(500).send('执行操作失败: ' + e.message);
    }
  });

  app.get('/deny/:id', async (req, res) => {
    const id = req.params.id;
    const req_ = pendingRequests.get(id);
    if (!req_) return res.status(404).send('请求不存在或已处理。');
    pendingRequests.delete(id);
    log.ok(`Decision: DENY for request ${id}`);
    try {
      await onDecision({ decision: 'deny', dialog: req_.dialog, requestId: id });
      res.send(buildResultPage('denied', req_));
    } catch (e) {
      log.error('Error executing deny:', e.message);
      res.status(500).send('执行操作失败: ' + e.message);
    }
  });

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  async function start() {
    return new Promise((resolve, reject) => {
      httpServer = app.listen(config.serverPort, '127.0.0.1', async () => {
        const port = httpServer.address().port;
        log.ok(`Server listening on http://127.0.0.1:${port}`);
        const ips = getLocalIPs();
        let tunnelStarted = false;
        if (config.tunnel && config.tunnel.enabled && setupComplete) {
          try {
            tunnelInstance = await localtunnel({ port, subdomain: config.tunnel.subdomain || undefined });
            tunnelUrl = tunnelInstance.url;
            log.ok(`Public tunnel URL: ${tunnelUrl}`);
            tunnelInstance.on('error', err => log.error('Tunnel error:', err.message));
            tunnelInstance.on('close', () => { log.warn('Tunnel closed'); tunnelUrl = null; });
            tunnelStarted = true;
          } catch (e) {
            log.warn('Failed to create localtunnel, using LAN only:', e.message);
          }
        }
        resolve({ port, url: `http://127.0.0.1:${port}`, publicUrl: tunnelUrl, lanIps: ips, setupComplete });
      });
      httpServer.on('error', reject);
    });
  }

  function registerRequest(dialog) {
    const id = generateId();
    pendingRequests.set(id, { id, dialog, createdAt: Date.now() });
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        log.warn(`Request ${id} expired (no decision in 10 minutes)`);
        pendingRequests.delete(id);
      }
    }, 10 * 60 * 1000);
    return id;
  }

  function getRequestUrl(id) {
    const base = tunnelUrl || `http://127.0.0.1:${config.serverPort}`;
    return {
      approve: `${base}/approve/${id}`,
      deny: `${base}/deny/${id}`,
      view: `${base}/request/${id}`,
      dashboard: base,
      base
    };
  }

  function updateConfig(newCfg) {
    currentConfig = { ...newCfg };
    setupComplete = isEmailConfigured(newCfg);
  }

  function isSetupComplete() {
    return setupComplete;
  }

  async function ensureTunnel() {
    if (tunnelUrl || !config.tunnel || !config.tunnel.enabled) return tunnelUrl;
    try {
      const port = httpServer.address().port;
      tunnelInstance = await localtunnel({ port, subdomain: config.tunnel.subdomain || undefined });
      tunnelUrl = tunnelInstance.url;
      log.ok(`Public tunnel URL: ${tunnelUrl}`);
      tunnelInstance.on('error', err => log.error('Tunnel error:', err.message));
      tunnelInstance.on('close', () => { log.warn('Tunnel closed'); tunnelUrl = null; });
      return tunnelUrl;
    } catch (e) {
      log.warn('Failed to create localtunnel:', e.message);
      return null;
    }
  }

  async function stop() {
    if (tunnelInstance) {
      try { tunnelInstance.close(); } catch (e) {}
      tunnelInstance = null;
    }
    if (httpServer) {
      return new Promise(resolve => httpServer.close(() => resolve()));
    }
  }

  return { start, stop, registerRequest, getRequestUrl, updateConfig, isSetupComplete, ensureTunnel };
}

module.exports = { createServer };
