const { app, BrowserWindow, dialog, ipcMain, Menu, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

let petWindow;
let currentPetSize = 'small';
let windowStateSaveTimer = 0;

const PET_SIZES = {
  mini: { label: '迷你', width: 170, height: 215 },
  small: { label: '小', width: 210, height: 265 },
  medium: { label: '中', width: 250, height: 315 },
  large: { label: '大', width: 300, height: 375 }
};

const projectRoot = path.join(__dirname, '..');
const configDir = path.join(projectRoot, 'config');
const generatedPetDir = path.join(projectRoot, 'assets', 'generated-pets');
const meshyConfigPath = path.join(configDir, 'meshy-config.json');
const currentPetConfigPath = path.join(generatedPetDir, 'current-pet.json');
const windowStatePath = path.join(configDir, 'window-state.json');

function ensureProjectDirs() {
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(generatedPetDir, { recursive: true });
}

function readWindowState() {
  try {
    if (!fs.existsSync(windowStatePath)) return null;
    const state = JSON.parse(fs.readFileSync(windowStatePath, 'utf8'));
    if (!state || !PET_SIZES[state.sizeName]) return null;
    if (!Number.isFinite(state.x) || !Number.isFinite(state.y)) return null;
    return state;
  } catch {
    return null;
  }
}

function clampWindowPosition(x, y, windowWidth, windowHeight) {
  const area = screen.getPrimaryDisplay().workArea;
  const minX = area.x - Math.round(windowWidth * 0.65);
  const maxX = area.x + area.width - Math.round(windowWidth * 0.35);
  const minY = area.y;
  const maxY = area.y + area.height - Math.round(windowHeight * 0.35);

  return {
    x: Math.min(Math.max(Math.round(x), minX), maxX),
    y: Math.min(Math.max(Math.round(y), minY), maxY)
  };
}

function saveWindowState() {
  if (!petWindow || petWindow.isDestroyed()) return;

  try {
    ensureProjectDirs();
    const bounds = petWindow.getBounds();
    fs.writeFileSync(
      windowStatePath,
      JSON.stringify({
        sizeName: currentPetSize,
        x: bounds.x,
        y: bounds.y,
        updatedAt: new Date().toISOString()
      }, null, 2),
      'utf8'
    );
  } catch {
    // 保存失败不影响桌宠运行。
  }
}

function scheduleWindowStateSave() {
  clearTimeout(windowStateSaveTimer);
  windowStateSaveTimer = setTimeout(saveWindowState, 500);
}

function resetWindowState() {
  try {
    if (fs.existsSync(windowStatePath)) {
      fs.unlinkSync(windowStatePath);
    }
  } catch {
    // 重置失败不影响当前窗口操作。
  }

  currentPetSize = 'small';
  setPetSize(currentPetSize);
  movePetToBottomCenter();
}

function fileToDataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  const base64 = fs.readFileSync(filePath).toString('base64');
  return `data:${mime};base64,${base64}`;
}

function readMeshyApiKey() {
  if (process.env.MESHY_API_KEY) {
    return process.env.MESHY_API_KEY;
  }

  try {
    if (!fs.existsSync(meshyConfigPath)) return '';
    const config = JSON.parse(fs.readFileSync(meshyConfigPath, 'utf8'));
    return config.apiKey || '';
  } catch {
    return '';
  }
}

function getCurrentGeneratedPet() {
  try {
    if (!fs.existsSync(currentPetConfigPath)) return null;
    const config = JSON.parse(fs.readFileSync(currentPetConfigPath, 'utf8'));
    if (!config.modelPath || !fs.existsSync(config.modelPath)) return null;

    return {
      modelPath: config.modelPath,
      modelUrl: pathToFileURL(config.modelPath).href,
      sourceType: config.sourceType || 'unknown',
      updatedAt: config.updatedAt || ''
    };
  } catch {
    return null;
  }
}

async function meshyRequest(endpoint, options = {}) {
  const apiKey = readMeshyApiKey();
  if (!apiKey) {
    const error = new Error('MISSING_MESHY_API_KEY');
    error.code = 'MISSING_MESHY_API_KEY';
    throw error;
  }

  const response = await fetch(`https://api.meshy.ai${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const error = new Error(data.message || `Meshy 请求失败：${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function createMeshyGenerationTask(imageDataUris) {
  if (imageDataUris.length <= 1) {
    const data = await meshyRequest('/openapi/v1/image-to-3d', {
      method: 'POST',
      body: JSON.stringify({
        image_url: imageDataUris[0],
        model_type: 'lowpoly',
        should_texture: true,
        target_formats: ['glb'],
        auto_size: true,
        origin_at: 'bottom'
      })
    });

    return { taskType: 'image-to-3d', taskId: data.result };
  }

  const data = await meshyRequest('/openapi/v1/multi-image-to-3d', {
    method: 'POST',
    body: JSON.stringify({
      image_urls: imageDataUris.slice(0, 4),
      should_texture: true,
      target_formats: ['glb'],
      auto_size: true,
      origin_at: 'bottom'
    })
  });

  return { taskType: 'multi-image-to-3d', taskId: data.result };
}

async function pollMeshyTask(taskType, taskId, sendProgress) {
  const endpoint = taskType === 'multi-image-to-3d'
    ? `/openapi/v1/multi-image-to-3d/${taskId}`
    : `/openapi/v1/image-to-3d/${taskId}`;

  for (let attempt = 0; attempt < 90; attempt += 1) {
    const task = await meshyRequest(endpoint, { method: 'GET' });
    sendProgress?.({
      stage: 'generating',
      message: `云端正在生成模型：${task.progress || 0}%`,
      progress: task.progress || 0
    });

    if (task.status === 'SUCCEEDED') return task;

    if (task.status === 'FAILED' || task.status === 'CANCELED') {
      throw new Error(task.task_error?.message || `Meshy 任务${task.status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error('生成等待超时，请稍后重试');
}

async function downloadModel(modelUrl, sourceType) {
  const response = await fetch(modelUrl);
  if (!response.ok) {
    throw new Error(`下载模型失败：${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const fileName = `pet-${Date.now()}.glb`;
  const modelPath = path.join(generatedPetDir, fileName);
  fs.writeFileSync(modelPath, buffer);

  fs.writeFileSync(
    currentPetConfigPath,
    JSON.stringify({
      modelPath,
      sourceType,
      updatedAt: new Date().toISOString()
    }, null, 2),
    'utf8'
  );

  return {
    modelPath,
    modelUrl: pathToFileURL(modelPath).href,
    fileName
  };
}

function saveImportedGlbModel(sourcePath) {
  ensureProjectDirs();

  const importedPath = path.join(generatedPetDir, `imported-pet-${Date.now()}.glb`);
  fs.copyFileSync(sourcePath, importedPath);

  fs.writeFileSync(
    currentPetConfigPath,
    JSON.stringify({
      modelPath: importedPath,
      sourceType: 'imported-glb',
      originalPath: sourcePath,
      updatedAt: new Date().toISOString()
    }, null, 2),
    'utf8'
  );

  return {
    modelPath: importedPath,
    modelUrl: pathToFileURL(importedPath).href,
    fileName: path.basename(importedPath),
    originalFileName: path.basename(sourcePath)
  };
}

function createPetWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;
  const savedState = readWindowState();

  if (savedState) {
    currentPetSize = savedState.sizeName;
  }

  const size = PET_SIZES[currentPetSize];
  const defaultX = Math.round(x + (width - size.width) / 2);
  const defaultY = Math.round(y + height - size.height - 120);
  const position = savedState
    ? clampWindowPosition(savedState.x, savedState.y, size.width, size.height)
    : { x: defaultX, y: defaultY };

  petWindow = new BrowserWindow({
    width: size.width,
    height: size.height,
    x: position.x,
    y: position.y,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  petWindow.setAlwaysOnTop(true, 'screen-saver');
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.on('ready-to-show', () => {
    petWindow.show();
    petWindow.focus();
  });
  petWindow.on('close', () => {
    saveWindowState();
  });
  petWindow.webContents.on('console-message', (_event, level, message) => {
    console.log(`[renderer:${level}] ${message}`);
  });
  petWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[renderer-gone]', details);
  });
  petWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('[load-failed]', errorCode, errorDescription);
  });
  petWindow.loadFile(path.join(__dirname, 'index.html'));
}

function movePetToBottomCenter() {
  if (!petWindow || petWindow.isDestroyed()) return;

  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;
  const bounds = petWindow.getBounds();
  petWindow.setPosition(
    Math.round(x + (width - bounds.width) / 2),
    Math.round(y + height - bounds.height - 120),
    false
  );
  saveWindowState();
}

function setPetSize(sizeName) {
  if (!petWindow || !PET_SIZES[sizeName]) return;

  currentPetSize = sizeName;
  const size = PET_SIZES[sizeName];
  const bounds = petWindow.getBounds();
  const nextX = Math.round(bounds.x + (bounds.width - size.width) / 2);
  const nextY = Math.round(bounds.y + bounds.height - size.height);

  petWindow.setResizable(true);
  petWindow.setBounds({
    x: nextX,
    y: nextY,
    width: size.width,
    height: size.height
  }, false);
  petWindow.setResizable(false);
  saveWindowState();

  setTimeout(() => {
    if (!petWindow || petWindow.isDestroyed()) return;
    petWindow.webContents.send('pet:size-changed', {
      name: sizeName,
      label: size.label,
      width: size.width,
      height: size.height
    });
  }, 80);
}

app.whenReady().then(() => {
  ensureProjectDirs();
  createPetWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createPetWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('window:get-position', () => {
  if (!petWindow) return [0, 0];
  return petWindow.getPosition();
});

ipcMain.on('window:set-position', (_event, nextPosition) => {
  if (!petWindow) return;
  const [x, y] = nextPosition;
  petWindow.setPosition(Math.round(x), Math.round(y), false);
  scheduleWindowStateSave();
});

ipcMain.on('window:close', () => {
  if (petWindow) {
    petWindow.close();
  }
});

ipcMain.on('menu:show-context-menu', () => {
  if (!petWindow) return;

  const menu = Menu.buildFromTemplate([
    {
      label: '睡觉',
      click: () => petWindow.webContents.send('pet:action', 'sleep')
    },
    {
      label: '醒来',
      click: () => petWindow.webContents.send('pet:action', 'wake')
    },
    {
      label: '回到底部中间',
      click: () => movePetToBottomCenter()
    },
    {
      label: '忘记当前位置',
      click: () => resetWindowState()
    },
    {
      type: 'separator'
    },
    {
      label: '尺寸',
      submenu: Object.entries(PET_SIZES).map(([name, size]) => ({
        label: size.label,
        type: 'radio',
        checked: currentPetSize === name,
        click: () => setPetSize(name)
      }))
    },
    {
      type: 'separator'
    },
    {
      label: '关闭桌面宠物',
      click: () => petWindow.close()
    }
  ]);

  menu.popup({ window: petWindow });
});

ipcMain.handle('pet:choose-source', async () => {
  if (!petWindow) return null;

  const result = await dialog.showOpenDialog(petWindow, {
    title: '选择宠物照片或 10 秒内视频',
    properties: ['openFile'],
    filters: [
      { name: '照片或短视频', extensions: ['jpg', 'jpeg', 'png', 'mp4', 'webm', 'mov'] },
      { name: '照片', extensions: ['jpg', 'jpeg', 'png'] },
      { name: '视频', extensions: ['mp4', 'webm', 'mov'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const ext = path.extname(filePath).toLowerCase();
  const isVideo = ['.mp4', '.webm', '.mov'].includes(ext);

  return {
    filePath,
    fileUrl: pathToFileURL(filePath).href,
    fileName: path.basename(filePath),
    kind: isVideo ? 'video' : 'image',
    dataUri: isVideo ? null : fileToDataUri(filePath)
  };
});

ipcMain.handle('pet:start-generation', async (event, payload) => {
  const sendProgress = (progress) => {
    event.sender.send('pet:generation-progress', progress);
  };

  try {
    ensureProjectDirs();

    const imageDataUris = Array.isArray(payload?.imageDataUris)
      ? payload.imageDataUris.filter(Boolean).slice(0, 4)
      : [];

    if (imageDataUris.length === 0) {
      throw new Error('没有可用于生成的图片帧');
    }

    sendProgress({ stage: 'checking', message: '正在检查 Meshy API Key', progress: 3 });

    if (!readMeshyApiKey()) {
      return {
        ok: false,
        code: 'MISSING_MESHY_API_KEY',
        message: '还没有配置 Meshy API Key。请先在 config/meshy-config.json 中填写 apiKey。'
      };
    }

    sendProgress({ stage: 'uploading', message: '正在向云端提交生成任务', progress: 10 });
    const task = await createMeshyGenerationTask(imageDataUris);

    sendProgress({ stage: 'queued', message: '生成任务已创建，等待云端处理', progress: 15 });
    const result = await pollMeshyTask(task.taskType, task.taskId, sendProgress);
    const glbUrl = result.model_urls?.glb;

    if (!glbUrl) {
      throw new Error('生成成功，但没有返回 GLB 模型地址');
    }

    sendProgress({ stage: 'downloading', message: '正在下载生成的 3D 模型', progress: 95 });
    const model = await downloadModel(glbUrl, payload.sourceType || 'unknown');

    sendProgress({ stage: 'done', message: '3D 宠物模型已生成', progress: 100 });

    return {
      ok: true,
      model
    };
  } catch (error) {
    if (error.code === 'MISSING_MESHY_API_KEY') {
      return {
        ok: false,
        code: 'MISSING_MESHY_API_KEY',
        message: '还没有配置 Meshy API Key。请先在 config/meshy-config.json 中填写 apiKey。'
      };
    }

    return {
      ok: false,
      code: 'GENERATION_FAILED',
      message: error.message || '生成失败'
    };
  }
});

ipcMain.handle('pet:get-current-generated-pet', () => getCurrentGeneratedPet());

ipcMain.handle('pet:import-glb-model', async () => {
  if (!petWindow) return null;

  const result = await dialog.showOpenDialog(petWindow, {
    title: '选择已有 3D 模型（GLB）',
    properties: ['openFile'],
    filters: [
      { name: 'GLB 3D 模型', extensions: ['glb'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  try {
    const model = saveImportedGlbModel(result.filePaths[0]);
    return {
      ok: true,
      model
    };
  } catch (error) {
    return {
      ok: false,
      message: error.message || '导入模型失败'
    };
  }
});
