import { appStore } from "./appStore.js";
import { fetchSettings, saveSettingsRecord, testSettingsConnection } from "./settingsPersistence.js";
import { showToast } from "./toast.js";
import { renderPageSummaries } from "./ui.js";
import { escapeHtml } from "./utils.js";

const PANEL_STATE_KEY = "qd_provider_panels";

const SLOT_FIELDS = {
  text: ["base", "key", "model", "adapter"],
  image: ["base", "key", "model", "provider"],
  multimodal: ["base", "key", "model", "adapter"],
  video: ["base", "key", "model", "adapter"],
};

const PRESET_META = {
  text: {
    openai_compat: {
      brand: "OpenAI Compat",
      className: "brand-openai",
      description: "适合直接接 OpenAI 或兼容网关，配置成本低，适合剧本生成与 Agent 对话。",
      notes: "推荐填写 Base URL、API Key、Model；适合先跑通流程，再按成本和效果切换。",
      defaults: { base: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
      models: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"],
    },
    openrouter: {
      brand: "OpenRouter",
      className: "brand-openrouter",
      description: "适合做统一路由层，一套密钥切换多家模型，便于实验不同文本模型。",
      notes: "推荐填写 OpenRouter Base、Key 和具体模型名，适合需要频繁 AB 测试的场景。",
      defaults: { base: "https://openrouter.ai/api/v1", model: "openai/gpt-4.1-mini" },
      models: ["openai/gpt-4.1-mini", "anthropic/claude-3.7-sonnet", "google/gemini-2.0-flash-001"],
    },
    anthropic: {
      brand: "Anthropic",
      className: "brand-anthropic",
      description: "适合长文本写作、润色和稳态对话场景。",
      notes: "如果你有直连 Anthropic 的代理或网关，可直接填入其 Base 和模型名。",
      defaults: { base: "https://api.anthropic.com/v1", model: "claude-3-7-sonnet-latest" },
      models: ["claude-3-7-sonnet-latest", "claude-3-5-sonnet-latest", "claude-3-5-haiku-latest"],
    },
    gemini: {
      brand: "Gemini",
      className: "brand-gemini",
      description: "适合长上下文、资料归纳和轻量文本生成。",
      notes: "常见于 Google 生态或兼容代理，适合和多模态链路共用同一供应商。",
      defaults: { base: "https://generativelanguage.googleapis.com", model: "gemini-2.0-flash" },
      models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    },
    deepseek: {
      brand: "DeepSeek",
      className: "brand-deepseek",
      description: "适合中文写作、代码辅助和成本敏感场景。",
      notes: "可直接接 DeepSeek 或兼容中转，通常适合作为文本备选主力模型。",
      defaults: { base: "https://api.deepseek.com/v1", model: "deepseek-chat" },
      models: ["deepseek-chat", "deepseek-reasoner"],
    },
    qwen: {
      brand: "Qwen",
      className: "brand-qwen",
      description: "适合中文生成、结构化输出和阿里云生态部署。",
      notes: "如果通过百炼兼容层接入，建议优先填写兼容 Base URL 与明确模型名。",
      defaults: { base: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" },
      models: ["qwen-plus", "qwen-turbo", "qwen-max"],
    },
    siliconflow: {
      brand: "SiliconFlow",
      className: "brand-siliconflow",
      description: "适合低门槛接入开源或聚合模型，方便做成本优化。",
      notes: "适合把多个开源模型纳入同一配置入口，常见于实验性文本链路。",
      defaults: { base: "https://api.siliconflow.cn/v1", model: "Qwen/Qwen2.5-72B-Instruct" },
      models: ["Qwen/Qwen2.5-72B-Instruct", "deepseek-ai/DeepSeek-V3", "meta-llama/Llama-3.3-70B-Instruct"],
    },
    custom: {
      brand: "Custom",
      className: "brand-custom",
      description: "自定义文本适配器，适合接内网网关、私有代理或实验服务。",
      notes: "至少填写自定义 Base 和 Model；如果走鉴权，还需要 API Key。",
      defaults: { base: "", model: "" },
      models: [],
    },
  },
  image: {
    openai_compat: {
      brand: "OpenAI Image",
      className: "brand-openai",
      description: "适合标准图像生成接口，部署和调试成本最低。",
      notes: "如果你只是先跑通角色图和分镜图，OpenAI 兼容接口通常最省事。",
      defaults: { base: "https://api.nic4.ai/v1", model: "gpt-image-2" },
      models: ["gpt-image-2"],
    },
    gemini: {
      brand: "Gemini",
      className: "brand-gemini",
      description: "适合 Gemini 图像理解/生成一体链路，便于和多模态共用配置。",
      notes: "推荐填写 Gemini 网关地址、Key 和目标模型；注意接口路径格式。",
      defaults: { base: "https://generativelanguage.googleapis.com", model: "gemini-2.0-flash-preview-image-generation" },
      models: ["gemini-2.0-flash-preview-image-generation", "gemini-2.0-flash-exp"],
    },
    flux: {
      brand: "FLUX",
      className: "brand-flux",
      description: "适合高质量静态图生成，常见于第三方聚合平台或开源部署。",
      notes: "如果你的图像链路偏海报、角色设定和概念图，FLUX 通常是很好的备选。",
      defaults: { base: "https://api.siliconflow.cn/v1", model: "black-forest-labs/FLUX.1-schnell" },
      models: ["black-forest-labs/FLUX.1-schnell", "black-forest-labs/FLUX.1-dev"],
    },
    qwen: {
      brand: "Qwen Vision",
      className: "brand-qwen",
      description: "适合阿里系图像理解或图文联动场景。",
      notes: "更适合做图像理解或视觉问答，如果你的代理已兼容图片生成也可以统一接入。",
      defaults: { base: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-vl-max" },
      models: ["qwen-vl-max", "qwen-vl-plus"],
    },
    siliconflow: {
      brand: "SiliconFlow",
      className: "brand-siliconflow",
      description: "适合把开源图像模型统一纳入同一个 provider 配置层。",
      notes: "如果你同时试多个图像模型，这个入口会比手改 Base/Model 更省事。",
      defaults: { base: "https://api.siliconflow.cn/v1", model: "black-forest-labs/FLUX.1-schnell" },
      models: ["black-forest-labs/FLUX.1-schnell", "stabilityai/stable-diffusion-3.5-large"],
    },
    custom: {
      brand: "Custom",
      className: "brand-custom",
      description: "自定义图片 provider，适合接第三方图像平台。",
      notes: "建议至少提供 Base、Key 和 Model，并确认返回格式与现有流程兼容。",
      defaults: { base: "", model: "" },
      models: [],
    },
  },
  multimodal: {
    openai_compat: {
      brand: "OpenAI MM",
      className: "brand-openai",
      description: "适合图文混合理解、参考图分析和复杂多模态问答。",
      notes: "常用于角色图理解、镜头补全和提示词构建，是比较稳的默认选项。",
      defaults: { base: "https://api.openai.com/v1", model: "gpt-4.1" },
      models: ["gpt-4.1", "gpt-4o", "gpt-4o-mini"],
    },
    openrouter: {
      brand: "OpenRouter",
      className: "brand-openrouter",
      description: "适合把多家的视觉模型集中在一个入口里切换。",
      notes: "如果你希望快速比较不同视觉模型效果，OpenRouter 这一层会很方便。",
      defaults: { base: "https://openrouter.ai/api/v1", model: "google/gemini-2.0-flash-001" },
      models: ["google/gemini-2.0-flash-001", "openai/gpt-4o", "anthropic/claude-3.7-sonnet"],
    },
    anthropic: {
      brand: "Anthropic",
      className: "brand-anthropic",
      description: "适合理解参考图、做复杂视觉推理和细节描述。",
      notes: "如果你的任务更偏图像理解而非生成，Anthropic 多模态可以作为强备选。",
      defaults: { base: "https://api.anthropic.com/v1", model: "claude-3-7-sonnet-latest" },
      models: ["claude-3-7-sonnet-latest", "claude-3-5-sonnet-latest"],
    },
    gemini: {
      brand: "Gemini MM",
      className: "brand-gemini",
      description: "适合长上下文和多模态理解场景。",
      notes: "推荐填写 Gemini Base、Key 和多模态模型，如 gemini-2.0-flash。",
      defaults: { base: "https://generativelanguage.googleapis.com", model: "gemini-2.0-flash" },
      models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    },
    qwen: {
      brand: "Qwen VL",
      className: "brand-qwen",
      description: "适合中文视觉问答、OCR 辅助和结构化图像理解。",
      notes: "如果你的视频生产链路中文内容较多，Qwen 的视觉模型会更贴近中文工作流。",
      defaults: { base: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-vl-max" },
      models: ["qwen-vl-max", "qwen-vl-plus"],
    },
    siliconflow: {
      brand: "SiliconFlow",
      className: "brand-siliconflow",
      description: "适合接多种开源视觉模型或聚合供应商。",
      notes: "更适合做低成本实验链路，正式生产前建议单独做兼容性验证。",
      defaults: { base: "https://api.siliconflow.cn/v1", model: "Qwen/Qwen2.5-VL-72B-Instruct" },
      models: ["Qwen/Qwen2.5-VL-72B-Instruct", "OpenGVLab/InternVL2_5-78B"],
    },
    custom: {
      brand: "Custom",
      className: "brand-custom",
      description: "自定义多模态适配器，可接私有视觉模型网关。",
      notes: "建议同时校验图片 URL 可访问性与多模态模型的消息格式兼容性。",
      defaults: { base: "", model: "" },
      models: [],
    },
  },
  video: {
    kling: {
      brand: "Kling",
      className: "brand-kling",
      description: "可灵视频接口，适合 text-to-video 主流程。",
      notes: "推荐填写 Kling Base、Key 和模型名，如 kling-v2；适合当前批量视频主链。",
      defaults: { base: "https://api.klingai.com", model: "kling-v2" },
      models: ["kling-v2", "kling-v1.6"],
    },
    seedance: {
      brand: "Seedance",
      className: "brand-seedance",
      description: "Seedance/豆包视频通道，适合快速批量视频生成。",
      notes: "推荐填写火山/代理 Base 和对应视频模型；注意 batch alias 可单独选 seedance-fast。",
      defaults: { base: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seedance-2-0" },
      models: ["doubao-seedance-2-0", "doubao-seedance-lite"],
    },
    hailuo: {
      brand: "Hailuo",
      className: "brand-hailuo",
      description: "海螺视频通道，适合 Minimax 生态接入。",
      notes: "推荐填写 Minimax Base、Key 和 video 模型名；注意 task 查询路径通常不同。",
      defaults: { base: "https://api.minimax.chat", model: "video-01" },
      models: ["video-01"],
    },
    runway: {
      brand: "Runway",
      className: "brand-runway",
      description: "Runway 风格接口，偏 image-to-video 工作流。",
      notes: "适合有首帧图或参考帧的场景，建议同时规划 image-to-video 输入。",
      defaults: { base: "https://api.runwayml.com", model: "gen4_turbo" },
      models: ["gen4_turbo", "gen3a_turbo"],
    },
    vidu: {
      brand: "Vidu",
      className: "brand-vidu",
      description: "Vidu 视频通道，适合国产视频生成链路。",
      notes: "推荐填写 Vidu Base、Key 和模型名，如 vidu-2.0。",
      defaults: { base: "https://api.vidu.com", model: "vidu-2.0" },
      models: ["vidu-2.0", "vidu-1.5"],
    },
    veo: {
      brand: "Veo",
      className: "brand-veo",
      description: "适合高阶视频生成实验链路，常见于 Google 生态或代理层。",
      notes: "如果你已经有代理支持 Veo 类接口，这里可以直接作为独立视频槽位来管理。",
      defaults: { base: "https://generativelanguage.googleapis.com", model: "veo-2" },
      models: ["veo-2"],
    },
    wanx: {
      brand: "Wanx",
      className: "brand-wanx",
      description: "适合阿里系视频生成通道或兼容网关接入。",
      notes: "更适合已经在百炼或自建兼容层上统一管理视频模型的团队。",
      defaults: { base: "https://dashscope.aliyuncs.com/api/v1", model: "wanx2.1-t2v-plus" },
      models: ["wanx2.1-t2v-plus", "wanx2.1-i2v-plus"],
    },
    openai_compat: {
      brand: "OpenAI Compat",
      className: "brand-openai",
      description: "通用 OpenAI 兼容视频接口，适合中转和代理层。",
      notes: "适合统一接 OpenAI 风格视频 API 或自建协议转换层。",
      defaults: { base: "https://api.openai.com/v1", model: "video-gen-compatible" },
      models: ["video-gen-compatible"],
    },
    custom: {
      brand: "Custom",
      className: "brand-custom",
      description: "自定义视频适配器，适合接内部执行器或实验模型。",
      notes: "建议确认 submit/poll 协议、视频结果 URL、任务状态枚举都能与现有批任务适配。",
      defaults: { base: "", model: "" },
      models: [],
    },
  },
};

const ALL_SLOTS = ["text", "image", "multimodal", "video"];
const DEFAULT_PROFILE_ID = "profile_default";
const DEFAULT_PROFILE_NAME = "默认配置";
const TEMPLATE_PRESETS = [
  {
    id: "starter",
    name: "快速起步",
    description: "统一走 OpenAI 兼容链路，先把文本、出图和视频流程跑通。",
    apply() {
      return {
        models: {
          text: { adapter: "openai_compat", base: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
          image: { provider: "openai_compat", base: "https://api.nic4.ai/v1", model: "gpt-image-2" },
          multimodal: { adapter: "openai_compat", base: "https://api.openai.com/v1", model: "gpt-4.1" },
          video: { adapter: "kling", base: "https://api.klingai.com", model: "kling-v2" },
        },
        videoBatch: { videoModel: "kling", videoRatio: "16:9", videoQuality: "720p", requireVideoTest: true },
      };
    },
  },
  {
    id: "experiment",
    name: "多供应商实验",
    description: "文本和多模态走聚合层，图片与视频保留独立 provider，方便快速 AB。",
    apply() {
      return {
        models: {
          text: { adapter: "openrouter", base: "https://openrouter.ai/api/v1", model: "openai/gpt-4.1-mini" },
          image: { provider: "flux", base: "https://api.siliconflow.cn/v1", model: "black-forest-labs/FLUX.1-schnell" },
          multimodal: { adapter: "openrouter", base: "https://openrouter.ai/api/v1", model: "google/gemini-2.0-flash-001" },
          video: { adapter: "seedance", base: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seedance-2-0" },
        },
        videoBatch: { videoModel: "seedance", videoRatio: "16:9", videoQuality: "1080p", requireVideoTest: true },
      };
    },
  },
  {
    id: "safe-delivery",
    name: "稳妥出片",
    description: "优先减少批任务风险，保留测试门禁和标准画幅，适合正式执行。",
    apply() {
      return {
        models: {
          text: { adapter: "deepseek", base: "https://api.deepseek.com/v1", model: "deepseek-chat" },
          image: { provider: "openai_compat", base: "https://api.nic4.ai/v1", model: "gpt-image-2" },
          multimodal: { adapter: "gemini", base: "https://generativelanguage.googleapis.com", model: "gemini-2.0-flash" },
          video: { adapter: "kling", base: "https://api.klingai.com", model: "kling-v2" },
        },
        videoBatch: { videoModel: "kling", videoRatio: "16:9", videoQuality: "1080p", requireVideoTest: true, watermark: true },
      };
    },
  },
];

function defaultModels() {
  return {
    text: { key: "", base: "https://api.openai.com/v1", model: "gpt-4.1-mini", adapter: "openai_compat" },
    image: { key: "", base: "https://api.nic4.ai/v1", model: "kling", provider: "openai_compat" },
    multimodal: { key: "", base: "https://api.openai.com/v1", model: "gpt-4.1", adapter: "openai_compat" },
    video: { key: "", base: "https://api.klingai.com", model: "kling-v2", adapter: "kling" },
  };
}

function defaultVideoBatch() {
  return {
    videoModel: "kling",
    videoRatio: "16:9",
    videoQuality: "720p",
    genAudio: false,
    watermark: true,
    requireVideoTest: false,
  };
}

function mergeModels(base = {}, next = {}) {
  return {
    ...base,
    ...next,
    text: { ...(base.text || {}), ...((next && next.text) || {}) },
    image: { ...(base.image || {}), ...((next && next.image) || {}) },
    multimodal: { ...(base.multimodal || {}), ...((next && next.multimodal) || {}) },
    video: { ...(base.video || {}), ...((next && next.video) || {}) },
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function createProfileSnapshot(source = {}) {
  return {
    models: mergeModels(defaultModels(), source.models || {}),
    videoBatch: { ...defaultVideoBatch(), ...(source.videoBatch || {}) },
    connectionTests: { ...(source.connectionTests || {}) },
  };
}

function normalizeProfile(profile, index = 0, fallbackSource = {}) {
  const snapshot = createProfileSnapshot({
    models: profile?.models || fallbackSource.models,
    videoBatch: profile?.videoBatch || fallbackSource.videoBatch,
    connectionTests: profile?.connectionTests || fallbackSource.connectionTests,
  });
  return {
    id: String(profile?.id || `${DEFAULT_PROFILE_ID}_${index + 1}`),
    name: String(profile?.name || `${DEFAULT_PROFILE_NAME}${index ? ` ${index + 1}` : ""}`),
    createdAt: Number(profile?.createdAt || Date.now()),
    updatedAt: Number(profile?.updatedAt || Date.now()),
    ...snapshot,
  };
}

function normalizeSettings(raw = {}) {
  const fallbackSnapshot = createProfileSnapshot(raw);
  const rawProfiles = Array.isArray(raw?.profiles) && raw.profiles.length
    ? raw.profiles
    : [{
      id: raw?.activeProfileId || DEFAULT_PROFILE_ID,
      name: DEFAULT_PROFILE_NAME,
      ...fallbackSnapshot,
    }];
  const profiles = rawProfiles.map((profile, index) => normalizeProfile(profile, index, fallbackSnapshot));
  const activeProfileId = profiles.some((profile) => profile.id === raw?.activeProfileId)
    ? raw.activeProfileId
    : profiles[0].id;
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) || profiles[0];
  return {
    activeProfileId,
    models: mergeModels(defaultModels(), activeProfile?.models || fallbackSnapshot.models),
    videoBatch: { ...defaultVideoBatch(), ...(activeProfile?.videoBatch || fallbackSnapshot.videoBatch) },
    connectionTests: { ...(activeProfile?.connectionTests || fallbackSnapshot.connectionTests) },
    profiles,
  };
}

function syncActiveProfileSnapshot(settings) {
  const normalized = normalizeSettings(settings);
  const profiles = normalized.profiles.map((profile) => (
    profile.id === normalized.activeProfileId
      ? {
        ...profile,
        models: cloneJson(normalized.models),
        videoBatch: cloneJson(normalized.videoBatch),
        connectionTests: cloneJson(normalized.connectionTests || {}),
        updatedAt: Date.now(),
      }
      : profile
  ));
  return normalizeSettings({
    ...normalized,
    profiles,
  });
}

function activateProfile(settings, profileId) {
  const normalized = normalizeSettings(settings);
  const activeProfile = normalized.profiles.find((profile) => profile.id === profileId) || normalized.profiles[0];
  return normalizeSettings({
    ...normalized,
    activeProfileId: activeProfile.id,
    models: cloneJson(activeProfile.models),
    videoBatch: cloneJson(activeProfile.videoBatch),
    connectionTests: cloneJson(activeProfile.connectionTests || {}),
  });
}

function profileLabel(index) {
  return `${DEFAULT_PROFILE_NAME} ${index + 1}`;
}

function nextProfileName(settings) {
  const taken = new Set((settings.profiles || []).map((profile) => profile.name));
  let index = 0;
  let candidate = DEFAULT_PROFILE_NAME;
  while (taken.has(candidate)) {
    candidate = profileLabel(index);
    index += 1;
  }
  return candidate;
}

function createProfileId() {
  return `profile_${Math.random().toString(36).slice(2, 10)}`;
}

export async function loadSettings() {
  const settings = normalizeSettings(await fetchSettings());
  appStore.setSettings(settings);
  renderSettingsToDom();
  return settings;
}

export function readSettingsFromDom() {
  const current = normalizeSettings(appStore.getState().settings);
  const nextSettings = syncActiveProfileSnapshot({
    ...current,
    models: {
      text: readSlot("text"),
      image: readSlot("image"),
      multimodal: readSlot("multimodal"),
      video: readSlot("video"),
    },
    videoBatch: {
      videoModel: document.getElementById("videoModel").value,
      videoRatio: document.getElementById("videoRatio").value,
      videoQuality: document.getElementById("videoQuality").value,
      genAudio: document.getElementById("genAudio").checked,
      watermark: document.getElementById("watermark").checked,
      requireVideoTest: document.getElementById("requireVideoTest").checked,
    },
  });
  appStore.setSettings(nextSettings);
  renderProfileControls();
  renderPresetHelp();
  renderModelSuggestions();
  renderRecentTestSummaries();
  renderTemplatePresets();
  renderRiskSummary();
  renderEffectiveVideoConfig();
  renderBatchGateStatus();
  return nextSettings;
}

export function renderSettingsToDom() {
  const settings = normalizeSettings(appStore.getState().settings);
  renderSlot("text", settings.models.text);
  renderSlot("image", settings.models.image);
  renderSlot("multimodal", settings.models.multimodal);
  renderSlot("video", settings.models.video);
  document.getElementById("videoModel").value = settings.videoBatch.videoModel;
  document.getElementById("videoRatio").value = settings.videoBatch.videoRatio;
  document.getElementById("videoQuality").value = settings.videoBatch.videoQuality;
  document.getElementById("genAudio").checked = Boolean(settings.videoBatch.genAudio);
  document.getElementById("watermark").checked = Boolean(settings.videoBatch.watermark);
  document.getElementById("requireVideoTest").checked = Boolean(settings.videoBatch.requireVideoTest);
  renderProfileControls();
  renderPresetHelp();
  renderModelSuggestions();
  renderRecentTestSummaries();
  renderTemplatePresets();
  renderRiskSummary();
  renderEffectiveVideoConfig();
  renderBatchGateStatus();
  restorePanelState();
  renderPageSummaries();
}

export function bindSettingsInputs() {
  const ids = [
    "videoModel",
    "videoRatio",
    "videoQuality",
    "genAudio",
    "watermark",
    "requireVideoTest",
    "text-base", "text-key", "text-model", "text-adapter",
    "image-base", "image-key", "image-model", "image-provider",
    "multimodal-base", "multimodal-key", "multimodal-model", "multimodal-adapter",
    "video-base", "video-key", "video-model-name", "video-adapter",
  ];
  ids.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.addEventListener("change", () => {
      if (isPresetField(id)) {
        applyPresetDefaultsByField(id);
      }
      readSettingsFromDom();
    });
  });

  const profileSelect = document.getElementById("settingsProfileSelect");
  if (profileSelect) {
    profileSelect.addEventListener("change", (event) => {
      switchProfile(event.target.value);
    });
  }
  document.getElementById("createProfileBtn")?.addEventListener("click", createProfileFromCurrent);
  document.getElementById("duplicateProfileBtn")?.addEventListener("click", duplicateCurrentProfile);
  document.getElementById("renameProfileBtn")?.addEventListener("click", renameCurrentProfile);
  document.getElementById("deleteProfileBtn")?.addEventListener("click", deleteCurrentProfile);
  document.getElementById("settingsTemplatePresets")?.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button[data-template-preset]") : null;
    if (!button) return;
    applyTemplatePreset(button.dataset.templatePreset || "");
  });

  ALL_SLOTS.forEach((slot) => {
    const testButton = document.getElementById(`test-${slot}-conn`);
    if (testButton) {
      testButton.addEventListener("click", () => {
        testSlotConnection(slot);
      });
    }
    const applyButton = document.getElementById(`apply-${slot}-example`);
    if (applyButton) {
      applyButton.addEventListener("click", () => {
        applyOfficialExample(slot);
      });
    }
    const toggleButton = document.getElementById(`toggle-${slot}-panel`);
    if (toggleButton) {
      toggleButton.addEventListener("click", () => {
        toggleProviderPanel(slot);
      });
    }
    const chipRow = document.getElementById(`${slot}-model-chip-row`);
    if (chipRow) {
      chipRow.addEventListener("click", (event) => {
        const button = event.target instanceof Element
          ? event.target.closest("button[data-model]")
          : null;
        if (!button) return;
        applyModelSuggestion(slot, button.dataset.model || "");
      });
    }
  });
}

export async function saveSettings() {
  const next = readSettingsFromDom();
  const saved = normalizeSettings(await saveSettingsRecord(next));
  if (saved?.error || saved?.detail) {
    throw new Error(saved.error || saved.detail);
  }
  appStore.setSettings(saved);
  renderSettingsToDom();
  return saved;
}

export async function testSlotConnection(slot) {
  const config = readSlot(slot);
  const statusNode = document.getElementById(`${slot}-test-status`);
  if (statusNode) {
    statusNode.textContent = "测试中...";
  }
  try {
    const result = await testSettingsConnection(slot, config);
    if (statusNode) {
      const modeLabel = result.strategy === "real_text_call" || result.strategy === "real_image_call"
        ? "真实调用"
        : result.strategy === "config_validation"
          ? "配置校验"
          : "连通探测";
      statusNode.textContent = `连通成功 · ${result.provider} · ${result.model} · ${modeLabel}`;
    }
    const nextSettings = syncActiveProfileSnapshot({
      ...normalizeSettings(appStore.getState().settings),
      connectionTests: {
        ...(normalizeSettings(appStore.getState().settings).connectionTests || {}),
        [slot]: {
          ok: true,
          provider: result.provider,
          model: result.model,
          base: config.base,
          testedAt: Date.now(),
          status: result.status,
          strategy: result.strategy || "reachability_probe",
          note: result.note || "",
        },
      },
    });
    appStore.setSettings(nextSettings);
    renderProfileControls();
    renderRecentTestSummaries();
    renderRiskSummary();
    renderEffectiveVideoConfig();
    renderBatchGateStatus();
    showToast(`${slot} 槽位已通过测试，当前配置可以继续使用。`, {
      title: "连接成功",
      tone: "success",
    });
    return result;
  } catch (error) {
    if (statusNode) {
      statusNode.textContent = error.message || "测试失败";
    }
    const nextSettings = syncActiveProfileSnapshot({
      ...normalizeSettings(appStore.getState().settings),
      connectionTests: {
        ...(normalizeSettings(appStore.getState().settings).connectionTests || {}),
        [slot]: {
          ok: false,
          provider: config.adapter || config.provider || "custom",
          model: config.model,
          base: config.base,
          testedAt: Date.now(),
          error: error.message || "测试失败",
        },
      },
    });
    appStore.setSettings(nextSettings);
    renderProfileControls();
    renderRecentTestSummaries();
    renderRiskSummary();
    renderEffectiveVideoConfig();
    renderBatchGateStatus();
    showToast(error.message || `${slot} 槽位测试失败。`, {
      title: "连接失败",
      tone: "error",
      duration: 4200,
    });
    return { ok: false, error: error.message || "测试失败" };
  }
}

export function applyOfficialExample(slot) {
  const preset = getCurrentPreset(slot);
  const meta = PRESET_META[slot]?.[preset];
  if (!meta) return;
  const baseId = `${slot}-base`;
  const modelId = slot === "video" ? "video-model-name" : `${slot}-model`;
  const baseInput = document.getElementById(baseId);
  const modelInput = document.getElementById(modelId);
  if (baseInput) baseInput.value = meta.defaults.base || "";
  if (modelInput) modelInput.value = meta.defaults.model || "";
  readSettingsFromDom();
}

export function canStartVideoBatch() {
  const { settings } = appStore.getState();
  if (!settings.videoBatch.requireVideoTest) {
    return { ok: true };
  }
  const video = settings.models.video;
  const test = settings.connectionTests?.video;
  const sameConfig =
    test &&
    test.ok &&
    test.provider === video.adapter &&
    test.model === video.model &&
    test.base === video.base;
  if (sameConfig) {
    return { ok: true };
  }
  return { ok: false, reason: "当前视频槽位未通过测试连接，且已开启“未测试时禁止启动”。" };
}

export function renderBatchGateStatus() {
  const node = document.getElementById("batchGateStatus");
  if (!node) return;
  const gate = canStartVideoBatch();
  node.className = `gate-pill ${gate.ok ? "gate-open" : "gate-blocked"}`;
  node.textContent = gate.ok ? "可启动" : "被门禁阻止";
  node.title = gate.ok ? "当前视频配置满足启动条件" : gate.reason;
  const action = document.getElementById("gotoVideoSettingsBtn");
  if (action) {
    action.hidden = gate.ok;
  }
}

function readSlot(slot) {
  const result = {};
  SLOT_FIELDS[slot].forEach((field) => {
    const id = field === "model" && slot === "video" ? "video-model-name" : `${slot}-${field}`;
    result[field] = document.getElementById(id).value.trim();
  });
  return result;
}

function renderSlot(slot, data) {
  SLOT_FIELDS[slot].forEach((field) => {
    const id = field === "model" && slot === "video" ? "video-model-name" : `${slot}-${field}`;
    const element = document.getElementById(id);
    if (element) {
      element.value = data?.[field] || "";
    }
  });
}

function renderProfileControls() {
  const settings = normalizeSettings(appStore.getState().settings);
  const select = document.getElementById("settingsProfileSelect");
  if (select) {
    select.innerHTML = settings.profiles
      .map((profile) => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.name)}</option>`)
      .join("");
    select.value = settings.activeProfileId;
  }
  const summary = document.getElementById("settingsProfileSummary");
  const activeProfile = settings.profiles.find((profile) => profile.id === settings.activeProfileId);
  if (summary && activeProfile) {
    summary.textContent = `当前编辑：${activeProfile.name} · 最近更新 ${new Date(activeProfile.updatedAt || Date.now()).toLocaleString("zh-CN")} · 切换配置档前会先保留本地草稿。`;
  }
  const deleteButton = document.getElementById("deleteProfileBtn");
  if (deleteButton) {
    deleteButton.disabled = settings.profiles.length <= 1;
  }
}

function renderPresetHelp() {
  const { settings } = appStore.getState();
  const pairs = [
    ["text", settings.models.text.adapter],
    ["image", settings.models.image.provider],
    ["multimodal", settings.models.multimodal.adapter],
    ["video", settings.models.video.adapter],
  ];
  pairs.forEach(([slot, preset]) => {
    const descriptionNode = document.getElementById(`${slot}-preset-help`);
    const noteNode = document.getElementById(`${slot}-preset-notes`);
    const badgeNode = document.getElementById(`${slot}-brand-badge`);
    const meta = PRESET_META[slot]?.[preset];
    if (descriptionNode) {
      descriptionNode.textContent = meta?.description || "自定义配置，适合接入你自己的代理或服务网关。";
    }
    if (noteNode) {
      noteNode.textContent = meta?.notes || "建议至少填写 Base、Key、Model，并确认返回协议与当前工作流兼容。";
    }
    if (badgeNode) {
      badgeNode.className = `brand-badge ${meta?.className || "brand-custom"}`;
      badgeNode.innerHTML = `${getBrandIcon(meta?.className || "brand-custom")}<span>${meta?.brand || "Custom"}</span>`;
    }
  });
}

function renderTemplatePresets() {
  const node = document.getElementById("settingsTemplatePresets");
  if (!node) return;
  node.innerHTML = TEMPLATE_PRESETS
    .map((preset) => [
      `<button class="settings-template-card" type="button" data-template-preset="${escapeHtml(preset.id)}">`,
      `<span class="settings-template-label">Preset</span>`,
      `<strong>${escapeHtml(preset.name)}</strong>`,
      `<div class="muted">${escapeHtml(preset.description)}</div>`,
      `</button>`,
    ].join(""))
    .join("");
}

function renderRiskSummary() {
  const node = document.getElementById("settingsRiskSummary");
  if (!node) return;
  const settings = normalizeSettings(appStore.getState().settings);
  const risks = collectRisks(settings);
  node.innerHTML = risks.length
    ? risks.map((risk) => [
      `<div class="settings-risk-card settings-risk-${escapeHtml(risk.tone)}">`,
      `<div class="settings-risk-head"><strong>${escapeHtml(risk.title)}</strong><span>${escapeHtml(risk.level)}</span></div>`,
      `<div class="muted">${escapeHtml(risk.detail)}</div>`,
      `</div>`,
    ].join(""))
      .join("")
    : [
      `<div class="settings-risk-card settings-risk-good">`,
      `<div class="settings-risk-head"><strong>当前配置风险较低</strong><span>OK</span></div>`,
      `<div class="muted">关键槽位都有基础配置，继续做一次连接测试后就可以更放心地启动批任务。</div>`,
      `</div>`,
    ].join("");
}

function switchProfile(profileId) {
  const currentDraft = readSettingsFromDom();
  const next = activateProfile(currentDraft, profileId);
  appStore.setSettings(next);
  renderSettingsToDom();
}

function createProfileFromCurrent() {
  const currentDraft = readSettingsFromDom();
  const suggestedName = nextProfileName(currentDraft);
  const name = window.prompt("输入新配置档名称", suggestedName);
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  const next = normalizeSettings(currentDraft);
  const newProfile = {
    id: createProfileId(),
    name: trimmed,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    models: cloneJson(next.models),
    videoBatch: cloneJson(next.videoBatch),
    connectionTests: cloneJson(next.connectionTests || {}),
  };
  appStore.setSettings({
    ...next,
    activeProfileId: newProfile.id,
    profiles: [...next.profiles, newProfile],
  });
  renderSettingsToDom();
  showToast(`已创建配置档“${trimmed}”，记得点击保存使其持久化。`, {
    title: "已创建配置档",
    tone: "success",
  });
}

function duplicateCurrentProfile() {
  const currentDraft = readSettingsFromDom();
  const next = normalizeSettings(currentDraft);
  const activeProfile = next.profiles.find((profile) => profile.id === next.activeProfileId);
  if (!activeProfile) return;
  const suggestedName = `${activeProfile.name} 副本`;
  const name = window.prompt("输入复制后的配置档名称", suggestedName);
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  const duplicated = {
    ...cloneJson(activeProfile),
    id: createProfileId(),
    name: trimmed,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  appStore.setSettings({
    ...next,
    activeProfileId: duplicated.id,
    profiles: [...next.profiles, duplicated],
  });
  renderSettingsToDom();
  showToast(`已复制为配置档“${trimmed}”，记得点击保存使其持久化。`, {
    title: "已复制配置档",
    tone: "success",
  });
}

function renameCurrentProfile() {
  const currentDraft = readSettingsFromDom();
  const next = normalizeSettings(currentDraft);
  const activeProfile = next.profiles.find((profile) => profile.id === next.activeProfileId);
  if (!activeProfile) return;
  const name = window.prompt("输入新的配置档名称", activeProfile.name);
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  appStore.setSettings({
    ...next,
    profiles: next.profiles.map((profile) => (
      profile.id === activeProfile.id
        ? { ...profile, name: trimmed, updatedAt: Date.now() }
        : profile
    )),
  });
  renderSettingsToDom();
  showToast(`已重命名为“${trimmed}”，记得点击保存使其持久化。`, {
    title: "已重命名",
    tone: "success",
  });
}

function deleteCurrentProfile() {
  const currentDraft = readSettingsFromDom();
  const next = normalizeSettings(currentDraft);
  if (next.profiles.length <= 1) {
    showToast("至少需要保留一个配置档。", {
      title: "无法删除",
      tone: "error",
      duration: 3200,
    });
    return;
  }
  const activeProfile = next.profiles.find((profile) => profile.id === next.activeProfileId);
  if (!activeProfile) return;
  const confirmed = window.confirm(`确定删除配置档“${activeProfile.name}”吗？该操作在点击保存后会持久化。`);
  if (!confirmed) return;
  const remaining = next.profiles.filter((profile) => profile.id !== activeProfile.id);
  const fallback = remaining[0];
  const updated = activateProfile({
    ...next,
    profiles: remaining,
    activeProfileId: fallback.id,
  }, fallback.id);
  appStore.setSettings(updated);
  renderSettingsToDom();
  showToast(`已删除配置档“${activeProfile.name}”，记得点击保存使其持久化。`, {
    title: "已删除配置档",
    tone: "success",
  });
}

function renderModelSuggestions() {
  ALL_SLOTS.forEach((slot) => {
    const preset = getCurrentPreset(slot);
    const meta = PRESET_META[slot]?.[preset] || PRESET_META[slot]?.custom;
    const listNode = document.getElementById(`${slot}-model-suggestions`);
    if (listNode) {
      listNode.innerHTML = (meta?.models || [])
        .map((model) => `<option value="${escapeHtml(model)}"></option>`)
        .join("");
    }
    const chipRow = document.getElementById(`${slot}-model-chip-row`);
    if (!chipRow) return;
    if (!meta?.models?.length) {
      chipRow.innerHTML = `<span class="muted">当前预设没有内置模型候选，请直接手填 Model。</span>`;
      return;
    }
    chipRow.innerHTML = meta.models
      .map((model) => `<button type="button" class="model-chip" data-model="${escapeHtml(model)}">${escapeHtml(model)}</button>`)
      .join("");
  });
}

function renderRecentTestSummaries() {
  const { settings } = appStore.getState();
  ALL_SLOTS.forEach((slot) => {
    const node = document.getElementById(`${slot}-recent-test`);
    if (!node) return;
    const test = settings.connectionTests?.[slot];
    if (!test) {
      node.textContent = "最近测试：未测试";
      return;
    }
    const modeLabel = test.strategy === "real_text_call"
      ? "真实调用"
      : test.strategy === "config_validation"
        ? "配置校验"
        : "连通探测";
    if (!test.ok) {
      node.textContent = `最近测试：失败 · ${test.error || "配置未通过验证"}`;
      return;
    }
    node.textContent = `最近测试：${test.provider || "custom"} · ${test.model || "-"} · ${modeLabel} · ${new Date(test.testedAt || Date.now()).toLocaleString("zh-CN")}`;
  });
}

function renderEffectiveVideoConfig() {
  const { settings } = appStore.getState();
  const node = document.getElementById("currentVideoConfig");
  if (!node) return;
  const video = settings.models.video;
  const batch = settings.videoBatch;
  const meta = PRESET_META.video[video.adapter] || PRESET_META.video.custom;
  const test = settings.connectionTests?.video;
  const sameConfig =
    test &&
    test.provider === video.adapter &&
    test.model === video.model &&
    test.base === video.base;
  let testText = "最近测试：未测试";
  if (test && sameConfig && test.ok) {
    testText = `最近测试：当前配置已通过 · ${new Date(test.testedAt).toLocaleString("zh-CN")}`;
  } else if (test && sameConfig && !test.ok) {
    testText = `最近测试：当前配置未通过 · ${test.error || "请检查 Base URL / Key / Model"}`;
  } else if (test && !sameConfig) {
    testText = "最近测试：已有历史结果，但与当前视频配置不一致";
  }
  node.innerHTML = [
    `<strong>当前生效的视频 provider / model / adapter</strong> <span class="brand-badge ${meta.className}">${getBrandIcon(meta.className)}<span>${meta.brand}</span></span>`,
    `base: <code>${video.base || "-"}</code>`,
    `model: <code>${video.model || "-"}</code>`,
    `adapter: <code>${video.adapter || "-"}</code>`,
    `batch profile: <code>${batch.videoModel}</code> · <code>${batch.videoRatio}</code> · <code>${batch.videoQuality}</code>`,
    `启动门禁: <code>${batch.requireVideoTest ? "未测试禁止启动" : "允许直接启动"}</code>`,
    testText,
  ].join("<br />");
}

function applyTemplatePreset(presetId) {
  const preset = TEMPLATE_PRESETS.find((item) => item.id === presetId);
  if (!preset) return;
  const current = normalizeSettings(appStore.getState().settings);
  const patch = preset.apply();
  const next = syncActiveProfileSnapshot({
    ...current,
    models: mergeModels(current.models, patch.models || {}),
    videoBatch: { ...current.videoBatch, ...(patch.videoBatch || {}) },
  });
  appStore.setSettings(next);
  renderSettingsToDom();
  showToast(`已应用“${preset.name}”模板，可在当前配置档里继续细调后再保存。`, {
    title: "模板已应用",
    tone: "success",
  });
}

function collectRisks(settings) {
  const risks = [];
  ALL_SLOTS.forEach((slot) => {
    const config = settings.models?.[slot] || {};
    const provider = config.adapter || config.provider || "custom";
    const model = String(config.model || "").trim();
    const base = String(config.base || "").trim();
    const test = settings.connectionTests?.[slot];
    const slotLabel = slot === "multimodal" ? "多模态" : slot.toUpperCase();
    if (!base || !model) {
      risks.push({
        tone: "warn",
        level: "待补齐",
        title: `${slotLabel} 槽位信息不完整`,
        detail: "Base URL 或 Model 仍为空，这个槽位目前更像占位配置。",
      });
      return;
    }
    if (!String(config.key || "").trim() && provider !== "custom") {
      risks.push({
        tone: "warn",
        level: "需确认",
        title: `${slotLabel} 可能缺少 API Key`,
        detail: "当前 provider 看起来需要鉴权，建议先补 key 再做测试连接。",
      });
    }
    const sameConfig = test && test.provider === provider && test.model === model && test.base === base;
    if (!sameConfig) {
      risks.push({
        tone: "info",
        level: "建议测试",
        title: `${slotLabel} 还没有当前配置的测试结果`,
        detail: "历史测试结果与当前 Base / Model 不一致，建议重新验证一次。",
      });
      return;
    }
    if (test && test.ok === false) {
      risks.push({
        tone: "danger",
        level: "高风险",
        title: `${slotLabel} 最近一次测试失败`,
        detail: test.error || "当前槽位尚未通过测试，继续使用可能导致任务中断。",
      });
    }
  });
  const gate = canStartVideoBatch();
  if (!gate.ok) {
    risks.push({
      tone: "danger",
      level: "门禁阻止",
      title: "视频批任务暂不可启动",
      detail: gate.reason || "请先完成视频配置测试。",
    });
  }
  return risks.slice(0, 5);
}

function isPresetField(id) {
  return ["text-adapter", "image-provider", "multimodal-adapter", "video-adapter"].includes(id);
}

function applyPresetDefaultsByField(id) {
  const mapping = {
    "text-adapter": ["text", "adapter"],
    "image-provider": ["image", "provider"],
    "multimodal-adapter": ["multimodal", "adapter"],
    "video-adapter": ["video", "adapter"],
  };
  const match = mapping[id];
  if (!match) return;
  const [slot] = match;
  const preset = document.getElementById(id).value;
  const meta = PRESET_META[slot]?.[preset];
  if (!meta?.defaults) return;
  const baseId = `${slot}-base`;
  const modelId = slot === "video" ? "video-model-name" : `${slot}-model`;
  const baseInput = document.getElementById(baseId);
  const modelInput = document.getElementById(modelId);
  if (baseInput) {
    baseInput.value = meta.defaults.base || "";
  }
  if (modelInput) {
    modelInput.value = meta.defaults.model || "";
  }
}

function applyModelSuggestion(slot, model) {
  const modelId = slot === "video" ? "video-model-name" : `${slot}-model`;
  const modelInput = document.getElementById(modelId);
  if (!modelInput) return;
  modelInput.value = model;
  readSettingsFromDom();
}

function getCurrentPreset(slot) {
  if (slot === "image") {
    return document.getElementById("image-provider").value;
  }
  return document.getElementById(`${slot}-adapter`).value;
}

function toggleProviderPanel(slot) {
  const panel = document.querySelector(`.provider-panel[data-slot="${slot}"]`);
  const button = document.getElementById(`toggle-${slot}-panel`);
  if (!panel || !button) return;
  const nextCollapsed = !panel.classList.contains("collapsed");
  panel.classList.toggle("collapsed", nextCollapsed);
  button.textContent = nextCollapsed ? "展开" : "收起";
  button.setAttribute("aria-expanded", String(!nextCollapsed));
  savePanelState(slot, nextCollapsed);
}

function restorePanelState() {
  const state = readPanelState();
  ALL_SLOTS.forEach((slot) => {
    const panel = document.querySelector(`.provider-panel[data-slot="${slot}"]`);
    const button = document.getElementById(`toggle-${slot}-panel`);
    const collapsed = Boolean(state[slot]);
    if (!panel || !button) return;
    panel.classList.toggle("collapsed", collapsed);
    button.textContent = collapsed ? "展开" : "收起";
    button.setAttribute("aria-expanded", String(!collapsed));
  });
}

function readPanelState() {
  try {
    return JSON.parse(localStorage.getItem(PANEL_STATE_KEY) || "{}");
  } catch (_error) {
    return {};
  }
}

function savePanelState(slot, collapsed) {
  try {
    const next = {
      ...readPanelState(),
      [slot]: collapsed,
    };
    localStorage.setItem(PANEL_STATE_KEY, JSON.stringify(next));
  } catch (_error) {
    // noop
  }
}

function getBrandIcon(className) {
  const icons = {
    "brand-openai": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l4 2.3v4.6L12 12 8 9.9V5.3L12 3zm0 9l4 2.3v4.4L12 21l-4-2.3v-4.4l4-2.3z" fill="currentColor" opacity=".9"/><circle cx="12" cy="12" r="2.2" fill="white"/></svg>',
    "brand-openrouter": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h9l5 6-5 6H5l5-6-5-6zm6.5 3.2L9 12l2.5 2.8H14l-2.5-2.8L14 9.2h-2.5z" fill="currentColor"/></svg>',
    "brand-gemini": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2L12 2z" fill="currentColor"/></svg>',
    "brand-anthropic": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 19l4.6-14h1.9L18 19h-2.7l-.8-2.8H9.6L8.8 19H7zm3.1-5h3.9L12 8.5 10.1 14z" fill="currentColor"/></svg>',
    "brand-deepseek": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h6.6c4 0 6.4 2.5 6.4 7s-2.4 7-6.4 7H6V5zm3 2.5v9h3.2c2.4 0 3.8-1.4 3.8-4.5s-1.4-4.5-3.8-4.5H9z" fill="currentColor"/></svg>',
    "brand-qwen": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a8 8 0 105.2 14.1l2.7 1.9-.8-3.3A8 8 0 0012 4zm0 2.5a5.5 5.5 0 014.1 9.2l-.5.6.3 1.1-1-.7-.6.3A5.5 5.5 0 1112 6.5z" fill="currentColor"/></svg>',
    "brand-siliconflow": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7.5L12 4l6 3.5v9L12 20l-6-3.5v-9zm6 1.6L8.8 11 12 12.9l3.2-1.9L12 9.1zm-3 4.3v2l3 1.7 3-1.7v-2L12 15.1l-3-1.7z" fill="currentColor"/></svg>',
    "brand-kling": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h3v6l6-6h3l-6.3 6.1L19 20h-3l-5.7-7.5L9 14v6H6V4z" fill="currentColor"/></svg>',
    "brand-seedance": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6c-1.1-1.3-3-2-5-2-3.5 0-6 1.9-6 4.5 0 2.4 2.2 3.4 4.8 4l2 .4c1.4.3 2.2.8 2.2 1.7 0 1.1-1.2 1.8-3 1.8-1.9 0-3.5-.7-4.9-1.9l-2 2.2c1.8 1.7 4.3 2.7 6.9 2.7 4 0 6.7-1.9 6.7-4.8 0-2.3-1.6-3.6-4.7-4.2l-2-.4c-1.7-.3-2.3-.8-2.3-1.6 0-.9 1-1.5 2.6-1.5 1.6 0 2.9.5 4 1.5L18 6z" fill="currentColor"/></svg>',
    "brand-hailuo": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h3v5h6V5h3v14h-3v-6H9v6H6V5z" fill="currentColor"/></svg>',
    "brand-runway": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h6.5a4.5 4.5 0 110 9H8v5H5V5zm3 2.7v3.6h3a1.8 1.8 0 100-3.6H8zM15 14l4 5h-3l-3.3-4.2L15 14z" fill="currentColor"/></svg>',
    "brand-vidu": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h3.2L12 16l4.8-11H20l-6.7 14h-2.7L4 5z" fill="currentColor"/></svg>',
    "brand-veo": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4.8L12 17l3.2-10H20l-5 12h-6L4 7z" fill="currentColor"/></svg>',
    "brand-wanx": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h3.1l3.1 8.6L14.6 6H18l-4.9 12h-3L5 6zm12.4 12l1.8-4.2 1.8 4.2h-3.6z" fill="currentColor"/></svg>',
    "brand-flux": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.5 6.5H21l-5.2 4 2 7-5.8-4-5.8 4 2-7L3 9.5h6.5L12 3z" fill="currentColor"/></svg>',
    "brand-custom": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 4v10l-7 4-7-4V7l7-4zm0 3.1L8 8.4v7.2l4 2.3 4-2.3V8.4l-4-2.3z" fill="currentColor"/></svg>',
  };
  return icons[className] || icons["brand-custom"];
}
