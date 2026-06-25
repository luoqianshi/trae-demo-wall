// 提交文案生成器 - 一键生成 TRAE 创造力大赛参赛帖文案
// 纯前端生成，无需后端。支持 localStorage 持久化，切换 Tab / 刷新不丢数据。

const LS_KEY = "trae_gen_form";

const GENERATOR_STAGES = [
  { label: "阶段一：创意梳理", desc: "用 TRAE Work 做选题分析、个人优势匹配、赛道选择", session: "", screenshot: "" },
  { label: "阶段二：产品规划", desc: "用 TRAE IDE Plan 模式制定实施计划，拆解任务", session: "", screenshot: "" },
  { label: "阶段三：编码实现", desc: "TRAE IDE 智能体并行开发，生成全部文件（HTML/CSS/JS 等）", session: "", screenshot: "" },
  { label: "阶段四：测试与部署", desc: "浏览器自动化测试，修复 bug，部署上线（GitHub Pages 等）", session: "", screenshot: "" },
];

let _genStages = [];      // 阶段数据（运行时）
let _genResult = "";      // 最后一次生成的全文
let _genFormBuilt = false; // 表单 DOM 是否已构建

// ========== 初始化入口 ==========

function initGenerator() {
  const container = document.getElementById("generator-container");
  if (!container) return;

  // 初始化阶段数据：localStorage > 默认值
  if (_genStages.length === 0) {
    loadFromStorage();
    if (_genStages.length === 0) {
      _genStages = GENERATOR_STAGES.map(s => ({ ...s }));
    }
  }

  if (_genFormBuilt && container.querySelector(".generator-layout")) {
    // 表单已存在，只恢复字段值 + 重新绑定事件即可
    restoreFormValues();
    bindGeneratorEvents();
    return;
  }

  renderGeneratorForm(container);
  _genFormBuilt = true;
  restoreFormValues();
}

// ========== localStorage 持久化 ==========

function saveToStorage() {
  try {
    const data = {
      stages: _genStages,
      demoName: document.getElementById("gen-demo-name")?.value || "",
      track: document.querySelector('input[name="gen-track"]:checked')?.value || "",
      trackPublic: document.getElementById("gen-track-public")?.checked || false,
      intro: document.getElementById("gen-intro")?.value || "",
      summary: document.getElementById("gen-summary")?.value || "",
      idea: document.getElementById("gen-idea")?.value || "",
      expType: document.querySelector('input[name="gen-exp-type"]:checked')?.value || "link",
      expUrl: document.getElementById("gen-experience-url")?.value || "",
      expDesc: document.getElementById("gen-experience-desc")?.value || "",
      registerUrl: document.getElementById("gen-register-url")?.value || "",
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) { /* 静默失败 */ }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.stages && Array.isArray(data.stages) && data.stages.length > 0) {
      _genStages = data.stages;
    }
    // 其他字段在 restoreFormValues 中回填
  } catch (e) { /* 静默失败 */ }
}

function restoreFormValues() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    if (data.track) {
      const radio = document.querySelector(`input[name="gen-track"][value="${data.track}"]`);
      if (radio) radio.checked = true;
    }
    const publicCheck = document.getElementById("gen-track-public");
    if (publicCheck) publicCheck.checked = !!data.trackPublic;

    setVal("gen-demo-name", data.demoName);
    setVal("gen-intro", data.intro);
    setVal("gen-summary", data.summary);
    setVal("gen-idea", data.idea);
    const expRadio = document.querySelector(`input[name="gen-exp-type"][value="${data.expType || "link"}"]`);
    if (expRadio) expRadio.checked = true;
    setVal("gen-experience-url", data.expUrl);
    setVal("gen-experience-desc", data.expDesc);
    setVal("gen-register-url", data.registerUrl);

    // 回填阶段数据并刷新 stage DOM
    if (data.stages && Array.isArray(data.stages) && data.stages.length > 0) {
      _genStages = data.stages.map(s => ({
        label: s.label || "",
        desc: s.desc || "",
        session: s.session || "",
        screenshot: s.screenshot || "",
      }));
      refreshStageDOM();
    }
  } catch (e) { /* 静默失败 */ }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.value = val;
}

// ========== 构建表单 DOM ==========

function renderGeneratorForm(container) {
  container.innerHTML = `
    <div class="generator-layout">
      <div class="generator-form" id="generator-form">
        <div class="generator-section">
          <h3 class="generator-section-title">// 基本信息</h3>
          <div class="gen-field">
            <label class="gen-label">赛道选择 <span class="gen-required">*</span></label>
            <div class="gen-track-options">
              ${["生活娱乐", "学习工作", "社会服务", "硬件交互"].map(t =>
                `<label class="gen-track-option">
                  <input type="radio" name="gen-track" value="${t}">
                  <span class="gen-track-label" style="--track-color:${TRACK_COLORS[t] || '#6b7280'}">${t}</span>
                </label>`
              ).join("")}
              <label class="gen-track-option">
                <input type="checkbox" id="gen-track-public" value="社会公益">
                <span class="gen-track-label" style="--track-color:${TRACK_COLORS['社会公益'] || '#ec4899'}">社会公益（附加/独立赛道）</span>
              </label>
            </div>
          </div>
          <div class="gen-field">
            <label class="gen-label">Demo 名称 <span class="gen-required">*</span></label>
            <input type="text" id="gen-demo-name" class="gen-input" placeholder="例如：AI 智能记账助手">
          </div>
        </div>

        <div class="generator-section">
          <h3 class="generator-section-title">// 自我介绍（惯例）</h3>
          <div class="gen-field">
            <textarea id="gen-intro" class="gen-textarea" rows="3" placeholder="我是谁、技术背景、使用 TRAE 的感受..."></textarea>
            <div class="gen-hint">可选项，但大多数选手都会加这一段来增加亲和力</div>
          </div>
        </div>

        <div class="generator-section">
          <h3 class="generator-section-title">// Demo 简介</h3>
          <div class="gen-field">
            <textarea id="gen-summary" class="gen-textarea" rows="4" placeholder="产品形态（App/小程序/网站/系统/硬件）、面向用户、2-3 个核心功能...${"\n"}建议配截图说明"></textarea>
          </div>
        </div>

        <div class="generator-section">
          <h3 class="generator-section-title">// 创作思路</h3>
          <div class="gen-field">
            <textarea id="gen-idea" class="gen-textarea" rows="4" placeholder="灵感来源、想解决的痛点、为什么选这个方向、竞品分析..."></textarea>
          </div>
        </div>

        <div class="generator-section">
          <h3 class="generator-section-title">// 体验地址</h3>
          <div class="gen-field">
            <div class="gen-experience-type">
              <label class="gen-radio"><input type="radio" name="gen-exp-type" value="link" checked> 在线链接</label>
              <label class="gen-radio"><input type="radio" name="gen-exp-type" value="zip"> Zip 附件</label>
              <label class="gen-radio"><input type="radio" name="gen-exp-type" value="video"> 演示视频</label>
            </div>
            <input type="text" id="gen-experience-url" class="gen-input" placeholder="https://...">
            <input type="text" id="gen-experience-desc" class="gen-input" placeholder="补充说明（可选）">
          </div>
        </div>

        <div class="generator-section">
          <h3 class="generator-section-title">// TRAE 实践过程
            <button class="gen-add-stage-btn" onclick="addGeneratorStage()">+ 添加阶段</button>
          </h3>
          <div class="gen-hint" style="margin-bottom:12px;">你需要准备 >=3 个 Session ID 和 >=3 张截图，分别对应各阶段</div>
          <div id="gen-stages-container">${renderStageForms()}</div>
        </div>

        <div class="generator-section">
          <div class="gen-field">
            <label class="gen-label">已审核通过的报名帖链接</label>
            <input type="text" id="gen-register-url" class="gen-input" placeholder="https://forum.trae.cn/t/xxxxx">
          </div>
        </div>

        <div class="gen-actions">
          <button class="btn btn-primary" onclick="generatePost()">生成提交文案</button>
        </div>
      </div>

      <div class="generator-preview" id="generator-preview">
        <div class="generator-preview-header">
          <span class="generator-preview-title">// 生成预览</span>
          <button class="btn btn-secondary btn-sm" id="gen-copy-btn" onclick="copyGeneratedPost()" style="display:none;">复制全文</button>
        </div>
        <div class="generator-preview-content" id="generator-preview-content">
          <div class="gen-preview-placeholder">填写左侧表单后点击「生成提交文案」预览效果</div>
        </div>
      </div>
    </div>
  `;

  bindGeneratorEvents();
}

// ========== 阶段表单渲染 ==========

function renderStageForms() {
  renumberStages();
  return _genStages.map((stage, idx) => `
    <div class="gen-stage-card" data-stage-index="${idx}">
      <div class="gen-stage-header">
        <span class="gen-stage-number">#${idx + 1}</span>
        <input type="text" class="gen-input gen-stage-name" value="${escapeHtml(stage.label)}" placeholder="阶段名称" data-stage-idx="${idx}" data-field="label">
        <button class="gen-remove-stage-btn" onclick="removeGeneratorStage(${idx})" ${_genStages.length <= 3 ? "disabled" : ""} title="${_genStages.length <= 3 ? "至少保留 3 个阶段" : "删除此阶段"}">×</button>
      </div>
      <div class="gen-stage-body">
        <textarea class="gen-textarea gen-stage-desc" rows="2" placeholder="这个阶段做了什么、遇到什么问题、怎么解决的..." data-stage-idx="${idx}" data-field="desc">${escapeHtml(stage.desc)}</textarea>
        <div class="gen-stage-ids">
          <div class="gen-stage-id-field">
            <label class="gen-hint">Session ID</label>
            <input type="text" class="gen-input gen-session-id" placeholder="Session ID：在 TRAE 中双击对话复制" value="${escapeHtml(stage.session)}" data-stage-idx="${idx}" data-field="session">
          </div>
          <div class="gen-stage-id-field">
            <label class="gen-hint">截图描述</label>
            <input type="text" class="gen-input gen-screenshot-desc" placeholder="例如：TRAE Work 对话界面，显示选题分析过程" value="${escapeHtml(stage.screenshot)}" data-stage-idx="${idx}" data-field="screenshot">
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

function renumberStages() {
  // 按当前顺序重新编号（增删后保持阶段名称与编号一致）
  _genStages.forEach((s, i) => {
    // 如果 label 以"阶段"开头，更新编号
    const match = s.label.match(/^阶段[^：:]*[：:]/);
    if (match) {
      s.label = `阶段${i + 1}：` + s.label.replace(/^阶段[^：:]*[：:]/, "").trim();
    }
  });
}

function refreshStageDOM() {
  const container = document.getElementById("gen-stages-container");
  if (container) {
    container.innerHTML = renderStageForms();
    // 重新绑定阶段字段事件（因为 innerHTML 替换会丢失事件）
    bindGeneratorEvents();
  }
}

// ========== 事件绑定 ==========

function bindGeneratorEvents() {
  // 阶段字段实时同步到 _genStages + 写入 localStorage
  const stagesContainer = document.getElementById("gen-stages-container");
  if (stagesContainer && !stagesContainer._bound) {
    stagesContainer._bound = true;
    stagesContainer.addEventListener("input", (e) => {
      const el = e.target;
      const idx = parseInt(el.dataset.stageIdx, 10);
      const field = el.dataset.field;
      if (!isNaN(idx) && field && _genStages[idx]) {
        _genStages[idx][field] = el.value;
        saveToStorage();
      }
    });
  }

  // 表单字段变化时自动存储
  const form = document.getElementById("generator-form");
  if (form && !form._autoSaveBound) {
    form._autoSaveBound = true;
    form.addEventListener("input", (e) => {
      // 排除阶段字段（已在上面的 stagesContainer 中处理）
      if (e.target.closest("#gen-stages-container")) return;
      saveToStorage();
    });
    form.addEventListener("change", (e) => {
      if (e.target.closest("#gen-stages-container")) return;
      saveToStorage();
    });
  }
}

// ========== 阶段增删 ==========

function addGeneratorStage() {
  const newIdx = _genStages.length + 1;
  _genStages.push({
    label: `阶段${newIdx}`,
    desc: "",
    session: "",
    screenshot: "",
  });
  refreshStageDOM();
  saveToStorage();
}

function removeGeneratorStage(idx) {
  if (_genStages.length <= 3) return;
  _genStages.splice(idx, 1);
  refreshStageDOM();
  saveToStorage();
}

// ========== 文案生成 ==========

function collectFormData() {
  const demoName = document.getElementById("gen-demo-name")?.value.trim() || "";
  const intro = document.getElementById("gen-intro")?.value.trim() || "";

  // 赛道
  const trackRadio = document.querySelector('input[name="gen-track"]:checked');
  const track = trackRadio ? trackRadio.value : "";
  const publicCheck = document.getElementById("gen-track-public");
  const hasPublic = publicCheck?.checked || false;

  // 支持仅选社会公益（不选主赛道 + 勾选社会公益 = 社会公益赛道）
  let tracks = [];
  if (track && hasPublic) {
    tracks = [track, "社会公益"];
  } else if (track) {
    tracks = [track];
  } else if (hasPublic) {
    tracks = ["社会公益"];
  }

  const summary = document.getElementById("gen-summary")?.value.trim() || "";
  const idea = document.getElementById("gen-idea")?.value.trim() || "";

  const expTypeRadio = document.querySelector('input[name="gen-exp-type"]:checked');
  const expType = expTypeRadio ? expTypeRadio.value : "link";
  const expUrl = document.getElementById("gen-experience-url")?.value.trim() || "";
  const expDesc = document.getElementById("gen-experience-desc")?.value.trim() || "";

  const registerUrl = document.getElementById("gen-register-url")?.value.trim() || "";

  return { demoName, intro, tracks, summary, idea, expType, expUrl, expDesc, registerUrl };
}

function generatePost() {
  const data = collectFormData();

  // 验证
  if (data.tracks.length === 0) {
    alert("请选择赛道（可单选社会公益）");
    return;
  }
  if (!data.demoName) {
    alert("请填写 Demo 名称");
    return;
  }

  // 标题
  const trackStr = data.tracks.join("+");
  const title = `【${trackStr}赛道·初赛Demo】${data.demoName}`;

  // 正文
  let body = "";

  if (data.intro) {
    body += `## 先和大家打个招呼\n\n${data.intro}\n\n`;
  }

  body += `## Demo 简介\n\n${data.summary || "（待补充）"}\n\n`;
  body += `## Demo 创作思路\n\n${data.idea || "（待补充）"}\n\n`;

  const expTypeLabel = { link: "在线体验链接", zip: "Zip 附件下载", video: "演示视频链接" }[data.expType];
  body += `## Demo 体验地址\n\n**${expTypeLabel}**：${data.expUrl || "（待补充）"}\n`;
  if (data.expDesc) body += `\n${data.expDesc}\n`;
  body += "\n";

  body += `## TRAE 实践过程\n\n以下是我用 TRAE 完成整个 Demo 开发的完整流程：\n\n`;

  const filledStages = _genStages.filter(s => s.session.trim() || s.desc.trim());
  if (filledStages.length === 0) {
    body += "（请填写至少一个阶段的 Session ID 或描述）\n\n";
  } else {
    filledStages.forEach((stage, idx) => {
      body += `### ${stage.label}\n\n`;
      if (stage.desc.trim()) body += `${stage.desc.trim()}\n\n`;
      body += `**Session ID**：\`${stage.session.trim() || "[请复制 TRAE 中对应对话的 Session ID]"}\`\n\n`;
      body += `📸 ${stage.screenshot.trim() || `（插入截图${idx + 1}）`}\n\n`;
    });
  }

  const allSessions = _genStages.filter(s => s.session.trim()).map(s => s.session.trim());
  if (allSessions.length > 0) {
    body += `### Session ID 汇总\n\n${allSessions.map(sid => `- \`${sid}\``).join("\n")}\n\n`;
  }

  body += `## 报名帖\n\n${data.registerUrl || "（请附上已审核通过的社区报名帖链接）"}\n\n`;

  _genResult = `# ${title}\n\n**赛道标签**：${data.tracks.join("、")}\n\n---\n\n${body}`;

  renderPreview(title, data.tracks, body, data.registerUrl);
}

// ========== 预览渲染 ==========

function renderPreview(title, tracks, body, registerUrl) {
  const previewContent = document.getElementById("generator-preview-content");
  const copyBtn = document.getElementById("gen-copy-btn");
  if (!previewContent) return;

  const trackTagsHtml = tracks.map(t =>
    `<span class="track-pill ${t}">${escapeHtml(t)}</span>`
  ).join(" ");

  const bodyHtml = simpleMarkdownToHtml(body);

  const sessionCount = _genStages.filter(s => s.session.trim()).length;
  const sessionOk = sessionCount >= 3;
  const registerOk = !!registerUrl;

  previewContent.innerHTML = `
    <div class="gen-preview-post">
      <h2 class="gen-preview-title">${escapeHtml(title)}</h2>
      <div class="gen-preview-tags">${trackTagsHtml}</div>
      <div class="gen-preview-divider"></div>
      <div class="gen-preview-body">${bodyHtml}</div>
    </div>

    <div class="gen-checklist">
      <h4>// 发布检查清单</h4>
      <div class="gen-checklist-items">
        <div class="gen-checklist-item">
          <span class="gen-check-icon">${sessionOk ? "✓" : "☐"}</span>
          <span>Session ID 数量：<strong>${sessionCount}</strong> 个（要求 >=3）</span>
        </div>
        <div class="gen-checklist-item">
          <span class="gen-check-icon">☐</span>
          <span>截图数量：至少 3 张，需展示 TRAE 工具界面</span>
        </div>
        <div class="gen-checklist-item">
          <span class="gen-check-icon">${registerOk ? "✓" : "☐"}</span>
          <span>报名帖链接${registerOk ? "已附上" : "未附上"}</span>
        </div>
        <div class="gen-checklist-item">
          <span class="gen-check-icon">☐</span>
          <span>赛道标签与报名赛道一致</span>
        </div>
        <div class="gen-checklist-item">
          <span class="gen-check-icon">⏰</span>
          <span>初赛截止：<strong>2026 年 7 月 15 日</strong></span>
        </div>
      </div>
    </div>
  `;

  if (copyBtn) copyBtn.style.display = "inline-block";
}

function simpleMarkdownToHtml(md) {
  if (!md) return "";

  // 按双换行分割段落，逐块处理避免块级元素嵌套在 <p> 中
  const blocks = md.split(/\n\n+/);
  const htmlBlocks = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return "";

    // 标题
    if (/^### (.+)$/m.test(trimmed)) {
      return `<h4>${trimmed.replace(/^### /, "")}</h4>`;
    }
    if (/^## (.+)$/m.test(trimmed)) {
      return `<h3>${trimmed.replace(/^## /, "")}</h3>`;
    }

    // 无序列表（整块都是列表项）
    if (/^- .+/.test(trimmed) && trimmed.split("\n").every(l => /^- /.test(l) || l.trim() === "")) {
      const items = trimmed.split("\n").filter(l => l.trim()).map(l =>
        `<li>${inlineMarkdown(l.replace(/^- /, ""))}</li>`
      ).join("");
      return `<ul>${items}</ul>`;
    }

    // 分隔线
    if (trimmed === "---") return "<hr>";

    // 普通段落：处理行内格式 + <br> 换行
    const lines = trimmed.split("\n").map(l => inlineMarkdown(l)).join("<br>");
    return `<p>${lines}</p>`;
  });

  return htmlBlocks.filter(Boolean).join("");
}

function inlineMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, '<code class="gen-code">$1</code>');
  html = html.replace(/📸 (.+)/, '<span class="gen-screenshot-mark">📸 $1</span>');
  return html;
}

// ========== 复制功能 ==========

function copyGeneratedPost() {
  if (!_genResult) {
    alert("请先生成文案");
    return;
  }

  navigator.clipboard.writeText(_genResult).then(() => {
    flashCopyBtn();
  }).catch(() => {
    // 降级方案
    const textarea = document.createElement("textarea");
    textarea.value = _genResult;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    flashCopyBtn();
  });
}

function flashCopyBtn() {
  const btn = document.getElementById("gen-copy-btn");
  if (!btn) return;
  const origText = btn.textContent;
  btn.textContent = "已复制!";
  btn.classList.add("copied");
  setTimeout(() => {
    btn.textContent = origText;
    btn.classList.remove("copied");
  }, 2000);
}
