import Storage from './storage.js';
import TapDetector from './detector.js';
import { TapRecognizer, PATTERNS } from './recognizer.js';
import { RotationDetector, RotationRecognizer, ROTATION_PATTERNS } from './rotationDetector.js';
import CommandExecutor from './executor.js';
import * as UI from './ui.js';

// ===== APP STATE =====
const state = {
  currentTab: 'home',
  tapCount: 0,
  isListening: false,
  onboardingStep: 0,
  trainingStage: 0,
  trainingTapCount: 0
};

const trainingStages = [
  { name: '单击', pattern: 'single', taps: 1 },
  { name: '双击', pattern: 'double', taps: 2 },
  { name: '三连击', pattern: 'triple', taps: 3 },
  { name: '长短', pattern: 'longShort', taps: 2 }
];

// ===== INIT =====
let detector, recognizer, executor, rotationDetector, rotationRecognizer;

async function init() {
  const data = Storage.getData();

  // Show onboarding if not completed
  if (!data.onboardingCompleted) {
    showOnboarding();
  }

  // Init core modules
  detector = new TapDetector({
    threshold: data.settings.sensitivity,
    onTap: handleTap,
    onData: handleMotionData
  });
  detector.initCanvas('waveCanvas');

  recognizer = new TapRecognizer({
    onPattern: handlePattern,
    onPartial: handlePartial,
    onTimeout: handleTimeout
  });

  // Init rotation detector
  rotationDetector = new RotationDetector({
    onRotation: handleRotation
  });
  rotationRecognizer = new RotationRecognizer({
    onPattern: handleRotationPattern
  });

  executor = new CommandExecutor({
    onFeedback: showFeedback
  });

  // Start listening
  const started = await detector.start();
  state.isListening = started;

  // Render UI
  renderTab('home');
  setupEventListeners();
}

// ===== EVENT HANDLERS =====

function handleTap(tapData) {
  state.tapCount++;
  executor.playTap();
  executor.vibrate([20]);
  recognizer.addTap(tapData);
  updateHomeUI();
}

function handleMotionData(magnitude) {
  // Data is handled by detector's canvas draw loop
}

function handlePattern(pattern) {
  const result = executor.execute(pattern.key);
  if (result) {
    Storage.addHistory(result.action, pattern.name, result.savedSeconds);
    refreshCurrentTab();
  }
}

function handlePartial(sequence) {
  // Could show partial feedback (e.g., "检测到 2 次敲击...")
}

function handleTimeout(sequence) {
  showFeedback({
    type: 'error',
    title: '未识别',
    desc: `检测到 ${sequence.length} 次敲击，但无法匹配已知模式`,
    icon: 'alert'
  });
}

function handleRotation(rotationData) {
  executor.playTap();
  const pattern = rotationRecognizer.recognize(rotationData);
  if (pattern) {
    handleRotationPattern(pattern);
  }
}

function handleRotationPattern(pattern) {
  const result = executor.execute(pattern.key);
  if (result) {
    Storage.addHistory(result.action, pattern.name, result.savedSeconds);
    refreshCurrentTab();
  }
}

function showFeedback(feedback) {
  // Remove existing toast
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toastHTML = UI.renderToast(feedback);
  document.body.insertAdjacentHTML('beforeend', toastHTML);

  const toast = document.getElementById('toast');
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// ===== TAB RENDERING =====

function renderTab(tabName) {
  state.currentTab = tabName;

  // Update tab bar
  document.querySelectorAll('.tab-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabName);
  });

  // Update pages
  document.querySelectorAll('.tab-page').forEach(el => {
    el.classList.toggle('active', el.id === `tab-${tabName}`);
  });

  // Render content
  const container = document.getElementById(`tab-${tabName}`);
  switch (tabName) {
    case 'home':
      container.innerHTML = UI.renderHome(state, state.tapCount);
      detector.initCanvas('waveCanvas');
      setupHomeListeners();
      break;
    case 'commands':
      container.innerHTML = UI.renderCommands();
      setupCommandListeners();
      break;
    case 'training':
      container.innerHTML = UI.renderTraining();
      setupTrainingListeners();
      break;
    case 'settings':
      container.innerHTML = UI.renderSettings();
      setupSettingsListeners();
      break;
  }
}

function refreshCurrentTab() {
  renderTab(state.currentTab);
}

function updateHomeUI() {
  if (state.currentTab === 'home') {
    const sub = document.querySelector('.status-sub');
    if (sub) sub.textContent = `已检测到 ${state.tapCount} 次敲击`;
  }
}

// ===== SETUP LISTENERS =====

function setupEventListeners() {
  // Tab bar
  document.querySelectorAll('.tab-item').forEach(el => {
    el.addEventListener('click', () => renderTab(el.dataset.tab));
  });
}

function setupHomeListeners() {
  // Virtual tap buttons
  document.querySelectorAll('.vtap-btn[data-sim]').forEach(btn => {
    btn.addEventListener('click', () => {
      const simType = btn.dataset.sim;
      simulatePattern(simType);
    });
  });
  // Virtual rotation buttons
  document.querySelectorAll('.vtap-btn[data-rot]').forEach(btn => {
    btn.addEventListener('click', () => {
      const rotType = btn.dataset.rot;
      simulateRotation(rotType);
    });
  });
}

function setupCommandListeners() {
  document.querySelectorAll('.command-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.exec;
      const result = executor.execute(key);
      if (result) {
        Storage.addHistory(result.action, PATTERNS[key]?.name || key, result.savedSeconds);
        refreshCurrentTab();
      }
    });
  });
}

function setupTrainingListeners() {
  const target = document.getElementById('tapTarget');
  if (!target) return;

  target.addEventListener('click', () => {
    target.classList.add('tapped');
    setTimeout(() => target.classList.remove('tapped'), 500);

    const stage = trainingStages[state.trainingStage];
    state.trainingTapCount++;

    // Simulate tap for recognizer
    detector.simulateTap();

    if (state.trainingTapCount >= stage.taps) {
      // Move to next stage
      state.trainingStage = (state.trainingStage + 1) % trainingStages.length;
      state.trainingTapCount = 0;
      updateTrainingUI();
    }
  });
}

function updateTrainingUI() {
  const stage = trainingStages[state.trainingStage];
  const label = document.getElementById('stageLabel');
  if (label) label.textContent = stage.name;

  const dots = document.querySelectorAll('.progress-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i <= state.trainingStage);
  });
}

function setupSettingsListeners() {
  // Sensitivity slider
  const slider = document.getElementById('sensitivitySlider');
  const valueLabel = document.getElementById('sensitivityValue');
  if (slider) {
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      valueLabel.textContent = val + 'g';
      Storage.updateSettings('sensitivity', val);
      if (detector) detector.setThreshold(val);
    });
  }

  // Sound toggle
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      const on = soundToggle.classList.toggle('on');
      Storage.updateSettings('soundEnabled', on);
    });
  }

  // Haptic toggle
  const hapticToggle = document.getElementById('hapticToggle');
  if (hapticToggle) {
    hapticToggle.addEventListener('click', () => {
      const on = hapticToggle.classList.toggle('on');
      Storage.updateSettings('hapticEnabled', on);
    });
  }

  // Reset data
  const resetBtn = document.getElementById('resetDataBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('确定要重置所有数据吗？')) {
        Storage.resetData();
        state.tapCount = 0;
        refreshCurrentTab();
        showFeedback({
          type: 'success',
          title: '已重置',
          desc: '所有数据已清除',
          icon: 'check'
        });
      }
    });
  }
}

// ===== SIMULATION =====

function simulatePattern(type) {
  const delays = {
    single: [0],
    double: [0, 200],
    triple: [0, 200, 200],
    longShort: [0, 550]
  };

  const seq = delays[type] || [0];
  seq.forEach((delay, i) => {
    setTimeout(() => {
      detector.simulateTap();
    }, delay);
  });
}

function simulateRotation(type) {
  const configs = {
    cw: { direction: 'cw', degrees: 90 },
    ccw: { direction: 'ccw', degrees: 90 },
    cw1: { direction: 'cw', degrees: 360 },
    ccw1: { direction: 'ccw', degrees: 360 },
    cw2: { direction: 'cw', degrees: 720 },
    ccwHalf: { direction: 'ccw', degrees: 180 }
  };

  const config = configs[type];
  if (config) {
    rotationDetector.simulateRotation(config.direction, config.degrees);
  }
}

// ===== ONBOARDING =====

function showOnboarding() {
  const html = UI.renderOnboarding();
  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('onboardingNext').addEventListener('click', () => setOnboardingStep(1));
  document.getElementById('onboardingSimTap').addEventListener('click', () => {
    detector.simulateTap();
    setTimeout(() => setOnboardingStep(2), 800);
  });
  document.getElementById('onboardingDone').addEventListener('click', () => {
    Storage.completeOnboarding();
    document.getElementById('onboarding').classList.add('hidden');
  });
}

function setOnboardingStep(step) {
  state.onboardingStep = step;
  document.querySelectorAll('.onboarding-step').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.step) === step);
  });
  document.querySelectorAll('.onboarding-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === step);
  });
}

// ===== CALL OVERLAY =====
function setupCallOverlay() {
  const html = UI.renderCallOverlay();
  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('callDecline').addEventListener('click', () => {
    executor.rejectCall();
  });

  document.getElementById('callAccept').addEventListener('click', () => {
    executor.hideCallOverlay();
    showFeedback({
      type: 'success',
      title: '已接听',
      desc: '通话已开始',
      icon: 'phone'
    });
  });
}

// ===== START =====
document.addEventListener('DOMContentLoaded', () => {
  init();
  setupCallOverlay();
});
