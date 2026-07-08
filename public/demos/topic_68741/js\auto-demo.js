window.autoDemoRunning = false;
window.autoDemoTimer = null;
window.autoDemoIndex = 0;

window.autoDemoSteps = [
  {
    page: 'home',
    duration: 3500,
    name: '首页',
    soundHighlight: null
  },
  {
    page: 'category',
    duration: 3000,
    name: '识字分类',
    soundHighlight: null
  },
  {
    page: 'grid',
    duration: 3000,
    name: '卡片网格',
    soundHighlight: null
  },
  {
    page: 'detail',
    duration: 5000,
    name: '卡片详情',
    soundHighlight: 'spell',
    audioType: 'spell',
    audioPinyin: 'shān',
    audioChar: '山',
    delay: 800
  },
  {
    page: 'exercise',
    duration: 3000,
    name: '练习中心',
    soundHighlight: null
  },
  {
    page: 'quiz',
    duration: 4500,
    name: '答题练习',
    soundHighlight: 'slow',
    audioType: 'pinyin',
    audioPinyin: 'shuǐ',
    delay: 1000
  },
  {
    page: 'storybook',
    duration: 5000,
    name: '课本绘本',
    soundHighlight: 'sentence',
    audioType: 'sentence',
    audioText: '远处有一座高山。',
    delay: 1000
  },
  {
    page: 'progress',
    duration: 3000,
    name: '学习进度',
    soundHighlight: null
  }
];

window.toggleAutoDemo = function() {
  if (window.autoDemoRunning) {
    stopAutoDemo();
  } else {
    startAutoDemo();
  }
};

function startAutoDemo() {
  window.autoDemoRunning = true;
  window.autoDemoIndex = 0;
  updateAutoDemoButton();
  showAudioIndicator();
  runDemoStep();
}

function stopAutoDemo() {
  window.autoDemoRunning = false;
  if (window.autoDemoTimer) {
    clearTimeout(window.autoDemoTimer);
    window.autoDemoTimer = null;
  }
  if (window.AudioManager) {
    window.AudioManager.stop();
  }
  clearSoundHighlight();
  hideAudioIndicator();
  updateAutoDemoButton();
}

function runDemoStep() {
  if (!window.autoDemoRunning) return;

  const steps = window.autoDemoSteps;
  const currentStep = steps[window.autoDemoIndex];

  if (typeof navigateTo === 'function') {
    navigateTo(currentStep.page);
  }

  if (currentStep.soundHighlight) {
    highlightSoundItem(currentStep.soundHighlight);
  } else {
    clearSoundHighlight();
  }

  if (currentStep.audioType && window.AudioManager) {
    const delay = currentStep.delay || 800;
    setTimeout(function() {
      if (!window.autoDemoRunning) return;
      playDemoAudio(currentStep);
    }, delay);
  }

  window.autoDemoIndex = (window.autoDemoIndex + 1) % steps.length;

  window.autoDemoTimer = setTimeout(function() {
    runDemoStep();
  }, currentStep.duration);
}

function playDemoAudio(step) {
  const mgr = window.AudioManager;
  if (!mgr) return;

  switch (step.audioType) {
    case 'spell':
      mgr.playSpell(step.audioPinyin, step.audioChar);
      break;
    case 'character':
      mgr.playCharacter(step.audioChar, step.audioPinyin, 0.7);
      break;
    case 'pinyin':
      mgr.playPinyin(step.audioPinyin, 0.7);
      break;
    case 'sentence':
      mgr.playSentence(step.audioText, 0.6);
      break;
  }
}

function highlightSoundItem(key) {
  clearSoundHighlight();
  const item = document.getElementById('soundItem-' + key);
  if (item) {
    item.classList.add('active');
  }
}

function clearSoundHighlight() {
  const keys = ['slow', 'spell', 'repeat', 'sentence'];
  keys.forEach(function(key) {
    const item = document.getElementById('soundItem-' + key);
    if (item) {
      item.classList.remove('active');
    }
  });
}

function updateAutoDemoButton() {
  const btn = document.getElementById('autoDemoBtn');
  if (!btn) return;

  if (window.autoDemoRunning) {
    btn.textContent = '⏸ 暂停演示';
    btn.classList.add('running');
  } else {
    btn.textContent = '▶ 自动演示';
    btn.classList.remove('running');
  }
}

function showAudioIndicator() {
  let indicator = document.getElementById('audioIndicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'audioIndicator';
    indicator.innerHTML = '<span class="audio-wave">🎵</span> 声音演示中';
    indicator.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #FF9A76, #FF7E5F);
      color: white;
      padding: 10px 24px;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 15px rgba(255, 154, 118, 0.4);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(indicator);
  }
  setTimeout(function() {
    indicator.style.opacity = '1';
  }, 50);
}

function hideAudioIndicator() {
  const indicator = document.getElementById('audioIndicator');
  if (indicator) {
    indicator.style.opacity = '0';
    setTimeout(function() {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 300);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  updateAutoDemoButton();
});
