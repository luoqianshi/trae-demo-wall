window.autoDemoRunning = false;
window.autoDemoTimer = null;
window.autoDemoIndex = 0;
window.quickDemoMode = false;

window.quickDemoSteps = [
  {
    page: 'home',
    duration: 2500,
    name: '首页'
  },
  {
    page: 'detail',
    duration: 4000,
    name: '卡片详情 - 山',
    targetChar: '山'
  },
  {
    page: 'quiz',
    duration: 4000,
    name: '看图选字练习'
  },
  {
    page: 'progress',
    duration: 3000,
    name: '学习进度'
  }
];

window.autoDemoSteps = [
  {
    page: 'home',
    duration: 3000,
    name: '首页'
  },
  {
    page: 'category',
    duration: 2500,
    name: '识字分类'
  },
  {
    page: 'grid',
    duration: 2500,
    name: '卡片网格'
  },
  {
    page: 'detail',
    duration: 4000,
    name: '卡片详情'
  },
  {
    page: 'exercise',
    duration: 2500,
    name: '练习中心'
  },
  {
    page: 'quiz',
    duration: 3500,
    name: '答题练习'
  },
  {
    page: 'storybook',
    duration: 3500,
    name: '课本绘本'
  },
  {
    page: 'progress',
    duration: 3000,
    name: '学习进度'
  }
];

window.toggleAutoDemo = function() {
  if (window.autoDemoRunning) {
    stopAutoDemo();
  } else {
    startAutoDemo(false);
  }
};

window.toggleQuickDemo = function() {
  if (window.autoDemoRunning && window.quickDemoMode) {
    stopAutoDemo();
  } else {
    if (window.autoDemoRunning) {
      stopAutoDemo();
    }
    startAutoDemo(true);
  }
};

function startAutoDemo(isQuick) {
  window.autoDemoRunning = true;
  window.quickDemoMode = !!isQuick;
  window.autoDemoIndex = 0;
  updateAutoDemoButton();
  updateQuickDemoButton();
  runDemoStep();
}

function stopAutoDemo() {
  window.autoDemoRunning = false;
  window.quickDemoMode = false;
  if (window.autoDemoTimer) {
    clearTimeout(window.autoDemoTimer);
    window.autoDemoTimer = null;
  }
  updateAutoDemoButton();
  updateQuickDemoButton();
}

function runDemoStep() {
  if (!window.autoDemoRunning) return;

  const steps = window.quickDemoMode ? window.quickDemoSteps : window.autoDemoSteps;
  const currentStep = steps[window.autoDemoIndex];

  if (typeof navigateTo === 'function') {
    if (currentStep.targetChar && typeof navigateToChar === 'function') {
      navigateToChar(currentStep.targetChar);
    } else {
      navigateTo(currentStep.page);
    }
  }

  window.autoDemoIndex = window.autoDemoIndex + 1;

  if (window.quickDemoMode && window.autoDemoIndex >= steps.length) {
    setTimeout(function() {
      stopAutoDemo();
    }, currentStep.duration);
    return;
  }

  window.autoDemoIndex = window.autoDemoIndex % steps.length;

  window.autoDemoTimer = setTimeout(function() {
    runDemoStep();
  }, currentStep.duration);
}

function updateAutoDemoButton() {
  const btn = document.getElementById('autoDemoBtn');
  if (!btn) return;

  if (window.autoDemoRunning && !window.quickDemoMode) {
    btn.textContent = '⏸ 暂停演示';
    btn.classList.add('running');
  } else {
    btn.textContent = '▶ 完整演示';
    btn.classList.remove('running');
  }
}

function updateQuickDemoButton() {
  const btn = document.getElementById('quickDemoBtn');
  if (!btn) return;

  if (window.autoDemoRunning && window.quickDemoMode) {
    btn.textContent = '⏸ 停止体验';
    btn.classList.add('running');
  } else {
    btn.textContent = '⚡ 快速体验（3分钟）';
    btn.classList.remove('running');
  }
}

window.toggleCompletionPanel = function() {
  const panel = document.getElementById('completionPanel');
  const icon = document.getElementById('completionToggleIcon');
  if (panel) {
    panel.classList.toggle('collapsed');
  }
};

document.addEventListener('DOMContentLoaded', function() {
  updateAutoDemoButton();
  updateQuickDemoButton();
});
