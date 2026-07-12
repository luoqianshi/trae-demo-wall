(function () {
  let draft = PBY.getDraft();
  const titleInput = document.getElementById("decisionTitle");
  const sourceStrip = document.getElementById("sourceStrip");
  const sourceText = document.getElementById("sourceText");
  const optionList = document.getElementById("optionList");
  const effectPicker = document.getElementById("effectPicker");
  document.getElementById("tabbar").innerHTML = PBY.tabbar("create");

  function save() {
    PBY.saveDraft(draft);
  }

  function renderSource() {
    const visible = Boolean(draft.sourceLabel || draft.editingTemplateId);
    sourceStrip.classList.toggle("is-visible", visible);
    sourceText.textContent = draft.editingTemplateId ? "正在编辑我的模板" : draft.sourceLabel || "已带入模板";
  }

  function renderOptions() {
    optionList.innerHTML = draft.options.map((value, index) => {
      const removable = draft.options.length > 2;
      return `<div class="option-row">
        <input class="option-input" data-option-index="${index}" maxlength="24" value="${PBY.escapeHTML(value)}" placeholder="选项 ${index + 1}">
        <button class="icon-btn" type="button" data-action="remove-option" data-index="${index}" ${removable ? "" : "disabled"} aria-label="删除选项">−</button>
      </div>`;
    }).join("");
  }

  function renderEffects() {
    effectPicker.innerHTML = PBY.EFFECTS.map((effect) => `
      <button class="effect-option ${draft.effect === effect.id ? "is-selected" : ""}" type="button" data-action="set-effect" data-effect="${effect.id}">
        <span class="effect-name">${PBY.escapeHTML(effect.name)}</span>
        <span class="effect-desc">${PBY.escapeHTML(effect.desc)}</span>
      </button>
    `).join("");
  }

  function render() {
    titleInput.value = draft.title;
    renderSource();
    renderOptions();
    renderEffects();
  }

  function validateDraft() {
    const options = PBY.effectiveOptions(draft.options);
    if (options.length < 2) {
      PBY.showToast("至少给鸭鸭两个选择哦");
      return null;
    }
    return {
      title: draft.title.trim() || "今天拍什么",
      options,
      effect: draft.effect || "none",
      sourceType: draft.sourceType || "custom",
      returnUrl: "create.html"
    };
  }

  function saveCurrentTemplate() {
    const decision = validateDraft();
    if (!decision) return;
    const id = draft.editingTemplateId || `mine_${Date.now()}`;
    const nextTemplate = {
      id,
      title: decision.title,
      desc: `${decision.options.length} 个选项`,
      options: decision.options,
      effect: decision.effect,
      updatedAt: PBY.nowTimeText()
    };
    const templates = PBY.getSavedTemplates();
    const index = templates.findIndex((item) => item.id === id);
    if (index >= 0) {
      templates.splice(index, 1, nextTemplate);
    } else {
      templates.unshift(nextTemplate);
    }
    PBY.saveSavedTemplates(templates);
    draft.editingTemplateId = id;
    draft.sourceLabel = "来自我的模板";
    save();
    render();
    PBY.showToast("已保存到我的模板");
  }

  function startDecision() {
    const decision = validateDraft();
    if (!decision) return;
    PBY.setActiveDecision(decision);
    location.href = "play.html";
  }

  titleInput.addEventListener("input", () => {
    draft.title = titleInput.value;
    save();
  });

  optionList.addEventListener("input", (event) => {
    const input = event.target.closest("[data-option-index]");
    if (!input) return;
    draft.options[Number(input.dataset.optionIndex)] = input.value;
    save();
  });

  document.body.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "remove-option") {
      if (draft.options.length <= 2) {
        PBY.showToast("至少保留两个选项哦");
        return;
      }
      draft.options.splice(Number(target.dataset.index), 1);
      save();
      renderOptions();
    }
    if (action === "set-effect") {
      draft.effect = target.dataset.effect;
      save();
      renderEffects();
    }
  });

  document.getElementById("addOptionBtn").addEventListener("click", () => {
    if (draft.options.length >= 12) {
      PBY.showToast("V1 最多先放 12 个选项");
      return;
    }
    draft.options.push("");
    save();
    renderOptions();
    const inputs = optionList.querySelectorAll(".option-input");
    inputs[inputs.length - 1].focus();
  });

  document.getElementById("saveTemplateBtn").addEventListener("click", saveCurrentTemplate);
  document.getElementById("startDecisionBtn").addEventListener("click", startDecision);
  document.getElementById("resetDraftBtn").addEventListener("click", () => {
    draft = PBY.setBlankDraft();
    render();
  });
  document.getElementById("detachTemplateBtn").addEventListener("click", () => {
    draft = PBY.setBlankDraft();
    render();
  });

  render();
})();
