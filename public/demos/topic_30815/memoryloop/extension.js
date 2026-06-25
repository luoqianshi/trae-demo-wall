const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

let serverProcess = null;
let serverPort = 3721;
let currentPanel = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Memory Loop extension activated');

  const config = vscode.workspace.getConfiguration('memoryLoop');
  serverPort = config.get('serverPort', 3721);

  // Start server on activation
  startServer(context);

  // Auto-initialize memory for current workspace
  if (config.get('autoInitialize', true)) {
    autoInitialize(context);
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('memoryLoop.openDashboard', () => openDashboard(context)),
    vscode.commands.registerCommand('memoryLoop.initialize', () => initializeProject(context)),
    vscode.commands.registerCommand('memoryLoop.compress', () => checkCompression()),
    vscode.commands.registerCommand('memoryLoop.openMemoryFile', () => openMemoryFile()),
    vscode.commands.registerCommand('memoryLoop.openSchema', () => openSchemaFile()),
  );

  // Auto-open dashboard if configured
  if (config.get('autoOpenOnStart', false)) {
    setTimeout(() => openDashboard(context), 1000);
  }

  // Watch for MEMORY.md changes to refresh dashboard
  const watcher = vscode.workspace.createFileSystemWatcher('**/.trae/memory/MEMORY.md');
  watcher.onDidChange(() => {
    if (currentPanel) {
      currentPanel.webview.postMessage({ type: 'refresh' });
    }
  });
  context.subscriptions.push(watcher);
}

function startServer(context) {
  const serverPath = context.asAbsolutePath(path.join('server', 'server.js'));
  const pluginRoot = context.asAbsolutePath('');

  // Check if server is already running
  checkServerRunning(serverPort).then(running => {
    if (running) {
      console.log('Memory Loop server already running');
      return;
    }
    try {
      serverProcess = spawn('node', [serverPath], {
        cwd: pluginRoot,
        env: { ...process.env, MEMORY_LOOP_PORT: serverPort },
        stdio: 'ignore',
        detached: false,
      });

      serverProcess.on('error', (err) => {
        vscode.window.showWarningMessage(`Memory Loop server failed to start: ${err.message}`);
      });

      serverProcess.on('exit', (code) => {
        console.log(`Memory Loop server exited with code ${code}`);
      });
    } catch (e) {
      vscode.window.showWarningMessage(`Memory Loop server start error: ${e.message}`);
    }
  });
}

function checkServerRunning(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/state`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}

async function autoInitialize(context) {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return;

  const projectPath = folders[0].uri.fsPath;
  const memoryDir = path.join(projectPath, '.trae', 'memory');
  const memoryFile = path.join(memoryDir, 'MEMORY.md');

  if (!fs.existsSync(memoryFile)) {
    try {
      await initializeProject(context, projectPath);
    } catch (e) {
      console.error('Auto-initialize failed:', e);
    }
  } else {
    // Open project in server
    await openProjectInServer(projectPath);
  }
}

async function openProjectInServer(projectPath) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ path: projectPath });
    const req = http.request({
      hostname: 'localhost',
      port: serverPort,
      path: '/api/project/open',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve());
    });
    req.on('error', () => resolve());
    req.write(data);
    req.end();
  });
}

async function initializeProject(context, projectPath) {
  if (!projectPath) {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      vscode.window.showWarningMessage('Open a workspace folder first.');
      return;
    }
    projectPath = folders[0].uri.fsPath;
  }

  const data = JSON.stringify({ path: projectPath });
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: serverPort,
      path: '/api/initialize',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.initialized && result.initialized.length > 0) {
            vscode.window.showInformationMessage(
              `Memory Loop: Initialized ${result.initialized.join(', ')} at .trae/memory/`
            );
          }
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function checkCompression() {
  const data = JSON.stringify({});
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: serverPort,
      path: '/api/compress',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.needsCompression) {
            vscode.window.showWarningMessage(
              `Memory Loop: Compression needed (${result.currentTokens} > ${result.triggerTokens} tokens). Trigger memory-compressor agent.`
            );
          } else {
            vscode.window.showInformationMessage(
              `Memory Loop: Memory within threshold (${result.currentTokens} / ${result.triggerTokens} tokens).`
            );
          }
          resolve(result);
        } catch (e) {
          vscode.window.showErrorMessage('Memory Loop: compression check failed');
          resolve(null);
        }
      });
    });
    req.on('error', () => {
      vscode.window.showErrorMessage('Memory Loop: server not running');
      resolve(null);
    });
    req.write(data);
    req.end();
  });
}

async function openMemoryFile() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('Open a workspace folder first.');
    return;
  }
  const memoryFile = path.join(folders[0].uri.fsPath, '.trae', 'memory', 'MEMORY.md');
  if (!fs.existsSync(memoryFile)) {
    const choice = await vscode.window.showInformationMessage(
      'No MEMORY.md found. Initialize project memory?',
      'Initialize',
      'Cancel'
    );
    if (choice === 'Initialize') {
      await initializeProject(context, folders[0].uri.fsPath);
    }
    return;
  }
  const doc = await vscode.workspace.openTextDocument(memoryFile);
  await vscode.window.showTextDocument(doc);
}

async function openSchemaFile() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('Open a workspace folder first.');
    return;
  }
  const schemaFile = path.join(folders[0].uri.fsPath, '.trae', 'memory', 'memory-schema.yaml');
  if (!fs.existsSync(schemaFile)) {
    vscode.window.showWarningMessage('No schema found. Initialize project memory first.');
    return;
  }
  const doc = await vscode.workspace.openTextDocument(schemaFile);
  await vscode.window.showTextDocument(doc);
}

function openDashboard(context) {
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.One);
    return;
  }

  currentPanel = vscode.window.createWebviewPanel(
    'memoryLoopDashboard',
    'Memory Loop',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      portMapping: [
        { webviewPort: serverPort, extensionHostPort: serverPort },
      ],
    }
  );

  currentPanel.webview.html = getWebviewContent();

  currentPanel.webview.onDidReceiveMessage(
    (message) => {
      if (message.type === 'refresh') {
        currentPanel.webview.postMessage({ type: 'refresh' });
      }
    },
    undefined,
    context.subscriptions
  );

  currentPanel.onDidDispose(
    () => { currentPanel = null; },
    null,
    context.subscriptions
  );
}

function getWebviewContent() {
  // Load the frontend in an iframe pointing to the local server
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    html, body { margin: 0; padding: 0; height: 100vh; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe src="http://localhost:${serverPort}/" id="frame"></iframe>
  <script>
    const vscode = acquireVsCodeApi();
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'refresh') {
        document.getElementById('frame').contentWindow.location.reload();
      }
    });
  </script>
</body>
</html>`;
}

function deactivate() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {
      console.error('Failed to kill server:', e);
    }
    serverProcess = null;
  }
  return undefined;
}

module.exports = { activate, deactivate };
