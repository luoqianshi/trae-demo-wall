(function () {
  const data = window.MiniFishData = window.MiniFishData || {};
  data.studio = {
    studio: {
      sessionTitle: '',
      showSidePanel: false,
      showPreview: false,
      previewTab: 'card',
      previewTabs: [
        { key: 'card', label: '文案卡片' },
        { key: 'video', label: '视频' },
        { key: 'html', label: 'HTML' },
        { key: 'md', label: 'MD' }
      ],
      previewCard: { title: '', likes: '0' },
      previewFilePath: '/output/codex核验报告.md',
      // 文件产物列表
      showFilesMenu: false,
      filesMenuStyle: { top: '-9999px', left: '-9999px' },
      outputFiles: [
        { name: '夏日饮品种草文案.md', type: 'md' },
        { name: '小红书封面图.png', type: 'image' },
        { name: '短视频脚本_30s.md', type: 'md' },
        { name: '产品展示视频.mp4', type: 'video' },
        { name: '爆款标题10个.txt', type: 'text' },
        { name: '直播话术_v2.md', type: 'md' }
      ],
      allFilesCount: 6,
      moreFilesCount: 0,
      sources: [
        { name: '小红书热榜', color: '#e8755e' },
        { name: '抖音话题', color: '#6b8cb8' },
        { name: '爆款文案库', color: '#7ba989' }
      ],
      currentOutput: '',
      accessMode: 'auto',
      activeRunId: null,
      runError: null,
      messages: [],
      isRunning: false,
      runningStatus: '',
      streamingBlocks: [],
      prompt: '',
      suggestions: [
        '帮我写一篇小红书种草文案',
        '生成短视频脚本，30秒',
        '分析最近的热点选题',
        '给我起10个爆款标题',
        '写一篇直播带货话术'
      ],
      // 模型选择器
      showModelMenu: false,
      menuStyle: { top: '-9999px', left: '-9999px', maxHeight: '500px' },
      selectedModel: 'DeepSeek',
      selectedModelVersion: 'deepseek-v4-flash',
      reasoningLevel: '超高',
      reasoningLevels: ['低', '中', '高', '超高'],
      modelList: [
        { name: '小米 MiMo', short: '米', version: 'MiMo-7B', bg: 'linear-gradient(135deg,#FF6900,#E85D00)', active: true },
        { name: 'DeepSeek', short: 'DS', version: 'deepseek-v4-flash', bg: 'linear-gradient(135deg,#4D6BFE,#2E4DD8)', active: true },
        { name: '通义千问', short: '问', version: 'qwen-max', bg: 'linear-gradient(135deg,#615CED,#4A47C8)', active: true },
        { name: 'GLM 智谱', short: 'GLM', version: 'glm-4-plus', bg: 'linear-gradient(135deg,#3B6EFF,#2A55CC)', active: true },
        { name: 'Kimi 月之暗面', short: 'Kimi', version: 'moonshot-v1', bg: 'linear-gradient(135deg,#1A1A1A,#444)', active: true },
        { name: 'ChatGPT', short: 'GPT', version: 'gpt-4o', bg: 'linear-gradient(135deg,#10A37F,#0D8266)', active: true },
        { name: 'Claude', short: 'Cl', version: 'claude-3.5', bg: 'linear-gradient(135deg,#D97757,#C96442)', active: true },
        { name: 'OpenCode', short: 'OC', version: 'opencode-v2', bg: 'linear-gradient(135deg,#7B6FB0,#5B4A8C)', active: true },
        { name: 'Doubao 豆包', short: '豆', version: 'doubao-pro-256k', bg: 'linear-gradient(135deg,#3D5AFE,#1A3FE0)', active: true }
      ]
    }
  };
})();
