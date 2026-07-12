const nodemailer = require('nodemailer');
const chalk = require('chalk');
const { buildSmtpConfig, getPresetNote, getPresetName } = require('./email-presets');

const log = {
  info: (...args) => console.log(chalk.magenta('[notifier]'), ...args),
  warn: (...args) => console.log(chalk.yellow('[notifier]'), ...args),
  error: (...args) => console.log(chalk.red('[notifier]'), ...args),
  ok: (...args) => console.log(chalk.green('[notifier]'), ...args)
};

function createNotifier(config) {
  const emailConfig = (config && config.email) || {};
  const enabled = emailConfig.enabled !== false && emailConfig.from && emailConfig.to && emailConfig.password;

  function getTransport() {
    if (!enabled) return null;
    const overrides = {};
    if (emailConfig.smtpHost) overrides.host = emailConfig.smtpHost;
    if (emailConfig.smtpPort) overrides.port = emailConfig.smtpPort;
    if (emailConfig.smtpSecure !== null && emailConfig.smtpSecure !== undefined) {
      overrides.secure = !!emailConfig.smtpSecure;
    }
    const { config: smtpConfig, preset } = buildSmtpConfig(emailConfig.from, emailConfig.password, overrides);
    if (preset) {
      log.info(`Using ${preset.name} SMTP (${smtpConfig.host}:${smtpConfig.port})`);
    }
    return nodemailer.createTransport(smtpConfig);
  }

  async function testConnection() {
    if (!enabled) return { ok: false, reason: 'Email not configured' };
    try {
      const transport = getTransport();
      await transport.verify();
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e.message };
    }
  }

  async function sendTestEmail() {
    if (!enabled) return { ok: false, reason: 'Email not configured' };
    try {
      const transporter = getTransport();
      const presetName = getPresetName(emailConfig.from);
      const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif">
<div style="max-width:560px;margin:30px auto;background:#fff;border-radius:14px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="text-align:center;font-size:48px;margin-bottom:12px">🛡️</div>
  <h1 style="text-align:center;color:#2d3436;margin:0 0 8px;font-size:22px">Trae Guard 链接测试</h1>
  <p style="text-align:center;color:#636e72;font-size:14px;margin:0 0 24px">邮件配置验证成功</p>
  <div style="background:#d4edda;border-left:4px solid #00b894;padding:18px 22px;border-radius:8px;color:#006266;font-size:15px;line-height:1.8">
    用户您好，您已经在Trae Guard 中成功配置AI申请权限时的批复邮箱。感谢您的使用。
  </div>
  <div style="margin-top:24px;padding-top:20px;border-top:1px solid #eee;text-align:center;font-size:13px;color:#b2bec3">
    <div style="margin-bottom:6px">📧 发送方式: ${presetName}</div>
    <div>TRAE Guard · 远程审批监控工具</div>
  </div>
</div>
</body></html>`;

      await transporter.sendMail({
        from: emailConfig.from,
        to: emailConfig.to,
        subject: 'Trae Guard 链接测试',
        html
      });
      log.ok('Test email sent to', emailConfig.to);
      return { ok: true };
    } catch (e) {
      log.error('Failed to send test email:', e.message);
      return { ok: false, reason: e.message };
    }
  }

  async function sendEmail(dialog, urls) {
    if (!enabled) return false;
    try {
      const transporter = getTransport();
      const presetName = getPresetName(emailConfig.from);
      const presetNote = getPresetNote(emailConfig.from);

      const snippet = (dialog.cmdSnippet || '').trim();
      const snippetShort = snippet.length > 80 ? snippet.slice(0, 80) + '...' : snippet;
      const projectName = (dialog.projectName || '').trim();
      const displayName = projectName || dialog.instanceLabel || 'TRAE IDE';
      const fileName = (dialog.fileName || '').trim();
      const windowTitle = (dialog.windowTitle || '').trim();

      let subject;
      if (snippetShort) {
        subject = `[${displayName}] 需要批准: ${snippetShort}`;
      } else if (projectName) {
        subject = `[${displayName}] 有风险指令需要您确认`;
      } else {
        subject = `[TRAE Guard] Risk Command Approval Required`;
      }

      const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const safeMsg = (dialog.message || '').replace(/\n/g, '<br>');
      const safeSnippet = e(snippet);
      const approveLabel = e(dialog.approveBtnText || 'Approve');
      const denyLabel = e(dialog.denyBtnText || 'Deny');

      const fileBadge = fileName
        ? `<span style="display:inline-block;background:#81ecec;color:#006266;padding:3px 10px;border-radius:12px;font-size:12px;margin-left:6px">${e(fileName)}</span>`
        : '';
      const winMeta = windowTitle && windowTitle !== projectName
        ? `<div style="font-size:12px;color:#636e72;margin-top:6px;opacity:.8">🗔 ${e(windowTitle)}</div>`
        : '';
      const presetNoteHtml = presetNote
        ? `<div style="margin-top:10px;font-size:11px;color:#b2bec3;background:#f8f9fa;padding:8px 12px;border-radius:6px">📧 发送方式: ${e(presetName)}<br>${e(presetNote)}</div>`
        : '';
      const snippetBlock = safeSnippet
        ? `<div style="background:#fdcb6e33;border-left:4px solid #fdcb6e;padding:14px 18px;border-radius:8px;margin:18px 0;font-family:'SF Mono',Consolas,'Courier New',monospace;font-size:14px;word-break:break-all"><strong style="color:#2d3436">⚡ 待执行命令:</strong><br><span style="color:#2d3436">${safeSnippet}</span></div>`
        : '';

      const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
<div style="max-width:620px;margin:20px auto;background:#fff;border-radius:14px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="display:flex;align-items:center;flex-wrap:wrap;margin-bottom:6px">
    <span style="display:inline-block;background:#6c5ce7;color:#fff;padding:6px 14px;border-radius:20px;font-size:15px;font-weight:600">📁 ${e(displayName)}</span>
    ${fileBadge}
  </div>
  ${winMeta}
  <h1 style="color:#d63031;margin:16px 0 8px;font-size:22px">⚠ 需要您批准执行风险指令</h1>
  <p style="color:#636e72;font-size:14px;margin:0 0 8px">TRAE IDE 请求执行以下命令，请确认是否允许：</p>
  ${snippetBlock}
  <div style="margin:8px 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">对话框详情</div>
  <div style="background:#2d3436;color:#b2bec3;padding:16px 18px;border-radius:10px;font-family:'SF Mono',Consolas,monospace;font-size:13px;white-space:pre-wrap;word-break:break-all;max-height:280px;overflow:auto;line-height:1.6">${safeMsg}</div>
  <div style="margin:24px 0;display:flex;gap:12px;flex-wrap:wrap">
    <a href="${urls.approve}" style="flex:1;min-width:200px;text-align:center;display:inline-block;padding:16px 28px;background:#00b894;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px">✓ ${approveLabel}</a>
    <a href="${urls.deny}" style="flex:1;min-width:200px;text-align:center;display:inline-block;padding:16px 28px;background:#d63031;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px">✗ ${denyLabel}</a>
  </div>
  <div style="margin-top:18px;font-size:13px;color:#999;border-top:1px solid #eee;padding-top:16px;text-align:center">
    <a href="${urls.dashboard}" style="color:#6c5ce7;text-decoration:none">📋 打开审批面板</a>
    &nbsp;·&nbsp;
    <a href="${urls.view}" style="color:#6c5ce7;text-decoration:none">查看此请求</a>
  </div>
  ${presetNoteHtml}
</div>
</body></html>`;

      await transporter.sendMail({
        from: emailConfig.from,
        to: emailConfig.to,
        subject,
        html
      });
      log.ok('Email sent to', emailConfig.to, `(${presetName})`);
      return true;
    } catch (e) {
      log.error('Failed to send email:', e.message);
      return false;
    }
  }

  function notify(dialog, urls) {
    if (!enabled) {
      log.warn('Email not configured. Open in browser to approve/deny:');
      log.warn('  ' + (urls.view || urls.dashboard));
      return;
    }
    sendEmail(dialog, urls);
  }

  return { notify, testConnection, sendTestEmail, enabled };
}

module.exports = { createNotifier };
