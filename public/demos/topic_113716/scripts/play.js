(function () {
  const decision = PBY.getActiveDecision();
  if (!decision || PBY.effectiveOptions(decision.options).length < 2) {
    PBY.showToast("先创建一个决策哦");
    window.setTimeout(() => { location.href = "create.html"; }, 600);
    return;
  }

  let result = PBY.pickRandom(decision.options);
  let recorded = false;
  let animating = false;
  const playTitle = document.getElementById("playTitle");
  const playMeta = document.getElementById("playMeta");
  const playContent = document.getElementById("playContent");

  playTitle.textContent = decision.title || "今天拍什么";
  playMeta.textContent = `${PBY.effectiveOptions(decision.options).length} 个选项 · ${PBY.getEffectName(decision.effect)}`;

  function recordResult() {
    if (recorded) return;
    const records = PBY.getRecords();
    records.unshift({
      id: `record_${Date.now()}`,
      title: decision.title,
      options: PBY.effectiveOptions(decision.options),
      effect: decision.effect,
      result: result.value,
      createdAt: PBY.nowTimeText()
    });
    PBY.saveRecords(records.slice(0, 50));
    recorded = true;
  }

  function actionHTML(waiting, wheelLabel) {
    if (waiting && decision.effect === "wheel") {
      return `<div class="play-actions">
        <button class="primary-btn" type="button" data-action="run-wheel">${PBY.escapeHTML(wheelLabel || "开转")}</button>
        <button class="secondary-btn" type="button" data-action="edit-current">返回修改</button>
        <button class="secondary-btn" type="button" data-action="close-play">先这样</button>
      </div>`;
    }
    if (waiting) {
      return `<div class="play-actions">
        <button class="secondary-btn" type="button" data-action="edit-current">返回修改</button>
        <button class="secondary-btn" type="button" data-action="close-play">先这样</button>
      </div>`;
    }
    return `<div class="play-actions">
      <button class="primary-btn" type="button" data-action="again">再来一次</button>
      <button class="secondary-btn" type="button" data-action="edit-current">返回修改</button>
      <button class="secondary-btn" type="button" data-action="close-play">先这样</button>
    </div>`;
  }

  function renderNone() {
    recordResult();
    playContent.innerHTML = `<div class="none-result">
      <div class="result-bubble">
        <img src="assets/duck-mascot.png" alt="拍板鸭">
        <p class="result-kicker">拍板啦，今天就选它</p>
        <p class="result-text">${PBY.escapeHTML(result.value)}</p>
        <p class="result-sub">每个有效选项机会一致，这次鸭鸭没有偏心。</p>
      </div>
    </div>${actionHTML(false)}`;
  }

  function renderFlip() {
    const cards = PBY.effectiveOptions(decision.options).map((option, index) => `
      <button class="flip-card" type="button" data-action="reveal-card" data-index="${index}">
        <span class="flip-inner">
          <span class="flip-face flip-back">拍一下</span>
          <span class="flip-face flip-front">${PBY.escapeHTML(result.value)}</span>
        </span>
      </button>
    `).join("");
    playContent.innerHTML = `<div class="flip-area">${cards}</div>
      <div class="empty-state" id="flipHint">轻轻点一张，结果已经公平藏好。</div>
      ${actionHTML(true)}`;
  }

  function wheelGradient(count) {
    const colors = ["#ffd66b", "#f6a6a6", "#8bc89a", "#ffbd7a", "#f7d8a9", "#ffeaa9", "#a9d4b3", "#f9b9a4", "#e9cf8f", "#ffd1dc", "#bfe3cf", "#f5c27f"];
    const step = 360 / count;
    return Array.from({ length: count }).map((_, index) => {
      const start = (index * step).toFixed(2);
      const end = ((index + 1) * step).toFixed(2);
      return `${colors[index % colors.length]} ${start}deg ${end}deg`;
    }).join(", ");
  }

  function renderWheel() {
    const options = PBY.effectiveOptions(decision.options);
    const labels = options.map((option, index) => {
      const angle = (360 / options.length) * index + (360 / options.length) / 2;
      return `<span class="wheel-label" style="transform: rotate(${angle}deg) translateY(-116px) rotate(${90 - angle}deg);">${PBY.escapeHTML(option)}</span>`;
    }).join("");
    playContent.innerHTML = `<div class="wheel-wrap">
      <div class="wheel-pointer"></div>
      <div class="wheel" id="wheel" style="--wheel-gradient: ${wheelGradient(options.length)};">${labels}</div>
    </div>
    <div class="wheel-list">${options.map((item) => `<span>${PBY.escapeHTML(item)}</span>`).join("")}</div>
    ${actionHTML(true, "开转")}`;
  }

  function renderResultBubble() {
    playContent.insertAdjacentHTML("beforeend", `<div class="result-bubble" style="margin-top: 18px;">
      <p class="result-kicker">拍板啦，今天就选它</p>
      <p class="result-text">${PBY.escapeHTML(result.value)}</p>
    </div>`);
  }

  function runWheel() {
    if (animating || recorded) return;
    const wheel = document.getElementById("wheel");
    const options = PBY.effectiveOptions(decision.options);
    const step = 360 / options.length;
    const selectedCenter = result.index * step + step / 2;
    const finalRotation = 360 * 6 + (360 - selectedCenter);
    animating = true;
    const startButton = playContent.querySelector("[data-action='run-wheel']");
    if (startButton) startButton.disabled = true;
    requestAnimationFrame(() => {
      wheel.style.transform = `rotate(${finalRotation}deg)`;
    });
    window.setTimeout(() => {
      animating = false;
      recordResult();
      renderResultBubble();
      playContent.querySelector(".play-actions").remove();
      playContent.insertAdjacentHTML("beforeend", actionHTML(false));
    }, 3350);
  }

  function revealCard(card) {
    if (recorded) return;
    card.classList.add("is-revealed");
    recordResult();
    playContent.querySelectorAll(".flip-card").forEach((node) => {
      if (node !== card) node.disabled = true;
    });
    document.getElementById("flipHint").innerHTML = `拍板啦，今天就选 <b>${PBY.escapeHTML(result.value)}</b>`;
    playContent.querySelector(".play-actions").remove();
    playContent.insertAdjacentHTML("beforeend", actionHTML(false));
  }

  function restart() {
    result = PBY.pickRandom(decision.options);
    recorded = false;
    animating = false;
    render();
  }

  function editCurrent() {
    PBY.saveDraft({
      title: decision.title,
      options: PBY.effectiveOptions(decision.options),
      effect: decision.effect,
      sourceType: "play",
      sourceLabel: "来自上一次拍板",
      editingTemplateId: null
    });
    location.href = "create.html";
  }

  function closePlay() {
    if (animating) {
      PBY.showToast("拍板中，稍等一下");
      return;
    }
    location.href = decision.returnUrl || "index.html";
  }

  function render() {
    if (decision.effect === "flip") renderFlip();
    else if (decision.effect === "wheel") renderWheel();
    else renderNone();
  }

  document.body.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "run-wheel") runWheel();
    if (action === "reveal-card") revealCard(target);
    if (action === "again") restart();
    if (action === "edit-current") editCurrent();
    if (action === "close-play") closePlay();
  });

  document.getElementById("closePlayBtn").addEventListener("click", closePlay);
  render();
})();
