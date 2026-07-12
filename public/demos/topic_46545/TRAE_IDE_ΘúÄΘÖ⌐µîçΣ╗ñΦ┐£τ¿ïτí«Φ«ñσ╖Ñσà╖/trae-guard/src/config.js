const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_CONFIG = {
  cdpPort: 9222,
  cdpPortRange: [9222, 9232],
  serverPort: 9223,
  pollIntervalMs: 1500,
  traeIdePath: null,
  autoLaunch: true,
  email: {
    enabled: true,
    from: '',
    to: '',
    password: '',
    smtpHost: '',
    smtpPort: 0,
    smtpSecure: null
  },
  tunnel: { enabled: true, subdomain: '' }
};

function getConfigPath() {
  const home = os.homedir();
  return path.join(home, '.trae-guard', 'config.json');
}

function normalizeConfig(cfg) {
  const out = deepMerge(DEFAULT_CONFIG, cfg || {});
  if (out.email && out.email.smtp) {
    const smtp = out.email.smtp;
    if (!out.email.from && smtp.auth && smtp.auth.user) out.email.from = smtp.auth.user;
    if (!out.email.password && smtp.auth && smtp.auth.pass) out.email.password = smtp.auth.pass;
    if (!out.email.smtpHost && smtp.host) out.email.smtpHost = smtp.host;
    if (!out.email.smtpPort && smtp.port) out.email.smtpPort = smtp.port;
    if (out.email.smtpSecure === null && smtp.secure !== undefined) out.email.smtpSecure = smtp.secure;
    delete out.email.smtp;
  }
  if (out.notifier && out.notifier.email) {
    const ne = out.notifier.email;
    if (!out.email.from && ne.from) out.email.from = ne.from;
    if (!out.email.to && ne.to) out.email.to = ne.to;
    if (!out.email.password && ne.smtpPass) out.email.password = ne.smtpPass;
    if (!out.email.smtpHost && ne.smtpHost) out.email.smtpHost = ne.smtpHost;
    if (!out.email.smtpPort && ne.smtpPort) out.email.smtpPort = ne.smtpPort;
    if (out.email.smtpSecure === null && ne.smtpSecure !== undefined) out.email.smtpSecure = ne.smtpSecure;
    delete out.notifier;
  }
  return out;
}

function loadConfig() {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG, _configPath: configPath, _exists: false };
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const userConfig = JSON.parse(raw);
    const merged = normalizeConfig(userConfig);
    return { ...merged, _configPath: configPath, _exists: true };
  } catch (e) {
    console.error('Failed to parse config file:', e.message);
    return { ...DEFAULT_CONFIG, _configPath: configPath, _exists: false, _error: e.message };
  }
}

function saveConfig(config) {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const toSave = normalizeConfig(config);
  delete toSave._configPath;
  delete toSave._exists;
  delete toSave._error;
  fs.writeFileSync(configPath, JSON.stringify(toSave, null, 2), 'utf8');
  return configPath;
}

function deepMerge(target, source) {
  const result = Array.isArray(target) ? target.slice() : { ...target };
  for (const key of Object.keys(source || {})) {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge(target[key] || {}, val);
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

function isEmailConfigured(config) {
  const e = config && config.email;
  if (!e || !e.enabled) return false;
  if (!e.from || !e.to || !e.password) return false;
  return true;
}

function loadProjectConfig() {
  const projectConfigPath = path.join(process.cwd(), 'config.json');
  if (fs.existsSync(projectConfigPath)) {
    try {
      const raw = fs.readFileSync(projectConfigPath, 'utf8');
      const userConfig = JSON.parse(raw);
      return normalizeConfig(userConfig);
    } catch (e) {
    }
  }
  return null;
}

module.exports = { loadConfig, saveConfig, getConfigPath, loadProjectConfig, DEFAULT_CONFIG, isEmailConfigured, normalizeConfig };
