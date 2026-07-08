export interface NomadCommunity {
  id: string;
  name: string;
  city: string;
  province: string;
  region: 'yangtze' | 'hainan' | 'southwest' | 'shandong' | 'other';
  regionLabel: string;
  description: string;
  features: string[];
  rentStart: number;
  rentEnd: number;
  coWorking: boolean;
  activities: number;
  residents: number;
  rating: number;
  image: string;
  highlights: string[];
  policyTags: string[];
}

export interface CityPolicy {
  id: string;
  city: string;
  province: string;
  policies: {
    title: string;
    description: string;
    category: 'housing' | 'business' | 'tax' | 'talent' | 'visa';
    amount?: string;
  }[];
  overview: string;
  highlights: string[];
}

export const nomadCommunities: NomadCommunity[] = [
  {
    id: 'dna-anjie',
    name: 'DNA数字游民公社',
    city: '安吉',
    province: '浙江',
    region: 'yangtze',
    regionLabel: '长三角',
    description: '全国最早的数字游民社区之一，坐落于浙江安吉的竹林山间，提供共居、共享办公、社群活动一体化服务。',
    features: ['竹林环境', '共享办公', '社群活动', '咖啡吧', '健身房', '周边徒步'],
    rentStart: 1500,
    rentEnd: 3500,
    coWorking: true,
    activities: 200,
    residents: 5000,
    rating: 4.8,
    image: '🌲',
    highlights: ['累计5000人次入住', '竹林山景', '每周社群活动'],
    policyTags: ['长租优惠', '活动丰富'],
  },
  {
    id: 'caojing-shanghai',
    name: '漕泾数字游民国际村',
    city: '上海',
    province: '上海',
    region: 'yangtze',
    regionLabel: '长三角',
    description: '全国首个数字游民团支部所在地，金山区漕泾镇，万兆网络+免费共享办公空间+创业孵化支持。',
    features: ['免费办公', '万兆网络', '创业孵化', '导师指导', '产业基金', '团支部'],
    rentStart: 2000,
    rentEnd: 4000,
    coWorking: true,
    activities: 150,
    residents: 380,
    rating: 4.7,
    image: '🏙️',
    highlights: ['全国首个数字游民团支部', '500万产业基金', '1万元创业补贴'],
    policyTags: ['创业补贴', '免费办公', '产业基金'],
  },
  {
    id: '52hz-lishui',
    name: '52赫兹数字游民社区',
    city: '丽水',
    province: '浙江',
    region: 'yangtze',
    regionLabel: '长三角',
    description: '丽水莲都52赫兹数字游民社区，超3000㎡共居空间，硕博占比超40%，入住率达90%。',
    features: ['共居空间', '共享办公', '高知社群', '山水环境', '创业支持', '技能培训'],
    rentStart: 1800,
    rentEnd: 3200,
    coWorking: true,
    activities: 287,
    residents: 300,
    rating: 4.9,
    image: '🏔️',
    highlights: ['硕博占比40%+', '丽水六条政策', '最高2万奖励'],
    policyTags: ['最高2万奖励', '租房补贴', '技能培训'],
  },
  {
    id: 'dopamine-haikou',
    name: 'Dopamine数字游民社区',
    city: '海口',
    province: '海南',
    region: 'hainan',
    regionLabel: '海南',
    description: '海南首批数字游民国际社区场景，享受全岛封关政策红利，数据跨境流动便利化+税收优惠。',
    features: ['海边环境', '共享办公', '税收优惠', '跨境便利', '创业支持', '热带气候'],
    rentStart: 2500,
    rentEnd: 5000,
    coWorking: true,
    activities: 120,
    residents: 250,
    rating: 4.6,
    image: '🌴',
    highlights: ['全岛封关运作', '税收优惠', '90日外籍工作许可'],
    policyTags: ['税收优惠', '跨境便利', '创业补贴'],
  },
  {
    id: 'haifeng-lingshui',
    name: '海风小镇数字游民社区',
    city: '陵水',
    province: '海南',
    region: 'hainan',
    regionLabel: '海南',
    description: '海南陵水海风小镇，海景数字游民社区，享受海南自贸港政策，适合远程办公+海岛生活。',
    features: ['海景房', '共享办公', '海岛生活', '冲浪潜水', '免税购物', '自贸港政策'],
    rentStart: 3000,
    rentEnd: 6000,
    coWorking: true,
    activities: 80,
    residents: 180,
    rating: 4.7,
    image: '🏖️',
    highlights: ['一线海景', '自贸港政策', '海岛生活方式'],
    policyTags: ['自贸港政策', '免税购物'],
  },
  {
    id: 'dali-yunnan',
    name: '大理数字游民聚落',
    city: '大理',
    province: '云南',
    region: 'southwest',
    regionLabel: '西南',
    description: '国内数字游民传统热门目的地，苍山洱海间的自由生活，大量咖啡馆和共享空间，生活成本低。',
    features: ['苍山洱海', '低生活成本', '咖啡馆办公', '多元社群', '文艺氛围', '周边景点'],
    rentStart: 1000,
    rentEnd: 2500,
    coWorking: true,
    activities: 300,
    residents: 2000,
    rating: 4.8,
    image: '⛰️',
    highlights: ['生活成本最低', '自然环境绝佳', '游民氛围浓厚'],
    policyTags: ['低成本', '社群成熟'],
  },
  {
    id: 'dnb-ziyang',
    name: 'DNβ国际数字游民社区',
    city: '资阳',
    province: '四川',
    region: 'southwest',
    regionLabel: '西南',
    description: '四川资阳DNβ国际数字游民社区，租金补贴政策优厚——累计30天补助10%、半年以上补助20%。',
    features: ['租金补贴', '共享办公', '创业支持', '生活便利', '人才公寓', '企业孵化'],
    rentStart: 800,
    rentEnd: 2000,
    coWorking: true,
    activities: 100,
    residents: 150,
    rating: 4.5,
    image: '🏯',
    highlights: ['租金补贴10-20%', '硕博补贴5千-1万', '企业最高30万奖励'],
    policyTags: ['租金补贴', '人才补贴', '企业奖励'],
  },
  {
    id: 'taian-shandong',
    name: '泰安数字游民创业集聚地',
    city: '泰安',
    province: '山东',
    region: 'shandong',
    regionLabel: '山东',
    description: '山东省首批数字游民创业集聚地建设试点城市，山东18部门发文鼓励灵活就业，泰山脚下创业福地。',
    features: ['泰山脚下', '创业支持', '灵活就业', '人才政策', '生活便利', '文化底蕴'],
    rentStart: 1200,
    rentEnd: 2500,
    coWorking: true,
    activities: 60,
    residents: 100,
    rating: 4.4,
    image: '⛰️',
    highlights: ['省级试点', '18部门支持', '泰山文化'],
    policyTags: ['省级试点', '创业扶持'],
  },
  {
    id: 'qincheng-yuhang',
    name: '亲橙空间数字游民社区',
    city: '杭州',
    province: '浙江',
    region: 'yangtze',
    regionLabel: '长三角',
    description: '杭州余杭五常街道亲橙空间，860平方米共享空间，月租金低至500元，靠近阿里系创业氛围浓厚。',
    features: ['低价办公', '阿里周边', '创业氛围', '个税返还', '租房补贴', '技能培训'],
    rentStart: 500,
    rentEnd: 2000,
    coWorking: true,
    activities: 120,
    residents: 200,
    rating: 4.6,
    image: '🍊',
    highlights: ['月租低至500元', '个税返还', '数栖八条政策'],
    policyTags: ['个税返还', '租房补贴', '办公补贴'],
  },
];

export const cityPolicies: CityPolicy[] = [
  {
    id: 'hangzhou',
    city: '杭州',
    province: '浙江',
    overview: '余杭良渚新城「数栖八条」专项政策，全省率先试点人工智能训练师「一试双证」，高技能人才最高可获3.6万元奖励。',
    highlights: ['数栖八条政策', '个税返还', '最高3.6万奖励'],
    policies: [
      {
        title: '共享空间低价入驻',
        description: '五常街道亲橙空间860平方米数字游民共享空间，月租金低至500元。',
        category: 'housing',
        amount: '500元/月起',
      },
      {
        title: '个税返还政策',
        description: '团区委联合多部门宣讲个税返还、租房补贴申领、技能补贴等政策。',
        category: 'tax',
      },
      {
        title: '数栖八条专项政策',
        description: '良渚新城「数栖八条」专项政策，给予办公补贴、研发补助。',
        category: 'business',
      },
      {
        title: '高技能人才奖励',
        description: '全省率先试点人工智能训练师「一试双证」，高技能人才最高可获3.6万元奖励。',
        category: 'talent',
        amount: '最高3.6万元',
      },
    ],
  },
  {
    id: 'lishui',
    city: '丽水',
    province: '浙江',
    overview: '浙江首个县级数字游民扶持政策，《丽水市支持数字游民旅居共创十条措施》，符合条件的数字游民给予最高2万元资金奖励。',
    highlights: ['浙江首个县级政策', '最高2万奖励', '六条措施'],
    policies: [
      {
        title: '数字游民发展六条措施',
        description: '《莲都区支持数字游民发展六条措施》，浙江首个县级数字游民扶持政策。',
        category: 'business',
      },
      {
        title: '旅居共创奖励',
        description: '《丽水市支持数字游民旅居共创十条措施》，符合条件的数字游民给予最高2万元资金奖励。',
        category: 'talent',
        amount: '最高2万元',
      },
      {
        title: '共居空间支持',
        description: '52赫兹数字游民社区，超3000㎡共居空间，硕博占比超40%，入住率达90%。',
        category: 'housing',
      },
      {
        title: '丰富社群活动',
        description: '社区累计开展活动287场，涵盖技能分享、创业交流、户外运动等。',
        category: 'business',
      },
    ],
  },
  {
    id: 'ziyang',
    city: '资阳',
    province: '四川',
    overview: '「资阳市临空经济区支持数字游民创新集聚十二条措施」，租金补贴+人才补贴+企业奖励三重政策叠加。',
    highlights: ['租金补贴20%', '硕博补贴', '企业30万奖励'],
    policies: [
      {
        title: '租金补贴',
        description: '租住DNβ社区累计30天补助租金10%，半年以上补助20%。',
        category: 'housing',
        amount: '补助20%',
      },
      {
        title: '硕博人才补贴',
        description: '全职就业的硕博研究生每年分别补贴5000元和10000元。',
        category: 'talent',
        amount: '5千-1万元/年',
      },
      {
        title: '企业创业奖励',
        description: '新注册企业正常经营满12个月，最高奖励30万元。',
        category: 'business',
        amount: '最高30万元',
      },
      {
        title: '十二条措施',
        description: '「资阳市临空经济区支持数字游民创新集聚十二条措施」全面支持。',
        category: 'business',
      },
    ],
  },
  {
    id: 'haikou',
    city: '海口',
    province: '海南',
    overview: '《海口市数字游民集聚创业发展若干措施》，全岛封关运作+数据跨境流动便利化+税收优惠三重红利。',
    highlights: ['全岛封关', '创业补贴1万', '30万创业贷款'],
    policies: [
      {
        title: '首次创业补贴',
        description: '数字游民首次创办企业且实质运营1年以上，给予1万元一次性创业补贴。',
        category: 'business',
        amount: '1万元',
      },
      {
        title: '创业担保贷款',
        description: '可申请不超过30万元的创业担保贷款。',
        category: 'business',
        amount: '最高30万元',
      },
      {
        title: '达规纳统奖励',
        description: '进驻社区首次达规纳统企业奖励10万元。',
        category: 'business',
        amount: '10万元',
      },
      {
        title: '外籍工作许可',
        description: '外籍数字游民可申办90日及以上工作许可。',
        category: 'visa',
        amount: '90日+',
      },
      {
        title: '全岛封关政策',
        description: '2025年12月全岛封关运作落地，数据跨境流动便利化和税收优惠政策。',
        category: 'tax',
      },
    ],
  },
  {
    id: 'shanghai',
    city: '上海',
    province: '上海',
    overview: '全国首个数字游民团支部，金山区漕泾数字游民国际村，免费办公+创业孵化+产业基金全方位支持。',
    highlights: ['全国首个团支部', '免费办公', '500万产业基金'],
    policies: [
      {
        title: '免费共享办公',
        description: '免费共享办公空间与万兆网络。',
        category: 'housing',
        amount: '免费',
      },
      {
        title: '创业孵化包',
        description: '「1+1+1」创业孵化包（1个月免费住宿+专属导师+工具包）。',
        category: 'business',
      },
      {
        title: '梯度创业补贴',
        description: '最高1万元梯度创业补贴。',
        category: 'business',
        amount: '最高1万元',
      },
      {
        title: '产业投资基金',
        description: '500万元镇级产业投资基金。',
        category: 'business',
        amount: '500万元',
      },
      {
        title: '数字游民服务包',
        description: '覆盖创业、购房、企业合规指导的一站式服务包。',
        category: 'business',
      },
    ],
  },
  {
    id: 'taian',
    city: '泰安',
    province: '山东',
    overview: '山东省首批数字游民创业集聚地建设试点城市，山东18部门发文鼓励灵活就业。',
    highlights: ['省级试点', '18部门支持', '灵活就业'],
    policies: [
      {
        title: '省级试点城市',
        description: '山东省大数据局启动数字游民创业集聚地建设试点，泰安成为首批试点城市。',
        category: 'business',
      },
      {
        title: '18部门政策支持',
        description: '山东18部门发文鼓励灵活就业，全方位政策支持。',
        category: 'business',
      },
      {
        title: '泰山文化底蕴',
        description: '泰山脚下创业福地，文化底蕴深厚，生活成本适中。',
        category: 'housing',
      },
    ],
  },
];

export const regionStats = [
  { region: '长三角', count: 23, label: '密度最高', color: 'from-blue-500 to-cyan-500', icon: '🏙️' },
  { region: '海南', count: 5, label: '政策最开放', color: 'from-green-500 to-teal-500', icon: '🌴' },
  { region: '西南', count: 12, label: '成本最低', color: 'from-purple-500 to-pink-500', icon: '⛰️' },
  { region: '山东', count: 8, label: '快速发展', color: 'from-orange-500 to-amber-500', icon: '⛰️' },
];
