/**
 * 演示用预设数据
 * 
 * 提供一组预设的聊天示例、CBT卡片记录和能量记录，
 * 用于在开发/演示环境中快速展示应用功能，无需真实对话数据。
 */
'use strict';

const DEMO_DATA = {
  /**
   * 预设聊天示例
   * 每个示例包含用户输入文本及对应的情绪类型标识。
   */
  chatExamples: [
    { input: '今天领导没有回复我的消息，我一直觉得是不是我哪里做错了。', emotion: 'typeA' },
    { input: '我感觉所有人都不喜欢我，他们说悄悄话的时候一定在说我。', emotion: 'typeC' },
    { input: '快要崩溃了，工作压力大到喘不过气来。', emotion: 'typeD' },
    { input: '朋友不回复我的消息，我一直在想是不是我说错什么了。', emotion: 'typeB' }
  ],

  /**
   * 预设CBT三栏法记录卡片
   * 帮助用户演示认知重构的完整流程。
   */
  savedCBTCards: [
    {
      id: 1,
      scenario: '工作汇报',
      oldReaction: '我一定会失败',
      newResponse: '紧张不代表失败，充分准备就好',
      reminder: '先观察事实，不要预设结果',
      createdAt: '2026-07-10'
    },
    {
      id: 2,
      scenario: '领导批评',
      oldReaction: '我是不是很差劲',
      newResponse: '问题针对事情，不代表否定我',
      reminder: '把注意力放在具体改进点上',
      createdAt: '2026-07-12'
    }
  ],

  /**
   * 预设能量记录
   * 包含消耗（drain）和补充（gain）两种类型的事件记录，
   * 用于演示能量仪表盘的可视化效果。
   */
  energyRecords: [
    { date: '07-08', type: 'drain', event: '连续会议', value: 4 },
    { date: '07-08', type: 'gain', event: '散步', value: 3 },
    { date: '07-09', type: 'drain', event: '社交活动', value: 3 },
    { date: '07-09', type: 'gain', event: '听音乐', value: 4 },
    { date: '07-10', type: 'drain', event: '信息过载', value: 5 },
    { date: '07-10', type: 'gain', event: '独处', value: 4 },
    { date: '07-11', type: 'drain', event: '工作压力', value: 4 },
    { date: '07-11', type: 'gain', event: '运动', value: 5 },
    { date: '07-12', type: 'gain', event: '睡眠充足', value: 3 },
    { date: '07-13', type: 'drain', event: '家庭矛盾', value: 3 },
    { date: '07-13', type: 'gain', event: '看电影', value: 2 },
    { date: '07-14', type: 'drain', event: '对未来的焦虑', value: 4 }
  ]
};

// 导出（兼容 ESM 和全局）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEMO_DATA };
}