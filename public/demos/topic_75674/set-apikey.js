// 配置火山引擎 Ark API Key
// 在浏览器控制台（F12 -> Console）中粘贴执行以下代码：

localStorage.setItem('ycjs_providers', JSON.stringify([
  {"name":"OpenAI","baseUrl":"https://api.openai.com/v1","model":"gpt-4o-mini","maxTokens":1024,"temperature":0.7,"enabled":false,"apiKey":""},
  {"name":"智谱 AI","baseUrl":"https://open.bigmodel.cn/api/paas/v4","model":"glm-4-flash","maxTokens":1024,"temperature":0.7,"enabled":false,"apiKey":""},
  {"name":"DeepSeek","baseUrl":"https://api.deepseek.com/v1","model":"deepseek-chat","maxTokens":1024,"temperature":0.7,"enabled":false,"apiKey":""},
  {"name":"通义千问","baseUrl":"https://dashscope.aliyuncs.com/compatible-mode/v1","model":"qwen-turbo","maxTokens":1024,"temperature":0.7,"enabled":false,"apiKey":""},
  {"name":"火山引擎 Ark","baseUrl":"https://ark.cn-beijing.volces.com/api/v3","model":"doubao-seed-2-0-mini-260428","maxTokens":1024,"temperature":0.7,"enabled":true,"apiKey":"ark-78dd0156-ceca-419f-bcd2-edd688928aac-61b32"}
]));

console.log('API Key 已配置：火山引擎 Ark（doubao-seed-2-0-mini-260428）');
console.log('请刷新页面生效');
