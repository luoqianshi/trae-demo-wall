const { chromium } = require('playwright');
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');
const os = require('os');
const chalk = require('chalk');

const log = {
  info: (...args) => console.log(chalk.cyan('[launcher]'), ...args),
  warn: (...args) => console.log(chalk.yellow('[launcher]'), ...args),
  error: (...args) => console.log(chalk.red('[launcher]'), ...args),
  ok: (...args) => console.log(chalk.green('[launcher]'), ...args)
};

function findTraeIdePath() {
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'TRAE IDE', 'TRAE IDE.exe'),
    path.join(process.env.PROGRAMFILES || '', 'TRAE IDE', 'TRAE IDE.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'TRAE IDE', 'TRAE IDE.exe'),
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'TRAE IDE', 'TRAE IDE.exe'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getPortPool(config) {
  if (Array.isArray(config.cdpPortRange) && config.cdpPortRange.length === 2) {
    const [start, end] = config.cdpPortRange;
    const ports = [];
    for (let p = start; p <= end; p++) ports.push(p);
    return ports;
  }
  return [config.cdpPort || 9222];
}

function isPortReady(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const tryConnect = () => {
      const socket = new net.Socket();
      let done = false;
      const cleanup = () => { if (!socket.destroyed) socket.destroy(); };
      socket.once('connect', () => { done = true; cleanup(); resolve(true); });
      socket.once('error', () => {
        cleanup();
        if (Date.now() - start >= timeout) resolve(false);
        else setTimeout(tryConnect, 150);
      });
      socket.connect({ host, port });
    };
    tryConnect();
  });
}

function waitForPortClosed(port, host = '127.0.0.1', timeout = 10000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const socket = new net.Socket();
      let done = false;
      const cleanup = () => { if (!socket.destroyed) socket.destroy(); };
      socket.once('connect', () => {
        done = true; cleanup();
        if (Date.now() - start >= timeout) resolve(false);
        else setTimeout(check, 500);
      });
      socket.once('error', () => { done = true; cleanup(); resolve(true); });
      socket.connect({ host, port });
    };
    check();
  });
}

async function scanUsedPorts(ports) {
  const used = [];
  for (const port of ports) {
    if (await isPortReady(port, '127.0.0.1', 500)) {
      used.push(port);
    }
  }
  return used;
}

async function findFreePort(ports) {
  for (const port of ports) {
    if (!await isPortReady(port, '127.0.0.1', 300)) {
      return port;
    }
  }
  return null;
}

function launchTraeIde(exePath, cdpPort) {
  return new Promise((resolve, reject) => {
    log.info(`Starting TRAE IDE on CDP port ${cdpPort}: ${exePath}`);
    const args = [`--remote-debugging-port=${cdpPort}`];
    const child = spawn(exePath, args, {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    child.on('error', reject);
    setTimeout(() => resolve(child), 1000);
  });
}

async function connectOverCDP(cdpPort) {
  const browserURL = `http://127.0.0.1:${cdpPort}`;
  try {
    const browser = await chromium.connectOverCDP(browserURL);
    return browser;
  } catch (e) {
    log.error(`CDP connection to port ${cdpPort} failed:`, e.message);
    return null;
  }
}

async function connectAllExisting(config) {
  const ports = getPortPool(config);
  const usedPorts = await scanUsedPorts(ports);
  const browsers = [];
  for (const port of usedPorts) {
    log.info(`Found existing CDP on port ${port}, connecting...`);
    const browser = await connectOverCDP(port);
    if (browser) {
      browsers.push({ browser, port, launched: false });
      log.ok(`Connected to existing TRAE IDE on port ${port}`);
    }
  }
  return browsers;
}

async function launchAndConnect(config) {
  if (config.autoLaunch === false) return null;
  const ports = getPortPool(config);
  const exePath = config.traeIdePath || findTraeIdePath();
  if (!exePath || !fs.existsSync(exePath)) {
    log.error('TRAE IDE executable not found. Please set "traeIdePath" in config.');
    log.info('Common paths:');
    log.info('  %LOCALAPPDATA%\\Programs\\TRAE IDE\\TRAE IDE.exe');
    return null;
  }

  const freePort = await findFreePort(ports);
  if (freePort === null) {
    log.warn(`All CDP ports in range ${ports[0]}-${ports[ports.length-1]} are in use. Cannot launch new instance.`);
    log.info('Close some TRAE IDE windows or extend cdpPortRange in config.');
    return null;
  }

  await launchTraeIde(exePath, freePort);

  log.info(`Waiting for CDP port ${freePort} to be ready...`);
  const ready = await isPortReady(freePort, '127.0.0.1', 30000);
  if (!ready) {
    log.error(`Timeout waiting for TRAE IDE to start on port ${freePort}.`);
    return null;
  }

  await new Promise(r => setTimeout(r, 2500));

  const browser = await connectOverCDP(freePort);
  if (!browser) return null;
  log.ok(`Launched and connected new TRAE IDE on port ${freePort}`);
  return { browser, port: freePort, launched: true };
}

async function launchExtraInstance(config) {
  const result = await launchAndConnect({ ...config, autoLaunch: true });
  return result;
}

function getBrowserInstanceId(browserEntry) {
  return `trae-${browserEntry.port}`;
}

function listPages(browser) {
  const pages = [];
  for (const ctx of browser.contexts()) {
    for (const page of ctx.pages()) {
      pages.push({ url: page.url(), title: page.title(), page });
    }
  }
  return pages;
}

function setupAutoDiscovery(config, initialKnownPorts, onNewBrowser) {
  const ports = getPortPool(config);
  const knownPorts = new Set(initialKnownPorts || []);
  const timer = setInterval(async () => {
    try {
      for (const port of ports) {
        if (knownPorts.has(port)) continue;
        if (await isPortReady(port, '127.0.0.1', 300)) {
          knownPorts.add(port);
          log.info(`Auto-discovery: new CDP port ${port} appeared, connecting...`);
          await new Promise(r => setTimeout(r, 1500));
          const browser = await connectOverCDP(port);
          if (browser) {
            log.ok(`Auto-connected to new TRAE IDE on port ${port}`);
            onNewBrowser({ browser, port, launched: false });
          } else {
            knownPorts.delete(port);
          }
        }
      }
    } catch (e) { /* ignore */ }
  }, 5000);
  return () => clearInterval(timer);
}

module.exports = {
  findTraeIdePath,
  getPortPool,
  isPortReady,
  findFreePort,
  scanUsedPorts,
  connectAllExisting,
  launchAndConnect,
  launchExtraInstance,
  connectOverCDP,
  getBrowserInstanceId,
  listPages,
  setupAutoDiscovery
};
