(function () {
  const { INTRO_TEMPLATES } = window.__TEMPLATES__;

  const $ = (sel) => document.querySelector(sel);

  const introText = $("#introText");
  const introCount = $("#introCount");
  const btnIntroTemplate = $("#btnIntroTemplate");
  const btnNext = $("#btnNext");
  const modal = $("#templateModal");
  const modalTitle = $("#modalTitle");
  const templateList = $("#templateList");
  const toast = $("#toast");

  // ========== 字数统计 ==========
  introText.addEventListener("input", () => {
    introCount.textContent = introText.value.length;
  });

  // ========== Toast ==========
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // ========== 模板弹窗 ==========
  function openTemplateModal() {
    modalTitle.textContent = "选择个人介绍模板";

    templateList.innerHTML = INTRO_TEMPLATES
      .map(
        (t) => `
      <div class="template-group">
        <div class="template-group-title">岗位方向模板</div>
        <div class="template-grid">
          <button class="template-card" data-id="${t.id}">
            ${t.tag ? `<span class="template-tag">${t.tag}</span>` : ""}
            <h4>${t.title}</h4>
            <p>${t.content.replace(/\n/g, " ").slice(0, 80)}...</p>
          </button>
        </div>
      </div>`
      )
      .join("");

    templateList.querySelectorAll(".template-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const tpl = INTRO_TEMPLATES.find((x) => x.id === id);
        if (!tpl) return;
        introText.value = tpl.content;
        introCount.textContent = introText.value.length;
        showToast("已导入个人介绍模板，可直接编辑");
        closeModal();
      });
    });

    modal.classList.add("open");
  }

  function closeModal() {
    modal.classList.remove("open");
  }

  btnIntroTemplate.addEventListener("click", openTemplateModal);
  modal.querySelectorAll("[data-close]").forEach((el) =>
    el.addEventListener("click", closeModal)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  // ========== 下一步：页面2 ==========
  function goToPage2() {
    const intro = introText.value.trim();

    if (!intro) {
      showToast("请先填写个人介绍");
      introText.focus();
      return;
    }

    const payload = {
      intro,
      resume: "",
      files: [],
      timestamp: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem("headhunter_page1", JSON.stringify(payload));
    } catch (e) {}

    window.location.href = "页面2-信息抽取/index.html";
  }

  btnNext.addEventListener("click", goToPage2);
})();
