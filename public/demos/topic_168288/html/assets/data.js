(function () {
  'use strict'

  window.FENGYU_DEMO_DATA = Object.freeze({
    event: {
      id: 'event_demo_001',
      name: '临江社区强对流暴雨',
      phase: '灾中处置',
      warning: '暴雨橙色预警',
      summary: '局部积水、停电与道路受阻，社区正在开展协同处置。',
    },
    metrics: [
      { label: '待核验求助', value: 2, symbol: '求', tone: 'info' },
      { label: '重点照护待复核', value: 1, symbol: '护', tone: 'warning' },
      { label: '开放低风险任务', value: 1, symbol: '任', tone: 'safe' },
      { label: '开放安置点', value: 1, symbol: '安', tone: 'neutral' },
    ],
    terminalStatus: [
      { terminal: '用户服务', status: '求助等待社区核验', detail: 'P2 · YELLOW · 位置已脱敏', tone: 'warning' },
      { terminal: '关怀模式', status: '1 人尚未确认安全', detail: '仅表示待联系复核，不等于遇险', tone: 'warning' },
      { terminal: '协同工作台', status: '低风险任务待派发', detail: '高危任务已由专业边界拦截', tone: 'safe' },
    ],
  })
})()
