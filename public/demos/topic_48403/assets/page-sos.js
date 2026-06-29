/* page-sos.js · SOS 紧急流程演示 · 30s 反馈机制 + AI 音频拨 120 + 短信推送 */
(function () {
  'use strict';

  var state = 'idle';   // idle | counting | escalating | cancelled
  var scenario = 'elder'; // elder | child
  var cdTimer = null;
  var remain = 30;
  var cdEl = null;
  var cdNumEl = null;
  var logEl = null;
  var pressTimer = null;
  var pressStart = 0;

  function $(id) { return document.getElementById(id); }

  function ts() {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function log(msg, cls) {
    if (!logEl) logEl = $('log');
    var div = document.createElement('div');
    var span = document.createElement('span');
    span.className = 'ts';
    span.textContent = '[' + ts() + ']';
    div.appendChild(span);
    var t = document.createElement('span');
    if (cls) t.className = cls;
    t.textContent = ' ' + msg;
    div.appendChild(t);
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function show(stage) {
    ['Idle', 'Alert', 'Escal', 'Cancel'].forEach(function (s) {
      var el = $('stage' + s);
      if (el) el.style.display = (s === stage) ? '' : 'none';
    });
  }

  function setStatusBar(mode, time) {
    var sm = $('sbMode');
    var st = $('sbTime');
    if (sm) sm.textContent = mode;
    if (time && st) st.textContent = time;
  }

  function setCountdown(p) {
    if (!cdEl) return;
    cdEl.style.setProperty('--p', p);
  }

  function clearCountdown() {
    if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
  }

  function refreshIdle() {
    if (scenario === 'child') {
      $('idleAvatar').textContent = '团';
      $('idleGreet').textContent = '团团，今天在家乖不乖呀？';
    } else {
      $('idleAvatar').textContent = '爷';
      $('idleGreet').textContent = '爸，今天感觉怎么样？';
    }
  }

  // ===== 长按触发 =====
  function bindPress() {
    var btn = $('sosBtn');
    if (!btn) return;
    function start(e) {
      e.preventDefault();
      pressStart = Date.now();
      btn.classList.add('pressing');
      pressTimer = setTimeout(function () {
        if (Date.now() - pressStart >= 2900) {
          log('长按 3 秒触发 · 自动进入反馈窗', 'warn');
          enterCountdown(false);
        }
      }, 3000);
    }
    function cancel(e) {
      btn.classList.remove('pressing');
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      if (Date.now() - pressStart < 2909) {
        if (window.toast) window.toast('请长按 3 秒触发紧急流程');
      }
    }
    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('mouseup', cancel);
    btn.addEventListener('mouseleave', cancel);
    btn.addEventListener('touchend', cancel);
  }

  // ===== 演示场景 =====
  window.demoScenario = function (kind) {
    resetAll(true);
    setTimeout(function () { triggerByScenario(kind); }, 300);
  };

  function triggerByScenario(kind) {
    var role = scenario === 'child' ? '儿童团团' : '父亲';
    var countdownSec = scenario === 'child' ? 10 : 30;

    if (kind === 'fall_auto') {
      log('📡 设备检测到剧烈撞击（疑似' + role + '摔倒/受伤）', 'warn');
      log('AI 启动 ' + countdownSec + 's 反馈窗...', 'ok');
      enterCountdown(true);
    } else if (kind === 'fall_voice') {
      log('🎤 识别到语音："哎哟……痛……"（关键词命中）', 'warn');
      log('AI 立即升级（跳过倒计时）', 'ok');
      enterEscalate('voice');
    } else if (kind === 'false_alarm') {
      log('👆 长按 3 秒触发', 'ok');
      log('AI 启动 ' + countdownSec + 's 反馈窗...', 'ok');
      enterCountdown(false, true);
    }
  }

  // ===== 进入倒计时 =====
  function enterCountdown(simulateSilence, allowCancelDemo) {
    state = 'counting';
    setStatusBar(scenario === 'child' ? '紧急 · 儿童' : '紧急 · 30s', '14:20');
    show('Alert');
    var total = scenario === 'child' ? 10 : 30;
    remain = total;
    cdEl = $('countdown');
    cdNumEl = $('cdNum');
    if (cdNumEl) cdNumEl.textContent = '' + total;
    setCountdown(0);

    if (allowCancelDemo) {
      setTimeout(function () {
        if (state === 'counting') {
          log('👂 ' + (scenario === 'child' ? '儿童' : '老人') + '主动回应"我没事"', 'ok');
          userResponse('imok', true);
        }
      }, scenario === 'child' ? 4000 : 10000);
    } else if (simulateSilence) {
      var demoTotal = scenario === 'child' ? 6 : 12;
      remain = demoTotal;
      if (cdNumEl) cdNumEl.textContent = '' + demoTotal;
      log('⏱ 演示加速中：' + total + 's 反馈窗压缩为 ' + demoTotal + 's（无回应 → 升级）');
    }

    clearCountdown();
    cdTimer = setInterval(function () {
      remain--;
      if (cdNumEl) cdNumEl.textContent = '' + Math.max(remain, 0);
      var totalSec = scenario === 'child' ? (simulateSilence ? 6 : 10) : (simulateSilence ? 12 : 30);
      var passed = totalSec - remain;
      setCountdown(Math.min(passed * 100 / totalSec, 100));
      if (remain <= 0) {
        clearCountdown();
        if (state === 'counting') {
          log('⏰ 倒计时内无回应 → AI 判定为严重情况', 'warn');
          if (scenario === 'child') {
            log('🧒 儿童模式：跳过"我没事"取消，直接升级', 'warn');
          }
          log('🆘 自动升级：120 音频 + 短信 + 家属 + 社区', 'warn');
          enterEscalate('silence');
        }
      }
    }, 1000);
  }

  // ===== 用户主动回应 =====
  window.userResponse = function (kind, isDemo) {
    if (state !== 'counting') return;
    clearCountdown();
    if (kind === 'imok') {
      state = 'cancelled';
      log('👂 ' + (scenario === 'child' ? '儿童' : '老人') + '主动回应"我没事" → 取消升级', 'ok');
      show('Cancel');
      setStatusBar('已取消', '14:20');
    } else if (kind === 'help') {
      state = 'escalating';
      log('🆘 ' + (scenario === 'child' ? '儿童' : '老人') + '主动回应"救命" → 立即升级', 'warn');
      log('🆘 同时：120 音频 + 短信 + 家属 + 社区', 'warn');
      enterEscalate('voice');
    }
  };

  // ===== 升级 =====
  function enterEscalate(reason) {
    state = 'escalating';
    show('Escal');
    setStatusBar('紧急救援中', '14:21');
    log('📞 AI 模拟音频拨打 120 · 播报地址+情况+联系人...', 'ok');
    setTimeout(function () { log('✅ 120 已接听 AI 音频 · 预计 8 分钟到达', 'ok'); }, 1200);
    setTimeout(function () { log('📲 已发送结构化短信 → 120 调度平台', 'ok'); }, 1800);
    setTimeout(function () { log('📱 已推送家属 · 儿子小明正在回拨', 'ok'); }, 2400);
    if (scenario === 'child') {
      setTimeout(function () { log('🧒 已联系儿童监护人 · 爸爸、奶奶、外公', 'ok'); }, 3000);
      setTimeout(function () { log('🏘 社区志愿者王老师 · 3 分钟内上门', 'ok'); }, 3600);
    } else {
      setTimeout(function () { log('🏘 社区网格员小李已接到通知 · 正在赶来', 'ok'); }, 3000);
    }
    setTimeout(function () { log('💬 AI 持续陪护中 · 已开始播放安抚语音', 'ok'); }, 4200);
  }

  // ===== 重置 =====
  window.resetAll = function (silent) {
    clearCountdown();
    state = 'idle';
    remain = 30;
    show('Idle');
    setStatusBar(scenario === 'child' ? '儿童在家' : '日常', '09:42');
    refreshIdle();
    if (!silent) {
      log('🔄 演示已重置');
      if (window.toast) window.toast('已重置');
    }
  };

  // ===== 场景切换 =====
  function bindScenarioTabs() {
    var tabs = document.querySelectorAll('.sos-scenario-tabs .chip');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
        this.classList.add('active');
        scenario = this.getAttribute('data-scenario');
        resetAll(true);
        log('🔄 切换场景：' + (scenario === 'child' ? '🧒 留守儿童' : '👴 独居老人'));
        if (window.toast) window.toast('已切换：' + (scenario === 'child' ? '儿童模式' : '老人模式'));
      });
    }
  }

  // ===== 初始化 =====
  document.addEventListener('DOMContentLoaded', function () {
    bindPress();
    bindScenarioTabs();
    logEl = $('log');
    log('🟢 AI 陪护系统就绪');
    log('💡 提示：可长按右侧 SOS 按钮，或点击左侧"演示"按钮');
  });
})();
