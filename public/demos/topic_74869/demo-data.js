// ============ 菜单数据 ============
const Menus = {
  web: [
    {section:'🏆 参赛评审（必看）',items:[
      {id:'overview',icon:'🏆',name:'作品总览',badge:'NEW'},
      {id:'story',icon:'💝',name:'创作者故事',badge:'真实'},
      {id:'trae-practice',icon:'🛠️',name:'TRAE 实践过程'},
    ]},
    {section:'⭐ 演示中心（亮点）',items:[
      {id:'flow-demo',icon:'🎯',name:'端到端流程演示',badge:'NEW'},
      {id:'collab-demo',icon:'🔗',name:'三端协同演示',badge:'NEW'},
    ]},
    {section:'核心功能',items:[
      {id:'dashboard',icon:'📊',name:'指挥中心'},
      {id:'command',icon:'🖥️',name:'指挥大屏'},
      {id:'task',icon:'📋',name:'任务管理'},
      {id:'sos',icon:'🆘',name:'SOS 管理',badge:'3'},
      {id:'gis',icon:'🗺️',name:'GIS 态势'},
    ]},
    {section:'资源管理',items:[
      {id:'team',icon:'👥',name:'队伍管理'},
      {id:'equipment',icon:'🎒',name:'装备管理'},
      {id:'device',icon:'📡',name:'设备管理'},
      {id:'logistics',icon:'📦',name:'物流管理'},
      {id:'training',icon:'📚',name:'培训管理'},
      {id:'cert',icon:'📜',name:'证书管理'},
    ]},
    {section:'协同与决策',items:[
      {id:'fusion',icon:'📞',name:'融合通信'},
      {id:'gov',icon:'🏛️',name:'政府对接'},
      {id:'decision',icon:'🤖',name:'AI 决策'},
      {id:'report',icon:'📈',name:'报表导出'},
    ]},
    {section:'系统',items:[
      {id:'message',icon:'💬',name:'消息通知',badge:'12'},
      {id:'system',icon:'⚙️',name:'系统管理'},
      {id:'outbox',icon:'⚠️',name:'死信治理'},
      {id:'collab',icon:'🔗',name:'多端协同'},
    ]},
  ],
  mini: [
    {section:'TabBar 主页',items:[
      {id:'mini-home',icon:'🏠',name:'首页'},
      {id:'mini-sos',icon:'🆘',name:'紧急求助'},
      {id:'mini-knowledge',icon:'📖',name:'科普知识'},
      {id:'mini-profile',icon:'👤',name:'我的'},
    ]},
    {section:'功能模块',items:[
      {id:'mini-shelter',icon:'🏕️',name:'避难场所'},
      {id:'mini-volunteer',icon:'🤝',name:'志愿者招募'},
      {id:'mini-task',icon:'📋',name:'我的任务'},
      {id:'mini-training',icon:'📚',name:'培训报名'},
      {id:'mini-message',icon:'💬',name:'消息中心'},
      {id:'mini-ai',icon:'🤖',name:'AI 应急问答'},
      {id:'mini-search',icon:'🔍',name:'全局搜索'},
      {id:'mini-phonebook',icon:'📞',name:'应急电话簿'},
    ]},
  ],
  app: [
    {section:'通用功能',items:[
      {id:'app-rescuer',icon:'🧑',name:'救援人员端'},
      {id:'app-task-detail',icon:'📋',name:'任务详情'},
      {id:'app-equip-scan',icon:'📷',name:'装备扫码'},
      {id:'app-sos-detail',icon:'🆘',name:'SOS 等待'},
      {id:'app-ai-chat',icon:'🤖',name:'AI 助手'},
      {id:'app-location',icon:'📍',name:'位置共享'},
    ]},
    {section:'队长端',items:[
      {id:'app-commander',icon:'👨‍✈️',name:'队长工作台'},
      {id:'app-swarm',icon:'🎯',name:'集群调度'},
      {id:'app-video-wall',icon:'🎥',name:'视频墙'},
      {id:'app-decision',icon:'🧠',name:'AI 决策面板'},
      {id:'app-attendance',icon:'⏰',name:'考勤审核'},
      {id:'app-contacts',icon:'📇',name:'通讯录'},
    ]},
    {section:'飞手端',items:[
      {id:'app-drone',icon:'🚁',name:'无人机列表'},
      {id:'app-flight-plan',icon:'🗺️',name:'航线规划'},
      {id:'app-drone-video',icon:'📡',name:'实时图传'},
      {id:'app-telemetry',icon:'📊',name:'遥测监控'},
      {id:'app-geo-fence',icon:'🚧',name:'电子围栏'},
      {id:'app-pilot-cert',icon:'📜',name:'飞手认证'},
    ]},
  ],
};
