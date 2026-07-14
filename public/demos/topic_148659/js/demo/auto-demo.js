window.autoDemoRunning = false;
window.autoDemoTimer = null;
window.autoDemoIndex = 0;
window.quickDemoMode = false;
window.demoSpeed = 1.0;

window.quickDemoSteps = [
  {
    page: 'home',
    duration: 3000,
    name: '学习地图',
    narration: '欢迎来到忆线识字！首页展示多邻国风格的学习地图，等级、XP、红心、识字币一目了然，10个课程节点按顺序解锁。'
  },
  {
    page: 'lesson',
    options: 'lesson_4',
    duration: 4000,
    name: '课程学习',
    narration: '点击课程进入学习模式，大字展示汉字，标准发音，组词和例句帮助理解字义。学习一个字获得10XP和1识字币。'
  },
  {
    page: 'quiz',
    duration: 5000,
    name: '答题练习',
    narration: '游戏化答题体验！看拼音选汉字，答对绿色脉冲动画+XP飘字，答错扣红心。连续答对还有连击奖励！'
  },
  {
    page: 'progress',
    duration: 3000,
    name: '学习进度',
    narration: '等级系统、徽章收藏、学习统计，全方位展示学习成果。8个成就徽章等你解锁！'
  }
];

window.autoDemoSteps = [
  {
    page: 'home',
    duration: 3500,
    name: '学习地图',
    narration: '欢迎来到忆线识字！首页展示多邻国风格的学习地图，等级、XP进度条、红心能量、识字币一目了然。10个课程节点按顺序解锁，完成前一课才能解锁下一课。'
  },
  {
    page: 'lesson',
    options: 'lesson_4',
    duration: 4500,
    name: '课程学习',
    narration: '点击课程进入学习模式，大字展示汉字，标准发音帮助纠正读音，组词和例句帮助理解字义。学习一个字获得10XP和1识字币。'
  },
  {
    page: 'quiz',
    duration: 5000,
    name: '答题练习',
    narration: '游戏化答题体验！看图选字、看拼音选汉字多种模式。答对绿色脉冲动画+XP飘字，答错扣红心。连续答对有连击奖励，达成5连击额外恢复一颗红心！'
  },
  {
    page: 'store',
    duration: 3000,
    name: '识字商店',
    narration: '在商店里可以用识字币兑换红心、XP翻倍卡、连胜保护器等道具。完成课程、答对题目都可以获得识字币！'
  },
  {
    page: 'detail',
    duration: 3500,
    name: '卡片详情',
    targetChar: '山',
    narration: '卡片详情页田字格大字展示帮助建立字形认知，标准发音帮助纠正读音，组词和例句帮助理解字义和用法。'
  },
  {
    page: 'exercise',
    duration: 2500,
    name: '练习中心',
    narration: '多种练习模式满足不同学习需求，今日目标给用户明确的学习方向，模式筛选让用户可以针对性练习错题。'
  },
  {
    page: 'pinyin',
    duration: 3000,
    name: '拼音学习',
    narration: '完整拼音表，点击即可听发音，帮助用户打好拼音基础。拼音是识字的关键，尤其对听障人士来说至关重要。'
  },
  {
    page: 'storybook',
    duration: 3000,
    name: '课本绘本',
    narration: '26本分级绘本，从L1到L3难度递增，在故事阅读中巩固识字。支持点读功能，边读边学。'
  },
  {
    page: 'progress',
    duration: 3000,
    name: '学习进度',
    narration: '等级系统、徽章收藏、学习统计，全方位展示学习成果。8个成就徽章：火焰守护者、识字达人、精准射手等！'
  },
  {
    page: 'home',
    duration: 2000,
    name: '结束',
    narration: '忆线识字，用游戏化方式帮助听障人士突破识字障碍。多邻国风格游戏化学习体验，让识字变得有趣！感谢观看！'
  }
];

window.toggleAutoDemo = function() {
  if (window.autoDemoRunning) {
    pauseAutoDemo();
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

window.pauseAutoDemo = function() {
  window.autoDemoRunning = false;
  if (window.autoDemoTimer) {
    clearTimeout(window.autoDemoTimer);
    window.autoDemoTimer = null;
  }
  updateAutoDemoButton();
  updateQuickDemoButton();
  updateStepIndicator();
};

window.resumeAutoDemo = function() {
  if (!window.autoDemoRunning) {
    window.autoDemoRunning = true;
    updateAutoDemoButton();
    updateQuickDemoButton();
    runDemoStep();
  }
};

window.prevDemoStep = function() {
  const steps = window.quickDemoMode ? window.quickDemoSteps : window.autoDemoSteps;
  window.autoDemoIndex = (window.autoDemoIndex - 1 + steps.length) % steps.length;
  runDemoStep(false);
};

window.nextDemoStep = function() {
  const steps = window.quickDemoMode ? window.quickDemoSteps : window.autoDemoSteps;
  window.autoDemoIndex = (window.autoDemoIndex + 1) % steps.length;
  runDemoStep(false);
};

window.setDemoSpeed = function(speed) {
  window.demoSpeed = speed;
  updateSpeedButtons();
};

function startAutoDemo(isQuick) {
  window.autoDemoRunning = true;
  window.quickDemoMode = !!isQuick;
  window.autoDemoIndex = 0;
  updateAutoDemoButton();
  updateQuickDemoButton();
  updateSpeedButtons();
  runDemoStep();
}

function stopAutoDemo() {
  window.autoDemoRunning = false;
  window.quickDemoMode = false;
  window.autoDemoIndex = 0;
  if (window.autoDemoTimer) {
    clearTimeout(window.autoDemoTimer);
    window.autoDemoTimer = null;
  }
  updateAutoDemoButton();
  updateQuickDemoButton();
  updateStepIndicator();
  updateNarration('');
}

window.runDemoStep = function(scheduleNext = true) {
  if (!window.autoDemoRunning && scheduleNext) return;

  const steps = window.quickDemoMode ? window.quickDemoSteps : window.autoDemoSteps;
  const currentStep = steps[window.autoDemoIndex];

  if (typeof navigateTo === 'function') {
    if (currentStep.targetChar && typeof navigateToChar === 'function') {
      navigateToChar(currentStep.targetChar);
    } else {
      navigateTo(currentStep.page, currentStep.options);
    }
  }

  updateStepIndicator();
  updateNarration(currentStep.narration);

  if (scheduleNext) {
    const adjustedDuration = currentStep.duration / window.demoSpeed;
    
    if (window.quickDemoMode && window.autoDemoIndex >= steps.length - 1) {
      window.autoDemoTimer = setTimeout(function() {
        stopAutoDemo();
      }, adjustedDuration);
      return;
    }

    window.autoDemoTimer = setTimeout(function() {
      window.autoDemoIndex = (window.autoDemoIndex + 1) % steps.length;
      runDemoStep();
    }, adjustedDuration);
  }
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

function updateSpeedButtons() {
  const speedButtons = document.querySelectorAll('.speed-btn');
  speedButtons.forEach(btn => {
    const speed = parseFloat(btn.dataset.speed);
    if (speed === window.demoSpeed) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
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
  updateStepIndicator();
});