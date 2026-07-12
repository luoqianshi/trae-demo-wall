(function () {
  const savedDecisionList = document.getElementById("savedDecisionList");
  const recordList = document.getElementById("recordList");
  const profileTemplateCount = document.getElementById("profileTemplateCount");
  const profileRecordCount = document.getElementById("profileRecordCount");
  document.getElementById("tabbar").innerHTML = PBY.tabbar("mine");

  function render() {
    const templates = PBY.getSavedTemplates();
    const records = PBY.getRecords();
    profileTemplateCount.textContent = `模板 ${templates.length}`;
    profileRecordCount.textContent = `记录 ${records.length}`;

    savedDecisionList.innerHTML = templates.length ? templates.map((template) => `
      <article class="saved-card">
        <h3 class="saved-card-title">${PBY.escapeHTML(template.title || "未命名决策")}</h3>
        <p class="saved-card-sub">${PBY.escapeHTML(template.options.slice(0, 5).join("、"))}${template.options.length > 5 ? "等" : ""}</p>
        <p class="saved-card-sub">${PBY.escapeHTML(PBY.getEffectName(template.effect))} · ${PBY.escapeHTML(template.updatedAt || "")}</p>
        <div class="card-actions">
          <button class="mini-btn" type="button" data-action="edit-saved" data-id="${PBY.escapeHTML(template.id)}">编辑</button>
          <button class="mini-btn" type="button" data-action="play-saved" data-id="${PBY.escapeHTML(template.id)}">开拍</button>
          <button class="mini-btn danger" type="button" data-action="delete-saved" data-id="${PBY.escapeHTML(template.id)}">删除</button>
        </div>
      </article>
    `).join("") : `<div class="empty-state">还没有保存模板。去创建页拍一个自己的决定吧。</div>`;

    recordList.innerHTML = records.length ? records.map((record) => `
      <article class="record-card">
        <h3 class="record-card-title">${PBY.escapeHTML(record.result)}</h3>
        <p class="record-card-sub">${PBY.escapeHTML(record.title || "今天拍什么")} · ${PBY.escapeHTML(PBY.getEffectName(record.effect))}</p>
        <p class="record-card-sub">${PBY.escapeHTML(record.createdAt)}</p>
        <div class="card-actions">
          <button class="mini-btn" type="button" data-action="replay-record" data-id="${PBY.escapeHTML(record.id)}">再来一次</button>
          <button class="mini-btn danger" type="button" data-action="delete-record" data-id="${PBY.escapeHTML(record.id)}">删除</button>
        </div>
      </article>
    `).join("") : `<div class="empty-state">还没有决策记录。完成一次拍板后会出现在这里。</div>`;
  }

  document.body.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    const templates = PBY.getSavedTemplates();
    const records = PBY.getRecords();

    if (action === "edit-saved") {
      const template = templates.find((item) => item.id === id);
      if (!template) return;
      PBY.setDraftFromTemplate(template, true);
      location.href = "create.html";
    }
    if (action === "play-saved") {
      const template = templates.find((item) => item.id === id);
      if (!template) return;
      PBY.setActiveDecision({
        title: template.title,
        options: template.options,
        effect: template.effect,
        sourceType: "mine",
        returnUrl: "mine.html"
      });
      location.href = "play.html";
    }
    if (action === "delete-saved") {
      PBY.saveSavedTemplates(templates.filter((item) => item.id !== id));
      PBY.showToast("已删除模板");
      render();
    }
    if (action === "replay-record") {
      const record = records.find((item) => item.id === id);
      if (!record) return;
      PBY.setActiveDecision({
        title: record.title,
        options: record.options,
        effect: record.effect,
        sourceType: "record",
        returnUrl: "mine.html"
      });
      location.href = "play.html";
    }
    if (action === "delete-record") {
      PBY.saveRecords(records.filter((item) => item.id !== id));
      PBY.showToast("已删除记录");
      render();
    }
  });

  render();
})();
