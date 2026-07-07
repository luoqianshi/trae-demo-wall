/**
 * ================================================================
 * pages.js — NeuroFocus 音乐恢复与报告逻辑 v3.0
 * ================================================================
 * 负责：
 * - 声音场景选择（本地切换）
 * - 发送 Demo 切换指令（需先连接音乐软件）
 * - 恢复指标联动建议
 * - 声音场景可视化更新
 * - Daily Brain Report 渲染
 * ================================================================
 */

const Pages = {

  // ---------- 音乐恢复状态（v36: 简化，不再有 session 状态机） ----------
  state: {
    selectedScene: 'focus',
    recentChanges: []
  },


  // ================================================================
  // 声音场景卡片选择（iOS 动画版）
  // ================================================================
  selectSoundScene: function(scene, options) {
    options = options || {};
    var sceneLabels = { focus: 'Focus Mix', whiteNoise: 'White Noise', breath: 'Breath Guide', calm: 'Calm Ambient' };
    var label = sceneLabels[scene] || scene;

    // Update scene card selection
    document.querySelectorAll('.scene-card').forEach(function(card) {
      card.classList.toggle('selected', card.dataset.scene === scene);
    });

    // v33: Only update local state — do NOT send to music app
    // Sending is reserved for "发送 Demo 切换指令" button only
    App.selectLocalScene(scene);

    // Update the recommendation big card
    this.updateRecommendedSceneCard(scene);

    // Animate Now Playing update
    if (options.animated !== false) {
      var nowPlaying = document.getElementById('recoveryNowPlaying');
      if (nowPlaying) App.dissolveText(nowPlaying, label);
      var scenePill = document.getElementById('recoveryScenePill');
      if (scenePill) App.dissolveText(scenePill, '当前场景：' + label);
    }

    // Update waveform style based on scene
    App.updateWaveform(scene);
  },

  /**
   * 更新当前推荐大卡 (v20)
   */
  updateRecommendedSceneCard: function(scene) {
    var sceneInfo = {
      focus: { label: 'Focus Mix', name: '专注混合音乐', reason: '专注趋势高于个人基线，疲劳负荷较低', subtitle: '专注趋势稳定，疲劳负荷较低。' },
      whiteNoise: { label: 'White Noise', name: '白噪声', reason: '专注波动较大，环境干扰模拟较高', subtitle: '专注波动较大，建议稳定声音输入。' },
      breath: { label: 'Breath Guide', name: '呼吸引导', reason: '疲劳负荷连续升高，专注趋势下降', subtitle: '疲劳负荷连续升高，建议进行短呼吸引导。' },
      calm: { label: 'Calm Ambient', name: '舒缓环境音', reason: '平静度估计低于个人基线，认知负荷偏高', subtitle: '平静度偏低，建议降低声音刺激。' }
    };
    var info = sceneInfo[scene];
    if (!info) return;

    // Check science state for No Auto Switch
    var sci = Simulator.getScienceSnapshot();
    var noAuto = (sci.artifactRisk === 'high' || sci.confidence === 'low');

    var recommendCard = document.getElementById('sceneRecommendCard');
    var noAutoCard = document.getElementById('sceneNoAutoCard');
    var btnSend = document.getElementById('btnSendSceneCommand');

    if (noAuto) {
      // Show No Auto Switch state
      if (recommendCard) recommendCard.classList.add('is-hidden');
      if (noAutoCard) noAutoCard.classList.remove('is-hidden');
      // Add manual badges to scene cards
      document.querySelectorAll('.scene-card').forEach(function(card) {
        var existing = card.querySelector('.scene-card-manual-badge');
        if (!existing) {
          var badge = document.createElement('span');
          badge.className = 'scene-card-manual-badge';
          badge.textContent = '手动切换 · Low confidence';
          card.appendChild(badge);
        }
      });
      return;
    }

    // Show normal recommendation
    if (recommendCard) recommendCard.classList.remove('is-hidden');
    if (noAutoCard) noAutoCard.classList.add('is-hidden');
    // Remove manual badges
    document.querySelectorAll('.scene-card-manual-badge').forEach(function(b) { b.remove(); });

    // Update recommendation card content with dissolve
    var titleEl = document.getElementById('sceneRecommendTitle');
    var subtitleEl = document.getElementById('sceneRecommendSubtitle');
    var reasonEl = document.getElementById('sceneRecommendReason');
    var confidenceEl = document.getElementById('sceneRecommendConfidence');
    var signalEl = document.getElementById('sceneRecommendSignal');

    if (titleEl) App.dissolveText(titleEl, info.label);
    if (subtitleEl) App.dissolveText(subtitleEl, info.subtitle);
    if (reasonEl) App.dissolveText(reasonEl, info.reason);

    var confText = sci.confidence === 'high' ? 'High' : sci.confidence === 'medium' ? 'Medium' : 'Low';
    if (confidenceEl) App.dissolveText(confidenceEl, confText);

    var sigText = 'Signal Quality ' + (sci.signalQuality || 'Good') + ' / Artifact Risk ' + (sci.artifactRisk || 'Low');
    if (signalEl) App.dissolveText(signalEl, sigText);

    // Update confidence badges on all scene cards
    var sceneKeys = ['focus', 'whiteNoise', 'breath', 'calm'];
    var capKeys = { focus: 'Focus', whiteNoise: 'WhiteNoise', breath: 'Breath', calm: 'Calm' };
    sceneKeys.forEach(function(key) {
      var el = document.getElementById('sceneConfidence' + capKeys[key]);
      if (el) el.textContent = 'Confidence: ' + confText;
    });
  },

  /**
   * 发送 Demo 切换指令 (v20)
   */
  sendSceneCommand: function() {
    if (!App.state.musicApp.connected) {
      App.showToast('请先连接音乐软件 Demo Connector', 'warning');
      return;
    }
    var sceneLabels = { focus: 'Focus Mix', whiteNoise: 'White Noise', breath: 'Breath Guide', calm: 'Calm Ambient' };
    var selectedCard = document.querySelector('.scene-card.selected');
    var scene = selectedCard ? selectedCard.dataset.scene : 'focus';
    var label = sceneLabels[scene] || scene;

    // v33: Use App.setSoundScene which writes commandLog, increments switches, shows "已发送"
    App.setSoundScene(scene);

    // Update Now Playing
    var nowPlaying = document.getElementById('recoveryNowPlaying');
    if (nowPlaying) App.dissolveText(nowPlaying, label);
  },

  /**
   * 添加近期变化记录（iOS 动画）
   */
  addRecentChange: function(text) {
    var container = document.getElementById('recoveryRecentChanges');
    if (!container) return;
    // Remove empty state
    var empty = container.querySelector('.ios-empty-hint');
    if (empty) empty.remove();
    // Create new item
    var item = document.createElement('div');
    item.className = 'ios-dissolve dissolving-in';
    item.className = 'ios-dissolve dissolving-in ios-recent-change-item';
    item.textContent = text;
    container.insertBefore(item, container.firstChild);
    requestAnimationFrame(function() {
      item.classList.remove('dissolving-in');
    });
    // Keep max 3 items
    while (container.children.length > 3) {
      container.removeChild(container.lastChild);
    }
  },

  // Sleep page methods removed in v23 — sleep is now an auto insight in the report

  // ================================================================
  // 声音场景卡片选择（原逻辑，供 selectSoundScene 调用）
  // ================================================================
  // v36: _selectSoundSceneOld deleted — selectSoundScene is the only path

  /**
   * 更新所有声音场景卡的推荐理由
   */
  _updateRecommendationReasons() {
    // v36: therapyArea hidden DOM deleted — reasons now shown in scene cards directly
    // This is a no-op; scene recommendation reasons are displayed via updateRecommendedSceneCard
  },


  // ================================================================
  // v36: 旧恢复会话逻辑已彻底删除
  // 音乐恢复页不再有"开始恢复 / 暂停 / 继续"会话控制台
  // 声音场景推荐基于实时脑状态自动运行
  // ================================================================

  _updateMetric(valueId, barId, value) {
    const valueEl = document.getElementById(valueId);
    const barEl = document.getElementById(barId);
    if (valueEl) valueEl.textContent = value;
    if (barEl) barEl.style.width = value + '%';
  },

  _generateAdvice(metrics) {
    // 空实现 — 建议由 App 统一生成
  },

  /**
   * 更新恢复音频引导
   */
  _updateRecoveryAudioCue(metrics) {
    // Track cue count for report data
    if (metrics.fatigueRisk > 60 || metrics.stability < 45 || metrics.fatigueRisk > 40) {
      App.state.audioStats.recoveryCueCount++;
    }
  },


  // ================================================================
  // 生成报告
  // ================================================================
  generateReport() {
    // v47: Don't nakedly call generateReportData — respect active run
    if (App.state.reportExperience && App.state.reportExperience.active) {
      App.feedback('本次实时体验正在准备报告，请稍候', 'info');
      return;
    }

    if (App.state.metricsHistory && App.state.metricsHistory.focus.length >= 2) {
      App.prepareCurrentExperienceReport({
        autoReturnToReport: true,
        source: 'manual'
      });
    } else {
      App.feedback('当前还没有足够实时体验数据。请先点击「开始一次实时体验」，或选择「生成示例报告」。', 'warning');
    }
  },

  /**
   * 显示报告生成中的加载状态
   */
  showReportGenerating() {
    var loading = document.getElementById('reportLoading');
    var empty = document.getElementById('reportEmpty');
    var detail = document.getElementById('reportDetail');
    if (empty) empty.style.display = 'none';
    if (detail) detail.style.display = 'none';
    if (loading) {
      loading.style.display = '';
      loading.style.opacity = '1';
    }

    // v28: Report generation ceremony
    var statusMessages = [
      '正在整理实时脑状态趋势',
      '正在生成音乐恢复摘要',
      '正在生成自动睡眠洞察',
      '正在计算置信度与科学边界'
    ];
    var statusContainer = document.getElementById('reportLoadingText');
    if (statusContainer) {
      var statusHTML = '';
      statusMessages.forEach(function(msg, i) {
        statusHTML += '<div class="report-gen-status" id="genStatus' + i + '"><span class="report-gen-status-dot"></span>' + msg + '</div>';
      });
      statusContainer.innerHTML = statusHTML;

      // Sequentially activate statuses
      statusMessages.forEach(function(msg, i) {
        setTimeout(function() {
          var el = document.getElementById('genStatus' + i);
          if (el) {
            // Mark previous as done
            if (i > 0) {
              var prev = document.getElementById('genStatus' + (i - 1));
              if (prev) prev.classList.add('done');
            }
            el.classList.add('active');
          }
        }, i * 600);
      });
    }
  },

  /**
   * 隐藏加载状态，带交错动画渲染报告
   */
  renderReportWithAnimation() {
    var loading = document.getElementById('reportLoading');
    var detail = document.getElementById('reportDetail');
    var self = this;

    // 清理加载文字轮播
    if (this._reportLoadingInterval) {
      clearInterval(this._reportLoadingInterval);
      this._reportLoadingInterval = null;
    }

    // v28: Mark last report gen status as done
    var genStatuses = document.querySelectorAll('.report-gen-status');
    if (genStatuses.length) {
      genStatuses[genStatuses.length - 1].classList.add('done');
    }

    // 淡出加载状态
    if (loading) {
      loading.style.opacity = '0';
      loading.style.transition = 'opacity 0.3s';
    }

    setTimeout(function() {
      // 隐藏加载层
      if (loading) loading.style.display = 'none';

      // 显示报告详情
      if (detail) detail.style.display = '';

      // 先填充数据（保留原有 renderReport 逻辑）
      self.renderReport();

      // 重置计数目标，便于从 0 开始动画
      var crEl = document.getElementById('reportCognitiveReadiness');
      var baEl = document.getElementById('reportBrainAge');
      var mrEl = document.getElementById('reportMusicRecovery');
      if (crEl) crEl.textContent = '0';
      if (baEl) baEl.textContent = '0';
      if (mrEl) mrEl.textContent = '0%';

      // 交错显示卡片
      if (detail) {
        var items = detail.querySelectorAll('.ios-stagger-item');
        items.forEach(function(item, i) {
          item.classList.remove('revealed');
          setTimeout(function() {
            item.classList.add('revealed');
          }, i * 80 + 100);
        });
      }

      // 数字滚动动画
      setTimeout(function() {
        var crData = App.state.reportData.cognitiveReadinessData || { score: 78 };
        var baData = App.state.reportData.brainAge || { age: 35.2 };
        var bbStats = App.state.reportData.brainBreakStats || {};
        var calmnessIncrease = bbStats.calmnessIncrease || 12;
        if (crEl) App.animateNumber(crEl, 0, crData.score || 78, 800);
        if (baEl) App.animateNumber(baEl, 0, baData.age || 35.2, 800, 1);
        if (mrEl) App.animateNumber(mrEl, 0, calmnessIncrease, 800, 0, '+', '%');
      }, 500);
    }, 300);
  },


  // ================================================================
  // 渲染报告
  // ================================================================
  renderReport() {
    const data = App.state.reportData;

    // v48: Check empty state FIRST, before _renderReportMeta, to avoid null access
    if (!data || (data.duration === 0 && !data.hasRecovery && !data.hasSleep)) {
      var emptyEl = document.getElementById('reportEmpty');
      var detailEl = document.getElementById('reportDetail');
      var loadingEl = document.getElementById('reportLoading');

      if (emptyEl) emptyEl.style.display = 'block';
      if (detailEl) detailEl.style.display = 'none';
      // v49: Hide loading to prevent residual spinner mixing with empty state
      if (loadingEl) {
        loadingEl.style.display = 'none';
        loadingEl.style.opacity = '0';
      }

      // Clear meta when no data
      this._renderReportMeta(null);
      return;
    }

    var emptyEl2 = document.getElementById('reportEmpty');
    var detailEl2 = document.getElementById('reportDetail');
    var loadingEl2 = document.getElementById('reportLoading');

    if (emptyEl2) emptyEl2.style.display = 'none';
    if (detailEl2) detailEl2.style.display = 'block';
    // v53: Explicitly hide loading in normal branch to prevent residual spinner
    if (loadingEl2) {
      loadingEl2.style.display = 'none';
      loadingEl2.style.opacity = '0';
    }

    // v47: Render report meta (source label + timeout warning)
    this._renderReportMeta(data);

    // 日期
    const now = new Date();
    var dateEl = document.getElementById('reportDate');
    if (dateEl) dateEl.textContent =
      now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    // 顶部三张摘要卡
    this._renderSummaryCards(data);

    // 今日摘要
    this._renderTodaySummary(data);

    // 脑状态趋势
    this._renderBrainHealth(data);

    // 音乐与恢复摘要
    this._renderAudioFeedback(data);

    // 自动睡眠脑状态摘要
    this._insertAutoSleepInsight(data);

    // 专注趋势图
    this._renderReportChart(data);

    // 科学解释
    this._renderScientificInterpretation(data);

    // 不能据此得出的结论：追加睡眠相关条目
    this._renderSleepWhatNotItems();
  },

  /**
   * 渲染科学解释模块
   */
  _renderScientificInterpretation(data) {
    if (!data.science) return;

    var sci = data.science;

    // What changed?
    var whatChangedEl = document.getElementById('siWhatChanged');
    if (whatChangedEl) whatChangedEl.textContent = sci.whatChanged || '暂无数据';

    // Why recommended?
    var whyEl = document.getElementById('siWhyRecommended');
    if (whyEl) whyEl.textContent = sci.whyRecommended || '暂无数据';

    // How confident?
    var confEl = document.getElementById('siHowConfident');
    if (confEl) confEl.textContent = sci.howConfident || '暂无数据';

    // What not to conclude?
    var notEl = document.getElementById('siWhatNot');
    if (notEl) notEl.textContent = sci.whatNotToConclude || '不能据此判断疾病、焦虑障碍、睡眠障碍或真实脑年龄变化。';
  },

  /**
   * 滚动到报告区块（report-nav-bar 已移除，保留空函数兼容）
   */
  scrollToSection(sectionId) {
    // v19: report-nav-bar 已移除，此函数保留为空以兼容旧调用
  },

  /**
   * 渲染顶部三张摘要卡
   */
  /**
   * v47: Render report source label and timeout warning
   */
  _renderReportMeta(data) {
    var sourceLabel = document.getElementById('reportSourceLabel');
    var warningEl = document.getElementById('reportRunWarning');

    // v48: Handle null/undefined data gracefully
    if (!data) {
      if (sourceLabel) {
        sourceLabel.textContent = '';
        sourceLabel.className = 'report-source-label';
      }
      if (warningEl) {
        warningEl.style.display = 'none';
        warningEl.textContent = '';
      }
      return;
    }

    // Source label
    if (sourceLabel) {
      var source = (data.runMeta && data.runMeta.source) || data.reportSource || 'manual';
      var label = '';
      var cssClass = 'report-source-label';

      if (source === 'report-experience') {
        label = '实时体验报告';
      } else if (source === 'sample') {
        label = '示例报告';
        cssClass += ' source-sample';
      } else if (source === 'judge') {
        label = '评审演示报告';
        cssClass += ' source-manual';
      } else {
        label = '手动生成报告';
        cssClass += ' source-manual';
      }

      sourceLabel.textContent = label;
      sourceLabel.className = cssClass;
    }

    // Timeout warning
    if (warningEl) {
      var timedOut = (data.runMeta && data.runMeta.timedOut) || data.reportTimedOut;
      if (timedOut) {
        warningEl.style.display = 'block';
        warningEl.textContent = '实时体验样本较少：本报告基于当前已有模拟样本生成，仅用于 Demo 展示。';
      } else {
        warningEl.style.display = 'none';
      }
    }
  },

  _renderSummaryCards(data) {
    var cr = data.cognitiveReadinessData || { score: 78 };
    var ba = data.brainAge || { age: 35.2 };
    var bbStats = data.brainBreakStats || {};
    var calmnessIncrease = bbStats.calmnessIncrease || 12;

    var crEl = document.getElementById('reportCognitiveReadiness');
    var baEl = document.getElementById('reportBrainAge');
    var mrEl = document.getElementById('reportMusicRecovery');

    if (crEl) crEl.textContent = cr.score || 78;
    if (baEl) baEl.textContent = (ba.age || 35.2).toFixed(1);
    if (mrEl) mrEl.textContent = '+' + calmnessIncrease + '%';

    // v26: 更新报告总览卡片
    var reportSleepScore = document.getElementById('reportSleepScore');
    if (reportSleepScore && data.sleepInsight && data.sleepInsight.available) {
      reportSleepScore.textContent = data.sleepInsight.sleepScore;
    }
    var reportOverviewSummary = document.getElementById('reportOverviewSummary');
    if (reportOverviewSummary) {
      var summary = '今天专注趋势整体稳定，后段疲劳负荷升高，系统推荐 ' + (data.recommendedScene || 'Breath Guide') + '。';
      if (data.sleepInsight && data.sleepInsight.available) {
        summary += '夜间睡眠质量' + (data.sleepInsight.sleepScore >= 80 ? '良好' : '一般') + '，深睡趋势参考占比 ' + data.sleepInsight.deepPercent + '%。';
      }
      reportOverviewSummary.textContent = summary;
    }
  },

  /**
   * 渲染大脑健康趋势
   */
  _renderBrainHealth(data) {
    const container = document.getElementById('brainHealthList');
    if (!container) return;

    const bh = data.brainHealth || {};
    const metrics = [
      { key: 'cognitiveStrain', label: '认知压力', labelZh: 'Cognitive Strain', inverse: true, color: '#ff6b6b' },
      { key: 'mentalRecovery', label: '心理恢复', labelZh: 'Mental Recovery', inverse: false, color: '#69f0ae' },
      { key: 'cognitiveSpeed', label: '认知速度', labelZh: 'Cognitive Speed', inverse: false, color: '#4dd0e1' },
      { key: 'focusStability', label: '专注稳定性', labelZh: 'Focus Stability', inverse: false, color: '#b39ddb' },
      { key: 'calmness', label: '平静度', labelZh: 'Calmness', inverse: false, color: '#80cbc4' },
      { key: 'fatigueLoad', label: '疲劳负荷', labelZh: 'Fatigue Load', inverse: true, color: '#ffb74d' }
    ];

    container.innerHTML = metrics.map(m => {
      const value = Math.round(bh[m.key] || 0);
      const status = Simulator.getBrainHealthStatus(value, m.inverse);
      return '<div class="bh-item">' +
        '<div class="bh-item-left">' +
        '<div class="bh-item-label">' + m.label + '</div>' +
        '<div class="bh-item-label-zh">' + m.labelZh + '</div>' +
        '</div>' +
        '<div class="bh-item-right">' +
        '<div class="bh-item-bar"><div class="bh-item-bar-fill" style="width:' + value + '%;background:' + m.color + '"></div></div>' +
        '<div class="bh-item-value">' + value + '</div>' +
        '<div class="bh-item-status bh-status-' + status.class + '">' + status.zh + ' ' + status.en + '</div>' +
        '</div>' +
        '</div>';
    }).join('');
  },

  /**
   * 渲染今日摘要
   */
  _renderTodaySummary(data) {
    var el = document.getElementById('reportTodaySummary');
    if (!el) return;

    var summary = '';
    if (data.peakFocusTime > 0 && data.peakFocusTime < 300 && data.maxFatigue > 50) {
      summary = '本次会话中，疲劳负荷在后段升高，系统推荐 Breath Guide。信号质量良好，伪迹风险较低，因此推荐置信度为 Medium。';
    } else if (data.avgFocus > 70) {
      summary = '本次会话整体专注水平较高，建议保持当前节奏，每 40 分钟进行一次短休息。信号质量良好，推荐置信度为 Medium。';
    } else if (data.maxFatigue > 70) {
      summary = '本次会话疲劳峰值较高，建议在疲劳感出现前主动进行短休息。信号质量良好，推荐置信度为 Medium。';
    } else {
      summary = '本次会话专注度波动较大，建议减少环境干扰，在疲劳上升前主动休息。信号质量良好，伪迹风险较低，推荐置信度为 Medium。';
    }

    if (App.dissolveText) {
      App.dissolveText(el, summary);
    } else {
      el.textContent = summary;
    }
  },

  _renderReportChart(data) {
    const canvas = document.getElementById('reportChart');
    if (!canvas) return;

    // 创建或重用报告图表
    if (!App.charts.report) {
      App.charts.report = new RealtimeChart(canvas, {
        maxPoints: 60, minY: 0, maxY: 100,
        series: [{ key: 'focus', color: '#34d399' }]
      });
    }

    // 清空并填充历史数据
    App.charts.report.clear();
    data.focusHistory.forEach(val => {
      App.charts.report.push({ focus: val });
    });

    // 确保渲染
    requestAnimationFrame(() => {
      if (App.charts.report) App.charts.report._setupCanvas();
    });
  },

  /**
   * 渲染音乐与恢复摘要
   */
  _renderAudioFeedback(data) {
    const stats = data.audioStats || {
      focusMusicTime: 0,
      brainBreakAudioCount: 0,
      ancSwitchCount: 0,
      recoveryCueCount: 0
    };

    // 疲劳恢复与平静度提升
    const bbStats = data.brainBreakStats || {};
    const fatigueRecovery = bbStats.fatigueRecovery || 0;
    const calmnessIncrease = bbStats.calmnessIncrease || 0;

    // v33: 音乐软件数据 — 尊重用户当前连接状态
    const ma = data.musicApp || {};
    const providerNames = {
      spotify: 'Spotify',
      appleMusic: 'Apple Music',
      netease: '网易云音乐',
      qqMusic: 'QQ 音乐'
    };
    // v48: connectedApp distinguishes "connected" vs "sent commands this run"
    const runMeta = data.runMeta || {};
    const sceneSwitches = typeof runMeta.commandCount === 'number'
      ? runMeta.commandCount
      : (data.commandCount || ma.switches || 0);
    var connectedApp;
    if (!ma.connected) {
      connectedApp = '未连接 Demo Connector';
    } else if (sceneSwitches > 0) {
      connectedApp = (providerNames[ma.provider] || ma.provider || 'Demo') + ' · 已发送 ' + sceneSwitches + ' 次';
    } else {
      connectedApp = (providerNames[ma.provider] || ma.provider || 'Demo') + ' · 本次未发送指令';
    }
    // v48: Use mostUsedScene from report data, not global currentPlaylist
    const mostUsedScene = data.mostUsedScene || 'Breath Guide Demo';
    // v47: Use brainBreakStats.count (this run's count) — bbStats already declared above
    const brainBreakCount = typeof bbStats.count === 'number' ? bbStats.count : (data.brainBreakCount || 0);
    const suggestedNext = calmnessIncrease < 15 ? 'Calm Ambient' : 'Focus Mix';

    // 填充数值
    const connectedAppEl = document.getElementById('afConnectedApp');
    const mostUsedEl = document.getElementById('afMostUsedScene');
    const switchesEl = document.getElementById('afSceneSwitches');
    const bbCountEl = document.getElementById('afBrainBreakCount');
    const fatigueEl = document.getElementById('afFatigueRecovery');
    const calmnessValEl = document.getElementById('afCalmnessIncreaseVal');
    const suggestedEl = document.getElementById('afSuggestedNext');

    if (connectedAppEl) connectedAppEl.textContent = connectedApp;
    if (mostUsedEl) mostUsedEl.textContent = mostUsedScene;
    if (switchesEl) switchesEl.textContent = sceneSwitches + ' 次';
    if (bbCountEl) bbCountEl.textContent = brainBreakCount + ' 次';
    if (fatigueEl) fatigueEl.textContent = '-' + fatigueRecovery + '%';
    if (calmnessValEl) calmnessValEl.textContent = '+' + calmnessIncrease + '%';
    if (suggestedEl) suggestedEl.textContent = suggestedNext;
  },

  _renderAutoSleepInsight(data) {
    // v51: Read from report data, not global App.state.sleepInsight
    data = data || App.state.reportData || {};
    var i = data.sleepInsight;
    if (!i || !i.available) return '';

    // v29 Card 1: Premium Sleep Score Card (dark gradient)
    var scoreCard = '<div class="card-margin-bottom" id="reportAutoSleepInsight">' +
      '<div class="card-label-subtext" style="margin-bottom:8px;">自动睡眠脑状态摘要</div>' +
      '<p class="card-subtitle-text" style="margin-bottom:16px;">Auto Sleep Insight · 自动生成，无需手动启动</p>' +
      '<div class="nf-sleep-score-card">' +
        '<div class="nf-sleep-score-left">' +
          '<div class="nf-sleep-score-label">睡眠质量评分</div>' +
          '<div class="nf-sleep-score-status">睡眠质量良好</div>' +
          '<div class="nf-sleep-score-value">' + i.sleepScore + '</div>' +
          '<div class="nf-sleep-score-delta">' + i.scoreChange + ' 分 · 较上次</div>' +
          '<div class="nf-sleep-score-percentile">超过了 ' + i.percentile + '% 的模拟用户</div>' +
        '</div>' +
        '<div class="nf-sleep-score-right">' +
          '<div class="nf-sleep-score-moon"></div>' +
          '<div class="nf-sleep-score-tag">Demo Trend</div>' +
        '</div>' +
      '</div>' +
      '<p style="font-size:12px;color:var(--ios-subtext);line-height:1.5;margin-top:12px;">基于模拟 EEG 趋势、夜间稳定度、伪迹风险和睡眠结构估计生成。</p>' +
    '</div>';

    // v34 Card 2: Long Sleep Card + Timeline (unified .nf-sleep-* class names)
    var stageColors = { deep: '#2633C7', light: '#2F80ED', rem: '#5AC8FA', awake: '#FF9500' };
    var stageLabels = { deep: '深睡', light: '浅睡', rem: 'REM-like', awake: '清醒' };
    var totalSegMin = i.stageSegments ? i.stageSegments.reduce(function(s, seg) { return s + seg.duration; }, 0) : 498;

    // Build premium timeline bars with different heights
    var segmentsHtml = '';
    if (i.stageSegments) {
      i.stageSegments.forEach(function(seg, idx) {
        var widthPct = (seg.duration / totalSegMin * 100).toFixed(2);
        var height = seg.stage === 'deep' ? '60%' : seg.stage === 'rem' ? '90%' : seg.stage === 'light' ? '45%' : '25%';
        var color = stageColors[seg.stage] || '#ccc';
        segmentsHtml += '<div class="nf-sleep-tl-bar" style="width:' + widthPct + '%;height:' + height + ';background:' + color + ';animation-delay:' + (idx * 0.03) + 's;"></div>';
      });
    }

    var durationCard = '<div class="card-margin-bottom">' +
      '<div class="card-label-subtext" style="margin-bottom:12px;">长睡眠</div>' +
      '<div class="nf-sleep-long-card">' +
        '<div class="nf-sleep-long-duration">' + i.totalSleep + '</div>' +
        '<div class="nf-sleep-long-bar"><div class="nf-sleep-long-bar-fill"></div></div>' +
        '<div class="nf-sleep-long-times"><span>' + i.sleepWindow.split(' - ')[0] + ' 入睡</span><span>' + i.sleepWindow.split(' - ')[1] + ' 醒来</span></div>' +
      '</div>' +
      '<div class="nf-sleep-timeline" style="margin-top:16px;">' +
        '<div class="nf-sleep-timeline-legend">' +
          '<div class="nf-sleep-tl-legend-item"><span class="nf-sleep-tl-legend-dot" style="background:#2633C7"></span>深睡</div>' +
          '<div class="nf-sleep-tl-legend-item"><span class="nf-sleep-tl-legend-dot" style="background:#2F80ED"></span>浅睡</div>' +
          '<div class="nf-sleep-tl-legend-item"><span class="nf-sleep-tl-legend-dot" style="background:#5AC8FA"></span>REM-like</div>' +
          '<div class="nf-sleep-tl-legend-item"><span class="nf-sleep-tl-legend-dot" style="background:#FF9500"></span>清醒</div>' +
        '</div>' +
        '<div class="nf-sleep-timeline-bars">' + segmentsHtml + '</div>' +
        '<div class="nf-sleep-tl-time"><span>' + i.sleepWindow.split(' - ')[0] + '</span><span>' + i.sleepWindow.split(' - ')[1] + '</span></div>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--ios-subtext);margin-top:8px;">Demo Trend · 非临床睡眠分期</div>' +
    '</div>';

    // v34 Card 3: Sleep Structure Ring (unified .nf-sleep-ring-* class names)
    var remEnd = i.remPercent;
    var lightEnd = remEnd + i.lightPercent;
    var deepEnd = lightEnd + i.deepPercent;

    var structureCard = '<div class="card-margin-bottom">' +
      '<div class="card-label-subtext" style="margin-bottom:16px;">睡眠结构</div>' +
      '<div class="nf-sleep-ring-wrap">' +
        '<div class="nf-sleep-ring">' +
          '<div class="nf-sleep-ring-circle" style="background:conic-gradient(#5AC8FA 0% ' + remEnd + '%, #2F80ED ' + remEnd + '% ' + lightEnd + '%, #2633C7 ' + lightEnd + '% ' + deepEnd + '%, #FF9500 ' + deepEnd + '% 100%);"></div>' +
          '<div class="nf-sleep-ring-center">' +
            '<div class="nf-sleep-ring-duration">' + i.totalSleep + '</div>' +
            '<div class="nf-sleep-ring-label">总睡眠</div>' +
          '</div>' +
        '</div>' +
        '<div class="nf-sleep-ring-legend">' +
          '<div class="nf-sleep-ring-leg-item"><span class="nf-sleep-ring-leg-dot" style="background:#5AC8FA"></span><span class="nf-sleep-ring-leg-name">REM-like 趋势</span><span class="nf-sleep-ring-leg-pct">' + i.remPercent + '%</span><span class="nf-sleep-ring-leg-dur">' + i.remDuration + '</span></div>' +
          '<div class="nf-sleep-ring-leg-item"><span class="nf-sleep-ring-leg-dot" style="background:#2F80ED"></span><span class="nf-sleep-ring-leg-name">浅睡趋势</span><span class="nf-sleep-ring-leg-pct">' + i.lightPercent + '%</span><span class="nf-sleep-ring-leg-dur">' + i.lightDuration + '</span></div>' +
          '<div class="nf-sleep-ring-leg-item"><span class="nf-sleep-ring-leg-dot" style="background:#2633C7"></span><span class="nf-sleep-ring-leg-name">深睡趋势</span><span class="nf-sleep-ring-leg-pct">' + i.deepPercent + '%</span><span class="nf-sleep-ring-leg-dur">' + i.deepDuration + '</span></div>' +
          '<div class="nf-sleep-ring-leg-item"><span class="nf-sleep-ring-leg-dot" style="background:#FF9500"></span><span class="nf-sleep-ring-leg-name">清醒</span><span class="nf-sleep-ring-leg-pct">' + i.awakeCount + ' 次</span><span class="nf-sleep-ring-leg-dur">' + i.awakeDuration + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>';

    // Card 4: Nighttime EEG Trends (keep existing but wrap in better container)
    var bandColors = { delta: '#a78bfa', theta: '#60a5fa', alpha: '#34d399', beta: '#fbbf24' };
    var bandNames = { delta: 'Delta 0.5-4 Hz', theta: 'Theta 4-8 Hz', alpha: 'Alpha 8-13 Hz', beta: 'Beta 13-30 Hz' };
    var bandDescs = {
      delta: 'Delta 趋势增强：深睡趋势参考',
      theta: 'Theta 前段上升：入睡过渡参考',
      alpha: 'Alpha 逐步下降：放松到入睡趋势',
      beta: 'Beta 夜间偏低：警觉活动降低'
    };
    var bandsHtml = '';
    if (i.bands) {
      Object.keys(i.bands).forEach(function(key) {
        var val = i.bands[key];
        bandsHtml += '<div class="sleep-band-mini">' +
          '<div class="sleep-band-mini-header"><span>' + bandNames[key] + '</span><span style="font-weight:600;color:var(--ios-text);">' + val + '</span></div>' +
          '<div class="ios-metric-bar"><div class="ios-metric-bar-fill" style="background:' + bandColors[key] + ';width:' + val + '%;"></div></div>' +
          '<div style="font-size:11px;color:var(--ios-subtext);margin-top:2px;">' + bandDescs[key] + '</div>' +
        '</div>';
      });
    }

    var eegCard = '<div class="ios-card card-margin-bottom">' +
      '<div class="card-label-subtext">夜间 EEG 趋势</div>' +
      '<p class="card-subtitle-text" style="margin-bottom:12px;">Nighttime EEG Band Trends · 趋势参考</p>' +
      bandsHtml +
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">' +
        '<span class="ios-pill ios-pill-gray">信号质量：' + i.signalQuality + '</span>' +
        '<span class="ios-pill ios-pill-gray">伪迹风险：' + i.artifactRisk + '</span>' +
        '<span class="ios-pill ios-pill-gray">置信度：' + i.confidence + '</span>' +
      '</div>' +
    '</div>';

    // v29 Card 5: Sleep Interpretation & Advice (insight card style)
    var adviceCard = '<div class="card-margin-bottom">' +
      '<div class="card-label-subtext" style="margin-bottom:12px;">睡眠解读与建议</div>' +
      '<div class="insight-card-v29">' +
        '<div class="insight-card-v29-body">' + i.summary + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">' +
        '<span class="ios-pill" style="background:rgba(255,200,0,0.12);color:var(--ios-orange);font-size:11px;">Demo Trend</span>' +
        '<span class="ios-pill" style="background:rgba(255,200,0,0.12);color:var(--ios-orange);font-size:11px;">Not clinical sleep staging</span>' +
        '<span class="ios-pill" style="background:rgba(255,200,0,0.12);color:var(--ios-orange);font-size:11px;">Not medical diagnosis</span>' +
      '</div>' +
      '<div style="margin-top:12px;padding:10px 12px;background:rgba(255,200,0,0.06);border-radius:8px;">' +
        '<div style="font-size:12px;color:var(--ios-subtext);line-height:1.5;">当前睡眠模块为自动生成的模拟睡眠脑状态趋势，仅用于展示脑电耳机在夜间场景中的交互可能性，不作为医学睡眠诊断、临床睡眠分期或疾病筛查依据。</div>' +
      '</div>' +
    '</div>';

    return scoreCard + durationCard + structureCard + eegCard + adviceCard;
  },

  _insertAutoSleepInsight(data) {
    // v51: Use report data, not global App.state
    data = data || App.state.reportData || {};
    var html = this._renderAutoSleepInsight(data);

    var container = document.getElementById('autoSleepInsightContainer');
    if (!container) {
      // Fallback: insert after music summary
      var musicSummaryEl = document.getElementById('reportMusicSummary');
      if (!musicSummaryEl) return;
      var musicCard = musicSummaryEl.closest('.ios-card');
      if (!musicCard) return;
      var existing = document.getElementById('reportAutoSleepInsight');
      if (existing) existing.remove();
      if (html) musicCard.insertAdjacentHTML('afterend', html);
    } else {
      container.innerHTML = html;
    }

    // v28: Generate sleep stages fallback if missing
    if (!data.sleepStages && data.sleepInsight) {
      data.sleepStages = [
        { type: 'deep', duration: 30, label: '深睡' },
        { type: 'light', duration: 45, label: '浅睡' },
        { type: 'rem', duration: 20, label: 'REM' },
        { type: 'awake', duration: 5, label: '清醒' },
        { type: 'light', duration: 35, label: '浅睡' },
        { type: 'deep', duration: 25, label: '深睡' },
        { type: 'rem', duration: 15, label: 'REM' }
      ];
    }

    // v51: Use unified .nf-sleep-timeline-bars (not .nf-sleep-timeline-track)
    var barsContainer = container ? container.querySelector('.nf-sleep-timeline-bars') : null;
    if (barsContainer) {
      barsContainer.classList.add('is-revealed');
    }

    // v27: Generate waveform for Now Playing
    var wfContainers = container ? container.querySelectorAll('.recovery-waveform') : [];
    wfContainers.forEach(function(wf) {
      var type = wf.dataset.wfType || 'focus';
      App.generateWaveform(wf, type, 16);
    });
  },

  /**
   * 在「不能据此得出的结论」列表中追加睡眠相关条目
   */
  _renderSleepWhatNotItems() {
    var container = document.querySelector('.what-not-list');
    if (!container) return;

    var items = [
      '不能诊断失眠',
      '不能判断睡眠呼吸暂停',
      '不能替代 PSG 多导睡眠监测',
      '不能作为临床睡眠分期结果'
    ];

    items.forEach(function(text) {
      // 避免重复添加
      var already = Array.prototype.some.call(container.children, function(child) {
        return child.textContent === text;
      });
      if (already) return;

      var item = document.createElement('div');
      item.className = 'ios-dissolve';
      item.setAttribute('style', 'padding:8px 0;font-size:14px;color:var(--ios-text);');
      item.textContent = text;
      container.appendChild(item);
    });
  }
};
