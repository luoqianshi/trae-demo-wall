/**
 * ================================================================
 * app.js — NeuroFocus 主控制器 v3.0
 * ================================================================
 * 负责：
 * - 页面导航
 * - 设备连接模拟
 * - Focus Session 启动/停止
 * - Brain Break 休息功能
 * - 场景切换
 * - 实时数据更新与反馈
 * - 智能提醒
 * - 报告数据生成
 * ================================================================
 */

const App = {

  // ---------- 全局状态 ----------
  state: {
    currentPage: 'home',
    // v36: Unified device state machine — primary source of truth
    device: {
      fit: 'notWorn',         // notWorn | checking | goodFit | looseFit
      sync: 'idle',           // idle | syncing | synced
      baseline: 'pending',    // pending | building | ready
      monitoring: 'idle'      // idle | live | paused
    },
    brainBreak: false,
    monitorStartTime: null,
    monitorDuration: 0,
    metricsHistory: {
      focus: [], fatigue: [], cognitiveLoad: [], calmness: [], signalQuality: []
    },
    recoveryHistory: {
      participation: [], fatigueRisk: [], recoveryIndex: [], stability: []
    },
    reportData: null,
    reportDirty: false,
    peakFocus: 0,
    peakFocusTime: 0,
    // Brain Break 统计
    brainBreakCount: 0,
    brainBreakFatigueBefore: 0,
    brainBreakFatigueAfter: 0,
    brainBreakCalmnessBefore: 0,
    brainBreakCalmnessAfter: 0,
    // 认知快照结果
    cognitiveSnapshotResult: null,
    // 音频与耳机状态
    audioMode: 'focus',          // focus / whiteNoise / breath / calmAmbient
    ancMode: 'adaptive',         // adaptive / max / awareness / off
    ambientMode: 'natural',      // natural / voice / calmAmbient
    audioVolume: 65,
    audioFeedbackActive: true,
    // 音频反馈统计
    audioStats: {
      focusMusicTime: 0,
      brainBreakAudioCount: 0,
      ancSwitchCount: 0,
      recoveryCueCount: 0
    },
    // 音乐软件接入状态
    musicApp: {
      connected: false,
      provider: null,        // 'spotify' / 'appleMusic' / 'netease' / 'qqMusic' / null
      currentPlaylist: 'Focus Mix',
      switches: 0,
      lastSwitch: null,
      adaptation: true
    },
    // 声音场景切换命令日志
    commandLog: [],
    // 科学层状态
    scienceMode: false,
    eegFeatures: { alpha: 0, theta: 0, beta: 0, alphaThetaRatio: 0 },
    artifactRisk: 'low',
    confidence: 'high',
    sleepInsight: {
      available: false,
      source: 'auto-demo',
      sleepWindow: '',
      transitionTime: '',
      stability: 0,
      deepSleepTrend: 0,
      remLikeTrend: 0,
      artifactRisk: '',
      signalQuality: '',
      confidence: '',
      recommendedScene: '',
      summary: ''
    }
  },

  // 图表实例
  charts: {
    monitor: null,
    eegWave: null,
    recovery: null,
    report: null,
    sleep: null
  },

  // 定时器
  timers: {
    monitor: null,
    duration: null,
    eeg: null,
    brainBreak: null,
    calibration: null,
    breathing: null,
    snapshot: null
  },

  // DOM 缓存
  dom: {},

  // 提醒去重
  alertFlags: {
    fatigueHigh: false,
    focusLow: false,
    signalPoor: false
  },

  // 校准状态
  calibrating: false,


  // ================================================================
  // 初始化
  // ================================================================
  init() {
    console.log('[NeuroFocus] 系统初始化完成 v3.0');
    if (typeof ScrollAnim !== 'undefined') {
      ScrollAnim.init();
    }
    this.updateMusicAppUI();
    this._moveNavPill('home');

    // iOS stagger reveal
    var staggerObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var items = entry.target.querySelectorAll('.ios-stagger');
          items.forEach(function(item, index) {
            setTimeout(function() {
              item.classList.add('ios-visible');
            }, index * 60);
          });
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.ios-stagger-container').forEach(function(container) {
      staggerObserver.observe(container);
    });

    // 缓存常用 DOM 元素
    this._cacheDom();
  },

  _cacheDom() {
    this.dom = {
      navLinks: document.querySelectorAll('.nav-link'),
      mobileTabs: document.querySelectorAll('.mtb-item'),
      navPill: document.getElementById('navPill'),
      pages: {
        home: document.getElementById('page-home'),
        monitor: document.getElementById('page-monitor'),
        therapy: document.getElementById('page-therapy'),
        report: document.getElementById('page-report')
      }
    };
  },


  // ================================================================
  // 页面导航
  // ================================================================
  _navLock: false,

  navigate(pageName) {
    if (this.state.currentPage === pageName || this._navLock) return;

    var targetPage = (this.dom.pages && this.dom.pages[pageName]) || document.getElementById('page-' + pageName);
    var oldPage = document.querySelector('.page.is-active');
    if (!targetPage || oldPage === targetPage) return;

    this._navLock = true;
    var self = this;
    var oldPageName = oldPage ? oldPage.id.replace('page-', '') : null;

    // 1. Update nav active state
    var navLinks = (this.dom.navLinks) || document.querySelectorAll('.nav-link');
    var mobileTabs = (this.dom.mobileTabs) || document.querySelectorAll('.mtb-item');
    navLinks.forEach(function(link) { link.classList.toggle('active', link.dataset.page === pageName); });
    mobileTabs.forEach(function(item) { item.classList.toggle('active', item.dataset.page === pageName); });
    this._moveNavPill(pageName);

    // 2. Pause old page animations before transition
    if (oldPageName) {
      this._pausePage(oldPageName);
      if (typeof App.pausePageAnimations === 'function') {
        App.pausePageAnimations(oldPageName);
      }
    }

    // 3. Prepare target: add is-entering (visible but transparent)
    targetPage.classList.remove('is-leaving');
    targetPage.classList.add('is-entering');
    targetPage.style.visibility = 'visible';

    // 4. Start transition in next frame
    requestAnimationFrame(function() {
      // CRITICAL: Remove is-active from old page FIRST, then add is-leaving
      if (oldPage) {
        oldPage.classList.remove('is-active');
        oldPage.classList.add('is-leaving');
      }

      // Activate target page
      targetPage.classList.remove('is-entering');
      targetPage.classList.add('is-active');

      self.state.currentPage = pageName;

      // Scroll the page-scroll container to top (not window)
      var scroller = targetPage.querySelector('.page-scroll');
      if (scroller) scroller.scrollTop = 0;
    });

    // 5. After transition (340ms): cleanup + deferred heavy work
    setTimeout(function() {
      // Clean up old page completely
      if (oldPage) {
        oldPage.classList.remove('is-leaving', 'is-entering');
        oldPage.style.visibility = '';
      }

      // Clean up ALL non-active pages (prevent residual)
      document.querySelectorAll('.page:not(.is-active)').forEach(function(page) {
        page.classList.remove('is-leaving', 'is-entering');
        page.style.visibility = '';
      });

      self._navLock = false;

      // Resume animations on active page
      if (typeof App.resumePageAnimations === 'function') {
        App.resumePageAnimations(pageName);
      }

      // Reveal cards
      self._revealPageCards(targetPage);

      // Deferred heavy initialization via requestIdleCallback
      if (window.requestIdleCallback) {
        requestIdleCallback(function() { self._hydratePage(pageName); });
      } else {
        setTimeout(function() { self._hydratePage(pageName); }, 80);
      }
    }, 340);
  },

  _hydratePage(pageName) {
    switch(pageName) {
      case 'home':
        if (typeof ScrollAnim !== 'undefined') ScrollAnim.reinit();
        break;
      case 'monitor':
        this._initMonitorCharts();
        break;
      case 'therapy':
        this._initRecoveryChart();
        if (this.charts.recovery) this.charts.recovery._setupCanvas();
        if (typeof Pages !== 'undefined' && Pages._updateRecommendationReasons) {
          Pages._updateRecommendationReasons();
        }
        break;
      case 'report':
        // v29: Only render if dirty — don't re-render on every page visit
        if (this.state.reportDirty) {
          if (typeof Pages !== 'undefined' && Pages.renderReportWithAnimation) {
            Pages.renderReportWithAnimation();
          } else if (typeof Pages !== 'undefined' && Pages.renderReport) {
            Pages.renderReport();
          }
          this.state.reportDirty = false;
        }
        break;
    }
  },

  _pausePage(pageName) {
    // v38: Actually pause animations on inactive pages
    var page = document.getElementById('page-' + pageName);
    if (!page) return;

    if (pageName === 'therapy') {
      page.querySelectorAll('.recovery-waveform .recovery-waveform-bar').forEach(function(el) {
        el.classList.add('is-paused');
      });
    }
    if (pageName === 'report') {
      page.querySelectorAll('.nf-sleep-tl-bar, .nf-sleep-stage, .nf-sleep-ring-circle, .nf-sleep-long-bar-fill').forEach(function(el) {
        el.classList.add('is-paused');
      });
    }
  },

  _revealPageCards(page) {
    var cards = page.querySelectorAll('.ios-stagger-item');
    cards.forEach(function(card, index) {
      card.classList.remove('revealed');
      setTimeout(function() {
        card.classList.add('revealed');
      }, index * 60);
    });
  },

  _moveNavPill(pageName) {
    var activeLink = document.querySelector('.nav-link[data-page="' + pageName + '"]');
    var pill = document.getElementById('navPill');
    if (!activeLink || !pill) return;

    var navLinks = document.getElementById('navLinks');
    if (!navLinks) return;

    var linkRect = activeLink.getBoundingClientRect();
    var navRect = navLinks.getBoundingClientRect();

    pill.style.width = linkRect.width + 'px';
    pill.style.transform = 'translateX(' + (linkRect.left - navRect.left - 3) + 'px)';
  },


  // ================================================================
  // v36: 佩戴即实时记录 — 唯一主入口
  // ================================================================
  /**
   * High-level entry point for starting a complete realtime experience.
   * Handles all device states gracefully with user feedback.
   * Called from home page and report page "开始实时体验" buttons.
   */
  startRealtimeExperience: function(options) {
    options = options || {};
    var source = options.source || 'home';

    var dev = this.state.device || {
      fit: 'notWorn',
      sync: 'idle',
      baseline: 'pending',
      monitoring: 'idle'
    };

    // 1. If currently building / checking — don't silently ignore
    if (dev.fit === 'checking' || dev.sync === 'syncing' || dev.baseline === 'building') {
      this.navigate('monitor');
      this.feedback('实时体验正在启动：正在检测佩戴状态并建立个人基线', 'info');
      this.updateExperienceChecklist('baseline');
      return;
    }

    // 2. If already live — just navigate and inform
    if (dev.monitoring === 'live') {
      this.navigate('monitor');
      this.feedback('实时体验进行中：脑状态趋势正在记录', 'info');
      this.updateExperienceChecklist('live');
      return;
    }

    // 3. If paused — resume instead of silently returning
    if (dev.monitoring === 'paused') {
      dev.monitoring = 'live';
      this._startRealtimeLoop();
      this._updateSessionStatus('tracking');
      this._updateDeviceUI();
      this._updateActionCard();
      this.navigate('monitor');
      this.feedback('实时体验已恢复', 'info');
      this.updateExperienceChecklist('live');
      return;
    }

    // 4. Idle state — start the full experience
    this.navigate('monitor');
    this.feedback('实时体验开始：正在检测佩戴状态', 'info');

    this.state.experience = {
      active: true,
      source: source,
      startedAt: Date.now(),
      baselineReady: false,
      reportPrepared: false,
      nextStep: 'wear'
    };

    this.updateExperienceChecklist('wear');
    this.wearAndMonitor();

    // 5. After baseline completes, prepare recovery + report data
    var self = this;
    setTimeout(function() {
      self.prepareExperienceAfterBaseline(source);
    }, 3800);
  },

  /**
   * Called after wearAndMonitor() baseline timer (~3.7s).
   * Ensures recovery recommendations and report data are prepared.
   * Does NOT auto-connect music apps or send demo commands.
   */
  prepareExperienceAfterBaseline: function(source) {
    var dev = this.state.device || {};

    // If baseline not ready yet, wait and retry (max ~3 retries)
    if (dev.baseline !== 'ready') {
      var self = this;
      this._experienceRetryCount = (this._experienceRetryCount || 0) + 1;
      if (this._experienceRetryCount <= 3) {
        setTimeout(function() {
          self.prepareExperienceAfterBaseline(source);
        }, 1000);
      }
      return;
    }

    this._experienceRetryCount = 0;

    // Mark experience as in realtime phase
    this.state.experience = this.state.experience || {};
    this.state.experience.baselineReady = true;
    this.state.experience.nextStep = 'recovery';

    // v48: Don't generate report data here — homepage realtime experience
    // only accumulates data. Report generation happens via explicit actions:
    // report page "start-report-experience", "generate-report", "generate-sample-report", or judge.
    if (this.state.metricsHistory.focus.length >= 2) {
      this.state.reportDirty = true;
      this.state.experience.reportPrepared = true;
    }

    // Refresh recovery sound scene recommendation (silent, no auto-send)
    if (typeof Pages !== 'undefined' && Pages.selectSoundScene) {
      Pages.selectSoundScene('breath', { animated: false, silent: true });
    }

    // v44: Progress checklist step-by-step, don't skip 'recovery'
    this.updateExperienceChecklist('live');

    var self = this;
    setTimeout(function() {
      self.updateExperienceChecklist('recovery');
    }, 500);

    setTimeout(function() {
      self.updateExperienceChecklist('report');
    }, 1000);

    if (source === 'report') {
      this.feedback('实时体验已开始，报告数据正在积累。稍后可生成每日脑状态报告。', 'success');
    } else {
      this.feedback('个人基线已建立，实时脑状态趋势正在记录。你可以继续连接音乐软件或查看声音场景。', 'success');
    }
  },

  /**
   * Create a unique run for the report experience flow.
   * Records the current sample/recovery indices so we can compute
   * how many NEW samples were collected during this run.
   */
  _createReportExperienceRun: function() {
    var runId = 'report-' + Date.now();

    var h = this.state.metricsHistory || {};
    var rh = this.state.recoveryHistory || {};
    var commandLog = this.state.commandLog || [];
    var audioStats = this.state.audioStats || {};

    this.state.reportExperience = {
      active: true,
      runId: runId,
      startedAt: Date.now(),

      sampleStartIndex: h.focus ? h.focus.length : 0,
      recoveryStartIndex: rh.participation ? rh.participation.length : 0,
      commandStartIndex: commandLog.length,

      durationStart: this.state.monitorDuration || 0,
      brainBreakStartCount: this.state.brainBreakCount || 0,
      brainBreakAudioStartCount: audioStats.brainBreakAudioCount || 0,
      ancSwitchStartCount: audioStats.ancSwitchCount || 0,
      recoveryCueStartCount: audioStats.recoveryCueCount || 0,
      // v50: focusMusicTime baseline for this-run slicing
      focusMusicStartTime: audioStats.focusMusicTime || 0,

      reportPrepared: false,
      autoReturnToReport: true,
      timedOut: false
    };

    return this.state.reportExperience;
  },

  /**
   * Toggle the report page "开始一次实时体验" button loading state.
   * Prevents duplicate clicks during an active run.
   */
  setReportExperienceLoading: function(isLoading) {
    var btn = document.querySelector('[data-action="start-report-experience"]');
    if (!btn) return;

    if (isLoading) {
      btn.classList.add('is-loading');
      btn.setAttribute('aria-disabled', 'true');
      btn.dataset.disabledReason = '本次实时体验正在准备报告，请稍候';
      btn.textContent = '正在准备报告...';
    } else {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-disabled');
      btn.removeAttribute('data-disabled-reason');
      btn.textContent = '开始一次实时体验';
    }
  },

  /**
   * Start a realtime experience whose goal is to produce a report.
   * Called from the report page "开始一次实时体验" button.
   * Uses a unique runId to prevent duplicate flows.
   * Auto-returns to the report page after the report is prepared.
   */
  startReportExperience: function() {
    // Prevent duplicate runs
    if (this.state.reportExperience && this.state.reportExperience.active) {
      this.navigate('monitor');
      this.feedback('本次实时体验正在准备报告，请稍候', 'info');
      return;
    }

    var run = this._createReportExperienceRun();

    this.state.experience = this.state.experience || {};
    this.state.experience.active = true;
    this.state.experience.source = 'report';
    this.state.experience.autoReturnToReport = true;
    this.state.experience.reportPrepared = false;
    this.state.experience.startedAt = run.startedAt;

    this.navigate('monitor');
    this.feedback('正在开始一次实时体验：系统会自动完成佩戴检测、个人基线和报告准备', 'info');
    this.updateExperienceChecklist('wear');
    this.setReportExperienceLoading(true);

    var dev = this.state.device || {};

    // Already live — use new samples from this point
    if (dev.monitoring === 'live') {
      this.feedback('已在实时记录中，将使用接下来新增的数据准备本次体验报告', 'info');
      this.ensureRealtimeExperienceReport({ runId: run.runId, autoReturnToReport: true });
      return;
    }

    // Paused — resume then prepare report
    if (dev.monitoring === 'paused') {
      dev.monitoring = 'live';
      this._startRealtimeLoop();
      this._updateSessionStatus('tracking');
      this._updateDeviceUI();
      this._updateActionCard();
      this.feedback('实时记录已恢复，正在准备报告数据', 'info');
      this.ensureRealtimeExperienceReport({ runId: run.runId, autoReturnToReport: true });
      return;
    }

    // Building / checking — wait for baseline, then prepare report
    if (dev.fit === 'checking' || dev.sync === 'syncing' || dev.baseline === 'building') {
      this.feedback('实时体验正在启动，请等待个人基线建立完成', 'info');
      this.ensureRealtimeExperienceReport({ runId: run.runId, autoReturnToReport: true });
      return;
    }

    // Idle — start fresh
    this.wearAndMonitor();
    this.ensureRealtimeExperienceReport({ runId: run.runId, autoReturnToReport: true });
  },

  /**
   * Wait until baseline is ready and enough NEW samples are collected
   * during this run, then call prepareCurrentExperienceReport().
   * Uses a polling loop with timeout fallback.
   * Only counts samples added AFTER the run started (sampleStartIndex).
   */
  ensureRealtimeExperienceReport: function(options) {
    options = options || {};
    var runId = options.runId;
    var autoReturnToReport = !!options.autoReturnToReport;
    var minNewSamples = options.minNewSamples || 6;
    var maxWaitMs = options.maxWaitMs || 10000;

    var run = this.state.reportExperience;

    // Guard: run must still be active and match the runId
    if (!run || run.runId !== runId) {
      return;
    }

    var startedAt = Date.now();
    var self = this;
    var lastFeedbackCount = -1;

    function waitLoop() {
      var currentRun = self.state.reportExperience;

      // Guard: run cancelled or superseded
      if (!currentRun || currentRun.runId !== runId || !currentRun.active) {
        return;
      }

      var dev = self.state.device || {};
      var h = self.state.metricsHistory || {};
      var focusCount = h.focus ? h.focus.length : 0;
      var newSamples = focusCount - currentRun.sampleStartIndex;

      var baselineReady = dev.baseline === 'ready';
      var enoughSamples = newSamples >= minNewSamples;
      var timeout = Date.now() - startedAt > maxWaitMs;

      if ((baselineReady && enoughSamples) || timeout) {
        // Mark the run as timed out if we hit the timeout
        if (timeout && (!baselineReady || !enoughSamples)) {
          currentRun.timedOut = true;
          self.feedback('实时样本不足，已使用当前已有数据生成本次体验报告', 'warning');
        }
        self.prepareCurrentExperienceReport({
          runId: runId,
          autoReturnToReport: autoReturnToReport,
          sampleStartIndex: currentRun.sampleStartIndex,
          recoveryStartIndex: currentRun.recoveryStartIndex,
          commandStartIndex: currentRun.commandStartIndex,
          durationStart: currentRun.durationStart,
          brainBreakStartCount: currentRun.brainBreakStartCount,
          brainBreakAudioStartCount: currentRun.brainBreakAudioStartCount,
          ancSwitchStartCount: currentRun.ancSwitchStartCount,
          recoveryCueStartCount: currentRun.recoveryCueStartCount,
          focusMusicStartTime: currentRun.focusMusicStartTime,
          timedOut: !!currentRun.timedOut
        });
        return;
      }

      if (baselineReady) {
        self.updateExperienceChecklist('live');
        // Only show feedback when sample count changes (avoid toast spam)
        if (newSamples !== lastFeedbackCount && newSamples >= 0) {
          self.feedback('实时数据正在积累：已采集 ' + Math.max(0, newSamples) + ' / ' + minNewSamples + ' 个样本', 'info');
          lastFeedbackCount = newSamples;
        }
      } else {
        self.updateExperienceChecklist('baseline');
      }

      setTimeout(waitLoop, 800);
    }

    waitLoop();
  },

  /**
   * Generate a report from the current realtime experience data.
   * Fills recovery summary, generates report data (optionally sliced
   * to only this run's samples), and optionally auto-navigates back
   * to the report page. Cleans up the run state on completion.
   */
  prepareCurrentExperienceReport: function(options) {
    options = options || {};
    var autoReturnToReport = !!options.autoReturnToReport;
    var runId = options.runId;
    var sampleStartIndex = options.sampleStartIndex || 0;
    var recoveryStartIndex = options.recoveryStartIndex || 0;
    var commandStartIndex = options.commandStartIndex || 0;
    var durationStart = options.durationStart || 0;
    var brainBreakStartCount = options.brainBreakStartCount || 0;
    var brainBreakAudioStartCount = options.brainBreakAudioStartCount || 0;
    var ancSwitchStartCount = options.ancSwitchStartCount || 0;
    var recoveryCueStartCount = options.recoveryCueStartCount || 0;
    var focusMusicStartTime = options.focusMusicStartTime || 0;
    var timedOut = !!options.timedOut;
    var self = this;

    this.state.experience = this.state.experience || {};
    this.state.experience.baselineReady = true;

    // Step: recovery — fill recovery summary for THIS run
    this.updateExperienceChecklist('recovery');
    this.ensureRecoverySummaryForReport({ recoveryStartIndex: recoveryStartIndex });

    // Step: report — generate report data after a short delay for visual progression
    setTimeout(function() {
      // v46: Re-validate runId — the run may have been cancelled or superseded
      var currentRun = self.state.reportExperience;
      if (runId && (!currentRun || currentRun.runId !== runId)) {
        // Stale callback — do not generate report
        return;
      }

      self.generateReportData({
        source: options.source || (runId ? 'report-experience' : 'manual'),
        runId: runId,
        sampleStartIndex: sampleStartIndex,
        recoveryStartIndex: recoveryStartIndex,
        commandStartIndex: commandStartIndex,
        durationStart: durationStart,
        brainBreakStartCount: brainBreakStartCount,
        brainBreakAudioStartCount: brainBreakAudioStartCount,
        ancSwitchStartCount: ancSwitchStartCount,
        recoveryCueStartCount: recoveryCueStartCount,
        focusMusicStartTime: focusMusicStartTime,
        timedOut: timedOut
      });
      self.state.reportDirty = true;
      self.state.experience.reportPrepared = true;
      self.updateExperienceChecklist('report');

      // Clean up the run state
      var run = self.state.reportExperience;
      if (run && run.runId === runId) {
        run.active = false;
        run.reportPrepared = true;
      }
      self.setReportExperienceLoading(false);

      if (autoReturnToReport) {
        // v49: Source-aware toast message
        var toastSource = options.source || (runId ? 'report-experience' : 'manual');
        var toastMsg = toastSource === 'judge'
          ? '评审演示报告已准备好，正在打开每日脑状态报告'
          : '本次实时体验报告已准备好，正在打开每日脑状态报告';
        self.feedback(toastMsg, 'success');

        setTimeout(function() {
          self.navigate('report');

          setTimeout(function() {
            if (typeof Pages !== 'undefined' && Pages.renderReportWithAnimation) {
              Pages.renderReportWithAnimation();
            } else if (typeof Pages !== 'undefined' && Pages.renderReport) {
              Pages.renderReport();
            }
            self.state.reportDirty = false;
          }, 420);
        }, 600);
      } else {
        self.feedback('报告数据已准备好，可前往每日脑状态报告查看', 'success');
      }
    }, 600);
  },

  /**
   * Ensure the report has a music recovery summary.
   * Fills recoveryHistory with minimal demo data if empty.
   * Does NOT claim to have controlled external music apps.
   */
  ensureRecoverySummaryForReport: function(options) {
    options = options || {};
    var recoveryStartIndex = options.recoveryStartIndex || 0;

    this.state.localScene = this.state.localScene || {};
    this.state.localScene.selected = this.state.localScene.selected || 'breath';
    this.state.localScene.label = this.state.localScene.label || 'Breath Guide';

    var rh = this.state.recoveryHistory;

    // v46: Only add recovery data if THIS run doesn't have any yet
    var hasRunRecovery = rh.participation.length > recoveryStartIndex;

    if (!hasRunRecovery) {
      rh.participation.push(58, 62, 66, 68, 70);
      rh.fatigueRisk.push(42, 38, 34, 30, 28);
      rh.recoveryIndex.push(50, 58, 64, 70, 74);
      rh.stability.push(70, 72, 74, 75, 76);

      // v47: Count this as a NEW recovery cue for this run, not Math.max()
      this.state.audioStats = this.state.audioStats || {};
      this.state.audioStats.recoveryCueCount = (this.state.audioStats.recoveryCueCount || 0) + 1;
    }

    if (typeof Pages !== 'undefined' && Pages.selectSoundScene) {
      Pages.selectSoundScene('breath', { animated: false, silent: true });
    }
  },

  /**
   * Update the experience progress checklist on the monitor page.
   * @param {string} stage - wear / baseline / live / recovery / report
   */
  updateExperienceChecklist: function(stage) {
    var order = ['wear', 'baseline', 'live', 'recovery', 'report'];
    var currentIndex = order.indexOf(stage);
    if (currentIndex === -1) return;

    var steps = document.querySelectorAll('.experience-step');
    steps.forEach(function(el) {
      var idx = order.indexOf(el.dataset.step);
      el.classList.toggle('done', idx < currentIndex);
      el.classList.toggle('active', idx === currentIndex);
    });
  },

  wearAndMonitor: function() {
    var self = this;
    var dev = this.state.device || {};
    // v37: Primary check uses state.device.monitoring
    if (dev.monitoring === 'live') {
      this.navigate('monitor');
      this.showToast('正在实时记录脑状态趋势', 'info');
      return;
    }
    // v43: If paused — resume instead of silently returning
    if (dev.monitoring === 'paused') {
      dev.monitoring = 'live';
      this._startRealtimeLoop();
      this._updateSessionStatus('tracking');
      this._updateDeviceUI();
      this._updateActionCard();
      this.navigate('monitor');
      this.feedback('实时记录已恢复', 'info');
      return;
    }
    // v43: If checking / building — navigate and inform, don't silently return
    if (dev.fit === 'checking' || dev.sync === 'syncing' || dev.baseline === 'building') {
      this.navigate('monitor');
      this.feedback('正在检测佩戴状态并建立个人基线，请稍候', 'info');
      return;
    }

    // Navigate to monitor page immediately
    this.navigate('monitor');

    // v33: Set fine-grained device states
    this.state.device = this.state.device || {};
    this.state.device.fit = 'checking';
    this.state.device.sync = 'idle';
    this.state.device.baseline = 'pending';
    this.state.device.monitoring = 'idle';

    // v37: Only write to state.device
    this._updateDeviceUI();

    // Update status to "connecting" display
    var statusEl = document.getElementById('sessionStatus');
    if (statusEl) {
      this.dissolveText(statusEl, '正在检测佩戴状态');
    }
    var dot = document.getElementById('statusDot');
    var sub = document.getElementById('sessionSubtext');
    if (dot) { dot.style.background = 'var(--ios-blue)'; dot.classList.add('pulse'); }
    if (sub) sub.textContent = '正在检测佩戴状态...';

    // Update wear status
    var wearDot = document.getElementById('wearStatusDot');
    var wearText = document.getElementById('wearStatusText');
    if (wearDot) { wearDot.className = 'wear-status-dot checking'; }
    if (wearText) wearText.textContent = '检测中';
    this.updateExperienceChecklist('baseline');

    // Simulate connection in 600-900ms
    setTimeout(function() {
      // v37: Only write to state.device
      self.state.device.fit = 'goodFit';
      self.state.device.sync = 'synced';
      self.state.device.baseline = 'building';
      self.state.device.monitoring = 'live';
      self._updateDeviceUI();

      // Show calibration card with dissolve
      var calCard = document.getElementById('calibrationCard');
      if (calCard) {
        calCard.classList.remove('hidden-default');
        calCard.style.display = '';
        requestAnimationFrame(function() {
          calCard.classList.add('revealed');
        });
      }

      // Start realtime preview immediately (low confidence)
      self._startRealtimePreview();

      // Update status
      if (statusEl) {
        self.dissolveText(statusEl, '正在建立个人基线');
      }
      var sub2 = document.getElementById('sessionSubtext');
      if (sub2) sub2.textContent = '正在建立个人基线...';

      // Update wear status to worn
      if (wearDot) { wearDot.className = 'wear-status-dot worn'; }
      if (wearText) wearText.textContent = '佩戴良好';

      // Update connect button
      var btnConnect = document.getElementById('btnConnect');
      if (btnConnect) {
        btnConnect.textContent = '佩戴良好 · 实时记录中';
        btnConnect.disabled = true;
      }
      var btnStop = document.getElementById('btnStopSession');
      if (btnStop) {
        btnStop.disabled = false;
        btnStop.textContent = '暂停实时记录';
      }

      // Finish calibration in ~3 seconds
      setTimeout(function() {
        self._finishCalibration();
      }, 3000);
    }, 700);
  },

  // v36: Generate waveform bars
  generateWaveform: function(container, type, count) {
    if (!container) return;
    type = type || 'focus';
    count = count || 16;
    container.innerHTML = '';
    container.className = 'recovery-waveform wf-' + type;
    for (var i = 0; i < count; i++) {
      var bar = document.createElement('span');
      bar.className = 'recovery-waveform-bar';
      bar.style.animationDelay = (i * 0.05) + 's';
      container.appendChild(bar);
    }
  },

  _updateDeviceUI() {
    // v37: Read ONLY from state.device
    const dev = this.state.device || { fit: 'notWorn', sync: 'idle', baseline: 'pending', monitoring: 'idle' };
    const isConnected = dev.monitoring === 'live' || dev.monitoring === 'paused';
    const isConnecting = dev.fit === 'checking' || dev.sync === 'syncing';

    // v35: Generate UI text from fine-grained state machine
    const fitText = dev.fit === 'goodFit' ? '佩戴良好' :
                    dev.fit === 'checking' ? '正在检测佩戴状态' :
                    dev.fit === 'looseFit' ? '佩戴松动，请调整' : '等待耳机佩戴';
    const navStatusText = isConnected ? '已连接' :
                          isConnecting ? '同步中...' : '未连接';

    // 导航栏 — derive class from device state
    const navDot = document.querySelector('.device-dot');
    const navText = document.querySelector('.nav-device-status .device-text');
    if (navDot) navDot.className = 'device-dot ' + (isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected');
    if (navText) navText.textContent = navStatusText;

    // 首页硬件状态预览
    this._updateHwPreview();

    // Session 卡片
    const fitStatus = document.getElementById('fitStatus');
    const signalStatus = document.getElementById('signalStatus');
    const batteryStatus = document.getElementById('batteryStatus');
    const btnConnect = document.getElementById('btnConnect');

    if (fitStatus) fitStatus.textContent = fitText;
    if (signalStatus) signalStatus.textContent = isConnected ? '良好' : '—';
    if (batteryStatus) batteryStatus.textContent = isConnected ? '86%' : '—';

    // v35: Button text from state machine
    if (btnConnect) {
      if (dev.monitoring === 'live') {
        btnConnect.textContent = '佩戴良好 · 实时记录中';
      } else if (dev.monitoring === 'paused') {
        btnConnect.textContent = '实时记录已暂停';
      } else if (dev.fit === 'checking') {
        btnConnect.textContent = '正在检测佩戴状态';
      } else if (dev.fit === 'goodFit' && dev.baseline === 'building') {
        btnConnect.textContent = '正在建立个人基线';
      } else {
        btnConnect.textContent = '模拟戴上耳机';
      }
      btnConnect.disabled = isConnecting || (isConnected && dev.monitoring === 'live');
    }

    // v33: Stop button — show "恢复实时记录" when paused
    var btnStopSession = document.getElementById('btnStopSession');
    if (btnStopSession) {
      if (dev.monitoring === 'live') {
        btnStopSession.textContent = '暂停实时记录';
        btnStopSession.disabled = false;
        btnStopSession.title = '';
      } else if (dev.monitoring === 'paused') {
        btnStopSession.textContent = '恢复实时记录';
        btnStopSession.disabled = false;
        btnStopSession.title = '';
      } else {
        btnStopSession.textContent = '暂停实时记录';
        btnStopSession.disabled = true;
        btnStopSession.title = '当前没有正在进行的实时记录';
      }
    }

    // 连接状态变化时同步健康行动卡片
    this._updateActionCard();
  },

  /**
   * 展开/收起设备详情
   */
  toggleDeviceDetails() {
    const card = document.getElementById('deviceDetailsCard');
    if (card) card.classList.toggle('expanded');
  },

  /**
   * v40: 展开/收起 EEG 科学解释区 — 局部折叠，不依赖全局 science-mode
   */
  toggleEegFeatures() {
    var wrap = document.getElementById('eegFeatureWrap');
    var btn = document.querySelector('[data-action="toggle-science"]');

    if (!wrap) {
      this.showToast('科学解释模块未找到', 'warning');
      return;
    }

    var willOpen = wrap.classList.contains('collapsed');

    wrap.classList.toggle('collapsed', !willOpen);
    wrap.setAttribute('aria-hidden', willOpen ? 'false' : 'true');

    if (btn) {
      btn.textContent = willOpen ? '收起科学解释' : '查看科学解释';
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }

    if (willOpen) {
      setTimeout(function() {
        wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
      this.showToast('已展开脑电特征依据', 'info');
    } else {
      this.showToast('已收起脑电特征依据', 'info');
    }
  },


  // ================================================================
  // 场景切换
  // ================================================================
  setScenario(scenario) {
    Simulator.setScenario(scenario);
    document.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scenario === scenario);
    });
    const info = Simulator.getScenarioInfo();
    this.showToast('场景: ' + info.name, 'info');
  },


  // ================================================================
  // Music App Connectors
  // ================================================================
  connectMusicApp(provider) {
    this.state.musicApp.connected = true;
    this.state.musicApp.provider = provider;
    const providerNames = {
      spotify: 'Spotify',
      appleMusic: 'Apple Music',
      netease: '网易云音乐',
      qqMusic: 'QQ 音乐'
    };
    this.showToast('已连接 ' + (providerNames[provider] || provider) + ' Demo Connector', 'success');
    this.updateMusicAppUI();

    // v31: Close the bottom sheet if it's open
    this.hideBottomSheet();

    // v31: Update all "连接音乐软件" buttons to "更换音乐软件"
    document.querySelectorAll('[data-action="open-music-connector"]').forEach(function(btn) {
      btn.textContent = '更换音乐软件';
    });
  },

  /**
   * Unified alias for connectMusicApp — new code should use this name
   */
  connectMusicProvider(provider) {
    return this.connectMusicApp(provider);
  },

  /**
   * 本地选择声音场景 — 只更新本地 Demo 状态，不发送到音乐软件
   * 不增加 switches，不写 commandLog，不显示"已发送"
   */
  selectLocalScene(scene) {
    var sceneMap = {
      focus: { label: 'Focus Mix', mode: 'focus' },
      whiteNoise: { label: 'White Noise', mode: 'whiteNoise' },
      breath: { label: 'Breath Guide', mode: 'breath' },
      calm: { label: 'Calm Ambient', mode: 'calmAmbient' },
      sleepPrep: { label: 'Sleep Prep', mode: 'calmAmbient' },
      brownNoise: { label: 'Brown Noise', mode: 'whiteNoise' }
    };
    var info = sceneMap[scene];
    if (!info) return;

    // v34: Only update local scene preview — do NOT modify external music app state
    this.state.audioMode = info.mode;
    if (!this.state.localScene) this.state.localScene = {};
    this.state.localScene.selected = scene;
    this.state.localScene.label = info.label;
    this._updateAudioUI();
    this.updateMusicAppUI();

    this.showToast('已切换到 ' + info.label + ' Demo 场景', 'info');
  },

  /**
   * v33: 发送 Demo 切换指令到音乐软件 — 只在点击"发送 Demo 切换指令"时调用
   * 写 commandLog，增加 switches，显示"已发送"
   */
  setSoundScene(scene) {
    if (!this.state.musicApp.connected) {
      this.showToast('请先连接音乐软件 Demo Connector', 'warning');
      return;
    }
    var timeStr = new Date().toTimeString().slice(0,5);
    var sceneMap = {
      focus: { label: 'Focus Mix', mode: 'focus' },
      whiteNoise: { label: 'White Noise', mode: 'whiteNoise' },
      breath: { label: 'Breath Guide', mode: 'breath' },
      calm: { label: 'Calm Ambient', mode: 'calmAmbient' }
    };
    var info = sceneMap[scene];
    if (!info) return;

    this.state.musicApp.currentPlaylist = info.label;
    this.state.musicApp.switches++;
    this.state.musicApp.lastSwitch = Date.now();
    this.state.audioMode = info.mode;
    this._updateAudioUI();

    // 记录命令到 commandLog
    this.state.commandLog.push({
      time: timeStr,
      scene: info.label,
      provider: this.state.musicApp.provider
    });

    this.updateMusicAppUI();

    var providerNames = {
      spotify: 'Spotify', appleMusic: 'Apple Music',
      netease: '网易云音乐', qqMusic: 'QQ 音乐'
    };
    var providerName = providerNames[this.state.musicApp.provider] || 'Demo';
    this.showToast(info.label + ' 已发送到 ' + providerName + ' Demo', 'success');

    // 记录到近期变化
    if (typeof Pages !== 'undefined' && Pages.addRecentChange) {
      Pages.addRecentChange(info.label + ' 已发送到 ' + providerName + ' Demo');
    }
  },

  updateMusicAppUI() {
    const ma = this.state.musicApp;
    const providerNames = {
      spotify: 'Spotify',
      appleMusic: 'Apple Music',
      netease: '网易云音乐',
      qqMusic: 'QQ 音乐'
    };
    const providerName = ma.provider ? providerNames[ma.provider] : '未连接';
    const statusText = ma.connected ? '已连接 ' + providerName : '未连接';

    // Hero now playing card
    var heroProvider = document.getElementById('heroMusicProvider');
    if (heroProvider) {
      heroProvider.textContent = ma.connected ? ('已连接 ' + providerName) : '音乐软件未连接';
    }
    var heroPlaylist = document.getElementById('heroMusicPlaylist');
    if (heroPlaylist) {
      heroPlaylist.textContent = ma.connected ? ma.currentPlaylist : 'Demo Connector Ready';
    }
    var heroSubtitle = document.getElementById('heroMusicSubtitle');
    if (heroSubtitle) {
      heroSubtitle.textContent = ma.connected ? '正在适配脑状态' : '点击连接音乐软件';
    }

    // Focus page music app card
    const focusProvider = document.getElementById('focusMusicProvider');
    if (focusProvider) focusProvider.textContent = statusText;

    // 连接状态 field (mirrors provider status)
    const focusConnStatus = document.getElementById('focusAdaptivePlaylist');
    if (focusConnStatus) focusConnStatus.textContent = statusText;

    const focusNowPlaying = document.getElementById('focusNowPlaying');
    if (focusNowPlaying) focusNowPlaying.textContent = ma.currentPlaylist;

    const focusLastSwitch = document.getElementById('focusLastSwitch');
    if (focusLastSwitch) {
      if (ma.lastSwitch) {
        const mins = Math.floor((Date.now() - ma.lastSwitch) / 60000);
        focusLastSwitch.textContent = mins < 1 ? '刚刚' : mins + ' 分钟前';
      } else {
        focusLastSwitch.textContent = '—';
      }
    }

    // Focus page music disconnected state
    const focusDetails = document.getElementById('focusMusicDetails');
    const focusDisconnected = document.getElementById('focusMusicDisconnected');
    if (focusDetails && focusDisconnected) {
      if (ma.connected) {
        focusDetails.style.display = '';
        focusDisconnected.style.display = 'none';
      } else {
        focusDetails.style.display = 'none';
        focusDisconnected.style.display = 'block';
      }
    }

    // Recovery page connected app
    const recoveryProvider = document.getElementById('recoveryMusicProvider');
    if (recoveryProvider) recoveryProvider.textContent = providerName;

    const recoveryPlaylist = document.getElementById('recoveryMusicPlaylist');
    if (recoveryPlaylist) recoveryPlaylist.textContent = ma.currentPlaylist;

    const recoveryStatus = document.getElementById('recoveryMusicStatus');
    if (recoveryStatus) recoveryStatus.textContent = ma.connected ? 'Demo 已连接' : '未连接';

    const recoveryStatusText = document.getElementById('recoveryMusicStatusText');
    if (recoveryStatusText) recoveryStatusText.textContent = ma.connected ? 'Demo 已连接' : '未连接';

    // v31: Update send scene command button — use aria-disabled for feedback
    var btnSendScene = document.getElementById('btnSendSceneCommand');
    if (btnSendScene) {
      if (ma.connected) {
        btnSendScene.disabled = false;
        btnSendScene.removeAttribute('aria-disabled');
        btnSendScene.removeAttribute('data-disabled-reason');
        btnSendScene.title = '';
      } else {
        btnSendScene.disabled = false; // Keep clickable for feedback
        btnSendScene.setAttribute('aria-disabled', 'true');
        btnSendScene.setAttribute('data-disabled-reason', '请先连接音乐软件 Demo Connector');
        btnSendScene.title = '请先连接音乐软件 Demo Connector';
      }
    }

    // Connector cards
    document.querySelectorAll('.connector-card').forEach(card => {
      const isConnected = card.dataset.provider === ma.provider && ma.connected;
      card.classList.toggle('connected', isConnected);
      const statusEl = card.querySelector('.connector-status');
      if (statusEl) statusEl.textContent = isConnected ? '已连接 · Demo 模式' : 'Demo 接入';
    });

    // Connector status panel
    const connectorCurrentApp = document.getElementById('connectorCurrentApp');
    if (connectorCurrentApp) connectorCurrentApp.textContent = statusText;

    const connectorNowPlaying = document.getElementById('connectorNowPlaying');
    if (connectorNowPlaying) connectorNowPlaying.textContent = ma.currentPlaylist;

    const connectorLastCommand = document.getElementById('connectorLastCommand');
    if (connectorLastCommand) {
      if (this.state.commandLog && this.state.commandLog.length > 0) {
        const lastCmd = this.state.commandLog[this.state.commandLog.length - 1];
        connectorLastCommand.textContent = lastCmd.scene + ' 刚刚发送';
      } else {
        connectorLastCommand.textContent = '暂无指令';
      }
    }

    // Product detail card
    const pdMusicApps = document.getElementById('pdMusicApps');
    if (pdMusicApps) pdMusicApps.textContent = ma.connected ? providerName : 'Spotify / Apple Music / 网易云音乐 / QQ 音乐';

    // Homepage Music & Adaptive Audio panel
    var maConnectedApp = document.getElementById('maConnectedApp');
    if (maConnectedApp) maConnectedApp.textContent = statusText;

    var maNowPlaying = document.getElementById('maNowPlaying');
    if (maNowPlaying) {
      // v34: Show localScene label as preview, or musicApp.currentPlaylist if connected
      var ls = this.state.localScene || {};
      maNowPlaying.textContent = (ls.label || 'Focus Mix') + (ma.connected ? '' : ' Demo');
    }

    var maRecommended = document.getElementById('maRecommended');
    if (maRecommended) {
      var recScene = Simulator.getRecommendedScene ? Simulator.getRecommendedScene(this._lastMetrics || {}) : null;
      if (recScene && recScene.scene) {
        var sceneLabels = { focus: 'Focus Mix', whiteNoise: 'White Noise', breath: 'Breath Guide', calm: 'Calm Ambient' };
        maRecommended.textContent = sceneLabels[recScene.scene] || '—';
      } else {
        maRecommended.textContent = '—';
      }
    }

    var maReason = document.getElementById('maReason');
    if (maReason) {
      if (this.state.commandLog && this.state.commandLog.length > 0) {
        var lastCmd = this.state.commandLog[this.state.commandLog.length - 1];
        maReason.textContent = lastCmd.scene + ' 已发送到 ' + (providerName || 'Demo');
      } else {
        maReason.textContent = '疲劳负荷上升，专注趋势下降';
      }
    }

    // v33: Update command status
    var maCommandStatus = document.getElementById('maCommandStatus');
    if (maCommandStatus) {
      if (this.state.commandLog && this.state.commandLog.length > 0) {
        var lastCmd2 = this.state.commandLog[this.state.commandLog.length - 1];
        maCommandStatus.textContent = lastCmd2.scene + ' 已发送 · ' + lastCmd2.time;
      } else {
        maCommandStatus.textContent = '尚未发送';
      }
    }

    var maConfidence = document.getElementById('maConfidence');
    if (maConfidence) {
      var conf = Simulator._science ? Simulator._science.confidence : 'medium';
      maConfidence.textContent = conf.charAt(0).toUpperCase() + conf.slice(1);
    }
  },

  openMusicConnector() {
    // v31: Open bottom sheet on current page — never navigate away
    this.openMusicConnectorSheet();
  },

  /**
   * v31: Open music connector bottom sheet on current page
   * Does NOT navigate to home page.
   */
  openMusicConnectorSheet(sourcePage) {
    var self = this;
    var overlay = document.querySelector('.ios-bottom-sheet-overlay');
    var sheet = document.querySelector('.ios-bottom-sheet');
    if (!overlay || !sheet) return;

    var sheetBody = sheet.querySelector('.ios-bottom-sheet-body');
    if (!sheetBody) return;

    var ma = this.state.musicApp;
    var providerNames = {
      spotify: 'Spotify',
      appleMusic: 'Apple Music',
      netease: '网易云音乐',
      qqMusic: 'QQ 音乐'
    };

    var currentProviderName = ma.provider ? providerNames[ma.provider] : '';

    // v37: Build connector sheet using CSS classes — no inline styles
    var html = '<div class="connector-sheet">';
    html += '<h3 class="connector-sheet-title">' + (ma.connected ? '更换音乐软件' : '连接音乐软件') + '</h3>';
    html += '<p class="connector-sheet-subtitle">Demo 模拟接入 · 未接入真实账号授权</p>';

    if (ma.connected && currentProviderName) {
      html += '<div class="connector-sheet-notice">当前已连接 ' + currentProviderName + ' Demo</div>';
    }

    html += '<div class="connector-grid">';
    var providers = [
      { id: 'spotify', name: 'Spotify', icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.6 14.4a.6.6 0 0 1-.8.2 8.3 8.3 0 0 0-6.3-.9.6.6 0 1 1-.3-1.2 9.5 9.5 0 0 1 7.2 1 .6.6 0 0 1 .2.9zm1.2-2.7a.8.8 0 0 1-1 .3 10 10 0 0 0-7.6-1.1.8.8 0 1 1-.4-1.5 11.5 11.5 0 0 1 8.7 1.3.8.8 0 0 1 .3 1zm.1-2.8a11.8 11.8 0 0 0-10-1.4.9.9 0 1 1-.5-1.8 13.6 13.6 0 0 1 11.5 1.6.9.9 0 1 1-1 1.6z' },
      { id: 'appleMusic', name: 'Apple Music', icon: 'M9 18V5l12-2v13M6 18a3 3 0 1 1 0-.01M18 16a3 3 0 1 1 0-.01' },
      { id: 'netease', name: '网易云音乐', icon: 'M9 18V5l12-2v13M6 18a3 3 0 1 1 0-.01M18 16a3 3 0 1 1 0-.01' },
      { id: 'qqMusic', name: 'QQ 音乐', icon: 'M9 18V5l12-2v13M6 18a3 3 0 1 1 0-.01M18 16a3 3 0 1 1 0-.01' }
    ];

    providers.forEach(function(p) {
      var isActive = ma.connected && ma.provider === p.id;
      html += '<div class="connector-option' + (isActive ? ' active' : '') + '" data-action="connect-music" data-provider="' + p.id + '">';
      html += '<svg class="connector-provider-icon' + (isActive ? ' active' : '') + '" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="' + p.icon + '"/></svg>';
      html += '<span class="connector-provider-name">' + p.name + '</span>';
      if (isActive) html += '<span class="connector-provider-status">✓ 已连接</span>';
      html += '</div>';
    });

    html += '</div>';
    html += '<button class="connector-cancel-btn" data-action="hide-bottom-sheet">取消</button>';
    html += '</div>';

    sheetBody.innerHTML = html;

    // Show sheet
    overlay.classList.add('active');
    sheet.classList.add('active');
    document.body.style.overflow = 'hidden';
  },


  // ================================================================
  // Focus Session — v31: All legacy session logic removed
  // wearAndMonitor() is the only entry point.
  // ================================================================

  /**
   * 基线校准流程（3 秒）— internal only, not user-triggered
   */
  _startCalibration() {
    this.calibrating = true;

    const calibStatus = document.getElementById('calibrationStatus');
    const calibDesc = document.getElementById('calibrationDesc');
    const calibProgress = document.getElementById('calibrationProgress');
    const calibBarFill = document.getElementById('calibrationBarFill');
    const calibPercent = document.getElementById('calibrationPercent');

    if (calibStatus) { calibStatus.textContent = '校准中...'; calibStatus.className = 'calibration-status active'; }
    if (calibDesc) calibDesc.textContent = '正在建立个人专注/疲劳基线...';
    if (calibProgress) calibProgress.style.display = 'flex';

    let progress = 0;
    this.timers.calibration = setInterval(() => {
      progress += 34;
      if (progress > 100) progress = 100;
      if (calibBarFill) calibBarFill.style.width = progress + '%';
      if (calibPercent) calibPercent.textContent = progress + '%';

      if (progress >= 100) {
        clearInterval(this.timers.calibration);
        this._finishCalibration();
      }
    }, 1000);
  },

  _finishCalibration: function() {
    var self = this;

    // v33: Update device state machine
    if (this.state.device) {
      this.state.device.baseline = 'ready';
      this.state.device.monitoring = 'live';
    }

    // Update simulator confidence
    if (Simulator._science) {
      Simulator._science.confidence = 'medium';
      Simulator.generateEEGFeatures();
    }

    // Update calibration card
    var calBar = document.getElementById('calibrationBarFill');
    if (calBar) calBar.style.width = '100%';

    this._updateSessionStatus('tracking');
    this.updateExperienceChecklist('live');

    // Hide calibration card after delay
    setTimeout(function() {
      var calCard = document.getElementById('calibrationCard');
      if (calCard) {
        calCard.style.opacity = '0';
        calCard.style.transform = 'translateY(-10px)';
        calCard.style.transition = 'opacity 0.4s, transform 0.4s';
        setTimeout(function() {
          calCard.style.display = 'none';
        }, 400);
      }

      // Show device details
      var devCard = document.getElementById('deviceDetailsCard');
      if (devCard) {
        devCard.classList.remove('hidden-default');
        devCard.style.display = '';
        devCard.style.opacity = '0';
        requestAnimationFrame(function() {
          devCard.style.transition = 'opacity 0.4s';
          devCard.style.opacity = '1';
        });
      }

      // Update confidence to medium/high
      if (Simulator._science) {
        Simulator._science.confidence = 'high';
      }

      // Update UI
      self._updateScienceUI();
      self.showToast('个人基线已建立 · 实时记录中', 'success');

      // Enable stop button
      var btnStop = document.getElementById('btnStopSession');
      if (btnStop) btnStop.disabled = false;

      // Update confidence display
      var confEl = document.getElementById('monitorConfidence');
      if (confEl) {
        self.dissolveText(confEl, 'High');
      }
    }, 500);
  },

  _startRealtimePreview: function() {
    this._showRealtimePreviewUI();
    this._startRealtimeLoop();
  },

  /**
   * v38: Show the monitor area UI (cards, charts init)
   * Does NOT touch timers — purely visual.
   */
  _showRealtimePreviewUI: function() {
    // Set low confidence state during calibration
    if (Simulator._science) {
      Simulator._science.confidence = 'low';
      Simulator._science.baselineReady = false;
    }

    // Show monitor area with fade-in
    var monitorArea = document.getElementById('monitorArea');
    if (monitorArea) {
      monitorArea.classList.remove('hidden-default');
      monitorArea.style.display = '';
      var staggerItems = monitorArea.querySelectorAll('.ios-stagger-item');
      staggerItems.forEach(function(item) { item.classList.add('revealed'); });
      monitorArea.style.opacity = '0';
      monitorArea.style.transform = 'translateY(10px)';
      monitorArea.style.transition = 'opacity 0.4s var(--ios-ease), transform 0.4s var(--ios-ease)';
      requestAnimationFrame(function() {
        monitorArea.style.opacity = '1';
        monitorArea.style.transform = 'translateY(0)';
      });
    }

    // Initialize charts if not already done
    if (typeof Charts !== 'undefined' && !Charts._initialized) {
      Charts.init();
    }

    this.state.monitorStartTime = this.state.monitorStartTime || Date.now();
  },

  /**
   * v38: Start (or restart) the realtime data loop.
   * Only checks timer existence — never checks monitoring state.
   * This is the SINGLE place that creates monitor/duration/eeg intervals.
   */
  _startRealtimeLoop: function() {
    // v41: Guard against duplicate starts — check BEFORE anything else
    if (this._loopStarting) return;

    // Stop any existing loop first. _stopRealtimeLoop() will set _loopStarting = false,
    // so we MUST set the guard AFTER this call, not before.
    this._stopRealtimeLoop();

    // Now set the guard — this is the critical ordering that prevents duplicates
    this._loopStarting = true;

    this.state.monitorStartTime = this.state.monitorStartTime || Date.now();

    var self = this;
    requestAnimationFrame(function() {
      self._loopStarting = false;

      // v39: Don't start if monitoring was paused while we were waiting for rAF
      if (!self.state.device || self.state.device.monitoring === 'paused') return;

      self._initMonitorCharts();
      if (self.charts.monitor && self.charts.monitor._setupCanvas) {
        self.charts.monitor._setupCanvas();
      }
      if (self.charts.eegWave && self.charts.eegWave._setupCanvas) {
        self.charts.eegWave._setupCanvas();
      }

      self.timers.monitor = setInterval(function() { self._updateMetrics(); }, 1000);
      self.timers.duration = setInterval(function() { self._updateDuration(); }, 1000);
      self.timers.eeg = setInterval(function() { self._updateEEG(); }, 100);

      self._updateMetrics();
    });
  },

  /**
   * v38: Stop the realtime data loop (pause).
   * This is the SINGLE place that clears monitor/duration/eeg intervals.
   */
  _stopRealtimeLoop: function() {
    // v39: Reset the guard flag synchronously
    this._loopStarting = false;
    clearInterval(this.timers.monitor);
    clearInterval(this.timers.duration);
    clearInterval(this.timers.eeg);
    this.timers.monitor = null;
    this.timers.duration = null;
    this.timers.eeg = null;
  },

  // v38: _startRealtimePreview splits into _showRealtimePreviewUI() + _startRealtimeLoop()

  stopFocusSession() {
    var dev = this.state.device || {};
    if (dev.monitoring === 'paused') {
      // Resume
      dev.monitoring = 'live';
      this._startRealtimeLoop();
      this._updateSessionStatus('tracking');
      this._updateDeviceUI();
      this.showToast('实时记录已恢复', 'info');
      return;
    }

    if (dev.monitoring !== 'live') {
      this.showToast('当前没有正在进行的实时记录', 'info');
      return;
    }

    // Pause — use unified stop function
    dev.monitoring = 'paused';
    this._stopRealtimeLoop();

    this._updateSessionStatus('idle');
    this._updateDeviceUI();
    this._updateActionCard();

    this.showToast('实时记录已暂停 · 数据已保存', 'info');
  },


  // ================================================================
  // Brain Break
  // ================================================================
  startBrainBreak() {
    // v36: Use state.device.monitoring as primary check
    if (!this.state.device || this.state.device.monitoring !== 'live') return;
    if (this.state.brainBreak) return;

    this.state.brainBreak = true;

    // 记录 Brain Break 前的疲劳和平静度
    this.state.brainBreakFatigueBefore = Simulator._state.fatigue;
    this.state.brainBreakCalmnessBefore = Simulator._state.calmness;

    // 暂停数据采集 — use unified stop function
    this._stopRealtimeLoop();

    // 耳机音频引导：切换 ANC + 音频模式
    const prevAncMode = this.state.ancMode;
    this.state.ancMode = 'awareness';
    this.state.audioMode = 'breath';
    this._updateAudioUI();

    // 弹出底部呼吸引导面板
    this._openBrainBreakSheet();
    this._updateSessionStatus('break');

    // Demo 中 10 秒倒计时
    let countdown = 10;
    const cdEl = document.getElementById('breathCountdown');
    if (cdEl) cdEl.textContent = countdown;

    // 启动呼吸引导
    this._startBreathingGuide();

    this.timers.brainBreak = setInterval(() => {
      countdown--;
      if (cdEl) cdEl.textContent = countdown;

      // 疲劳值逐步下降
      Simulator._state.fatigue = Math.max(15, Simulator._state.fatigue - 3);
      // 平静度上升
      Simulator._state.calmness = Math.min(90, Simulator._state.calmness + 2);

      if (countdown <= 0) {
        this._endBrainBreak();
      }
    }, 1000);

    this.showToast('短休息已开始 · 请跟随呼吸节奏放松', 'info');
  },

  /**
   * 打开 Brain Break 底部面板（复用通用 bottom sheet）
   */
  _openBrainBreakSheet() {
    var overlay = document.querySelector('.ios-bottom-sheet-overlay');
    var sheet = document.querySelector('.ios-bottom-sheet');
    var body = sheet ? sheet.querySelector('.ios-bottom-sheet-body') : null;
    var content = document.getElementById('brainBreakSheetContent');
    if (overlay && sheet && body && content) {
      if (!body.contains(content)) {
        body.appendChild(content);
      }
      content.style.display = 'block';
      overlay.onclick = function() { App.endBrainBreak(); };
      overlay.classList.add('active');
      sheet.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  _closeBrainBreakSheet() {
    var overlay = document.querySelector('.ios-bottom-sheet-overlay');
    this.hideBottomSheet();
    if (overlay) overlay.onclick = function() { App.hideBottomSheet(); };
  },

  /**
   * 公开方法：结束短休息（供面板按钮/遮罩调用）
   */
  endBrainBreak() {
    this._endBrainBreak();
  },

  /**
   * 呼吸引导文字（圆圈由 CSS 动画驱动）
   */
  _startBreathingGuide() {
    const text = document.getElementById('breathInstruction');
    if (!text) return;

    let isInhaling = true;
    const cycle = () => {
      text.textContent = isInhaling ? '吸气...' : '呼气...';
      isInhaling = !isInhaling;
    };

    cycle(); // 立即开始吸气
    this.timers.breathing = setInterval(cycle, 4000);
  },

  _endBrainBreak() {
    // v39: Guard against duplicate calls (button click + countdown + overlay close)
    if (!this.state.brainBreak) return;

    clearInterval(this.timers.brainBreak);
    clearInterval(this.timers.breathing);
    this.timers.brainBreak = null;
    this.timers.breathing = null;

    this.state.brainBreak = false;

    // 记录 Brain Break 后的疲劳和平静度
    this.state.brainBreakFatigueAfter = Simulator._state.fatigue;
    this.state.brainBreakCalmnessAfter = Simulator._state.calmness;
    this.state.brainBreakCount++;

    // 恢复耳机音频模式
    this.state.ancMode = 'adaptive';
    this.state.audioMode = 'focus';
    this._updateAudioUI();

    this._closeBrainBreakSheet();
    this._updateSessionStatus('tracking');

    // Resume data collection using unified loop
    this._startRealtimeLoop();

    // 重置提醒标志
    this.alertFlags.fatigueHigh = false;

    this.showToast('短休息完成 · 疲劳下降，平静度提升 · 音频已切回专注音乐', 'success');

    // 更新音频统计
    this.state.audioStats.brainBreakAudioCount++;
    this.state.audioStats.ancSwitchCount++;
    this._updateAudioUI();
  },


  // ================================================================
  // 音频与 ANC 控制
  // ================================================================
  setAudioMode(mode) {
    const modeMap = {
      focus: '专注音乐',
      whiteNoise: 'White Noise',
      breath: 'Breath Guide',
      calmAmbient: 'Calm Ambient',
      sleepPrep: 'Sleep Prep',
      brownNoise: 'Brown Noise'
    };
    this.state.audioMode = mode;
    this._updateAudioUI();

    // 同步 iOS segmented control 高亮
    document.querySelectorAll('#audioSegmented .ios-segmented-item').forEach(function(item) {
      item.classList.toggle('active', item.dataset.mode === mode);
    });

    const toastMap = {
      focus: '已切换到专注音乐模式，系统将根据专注度调整音频反馈',
      whiteNoise: '已切换到白噪声模式，帮助屏蔽环境干扰',
      breath: '已开启呼吸引导音频，请跟随节奏放松',
      calmAmbient: '已切换到 Calm Ambient 舒缓环境音',
      sleepPrep: '已切换到 Sleep Prep 睡前准备模式',
      brownNoise: '已切换到 Brown Noise 棕噪声模式'
    };
    this.showToast(toastMap[mode] || '音频模式已切换', 'info');
  },

  setAncMode(mode) {
    const modeMap = {
      adaptive: 'Adaptive',
      max: 'Max',
      awareness: 'Awareness',
      off: 'Off'
    };
    this.state.ancMode = mode;
    this.state.audioStats.ancSwitchCount++;
    this._updateAudioUI();

    const toastMap = {
      adaptive: '已切换到自适应降噪',
      max: '已切换到最大降噪',
      awareness: '已开启环境感知模式，适合音乐恢复环境感知',
      off: '已关闭 ANC 降噪'
    };
    this.showToast(toastMap[mode] || 'ANC 模式已切换', 'info');
  },

  _updateAudioUI() {
    const modeMap = {
      focus: '专注音乐',
      whiteNoise: 'White Noise',
      breath: 'Breath Guide',
      calmAmbient: 'Calm Ambient'
    };
    const ancMap = {
      adaptive: '自适应',
      max: '最大降噪',
      awareness: '环境感知',
      off: '关闭'
    };
    const ambientMap = {
      natural: '自然',
      voice: '人声',
      calmAmbient: 'Calm Ambient'
    };

    const modeEl = document.getElementById('audioModeValue');
    const ancEl = document.getElementById('ancModeValue');
    const ambientEl = document.getElementById('ambientModeValue');
    const volEl = document.getElementById('audioVolumeValue');
    const fbEl = document.getElementById('audioFeedbackStatus');

    if (modeEl) modeEl.textContent = modeMap[this.state.audioMode] || this.state.audioMode;
    if (ancEl) ancEl.textContent = ancMap[this.state.ancMode] || this.state.ancMode;
    if (ambientEl) ambientEl.textContent = ambientMap[this.state.ambientMode] || this.state.ambientMode;
    if (volEl) volEl.textContent = this.state.audioVolume + '%';
    if (fbEl) fbEl.textContent = this.state.audioFeedbackActive ? '根据脑状态自动调整' : '手动模式';
  },


  // ================================================================
  // 数据更新
  // ================================================================
  _updateMetrics() {
    const metrics = Simulator.generateMetrics();
    const device = Simulator.generateDeviceParams();
    this._lastMetrics = metrics;

    // 科学层：生成 EEG 特征
    Simulator.generateEEGFeatures();
    // 科学层：记录指标快照（用于稳定性分析）
    Simulator.recordMetricsSnapshot(metrics);
    // 科学层：计算伪迹风险
    Simulator.calculateArtifactRisk(metrics);
    // 科学层：计算置信度
    Simulator.calculateConfidence(metrics);

    // 同步科学状态到 App
    var sci = Simulator.getScienceSnapshot();
    this.state.eegFeatures = sci.eegFeatures;
    this.state.artifactRisk = sci.artifactRisk;
    this.state.confidence = sci.confidence;

    // 更新 Focus Score
    document.getElementById('metricFocus').textContent = metrics.focus;

    // 更新反馈文案
    this._updateFocusFeedback(metrics);

    // 更新小指标卡片
    this._updateMetricCard('metricFatigue', 'barFatigue', metrics.fatigue);
    this._updateMetricCard('metricCalmness', 'barCalmness', metrics.calmness);
    this._updateMetricCard('metricCognitiveLoad', 'barCognitiveLoad', metrics.cognitiveLoad);
    this._updateMetricCard('metricSignalQuality', 'barSignalQuality', metrics.signalQuality);

    // 同步 Hero 区子指标（v26 新结构）
    var heroFatigue = document.getElementById('heroFatigue');
    if (heroFatigue) heroFatigue.textContent = metrics.fatigue;
    var heroCalmness = document.getElementById('heroCalmness');
    if (heroCalmness) heroCalmness.textContent = metrics.calmness;
    var heroCognitiveLoad = document.getElementById('heroCognitiveLoad');
    if (heroCognitiveLoad) heroCognitiveLoad.textContent = metrics.cognitiveLoad;

    // 科学层：更新置信度/伪迹 UI
    this._updateScienceUI(metrics);

    // 更新趋势图
    if (this.charts.monitor) {
      this.charts.monitor.push(metrics);
    }

    // 更新设备详情
    this._updateDeviceDetails(device);

    // 记录历史
    Object.keys(metrics).forEach(key => {
      if (this.state.metricsHistory[key]) {
        this.state.metricsHistory[key].push(metrics[key]);
      }
    });

    // 记录 Focus 历史（用于报告页计算专注稳定性）
    Simulator.recordFocusHistory(metrics.focus);

    // 记录峰值
    if (metrics.focus > this.state.peakFocus) {
      this.state.peakFocus = metrics.focus;
      this.state.peakFocusTime = this.state.monitorDuration;
    }

    // 更新 Brain Break 描述
    this._updateBrainBreakDesc(metrics);

    // 检查提醒
    this._checkAlerts(metrics, device);

    // 更新健康行动卡片（根据当前状态）
    this._updateActionCard();
  },

  /**
   * 更新 Focus 页健康行动卡片（v26）
   * 根据监测状态、伪迹风险与疲劳负荷切换标题/描述/警示等级
   */
  _updateActionCard() {
    var actionTitle = document.getElementById('actionTitle');
    var actionDesc = document.getElementById('actionDesc');
    var actionCard = document.querySelector('.health-action-card');
    if (!actionTitle || !actionDesc) return;

    // v36: Read from state.device.monitoring
    var dev = this.state.device || {};
    var isLive = dev.monitoring === 'live';
    var isPaused = dev.monitoring === 'paused';
    if (!isLive && !isPaused) {
      actionTitle.textContent = '佩戴后自动实时记录';
      actionDesc.textContent = '佩戴耳机后系统将自动建立个人基线并开始实时记录。';
      if (actionCard) { actionCard.classList.remove('warning', 'danger'); }
    } else {
      var sci = Simulator.getScienceSnapshot ? Simulator.getScienceSnapshot() : {};
      var fatigue = (this._lastMetrics && this._lastMetrics.fatigue != null) ? this._lastMetrics.fatigue : 0;
      if (sci.artifactRisk === 'high' || sci.confidence === 'low') {
        actionTitle.textContent = '暂停自动判断';
        actionDesc.textContent = '当前伪迹风险较高，建议调整耳机佩戴。';
        if (actionCard) { actionCard.classList.remove('warning'); actionCard.classList.add('danger'); }
      } else if (fatigue > 60) {
        actionTitle.textContent = '建议短休息';
        actionDesc.textContent = '疲劳负荷连续升高，建议进行 10 秒 Breath Guide。';
        if (actionCard) { actionCard.classList.remove('danger'); actionCard.classList.add('warning'); }
      } else {
        actionTitle.textContent = '继续当前专注节奏';
        actionDesc.textContent = '当前疲劳负荷较低，可以继续保持 Focus Mix。';
        if (actionCard) { actionCard.classList.remove('warning', 'danger'); }
      }
    }
  },

  _updateEEG() {
    // v34: Skip DOM updates when monitor page is not visible
    if (this._eegPaused) return;
    if (this.charts.eegWave) {
      const waves = Simulator.generateMultiChannelEEG(2);
      this.charts.eegWave.render(waves);
    }
  },

  _updateMetricCard(valueId, barId, value) {
    const valueEl = document.getElementById(valueId);
    const barEl = document.getElementById(barId);
    if (valueEl) valueEl.textContent = value;
    if (barEl) barEl.style.width = value + '%';
  },

  _updateDuration() {
    this.state.monitorDuration++;
    const mins = Math.floor(this.state.monitorDuration / 60);
    const secs = this.state.monitorDuration % 60;
    const el = document.getElementById('monitorDuration');
    if (el) {
      el.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }
  },

  _updateFocusFeedback(metrics) {
    const el = document.getElementById('focusFeedback');
    if (!el) return;

    let feedback = '';
    if (metrics.focus >= 75) {
      feedback = '你当前处于较稳定的专注状态，建议继续保持当前任务节奏。';
    } else if (metrics.focus >= 55) {
      feedback = '专注度适中，可以尝试减少干扰以进入更深的专注状态。';
    } else if (metrics.focus >= 40) {
      feedback = '专注度有所下降，建议调整任务或短暂休息后再继续。';
    } else {
      feedback = '当前专注度较低，建议休息几分钟后再开始下一轮任务。';
    }

    if (metrics.signalQuality < 60) {
      feedback += ' （信号质量较低，数据可信度可能受影响）';
    }

    el.textContent = feedback;
  },

  // ================================================================
  // 科学层方法
  // ================================================================

  /**
   * 切换 Science Mode
   */
  toggleScienceMode() {
    this.state.scienceMode = !this.state.scienceMode;
    document.body.classList.toggle('science-mode', this.state.scienceMode);

    var btn = document.getElementById('scienceModeToggle');
    if (btn) {
      btn.classList.toggle('active', this.state.scienceMode);
      btn.textContent = this.state.scienceMode ? '科学模式 开启' : '科学模式';
    }

    this.showToast(this.state.scienceMode ? '科学解释模式已开启' : '科学解释模式已关闭', 'info');

    // v36: Check state.device.monitoring
    if (this.state.device && this.state.device.monitoring === 'live') {
      var metrics = Simulator.generateMetrics();
      this._updateScienceUI(metrics);
    }
  },

  /**
   * 更新科学层 UI（置信度、伪迹风险、EEG 特征）
   */
  _updateScienceUI(metrics) {
    if (!metrics) metrics = {};
    var conf = this.state.confidence;
    var risk = this.state.artifactRisk;
    var eeg = this.state.eegFeatures;

    var confText = conf === 'high' ? 'High' : conf === 'medium' ? 'Medium' : 'Low';
    var confCls = conf === 'high' ? 'ios-pill-green' : conf === 'medium' ? 'ios-pill-orange' : 'ios-pill-red';
    var riskText = risk === 'high' ? 'High' : risk === 'medium' ? 'Medium' : 'Low';
    var riskCls = risk === 'high' ? 'ios-pill-red' : risk === 'medium' ? 'ios-pill-orange' : 'ios-pill-green';

    // 基线 pill
    var pillBaseline = document.getElementById('pillBaseline');
    // v36: Read baseline from state.device
    var dev = this.state.device || {};
    var baselineReady = dev.baseline === 'ready';
    if (pillBaseline) {
      pillBaseline.textContent = baselineReady ? '基线：已就绪' : '基线：未建立';
      pillBaseline.className = 'ios-pill ' + (baselineReady ? 'ios-pill-green' : 'ios-pill-gray');
    }

    // 信号质量 pill
    var pillSignal = document.getElementById('pillSignal');
    if (pillSignal) {
      var level = Simulator.getSignalQualityLevel(metrics.signalQuality);
      pillSignal.textContent = '信号质量：' + level;
      pillSignal.className = 'ios-pill ' + (metrics.signalQuality >= 60 ? 'ios-pill-green' : 'ios-pill-orange');
    }

    // 伪迹风险 pill
    var pillArtifact = document.getElementById('pillArtifact');
    if (pillArtifact) {
      pillArtifact.textContent = '伪迹风险：' + riskText;
      pillArtifact.className = 'ios-pill ' + riskCls;
    }

    // 置信度 pill
    var pillConfidence = document.getElementById('pillConfidence');
    if (pillConfidence) {
      pillConfidence.textContent = '置信度：' + confText;
      pillConfidence.className = 'ios-pill ' + confCls;
    }

    // Focus 卡片置信度 pill
    var focusConfPill = document.getElementById('focusConfidencePill');
    if (focusConfPill) {
      focusConfPill.textContent = '置信度：' + confText;
      focusConfPill.className = 'ios-pill ' + confCls;
    }

    // 更新 EEG 特征显示
    this._updateEEGFeatureDisplay(eeg);

    // 伪迹风险高时：指标变灰
    var metricCards = document.querySelectorAll('.monitor-area .ios-metric-card');
    metricCards.forEach(function(card) {
      card.style.opacity = risk === 'high' ? '0.5' : '';
    });
  },

  /**
   * 更新置信度徽章
   */
  _updateConfidenceBadge(elementId, confidence) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.className = 'confidence-badge conf-' + confidence;
    var label = confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low';
    el.textContent = '置信度：' + label;
  },

  /**
   * 更新 EEG 特征显示
   */
  _updateEEGFeatureDisplay(eeg) {
    var alphaEl = document.getElementById('eegAlphaValue');
    var thetaEl = document.getElementById('eegThetaValue');
    var betaEl = document.getElementById('eegBetaValue');
    var ratioEl = document.getElementById('eegRatioValue');

    if (alphaEl) alphaEl.textContent = eeg.alpha;
    if (thetaEl) thetaEl.textContent = eeg.theta;
    if (betaEl) betaEl.textContent = eeg.beta;
    if (ratioEl) ratioEl.textContent = eeg.alphaThetaRatio;
  },

  /**
   * 获取推荐理由（供 Recovery 页面使用）
   */
  getRecommendationReason(scene) {
    var metrics = Simulator.generateMetrics();
    return Simulator.getRecommendationReason(scene, metrics);
  },

  _updateBrainBreakDesc(metrics) {
    const el = document.getElementById('nextBreakTime');
    if (!el) return;

    let minsLeft;
    if (metrics.fatigue > 60) {
      minsLeft = 0;
    } else if (metrics.fatigue > 40) {
      minsLeft = Math.max(5, Math.round((75 - metrics.fatigue) / 3));
    } else {
      minsLeft = 12;
    }
    el.textContent = minsLeft;
  },

  /**
   * 更新设备详情面板
   */
  _updateDeviceDetails(device) {
    const contactQ = document.getElementById('devContactQuality');
    const packetLoss = document.getElementById('devPacketLoss');
    const noiseLevel = document.getElementById('devNoiseLevel');
    const impedance = document.getElementById('devImpedance');

    if (contactQ) {
      contactQ.textContent = device.contactImpedance < 30 ? '佩戴良好' : '需调整';
    }
    if (packetLoss) packetLoss.textContent = device.packetLoss + '%';
    if (noiseLevel) noiseLevel.textContent = device.noiseLevel + ' uV';
    if (impedance) impedance.textContent = device.contactImpedance + ' kOhm';
  },

  _updateSessionStatus(status) {
    const el = document.getElementById('sessionStatus');
    const sub = document.getElementById('sessionSubtext');
    const dot = document.getElementById('statusDot');

    const map = {
      idle:     { title: '等待佩戴耳机', sub: '佩戴后自动实时记录', color: '' },
      tracking: { title: '实时记录中', sub: '正在自动记录脑状态趋势', color: 'var(--ios-green)' },
      break:    { title: '休息中', sub: '跟随呼吸节奏放松', color: 'var(--ios-blue)' },
      alert:    { title: '建议休息', sub: '疲劳度较高，建议短休息', color: 'var(--ios-orange)' }
    };
    const s = map[status] || map.idle;
    if (el) el.textContent = s.title;
    if (sub) sub.textContent = s.sub;
    if (dot) {
      dot.style.background = s.color || '';
      dot.classList.toggle('pulse', status === 'alert');
    }
  },


  // ================================================================
  // 智能提醒
  // ================================================================
  _checkAlerts(metrics, device) {
    // 疲劳度 > 75
    if (metrics.fatigue > 75 && !this.alertFlags.fatigueHigh) {
      this.alertFlags.fatigueHigh = true;
      this._updateSessionStatus('alert');
      this.showAlert(
        '疲劳上升',
        '检测到疲劳度达到 ' + metrics.fatigue + '%，建议进行短休息 5 分钟。',
        'warning',
        'alertContainer'
      );
    }
    if (metrics.fatigue < 55) {
      this.alertFlags.fatigueHigh = false;
      // v36: Check state.device.monitoring
      if (this.state.device && this.state.device.monitoring === 'live' && !this.state.brainBreak) {
        this._updateSessionStatus('tracking');
      }
    }

    // 专注度 < 40
    if (metrics.focus < 40 && !this.alertFlags.focusLow) {
      this.alertFlags.focusLow = true;
      this.showAlert(
        '专注下降',
        '当前专注度为 ' + metrics.focus + '%，建议降低任务难度或短暂休息。',
        'warning',
        'alertContainer'
      );
    }
    if (metrics.focus > 55) this.alertFlags.focusLow = false;

    // 信号质量 < 60
    if (metrics.signalQuality < 60 && !this.alertFlags.signalPoor) {
      this.alertFlags.signalPoor = true;
      this.showAlert(
        '信号质量低',
        '信号质量下降至 ' + metrics.signalQuality + '%，建议调整耳机佩戴位置或清洁传感器接触区域。',
        'danger',
        'alertContainer'
      );
    }
    if (metrics.signalQuality > 70) this.alertFlags.signalPoor = false;
  },


  // ================================================================
  // 提醒弹窗
  // ================================================================
  showAlert(title, message, type = 'info', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const icons = {
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
      danger: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
    };

    const alert = document.createElement('div');
    alert.className = 'alert alert-' + type;
    alert.innerHTML = `
      <div class="alert-icon">${icons[type] || icons.info}</div>
      <div class="alert-body">
        <div class="alert-title">${title}</div>
        <div class="alert-message">${message}</div>
      </div>
      <button class="alert-close" type="button" aria-label="关闭提醒">&times;</button>
    `;
    container.appendChild(alert);

    // v53: Use addEventListener instead of inline onclick
    const closeBtn = alert.querySelector('.alert-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        alert.remove();
      });
    }

    setTimeout(() => {
      if (alert.parentElement) {
        alert.style.animation = 'alertSlide 0.3s ease reverse';
        setTimeout(() => alert.remove(), 300);
      }
    }, 8000);
  },


  // ================================================================
  // Toast
  // ================================================================
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastSlide 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },


  // ================================================================
  // iOS 动画工具
  // ================================================================
  animateNumber: function(element, from, to, duration, decimals, prefix, suffix) {
    if (!element) return;
    duration = duration || 500;
    prefix = prefix || '';
    suffix = suffix || '';
    decimals = (decimals !== undefined) ? decimals : (to % 1 !== 0 ? 1 : 0);
    var start = performance.now();
    function frame(now) {
      var progress = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = from + (to - from) * eased;
      element.textContent = prefix + current.toFixed(decimals) + suffix;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        element.textContent = prefix + to.toFixed(decimals) + suffix;
        element.classList.add('bumping');
        setTimeout(function() { element.classList.remove('bumping'); }, 300);
      }
    }
    requestAnimationFrame(frame);
  },

  dissolveText: function(element, newText) {
    if (!element) return;
    if (element.textContent === newText) return;
    element.classList.add('dissolving-out');
    setTimeout(function() {
      element.textContent = newText;
      element.classList.remove('dissolving-out');
      element.classList.add('dissolving-in');
      requestAnimationFrame(function() {
        element.classList.remove('dissolving-in');
      });
    }, 300);
  },

  // v28: Unified animation utilities
  staggerReveal: function(container) {
    if (!container) return;
    var items = container.querySelectorAll('.ios-stagger-item, .stagger-item');
    items.forEach(function(item, i) {
      setTimeout(function() {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, i * 80);
    });
  },

  runWhenVisible: function(el, callback, threshold) {
    if (!el || typeof callback !== 'function') return;
    threshold = threshold || 0.15;
    if (!('IntersectionObserver' in window)) { callback(el); return; }
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          callback(el);
          observer.unobserve(el);
        }
      });
    }, { threshold: threshold });
    observer.observe(el);
  },

  pausePageAnimations: function(pageName) {
    var page = document.getElementById('page-' + pageName) || document.querySelector('.page.is-active');
    if (!page) return;
    // v34: Pause all animated elements in inactive pages
    var animatedEls = page.querySelectorAll(
      '.eeg-wave-bg path, .recovery-waveform .recovery-waveform-bar, .breath-guide-circle, ' +
      '.scene-wave-focus span, .scene-wave-noise span, .scene-wave-breath, .scene-wave-calm, ' +
      '.nf-sleep-tl-bar, .nf-sleep-stage, .nf-sleep-ring-circle, .nf-sleep-long-bar-fill'
    );
    animatedEls.forEach(function(el) {
      el.style.animationPlayState = 'paused';
    });
    // Stop DOM updates for hidden pages
    // v36: Check state.device.monitoring
    if (pageName === 'monitor' && this.state.device && this.state.device.monitoring === 'live') {
      // Keep data simulation but skip DOM-heavy EEG waveform updates
      this._eegPaused = true;
    }
  },

  resumePageAnimations: function(pageName) {
    var page = document.getElementById('page-' + pageName);
    if (!page) return;
    // v38: Remove is-paused class from all elements
    page.querySelectorAll('.is-paused').forEach(function(el) {
      el.classList.remove('is-paused');
    });
    // Also set animationPlayState to running for safety
    var animatedEls = page.querySelectorAll(
      '.eeg-wave-bg path, .recovery-waveform .recovery-waveform-bar, .breath-guide-circle, ' +
      '.scene-wave-focus span, .scene-wave-noise span, .scene-wave-breath, .scene-wave-calm, ' +
      '.nf-sleep-tl-bar, .nf-sleep-stage, .nf-sleep-ring-circle, .nf-sleep-long-bar-fill'
    );
    animatedEls.forEach(function(el) {
      el.style.animationPlayState = 'running';
    });
    // Resume DOM updates
    if (pageName === 'monitor') {
      this._eegPaused = false;
    }
  },

  updateWaveform: function(scene) {
    var containers = document.querySelectorAll('.recovery-waveform');
    containers.forEach(function(container) {
      var type = scene || container.dataset.wfType || 'focus';
      container.className = 'recovery-waveform wf-' + type;
      if (!container.children.length) {
        var count = type === 'breath' ? 10 : 16;
        for (var i = 0; i < count; i++) {
          var bar = document.createElement('span');
          bar.className = 'recovery-waveform-bar';
          bar.style.animationDelay = (i * 0.05) + 's';
          container.appendChild(bar);
        }
      }
    });
  },

  // v28: Count-up on visible
  initCountUp: function() {
    var self = this;
    var countEls = document.querySelectorAll('[data-count-target]');
    countEls.forEach(function(el) {
      self.runWhenVisible(el, function(element) {
        var target = parseFloat(element.dataset.countTarget);
        var prefix = element.dataset.countPrefix || '';
        var suffix = element.dataset.countSuffix || '';
        var decimals = target % 1 !== 0 ? 1 : 0;
        self.animateNumber(element, 0, target, 1200, decimals, prefix, suffix);
      });
    });
  },

  // v28: Science mechanism light-up
  initScienceLightUp: function() {
    var mechanisms = document.querySelectorAll('.science-mechanism');
    mechanisms.forEach(function(mech, i) {
      setTimeout(function() {
        mech.classList.add('lit');
      }, i * 200);
    });
  },

  showBottomSheet: function(contentId) {
    var overlay = document.querySelector('.ios-bottom-sheet-overlay');
    var sheet = document.querySelector('.ios-bottom-sheet');
    if (!overlay || !sheet) return;
    var content = document.getElementById(contentId);
    if (content) {
      var sheetBody = sheet.querySelector('.ios-bottom-sheet-body');
      if (sheetBody) {
        sheetBody.innerHTML = content.innerHTML;
      }
    }
    overlay.classList.add('active');
    sheet.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  hideBottomSheet: function() {
    var overlay = document.querySelector('.ios-bottom-sheet-overlay');
    var sheet = document.querySelector('.ios-bottom-sheet');
    if (overlay) overlay.classList.remove('active');
    if (sheet) sheet.classList.remove('active');
    document.body.style.overflow = '';
  },

  revealPageCards: function(pageName) {
    var page = document.getElementById('page-' + pageName);
    if (!page) return;
    var items = page.querySelectorAll('.ios-stagger-item');
    items.forEach(function(item, i) {
      setTimeout(function() {
        item.classList.add('revealed');
      }, i * 60);
    });
  },

  updateMetricSmoothly: function(metricId, value) {
    var el = document.getElementById(metricId);
    if (!el) return;
    var current = parseFloat(el.textContent) || 0;
    if (current === value) return;
    this.animateNumber(el, current, value, 500);
    var bar = el.parentElement.querySelector('.ios-metric-bar-fill');
    if (bar) {
      bar.style.width = value + '%';
    }
  },


  // ================================================================
  // 图表初始化
  // ================================================================
  _initMonitorCharts() {
    if (!this.charts.monitor) {
      const canvas = document.getElementById('monitorChart');
      if (canvas) {
        this.charts.monitor = new RealtimeChart(canvas, {
          maxPoints: 60, minY: 0, maxY: 100,
          series: [
            { key: 'focus', color: '#34d399' },
            { key: 'fatigue', color: '#fbbf24' },
            { key: 'cognitiveLoad', color: '#a78bfa' },
            { key: 'calmness', color: '#60a5fa' }
          ]
        });
      }
    }
    if (!this.charts.eegWave) {
      const canvas = document.getElementById('eegWaveChart');
      if (canvas) {
        this.charts.eegWave = new MultiChannelEEG(canvas);
      }
    }
  },

  _initRecoveryChart() {
    if (!this.charts.recovery) {
      const canvas = document.getElementById('recoveryChart');
      if (canvas) {
        this.charts.recovery = new RealtimeChart(canvas, {
          maxPoints: 60, minY: 0, maxY: 100,
          series: [
            { key: 'participation', color: '#34d399' },
            { key: 'fatigueRisk', color: '#fbbf24' },
            { key: 'stability', color: '#60a5fa' }
          ]
        });
      }
    }
  },


  // ================================================================
  // 报告数据生成
  // ================================================================
  generateReportData(options) {
    options = options || {};
    const source = options.source || 'manual';
    const sampleStartIndex = options.sampleStartIndex || 0;
    const recoveryStartIndex = options.recoveryStartIndex || 0;
    const commandStartIndex = options.commandStartIndex || 0;
    const durationStart = options.durationStart || 0;
    const brainBreakStartCount = options.brainBreakStartCount || 0;
    const brainBreakAudioStartCount = options.brainBreakAudioStartCount || 0;
    const ancSwitchStartCount = options.ancSwitchStartCount || 0;
    const recoveryCueStartCount = options.recoveryCueStartCount || 0;
    const focusMusicStartTime = options.focusMusicStartTime || 0;
    const timedOut = !!options.timedOut;

    // v46: Slice metrics to only this run's samples
    const raw = this.state.metricsHistory;
    const h = {
      focus: raw.focus.slice(sampleStartIndex),
      fatigue: raw.fatigue.slice(sampleStartIndex),
      cognitiveLoad: raw.cognitiveLoad.slice(sampleStartIndex),
      calmness: raw.calmness.slice(sampleStartIndex),
      signalQuality: raw.signalQuality.slice(sampleStartIndex)
    };

    // v46: Slice recovery history to only this run's data
    const rawRh = this.state.recoveryHistory;
    const rh = {
      participation: rawRh.participation.slice(recoveryStartIndex),
      fatigueRisk: rawRh.fatigueRisk.slice(recoveryStartIndex),
      recoveryIndex: rawRh.recoveryIndex.slice(recoveryStartIndex),
      stability: rawRh.stability.slice(recoveryStartIndex)
    };

    // v46: Slice command log and audio stats to only this run's data
    const runCommandLog = (this.state.commandLog || []).slice(commandStartIndex);
    const runAudioStats = {
      focusMusicTime: Math.max(0, ((this.state.audioStats ? this.state.audioStats.focusMusicTime : 0) || 0) - focusMusicStartTime),
      brainBreakAudioCount: Math.max(0, ((this.state.audioStats ? this.state.audioStats.brainBreakAudioCount : 0) || 0) - brainBreakAudioStartCount),
      ancSwitchCount: Math.max(0, ((this.state.audioStats ? this.state.audioStats.ancSwitchCount : 0) || 0) - ancSwitchStartCount),
      recoveryCueCount: Math.max(0, ((this.state.audioStats ? this.state.audioStats.recoveryCueCount : 0) || 0) - recoveryCueStartCount)
    };

    const runBrainBreakCount = Math.max(0, (this.state.brainBreakCount || 0) - brainBreakStartCount);
    const runDuration = Math.max(0, (this.state.monitorDuration || 0) - durationStart);

    // v46: Recalculate peakFocus and peakFocusTime from this run's sliced data
    var runPeakFocus = 0;
    var runPeakFocusTime = 0;
    if (h.focus.length) {
      runPeakFocus = Math.max.apply(null, h.focus);
      runPeakFocusTime = h.focus.indexOf(runPeakFocus) * 1; // each sample ~1s
    }

    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const max = arr => arr.length ? Math.max(...arr) : 0;

    const avgFocus = avg(h.focus);
    const maxFatigue = max(h.fatigue);
    const avgSignal = avg(h.signalQuality);
    const avgCalmness = avg(h.calmness);
    const avgLoad = avg(h.cognitiveLoad);

    // 疲劳风险等级
    let fatigueRisk = 'Low';
    if (maxFatigue > 70) fatigueRisk = 'High';
    else if (maxFatigue > 50) fatigueRisk = 'Moderate';

    // 认知准备度
    const cognitiveReadinessData = Simulator.generateCognitiveReadiness();
    const cognitiveReadiness = cognitiveReadinessData.score;

    // 脑健康趋势指标
    const brainHealth = Simulator.generateBrainHealthMetrics();

    // 大脑年龄
    const brainAge = Simulator.generateBrainAge();

    // 心理恢复度
    const mentalRecovery = brainHealth.mentalRecovery;

    // 音乐恢复数据 — v46: use sliced rh
    const hasRecovery = rh.participation.length > 0;
    const avgParticipation = avg(rh.participation);
    const maxRecoveryFatigue = max(rh.fatigueRisk);
    const avgStability = avg(rh.stability);
    const lastCognitiveLoad = rh.stability.length > 0 ? rh.stability[rh.stability.length - 1] : 0;

    let suggestedVolume = 60;
    if (maxRecoveryFatigue > 60) suggestedVolume = 40;
    else if (maxRecoveryFatigue > 40) suggestedVolume = 50;

    // 每日洞察（3 条动态生成）
    const insights = [];

    // 1. 专注洞察 — v46: use run peakFocus
    if (runPeakFocusTime > 0 && runPeakFocusTime < 300) {
      insights.push({
        type: 'focus',
        title: '专注洞察 Focus Insight',
        text: '你在本次会话前 ' + Math.floor(runPeakFocusTime / 60) + ' 分钟保持了较高专注（峰值 ' + runPeakFocus + '），随后疲劳开始缓慢上升。'
      });
    } else if (avgFocus > 70) {
      insights.push({
        type: 'focus',
        title: '专注洞察 Focus Insight',
        text: '你在本次会话中整体保持了较高的专注水平（均值 ' + avgFocus + '），建议保持当前的工作节奏。'
      });
    } else {
      insights.push({
        type: 'focus',
        title: '专注洞察 Focus Insight',
        text: '本次会话专注度波动较大（均值 ' + avgFocus + '），建议减少环境干扰，在疲劳感出现前主动休息。'
      });
    }

    // 2. 休息洞察 — v46: use run brain break count
    if (maxFatigue > 70) {
      insights.push({
        type: 'break',
        title: '休息洞察 Break Insight',
        text: '本次疲劳峰值达到 ' + maxFatigue + '%，建议在 35–45 分钟时主动进行 Brain Break，而不是等到疲劳过高后再休息。'
      });
    } else if (runBrainBreakCount > 0) {
      const fatigueDrop = this.state.brainBreakFatigueBefore - this.state.brainBreakFatigueAfter;
      insights.push({
        type: 'break',
        title: '休息洞察 Break Insight',
        text: '你已完成 ' + runBrainBreakCount + ' 次 Brain Break，疲劳值下降 ' + fatigueDrop + '%，恢复效果良好。建议继续保持定时休息习惯。'
      });
    } else {
      insights.push({
        type: 'break',
        title: '休息洞察 Break Insight',
        text: '建议在 35–45 分钟时主动进行 Brain Break，休息时远离屏幕、闭眼放松、深呼吸。'
      });
    }

    // 3. 音乐恢复洞察
    if (hasRecovery) {
      if (maxRecoveryFatigue > 60) {
        insights.push({
          type: 'recovery',
          title: '音乐恢复洞察 Recovery Insight',
          text: '音乐恢复中 Recovery Index' + (avgParticipation > 60 ? '良好' : '中等') + '，但疲劳负荷升高（峰值 ' + maxRecoveryFatigue + '%）。建议增加声音场景切换次数，安排休息后继续。'
        });
      } else {
        insights.push({
          type: 'recovery',
          title: '音乐恢复洞察 Recovery Insight',
          text: '音乐恢复中 Recovery Index' + (avgParticipation > 60 ? '良好' : '中等') + '（' + avgParticipation + '%），疲劳负荷可控。建议保持当前声音场景。'
        });
      }
    } else {
      insights.push({
        type: 'recovery',
        title: '音乐恢复洞察 Recovery Insight',
        text: '本次未连接音乐软件 Demo Connector。系统仍基于本地声音场景生成了恢复建议；若需展示外部音乐联动，可在音乐恢复页连接 Demo Connector 并发送切换指令。'
      });
    }

    // 信号质量提示
    if (avgSignal < 70) {
      insights.push({
        type: 'signal',
        title: '数据可信度 Data Confidence',
        text: '信号质量偏低（' + avgSignal + '%），部分脑健康指标可信度下降，建议检查耳机佩戴位置。'
      });
    }

    // 旧版 insight 兼容
    const insight = insights[0].text;

    // Brain Break 建议
    const breakAdvice = [];
    breakAdvice.push('建议每 35-45 分钟进行一次短休息（3-5 分钟）');
    if (maxFatigue > 70) {
      breakAdvice.push('本次疲劳峰值较高，建议在疲劳指数连续 5 分钟超过阈值时暂停任务');
    }
    if (avgSignal < 70) {
      breakAdvice.push('信号质量偏低，建议检查耳机佩戴位置，确保传感器与皮肤良好接触');
    }
    breakAdvice.push('休息时建议远离屏幕，进行简单的眼部和颈部放松');

    // 音乐恢复建议 — v46: use runCommandLog for accurate count
    var musicRecoveryNote;
    if (this.state.musicApp.connected && runCommandLog.length > 0) {
      musicRecoveryNote = '本次体验中，NeuroFocus 已向 Demo 音乐软件发送 ' + runCommandLog.length + ' 次声音场景切换指令。疲劳上升时推荐 Breath Guide，恢复阶段建议 Calm Ambient。';
    } else if (this.state.musicApp.connected) {
      musicRecoveryNote = '本次体验已连接音乐软件 Demo Connector，但没有发送外部切换指令。系统基于本地声音场景生成了音乐恢复建议。';
    } else {
      musicRecoveryNote = '本次体验未连接音乐软件 Demo Connector，也未发送外部切换指令。系统基于本地声音场景生成了音乐恢复建议：疲劳上升时推荐 Breath Guide，恢复阶段建议 Calm Ambient。';
    }

    // Brain Break 统计 — v46: use run count
    const brainBreakStats = {
      count: runBrainBreakCount,
      fatigueRecovery: runBrainBreakCount > 0
        ? this.state.brainBreakFatigueBefore - this.state.brainBreakFatigueAfter
        : 0,
      calmnessIncrease: runBrainBreakCount > 0
        ? this.state.brainBreakCalmnessAfter - this.state.brainBreakCalmnessBefore
        : 0
    };

    // 科学层数据
    var scienceData = {
      eegFeatures: this.state.eegFeatures,
      artifactRisk: this.state.artifactRisk,
      confidence: this.state.confidence,
      baselineReady: this.state.device && this.state.device.baseline === 'ready',
      avgSignal: avgSignal,
      // 科学解释
      whatChanged: this._generateWhatChanged(maxFatigue, avgCalmness, avgFocus),
      whyRecommended: this._generateWhyRecommended(maxFatigue, avgSignal),
      howConfident: this._generateHowConfident(avgSignal, this.state.confidence),
      whatNotToConclude: '不能据此判断疾病、焦虑障碍、睡眠障碍或真实脑年龄变化。所有指标仅表示趋势估计，不代表医学诊断。',
      // 指标公式说明
      formulas: {
        focusTrend: '由 Beta 活动、Alpha 抑制趋势、信号稳定性共同构成的模拟分数。',
        fatigueLoad: '由 Theta 相对升高、Alpha 波动、专注下降趋势共同构成的模拟分数。',
        calmnessEstimate: '由 Alpha 稳定性、低伪迹风险、低认知负荷共同构成的模拟分数。',
        recoveryIndex: 'Recovery Index = Calmness × 0.5 + (100 - Fatigue Load) × 0.3 + (100 - Cognitive Load) × 0.2',
        formulaNote: '公式仅用于 Demo 可视化展示。'
      }
    };

    // Auto-generate sleep insight if not available
    if (!this.state.sleepInsight || !this.state.sleepInsight.available) {
      this.state.sleepInsight = Simulator.generateAutoSleepInsight();
    }

    // v48: Compute mostUsedScene from this run's command log, not global currentPlaylist
    var runMostUsedScene;
    if (runCommandLog.length > 0) {
      var lastCmd = runCommandLog[runCommandLog.length - 1];
      runMostUsedScene = lastCmd.scene || lastCmd.name || 'Breath Guide Demo';
    } else {
      runMostUsedScene = (this.state.localScene && this.state.localScene.label)
        ? this.state.localScene.label + ' Demo'
        : 'Breath Guide Demo';
    }

    this.state.reportData = {
      duration: runDuration,
      avgFocus, maxFatigue, avgSignal, avgCalmness, avgLoad,
      fatigueRisk, cognitiveReadiness, cognitiveReadinessData,
      brainHealth, brainAge, mentalRecovery,
      peakFocus: runPeakFocus, peakFocusTime: runPeakFocusTime,
      insights, insight,
      breakAdvice, brainBreakStats,
      // v47: Top-level convenience fields for UI
      brainBreakCount: runBrainBreakCount,
      commandCount: runCommandLog.length,
      reportSource: source,
      reportTimedOut: timedOut,
      // v48: Most used scene from this run, not global currentPlaylist
      mostUsedScene: runMostUsedScene,
      hasRecovery, avgParticipation, maxRecoveryFatigue, avgStability,
      lastCognitiveLoad, suggestedVolume, musicRecoveryNote,
      hasSleep: !!(this.state.sleepInsight && this.state.sleepInsight.available),
      focusHistory: h.focus.slice(),
      recoveryHistory: rh,
      audioStats: runAudioStats,
      musicApp: { ...this.state.musicApp },
      science: scienceData,
      sleepInsight: this.state.sleepInsight,
      // v47: Run metadata — source is explicit, not inferred from startIndex
      runMeta: {
        source: source,
        runId: options.runId || null,
        sampleStartIndex: sampleStartIndex,
        sampleCount: h.focus.length,
        recoverySampleCount: rh.participation.length,
        commandCount: runCommandLog.length,
        duration: runDuration,
        timedOut: timedOut
      }
    };

    return this.state.reportData;
  },

  /**
   * 生成"发生了什么变化"科学解释
   */
  _generateWhatChanged(maxFatigue, avgCalmness, avgFocus) {
    var parts = [];
    if (maxFatigue > 60) parts.push('疲劳负荷在后段升高（峰值 ' + maxFatigue + '）');
    if (avgCalmness < 50) parts.push('平静度估计下降（均值 ' + avgCalmness + '）');
    if (parts.length === 0) parts.push('各项指标整体平稳');
    var trigger = maxFatigue > 60 ? '，触发了 Breath Guide 推荐' : '';
    return '本次会话中，' + parts.join('，') + trigger + '。';
  },

  /**
   * 生成"为什么推荐音乐"科学解释
   */
  _generateWhyRecommended(maxFatigue, avgSignal) {
    var reason = '因为模拟 EEG 特征显示';
    var parts = [];
    if (maxFatigue > 60) parts.push('认知负荷和疲劳趋势升高');
    if (avgSignal >= 70) parts.push('信号质量处于可解释范围');
    else parts.push('信号质量一般，解读需谨慎');
    return reason + parts.join('，') + '。';
  },

  /**
   * 生成"置信度如何"科学解释
   */
  _generateHowConfident(avgSignal, confidence) {
    var confText = confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low';
    var signalText = avgSignal >= 70 ? '信号质量良好' : '信号质量一般';
    return '本次主要判断置信度为 ' + confText + '。' + signalText + '，但 Demo 数据仍为模拟生成。';
  },


  // ================================================================
  // 认知快照（10 秒加速版）
  // ================================================================
  startCognitiveSnapshot() {
    const overlay = document.getElementById('snapshotOverlay');
    const circle = document.getElementById('snapshotProgressCircle');
    const statusText = document.getElementById('snapshotStatusText');
    const descText = document.getElementById('snapshotDescText');
    const countdownText = document.getElementById('snapshotCountdown');

    if (!overlay) return;
    overlay.style.display = 'flex';

    // 圆形进度参数
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    if (circle) {
      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = circumference;
    }

    const steps = [
      { status: '睁眼', desc: '请保持眼睛睁开，注视前方' },
      { status: '保持放松', desc: '保持身体放松，自然呼吸' },
      { status: '正在建立基线', desc: '系统正在采集脑电基线数据...' },
      { status: '快照完成', desc: '认知快照已完成，正在生成报告...' }
    ];

    let elapsed = 0;
    const totalDuration = 10; // 10 秒
    let currentStep = 0;

    const updateStep = () => {
      const stepIndex = Math.min(Math.floor(elapsed / 2.5), steps.length - 1);
      if (stepIndex !== currentStep) {
        currentStep = stepIndex;
        if (statusText) statusText.textContent = steps[currentStep].status;
        if (descText) descText.textContent = steps[currentStep].desc;
      }
    };

    if (statusText) statusText.textContent = steps[0].status;
    if (descText) descText.textContent = steps[0].desc;
    if (countdownText) countdownText.textContent = totalDuration + 's';

    this.timers.snapshot = setInterval(() => {
      elapsed += 0.1;
      updateStep();

      // 更新圆形进度
      const progress = elapsed / totalDuration;
      if (circle) {
        circle.style.strokeDashoffset = circumference * (1 - progress);
      }
      if (countdownText) {
        countdownText.textContent = Math.max(0, Math.ceil(totalDuration - elapsed)) + 's';
      }

      if (elapsed >= totalDuration) {
        clearInterval(this.timers.snapshot);
        this._completeCognitiveSnapshot();
      }
    }, 100);
  },

  _completeCognitiveSnapshot() {
    const overlay = document.getElementById('snapshotOverlay');
    if (overlay) overlay.style.display = 'none';

    // 生成认知快照结果
    const result = Simulator.generateCognitiveReadiness();
    this.state.cognitiveSnapshotResult = result;

    // 更新报告页的认知准备度卡片
    const scoreEl = document.getElementById('cognitiveReadinessScore');
    const sleepEl = document.getElementById('cognitiveReadinessSleep');
    const mentalEl = document.getElementById('cognitiveReadinessMental');
    const suggestEl = document.getElementById('cognitiveReadinessSuggestion');

    if (scoreEl) scoreEl.textContent = result.score;
    if (sleepEl) sleepEl.textContent = result.sleepRecovery;
    if (mentalEl) mentalEl.textContent = result.mentalReadiness;
    if (suggestEl) suggestEl.textContent = result.suggestion;

    // 更新圆形仪表
    const gauge = document.getElementById('cognitiveReadinessGauge');
    if (gauge) {
      const radius = 54;
      const circumference = 2 * Math.PI * radius;
      gauge.style.strokeDasharray = circumference;
      gauge.style.strokeDashoffset = circumference * (1 - result.score / 100);
    }

    this.showToast('认知快照完成 · 认知准备度 ' + result.score + '/100', 'success');
  },


  // ================================================================
  // 重启 Demo
  // ================================================================
  restartDemo() {
    // 停止所有定时器
    clearInterval(this.timers.monitor);
    clearInterval(this.timers.duration);
    clearInterval(this.timers.eeg);
    clearInterval(this.timers.brainBreak);
    clearInterval(this.timers.calibration);
    clearInterval(this.timers.breathing);
    clearInterval(this.timers.snapshot);

    // 停止睡眠监测定时器
    // Sleep monitoring cleanup handled by Simulator.resetSleep()

    this.state.sleepInsight = {
      available: false, source: 'auto-demo', sleepWindow: '', transitionTime: '',
      stability: 0, deepSleepTrend: 0, remLikeTrend: 0,
      artifactRisk: '', signalQuality: '', confidence: '',
      recommendedScene: '', summary: ''
    };

    // v37: Reset state — only state.device is the source of truth
    this.state = {
      currentPage: 'home',
      device: {
        fit: 'notWorn',        // notWorn / checking / goodFit / looseFit
        sync: 'idle',           // idle / syncing / synced
        baseline: 'pending',    // pending / building / ready
        monitoring: 'idle'      // idle / live / paused
      },
      brainBreak: false,
      monitorStartTime: null,
      monitorDuration: 0,
      metricsHistory: { focus: [], fatigue: [], cognitiveLoad: [], calmness: [], signalQuality: [] },
      recoveryHistory: { participation: [], fatigueRisk: [], recoveryIndex: [], stability: [] },
      reportData: null,
      peakFocus: 0,
      peakFocusTime: 0,
      brainBreakCount: 0,
      brainBreakFatigueBefore: 0,
      brainBreakFatigueAfter: 0,
      brainBreakCalmnessBefore: 0,
      brainBreakCalmnessAfter: 0,
      cognitiveSnapshotResult: null,
      audioMode: 'focus',
      ancMode: 'adaptive',
      ambientMode: 'natural',
      audioVolume: 65,
      audioFeedbackActive: true,
      audioStats: {
        focusMusicTime: 0,
        brainBreakAudioCount: 0,
        ancSwitchCount: 0,
        recoveryCueCount: 0
      },
      musicApp: {
        connected: false,
        provider: null,
        currentPlaylist: 'Focus Mix',
        switches: 0,
        lastSwitch: null,
        adaptation: true
      },
      // v34: Local scene preview — separated from musicApp.currentPlaylist
      localScene: {
        selected: 'focus',
        label: 'Focus Mix'
      },
      commandLog: [],
      scienceMode: this.state.scienceMode || false,
      eegFeatures: { alpha: 0, theta: 0, beta: 0, alphaThetaRatio: 0 },
      artifactRisk: 'low',
      confidence: 'high'
    };
    this.calibrating = false;

    // 重置模拟器
    Simulator.reset();

    // 重置图表
    if (this.charts.monitor) this.charts.monitor.clear();
    if (this.charts.recovery) this.charts.recovery.clear();

    // 重置 UI
    this._updateDeviceUI();
    this._updateSessionStatus('idle');

    var monitorArea = document.getElementById('monitorArea');
    if (monitorArea) { monitorArea.style.display = 'none'; monitorArea.classList.add('hidden-default'); }
    // v33: scenarioBar removed from HTML — no need to hide it
    var sb = document.getElementById('scenarioBar');
    if (sb) sb.style.display = 'none';
    this._closeBrainBreakSheet();
    var calCard = document.getElementById('calibrationCard');
    if (calCard) { calCard.style.display = 'none'; calCard.classList.add('hidden-default'); }
    var devCard = document.getElementById('deviceDetailsCard');
    if (devCard) { devCard.style.display = 'none'; devCard.classList.add('hidden-default'); }

    // v43: Reset experience state and checklist
    this.state.experience = null;
    this._experienceRetryCount = 0;
    // v45: Reset report experience run state
    this.state.reportExperience = null;
    this.setReportExperienceLoading(false);
    document.querySelectorAll('.experience-step').forEach(function(el) {
      el.classList.remove('done', 'active');
    });

    document.getElementById('btnStopSession').disabled = true;

    // Reset connect button text
    var btnConnect = document.getElementById('btnConnect');
    if (btnConnect) {
      btnConnect.textContent = '模拟戴上耳机';
      btnConnect.disabled = false;
    }
    var btnStop = document.getElementById('btnStopSession');
    if (btnStop) {
      btnStop.textContent = '暂停实时记录';
      btnStop.disabled = true;
    }

    // v31: Reset music connector buttons
    document.querySelectorAll('[data-action="open-music-connector"]').forEach(function(btn) {
      btn.textContent = '连接音乐软件';
    });

    // 清空提醒
    document.getElementById('alertContainer').innerHTML = '';
    if (document.getElementById('recoveryAlertContainer')) {
      document.getElementById('recoveryAlertContainer').innerHTML = '';
    }

    // 回到首页
    this.navigate('home');
    this.showToast('Demo 已重启', 'info');

    // 重置评审步骤状态
    this._judgeStep = 0;
    document.querySelectorAll('.judge-step-btn').forEach(btn => btn.classList.remove('completed'));
  },


  // ================================================================
  // 评审快速体验模式
  // ================================================================

  _judgeStep: 0,
  _judgeRunning: false,

  toggleJudgePanel() {
    const panel = document.getElementById('judgePanel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  },

  /**
   * 评审步骤执行
   */
  judgeStep(step) {
    switch (step) {
      case 1:
        this._judgeStartExperience();
        break;
      case 2:
        this._judgeViewEEG();
        break;
      case 3:
        this._judgeConnectMusic();
        break;
      case 4:
        this._judgeViewScene();
        break;
      case 5:
        this._judgeBrainBreak();
        break;
      case 6:
        this._judgeReport();
        break;
    }
  },

  // Step 1: 点击"开始体验" — 佩戴即实时监测
  _judgeStartExperience() {
    var dev = this.state.device || {};
    if (dev.monitoring === 'live') {
      this.navigate('monitor');
      this.showToast('已连接 · 实时记录中', 'info');
      this._markJudgeStep(1);
      return;
    }
    this.wearAndMonitor();
    this.showToast('正在同步耳机状态 · 佩戴即实时监测...', 'success');
    this._markJudgeStep(1);
  },

  // Step 2: 自动建立个人基线
  _judgeViewEEG() {
    // v37: Use state.device.monitoring
    if (!this.state.device || this.state.device.monitoring !== 'live') {
      this.showToast('请先完成第 1 步：模拟戴上耳机', 'warning');
      return;
    }
    this.navigate('monitor');
    this.showToast('查看专注趋势、疲劳负荷、信号质量、伪迹风险和置信度变化', 'info');
    this._markJudgeStep(2);
  },

  // Step 3: 连接音乐软件
  _judgeConnectMusic() {
    if (!this.state.device || this.state.device.monitoring !== 'live') {
      this.showToast('请先完成第 1 步：模拟戴上耳机，系统会自动实时记录', 'warning');
      return;
    }
    this.navigate('monitor');
    var self = this;
    setTimeout(function() {
      if (!self.state.musicApp.connected) {
        self.connectMusicApp('spotify');
      }
      self._markJudgeStep(3);
    }, 500);
  },

  // Step 4: 查看推荐声音场景
  _judgeViewScene() {
    if (!this.state.musicApp.connected) {
      this.showToast('请先完成第 3 步：连接音乐软件', 'warning');
      return;
    }
    this.navigate('therapy');
    var self = this;
    setTimeout(function() {
      // Auto-select breath scene to show recommendation
      if (typeof Pages !== 'undefined') {
        Pages.selectSoundScene('breath', { animated: true });
      }
      self.showToast('系统根据疲劳负荷和专注趋势推荐 Breath Guide', 'info');
      self._markJudgeStep(4);
    }, 600);
  },

  _judgeBrainBreak() {
    if (!this.state.device || this.state.device.monitoring !== 'live') {
      this.showToast('请先完成第 1 步：模拟戴上耳机，系统会自动实时记录', 'warning');
      return;
    }
    this.navigate('monitor');
    setTimeout(() => {
      this.startBrainBreak();
      this.showToast('已触发 Brain Break · iOS bottom sheet 呼吸引导', 'success');
      this._markJudgeStep(5);
    }, 500);
  },

  _judgeReport() {
    // v50: Guard against active report run — don't let judge flow override it
    if (this.state.reportExperience && this.state.reportExperience.active) {
      this.feedback('本次实时体验正在准备报告，请等待完成后再运行评审报告步骤', 'warning');
      return;
    }

    // v49: Use unified prepareCurrentExperienceReport flow — no naked generateReportData
    this.showToast('正在生成评审演示报告...', 'info');
    this.prepareCurrentExperienceReport({
      autoReturnToReport: true,
      source: 'judge',
      sampleStartIndex: 0,
      recoveryStartIndex: 0,
      commandStartIndex: 0,
      durationStart: 0,
      brainBreakStartCount: 0,
      brainBreakAudioStartCount: 0,
      ancSwitchStartCount: 0,
      recoveryCueStartCount: 0
    });
    this._markJudgeStep(6);
  },

  _markJudgeStep(step) {
    const btns = document.querySelectorAll('.judge-step-btn');
    if (btns[step - 1]) btns[step - 1].classList.add('completed');
    this._judgeStep = step;
  },

  /**
   * 一键体验完整流程
   */
  judgeRunAll() {
    if (this._judgeRunning) return;
    this._judgeRunning = true;

    // 重置
    this.restartDemo();
    document.querySelectorAll('.judge-step-btn').forEach(btn => btn.classList.remove('completed'));

    const runBtn = document.querySelector('.judge-run-all-btn');
    if (runBtn) runBtn.disabled = true;

    // 步骤 1：模拟戴上耳机 — 佩戴即实时监测
    setTimeout(() => {
      this._judgeStartExperience();
    }, 1000);

    // 步骤 2：自动建立个人基线
    setTimeout(() => {
      this._judgeViewEEG();
    }, 6000);

    // 步骤 3：连接音乐软件
    setTimeout(() => {
      this._judgeConnectMusic();
    }, 10000);

    // 步骤 4：查看推荐声音场景
    setTimeout(() => {
      this._judgeViewScene();
    }, 14000);

    // 步骤 5：触发 Brain Break
    setTimeout(() => {
      this._judgeBrainBreak();
    }, 20000);

    // 步骤 6：生成报告
    setTimeout(() => {
      this._judgeReport();
      this._judgeRunning = false;
      if (runBtn) runBtn.disabled = false;
      this.showToast('评审快速体验已完成 · 请查看每日脑状态报告', 'success');
    }, 35000);
  },


  // ================================================================
  // 截图模式
  // ================================================================

  toggleScreenshotMode() {
    document.body.classList.toggle('screenshot-mode');
    const banner = document.getElementById('screenshotModeBanner');
    const isOn = document.body.classList.contains('screenshot-mode');
    if (banner) banner.style.display = isOn ? 'flex' : 'none';

    // 关闭评审面板
    const panel = document.getElementById('judgePanel');
    if (panel && isOn) panel.style.display = 'none';

    this.showToast(isOn ? '截图模式已开启 · 悬浮按钮已隐藏' : '截图模式已关闭', 'info');
  },


  // ================================================================
  // 生成示例报告
  // ================================================================

  generateSampleReport() {
    // v50: Guard against active report run — don't let sample report override it
    if (this.state.reportExperience && this.state.reportExperience.active) {
      this.feedback('本次实时体验正在准备报告。请等待完成，或重启 Demo 后再生成示例报告。', 'warning');
      return;
    }

    // v49: Save realtime state so sample data doesn't permanently pollute it
    var savedRealtimeState = {
      metricsHistory: this.state.metricsHistory,
      recoveryHistory: this.state.recoveryHistory,
      monitorDuration: this.state.monitorDuration,
      peakFocus: this.state.peakFocus,
      peakFocusTime: this.state.peakFocusTime,
      brainBreakCount: this.state.brainBreakCount,
      brainBreakFatigueBefore: this.state.brainBreakFatigueBefore,
      brainBreakFatigueAfter: this.state.brainBreakFatigueAfter,
      brainBreakCalmnessBefore: this.state.brainBreakCalmnessBefore,
      brainBreakCalmnessAfter: this.state.brainBreakCalmnessAfter,
      audioStats: this.state.audioStats,
      simulatorFocus: Simulator._state.focus,
      simulatorFatigue: Simulator._state.fatigue,
      simulatorCognitiveLoad: Simulator._state.cognitiveLoad,
      simulatorCalmness: Simulator._state.calmness,
      simulatorSignalQuality: Simulator._state.signalQuality,
      simulatorFocusHistory: Simulator._focusHistory,
      // v50: Also save scientific/sleep/localScene state
      sleepInsight: JSON.parse(JSON.stringify(this.state.sleepInsight || null)),
      eegFeatures: JSON.parse(JSON.stringify(this.state.eegFeatures || {})),
      artifactRisk: this.state.artifactRisk,
      confidence: this.state.confidence,
      localScene: JSON.parse(JSON.stringify(this.state.localScene || null))
    };

    // 填充模拟数据
    const sampleFocus = [62, 65, 68, 72, 75, 78, 80, 82, 79, 76, 73, 70, 68, 65, 62, 60, 58, 55, 53, 50];
    const sampleFatigue = [22, 24, 26, 28, 30, 33, 36, 40, 44, 48, 52, 56, 60, 63, 66, 68, 70, 72, 74, 75];
    const sampleCalmness = [54, 56, 58, 60, 62, 60, 58, 55, 52, 50, 48, 46, 44, 42, 40, 42, 44, 46, 48, 50];
    const sampleLoad = [48, 50, 52, 55, 58, 60, 62, 65, 68, 70, 72, 70, 68, 65, 62, 60, 58, 55, 52, 50];
    const sampleSignal = [88, 88, 87, 88, 89, 90, 90, 89, 88, 87, 86, 85, 84, 83, 82, 83, 84, 85, 86, 87];

    // Temporarily write sample data to state for generateReportData to read
    this.state.metricsHistory = {
      focus: sampleFocus,
      fatigue: sampleFatigue,
      cognitiveLoad: sampleLoad,
      calmness: sampleCalmness,
      signalQuality: sampleSignal
    };

    this.state.monitorDuration = 1200; // 20 分钟
    this.state.peakFocus = 82;
    this.state.peakFocusTime = 420; // 7 分钟
    this.state.brainBreakCount = 1;
    this.state.brainBreakFatigueBefore = 70;
    this.state.brainBreakFatigueAfter = 52;
    this.state.brainBreakCalmnessBefore = 40;
    this.state.brainBreakCalmnessAfter = 55;

    // 模拟音乐恢复数据
    this.state.recoveryHistory = {
      participation: [45, 52, 58, 63, 68, 65, 60, 55, 50, 48],
      fatigueRisk: [15, 22, 30, 38, 45, 52, 58, 62, 65, 68],
      recoveryIndex: [10, 25, 40, 55, 70, 75, 72, 68, 65, 62],
      stability: [78, 76, 74, 72, 70, 68, 65, 62, 58, 55]
    };

    // 更新模拟器状态以匹配数据
    Simulator._state.focus = 62;
    Simulator._state.fatigue = 55;
    Simulator._state.cognitiveLoad = 60;
    Simulator._state.calmness = 50;
    Simulator._state.signalQuality = 85;
    Simulator._focusHistory = sampleFocus;

    // 填充音频反馈统计数据
    this.state.audioStats = {
      focusMusicTime: 15,
      brainBreakAudioCount: 1,
      ancSwitchCount: 3,
      recoveryCueCount: 5
    };

    // v33: 填充音乐软件接入数据 — 不覆盖用户已连接的 provider
    if (!this.state.musicApp.connected) {
      // 未连接时，报告显示示例数据但标注"示例"
      this.state.musicApp.switches = this.state.musicApp.switches || 0;
    }
    // 保留用户当前 provider 和 connected 状态，不强制覆盖
    this.updateMusicAppUI();

    // 科学层：初始化模拟科学数据
    Simulator.generateEEGFeatures();
    Simulator.establishBaseline();
    this.state.eegFeatures = Simulator._science.eegFeatures;
    this.state.artifactRisk = 'low';
    this.state.confidence = 'medium';

    // v52: Set fixed sample localScene so report shows "Breath Guide Demo"
    // instead of inheriting the user's current localScene
    this.state.localScene = {
      selected: 'breath',
      label: 'Breath Guide'
    };

    // v48: Don't mix old commandLog into sample report — slice from current length
    this.generateReportData({
      source: 'sample',
      sampleStartIndex: 0,
      recoveryStartIndex: 0,
      commandStartIndex: this.state.commandLog ? this.state.commandLog.length : 0,
      durationStart: 0,
      brainBreakStartCount: 0,
      brainBreakAudioStartCount: 0,
      ancSwitchStartCount: 0,
      recoveryCueStartCount: 0
    });
    this.state.reportDirty = true;

    // v49: Restore realtime state so sample data doesn't permanently pollute it
    this.state.metricsHistory = savedRealtimeState.metricsHistory;
    this.state.recoveryHistory = savedRealtimeState.recoveryHistory;
    this.state.monitorDuration = savedRealtimeState.monitorDuration;
    this.state.peakFocus = savedRealtimeState.peakFocus;
    this.state.peakFocusTime = savedRealtimeState.peakFocusTime;
    this.state.brainBreakCount = savedRealtimeState.brainBreakCount;
    this.state.brainBreakFatigueBefore = savedRealtimeState.brainBreakFatigueBefore;
    this.state.brainBreakFatigueAfter = savedRealtimeState.brainBreakFatigueAfter;
    this.state.brainBreakCalmnessBefore = savedRealtimeState.brainBreakCalmnessBefore;
    this.state.brainBreakCalmnessAfter = savedRealtimeState.brainBreakCalmnessAfter;
    this.state.audioStats = savedRealtimeState.audioStats;
    Simulator._state.focus = savedRealtimeState.simulatorFocus;
    Simulator._state.fatigue = savedRealtimeState.simulatorFatigue;
    Simulator._state.cognitiveLoad = savedRealtimeState.simulatorCognitiveLoad;
    Simulator._state.calmness = savedRealtimeState.simulatorCalmness;
    Simulator._state.signalQuality = savedRealtimeState.simulatorSignalQuality;
    Simulator._focusHistory = savedRealtimeState.simulatorFocusHistory;
    // v50: Restore scientific/sleep/localScene state
    this.state.sleepInsight = savedRealtimeState.sleepInsight;
    this.state.eegFeatures = savedRealtimeState.eegFeatures;
    this.state.artifactRisk = savedRealtimeState.artifactRisk;
    this.state.confidence = savedRealtimeState.confidence;
    this.state.localScene = savedRealtimeState.localScene;

    // Navigate to report — _hydratePage will render when dirty
    if (this.state.currentPage !== 'report') {
      this.navigate('report');
    } else {
      // Already on report page — render directly
      if (typeof Pages !== 'undefined' && Pages.renderReportWithAnimation) {
        Pages.renderReportWithAnimation();
      } else if (typeof Pages !== 'undefined' && Pages.renderReport) {
        Pages.renderReport();
      }
      this.state.reportDirty = false;
    }
    this.showToast('示例报告已生成 · 包含完整脑健康、音乐恢复与音频反馈数据', 'success');
  },


  // ================================================================
  // 更新首页硬件状态预览
  // ================================================================

  _updateHwPreview() {
    const btEl = document.getElementById('hwPreviewBt');
    if (!btEl) return;
    // v35: Read from state.device
    var dev = this.state.device || {};
    if (dev.monitoring === 'live' || dev.monitoring === 'paused') {
      btEl.textContent = '已连接';
      btEl.classList.add('connected');
    } else {
      btEl.textContent = '未连接';
      btEl.classList.remove('connected');
    }
  },


  // ================================================================
  // v30: Unified Action Dispatcher
  // ================================================================

  /**
   * Unified button feedback (alias for showToast with consistent UX)
   */
  feedback(message, type) {
    type = type || 'info';
    this.showToast(message, type);
  },

  /**
   * Central action handler — all data-action buttons route through here
   */
  handleAction(action, target, event) {
    // Prevent default for buttons that might be inside forms
    if (event && event.preventDefault) event.preventDefault();

    switch (action) {

      // --- Navigation ---
      case 'navigate':
        var page = target.dataset.page || 'home';
        this.navigate(page);
        break;

      // v33: Scroll to Brain Break section on home page
      case 'scroll-to-brain-break':
        var bbSection = document.getElementById('focusBrainBreakSection') ||
                        document.querySelector('[class*="brain-break"]');
        if (bbSection) {
          bbSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          this.showToast('Brain Break：疲劳负荷升高时自动推荐短休息', 'info');
        } else {
          // Fallback: scroll to the Focus & Brain Breaks section
          var fbSection = document.querySelector('.fb-break-right');
          if (fbSection) {
            var parent = fbSection.closest('section') || fbSection.parentElement;
            if (parent) parent.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          this.showToast('Brain Break：疲劳负荷升高时自动推荐短休息', 'info');
        }
        break;

      // --- Start Realtime Experience (high-level entry) ---
      case 'start-realtime-experience': {
        var source = target.dataset.source || 'home';
        this.startRealtimeExperience({ source: source });
        break;
      }

      // --- Wear & Monitor (low-level entry on monitor page) ---
      case 'wear-monitor':
        this.feedback('正在检测佩戴状态...', 'info');
        this.wearAndMonitor();
        break;

      case 'sync-headset':
        this.feedback('正在检测佩戴状态...', 'info');
        this.wearAndMonitor();
        break;

      case 'stop-monitoring':
        // v36: No premature toast — stopFocusSession handles all feedback
        this.stopFocusSession();
        break;

      // --- Music App ---
      case 'open-music-connector':
        this.feedback('请选择一个 Demo 音乐软件', 'info');
        this.openMusicConnector();
        break;

      case 'connect-music':
        var provider = target.dataset.provider || 'spotify';
        // connectMusicApp already shows toast and closes sheet
        this.connectMusicApp(provider);
        break;

      case 'send-scene-command':
        if (!this.state.musicApp.connected) {
          this.feedback('请先连接音乐软件 Demo Connector', 'warning');
          return;
        }
        if (typeof Pages !== 'undefined' && Pages.sendSceneCommand) {
          Pages.sendSceneCommand();
        }
        break;

      // --- Sound Scene ---
      case 'select-scene':
        var scene = target.dataset.scene || 'focus';
        // v33: Local selection only — no commandLog, no "已发送"
        if (typeof Pages !== 'undefined' && Pages.selectSoundScene) {
          Pages.selectSoundScene(scene, { animated: true });
        } else {
          this.selectLocalScene(scene);
        }
        break;

      // --- Report ---
      case 'start-report-experience':
        this.startReportExperience();
        break;

      case 'generate-sample-report':
        // v46: Don't allow sample report to override an active realtime experience
        if (this.state.reportExperience && this.state.reportExperience.active) {
          this.feedback('本次实时体验正在准备报告。请等待完成，或重启 Demo 后再生成示例报告。', 'warning');
          return;
        }
        this.feedback('正在生成示例报告...', 'info');
        this.generateSampleReport();
        break;

      case 'generate-report':
        // v46: Don't allow manual generate-report during an active realtime experience
        if (this.state.reportExperience && this.state.reportExperience.active) {
          this.feedback('本次实时体验正在准备报告，请稍候', 'info');
          return;
        }
        this.feedback('正在生成每日脑状态报告...', 'info');
        if (this.state.metricsHistory && this.state.metricsHistory.focus.length >= 2) {
          this.prepareCurrentExperienceReport({
            autoReturnToReport: true,
            sampleStartIndex: 0,
            recoveryStartIndex: 0,
            commandStartIndex: 0,
            durationStart: 0
          });
        } else {
          this.feedback('当前还没有足够实时体验数据。请先点击「开始一次实时体验」，或选择「生成示例报告」。', 'warning');
        }
        break;

      // --- Brain Break ---
      case 'brain-break':
        // v36: Use state.device.monitoring
        if (!this.state.device || this.state.device.monitoring !== 'live') {
          this.feedback('请先模拟戴上耳机，系统会自动记录脑状态趋势', 'warning');
          return;
        }
        this.feedback('正在打开短休息引导', 'info');
        this.startBrainBreak();
        break;

      case 'end-brain-break':
        this.endBrainBreak();
        break;

      // --- Science ---
      case 'toggle-science':
        this.toggleEegFeatures();
        break;

      case 'toggle-science-mode':
        this.toggleScienceMode();
        break;

      // --- Scenario ---
      case 'set-scenario':
        var scenario = target.dataset.scenario || 'normal';
        this.setScenario(scenario);
        break;

      // --- FAQ / Collapse ---
      case 'toggle-faq':
        if (typeof ScrollAnim !== 'undefined' && ScrollAnim.toggleFAQ) {
          ScrollAnim.toggleFAQ(target);
        }
        break;

      case 'toggle-collapse':
        if (typeof ScrollAnim !== 'undefined' && ScrollAnim.toggleCollapse) {
          ScrollAnim.toggleCollapse(target);
        }
        break;

      case 'toggle-insight':
        target.parentElement.classList.toggle('open');
        break;

      // --- Judge Panel ---
      case 'toggle-judge-panel':
        this.toggleJudgePanel();
        break;

      case 'judge-step':
        var step = parseInt(target.dataset.step || '1', 10);
        this.judgeStep(step);
        break;

      case 'judge-run-all':
        this.judgeRunAll();
        break;

      case 'toggle-screenshot':
        this.toggleScreenshotMode();
        break;

      // --- Bottom Sheet ---
      case 'hide-bottom-sheet':
        this.hideBottomSheet();
        break;

      // --- Demo Reset ---
      case 'restart-demo':
        this.restartDemo();
        break;

      default:
        console.warn('[NeuroFocus] Unknown action:', action);
        this.feedback('该功能暂未实现', 'warning');
    }
  },

  /**
   * Development tool: audit all clickable elements for missing handlers
   */
  auditInteractions() {
    var results = {
      totalClickable: 0,
      withDataAction: 0,
      withInlineOnclick: 0,
      missingHandlers: [],
      deprecatedHandlers: [],
      disabledWithoutReason: []
    };

    // v36: Old deprecated wrappers deleted — no longer tracked
    var deprecatedFunctions = [];

    // Scan all data-action elements
    var actionElements = document.querySelectorAll('[data-action]');
    actionElements.forEach(function(el) {
      results.totalClickable++;
      results.withDataAction++;
    });

    // Scan all buttons, role=button, .scene-card, .ma-connector, .nav-link, .mtb-item
    var clickableSelectors = 'button, [role="button"], .scene-card, .ma-connector, .nav-link, .mtb-item, .judge-step-btn, .faq-question, .ios-insight-card-header, .why-collapse-toggle, .scenario-btn';
    var allClickable = document.querySelectorAll(clickableSelectors);
    allClickable.forEach(function(el) {
      results.totalClickable++;
      if (el.hasAttribute('data-action')) return; // Already counted

      // Check for inline onclick
      var onclick = el.getAttribute('onclick') || '';
      if (onclick) {
        results.withInlineOnclick++;
        // Check for deprecated functions
        deprecatedFunctions.forEach(function(fn) {
          if (onclick.indexOf(fn) !== -1) {
            results.deprecatedHandlers.push({
              element: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : ''),
              onclick: onclick,
              deprecatedFunction: fn
            });
          }
        });
      } else if (!el.hasAttribute('data-action')) {
        // No handler at all
        var desc = el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + (el.className.split(' ')[0] || '') : '');
        // Skip nav-link and mtb-item if they have data-page (they use event delegation)
        if ((el.classList.contains('nav-link') || el.classList.contains('mtb-item')) && el.hasAttribute('data-page')) {
          return;
        }
        results.missingHandlers.push(desc);
      }

      // Check disabled without reason
      if (el.disabled) {
        var hasReason = el.getAttribute('title') || el.getAttribute('aria-label') ||
                        (el.parentElement && el.parentElement.querySelector('.disabled-reason'));
        if (!hasReason) {
          results.disabledWithoutReason.push(
            el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : '')
          );
        }
      }
    });

    // Deduplicate totalClickable (some elements matched by both queries)
    results.totalClickable = Math.max(results.withDataAction, results.totalClickable);

    console.table(results);
    console.log('%c[NeuroFocus] Interaction Audit', 'color:#007AFF;font-weight:bold');
    console.log('Total clickable:', results.totalClickable);
    console.log('With data-action:', results.withDataAction);
    console.log('With inline onclick:', results.withInlineOnclick);
    console.log('Missing handlers:', results.missingHandlers.length, results.missingHandlers);
    console.log('Deprecated handlers:', results.deprecatedHandlers.length, results.deprecatedHandlers);
    console.log('Disabled without reason:', results.disabledWithoutReason.length, results.disabledWithoutReason);

    return results;
  },

  /**
   * v31: Product Logic Audit — checks for real logic issues, not just DOM
   */
  auditProductLogic() {
    var self = this;
    var results = {
      htmlStructureIssues: [],
      fakeInitialStates: [],
      wrongSceneSendLogic: [],
      legacyMonitorLogic: [],
      legacyTherapyLogic: [],
      duplicateLayoutShells: [],
      deprecatedCssBlocks: [],
      wrongSceneStateCoupling: [],
      mixedSleepComponents: [],
      excessiveInlineStyles: [],
      oldDeviceStateChecks: [],
      reportProviderOverride: [],
      headerOutsideAppPage: [],
      badCopy: [],
      visibleDebugControls: [],
      missingHandlers: [],
      disabledWithoutReason: [],
      wrongNavigationActions: []
    };

    // 1. Fake initial states
    var heroProvider = document.getElementById('heroMusicProvider');
    if (heroProvider && heroProvider.textContent.indexOf('已连接') !== -1 && !this.state.musicApp.connected) {
      results.fakeInitialStates.push('heroMusicProvider shows "已连接" but musicApp not connected');
    }
    var maCmdStatus = document.getElementById('maCommandStatus');
    if (maCmdStatus && maCmdStatus.textContent.indexOf('已发送') !== -1 && (!this.state.commandLog || this.state.commandLog.length === 0)) {
      results.fakeInitialStates.push('maCommandStatus shows "已发送" but commandLog is empty');
    }

    // 2. Scene send logic
    if (typeof Pages !== 'undefined' && Pages.selectSoundScene) {
      var fnStr = Pages.selectSoundScene.toString();
      if (fnStr.indexOf('setSoundScene') !== -1) {
        results.wrongSceneSendLogic.push('Pages.selectSoundScene calls App.setSoundScene — should use selectLocalScene');
      }
    }

    // 3. Legacy monitor logic — _startMonitoring should not exist
    if (typeof this._startMonitoring === 'function') {
      results.legacyMonitorLogic.push('_startMonitoring function still exists');
    }

    // 3a. selectLocalScene should not modify musicApp.currentPlaylist
    if (typeof this.selectLocalScene === 'function') {
      var localFnStr = this.selectLocalScene.toString();
      if (localFnStr.indexOf('musicApp.currentPlaylist') !== -1) {
        results.wrongSceneStateCoupling.push('selectLocalScene modifies musicApp.currentPlaylist — should only use localScene');
      }
    }

    // 3b. Mixed sleep component versions
    var oldSleepClasses = ['sleep-timeline-v28', 'sleep-timeline-v29', 'sleep-ring-v28', 'sleep-ring-v29', 'sleep-stage-v28', 'sleep-score-card-v28', 'sleep-score-card-v29', 'sleep-long-card-v29'];
    oldSleepClasses.forEach(function(cls) {
      var els = document.querySelectorAll('.' + cls);
      if (els.length > 0) {
        results.mixedSleepComponents.push(cls + ' (' + els.length + ' elements)');
      }
    });

    // 4. Legacy therapy controls visible
    var legacyIds = ['btnStartTherapy', 'btnPauseTherapy', 'therapyArea'];
    legacyIds.forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.offsetParent !== null) {
        results.legacyTherapyLogic.push(id + ' is visible');
      }
    });

    // 5. Duplicate layout shells
    var shells = document.querySelectorAll('.page-shell, .focus-shell, .therapy-shell, .report-content');
    shells.forEach(function(el) {
      results.duplicateLayoutShells.push(el.className);
    });

    // 5a. Page header outside .app-page
    var pageHeaders = document.querySelectorAll('.page-header');
    pageHeaders.forEach(function(el) {
      var parent = el.parentElement;
      if (parent && !parent.classList.contains('app-page')) {
        results.headerOutsideAppPage.push('page-header is outside .app-page (parent: ' + parent.className + ')');
      }
    });

    // 6. Deprecated CSS classes in DOM
    var deprecatedClasses = ['scene-card-v27', 'sleep-timeline-v28', 'sleep-timeline-v29', 'dark-card', 'training-option', 'therapy-session-card', 'cognitive-gauge', 'report-top-cards', 'audio-control-grid'];
    deprecatedClasses.forEach(function(cls) {
      var els = document.querySelectorAll('.' + cls);
      if (els.length > 0) {
        results.deprecatedCssBlocks.push(cls + ' (' + els.length + ' elements)');
      }
    });

    // 7. Old device state checks and assignments in function source
    if (typeof this.wearAndMonitor === 'function') {
      var wearStr = this.wearAndMonitor.toString();
      if (wearStr.indexOf('deviceStatus') !== -1) {
        results.oldDeviceStateChecks.push('wearAndMonitor references deviceStatus');
      }
      if (wearStr.indexOf('this.state.monitoring') !== -1) {
        results.oldDeviceStateChecks.push('wearAndMonitor references this.state.monitoring');
      }
    }
    // v37: Check stopFocusSession for old state assignments
    if (typeof this.stopFocusSession === 'function') {
      var stopStr = this.stopFocusSession.toString();
      if (stopStr.indexOf('this.state.monitoring =') !== -1) {
        results.oldDeviceStateChecks.push('stopFocusSession assigns this.state.monitoring');
      }
    }
    // v37: Check _finishCalibration for old baselineReady
    if (typeof this._finishCalibration === 'function') {
      var calStr = this._finishCalibration.toString();
      if (calStr.indexOf('baselineReady') !== -1) {
        results.oldDeviceStateChecks.push('_finishCalibration references baselineReady');
      }
    }
    // v37: Check restartDemo for old state fields
    if (typeof this.restartDemo === 'function') {
      var restartStr = this.restartDemo.toString();
      if (restartStr.indexOf('deviceStatus') !== -1) {
        results.oldDeviceStateChecks.push('restartDemo references deviceStatus');
      }
      if (restartStr.indexOf('baselineReady') !== -1) {
        results.oldDeviceStateChecks.push('restartDemo references baselineReady');
      }
    }
    // v37: Check _updateMetrics for old baselineReady
    if (typeof this._updateMetrics === 'function') {
      var metricsStr = this._updateMetrics.toString();
      if (metricsStr.indexOf('this.state.baselineReady') !== -1) {
        results.oldDeviceStateChecks.push('_updateMetrics references this.state.baselineReady');
      }
    }

    // 7a. generateSampleReport should not override provider
    if (typeof this.generateSampleReport === 'function') {
      var reportStr = this.generateSampleReport.toString();
      if (reportStr.indexOf("provider: 'spotify'") !== -1 || reportStr.indexOf('provider: "spotify"') !== -1) {
        results.reportProviderOverride.push('generateSampleReport forces provider to spotify');
      }
    }

    // 8. Bad copy in visible text
    // AUDIT_ONLY_KEYWORDS: these strings are used only for static checks, not product copy.
    var AUDIT_ONLY_BAD_PHRASES = [
      '开始监测',
      '连接并开始实时监测',
      '开始 EEG 专注监测',
      '佩戴并同步',
      '开始睡眠监测',
      '开始恢复',
      '已发送到音乐软件',
      '音乐疗愈'
    ];
    var allText = document.body.innerText || '';
    AUDIT_ONLY_BAD_PHRASES.forEach(function(phrase) {
      if (allText.indexOf(phrase) !== -1) {
        var elements = document.querySelectorAll('button, .ios-btn, .btn, span, p, h1, h2, h3, h4, div');
        for (var i = 0; i < elements.length; i++) {
          if (elements[i].offsetParent !== null && elements[i].textContent.indexOf(phrase) !== -1 && elements[i].children.length === 0) {
            results.badCopy.push({ phrase: phrase, element: elements[i].tagName + (elements[i].id ? '#' + elements[i].id : '') });
            break;
          }
        }
      }
    });

    // 9. Visible debug controls
    var scenarioBar = document.getElementById('scenarioBar');
    if (scenarioBar && scenarioBar.offsetParent !== null) {
      results.visibleDebugControls.push('scenarioBar is visible');
    }
    var scenarioBtns = document.querySelectorAll('[data-action="set-scenario"]');
    scenarioBtns.forEach(function(btn) {
      if (btn.offsetParent !== null) {
        results.visibleDebugControls.push('set-scenario button visible in normal page');
      }
    });

    // 10. Data-action elements without handlers
    var actionElements = document.querySelectorAll('[data-action]');
    var validActions = ['navigate', 'start-realtime-experience', 'start-report-experience', 'wear-monitor', 'sync-headset', 'stop-monitoring', 'open-music-connector',
                        'connect-music', 'send-scene-command', 'select-scene', 'generate-report', 'generate-sample-report',
                        'brain-break', 'end-brain-break', 'toggle-science', 'toggle-science-mode',
                        'set-scenario', 'toggle-faq', 'toggle-collapse', 'toggle-insight',
                        'toggle-judge-panel', 'judge-step', 'judge-run-all', 'toggle-screenshot',
                        'hide-bottom-sheet', 'restart-demo', 'scroll-to-brain-break'];
    actionElements.forEach(function(el) {
      var action = el.dataset.action;
      if (validActions.indexOf(action) === -1) {
        results.missingHandlers.push({ action: action, element: el.tagName + (el.id ? '#' + el.id : '') });
      }
    });

    // 11. Disabled buttons without reason
    var buttons = document.querySelectorAll('button[disabled], [aria-disabled="true"]');
    buttons.forEach(function(el) {
      if (el.offsetParent === null) return;
      var hasReason = el.title || el.dataset.disabledReason || el.getAttribute('aria-label');
      if (!hasReason) {
        results.disabledWithoutReason.push(el.tagName + (el.id ? '#' + el.id : ''));
      }
    });

    // 12. Wrong navigation — openMusicConnector should not navigate to home
    if (typeof this.openMusicConnector === 'function') {
      var openStr = this.openMusicConnector.toString();
      if (openStr.indexOf("navigate('home')") !== -1 || openStr.indexOf('navigate("home")') !== -1) {
        results.wrongNavigationActions.push('openMusicConnector calls navigate("home")');
      }
    }

    // 13. HTML structure issues
    var maCmd = document.getElementById('maCommandStatus');
    if (maCmd && maCmd.tagName === 'SPAN' && maCmd.parentElement) {
      var parentHTML = maCmd.parentElement.innerHTML;
      if (parentHTML.indexOf('尚未发送</div>') !== -1) {
        results.htmlStructureIssues.push('maCommandStatus span closed with </div> instead of </span>');
      }
    }

    // 14. Excessive inline styles — v36: target is under 40
    var styledEls = document.querySelectorAll('#page-home .app-page [style], #page-monitor .app-page [style], #page-therapy .app-page [style], #page-report .app-page [style]');
    if (styledEls.length > 40) {
      results.excessiveInlineStyles.push(styledEls.length + ' elements with inline style attributes (target: <40)');
    }

    // v36: 15. Check for old therapyArea DOM
    if (document.getElementById('therapyArea')) {
      results.legacyTherapyLogic.push('therapyArea DOM element still exists');
    }

    // v36: 16. Check for deprecated wrapper functions
    // audit-only keywords — these are checked, NOT actual product logic
    var AUDIT_ONLY_KEYWORDS = ['connectDevice', 'connectAndStartMonitoring', 'startFocusSession', 'startTherapy', 'pauseTherapy', 'selectTraining'];
    AUDIT_ONLY_KEYWORDS.forEach(function(fn) {
      if (typeof self[fn] === 'function') {
        results.legacyTherapyLogic.push(fn + '() still exists on App');
      }
      if (typeof Pages !== 'undefined' && typeof Pages[fn] === 'function') {
        results.legacyTherapyLogic.push('Pages.' + fn + '() still exists');
      }
    });

    // v52: 17. Check for old sleep timeline helpers
    // AUDIT_ONLY_KEYWORDS: 'animateSleepTimeline' and 'renderSleepTimeline' are checked
    // to ensure old .nf-sleep-timeline-track helpers are not reintroduced.
    if (typeof this.animateSleepTimeline === 'function') {
      results.legacyTherapyLogic.push('animateSleepTimeline() still exists — old .nf-sleep-timeline-track helper should be removed');
    }
    if (typeof this.renderSleepTimeline === 'function') {
      results.legacyTherapyLogic.push('renderSleepTimeline() still exists — should use .nf-sleep-* instead');
    }

    // v37: 18. Check openMusicConnectorSheet for inline styles
    if (typeof this.openMusicConnectorSheet === 'function') {
      var sheetStr = this.openMusicConnectorSheet.toString();
      var inlineStyleCount = (sheetStr.match(/style="/g) || []).length;
      if (inlineStyleCount > 0) {
        results.excessiveInlineStyles.push('openMusicConnectorSheet has ' + inlineStyleCount + ' inline style assignments');
      }
    }

    // v38: 19. Check that _startRealtimeLoop exists (critical fix verification)
    if (typeof this._startRealtimeLoop !== 'function') {
      results.legacyMonitorLogic.push('_startRealtimeLoop() missing — realtime loop will not start');
    }
    if (typeof this._stopRealtimeLoop !== 'function') {
      results.legacyMonitorLogic.push('_stopRealtimeLoop() missing — pause will not clear timers');
    }

    // v39: 20. Check _startRealtimeLoop has duplicate-start guard
    if (typeof this._startRealtimeLoop === 'function') {
      var loopStr = this._startRealtimeLoop.toString();
      if (loopStr.indexOf('_loopStarting') === -1) {
        results.legacyMonitorLogic.push('_startRealtimeLoop missing _loopStarting guard — duplicate intervals possible');
      }
    }

    // v39: 21. Check _endBrainBreak has duplicate-call guard
    if (typeof this._endBrainBreak === 'function') {
      var endBbStr = this._endBrainBreak.toString();
      if (endBbStr.indexOf('if (!this.state.brainBreak)') === -1) {
        results.legacyMonitorLogic.push('_endBrainBreak missing duplicate-call guard');
      }
    }

    // v39: 22. Check simulator uses _recovery, not _therapy
    if (typeof Simulator !== 'undefined' && Simulator._therapy) {
      results.legacyTherapyLogic.push('Simulator._therapy still exists — should be _recovery');
    }

    // v40: 23. Check local science card is NOT .science-card (would be hidden by global science-mode)
    var localCard = document.getElementById('eegFeatureCard');
    if (localCard && localCard.classList.contains('science-card')) {
      results.htmlStructureIssues.push('#eegFeatureCard still uses .science-card — will be hidden by global science-mode');
    }

    // Output
    console.log('%c[NeuroFocus] Product Logic Audit v53', 'color:#34C759;font-weight:bold');
    Object.keys(results).forEach(function(key) {
      var arr = results[key];
      if (Array.isArray(arr)) {
        console.log(key + ':', arr.length, arr);
      }
    });

    var allEmpty = Object.keys(results).every(function(key) {
      return !Array.isArray(results[key]) || results[key].length === 0;
    });
    console.log(allEmpty ? '%c✓ All checks passed' : '%c✗ Issues found', allEmpty ? 'color:#34C759' : 'color:#FF3B30');

    return results;
  },

  /**
   * Initialize unified event delegation for data-action
   */
  _initActionDispatcher() {
    var self = this;
    document.addEventListener('click', function(event) {
      var target = event.target.closest('[data-action]');
      if (!target) return;

      // v31: Disabled buttons must give feedback, not silently return
      if (target.disabled || target.getAttribute('aria-disabled') === 'true' || target.classList.contains('disabled')) {
        event.preventDefault();
        var reason = target.dataset.disabledReason || target.title || '当前状态下暂不可用';
        self.feedback(reason, 'warning');
        return;
      }

      var action = target.dataset.action;
      self.handleAction(action, target, event);
    });
  }
};

// v30: Deprecation wrappers (keep for backward compat, but warn)
App.prototype = App.prototype || {};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  App.init();
  // v30: Initialize unified action dispatcher
  App._initActionDispatcher();
});
