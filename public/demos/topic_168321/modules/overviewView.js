import { appStore } from "./appStore.js";
import { escapeHtml, getProjectCompleteness, getProjectStageMeta, getProjectStages, statCard } from "./utils.js";

export function renderOverviewView() {
  const { project, projects } = appStore.getState();
  if (!project) return;
  const stage = getProjectStageMeta(project);
  const completeness = getProjectCompleteness(project);
  const nextStep = getNextStepConfig(project);
  const projectHeroMeta = document.getElementById("projectHeroMeta");
  if (projectHeroMeta) {
    projectHeroMeta.innerHTML = [
      `<span class="progress-pill">${escapeHtml(stage.label)}</span>`,
      `<span class="progress-pill">${escapeHtml(String(completeness))}% 完整度</span>`,
    ].join("");
  }
  document.getElementById("projectMeta").innerHTML = [
    renderMetaCard("项目 ID", `<code>${escapeHtml(project.id)}</code>`),
    renderMetaCard("版本", escapeHtml(String(project.version || 0))),
    renderMetaCard("当前环节", escapeHtml(stage.label)),
    renderMetaCard("完整性", `${escapeHtml(String(completeness))}%`),
  ].join("");
  document.getElementById("projectStageFlow").innerHTML = renderProjectStageFlow(project);
  document.getElementById("projectProgressSummary").innerHTML = [
    `<div class="task-entry progress-card"><strong>${escapeHtml(project.name || project.id)}</strong><span class="progress-pill">${escapeHtml(stage.label)}</span><div class="muted">当前项目完整性 ${escapeHtml(String(completeness))}% · 角色 ${escapeHtml(String(project.assets?.characters?.length || 0))} · 镜头 ${escapeHtml(String(project.shots?.length || 0))} · 分镜组 ${escapeHtml(String(project.storyboards?.length || 0))}</div></div>`,
  ].join("");
  document.getElementById("overviewMomentum").innerHTML = renderMomentumCards(project, completeness);
  document.getElementById("overviewNextStep").innerHTML = renderNextStepCard(nextStep);
  document.getElementById("overviewPipelineHealth").innerHTML = renderPipelineHealth(project);
  document.getElementById("allProjectsProgress").innerHTML = projects
    .map((item) => {
      const itemStage = getProjectStageMeta(item);
      const itemCompleteness = getProjectCompleteness(item);
      const isActive = item.id === project.id;
      return [
        `<div class="task-entry progress-card${isActive ? " progress-card-active" : ""}">`,
        `<div class="progress-row"><strong>${escapeHtml(item.name || item.id)}</strong><span class="progress-pill">${escapeHtml(itemStage.label)}</span></div>`,
        `<div class="muted">完整性 ${escapeHtml(String(itemCompleteness))}% · 资产 ${escapeHtml(String(item.counts?.assets || 0))} · 镜头 ${escapeHtml(String(item.counts?.shots || 0))} · 分镜组 ${escapeHtml(String(item.counts?.storyboards || 0))} · 提示词 ${escapeHtml(String(item.counts?.videoPrompts || 0))}</div>`,
        `</div>`,
      ].join("");
    })
    .join("");
  document.getElementById("overviewStats").innerHTML = [
    statCard("角色", project.assets?.characters?.length || 0),
    statCard("镜头", project.shots?.length || 0),
    statCard("分镜组", project.storyboards?.length || 0),
  ].join("");
}

function renderProjectStageFlow(project) {
  const activeStep = Number(getProjectStageMeta(project).step || 1);
  const stages = getProjectStages();
  return [
    `<div class="stage-flow-head"><strong>当前环节流程</strong><span class="progress-pill">${escapeHtml(getProjectStageMeta(project).label)}</span></div>`,
    `<div class="stage-flow">`,
    ...stages.map((stage, index) => {
      const statusClass = stage.step < activeStep
        ? "stage-done"
        : stage.step === activeStep
          ? "stage-active"
          : "stage-pending";
      const connector = index < stages.length - 1 ? `<div class="stage-connector ${stage.step < activeStep ? "stage-connector-done" : ""}"></div>` : "";
      return [
        `<div class="stage-item-wrap">`,
        `<div class="stage-item ${statusClass}">`,
        `<span class="stage-dot">${escapeHtml(String(stage.step))}</span>`,
        `<span class="stage-label">${escapeHtml(stage.label)}</span>`,
        `</div>`,
        connector,
        `</div>`,
      ].join("");
    }),
    `</div>`,
  ].join("");
}

function renderMetaCard(label, value) {
  return [
    `<div class="overview-meta-card">`,
    `<span class="overview-meta-label">${label}</span>`,
    `<strong class="overview-meta-value">${value}</strong>`,
    `</div>`,
  ].join("");
}

function renderMomentumCards(project, completeness) {
  const scriptReady = Boolean(String(project.script || "").trim());
  const assetCount = Number(project.assets?.characters?.length || 0) + Number(project.assets?.scenes?.length || 0) + Number(project.assets?.props?.length || 0);
  const boardCount = Number(project.storyboards?.length || 0);
  return [
    renderMomentumCard("推进节奏", `${completeness >= 67 ? "进入成片区" : "还在搭建中"}`, `${escapeHtml(String(completeness))}% 完整度，当前阶段为 ${escapeHtml(getProjectStageMeta(project).label)}。`),
    renderMomentumCard("剧本基础", scriptReady ? "已具备" : "待补齐", scriptReady ? "已经有可继续沉淀资产与分镜的叙事基础。" : "先把一句话创意扩成完整剧本，后续环节会更稳定。"),
    renderMomentumCard("视觉素材", `${assetCount} 项`, assetCount ? "角色、场景和道具已经开始成型。" : "还没有抽取出角色、场景或道具。"),
    renderMomentumCard("出片单元", `${boardCount} 组`, boardCount ? "可以继续补全提示词并进入批任务。" : "建议先补齐第一批分镜组，形成可执行单元。"),
  ].join("");
}

function renderMomentumCard(label, value, detail) {
  return [
    `<div class="overview-momentum-card">`,
    `<span class="overview-momentum-label">${escapeHtml(label)}</span>`,
    `<strong class="overview-momentum-value">${escapeHtml(value)}</strong>`,
    `<div class="muted">${escapeHtml(detail)}</div>`,
    `</div>`,
  ].join("");
}

function renderNextStepCard(nextStep) {
  const readinessCount = (nextStep.readiness || []).filter((item) => item.ok).length;
  return [
    `<div class="overview-next-card">`,
    `<div class="overview-next-head">`,
    `<span class="overview-step-index">0${escapeHtml(String(nextStep.priority || 1))}</span>`,
    `<div class="overview-next-copy">`,
    `<span class="overview-next-label">${escapeHtml(nextStep.kicker)}</span>`,
    `<strong class="overview-next-title">${escapeHtml(nextStep.title)}</strong>`,
    `<div class="muted">${escapeHtml(nextStep.description)}</div>`,
    `</div>`,
    `</div>`,
    `<div class="overview-next-plan">`,
    ...(nextStep.steps || []).map((step, index) => [
      `<div class="overview-step-row">`,
      `<span class="overview-step-badge">${index + 1}</span>`,
      `<div><strong>${escapeHtml(step.title)}</strong><div class="muted">${escapeHtml(step.detail)}</div></div>`,
      `</div>`,
    ].join("")),
    `</div>`,
    `<div class="overview-next-readiness">`,
    `<div class="overview-next-readiness-head"><strong>执行前检查</strong><span class="progress-pill">${readinessCount}/${escapeHtml(String((nextStep.readiness || []).length || 0))} 已就绪</span></div>`,
    ...(nextStep.readiness || []).map((item) => [
      `<div class="overview-readiness-item ${item.ok ? "overview-readiness-good" : "overview-readiness-warn"}">`,
      `<span>${item.ok ? "已具备" : "待补齐"}</span>`,
      `<strong>${escapeHtml(item.label)}</strong>`,
      `</div>`,
    ].join("")),
    `</div>`,
    `<div class="overview-next-actions">`,
    `<button class="primary-btn" type="button" data-trigger-id="${escapeHtml(nextStep.triggerId)}">${escapeHtml(nextStep.buttonLabel)}</button>`,
    `<button class="ghost-btn" type="button" data-go-page="${escapeHtml(nextStep.page)}">前往${escapeHtml(nextStep.pageLabel)}</button>`,
    `</div>`,
    `</div>`,
  ].join("");
}

function renderPipelineHealth(project) {
  const items = [
    createHealthItem("创意", Boolean(String(project.idea || "").trim()), "创意已填写", "先补一句话创意"),
    createHealthItem("剧本", Boolean(String(project.script || "").trim()), "剧本已生成", "还没有剧本正文"),
    createHealthItem(
      "资产",
      Number(project.assets?.characters?.length || 0) + Number(project.assets?.scenes?.length || 0) + Number(project.assets?.props?.length || 0) > 0,
      "资产清单已建立",
      "还没有角色/场景/道具",
    ),
    createHealthItem("分镜", Number(project.storyboards?.length || 0) > 0, "已有分镜组", "还没有分镜组"),
  ];
  return items
    .map(
      (item) => [
        `<div class="overview-health-card ${item.ok ? "overview-health-good" : "overview-health-warn"}">`,
        `<span class="overview-health-label">${escapeHtml(item.label)}</span>`,
        `<strong class="overview-health-value">${escapeHtml(item.text)}</strong>`,
        `</div>`,
      ].join(""),
    )
    .join("");
}

function createHealthItem(label, ok, goodText, warnText) {
  return {
    label,
    ok,
    text: ok ? goodText : warnText,
  };
}

function getNextStepConfig(project) {
  if (!String(project.idea || "").trim() || !String(project.script || "").trim()) {
    return {
      priority: 1,
      kicker: "建议优先完成",
      title: "先把项目创意扩展成剧本",
      description: "剧本是后续资产抽取、镜头规划和分镜生成的主叙事锚点。",
      buttonLabel: "生成剧本",
      triggerId: "generateScriptBtn",
      page: "script",
      pageLabel: "剧本页",
      steps: [
        { title: "确认一句话创意", detail: "先把题材、主角和冲突讲清楚，避免后续资产方向漂移。" },
        { title: "生成并扫读剧本", detail: "优先看三幕结构是否成立，再进入资产抽取。" },
        { title: "保存当前项目", detail: "把剧本版本固定下来，后续镜头和分镜更容易追溯。" },
      ],
      readiness: [
        { label: "一句话创意", ok: Boolean(String(project.idea || "").trim()) },
        { label: "剧本正文", ok: Boolean(String(project.script || "").trim()) },
        { label: "项目名称", ok: Boolean(String(project.name || "").trim()) },
      ],
    };
  }

  const assetCount = Number(project.assets?.characters?.length || 0) + Number(project.assets?.scenes?.length || 0) + Number(project.assets?.props?.length || 0);
  if (!assetCount) {
    return {
      priority: 2,
      kicker: "建议优先完成",
      title: "从剧本中抽取角色、场景和道具",
      description: "先把视觉元素沉淀出来，分镜和提示词质量会明显更稳。",
      buttonLabel: "抽取资产",
      triggerId: "extractAssetsBtn",
      page: "assets",
      pageLabel: "资产页",
      steps: [
        { title: "生成基础资产清单", detail: "先把角色、场景、道具拆出来，形成视觉最小集。" },
        { title: "快速扫一遍缺口", detail: "确认是否缺主角、关键空间或叙事道具。" },
        { title: "带着资产进入分镜", detail: "有了视觉锚点，再补分镜和提示词会更稳。" },
      ],
      readiness: [
        { label: "剧本正文", ok: Boolean(String(project.script || "").trim()) },
        { label: "角色/场景/道具", ok: assetCount > 0 },
        { label: "镜头清单", ok: Number(project.shots?.length || 0) > 0 },
      ],
    };
  }

  if (!Number(project.storyboards?.length || 0)) {
    return {
      priority: 3,
      kicker: "推荐进入",
      title: "补齐第一批分镜组",
      description: "形成可执行画面单元后，就可以继续批量补提示词与视频生成。",
      buttonLabel: "补齐分镜组",
      triggerId: "seedStoryboardsBtn",
      page: "storyboards",
      pageLabel: "分镜页",
      steps: [
        { title: "按镜头生成首批分镜", detail: "先把镜头变成可执行卡片，减少后面来回切页。" },
        { title: "优先补关键镜头", detail: "先覆盖开场、转折和结尾，确认视觉节奏没有跑偏。" },
        { title: "再统一生成提示词", detail: "分镜稳定后再批量补提示词，返工成本更低。" },
      ],
      readiness: [
        { label: "资产清单", ok: assetCount > 0 },
        { label: "镜头数量", ok: Number(project.shots?.length || 0) > 0 },
        { label: "分镜组", ok: Number(project.storyboards?.length || 0) > 0 },
      ],
    };
  }

  const promptCount = Number(project.videoPrompts?.length || 0) || (project.storyboards || []).filter((board) => String(board.videoPrompt || "").trim()).length;
  if (!promptCount) {
    return {
      priority: 4,
      kicker: "推荐进入",
      title: "为分镜组生成视频提示词",
      description: "提示词补齐后，当前项目就具备了更完整的出片准备度。",
      buttonLabel: "生成提示词",
      triggerId: "generateVideoPromptsBtn",
      page: "storyboards",
      pageLabel: "分镜页",
      steps: [
        { title: "先筛出未写提示词的分镜", detail: "优先补齐空白卡，避免批任务时混入半成品。" },
        { title: "统一检查镜头语言", detail: "确认景别、动作、风格词都足够清晰。" },
        { title: "准备进入批量出片", detail: "提示词齐备后再测试视频 provider，启动更稳。" },
      ],
      readiness: [
        { label: "分镜组", ok: Number(project.storyboards?.length || 0) > 0 },
        { label: "视频提示词", ok: promptCount > 0 },
        { label: "参考图", ok: (project.storyboards || []).some((board) => Boolean(board.imageUrl)) },
      ],
    };
  }

  return {
    priority: 5,
    kicker: "可以开始",
    title: "启动当前项目的批量出片任务",
    description: "前序内容已基本到位，建议先检查视频模型连接，再开始批任务。",
    buttonLabel: "开始批任务",
    triggerId: "startBatchBtn",
    page: "batch",
    pageLabel: "批任务页",
    steps: [
      { title: "确认视频配置", detail: "先看 provider、model 和批任务参数是否与当前项目一致。" },
      { title: "补看未完成分镜", detail: "优先排掉无图、无提示词或未出视频的卡片。" },
      { title: "启动后盯失败回流", detail: "先观察失败任务和日志聚合视图，及时处理异常。" },
    ],
    readiness: [
      { label: "分镜组", ok: Number(project.storyboards?.length || 0) > 0 },
      { label: "视频提示词", ok: promptCount > 0 },
      { label: "视频结果", ok: (project.storyboards || []).some((board) => Boolean(board.videoUrl)) },
    ],
  };
}
