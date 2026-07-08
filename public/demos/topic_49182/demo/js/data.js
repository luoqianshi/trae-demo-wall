const COMPANIES = [
  {
    id: 'cmp-001',
    name: '深圳精密智造科技有限公司',
    industry: '电子制造',
    subIndustry: '精密零部件',
    country: '中国',
    city: '深圳',
    employeeRange: '50-100人',
    capabilities: ['精密CNC加工', '小批量定制', '快速打样', '铝合金加工', '表面处理'],
    certifications: ['ISO 9001', 'ISO 14001', 'RoHS', 'SGS'],
    description: '专注于精密金属零部件制造，为消费电子、医疗器械、航空航天等领域提供高品质加工服务。拥有先进的CNC加工中心和专业的质检团队，确保产品精度达到微米级。',
    trustScore: {
      overall: 92,
      quality: 94,
      delivery: 91,
      communication: 89,
      cooperation: 93,
      certification: 95
    },
    status: 'active',
    cooperationCount: 156,
    source: 'verified',
    onboarded: true,
    createdAt: '2024-03-15'
  },
  {
    id: 'cmp-002',
    name: '东莞华腾电子有限公司',
    industry: '电子制造',
    subIndustry: 'PCB电路板',
    country: '中国',
    city: '东莞',
    employeeRange: '100-200人',
    capabilities: ['PCB设计', 'SMT贴片', '电路板组装', 'DIP插件', '测试服务'],
    certifications: ['ISO 9001', 'ISO 14001', 'UL', 'IPC'],
    description: '专业PCB制造商，提供从设计到生产的一站式服务。产品广泛应用于智能家居、汽车电子、工业控制等领域，月产能达到50万片。',
    trustScore: {
      overall: 88,
      quality: 89,
      delivery: 87,
      communication: 86,
      cooperation: 90,
      certification: 92
    },
    status: 'active',
    cooperationCount: 89,
    source: 'verified',
    onboarded: true,
    createdAt: '2024-05-20'
  },
  {
    id: 'cmp-003',
    name: '上海微电子科技有限公司',
    industry: '电子制造',
    subIndustry: '半导体封装',
    country: '中国',
    city: '上海',
    employeeRange: '200-500人',
    capabilities: ['芯片封装', '测试代工', '晶圆切割', 'IC设计', '贴片服务'],
    certifications: ['ISO 9001', 'ISO 14001', 'IATF 16949', 'ESD'],
    description: '专注于半导体封装测试领域，具备先进的封装技术和完善的质量管理体系。服务客户涵盖消费电子、通信设备、工业控制等多个领域。',
    trustScore: {
      overall: 95,
      quality: 96,
      delivery: 94,
      communication: 93,
      cooperation: 95,
      certification: 98
    },
    status: 'active',
    cooperationCount: 234,
    source: 'verified',
    onboarded: true,
    createdAt: '2023-11-08'
  },
  {
    id: 'cmp-004',
    name: '广州汇鑫电子科技',
    industry: '电子制造',
    subIndustry: '连接器',
    country: '中国',
    city: '广州',
    employeeRange: '50-100人',
    capabilities: ['连接器设计', '精密注塑', '冲压加工', '电镀工艺', '定制开发'],
    certifications: ['ISO 9001', 'RoHS', 'REACH'],
    description: '专业连接器制造商，产品包括板对板连接器、线对板连接器、FPC连接器等，广泛应用于手机、平板、汽车电子等领域。',
    trustScore: {
      overall: 85,
      quality: 86,
      delivery: 84,
      communication: 83,
      cooperation: 87,
      certification: 88
    },
    status: 'active',
    cooperationCount: 67,
    source: 'verified',
    onboarded: true,
    createdAt: '2024-07-12'
  },
  {
    id: 'cmp-005',
    name: '苏州恒通光电科技',
    industry: '电子制造',
    subIndustry: '光电显示',
    country: '中国',
    city: '苏州',
    employeeRange: '100-200人',
    capabilities: ['LED背光', 'LCD模组', '触控面板', '显示驱动', '光学贴合'],
    certifications: ['ISO 9001', 'ISO 14001', 'ISO 45001', 'RoHS'],
    description: '专注于中小尺寸显示模组研发制造，产品应用于智能家居、车载显示、工业控制等领域。拥有完整的贴合生产线和光学检测设备。',
    trustScore: {
      overall: 90,
      quality: 91,
      delivery: 89,
      communication: 88,
      cooperation: 92,
      certification: 93
    },
    status: 'active',
    cooperationCount: 145,
    source: 'verified',
    onboarded: true,
    createdAt: '2024-01-28'
  },
  {
    id: 'cmp-006',
    name: '杭州风尚服饰有限公司',
    industry: '服装',
    subIndustry: '运动服装',
    country: '中国',
    city: '杭州',
    employeeRange: '200-500人',
    capabilities: ['运动服定制', '小批量生产', '印花工艺', '刺绣加工', '面料研发'],
    certifications: ['ISO 9001', 'OEKO-TEX', 'BSCI', 'SEDEX'],
    description: '专业运动服饰制造商，为国内外品牌提供设计、打样、生产一站式服务。拥有先进的数码印花设备和经验丰富的设计团队。',
    trustScore: {
      overall: 89,
      quality: 90,
      delivery: 88,
      communication: 87,
      cooperation: 91,
      certification: 92
    },
    status: 'active',
    cooperationCount: 189,
    source: 'verified',
    onboarded: true,
    createdAt: '2023-09-15'
  },
  {
    id: 'cmp-007',
    name: '宁波雅戈尔纺织科技',
    industry: '服装',
    subIndustry: '商务男装',
    country: '中国',
    city: '宁波',
    employeeRange: '500-1000人',
    capabilities: ['西装定制', '衬衫生产', '面料织造', '成衣加工', '品牌代工'],
    certifications: ['ISO 9001', 'ISO 14001', 'OEKO-TEX', 'WRAP'],
    description: '大型纺织服装企业，拥有从面料织造到成衣加工的完整产业链。产品远销欧美、日韩等多个国家和地区。',
    trustScore: {
      overall: 94,
      quality: 95,
      delivery: 93,
      communication: 92,
      cooperation: 94,
      certification: 96
    },
    status: 'active',
    cooperationCount: 456,
    source: 'verified',
    onboarded: true,
    createdAt: '2022-06-20'
  },
  {
    id: 'cmp-008',
    name: '深圳潮流服饰有限公司',
    industry: '服装',
    subIndustry: '休闲服饰',
    country: '中国',
    city: '深圳',
    employeeRange: '100-200人',
    capabilities: ['潮牌服饰', '小批量定制', '快反生产', '电商供货', '设计开发'],
    certifications: ['ISO 9001', 'BSCI', 'OEKO-TEX'],
    description: '专注于潮流服饰设计与生产，为新兴品牌和电商卖家提供快速响应的供应链服务。支持7天快速打样，15天小批量交付。',
    trustScore: {
      overall: 86,
      quality: 87,
      delivery: 85,
      communication: 88,
      cooperation: 86,
      certification: 89
    },
    status: 'active',
    cooperationCount: 78,
    source: 'verified',
    onboarded: true,
    createdAt: '2024-04-05'
  },
  {
    id: 'cmp-009',
    name: '温州鞋业集团有限公司',
    industry: '服装',
    subIndustry: '鞋类',
    country: '中国',
    city: '温州',
    employeeRange: '500-1000人',
    capabilities: ['运动鞋生产', '皮鞋制造', '鞋材研发', '模具开发', '品牌代工'],
    certifications: ['ISO 9001', 'ISO 14001', 'BSCI', 'SEDEX'],
    description: '中国鞋都龙头企业，专业生产各类运动鞋、皮鞋、休闲鞋。拥有先进的制鞋生产线和完善的质量检测体系。',
    trustScore: {
      overall: 91,
      quality: 92,
      delivery: 90,
      communication: 89,
      cooperation: 91,
      certification: 93
    },
    status: 'active',
    cooperationCount: 321,
    source: 'verified',
    onboarded: true,
    createdAt: '2023-03-10'
  },
  {
    id: 'cmp-010',
    name: '广州针织服装有限公司',
    industry: '服装',
    subIndustry: '针织品',
    country: '中国',
    city: '广州',
    employeeRange: '100-200人',
    capabilities: ['针织面料', '毛衣定制', '无缝内衣', '印花加工', 'OEM代工'],
    certifications: ['ISO 9001', 'OEKO-TEX', 'BSCI'],
    description: '专业针织服装制造商，拥有进口针织机和完善的后整理设备。产品涵盖毛衣、内衣、T恤等针织品类。',
    trustScore: {
      overall: 87,
      quality: 88,
      delivery: 86,
      communication: 85,
      cooperation: 88,
      certification: 90
    },
    status: 'active',
    cooperationCount: 112,
    source: 'verified',
    onboarded: true,
    createdAt: '2024-02-18'
  },
  {
    id: 'cmp-011',
    name: '山东重工机械有限公司',
    industry: '机械',
    subIndustry: '工程机械',
    country: '中国',
    city: '济南',
    employeeRange: '500-1000人',
    capabilities: ['挖掘机制造', '装载机生产', '液压系统', '零部件加工', '整机装配'],
    certifications: ['ISO 9001', 'ISO 14001', 'ISO 45001', 'CE'],
    description: '大型工程机械制造商，产品远销东南亚、中东、非洲等地区。拥有国家级技术中心和完善的售后服务网络。',
    trustScore: {
      overall: 93,
      quality: 94,
      delivery: 92,
      communication: 91,
      cooperation: 93,
      certification: 95
    },
    status: 'active',
    cooperationCount: 267,
    source: 'verified',
    onboarded: true,
    createdAt: '2022-12-01'
  },
  {
    id: 'cmp-012',
    name: '江苏精密机床有限公司',
    industry: '机械',
    subIndustry: '机床设备',
    country: '中国',
    city: '苏州',
    employeeRange: '200-500人',
    capabilities: ['CNC机床', '加工中心', '车床制造', '铣床生产', '自动化设备'],
    certifications: ['ISO 9001', 'ISO 14001', 'CE', 'SGS'],
    description: '专业数控机床制造商，产品广泛应用于航空航天、汽车制造、模具加工等领域。拥有自主研发的数控系统。',
    trustScore: {
      overall: 92,
      quality: 93,
      delivery: 91,
      communication: 90,
      cooperation: 92,
      certification: 94
    },
    status: 'active',
    cooperationCount: 178,
    source: 'verified',
    onboarded: true,
    createdAt: '2023-05-25'
  },
  {
    id: 'cmp-013',
    name: '浙江模具科技有限公司',
    industry: '机械',
    subIndustry: '模具制造',
    country: '中国',
    city: '宁波',
    employeeRange: '100-200人',
    capabilities: ['注塑模具', '压铸模具', '冲压模具', '模具设计', '3D打印'],
    certifications: ['ISO 9001', 'ISO 14001', 'CE'],
    description: '专业模具制造商，为家电、汽车、电子等行业提供高精度模具解决方案。拥有先进的五轴加工中心和三坐标测量仪。',
    trustScore: {
      overall: 89,
      quality: 90,
      delivery: 88,
      communication: 87,
      cooperation: 90,
      certification: 91
    },
    status: 'active',
    cooperationCount: 145,
    source: 'verified',
    onboarded: true,
    createdAt: '2023-08-15'
  },
  {
    id: 'cmp-014',
    name: '河南起重机械集团',
    industry: '机械',
    subIndustry: '起重设备',
    country: '中国',
    city: '新乡',
    employeeRange: '500-1000人',
    capabilities: ['桥式起重机', '门式起重机', '电动葫芦', '钢丝绳', '配件供应'],
    certifications: ['ISO 9001', 'ISO 14001', 'ISO 45001', 'CCC'],
    description: '中国起重机械领军企业，产品广泛应用于工厂、港口、矿山等领域。拥有完善的设计、制造、安装服务体系。',
    trustScore: {
      overall: 91,
      quality: 92,
      delivery: 90,
      communication: 89,
      cooperation: 91,
      certification: 93
    },
    status: 'active',
    cooperationCount: 345,
    source: 'verified',
    onboarded: true,
    createdAt: '2022-09-20'
  },
  {
    id: 'cmp-015',
    name: '北京智云科技有限公司',
    industry: '软件服务',
    subIndustry: '云计算',
    country: '中国',
    city: '北京',
    employeeRange: '200-500人',
    capabilities: ['云服务', '服务器托管', '数据中心', '网络安全', 'IT运维'],
    certifications: ['ISO 27001', 'ISO 9001', '等保三级', 'SOC 2'],
    description: '专业云计算服务商，为企业提供稳定可靠的云基础设施服务。拥有多个自建数据中心，覆盖全国主要城市。',
    trustScore: {
      overall: 94,
      quality: 95,
      delivery: 94,
      communication: 93,
      cooperation: 94,
      certification: 97
    },
    status: 'active',
    cooperationCount: 423,
    source: 'verified',
    onboarded: true,
    createdAt: '2021-07-10'
  },
  {
    id: 'cmp-016',
    name: '上海数智科技有限公司',
    industry: '软件服务',
    subIndustry: '大数据',
    country: '中国',
    city: '上海',
    employeeRange: '100-200人',
    capabilities: ['数据分析', '数据清洗', 'BI报表', 'AI算法', '数据可视化'],
    certifications: ['ISO 27001', 'ISO 9001', 'CMMI 5'],
    description: '专注于大数据和人工智能领域，为企业提供数据驱动的决策支持解决方案。服务客户涵盖金融、零售、制造等多个行业。',
    trustScore: {
      overall: 92,
      quality: 93,
      delivery: 91,
      communication: 92,
      cooperation: 93,
      certification: 94
    },
    status: 'active',
    cooperationCount: 156,
    source: 'verified',
    onboarded: true,
    createdAt: '2023-01-15'
  },
  {
    id: 'cmp-017',
    name: '深圳创智软件开发',
    industry: '软件服务',
    subIndustry: '移动开发',
    country: '中国',
    city: '深圳',
    employeeRange: '50-100人',
    capabilities: ['App开发', '小程序开发', 'H5开发', 'UI设计', '技术咨询'],
    certifications: ['ISO 9001', 'ISO 27001'],
    description: '专业移动应用开发团队，为企业提供从需求分析到上线运营的一站式服务。拥有丰富的跨平台开发经验。',
    trustScore: {
      overall: 88,
      quality: 89,
      delivery: 87,
      communication: 90,
      cooperation: 88,
      certification: 90
    },
    status: 'active',
    cooperationCount: 89,
    source: 'verified',
    onboarded: true,
    createdAt: '2024-01-20'
  },
  {
    id: 'cmp-018',
    name: '杭州云创科技有限公司',
    industry: '软件服务',
    subIndustry: '电商系统',
    country: '中国',
    city: '杭州',
    employeeRange: '100-200人',
    capabilities: ['电商平台', 'ERP系统', 'CRM系统', 'WMS系统', '定制开发'],
    certifications: ['ISO 9001', 'ISO 27001', 'CMMI 3'],
    description: '专注于电商领域的软件服务商，为企业提供完整的电商解决方案。产品包括电商平台、供应链管理、客户管理等系统。',
    trustScore: {
      overall: 90,
      quality: 91,
      delivery: 89,
      communication: 88,
      cooperation: 91,
      certification: 92
    },
    status: 'active',
    cooperationCount: 234,
    source: 'verified',
    onboarded: true,
    createdAt: '2023-04-28'
  },
  {
    id: 'cmp-019',
    name: '北京红点设计公司',
    industry: '设计',
    subIndustry: '工业设计',
    country: '中国',
    city: '北京',
    employeeRange: '50-100人',
    capabilities: ['产品设计', '工业设计', 'UI设计', '品牌设计', '原型开发'],
    certifications: ['ISO 9001'],
    description: '知名设计公司，专注于产品创新设计。服务客户包括众多世界500强企业，作品多次获得国际设计大奖。',
    trustScore: {
      overall: 95,
      quality: 96,
      delivery: 94,
      communication: 95,
      cooperation: 95,
      certification: 92
    },
    status: 'active',
    cooperationCount: 178,
    source: 'verified',
    onboarded: true,
    createdAt: '2022-03-10'
  },
  {
    id: 'cmp-020',
    name: '上海视觉设计有限公司',
    industry: '设计',
    subIndustry: '平面设计',
    country: '中国',
    city: '上海',
    employeeRange: '50-100人',
    capabilities: ['品牌设计', '包装设计', '海报设计', '画册设计', 'VI系统'],
    certifications: ['ISO 9001'],
    description: '专业视觉设计公司，为企业提供全方位的品牌视觉解决方案。团队由资深设计师组成，注重创意与商业的结合。',
    trustScore: {
      overall: 91,
      quality: 92,
      delivery: 90,
      communication: 91,
      cooperation: 92,
      certification: 89
    },
    status: 'active',
    cooperationCount: 223,
    source: 'verified',
    onboarded: true,
    createdAt: '2023-06-15'
  },
  {
    id: 'cmp-021',
    name: '深圳空间设计事务所',
    industry: '设计',
    subIndustry: '空间设计',
    country: '中国',
    city: '深圳',
    employeeRange: '50-100人',
    capabilities: ['办公空间', '商业空间', '展厅设计', '软装设计', '施工图'],
    certifications: ['ISO 9001'],
    description: '专业空间设计事务所，致力于创造人性化的空间体验。完成项目涵盖办公空间、商业综合体、品牌展厅等类型。',
    trustScore: {
      overall: 89,
      quality: 90,
      delivery: 88,
      communication: 89,
      cooperation: 90,
      certification: 88
    },
    status: 'active',
    cooperationCount: 89,
    source: 'verified',
    onboarded: true,
    createdAt: '2023-10-08'
  },
  {
    id: 'cmp-022',
    name: '江苏新能源科技有限公司',
    industry: '新能源',
    subIndustry: '光伏',
    country: '中国',
    city: '无锡',
    employeeRange: '500-1000人',
    capabilities: ['光伏组件', '太阳能电池', '逆变器', '储能系统', 'EPC工程'],
    certifications: ['ISO 9001', 'ISO 14001', 'ISO 45001', 'TUV'],
    description: '大型新能源企业，专注于光伏产业链。产品远销全球多个国家，拥有完整的研发、生产、销售体系。',
    trustScore: {
      overall: 94,
      quality: 95,
      delivery: 93,
      communication: 92,
      cooperation: 94,
      certification: 96
    },
    status: 'active',
    cooperationCount: 356,
    source: 'verified',
    onboarded: true,
    createdAt: '2022-05-15'
  },
  {
    id: 'cmp-023',
    name: '广东锂电科技有限公司',
    industry: '新能源',
    subIndustry: '锂电池',
    country: '中国',
    city: '东莞',
    employeeRange: '200-500人',
    capabilities: ['锂电池制造', '动力电池', '储能电池', '电池管理', 'PACK组装'],
    certifications: ['ISO 9001', 'ISO 14001', 'IATF 16949', 'CE'],
    description: '专业锂电池制造商，产品应用于新能源汽车、储能系统、消费电子等领域。拥有先进的自动化生产线。',
    trustScore: {
      overall: 93,
      quality: 94,
      delivery: 92,
      communication: 91,
      cooperation: 93,
      certification: 95
    },
    status: 'active',
    cooperationCount: 267,
    source: 'verified',
    onboarded: true,
    createdAt: '2023-02-20'
  }
];

const REVIEWS = [
  { id: 'rev-001', companyId: 'cmp-001', rating: 5, content: '合作非常愉快，产品精度很高，交货及时，下次还会合作！', reviewer: '张经理', company: '深圳某科技公司', createdAt: '2024-12-15', verified: true },
  { id: 'rev-002', companyId: 'cmp-001', rating: 4, content: '质量不错，沟通顺畅，就是价格稍微有点高。', reviewer: '李总', company: '东莞电子厂', createdAt: '2024-12-10', verified: true },
  { id: 'rev-003', companyId: 'cmp-001', rating: 5, content: '专业的团队，精密的加工，值得信赖的合作伙伴！', reviewer: '王工程师', company: '上海半导体公司', createdAt: '2024-11-28', verified: true },
  { id: 'rev-004', companyId: 'cmp-002', rating: 4, content: 'PCB质量稳定，交期准，服务态度好。', reviewer: '陈老板', company: '广州电子科技', createdAt: '2024-12-08', verified: true },
  { id: 'rev-005', companyId: 'cmp-002', rating: 3, content: '整体还可以，就是有一批货有点小问题，后来解决了。', reviewer: '刘经理', company: '深圳智能硬件', createdAt: '2024-11-20', verified: true },
  { id: 'rev-006', companyId: 'cmp-003', rating: 5, content: '半导体封装技术一流，质量把控严格，合作多年的老供应商。', reviewer: '赵总监', company: '北京芯片设计公司', createdAt: '2024-12-12', verified: true },
  { id: 'rev-007', companyId: 'cmp-003', rating: 5, content: '服务周到，技术专业，响应快速，非常满意！', reviewer: '孙总', company: '杭州物联网公司', createdAt: '2024-11-30', verified: true },
  { id: 'rev-008', companyId: 'cmp-006', rating: 5, content: '运动服品质很好，设计时尚，交货及时，合作愉快！', reviewer: '周老板', company: '广州体育用品公司', createdAt: '2024-12-14', verified: true },
  { id: 'rev-009', companyId: 'cmp-006', rating: 4, content: '面料质量不错，印花工艺精美，就是起订量稍微高了点。', reviewer: '吴经理', company: '厦门运动品牌', createdAt: '2024-12-05', verified: true },
  { id: 'rev-010', companyId: 'cmp-007', rating: 5, content: '雅戈尔品质值得信赖，西装做工精细，面料舒适。', reviewer: '郑总', company: '上海贸易公司', createdAt: '2024-12-11', verified: true },
  { id: 'rev-011', companyId: 'cmp-007', rating: 5, content: '商务男装首选，多年合作，质量稳定，服务专业。', reviewer: '黄经理', company: '北京服装品牌', createdAt: '2024-11-25', verified: true },
  { id: 'rev-012', companyId: 'cmp-011', rating: 5, content: '工程机械行业领先品牌，产品质量可靠，售后服务完善。', reviewer: '冯总', company: '山东矿业集团', createdAt: '2024-12-09', verified: true },
  { id: 'rev-013', companyId: 'cmp-011', rating: 4, content: '设备性能不错，价格合理，就是交货周期有点长。', reviewer: '许老板', company: '河南建筑公司', createdAt: '2024-11-18', verified: true },
  { id: 'rev-014', companyId: 'cmp-015', rating: 5, content: '云服务稳定可靠，技术支持响应快，性价比高。', reviewer: '杨总监', company: '深圳互联网公司', createdAt: '2024-12-13', verified: true },
  { id: 'rev-015', companyId: 'cmp-015', rating: 5, content: '数据中心设施完善，安全合规，值得推荐！', reviewer: '何经理', company: '上海金融科技', createdAt: '2024-12-01', verified: true },
  { id: 'rev-016', companyId: 'cmp-019', rating: 5, content: '红点设计名不虚传，产品设计新颖，创意十足！', reviewer: '梁总', company: '深圳消费电子公司', createdAt: '2024-12-07', verified: true },
  { id: 'rev-017', companyId: 'cmp-019', rating: 5, content: '团队专业，沟通顺畅，交付准时，非常满意的设计服务！', reviewer: '谢经理', company: '北京智能家居公司', createdAt: '2024-11-22', verified: true },
  { id: 'rev-018', companyId: 'cmp-022', rating: 5, content: '光伏组件质量可靠，效率高，售后服务好。', reviewer: '韩总', company: '江苏新能源公司', createdAt: '2024-12-06', verified: true },
  { id: 'rev-019', companyId: 'cmp-022', rating: 4, content: '产品质量不错，价格合理，就是安装服务有待提高。', reviewer: '唐老板', company: '浙江光伏安装公司', createdAt: '2024-11-15', verified: true },
  { id: 'rev-020', companyId: 'cmp-023', rating: 5, content: '锂电池性能稳定，容量足，循环寿命长，非常满意！', reviewer: '曹经理', company: '广东新能源汽车公司', createdAt: '2024-12-10', verified: true }
];

const COOPERATION_INTENTS = [
  {
    id: 'intent-001',
    fromCompanyId: 'cmp-006',
    toCompanyId: 'cmp-001',
    cooperationType: '产品采购',
    description: '需要采购一批精密铝合金零部件，用于运动服装设备配件',
    quantity: '500件',
    budgetRange: '1-5万',
    expectedPeriod: '30天内',
    contactMethods: {
      wechat: 'fashion_2024',
      email: 'contact@fashion.com'
    },
    aiSuggestion: '双方在制造业领域有良好的合作基础，建议重点沟通质量标准和交货周期。目标企业的精密加工能力与需求高度匹配。',
    status: 'pending',
    createdAt: '2024-12-15T10:30:00'
  },
  {
    id: 'intent-002',
    fromCompanyId: 'cmp-015',
    toCompanyId: 'cmp-016',
    cooperationType: '技术合作',
    description: '希望合作开发数据分析平台，整合云服务与大数据能力',
    quantity: '1个项目',
    budgetRange: '10万以上',
    expectedPeriod: '90天',
    contactMethods: {
      email: 'tech@cloud.com',
      phone: '13800138000'
    },
    aiSuggestion: '两家企业在技术领域互补性强，云服务+大数据的组合具有很高的协同效应。建议详细讨论技术架构和知识产权分配。',
    status: 'viewed',
    createdAt: '2024-12-14T14:20:00'
  },
  {
    id: 'intent-003',
    fromCompanyId: 'cmp-003',
    toCompanyId: 'cmp-002',
    cooperationType: '服务外包',
    description: '需要外包PCB电路板生产，用于半导体封装测试设备',
    quantity: '2000片',
    budgetRange: '5-10万',
    expectedPeriod: '45天',
    contactMethods: {
      wechat: 'semicon_dev',
      whatsapp: '+8613900139000'
    },
    aiSuggestion: 'PCB生产是半导体封装的关键环节，目标企业具备SMT贴片能力，可以提供一站式服务。建议重点关注质量控制和交货准时率。',
    status: 'accepted',
    createdAt: '2024-12-12T09:15:00'
  },
  {
    id: 'intent-004',
    fromCompanyId: 'cmp-011',
    toCompanyId: 'cmp-013',
    cooperationType: '产品采购',
    description: '需要定制工程机械模具，用于挖掘机零部件生产',
    quantity: '10套',
    budgetRange: '10万以上',
    expectedPeriod: '60天',
    contactMethods: {
      email: 'procurement@heavy.com',
      phone: '13700137000'
    },
    aiSuggestion: '目标企业在模具制造领域经验丰富，具备注塑和压铸模具能力。建议沟通模具材质、使用寿命和售后服务条款。',
    status: 'pending',
    createdAt: '2024-12-11T16:45:00'
  },
  {
    id: 'intent-005',
    fromCompanyId: 'cmp-019',
    toCompanyId: 'cmp-005',
    cooperationType: '技术合作',
    description: '希望合作开发智能显示终端产品设计方案',
    quantity: '1个项目',
    budgetRange: '5-10万',
    expectedPeriod: '30天',
    contactMethods: {
      wechat: 'reddot_design',
      email: 'project@reddot.com'
    },
    aiSuggestion: '设计公司与显示技术企业的合作具有很高的附加值。建议重点讨论设计版权和产品落地可行性。',
    status: 'viewed',
    createdAt: '2024-12-10T11:00:00'
  },
  {
    id: 'intent-006',
    fromCompanyId: 'cmp-022',
    toCompanyId: 'cmp-023',
    cooperationType: '产品采购',
    description: '需要采购锂电池组，用于光伏储能系统',
    quantity: '500组',
    budgetRange: '10万以上',
    expectedPeriod: '45天',
    contactMethods: {
      email: 'purchase@newenergy.com',
      phone: '13600136000'
    },
    aiSuggestion: '两家企业都在新能源领域，产业链上下游关系明显。建议重点沟通电池容量、循环寿命和质保条款。',
    status: 'completed',
    createdAt: '2024-12-08T08:30:00'
  }
];

const INDUSTRIES = [
  { id: 'elec', name: '电子制造', icon: 'cpu', count: 5 },
  { id: 'fashion', name: '服装', icon: 'shirt', count: 5 },
  { id: 'machinery', name: '机械', icon: 'cog', count: 4 },
  { id: 'software', name: '软件服务', icon: 'code', count: 4 },
  { id: 'design', name: '设计', icon: 'palette', count: 3 },
  { id: 'newenergy', name: '新能源', icon: 'zap', count: 2 },
  { id: 'automotive', name: '汽车制造', icon: 'car', count: 0 },
  { id: 'medical', name: '医疗器械', icon: 'heart-pulse', count: 0 }
];

const HOT_TAGS = [
  '精密CNC加工',
  '小批量服装定制',
  'PCB电路板',
  '模具制造',
  '云服务',
  '产品设计',
  '光伏组件',
  '锂电池'
];

function getCompanyById(id) {
  return COMPANIES.find(c => c.id === id);
}

function getReviewsByCompanyId(companyId) {
  return REVIEWS.filter(r => r.companyId === companyId);
}

function getReceivedIntents(companyId) {
  return COOPERATION_INTENTS.filter(i => i.toCompanyId === companyId);
}

function getSentIntents(companyId) {
  return COOPERATION_INTENTS.filter(i => i.fromCompanyId === companyId);
}

function getAllCompanies() {
  return COMPANIES;
}

function getAllIndustries() {
  return INDUSTRIES;
}

function getHotTags() {
  return HOT_TAGS;
}

const Data = {
  COMPANIES,
  REVIEWS,
  COOPERATION_INTENTS,
  INDUSTRIES,
  HOT_TAGS,
  getCompanyById,
  getReviewsByCompanyId,
  getReceivedIntents,
  getSentIntents,
  getAllCompanies,
  getAllIndustries,
  getHotTags
};

if (typeof module !== 'undefined') {
  module.exports = Data;
}
