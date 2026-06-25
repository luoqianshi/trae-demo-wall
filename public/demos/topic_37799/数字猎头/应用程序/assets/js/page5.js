(function () {
  const $ = (sel) => document.querySelector(sel);

  // ==================== 1. 读取数据 ====================
  let data = { selectedPositions: [], userProfile: { intro: "", resume: "", skills: [], keywords: [] } };
  let finalResume = "";
  let sourcePage = "page4"; // 默认回退到页面4

  try {
    const raw = sessionStorage.getItem("headhunter_apply");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.selectedPositions && parsed.selectedPositions.length) {
        data = parsed;
        if (parsed.sourcePage) sourcePage = parsed.sourcePage;
      }
    }
    finalResume = sessionStorage.getItem("headhunter_finalResume") || "";
  } catch (e) {}

  // 回退：没有数据就用示例
  if (!data.selectedPositions || data.selectedPositions.length === 0) {
    data.selectedPositions = [
      {
        id: "demo-1",
        title: "Senior Data Scientist",
        company: { name: "拜耳", fullName: "Bayer AG", country: "德国" },
        salary: "3-4.5万·13薪",
        location: "上海",
        experience: "5-10 年",
        totalScore: 82,
        link: "https://example.com/job/1"
      },
      {
        id: "demo-2",
        title: "ML Engineer",
        company: { name: "SAP", fullName: "SAP SE", country: "德国" },
        salary: "30-50k · 14薪",
        location: "上海",
        experience: "5+ 年",
        totalScore: 76,
        link: "https://example.com/job/2"
      }
    ];
  }

  // ==================== 2. 工具函数 ====================
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[m]));
  }
  function showToast(msg) {
    const toast = $("#toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // ==================== 3. 渲染投递列表 ====================
  const applyListEl = $("#applyList");
  function renderApplyList(statusMap) {
    applyListEl.innerHTML = data.selectedPositions.map(pos => {
      const initial = (pos.company.name || pos.company.fullName || "?").charAt(0).toUpperCase();
      const status = statusMap && statusMap[pos.id] ? statusMap[pos.id] : "待投递";
      const statusClass = status === "已投递" ? "sent" : status === "投递失败" ? "failed" : "pending";
      return `
        <div class="apply-item">
          <div class="apply-badge">${initial}</div>
          <div class="apply-info">
            <p class="apply-title">${escapeHtml(pos.title)}</p>
            <p class="apply-sub">${escapeHtml(pos.company.fullName || pos.company.name)} · ${escapeHtml(pos.company.country || "")} · ${escapeHtml(pos.location || "")} · ${escapeHtml(pos.salary || "")}</p>
          </div>
          <div class="apply-score">${pos.totalScore || "-"} 分</div>
          <div class="apply-status ${statusClass}">${status}</div>
        </div>`;
    }).join("");
  }
  renderApplyList();

  $("#applyCount").textContent = `${data.selectedPositions.length} 个岗位`;

  // ==================== 4. 简历预览 ====================
  const preview = $("#resumePreview");
  if (finalResume && finalResume.trim().length > 10) {
    preview.innerHTML = `<h1>（最终简历预览）</h1><p>${escapeHtml(finalResume).slice(0, 600).replace(/\n/g, "<br/>")}${finalResume.length > 600 ? "<br/><em>...（已省略部分内容，完整简历将被投递）</em>" : ""}</p>`;
  } else {
    // 根据 userProfile 生成简易预览
    preview.innerHTML = `
      <h1>个人简历</h1>
      <p><strong>个人简介：</strong>${escapeHtml(data.userProfile.intro || "（未填写）")}</p>
      <p><strong>核心技能：</strong>${(data.userProfile.skills || []).slice(0, 10).map(s => escapeHtml(s)).join(" · ") || "（未填写）"}</p>
      <p><strong>关键词：</strong>${(data.userProfile.keywords || []).slice(0, 8).map(s => escapeHtml(s)).join(" · ") || ""}</p>
      <p style="color:#949fb5;font-size:12px;font-style:italic;">提示：建议回到「页面4 - 简历生成」生成适配版简历</p>
    `;
  }

  // ==================== 5. 表单校验 ====================
  function validateForm() {
    const name = $("#userName").value.trim();
    const phone = $("#userPhone").value.trim();
    const email = $("#userEmail").value.trim();
    if (!name) { showToast("请输入姓名"); $("#userName").focus(); return null; }
    if (!/^[\d\-+\s]{6,20}$/.test(phone)) { showToast("请输入有效的手机号"); $("#userPhone").focus(); return null; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("请输入有效的邮箱"); $("#userEmail").focus(); return null; }
    return {
      name, phone, email,
      city: $("#userCity").value.trim(),
      gender: $("#userGender").value,
      years: $("#userYears").value
    };
  }

  // 动态更新提示
  function updateHint() {
    const name = $("#userName").value.trim();
    const phone = $("#userPhone").value.trim();
    const email = $("#userEmail").value.trim();
    const btn = $("#btnApply");
    if (name && phone && email) {
      $("#actionHint").textContent = `准备投递到 ${data.selectedPositions.length} 个岗位`;
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
    } else {
      $("#actionHint").textContent = "请先填写必填基本信息（姓名 / 手机 / 邮箱）";
      btn.disabled = true;
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    }
  }

  ["userName", "userPhone", "userEmail"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", updateHint);
      el.addEventListener("change", updateHint);
    }
  });
  updateHint();

  // ==================== 6. 模拟投递过程 ====================
  const logEl = $("#processLog");
  const logSteps = [];

  function addLogStep(idx, title, lines, { ok = true, failed = false } = {}) {
    logSteps.push({ idx, title, lines, ok, failed });
    logEl.innerHTML = logSteps.map(s => `
      <div class="log-step">
        <div class="log-head${s.failed ? " failed" : s.ok ? " ok" : ""}">
          <span>${String(s.idx).padStart(2, "0")} · ${s.title}</span>
          <span>${s.failed ? "✕" : "✔"}</span>
        </div>
        <div class="log-body">${s.lines.map(l => `<span class="sub">· ${l}</span>`).join("")}</div>
      </div>`).join("");
    logEl.scrollTop = logEl.scrollHeight;
  }

  async function runApplyFlow(userInfo) {
    // 隐藏操作栏，显示日志
    $("#processCard").style.display = "block";
    $("#processCard").scrollIntoView({ behavior: "smooth", block: "start" });
    logEl.innerHTML = "";
    logSteps.length = 0;
    $("#processDot").classList.remove("done");
    $("#processDot").classList.add("running");

    await sleep(400);

    addLogStep(1, "验证用户信息", [
      `姓名：${escapeHtml(userInfo.name)}`,
      `手机号：${userInfo.phone.slice(0, 3)}****${userInfo.phone.slice(-3)}`,
      `邮箱：${escapeHtml(userInfo.email)}`,
      `简历字数：${finalResume.length || "（使用简介+技能）"}`
    ]);

    await sleep(500);

    addLogStep(2, "准备投递内容", [
      `生成 ${data.selectedPositions.length} 份公司特定版本的求职信`,
      `将个人信息附加到简历头部`,
      `格式化 PDF / HTML 邮件附件`
    ]);

    await sleep(500);

    // 逐个公司投递
    const statusMap = {};
    const total = data.selectedPositions.length;
    let sent = 0, failed = 0;

    for (let i = 0; i < data.selectedPositions.length; i++) {
      const pos = data.selectedPositions[i];
      const companyName = pos.company.fullName || pos.company.name;
      await sleep(600);

      // 模拟：90% 成功率
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        sent++;
        statusMap[pos.id] = "已投递";
        addLogStep(i + 3, `投递到 ${companyName} - ${pos.title}`, [
          `发送至 HR 邮箱：hr.${companyName.toLowerCase().slice(0, 5)}@company.com`,
          `简历附件：${escapeHtml(userInfo.name)}_Resume.pdf`,
          `状态：<span style="color:#86efac;">投递成功</span>，预计 1-2 周内回复`
        ]);
      } else {
        failed++;
        statusMap[pos.id] = "投递失败";
        addLogStep(i + 3, `投递到 ${companyName} - ${pos.title}`, [
          `发送至 HR 邮箱：hr.${companyName.toLowerCase().slice(0, 5)}@company.com`,
          `状态：<span style="color:#fca5a5;">投递失败</span>（该岗位可能已关闭，或系统临时错误）`,
          `建议：稍后手动投递，或联系猎头代投`
        ], { failed: true });
      }

      const progress = Math.round((i + 1) / total * 100);
      $("#processStatus").textContent = `${progress}%`;
      renderApplyList(statusMap);
    }

    await sleep(500);
    addLogStep(99, "投递流程完成", [
      `成功：${sent} 份 · 失败：${failed} 份`,
      `系统将为你保留投递记录`,
      `建议：一周后若无回复，可发送一封简短的 follow-up 邮件`
    ]);

    $("#processDot").classList.remove("running");
    $("#processDot").classList.add("done");

    // 显示完成卡片
    await sleep(400);
    $("#doneCard").style.display = "block";
    $("#finalCount").textContent = sent;
    $("#doneSummary").innerHTML = data.selectedPositions.map(pos => `
      <div class="summary-row">
        <span class="company">${escapeHtml(pos.company.fullName || pos.company.name)} · ${escapeHtml(pos.title)}</span>
        <span class="status-sent">${statusMap[pos.id]}</span>
      </div>
    `).join("");

    $("#doneCard").scrollIntoView({ behavior: "smooth", block: "start" });

    // 隐藏操作栏
    $("#actionBar").style.display = "none";
  }

  $("#btnApply").addEventListener("click", async () => {
    const info = validateForm();
    if (!info) return;

    if (!confirm(`即将投递简历到 ${data.selectedPositions.length} 个目标公司，是否继续？`)) return;

    $("#btnApply").disabled = true;
    $("#btnApply").textContent = "投递中...";

    try {
      await runApplyFlow(info);
    } catch (e) {
      showToast("投递失败：" + e.message);
      $("#btnApply").disabled = false;
      $("#btnApply").textContent = "一键投递到所有岗位";
    }
  });

  // ==================== 8. 返回上一步按钮 ====================
  const btnBack = $("#btnBack");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      if (sourcePage === "page3") {
        window.location.href = "../页面3-职位检索/index.html";
      } else {
        window.location.href = "../页面4-简历生成/index.html";
      }
    });
  }

  // ==================== 7. 默认填充（演示） ====================
  // 为了演示便利，将表单预填一些内容（用户可修改）
  setTimeout(() => {
    if (!$("#userName").value) $("#userName").value = "（请输入你的姓名）";
    if (!$("#userPhone").value) $("#userPhone").value = "138-0000-0000";
    if (!$("#userEmail").value) $("#userEmail").value = "your.email@example.com";
    if (!$("#userCity").value) $("#userCity").value = "上海";
    updateHint();
  }, 300);
})();
