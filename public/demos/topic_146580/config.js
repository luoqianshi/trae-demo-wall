/* ============================================================
   看见 · 全局配置
   阶段 1：基础配置 + AI 调用模式预留（不接 AI）
   ============================================================

   【AI 调用模式 aiMode 说明】
   - "local"   ：本地测试模式，使用用户自己填的 API Key（初赛纯本地版本）
   - "backend"  ：后端托管模式，前端调用我们的后端接口，用户无需填 Key（复赛/决赛）

   【长期架构（后端托管 Key 方案）】
   正式上线后不在前端保存我们的 API Key：
   1. 普通用户请求前端页面
   2. 前端调用我们的后端接口（/api/chat、/api/insight）
   3. 后端从环境变量中读取 DOUBAO_API_KEY，再调用豆包 API
   4. AI 结果由后端返回前端
   5. 用户从头到尾看不到真实 Key

   当前阶段 1 默认 aiMode = "local"，复赛阶段会切换为 "backend"。
   ============================================================ */

window.Config = {
  // 产品信息
  productName: "看见",
  slogan: "发现你没注意到的自己",

  // 存储键名
  storageKeys: {
    records: "kanjian_records",       // 记录列表
    settings: "kanjian_settings",      // 设置（昵称、API Key 等）
    aiQuestion: "kanjian_ai_question",  // 当天 AI 生成的问题缓存
  },

  // 解锁门槛
  unlockThresholds: {
    miniInsight: 7,       // 迷你洞察
    fullInsight: 15,     // 完整洞察报告
  },

  // AI 调用模式（阶段 1 预留，不真正调用）
  // local   = 本地测试模式（用户填自己的 Key）
  // backend = 后端托管模式（复赛/决赛，用户无需填 Key）
  aiMode: "local",

  // AI 配置（阶段 2 启用）
  ai: {
    vendor: "doubao",                 // 主力：doubao / deepseek
    baseUrls: {
      doubao: "https://ark.cn-beijing.volces.com/api/v3",
      deepseek: "https://api.deepseek.com/v1",
    },
    // 用户在设置页填写的 baseUrl / modelChat / modelInsight 会覆盖默认值
    baseUrl: "",                       // 留空则按 vendor 取 baseUrls[vendor]
    modelChat: "",                     // 即时回应模型 ID（豆包填 endpoint ID，DeepSeek 填 deepseek-chat）
    modelInsight: "",                  // 洞察报告模型 ID（阶段 4 用）
    timeoutMs: 30000,                  // 超时
    temperature: 0.7,                  // 即时回应温度
  },

  // 后端中转配置（阶段 1 预留，不真正调用）
  // 复赛阶段会配置成类似：https://xxx.scf.tencentcloudapi.com
  backend: {
    baseUrl: "",                       // 后端服务地址，阶段 1 为空
    endpoints: {
      chat: "/api/chat",               // 即时回应接口
      insight: "/api/insight",         // 洞察报告接口
    },
  },
};
