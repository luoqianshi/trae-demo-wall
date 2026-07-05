// 主流程控制器
const App = {
  content: null,
  currentPage: null,

  init() {
    this.content = getTodayContent();

    // 顶部状态栏
    document.getElementById('date-display').textContent = Storage.getDateDisplay();
    const streak = Storage.updateStreak();
    document.getElementById('streak-display').textContent = `第 ${streak} 天`;

    // 初始化模块
    Breathing.init();

    // 绑定事件
    this.bindEvents();

    // 首次访问弹窗
    if (!Storage.isFirstVisitDone()) {
      document.getElementById('first-guide-overlay').classList.remove('hidden');
    }

    this.showPage('splash-screen');
  },

  bindEvents() {
    // 首次引导关闭
    document.getElementById('guide-close-btn').addEventListener('click', () => {
      document.getElementById('first-guide-overlay').classList.add('hidden');
      Storage.markFirstVisitDone();
    });

    // 开始按钮 → 流程
    document.getElementById('start-btn').addEventListener('click', () => {
      this.startFlow();
    });

    // 早安消息 → 投递页
    document.getElementById('to-submit-btn').addEventListener('click', () => {
      this.showPage('submit-page');
    });

    // 提交留言
    document.getElementById('submit-btn').addEventListener('click', () => {
      this.submitMessage();
    });

    // 跳过投递 → 直接拆信
    document.getElementById('skip-submit-btn').addEventListener('click', () => {
      this.showLetter();
    });

    // 拆信 - 点击信封
    document.getElementById('letter-envelope').addEventListener('click', () => {
      this.openLetter();
    });

    // 读完信 → 结束页
    document.getElementById('letter-done-btn').addEventListener('click', () => {
      this.showPage('complete-page');
    });

    // 输入框字数统计
    document.getElementById('message-input').addEventListener('input', (e) => {
      const len = e.target.value.length;
      document.getElementById('char-count').textContent = `${len}/30`;
      document.getElementById('submit-error').classList.add('hidden');
    });
  },

  // 切换页面
  showPage(pageId) {
    document.querySelectorAll('.page').forEach(el => {
      el.classList.remove('active');
      el.classList.add('hidden');
    });
    const page = document.getElementById(pageId);
    page.classList.remove('hidden');
    page.classList.add('active');
    this.currentPage = pageId;
  },

  // ==== 开始当日流程 ====
  startFlow() {
    // 1. 解锁音频（必须在点击回调中同步执行）
    AudioPlayer.init();

    this.showPage('main-flow');

    // 显示短标题
    document.getElementById('flow-title').textContent = this.content.title;

    // 显示进度条
    const progressBar = document.getElementById('audio-progress');
    progressBar.classList.remove('hidden');
    document.getElementById('progress-bar').style.width = '0%';

    // 启动呼吸动画
    Breathing.start();

    // 音频进度
    AudioPlayer.onProgress = (pct) => {
      document.getElementById('progress-bar').style.width = pct + '%';
    };

    // 语音结束 → 早安消息
    AudioPlayer.onWakeEnd = () => {
      Breathing.stop();
      progressBar.classList.add('hidden');
      this.showMorningMessage();
    };

    // 播放唤醒语音
    AudioPlayer.playWakeAudio(this.content.audioFile);
  },

  // 早安消息页
  showMorningMessage() {
    document.getElementById('morning-message-text').textContent = this.content.morningMessage;
    this.showPage('morning-message-page');
  },

  // 提交留言
  submitMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    const errorEl = document.getElementById('submit-error');

    if (!text) {
      errorEl.textContent = '写点什么再投吧';
      errorEl.classList.remove('hidden');
      return;
    }

    if (!isMessageValid(text)) {
      errorEl.textContent = '请调整您的文字';
      errorEl.classList.remove('hidden');
      return;
    }

    // 保存留言
    MessagePool.saveMessage(text);
    input.value = '';
    document.getElementById('char-count').textContent = '0/30';

    // 进入拆信环节
    this.showLetter();
  },

  // 显示信封（无论是否投递都执行此步骤）
  showLetter() {
    // 重置拆信状态
    const envelope = document.getElementById('letter-envelope');
    envelope.classList.remove('opened');
    envelope.style.display = '';  // 恢复信封显示
    document.getElementById('letter-content').classList.add('hidden');

    // 填入信件内容
    document.getElementById('letter-body').textContent = MessagePool.getTodayLetter();

    this.showPage('letter-page');
  },

  // 拆开信封
  openLetter() {
    const envelope = document.getElementById('letter-envelope');

    // 播放打开动画
    envelope.classList.add('opened');

    // 动画结束后显示信纸
    setTimeout(() => {
      envelope.style.display = 'none';
      document.getElementById('letter-content').classList.remove('hidden');
    }, 800);
  }
};

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});