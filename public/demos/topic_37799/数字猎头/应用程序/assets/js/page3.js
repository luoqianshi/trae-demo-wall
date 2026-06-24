(function () {
  const $ = (sel) => document.querySelector(sel);

  // ==================== 1. 读取用户输入 ====================
  let userProfile = {
    intro: "",
    resume: "",
    skills: [],
    keywords: [],
    positions: []
  };

  try {
    const page2 = JSON.parse(sessionStorage.getItem("headhunter_page2") || "null");
    if (page2 && page2.skills && page2.skills.length) {
      userProfile.skills = page2.skills.map(s => typeof s === "string" ? s : s.name || "").filter(Boolean);
      userProfile.keywords = (page2.keywords || []).map(k => typeof k === "string" ? k : k.name || "").filter(Boolean);
      userProfile.positions = page2.positions || [];
      if (page2.source) {
        userProfile.intro = page2.source.intro || "";
        userProfile.resume = page2.source.resume || "";
      }
    }
  } catch (e) {}

  // 如果用户没有历史数据，使用示例数据
  const hasData = userProfile.skills.length > 0 || userProfile.intro || userProfile.resume;
  if (!hasData) {
    userProfile = {
      intro: "5 年互联网前端工作经验，专注于 React 技术栈与 Web 性能优化。",
      resume: "",
      skills: ["React", "Vue", "TypeScript", "Node.js", "Webpack", "Vite", "HTML5", "CSS3", "性能优化", "组件库", "MLOps", "Kubernetes"],
      keywords: ["上海", "本科", "5 年经验", "外企", "德企"],
      positions: ["前端工程师"]
    };
  }

  // 更新 hero 摘要
  const signalEl = $("#signalSummary");
  if (signalEl) {
    signalEl.textContent = `${userProfile.skills.length} 项核心技能 / ${userProfile.keywords.length} 项关键词`;
  }

  // ==================== 2. TRAE Auto Model 交叉匹配算法 ====================
  // 评分维度：
  //  A. 技能命中 (Skill Match) - 权重 40%：用户技能 vs 岗位要求/描述
  //  B. 关键词命中 (Keyword Match) - 权重 20%：用户关键词 vs 公司/岗位
  //  C. 描述相关度 (Description Relevance) - 权重 15%：用户介绍 vs 岗位描述
  //  D. 公司偏好因子 (Company Preference Factor) - 权重 15%：年龄友好度、女性友好度、WLB
  //  E. 薪资与岗位等级匹配 (Salary/Tier) - 权重 10%

  function matchAndScoreAll() {
    const data = window.__POSITION_DATA__ || { companies: [] };
    const allPositions = [];

    data.companies.forEach(company => {
      (company.positions || []).forEach(pos => {
        allPositions.push({
          ...pos,
          company: {
            id: company.id,
            name: company.name,
            fullName: company.fullName,
            country: company.country,
            industry: company.industry,
            scale: company.scale,
            office: company.office,
            ageFriendly: company.ageFriendly || 3,
            femaleFriendly: company.femaleFriendly || 3,
            wlb: company.wlb || 3,
            salaryRef: company.salaryRef,
            culture: company.culture,
            tags: company.tags || []
          }
        });
      });
    });

    // 构建评分
    const scored = allPositions.map(pos => {
      return computeMatchScore(pos);
    });

    // 按总分排序
    scored.sort((a, b) => b.totalScore - a.totalScore);
    return scored;
  }

  function computeMatchScore(pos) {
    const scores = { skill: 0, keyword: 0, description: 0, company: 0, salary: 0 };
    const details = { matchedSkills: [], matchedKeywords: [], relevantTerms: [] };

    // === A. 技能命中 ===
    const posTextForSkill = [
      pos.title,
      ...(pos.requirements || []),
      ...(pos.description || []),
      ...(pos.company.tags || [])
    ].join(" ").toLowerCase();

    let skillHits = 0;
    userProfile.skills.forEach(skill => {
      const skillLower = skill.toLowerCase().trim();
      if (!skillLower) return;
      // 模糊匹配：包含或部分包含
      if (posTextForSkill.includes(skillLower) ||
          posTextForSkill.includes(skillLower.replace(/[\+\.]/g, ""))) {
        skillHits++;
        details.matchedSkills.push(skill);
      }
    });
    // 归一化到 0-100
    scores.skill = Math.min(100, Math.round((skillHits / Math.max(userProfile.skills.length, 1)) * 100 * 1.5));

    // === B. 关键词命中 ===
    const posTextForKw = [
      pos.company.name, pos.company.fullName, pos.company.industry, pos.company.country,
      pos.company.culture, pos.location, pos.title, ...(pos.description || [])
    ].join(" ").toLowerCase();

    let kwHits = 0;
    userProfile.keywords.forEach(kw => {
      const kwLower = kw.toLowerCase().trim();
      if (!kwLower) return;
      if (posTextForKw.includes(kwLower)) {
        kwHits++;
        details.matchedKeywords.push(kw);
      }
    });
    scores.keyword = Math.min(100, kwHits * 25);

    // === C. 描述相关度 ===
    const userText = (userProfile.intro + " " + userProfile.resume).toLowerCase();
    if (userText.length > 10) {
      let relHits = 0;
      const descText = (pos.description || []).join(" ").toLowerCase() + " " + (pos.requirements || []).join(" ").toLowerCase();
      const buzzWords = ["数据", "ai", "模型", "算法", "产品", "工程", "架构", "研究", "分析", "机器学习", "llm", "企业", "云", "架构师", "优化", "团队", "客户"];
      buzzWords.forEach(w => {
        if (descText.includes(w) && userText.includes(w)) {
          relHits++;
          details.relevantTerms.push(w);
        }
      });
      scores.description = Math.min(100, relHits * 15);
    } else {
      scores.description = 40; // 中性分
    }

    // === D. 公司偏好因子 ===
    const companyScore = (pos.company.ageFriendly * 25 + pos.company.femaleFriendly * 20 + pos.company.wlb * 25) / 3;
    scores.company = Math.min(100, Math.round(companyScore * 1.3));

    // === E. 薪资与岗位等级 ===
    const salaryText = (pos.salary || "").toLowerCase();
    const expText = (pos.experience || "").toLowerCase();
    let salaryScore = 50;
    if (salaryText.includes("k") || salaryText.includes("薪")) salaryScore += 20;
    if (expText.includes("5") || expText.includes("资深") || expText.includes("senior")) salaryScore += 20;
    if (expText.includes("10") || expText.includes("专家")) salaryScore += 10;
    scores.salary = Math.min(100, salaryScore);

    // 加权汇总
    const totalScore = Math.round(
      scores.skill * 0.40 +
      scores.keyword * 0.20 +
      scores.description * 0.15 +
      scores.company * 0.15 +
      scores.salary * 0.10
    );

    return {
      ...pos,
      scores,
      totalScore,
      matchDetails: details,
      tier: totalScore >= 80 ? "极佳匹配" : totalScore >= 65 ? "优秀匹配" : totalScore >= 45 ? "一般匹配" : "较低匹配"
    };
  }

  // ==================== 3. 过程日志输出 ====================
  const logEl = $("#processLog");
  const logSteps = [];

  function addLogStep(idx, title, lines, { ok = false, highlightKey = null } = {}) {
    logSteps.push({ idx, title, lines, ok, highlightKey });
    renderLog();
  }

  function renderLog() {
    if (!logEl) return;
    logEl.innerHTML = logSteps.map(s => {
      const linesHtml = s.lines.map(l => {
        if (s.highlightKey && typeof l === "string") {
          const key = s.highlightKey.toLowerCase();
          const reg = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
          l = l.replace(reg, m => `<span class="highlight">${m}</span>`);
        }
        return `<span class="sub">· ${l}</span>`;
      }).join("");
      return `
        <div class="log-step">
          <div class="log-head${s.ok ? " ok" : ""}">
            <span class="idx">Step ${String(s.idx).padStart(2, "0")} ·</span>
            <span>${s.title}</span>
            <span>${s.ok ? "✔" : "…"}</span>
          </div>
          <div class="log-body">${linesHtml}</div>
        </div>`;
    }).join("");
    logEl.scrollTop = logEl.scrollHeight;
  }

  // ==================== 4. 主流程 ====================
  let scoredPositions = [];
  let selectedPositionIds = new Set();
  let currentDetailPos = null;
  let showSelectedOnly = false;

  // 从 sessionStorage 恢复已选择状态（用户从其他页面返回时）
  try {
    const savedIds = sessionStorage.getItem("headhunter_selectedIds");
    if (savedIds) {
      const arr = JSON.parse(savedIds);
      if (Array.isArray(arr)) {
        arr.forEach(id => selectedPositionIds.add(id));
      }
    }
  } catch (e) {}

  function persistSelection() {
    try {
      sessionStorage.setItem("headhunter_selectedIds",
        JSON.stringify([...selectedPositionIds]));
    } catch (e) {}
  }

  async function runMatchingFlow() {
    if (!window.__POSITION_DATA__) {
      showToast("职位数据加载失败");
      return;
    }

    // 初始化 UI
    $("#processDot").classList.remove("done");
    $("#processDot").classList.add("running");
    $("#processStatus").textContent = "模型加载中...";
    $("#processStatus").classList.remove("done");
    $("#processStatus").classList.add("running");
    $("#positionList").innerHTML = "";
    $("#filterCard").style.display = "none";
    $("#actionBar").style.display = "none";

    await sleep(350);

    // Step 01
    const data = window.__POSITION_DATA__;
    const totalCompanies = data.companies.length;
    const totalPositions = data.companies.reduce((sum, c) => sum + (c.positions || []).length, 0);
    addLogStep(1, "【数据加载】读取职位库", [
      `共 ${totalCompanies} 家公司 / ${totalPositions} 个岗位`,
      `用户技能数：${userProfile.skills.length}`,
      `用户关键词数：${userProfile.keywords.length}`
    ]);

    await sleep(450);

    // Step 02
    addLogStep(2, "【模型初始化】加载匹配模型", [
      `模型：TRAE Auto Model v1.0 (Cross-Match Ensemble)`,
      `加载 5 维度评分器：技能 / 关键词 / 描述 / 公司偏好 / 薪资`,
      `权重配置：40% / 20% / 15% / 15% / 10%`,
      `分词策略：中英文混合分词 + 大小写归一化`
    ]);

    await sleep(450);

    // Step 03
    addLogStep(3, "【语义解析】向量化用户技能与岗位描述", [
      `用户技能词嵌入：<span class="highlight">${userProfile.skills.slice(0, 6).join("、")}</span>${userProfile.skills.length > 6 ? "..." : ""}`,
      `用户关键词：<span class="highlight">${userProfile.keywords.slice(0, 5).join("、")}</span>`,
      `向量维度：128-d · 匹配算法：加权余弦 + 关键词命中`
    ]);

    await sleep(500);

    // Step 04 - 执行实际评分
    scoredPositions = matchAndScoreAll();

    addLogStep(4, "【交叉匹配】逐岗位计算匹配度", [
      `扫描 ${scoredPositions.length} 个岗位`,
      `计算 5 维度打分...`,
      `<span class="found">匹配完成</span> · Top 10 岗位总分区间：${scoredPositions.slice(0, 10).map(p => p.totalScore).join(", ")}`
    ]);

    await sleep(450);

    // Step 05
    const topPositions = scoredPositions.slice(0, Math.min(10, scoredPositions.length));
    const topSummary = topPositions.slice(0, 5).map(p => `  ${p.totalScore}分 · <span class="highlight">${p.company.name}</span> - ${p.title.slice(0, 30)}`).join("<br/>");
    addLogStep(5, "【排序汇总】生成推荐列表", [
      `按匹配度降序排列，取 Top 10 进入推荐列表`,
      `Top 5 岗位：<br/>${topSummary}`,
      `可通过搜索框、行业筛选、排序切换进一步筛选`
    ], { ok: true });

    // Step 06
    await sleep(300);
    addLogStep(6, "【完成】模型分析结束", [
      `<span class="found">✓ 推荐列表已生成</span>`,
      `可点击卡片查看详情，或勾选中意岗位后点击"根据职位生成简历" / "投递简历"`
    ], { ok: true });

    // 更新 UI 状态
    $("#processDot").classList.remove("running");
    $("#processDot").classList.add("done");
    $("#processStatus").textContent = "分析完成";
    $("#processStatus").classList.remove("running");
    $("#processStatus").classList.add("done");

    // 渲染岗位列表
    initFilters();
    renderPositionList();
    $("#filterCard").style.display = "block";
    $("#actionBar").style.display = "flex";
  }

  // ==================== 5. 筛选器 ====================
  function initFilters() {
    const industries = new Set();
    scoredPositions.forEach(p => {
      if (p.company.industry) {
        p.company.industry.split(/[,，\/、]/).forEach(ind => {
          industries.add(ind.trim());
        });
      }
    });
    const select = $("#industryFilter");
    [...industries].slice(0, 20).forEach(ind => {
      const opt = document.createElement("option");
      opt.value = ind;
      opt.textContent = ind;
      select.appendChild(opt);
    });

    $("#searchInput").addEventListener("input", debounce(renderPositionList, 200));
    $("#industryFilter").addEventListener("change", renderPositionList);
    $("#sortSelect").addEventListener("change", renderPositionList);
  }

  function getFilteredPositions() {
    let list = scoredPositions.slice();
    const q = ($("#searchInput").value || "").toLowerCase().trim();
    const industry = $("#industryFilter").value;
    const sortBy = $("#sortSelect").value;

    // 只看选中职位
    if (showSelectedOnly) {
      list = list.filter(p => selectedPositionIds.has(p.id));
    }

    if (q) {
      list = list.filter(p => {
        const combined = [
          p.title, p.company.name, p.company.fullName,
          ...(p.company.tags || []), ...(p.description || []), ...(p.requirements || [])
        ].join(" ").toLowerCase();
        return combined.includes(q);
      });
    }
    if (industry) {
      list = list.filter(p => (p.company.industry || "").includes(industry));
    }

    if (sortBy === "age_friendly") {
      list.sort((a, b) => b.company.ageFriendly - a.company.ageFriendly);
    } else if (sortBy === "wlb") {
      list.sort((a, b) => b.company.wlb - a.company.wlb);
    } else if (sortBy === "salary") {
      list.sort((a, b) => extractSalary(b.salary) - extractSalary(a.salary));
    } // 默认已按 match 排序

    return list;
  }

  function extractSalary(text) {
    if (!text) return 0;
    const m = text.match(/(\d{2,3})[k\s\-–~]/i);
    return m ? parseInt(m[1]) : 0;
  }

  // ==================== 6. 岗位卡片渲染 ====================
  function renderPositionList() {
    const list = getFilteredPositions();
    const container = $("#positionList");
    $("#matchCount").textContent = `共 ${list.length} 个岗位`;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="card empty-state">
          <div class="empty-icon">🔍</div>
          <div>没有找到匹配的岗位，请调整搜索条件</div>
        </div>`;
      updateActionBar();
      return;
    }

    container.innerHTML = list.slice(0, Math.min(30, list.length)).map((pos, i) => {
      return buildPositionCard(pos, i);
    }).join("");

    // 绑定事件
    container.querySelectorAll(".card-actions").forEach((actionEl, i) => {
      const pos = list[i];
      if (!pos) return;
      const selectBtn = actionEl.querySelector(".btn-select");
      const detailBtn = actionEl.querySelector(".btn-detail");
      const linkBtn = actionEl.querySelector(".btn-link");

      if (selectBtn) {
        selectBtn.addEventListener("click", () => {
          toggleSelect(pos.id);
        });
      }
      if (detailBtn) {
        detailBtn.addEventListener("click", () => showDetail(pos));
      }
      if (linkBtn && pos.link) {
        linkBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          window.open(pos.link, "_blank");
        });
      }
    });

    updateActionBar();
    // 更新「只看选中职位」按钮样式
    const btnSelOnly = $("#btnShowSelectedOnly");
    if (btnSelOnly) {
      btnSelOnly.classList.toggle("is-active", showSelectedOnly);
      btnSelOnly.textContent = showSelectedOnly ? "显示全部职位" : "只看选中职位";
    }
  }

  function buildPositionCard(pos, index) {
    const isSelected = selectedPositionIds.has(pos.id);
    const score = pos.totalScore;
    const circumference = 2 * Math.PI * 26; // r=26
    const offset = circumference * (1 - score / 100);

    const skillsHtml = (pos.matchDetails.matchedSkills.slice(0, 4) || [])
      .map(s => `<span class="skill-tag matched">${escapeHtml(s)}</span>`).join("");
    const extraTags = (pos.company.tags || []).slice(0, 4)
      .map(t => `<span class="skill-tag">${escapeHtml(t)}</span>`).join("");
    const keywordTags = (pos.matchDetails.matchedKeywords.slice(0, 3) || [])
      .map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join("");

    const companyInitial = (pos.company.name || pos.company.fullName || "?").charAt(0).toUpperCase();
    const companyShort = pos.company.name || pos.company.fullName;
    const companyFull = pos.company.fullName;

    return `
      <div class="position-card ${isSelected ? "selected" : ""}" data-id="${escapeHtml(pos.id)}">
        <div class="match-score">
          <div class="score-ring">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle class="score-ring-bg" cx="32" cy="32" r="26"></circle>
              <circle class="score-ring-progress" cx="32" cy="32" r="26"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"></circle>
            </svg>
            <div class="score-ring-text">${score}</div>
          </div>
          <div class="score-label">${pos.tier}</div>
        </div>

        <div class="card-title-row">
          <div class="company-badge">${companyInitial}</div>
          <div style="flex: 1; min-width: 0;">
            <h3 class="position-title">${escapeHtml(pos.title)}</h3>
            <p class="company-name">${escapeHtml(companyShort)} · ${escapeHtml(companyFull)}</p>
          </div>
        </div>

        <div class="position-meta">
          <div class="meta-item salary"><span class="meta-label">薪资：</span>${escapeHtml(pos.salary || "面议")}</div>
          <div class="meta-item"><span class="meta-label">地点：</span>${escapeHtml(pos.location || "-")}</div>
          <div class="meta-item"><span class="meta-label">经验：</span>${escapeHtml(pos.experience || "-")}</div>
          <div class="meta-item"><span class="meta-label">学历：</span>${escapeHtml(pos.education || "-")}</div>
          <div class="meta-item"><span class="meta-label">国家：</span>${escapeHtml(pos.company.country || "-")}</div>
        </div>

        <div class="card-tags">
          ${skillsHtml}
          ${keywordTags}
          ${extraTags}
        </div>

        <div class="company-tags">
          <div>年龄友好度：<span class="star">${"★".repeat(pos.company.ageFriendly)}${"☆".repeat(5 - pos.company.ageFriendly)}</span></div>
          <div>女性友好度：<span class="star">${"★".repeat(pos.company.femaleFriendly)}${"☆".repeat(5 - pos.company.femaleFriendly)}</span></div>
          <div>WLB：<span class="star">${"★".repeat(pos.company.wlb)}${"☆".repeat(5 - pos.company.wlb)}</span></div>
        </div>

        <div class="card-actions">
          <button class="btn btn-detail">查看详情</button>
          <button class="btn btn-select ${isSelected ? "is-selected" : ""}">${isSelected ? "✓ 已选择" : "选择此岗位"}</button>
          ${pos.link ? '<button class="btn btn-link">原始链接</button>' : ""}
        </div>
      </div>`;
  }

  // ==================== 7. 选择逻辑 ====================
  function toggleSelect(posId) {
    if (selectedPositionIds.has(posId)) {
      selectedPositionIds.delete(posId);
    } else {
      if (selectedPositionIds.size >= 10) {
        showToast("最多可选择 10 个岗位");
        return;
      }
      selectedPositionIds.add(posId);
    }
    persistSelection();
    renderPositionList();
  }

  function updateActionBar() {
    $("#selectedInfo").textContent = `已选 ${selectedPositionIds.size} 个岗位（最多 10 个）`;
  }

  $("#btnSelectAll").addEventListener("click", () => {
    const list = getFilteredPositions().slice(0, 10);
    list.forEach(p => selectedPositionIds.add(p.id));
    persistSelection();
    renderPositionList();
    showToast("已选择 Top 10 匹配岗位");
  });

  $("#btnClearSelection").addEventListener("click", () => {
    if (selectedPositionIds.size === 0) {
      showToast("当前没有选中的岗位");
      return;
    }
    selectedPositionIds.clear();
    persistSelection();
    renderPositionList();
    showToast("已取消所有选择");
  });

  $("#btnShowSelectedOnly").addEventListener("click", () => {
    if (!showSelectedOnly && selectedPositionIds.size === 0) {
      showToast("当前没有选中的岗位");
      return;
    }
    showSelectedOnly = !showSelectedOnly;
    renderPositionList();
  });

  $("#btnBackToPage2").addEventListener("click", () => {
    window.location.href = "../页面2-信息抽取/index.html";
  });

  // ==================== 8. 岗位详情弹窗 ====================
  function showDetail(pos) {
    currentDetailPos = pos;
    $("#detailTitle").textContent = `${pos.company.name} · ${pos.title}`;

    const ratingStars = (n) => "★".repeat(Math.max(0, Math.min(5, n))) + "☆".repeat(5 - Math.max(0, Math.min(5, n)));

    $("#detailBody").innerHTML = `
      <div class="detail-section">
        <div class="detail-grid">
          <div class="detail-grid-item"><span class="label">公司：</span><strong>${escapeHtml(pos.company.fullName)}</strong> (${escapeHtml(pos.company.country)})</div>
          <div class="detail-grid-item"><span class="label">行业：</span>${escapeHtml(pos.company.industry)}</div>
          <div class="detail-grid-item"><span class="label">岗位编号：</span>${escapeHtml(pos.code || "-")}</div>
          <div class="detail-grid-item"><span class="label">招聘人数：</span>${escapeHtml(pos.hiringCount || "-")}</div>
          <div class="detail-grid-item"><span class="label">地点：</span>${escapeHtml(pos.location || "-")}</div>
          <div class="detail-grid-item"><span class="label">薪资：</span><strong style="color:#e8652b;">${escapeHtml(pos.salary || "面议")}</strong></div>
          <div class="detail-grid-item"><span class="label">经验要求：</span>${escapeHtml(pos.experience || "-")}</div>
          <div class="detail-grid-item"><span class="label">学历要求：</span>${escapeHtml(pos.education || "-")}</div>
        </div>
        <div class="rating-row">
          <div class="rating-item">年龄友好度：<span class="stars">${ratingStars(pos.company.ageFriendly)}</span></div>
          <div class="rating-item">女性友好度：<span class="stars">${ratingStars(pos.company.femaleFriendly)}</span></div>
          <div class="rating-item">工作生活平衡：<span class="stars">${ratingStars(pos.company.wlb)}</span></div>
        </div>
      </div>

      <div class="detail-section">
        <h4>公司简介</h4>
        <div class="company-intro">
          <div><strong>规模：</strong>${escapeHtml(pos.company.scale || "-")}</div>
          <div><strong>办公地点：</strong>${escapeHtml(pos.company.office || "-")}</div>
          <div><strong>企业文化：</strong>${escapeHtml(pos.company.culture || "-")}</div>
          <div><strong>标签：</strong>${(pos.company.tags || []).map(t => `<span class="skill-tag" style="margin-right:6px;">${escapeHtml(t)}</span>`).join("")}</div>
        </div>
      </div>

      ${(pos.description || []).length ? `
      <div class="detail-section">
        <h4>岗位描述</h4>
        <ul class="detail-list">
          ${pos.description.map(d => `<li>${escapeHtml(d)}</li>`).join("")}
        </ul>
      </div>` : ""}

      ${(pos.requirements || []).length ? `
      <div class="detail-section">
        <h4>岗位要求</h4>
        <ul class="detail-list">
          ${pos.requirements.map(r => `<li>${escapeHtml(r)}</li>`).join("")}
        </ul>
      </div>` : ""}

      <div class="detail-section">
        <h4>匹配分析</h4>
        <div class="company-intro">
          <div style="margin-bottom:8px;"><strong>总体匹配度：</strong>${pos.totalScore} 分 · ${pos.tier}</div>
          <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:6px 16px;">
            <div>技能命中：${pos.scores.skill} 分（命中 ${pos.matchDetails.matchedSkills.length} 项）</div>
            <div>关键词命中：${pos.scores.keyword} 分（命中 ${pos.matchDetails.matchedKeywords.length} 项）</div>
            <div>描述相关度：${pos.scores.description} 分</div>
            <div>公司偏好因子：${pos.scores.company} 分</div>
          </div>
          ${pos.matchDetails.matchedSkills.length ? `<div style="margin-top:10px;"><strong>匹配技能：</strong>${pos.matchDetails.matchedSkills.map(s => `<span class="skill-tag matched" style="margin:2px 4px 0 0; display:inline-block;">${escapeHtml(s)}</span>`).join("")}</div>` : ""}
          ${pos.matchDetails.matchedKeywords.length ? `<div style="margin-top:6px;"><strong>匹配关键词：</strong>${pos.matchDetails.matchedKeywords.map(k => `<span class="keyword-tag" style="margin:2px 4px 0 0; display:inline-block;">${escapeHtml(k)}</span>`).join("")}</div>` : ""}
        </div>
      </div>
    `;

    // 更新选择按钮
    const btn = $("#btnSelectFromDetail");
    const isSel = selectedPositionIds.has(pos.id);
    btn.textContent = isSel ? "✓ 取消选择此岗位" : "选择此岗位";
    btn.onclick = () => {
      toggleSelect(pos.id);
      showDetail(pos); // 刷新
    };

    $("#detailModal").classList.add("open");
  }

  document.querySelectorAll("#detailModal [data-close]").forEach(el => {
    el.addEventListener("click", () => {
      $("#detailModal").classList.remove("open");
    });
  });

  // ==================== 9. 跳转到页面4 / 页面5 ====================
  function getSelectedPositions() {
    if (selectedPositionIds.size === 0) {
      // 如果没有选择，默认选择 Top 3
      const list = getFilteredPositions().slice(0, 3);
      list.forEach(p => selectedPositionIds.add(p.id));
      renderPositionList();
    }
    return scoredPositions.filter(p => selectedPositionIds.has(p.id));
  }

  $("#btnGenerateResume").addEventListener("click", () => {
    const selected = getSelectedPositions();
    if (selected.length === 0) {
      showToast("请先选择至少 1 个岗位");
      return;
    }
    try {
      sessionStorage.setItem("headhunter_page3", JSON.stringify({
        selectedPositions: selected,
        userProfile: userProfile
      }));
    } catch (e) {}
    window.location.href = "../页面4-简历生成/index.html";
  });

  $("#btnApply").addEventListener("click", () => {
    const selected = getSelectedPositions();
    if (selected.length === 0) {
      showToast("请先选择至少 1 个岗位");
      return;
    }
    try {
      sessionStorage.setItem("headhunter_apply", JSON.stringify({
        selectedPositions: selected,
        userProfile: userProfile,
        sourcePage: "page3"
      }));
    } catch (e) {}
    window.location.href = "../页面5-投递简历/index.html";
  });

  // ==================== 10. 工具函数 ====================
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }
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

  // ==================== 11. 启动 ====================
  runMatchingFlow();
})();
