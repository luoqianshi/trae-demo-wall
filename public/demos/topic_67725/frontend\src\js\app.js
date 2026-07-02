/****************************
 * 见澄明 H5 - 主应用 (SPA, ES Module)
 * 集成 quiz.js + report.js，首页手风琴，hash 路由，状态管理
 ****************************/

import { UserAPI, EvalAPI, CoachAPI } from './config/api.js';
import { QuizController } from './quiz.js';
import { renderReport } from './report.js';
import { generatePoster } from './sharePoster.js';
import { CJIScorer } from './scoring.js';
import {
  PORTRAIT_DATA,
  PORTRAIT_ONE_LINER,
  INDEX_DATA,
  SHADOW_DATA,
  DEEP_DIAG_DATA,
  POSITION_DATA,
  CROSS_INTRO_TEXT,
  FAST_CROSS_DATA,
  AXIS_DATA
} from './report-data.js';
import { questionBank } from './questions.js';

const DATA_MAP = { PORTRAIT_DATA, INDEX_DATA, SHADOW_DATA, DEEP_DIAG_DATA, PORTRAIT_ONE_LINER, POSITION_DATA, CROSS_INTRO_TEXT, FAST_CROSS_DATA, AXIS_DATA };

const CJIApp = {
  state: {
    currentPage: 'home',
    quizMode: null,
    lastReport: null,
    expandedPanel: null, // 'eval' | 'train'
    userId: null
  },

  quizController: null,
  questionBank: null, // { fast: [], standard: [] }

  init() {
    this.loadState();
    this.questionBank = questionBank;
    this.loadUser();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
  },

  // ========== 用户加载 ==========
  async loadUser() {
    let userId = localStorage.getItem('cji_user_id');
    if (!userId) {
      try {
        const res = await UserAPI.create();
        userId = res.userId;
      } catch (err) {
        console.warn('后端未就绪，使用本地匿名用户:', err.message);
        userId = 'u_local_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(2, 6);
      }
      localStorage.setItem('cji_user_id', userId);
    }
    this.state.userId = userId;
  },

  // ========== 题库加载（由外部调用注入） ==========
  setQuestionBank(bank) {
    this.questionBank = bank;
  },

  // ========== 路由 ==========
  navigate(page, params = '') {
    location.hash = `#${page}${params ? '?' + params : ''}`;
  },

  handleRoute() {
    const hash = location.hash.slice(1) || 'home';
    const [page, params] = hash.split('?');
    this.state.currentPage = page;
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '';
    app.className = '';

    switch (page) {
      case 'home': this.renderHome(app); break;
      case 'quiz': this.renderQuizPage(app, params); break;
      case 'report': this.renderReportPage(app, params); break;
      case 'share': this.renderSharePage(app); break;
      case 'coach': this.renderCoach(app, params); break;
      case 'coach-summary': this.renderCoachSummary(app); break;
      default: this.renderHome(app);
    }
  },

  // ========== 状态持久化 ==========
  saveState() {
    localStorage.setItem('cji_app_state', JSON.stringify({
      lastReport: this.state.lastReport,
      expandedPanel: this.state.expandedPanel
    }));
  },

  loadState() {
    const saved = localStorage.getItem('cji_app_state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.state.lastReport = data.lastReport || null;
        this.state.expandedPanel = data.expandedPanel || null;
      } catch (e) { /* ignore */ }
    }
  },

  // ========== 首页（手风琴面板） ==========
  renderHome(container) {
    container.className = 'page-home';

    // 检查是否有答题草稿
    const qc = new QuizController();
    const hasDraft = qc.hasDraft();
    const draftMode = qc.getDraftMode();
    const modeLabel = draftMode === 'fast' ? '快速测评' : draftMode === 'standard' ? '标准测评' : '评测';

    container.innerHTML = `
      <div class="home-logo"><img src="见澄明头图.jpg" alt="见澄明"></div>
      <div class="home-title">澄明力</div>
      <div class="home-tagline">看清世界 · 了解自己 · 找到路径</div>

      <div class="accordion-panel ${this.state.expandedPanel === 'eval' ? 'active' : ''}" id="panel-eval">
        <div class="accordion-header" data-panel="eval">
          <div class="accordion-header-left">
            <span class="emoji">🔍</span>
            <div>
              <div class="title">测评</div>
              <div class="subtitle">看看你卡在哪一层</div>
            </div>
          </div>
          <span class="accordion-arrow">▼</span>
        </div>
        <div class="accordion-body">
          <div class="sub-card" data-action="quiz-fast">
            <div class="sub-card-info">
              <div class="sub-title">⚡ 快速测评</div>
              <div class="sub-desc">20题 · 约5.5分钟<br>三轴画像 · 一句话说透你</div>
            </div>
          </div>
          <div class="sub-card" data-action="quiz-standard">
            <div class="sub-card-info">
              <div class="sub-title">📐 标准测评</div>
              <div class="sub-desc">30题 · 约10分钟<br>完整报告 · 看清你的遮蔽</div>
            </div>
          </div>
          <div class="sub-card locked">
            <div class="sub-card-info">
              <div class="sub-title">🔬 深度测评</div>
              <div class="sub-desc">72题 · 约25分钟<br>全维度报告 · 训练方向</div>
            </div>
          </div>
          ${this.state.lastReport ? `
          <button class="btn-secondary" id="btn-view-report" style="margin-top:12px;width:calc(100% - 32px);max-width:100%;margin-left:auto;margin-right:auto;">
            📊 查看你的报告
          </button>
          ` : ''}
        </div>
      </div>

      <div class="accordion-panel ${this.state.expandedPanel === 'train' ? 'active' : ''}" id="panel-train">
        <div class="accordion-header" data-panel="train">
          <div class="accordion-header-left">
            <span class="emoji">🎯</span>
            <div>
              <div class="title">训练</div>
              <div class="subtitle">看得见场，读得懂自己，找得到路</div>
            </div>
          </div>
          <span class="accordion-arrow">▼</span>
        </div>
        <div class="accordion-body">
          <div class="sub-card" id="card-fast-train" style="cursor:pointer;">
            <div class="sub-card-info">
              <div class="sub-title">⚡ 快速训练</div>
              <div class="sub-desc" id="fast-train-desc">10分钟 · 聊一件事，想通一件事</div>
            </div>
          </div>
          <div class="sub-card locked">
            <div class="sub-card-info">
              <div class="sub-title">🌍 看清世界训练</div>
              <div class="sub-desc">第一轴 · 识别结构和约束</div>
            </div>
          </div>
          <div class="sub-card locked">
            <div class="sub-card-info">
              <div class="sub-title">❤️ 了解自己训练</div>
              <div class="sub-desc">第二轴 · 看清驱动和遮蔽</div>
            </div>
          </div>
          <div class="sub-card locked">
            <div class="sub-card-info">
              <div class="sub-title">🧭 找到路径训练</div>
              <div class="sub-desc">第三轴 · 约束映射与最小验证</div>
            </div>
          </div>
        </div>
      </div>

      <div class="home-footer">见澄明 2026</div>
    `;

    // 如果有未完成的草稿，弹出提示弹窗
    if (hasDraft) {
      this._showDraftModal(container, draftMode, modeLabel);
    }

    // 绑定手风琴点击事件
    container.querySelectorAll('.accordion-header').forEach(el => {
      el.addEventListener('click', () => {
        const panel = el.dataset.panel;
        this.togglePanel(panel);
      });
    });

    // 绑定测评卡片点击
    container.querySelector('[data-action="quiz-fast"]')?.addEventListener('click', () => this.startQuiz('fast'));
    container.querySelector('[data-action="quiz-standard"]')?.addEventListener('click', () => this.startQuiz('standard'));

    // 绑定"查看报告"按钮
    container.querySelector('#btn-view-report')?.addEventListener('click', () => {
      this.navigate('report');
    });

    // 绑定快速训练卡片
    const fastTrainCard = container.querySelector('#card-fast-train');
    const fastTrainDesc = container.querySelector('#fast-train-desc');
    if (fastTrainCard && fastTrainDesc) {
      const trainingBackup = localStorage.getItem('cji_training_backup');
      let hasActiveBackup = false;
      if (trainingBackup) {
        try { hasActiveBackup = JSON.parse(trainingBackup).status === 'active'; } catch (e) {}
      }
      if (hasActiveBackup) {
        fastTrainDesc.textContent = '上次没聊完 · 继续';
      } else if (this.state.lastReport) {
        fastTrainDesc.textContent = '基于你的报告 · 10分钟聊透一件事';
      } else {
        fastTrainDesc.textContent = '先做测评，解锁专属训练';
        fastTrainCard.style.opacity = '0.6';
      }
      fastTrainCard.addEventListener('click', () => {
        if (!this.state.lastReport && !hasActiveBackup) {
          this.startQuiz('fast');
          return;
        }
        if (!hasActiveBackup) localStorage.removeItem('cji_training_backup');
        this.navigate('coach');
      });
    }
  },

  // ========== 草稿弹窗 ==========
  _showDraftModal(container, draftMode, modeLabel) {
    const overlay = document.createElement('div');
    overlay.className = 'draft-modal-overlay';
    overlay.innerHTML = `
      <div class="draft-modal">
        <div class="draft-modal-icon">📝</div>
        <div class="draft-modal-title">你有未完成的${modeLabel}</div>
        <div class="draft-modal-desc">要继续上次，还是重新开始？</div>
        <div class="draft-modal-actions">
          <button class="draft-modal-btn draft-modal-btn-secondary" id="draft-redo">重做</button>
          <button class="draft-modal-btn draft-modal-btn-primary" id="draft-continue">继续</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 淡入动画
    requestAnimationFrame(() => overlay.classList.add('active'));

    document.getElementById('draft-continue').addEventListener('click', () => {
      document.body.removeChild(overlay);
      this.startQuiz(draftMode);
    });

    document.getElementById('draft-redo').addEventListener('click', () => {
      const qc = new QuizController();
      qc.clearQuiz();
      document.body.removeChild(overlay);
      this.startQuiz(draftMode);
    });
  },

  togglePanel(panel) {
    if (this.state.expandedPanel === panel) {
      this.state.expandedPanel = null;
    } else {
      this.state.expandedPanel = panel;
    }
    this.saveState();
    this.renderHome(document.getElementById('app'));
  },

  // ========== 答题页 ==========
  startQuiz(mode) {
    if (!this.questionBank) {
      console.error('题库未加载');
      return;
    }
    this.state.quizMode = mode;
    this.saveState();
    this.navigate('quiz', `mode=${mode}`);
  },

  renderQuizPage(container, params) {
    const mode = this.state.quizMode || 'fast';
    // v5.0：questionBank.fast/standard 是完整对象（含questions数组），需提取
    const bankEntry = mode === 'fast'
      ? (this.questionBank?.fast || this.questionBank)
      : (this.questionBank?.standard || this.questionBank);
    const questions = Array.isArray(bankEntry) ? bankEntry : (bankEntry?.questions || []);

    if (!questions.length) {
      container.innerHTML = '<div style="padding:40px;text-align:center;">题库加载中...</div>';
      return;
    }

    const total = questions.length;
    const minutes = mode === 'fast' ? 5.5 : 10;
    const modeLabel = mode === 'fast' ? '快速测评' : '标准测评';
    const descLabel = mode === 'fast' ? '20道题，看看你的三根轴转得怎么样' : '30道题，完整看你的认知飞轮';

    // 显示开始提示页
    container.className = 'page-quiz';
    container.innerHTML = `
      <div class="quiz-intro-page">
        <div class="quiz-intro-emoji">📝</div>
        <div class="quiz-intro-title">${modeLabel}</div>
        <div class="quiz-intro-desc">${descLabel}</div>
        <div class="quiz-intro-stats">
          <div class="quiz-intro-stat">
            <div class="quiz-intro-stat-value">${total}</div>
            <div class="quiz-intro-stat-label">道题</div>
          </div>
          <div class="quiz-intro-stat-divider"></div>
          <div class="quiz-intro-stat">
            <div class="quiz-intro-stat-value">~${minutes}</div>
            <div class="quiz-intro-stat-label">分钟</div>
          </div>
        </div>
        <div class="quiz-intro-tips">
          <div class="quiz-intro-tip">没有对错，跟着第一感觉选</div>
          <div class="quiz-intro-tip">题目按"看场→看己→找路"三轴混排</div>
        </div>
        <button class="btn-primary" id="quiz-start-btn" style="margin-top:28px;">准备好了，开始</button>
        <button class="btn-text" id="quiz-back-home" style="margin-top:8px;">返回首页</button>
      </div>
    `;

    document.getElementById('quiz-start-btn').addEventListener('click', () => {
      this._startActualQuiz(container, mode, questions);
    });

    document.getElementById('quiz-back-home').addEventListener('click', () => {
      this.goHome();
    });
  },

  _startActualQuiz(container, mode, questions) {
    // 初始化答题控制器
    this.quizController = new QuizController({
      onComplete: (payload) => {
        this.state.lastReport = payload;
        this.saveState();
        this.navigate('report');
      },
      onNavigateHome: () => this.goHome()
    });

    this.quizController.loadQuestions(mode, this.questionBank);
    this.quizController.renderQuestion(container);
  },

  // ========== 报告页 ==========
  renderReportPage(container) {
    if (!this.state.lastReport) {
      this.navigate('home');
      return;
    }

    // 先显示报告生成过渡页
    this._showReportTransition(container, () => {
      // 过渡动画完成后计算并渲染报告
      const { answers, questions, mode, elapsedMs } = this.state.lastReport;
      const scorer = new CJIScorer(answers, questions, mode, elapsedMs);
      const result = scorer.calculate();
      this.state.lastReportResult = result;
      this.saveState();

      renderReport(container, result, DATA_MAP, {
        onShare: () => this.navigate('share'),
        onCoach: () => this.navigate('coach'),
        onHome: () => this.goHome(),
        onStandard: () => this.startQuiz('standard')
      });

      // 添加复测按钮
      this._addRetestButton(container, mode);
    });
  },

  _showReportTransition(container, onDone) {
    container.className = 'page-report fade-in';
    let progress = 0;
    const totalSteps = 30;
    const steps = ['正在分析你的三轴坐标...', '正在匹配画像类型...', '正在生成生存力指数...', '正在编写你的光与山...'];
    let stepIdx = 0;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;padding:40px 24px;">
        <div style="font-size:48px;margin-bottom:20px;">🔍</div>
        <div style="font-size:20px;font-weight:bold;color:var(--text-primary);margin-bottom:16px;">报告生成中</div>
        <div id="report-transition-text" style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;min-height:24px;text-align:center;">${steps[0]}</div>
        <div style="width:100%;max-width:280px;height:8px;background:#E8DDD0;border-radius:4px;overflow:hidden;">
          <div id="report-transition-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#FFD700,#FF9500,#FF4D2E);border-radius:4px;transition:width 0.15s ease;"></div>
        </div>
        <div id="report-transition-pct" style="font-size:12px;color:var(--text-muted);margin-top:8px;">0%</div>
      </div>
    `;

    const bar = container.querySelector('#report-transition-bar');
    const pct = container.querySelector('#report-transition-pct');
    const text = container.querySelector('#report-transition-text');

    const interval = setInterval(() => {
      progress++;
      const pctVal = Math.round((progress / totalSteps) * 100);
      bar.style.width = pctVal + '%';
      pct.textContent = pctVal + '%';

      // 更新步骤文字
      const newStep = Math.floor((progress / totalSteps) * steps.length);
      if (newStep !== stepIdx && newStep < steps.length) {
        stepIdx = newStep;
        text.textContent = steps[stepIdx];
      }

      if (progress >= totalSteps) {
        clearInterval(interval);
        bar.style.width = '100%';
        pct.textContent = '100%';
        text.textContent = '✅ 生成完毕';
        setTimeout(onDone, 400);
      }
    }, 80);
  },

  async _addRetestButton(container, mode) {
    const btn = document.createElement('button');
    btn.className = 'btn-text';
    btn.id = 'btn-retest';
    btn.textContent = '检查复测资格...';
    btn.style.marginTop = '8px';
    container.appendChild(btn);

    try {
      const check = await EvalAPI.retestCheck(this.state.userId);
      if (check.canRetest) {
        btn.textContent = '重新评测';
        btn.disabled = false;
        btn.addEventListener('click', () => this.startQuiz(mode || 'standard'));
      } else {
        const days = check.daysSinceLastEval;
        btn.textContent = `复测冷却中（${days}天 / 需间隔7天）`;
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
      }
    } catch (err) {
      console.error('复测检查失败:', err);
      btn.textContent = '重新评测';
      btn.addEventListener('click', () => this.startQuiz(mode || 'standard'));
    }
  },

  // ========== 分享页 ==========
  renderSharePage(container) {
    if (!this.state.lastReportResult) {
      this.navigate('home');
      return;
    }

    container.className = 'page-share fade-in';
    container.innerHTML = `
      <div class="poster-wrapper">
        <canvas id="posterCanvas"></canvas>
      </div>
      <div class="share-actions">
        <button class="btn-primary" id="btn-download-poster">保存图片到相册</button>
        <button class="btn-text" id="btn-share-home">返回首页</button>
      </div>
      <div class="save-toast" id="save-toast" style="display:none;">图片已保存</div>
    `;

    const canvas = document.getElementById('posterCanvas');

    // 预加载logo图片
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      generatePoster(canvas, this.state.lastReportResult, logoImg);
    };
    logoImg.onerror = () => {
      generatePoster(canvas, this.state.lastReportResult, null);
    };
    logoImg.src = '见澄明头图.jpg';

    document.getElementById('btn-download-poster').addEventListener('click', () => {
      const btn = document.getElementById('btn-download-poster');
      const toast = document.getElementById('save-toast');
      btn.textContent = '保存中...';
      btn.disabled = true;
      try {
        const portrait = this.state.lastReportResult?.portrait || 'poster';
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `见澄明-${portrait}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // 显示提示
        if (toast) {
          toast.style.display = 'block';
          setTimeout(() => { toast.style.display = 'none'; }, 2000);
        }
      } catch (e) {
        // iOS Safari等不支持download的情况：弹出新窗口让用户长按保存
        const dataUrl = canvas.toDataURL('image/png');
        const win = window.open('');
        if (win) {
          win.document.write(`<html><head><title>长按保存图片</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:20px;background:#222;display:flex;flex-direction:column;align-items:center;}img{max-width:100%;height:auto;border-radius:8px;}p{color:#fff;font-size:14px;margin-top:16px;font-family:sans-serif;}</style></head><body><img src="${dataUrl}" alt="海报"><p>长按图片 → 保存到相册</p></body></html>`);
        }
      } finally {
        btn.textContent = '保存图片到相册';
        btn.disabled = false;
      }
    });

    document.getElementById('btn-share-home').addEventListener('click', () => {
      this.goHome();
    });
  },

  // ========== AI 陪练页（快速训练 · 6轮苏格拉底追问链） ==========
  renderCoach(container, params) {
    container.className = 'page-coach fade-in';

    // 尝试恢复备份
    const backup = this._loadCoachBackup();
    const report = this.state.lastReportResult;

    if (backup && backup.status === 'active') {
      this._coachState = {
        sessionId: backup.sessionId || null,
        round: backup.round || 0,
        history: backup.history || [],
        profile: backup.profile || null,
        isComplete: backup.isComplete || false
      };
    } else {
      this._coachState = {
        sessionId: null,
        round: 0,
        history: [],
        profile: report ? {
          portrait: report.portrait,
          shadow: report.shadow,
          deepDiag: report.deepDiag,
          threeAxes: report.threeAxes,
          fiveIndices: report.fiveIndices
        } : null,
        isComplete: false
      };
    }

    const hasHistory = this._coachState.history.length > 0;
    const isEnded = this._coachState.isComplete;

    container.innerHTML = `
      <div class="coach-header">
        <button class="coach-back-btn" id="coach-back">←</button>
        <div class="coach-header-title">快速训练 · 澄明 <span class="coach-demo-badge">Demo演示</span></div>
        <div class="coach-header-spacer"></div>
      </div>
      <div class="coach-chat-scroll" id="coach-chat">
        ${hasHistory ? this._renderCoachHistory(this._coachState.history) : ''}
      </div>
      <div class="coach-typing-wrap" id="coach-typing" style="display:none;">
        <div class="coach-avatar-small">澄</div>
        <div class="typing-bubble">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
      <div class="coach-bottom-area">
        <div class="coach-input-area ${isEnded ? 'ended' : ''}" id="coach-input-area">
          <textarea class="coach-textarea" id="coach-input" placeholder="${isEnded ? '训练已结束' : '说你想说的...'}" rows="1" ${isEnded ? 'disabled' : ''}></textarea>
          <button class="coach-send" id="coach-send" disabled>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22,2 15,22 11,13 2,9 22,2"></polygon></svg>
          </button>
        </div>
        <div class="coach-round-indicator" id="coach-round-badge">第 ${this._coachState.round}/6 轮</div>
      </div>
      <div class="coach-modal-overlay" id="coach-exit-modal" style="display:none;">
        <div class="coach-modal">
          <div class="coach-modal-title">退出训练？</div>
          <div class="coach-modal-desc">进度不会保存。</div>
          <div class="coach-modal-actions">
            <button class="coach-modal-btn btn-confirm" id="coach-exit-confirm">确认退出</button>
            <button class="coach-modal-btn btn-continue" id="coach-exit-cancel">继续训练</button>
          </div>
        </div>
      </div>
    `;

    // 绑定返回按钮
    document.getElementById('coach-back')?.addEventListener('click', () => this._showCoachExitModal());

    // 绑定输入和发送
    const input = document.getElementById('coach-input');
    const sendBtn = document.getElementById('coach-send');

    if (input && !isEnded) {
      input.addEventListener('input', () => {
        const hasText = !!input.value.trim();
        sendBtn.disabled = !hasText;
        if (hasText) sendBtn.classList.add('active');
        else sendBtn.classList.remove('active');

        // 自动调整高度
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (input.value.trim()) this.sendCoachMsg();
        }
      });
    }

    sendBtn?.addEventListener('click', () => this.sendCoachMsg());

    // 绑定弹窗按钮
    document.getElementById('coach-exit-confirm')?.addEventListener('click', () => {
      localStorage.removeItem('cji_training_backup');
      this.goHome();
    });
    document.getElementById('coach-exit-cancel')?.addEventListener('click', () => this._hideCoachExitModal());

    // 滚动到底部
    const chat = document.getElementById('coach-chat');
    if (chat) chat.scrollTop = chat.scrollHeight;

    // 启动会话或恢复状态
    if (!hasHistory && !isEnded) {
      this._initCoachSession();
    } else if (isEnded) {
      this._showCoachEndState();
      this._updateRoundBadge(this._coachState.round);
    } else {
      this._setTyping(false);
      this._updateRoundBadge(this._coachState.round);
    }
  },

  _renderCoachHistory(history) {
    let html = '';
    let lastRole = null;
    history.forEach(msg => {
      if (msg.role === 'assistant') {
        let content = msg.content.replace(/\n/g, '<br>');
        if (content.includes('认知锚点')) {
          content = content.replace(/认知锚点/g, '<strong style="color:#E8513E;">认知锚点</strong>');
        }
        const marginClass = lastRole === 'assistant' ? 'margin-small' : 'margin-large';
        html += `<div class="coach-msg-row ai ${marginClass}"><div class="coach-avatar-small">澄</div><div class="coach-msg ai">${content}</div></div>`;
        lastRole = 'assistant';
      } else if (msg.role === 'user') {
        const marginClass = lastRole === 'user' ? 'margin-small' : 'margin-large';
        html += `<div class="coach-msg-row user ${marginClass}"><div class="coach-msg user">${msg.content}</div></div>`;
        lastRole = 'user';
      }
    });
    return html;
  },

  _showCoachExitModal() {
    const modal = document.getElementById('coach-exit-modal');
    if (modal) modal.style.display = 'flex';
  },

  _hideCoachExitModal() {
    const modal = document.getElementById('coach-exit-modal');
    if (modal) modal.style.display = 'none';
  },

  _saveCoachBackup() {
    const cs = this._coachState;
    if (!cs) return;
    localStorage.setItem('cji_training_backup', JSON.stringify({
      status: cs.isComplete ? 'completed' : 'active',
      sessionId: cs.sessionId,
      round: cs.round,
      history: cs.history,
      profile: cs.profile,
      isComplete: cs.isComplete,
      savedAt: Date.now()
    }));
  },

  _loadCoachBackup() {
    const raw = localStorage.getItem('cji_training_backup');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  async _initCoachSession() {
    const cs = this._coachState;
    try {
      this._setTyping(true);
      const res = await CoachAPI.start(cs.profile);
      if (!res.success) throw new Error(res.message);

      cs.round = res.currentRound || 1;
      cs.sessionId = res.sessionId || cs.sessionId;
      cs.isComplete = res.isTrainingComplete || false;

      cs.history.push({ role: 'assistant', content: res.reply.content });
      this._saveCoachBackup();

      const isComplete = res.isTrainingComplete || res.reply.content.includes('认知锚点');

      this._showCoachMessage(res.reply.content, {
        isSummary: isComplete,
        callback: () => {
          this._setTyping(false);
          this._updateRoundBadge(res.currentRound);
          if (isComplete) {
            cs.isComplete = true;
            this._saveCoachBackup();
            this._showCoachEndState();
          }
        }
      });
    } catch (err) {
      console.error('启动训练失败:', err);
      this._setTyping(false);
      this._showCoachMessage('连接教练失败，请刷新页面重试。错误：' + err.message, { callback: () => this._setTyping(false) });
    }
  },

  _setTyping(isTyping) {
    const input = document.getElementById('coach-input');
    const sendBtn = document.getElementById('coach-send');
    const typingEl = document.getElementById('coach-typing');

    if (input && !this._coachState?.isComplete) {
      input.disabled = isTyping;
      input.placeholder = isTyping ? '教练正在思考...' : '说你想说的...';
    }
    if (sendBtn) {
      const hasText = input && input.value.trim();
      sendBtn.disabled = isTyping || !hasText;
      if (!isTyping && hasText) sendBtn.classList.add('active');
      else if (!hasText) sendBtn.classList.remove('active');
    }
    if (typingEl) typingEl.style.display = isTyping ? 'flex' : 'none';
  },

  _updateRoundBadge(round) {
    const badge = document.getElementById('coach-round-badge');
    if (badge) badge.textContent = `第 ${round}/6 轮`;
  },

  _showCoachMessage(text, options = {}) {
    const chat = document.getElementById('coach-chat');
    if (!chat) return;

    let content = text.replace(/\n/g, '<br>');
    if (options.isSummary) {
      content = content.replace(/认知锚点/g, '<strong style="color:#E8513E;">认知锚点</strong>');
    }

    const lastRow = chat.querySelector('.coach-msg-row:last-child');
    const lastRole = lastRow?.classList.contains('ai') ? 'assistant' : null;
    const marginClass = lastRole === 'assistant' ? 'margin-small' : 'margin-large';

    const row = document.createElement('div');
    row.className = `coach-msg-row ai ${marginClass}`;
    row.innerHTML = `<div class="coach-avatar-small">澄</div><div class="coach-msg ai">${content}</div>`;
    row.style.opacity = '0';
    row.style.transform = 'translateY(8px)';
    row.style.transition = 'all 0.3s ease';

    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;

    requestAnimationFrame(() => {
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
      chat.scrollTop = chat.scrollHeight;
    });

    if (options.callback) setTimeout(options.callback, 300);
  },

  _showUserMessage(text) {
    const chat = document.getElementById('coach-chat');
    if (!chat) return;

    const lastRow = chat.querySelector('.coach-msg-row:last-child');
    const lastRole = lastRow?.classList.contains('user') ? 'user' : null;
    const marginClass = lastRole === 'user' ? 'margin-small' : 'margin-large';

    const row = document.createElement('div');
    row.className = `coach-msg-row user ${marginClass}`;
    row.innerHTML = `<div class="coach-msg user">${text}</div>`;
    row.style.opacity = '0';
    row.style.transform = 'translateY(8px)';
    row.style.transition = 'all 0.3s ease';

    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;

    requestAnimationFrame(() => {
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
      chat.scrollTop = chat.scrollHeight;
    });
  },

  async sendCoachMsg() {
    const input = document.getElementById('coach-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const cs = this._coachState;
    if (!cs || cs.isComplete) return;

    // 显示用户消息
    this._showUserMessage(text);

    // 记录到历史
    cs.history.push({ role: 'user', content: text });
    input.value = '';
    input.style.height = 'auto';

    const sendBtn = document.getElementById('coach-send');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.classList.remove('active');
    }

    this._setTyping(true);

    try {
      const messages = cs.history.filter(m => m.role !== 'system');
      const res = await CoachAPI.message(messages, cs.profile, cs.round + 1);
      if (!res.success) throw new Error(res.message);

      cs.round = res.currentRound;
      cs.sessionId = res.sessionId || cs.sessionId;
      cs.isComplete = res.isTrainingComplete || false;

      cs.history.push({ role: 'assistant', content: res.reply.content });
      this._saveCoachBackup();

      const isComplete = res.isTrainingComplete || res.reply.content.includes('认知锚点');

      this._showCoachMessage(res.reply.content, {
        isSummary: isComplete,
        callback: () => {
          this._setTyping(false);
          this._updateRoundBadge(res.currentRound);

          if (isComplete) {
            cs.isComplete = true;
            this._saveCoachBackup();
            this._showCoachEndState();
          }
        }
      });
    } catch (err) {
      console.error('发送消息失败:', err);
      this._setTyping(false);
      this._showCoachMessage('教练暂时无法回应，请稍后再试。错误：' + err.message);
    }
  },

  _showCoachEndState() {
    const cs = this._coachState;
    const inputArea = document.getElementById('coach-input-area');
    const input = document.getElementById('coach-input');
    const sendBtn = document.getElementById('coach-send');
    const badge = document.getElementById('coach-round-badge');

    if (inputArea) inputArea.classList.add('ended');
    if (input) {
      input.disabled = true;
      input.placeholder = '训练已结束';
    }
    if (sendBtn) sendBtn.disabled = true;
    if (badge) badge.textContent = '已完成';

    const chat = document.getElementById('coach-chat');
    if (chat && !chat.querySelector('.coach-end-row')) {
      const row = document.createElement('div');
      row.className = 'coach-msg-row coach-end-row';
      row.innerHTML = `<div class="coach-end-divider"></div><button class="coach-end-btn" id="coach-end-btn">结束训练 →</button>`;
      chat.appendChild(row);
      chat.scrollTop = chat.scrollHeight;

      document.getElementById('coach-end-btn')?.addEventListener('click', () => {
        const lastMsg = cs.history[cs.history.length - 1];
        this._coachShowFeedback(lastMsg?.content || '');
      });
    }
  },

  _coachShowFeedback(summary) {
    const chat = document.getElementById('coach-chat');
    if (!chat) return;

    const inputArea = document.getElementById('coach-input-area');
    if (inputArea) inputArea.style.display = 'none';

    const badge = document.getElementById('coach-round-badge');
    if (badge) badge.textContent = '已完成';

    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'coach-feedback';
    feedbackEl.innerHTML = `
      <div class="coach-feedback-title">训练完成</div>
      <div class="coach-feedback-summary">${summary.replace(/\n/g, '<br>').replace(/认知锚点/g, '<strong style="color:#E8513E;">认知锚点</strong>')}</div>
      <div class="coach-feedback-form">
        <div class="form-row">
          <label>学习收获</label>
          <select id="feedback-learning">
            <option value="">请选择</option>
            <option value="1">1 - 很少</option>
            <option value="2">2 - 较少</option>
            <option value="3">3 - 一般</option>
            <option value="4">4 - 较多</option>
            <option value="5">5 - 很多</option>
          </select>
        </div>
        <div class="form-row">
          <label>自我觉察</label>
          <select id="feedback-awareness">
            <option value="">请选择</option>
            <option value="1">1 - 很少</option>
            <option value="2">2 - 较少</option>
            <option value="3">3 - 一般</option>
            <option value="4">4 - 较多</option>
            <option value="5">5 - 很多</option>
          </select>
        </div>
        <div class="form-row">
          <label>推荐意愿</label>
          <select id="feedback-nps">
            <option value="">请选择</option>
            <option value="1">1 - 不太可能</option>
            <option value="2">2 - 较少可能</option>
            <option value="3">3 - 一般</option>
            <option value="4">4 - 比较可能</option>
            <option value="5">5 - 非常可能</option>
          </select>
        </div>
        <div class="form-row">
          <label>最大发现（可选）</label>
          <textarea id="feedback-finding" rows="2" placeholder="用一句话记录你最大的发现..."></textarea>
        </div>
        <button class="coach-feedback-submit" id="coach-submit-feedback">提交反馈</button>
      </div>
      <div class="coach-feedback-actions">
        <button class="btn-text" id="coach-home">返回首页</button>
        <button class="coach-feedback-restart" id="coach-restart">再来一次</button>
      </div>
    `;
    chat.appendChild(feedbackEl);
    chat.scrollTop = chat.scrollHeight;

    document.getElementById('coach-submit-feedback')?.addEventListener('click', async () => {
      const cs = this._coachState;
      const learningScore = parseInt(document.getElementById('feedback-learning')?.value);
      const awarenessScore = parseInt(document.getElementById('feedback-awareness')?.value);
      const npsScore = parseInt(document.getElementById('feedback-nps')?.value);
      const bestFinding = document.getElementById('feedback-finding')?.value.trim();

      if (!learningScore || !awarenessScore || !npsScore) {
        alert('请完成三项评分');
        return;
      }

      try {
        await CoachAPI.feedback(cs.sessionId, learningScore, awarenessScore, npsScore, bestFinding);
        const btn = document.getElementById('coach-submit-feedback');
        btn.textContent = '已提交';
        btn.disabled = true;
        localStorage.removeItem('cji_training_backup');
      } catch (err) {
        console.error('提交反馈失败:', err);
        alert('提交失败，请重试');
      }
    });

    document.getElementById('coach-restart')?.addEventListener('click', () => {
      localStorage.removeItem('cji_training_backup');
      this.renderCoach(document.getElementById('app'));
    });
    document.getElementById('coach-home')?.addEventListener('click', () => this.goHome());
  },

  // ========== 训练总结页 ==========
  renderCoachSummary(container) {
    container.className = 'page-coach-summary fade-in';

    // 获取训练数据
    let state = this._coachState;
    if (!state) {
      try {
        const backup = localStorage.getItem('cji_training_backup');
        if (backup) state = JSON.parse(backup);
      } catch (e) { /* ignore */ }
    }

    // 从AI对话历史中提取认知锚点（最后一条assistant消息）
    const history = state?.history || [];
    let anchorText = '训练总结暂未生成，请完成训练后查看。';
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'assistant') {
        anchorText = history[i].content;
        break;
      }
    }

    // 三轴穿透结果
    const report = this.state.lastReportResult;
    const threeAxes = report?.threeAxes || {};

    const jiancha = threeAxes.jiancha || threeAxes.see || '看清世界是第一轴。练的是识别外部结构、约束和退出方式——这件事外面发生了什么？什么规矩在起作用？';
    const chengxing = threeAxes.chengxing || threeAxes.reflect || '找到路径是第三轴。练的是约束映射和最小验证——什么能变什么不能变？48小时能做的最小动作是什么？';
    const mingding = threeAxes.mingding || threeAxes.decide || '了解自己是第二轴。练的是看清驱动和遮蔽——什么在推我？什么在卡我？我真正在意什么？';

    container.innerHTML = `
      <div class="coach-summary-content">
        <div class="coach-summary-title">训练完成</div>

        <div class="cognitive-anchor-card">
          <div class="cognitive-anchor-label">认知锚点</div>
          <div class="cognitive-anchor-text">${anchorText.replace(/\n/g, '<br>')}</div>
        </div>

        <div class="three-axis-section">
          <div class="three-axis-title">三阶穿透结果</div>
          <div class="three-axis-result">
            <div class="three-axis-item">
              <span class="three-axis-label">🌍 看清世界：</span>
              <span class="three-axis-value">${jiancha}</span>
            </div>
            <div class="three-axis-item">
              <span class="three-axis-label">❤️ 了解自己：</span>
              <span class="three-axis-value">${mingding}</span>
            </div>
            <div class="three-axis-item">
              <span class="three-axis-label">🧭 找到路径：</span>
              <span class="three-axis-value">${chengxing}</span>
            </div>
          </div>
        </div>

        <div class="summary-actions">
          <button class="btn-primary" id="btn-save-record">保存训练记录</button>
          <button class="btn-secondary" id="btn-remind-retest">7天后复测提醒</button>
        </div>

        <div class="feedback-section-coach">
          <div class="feedback-section-title">训练反馈</div>

          <div class="feedback-item">
            <div class="feedback-question">今天学到了新东西吗？</div>
            <div class="star-rating" data-question="learning">
              <span class="star" data-value="1">☆</span>
              <span class="star" data-value="2">☆</span>
              <span class="star" data-value="3">☆</span>
              <span class="star" data-value="4">☆</span>
              <span class="star" data-value="5">☆</span>
            </div>
          </div>

          <div class="feedback-item">
            <div class="feedback-question">对自己有了新认识吗？</div>
            <div class="star-rating" data-question="awareness">
              <span class="star" data-value="1">☆</span>
              <span class="star" data-value="2">☆</span>
              <span class="star" data-value="3">☆</span>
              <span class="star" data-value="4">☆</span>
              <span class="star" data-value="5">☆</span>
            </div>
          </div>

          <div class="feedback-item">
            <div class="feedback-question">会推荐给朋友吗？</div>
            <div class="star-rating" data-question="nps">
              <span class="star" data-value="1">☆</span>
              <span class="star" data-value="2">☆</span>
              <span class="star" data-value="3">☆</span>
              <span class="star" data-value="4">☆</span>
              <span class="star" data-value="5">☆</span>
            </div>
          </div>

          <div class="feedback-finding">
            <div class="feedback-question">一句话最大发现：</div>
            <textarea class="feedback-textarea" id="feedback-finding-text" rows="2" placeholder="用一句话记录你最大的发现..."></textarea>
          </div>

          <button class="btn-primary feedback-submit-btn" id="btn-submit-feedback">提交反馈</button>
        </div>
      </div>

      <div class="coach-summary-footer">
        <button class="btn-text" id="btn-summary-home">返回首页</button>
      </div>
    `;

    // 星星评分交互
    const ratings = { learning: 0, awareness: 0, nps: 0 };
    container.querySelectorAll('.star-rating').forEach(ratingEl => {
      const question = ratingEl.dataset.question;
      const stars = ratingEl.querySelectorAll('.star');

      stars.forEach((star) => {
        star.addEventListener('click', () => {
          const value = parseInt(star.dataset.value);
          ratings[question] = value;
          stars.forEach((s, i) => {
            s.textContent = i < value ? '★' : '☆';
            s.classList.toggle('active', i < value);
          });
        });
      });
    });

    // 保存训练记录
    document.getElementById('btn-save-record')?.addEventListener('click', () => {
      try {
        const record = {
          date: new Date().toISOString(),
          anchor: anchorText,
          threeAxes: { jiancha, chengxing, mingding },
          history: history
        };
        const records = JSON.parse(localStorage.getItem('cji_training_records') || '[]');
        records.push(record);
        localStorage.setItem('cji_training_records', JSON.stringify(records));
        alert('训练记录已保存');
      } catch (e) {
        alert('保存失败');
      }
    });

    // 7天后复测提醒
    document.getElementById('btn-remind-retest')?.addEventListener('click', () => {
      const remindDate = new Date();
      remindDate.setDate(remindDate.getDate() + 7);
      localStorage.setItem('cji_retest_remind', remindDate.toISOString());
      alert('已设置7天后复测提醒');
    });

    // 提交反馈
    document.getElementById('btn-submit-feedback')?.addEventListener('click', async () => {
      if (!ratings.learning || !ratings.awareness || !ratings.nps) {
        alert('请完成三项评分');
        return;
      }
      const bestFinding = document.getElementById('feedback-finding-text')?.value?.trim() || '';
      try {
        await CoachAPI.feedback(state?.sessionId || null, ratings.learning, ratings.awareness, ratings.nps, bestFinding);
        const btn = document.getElementById('btn-submit-feedback');
        btn.textContent = '已提交';
        btn.disabled = true;
      } catch (err) {
        console.error('提交反馈失败:', err);
        alert('提交失败，请重试');
      }
    });

    // 返回首页
    document.getElementById('btn-summary-home')?.addEventListener('click', () => this.goHome());
  },

  goHome() {
    if (this.quizController) {
      this.quizController.clearQuiz();
      this.quizController = null;
    }
    this.state.quizMode = null;
    this.saveState();
    this.navigate('home');
  }
};

// 挂载到全局（供 HTML 内联事件或调试使用）
window.CJIApp = CJIApp;

// 模块脚本已是 defer，DOM 已就绪，直接初始化
CJIApp.init();

export default CJIApp;
