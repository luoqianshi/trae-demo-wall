/* page-smart-home.js · 智能家居生态 · 9 场景 × 6 设备联动 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  // ===== 健康档案（可叠加）=====
  var healthState = {
    'h-rheumatism': true,   // 默认启用：演示时显示效果
    'h-asthma': false,
    'h-hypertension': false,
    'h-saver': false
  };

  // ===== 6 设备状态 =====
  var deviceState = {
    ac: { on: true, temp: 28, mode: '自动', wind: '微风' },
    washer: { on: false, status: '待机' },
    robotic: { on: false, status: '待机' },
    tvbox: { on: false, channel: '待机' },
    light: { on: true, brightness: 80, scene: '日常' },
    curtain: { on: true, position: '半开' }
  };

  // ===== 9 大场景预设 =====
  // 每个场景会同时更新多个设备状态
  var scenePresets = {
    '看电视剧': {
      icon: '📺',
      desc: '追剧模式',
      actions: [
        { d: 'tvbox', val: { on: true, channel: '腾讯视频·电视剧' }, msg: '📺 电视盒子已开机 → 腾讯视频·电视剧' },
        { d: 'light', val: { on: true, brightness: 30, scene: '氛围' }, msg: '💡 大灯已关 → 氛围灯 30%' },
        { d: 'curtain', val: { on: true, position: '关闭' }, msg: '🪟 窗帘已关闭（避免反光）' },
        { d: 'ac', val: { on: true, temp: 26, mode: '制冷', wind: '上吹风' }, msg: '❄ 空调已调到 26°C 上吹风' }
      ]
    },
    '睡觉了': {
      icon: '🛏',
      desc: '睡眠模式',
      actions: [
        { d: 'tvbox', val: { on: false, channel: '待机' }, msg: '📺 电视已关' },
        { d: 'light', val: { on: false, brightness: 0, scene: '关闭' }, msg: '💡 全屋灯光已关' },
        { d: 'ac', val: { on: true, temp: 27, mode: '睡眠曲线', wind: '静音' }, msg: '❄ 空调 27°C 睡眠曲线（2 小时后 +1°C）' },
        { d: 'curtain', val: { on: true, position: '关闭' }, msg: '🪟 窗帘已关闭' },
        { d: 'robotic', val: { on: false, status: '回充' }, msg: '🤖 扫地机已回充' }
      ]
    },
    '起夜': {
      icon: '🌙',
      desc: '夜起感应',
      actions: [
        { d: 'light', val: { on: true, brightness: 30, scene: '夜起' }, msg: '💡 走廊灯已开 30% 暖光' },
        { d: 'ac', val: { on: true, temp: 26, mode: '静音', wind: '微风' }, msg: '❄ 空调静音模式（避免吵到老人）' }
      ]
    },
    '回家了': {
      icon: '🏠',
      desc: '归家模式',
      actions: [
        { d: 'light', val: { on: true, brightness: 80, scene: '日常' }, msg: '💡 客厅灯已开 80%' },
        { d: 'ac', val: { on: true, temp: 26, mode: '制冷', wind: '上吹风' }, msg: '❄ 空调已开 26°C' },
        { d: 'curtain', val: { on: true, position: '半开' }, msg: '🪟 窗帘已开（自然光）' },
        { d: 'robotic', val: { on: false, status: '暂停' }, msg: '🤖 扫地机已暂停' }
      ]
    },
    '有点闷': {
      icon: '🪟',
      desc: '通风模式',
      actions: [
        { d: 'curtain', val: { on: true, position: '全开' }, msg: '🪟 窗帘已全开（开窗通风）' },
        { d: 'ac', val: { on: true, temp: 26, mode: '送风', wind: '中风' }, msg: '❄ 空调已切送风模式（不制冷）' }
      ]
    },
    '扫地': {
      icon: '🤖',
      desc: '清扫任务',
      actions: [
        { d: 'robotic', val: { on: true, status: '清扫中' }, msg: '🤖 扫地机已启动全屋清扫' }
      ]
    },
    '想喝奶茶': {
      icon: '🧋',
      desc: '外卖联动',
      actions: [
        { d: '外卖', val: { on: true }, msg: '🧋 已识别语音：' + '想喝奶茶' },
        { d: '外卖', val: {}, msg: '📱 AI 整理中：附近 3km 喜茶 / 蜜雪冰城 / 瑞幸' },
        { d: '外卖', val: {}, msg: '💬 推荐：蜜雪冰城·草莓圣代 + 珍珠奶茶（老人专属少糖）' }
      ]
    },
    '心疼电费': {
      icon: '💰',
      desc: '节能模式',
      actions: [
        { d: 'ac', val: { on: true, temp: 28, mode: '节能', wind: '自动' }, msg: '❄ 空调已切 28°C 节能' },
        { d: 'light', val: { on: true, brightness: 60, scene: '节能' }, msg: '💡 非必要灯光已调暗 60%' },
        { d: 'curtain', val: { on: true, position: '关闭' }, msg: '🪟 窗帘已关（隔热）' },
        { d: 'robotic', val: { on: false, status: '延后' }, msg: '🤖 扫地机延后到 23:00（电价低谷）' }
      ]
    },
    '小孩在家': {
      icon: '🧒',
      desc: '儿童模式',
      actions: [
        { d: 'ac', val: { on: true, temp: 26, mode: '儿童', wind: '无风' }, msg: '❄ 空调 26°C 无直吹（儿童安全）' },
        { d: 'light', val: { on: true, brightness: 100, scene: '学习' }, msg: '💡 大灯全亮 100%（护眼学习模式）' },
        { d: 'curtain', val: { on: true, position: '半开' }, msg: '🪟 窗帘半开（自然光 + 防反光）' },
        { d: 'washer', val: { on: true, status: '儿童衣物' }, msg: '🧺 洗衣机已切儿童模式（高温杀菌）' }
      ]
    }
  };

  // ===== 健康档案 UI =====
  window.toggleHealth = function (id) {
    healthState[id] = !healthState[id];
    var card = $(id);
    if (!card) return;
    var chip = card.querySelector('.chip');
    if (healthState[id]) {
      card.classList.add('active');
      if (chip) { chip.textContent = '已启用'; chip.classList.add('active'); }
      if (window.toast) window.toast('已启用：' + card.querySelector('.name').textContent);
      applyHealthToAC();
    } else {
      card.classList.remove('active');
      if (chip) { chip.textContent = '未启用'; chip.classList.remove('active'); }
      applyHealthToAC();
    }
  };

  window.resetHealth = function () {
    var keys = Object.keys(healthState);
    for (var i = 0; i < keys.length; i++) {
      healthState[keys[i]] = false;
      var card = $(keys[i]);
      if (!card) continue;
      card.classList.remove('active');
      var chip = card.querySelector('.chip');
      if (chip) { chip.textContent = '未启用'; chip.classList.remove('active'); }
    }
    applyHealthToAC();
    if (window.toast) window.toast('健康档案已重置');
  };

  function applyHealthToAC() {
    if (healthState['h-rheumatism']) {
      deviceState.ac.temp = 27;
      deviceState.ac.wind = '无风';
      deviceState.ac.mode = '制冷·风湿';
    } else if (healthState['h-asthma']) {
      deviceState.ac.temp = 25;
      deviceState.ac.wind = '微风';
      deviceState.ac.mode = '制冷·慢阻肺';
    } else if (healthState['h-saver']) {
      deviceState.ac.temp = 28;
      deviceState.ac.wind = '自动';
      deviceState.ac.mode = '节能';
    } else {
      deviceState.ac.temp = 26;
      deviceState.ac.wind = '上吹风';
      deviceState.ac.mode = '制冷';
    }
    syncACDisplay();
  }

  // ===== 同步空调显示 =====
  function syncACDisplay() {
    if ($('acTemp')) $('acTemp').textContent = '' + deviceState.ac.temp;
    if ($('acMode')) $('acMode').textContent = deviceState.ac.mode;
    if ($('acWind')) $('acWind').textContent = deviceState.ac.wind;
    if ($('acTip')) {
      var activeHealth = [];
      if (healthState['h-rheumatism']) activeHealth.push('风湿');
      if (healthState['h-asthma']) activeHealth.push('哮喘');
      if (healthState['h-hypertension']) activeHealth.push('高血压');
      if (healthState['h-saver']) activeHealth.push('节能');
      $('acTip').textContent = activeHealth.length > 0
        ? '健康档案：' + activeHealth.join('+') + ' → ' + deviceState.ac.temp + '°C ' + deviceState.ac.wind
        : '通用模式 → ' + deviceState.ac.temp + '°C ' + deviceState.ac.wind;
    }
  }

  // ===== 更新设备状态 =====
  function updateDevice(d, val) {
    if (d === '外卖') {
      // 外卖走跨页跳转逻辑
      try { localStorage.setItem('hml_sm_order', JSON.stringify({ kind: '奶茶', ts: Date.now() })); } catch (e) {}
      return;
    }
    if (!deviceState[d]) return;
    var k = Object.keys(val);
    for (var i = 0; i < k.length; i++) {
      deviceState[d][k[i]] = val[k[i]];
    }
  }

  // ===== 同步设备 chip 状态 =====
  function syncDeviceChips() {
    var list = $('deviceList');
    if (!list) return;
    var chips = list.querySelectorAll('.device-chip');
    var map = [
      { d: 'ac', text: '❄ 美的空调', on: deviceState.ac.on },
      { d: 'washer', text: '🧺 海尔洗衣机', on: deviceState.washer.on },
      { d: 'robotic', text: '🤖 石头扫地机', on: deviceState.robotic.on },
      { d: 'tvbox', text: '📺 小米电视盒子', on: deviceState.tvbox.on },
      { d: 'light', text: '💡 Yeelight 智能灯', on: deviceState.light.on },
      { d: 'curtain', text: '🪟 米家窗帘电机', on: deviceState.curtain.on }
    ];
    for (var i = 0; i < chips.length && i < map.length; i++) {
      chips[i].textContent = map[i].text + (map[i].on ? ' · 开' : ' · 待机');
      if (map[i].on) chips[i].classList.add('on'); else chips[i].classList.remove('on');
    }
  }

  // ===== 日志 =====
  function addLog(speaker, text, kind) {
    var box = $('smBubbleLog');
    if (!box) return;
    var div = document.createElement('div');
    div.className = 'bubble ' + (kind || 'ai');
    div.innerHTML = '<strong style="color: var(--accent-deep);">' + speaker + '：</strong> ' + text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    $('smLog').style.display = '';
  }

  // ===== 语音命令入口 =====
  window.quickCmd = function (text) {
    processCmd(text);
  };

  function processCmd(text) {
    addLog('爸', '"' + text + '"', 'user');
    setTimeout(function () { aiRespond(text); }, 500);
  }

  function aiRespond(text) {
    // 优先匹配 9 大场景
    var matched = null;
    for (var key in scenePresets) {
      if (text.indexOf(key) >= 0) { matched = key; break; }
    }

    if (matched) {
      runScene(matched);
    } else if (text.indexOf('热') >= 0) {
      // 兜底：单点热
      deviceState.ac.temp = healthState['h-rheumatism'] ? 27 : 26;
      deviceState.ac.wind = healthState['h-rheumatism'] ? '无风' : '上吹风';
      deviceState.ac.mode = healthState['h-rheumatism'] ? '制冷·风湿' : '制冷·抽湿';
      syncACDisplay();
      syncDeviceChips();
      addLog('小暖 AI', '收到～空调已调到 ' + deviceState.ac.temp + '°C，' + deviceState.ac.wind + '模式。');
    } else if (text.indexOf('膝盖') >= 0 || text.indexOf('腿') >= 0) {
      healthState['h-rheumatism'] = true;
      applyHealthToAC();
      syncHealthChips();
      addLog('小暖 AI', '已为您启用「风湿」档案，空调 27°C 无风，避免刺激关节。');
      addLog('小暖 AI', '已通知儿子小明，建议去医大总医院复查一下。');
    } else {
      addLog('小暖 AI', '我没太听懂，试试说：<br>"看电视剧" / "睡觉了" / "起夜" / "回家了" / "扫地" / "想喝奶茶"');
    }
  }

  // ===== 执行场景 =====
  function runScene(name) {
    var preset = scenePresets[name];
    if (!preset) return;

    // 特殊处理：奶茶走外卖
    if (name === '想喝奶茶') {
      addLog('小暖 AI', '🧋 收到～' + name);
      setTimeout(function () { addLog('小暖 AI', '📱 AI 正在搜索附近奶茶店...'); }, 400);
      setTimeout(function () { addLog('小暖 AI', '✅ 找到 3 家：喜茶 / 蜜雪冰城 / 瑞幸'); }, 1200);
      setTimeout(function () { addLog('小暖 AI', '💬 推荐：蜜雪冰城·草莓圣代 + 珍珠奶茶（少糖）'); }, 2000);
      setTimeout(function () {
        addLog('小暖 AI', '📲 已通知儿子小明确认下单。');
        addLog('小暖 AI', '🍵 老人也有馋嘴的权利，这就是全能 APP 的意义。', 'ai');
        if (window.toast) window.toast('🧋 已联动社区帮忙 → 跳转到外卖下单');
      }, 2800);
      // 同时触发社区页跳转提示
      setTimeout(function () {
        if (window.toast) window.toast('下单已生成，可在「社区帮忙」查看');
        try { localStorage.setItem('hml_sm_order', JSON.stringify({ kind: '奶茶', name: name, ts: Date.now() })); } catch (e) {}
      }, 3500);
      return;
    }

    // 普通场景：联动多个设备
    addLog('小暖 AI', preset.icon + ' 启动「' + name + '」场景，联动 ' + preset.actions.length + ' 个设备');

    preset.actions.forEach(function (action, idx) {
      setTimeout(function () {
        updateDevice(action.d, action.val);
        addLog('小暖 AI', action.msg);
        syncACDisplay();
        syncDeviceChips();
        // 最后一个 action 后给个总结
        if (idx === preset.actions.length - 1) {
          setTimeout(function () {
            var summary = sceneSummary(name);
            if (summary) addLog('小暖 AI', summary, 'ai');
            addLog('小暖 AI', '📲 已通知家人：爸启动了「' + name + '」场景', 'ai');
          }, 600);
        }
      }, 400 + idx * 350);
    });
  }

  function sceneSummary(name) {
    if (name === '看电视剧') return '💡 老人一句话，4 设备同时响应，这就是智能家居生态。';
    if (name === '睡觉了') return '💤 5 设备同时关闭，比按 5 次遥控器强 100 倍。';
    if (name === '起夜') return '🌙 人体感应 30% 暖光，2 分钟无动作自动关。';
    if (name === '回家了') return '🏠 开门即享，4 设备联动欢迎回家。';
    if (name === '有点闷') return '🪟 AI 检测到 CO₂ 偏高，自动通风。';
    if (name === '扫地') return '🤖 清扫完自动回充，无需老人弯腰按按钮。';
    if (name === '心疼电费') return '💰 1 级能效空调 28°C 全天不到 6 块，老人再也不用舍不得开。';
    if (name === '小孩在家') return '🧒 4 设备联动，爷爷奶奶也能轻松带娃。';
    return '';
  }

  // ===== 同步健康档案 UI =====
  function syncHealthChips() {
    var keys = Object.keys(healthState);
    for (var i = 0; i < keys.length; i++) {
      var card = $(keys[i]);
      if (!card) continue;
      var chip = card.querySelector('.chip');
      if (healthState[keys[i]]) {
        card.classList.add('active');
        if (chip) { chip.textContent = '已启用'; chip.classList.add('active'); }
      }
    }
  }

  // ===== 语音按钮 =====
  document.addEventListener('DOMContentLoaded', function () {
    syncHealthChips();
    syncACDisplay();
    syncDeviceChips();
    var btn = $('voiceBtn');
    if (!btn) return;
    var t = null;
    var demoIdx = 0;
    var demos = ['看电视剧', '想喝奶茶', '睡觉了', '扫地', '心疼电费'];
    function startRec() {
      btn.classList.add('recording');
      if (window.toast) window.toast('🎤 正在听...');
      clearTimeout(t);
      t = setTimeout(function () {
        btn.classList.remove('recording');
        var cmd = demos[demoIdx % demos.length];
        demoIdx++;
        processCmd(cmd);
      }, 1800);
    }
    function endRec() {
      btn.classList.remove('recording');
      clearTimeout(t);
    }
    btn.addEventListener('mousedown', startRec);
    btn.addEventListener('touchstart', startRec, { passive: true });
    btn.addEventListener('mouseup', endRec);
    btn.addEventListener('mouseleave', endRec);
    btn.addEventListener('touchend', endRec);
  });
})();
