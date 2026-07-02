/****************************
 * 见澄明H5 - 报告页渲染模块 (ES Module)
 * 雷达图(Canvas)、画像卡、光山卡片、五指数仪表盘、遮蔽诊断、深度诊断、48小时行动
 ****************************/

/**
 * 渲染完整报告页
 * @param {HTMLElement} container
 * @param {Object} result - CJIScorer.calculate() 的结果
 * @param {Object} dataMap - 文案数据映射 { PORTRAIT_DATA, INDEX_DATA, SHADOW_DATA, DEEP_DIAG_DATA, PORTRAIT_ONE_LINER }
 * @param {Object} options - { onShare, onCoach, onHome }
 */
export function renderReport(container, result, dataMap, options = {}) {
  const {
    PORTRAIT_DATA,
    INDEX_DATA,
    SHADOW_DATA,
    DEEP_DIAG_DATA,
    PORTRAIT_ONE_LINER,
    POSITION_DATA,
    CROSS_INTRO_TEXT,
    FAST_CROSS_DATA,
    AXIS_DATA
  } = dataMap;

  const p = PORTRAIT_DATA[result.portrait];
  const oneLiner = PORTRAIT_ONE_LINER[result.portrait];
  const isFast = result.mode === 'fast';

  container.className = 'page-report fade-in';

  // 快速版：简版报告（一句话 + 光 + 提醒）
  if (isFast) {
    // 快速版交叉判定用 FAST_CROSS_DATA 的文案（v5.0: 纯字符串）
    const fastDiagHtml = result.deepDiag.length > 0 ? `
      <div class="report-section">
        <div class="report-section-title">🔬 交叉判定</div>
        ${result.deepDiag.map(d => {
          const fastInfo = FAST_CROSS_DATA?.[d.type];
          // 快速版：fastInfo 是字符串直接用；否则从 DEEP_DIAG_DATA 常量取文案
          if (typeof fastInfo === 'string') {
            return `<div class="deep-diag-card"><div class="deep-diag-text">${fastInfo}</div></div>`;
          }
          const refData = DEEP_DIAG_DATA?.[d.type];
          const title = refData?.tag || d.tag || d.title || d.type;
          const text = refData?.desc || d.desc || d.text || '';
          return `
          <div class="deep-diag-card">
            <div class="deep-diag-title">${title}</div>
            <div class="deep-diag-text">${text.replace(/\\n/g, '<br>')}</div>
          </div>`;
        }).join('')}
      </div>
    ` : '';

    container.innerHTML = `
      <div class="report-page-title">📊 你的澄明力画像</div>

      ${renderAxisScoreBars(result.threeAxes, AXIS_DATA)}

      <div class="radar-container">
        <canvas id="radarCanvas" class="radar-canvas" width="280" height="240"></canvas>
        <div class="portrait-name">${p.name}</div>
        <div class="portrait-desc">${oneLiner}</div>
      </div>

      ${result.tooFast && result.tooFast.flagged ? `
      <div class="warning-card" style="background:#FFF3E0;border:1px solid #F5A623;border-radius:12px;padding:12px 16px;margin:12px 0;font-size:13px;color:#8B6914;">
        ⚠️ 您的作答时间为${result.tooFast.elapsedSec}秒（低于${result.tooFast.thresholdSec}秒阈值），结果可能不够准确。建议重新评测，给自己更多时间感受每道题。
      </div>` : ''}

      <div class="light-mountain-card">
        <div class="lm-header">☀️ 你的光</div>
        <div class="lm-text">${p.light.replace(/\n\n/g, '<br><br>').split('<br><br>').slice(0, 3).join('<br><br>')}</div>
      </div>

      <div class="light-mountain-card">
        <div class="lm-header">💭 一句话提醒</div>
        <div class="lm-text">${p.mountain.replace(/\n\n/g, '<br><br>').split('<br><br>').slice(0, 3).join('<br><br>')}</div>
      </div>

      ${fastDiagHtml}

      <div class="report-section" style="background:linear-gradient(135deg,#FFFBF0,#FFF5D6);border:1.5px solid var(--border-lighter);border-radius:16px;padding:20px;text-align:center;margin:16px 0;">
        <div style="font-size:16px;font-weight:bold;color:#FF4D2E;margin-bottom:8px;">🎯 想要更完整的画像？</div>
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:16px;">快速版给出了你的三轴坐标和一句话画像。<br>完整版包含光与山、你的位置、训练路径和深度诊断。</div>
        <button class="btn-primary" id="btn-standard">做完整版测评</button>
      </div>

      <button class="btn-secondary" id="btn-share">分享海报</button>
      <button class="btn-text" id="btn-home">返回首页</button>

      <div class="divider"></div>

      <div class="feedback-section">
        <div class="report-section-title" style="text-align:center;">📣 您的反馈很重要</div>
        <div style="font-size:12px;color:var(--text-tertiary);text-align:center;margin-bottom:12px;">数据仅存本地，Demo阶段不上传</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">画像准确度</div>
        <div class="feedback-stars" data-dim="accuracy"></div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">报告启发性</div>
        <div class="feedback-stars" data-dim="insight"></div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">推荐意愿</div>
        <div class="feedback-stars" data-dim="recommend"></div>
        <textarea class="feedback-textarea" placeholder="想说点什么...（选填）" maxlength="200"></textarea>
        <button class="feedback-submit" id="feedbackBtn" disabled>请先完成评分</button>
      </div>
    `;

    drawRadar('radarCanvas', result.threeAxes);
    document.getElementById('btn-standard').addEventListener('click', () => options.onStandard && options.onStandard());
    document.getElementById('btn-share').addEventListener('click', () => options.onShare && options.onShare());
    document.getElementById('btn-home').addEventListener('click', () => options.onHome && options.onHome());
    bindStarRating();
    return;
  }

  // 标准版：完整报告
  const shadowInfo = SHADOW_DATA[result.shadow.mainShadow];
  const aiUseText = getIndexText(INDEX_DATA, 'aiUtilization', result.fiveIndices.aiUtilization);
  const aiRiskText = getIndexText(INDEX_DATA, 'aiRisk', result.fiveIndices.aiRisk);
  const socialUseText = getIndexText(INDEX_DATA, 'utilizeSociety', result.fiveIndices.utilizeSociety);
  const socialRiskText = getIndexText(INDEX_DATA, 'beatenBySociety', result.fiveIndices.beatenBySociety);

  // 你的位置·三段解读
  const posWorld = getPositionText(POSITION_DATA.world, result.fiveIndices.utilizeSociety, result.fiveIndices.beatenBySociety);
  const posAI = getPositionText(POSITION_DATA.ai, result.fiveIndices.aiUtilization, result.fiveIndices.aiRisk);
  const posChoice = getChoicePositionText(POSITION_DATA.choice, result);

  // 交叉判定引导文案（v5.0: 文字键）
  const crossCountMap = { 1: 'one', 2: 'two', 3: 'three' };
  const crossKey = crossCountMap[Math.min(result.deepDiag.length, 3)] || 'many';
  const crossIntroHtml = result.deepDiag.length > 0 && CROSS_INTRO_TEXT ? `
    <div style="text-align:center;font-size:15px;color:var(--text-secondary);margin:12px 0 8px;font-weight:bold;">
      ${CROSS_INTRO_TEXT[crossKey] || CROSS_INTRO_TEXT.many || ''}
    </div>
  ` : '';

  container.innerHTML = `
    <div class="report-page-title">📊 你的澄明力报告</div>

    <div class="radar-container">
      <div class="radar-label">你的澄明力画像</div>
      <canvas id="radarCanvas" class="radar-canvas" width="280" height="240"></canvas>
      <div class="portrait-name">${p.name}</div>
      <div class="portrait-desc">${oneLiner}</div>
    </div>

    <div class="light-mountain-card">
      <div class="lm-header">☀️ 你的光</div>
      <div class="lm-title">${getAxisName(result.portrait, 'light')}</div>
      <div class="lm-text">${p.light.replace(/\n\n/g, '<br><br>')}</div>
    </div>

    ${result.tooFast && result.tooFast.flagged ? `
    <div class="warning-card" style="background:#FFF3E0;border:1px solid #F5A623;border-radius:12px;padding:12px 16px;margin:12px 0;font-size:13px;color:#8B6914;">
      ⚠️ 您的作答时间为${result.tooFast.elapsedSec}秒（低于${result.tooFast.thresholdSec}秒阈值），结果可能不够准确。建议重新评测，给自己更多时间感受每道题。
    </div>` : ''}

    ${result.threeAxes.seWarning ? `
    <div class="warning-card" style="background:#FFF3E0;border:1px solid #F5A623;border-radius:12px;padding:12px 16px;margin:12px 0;font-size:13px;color:#8B6914;">
      📋 您在社会期望量表上的得分较高——这意味着您可能倾向于选择"看起来更好"的答案而非最真实的答案。以下结果已做修正，但仍值得再审视一遍：哪些是真实的你，哪些是"你希望成为的你"？
    </div>` : ''}

    <div class="light-mountain-card">
      <div class="lm-header">⛰️ 你的山</div>
      <div class="lm-title">${getAxisName(result.portrait, 'mountain')}</div>
      <div class="lm-text">${p.mountain.replace(/\n\n/g, '<br><br>')}</div>
    </div>

    <div class="divider"></div>

    <div class="report-section">
      <div class="report-section-title" style="text-align:center;">主要项目得分</div>

      ${renderAxisScoreBars(result.threeAxes, AXIS_DATA)}

      <div class="index-card">
        <div class="index-header">📊 社会适应力</div>
        <div class="index-score-row">
          <span class="index-score-value">${result.clarityScore}分</span>
          <span class="index-score-label">${result.clarityScore >= 70 ? '澄明' : (result.clarityScore >= 40 ? '过渡中' : '起步中')}</span>
        </div>
        ${renderSegmentedBar(result.clarityScore)}
        <div class="index-desc">${result.clarityScore >= 70 ? '三根轴均衡运转，你看得见场、读得懂自己、找得到路。' : (result.clarityScore >= 40 ? '有些轴转得不错，有些还在启动。继续练。' : '三根轴都在起步——看见自己在起步，就是开始。')}</div>
      </div>

      <div class="sub-index-card">
        <div class="sub-header">${INDEX_DATA.aiUtilization.title}</div>
        <div class="sub-score-row">
          <span class="sub-score-value">${result.fiveIndices.aiUtilization}分</span>
          <span class="sub-score-label">${aiUseText.label}</span>
        </div>
        ${renderSegmentedBar(result.fiveIndices.aiUtilization)}
        <div class="sub-desc">${aiUseText.text}</div>
      </div>

      <div class="sub-index-card">
        <div class="sub-header">${INDEX_DATA.aiRisk.title}</div>
        <div class="sub-score-row">
          <span class="sub-score-value">${result.fiveIndices.aiRisk}分</span>
          <span class="sub-score-label">${aiRiskText.label}</span>
        </div>
        ${renderSegmentedBar(result.fiveIndices.aiRisk)}
        <div class="sub-desc">${aiRiskText.text}</div>
        ${result.deepDiag.find(d => d.type === 'feedingRisk') ? `<div class="index-sub-risk">⚠️ 注意：你可能容易被AI投喂——试试让它说你不爱听的。</div>` : ''}
      </div>

      <div class="sub-index-card">
        <div class="sub-header">${INDEX_DATA.utilizeSociety.title}</div>
        <div class="sub-score-row">
          <span class="sub-score-value">${result.fiveIndices.utilizeSociety}分</span>
          <span class="sub-score-label">${socialUseText.label}</span>
        </div>
        ${renderSegmentedBar(result.fiveIndices.utilizeSociety)}
        <div class="sub-desc">${socialUseText.text}</div>
      </div>

      <div class="sub-index-card">
        <div class="sub-header">${INDEX_DATA.beatenBySociety.title}</div>
        <div class="sub-score-row">
          <span class="sub-score-value">${result.fiveIndices.beatenBySociety}分</span>
          <span class="sub-score-label">${socialRiskText.label}</span>
        </div>
        ${renderSegmentedBar(result.fiveIndices.beatenBySociety)}
        <div class="sub-desc">${socialRiskText.text}</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="report-section">
      <div class="report-section-title" style="text-align:center;">📍 你的位置</div>

      <div class="position-card">
        <div class="position-label">你与世界</div>
        <div class="position-text">${posWorld}</div>
      </div>

      <div class="position-card">
        <div class="position-label">你与AI</div>
        <div class="position-text">${posAI}</div>
      </div>

      <div class="position-card">
        <div class="position-label">你的路径</div>
        <div class="position-text">${posChoice}</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="report-section">
      <div class="report-section-title">🔍 深度洞察</div>

      ${renderShadowRadar(result)}

      <div style="margin-top:16px;">
        <div style="font-size:14px;font-weight:bold;color:#FF4D2E;margin-bottom:10px;">🌫️ 你的盲区</div>
        <div class="shadow-card">
          <div class="shadow-main">${shadowInfo.name}${result.shadow.shadowMode === 'compound' ? ' [复合遮蔽]' : ''}</div>
          <div class="shadow-text">${shadowInfo.desc}</div>
          <span class="shadow-tag">${shadowInfo.tag}</span>
        </div>
      </div>

      ${result.deepDiag.length > 0 ? `
      <div style="margin-top:16px;">
        ${crossIntroHtml}
        <div style="font-size:14px;font-weight:bold;color:#FF4D2E;margin-bottom:10px;">🔬 交叉发现</div>
        ${result.deepDiag.map(d => {
          const refData = DEEP_DIAG_DATA?.[d.type];
          const title = refData?.tag || d.tag || d.title || d.type;
          const text = refData?.desc || d.desc || d.text || '';
          return `
          <div class="deep-diag-card">
            <div class="deep-diag-title">${title}</div>
            <div class="deep-diag-text">${text}</div>
          </div>`;
        }).join('')}
      </div>
      ` : ''}
    </div>

    ${result.consistency && result.consistency.checked ? `
    <div class="report-section">
      <div class="report-section-title">🔄 一致性校验</div>
      <div class="deep-diag-card">
        <div class="deep-diag-title">${result.consistency.stable ? '✅ 前后一致' : '⚠️ 前后有变化'}</div>
        <div class="deep-diag-text">${result.consistency.stable
          ? '你在不同情境下的反应模式基本一致——说明你的判断是稳定的，不是随情境摇摆的。'
          : '你在面对相似情境时给出了不同的回答——这不一定是坏事。可能是在答题过程中有了新的觉察，也可能说明你在不同情境下确实有不同的应对模式。值得想一想：哪个更接近真实的你？'}</div>
      </div>
    </div>
    ` : ''}

    <div class="report-section">
      <div class="report-section-title">🏃 48小时第一步</div>
      <div class="first-step-card">
        <div class="first-step-text">${p.firstStep}</div>
      </div>
    </div>

    <button class="btn-primary" id="btn-share">分享海报</button>
    <button class="btn-secondary" id="btn-coach">开始训练</button>
    <button class="btn-text" id="btn-home">返回首页</button>

    <div class="divider"></div>

    <div class="feedback-section">
      <div class="report-section-title" style="text-align:center;">📣 您的反馈很重要</div>
      <div style="font-size:12px;color:var(--text-tertiary);text-align:center;margin-bottom:12px;">数据仅存本地，Demo阶段不上传</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">画像准确度</div>
      <div class="feedback-stars" data-dim="accuracy"></div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">报告启发性</div>
      <div class="feedback-stars" data-dim="insight"></div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">推荐意愿</div>
      <div class="feedback-stars" data-dim="recommend"></div>
      <textarea class="feedback-textarea" placeholder="想说点什么...（选填）" maxlength="200"></textarea>
      <button class="feedback-submit" id="feedbackBtn" disabled>请先完成评分</button>
    </div>
  `;

  // 绘制雷达图
  drawRadar('radarCanvas', result.threeAxes);

  // 绑定按钮事件
  document.getElementById('btn-share').addEventListener('click', () => options.onShare && options.onShare());
  document.getElementById('btn-coach').addEventListener('click', () => options.onCoach && options.onCoach());
  document.getElementById('btn-home').addEventListener('click', () => options.onHome && options.onHome());

  // 绑定星星评分
  bindStarRating();
}

/**
 * 绘制三轴雷达图
 * @param {string} canvasId
 * @param {Object} scores - { jianCha, chengXing, mingDing }
 */
export function drawRadar(canvasId, scores) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2 - 10;
  const r = 80;
  const axes = [
    { label: '看清世界', key: 'jianCha', angle: -Math.PI / 2 },
    { label: '找到路径', key: 'chengXing', angle: Math.PI / 6 },
    { label: '了解自己', key: 'mingDing', angle: Math.PI * 5 / 6 }
  ];

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#E0D6C8';
  ctx.lineWidth = 1;

  // 绘制网格（3层）
  for (let level = 1; level <= 3; level++) {
    ctx.beginPath();
    const lr = r * level / 3;
    for (let i = 0; i < 3; i++) {
      const a = axes[i].angle;
      const x = cx + lr * Math.cos(a);
      const y = cy + lr * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 绘制轴线和标签
  for (const ax of axes) {
    const x = cx + r * Math.cos(ax.angle);
    const y = cy + r * Math.sin(ax.angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#E0D6C8';
    ctx.stroke();
    // 标签
    ctx.fillStyle = '#5A5A5A';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    const lx = cx + (r + 18) * Math.cos(ax.angle);
    const ly = cy + (r + 18) * Math.sin(ax.angle);
    ctx.fillText(ax.label, lx, ly + 4);
  }

  // 绘制数据区域
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const ax = axes[i];
    const val = scores[ax.key] || 0;
    const vr = r * val / 100;
    const x = cx + vr * Math.cos(ax.angle);
    const y = cy + vr * Math.sin(ax.angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(194,120,59,0.2)';
  ctx.fill();
  ctx.strokeStyle = '#C2783B';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 绘制数据点
  for (const ax of axes) {
    const val = scores[ax.key] || 0;
    const vr = r * val / 100;
    const x = cx + vr * Math.cos(ax.angle);
    const y = cy + vr * Math.sin(ax.angle);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#C2783B';
    ctx.fill();
  }
}

/**
 * 渲染分享海报页
 * @param {HTMLElement} container
 * @param {Object} result
 * @param {Object} dataMap
 * @param {Object} options - { onHome }
 */
export function renderSharePage(container, result, dataMap, options = {}) {
  const { PORTRAIT_DATA, PORTRAIT_ONE_LINER } = dataMap;
  const p = PORTRAIT_DATA[result.portrait];
  const oneLiner = PORTRAIT_ONE_LINER[result.portrait];

  container.className = 'page-share fade-in';
  container.innerHTML = `
    <div class="share-poster">
      <div class="share-poster-header">
        <div class="logo-text">见澄明</div>
      </div>
      <canvas id="shareRadar" class="share-poster-radar" width="200" height="180"></canvas>
      <div class="share-poster-name">${p.name}</div>
      <div class="share-poster-quote">${oneLiner}</div>
      <div class="share-poster-footer">
        <div class="qr-placeholder">二维码</div>
        <div class="scan-text">扫码测测你的澄明力</div>
      </div>
    </div>
    <button class="btn-primary" id="btn-share-home">返回首页</button>
  `;

  setTimeout(() => drawRadar('shareRadar', result.threeAxes), 100);

  document.getElementById('btn-share-home').addEventListener('click', () => {
    options.onHome && options.onHome();
  });
}

// ==================== 内部辅助函数 ====================

/**
 * 渲染三轴得分条组件
 */
/**
 * 渲染遮蔽五维雷达图（Canvas）
 * 五遮蔽：懒/怕/利/锁/盲
 * 基于三轴+五指数反推各遮蔽倾向值（0-100，越高越容易被该遮蔽）
 */
function renderShadowRadar(result) {
  const { threeAxes, fiveIndices } = result;
  const { jianCha, chengXing, mingDing } = threeAxes;

  // 倾向值算法：轴越低→对应遮蔽倾向越高
  // 懒（行动力不足）: chengXing低 → 高懒倾向
  const lazy = Math.max(0, Math.min(100, 100 - chengXing * 1.1));
  // 怕（不敢动）: mingDing低 + aiRisk高 → 高怕倾向
  const fear = Math.max(0, Math.min(100, (100 - mingDing * 0.8) * 0.6 + fiveIndices.aiRisk * 0.4));
  // 利（算计过度）: aiUtilization高 + beatenBySociety高 → 高利倾向
  const profit = Math.max(0, Math.min(100, fiveIndices.aiUtilization * 0.5 + fiveIndices.beatenBySociety * 0.5));
  // 锁（信息茧房）: jianCha低 → 高锁倾向
  const lock = Math.max(0, Math.min(100, 100 - jianCha * 1.1));
  // 盲（不自知）: mingDing低 + 三轴都低 → 高盲倾向
  const blind = Math.max(0, Math.min(100, (100 - mingDing * 0.7) * 0.6 + (100 - (jianCha + chengXing + mingDing) / 3) * 0.4));

  const dims = [
    { key: 'lazy', label: '懒', score: Math.round(lazy) },
    { key: 'fear', label: '怕', score: Math.round(fear) },
    { key: 'profit', label: '利', score: Math.round(profit) },
    { key: 'lock', label: '锁', score: Math.round(lock) },
    { key: 'blind', label: '盲', score: Math.round(blind) }
  ];

  const canvasId = 'shadowRadarCanvas';
  const html = `
    <div class="shadow-radar-wrap">
      <canvas id="${canvasId}" width="260" height="260" style="display:block;margin:0 auto;"></canvas>
      <div class="shadow-radar-legend">
        ${dims.map(d => {
          const level = d.score >= 60 ? '高风险' : (d.score >= 35 ? '中等' : '低');
          const levelColor = d.score >= 60 ? '#FF4D2E' : (d.score >= 35 ? '#E8923A' : '#7CB342');
          const isMain = result.shadow.mainShadow === d.key;
          return `<div class="shadow-legend-item ${isMain ? 'is-main' : ''}">
            <span class="shadow-legend-dot" style="background:${levelColor}"></span>
            <span class="shadow-legend-label">${d.label}</span>
            <span class="shadow-legend-score" style="color:${levelColor}">${d.score}</span>
            <span class="shadow-legend-level" style="color:${levelColor}">${isMain ? '← 主遮蔽' : level}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;

  // 延迟绘制雷达图（等DOM渲染完）
  requestAnimationFrame(() => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(cx, cy) - 30;
    const n = dims.length;
    const step = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, w, h);

    // 画背景网格（3层）
    for (let ring = 1; ring <= 3; ring++) {
      const rr = r * ring / 3;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = -Math.PI / 2 + step * (i % n);
        const x = cx + Math.cos(angle) * rr;
        const y = cy + Math.sin(angle) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = ring === 3 ? '#D0C4B0' : '#E8DDD0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 画轴线
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + step * i;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.strokeStyle = '#E8DDD0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 画数据区域
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const d = dims[i % n];
      const angle = -Math.PI / 2 + step * (i % n);
      const val = Math.max(0.02, d.score / 100);
      const x = cx + Math.cos(angle) * r * val;
      const y = cy + Math.sin(angle) * r * val;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 77, 46, 0.18)';
    ctx.fill();
    ctx.strokeStyle = '#FF4D2E';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 画数据点
    for (let i = 0; i < n; i++) {
      const d = dims[i];
      const angle = -Math.PI / 2 + step * i;
      const val = Math.max(0.02, d.score / 100);
      const x = cx + Math.cos(angle) * r * val;
      const y = cy + Math.sin(angle) * r * val;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = result.shadow.mainShadow === d.key ? '#FF4D2E' : '#FF9500';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 标签
      const lx = cx + Math.cos(angle) * (r + 18);
      const ly = cy + Math.sin(angle) * (r + 18);
      ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = result.shadow.mainShadow === d.key ? '#FF4D2E' : '#8B7355';
      ctx.fillText(d.label, lx, ly);
    }
  });

  return html;
}

function renderAxisScoreBars(threeAxes, AXIS_DATA) {
  const axes = [
    { key: 'jianCha', emoji: '🌍' },
    { key: 'mingDing', emoji: '❤️' },
    { key: 'chengXing', emoji: '🎯' }
  ];
  return `<div class="axis-score-bars">${axes.map(({ key, emoji }) => {
    const data = AXIS_DATA[key];
    const score = threeAxes[key];
    let text = '';
    for (const level of data.levels) {
      if (score <= level.max) { text = level.text; break; }
    }
    // 分数颜色：>=70 橙红，40-69 暖黄，<40 灰棕
    const scoreColor = score >= 70 ? '#FF4D2E' : (score >= 40 ? '#E8923A' : '#A08060');
    return `
      <div class="axis-bar-card">
        <div class="axis-bar-top">
          <div class="axis-bar-info">
            <span class="axis-bar-emoji">${emoji}</span>
            <div class="axis-bar-label">
              <span class="axis-bar-name">${data.name}</span>
              <span class="axis-bar-sub">${data.subtitle}</span>
            </div>
          </div>
          <div class="axis-bar-score" style="color:${scoreColor}">${score}<span class="axis-bar-unit">分</span></div>
        </div>
        ${renderAxisBarBlocks(score)}
        <div class="axis-bar-text">${text}</div>
      </div>`;
  }).join('')}</div>`;
}

/**
 * 三轴分段式进度条（20个小圆角方块）
 * 颜色从暖黄渐变到橙红，已填充块有微渐变
 */
function renderAxisBarBlocks(score) {
  const total = 10;
  const filled = Math.round(score / 10);
  let html = '<div class="axis-bar-blocks">';
  for (let i = 0; i < total; i++) {
    const isActive = i < filled;
    const t = i / (total - 1);
    if (isActive) {
      // 暖黄 #FFB347 → 橙红 #FF4D2E
      const r = Math.round(255);
      const g = Math.round(179 - t * 98);
      const b = Math.round(71 - t * 25);
      html += `<div class="axis-block active" style="background:rgb(${r},${g},${b})"></div>`;
    } else {
      html += '<div class="axis-block"></div>';
    }
  }
  html += '</div>';
  return html;
}

/**
 * 渲染分段式进度条（10个小方块）
 * 每个点亮块根据位置从暖黄渐变到红
 */
function renderSegmentedBar(score) {
  const total = 10;
  const filled = Math.round(score / 10);
  // 暖黄 #FFB347 (255,179,71) → 红 #E8513E (232,81,62)
  const start = [255, 179, 71];
  const end = [232, 81, 62];
  let html = '<div class="seg-bar">';
  for (let i = 0; i < total; i++) {
    const isActive = i < filled;
    let style = '';
    if (isActive) {
      const t = i / (total - 1);
      const r = Math.round(start[0] + (end[0] - start[0]) * t);
      const g = Math.round(start[1] + (end[1] - start[1]) * t);
      const b = Math.round(start[2] + (end[2] - start[2]) * t);
      style = `style="background:rgb(${r},${g},${b})"`;
    }
    html += `<div class="seg-block${isActive ? ' active' : ''}" ${style}></div>`;
  }
  html += '</div>';
  return html;
}

function getAxisName(portrait, type) {
  const map = {
    'AAA': { light: '三轴俱通', mountain: '别让飞轮空转' },
    'AAB': { light: '看清世界 + 了解自己', mountain: '找到路径' },
    'ABA': { light: '看清世界 + 找到路径', mountain: '了解自己' },
    'ABB': { light: '看清世界', mountain: '了解自己 + 找到路径' },
    'BAA': { light: '了解自己 + 找到路径', mountain: '看清世界' },
    'BAB': { light: '了解自己', mountain: '看清世界 + 找到路径' },
    'BBA': { light: '能行动', mountain: '看清世界 + 了解自己' },
    'BBB': { light: '起点', mountain: '从问"外面发生了什么"开始' }
  };
  return map[portrait]?.[type] || '';
}

function getIndexText(INDEX_DATA, indexKey, score) {
  const data = INDEX_DATA[indexKey];
  if (!data) return { label: '', text: '' };
  for (const level of data.levels) {
    if (score <= level.max) return { label: level.label, text: level.text };
  }
  return data.levels[data.levels.length - 1];
}

/**
 * 获取"你与世界"/"你与AI"的解读文本
 */
function getPositionText(posGroup, useScore, riskScore) {
  if (!posGroup) return '';
  const threshold = 50;
  const highUse = useScore >= threshold;
  const highRisk = riskScore >= threshold;
  const modes = posGroup.modes || posGroup;
  if (highUse && !highRisk) return modes.highLow || '';
  if (highUse && highRisk) return modes.highHigh || '';
  if (!highUse && !highRisk) return modes.lowLow || '';
  return modes.lowHigh || '';
}

/**
 * 获取"你与选择"的解读文本
 * 基于三轴综合判断：约束映射(jianCha高) / 遮蔽剥离(chengXing高) / 最小启动(mingDing高)
 */
function getChoicePositionText(choiceGroup, result) {
  const { threeAxes } = result;
  const highMap = threeAxes.jianCha >= 50;
  const highStrip = threeAxes.chengXing >= 50;
  const highStart = threeAxes.mingDing >= 50;

  // v5.0: POSITION_DATA.choice 使用 modes 嵌套结构
  const modes = choiceGroup.modes || choiceGroup;
  if (highMap && highStrip && highStart) return modes.highHigh || modes.bothHigh || '';
  if (!highMap && !highStrip && !highStart) return modes.lowLow || modes.bothLow || '';
  if (highMap && !highStart) return modes.highLow || '';
  if (highStrip && !highStart) return modes.highLow || '';
  if (!highMap && highStart) return modes.lowHigh || '';
  if (!highStrip && highStart) return modes.lowHigh || '';
  return (highMap || highStrip) && highStart ? (modes.highHigh || '') : (modes.lowLow || '');
}

function getBarClass(score, isRisk = false) {
  if (isRisk) {
    if (score <= 33) return 'risk-low';
    if (score <= 66) return 'risk-mid';
    return 'risk-high';
  }
  if (score <= 25) return 'score-warm';
  if (score <= 50) return 'score-amber';
  if (score <= 75) return 'score-terracotta';
  return 'score-red';
}

function bindStarRating() {
  const ratings = { accuracy: 0, insight: 0, recommend: 0 };
  document.querySelectorAll('.feedback-stars').forEach(container => {
    const dim = container.dataset.dim;
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.className = 'feedback-star';
      star.textContent = '★';
      star.addEventListener('click', () => {
        ratings[dim] = i;
        Array.from(container.children).forEach((s, idx) => {
          s.classList.toggle('active', idx < i);
        });
        checkFeedbackReady(ratings);
      });
      container.appendChild(star);
    }
  });

  const btn = document.getElementById('feedbackBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      btn.textContent = '感谢反馈';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = '已提交'; }, 2000);
    });
  }
}

function checkFeedbackReady(ratings) {
  const ready = ratings.accuracy > 0 && ratings.insight > 0 && ratings.recommend > 0;
  const btn = document.getElementById('feedbackBtn');
  if (btn) {
    btn.disabled = !ready;
    btn.textContent = ready ? '提交反馈' : '请先完成评分';
  }
}
