// ============================================
// 掌勺 AI - 离线 Demo 展示逻辑
// 说明：Demo 端不调用 AI、不执行 skill，只展示 assets/js/data.js 注入的离线 AI 成果。
// ============================================

let currentDish = null;
let currentStepIndex = 0;
let checkedCheckpoints = {};
let dishes = window.DEMO_DISHES || {};

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  window.scrollTo(0, 0);
}

function goHome() {
  currentDish = null;
  currentStepIndex = 0;
  checkedCheckpoints = {};
  showPage('page-home');
}

function safeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(x => safeText(x)).join('；');
  if (typeof value === 'object') {
    if (value.text) return value.text;
    if (value.item && value.standard) return `${value.item}：${value.standard}`;
    if (value.name && value.amount) return `${value.name} ${value.amount}`;
    if (value.good_sign) return value.good_sign;
    return JSON.stringify(value);
  }
  return String(value);
}

function selectDish(dishId) {
  if (!dishes[dishId]) {
    console.error('[App] 菜品不存在:', dishId);
    return;
  }
  currentDish = dishes[dishId];
  currentStepIndex = 0;
  checkedCheckpoints = {};
  updateCookingHeader();
  renderStep();
  updateStepIndicator();
  showPage('page-cooking');
}

function updateCookingHeader() {
  if (!currentDish) return;
  document.getElementById('cooking-dish-name').textContent = currentDish.name;
  document.getElementById('current-step').textContent = currentStepIndex + 1;
  document.getElementById('total-steps').textContent = currentDish.steps.length;
}

function renderVisual(v, emoji) {
  if (!v) return '';
  const typeLabel = {
    ingredient_prep: '📦 材料准备图',
    step_illustration: '🔍 关键步骤图',
    key_checkpoint: '✅ 检查点参考图',
    checkpoint_reference: '✅ 检查点参考图',
    mistake_reference: '🧯 翻车参照图',
    final_dish: '🍽️ 成品图'
  };
  const mustShow = v.mustShow || v.must_show || [];
  return `
    <div class="visual-section">
      <div class="visual-header">
        <span class="visual-type-badge">${typeLabel[v.type] || '📷 参照图'}</span>
        <span class="visual-skill-tag">🤖 05_visualize 离线生成</span>
      </div>
      <div class="visual-image-wrapper">
        <img src="${v.src}" alt="${v.description || ''}" class="visual-image"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
             loading="lazy">
        <div class="visual-image-placeholder" style="display: none;">
          <div class="placeholder-icon">${emoji}</div>
          <div class="placeholder-text">本地图未加载，可按 prompt 重新生图</div>
        </div>
      </div>
      <div class="visual-purpose-box">
        <div class="visual-purpose-label"><span class="purpose-icon">💡</span><span>这张图帮你判断：</span></div>
        <div class="visual-purpose-text">${v.purpose || v.teaching_goal || ''}</div>
      </div>
      <div class="visual-description">
        <div class="visual-description-label">📋 状态描述：</div>
        <div class="visual-description-text">${v.description || ''}</div>
      </div>
      ${mustShow.length ? `
        <div class="visual-must-show">
          <span class="visual-colors-label">重点看：</span>
          ${mustShow.map(x => `<span class="color-tag">${safeText(x)}</span>`).join('')}
        </div>` : ''}
      ${v.colors ? `
        <div class="visual-colors">
          <span class="visual-colors-label">颜色特征：</span>
          ${v.colors.map(c => `<span class="color-tag">${c}</span>`).join('')}
        </div>` : ''}
    </div>
  `;
}

function renderStep() {
  if (!currentDish) return;
  const step = currentDish.steps[currentStepIndex];
  if (!step) return;

  const container = document.getElementById('step-container');
  let html = `
    <div class="step-card">
      <div class="step-header">
        <div class="step-number">${step.icon || '📋'}</div>
        <h2 class="step-title">${step.title}</h2>
        <p class="step-icon-text">Step ${currentStepIndex + 1} / ${currentDish.steps.length}</p>
      </div>
      <div class="skill-source">
        <span>离线 AI 成果</span>
        <strong>${currentDish.generation?.source || '五大技能协同输出'}</strong>
      </div>
  `;

  html += renderVisual(step.visual, currentDish.emoji);

  const stepKey = `${currentDish.id}-step-${step.id}`;
  if (step.checkpoints && step.checkpoints.length > 0) {
    if (!checkedCheckpoints[stepKey]) {
      checkedCheckpoints[stepKey] = new Array(step.checkpoints.length).fill(false);
    }
    html += `
      <div class="step-body">
        <div class="step-section">
          <div class="step-section-title">
            <span class="step-section-icon">✅</span>
            <span>检查点</span>
            <span class="check-hint">（看图对照，做到了就勾选）</span>
          </div>
          <ul class="checkpoint-list">
            ${step.checkpoints.map((cp, i) => `
              <li class="checkpoint-item ${checkedCheckpoints[stepKey][i] ? 'checked' : ''}" onclick="toggleCheckpoint(${step.id}, ${i})">
                <span class="checkpoint-checkbox"></span>
                <span class="checkpoint-text">${safeText(cp)}</span>
              </li>`).join('')}
          </ul>
        </div>`;
  } else {
    html += `<div class="step-body">`;
  }

  if (step.safety_tip) {
    document.getElementById('safety-text').textContent = step.safety_tip;
    document.getElementById('safety-banner').style.display = 'flex';
    html += `
      <div class="step-section">
        <div class="step-section-title"><span class="step-section-icon">⚠️</span><span>安全提醒</span></div>
        <div class="tip-box safety-tip"><span class="tip-icon">💡</span><span class="tip-text">${step.safety_tip}</span></div>
      </div>`;
  } else if (currentDish.safety?.warnings?.length) {
    document.getElementById('safety-text').textContent = currentDish.safety.warnings[0];
    document.getElementById('safety-banner').style.display = 'flex';
  } else {
    document.getElementById('safety-banner').style.display = 'none';
  }

  if (step.actions && step.actions.length > 0) {
    html += `
      <div class="step-section">
        <div class="step-section-title"><span class="step-section-icon">👨‍🍳</span><span>动作</span></div>
        <ol class="action-list">${step.actions.map(action => `<li class="action-item">${safeText(action)}</li>`).join('')}</ol>
      </div>`;
  }

  if (step.ingredients && step.ingredients.length > 0) {
    html += `
      <div class="step-section">
        <div class="step-section-title"><span class="step-section-icon">🥣</span><span>用量</span></div>
        <ul class="ingredient-list">
          ${step.ingredients.map(ing => `
            <li class="ingredient-item">
              <span class="ingredient-name">${ing.name || safeText(ing)}</span>
              <span class="ingredient-amount">${ing.amount || ''}</span>
            </li>`).join('')}
        </ul>
      </div>`;
  }

  if (step.fire || step.time) {
    html += `
      <div class="step-section">
        <div class="step-section-title"><span class="step-section-icon">🔥</span><span>火候 / 时间</span></div>
        <div class="fire-card">
          ${step.fire ? `<div class="fire-row"><span class="fire-label">火力</span><span class="fire-value">${step.fire}</span></div>` : ''}
          ${step.time ? `<div class="fire-row"><span class="fire-label">时间</span><span class="fire-value">${step.time}</span></div>` : ''}
        </div>
      </div>`;
  }

  if (step.mistakes && step.mistakes.length > 0) {
    html += `
      <div class="step-section">
        <div class="step-section-title"><span class="step-section-icon">🧯</span><span>常见问题</span></div>
        <ul class="mistake-list">
          ${step.mistakes.map(m => `
            <li class="mistake-item">
              <span class="mistake-icon">❌</span>
              <span class="mistake-text"><strong>${m.problem}</strong>：${m.solution}</span>
            </li>`).join('')}
        </ul>
      </div>`;
  }

  if (step.tips) {
    html += `
      <div class="step-section">
        <div class="step-section-title"><span class="step-section-icon">💡</span><span>小贴士</span></div>
        <div class="tip-box"><span class="tip-icon">✨</span><span class="tip-text">${step.tips}</span></div>
      </div>`;
  }

  html += `</div></div>`;
  container.innerHTML = html;
  updateCookingHeader();
}

function toggleCheckpoint(stepId, index) {
  const key = `${currentDish.id}-step-${stepId}`;
  if (!checkedCheckpoints[key]) checkedCheckpoints[key] = [];
  checkedCheckpoints[key][index] = !checkedCheckpoints[key][index];
  renderStep();
}

function nextStep() {
  if (!currentDish) return;
  if (currentStepIndex < currentDish.steps.length - 1) {
    currentStepIndex++;
    renderStep();
    updateStepIndicator();
    window.scrollTo(0, 0);
  } else {
    showComplete();
  }
}

function prevStep() {
  if (!currentDish) return;
  if (currentStepIndex > 0) {
    currentStepIndex--;
    renderStep();
    updateStepIndicator();
    window.scrollTo(0, 0);
  }
}

function updateStepIndicator() {
  if (!currentDish) return;
  const container = document.getElementById('step-indicator');
  let html = '';
  for (let i = 0; i < currentDish.steps.length; i++) {
    let className = 'step-dot';
    if (i === currentStepIndex) className += ' active';
    else if (i < currentStepIndex) className += ' completed';
    html += `<div class="${className}"></div>`;
  }
  container.innerHTML = html;
}

function showRemedy() {
  if (!currentDish) return;
  const step = currentDish.steps[currentStepIndex];
  const content = document.getElementById('remedy-content');
  if (!step || !step.mistakes || step.mistakes.length === 0) {
    content.innerHTML = `<div class="remedy-encouragement">这一步暂时没有常见问题，你做得很棒！</div>`;
  } else {
    let html = '';
    if (currentDish.mistakeVisual) {
      html += renderVisual(currentDish.mistakeVisual, currentDish.emoji);
    }
    step.mistakes.forEach(m => {
      html += `
        <div class="remedy-item">
          <div class="remedy-problem">❌ ${m.problem}</div>
          <div class="remedy-solution">${m.solution}</div>
        </div>`;
    });
    html += `<div class="remedy-encouragement">💪 别担心，先止损，再按补救动作处理。</div>`;
    content.innerHTML = html;
  }
  document.getElementById('remedy-modal').classList.add('active');
}

function closeRemedy() {
  document.getElementById('remedy-modal').classList.remove('active');
}

document.addEventListener('click', function(e) {
  const modal = document.getElementById('remedy-modal');
  if (e.target === modal) closeRemedy();
});

function showComplete() {
  if (!currentDish) return;
  document.getElementById('complete-dish-name').textContent = currentDish.name;

  const completeImageEl = document.getElementById('complete-image');
  if (completeImageEl && currentDish.coverVisual) {
    completeImageEl.src = currentDish.coverVisual.src;
    completeImageEl.style.display = 'block';
    const purposeEl = document.getElementById('complete-purpose');
    if (purposeEl) purposeEl.textContent = currentDish.coverVisual.purpose;
  }

  const lastStep = currentDish.steps[currentDish.steps.length - 1];
  const featuresEl = document.getElementById('complete-features');
  if (lastStep?.checkpoints) {
    featuresEl.innerHTML = lastStep.checkpoints.map(cp => `<li>${safeText(cp)}</li>`).join('');
  }

  const platingEl = document.getElementById('complete-plating');
  platingEl.textContent = lastStep?.visual?.plating || '趁热享用，搭配米饭更佳！';

  const tipsEl = document.getElementById('complete-tips');
  let tips = [];
  if (currentDish.safety?.warnings) tips = tips.concat(currentDish.safety.warnings);
  if (lastStep?.final_tip) tips.push(lastStep.final_tip);
  tipsEl.innerHTML = tips.map(tip => `<li>${tip}</li>`).join('');

  showPage('page-complete');
}

function renderDishCards() {
  document.querySelectorAll('.dish-card').forEach(card => {
    const dishId = card.getAttribute('data-dish');
    const dish = dishes[dishId];
    if (!dish) return;

    const imageDiv = card.querySelector('.dish-card-image');
    if (imageDiv && dish.coverVisual) {
      imageDiv.innerHTML = `
        <img src="${dish.coverVisual.src}" alt="${dish.name}" class="dish-cover-image"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
             loading="lazy">
        <div class="dish-cover-placeholder" style="display: none;">
          <span class="placeholder-emoji">${dish.emoji}</span>
        </div>`;
    }

    const title = card.querySelector('.dish-card-title');
    if (title) title.textContent = dish.name;

    const infoDiv = card.querySelector('.dish-card-info');
    if (infoDiv && !infoDiv.querySelector('.dish-card-purpose')) {
      const purposeDiv = document.createElement('div');
      purposeDiv.className = 'dish-card-purpose';
      purposeDiv.innerHTML = `<span class="purpose-hint">🤖 离线 AI 成果：${dish.generation?.source || '五大技能协同输出'}</span>`;
      infoDiv.appendChild(purposeDiv);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  renderDishCards();

  document.querySelectorAll('.dish-card').forEach(card => {
    card.addEventListener('click', function() {
      selectDish(this.getAttribute('data-dish'));
    });
  });

  document.addEventListener('keydown', function(e) {
    if (document.getElementById('page-cooking').classList.contains('active')) {
      if (e.key === 'ArrowRight') nextStep();
      else if (e.key === 'ArrowLeft') prevStep();
      else if (e.key === 'Escape') closeRemedy();
    }
  });
});
