(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var soft = style.getPropertyValue('--soft').trim();

  var state = {
    calories: 820,
    meals: 2,
    nutritionChart: null,
    weekChart: null
  };

  var chat = document.getElementById('chat');
  var input = document.getElementById('chatInput');
  var sendBtn = document.getElementById('sendBtn');
  var timeline = document.getElementById('mealTimeline');
  var ledgerStatus = document.getElementById('ledgerStatus');
  var calorieText = document.getElementById('calorieText');
  var calorieBar = document.getElementById('calorieBar');

  function addMessage(role, html) {
    var msg = document.createElement('div');
    msg.className = 'msg ' + role;
    msg.innerHTML = html;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }

  function addCard(html) {
    var wrap = document.createElement('div');
    wrap.className = 'cards';
    wrap.innerHTML = html;
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
  }

  function activateQuick(branch) {
    document.querySelectorAll('[data-branch]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-branch') === branch);
    });
  }

  function setTab(name) {
    document.querySelectorAll('.nav-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === name);
    });
    document.querySelectorAll('.tab-panel').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === 'tab-' + name);
    });
    setTimeout(function () {
      if (state.nutritionChart) state.nutritionChart.resize();
      if (state.weekChart) state.weekChart.resize();
    }, 80);
  }

  function updateLedger(name, kcal, note) {
    state.meals += 1;
    state.calories += kcal;
    ledgerStatus.textContent = '已记录 ' + state.meals + ' 餐';
    calorieText.textContent = state.calories + ' / 1800 kcal';
    calorieBar.style.setProperty('--w', Math.min(100, Math.round(state.calories / 1800 * 100)) + '%');

    var meal = document.createElement('div');
    meal.className = 'meal';
    meal.innerHTML = '<time>刚刚</time><div><strong>' + name + '</strong><br><small>' + note + '</small></div><b>' + kcal + '</b>';
    timeline.appendChild(meal);
    setTab('ledger');
  }

  function renderBranch(branch) {
    activateQuick(branch);
    if (branch === 'ate') {
      addMessage('user', '刚吃完一份麻辣烫');
      addMessage('ai', '收到，我先帮你记下来。麻辣烫这类饭菜通常油盐会偏高，但可以通过选菜和汤底调整。');
      addCard('<div class="food-card"><h4>本餐识别：麻辣烫</h4><p>估算含土豆片、豆皮、青菜、丸子、粉条。整体约 680 kcal，盐分和油脂偏高。</p><div class="food-grid"><span><b>680</b>kcal</span><span><b>23g</b>蛋白</span><span><b>78g</b>碳水</span><span><b>偏高</b>盐分</span></div></div><button class="primary-btn" data-add-meal="麻辣烫|680|晚餐，油盐偏高，建议晚点多喝水">加入今日台账</button>');
      addMessage('ai', '今天蔬菜还是有一点少，晚上如果还想吃点东西，可以选温热清淡的汤或水果，别再来重口夜宵啦。');
    }
    if (branch === 'recommend') {
      addMessage('user', '还没吃，不知道吃什么');
      addMessage('ai', '那我简单问 4 个小问题，不用填一堆表：预算、口味、目标和场景。');
      addCard('<div class="food-card"><h4>轻量选择</h4><div class="quick-grid"><button class="choice active">30 元内</button><button class="choice">微辣</button><button class="choice active">吃舒服点</button><button class="choice">外卖</button></div></div><div class="recommend-card"><h4>方案一：清汤麻辣烫</h4><p>多青菜 + 豆制品 + 少丸子，不喝汤，约 520 kcal。</p></div><div class="recommend-card"><h4>方案二：鸡胸肉饭 + 时蔬</h4><p>蛋白更稳，油盐风险较低，约 610 kcal。</p></div><div class="recommend-card"><h4>方案三：番茄牛肉粉</h4><p>暖胃但主食偏多，适合今天活动量稍高时选。</p></div>');
      addMessage('ai', '如果今天胃有点不舒服，我更建议方案二或清汤版方案一，别选太辣的汤底。');
      setTab('plan');
    }
    if (branch === 'cooking') {
      addMessage('user', '准备做饭，冰箱里有鸡蛋、番茄、青菜和豆腐');
      addMessage('ai', '这些食材很适合做一顿清爽晚餐，我给你搭两种，不复杂。');
      addCard('<div class="recipe-card"><h4>10 分钟快手：番茄豆腐蛋花汤</h4><p>番茄炒软后加水，放豆腐和蛋液，最后加青菜。少油少盐，适合养胃。</p></div><div class="recipe-card"><h4>更有饱腹感：青菜豆腐盖饭</h4><p>米饭半碗即可，豆腐补蛋白，青菜补纤维。</p></div><button class="primary-btn" data-add-meal="番茄豆腐蛋花汤|360|晚餐，清淡暖胃，蔬菜充足">加入今日台账</button>');
      addMessage('ai', '你今天久坐比较多，晚餐别太撑，吃到七八分饱就好。');
    }
    if (branch === 'photo') {
      addMessage('user', '上传了一张饭菜照片');
      addMessage('ai', '我看到了：像是一碗米饭、一份番茄炒蛋和一小份青菜。我先按家常份量估算。');
      addCard('<div class="food-card"><h4>图片识别结果</h4><p>米饭 150g、番茄炒蛋 1 份、青菜 80g。约 590 kcal，蛋白适中，蔬菜刚好达标。</p><div class="food-grid"><span><b>590</b>kcal</span><span><b>24g</b>蛋白</span><span><b>70g</b>碳水</span><span><b>适中</b>油脂</span></div></div><button class="primary-btn" data-add-meal="米饭 + 番茄炒蛋 + 青菜|590|图片记录，营养较均衡">加入今日台账</button>');
    }
  }

  function inferBranch(text) {
    if (/冰箱|做饭|鸡蛋|番茄|青菜|豆腐/.test(text)) return 'cooking';
    if (/照片|图片|上传|拍/.test(text)) return 'photo';
    if (/不知道|没吃|吃什么|推荐/.test(text)) return 'recommend';
    return 'ate';
  }

  document.addEventListener('click', function (event) {
    var branchEl = event.target.closest('[data-branch]');
    if (branchEl) {
      renderBranch(branchEl.getAttribute('data-branch'));
      document.getElementById('prototype').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    var tabEl = event.target.closest('[data-tab]');
    if (tabEl) setTab(tabEl.getAttribute('data-tab'));

    var addEl = event.target.closest('[data-add-meal]');
    if (addEl) {
      var parts = addEl.getAttribute('data-add-meal').split('|');
      updateLedger(parts[0], Number(parts[1]), parts[2]);
      addMessage('ai', '已经加入今日台账。晚点我会根据全天情况再帮你收个尾。');
      addEl.disabled = true;
      addEl.textContent = '已加入今日台账';
    }

    var scrollEl = event.target.closest('[data-scroll-target]');
    if (scrollEl) document.getElementById(scrollEl.getAttribute('data-scroll-target')).scrollIntoView({ behavior: 'smooth' });
  });

  sendBtn.addEventListener('click', function () {
    var text = input.value.trim();
    if (!text) return;
    addMessage('user', text);
    input.value = '';
    renderBranch(inferBranch(text));
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') sendBtn.click();
  });

  var shareModal = document.getElementById('shareModal');
  document.getElementById('shareBtn').addEventListener('click', function () {
    shareModal.classList.add('open');
  });
  document.getElementById('closeModal').addEventListener('click', function () {
    shareModal.classList.remove('open');
  });
  document.getElementById('modalOk').addEventListener('click', function () {
    shareModal.classList.remove('open');
  });
  shareModal.addEventListener('click', function (event) {
    if (event.target === shareModal) shareModal.classList.remove('open');
  });

  function initCharts() {
    var nutritionEl = document.getElementById('chart-nutrition');
    if (nutritionEl && window.echarts) {
      state.nutritionChart = echarts.init(nutritionEl, null, { renderer: 'svg' });
      state.nutritionChart.setOption({
        animation: false,
        tooltip: { appendToBody: true, trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 8, right: 14, top: 8, bottom: 8, containLabel: true },
        xAxis: { type: 'value', max: 100, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule } } },
        yAxis: { type: 'category', data: ['热量', '蛋白', '碳水', '纤维'], axisLabel: { color: ink }, axisLine: { lineStyle: { color: rule } }, axisTick: { show: false } },
        series: [{ type: 'bar', data: [46, 54, 62, 36], barWidth: 14, itemStyle: { color: accent, borderRadius: [0, 8, 8, 0] }, label: { show: true, position: 'right', color: muted, formatter: '{c}%' } }]
      });
    }

    var weekEl = document.getElementById('chart-week');
    if (weekEl && window.echarts) {
      state.weekChart = echarts.init(weekEl, null, { renderer: 'svg' });
      state.weekChart.setOption({
        animation: false,
        color: [accent, accent2],
        tooltip: { appendToBody: true, trigger: 'axis' },
        legend: { top: 0, textStyle: { color: muted } },
        grid: { left: 8, right: 14, top: 34, bottom: 8, containLabel: true },
        xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], axisLabel: { color: muted }, axisLine: { lineStyle: { color: rule } } },
        yAxis: { type: 'value', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
        series: [
          { name: '热量 kcal', type: 'line', smooth: true, data: [1680, 1820, 1740, 1960, 1510, 1880, 1650], areaStyle: { color: soft }, lineStyle: { color: accent }, symbolSize: 7 },
          { name: '蔬菜份数', type: 'bar', data: [2, 1, 2, 1, 3, 2, 2], yAxisIndex: 0, barWidth: 10, itemStyle: { color: accent2, borderRadius: [8, 8, 0, 0] } }
        ]
      });
    }

    window.addEventListener('resize', function () {
      if (state.nutritionChart) state.nutritionChart.resize();
      if (state.weekChart) state.weekChart.resize();
    });
  }

  initCharts();
})();
