// 复制本文件为 config.js，填入你自己的一次性 API Key（config.js 已被 .gitignore 忽略）。
// 安全提醒：用一个限额小的一次性 Key，比赛结束后立即删除/吊销。
module.exports = {
  baseUrl: 'https://api.deepseek.com',   // DeepSeek OpenAI 兼容接口
  model: 'deepseek-v4-flash',            // 运行时默认模型：改写任务够用、便宜快（需 Node ≥18 用全局 fetch）
  apiKey: '在此填入你的一次性Key_勿提交'
};
