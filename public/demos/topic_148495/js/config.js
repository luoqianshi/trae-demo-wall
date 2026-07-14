/**
 * config.js — 全局配置与常量
 * 所有硬编码的配置项集中管理，方便维护和调整
 */
var Config = {
  // ===== AI 模型配置 =====
  AI: {
    API_KEY: 'sk-YOUR_API_KEY_HERE',
    PROXY_URL: '/api/proxy',
    API_URL: 'https://api.deepseek.com/v1/chat/completions',
    MODEL: 'deepseek-chat',
    MAX_TOKENS: 800,
    TEMPERATURE: 0.7,
    TIMEOUT_MS: 8000
  },

  // ===== 应用常量 =====
  APP: {
    NAME: '轻时',
    TAGLINE: '以休息为锚点，AI 陪伴你的时间',
    VERSION: '2.0.0'
  },

  // ===== 默认设置 =====
  DEFAULTS: {
    QUIET_HOURS_START: '22:00',
    QUIET_HOURS_END: '08:00',
    WORK_DAYS: [1, 2, 3, 4, 5],
    SLEEP_TIME: '23:00',
    WAKE_UP_TIME: '07:00',
    SHORT_REST_MIN: 15,
    LONG_REST_MIN: 30
  },

  // ===== 状态枚举 =====
  STATUS: {
    IDLE: 'idle',
    WORKING: 'working',
    RESTING: 'resting'
  },

  // ===== 阶段枚举 =====
  PHASE: {
    COMPANION: 1,
    ADJUSTMENT: 2,
    TRANSITION: 3
  },

  // ===== 卡片类型 =====
  CARD_TYPE: {
    TIMELINE: 'timeline',
    HEATMAP: 'heatmap',
    REPORT: 'report',
    PLAN: 'plan',
    RING: 'ring',
    CAPABILITY: 'capability',
    NONE: null
  },

  // ===== 操作类型 =====
  ACTION: {
    START_WORK: 'start_work',
    REST: 'rest',
    CONTINUE_WORK: 'continue_work',
    TODAY_DATA: 'today_data',
    TODAY_PLAN: 'today_plan',
    WEEKLY_REPORT: 'weekly_report',
    HEATMAP: 'heatmap',
    CAPABILITY: 'capability',
    SETTINGS: 'settings',
    LOAD_DEMO: 'load_demo',
    RESET: 'reset'
  }
};