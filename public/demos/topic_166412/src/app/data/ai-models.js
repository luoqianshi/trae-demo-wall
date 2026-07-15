(function () {
  const data = window.MiniFishData = window.MiniFishData || {};
  data.ai = {
    aiTabs: ['API 密钥管理', '模型对比生成', '用量计费统计'],
    aiTab: 'API 密钥管理',
    showAddModel: false,
    aiModels: [
      { name:'小米 MiMo', short:'米', version:'MiMo-7B', status:'offline', statusText:'未连接', bg:'linear-gradient(135deg,#FF6900,#E85D00)', key:'演示数据（未连接）', calls:'—', cost:'—', active:false },
      { name:'DeepSeek', short:'DS', version:'deepseek-v3', status:'offline', statusText:'未连接', bg:'linear-gradient(135deg,#4D6BFE,#2E4DD8)', key:'演示数据（未连接）', calls:'—', cost:'—', active:false },
      { name:'通义千问', short:'问', version:'qwen-max', status:'offline', statusText:'未连接', bg:'linear-gradient(135deg,#615CED,#4A47C8)', key:'演示数据（未连接）', calls:'—', cost:'—', active:false },
      { name:'GLM 智谱', short:'GLM', version:'glm-4-plus', status:'offline', statusText:'未连接', bg:'linear-gradient(135deg,#3B6EFF,#2A55CC)', key:'演示数据（未连接）', calls:'—', cost:'—', active:false },
      { name:'MiniMax', short:'MM', version:'abab6.5', status:'offline', statusText:'未连接', bg:'linear-gradient(135deg,#7C3AED,#5B28A8)', key:'演示数据（未连接）', calls:'—', cost:'—', active:false },
      { name:'Kimi 月之暗面', short:'Kimi', version:'moonshot-v1', status:'offline', statusText:'未连接', bg:'linear-gradient(135deg,#1A1A1A,#444)', key:'演示数据（未连接）', calls:'—', cost:'—', active:false },
      { name:'ChatGPT', short:'GPT', version:'gpt-4o', status:'offline', statusText:'未连接', bg:'linear-gradient(135deg,#10A37F,#0D8266)', key:'演示数据（未连接）', calls:'—', cost:'—', active:false },
      { name:'Claude', short:'Cl', version:'claude-3.5', status:'offline', statusText:'未连接', bg:'linear-gradient(135deg,#D97757,#C96442)', key:'演示数据（未连接）', calls:'—', cost:'—', active:false },
      { name:'OpenCode', short:'OC', version:'opencode-v2', status:'offline', statusText:'未连接', bg:'linear-gradient(135deg,#7B6FB0,#5B4A8C)', key:'演示数据（未连接）', calls:'—', cost:'—', active:false },
      { name:'Doubao 豆包', short:'豆', version:'doubao-pro-256k', status:'offline', statusText:'未连接', bg:'linear-gradient(135deg,#3D5AFE,#1A3FE0)', key:'演示数据（未连接）', calls:'—', cost:'—', active:false }
    ],
    compareModels: ['DeepSeek', 'Claude'],
    comparePrompt: '为夏日新品水蜜桃气泡水写一篇小红书种草文案，带 emoji 和话题标签',
    compareResults: [],
    usageTable: [
      { name:'ChatGPT', calls:'2,847', tokens:'2.1M', cost:'186.30', latency:'1.8s', success:99.4 },
      { name:'Claude', calls:'1,932', tokens:'1.4M', cost:'98.70', latency:'2.1s', success:99.1 },
      { name:'DeepSeek', calls:'2,156', tokens:'1.8M', cost:'43.20', latency:'0.9s', success:99.8 },
      { name:'Kimi', calls:'1,540', tokens:'1.2M', cost:'38.50', latency:'1.2s', success:99.6 },
      { name:'通义千问', calls:'1,284', tokens:'980K', cost:'25.80', latency:'1.1s', success:99.3 },
      { name:'GLM 智谱', calls:'986', tokens:'760K', cost:'31.40', latency:'1.5s', success:98.9 },
      { name:'OpenCode', calls:'568', tokens:'420K', cost:'14.20', latency:'1.3s', success:99.5 },
      { name:'Doubao', calls:'1,102', tokens:'860K', cost:'22.40', latency:'1.0s', success:99.7 }
    ]
  };
})();
