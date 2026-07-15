const now = Date.now();

const entities = [
  {
    id: "w1",
    type: "worker",
    title: "张伟",
    alias: ["老张", "张师傅"],
    keywords: ["水电", "电工", "维修", "强电", "弱电"],
    updatedAt: now - 2 * 86400 * 1000,
    hotScore: 92,

    distanceKm: 2.1,
    avgArrivalMin: 28,
    avgServiceMin: 85,

    ratingAvg: 4.2,
    ratingCount: 38,
    reviews: [
      { id: "r_w1_1", userName: "张*", score: 5, content: "上门及时，布线规范，态度很好。", createdAt: "2026-01-09" },
      { id: "r_w1_2", userName: "李*", score: 4, content: "解决漏电问题很快，讲解清楚。", createdAt: "2025-12-22" },
      { id: "r_w1_3", userName: "王*", score: 4, content: "价格合理，施工干净利落。", createdAt: "2025-12-01" }
    ],

    detail: {
      name: "张伟",
      phone: "13800138001",
      jobType: "水电工人",
      years: 8,
      serviceArea: "北京市朝阳区/海淀区",
      qualification: {
        certName: "电工证",
        certNo: "DJ-1101-2020-0001",
        issuer: "北京市应急管理局",
        validFrom: "2023-01-01",
        validTo: "2028-01-01",
        images: []
      }
    }
  },
  {
    id: "w2",
    type: "worker",
    title: "李强",
    alias: ["小李", "李师傅"],
    keywords: ["水管", "水电", "安装", "维修", "管道疏通"],
    updatedAt: now - 7 * 86400 * 1000,
    hotScore: 80,

    distanceKm: 4.8,
    avgArrivalMin: 42,
    avgServiceMin: 70,

    ratingAvg: 4.0,
    ratingCount: 22,
    reviews: [
      { id: "r_w2_1", userName: "赵*", score: 4, content: "水管漏水处理得很利索，挺专业。", createdAt: "2026-01-06" },
      { id: "r_w2_2", userName: "周*", score: 4, content: "服务不错，时间安排也合适。", createdAt: "2025-12-10" }
    ],

    detail: {
      name: "李强",
      phone: "13800138002",
      jobType: "水电工人",
      years: 5,
      serviceArea: "上海市浦东新区",
      qualification: {
        certName: "水电安装证",
        certNo: "SD-3101-2019-0233",
        issuer: "上海市住建行业协会",
        validFrom: "2024-03-01",
        validTo: "2027-03-01",
        images: []
      }
    }
  },
  {
    id: "w3",
    type: "worker",
    title: "王敏",
    alias: ["王工"],
    keywords: ["电工", "开关", "插座", "弱电", "布线"],
    updatedAt: now - 1 * 86400 * 1000,
    hotScore: 88,

    distanceKm: 1.3,
    avgArrivalMin: 18,
    avgServiceMin: 60,

    ratingAvg: 4.6,
    ratingCount: 51,
    reviews: [
      { id: "r_w3_1", userName: "陈*", score: 5, content: "插座改造很规范，细节到位。", createdAt: "2026-01-10" },
      { id: "r_w3_2", userName: "孙*", score: 5, content: "弱电布线很专业，沟通顺畅。", createdAt: "2025-12-28" },
      { id: "r_w3_3", userName: "钱*", score: 4, content: "整体满意，后期也愿意解答问题。", createdAt: "2025-12-05" }
    ],

    detail: {
      name: "王敏",
      phone: "13800138003",
      jobType: "电工",
      years: 6,
      serviceArea: "广州市天河区",
      qualification: {
        certName: "低压电工证",
        certNo: "DY-4401-2021-1008",
        issuer: "广东省应急管理厅",
        validFrom: "2022-06-01",
        validTo: "2027-06-01",
        images: []
      }
    }
  },
  {
    id: "w4",
    type: "worker",
    title: "赵磊",
    alias: ["赵师傅"],
    keywords: ["水电", "防水", "卫浴安装", "厨卫改造"],
    updatedAt: now - 10 * 86400 * 1000,
    hotScore: 70,

    distanceKm: 6.5,
    avgArrivalMin: 55,
    avgServiceMin: 95,

    ratingAvg: 3.8,
    ratingCount: 14,
    reviews: [
      { id: "r_w4_1", userName: "吴*", score: 4, content: "厨卫改造效果还不错，比较细致。", createdAt: "2025-12-20" },
      { id: "r_w4_2", userName: "郑*", score: 3, content: "上门稍晚，但最终问题解决了。", createdAt: "2025-11-30" }
    ],

    detail: {
      name: "赵磊",
      phone: "13800138004",
      jobType: "水电工人",
      years: 10,
      serviceArea: "成都市武侯区",
      qualification: {
        certName: "建筑电工证",
        certNo: "JZ-5101-2018-0099",
        issuer: "四川省住房和城乡建设厅",
        validFrom: "2023-05-01",
        validTo: "2026-05-01",
        images: []
      }
    }
  },
  {
    id: "w5",
    type: "worker",
    title: "陈刚",
    alias: ["陈师傅"],
    keywords: ["电工", "水电", "家装", "旧房改造"],
    updatedAt: now - 4 * 86400 * 1000,
    hotScore: 76,

    distanceKm: 3.2,
    avgArrivalMin: 30,
    avgServiceMin: 80,

    ratingAvg: 4.3,
    ratingCount: 27,
    reviews: [
      { id: "r_w5_1", userName: "冯*", score: 5, content: "旧房水电改造经验足，方案清晰。", createdAt: "2026-01-03" },
      { id: "r_w5_2", userName: "褚*", score: 4, content: "做工扎实，收尾也很干净。", createdAt: "2025-12-12" }
    ],

    detail: {
      name: "陈刚",
      phone: "13800138005",
      jobType: "水电工人",
      years: 7,
      serviceArea: "杭州市西湖区",
      qualification: {
        certName: "水电施工证",
        certNo: "SG-3301-2020-0456",
        issuer: "浙江省建筑业协会",
        validFrom: "2024-01-01",
        validTo: "2029-01-01",
        images: []
      }
    }
  },
  {
    id: "w6",
    type: "worker",
    title: "刘芳",
    alias: ["刘工"],
    keywords: ["水管", "维修", "水电", "热水器安装"],
    updatedAt: now - 12 * 86400 * 1000,
    hotScore: 60,

    distanceKm: 7.9,
    avgArrivalMin: 65,
    avgServiceMin: 75,

    ratingAvg: 3.9,
    ratingCount: 9,
    reviews: [
      { id: "r_w6_1", userName: "卫*", score: 4, content: "热水器安装规范，讲解很耐心。", createdAt: "2025-12-25" },
      { id: "r_w6_2", userName: "蒋*", score: 4, content: "维修及时，整体满意。", createdAt: "2025-11-21" }
    ],

    detail: {
      name: "刘芳",
      phone: "13800138006",
      jobType: "水电工人",
      years: 4,
      serviceArea: "南京市鼓楼区",
      qualification: {
        certName: "特种作业操作证（低压电工）",
        certNo: "TZ-3201-2022-7788",
        issuer: "江苏省应急管理厅",
        validFrom: "2022-08-01",
        validTo: "2027-08-01",
        images: []
      }
    }
  },
  {
    id: "e1",
    type: "enterprise",
    title: "北京水电集团有限公司",
    alias: ["北京水电集团", "京水电"],
    keywords: ["水电", "工程", "安装", "检修", "维保"],
    updatedAt: now - 3 * 86400 * 1000,
    hotScore: 95,

    distanceKm: 5.6,
    avgArrivalMin: 40,
    avgServiceMin: 120,

    ratingAvg: 4.6,
    ratingCount: 120,
    reviews: [
      { id: "r_e1_1", userName: "赵*", score: 5, content: "客服响应快，安排师傅专业。", createdAt: "2026-01-10" },
      { id: "r_e1_2", userName: "沈*", score: 4, content: "工程验收顺利，流程规范。", createdAt: "2025-12-18" },
      { id: "r_e1_3", userName: "韩*", score: 5, content: "维保及时，售后跟进到位。", createdAt: "2025-11-08" }
    ],

    detail: {
      companyName: "北京水电集团有限公司",
      servicePhone: "4008009001",
      city: "北京",
      address: "北京市朝阳区建国路88号",
      scope: "水电工程施工、检修维保、家装水电改造",
      website: "https://example.com",
      bizLicense: {
        licenseName: "经营许可证",
        licenseNo: "LIC-BJ-2020-000088",
        issuer: "北京市市场监督管理局",
        validFrom: "2020-01-01",
        validTo: "2030-01-01",
        images: []
      }
    }
  },
  {
    id: "e2",
    type: "enterprise",
    title: "沪上水电工程服务有限公司",
    alias: ["沪上水电", "上海水电服务"],
    keywords: ["水电", "电工", "水管", "抢修", "上门维修"],
    updatedAt: now - 15 * 86400 * 1000,
    hotScore: 78,

    distanceKm: 3.9,
    avgArrivalMin: 35,
    avgServiceMin: 90,

    ratingAvg: 4.1,
    ratingCount: 64,
    reviews: [
      { id: "r_e2_1", userName: "周*", score: 4, content: "抢修速度快，价格透明。", createdAt: "2026-01-04" },
      { id: "r_e2_2", userName: "钱*", score: 4, content: "安排及时，师傅手艺不错。", createdAt: "2025-12-06" }
    ],

    detail: {
      companyName: "沪上水电工程服务有限公司",
      servicePhone: "4008009002",
      city: "上海",
      address: "上海市浦东新区世纪大道100号",
      scope: "家装水电、应急抢修、管道维修",
      website: "",
      bizLicense: {
        licenseName: "经营许可证",
        licenseNo: "LIC-SH-2019-003210",
        issuer: "上海市市场监督管理局",
        validFrom: "2019-05-01",
        validTo: "2029-05-01",
        images: []
      }
    }
  },
  {
    id: "e3",
    type: "enterprise",
    title: "鹏城电力水电安装有限公司",
    alias: ["鹏城水电", "深圳水电安装"],
    keywords: ["水电", "安装", "强电", "弱电", "布线"],
    updatedAt: now - 6 * 86400 * 1000,
    hotScore: 82,

    distanceKm: 8.2,
    avgArrivalMin: 60,
    avgServiceMin: 110,

    ratingAvg: 4.4,
    ratingCount: 89,
    reviews: [
      { id: "r_e3_1", userName: "孙*", score: 5, content: "强弱电布线专业，工期按时。", createdAt: "2026-01-08" },
      { id: "r_e3_2", userName: "李*", score: 4, content: "沟通顺畅，施工过程规范。", createdAt: "2025-12-14" }
    ],

    detail: {
      companyName: "鹏城电力水电安装有限公司",
      servicePhone: "4008009003",
      city: "深圳",
      address: "深圳市南山区科技园路66号",
      scope: "强弱电布线、水电安装、工程改造",
      website: "https://example.com",
      bizLicense: {
        licenseName: "经营许可证",
        licenseNo: "LIC-SZ-2021-000777",
        issuer: "深圳市市场监督管理局",
        validFrom: "2021-02-01",
        validTo: "2031-02-01",
        images: []
      }
    }
  },
  {
    id: "e4",
    type: "enterprise",
    title: "西湖家装水电有限公司",
    alias: ["西湖家装水电", "杭州水电公司"],
    keywords: ["水电", "家装", "旧房改造", "防水", "维修"],
    updatedAt: now - 20 * 86400 * 1000,
    hotScore: 66,

    distanceKm: 2.7,
    avgArrivalMin: 25,
    avgServiceMin: 100,

    ratingAvg: 3.7,
    ratingCount: 33,
    reviews: [
      { id: "r_e4_1", userName: "王*", score: 4, content: "家装改造经验丰富，整体满意。", createdAt: "2025-12-02" },
      { id: "r_e4_2", userName: "郑*", score: 3, content: "响应一般，但问题最终解决。", createdAt: "2025-11-05" }
    ],

    detail: {
      companyName: "西湖家装水电有限公司",
      servicePhone: "4008009004",
      city: "杭州",
      address: "杭州市西湖区文三路199号",
      scope: "家装水电、旧房改造、防水维修",
      website: "",
      bizLicense: {
        licenseName: "经营许可证",
        licenseNo: "LIC-HZ-2018-000123",
        issuer: "杭州市市场监督管理局",
        validFrom: "2018-09-01",
        validTo: "2028-09-01",
        images: []
      }
    }
  }
];

function buildWorker(seed) {
  return {
    id: seed.id,
    type: "worker",
    title: seed.title,
    alias: [`${seed.title.slice(0, 1)}师傅`, seed.alias],
    keywords: seed.keywords,
    updatedAt: now - seed.daysAgo * 86400 * 1000,
    hotScore: seed.hotScore,
    distanceKm: seed.distanceKm,
    avgArrivalMin: seed.avgArrivalMin,
    avgServiceMin: seed.avgServiceMin,
    ratingAvg: seed.ratingAvg,
    ratingCount: seed.ratingCount,
    reviews: [],
    detail: {
      name: seed.title,
      phone: seed.phone,
      jobType: seed.jobType,
      years: seed.years,
      serviceArea: seed.serviceArea,
      qualification: {
        certName: seed.certName,
        certNo: seed.certNo,
        issuer: seed.issuer,
        validFrom: "2024-01-01",
        validTo: "2029-01-01",
        images: []
      }
    }
  };
}

function buildEnterprise(seed) {
  return {
    id: seed.id,
    type: "enterprise",
    title: seed.title,
    alias: [seed.shortName, `${seed.city}水电服务`],
    keywords: seed.keywords,
    updatedAt: now - seed.daysAgo * 86400 * 1000,
    hotScore: seed.hotScore,
    distanceKm: seed.distanceKm,
    avgArrivalMin: seed.avgArrivalMin,
    avgServiceMin: seed.avgServiceMin,
    ratingAvg: seed.ratingAvg,
    ratingCount: seed.ratingCount,
    reviews: [],
    detail: {
      companyName: seed.title,
      servicePhone: seed.servicePhone,
      city: seed.city,
      address: seed.address,
      scope: seed.scope,
      website: "",
      bizLicense: {
        licenseName: "经营许可证",
        licenseNo: seed.licenseNo,
        issuer: `${seed.city}市市场监督管理局`,
        validFrom: "2022-01-01",
        validTo: "2032-01-01",
        images: []
      }
    }
  };
}

const additionalWorkers = [
  { id: "w7", title: "周凯", alias: "周工", keywords: ["管道疏通", "水管", "下水", "维修"], daysAgo: 3, hotScore: 84, distanceKm: 2.4, avgArrivalMin: 24, avgServiceMin: 68, ratingAvg: 4.7, ratingCount: 63, phone: "13800138007", jobType: "管道维修工", years: 9, serviceArea: "武汉市江汉区", certName: "管道安装维修证", certNo: "GD-4201-2021-0718", issuer: "湖北省建设行业协会" },
  { id: "w8", title: "孙浩", alias: "孙师傅", keywords: ["电工", "开关", "插座", "电路故障"], daysAgo: 5, hotScore: 79, distanceKm: 3.6, avgArrivalMin: 32, avgServiceMin: 72, ratingAvg: 4.5, ratingCount: 47, phone: "13800138008", jobType: "低压电工", years: 7, serviceArea: "苏州市工业园区", certName: "低压电工作业证", certNo: "DY-3205-2020-1836", issuer: "江苏省应急管理厅" },
  { id: "w9", title: "吴静", alias: "吴工", keywords: ["弱电", "智能家居", "网络", "布线"], daysAgo: 2, hotScore: 90, distanceKm: 1.9, avgArrivalMin: 22, avgServiceMin: 96, ratingAvg: 4.8, ratingCount: 76, phone: "13800138009", jobType: "弱电工程师", years: 8, serviceArea: "天津市和平区", certName: "智能楼宇管理员证", certNo: "ZN-1201-2021-0925", issuer: "天津市职业技能鉴定中心" },
  { id: "w10", title: "郑宇", alias: "郑师傅", keywords: ["防水", "补漏", "厨卫改造", "维修"], daysAgo: 8, hotScore: 73, distanceKm: 5.1, avgArrivalMin: 46, avgServiceMin: 130, ratingAvg: 4.4, ratingCount: 41, phone: "13800138010", jobType: "防水施工员", years: 11, serviceArea: "重庆市渝中区", certName: "建筑防水工证", certNo: "FS-5001-2019-0512", issuer: "重庆市住房和城乡建设委员会" }
].map(buildWorker);

const additionalEnterprises = [
  { id: "e5", title: "蓉城安心维修服务有限公司", shortName: "蓉城安心维修", city: "成都", keywords: ["水电", "管道疏通", "防水", "上门维修"], daysAgo: 4, hotScore: 86, distanceKm: 3.1, avgArrivalMin: 30, avgServiceMin: 100, ratingAvg: 4.7, ratingCount: 98, servicePhone: "4008009005", address: "成都市锦江区东大街55号", scope: "家庭水电、管道疏通、防水补漏", licenseNo: "LIC-CD-2022-005501" },
  { id: "e6", title: "金陵快修工程有限公司", shortName: "金陵快修", city: "南京", keywords: ["电工", "抢修", "开关", "插座"], daysAgo: 9, hotScore: 74, distanceKm: 4.4, avgArrivalMin: 38, avgServiceMin: 88, ratingAvg: 4.3, ratingCount: 71, servicePhone: "4008009006", address: "南京市秦淮区中山东路108号", scope: "电路抢修、开关插座、灯具安装", licenseNo: "LIC-NJ-2020-006612" },
  { id: "e7", title: "江城家维科技有限公司", shortName: "江城家维", city: "武汉", keywords: ["水电", "智能家居", "弱电", "网络"], daysAgo: 1, hotScore: 91, distanceKm: 2.2, avgArrivalMin: 26, avgServiceMin: 105, ratingAvg: 4.8, ratingCount: 136, servicePhone: "4008009007", address: "武汉市洪山区光谷大道77号", scope: "智能家居、弱电布线、水电维修", licenseNo: "LIC-WH-2023-007723" },
  { id: "e8", title: "姑苏管家水电服务有限公司", shortName: "姑苏管家", city: "苏州", keywords: ["水管", "管道疏通", "卫浴安装", "维修"], daysAgo: 11, hotScore: 69, distanceKm: 5.8, avgArrivalMin: 50, avgServiceMin: 92, ratingAvg: 4.2, ratingCount: 58, servicePhone: "4008009008", address: "苏州市姑苏区干将西路168号", scope: "水管维修、管道疏通、卫浴安装", licenseNo: "LIC-SZ-2021-008834" },
  { id: "e9", title: "津门智慧家装有限公司", shortName: "津门智慧家装", city: "天津", keywords: ["家装", "弱电", "智能家居", "旧房改造"], daysAgo: 7, hotScore: 81, distanceKm: 3.7, avgArrivalMin: 34, avgServiceMin: 118, ratingAvg: 4.5, ratingCount: 83, servicePhone: "4008009009", address: "天津市河西区友谊路99号", scope: "智能家居、旧房水电改造、弱电工程", licenseNo: "LIC-TJ-2022-009945" },
  { id: "e10", title: "山城防水水电工程有限公司", shortName: "山城防水水电", city: "重庆", keywords: ["防水", "补漏", "水电", "厨卫改造"], daysAgo: 13, hotScore: 72, distanceKm: 6.2, avgArrivalMin: 54, avgServiceMin: 140, ratingAvg: 4.1, ratingCount: 52, servicePhone: "4008009010", address: "重庆市江北区观音桥步行街28号", scope: "防水补漏、厨卫改造、水电检修", licenseNo: "LIC-CQ-2020-010056" }
].map(buildEnterprise);

entities.push(...additionalWorkers, ...additionalEnterprises);

const reviewTemplates = [
  { userName: "林*", score: 5, content: "预约后很快确认时间，上门准时，处理过程也很专业。", createdAt: "2025-11-28" },
  { userName: "何*", score: 5, content: "报价项目讲得很清楚，没有临时增加费用。", createdAt: "2025-11-24" },
  { userName: "高*", score: 4, content: "故障定位准确，维修完成后还做了安全检查。", createdAt: "2025-11-20" },
  { userName: "罗*", score: 5, content: "师傅工具齐全，施工现场保持得很干净。", createdAt: "2025-11-16" },
  { userName: "宋*", score: 4, content: "沟通耐心，给出的使用和保养建议很实用。", createdAt: "2025-11-12" },
  { userName: "谢*", score: 5, content: "从预约到完工流程顺畅，整体体验很好。", createdAt: "2025-11-08" },
  { userName: "唐*", score: 4, content: "响应速度快，约定时间内顺利解决问题。", createdAt: "2025-11-04" },
  { userName: "许*", score: 5, content: "施工细节到位，完工后逐项说明并验收。", createdAt: "2025-10-30" },
  { userName: "邓*", score: 4, content: "价格合理，服务态度认真，后续有需要还会预约。", createdAt: "2025-10-26" },
  { userName: "彭*", score: 5, content: "平台回访及时，维修效果稳定，值得推荐。", createdAt: "2025-10-22" }
];

entities.forEach((entity) => {
  const reviews = Array.isArray(entity.reviews) ? entity.reviews : [];
  const missingCount = Math.max(0, 10 - reviews.length);
  const generated = Array.from({ length: missingCount }, (_, index) => {
    const sequence = reviews.length + index + 1;
    const template = reviewTemplates[(sequence - 1) % reviewTemplates.length];
    return { ...template, id: `r_${entity.id}_${sequence}` };
  });
  entity.reviews = [...reviews, ...generated];
});

export { entities };
