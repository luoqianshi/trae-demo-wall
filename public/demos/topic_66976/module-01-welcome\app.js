/**
 * 模块1：欢迎与引导
 */

(function() {
  'use strict';

  // DOM 元素
  const els = {
    weekday: document.getElementById('weekday'),
    dateFull: document.getElementById('dateFull'),
    greetingTitle: document.getElementById('greetingTitle'),
    avatarInitial: document.getElementById('avatarInitial'),
    profileName: document.getElementById('profileName'),
    profileHint: document.getElementById('profileHint'),
    profileAvatar: document.getElementById('profileAvatar'),
    startBtn: document.getElementById('startBtn'),
    speakBtn: document.getElementById('speakBtn'),
    weatherText: document.getElementById('weatherText')
  };

  /**
   * 初始化
   */
  function init() {
    updateDate();
    loadProfile();
    bindEvents();

    // 发布应用就绪事件
    EventBus.emit(EVENTS.APP_READY, { module: 'welcome' });
  }

  /**
   * 更新日期显示
   */
  function updateDate() {
    const now = new Date();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

    if (els.weekday) {
      els.weekday.textContent = weekdays[now.getDay()];
    }

    if (els.dateFull) {
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      els.dateFull.textContent = `${year}年${month}月${day}日`;
    }
  }

  /**
   * 加载个人档案
   */
  function loadProfile() {
    const profile = Storage.get(StorageKeys.PROFILE);

    if (profile && profile.name) {
      if (els.profileName) {
        els.profileName.textContent = profile.name;
      }
      if (els.avatarInitial) {
        els.avatarInitial.textContent = profile.name.charAt(0);
      }
      if (els.profileHint) {
        const age = profile.birthYear ? (new Date().getFullYear() - profile.birthYear) : '';
        els.profileHint.textContent = age ? `${age}岁 · ${profile.hometown || ''}` : '很高兴见到您';
      }
      if (els.greetingTitle) {
        const hour = new Date().getHours();
        let greeting = '欢迎回来';
        if (hour < 12) greeting = '早上好';
        else if (hour < 18) greeting = '下午好';
        else greeting = '晚上好';
        els.greetingTitle.textContent = `${greeting}，${profile.name}`;
      }

      // 如果有头像照片
      if (profile.photo && els.profileAvatar) {
        els.profileAvatar.innerHTML = `<img src="${profile.photo}" alt="${profile.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      }
    }
  }

  /**
   * 语音播报欢迎语
   */
  function speakWelcome() {
    const profile = Storage.get(StorageKeys.PROFILE);
    const name = profile && profile.name ? profile.name : '您好';
    const hour = new Date().getHours();
    let greeting = '欢迎回来';
    if (hour < 12) greeting = '早上好';
    else if (hour < 18) greeting = '下午好';
    else greeting = '晚上好';

    const text = `${greeting}，${name}。今天是${els.dateFull.textContent}。让我们一起开始今天的回忆之旅吧。`;
    speakText(text);
  }

  /**
   * 语音播报
   */
  function speakText(text) {
    if (!window.speechSynthesis) {
      console.warn('[Welcome] 浏览器不支持语音播报');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    if (els.startBtn) {
      els.startBtn.addEventListener('click', () => {
        // 默认进入照片回忆模块
        window.location.href = '../module-04-photo-memory/index.html';
      });
    }

    if (els.speakBtn) {
      els.speakBtn.addEventListener('click', speakWelcome);
    }

    // 监听档案更新事件
    EventBus.on(EVENTS.PROFILE_UPDATED, loadProfile);
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
