const EMAIL_PRESETS = [
  {
    name: 'QQ邮箱',
    domains: ['qq.com', 'foxmail.com', 'vip.qq.com'],
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    note: 'QQ邮箱需使用"授权码"而非登录密码。开启方式：QQ邮箱 → 设置 → 账户 → POP3/IMAP/SMTP服务 → 开启后获取授权码'
  },
  {
    name: '网易163邮箱',
    domains: ['163.com', '126.com', 'yeah.net', '188.com'],
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    note: '163邮箱需使用"客户端授权密码"。开启方式：163邮箱 → 设置 → POP3/SMTP/IMAP → 开启后设置授权密码'
  },
  {
    name: 'Gmail (Google)',
    domains: ['gmail.com', 'googlemail.com'],
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    note: 'Gmail需使用"应用专用密码"（需开启两步验证），或开启"不太安全的应用访问"（不推荐）'
  },
  {
    name: '新浪邮箱',
    domains: ['sina.com', 'sina.cn', 'vip.sina.com'],
    host: 'smtp.sina.com',
    port: 465,
    secure: true,
    note: '新浪邮箱需在设置中开启SMTP服务，部分账号需使用客户端授权码'
  },
  {
    name: 'Apple iCloud邮箱',
    domains: ['icloud.com', 'me.com', 'mac.com'],
    host: 'smtp.mail.me.com',
    port: 587,
    secure: false,
    requireTLS: true,
    note: 'iCloud邮箱需使用"App专用密码"。在 appleid.apple.com → 安全 → App专用密码 生成'
  },
  {
    name: 'Outlook/Hotmail',
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'outlook.cn'],
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    requireTLS: true,
    note: '使用Microsoft账户密码即可；若开启两步验证，需使用应用密码'
  },
  {
    name: '阿里云邮箱',
    domains: ['aliyun.com', 'alibaba-inc.com'],
    host: 'smtp.aliyun.com',
    port: 465,
    secure: true,
    note: ''
  },
  {
    name: '搜狐邮箱',
    domains: ['sohu.com'],
    host: 'smtp.sohu.com',
    port: 465,
    secure: true,
    note: ''
  },
  {
    name: '企业微信邮箱(腾讯企业邮)',
    domains: ['exmail.qq.com'],
    host: 'smtp.exmail.qq.com',
    port: 465,
    secure: true,
    note: '腾讯企业邮箱使用企业邮箱账号密码或客户端专用密码'
  }
];

function detectPresetByEmail(email) {
  if (!email) return null;
  const atIdx = email.lastIndexOf('@');
  if (atIdx < 0) return null;
  const domain = email.slice(atIdx + 1).toLowerCase().trim();
  for (const p of EMAIL_PRESETS) {
    if (p.domains.some(d => d === domain || domain.endsWith('.' + d))) {
      return p;
    }
  }
  return null;
}

function buildSmtpConfig(email, password, overrides = {}) {
  const preset = detectPresetByEmail(email);
  const base = preset ? {
    host: preset.host,
    port: preset.port,
    secure: preset.secure,
    requireTLS: preset.requireTLS || false,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000
  } : {
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    requireTLS: false,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000
  };
  const config = { ...base, ...overrides };
  if (overrides.tls) {
    config.tls = { ...base.tls, ...overrides.tls };
  }
  if (email && password) {
    config.auth = { user: email.trim(), pass: password };
  }
  return { config, preset };
}

function getPresetNote(email) {
  const preset = detectPresetByEmail(email);
  return preset ? preset.note : '';
}

function getPresetName(email) {
  const preset = detectPresetByEmail(email);
  return preset ? preset.name : '其他邮箱';
}

module.exports = {
  EMAIL_PRESETS,
  detectPresetByEmail,
  buildSmtpConfig,
  getPresetNote,
  getPresetName
};
