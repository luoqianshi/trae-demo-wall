/****************************
 * 见澄明H5 - 题型渲染器模块 (ES Module)
 * v5.0 适配：使用 value 字段做选项ID，支持 binary/quickBinary/socialDesirability/selfReflection 等新题型
 ****************************/

/**
 * 二选一题型渲染器（binary / quickBinary）
 * v5.0 结构：leftText/rightText + leftScores/rightScores，无 options 数组
 */
export function renderBinary(container, q, onSelect, selectedValue = null) {
  const leftText = q.leftText || (q.options && q.options[0] ? q.options[0].text : '');
  const rightText = q.rightText || (q.options && q.options[1] ? q.options[1].text : '');

  container.innerHTML = `
    <div class="question-split">
      <div class="split-question-text">${br(q.text || q.title)}</div>
      <div class="split-options">
        <div class="split-option ${selectedValue === 'left' ? 'selected' : ''}" data-opt="left">
          <div class="split-option-text">${br(leftText)}</div>
        </div>
        <div class="split-option ${selectedValue === 'right' ? 'selected' : ''}" data-opt="right">
          <div class="split-option-text">${br(rightText)}</div>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('.split-option').forEach(el => {
    el.addEventListener('click', () => {
      onSelect(q.id, el.dataset.opt);
    });
  });
}

/**
 * 左右分屏题型渲染器（兼容旧版 layout=split，内部调用 renderBinary）
 */
export function renderSplit(container, q, onSelect, selectedValue = null) {
  // v5.0 中 binary/quickBinary 优先走 leftText/rightText
  if (q.leftText || q.rightText) {
    renderBinary(container, q, onSelect, selectedValue);
    return;
  }
  // 旧兼容：options 数组形式
  if (q.options && q.options.length === 2) {
    const leftText = q.options[0].text;
    const rightText = q.options[1].text;
    const leftValue = q.options[0].value || q.options[0].id || 'left';
    const rightValue = q.options[1].value || q.options[1].id || 'right';

    container.innerHTML = `
      <div class="question-split">
        <div class="split-question-text">${br(q.text || q.title)}</div>
        <div class="split-options">
          <div class="split-option ${selectedValue === leftValue ? 'selected' : ''}" data-opt="${leftValue}">
            <div class="split-option-text">${br(leftText)}</div>
          </div>
          <div class="split-option ${selectedValue === rightValue ? 'selected' : ''}" data-opt="${rightValue}">
            <div class="split-option-text">${br(rightText)}</div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.split-option').forEach(el => {
      el.addEventListener('click', () => {
        onSelect(q.id, el.dataset.opt);
      });
    });
  } else {
    // 无有效选项时 fallback 到 renderBinary
    renderBinary(container, q, onSelect, selectedValue);
  }
}

/**
 * 情境卡题型渲染器（cards / situational / ifTomorrow / aiScenario / thirdMap / awarenessShift）
 * v5.0 使用 value 字段做选项标识
 */
export function renderCards(container, q, onSelect, selectedValue = null) {
  // v5.0 兼容：title 可能以 emoji 开头，也可能没有
  const displayTitle = q.text || q.title || '';
  const titleParts = displayTitle.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])\s+(.+)$/u);
  const emoji = q.sceneEmoji || (titleParts ? titleParts[1] : '');
  const titleText = q.sceneTitle || (titleParts ? titleParts[2] : displayTitle);

  // v5.0 兼容：sceneEmoji / sceneTitle / chatContext
  const subtitle = q.subtitle || '';
  const questionText = q.question || '';
  const chatContext = q.chatContext || null;

  const optionsHtml = q.options.map(opt => {
    const optValue = opt.value || opt.id || '';
    return `
      <div class="card-option ${selectedValue === optValue ? 'selected' : ''}" data-opt="${optValue}">
        <span class="emoji">${opt.emoji || ''}</span>
        <span class="text">${opt.text}</span>
      </div>
    `;
  }).join('');

  // 如果有 chatContext，渲染对话气泡背景
  const chatContextHtml = chatContext
    ? `<div class="chat-bubble-other" style="margin-bottom:12px;"><div class="chat-avatar"></div><div class="bubble">${br(chatContext)}</div></div>`
    : '';

  container.innerHTML = `
    <div class="question-cards fade-in">
      <div class="situational-card">
        <div class="situational-header">
          ${emoji ? `<span class="emoji">${emoji}</span>` : ''}
          <span class="title">${br(titleText)}</span>
        </div>
        ${chatContextHtml}
        ${subtitle ? `<div class="situational-desc">${br(subtitle)}</div>` : ''}
        ${questionText ? `<div class="situational-desc" style="font-weight:bold;margin-bottom:12px;">${br(questionText)}</div>` : ''}
        ${optionsHtml}
      </div>
    </div>
  `;

  container.querySelectorAll('.card-option').forEach(el => {
    el.addEventListener('click', () => {
      onSelect(q.id, el.dataset.opt);
    });
  });
}

/**
 * 聊天记录题型渲染器（chat）
 * v5.0 使用 chatContext 字段 + value 字段
 */
export function renderChat(container, q, onSelect, selectedValue = null) {
  // v5.0 兼容：使用 chatContext 或 chatMessage
  const chatMsg = q.chatContext || q.chatMessage || q.title || '';
  const questionText = q.question || '';

  const optionsHtml = q.options.map(opt => {
    const optValue = opt.value || opt.id || '';
    return `
      <div class="chat-bubble-me">
        <div class="bubble ${selectedValue === optValue ? 'selected' : ''}" data-opt="${optValue}">
          ${opt.text}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="question-chat fade-in">
      <div class="chat-bubble-other">
        <div class="chat-avatar"></div>
        <div class="bubble">${br(chatMsg)}</div>
      </div>
      ${questionText ? `<div class="chat-question-text">${br(questionText)}</div>` : ''}
      ${optionsHtml}
    </div>
  `;

  container.querySelectorAll('.bubble[data-opt]').forEach(el => {
    el.addEventListener('click', () => {
      onSelect(q.id, el.dataset.opt);
    });
  });
}

/**
 * 排序拼图题型渲染器（sort）
 * v5.0 使用 items 数组（value/emoji/text/dimension），而非 options
 */
export function renderSort(container, q, onConfirm, sortOrder, onSortChange) {
  // v5.0：优先使用 items 数组，兼容旧版 options
  const items = q.items || q.options || [];
  if (!sortOrder || sortOrder.length !== items.length) {
    sortOrder = items.map((_, i) => i);
  }

  let dragSrcIndex = null;
  let touchEl = null;

  function buildCardsHtml() {
    return sortOrder.map((optIdx, pos) => {
      const item = items[optIdx];
      const itemValue = item.value || item.id || optIdx;
      return `
        <div class="sort-card" data-value="${itemValue}" data-index="${optIdx}" data-pos="${pos}" draggable="true">
          <span class="handle">≡</span>
          <span class="emoji">${item.emoji || ''}</span>
          <span class="text">${item.text || ''}</span>
        </div>
      `;
    }).join('');
  }

  container.innerHTML = `
    <div class="question-sort fade-in">
      <div class="sort-question-text">${br(q.text || q.title)}</div>
      ${q.subtitle ? `<div class="sort-subtitle">${br(q.subtitle)}</div>` : ''}
      <div id="sort-list">${buildCardsHtml()}</div>
      <button class="sort-confirm" id="sort-confirm">确认排序</button>
    </div>
  `;

  function bindDragEvents() {
    const list = container.querySelector('#sort-list');
    if (!list) return;

    list.querySelectorAll('.sort-card').forEach((card, pos) => {
      card.addEventListener('dragstart', (e) => {
        dragSrcIndex = pos;
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        dragSrcIndex = null;
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const newPos = parseInt(card.dataset.pos);
        if (dragSrcIndex === null || dragSrcIndex === newPos) return;
        const item = sortOrder.splice(dragSrcIndex, 1)[0];
        sortOrder.splice(newPos, 0, item);
        dragSrcIndex = null;
        onSortChange([...sortOrder]);
        refreshSortList();
      });

      card.addEventListener('touchstart', (e) => {
        dragSrcIndex = pos;
        touchEl = card;
      }, { passive: true });
      card.addEventListener('touchmove', (e) => {
        e.preventDefault();
      }, { passive: false });
      card.addEventListener('touchend', (e) => {
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetCard = target?.closest('.sort-card');
        if (targetCard) {
          const newPos = parseInt(targetCard.dataset.pos);
          if (dragSrcIndex !== null && newPos !== dragSrcIndex) {
            const item = sortOrder.splice(dragSrcIndex, 1)[0];
            sortOrder.splice(newPos, 0, item);
            onSortChange([...sortOrder]);
            refreshSortList();
          }
        }
        dragSrcIndex = null;
        touchEl = null;
      });
    });
  }

  function refreshSortList() {
    const list = container.querySelector('#sort-list');
    if (list) {
      list.innerHTML = buildCardsHtml();
      bindDragEvents();
    }
  }

  bindDragEvents();

  container.querySelector('#sort-confirm').addEventListener('click', () => {
    const orderedValues = sortOrder.map(idx => {
      const item = items[idx];
      return item.value || item.id || idx;
    });
    onConfirm(q.id, orderedValues);
  });
}

/**
 * SE社会期望题渲染器（socialDesirability）
 * v5.0 结构：text 是 statement，两个按钮"符合"/"不符合"
 * value: "agree" / "disagree"
 */
export function renderSE(container, q, onSelect, selectedValue = null) {
  // v5.0：statement 在 meta.statement 或 text 字段
  const statement = (q.meta && q.meta.statement) || q.text || q.title || '';

  container.innerHTML = `
    <div class="question-se fade-in">
      <div class="se-statement">${br(statement)}</div>
      <div class="se-buttons">
        <button class="se-btn ${selectedValue === 'agree' ? 'selected' : ''}" data-opt="agree">符合</button>
        <button class="se-btn ${selectedValue === 'disagree' ? 'selected' : ''}" data-opt="disagree">不符合</button>
      </div>
    </div>
  `;

  container.querySelectorAll('.se-btn').forEach(el => {
    el.addEventListener('click', () => {
      onSelect(q.id, el.dataset.opt);
    });
  });
}

/**
 * 自我反思滑块题渲染器（selfReflection）
 * v5.0 结构：text 是引导文字，1-7 滑块
 * value: "1" ~ "7"
 */
export function renderSlider(container, q, onSelect, selectedValue = null) {
  const label = q.text || q.title || '';
  const leftLabel = q.leftLabel || '远远低于';
  const rightLabel = q.rightLabel || '远超一般';
  const val = selectedValue ? parseInt(selectedValue) : 4;

  container.innerHTML = `
    <div class="question-slider fade-in">
      <div class="slider-question-text">${br(label)}</div>
      <div class="slider-wrap">
        <div class="slider-labels">
          <span class="slider-left-label">${leftLabel}</span>
          <span class="slider-right-label">${rightLabel}</span>
        </div>
        <input type="range" class="slider-input" id="reflection-slider"
               min="1" max="7" value="${val}" step="1" />
        <div class="slider-value" id="slider-value-display">${val}</div>
      </div>
      <button class="btn-primary" id="slider-confirm" style="margin-top:20px;">确认</button>
    </div>
  `;

  const slider = container.querySelector('#reflection-slider');
  const valueDisplay = container.querySelector('#slider-value-display');

  if (slider && valueDisplay) {
    slider.addEventListener('input', () => {
      valueDisplay.textContent = slider.value;
    });
  }

  container.querySelector('#slider-confirm').addEventListener('click', () => {
    if (slider) {
      onSelect(q.id, slider.value);
    }
  });
}

// 辅助：换行符转 br
function br(text) {
  return (text || '').replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
}

/**
 * 启动题目限时计时器（已废弃，保留兼容）
 */
export function startQuestionTimer(qid, seconds, onTimeout) {
  return null;
}

/**
 * 清除计时器UI（已废弃，保留兼容）
 */
export function clearTimerUI() {
  const bar = document.getElementById('timer-bar');
  const text = document.getElementById('timer-text');
  if (bar) bar.style.width = '100%';
  if (text) text.textContent = '';
}
