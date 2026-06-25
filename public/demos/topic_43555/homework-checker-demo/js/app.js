/**
 * 主应用逻辑
 * 负责页面初始化、事件绑定、批改流程控制、结果渲染
 * 支持真实 AI API (SiliconFlow) + Mock 数据 fallback
 */

var App = {

  currentDemoType: null,
  currentImageDataUrl: null,
  useRealAI: true,
  isGrading: false,
  gradingStartTime: 0,

  /**
   * 是否运行在 file:// 协议下（直接双击打开 HTML）
   */
  isFileProtocol: function() {
    return window.location.protocol === 'file:';
  },

  /**
   * 初始化
   */
  init: function() {
    ImageProcessor.init();
    this.bindEvents();
    this.initGuide();
    this.checkProtocol();
  },

  /**
   * 检测打开协议，如果是 file:// 则切换到演示模式并提示用户
   */
  checkProtocol: function() {
    if (this.isFileProtocol()) {
      // 关闭真实 AI，使用 Mock 演示数据
      this.useRealAI = false;
      // 显示演示模式提示条
      var banner = document.getElementById('demoModeBanner');
      if (banner) {
        banner.style.display = 'flex';
      }
      console.log('[Demo] 检测到 file:// 协议，已切换为演示模式（Mock 数据）');
    }
  },

  /**
   * 初始化引导页
   */
  initGuide: function() {
    var overlay = document.getElementById('guideOverlay');
    var startBtn = document.getElementById('guideStartBtn');
    var self = this;

    // 检查是否已经看过引导页
    if (localStorage.getItem('guideDismissed')) {
      overlay.style.display = 'none';
      return;
    }

    startBtn.addEventListener('click', function() {
      overlay.style.display = 'none';
      localStorage.setItem('guideDismissed', 'true');
    });
  },

  /**
   * 绑定事件
   */
  bindEvents: function() {
    var self = this;

    // 演示模式提示条关闭按钮
    var bannerClose = document.getElementById('demoBannerClose');
    if (bannerClose) {
      bannerClose.addEventListener('click', function() {
        var banner = document.getElementById('demoModeBanner');
        if (banner) banner.style.display = 'none';
      });
    }

    // 开始批改按钮
    document.getElementById('startCheckBtn').addEventListener('click', function() {
      if (self.isGrading) return;
      self.startGrading();
    });

    // 示例图片按钮
    var demoCards = document.querySelectorAll('.demo-card');
    demoCards.forEach(function(card) {
      card.addEventListener('click', function(e) {
        e.stopPropagation();
        var type = this.getAttribute('data-demo');
        self.loadDemoImage(type);
      });
    });

    // 再批改一份
    document.getElementById('checkAgainBtn').addEventListener('click', function() {
      self.resetAll();
    });
  },

  /**
   * 加载示例图片（使用 Canvas 生成模拟作业图片）
   */
  loadDemoImage: function(type) {
    this.currentDemoType = type;

    var canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    var ctx = canvas.getContext('2d');

    // 白色背景
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 600, 400);

    // 纸张纹理线条
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;
    for (var i = 40; i < 400; i += 28) {
      ctx.beginPath();
      ctx.moveTo(40, i);
      ctx.lineTo(560, i);
      ctx.stroke();
    }

    // 标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px sans-serif';
    var titles = { math: '数学作业 - 计算题', chinese: '语文作业 - 看拼音写词语', english: 'English Homework - Multiple Choice' };
    ctx.fillText(titles[type] || '作业', 40, 30);

    // 模拟手写内容
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#1a1a2e';

    if (type === 'math') {
      ctx.fillText('1. 25 + 37 = 62', 50, 70);
      ctx.fillText('2. 84 - 29 = 55', 50, 98);
      ctx.fillText('3. 12 x 6 = 62', 50, 126);
      ctx.fillText('4. 96 / 8 = 12', 50, 154);
      ctx.fillText('5. 45 + 38 - 20 = 53', 50, 182);
    } else if (type === 'chinese') {
      ctx.fillText('1. zhuo yue - 卓越', 50, 70);
      ctx.fillText('2. piao liang - 漂亮', 50, 98);
      ctx.fillText('3. xiong meng - 凶孟', 50, 126);
      ctx.fillText('4. can lan - 灿烂', 50, 154);
      ctx.fillText('5. jing rong - 敬容', 50, 182);
    } else {
      ctx.fillText('1. She ___ to school every day.', 50, 70);
      ctx.fillText('   A. go   B. goes   C. going   D. went', 50, 90);
      ctx.fillText('   Answer: B', 50, 112);
      ctx.fillText('2. There ___ a book and two pens on the desk.', 50, 140);
      ctx.fillText('   A. is   B. are   C. have   D. has', 50, 160);
      ctx.fillText('   Answer: B', 50, 182);
    }

    // 学生姓名
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#999';
    ctx.fillText('姓名：小明    日期：2026年6月24日', 400, 380);

    // 转为图片并显示预览
    var dataUrl = canvas.toDataURL('image/png');
    this.currentImageDataUrl = dataUrl;
    ImageProcessor.showPreview(dataUrl);
  },

  /**
   * 更新 loading 步骤状态
   */
  updateLoadingStep: function(step, message) {
    var steps = document.querySelectorAll('.loading-step');
    steps.forEach(function(el) {
      var stepNum = parseInt(el.getAttribute('data-step'));
      el.classList.remove('active', 'done');
      if (stepNum < step) {
        el.classList.add('done');
      } else if (stepNum === step) {
        el.classList.add('active');
      }
    });

    if (message) {
      document.getElementById('loadingText').textContent = message;
    }
  },

  /**
   * 开始批改
   */
  startGrading: function() {
    if (this.isGrading) return;
    this.isGrading = true;
    this.gradingStartTime = Date.now();
    var self = this;

    // 显示加载状态
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('resultSection').style.display = 'none';

    // 重置步骤状态
    this.updateLoadingStep(1, 'AI 正在识别图片中的题目...');

    // ★ 优先从预览 DOM 元素获取图片数据（最可靠，始终反映当前界面显示）
    var imageDataUrl = null;
    var previewImg = document.getElementById('previewImage');
    if (previewImg && previewImg.src && previewImg.src.startsWith('data:')) {
      imageDataUrl = previewImg.src;
      // 同步到内存变量，保证一致性
      this.currentImageDataUrl = imageDataUrl;
    } else if (this.currentImageDataUrl && this.currentImageDataUrl.startsWith('data:')) {
      // 后备：从内存变量读取
      imageDataUrl = this.currentImageDataUrl;
    }

    console.log('[DEBUG] currentDemoType:', this.currentDemoType);
    console.log('[DEBUG] imageDataUrl length:', imageDataUrl ? imageDataUrl.length : 0);
    console.log('[DEBUG] imageDataUrl prefix:', imageDataUrl ? imageDataUrl.substring(0, 50) : 'null');

    // ★ 校验图片数据是否就绪
    if (!imageDataUrl) {
      alert('图片尚未加载完成，请稍后再试');
      this.resetAll();
      return;
    }

    // 判断是否使用真实 AI
    if (this.useRealAI && imageDataUrl) {
      // 使用真实 AI API
      var base64 = AIService.dataUrlToBase64(imageDataUrl);
      var mimeType = AIService.dataUrlToMime(imageDataUrl);

      AIService.gradeHomework(base64, mimeType, function(step, message) {
        self.updateLoadingStep(step, message);
      })
      .then(function(result) {
        // 隐藏加载，显示结果
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('resultSection').style.display = 'block';

        // 渲染结果
        self.renderResult(result);
      })
      .catch(function(error) {
        console.error('AI 批改失败:', error);
        // ★ 显示错误信息给用户，而不是静默 fallback 到 Mock
        alert('AI 服务调用失败: ' + error.message + '\n\n请检查网络连接或 API 配置。');
        self.isGrading = false;
        // 回到上传页面，让用户可以重试
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'block';
      })
      .finally(function() {
        self.isGrading = false;
      });
    } else {
      // 使用 Mock 数据（无图片或关闭真实 AI 时）
      this.fallbackToMock();
    }
  },

  /**
   * Fallback 到 Mock 数据
   */
  fallbackToMock: function() {
    var self = this;

    // 更新 loading 提示
    var isRealImage = !this.currentDemoType;
    document.getElementById('loadingSub').textContent = isRealImage
      ? 'AI 服务暂时不可用，使用演示数据...'
      : 'AI 服务暂时不可用，使用演示模式...';

    setTimeout(function() {
      self.updateLoadingStep(3, '正在生成批改报告...');

      setTimeout(function() {
        var type = self.currentDemoType || 'random';
        var result = MockData.getGradingResult(type);

        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('resultSection').style.display = 'block';

        self.renderResult(result);
      }, 800);
    }, 1000);
  },

  /**
   * 渲染批改结果
   */
  renderResult: function(result) {
    var total = result.questions.length;
    var correctCount = 0;
    var wrongQuestions = [];

    result.questions.forEach(function(q) {
      if (q.isCorrect) {
        correctCount++;
      } else {
        wrongQuestions.push(q);
      }
    });

    var wrongCount = total - correctCount;
    var elapsed = ((Date.now() - this.gradingStartTime) / 1000).toFixed(1);

    // 渲染汇总
    this.renderSummary(total, correctCount, wrongCount, elapsed);

    // 渲染题目列表
    this.renderQuestions(result.questions);

    // 渲染错题汇总
    this.renderWrongSummary(wrongQuestions);
  },

  /**
   * 渲染汇总信息
   */
  renderSummary: function(total, correct, wrong, elapsed) {
    var summaryEl = document.getElementById('resultSummary');
    summaryEl.innerHTML =
      '<span class="summary-badge total">共 ' + total + ' 题</span>' +
      '<span class="summary-badge correct">' + correct + ' 对</span>' +
      '<span class="summary-badge wrong">' + wrong + ' 错</span>' +
      '<span class="summary-badge time">AI 用时 ' + elapsed + ' 秒</span>';
  },

  /**
   * 渲染题目列表
   */
  renderQuestions: function(questions) {
    var listEl = document.getElementById('questionList');
    listEl.innerHTML = '';

    questions.forEach(function(q) {
      var card = document.createElement('div');
      card.className = 'question-card ' + (q.isCorrect ? 'is-correct' : 'is-wrong');

      var statusText = q.isCorrect ? '正确' : '错误';
      var statusIcon = q.isCorrect
        ? '<svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M3 8l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

      var answerHtml = '';
      if (q.isCorrect) {
        answerHtml = '<div class="answer-row">' +
          '<div class="answer-item"><span>作答：</span><span class="student-answer">' + q.studentAnswer + '</span></div>' +
          '</div>';
      } else {
        answerHtml = '<div class="answer-row">' +
          '<div class="answer-item"><span>作答：</span><span class="wrong-answer">' + q.studentAnswer + '</span></div>' +
          '<div class="answer-item"><span>正确：</span><span class="correct-answer">' + q.correctAnswer + '</span></div>' +
          '</div>';
      }

      var explanationHtml = q.explanation
        ? '<div class="question-explanation">' + q.explanation + '</div>'
        : '';

      card.innerHTML =
        '<div class="question-top">' +
          '<span class="question-num">' + q.id + '</span>' +
          '<span class="question-status">' + statusIcon + ' ' + statusText + '</span>' +
        '</div>' +
        '<div class="question-body">' +
          '<div class="question-label">题目</div>' +
          '<div class="question-text">' + q.content.replace(/\n/g, '<br>') + '</div>' +
          answerHtml +
          explanationHtml +
        '</div>';

      listEl.appendChild(card);
    });
  },

  /**
   * 渲染错题汇总
   */
  renderWrongSummary: function(wrongQuestions) {
    var section = document.getElementById('wrongSummary');
    var list = document.getElementById('wrongList');

    if (wrongQuestions.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    list.innerHTML = '';

    wrongQuestions.forEach(function(q) {
      var item = document.createElement('div');
      item.className = 'wrong-item';
      item.innerHTML =
        '<span class="wrong-item-num">第' + q.id + '题</span>' +
        '<span class="wrong-item-text">' + q.content.replace(/\n/g, ' ') + '</span>';
      list.appendChild(item);
    });
  },

  /**
   * 重置所有状态
   */
  resetAll: function() {
    this.currentDemoType = null;
    this.currentImageDataUrl = null;
    this.isGrading = false;
    this.gradingStartTime = 0;
    ImageProcessor.resetUpload();

    document.getElementById('uploadSection').style.display = 'block';
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('questionList').innerHTML = '';
    document.getElementById('wrongSummary').style.display = 'none';

    // 重置 loading 步骤
    document.querySelectorAll('.loading-step').forEach(function(el) {
      el.classList.remove('active', 'done');
    });
    document.getElementById('loadingText').textContent = 'AI 正在分析作业中...';
    document.getElementById('loadingSub').textContent = '正在调用 SiliconFlow AI 多模态模型...';
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});