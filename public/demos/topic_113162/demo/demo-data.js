var demoData = {
  newspaper: {
    date: '2026-07-09',
    weather: '晴转多云，26-32°C，空气质量优',
    todayFocus: [
      { title: '大赛冲刺倒计时', content: '距离TRAE AI创造力大赛报名截止还有7天，当前已完成85%准备工作', tag: '紧急' },
      { title: 'Demo页面优化', content: 'demo-guide-v2.html已完成重构，包含完整的模拟界面和大赛数据', tag: '进度' },
      { title: '健康预警', content: '本周睡眠质量下降12%，建议调整作息时间', tag: '健康' }
    ],
    memoryHighlight: [
      { time: '昨天', content: '完善了并行看板的demo数据，添加了7个大赛相关任务' },
      { time: '前天', content: '完成了记忆系统的对话记录模拟，包含15条大赛开发对话' },
      { time: '3天前', content: '设计了战略地图的三阶段规划：冲刺→评选→赛后迭代' }
    ],
    quote: '"AI不会取代你，但使用AI的人会。" —— 安德鲁·卡内基',
    todayNum: {
      completed: 6,
      pending: 4,
      total: 10,
      streak: 28
    }
  },
  work: {
    columns: [
      {
        name: '待启动',
        tasks: [
          { id: 'T-096', title: '完善Demo演示视频脚本', desc: '编写3分钟演示视频的分镜脚本和旁白文案', priority: 'high', tags: ['大赛', 'Demo'] },
          { id: 'T-097', title: '整理Session ID清单', desc: '收集并整理不少于3个关键任务的Session ID', priority: 'high', tags: ['大赛', '证明材料'] }
        ]
      },
      {
        name: '进行中',
        tasks: [
          { id: 'T-098', title: '编写技术文档', desc: '撰写Workboard系统架构说明文档，包含核心功能和技术亮点', priority: 'medium', tags: ['大赛', '文档'] },
          { id: 'T-099', title: '优化UI交互', desc: '改进并行看板的拖拽体验和动画效果', priority: 'medium', tags: ['体验', '前端'] },
          { id: 'T-100', title: '添加大赛主题demo数据', desc: '为各模块添加贴合大赛场景的模拟数据', priority: 'high', tags: ['大赛', '数据'] }
        ]
      },
      {
        name: '待验收',
        tasks: [
          { id: 'T-101', title: '验证各功能模块', desc: '测试并验证所有功能模块的demo数据展示效果', priority: 'high', tags: ['测试'] },
          { id: 'T-102', title: '准备参赛材料', desc: '整理参赛所需的所有材料和文档', priority: 'high', tags: ['大赛'] }
        ]
      }
    ]
  },
  timeline: [
    { date: '2026-07-09', items: [
      { type: '对话', content: '让我回顾一下最近为大赛做了什么', detail: '用户询问大赛准备进度，系统回顾了过去一周的工作内容' },
      { type: '产出', content: '完成demo-guide-v2.html重构', detail: '采用左侧导航+右侧模拟界面的布局，包含16个功能模块' },
      { type: '决策', content: '确定demo数据围绕大赛场景', detail: '所有模拟数据均贴合TRAE AI创造力大赛主题' }
    ]},
    { date: '2026-07-08', items: [
      { type: '对话', content: '帮我设计战略地图', detail: '用户要求设计贴合大赛的战略规划，包含冲刺、评选、赛后三个阶段' },
      { type: '产出', content: '战略地图三阶段规划', detail: '冲刺阶段：完善产品功能；评选阶段：准备演示材料；赛后阶段：持续迭代' },
      { type: '对话', content: '蒸馏这份技术方案文档', detail: '用户上传技术方案，系统提炼出关键认知和行动项' }
    ]},
    { date: '2026-07-07', items: [
      { type: '产出', content: '大赛开发日报#28', detail: '记录当天完成的工作：看板任务添加、记忆系统优化、晨报内容更新' },
      { type: '对话', content: '帮我拆解大赛参赛任务', detail: '用户要求将大赛准备工作拆解为具体的子任务' },
      { type: '决策', content: '采用iframe内嵌方式展示demo', detail: '确定demo-guide-v2.html使用iframe内嵌真实界面' }
    ]},
    { date: '2026-07-06', items: [
      { type: '对话', content: '从知识库检索大赛相关内容', detail: '用户检索了关于大赛规则和技术方案的文档' },
      { type: '产出', content: '并行看板任务设计', detail: '添加了7个大赛相关的开发任务，覆盖准备、开发、测试、验收全流程' },
      { type: '对话', content: '帮我生成周报', detail: '用户要求生成上周的工作周报，包含大赛准备进度' }
    ]}
  ],
  docs: {
    categories: [
      {
        name: '大赛方案',
        files: [
          { name: 'TRAE大赛-参赛方案.md', date: '2026-07-08', size: '2.3KB' },
          { name: '技术架构说明.md', date: '2026-07-07', size: '1.8KB' },
          { name: 'Demo演示脚本.md', date: '2026-07-09', size: '3.1KB' }
        ]
      },
      {
        name: '日报周报',
        files: [
          { name: '日报#28.md', date: '2026-07-09', size: '856B' },
          { name: '周报#7.md', date: '2026-07-07', size: '2.1KB' },
          { name: '日报#27.md', date: '2026-07-08', size: '912B' }
        ]
      },
      {
        name: '知识库',
        files: [
          { name: '系统设计文档.md', date: '2026-06-20', size: '5.2KB' },
          { name: 'API接口说明.md', date: '2026-06-15', size: '1.5KB' },
          { name: '用户手册.md', date: '2026-06-25', size: '3.8KB' }
        ]
      }
    ]
  },
  outputs: [
    { date: '2026-07-09', items: [
      { type: '文档', title: 'Demo演示脚本', path: '大赛方案/Demo演示脚本.md' },
      { type: '文档', title: '日报#28', path: '日报周报/日报#28.md' },
      { type: '页面', title: 'demo-guide-v2.html', path: 'tools/NEXWorkBoard/demo/contest/index.html' }
    ]},
    { date: '2026-07-08', items: [
      { type: '文档', title: '参赛方案', path: '大赛方案/TRAE大赛-参赛方案.md' },
      { type: '文档', title: '日报#27', path: '日报周报/日报#27.md' },
      { type: '对话', title: '战略地图设计', path: 'NEX决策系统/记忆系统/战略规划.md' }
    ]},
    { date: '2026-07-07', items: [
      { type: '文档', title: '技术架构说明', path: '大赛方案/技术架构说明.md' },
      { type: '文档', title: '周报#7', path: '日报周报/周报#7.md' },
      { type: '代码', title: 'app.js优化', path: 'tools/NEXWorkBoard/app.js' }
    ]}
  ],
  okr: {
    objectives: [
      {
        title: '大赛目标：进入学习工作赛道TOP10',
        progress: 85,
        keyResults: [
          { text: '完成产品核心功能开发', progress: 95 },
          { text: '完善Demo演示页面', progress: 80 },
          { text: '准备完整参赛材料', progress: 70 },
          { text: '录制高质量演示视频', progress: 0 }
        ]
      },
      {
        title: '冲刺阶段重点',
        progress: 65,
        keyResults: [
          { text: '完善Demo演示视频脚本', progress: 40 },
          { text: '整理Session ID证明材料', progress: 50 },
          { text: '优化UI交互体验', progress: 75 },
          { text: '添加大赛主题demo数据', progress: 90 }
        ]
      },
      {
        title: '赛后迭代规划',
        progress: 10,
        keyResults: [
          { text: '根据评委反馈优化产品', progress: 0 },
          { text: '扩展更多功能模块', progress: 0 },
          { text: '完善用户文档和教程', progress: 10 },
          { text: '构建用户社区', progress: 0 }
        ]
      }
    ]
  },
  finance: {
    totalCost: 128.50,
    monthlyData: [
      { month: '3月', cost: 15.20, tokens: 520000 },
      { month: '4月', cost: 28.60, tokens: 980000 },
      { month: '5月', cost: 35.80, tokens: 1240000 },
      { month: '6月', cost: 29.90, tokens: 1030000 },
      { month: '7月', cost: 19.00, tokens: 660000 }
    ],
    topCosts: [
      { name: '文档蒸馏', cost: 45.80, percent: 35.6 },
      { name: '记忆系统', cost: 32.40, percent: 25.2 },
      { name: '并行看板', cost: 28.30, percent: 22.0 },
      { name: '其他', cost: 22.00, percent: 17.2 }
    ]
  },
  health: {
    sleep: { score: 72, trend: -12, duration: '6小时45分', quality: '中等' },
    fitness: { score: 85, trend: 5, activity: '跑步5公里', calories: 380 },
    focus: { score: 88, trend: 8, deepWork: '4小时20分', meetings: '2小时' }
  },
  distill: {
    recent: [
      { title: 'TRAE大赛-技术方案.pdf', date: '2026-07-08', insights: 5 },
      { title: '竞品分析报告.pdf', date: '2026-07-06', insights: 3 },
      { title: '系统架构设计.docx', date: '2026-07-05', insights: 4 }
    ]
  },
  templates: [
    { name: '生成周报', desc: '根据最近产出自动生成周报', category: '工作' },
    { name: '文档蒸馏', desc: '提炼文档核心认知', category: '知识' },
    { name: '任务拆解', desc: '将大任务拆解为子任务', category: '任务' },
    { name: '回顾决策', desc: '回顾最近一周的关键决策', category: '记忆' },
    { name: '战略规划', desc: '制定近期战略目标', category: '战略' }
  ],
  fleet: {
    agents: [
      { name: '代码助手', status: '在线', tasks: 3, lastActive: '5分钟前' },
      { name: '文档助手', status: '在线', tasks: 1, lastActive: '30分钟前' },
      { name: '设计助手', status: '离线', tasks: 0, lastActive: '2小时前' },
      { name: '分析助手', status: '在线', tasks: 2, lastActive: '15分钟前' }
    ]
  },
  home: {
    greeting: '下午好',
    date: '2026-07-09',
    stats: {
      timeline: { value: '15条', label: '本周记忆' },
      newspaper: { value: '已更新', label: '今日晨报' },
      work: { value: '4项待办', label: '并行任务' },
      outputs: { value: '9份', label: '本周产出' }
    }
  }
};