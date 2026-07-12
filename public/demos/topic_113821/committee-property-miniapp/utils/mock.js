const mockData = {
  announcements: [
    {
      id: 'a001',
      title: '关于地库照明整改结果的公示',
      type: '整改结果',
      publisher: '业委会',
      publishTime: '2026-07-08 14:30',
      isTop: true,
      readCount: 328,
      content: '各位业主：\n\n针对地下车库照明不足的问题，物业公司已于7月5日完成全部整改工作，业委会于7月7日组织验收。\n\n整改内容：\n1. 更换LED灯管共计186盏\n2. 修复故障线路12处\n3. 增加应急照明装置8套\n\n验收结果：合格。现将整改结果公示，如有异议请于7月15日前向业委会反映。\n\n阳光花园业主委员会\n2026年7月8日',
      attachments: [
        { name: '整改前后对比照片.pdf', size: '2.4MB' },
        { name: '验收报告.pdf', size: '1.1MB' }
      ]
    },
    {
      id: 'a002',
      title: '关于召开2026年第二次业主大会的通知',
      type: '业主大会',
      publisher: '业委会',
      publishTime: '2026-07-05 09:00',
      isTop: true,
      readCount: 512,
      content: '各位业主：\n\n根据《业主大会议事规则》，经业委会研究决定，定于2026年7月20日召开第二次业主大会。\n\n会议议题：\n1. 审议2026年上半年工作报告\n2. 表决电梯维保合同续签事宜\n3. 讨论公共收益使用方案\n\n会议形式：线上表决+线下现场\n线上表决时间：7月15日-7月19日\n现场会议时间：7月20日下午14:00\n会议地点：小区活动中心二楼\n\n请各位业主积极参与。\n\n阳光花园业主委员会\n2026年7月5日',
      attachments: [
        { name: '业主大会议程.docx', size: '32KB' },
        { name: '上半年工作报告.pdf', size: '890KB' }
      ]
    },
    {
      id: 'a003',
      title: '6月份公共收益收支情况公示',
      type: '财务公开',
      publisher: '业委会',
      publishTime: '2026-07-03 16:00',
      isTop: false,
      readCount: 287,
      content: '各位业主：\n\n现将2026年6月份小区公共收益收支情况公示如下：\n\n一、收入情况\n1. 小区广告位租金：12,000元\n2. 快递柜场地费：3,000元\n3. 停车位临时收入：8,500元\n4. 其他收入：1,200元\n合计：24,700元\n\n二、支出情况\n1. 业主活动经费：5,000元\n2. 公共设施维修：3,200元\n3. 办公费用：800元\n合计：9,000元\n\n三、本月结余：15,700元\n累计公共收益结余：128,500元\n\n如有疑问，请于7月10日前向业委会查询。\n\n阳光花园业主委员会\n2026年7月3日',
      attachments: [
        { name: '6月公共收益明细表.xlsx', size: '45KB' }
      ]
    },
    {
      id: 'a004',
      title: '关于夏季用电安全的温馨提示',
      type: '温馨提示',
      publisher: '物业服务中心',
      publishTime: '2026-07-01 10:00',
      isTop: false,
      readCount: 445,
      content: '尊敬的业主：\n\n夏季是用电高峰期，为确保您和家人的安全，物业服务中心温馨提示：\n\n1. 请合理使用空调、电热水器等大功率电器，避免同时使用导致过载\n2. 外出时请关闭不必要的电源，做到人走断电\n3. 请勿在楼道、消防通道堆放杂物，保持畅通\n4. 如发现电器故障或线路异常，请及时联系物业服务中心\n\n物业服务中心24小时服务电话：400-xxx-xxxx\n\n感谢您的配合！\n\n阳光花园物业服务中心\n2026年7月1日',
      attachments: []
    }
  ],

  issues: [
    {
      id: 'i001',
      title: '北门门禁改造',
      status: 'collecting',
      statusText: '意见征集中',
      leader: '张委员',
      createTime: '2026-07-06',
      deadline: '2026-07-20',
      description: '北门门禁系统使用年限已久，经常出现识别不灵敏、闸门卡顿等问题，业委会提议对北门门禁进行升级改造。',
      feedbackCount: 47,
      category: '设施改造',
      materials: [
        { name: '门禁系统现状照片.zip', size: '5.6MB' },
        { name: '改造方案对比.docx', size: '2.1MB' }
      ],
      timeline: [
        { time: '2026-07-06 09:00', content: '议题创建，进入意见征集阶段', operator: '张委员' },
        { time: '2026-07-06 14:00', content: '发布意见征集公告', operator: '张委员' },
        { time: '2026-07-08 10:00', content: '已收集业主意见32条', operator: '系统' }
      ],
      relatedOrders: ['o003']
    },
    {
      id: 'i002',
      title: '电梯维保合同续签',
      status: 'voting',
      statusText: '待表决',
      leader: '李主任',
      createTime: '2026-07-02',
      deadline: '2026-07-19',
      description: '现有电梯维保合同将于8月底到期，需就是否与原维保公司续签合同进行业主表决。',
      feedbackCount: 23,
      category: '合同采购',
      materials: [
        { name: '原维保合同.pdf', size: '1.2MB' },
        { name: '维保服务报价单.pdf', size: '560KB' },
        { name: '近一年维保记录汇总.xlsx', size: '320KB' }
      ],
      timeline: [
        { time: '2026-07-02 10:00', content: '议题创建', operator: '李主任' },
        { time: '2026-07-04 15:00', content: '完成材料公示', operator: '李主任' },
        { time: '2026-07-08 09:00', content: '进入业主表决阶段', operator: '李主任' }
      ],
      relatedOrders: [],
      voteInfo: {
        totalVoters: 856,
        votedCount: 234,
        agreeCount: 189,
        disagreeCount: 28,
        abstainCount: 17,
        endTime: '2026-07-19 23:59:59'
      }
    },
    {
      id: 'i003',
      title: '地下车库照明整改',
      status: 'acceptance',
      statusText: '待验收',
      leader: '王委员',
      createTime: '2026-06-20',
      deadline: '2026-07-10',
      description: '地下车库多处照明灯具损坏，光线不足，存在安全隐患，需督促物业整改。',
      feedbackCount: 15,
      category: '物业整改',
      materials: [
        { name: '照明问题照片.zip', size: '3.2MB' }
      ],
      timeline: [
        { time: '2026-06-20 10:00', content: '议题创建', operator: '王委员' },
        { time: '2026-06-21 09:00', content: '派发物业整改工单', operator: '王委员' },
        { time: '2026-07-05 16:00', content: '物业提交完成反馈，等待验收', operator: '物业-赵经理' }
      ],
      relatedOrders: ['o001']
    },
    {
      id: 'i004',
      title: '小区绿化补种方案',
      status: 'processing',
      statusText: '处理中',
      leader: '陈委员',
      createTime: '2026-07-01',
      deadline: '2026-07-25',
      description: '部分区域绿植因季节和病虫害原因出现枯死，需制定补种方案并监督物业实施。',
      feedbackCount: 8,
      category: '环境维护',
      materials: [
        { name: '枯死绿植清单.xlsx', size: '45KB' }
      ],
      timeline: [
        { time: '2026-07-01 14:00', content: '议题创建', operator: '陈委员' },
        { time: '2026-07-03 10:00', content: '与物业协商补种方案', operator: '陈委员' }
      ],
      relatedOrders: ['o002']
    },
    {
      id: 'i005',
      title: '消防通道堆物清理',
      status: 'completed',
      statusText: '已完成',
      leader: '李主任',
      createTime: '2026-06-10',
      deadline: '2026-06-30',
      description: '小区部分楼栋消防通道存在杂物堆放情况，存在消防安全隐患，需督促清理。',
      feedbackCount: 31,
      category: '安全管理',
      materials: [],
      timeline: [
        { time: '2026-06-10 09:00', content: '议题创建', operator: '李主任' },
        { time: '2026-06-12 10:00', content: '派发整改通知', operator: '李主任' },
        { time: '2026-06-25 15:00', content: '物业反馈清理完成', operator: '物业-赵经理' },
        { time: '2026-06-28 10:00', content: '业委会验收通过', operator: '李主任' },
        { time: '2026-07-01 09:00', content: '公示结束，已归档', operator: '系统' }
      ],
      relatedOrders: ['o004']
    }
  ],

  workOrders: [
    {
      id: 'o001',
      title: '地下车库照明整改',
      type: '公共整改',
      source: '业委会',
      status: 'waiting_acceptance',
      statusText: '待验收',
      priority: 'high',
      createTime: '2026-06-21 09:00',
      deadline: '2026-07-05',
      contact: '王委员',
      phone: '138****5678',
      location: 'B1地下车库',
      description: '地下车库A区、B区共42盏灯具损坏，需全部更换为LED灯，并检查线路安全。',
      images: ['车库照明问题1.jpg', '车库照明问题2.jpg'],
      progress: [
        { time: '2026-06-21 09:00', content: '工单创建，派发给物业', operator: '业委会-王委员' },
        { time: '2026-06-22 10:00', content: '物业接单，安排工程班处理', operator: '物业-赵经理' },
        { time: '2026-07-05 16:00', content: '处理完成，提交验收申请', operator: '物业-赵经理', images: ['整改后照片1.jpg', '整改后照片2.jpg'] }
      ],
      isOverdue: false
    },
    {
      id: 'o002',
      title: '小区绿化补种',
      type: '公共整改',
      source: '业委会',
      status: 'processing',
      statusText: '处理中',
      priority: 'medium',
      createTime: '2026-07-03 10:00',
      deadline: '2026-07-20',
      contact: '陈委员',
      phone: '139****1234',
      location: '小区各公共区域',
      description: '对小区内枯死的绿植进行补种，包括灌木30株、草坪200平米。',
      images: [],
      progress: [
        { time: '2026-07-03 10:00', content: '工单创建，派发给物业', operator: '业委会-陈委员' },
        { time: '2026-07-04 09:00', content: '物业接单，采购苗木中', operator: '物业-赵经理' }
      ],
      isOverdue: false
    },
    {
      id: 'o003',
      title: '北门门禁故障报修',
      type: '个人报修',
      source: '业主',
      status: 'completed',
      statusText: '已完成',
      priority: 'medium',
      createTime: '2026-07-02 14:30',
      deadline: '2026-07-04',
      contact: '3-1802 业主',
      phone: '137****8901',
      location: '北门门禁',
      description: '北门人脸识别门禁经常识别失败，上下班高峰期很不方便。',
      images: ['门禁故障照片.jpg'],
      progress: [
        { time: '2026-07-02 14:30', content: '业主提交报修', operator: '业主' },
        { time: '2026-07-02 15:00', content: '物业接单，安排技术人员处理', operator: '物业-客服' },
        { time: '2026-07-03 11:00', content: '技术人员到场维修', operator: '物业-维修师傅' },
        { time: '2026-07-03 16:00', content: '维修完成，设备恢复正常', operator: '物业-维修师傅' }
      ],
      isOverdue: false,
      rating: 5
    },
    {
      id: 'o004',
      title: '消防通道堆物清理',
      type: '公共整改',
      source: '业委会',
      status: 'completed',
      statusText: '已完成',
      priority: 'high',
      createTime: '2026-06-12 10:00',
      deadline: '2026-06-20',
      contact: '李主任',
      phone: '136****5555',
      location: '2栋、5栋楼道',
      description: '2栋、5栋部分楼层消防通道堆放纸箱、旧家具等杂物，存在消防安全隐患，需限期清理。',
      images: ['消防通道堆物1.jpg', '消防通道堆物2.jpg'],
      progress: [
        { time: '2026-06-12 10:00', content: '工单创建，派发给物业', operator: '业委会-李主任' },
        { time: '2026-06-13 09:00', content: '物业上门通知业主清理', operator: '物业-赵经理' },
        { time: '2026-06-20 15:00', content: '清理完毕，提交验收', operator: '物业-赵经理' },
        { time: '2026-06-25 10:00', content: '业委会验收通过', operator: '业委会-李主任' }
      ],
      isOverdue: false
    },
    {
      id: 'o005',
      title: '2栋电梯异响',
      type: '个人报修',
      source: '业主',
      status: 'dispatched',
      statusText: '已派单',
      priority: 'high',
      createTime: '2026-07-09 08:15',
      deadline: '2026-07-09 18:00',
      contact: '2-1203 业主',
      phone: '135****2233',
      location: '2栋西单元电梯',
      description: '电梯运行时有异常响声，特别是在10-15层之间，感觉有安全隐患。',
      images: [],
      progress: [
        { time: '2026-07-09 08:15', content: '业主提交报修', operator: '业主' },
        { time: '2026-07-09 08:30', content: '物业接单，已派单给维保公司', operator: '物业-客服' }
      ],
      isOverdue: false
    },
    {
      id: 'o006',
      title: '外墙渗水报修',
      type: '个人报修',
      source: '业主',
      status: 'processing',
      statusText: '处理中',
      priority: 'medium',
      createTime: '2026-07-07 10:00',
      deadline: '2026-07-14',
      contact: '5-805 业主',
      phone: '133****4455',
      location: '5栋805主卧外墙',
      description: '主卧外墙渗水，下雨后墙面潮湿，已经出现霉斑。',
      images: ['渗水墙面1.jpg', '渗水墙面2.jpg'],
      progress: [
        { time: '2026-07-07 10:00', content: '业主提交报修', operator: '业主' },
        { time: '2026-07-07 11:00', content: '物业接单，安排师傅现场查看', operator: '物业-客服' },
        { time: '2026-07-08 15:00', content: '师傅确认渗水原因，需申请维修基金', operator: '物业-维修师傅' }
      ],
      isOverdue: false
    },
    {
      id: 'o007',
      title: '垃圾分类亭设施损坏',
      type: '公共整改',
      source: '业委会',
      status: 'pending',
      statusText: '待处理',
      priority: 'low',
      createTime: '2026-07-08 16:00',
      deadline: '2026-07-15',
      contact: '王委员',
      phone: '138****5678',
      location: '东门垃圾分类亭',
      description: '垃圾分类亭顶棚破损，洗手池水龙头漏水，需维修。',
      images: ['垃圾亭破损1.jpg'],
      progress: [
        { time: '2026-07-08 16:00', content: '工单创建，等待物业接单', operator: '业委会-王委员' }
      ],
      isOverdue: false
    },
    {
      id: 'o008',
      title: '健身器材维护',
      type: '公共整改',
      source: '业委会',
      status: 'overdue',
      statusText: '已超时',
      priority: 'medium',
      createTime: '2026-06-28 10:00',
      deadline: '2026-07-05',
      contact: '陈委员',
      phone: '139****1234',
      location: '小区健身区',
      description: '健身区部分器材螺丝松动、部分部件生锈，需全面检修维护。',
      images: [],
      progress: [
        { time: '2026-06-28 10:00', content: '工单创建，派发给物业', operator: '业委会-陈委员' }
      ],
      isOverdue: true
    }
  ],

  votes: [
    {
      id: 'v001',
      title: '关于电梯维保合同续签的表决',
      status: 'ongoing',
      statusText: '进行中',
      createTime: '2026-07-08',
      endTime: '2026-07-19 23:59:59',
      sponsor: '业委会',
      totalVoters: 856,
      votedCount: 234,
      description: '现有电梯维保合同将于2026年8月31日到期，经业委会研究，拟与原维保公司续签一年合同。现将有关事项提交业主表决。',
      options: [
        { label: '同意续签', count: 189, percentage: 80.8 },
        { label: '不同意，重新招标', count: 28, percentage: 12.0 },
        { label: '弃权', count: 17, percentage: 7.2 }
      ],
      materials: [
        { name: '原维保合同.pdf', size: '1.2MB' },
        { name: '报价对比表.xlsx', size: '45KB' }
      ]
    },
    {
      id: 'v002',
      title: '关于公共收益用于小区设施升级的表决',
      status: 'upcoming',
      statusText: '即将开始',
      createTime: '2026-07-09',
      endTime: '2026-07-25 23:59:59',
      sponsor: '业委会',
      totalVoters: 856,
      votedCount: 0,
      description: '为提升小区居住品质，业委会提议从公共收益中列支20万元用于小区儿童游乐设施升级和健身器材更新。',
      options: [
        { label: '同意', count: 0, percentage: 0 },
        { label: '不同意', count: 0, percentage: 0 },
        { label: '弃权', count: 0, percentage: 0 }
      ],
      materials: [
        { name: '设施升级方案.docx', size: '890KB' },
        { name: '预算明细表.xlsx', size: '67KB' }
      ]
    },
    {
      id: 'v003',
      title: '2026年上半年工作报告审议',
      status: 'ended',
      statusText: '已结束',
      createTime: '2026-06-15',
      endTime: '2026-06-25 23:59:59',
      sponsor: '业委会',
      totalVoters: 856,
      votedCount: 567,
      description: '审议业委会2026年上半年工作报告。',
      options: [
        { label: '满意', count: 412, percentage: 72.7 },
        { label: '基本满意', count: 102, percentage: 18.0 },
        { label: '不满意', count: 35, percentage: 6.2 },
        { label: '弃权', count: 18, percentage: 3.1 }
      ],
      materials: [
        { name: '2026上半年工作报告.pdf', size: '1.5MB' }
      ]
    }
  ],

  committeeTasks: {
    pendingReview: 3,
    pendingAcceptance: 5,
    overdue: 1,
    drafts: [
      { title: '6月公共收益公示', status: '待2位委员确认后发布', type: '公告草稿' }
    ]
  },

  propertyStats: {
    newOrders: 8,
    rectification: 4,
    overdue: 2,
    pendingAcceptance: 3
  },

  ownerStats: {
    processingOrders: 3,
    pendingRating: 1,
    ongoingVotes: 2
  },

  accessCode: {
    qrCodeUrl: '',
    expireTime: '2026-07-09 23:59:59',
    doorList: [
      { id: 'd001', name: '小区大门', status: 'active' },
      { id: 'd002', name: '3栋单元门', status: 'active' },
      { id: 'd003', name: '地下车库入口', status: 'active' }
    ],
    recentRecords: [
      { time: '2026-07-09 08:15', door: '小区大门', type: '扫码开门' },
      { time: '2026-07-08 18:30', door: '3栋单元门', type: '扫码开门' },
      { time: '2026-07-08 07:45', door: '小区大门', type: '扫码开门' }
    ]
  },

  paymentBills: {
    property: [
      {
        id: 'pb001',
        type: '物业费',
        period: '2026年7月',
        amount: 386.00,
        status: 'unpaid',
        dueDate: '2026-07-31',
        detail: {
          area: '96.5㎡',
          unitPrice: '4.00元/㎡·月',
          items: [
            { name: '物业管理费', amount: 386.00 }
          ]
        }
      },
      {
        id: 'pb002',
        type: '物业费',
        period: '2026年6月',
        amount: 386.00,
        status: 'paid',
        paidTime: '2026-06-10 14:30',
        dueDate: '2026-06-30'
      },
      {
        id: 'pb003',
        type: '物业费',
        period: '2026年5月',
        amount: 386.00,
        status: 'paid',
        paidTime: '2026-05-08 10:15',
        dueDate: '2026-05-31'
      }
    ],
    parking: [
      {
        id: 'pk001',
        type: '停车费',
        period: '2026年7月',
        amount: 300.00,
        status: 'unpaid',
        dueDate: '2026-07-15',
        detail: {
          spot: 'B1-156号车位',
          items: [
            { name: '车位月租', amount: 300.00 }
          ]
        }
      },
      {
        id: 'pk002',
        type: '停车费',
        period: '2026年6月',
        amount: 300.00,
        status: 'paid',
        paidTime: '2026-06-05 09:20',
        dueDate: '2026-06-15'
      }
    ]
  },

  publicFunds: {
    maintenanceFund: {
      balance: 1285600.00,
      totalIncome: 2560000.00,
      totalExpense: 1274400.00,
      records: [
        { date: '2026-06-15', type: '支出', item: '电梯维修', amount: -28500.00, balance: 1285600.00 },
        { date: '2026-05-20', type: '收入', item: '利息收入', amount: 3200.00, balance: 1314100.00 },
        { date: '2026-04-10', type: '支出', item: '消防设施更新', amount: -45000.00, balance: 1310900.00 },
        { date: '2026-03-01', type: '收入', item: '首期归集', amount: 2560000.00, balance: 2560000.00 }
      ]
    },
    publicIncome: {
      totalBalance: 128500.00,
      monthIncome: 24700.00,
      monthExpense: 9000.00,
      monthlyRecords: [
        {
          month: '2026年6月',
          income: 24700.00,
          expense: 9000.00,
          balance: 15700.00,
          incomeItems: [
            { name: '广告位租金', amount: 12000.00 },
            { name: '快递柜场地费', amount: 3000.00 },
            { name: '临时停车收入', amount: 8500.00 },
            { name: '其他收入', amount: 1200.00 }
          ],
          expenseItems: [
            { name: '业主活动经费', amount: 5000.00 },
            { name: '公共设施维修', amount: 3200.00 },
            { name: '办公费用', amount: 800.00 }
          ]
        },
        {
          month: '2026年5月',
          income: 22300.00,
          expense: 7500.00,
          balance: 14800.00,
          incomeItems: [
            { name: '广告位租金', amount: 12000.00 },
            { name: '快递柜场地费', amount: 3000.00 },
            { name: '临时停车收入', amount: 6800.00 },
            { name: '其他收入', amount: 500.00 }
          ],
          expenseItems: [
            { name: '业主活动经费', amount: 4000.00 },
            { name: '公共设施维修', amount: 2800.00 },
            { name: '办公费用', amount: 700.00 }
          ]
        }
      ]
    }
  },

  inspection: {
    dailyTasks: [
      {
        id: 'ins001',
        type: '日常巡检',
        date: '2026-07-09',
        status: 'in_progress',
        area: '公共区域',
        totalItems: 12,
        completedItems: 8,
        items: [
          { id: 'item001', name: '电梯运行检查', status: 'normal', remark: '' },
          { id: 'item002', name: '消防通道检查', status: 'normal', remark: '' },
          { id: 'item003', name: '公共照明检查', status: 'issue', remark: 'B1层有3盏灯不亮' },
          { id: 'item004', name: '绿化养护检查', status: 'normal', remark: '' },
          { id: 'item005', name: '环境卫生检查', status: 'normal', remark: '' },
          { id: 'item006', name: '门禁设备检查', status: 'normal', remark: '' },
          { id: 'item007', name: '监控设备检查', status: 'pending', remark: '' },
          { id: 'item008', name: '健身器材检查', status: 'pending', remark: '' },
          { id: 'item009', name: '儿童设施检查', status: 'pending', remark: '' },
          { id: 'item010', name: '垃圾投放点检查', status: 'pending', remark: '' },
          { id: 'item011', name: '排水设施检查', status: 'pending', remark: '' },
          { id: 'item012', name: '道路井盖检查', status: 'pending', remark: '' }
        ]
      }
    ],
    periodicTasks: [
      {
        id: 'per001',
        type: '周期性巡检',
        name: '消防设施月度检查',
        cycle: '月度',
        status: 'pending',
        deadline: '2026-07-15',
        template: '消防设施检查模板',
        totalItems: 25
      },
      {
        id: 'per002',
        type: '周期性巡检',
        name: '配电房季度检查',
        cycle: '季度',
        status: 'upcoming',
        deadline: '2026-07-20',
        template: '配电房检查模板',
        totalItems: 18
      },
      {
        id: 'per003',
        type: '周期性巡检',
        name: '电梯维保监督',
        cycle: '半月度',
        status: 'completed',
        deadline: '2026-07-05',
        template: '电梯检查模板',
        totalItems: 15,
        completedTime: '2026-07-03'
      }
    ],
    records: [
      {
        id: 'rec001',
        date: '2026-07-08',
        type: '日常巡检',
        inspector: '张师傅',
        issuesFound: 1,
        status: 'completed'
      },
      {
        id: 'rec002',
        date: '2026-07-07',
        type: '日常巡检',
        inspector: '李师傅',
        issuesFound: 0,
        status: 'completed'
      },
      {
        id: 'rec003',
        date: '2026-07-03',
        type: '周期性巡检',
        name: '电梯维保监督',
        inspector: '王工',
        issuesFound: 2,
        status: 'completed'
      }
    ]
  },

  ownerMeeting: {
    current: {
      id: 'm001',
      title: '2026年第二次业主大会',
      status: 'ongoing',
      statusText: '进行中',
      startTime: '2026-07-15 09:00',
      endTime: '2026-07-19 23:59',
      location: '小区活动中心二楼',
      signInCount: 328,
      totalOwners: 856,
      agenda: [
        '审议2026年上半年工作报告',
        '表决电梯维保合同续签事宜',
        '讨论公共收益使用方案'
      ],
      materials: [
        { name: '业主大会议程.docx', size: '32KB' },
        { name: '上半年工作报告.pdf', size: '890KB' }
      ],
      voteItems: [
        { id: 'v001', title: '电梯维保合同续签', status: 'ongoing' }
      ]
    },
    history: [
      {
        id: 'm002',
        title: '2026年第一次业主大会',
        status: 'ended',
        statusText: '已结束',
        startTime: '2026-03-10',
        endTime: '2026-03-20'
      }
    ]
  }
}

function getAnnouncements(params = {}) {
  let list = [...mockData.announcements]
  if (params.type) {
    list = list.filter(item => item.type === params.type)
  }
  if (params.isTop !== undefined) {
    list = list.filter(item => item.isTop === params.isTop)
  }
  return list
}

function getAnnouncementById(id) {
  return mockData.announcements.find(item => item.id === id)
}

function getIssues(params = {}) {
  let list = [...mockData.issues]
  if (params.status) {
    list = list.filter(item => item.status === params.status)
  }
  if (params.category) {
    list = list.filter(item => item.category === params.category)
  }
  return list
}

function getIssueById(id) {
  return mockData.issues.find(item => item.id === id)
}

function getWorkOrders(params = {}) {
  let list = [...mockData.workOrders]
  if (params.status) {
    list = list.filter(item => item.status === params.status)
  }
  if (params.type) {
    list = list.filter(item => item.type === params.type)
  }
  if (params.source) {
    list = list.filter(item => item.source === params.source)
  }
  if (params.isOverdue !== undefined) {
    list = list.filter(item => item.isOverdue === params.isOverdue)
  }
  return list
}

function getWorkOrderById(id) {
  return mockData.workOrders.find(item => item.id === id)
}

function getVotes(params = {}) {
  let list = [...mockData.votes]
  if (params.status) {
    list = list.filter(item => item.status === params.status)
  }
  return list
}

function getVoteById(id) {
  return mockData.votes.find(item => item.id === id)
}

function getCommitteeStats() {
  return mockData.committeeTasks
}

function getPropertyStats() {
  return mockData.propertyStats
}

function getOwnerStats() {
  return mockData.ownerStats
}

function getAccessCode() {
  return mockData.accessCode
}

function getPaymentBills(type) {
  if (type) {
    return mockData.paymentBills[type] || []
  }
  return mockData.paymentBills
}

function getPublicFunds() {
  return mockData.publicFunds
}

function getInspection() {
  return mockData.inspection
}

function getOwnerMeeting() {
  return mockData.ownerMeeting
}

module.exports = {
  mockData,
  getAnnouncements,
  getAnnouncementById,
  getIssues,
  getIssueById,
  getWorkOrders,
  getWorkOrderById,
  getVotes,
  getVoteById,
  getCommitteeStats,
  getPropertyStats,
  getOwnerStats,
  getAccessCode,
  getPaymentBills,
  getPublicFunds,
  getInspection,
  getOwnerMeeting
}
