(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var soft = style.getPropertyValue('--soft').trim();

  var state = { calories: 820, meals: 2, charts: [] };
  var chat = document.getElementById('chat');
  var input = document.getElementById('chatInput');
  var sendBtn = document.getElementById('sendBtn');
  var timeline = document.getElementById('mealTimeline');
  var ledgerStatus = document.getElementById('ledgerStatus');
  var calorieText = document.getElementById('calorieText');
  var calorieBar = document.getElementById('calorieBar');

  function addMessage(role, html) {
    if (!chat) return;
    var msg = document.createElement('div');
    msg.className = 'msg ' + role;
    msg.innerHTML = html;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }

  function addChatCard(html) {
    if (!chat) return;
    var card = document.createElement('div');
    card.className = 'chat-card';
    card.innerHTML = html;
    chat.appendChild(card);
    chat.scrollTop = chat.scrollHeight;
  }

  function activateBranch(branch) {
    document.querySelectorAll('[data-branch]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-branch') === branch);
    });
  }

  function updateLedger(name, kcal, note) {
    state.meals += 1;
    state.calories += Number(kcal);
    if (ledgerStatus) ledgerStatus.textContent = '已记录 ' + state.meals + ' 餐';
    if (calorieText) calorieText.textContent = state.calories + ' / 1800 kcal';
    if (calorieBar) calorieBar.style.setProperty('--w', Math.min(100, Math.round(state.calories / 1800 * 100)) + '%');
    if (timeline) {
      var meal = document.createElement('div');
      meal.className = 'meal';
      meal.innerHTML = '<time>刚刚</time><div><strong>' + name + '</strong><br><small>' + note + '</small></div><b>' + kcal + '</b>';
      timeline.appendChild(meal);
    }
  }

  function renderBranch(branch) {
    activateBranch(branch);
    if (branch === 'ate') {
      addMessage('user', '刚吃完一份麻辣烫');
      addMessage('ai', '收到，我先做「记录 + 复盘」。这顿会按常见外卖份量估算，如果你上传照片，我会走 OCR / 图像识别流程再细化。');
      addChatCard('<h4>OCR / 食物识别结果：麻辣烫</h4><p>识别到：粉条、土豆片、豆皮、青菜、鱼丸、辣油汤底。自动拆解后估算整体约 680 kcal，盐分和油脂偏高。</p><div class="nutri-grid"><span><b>680</b>kcal</span><span><b>23g</b>蛋白</span><span><b>78g</b>碳水</span><span><b>偏高</b>盐分</span></div><div class="chips" style="margin-top:10px"><span class="tag">油脂偏高</span><span class="tag">钠摄入偏高</span><span class="tag">蔬菜不足</span></div><button class="btn primary" style="margin-top:12px" data-add-meal="麻辣烫|680|油盐偏高，蔬菜不足，建议晚点多喝水">加入今日台账</button>');
      addChatCard('<h4>当日饮食台账更新预览</h4><p>早餐：豆浆 + 全麦包；午餐：米饭 + 番茄炒蛋；晚餐：麻辣烫。今日风险项：油多、盐分高、绿叶菜偏少。</p><a class="btn tea" style="margin-top:12px" href="ledger.html">查看完整台账</a>');
      addMessage('ai', '今天蔬菜吃得有点少啦，明天我帮你把绿叶菜放进早餐或午餐里。你今天总吃外卖的话，要不要我教你一道 10 分钟快手减脂餐？');
    }
    if (branch === 'recommend') {
      addMessage('user', '还没吃，不知道吃什么');
      addMessage('ai', '不纠结，我们用轻量多选，不让你填一长串表：预算、口味、目标、在家做还是外卖，点几下就行。');
      addChatCard('<h4>AI 追问：轻量多选</h4><p>系统根据这些选项自动避开高油高盐雷区。</p><div class="chips"><button class="choice active">30 元内</button><button class="choice active">清淡</button><button class="choice">微辣</button><button class="choice">素食</button><button class="choice active">减脂</button><button class="choice">控糖</button><button class="choice active">外卖</button><button class="choice">在家做</button></div>');
      addChatCard('<h4>外卖清单：鸡胸肉饭 + 双份时蔬</h4><p>约 610 kcal，蛋白稳定，酱汁少放，避开炸物和浓汤。适合普通上班日晚餐。</p><div class="nutri-grid"><span><b>610</b>kcal</span><span><b>42g</b>蛋白</span><span><b>65g</b>碳水</span><span><b>低</b>油盐</span></div>');
      addChatCard('<h4>简易家常菜：番茄豆腐蛋花汤 + 半碗饭</h4><p>约 430 kcal，10 分钟完成，清淡暖胃。冰箱有鸡蛋、番茄、豆腐时优先推荐。</p><div class="nutri-grid"><span><b>430</b>kcal</span><span><b>31g</b>蛋白</span><span><b>48g</b>碳水</span><span><b>低</b>油脂</span></div><a class="btn tea" style="margin-top:12px" href="plan.html">查看更多推荐</a>');
      addMessage('ai', '最近总不吃早饭的话，胃会不舒服。明天我可以给你安排几款 5 分钟便捷早餐，不用早起太多。');
    }
    if (branch === 'cooking') {
      addMessage('user', '准备做饭，冰箱里有鸡蛋、番茄、青菜和豆腐');
      addMessage('ai', '我会先识别冰箱食材，再结合身体状态给你搭菜。现在识别到鸡蛋、番茄、青菜、豆腐，适合做清淡养胃路线。');
      addChatCard('<div class="food-photo"></div><h4>冰箱食材识别</h4><p>识别到：鸡蛋 2 个、番茄 2 个、青菜 1 把、嫩豆腐 1 盒。可做汤、盖饭或快手炒菜。</p><div class="chips" style="margin-top:10px"><span class="tag">可补蛋白</span><span class="tag">可补蔬菜</span><span class="tag">10 分钟内</span></div>');
      addChatCard('<h4>实时菜谱：番茄豆腐蛋花汤</h4><p>番茄炒软后加水，放豆腐和蛋液，最后加青菜。少油少盐，适合久坐后的轻晚餐。</p><div class="nutri-grid"><span><b>360</b>kcal</span><span><b>25g</b>蛋白</span><span><b>18g</b>碳水</span><span><b>充足</b>蔬菜</span></div><button class="btn primary" style="margin-top:12px" data-add-meal="番茄豆腐蛋花汤|360|清淡暖胃，蔬菜充足">加入今日台账</button>');
      addMessage('ai', '如果你今天胃痛，就别加辣椒和冰饮；如果最近长痘，也先少放油。吃饭这事不用太紧张，先让身体舒服一点。');
    }
    if (branch === 'photo') {
      addMessage('user', '上传了一张饭菜照片');
      addMessage('ai', '我先做图像识别和 OCR 估算：这张图里有米饭、番茄炒蛋和一小份青菜。');
      addChatCard('<div class="food-photo"></div><h4>OCR / 图片识别结果</h4><p>米饭约 150g、番茄炒蛋 1 份、青菜约 80g。自动拆解为主食、蛋白、蔬菜和烹调用油。</p><div class="nutri-grid"><span><b>590</b>kcal</span><span><b>24g</b>蛋白</span><span><b>70g</b>碳水</span><span><b>适中</b>油脂</span></div><div class="chips" style="margin-top:10px"><span class="tag">蔬菜达标</span><span class="tag">油脂适中</span><span class="tag">糖分正常</span></div><button class="btn primary" style="margin-top:12px" data-add-meal="米饭 + 番茄炒蛋 + 青菜|590|图片记录，营养较均衡">加入今日台账</button>');
      addMessage('ai', '这顿比麻辣烫均衡很多，番茄炒蛋已经有蛋白，青菜也补上了。明天如果早餐别空着，整体会更稳。');
    }
    if (branch === 'health') {
      addMessage('user', '我今天胃有点不舒服，最近还长痘');
      addMessage('ai', '那今天先不按「好不好吃」排序，我会按身体状态帮你避开刺激项。');
      addChatCard('<h4>身体状态忌口提醒</h4><p>胃痛：少辣、少冰、少油炸；长痘：少油炸、少奶茶甜品；高血糖：少粥、少甜饮、主食按半拳到一拳估算。</p><div class="chips" style="margin-top:10px"><span class="tag">避开重辣</span><span class="tag">避开冰饮</span><span class="tag">控制甜饮</span></div>');
      addChatCard('<h4>适配食疗菜谱</h4><p>推荐：山药鸡丝粥 + 凉拌青菜，或番茄豆腐蛋花汤 + 半碗饭。温热、清淡、容易消化。</p><div class="nutri-grid"><span><b>430</b>kcal</span><span><b>31g</b>蛋白</span><span><b>低</b>油脂</span><span><b>暖胃</b>建议</span></div>');
      addMessage('ai', '你今天就别硬扛啦，先吃点温热的。等胃舒服了，我再给你安排好吃一点但不太负担的版本。');
    }
  }

  function inferBranch(text) {
    if (/胃|长痘|高血糖|血糖|血压|痛风|不舒服|忌口/.test(text)) return 'health';
    if (/冰箱|做饭|鸡蛋|番茄|青菜|豆腐/.test(text)) return 'cooking';
    if (/照片|图片|上传|拍/.test(text)) return 'photo';
    if (/不知道|没吃|吃什么|推荐|外卖/.test(text)) return 'recommend';
    return 'ate';
  }

  document.addEventListener('click', function (event) {
    var branchEl = event.target.closest('[data-branch]');
    if (branchEl) renderBranch(branchEl.getAttribute('data-branch'));

    var addEl = event.target.closest('[data-add-meal]');
    if (addEl) {
      var parts = addEl.getAttribute('data-add-meal').split('|');
      updateLedger(parts[0], parts[1], parts[2]);
      addMessage('ai', '已经加入今日台账。晚点我会根据全天情况再帮你收个尾。');
      addEl.disabled = true;
      addEl.textContent = '已加入今日台账';
    }

    var modalEl = event.target.closest('[data-open-modal]');
    if (modalEl) {
      var modal = document.getElementById(modalEl.getAttribute('data-open-modal'));
      if (modal) modal.classList.add('open');
    }

    if (event.target.closest('[data-close-modal]')) {
      document.querySelectorAll('.modal.open').forEach(function (modal) { modal.classList.remove('open'); });
    }

    if (event.target.classList.contains('modal')) event.target.classList.remove('open');

    var choice = event.target.closest('.choice');
    if (choice) choice.classList.toggle('active');
  });

  if (sendBtn && input) {
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
  }

  var mockUpload = document.getElementById('mockUpload');
  if (mockUpload) {
    mockUpload.addEventListener('click', function () {
      renderBranch('photo');
    });
  }

  var addMealBtn = document.getElementById('addMealBtn');
  if (addMealBtn) {
    addMealBtn.addEventListener('click', function () {
      var name = document.getElementById('mealName').value || '补记一餐';
      var kcal = document.getElementById('mealKcal').value || '430';
      var note = document.getElementById('mealNote').value || '手动补记';
      updateLedger(name, kcal, note);
      addMealBtn.textContent = '已加入今日台账';
      setTimeout(function () { addMealBtn.textContent = '继续补记一餐'; }, 1200);
    });
  }

  var generatePlanBtn = document.getElementById('generatePlanBtn');
  if (generatePlanBtn) {
    generatePlanBtn.addEventListener('click', function () {
      var results = document.getElementById('planResults');
      if (!results) return;
      results.innerHTML = '<div class="recipe"><h4>新方案：山药鸡丝粥 + 凉拌青菜</h4><p>约 430 kcal，温热、清淡、暖胃，适合今天想吃舒服一点。</p><div class="nutri-grid"><span><b>430</b>kcal</span><span><b>31g</b>蛋白</span><span><b>48g</b>碳水</span><span><b>低</b>油盐</span></div></div><div class="recipe"><h4>备选：番茄豆腐蛋花汤</h4><p>在家 10 分钟完成，适合冰箱有鸡蛋、番茄和豆腐时。</p></div><div class="recipe"><h4>外卖备选：轻食碗</h4><p>选择饭量半份、加鸡蛋或鸡胸肉，酱汁少放。</p></div>';
    });
  }

  var saveProfileBtn = document.getElementById('saveProfileBtn');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', function () {
      var modal = document.getElementById('savedModal');
      if (modal) modal.classList.add('open');
    });
  }

  function chartBase() {
    return {
      animation: false,
      tooltip: { appendToBody: true },
      textStyle: { color: muted }
    };
  }

  function initChart(id, option) {
    var el = document.getElementById(id);
    if (!el || !window.echarts) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption(option);
    state.charts.push(chart);
  }

  initChart('chart-nutrition', Object.assign(chartBase(), {
    tooltip: { appendToBody: true, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 18, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', max: 100, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'category', data: ['热量', '蛋白', '碳水', '纤维'], axisLabel: { color: ink }, axisLine: { lineStyle: { color: rule } }, axisTick: { show: false } },
    series: [{ type: 'bar', data: [59, 54, 62, 38], barWidth: 14, itemStyle: { color: accent, borderRadius: [0, 8, 8, 0] }, label: { show: true, position: 'right', color: muted, formatter: '{c}%' } }]
  }));

  initChart('chart-week', Object.assign(chartBase(), {
    color: [accent, accent2],
    tooltip: { appendToBody: true, trigger: 'axis' },
    legend: { top: 0, textStyle: { color: muted } },
    grid: { left: 8, right: 16, top: 34, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], axisLabel: { color: muted }, axisLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'value', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [
      { name: '热量 kcal', type: 'line', smooth: true, data: [1680, 1820, 1740, 1960, 1510, 1880, 1650], areaStyle: { color: soft }, lineStyle: { color: accent }, symbolSize: 7 },
      { name: '蔬菜份数', type: 'bar', data: [2, 1, 2, 1, 3, 2, 2], barWidth: 10, itemStyle: { color: accent2, borderRadius: [8, 8, 0, 0] } }
    ]
  }));

  initChart('chart-radar', Object.assign(chartBase(), {
    color: [accent, accent2],
    tooltip: { appendToBody: true },
    radar: {
      indicator: [
        { name: '蛋白', max: 100 },
        { name: '蔬菜', max: 100 },
        { name: '纤维', max: 100 },
        { name: '控油', max: 100 },
        { name: '控糖', max: 100 }
      ],
      axisName: { color: ink },
      splitLine: { lineStyle: { color: rule } },
      splitArea: { areaStyle: { color: [bg2, 'transparent'] } },
      axisLine: { lineStyle: { color: rule } }
    },
    series: [{ type: 'radar', data: [{ value: [72, 58, 42, 66, 74], name: '本周表现', areaStyle: { color: 'rgba(63,111,86,.18)' } }] }]
  }));

  window.addEventListener('resize', function () {
    state.charts.forEach(function (chart) { chart.resize(); });
  });
})();
