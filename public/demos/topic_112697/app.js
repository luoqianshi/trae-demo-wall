// 主题切换功能
let currentTheme = 'dark'; // 默认高级灰主题
const themeToggleBtn = document.getElementById('themeToggleBtn');

// 从localStorage读取保存的主题
const savedTheme = localStorage.getItem('appTheme');
if (savedTheme === 'light') {
  document.body.classList.add('theme-light');
  currentTheme = 'light';
  themeToggleBtn.classList.add('active');
} else {
  // 默认高级灰主题
  document.body.classList.add('theme-dark');
  currentTheme = 'dark';
  themeToggleBtn.classList.remove('active');
}

// 主题切换按钮点击事件
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    if (currentTheme === 'dark') {
      // 切换到高级白主题
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      currentTheme = 'light';
      themeToggleBtn.classList.add('active');
      localStorage.setItem('appTheme', 'light');
    } else {
      // 切换到高级灰主题
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      currentTheme = 'dark';
      themeToggleBtn.classList.remove('active');
      localStorage.setItem('appTheme', 'dark');
    }
    // 更新图标
    const icon = themeToggleBtn.querySelector('svg') || themeToggleBtn.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', currentTheme === 'dark' ? 'sun' : 'moon');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });
}

// 高级播放器功能
const playerPlayBtn = document.getElementById('playerPlayBtn');
const playerPrevBtn = document.getElementById('playerPrevBtn');
const playerNextBtn = document.getElementById('playerNextBtn');
const playerLoopBtn = document.getElementById('playerLoopBtn');
const playerMuteBtn = document.getElementById('playerMuteBtn');
const playerFullscreenBtn = document.getElementById('playerFullscreenBtn');
const volumeSlider = document.getElementById('volumeSlider');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const previewContainer = document.getElementById('previewContainer');

// 画板基准尺寸（1080p）
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

let playerPlaying = false;
let playerLoop = false;
let playerMuted = false;
let playerVolume = 100;
let playerCurrentTime = 0;
let playerTotalTime = 0;
let playerInterval = null;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateProgress() {
  const percentage = (playerCurrentTime / Math.max(1, playerTotalTime)) * 100;
  progressFill.style.width = `${percentage}%`;
  progressThumb.style.left = `${percentage}%`;
  currentTimeEl.textContent = formatTime(playerCurrentTime);
  totalTimeEl.textContent = formatTime(playerTotalTime);
}

function updatePlayerProgress(currentTime, totalTime) {
  playerCurrentTime = currentTime;
  playerTotalTime = totalTime;
  updateProgress();
}

function getMaxAnimTime() {
  const allAnims = [];
  Object.keys(blockAnimations).forEach(blockId => {
    if (blockId === '__bg__') return;
    const anims = blockAnimations[blockId];
    if (!anims) return;
    anims.forEach(anim => allAnims.push(anim));
  });
  if (allAnims.length === 0) return 0;
  return Math.max(...allAnims.map(a => a.startTime + a.duration));
}

function updatePlayBtnState(playing) {
  if (playing) {
    playerPlayBtn.innerHTML = '<i data-lucide="pause" style="width:16px; height:16px;"></i>';
    playerPlayBtn.classList.add('active');
  } else {
    playerPlayBtn.innerHTML = '<i data-lucide="play" style="width:16px; height:16px;"></i>';
    playerPlayBtn.classList.remove('active');
  }
  if (window.lucide) lucide.createIcons();
}

function startPlayer() {
  if (isPlaying) return;
  const btn = document.getElementById('playKeyframesBtn');
  if (btn) triggerClickNoBubble(btn);
}

function stopPlayer() {
  if (!isPlaying) return;
  stopAnimation();
}

function triggerClickNoBubble(el) {
  const evt = new MouseEvent('click', { bubbles: false, cancelable: true, view: window });
  el.dispatchEvent(evt);
}

function togglePlayer() {
  if (isPlaying) {
    stopPlayer();
  } else {
    startPlayer();
  }
}

function toggleLoop() {
  playerLoop = !playerLoop;
  playerLoopBtn.classList.toggle('active');
}

function toggleMute() {
  playerMuted = !playerMuted;
  playerMuteBtn.classList.toggle('active', playerMuted);
}

function setVolume(value) {
  playerVolume = parseInt(value);
  playerMuted = playerVolume === 0;
  playerMuteBtn.classList.toggle('active', playerMuted);
}

function seekTo(e) {
  const rect = progressBar.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
  playerCurrentTime = (percentage / 100) * Math.max(1, playerTotalTime);
  updateProgress();
}

let originalBlockData = [];

function saveBlockOriginalSizes() {
}

function scaleBlocksForFullscreen(isFullscreen) {
  const contentLayerEl = document.getElementById('contentLayer');
  if (!contentLayerEl) return;
  
  if (isFullscreen) {
    contentLayerEl.style.top = '0';
    contentLayerEl.style.bottom = '0';
    contentLayerEl.style.maxHeight = '100%';
  } else {
    contentLayerEl.style.top = '';
    contentLayerEl.style.bottom = '';
    contentLayerEl.style.maxHeight = '';
  }
  
  requestAnimationFrame(() => {
    const rect = contentLayerEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const scaleRatio = Math.min(rect.width / BASE_WIDTH, rect.height / BASE_HEIGHT);
      viewScale = scaleRatio;
      viewTranslateX = 0;
      viewTranslateY = 0;
      applyTransform();
      if (typeof updateBgImagesContainerTransform === 'function') {
        updateBgImagesContainerTransform();
      }
      if (typeof updateVideosContainerTransform === 'function') {
        updateVideosContainerTransform();
      }
    }
  });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    previewContainer.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
    playerFullscreenBtn.classList.add('active');
  } else {
    document.exitFullscreen();
    playerFullscreenBtn.classList.remove('active');
  }
}

if (playerPlayBtn) playerPlayBtn.addEventListener('click', togglePlayer);
if (playerPrevBtn) playerPrevBtn.addEventListener('click', () => {
  playerCurrentTime = Math.max(0, playerCurrentTime - 5);
  updateProgress();
});
if (playerNextBtn) playerNextBtn.addEventListener('click', () => {
  playerCurrentTime = Math.min(playerTotalTime, playerCurrentTime + 5);
  updateProgress();
});
if (playerLoopBtn) playerLoopBtn.addEventListener('click', toggleLoop);
if (playerLoopBtn && playerLoop) playerLoopBtn.classList.add('active');
if (playerMuteBtn) playerMuteBtn.addEventListener('click', toggleMute);
if (playerFullscreenBtn) playerFullscreenBtn.addEventListener('click', toggleFullscreen);
if (volumeSlider) volumeSlider.addEventListener('input', (e) => setVolume(e.target.value));
if (progressBar) progressBar.addEventListener('click', seekTo);

let isDraggingCamera = false;
let lastMouseX = 0;
let lastMouseY = 0;

function updateCameraInfo() {
}

document.addEventListener('mousemove', (e) => {
  if (isDraggingCamera) {
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    
    cameraYaw += dx * 0.5;
    cameraPitch -= dy * 0.5;
    
    cameraPitch = Math.max(-80, Math.min(80, cameraPitch));
    
    updateOrbitCamera();
    applyTransform();
    updateCameraInfo();
    
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
});

document.addEventListener('touchmove', (e) => {
  if (isDraggingCamera) {
    const dx = e.touches[0].clientX - lastMouseX;
    const dy = e.touches[0].clientY - lastMouseY;
    
    cameraYaw += dx * 0.5;
    cameraPitch -= dy * 0.5;
    
    cameraPitch = Math.max(-80, Math.min(80, cameraPitch));
    
    updateOrbitCamera();
    applyTransform();
    updateCameraInfo();
    
    lastMouseX = e.touches[0].clientX;
    lastMouseY = e.touches[0].clientY;
  }
});

document.addEventListener('mouseup', () => {
  isDraggingCamera = false;
});

document.addEventListener('touchend', () => {
  isDraggingCamera = false;
});

function initAppEventListeners() {
  const saveAnimBtn = document.getElementById('saveAnimBtn');
  const saveAsAnimBtn = document.getElementById('saveAsAnimBtn');
  
  if (saveAnimBtn) {
    saveAnimBtn.addEventListener('click', () => saveAnimationData(false));
  }
  
  if (saveAsAnimBtn) {
    saveAsAnimBtn.addEventListener('click', () => saveAnimationData(true));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppEventListeners);
} else {
  initAppEventListeners();
}

document.addEventListener('fullscreenchange', () => {
  const wasPlaying = typeof isPlaying !== 'undefined' && isPlaying;
  
  if (wasPlaying && typeof stopPlayer === 'function') {
    stopPlayer();
  }
  
  if (!document.fullscreenElement && playerFullscreenBtn) {
    playerFullscreenBtn.classList.remove('active');
    scaleBlocksForFullscreen(false);
  } else {
    setTimeout(() => {
      scaleBlocksForFullscreen(true);
    }, 100);
  }
  
  if (wasPlaying && typeof startPlayer === 'function') {
    setTimeout(() => {
      startPlayer();
    }, 200);
  }
});

totalTimeEl.textContent = formatTime(playerTotalTime);

// 文件/方案管理功能
const titleTabs = document.getElementById('titleTabs');
const newFileBtn = document.getElementById('newFileBtn');
const saveFileBtn = document.getElementById('saveFileBtn');
const moreFileBtn = document.getElementById('moreFileBtn');

let files = {};
let currentFileId = 'default';
let fileCounter = 1;

function generateFileId() {
  return 'file_' + (++fileCounter);
}

function createFile(name = '未命名') {
  const id = generateFileId();
  files[id] = {
    name: name,
    blocks: [],
    settings: {}
  };
  return id;
}

function saveCurrentFile() {
  if (!files[currentFileId]) return;
  
  // 保存当前blocks数据
  const allBlocks = document.querySelectorAll('.text-block');
  const blockData = [];
  allBlocks.forEach(block => {
    blockData.push({
      id: block.dataset.id,
      text: block.textContent,
      x: parseFloat(block.style.left) || 0,
      y: parseFloat(block.style.top) || 0,
      fontSize: block.style.fontSize || '48px',
      color: block.style.color || '#000000',
      bgColor: block.style.backgroundColor || 'transparent',
      fontWeight: block.style.fontWeight || '400',
      transform: block.style.transform || '',
      opacity: block.style.opacity || '1'
    });
  });
  
  files[currentFileId].blocks = blockData;
  files[currentFileId].name = document.querySelector('.title-tab.active')?.textContent.replace(' ×', '') || '未命名';
  
  // 保存到localStorage
  localStorage.setItem('jgw_files', JSON.stringify(files));
  localStorage.setItem('jgw_current_file', currentFileId);
  
  showTip('已保存: ' + files[currentFileId].name);
}

function loadFiles() {
  const saved = localStorage.getItem('jgw_files');
  if (saved) {
    try {
      files = JSON.parse(saved);
      currentFileId = localStorage.getItem('jgw_current_file') || 'default';
      if (!files[currentFileId]) {
        const keys = Object.keys(files);
        currentFileId = keys.length > 0 ? keys[0] : createFile();
      }
    } catch (e) {
      files = {};
      currentFileId = createFile();
    }
  } else {
    currentFileId = createFile();
  }
}

function renderTabs() {
  if (!titleTabs) return;
  titleTabs.innerHTML = '';
  Object.keys(files).forEach(id => {
    const tab = document.createElement('div');
    tab.className = 'title-tab' + (id === currentFileId ? ' active' : '');
    tab.dataset.fileId = id;
    tab.innerHTML = files[id].name + '<span class="close-tab" data-id="' + id + '"> ×</span>';
    tab.addEventListener('click', (e) => {
      if (!e.target.classList.contains('close-tab')) {
        switchFile(id);
      }
    });
    tab.querySelector('.close-tab').addEventListener('click', (e) => {
      e.stopPropagation();
      closeFile(id);
    });
    titleTabs.appendChild(tab);
  });

  const fileNameEl = document.querySelector('.menu-actions .file-name');
  if (fileNameEl && files[currentFileId]) {
    fileNameEl.textContent = files[currentFileId].name;
  }
}

function switchFile(id) {
  if (id === currentFileId) return;
  
  // 保存当前文件
  saveCurrentFile();
  
  // 切换文件
  currentFileId = id;
  
  // 渲染tabs
  renderTabs();
  
  // 加载文件内容
  loadFileContent(id);
  
  localStorage.setItem('jgw_current_file', currentFileId);
}

function loadFileContent(id) {
  // 清空当前展示区
  const blocksContainer = document.getElementById('blocksContainer');
  blocksContainer.innerHTML = '';
  
  if (files[id] && files[id].blocks) {
    files[id].blocks.forEach(data => {
      createTextBlock(data);
    });
  }
}

function createTextBlock(data) {
  const blocksContainer = document.getElementById('blocksContainer');
  const block = document.createElement('div');
  block.className = 'text-block';
  block.dataset.id = data.id || ('block_' + Date.now());
  block.textContent = data.text || '文字';
  
  // 计算 zIndex：取所有元素中最大的 zIndex + 1
  const allZIndices = [
    ...blocks.map(b => parseInt(b.block.style.zIndex) || 0),
    ...bgImages.map(bg => bg.zIndex || 0),
    ...videoItems.map(v => v.zIndex || 0)
  ];
  const maxZ = allZIndices.length > 0 ? Math.max(...allZIndices) : 0;
  const zIndex = data.zIndex !== undefined ? data.zIndex : maxZ + 1;
  
  block.style.cssText = `
    position: absolute;
    left: ${data.x || 0}px;
    top: ${data.y || 0}px;
    font-size: ${data.fontSize || '48px'};
    color: ${data.color || '#000'};
    background: ${data.bgColor || 'transparent'};
    font-weight: ${data.fontWeight || '400'};
    transform: ${data.transform || ''};
    opacity: ${data.opacity || '1'};
    z-index: ${zIndex};
    cursor: move;
    user-select: none;
    padding: 10px;
  `;
  
  // 添加选中和拖拽功能
  block.addEventListener('click', (e) => {
    e.stopPropagation();
    selectBlock(block);
  });
  
  blocksContainer.appendChild(block);
  return block;
}

function closeFile(id) {
  const keys = Object.keys(files);
  if (keys.length <= 1) {
    showTip('至少保留一个文件');
    return;
  }
  
  if (id === currentFileId) {
    // 删除并切换到下一个
    delete files[id];
    const newId = Object.keys(files)[0];
    switchFile(newId);
  } else {
    delete files[id];
    renderTabs();
  }
  
  localStorage.setItem('jgw_files', JSON.stringify(files));
}

function renameFile(id, newName) {
  if (files[id]) {
    files[id].name = newName;
    renderTabs();
    localStorage.setItem('jgw_files', JSON.stringify(files));
  }
}

if (newFileBtn) {
  newFileBtn.addEventListener('click', () => {
    const id = createFile();
    renderTabs();
    switchFile(id);
  });
}

if (saveFileBtn) {
  saveFileBtn.addEventListener('click', saveCurrentFile);
}

// 菜单栏交互
const menuItemWrappers = document.querySelectorAll('.menu-item-wrapper');
menuItemWrappers.forEach(wrapper => {
  const btn = wrapper.querySelector('.menu-item-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = wrapper.classList.contains('open');
    // 关闭所有菜单
    menuItemWrappers.forEach(w => w.classList.remove('open'));
    // 清除所有下拉菜单的内联display样式，避免覆盖CSS类
    document.querySelectorAll('.menu-dropdown').forEach(d => {
      d.style.display = '';
    });
    // 切换当前菜单
    if (!isOpen) {
      wrapper.classList.add('open');
    }
  });
});

// 点击页面其他地方关闭菜单
document.addEventListener('click', () => {
  menuItemWrappers.forEach(w => w.classList.remove('open'));
  // 清除子菜单的内联样式
  const submenu = document.getElementById('exportSizeSubmenu');
  if (submenu) submenu.style.display = '';
});

// 菜单项事件
const menuNewFile = document.getElementById('menuNewFile');
const menuOpenFile = document.getElementById('menuOpenFile');
const menuSaveFile = document.getElementById('menuSaveFile');
const menuSaveAsFile = document.getElementById('menuSaveAsFile');
const menuExportVideo = document.getElementById('menuExportVideo');
const menuQuickAdd = document.getElementById('menuQuickAdd');
const menuSaveAnim = document.getElementById('menuSaveAnim');
const menuLoadAnim = document.getElementById('menuLoadAnim');
const menuToggleGrid = document.getElementById('menuToggleGrid');
const menuPlay = document.getElementById('menuPlay');
const menuDelete = document.getElementById('menuDelete');
const menuCopy = document.getElementById('menuCopy');
const menuPaste = document.getElementById('menuPaste');
const menuPasteOriginal = document.getElementById('menuPasteOriginal');
const menuZoomIn = document.getElementById('menuZoomIn');
const menuZoomOut = document.getElementById('menuZoomOut');
const menuZoomReset = document.getElementById('menuZoomReset');
const menuAbout = document.getElementById('menuAbout');
const menuTutorial = document.getElementById('menuTutorial');
const menuWeightAnim = document.getElementById('menuWeightAnim');
const menuDrawPath = document.getElementById('menuDrawPath');
const menuCameraMotion = document.getElementById('menuCameraMotion');
const menuInsertImage = document.getElementById('menuInsertImage');
const menuInsertVideo = document.getElementById('menuInsertVideo');
const menuImportPlugin = document.getElementById('menuImportPlugin');
const menuExportPlugin = document.getElementById('menuExportPlugin');
const menuPluginList = document.getElementById('menuPluginList');
const menuPluginHelp = document.getElementById('menuPluginHelp');

if (menuNewFile) {
  menuNewFile.addEventListener('click', () => {
    newAnimation();
  });
}
if (menuLoadAnim) {
  menuLoadAnim.addEventListener('click', () => {
    const btn = document.getElementById('loadAnimBtn');
    if (btn) btn.click();
  });
}
if (menuSaveFile) {
  menuSaveFile.addEventListener('click', () => {
    const btn = document.getElementById('saveAnimBtn');
    if (btn) btn.click();
  });
}
if (menuSaveAsFile) {
  menuSaveAsFile.addEventListener('click', () => {
    saveAnimationData(true);
  });
}
if (menuExportVideo) {
  menuExportVideo.addEventListener('click', () => {
    const exportBtn = document.getElementById('exportVideoBtn');
    if (exportBtn) exportBtn.click();
  });
}
if (menuQuickAdd) {
  menuQuickAdd.addEventListener('click', quickAddAnimation);
}
if (menuWeightAnim) {
  menuWeightAnim.addEventListener('click', () => {
    const btn = document.getElementById('addWeightAnimBtn');
    if (btn) btn.click();
  });
}
if (menuDrawPath) {
  menuDrawPath.addEventListener('click', () => {
    const btn = document.getElementById('drawPathBtn');
    if (btn) btn.click();
  });
}
if (menuCameraMotion) {
  menuCameraMotion.addEventListener('click', () => {
    const btn = document.getElementById('addCameraMotionBtn');
    if (btn) btn.click();
  });
}
if (menuInsertImage) {
  menuInsertImage.addEventListener('click', () => {
    const btn = document.getElementById('insertBgImageBtn');
    if (btn) btn.click();
  });
}
if (menuInsertVideo) {
  menuInsertVideo.addEventListener('click', () => {
    const btn = document.getElementById('insertVideoBtn');
    if (btn) btn.click();
  });
}
if (menuSaveAnim) {
  menuSaveAnim.addEventListener('click', () => {
    const btn = document.getElementById('saveAnimBtn');
    if (btn) btn.click();
  });
}
if (menuLoadAnim) {
  menuLoadAnim.addEventListener('click', () => {
    const btn = document.getElementById('loadAnimBtn');
    if (btn) btn.click();
  });
}
if (menuImportPlugin) {
  menuImportPlugin.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return;
      let successCount = 0, failCount = 0;
      for (const file of input.files) {
        const result = await AnimPluginLoader.importPluginFromFile(file);
        if (result.success) { successCount++; }
        else { failCount++; showTip(result.message); }
      }
      if (successCount > 0) {
        showTip(`成功导入 ${successCount} 个插件${failCount > 0 ? `，${failCount}个失败` : ''}`);
        if (typeof initComicPanel === 'function') initComicPanel();
      }
    };
    input.click();
  });
}
if (menuExportPlugin) {
  menuExportPlugin.addEventListener('click', () => {
    const customPlugins = AnimPluginLoader.getCustomPlugins();
    if (customPlugins.length === 0) {
      showTip('没有可导出的自定义插件');
      return;
    }
    showPluginExportDialog(customPlugins);
  });
}
if (menuPluginList) {
  menuPluginList.addEventListener('click', () => {
    showPluginListDialog();
  });
}
if (menuPluginHelp) {
  menuPluginHelp.addEventListener('click', () => {
    showPluginHelpModal();
  });
}
if (menuToggleGrid) {
  menuToggleGrid.addEventListener('click', () => {
    const gridBtn = document.getElementById('toggleGridBtn');
    if (gridBtn) gridBtn.click();
  });
}

// 导出尺寸切换
let currentExportSize = '16:9';
const exportSizeMap = {
  '16:9': { w: 1920, h: 1080, ratio: 16/9 },
  '4:3': { w: 1440, h: 1080, ratio: 4/3 },
  '1:1': { w: 1080, h: 1080, ratio: 1 },
  '3:4': { w: 810, h: 1080, ratio: 3/4 },
  '9:16': { w: 608, h: 1080, ratio: 9/16 }
};

function setExportSize(size) {
  currentExportSize = size;
  const label = document.getElementById('frameLabel');
  const contentLayerEl = document.getElementById('contentLayer');
  if (label) {
    label.textContent = size;
    label.style.transform = 'scale(1)';
  }
  if (contentLayerEl) {
    contentLayerEl.style.aspectRatio = size.replace(':', '/');
  }
  // 将标签移到 contentLayer 内（因为 exportFrameGuide 已隐藏）
  if (label && contentLayerEl && label.parentElement !== contentLayerEl) {
    contentLayerEl.appendChild(label);
  }
  // 同步显示/隐藏两侧渐变遮罩
  const masks = document.querySelectorAll('.export-frame-mask');
  const ratio = exportSizeMap[size]?.ratio || 1;
  masks.forEach(mask => {
    mask.classList.toggle('visible', ratio < 0.9);
  });
  // 高亮选中项
  document.querySelectorAll('.export-size-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });
  // 同步时间轴尺寸按钮高亮
  const timelineSizeBtns = document.querySelectorAll('#sizeDropPanel .drop-item');
  if (timelineSizeBtns && timelineSizeBtns.length > 0) {
    timelineSizeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ratio === size);
    });
    // 同步应用比例
    const [w, h] = size.split(':').map(Number);
    if (typeof applyAspectRatio === 'function' && w && h) {
      applyAspectRatio(w, h);
    }
  }
  // 关闭子菜单 - 通过CSS类控制
  const submenuWrapper = document.querySelector('.menu-submenu-wrapper');
  if (submenuWrapper) submenuWrapper.classList.remove('open');
}

// 导出尺寸子菜单交互 - 使用CSS类控制
const menuExportSize = document.getElementById('menuExportSize');
const exportSizeSubmenu = document.getElementById('exportSizeSubmenu');
if (menuExportSize) {
  menuExportSize.addEventListener('click', (e) => {
    e.stopPropagation();
    const wrapper = menuExportSize.closest('.menu-submenu-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('open');
    }
  });
}

// 尺寸选项点击
document.querySelectorAll('.export-size-option').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setExportSize(btn.dataset.size);
    // 关闭所有菜单 - 通过移除open类关闭
    menuItemWrappers.forEach(w => w.classList.remove('open'));
  });
});

if (menuPlay) {
  menuPlay.addEventListener('click', () => {
    const playBtn = document.getElementById('playKeyframesBtn');
    if (playBtn) triggerClickNoBubble(playBtn);
  });
}
if (menuDelete) {
  menuDelete.addEventListener('click', () => {
    if (selectedBlocks.length > 0) {
      selectedBlocks.forEach(block => deleteBlock(block));
      selectedBlocks = [];
    }
  });
}

// 编辑菜单 - 复制/粘贴
if (menuCopy) {
  menuCopy.addEventListener('click', () => {
    if (selectedBlocks.length > 0) {
      const e = new KeyboardEvent('keydown', { ctrlKey: true, key: 'c', bubbles: true });
      document.dispatchEvent(e);
    }
  });
}
if (menuPaste) {
  menuPaste.addEventListener('click', () => {
    const e = new KeyboardEvent('keydown', { ctrlKey: true, key: 'v', bubbles: true });
    document.dispatchEvent(e);
  });
}
if (menuPasteOriginal) {
  menuPasteOriginal.addEventListener('click', () => {
    const e = new KeyboardEvent('keydown', { ctrlKey: true, key: 'b', bubbles: true });
    document.dispatchEvent(e);
  });
}

// 文件菜单 - 打开（默认TypeAnim文件夹）
if (menuOpenFile) {
  menuOpenFile.addEventListener('click', async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const fileHandle = await window.showOpenFilePicker({
          types: [{
            description: '动画文件',
            accept: { 'application/json': ['.json'] }
          }],
          startIn: 'downloads'
        });
        const file = await fileHandle[0].getFile();
        const text = await file.text();
        const data = JSON.parse(text);
        loadAnimationData(data);
        showTip('动画已加载');
      } catch (err) {
        if (err.name !== 'AbortError') {
          showTip('打开失败：' + err.message);
        }
      }
    } else {
      const input = document.getElementById('menuFileInput');
      if (input) {
        input.click();
      } else {
        showTip('打开功能开发中');
      }
    }
  });
}

// 视图菜单 - 缩放
if (menuZoomIn) {
  menuZoomIn.addEventListener('click', () => {
    zoomCanvas(1.1);
  });
}
if (menuZoomOut) {
  menuZoomOut.addEventListener('click', () => {
    zoomCanvas(1/1.1);
  });
}
if (menuZoomReset) {
  menuZoomReset.addEventListener('click', () => {
    resetCanvasZoom();
  });
}

// 帮助菜单 - 关于
if (menuAbout) {
  menuAbout.addEventListener('click', () => {
    showAboutModal();
  });
}
// 帮助菜单 - 教学
if (menuTutorial) {
  menuTutorial.addEventListener('click', () => {
    showTip('教学功能开发中');
  });
}

// 面板菜单事件
const menuTextSettings = document.getElementById('menuTextSettings');
const menuAnimPresets = document.getElementById('menuAnimPresets');
const menuAnimElements = document.getElementById('menuAnimElements');
const menuCast = document.getElementById('menuCast');
const menuToggleTheme = document.getElementById('menuToggleTheme');

function isMobile() {
  return window.innerWidth <= 1079;
}

function showMobileSidebar() {
  const sidebar = document.querySelector('.left-sidebar');
  if (sidebar) {
    sidebar.classList.add('mobile-visible');
  }
}

function hideMobileSidebar() {
  const sidebar = document.querySelector('.left-sidebar');
  if (sidebar) {
    sidebar.classList.remove('mobile-visible');
  }
}

if (menuTextSettings) {
  menuTextSettings.addEventListener('click', () => {
    if (isMobile()) showMobileSidebar();
    const btn = document.getElementById('togglePanel');
    if (btn) btn.click();
  });
}
if (menuAnimPresets) {
  menuAnimPresets.addEventListener('click', () => {
    if (isMobile()) showMobileSidebar();
    const btn = document.getElementById('comicToggleBtn');
    if (btn) btn.click();
  });
}
if (menuAnimElements) {
  menuAnimElements.addEventListener('click', () => {
    if (isMobile()) showMobileSidebar();
    const btn = document.getElementById('presetToggleBtn');
    if (btn) btn.click();
  });
}
if (menuCast) {
  menuCast.addEventListener('click', () => {
    if (isMobile()) showMobileSidebar();
    const btn = document.getElementById('castToggleBtn');
    if (btn) btn.click();
  });
}
const menuZimanhua = document.getElementById('menuZimanhua');
if (menuZimanhua) {
  menuZimanhua.addEventListener('click', () => {
    if (isMobile()) showMobileSidebar();
    const btn = document.getElementById('zimanhuaToggleBtn');
    if (btn) btn.click();
  });
}
if (menuToggleTheme) {
  menuToggleTheme.addEventListener('click', () => {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.click();
  });
}

// 点击预览区时，小屏幕下隐藏左侧边栏
if (previewContainer) {
  previewContainer.addEventListener('click', () => {
    if (isMobile()) {
      hideMobileSidebar();
    }
  });
}

// 初始化
loadFiles();
renderTabs();

console.log('Script开始执行');

const camera = document.getElementById('camera');
const cameraArea = document.querySelector('.camera-area');
const toggleCam = document.getElementById('toggleCam');
const customText = document.getElementById('customText');
const fontSize = document.getElementById('fontSize');
const textColor = document.getElementById('textColor');
const bgColor = document.getElementById('bgColor');
const wght = document.getElementById('wght');
const wNum = document.getElementById('wNum');
const fontSelect = document.getElementById('fontSelect');
const tips = document.getElementById('tips');
const startVoice = document.getElementById('startVoice');
const langBtn = document.getElementById('langBtn');
const puncBtn = document.getElementById('puncBtn');
const rotate = document.getElementById('rotate');
const rotateNum = document.getElementById('rotateNum');
const flipBtn = document.getElementById('flipBtn');
const flipXBtn = document.getElementById('flipXBtn');
const flipYBtn = document.getElementById('flipYBtn');
const verticalBtn = document.getElementById('verticalBtn');
const fsNum = document.getElementById('fsNum');
const clearBtn = document.getElementById('clearBtn');
const resetBtn = document.getElementById('resetBtn');

let running = false;
let stream = null;
let currentWeight = 400;
let base = 0;
let recognition = null;
let isVoiceListening = false;
const LANG_CANTONESE = 'zh-HK';
const LANG_CHINESE = 'zh-CN';
let useCantonese = false;
let keepPunc = false;
const puncReg = /[，。！？；：\x22\x22''\x27\x27、,.!?;:]/g;

// 文字块管理
let blocks = [];
let selectedBlocks = [];
let blockIdCounter = 0;
let loadedFonts = {};
let viewScale = 1;
let viewTranslateX = 0;
let viewTranslateY = 0;
let viewRotate = 0;
let viewRotateX = 0;
let viewRotateY = 0;
let viewPerspective = 1000;

let cameraX = 0;
let cameraY = 0;
let cameraZ = 1000;
let cameraPitch = 0;
let cameraYaw = 0;
let cameraRoll = 0;
let cameraFocalLength = 1000;
let cameraDistance = 1000;
let orbitCenterX = BASE_WIDTH / 2;
let orbitCenterY = BASE_HEIGHT / 2;
let orbitCenterZ = 0;
let bgAnimTimeouts = [];
let bgMotionAnimObjs = [];
let activeBgMotions = [];

// 背景图管理
let bgImages = [];
let selectedBgImageId = null;
let bgImageIdCounter = 0;
let bgImageDragState = null;
let bgImageResizeState = null;

// 展示区尺寸选择
const sizeBtns = document.querySelectorAll('#sizeDropPanel .drop-item');
const customInputs = document.getElementById('sizeCustomInputs');
const customWidth = document.getElementById('customWidth');
const customHeight = document.getElementById('customHeight');
const sizeConfirmBtn = document.getElementById('sizeConfirmBtn');

function applyAspectRatio(w, h) {
  const app = document.querySelector('.app-main');
  if (app) {
    app.classList.remove('layout-16-9', 'layout-4-3', 'layout-1-1', 'layout-3-4', 'layout-9-16', 'layout-tall');
    const ratio = w + '-' + h;
    app.classList.add('layout-' + ratio);
  }
  if (typeof updateViewBounds === 'function') updateViewBounds();

  requestAnimationFrame(() => {
    const blocksContainer = document.getElementById('blocksContainer');
    const contentLayerEl = document.getElementById('contentLayer');
    if (blocksContainer && contentLayerEl) {
      const rect = contentLayerEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const scaleRatio = Math.min(rect.width / BASE_WIDTH, rect.height / BASE_HEIGHT);
        viewScale = scaleRatio;
        viewTranslateX = 0;
        viewTranslateY = 0;
        applyTransform();
        if (typeof updateBgImagesContainerTransform === 'function') {
          updateBgImagesContainerTransform();
        }
        if (typeof updateVideosContainerTransform === 'function') {
          updateVideosContainerTransform();
        }
      }
    }
  });
}


// 窗口大小变化时重新计算画板缩放
window.addEventListener('resize', () => {
  if (typeof applyAspectRatio === 'function') {
    const activeBtn = document.querySelector('#sizeDropPanel .drop-item.active');
    if (activeBtn) {
      const ratio = activeBtn.dataset.ratio;
      if (ratio) {
        const [w, h] = ratio.split(':').map(Number);
        applyAspectRatio(w, h);
      }
    }
  }
  if (typeof updateZimanhuaPreviewScale === 'function') updateZimanhuaPreviewScale();
});

function closeAllDropdowns(exceptBtnId) {
  ['sizeDropPanel', 'presetDropPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  });
  ['sizeDropBtn', 'presetDropBtn'].forEach(id => {
    if (id !== exceptBtnId) {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove('open');
    }
  });
}

function toggleDropdown(btnId, panelId) {
  const panel = document.getElementById(panelId);
  const btn = document.getElementById(btnId);
  if (!panel || !btn) return;
  const isOpen = panel.classList.contains('open');
  closeAllDropdowns(isOpen ? null : btnId);
  panel.classList.toggle('open');
  btn.classList.toggle('open', !isOpen);
}

document.getElementById('sizeDropBtn')?.addEventListener('click', e => { e.stopPropagation(); toggleDropdown('sizeDropBtn', 'sizeDropPanel'); });
document.getElementById('presetDropBtn')?.addEventListener('click', e => { e.stopPropagation(); toggleDropdown('presetDropBtn', 'presetDropPanel'); });

// 防止面板内点击冒泡到 document 导致关闭
['sizeDropPanel', 'presetDropPanel'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', e => e.stopPropagation());
});

document.addEventListener('click', () => closeAllDropdowns());

// 尺寸下拉
document.querySelectorAll('#sizeDropPanel .drop-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('#sizeDropPanel .drop-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const ratio = item.dataset.ratio;
    const [w, h] = ratio.split(':').map(Number);
    applyAspectRatio(w, h);
    // 同步到菜单的导出尺寸
    setExportSize(ratio);
    document.getElementById('sizeDropPanel').classList.remove('open');
    document.getElementById('sizeDropBtn').classList.remove('open');
  });
});

// 预设下拉内容已直接写在 HTML 中
// 默认激活 16:9
const defaultSizeBtn = document.querySelector('#sizeDropPanel .drop-item[data-ratio="16:9"]');
if (defaultSizeBtn) {
  document.querySelectorAll('#sizeDropPanel .drop-item').forEach(b => b.classList.remove('active'));
  defaultSizeBtn.classList.add('active');
  // 延迟到所有函数定义完成后再初始化
  setTimeout(() => {
    applyAspectRatio(16, 9);
  }, 0);
}

// 尺寸按钮点击事件 - 同步导出尺寸
sizeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const ratio = btn.dataset.ratio;
    if (ratio && typeof setExportSize === 'function') {
      setExportSize(ratio);
    }
  });
});

// 拖拽状态（全局变量）
let dragState = {
  isDragging: false,
  startX: 0,
  startY: 0,
  origPositions: []
};

// 动画控制（控件已移至预设下拉面板内）
let isAnimPlaying = false;
const playBtn = document.getElementById('playBtn');
const animSelect = document.getElementById('animSelect');
const animSpeed = document.getElementById('animSpeed');

let animationSpeed = 1; // 当前动画速度
const animPresets = ['shake', 'fall', 'jump', 'run', 'walk', 'spin', 'blink', 'pulse', 'sway', 'bounce', 'float', 'vibrate', 'slide', 'zoom', 'swing', 'dive', 'rise', 'dash', 'breathe', 'flicker', 'wave', 'clap', 'nod', 'shakehead', 'run2', 'fly', 'crawl', 'jump2', 'waddle', 'stretch', 'sleep', 'eat', 'legKick', 'footTap', 'legSwing', 'hipShake', 'kneeBend', 'footWiggle', 'legMarch', 'hipTwist', 'footStomp', 'legStretch', 'bigKick', 'stompHard', 'shakeHip', 'highStep', 'twistWaist', 'jumpFeet', 'wiggleLeg', 'slideFeet', 'squatBounce', 'splitLegs', 'crazyKick', 'wildStomp', 'hipSwing', 'legFling', 'crazyDance', 'jumpSplit', 'legShake', 'squatKick', 'twistJump', 'wildSlide', 'bottomSwing', 'bottomShake', 'bottomBounce', 'bottomSpin', 'bottomScale', 'bottomSlide', 'bottomBend', 'bottomFling', 'bottomVibrate', 'bottomSway', 'flip3D', 'rotate3DY', 'rotate3DX', 'swing3D', 'zoom3D', 'spin3D', 'tilt3D', 'bounce3D', 'twist3D', 'roll3D', 'explode3D', 'implode3D', 'spiral3D', 'wobble3D', 'flipOut3D', 'shake3D', 'pulse3D', 'swingWild3D', 'zoomCrazy3D', 'rotateCrazy3D', 'armWave', 'armSwing', 'armRaise', 'shoulderShrug', 'shoulderShake', 'fingerTap', 'wristTwist', 'elbowHit', 'armStretch', 'handClap', 'bigArmSwing', 'wildShrug', 'highArmRaise', 'wildShoulder', 'bigWave', 'exaggeratedClap', 'bigArmFling', 'wildPunch', 'bigStretch', 'wildArmShake', 'fullBodyShake', 'wildSpin', 'crazyBounce', 'wildTwitch', 'crazySway', 'wildVibrate', 'crazyRoll', 'wildDash', 'crazyBurst', 'wildTwist', 'dispSwing', 'dispShake', 'dispBounce', 'dispScale', 'dispSlide', 'dispBend', 'dispFling', 'dispVibrate', 'dispSway', 'dispLens', 'dispWave', 'dispTwist', 'dispPulse', 'dispWobble', 'dispSquash', 'dispZigzag', 'dispOrbit', 'dispBreath', 'dispSpiral', 'dispRipple', 'disp3DRotX', 'disp3DRotY', 'disp3DFlip', 'disp3DWave', 'disp3DZoom', 'disp3DPersp', 'disp3DSwing', 'disp3DBounce', 'disp3DTwist', 'disp3DBreath', 'bothSwing', 'bothShake', 'bothBounce', 'bothScale', 'bothBend', 'bothPulse', 'bothWobble', 'bothOrbit', 'bothSquash', 'bothTwist'];

// 动画速度控制
if (animSpeed) {
  animSpeed.addEventListener('input', () => {
    const newSpeed = parseFloat(animSpeed.value);
    
    // 只更新选中的文字块的动画速度
    if (selectedBlocks.length > 0) {
      selectedBlocks.forEach(block => {
        const blockData = blocks.find(b => b.block === block);
        if (blockData) {
          blockData.animationSpeed = newSpeed;
          
          // 如果是 Canvas 动画，更新动画时长
          const animState = halfFilterAnimators.get(block);
          if (animState) {
            const defaultDuration = getDefaultAnimationDuration(blockData.animation || animSelect.value);
            animState.duration = (defaultDuration / newSpeed) * 1000;
            animState.startTime = performance.now();
          } else {
            // CSS 动画使用 CSS 变量
            const defaultDuration = getDefaultAnimationDuration(blockData.animation || animSelect.value);
            const newDuration = defaultDuration / newSpeed;
            block.style.setProperty('--animation-duration', newDuration + 's');
          }
        }
      });
    }
  });
}

// 更新所有文字块的动画速度（用于全局更新）
function updateAnimationSpeedForAllBlocks() {
  blocks.forEach(blockData => {
    const block = blockData.block;
    const speed = blockData.animationSpeed || 1;
    const defaultDuration = getDefaultAnimationDuration(blockData.animation || animSelect.value);
    const newDuration = defaultDuration / speed;
    
    // 如果是 Canvas 动画，更新动画时长
    const animState = halfFilterAnimators.get(block);
    if (animState) {
      animState.duration = newDuration * 1000;
      animState.startTime = performance.now();
    } else {
      block.style.setProperty('--animation-duration', newDuration + 's');
    }
  });
}

// 获取动画的默认时长
function getDefaultAnimationDuration(animType) {
  const durations = {
    'shake': 0.3,
    'fall': 1.5,
    'jump': 0.6,
    'run': 0.8,
    'walk': 1,
    'spin': 1,
    'blink': 0.5,
    'pulse': 1,
    'sway': 1.5,
    'bounce': 0.6,
    'float': 2,
    'vibrate': 0.2,
    'slide': 1.2,
    'zoom': 1,
    'swing': 1,
    'dive': 1,
    'rise': 1,
    'dash': 0.5,
    'breathe': 3,
    'flicker': 0.4,
    'wave': 0.8,
    'clap': 0.5,
    'nod': 0.6,
    'shakehead': 0.8,
    'run2': 0.6,
    'fly': 1,
    'crawl': 1.2,
    'jump2': 0.7,
    'waddle': 1,
    'stretch': 2,
    'sleep': 3,
    'eat': 0.6,
    'legKick': 0.6, 'footTap': 0.4, 'legSwing': 0.8, 'hipShake': 0.6, 'kneeBend': 0.6, 'footWiggle': 0.5, 'legMarch': 0.8, 'hipTwist': 0.8, 'footStomp': 0.5, 'legStretch': 0.8, 'bigKick': 0.8, 'stompHard': 0.6, 'shakeHip': 0.8, 'highStep': 0.8, 'twistWaist': 1.0, 'jumpFeet': 0.8, 'wiggleLeg': 0.6, 'slideFeet': 1.0, 'squatBounce': 0.8, 'splitLegs': 0.8, 'crazyKick': 1.0, 'wildStomp': 0.8, 'hipSwing': 0.8, 'legFling': 0.8, 'crazyDance': 1.0, 'jumpSplit': 0.8, 'legShake': 0.6, 'squatKick': 1.0, 'twistJump': 1.0, 'wildSlide': 0.8, 'flip3D': 1.2, 'rotate3DY': 1.5, 'rotate3DX': 1.5, 'swing3D': 1.2, 'zoom3D': 1.0, 'spin3D': 1.5, 'tilt3D': 1.2, 'bounce3D': 1.0, 'twist3D': 1.2, 'roll3D': 1.5, 'explode3D': 1.2, 'implode3D': 1.0, 'spiral3D': 1.5, 'wobble3D': 1.0, 'flipOut3D': 1.0, 'shake3D': 0.8, 'pulse3D': 1.2, 'swingWild3D': 1.2, 'zoomCrazy3D': 1.2, 'rotateCrazy3D': 1.5,
    // Canvas 位移动画
    'dispSwing': 0.8, 'dispShake': 0.3, 'dispBounce': 0.5, 'dispScale': 0.8, 'dispSlide': 0.7, 'dispBend': 0.9, 'dispFling': 0.6, 'dispVibrate': 0.15, 'dispSway': 1.0, 'dispLens': 1.2,
    'dispWave': 0.9, 'dispTwist': 0.8, 'dispPulse': 0.6, 'dispWobble': 0.7, 'dispSquash': 0.5, 'dispZigzag': 0.4, 'dispOrbit': 1.0, 'dispBreath': 1.2, 'dispSpiral': 1.0, 'dispRipple': 0.8,
    'disp3DRotX': 1.0, 'disp3DRotY': 1.2, 'disp3DFlip': 0.8, 'disp3DWave': 0.9, 'disp3DZoom': 0.7, 'disp3DPersp': 1.0, 'disp3DSwing': 0.8, 'disp3DBounce': 0.6, 'disp3DTwist': 0.9, 'disp3DBreath': 1.2,
    'bothSwing': 0.8, 'bothShake': 0.3, 'bothBounce': 0.5, 'bothScale': 0.8, 'bothBend': 0.9, 'bothPulse': 0.6, 'bothWobble': 0.7, 'bothOrbit': 1.0, 'bothSquash': 0.5, 'bothTwist': 0.9
  };
  // 自定义插件动画的默认时长
  if (typeof AnimPluginLoader !== 'undefined' && AnimPluginLoader.isLoaded()) {
    const pluginDur = AnimPluginLoader.getDefaultDuration(animType);
    if (pluginDur) return pluginDur;
  }
  
  return durations[animType] || 1;
}

// 字重动画控制 - 每个文字块独立管理
const weightAnimStates = new Map(); // 存储每个块的动画状态
let globalWeightAnimFrameId = null;
const weightAnimBtn = document.getElementById('weightAnimBtn');
const weightMinInput = document.getElementById('weightMin');
const weightMaxInput = document.getElementById('weightMax');
const weightAnimSpeedInput = document.getElementById('weightSpeed');

// 动画循环/单次模式
const animLoopBtn = document.getElementById('animLoopBtn');
const onceTimeSettings = document.getElementById('onceTimeSettings');
const animStartTimeInput = document.getElementById('animStartTime');
const animEndTimeInput = document.getElementById('animEndTime');
let isAnimLoopMode = true; // 默认循环模式

// 循环/单次切换按钮
if (animLoopBtn) {
  animLoopBtn.addEventListener('click', () => {
    if (selectedBlocks.length === 0) {
      showTip('请先选中文字块');
      return;
    }
    
    isAnimLoopMode = !isAnimLoopMode;
    
    if (isAnimLoopMode) {
      animLoopBtn.textContent = '🔄 循环';
      animLoopBtn.style.background = '#10b981';
      if (onceTimeSettings) onceTimeSettings.style.display = 'none';
    } else {
      animLoopBtn.textContent = '⏱ 单次';
      animLoopBtn.style.background = '#f59e0b';
      if (onceTimeSettings) onceTimeSettings.style.display = 'flex';
    }
    
    // 更新所有选中块的动画模式
    selectedBlocks.forEach(block => {
      updateBlockAnimationMode(block, isAnimLoopMode);
    });
    
    showTip(isAnimLoopMode ? '循环模式' : '单次模式');
  });
}

// 起始时间/结束时间变化时更新动画
if (animStartTimeInput) {
  animStartTimeInput.addEventListener('change', () => {
    const startTime = parseFloat(animStartTimeInput.value) || 0;
    if (selectedBlocks.length > 0) {
      selectedBlocks.forEach(block => {
        const blockData = blocks.find(b => b.block === block);
        if (blockData) {
          blockData.animStartTime = startTime;
        }
        if (!blockData?.animLoop) {
          updateBlockAnimation(block);
          addAnimToTimeline(block);
        }
      });
    } else if (selectedBgImageId !== null) {
      const bgImg = bgImages.find(b => b.id === selectedBgImageId);
      if (bgImg) {
        bgImg.animStartTime = startTime;
        addAnimToTimeline('bg_' + selectedBgImageId);
      }
    } else if (selectedVideoId !== null) {
      const vid = videoItems.find(v => v.id === selectedVideoId);
      if (vid) {
        vid.animStartTime = startTime;
        addAnimToTimeline('video_' + selectedVideoId);
      }
    }
    renderTimeline();
  });
}

if (animEndTimeInput) {
  animEndTimeInput.addEventListener('change', () => {
    const endTime = parseFloat(animEndTimeInput.value) || 2;
    if (selectedBlocks.length > 0) {
      selectedBlocks.forEach(block => {
        const blockData = blocks.find(b => b.block === block);
        if (blockData) {
          blockData.animEndTime = endTime;
        }
        if (!blockData?.animLoop) {
          updateBlockAnimation(block);
          addAnimToTimeline(block);
        }
      });
    } else if (selectedBgImageId !== null) {
      const bgImg = bgImages.find(b => b.id === selectedBgImageId);
      if (bgImg) {
        bgImg.animEndTime = endTime;
        addAnimToTimeline('bg_' + selectedBgImageId);
      }
    } else if (selectedVideoId !== null) {
      const vid = videoItems.find(v => v.id === selectedVideoId);
      if (vid) {
        vid.animEndTime = endTime;
        addAnimToTimeline('video_' + selectedVideoId);
      }
    }
    renderTimeline();
  });
}

// 更新文字块动画模式（循环/单次）
function updateBlockAnimationMode(block, isLoop) {
  const blockData = blocks.find(b => b.block === block);
  if (blockData) {
    blockData.animLoop = isLoop;
    // 保存当前时间设置
    if (!isLoop) {
      // 如果块还没有设置过时间，使用动画默认时长作为参考
      if (blockData.animStartTime === undefined || blockData.animEndTime === undefined) {
        const animType = blockData.animation || animSelect?.value || 'pulse';
        const defaultDuration = getDefaultAnimationDuration(animType);
        const speed = blockData.animationSpeed || 1;
        const duration = defaultDuration / speed;
        blockData.animStartTime = 0;
        blockData.animEndTime = Math.max(duration, 0.5);
        // 同步更新输入框
        if (animStartTimeInput) animStartTimeInput.value = 0;
        if (animEndTimeInput) animEndTimeInput.value = blockData.animEndTime.toFixed(1);
      } else {
        // 使用块自己保存的时间
        blockData.animStartTime = parseFloat(animStartTimeInput?.value) || blockData.animStartTime || 0;
        blockData.animEndTime = parseFloat(animEndTimeInput?.value) || blockData.animEndTime || 2;
      }
    }
  }
  
  // 如果正在播放动画，更新动画
  if (isAnimPlaying) {
    updateBlockAnimation(block);
  }
  
  // 单次模式添加到时间轴，循环模式从时间轴移除
  if (!isLoop) {
    addAnimToTimeline(block);
  } else {
    removeAnimFromTimeline(block);
  }
  renderTimeline();
}

// 将动画添加到时间轴
function addAnimToTimeline(blockOrId) {
  // 接受块元素或 blockId 字符串；支持文字块 / 图片(bg_) / 视频(video_)
  let blockId, blockData = null;
  if (typeof blockOrId === 'string') {
    blockId = blockOrId;
  } else {
    blockId = blockOrId?.dataset?.id;
    if (blockOrId) blockData = blocks.find(b => b.block === blockOrId);
  }
  if (!blockId) return;
  
  const blockAnim = blockData?.animation || animSelect?.value;
  if (!blockAnim || blockAnim === 'none') return;
  
  // 优先使用块自己的时间设置，其次使用全局输入框
  const startTime = blockData?.animStartTime ?? (parseFloat(animStartTimeInput?.value) || 0);
  const endTime = blockData?.animEndTime ?? (parseFloat(animEndTimeInput?.value) || 2);
  const duration = Math.max(0.1, endTime - startTime);
  const isLoop = blockData?.animLoop ?? isAnimLoopMode;
  
  if (!blockAnimations[blockId]) {
    blockAnimations[blockId] = [];
  }
  
  // 允许多个 preset 动画叠加（不再 filter 清空）
  // 但同 startTime + anim 组合去重，避免重复添加
  const exists = blockAnimations[blockId].some(a => a.type === 'preset' && a.anim === blockAnim && Math.abs((a.startTime || 0) - startTime) < 0.01);
  if (exists) return;
  
  // 添加新的预设动画
  blockAnimations[blockId].push({
    type: 'preset',
    anim: blockAnim,
    startTime: startTime,
    duration: duration,
    loop: isLoop
  });
}

// 从时间轴移除预设动画
function removeAnimFromTimeline(block) {
  const blockId = block.dataset.id;
  if (!blockId || !blockAnimations[blockId]) return;
  
  // 移除预设动画
  blockAnimations[blockId] = blockAnimations[blockId].filter(a => a.type !== 'preset');
  
  // 如果数组为空，删除该块的时间轴数据
  if (blockAnimations[blockId].length === 0) {
    delete blockAnimations[blockId];
  }
}

// 启动/关闭字重动画按钮
if (weightAnimBtn) {
  weightAnimBtn.addEventListener('click', () => {
    if (selectedBlocks.length === 0) {
      showTip('请先选中文字块');
      return;
    }
    
    // 检查是否所有选中块都在播放动画
    const allPlaying = selectedBlocks.every(block => weightAnimStates.has(block.dataset.id));
    
    if (allPlaying) {
      selectedBlocks.forEach(block => stopWeightAnimationForBlock(block));
      weightAnimBtn.classList.remove('active');
      weightAnimBtn.textContent = '启动';
      showTip('字重动画已关闭');
    } else {
      selectedBlocks.forEach(block => startWeightAnimationForBlock(block));
      weightAnimBtn.classList.add('active');
      weightAnimBtn.textContent = '关闭';
      showTip('字重动画已启动');
    }
  });
}

// 字重范围和速度设置的事件监听器
if (weightMinInput) {
  weightMinInput.addEventListener('change', () => updateSelectedBlocksWeightSettings());
}

if (weightMaxInput) {
  weightMaxInput.addEventListener('change', () => updateSelectedBlocksWeightSettings());
}

if (weightAnimSpeedInput) {
  weightAnimSpeedInput.addEventListener('input', () => updateSelectedBlocksWeightSettings());
}

// 更新选中文字块的字重动画设置
function updateSelectedBlocksWeightSettings() {
  if (selectedBlocks.length === 0) return;
  
  const minWeight = parseInt(weightMinInput.value) || 100;
  const maxWeight = parseInt(weightMaxInput.value) || 900;
  const speed = parseFloat(weightAnimSpeedInput.value) || 1;
  
  selectedBlocks.forEach(block => {
    const blockId = block.dataset.id;
    const blockData = blocks.find(b => b.block === block);
    if (blockData) {
      blockData.weightAnimMin = minWeight;
      blockData.weightAnimMax = maxWeight;
      blockData.weightAnimSpeed = speed;
    }
    
    // 如果该块正在播放动画，更新其动画状态
    if (weightAnimStates.has(blockId)) {
      const state = weightAnimStates.get(blockId);
      state.minWeight = minWeight;
      state.maxWeight = maxWeight;
      state.cycleDuration = 2000 / speed;
    }
  });
}

// 为单个文字块启动字重动画
function startWeightAnimationForBlock(block) {
  const blockId = block.dataset.id;
  
  // 如果已经在播放，先停止
  if (weightAnimStates.has(blockId)) {
    cancelAnimationFrame(weightAnimStates.get(blockId).frameId);
  }
  
  // 从块数据中获取字重范围和速度，优先使用时间轴动画条目的设置
  const blockData = blocks.find(b => b.id === blockId);
  // 检查时间轴动画条目中是否有字重设置
  const existingWeightAnimEntry = blockAnimations[blockId]?.find(a => a.type === 'weight');
  
  let minWeight, maxWeight, speed;
  if (existingWeightAnimEntry && existingWeightAnimEntry.weightAnimMin != null) {
    // 使用动画条目中的设置
    minWeight = existingWeightAnimEntry.weightAnimMin;
    maxWeight = existingWeightAnimEntry.weightAnimMax;
    speed = existingWeightAnimEntry.weightAnimSpeed ?? 1;
  } else {
    // 回退到块数据或全局设置
    minWeight = blockData?.weightAnimMin ?? (parseInt(weightMinInput.value) || 100);
    maxWeight = blockData?.weightAnimMax ?? (parseInt(weightMaxInput.value) || 900);
    speed = blockData?.weightAnimSpeed ?? (parseFloat(weightAnimSpeedInput.value) || 1);
  }
  const cycleDuration = 2000 / speed; // 根据速度调整周期
  const startTime = performance.now();
  
  // 保存原始字重（用于关闭动画时恢复）
  const originalWeight = blockData?.weight || parseInt(window.getComputedStyle(block).fontWeight) || 400;
  
  const animState = {
    blockId: blockId,
    block: block,
    startTime: startTime,
    minWeight: minWeight,
    maxWeight: maxWeight,
    cycleDuration: cycleDuration,
    frameId: null,
    originalWeight: originalWeight // 保存原始字重
  };
  
  weightAnimStates.set(blockId, animState);
  
  // 标记文字块正在播放动画
  block.dataset.weightAnim = 'true';
  
  // 将字重动画添加到时间轴
  if (!blockAnimations[blockId]) {
    blockAnimations[blockId] = [];
  }
  
  // 检查是否已经存在字重动画
  const existingWeightAnim = blockAnimations[blockId].find(a => a.type === 'weight');
  if (!existingWeightAnim) {
    // 计算开始时间
    let startTime = 0;
    if (blockAnimations[blockId].length > 0) {
      startTime = Math.max(...blockAnimations[blockId].map(a => a.startTime + a.duration));
    }
    
    blockAnimations[blockId].push({
      type: 'weight',
      anim: 'weightAnim',
      startTime: startTime,
      duration: 3, // 字重动画默认3秒
      weightAnimMin: minWeight,
      weightAnimMax: maxWeight,
      weightAnimSpeed: speed
    });
    
    // 刷新时间轴
    renderTimeline();
  }
  
  // 确保全局动画循环在运行
  if (!globalWeightAnimFrameId) {
    runGlobalWeightAnimation();
  }
}

// 为单个文字块停止字重动画
function stopWeightAnimationForBlock(block) {
  const blockId = block.dataset.id;
  
  if (weightAnimStates.has(blockId)) {
    const state = weightAnimStates.get(blockId);
    weightAnimStates.delete(blockId);
    block.dataset.weightAnim = 'false';
    
    // 获取原始字重
    const originalWeight = state.originalWeight || 400;
    
    // 恢复原始字重
    const restoredWeightStr = `'wght' ${originalWeight}`;
    block.style.fontVariationSettings = restoredWeightStr;
    
    const editInput = block.querySelector('.edit-input');
    if (editInput) {
      editInput.style.fontVariationSettings = restoredWeightStr;
    }
    
    const textContent = block.querySelector('.text-content');
    if (textContent) {
      textContent.style.fontVariationSettings = restoredWeightStr;
    }
    
    // 更新 blockData 中的字重
    const blockData = blocks.find(b => b.block === block);
    if (blockData) {
      blockData.weight = originalWeight;
    }
    
    // 同步更新控制面板
    if (selectedBlocks.includes(block) && selectedBlocks[0] === block) {
      wght.value = originalWeight;
      wNum.value = originalWeight;
    }
    
    // 如果有 Canvas 动画在运行，强制刷新一次渲染
    const animState = halfFilterAnimators.get(block);
    if (animState) {
      // 强制立即重绘，使用恢复后的字重
      animState.needsRedraw = true;
      // 触发一次立即渲染
      drawDisplacedText(animState, 0, 0);
    }
  }
  
  // 从时间轴中移除字重动画
  if (blockAnimations[blockId]) {
    blockAnimations[blockId] = blockAnimations[blockId].filter(a => a.type !== 'weight');
    renderTimeline();
  }
  
  // 如果没有动画在播放，停止全局循环
  if (weightAnimStates.size === 0 && globalWeightAnimFrameId) {
    cancelAnimationFrame(globalWeightAnimFrameId);
    globalWeightAnimFrameId = null;
  }
}

// 全局字重动画循环
function runGlobalWeightAnimation() {
  function animate() {
    if (weightAnimStates.size === 0) {
      globalWeightAnimFrameId = null;
      return;
    }
    
    const currentTime = performance.now();
    
    weightAnimStates.forEach((state, blockId) => {
      const elapsed = currentTime - state.startTime;
      const progress = (elapsed % state.cycleDuration) / state.cycleDuration;
      
      // 使用正弦波实现平滑过渡
      const weight = state.minWeight + (state.maxWeight - state.minWeight) * 
                     (0.5 + 0.5 * Math.sin(progress * 2 * Math.PI - Math.PI / 2));
      const roundedWeight = Math.round(weight);
      
      // 更新文字块样式
      state.block.style.fontVariationSettings = `'wght' ${roundedWeight}`;
      const editInput = state.block.querySelector('.edit-input');
      if (editInput) {
        editInput.style.fontVariationSettings = `'wght' ${roundedWeight}`;
      }
      // 更新 text-content 样式（Canvas 动画读取这个元素的 computedStyle）
      const textContent = state.block.querySelector('.text-content');
      if (textContent) {
        textContent.style.fontVariationSettings = `'wght' ${roundedWeight}`;
      }
      const blockData = blocks.find(b => b.block === state.block);
      if (blockData) {
        blockData.weight = roundedWeight;
      }
      
      // 如果文字块在当前选中列表中，同步更新控制面板
      if (selectedBlocks.includes(state.block) && selectedBlocks[0] === state.block) {
        wght.value = roundedWeight;
        wNum.value = roundedWeight;
      }
    });
    
    globalWeightAnimFrameId = requestAnimationFrame(animate);
  }
  
  globalWeightAnimFrameId = requestAnimationFrame(animate);
}

// 播放/暂停按钮
if (playBtn) {
  playBtn.addEventListener('click', () => {
    if (selectedBlocks.length === 0) {
      showTip('请先选中文字块');
      return;
    }
    isAnimPlaying = !isAnimPlaying;
    playBtn.classList.toggle('playing', isAnimPlaying);
    playBtn.textContent = isAnimPlaying ? '⏸' : '▶';
    updateAllAnimations();
  });
}

// 动画预设选择（下拉菜单单选）
if (animSelect) {
  animSelect.addEventListener('change', () => {
    if (selectedBlocks.length === 0) {
      showTip('请先选中文字块');
      return;
    }
    // 多选选项不执行
    if (animSelect.value === '__multi__') return;
    
    // 自动开始播放
    if (!isAnimPlaying) {
      isAnimPlaying = true;
      if (playBtn) {
        playBtn.classList.add('playing');
        playBtn.textContent = '⏸';
      }
    }
    const newAnim = animSelect.value;
    selectedBlocks.forEach(block => {
      const blockData = blocks.find(b => b.block === block);
      if (blockData) {
        blockData.animation = newAnim;
      }
      updateBlockAnimation(block);
    });
    renderTimeline();
    showTip('动画已启动');
  });
}

// 更新单个文字块的动画
function updateBlockAnimation(block) {
  // 移除所有动画类
  const animClasses = Array.from(block.classList).filter(c => c.startsWith('anim-'));
  animClasses.forEach(cls => block.classList.remove(cls));
  
  // 清理下半部分动画状态
  stopHalfFilterAnimation(block);
  block.classList.remove('half-anim');
  const bottomLayer = block.querySelector('.text-content-bottom');
  if (bottomLayer) {
    bottomLayer.remove();
  }
  
  // 获取块的动画模式和动画类型
  const blockData = blocks.find(b => b.block === block);
  const isLoop = blockData?.animLoop ?? isAnimLoopMode;
  // 优先使用块自己保存的动画类型（非 none 时），其次使用全局下拉框的值
  let selectedAnim = 'none';
  if (blockData?.animation && blockData.animation !== 'none') {
    selectedAnim = blockData.animation;
  } else if (animSelect?.value && animSelect.value !== 'none' && animSelect.value !== '__multi__') {
    selectedAnim = animSelect.value;
  }
  
  // 保存动画类型到块数据
  if (blockData) {
    blockData.animation = selectedAnim;
  }
  
  // 设置动画迭代次数
  if (isLoop) {
    block.style.animationIterationCount = 'infinite';
  } else {
    block.style.animationIterationCount = '1';
    block.style.animationFillMode = 'forwards';
  }
  
  // 无论是否播放动画，都应用旋转和翻转
  if (isAnimPlaying) {
    // 播放状态
    if (selectedAnim !== 'none') {
      // 检查是否是 Canvas 位移动画（disp 或 both 开头）
      if (selectedAnim.startsWith('disp') || selectedAnim.startsWith('both')) {
        applyStaticTransform(block);
        startHalfFilterAnimation(block, selectedAnim, isLoop);
      } else {
        applyAnimatedTransform(block, selectedAnim);
        block.classList.add('anim-' + selectedAnim);
      }
      
      // 单次模式下，自动添加到时间轴；循环模式下从时间轴移除
      if (!isLoop) {
        addAnimToTimeline(block);
      } else {
        removeAnimFromTimeline(block);
      }
    } else {
      applyStaticTransform(block);
      // 无动画时从时间轴移除
      removeAnimFromTimeline(block);
    }
  } else {
    // 非播放状态，应用静态变换
    applyStaticTransform(block);
  }
}

// ========== Canvas 位移动画（下半部分动，上半不动，中间连续无断开） ==========
const halfFilterAnimators = new Map();

function startHalfFilterAnimation(block, animType, isLoop = true) {
  stopHalfFilterAnimation(block);
  
  const configMap = {
    'dispSwing':   { type: 'swing',   maxDisp: 12, duration: 0.8,  dir: 'x' },
    'dispShake':   { type: 'shake',   maxDisp: 8,  duration: 0.3,  dir: 'x' },
    'dispBounce':  { type: 'bounce',  maxDisp: 18, duration: 0.5,  dir: 'y' },
    'dispScale':   { type: 'scale',   maxDisp: 15, duration: 0.8,  dir: 'xy' },
    'dispSlide':   { type: 'slide',   maxDisp: 15, duration: 0.7,  dir: 'x' },
    'dispBend':    { type: 'bend',    maxDisp: 12, duration: 0.9,  dir: 'xy' },
    'dispFling':   { type: 'fling',   maxDisp: 20, duration: 0.6,  dir: 'x' },
    'dispVibrate': { type: 'vibrate', maxDisp: 6,  duration: 0.15, dir: 'xy' },
    'dispSway':    { type: 'sway',    maxDisp: 18, duration: 1.0,  dir: 'x' },
    'dispLens':    { type: 'lens',    maxDisp: 15, duration: 1.2,  dir: 'lens' },
    // 新增 10 个普通动画
    'dispWave':    { type: 'wave',    maxDisp: 10, duration: 0.9,  dir: 'x' },
    'dispTwist':   { type: 'twist',   maxDisp: 15, duration: 0.8,  dir: 'x' },
    'dispPulse':   { type: 'pulse',   maxDisp: 12, duration: 0.6,  dir: 'xy' },
    'dispWobble':  { type: 'wobble',  maxDisp: 10, duration: 0.7,  dir: 'xy' },
    'dispSquash':  { type: 'squash',  maxDisp: 18, duration: 0.5,  dir: 'xy' },
    'dispZigzag':  { type: 'zigzag',  maxDisp: 12, duration: 0.4,  dir: 'x' },
    'dispOrbit':   { type: 'orbit',   maxDisp: 10, duration: 1.0,  dir: 'xy' },
    'dispBreath':  { type: 'breath',  maxDisp: 8,  duration: 1.2,  dir: 'xy' },
    'dispSpiral':  { type: 'spiral',  maxDisp: 12, duration: 1.0,  dir: 'xy' },
    'dispRipple':  { type: 'ripple',  maxDisp: 10, duration: 0.8,  dir: 'y' },
    // 10 个 3D 动画
    'disp3DRotX':  { type: 'rot3dx',  maxDisp: 25, duration: 1.0,  dir: '3d' },
    'disp3DRotY':  { type: 'rot3dy',  maxDisp: 30, duration: 1.2,  dir: '3d' },
    'disp3DFlip':  { type: 'flip3d',  maxDisp: 28, duration: 0.8,  dir: '3d' },
    'disp3DWave':  { type: 'wave3d',  maxDisp: 15, duration: 0.9,  dir: '3d' },
    'disp3DZoom':  { type: 'zoom3d',  maxDisp: 20, duration: 0.7,  dir: '3d' },
    'disp3DPersp': { type: 'persp3d', maxDisp: 22, duration: 1.0,  dir: '3d' },
    'disp3DSwing': { type: 'swing3d', maxDisp: 20, duration: 0.8,  dir: '3d' },
    'disp3DBounce':{ type: 'bounce3d',maxDisp: 25, duration: 0.6,  dir: '3d' },
    'disp3DTwist': { type: 'twist3d', maxDisp: 18, duration: 0.9,  dir: '3d' },
    'disp3DBreath':{ type: 'breath3d',maxDisp: 15, duration: 1.2,  dir: '3d' },
    // 10 个上下动中间不动动画
    'bothSwing':   { type: 'swing',   maxDisp: 10, duration: 0.8,  dir: 'both' },
    'bothShake':   { type: 'shake',   maxDisp: 7,  duration: 0.3,  dir: 'both' },
    'bothBounce':  { type: 'bounce',  maxDisp: 15, duration: 0.5,  dir: 'both' },
    'bothScale':   { type: 'scale',   maxDisp: 12, duration: 0.8,  dir: 'both' },
    'bothBend':    { type: 'bend',    maxDisp: 10, duration: 0.9,  dir: 'both' },
    'bothPulse':   { type: 'pulse',   maxDisp: 10, duration: 0.6,  dir: 'both' },
    'bothWobble':  { type: 'wobble',  maxDisp: 8,  duration: 0.7,  dir: 'both' },
    'bothOrbit':   { type: 'orbit',   maxDisp: 8,  duration: 1.0,  dir: 'both' },
    'bothSquash':  { type: 'squash',  maxDisp: 15, duration: 0.5,  dir: 'both' },
    'bothTwist':   { type: 'twist3d', maxDisp: 12, duration: 0.9,  dir: 'both3d' }
  };
  
  const config = configMap[animType];
  if (!config) return;
  
  const textContent = block.querySelector('.text-content');
  if (!textContent) return;
  
  // 创建 canvas
  const canvas = document.createElement('canvas');
  canvas.className = 'half-anim-canvas';
  canvas.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 2;
  `;
  block.appendChild(canvas);
  
  // 隐藏原始文字
  textContent.style.visibility = 'hidden';
  
  // 获取翻转状态
  const flipX = block.dataset.flipped === 'true' ? -1 : 1;
  
  // 获取动画速度
  const blockData = blocks.find(b => b.block === block);
  const speed = blockData?.animationSpeed || 1;
  
  const animState = {
    block: block,
    canvas: canvas,
    ctx: canvas.getContext('2d'),
    textContent: textContent,
    config: config,
    startTime: performance.now(),
    duration: (config.duration / speed) * 1000,
    rafId: null,
    dpr: window.devicePixelRatio || 1,
    flipX: flipX,
    flipY: 1,
    animType: animType,
    isLoop: isLoop
  };
  
  function render() {
    const now = performance.now();
    let elapsed = now - animState.startTime;
    let t;
    let isFinished = false;
    
    if (animState.isLoop) {
      elapsed = elapsed % animState.duration;
      t = elapsed / animState.duration;
    } else {
      // 单次模式
      if (elapsed >= animState.duration) {
        t = 1;
        isFinished = true;
      } else {
        t = elapsed / animState.duration;
      }
    }
    
    // 计算当前位移量
    let dispX = 0, dispY = 0;
    
    switch (animState.config.type) {
      case 'static':
        // 静态动画 - 不做任何位移
        break;
      case 'swing':
      case 'sway':
      case 'slide':
        dispX = Math.sin(t * Math.PI * 2) * animState.config.maxDisp;
        break;
      case 'shake':
        dispX = Math.sin(t * Math.PI * 4) * animState.config.maxDisp;
        break;
      case 'bounce':
        const b = t * 2;
        dispY = b < 1 
          ? -animState.config.maxDisp * (1 - Math.pow(1 - b, 2))
          : -animState.config.maxDisp * 0.3 * (1 - Math.pow(2 - b, 2));
        break;
      case 'scale':
      case 'breath':
        const s = (1 - Math.cos(t * Math.PI * 2)) / 2;
        dispX = s * animState.config.maxDisp * 0.5;
        dispY = s * animState.config.maxDisp;
        break;
      case 'bend':
        dispX = Math.sin(t * Math.PI * 2) * animState.config.maxDisp * 0.8;
        dispY = Math.sin(t * Math.PI * 2) * animState.config.maxDisp * 0.3;
        break;
      case 'fling':
        const f = t;
        if (f < 0.4) dispX = (f / 0.4) * animState.config.maxDisp;
        else if (f < 0.7) dispX = animState.config.maxDisp - ((f - 0.4) / 0.3) * animState.config.maxDisp * 0.3;
        else dispX = animState.config.maxDisp * 0.7 - ((f - 0.7) / 0.3) * animState.config.maxDisp * 1.7;
        break;
      case 'vibrate':
        const vPhase = t * Math.PI * 8;
        dispX = Math.sin(vPhase) * animState.config.maxDisp * (0.7 + Math.sin(t * 50) * 0.3);
        dispY = Math.cos(vPhase * 1.3) * animState.config.maxDisp * 0.5;
        break;
      case 'lens':
        const ls = (1 - Math.cos(t * Math.PI * 2)) / 2;
        dispX = ls * animState.config.maxDisp;
        dispY = ls * animState.config.maxDisp * 0.5;
        break;
      // 新增普通动画
      case 'wave':
        dispX = Math.sin(t * Math.PI * 2) * animState.config.maxDisp * 0.6;
        break;
      case 'twist':
        dispX = Math.sin(t * Math.PI * 2) * animState.config.maxDisp;
        break;
      case 'pulse':
        const ps = (1 - Math.cos(t * Math.PI * 4)) / 2;
        dispX = ps * animState.config.maxDisp * 0.5;
        dispY = ps * animState.config.maxDisp * 0.8;
        break;
      case 'wobble':
        dispX = Math.sin(t * Math.PI * 3) * animState.config.maxDisp * 0.7;
        dispY = Math.sin(t * Math.PI * 2) * animState.config.maxDisp * 0.4;
        break;
      case 'squash':
        const sq = t * 2;
        const sqY = sq < 1 
          ? -animState.config.maxDisp * (1 - Math.pow(1 - sq, 3))
          : animState.config.maxDisp * 0.5 * (1 - Math.pow(2 - sq, 2));
        dispY = sqY;
        dispX = -sqY * 0.4;
        break;
      case 'zigzag':
        const zz = t * 6;
        const zzPhase = Math.floor(zz) % 2;
        dispX = animState.config.maxDisp * (zzPhase === 0 ? 1 : -1) * (1 - (zz % 1));
        break;
      case 'orbit':
        dispX = Math.sin(t * Math.PI * 2) * animState.config.maxDisp;
        dispY = Math.cos(t * Math.PI * 2) * animState.config.maxDisp * 0.6;
        break;
      case 'spiral':
        const sp = t * Math.PI * 4;
        const spR = animState.config.maxDisp * (0.3 + t * 0.7);
        dispX = Math.sin(sp) * spR;
        dispY = Math.cos(sp) * spR * 0.5;
        break;
      case 'ripple':
        dispY = Math.sin(t * Math.PI * 3) * animState.config.maxDisp * 0.5;
        break;
      // 3D 动画
      case 'rot3dx':
        dispY = Math.sin(t * Math.PI * 2) * animState.config.maxDisp * 0.3;
        break;
      case 'rot3dy':
        dispX = Math.sin(t * Math.PI * 2) * animState.config.maxDisp;
        break;
      case 'flip3d':
        dispX = Math.sin(t * Math.PI * 2) * animState.config.maxDisp * 0.8;
        break;
      case 'wave3d':
        dispX = Math.sin(t * Math.PI * 2) * animState.config.maxDisp * 0.5;
        dispY = Math.sin(t * Math.PI * 4) * animState.config.maxDisp * 0.3;
        break;
      case 'zoom3d':
        const zs = (1 - Math.cos(t * Math.PI * 2)) / 2;
        dispX = zs * animState.config.maxDisp * 0.6;
        dispY = zs * animState.config.maxDisp;
        break;
      case 'persp3d':
        dispX = Math.sin(t * Math.PI * 2) * animState.config.maxDisp * 0.7;
        break;
      case 'swing3d':
        dispX = Math.sin(t * Math.PI * 2) * animState.config.maxDisp * 0.8;
        dispY = Math.abs(Math.sin(t * Math.PI * 2)) * animState.config.maxDisp * 0.3;
        break;
      case 'bounce3d':
        const b3 = t * 2;
        dispY = b3 < 1 
          ? -animState.config.maxDisp * (1 - Math.pow(1 - b3, 2))
          : -animState.config.maxDisp * 0.3 * (1 - Math.pow(2 - b3, 2));
        dispX = Math.abs(dispY) * 0.3;
        break;
      case 'twist3d':
        dispX = Math.sin(t * Math.PI * 3) * animState.config.maxDisp * 0.6;
        dispY = Math.cos(t * Math.PI * 2) * animState.config.maxDisp * 0.4;
        break;
      case 'breath3d':
        const bs = (1 - Math.cos(t * Math.PI * 2)) / 2;
        dispX = bs * animState.config.maxDisp * 0.7;
        dispY = bs * animState.config.maxDisp * 0.5;
        break;
    }
    
    drawDisplacedText(animState, dispX, dispY);
    
    if (!isFinished) {
      animState.rafId = requestAnimationFrame(render);
    } else {
      animState.finished = true;
    }
  }
  
  animState.rafId = requestAnimationFrame(render);
  halfFilterAnimators.set(block, animState);
}

function drawDisplacedText(animState, dispX, dispY) {
  const { canvas, ctx, textContent, config, dpr, flipX, flipY, animType } = animState;
  const block = animState.block;
  
  // 尺寸用 offsetWidth/offsetHeight（不受 transform scale 影响）
  const rectW = textContent.offsetWidth;
  const rectH = textContent.offsetHeight;

  // 位置用 getBoundingClientRect 计算相对位置，再除以缩放比例
  const textRect = textContent.getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();
  // 计算容器缩放比例（getBoundingClientRect尺寸 / offset尺寸）
  const scaleX = blockRect.width / block.offsetWidth;
  const scaleY = blockRect.height / block.offsetHeight;
  // 相对位置（反缩放回 CSS 像素值）
  const relLeft = (textRect.left - blockRect.left) / (scaleX || 1);
  const relTop = (textRect.top - blockRect.top) / (scaleY || 1);

  const is3D = config.dir === '3d';
  const extraW = is3D ? Math.abs(dispX) * 3 + 60 : Math.abs(dispX) * 2 + 40;
  const extraH = is3D ? Math.abs(dispY) * 3 + 60 : Math.abs(dispY) * 2 + 40;

  const w = Math.ceil(rectW + extraW);
  const h = Math.ceil(rectH + extraH);

  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.style.left = (relLeft - extraW / 2) + 'px';
    canvas.style.top = (relTop - extraH / 2) + 'px';
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);
  
  // 字体样式
  const style = window.getComputedStyle(textContent);
  let baseWeight = 400;
  // 尝试从 fontWeight 获取字重
  if (style.fontWeight) {
    const parsed = parseInt(style.fontWeight);
    if (!isNaN(parsed) && parsed >= 100 && parsed <= 1000) {
      baseWeight = parsed;
    }
  }
  // 尝试从 fontVariationSettings 获取字重（更准确）
  if (style.fontVariationSettings && style.fontVariationSettings !== 'normal' && style.fontVariationSettings !== '') {
    const wghtMatch = style.fontVariationSettings.match(/["']?wght["']?\s+(\d+)/i);
    if (wghtMatch) {
      const wghtVal = parseInt(wghtMatch[1]);
      if (wghtVal >= 100 && wghtVal <= 1000) {
        baseWeight = wghtVal;
      }
    }
  }
  const fontSize = style.fontSize;
  const fontFamily = style.fontFamily;
  const color = style.color;
  
  // 检查字重动画
  let currentWeight = baseWeight;
  const weightAnim = block.dataset.weightAnim;
  if (weightAnim === 'true') {
    const now = performance.now();
    const weightCycleDuration = 2000; // 2秒一个周期
    const weightT = (now % weightCycleDuration) / weightCycleDuration;
    // 在 100-900 之间循环
    currentWeight = Math.round(100 + (Math.sin(weightT * Math.PI * 2) + 1) * 400);
  }
  
  // 确保字重值在合理范围内
  currentWeight = Math.max(100, Math.min(900, currentWeight));
  
  // 构建 Canvas font 字符串（Canvas 不支持 font-variation-settings，只能用标准 font-weight）
  // 对于可变字体，直接使用字重值作为 font-weight
  const fontStr = `${currentWeight} ${fontSize} ${fontFamily}`;
  
  ctx.font = fontStr;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  
  const offsetX = extraW / 2;
  const offsetY = extraH / 2;
  
  // 绘制文字到离屏 canvas 以便做像素操作
  const offCanvas = document.createElement('canvas');
  offCanvas.width = canvas.width;
  offCanvas.height = canvas.height;
  const offCtx = offCanvas.getContext('2d');
  offCtx.scale(dpr, dpr);
  offCtx.font = fontStr;
  offCtx.fillStyle = color;
  offCtx.textBaseline = 'top';
  offCtx.textAlign = 'left';
  
  // 获取文本内容
  const lines = textContent.innerHTML.split('<br>');
  const lineHeight = parseFloat(fontSize) * 1.2;
  lines.forEach((line, i) => {
    const plainText = line.replace(/<[^>]*>/g, '');
    offCtx.fillText(plainText, offsetX, offsetY + i * lineHeight);
  });
  
  // 获取像素数据
  const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
  const pixels = imgData.data;
  const wPX = offCanvas.width;
  const hPX = offCanvas.height;
  
  // 创建输出像素（初始化为透明）
  const outData = ctx.createImageData(offCanvas.width, offCanvas.height);
  const outPixels = outData.data;
  
  // 计算位移映射
  const midY = Math.floor(hPX * 0.5);
  const transitionSize = Math.floor(hPX * 0.15);
  const bothMidSize = Math.floor(hPX * 0.2); // 上下动模式的中间静止区域大小
  
  for (let y = 0; y < hPX; y++) {
    // 计算当前 y 位置的位移系数 (0 = 不动, 1 = 最大位移)
    let factor;
    if (config.dir === 'both' || config.dir === 'both3d') {
      // 上下动、中间不动模式
      const distFromMid = Math.abs(y - midY);
      const midHalf = bothMidSize / 2;
      if (distFromMid < midHalf - transitionSize) {
        factor = 0;
      } else if (distFromMid > midHalf + transitionSize) {
        factor = 1;
      } else {
        const t = (distFromMid - (midHalf - transitionSize)) / (transitionSize * 2);
        factor = t * t * (3 - 2 * t);
      }
    } else {
      // 上半不动、下半动模式（原有）
      if (y < midY - transitionSize) {
        factor = 0;
      } else if (y > midY + transitionSize) {
        factor = 1;
      } else {
        const t = (y - (midY - transitionSize)) / (transitionSize * 2);
        factor = t * t * (3 - 2 * t);
      }
    }
    
    if (config.dir === 'lens') {
      const centerY = hPX * 0.75;
      const centerX = wPX * 0.5;
      const maxR = Math.min(wPX, hPX) * 0.4;
      for (let x = 0; x < wPX; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const lensFactor = Math.max(0, 1 - dist / maxR);
        const totalFactor = factor * lensFactor * lensFactor;
        const srcX = Math.round(x - dispX * totalFactor * (dx / maxR) * dpr);
        const srcY = Math.round(y - dispY * totalFactor * (dy / maxR) * dpr);
        copyPixel(pixels, outPixels, wPX, hPX, srcX, srcY, x, y);
      }
    } else if (config.dir === '3d') {
      // 3D 效果：下半部分缩放 + 位移，模拟透视
      const scaleFactor = 1 + factor * (dispY / hPX * dpr * 2);
      const clampedScale = Math.max(0.3, Math.min(2, scaleFactor));
      
      const centerX = wPX / 2;
      const centerY = hPX / 2;
      
      for (let x = 0; x < wPX; x++) {
        const relX = (x - centerX) / wPX;
        const xScaleDisp = relX * (clampedScale - 1) * wPX;
        const xSwingDisp = factor * dispX * dpr * (y / hPX - 0.3);
        const totalXDisp = xScaleDisp + xSwingDisp;
        
        const relY = (y - centerY) / hPX;
        const yScaleDisp = relY * (clampedScale - 1) * hPX * factor;
        
        const srcX = Math.round(x - totalXDisp);
        const srcY = Math.round(y - yScaleDisp);
        copyPixel(pixels, outPixels, wPX, hPX, srcX, srcY, x, y);
      }
    } else if (config.dir === 'both') {
      // 上下都动、中间不动：上下方向相反
      const direction = y < midY ? -1 : 1; // 上端反向，下端正向
      const curDispX = dispX * factor * dpr * direction;
      const curDispY = dispY * factor * dpr * direction;
      
      for (let x = 0; x < wPX; x++) {
        const srcX = Math.round(x - curDispX);
        const srcY = Math.round(y - curDispY);
        copyPixel(pixels, outPixels, wPX, hPX, srcX, srcY, x, y);
      }
    } else if (config.dir === 'both3d') {
      // 上下都动 3D 版：两端缩放+反向位移
      const direction = y < midY ? -1 : 1;
      const scaleFactor = 1 + factor * (Math.abs(dispY) / hPX * dpr * 1.5);
      const clampedScale = Math.max(0.5, Math.min(1.8, scaleFactor));
      
      const centerX = wPX / 2;
      const centerY = hPX / 2;
      
      for (let x = 0; x < wPX; x++) {
        const relX = (x - centerX) / wPX;
        const xScaleDisp = relX * (clampedScale - 1) * wPX * direction;
        const xSwingDisp = factor * dispX * dpr * direction * 0.5;
        const totalXDisp = xScaleDisp + xSwingDisp;
        
        const relY = (y - centerY) / hPX;
        const yScaleDisp = relY * (clampedScale - 1) * hPX * factor;
        
        const srcX = Math.round(x - totalXDisp);
        const srcY = Math.round(y - yScaleDisp);
        copyPixel(pixels, outPixels, wPX, hPX, srcX, srcY, x, y);
      }
    } else {
      const curDispX = (config.dir === 'x' || config.dir === 'xy') ? dispX * factor * dpr : 0;
      const curDispY = (config.dir === 'y' || config.dir === 'xy') ? dispY * factor * dpr : 0;
      
      for (let x = 0; x < wPX; x++) {
        const srcX = Math.round(x - curDispX);
        const srcY = Math.round(y - curDispY);
        copyPixel(pixels, outPixels, wPX, hPX, srcX, srcY, x, y);
      }
    }
  }
  
  // 应用翻转
  if (flipX === -1 || flipY === -1) {
    const flippedData = ctx.createImageData(offCanvas.width, offCanvas.height);
    const fPixels = flippedData.data;
    for (let y = 0; y < hPX; y++) {
      for (let x = 0; x < wPX; x++) {
        let srcX = flipX === -1 ? wPX - 1 - x : x;
        let srcY = flipY === -1 ? hPX - 1 - y : y;
        const dstIdx = (y * wPX + x) * 4;
        const srcIdx = (srcY * wPX + srcX) * 4;
        fPixels[dstIdx] = outPixels[srcIdx];
        fPixels[dstIdx + 1] = outPixels[srcIdx + 1];
        fPixels[dstIdx + 2] = outPixels[srcIdx + 2];
        fPixels[dstIdx + 3] = outPixels[srcIdx + 3];
      }
    }
    ctx.putImageData(flippedData, 0, 0);
  } else {
    ctx.putImageData(outData, 0, 0);
  }
  ctx.restore();
}

function copyPixel(srcPixels, dstPixels, w, h, srcX, srcY, dstX, dstY) {
  if (srcX < 0 || srcX >= w || srcY < 0 || srcY >= h) return;
  if (dstX < 0 || dstX >= w || dstY < 0 || dstY >= h) return;
  
  const srcIdx = (srcY * w + srcX) * 4;
  const dstIdx = (dstY * w + dstX) * 4;
  
  // 只在源像素有 alpha 时才复制
  if (srcPixels[srcIdx + 3] > 0) {
    // 如果目标已经有像素，做简单的混合
    if (dstPixels[dstIdx + 3] > 0) {
      const a = srcPixels[srcIdx + 3] / 255;
      const dstA = dstPixels[dstIdx + 3] / 255;
      const outA = a + dstA * (1 - a);
      if (outA > 0) {
        dstPixels[dstIdx] = (srcPixels[srcIdx] * a + dstPixels[dstIdx] * dstA * (1 - a)) / outA;
        dstPixels[dstIdx + 1] = (srcPixels[srcIdx + 1] * a + dstPixels[dstIdx + 1] * dstA * (1 - a)) / outA;
        dstPixels[dstIdx + 2] = (srcPixels[srcIdx + 2] * a + dstPixels[dstIdx + 2] * dstA * (1 - a)) / outA;
        dstPixels[dstIdx + 3] = outA * 255;
      }
    } else {
      dstPixels[dstIdx] = srcPixels[srcIdx];
      dstPixels[dstIdx + 1] = srcPixels[srcIdx + 1];
      dstPixels[dstIdx + 2] = srcPixels[srcIdx + 2];
      dstPixels[dstIdx + 3] = srcPixels[srcIdx + 3];
    }
  }
}

function stopHalfFilterAnimation(block) {
  const animState = halfFilterAnimators.get(block);
  if (animState) {
    if (animState.rafId) {
      cancelAnimationFrame(animState.rafId);
    }
    if (animState.canvas) {
      animState.canvas.remove();
    }
    if (animState.textContent) {
      animState.textContent.style.visibility = '';
    }
    halfFilterAnimators.delete(block);
  }
}

// 应用静态变换（无动画时）
function applyStaticTransform(block) {
  const angle = rotate.value;
  const flipX = block.dataset.flipped === 'true' ? -1 : 1;
  const flipY = block.dataset.flippedY === 'true' ? -1 : 1;
  block.style.transform = `rotate(${angle}deg) scale(${flipX}, ${flipY})`;
}

// 应用带有旋转和翻转的动画变换
function applyAnimatedTransform(block, animType) {
  const angle = rotate.value;
  const flipX = block.dataset.flipped === 'true' ? -1 : 1;
  const flipY = block.dataset.flippedY === 'true' ? -1 : 1;
  
  // 根据动画类型设置不同的transform-origin
  let origin = 'center center';
  if (animType === 'fall' || animType === 'jump') {
    origin = 'bottom center';
  }
  
  block.style.transformOrigin = origin;
  
  // 添加自定义属性用于CSS动画中引用
  block.style.setProperty('--rotate-angle', angle + 'deg');
  block.style.setProperty('--flip-scale-x', flipX);
  block.style.setProperty('--flip-scale-y', flipY);
}

// 更新所有文字块的动画
function updateAllAnimations() {
  blocks.forEach(blockData => {
    updateBlockAnimation(blockData.block);
  });
}

// 创建文字块
async function createBlock(x, y, text = '绚丽文字', fontSizeVal = 50, color = '#111111', fontName = 'XXOBS-VF', weightVal = 400) {
  console.log('createBlock 被调用', {x, y, text, fontSizeVal, color, fontName, weightVal});
  const id = ++blockIdCounter;
  const block = document.createElement('div');
  block.className = 'text-block';
  block.dataset.id = String(id);
  // 将换行符转换为 <br> 标签
  const htmlText = text.replace(/\n/g, '<br>');
  block.innerHTML = `
    <div class="text-content">${htmlText}</div>
    <textarea class="edit-input">${text}</textarea>
    <button class="delete-btn">×</button>
  `;
  // 设置输入框样式
  const editInput = block.querySelector('.edit-input');
  editInput.style.fontFamily = `'${fontName}'`;
  editInput.style.fontSize = fontSizeVal + 'px';
  editInput.style.color = color;
  editInput.style.fontVariationSettings = `'wght' ${weightVal}`;
  editInput.style.wordWrap = 'break-word';
  editInput.style.whiteSpace = 'normal';
  editInput.style.overflow = 'hidden';
  
  block.style.fontSize = fontSizeVal + 'px';
  block.style.color = color;
  block.style.fontFamily = `'${fontName}'`;
  block.style.fontVariationSettings = `'wght' ${weightVal}`;

  // 拖拽
  block.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('delete-btn')) return;
    if (e.target.classList.contains('edit-input')) return;

    // 清空时间轴动画选择，避免复制粘贴上下文混淆
    if (selectedAnimFrames && selectedAnimFrames.length > 0) {
      selectedAnimFrames.forEach(frame => {
        if (frame.element) {
          frame.element.style.outline = '';
          frame.element.style.boxShadow = '';
        }
      });
      selectedAnimFrames = [];
    }

    console.log('[mousedown] block.dataset.id:', block.dataset.id, 'text:', block.querySelector('.text-content')?.textContent?.substring(0,8));
    const isModifierKey = e.shiftKey || e.ctrlKey || e.metaKey;
    const group = findGroupByBlock(block);
    
    if (isModifierKey) {
      // Shift/Ctrl键多选模式
      if (selectedBlocks.includes(block)) {
        // 取消选中
        const index = selectedBlocks.indexOf(block);
        if (index > -1) {
          selectedBlocks.splice(index, 1);
          block.classList.remove('selected');
        }
      } else {
        // 添加到选中列表（避免重复）
        if (!selectedBlocks.includes(block)) {
          selectedBlocks.push(block);
          block.classList.add('selected');
        }
      }
      // Shift多选时不启动拖拽，用户需要松开Shift后再点击拖动
      e.stopPropagation();
      return; // 多选操作完成，退出
    }
    
    // 普通点击（非Shift多选）
    // 如果块已在选中列表中，保持当前选中状态（准备拖拽）
    // 如果块不在选中列表中，重置选中为当前块
    if (!selectedBlocks.includes(block)) {
      // 点击不在选中列表中的块，重置选中状态
      selectedBlocks.forEach(b => b.classList.remove('selected'));
      
      if (group) {
        // 选中整个组合
        selectedBlocks = group.blocks.map(b => b.block);
      } else {
        selectedBlocks = [block];
      }
      
      selectedBlocks.forEach(b => b.classList.add('selected'));
      highlightTimelineForSelected();
    }
    // 块已在选中列表中，保持选中状态，准备拖拽
    
    // 更新控制面板
    if (selectedBlocks.length > 0) {
      updatePanelForBlock(selectedBlocks[0]);
      updateWeightAnimButtonState();
    }
    console.log('[mousedown] selectedBlocks now:', selectedBlocks.map(b => b.dataset.id));
    
    // 记录拖拽开始位置和所有选中块的原始位置
    // 确保 origPositions 与 selectedBlocks 同步
    const currentOrigPositions = selectedBlocks.map(b => ({
      left: parseInt(b.style.left) || 0,
      top: parseInt(b.style.top) || 0
    }));
    
    dragState = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origPositions: currentOrigPositions
    };
    
    e.stopPropagation();
  });

  // 双击编辑
  block.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    block.classList.add('editing');
    editInput.focus();
    editInput.select();
  });

  // 编辑输入
  editInput.addEventListener('input', () => {
    // 将 textarea 的值转换为带换行的 HTML
    const content = editInput.value.replace(/\n/g, '<br>');
    const textContent = block.querySelector('.text-content');
    textContent.innerHTML = content;
    // 同步底部动画层内容
    const bottomLayer = block.querySelector('.text-content-bottom');
    if (bottomLayer) {
      bottomLayer.innerHTML = content;
    }
    if (selectedBlocks.includes(block)) {
      customText.value = editInput.value;
    }
  });

  editInput.addEventListener('blur', () => {
    block.classList.remove('editing');
    const blockData = blocks.find(b => b.block === block);
    if (blockData) {
      blockData.text = editInput.value;
      onBlocksChanged();
      renderTimeline();
    }
  });

  editInput.addEventListener('keydown', (e) => {
    // Ctrl+Enter 退出编辑模式
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      editInput.blur();
    }
    // 单独的 Enter 键允许换行
  });

  // 删除按钮
  block.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteBlock(block);
  });

  // Delete 键删除
  block.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && selectedBlocks.length > 0) {
      deleteSelectedBlocks();
    }
  });

  // 点击选中（选择逻辑已在 mousedown 中处理）
  block.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 添加 tabindex 使其可聚焦
  block.setAttribute('tabindex', '0');

  console.log('准备添加到DOM:', block);
  console.log('contentLayer:', contentLayer);
  
  // 先添加元素到 DOM，再异步加载字体
  const bc = document.getElementById('blocksContainer');
  if (!bc) {
    console.error('blocksContainer not found');
    throw new Error('blocksContainer not found');
  }
  bc.appendChild(block);
  
  // 设置位置（传入的 x, y 就是左上角坐标）
  block.style.left = x + 'px';
  block.style.top = y + 'px';
  
  console.log('已添加到DOM，block数量:', blocks.length);
  
  // 获取当前选中的动画
  const currentAnim = animSelect ? animSelect.value : 'shake';
  
  // 设置动画速度
  const defaultDuration = getDefaultAnimationDuration(currentAnim);
  const duration = defaultDuration / animationSpeed;
  block.style.setProperty('--animation-duration', duration + 's');
  
  blocks.push({ 
    id: String(id), block, text, fontSize: fontSizeVal, color, fontName, weight: weightVal, 
    zIndex: parseInt(block.style.zIndex) || 0,
    animation: currentAnim, 
    animationSpeed: animationSpeed,
    animLoop: true,
    animStartTime: 0,
    animEndTime: 2,
    weightAnimMin: (typeof weightMinInput !== 'undefined' && weightMinInput) ? parseInt(weightMinInput.value) || 100 : 100,
    weightAnimMax: (typeof weightMaxInput !== 'undefined' && weightMaxInput) ? parseInt(weightMaxInput.value) || 900 : 900,
    weightAnimSpeed: (typeof weightAnimSpeedInput !== 'undefined' && weightAnimSpeedInput) ? parseFloat(weightAnimSpeedInput.value) || 1 : 1
  });
  
  onBlocksChanged();
  renderTimeline();

  // 异步加载字体，不阻塞
  const fontFile = fontName + '.ttf';
  loadFontByName(fontFile).then(() => {
    console.log('字体加载完成');
  }).catch(err => {
    console.error('字体加载错误:', err);
  });

  return block;
}

// 选中文字块
function selectBlock(block, isShiftKey = false) {
  // 清空时间轴动画选择，避免复制粘贴上下文混淆
  if (selectedAnimFrames && selectedAnimFrames.length > 0) {
    selectedAnimFrames.forEach(frame => {
      if (frame.element) frame.element.classList.remove('selected');
    });
    selectedAnimFrames = [];
  }

  if (isShiftKey) {
    // Shift/Ctrl键多选
    const index = selectedBlocks.indexOf(block);
    if (index > -1) {
      // 如果已经选中，取消选中
      selectedBlocks.splice(index, 1);
      block.classList.remove('selected');
    } else {
      // 添加到选中列表
      selectedBlocks.push(block);
      block.classList.add('selected');
    }
  } else {
    // 普通单选，清除之前的选中状态
    selectedBlocks.forEach(b => b.classList.remove('selected'));
    
    // 检查是否属于某个组合
    const group = findGroupByBlock(block);
    if (group) {
      // 选中整个组合
      selectedBlocks = group.blocks.map(b => b.block);
    } else {
      selectedBlocks = [block];
    }
    
    selectedBlocks.forEach(b => b.classList.add('selected'));
    // 互斥：清空图片和视频的选中状态
    selectedBgImageId = null;
    document.querySelectorAll('.bg-image-item').forEach(el => el.classList.remove('selected'));
    selectedVideoId = null;
    document.querySelectorAll('.video-item').forEach(el => el.classList.remove('selected'));
    highlightTimelineForSelected();
  }

  // 更新控制面板（使用第一个选中块的属性）
  if (selectedBlocks.length > 0) {
    const firstBlock = selectedBlocks[0];
    updatePanelForBlock(firstBlock);
  }
  
  // 更新字重动画按钮状态
  updateWeightAnimButtonState();
  
  // 更新漫画预设卡片高亮
  if (typeof window.updateComicCardsHighlight === 'function') {
    window.updateComicCardsHighlight();
  }
}

// 根据块查找所属组合
function findGroupByBlock(block) {
  return blockGroups.find(g => g.blocks.some(b => b.block === block));
}

// 更新字重动画按钮状态
function updateWeightAnimButtonState() {
  if (!weightAnimBtn) return;
  if (selectedBlocks.length === 0) {
    weightAnimBtn.classList.remove('active');
    weightAnimBtn.textContent = '启动';
    return;
  }
  
  // 检查每个选中块的动画状态
  const playingBlocks = selectedBlocks.filter(block => weightAnimStates.has(block.dataset.id));
  const notPlayingBlocks = selectedBlocks.filter(block => !weightAnimStates.has(block.dataset.id));
  
  if (playingBlocks.length === selectedBlocks.length) {
    // 所有选中块都在播放动画
    weightAnimBtn.classList.add('active');
    weightAnimBtn.textContent = '关闭';
  } else if (notPlayingBlocks.length === selectedBlocks.length) {
    // 所有选中块都不在播放动画
    weightAnimBtn.classList.remove('active');
    weightAnimBtn.textContent = '启动';
  } else {
    // 混合状态：部分播放，部分不播放
    weightAnimBtn.classList.remove('active');
    weightAnimBtn.textContent = '混合';
  }
}

// 更新控制面板
function updatePanelForBlock(block) {
  // 如果只有一个块被选中，直接显示它的属性
  if (selectedBlocks.length === 1) {
    showBlockProperties(block);
    return;
  }
  
  // 多选时，检查属性是否一致
  showMixedProperties();
}

// 显示单个块的属性
function showBlockProperties(block) {
  if (customText) customText.value = block.querySelector('.text-content').textContent;
  if (fontSize) fontSize.value = parseInt(block.style.fontSize) || 50;
  if (fsNum) fsNum.value = fontSize ? fontSize.value : (parseInt(block.style.fontSize) || 50);
  if (textColor) textColor.value = rgbToHex(block.style.color) || '#111111';

  // 匹配字体下拉框
  if (fontSelect) {
    const currentFont = block.style.fontFamily.replace(/['"]/g, '').trim();
    for (let opt of fontSelect.options) {
      const optFontFamily = opt.value.replace('.ttf', '').replace('.woff2', '').replace('.otf', '');
      if (optFontFamily === currentFont) {
        fontSelect.value = opt.value;
        break;
      }
    }
  }

  // 更新字重滑块
  const blockData = blocks.find(b => b.block === block);
  if (blockData) {
    if (wght) wght.value = blockData.weight;
    if (wNum) wNum.value = blockData.weight;
    
    // 同步更新字重动画设置
    if (weightMinInput) weightMinInput.value = blockData.weightAnimMin ?? 100;
    if (weightMaxInput) weightMaxInput.value = blockData.weightAnimMax ?? 900;
    if (weightAnimSpeedInput) weightAnimSpeedInput.value = blockData.weightAnimSpeed ?? 1;
  }
  
  // 同步更新动画预设下拉菜单
  let currentAnim = 'none';
  animPresets.forEach(anim => {
    if (block.classList.contains('anim-' + anim)) {
      currentAnim = anim;
    }
  });
  // 检查 Canvas 动画
  if (currentAnim === 'none' && halfFilterAnimators.has(block)) {
    const animState = halfFilterAnimators.get(block);
    currentAnim = animState.animType;
  }
  if (animSelect) animSelect.value = currentAnim;
  
  // 同步更新动画速度
  if (blockData && animSpeed) {
    const speed = blockData.animationSpeed || 1;
    animSpeed.value = speed;
    
    // 同步更新循环/单次模式
    const isLoop = blockData.animLoop ?? true;
    isAnimLoopMode = isLoop;
    if (animLoopBtn) {
      animLoopBtn.textContent = isLoop ? '🔄 循环' : '⏱ 单次';
      animLoopBtn.style.background = isLoop ? '#10b981' : '#f59e0b';
    }
    if (onceTimeSettings) {
      onceTimeSettings.style.display = isLoop ? 'none' : 'flex';
    }
    
    // 同步更新时间设置
    if (animStartTimeInput) {
      animStartTimeInput.value = blockData.animStartTime ?? 0;
    }
    if (animEndTimeInput) {
      animEndTimeInput.value = blockData.animEndTime ?? 2;
    }
  }
  
  // 同步更新旋转角度
  const computedStyle = window.getComputedStyle(block);
  const transform = computedStyle.transform;
  if (transform && transform !== 'none') {
    const matrix = new DOMMatrix(transform);
    const angle = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
    rotate.value = angle;
    rotateNum.value = angle;
  } else {
    rotate.value = 0;
    rotateNum.value = 0;
  }

  // 同步更新水平翻转状态
  const isFlipped = block.dataset.flipped === 'true';
  if (flipXBtn) flipXBtn.classList.toggle('active', isFlipped);

  // 同步更新垂直翻转状态
  const isFlippedY = block.dataset.flippedY === 'true';
  if (flipYBtn) flipYBtn.classList.toggle('active', isFlippedY);

  // 同步更新竖排状态
  const isVertical = block.classList.contains('vertical');
  if (verticalBtn) verticalBtn.classList.toggle('active', isVertical);
}

// 显示多选时的混合属性状态
function showMixedProperties() {
  // 检查控制面板元素是否存在
  if (!customText || !fontSize || !fsNum || !textColor || !fontSelect || !wght || !wNum) {
    console.warn('[showMixedProperties] 控制面板元素未找到，跳过更新');
    return;
  }
  
  // 检查文字内容是否相同
  const texts = selectedBlocks.map(b => b.querySelector('.text-content').textContent);
  const sameText = texts.every(t => t === texts[0]);
  customText.value = sameText ? texts[0] : '';
  
  // 检查字体大小是否相同
  const fontSizes = selectedBlocks.map(b => parseInt(b.style.fontSize) || 50);
  const sameFontSize = fontSizes.every(f => f === fontSizes[0]);
  if (sameFontSize) {
    fontSize.value = fontSizes[0];
    fsNum.value = fontSizes[0];
  } else {
    fontSize.value = '';
    fsNum.value = '';
  }
  
  // 检查字体颜色是否相同
  const colors = selectedBlocks.map(b => rgbToHex(b.style.color) || '#111111');
  const sameColor = colors.every(c => c === colors[0]);
  textColor.value = sameColor ? colors[0] : '#111111';
  
  // 检查字体是否相同
  const fonts = selectedBlocks.map(b => b.style.fontFamily.replace(/['"]/g, '').trim());
  const sameFont = fonts.every(f => f === fonts[0]);
  if (sameFont) {
    for (let opt of fontSelect.options) {
      const optFontFamily = opt.value.replace('.ttf', '').replace('.woff2', '').replace('.otf', '');
      if (optFontFamily === fonts[0]) {
        fontSelect.value = opt.value;
        break;
      }
    }
  } else {
    fontSelect.value = '';
  }
  
  // 检查字重是否相同
  const weights = selectedBlocks.map(b => {
    const blockData = blocks.find(data => data.block === b);
    return blockData ? blockData.weight : 400;
  });
  const sameWeight = weights.every(w => w === weights[0]);
  if (sameWeight) {
    wght.value = weights[0];
    wNum.value = weights[0];
  } else {
    wght.value = '';
    wNum.value = '';
  }
  
  // 检查动画预设是否相同
  const anims = selectedBlocks.map(b => {
    const blockData = blocks.find(data => data.block === b);
    // 优先使用 blockData 中保存的动画设置
    if (blockData && blockData.animation && blockData.animation !== 'none') {
      return blockData.animation;
    }
    // 备选：检查 DOM 类名
    for (let anim of animPresets) {
      if (b.classList.contains('anim-' + anim)) {
        return anim;
      }
    }
    // 备选：检查 Canvas 动画
    if (halfFilterAnimators.has(b)) {
      return halfFilterAnimators.get(b).animType;
    }
    return 'none';
  });
  const sameAnim = anims.every(a => a === anims[0]);
  if (animSelect) animSelect.value = sameAnim ? anims[0] : '';
  
  // 检查字重动画状态
  const weightAnimStatesArr = selectedBlocks.map(b => weightAnimStates.has(b.dataset.id));
  const hasWeightAnim = weightAnimStatesArr.some(s => s);
  const allWeightAnim = weightAnimStatesArr.every(s => s);
  
  // 更新循环/单次按钮状态
  const loopStates = selectedBlocks.map(b => {
    const bd = blocks.find(data => data.block === b);
    return bd?.animLoop ?? true;
  });
  const sameLoop = loopStates.every(l => l === loopStates[0]);
  
  if (animLoopBtn) {
    if (sameLoop) {
      isAnimLoopMode = loopStates[0];
      animLoopBtn.textContent = isAnimLoopMode ? '🔄 循环' : '⏱ 单次';
      animLoopBtn.style.background = isAnimLoopMode ? '#10b981' : '#f59e0b';
      if (onceTimeSettings) onceTimeSettings.style.display = isAnimLoopMode ? 'none' : 'flex';
    } else {
      // 混合状态，显示多选
      animLoopBtn.textContent = '🔄 多选';
      animLoopBtn.style.background = '#6b7280';
      if (onceTimeSettings) onceTimeSettings.style.display = 'none';
    }
  }
  
  // 更新字重动画按钮状态
  if (weightAnimBtn) {
    if (allWeightAnim) {
      weightAnimBtn.classList.add('active');
      weightAnimBtn.textContent = '关闭';
    } else if (hasWeightAnim) {
      weightAnimBtn.classList.add('active');
      weightAnimBtn.textContent = '部分';
    } else {
      weightAnimBtn.classList.remove('active');
      weightAnimBtn.textContent = '启动';
    }
  }
  
  // 如果有多选，在动画下拉框显示多选标识
  if (!sameAnim || hasWeightAnim) {
    let animLabel = '';
    if (!sameAnim) {
      // 找出不同的动画
      const uniqueAnims = [...new Set(anims.filter(a => a !== 'none'))];
      if (uniqueAnims.length > 0) {
        animLabel = '多选' + uniqueAnims.slice(0, 2).map(a => {
          const animObj = animEffects.preset.find(p => p.value === a);
          return animObj ? animObj.name : a;
        }).join('+');
        if (uniqueAnims.length > 2) animLabel += '+...';
      }
    }
    if (hasWeightAnim) {
      if (animLabel) animLabel += '+字重';
      else animLabel = '字重';
    }
    if (animLabel && animSelect) {
      // 添加一个多选选项
      let multiOpt = animSelect.querySelector('option[value="__multi__"]');
      if (!multiOpt) {
        multiOpt = document.createElement('option');
        multiOpt.value = '__multi__';
        animSelect.insertBefore(multiOpt, animSelect.firstChild);
      }
      multiOpt.textContent = animLabel;
      animSelect.value = '__multi__';
    }
  } else if (animSelect) {
    // 移除多选选项
    const multiOpt = animSelect.querySelector('option[value="__multi__"]');
    if (multiOpt) multiOpt.remove();
  }
  
  // 检查旋转角度是否相同
  const angles = selectedBlocks.map(b => {
    const computedStyle = window.getComputedStyle(b);
    const transform = computedStyle.transform;
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrix(transform);
      return Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
    }
    return 0;
  });
  const sameAngle = angles.every(a => a === angles[0]);
  if (sameAngle) {
    rotate.value = angles[0];
    rotateNum.value = angles[0];
  } else {
    rotate.value = '';
    rotateNum.value = '';
  }

  // 检查水平翻转状态是否相同
  const flippedStates = selectedBlocks.map(b => b.dataset.flipped === 'true');
  const sameFlipped = flippedStates.every(f => f === flippedStates[0]);
  if (flipXBtn) {
    flipXBtn.classList.toggle('active', sameFlipped && flippedStates[0]);
    flipXBtn.classList.toggle('mixed', !sameFlipped);
  }

  // 检查垂直翻转状态是否相同
  const flippedYStates = selectedBlocks.map(b => b.dataset.flippedY === 'true');
  const sameFlippedY = flippedYStates.every(f => f === flippedYStates[0]);
  if (flipYBtn) {
    flipYBtn.classList.toggle('active', sameFlippedY && flippedYStates[0]);
    flipYBtn.classList.toggle('mixed', !sameFlippedY);
  }

  // 检查竖排状态是否相同
  const verticalStates = selectedBlocks.map(b => b.classList.contains('vertical'));
  const sameVertical = verticalStates.every(v => v === verticalStates[0]);
  if (verticalBtn) {
    verticalBtn.classList.toggle('active', sameVertical && verticalStates[0]);
    verticalBtn.classList.toggle('mixed', !sameVertical);
  }
}

// 删除单个文字块
function deleteBlock(block) {
  // 停止该文字块的字重动画
  stopWeightAnimationForBlock(block);
  
  const idx = blocks.findIndex(b => b.block === block);
  if (idx > -1) blocks.splice(idx, 1);
  block.remove();
  
  // 从选中列表中移除
  const selectedIdx = selectedBlocks.indexOf(block);
  if (selectedIdx > -1) {
    selectedBlocks.splice(selectedIdx, 1);
  }
  
  // 如果删除后还有选中的块，更新面板
  if (selectedBlocks.length > 0) {
    updatePanelForBlock(selectedBlocks[0]);
  } else {
    customText.value = '';
  }
  
  // 更新字重动画按钮状态
  updateWeightAnimButtonState();
  
  // 清理该文字块的动画数据（保持与 deleteSelectedBlocks 一致，防止删除后预览卡残留动画数据）
  const deletedBlockId = block.dataset.id;
  if (deletedBlockId && blockAnimations && blockAnimations[deletedBlockId]) {
    delete blockAnimations[deletedBlockId];
  }
  
  onBlocksChanged();
}

// 删除所有选中的文字块
function deleteSelectedBlocks() {
  const count = selectedBlocks.length;
  
  // 收集需要清理的组合
  const groupsToClean = new Set();
  selectedBlocks.forEach(block => {
    if (block.dataset.groupId) {
      groupsToClean.add(block.dataset.groupId);
    }
    // 清理动画数据
    const blockId = getBlockId(block);
    if (blockId && window.blockAnimations) {
      delete window.blockAnimations[blockId];
    }
  });
  
  selectedBlocks.forEach(block => {
    const idx = blocks.findIndex(b => b.block === block);
    if (idx > -1) blocks.splice(idx, 1);
    block.remove();
  });
  
  // 清理空组合
  blockGroups = blockGroups.filter(g => {
    const hasBlocks = g.blocks.some(b => document.contains(b.block));
    return hasBlocks;
  });
  
  selectedBlocks = [];
  highlightTimelineForSelected();
  customText.value = '';
  showTip(`已删除 ${count} 个文字块`);
  
  onBlocksChanged();
  
  // 更新时间轴
  if (window.renderTimeline) {
    renderTimeline();
  }
}

// 自定义确认对话框函数
function customConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirmOverlay');
    const title = document.getElementById('confirmTitle');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    
    title.textContent = message;
    overlay.classList.add('show');
    
    const handleOk = () => {
      overlay.classList.remove('show');
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      resolve(true);
    };
    
    const handleCancel = () => {
      overlay.classList.remove('show');
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      resolve(false);
    };
    
    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
  });
}

// 清空展示区所有文字块
clearBtn.addEventListener('click', async () => {
  if (blocks.length === 0) {
    showTip('展示区已经是空的');
    return;
  }
  
  const confirmed = await customConfirm('确定要清空展示区所有文字块吗？');
  if (confirmed) {
    // 停止所有字重动画
    blocks.forEach(b => {
      stopWeightAnimationForBlock(b.block);
    });
    
    // 移除所有块
    blocks.forEach(b => b.block.remove());
    
    // 清空数据
    blocks = [];
    selectedBlocks = [];
    blockGroups = [];
    
    // 清空输入框
    customText.value = '';
    
    showTip('已清空展示区所有文字块');
  }
});

// 还原展示区最初设置
resetBtn.addEventListener('click', async () => {
  const confirmed = await customConfirm('确定要还原展示区到最初设置吗？');
  if (confirmed) {
    // 直接刷新页面
    location.reload();
  }
});

// 新建动画（完全重置：清空所有内容，保留导出尺寸设置）
async function newAnimation() {
  const confirmed = await customConfirm('确定要新建一个动画吗？当前内容将被完全清空。');
  if (!confirmed) return;

  // 清空所有文字块
  document.querySelectorAll('.text-block').forEach(b => b.remove());
  // 清空所有图片块
  document.querySelectorAll('#blocksContainer .bg-image-item').forEach(b => b.remove());
  // 清空所有视频块
  document.querySelectorAll('#blocksContainer .video-item').forEach(b => b.remove());

  // 重置数据
  blocks = [];
  blockAnimations = {};
  bgImages = [];
  videoItems = [];
  bgImageIdCounter = 0;
  videoIdCounter = 0;
  selectedBgImageId = null;
  selectedVideoId = null;
  selectedBlocks = [];

  // 重置视图
  viewTranslateX = 0;
  viewTranslateY = 0;
  viewScale = 1;
  viewRotate = 0;
  applyTransform();
  if (typeof updateBgImagesContainerTransform === 'function') updateBgImagesContainerTransform();
  if (typeof updateVideosContainerTransform === 'function') updateVideosContainerTransform();

  // 重置时间轴
  if (typeof totalDuration !== 'undefined') {
    totalDuration = 5; // 默认5秒
  }
  if (typeof currentTime !== 'undefined') {
    currentTime = 0;
  }

  // 重置预设选中状态
  document.querySelectorAll('.preset-item').forEach(p => p.classList.remove('selected'));
  document.querySelectorAll('.left-anim-item').forEach(p => p.classList.remove('selected'));

  // 重置控制面板显示
  const controlPanel = document.getElementById('controlPanel');
  if (controlPanel) {
    controlPanel.style.display = 'none';
  }
  const multiSelectPanel = document.getElementById('multiSelectPanel');
  if (multiSelectPanel) {
    multiSelectPanel.style.display = 'none';
  }

  // 刷新时间轴
  if (typeof renderTimeline === 'function') renderTimeline();
  
  // 刷新各面板
  if (typeof updateBgImagesList === 'function') updateBgImagesList();
  if (typeof updateVideosList === 'function') updateVideosList();

  showTip('已重置为空白画布');
}

// ==================== 背景图功能 ====================

const importBgBtn = document.getElementById('importBgBtn');
const bgImageInput = document.getElementById('bgImageInput');
const bgImagesContainer = document.getElementById('bgImagesContainer');

// 点击导入背景图按钮
if (importBgBtn) {
  importBgBtn.addEventListener('click', () => {
    bgImageInput.click();
  });
}

// 背景图文件选择
if (bgImageInput) {
  bgImageInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target.result;
        const img = new Image();
        img.onload = () => {
          addBgImage(src, img.width, img.height, file.name);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
    
    bgImageInput.value = '';
  });
}

// 添加背景图
function addBgImage(src, origWidth, origHeight, name) {
  const id = ++bgImageIdCounter;
  
  // 默认缩放到宽度400px，高度按比例
  const defaultWidth = 400;
  const scale = defaultWidth / origWidth;
  const width = defaultWidth;
  const height = origHeight * scale;
  
  // 居中放置（相对于基准坐标系）
  const x = (BASE_WIDTH - width) / 2;
  const y = (BASE_HEIGHT - height) / 2;
  
  // 计算 zIndex：取所有元素中最大的 zIndex + 1，确保新块在最上面
  const allZIndices = [
    ...blocks.map(b => parseInt(b.block.style.zIndex) || 0),
    ...bgImages.map(bg => bg.zIndex || 0),
    ...videoItems.map(v => v.zIndex || 0)
  ];
  const maxZ = allZIndices.length > 0 ? Math.max(...allZIndices) : 0;

  const bgImage = {
    id: id,
    src: src,
    name: name || `背景图${id}`,
    x: x,
    y: y,
    width: width,
    height: height,
    zIndex: maxZ + 1,
    rotation: 0,
    startTime: 0,
    duration: 1
  };
  
  bgImages.push(bgImage);
  
  renderBgImage(bgImage);
  updateBgImagesContainerTransform();
  
  if (typeof renderTimeline === 'function') {
    renderTimeline();
  }
  
  showTip(`已添加背景图: ${name || '背景图' + id}`);
}

// 渲染单个背景图到DOM
function renderBgImage(bgImage) {
  const el = document.createElement('div');
  el.className = 'bg-image-item';
  el.dataset.id = bgImage.id;
  el.style.left = bgImage.x + 'px';
  el.style.top = bgImage.y + 'px';
  el.style.width = bgImage.width + 'px';
  el.style.height = bgImage.height + 'px';
  el.style.zIndex = bgImage.zIndex;
  
  el.innerHTML = `
    <img src="${bgImage.src}" draggable="false">
    <div class="bg-image-resize-handle"></div>
    <button class="bg-image-delete-btn">×</button>
  `;
  
  // 点击选中
  el.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('bg-image-delete-btn')) return;
    if (e.target.classList.contains('bg-image-resize-handle')) return;
    
    e.stopPropagation();
    selectBgImage(bgImage.id);
    
    // 开始拖动
    bgImageDragState = {
      id: bgImage.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: bgImage.x,
      origY: bgImage.y
    };
  });
  
  // 删除按钮
  const deleteBtn = el.querySelector('.bg-image-delete-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteBgImage(bgImage.id);
  });
  
  // 调整大小
  const resizeHandle = el.querySelector('.bg-image-resize-handle');
  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    selectBgImage(bgImage.id);
    
    bgImageResizeState = {
      id: bgImage.id,
      startX: e.clientX,
      startY: e.clientY,
      origWidth: bgImage.width,
      origHeight: bgImage.height,
      aspectRatio: bgImage.width / bgImage.height
    };
  });
  
  // 双击弹出操作菜单
  el.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    showMediaActionMenu(e.clientX, e.clientY, 'image', bgImage.id);
  });
  
  blocksContainer.appendChild(el);
}

// 选中背景图
function selectBgImage(id) {
  selectedBgImageId = id;

  // 清空时间轴动画选择，避免复制粘贴上下文混淆
  if (selectedAnimFrames && selectedAnimFrames.length > 0) {
    selectedAnimFrames.forEach(frame => {
      if (frame.element) {
        frame.element.style.outline = '';
        frame.element.style.boxShadow = '';
      }
    });
    selectedAnimFrames = [];
  }

  // 更新选中状态
  document.querySelectorAll('.bg-image-item').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.id) === id);
  });

  // 取消文字块选中
  selectedBlocks.forEach(b => b.classList.remove('selected'));
  selectedBlocks = [];

  // 互斥：清空视频的选中状态
  selectedVideoId = null;
  document.querySelectorAll('.video-item').forEach(el => el.classList.remove('selected'));

  // 更新动画预设卡片高亮和动画列表
  if (typeof window.updateComicCardsHighlight === 'function') window.updateComicCardsHighlight();
  if (typeof window.updateAnimListDisplay === 'function') window.updateAnimListDisplay();
}

// 删除背景图

// 统一层级管理：获取所有可见元素并按 zIndex 排序
function getAllLayers() {
  const layers = [];

  // 文字块
  blocks.forEach(b => {
    if (b.block && b.block.parentElement) {
      // 优先从 block 对象读取 zIndex，其次从 style 读取
      const zIndex = b.zIndex !== undefined ? b.zIndex : (parseInt(b.block.style.zIndex) || 0);
      layers.push({
        type: 'block',
        id: b.block.dataset.id,
        zIndex: zIndex,
        element: b.block,
        data: b
      });
    }
  });

  // 背景图
  bgImages.forEach(bg => {
    layers.push({
      type: 'bgImage',
      id: bg.id,
      zIndex: bg.zIndex || 0,
      data: bg
    });
  });

  // 视频
  videoItems.forEach(v => {
    layers.push({
      type: 'video',
      id: v.id,
      zIndex: v.zIndex || 0,
      data: v
    });
  });

  return layers.sort((a, b) => a.zIndex - b.zIndex);
}

// 移动元素层级（支持跨类型）
function moveLayerUp(type, id) {
  const layers = getAllLayers();
  const idx = layers.findIndex(l => l.type === type && String(l.id) === String(id));
  if (idx < 0 || idx >= layers.length - 1) {
    showTip('已经在最上层');
    return;
  }

  // 交换 zIndex
  const current = layers[idx];
  const next = layers[idx + 1];
  const tempZ = current.zIndex;
  current.zIndex = next.zIndex;
  next.zIndex = tempZ;

  // 应用到元素
  applyLayerZIndex(current);
  applyLayerZIndex(next);

  renderTimeline();
  showTip('已上移一层');
}

function moveLayerDown(type, id) {
  const layers = getAllLayers();
  const idx = layers.findIndex(l => l.type === type && String(l.id) === String(id));
  if (idx <= 0) {
    showTip('已经在最下层');
    return;
  }

  // 交换 zIndex
  const current = layers[idx];
  const prev = layers[idx - 1];
  const tempZ = current.zIndex;
  current.zIndex = prev.zIndex;
  prev.zIndex = tempZ;

  // 应用到元素
  applyLayerZIndex(current);
  applyLayerZIndex(prev);

  renderTimeline();
  showTip('已下移一层');
}

function swapLayerZIndex(fromType, fromId, toType, toId) {
  const layers = getAllLayers();
  const fromLayer = layers.find(l => l.type === fromType && String(l.id) === String(fromId));
  const toLayer = layers.find(l => l.type === toType && String(l.id) === String(toId));
  
  if (!fromLayer || !toLayer) {
    console.log('Layer not found:', fromType, fromId, toType, toId);
    return;
  }
  
  // 交换 zIndex
  const tempZ = fromLayer.zIndex;
  fromLayer.zIndex = toLayer.zIndex;
  toLayer.zIndex = tempZ;
  
  // 应用到元素
  applyLayerZIndex(fromLayer);
  applyLayerZIndex(toLayer);
  
  renderTimeline();
  showTip('层级已交换');
}

function applyLayerZIndex(layer) {
  if (layer.type === 'block' && layer.element) {
    layer.element.style.zIndex = layer.zIndex;
    // 同时更新 block 对象中的 zIndex
    if (layer.data) layer.data.zIndex = layer.zIndex;
  } else if (layer.type === 'bgImage' && layer.data) {
    layer.data.zIndex = layer.zIndex;
    const el = document.querySelector(`.bg-image-item[data-id="${layer.id}"]`);
    if (el) el.style.zIndex = layer.zIndex;
  } else if (layer.type === 'video' && layer.data) {
    layer.data.zIndex = layer.zIndex;
    const el = document.querySelector(`.video-item[data-id="${layer.id}"]`);
    if (el) el.style.zIndex = layer.zIndex;
  }
}

function moveBgImageLayer(id, direction) {
  if (direction < 0) {
    moveLayerUp('bgImage', id);
  } else {
    moveLayerDown('bgImage', id);
  }
}

function moveBlockLayer(id, direction) {
  if (direction < 0) {
    moveLayerUp('block', id);
  } else {
    moveLayerDown('block', id);
  }
}

function moveVideoLayer(id, direction) {
  if (direction < 0) {
    moveLayerUp('video', id);
  } else {
    moveLayerDown('video', id);
  }
}

function deleteBgImage(id) {
  const index = bgImages.findIndex(bg => bg.id === id);
  if (index === -1) return;
  
  bgImages.splice(index, 1);
  
  // 重新计算zIndex并同步到DOM
  bgImages.forEach((bg, i) => {
    bg.zIndex = i;
    const bgEl = blocksContainer.querySelector(`.bg-image-item[data-id="${bg.id}"]`);
    if (bgEl) bgEl.style.zIndex = i;
  });
  
  // 移除DOM元素
  const el = blocksContainer.querySelector(`.bg-image-item[data-id="${id}"]`);
  if (el) el.remove();
  
  if (selectedBgImageId === id) {
    selectedBgImageId = null;
  }

  // 清理该背景图的 blockAnimations
  if (blockAnimations['bg_' + id]) {
    delete blockAnimations['bg_' + id];
  }

  // 更新容器 zIndex
  updateContainerZIndex();

  if (typeof renderTimeline === 'function') {
    renderTimeline();
  }

  showTip('已删除背景图');
}

// 更新所有背景图DOM位置
function updateAllBgImagesDom() {
  bgImages.forEach(bgImage => {
    const el = blocksContainer.querySelector(`.bg-image-item[data-id="${bgImage.id}"]`);
    if (el) {
      el.style.left = bgImage.x + 'px';
      el.style.top = bgImage.y + 'px';
      el.style.width = bgImage.width + 'px';
      el.style.height = bgImage.height + 'px';
      el.style.zIndex = bgImage.zIndex;
    }
  });
  updateContainerZIndex();
}

// 背景图拖动和缩放的全局鼠标事件
document.addEventListener('mousemove', (e) => {
  // 拖动背景图
  if (bgImageDragState) {
    const dx = (e.clientX - bgImageDragState.startX) / viewScale;
    const dy = (e.clientY - bgImageDragState.startY) / viewScale;
    
    const bgImage = bgImages.find(bg => bg.id === bgImageDragState.id);
    if (bgImage) {
      bgImage.x = bgImageDragState.origX + dx;
      bgImage.y = bgImageDragState.origY + dy;
      
      const el = blocksContainer.querySelector(`.bg-image-item[data-id="${bgImage.id}"]`);
      if (el) {
        el.style.left = bgImage.x + 'px';
        el.style.top = bgImage.y + 'px';
      }
    }
  }
  
  // 调整背景图大小
  if (bgImageResizeState) {
    const dx = (e.clientX - bgImageResizeState.startX) / viewScale;
    
    const bgImage = bgImages.find(bg => bg.id === bgImageResizeState.id);
    if (bgImage) {
      let newWidth = Math.max(20, bgImageResizeState.origWidth + dx);
      let newHeight = newWidth / bgImageResizeState.aspectRatio;
      
      bgImage.width = newWidth;
      bgImage.height = newHeight;
      
      const el = blocksContainer.querySelector(`.bg-image-item[data-id="${bgImage.id}"]`);
      if (el) {
        el.style.width = bgImage.width + 'px';
        el.style.height = bgImage.height + 'px';
      }
    }
  }
});

document.addEventListener('mouseup', () => {
  bgImageDragState = null;
  bgImageResizeState = null;
});

// 更新背景图容器的transform（跟随blocksContainer缩放）
function updateBgImagesContainerTransform() {
  const blocksContainer = document.getElementById('blocksContainer');
  if (!blocksContainer || !bgImagesContainer) return;
  
  const transform = blocksContainer.style.transform;
  if (transform) {
    bgImagesContainer.style.width = BASE_WIDTH + 'px';
    bgImagesContainer.style.height = BASE_HEIGHT + 'px';
    bgImagesContainer.style.transform = transform;
    bgImagesContainer.style.transformOrigin = 'center center';
  }
  if (videosContainer) {
    videosContainer.style.width = BASE_WIDTH + 'px';
    videosContainer.style.height = BASE_HEIGHT + 'px';
    videosContainer.style.transform = transform;
    videosContainer.style.transformOrigin = 'center center';
  }
  
  updateVideosContainerTransform();
}

// ==================== 视频功能 ====================

let videoItems = [];
let selectedVideoId = null;
let videoIdCounter = 0;
let videoDragState = null;
let videoResizeState = null;
let videoElements = new Map();

const importVideoBtn = document.getElementById('importVideoBtn');
const videoInput = document.getElementById('videoInput');
const videosContainer = document.getElementById('videosContainer');

if (importVideoBtn) {
  importVideoBtn.addEventListener('click', () => {
    videoInput.click();
  });
}

if (videoInput) {
  videoInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('video/')) return;
      
      const videoUrl = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.src = videoUrl;
      tempVideo.muted = true;
      tempVideo.preload = 'metadata';
      
      tempVideo.addEventListener('loadedmetadata', () => {
        addVideo(videoUrl, tempVideo.videoWidth, tempVideo.videoHeight, 1, file.name);
      });
      
      tempVideo.addEventListener('error', () => {
        showTip('视频加载失败: ' + file.name);
        URL.revokeObjectURL(videoUrl);
      });
    });
    
    videoInput.value = '';
  });
}

function addVideo(src, origWidth, origHeight, duration, name) {
  const id = ++videoIdCounter;
  
  const defaultWidth = 400;
  const scale = defaultWidth / origWidth;
  const width = defaultWidth;
  const height = origHeight * scale;
  
  const x = (BASE_WIDTH - width) / 2;
  const y = (BASE_HEIGHT - height) / 2;
  
  // 计算 zIndex：取所有元素中最大的 zIndex + 1，确保新块在最上面
  const allZIndices = [
    ...blocks.map(b => parseInt(b.block.style.zIndex) || 0),
    ...bgImages.map(bg => bg.zIndex || 0),
    ...videoItems.map(v => v.zIndex || 0)
  ];
  const maxZ = allZIndices.length > 0 ? Math.max(...allZIndices) : 0;

  const video = {
    id: id,
    name: name || `视频${id}`,
    src: src,
    x: x,
    y: y,
    width: width,
    height: height,
    zIndex: maxZ + 1,
    startTime: 0,
    duration: duration,
    volume: 0
  };
  
  videoItems.push(video);

  renderVideo(video);
  updateVideosContainerTransform();
  
  if (typeof renderTimeline === 'function') {
    renderTimeline();
  }
  
  showTip(`已添加视频: ${name || '视频' + id}`);
}

function renderVideo(video) {
  const el = document.createElement('div');
  el.className = 'video-item';
  el.dataset.id = video.id;
  el.style.left = video.x + 'px';
  el.style.top = video.y + 'px';
  el.style.width = video.width + 'px';
  el.style.height = video.height + 'px';
  el.style.zIndex = video.zIndex;
  
  const videoEl = document.createElement('video');
  videoEl.src = video.src;
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.loop = true;
  videoEl.preload = 'auto';
  videoEl.draggable = false;
  
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'video-resize-handle';
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'video-delete-btn';
  deleteBtn.textContent = '×';
  
  el.appendChild(videoEl);
  el.appendChild(resizeHandle);
  el.appendChild(deleteBtn);
  
  videoElements.set(video.id, videoEl);
  
  el.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('video-delete-btn')) return;
    if (e.target.classList.contains('video-resize-handle')) return;
    
    e.stopPropagation();
    selectVideo(video.id);
    
    videoDragState = {
      id: video.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: video.x,
      origY: video.y
    };
  });
  
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteVideo(video.id);
  });
  
  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    selectVideo(video.id);
    
    videoResizeState = {
      id: video.id,
      startX: e.clientX,
      startY: e.clientY,
      origWidth: video.width,
      origHeight: video.height,
      aspectRatio: video.width / video.height
    };
  });
  
  // 双击弹出操作菜单
  el.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    showMediaActionMenu(e.clientX, e.clientY, 'video', video.id);
  });
  
  // 默认播放（muted），用户可在时间轴按钮控制
  try { videoEl.play().catch(() => {}); } catch(e) {}
  blocksContainer.appendChild(el);
}

// 显示媒体块操作菜单
function showMediaActionMenu(x, y, type, id) {
  // 移除已存在的菜单
  const existingMenu = document.getElementById('mediaActionMenu');
  if (existingMenu) existingMenu.remove();
  
  const menu = document.createElement('div');
  menu.id = 'mediaActionMenu';
  menu.className = 'media-action-menu';
  
  // 菜单项
  const items = [];
  
  // 增加文字块（图片和视频都有）
  items.push({
    label: '增加文字块',
    action: () => {
      addTextBlockAtMedia(type, id);
      menu.remove();
    }
  });
  
  // 插入图片（图片和视频都有）
  items.push({
    label: '插入图片',
    action: () => {
      document.getElementById('bgImageInput').click();
      menu.remove();
    }
  });
  
  // 插入视频（图片和视频都有）
  items.push({
    label: '插入视频',
    action: () => {
      document.getElementById('videoInput').click();
      menu.remove();
    }
  });
  
  // 修改图片/视频
  if (type === 'image') {
    items.push({
      label: '修改图片',
      action: () => {
        replaceBgImage(id);
        menu.remove();
      }
    });
  } else if (type === 'video') {
    items.push({
      label: '修改视频',
      action: () => {
        replaceVideo(id);
        menu.remove();
      }
    });
  }
  
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'media-action-item';
    div.textContent = item.label;
    div.addEventListener('click', item.action);
    menu.appendChild(div);
  });
  
  document.body.appendChild(menu);
  
  // 调整位置，确保不超出视口
  const rect = menu.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 10;
  const maxY = window.innerHeight - rect.height - 10;
  menu.style.left = Math.min(x, maxX) + 'px';
  menu.style.top = Math.min(y, maxY) + 'px';
  
  // 点击其他地方关闭菜单
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('mousedown', closeHandler);
      }
    };
    document.addEventListener('mousedown', closeHandler);
  }, 0);
}

// 在媒体块位置增加文字块
async function addTextBlockAtMedia(type, id) {
  let mediaX, mediaY, mediaW, mediaH;
  
  if (type === 'image') {
    const bgImg = bgImages.find(b => b.id === id);
    if (!bgImg) return;
    mediaX = bgImg.x + bgImg.width / 2;
    mediaY = bgImg.y + bgImg.height / 2;
  } else if (type === 'video') {
    const video = videoItems.find(v => v.id === id);
    if (!video) return;
    mediaX = video.x + video.width / 2;
    mediaY = video.y + video.height / 2;
  }
  
  // 获取默认字体等参数
  let fontFamily;
  let fontSizeVal = 50;
  let weightVal = 400;
  if (selectedBlocks.length > 0) {
    const firstBlock = selectedBlocks[0];
    fontFamily = firstBlock.style.fontFamily.replace(/['"]/g, '').trim();
    fontSizeVal = parseInt(firstBlock.style.fontSize) || 50;
    const blockData = blocks.find(b => b.block === firstBlock);
    if (blockData) {
      weightVal = blockData.weight;
    }
  } else {
    fontFamily = fontSelect.value.replace('.ttf', '').replace('.woff2', '').replace('.otf', '');
  }
  
  // 创建文字块（居中在媒体块位置）
  const tempBlock = document.createElement('div');
  tempBlock.style.fontSize = fontSizeVal + 'px';
  tempBlock.style.fontFamily = fontFamily;
  tempBlock.style.visibility = 'hidden';
  tempBlock.style.position = 'absolute';
  tempBlock.textContent = '绚丽文字';
  document.body.appendChild(tempBlock);
  const textW = tempBlock.offsetWidth || 100;
  const textH = tempBlock.offsetHeight || 40;
  document.body.removeChild(tempBlock);
  
  const block = await createBlock(mediaX - textW / 2, mediaY - textH / 2, '绚丽文字', fontSizeVal, '#111111', fontFamily, weightVal);
  selectBlock(block);
  block.classList.add('editing');
  block.querySelector('.edit-input').focus();
  block.querySelector('.edit-input').select();
}

// 替换背景图
function replaceBgImage(id) {
  const bgImg = bgImages.find(b => b.id === id);
  if (!bgImg) return;
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target.result;
      const img = new Image();
      img.onload = () => {
        bgImg.src = src;
        bgImg.name = file.name;
        const el = blocksContainer.querySelector(`.bg-image-item[data-id="${id}"]`);
        if (el) {
          const imgEl = el.querySelector('img');
          if (imgEl) imgEl.src = src;
        }
        showTip('图片已替换');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
  input.click();
}

// 替换视频
function replaceVideo(id) {
  const video = videoItems.find(v => v.id === id);
  if (!video) return;
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*';
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const oldUrl = video.src;
    
    video.src = url;
    video.name = file.name;
    
    const el = blocksContainer.querySelector(`.video-item[data-id="${id}"]`);
    if (el) {
      const videoEl = el.querySelector('video');
      if (videoEl) {
        videoEl.src = url;
        videoEl.load();
      }
    }
    
    if (oldUrl && oldUrl.startsWith('blob:')) {
      URL.revokeObjectURL(oldUrl);
    }
    
    if (videoElements.has(id)) {
      videoElements.set(id, el.querySelector('video'));
    }
    
    showTip('视频已替换');
  });
  input.click();
}

function selectVideo(id) {
  selectedVideoId = id;

  // 清空时间轴动画选择，避免复制粘贴上下文混淆
  if (selectedAnimFrames && selectedAnimFrames.length > 0) {
    selectedAnimFrames.forEach(frame => {
      if (frame.element) {
        frame.element.style.outline = '';
        frame.element.style.boxShadow = '';
      }
    });
    selectedAnimFrames = [];
  }

  document.querySelectorAll('.video-item').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.id) === id);
  });

  selectedBlocks.forEach(b => b.classList.remove('selected'));
  selectedBlocks = [];

  selectedBgImageId = null;
  document.querySelectorAll('.bg-image-item').forEach(el => {
    el.classList.remove('selected');
  });

  // 更新动画预设卡片高亮和动画列表
  if (typeof window.updateComicCardsHighlight === 'function') window.updateComicCardsHighlight();
  if (typeof window.updateAnimListDisplay === 'function') window.updateAnimListDisplay();
}

function deleteVideo(id) {
  const index = videoItems.findIndex(v => v.id === id);
  if (index === -1) return;
  
  const video = videoItems[index];
  if (video.src.startsWith('blob:')) {
    URL.revokeObjectURL(video.src);
  }
  
  videoItems.splice(index, 1);
  
  // 重新计算zIndex并同步到DOM
  videoItems.forEach((v, i) => {
    v.zIndex = i;
    const vEl = blocksContainer.querySelector(`.video-item[data-id="${v.id}"]`);
    if (vEl) vEl.style.zIndex = i;
  });
  
  const el = blocksContainer.querySelector(`.video-item[data-id="${id}"]`);
  if (el) el.remove();
  
  videoElements.delete(id);

  // 清理该视频的 blockAnimations
  if (blockAnimations['video_' + id]) {
    delete blockAnimations['video_' + id];
  }

  if (selectedVideoId === id) {
    selectedVideoId = null;
  }

  // 更新容器 zIndex
  updateContainerZIndex();

  if (typeof renderTimeline === 'function') {
    renderTimeline();
  }
  
  showTip('已删除视频');
}

function updateAllVideosDom() {
  videoItems.forEach(video => {
    const el = blocksContainer.querySelector(`.video-item[data-id="${video.id}"]`);
    if (el) {
      el.style.left = video.x + 'px';
      el.style.top = video.y + 'px';
      el.style.width = video.width + 'px';
      el.style.height = video.height + 'px';
      el.style.zIndex = video.zIndex;
    }
  });
  updateContainerZIndex();
}

function updateContainerZIndex() {
  // 图片和视频元素已移到 blocksContainer 中，共享同一个堆叠上下文
  // 只需确保 blocksContainer 内的元素按全局 zIndex 正确设置
  // 不再需要跨容器zIndex调整
}

function updateVideosContainerTransform() {
  const blocksContainer = document.getElementById('blocksContainer');
  if (!blocksContainer || !videosContainer) return;
  
  const transform = blocksContainer.style.transform;
  if (transform) {
    videosContainer.style.width = BASE_WIDTH + 'px';
    videosContainer.style.height = BASE_HEIGHT + 'px';
    videosContainer.style.transform = transform;
    videosContainer.style.transformOrigin = 'center center';
  }
}

document.addEventListener('mousemove', (e) => {
  if (videoDragState) {
    const dx = (e.clientX - videoDragState.startX) / viewScale;
    const dy = (e.clientY - videoDragState.startY) / viewScale;
    
    const video = videoItems.find(v => v.id === videoDragState.id);
    if (video) {
      video.x = videoDragState.origX + dx;
      video.y = videoDragState.origY + dy;
      
      const el = blocksContainer.querySelector(`.video-item[data-id="${video.id}"]`);
      if (el) {
        el.style.left = video.x + 'px';
        el.style.top = video.y + 'px';
      }
    }
  }
  
  if (videoResizeState) {
    const dx = (e.clientX - videoResizeState.startX) / viewScale;
    
    const video = videoItems.find(v => v.id === videoResizeState.id);
    if (video) {
      let newWidth = Math.max(20, videoResizeState.origWidth + dx);
      let newHeight = newWidth / videoResizeState.aspectRatio;
      
      video.width = newWidth;
      video.height = newHeight;
      
      const el = blocksContainer.querySelector(`.video-item[data-id="${video.id}"]`);
      if (el) {
        el.style.width = video.width + 'px';
        el.style.height = video.height + 'px';
      }
    }
  }
});

document.addEventListener('mouseup', () => {
  videoDragState = null;
  videoResizeState = null;
});

function updateVideosPlayback(currentTime) {
  videoItems.forEach(video => {
    const videoEl = videoElements.get(video.id);
    if (!videoEl) return;
    
    const videoEndTime = video.startTime + video.duration;
    const el = blocksContainer.querySelector(`.video-item[data-id="${video.id}"]`);
    
    if (currentTime >= video.startTime && currentTime <= videoEndTime) {
      if (el) el.style.display = 'block';
      
      const videoCurrentTime = currentTime - video.startTime;
      if (Math.abs(videoEl.currentTime - videoCurrentTime) > 0.1) {
        try {
          videoEl.currentTime = videoCurrentTime;
        } catch (e) {}
      }
      
      if (videoEl.paused) {
        videoEl.play().catch(() => {});
      }
    } else {
      if (el) el.style.display = 'none';
      if (!videoEl.paused) {
        videoEl.pause();
      }
    }
  });
}

// RGB转Hex
function rgbToHex(rgb) {
  if (!rgb || rgb.startsWith('#')) return rgb || '#111111';
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return '#111111';
  const r = parseInt(match[0]).toString(16).padStart(2, '0');
  const g = parseInt(match[1]).toString(16).padStart(2, '0');
  const b = parseInt(match[2]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

// 全局复制事件 (Ctrl+C)
document.addEventListener('keydown', async (e) => {
  // 编辑文字块时，让原生复制粘贴生效
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable) return;

  // 优先：如果有选中的时间轴动画帧，复制动画帧
  if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedAnimFrames && selectedAnimFrames.length > 0) {
    e.preventDefault();
    
    const animCopyData = selectedAnimFrames.map(f => {
      if (f.isMulti && f.indices) {
        // 多选动画（同一时间点的多个可叠加动画）
        const multiAnims = f.indices.map(idx => {
          const anim = blockAnimations[f.blockId][idx];
          return JSON.parse(JSON.stringify(anim));
        });
        return {
          isMulti: true,
          blockId: f.blockId,
          anims: multiAnims
        };
      } else {
        // 单个动画
        const anim = blockAnimations[f.blockId][f.index];
        return {
          isMulti: false,
          blockId: f.blockId,
          anim: JSON.parse(JSON.stringify(anim))
        };
      }
    });
    
    const copyText = JSON.stringify({ type: 'timelineAnims', data: animCopyData });
    await navigator.clipboard.writeText(copyText);
    showTip(`已复制 ${selectedAnimFrames.length} 个时间轴动画`);
    return;
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedBlocks.length > 0) {
    e.preventDefault();
    
    // 收集所有选中块的数据
    const copyDataArray = selectedBlocks.map(block => {
      const blockData = blocks.find(b => b.block === block);
      const blockId = block.dataset.id;
      // 获取当前应用的动画类
      let currentAnim = 'none';
      for (const anim of animPresets) {
        if (block.classList.contains('anim-' + anim)) {
          currentAnim = anim;
          break;
        }
      }
      
      // 获取该块的时间轴动画数据
      const timelineAnims = blockAnimations[blockId]
        ? JSON.parse(JSON.stringify(blockAnimations[blockId]))
        : [];
      
      return {
        text: block.querySelector('.edit-input').value || block.querySelector('.text-content').textContent,
        fontSize: parseInt(block.style.fontSize) || 50,
        fontName: blockData ? blockData.fontName : 'XXOBS-VF',
        weight: blockData ? blockData.weight : 400,
        color: block.style.color || '#111111',
        left: parseInt(block.style.left) || 0,
        top: parseInt(block.style.top) || 0,
        rotate: block.style.getPropertyValue('--rotate-angle') || '0deg',
        flipped: block.dataset.flipped === 'true',
        vertical: block.classList.contains('vertical'),
        animation: currentAnim,
        weightAnimation: weightAnimStates.has(blockId),
        weightAnimDebug: weightAnimStates.has(blockId) ? 'has anim' : 'no anim',
        timelineAnims: timelineAnims
      };
    });
    
    await navigator.clipboard.writeText(JSON.stringify({ type: 'blocks', data: copyDataArray }));
    showTip(`已复制 ${selectedBlocks.length} 个文字块`);
  }
  
  // 全局粘贴事件 (Ctrl+V) - 动画粘贴
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault();
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText || !clipboardText.trim()) return;
      
      let parsedClipboard;
      try {
        parsedClipboard = JSON.parse(clipboardText);
      } catch {
        parsedClipboard = null;
      }
      
      // Ctrl+V: 在时间轴上粘贴动画，在同一轨道上，粘贴在选中动画后面
      if (parsedClipboard && parsedClipboard.type === 'timelineAnims' && Array.isArray(parsedClipboard.data)) {
        const animCopyData = parsedClipboard.data;
        
        // 确定目标块：使用选中的动画帧所在的块，或当前选中的文字块
        let targetBlockId = null;
        if (selectedAnimFrames && selectedAnimFrames.length > 0) {
          targetBlockId = selectedAnimFrames[selectedAnimFrames.length - 1].blockId;
        } else if (selectedBlocks.length > 0) {
          targetBlockId = selectedBlocks[selectedBlocks.length - 1].dataset.id;
        }
        
        if (!targetBlockId) {
          showTip('请先选中一个文字块或动画帧');
          return;
        }
        
        // 计算粘贴起始时间：选中动画的结束时间
        let pasteStartTime = 0;
        if (selectedAnimFrames && selectedAnimFrames.length > 0) {
          const lastFrame = selectedAnimFrames[selectedAnimFrames.length - 1];
          if (lastFrame.isMulti && lastFrame.indices && lastFrame.indices.length > 0) {
            const lastIdx = lastFrame.indices[lastFrame.indices.length - 1];
            const lastAnim = blockAnimations[lastFrame.blockId][lastIdx];
            pasteStartTime = (lastAnim.startTime || 0) + (lastAnim.duration || 0);
          } else {
            const lastAnim = blockAnimations[lastFrame.blockId][lastFrame.index];
            pasteStartTime = (lastAnim.startTime || 0) + (lastAnim.duration || 0);
          }
        } else {
          // 没有选中动画帧：从块中最后一个动画的结束时间开始
          const targetAnims = blockAnimations[targetBlockId] || [];
          targetAnims.forEach(a => {
            const end = (a.startTime || 0) + (a.duration || 0);
            if (end > pasteStartTime) pasteStartTime = end;
          });
        }
        
        // 收集所有要粘贴的动画，计算原始时间偏移
        let minOrigTime = Infinity;
        animCopyData.forEach(item => {
          if (item.isMulti && item.anims) {
            item.anims.forEach(a => {
              if (a.startTime < minOrigTime) minOrigTime = a.startTime;
            });
          } else if (item.anim) {
            if (item.anim.startTime < minOrigTime) minOrigTime = item.anim.startTime;
          }
        });
        if (!isFinite(minOrigTime)) minOrigTime = 0;
        
        // 确保目标块有动画数组
        if (!blockAnimations[targetBlockId]) {
          blockAnimations[targetBlockId] = [];
        }
        
        // 粘贴动画（时间顺延到 pasteStartTime 之后）
        let addedCount = 0;
        animCopyData.forEach(item => {
          if (item.isMulti && item.anims) {
            item.anims.forEach(a => {
              const newAnim = JSON.parse(JSON.stringify(a));
              newAnim.startTime = pasteStartTime + (a.startTime - minOrigTime);
              blockAnimations[targetBlockId].push(newAnim);
              addedCount++;
            });
          } else if (item.anim) {
            const newAnim = JSON.parse(JSON.stringify(item.anim));
            newAnim.startTime = pasteStartTime + (item.anim.startTime - minOrigTime);
            blockAnimations[targetBlockId].push(newAnim);
            addedCount++;
          }
        });
        
        if (typeof renderTimeline === 'function') renderTimeline();
        showTip('已粘贴 ' + addedCount + ' 个动画到时间轴');
        return;
      }
      
      // Ctrl+V: 普通文字块粘贴（偏移位置）
      if (selectedBlocks.length > 0 && parsedClipboard && parsedClipboard.type === 'blocks' && Array.isArray(parsedClipboard.data)) {
        const pasteBaseX = selectedBlocks[selectedBlocks.length - 1].offsetLeft;
        const pasteBaseY = selectedBlocks[selectedBlocks.length - 1].offsetTop;

        const copyDataArray = parsedClipboard.data;
        copyDataArray.forEach((copyData, idx) => {
          const offsetX = (idx + 1) * 20;
          const pasteX = pasteBaseX + offsetX;
          const pasteY = pasteBaseY + offsetX;

          const newBlock = document.createElement('div');
          newBlock.className = 'text-block';
          const id = ++blockIdCounter;
          newBlock.dataset.id = String(id);

          const text = copyData.text || '绚丽文字';
          const htmlText = text.replace(/\n/g, '<br>');
          const fontSize = copyData.fontSize || 50;
          const color = copyData.color || '#111111';
          const fontName = copyData.fontName || 'XXOBS-VF';
          const weight = copyData.weight || 400;

          newBlock.innerHTML = `
            <div class="text-content">${htmlText}</div>
            <textarea class="edit-input">${text}</textarea>
            <button class="delete-btn">×</button>
          `;

          const editInput = newBlock.querySelector('.edit-input');
          editInput.style.fontFamily = `'${fontName}'`;
          editInput.style.fontSize = fontSize + 'px';
          editInput.style.color = color;
          editInput.style.fontVariationSettings = `'wght' ${weight}`;
          editInput.style.wordWrap = 'break-word';
          editInput.style.whiteSpace = 'normal';
          editInput.style.overflow = 'hidden';

          newBlock.style.fontSize = fontSize + 'px';
          newBlock.style.color = color;
          newBlock.style.fontFamily = `'${fontName}'`;
          newBlock.style.fontVariationSettings = `'wght' ${weight}`;
          newBlock.style.left = pasteX + 'px';
          newBlock.style.top = pasteY + 'px';

          if (copyData.vertical) {
            newBlock.classList.add('vertical');
          }
          if (copyData.rotate) {
            newBlock.style.setProperty('--rotate-angle', copyData.rotate);
          }

          document.getElementById('blocksContainer').appendChild(newBlock);

          // 绑定事件（内联，避免依赖外部函数）
          const _editInput = newBlock.querySelector('.edit-input');
          const _deleteBtn = newBlock.querySelector('.delete-btn');

          // 鼠标按下（选中/拖拽）
          newBlock.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('delete-btn')) return;
            if (e.target.classList.contains('edit-input')) return;
            const isModifierKey = e.shiftKey || e.ctrlKey || e.metaKey;
            if (isModifierKey) {
              if (selectedBlocks.includes(newBlock)) {
                const index = selectedBlocks.indexOf(newBlock);
                if (index > -1) {
                  selectedBlocks.splice(index, 1);
                  newBlock.classList.remove('selected');
                }
              } else {
                if (!selectedBlocks.includes(newBlock)) {
                  selectedBlocks.push(newBlock);
                  newBlock.classList.add('selected');
                }
              }
            } else {
              if (!selectedBlocks.includes(newBlock)) {
                selectedBlocks.forEach(b => b.classList.remove('selected'));
                selectedBlocks = [newBlock];
                selectedBlocks.forEach(b => b.classList.add('selected'));
              }
            }
            if (selectedBlocks.length > 0) {
              updatePanelForBlock(selectedBlocks[0]);
              updateWeightAnimButtonState();
            }
            dragState = {
              isDragging: true,
              startX: e.clientX,
              startY: e.clientY,
              origPositions: selectedBlocks.map(b => ({
                left: parseInt(b.style.left) || 0,
                top: parseInt(b.style.top) || 0
              }))
            };
            e.stopPropagation();
          });

          // 双击编辑
          newBlock.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            newBlock.classList.add('editing');
            _editInput.focus();
            _editInput.select();
          });

          // 输入同步
          _editInput.addEventListener('input', () => {
            const content = _editInput.value.replace(/\n/g, '<br>');
            const textContent = newBlock.querySelector('.text-content');
            textContent.innerHTML = content;
            if (selectedBlocks.includes(newBlock)) {
              const customText = document.getElementById('customText');
              if (customText) customText.value = _editInput.value;
            }
          });

          _editInput.addEventListener('blur', () => {
            newBlock.classList.remove('editing');
            const blockData = blocks.find(b => b.block === newBlock);
            if (blockData) {
              blockData.text = _editInput.value;
              onBlocksChanged();
              renderTimeline();
            }
          });

          _editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              e.preventDefault();
              _editInput.blur();
            }
          });

          // 删除按钮
          _deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteBlock(newBlock);
          });

          newBlock.addEventListener('click', (e) => {
            e.stopPropagation();
          });

          newBlock.setAttribute('tabindex', '0');

          blocks.push({
            id: String(id),
            block: newBlock,
            text: text,
            fontSize: fontSize + 'px',
            color: color,
            fontName: fontName,
            weight: weight,
            zIndex: 0
          });

          // 复制时间轴动画
          if (copyData.timelineAnims && copyData.timelineAnims.length > 0) {
            blockAnimations[String(id)] = JSON.parse(JSON.stringify(copyData.timelineAnims));
          }

          selectBlock(newBlock);
        });
        if (typeof renderTimeline === 'function') renderTimeline();
        showTip('已粘贴 ' + copyDataArray.length + ' 个文字块');
        return;
      }
      
      showTip('剪贴板内容无法粘贴');
    } catch (err) {
      console.error('粘贴失败:', err);
      showTip('粘贴失败');
    }
    return;
  }
  
  // Ctrl+B: 原位复制文字块（带动画）
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    
    if (selectedBlocks.length === 0) {
      showTip('请先选中一个文字块');
      return;
    }
    
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText || !clipboardText.trim()) {
        showTip('剪贴板为空');
        return;
      }
      
      let parsedClipboard;
      try {
        parsedClipboard = JSON.parse(clipboardText);
      } catch {
        showTip('剪贴板格式错误');
        return;
      }
      
      if (!parsedClipboard || !Array.isArray(parsedClipboard.data)) {
        showTip('剪贴板格式错误');
        return;
      }
      
      const copyDataArray = parsedClipboard.data;
      
      copyDataArray.forEach(copyData => {
        const newBlockId = String(++blockIdCounter);
        const newBlock = document.createElement('div');
        newBlock.className = 'text-block';

        const text = copyData.text || '绚丽文字';
        const htmlText = text.replace(/\n/g, '<br>');
        const fontSize = copyData.fontSize || 50;
        const color = copyData.color || '#111111';
        const fontName = copyData.fontName || 'XXOBS-VF';
        const weight = copyData.weight || 400;

        newBlock.innerHTML = `
          <div class="text-content">${htmlText}</div>
          <textarea class="edit-input">${text}</textarea>
          <button class="delete-btn">×</button>
        `;

        const _editInput = newBlock.querySelector('.edit-input');
        _editInput.style.fontFamily = `'${fontName}'`;
        _editInput.style.fontSize = fontSize + 'px';
        _editInput.style.color = color;
        _editInput.style.fontVariationSettings = `'wght' ${weight}`;
        _editInput.style.wordWrap = 'break-word';
        _editInput.style.whiteSpace = 'normal';
        _editInput.style.overflow = 'hidden';

        newBlock.style.fontSize = fontSize + 'px';
        newBlock.style.color = color;
        newBlock.style.fontFamily = `'${fontName}'`;
        newBlock.style.fontVariationSettings = `'wght' ${weight}`;
        newBlock.dataset.id = newBlockId;

        // 设置 zIndex 为新最大值
        const allZIndices = [
          ...blocks.map(b => parseInt(b.block.style.zIndex) || 0),
          ...bgImages.map(bg => bg.zIndex || 0),
          ...videoItems.map(v => v.zIndex || 0)
        ];
        const maxZ = allZIndices.length > 0 ? Math.max(...allZIndices) : 0;
        newBlock.style.zIndex = maxZ + 1;

        // 保持原位（不偏移）
        if (copyData.left !== undefined) newBlock.style.left = copyData.left + 'px';
        if (copyData.top !== undefined) newBlock.style.top = copyData.top + 'px';

        if (copyData.vertical) {
          newBlock.classList.add('vertical');
        }
        if (copyData.rotate) {
          newBlock.style.setProperty('--rotate-angle', copyData.rotate);
        }

        document.getElementById('blocksContainer').appendChild(newBlock);

        // 绑定事件
        const _deleteBtn = newBlock.querySelector('.delete-btn');
        newBlock.addEventListener('mousedown', (e) => {
          if (e.target.classList.contains('delete-btn')) return;
          if (e.target.classList.contains('edit-input')) return;
          const isModifierKey = e.shiftKey || e.ctrlKey || e.metaKey;
          if (isModifierKey) {
            if (selectedBlocks.includes(newBlock)) {
              const index = selectedBlocks.indexOf(newBlock);
              if (index > -1) {
                selectedBlocks.splice(index, 1);
                newBlock.classList.remove('selected');
              }
            } else {
              if (!selectedBlocks.includes(newBlock)) {
                selectedBlocks.push(newBlock);
                newBlock.classList.add('selected');
              }
            }
          } else {
            if (!selectedBlocks.includes(newBlock)) {
              selectedBlocks.forEach(b => b.classList.remove('selected'));
              selectedBlocks = [newBlock];
              selectedBlocks.forEach(b => b.classList.add('selected'));
            }
          }
          if (selectedBlocks.length > 0) {
            updatePanelForBlock(selectedBlocks[0]);
            updateWeightAnimButtonState();
          }
          dragState = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            origPositions: selectedBlocks.map(b => ({
              left: parseInt(b.style.left) || 0,
              top: parseInt(b.style.top) || 0
            }))
          };
          e.stopPropagation();
        });
        newBlock.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          newBlock.classList.add('editing');
          _editInput.focus();
          _editInput.select();
        });
        _editInput.addEventListener('input', () => {
          const content = _editInput.value.replace(/\n/g, '<br>');
          const textContent = newBlock.querySelector('.text-content');
          textContent.innerHTML = content;
          if (selectedBlocks.includes(newBlock)) {
            const customText = document.getElementById('customText');
            if (customText) customText.value = _editInput.value;
          }
        });
        _editInput.addEventListener('blur', () => {
          newBlock.classList.remove('editing');
          const blockData = blocks.find(b => b.block === newBlock);
          if (blockData) {
            blockData.text = _editInput.value;
            onBlocksChanged();
            renderTimeline();
          }
        });
        _editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            _editInput.blur();
          }
        });
        _deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteBlock(newBlock);
        });
        newBlock.addEventListener('click', (e) => {
          e.stopPropagation();
        });
        newBlock.setAttribute('tabindex', '0');

        blocks.push({
          id: newBlockId,
          block: newBlock,
          text: text,
          fontSize: fontSize + 'px',
          color: color,
          fontName: fontName,
          weight: weight,
          zIndex: maxZ + 1,
          animation: copyData.animation || 'none',
          animationSpeed: copyData.animationSpeed || 1,
          animLoop: copyData.animLoop !== undefined ? copyData.animLoop : true,
          animStartTime: copyData.animStartTime || 0,
          animEndTime: copyData.animEndTime || 2,
          weightAnimMin: copyData.weightAnimMin || 100,
          weightAnimMax: copyData.weightAnimMax || 900,
          weightAnimEnabled: copyData.weightAnimEnabled || false,
          initialTransform: copyData.initialTransform || ''
        });

        // 复制时间轴动画（同时间原位）
        if (copyData.timelineAnims && copyData.timelineAnims.length > 0) {
          blockAnimations[newBlockId] = JSON.parse(JSON.stringify(copyData.timelineAnims));
        }

        selectBlock(newBlock);
      });
      
      if (typeof renderTimeline === 'function') renderTimeline();
      showTip('已原位复制 ' + copyDataArray.length + ' 个文字块（带动画）');
    } catch (err) {
      console.error('原位复制失败:', err);
      showTip('原位复制失败');
    }
    return;
  }
  
  // 组合文字块 (Ctrl+G)
  if ((e.ctrlKey || e.metaKey) && e.key === 'g' && selectedBlocks.length > 1) {
    e.preventDefault();
    groupBlocks(selectedBlocks);
  }
  
  // 解组文字块 (Ctrl+U)
  if ((e.ctrlKey || e.metaKey) && e.key === 'u' && selectedBlocks.length > 0) {
    e.preventDefault();
    ungroupBlocks(selectedBlocks);
  }
  
});

// 存储组合信息
let blockGroups = [];

// 组合文字块函数
function groupBlocks(blocksToGroup) {
  if (blocksToGroup.length < 2) return;
  
  // 先解除这些块已有的组合
  const existingGroups = new Set();
  blocksToGroup.forEach(block => {
    if (block.dataset.groupId) {
      existingGroups.add(block.dataset.groupId);
    }
  });
  
  // 从组列表中移除已有的组合
  if (existingGroups.size > 0) {
    blockGroups = blockGroups.filter(g => !existingGroups.has(g.id));
    blocksToGroup.forEach(block => {
      delete block.dataset.groupId;
      block.classList.remove('grouped');
    });
  }
  
  // 找到边界框
  const minLeft = Math.min(...blocksToGroup.map(b => parseInt(b.style.left) || 0));
  const minTop = Math.min(...blocksToGroup.map(b => parseInt(b.style.top) || 0));
  
  // 创建组数据
  const groupId = 'group_' + Date.now();
  const groupData = {
    id: groupId,
    blocks: blocksToGroup.map(block => {
      const left = parseInt(block.style.left) || 0;
      const top = parseInt(block.style.top) || 0;
      return {
        block: block,
        relX: left - minLeft,
        relY: top - minTop
      };
    }),
    baseX: minLeft,
    baseY: minTop
  };
  
  // 将组信息添加到每个块
  blocksToGroup.forEach(block => {
    block.dataset.groupId = groupId;
    block.classList.add('grouped');
  });
  
  blockGroups.push(groupData);
  
  showTip(`已将 ${blocksToGroup.length} 个文字块组合`);
}

// 解组文字块函数
function ungroupBlocks(blocksToUngroup) {
  const groupsToRemove = new Set();
  
  blocksToUngroup.forEach(block => {
    if (block.dataset.groupId) {
      groupsToRemove.add(block.dataset.groupId);
      delete block.dataset.groupId;
      block.classList.remove('grouped');
    }
  });
  
  // 从组列表中移除
  blockGroups = blockGroups.filter(g => !groupsToRemove.has(g.id));
  
  showTip(`已解除组合`);
}

// 双击空白处添加文字块
previewContainer.addEventListener('dblclick', async (e) => {
  if (e.target.closest('.text-block')) return;
  if (e.target.closest('.bg-image-item')) return;
  if (e.target.closest('.video-item')) return;
  
  const blocksRect = blocksContainer.getBoundingClientRect();
  
  let fontFamily;
  let fontSizeVal = 50;
  let weightVal = 400;
  if (selectedBlocks.length > 0) {
    const firstBlock = selectedBlocks[0];
    fontFamily = firstBlock.style.fontFamily.replace(/['"]/g, '').trim();
    fontSizeVal = parseInt(firstBlock.style.fontSize) || 50;
    const blockData = blocks.find(b => b.block === firstBlock);
    if (blockData) {
      weightVal = blockData.weight;
    }
  } else {
    fontFamily = fontSelect.value.replace('.ttf', '').replace('.woff2', '').replace('.otf', '');
  }
  
  const x = (e.clientX - blocksRect.left) / viewScale;
  const y = (e.clientY - blocksRect.top) / viewScale;
  
  const block = await createBlock(x, y, '绚丽文字', fontSizeVal, '#111111', fontFamily, weightVal);
  selectBlock(block);
  block.classList.add('editing');
  block.querySelector('.edit-input').focus();
  block.querySelector('.edit-input').select();
});

// 点击空白处取消选中或确定编辑 - 使用 setTimeout 确保文字块的点击事件先处理
previewContainer.addEventListener('click', (e) => {
  setTimeout(() => {
    // 查找是否有正在编辑的文字块
    const editingBlock = document.querySelector('.text-block.editing');
    
    // 如果有正在编辑的文字块且点击的不是编辑输入框，确定编辑
    if (editingBlock && !e.target.classList.contains('edit-input') && !e.target.closest('.text-block')) {
      // 退出编辑模式
      editingBlock.classList.remove('editing');
      const editInput = editingBlock.querySelector('.edit-input');
      const textContent = editingBlock.querySelector('.text-content');
      // 更新显示内容，将换行符转换为 <br> 标签
      const text = editInput.value || '绚丽文字';
      const htmlText = text.replace(/\n/g, '<br>');
      textContent.innerHTML = htmlText;
      
      // 更新 blockData.text
      const blockData = blocks.find(b => b.block === editingBlock);
      if (blockData) {
        blockData.text = text;
        onBlocksChanged();
      }
      return;
    }
    
    // 检查是否点击了文字块或摄像头区域
    const isTextBlock = e.target.closest('.text-block');
    const isCamera = e.target.closest('.camera-area');
    
    // 只有点击的不是文字块且不是摄像头区域时，才取消选中
    if (!isTextBlock && !isCamera) {
      selectedBlocks.forEach(b => b.classList.remove('selected'));
      selectedBlocks = [];
      customText.value = '';
      
      // 更新字重动画按钮状态
      updateWeightAnimButtonState();
    }
  }, 0);
});

// 背景拖拽
let isBgDragging = false;
let bgDragStartX, bgDragStartY;

previewContainer.addEventListener('mousedown', (e) => {
  // 如果点击的是文字块、图片、视频或摄像头，不处理
  if (e.target.closest('.text-block')) return;
  if (e.target.closest('.bg-image-item')) return;
  if (e.target.closest('.video-item')) return;
  if (e.target.closest('.camera-area')) return;
  
  isBgDragging = true;
  bgDragStartX = e.clientX;
  bgDragStartY = e.clientY;
  previewContainer.style.cursor = 'grabbing';
  e.preventDefault();
});

const contentLayer = document.getElementById('contentLayer');
const blocksContainer = document.getElementById('blocksContainer');

// 设置画板基准尺寸
if (blocksContainer) {
  blocksContainer.style.width = BASE_WIDTH + 'px';
  blocksContainer.style.height = BASE_HEIGHT + 'px';
}
const bgImagesContainerEl = document.getElementById('bgImagesContainer');
const videosContainerEl = document.getElementById('videosContainer');
if (bgImagesContainerEl) {
  bgImagesContainerEl.style.width = BASE_WIDTH + 'px';
  bgImagesContainerEl.style.height = BASE_HEIGHT + 'px';
}
if (videosContainerEl) {
  videosContainerEl.style.width = BASE_WIDTH + 'px';
  videosContainerEl.style.height = BASE_HEIGHT + 'px';
}

// 应用预设到单个文字块的函数
function applyPresetToBlock(block, preset) {
  // 应用字体大小
  block.style.fontSize = preset.fontSize + 'px';
  const editInput = block.querySelector('.edit-input');
  if (editInput) {
    editInput.style.fontSize = preset.fontSize + 'px';
  }
  
  // 应用字体
  block.style.fontFamily = `'${preset.fontName}'`;
  if (editInput) {
    editInput.style.fontFamily = `'${preset.fontName}'`;
  }
  
  // 应用字重
  block.style.fontVariationSettings = `'wght' ${preset.weight}`;
  if (editInput) {
    editInput.style.fontVariationSettings = `'wght' ${preset.weight}`;
  }
  
  // 应用颜色
  block.style.color = preset.color;
  if (editInput) {
    editInput.style.color = preset.color;
  }
  
  // 应用旋转角度（解析数字或带deg的值）
  let rotateAngle = preset.rotate || '0deg';
  if (!rotateAngle.includes('deg')) {
    rotateAngle = rotateAngle + 'deg';
  }
  block.style.setProperty('--rotate-angle', rotateAngle);
  
  // 应用翻转
  block.dataset.flipped = preset.flipped ? 'true' : 'false';
  block.dataset.flippedY = preset.flippedY ? 'true' : 'false';
  
  // 应用竖排
  if (preset.vertical) {
    block.classList.add('vertical');
  } else {
    block.classList.remove('vertical');
  }
  
  // 应用动画
  animPresets.forEach(anim => {
    block.classList.remove('anim-' + anim);
  });
  if (preset.animation && preset.animation !== 'none') {
    block.classList.add('anim-' + preset.animation);
  }
  
  // 应用字重动画范围和速度（先设置UI值，再启动动画）
  if (preset.weightAnimMin !== undefined) {
    weightMinInput.value = preset.weightAnimMin;
  }
  if (preset.weightAnimMax !== undefined) {
    weightMaxInput.value = preset.weightAnimMax;
  }
  if (preset.weightAnimSpeed !== undefined) {
    weightAnimSpeedInput.value = preset.weightAnimSpeed;
  }
  
  // 应用字重动画（现在UI值已经设置好了）
  if (preset.weightAnimation) {
    startWeightAnimationForBlock(block);
  } else {
    stopWeightAnimationForBlock(block);
  }
  
  // 应用变换（使用预设的旋转角度）
  const angleValue = parseInt(rotateAngle) || 0;
  const flip = preset.flipped ? -1 : 1;
  block.style.transform = `rotate(${angleValue}deg) scaleX(${flip})`;
  
  // 如果是动画模式，需要额外处理
  if (preset.animation && preset.animation !== 'none') {
    // 设置transform-origin
    if (preset.animation === 'fall' || preset.animation === 'jump') {
      block.style.transformOrigin = 'bottom center';
    } else {
      block.style.transformOrigin = 'center center';
    }
    block.style.setProperty('--rotate-angle', angleValue + 'deg');
    block.style.setProperty('--flip-scale', flip);
  }
  
  // 更新blocks数据 - 使用block的dataset.id来查找
  const blockId = block.dataset.id;
  const blockData = blocks.find(b => b.id === blockId);
  if (blockData) {
    blockData.fontSize = preset.fontSize;
    blockData.fontName = preset.fontName;
    blockData.weight = preset.weight;
    blockData.color = preset.color;
    blockData.animation = preset.animation || 'none';
    blockData.animationSpeed = preset.animationSpeed !== undefined ? preset.animationSpeed : 1;
    // 保存字重动画设置（使用预设值或UI当前值）
    blockData.weightAnimMin = preset.weightAnimMin ?? parseInt(weightMinInput.value) ?? 100;
    blockData.weightAnimMax = preset.weightAnimMax ?? parseInt(weightMaxInput.value) ?? 900;
    blockData.weightAnimSpeed = preset.weightAnimSpeed ?? parseFloat(weightAnimSpeedInput.value) ?? 1;
    // 保存字重动画启用状态
    blockData.weightAnimation = preset.weightAnimation || false;
    // 保存旋转角度
    blockData.rotate = rotateAngle;
    
    // 将预设动画添加到时间轴
    if (preset.animation && preset.animation !== 'none') {
      // 计算开始时间
      let startTime = 0;
      const anims = blockAnimations[blockId] || [];
      if (anims.length > 0) {
        startTime = Math.max(...anims.map(a => a.startTime + a.duration));
      }
      
      // 添加动画到时间轴
      if (!blockAnimations[blockId]) {
        blockAnimations[blockId] = [];
      }
      
      blockAnimations[blockId].push({
        type: 'preset',
        anim: preset.animation,
        startTime: startTime,
        duration: getDefaultAnimationDuration(preset.animation) / (preset.animationSpeed || 1),
        rotate: parseInt(rotateAngle) || 0,
        flipX: preset.flipped || false,
        flipY: false
      });
      
      // 刷新时间轴
      renderTimeline();
    }
    
    // 将字重动画添加到时间轴
    if (preset.weightAnimation) {
      // 计算开始时间
      let startTime = 0;
      const anims = blockAnimations[blockId] || [];
      if (anims.length > 0) {
        startTime = Math.max(...anims.map(a => a.startTime + a.duration));
      }
      
      // 添加字重动画到时间轴
      if (!blockAnimations[blockId]) {
        blockAnimations[blockId] = [];
      }
      
      blockAnimations[blockId].push({
        type: 'weight',
        anim: 'weightAnim',
        startTime: startTime,
        duration: 3, // 字重动画默认3秒
        weightAnimMin: preset.weightAnimMin ?? 100,
        weightAnimMax: preset.weightAnimMax ?? 900,
        weightAnimSpeed: preset.weightAnimSpeed ?? 1
      });
      
      // 刷新时间轴
      renderTimeline();
    }
  }
}

// 预设拖拽放下到展示区
let presetDragPreview = null; // 拖拽预览块（可以是数组）
let currentPresetData = null; // 当前拖拽的预设数据
let dragEmptyImg = null; // 拖拽用的空图像
let previewWeightAnimFrameId = null; // 预览字重动画帧ID

// 启动预览块的字重动画
function startPreviewWeightAnimation(previewBlocks) {
  if (previewWeightAnimFrameId) {
    cancelAnimationFrame(previewWeightAnimFrameId);
  }
  
  const startTime = performance.now();
  
  function animate() {
    const elapsed = performance.now() - startTime;
    
    previewBlocks.forEach(preview => {
      if (preview.dataset.weightAnimPreview === 'true') {
        const minW = parseInt(preview.dataset.weightAnimMin) || 100;
        const maxW = parseInt(preview.dataset.weightAnimMax) || 900;
        const speed = parseFloat(preview.dataset.weightAnimSpeed) || 1;
        const cycleDuration = 2000 / speed;
        
        // 计算当前字重值（来回循环）
        const progress = (elapsed % cycleDuration) / cycleDuration;
        const weight = minW + (maxW - minW) * (progress < 0.5 ? progress * 2 : (1 - progress) * 2);
        
        preview.style.fontVariationSettings = `'wght' ${Math.round(weight)}`;
      }
    });
    
    previewWeightAnimFrameId = requestAnimationFrame(animate);
  }
  
  animate();
}

// 停止预览块的字重动画
function stopPreviewWeightAnimation() {
  if (previewWeightAnimFrameId) {
    cancelAnimationFrame(previewWeightAnimFrameId);
    previewWeightAnimFrameId = null;
  }
}

// 允许拖拽进入
contentLayer.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  contentLayer.classList.add('drag-over');
  
  // 更新预览块位置
  if (presetDragPreview) {
    // 使用previewContainer来计算位置
    const rect = previewContainer.getBoundingClientRect();
    // 预览块在contentLayer中（没有缩放），直接使用屏幕坐标
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 添加偏移量，让预览块显示在鼠标右侧一点
    const offsetX = 10;
    const offsetY = 10;
    
    if (Array.isArray(presetDragPreview) && currentPresetData) {
      // 多个预览块 - 第一个块跟随鼠标，其他块保持相对位置
      const blocksData = currentPresetData.blocks && currentPresetData.blocks.length > 0 ? currentPresetData.blocks : [];
      const baseX = currentPresetData.baseX || 0;
      const baseY = currentPresetData.baseY || 0;
      
      presetDragPreview.forEach((preview, index) => {
        const blockData = blocksData[index] || { relX: 0, relY: 0 };
        // 预览块位置：第一个块跟随鼠标，其他块保持相对偏移
        preview.style.left = (x + offsetX + (blockData.relX || 0) - baseX) + 'px';
        preview.style.top = (y + offsetY + (blockData.relY || 0) - baseY) + 'px';
      });
    } else if (presetDragPreview) {
      // 单个预览块
      presetDragPreview.style.left = (x + offsetX) + 'px';
      presetDragPreview.style.top = (y + offsetY) + 'px';
    }
  }
});

// previewContainer 拖拽支持
previewContainer.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  contentLayer.classList.add('drag-over');
});

async function handlePresetDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  contentLayer.classList.remove('drag-over');
  
  // 移除预览块
  if (presetDragPreview) {
    if (Array.isArray(presetDragPreview)) {
      presetDragPreview.forEach(p => p.remove());
    } else {
      presetDragPreview.remove();
    }
    presetDragPreview = null;
  }
  currentPresetData = null;
  
  console.log('previewContainer Drop事件触发');
  
  try {
    const data = e.dataTransfer.getData('text/plain');
    console.log('获取到的数据:', data);
    const preset = JSON.parse(data);
    console.log('解析后的预设:', preset);
    
    // 使用blocksContainer实际位置计算坐标
    const blocksRect = blocksContainer.getBoundingClientRect();
    const dropX = (e.clientX - blocksRect.left) / viewScale;
    const dropY = (e.clientY - blocksRect.top) / viewScale;
    
    console.log('计算的位置:', dropX, dropY);
    
    // 清空之前的选择
    selectedBlocks.forEach(b => b.classList.remove('selected'));
    selectedBlocks = [];
    
    // 检查预设是否包含多个块
    if (preset.blocks && preset.blocks.length > 0) {
      // 创建多个文字块 - 第一个块在鼠标位置，其他块保持相对位置
      const baseX = preset.baseX || 0;
      const baseY = preset.baseY || 0;
      
      for (const blockData of preset.blocks) {
        // 计算块的左上角位置（与预览保持一致）
        const newLeft = dropX + (blockData.relX || 0) - baseX;
        const newTop = dropY + (blockData.relY || 0) - baseY;
        
        const fontSize = blockData.fontSize || 50;
        const text = blockData.text || blockData.name || '预设文字';
        
        const newBlock = await createBlock(
          newLeft, newTop,
          text,
          fontSize,
          blockData.color || '#111111',
          blockData.fontName || 'XXOBS-VF',
          blockData.weight || 400
        );
        
        // 应用预设设置
        applyPresetToBlock(newBlock, blockData);
        
        selectedBlocks.push(newBlock);
        newBlock.classList.add('selected');
      }
      
      showTip(`已从预设创建 ${preset.blocks.length} 个文字块`);
    } else {
      // 单个块（旧格式兼容）- 使用左上角坐标
      const newBlock = await createBlock(
        dropX, dropY,
        preset.text || preset.name || '预设文字',
        preset.fontSize || 50,
        preset.color || '#111111',
        preset.fontName || 'XXOBS-VF',
        preset.weight || 400
      );
      console.log('文字块创建成功');
      
      // 应用预设设置
      applyPresetToBlock(newBlock, preset);
      
      selectedBlocks.push(newBlock);
      newBlock.classList.add('selected');
      
      showTip('已从预设创建文字块');
    }
    
    // 更新控制面板
    if (selectedBlocks.length > 0) {
      const firstBlock = selectedBlocks[0];
      const blockData = blocks.find(b => b.block === firstBlock);
      const firstBlockData = preset.blocks && preset.blocks.length > 0 ? preset.blocks[0] : preset;
      
      fontSize.value = firstBlockData.fontSize || 50;
      fsNum.value = fontSize.value;
      wght.value = firstBlockData.weight || 400;
      wNum.value = wght.value;
      textColor.value = firstBlockData.color || '#111111';
      rotate.value = parseInt(firstBlockData.rotate) || 0;
      rotateNum.value = rotate.value;
      animSelect.value = firstBlockData.animation || 'none';
      if (flipXBtn) flipXBtn.classList.toggle('active', firstBlockData.flipped);
      if (flipYBtn) flipYBtn.classList.toggle('active', firstBlockData.flippedY);
      if (verticalBtn) verticalBtn.classList.toggle('active', firstBlockData.vertical);
      fontSelect.value = (firstBlockData.fontName || 'XXOBS-VF') + '.ttf';
      
      // 更新字重动画按钮状态
      updateWeightAnimButtonState();
    }
  } catch (err) {
    console.error('预设拖放错误:', err);
  }
}

previewContainer.addEventListener('drop', handlePresetDrop);
contentLayer.addEventListener('drop', handlePresetDrop);


contentLayer.addEventListener('dragleave', (e) => {
  // 只有当鼠标离开 contentLayer 区域时才移除
  const rect = contentLayer.getBoundingClientRect();
  if (e.clientX < rect.left || e.clientX > rect.right || 
      e.clientY < rect.top || e.clientY > rect.bottom) {
    contentLayer.classList.remove('drag-over');
  }
});

function degToRad(deg) {
  return deg * Math.PI / 180;
}

function radToDeg(rad) {
  return rad * 180 / Math.PI;
}

function rotateX(point, angle) {
  const rad = degToRad(angle);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos
  };
}

function rotateY(point, angle) {
  const rad = degToRad(angle);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos
  };
}

function rotateZ(point, angle) {
  const rad = degToRad(angle);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z
  };
}

function perspectiveProject(point, focalLength) {
  if (point.z >= -0.01) return null;
  const scale = focalLength / (-point.z);
  return {
    x: point.x * scale,
    y: point.y * scale,
    z: point.z,
    scale: scale
  };
}

function applyTransform(){
  const bc = document.getElementById('blocksContainer');
  const bgic = document.getElementById('bgImagesContainer');
  const vic = document.getElementById('videosContainer');
  const p = typeof viewPerspective !== 'undefined' ? viewPerspective : 1000;
  const rx = typeof viewRotateX !== 'undefined' ? viewRotateX : 0;
  const ry = typeof viewRotateY !== 'undefined' ? viewRotateY : 0;
  const r = typeof viewRotate !== 'undefined' ? viewRotate : 0;
  const tx = typeof viewTranslateX !== 'undefined' ? viewTranslateX : 0;
  const ty = typeof viewTranslateY !== 'undefined' ? viewTranslateY : 0;
  const s = typeof viewScale !== 'undefined' ? viewScale : 1;
  
  const transform = `perspective(${p}px) translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${r}deg) scale(${s})`;
  if (bc) bc.style.transform = transform;
  if (bgic) bgic.style.transform = transform;
  if (vic) vic.style.transform = transform;
  updateCameraInfo();
}

function updateOrbitCamera() {
  const pitchRad = degToRad(cameraPitch);
  const yawRad = degToRad(cameraYaw);
  
  cameraX = orbitCenterX + cameraDistance * Math.sin(yawRad) * Math.cos(pitchRad);
  cameraY = orbitCenterY + cameraDistance * Math.sin(pitchRad);
  cameraZ = orbitCenterZ + cameraDistance * Math.cos(yawRad) * Math.cos(pitchRad);
}

function zoomCamera(delta) {
  cameraDistance = Math.max(100, Math.min(5000, cameraDistance - delta));
  updateOrbitCamera();
  applyTransform();
  updateCameraInfo();
}

document.addEventListener('wheel', (e) => {
  if (isDraggingCamera) return;
  if (!document.fullscreenElement && !previewContainer.contains(e.target)) return;
  
  e.preventDefault();
  zoomCamera(e.deltaY);
}, { passive: false });

function calculateCameraTransform() {
  const centerX = BASE_WIDTH / 2;
  const centerY = BASE_HEIGHT / 2;
  const s = typeof viewScale !== 'undefined' ? viewScale : 1;
  const tx = typeof viewTranslateX !== 'undefined' ? viewTranslateX : 0;
  const ty = typeof viewTranslateY !== 'undefined' ? viewTranslateY : 0;
  
  let transform = `perspective(${cameraFocalLength}px)`;
  
  if (cameraPitch !== 0) transform += ` rotateX(${-cameraPitch}deg)`;
  if (cameraYaw !== 0) transform += ` rotateY(${-cameraYaw}deg)`;
  if (cameraRoll !== 0) transform += ` rotate(${cameraRoll}deg)`;
  
  const effectiveZ = cameraZ - orbitCenterZ;
  
  // 以默认相机距离为基准归一化缩放，确保初始状态和非3D模式一致（scale=1）
  const baseDistance = 1000;
  const camScale = (cameraFocalLength + baseDistance) / (cameraFocalLength + effectiveZ);
  
  const offsetX = (cameraX - orbitCenterX) * (cameraFocalLength / (cameraFocalLength + effectiveZ));
  const offsetY = (cameraY - orbitCenterY) * (cameraFocalLength / (cameraFocalLength + effectiveZ));
  
  const totalScale = camScale * s;
  
  transform += ` translate(calc(-50% + ${centerX + offsetX + tx}px), calc(-50% + ${centerY + offsetY + ty}px))`;
  transform += ` scale(${totalScale})`;
  transform += ` translate(-${centerX}px, -${centerY}px)`;
  
  return transform;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function calcMotionOffset(motion, progress, dist, scaleVal, elapsedMs) {
  let tx = 0, ty = 0, sc = 1, rot = 0, rotX = 0, rotY = 0;
  let camX = 0, camY = 0, camZ = 0, camPitch = 0, camYaw = 0, camRoll = 0;
  let use3D = false;
  const eased = easeInOut(progress);
  
  switch (motion) {
    case 'left': tx = -dist * eased; break;
    case 'right': tx = dist * eased; break;
    case 'up': ty = -dist * eased; break;
    case 'down': ty = dist * eased; break;
    case 'zoomIn': sc = 1 + (scaleVal - 1) * eased; break;
    case 'zoomOut': sc = 1 - (1 - 1 / scaleVal) * eased; break;
    case 'none':
    case 'noneScale':
      break;
    case 'orbit':
      rotY = eased * 360;
      sc = 0.7 + 0.3 * Math.abs(Math.cos(eased * Math.PI * 2));
      break;
    case 'orbitCW':
      rotY = -eased * 360;
      sc = 0.7 + 0.3 * Math.abs(Math.cos(eased * Math.PI * 2));
      break;
    case 'orbitCCW':
      rotY = eased * 360;
      sc = 0.7 + 0.3 * Math.abs(Math.cos(eased * Math.PI * 2));
      break;
    case 'orbitZoomIn':
      rotY = eased * 360;
      sc = 0.5 + (scaleVal - 0.5) * eased * 0.5 + 0.3 * Math.abs(Math.cos(eased * Math.PI * 2)) * (1 - eased);
      break;
    case 'orbitZoomOut':
      rotY = eased * 360;
      sc = scaleVal - (scaleVal - 0.7) * eased * 0.5 + 0.3 * Math.abs(Math.cos(eased * Math.PI * 2)) * eased;
      break;
    case 'orbitTilt':
      rotY = eased * 360;
      rotX = Math.sin(eased * Math.PI * 4) * 20;
      sc = 0.7 + 0.3 * Math.abs(Math.cos(eased * Math.PI * 2));
      break;
    case 'orbitDouble':
      rotY = eased * 720;
      sc = 0.6 + 0.4 * Math.abs(Math.cos(eased * Math.PI * 4));
      break;
    case 'orbitFlipX':
      rotX = eased * 360;
      sc = 0.6 + 0.4 * Math.abs(Math.cos(eased * Math.PI * 2));
      break;
    case 'orbitFlipY':
      rotY = eased * 360;
      sc = 0.6 + 0.4 * Math.abs(Math.sin(eased * Math.PI * 2));
      break;
    case 'orbitSpiral':
      rotY = eased * 720;
      sc = 0.4 + (scaleVal - 0.4) * eased;
      rotX = Math.sin(eased * Math.PI * 2) * 10 * eased;
      break;
    case 'orbitRoll':
      rotY = eased * 360;
      rot = Math.sin(eased * Math.PI * 6) * 30;
      sc = 0.7 + 0.3 * Math.abs(Math.cos(eased * Math.PI * 2));
      break;
    case 'orbitDolly':
      rotY = eased * 360;
      sc = 0.5 + (scaleVal - 0.5) * 0.5 * (1 + Math.sin(eased * Math.PI * 2 - Math.PI / 2));
      break;
    case 'orbitPendulum':
      rotY = Math.sin(eased * Math.PI * 2) * 45;
      rotX = Math.sin(eased * Math.PI * 2) * 20;
      sc = 0.8 + 0.2 * Math.abs(Math.sin(eased * Math.PI * 2));
      break;
    case 'rollLeft':
      rot = -dist * 0.3 * eased;
      tx = -dist * 0.2 * eased;
      break;
    case 'rollRight':
      rot = dist * 0.3 * eased;
      tx = dist * 0.2 * eased;
      break;
    case 'spin':
      rot = eased * 720;
      sc = 1 + (scaleVal - 1) * eased;
      break;
    case 'tracking':
      tx = dist * eased;
      sc = 1 + 0.05 * Math.sin(eased * Math.PI);
      break;
    case 'dollyIn':
      sc = 1 + (scaleVal - 1) * eased;
      tx = dist * 0.1 * eased;
      break;
    case 'dollyOut':
      sc = 1 - (1 - 1 / scaleVal) * eased;
      tx = -dist * 0.1 * eased;
      break;
    case 'diagUL':
      tx = -dist * 0.7 * eased;
      ty = -dist * 0.7 * eased;
      break;
    case 'diagDR':
      tx = dist * 0.7 * eased;
      ty = dist * 0.7 * eased;
      break;
    case 'shake': {
      const shakeDecay = 1 - eased;
      tx = (Math.sin(elapsedMs * 0.05) * 0.5 + Math.sin(elapsedMs * 0.03) * 0.5) * dist * shakeDecay;
      ty = (Math.cos(elapsedMs * 0.04) * 0.5 + Math.sin(elapsedMs * 0.06) * 0.3) * dist * shakeDecay;
      rot = (Math.sin(elapsedMs * 0.07) * 0.5) * 5 * shakeDecay;
      break;
    }
    case 'ease':
      tx = dist * eased;
      break;
    case 'zoomPunch':
      if (eased < 0.3) {
        sc = 1 + (scaleVal - 1) * (eased / 0.3);
      } else {
        sc = scaleVal - (scaleVal - 1) * ((eased - 0.3) / 0.7);
      }
      break;
    case 'slowPan':
      tx = dist * eased * 0.3;
      ty = -dist * 0.1 * eased;
      sc = 1 + 0.05 * eased;
      break;
    case 'panZoom':
      tx = dist * eased;
      sc = 1 + (scaleVal - 1) * eased;
      break;
    case 'orbitShake': {
      rotY = eased * 360;
      const osShake = (1 - eased) * 15;
      rotX = Math.sin(elapsedMs * 0.008) * osShake;
      rot = Math.sin(elapsedMs * 0.01) * 8 * (1 - eased);
      sc = 0.7 + 0.3 * Math.abs(Math.cos(eased * Math.PI * 2));
      break;
    }
    case 'slideSpin':
      tx = dist * 0.7 * eased;
      ty = dist * 0.3 * eased;
      rotY = eased * 360;
      sc = 0.7 + (scaleVal - 0.7) * 0.5 * eased;
      break;
    case 'camOrbit': {
      use3D = true;
      camYaw = eased * 360;
      camZ = 0;
      break;
    }
    case 'camOrbitCW': {
      use3D = true;
      camYaw = -eased * 360;
      camZ = 0;
      break;
    }
    case 'camOrbitTilt': {
      use3D = true;
      camYaw = eased * 360;
      camPitch = Math.sin(eased * Math.PI * 4) * 30;
      camZ = 0;
      break;
    }
    case 'camDollyIn': {
      use3D = true;
      camZ = -500 * eased;
      break;
    }
    case 'camDollyOut': {
      use3D = true;
      camZ = 500 * eased;
      break;
    }
    case 'camPushIn': {
      use3D = true;
      camZ = -800 * eased;
      camPitch = Math.sin(eased * Math.PI) * 5;
      break;
    }
    case 'camPullOut': {
      use3D = true;
      camZ = 800 * eased;
      camYaw = Math.sin(eased * Math.PI) * 10;
      break;
    }
    case 'camPanLeft': {
      use3D = true;
      camYaw = -dist * 0.1 * eased;
      camZ = 0;
      break;
    }
    case 'camPanRight': {
      use3D = true;
      camYaw = dist * 0.1 * eased;
      camZ = 0;
      break;
    }
    case 'camTiltUp': {
      use3D = true;
      camPitch = -dist * 0.1 * eased;
      camZ = 0;
      break;
    }
    case 'camTiltDown': {
      use3D = true;
      camPitch = dist * 0.1 * eased;
      camZ = 0;
      break;
    }
    case 'camRoll': {
      use3D = true;
      camRoll = eased * 360;
      camZ = 0;
      break;
    }
    case 'camSpiral': {
      use3D = true;
      camYaw = eased * 720;
      camPitch = Math.sin(eased * Math.PI * 4) * 20;
      camZ = -600 * eased;
      break;
    }
    case 'camFlyThrough': {
      use3D = true;
      camYaw = Math.sin(eased * Math.PI * 2) * 45;
      camPitch = Math.sin(eased * Math.PI * 4) * 20;
      camZ = -1000 * eased;
      break;
    }
    case 'camOrbitZoom': {
      use3D = true;
      camYaw = eased * 360;
      camZ = -400 * eased;
      break;
    }
    case 'camShake3D': {
      use3D = true;
      const shakeDecay = 1 - eased;
      camX = (Math.sin(elapsedMs * 0.05) * 0.5 + Math.sin(elapsedMs * 0.03) * 0.5) * 50 * shakeDecay;
      camY = (Math.cos(elapsedMs * 0.04) * 0.5 + Math.sin(elapsedMs * 0.06) * 0.3) * 50 * shakeDecay;
      camZ = (Math.sin(elapsedMs * 0.03) * 0.5) * 100 * shakeDecay;
      camPitch = (Math.sin(elapsedMs * 0.07) * 0.5) * 5 * shakeDecay;
      camYaw = (Math.cos(elapsedMs * 0.05) * 0.5) * 5 * shakeDecay;
      camRoll = (Math.sin(elapsedMs * 0.08) * 0.5) * 3 * shakeDecay;
      break;
    }
    case 'camCraneUp': {
      use3D = true;
      camY = -500 * eased;
      camZ = 300 * eased;
      camPitch = -30 * eased;
      break;
    }
    case 'camCraneDown': {
      use3D = true;
      camY = 500 * eased;
      camZ = -300 * eased;
      camPitch = 30 * eased;
      break;
    }
    case 'camTruckLeft': {
      use3D = true;
      camX = -600 * eased;
      break;
    }
    case 'camTruckRight': {
      use3D = true;
      camX = 600 * eased;
      break;
    }
    // 新增 10 个 3D 环绕运镜 — 文字块在中间不动，镜头环绕文字块
    case 'camOrbitEllipse': {
      // 椭圆环绕（宽椭圆 + 俯仰微调）
      use3D = true;
      const angle = eased * Math.PI * 2;
      camYaw = Math.cos(angle) * 180;
      camPitch = Math.sin(angle * 2) * 25;
      camZ = Math.sin(angle) * 200;
      break;
    }
    case 'camOrbitWave': {
      // 波浪环绕（横向环绕 + 纵向波浪位移）
      use3D = true;
      camYaw = eased * 360;
      camPitch = Math.sin(eased * Math.PI * 4) * 35;
      camY = Math.sin(eased * Math.PI * 2) * 150;
      break;
    }
    case 'camOrbitFigure8': {
      // 8字环绕（横 8 路径 + 轻微俯仰）
      use3D = true;
      camYaw = Math.sin(eased * Math.PI * 2) * 270;
      camPitch = Math.sin(eased * Math.PI * 4) * 20;
      camX = Math.sin(eased * Math.PI * 4) * 200;
      break;
    }
    case 'camOrbitTumble': {
      // 翻滚环绕（环绕 + 持续俯仰翻滚）
      use3D = true;
      camYaw = eased * 360;
      camPitch = eased * 360;
      camZ = -300 * eased;
      break;
    }
    case 'camOrbitDrop': {
      // 俯冲环绕（Z 推进 + 弧形俯仰下落）
      use3D = true;
      camZ = -500 * (1 - eased);
      camYaw = eased * 180;
      camPitch = Math.sin(eased * Math.PI) * 40;
      break;
    }
    case 'camOrbitZoomEllipse': {
      // 椭圆缩放环绕（椭圆路径 + Z 纵深推进）
      use3D = true;
      const ze = eased * Math.PI * 2;
      camYaw = Math.cos(ze) * 180;
      camZ = Math.sin(ze) * 300 - 200 * eased;
      camPitch = Math.sin(ze * 2) * 15;
      break;
    }
    case 'camOrbitPan': {
      // 平扫环绕（大角度环绕 + 横向平移）
      use3D = true;
      camYaw = eased * 270;
      camX = Math.sin(eased * Math.PI) * 300;
      camPitch = Math.sin(eased * Math.PI * 2) * 20;
      break;
    }
    case 'camOrbitCrane': {
      // 升降环绕（Z 升降 + 俯仰微调）
      use3D = true;
      camYaw = eased * 360;
      camZ = Math.sin(eased * Math.PI) * 400;
      camPitch = Math.sin(eased * Math.PI * 2) * 30;
      break;
    }
    case 'camOrbitSway': {
      // 摇摆环绕（yaw 摇摆 + pitch 缓慢摆动）
      use3D = true;
      camYaw = Math.sin(eased * Math.PI * 4) * 120;
      camPitch = Math.sin(eased * Math.PI * 2) * 50;
      camRoll = Math.sin(eased * Math.PI * 3) * 15;
      break;
    }
    case 'camOrbitDolly': {
      // 推拉环绕（推进 + 小幅环绕摆动）
      use3D = true;
      camZ = -400 * eased;
      camYaw = Math.sin(eased * Math.PI * 3) * 60;
      camPitch = Math.sin(eased * Math.PI) * 20;
      break;
    }
  }
  
  return { tx, ty, sc, rot, rotX, rotY, camX, camY, camZ, camPitch, camYaw, camRoll, use3D };
}

function updateBgMotions(elapsed, initTX, initTY, initScale, initRotate, initRotateX, initRotateY) {
  let totalTX = 0;
  let totalTY = 0;
  let totalScale = 1;
  let totalRot = 0;
  let totalRotX = 0;
  let totalRotY = 0;
  let totalCamX = 0;
  let totalCamY = 0;
  let totalCamZ = 0;
  let totalCamPitch = 0;
  let totalCamYaw = 0;
  let totalCamRoll = 0;
  let use3DCam = false;
  
  const elapsedMs = elapsed * 1000;
  
  activeBgMotions.forEach(m => {
    const animElapsed = elapsed - m.startTime;
    if (animElapsed < 0) return;
    const t = Math.min(animElapsed / m.duration, 1);
    const offset = calcMotionOffset(m.motion, t, m.dist, m.scaleVal, elapsedMs);
    totalTX += offset.tx;
    totalTY += offset.ty;
    totalScale *= offset.sc;
    totalRot += offset.rot;
    totalRotX += offset.rotX;
    totalRotY += offset.rotY;
    if (offset.use3D) {
      use3DCam = true;
      totalCamX += offset.camX;
      totalCamY += offset.camY;
      totalCamZ += offset.camZ;
      totalCamPitch += offset.camPitch;
      totalCamYaw += offset.camYaw;
      totalCamRoll += offset.camRoll;
    }
  });
  
  if (use3DCam) {
    cameraPitch = totalCamPitch;
    cameraYaw = totalCamYaw;
    cameraRoll = totalCamRoll;
    cameraDistance = 1000 + totalCamZ;
    updateOrbitCamera();
  } else {
    cameraX = 0;
    cameraY = 0;
    cameraZ = 1000;
    cameraPitch = 0;
    cameraYaw = 0;
    cameraRoll = 0;
    viewTranslateX = initTX + totalTX;
    viewTranslateY = initTY + totalTY;
    viewScale = initScale * totalScale;
    viewRotate = initRotate + totalRot;
    viewRotateX = (initRotateX || 0) + totalRotX;
    viewRotateY = (initRotateY || 0) + totalRotY;
  }
  applyTransform();
}

function zoomCanvas(factor) {
  const newScale = Math.max(0.2, Math.min(5, viewScale * factor));
  const oldScale = viewScale;
  viewScale = newScale;
  
  const previewRect = previewContainer.getBoundingClientRect();
  const canvasCenterX = previewRect.width / 2;
  const canvasCenterY = previewRect.height / 2;
  
  viewTranslateX = canvasCenterX - (canvasCenterX - viewTranslateX) * (newScale / oldScale);
  viewTranslateY = canvasCenterY - (canvasCenterY - viewTranslateY) * (newScale / oldScale);
  
  applyTransform();
  showTip(`缩放: ${Math.round(viewScale * 100)}%`);
}

function resetCanvasZoom() {
  const contentLayerEl = document.getElementById('contentLayer');
  if (!contentLayerEl) {
    viewScale = 1;
    viewTranslateX = 0;
    viewTranslateY = 0;
    applyTransform();
    showTip('已重置缩放');
    return;
  }
  
  const rect = contentLayerEl.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    const scaleRatio = Math.min(rect.width / BASE_WIDTH, rect.height / BASE_HEIGHT);
    viewScale = scaleRatio;
    viewTranslateX = (rect.width - BASE_WIDTH * viewScale) / 2;
    viewTranslateY = (rect.height - BASE_HEIGHT * viewScale) / 2;
    applyTransform();
    if (typeof updateBgImagesContainerTransform === 'function') {
      updateBgImagesContainerTransform();
    }
    if (typeof updateVideosContainerTransform === 'function') {
      updateVideosContainerTransform();
    }
    showTip(`缩放: ${Math.round(viewScale * 100)}%`);
  }
}

function showAboutModal() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;
    z-index: 1000;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: var(--color-bg-surface, #1e2030); border-radius: 12px;
    width: 560px; max-width: 90vw; overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  `;
  
  content.innerHTML = `
    <div style="display: flex;">
      <div style="width: 200px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center;">
        <svg width="80" height="80" viewBox="0 0 20 20" fill="none">
          <path d="M4 4 L4 16 L16 16 L16 8 L10 2 L4 8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7 11 L13 11 M7 13 L13 13" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>
      <div style="flex: 1; padding: 24px;">
        <h2 style="margin:0; font-size: 20px; font-weight: 600; color: var(--color-text-primary, #fff);">字漫画</h2>
        <p style="margin: 8px 0 0; font-size: 12px; color: var(--color-text-secondary, #999);">Version 1.0.0</p>
        <div style="margin-top: 16px; font-size: 13px; color: var(--color-text-secondary, #999); line-height: 1.6;">
          <p>字漫画是一款专业的文字动画创作工具，让文字动起来！</p>
          <p>支持多种动画效果：入场动画、预设动画、路径动画、3D动画、位移动画等。</p>
          <p>导出高质量视频，适用于短视频、广告、教育等多种场景。</p>
        </div>
        <button id="closeAboutBtn" style="margin-top: 20px; padding: 8px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">确定</button>
      </div>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  document.getElementById('closeAboutBtn').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

document.addEventListener('mousemove', (e) => {
  // 文字块拖拽
  if (dragState.isDragging) {
    const dx = (e.clientX - dragState.startX) / viewScale;
    const dy = (e.clientY - dragState.startY) / viewScale;
    
    // 收集所有需要移动的块（使用 Map 避免重复）
    const blocksToMove = new Map();
    
    // 首先添加所有选中块的原始位置
    selectedBlocks.forEach((b, i) => {
      if (!blocksToMove.has(b)) {
        blocksToMove.set(b, dragState.origPositions[i]);
      }
    });
    
    // 如果选中的是组合中的块，也移动整个组合
    selectedBlocks.forEach(b => {
      const group = findGroupByBlock(b);
      if (group) {
        group.blocks.forEach(gb => {
          if (!blocksToMove.has(gb.block)) {
            blocksToMove.set(gb.block, {
              left: parseInt(gb.block.style.left) || 0,
              top: parseInt(gb.block.style.top) || 0
            });
          }
        });
      }
    });
    
    // 移动所有块
    blocksToMove.forEach((origPos, b) => {
      b.style.left = (origPos.left + dx) + 'px';
      b.style.top = (origPos.top + dy) + 'px';
    });
    
    return;
  }
  
  if (!isBgDragging) return;
  
  const dx = e.clientX - bgDragStartX;
  const dy = e.clientY - bgDragStartY;
  
  viewTranslateX += dx;
  viewTranslateY += dy;
  
  bgDragStartX = e.clientX;
  bgDragStartY = e.clientY;
  
  applyTransform();
});

document.addEventListener('mouseup', () => {
  // 文字块拖拽结束
  if (dragState.isDragging) {
    dragState.isDragging = false;
    return;
  }
  
  if (isBgDragging) {
    isBgDragging = false;
    previewContainer.style.cursor = 'default';
  }
});

// 选中文字块缩放（滚轮）
previewContainer.addEventListener('wheel', (e) => {
  if (selectedBlocks.length > 0 && e.target.closest('.text-block') && !e.target.classList.contains('edit-input')) {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? -5 : 5;
    const firstBlock = selectedBlocks[0];
    const currentSize = parseInt(firstBlock.style.fontSize) || 50;
    const newSize = Math.max(12, Math.min(1000, currentSize + delta));
    
    // 更新所有选中块的字体大小
    selectedBlocks.forEach(block => {
      block.style.fontSize = newSize + 'px';
      const editInput = block.querySelector('.edit-input');
      if (editInput) {
        editInput.style.fontSize = newSize + 'px';
      }
      const blockData = blocks.find(b => b.block === block);
      if (blockData) {
        blockData.fontSize = newSize;
      }
    });
    
    fontSize.value = newSize;
    fsNum.value = newSize;
  }
}, { passive: false });

// 更新语种按钮
function refreshLangBtn(){
  langBtn.innerText = useCantonese ? "粤" : "CN";
  langBtn.classList.toggle('active', useCantonese);
}
langBtn.onclick = ()=>{
  useCantonese = !useCantonese;
  refreshLangBtn();
  if(isVoiceListening) restartVoice();
  showTip(useCantonese?"已切换粤语":"已切换普通话");
};

// 标点切换按钮
function refreshPuncBtn(){
  puncBtn.innerText = keepPunc ? "punct." : "punct.";
  puncBtn.classList.toggle('active', keepPunc);
}
puncBtn.onclick = ()=>{
  keepPunc = !keepPunc;
  refreshPuncBtn();
  showTip(keepPunc?"开启标点保留":"去除所有标点");
};

// 更新选中文字块
customText.oninput = () => {
  selectedBlocks.forEach(block => {
    block.querySelector('.text-content').textContent = customText.value;
    block.querySelector('.edit-input').value = customText.value;
  });
};

fontSize.oninput = () => {
  fsNum.value = fontSize.value;
  selectedBlocks.forEach(block => {
    block.style.fontSize = fontSize.value + 'px';
    const editInput = block.querySelector('.edit-input');
    if (editInput) {
      editInput.style.fontSize = fontSize.value + 'px';
    }
    const blockData = blocks.find(b => b.block === block);
    if (blockData) {
      blockData.fontSize = parseInt(fontSize.value);
    }
  });
};

fsNum.oninput = () => {
  const val = Math.max(12, Math.min(1000, parseInt(fsNum.value) || 50));
  fontSize.value = val;
  fsNum.value = val;
  selectedBlocks.forEach(block => {
    block.style.fontSize = val + 'px';
    const editInput = block.querySelector('.edit-input');
    if (editInput) {
      editInput.style.fontSize = val + 'px';
    }
    const blockData = blocks.find(b => b.block === block);
    if (blockData) {
      blockData.fontSize = val;
    }
  });
};

textColor.oninput = () => {
  selectedBlocks.forEach(block => {
    block.style.color = textColor.value;
    const editInput = block.querySelector('.edit-input');
    if (editInput) {
      editInput.style.color = textColor.value;
    }
  });
};

bgColor.oninput = () => {
  selectedBlocks.forEach(block => {
    block.style.backgroundColor = bgColor.value;
    const editInput = block.querySelector('.edit-input');
    if (editInput) {
      editInput.style.backgroundColor = bgColor.value;
    }
    const textContent = block.querySelector('.text-content');
    if (textContent) {
      textContent.style.backgroundColor = bgColor.value;
    }
  });
  if (selectedBlocks.length === 0) {
    contentLayer.style.backgroundColor = bgColor.value;
    previewContainer.style.backgroundColor = bgColor.value;
  }
};

rotate.oninput = () => {
  const angle = rotate.value;
  rotateNum.value = angle;
  selectedBlocks.forEach(block => {
    if (isAnimPlaying) {
      // 动画播放中，更新动画变换
      const animType = animSelect.value;
      applyAnimatedTransform(block, animType);
      updateBlockAnimation(block);
    } else {
      // 非播放状态，应用静态变换
      applyStaticTransform(block);
    }
  });
};

rotateNum.oninput = () => {
  const val = Math.max(-180, Math.min(180, parseInt(rotateNum.value) || 0));
  rotate.value = val;
  rotateNum.value = val;
  selectedBlocks.forEach(block => {
    if (isAnimPlaying) {
      const animType = animSelect.value;
      applyAnimatedTransform(block, animType);
      updateBlockAnimation(block);
    } else {
      applyStaticTransform(block);
    }
  });
};

flipXBtn.onclick = () => {
  if (selectedBlocks.length === 0 && selectedBgImageId === null && selectedVideoId === null) {
    showTip('请先选中文字块、图片或视频');
    return;
  }
  const isFlipped = selectedBlocks[0].dataset.flipped === 'true';
  selectedBlocks.forEach(block => {
    block.dataset.flipped = !isFlipped;
    if (isAnimPlaying) {
      const animType = animSelect.value;
      applyAnimatedTransform(block, animType);
      updateBlockAnimation(block);
    } else {
      applyStaticTransform(block);
    }
  });
  flipXBtn.classList.toggle('active', !isFlipped);
  showTip(isFlipped ? '已取消水平翻转' : '已水平翻转');
};

flipYBtn.onclick = () => {
  if (selectedBlocks.length === 0 && selectedBgImageId === null && selectedVideoId === null) {
    showTip('请先选中文字块、图片或视频');
    return;
  }
  const isFlippedY = selectedBlocks[0].dataset.flippedY === 'true';
  selectedBlocks.forEach(block => {
    block.dataset.flippedY = !isFlippedY;
    if (isAnimPlaying) {
      const animType = animSelect.value;
      applyAnimatedTransform(block, animType);
      updateBlockAnimation(block);
    } else {
      applyStaticTransform(block);
    }
  });
  flipYBtn.classList.toggle('active', !isFlippedY);
  showTip(isFlippedY ? '已取消垂直翻转' : '已垂直翻转');
};

verticalBtn.onclick = () => {
  if (selectedBlocks.length === 0 && selectedBgImageId === null && selectedVideoId === null) {
    showTip('请先选中文字块、图片或视频');
    return;
  }
  const isVertical = selectedBlocks[0].classList.contains('vertical');
  selectedBlocks.forEach(block => {
    block.classList.toggle('vertical');
  });
  const textEl = verticalBtn.querySelector('.btn-text');
  if (textEl) textEl.textContent = isVertical ? '竖排' : '横排';
  verticalBtn.classList.toggle('active', !isVertical);
  showTip(isVertical ? '已切换为横排' : '已切换为竖排');
};

wght.oninput = () => {
  const newWeight = +wght.value;
  wNum.value = newWeight;
  
  selectedBlocks.forEach(block => {
    block.style.fontVariationSettings = `'wght' ${newWeight}`;
    const editInput = block.querySelector('.edit-input');
    if (editInput) {
      editInput.style.fontVariationSettings = `'wght' ${newWeight}`;
    }
    const blockData = blocks.find(b => b.block === block);
    if (blockData) blockData.weight = newWeight;
  });
};

wNum.oninput = () => {
  const val = parseInt(wNum.value);
  // 如果输入的是有效数字，更新滑块和文字块
  if (!isNaN(val)) {
    // 暂时允许任何数字输入（包括小于100或大于900）
    // 范围验证将在 blur 事件中处理
    wght.value = Math.max(100, Math.min(900, val));
    selectedBlocks.forEach(block => {
      // 使用限制在范围内的值
      const clampedVal = Math.max(100, Math.min(900, val));
      block.style.fontVariationSettings = `'wght' ${clampedVal}`;
      const editInput = block.querySelector('.edit-input');
      if (editInput) {
        editInput.style.fontVariationSettings = `'wght' ${clampedVal}`;
      }
      const blockData = blocks.find(b => b.block === block);
      if (blockData) blockData.weight = clampedVal;
    });
  } else if (wNum.value === '') {
    // 如果输入框为空，不做任何操作
  }
};

// 失焦时进行范围验证
wNum.onblur = () => {
  const val = parseInt(wNum.value);
  if (isNaN(val) || val < 100 || val > 900) {
    // 如果输入无效或超出范围，恢复为滑块的当前值
    wNum.value = wght.value;
  }
};

async function loadFontByName(fontFile) {
  const fontFamily = fontFile.replace('.ttf', '').replace('.woff2', '').replace('.otf', '');
  console.log('尝试加载字体:', fontFile, '-> fontFamily:', fontFamily);
  if (loadedFonts[fontFamily]) {
    console.log('字体已缓存:', fontFamily);
    return fontFamily;
  }
  try {
    const font = new FontFace(fontFamily, `url(${fontFile})`);
    await font.load();
    document.fonts.add(font);
    loadedFonts[fontFamily] = true;
    // 等待字体真正可用
    await document.fonts.ready;
    console.log('✅ 字体加载成功:', fontFamily);
    showTip('✅ 字体加载成功');
    return fontFamily;
  } catch (e) {
    console.error('❌ 字体加载失败:', fontFile, e);
    showTip('❌ 字体加载失败');
    return null;
  }
}

fontSelect.onchange = async () => {
  const fontFamily = await loadFontByName(fontSelect.value);
  if (selectedBlocks.length > 0 && fontFamily) {
    selectedBlocks.forEach(block => {
      block.style.fontFamily = `'${fontFamily}'`;
      const editInput = block.querySelector('.edit-input');
      if (editInput) {
        editInput.style.fontFamily = `'${fontFamily}'`;
      }
      const blockData = blocks.find(b => b.block === block);
      if (blockData) {
        blockData.fontName = fontFamily;
      }
    });
    showTip('已切换字体: ' + fontFamily);
  }
};

// 页面加载时默认加载第一个字体并创建初始文字块
async function init() {
  console.log('初始化开始...');
  console.log('fontSelect.value:', fontSelect.value);
  
  if (typeof AnimPluginLoader !== 'undefined') {
    AnimPluginLoader.loadBuiltinPlugins().then(() => {
      console.log('动画插件加载完成');
      if (typeof initComicPanel === 'function') {
        initComicPanel();
      }
    }).catch(e => {
      console.warn('动画插件加载失败:', e);
    });
  }
  
  const fontFamily = await loadFontByName(fontSelect.value);
  console.log('字体加载结果:', fontFamily);
  
  if (fontFamily) {
    const weightVal = parseInt(wght.value) || 400;
    console.log('开始创建文字块...');
    
    // 确保字体完全渲染
    await document.fonts.ready;
    
    // 创建临时元素来计算文字宽度（样式与实际文字块一致）
    const tempDiv = document.createElement('div');
    tempDiv.style.fontSize = '100px';
    tempDiv.style.fontFamily = `'${fontFamily}'`;
    tempDiv.style.fontVariationSettings = `'wght' ${weightVal}`;
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.style.lineHeight = '1';
    tempDiv.style.padding = '0';
    tempDiv.style.margin = '0';
    tempDiv.style.border = 'none';
    tempDiv.style.boxSizing = 'content-box';
    tempDiv.textContent = '传颂体';
    document.body.appendChild(tempDiv);
    const textWidth = tempDiv.offsetWidth;
    const textHeight = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);
    
    // 计算左上角坐标（使其居中）
    const left = BASE_WIDTH / 2 - textWidth / 2;
    const top = BASE_HEIGHT / 2 - textHeight / 2;
    
    const block = await createBlock(left, top, '绚丽文字', 100, '#111111', fontFamily, weightVal);
    console.log('文字块创建完成:', block);
    console.log('blocks数组:', blocks);
  } else {
    console.error('字体加载失败，无法创建文字块');
    
    // 创建临时元素来计算文字宽度
    const tempDiv = document.createElement('div');
    tempDiv.style.fontSize = '100px';
    tempDiv.style.fontFamily = 'system-ui';
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.style.lineHeight = '1';
    tempDiv.textContent = '传颂体';
    document.body.appendChild(tempDiv);
    const textWidth = tempDiv.offsetWidth;
    const textHeight = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);
    
    // 计算左上角坐标（使其居中）
    const left = BASE_WIDTH / 2 - textWidth / 2;
    const top = BASE_HEIGHT / 2 - textHeight / 2;
    
    const block = await createBlock(left, top, '传颂体', 100, '#111111', 'system-ui', 400);
  }
}

// 菜单栏切换功能
const togglePanel = document.getElementById('togglePanel');
const presetToggleBtn = document.getElementById('presetToggleBtn');
const comicToggleBtn = document.getElementById('comicToggleBtn');
const settingsPanel = document.getElementById('settingsPanel');
const presetPanel = document.getElementById('presetPanel');
const comicPanel = document.getElementById('comicPanel');
const castPanel = document.getElementById('castPanel');
const castItems = document.getElementById('castItems');
const castToggleBtn = document.getElementById('castToggleBtn');
const collapseLeftBtn = document.getElementById('collapseLeftBtn');
const zimanhuaToggleBtn = document.getElementById('zimanhuaToggleBtn');
const zimanhuaPanel = document.getElementById('zimanhuaPanel');

// 字漫画时间轴
let blockAnimations = {}; // 存储每个文字块的动画 { blockId: [{type, anim, startTime, duration}] }
let isPlaying = false;
let playStartTime = 0;
let playAnimationId = null;



const timelineRuler = document.getElementById('timelineRuler');
const keyframesTracks = document.getElementById('keyframesTracks');
const playKeyframesBtn = document.getElementById('playKeyframesBtn');
const nextSlideBtn = document.getElementById('nextSlideBtn');
const prevSlideBtn = document.getElementById('prevSlideBtn');
const exportVideoBtn = document.getElementById('exportVideoBtn');
const exportGifBtn = document.getElementById('exportGifBtn');
const expandTimelineBtn = document.getElementById('expandTimelineBtn');
const quickAddAnimBtn = document.getElementById('quickAddAnimBtn');
const timelinePlayhead = document.getElementById('timelinePlayhead');
let currentTimelineTime = 0; // 当前时间轴选择位置（秒）
let hasSelectedTime = false; // 是否由用户显式点击选择了时间位置
const LABEL_OFFSET = 80 + 8 + 4; // .track-label(width) + gap + .track-row(padding-left)

// 全局时间轴拖动状态（避免监听器累积）
let timelineDragState = {
  type: null, // 'text' | 'bg' | 'video' | 'bgAnim' | 'textAnim' | 'videoAnim' | 'bgItem' | 'videoItem'
  active: false,
  startY: 0,
  startX: 0,
  startIndex: 0,
  blockId: null,
  animIndex: -1,
  startTime: 0,
  duration: 0,
  startTimes: [],
  needSelect: false,
  currentDropTarget: null,
  insertAfter: false,
  onMouseMove: null,
  onMouseUp: null
};

// 修改动画弹窗相关
const editAnimModal = document.getElementById('editAnimModal');
const closeEditAnimModal = document.getElementById('closeEditAnimModal');
const cancelEditAnim = document.getElementById('cancelEditAnim');
const confirmEditAnim = document.getElementById('confirmEditAnim');
const editAnimEffectButtons = document.getElementById('editAnimEffectButtons');
const editAnimStartTime = document.getElementById('editAnimStartTime');
const editAnimDuration = document.getElementById('editAnimDuration');
const animTypeBtns = document.querySelectorAll('.anim-type-btn');

// 背景层动画弹窗相关
const bgAnimModal = document.getElementById('bgAnimModal');
const closeBgAnimModal = document.getElementById('closeBgAnimModal');
const cancelBgAnim = document.getElementById('cancelBgAnim');
const confirmBgAnim = document.getElementById('confirmBgAnim');
const bgMoveDistance = document.getElementById('bgMoveDistance');
const bgScaleValue = document.getElementById('bgScaleValue');
const bgStartTime = document.getElementById('bgStartTime');
const bgDuration = document.getElementById('bgDuration');
const bgAnimBtn = document.getElementById('bgAnimBtn');

const motionLabels = {
  left: '左移', right: '右移', up: '上移', down: '下移', none: '不移',
  zoomIn: '放大', zoomOut: '缩小', noneScale: '无缩放',
  orbit: '环绕', orbitCW: '顺时针环绕', orbitCCW: '逆时针环绕',
  orbitZoomIn: '环绕推进', orbitZoomOut: '环绕拉远',
  orbitTilt: '倾斜环绕', orbitDouble: '双圈环绕',
  orbitFlipX: '翻转环绕', orbitFlipY: '俯仰环绕', orbitSpiral: '螺旋上升',
  orbitRoll: '滚筒环绕', orbitDolly: '远近环绕', orbitPendulum: '摆锤环绕',
  rollLeft: '左歪', rollRight: '右歪', spin: '回旋旋转',
  tracking: '横移跟随', dollyIn: '纵深推进', dollyOut: '纵深拉远',
  diagUL: '↖斜滑', diagDR: '斜滑↘',
  shake: '震动', ease: '缓入缓出', zoomPunch: '急冲急停', slowPan: '慢速漫游',
  panZoom: '平移+缩放', orbitShake: '环绕+震动', slideSpin: '斜滑+旋转'
};
function getBgAnimLabel(anim) {
  if (anim.motion && motionLabels[anim.motion]) {
    return motionLabels[anim.motion];
  }
  let labelText = '';
  if (anim.dir !== 'none' && bgDirLabels[anim.dir]) labelText += bgDirLabels[anim.dir];
  if (anim.scale !== 'none' && bgScaleLabels[anim.scale]) labelText += (labelText ? '+' : '') + bgScaleLabels[anim.scale];
  if (!labelText) labelText = '镜头运镜';
  return labelText;
}
const bgDirLabels = { left: '左移', right: '右移', up: '上移', down: '下移' };
const bgScaleLabels = { 'in': '放大', out: '缩小' };

// 播放前的初始视图状态（停止时恢复）
let playbackInitialViewState = null;

// 当前正在编辑的动画
let editingAnim = null; // { blockId, index }
let editingSelectedAnims = []; // 已选动画列表，每个动画单独存储时间
let currentPresetCategoryIndex = 0; // 当前选中的预设动画分类索引

// 动画效果列表
const animEffects = {
  in: [
    { name: '淡入', value: 'fadeIn' },
    { name: '左移入', value: 'slideLeft' },
    { name: '右移入', value: 'slideRight' },
    { name: '上移入', value: 'slideUp' },
    { name: '下移入', value: 'slideDown' },
    { name: '缩放', value: 'scaleIn' },
    { name: '旋转', value: 'rotateIn' },
    { name: '弹跳', value: 'bounceIn' }
  ],
  path: [
    { name: '手绘路径', value: 'drawPath' }
  ],
  preset: [
    { name: '静态', value: 'static' },
    { name: '抖动', value: 'shake' },
    { name: '倒下', value: 'fall' },
    { name: '跳高', value: 'jump' },
    { name: '跑步', value: 'run' },
    { name: '行走', value: 'walk' },
    { name: '旋转', value: 'spin' },
    { name: '闪烁', value: 'blink' },
    { name: '放大缩小', value: 'pulse' },
    { name: '左右摇摆', value: 'sway' },
    { name: '弹跳', value: 'bounce' },
    { name: '飘动', value: 'float' },
    { name: '震动', value: 'vibrate' },
    { name: '滑动', value: 'slide' },
    { name: '缩放', value: 'zoom' },
    { name: '摇摆', value: 'swing' },
    { name: '俯冲', value: 'dive' },
    { name: '上升', value: 'rise' },
    { name: '冲刺', value: 'dash' },
    { name: '呼吸', value: 'breathe' },
    { name: '闪烁抖动', value: 'flicker' },
    { name: '挥手', value: 'wave' },
    { name: '鼓掌', value: 'clap' },
    { name: '点头', value: 'nod' },
    { name: '摇头', value: 'shakehead' },
    { name: '奔跑', value: 'run2' },
    { name: '飞翔', value: 'fly' },
    { name: '爬行', value: 'crawl' },
    { name: '跳跃', value: 'jump2' },
    { name: '摇摆走', value: 'waddle' },
    { name: '伸展', value: 'stretch' },
    { name: '睡觉', value: 'sleep' },
    { name: '吃东西', value: 'eat' },
    { name: '踢腿', value: 'legKick' },
    { name: '踮脚', value: 'footTap' },
    { name: '摆腿', value: 'legSwing' },
    { name: '扭胯', value: 'hipShake' },
    { name: '屈膝', value: 'kneeBend' },
    { name: '脚晃', value: 'footWiggle' },
    { name: '踏步', value: 'legMarch' },
    { name: '扭腰', value: 'hipTwist' },
    { name: '跺脚', value: 'footStomp' },
    { name: '伸腿', value: 'legStretch' },
    { name: '大力踢', value: 'bigKick' },
    { name: '重踏', value: 'stompHard' },
    { name: '狂扭胯', value: 'shakeHip' },
    { name: '高抬腿', value: 'highStep' },
    { name: '狂扭腰', value: 'twistWaist' },
    { name: '跳脚', value: 'jumpFeet' },
    { name: '狂摆腿', value: 'wiggleLeg' },
    { name: '滑脚', value: 'slideFeet' },
    { name: '蹲弹', value: 'squatBounce' },
    { name: '分腿', value: 'splitLegs' },
    { name: '疯狂踢', value: 'crazyKick' },
    { name: '狂野踏', value: 'wildStomp' },
    { name: '疯摆胯', value: 'hipSwing' },
    { name: '疯甩腿', value: 'legFling' },
    { name: '疯跳舞', value: 'crazyDance' },
    { name: '跳分裂', value: 'jumpSplit' },
    { name: '腿颤抖', value: 'legShake' },
    { name: '蹲踢', value: 'squatKick' },
    { name: '扭跳', value: 'twistJump' },
    { name: '狂滑动', value: 'wildSlide' },
    { name: '下半摆', value: 'bottomSwing' },
    { name: '下半抖', value: 'bottomShake' },
    { name: '下半弹', value: 'bottomBounce' },
    { name: '下半旋', value: 'bottomSpin' },
    { name: '下半缩', value: 'bottomScale' },
    { name: '下半滑', value: 'bottomSlide' },
    { name: '下半屈', value: 'bottomBend' },
    { name: '下半甩', value: 'bottomFling' },
    { name: '下半颤', value: 'bottomVibrate' },
    { name: '下半摇', value: 'bottomSway' },
    { name: '3D翻转', value: 'flip3D' },
    { name: '3D旋转Y', value: 'rotate3DY' },
    { name: '3D旋转X', value: 'rotate3DX' },
    { name: '3D摆动', value: 'swing3D' },
    { name: '3D缩放', value: 'zoom3D' },
    { name: '3D自旋', value: 'spin3D' },
    { name: '3D倾斜', value: 'tilt3D' },
    { name: '3D弹跳', value: 'bounce3D' },
    { name: '3D扭曲', value: 'twist3D' },
    { name: '3D滚动', value: 'roll3D' },
    { name: '3D爆炸', value: 'explode3D' },
    { name: '3D收缩', value: 'implode3D' },
    { name: '3D螺旋', value: 'spiral3D' },
    { name: '3D狂晃', value: 'wobble3D' },
    { name: '3D翻出', value: 'flipOut3D' },
    { name: '3D震动', value: 'shake3D' },
    { name: '3D脉冲', value: 'pulse3D' },
    { name: '3D狂摆', value: 'swingWild3D' },
    { name: '3D狂缩', value: 'zoomCrazy3D' },
    { name: '3D狂转', value: 'rotateCrazy3D' },
    { name: '挥手', value: 'armWave' },
    { name: '摆臂', value: 'armSwing' },
    { name: '举臂', value: 'armRaise' },
    { name: '耸肩', value: 'shoulderShrug' },
    { name: '抖肩', value: 'shoulderShake' },
    { name: '手指点', value: 'fingerTap' },
    { name: '手腕转', value: 'wristTwist' },
    { name: '肘击', value: 'elbowHit' },
    { name: '臂伸展', value: 'armStretch' },
    { name: '拍手', value: 'handClap' },
    { name: '大挥臂', value: 'bigArmSwing' },
    { name: '狂耸肩', value: 'wildShrug' },
    { name: '高举臂', value: 'highArmRaise' },
    { name: '狂抖肩', value: 'wildShoulder' },
    { name: '猛挥手', value: 'bigWave' },
    { name: '夸张拍手', value: 'exaggeratedClap' },
    { name: '大力甩臂', value: 'bigArmFling' },
    { name: '狂挥拳', value: 'wildPunch' },
    { name: '大伸展', value: 'bigStretch' },
    { name: '狂抖臂', value: 'wildArmShake' },
    { name: '全身狂抖', value: 'fullBodyShake' },
    { name: '狂旋转', value: 'wildSpin' },
    { name: '疯弹跳', value: 'crazyBounce' },
    { name: '狂抽搐', value: 'wildTwitch' },
    { name: '疯摇摆', value: 'crazySway' },
    { name: '狂震动', value: 'wildVibrate' },
    { name: '疯翻滚', value: 'crazyRoll' },
    { name: '狂冲刺', value: 'wildDash' },
    { name: '疯爆发', value: 'crazyBurst' },
    { name: '狂扭曲', value: 'wildTwist' },
    { name: '位移摆', value: 'dispSwing' },
    { name: '位移抖', value: 'dispShake' },
    { name: '位移弹', value: 'dispBounce' },
    { name: '位移缩', value: 'dispScale' },
    { name: '位移滑', value: 'dispSlide' },
    { name: '位移屈', value: 'dispBend' },
    { name: '位移甩', value: 'dispFling' },
    { name: '位移颤', value: 'dispVibrate' },
    { name: '位移摇', value: 'dispSway' },
    { name: '透镜', value: 'dispLens' },
    { name: '波纹', value: 'dispWave' },
    { name: '扭曲', value: 'dispTwist' },
    { name: '脉冲', value: 'dispPulse' },
    { name: '摇晃', value: 'dispWobble' },
    { name: '挤压', value: 'dispSquash' },
    { name: '锯齿', value: 'dispZigzag' },
    { name: '轨道', value: 'dispOrbit' },
    { name: '呼吸', value: 'dispBreath' },
    { name: '螺旋', value: 'dispSpiral' },
    { name: '涟漪', value: 'dispRipple' },
    { name: '3D旋转X', value: 'disp3DRotX' },
    { name: '3D旋转Y', value: 'disp3DRotY' },
    { name: '3D翻转', value: 'disp3DFlip' },
    { name: '3D波浪', value: 'disp3DWave' },
    { name: '3D缩放', value: 'disp3DZoom' },
    { name: '3D透视', value: 'disp3DPersp' },
    { name: '3D摆动', value: 'disp3DSwing' },
    { name: '3D弹跳', value: 'disp3DBounce' },
    { name: '3D扭转', value: 'disp3DTwist' },
    { name: '3D呼吸', value: 'disp3DBreath' },
    { name: '两端摆', value: 'bothSwing' },
    { name: '两端抖', value: 'bothShake' },
    { name: '两端弹', value: 'bothBounce' },
    { name: '两端缩', value: 'bothScale' },
    { name: '两端屈', value: 'bothBend' },
    { name: '两端脉冲', value: 'bothPulse' },
    { name: '两端摇晃', value: 'bothWobble' },
    { name: '两端轨道', value: 'bothOrbit' },
    { name: '两端挤压', value: 'bothSquash' },
    { name: '两端扭', value: 'bothTwist' }
  ],
  weight: [
    { name: '字重循环', value: 'weightCycle' }
  ],
  out: [
    { name: '淡出', value: 'fadeOut' },
    { name: '左移出', value: 'slideLeftOut' },
    { name: '右移出', value: 'slideRightOut' },
    { name: '上移出', value: 'slideUpOut' },
    { name: '下移出', value: 'slideDownOut' },
    { name: '缩放', value: 'scaleOut' },
    { name: '旋转', value: 'rotateOut' },
    { name: '弹跳', value: 'bounceOut' }
  ]
};

// 预设动画分类
const presetAnimCategories = [
  {
    name: '📱 基础动画',
    animes: ['static', 'shake', 'fall', 'jump', 'run', 'walk', 'spin', 'blink', 'pulse', 'sway', 'bounce', 'float', 'vibrate', 'slide', 'zoom', 'swing', 'dive', 'rise', 'dash', 'breathe', 'flicker']
  },
  {
    name: '👋 动作动画',
    animes: ['wave', 'clap', 'nod', 'shakehead', 'run2', 'fly', 'crawl', 'jump2', 'waddle', 'stretch', 'sleep', 'eat']
  },
  {
    name: '🦵 半身动画',
    animes: ['legKick', 'footTap', 'legSwing', 'hipShake', 'kneeBend', 'footWiggle', 'legMarch', 'hipTwist', 'footStomp', 'legStretch', 'armWave', 'armSwing', 'armRaise', 'shoulderShrug', 'shoulderShake', 'fingerTap', 'wristTwist', 'elbowHit', 'armStretch', 'handClap']
  },
  {
    name: '💥 夸张半身',
    animes: ['bigKick', 'stompHard', 'shakeHip', 'highStep', 'twistWaist', 'jumpFeet', 'wiggleLeg', 'slideFeet', 'squatBounce', 'splitLegs', 'bigArmSwing', 'wildShrug', 'highArmRaise', 'wildShoulder', 'bigWave', 'exaggeratedClap', 'bigArmFling', 'wildPunch', 'bigStretch', 'wildArmShake']
  },
  {
    name: '🤪 疯狂动画',
    animes: ['crazyKick', 'wildStomp', 'hipSwing', 'legFling', 'crazyDance', 'jumpSplit', 'legShake', 'squatKick', 'twistJump', 'wildSlide', 'bottomSwing', 'bottomShake', 'bottomBounce', 'bottomSpin', 'bottomScale', 'bottomSlide', 'bottomBend', 'bottomFling', 'bottomVibrate', 'bottomSway', 'fullBodyShake', 'wildSpin', 'crazyBounce', 'wildTwitch', 'crazySway', 'wildVibrate', 'crazyRoll', 'wildDash', 'crazyBurst', 'wildTwist']
  },
  {
    name: '🎲 3D动画',
    animes: ['flip3D', 'rotate3DY', 'rotate3DX', 'swing3D', 'zoom3D', 'spin3D', 'tilt3D', 'bounce3D', 'twist3D', 'roll3D', 'explode3D', 'implode3D', 'spiral3D', 'wobble3D', 'flipOut3D', 'shake3D', 'pulse3D', 'swingWild3D', 'zoomCrazy3D', 'rotateCrazy3D']
  },
  {
    name: '🔮 位移动画',
    animes: ['dispSwing', 'dispShake', 'dispBounce', 'dispScale', 'dispSlide', 'dispBend', 'dispFling', 'dispVibrate', 'dispSway', 'dispLens', 'dispWave', 'dispTwist', 'dispPulse', 'dispWobble', 'dispSquash', 'dispZigzag', 'dispOrbit', 'dispBreath', 'dispSpiral', 'dispRipple']
  },
  {
    name: '💎 3D位移',
    animes: ['disp3DRotX', 'disp3DRotY', 'disp3DFlip', 'disp3DWave', 'disp3DZoom', 'disp3DPersp', 'disp3DSwing', 'disp3DBounce', 'disp3DTwist', 'disp3DBreath']
  },
  {
    name: '⚡ 两端动画',
    animes: ['bothSwing', 'bothShake', 'bothBounce', 'bothScale', 'bothBend', 'bothPulse', 'bothWobble', 'bothOrbit', 'bothSquash', 'bothTwist']
  }
];

// 获取动画名称
function getAnimName(type, animValue) {
  // 先查本地中文名映射
  const localMap = {
    'weightCycle': '字重循环',
    'drawPath': '手绘路径'
  };
  if (localMap[animValue]) return localMap[animValue];
  
  if (typeof AnimPluginLoader !== 'undefined' && AnimPluginLoader.isLoaded()) {
    const name = AnimPluginLoader.getAnimName(type, animValue);
    // 如果插件返回的是原始值（英文名），继续使用本地映射
    if (name !== animValue) return name;
  }
  const effects = animEffects[type] || [];
  const effect = effects.find(e => e.value === animValue);
  return effect ? effect.name : animValue;
}

function getAnimEffectsList(type) {
  if (typeof AnimPluginLoader !== 'undefined' && AnimPluginLoader.isLoaded()) {
    return AnimPluginLoader.getAllAnimations(type).map(a => ({ name: a.name, value: a.value }));
  }
  return animEffects[type] || [];
}

// 渲染动画效果按钮
function renderAnimEffectButtons(type, selectedAnim) {
  editAnimEffectButtons.innerHTML = '';
  const effects = getAnimEffectsList(type);
  effects.forEach(effect => {
    const btn = document.createElement('button');
    btn.className = `anim-effect-btn${effect.value === selectedAnim ? ' active' : ''}`;
    btn.textContent = effect.name;
    btn.dataset.effect = effect.value;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.anim-effect-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // 路径动画：点击"手绘路径"时触发绘制界面
      if (type === 'path' && effect.value === 'drawPath') {
        if (selectedBlocks.length === 0 && selectedBgImageId === null && selectedVideoId === null) {
          showTip('请先选中文字块、图片或视频');
          return;
        }
        // 关闭动画弹窗
        hideEditAnimModal();
        // 打开路径绘制界面
        setTimeout(() => {
          createPathDrawUI(selectedBlocks[0]);
        }, 100);
      }
    });
    editAnimEffectButtons.appendChild(btn);
  });
}

// 显示修改动画弹窗（支持多选动画）
function showEditAnimModal(blockId, indices) {
  // 确保 indices 是数组
  if (!Array.isArray(indices)) indices = [indices];
  
  // 重置预设分类到第一个
  currentPresetCategoryIndex = 0;
  
  // 空 indices 表示添加新动画（无已有动画）
  const isNewAnim = indices.length === 0;
  
  const anims = indices.map(idx => blockAnimations[blockId]?.[idx]).filter(a => a);
  // 允许空 indices（添加新动画时）
  if (anims.length === 0 && indices.length > 0) return;
  
  // 可叠加动画类型
  const multiTypes = ['preset', 'weight', 'path'];
  
  // 检查是否已经有已选动画列表（路径绘制完成后会保留）
  if (!editingSelectedAnims || editingSelectedAnims.length === 0) {
    // 初始化已选动画列表（每个动画单独存储时间）
    // 使用indices数组中的索引，确保正确对应
    editingSelectedAnims = [];
    for (let i = 0; i < indices.length; i++) {
      const anim = blockAnimations[blockId]?.[indices[i]];
      if (anim) {
        editingSelectedAnims.push({
          type: anim.type,
          anim: anim.anim,
          startTime: anim.startTime,
          duration: anim.duration,
          rotate: anim.rotate || 0,
          flipX: anim.flipX || false,
          flipY: anim.flipY || false,
          path: anim.path ? JSON.parse(JSON.stringify(anim.path)) : undefined,
          pathMode: anim.pathMode || 'freehand',
          originalIndex: indices[i],
          weightAnimMin: anim.weightAnimMin ?? 100,
          weightAnimMax: anim.weightAnimMax ?? 900,
          weightAnimSpeed: anim.weightAnimSpeed ?? 1
        });
      }
    }
  }
  
  // 调试日志
  console.log('showEditAnimModal - editingSelectedAnims:', editingSelectedAnims);
  
  // 存储正在编辑的动画信息
  editingAnim = { blockId, indices, isMulti: indices.length > 1 || anims.some(a => multiTypes.includes(a.type)), isNewAnim };
  
  // 更新弹窗标题
  const headerSpan = editAnimModal.querySelector('.edit-anim-header span');
  if (headerSpan) {
    headerSpan.textContent = isNewAnim ? '添加动画' : (editingAnim.isMulti ? '修改多选动画' : '修改动画');
  }
  
  // 获取动画类型区域和效果标签
  const typeSection = document.getElementById('editAnimTypeSection');
  const effectLabel = document.getElementById('editAnimEffectLabel');
  
  // 检查是否应该显示多选模式
  const showMultiMode = indices.length > 1 || anims.some(a => multiTypes.includes(a.type));
  
  if (showMultiMode || isNewAnim) {
    // 隐藏动画类型区域（多选动画不需要选择类型）
    if (typeSection) typeSection.style.display = 'none';
    
    // 更新效果标签
    if (effectLabel) effectLabel.textContent = '动画效果（点击添加）';
    
    // 显示所有可叠加动画类型的效果按钮（可多选）
    renderMultiAnimEffectButtons(editingSelectedAnims);
    
    // 渲染已选动画列表
    renderSelectedAnimsList();
    
    // 设置时间（使用第一个动画的时间，或保持当前输入框的值，或使用当前时间轴位置）
    if (anims.length > 0) {
      editAnimStartTime.value = anims[0].startTime;
      editAnimDuration.value = anims[0].duration;
    } else {
      // 新建动画时，计算开始时间
      // 如果当前时间点有动画在播放，或当前时间点之前有动画还没结束，新动画接在最后一个动画后面
      const blockAnims = blockAnimations[blockId] || [];
      if (blockAnims.length > 0) {
        // 找到当前时间点或之前最后一个动画的结束时间
        let lastEndTime = 0;
        blockAnims.forEach(anim => {
          const animEndTime = anim.startTime + anim.duration;
          // 如果动画在当前时间点之前或正在播放，记录其结束时间
          if (anim.startTime <= currentTimelineTime && animEndTime > lastEndTime) {
            lastEndTime = animEndTime;
          }
        });
        // 如果找到了在当前时间点或之前的动画，新动画从那个动画结束后开始
        if (lastEndTime > 0 && lastEndTime > currentTimelineTime) {
          editAnimStartTime.value = lastEndTime;
        } else {
          editAnimStartTime.value = currentTimelineTime;
        }
      } else {
        editAnimStartTime.value = currentTimelineTime;
      }
      if (!editAnimDuration.value) editAnimDuration.value = 2;
    }
  } else {
    // 显示动画类型区域
    if (typeSection) typeSection.style.display = 'block';
    
    // 更新效果标签
    if (effectLabel) effectLabel.textContent = '动画效果（点击添加）';
    
    // 单个非可叠加动画（入场/出场）- 也使用可多选的按钮，可以添加更多动画效果
    const anim = anims[0];
    
    // 设置动画类型
    document.querySelectorAll('.anim-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === anim.type);
    });
    
    // 使用可多选的效果按钮
    renderMultiAnimEffectButtons(editingSelectedAnims);
    
    // 渲染已选动画列表
    renderSelectedAnimsList();
    
    // 设置时间
    editAnimStartTime.value = anim.startTime;
    editAnimDuration.value = anim.duration;
  }
  
  editAnimModal.style.display = 'flex';
}

// 渲染已选动画列表
function renderSelectedAnimsList() {
  const listContainer = document.getElementById('selectedAnimsList');
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  
  if (editingSelectedAnims.length === 0) {
    listContainer.innerHTML = '<div style="color:#64748b;font-size:12px;padding:8px">暂无已选动画，请点击上方效果按钮添加</div>';
    return;
  }
  
  editingSelectedAnims.forEach((anim, idx) => {
    const item = document.createElement('div');
    item.className = 'selected-anim-item';
    
    const firstRow = document.createElement('div');
    firstRow.className = 'selected-anim-row';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'selected-anim-name';
    nameSpan.textContent = getAnimName(anim.type, anim.anim);
    firstRow.appendChild(nameSpan);
    
    const typeSpan = document.createElement('span');
    typeSpan.className = 'selected-anim-type';
    const typeLabels = { in: '入场', out: '出场', preset: '预设', weight: '字重', path: '路径' };
    typeSpan.textContent = typeLabels[anim.type] || anim.type;
    firstRow.appendChild(typeSpan);
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'selected-anim-remove';
    removeBtn.textContent = '×';
    removeBtn.title = '删除';
    removeBtn.addEventListener('click', () => {
      editingSelectedAnims.splice(idx, 1);
      renderSelectedAnimsList();
      renderMultiAnimEffectButtons(editingSelectedAnims);
    });
    firstRow.appendChild(removeBtn);
    
    item.appendChild(firstRow);
    
    const secondRow = document.createElement('div');
    secondRow.className = 'selected-anim-row';
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'selected-anim-time';
    
    const startLabel = document.createElement('span');
    startLabel.textContent = '开始';
    startLabel.style.cssText = 'font-size:10px;color:#64748b;margin-right:2px';
    timeDiv.appendChild(startLabel);
    
    const startInput = document.createElement('input');
    startInput.type = 'number';
    startInput.step = '0.5';
    startInput.min = '0';
    startInput.value = anim.startTime;
    startInput.title = '开始时间';
    startInput.addEventListener('input', () => {
      editingSelectedAnims[idx].startTime = parseFloat(startInput.value) || 0;
    });
    timeDiv.appendChild(startInput);
    
    const durationLabel = document.createElement('span');
    durationLabel.textContent = '持续';
    durationLabel.style.cssText = 'font-size:10px;color:#64748b;margin-left:8px;margin-right:2px';
    timeDiv.appendChild(durationLabel);
    
    const durationInput = document.createElement('input');
    durationInput.type = 'number';
    durationInput.step = '0.5';
    durationInput.min = '0.5';
    durationInput.value = anim.duration;
    durationInput.title = '持续时间';
    durationInput.addEventListener('input', () => {
      editingSelectedAnims[idx].duration = parseFloat(durationInput.value) || 2;
    });
    timeDiv.appendChild(durationInput);
    
    secondRow.appendChild(timeDiv);
    
    if (anim.type === 'weight') {
      const weightDiv = document.createElement('div');
      weightDiv.className = 'selected-anim-weight';
      
      const minWeight = anim.weightAnimMin ?? 100;
      const maxWeight = anim.weightAnimMax ?? 900;
      const speed = anim.weightAnimSpeed ?? 1;
      
      const minLabel = document.createElement('span');
      minLabel.textContent = '最小';
      minLabel.style.cssText = 'font-size:10px;color:#64748b;margin-left:8px;margin-right:2px';
      weightDiv.appendChild(minLabel);
      
      const minInput = document.createElement('input');
      minInput.type = 'number';
      minInput.min = '100';
      minInput.max = '900';
      minInput.step = '100';
      minInput.value = minWeight;
      minInput.style.cssText = 'width:45px;padding:2px 4px;font-size:11px;border:1px solid #d1d5db;border-radius:4px;background:#fff;color:#111827';
      minInput.addEventListener('input', () => {
        editingSelectedAnims[idx].weightAnimMin = parseInt(minInput.value) || 100;
      });
      weightDiv.appendChild(minInput);
      
      const maxLabel = document.createElement('span');
      maxLabel.textContent = '最大';
      maxLabel.style.cssText = 'font-size:10px;color:#64748b;margin-left:4px;margin-right:2px';
      weightDiv.appendChild(maxLabel);
      
      const maxInput = document.createElement('input');
      maxInput.type = 'number';
      maxInput.min = '100';
      maxInput.max = '900';
      maxInput.step = '100';
      maxInput.value = maxWeight;
      maxInput.style.cssText = 'width:45px;padding:2px 4px;font-size:11px;border:1px solid #d1d5db;border-radius:4px;background:#fff;color:#111827';
      maxInput.addEventListener('input', () => {
        editingSelectedAnims[idx].weightAnimMax = parseInt(maxInput.value) || 900;
      });
      weightDiv.appendChild(maxInput);
      
      const speedLabel = document.createElement('span');
      speedLabel.textContent = '速度';
      speedLabel.style.cssText = 'font-size:10px;color:#64748b;margin-left:4px;margin-right:2px';
      weightDiv.appendChild(speedLabel);
      
      const speedInput = document.createElement('input');
      speedInput.type = 'number';
      speedInput.min = '0.1';
      speedInput.max = '10';
      speedInput.step = '0.1';
      speedInput.value = speed;
      speedInput.style.cssText = 'width:35px;padding:2px 4px;font-size:11px;border:1px solid #d1d5db;border-radius:4px;background:#fff;color:#111827';
      speedInput.addEventListener('input', () => {
        editingSelectedAnims[idx].weightAnimSpeed = parseFloat(speedInput.value) || 1;
      });
      weightDiv.appendChild(speedInput);
      
      secondRow.appendChild(weightDiv);
    }
    
    if (anim.type === 'path') {
      const pathDiv = document.createElement('div');
      pathDiv.className = 'selected-anim-path';
      
      const pathMode = anim.pathMode || 'freehand';
      const pathModeLabels = { freehand: '随意', straight: '直线', curve: '曲线' };
      
      const modeLabel = document.createElement('span');
      modeLabel.textContent = '模式';
      modeLabel.style.cssText = 'font-size:10px;color:#64748b;margin-left:8px;margin-right:2px';
      pathDiv.appendChild(modeLabel);
      
      const modeSpan = document.createElement('span');
      modeSpan.textContent = pathModeLabels[pathMode] || pathMode;
      modeSpan.style.cssText = 'font-size:11px;color:#3b82f6;font-weight:500';
      pathDiv.appendChild(modeSpan);
      
      const pointsCount = anim.path && anim.path.length ? anim.path.length : 0;
      const pointsLabel = document.createElement('span');
      pointsLabel.textContent = `点数:${pointsCount}`;
      pointsLabel.style.cssText = 'font-size:10px;color:#64748b;margin-left:8px';
      pathDiv.appendChild(pointsLabel);
      
      secondRow.appendChild(pathDiv);
    }
    
    item.appendChild(secondRow);
    
    listContainer.appendChild(item);
  });
}

// 渲染多选动画效果按钮（可多选）
function renderMultiAnimEffectButtons(selectedAnims) {
  editAnimEffectButtons.innerHTML = '';
  
  // 创建一个占满整行的工具函数
  function createFullRowSection() {
    const section = document.createElement('div');
    section.style.cssText = 'grid-column:1 / -1;';
    return section;
  }
  
  // 入场动画（始终显示，与出场动画互斥）
  const inEffects = getAnimEffectsList('in');
  if (inEffects.length > 0) {
    const section = createFullRowSection();
    
    const typeLabel = document.createElement('div');
    typeLabel.style.cssText = 'font-size:12px;color:#64748b;margin:8px 0 4px;font-weight:500';
    typeLabel.textContent = '入场动画（与出场互斥）';
    section.appendChild(typeLabel);
    
    const btnsContainer = document.createElement('div');
    btnsContainer.style.cssText = 'display:grid;grid-template-columns:repeat(3, 1fr);gap:6px';
    
    inEffects.forEach(effect => {
      const btn = document.createElement('button');
      const isSelected = selectedAnims.some(a => a.type === 'in' && a.anim === effect.value);
      btn.className = `anim-effect-btn${isSelected ? ' active' : ''}`;
      btn.textContent = effect.name;
      btn.dataset.effect = effect.value;
      btn.dataset.type = 'in';
      
      btn.addEventListener('click', () => {
        const wasActive = btn.classList.contains('active');
        editingSelectedAnims = editingSelectedAnims.filter(a => a.type !== 'in' && a.type !== 'out');
        if (!wasActive) {
          const startTime = parseFloat(editAnimStartTime.value) || 0;
          const duration = parseFloat(editAnimDuration.value) || 2;
          const rotate = parseFloat(editAnimRotate.value) || 0;
          const flipX = document.getElementById('flipXBtn').classList.contains('active');
          const flipY = document.getElementById('flipYBtn').classList.contains('active');
          editingSelectedAnims.push({
            type: 'in',
            anim: effect.value,
            startTime: startTime,
            duration: duration,
            rotate: rotate,
            flipX: flipX,
            flipY: flipY
          });
        }
        renderSelectedAnimsList();
        renderMultiAnimEffectButtons(editingSelectedAnims);
      });
      
      btnsContainer.appendChild(btn);
    });
    
    section.appendChild(btnsContainer);
    editAnimEffectButtons.appendChild(section);
  }
  
  // 出场动画（始终显示，与入场动画互斥）
  const outEffects = getAnimEffectsList('out');
  if (outEffects.length > 0) {
    const section = createFullRowSection();
    
    const typeLabel = document.createElement('div');
    typeLabel.style.cssText = 'font-size:12px;color:#64748b;margin:8px 0 4px;font-weight:500';
    typeLabel.textContent = '出场动画（与入场互斥）';
    section.appendChild(typeLabel);
    
    const btnsContainer = document.createElement('div');
    btnsContainer.style.cssText = 'display:grid;grid-template-columns:repeat(3, 1fr);gap:6px';
    
    outEffects.forEach(effect => {
      const btn = document.createElement('button');
      const isSelected = selectedAnims.some(a => a.type === 'out' && a.anim === effect.value);
      btn.className = `anim-effect-btn${isSelected ? ' active' : ''}`;
      btn.textContent = effect.name;
      btn.dataset.effect = effect.value;
      btn.dataset.type = 'out';
      
      btn.addEventListener('click', () => {
        const wasActive = btn.classList.contains('active');
        editingSelectedAnims = editingSelectedAnims.filter(a => a.type !== 'in' && a.type !== 'out');
        if (!wasActive) {
          const startTime = parseFloat(editAnimStartTime.value) || 0;
          const duration = parseFloat(editAnimDuration.value) || 2;
          const rotate = parseFloat(editAnimRotate.value) || 0;
          const flipX = document.getElementById('flipXBtn').classList.contains('active');
          const flipY = document.getElementById('flipYBtn').classList.contains('active');
          editingSelectedAnims.push({
            type: 'out',
            anim: effect.value,
            startTime: startTime,
            duration: duration,
            rotate: rotate,
            flipX: flipX,
            flipY: flipY
          });
        }
        renderSelectedAnimsList();
        renderMultiAnimEffectButtons(editingSelectedAnims);
      });
      
      btnsContainer.appendChild(btn);
    });
    
    section.appendChild(btnsContainer);
    editAnimEffectButtons.appendChild(section);
  }
  
  // 可叠加动画类型（可多选）
  const multiTypes = ['preset', 'weight', 'path'];
  
  multiTypes.forEach(type => {
    const effects = getAnimEffectsList(type);
    if (effects.length === 0) return;
    
    const section = createFullRowSection();
    
    // 创建类型分组标题
    const typeLabel = document.createElement('div');
    typeLabel.style.cssText = 'font-size:12px;color:#64748b;margin:8px 0 4px;font-weight:500';
    typeLabel.textContent = type === 'preset' ? '动画预设（可多选）' : type === 'weight' ? '字重动画（可多选）' : '路径动画（可多选）';
    section.appendChild(typeLabel);
    

    
    // 预设动画按小分类显示（选项卡方式）
    const hasPluginCats = typeof AnimPluginLoader !== 'undefined' && AnimPluginLoader.isLoaded();
    const usePresetCategories = hasPluginCats || typeof presetAnimCategories !== 'undefined';
    
    if (type === 'preset' && usePresetCategories) {
      // 注入隐藏滚动条的样式（只注入一次）
      if (!document.getElementById('hideScrollbarStyle')) {
        const style = document.createElement('style');
        style.id = 'hideScrollbarStyle';
        style.textContent = `
          .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .hide-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
        `;
        document.head.appendChild(style);
      }
      
      // 分类标签容器（横向滚动，隐藏滚动条）
      const tabsContainer = document.createElement('div');
      tabsContainer.className = 'hide-scrollbar';
      tabsContainer.style.cssText = 'display:flex;gap:4px;margin-bottom:6px;overflow-x:auto;flex-wrap:nowrap;position:relative';
      
      let activeTabBtn = null;
      
      let categories = [];
      if (hasPluginCats) {
        const pluginCats = AnimPluginLoader.getPresetCategories();
        categories = pluginCats.map(cat => ({
          name: `${cat.icon} ${cat.name}`,
          animes: [],
          id: cat.id
        }));
      } else {
        categories = presetAnimCategories;
      }
      
      categories.forEach((category, idx) => {
        const tabBtn = document.createElement('button');
        const isActive = idx === currentPresetCategoryIndex;
        tabBtn.style.cssText = `
          flex-shrink:0;padding:4px 10px;font-size:11px;border-radius:4px;
          border:1px solid ${isActive ? '#60a5fa' : 'rgba(255,255,255,0.1)'};
          background:${isActive ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)'};
          color:${isActive ? '#93c5fd' : '#94a3b8'};
          cursor:pointer;white-space:nowrap;font-weight:500;
        `;
        tabBtn.textContent = category.name;
        tabBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentPresetCategoryIndex = idx;
          renderMultiAnimEffectButtons(editingSelectedAnims);
        });
        tabsContainer.appendChild(tabBtn);
        if (isActive) activeTabBtn = tabBtn;
      });
      section.appendChild(tabsContainer);
      
      // 渲染完成后，让选中的标签滚动到可视区域中间
      setTimeout(() => {
        if (activeTabBtn && tabsContainer.scrollWidth > tabsContainer.clientWidth) {
          activeTabBtn.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'center'
          });
        }
      }, 10);
      
      // 当前分类的动画按钮容器
      const btnContainer = document.createElement('div');
      btnContainer.style.cssText = 'display:grid;grid-template-columns:repeat(3, 1fr);gap:6px';
      
      let currentAnimList = [];
      if (hasPluginCats) {
        const pluginCats = AnimPluginLoader.getPresetCategories();
        const cat = pluginCats[currentPresetCategoryIndex];
        if (cat) {
          const plugins = AnimPluginLoader.getLoadedPlugins();
          const plugin = plugins[cat.id];
          if (plugin && plugin.animations) {
            currentAnimList = plugin.animations.map(a => ({ name: a.name, value: a.value }));
          }
        }
      } else {
        const currentCategory = presetAnimCategories[currentPresetCategoryIndex];
        currentAnimList = currentCategory.animes.map(v => {
          const e = effects.find(ef => ef.value === v);
          return e || { name: v, value: v };
        });
      }
      
      currentAnimList.forEach(effect => {
        const btn = document.createElement('button');
        const isSelected = selectedAnims.some(a => a.type === type && a.anim === effect.value);
        btn.className = `anim-effect-btn${isSelected ? ' active' : ''}`;
        btn.style.cssText = 'font-size:12px;';
        btn.textContent = effect.name;
        btn.dataset.effect = effect.value;
        btn.dataset.type = type;
        
        btn.addEventListener('click', () => {
          const wasActive = btn.classList.contains('active');
          if (wasActive) {
            editingSelectedAnims = editingSelectedAnims.filter(a => !(a.type === type && a.anim === effect.value));
          } else {
            const startTime = parseFloat(editAnimStartTime.value) || 0;
            const duration = parseFloat(editAnimDuration.value) || 2;
            const rotVal = parseFloat(editAnimRotate.value) || 0;
            var flpX = false, flpY = false;
            var fxBtn = document.getElementById('flipXBtn');
            var fyBtn = document.getElementById('flipYBtn');
            if (fxBtn) flpX = fxBtn.classList.contains('active');
            if (fyBtn) flpY = fyBtn.classList.contains('active');
            editingSelectedAnims.push({
              type: type,
              anim: effect.value,
              startTime: startTime,
              duration: duration,
              rotate: rotVal,
              flipX: flpX,
              flipY: flpY
            });
          }
          renderSelectedAnimsList();
          renderMultiAnimEffectButtons(editingSelectedAnims);
        });
        
        btnContainer.appendChild(btn);
      });
      
      section.appendChild(btnContainer);
    } else {
      // 非预设动画，直接显示按钮
      const btnsContainer = document.createElement('div');
      btnsContainer.style.cssText = 'display:grid;grid-template-columns:repeat(3, 1fr);gap:6px';
      
      effects.forEach(effect => {
        const btn = document.createElement('button');
        const isSelected = selectedAnims.some(a => a.type === type && a.anim === effect.value);
        btn.className = `anim-effect-btn${isSelected ? ' active' : ''}`;
        btn.textContent = effect.name;
        btn.dataset.effect = effect.value;
        btn.dataset.type = type;
        
        // 路径动画：手绘路径需要特殊处理
        if (type === 'path' && effect.value === 'drawPath') {
          btn.addEventListener('click', () => {
            const block = getBlockElement(editingAnim.blockId);
            if (!block) {
              showTip('找不到文字块');
              return;
            }
            editAnimModal.style.display = 'none';
            setTimeout(() => {
              createPathDrawUI(block);
            }, 100);
          });
        } else {
          // 多选模式：点击切换选中状态
          btn.addEventListener('click', () => {
            const wasActive = btn.classList.contains('active');
            if (wasActive) {
              editingSelectedAnims = editingSelectedAnims.filter(a => !(a.type === type && a.anim === effect.value));
            } else {
              const startTime = parseFloat(editAnimStartTime.value) || 0;
              const duration = parseFloat(editAnimDuration.value) || 2;
              const rotVal = parseFloat(editAnimRotate.value) || 0;
              var flpX = false, flpY = false;
              var fxBtn = document.getElementById('flipXBtn');
              var fyBtn = document.getElementById('flipYBtn');
              if (fxBtn) flpX = fxBtn.classList.contains('active');
              if (fyBtn) flpY = fyBtn.classList.contains('active');
          if (type === 'weight') {
                editingSelectedAnims.push({
                  type: type,
                  anim: effect.value,
                  startTime: startTime,
                  duration: duration,
                  rotate: rotVal,
                  flipX: flpX,
                  flipY: flpY,
                  weightAnimMin: 100,
                  weightAnimMax: 900,
                  weightAnimSpeed: 1
                });
              } else {
                editingSelectedAnims.push({
                  type: type,
                  anim: effect.value,
                  startTime: startTime,
                  duration: duration,
                  rotate: rotVal,
                  flipX: flpX,
                  flipY: flpY
                });
              }
            }
            renderSelectedAnimsList();
            renderMultiAnimEffectButtons(editingSelectedAnims);
          });
        }
        
        btnsContainer.appendChild(btn);
      });
      
      section.appendChild(btnsContainer);
    }
    
    editAnimEffectButtons.appendChild(section);
  });
}

// 隐藏修改动画弹窗
function hideEditAnimModal() {
  editAnimModal.style.display = 'none';
  editingAnim = null;
  editingSelectedAnims = [];
}

// 更新播放进度线位置
function updatePlayhead(time) {
  if (timelinePlayhead) {
    timelinePlayhead.style.display = 'block';
    timelinePlayhead.style.left = (time * 80 + LABEL_OFFSET) + 'px';
    // 动态设置指针高度：从标尺底部一直延伸到轨道最底部
    var tracks = document.getElementById('keyframesTracks');
    if (tracks) {
      var rulerH = 24; // .timeline-ruler height
      var contentH = tracks.scrollHeight + tracks.offsetTop;
      timelinePlayhead.style.top = rulerH + 'px';
      timelinePlayhead.style.height = Math.max(0, contentH) + 'px';
    }
  }
}

// 隐藏播放进度线
function hidePlayhead() {
  if (timelinePlayhead) {
    timelinePlayhead.style.display = 'none';
  }
}

// 获取时间轴行的类型和ID
function getTimelineRowInfo(row) {
  if (!row) return null;
  if (row.classList.contains('bg-track-row') && row.dataset.bgImageId) {
    return { type: 'bgImage', id: row.dataset.bgImageId };
  }
  if (row.classList.contains('video-track-row') && row.dataset.videoId) {
    return { type: 'video', id: row.dataset.videoId };
  }
  if (row.dataset.blockId && !row.classList.contains('bg-track-row') && !row.classList.contains('video-track-row')) {
    const bgGreen = row.style.background && row.style.background.indexOf('rgba(16,185,129') >= 0;
    if (bgGreen) return null;
    return { type: 'block', id: row.dataset.blockId };
  }
  return null;
}

// 获取可拖动的所有层行（文字块、图片块、视频块，排除背景层动画行）
function getAllDraggableRows(timelineSec) {
  const allRows = Array.from(timelineSec.children);
  return allRows.filter(row => {
    const info = getTimelineRowInfo(row);
    return info !== null;
  });
}

// 全局时间轴拖动 - mousemove 处理
function handleTimelineDragMouseMove(e) {
  if (!timelineDragState.active) return;
  
  const timelineSec = document.querySelector('#keyframesTracks .timeline-section');
  if (!timelineSec) return;
  
  const dragType = timelineDragState.type;
  const rows = getAllDraggableRows(timelineSec);
  
  // 找到鼠标位置对应的目标行
  let targetRow = null;
  let insertAfter = false;
  
  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      targetRow = rows[i];
      insertAfter = false;
      break;
    }
    targetRow = rows[i];
    insertAfter = true;
  }
  
  // 移除之前的拖动指示器
  document.querySelectorAll('.drag-indicator').forEach(el => el.remove());
  
  // 判断目标是否是自身
  let isSelf = false;
  if (targetRow) {
    const targetInfo = getTimelineRowInfo(targetRow);
    const selfType = dragType === 'text' ? 'block' : (dragType === 'bg' ? 'bgImage' : 'video');
    const selfId = timelineDragState.blockId;
    if (targetInfo && targetInfo.type === selfType) {
      isSelf = String(targetInfo.id) === String(selfId);
    }
  }
  
  if (targetRow && !isSelf) {
    const indicator = document.createElement('div');
    indicator.className = 'drag-indicator';
    
    // 根据拖动类型设置指示器颜色
    let color = '#007aff';
    if (dragType === 'bg') color = '#6366f1';
    else if (dragType === 'video') color = '#f59e0b';
    
    indicator.style.cssText = `position:absolute;left:0;right:0;height:3px;background:${color};pointer-events:none;z-index:1000;`;
    
    if (insertAfter) {
      indicator.style.top = (targetRow.offsetTop + targetRow.offsetHeight) + 'px';
    } else {
      indicator.style.top = targetRow.offsetTop + 'px';
    }
    
    timelineSec.appendChild(indicator);
    timelineDragState.currentDropTarget = targetRow;
    timelineDragState.insertAfter = insertAfter;
  } else {
    timelineDragState.currentDropTarget = null;
    timelineDragState.insertAfter = false;
  }
}

// 将元素移动到目标层位置（通过调整 zIndex）
function moveLayerToPosition(fromType, fromId, toType, toId, insertAfter) {
  const layers = getAllLayers();
  const fromIdx = layers.findIndex(l => l.type === fromType && String(l.id) === String(fromId));
  if (fromIdx < 0) return false;
  
  const fromLayer = layers[fromIdx];
  
  // 从原位置移除
  layers.splice(fromIdx, 1);
  
  // 找到目标位置
  let toIdx = layers.findIndex(l => l.type === toType && String(l.id) === String(toId));
  if (toIdx < 0) return false;
  
  if (insertAfter) {
    toIdx += 1;
  }
  
  // 插入到新位置
  layers.splice(toIdx, 0, fromLayer);
  
  // 重新分配 zIndex
  layers.forEach((layer, idx) => {
    layer.zIndex = idx;
    applyLayerZIndex(layer);
  });
  
  // 更新容器 zIndex，确保最高层级元素所在的容器显示在最前面
  updateContainerZIndex();
  
  return true;
}

// 全局时间轴拖动 - mouseup 处理
function handleTimelineDragMouseUp(e) {
  if (!timelineDragState.active) return;
  
  const dragType = timelineDragState.type;
  const timelineSec = document.querySelector('#keyframesTracks .timeline-section');
  
  // 重置所有 label 样式
  document.querySelectorAll('.track-label, .bg-track-label, .video-track-label').forEach(l => {
    l.style.cursor = 'grab';
    l.style.opacity = '1';
  });
  
  // 移除拖动指示器
  document.querySelectorAll('.drag-indicator').forEach(el => el.remove());
  
  const targetRow = timelineDragState.currentDropTarget;
  const insertAfter = timelineDragState.insertAfter;
  
  if (targetRow && document.body.contains(targetRow)) {
    const targetInfo = getTimelineRowInfo(targetRow);
    
    if (targetInfo) {
      // 构造源信息
      let fromType;
      const fromId = timelineDragState.blockId;
      if (dragType === 'text') {
        fromType = 'block';
      } else if (dragType === 'bg') {
        fromType = 'bgImage';
      } else if (dragType === 'video') {
        fromType = 'video';
      }
      
      if (fromType && fromId && (fromType !== targetInfo.type || String(fromId) !== String(targetInfo.id))) {
        const success = moveLayerToPosition(fromType, fromId, targetInfo.type, targetInfo.id, insertAfter);
        
        if (success) {
          // 更新相关数据数组的顺序
          updateLayerArraysOrder();
          showTip(insertAfter ? '已移到上层' : '已移到下层');
          renderTimeline();
        }
      }
    }
  }
  
  // 重置状态
  timelineDragState.active = false;
  timelineDragState.type = null;
  timelineDragState.currentDropTarget = null;
  timelineDragState.insertAfter = false;
}

// 根据 zIndex 更新各层数组的顺序
function updateLayerArraysOrder() {
  const layers = getAllLayers();
  
  // 更新 blocks 数组顺序（文字块）
  const blockLayers = layers.filter(l => l.type === 'block');
  const newBlocks = [];
  blockLayers.forEach(l => {
    const b = blocks.find(b => b.block && b.block.dataset.id === l.id);
    if (b) newBlocks.push(b);
  });
  blocks.length = 0;
  newBlocks.forEach(b => blocks.push(b));
  
  // 更新 bgImages 顺序
  const bgImageLayers = layers.filter(l => l.type === 'bgImage');
  const newBgImages = [];
  bgImageLayers.forEach(l => {
    const bg = bgImages.find(b => String(b.id) === String(l.id));
    if (bg) newBgImages.push(bg);
  });
  bgImages.length = 0;
  newBgImages.forEach(bg => bgImages.push(bg));
  
  // 更新 videoItems 顺序
  const videoLayers = layers.filter(l => l.type === 'video');
  const newVideos = [];
  videoLayers.forEach(l => {
    const v = videoItems.find(v => String(v.id) === String(l.id));
    if (v) newVideos.push(v);
  });
  videoItems.length = 0;
  newVideos.forEach(v => videoItems.push(v));
  
  // 更新 DOM
  updateAllBgImagesDom();
  updateAllVideosDom();
}

// 初始化时间轴
function initTimeline(customMaxTime = null) {
  timelineRuler.innerHTML = '';
  
  // 计算最大时间
  let maxTime = customMaxTime;
  if (maxTime === null) {
    maxTime = 10;
    Object.keys(blockAnimations).forEach(blockId => {
      blockAnimations[blockId].forEach(anim => {
        const endTime = anim.startTime + anim.duration;
        if (endTime > maxTime) {
          maxTime = endTime;
        }
      });
    });
    // 考虑视频时长
    if (videoItems && videoItems.length > 0) {
      videoItems.forEach(video => {
        const endTime = video.startTime + video.duration;
        if (endTime > maxTime) {
          maxTime = endTime;
        }
      });
    }
    // 确保至少10秒，向上取整
    maxTime = Math.max(10, Math.ceil(maxTime));
  }
  
  // 生成刻度（0.1秒精度）
  for (let i = 0; i <= maxTime * 10; i++) {
    const time = i / 10;
    const isMajor = i % 10 === 0;
    const isHalf = i % 5 === 0;
    
    const tick = document.createElement('div');
    tick.className = 'timeline-tick';
    tick.style.left = (time * 80 + LABEL_OFFSET) + 'px';
    if (isMajor) {
      tick.style.height = '24px';
      tick.style.backgroundColor = '#d1d5db';
    } else if (isHalf) {
      tick.style.height = '12px';
      tick.style.top = '12px';
      tick.style.backgroundColor = '#e5e7eb';
    } else {
      tick.style.height = '6px';
      tick.style.top = '18px';
      tick.style.backgroundColor = '#e5e7eb';
    }
    timelineRuler.appendChild(tick);
    
    if (isMajor) {
      const label = document.createElement('div');
      label.className = 'timeline-tick-label';
      label.style.left = (time * 80 + LABEL_OFFSET) + 'px';
      label.textContent = time + 's';
      timelineRuler.appendChild(label);
    }
  }
  
  // 更新时间轴宽度（包括标签偏移量）
  const timelineWidth = (maxTime * 80) + 100 + LABEL_OFFSET;
  timelineRuler.style.minWidth = timelineWidth + 'px';
  
  // 保存当前最大时间
  timelineRuler.dataset.maxTime = maxTime;
}

// 获取或创建文字块ID（统一使用字符串类型以保持一致）
function getBlockId(block) {
  if (!block.dataset.id) {
    block.dataset.id = String(++blockIdCounter);
  }
  return block.dataset.id;
}

// 添加动画到选中的文字块
function addAnimationToBlocks(type, animName) {
  // 处理选中的图片
  if (selectedBgImageId !== null) {
    const blockId = 'bg_' + selectedBgImageId;
    let globalMaxTime = 0;
    Object.keys(blockAnimations).forEach(id => {
      const anims = blockAnimations[id] || [];
      if (anims.length > 0) {
        const blockEndTime = Math.max(...anims.map(a => a.startTime + a.duration));
        if (blockEndTime > globalMaxTime) {
          globalMaxTime = blockEndTime;
        }
      }
    });
    const newAnim = {
      type: type,
      anim: animName,
      startTime: globalMaxTime + 0.5,
      duration: (type === 'preset' || type === 'weight' || type === 'path') ? 2 : 1
    };
    if (!blockAnimations[blockId]) {
      blockAnimations[blockId] = [];
    }
    blockAnimations[blockId].push(newAnim);
    renderTimeline();
    showTip(`已添加 ${type === 'in' ? '入场' : type === 'out' ? '出场' : '动画预设'} 动画`);
    return;
  }
  
  // 处理选中的视频
  if (selectedVideoId !== null) {
    const blockId = 'video_' + selectedVideoId;
    let globalMaxTime = 0;
    Object.keys(blockAnimations).forEach(id => {
      const anims = blockAnimations[id] || [];
      if (anims.length > 0) {
        const blockEndTime = Math.max(...anims.map(a => a.startTime + a.duration));
        if (blockEndTime > globalMaxTime) {
          globalMaxTime = blockEndTime;
        }
      }
    });
    const newAnim = {
      type: type,
      anim: animName,
      startTime: globalMaxTime + 0.5,
      duration: (type === 'preset' || type === 'weight' || type === 'path') ? 2 : 1
    };
    if (!blockAnimations[blockId]) {
      blockAnimations[blockId] = [];
    }
    blockAnimations[blockId].push(newAnim);
    renderTimeline();
    showTip(`已添加 ${type === 'in' ? '入场' : type === 'out' ? '出场' : '动画预设'} 动画`);
    return;
  }
  
  if (selectedBlocks.length === 0) {
    showTip('请先选中文字块、图片或视频');
    return;
  }
  
  selectedBlocks.forEach(block => {
    const blockId = getBlockId(block);
    
    // 获取所有文字块的最大时间，确保新动画在最后一个动画之后开始
    let globalMaxTime = 0;
    Object.keys(blockAnimations).forEach(id => {
      const anims = blockAnimations[id] || [];
      if (anims.length > 0) {
        const blockEndTime = Math.max(...anims.map(a => a.startTime + a.duration));
        if (blockEndTime > globalMaxTime) {
          globalMaxTime = blockEndTime;
        }
      }
    });
    
    // 添加新动画
    const newAnim = {
      type: type,
      anim: animName,
      startTime: globalMaxTime + 0.5,
      duration: (type === 'preset' || type === 'weight' || type === 'path') ? 2 : 1
    };
    
    if (!blockAnimations[blockId]) {
      blockAnimations[blockId] = [];
    }
    blockAnimations[blockId].push(newAnim);
  });
  
  renderTimeline();
  showTip(`已添加 ${type === 'in' ? '入场' : type === 'out' ? '出场' : '动画预设'} 动画`);
}

// 一键添加动画（入场淡入、动画预设、出场淡出）
function quickAddAnimation() {
  console.log('[quickAddAnimation] called, selectedBlocks.length:', selectedBlocks.length);
  // 支持文字块、图片块、视频块
  if (selectedBlocks.length === 0 && selectedBgImageId === null && selectedVideoId === null) {
    console.log('[quickAddAnimation] no selection, blocks in DOM:', document.querySelectorAll('.text-block').length);
    showTip('请先选中文字块、图片或视频');
    return;
  }
  
  console.log('[quickAddAnimation] selected blocks:', selectedBlocks.map(b => ({id: b.dataset.id, text: b.querySelector('.text-content')?.textContent?.substring(0,8)})));
  
  // 获取所有文字块的最大时间（移到循环外部，确保所有选中块从同一时间开始）
  let globalMaxTime = 0;
  Object.keys(blockAnimations).forEach(id => {
    const anims = blockAnimations[id] || [];
    if (anims.length > 0) {
      const blockEndTime = Math.max(...anims.map(a => a.startTime + a.duration));
      if (blockEndTime > globalMaxTime) {
        globalMaxTime = blockEndTime;
      }
    }
  });
  
  // 添加动画到指定blockId的辅助函数
  function addQuickAnims(blockId, startTime) {
    // 添加入场动画（淡入）
    if (!blockAnimations[blockId]) {
      blockAnimations[blockId] = [];
    }
    blockAnimations[blockId].push({
      type: 'in',
      anim: 'fadeIn',
      startTime: startTime,
      duration: 1
    });

    // 添加动画预设（放大缩小）- 入场结束后立即开始
    blockAnimations[blockId].push({
      type: 'preset',
      anim: 'pulse',
      startTime: startTime + 1,
      duration: 2
    });

    // 添加出场动画（淡出）- 动画预设结束后立即开始
    blockAnimations[blockId].push({
      type: 'out',
      anim: 'fadeOut',
      startTime: startTime + 3,
      duration: 1
    });

    // 确保块显示
    const block = getBlockElement(blockId);
    if (block) {
      block.style.visibility = 'visible';
    }
    console.log('[quickAddAnimation] added 3 anims to blockId:', blockId, 'now has', blockAnimations[blockId].length, 'anims');
  }

  // 处理文字块
  selectedBlocks.forEach(block => {
    const blockId = getBlockId(block);
    console.log('[quickAddAnimation] processing blockId:', blockId, 'globalMaxTime:', globalMaxTime);

    // 以 currentTimelineTime 为起点；已有动画的末尾时间仅在未显式选择时作为兜底
    const existingAnims = blockAnimations[blockId] || [];
    let startTime = globalMaxTime;
    if (hasSelectedTime) {
      startTime = currentTimelineTime; // 显式选择了时间 → 完全以选中的时间为准
    } else if (existingAnims.length > 0) {
      const lastEndTime = Math.max(...existingAnims.map(a => a.startTime + a.duration));
      startTime = Math.max(startTime, lastEndTime); // 未选择 → 从末尾追加
    }

    addQuickAnims(blockId, startTime);
  });

  // 处理图片块
  if (selectedBgImageId !== null) {
    const blockId = 'bg_' + selectedBgImageId;
    const existingAnims = blockAnimations[blockId] || [];
    let startTime = globalMaxTime;
    if (hasSelectedTime) {
      startTime = currentTimelineTime;
    } else if (existingAnims.length > 0) {
      const lastEndTime = Math.max(...existingAnims.map(a => a.startTime + a.duration));
      startTime = Math.max(startTime, lastEndTime);
    }
    addQuickAnims(blockId, startTime);
  }

  // 处理视频块
  if (selectedVideoId !== null) {
    const blockId = 'video_' + selectedVideoId;
    const existingAnims = blockAnimations[blockId] || [];
    let startTime = globalMaxTime;
    if (hasSelectedTime) {
      startTime = currentTimelineTime;
    } else if (existingAnims.length > 0) {
      const lastEndTime = Math.max(...existingAnims.map(a => a.startTime + a.duration));
      startTime = Math.max(startTime, lastEndTime);
    }
    addQuickAnims(blockId, startTime);
  }
  
  renderTimeline();
  const posStr = hasSelectedTime ? `从 ${currentTimelineTime}s 起` : '从末尾';
  showTip(`已${posStr}添加：入场淡入 → 动画预设 → 出场淡出`);
  hasSelectedTime = false; // 用完一次后重置
  
  if (typeof updateAnimListDisplay === 'function') {
    updateAnimListDisplay();
  }
}
// 当前选中的动画帧
let selectedAnimFrames = []; // [{ element, blockId, index }]

// 选中动画帧（支持Shift多选）
function selectAnimFrame(element, blockId, index, e) {
  const isShiftPressed = e && e.shiftKey;
  
  // 如果按住Shift，添加到选中列表
  if (isShiftPressed) {
    // 检查是否已经选中
    const existingIndex = selectedAnimFrames.findIndex(f => f.blockId === blockId && f.index === index);
    if (existingIndex >= 0) {
      // 已选中，取消选中
      selectedAnimFrames[existingIndex].element.style.outline = '';
      selectedAnimFrames[existingIndex].element.style.boxShadow = '';
      selectedAnimFrames.splice(existingIndex, 1);
      showTip(`已取消选中，当前选中 ${selectedAnimFrames.length} 个动画帧`);
      if (typeof window.updateAnimListDisplay === 'function') window.updateAnimListDisplay();
      return;
    }
    
    // 添加选中
    selectedAnimFrames.push({ element, blockId, index });
    element.style.outline = '2px solid #007aff';
    element.style.boxShadow = '0 0 8px rgba(0,122,255,0.5)';
    showTip(`已选中 ${selectedAnimFrames.length} 个动画帧`);
    if (typeof window.updateAnimListDisplay === 'function') window.updateAnimListDisplay();
    return;
  }

  // 不按Shift，清除之前的选中，只选中当前帧
  selectedAnimFrames.forEach(f => {
    f.element.style.outline = '';
    f.element.style.boxShadow = '';
  });
  selectedAnimFrames = [];
  if (typeof window.updateAnimListDisplay === 'function') window.updateAnimListDisplay();
  
  // 选中新帧
  selectedAnimFrames.push({ element, blockId, index });
  element.style.outline = '2px solid #007aff';
  element.style.boxShadow = '0 0 8px rgba(0,122,255,0.5)';
  
  // 获取动画信息
  const anim = blockAnimations[blockId][index];
  
  // 显示选中信息
  if (blockId === '__bg__') {
    const labelText = getBgAnimLabel(anim);
    showTip(`已选中: 背景层动画 - ${labelText} (${anim.startTime}s)`);
  } else {
    const block = getBlockElement(blockId);
    let text = '文字块';
    if (block) {
      const content = block.querySelector('.text-content');
      if (content && content.textContent && content.textContent.trim()) {
        text = content.textContent.trim();
      }
    } else {
      const numBlockId = parseInt(blockId);
      if (!isNaN(numBlockId)) {
        const numBlock = document.querySelector(`[data-id="${numBlockId}"]`);
        if (numBlock) {
          const content = numBlock.querySelector('.text-content');
          if (content && content.textContent && content.textContent.trim()) {
            text = content.textContent.trim();
          }
        }
      }
    }
    showTip(`已选中: ${text} - ${anim.anim} (${anim.startTime}s)`);
  }
}

// 键盘事件监听 - 按Delete删除选中的动画帧
document.addEventListener('keydown', async (e) => {
  // 正在编辑文字时不删除动画
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedAnimFrames.length > 0) {
      const count = selectedAnimFrames.length;
      if (await showConfirm(`删除 ${count} 个选中的动画帧？`)) {
        // 按blockId分组，并按index降序排序（从后往前删除，避免索引错乱）
        const grouped = {};
        selectedAnimFrames.forEach(f => {
          if (!grouped[f.blockId]) grouped[f.blockId] = [];
          // 如果是多选动画，展开indices数组
          if (f.isMulti && f.indices) {
            grouped[f.blockId].push(...f.indices);
          } else {
            grouped[f.blockId].push(f.index);
          }
        });
        
        // 每个blockId的动画按index降序排序后删除
        Object.keys(grouped).forEach(blockId => {
          // 去重
          const uniqueIndices = [...new Set(grouped[blockId])];
          uniqueIndices.sort((a, b) => b - a).forEach(index => {
            if (index >= 0 && index < blockAnimations[blockId].length) {
              blockAnimations[blockId].splice(index, 1);
            }
          });
          
          // 如果是普通文字块且没有动画了，保持可见并清除动画样式
          if (blockId !== '__bg__' && blockAnimations[blockId].length === 0) {
            const block = getBlockElement(blockId);
            if (block) {
              block.style.visibility = 'visible';
              block.style.transform = '';
              block.style.opacity = '';
              Array.from(block.classList).filter(c => c.startsWith('anim-')).forEach(cls => block.classList.remove(cls));
              stopHalfFilterAnimation(block);
            }
          }
        });
        
        selectedAnimFrames = [];
        renderTimeline();
        showTip(`已删除 ${count} 个动画帧`);
      }
    }
  }
  
  // Escape取消选中
  if (e.key === 'Escape') {
    selectedAnimFrames.forEach(f => {
      f.element.style.outline = '';
      f.element.style.boxShadow = '';
    });
    selectedAnimFrames = [];
  }
});

// 渲染时间轴
function renderTimeline() {
  keyframesTracks.innerHTML = '';
  
  // 创建单帧预览区域
  const previewSection = document.createElement('div');
  previewSection.id = 'framePreview';
  previewSection.style.cssText = 'padding:10px;background:#f8f9fa;border-radius:8px;margin-bottom:10px;display:none';
  
  const previewTitle = document.createElement('div');
  previewTitle.style.cssText = 'font-size:12px;font-weight:600;color:#333;margin-bottom:8px';
  previewTitle.textContent = '单帧预览';
  previewSection.appendChild(previewTitle);
  
  const previewTime = document.createElement('div');
  previewTime.id = 'previewTime';
  previewTime.style.cssText = 'font-size:11px;color:#666;margin-bottom:8px';
  previewTime.textContent = '点击时间轴查看';
  previewSection.appendChild(previewTime);
  
  const previewContent = document.createElement('div');
  previewContent.id = 'previewContent';
  previewContent.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;min-height:40px';
  previewSection.appendChild(previewContent);
  
  keyframesTracks.appendChild(previewSection);
  
  // 创建时间轴区域
  const timelineSection = document.createElement('div');
  timelineSection.className = 'timeline-section';
  timelineSection.style.cssText = 'position:relative';
  
  // 计算最大时间并自动更新时间轴刻度
  let maxTime = 10;
  Object.keys(blockAnimations).forEach(blockId => {
    blockAnimations[blockId].forEach(anim => {
      const endTime = anim.startTime + anim.duration;
      if (endTime > maxTime) {
        maxTime = endTime;
      }
    });
  });
  // 考虑视频时长
  if (videoItems && videoItems.length > 0) {
    videoItems.forEach(video => {
      const endTime = video.startTime + video.duration;
      if (endTime > maxTime) {
        maxTime = endTime;
      }
    });
  }
  maxTime = Math.max(10, Math.ceil(maxTime));
  
  // 自动更新时间轴刻度
  initTimeline(maxTime);
  
  const timelineWidth = (maxTime * 80) + 100 + LABEL_OFFSET;
  
  // 按照 workspace 中文字块的 DOM 顺序渲染时间轴行
  const workspace = document.getElementById('workspace') || document.getElementById('blocksContainer');
  const workspaceBlocks = workspace ? Array.from(workspace.querySelectorAll('.text-block')) : [];
  
  // 按 DOM 顺序遍历文字块
  workspaceBlocks.forEach(block => {
    const blockId = block.dataset.id;
    if (!blockId) return;
    
    const anims = blockAnimations[blockId] || [];
    console.log('[renderTimeline] blockId:', blockId, 'anims:', anims.length, 'text:', block.querySelector('.text-content')?.textContent?.substring(0, 10));
    let text = '文字块';
    const content = block.querySelector('.text-content');
    if (content && content.textContent && content.textContent.trim()) {
      text = content.textContent.trim();
    }
    
    const row = document.createElement('div');
    row.className = 'track-row';
    row.dataset.blockId = blockId;
    row.draggable = true;
    
    const label = document.createElement('div');
    label.className = 'track-label';
    label.style.cursor = 'grab';
    label.title = '拖动可调整文字层顺序';
    
    // 拖动事件
    row.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('type', 'block');
      e.dataTransfer.setData('id', blockId);
      row.style.opacity = '0.5';
    });
    row.addEventListener('dragover', (e) => {
        e.preventDefault();
        row.style.background = '#e3f2fd';
      });
      row.addEventListener('dragleave', () => {
        row.style.background = '';
      });
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.style.background = '';
        const dragType = e.dataTransfer.getData('type');
        const dragId = e.dataTransfer.getData('id');
        if (dragType && dragId) {
          swapLayerZIndex(dragType, dragId, 'block', blockId);
        }
      });
      row.addEventListener('dragend', () => {
      row.style.opacity = '1';
    });
    
    const labelText = document.createElement('span');
    labelText.className = 'track-label-text';
    labelText.textContent = text.length > 6 ? text.substring(0, 6) + '...' : text;
    labelText.style.flex = '1';
    labelText.style.overflow = 'hidden';
    labelText.style.textOverflow = 'ellipsis';
    labelText.style.whiteSpace = 'nowrap';
    label.appendChild(labelText);
    

    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'track-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = '删除文字块';
    deleteBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const textBlockCount = workspace.querySelectorAll('.text-block').length;
      if (textBlockCount <= 1) {
        showTip('不能删除最后一个文字块');
        return;
      }
      if (confirm('确定要删除这个文字块吗？')) {
        deleteBlock(block);
        renderTimeline();
      }
    });
    label.appendChild(deleteBtn);
    
    // 点击label选中对应文字块（在 mousedown 中处理选中）
    label.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      
      const isModifierKey = e.shiftKey || e.ctrlKey || e.metaKey;
      const isAlreadySelected = selectedBlocks.includes(block);
      
      if (isModifierKey) {
        // Shift 多选
        if (isAlreadySelected) {
          selectedBlocks.splice(selectedBlocks.indexOf(block), 1);
          block.classList.remove('selected');
        } else {
          selectedBlocks.push(block);
          block.classList.add('selected');
        }
      } else {
        // 单选
        selectedBlocks.forEach(b => b.classList.remove('selected'));
        selectedBlocks = [block];
        block.classList.add('selected');
      }
      
      // 更新控制面板
      if (selectedBlocks.length > 0) {
        updatePanelForBlock(selectedBlocks[0]);
        updateWeightAnimButtonState();
        highlightTimelineForSelected();
      }
    });
    
    // 拖动label改变文字层顺序
    label.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      timelineDragState.type = 'text';
      timelineDragState.active = true;
      timelineDragState.startY = e.clientY;
      timelineDragState.blockId = blockId;
      timelineDragState.currentDropTarget = null;
      label.style.cursor = 'grabbing';
      label.style.opacity = '0.7';
      e.stopPropagation();
      e.preventDefault();
    });
    
    row.appendChild(label);
    
    const bar = document.createElement('div');
    bar.className = 'track-bar';
    bar.dataset.blockId = blockId;
    bar.style.minWidth = timelineWidth + 'px';
    
    // 双击空白区域添加动画（无动画的块也可以打开弹窗）
    bar.addEventListener('dblclick', (e) => {
      if (e.target !== bar) return;
      e.stopPropagation();
      // 选中当前块
      if (!selectedBlocks.includes(block)) {
        selectedBlocks.forEach(b => b.classList.remove('selected'));
        selectedBlocks = [block];
        block.classList.add('selected');
        updatePanelForBlock(block);
        updateWeightAnimButtonState();
        highlightTimelineForSelected();
      }
      // 打开动画编辑弹窗（空 indices 表示添加新动画）
      showEditAnimModal(blockId, []);
    });
    
    // 将动画按时间点分组，同一时间点的可叠加动画（preset、weight、path）合并显示
    const multiTypes = ['preset', 'weight', 'path'];
    const groupedAnims = [];
    const processedIndices = new Set();
    
    anims.forEach((anim, index) => {
      if (processedIndices.has(index)) return;
      
      // 检查是否是可叠加动画类型
      if (multiTypes.includes(anim.type)) {
        // 查找同一时间点的所有可叠加动画（使用索引而不是对象引用）
        const sameTimeIndices = [];
        anims.forEach((a, i) => {
          if (!processedIndices.has(i) &&
              Math.abs(a.startTime - anim.startTime) < 0.1 &&
              multiTypes.includes(a.type)) {
            sameTimeIndices.push(i);
          }
        });
        
        if (sameTimeIndices.length > 1) {
          // 多个可叠加动画，合并为一个显示
          const sameTimeAnims = sameTimeIndices.map(i => anims[i]);
          sameTimeIndices.forEach(i => processedIndices.add(i));
          
          groupedAnims.push({
            type: 'multi',
            anims: sameTimeAnims,
            startTime: anim.startTime,
            duration: Math.max(...sameTimeAnims.map(a => a.duration)),
            indices: sameTimeIndices
          });
        } else {
          // 单个可叠加动画
          processedIndices.add(index);
          groupedAnims.push({
            type: anim.type,
            anim: anim.anim,
            startTime: anim.startTime,
            duration: anim.duration,
            index: index
          });
        }
      } else {
        // 非可叠加动画（in、out等）
        processedIndices.add(index);
        groupedAnims.push({
          type: anim.type,
          anim: anim.anim,
          startTime: anim.startTime,
          duration: anim.duration,
          index: index
        });
      }
    });
    
    groupedAnims.forEach((group) => {
      const item = document.createElement('div');
      
      if (group.type === 'multi') {
        // 多选动画合并显示
        item.className = 'track-item multi';
        item.style.left = (group.startTime * 80) + 'px';
        item.style.width = (group.duration * 80) + 'px';
        
        // 显示多选动画类型：预设+字重+路径等
        // 预设动画显示具体名称，其他显示类型
        const typeLabels = group.anims.map(a => {
          if (a.type === 'preset') return getAnimName('preset', a.anim);
          if (a.type === 'weight') return '字重';
          if (a.type === 'path') {
            const modeMap = { freehand: '随意', straight: '直线', curve: '曲线' };
            return '路径(' + (modeMap[a.pathMode] || '随意') + ')';
          }
          return getAnimName(a.type, a.anim);
        });
        item.textContent = '多选：' + typeLabels.join('+');
        item.dataset.multiIndices = JSON.stringify(group.indices);
      } else {
        // 单个动画
        item.className = `track-item ${group.type}`;
        item.style.left = (group.startTime * 80) + 'px';
        item.style.width = (group.duration * 80) + 'px';

        const animName = getAnimName(group.type, group.anim);
        item.textContent = animName;
        item.dataset.animIndex = group.index;

        const typeLabels = { in: '入场', out: '出场', preset: '预设', weight: '字重', path: '路径' };
        const typeLabel = typeLabels[group.type] || group.type;
        let titleText = `${animName} (${typeLabel})\n开始: ${group.startTime}s  持续: ${group.duration}s`;
        const originalAnim = blockAnimations[blockId]?.[group.index];
        if (originalAnim) {
          if (originalAnim.type === 'weight') {
            titleText += `\n字重: ${originalAnim.weightAnimMin ?? 100}-${originalAnim.weightAnimMax ?? 900}  速度: ${originalAnim.weightAnimSpeed ?? 1}`;
          }
          if (originalAnim.type === 'path') {
            const modeMap = { freehand: '随意', straight: '直线', curve: '曲线' };
            titleText += `\n模式: ${modeMap[originalAnim.pathMode] || '随意'}  点数: ${originalAnim.path?.length || 0}`;
          }
        }
        item.title = titleText;
      }
      
      item.dataset.blockId = blockId;
      
      // 单击选中动画帧（支持Shift多选）
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (group.type === 'multi') {
          // 多选动画：选中整个合并的动画
          // 如果没有按住Shift，清除之前的选中
          if (!e.shiftKey) {
            selectedAnimFrames.forEach(f => {
              f.element.style.outline = '';
              f.element.style.boxShadow = '';
            });
            selectedAnimFrames = [];
          }
          // 检查是否已经选中（通过item元素判断）
          const existingIndex = selectedAnimFrames.findIndex(f => f.element === item);
          if (existingIndex < 0) {
            selectedAnimFrames.push({ element: item, blockId, index: -1, isMulti: true, indices: group.indices });
            item.style.outline = '2px solid #007aff';
            item.style.boxShadow = '0 0 8px rgba(0,122,255,0.5)';
          }
          showTip(`已选中 ${selectedAnimFrames.length} 个动画帧`);
        } else {
          selectAnimFrame(item, blockId, group.index, e);
        }
      });
      
      // 双击打开修改动画弹窗
      item.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (group.type === 'multi') {
          // 多选动画：打开多选动画编辑弹窗
          showEditAnimModal(blockId, group.indices);
        } else {
          showEditAnimModal(blockId, [group.index]);
        }
      });
      
      // 拖动调整时间（支持多选移动）
      item.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();

        let isDraggingLocal = false;
        let startX = e.clientX;
        let startTimesLocal = [];
        let needSelect = false;

        // 收集需要移动的数据
        if (group.type === 'multi') {
          startTimesLocal = group.indices.map(idx => ({
            blockId: blockId,
            index: idx,
            startTime: blockAnimations[blockId][idx].startTime
          }));
        } else {
          const currentIndex = group.index;
          const isSelected = selectedAnimFrames.some(f => f.blockId === blockId && f.index === currentIndex);
          needSelect = !isSelected;

          if (isSelected) {
            startTimesLocal = selectedAnimFrames
              .filter(f => f.index >= 0 && blockAnimations[f.blockId] && blockAnimations[f.blockId][f.index])
              .map(f => ({
                blockId: f.blockId,
                index: f.index,
                startTime: blockAnimations[f.blockId][f.index].startTime
              }));
          } else {
            startTimesLocal = [{
              blockId: blockId,
              index: currentIndex,
              startTime: group.startTime
            }];
          }
        }

        const onMouseMove = (e) => {
          e.preventDefault();
          const deltaX = e.clientX - startX;
          if (!isDraggingLocal && Math.abs(deltaX) <= 5) return;

          if (!isDraggingLocal) {
            isDraggingLocal = true;
            item.style.cursor = 'grabbing';

            if (group.type !== 'multi' && needSelect) {
              selectedAnimFrames.forEach(f => {
                f.element.style.outline = '';
                f.element.style.boxShadow = '';
              });
              selectedAnimFrames = [{ element: item, blockId, index: group.index }];
              item.style.outline = '2px solid #007aff';
              item.style.boxShadow = '0 0 8px rgba(0,122,255,0.5)';

              startTimesLocal = [{
                blockId: blockId,
                index: group.index,
                startTime: group.startTime
              }];
            }
          }

          const deltaTime = deltaX / 80;

          startTimesLocal.forEach(st => {
            const newStartTime = Math.max(0, st.startTime + deltaTime);
            blockAnimations[st.blockId][st.index].startTime = newStartTime;

            // 更新对应的单个动画元素
            const el = document.querySelector(`.track-item[data-block-id="${st.blockId}"][data-anim-index="${st.index}"]`);
            if (el) el.style.left = (newStartTime * 80) + 'px';
          });

          // 更新 multi 元素本身
          if (group.type === 'multi' && document.contains(item)) {
            const newStartTime = Math.max(0, group.startTime + deltaTime);
            item.style.left = (newStartTime * 80) + 'px';
          }
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          if (isDraggingLocal) {
            item.style.cursor = 'grab';
            renderTimeline();
          }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
      
      bar.appendChild(item);
    });
    
    // 点击轨道空白区域添加动画
    bar.addEventListener('click', (e) => {
      if (e.target !== bar) return; // 只响应轨道空白区域
      
      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const time = Math.max(0, Math.round(clickX / 80 * 2) / 2);
      
      // 入场和出场动画不能重叠，但动画预设可以添加多个且可以与任何动画叠加
      const hasNonPresetOverlap = anims.some(a => a.type !== 'preset' && a.type !== 'weight' && a.type !== 'path' && time >= a.startTime && time < a.startTime + a.duration);
      if (hasNonPresetOverlap) {
        showTip('该时间点已有入场/出场动画，可添加动画预设');
        addAnimToBlock(blockId, 'preset', 'pulse', time);
        return;
      }
      
      // 检查是否有文字块被选中
      const isSelected = selectedBlocks.some(b => b.dataset.id === blockId);
      if (!isSelected) {
        showTip('请先选中该文字块');
        return;
      }
      
      // 使用修改动画弹出框来添加新动画
      // 先清空编辑状态
      editingSelectedAnims = [];
      // 设置默认开始时间
      const startTimeInput = document.getElementById('editAnimStartTime');
      if (startTimeInput) startTimeInput.value = time;
      // 打开添加动画弹窗
      showEditAnimModal(blockId, []);
    });
    
    row.appendChild(bar);
    timelineSection.appendChild(row);
  });
  
  // 渲染背景图轨道（在文字块轨道之后，背景层动画之前）
  if (bgImages && bgImages.length > 0) {
    bgImages.forEach((bgImage, imgIndex) => {
      const bgImgRow = document.createElement('div');
      bgImgRow.className = 'bg-track-row';
      bgImgRow.dataset.bgImageId = bgImage.id;
      bgImgRow.draggable = true;
      
      const bgImgLabel = document.createElement('div');
      bgImgLabel.className = 'bg-track-label';
      bgImgLabel.title = '拖动可调整背景图层顺序';
      
      // 拖动事件
      bgImgRow.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('type', 'bgImage');
        e.dataTransfer.setData('id', bgImage.id);
        bgImgRow.style.opacity = '0.5';
      });
      bgImgRow.addEventListener('dragover', (e) => {
        e.preventDefault();
        bgImgRow.style.background = '#e3f2fd';
      });
      bgImgRow.addEventListener('dragleave', () => {
        bgImgRow.style.background = '';
      });
      bgImgRow.addEventListener('drop', (e) => {
        e.preventDefault();
        bgImgRow.style.background = '';
        const dragType = e.dataTransfer.getData('type');
        const dragId = e.dataTransfer.getData('id');
        if (dragType && dragId) {
          swapLayerZIndex(dragType, dragId, 'bgImage', bgImage.id);
        }
      });
      bgImgRow.addEventListener('dragend', () => {
        bgImgRow.style.opacity = '1';
      });
      
      const thumb = document.createElement('img');
      thumb.src = bgImage.src;
      thumb.className = 'bg-track-thumb';
      thumb.draggable = false;
      bgImgLabel.appendChild(thumb);
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = bgImage.name.length > 4 ? bgImage.name.substring(0, 4) + '...' : bgImage.name;
      nameSpan.style.flex = '1';
      nameSpan.style.overflow = 'hidden';
      nameSpan.style.textOverflow = 'ellipsis';
      nameSpan.style.whiteSpace = 'nowrap';
      bgImgLabel.appendChild(nameSpan);
      

      const deleteBtn = document.createElement('div');
      deleteBtn.className = 'track-delete-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = '删除背景图';
      deleteBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
      });
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (confirm('确定要删除这个背景图吗？')) {
          deleteBgImage(bgImage.id);
        }
      });
      bgImgLabel.appendChild(deleteBtn);
      
      bgImgRow.appendChild(bgImgLabel);
      
      const bgImgBar = document.createElement('div');
      bgImgBar.className = 'bg-track-bar';
      bgImgBar.style.minWidth = timelineWidth + 'px';
      
      const bgImgItem = document.createElement('div');
      bgImgItem.className = 'bg-track-item';
      bgImgItem.style.left = (bgImage.startTime * 80) + 'px';
      bgImgItem.style.width = (bgImage.duration * 80) + 'px';
      bgImgItem.innerHTML = `<span class="duration-text">静态</span><div class="resize-handle-right"></div>`;
      bgImgItem.title = bgImage.name;
      
      bgImgItem.addEventListener('click', (e) => {
        e.stopPropagation();
        selectBgImage(bgImage.id);
      });
      
      let isDraggingBgItem = false;
      let isResizingBgItem = false;
      let dragBgItemStartX = 0;
      let dragBgOrigStartTime = 0;
      let dragBgOrigDuration = 0;
      let bgItemMoveThreshold = 2;
      let bgItemHasMoved = false;
      
      const resizeHandle = bgImgItem.querySelector('.resize-handle-right');
      
      const onBgItemMouseMove = (e) => {
        if (isResizingBgItem) {
          const dx = e.clientX - dragBgItemStartX;
          let newDuration = Math.max(0.5, dragBgOrigDuration + dx / 80);
          bgImage.duration = newDuration;
          bgImgItem.style.width = (newDuration * 80) + 'px';
          if (typeof updateTimelineMaxTime === 'function') {
            updateTimelineMaxTime();
          }
          return;
        }
        if (!isDraggingBgItem) return;
        const dx = e.clientX - dragBgItemStartX;
        if (Math.abs(dx) > bgItemMoveThreshold) {
          bgItemHasMoved = true;
        }
        let newStartTime = Math.max(0, dragBgOrigStartTime + dx / 80);
        bgImage.startTime = newStartTime;
        bgImgItem.style.left = (newStartTime * 80) + 'px';
      };
      
      const onBgItemMouseUp = () => {
        if (isResizingBgItem) {
          isResizingBgItem = false;
          document.removeEventListener('mousemove', onBgItemMouseMove);
          document.removeEventListener('mouseup', onBgItemMouseUp);
          return;
        }
        if (!isDraggingBgItem) {
          document.removeEventListener('mousemove', onBgItemMouseMove);
          document.removeEventListener('mouseup', onBgItemMouseUp);
          return;
        }
        isDraggingBgItem = false;
        bgImgItem.style.cursor = 'grab';
        if (typeof updateTimelineMaxTime === 'function') {
          updateTimelineMaxTime();
        }
        document.removeEventListener('mousemove', onBgItemMouseMove);
        document.removeEventListener('mouseup', onBgItemMouseUp);
      };
      
      resizeHandle.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isResizingBgItem = true;
        dragBgItemStartX = e.clientX;
        dragBgOrigDuration = bgImage.duration;
        e.stopPropagation();
        e.preventDefault();
        document.addEventListener('mousemove', onBgItemMouseMove);
        document.addEventListener('mouseup', onBgItemMouseUp);
      });
      
      bgImgItem.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target === resizeHandle) return;
        isDraggingBgItem = true;
        bgItemHasMoved = false;
        dragBgItemStartX = e.clientX;
        dragBgOrigStartTime = bgImage.startTime;
        bgImgItem.style.cursor = 'grabbing';
        e.stopPropagation();
        e.preventDefault();
        document.addEventListener('mousemove', onBgItemMouseMove);
        document.addEventListener('mouseup', onBgItemMouseUp);
      });
      
      bgImgBar.appendChild(bgImgItem);
      
      bgImgItem.addEventListener('dblclick', (e) => {
        if (bgItemHasMoved) return;
        e.stopPropagation();
        selectBgImage(bgImage.id);
        showEditAnimModal('bg_' + bgImage.id, []);
      });
      
      bgImgBar.addEventListener('dblclick', (e) => {
        if (e.target !== bgImgBar) return;
        e.stopPropagation();
        selectBgImage(bgImage.id);
        showEditAnimModal('bg_' + bgImage.id, []);
      });
      
      // 渲染背景图动画条目
      const bgAnimKey = 'bg_' + bgImage.id;
      const bgAnims = blockAnimations[bgAnimKey] || [];
      bgAnims.forEach((anim, animIndex) => {
        const animItem = document.createElement('div');
        animItem.className = 'track-item ' + anim.type;
        animItem.style.left = (anim.startTime * 80) + 'px';
        animItem.style.width = (anim.duration * 80) + 'px';
        animItem.textContent = getAnimName(anim.type, anim.anim);
        animItem.dataset.animIndex = animIndex;
        animItem.dataset.blockId = bgAnimKey;

        // 单击选中动画帧
        animItem.addEventListener('click', (e) => {
          e.stopPropagation();
          selectAnimFrame(animItem, bgAnimKey, animIndex, e);
        });

        // 双击打开修改动画弹窗
        animItem.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          showEditAnimModal(bgAnimKey, animIndex);
        });

        // 拖动调整时间
        animItem.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          e.preventDefault();

          let isDraggingLocal = false;
          let startX = e.clientX;
          let origStartTime = anim.startTime;

          const onMouseMove = (e) => {
            e.preventDefault();
            const dx = e.clientX - startX;
            if (!isDraggingLocal && Math.abs(dx) < 5) return;
            if (!isDraggingLocal) {
              isDraggingLocal = true;
              animItem.style.cursor = 'grabbing';
            }
            const newStartTime = Math.max(0, origStartTime + dx / 80);
            anim.startTime = newStartTime;
            if (document.contains(animItem)) {
              animItem.style.left = (newStartTime * 80) + 'px';
            }
          };

          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            if (isDraggingLocal) {
              animItem.style.cursor = 'grab';
              if (typeof updateTimelineMaxTime === 'function') {
                updateTimelineMaxTime();
              }
            }
          };

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        });

        bgImgBar.appendChild(animItem);
      });
      bgImgRow.appendChild(bgImgBar);
      
      // 拖动label调整图层顺序
      bgImgLabel.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        timelineDragState.type = 'bg';
        timelineDragState.active = true;
        timelineDragState.startY = e.clientY;
        timelineDragState.startIndex = imgIndex;
        timelineDragState.blockId = bgImage.id;
        bgImgLabel.style.cursor = 'grabbing';
        bgImgLabel.style.opacity = '0.7';
        e.stopPropagation();
        e.preventDefault();
      });
      
      timelineSection.appendChild(bgImgRow);
    });
  }
  
  // 渲染视频轨道（在背景图轨道之后，背景层动画之前）
  if (videoItems && videoItems.length > 0) {
    videoItems.forEach((video, videoIndex) => {
      const videoRow = document.createElement('div');
      videoRow.className = 'video-track-row';
      videoRow.dataset.videoId = video.id;
      videoRow.draggable = true;
      
      const videoLabel = document.createElement('div');
      videoLabel.className = 'video-track-label';
      videoLabel.title = '拖动可调整视频图层顺序';
      
      // 拖动事件
      videoRow.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('type', 'video');
        e.dataTransfer.setData('id', video.id);
        videoRow.style.opacity = '0.5';
      });
      videoRow.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoRow.style.background = '#e3f2fd';
      });
      videoRow.addEventListener('dragleave', () => {
        videoRow.style.background = '';
      });
      videoRow.addEventListener('drop', (e) => {
        e.preventDefault();
        videoRow.style.background = '';
        const dragType = e.dataTransfer.getData('type');
        const dragId = e.dataTransfer.getData('id');
        if (dragType && dragId) {
          // 交换层级
          swapLayerZIndex(dragType, dragId, 'video', video.id);
        }
      });
      videoRow.addEventListener('dragend', () => {
        videoRow.style.opacity = '1';
      });
      
      const thumb = document.createElement('div');
      thumb.className = 'video-track-thumb';
      thumb.style.display = 'flex';
      thumb.style.alignItems = 'center';
      thumb.style.justifyContent = 'center';
      thumb.style.fontSize = '12px';
      thumb.textContent = '🎬';
      videoLabel.appendChild(thumb);
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = video.name.length > 4 ? video.name.substring(0, 4) + '...' : video.name;
      nameSpan.style.flex = '1';
      nameSpan.style.overflow = 'hidden';
      nameSpan.style.textOverflow = 'ellipsis';
      nameSpan.style.whiteSpace = 'nowrap';
      videoLabel.appendChild(nameSpan);

      // 视频播放/停止控制按钮
      const playBtn = document.createElement('div');
      playBtn.className = 'video-play-btn';
      playBtn.innerHTML = '▶';
      playBtn.title = '播放/停止该视频';
      playBtn.style.cssText = 'cursor:pointer;padding:0 4px;font-size:12px;line-height:1;user-select:none;';
      const syncPlayBtn = () => {
        const ve = videoElements.get(video.id);
        playBtn.innerHTML = (ve && !ve.paused) ? '⏸' : '▶';
        playBtn.title = (ve && !ve.paused) ? '停止该视频' : '播放该视频';
      };
      playBtn.addEventListener('mousedown', (e) => { e.stopPropagation(); e.preventDefault(); });
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const ve = videoElements.get(video.id);
        if (!ve) return;
        if (ve.paused) {
          ve.currentTime = 0;
          ve.play().catch(() => {});
        } else {
          ve.pause();
          try { ve.currentTime = 0; } catch(err) {}
        }
        syncPlayBtn();
      });
      videoLabel.appendChild(playBtn);
      setTimeout(syncPlayBtn, 0);
      const _vIntv = setInterval(syncPlayBtn, 500);


      const deleteBtn = document.createElement('div');
      deleteBtn.className = 'track-delete-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = '删除视频';
      deleteBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
      });
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (confirm('确定要删除这个视频吗？')) {
          deleteVideo(video.id);
        }
      });
      videoLabel.appendChild(deleteBtn);
      
      videoRow.appendChild(videoLabel);
      
      const videoBar = document.createElement('div');
      videoBar.className = 'video-track-bar';
      videoBar.style.minWidth = timelineWidth + 'px';
      
      const videoItem = document.createElement('div');
      videoItem.className = 'video-track-item';
      videoItem.style.left = (video.startTime * 80) + 'px';
      videoItem.style.width = (video.duration * 80) + 'px';
      videoItem.innerHTML = `<span class="duration-text">静态</span><div class="resize-handle-right"></div>`;
      videoItem.title = video.name;
      
      videoItem.addEventListener('click', (e) => {
        e.stopPropagation();
        selectVideo(video.id);
      });
      
      let isDraggingVideoItem = false;
      let isResizingVideoItem = false;
      let dragVideoItemStartX = 0;
      let dragVideoOrigStartTime = 0;
      let dragVideoOrigDuration = 0;
      let videoItemMoveThreshold = 2;
      let videoItemHasMoved = false;
      
      const videoResizeHandle = videoItem.querySelector('.resize-handle-right');
      
      const onVideoItemMouseMove = (e) => {
        if (isResizingVideoItem) {
          const dx = e.clientX - dragVideoItemStartX;
          let newDuration = Math.max(0.5, dragVideoOrigDuration + dx / 80);
          video.duration = newDuration;
          videoItem.style.width = (newDuration * 80) + 'px';
          if (typeof updateTimelineMaxTime === 'function') {
            updateTimelineMaxTime();
          }
          return;
        }
        if (!isDraggingVideoItem) return;
        
        const dx = e.clientX - dragVideoItemStartX;
        if (Math.abs(dx) > videoItemMoveThreshold) {
          videoItemHasMoved = true;
        }
        let newStartTime = Math.max(0, dragVideoOrigStartTime + dx / 80);
        video.startTime = newStartTime;
        videoItem.style.left = (newStartTime * 80) + 'px';
      };
      
      const onVideoItemMouseUp = () => {
        if (isResizingVideoItem) {
          isResizingVideoItem = false;
          document.removeEventListener('mousemove', onVideoItemMouseMove);
          document.removeEventListener('mouseup', onVideoItemMouseUp);
          return;
        }
        if (!isDraggingVideoItem) {
          document.removeEventListener('mousemove', onVideoItemMouseMove);
          document.removeEventListener('mouseup', onVideoItemMouseUp);
          return;
        }
        isDraggingVideoItem = false;
        videoItem.style.cursor = 'grab';
        if (typeof updateTimelineMaxTime === 'function') {
          updateTimelineMaxTime();
        }
        document.removeEventListener('mousemove', onVideoItemMouseMove);
        document.removeEventListener('mouseup', onVideoItemMouseUp);
      };
      
      videoResizeHandle.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isResizingVideoItem = true;
        dragVideoItemStartX = e.clientX;
        dragVideoOrigDuration = video.duration;
        e.stopPropagation();
        e.preventDefault();
        document.addEventListener('mousemove', onVideoItemMouseMove);
        document.addEventListener('mouseup', onVideoItemMouseUp);
      });
      
      videoItem.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target === videoResizeHandle) return;
        isDraggingVideoItem = true;
        videoItemHasMoved = false;
        dragVideoItemStartX = e.clientX;
        dragVideoOrigStartTime = video.startTime;
        videoItem.style.cursor = 'grabbing';
        e.stopPropagation();
        e.preventDefault();
        document.addEventListener('mousemove', onVideoItemMouseMove);
        document.addEventListener('mouseup', onVideoItemMouseUp);
      });
      
      videoBar.appendChild(videoItem);
      
      videoItem.addEventListener('dblclick', (e) => {
        if (videoItemHasMoved) return;
        e.stopPropagation();
        selectVideo(video.id);
        showEditAnimModal('video_' + video.id, []);
      });
      
      videoBar.addEventListener('dblclick', (e) => {
        if (e.target !== videoBar) return;
        e.stopPropagation();
        selectVideo(video.id);
        showEditAnimModal('video_' + video.id, []);
      });
      
      // 渲染视频动画条目
      const videoAnimKey = 'video_' + video.id;
      const videoAnims = blockAnimations[videoAnimKey] || [];
      videoAnims.forEach((anim, animIndex) => {
        const animItem = document.createElement('div');
        animItem.className = 'track-item ' + anim.type;
        animItem.style.left = (anim.startTime * 80) + 'px';
        animItem.style.width = (anim.duration * 80) + 'px';
        animItem.textContent = getAnimName(anim.type, anim.anim);
        animItem.dataset.animIndex = animIndex;
        animItem.dataset.blockId = videoAnimKey;

        // 单击选中动画帧
        animItem.addEventListener('click', (e) => {
          e.stopPropagation();
          selectAnimFrame(animItem, videoAnimKey, animIndex, e);
        });

        // 双击打开修改动画弹窗
        animItem.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          showEditAnimModal(videoAnimKey, animIndex);
        });

        // 拖动调整时间
        animItem.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          e.preventDefault();

          let isDraggingLocal = false;
          let startX = e.clientX;
          let origStartTime = anim.startTime;

          const onMouseMove = (e) => {
            e.preventDefault();
            const dx = e.clientX - startX;
            if (!isDraggingLocal && Math.abs(dx) < 5) return;
            if (!isDraggingLocal) {
              isDraggingLocal = true;
              animItem.style.cursor = 'grabbing';
            }
            const newStartTime = Math.max(0, origStartTime + dx / 80);
            anim.startTime = newStartTime;
            if (document.contains(animItem)) {
              animItem.style.left = (newStartTime * 80) + 'px';
            }
          };

          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            if (isDraggingLocal) {
              animItem.style.cursor = 'grab';
              if (typeof updateTimelineMaxTime === 'function') {
                updateTimelineMaxTime();
              }
            }
          };

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        });

        videoBar.appendChild(animItem);
      });
      videoRow.appendChild(videoBar);
      
      videoLabel.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        timelineDragState.type = 'video';
        timelineDragState.active = true;
        timelineDragState.startY = e.clientY;
        timelineDragState.startIndex = videoIndex;
        timelineDragState.blockId = video.id;
        videoLabel.style.cursor = 'grabbing';
        videoLabel.style.opacity = '0.7';
        e.stopPropagation();
        e.preventDefault();
      });
      
      timelineSection.appendChild(videoRow);
    });
  }
  
  // 最后渲染背景层动画（放在最下面）
  const bgKey = '__bg__';
  const bgAnims = blockAnimations[bgKey] || [];
  // 始终显示背景层轨道，即使没有动画
  const bgRow = document.createElement('div');
  bgRow.className = 'track-row';
  bgRow.style.background = 'rgba(16,185,129,0.08)';
  
  const bgLabel = document.createElement('div');
  bgLabel.className = 'track-label';
  bgLabel.textContent = '🎬 镜头运镜';
  bgLabel.style.color = '#10b981';
  bgLabel.style.fontWeight = '600';
  bgRow.appendChild(bgLabel);
  
  const bgBar = document.createElement('div');
  bgBar.className = 'track-bar';
  bgBar.style.minWidth = timelineWidth + 'px';
  
  bgAnims.forEach((anim, index) => {
      const item = document.createElement('div');
      item.className = 'track-item bg';
      item.style.left = (anim.startTime * 80) + 'px';
      item.style.width = (anim.duration * 80) + 'px';
      item.style.background = '#10b981';
      
      let labelText = getBgAnimLabel(anim);
      item.textContent = labelText;
      
      item.dataset.blockId = bgKey;
      item.dataset.animIndex = index;
      
      // 单击选中动画帧（支持Shift多选）
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectAnimFrame(item, bgKey, index, e);
      });
      
      // 双击打开修改动画弹窗
      item.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        showEditBgAnimModal(index);
      });
      
      // 拖动调整时间（支持多选移动）
      let isDragging = false;
      let dragStarted = false;
      let startX = 0;
      let startTimes = []; // 存储所有选中帧的起始时间
      let needSelectOnMouseup = false; // 是否需要在 mouseup 时选中
      
      const onBgAnimMouseMove = (e) => {
        if (!dragStarted) return;
        
        // 只有移动距离超过5px才触发拖动
        const deltaX = e.clientX - startX;
        if (!isDragging && Math.abs(deltaX) > 5) {
          isDragging = true;
          item.style.cursor = 'grabbing';
          
          // 如果需要选中且触发了拖动，立即选中当前帧
          if (needSelectOnMouseup) {
            // 清除之前的选中
            selectedAnimFrames.forEach(f => {
              f.element.style.outline = '';
              f.element.style.boxShadow = '';
            });
            selectedAnimFrames = [{ element, blockId: bgKey, index }];
            element.style.outline = '2px solid #007aff';
            element.style.boxShadow = '0 0 8px rgba(0,122,255,0.5)';
            
            // 更新 startTimes 为只包含当前帧
            startTimes = [{
              blockId: bgKey,
              index: index,
              startTime: anim.startTime
            }];
          }
        }
        
        if (!isDragging) return;
        
        const deltaTime = deltaX / 80;
        
        // 同时移动所有选中的动画帧
        startTimes.forEach(st => {
          let newStartTime = Math.max(0, Math.round((st.startTime + deltaTime) * 10) / 10);
          blockAnimations[st.blockId][st.index].startTime = newStartTime;
        });
        
        // 更新所有相关帧的位置
        startTimes.forEach(st => {
          const trackBar = document.querySelector(`.track-bar[data-block-id="${st.blockId}"]`);
          if (trackBar) {
            const animItems = trackBar.querySelectorAll('.track-item');
            animItems.forEach(animItem => {
              const animIndex = parseInt(animItem.dataset.animIndex);
              if (!isNaN(animIndex) && animIndex === st.index) {
                const anim = blockAnimations[st.blockId][st.index];
                animItem.style.left = (anim.startTime * 80) + 'px';
              }
            });
          }
        });
      };
      
      const onBgAnimMouseUp = (e) => {
        if (dragStarted) {
          dragStarted = false;
          if (isDragging) {
            isDragging = false;
            item.style.cursor = 'grab';
            // 更新时间轴显示
            renderTimeline();
          }
          needSelectOnMouseup = false;
        }
        document.removeEventListener('mousemove', onBgAnimMouseMove);
        document.removeEventListener('mouseup', onBgAnimMouseUp);
      };
      
      item.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        dragStarted = true;
        startX = e.clientX;
        
        // 如果当前帧不在选中列表中，记录需要在 mouseup 时选中
        const isSelected = selectedAnimFrames.some(f => f.blockId === bgKey && f.index === index);
        needSelectOnMouseup = !isSelected;
        
        // 记录所有选中帧的起始时间（如果当前帧已选中，使用现有选中列表；否则只记录当前帧）
        if (isSelected) {
          startTimes = selectedAnimFrames.map(f => ({
            blockId: f.blockId,
            index: f.index,
            startTime: blockAnimations[f.blockId][f.index].startTime
          }));
        } else {
          // 当前帧未选中，拖动时只移动当前帧
          startTimes = [{
            blockId: bgKey,
            index: index,
            startTime: anim.startTime
          }];
        }
        
        e.stopPropagation();
        document.addEventListener('mousemove', onBgAnimMouseMove);
        document.addEventListener('mouseup', onBgAnimMouseUp);
      });
      
      bgBar.appendChild(item);
    });
    
    // 点击背景轨道空白区域添加动画
    bgBar.addEventListener('click', (e) => {
      if (e.target !== bgBar) return; // 只响应轨道空白区域
      
      const rect = bgBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const time = Math.max(0, Math.round(clickX / 80 * 10) / 10);
      
      // 设置开始时间并打开背景动画弹窗
      bgStartTime.value = time;
      editingBgAnimIndex = -1;
      bgAnimModal.style.display = 'flex';
    });
    
    bgRow.appendChild(bgBar);
    timelineSection.appendChild(bgRow);
  
  // 按 zIndex 对所有可拖动行排序（文字块、图片块、视频块）
  const allRows = Array.from(timelineSection.children);
  const draggableRows = [];
  let bgAnimRow = null;
  
  allRows.forEach(row => {
    const info = getTimelineRowInfo(row);
    if (info) {
      let zIndex = 0;
      if (info.type === 'block') {
        const block = getBlockElement(info.id);
        if (block) zIndex = parseInt(block.style.zIndex) || 0;
      } else if (info.type === 'bgImage') {
        const bg = bgImages.find(b => String(b.id) === String(info.id));
        if (bg) zIndex = bg.zIndex || 0;
      } else if (info.type === 'video') {
        const v = videoItems.find(v => String(v.id) === String(info.id));
        if (v) zIndex = v.zIndex || 0;
      }
      draggableRows.push({ row, zIndex });
    } else if (row.classList.contains('track-row')) {
      bgAnimRow = row;
    }
  });
  
  draggableRows.sort((a, b) => b.zIndex - a.zIndex);
  
  // 按 zIndex 顺序重新排列（appendChild 会自动移动元素，不会丢失事件监听器）
  draggableRows.forEach(item => {
    timelineSection.appendChild(item.row);
  });
  if (bgAnimRow) {
    timelineSection.appendChild(bgAnimRow);
  }
  
  keyframesTracks.appendChild(timelineSection);
  
  // 如果没有动画，显示提示
  if (Object.keys(blockAnimations).length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;color:#999;font-size:12px;padding:20px';
    empty.innerHTML = '暂无动画<br><span style="font-size:11px;color:#aaa">选中文字块后点击下方按钮添加，或在时间轴点击添加</span>';
    keyframesTracks.appendChild(empty);
  } else {
    // 添加操作提示
    const hint = document.createElement('div');
    hint.style.cssText = 'text-align:center;color:#aaa;font-size:10px;padding:4px;border-top:1px solid #eee';
    hint.innerHTML = '← 拖动调整时间 | 单击选中帧 | Delete删除 | 双击修改动画 | 点击轨道空白添加 →';
    keyframesTracks.appendChild(hint);
  }
  
  // 根据动画状态更新文字块可见性
  updateBlocksVisibility();
  // 高亮当前选中文字块对应的时间轴轨道
  highlightTimelineForSelected();
  // 根据当前时间更新文字块显示
  updateBlocksForTimelineTime();
  // 播放头高度自适应轨道内容
  updatePlayhead(currentTimelineTime);
}

// 更新文字块可见性
function updateBlocksVisibility() {
  const animatedBlockIds = new Set(Object.keys(blockAnimations).filter(id => blockAnimations[id].length > 0));
  animatedBlockIds.forEach(blockId => {
    const block = getBlockElement(blockId);
    if (!block) return;
    const anims = blockAnimations[blockId];
    if (anims.length > 0) {
      block.style.visibility = 'visible';
    }
  });
}

// 根据时间轴当前位置（currentTimelineTime）更新文字块显示
// 只有在当前时间点有动画正在播放时，文字块才显示
function updateBlocksForTimelineTime() {
  const t = currentTimelineTime;
  
  // 更新所有背景图的可见性
  if (typeof bgImages !== 'undefined' && bgImages && bgImages.length > 0) {
    bgImages.forEach(bgImg => {
      const el = blocksContainer ? blocksContainer.querySelector(`.bg-image-item[data-id="${bgImg.id}"]`) : null;
      if (!el) return;
      const visible = t >= bgImg.startTime && t < bgImg.startTime + bgImg.duration;
      el.style.visibility = visible ? 'visible' : 'hidden';
    });
  }
  
  // 更新所有视频的可见性
  if (typeof videoItems !== 'undefined' && videoItems && videoItems.length > 0) {
    videoItems.forEach(video => {
      const el = blocksContainer ? blocksContainer.querySelector(`.video-item[data-id="${video.id}"]`) : null;
      if (!el) return;
      const visible = t >= video.startTime && t < video.startTime + video.duration;
      el.style.visibility = visible ? 'visible' : 'hidden';
    });
  }
  
  // 更新文字块动画的可见性
  Object.keys(blockAnimations).forEach(blockId => {
    if (blockId === '__bg__') return;
    
    const block = getBlockElement(blockId);
    if (!block) return;
    const anims = blockAnimations[blockId];
    if (anims.length === 0) {
      block.style.visibility = 'hidden';
      return;
    }
    const hasActiveAnim = anims.some(anim => {
      return t >= anim.startTime && t < anim.startTime + anim.duration;
    });
    if (hasActiveAnim) {
      block.style.visibility = 'visible';
    } else {
      block.style.visibility = 'hidden';
    }
  });
}

// 高亮时间轴中对应已选文字块的轨道
function highlightTimelineForSelected() {
  document.querySelectorAll('.track-row').forEach(row => row.classList.remove('highlighted'));
  selectedBlocks.forEach(block => {
    const blockId = block.dataset.id;
    if (!blockId) return;
    const row = document.querySelector(`.track-row[data-block-id="${blockId}"]`);
    if (row) row.classList.add('highlighted');
  });
}

// 显示单帧预览（按时间轴行顺序：文字块 → 背景图 → 视频）
function showFramePreview(time) {
  const previewSection = document.getElementById('framePreview');
  const previewTime = document.getElementById('previewTime');
  const previewContent = document.getElementById('previewContent');
  
  if (!previewSection) return;
  
  previewSection.style.display = 'block';
  previewTime.textContent = `当前时间: ${time}s`;
  previewContent.innerHTML = '';
  
  // 按时间轴行顺序收集所有有动画的元素
  const items = [];
  
  // 1. 文字块（按 DOM 顺序，与时间轴行顺序一致）
  const workspace = document.getElementById('workspace') || document.getElementById('blocksContainer');
  const workspaceBlocks = workspace ? Array.from(workspace.querySelectorAll('.text-block')) : [];
  workspaceBlocks.forEach(block => {
    const blockId = block.dataset.id;
    if (!blockId) return;
    const anims = blockAnimations[blockId] || [];
    if (anims.length === 0) return;
    
    let activeAnim = null;
    let animType = '';
    anims.forEach(anim => {
      if (time >= anim.startTime && time < anim.startTime + anim.duration) {
        activeAnim = anim;
        animType = anim.type;
      }
    });
    if (!activeAnim) return;
    
    const content = block.querySelector('.text-content');
    const text = content && content.textContent && content.textContent.trim() ? content.textContent.trim() : '文字块';
    items.push({ text, animName: activeAnim.anim, animType, blockType: 'text' });
  });
  
  // 2. 背景图（按数组顺序，与时间轴行顺序一致）
  if (bgImages && bgImages.length > 0) {
    bgImages.forEach(bgImage => {
      const bgAnimKey = 'bg_' + bgImage.id;
      const anims = blockAnimations[bgAnimKey] || [];
      if (anims.length === 0) return;
      
      let activeAnim = null;
      let animType = '';
      anims.forEach(anim => {
        if (time >= anim.startTime && time < anim.startTime + anim.duration) {
          activeAnim = anim;
          animType = anim.type;
        }
      });
      if (!activeAnim) return;
      
      items.push({ text: bgImage.name, animName: activeAnim.anim, animType, blockType: 'bg' });
    });
  }
  
  // 3. 视频（按数组顺序，与时间轴行顺序一致）
  if (videoItems && videoItems.length > 0) {
    videoItems.forEach(video => {
      const videoAnimKey = 'video_' + video.id;
      const anims = blockAnimations[videoAnimKey] || [];
      if (anims.length === 0) return;
      
      let activeAnim = null;
      let animType = '';
      anims.forEach(anim => {
        if (time >= anim.startTime && time < anim.startTime + anim.duration) {
          activeAnim = anim;
          animType = anim.type;
        }
      });
      if (!activeAnim) return;
      
      items.push({ text: video.name, animName: activeAnim.anim, animType, blockType: 'video' });
    });
  }
  
  if (items.length === 0) {
    previewContent.innerHTML = '<div style="color:#999;font-size:11px">该时间点无动画</div>';
    return;
  }
  
  // 按时间轴行顺序渲染卡片
  items.forEach(item => {
    const card = document.createElement('div');
    const blockTypeIcon = item.blockType === 'text' ? '📝' : item.blockType === 'bg' ? '🖼' : '🎬';
    card.style.cssText = 'padding:6px 10px;background:#fff;border-radius:4px;font-size:11px;min-width:70px;text-align:center;display:inline-block';
    
    let typeLabel = '';
    let typeColor = '';
    if (item.animType === 'in') {
      typeLabel = '入场';
      typeColor = '#10b981';
    } else if (item.animType === 'out') {
      typeLabel = '出场';
      typeColor = '#f43f5e';
    } else {
      typeLabel = item.animType === 'preset' ? '预设' : item.animType === 'weight' ? '字重' : '路径';
      typeColor = '#f59e0b';
    }
    
    card.style.borderLeft = `3px solid ${typeColor}`;
    card.innerHTML = `<div style="font-weight:600;color:${typeColor}">${blockTypeIcon} ${item.text.substring(0, 6)}</div><div style="color:#666;font-size:10px">${item.animName}</div><div style="color:${typeColor};font-size:10px">${typeLabel}</div>`;
    previewContent.appendChild(card);
  });
}

// 显示动画选择器
function showAnimPicker(blockId, time) {
  const existing = document.getElementById('animPicker');
  if (existing) existing.remove();
  
  const picker = document.createElement('div');
  picker.id = 'animPicker';
  picker.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);padding:16px;z-index:10000;min-width:280px';
  
  const title = document.createElement('div');
  title.style.cssText = 'font-size:14px;font-weight:600;margin-bottom:4px;text-align:center';
  title.textContent = `在 ${time}s 处添加动画`;
  picker.appendChild(title);
  
  const subtitle = document.createElement('div');
  subtitle.style.cssText = 'font-size:11px;color:#999;margin-bottom:12px;text-align:center';
  subtitle.textContent = '动画预设、字重、路径动画可同时多选';
  picker.appendChild(subtitle);
  
  // 入场动画
  const inSection = document.createElement('div');
  inSection.style.cssText = 'margin-bottom:12px';
  const inTitle = document.createElement('div');
  inTitle.style.cssText = 'font-size:12px;color:#10b981;font-weight:600;margin-bottom:8px';
  inTitle.textContent = '入场动画';
  inSection.appendChild(inTitle);
  
  const inBtns = document.createElement('div');
  inBtns.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
  animEffects.in.forEach(effect => {
    const btn = document.createElement('button');
    btn.style.cssText = 'padding:6px 12px;border:none;border-radius:6px;background:#ecfdf5;color:#10b981;font-size:12px;cursor:pointer';
    btn.textContent = effect.name;
    btn.addEventListener('click', () => {
      // 先添加已选中的多选动画
      if (pendingMultiAnims.length > 0) {
        pendingMultiAnims.forEach(anim => {
          addAnimToBlock(blockId, anim.type, anim.value, time);
        });
      }
      addAnimToBlock(blockId, 'in', effect.value, time);
      picker.remove();
    });
    inBtns.appendChild(btn);
  });
  inSection.appendChild(inBtns);
  picker.appendChild(inSection);
  
  // 记录已选中的多选动画，点击完成后再统一添加
  const pendingMultiAnims = [];
  
  // 动画预设（循环动画，可多选）
  const presetSection = document.createElement('div');
  presetSection.style.cssText = 'margin-bottom:12px';
  const presetTitle = document.createElement('div');
  presetTitle.style.cssText = 'font-size:12px;color:#8b5cf6;font-weight:600;margin-bottom:8px';
  presetTitle.textContent = '动画预设（可多选）';
  presetSection.appendChild(presetTitle);
  
  const presetBtns = document.createElement('div');
  presetBtns.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
  animEffects.preset.forEach(effect => {
    const btn = document.createElement('button');
    btn.style.cssText = 'padding:6px 12px;border:none;border-radius:6px;background:#f5f3ff;color:#8b5cf6;font-size:12px;cursor:pointer;border:1px solid #c4b5fd';
    btn.textContent = effect.name;
    btn.dataset.animValue = effect.value;
    btn.dataset.type = 'preset';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // 切换选中状态
      if (btn.dataset.selected === 'true') {
        // 取消选中
        btn.style.background = '#f5f3ff';
        btn.style.color = '#8b5cf6';
        btn.dataset.selected = 'false';
        const idx = pendingMultiAnims.findIndex(a => a.type === 'preset' && a.value === effect.value);
        if (idx > -1) pendingMultiAnims.splice(idx, 1);
        showTip(`已取消动画预设：${effect.name}`);
      } else {
        // 选中
        btn.style.background = '#8b5cf6';
        btn.style.color = '#fff';
        btn.dataset.selected = 'true';
        pendingMultiAnims.push({ type: 'preset', name: effect.name, value: effect.value });
        showTip(`已选择动画预设：${effect.name}，可继续选择其他动画，点击"完成添加"确认`);
      }
    });
    presetBtns.appendChild(btn);
  });
  presetSection.appendChild(presetBtns);
  picker.appendChild(presetSection);
  
  // 字重动画（循环动画，可多选）
  const weightSection = document.createElement('div');
  weightSection.style.cssText = 'margin-bottom:12px';
  const weightTitle = document.createElement('div');
  weightTitle.style.cssText = 'font-size:12px;color:#ec4899;font-weight:600;margin-bottom:8px';
  weightTitle.textContent = '字重动画（可多选）';
  weightSection.appendChild(weightTitle);
  
  const weightBtns = document.createElement('div');
  weightBtns.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
  animEffects.weight.forEach(effect => {
    const btn = document.createElement('button');
    btn.style.cssText = 'padding:6px 12px;border:none;border-radius:6px;background:#fdf2f8;color:#ec4899;font-size:12px;cursor:pointer;border:1px solid #f9a8d4';
    btn.textContent = effect.name;
    btn.dataset.animValue = effect.value;
    btn.dataset.type = 'weight';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // 切换选中状态
      if (btn.dataset.selected === 'true') {
        btn.style.background = '#fdf2f8';
        btn.style.color = '#ec4899';
        btn.dataset.selected = 'false';
        const idx = pendingMultiAnims.findIndex(a => a.type === 'weight' && a.value === effect.value);
        if (idx > -1) pendingMultiAnims.splice(idx, 1);
        showTip(`已取消字重动画：${effect.name}`);
      } else {
        btn.style.background = '#ec4899';
        btn.style.color = '#fff';
        btn.dataset.selected = 'true';
        pendingMultiAnims.push({ type: 'weight', name: effect.name, value: effect.value });
        showTip(`已选择字重动画：${effect.name}，可继续选择其他动画，点击"完成添加"确认`);
      }
    });
    weightBtns.appendChild(btn);
  });
  weightSection.appendChild(weightBtns);
  picker.appendChild(weightSection);
  
  // 路径动画（可多选）
  const pathSection = document.createElement('div');
  pathSection.style.cssText = 'margin-bottom:12px';
  const pathTitle = document.createElement('div');
  pathTitle.style.cssText = 'font-size:12px;color:#3b82f6;font-weight:600;margin-bottom:8px';
  pathTitle.textContent = '路径动画（可多选）';
  pathSection.appendChild(pathTitle);
  
  const pathBtns = document.createElement('div');
  pathBtns.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
  animEffects.path.forEach(effect => {
    const btn = document.createElement('button');
    btn.style.cssText = 'padding:6px 12px;border:none;border-radius:6px;background:#eff6ff;color:#3b82f6;font-size:12px;cursor:pointer;border:1px solid #93c5fd';
    btn.textContent = effect.name;
    btn.dataset.animValue = effect.value;
    btn.dataset.type = 'path';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // 切换选中状态
      if (btn.dataset.selected === 'true') {
        btn.style.background = '#eff6ff';
        btn.style.color = '#3b82f6';
        btn.dataset.selected = 'false';
        const idx = pendingMultiAnims.findIndex(a => a.type === 'path' && a.value === effect.value);
        if (idx > -1) pendingMultiAnims.splice(idx, 1);
        showTip(`已取消路径动画：${effect.name}`);
      } else {
        btn.style.background = '#3b82f6';
        btn.style.color = '#fff';
        btn.dataset.selected = 'true';
        pendingMultiAnims.push({ type: 'path', name: effect.name, value: effect.value });
        showTip(`已选择路径动画：${effect.name}，可继续选择其他动画，点击"完成添加"确认`);
      }
    });
    pathBtns.appendChild(btn);
  });
  pathSection.appendChild(pathBtns);
  picker.appendChild(pathSection);
  
  // 出场动画
  const outSection = document.createElement('div');
  const outTitle = document.createElement('div');
  outTitle.style.cssText = 'font-size:12px;color:#f43f5e;font-weight:600;margin-bottom:8px';
  outTitle.textContent = '出场动画';
  outSection.appendChild(outTitle);
  
  const outBtns = document.createElement('div');
  outBtns.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
  animEffects.out.forEach(effect => {
    const btn = document.createElement('button');
    btn.style.cssText = 'padding:6px 12px;border:none;border-radius:6px;background:#fff1f2;color:#f43f5e;font-size:12px;cursor:pointer';
    btn.textContent = effect.name;
    btn.addEventListener('click', () => {
      // 先添加已选中的多选动画
      if (pendingMultiAnims.length > 0) {
        pendingMultiAnims.forEach(anim => {
          addAnimToBlock(blockId, anim.type, anim.value, time);
        });
      }
      addAnimToBlock(blockId, 'out', effect.value, time);
      picker.remove();
    });
    outBtns.appendChild(btn);
  });
  outSection.appendChild(outBtns);
  picker.appendChild(outSection);
  
  // 完成按钮
  const doneBtn = document.createElement('button');
  doneBtn.style.cssText = 'width:100%;margin-top:12px;padding:8px;border:none;border-radius:6px;background:#10b981;color:#fff;font-size:12px;cursor:pointer;font-weight:600';
  doneBtn.textContent = '完成添加';
  doneBtn.addEventListener('click', () => {
    // 统一添加所有选中的多选动画
    if (pendingMultiAnims.length > 0) {
      pendingMultiAnims.forEach(anim => {
        addAnimToBlock(blockId, anim.type, anim.value, time);
      });
      showTip(`已添加 ${pendingMultiAnims.length} 个动画`);
    }
    picker.remove();
  });
  picker.appendChild(doneBtn);
  
  // 点击外部关闭
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!picker.contains(e.target)) {
        // 点击外部时，如果有选中的多选动画，也统一添加
        if (pendingMultiAnims.length > 0) {
          pendingMultiAnims.forEach(anim => {
            addAnimToBlock(blockId, anim.type, anim.value, time);
          });
          showTip(`已添加 ${pendingMultiAnims.length} 个动画`);
        }
        picker.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 100);
  
  document.body.appendChild(picker);
}

// 添加动画到指定时间点
function addAnimToBlock(blockId, type, animName, time) {
  if (!blockAnimations[blockId]) {
    blockAnimations[blockId] = [];
  }
  
  // 如果是可叠加动画类型，找到最后一个动画的结束时间，在后面添加新动画
  const multiTypes = ['preset', 'weight', 'path'];
  if (multiTypes.includes(type)) {
    const existingAnims = blockAnimations[blockId] || [];
    if (existingAnims.length > 0) {
      const lastAnim = existingAnims[existingAnims.length - 1];
      const lastEndTime = lastAnim.startTime + lastAnim.duration;
      // 如果指定的时间小于最后一个动画的结束时间，则在最后一个动画之后添加
      if (time < lastEndTime) {
        time = lastEndTime + 0.1;
      }
    }
  }
  
  const newAnim = {
    type: type,
    anim: animName,
    startTime: time,
    duration: (type === 'preset' || type === 'weight' || type === 'path') ? 2 : 1
  };
  if (type === 'path') newAnim.pathMode = currentPathMode;
  
  blockAnimations[blockId].push(newAnim);
  renderTimeline();
  
  // 添加动画后显示该块
  const block = getBlockElement(blockId);
  if (block) {
    block.style.visibility = 'visible';
  }
  
  const typeLabel = type === 'in' ? '入场' : type === 'out' ? '出场' : type === 'preset' ? '动画预设' : type === 'weight' ? '字重动画' : type === 'path' ? '路径动画(' + (currentPathMode === 'straight' ? '直线' : currentPathMode === 'curve' ? '曲线' : '随意') + ')' : '动画';
  showTip(`已在 ${time}s 处添加 ${typeLabel}：${animName}`);
  
  // 更新漫画预设卡片高亮
  if (typeof window.updateComicCardsHighlight === 'function') {
    window.updateComicCardsHighlight();
  }
}


// 根据 blockId 查找对应的 DOM 元素（支持文字块、图片、视频）
function getBlockElement(blockId) {
  if (!blockId) return null;
  if (blockId === '__bg__') return null;
  
  if (blockId.startsWith('bg_')) {
    const id = blockId.substring(3);
    const bc = document.getElementById('blocksContainer');
    if (bc) {
      return bc.querySelector(`.bg-image-item[data-id="${id}"]`);
    }
    return null;
  }
  
  if (blockId.startsWith('video_')) {
    const id = blockId.substring(6);
    const bc = document.getElementById('blocksContainer');
    if (bc) {
      return bc.querySelector(`.video-item[data-id="${id}"]`);
    }
    return null;
  }

  // 文字块限定在 blocksContainer 中查找，避免与图片/视频的 data-id 冲突
  const blocksContainer = document.getElementById('blocksContainer');
  if (blocksContainer) {
    return blocksContainer.querySelector(`.text-block[data-id="${blockId}"]`);
  }
  return document.querySelector(`[data-id="${blockId}"]`);
}

// 播放动画
playKeyframesBtn.addEventListener('click', () => {
  if (isPlaying) {
    stopAnimation();
    return;
  }
  
  // 收集所有需要播放的文字块
  const allAnims = [];
  
  Object.keys(blockAnimations).forEach(blockId => {
    // 背景层动画不需要对应的DOM元素
    if (blockId === '__bg__') {
      blockAnimations[blockId].forEach((anim, index) => {
        allAnims.push({ ...anim, blockId, index });
      });
      return;
    }
    const block = getBlockElement(blockId);
    if (!block) {
      delete blockAnimations[blockId];
      return;
    }
    blockAnimations[blockId].forEach((anim, index) => {
      allAnims.push({ ...anim, blockId, index });
    });
  });
  
  if (allAnims.length === 0 && (!videoItems || videoItems.length === 0)) {
    showTip('暂无动画或视频，请先添加动画或视频');
    return;
  }
  
  // 获取当前页面所有有动画的文字块ID（排除背景层）
  const animatedBlockIds = new Set(Object.keys(blockAnimations).filter(id => id !== '__bg__' && blockAnimations[id].length > 0));
  
  // 预缓存所有动画块元素 - 避免 rAF 循环中重复 DOM 查询
  clearBlockElementCache();
  animatedBlockIds.forEach(blockId => {
    updateBlockElementCache(blockId);
  });
  
  // 所有有动画的块初始隐藏（文字块、图片、视频）
  animatedBlockIds.forEach(blockId => {
    const block = getBlockElementCached(blockId);
    if (!block) return;
    block.style.visibility = 'hidden';
    const animClasses = Array.from(block.classList).filter(c => c.startsWith('anim-'));
    animClasses.forEach(cls => block.classList.remove(cls));
  });

  // 隐藏所有没有动画的文字块，确保0帧时画布为空
  document.querySelectorAll('.text-block').forEach(block => {
    if (!animatedBlockIds.has(block.dataset.id)) {
      block.style._origVisibility = block.style.visibility || '';
      block.style.visibility = 'hidden';
    }
  });
  // 图片/视频：无动画的保持原可见状态（默认背景元素），有动画的已经在上面 animatedBlockIds 循环里隐藏
  document.querySelectorAll('#blocksContainer .bg-image-item').forEach(item => {
    if (animatedBlockIds.has('bg_' + item.dataset.id)) {
      item.style._origVisibility = item.style.visibility || '';
      item.style.visibility = 'hidden';
    } else {
      // 没有动画的图，记录原始可见性以便停止时恢复
      if (item.style._origVisibility === undefined) item.style._origVisibility = item.style.visibility || '';
    }
  });
  document.querySelectorAll('#blocksContainer .video-item').forEach(item => {
    if (animatedBlockIds.has('video_' + item.dataset.id)) {
      item.style._origVisibility = item.style.visibility || '';
      item.style.visibility = 'hidden';
    } else {
      if (item.style._origVisibility === undefined) item.style._origVisibility = item.style.visibility || '';
    }
  });
  
  // 强制重排以重置CSS动画
  const previewContainer = document.querySelector('.preview-container');
  if (previewContainer) {
    void previewContainer.offsetHeight;
  }
  
  // 确保背景层容器初始状态正确
  const blocksContainerForPlay = document.getElementById('blocksContainer');
  if (blocksContainerForPlay) {
    blocksContainerForPlay.style.transition = '';
    applyTransform();
  }
  
  // 保存初始视图状态（用于循环播放时重置背景动画）
  const initialViewTranslateX = viewTranslateX;
  const initialViewTranslateY = viewTranslateY;
  const initialViewScale = viewScale;
  const initialViewRotate = viewRotate;
  const initialViewRotateX = viewRotateX;
  const initialViewRotateY = viewRotateY;
  
  // 保存到全局变量，停止时恢复
  playbackInitialViewState = {
    translateX: initialViewTranslateX,
    translateY: initialViewTranslateY,
    scale: initialViewScale,
    rotate: initialViewRotate,
    rotateX: initialViewRotateX,
    rotateY: initialViewRotateY,
    cameraX: cameraX,
    cameraY: cameraY,
    cameraZ: cameraZ,
    cameraPitch: cameraPitch,
    cameraYaw: cameraYaw,
    cameraRoll: cameraRoll,
    cameraFocalLength: cameraFocalLength,
    cameraDistance: cameraDistance,
    orbitCenterX: orbitCenterX,
    orbitCenterY: orbitCenterY,
    orbitCenterZ: orbitCenterZ
  };
  
  // 保存所有动画块的原始位置（用于循环播放时重置路径动画，以及停止时恢复）
  blockOrigPositions = {};
  animatedBlockIds.forEach(blockId => {
    const blk = getBlockElement(blockId);
    if (!blk) return;
    blockOrigPositions[blockId] = {
      left: parseFloat(blk.style.left) || 0,
      top: parseFloat(blk.style.top) || 0
    };
  });
  
  // 活跃背景运镜列表（每帧重新计算）
  activeBgMotions = [];
  
  isPlaying = true;
  playKeyframesBtn.textContent = '停止';
  let startTime = performance.now();
  
  // 重置时间轴位置到0，确保从0帧开始播放
  currentTimelineTime = 0;
  hasSelectedTime = false;
  updatePlayhead(0);
  
  // 同步更新展示区播放按钮状态
  updatePlayBtnState(true);
  
  allAnims.sort((a, b) => a.startTime - b.startTime);
  let maxTime = 0;
  if (allAnims.length > 0) {
    maxTime = Math.max(...allAnims.map(a => a.startTime + a.duration));
  }
  if (videoItems && videoItems.length > 0) {
    videoItems.forEach(video => {
      const videoEndTime = video.startTime + video.duration;
      if (videoEndTime > maxTime) {
        maxTime = videoEndTime;
      }
    });
  }
  if (maxTime === 0) maxTime = 10;
  
  // 初始化播放器总时长
  playerTotalTime = maxTime;
  totalTimeEl.textContent = formatTime(maxTime);
  
  // 记录已触发的动画（使用 blockId-index 确保每个动画都能被触发）
  const triggeredAnims = new Set();
  
  // 记录每个文字块的最后一个动画信息
  const blockLastAnim = {};
  allAnims.forEach(anim => {
    blockLastAnim[anim.blockId] = anim;
  });
  
  // 记录每个文字块当前已添加的动画类（用于叠加）
  const blockAnimClasses = {};
  animatedBlockIds.forEach(blockId => {
    blockAnimClasses[blockId] = [];
  });
  
  // 记录每个文字块已启动的预设动画列表（用于跨时间窗口叠加 - JS计算）
  const blockJsPresetAnims = {};
  animatedBlockIds.forEach(blockId => {
    blockJsPresetAnims[blockId] = []; // { name, startTime, duration, rotate, flipX, flipY }
  });

  // 恢复文字块原始内容（供 stopAnimation 全局调用）
  restoreShatteredBlocks = function() {
    Object.keys(blockCharSpans_global).forEach(blockId => {
      const block = getBlockElement(blockId);
      if (!block) return;
      const textContent = block.querySelector('.text-content');
      if (!textContent) return;
      if (blockOriginalHTML_global[blockId] !== undefined) {
        textContent.innerHTML = blockOriginalHTML_global[blockId];
      }
    });
    Object.keys(blockCharSpans_global).forEach(k => delete blockCharSpans_global[k]);
    Object.keys(blockOriginalHTML_global).forEach(k => delete blockOriginalHTML_global[k]);
  };

  // ===== 逐字符打散动画支持 =====
  // 存储文字块原始HTML，用于恢复
  const blockOriginalHTML = {};
  const blockOriginalHTML_global = blockOriginalHTML;
  // 存储已拆分的文字块字符span列表
  const blockCharSpans = {};
  const blockCharSpans_global = blockCharSpans;

  // 将文字块的文字内容拆分成单个字符span（支持换行）
  function splitBlockChars(block) {
    const textContent = block.querySelector('.text-content');
    if (!textContent) return [];
    const blockId = block.dataset.id;

    // 如果已经拆分过，直接返回
    if (blockCharSpans[blockId] && blockCharSpans[blockId].length > 0) {
      return blockCharSpans[blockId];
    }

    // 保存原始HTML
    blockOriginalHTML[blockId] = textContent.innerHTML;

    // 把 <br> 标签转为换行符，保留换行结构
    const temp = document.createElement('div');
    temp.innerHTML = textContent.innerHTML.replace(/<br\s*\/?>/gi, '\n');
    const rawText = temp.textContent;
    if (!rawText || rawText.length === 0) return [];

    // 拆分成单个字符，每个字符包裹在span中（包括空格和换行）
    const chars = Array.from(rawText); // 支持多字节字符
    textContent.innerHTML = '';
    const spans = [];
    chars.forEach((ch, idx) => {
      const span = document.createElement('span');
      span.className = 'shatter-char';
      span.textContent = ch;
      if (ch === '\n') {
        span.classList.add('shatter-newline');
        span.style.display = 'block';
        span.style.width = '100%';
        span.style.height = '0';
      } else if (ch === ' ') {
        span.classList.add('shatter-space');
        span.style.whiteSpace = 'pre';
      }
      textContent.appendChild(span);
      spans.push({ span: span, index: idx, total: chars.length });
    });

    blockCharSpans[blockId] = spans;
    return spans;
  }

  // 恢复文字块原始内容
  function restoreBlockChars(block) {
    const blockId = block.dataset.id;
    const textContent = block.querySelector('.text-content');
    if (!textContent) return;
    if (blockOriginalHTML[blockId] !== undefined) {
      textContent.innerHTML = blockOriginalHTML[blockId];
      delete blockOriginalHTML[blockId];
    }
    delete blockCharSpans[blockId];
  }

  // 计算每个字符的打散位移
  function calcCharScatter(charIndex, totalChars, progress, scatter, mode) {
    const pi2 = Math.PI * 2;
    const p = progress;
    // 散开因子：0->1->0（先散开再回归）
    let scatterFactor;
    if (p < 0.5) {
      scatterFactor = p * 2; // 0->1
    } else {
      scatterFactor = (1 - p) * 2; // 1->0
    }

    const halfTotal = Math.max(1, totalChars - 1) / 2;
    const centerOffset = charIndex - halfTotal; // 字符相对于中心的偏移

    let dx = 0, dy = 0, dr = 0, dScale = 1, dOpacity = 1;

    switch (mode) {
      case 'radial': {
        // 每个字符向不同方向辐射
        const angle = (charIndex / Math.max(1, totalChars)) * pi2 + (totalChars > 1 ? centerOffset * 0.3 : 0);
        dx = Math.cos(angle) * scatter * scatterFactor;
        dy = Math.sin(angle) * scatter * scatterFactor;
        dr = (centerOffset / halfTotal) * 30 * scatterFactor;
        dScale = 1 + 0.2 * scatterFactor * (centerOffset / halfTotal);
        break;
      }
      case 'vertical': {
        // 上下交替
        const dir = charIndex % 2 === 0 ? -1 : 1;
        dy = dir * scatter * scatterFactor;
        dx = centerOffset * 5 * scatterFactor;
        dr = dir * 15 * scatterFactor;
        break;
      }
      case 'horizontal': {
        // 左右交替
        const dir = charIndex % 2 === 0 ? -1 : 1;
        dx = dir * scatter * scatterFactor;
        dy = centerOffset * 3 * scatterFactor;
        dr = dir * 10 * scatterFactor;
        break;
      }
      case 'wave': {
        // 波浪式：每个字符按索引错开相位
        const phase = (charIndex / Math.max(1, totalChars)) * pi2;
        dy = Math.sin(phase + p * pi2) * scatter * scatterFactor;
        dx = Math.cos(phase + p * pi2) * scatter * 0.5 * scatterFactor;
        dr = Math.sin(phase + p * pi2 * 2) * 20 * scatterFactor;
        break;
      }
      case 'diagonal': {
        // 斜向飞散
        const dir = charIndex % 2 === 0 ? 1 : -1;
        dx = dir * scatter * scatterFactor;
        dy = -dir * scatter * 0.7 * scatterFactor;
        dr = dir * 20 * scatterFactor;
        dScale = 1 + 0.15 * scatterFactor * dir;
        break;
      }
      case 'spiral': {
        // 螺旋飞散
        const angle = (charIndex / Math.max(1, totalChars)) * pi2 * 2 + p * pi2 * 2;
        const radius = scatter * scatterFactor;
        dx = Math.cos(angle) * radius;
        dy = Math.sin(angle) * radius;
        dr = 360 * p * (centerOffset / halfTotal);
        break;
      }
      case 'bounce': {
        // 弹跳式
        const bouncePhase = (p + charIndex / Math.max(1, totalChars) * 0.3) * pi2;
        dy = -Math.abs(Math.sin(bouncePhase)) * scatter * scatterFactor;
        dx = centerOffset * 8 * scatterFactor;
        dScale = 1 + 0.1 * Math.sin(bouncePhase) * scatterFactor;
        break;
      }
      case 'random': {
        // 随机飞散：用索引作为 seed 生成固定随机方向
        const seed = charIndex * 137.5;
        const angle = (seed % 360) * (Math.PI / 180);
        dx = Math.cos(angle) * scatter * scatterFactor;
        dy = Math.sin(angle) * scatter * scatterFactor;
        dr = ((seed % 60) - 30) * scatterFactor;
        dScale = 1 + ((seed % 40) - 20) / 100 * scatterFactor;
        break;
      }
      case 'implode': {
        // 向内汇聚：与 radial 相反，先在外围再汇聚回原点
        const implodeFactor = 1 - scatterFactor; // 1->0->1
        const angle = (charIndex / Math.max(1, totalChars)) * pi2;
        dx = Math.cos(angle) * scatter * implodeFactor;
        dy = Math.sin(angle) * scatter * implodeFactor;
        dr = (centerOffset / halfTotal) * 30 * implodeFactor;
        dScale = 1 + 0.2 * implodeFactor * (centerOffset / halfTotal);
        break;
      }
      case 'stagger': {
        // 错位飞散：每个字符按索引错开相位
        const staggerOffset = charIndex / Math.max(1, totalChars);
        let localProgress = (p * 2 + staggerOffset) % 1;
        let localFactor = localProgress < 0.5 ? localProgress * 2 : (1 - localProgress) * 2;
        const angle = (charIndex / Math.max(1, totalChars)) * pi2;
        dx = Math.cos(angle) * scatter * localFactor;
        dy = Math.sin(angle) * scatter * localFactor;
        dr = (centerOffset / halfTotal) * 30 * localFactor;
        break;
      }
      case 'rain': {
        // 雨滴飞散：所有字符向下飞散
        dy = scatter * scatterFactor;
        dx = (centerOffset / halfTotal) * 10 * scatterFactor;
        dr = (centerOffset / halfTotal) * 20 * scatterFactor;
        break;
      }
      default: {
        // 默认辐射
        const angle = (charIndex / Math.max(1, totalChars)) * pi2;
        dx = Math.cos(angle) * scatter * scatterFactor;
        dy = Math.sin(angle) * scatter * scatterFactor;
        break;
      }
    }

    return { dx, dy, dr, dScale, dOpacity };
  }

  // 获取动画的perChar配置
  function getPerCharConfig(animName) {
    if (typeof AnimPluginLoader === 'undefined' || !AnimPluginLoader.isLoaded()) return null;
    const anim = AnimPluginLoader.getAnimationByName(animName);
    if (!anim || !anim.perChar) return null;
    return {
      perChar: true,
      scatter: anim.scatter || 50,
      scatterMode: anim.scatterMode || 'radial'
    };
  }

  // 计算一个块所有预设动画的叠加transform
  function applyBlockPresetAnims(blockId, elapsedSeconds) {
    const block = getBlockElementCached(blockId);
    if (!block) return;
    const anims = blockJsPresetAnims[blockId];
    if (!anims || anims.length === 0) return;

    const elapsedMs = elapsedSeconds * 1000;

    // ===== 检查是否有 perChar 打散动画 =====
    let perCharAnim = null;
    let perCharProgress = 0;
    let perCharActive = false;
    for (const anim of anims) {
      if (elapsedMs < anim.startTime) continue;
      const animElapsed = elapsedMs - anim.startTime;
      if (animElapsed > anim.duration) continue;
      const cfg = getPerCharConfig(anim.name);
      if (cfg) {
        perCharAnim = { ...cfg, name: anim.name };
        perCharProgress = Math.min(animElapsed / anim.duration, 1);
        perCharActive = true;
        break;
      }
    }

    if (perCharActive && perCharAnim) {
      // 逐字符打散动画
      const charSpans = splitBlockChars(block);
      if (charSpans.length === 0) return;

      // 获取 keyframes 的基础 transform（缩放/旋转/opacity）
      const baseT = calcAnimTransform(perCharAnim.name, perCharProgress, true, 1);

      const staticRotate = parseFloat(block.style.getPropertyValue('--rotate-angle')) || 0;
      const staticFlipX = block.dataset.flipped === 'true' ? -1 : 1;

      // 块级 transform 设为 identity（打散时块本身不动）
      block.style.transform = '';

      charSpans.forEach(({ span, index, total }) => {
        // 换行符保持位置不动，不参与打散
        if (span.textContent === '\n') {
          span.style.transform = '';
          span.style.opacity = '';
          return;
        }
        const scatter = calcCharScatter(index, total, perCharProgress, perCharAnim.scatter, perCharAnim.scatterMode);
        let transform = '';
        const tx = scatter.dx;
        const ty = scatter.dy;
        if (tx || ty) transform += `translate(${tx}px, ${ty}px) `;
        const sx = (baseT.scaleX || 1) * scatter.dScale;
        const sy = (baseT.scaleY || 1) * scatter.dScale;
        if (sx !== 1 || sy !== 1 || staticFlipX !== 1) {
          transform += `scale(${sx * staticFlipX}, ${sy}) `;
        }
        const rot = (baseT.rotate || 0) + scatter.dr + staticRotate;
        if (rot) transform += `rotate(${rot}deg) `;
        span.style.transform = transform;
        span.style.opacity = (baseT.opacity !== undefined ? baseT.opacity : 1) * scatter.dOpacity;
      });
      return;
    }

    // 如果没有 perChar 动画但之前拆分过，恢复原始内容
    if (blockCharSpans[blockId] && blockCharSpans[blockId].length > 0) {
      restoreBlockChars(block);
    }

    // ===== 普通预设动画（原有逻辑） =====
    let totalX = 0, totalY = 0, totalScaleX = 1, totalScaleY = 1;
    let totalRotate = 0, totalOpacity = 1;
    let hasActiveAnim = false;

    anims.forEach(anim => {
      if (elapsedMs < anim.startTime) return;
      const animElapsed = elapsedMs - anim.startTime;
      
      // 预设动画循环播放，不限制持续时间
      const isPresetAnim = true;
      if (!isPresetAnim && animElapsed > anim.duration) return;
      
      hasActiveAnim = true;
      // 循环动画允许 progress 超过 1，由 calcAnimTransform 处理取模
      const progress = animElapsed / anim.duration;
      // 使用全局 calcAnimTransform，保证与导出视频一致
      const t = calcAnimTransform(anim.name, progress, true, 1);
      totalX += t.x || 0;
      totalY += t.y || 0;
      totalScaleX *= t.scaleX;
      totalScaleY *= t.scaleY;
      totalRotate += t.rotate || 0;
      if (t.opacity !== undefined && t.opacity !== 1) totalOpacity *= t.opacity;
    });

    if (!hasActiveAnim) return;

    // 保留块的静态旋转和翻转
    const staticRotate = parseFloat(block.style.getPropertyValue('--rotate-angle')) || 0;
    const staticFlipX = block.dataset.flipped === 'true' ? -1 : 1;

    // 保存当前的 opacity（入出场动画设置的）
    const currentOpacity = block.style.opacity;
    let transform = '';

    // 2D 变换（与全局 calcAnimTransform 保持一致）
    if (totalX || totalY) transform += `translate(${totalX}px, ${totalY}px) `;
    if (totalScaleX !== 1 || totalScaleY !== 1 || staticFlipX !== 1) {
      transform += `scale(${totalScaleX * staticFlipX}, ${totalScaleY}) `;
    }
    if (totalRotate + staticRotate) transform += `rotate(${totalRotate + staticRotate}deg) `;

    block.style.transform = transform;

    // 只有当预设动画有 opacity 变化时才设置，且取入出场和预设的较小值
    if (totalOpacity < 1) {
      const inOutOpacity = currentOpacity ? parseFloat(currentOpacity) : 1;
      block.style.opacity = Math.min(inOutOpacity, totalOpacity);
    }
  }
  
  function animate(now) {
    if (!isPlaying) return;
    
    const elapsed = (now - startTime) / 1000;
    
    // 更新播放进度线位置
    updatePlayhead(elapsed);
    
    // 同步更新展示区播放器进度
    updatePlayerProgress(elapsed, maxTime);
    
    // 同步视频播放
    if (typeof updateVideosPlayback === 'function') {
      updateVideosPlayback(elapsed);
    }
    
    // 合并遍历：计算预设动画 + 检查结束状态
    animatedBlockIds.forEach(blockId => {
      // 计算预设动画叠加效果
      applyBlockPresetAnims(blockId, elapsed);
      
      // 检查是否所有动画都已结束
      const anims = blockAnimations[blockId] || [];
      if (anims.length === 0) return;
      const block = getBlockElementCached(blockId);
      if (!block) return;
      
      const maxEndTime = anims._maxEndTime || Math.max(...anims.map(a => a.startTime + a.duration));
      if (anims._maxEndTime === undefined) anims._maxEndTime = maxEndTime;
      
      if (elapsed > maxEndTime) {
        block.style.visibility = 'hidden';
        block.style.transform = '';
        block.style.opacity = '';
      }
    });
    
    // 检查是否所有动画都已结束，如果是则自动停止或循环播放
    if (elapsed > maxTime) {
      if (playerLoop) {
        // 循环播放：停止当前动画但保持isPlaying流程
        isPlaying = false;
        if (playAnimationId) {
          cancelAnimationFrame(playAnimationId);
          playAnimationId = null;
        }
        // 取消所有路径动画的 rAF
        Object.keys(pathAnimRafIds).forEach(id => {
          cancelAnimationFrame(pathAnimRafIds[id]);
          delete pathAnimRafIds[id];
        });
        // 清除所有背景动画的 setTimeout
        bgAnimTimeouts.forEach(id => clearTimeout(id));
        bgAnimTimeouts.length = 0;
        // 清空活跃背景运镜列表
        activeBgMotions = [];
        
        // 恢复背景层视图状态到初始值
        viewTranslateX = initialViewTranslateX;
        viewTranslateY = initialViewTranslateY;
        viewRotate = initialViewRotate;
        viewRotateX = initialViewRotateX;
        viewRotateY = initialViewRotateY;
        // viewScale 不能用 initialViewScale（可能被中途 resize 淘汰），
        // 改为根据当前容器尺寸重算
        const _recomputeEl = document.getElementById('contentLayer');
        if (_recomputeEl) {
          const _rect = _recomputeEl.getBoundingClientRect();
          if (_rect.width > 0 && _rect.height > 0) {
            viewScale = Math.min(_rect.width / BASE_WIDTH, _rect.height / BASE_HEIGHT);
          } else {
            viewScale = initialViewScale;
          }
        } else {
          viewScale = initialViewScale;
        }
        const bcEl = document.getElementById('blocksContainer');
        if (bcEl) bcEl.style.transition = 'none';
        void bcEl?.offsetHeight; // 强制重排
        applyTransform();
        
        // 恢复所有块的原始位置和状态
        animatedBlockIds.forEach(blockId => {
          const blk = getBlockElementCached(blockId);
          if (!blk) return;
          blk.style.visibility = 'hidden';
          blk.style.transform = '';
          blk.style.opacity = '';
          Array.from(blk.classList).filter(c => c.startsWith('anim-')).forEach(cls => blk.classList.remove(cls));
          blk.style.animation = '';
          stopHalfFilterAnimation(blk);
          if (blockOrigPositions[blockId]) {
            blk.style.left = blockOrigPositions[blockId].left + 'px';
            blk.style.top = blockOrigPositions[blockId].top + 'px';
          }
        });

        // 隐藏没有动画的元素，确保循环时0帧画布也为空
        document.querySelectorAll('.text-block').forEach(block => {
          if (!animatedBlockIds.has(block.dataset.id)) {
            block.style.visibility = 'hidden';
          }
        });
        // 循环重置：仅隐藏有动画的图片/视频（与播放启动保持一致）
        document.querySelectorAll('#blocksContainer .bg-image-item').forEach(item => {
          if (animatedBlockIds.has('bg_' + item.dataset.id)) item.style.visibility = 'hidden';
        });
        document.querySelectorAll('#blocksContainer .video-item').forEach(item => {
          if (animatedBlockIds.has('video_' + item.dataset.id)) item.style.visibility = 'hidden';
        });
        
        // 强制重排
        if (previewContainer) void previewContainer.offsetHeight;
        
        // 下一帧恢复transition
        requestAnimationFrame(() => {
          if (bcEl) bcEl.style.transition = '';
        });
        
        // 重置播放开始时间，重新开始
        startTime = performance.now();
        triggeredAnims.clear();
        // 重置预设动画记录
        animatedBlockIds.forEach(blockId => {
          blockJsPresetAnims[blockId] = [];
        });
        isPlaying = true;
        // 继续动画循环
        playAnimationId = requestAnimationFrame(animate);
      } else {
        stopAnimation(false);
      }
      return;
    }
    
    // 先收集同一时间窗口内同一文字块的所有动画（用于叠加）
    const blockTimeAnims = {};
    const TIME_WINDOW = 0.5; // 时间窗口：0.5秒内的动画视为同一时间点
    
    allAnims.forEach(anim => {
      const animKey = `${anim.blockId}-${anim.index}`;
      // 入场/出场/预设动画只需触发一次；字重动画需要每帧更新，不能跳过
      if (triggeredAnims.has(animKey) && anim.type !== 'weight') return;
      if (anim.type === 'bg') return; // 背景动画单独处理
      
      // 当时间到达时
      if (elapsed >= anim.startTime) {
        // 使用时间窗口来分组动画
        const timeWindowKey = Math.floor(anim.startTime / TIME_WINDOW);
        const key = `${anim.blockId}-${timeWindowKey}`;
        if (!blockTimeAnims[key]) {
          blockTimeAnims[key] = [];
        }
        blockTimeAnims[key].push(anim);
      }
    });
    
    // 处理同一时间窗口内的动画叠加
    Object.keys(blockTimeAnims).forEach(key => {
      const anims = blockTimeAnims[key];
      if (anims.length === 0) return;
      
      const blockId = anims[0].blockId;
      const block = getBlockElement(blockId);
      if (!block) return;
      
      // 标记所有动画为已触发
      anims.forEach(anim => {
        triggeredAnims.add(`${anim.blockId}-${anim.index}`);
      });
      
      // 显示元素
      block.style.visibility = 'visible';
      
      // 收集所有动画名称和持续时间
      const animationNames = [];
      const duration = anims[0].duration;
      
      // 调试日志
      console.log('播放动画 - blockId:', blockId, '动画数量:', anims.length);
      anims.forEach(anim => {
        console.log('  - type:', anim.type, 'anim:', anim.anim, 'startTime:', anim.startTime, 'duration:', anim.duration);
      });
      
      // 存储动画配置
      const animConfigs = [];
      anims.forEach(anim => {
        // 入场动画不需要特殊处理opacity，JavaScript动画会直接控制
        if (anim.type === 'in') {
          // 确保元素可见
          block.style.visibility = 'visible';
        }
        
        // 出场动画需要延迟隐藏
        if (anim.type === 'out') {
          // 计算从当前时刻到出场动画结束时刻的剩余时间
          const outEndTime = anim.startTime + anim.duration;
          const remainingTime = (outEndTime - elapsed) * 1000;
          if (remainingTime > 0) {
            setTimeout(() => {
              if (isPlaying) {
                block.style.visibility = 'hidden';
              }
            }, remainingTime);
          } else if (isPlaying) {
            // 动画时间已过，立即隐藏
            block.style.visibility = 'hidden';
          }
        }
        
        // 路径动画单独处理
        if (anim.type === 'path' && anim.path) {
          const origPos = blockOrigPositions[blockId];
          playPathAnimation(block, anim, origPos?.left, origPos?.top);
          return;
        }
        
        // 字重动画 - 使用动画条目中的设置动态播放
        if (anim.type === 'weight') {
          const weightMin = anim.weightAnimMin ?? 100;
          const weightMax = anim.weightAnimMax ?? 900;
          const weightSpeed = anim.weightAnimSpeed ?? 1;
          const cycleMs = 2000 / weightSpeed;
          
          // 在 timeline 上下文中，elapsed 是当前时间（秒），在动画时间范围内才播放
          const localElapsed = (elapsed - anim.startTime);
          if (localElapsed >= 0 && localElapsed <= anim.duration) {
            const progress = (localElapsed * 1000 % cycleMs) / cycleMs;
            const weight = Math.round(weightMin + (weightMax - weightMin) * (0.5 + 0.5 * Math.sin(progress * 2 * Math.PI - Math.PI / 2)));
            block.style.fontVariationSettings = `'wght' ${weight}`;
            const editInput = block.querySelector('.edit-input');
            if (editInput) editInput.style.fontVariationSettings = `'wght' ${weight}`;
            const textContent = block.querySelector('.text-content');
            if (textContent) textContent.style.fontVariationSettings = `'wght' ${weight}`;
            const blockData = blocks.find(b => b.block === block);
            if (blockData) blockData.weight = weight;
          }
          return;
        }
        
        // Canvas位移动画（disp/both开头）- 单独处理
        if (anim.type === 'preset' && (anim.anim.startsWith('disp') || anim.anim.startsWith('both'))) {
          // 延迟到动画开始时间再启动
          const startDelay = (anim.startTime - anims[0].startTime) * 1000;
          setTimeout(() => {
            if (!isPlaying) return;
            block.style.visibility = 'visible';
            startHalfFilterAnimation(block, anim.anim, true);
          }, Math.max(0, startDelay));
          // 动画结束后停止
          setTimeout(() => {
            if (!isPlaying) return;
            stopHalfFilterAnimation(block);
          }, Math.max(0, startDelay) + anim.duration * 1000);
          return;
        }
        
        // 入场、出场、预设动画 - 添加到配置列表
        // startTime: 相对于当前动画组触发时刻的偏移（同一时间窗口内通常为0）
        var relativeStart = (anim.startTime - anims[0].startTime) * 1000;
        // 入场/出场动画（使用CSS keyframe）
        if (anim.type === 'in' || anim.type === 'out') {
          animConfigs.push({
            type: anim.type,
            anim: anim.anim,
            duration: anim.duration * 1000,
            startTime: Math.max(0, relativeStart),
            elapsed: 0,
            useCss: true,
            rotate: anim.rotate || 0,
            flipX: anim.flipX || false,
            flipY: anim.flipY || false
          });
          return;
        }
        // 预设动画 - 区分Canvas位移动画和普通JS动画
        const isHalfFilterAnim = anim.anim.startsWith('disp') || anim.anim.startsWith('both');
        if (isHalfFilterAnim) {
          // Canvas位移动画（disp/both开头）- 单独处理
          animConfigs.push({
            type: anim.type,
            anim: anim.anim,
            duration: anim.duration * 1000,
            startTime: Math.max(0, relativeStart),
            elapsed: 0,
            useCss: false,
            isHalfFilter: true,
            rotate: anim.rotate || 0,
            flipX: anim.flipX || false,
            flipY: anim.flipY || false
          });
        } else {
          // 普通预设动画 - 直接加入全局列表，主循环统一计算叠加
          if (!blockJsPresetAnims[blockId]) {
            blockJsPresetAnims[blockId] = [];
          }
          blockJsPresetAnims[blockId].push({
            name: anim.anim,
            startTime: anim.startTime * 1000, // 绝对时间（毫秒）
            duration: anim.duration * 1000,
            rotate: anim.rotate || 0,
            flipX: anim.flipX || false,
            flipY: anim.flipY || false
          });
          
          if (anim.anim === 'static') {
            block.style.visibility = 'visible';
          }
        }
      });
      
      // 调试：输出animConfigs
      console.log('animConfigs:', animConfigs.map(c => ({ type: c.type, anim: c.anim, duration: c.duration, useCss: c.useCss })));
      
      // 按 startTime 排序
      animConfigs.sort(function(a, b) { return a.startTime - b.startTime; });
      
      // 分离 CSS 动画和 JS 动画
      var cssAnims = animConfigs.filter(function(c) { return c.useCss; });
      var jsAnims = animConfigs.filter(function(c) { return !c.useCss; });
      
      if (cssAnims.length > 0) {
        // 分离入场/出场动画（串联）和预设动画（并联叠加）
        var inOutAnims = cssAnims.filter(function(c) { return c.type === 'in' || c.type === 'out'; });
        var presetAnims = cssAnims.filter(function(c) { return c.isPreset; });
        
        // 入场/出场动画按顺序串联播放
        if (inOutAnims.length > 0) {
          var blockAnimSeq = 0;
          var cumulativeDelay = 0;
          inOutAnims.forEach(function(config, idx) {
            var delay = Math.max(0, config.startTime - cumulativeDelay);
            cumulativeDelay += delay;
            var thisSeq = ++blockAnimSeq;
            console.log('CSS inOut anim #' + idx + ': ' + config.anim + ' delay=' + delay + 'ms duration=' + config.duration + 'ms seq=' + thisSeq);
            setTimeout(function() {
              if (!isPlaying) return;
              block.style.visibility = 'visible';
              // 只移除入出场动画相关的类（anim-fadeIn, anim-fadeOut 等），保留预设动画类
              block.className = block.className.replace(/\banim-(fadeIn|fadeOut|slideIn|slideOut|slideLeft|slideRight|slideUp|slideDown|zoomIn|zoomOut|spinIn|spinOut|scaleIn|scaleOut|rotateIn|rotateOut|bounceIn|bounceOut)\b/g, '').trim();
              block.classList.add('anim-' + config.anim);
              block.style.animationDuration = config.duration + 'ms';
              block.style.animationDelay = '0ms';
              block.style.animationFillMode = 'forwards';
              // 只应用入出场动画的transform，不覆盖预设动画的transform
              // 使用 opacity 来控制显隐，transform 由各自动画独立控制
            }, cumulativeDelay);
            setTimeout(function() {
              if (!isPlaying) return;
              block.classList.remove('anim-' + config.anim);
              block.style.animationDuration = '';
              block.style.animationDelay = '';
              if (config.type === 'in') {
                block.style.opacity = '1';
              } else {
                block.style.opacity = '0';
                // 只有在没有被后续动画替代时才隐藏
                if (blockAnimSeq <= thisSeq) {
                  block.style.visibility = 'hidden';
                }
              }
            }, cumulativeDelay + config.duration);
            cumulativeDelay += config.duration;
          });
        }
        
        // 预设动画同时叠加播放（累加模式，不覆盖已有预设）
        if (presetAnims.length > 0) {
          console.log('CSS preset anims (parallel append):', presetAnims.map(a => a.anim));
          
          // 计算这些新预设动画中最长的持续时间
          var maxNewPresetDuration = Math.max(...presetAnims.map(a => a.startTime + a.duration));
          
          // 将新的预设动画添加到全局列表
          if (!blockPresetAnims[blockId]) {
            blockPresetAnims[blockId] = [];
          }
          
          presetAnims.forEach(function(config) {
            blockPresetAnims[blockId].push({
              name: config.anim,
              duration: config.duration,
              delay: config.startTime,
              endTime: config.startTime + config.duration
            });
          });
          
          // 重新应用所有预设动画（累加）
          applyPresetAnimsToBlock(blockId);
          
          // 最长的新预设动画结束后，从列表中移除并重新应用
          setTimeout(function() {
            if (!isPlaying) return;
            if (blockPresetAnims[blockId]) {
              var currentTime = (performance.now() - startTime);
              blockPresetAnims[blockId] = blockPresetAnims[blockId].filter(function(a) {
                return a.endTime * 1000 > currentTime;
              });
              applyPresetAnimsToBlock(blockId);
            }
          }, maxNewPresetDuration);
        }
        
        // 如果只有 CSS 动画，不需要 JS animateStep
        if (jsAnims.length === 0) return;
        // 重新赋值 animConfigs 为仅 JS 动画
        animConfigs = jsAnims;
      }
      
      // 创建动画状态对象
      const animState = {
        translateX: 0,
        translateY: 0,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        opacity: 1
      };
      
      // 动画开始时间
      const startTimestamp = performance.now();
      
      // 动画函数
      function animateStep(timestamp) {
          if (!isPlaying) return;
          
          const elapsed = timestamp - startTimestamp;
          
          // 重置状态
          animState.translateX = 0;
          animState.translateY = 0;
          animState.scale = 1;
          animState.scaleX = 1;
          animState.scaleY = 1;
          animState.rotate = 0;
          
          // 计算每个动画的当前状态
          let debugAnimCount = 0;
          animConfigs.forEach(config => {
            if (elapsed < config.startTime) return;
            
            const animElapsed = elapsed - config.startTime;
            const progress = Math.min(animElapsed / config.duration, 1);
            
            debugAnimCount++;
            if (debugAnimCount <= 3) {
              console.log(`动画 ${config.anim} progress=${progress.toFixed(2)} elapsed=${elapsed.toFixed(0)} startTime=${config.startTime}`);
            }
            
            // 根据动画类型计算transform值
            switch (config.anim) {
              case 'static':
                // 静态动画 - 不做任何变化
                break;
              case 'pulse':
                animState.scale *= 1 + 0.2 * Math.sin(progress * Math.PI * 2);
                break;
              case 'shake':
                animState.translateX += Math.sin(progress * Math.PI * 8) * 5;
                animState.rotate += Math.sin(progress * Math.PI * 8) * 5;
                break;
              case 'sway':
                animState.rotate += Math.sin(progress * Math.PI * 2) * 15;
                break;
              case 'bounce':
                animState.translateY += Math.sin(progress * Math.PI * 2) * -20;
                break;
              case 'float':
                animState.translateY += Math.sin(progress * Math.PI * 2) * -15;
                break;
              case 'vibrate':
                animState.translateX += Math.sin(progress * Math.PI * 16) * 2;
                animState.translateY += Math.cos(progress * Math.PI * 16) * 2;
                break;
              case 'zoom':
                animState.scale *= 1 + 0.3 * Math.sin(progress * Math.PI * 2);
                break;
              case 'fall':
                animState.translateY += progress * 50;
                animState.rotate += progress * 15;
                break;
              case 'jump':
                animState.translateY += Math.sin(progress * Math.PI) * -30;
                break;
              case 'run':
                animState.translateX += Math.sin(progress * Math.PI * 4) * 20;
                animState.scaleX *= 1 + 0.1 * Math.sin(progress * Math.PI * 4);
                break;
              case 'walk':
                animState.translateX += progress * 15;
                break;
              case 'spin':
                animState.rotate += progress * 360;
                break;
              case 'blink':
                // 闪烁效果通过opacity实现
                block.style.opacity = 0.5 + 0.5 * Math.sin(progress * Math.PI * 4);
                break;
              case 'slide':
                animState.translateX += Math.sin(progress * Math.PI * 2) * 20;
                break;
              case 'swing':
                animState.rotate += Math.sin(progress * Math.PI * 2) * 15;
                break;
              case 'dive':
                animState.translateY += Math.sin(progress * Math.PI * 2) * 25;
                break;
              case 'rise':
                animState.translateY += Math.sin(progress * Math.PI * 2) * -25;
                break;
              case 'dash':
                animState.translateX += Math.sin(progress * Math.PI * 2) * 30;
                break;
              case 'breathe':
                animState.scale *= 1 + 0.1 * Math.sin(progress * Math.PI * 2);
                break;
              case 'flicker':
                block.style.opacity = 0.5 + 0.5 * Math.sin(progress * Math.PI * 8);
                animState.translateX += Math.sin(progress * Math.PI * 8) * 3;
                break;
              case 'wave':
                animState.rotate += Math.sin(progress * Math.PI * 4) * 10;
                break;
              case 'clap':
                animState.scaleX *= 1 + 0.2 * Math.sin(progress * Math.PI * 4);
                break;
              case 'nod':
                animState.rotate += Math.sin(progress * Math.PI * 4) * 5;
                break;
              case 'shakehead':
                animState.rotate += Math.sin(progress * Math.PI * 4) * 15;
                break;
              case 'run2':
                animState.translateY += Math.sin(progress * Math.PI * 4) * -10;
                animState.rotate += Math.sin(progress * Math.PI * 4) * 5;
                break;
              case 'fly':
                animState.translateY += Math.sin(progress * Math.PI * 2) * -15;
                animState.rotate += Math.sin(progress * Math.PI * 2) * 5;
                break;
              case 'crawl':
                animState.translateX += progress * 10;
                animState.translateY += Math.sin(progress * Math.PI * 4) * 5;
                break;
              case 'jump2':
                animState.translateY += Math.sin(progress * Math.PI * 2) * -20;
                break;
              case 'stretch':
                animState.scaleY *= 1 + 0.1 * Math.sin(progress * Math.PI * 2);
                break;
              case 'sleep':
                animState.rotate += Math.sin(progress * Math.PI * 2) * 2;
                break;

              case 'weightCycle':
                // 字重动画 - 使用JS计算而不是CSS
                const wCycleDuration = 2000;
                const wProgress = (elapsed % wCycleDuration) / wCycleDuration;
                // 从 blockAnimations 查找字重设置
                const wAnims = blockAnimations[blockId] || [];
                const wEntry = wAnims.find(a => a.type === 'weight');
                const wMin = wEntry?.weightAnimMin ?? 100;
                const wMax = wEntry?.weightAnimMax ?? 900;
                const wVal = Math.round(wMin + (wMax - wMin) * (0.5 + 0.5 * Math.sin(wProgress * 2 * Math.PI - Math.PI / 2)));
                block.style.fontVariationSettings = `'wght' ${wVal}`;
                const wEditInput = block.querySelector('.edit-input');
                if (wEditInput) wEditInput.style.fontVariationSettings = `'wght' ${wVal}`;
                const wTextContent = block.querySelector('.text-content');
                if (wTextContent) wTextContent.style.fontVariationSettings = `'wght' ${wVal}`;
                break;
            }
          });
          
          // 应用transform（包含用户自定义旋转和翻转）
          var baseRotate = animConfigs.reduce(function(acc, c) { return c.rotate || acc; }, 0);
          var baseFlipX = animConfigs.some(function(c) { return c.flipX; });
          var baseFlipY = animConfigs.some(function(c) { return c.flipY; });
          // 保留块的静态旋转和翻转
          var staticRotate = parseFloat(block.style.getPropertyValue('--rotate-angle')) || 0;
          var staticFlipX = block.dataset.flipped === 'true' ? -1 : 1;
          var finalFlipX = (baseFlipX ? -1 : 1) * staticFlipX;
          var transformStr = 'translate(' + animState.translateX + 'px, ' + animState.translateY + 'px) ';
          transformStr += 'scale(' + animState.scale + ') ';
          transformStr += 'scaleX(' + (finalFlipX < 0 ? -animState.scaleX : animState.scaleX) + ') ';
          transformStr += 'scaleY(' + (baseFlipY ? -animState.scaleY : animState.scaleY) + ') ';
          transformStr += 'rotate(' + (animState.rotate + baseRotate + staticRotate) + 'deg)';
          block.style.transform = transformStr;
          
          // 调试：每10帧输出一次transform
          if (Math.floor(elapsed / 100) % 5 === 0) {
            console.log('transform:', transformStr, 'animState:', JSON.stringify(animState));
          }
          
          // 如果还有动画需要执行，继续循环
          if (animConfigs.length > 0) {
            const maxEndTime = Math.max(...animConfigs.map(c => c.startTime + c.duration));
            if (elapsed < maxEndTime || animConfigs.some(c => !['in', 'out'].includes(c.type))) {
              requestAnimationFrame(animateStep);
            } else {
              // 动画结束，根据类型设置最终状态
              // 保留用户的旋转和翻转
              var baseRotate = animConfigs.reduce(function(acc, c) { return c.rotate || acc; }, 0);
              var baseFlipX = animConfigs.some(function(c) { return c.flipX; });
              var baseFlipY = animConfigs.some(function(c) { return c.flipY; });
              // 保留块的静态旋转和翻转
              var staticRotate = parseFloat(block.style.getPropertyValue('--rotate-angle')) || 0;
              var staticFlipX = block.dataset.flipped === 'true' ? -1 : 1;
              var finalFlipX = (baseFlipX ? -1 : 1) * staticFlipX;
              var finalTransform = '';
              if (baseRotate + staticRotate) finalTransform += 'rotate(' + (baseRotate + staticRotate) + 'deg) ';
              if (finalFlipX < 0) finalTransform += 'scaleX(-1) ';
              if (baseFlipY) finalTransform += 'scaleY(-1) ';
              block.style.transform = finalTransform.trim();
              // 入场动画结束 opacity=1，出场动画结束 opacity=0
              var hasOutAnim = animConfigs.some(function(c) { return c.type === 'out'; });
              block.style.opacity = hasOutAnim ? '0' : '1';
            }
          }
        }
        
        // 开始动画
        requestAnimationFrame(animateStep);
        
        console.log('使用JavaScript动画叠加，动画数量:', animConfigs.length);
      
      // 强制重排以触发CSS动画
      void block.offsetHeight;
    });
    
    // 处理背景层动画（镜头运镜）- 统一使用 activeBgMotions 逐帧计算
    allAnims.forEach(anim => {
      const animKey = `${anim.blockId}-${anim.index}`;
      if (triggeredAnims.has(animKey)) return;
      
      if (anim.type === 'bg') {
        if (elapsed >= anim.startTime) {
          triggeredAnims.add(animKey);
          
          let motion = anim.motion;
          if (!motion) {
            if (anim.dir && anim.dir !== 'none' && anim.scale && anim.scale !== 'none') {
              motion = 'panZoom';
            } else if (anim.dir === 'left') motion = 'left';
            else if (anim.dir === 'right') motion = 'right';
            else if (anim.dir === 'up') motion = 'up';
            else if (anim.dir === 'down') motion = 'down';
            else if (anim.scale === 'in') motion = 'zoomIn';
            else if (anim.scale === 'out') motion = 'zoomOut';
            else motion = 'none';
          }
          
          activeBgMotions.push({
            motion: motion,
            startTime: anim.startTime,
            duration: anim.duration,
            dist: anim.distance || 100,
            scaleVal: anim.scaleValue || 1.5
          });
        }
        return;
      }
    });
    
    // 更新所有背景运镜效果
    updateBgMotions(elapsed, initialViewTranslateX, initialViewTranslateY, initialViewScale, initialViewRotate, initialViewRotateX, initialViewRotateY);
    
    playAnimationId = requestAnimationFrame(animate);
  }
  
  playAnimationId = requestAnimationFrame(animate);
});

// 扩展时间轴按钮（手动扩展，时间轴也会根据动画自动扩展）
if (expandTimelineBtn) {
  expandTimelineBtn.addEventListener('click', () => {
    let currentMaxTime = parseInt(timelineRuler.dataset.maxTime) || 10;
    const newMaxTime = currentMaxTime + 10;
    
    showTip(`时间轴已手动扩展到 ${newMaxTime} 秒`);
    
    initTimeline(newMaxTime);
    renderTimeline();
  });
}

// 一键添加动画按钮
quickAddAnimBtn.addEventListener('click', () => {
  quickAddAnimation();
});

// 一键添加字重动画按钮
const quickAddWeightAnimBtn = document.getElementById('quickAddWeightAnimBtn');
if (quickAddWeightAnimBtn) {
  quickAddWeightAnimBtn.addEventListener('click', () => {
    if (selectedBlocks.length === 0) {
      showTip('请先选中文字块');
      return;
    }
    
    // 获取所有文字块的最大时间
    let globalMaxTime = 0;
    Object.keys(blockAnimations).forEach(id => {
      const anims = blockAnimations[id] || [];
      if (anims.length > 0) {
        const blockEndTime = Math.max(...anims.map(a => a.startTime + a.duration));
        if (blockEndTime > globalMaxTime) {
          globalMaxTime = blockEndTime;
        }
      }
    });
    
    selectedBlocks.forEach(block => {
      const blockId = getBlockId(block);
      const existingAnims = blockAnimations[blockId] || [];
      let startTime = globalMaxTime;
      if (hasSelectedTime) {
        startTime = currentTimelineTime;
      } else if (existingAnims.length > 0) {
        const lastEndTime = Math.max(...existingAnims.map(a => a.startTime + a.duration));
        startTime = Math.max(startTime, lastEndTime);
      }
      
      // 添加字重动画
      if (!blockAnimations[blockId]) {
        blockAnimations[blockId] = [];
      }
      
      const blockData = blocks.find(b => b.block === block);
      const minWeight = blockData?.weightAnimMin ?? 100;
      const maxWeight = blockData?.weightAnimMax ?? 900;
      const speed = blockData?.weightAnimSpeed ?? 1;
      
      blockAnimations[blockId].push({
        type: 'weight',
        anim: 'weightCycle',
        startTime: startTime,
        duration: 2,
        weightAnimMin: minWeight,
        weightAnimMax: maxWeight,
        weightAnimSpeed: speed
      });
      
      // 确保块显示
      block.style.visibility = 'visible';
    });
    
    renderTimeline();
    showTip('已添加字重动画');
  });
}

// 时间轴插入图片按钮
const addImageBtn = document.getElementById('addImageBtn');
if (addImageBtn) {
  addImageBtn.addEventListener('click', () => {
    const bgImageInput = document.getElementById('bgImageInput');
    if (bgImageInput) {
      bgImageInput.click();
    }
  });
}

// 时间轴插入视频按钮
const addVideoBtn = document.getElementById('addVideoBtn');
if (addVideoBtn) {
  addVideoBtn.addEventListener('click', () => {
    const videoInput = document.getElementById('videoInput');
    if (videoInput) {
      videoInput.click();
    }
  });
}

// 网格显示/隐藏切换按钮
const toggleGridBtn = document.getElementById('toggleGridBtn');
console.log('网格按钮元素:', toggleGridBtn);
let isGridVisible = true;
if (toggleGridBtn) {
  toggleGridBtn.addEventListener('click', () => {
    console.log('网格按钮被点击');
    isGridVisible = !isGridVisible;
    const previewContainer = document.getElementById('previewContainer');
    console.log('预览容器:', previewContainer, '当前网格状态:', isGridVisible);
    if (isGridVisible) {
      previewContainer.classList.remove('no-grid');
      toggleGridBtn.style.opacity = '1';
    } else {
      previewContainer.classList.add('no-grid');
      toggleGridBtn.style.opacity = '0.6';
    }
    localStorage.setItem('gridVisible', isGridVisible);
  });
  
  // 从localStorage读取网格显示状态
  const savedGridState = localStorage.getItem('gridVisible');
  if (savedGridState === 'false') {
    isGridVisible = false;
    document.getElementById('previewContainer').classList.add('no-grid');
    toggleGridBtn.style.opacity = '0.6';
  }
}

// 绘制路径动画按钮
document.getElementById('drawPathBtn').addEventListener('click', () => {
  let targetBlock = null;
  if (selectedBlocks.length > 0) {
    targetBlock = selectedBlocks[0];
  } else if (selectedBgImageId !== null) {
    targetBlock = document.querySelector('.bg-image-item[data-id="' + selectedBgImageId + '"]');
  } else if (selectedVideoId !== null) {
    targetBlock = document.querySelector('.video-item[data-id="' + selectedVideoId + '"]');
  }
  if (!targetBlock) {
    showTip('请先选中文字块、图片或视频');
    return;
  }
  // 绘制路径前先停止动画，确保读取的是块的原始位置
  if (isPlaying) {
    stopAnimation(false);
  }
  createPathDrawUI(targetBlock);
});

// 修改动画弹窗事件监听
closeEditAnimModal.addEventListener('click', hideEditAnimModal);
cancelEditAnim.addEventListener('click', hideEditAnimModal);

// 动画编辑弹窗时间输入实时预览
editAnimStartTime.addEventListener('input', () => {
  if (!editingAnim) return;
  const startTime = parseFloat(editAnimStartTime.value) || 0;
  previewAnimPosition(startTime, null);
});

editAnimDuration.addEventListener('input', () => {
  if (!editingAnim) return;
  const duration = parseFloat(editAnimDuration.value) || 2;
  previewAnimPosition(null, duration);
});

// 实时预览动画位置
function previewAnimPosition(newStartTime, newDuration) {
  const { blockId, indices } = editingAnim;
  if (!blockId || !indices || indices.length === 0) return;
  
  // 获取当前的时间值
  const startTime = newStartTime !== null ? newStartTime : (parseFloat(editAnimStartTime.value) || 0);
  const duration = newDuration !== null ? newDuration : (parseFloat(editAnimDuration.value) || 2);
  const endTime = startTime + duration;
  
  // 计算时间轴最大结束时间（遍历所有文字块的动画）
  let maxEndTime = 0;
  Object.keys(blockAnimations).forEach(key => {
    const anims = blockAnimations[key] || [];
    anims.forEach(anim => {
      const animEndTime = anim.startTime + anim.duration;
      if (animEndTime > maxEndTime) {
        maxEndTime = animEndTime;
      }
    });
  });
  
  // 如果新的结束时间超过了当前最大时间，需要调整时间轴宽度
  if (endTime > maxEndTime) {
    const timeline = document.querySelector('.keyframes-tracks');
    if (timeline) {
      const newMaxTime = Math.max(10, Math.ceil(endTime));
      const timelineWidth = (newMaxTime * 80) + 100 + LABEL_OFFSET;
      timeline.style.width = Math.max(timelineWidth, timeline.scrollWidth) + 'px';
    }
  }
  
  // 获取所有轨道栏（包括背景层和所有文字块）
  const allBars = document.querySelectorAll('.track-bar');
  
  // 遍历所有轨道栏，更新所有动画帧位置
  allBars.forEach(bar => {
    const currentBlockId = bar.dataset.blockId;
    if (!currentBlockId) return;
    
    const anims = blockAnimations[currentBlockId] || [];
    
    // 获取该轨道上所有动画帧（包括普通动画和合并动画）
    const allTrackItems = bar.querySelectorAll('.track-item');
    
    allTrackItems.forEach(item => {
      // 判断是否是合并动画帧
      const multiIndicesStr = item.dataset.multiIndices;
      if (multiIndicesStr) {
        // 合并动画帧：解析包含的索引
        const multiIndices = JSON.parse(multiIndicesStr);
        
        // 检查是否与当前编辑的索引有重叠
        const hasOverlap = multiIndices.some(idx => indices.includes(idx));
        
        if (currentBlockId === blockId && hasOverlap) {
          // 正在编辑的合并动画帧，使用编辑的时间
          item.style.left = (startTime * 80) + 'px';
          item.style.width = (duration * 80) + 'px';
        } else {
          // 其他合并动画帧，使用数据中的时间
          const firstIdx = multiIndices[0];
          const anim = anims[firstIdx];
          if (anim) {
            item.style.left = (anim.startTime * 80) + 'px';
            item.style.width = (anim.duration * 80) + 'px';
          }
        }
      } else {
        // 普通动画帧
        const animIndex = parseInt(item.dataset.animIndex);
        
        if (currentBlockId === blockId && indices.includes(animIndex)) {
          // 正在编辑的动画帧，使用编辑的时间
          item.style.left = (startTime * 80) + 'px';
          item.style.width = (duration * 80) + 'px';
        } else {
          // 其他动画帧，使用数据中的时间
          const anim = anims[animIndex];
          if (anim) {
            item.style.left = (anim.startTime * 80) + 'px';
            item.style.width = (anim.duration * 80) + 'px';
          }
        }
      }
    });
  });
}

// 动画类型切换
animTypeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    animTypeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // 获取当前选中的动画效果
    const activeEffectBtn = document.querySelector('.anim-effect-btn.active');
    const currentEffect = activeEffectBtn?.dataset.effect || '';
    
    // 重新渲染动画效果按钮
    renderAnimEffectButtons(btn.dataset.type, currentEffect);
  });
});

// 确认修改动画
confirmEditAnim.addEventListener('click', () => {
  if (!editingAnim) return;
  
  const { blockId, indices, isNewAnim } = editingAnim;
  
  // 检查已选动画列表
  if (editingSelectedAnims.length === 0) {
    showTip('请选择至少一个动画效果');
    return;
  }
  
  // 确保 blockAnimations[blockId] 已初始化（新块还没有动画时）
  if (!blockAnimations[blockId]) blockAnimations[blockId] = [];
  
  // 如果不是新动画，计算时间差用于调整后面的动画位置
  let timeDelta = 0;
  let refStartTime = Infinity;
  
  if (!isNewAnim && indices.length > 0) {
    // 获取原有动画中最早的开始时间和最晚的结束时间
    const oldAnims = indices.map(idx => blockAnimations[blockId]?.[idx]).filter(a => a);
    if (oldAnims.length > 0) {
      const oldStartTime = Math.min(...oldAnims.map(a => a.startTime));
      const oldEndTime = Math.max(...oldAnims.map(a => a.startTime + a.duration));
      
      // 获取新动画中最早的开始时间和最晚的结束时间
      const newStartTime = Math.min(...editingSelectedAnims.map(a => a.startTime));
      const newEndTime = Math.max(...editingSelectedAnims.map(a => a.startTime + a.duration));
      
      // 计算结束时间的变化量
      timeDelta = newEndTime - oldEndTime;
      refStartTime = oldStartTime;
    }
  }
  
  // 从后往前删除原有的动画（避免索引变化问题）
  const sortedIndices = [...indices].sort((a, b) => b - a);
  sortedIndices.forEach(idx => {
    blockAnimations[blockId].splice(idx, 1);
  });
  
  // 如果不是新动画且有时差，调整后面所有动画的位置
  if (!isNewAnim && timeDelta !== 0) {
    blockAnimations[blockId].forEach(anim => {
      // 只调整在被修改动画之后开始的动画
      if (anim.startTime >= refStartTime) {
        anim.startTime += timeDelta;
      }
    });
  }
  
  // 添加已选动画列表中的动画（每个动画使用自己的时间设置）
  editingSelectedAnims.forEach(anim => {
    const animData = {
      type: anim.type,
      anim: anim.anim,
      startTime: anim.startTime,
      duration: anim.duration,
      rotate: anim.rotate || 0,
      flipX: anim.flipX || false,
      flipY: anim.flipY || false
    };
    // 如果是路径动画，保存路径数据
    if (anim.type === 'path' && anim.path) {
      animData.path = anim.path;
      animData.pathMode = anim.pathMode || 'freehand';
    }
    // 如果是字重动画，保存字重范围
    if (anim.type === 'weight') {
      animData.weightAnimMin = anim.weightAnimMin ?? 100;
      animData.weightAnimMax = anim.weightAnimMax ?? 900;
      animData.weightAnimSpeed = anim.weightAnimSpeed ?? 1;
    }
    blockAnimations[blockId].push(animData);
  });
  
  // 按开始时间排序
  blockAnimations[blockId].sort((a, b) => a.startTime - b.startTime);
  
  hideEditAnimModal();
  renderTimeline();
  showTip(isNewAnim ? '动画已添加' : (editingSelectedAnims.length > 1 ? '多选动画已修改' : '动画已修改'));
});

// 背景层动画弹窗控制
function showBgAnimModal() {
  // 添加新背景动画时重置编辑状态
  editingBgAnimIndex = -1;
  
  const bgKey = '__bg__';
  const bgAnims = blockAnimations[bgKey] || [];
  
  if (hasSelectedTime) {
    // 如果拖动了时间轴指针，在指针位置插入
    bgStartTime.value = currentTimelineTime;
  } else if (bgAnims.length === 0) {
    // 没有镜头运镜，在 0 帧插入
    bgStartTime.value = 0;
  } else {
    // 有镜头运镜，在最后一个后面插入
    let maxEndTime = 0;
    bgAnims.forEach(anim => {
      const endTime = anim.startTime + anim.duration;
      if (endTime > maxEndTime) maxEndTime = endTime;
    });
    bgStartTime.value = maxEndTime + 0.5;
  }
  
  bgAnimModal.style.display = 'flex';
}

function hideBgAnimModal() {
  bgAnimModal.style.display = 'none';
  editingBgAnimIndex = -1;
}

let editingBgAnimIndex = -1;

function showEditBgAnimModal(index) {
  const bgKey = '__bg__';
  const anim = blockAnimations[bgKey][index];
  
  bgAnimModal.querySelectorAll('[data-motion]').forEach(btn => {
    btn.classList.remove('active');
  });
  
  let activeMotion = anim.motion;
  if (!activeMotion) {
    if (anim.dir && anim.dir !== 'none' && anim.scale && anim.scale !== 'none') {
      activeMotion = 'panZoom';
    } else if (anim.dir === 'left') activeMotion = 'left';
    else if (anim.dir === 'right') activeMotion = 'right';
    else if (anim.dir === 'up') activeMotion = 'up';
    else if (anim.dir === 'down') activeMotion = 'down';
    else if (anim.scale === 'in') activeMotion = 'zoomIn';
    else if (anim.scale === 'out') activeMotion = 'zoomOut';
    else activeMotion = 'none';
  }
  
  const activeBtn = bgAnimModal.querySelector(`[data-motion="${activeMotion}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  
  bgMoveDistance.value = anim.distance || 100;
  bgScaleValue.value = anim.scaleValue || 1.5;
  bgStartTime.value = anim.startTime;
  bgDuration.value = anim.duration;
  
  editingBgAnimIndex = index;
  bgAnimModal.style.display = 'flex';
}

// 背景动画按钮点击
bgAnimBtn.addEventListener('click', showBgAnimModal);
closeBgAnimModal.addEventListener('click', hideBgAnimModal);
cancelBgAnim.addEventListener('click', hideBgAnimModal);

// 背景动画弹窗内的按钮切换
bgAnimModal.querySelectorAll('[data-motion]').forEach(btn => {
  btn.addEventListener('click', () => {
    bgAnimModal.querySelectorAll('[data-motion]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// 确认添加/修改背景动画
confirmBgAnim.addEventListener('click', () => {
  const motion = bgAnimModal.querySelector('[data-motion].active')?.dataset.motion || 'none';
  const distance = parseInt(bgMoveDistance.value) || 100;
  const scaleVal = parseFloat(bgScaleValue.value) || 1.5;
  const startTime = parseFloat(bgStartTime.value) || 0;
  const duration = parseFloat(bgDuration.value) || 2;
  
  const bgKey = '__bg__';
  
  if (!blockAnimations[bgKey]) {
    blockAnimations[bgKey] = [];
  }
  
  const animData = {
    type: 'bg',
    anim: 'bgMove',
    startTime: startTime,
    duration: duration,
    motion: motion,
    distance: distance,
    scaleValue: scaleVal
  };
  
  if (editingBgAnimIndex >= 0) {
    blockAnimations[bgKey][editingBgAnimIndex] = animData;
    hideBgAnimModal();
    renderTimeline();
    showTip('镜头运镜已修改');
  } else {
    blockAnimations[bgKey].push(animData);
    
    hideBgAnimModal();
    renderTimeline();
    showTip('已添加镜头运镜');
  }
});

function syncDomPositionsToData() {
  try {
    const blocksContainer = document.getElementById('blocksContainer');
    if (!blocksContainer) {
      console.warn('syncDomPositionsToData: blocksContainer not found');
      return;
    }
    
    // 同步文字块
    if (Array.isArray(blocks)) {
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        const el = b.block;
        if (!el || !el.parentElement) {
          blocks.splice(i, 1);
          continue;
        }
        b.left = parseInt(el.style.left) || 0;
        b.top = parseInt(el.style.top) || 0;
        const zNum = parseInt(el.style.zIndex);
        b.zIndex = isNaN(zNum) ? 0 : zNum;
        if (b.fontName === undefined) b.fontName = 'XXOBS-VF';
        if (b.weight === undefined) b.weight = 400;
        if (b.animationSpeed === undefined) b.animationSpeed = 1;
        if (b.weightAnimMin === undefined) b.weightAnimMin = 100;
        if (b.weightAnimMax === undefined) b.weightAnimMax = 900;
        if (b.weightAnimSpeed === undefined) b.weightAnimSpeed = 1;
      }
    }
    
    // 同步图片块
    if (Array.isArray(bgImages)) {
      for (let i = bgImages.length - 1; i >= 0; i--) {
        const bg = bgImages[i];
        const el = blocksContainer.querySelector(`.bg-image-item[data-id="${bg.id}"]`);
        if (el) {
          bg.x = parseInt(el.style.left) || 0;
          bg.y = parseInt(el.style.top) || 0;
          const zNum = parseInt(el.style.zIndex);
          bg.zIndex = isNaN(zNum) ? 0 : zNum;
          bg.width = parseInt(el.style.width) || (bg.width || 400);
          bg.height = parseInt(el.style.height) || (bg.height || 300);
          if (bg.startTime === undefined) bg.startTime = 0;
          if (bg.duration === undefined) bg.duration = 10;
          if (bg.rotation === undefined) bg.rotation = 0;
        } else {
          bgImages.splice(i, 1);
        }
      }
    }
    
    // 同步视频块
    if (Array.isArray(videoItems)) {
      for (let i = videoItems.length - 1; i >= 0; i--) {
        const v = videoItems[i];
        const el = blocksContainer.querySelector(`.video-item[data-id="${v.id}"]`);
        if (el) {
          v.x = parseInt(el.style.left) || 0;
          v.y = parseInt(el.style.top) || 0;
          const zNum = parseInt(el.style.zIndex);
          v.zIndex = isNaN(zNum) ? 0 : zNum;
          v.width = parseInt(el.style.width) || (v.width || 400);
          v.height = parseInt(el.style.height) || (v.height || 300);
          if (v.startTime === undefined) v.startTime = 0;
          if (v.duration === undefined) v.duration = 10;
          if (v.volume === undefined) v.volume = 0;
        } else {
          videoItems.splice(i, 1);
        }
      }
    }
  } catch (e) {
    console.error('syncDomPositionsToData error:', e);
  }
}

// 保存动画数据核心函数 - 稳定版
// forceSaveAs: true 表示强制另存为（弹窗选择文件名）；false 表示按 currentZimanhuaFileName 直接保存
async function saveAnimationData(forceSaveAs) {
  try {
    // 确保全局变量存在
    if (typeof blocks === 'undefined') blocks = [];
    if (typeof bgImages === 'undefined') bgImages = [];
    if (typeof videoItems === 'undefined') videoItems = [];
    if (typeof blockAnimations === 'undefined') blockAnimations = {};
    if (typeof currentExportSize === 'undefined') currentExportSize = '16:9';
    
    console.log('[保存] 开始保存, forceSaveAs:', forceSaveAs, ', currentZimanhuaFileName:', currentZimanhuaFileName);
    console.log('[保存] blocks:', blocks.length, ', bgImages:', bgImages.length, ', videoItems:', videoItems.length, ', animations:', Object.keys(blockAnimations).length);
    
    const hasContent = blocks.length > 0 || bgImages.length > 0 || videoItems.length > 0 || Object.keys(blockAnimations).length > 0;
    if (!hasContent) {
      showTip('暂无内容可保存');
      return;
    }
    
    // 保存前先同步DOM位置到数据对象
    syncDomPositionsToData();
    
    // 保存前先停止动画播放
    if (typeof isPlaying !== 'undefined' && isPlaying && typeof stopAnimation === 'function') {
      stopAnimation(false);
      await new Promise(r => setTimeout(r, 200));
    }
    
    // ---- 处理视频 blob URL ----
    const savedVideoItems = [];
    for (const v of videoItems) {
      let videoSrc = v.src || '';
      if (v.src && v.src.startsWith('blob:')) {
        try {
          const resp = await fetch(v.src);
          const blob = await resp.blob();
          videoSrc = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn('[保存] 视频转码失败:', e);
        }
      }
      savedVideoItems.push({
        id: v.id || 0,
        name: v.name || '视频',
        src: videoSrc,
        x: v.x || 0,
        y: v.y || 0,
        width: v.width || 400,
        height: v.height || 300,
        zIndex: v.zIndex || 0,
        duration: v.duration || 10,
        startTime: v.startTime || 0,
        volume: v.volume || 0
      });
    }
    
    // ---- 构建保存数据 ----
    const saveData = {
      version: 1,
      timestamp: new Date().toISOString(),
      viewState: {
        viewTranslateX: (typeof viewTranslateX !== 'undefined') ? viewTranslateX : 0,
        viewTranslateY: (typeof viewTranslateY !== 'undefined') ? viewTranslateY : 0,
        viewScale: (typeof viewScale !== 'undefined') ? viewScale : 1,
        viewRotate: (typeof viewRotate !== 'undefined') ? viewRotate : 0,
        viewRotateX: (typeof viewRotateX !== 'undefined') ? viewRotateX : 0,
        viewRotateY: (typeof viewRotateY !== 'undefined') ? viewRotateY : 0,
        cameraX: (typeof cameraX !== 'undefined') ? cameraX : 0,
        cameraY: (typeof cameraY !== 'undefined') ? cameraY : 0,
        cameraZ: (typeof cameraZ !== 'undefined') ? cameraZ : 1000,
        cameraPitch: (typeof cameraPitch !== 'undefined') ? cameraPitch : 0,
        cameraYaw: (typeof cameraYaw !== 'undefined') ? cameraYaw : 0,
        cameraRoll: (typeof cameraRoll !== 'undefined') ? cameraRoll : 0,
        cameraFocalLength: (typeof cameraFocalLength !== 'undefined') ? cameraFocalLength : 1000,
        cameraDistance: (typeof cameraDistance !== 'undefined') ? cameraDistance : 1000,
        orbitCenterX: (typeof orbitCenterX !== 'undefined') ? orbitCenterX : 960,
        orbitCenterY: (typeof orbitCenterY !== 'undefined') ? orbitCenterY : 540,
        orbitCenterZ: (typeof orbitCenterZ !== 'undefined') ? orbitCenterZ : 0
      },
      bgColor: (function() {
        const pc = document.getElementById('previewContainer');
        if (pc) {
          const bg = getComputedStyle(pc).backgroundColor;
          if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg;
        }
        return '#ffffff';
      })(),
      blocks: blocks.filter(b => b && b.block).map(b => {
        let currentAnim = 'none';
        if (typeof animPresets !== 'undefined') {
          for (const anim of animPresets) {
            if (b.block.classList.contains('anim-' + anim)) {
              currentAnim = anim;
              break;
            }
          }
        }
        const editInput = b.block.querySelector('.edit-input');
        const textContent = b.block.querySelector('.text-content');
        return {
          id: b.id || 0,
          text: (editInput && editInput.value) || (textContent && textContent.textContent) || '',
          fontSize: parseInt(b.block.style.fontSize) || 50,
          fontName: b.fontName || 'XXOBS-VF',
          weight: b.weight || 400,
          color: b.block.style.color || '#111111',
          left: parseInt(b.block.style.left) || 0,
          top: parseInt(b.block.style.top) || 0,
          rotate: b.block.style.getPropertyValue('--rotate-angle') || '0deg',
          flipped: b.block.dataset.flipped === 'true',
          flippedY: b.block.dataset.flippedY === 'true',
          vertical: b.block.classList.contains('vertical'),
          animation: currentAnim,
          animationSpeed: b.animationSpeed || 1,
          weightAnimMin: b.weightAnimMin || 100,
          weightAnimMax: b.weightAnimMax || 900,
          weightAnimSpeed: b.weightAnimSpeed || 1,
          zIndex: (b.zIndex !== undefined) ? b.zIndex : (parseInt(b.block.style.zIndex) || 0)
        };
      }),
      bgImages: bgImages.map(bg => ({
        id: bg.id || 0,
        src: bg.src || '',
        name: bg.name || '背景图',
        x: bg.x || 0,
        y: bg.y || 0,
        width: bg.width || 400,
        height: bg.height || 300,
        zIndex: bg.zIndex || 0,
        startTime: bg.startTime || 0,
        duration: bg.duration || 10,
        rotation: bg.rotation || 0
      })),
      videoItems: savedVideoItems,
      animations: blockAnimations || {},
      canvasSize: currentExportSize,
      nextBlockId: (typeof blockIdCounter !== 'undefined') ? blockIdCounter : 1
    };
    
    const jsonStr = JSON.stringify(saveData, null, 2);
    console.log('[保存] 数据构建完成, 大小:', jsonStr.length, '字节');
    
    // ---- 保存到服务器 ----
    async function saveToServer(fileName) {
      const formData = new FormData();
      formData.append('action', 'save');
      formData.append('file', fileName);
      formData.append('data', jsonStr);
      formData.append('size', currentExportSize);
      
      console.log('[保存] 发送到服务器, 文件:', fileName, ', 尺寸:', currentExportSize);
      const resp = await fetch('list_typeanim.php', { method: 'POST', body: formData });
      const result = await resp.json();
      console.log('[保存] 服务器响应:', result);
      
      if (result.status === 'ok') {
        currentZimanhuaFileName = fileName;
        currentZimanhuaFileSize = currentExportSize;
        currentZimanhuaSizeFilter = currentExportSize;
        if (typeof updateZimanhuaSizeBtns === 'function') updateZimanhuaSizeBtns();
        showTip('已保存: ' + fileName);
        // openZimanhuaPanel 内部会调用 loadZimanhuaList，避免重复刷新
        if (typeof openZimanhuaPanel === 'function') openZimanhuaPanel();
        return true;
      } else {
        throw new Error(result.status || '未知错误');
      }
    }
    
    // ---- 处理三种保存场景 ----
    
    // 场景1: 已有文件且非另存为 → 直接覆盖保存
    if (currentZimanhuaFileName && !forceSaveAs) {
      try {
        // 尺寸变化时删除旧文件
        if (currentZimanhuaFileSize && currentZimanhuaFileSize !== currentExportSize) {
          try {
            await fetch('list_typeanim.php?size=' + encodeURIComponent(currentZimanhuaFileSize), {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: 'action=delete&file=' + encodeURIComponent(currentZimanhuaFileName)
            });
          } catch (e) {
            console.warn('[保存] 删除旧尺寸文件失败:', e);
          }
        }
        await saveToServer(currentZimanhuaFileName);
        return;
      } catch (err) {
        console.error('[保存] 直接保存失败:', err);
        showTip('保存失败：' + err.message);
        return;
      }
    }
    
    // 场景2: 新建或另存为 → 提示输入文件名
    let targetFileName = null;
    if (!currentZimanhuaFileName && !forceSaveAs) {
      const defaultName = `动画_${new Date().toISOString().slice(0,19).replace(/[T:]/g, '-')}`;
      const input = prompt('请输入文件名：', defaultName);
      if (!input) { showTip('已取消保存'); return; }
      targetFileName = input.endsWith('.json') ? input : input + '.json';
    } else if (forceSaveAs) {
      const defaultName = currentZimanhuaFileName
        ? currentZimanhuaFileName.replace(/\.json$/, '') + '_副本'
        : `动画_${new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}`;
      const input = prompt('请输入另存为的文件名：', defaultName);
      if (!input || !input.trim()) return;
      targetFileName = input.trim().endsWith('.json') ? input.trim() : input.trim() + '.json';
    }
    
    if (targetFileName) {
      try {
        await saveToServer(targetFileName);
        return;
      } catch (err) {
        console.error('[保存] 保存到服务器失败:', err);
        showTip('保存失败：' + err.message);
        return;
      }
    }
    
    // 场景3: 本地下载（兜底方案）
    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `动画_${new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showTip('项目已下载保存');
    } catch (err) {
      showTip('保存失败：' + err.message);
    }
    
  } catch (err) {
    console.error('[保存] 严重错误:', err);
    showTip('保存失败：' + err.message);
  }
}



// 导入动画按钮
const loadAnimBtn = document.getElementById('loadAnimBtn');
const fileInput = document.createElement('input');
fileInput.id = 'menuFileInput';
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

if (loadAnimBtn) {
  loadAnimBtn.addEventListener('click', () => {
    fileInput.click();
  });
}

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (typeof data !== 'object' || data === null) {
      showTip('文件格式无效');
      return;
    }

    // 从本地文件加载时，清除当前字漫画文件标记
    currentZimanhuaFileName = null;

    // 清空现有内容（文字块、图片块、视频块）
    document.querySelectorAll('.text-block').forEach(b => b.remove());
    document.querySelectorAll('#blocksContainer .bg-image-item').forEach(b => b.remove());
    document.querySelectorAll('#blocksContainer .video-item').forEach(b => b.remove());
    blocks = [];
    blockAnimations = {};
    bgImages = [];
    videoItems = [];
    bgImageIdCounter = 0;
    videoIdCounter = 0;
    selectedBgImageId = null;
    selectedVideoId = null;
    
    // 恢复视图状态
    if (data.viewState) {
      viewTranslateX = data.viewState.viewTranslateX || 0;
      viewTranslateY = data.viewState.viewTranslateY || 0;
      viewScale = data.viewState.viewScale || 1;
      viewRotate = data.viewState.viewRotate || 0;
      viewRotateX = data.viewState.viewRotateX || 0;
      viewRotateY = data.viewState.viewRotateY || 0;
      cameraX = data.viewState.cameraX || 0;
      cameraY = data.viewState.cameraY || 0;
      cameraZ = data.viewState.cameraZ || 1000;
      cameraPitch = data.viewState.cameraPitch || 0;
      cameraYaw = data.viewState.cameraYaw || 0;
      cameraRoll = data.viewState.cameraRoll || 0;
      cameraFocalLength = data.viewState.cameraFocalLength || 1000;
      cameraDistance = data.viewState.cameraDistance || 1000;
      orbitCenterX = data.viewState.orbitCenterX || BASE_WIDTH / 2;
      orbitCenterY = data.viewState.orbitCenterY || BASE_HEIGHT / 2;
      orbitCenterZ = data.viewState.orbitCenterZ || 0;
      applyTransform();
    }
    // 恢复背景色（无论是否有保存的背景色，都要设置，避免保持之前的颜色）
    const restoreBgColor = data.bgColor || '#ffffff';
    const contentLayerEl = document.getElementById('contentLayer');
    const previewContEl = document.getElementById('previewContainer');
    if (contentLayerEl) contentLayerEl.style.backgroundColor = restoreBgColor;
    if (previewContEl) previewContEl.style.backgroundColor = restoreBgColor;
    const bgColorInput = document.getElementById('bgColor');
    if (bgColorInput) bgColorInput.value = restoreBgColor;

    // 恢复文字块
    let loadedCount = 0;
    if (data.blocks && Array.isArray(data.blocks)) {
      for (const blockData of data.blocks) {
        const oldId = blockData.id;
        // 临时设置blockIdCounter为旧ID-1，这样createBlock会生成正确的ID
        const originalCounter = blockIdCounter;
        blockIdCounter = oldId - 1;
        
        await createBlock(
          blockData.left || 0,
          blockData.top || 0,
          blockData.text || '文字',
          blockData.fontSize || 50,
          blockData.color || '#111111',
          blockData.fontName || 'XXOBS-VF',
          blockData.weight || 400
        );
        
        const newBlock = blocks[blocks.length - 1].block;
        
        // 恢复翻转状态
        if (blockData.flipped) {
          newBlock.dataset.flipped = 'true';
        }
        
        // 恢复竖排状态
        if (blockData.vertical) {
          newBlock.classList.add('vertical');
        }
        
        // 恢复旋转角度
        if (blockData.rotate && blockData.rotate !== '0deg') {
          newBlock.style.setProperty('--rotate-angle', blockData.rotate);
        }
        
        // 恢复动画相关属性
        if (blocks[blocks.length - 1]) {
          blocks[blocks.length - 1].animationSpeed = blockData.animationSpeed || 1;
          blocks[blocks.length - 1].weightAnimMin = blockData.weightAnimMin || 100;
          blocks[blocks.length - 1].weightAnimMax = blockData.weightAnimMax || 900;
          blocks[blocks.length - 1].weightAnimSpeed = blockData.weightAnimSpeed || 1;
          // 恢复 zIndex
          if (blockData.zIndex !== undefined) {
            blocks[blocks.length - 1].zIndex = blockData.zIndex;
            newBlock.style.zIndex = blockData.zIndex;
          }
        }
        
        loadedCount++;
        
        // 恢复blockIdCounter
        blockIdCounter = Math.max(originalCounter, oldId);
      }
    }
    
    // 恢复图片块
    if (data.bgImages && Array.isArray(data.bgImages)) {
      for (const bgData of data.bgImages) {
        const bgImage = {
          id: bgData.id || (++bgImageIdCounter),
          src: bgData.src,
          name: bgData.name || '背景图',
          x: bgData.x || 0,
          y: bgData.y || 0,
          width: bgData.width || 400,
          height: bgData.height || 300,
          zIndex: bgData.zIndex || bgImages.length,
          startTime: bgData.startTime || 0,
          duration: bgData.duration || 10,
          rotation: bgData.rotation || 0
        };
        bgImageIdCounter = Math.max(bgImageIdCounter, bgImage.id);
        bgImages.push(bgImage);
        renderBgImage(bgImage);
      }
      if (bgImages.length > 0) updateBgImagesContainerTransform();
    }
    
    // 恢复视频块
    if (data.videoItems && Array.isArray(data.videoItems)) {
      for (const vData of data.videoItems) {
        const video = {
          id: vData.id || (++videoIdCounter),
          name: vData.name || '视频',
          src: vData.src,
          x: vData.x || 0,
          y: vData.y || 0,
          width: vData.width || 400,
          height: vData.height || 300,
          zIndex: vData.zIndex || videoItems.length,
          duration: vData.duration || 10,
          startTime: vData.startTime || 0,
          volume: vData.volume || 0
        };
        videoIdCounter = Math.max(videoIdCounter, video.id);
        videoItems.push(video);
        renderVideo(video);
      }
      if (videoItems.length > 0) updateVideosContainerTransform();
    }
    
    // 恢复动画数据（ID已经一致，直接使用）
    if (data.animations) {
      blockAnimations = data.animations;
    }
    
    // 刷新时间轴
    renderTimeline();
    
    const animCount = Object.keys(blockAnimations).filter(k => blockAnimations[k] && blockAnimations[k].length > 0).length;
    showTip(`已导入 ${loadedCount} 个文字块，${animCount} 组动画`);
  } catch (err) {
    showTip('导入失败：' + err.message);
  }
  
  fileInput.value = '';
});

// ==================== 导出视频：动画 Transform 计算 ====================
// 输入：动画名、进度(0-1)、是否循环预设、scale（高清缩放）
// 输出：{x, y, scaleX, scaleY, rotate, opacity, fontWeight}
function calcAnimTransform(animName, progress, isPreset = false, scale = 1) {
  // 预设动画是循环的，progress 需要取模
  if (isPreset) {
    progress = progress % 1;
  }
  
  const result = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, fontWeight: null };
  
  // ===== 入场动画 =====
  if (animName === 'fadeIn') {
    result.opacity = progress;
    return result;
  }
  if (animName === 'slideLeft') {
    result.x = -100 * scale * (1 - progress);
    result.opacity = progress;
    return result;
  }
  if (animName === 'slideRight') {
    result.x = 100 * scale * (1 - progress);
    result.opacity = progress;
    return result;
  }
  if (animName === 'slideUp') {
    result.y = 100 * scale * (1 - progress);
    result.opacity = progress;
    return result;
  }
  if (animName === 'slideDown') {
    result.y = -100 * scale * (1 - progress);
    result.opacity = progress;
    return result;
  }
  if (animName === 'zoomIn') {
    const s = 0.5 + 0.5 * progress;
    result.scaleX = s;
    result.scaleY = s;
    result.opacity = progress;
    return result;
  }
  if (animName === 'rotateIn') {
    const s = progress;
    result.scaleX = s;
    result.scaleY = s;
    result.rotate = -180 * (1 - progress);
    result.opacity = progress;
    return result;
  }
  if (animName === 'bounceIn') {
    let s;
    if (progress < 0.5) s = progress * 2 * 1.2;
    else if (progress < 0.7) s = 1.2 - (progress - 0.5) / 0.2 * 0.3;
    else s = 0.9 + (progress - 0.7) / 0.3 * 1;
    result.scaleX = s;
    result.scaleY = s;
    result.opacity = Math.min(1, progress * 2);
    return result;
  }
  
  // ===== 出场动画 =====
  if (animName === 'fadeOut') {
    result.opacity = 1 - progress;
    return result;
  }
  if (animName === 'slideLeftOut') {
    result.x = -100 * scale * progress;
    result.opacity = 1 - progress;
    return result;
  }
  if (animName === 'slideRightOut') {
    result.x = 100 * scale * progress;
    result.opacity = 1 - progress;
    return result;
  }
  if (animName === 'slideUpOut') {
    result.y = -100 * scale * progress;
    result.opacity = 1 - progress;
    return result;
  }
  if (animName === 'slideDownOut') {
    result.y = 100 * scale * progress;
    result.opacity = 1 - progress;
    return result;
  }
  if (animName === 'zoomOut') {
    const s = 1 - 0.5 * progress;
    result.scaleX = s;
    result.scaleY = s;
    result.opacity = 1 - progress;
    return result;
  }
  if (animName === 'rotateOut') {
    const s = 1 - progress;
    result.scaleX = s;
    result.scaleY = s;
    result.rotate = 180 * progress;
    result.opacity = 1 - progress;
    return result;
  }
  if (animName === 'bounceOut') {
    let s;
    if (progress < 0.3) s = 1 + progress / 0.3 * 0.2;
    else if (progress < 0.5) s = 1.2 - (progress - 0.3) / 0.2 * 0.3;
    else s = 0.9 * (1 - (progress - 0.5) / 0.5);
    result.scaleX = s;
    result.scaleY = s;
    result.opacity = Math.max(0, 1 - progress * 1.5);
    return result;
  }
  
  // ===== 字重动画 =====
  if (animName === 'weightCycle') {
    result.fontWeight = 400 + 500 * (1 - Math.cos(progress * Math.PI * 2)) / 2;
    return result;
  }
  
  // ===== 基础预设动画 =====
  const p = progress;
  const pi2 = Math.PI * 2;

  if (animName === 'static') {
    // 静态动画 - 不做任何变化
    return result;
  }
  if (animName === 'shake') {
    result.x = (p < 0.25 ? -5 * (p / 0.25) : p < 0.75 ? -5 + 10 * ((p - 0.25) / 0.5) : 5 - 5 * ((p - 0.75) / 0.25)) * scale;
    result.rotate = p < 0.25 ? -5 * (p / 0.25) : p < 0.75 ? -5 + 10 * ((p - 0.25) / 0.5) : 5 - 5 * ((p - 0.75) / 0.25);
    return result;
  }
  if (animName === 'fall') {
    result.y = 50 * scale * p;
    result.rotate = 15 * p;
    return result;
  }
  if (animName === 'jump') {
    result.y = -30 * scale * Math.sin(p * Math.PI);
    return result;
  }
  if (animName === 'jump2') {
    result.y = -20 * scale * Math.sin(p * Math.PI);
    return result;
  }
  if (animName === 'run') {
    result.x = 20 * scale * Math.sin(p * pi2);
    const s = 1 + 0.1 * Math.sin(p * pi2);
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'run2') {
    result.y = -10 * scale * Math.sin(p * pi2);
    result.rotate = 5 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'walk') {
    result.x = 15 * scale * p;
    return result;
  }
  if (animName === 'spin') {
    result.rotate = 360 * p;
    return result;
  }
  if (animName === 'blink') {
    result.opacity = p < 0.5 ? 1 : 0;
    return result;
  }
  if (animName === 'pulse') {
    const s = 1 + 0.2 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'sway') {
    result.rotate = -10 + 20 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'bounce') {
    result.y = -20 * scale * Math.sin(p * Math.PI);
    return result;
  }
  if (animName === 'float') {
    result.y = -15 * scale * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'vibrate') {
    result.x = 2 * scale * Math.sin(p * pi2 * 2);
    result.y = 2 * scale * Math.cos(p * pi2 * 2);
    return result;
  }
  if (animName === 'slide') {
    result.x = scale * (-20 + 40 * (1 - Math.cos(p * pi2)) / 2);
    return result;
  }
  if (animName === 'zoom') {
    const s = 1 - 0.2 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'swing') {
    result.rotate = -15 + 30 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'dive') {
    result.y = 25 * scale * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'rise') {
    result.y = -25 * scale * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'dash') {
    result.x = 30 * scale * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'breathe') {
    const s = 1 + 0.1 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'flicker') {
    result.opacity = p < 0.25 ? 1 - 0.5 * (p / 0.25) : p < 0.75 ? 0.5 + 0.3 * ((p - 0.25) / 0.5) : 0.8 + 0.2 * ((p - 0.75) / 0.25);
    result.x = (p < 0.25 ? -3 * (p / 0.25) : p < 0.75 ? -3 + 6 * ((p - 0.25) / 0.5) : 3 - 3 * ((p - 0.75) / 0.25)) * scale;
    return result;
  }
  
  // ===== 动作动画 =====
  if (animName === 'wave') {
    result.rotate = p < 0.25 ? 20 * (p / 0.25) : p < 0.75 ? 20 - 40 * ((p - 0.25) / 0.5) : -20 + 20 * ((p - 0.75) / 0.25);
    return result;
  }
  if (animName === 'clap') {
    const s = 1 + 0.1 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'nod') {
    result.rotate = -5 + 10 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'shakehead') {
    result.rotate = p < 0.25 ? -15 * (p / 0.25) : p < 0.75 ? -15 + 30 * ((p - 0.25) / 0.5) : 15 - 15 * ((p - 0.75) / 0.25);
    return result;
  }
  if (animName === 'stretch') {
    const s = 1 + 0.1 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleY = s;
    return result;
  }
  if (animName === 'sleep') {
    result.rotate = 2 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'fly') {
    result.y = -15 * scale * (1 - Math.cos(p * pi2)) / 2;
    result.rotate = -5 + 10 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'crawl') {
    result.x = 10 * scale * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'waddle') {
    result.x = 8 * scale * (1 - Math.cos(p * pi2)) / 2;
    result.rotate = -8 + 16 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'eat') {
    result.y = (p < 0.25 ? 3 * (p / 0.25) : p < 0.75 ? 3 - 6 * ((p - 0.25) / 0.5) : -3 + 3 * ((p - 0.75) / 0.25)) * scale;
    return result;
  }
  
  // ===== 3D 动画（用 2D 缩放模拟） =====
  if (animName === 'flip3D') {
    result.scaleX = Math.cos(p * pi2);
    return result;
  }
  if (animName === 'rotate3DY') {
    result.scaleX = Math.cos(p * pi2);
    return result;
  }
  if (animName === 'rotate3DX') {
    result.scaleY = Math.cos(p * pi2);
    return result;
  }
  if (animName === 'swing3D') {
    result.scaleY = 0.9 + 0.1 * Math.cos(p * pi2);
    result.rotate = -5 + 10 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'zoom3D') {
    const s = 1 + 0.3 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'spin3D') {
    result.scaleX = Math.cos(p * pi2);
    result.rotate = 180 * p;
    return result;
  }
  if (animName === 'tilt3D') {
    result.scaleX = 0.9 + 0.1 * Math.cos(p * pi2);
    result.scaleY = 0.95 + 0.05 * Math.sin(p * pi2);
    result.rotate = 5 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'bounce3D') {
    result.y = -20 * scale * Math.sin(p * Math.PI);
    const s = 1 + 0.1 * Math.sin(p * Math.PI);
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'twist3D') {
    result.scaleX = 0.85 + 0.15 * Math.abs(Math.cos(p * pi2));
    result.rotate = 20 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'roll3D') {
    result.scaleY = Math.cos(p * pi2);
    return result;
  }
  if (animName === 'explode3D') {
    const s = 1 + p;
    result.scaleX = s;
    result.scaleY = s;
    result.opacity = 1 - p;
    return result;
  }
  if (animName === 'implode3D') {
    const s = 2 - p;
    result.scaleX = s;
    result.scaleY = s;
    result.opacity = 0.5 + 0.5 * p;
    return result;
  }
  if (animName === 'spiral3D') {
    const r = p * 20;
    result.x = Math.sin(p * pi2) * r;
    result.y = -Math.cos(p * pi2) * r * 0.5;
    result.scaleX = 1 - p * 0.3;
    result.scaleY = 1 - p * 0.3;
    return result;
  }
  if (animName === 'wobble3D') {
    result.scaleX = 0.9 + 0.1 * Math.cos(p * pi2 * 2);
    result.scaleY = 0.95 + 0.05 * Math.sin(p * pi2);
    result.x = 5 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'flipOut3D') {
    result.scaleX = Math.cos(p * Math.PI);
    result.opacity = 1 - p;
    return result;
  }
  if (animName === 'shake3D') {
    result.x = Math.sin(p * pi2 * 4) * 5;
    result.y = Math.cos(p * pi2 * 3) * 3;
    result.rotate = Math.sin(p * pi2 * 2) * 8;
    return result;
  }
  if (animName === 'pulse3D') {
    const s = 1 + 0.3 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'swingWild3D') {
    result.rotate = -30 + 60 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleY = 0.9 + 0.1 * Math.cos(p * pi2);
    return result;
  }
  if (animName === 'zoomCrazy3D') {
    const s = 1 + 0.5 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = s;
    result.scaleY = s;
    result.opacity = 0.7 + 0.3 * Math.cos(p * pi2);
    return result;
  }
  if (animName === 'rotateCrazy3D') {
    result.rotate = 360 * p;
    result.scaleX = Math.cos(p * pi2 * 2) * 0.3 + 0.7;
    result.scaleY = 0.8 + 0.2 * Math.sin(p * pi2);
    return result;
  }
  
  // ===== 半身动画（简单近似，用缩放/旋转模拟） =====
  if (animName === 'legKick' || animName === 'bigKick') {
    result.rotate = 20 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'footTap' || animName === 'stompHard') {
    result.y = -8 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'legSwing') {
    result.rotate = 15 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'hipShake' || animName === 'shakeHip') {
    result.x = 12 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'kneeBend') {
    result.scaleY = 0.95 + 0.05 * Math.cos(p * pi2);
    return result;
  }
  if (animName === 'footWiggle' || animName === 'wiggleLeg') {
    result.rotate = 10 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'legMarch' || animName === 'highStep') {
    result.y = -12 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'hipTwist' || animName === 'twistWaist') {
    result.rotate = 8 * Math.sin(p * pi2);
    result.scaleX = 0.95 + 0.05 * Math.cos(p * pi2);
    return result;
  }
  if (animName === 'footStomp' || animName === 'jumpFeet') {
    result.y = -15 * Math.sin(p * Math.PI);
    const s = 1 + 0.1 * Math.sin(p * Math.PI);
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'legStretch') {
    result.scaleY = 1 + 0.1 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  
  if (animName === 'slideFeet') {
    result.x = 15 * scale * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'squatBounce') {
    result.y = -18 * scale * Math.sin(p * Math.PI);
    const s = 1 + 0.08 * Math.sin(p * Math.PI);
    result.scaleX = s;
    result.scaleY = 1 / s;
    return result;
  }
  if (animName === 'splitLegs') {
    result.scaleX = 1 + 0.15 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'armWave') {
    result.rotate = 10 * Math.sin(p * pi2);
    result.x = 5 * scale * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'armSwing') {
    result.rotate = -8 + 16 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'armRaise') {
    result.y = -15 * scale * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'shoulderShrug') {
    result.y = -8 * scale * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'shoulderShake') {
    result.x = 6 * scale * Math.sin(p * pi2 * 2);
    return result;
  }
  if (animName === 'fingerTap') {
    result.scaleX = 0.97 + 0.03 * Math.sin(p * pi2 * 2);
    return result;
  }
  if (animName === 'wristTwist') {
    result.rotate = 8 * Math.sin(p * pi2 * 2);
    return result;
  }
  if (animName === 'elbowHit') {
    result.x = 10 * scale * Math.sin(p * pi2);
    result.rotate = 5 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'armStretch') {
    result.scaleX = 1 + 0.1 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'handClap') {
    result.scaleX = 0.9 + 0.1 * Math.sin(p * pi2 * 2);
    result.scaleY = 1.05 - 0.05 * Math.sin(p * pi2 * 2);
    return result;
  }
  if (animName === 'bigArmSwing') {
    result.rotate = -15 + 30 * Math.sin(p * pi2);
    result.x = 8 * scale * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'wildShrug') {
    result.y = -20 * scale * Math.sin(p * pi2 * 2);
    result.rotate = 3 * Math.sin(p * pi2 * 2);
    return result;
  }
  if (animName === 'highArmRaise') {
    result.y = -25 * scale * (1 - Math.cos(p * pi2)) / 2;
    result.scaleY = 1 + 0.1 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'wildShoulder') {
    result.x = 12 * scale * Math.sin(p * pi2 * 2);
    result.rotate = 8 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'bigWave') {
    result.rotate = -20 + 40 * Math.sin(p * pi2 * 2);
    result.x = 10 * scale * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'exaggeratedClap') {
    result.scaleX = 0.8 + 0.2 * Math.sin(p * pi2 * 2);
    result.scaleY = 1.1 - 0.1 * Math.sin(p * pi2 * 2);
    result.rotate = 5 * Math.sin(p * pi2 * 2);
    return result;
  }
  if (animName === 'bigArmFling') {
    result.rotate = 60 * p - 30;
    result.x = 15 * scale * Math.sin(p * Math.PI);
    return result;
  }
  if (animName === 'wildPunch') {
    result.x = 20 * scale * Math.sin(p * pi2);
    result.scaleX = 1 + 0.05 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'bigStretch') {
    result.scaleY = 1 + 0.15 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = 1 - 0.05 * (1 - Math.cos(p * pi2)) / 2;
    result.y = -10 * scale * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'wildArmShake') {
    result.x = 8 * scale * Math.sin(p * pi2 * 4);
    result.rotate = 10 * Math.sin(p * pi2 * 3);
    return result;
  }
  if (animName === 'bottomSwing') {
    result.rotate = 12 * Math.sin(p * pi2);
    result.x = 6 * scale * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'bottomShake') {
    result.x = 8 * scale * Math.sin(p * pi2 * 3);
    return result;
  }
  if (animName === 'bottomBounce') {
    result.y = -20 * scale * Math.sin(p * Math.PI);
    return result;
  }
  if (animName === 'bottomSpin') {
    result.rotate = 360 * p;
    return result;
  }
  if (animName === 'bottomScale') {
    const bts = 1 + 0.15 * Math.sin(p * pi2);
    result.scaleX = bts;
    result.scaleY = bts;
    return result;
  }
  if (animName === 'bottomSlide') {
    result.x = 20 * scale * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'bottomBend') {
    result.rotate = 15 * Math.sin(p * pi2);
    result.scaleY = 0.95 + 0.05 * Math.cos(p * pi2);
    return result;
  }
  if (animName === 'bottomFling') {
    result.rotate = 30 * Math.sin(p * Math.PI);
    result.y = -10 * scale * Math.sin(p * Math.PI);
    return result;
  }
  if (animName === 'bottomVibrate') {
    result.x = Math.sin(p * pi2 * 8) * 4 * scale;
    result.y = Math.cos(p * pi2 * 6) * 3 * scale;
    return result;
  }
  if (animName === 'bottomSway') {
    result.rotate = 10 * Math.sin(p * pi2);
    result.x = 8 * scale * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'fullBodyShake') {
    result.x = 5 * scale * Math.sin(p * pi2 * 6);
    result.y = 3 * scale * Math.cos(p * pi2 * 5);
    result.rotate = 3 * Math.sin(p * pi2 * 4);
    return result;
  }
  if (animName === 'wildSpin') {
    result.rotate = 720 * p;
    const ws = 0.8 + 0.2 * Math.sin(p * pi2);
    result.scaleX = ws;
    result.scaleY = ws;
    return result;
  }
  if (animName === 'wildTwitch') {
    result.x = 6 * scale * Math.sin(p * pi2 * 5);
    result.rotate = 8 * Math.sin(p * pi2 * 3);
    return result;
  }
  if (animName === 'wildVibrate') {
    result.x = Math.sin(p * pi2 * 10) * 5 * scale;
    result.y = Math.cos(p * pi2 * 7) * 3 * scale;
    return result;
  }
  if (animName === 'crazyRoll') {
    result.rotate = 720 * p;
    result.x = 30 * scale * Math.sin(p * Math.PI);
    return result;
  }
  if (animName === 'wildDash') {
    result.x = 40 * scale * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'crazyBurst') {
    const cbs = 1 + 0.5 * Math.sin(p * Math.PI);
    result.scaleX = cbs;
    result.scaleY = cbs;
    result.opacity = 1 - 0.5 * Math.sin(p * Math.PI);
    return result;
  }
  // ===== 疯狂动画（放大版基础动画） =====
  if (animName === 'crazyShake') {
    result.x = 10 * Math.sin(p * pi2 * 2);
    result.rotate = 15 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'crazySpin') {
    result.rotate = 720 * p;
    return result;
  }
  if (animName === 'crazyJump') {
    result.y = -50 * Math.sin(p * Math.PI);
    return result;
  }
  if (animName === 'crazyRun') {
    result.x = 40 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'crazyBounce') {
    result.y = -40 * Math.sin(p * Math.PI);
    return result;
  }
  if (animName === 'crazyVibrate') {
    result.x = Math.sin(p * pi2 * 8) * 5;
    result.y = Math.cos(p * pi2 * 6) * 5;
    return result;
  }
  if (animName === 'crazyFlip') {
    result.scaleX = Math.cos(p * pi2 * 2);
    result.rotate = 360 * p;
    return result;
  }
  if (animName === 'crazySwing') {
    result.rotate = -30 + 60 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'crazyDance') {
    result.x = 15 * Math.sin(p * pi2);
    result.y = -10 * Math.cos(p * pi2 * 2);
    result.rotate = 10 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'crazyWiggle') {
    result.x = 8 * Math.sin(p * pi2 * 3);
    result.rotate = 12 * Math.sin(p * pi2 * 2);
    return result;
  }
  if (animName === 'crazyZoom') {
    const s = 1 + 0.5 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'crazyTwist') {
    result.rotate = 30 * Math.sin(p * pi2);
    result.scaleX = 0.85 + 0.15 * Math.cos(p * pi2);
    return result;
  }
  if (animName === 'crazyFall') {
    result.y = 80 * p;
    result.rotate = 30 * p;
    return result;
  }
  if (animName === 'crazyRise') {
    result.y = -80 * p;
    return result;
  }
  if (animName === 'crazyPulse') {
    const s = 1 + 0.4 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'crazyFloat') {
    result.y = -25 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'crazyDash') {
    result.x = 50 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'crazySway') {
    result.rotate = -20 + 40 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'crazyBreathe') {
    const s = 1 + 0.2 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'crazyFlicker') {
    result.opacity = 0.3 + 0.7 * Math.random();
    result.x = 5 * Math.sin(p * pi2 * 4);
    return result;
  }
  if (animName === 'crazyBlink') {
    result.opacity = Math.floor(p * 4) % 2 === 0 ? 1 : 0;
    return result;
  }
  if (animName === 'crazySlide') {
    result.x = -40 + 80 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'crazyDive') {
    result.y = 40 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'crazyWalk') {
    result.x = 30 * p;
    result.y = -5 * Math.sin(p * pi2 * 4);
    return result;
  }
  if (animName === 'crazyClap') {
    const s = 1 + 0.2 * (1 - Math.cos(p * pi2)) / 2;
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'crazyNod') {
    result.rotate = -15 + 30 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'crazyStretch') {
    result.scaleY = 1 + 0.2 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'crazyCrawl') {
    result.x = 20 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  if (animName === 'crazySwayWalk') {
    result.x = 15 * (1 - Math.cos(p * pi2)) / 2;
    result.rotate = -10 + 20 * (1 - Math.cos(p * pi2)) / 2;
    return result;
  }
  

  // ===== 新增预设动画 =====
  if (animName === 'twist') {
    result.rotate = 10 * Math.sin(p * pi2);
    result.scaleX = 0.9 + 0.1 * Math.cos(p * pi2);
    return result;
  }
  if (animName === 'spiral') {
    const sp = p * pi2 * 2;
    const spR = 15 * scale * p;
    result.x = Math.sin(sp) * spR;
    result.y = -Math.cos(sp) * spR * 0.5;
    result.rotate = 360 * p;
    const s = 0.5 + 0.5 * p;
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'ripple') {
    result.scaleX = 1 + 0.3 * Math.sin(p * pi2 * 1.5);
    result.scaleY = 1 + 0.3 * Math.sin(p * pi2 * 1.5);
    result.opacity = 0.6 + 0.4 * Math.cos(p * pi2 * 1.5);
    return result;
  }
  if (animName === 'rotate') {
    result.rotate = 360 * p;
    return result;
  }
  if (animName === 'flipX') {
    result.scaleX = Math.cos(p * pi2);
    return result;
  }
  if (animName === 'flipY') {
    result.scaleY = Math.cos(p * pi2);
    return result;
  }
  if (animName === 'heartbeat') {
    const s = 1 + 0.15 * Math.sin(p * pi2 * 2);
    result.scaleX = s;
    result.scaleY = s;
    return result;
  }
  if (animName === 'tada') {
    const s = p < 0.1 ? 1 + 0.2 * (p / 0.1) :
              p < 0.2 ? 1.2 - 0.2 * ((p - 0.1) / 0.1) :
              p < 0.8 ? 1 + 0.05 * Math.sin((p - 0.2) * pi2 * 3) :
              p < 0.9 ? 1.05 - 0.05 * ((p - 0.8) / 0.1) : 1;
    result.scaleX = s;
    result.scaleY = s;
    result.rotate = p < 0.1 ? 0 :
                    p < 0.8 ? 5 * Math.sin((p - 0.1) * pi2 * 3) :
                    5 * Math.sin((p - 0.1) * pi2 * 3) * (1 - (p - 0.8) / 0.1);
    return result;
  }
  if (animName === 'rubberBand') {
    result.scaleX = 1 + 0.25 * Math.sin(p * pi2);
    result.scaleY = 1 - 0.15 * Math.sin(p * pi2);
    return result;
  }
  if (animName === 'wobble') {
    result.x = 10 * scale * Math.sin(p * pi2 * 3);
    result.rotate = -5 + 10 * Math.sin(p * pi2 * 2);
    return result;
  }
  if (animName === 'jello') {
    result.scaleX = 1 + 0.1 * Math.sin(p * pi2 * 3);
    result.scaleY = 1 - 0.1 * Math.sin(p * pi2 * 3 + 0.3);
    result.rotate = 3 * Math.sin(p * pi2 * 2);
    return result;
  }
  if (animName === 'lightSpeed') {
    result.x = -100 * scale * (1 - p);
    result.opacity = p;
    result.scaleX = 0.5 + 0.5 * p;
    result.scaleY = 0.8 + 0.2 * p;
    return result;
  }
  if (animName === 'rollIn') {
    result.x = -80 * scale * (1 - p);
    result.rotate = -360 * (1 - p);
    result.opacity = p;
    return result;
  }

  // ===== 打散动画（perChar动画）=====
  const shatterAnimNames = ['explodeShatter', 'verticalShatter', 'horizontalShatter', 'spinShatter', 'scaleShatter', 'waveShatter', 'diagonalShatter', 'spiralShatter', 'flipShatter', 'bounceShatter', 'randomShatter', 'implodeShatter', 'staggerShatter', 'petalShatter', 'pendulumShatter', 'rainShatter', 'tornadoShatter', 'heartbeatShatter', 'flickerShatter', 'springShatter'];
  if (shatterAnimNames.includes(animName)) {
    if (animName === 'spinShatter') {
      result.rotate = 360 * p;
    } else if (animName === 'scaleShatter') {
      if (p < 0.4) {
        result.scaleX = 1 - 0.8 * (p / 0.4);
        result.scaleY = 1 - 0.8 * (p / 0.4);
        result.opacity = 1 - 0.7 * (p / 0.4);
      } else {
        result.scaleX = 0.2 + 0.8 * ((p - 0.4) / 0.6);
        result.scaleY = 0.2 + 0.8 * ((p - 0.4) / 0.6);
        result.opacity = 0.3 + 0.7 * ((p - 0.4) / 0.6);
      }
    } else if (animName === 'flipShatter') {
      result.scaleX = Math.cos(p * pi2);
      result.opacity = 0.5 + 0.5 * Math.abs(Math.cos(p * pi2));
    } else if (animName === 'heartbeatShatter') {
      const s = 1 + 0.4 * Math.sin(p * pi2 * 2);
      result.scaleX = s;
      result.scaleY = s;
    } else if (animName === 'flickerShatter') {
      result.opacity = 0.3 + 0.7 * Math.cos(p * pi2 * 4);
    } else if (animName === 'springShatter') {
      if (p < 0.3) {
        result.scaleX = 1 + 0.3 * (p / 0.3);
        result.scaleY = 1 + 0.3 * (p / 0.3);
      } else if (p < 0.6) {
        result.scaleX = 1.3 - 0.5 * ((p - 0.3) / 0.3);
        result.scaleY = 1.3 - 0.5 * ((p - 0.3) / 0.3);
      } else {
        result.scaleX = 0.8 + 0.2 * ((p - 0.6) / 0.4);
        result.scaleY = 0.8 + 0.2 * ((p - 0.6) / 0.4);
      }
    } else if (animName === 'tornadoShatter') {
      result.rotate = 720 * p;
    } else if (animName === 'petalShatter') {
      result.rotate = 180 * p;
    } else if (animName === 'pendulumShatter') {
      result.rotate = -15 + 30 * Math.sin(p * pi2);
    } else if (animName === 'rainShatter') {
      result.opacity = 0.8 + 0.2 * (1 - Math.cos(p * pi2)) / 2;
    } else if (animName === 'spiralShatter') {
      result.rotate = 360 * p;
      const s = 1 + 0.2 * (1 - Math.cos(p * pi2)) / 2;
      result.scaleX = s;
      result.scaleY = s;
    } else if (animName === 'bounceShatter') {
      result.y = -20 * scale * Math.sin(p * Math.PI);
      const s = 1 + 0.1 * Math.sin(p * Math.PI);
      result.scaleX = s;
      result.scaleY = s;
    } else if (animName === 'implodeShatter') {
      const s = 1.2 - 0.2 * p;
      result.scaleX = s;
      result.scaleY = s;
    } else if (animName === 'waveShatter') {
      result.y = -15 * scale * Math.sin(p * pi2);
    } else if (animName === 'verticalShatter') {
      result.y = -10 * scale * Math.sin(p * pi2);
    } else if (animName === 'horizontalShatter') {
      result.x = 10 * scale * Math.sin(p * pi2);
    } else if (animName === 'diagonalShatter') {
      result.x = 10 * scale * Math.sin(p * pi2);
      result.y = -10 * scale * Math.sin(p * pi2);
    } else if (animName === 'randomShatter') {
      result.x = 5 * scale * Math.sin(p * pi2 * 3);
      result.y = 5 * scale * Math.cos(p * pi2 * 2);
      result.rotate = 10 * Math.sin(p * pi2);
    } else if (animName === 'staggerShatter') {
      const s = 1 + 0.15 * Math.sin(p * pi2 * 2);
      result.scaleX = s;
      result.scaleY = s;
    } else if (animName === 'explodeShatter') {
      const s = 1 + 0.3 * (1 - Math.cos(p * pi2)) / 2;
      result.scaleX = s;
      result.scaleY = s;
      result.opacity = 1 - 0.2 * (1 - Math.cos(p * pi2)) / 2;
    }
    return result;
  }

  // ===== 自定义插件动画 =====
  if (typeof AnimPluginLoader !== 'undefined' && AnimPluginLoader.isLoaded()) {
    const customResult = AnimPluginLoader.calcCustomAnimTransform(animName, progress, scale);
    if (customResult) {
      result.x = customResult.x || 0;
      result.y = customResult.y || 0;
      result.scaleX = customResult.scaleX !== undefined ? customResult.scaleX : 1;
      result.scaleY = customResult.scaleY !== undefined ? customResult.scaleY : 1;
      result.rotate = customResult.rotate || 0;
      if (customResult.opacity !== undefined) result.opacity = customResult.opacity;
      return result;
    }
  }
  
  // 默认：不动
  return result;
}

// 合并多个动画的 transform（叠加）
function mergeAnimTransforms(transforms) {
  const result = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, fontWeight: null };
  
  transforms.forEach(t => {
    result.x += t.x;
    result.y += t.y;
    result.scaleX *= t.scaleX;
    result.scaleY *= t.scaleY;
    result.rotate += t.rotate;
    result.opacity *= t.opacity;
    if (t.fontWeight !== null) result.fontWeight = t.fontWeight;
  });
  
  return result;
}

// 导出视频 - 使用纯 Canvas 2D 绘制 + 手动计算动画 transform
exportVideoBtn.addEventListener('click', async () => {
  // 先让用户选择保存位置
  let fileHandle = null;
  const supportsMp4 = MediaRecorder.isTypeSupported('video/mp4');
  const ext = supportsMp4 ? 'mp4' : 'webm';
  
  if ('showSaveFilePicker' in window) {
    try {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: `动画_${new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}.${ext}`,
        types: [{
          description: ext === 'mp4' ? 'MP4 视频' : 'WebM 视频',
          accept: { [ext === 'mp4' ? 'video/mp4' : 'video/webm']: [`.${ext}`] }
        }]
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      showTip('保存失败：' + err.message);
      return;
    }
  }
  
  // 停止当前播放
  if (isPlaying) {
    stopAnimation();
    await new Promise(r => setTimeout(r, 300));
  }
  
  // 检查是否有文字块
  const allExportBlocks = document.querySelectorAll('#contentLayer .text-block');
  if (allExportBlocks.length === 0) {
    showTip('暂无文字块，请先添加文字块');
    return;
  }
  
  exportVideoBtn.disabled = true;
  exportVideoBtn.textContent = '正在录制...';
  
  try {
    const contentLayer = document.getElementById('contentLayer');
    if (!contentLayer) throw new Error('找不到预览区域');
    
    // 收集所有动画
    const allAnims = [];
    Object.keys(blockAnimations).forEach(blockId => {
      if (blockId === '__bg__') return;
      const block = getBlockElement(blockId);
      if (!block) return;
      blockAnimations[blockId].forEach((anim, index) => {
        allAnims.push({ ...anim, blockId, index });
      });
    });
    
    // 如果没有动画，给一个默认时长（显示静态画面）
    let maxTime = 3;
    if (allAnims.length > 0) {
      allAnims.sort((a, b) => a.startTime - b.startTime);
      maxTime = Math.max(...allAnims.map(a => a.startTime + a.duration));
    }
    // 考虑视频时长
    if (videoItems && videoItems.length > 0) {
      videoItems.forEach(video => {
        const videoEndTime = video.startTime + video.duration;
        if (videoEndTime > maxTime) {
          maxTime = videoEndTime;
        }
      });
    }
    
    // 基准画布尺寸（blocksContainer 的原始设计尺寸）
    const baseW = BASE_WIDTH;
    const baseH = BASE_HEIGHT;
    
    // 根据选择的导出尺寸计算目标分辨率
    const sizeConfig = exportSizeMap[currentExportSize] || exportSizeMap['16:9'];
    const targetW = sizeConfig.w;
    const targetH = sizeConfig.h;
    
    // 目标canvas尺寸
    const width = targetW;
    const height = targetH;
    
    // 计算基准画布到目标导出尺寸的缩放比例（contain模式，与编辑模式保持一致）
    const baseScaleX = targetW / baseW;
    const baseScaleY = targetH / baseH;
    const scale = Math.min(baseScaleX, baseScaleY);
    
    // 基准画布在目标导出尺寸中的偏移（居中，与编辑模式一致）
    const offsetX = (targetW - baseW * scale) / 2;
    const offsetY = (targetH - baseH * scale) / 2;
    
    // 获取 blocksContainer 的实际缩放，用于反推基准尺寸
    const blocksCont = document.getElementById('blocksContainer');
    let containerScale = 1;
    if (blocksCont) {
      const cRect = blocksCont.getBoundingClientRect();
      containerScale = Math.min(cRect.width / baseW, cRect.height / baseH);
    }
    
    // 获取 contentLayer 尺寸，用于路径动画坐标转换
    const contentLayerEl = document.getElementById('contentLayer');
    const layerRect = contentLayerEl ? contentLayerEl.getBoundingClientRect() : { width: baseW, height: baseH };
    // 路径坐标转换参数：contentLayer 空间 → 1280x720 基准空间
    const pathToBaseScale = 1 / containerScale;
    const pathOffsetX = (layerRect.width - baseW * containerScale) / 2;
    const pathOffsetY = (layerRect.height - baseH * containerScale) / 2;
    // 预计算每个文字块的信息（基于 1280x720 基准坐标系）
    const blockInfos = new Map();
    // 导出所有文字块（包括无动画的）
    const allExportBlockEls = document.querySelectorAll('#contentLayer .text-block');
    allExportBlockEls.forEach(block => {
      const blockId = block.dataset.id;
      if (!blockId) return;
      
      const textContent = block.querySelector('.text-content');
      
      // 获取所有样式属性
      const computedStyle = window.getComputedStyle(block);
      const realColor = computedStyle.color || '#000000';
      const realBgColor = computedStyle.backgroundColor || 'transparent';
      const realFontWeight = parseInt(computedStyle.fontWeight) || 400;
      
      // 从 blockData 读取字号和字体名
      const blockData = blocks.find(b => b.block === block);
      const realFontSize = blockData?.fontSize || 30;
      const realFontFamily = blockData?.fontName || 'sans-serif';
      
      // 从 style 读取基准坐标（1280x720 空间中的像素值）
      const leftStr = block.style.left || '0px';
      const topStr = block.style.top || '0px';
      let baseLeft, baseTop;
      if (leftStr.includes('%')) {
        baseLeft = (parseFloat(leftStr) / 100) * baseW;
      } else {
        baseLeft = parseFloat(leftStr) || 0;
      }
      if (topStr.includes('%')) {
        baseTop = (parseFloat(topStr) / 100) * baseH;
      } else {
        baseTop = parseFloat(topStr) || 0;
      }
      
      // 直接使用 offsetWidth/offsetHeight 获取基准尺寸（不受 transform 影响）
      const baseBlockW = block.offsetWidth || 100;
      const baseBlockH = block.offsetHeight || 50;
      
      // 读取旋转角度
      const rotateAngle = parseFloat(block.style.getPropertyValue('--rotate-angle')) ||
                         parseFloat(blockData?.rotate) || 0;
      
      // 读取翻转状态
      const flipped = block.dataset.flipped === 'true';
      
      // 读取竖排状态
      const vertical = block.classList.contains('vertical');
      
      // 计算目标画布中的位置和尺寸
      const targetCenterX = (baseLeft + baseBlockW / 2) * scale + offsetX;
      const targetCenterY = (baseTop + baseBlockH / 2) * scale + offsetY;
      const targetWBlock = baseBlockW * scale;
      const targetHBlock = baseBlockH * scale;
      const targetFontSize = realFontSize * scale;
      
      blockInfos.set(blockId, {
        x: targetCenterX,
        y: targetCenterY,
        width: targetWBlock,
        height: targetHBlock,
        text: textContent ? textContent.textContent : '',
        color: realColor,
        bgColor: realBgColor,
        fontSize: targetFontSize,
        fontFamily: realFontFamily,
        fontWeight: realFontWeight,
        lineHeight: targetFontSize * 1.2,
        rotate: rotateAngle,
        flipX: flipped ? -1 : 1,
        vertical: vertical,
        scale: scale
      });
    });
    
    // 创建录制canvas（2x分辨率）
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // 确定格式和码率（高清视频用更高码率）
    let mimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
    else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) mimeType = 'video/webm;codecs=vp9';
    
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10000000 }); // 10Mbps码率
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: mimeType });
      
      if (fileHandle) {
        try {
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          showTip('视频已保存！');
        } catch (e) { showTip('保存失败：' + e.message); }
      } else {
        const downloadExt = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `动画_${Date.now()}.${downloadExt}`;
        a.click();
        URL.revokeObjectURL(url);
        showTip(`${downloadExt.toUpperCase()} 视频已下载！`);
      }
      
      exportVideoBtn.disabled = false;
      exportVideoBtn.textContent = '导出视频';
    };
    
    mediaRecorder.onerror = (e) => {
      showTip('录制失败: ' + (e.error?.message || '未知错误'));
      exportVideoBtn.disabled = false;
      exportVideoBtn.textContent = '导出视频';
    };
    
    // 预加载背景图
    const bgImageObjects = [];
    if (bgImages && bgImages.length > 0) {
      const sortedBgImages = [...bgImages].sort((a, b) => a.zIndex - b.zIndex);
      for (const bgImg of sortedBgImages) {
        const imgObj = new Image();
        imgObj.src = bgImg.src;
        bgImageObjects.push({
          id: bgImg.id,
          img: imgObj,
          x: bgImg.x * scale + offsetX,
          y: bgImg.y * scale + offsetY,
          width: bgImg.width * scale,
          height: bgImg.height * scale
        });
      }
    }
    
    // 预加载视频
    const videoExportObjects = [];
    if (videoItems && videoItems.length > 0) {
      const sortedVideos = [...videoItems].sort((a, b) => a.zIndex - b.zIndex);
      for (const video of sortedVideos) {
        const videoEl = document.createElement('video');
        videoEl.src = video.src;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.preload = 'auto';
        videoExportObjects.push({
          id: video.id,
          video: videoEl,
          x: video.x * scale + offsetX,
          y: video.y * scale + offsetY,
          width: video.width * scale,
          height: video.height * scale,
          startTime: video.startTime,
          duration: video.duration
        });
      }
    }
    
    mediaRecorder.start(16);
    
    // 逐帧录制 - 精确控制30fps，使用requestAnimationFrame + 时间戳校准
    const fps = 30;
    const frameInterval = 1000 / fps;
    const totalFrames = Math.max(1, Math.round(maxTime * fps));
    let frame = 0;
    let recording = true;
    let startTime = 0;
    let lastFrameTime = 0;
    
    function renderFrame() {
      if (!recording) return;
      if (frame >= totalFrames) {
        setTimeout(() => {
          recording = false;
          mediaRecorder.stop();
        }, 300);
        return;
      }
      
      if (startTime === 0) {
        startTime = performance.now();
        lastFrameTime = startTime;
      }
      
      const now = performance.now();
      const expectedTime = startTime + frame * frameInterval;
      
      // 如果还没到下一帧时间，等待
      if (now < expectedTime - 1) {
        requestAnimationFrame(renderFrame);
        return;
      }
      
      const time = frame / fps;
      const progress = Math.round((frame / totalFrames) * 100);
      exportVideoBtn.textContent = `正在录制 ${progress}%`;
      
      // 清空画布（使用用户设置的背景色 - 从previewContainer读取，因为content-layer是transparent）
      const previewContEl = document.getElementById('previewContainer');
      let exportBgColor = '#ffffff';
      if (previewContEl) {
        const bgColor = getComputedStyle(previewContEl).backgroundColor;
        if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
          exportBgColor = bgColor;
        }
      }
      ctx.fillStyle = exportBgColor;
      ctx.fillRect(0, 0, width, height);
      
      // 绘制背景图（按 zIndex 排序）
      if (bgImageObjects && bgImageObjects.length > 0) {
        bgImageObjects.forEach(bgObj => {
          if (bgObj.img.complete && bgObj.img.naturalWidth > 0) {
            const anims = blockAnimations['bg_' + bgObj.id] || [];
            let opacity = 1, scaleX = 1, scaleY = 1, rotate = 0, animX = 0, animY = 0, shouldDraw = true;
            if (anims.length > 0) {
              const activeAnims = anims.filter(anim => time >= anim.startTime && time < anim.startTime + anim.duration);
              if (activeAnims.length === 0) {
                const hasOut = anims.some(a => a.type === 'out' && (a.startTime + a.duration) <= time);
                if (hasOut) shouldDraw = false;
              } else {
                const presetAnims = activeAnims.filter(a => a.type === 'preset');
                const entryAnims = activeAnims.filter(a => a.type === 'in' || a.type === 'out');
                if (presetAnims.length > 0) {
                  const transforms = presetAnims.map(anim => {
                    const animProgress = (time - anim.startTime) / anim.duration;
                    return calcAnimTransform(anim.anim, animProgress, true, scale);
                  });
                  let merged = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1 };
                  for (const t of transforms) {
                    merged.x += t.x; merged.y += t.y;
                    merged.scaleX *= t.scaleX; merged.scaleY *= t.scaleY;
                    merged.rotate += t.rotate; merged.opacity *= t.opacity;
                  }
                  animX = merged.x; animY = merged.y;
                  scaleX = merged.scaleX; scaleY = merged.scaleY;
                  rotate = merged.rotate; opacity = merged.opacity;
                }
                // 路径动画
                const pathAnim = activeAnims.find(a => a.type === 'path' && a.path && a.path.length >= 2);
                if (pathAnim) {
                  const pathProgress = (time - pathAnim.startTime) / pathAnim.duration;
                  const path = pathAnim.path;
                  const pathIndex = Math.floor(pathProgress * (path.length - 1));
                  const pathFrac = (pathProgress * (path.length - 1)) - pathIndex;
                  let dx = 0, dy = 0;
                  if (pathIndex >= path.length - 1) {
                    dx = path[path.length - 1].x;
                    dy = path[path.length - 1].y;
                  } else {
                    const p1 = path[pathIndex];
                    const p2 = path[pathIndex + 1];
                    dx = p1.x + (p2.x - p1.x) * pathFrac;
                    dy = p1.y + (p2.y - p1.y) * pathFrac;
                  }
                  animX += dx * scale;
                  animY += dy * scale;
                }
                if (entryAnims.length > 0) {
                  const entry = entryAnims[0];
                  const ap = (time - entry.startTime) / entry.duration;
                  if (entry.anim === 'fadeIn') opacity *= ap;
                  else if (entry.anim === 'fadeOut') opacity *= 1 - ap;
                  else if (entry.anim.startsWith('slide') || entry.anim.startsWith('zoom') || entry.anim.startsWith('rotate') || entry.anim.startsWith('bounce')) {
                    if (entry.type === 'in') opacity *= Math.min(1, ap * 2);
                    else opacity *= Math.max(0, 1 - (ap - 0.5) * 2);
                  }
                }
              }
            }
            if (shouldDraw && opacity > 0) {
              ctx.save();
              const cx = bgObj.x + bgObj.width / 2 + animX;
              const cy = bgObj.y + bgObj.height / 2 + animY;
              ctx.translate(cx, cy);
              ctx.rotate(rotate * Math.PI / 180);
              ctx.scale(scaleX, scaleY);
              ctx.globalAlpha = opacity;
              const img = bgObj.img;
const imgRatio = img.naturalWidth / img.naturalHeight;
const drawRatio = bgObj.width / bgObj.height;
let sx, sy, sw, sh;
if (imgRatio > drawRatio) {
  sh = img.naturalHeight;
  sw = sh * drawRatio;
  sx = (img.naturalWidth - sw) / 2;
  sy = 0;
} else {
  sw = img.naturalWidth;
  sh = sw / drawRatio;
  sx = 0;
  sy = (img.naturalHeight - sh) / 2;
}
ctx.drawImage(img, sx, sy, sw, sh, -bgObj.width / 2, -bgObj.height / 2, bgObj.width, bgObj.height);
              ctx.restore();
            }
          }
        });
      }
      
      // 绘制视频帧（按 zIndex 排序）
      if (videoExportObjects && videoExportObjects.length > 0) {
        videoExportObjects.forEach(videoObj => {
          const videoEndTime = videoObj.startTime + videoObj.duration;
          if (time >= videoObj.startTime && time <= videoEndTime) {
            const videoCurrentTime = time - videoObj.startTime;
            const anims = blockAnimations['video_' + videoObj.id] || [];
            let opacity = 1, scaleX = 1, scaleY = 1, rotate = 0, animX = 0, animY = 0, shouldDraw = true;
            if (anims.length > 0) {
              const activeAnims = anims.filter(anim => time >= anim.startTime && time < anim.startTime + anim.duration);
              if (activeAnims.length === 0) {
                const hasOut = anims.some(a => a.type === 'out' && (a.startTime + a.duration) <= time);
                if (hasOut) shouldDraw = false;
              } else {
                const presetAnims = activeAnims.filter(a => a.type === 'preset');
                const entryAnims = activeAnims.filter(a => a.type === 'in' || a.type === 'out');
                if (presetAnims.length > 0) {
                  const transforms = presetAnims.map(anim => {
                    const animProgress = (time - anim.startTime) / anim.duration;
                    return calcAnimTransform(anim.anim, animProgress, true, scale);
                  });
                  let merged = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1 };
                  for (const t of transforms) {
                    merged.x += t.x; merged.y += t.y;
                    merged.scaleX *= t.scaleX; merged.scaleY *= t.scaleY;
                    merged.rotate += t.rotate; merged.opacity *= t.opacity;
                  }
                  animX = merged.x; animY = merged.y;
                  scaleX = merged.scaleX; scaleY = merged.scaleY;
                  rotate = merged.rotate; opacity = merged.opacity;
                }
                // 路径动画
                const pathAnim = activeAnims.find(a => a.type === 'path' && a.path && a.path.length >= 2);
                if (pathAnim) {
                  const pathProgress = (time - pathAnim.startTime) / pathAnim.duration;
                  const path = pathAnim.path;
                  const pathIndex = Math.floor(pathProgress * (path.length - 1));
                  const pathFrac = (pathProgress * (path.length - 1)) - pathIndex;
                  let dx = 0, dy = 0;
                  if (pathIndex >= path.length - 1) {
                    dx = path[path.length - 1].x;
                    dy = path[path.length - 1].y;
                  } else {
                    const p1 = path[pathIndex];
                    const p2 = path[pathIndex + 1];
                    dx = p1.x + (p2.x - p1.x) * pathFrac;
                    dy = p1.y + (p2.y - p1.y) * pathFrac;
                  }
                  animX += dx * scale;
                  animY += dy * scale;
                }
                if (entryAnims.length > 0) {
                  const entry = entryAnims[0];
                  const ap = (time - entry.startTime) / entry.duration;
                  if (entry.anim === 'fadeIn') opacity *= ap;
                  else if (entry.anim === 'fadeOut') opacity *= 1 - ap;
                  else if (entry.anim.startsWith('slide') || entry.anim.startsWith('zoom') || entry.anim.startsWith('rotate') || entry.anim.startsWith('bounce')) {
                    if (entry.type === 'in') opacity *= Math.min(1, ap * 2);
                    else opacity *= Math.max(0, 1 - (ap - 0.5) * 2);
                  }
                }
              }
            }
            if (shouldDraw && opacity > 0) {
              try {
                if (videoObj.video.readyState >= 2) {
                  videoObj.video.currentTime = videoCurrentTime;
                  ctx.save();
                  const cx = videoObj.x + videoObj.width / 2 + animX;
                  const cy = videoObj.y + videoObj.height / 2 + animY;
                  ctx.translate(cx, cy);
                  ctx.rotate(rotate * Math.PI / 180);
                  ctx.scale(scaleX, scaleY);
                  ctx.globalAlpha = opacity;
                  const videoEl = videoObj.video;
const videoRatio = videoEl.videoWidth / videoEl.videoHeight;
const videoDrawRatio = videoObj.width / videoObj.height;
let vsx, vsy, vsw, vsh;
if (videoRatio > videoDrawRatio) {
  vsh = videoEl.videoHeight;
  vsw = vsh * videoDrawRatio;
  vsx = (videoEl.videoWidth - vsw) / 2;
  vsy = 0;
} else {
  vsw = videoEl.videoWidth;
  vsh = vsw / videoDrawRatio;
  vsx = 0;
  vsy = (videoEl.videoHeight - vsh) / 2;
}
ctx.drawImage(videoEl, vsx, vsy, vsw, vsh, -videoObj.width / 2, -videoObj.height / 2, videoObj.width, videoObj.height);
                  ctx.restore();
                }
              } catch (e) {}
            }
          }
        });
      }
      
      // 绘制每个文字块
      blockInfos.forEach((info, blockId) => {
        const anims = blockAnimations[blockId];
        if (!anims || anims.length === 0) {
          // 没有动画的块也要绘制（保持原样）
          drawTextBlock(ctx, info, info.x, info.y, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, fontWeight: null });
          return;
        }
        
        // 找出当前时间点活跃的动画
        const activeAnims = anims.filter(anim => {
          return time >= anim.startTime && time < anim.startTime + anim.duration;
        });
        
        if (activeAnims.length === 0) {
          // 没有任何动画 active，但有动画存在 → 找到最近的 ended 动画，看是否需要保持最终状态
          // 入场动画结束后，下一个动画还没开始 → 显示静态
          // 出场动画结束后 → 不显示
          const hasOut = anims.some(a => a.type === 'out' && (a.startTime + a.duration) <= time);
          if (hasOut) {
            // 出场动画已结束，文字已淡出
            return;
          }
          // 入场动画结束、下一动画还没开始 → 保持显示
          drawTextBlock(ctx, info, info.x, info.y, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, fontWeight: null });
          return;
        }
        
        // 找出当前时间点活跃的预设动画
        // 入场/出场动画被排除（只影响淡入淡出，不影响后续预设）
        const presetAnims = activeAnims.filter(a => a.type === 'preset');
        const entryAnims = activeAnims.filter(a => a.type === 'in' || a.type === 'out');
        
        let merged;
        
        if (presetAnims.length > 0) {
          // 有预设动画：计算并合并（叠加效果）
          const transforms = presetAnims.map(anim => {
            const animProgress = (time - anim.startTime) / anim.duration;
            return calcAnimTransform(anim.anim, animProgress, true, scale);
          });
          merged = mergeAnimTransforms(transforms);
        } else {
          // 没有预设动画：identity
          merged = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, fontWeight: null };
        }
        
        // 入场/出场动画：用全局 alpha 控制（独立通道，不影响预设动画的 transform）
        if (entryAnims.length > 0) {
          // 简化：取第一个入场/出场动画的 opacity
          const entry = entryAnims[0];
          const animProgress = (time - entry.startTime) / entry.duration;
          if (entry.anim === 'fadeIn') {
            merged.opacity *= animProgress;
          } else if (entry.anim === 'fadeOut') {
            merged.opacity *= 1 - animProgress;
          } else if (entry.anim.startsWith('slide') || entry.anim.startsWith('zoom') || entry.anim.startsWith('rotate') || entry.anim.startsWith('bounce')) {
            // 入场/出场前半段隐藏，后半段显示
            if (entry.type === 'in') {
              merged.opacity *= Math.min(1, animProgress * 2);
            } else {
              merged.opacity *= Math.max(0, 1 - (animProgress - 0.5) * 2);
            }
          }
        }
        
        // 处理路径动画的位置
        let posX = info.x;
        let posY = info.y;
        
        const pathAnim = activeAnims.find(a => a.type === 'path' && a.path);
        if (pathAnim && pathAnim.path && pathAnim.path.length >= 2) {
          const pathProgress = (time - pathAnim.startTime) / pathAnim.duration;
          const pathIndex = Math.floor(pathProgress * (pathAnim.path.length - 1));
          const pathFrac = (pathProgress * (pathAnim.path.length - 1)) - pathIndex;
          
          let dx = 0, dy = 0;
          if (pathIndex >= pathAnim.path.length - 1) {
            dx = pathAnim.path[pathAnim.path.length - 1].x;
            dy = pathAnim.path[pathAnim.path.length - 1].y;
          } else {
            const p1 = pathAnim.path[pathIndex];
            const p2 = pathAnim.path[pathIndex + 1];
            dx = p1.x + (p2.x - p1.x) * pathFrac;
            dy = p1.y + (p2.y - p1.y) * pathFrac;
          }
          posX += dx * scale;
          posY += dy * scale;
        }
        
        // 处理 disp/both 位移动画（Canvas半切效果）
        const dispAnim = activeAnims.find(a => 
          a.type === 'preset' && (a.anim.startsWith('disp') || a.anim.startsWith('both'))
        );
        
        if (dispAnim) {
          // 位移动画：用半切效果绘制
          drawHalfDispAnim(ctx, info, posX, posY, merged, dispAnim, time);
        } else {
          // 普通动画：直接绘制文字
          drawTextBlock(ctx, info, posX, posY, merged);
        }
      });
      
      frame++;
      lastFrameTime = now;
      
      requestAnimationFrame(renderFrame);
    }
    
    renderFrame();
    
  } catch (error) {
    console.error('导出失败:', error);
    showTip('导出失败: ' + error.message);
    exportVideoBtn.disabled = false;
    exportVideoBtn.textContent = '导出视频';
  }
});

// 导出GIF - 简化版，支持文字块和背景图动画
exportGifBtn.addEventListener('click', async () => {
  if (isPlaying) {
    stopAnimation();
    await new Promise(r => setTimeout(r, 300));
  }

  const contentLayer = document.getElementById('contentLayer');
  if (!contentLayer) return;

  exportGifBtn.disabled = true;
  exportGifBtn.textContent = '准备GIF...';

  try {
    // === 数据准备 ===
    let maxTime = 3;
    Object.keys(blockAnimations).forEach(blockId => {
      if (blockAnimations[blockId]) {
        blockAnimations[blockId].forEach(anim => {
          const end = anim.startTime + anim.duration;
          if (end > maxTime) maxTime = end;
        });
      }
    });

    const sizeConfig = exportSizeMap[currentExportSize] || exportSizeMap['16:9'];
    const width = sizeConfig.w;
    const height = sizeConfig.h;
    const baseW = BASE_WIDTH;
    const baseH = BASE_HEIGHT;
    const scale = Math.min(width / baseW, height / baseH);
    const offsetX = (width - baseW * scale) / 2;
    const offsetY = (height - baseH * scale) / 2;

    // 预计算文字块信息
    const blockInfos = new Map();
    document.querySelectorAll('#contentLayer .text-block').forEach(block => {
      const blockId = block.dataset.id;
      if (!blockId) return;
      const textContent = block.querySelector('.text-content');
      const computedStyle = window.getComputedStyle(block);
      const blockData = blocks.find(b => b.block === block);
      const realFontSize = blockData?.fontSize || 30;
      const leftStr = block.style.left || '0px';
      const topStr = block.style.top || '0px';
      const left = leftStr.includes('%') ? (parseFloat(leftStr) / 100) * baseW : parseFloat(leftStr) || 0;
      const top = topStr.includes('%') ? (parseFloat(topStr) / 100) * baseH : parseFloat(topStr) || 0;
      const blockW = block.offsetWidth || 100;
      const blockH = block.offsetHeight || 50;
      const rotateAngle = parseFloat(block.style.getPropertyValue('--rotate-angle')) || 0;
      const flipped = block.dataset.flipped === 'true';

      blockInfos.set(blockId, {
        x: (left + blockW / 2) * scale + offsetX,
        y: (top + blockH / 2) * scale + offsetY,
        width: blockW * scale,
        height: blockH * scale,
        text: textContent ? textContent.textContent : '',
        color: computedStyle.color || '#000000',
        bgColor: computedStyle.backgroundColor || 'transparent',
        fontSize: realFontSize * scale,
        fontFamily: blockData?.fontName || 'sans-serif',
        fontWeight: parseInt(computedStyle.fontWeight) || 400,
        lineHeight: realFontSize * scale * 1.2,
        rotate: rotateAngle,
        flipX: flipped ? -1 : 1,
        scale: scale
      });
    });

    // 预加载背景图
    const bgImageObjects = [];
    if (bgImages && bgImages.length > 0) {
      const sortedBgImages = [...bgImages].sort((a, b) => a.zIndex - b.zIndex);
      for (const bgImg of sortedBgImages) {
        const imgObj = new Image();
        imgObj.src = bgImg.src;
        bgImageObjects.push({
          id: bgImg.id,
          img: imgObj,
          x: bgImg.x * scale + offsetX,
          y: bgImg.y * scale + offsetY,
          width: bgImg.width * scale,
          height: bgImg.height * scale
        });
      }
    }

    // 创建GIF
    const gif = new GIF({
      workers: 0,
      quality: 10,
      width,
      height
    });

    const fps = 10;
    const totalFrames = Math.max(1, Math.round(maxTime * fps));

    // 创建canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 获取背景色
    const previewContEl = document.getElementById('previewContainer');
    let exportBgColor = '#ffffff';
    if (previewContEl) {
      const bgColor = getComputedStyle(previewContEl).backgroundColor;
      if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
        exportBgColor = bgColor;
      }
    }

    // 逐帧渲染
    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame / fps;
      const progress = Math.round((frame / totalFrames) * 100);
      exportGifBtn.textContent = `生成GIF ${progress}%`;

      // 清空画布
      ctx.fillStyle = exportBgColor;
      ctx.fillRect(0, 0, width, height);

      // 绘制背景图
      bgImageObjects.forEach(bgObj => {
        if (bgObj.img.complete && bgObj.img.naturalWidth > 0) {
          const anims = blockAnimations['bg_' + bgObj.id] || [];
          let opacity = 1, scaleX = 1, scaleY = 1, rotate = 0, animX = 0, animY = 0, shouldDraw = true;
          if (anims.length > 0) {
            const activeAnims = anims.filter(anim => time >= anim.startTime && time < anim.startTime + anim.duration);
            if (activeAnims.length === 0) {
              const hasOut = anims.some(a => a.type === 'out' && (a.startTime + a.duration) <= time);
              if (hasOut) shouldDraw = false;
            } else {
              const presetAnims = activeAnims.filter(a => a.type === 'preset');
              if (presetAnims.length > 0) {
                const transforms = presetAnims.map(anim => {
                  const animProgress = (time - anim.startTime) / anim.duration;
                  return calcAnimTransform(anim.anim, animProgress, true, scale);
                });
                transforms.forEach(t => {
                  animX += t.x; animY += t.y;
                  scaleX *= t.scaleX; scaleY *= t.scaleY;
                  rotate += t.rotate; opacity *= t.opacity;
                });
              }
            }
          }
          if (shouldDraw && opacity > 0) {
            ctx.save();
            ctx.globalAlpha = opacity;
            const cx = bgObj.x + bgObj.width / 2 + animX;
            const cy = bgObj.y + bgObj.height / 2 + animY;
            ctx.translate(cx, cy);
            ctx.rotate(rotate * Math.PI / 180);
            ctx.scale(scaleX, scaleY);
            ctx.drawImage(bgObj.img, -bgObj.width / 2, -bgObj.height / 2, bgObj.width, bgObj.height);
            ctx.restore();
          }
        }
      });

      // 绘制文字块
      blockInfos.forEach((info, blockId) => {
        const anims = blockAnimations[blockId];
        let transform = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, fontWeight: null };

        if (anims && anims.length > 0) {
          const activeAnims = anims.filter(anim => time >= anim.startTime && time < anim.startTime + anim.duration);

          if (activeAnims.length === 0) {
            const hasOut = anims.some(a => a.type === 'out' && (a.startTime + a.duration) <= time);
            if (hasOut) return;
          } else {
            const presetAnims = activeAnims.filter(a => a.type === 'preset');
            if (presetAnims.length > 0) {
              const transforms = presetAnims.map(anim => {
                const animProgress = (time - anim.startTime) / anim.duration;
                return calcAnimTransform(anim.anim, animProgress, true, scale);
              });
              transform = mergeAnimTransforms(transforms);
            }

            const entryAnims = activeAnims.filter(a => a.type === 'in' || a.type === 'out');
            if (entryAnims.length > 0) {
              const entry = entryAnims[0];
              const ap = (time - entry.startTime) / entry.duration;
              if (entry.anim === 'fadeIn') transform.opacity *= ap;
              else if (entry.anim === 'fadeOut') transform.opacity *= 1 - ap;
              else if (entry.type === 'in') transform.opacity *= Math.min(1, ap * 2);
              else transform.opacity *= Math.max(0, 1 - (ap - 0.5) * 2);
            }
          }
        }

        if (transform.opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = transform.opacity;
        const cx = info.x + transform.x;
        const cy = info.y + transform.y;
        ctx.translate(cx, cy);
        ctx.rotate((info.rotate + transform.rotate) * Math.PI / 180);
        ctx.scale(transform.scaleX * info.flipX, transform.scaleY);

        // 绘制背景
        if (info.bgColor && info.bgColor !== 'transparent' && info.bgColor !== 'rgba(0, 0, 0, 0)') {
          ctx.fillStyle = info.bgColor;
          const pad = 4 * scale;
          ctx.fillRect(-info.width / 2 - pad, -info.height / 2 - pad, info.width + pad * 2, info.height + pad * 2);
        }

        // 绘制文字
        ctx.fillStyle = info.color;
        ctx.font = `${info.fontWeight} ${info.fontSize}px ${info.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.text, 0, 0);

        ctx.restore();
      });

      gif.addFrame(canvas, { delay: 1000 / fps });
    }

    gif.on('progress', (p) => {
      const progress = Math.round(p * 100);
      exportGifBtn.textContent = `生成GIF ${progress}%`;
    });

    gif.on('finished', async (blob) => {
      exportGifBtn.textContent = '保存GIF...';
      
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: `动画_${new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}.gif`,
            types: [{
              description: 'GIF图片',
              accept: { 'image/gif': ['.gif'] }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          showTip('GIF已保存！');
        } catch (err) {
          if (err.name !== 'AbortError') {
            showTip('保存失败：' + err.message);
          }
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `动画_${Date.now()}.gif`;
        a.click();
        URL.revokeObjectURL(url);
        showTip('GIF已下载！');
      }
      
      exportGifBtn.disabled = false;
      exportGifBtn.textContent = '导出GIF';
    });

    gif.on('error', (err) => {
      showTip('GIF生成失败: ' + (err.message || '未知错误'));
      exportGifBtn.disabled = false;
      exportGifBtn.textContent = '导出GIF';
    });

    gif.render();
  } catch (error) {
    console.error('GIF导出失败:', error);
    showTip('GIF导出失败: ' + error.message);
    exportGifBtn.disabled = false;
    exportGifBtn.textContent = '导出GIF';
  }
});

// 绘制单个文字块
function drawTextBlock(ctx, info, posX, posY, transform) {
  ctx.save();
  ctx.globalAlpha = transform.opacity;
  
  const centerX = posX + transform.x;
  const centerY = posY + transform.y;
  
  ctx.translate(centerX, centerY);
  // 先应用基础旋转和翻转，再应用动画变换
  if (info.rotate) ctx.rotate(info.rotate * Math.PI / 180);
  if (info.flipX === -1) ctx.scale(-1, 1);
  ctx.rotate(transform.rotate * Math.PI / 180);
  ctx.scale(transform.scaleX, transform.scaleY);
  ctx.translate(-centerX, -centerY);
  
  // 绘制背景
  if (info.bgColor && info.bgColor !== 'transparent' && info.bgColor !== 'rgba(0, 0, 0, 0)') {
    ctx.fillStyle = info.bgColor;
    ctx.fillRect(posX - info.width / 2, posY - info.height / 2, info.width, info.height);
  }
  
  // 绘制文字
  let fontWeight = info.fontWeight;
  if (transform.fontWeight !== null) {
    fontWeight = Math.round(transform.fontWeight);
  }
  
  ctx.fillStyle = info.color;
  
  // 竖排文字处理
  if (info.vertical) {
    // 竖排模式：每个字符单独绘制
    const allChars = info.text.split('');
    const charHeight = info.fontSize * 1.2;
    const startX = posX;
    const startY = posY - (allChars.length - 1) * charHeight / 2;
    ctx.font = `${fontWeight} ${info.fontSize}px ${info.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    allChars.forEach((char, i) => {
      ctx.fillText(char, startX, startY + i * charHeight);
    });
  } else {
    // 横排文字
    ctx.font = `${fontWeight} ${info.fontSize}px ${info.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = info.text.split('\n');
    const startY = posY - (lines.length - 1) * info.lineHeight / 2;
    
    lines.forEach((line, i) => {
      ctx.fillText(line, posX, startY + i * info.lineHeight);
    });
  }
  
  ctx.restore();
}

// 绘制位移动画 - 使用双线性插值平滑边缘（与原始动画效果一致）
function drawHalfDispAnim(ctx, info, posX, posY, baseTransform, dispAnim, time) {
  const animProgress = (time - dispAnim.startTime) / dispAnim.duration;
  const p = animProgress % 1;
  const pi2 = Math.PI * 2;
  
  // 高清模式下位移量也要乘以scale
  const scale = info.scale || 1;
  const baseDisp = 12 * scale; // 基础位移量
  
  let dispX = 0, dispY = 0, dispScale = 1;
  
  const animName = dispAnim.anim;
  
  // 计算位移量（乘以scale适配高清）
  switch (animName) {
    case 'dispSwing':
    case 'dispSway':
    case 'dispSlide':
      dispX = Math.sin(p * pi2) * baseDisp;
      break;
    case 'dispShake':
      dispX = Math.sin(p * pi2 * 2) * 8 * scale;
      break;
    case 'dispBounce':
      const b = p * 2;
      dispY = b < 1 ? -18 * scale * (1 - Math.pow(1 - b, 2)) : -18 * scale * 0.3 * (1 - Math.pow(2 - b, 2));
      break;
    case 'dispScale':
    case 'dispPulse':
    case 'dispBreath':
      const s = (1 - Math.cos(p * pi2)) / 2;
      dispY = s * 15 * scale;
      dispX = s * 7 * scale;
      break;
    case 'dispBend':
      dispX = Math.sin(p * pi2) * baseDisp * 0.8;
      dispY = Math.sin(p * pi2) * baseDisp * 0.3;
      break;
    case 'dispVibrate':
      dispX = Math.sin(p * pi2 * 8) * 6 * scale;
      dispY = Math.cos(p * pi2 * 8) * 6 * scale;
      break;
    case 'dispWave':
      dispX = Math.sin(p * pi2 * 2) * 10 * scale * 0.6;
      break;
    case 'dispTwist':
      dispX = Math.sin(p * pi2) * baseDisp;
      break;
    case 'dispWobble':
      dispX = Math.sin(p * pi2 * 1.5) * 10 * scale * 0.7;
      dispY = Math.sin(p * pi2) * 10 * scale * 0.4;
      break;
    case 'dispSquash':
      const sq = p * 2;
      const sqY = sq < 1 ? -18 * scale * (1 - Math.pow(1 - sq, 3)) : 18 * scale * 0.5 * (1 - Math.pow(2 - sq, 2));
      dispY = sqY;
      dispX = -sqY * 0.4;
      break;
    case 'dispZigzag':
      const zz = p * 6;
      const zzPhase = Math.floor(zz) % 2;
      dispX = baseDisp * (zzPhase === 0 ? 1 : -1) * (1 - (zz % 1));
      break;
    case 'dispOrbit':
      dispX = Math.sin(p * pi2) * baseDisp;
      dispY = Math.cos(p * pi2) * baseDisp * 0.5;
      break;
    case 'dispSpiral':
      const sp = p * 2;
      const r = baseDisp * (sp % 1);
      dispX = Math.sin(sp * Math.PI) * r;
      dispY = -Math.cos(sp * Math.PI) * r * 0.5;
      break;
    case 'dispRipple':
      dispY = Math.sin(p * pi2 * 1.5) * 10 * scale * 0.5;
      break;
    case 'dispFling':
      const f = p;
      if (f < 0.4) dispX = (f / 0.4) * 20 * scale;
      else if (f < 0.7) dispX = 20 * scale - ((f - 0.4) / 0.3) * 20 * scale * 0.3;
      else dispX = 20 * scale * 0.7 - ((f - 0.7) / 0.3) * 20 * scale * 1.7;
      break;
    case 'dispLens':
      const ls = (1 - Math.cos(p * pi2)) / 2;
      dispX = ls * baseDisp;
      dispY = ls * 6 * scale;
      break;
    case 'disp3DRotX':
    case 'disp3DRotY':
    case 'disp3DFlip':
    case 'disp3DWave':
    case 'disp3DZoom':
    case 'disp3DPersp':
    case 'disp3DSwing':
    case 'disp3DBounce':
    case 'disp3DTwist':
    case 'disp3DBreath':
      const ds = (1 - Math.cos(p * pi2)) / 2;
      dispScale = 1 + ds * 0.15;
      dispY = ds * 8 * scale;
      break;
    case 'bothSwing':
    case 'bothShake':
    case 'bothBounce':
    case 'bothScale':
    case 'bothBend':
    case 'bothPulse':
    case 'bothWobble':
    case 'bothOrbit':
    case 'bothSquash':
    case 'bothTwist':
      if (animName === 'bothSwing' || animName === 'bothShake') dispX = Math.sin(p * pi2) * 10 * scale;
      else if (animName === 'bothBounce') dispY = -15 * scale * Math.sin(p * Math.PI);
      else if (animName === 'bothScale' || animName === 'bothPulse') { dispY = (1 - Math.cos(p * pi2)) / 2 * 12 * scale; dispX = (1 - Math.cos(p * pi2)) / 2 * 6 * scale; }
      else if (animName === 'bothBend') { dispX = Math.sin(p * pi2) * 8 * scale; dispY = Math.sin(p * pi2) * 3 * scale; }
      else if (animName === 'bothWobble') { dispX = Math.sin(p * pi2 * 1.5) * 7 * scale; dispY = Math.sin(p * pi2) * 4 * scale; }
      else if (animName === 'bothOrbit') { dispX = Math.sin(p * pi2) * 10 * scale; dispY = Math.cos(p * pi2) * 5 * scale; }
      else if (animName === 'bothSquash') { const bsq = p * 2; const bsqY = bsq < 1 ? -15 * scale * (1 - Math.pow(1 - bsq, 3)) : 15 * scale * 0.5 * (1 - Math.pow(2 - bsq, 2)); dispY = bsqY; dispX = -bsqY * 0.4; }
      else if (animName === 'bothTwist') dispX = Math.sin(p * pi2) * baseDisp;
      break;
    default:
      break;
  }
  
  const isBoth = animName.startsWith('both');
  const is3D = animName.includes('3D');
  const centerX = posX + baseTransform.x;
  const centerY = posY + baseTransform.y;
  
  ctx.save();
  ctx.globalAlpha = baseTransform.opacity;
  
  // 计算字体粗细
  let fontWeight = info.fontWeight;
  if (baseTransform.fontWeight !== null) fontWeight = Math.round(baseTransform.fontWeight);
  
  const lines = info.text.split('\n');
  
  // 创建离屏 canvas 绘制完整文字
  const pad = Math.max(Math.abs(dispX), Math.abs(dispY)) * 2 + 20;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = Math.ceil(info.width + pad * 2);
  offCanvas.height = Math.ceil(info.height + pad * 2);
  const offCtx = offCanvas.getContext('2d');
  
  const offCX = offCanvas.width / 2;
  const offCY = offCanvas.height / 2;
  
  // 在离屏canvas上绘制文字
  offCtx.save();
  offCtx.translate(offCX, offCY);
  // 先应用基础旋转和翻转
  if (info.rotate) offCtx.rotate(info.rotate * Math.PI / 180);
  if (info.flipX === -1) offCtx.scale(-1, 1);
  offCtx.rotate(baseTransform.rotate * Math.PI / 180);
  offCtx.scale(baseTransform.scaleX, baseTransform.scaleY);
  offCtx.translate(-offCX, -offCY);
  
  // 绘制背景矩形
  if (info.bgColor && info.bgColor !== 'transparent' && info.bgColor !== 'rgba(0, 0, 0, 0)') {
    offCtx.fillStyle = info.bgColor;
    offCtx.fillRect(-offCX, -offCY, offCanvas.width, offCanvas.height);
  }
  
  offCtx.fillStyle = info.color;
  offCtx.font = `${fontWeight} ${info.fontSize}px ${info.fontFamily}`;
  offCtx.textAlign = 'center';
  offCtx.textBaseline = 'middle';
  
  // 竖排文字处理
  if (info.vertical) {
    const allChars = info.text.split('');
    const charHeight = info.fontSize * 1.2;
    const startY = offCY - (allChars.length - 1) * charHeight / 2;
    allChars.forEach((char, i) => {
      offCtx.fillText(char, offCX, startY + i * charHeight);
    });
  } else {
    const offStartY = offCY - (lines.length - 1) * info.lineHeight / 2;
    lines.forEach((line, i) => {
      offCtx.fillText(line, offCX, offStartY + i * info.lineHeight);
    });
  }
  offCtx.restore();
  
  // 获取像素数据
  const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
  const srcBuf = new ArrayBuffer(imgData.data.length);
  const src8 = new Uint8ClampedArray(srcBuf);
  src8.set(imgData.data);
  const src32 = new Uint32Array(srcBuf);
  
  const dstBuf = new ArrayBuffer(imgData.data.length);
  const dst32 = new Uint32Array(dstBuf);
  
  const w = offCanvas.width;
  const h = offCanvas.height;
  
  // 预计算每行的 factor 和方向
  const midY = h * 0.5;
  const transitionSize = h * 0.15;
  const bothMidSize = h * 0.2;
  
  const factors = new Float32Array(h);
  const directions = new Int8Array(h);
  
  for (let y = 0; y < h; y++) {
    let factor;
    if (isBoth) {
      const distFromMid = Math.abs(y - midY);
      const midHalf = bothMidSize / 2;
      if (distFromMid < midHalf - transitionSize) {
        factor = 0;
      } else if (distFromMid > midHalf + transitionSize) {
        factor = 1;
      } else {
        const t = (distFromMid - (midHalf - transitionSize)) / (transitionSize * 2);
        factor = t * t * (3 - 2 * t);
      }
      directions[y] = y < midY ? -1 : 1;
    } else {
      if (y < midY - transitionSize) {
        factor = 0;
      } else if (y > midY + transitionSize) {
        factor = 1;
      } else {
        const t = (y - (midY - transitionSize)) / (transitionSize * 2);
        factor = t * t * (3 - 2 * t);
      }
    }
    factors[y] = factor;
  }
  
  // 双线性插值采样函数
  function sampleLinear(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, w - 1);
    const y1 = Math.min(y0 + 1, h - 1);
    const fx = x - x0;
    const fy = y - y0;
    
    if (x0 < 0 || x0 >= w || y0 < 0 || y0 >= h) return 0;
    
    const v00 = src32[y0 * w + x0];
    const v10 = src32[y0 * w + x1];
    const v01 = src32[y1 * w + x0];
    const v11 = src32[y1 * w + x1];
    
    // 线性插值
    const v0 = v00 + (v10 - v00) * fx;
    const v1 = v01 + (v11 - v01) * fx;
    return v0 + (v1 - v0) * fy;
  }
  
  // 逐像素位移映射（使用插值采样）
  if (is3D && !isBoth) {
    const halfW = w / 2;
    const halfH = h / 2;
    for (let y = 0; y < h; y++) {
      const factor = factors[y];
      const scaleFactor = 1 + factor * (dispScale - 1);
      const clampedScale = Math.max(0.3, Math.min(2, scaleFactor));
      const dstRow = y * w;
      const relY = (y - halfH) / h;
      const yScaleDisp = relY * (clampedScale - 1) * h * factor;
      const srcY = y - yScaleDisp;
      const relY2 = (y - halfH) / h;
      
      for (let x = 0; x < w; x++) {
        const relX = (x - halfW) / w;
        const xScaleDisp = relX * (clampedScale - 1) * w;
        const xSwingDisp = factor * dispX * (y / h - 0.3);
        const totalXDisp = xScaleDisp + xSwingDisp;
        const srcX = x - totalXDisp;
        
        dst32[dstRow + x] = sampleLinear(srcX, srcY);
      }
    }
  } else if (isBoth) {
    for (let y = 0; y < h; y++) {
      const factor = factors[y];
      const dir = directions[y];
      const dx = dispX * factor * dir;
      const dy = dispY * factor * dir;
      const dstRow = y * w;
      const srcY = y - dy;
      
      for (let x = 0; x < w; x++) {
        const srcX = x - dx;
        dst32[dstRow + x] = sampleLinear(srcX, srcY);
      }
    }
  } else {
    for (let y = 0; y < h; y++) {
      const factor = factors[y];
      const dx = dispX * factor;
      const dy = dispY * factor;
      const dstRow = y * w;
      const srcY = y - dy;
      
      for (let x = 0; x < w; x++) {
        const srcX = x - dx;
        dst32[dstRow + x] = sampleLinear(srcX, srcY);
      }
    }
  }
  
  // 写回像素
  const outData = new ImageData(new Uint8ClampedArray(dstBuf), w, h);
  offCtx.putImageData(outData, 0, 0);
  
  // 绘制到主 canvas
  const drawX = centerX - offCX;
  const drawY = centerY - offCY;
  ctx.drawImage(offCanvas, drawX, drawY);
  
  ctx.restore();
}
function stopAnimation(keepFinalState = false) {
  isPlaying = false;
  if (playAnimationId) {
    cancelAnimationFrame(playAnimationId);
    playAnimationId = null;
  }

  // 恢复打散的文字块
  if (typeof restoreShatteredBlocks === 'function') {
    restoreShatteredBlocks();
  }
  
  // 取消所有路径动画的 rAF
  Object.keys(pathAnimRafIds).forEach(id => {
    cancelAnimationFrame(pathAnimRafIds[id]);
    delete pathAnimRafIds[id];
  });
  
  // 清除所有背景动画的 setTimeout
  bgAnimTimeouts.forEach(id => clearTimeout(id));
  bgAnimTimeouts.length = 0;
  
  // 清空活跃背景运镜列表
  activeBgMotions = [];
  
  if (!keepFinalState) {
    updatePlayhead(0);
    currentTimelineTime = 0;
    hasSelectedTime = false;
    // 恢复播放前的视图状态（重置背景层动画效果）
    if (playbackInitialViewState) {
      viewTranslateX = playbackInitialViewState.translateX;
      viewTranslateY = playbackInitialViewState.translateY;
      viewScale = playbackInitialViewState.scale;
      viewRotate = playbackInitialViewState.rotate || 0;
      viewRotateX = playbackInitialViewState.rotateX || 0;
      viewRotateY = playbackInitialViewState.rotateY || 0;
      cameraX = playbackInitialViewState.cameraX || 0;
      cameraY = playbackInitialViewState.cameraY || 0;
      cameraZ = playbackInitialViewState.cameraZ || 1000;
      cameraPitch = playbackInitialViewState.cameraPitch || 0;
      cameraYaw = playbackInitialViewState.cameraYaw || 0;
      cameraRoll = playbackInitialViewState.cameraRoll || 0;
      cameraFocalLength = playbackInitialViewState.cameraFocalLength || 1000;
      cameraDistance = playbackInitialViewState.cameraDistance || 1000;
      orbitCenterX = playbackInitialViewState.orbitCenterX || BASE_WIDTH / 2;
      orbitCenterY = playbackInitialViewState.orbitCenterY || BASE_HEIGHT / 2;
      orbitCenterZ = playbackInitialViewState.orbitCenterZ || 0;
      playbackInitialViewState = null;
    } else {
      cameraX = 0;
      cameraY = 0;
      cameraZ = 1000;
      cameraPitch = 0;
      cameraYaw = 0;
      cameraRoll = 0;
    }
  } else {
    hidePlayhead();
  }
  
  // 停止按钮显示
  playKeyframesBtn.textContent = '播放';
  
  // 同步更新展示区播放按钮状态
  updatePlayBtnState(false);
  
  // 恢复背景层状态
  const blocksContainer = document.getElementById('blocksContainer');
  if (blocksContainer) {
    blocksContainer.style.transition = '';
  }
  if (!keepFinalState) {
    applyTransform();
  }
  
  if (keepFinalState) {
    const animatedBlockIds = new Set(Object.keys(blockAnimations).filter(id => blockAnimations[id].length > 0));
    
    animatedBlockIds.forEach(blockId => {
      const block = getBlockElementCached(blockId);
      if (block) {
        // 移除动画类
        Array.from(block.classList).filter(c => c.startsWith('anim-')).forEach(cls => block.classList.remove(cls));
        
        // 清除 style.animation 相关属性
        block.style.animationName = '';
        block.style.animationDuration = '';
        block.style.animationDelay = '';
        block.style.animationIterationCount = '';
        block.style.animationFillMode = '';
        block.style.animationTimingFunction = '';
        
        // 清除transform和opacity
        block.style.transform = '';
        block.style.opacity = '';
        // 清除字重动画
        block.style.fontVariationSettings = '';
        const wEditInput = block.querySelector('.edit-input');
        if (wEditInput) wEditInput.style.fontVariationSettings = '';
        const wTextContent = block.querySelector('.text-content');
        if (wTextContent) wTextContent.style.fontVariationSettings = '';
        
        // 停止Canvas位移动画
        stopHalfFilterAnimation(block);
        
        // 检查最后一个动画是否是出场动画
        const anims = blockAnimations[blockId];
        if (anims.length > 0) {
          const lastAnim = anims[anims.length - 1];
          // 出场动画：保持隐藏；其他动画：保持显示
          if (lastAnim.type === 'out') {
            block.style.visibility = 'hidden';
          } else {
            block.style.visibility = 'visible';
          }
        }
      }
    });
    // 恢复没有动画的元素可见性
    document.querySelectorAll('.text-block').forEach(block => {
      if (block.style._origVisibility !== undefined) {
        block.style.visibility = block.style._origVisibility || '';
        delete block.style._origVisibility;
      }
    });
    document.querySelectorAll('#blocksContainer .bg-image-item').forEach(item => {
      if (item.style._origVisibility !== undefined) {
        item.style.visibility = item.style._origVisibility || '';
        delete item.style._origVisibility;
      }
    });
    document.querySelectorAll('#blocksContainer .video-item').forEach(item => {
      if (item.style._origVisibility !== undefined) {
        item.style.visibility = item.style._origVisibility || '';
        delete item.style._origVisibility;
      }
    });
  } else {
    Object.keys(blockAnimations).forEach(blockId => {
      const block = getBlockElementCached(blockId);
      if (block) {
        const anims = blockAnimations[blockId] || [];
        const hasAnimAtFrame0 = anims.some(a => (a.startTime || 0) <= 0);
        block.style.visibility = hasAnimAtFrame0 ? 'visible' : 'hidden';
        block.style.opacity = '';
        // 清除字重动画
        block.style.fontVariationSettings = '';
        const wEditInput = block.querySelector('.edit-input');
        if (wEditInput) wEditInput.style.fontVariationSettings = '';
        const wTextContent = block.querySelector('.text-content');
        if (wTextContent) wTextContent.style.fontVariationSettings = '';
        // 清除 style.animation 相关属性
        block.style.animationName = '';
        block.style.animationDuration = '';
        block.style.animationDelay = '';
        block.style.animationIterationCount = '';
        block.style.animationFillMode = '';
        block.style.animationTimingFunction = '';
        Array.from(block.classList).filter(c => c.startsWith('anim-')).forEach(cls => block.classList.remove(cls));
        // 停止Canvas位移动画
        stopHalfFilterAnimation(block);
        // 恢复路径动画修改的位置
        if (blockOrigPositions[blockId]) {
          block.style.left = blockOrigPositions[blockId].left + 'px';
          block.style.top = blockOrigPositions[blockId].top + 'px';
        }
        // 重新应用静态旋转和翻转（保持初始化时的角度和翻转状态）
        const rotateAngle = parseFloat(block.style.getPropertyValue('--rotate-angle')) || 0;
        const flipX = block.dataset.flipped === 'true' ? -1 : 1;
        const flipY = block.dataset.flippedY === 'true' ? -1 : 1;
        if (rotateAngle !== 0 || flipX !== 1 || flipY !== 1) {
          block.style.transform = `rotate(${rotateAngle}deg) scale(${flipX}, ${flipY})`;
        } else {
          block.style.transform = '';
        }
      }
    });
    // 没有动画的文字块保持隐藏（与第0帧一致）
    document.querySelectorAll('.text-block').forEach(block => {
      const blockId = block.dataset.id;
      if (!blockAnimations[blockId] || blockAnimations[blockId].length === 0) {
        block.style.visibility = 'hidden';
      }
    });
    // 背景图和视频按第0帧时间窗口显示（与第0帧一致）；窗口外才隐藏
    if (typeof bgImages !== 'undefined' && bgImages) {
      bgImages.forEach(bgImg => {
        const el = blocksContainer ? blocksContainer.querySelector('.bg-image-item[data-id="' + bgImg.id + '"]') : null;
        if (!el) return;
        const startTime = bgImg.startTime || 0;
        const duration = bgImg.duration || 1;
        const visible = 0 >= startTime && 0 < startTime + duration;
        el.style.visibility = visible ? 'visible' : 'hidden';
      });
    }
    if (typeof videoItems !== 'undefined' && videoItems) {
      videoItems.forEach(video => {
        const el = blocksContainer ? blocksContainer.querySelector('.video-item[data-id="' + video.id + '"]') : null;
        if (!el) return;
        const startTime = video.startTime || 0;
        const duration = video.duration || 1;
        const visible = 0 >= startTime && 0 < startTime + duration;
        el.style.visibility = visible ? 'visible' : 'hidden';
        const ve = (typeof videoElements !== 'undefined' && videoElements) ? videoElements.get(video.id) : null;
        if (ve) {
          if (!visible && !ve.paused) {
            ve.pause();
            try { ve.currentTime = 0; } catch(e) {}
          } else if (visible && ve.paused) {
            ve.play().catch(() => {});
          }
        }
      });
    }
  }
}

// 动画预设按钮点击
// 监听文字块删除
function onBlockDeleted(block) {
  const blockId = getBlockId(block);
  if (blockId && blockAnimations[blockId]) {
    delete blockAnimations[blockId];
    renderTimeline();
  }
}

// 初始化
initTimeline();

// 时间轴标尺点击 → 设置当前时间位置
timelineRuler.addEventListener('click', (e) => {
  if (rulerDragging) return;
  const x = e.offsetX;
  const adjustedX = Math.max(0, x - LABEL_OFFSET);
  const time = Math.max(0, Math.round((adjustedX / 80) * 2) / 2);
  currentTimelineTime = time;
  hasSelectedTime = true;
  updatePlayhead(time);
  updateBlocksForTimelineTime();
});

// 时间轴标尺拖拽 → 持续更新当前位置
let rulerDragging = false;
timelineRuler.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  rulerDragging = true;
  document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
  if (!rulerDragging) return;
  const scrollContainer = document.getElementById('keyframesTimeline');
  const rect = scrollContainer.getBoundingClientRect();
  const x = e.clientX - rect.left + scrollContainer.scrollLeft;
  const adjustedX = Math.max(0, x - LABEL_OFFSET);
  const time = Math.max(0, Math.round((adjustedX / 80) * 2) / 2);
  currentTimelineTime = time;
  hasSelectedTime = true;
  updatePlayhead(time);
  updateBlocksForTimelineTime();
});
document.addEventListener('mouseup', () => {
  if (rulerDragging) {
    rulerDragging = false;
    document.body.style.userSelect = '';
  }
});

// 修改deleteBlock函数，添加动画清理
const originalDeleteBlock = deleteBlock;
deleteBlock = function(block) {
  onBlockDeleted(block);
  originalDeleteBlock(block);
};

// 左侧菜单收起/展开功能
let isLeftCollapsed = false;
let savedLeftWidth = 312; // 保存展开时的面板宽度（默认260+52=312px总宽，面板260px）

collapseLeftBtn.addEventListener('click', function() {
  isLeftCollapsed = !isLeftCollapsed;
  const appMain = document.querySelector('.app-main');
  const leftSidebar = document.querySelector('.left-sidebar');
  
  if (isLeftCollapsed) {
    // 收起时保存当前宽度
    savedLeftWidth = leftContainer.offsetWidth + 52;
    if (savedLeftWidth < 312) savedLeftWidth = 312;
    
    // 隐藏面板
    leftSidebar.classList.add('collapsed');
    
    settingsPanel.classList.add('collapsed');
    presetPanel.classList.add('collapsed');
    comicPanel.classList.add('collapsed');
    castPanel.classList.add('collapsed');
    collapseLeftBtn.classList.add('collapsed');
    const icon = collapseLeftBtn.querySelector('svg') || collapseLeftBtn.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', 'panel-right-close');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    appMain.classList.add('collapsed');
  } else {
    // 展开时恢复保存的宽度
    leftSidebar.classList.remove('collapsed');
    leftContainer.style.width = (savedLeftWidth - 52) + 'px';
    leftContainer.style.flex = 'none';
    
    settingsPanel.classList.remove('collapsed');
    presetPanel.classList.remove('collapsed');
    comicPanel.classList.remove('collapsed');
    castPanel.classList.remove('collapsed');
    zimanhuaPanel.classList.remove('collapsed');
    collapseLeftBtn.classList.remove('collapsed');
    const icon = collapseLeftBtn.querySelector('svg') || collapseLeftBtn.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', 'panel-left-close');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    appMain.classList.remove('collapsed');
  }
});

// 点击设置按钮 - 显示设置栏
togglePanel.addEventListener('click', function() {
  if (isLeftCollapsed) {
    const leftSidebar = document.querySelector('.left-sidebar');
    leftSidebar.classList.remove('collapsed');
    leftContainer.style.width = (savedLeftWidth - 52) + 'px';
    leftContainer.style.flex = 'none';
    
    settingsPanel.classList.remove('collapsed');
    presetPanel.classList.remove('collapsed');
    comicPanel.classList.remove('collapsed');
    castPanel.classList.remove('collapsed');
    zimanhuaPanel.classList.remove('collapsed');
    collapseLeftBtn.classList.remove('collapsed');
    const icon = collapseLeftBtn.querySelector('svg') || collapseLeftBtn.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', 'panel-left-close');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    isLeftCollapsed = false;
    document.querySelector('.app-main').classList.remove('collapsed');
  }
  togglePanel.classList.add('active');
  comicToggleBtn.classList.remove('active');
  presetToggleBtn.classList.remove('active');
  castToggleBtn.classList.remove('active');
  zimanhuaToggleBtn.classList.remove('active');
  
  settingsPanel.style.display = 'flex';
  comicPanel.style.display = 'none';
  presetPanel.style.display = 'none';
  castPanel.style.display = 'none';
  zimanhuaPanel.style.display = 'none';
});

// 点击预设按钮 - 显示预设栏
presetToggleBtn.addEventListener('click', function() {
  if (isLeftCollapsed) {
    const leftSidebar = document.querySelector('.left-sidebar');
    leftSidebar.classList.remove('collapsed');
    leftContainer.style.width = (savedLeftWidth - 52) + 'px';
    leftContainer.style.flex = 'none';
    
    settingsPanel.classList.remove('collapsed');
    presetPanel.classList.remove('collapsed');
    comicPanel.classList.remove('collapsed');
    castPanel.classList.remove('collapsed');
    zimanhuaPanel.classList.remove('collapsed');
    collapseLeftBtn.classList.remove('collapsed');
    const icon = collapseLeftBtn.querySelector('svg') || collapseLeftBtn.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', 'panel-left-close');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    isLeftCollapsed = false;
    document.querySelector('.app-main').classList.remove('collapsed');
  }
  presetToggleBtn.classList.add('active');
  togglePanel.classList.remove('active');
  comicToggleBtn.classList.remove('active');
  castToggleBtn.classList.remove('active');
  zimanhuaToggleBtn.classList.remove('active');
  presetPanel.style.display = 'flex';
  settingsPanel.style.display = 'none';
  comicPanel.style.display = 'none';
  castPanel.style.display = 'none';
  zimanhuaPanel.style.display = 'none';
});

// 点击演员表按钮 - 显示演员表，隐藏其他栏
castToggleBtn.addEventListener('click', function() {
  if (isLeftCollapsed) {
    const leftSidebar = document.querySelector('.left-sidebar');
    leftSidebar.classList.remove('collapsed');
    leftContainer.style.width = (savedLeftWidth - 52) + 'px';
    leftContainer.style.flex = 'none';
    
    settingsPanel.classList.remove('collapsed');
    presetPanel.classList.remove('collapsed');
    comicPanel.classList.remove('collapsed');
    castPanel.classList.remove('collapsed');
    zimanhuaPanel.classList.remove('collapsed');
    collapseLeftBtn.classList.remove('collapsed');
    const icon = collapseLeftBtn.querySelector('svg') || collapseLeftBtn.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', 'panel-left-close');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    isLeftCollapsed = false;
    document.querySelector('.app-main').classList.remove('collapsed');
  }
  castToggleBtn.classList.add('active');
  togglePanel.classList.remove('active');
  presetToggleBtn.classList.remove('active');
  comicToggleBtn.classList.remove('active');
  zimanhuaToggleBtn.classList.remove('active');
  castPanel.style.display = 'flex';
  settingsPanel.style.display = 'none';
  presetPanel.style.display = 'none';
  comicPanel.style.display = 'none';
  zimanhuaPanel.style.display = 'none';
  updateCastPanel();
});

// 点击“漫画”按钮 - 显示漫画面板，隐藏其他栏
if (comicToggleBtn) {
  comicToggleBtn.addEventListener('click', function() {
    if (isLeftCollapsed) {
      const leftSidebar = document.querySelector('.left-sidebar');
      leftSidebar.classList.remove('collapsed');
      leftContainer.style.width = (savedLeftWidth - 52) + 'px';
      leftContainer.style.flex = 'none';
      
      settingsPanel.classList.remove('collapsed');
      presetPanel.classList.remove('collapsed');
      comicPanel.classList.remove('collapsed');
      castPanel.classList.remove('collapsed');
    zimanhuaPanel.classList.remove('collapsed');
      collapseLeftBtn.classList.remove('collapsed');
      const icon = collapseLeftBtn.querySelector('svg') || collapseLeftBtn.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', 'panel-left-close');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
      isLeftCollapsed = false;
      document.querySelector('.app-main').classList.remove('collapsed');
    }
    comicToggleBtn.classList.add('active');
    togglePanel.classList.remove('active');
    presetToggleBtn.classList.remove('active');
    castToggleBtn.classList.remove('active');
  zimanhuaToggleBtn.classList.remove('active');
    comicPanel.style.display = 'flex';
    settingsPanel.style.display = 'none';
    presetPanel.style.display = 'none';
    castPanel.style.display = 'none';
  zimanhuaPanel.style.display = 'none';
    
    // 初始化漫画面板（如果有内容就不要再初始化，否则会覆盖用户操作）
    const comicGrid = document.getElementById('comicGrid');
    if (comicGrid && !comicGrid.hasChildNodes()) {
      initComicPanel();
    }
  });
}

// ===== 字漫画面板 =====
function openZimanhuaPanel() {
  if (isLeftCollapsed) {
    const leftSidebar = document.querySelector('.left-sidebar');
    leftSidebar.classList.remove('collapsed');
    leftContainer.style.width = (savedLeftWidth - 52) + 'px';
    leftContainer.style.flex = 'none';
    settingsPanel.classList.remove('collapsed');
    presetPanel.classList.remove('collapsed');
    comicPanel.classList.remove('collapsed');
    castPanel.classList.remove('collapsed');
    zimanhuaPanel.classList.remove('collapsed');
    collapseLeftBtn.classList.remove('collapsed');
    const icon = collapseLeftBtn.querySelector('svg') || collapseLeftBtn.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', 'panel-left-close');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    isLeftCollapsed = false;
    document.querySelector('.app-main').classList.remove('collapsed');
  }
  zimanhuaToggleBtn.classList.add('active');
  togglePanel.classList.remove('active');
  presetToggleBtn.classList.remove('active');
  castToggleBtn.classList.remove('active');
  comicToggleBtn.classList.remove('active');
  zimanhuaPanel.style.display = 'flex';
  settingsPanel.style.display = 'none';
  presetPanel.style.display = 'none';
  castPanel.style.display = 'none';
  comicPanel.style.display = 'none';
  loadZimanhuaList();
  setTimeout(() => { if (typeof updateZimanhuaPreviewScale === 'function') updateZimanhuaPreviewScale(); }, 100);
}

if (zimanhuaToggleBtn) {
  zimanhuaToggleBtn.addEventListener('click', function() {
    openZimanhuaPanel();
  });
}

// 字漫画数据缓存
let zimanhuaCache = [];
let zimanhuaHoverTimers = {};
let zimanhuaFirstLoad = true;
// 当前已打开（已应用）的字漫画文件名，用于直接保存
let currentZimanhuaFileName = null;
// 当前已打开字漫画文件的尺寸，用于直接保存
let currentZimanhuaFileSize = '16:9';
// 当前字漫画尺寸筛选
let currentZimanhuaSizeFilter = '16:9';
// 尺寸 → 文件夹名映射（Windows 不允许冒号作为文件夹名）
const zimanhuaSizeFolderMap = {
  '16:9': '16x9',
  '4:3': '4x3',
  '1:1': '1x1',
  '3:4': '3x4',
  '9:16': '9x16'
};

// 从 TypeAnim 文件夹加载 JSON 文件列表
async function loadZimanhuaList() {
  const grid = document.getElementById('zimanhuaGrid');
  if (!grid) return;
  grid.innerHTML = '<div style="grid-column:1/3;text-align:center;padding:20px;color:#999;font-size:12px;">加载中...</div>';
  const sizeFilter = currentZimanhuaSizeFilter;
  const folder = zimanhuaSizeFolderMap[sizeFilter] || '16x9';
  try {
    // 通过 PHP 脚本获取文件列表（按尺寸筛选），加时间戳防止浏览器缓存
    let fileInfos = [];
    try {
      const resp = await fetch('list_typeanim.php?size=' + encodeURIComponent(sizeFilter) + '&_t=' + Date.now());
      if (resp.ok) {
        const result = await resp.json();
        if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object' && result[0].name) {
          fileInfos = result.map(r => ({ fileName: r.name, mtime: r.mtime || 0 }));
        } else {
          fileInfos = result.map(f => ({ fileName: f, mtime: 0 }));
        }
      }
    } catch (e) {
      console.warn('PHP 脚本不可用');
    }
    // 去重：按 fileName 只保留最新的一条
    const seen = new Map();
    for (const info of fileInfos) {
      if (!seen.has(info.fileName) || (info.mtime || 0) > (seen.get(info.fileName).mtime || 0)) {
        seen.set(info.fileName, info);
      }
    }
    fileInfos = Array.from(seen.values());
    if (!fileInfos || fileInfos.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/3;text-align:center;padding:20px;color:#999;font-size:12px;">暂无 ' + sizeFilter + ' 尺寸的字漫画</div>';
      return;
    }
    // 加载每个 JSON 文件的数据（从对应尺寸子文件夹读取）
    zimanhuaCache = [];
    for (const info of fileInfos) {
      try {
        const fileResp = await fetch('TypeAnim/' + folder + '/' + encodeURIComponent(info.fileName) + '?_t=' + Date.now());
        const data = await fileResp.json();
        zimanhuaCache.push({ fileName: info.fileName, data, mtime: info.mtime });
      } catch (e) {
        console.warn('加载失败:', info.fileName, e);
      }
    }
    // 按修改时间倒序排列（最新的在最上面）
    zimanhuaCache.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
    renderZimanhuaGrid();

    // 首次加载时，如果有默认字漫画则自动加载
    if (zimanhuaFirstLoad) {
      zimanhuaFirstLoad = false;
      const defaultName = localStorage.getItem('zimanhuaDefault');
      if (defaultName) {
        const idx = zimanhuaCache.findIndex(i => i.fileName === defaultName);
        if (idx >= 0) {
          setTimeout(() => loadZimanhuaAnimation(idx), 300);
        }
      }
    }
  } catch (e) {
    grid.innerHTML = '<div style="grid-column:1/3;text-align:center;padding:20px;color:#999;font-size:12px;">无法读取 TypeAnim 文件夹<br>请确保服务器已启动</div>';
  }
}

// 渲染字漫画网格
function renderZimanhuaGrid() {
  const grid = document.getElementById('zimanhuaGrid');
  if (!grid) return;
  grid.innerHTML = '';
  if (zimanhuaCache.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/3;text-align:center;padding:20px;color:#999;font-size:12px;">暂无 ' + currentZimanhuaSizeFilter + ' 尺寸的字漫画</div>';
    return;
  }
  zimanhuaCache.forEach((item, idx) => {
    const card = document.createElement('div');
    const size = (item.data && item.data.canvasSize) ? item.data.canvasSize : currentZimanhuaSizeFilter;
    const sizeInfo = exportSizeMap[size] || exportSizeMap['16:9'];
    card.style.cssText = 'position:relative;width:100%;background:var(--color-bg-elevated,#f1f5f9);border:1px solid var(--color-border,#e2e8f0);border-radius:6px;overflow:hidden;cursor:pointer;transition:border-color 0.2s;display:block;flex-shrink:0;';
    card.dataset.idx = idx;
    card.dataset.size = size;

    // 预览区域 — 内容始终基于 1920x1080 基准坐标系
    const preview = document.createElement('div');
    const saveBgColor = (item.data && item.data.bgColor) ? item.data.bgColor : '#f8fafc';
    preview.style.cssText = 'position:absolute;inset:0;background:' + saveBgColor + ';overflow:hidden;';
    const content = document.createElement('div');
    content.className = 'zimanhua-preview-content';
    content.style.cssText = 'position:absolute;top:50%;left:50%;width:' + BASE_WIDTH + 'px;height:' + BASE_HEIGHT + 'px;transform-origin:center center;';

    const textBlocks = (item.data && item.data.blocks) ? item.data.blocks : [];
    const bgImagesData = (item.data && item.data.bgImages) ? item.data.bgImages : [];
    const videoData = (item.data && item.data.videoItems) ? item.data.videoItems : [];

    if (textBlocks.length > 0 || bgImagesData.length > 0 || videoData.length > 0) {
      // 统一收集所有元素，按 zIndex 排序（与展示区 blocksContainer 一致）
      const allElements = [];
      bgImagesData.forEach(b => allElements.push({ type: 'image', data: b, zIndex: b.zIndex || 0 }));
      videoData.forEach(b => allElements.push({ type: 'video', data: b, zIndex: b.zIndex || 0 }));
      textBlocks.forEach(b => allElements.push({ type: 'text', data: b, zIndex: b.zIndex || 0 }));
      allElements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      allElements.forEach(elItem => {
        if (elItem.type === 'image') {
          const b = elItem.data;
          const imgEl = document.createElement('img');
          imgEl.className = 'bg-image-item';
          imgEl.src = b.src || '';
          imgEl.dataset.blockId = 'bg_' + (b.id || '');
          imgEl.style.cssText = 'position:absolute;left:' + (b.x || 0) + 'px;top:' + (b.y || 0) + 'px;width:' + (b.width || 100) + 'px;height:' + (b.height || 100) + 'px;object-fit:fill;pointer-events:none;z-index:' + (b.zIndex || 0) + ';';
          if (b.rotation) imgEl.style.transform = 'rotate(' + b.rotation + 'deg)';
          content.appendChild(imgEl);
        } else if (elItem.type === 'video') {
          const b = elItem.data;
          const vidEl = document.createElement('video');
          vidEl.className = 'video-item';
          vidEl.src = b.src || '';
          vidEl.muted = true;
          vidEl.preload = 'metadata';
          vidEl.playsInline = true;
          vidEl.dataset.blockId = 'video_' + (b.id || '');
          vidEl.style.cssText = 'position:absolute;left:' + (b.x || 0) + 'px;top:' + (b.y || 0) + 'px;width:' + (b.width || 100) + 'px;height:' + (b.height || 100) + 'px;object-fit:fill;pointer-events:none;z-index:' + (b.zIndex || 0) + ';';
          content.appendChild(vidEl);
        } else if (elItem.type === 'text') {
          const b = elItem.data;
          const textEl = document.createElement('div');
          textEl.className = 'zimanhua-text-block' + (b.vertical ? ' vertical' : '');
          textEl.dataset.blockId = String(b.id || '');
          textEl.style.cssText = 'position:absolute;left:' + (b.left || 0) + 'px;top:' + (b.top || 0) + 'px;display:inline-block;z-index:' + (b.zIndex || 0) + ';';
          if (b.flipped) textEl.dataset.flipped = 'true';
          if (b.flippedY) textEl.dataset.flippedY = 'true';
          // 内层 text-content（承载文字样式，供 startHalfFilterAnimation 使用）
          const textContent = document.createElement('div');
          textContent.className = 'text-content';
          const displayText = b.text || '?';
          textContent.innerHTML = displayText.replace(/\n/g, '<br>');
          textContent.style.cssText = 'font-size:' + (b.fontSize || 50) + 'px;color:' + (b.color || '#111111') + ';font-family:' + (b.fontName || 'XXOBS-VF') + ';line-height:1;white-space:nowrap;display:inline-block;';
          textContent.style.fontVariationSettings = "'wght' " + (b.weight || 400);
          // 设置初始静态 transform（旋转、翻转）— 应用到 block
          let staticTransform = '';
          if (b.flipped) staticTransform += 'scaleX(-1) ';
          if (b.flippedY) staticTransform += 'scaleY(-1) ';
          if (b.rotate && b.rotate !== '0deg') {
            textEl.style.setProperty('--rotate-angle', b.rotate);
            staticTransform += 'rotate(' + (parseFloat(b.rotate) || 0) + 'deg) ';
          }
          if (staticTransform) textEl.style.transform = staticTransform;
          textEl.appendChild(textContent);
          content.appendChild(textEl);
        }
      });
    } else {
      content.style.display = 'flex';
      content.style.alignItems = 'center';
      content.style.justifyContent = 'center';
      content.style.color = '#64748b';
      content.style.fontSize = '12px';
      content.textContent = '空';
    }
    preview.appendChild(content);
    card.appendChild(preview);

    // 0帧初始状态：有动画从0帧开始的块显示，没有动画或动画不在0帧的块隐藏
    const animsData = (item.data && item.data.animations) ? item.data.animations : {};
    
    const allPreviewBlocks = content.querySelectorAll('[data-block-id]');
    allPreviewBlocks.forEach(el => {
      const blockId = el.dataset.blockId;
      
      if (blockId.startsWith('bg_')) {
        const bgId = blockId.replace('bg_', '');
        const bg = bgImagesData.find(b => String(b.id) === bgId);
        if (bg && (bg.startTime || 0) <= 0) {
          el.style.visibility = 'visible';
          el.dataset._frame0Visible = 'true';
        } else {
          el.style.visibility = 'hidden';
          el.dataset._frame0Visible = 'false';
        }
      } else if (blockId.startsWith('video_')) {
        const vidId = blockId.replace('video_', '');
        const vid = videoData.find(v => String(v.id) === vidId);
        if (vid && (vid.startTime || 0) <= 0) {
          el.style.visibility = 'visible';
          el.dataset._frame0Visible = 'true';
        } else {
          el.style.visibility = 'hidden';
          el.dataset._frame0Visible = 'false';
        }
      } else {
        const anims = animsData[blockId] || [];
        const hasAnimAtFrame0 = anims.some(a => (a.startTime || 0) <= 0);
        if (hasAnimAtFrame0) {
          el.style.visibility = 'visible';
          el.dataset._frame0Visible = 'true';
        } else {
          el.style.visibility = 'hidden';
          el.dataset._frame0Visible = 'false';
        }
      }
    });

    // 删除按钮
    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>';
    delBtn.title = '删除';
    delBtn.style.cssText = 'position:absolute;top:4px;right:4px;width:22px;height:22px;border:none;border-radius:4px;background:rgba(239,68,68,0.85);color:#fff;cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;z-index:10;';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteZimanhuaAnim(idx, item.fileName);
    });
    card.appendChild(delBtn);

    // 重命名按钮
    const renameBtn = document.createElement('button');
    renameBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
    renameBtn.title = '重命名';
    renameBtn.style.cssText = 'position:absolute;top:4px;right:30px;width:22px;height:22px;border:none;border-radius:4px;background:rgba(59,130,246,0.85);color:#fff;cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;z-index:10;';
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renameZimanhuaAnim(idx, item.fileName);
    });
    card.appendChild(renameBtn);

    // 复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    copyBtn.title = '复制';
    copyBtn.style.cssText = 'position:absolute;top:4px;right:56px;width:22px;height:22px;border:none;border-radius:4px;background:rgba(16,185,129,0.85);color:#fff;cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;z-index:10;';
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      duplicateZimanhuaAnim(idx, item.fileName);
    });
    card.appendChild(copyBtn);

    // 设为默认按钮
    const defaultBtn = document.createElement('button');
    const isDefault = localStorage.getItem('zimanhuaDefault') === item.fileName;
    defaultBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="' + (isDefault ? '#fbbf24' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
    defaultBtn.title = isDefault ? '默认字漫画（点击取消）' : '设为默认';
    defaultBtn.style.cssText = 'position:absolute;top:4px;left:4px;width:22px;height:22px;border:none;border-radius:4px;background:' + (isDefault ? 'rgba(251,191,36,0.9)' : 'rgba(100,116,139,0.7)') + ';color:#fff;cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;z-index:10;';
    defaultBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleZimanhuaDefault(idx, item.fileName);
    });
    card.appendChild(defaultBtn);

    card.addEventListener('mouseenter', () => {
      delBtn.style.display = 'flex';
      renameBtn.style.display = 'flex';
      copyBtn.style.display = 'flex';
      defaultBtn.style.display = 'flex';
    });
    card.addEventListener('mouseleave', () => {
      delBtn.style.display = 'none';
      renameBtn.style.display = 'none';
      copyBtn.style.display = 'none';
      defaultBtn.style.display = 'none';
    });

    // 文件名标签
    const label = document.createElement('div');
    const displayName = item.fileName.replace(/\.json$/, '').replace(/动画_/, '');
    label.textContent = displayName;
    label.style.cssText = 'position:absolute;bottom:0;left:0;right:0;padding:2px 4px;background:rgba(0,0,0,0.5);color:#fff;font-size:9px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    card.appendChild(label);

    // 悬停播放
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = '#0ea5e9';
      startZimanhuaHoverPreview(card, idx);
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = 'var(--color-border,#e2e8f0)';
      stopZimanhuaHoverPreview(idx);
    });

    // 点击加载动画
    card.addEventListener('click', () => {
      loadZimanhuaAnimation(idx);
    });

    grid.appendChild(card);
  });
  // 计算并应用缩放 — 多次尝试确保布局稳定
  requestAnimationFrame(() => {
    updateZimanhuaPreviewScale();
    setTimeout(() => updateZimanhuaPreviewScale(), 50);
    setTimeout(() => updateZimanhuaPreviewScale(), 200);
  });
}

// 更新字漫画预览缩放比例
function updateZimanhuaPreviewScale() {
  const grid = document.getElementById('zimanhuaGrid');
  if (!grid) return;
  const cards = grid.querySelectorAll('[data-idx]');
  cards.forEach(card => {
    const content = card.querySelector('.zimanhua-preview-content');
    if (!content) return;
    const cardW = card.clientWidth;
    if (cardW <= 0) return;
    const size = card.dataset.size || '16:9';
    const sizeInfo = exportSizeMap[size] || exportSizeMap['16:9'];
    // 卡片高度按当前尺寸比例计算
    const cardH = cardW * (sizeInfo.h / sizeInfo.w);
    card.style.height = cardH + 'px';
    // 内容始终是 1920x1080 基准坐标系，用 contain 方式缩放到卡片内
    // transform-origin: center center，配合 top:50%; left:50%
    const scale = Math.min(cardW / BASE_WIDTH, cardH / BASE_HEIGHT);
    if (scale > 0) {
      content.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    }
  });
}

// 判断是否为 Canvas 像素动画（disp*/both*）
function isZimanhuaCanvasAnim(name) {
  return typeof name === 'string' && (name.indexOf('disp') === 0 || name.indexOf('both') === 0);
}

// 字漫画预览逐字符打散状态（使用 WeakMap 避免污染主流程全局状态）
const zimanhuaBlockOriginalHTML = new WeakMap();
const zimanhuaBlockCharSpans = new WeakMap();

function zimanhuaSplitBlockChars(el) {
  const textContent = el.querySelector('.text-content');
  if (!textContent) return [];
  if (zimanhuaBlockCharSpans.has(textContent) && zimanhuaBlockCharSpans.get(textContent).length > 0) {
    return zimanhuaBlockCharSpans.get(textContent);
  }
  zimanhuaBlockOriginalHTML.set(textContent, textContent.innerHTML);
  const temp = document.createElement('div');
  temp.innerHTML = textContent.innerHTML.replace(/<br\s*\/?>/gi, '\n');
  const rawText = temp.textContent;
  if (!rawText || rawText.length === 0) return [];
  const chars = Array.from(rawText);
  textContent.innerHTML = '';
  const spans = [];
  chars.forEach((ch, idx) => {
    const span = document.createElement('span');
    span.className = 'shatter-char';
    span.textContent = ch;
    if (ch === '\n') {
      span.classList.add('shatter-newline');
      span.style.display = 'block';
      span.style.width = '100%';
      span.style.height = '0';
    } else if (ch === ' ') {
      span.classList.add('shatter-space');
      span.style.whiteSpace = 'pre';
    }
    textContent.appendChild(span);
    spans.push({ span: span, index: idx, total: chars.length });
  });
  zimanhuaBlockCharSpans.set(textContent, spans);
  return spans;
}

function zimanhuaRestoreBlockChars(el) {
  const textContent = el.querySelector('.text-content');
  if (!textContent) return;
  if (zimanhuaBlockOriginalHTML.has(textContent)) {
    textContent.innerHTML = zimanhuaBlockOriginalHTML.get(textContent);
    zimanhuaBlockOriginalHTML.delete(textContent);
  }
  zimanhuaBlockCharSpans.delete(textContent);
}

function zimanhuaCalcCharScatter(charIndex, totalChars, progress, scatter, mode) {
  const pi2 = Math.PI * 2;
  const p = progress;
  let scatterFactor;
  if (p < 0.5) {
    scatterFactor = p * 2;
  } else {
    scatterFactor = (1 - p) * 2;
  }
  const halfTotal = Math.max(1, totalChars - 1) / 2;
  const centerOffset = charIndex - halfTotal;
  let dx = 0, dy = 0, dr = 0, dScale = 1, dOpacity = 1;
  switch (mode) {
    case 'radial': {
      const angle = (charIndex / Math.max(1, totalChars)) * pi2 + (totalChars > 1 ? centerOffset * 0.3 : 0);
      dx = Math.cos(angle) * scatter * scatterFactor;
      dy = Math.sin(angle) * scatter * scatterFactor;
      dr = (centerOffset / halfTotal) * 30 * scatterFactor;
      dScale = 1 + 0.2 * scatterFactor * (centerOffset / halfTotal);
      break;
    }
    case 'vertical': {
      const dir = charIndex % 2 === 0 ? -1 : 1;
      dy = dir * scatter * scatterFactor;
      dx = centerOffset * 5 * scatterFactor;
      dr = dir * 15 * scatterFactor;
      break;
    }
    case 'horizontal': {
      const dir = charIndex % 2 === 0 ? -1 : 1;
      dx = dir * scatter * scatterFactor;
      dy = centerOffset * 3 * scatterFactor;
      dr = dir * 10 * scatterFactor;
      break;
    }
    case 'wave': {
      const phase = (charIndex / Math.max(1, totalChars)) * pi2;
      dy = Math.sin(phase + p * pi2) * scatter * scatterFactor;
      dx = Math.cos(phase + p * pi2) * scatter * 0.5 * scatterFactor;
      dr = Math.sin(phase + p * pi2 * 2) * 20 * scatterFactor;
      break;
    }
    case 'diagonal': {
      const dir = charIndex % 2 === 0 ? 1 : -1;
      dx = dir * scatter * scatterFactor;
      dy = -dir * scatter * 0.7 * scatterFactor;
      dr = dir * 20 * scatterFactor;
      dScale = 1 + 0.15 * scatterFactor * dir;
      break;
    }
    case 'spiral': {
      const angle = (charIndex / Math.max(1, totalChars)) * pi2 * 2 + p * pi2 * 2;
      const radius = scatter * scatterFactor;
      dx = Math.cos(angle) * radius;
      dy = Math.sin(angle) * radius;
      dr = 360 * p * (centerOffset / halfTotal);
      break;
    }
    case 'bounce': {
      const bouncePhase = (p + charIndex / Math.max(1, totalChars) * 0.3) * pi2;
      dy = -Math.abs(Math.sin(bouncePhase)) * scatter * scatterFactor;
      dx = centerOffset * 8 * scatterFactor;
      dScale = 1 + 0.1 * Math.sin(bouncePhase) * scatterFactor;
      break;
    }
    case 'random': {
      const seed = charIndex * 137.5;
      const angle = (seed % 360) * (Math.PI / 180);
      dx = Math.cos(angle) * scatter * scatterFactor;
      dy = Math.sin(angle) * scatter * scatterFactor;
      dr = ((seed % 60) - 30) * scatterFactor;
      dScale = 1 + ((seed % 40) - 20) / 100 * scatterFactor;
      break;
    }
    case 'implode': {
      const implodeFactor = 1 - scatterFactor;
      const angle = (charIndex / Math.max(1, totalChars)) * pi2;
      dx = Math.cos(angle) * scatter * implodeFactor;
      dy = Math.sin(angle) * scatter * implodeFactor;
      dr = (centerOffset / halfTotal) * 30 * implodeFactor;
      dScale = 1 + 0.2 * implodeFactor * (centerOffset / halfTotal);
      break;
    }
    case 'stagger': {
      const staggerOffset = charIndex / Math.max(1, totalChars);
      let localProgress = (p * 2 + staggerOffset) % 1;
      let localFactor = localProgress < 0.5 ? localProgress * 2 : (1 - localProgress) * 2;
      const angle = (charIndex / Math.max(1, totalChars)) * pi2;
      dx = Math.cos(angle) * scatter * localFactor;
      dy = Math.sin(angle) * scatter * localFactor;
      dr = (centerOffset / halfTotal) * 30 * localFactor;
      break;
    }
    case 'rain': {
      dy = scatter * scatterFactor;
      dx = (centerOffset / halfTotal) * 10 * scatterFactor;
      dr = (centerOffset / halfTotal) * 20 * scatterFactor;
      break;
    }
    case 'petal': {
      const petalAngle = (charIndex / Math.max(1, totalChars)) * pi2;
      dx = Math.cos(petalAngle) * scatter * scatterFactor;
      dy = Math.sin(petalAngle) * scatter * 0.5 * scatterFactor + scatter * 0.3 * scatterFactor;
      dr = (centerOffset / halfTotal) * 45 * scatterFactor;
      dScale = 1 + 0.15 * scatterFactor * Math.sin(petalAngle);
      break;
    }
    case 'pendulum': {
      const pendulumAngle = Math.sin(p * pi2) * 30 * scatterFactor;
      dx = Math.sin(pendulumAngle * Math.PI / 180) * scatter * scatterFactor;
      dy = Math.abs(Math.cos(pendulumAngle * Math.PI / 180)) * scatter * 0.3 * scatterFactor;
      dr = pendulumAngle;
      break;
    }
    case 'tornado': {
      const tornadoAngle = (charIndex / Math.max(1, totalChars)) * pi2 + p * pi2 * 3;
      const tornadoRadius = scatter * scatterFactor * (0.5 + 0.5 * p);
      dx = Math.cos(tornadoAngle) * tornadoRadius;
      dy = Math.sin(tornadoAngle) * tornadoRadius - scatter * p * scatterFactor;
      dr = 360 * p * (centerOffset / halfTotal);
      break;
    }
    default: {
      const angle = (charIndex / Math.max(1, totalChars)) * pi2;
      dx = Math.cos(angle) * scatter * scatterFactor;
      dy = Math.sin(angle) * scatter * scatterFactor;
      break;
    }
  }
  return { dx, dy, dr, dScale, dOpacity };
}

// 悬停预览动画 — 与展示区完全一致的动画逻辑
function startZimanhuaHoverPreview(card, idx) {
  stopZimanhuaHoverPreview(idx);
  const item = zimanhuaCache[idx];
  if (!item || !item.data) return;
  const contentEl = card.querySelector('.zimanhua-preview-content');
  if (!contentEl) return;
  const animations = item.data.animations || {};
  const blocksData = item.data.blocks || [];
  const bgImagesData = item.data.bgImages || [];
  const videoData = item.data.videoItems || [];

  const bgAnimations = animations['__bg__'] || [];
  const initialScale = 1;
  const initialTranslateX = 0;
  const initialTranslateY = 0;
  
  // 获取初始预览缩放比例
  let previewScale = 1;
  const scaleMatch = contentEl.style.transform?.match(/scale\(([^)]+)\)/);
  if (scaleMatch) previewScale = parseFloat(scaleMatch[1]) || 1;
  // 从卡片计算实际预览缩放比例（更可靠）
  if (card) {
    const size = card.dataset.size || '16:9';
    const sizeInfo = exportSizeMap[size] || exportSizeMap['16:9'];
    const cardW = card.clientWidth;
    const cardH = card.clientHeight;
    if (cardW > 0 && cardH > 0) {
      previewScale = Math.min(cardW / BASE_WIDTH, cardH / BASE_HEIGHT);
    }
  }

  const shatterAnimMap = {
    explodeShatter: { scatter: 60, scatterMode: 'radial' },
    verticalShatter: { scatter: 50, scatterMode: 'vertical' },
    horizontalShatter: { scatter: 60, scatterMode: 'horizontal' },
    spinShatter: { scatter: 50, scatterMode: 'radial' },
    scaleShatter: { scatter: 40, scatterMode: 'radial' },
    waveShatter: { scatter: 45, scatterMode: 'wave' },
    diagonalShatter: { scatter: 55, scatterMode: 'diagonal' },
    spiralShatter: { scatter: 50, scatterMode: 'spiral' },
    flipShatter: { scatter: 40, scatterMode: 'radial' },
    bounceShatter: { scatter: 50, scatterMode: 'bounce' },
    randomShatter: { scatter: 55, scatterMode: 'random' },
    implodeShatter: { scatter: 50, scatterMode: 'implode' },
    staggerShatter: { scatter: 50, scatterMode: 'stagger' },
    petalShatter: { scatter: 45, scatterMode: 'petal' },
    pendulumShatter: { scatter: 40, scatterMode: 'pendulum' },
    rainShatter: { scatter: 60, scatterMode: 'rain' },
    tornadoShatter: { scatter: 55, scatterMode: 'tornado' },
    heartbeatShatter: { scatter: 30, scatterMode: 'radial' },
    flickerShatter: { scatter: 25, scatterMode: 'radial' },
    springShatter: { scatter: 35, scatterMode: 'radial' }
  };

  function getZimanhuaPerCharConfig(animName) {
    if (typeof AnimPluginLoader !== 'undefined' && AnimPluginLoader.isLoaded()) {
      const anim = AnimPluginLoader.getAnimationByName(animName);
      if (anim && anim.perChar) {
        return { scatter: anim.scatter || 50, scatterMode: anim.scatterMode || 'radial' };
      }
    }
    if (shatterAnimMap[animName]) {
      return shatterAnimMap[animName];
    }
    if (typeof animName === 'string' && animName.toLowerCase().indexOf('shatter') !== -1) {
      return { scatter: 50, scatterMode: 'radial' };
    }
    return null;
  }

  const blockStates = [];
  let debugTotalAnims = 0;
  let debugShatterAnims = 0;
  for (const [blockId, anims] of Object.entries(animations)) {
    if (!anims || anims.length === 0) continue;
    const el = contentEl.querySelector('[data-block-id="' + blockId + '"]');
    if (!el) continue;
    
    debugTotalAnims += anims.length;
    console.log('[字漫画预览] 处理块: blockId=' + blockId + ' animsCount=' + anims.length + ' elFound=' + (!!el) + ' hasShatter=' + (anims.some(a => a.anim && a.anim.toLowerCase().indexOf('shatter') !== -1)));
    anims.forEach(a => {
      if (a.anim && (a.anim.indexOf('Shatter') !== -1 || a.anim.indexOf('shatter') !== -1)) {
        debugShatterAnims++;
      }
    });

    el.dataset.origTransform = el.style.transform || '';
    const origLeft = parseFloat(el.style.left) || 0;
    const origTop = parseFloat(el.style.top) || 0;
    el.dataset.origLeft = el.style.left;
    el.dataset.origTop = el.style.top;

    let staticRotate = 0;
    let staticFlipX = 1;
    let staticFlipY = 1;
    if (blockId.startsWith('bg_')) {
      const bgData = bgImagesData.find(b => String('bg_' + b.id) === String(blockId));
      if (bgData) staticRotate = bgData.rotation || 0;
    } else if (blockId.startsWith('video_')) {
      // 视频块暂无静态旋转
    } else {
      const blockData = blocksData.find(b => String(b.id) === String(blockId));
      if (blockData) {
        staticRotate = parseFloat(blockData.rotate) || 0;
        staticFlipX = blockData.flipped ? -1 : 1;
        staticFlipY = blockData.flippedY ? -1 : 1;
      }
    }

    const allPresetAnims = anims.filter(a => a.type === 'preset').map(a => ({
      name: a.anim,
      startTime: (a.startTime || 0) * 1000,
      duration: (a.duration || 1) * 1000
    }));
    const canvasAnims = allPresetAnims.filter(a => isZimanhuaCanvasAnim(a.name));
    const presetAnims = allPresetAnims.filter(a => !isZimanhuaCanvasAnim(a.name));

    const inOutAnims = anims.filter(a => a.type === 'in' || a.type === 'out').map(a => ({
      name: a.anim,
      type: a.type,
      startTime: (a.startTime || 0) * 1000,
      duration: (a.duration || 1) * 1000
    }));

    const pathAnims = anims.filter(a => a.type === 'path' && a.path && a.path.length >= 2).map(a => ({
      path: a.path,
      startTime: (a.startTime || 0) * 1000,
      duration: (a.duration || 1) * 1000
    }));

    const weightAnims = anims.filter(a => a.type === 'weight').map(a => ({
      startTime: (a.startTime || 0) * 1000,
      duration: (a.duration || 2) * 1000,
      weightAnimMin: a.weightAnimMin ?? 100,
      weightAnimMax: a.weightAnimMax ?? 900,
      weightAnimSpeed: a.weightAnimSpeed ?? 1
    }));

    const hasStaticAnim = anims.some(a => a.type === 'preset' && a.anim === 'static');
    if (!hasStaticAnim && presetAnims.length === 0 && inOutAnims.length === 0 && canvasAnims.length === 0 && pathAnims.length === 0 && weightAnims.length === 0) continue;

    const textContentEl = el.querySelector('.text-content');
    if (textContentEl) {
      textContentEl.dataset.origFontVariationSettings = textContentEl.style.fontVariationSettings || '';
    }

    // 计算该块的整体动画时间范围（与展示区一致）
    let firstStart = 0;
    let lastEnd = Infinity;
    
    const inAnims = inOutAnims.filter(a => a.type === 'in');
    const outAnims = inOutAnims.filter(a => a.type === 'out');
    
    if (inAnims.length > 0) {
      firstStart = Math.min(...inAnims.map(a => a.startTime));
    }
    
    if (outAnims.length > 0) {
      lastEnd = Math.max(...outAnims.map(a => a.startTime + a.duration));
    } else {
      const maxAnimEnd = Math.max(
        ...[...presetAnims, ...canvasAnims, ...pathAnims, ...weightAnims].map(a => a.startTime + a.duration),
        0
      );
      lastEnd = maxAnimEnd + 3000;
    }

    blockStates.push({
      el: el,
      textContentEl: textContentEl,
      blockId: blockId,
      presetAnims: presetAnims,
      canvasAnims: canvasAnims,
      inOutAnims: inOutAnims,
      pathAnims: pathAnims,
      weightAnims: weightAnims,
      allAnims: anims,
      staticRotate: staticRotate,
      staticFlipX: staticFlipX,
      staticFlipY: staticFlipY,
      origLeft: origLeft,
      origTop: origTop,
      firstStart: firstStart,
      lastEnd: lastEnd
    });
  }

  // 快速查找哪些元素已由 blockStates 管理（避免背景图/视频覆盖）
  const managedEls = new Set(blockStates.map(s => s.el));

  // 初始状态：有动画的块先隐藏（后续由 tick 控制），没有动画但有 startTime/duration 的块按时间控制，其他默认显示
  contentEl.querySelectorAll('[data-block-id]').forEach(el => {
    const blockId = el.dataset.blockId;
    if (managedEls.has(el)) {
      el.style.visibility = 'hidden';
    } else {
      const blockData = blocksData.find(b => String(b.id) === String(blockId));
      const bgData = bgImagesData.find(b => String('bg_' + b.id) === String(blockId));
      const videoDataItem = videoData.find(b => String('video_' + b.id) === String(blockId));
      if ((blockData && blockData.startTime !== undefined) || bgData || videoDataItem) {
        el.style.visibility = 'hidden';
      } else {
        el.style.visibility = 'visible';
      }
    }
  });

  // 计算总时长：所有动画 + 背景图/视频显示窗口的最大结束时间 + 0.5s
  let maxTime = 0;
  blockStates.forEach(state => {
    state.presetAnims.forEach(a => { maxTime = Math.max(maxTime, a.startTime + a.duration); });
    state.inOutAnims.forEach(a => { maxTime = Math.max(maxTime, a.startTime + a.duration); });
    state.canvasAnims.forEach(a => { maxTime = Math.max(maxTime, a.startTime + a.duration); });
    state.pathAnims.forEach(a => { maxTime = Math.max(maxTime, a.startTime + a.duration); });
    state.weightAnims.forEach(a => { maxTime = Math.max(maxTime, a.startTime + a.duration); });
  });
  bgImagesData.forEach(b => { maxTime = Math.max(maxTime, ((b.startTime || 0) + (b.duration || 0)) * 1000); });
  videoData.forEach(b => { maxTime = Math.max(maxTime, ((b.startTime || 0) + (b.duration || 0)) * 1000); });
  if (maxTime === 0) maxTime = 3000;
  const loopTime = maxTime + 500;

  let startTs = performance.now();
  let skipNextTick = false;
  let debugTickCount = 0;
  let debugPerCharTriggered = false;

  console.log('[字漫画预览] 开始播放，blockStates数量:', blockStates.length, '总动画数:', debugTotalAnims, '打散动画数:', debugShatterAnims);
  blockStates.forEach((state, i) => {
    console.log('[字漫画预览] block[' + i + ']:', state.blockId, 'presetAnims:', state.presetAnims.map(a => a.name).join(','));
  });

  function resetLoop(now) {
    startTs = now;
    contentEl.style.transformOrigin = 'center center';
    contentEl.style.transform = 'translate(-50%, -50%) scale(' + previewScale + ')';
    contentEl.querySelectorAll('[data-block-id]').forEach(el => {
      el.style.visibility = 'hidden';
      el.style.opacity = '';
      el.style.animationDuration = '';
      el.style.animationDelay = '';
      el.style.animationFillMode = '';
      Array.from(el.classList).filter(c => c.startsWith('anim-')).forEach(c => el.classList.remove(c));
      if (el.dataset.origTransform !== undefined) {
        el.style.transform = el.dataset.origTransform;
      }
      if (el.dataset.origLeft !== undefined) {
        el.style.left = el.dataset.origLeft;
        el.style.top = el.dataset.origTop;
      }
      const textContent = el.querySelector('.text-content');
      if (textContent && textContent.dataset.origFontVariationSettings !== undefined) {
        textContent.style.fontVariationSettings = textContent.dataset.origFontVariationSettings;
      }
      stopHalfFilterAnimation(el);
      zimanhuaRestoreBlockChars(el);
    });
    void contentEl.offsetHeight;
  }

  function tick(now) {
    let elapsed = now - startTs;
    if (elapsed > loopTime) {
      elapsed = elapsed % loopTime;
      startTs = now - elapsed;
      resetLoop(now);
      skipNextTick = true;
    }
    
    if (skipNextTick) {
      skipNextTick = false;
      zimanhuaHoverTimers[idx] = requestAnimationFrame(tick);
      return;
    }
    
    const elapsedMs = elapsed;

    // 背景层动画（与展示区逻辑一致：累计所有已开始的动画效果）
    // 展示区使用 applyTransform()，将背景动画叠加在视图变换上
    // 预览区采用相同逻辑：先计算背景动画，再叠加预览缩放
    let bgTX = initialTranslateX;
    let bgTY = initialTranslateY;
    let bgSC = initialScale;
    let bgRot = 0;
    let bgRotX = 0;
    let bgRotY = 0;
    bgAnimations.forEach(anim => {
      if (elapsedMs < anim.startTime * 1000) return;
      const animElapsed = elapsedMs - anim.startTime * 1000;
      const duration = anim.duration * 1000;
      const progress = Math.min(animElapsed / duration, 1);
      const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const dist = anim.distance || 100;
      const scaleVal = anim.scaleValue || 1.5;
      
      // 兼容旧格式（dir+scale）和新格式（motion）
      let motion = anim.motion;
      if (!motion) {
        if (anim.dir && anim.dir !== 'none' && anim.scale && anim.scale !== 'none') {
          motion = 'panZoom';
        } else if (anim.dir === 'left') motion = 'left';
        else if (anim.dir === 'right') motion = 'right';
        else if (anim.dir === 'up') motion = 'up';
        else if (anim.dir === 'down') motion = 'down';
        else if (anim.scale === 'in') motion = 'zoomIn';
        else if (anim.scale === 'out') motion = 'zoomOut';
        else motion = 'none';
      }
      
      let tx = 0, ty = 0, sc = 1, rot = 0, rotX = 0, rotY = 0;
      
      switch (motion) {
        case 'left': tx = -dist * easeProgress; break;
        case 'right': tx = dist * easeProgress; break;
        case 'up': ty = -dist * easeProgress; break;
        case 'down': ty = dist * easeProgress; break;
        case 'zoomIn': sc = 1 + (scaleVal - 1) * easeProgress; break;
        case 'zoomOut': sc = 1 - (1 - 1 / scaleVal) * easeProgress; break;
        case 'none':
        case 'noneScale':
          break;
        case 'orbit':
          rotY = easeProgress * 360;
          sc = 0.7 + 0.3 * Math.abs(Math.cos(easeProgress * Math.PI * 2));
          break;
        case 'orbitCW':
          rotY = -easeProgress * 360;
          sc = 0.7 + 0.3 * Math.abs(Math.cos(easeProgress * Math.PI * 2));
          break;
        case 'orbitCCW':
          rotY = easeProgress * 360;
          sc = 0.7 + 0.3 * Math.abs(Math.cos(easeProgress * Math.PI * 2));
          break;
        case 'orbitZoomIn':
          rotY = easeProgress * 360;
          sc = 0.5 + (scaleVal - 0.5) * easeProgress * 0.5 + 0.3 * Math.abs(Math.cos(easeProgress * Math.PI * 2)) * (1 - easeProgress);
          break;
        case 'orbitZoomOut':
          rotY = easeProgress * 360;
          sc = scaleVal - (scaleVal - 0.7) * easeProgress * 0.5 + 0.3 * Math.abs(Math.cos(easeProgress * Math.PI * 2)) * easeProgress;
          break;
        case 'orbitTilt':
          rotY = easeProgress * 360;
          rotX = Math.sin(easeProgress * Math.PI * 4) * 20;
          sc = 0.7 + 0.3 * Math.abs(Math.cos(easeProgress * Math.PI * 2));
          break;
        case 'orbitDouble':
          rotY = easeProgress * 720;
          sc = 0.6 + 0.4 * Math.abs(Math.cos(easeProgress * Math.PI * 4));
          break;
        case 'orbitFlipX':
          rotX = easeProgress * 360;
          sc = 0.6 + 0.4 * Math.abs(Math.cos(easeProgress * Math.PI * 2));
          break;
        case 'orbitFlipY':
          rotY = easeProgress * 360;
          sc = 0.6 + 0.4 * Math.abs(Math.sin(easeProgress * Math.PI * 2));
          break;
        case 'orbitSpiral':
          rotY = easeProgress * 720;
          sc = 0.4 + (scaleVal - 0.4) * easeProgress;
          rotX = Math.sin(easeProgress * Math.PI * 2) * 10 * easeProgress;
          break;
        case 'orbitRoll':
          rotY = easeProgress * 360;
          rot = Math.sin(easeProgress * Math.PI * 6) * 30;
          sc = 0.7 + 0.3 * Math.abs(Math.cos(easeProgress * Math.PI * 2));
          break;
        case 'orbitDolly':
          rotY = easeProgress * 360;
          sc = 0.5 + (scaleVal - 0.5) * 0.5 * (1 + Math.sin(easeProgress * Math.PI * 2 - Math.PI / 2));
          break;
        case 'orbitPendulum':
          rotY = Math.sin(easeProgress * Math.PI * 2) * 45;
          rotX = Math.sin(easeProgress * Math.PI * 2) * 20;
          sc = 0.8 + 0.2 * Math.abs(Math.sin(easeProgress * Math.PI * 2));
          break;
        case 'rollLeft':
          rot = -dist * 0.3 * easeProgress;
          tx = -dist * 0.2 * easeProgress;
          break;
        case 'rollRight':
          rot = dist * 0.3 * easeProgress;
          tx = dist * 0.2 * easeProgress;
          break;
        case 'spin':
          rot = easeProgress * 720;
          sc = 1 + (scaleVal - 1) * easeProgress;
          break;
        case 'tracking':
          tx = dist * easeProgress;
          sc = 1 + 0.05 * Math.sin(easeProgress * Math.PI);
          break;
        case 'dollyIn':
          sc = 1 + (scaleVal - 1) * easeProgress;
          tx = dist * 0.1 * easeProgress;
          break;
        case 'dollyOut':
          sc = 1 - (1 - 1 / scaleVal) * easeProgress;
          tx = -dist * 0.1 * easeProgress;
          break;
        case 'diagUL':
          tx = -dist * 0.7 * easeProgress;
          ty = -dist * 0.7 * easeProgress;
          break;
        case 'diagDR':
          tx = dist * 0.7 * easeProgress;
          ty = dist * 0.7 * easeProgress;
          break;
        case 'shake':
          const shakeDecay = 1 - easeProgress;
          tx = (Math.sin(elapsedMs * 0.05) * 0.5 + Math.sin(elapsedMs * 0.03) * 0.5) * dist * shakeDecay;
          ty = (Math.cos(elapsedMs * 0.04) * 0.5 + Math.sin(elapsedMs * 0.06) * 0.3) * dist * shakeDecay;
          rot = (Math.sin(elapsedMs * 0.07) * 0.5) * 5 * shakeDecay;
          break;
        case 'ease':
          tx = dist * easeProgress;
          break;
        case 'zoomPunch':
          if (easeProgress < 0.3) {
            sc = 1 + (scaleVal - 1) * (easeProgress / 0.3);
          } else {
            sc = scaleVal - (scaleVal - 1) * ((easeProgress - 0.3) / 0.7);
          }
          break;
        case 'slowPan':
          tx = dist * easeProgress * 0.3;
          ty = -dist * 0.1 * easeProgress;
          sc = 1 + 0.05 * easeProgress;
          break;
        case 'panZoom':
          tx = dist * easeProgress;
          sc = 1 + (scaleVal - 1) * easeProgress;
          break;
        case 'orbitShake':
          rotY = easeProgress * 360;
          const osShake = (1 - easeProgress) * 15;
          rotX = Math.sin(elapsedMs * 0.008) * osShake;
          rot = Math.sin(elapsedMs * 0.01) * 8 * (1 - easeProgress);
          sc = 0.7 + 0.3 * Math.abs(Math.cos(easeProgress * Math.PI * 2));
          break;
        case 'slideSpin':
          tx = dist * 0.7 * easeProgress;
          ty = dist * 0.3 * easeProgress;
          rotY = easeProgress * 360;
          sc = 0.7 + (scaleVal - 0.7) * 0.5 * easeProgress;
          break;
      }
      
      bgTX += tx;
      bgTY += ty;
      bgSC *= sc;
      bgRot += rot;
      bgRotX += rotX;
      bgRotY += rotY;
    });
    // 应用变换：与展示区 applyTransform 逻辑一致
    // 展示区：translate(calc(-50% + txpx), calc(-50% + typx)) rotateX(...) rotateY(...) rotate(...) scale(s)
    // 预览区：同样用 -50% 偏移 + 位移 + 旋转 + 缩放，最后乘以 previewScale 适配预览尺寸
    if (bgTX !== initialTranslateX || bgTY !== initialTranslateY || bgSC !== initialScale || bgRot !== 0 || bgRotX !== 0 || bgRotY !== 0) {
      contentEl.style.transformOrigin = 'center center';
      contentEl.style.transform = `perspective(800px) translate(calc(-50% + ${bgTX * previewScale}px), calc(-50% + ${bgTY * previewScale}px)) rotateX(${bgRotX}deg) rotateY(${bgRotY}deg) rotate(${bgRot}deg) scale(${bgSC * previewScale})`;
    } else {
      contentEl.style.transformOrigin = 'center center';
      contentEl.style.transform = 'translate(-50%, -50%) scale(' + previewScale + ')';
    }

    // 背景图可见性（按自身 startTime/duration，但跳过已有动画管理的元素）
    bgImagesData.forEach(b => {
      const el = contentEl.querySelector('[data-block-id="bg_' + (b.id || '') + '"]');
      if (!el || managedEls.has(el)) return;
      const start = (b.startTime || 0) * 1000;
      const end = start + (b.duration || 0) * 1000;
      el.style.visibility = (elapsedMs >= start && elapsedMs < end) ? 'visible' : 'hidden';
    });

    // 视频可见性（按自身 startTime/duration，但跳过已有动画管理的元素）
    videoData.forEach(b => {
      const el = contentEl.querySelector('[data-block-id="video_' + (b.id || '') + '"]');
      if (!el || managedEls.has(el)) return;
      const start = (b.startTime || 0) * 1000;
      const end = start + (b.duration || 0) * 1000;
      el.style.visibility = (elapsedMs >= start && elapsedMs < end) ? 'visible' : 'hidden';
    });

    // 没有动画但有 startTime/duration 的文字块的可见性
    blocksData.forEach(b => {
      const blockId = String(b.id || '');
      const el = contentEl.querySelector('[data-block-id="' + blockId + '"]');
      if (!el || managedEls.has(el)) return;
      const start = (b.startTime || 0) * 1000;
      const duration = (b.duration || 3) * 1000;
      const end = start + duration;
      el.style.visibility = (elapsedMs >= start && elapsedMs < end) ? 'visible' : 'hidden';
    });

    blockStates.forEach(state => {
      // 与展示区一致：在第一个动画开始到最后一个动画结束之间均可见
      if (elapsedMs < state.firstStart || elapsedMs >= state.lastEnd) {
        state.el.style.visibility = 'hidden';
        state.el.style.transform = state.el.dataset.origTransform || '';
        state.el.style.opacity = '';
        state.el.style.left = state.el.dataset.origLeft;
        state.el.style.top = state.el.dataset.origTop;
        state.el.style.animationDuration = '';
        state.el.style.animationDelay = '';
        state.el.style.animationFillMode = '';
        Array.from(state.el.classList).filter(c => c.startsWith('anim-')).forEach(c => state.el.classList.remove(c));
        if (state.textContentEl) {
          state.textContentEl.style.fontVariationSettings = state.textContentEl.dataset.origFontVariationSettings || '';
        }
        stopHalfFilterAnimation(state.el);
        zimanhuaRestoreBlockChars(state.el);
        return;
      }

      state.el.style.visibility = 'visible';

      // 字重动画
      let activeWeight = null;
      state.weightAnims.forEach(anim => {
        if (elapsedMs >= anim.startTime && elapsedMs < anim.startTime + anim.duration) {
          activeWeight = anim;
        }
      });
      if (activeWeight && state.textContentEl) {
        const cycleMs = 2000 / activeWeight.weightAnimSpeed;
        const progress = ((elapsedMs - activeWeight.startTime) % cycleMs) / cycleMs;
        const weight = Math.round(activeWeight.weightAnimMin + (activeWeight.weightAnimMax - activeWeight.weightAnimMin) * (0.5 + 0.5 * Math.sin(progress * 2 * Math.PI - Math.PI / 2)));
        state.textContentEl.style.fontVariationSettings = "'wght' " + weight;
      } else if (state.textContentEl) {
        state.textContentEl.style.fontVariationSettings = state.textContentEl.dataset.origFontVariationSettings || '';
      }

      // Canvas 像素动画
      const activeCanvas = state.canvasAnims.find(a => elapsedMs >= a.startTime && elapsedMs < a.startTime + a.duration);
      if (activeCanvas && state.textContentEl) {
        if (!halfFilterAnimators.has(state.el)) {
          startHalfFilterAnimation(state.el, activeCanvas.name, true);
        }
      } else {
        stopHalfFilterAnimation(state.el);
      }

      // 入出场动画（CSS keyframes，使用负 delay 实现循环中逐帧定位）
      const activeInOut = state.inOutAnims.find(a => elapsedMs >= a.startTime && elapsedMs < a.startTime + a.duration);
      if (activeInOut) {
        const animElapsed = elapsedMs - activeInOut.startTime;
        Array.from(state.el.classList).filter(c => c.startsWith('anim-')).forEach(c => state.el.classList.remove(c));
        void state.el.offsetHeight;
        state.el.classList.add('anim-' + activeInOut.name);
        state.el.style.animationDuration = activeInOut.duration + 'ms';
        state.el.style.animationDelay = (-animElapsed) + 'ms';
        state.el.style.animationFillMode = 'both';
        void state.el.offsetHeight;
      } else {
        Array.from(state.el.classList).filter(c => c.startsWith('anim-')).forEach(c => state.el.classList.remove(c));
        state.el.style.animationDuration = '';
        state.el.style.animationDelay = '';
        state.el.style.animationFillMode = '';
      }

      // 逐字符预设动画（检查所有动画类型，不仅限于 preset）
      let perCharActive = false;
      let perCharAnim = null;
      let perCharProgress = 0;
      const allAnimCandidates = [
        ...state.presetAnims.map(a => ({ ...a, type: 'preset' })),
        ...state.inOutAnims.map(a => ({ ...a, type: a.type })),
        ...state.canvasAnims.map(a => ({ ...a, type: 'canvas' })),
        ...state.weightAnims.map(a => ({ ...a, type: 'weight' }))
      ];
      allAnimCandidates.forEach(anim => {
        if (elapsedMs < anim.startTime || elapsedMs >= anim.startTime + anim.duration) return;
        const cfg = getZimanhuaPerCharConfig(anim.name);
        if (cfg) {
          perCharActive = true;
          perCharAnim = { ...cfg, name: anim.name };
          perCharProgress = Math.min((elapsedMs - anim.startTime) / anim.duration, 1);
        }
      });
      console.log('[字漫画预览] perChar检查: perCharActive=' + perCharActive + ' perCharAnim=' + (perCharAnim ? perCharAnim.name : 'null') + ' elapsedMs=' + elapsedMs);

      if (perCharActive && perCharAnim) {
        if (!debugPerCharTriggered) {
          debugPerCharTriggered = true;
          console.log('[字漫画预览] perChar动画激活:', perCharAnim.name, 'progress:', perCharProgress, 'scatter:', perCharAnim.scatter);
        }
        const charSpans = zimanhuaSplitBlockChars(state.el);
        console.log('[字漫画预览] 字符打散: blockId=' + state.blockId + ' charSpans.length=' + charSpans.length + ' elapsedMs=' + elapsedMs);
        if (charSpans.length > 0) {
          const baseT = calcAnimTransform(perCharAnim.name, perCharProgress, true, 1);
          state.el.style.transform = '';
          charSpans.forEach(({ span, index, total }) => {
            if (span.textContent === '\n') {
              span.style.transform = '';
              span.style.opacity = '';
              return;
            }
            const scatter = zimanhuaCalcCharScatter(index, total, perCharProgress, perCharAnim.scatter, perCharAnim.scatterMode);
            let transform = '';
            if (scatter.dx || scatter.dy) transform += 'translate(' + scatter.dx + 'px, ' + scatter.dy + 'px) ';
            const sx = (baseT.scaleX || 1) * scatter.dScale;
            const sy = (baseT.scaleY || 1) * scatter.dScale;
            if (sx !== 1 || sy !== 1 || state.staticFlipX !== 1 || state.staticFlipY !== 1) {
              transform += 'scale(' + (sx * state.staticFlipX) + ', ' + (sy * state.staticFlipY) + ') ';
            }
            const rot = (baseT.rotate || 0) + scatter.dr + state.staticRotate;
            if (rot) transform += 'rotate(' + rot + 'deg) ';
            span.style.transform = transform;
            span.style.opacity = ((baseT.opacity !== undefined ? baseT.opacity : 1) * scatter.dOpacity);
          });
        }
        return;
      } else {
        zimanhuaRestoreBlockChars(state.el);
      }

      // 普通预设动画 transform 叠加
      let totalX = 0, totalY = 0, totalScaleX = 1, totalScaleY = 1;
      let totalRotate = 0, totalOpacity = 1;
      state.presetAnims.forEach(anim => {
        if (elapsedMs < anim.startTime) return;
        const animElapsed = elapsedMs - anim.startTime;
        if (animElapsed > anim.duration) return;
        const progress = Math.min(animElapsed / anim.duration, 1);
        const t = calcAnimTransform(anim.name, progress, true, 1);
        totalX += t.x || 0;
        totalY += t.y || 0;
        totalScaleX *= t.scaleX;
        totalScaleY *= t.scaleY;
        totalRotate += t.rotate || 0;
        if (t.opacity !== undefined && t.opacity !== 1) totalOpacity *= t.opacity;
        if (t.fontWeight !== null && t.fontWeight !== undefined && state.textContentEl) {
          state.textContentEl.style.fontVariationSettings = "'wght' " + Math.round(t.fontWeight);
        }
      });

      // 路径动画（取第一个）
      let pathX = 0, pathY = 0;
      const activePath = state.pathAnims.find(a => elapsedMs >= a.startTime && elapsedMs < a.startTime + a.duration);
      if (activePath) {
        const progress = Math.min((elapsedMs - activePath.startTime) / activePath.duration, 1);
        const path = activePath.path;
        const pathIndex = Math.floor(progress * (path.length - 1));
        const pathFrac = (progress * (path.length - 1)) - pathIndex;
        if (pathIndex >= path.length - 1) {
          pathX = path[path.length - 1].x;
          pathY = path[path.length - 1].y;
        } else {
          const p1 = path[pathIndex];
          const p2 = path[pathIndex + 1];
          pathX = p1.x + (p2.x - p1.x) * pathFrac;
          pathY = p1.y + (p2.y - p1.y) * pathFrac;
        }
      }

      let transform = '';
      if (totalX || totalY) transform += 'translate(' + totalX + 'px, ' + totalY + 'px) ';
      if (totalScaleX !== 1 || totalScaleY !== 1 || state.staticFlipX !== 1 || state.staticFlipY !== 1) {
        transform += 'scale(' + (totalScaleX * state.staticFlipX) + ', ' + (totalScaleY * state.staticFlipY) + ') ';
      }
      if (totalRotate + state.staticRotate) transform += 'rotate(' + (totalRotate + state.staticRotate) + 'deg) ';
      state.el.style.transform = transform;
      state.el.style.opacity = totalOpacity < 1 ? totalOpacity : '';
      state.el.style.left = (state.origLeft + pathX) + 'px';
      state.el.style.top = (state.origTop + pathY) + 'px';
    });

    zimanhuaHoverTimers[idx] = requestAnimationFrame(tick);
  }

  zimanhuaHoverTimers[idx] = requestAnimationFrame(tick);
}

function stopZimanhuaHoverPreview(idx) {
  if (zimanhuaHoverTimers[idx]) {
    cancelAnimationFrame(zimanhuaHoverTimers[idx]);
    delete zimanhuaHoverTimers[idx];
  }
  const card = document.querySelector('#zimanhuaGrid [data-idx="' + idx + '"]');
  if (!card) return;
  // 重置内容层的 transform（恢复初始预览缩放）
  const contentEl = card.querySelector('.zimanhua-preview-content');
  if (contentEl) {
    const size = card.dataset.size || '16:9';
    const sizeInfo = exportSizeMap[size] || exportSizeMap['16:9'];
    const cardW = card.clientWidth;
    const cardH = card.clientHeight;
    if (cardW > 0 && cardH > 0) {
      const scale = Math.min(cardW / BASE_WIDTH, cardH / BASE_HEIGHT);
      contentEl.style.transformOrigin = 'center center';
      contentEl.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    }
  }
  const animEls = card.querySelectorAll('[data-block-id]');
  animEls.forEach(el => {
    stopHalfFilterAnimation(el);
    Array.from(el.classList).filter(c => c.startsWith('anim-')).forEach(c => el.classList.remove(c));
    el.style.animationDuration = '';
    el.style.animationDelay = '';
    el.style.animationFillMode = '';
    el.style.opacity = '';
    if (el.dataset.origTransform !== undefined) {
      el.style.transform = el.dataset.origTransform;
      delete el.dataset.origTransform;
    } else {
      el.style.transform = '';
    }
    if (el.dataset.origLeft !== undefined) {
      el.style.left = el.dataset.origLeft;
      el.style.top = el.dataset.origTop;
      delete el.dataset.origLeft;
      delete el.dataset.origTop;
    }
    const textContent = el.querySelector('.text-content');
    if (textContent && textContent.dataset.origFontVariationSettings !== undefined) {
      textContent.style.fontVariationSettings = textContent.dataset.origFontVariationSettings;
      delete textContent.dataset.origFontVariationSettings;
    }
    zimanhuaRestoreBlockChars(el);
    if (el.dataset._frame0Visible === 'true') {
      el.style.visibility = 'visible';
    } else if (el.dataset._frame0Visible === 'false') {
      el.style.visibility = 'hidden';
    }
  });
}

// 删除字漫画动画文件
async function deleteZimanhuaAnim(idx, fileName) {
  if (!confirm('确定删除「' + fileName.replace(/\.json$/, '') + '」？')) return;
  const item = zimanhuaCache[idx];
  const fileSize = (item && item.data && item.data.canvasSize) ? item.data.canvasSize : currentZimanhuaSizeFilter;
  try {
    const resp = await fetch('list_typeanim.php?size=' + encodeURIComponent(fileSize), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=delete&file=' + encodeURIComponent(fileName)
    });
    const text = await resp.text();
    if (resp.ok && text.indexOf('ok') !== -1) {
      showTip('已删除: ' + fileName, 2000);
      loadZimanhuaList();
    } else {
      showTip('删除失败: ' + text, 3000);
    }
  } catch (e) {
    showTip('删除失败: ' + e.message, 3000);
  }
}

// 重命名字漫画动画文件
async function renameZimanhuaAnim(idx, oldFileName) {
  const oldName = oldFileName.replace(/\.json$/, '');
  const newName = prompt('请输入新名称：', oldName);
  if (!newName || newName.trim() === oldName) return;
  const trimmed = newName.trim();
  const newFileName = trimmed.endsWith('.json') ? trimmed : trimmed + '.json';
  const item = zimanhuaCache[idx];
  const fileSize = (item && item.data && item.data.canvasSize) ? item.data.canvasSize : currentZimanhuaSizeFilter;
  try {
    const resp = await fetch('list_typeanim.php?size=' + encodeURIComponent(fileSize), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=rename&old=' + encodeURIComponent(oldFileName) + '&new=' + encodeURIComponent(newFileName)
    });
    const text = await resp.text();
    if (resp.ok && text.indexOf('ok') !== -1) {
      // 如果重命名的是默认字漫画，更新 localStorage
      const currentDefault = localStorage.getItem('zimanhuaDefault');
      if (currentDefault === oldFileName) {
        localStorage.setItem('zimanhuaDefault', newFileName);
      }
      showTip('已重命名: ' + oldName + ' → ' + trimmed, 2000);
      loadZimanhuaList();
    } else {
      showTip('重命名失败: ' + text, 3000);
    }
  } catch (e) {
    showTip('重命名失败: ' + e.message, 3000);
  }
}

// 切换默认字漫画
function toggleZimanhuaDefault(idx, fileName) {
  const currentDefault = localStorage.getItem('zimanhuaDefault');
  if (currentDefault === fileName) {
    localStorage.removeItem('zimanhuaDefault');
    showTip('已取消默认', 1500);
  } else {
    localStorage.setItem('zimanhuaDefault', fileName);
    showTip('已设为默认: ' + fileName.replace(/\.json$/, ''), 2000);
  }
  renderZimanhuaGrid();
}

// 复制字漫画动画文件
async function duplicateZimanhuaAnim(idx, srcFileName) {
  const item = zimanhuaCache[idx];
  const fileSize = (item && item.data && item.data.canvasSize) ? item.data.canvasSize : currentZimanhuaSizeFilter;
  try {
    const resp = await fetch('list_typeanim.php?size=' + encodeURIComponent(fileSize), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=copy&src=' + encodeURIComponent(srcFileName)
    });
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = null; }
    if (resp.ok && data && data.status === 'ok') {
      showTip('已复制: ' + (data.file || '').replace(/\.json$/, ''), 2000);
      loadZimanhuaList();
    } else {
      showTip('复制失败: ' + (data && data.status ? data.status : text), 3000);
    }
  } catch (e) {
    showTip('复制失败: ' + e.message, 3000);
  }
}

// 加载字漫画动画到展示区
async function loadZimanhuaAnimation(idx) {
  const item = zimanhuaCache[idx];
  if (!item || !item.data) return;
  const data = item.data;
  // 记录当前打开的字漫画文件名和尺寸，用于直接保存
  currentZimanhuaFileName = item.fileName;
  const fileSize = (data.canvasSize && exportSizeMap[data.canvasSize]) ? data.canvasSize : currentZimanhuaSizeFilter;
  currentZimanhuaFileSize = fileSize;
  // 先停止当前动画播放，防止加载时动画状态混乱
  if (isPlaying) {
    stopAnimation(false);
  }
  // 恢复画布尺寸并同步到展示区
  setExportSize(fileSize);
  // 清屏（文字块、图片块、视频块）
  document.querySelectorAll('.text-block').forEach(b => b.remove());
  document.querySelectorAll('#blocksContainer .bg-image-item').forEach(b => b.remove());
  document.querySelectorAll('#blocksContainer .video-item').forEach(b => b.remove());
  blocks = [];
  blockAnimations = {};
  bgImages = [];
  videoItems = [];
  bgImageIdCounter = 0;
  videoIdCounter = 0;
  selectedBgImageId = null;
  selectedVideoId = null;
  // 恢复视图状态
  if (data.viewState) {
    viewTranslateX = data.viewState.viewTranslateX || 0;
    viewTranslateY = data.viewState.viewTranslateY || 0;
    viewScale = data.viewState.viewScale || 1;
    viewRotate = data.viewState.viewRotate || 0;
    viewRotateX = data.viewState.viewRotateX || 0;
    viewRotateY = data.viewState.viewRotateY || 0;
    cameraX = data.viewState.cameraX || 0;
    cameraY = data.viewState.cameraY || 0;
    cameraZ = data.viewState.cameraZ || 1000;
    cameraPitch = data.viewState.cameraPitch || 0;
    cameraYaw = data.viewState.cameraYaw || 0;
    cameraRoll = data.viewState.cameraRoll || 0;
    cameraFocalLength = data.viewState.cameraFocalLength || 1000;
    cameraDistance = data.viewState.cameraDistance || 1000;
    orbitCenterX = data.viewState.orbitCenterX || BASE_WIDTH / 2;
    orbitCenterY = data.viewState.orbitCenterY || BASE_HEIGHT / 2;
    orbitCenterZ = data.viewState.orbitCenterZ || 0;
    applyTransform();
  }
  // 恢复背景色（无论是否有保存的背景色，都要设置，避免保持之前的颜色）
  const restoreBgColor = data.bgColor || '#ffffff';
  const contentLayerEl = document.getElementById('contentLayer');
  const previewContEl = document.getElementById('previewContainer');
  if (contentLayerEl) contentLayerEl.style.backgroundColor = restoreBgColor;
  if (previewContEl) previewContEl.style.backgroundColor = restoreBgColor;
  const bgColorInput = document.getElementById('bgColor');
  if (bgColorInput) bgColorInput.value = restoreBgColor;
  // 恢复文字块
  if (data.blocks && Array.isArray(data.blocks)) {
    for (const blockData of data.blocks) {
      const oldId = blockData.id;
      const originalCounter = blockIdCounter;
      blockIdCounter = oldId - 1;
      await createBlock(
        blockData.left || 0,
        blockData.top || 0,
        blockData.text || '文字',
        blockData.fontSize || 50,
        blockData.color || '#111111',
        blockData.fontName || 'XXOBS-VF',
        blockData.weight || 400
      );
      const newBlock = blocks[blocks.length - 1].block;
      if (blockData.flipped) newBlock.dataset.flipped = 'true';
      if (blockData.flippedY) newBlock.dataset.flippedY = 'true';
      if (blockData.vertical) newBlock.classList.add('vertical');
      if (blockData.rotate && blockData.rotate !== '0deg') {
        newBlock.style.setProperty('--rotate-angle', blockData.rotate);
      }
      if (blocks[blocks.length - 1]) {
        blocks[blocks.length - 1].animationSpeed = blockData.animationSpeed || 1;
        blocks[blocks.length - 1].weightAnimMin = blockData.weightAnimMin || 100;
        blocks[blocks.length - 1].weightAnimMax = blockData.weightAnimMax || 900;
        blocks[blocks.length - 1].weightAnimSpeed = blockData.weightAnimSpeed || 1;
        // 恢复 zIndex
        if (blockData.zIndex !== undefined) {
          blocks[blocks.length - 1].zIndex = blockData.zIndex;
          newBlock.style.zIndex = blockData.zIndex;
        }
      }
      blockIdCounter = Math.max(originalCounter, oldId);
    }
  }
  // 恢复图片块
  if (data.bgImages && Array.isArray(data.bgImages)) {
    for (const bgData of data.bgImages) {
      const bgImage = {
        id: bgData.id || (++bgImageIdCounter),
        src: bgData.src,
        name: bgData.name || '背景图',
        x: bgData.x || 0,
        y: bgData.y || 0,
        width: bgData.width || 400,
        height: bgData.height || 300,
        zIndex: bgData.zIndex || bgImages.length,
        startTime: bgData.startTime || 0,
        duration: bgData.duration || 10,
        rotation: bgData.rotation || 0
      };
      bgImageIdCounter = Math.max(bgImageIdCounter, bgImage.id);
      bgImages.push(bgImage);
      renderBgImage(bgImage);
    }
    if (bgImages.length > 0) updateBgImagesContainerTransform();
  }
  // 恢复视频块
  if (data.videoItems && Array.isArray(data.videoItems)) {
    for (const vData of data.videoItems) {
      const video = {
        id: vData.id || (++videoIdCounter),
        name: vData.name || '视频',
        src: vData.src,
        x: vData.x || 0,
        y: vData.y || 0,
        width: vData.width || 400,
        height: vData.height || 300,
        zIndex: vData.zIndex || videoItems.length,
        duration: vData.duration || 10,
        startTime: vData.startTime || 0,
        volume: vData.volume || 0
      };
      videoIdCounter = Math.max(videoIdCounter, video.id);
      videoItems.push(video);
      renderVideo(video);
    }
    if (videoItems.length > 0) updateVideosContainerTransform();
  }
  // 恢复动画数据
  if (data.animations) {
    blockAnimations = data.animations;
  }
  renderTimeline();
  if (typeof updateAnimListDisplay === 'function') window.updateAnimListDisplay();
  if (typeof updateAllCardsHighlight === 'function') updateAllCardsHighlight();
  showTip(`已加载: ${item.fileName}`, 2000);
  
  // 自动循环播放
  if (typeof playerLoop !== 'undefined') {
    playerLoop = true;
    const loopBtn = document.getElementById('playerLoopBtn');
    if (loopBtn) loopBtn.classList.add('active');
  }
  setTimeout(() => {
    const btn = document.getElementById('playKeyframesBtn');
    if (btn) triggerClickNoBubble(btn);
  }, 200);
}

// 字漫画保存/加载按钮
(function() {
  const zSaveBtn = document.getElementById('zimanhuaSaveBtn');
  const zLoadBtn = document.getElementById('zimanhuaLoadBtn');
  const zRefreshBtn = document.getElementById('zimanhuaRefreshBtn');
  if (zSaveBtn) {
    zSaveBtn.addEventListener('click', () => {
      const saveBtn = document.getElementById('saveAnimBtn');
      if (saveBtn) saveBtn.click();
      // 如果当前已打开字漫画文件，saveAnimBtn 会自动保存并刷新列表，无需额外提示
      if (!currentZimanhuaFileName) {
        showTip('保存后请点击"刷新"按钮更新列表', 3000);
      }
    });
  }
  if (zLoadBtn) {
    zLoadBtn.addEventListener('click', () => {
      const loadBtn = document.getElementById('loadAnimBtn');
      if (loadBtn) loadBtn.click();
    });
  }
  if (zRefreshBtn) {
    zRefreshBtn.addEventListener('click', () => {
      loadZimanhuaList();
    });
  }
  // 尺寸筛选按钮
  const sizeBtns = document.querySelectorAll('.zimanhua-size-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const ratio = btn.dataset.ratio;
      currentZimanhuaSizeFilter = ratio;
      updateZimanhuaSizeBtns();
      loadZimanhuaList();
    });
  });
})();

// 更新字漫画尺寸按钮高亮状态
function updateZimanhuaSizeBtns() {
  document.querySelectorAll('.zimanhua-size-btn').forEach(b => {
    if (b.dataset.ratio === currentZimanhuaSizeFilter) {
      b.style.background = 'var(--color-primary,#6366f1)';
      b.style.color = '#fff';
      b.classList.add('active');
    } else {
      b.style.background = 'var(--color-bg-surface,#fff)';
      b.style.color = 'var(--color-text-secondary,#666)';
      b.classList.remove('active');
    }
  });
}

// 更新演员表面板
function updateCastPanel() {
  castItems.innerHTML = '';
  
  const charCount = {};
  
  blocks.forEach(blockData => {
    const text = blockData.text || '';
    for (const char of text) {
      if (char.trim()) {
        charCount[char] = (charCount[char] || 0) + 1;
      }
    }
  });
  
  const sortedChars = Object.entries(charCount)
    .sort((a, b) => b[1] - a[1]);
  
  // 预加载简繁体字体
  loadFontByName('XXSC-VF.ttf').then(() => {
    console.log('简体字体加载完成');
  }).catch(err => {
    console.error('简体字体加载错误:', err);
  });
  
  loadFontByName('XXTC-VF.ttf').then(() => {
    console.log('繁体字体加载完成');
  }).catch(err => {
    console.error('繁体字体加载错误:', err);
  });
  
  sortedChars.forEach(([char, count]) => {
    const castItem = document.createElement('div');
    castItem.className = 'cast-item';
    
    let role = 'guest';
    let roleText = '友情出演';
    let size = 56;  // 统一图标大小
    
    if (count >= 5) {
      role = 'main';
      roleText = '主演';
    } else if (count >= 3) {
      role = 'supporting';
      roleText = '配角';
    }
    
    // 简繁体转换（简化版）
    const simplified = char;
    const traditional = toTraditional(char);
    
    // 判断是否有简繁体差异
    const hasDiff = simplified !== traditional;
    
    let simplifiedHtml = '';
    let traditionalHtml = '';
    
    simplifiedHtml = `
      <div class="cast-icon-wrapper">
        <div class="cast-circle simplified ${role}" style="width:${size}px;height:${size}px;font-size:${size * 0.45}px">${simplified}</div>
        <div class="cast-jian">简</div>
      </div>
    `;
    
    if (hasDiff) {
      traditionalHtml = `
        <div class="cast-icon-wrapper">
          <div class="cast-circle traditional ${role}" style="width:${size}px;height:${size}px;font-size:${size * 0.45}px">${traditional}</div>
          <div class="cast-fan">繁</div>
        </div>
      `;
    }
    
    castItem.innerHTML = `
      <div class="cast-row">
        <div class="cast-icon-wrapper">
          <div class="cast-circle ${role}" style="width:${size}px;height:${size}px;font-size:${size * 0.45}px">${char}</div>
          <div class="cast-jia">甲</div>
        </div>
        ${simplifiedHtml}
        ${traditionalHtml}
      </div>
      <div class="cast-tags">
        <span class="cast-tag role-${role}">${roleText}</span>
        <span class="cast-tag count">${count}次</span>
      </div>
    `;
    
    castItems.appendChild(castItem);
  });
  
  if (sortedChars.length === 0) {
    castItems.innerHTML = '<div style="text-align:center;color:#999;font-size:12px;padding:20px">暂无文字块</div>';
  }
}

// 在文字块变化时更新演员表
function onBlocksChanged() {
  if (castPanel.style.display !== 'none') {
    updateCastPanel();
  }
}
const presetItems = document.getElementById('presetItems');
const presetAddBtn = document.getElementById('presetAddBtn');
const presetExportBtn = document.getElementById('presetExportBtn');
const presetImportBtn = document.getElementById('presetImportBtn');

// 从文件或localStorage加载预设
async function loadPresets() {
  let loadedPresets = null;
  
  // 优先从 animelem/text-block-presets.json 文件加载
  try {
    const response = await fetch('animelem/text-block-presets.json');
    if (response.ok) {
      loadedPresets = await response.json();
      showTip('已从文件加载预设');
    }
  } catch (e) {
    console.log('无法从文件加载预设，使用localStorage:', e);
  }
  
  // 如果文件加载失败，从localStorage加载
  if (!loadedPresets) {
    const saved = localStorage.getItem('textBlockPresets');
    if (saved) {
      loadedPresets = JSON.parse(saved);
    }
  }
  
  if (loadedPresets) {
    presets = loadedPresets;
    presetIdCounter = presets.length > 0 ? Math.max(...presets.map(p => p.id)) + 1 : 0;
    
    // 兼容旧格式预设（单个块格式）并确保所有块都有完整属性
    presets = presets.map(p => {
      if (!p.blocks) {
        return {
          id: p.id,
          name: p.name || p.text || '预设',
          blocks: [{
            text: p.text || p.name || '预设',
            fontSize: p.fontSize || 50,
            fontName: p.fontName || 'XXOBS-VF',
            weight: p.weight || 400,
            color: p.color || '#111111',
            rotate: p.rotate || '0deg',
            flipped: p.flipped || false,
            vertical: p.vertical || false,
            animation: p.animation || 'none',
            animationSpeed: p.animationSpeed !== undefined ? p.animationSpeed : 1,
            weightAnimMin: p.weightAnimMin !== undefined ? p.weightAnimMin : 100,
            weightAnimMax: p.weightAnimMax !== undefined ? p.weightAnimMax : 900,
            weightAnimSpeed: p.weightAnimSpeed !== undefined ? p.weightAnimSpeed : 1,
            relX: 0,
            relY: 0
          }],
          baseX: 0,
          baseY: 0
        };
      }
      p.blocks = p.blocks.map(b => ({
        ...b,
        rotate: b.rotate || '0deg',
        animation: b.animation || 'none',
        animationSpeed: b.animationSpeed !== undefined ? b.animationSpeed : 1,
        weightAnimMin: b.weightAnimMin !== undefined ? b.weightAnimMin : 100,
        weightAnimMax: b.weightAnimMax !== undefined ? b.weightAnimMax : 900,
        weightAnimSpeed: b.weightAnimSpeed !== undefined ? b.weightAnimSpeed : 1
      }));
      return p;
    });
    
    savePresets();
  } else {
    // 添加示例预设（多块格式）
    presets = [{
      id: 0,
      name: '示例文字',
      blocks: [{
        text: '示例文字',
        fontSize: 80,
        fontName: 'XXOBS-VF',
        weight: 400,
        color: '#111111',
        rotate: '0deg',
        flipped: false,
        vertical: false,
        animation: 'none',
        relX: 0,
        relY: 0
      }],
      baseX: 0,
      baseY: 0
    }];
    presetIdCounter = 1;
    savePresets();
  }
  renderPresets();
}

// 保存预设到文件（animelem/text-block-presets.json）并同步到localStorage
async function savePresetsToFile() {
  const dataStr = JSON.stringify(presets, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  
  // 先保存到localStorage
  savePresets();
  
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: 'text-block-presets.json',
        types: [{
          description: 'JSON 文件',
          accept: { 'application/json': ['.json'] }
        }],
        startIn: 'documents'
      });
      
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      
      showTip('预设已保存到文件');
    } catch (err) {
      if (err.name !== 'AbortError') {
        showTip('保存失败：' + err.message);
      }
    }
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'text-block-presets.json';
    a.click();
    URL.revokeObjectURL(url);
    showTip('预设已下载');
  }
}

// 保存预设到localStorage
function savePresets() {
  localStorage.setItem('textBlockPresets', JSON.stringify(presets));
}

// 保存预设到文件并同步更新
presetExportBtn.addEventListener('click', async () => {
  if (presets.length === 0) {
    showTip('没有预设可保存');
    return;
  }
  await savePresetsToFile();
});

// 导入预设文件
presetImportBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) {
          showTip('无效的预设文件');
          return;
        }
        
        presets = imported;
        presetIdCounter = presets.length > 0 ? Math.max(...presets.map(p => p.id)) + 1 : 0;
        savePresets();
        renderPresets();
        showTip(`已导入 ${presets.length} 个预设`);
      } catch (err) {
        showTip('导入失败：文件格式错误');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
});

// 渲染预设列表
function renderPresets() {
  presetItems.innerHTML = '';
  presets.forEach(preset => {
    const item = document.createElement('div');
    item.className = 'preset-item';
    item.draggable = true;
    item.dataset.presetId = preset.id;
    item.innerHTML = `
      <div class="preset-item-icon">${preset.name.charAt(0)}</div>
      <div class="preset-item-name">${preset.name}</div>
      <div class="preset-item-delete" data-id="${preset.id}">×</div>
    `;
    console.log('预设项已创建:', preset.name, 'draggable:', item.draggable);
    
    let isDragging = false;
    
    // 拖拽开始
    item.addEventListener('dragstart', (e) => {
      console.log('拖拽开始:', preset.name);
      isDragging = true;
      item.classList.add('dragging');
      e.dataTransfer.setData('text/plain', JSON.stringify(preset));
      e.dataTransfer.effectAllowed = 'copy';
      currentPresetData = preset; // 保存当前预设数据
      
      // 创建一个透明的拖拽预览元素，隐藏浏览器默认的预览框
      dragEmptyImg = document.createElement('div');
      dragEmptyImg.style.width = '1px';
      dragEmptyImg.style.height = '1px';
      dragEmptyImg.style.position = 'absolute';
      dragEmptyImg.style.top = '-1000px';
      dragEmptyImg.style.left = '-1000px';
      dragEmptyImg.style.opacity = '0';
      document.body.appendChild(dragEmptyImg);
      e.dataTransfer.setDragImage(dragEmptyImg, 0, 0);
      
      // 创建拖拽预览块（可以是多个）
      const previewBlocks = [];
      const blocksData = preset.blocks && preset.blocks.length > 0 ? preset.blocks : [{
        text: preset.text || preset.name || '预设文字',
        fontSize: preset.fontSize || 50,
        fontName: preset.fontName || 'XXOBS-VF',
        weight: preset.weight || 400,
        color: preset.color || '#111111',
        rotate: preset.rotate || '0deg',
        flipped: preset.flipped || false,
        vertical: preset.vertical || false,
        animation: preset.animation || 'none',
        relX: 0,
        relY: 0
      }];
      
      // 获取基准位置
      const baseX = preset.baseX || 0;
      const baseY = preset.baseY || 0;
      
      blocksData.forEach(blockData => {
        const preview = document.createElement('div');
        preview.style.position = 'absolute';
        preview.style.pointerEvents = 'none';
        preview.style.zIndex = '9999';
        preview.style.opacity = '0.9';
        preview.style.background = 'transparent';
        preview.style.border = 'none';
        preview.style.padding = '0';
        preview.style.margin = '0';
        preview.style.boxShadow = 'none';
        preview.style.outline = 'none';
        preview.style.display = 'inline-block';
        preview.style.whiteSpace = 'nowrap';
        preview.style.lineHeight = '1';
        // 初始位置设置为 0，等待 dragover 事件更新
        preview.style.left = '0px';
        preview.style.top = '0px';
        preview.innerHTML = `<div class="text-content" style="background:transparent;border:none;padding:0;margin:0;display:inline;">${blockData.text || blockData.name}</div>`;
        
        // 根据动画类型设置transform-origin
        if (blockData.animation === 'fall' || blockData.animation === 'jump') {
          preview.style.transformOrigin = 'bottom center';
        } else {
          preview.style.transformOrigin = 'center center';
        }
        
        // 应用预设样式
        const fontFamily = blockData.fontName || 'XXOBS-VF';
        preview.style.fontFamily = `'${fontFamily}', sans-serif`;
        preview.style.fontSize = (blockData.fontSize || 50) + 'px';
        preview.style.color = blockData.color || '#111111';
        preview.style.fontVariationSettings = `'wght' ${blockData.weight || 400}`;
        preview.style.fontWeight = blockData.weight || 400;
        
        // 应用旋转
        const rotateAngle = blockData.rotate || '0deg';
        if (blockData.flipped) {
          preview.style.transform = `rotate(${rotateAngle}) scaleX(-1)`;
        } else {
          preview.style.transform = `rotate(${rotateAngle})`;
        }
        
        // 应用竖排
        if (blockData.vertical) {
          preview.classList.add('vertical');
          preview.querySelector('.text-content').style.writingMode = 'vertical-rl';
        }
        
        // 应用动画
        if (blockData.animation && blockData.animation !== 'none') {
          preview.classList.add('anim-' + blockData.animation);
          preview.style.setProperty('--rotate-angle', rotateAngle);
          preview.style.setProperty('--flip-scale', blockData.flipped ? -1 : 1);
        }
        
        // 应用字重动画预览（显示中间字重值）
        if (blockData.weightAnimation) {
          const minW = blockData.weightAnimMin || 100;
          const maxW = blockData.weightAnimMax || 900;
          const midWeight = Math.round((minW + maxW) / 2);
          preview.style.fontVariationSettings = `'wght' ${midWeight}`;
          preview.style.fontWeight = midWeight;
          // 添加字重动画预览效果
          preview.dataset.weightAnimPreview = 'true';
          preview.dataset.weightAnimMin = minW;
          preview.dataset.weightAnimMax = maxW;
          preview.dataset.weightAnimSpeed = blockData.weightAnimSpeed || 1;
        }
        
        contentLayer.appendChild(preview);
        previewBlocks.push(preview);
      });
      
      presetDragPreview = previewBlocks.length === 1 ? previewBlocks[0] : previewBlocks;
      
      // 启动预览块的字重动画
      startPreviewWeightAnimation(previewBlocks);
    });
    
    // 拖拽结束
    item.addEventListener('dragend', (e) => {
      console.log('拖拽结束');
      item.classList.remove('dragging');
      
      // 停止预览动画
      stopPreviewWeightAnimation();
      
      // 移除空图像
      if (dragEmptyImg) {
        dragEmptyImg.remove();
        dragEmptyImg = null;
      }
      
      // 移除预览块（支持多个）
      if (presetDragPreview) {
        if (Array.isArray(presetDragPreview)) {
          presetDragPreview.forEach(p => p.remove());
        } else {
          presetDragPreview.remove();
        }
        presetDragPreview = null;
      }
      currentPresetData = null; // 清除预设数据
    });
    
    // 删除按钮
    const deleteBtn = item.querySelector('.preset-item-delete');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deletePreset(preset.id);
    });
    
    // 点击应用预设（只在非拖拽状态下）
    item.addEventListener('click', (e) => {
      console.log('点击预设项, isDragging:', isDragging);
      if (!isDragging) {
        applyPreset(preset);
      }
    });
    
    presetItems.appendChild(item);
  });
}

// 添加预设（支持多选）
presetAddBtn.addEventListener('click', () => {
  if (selectedBlocks.length === 0) {
    showTip('请先选中一个文字块');
    return;
  }
  
  // 收集所有选中块的数据
  const blockDataArray = selectedBlocks.map(block => {
    const blockData = blocks.find(b => b.block === block);
    
    // 获取当前动画
    let currentAnim = 'none';
    for (const anim of animPresets) {
      if (block.classList.contains('anim-' + anim)) {
        currentAnim = anim;
        break;
      }
    }
    
    // 获取旋转角度
    const rotateAngle = block.style.getPropertyValue('--rotate-angle') || '0deg';
    
    // 获取当前字重（如果是动画中，获取动画状态中的当前字重）
    let currentWeight = blockData ? blockData.weight : 400;
    const weightAnimState = weightAnimStates.get(block.dataset.id);
    if (weightAnimState) {
      // 如果正在播放字重动画，保存当前显示的字重值
      const match = block.style.fontVariationSettings.match(/wght'\s*(\d+)/);
      if (match) {
        currentWeight = parseInt(match[1]);
      }
    }
    
    return {
      text: block.querySelector('.text-content').textContent || '预设文字',
      fontSize: parseInt(block.style.fontSize) || 50,
      fontName: blockData ? blockData.fontName : 'XXOBS-VF',
      weight: currentWeight,
      color: block.style.color || '#111111',
      rotate: rotateAngle,
      flipped: block.dataset.flipped === 'true',
      vertical: block.classList.contains('vertical'),
      animation: currentAnim,
      weightAnimation: weightAnimState ? true : false, // 保存字重动画状态
      weightAnimMin: blockData ? (blockData.weightAnimMin ?? 100) : 100, // 保存字重动画最小值
      weightAnimMax: blockData ? (blockData.weightAnimMax ?? 900) : 900, // 保存字重动画最大值
      weightAnimSpeed: blockData ? (blockData.weightAnimSpeed ?? 1) : 1, // 保存字重动画速度
      // 保存相对位置（相对于第一个块）
      relX: 0,
      relY: 0
    };
  });
  
  // 计算第一个块的绝对位置
  const firstBlock = selectedBlocks[0];
  const firstRect = firstBlock.getBoundingClientRect();
  const contentRect = contentLayer.getBoundingClientRect();
  const baseX = parseInt(firstBlock.style.left) || 0;
  const baseY = parseInt(firstBlock.style.top) || 0;
  
  // 计算其他块相对于第一个块的位置
  selectedBlocks.forEach((block, index) => {
    if (index > 0) {
      const x = parseInt(block.style.left) || 0;
      const y = parseInt(block.style.top) || 0;
      blockDataArray[index].relX = x - baseX;
      blockDataArray[index].relY = y - baseY;
    }
  });
  
  const preset = {
    id: presetIdCounter++,
    name: blockDataArray[0].text || `预设${presetIdCounter}`,
    blocks: blockDataArray,
    baseX: baseX,
    baseY: baseY
  };
  
  presets.push(preset);
  savePresets();
  renderPresets();
  showTip(`已保存 ${selectedBlocks.length} 个文字块`);
});

// 应用预设到选中的文字块
function applyPreset(preset) {
  if (selectedBlocks.length === 0) {
    showTip('请先选中文字块');
    return;
  }
  
  // 获取预设中的第一个块数据
  const firstBlockData = preset.blocks && preset.blocks.length > 0 ? preset.blocks[0] : preset;
  
  selectedBlocks.forEach(block => {
    applyPresetToBlock(block, firstBlockData);
  });
  
  // 更新控制面板
  fontSize.value = firstBlockData.fontSize || 50;
  fsNum.value = fontSize.value;
  wght.value = firstBlockData.weight || 400;
  wNum.value = wght.value;
  textColor.value = firstBlockData.color || '#111111';
  rotate.value = parseInt(firstBlockData.rotate) || 0;
  rotateNum.value = rotate.value;
  animSelect.value = firstBlockData.animation || 'none';
  if (flipXBtn) flipXBtn.classList.toggle('active', firstBlockData.flipped);
  if (flipYBtn) flipYBtn.classList.toggle('active', firstBlockData.flippedY);
  if (verticalBtn) verticalBtn.classList.toggle('active', firstBlockData.vertical);
  
  // 更新字体下拉框
  fontSelect.value = (firstBlockData.fontName || 'XXOBS-VF') + '.ttf';
  
  showTip('已应用预设');
}

// 删除预设
function deletePreset(id) {
  presets = presets.filter(p => p.id !== id);
  savePresets();
  renderPresets();
  showTip('已删除预设');
}

// 展开/收起预设栏
presetToggleBtn.addEventListener('click', () => {
  presetPanel.classList.toggle('expanded');
});

let isDraggingPreset = false;

// 预设拖拽状态
let presetDragging = false;

// 点击预设区域外部关闭预设栏
document.addEventListener('mousedown', (e) => {
  // 如果正在拖拽预设项，不关闭
  if (presetDragging) return;
  
  // 如果点击的不是预设栏及其子元素，则关闭
  if (!presetPanel.contains(e.target)) {
    presetPanel.classList.remove('expanded');
  }
});

// 拖拽状态标记
document.addEventListener('dragstart', (e) => {
  if (e.target.classList.contains('preset-item')) {
    presetDragging = true;
    console.log('开始拖拽预设');
  }
});

document.addEventListener('dragend', () => {
  console.log('结束拖拽预设');
  presetDragging = false;
});

// 页面加载时加载预设
loadPresets();

// 页面卸载时清理字重动画
window.addEventListener('beforeunload', () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (recognition) recognition.stop();
  // 停止所有字重动画
  weightAnimStates.forEach((state, blockId) => {
    cancelAnimationFrame(state.frameId);
  });
  weightAnimStates.clear();
  if (globalWeightAnimFrameId) {
    cancelAnimationFrame(globalWeightAnimFrameId);
    globalWeightAnimFrameId = null;
  }
});

// 分辨率阶梯
const resList = [
  {w:720,h:1280},
  {w:640,h:960},
  {w:480,h:640},
  {}
];
let resIndex = 0;

async function openCam(){
  const opt = resList[resIndex];
  let constraint = {video:{facingMode:"user",...opt}};
  try{
    stream = await navigator.mediaDevices.getUserMedia(constraint);
    camera.srcObject = stream;
    cameraArea.style.display = 'flex';
    running = true;
    toggleCam.innerText = '📷';
    toggleCam.classList.add('btn-danger');
    showTip('✅ 摄像头开启，手近=变细｜手远=变粗');
    const canvas = document.createElement('canvas');
    canvas.width = 258;
    canvas.height = 460;
    const ctx = canvas.getContext('2d');
    setTimeout(() => {
      ctx.drawImage(camera,0,0,258,460);
      const d = ctx.getImageData(0,0,258,460).data;
      let s = 0;
      for(let i=0;i<d.length;i+=16) s+=d[i]+d[i+1]+d[i+2];
      base = s/(258*460*3);
    }, 800);
    function loop() {
      if (!running) return;
      ctx.drawImage(camera,0,0,258,460);
      const d = ctx.getImageData(0,0,258,460).data;
      let s = 0;
      for(let i=0;i<d.length;i+=16) s+=d[i]+d[i+1]+d[i+2];
      const bri = s/(258*460*3);
      let target = 100 + ((base - bri) * 220);
      target = Math.max(100, Math.min(900, target));
      currentWeight += (target - currentWeight) * 0.18;
      const val = Math.round(currentWeight);
      
      // 更新所有选中文字块
      if (selectedBlocks.length > 0) {
        selectedBlocks.forEach(block => {
          block.style.fontVariationSettings = `'wght' ${val}`;
          const editInput = block.querySelector('.edit-input');
          if (editInput) {
            editInput.style.fontVariationSettings = `'wght' ${val}`;
          }
          const blockData = blocks.find(b => b.block === block);
          if (blockData) {
            blockData.weight = val;
          }
        });
        wght.value = val;
        wNum.value = val;
      }
      
      requestAnimationFrame(loop);
    }
    loop();
  }catch(err){
    resIndex++;
    if(resIndex < resList.length){
      showTip(`分辨率不兼容，自动降级`);
      setTimeout(openCam,300);
    }else{
      showTip('❌ 无法调用摄像头，请检查权限/占用');
      resIndex=0;
    }
  }
}

toggleCam.onclick = async () => {
  if (running) { stopCam(); return; }
  resIndex=0;
  await openCam();
};

function stopCam() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  cameraArea.style.display = 'none';
  running = false;
  toggleCam.innerText = '📷';
  toggleCam.classList.remove('btn-danger');
  showTip('🛑 摄像头已关闭');
}

startVoice.onclick = () => {
  if (isVoiceListening) {
    stopVoiceRecognition();
  } else {
    startVoiceRecognition();
  }
};

function startVoiceRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showTip('❌ 浏览器不支持语音识别');
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = useCantonese ? LANG_CANTONESE : LANG_CHINESE;
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if(transcript.includes('转粤语') || transcript.includes('轉粵語')){
      useCantonese = true;refreshLangBtn();restartVoice();showTip('已切换粤语');return;
    }
    if(transcript.includes('转普通话') || transcript.includes('轉普通話')){
      useCantonese = false;refreshLangBtn();restartVoice();showTip('已切换普通话');return;
    }
    if (transcript.includes('停止') || transcript.includes('停低')) {
      stopVoiceRecognition();
      transcript = transcript.replace(/停止|停低/g, '').trim();
      if(transcript) setText(transcript);
      return;
    }
    if (event.results[event.resultIndex].isFinal) {
      setText(transcript);
    }
  };

  recognition.onerror = (event) => {
    if (event.error !== 'no-speech') stopVoiceRecognition();
  };
  recognition.start();
  isVoiceListening = true;
  startVoice.innerText = '停止语音输入';
  startVoice.classList.add('btn-danger');
  showTip(`已开启${useCantonese?'粤语':'普通话'}`);
}

// 统一处理标点
async function setText(str){
  let out = keepPunc ? str : str.replace(puncReg,"");
  if (selectedBlocks.length > 0) {
    // 更新所有选中的文字块
    selectedBlocks.forEach(block => {
      block.querySelector('.text-content').textContent = out;
      block.querySelector('.edit-input').value = out;
    });
    customText.value = out;
  } else {
    // 如果没有选中文字块，创建新的
    let fontFamily = fontSelect.value.replace('.ttf', '').replace('.woff2', '').replace('.otf', '');
    let weightVal = parseInt(wght.value) || 400;
    const block = await createBlock(100, 180, out, 50, '#111111', fontFamily, weightVal);
    selectBlock(block);
  }
}

function restartVoice(){
  if(recognition) recognition.stop();
  setTimeout(startVoiceRecognition,300);
}

function stopVoiceRecognition() {
  if (recognition) recognition.stop();
  isVoiceListening = false;
  startVoice.innerText = '开始语音输入';
  startVoice.classList.remove('btn-danger');
  showTip('🛑 语音输入已停止');
}

// 简繁体转换（简化版，只处理常用字）
function toTraditional(char) {
  const map = {
    '万':'萬','与':'與','丑':'醜','专':'專','业':'業','丛':'叢','东':'東','丝':'絲','丢':'丟','两':'兩',
    '严':'嚴','丧':'喪','个':'個','丰':'豐','临':'臨','为':'為','丽':'麗','举':'舉','么':'麼','义':'義',
    '乌':'烏','乐':'樂','乔':'喬','习':'習','乡':'鄉','书':'書','买':'買','乱':'亂','争':'爭','于':'於',
    '亏':'虧','云':'雲','亚':'亞','产':'產','亩':'畝','亲':'親','亿':'億','仅':'僅','从':'從',
    '仑':'侖','仓':'倉','仪':'儀','们':'們','价':'價','众':'眾','优':'優','伙':'夥','会':'會','伛':'傴',
    '伞':'傘','伟':'偉','传':'傳','伤':'傷','伦':'倫','伪':'偽','体':'體','余':'餘','佣':'傭','侠':'俠',
    '侣':'侶','侦':'偵','侧':'側','侨':'僑','侩':'儈','侬':'儂','俣':'俁','俦':'儔','俨':'儼','俩':'倆',
    '俪':'儷','资':'資','谈':'談','请':'請','诸':'諸','课':'課','谁':'誰','调':'調','谅':'諒','谆':'諄',
    '访':'訪','设':'設','许':'許','论':'論','讽':'諷','讼':'訟','诀':'訣','评':'評','诅':'詛','识':'識',
    '词':'詞','译':'譯','试':'試','诗':'詩','诡':'詭','询':'詢','诣':'詣','详':'詳','诧':'詫','诩':'詡',
    '诫':'誡','诬':'誣','语':'語','诮':'誮','误':'誤','诰':'誥','诱':'誘','诲':'誨','诳':'誑','说':'說',
    '诵':'誦','诶':'誒','请':'請','诺':'諾','读':'讀','诽':'誹','课':'課','诿':'諉','谀':'諛','谁':'誰',
    '调':'調','谄':'諂','谅':'諒','谆':'諄','谈':'談','谋':'謀','谍':'諜','谎':'謊','谏':'諫','谐':'諧',
    '谑':'謔','谒':'謁','谓':'謂','谔':'諤','谕':'諭','谖':'諼','谙':'諳','谛':'諦','谘':'諮','谝':'諞',
    '谢':'謝','谣':'謠','谤':'謗','谥':'諡','谧':'謐','谪':'謫','谫':'謇','谭':'譚','谮':'譖','谯':'譙',
    '谰':'讕','谲':'譎','谳':'讞','谵':'譫','谶':'讖','谷':'穀','贞':'貞','负':'負','贡':'貢','财':'財',
    '责':'責','贤':'賢','败':'敗','账':'賬','货':'貨','质':'質','贩':'販','贪':'貪','贫':'貧','购':'購',
    '贮':'貯','贯':'貫','贱':'賤','贰':'貳','贲':'賁','贴':'貼','贵':'貴','贶':'貺','贷':'貸','贸':'貿',
    '贺':'賀','贻':'貽','贼':'賊','贽':'贄','贾':'賈','贿':'賄','赀':'貲','赁':'賃','赂':'賂','赃':'贓',
    '资':'資','赅':'賅','赆':'贐','赇':'賕','赈':'賑','赉':'賚','赊':'賒','赋':'賦','赌':'賭','赎':'贖',
    '赏':'賞','赐':'賜','赓':'賡','赔':'賠','赖':'賴','赘':'贅','赙':'賻','赚':'賺','赛':'賽','赝':'贗',
    '赒':'賒','赠':'贈','赡':'贍','赢':'贏','赣':'贛','赵':'趙','赶':'趕','趋':'趨','跃':'躍','跄':'蹌',
    '跷':'蹺','跺':'躉','践':'踐','跣':'跣','跻':'躋','踊':'踴','踌':'躊','踪':'蹤','踬':'躓','蹑':'躡',
    '蹒':'蹣','蹙':'蹙','蹩':'蹩','蹯':'躣','蹰':'躑','蹶':'蹶','蹼':'蹼','躏':'躪','躜':'躕','躯':'軀',
    '车':'車','轧':'軋','轨':'軌','轩':'軒','转':'轉','轮':'輪','斩':'斬','软':'軟','轰':'轟','轱':'軲',
    '轲':'軻','轴':'軸','轶':'軾','轷':'軤','轸':'軫','轹':'轢','轺':'軺','轻':'輕','轼':'軾','载':'載',
    '轿':'轎','辀':'輈','辂':'輅','辄':'輒','辇':'輦','辋':'輞','辍':'輟','辎':'輜','辏':'輳','辐':'輻',
    '辑':'輯','输':'輸','辕':'轅','辖':'轄','辗':'輾','辘':'轆','辙':'轍','辚':'轔','辞':'辭','辟':'闢',
    '辩':'辯','辫':'辮','边':'邊','辽':'遼','达':'達','迁':'遷','过':'過','迈':'邁','运':'運','还':'還',
    '这':'這','进':'進','远':'遠','违':'違','连':'連','迟':'遲','迩':'邇','迹':'跡','适':'適','选':'選',
    '逊':'遜','递':'遞','逻':'邏','遗':'遺','遥':'遙','邓':'鄧','邝':'鄺','邬':'鄔','邮':'郵','邹':'鄒',
    '邺':'鄴','邻':'鄰','郁':'鬱','郏':'郟','郐':'鄶','郑':'鄭','郓':'鄆','郦':'酈','郧':'鄖','郸':'鄲',
    '门':'門','闫':'閆','闬':'閈','闪':'閃','闳':'閎','闱':'閨','闵':'閔','闶':'閌','闼':'闥','闾':'閭',
    '阃':'閫','阄':'鬮','阆':'閬','阇':'閦','阈':'閾','阉':'閹','阊':'閶','阋':'鬩','阌':'閌','阍':'閽',
    '阎':'閻','阏':'閼','阐':'闡','阑':'闌','阒':'闃','阓':'闈','阔':'闊','阕':'闋','阖':'闔','阗':'闐',
    '阘':'闒','阙':'闕','阚':'闞','阛':'闛','阜':'闞','阝':'阝','队':'隊','阡':'阡','阢':'阢','颂':'頌',
    '阣':'阣','阤':'阤','阥':'阥','阦':'阦','阧':'阧','阨':'阨','阩':'阩','阪':'阪','阫':'阫','阬':'阬',
    '阭':'阭','阮':'阮','阯':'阯','阰':'阰','阱':'阱','防':'防','阳':'阳','阴':'阴','阵':'阵','阶':'阶',
    '绚':'絢','马':'馬','凤':'鳳'
  };
  return map[char] || char;
}

// 自定义居中确认对话框
function showConfirm(message) {
  return new Promise((resolve) => {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      min-width: 280px;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // 消息文本
    const msgEl = document.createElement('p');
    msgEl.textContent = message;
    msgEl.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    `;
    
    // 按钮容器
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 10px;
    `;
    
    // 确定按钮
    const okBtn = document.createElement('button');
    okBtn.textContent = '确定';
    okBtn.style.cssText = `
      padding: 8px 24px;
      border: none;
      border-radius: 4px;
      background: #007bff;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
    `;
    okBtn.onclick = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };
    
    // 取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = `
      padding: 8px 24px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fff;
      color: #333;
      font-size: 14px;
      cursor: pointer;
    `;
    cancelBtn.onclick = () => {
      document.body.removeChild(overlay);
      resolve(false);
    };
    
    // 组装对话框
    btnContainer.appendChild(okBtn);
    btnContainer.appendChild(cancelBtn);
    dialog.appendChild(msgEl);
    dialog.appendChild(btnContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 点击遮罩层也可关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resolve(false);
      }
    });
  });
}

function showTip(m) {
  tips.innerText = m;
  tips.classList.add('show');
  setTimeout(() => tips.classList.remove('show'), 2000);
}

// 弹出导出插件选择对话框
function showPluginExportDialog(customPlugins) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:10000;';
  
  const dialog = document.createElement('div');
  dialog.style.cssText = 'background:#1e293b;border-radius:8px;padding:20px;min-width:300px;max-width:450px;box-shadow:0 4px 20px rgba(0,0,0,0.3);color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';
  
  const title = document.createElement('div');
  title.style.cssText = 'font-size:14px;font-weight:600;margin-bottom:12px;color:#f1f5f9;';
  title.textContent = '选择要导出的插件';
  dialog.appendChild(title);
  
  const list = document.createElement('div');
  list.style.cssText = 'max-height:300px;overflow-y:auto;margin-bottom:12px;';
  
  customPlugins.forEach(plugin => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 10px;margin-bottom:4px;border-radius:4px;background:rgba(255,255,255,0.05);cursor:pointer;transition:background 0.15s;';
    item.addEventListener('mouseenter', () => { item.style.background = 'rgba(96,165,250,0.15)'; });
    item.addEventListener('mouseleave', () => { item.style.background = 'rgba(255,255,255,0.05)'; });
    
    const info = document.createElement('div');
    info.innerHTML = `<div style="font-size:13px;color:#e2e8f0;">${plugin.icon || '✨'} ${plugin.name}</div><div style="font-size:11px;color:#64748b;">${plugin.animations.length}个动画 · ${plugin.author || '未知'}</div>`;
    item.appendChild(info);
    
    const dlBtn = document.createElement('button');
    dlBtn.textContent = '下载';
    dlBtn.style.cssText = 'padding:4px 12px;font-size:11px;border:none;border-radius:4px;background:#3b82f6;color:#fff;cursor:pointer;';
    dlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const data = AnimPluginLoader.exportPlugin(plugin.id);
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${plugin.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showTip(`已导出 "${plugin.name}"`);
      }
    });
    item.appendChild(dlBtn);
    list.appendChild(item);
  });
  
  dialog.appendChild(list);
  
  // 全部导出按钮
  const exportAllBtn = document.createElement('button');
  exportAllBtn.textContent = '全部导出';
  exportAllBtn.style.cssText = 'width:100%;padding:8px;font-size:12px;border:none;border-radius:4px;background:#3b82f6;color:#fff;cursor:pointer;margin-bottom:8px;';
  exportAllBtn.addEventListener('click', () => {
    const allData = AnimPluginLoader.exportAllCustomPlugins();
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-custom-plugins.json';
    a.click();
    URL.revokeObjectURL(url);
    showTip('已导出全部插件');
    document.body.removeChild(overlay);
  });
  dialog.appendChild(exportAllBtn);
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '关闭';
  closeBtn.style.cssText = 'width:100%;padding:8px;font-size:12px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;background:transparent;color:#94a3b8;cursor:pointer;';
  closeBtn.addEventListener('click', () => document.body.removeChild(overlay));
  dialog.appendChild(closeBtn);
  
  overlay.appendChild(dialog);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
}

// 弹出删除插件选择对话框
function showPluginDeleteDialog(customPlugins) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:10000;';
  
  const dialog = document.createElement('div');
  dialog.style.cssText = 'background:#1e293b;border-radius:8px;padding:20px;min-width:300px;max-width:450px;box-shadow:0 4px 20px rgba(0,0,0,0.3);color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';
  
  const title = document.createElement('div');
  title.style.cssText = 'font-size:14px;font-weight:600;margin-bottom:12px;color:#f1f5f9;';
  title.textContent = '选择要删除的插件';
  dialog.appendChild(title);
  
  const list = document.createElement('div');
  list.style.cssText = 'max-height:300px;overflow-y:auto;margin-bottom:12px;';
  
  customPlugins.forEach(plugin => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 10px;margin-bottom:4px;border-radius:4px;background:rgba(255,255,255,0.05);';
    
    const info = document.createElement('div');
    info.innerHTML = `<div style="font-size:13px;color:#e2e8f0;">${plugin.icon || '✨'} ${plugin.name}</div><div style="font-size:11px;color:#64748b;">${plugin.animations.length}个动画</div>`;
    item.appendChild(info);
    
    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.style.cssText = 'padding:4px 12px;font-size:11px;border:none;border-radius:4px;background:#ef4444;color:#fff;cursor:pointer;';
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const ok = await showConfirm(`确定删除插件 "${plugin.name}" 吗？`);
      if (ok) {
        const result = AnimPluginLoader.deletePlugin(plugin.id);
        showTip(result.message);
        if (result.success) {
          // 刷新对话框内容或关闭
          document.body.removeChild(overlay);
          const remaining = AnimPluginLoader.getCustomPlugins();
          if (remaining.length > 0) {
            showPluginDeleteDialog(remaining);
          }
          // 确保索引不越界
          const catCount = AnimPluginLoader.getPresetCategories().length;
          if (currentPresetCategoryIndex >= catCount) {
            currentPresetCategoryIndex = Math.max(0, catCount - 1);
          }
          renderMultiAnimEffectButtons(editingSelectedAnims);
          if (typeof initComicPanel === 'function') initComicPanel();
        }
      }
    });
    item.appendChild(delBtn);
    list.appendChild(item);
  });
  
  dialog.appendChild(list);
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '关闭';
  closeBtn.style.cssText = 'width:100%;padding:8px;font-size:12px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;background:transparent;color:#94a3b8;cursor:pointer;';
  closeBtn.addEventListener('click', () => document.body.removeChild(overlay));
  dialog.appendChild(closeBtn);
  
  overlay.appendChild(dialog);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
}

// 插件列表弹窗（显示所有插件，可删除自定义插件）
function showPluginListDialog() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:10000;';
  
  const dialog = document.createElement('div');
  dialog.style.cssText = 'background:#1e293b;border-radius:8px;padding:20px;min-width:320px;max-width:500px;max-height:80vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3);color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';
  
  const title = document.createElement('div');
  title.style.cssText = 'font-size:14px;font-weight:600;margin-bottom:12px;color:#f1f5f9;';
  title.textContent = '插件列表';
  dialog.appendChild(title);
  
  const list = document.createElement('div');
  list.style.cssText = 'margin-bottom:12px;';
  
  const hasPluginLoader = typeof AnimPluginLoader !== 'undefined' && AnimPluginLoader.isLoaded();
  if (!hasPluginLoader) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:20px;text-align:center;color:#64748b;font-size:13px;';
    empty.textContent = '插件系统未加载';
    list.appendChild(empty);
  } else {
    const allPlugins = AnimPluginLoader.getLoadedPlugins ? AnimPluginLoader.getLoadedPlugins() : {};
    const customPlugins = AnimPluginLoader.getCustomPlugins ? AnimPluginLoader.getCustomPlugins() : [];
    const allPluginList = [];
    
    Object.keys(allPlugins).forEach(key => {
      const p = allPlugins[key];
      const isCustom = customPlugins.some(cp => cp.id === key);
      allPluginList.push({ ...p, id: key, isCustom });
    });
    
    if (allPluginList.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:20px;text-align:center;color:#64748b;font-size:13px;';
      empty.textContent = '暂无插件';
      list.appendChild(empty);
    } else {
      allPluginList.forEach(plugin => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 10px;margin-bottom:4px;border-radius:4px;background:rgba(255,255,255,0.05);';
        
        const info = document.createElement('div');
        const typeLabel = plugin.isCustom ? '<span style="color:#60a5fa;font-size:10px;margin-left:4px;">[自定义]</span>' : '<span style="color:#10b981;font-size:10px;margin-left:4px;">[内置]</span>';
        info.innerHTML = `<div style="font-size:13px;color:#e2e8f0;">${plugin.icon || '✨'} ${plugin.name}${typeLabel}</div><div style="font-size:11px;color:#64748b;">${plugin.animations ? plugin.animations.length : 0}个动画 · ${plugin.author || '未知'}</div>`;
        item.appendChild(info);
        
        if (plugin.isCustom) {
          const delBtn = document.createElement('button');
          delBtn.textContent = '删除';
          delBtn.style.cssText = 'padding:4px 12px;font-size:11px;border:none;border-radius:4px;background:#ef4444;color:#fff;cursor:pointer;';
          delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const ok = await showConfirm(`确定删除插件 "${plugin.name}" 吗？`);
            if (ok) {
              const result = AnimPluginLoader.deletePlugin(plugin.id);
              showTip(result.message);
              if (result.success) {
                document.body.removeChild(overlay);
                showPluginListDialog();
                const catCount = AnimPluginLoader.getPresetCategories().length;
                if (currentPresetCategoryIndex >= catCount) {
                  currentPresetCategoryIndex = Math.max(0, catCount - 1);
                }
                if (typeof initComicPanel === 'function') initComicPanel();
              }
            }
          });
          item.appendChild(delBtn);
        }
        
        list.appendChild(item);
      });
    }
  }
  
  dialog.appendChild(list);
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '关闭';
  closeBtn.style.cssText = 'width:100%;padding:8px;font-size:12px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;background:transparent;color:#94a3b8;cursor:pointer;';
  closeBtn.addEventListener('click', () => document.body.removeChild(overlay));
  dialog.appendChild(closeBtn);
  
  overlay.appendChild(dialog);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
}

// 导入动画插件说明弹窗
function showPluginHelpModal() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:10000;overflow-y:auto;';
  
  const dialog = document.createElement('div');
  dialog.style.cssText = 'background:#1e293b;border-radius:12px;padding:24px;min-width:360px;max-width:600px;max-height:85vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.4);color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;line-height:1.6;';
  
  dialog.innerHTML = `
    <div style="font-size:18px;font-weight:600;margin-bottom:16px;color:#f1f5f9;">导入动画插件说明</div>
    
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:600;color:#93c5fd;margin-bottom:8px;">什么是动画插件？</div>
      <div style="font-size:13px;color:#cbd5e1;">动画插件是可以扩展字漫画编辑器动画效果的自定义模块。通过导入插件，您可以获得全新的动画预设效果，如打散动画、特殊入场效果等。</div>
    </div>
    
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:600;color:#93c5fd;margin-bottom:8px;">插件文件格式</div>
      <div style="font-size:13px;color:#cbd5e1;margin-bottom:8px;">插件是一个 JSON 文件，基本结构如下：</div>
      <pre style="background:#0f172a;border-radius:6px;padding:12px;font-size:11px;color:#94a3b8;overflow-x:auto;">{
  "id": "my-plugin",
  "name": "我的插件",
  "icon": "✨",
  "author": "作者名",
  "version": "1.0",
  "animations": [
    {
      "name": "打散效果",
      "value": "scatter",
      "css": "transform: translate(${x}px, ${y}px) scale(0);opacity:0;",
      "duration": 1.0
    }
  ]
}</pre>
    </div>
    
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:600;color:#93c5fd;margin-bottom:8px;">如何导入插件</div>
      <div style="font-size:13px;color:#cbd5e1;">1. 点击菜单栏「动画」→「导入插件」</div>
      <div style="font-size:13px;color:#cbd5e1;">2. 选择 .json 格式的插件文件（可多选）</div>
      <div style="font-size:13px;color:#cbd5e1;">3. 导入成功后，插件会出现在动画预设分类中</div>
    </div>
    
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:600;color:#93c5fd;margin-bottom:8px;">如何导出插件</div>
      <div style="font-size:13px;color:#cbd5e1;">1. 点击菜单栏「动画」→「导出插件」</div>
      <div style="font-size:13px;color:#cbd5e1;">2. 选择要导出的自定义插件</div>
      <div style="font-size:13px;color:#cbd5e1;">3. 插件将以 .json 文件形式下载到本地</div>
    </div>
    
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:600;color:#93c5fd;margin-bottom:8px;">如何管理插件</div>
      <div style="font-size:13px;color:#cbd5e1;">1. 点击菜单栏「动画」→「插件列表」</div>
      <div style="font-size:13px;color:#cbd5e1;">2. 在列表中查看所有已加载的插件（内置+自定义）</div>
      <div style="font-size:13px;color:#cbd5e1;">3. 点击「删除」按钮可移除自定义插件</div>
    </div>
    
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:600;color:#93c5fd;margin-bottom:8px;">注意事项</div>
      <div style="font-size:13px;color:#cbd5e1;">· 内置插件无法删除</div>
      <div style="font-size:13px;color:#cbd5e1;">· 自定义插件ID不能与内置插件重复</div>
      <div style="font-size:13px;color:#cbd5e1;">· 插件文件必须是有效的 JSON 格式</div>
      <div style="font-size:13px;color:#cbd5e1;">· 插件中的 CSS 动画支持变量替换：${x}, ${y}, ${scale}, ${rotate}, ${progress}</div>
    </div>
    
    <button id="pluginHelpCloseBtn" style="width:100%;padding:10px;font-size:13px;border:1px solid rgba(255,255,255,0.15);border-radius:6px;background:transparent;color:#94a3b8;cursor:pointer;">关闭</button>
  `;
  
  overlay.appendChild(dialog);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
  
  document.getElementById('pluginHelpCloseBtn').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

window.addEventListener('beforeunload', () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (recognition) recognition.stop();
  // 清理所有字重动画
  weightAnimStates.forEach((state, blockId) => {
    cancelAnimationFrame(state.frameId);
  });
  weightAnimStates.clear();
  if (globalWeightAnimFrameId) {
    cancelAnimationFrame(globalWeightAnimFrameId);
    globalWeightAnimFrameId = null;
  }
});

// ========== 路径动画功能 ==========
let pathDrawMode = false;
let currentPathBlock = null;
let pathPoints = [];
let pathCanvas = null;
let pathCtx = null;
let currentPathMode = 'freehand'; // 'freehand' | 'straight' | 'curve'
let straightLineStart = null;
let curvePoints = []; // For curve: [start, ctrl, end] 当前段最多3点
let curveSegments = []; // For curve: [{start, ctrl, end}, ...] 所有已完成段

// 创建路径绘制界面
function createPathDrawUI(block) {
  currentPathBlock = block;
  pathPoints = [];
  pathDrawMode = true;
  currentPathMode = 'freehand'; // 'freehand' | 'straight' | 'curve'
  
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.className = 'path-draw-canvas';
  overlay.id = 'pathDrawOverlay';
  
  // 创建canvas
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  overlay.appendChild(canvas);
  pathCanvas = canvas;
  pathCtx = canvas.getContext('2d');
  
  // 创建工具栏
  const toolbar = document.createElement('div');
  toolbar.className = 'path-draw-toolbar';
  toolbar.innerHTML = `
    <span style="font-weight:500">绘制路径动画</span>
    <div class="path-mode-selector" style="display:inline-flex;gap:4px;margin:0 8px;">
      <button class="path-mode-btn active" data-mode="freehand" title="随意绘制">✏️ 随意</button>
      <button class="path-mode-btn" data-mode="straight" title="直线绘制">📏 直线</button>
      <button class="path-mode-btn" data-mode="curve" title="曲线绘制">📐 曲线</button>
    </div>
    <button id="clearPathBtn">清除</button>
    <button id="cancelPathBtn">取消</button>
    <button class="primary" id="confirmPathBtn">确定</button>
  `;
  overlay.appendChild(toolbar);
  
  // 绑定路径模式切换
  toolbar.querySelectorAll('.path-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      toolbar.querySelectorAll('.path-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPathMode = btn.dataset.mode;
      pathPoints = [];
      pathCtx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);
      drawBlockMarker();
      showTip('模式: ' + (currentPathMode === 'freehand' ? '随意绘制' : currentPathMode === 'straight' ? '直线绘制' : '曲线绘制'));
    });
  });
  
  document.body.appendChild(overlay);
  
  // 绘制起始点标记（文字块位置）
  drawBlockMarker();
  
  // 绑定事件
  canvas.addEventListener('mousedown', onPathMouseDown);
  canvas.addEventListener('mousemove', onPathMouseMove);
  canvas.addEventListener('mouseup', onPathMouseUp);
  
  document.getElementById('clearPathBtn').onclick = clearPath;
  document.getElementById('cancelPathBtn').onclick = cancelPathDraw;
  document.getElementById('confirmPathBtn').onclick = confirmPathDraw;
}

// 绘制文字块起始位置标记
function drawBlockMarker() {
  if (!currentPathBlock || !pathCtx) return;
  const rect = currentPathBlock.getBoundingClientRect();
  pathCtx.strokeStyle = '#3b82f6';
  pathCtx.lineWidth = 2;
  pathCtx.setLineDash([5, 5]);
  pathCtx.strokeRect(rect.left, rect.top, rect.width, rect.height);
  pathCtx.setLineDash([]);
  
  // 标记中心点
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  pathCtx.fillStyle = '#3b82f6';
  pathCtx.beginPath();
  pathCtx.arc(cx, cy, 6, 0, Math.PI * 2);
  pathCtx.fill();
}

let isDrawingPath = false;

function onPathMouseDown(e) {
  if (e.button !== 0) return;
  
  if (currentPathMode === 'freehand') {
    // 自由绘制：拖拽模式
    isDrawingPath = true;
    const x = e.clientX;
    const y = e.clientY;
    pathPoints.push({ x, y });
    pathCtx.beginPath();
    pathCtx.moveTo(x, y);
  } else if (currentPathMode === 'straight') {
    // 直线绘制：点击起点→预览→点击终点
    const x = e.clientX;
    const y = e.clientY;
    if (straightLineStart === null) {
      straightLineStart = { x, y };
      // 起点的蓝色标记
      pathCtx.beginPath();
      pathCtx.arc(x, y, 5, 0, Math.PI * 2);
      pathCtx.fillStyle = '#3b82f6';
      pathCtx.fill();
      pathCtx.beginPath();
      pathCtx.arc(x, y, 7, 0, Math.PI * 2);
      pathCtx.strokeStyle = '#2563eb';
      pathCtx.lineWidth = 2;
      pathCtx.stroke();
    } else {
      // 第二点击：完成直线
      const endPoint = { x, y };
      pathPoints = [straightLineStart, endPoint];
      pathCtx.beginPath();
      pathCtx.moveTo(straightLineStart.x, straightLineStart.y);
      pathCtx.lineTo(endPoint.x, endPoint.y);
      pathCtx.strokeStyle = '#ef4444';
      pathCtx.lineWidth = 3;
      pathCtx.stroke();
      pathCtx.beginPath();
      pathCtx.arc(endPoint.x, endPoint.y, 5, 0, Math.PI * 2);
      pathCtx.fillStyle = '#ef4444';
      pathCtx.fill();
      straightLineStart = null;
    }
  } else if (currentPathMode === 'curve') {
    // 曲线绘制（支持多段）：点击3点完成一段，段自动相连，结束后再画下一段
    const x = e.clientX;
    const y = e.clientY;
    curvePoints.push({ x, y });
    const fillColor = curvePoints.length === 3 ? '#ef4444' : '#3b82f6';
    pathCtx.beginPath();
    pathCtx.arc(x, y, 5, 0, Math.PI * 2);
    pathCtx.fillStyle = fillColor;
    pathCtx.fill();
    if (curvePoints.length >= 2) {
      pathCtx.beginPath();
      pathCtx.arc(x, y, 7, 0, Math.PI * 2);
      pathCtx.strokeStyle = curvePoints.length === 3 ? '#dc2626' : '#2563eb';
      pathCtx.lineWidth = 2;
      pathCtx.stroke();
    }
    if (curvePoints.length === 3) {
      // 完成一段：将此段加入 curveSegments，首点延续为下一段首点
      const segStart = curvePoints[0];
      const segCtrl = curvePoints[1];
      const segEnd = curvePoints[2];
      curveSegments.push({ start: segStart, ctrl: segCtrl, end: segEnd });
      // 贝塞尔预览线
      const pts = generateBezierPoints(segStart, segCtrl, segEnd, 50);
      pathPoints.push(...pts);
      pathCtx.beginPath();
      pathCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) pathCtx.lineTo(pts[i].x, pts[i].y);
      pathCtx.strokeStyle = '#ef4444';
      pathCtx.lineWidth = 3;
      pathCtx.stroke();
      // 保留末点为下一段首点，重置其余
      curvePoints = [{ x: segEnd.x, y: segEnd.y }];
    }
  }
}

function onPathMouseMove(e) {
  if (currentPathMode === 'freehand') {
    if (!isDrawingPath) return;
    const x = e.clientX;
    const y = e.clientY;
    pathPoints.push({ x, y });
    pathCtx.lineTo(x, y);
    pathCtx.strokeStyle = '#ef4444';
    pathCtx.lineWidth = 3;
    pathCtx.lineCap = 'round';
    pathCtx.lineJoin = 'round';
    pathCtx.stroke();
  } else if (currentPathMode === 'straight') {
    if (straightLineStart === null) return;
    // 清除上次预览，重新画预览线（虚线）
    pathCtx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);
    drawBlockMarker();
    pathCtx.beginPath();
    pathCtx.arc(straightLineStart.x, straightLineStart.y, 5, 0, Math.PI * 2);
    pathCtx.fillStyle = '#3b82f6';
    pathCtx.fill();
    pathCtx.beginPath();
    pathCtx.arc(straightLineStart.x, straightLineStart.y, 7, 0, Math.PI * 2);
    pathCtx.strokeStyle = '#2563eb';
    pathCtx.lineWidth = 2;
    pathCtx.stroke();
    pathCtx.setLineDash([6, 4]);
    pathCtx.beginPath();
    pathCtx.moveTo(straightLineStart.x, straightLineStart.y);
    pathCtx.lineTo(e.clientX, e.clientY);
    pathCtx.strokeStyle = '#ef4444';
    pathCtx.lineWidth = 3;
    pathCtx.stroke();
    pathCtx.setLineDash([]);
  } else if (currentPathMode === 'curve') {
    if (curvePoints.length === 0) return;
    pathCtx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);
    drawBlockMarker();
    // 重新绘制所有已完成段
    if (curveSegments.length > 0) {
      const allPts = generateMultiBezierPath(curveSegments, 50);
      pathCtx.beginPath();
      pathCtx.moveTo(allPts[0].x, allPts[0].y);
      for (let i = 1; i < allPts.length; i++) pathCtx.lineTo(allPts[i].x, allPts[i].y);
      pathCtx.strokeStyle = '#ef4444';
      pathCtx.lineWidth = 3;
      pathCtx.stroke();
      // 显示各段端点
      for (const seg of curveSegments) {
        for (const p of [seg.start, seg.end]) {
          pathCtx.beginPath();
          pathCtx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          pathCtx.fillStyle = '#ef4444';
          pathCtx.fill();
        }
      }
    }
    // 当前段控制点
    for (let i = 0; i < curvePoints.length; i++) {
      const p = curvePoints[i];
      pathCtx.beginPath();
      pathCtx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      pathCtx.fillStyle = '#3b82f6';
      pathCtx.fill();
      pathCtx.beginPath();
      pathCtx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      pathCtx.strokeStyle = '#2563eb';
      pathCtx.lineWidth = 2;
      pathCtx.stroke();
    }
    pathCtx.setLineDash([6, 4]);
    if (curvePoints.length === 1) {
      // 只有起点，预览到光标的直线
      pathCtx.beginPath();
      pathCtx.moveTo(curvePoints[0].x, curvePoints[0].y);
      pathCtx.lineTo(e.clientX, e.clientY);
      pathCtx.strokeStyle = '#ef4444';
      pathCtx.lineWidth = 3;
      pathCtx.stroke();
    } else if (curvePoints.length === 2) {
      // 起点+控制点，预览贝塞尔曲线（末点跟随鼠标）
      pathCtx.beginPath();
      pathCtx.moveTo(curvePoints[0].x, curvePoints[0].y);
      pathCtx.quadraticCurveTo(curvePoints[1].x, curvePoints[1].y, e.clientX, e.clientY);
      pathCtx.strokeStyle = '#ef4444';
      pathCtx.lineWidth = 3;
      pathCtx.stroke();
    }
    pathCtx.setLineDash([]);
  }
}

function onPathMouseUp(e) {
  isDrawingPath = false;
}

function clearPath() {
  pathPoints = [];
  straightLineStart = null;
  curvePoints = [];
  curveSegments = [];
  pathCtx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);
  drawBlockMarker();
}

function cancelPathDraw() {
  pathDrawMode = false;
  currentPathBlock = null;
  pathPoints = [];
  straightLineStart = null;
  curvePoints = [];
  curveSegments = [];
  const overlay = document.getElementById('pathDrawOverlay');
  if (overlay) overlay.remove();
  pathCanvas = null;
  pathCtx = null;
}

function confirmPathDraw() {
  if (pathPoints.length < 2) {
    showTip('请绘制至少2个点的路径');
    return;
  }

  // 曲线模式：若有 curveSegments，生成完整多段贝塞尔路径替换 pathPoints
  let finalPathPoints = pathPoints;
  if (currentPathMode === 'curve' && curveSegments.length > 0) {
    finalPathPoints = generateMultiBezierPath(curveSegments, 50);
  }

  // 简化路径（减少点数）
  const simplified = simplifyPath(finalPathPoints, 5);

  // 获取展示区的位置和缩放
  const contentRect = contentLayer.getBoundingClientRect();
  const contentW = contentRect.width;
  const contentH = contentRect.height;

  // 屏幕坐标 → blocks-container 内部坐标（1920x1080，左上角为原点）
  // blocks-container 中心在屏幕上的位置 = contentLayer中心 + viewTranslate
  const centerX = contentRect.left + contentW / 2 + viewTranslateX;
  const centerY = contentRect.top + contentH / 2 + viewTranslateY;

  // 转换为 blocks-container 内部坐标（绝对坐标）
  const absolutePath = simplified.map(p => ({
    x: (p.x - centerX) / viewScale + BASE_WIDTH / 2,
    y: (p.y - centerY) / viewScale + BASE_HEIGHT / 2
  }));

  // 获取文字块当前位置（作为路径起点的偏移基准）
  const blockLeft = parseFloat(currentPathBlock.style.left) || 0;
  const blockTop = parseFloat(currentPathBlock.style.top) || 0;

  // 调试日志：追踪路径坐标转换
  const blockRect = currentPathBlock.getBoundingClientRect();
  console.log('[confirmPathDraw] 调试信息:');
  console.log('  viewState: translateX=%f, translateY=%f, scale=%f', viewTranslateX, viewTranslateY, viewScale);
  console.log('  contentRect: left=%f, top=%f, width=%f, height=%f', contentRect.left, contentRect.top, contentW, contentH);
  console.log('  centerX=%f, centerY=%f', centerX, centerY);
  console.log('  pathPoints[0]（屏幕起点）: x=%f, y=%f', simplified[0].x, simplified[0].y);
  console.log('  pathPoints[last]（屏幕终点）: x=%f, y=%f', simplified[simplified.length-1].x, simplified[simplified.length-1].y);
  console.log('  absolutePath[0]（内部坐标起点）: x=%f, y=%f', absolutePath[0].x, absolutePath[0].y);
  console.log('  absolutePath[last]（内部坐标终点）: x=%f, y=%f', absolutePath[absolutePath.length-1].x, absolutePath[absolutePath.length-1].y);
  console.log('  blockLeft=%f, blockTop=%f', blockLeft, blockTop);
  console.log('  blockRect（屏幕位置）: left=%f, top=%f, width=%f, height=%f', blockRect.left, blockRect.top, blockRect.width, blockRect.height);
  console.log('  blockRect中心: x=%f, y=%f', blockRect.left + blockRect.width/2, blockRect.top + blockRect.height/2);
  
  // 转换为相对偏移路径（相对于文字块位置）
  // 并归一化：让路径第一个点的偏移为(0,0)，确保动画从块的原始位置开始
  const rawRelative = absolutePath.map(p => ({
    x: p.x - blockLeft,
    y: p.y - blockTop
  }));
  const originX = rawRelative[0].x;
  const originY = rawRelative[0].y;
  const relativePath = rawRelative.map(p => ({
    x: p.x - originX,
    y: p.y - originY
  }));
  
  // 获取块ID
  let blockId;
  if (currentPathBlock.classList.contains('bg-image-item')) {
    blockId = 'bg_' + currentPathBlock.dataset.id;
  } else if (currentPathBlock.classList.contains('video-item')) {
    blockId = 'video_' + currentPathBlock.dataset.id;
  } else {
    blockId = getBlockId(currentPathBlock);
  }
  
  // 计算开始时间和持续时间
  const startTime = parseFloat(editAnimStartTime?.value) || 0;
  const duration = Math.max(1, simplified.length / 30); // 根据路径长度估算时长
  
  // 检查是否正在编辑多选动画
  if (editingAnim && editingAnim.blockId === blockId) {
    // 添加路径动画到已选动画列表
    editingSelectedAnims.push({
      type: 'path',
      anim: 'drawPath',
      startTime: startTime,
      duration: duration,
      path: relativePath,
      pathMode: currentPathMode // 随意 | straight | curve
    });
    
    // 关闭绘制界面
    cancelPathDraw();
    
    // 重新打开编辑动画弹窗，显示更新后的已选动画列表
    setTimeout(() => {
      showEditAnimModal(blockId, editingAnim.indices);
    }, 100);
    
    showTip('路径动画已添加到多选动画');
  } else {
    // 不在编辑多选动画状态，直接保存到blockAnimations
    if (!blockAnimations[blockId]) {
      blockAnimations[blockId] = [];
    }
    
    // 计算开始时间（使用原有逻辑）
    let animStartTime = hasSelectedTime ? currentTimelineTime : 0;
    if (!hasSelectedTime) {
      const anims = blockAnimations[blockId];
      if (anims.length > 0) {
        animStartTime = Math.max(...anims.map(a => a.startTime + a.duration));
      }
    }
    
    // 添加路径动画
    blockAnimations[blockId].push({
      type: 'path',
      anim: 'drawPath',
      startTime: animStartTime,
      duration: duration,
      path: relativePath,
      pathMode: currentPathMode // 随意 | straight | curve
    });
    
    // 刷新时间轴
    initTimeline();
    renderTimeline();
    showTip('路径动画已添加');
    
    // 关闭绘制界面
    cancelPathDraw();
  }
}

// 生成二次贝塞尔曲线上的点（单段）
function generateBezierPoints(p0, p1, p2, numPoints) {
  const pts = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const mt = 1 - t;
    const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
    const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
    pts.push({ x: Math.round(x), y: Math.round(y) });
  }
  return pts;
}

// 生成多段二次贝塞尔曲线路径
// curveSegments: [{start, ctrl, end}, ...] 数组，每段一个二次贝塞尔
function generateMultiBezierPath(curveSegments, numPointsPerSegment) {
  if (!curveSegments || curveSegments.length === 0) return [];
  const pts = [];
  for (const seg of curveSegments) {
    const segPts = generateBezierPoints(seg.start, seg.ctrl, seg.end, numPointsPerSegment);
    // 每段的首个点是前一段末点的重复，skip掉避免重复
    if (pts.length > 0 && segPts.length > 0) {
      if (pts[pts.length - 1].x === segPts[0].x && pts[pts.length - 1].y === segPts[0].y) {
        segPts.shift();
      }
    }
    pts.push(...segPts);
  }
  return pts;
}

// 简化路径（Douglas-Peucker算法简化版）
function simplifyPath(points, tolerance) {
  if (points.length <= 2) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const last = result[result.length - 1];
    const dist = Math.hypot(points[i].x - last.x, points[i].y - last.y);
    if (dist >= tolerance) {
      result.push(points[i]);
    }
  }
  // 确保包含最后一个点
  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1]);
  }
  return result;
}

// 播放路径动画
// 跟踪每个块的路径动画 rAF ID，用于循环重置时取消
const pathAnimRafIds = {};
// 保存动画块的原始位置（用于循环重置和停止时恢复路径动画位置）
let blockOrigPositions = {};
// 恢复打散文字块的函数引用（在播放闭包内赋值）
let restoreShatteredBlocks = null;
// 块元素缓存 - 避免每次 rAF 循环做 DOM 查询
const blockElementCache = {};

function getBlockElementCached(blockId) {
  if (!blockId) return null;
  if (blockElementCache[blockId]) return blockElementCache[blockId];
  const el = getBlockElement(blockId);
  if (el) blockElementCache[blockId] = el;
  return el;
}

function updateBlockElementCache(blockId) {
  const el = getBlockElement(blockId);
  if (el) {
    blockElementCache[blockId] = el;
  } else {
    delete blockElementCache[blockId];
  }
}

function clearBlockElementCache() {
  Object.keys(blockElementCache).forEach(k => delete blockElementCache[k]);
}

function playPathAnimation(block, anim, origLeft, origTop) {
  const path = anim.path;
  if (!path || path.length < 2) return;
  
  const blockId = block.dataset.id || (block.classList.contains('bg-image-item') ? 'bg_' + block.dataset.id : block.classList.contains('video-item') ? 'video_' + block.dataset.id : '');
  
  // 如果该块已经有路径动画在运行，不再重复启动（每帧调用时防止重置）
  if (pathAnimRafIds[blockId]) return;
  
  // 启动新路径动画
  
  const duration = anim.duration * 1000;
  const startTime = performance.now();
  
  // 使用传入的原始位置（来自播放开始时保存的位置），而非从当前style读取
  const baseLeft = origLeft !== undefined ? origLeft : (parseFloat(block.style.left) || 0);
  const baseTop = origTop !== undefined ? origTop : (parseFloat(block.style.top) || 0);
  
  function animate() {
    if (!isPlaying) {
      delete pathAnimRafIds[blockId];
      return;
    }
    
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / duration);
    
    const pathIndex = Math.floor(progress * (path.length - 1));
    const pathProgress = (progress * (path.length - 1)) - pathIndex;
    
    let dx, dy;
    if (pathIndex >= path.length - 1) {
      dx = path[path.length - 1].x;
      dy = path[path.length - 1].y;
    } else {
      const p1 = path[pathIndex];
      const p2 = path[pathIndex + 1];
      dx = p1.x + (p2.x - p1.x) * pathProgress;
      dy = p1.y + (p2.y - p1.y) * pathProgress;
    }
    
    // 相对偏移 + 文字块初始位置
    block.style.left = (baseLeft + dx) + 'px';
    block.style.top = (baseTop + dy) + 'px';
    
    if (progress < 1) {
      pathAnimRafIds[blockId] = requestAnimationFrame(animate);
    } else {
      delete pathAnimRafIds[blockId];
    }
  }
  
  pathAnimRafIds[blockId] = requestAnimationFrame(animate);
}

// ==================== 拖动调整区域大小功能 ====================

// 获取需要调整大小的元素
const resizeLeftHandle = document.getElementById('resizeLeftHandle');
const resizeTimelineHandle = document.getElementById('resizeTimelineHandle');
const leftSidebar = document.querySelector('.left-sidebar');
const leftContainer = document.querySelector('.left-container');
const timelineArea = document.querySelector('.timeline-area');
const rightSection = document.querySelector('.right-section');

// 拖动状态
let isResizingLeft = false;
let isResizingTimeline = false;
let startX = 0;
let startY = 0;
let startLeftWidth = 0;
let startTimelineHeight = 0;

// 左侧区域拖动
if (resizeLeftHandle) {
  resizeLeftHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isResizingLeft = true;
    startX = e.clientX;
    startLeftWidth = leftContainer.offsetWidth + 52; // 52px是图标栏宽度
    resizeLeftHandle.classList.add('dragging');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  });
}

// 时间轴拖动
if (resizeTimelineHandle) {
  resizeTimelineHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isResizingTimeline = true;
    startY = e.clientY;
    startTimelineHeight = timelineArea.offsetHeight;
    resizeTimelineHandle.classList.add('dragging');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';
  });
}

// 鼠标移动
document.addEventListener('mousemove', (e) => {
  if (isResizingLeft) {
    const dx = e.clientX - startX;
    const newWidth = Math.max(312, Math.min(800, startLeftWidth + dx));
    const panelWidth = newWidth - 52;
    
    // 更新面板宽度
    leftContainer.style.width = panelWidth + 'px';
    leftContainer.style.flex = 'none';
    
    // 更新收起按钮状态
    const collapseBtn = document.getElementById('collapseLeftBtn');
    if (collapseBtn) {
      if (panelWidth <= 70) {
        collapseBtn.classList.add('collapsed');
        const icon = collapseBtn.querySelector('svg') || collapseBtn.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', 'panel-right-close');
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
      } else {
        collapseBtn.classList.remove('collapsed');
        const icon = collapseBtn.querySelector('svg') || collapseBtn.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', 'panel-left-close');
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
      }
    }
  }
  
  if (isResizingTimeline) {
    const dy = e.clientY - startY;
    const newHeight = Math.max(100, Math.min(400, startTimelineHeight - dy));
    
    // 更新时间轴高度
    timelineArea.style.height = newHeight + 'px';
    timelineArea.style.flex = 'none';
    
    // 确保keyframes-container填充整个高度
    const keyframesContainer = timelineArea.querySelector('.keyframes-container');
    if (keyframesContainer) {
      keyframesContainer.style.height = '100%';
    }
  }
});

// 鼠标释放
document.addEventListener('mouseup', () => {
  if (isResizingLeft) {
    isResizingLeft = false;
    resizeLeftHandle.classList.remove('dragging');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // 保存当前宽度用于展开恢复
    const currentWidth = leftContainer.offsetWidth;
    if (currentWidth > 70) {
      savedLeftWidth = currentWidth + 52;
      isLeftCollapsed = false;
    } else {
      isLeftCollapsed = true;
    }
  }
  
  if (isResizingTimeline) {
    isResizingTimeline = false;
    resizeTimelineHandle.classList.remove('dragging');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }
});

// 双击恢复默认大小
if (resizeLeftHandle) {
  resizeLeftHandle.addEventListener('dblclick', () => {
    savedLeftWidth = 312; // 总宽 = 图标栏52 + 面板260
    leftContainer.style.width = '260px';
    leftContainer.style.flex = 'none';
    isLeftCollapsed = false;
    
    const collapseBtn = document.getElementById('collapseLeftBtn');
    if (collapseBtn) {
      collapseBtn.classList.remove('collapsed');
      const icon = collapseBtn.querySelector('svg') || collapseBtn.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', 'panel-left-close');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.classList.remove('collapsed');
  });
}

if (resizeTimelineHandle) {
  resizeTimelineHandle.addEventListener('dblclick', () => {
    timelineArea.style.height = '240px';
    timelineArea.style.flex = 'none';
  });
}

// ===================== 漫画面板功能 =====================
// 漫画动画预设列表
const comicAnimations = [
  'shake', 'fall', 'jump', 'run', 'walk', 'spin', 'blink', 'pulse', 'sway', 'bounce',
  'float', 'vibrate', 'slide', 'zoom', 'swing', 'dive', 'rise', 'dash', 'breathe', 'flicker',
  'wave', 'clap', 'nod', 'shakehead', 'run2', 'fly', 'crawl', 'jump2', 'waddle', 'stretch',
  'sleep', 'eat', 'legKick', 'footTap', 'legSwing', 'hipShake', 'kneeBend', 'toeTap',
  'twist', 'spiral', 'ripple', 'rotate', 'flipX', 'flipY', 'heartbeat', 'tada', 'rubberBand',
  'wobble', 'jello', 'lightSpeed', 'rollIn'
];

// 动画名称中文映射
const animNameMap = {
  // 基础动画
  'shake': '抖动', 'fall': '倒下', 'jump': '跳高', 'run': '跑步', 'walk': '行走',
  'spin': '旋转', 'blink': '闪烁', 'pulse': '放大缩小', 'sway': '左右摇摆', 'bounce': '弹跳',
  'float': '飘动', 'vibrate': '震动', 'slide': '滑动', 'zoom': '缩放', 'swing': '摇摆',
  'dive': '俯冲', 'rise': '上升', 'dash': '冲刺', 'breathe': '呼吸', 'flicker': '闪烁抖动',
  // 动作动画
  'wave': '挥手', 'clap': '鼓掌', 'nod': '点头', 'shakehead': '摇头', 'run2': '奔跑',
  'fly': '飞翔', 'crawl': '爬行', 'jump2': '跳跃', 'waddle': '摇摆走', 'stretch': '伸展',
  'sleep': '睡觉', 'eat': '吃东西',
  // 半身动画
  'legKick': '踢腿', 'footTap': '踮脚', 'legSwing': '摆腿', 'hipShake': '扭胯', 'kneeBend': '屈膝',
  'footWiggle': '脚晃', 'legMarch': '踏步', 'hipTwist': '扭腰', 'footStomp': '跺脚', 'legStretch': '伸腿',
  'armWave': '手臂波', 'armSwing': '手臂摆', 'armRaise': '手臂举', 'shoulderShrug': '耸肩',
  'shoulderShake': '肩膀抖', 'fingerTap': '手指点', 'wristTwist': '手腕扭', 'elbowHit': '肘击',
  'armStretch': '手臂伸', 'handClap': '拍手',
  // 夸张半身
  'bigKick': '大力踢', 'stompHard': '重踏', 'shakeHip': '狂扭胯', 'highStep': '高抬腿',
  'twistWaist': '扭腰', 'jumpFeet': '跳脚', 'wiggleLeg': '抖腿', 'slideFeet': '滑步',
  'squatBounce': '蹲跳', 'splitLegs': '劈叉', 'bigArmSwing': '大摆臂', 'wildShrug': '狂耸肩',
  'highArmRaise': '高举臂', 'wildShoulder': '狂抖肩', 'bigWave': '大挥手', 'exaggeratedClap': '夸张鼓掌',
  'bigArmFling': '大甩臂', 'wildPunch': '狂拳击', 'bigStretch': '大伸展', 'wildArmShake': '狂抖臂',
  // 疯狂动画
  'crazyKick': '疯狂踢', 'wildStomp': '疯狂踏', 'hipSwing': '胯摆', 'legFling': '腿甩',
  'crazyDance': '疯狂舞', 'jumpSplit': '跳分', 'legShake': '腿抖', 'squatKick': '蹲踢',
  'twistJump': '扭跳', 'wildSlide': '疯狂滑', 'bottomSwing': '下摆', 'bottomShake': '下抖',
  'bottomBounce': '下弹', 'bottomSpin': '下旋', 'bottomScale': '下缩', 'bottomSlide': '下滑',
  'bottomBend': '下弯', 'bottomFling': '下甩', 'bottomVibrate': '下震', 'bottomSway': '下摇',
  'fullBodyShake': '全身抖', 'wildSpin': '疯狂旋', 'crazyBounce': '疯狂弹', 'wildTwitch': '疯狂抽',
  'crazySway': '疯狂晃', 'wildVibrate': '疯狂震', 'crazyRoll': '疯狂滚', 'wildDash': '疯狂冲',
  'crazyBurst': '疯狂爆', 'wildTwist': '疯狂扭',
  // 3D动画
  'flip3D': '3D翻转', 'rotate3DY': '3D左右旋', 'rotate3DX': '3D上下旋', 'swing3D': '3D摇摆',
  'zoom3D': '3D缩放', 'spin3D': '3D旋转', 'tilt3D': '3D倾斜', 'bounce3D': '3D弹跳',
  'twist3D': '3D扭曲', 'roll3D': '3D翻滚', 'explode3D': '3D爆发', 'implode3D': '3D收缩',
  'spiral3D': '3D螺旋', 'wobble3D': '3D晃动', 'flipOut3D': '3D翻出', 'shake3D': '3D抖动',
  'pulse3D': '3D脉冲', 'swingWild3D': '3D狂摆', 'zoomCrazy3D': '3D狂缩', 'rotateCrazy3D': '3D狂旋',
  // 位移动画
  'dispSwing': '位移摇摆', 'dispShake': '位移抖动', 'dispBounce': '位移弹跳', 'dispScale': '位移缩放',
  'dispSlide': '位移滑动', 'dispBend': '位移弯曲', 'dispFling': '位移甩动', 'dispVibrate': '位移震动',
  'dispSway': '位移摇', 'dispLens': '位移透镜', 'dispWave': '位移波浪', 'dispTwist': '位移扭',
  'dispPulse': '位移脉冲', 'dispWobble': '位移晃', 'dispSquash': '位移挤压', 'dispZigzag': '位移锯齿',
  'dispOrbit': '位移轨道', 'dispBreath': '位移呼吸', 'dispSpiral': '位移螺旋', 'dispRipple': '位移波纹',
  // 3D位移
  'disp3DRotX': '3D位X旋', 'disp3DRotY': '3D位Y旋', 'disp3DFlip': '3D位翻转', 'disp3DWave': '3D位波浪',
  'disp3DZoom': '3D位缩放', 'disp3DPersp': '3D位透视', 'disp3DSwing': '3D位摇摆', 'disp3DBounce': '3D位弹跳',
  'disp3DTwist': '3D位扭曲', 'disp3DBreath': '3D位呼吸',
  // 两端动画
  'bothSwing': '两端摇摆', 'bothShake': '两端抖动', 'bothBounce': '两端弹跳', 'bothScale': '两端缩放',
  'bothBend': '两端弯曲', 'bothPulse': '两端脉冲', 'bothWobble': '两端晃动', 'bothOrbit': '两端轨道',
  'bothSquash': '两端挤压', 'bothTwist': '两端扭曲'
};

// 初始化漫画面板
function initComicPanel() {
  const comicGrid = document.getElementById('comicGrid');
  if (!comicGrid) return;
  
  comicGrid.innerHTML = '';
  
  let categories = [];
  let categoryAnimLists = {};
  
  if (typeof AnimPluginLoader !== 'undefined' && AnimPluginLoader.isLoaded()) {
    const presetCats = AnimPluginLoader.getPresetCategories();
    const plugins = AnimPluginLoader.getLoadedPlugins();
    
    categories = presetCats.map(cat => ({
      id: cat.id,
      name: `${cat.icon} ${cat.name}`,
      icon: cat.icon,
      type: cat.type
    }));
    
    for (const cat of presetCats) {
      const plugin = plugins[cat.id];
      if (plugin && plugin.animations) {
        categoryAnimLists[cat.id] = plugin.animations.map(a => ({
          name: a.name,
          value: a.value
        }));
      } else {
        categoryAnimLists[cat.id] = [];
      }
    }
  } else {
    const presetList = animEffects['preset'] || [];
    const catRanges = [
      { name: '📱 基础动画', start: 0, end: 21 },
      { name: '👋 动作动画', start: 21, end: 33 },
      { name: '🦵 半身动画', start: 33, end: 53 },
      { name: '💥 夸张半身', start: 53, end: 73 },
      { name: '🤪 疯狂动画', start: 73, end: 103 },
      { name: '🎲 3D动画', start: 103, end: 123 },
      { name: '🔮 位移动画', start: 123, end: 143 },
      { name: '💎 3D位移', start: 143, end: 153 },
      { name: '⚡ 两端动画', start: 153, end: presetList.length }
    ];
    
    categories = catRanges.map((r, i) => ({
      id: `cat_${i}`,
      name: r.name,
      start: r.start,
      end: r.end
    }));
    
    for (let i = 0; i < catRanges.length; i++) {
      const r = catRanges[i];
      categoryAnimLists[`cat_${i}`] = presetList.slice(r.start, r.end);
    }
  }
  
  function getAnimListByCategoryIndex(index) {
    const cat = categories[index];
    if (!cat) return [];
    if (categoryAnimLists[cat.id]) {
      return categoryAnimLists[cat.id];
    }
    return [];
  }
  
  // 已选文字块的动画列表显示区域
  const animListContainer = document.createElement('div');
  animListContainer.className = 'anim-list-container';
  animListContainer.style.cssText = 'padding:8px;border-bottom:1px solid #e2e8f0;margin-bottom:8px;';
  
  const animListHeader = document.createElement('div');
  animListHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;';
  
  const animListTitle = document.createElement('span');
  animListTitle.textContent = '当前动画';
  animListTitle.style.cssText = 'font-size:12px;font-weight:500;color:#bdbcbc;';
  
  const clearAllBtn = document.createElement('button');
  clearAllBtn.textContent = '清空';
  clearAllBtn.style.cssText = 'padding:2px 8px;font-size:11px;border:1px solid #ef4444;border-radius:4px;background:#fff;color:#ef4444;cursor:pointer;';
  clearAllBtn.addEventListener('click', function() {
    // 支持文字块、图片块、视频块
    let bId = null;
    const selectedText = document.querySelector('.text-block.selected');
    if (selectedText) {
      bId = selectedText.dataset.id;
    } else if (selectedBgImageId !== null) {
      bId = 'bg_' + selectedBgImageId;
    } else if (selectedVideoId !== null) {
      bId = 'video_' + selectedVideoId;
    }
    if (!bId) {
      showTip('请先选中文字块、图片或视频', 1500);
      return;
    }

    // 删除该块的所有动画
    if (blockAnimations[bId]) {
      blockAnimations[bId] = [];
      delete blockAnimations[bId];
    }

    // 清除块状态
    const block = getBlockElement(bId);
    if (block) {
      block.style.visibility = 'visible';
      block.style.transform = '';
      block.style.opacity = '';
      Array.from(block.classList).filter(c => c.startsWith('anim-')).forEach(cls => block.classList.remove(cls));
      stopHalfFilterAnimation(block);
    }

    if (typeof renderTimeline === 'function') renderTimeline();
    updateAnimListDisplay();
    updateAllCardsHighlight();
    showTip('已清空所有动画', 1500);
  });
  
  animListHeader.appendChild(animListTitle);
  animListHeader.appendChild(clearAllBtn);
  animListContainer.appendChild(animListHeader);
  
  const animListContent = document.createElement('div');
  animListContent.className = 'anim-list-content';
  animListContent.style.cssText = 'max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;';
  
  // 获取动画中文名
  function getAnimName(type, animValue) {
    // 先查本地中文名映射
    const localMap = {
      'weightCycle': '字重循环',
      'drawPath': '手绘路径'
    };
    if (localMap[animValue]) return localMap[animValue];
    
    if (typeof AnimPluginLoader !== 'undefined' && AnimPluginLoader.isLoaded()) {
      const name = AnimPluginLoader.getAnimName(type, animValue);
      if (name !== animValue) return name;
    }
    const effects = animEffects[type];
    if (effects) {
      const found = effects.find(e => e.value === animValue);
      if (found) return found.name;
    }
    return animValue;
  }
  
  // 删除单个动画
  function deleteSingleAnim(blockId, index) {
    if (!blockAnimations[blockId]) return;
    blockAnimations[blockId].splice(index, 1);
    if (blockAnimations[blockId].length === 0) {
      delete blockAnimations[blockId];
    }
    const block = getBlockElement(blockId);
    if (block) {
      block.style.visibility = 'visible';
      block.style.transform = '';
      block.style.opacity = '';
      Array.from(block.classList).filter(c => c.startsWith('anim-')).forEach(cls => block.classList.remove(cls));
      stopHalfFilterAnimation(block);
    }
    if (typeof renderTimeline === 'function') renderTimeline();
    updateAnimListDisplay();
    updateAllCardsHighlight();
  }
  
  // 更新动画列表显示
  function updateAnimListDisplay() {
    animListContent.innerHTML = '';
    // 支持文字块、图片块、视频块
    let bId = null;
    let isMediaBlock = false;
    let mediaBlock = null;
    const selectedText = document.querySelector('.text-block.selected');
    if (selectedText) {
      bId = selectedText.dataset.id;
    } else if (selectedBgImageId !== null) {
      bId = 'bg_' + selectedBgImageId;
      isMediaBlock = true;
      mediaBlock = bgImages.find(b => b.id === selectedBgImageId);
    } else if (selectedVideoId !== null) {
      bId = 'video_' + selectedVideoId;
      isMediaBlock = true;
      mediaBlock = videoItems.find(v => v.id === selectedVideoId);
    }
    if (!bId) {
      const emptyTip = document.createElement('span');
      emptyTip.textContent = '未选中文字块、图片或视频';
      emptyTip.style.cssText = 'font-size:12px;color:#999;padding:4px;';
      animListContent.appendChild(emptyTip);
      return;
    }

    if (!blockAnimations[bId] || blockAnimations[bId].length === 0) {
      if (isMediaBlock && mediaBlock) {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;flex-direction:column;padding:4px 6px;background:var(--color-bg-surface,#f1f5f9);border-radius:4px;font-size:12px;gap:3px;';

        const firstRow = document.createElement('div');
        firstRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:4px;';

        const leftPart = document.createElement('div');
        leftPart.style.cssText = 'display:flex;align-items:center;gap:4px;min-width:0;flex:1;';

        const typeBadge = document.createElement('span');
        typeBadge.textContent = '静态';
        typeBadge.style.cssText = 'padding:1px 4px;border-radius:3px;font-size:10px;color:#fff;flex-shrink:0;background:#94a3b8;';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = bId.startsWith('bg_') ? '图片块' : '视频块';
        nameSpan.style.cssText = 'color:var(--color-text-primary,#333);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0;';

        leftPart.appendChild(typeBadge);
        leftPart.appendChild(nameSpan);

        firstRow.appendChild(leftPart);
        item.appendChild(firstRow);

        const secondRow = document.createElement('div');
        secondRow.style.cssText = 'display:flex;align-items:center;gap:4px;flex-wrap:wrap;';

        const startLabel = document.createElement('span');
        startLabel.textContent = '开始';
        startLabel.style.cssText = 'font-size:10px;color:var(--color-text-tertiary,#999);flex-shrink:0;';

        const startInput = document.createElement('input');
        startInput.type = 'number';
        startInput.value = mediaBlock.startTime.toFixed(1);
        startInput.step = '0.5';
        startInput.min = '0';
        startInput.title = '开始时间（秒）';
        startInput.style.cssText = 'width:40px;border:1px solid #cbd5e1;border-radius:3px;padding:1px 3px;font-size:10px;text-align:center;flex-shrink:0;background:var(--color-bg-surface,#fff);color:var(--color-text-primary,#333);';
        startInput.addEventListener('change', () => {
          const newStart = Math.max(0, parseFloat(startInput.value) || 0);
          mediaBlock.startTime = newStart;
          if (typeof renderTimeline === 'function') renderTimeline();
          if (typeof updateAllCardsHighlight === 'function') updateAllCardsHighlight();
          updateAnimListDisplay();
        });

        const durLabel = document.createElement('span');
        durLabel.textContent = '持续';
        durLabel.style.cssText = 'font-size:10px;color:var(--color-text-tertiary,#999);flex-shrink:0;margin-left:4px;';

        const durInput = document.createElement('input');
        durInput.type = 'number';
        durInput.value = mediaBlock.duration.toFixed(1);
        durInput.step = '0.5';
        durInput.min = '0.5';
        durInput.title = '持续时间（秒）';
        durInput.style.cssText = 'width:40px;border:1px solid #cbd5e1;border-radius:3px;padding:1px 3px;font-size:10px;text-align:center;flex-shrink:0;background:var(--color-bg-surface,#fff);color:var(--color-text-primary,#333);';
        durInput.addEventListener('change', () => {
          const newDur = Math.max(0.5, parseFloat(durInput.value) || 1);
          mediaBlock.duration = newDur;
          if (typeof renderTimeline === 'function') renderTimeline();
          if (typeof updateAllCardsHighlight === 'function') updateAllCardsHighlight();
          updateAnimListDisplay();
        });

        secondRow.appendChild(startLabel);
        secondRow.appendChild(startInput);
        secondRow.appendChild(durLabel);
        secondRow.appendChild(durInput);

        item.appendChild(secondRow);

        animListContent.appendChild(item);
        return;
      }

      const emptyTip = document.createElement('span');
      emptyTip.textContent = '无动画';
      emptyTip.style.cssText = 'font-size:12px;color:#999;padding:4px;';
      animListContent.appendChild(emptyTip);
      return;
    }

    // 检测是否有多选动画帧
    const isMultiSelect = selectedAnimFrames && selectedAnimFrames.length > 1;
    if (isMultiSelect) {
      const multiBadge = document.createElement('div');
      multiBadge.style.cssText = 'padding:3px 8px;background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;font-size:11px;color:#92400e;margin-bottom:4px;display:flex;align-items:center;gap:4px;';
      multiBadge.textContent = `多选动画（${selectedAnimFrames.length}个）`;
      animListContent.appendChild(multiBadge);
    }

    blockAnimations[bId].forEach((anim, idx) => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;flex-direction:column;padding:4px 6px;background:var(--color-bg-surface,#f1f5f9);border-radius:4px;font-size:12px;gap:3px;';

      const firstRow = document.createElement('div');
      firstRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:4px;';

      const leftPart = document.createElement('div');
      leftPart.style.cssText = 'display:flex;align-items:center;gap:4px;min-width:0;flex:1;';

      const typeBadge = document.createElement('span');
      const modeMap = { freehand: '随意', straight: '直线', curve: '曲线' };
      const pathModeLabel = modeMap[anim.pathMode] || '随意';
      const typeLabel = anim.type === 'preset' ? '预设' : anim.type === 'in' ? '入场' : anim.type === 'out' ? '出场' : anim.type === 'weight' ? '字重' : anim.type === 'path' ? '路径(' + pathModeLabel + ')' : anim.type;
      const typeColor = anim.type === 'in' ? '#10b981' : anim.type === 'out' ? '#f43f5e' : anim.type === 'preset' ? '#6366f1' : anim.type === 'path' ? '#8b5cf6' : '#f59e0b';
      typeBadge.textContent = typeLabel;
      typeBadge.style.cssText = `padding:1px 4px;border-radius:3px;font-size:10px;color:#fff;flex-shrink:0;background:${typeColor};`;

      const nameSpan = document.createElement('span');
      nameSpan.textContent = getAnimName(anim.type, anim.anim);
      nameSpan.style.cssText = 'color:var(--color-text-primary,#333);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0;';

      leftPart.appendChild(typeBadge);
      leftPart.appendChild(nameSpan);

      const delBtn = document.createElement('button');
      delBtn.innerHTML = '×';
      delBtn.style.cssText = 'width:18px;height:18px;border:none;border-radius:3px;background:transparent;color:var(--color-text-tertiary,#999);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1;flex-shrink:0;padding:0;';
      delBtn.addEventListener('mouseenter', () => {
        delBtn.style.background = '#fecaca';
        delBtn.style.color = '#dc2626';
      });
      delBtn.addEventListener('mouseleave', () => {
        delBtn.style.background = 'transparent';
        delBtn.style.color = 'var(--color-text-tertiary,#999)';
      });
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSingleAnim(bId, idx);
      });

      firstRow.appendChild(leftPart);
      firstRow.appendChild(delBtn);
      item.appendChild(firstRow);

      const secondRow = document.createElement('div');
      secondRow.style.cssText = 'display:flex;align-items:center;gap:4px;flex-wrap:wrap;';

      const startLabel = document.createElement('span');
      startLabel.textContent = '开始';
      startLabel.style.cssText = 'font-size:10px;color:var(--color-text-tertiary,#999);flex-shrink:0;';

      const startInput = document.createElement('input');
      startInput.type = 'number';
      startInput.value = anim.startTime.toFixed(1);
      startInput.step = '0.5';
      startInput.min = '0';
      startInput.title = '开始时间（秒）';
      startInput.style.cssText = 'width:40px;border:1px solid #cbd5e1;border-radius:3px;padding:1px 3px;font-size:10px;text-align:center;flex-shrink:0;background:var(--color-bg-surface,#fff);color:var(--color-text-primary,#333);';
      startInput.addEventListener('change', () => {
        const newStart = Math.max(0, parseFloat(startInput.value) || 0);
        if (blockAnimations[bId] && blockAnimations[bId][idx]) {
          blockAnimations[bId][idx].startTime = newStart;
          blockAnimations[bId].sort((a, b) => a.startTime - b.startTime);
          if (typeof renderTimeline === 'function') renderTimeline();
          if (typeof updateAllCardsHighlight === 'function') updateAllCardsHighlight();
          updateAnimListDisplay();
        }
      });

      const durLabel = document.createElement('span');
      durLabel.textContent = '持续';
      durLabel.style.cssText = 'font-size:10px;color:var(--color-text-tertiary,#999);flex-shrink:0;margin-left:4px;';

      const durInput = document.createElement('input');
      durInput.type = 'number';
      durInput.value = anim.duration.toFixed(1);
      durInput.step = '0.5';
      durInput.min = '0.5';
      durInput.title = '持续时间（秒）';
      durInput.style.cssText = 'width:40px;border:1px solid #cbd5e1;border-radius:3px;padding:1px 3px;font-size:10px;text-align:center;flex-shrink:0;background:var(--color-bg-surface,#fff);color:var(--color-text-primary,#333);';
      durInput.addEventListener('change', () => {
        const newDur = Math.max(0.5, parseFloat(durInput.value) || 1);
        if (blockAnimations[bId] && blockAnimations[bId][idx]) {
          blockAnimations[bId][idx].duration = newDur;
          if (typeof renderTimeline === 'function') renderTimeline();
          if (typeof updateAllCardsHighlight === 'function') updateAllCardsHighlight();
        }
      });

      secondRow.appendChild(startLabel);
      secondRow.appendChild(startInput);
      secondRow.appendChild(durLabel);
      secondRow.appendChild(durInput);

      if (anim.type === 'weight') {
        const minWLabel = document.createElement('span');
        minWLabel.textContent = '最小';
        minWLabel.style.cssText = 'font-size:10px;color:var(--color-text-tertiary,#999);flex-shrink:0;margin-left:4px;';

        const minWInput = document.createElement('input');
        minWInput.type = 'number';
        minWInput.value = anim.weightAnimMin ?? 100;
        minWInput.min = '100';
        minWInput.max = '900';
        minWInput.step = '100';
        minWInput.style.cssText = 'width:38px;border:1px solid #cbd5e1;border-radius:3px;padding:1px 3px;font-size:10px;text-align:center;flex-shrink:0;background:var(--color-bg-surface,#fff);color:var(--color-text-primary,#333);';
        minWInput.addEventListener('change', () => {
          if (blockAnimations[bId] && blockAnimations[bId][idx]) {
            blockAnimations[bId][idx].weightAnimMin = parseInt(minWInput.value) || 100;
          }
        });

        const maxWLabel = document.createElement('span');
        maxWLabel.textContent = '最大';
        maxWLabel.style.cssText = 'font-size:10px;color:var(--color-text-tertiary,#999);flex-shrink:0;margin-left:4px;';

        const maxWInput = document.createElement('input');
        maxWInput.type = 'number';
        maxWInput.value = anim.weightAnimMax ?? 900;
        maxWInput.min = '100';
        maxWInput.max = '900';
        maxWInput.step = '100';
        maxWInput.style.cssText = 'width:38px;border:1px solid #cbd5e1;border-radius:3px;padding:1px 3px;font-size:10px;text-align:center;flex-shrink:0;background:var(--color-bg-surface,#fff);color:var(--color-text-primary,#333);';
        maxWInput.addEventListener('change', () => {
          if (blockAnimations[bId] && blockAnimations[bId][idx]) {
            blockAnimations[bId][idx].weightAnimMax = parseInt(maxWInput.value) || 900;
          }
        });

        const speedLabel = document.createElement('span');
        speedLabel.textContent = '速度';
        speedLabel.style.cssText = 'font-size:10px;color:var(--color-text-tertiary,#999);flex-shrink:0;margin-left:4px;';

        const speedInput = document.createElement('input');
        speedInput.type = 'number';
        speedInput.value = anim.weightAnimSpeed ?? 1;
        speedInput.min = '0.1';
        speedInput.max = '10';
        speedInput.step = '0.1';
        speedInput.style.cssText = 'width:32px;border:1px solid #cbd5e1;border-radius:3px;padding:1px 3px;font-size:10px;text-align:center;flex-shrink:0;background:var(--color-bg-surface,#fff);color:var(--color-text-primary,#333);';
        speedInput.addEventListener('change', () => {
          if (blockAnimations[bId] && blockAnimations[bId][idx]) {
            blockAnimations[bId][idx].weightAnimSpeed = parseFloat(speedInput.value) || 1;
          }
        });

        secondRow.appendChild(minWLabel);
        secondRow.appendChild(minWInput);
        secondRow.appendChild(maxWLabel);
        secondRow.appendChild(maxWInput);
        secondRow.appendChild(speedLabel);
        secondRow.appendChild(speedInput);
      }

      if (anim.type === 'path') {
        const pathMode = anim.pathMode || 'freehand';
        const pathModeLabels = { freehand: '随意', straight: '直线', curve: '曲线' };

        const modeLabel = document.createElement('span');
        modeLabel.textContent = '模式';
        modeLabel.style.cssText = 'font-size:10px;color:var(--color-text-tertiary,#999);flex-shrink:0;margin-left:4px;';

        const modeSpan = document.createElement('span');
        modeSpan.textContent = pathModeLabels[pathMode] || pathMode;
        modeSpan.style.cssText = 'font-size:10px;color:#3b82f6;font-weight:500;flex-shrink:0;';

        const pointsCount = anim.path && anim.path.length ? anim.path.length : 0;
        const pointsLabel = document.createElement('span');
        pointsLabel.textContent = `点数:${pointsCount}`;
        pointsLabel.style.cssText = 'font-size:10px;color:var(--color-text-tertiary,#999);flex-shrink:0;margin-left:4px;';

        secondRow.appendChild(modeLabel);
        secondRow.appendChild(modeSpan);
        secondRow.appendChild(pointsLabel);
      }

      item.appendChild(secondRow);
      animListContent.appendChild(item);
    });
  }
  
  animListContainer.appendChild(animListContent);
  
  // 分类标签栏（水平滚动）
  const tabsWrapper = document.createElement('div');
  tabsWrapper.style.cssText = 'display:flex;align-items:center;padding:6px 0;border-bottom:1px solid #e2e8f0;margin-bottom:8px;';
  
  const leftArrow = document.createElement('button');
  leftArrow.innerHTML = '◀';
  leftArrow.style.cssText = 'width:24px;height:24px;border:1px solid #e2e8f0;border-radius:4px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;flex-shrink:0;';
  leftArrow.addEventListener('click', () => {
    tabsContainer.scrollBy({ left: -100, behavior: 'smooth' });
  });
  
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'comic-tabs';
  tabsContainer.style.cssText = 'display:flex;gap:4px;padding:0 6px;overflow-x:auto;flex:1;scrollbar-width:none;-ms-overflow-style:none;';
  tabsContainer.style.scrollbarWidth = 'none';
  tabsContainer.addEventListener('scroll', updateArrowVisibility);
  
  const rightArrow = document.createElement('button');
  rightArrow.innerHTML = '▶';
  rightArrow.style.cssText = 'width:24px;height:24px;border:1px solid #e2e8f0;border-radius:4px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;flex-shrink:0;';
  rightArrow.addEventListener('click', () => {
    tabsContainer.scrollBy({ left: 100, behavior: 'smooth' });
  });
  
  function updateArrowVisibility() {
    leftArrow.style.opacity = tabsContainer.scrollLeft > 0 ? '1' : '0.3';
    rightArrow.style.opacity = tabsContainer.scrollLeft < tabsContainer.scrollWidth - tabsContainer.clientWidth - 1 ? '1' : '0.3';
  }
  
  tabsWrapper.appendChild(leftArrow);
  tabsWrapper.appendChild(tabsContainer);
  tabsWrapper.appendChild(rightArrow);
  
  // 卡片网格容器
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'comic-cards-container';
  cardsContainer.style.cssText = 'display:grid;grid-template-columns:repeat(3, 1fr);gap:6px;padding:0 8px 8px;flex:1;overflow-y:auto;max-height:100%;align-content:start;';
  
  let currentCategoryIndex = 0;
  
  function renderCategory(index) {
    currentCategoryIndex = index;
    const category = categories[index];
    if (!category) return;
    
    // 更新标签样式
    const tabs = tabsContainer.querySelectorAll('.comic-tab');
    tabs.forEach((tab, i) => {
      if (i === index) {
        tab.classList.add('active');
        tab.style.cssText = 'padding:4px 8px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;cursor:pointer;background:#3b82f6;color:#fff;white-space:nowrap;';
      } else {
        tab.classList.remove('active');
        tab.style.cssText = 'padding:4px 8px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;cursor:pointer;background:#fff;color:#333;white-space:nowrap;';
      }
    });
    
    // 渲染该分类的动画卡片
    cardsContainer.innerHTML = '';
    
    const animList = getAnimListByCategoryIndex(index);
    for (let i = 0; i < animList.length; i++) {
      const effect = animList[i];
      const animName = effect.value;
      const animDisplayName = effect.name;
      
      const card = document.createElement('div');
      card.className = 'comic-card';
      card.dataset.anim = animName;
      card.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;padding:2px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;transition:all 0.2s;user-select:none;height:70px;flex-shrink:0;';
      
      // 预览区域
      const preview = document.createElement('div');
      preview.className = 'comic-preview';
      preview.style.cssText = 'width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden;';

      // 普通动画预览文字（单字）
      const previewText = ['殷', '墟', '甲', '骨', '绚', '丽', '文', '字'];
      // 多字动画预览文字（词组）- 用于打散等逐字符动画
      // 定义：动画JSON中设置 perChar=true 的动画即为"多字动画"
      // 所有多字动画统一使用以下预览文字词组，按卡片索引循环显示
      const previewTextMultiChar = ['甲骨文', '绚丽文字', '简体繁体', '殷墟甲骨', '绽光芒', '乐乐乐', '文承岁月', '象形会意', '情不朽', '镂骨铭魂', '社稷彰', '买买买'];

      // 检查是否为 perChar 多字动画
      let perCharPreviewCfg = null;
      if (typeof AnimPluginLoader !== 'undefined' && AnimPluginLoader.isLoaded()) {
        const animInfo = AnimPluginLoader.getAnimationByName(animName);
        if (animInfo && animInfo.perChar) {
          perCharPreviewCfg = {
            scatter: animInfo.scatter || 50,
            scatterMode: animInfo.scatterMode || 'radial',
            duration: parseFloat(animInfo.defaultDuration) || 1.5
          };
        }
      }

      const previewChars = []; // 存储预览字符span
      if (perCharPreviewCfg) {
        // 多字动画预览：从词组列表中随机选一个词组显示
        const word = previewTextMultiChar[i % previewTextMultiChar.length];
        const chars = Array.from(word); // 拆分成单个字符
        chars.forEach(ch => {
          const s = document.createElement('span');
          s.className = 'preview-char';
          s.textContent = ch;
          s.style.cssText = 'font-size:18px;font-weight:normal;color:#fff;display:inline-block;font-family:XXOBS-VF;';
          preview.appendChild(s);
          previewChars.push(s);
        });
      } else {
        const char = document.createElement('span');
        char.className = 'char';
        char.textContent = previewText[i % 8];
        char.style.cssText = 'font-size:32px;font-weight:normal;color:#fff;font-family:XXOBS-VF;';
        preview.appendChild(char);
      }
      
      // 动画名称
      const name = document.createElement('div');
      name.className = 'comic-name';
      name.textContent = animDisplayName;
      name.style.cssText = 'width:100%;font-size:11px;color:#64748b;text-align:center;line-height:1.2;padding:4px 0;user-select:none;';
      
      card.appendChild(preview);
      card.appendChild(name);
      
      // 鼠标悬停预览
      let previewRafId = null;
      card.addEventListener('mouseenter', function() {
        if (perCharPreviewCfg) {
          // 逐字符打散预览：用 JS 动画
          const chars = previewChars;
          const total = chars.length;
          const startTime = performance.now();
          const duration = perCharPreviewCfg.duration * 1000;
          const pi2 = Math.PI * 2;

          function animatePreview(now) {
            const elapsed = now - startTime;
            const progress = (elapsed % duration) / duration;

            chars.forEach((span, idx) => {
              const halfTotal = Math.max(1, total - 1) / 2;
              const centerOffset = idx - halfTotal;
              let scatterFactor;
              if (progress < 0.5) scatterFactor = progress * 2;
              else scatterFactor = (1 - progress) * 2;

              let dx = 0, dy = 0, dr = 0, dScale = 1, dOpacity = 1;
              const scatter = perCharPreviewCfg.scatter * 0.5; // 预览缩小范围
              const mode = perCharPreviewCfg.scatterMode;

              if (mode === 'radial') {
                const angle = (idx / Math.max(1, total)) * pi2;
                dx = Math.cos(angle) * scatter * scatterFactor;
                dy = Math.sin(angle) * scatter * scatterFactor;
                dr = (centerOffset / halfTotal) * 30 * scatterFactor;
              } else if (mode === 'vertical') {
                const dir = idx % 2 === 0 ? -1 : 1;
                dy = dir * scatter * scatterFactor;
                dr = dir * 15 * scatterFactor;
              } else if (mode === 'horizontal') {
                const dir = idx % 2 === 0 ? -1 : 1;
                dx = dir * scatter * scatterFactor;
                dr = dir * 10 * scatterFactor;
              } else if (mode === 'wave') {
                const phase = (idx / Math.max(1, total)) * pi2;
                dy = Math.sin(phase + progress * pi2) * scatter * scatterFactor;
                dr = Math.sin(phase + progress * pi2 * 2) * 20 * scatterFactor;
              } else if (mode === 'diagonal') {
                const dir = idx % 2 === 0 ? 1 : -1;
                dx = dir * scatter * scatterFactor;
                dy = -dir * scatter * 0.7 * scatterFactor;
                dr = dir * 20 * scatterFactor;
              } else if (mode === 'spiral') {
                const angle = (idx / Math.max(1, total)) * pi2 * 2 + progress * pi2 * 2;
                const radius = scatter * scatterFactor;
                dx = Math.cos(angle) * radius;
                dy = Math.sin(angle) * radius;
                dr = 360 * progress * (centerOffset / halfTotal);
              } else if (mode === 'bounce') {
                const bouncePhase = (progress + idx / Math.max(1, total) * 0.3) * pi2;
                dy = -Math.abs(Math.sin(bouncePhase)) * scatter * scatterFactor;
                dScale = 1 + 0.1 * Math.sin(bouncePhase) * scatterFactor;
              } else if (mode === 'random') {
                const seed = idx * 137.5;
                const angle = (seed % 360) * (Math.PI / 180);
                dx = Math.cos(angle) * scatter * scatterFactor;
                dy = Math.sin(angle) * scatter * scatterFactor;
                dr = ((seed % 60) - 30) * scatterFactor;
                dScale = 1 + ((seed % 40) - 20) / 100 * scatterFactor;
              } else if (mode === 'implode') {
                const implodeFactor = 1 - scatterFactor;
                const angle = (idx / Math.max(1, total)) * pi2;
                dx = Math.cos(angle) * scatter * implodeFactor;
                dy = Math.sin(angle) * scatter * implodeFactor;
                dr = (centerOffset / halfTotal) * 30 * implodeFactor;
                dScale = 1 + 0.2 * implodeFactor * (centerOffset / halfTotal);
              } else if (mode === 'stagger') {
                const staggerOffset = idx / Math.max(1, total);
                let localProgress = (progress * 2 + staggerOffset) % 1;
                let localFactor = localProgress < 0.5 ? localProgress * 2 : (1 - localProgress) * 2;
                const angle = (idx / Math.max(1, total)) * pi2;
                dx = Math.cos(angle) * scatter * localFactor;
                dy = Math.sin(angle) * scatter * localFactor;
                dr = (centerOffset / halfTotal) * 30 * localFactor;
              } else if (mode === 'rain') {
                dy = scatter * scatterFactor;
                dx = (centerOffset / halfTotal) * 10 * scatterFactor;
                dr = (centerOffset / halfTotal) * 20 * scatterFactor;
              }

              span.style.transform = `translate(${dx}px, ${dy}px) scale(${dScale}) rotate(${dr}deg)`;
              span.style.opacity = dOpacity;
            });

            previewRafId = requestAnimationFrame(animatePreview);
          }
          previewRafId = requestAnimationFrame(animatePreview);
        } else {
          // 普通动画预览：用 CSS animation
          const char = preview.querySelector('.char');
          if (char) {
            char.style.animation = 'none';
            void char.offsetWidth;
            let cssAnim = animName;
            if (animName.startsWith('disp') || animName.startsWith('both')) {
              const mapping = {
                'dispSwing': 'swing', 'dispShake': 'shake', 'dispBounce': 'bounce', 'dispScale': 'pulse',
                'dispSlide': 'slide', 'dispBend': 'swing', 'dispFling': 'dash', 'dispVibrate': 'vibrate',
                'dispSway': 'sway', 'dispLens': 'zoom', 'dispWave': 'wave', 'dispTwist': 'twist3D',
                'dispPulse': 'pulse', 'dispWobble': 'shake', 'dispSquash': 'bounce', 'dispZigzag': 'swing',
                'dispOrbit': 'swing', 'dispBreath': 'breathe', 'dispSpiral': 'swing', 'dispRipple': 'wave',
                'disp3DRotX': 'swing3D', 'disp3DRotY': 'swing3D', 'disp3DFlip': 'flip3D',
                'disp3DWave': 'wave', 'disp3DZoom': 'zoom3D', 'disp3DPersp': 'swing3D',
                'disp3DSwing': 'swing3D', 'disp3DBounce': 'bounce3D', 'disp3DTwist': 'twist3D', 'disp3DBreath': 'bounce3D',
                'bothSwing': 'swing', 'bothShake': 'shake', 'bothBounce': 'bounce', 'bothScale': 'pulse',
                'bothBend': 'swing', 'bothPulse': 'pulse', 'bothWobble': 'shake', 'bothOrbit': 'swing',
                'bothSquash': 'bounce', 'bothTwist': 'twist3D'
              };
              cssAnim = mapping[animName] || 'swing';
            }
            const dur = typeof getDefaultAnimationDuration === 'function'
              ? getDefaultAnimationDuration(animName)
              : 0.6;
            char.style.animation = `${cssAnim} ${dur}s ease infinite`;
          }
        }
        if (!card.classList.contains('active')) {
          card.style.borderColor = '#3b82f6';
          card.style.boxShadow = '0 2px 8px rgba(59,130,246,0.2)';
        }
      });

      card.addEventListener('mouseleave', function() {
        if (previewRafId) {
          cancelAnimationFrame(previewRafId);
          previewRafId = null;
        }
        if (perCharPreviewCfg) {
          previewChars.forEach(span => {
            span.style.transform = '';
            span.style.opacity = '';
          });
        } else {
          const char = preview.querySelector('.char');
          if (char) char.style.animation = 'none';
        }
        if (!card.classList.contains('active')) {
          card.style.borderColor = '#e2e8f0';
          card.style.boxShadow = 'none';
        }
      });
      
      // 检查当前块是否已有此动画
      function isAnimExists(bId) {
        if (!blockAnimations[bId]) return false;
        return blockAnimations[bId].some(a => a.type === 'preset' && a.anim === animName);
      }
      
      // 更新卡片高亮状态
      function updateCardHighlight(bId) {
        if (isAnimExists(bId)) {
          card.classList.add('active');
          card.style.border = '2px solid #3b82f6';
          card.style.background = '#dbeafe';
          card.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)';
          card.style.transform = 'scale(1.02)';
        } else {
          card.classList.remove('active');
          card.style.border = '1px solid #e2e8f0';
          card.style.background = '';
          card.style.boxShadow = 'none';
          card.style.transform = '';
        }
      }
      
      // 点击添加/删除动画
      card.addEventListener('click', function(e) {
        // 支持文字块、图片块、视频块
        let selectedBlock = document.querySelector('.text-block.selected');
        let bId = null;
        if (selectedBlock) {
          bId = selectedBlock.dataset.id;
        } else if (selectedBgImageId !== null) {
          bId = 'bg_' + selectedBgImageId;
          selectedBlock = document.querySelector(`.bg-image-item[data-id="${selectedBgImageId}"]`);
        } else if (selectedVideoId !== null) {
          bId = 'video_' + selectedVideoId;
          selectedBlock = document.querySelector(`.video-item[data-id="${selectedVideoId}"]`);
        }
        if (!selectedBlock || !bId) {
          if (typeof showTip === 'function') {
            showTip('请先在展示区选中要添加动画的文字块、图片或视频', 2000);
          } else {
            alert('请先在展示区选中要添加动画的文字块、图片或视频');
          }
          return;
        }
        
        // 获取当前时间轴位置
        let currentTime = currentTimelineTime || 0;
        const isShiftPressed = e && e.shiftKey;
        const isCtrlPressed = e && (e.ctrlKey || e.metaKey);

        if (typeof addAnimToBlock === 'function') {
          // 如果正在播放，先停止
          if (typeof isPlaying !== 'undefined' && isPlaying) {
            const playBtn = document.getElementById('playKeyframesBtn');
            if (playBtn) triggerClickNoBubble(playBtn);
          }

          if (isCtrlPressed) {
            // Ctrl+点击：在原有动画后面追加新动画（不替换）
            if (!blockAnimations[bId]) {
              blockAnimations[bId] = [];
            }
            // 计算已有动画的最后结束时间
            let appendTime = 0;
            if (blockAnimations[bId].length > 0) {
              appendTime = Math.max(...blockAnimations[bId].map(a => a.startTime + a.duration));
            }
            const animDur = (typeof getDefaultAnimationDuration === 'function')
              ? getDefaultAnimationDuration(animName)
              : 2;
            blockAnimations[bId].push({
              type: 'preset',
              anim: animName,
              startTime: appendTime,
              duration: animDur
            });
            // 确保文字块显示
            const block = getBlockElement(bId);
            if (block) {
              block.style.visibility = 'visible';
            }
            if (typeof renderTimeline === 'function') renderTimeline();
            if (typeof showTip === 'function') {
              showTip(`已追加动画: ${animDisplayName}（开始于 ${appendTime.toFixed(1)}s）`, 2000);
            }
          } else if (isShiftPressed) {
            // Shift+点击：多选模式 - 已有则删除，没有则添加
            if (isAnimExists(bId)) {
              // 删除该动画
              if (blockAnimations[bId]) {
                const idx = blockAnimations[bId].findIndex(a => a.type === 'preset' && a.anim === animName);
                if (idx !== -1) {
                  blockAnimations[bId].splice(idx, 1);
                  // 删除后如果没有动画了，保留文字块显示
                  if (blockAnimations[bId].length === 0) {
                    const block = getBlockElement(bId);
                    if (block) {
                      block.style.visibility = 'visible';
                      block.style.transform = '';
                      block.style.opacity = '';
                      Array.from(block.classList).filter(c => c.startsWith('anim-')).forEach(cls => block.classList.remove(cls));
                      stopHalfFilterAnimation(block);
                    }
                    delete blockAnimations[bId];
                  }
                  if (typeof renderTimeline === 'function') renderTimeline();
                  if (typeof showTip === 'function') {
                    showTip(`已删除动画: ${animDisplayName}`, 1500);
                  }
                }
              }
            } else {
              // 添加动画（多选追加）
              addAnimToBlock(bId, 'preset', animName, currentTime);
              if (typeof showTip === 'function') {
                showTip(`已添加动画: ${animDisplayName}（多选模式）`, 1500);
              }
            }
          } else {
            // 普通点击：替换模式 - 移除所有其他预设动画，只保留当前点击的
            if (!blockAnimations[bId]) {
              blockAnimations[bId] = [];
            }
            
            // 移除非当前动画的所有预设动画
            blockAnimations[bId] = blockAnimations[bId].filter(a => {
              if (a.type !== 'preset') return true; // 保留入场/出场等其他类型
              return a.anim === animName;
            });
            
            // 如果没有这个动画，添加它
            if (!isAnimExists(bId)) {
              const newAnim = {
                type: 'preset',
                anim: animName,
                startTime: currentTime,
                duration: 2
              };
              blockAnimations[bId].push(newAnim);
            }
            
            // 确保文字块显示
            const block = getBlockElement(bId);
            if (block) {
              block.style.visibility = 'visible';
            }

            if (typeof renderTimeline === 'function') renderTimeline();
            if (typeof showTip === 'function') {
              showTip(`已替换动画为: ${animDisplayName}`, 1500);
            }
          }
          
          // 播放动画
          const playBtn = document.getElementById('playKeyframesBtn');
          if (playBtn) triggerClickNoBubble(playBtn);
          
          // 更新所有卡片高亮和动画列表
          updateAllCardsHighlight();
          updateAnimListDisplay();
        } else {
          console.error('addAnimToBlock 函数未定义');
        }
      });
      
      cardsContainer.appendChild(card);
    }
    
    // 渲染完成后更新所有卡片高亮和动画列表
    updateAllCardsHighlight();
    updateAnimListDisplay();
    
    // 更新箭头可见性
    setTimeout(updateArrowVisibility, 0);
  }
  
  // 更新所有卡片的高亮状态
  function updateAllCardsHighlight() {
    // 支持文字块、图片块、视频块
    let bId = null;
    const selectedText = document.querySelector('.text-block.selected');
    if (selectedText) {
      bId = selectedText.dataset.id;
    } else if (selectedBgImageId !== null) {
      bId = 'bg_' + selectedBgImageId;
    } else if (selectedVideoId !== null) {
      bId = 'video_' + selectedVideoId;
    }
    if (!bId) {
      // 没有选中块，所有卡片取消高亮
      cardsContainer.querySelectorAll('.comic-card').forEach(c => {
        c.classList.remove('active');
        c.style.border = '1px solid #e2e8f0';
        c.style.background = '';
        c.style.boxShadow = 'none';
        c.style.transform = '';
      });
      return;
    }

    if (!blockAnimations[bId]) {
      // 没有动画，全部取消高亮
      cardsContainer.querySelectorAll('.comic-card').forEach(c => {
        c.classList.remove('active');
        c.style.border = '1px solid #e2e8f0';
        c.style.background = '';
        c.style.boxShadow = 'none';
        c.style.transform = '';
      });
      return;
    }
    
    cardsContainer.querySelectorAll('.comic-card').forEach(card => {
      const animName = card.dataset.anim;
      const hasAnim = blockAnimations[bId].some(a => a.type === 'preset' && a.anim === animName);
      if (hasAnim) {
        card.classList.add('active');
        card.style.border = '2px solid #3b82f6';
        card.style.background = '#dbeafe';
        card.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)';
        card.style.transform = 'scale(1.02)';
      } else {
        card.classList.remove('active');
        card.style.border = '1px solid #e2e8f0';
        card.style.background = '';
        card.style.boxShadow = 'none';
        card.style.transform = '';
      }
    });
  }
  
  // 创建分类标签
  categories.forEach((cat, index) => {
    const tab = document.createElement('div');
    tab.className = 'comic-tab';
    tab.textContent = cat.name;
    tab.style.cssText = index === 0 
      ? 'padding:4px 8px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;cursor:pointer;background:#3b82f6;color:#fff;white-space:nowrap;'
      : 'padding:4px 8px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;cursor:pointer;background:#fff;color:#333;white-space:nowrap;';
    
    tab.addEventListener('click', () => renderCategory(index));
    tabsContainer.appendChild(tab);
  });
  
  comicGrid.style.display = 'flex';
  comicGrid.style.flexDirection = 'column';
  comicGrid.style.height = '100%';
  comicGrid.style.overflowY = 'auto';
  comicGrid.appendChild(animListContainer);
  comicGrid.appendChild(tabsWrapper);
  comicGrid.appendChild(cardsContainer);
  
  // 默认渲染第一个分类
  renderCategory(0);
  
  // 暴露 updateAllCardsHighlight 和 updateAnimListDisplay 到 window，供外部调用
  window.updateComicCardsHighlight = updateAllCardsHighlight;
  window.updateAnimListDisplay = updateAnimListDisplay;
  
  // 监听选中块变化，更新卡片高亮和动画列表
  const selectedObserver = new MutationObserver(() => {
    if (typeof window.updateComicCardsHighlight === 'function') {
      window.updateComicCardsHighlight();
    }
    if (typeof window.updateAnimListDisplay === 'function') {
      window.updateAnimListDisplay();
    }
  });
  
  // 监听整个 blocksContainer 的子树变化
  const blocksContainer = document.getElementById('blocksContainer');
  if (blocksContainer) {
    selectedObserver.observe(blocksContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }
  // 也监听图片块和视频块容器的选择状态变化
  const bgImagesContainer = document.getElementById('bgImagesContainer');
  if (bgImagesContainer) {
    selectedObserver.observe(bgImagesContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }
  const videosContainer = document.getElementById('videosContainer');
  if (videosContainer) {
    selectedObserver.observe(videosContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }
}

// 页面加载完成后，自动加载字漫画列表
// 全局时间轴拖动监听器
document.addEventListener('mousemove', handleTimelineDragMouseMove);
document.addEventListener('mouseup', handleTimelineDragMouseUp);

window.addEventListener('load', () => {
  if (typeof init === 'function') {
    init();
  }
  if (typeof loadZimanhuaList === 'function') {
    loadZimanhuaList();
  }
});
