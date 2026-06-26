#!/usr/bin/env node
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

const { loadConfig, saveConfig, getConfigPath, loadProjectConfig, isEmailConfigured } = require('./config');
const {
  findTraeIdePath,
  getPortPool,
  connectAllExisting,
  launchAndConnect,
  launchExtraInstance,
  setupAutoDiscovery,
  listPages
} = require('./launcher');
const { startMonitoringMulti, snapshotAllPages } = require('./monitor');
const { createServer } = require('./server');
const { createNotifier } = require('./notifier');
const { executeAction } = require('./action');

const BANNER = String.raw`
 _____              ____                     _
|_   _| __ __ _  ___/ ___|_   _  __ _ _ __ __| |
  | || '__/ _\` |/ _ \___ \| | | |/ _\` | '__/ _\` |
  | || | | (_| |  __/___) | |_| | (_| | | | (_| |
  |_||_|  \__,_|\___|____/ \__,_|\__,_|_|  \__,_|
  Remote Approval Monitor for TRAE IDE
`;

function printBanner() {
  console.log(chalk.magenta(BANNER));
}

function openBrowser(url) {
  try {
    const cmd = process.platform === 'win32' ? 'start ""' :
                process.platform === 'darwin' ? 'open' : 'xdg-open';
    cp.exec(`${cmd} "${url}"`, () => {});
  } catch (e) {
  }
}

let monitorInstance = null;
let notifierInstance = null;
let serverInstance = null;
let serverInfo = null;
let currentConfig = null;
let autoDiscoveryStopper = null;
let browserOpened = false;

function cleanupAndExit(code = 0) {
  console.log(chalk.yellow('\nShutting down...'));
  if (monitorInstance) { try { monitorInstance.stop(); } catch (e) {} }
  if (autoDiscoveryStopper) { try { autoDiscoveryStopper(); } catch (e) {} }
  if (serverInstance) { try { serverInstance.stop(); } catch (e) {} }
  process.exit(code);
}

async function startMonitoring(configOverride) {
  if (monitorInstance) return;
  const config = configOverride || currentConfig;
  currentConfig = config;

  const ports = getPortPool(config);
  console.log(chalk.white(`CDP port pool: ${ports[0]}-${ports[ports.length-1]} (${ports.length} slots)`));

  notifierInstance = createNotifier(config);
  const emailEnabled = notifierInstance.enabled;
  if (emailEnabled) {
    console.log(chalk.green('✓ Email notifications enabled.'));
  } else {
    console.log(chalk.gray('Email not configured — use web panel for decisions.'));
  }

  const existing = await connectAllExisting(config);
  let launched = [];
  if (existing.length > 0) {
    console.log(chalk.green(`Found ${existing.length} already-running TRAE IDE instance(s) with CDP enabled.`));
  } else if (config.autoLaunch !== false) {
    console.log(chalk.cyan('No existing TRAE IDE detected, auto-launching one...'));
    const newEntry = await launchAndConnect(config);
    if (newEntry) launched = [newEntry];
  }
  const allEntries = [...existing, ...launched];

  if (allEntries.length === 0) {
    console.log(chalk.red('No TRAE IDE instances available.'));
    console.log(chalk.yellow('Make sure TRAE IDE is installed or set traeIdePath in config.'));
    return;
  }

  for (const entry of allEntries) {
    entry.browser.on('disconnected', () => {
      console.log(chalk.yellow(`\n[port-${entry.port}] TRAE IDE window closed.`));
    });
  }

  const knownPorts = allEntries.map(e => e.port);
  autoDiscoveryStopper = setupAutoDiscovery(config, knownPorts, (newEntry) => {
    newEntry.browser.on('disconnected', () => {
      console.log(chalk.yellow(`\n[port-${newEntry.port}] TRAE IDE window closed.`));
    });
    if (monitorInstance) monitorInstance.addBrowser(newEntry);
    console.log(chalk.green(`Auto-connected new TRAE IDE instance on port ${newEntry.port}`));
  });

  const handleDialog = async (dialog) => {
    const id = serverInstance.registerRequest(dialog);
    const urls = serverInstance.getRequestUrl(id);
    const tag = dialog.instanceLabel ? `[${dialog.instanceLabel}] ` : '';
    console.log(chalk.yellow(`\n⚠ ${tag}New approval request: ${id}`));
    if (dialog.cmdSnippet) console.log(chalk.white('   Command:', dialog.cmdSnippet));
    console.log(chalk.gray(`   View: ${urls.view}`));
    if (notifierInstance && notifierInstance.enabled) {
      notifierInstance.notify(dialog, urls);
    }
  };

  const initialBrowserEntries = allEntries.slice();
  monitorInstance = startMonitoringMulti(initialBrowserEntries, config, handleDialog);

  console.log(chalk.dim('─'.repeat(60)));
  console.log(chalk.green(`\n✓ TRAE Guard is monitoring ${allEntries.length} TRAE IDE instance(s)!`));
  console.log(chalk.white(`  Local panel: ${serverInfo.url}`));
  if (serverInfo.publicUrl) {
    console.log(chalk.green(`  Public URL (phone): ${serverInfo.publicUrl}`));
  } else if (config.tunnel && config.tunnel.enabled && notifierInstance && notifierInstance.enabled) {
    const pubUrl = await serverInstance.ensureTunnel();
    if (pubUrl) console.log(chalk.green(`  Public URL (phone): ${pubUrl}`));
  }
  if (serverInfo.lanIps && serverInfo.lanIps.length > 0) {
    console.log(chalk.gray(`  LAN (same WiFi): http://${serverInfo.lanIps[0]}:${config.serverPort}`));
  }
  console.log(chalk.cyan(`  Open new TRAE window: trae-guard new`));
  console.log(chalk.gray('  Press Ctrl+C to stop'));
  console.log(chalk.dim('─'.repeat(60)));
}

async function cmdStart() {
  printBanner();
  const projectCfg = loadProjectConfig();
  const fileCfg = loadConfig();
  currentConfig = projectCfg || fileCfg;

  const ports = getPortPool(currentConfig);
  console.log(chalk.white(`CDP port pool: ${ports[0]}-${ports[ports.length-1]}`));

  serverInstance = createServer(currentConfig, async ({ decision, dialog }) => {
    try {
      await executeAction(dialog.page, decision, dialog);
    } catch (e) {
      console.error(chalk.red('Failed to execute action:'), e.message);
    }
  }, (newConfig) => {
    currentConfig = newConfig;
    serverInstance.updateConfig(newConfig);
    saveConfig(newConfig);
    console.log(chalk.green('✓ Email configuration saved.'));
    if (!monitorInstance) {
      console.log(chalk.cyan('Starting monitoring...'));
      startMonitoring(newConfig);
    } else {
      notifierInstance = createNotifier(newConfig);
    }
  });

  serverInfo = await serverInstance.start();
  console.log(chalk.dim('─'.repeat(60)));

  process.on('SIGINT', () => cleanupAndExit(0));
  process.on('SIGTERM', () => cleanupAndExit(0));

  const setupNeeded = !isEmailConfigured(currentConfig);
  const setupUrl = setupNeeded ? `${serverInfo.url}/setup` : serverInfo.url;

  if (setupNeeded) {
    console.log(chalk.cyan('\n⚙ First run — opening email setup wizard in browser...'));
    console.log(chalk.white(`  If browser doesn't open automatically, visit: ${setupUrl}`));
    console.log(chalk.gray('  After configuration, monitoring will start automatically.'));
  } else {
    console.log(chalk.green('\n✓ Existing configuration detected.'));
    const email = currentConfig.email || {};
    if (email.from) console.log(chalk.gray(`  From/To: ${email.from} → ${email.to}`));
    console.log(chalk.white(`  Dashboard: ${setupUrl}`));
    startMonitoring(currentConfig);
  }

  if (!browserOpened) {
    browserOpened = true;
    setTimeout(() => openBrowser(setupUrl), 800);
  }
}

async function cmdNew() {
  const projectCfg = loadProjectConfig();
  const fileCfg = loadConfig();
  const config = projectCfg || fileCfg;
  const result = await launchExtraInstance(config);
  if (result) {
    console.log(chalk.green(`\n✓ New TRAE IDE launched on port ${result.port}`));
    console.log(chalk.gray('If TRAE Guard is running, it will auto-detect this new instance.'));
  } else {
    console.log(chalk.red('Failed to launch new TRAE IDE instance.'));
    process.exit(1);
  }
}

async function cmdInspect() {
  printBanner();
  const projectCfg = loadProjectConfig();
  const fileCfg = loadConfig();
  const config = projectCfg || fileCfg;

  const existing = await connectAllExisting(config);
  const allEntries = existing.length > 0 ? existing : [await launchAndConnect(config)].filter(Boolean);

  if (allEntries.length === 0) {
    console.log(chalk.red('No TRAE IDE instances found.'));
    process.exit(1);
  }

  for (const entry of allEntries) {
    console.log(chalk.white(`\n${'='.repeat(60)}`));
    console.log(chalk.cyan(`TRAE IDE instance on port ${entry.port}:`));
    const pages = listPages(entry.browser);
    console.log(chalk.gray(`Windows/pages: ${pages.length}`));
    pages.forEach((p, i) => {
      console.log(chalk.gray(`  [${i}] ${p.title || '(no title)'}`));
      console.log(chalk.gray(`       ${p.url}`));
    });

    console.log(chalk.cyan(`UI snapshot (buttons + dialogs):`));
    const snapshots = await snapshotAllPages(entry.browser);
    snapshots.forEach((s, i) => {
      console.log(chalk.white(`\n--- Page ${i}: ${s.title} ---`));
      console.log(chalk.gray(`URL: ${s.url}`));
      if (s.error) { console.log(chalk.red(`Error: ${s.error}`)); return; }
      if (s.dialogs && s.dialogs.length > 0) {
        console.log(chalk.yellow(`Dialogs (${s.dialogs.length}):`));
        s.dialogs.forEach((d, j) => {
          console.log(chalk.gray(`  [Dialog ${j}]: ${d.slice(0, 200).replace(/\n/g, ' | ')}`));
        });
      } else {
        console.log(chalk.gray('No dialogs detected.'));
      }
      console.log(chalk.white(`Visible buttons (${s.buttons.length}):`));
      s.buttons.slice(0, 30).forEach(b => {
        console.log(chalk.gray(`  - ${b}`));
      });
    });
  }

  console.log(chalk.green('\nInspection complete. Press Ctrl+C to exit.'));
  process.on('SIGINT', () => process.exit(0));
}

function cmdConfig() {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(configPath)) {
    saveConfig({ ...require('./config').DEFAULT_CONFIG });
  }
  try {
    cp.exec(`notepad "${configPath}"`, { stdio: 'inherit', detached: true });
  } catch (e) {
    console.log(chalk.cyan(`Config file: ${configPath}`));
    console.log(chalk.yellow('Please open this file manually to edit.'));
  }
}

function cmdHelp() {
  console.log('TRAE Guard - Remote Approval Monitor for TRAE IDE');
  console.log();
  console.log('Usage:');
  console.log('  trae-guard start       Start monitoring (default, opens browser for setup)');
  console.log('  trae-guard new         Launch a new TRAE IDE window');
  console.log('  trae-guard inspect     Inspect TRAE IDE UI (debug)');
  console.log('  trae-guard config      Open config file in notepad');
  console.log('  trae-guard help        Show this help');
}

const args = process.argv.slice(2);
const cmd = args[0] || 'start';

switch (cmd) {
  case 'start':
  case 'run':
    cmdStart().catch(e => { console.error(chalk.red('Fatal error:'), e); process.exit(1); });
    break;
  case 'new':
  case 'launch':
  case 'open':
    cmdNew().catch(e => { console.error(chalk.red('Error:'), e); process.exit(1); });
    break;
  case 'inspect':
  case 'debug':
  case 'snapshot':
    cmdInspect().catch(e => { console.error(chalk.red('Error:'), e); process.exit(1); });
    break;
  case 'config':
  case 'configure':
    cmdConfig();
    break;
  case 'help':
  case '--help':
  case '-h':
    cmdHelp();
    break;
  default:
    console.log(chalk.red(`Unknown command: ${cmd}`));
    cmdHelp();
    process.exit(1);
}
