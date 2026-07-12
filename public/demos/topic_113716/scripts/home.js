(function () {
  const homeGrid = document.getElementById("homeGrid");
  const hotGrid = document.getElementById("hotGrid");
  const savedGrid = document.getElementById("homeSavedGrid");
  document.getElementById("tabbar").innerHTML = PBY.tabbar("home");

  const FLAT_ICONS = {
    eat: `<svg class="flat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 11h14l-1.25 5.2A4.1 4.1 0 0 1 13.75 19h-3.5a4.1 4.1 0 0 1-4-2.8L5 11Z" fill="currentColor"/>
      <path d="M8 9.1c1.15-.8 1.15-1.85 0-2.65M12 9.1c1.15-.8 1.15-1.85 0-2.65M16 9.1c1.15-.8 1.15-1.85 0-2.65" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M6 20h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
    weekend: `<svg class="flat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm3.95 4.55-2.2 5.7-5.7 2.2 2.2-5.7 5.7-2.2Z" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.7" fill="#fff6df"/>
    </svg>`,
    housework: `<svg class="flat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M15.8 3.3a1.1 1.1 0 0 1 1.55 0l.35.35a1.1 1.1 0 0 1 0 1.55L8.9 14l-1.9-1.9 8.8-8.8Z" fill="currentColor"/>
      <path d="M6.55 12.2 3.7 15.05a2.4 2.4 0 0 0 0 3.4l1.85 1.85a2.4 2.4 0 0 0 3.4 0l2.85-2.85-5.25-5.25Z" fill="currentColor" opacity=".72"/>
      <path d="M5.5 16.2 7.8 18.5M7.5 14.3l2.3 2.3" fill="none" stroke="#fff6df" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,
    movie: `<svg class="flat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 8h16v10.2c0 .45-.35.8-.8.8H4.8a.8.8 0 0 1-.8-.8V8Z" fill="currentColor"/>
      <path d="M4.8 5h14.4c.45 0 .8.35.8.8V8H4V5.8c0-.45.35-.8.8-.8Z" fill="currentColor" opacity=".72"/>
      <path d="m7 5 2 3M12 5l2 3M17 5l2 3" fill="none" stroke="#fff6df" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M10 11.4v4.2l4-2.1-4-2.1Z" fill="#fff6df"/>
    </svg>`,
    drink: `<svg class="flat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 8h10l-.95 10.15a2 2 0 0 1-2 1.85h-4.1a2 2 0 0 1-2-1.85L7 8Z" fill="currentColor"/>
      <path d="M8 8h8l1-3h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8.4 12h7.2" fill="none" stroke="#fff6df" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="10" cy="16" r="1" fill="#fff6df"/>
      <circle cx="14" cy="15" r="1" fill="#fff6df"/>
    </svg>`,
    date: `<svg class="flat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 19.5S5 15.45 5 9.7C5 7.25 6.75 5.5 9 5.5c1.35 0 2.45.65 3 1.65.55-1 1.65-1.65 3-1.65 2.25 0 4 1.75 4 4.2 0 5.75-7 9.8-7 9.8Z" fill="currentColor"/>
      <path d="M8.1 9.2c.25-.85.85-1.3 1.75-1.3" fill="none" stroke="#fff6df" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,
    night: `<svg class="flat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7.2 9h9.6a4 4 0 0 1 3.9 3.1l.75 3.25a2.5 2.5 0 0 1-4.25 2.25L15.6 16h-7.2l-1.6 1.6a2.5 2.5 0 0 1-4.25-2.25l.75-3.25A4 4 0 0 1 7.2 9Z" fill="currentColor"/>
      <path d="M8 12v3M6.5 13.5h3" fill="none" stroke="#fff6df" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="15.5" cy="13" r="1" fill="#fff6df"/>
      <circle cx="18" cy="15" r="1" fill="#fff6df"/>
    </svg>`,
    travel: `<svg class="flat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20.4 4.6c.55.55.35 1.55-.4 2.05l-4.95 3.3 1.1 6.05-1.65 1.65-2.55-5.2-4.15 3.1.1 2.55-1.3 1.3-1.25-3.75-3.75-1.25 1.3-1.3 2.55.1 3.1-4.15-5.2-2.55 1.65-1.65 6.05 1.1L14.35 1c.5-.75 1.5-.95 2.05-.4l4 4Z" fill="currentColor"/>
    </svg>`,
    family: `<svg class="flat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 11.2 12 4l8 7.2-1.35 1.5L17.5 11.7v7.5c0 .45-.35.8-.8.8H7.3a.8.8 0 0 1-.8-.8v-7.5l-1.15 1L4 11.2Z" fill="currentColor"/>
      <path d="M10 20v-5.2h4V20" fill="#fff6df"/>
      <path d="M9 11.5h2.1M12.9 11.5H15" fill="none" stroke="#fff6df" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,
    reward: `<svg class="flat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 11h14v8.2c0 .45-.35.8-.8.8H5.8a.8.8 0 0 1-.8-.8V11Z" fill="currentColor"/>
      <path d="M4 8.2c0-.45.35-.8.8-.8h14.4c.45 0 .8.35.8.8V11H4V8.2Z" fill="currentColor" opacity=".72"/>
      <path d="M11 7.4c-1.7 0-3.6-.6-3.6-2.05 0-.95.75-1.55 1.7-1.35 1.25.25 1.9 1.7 1.9 3.4ZM13 7.4c1.7 0 3.6-.6 3.6-2.05 0-.95-.75-1.55-1.7-1.35-1.25.25-1.9 1.7-1.9 3.4Z" fill="currentColor"/>
      <path d="M11 7.4h2V20h-2V7.4Z" fill="#fff6df"/>
    </svg>`
  };

  function cardIconHTML(template, isSaved) {
    if (isSaved) return PBY.escapeHTML("私");
    return FLAT_ICONS[template.iconKey] || PBY.escapeHTML("拍");
  }

  function templateCardHTML(template, isSaved) {
    return `<button class="template-card" type="button" data-action="${isSaved ? "load-saved" : "load-official"}" data-id="${PBY.escapeHTML(template.id)}">
      <span class="card-icon">${cardIconHTML(template, isSaved)}</span>
      <span class="card-title">${PBY.escapeHTML(template.title)}</span>
      <span class="card-desc">${PBY.escapeHTML(template.desc || `${template.options.length} 个选项`)}</span>
    </button>`;
  }

  function hotCardHTML(template) {
    return `<button class="hot-card" type="button" data-action="load-official" data-id="${PBY.escapeHTML(template.id)}">
      <span class="hot-icon">${cardIconHTML(template, false)}</span>
      <span class="hot-copy">
        <span class="hot-title">${PBY.escapeHTML(template.title)}</span>
        <span class="hot-desc">${PBY.escapeHTML(template.desc || `${template.options.length} 个选项`)}</span>
      </span>
    </button>`;
  }

  function render() {
    homeGrid.innerHTML = [
      `<button class="create-card" type="button" data-action="blank-create">
        <span class="card-icon">＋</span>
        <span class="card-title">创建决策</span>
      </button>`,
      ...PBY.OFFICIAL_TEMPLATES.map((template) => templateCardHTML(template, false))
    ].join("");

    hotGrid.innerHTML = PBY.HOT_TEMPLATES.map((template) => hotCardHTML(template)).join("");

    const saved = PBY.getSavedTemplates().slice(0, 4);
    savedGrid.innerHTML = saved.map((template) => templateCardHTML(template, true)).join("");
  }

  document.body.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (action === "blank-create") {
      PBY.setBlankDraft();
      location.href = "create.html";
    }
    if (action === "load-official") {
      const template = [...PBY.OFFICIAL_TEMPLATES, ...PBY.HOT_TEMPLATES].find((item) => item.id === id);
      if (!template) return;
      PBY.setDraftFromTemplate(template, false);
      location.href = "create.html";
    }
    if (action === "load-saved") {
      const template = PBY.getSavedTemplates().find((item) => item.id === id);
      if (!template) return;
      PBY.setDraftFromTemplate(template, true);
      location.href = "create.html";
    }
  });

  render();
})();
