// 救邻 H5 系统 - 模拟数据

const JLData = {
  // 当前登录用户（游客模式）
  currentUser: {
    name: '未登录',
    role: 'guest',
    avatar: '我'
  },

  // 志愿者模拟数据
  volunteers: [
    {
      id: 1,
      name: '李医生',
      title: '急诊科',
      hospital: '三甲医院',
      distance: 280,
      cert: '执业医师',
      verified: true,
      avatar: '李',
      responseRate: 98,
      rescueCount: 12,
      rating: 4.9,
      status: '已接单'
    },
    {
      id: 2,
      name: '王护士',
      title: '心内科',
      hospital: '市立医院',
      distance: 450,
      cert: '执业护士',
      verified: true,
      avatar: '王',
      responseRate: 95,
      rescueCount: 8,
      rating: 4.8,
      status: '待响应'
    },
    {
      id: 3,
      name: '张救护员',
      title: '红十字救护员',
      hospital: '',
      distance: 620,
      cert: '红十字救护员',
      verified: true,
      avatar: '张',
      responseRate: 88,
      rescueCount: 5,
      rating: 4.7,
      status: '待响应'
    }
  ],

  // AED 模拟数据
  aedDevices: [
    {
      id: 1,
      name: '社区服务中心 AED',
      address: '朝阳区建国路 88 号社区服务中心一楼大厅',
      distance: 150,
      type: 'public',
      available: true,
      is24h: true,
      lat: 30,
      lng: 25,
      pin: 'A'
    },
    {
      id: 2,
      name: '万达广场 AED',
      address: '万达广场 2 号门服务台旁',
      distance: 320,
      type: 'public',
      available: true,
      is24h: false,
      lat: 45,
      lng: 65,
      pin: 'B'
    },
    {
      id: 3,
      name: '阳光便利店 AED',
      address: '建国路阳光便利店（个人共享）',
      distance: 450,
      type: 'private',
      available: true,
      is24h: false,
      lat: 60,
      lng: 40,
      pin: 'C'
    },
    {
      id: 4,
      name: '地铁国贸站 AED',
      address: '地铁 1 号线国贸站 C 出口',
      distance: 680,
      type: 'public',
      available: true,
      is24h: true,
      lat: 25,
      lng: 80,
      pin: 'D'
    }
  ],

  // 症状数据
  symptoms: [
    {
      id: 'cardiac',
      icon: '🫀',
      name: '心脏骤停',
      desc: '无意识、无呼吸、无脉搏',
      guidance: [
        '确认现场环境安全，避免二次伤害',
        '轻拍患者双肩，大声呼唤判断意识',
        '如无呼吸，立即开始胸外按压 30 次',
        '按压深度 5-6cm，频率 100-120 次/分'
      ]
    },
    {
      id: 'epilepsy',
      icon: '⚡',
      name: '癫痫抽搐',
      desc: '全身抽搐、意识丧失',
      guidance: [
        '移开周围危险物品，保护患者头部',
        '不要强行按住患者肢体',
        '将患者侧卧，保持呼吸道通畅',
        '记录抽搐时间，等待专业救援'
      ]
    },
    {
      id: 'coma',
      icon: '😵',
      name: '昏迷晕倒',
      desc: '突然倒地、呼叫无反应',
      guidance: [
        '判断意识和呼吸，检查是否有外伤',
        '如无脊柱损伤怀疑，将患者置于复苏体位',
        '保持呼吸道通畅，松解衣领',
        '观察生命体征，等待救援'
      ]
    },
    {
      id: 'bleeding',
      icon: '🩸',
      name: '大出血',
      desc: '外伤出血难以止住',
      guidance: [
        '用干净纱布或布料直接压迫伤口',
        '抬高出血部位高于心脏',
        '如出血严重，使用止血带并记录时间',
        '不要移除已粘附在伤口上的敷料'
      ]
    },
    {
      id: 'choke',
      icon: '🗣️',
      name: '气道异物',
      desc: '无法呼吸、面色发紫',
      guidance: [
        '鼓励患者咳嗽，不要拍打背部',
        '如无法咳嗽，立即实施海姆立克急救法',
        '站在患者背后，一手握拳置于肚脐上方',
        '另一手抓住拳头，快速向上向内冲击'
      ]
    },
    {
      id: 'other',
      icon: '❓',
      name: '其他急症',
      desc: '不确定，需要专业帮助',
      guidance: [
        '保持冷静，不要移动患者',
        '观察并记录症状变化',
        '保持患者舒适体位',
        '等待专业救援人员到达'
      ]
    }
  ],

  // AI 指引样本
  aiSamples: [
    '心脏骤停，无意识无呼吸',
    '有人突然昏迷，叫不醒',
    '吃饭时被异物卡住喉咙',
    '手臂外伤大出血',
    '老人摔倒，可能骨折'
  ],

  // AI 回复模板
  aiResponses: {
    '心脏骤停': {
      title: '🚨 紧急情况：疑似心脏骤停',
      steps: [
        { title: '确认现场安全', desc: '确保周围环境安全，避免施救者和患者受到二次伤害。' },
        { title: '判断意识和呼吸', desc: '轻拍双肩大声呼唤，观察胸部是否有起伏，判断时间不超过 10 秒。' },
        { title: '立即呼救并开始 CPR', desc: '让旁人拨打 120 并取 AED。将患者平放硬地面，双手重叠按压胸骨下半部，深度 5-6cm，频率 100-120 次/分。' },
        { title: '使用 AED', desc: 'AED 到达后立即开机，按语音提示贴电极片，电击前确保无人接触患者。' }
      ],
      warnings: [
        '不要随意搬动患者，除非环境不安全',
        '按压时手臂伸直，用上半身力量',
        '人工呼吸非必须，持续胸外按压更重要'
      ]
    },
    '昏迷': {
      title: '😵 紧急情况：患者昏迷',
      steps: [
        { title: '确认安全并判断意识', desc: '确保环境安全，轻拍双肩、大声呼唤。' },
        { title: '检查呼吸', desc: '观察胸部起伏，听呼吸音，感觉气流，时间不超过 10 秒。' },
        { title: '摆放复苏体位', desc: '如无脊柱损伤怀疑，将患者侧卧，头部后仰，保持气道通畅。' },
        { title: '拨打 120', desc: '立即拨打急救电话，说明地点和患者情况。' }
      ],
      warnings: [
        '怀疑脊柱损伤时不要随意搬动',
        '如有呕吐，及时清理口腔异物',
        '记录昏迷时间和前后情况'
      ]
    },
    '异物': {
      title: '🗣️ 紧急情况：气道异物梗阻',
      steps: [
        { title: '鼓励咳嗽', desc: '如患者能咳嗽、说话，鼓励其继续咳嗽，不要拍打背部。' },
        { title: '海姆立克急救法', desc: '站在患者背后，一手握拳置于肚脐上方，另一手抓住拳头快速向上向内冲击。' },
        { title: '自救方法', desc: '如独自一人，可用椅背或桌角顶住上腹部，快速向上冲击。' },
        { title: '昏迷后处理', desc: '如患者昏迷，立即开始 CPR 并拨打 120。' }
      ],
      warnings: [
        '不要给还能咳嗽的患者喂水或拍背',
        '婴儿需使用背部拍击和胸部冲击法',
        '解除梗阻后仍需就医检查'
      ]
    },
    '出血': {
      title: '🩸 紧急情况：大出血',
      steps: [
        { title: '直接压迫止血', desc: '用干净纱布、毛巾或衣物直接压迫伤口。' },
        { title: '抬高患肢', desc: '将出血部位抬高至高于心脏的位置。' },
        { title: '使用止血带', desc: '如直接压迫无效，在伤口近心端使用止血带，并记录上带时间。' },
        { title: '拨打 120', desc: '大出血属于急症，需立即送医。' }
      ],
      warnings: [
        '不要频繁揭开敷料查看伤口',
        '止血带每隔 1 小时需放松 1-2 分钟',
        '记录出血量和止血时间'
      ]
    },
    '摔倒': {
      title: '🦴 紧急情况：摔倒可能骨折',
      steps: [
        { title: '不要移动患者', desc: '先确认意识和呼吸，询问疼痛部位。' },
        { title: '止血包扎', desc: '如有外伤出血，先压迫止血。' },
        { title: '固定伤肢', desc: '怀疑骨折时，用夹板或硬纸板固定伤肢上下关节。' },
        { title: '等待救援', desc: '拨打 120，不要随意搬动疑似脊柱损伤者。' }
      ],
      warnings: [
        '不要试图复位明显畸形的骨折',
        '怀疑脊柱损伤时保持原位等待',
        '观察是否有休克迹象'
      ]
    }
  },

  // 默认 AI 回复
  defaultAIResponse: {
    title: '🏥 急救指引',
    steps: [
      { title: '保持冷静', desc: '先确认现场安全，再评估患者意识和呼吸。' },
      { title: '立即呼救', desc: '让旁人拨打 120，说明地点和患者大致情况。' },
      { title: '持续观察', desc: '记录症状变化，保持患者舒适体位，等待专业救援。' }
    ],
    warnings: [
      '本平台指引仅供参考，不能替代专业医疗建议',
      '紧急情况请优先拨打 120',
      '如患者无意识无呼吸，立即开始心肺复苏'
    ]
  }
};
