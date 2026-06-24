/**
 * 惠生活平台 - 共享数据层
 * 基于 localStorage + BroadcastChannel 实现多门户实时数据同步
 * 支持 C端、管理后台、商家端、业务员端四个门户共享数据
 *
 * @version 1.1.0
 * @namespace HuiLifeDB
 */
(function (global) {
  'use strict';

  // ==================== 常量定义 ====================
  var STORAGE_KEY = 'huilife_db';
  var CHANNEL_NAME = 'huilife_sync';

  // ==================== 默认种子数据 ====================

  /** 商户数据 */
  var DEFAULT_MERCHANTS = [
    { id:'M001', name:'老街火锅·旗舰店', rating:4.8, categories:['美食','火锅'], city:'杭州', distance:'1.2km', address:'杭州市上城区延安路128号银泰百货3楼', phone:'0571-8888-6666', hours:'11:00-次日02:00', status:'active', salesRep:'王磊', description:'老街火锅创立于2015年，是杭州本地知名火锅品牌。旗舰店位于延安路核心商圈，营业面积500余平方米，拥有包厢8间。招牌牛油锅底采用四川纯牛油搭配30余种香料秘制而成，鲜香麻辣，回味无穷。', monthlySales:256, verifyAccounts:2 },
    { id:'M002', name:'星巴克·西湖银泰店', rating:4.6, categories:['休闲','咖啡'], city:'杭州', distance:'0.8km', address:'杭州市上城区延安路98号西湖银泰1楼', phone:'0571-8888-7777', hours:'07:00-22:00', status:'active', salesRep:'李娜', description:'星巴克西湖银泰店位于西湖银泰一楼，环境舒适，是商务洽谈和朋友小聚的理想场所。', monthlySales:380, verifyAccounts:1 },
    { id:'M003', name:'美味烧烤城', rating:4.7, categories:['美食','烧烤'], city:'杭州', distance:'2.0km', address:'杭州市拱墅区莫干山路680号', phone:'0571-8888-8888', hours:'16:00-次日03:00', status:'active', salesRep:'王磊', description:'美味烧烤城是杭州知名烧烤品牌，主打各类烤串和啤酒组合，是宵夜聚会的首选。', monthlySales:198, verifyAccounts:1 },
    { id:'M004', name:'蜀大侠火锅', rating:4.5, categories:['美食','火锅'], city:'杭州', distance:'1.8km', address:'杭州市西湖区文三路398号', phone:'0571-8888-9999', hours:'11:00-次日01:00', status:'active', salesRep:'张伟', description:'蜀大侠火锅来自成都，正宗川味火锅，毛肚和鲜切牛肉是招牌。', monthlySales:165, verifyAccounts:1 },
    { id:'M005', name:'捞王锅物料理', rating:4.9, categories:['美食','火锅'], city:'上海', distance:'1.5km', address:'上海市黄浦区南京东路800号', phone:'021-6666-8888', hours:'11:00-22:00', status:'active', salesRep:'李娜', description:'捞王锅物料理以胡椒猪肚鸡锅底闻名，暖胃首选，汤鲜味美。', monthlySales:320, verifyAccounts:2 },
    { id:'M006', name:'绿野健身房', rating:4.3, categories:['健身'], city:'杭州', distance:'3.2km', address:'杭州市滨江区江南大道588号', phone:'0571-8888-0000', hours:'06:00-23:00', status:'active', salesRep:'张伟', description:'绿野健身房是杭州本地高端健身品牌，拥有进口器械和专业教练团队。', monthlySales:89, verifyAccounts:1 },
    { id:'M007', name:'宝贝当家亲子乐园', rating:4.6, categories:['亲子'], city:'杭州', distance:'2.5km', address:'杭州市江干区钱江新城市民中心2楼', phone:'0571-8888-1111', hours:'09:00-21:00', status:'active', salesRep:'王磊', description:'宝贝当家亲子乐园是杭州最大的室内亲子乐园，拥有海洋球池、蹦床、沙池等多种游乐设施。', monthlySales:156, verifyAccounts:1 },
    { id:'M008', name:'丽人美发沙龙', rating:4.4, categories:['美发'], city:'杭州', distance:'1.0km', address:'杭州市下城区武林路188号', phone:'0571-8888-2222', hours:'10:00-21:00', status:'active', salesRep:'李娜', description:'丽人美发沙龙是杭州知名美发品牌，拥有资深造型师团队，提供剪发、染发、烫发等全方位服务。', monthlySales:120, verifyAccounts:1 }
  ];

  /** 套餐数据 */
  var DEFAULT_PACKAGES = [
    { id:'P001', name:'海鲜双人套餐', type:'bargain', merchantId:'M001', originalPrice:198, currentPrice:98, floorPrice:49, stock:100, dailyStock:30, sold:42, commission:5.90, merchantIncome:60, platformIncome:38, salesRepCommission:5.90, status:'active', content:'龙虾1只、扇贝6只、生蚝4只、牛肉卷2份、蔬菜拼盘1份、鸭血1份、豆腐1份、蘸料2份、酸梅汤2杯、米饭2碗、水果拼盘1份、纸巾1包', rules:'需提前1天预约|有效期30天|使用时间11:00-22:00|不可与其他优惠同享|仅限堂食|每桌限用1张', createdAt:'2026-06-01' },
    { id:'P002', name:'下午茶双人套餐', type:'bargain', merchantId:'M002', originalPrice:128, currentPrice:68, floorPrice:34, stock:80, dailyStock:20, sold:35, commission:4.10, merchantIncome:40, platformIncome:28, salesRepCommission:4.10, status:'active', content:'拿铁2杯、提拉米苏1份、马卡龙3个、水果拼盘1份', rules:'有效期30天|使用时间14:00-17:00|不可与其他优惠同享|仅限堂食', createdAt:'2026-06-02' },
    { id:'P003', name:'4人烧烤套餐', type:'bargain', merchantId:'M003', originalPrice:318, currentPrice:158, floorPrice:79, stock:60, dailyStock:15, sold:28, commission:9.50, merchantIncome:95, platformIncome:63, salesRepCommission:9.50, status:'active', content:'烤串20串、烤鱼1条、烤生蚝6只、烤扇贝6只、啤酒4瓶、凉菜4份、米饭4碗', rules:'有效期30天|使用时间16:00-次日03:00|不可与其他优惠同享|仅限堂食', createdAt:'2026-06-03' },
    { id:'P004', name:'午市特惠单人餐', type:'seckill', merchantId:'M001', originalPrice:98, currentPrice:29, stock:50, dailyStock:50, sold:38, commission:1.70, merchantIncome:15, platformIncome:14, salesRepCommission:1.70, status:'active', limitPerUser:true, cooldownHours:24, content:'招牌锅底1份、肥牛卷1份、蔬菜拼盘1份、酸梅汤1杯、米饭1碗', rules:'仅限工作日午餐|有效期7天|不可与其他优惠同享|仅限堂食|每人限购1份', level1Commission:0, level2Commission:0, secondaryCommissionEnabled:false, createdAt:'2026-06-04' },
    { id:'P005', name:'晚市双人套餐', type:'seckill', merchantId:'M001', originalPrice:168, currentPrice:59, stock:30, dailyStock:30, sold:26, commission:3.50, merchantIncome:30, platformIncome:29, salesRepCommission:3.50, status:'active', limitPerUser:true, cooldownHours:24, content:'鸳鸯锅底1份、肥牛卷2份、鲜切羊肉1份、蔬菜拼盘1份、酸梅汤2杯、米饭2碗', rules:'有效期7天|使用时间17:00-22:00|不可与其他优惠同享|仅限堂食|每人限购1份', level1Commission:0, level2Commission:0, secondaryCommissionEnabled:false, createdAt:'2026-06-05' },
    { id:'P006', name:'招牌咖啡双人', type:'seckill', merchantId:'M002', originalPrice:88, currentPrice:39, stock:40, dailyStock:40, sold:22, commission:2.30, merchantIncome:20, platformIncome:19, salesRepCommission:2.30, status:'active', limitPerUser:true, cooldownHours:24, content:'拿铁2杯、蛋糕1份', rules:'有效期7天|不可与其他优惠同享|每人限购1份', level1Commission:0, level2Commission:0, secondaryCommissionEnabled:false, createdAt:'2026-06-05' },
    { id:'P007', name:'周末家庭套餐', type:'group', merchantId:'M001', originalPrice:298, currentPrice:158, stock:200, dailyStock:50, sold:32, commission:9.50, merchantIncome:95, platformIncome:63, salesRepCommission:9.50, status:'active', content:'牛油锅底1份、肥牛卷2份、鲜切羊肉2份、手工虾滑1份、鲜毛肚1份、蔬菜拼盘2份、鸭血2份、豆腐2份、蘸料4份、酸梅汤4杯、米饭4碗、水果拼盘1份', rules:'有效期30天|需提前1天预约|不可与其他优惠同享|仅限堂食', level1Commission:0, level2Commission:0, secondaryCommissionEnabled:false, createdAt:'2026-06-06' },
    { id:'P008', name:'烧烤欢聚套餐', type:'group', merchantId:'M003', originalPrice:258, currentPrice:128, stock:150, dailyStock:40, sold:24, commission:7.70, merchantIncome:78, platformIncome:50, salesRepCommission:7.70, status:'active', content:'烤串30串、烤鱼1条、烤生蚝8只、烤扇贝8只、啤酒6瓶、凉菜4份、米饭4碗', rules:'有效期30天|不可与其他优惠同享|仅限堂食', level1Commission:0, level2Commission:0, secondaryCommissionEnabled:false, createdAt:'2026-06-07' },
    { id:'P009', name:'月卡体验券', type:'group', merchantId:'M006', originalPrice:299, currentPrice:99, stock:100, dailyStock:10, sold:18, commission:5.90, merchantIncome:50, platformIncome:49, salesRepCommission:5.90, status:'active', content:'单次健身体验1次、私教体验课1节、运动饮品1杯', rules:'有效期30天|首次使用需预约|每人限购1份', level1Commission:0, level2Commission:0, secondaryCommissionEnabled:false, createdAt:'2026-06-08' }
  ];

  /** 订单数据 */
  var DEFAULT_ORDERS = [
    { id:'HL20260613001', userId:'U001', userName:'张*明', merchantId:'M001', packageId:'P001', amount:98, type:'bargain', status:'pending_verify', payTime:'2026-06-13 12:30', expiryDate:'2026-07-13', verifyTime:null, verifyCode:'VHX8K2M4', salesRepId:'SR001', createdAt:'2026-06-13 12:30' },
    { id:'HL20260613002', userId:'U002', userName:'李*华', merchantId:'M001', packageId:'P004', amount:29, type:'seckill', status:'pending_verify', payTime:'2026-06-13 11:45', expiryDate:'2026-06-20', verifyTime:null, verifyCode:'SK9M3N7P', salesRepId:'SR001', createdAt:'2026-06-13 11:45' },
    { id:'HL20260612008', userId:'U003', userName:'王*丽', merchantId:'M001', packageId:'P007', amount:158, type:'group', status:'verified', payTime:'2026-06-12 19:20', expiryDate:'2026-07-12', verifyTime:'2026-06-12 20:30', verifyCode:'GP5R8T2W', salesRepId:'SR001', createdAt:'2026-06-12 19:20' },
    { id:'HL20260612005', userId:'U004', userName:'赵*强', merchantId:'M001', packageId:'P001', amount:98, type:'bargain', status:'verified', payTime:'2026-06-12 17:10', expiryDate:'2026-07-12', verifyTime:'2026-06-12 18:45', verifyCode:'BH3K7L9Q', salesRepId:'SR001', createdAt:'2026-06-12 17:10' },
    { id:'HL20260611012', userId:'U005', userName:'陈*芳', merchantId:'M001', packageId:'P005', amount:59, type:'seckill', status:'expired', payTime:'2026-06-11 15:30', expiryDate:'2026-06-18', verifyTime:null, verifyCode:'SK2P5N8R', salesRepId:'SR001', createdAt:'2026-06-11 15:30' },
    { id:'HL20260610003', userId:'U006', userName:'孙*伟', merchantId:'M003', packageId:'P008', amount:128, type:'group', status:'verified', payTime:'2026-06-10 20:00', expiryDate:'2026-07-10', verifyTime:'2026-06-11 12:00', verifyCode:'GP7T4V1X', salesRepId:'SR002', createdAt:'2026-06-10 20:00' },
    { id:'HL20260609005', userId:'U007', userName:'周*梅', merchantId:'M002', packageId:'P002', amount:68, type:'bargain', status:'verified', payTime:'2026-06-09 14:20', expiryDate:'2026-07-09', verifyTime:'2026-06-10 15:30', verifyCode:'BH6L2M5N', salesRepId:'SR002', createdAt:'2026-06-09 14:20' },
    { id:'HL20260608001', userId:'U008', userName:'吴*龙', merchantId:'M006', packageId:'P009', amount:99, type:'group', status:'pending_verify', payTime:'2026-06-08 09:00', expiryDate:'2026-07-08', verifyTime:null, verifyCode:'GP9W3Y6Z', salesRepId:'SR002', createdAt:'2026-06-08 09:00' }
  ];

  /** 任务数据 */
  var DEFAULT_TASKS = [
    { id:'T001', name:'老街火锅探店', merchantId:'M001', type:'图文笔记', commission:120, deadline:'2026-06-30', minFans:500, quota:10, applied:3, completed:1, status:'active', requirements:'到店消费并发布图文推文|至少3张实拍图（含菜品和环境照）|推文需包含指定话题标签|发布后48小时内回传链接' },
    { id:'T002', name:'星巴克新品体验', merchantId:'M002', type:'图文笔记', commission:80, deadline:'2026-07-15', minFans:500, quota:8, applied:2, completed:0, status:'active', requirements:'到店体验新品并发布推文|至少2张产品实拍图|推文需包含指定话题标签|发布后48小时内回传链接' },
    { id:'T003', name:'美味烧烤城夜宵探店', merchantId:'M003', type:'视频/图文', commission:150, deadline:'2026-07-20', minFans:500, quota:5, applied:1, completed:0, status:'active', requirements:'晚间到店体验并发布视频或图文推文|至少4张图片或1条15秒以上视频|推文需包含指定话题标签|发布后48小时内回传链接' },
    { id:'T004', name:'宝贝当家亲子体验', merchantId:'M007', type:'图文笔记', commission:100, deadline:'2026-07-10', minFans:500, quota:5, applied:5, completed:3, status:'active', requirements:'到店体验并发布图文推文|至少3张实拍图|推文需包含指定话题标签|发布后48小时内回传链接' }
  ];

  /** 用户数据 */
  var DEFAULT_USERS = [
    { id:'U001', name:'张*明', phone:'138****1234', city:'杭州', registerTime:'2026-01-15', status:'active', fansCount:0, isCertified:false, isBlogger:false },
    { id:'U002', name:'李*华', phone:'139****5678', city:'杭州', registerTime:'2026-02-20', status:'active', fansCount:680, isCertified:true, isBlogger:true },
    { id:'U003', name:'美食达人小王', phone:'137****9012', city:'杭州', registerTime:'2026-03-10', status:'active', fansCount:1200, isCertified:true, isBlogger:true },
    { id:'U004', name:'小红薯爱美食', phone:'136****3456', city:'杭州', registerTime:'2026-04-05', status:'active', fansCount:2500, isCertified:true, isBlogger:true }
  ];

  /** 认证审核数据 */
  var DEFAULT_CERTIFICATIONS = [
    { id:'C001', userId:'U005', userName:'摄影爱好者', platform:'小红书', nickname:'摄影小达人', fansCount:860, link:'https://xiaohongshu.com/user/xxx', status:'pending', submitTime:'2026-06-12 10:30' },
    { id:'C002', userId:'U006', userName:'点评达人小李', platform:'大众点评', nickname:'美食探路者', fansCount:520, link:'https://dianping.com/user/xxx', status:'pending', submitTime:'2026-06-11 14:20' }
  ];

  /** 推文上传审核数据 */
  var DEFAULT_NOTE_UPLOADS = [
    { id:'N001', userId:'U002', userName:'李*华', merchantId:'M001', packageName:'海鲜双人套餐', link:'https://xiaohongshu.com/post/xxx', likes:128, comments:32, status:'pending', submitTime:'2026-06-12 16:00', type:'seckill_callback' },
    { id:'N002', userId:'U003', userName:'美食达人小王', merchantId:'M001', packageName:'午市特惠单人餐', link:'https://xiaohongshu.com/post/yyy', likes:256, comments:48, status:'pending', submitTime:'2026-06-11 09:30', type:'upload_reward' }
  ];

  /** 任务申请数据 */
  var DEFAULT_TASK_APPLICATIONS = [
    { id:'TA001', taskId:'T001', userId:'U002', userName:'李*华', fansCount:680, status:'approved', applyTime:'2026-06-10 10:00' },
    { id:'TA002', taskId:'T001', userId:'U003', userName:'美食达人小王', fansCount:1200, status:'pending', applyTime:'2026-06-12 14:30' },
    { id:'TA003', taskId:'T002', userId:'U004', userName:'小红薯爱美食', fansCount:2500, status:'pending', applyTime:'2026-06-13 09:00' }
  ];

  /** 财务记录数据 */
  var DEFAULT_FINANCIAL_RECORDS = [
    { id:'F001', type:'income', category:'bargain', amount:98, description:'海鲜双人套餐-砍价成交', orderId:'HL20260613001', time:'2026-06-13 12:30' },
    { id:'F002', type:'income', category:'seckill', amount:29, description:'午市特惠单人餐-秒杀成交', orderId:'HL20260613002', time:'2026-06-13 11:45' },
    { id:'F003', type:'expense', category:'sales_commission', amount:5.90, description:'业务员分佣-海鲜双人套餐', orderId:'HL20260613001', time:'2026-06-13 12:30' },
    { id:'F004', type:'expense', category:'note_reward', amount:10, description:'推文奖励-星巴克探店', noteId:'N002', time:'2026-06-11 09:30' },
    { id:'F005', type:'expense', category:'task_commission', amount:120, description:'探店任务佣金-老街火锅探店', taskId:'T001', time:'2026-06-10 10:00' },
    { id:'F006', type:'expense', category:'merchant_settlement', amount:60, description:'商家结算-老街火锅', orderId:'HL20260613001', time:'2026-06-13 12:30' }
  ];

  /** 商户入驻申请数据 */
  var DEFAULT_MERCHANT_APPS = [
    { id:'MA001', name:'川味小厨', contact:'周经理', phone:'158****3322', city:'杭州', categories:['美食','川菜'], status:'pending', submitTime:'2026-06-12 14:30' },
    { id:'MA002', name:'悦动健身中心', contact:'李店长', phone:'139****5566', city:'上海', categories:['健身'], status:'pending', submitTime:'2026-06-12 10:15' },
    { id:'MA003', name:'甜品工坊', contact:'张小姐', phone:'137****7788', city:'杭州', categories:['甜品'], status:'pending', submitTime:'2026-06-11 16:00' }
  ];

  /** 提现申请数据 */
  var DEFAULT_WITHDRAWALS = [
    { id:'W001', type:'merchant', accountId:'M001', amount:500, status:'pending', requestTime:'2026-06-12 10:00', bankName:'中国工商银行', bankAccount:'6222****1234', accountName:'杭州老街餐饮管理有限公司', isLegalPerson:true, authDoc:null, processTime:null, processNote:null },
    { id:'W002', type:'sales', accountId:'SR001', amount:200, status:'approved', requestTime:'2026-06-10 14:00', bankName:'中国建设银行', bankAccount:'6227****5678', accountName:'王磊', isLegalPerson:true, authDoc:null, processTime:'2026-06-11 09:00', processNote:'审核通过' }
  ];

  /** 平台推文数据 */
  var DEFAULT_ARTICLES = [
    { id:'A001', title:'杭州必吃火锅TOP5，冬天就该这么吃！', content:'冬天来了，火锅怎么能少？...', author:'惠生活官方', authorAvatar:'惠', coverImage:'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20hotpot%20restaurant%20delicious%20boiling%20broth%20with%20meat%20and%20vegetables%20top%20view%20warm%20lighting&image_size=landscape_16_9', images:[], likes:328, comments:56, publishTime:'2026-06-05 14:30', status:'published', relatedMerchantId:'M001', relatedPackageId:'P001', tags:['美食','火锅'], type:'platform' },
    { id:'A002', title:'夏日冰饮推荐，星巴克限定款来了', content:'...', author:'惠生活官方', authorAvatar:'惠', coverImage:'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Starbucks%20coffee%20latte%20art%20cappuccino%20on%20wooden%20table%20cozy%20cafe%20atmosphere&image_size=landscape_16_9', images:[], likes:256, comments:32, publishTime:'2026-06-04 10:00', status:'published', relatedMerchantId:'M002', relatedPackageId:'P002', tags:['休闲','咖啡'], type:'platform' },
    { id:'A003', title:'宵夜必选！美味烧烤城超值攻略', content:'...', author:'惠生活官方', authorAvatar:'惠', coverImage:'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20BBQ%20grilled%20skewers%20meat%20on%20grill%20flames%20smoky%20atmosphere%20restaurant&image_size=landscape_16_9', images:[], likes:189, comments:28, publishTime:'2026-06-03 18:00', status:'published', relatedMerchantId:'M003', relatedPackageId:'P003', tags:['美食','烧烤'], type:'platform' }
  ];

  /** C端文字配置 */
  var DEFAULT_PLATFORM_CONFIG = {
    bottomNav: { tab1:'首页', tab2:'发现', tab3:'我的' },
    homePage: {
      categories: ['美食','火锅','烧烤','甜品','休闲','咖啡','美发','亲子','健身'],
      hotPostsTitle: '热门推文',
      recommendMerchantsTitle: '推荐商家',
      viewMoreText: '查看更多'
    },
    discoverPage: {
      tabs: ['全部','平台推文','小红书','大众笔记','时间']
    },
    bloggerCert: {
      fields: { nickname:true, homepageLink:true, likesData:true, fansCount:true, selfQuote:true },
      description: '完成小红书或大众点评博主认证，即可解锁专属优惠和探店任务',
      fansThreshold: 500
    },
    uploadNote: {
      rewardDescription: '每篇有效推文奖励 ¥10-50\n需关联商家店铺\n点赞量越高奖励越多\n审核通过后7个工作日内发放',
      rewardMin: 10,
      rewardMax: 50
    }
  };

  /** 商家核销账户数据 */
  var DEFAULT_MERCHANT_ACCOUNTS = [
    { id:'MA001', merchantId:'M001', username:'laojie_huoguo', password:'******', contactName:'张店长', phone:'138****1234', role:'main', subStores:[{id:'SS001',name:'老街火锅·银泰分店',username:'laojie_yintai',password:'******',status:'active'}], status:'active', createTime:'2026-01-15' },
    { id:'MA002', merchantId:'M002', username:'starbucks_xh', password:'******', contactName:'李经理', phone:'139****5678', role:'main', subStores:[], status:'active', createTime:'2026-02-20' }
  ];

  // ==================== 集合名称映射 ====================
  var COLLECTION_MAP = {
    merchants: 'merchants',
    packages: 'packages',
    orders: 'orders',
    tasks: 'tasks',
    users: 'users',
    certifications: 'certifications',
    noteUploads: 'noteUploads',
    taskApplications: 'taskApplications',
    financialRecords: 'financialRecords',
    merchantApps: 'merchantApps',
    withdrawals: 'withdrawals',
    articles: 'articles',
    platformConfig: 'platformConfig',
    merchantAccounts: 'merchantAccounts'
  };

  // ==================== 内部状态 ====================

  /** BroadcastChannel 实例 */
  var channel = null;

  /** 事件监听器映射 */
  var listeners = {};

  /** 内存中的数据缓存 */
  var dataCache = null;

  // ==================== 工具函数 ====================

  /**
   * 生成唯一ID
   * @param {string} prefix - ID前缀
   * @returns {string} 唯一ID
   */
  function generateId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * 生成订单编号
   * @returns {string} 订单编号，格式 HL + 年月日 + 3位序号
   */
  function generateOrderId() {
    var now = new Date();
    var dateStr = now.getFullYear().toString() +
      ('0' + (now.getMonth() + 1)).slice(-2) +
      ('0' + now.getDate()).slice(-2);
    var orders = _getData().orders || [];
    var todayPrefix = 'HL' + dateStr;
    var todayOrders = orders.filter(function (o) { return o.id.indexOf(todayPrefix) === 0; });
    var seq = todayOrders.length + 1;
    return todayPrefix + ('00' + seq).slice(-3);
  }

  /**
   * 生成核销码（8位大写字母+数字）
   * @returns {string} 核销码
   */
  function generateVerifyCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var code = '';
    for (var i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * 获取当前时间字符串
   * @returns {string} 格式 YYYY-MM-DD HH:mm
   */
  function nowStr() {
    var now = new Date();
    return now.getFullYear() + '-' +
      ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
      ('0' + now.getDate()).slice(-2) + ' ' +
      ('0' + now.getHours()).slice(-2) + ':' +
      ('0' + now.getMinutes()).slice(-2);
  }

  /**
   * 深拷贝对象
   * @param {*} obj - 要拷贝的对象
   * @returns {*} 深拷贝结果
   */
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      // 降级处理
      if (Array.isArray(obj)) {
        return obj.map(function (item) { return deepClone(item); });
      }
      var clone = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          clone[key] = deepClone(obj[key]);
        }
      }
      return clone;
    }
  }

  // ==================== 数据持久化 ====================

  /**
   * 从 localStorage 读取数据
   * @returns {Object} 完整数据对象
   * @private
   */
  function _loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('[HuiLifeDB] 读取 localStorage 失败:', e);
    }
    return null;
  }

  /**
   * 将数据保存到 localStorage
   * @param {Object} data - 完整数据对象
   * @private
   */
  function _saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      dataCache = data;
    } catch (e) {
      console.error('[HuiLifeDB] 写入 localStorage 失败:', e);
    }
  }

  /**
   * 获取当前数据（带缓存）
   * @returns {Object} 完整数据对象
   * @private
   */
  function _getData() {
    if (dataCache) {
      return dataCache;
    }
    var data = _loadData();
    if (data) {
      dataCache = data;
      return data;
    }
    // 数据不存在，使用种子数据初始化
    var seed = _getSeedData();
    _saveData(seed);
    return seed;
  }

  /**
   * 获取种子数据
   * @returns {Object} 种子数据对象
   * @private
   */
  function _getSeedData() {
    return {
      merchants: deepClone(DEFAULT_MERCHANTS),
      packages: deepClone(DEFAULT_PACKAGES),
      orders: deepClone(DEFAULT_ORDERS),
      tasks: deepClone(DEFAULT_TASKS),
      users: deepClone(DEFAULT_USERS),
      certifications: deepClone(DEFAULT_CERTIFICATIONS),
      noteUploads: deepClone(DEFAULT_NOTE_UPLOADS),
      taskApplications: deepClone(DEFAULT_TASK_APPLICATIONS),
      financialRecords: deepClone(DEFAULT_FINANCIAL_RECORDS),
      merchantApps: deepClone(DEFAULT_MERCHANT_APPS),
      withdrawals: deepClone(DEFAULT_WITHDRAWALS),
      articles: deepClone(DEFAULT_ARTICLES),
      platformConfig: deepClone(DEFAULT_PLATFORM_CONFIG),
      merchantAccounts: deepClone(DEFAULT_MERCHANT_ACCOUNTS)
    };
  }

  // ==================== 事件系统 ====================

  /**
   * 触发本地事件监听器
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   * @private
   */
  function _emit(event, data) {
    var cbs = listeners[event];
    if (cbs && cbs.length > 0) {
      for (var i = 0; i < cbs.length; i++) {
        try {
          cbs[i](data);
        } catch (e) {
          console.error('[HuiLifeDB] 事件监听器执行失败 (' + event + '):', e);
        }
      }
    }
  }

  /**
   * 广播变更事件到其他标签页
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   * @private
   */
  function _broadcast(event, data) {
    // 通过 BroadcastChannel 广播
    if (channel) {
      try {
        channel.postMessage({ event: event, data: data });
      } catch (e) {
        console.error('[HuiLifeDB] BroadcastChannel 发送失败:', e);
      }
    }
  }

  /**
   * 通知数据变更（本地 + 远程）
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   * @private
   */
  function _notify(event, data) {
    _emit(event, data);
    _emit('dataChanged', { source: event, detail: data });
    _broadcast(event, data);
  }

  // ==================== 通用 CRUD 操作 ====================

  var HuiLifeDB = {};

  /**
   * 初始化数据层，从 localStorage 加载数据，若不存在则使用种子数据
   * @memberof HuiLifeDB
   */
  HuiLifeDB.init = function () {
    // 初始化 BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined' && !channel) {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = function (e) {
          var msg = e.data;
          if (msg && msg.event) {
            // 收到其他标签页的广播，刷新缓存并触发事件
            dataCache = _loadData();
            _emit(msg.event, msg.data);
            _emit('dataChanged', { source: msg.event, detail: msg.data });
          }
        };
      } catch (e) {
        console.error('[HuiLifeDB] BroadcastChannel 初始化失败:', e);
      }
    }

    // 监听 storage 事件（兼容不支持 BroadcastChannel 的场景）
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY) {
          dataCache = _loadData();
          _emit('dataChanged', { source: 'storage', detail: null });
        }
      });
    }

    // 加载数据
    var existing = _loadData();
    if (!existing) {
      var seed = _getSeedData();
      _saveData(seed);
    } else {
      dataCache = existing;
    }
  };

  /**
   * 获取集合中所有记录
   * @param {string} collection - 集合名称
   * @returns {Array} 记录数组的深拷贝
   * @memberof HuiLifeDB
   */
  HuiLifeDB.getAll = function (collection) {
    if (!COLLECTION_MAP[collection]) {
      console.warn('[HuiLifeDB] 未知集合:', collection);
      return [];
    }
    var data = _getData();
    // platformConfig 是对象而非数组，特殊处理
    if (collection === 'platformConfig') {
      return deepClone(data[collection] || {});
    }
    return deepClone(data[collection] || []);
  };

  /**
   * 根据ID获取单条记录
   * @param {string} collection - 集合名称
   * @param {string} id - 记录ID
   * @returns {Object|null} 记录的深拷贝，未找到返回 null
   * @memberof HuiLifeDB
   */
  HuiLifeDB.getById = function (collection, id) {
    if (!COLLECTION_MAP[collection]) {
      console.warn('[HuiLifeDB] 未知集合:', collection);
      return null;
    }
    var data = _getData();
    var list = data[collection] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        return deepClone(list[i]);
      }
    }
    return null;
  };

  /**
   * 条件查询
   * @param {string} collection - 集合名称
   * @param {Function} filter - 过滤函数，接收记录返回布尔值
   * @returns {Array} 匹配记录数组的深拷贝
   * @memberof HuiLifeDB
   */
  HuiLifeDB.query = function (collection, filter) {
    if (!COLLECTION_MAP[collection]) {
      console.warn('[HuiLifeDB] 未知集合:', collection);
      return [];
    }
    if (typeof filter !== 'function') {
      console.warn('[HuiLifeDB] query 的 filter 参数必须是函数');
      return [];
    }
    var data = _getData();
    var list = data[collection] || [];
    var results = list.filter(filter);
    return deepClone(results);
  };

  /**
   * 添加新记录到集合
   * @param {string} collection - 集合名称
   * @param {Object} record - 要添加的记录（需包含 id 字段）
   * @returns {Object} 添加的记录深拷贝
   * @memberof HuiLifeDB
   */
  HuiLifeDB.add = function (collection, record) {
    if (!COLLECTION_MAP[collection]) {
      console.warn('[HuiLifeDB] 未知集合:', collection);
      return null;
    }
    if (!record || typeof record !== 'object') {
      console.warn('[HuiLifeDB] add 的 record 参数必须是对象');
      return null;
    }
    var data = _getData();
    if (!data[collection]) {
      data[collection] = [];
    }
    var newRecord = deepClone(record);
    data[collection].push(newRecord);
    _saveData(data);
    return deepClone(newRecord);
  };

  /**
   * 更新集合中的记录
   * @param {string} collection - 集合名称
   * @param {string} id - 记录ID
   * @param {Object} updates - 要更新的字段键值对
   * @returns {Object|null} 更新后的记录深拷贝，未找到返回 null
   * @memberof HuiLifeDB
   */
  HuiLifeDB.update = function (collection, id, updates) {
    if (!COLLECTION_MAP[collection]) {
      console.warn('[HuiLifeDB] 未知集合:', collection);
      return null;
    }
    if (!id || !updates || typeof updates !== 'object') {
      console.warn('[HuiLifeDB] update 参数无效');
      return null;
    }
    var data = _getData();
    var list = data[collection] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        for (var key in updates) {
          if (updates.hasOwnProperty(key)) {
            list[i][key] = updates[key];
          }
        }
        _saveData(data);
        return deepClone(list[i]);
      }
    }
    return null;
  };

  /**
   * 删除集合中的记录
   * @param {string} collection - 集合名称
   * @param {string} id - 记录ID
   * @returns {boolean} 是否删除成功
   * @memberof HuiLifeDB
   */
  HuiLifeDB.remove = function (collection, id) {
    if (!COLLECTION_MAP[collection]) {
      console.warn('[HuiLifeDB] 未知集合:', collection);
      return false;
    }
    var data = _getData();
    var list = data[collection] || [];
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        idx = i;
        break;
      }
    }
    if (idx === -1) return false;
    list.splice(idx, 1);
    _saveData(data);
    return true;
  };

  // ==================== 业务 API ====================

  /**
   * 创建订单 - 同时更新套餐库存、生成财务记录
   * @param {Object} orderData - 订单数据（不含自动生成字段）
   * @param {string} orderData.userId - 用户ID
   * @param {string} orderData.userName - 用户名称
   * @param {string} orderData.merchantId - 商户ID
   * @param {string} orderData.packageId - 套餐ID
   * @param {number} orderData.amount - 订单金额
   * @param {string} orderData.type - 订单类型 (bargain/seckill/group)
   * @param {string} [orderData.salesRepId] - 业务员ID
   * @returns {Object} 创建的订单
   * @memberof HuiLifeDB
   */
  HuiLifeDB.createOrder = function (orderData) {
    if (!orderData || !orderData.userId || !orderData.packageId) {
      console.warn('[HuiLifeDB] createOrder 参数不完整');
      return null;
    }

    var data = _getData();

    // 查找套餐
    var pkg = null;
    for (var i = 0; i < data.packages.length; i++) {
      if (data.packages[i].id === orderData.packageId) {
        pkg = data.packages[i];
        break;
      }
    }
    if (!pkg) {
      console.warn('[HuiLifeDB] 套餐不存在:', orderData.packageId);
      return null;
    }
    if (pkg.status !== 'active') {
      console.warn('[HuiLifeDB] 套餐已下架:', orderData.packageId);
      return null;
    }
    if (pkg.stock <= 0) {
      console.warn('[HuiLifeDB] 套餐库存不足:', orderData.packageId);
      return null;
    }

    // 计算有效期
    var now = new Date();
    var expiryDays = pkg.type === 'seckill' ? 7 : 30;
    var expiry = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);
    var expiryStr = expiry.getFullYear() + '-' +
      ('0' + (expiry.getMonth() + 1)).slice(-2) + '-' +
      ('0' + expiry.getDate()).slice(-2);

    var payTimeStr = nowStr();

    // 创建订单
    var order = {
      id: generateOrderId(),
      userId: orderData.userId,
      userName: orderData.userName || '',
      merchantId: orderData.merchantId || pkg.merchantId,
      packageId: orderData.packageId,
      amount: orderData.amount || pkg.currentPrice,
      type: orderData.type || pkg.type,
      status: 'pending_verify',
      payTime: payTimeStr,
      expiryDate: expiryStr,
      verifyTime: null,
      verifyCode: generateVerifyCode(),
      salesRepId: orderData.salesRepId || '',
      createdAt: payTimeStr
    };

    data.orders.push(order);

    // 更新套餐库存和销量
    pkg.stock -= 1;
    pkg.sold += 1;

    // 生成收入财务记录
    var typeLabel = { bargain: '砍价', seckill: '秒杀', group: '拼团' };
    var finIncome = {
      id: generateId('F'),
      type: 'income',
      category: order.type || pkg.type,
      amount: order.amount,
      description: (pkg.name || '') + '-' + (typeLabel[order.type] || '成交'),
      orderId: order.id,
      time: order.payTime
    };
    data.financialRecords.push(finIncome);

    // 生成业务员分佣财务记录
    if (pkg.salesRepCommission && pkg.salesRepCommission > 0) {
      var finCommission = {
        id: generateId('F'),
        type: 'expense',
        category: 'sales_commission',
        amount: pkg.salesRepCommission,
        description: '业务员分佣-' + (pkg.name || ''),
        orderId: order.id,
        time: order.payTime
      };
      data.financialRecords.push(finCommission);
    }

    // 生成商家结算财务记录
    if (pkg.merchantIncome && pkg.merchantIncome > 0) {
      var finSettlement = {
        id: generateId('F'),
        type: 'expense',
        category: 'merchant_settlement',
        amount: pkg.merchantIncome,
        description: '商家结算-' + (orderData.merchantName || pkg.merchantId),
        orderId: order.id,
        time: order.payTime
      };
      data.financialRecords.push(finSettlement);
    }

    _saveData(data);
    _notify('orderCreated', deepClone(order));
    return deepClone(order);
  };

  /**
   * 商户核销订单
   * @param {string} orderId - 订单ID
   * @returns {Object|null} 核销后的订单，失败返回 null
   * @memberof HuiLifeDB
   */
  HuiLifeDB.verifyOrder = function (orderId) {
    if (!orderId) {
      console.warn('[HuiLifeDB] verifyOrder 缺少 orderId');
      return null;
    }
    var data = _getData();
    var order = null;
    for (var i = 0; i < data.orders.length; i++) {
      if (data.orders[i].id === orderId) {
        order = data.orders[i];
        break;
      }
    }
    if (!order) {
      console.warn('[HuiLifeDB] 订单不存在:', orderId);
      return null;
    }
    if (order.status !== 'pending_verify') {
      console.warn('[HuiLifeDB] 订单状态不可核销:', order.status);
      return null;
    }

    order.status = 'verified';
    order.verifyTime = nowStr();

    _saveData(data);
    _notify('orderVerified', deepClone(order));
    return deepClone(order);
  };

  /**
   * C端提交达人认证
   * @param {Object} certData - 认证数据
   * @param {string} certData.userId - 用户ID
   * @param {string} certData.userName - 用户名称
   * @param {string} certData.platform - 平台名称
   * @param {string} certData.nickname - 平台昵称
   * @param {number} certData.fansCount - 粉丝数
   * @param {string} certData.link - 主页链接
   * @returns {Object} 创建的认证记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.submitCertification = function (certData) {
    if (!certData || !certData.userId) {
      console.warn('[HuiLifeDB] submitCertification 参数不完整');
      return null;
    }
    var data = _getData();
    var cert = {
      id: generateId('C'),
      userId: certData.userId,
      userName: certData.userName || '',
      platform: certData.platform || '',
      nickname: certData.nickname || '',
      fansCount: certData.fansCount || 0,
      link: certData.link || '',
      status: 'pending',
      submitTime: nowStr()
    };
    data.certifications.push(cert);
    _saveData(data);
    _notify('certificationSubmitted', deepClone(cert));
    return deepClone(cert);
  };

  /**
   * 管理员通过认证
   * @param {string} id - 认证记录ID
   * @returns {Object|null} 更新后的认证记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.approveCertification = function (id) {
    if (!id) {
      console.warn('[HuiLifeDB] approveCertification 缺少 id');
      return null;
    }
    var data = _getData();
    var cert = null;
    for (var i = 0; i < data.certifications.length; i++) {
      if (data.certifications[i].id === id) {
        cert = data.certifications[i];
        break;
      }
    }
    if (!cert || cert.status !== 'pending') {
      console.warn('[HuiLifeDB] 认证记录不存在或状态不可审批:', id);
      return null;
    }

    cert.status = 'approved';

    // 同步更新用户信息
    for (var j = 0; j < data.users.length; j++) {
      if (data.users[j].id === cert.userId) {
        data.users[j].isCertified = true;
        data.users[j].isBlogger = true;
        data.users[j].fansCount = cert.fansCount;
        break;
      }
    }

    _saveData(data);
    _notify('certificationApproved', deepClone(cert));
    return deepClone(cert);
  };

  /**
   * 管理员拒绝认证
   * @param {string} id - 认证记录ID
   * @returns {Object|null} 更新后的认证记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.rejectCertification = function (id) {
    if (!id) {
      console.warn('[HuiLifeDB] rejectCertification 缺少 id');
      return null;
    }
    var data = _getData();
    var cert = null;
    for (var i = 0; i < data.certifications.length; i++) {
      if (data.certifications[i].id === id) {
        cert = data.certifications[i];
        break;
      }
    }
    if (!cert || cert.status !== 'pending') {
      console.warn('[HuiLifeDB] 认证记录不存在或状态不可审批:', id);
      return null;
    }

    cert.status = 'rejected';

    _saveData(data);
    _notify('certificationApproved', deepClone(cert));
    return deepClone(cert);
  };

  /**
   * C端上传推文
   * @param {Object} noteData - 推文数据
   * @param {string} noteData.userId - 用户ID
   * @param {string} noteData.userName - 用户名称
   * @param {string} noteData.merchantId - 商户ID
   * @param {string} noteData.packageName - 套餐名称
   * @param {string} noteData.link - 推文链接
   * @param {string} [noteData.type] - 类型 (seckill_callback/upload_reward)
   * @returns {Object} 创建的推文记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.submitNote = function (noteData) {
    if (!noteData || !noteData.userId) {
      console.warn('[HuiLifeDB] submitNote 参数不完整');
      return null;
    }
    var data = _getData();
    var note = {
      id: generateId('N'),
      userId: noteData.userId,
      userName: noteData.userName || '',
      merchantId: noteData.merchantId || '',
      packageName: noteData.packageName || '',
      link: noteData.link || '',
      likes: noteData.likes || 0,
      comments: noteData.comments || 0,
      status: 'pending',
      submitTime: nowStr(),
      type: noteData.type || 'upload_reward'
    };
    data.noteUploads.push(note);
    _saveData(data);
    _notify('noteSubmitted', deepClone(note));
    return deepClone(note);
  };

  /**
   * 管理员通过推文审核
   * @param {string} id - 推文记录ID
   * @returns {Object|null} 更新后的推文记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.approveNote = function (id) {
    if (!id) {
      console.warn('[HuiLifeDB] approveNote 缺少 id');
      return null;
    }
    var data = _getData();
    var note = null;
    for (var i = 0; i < data.noteUploads.length; i++) {
      if (data.noteUploads[i].id === id) {
        note = data.noteUploads[i];
        break;
      }
    }
    if (!note || note.status !== 'pending') {
      console.warn('[HuiLifeDB] 推文记录不存在或状态不可审批:', id);
      return null;
    }

    note.status = 'approved';

    // 生成推文奖励财务记录
    var reward = note.type === 'seckill_callback' ? 5 : 10;
    var finReward = {
      id: generateId('F'),
      type: 'expense',
      category: 'note_reward',
      amount: reward,
      description: '推文奖励-' + (note.packageName || note.userName),
      noteId: note.id,
      time: nowStr()
    };
    data.financialRecords.push(finReward);

    _saveData(data);
    _notify('noteApproved', deepClone(note));
    return deepClone(note);
  };

  /**
   * 管理员拒绝推文
   * @param {string} id - 推文记录ID
   * @returns {Object|null} 更新后的推文记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.rejectNote = function (id) {
    if (!id) {
      console.warn('[HuiLifeDB] rejectNote 缺少 id');
      return null;
    }
    var data = _getData();
    var note = null;
    for (var i = 0; i < data.noteUploads.length; i++) {
      if (data.noteUploads[i].id === id) {
        note = data.noteUploads[i];
        break;
      }
    }
    if (!note || note.status !== 'pending') {
      console.warn('[HuiLifeDB] 推文记录不存在或状态不可审批:', id);
      return null;
    }

    note.status = 'rejected';

    _saveData(data);
    _notify('noteApproved', deepClone(note));
    return deepClone(note);
  };

  /**
   * 管理员创建探店任务
   * @param {Object} taskData - 任务数据
   * @param {string} taskData.name - 任务名称
   * @param {string} taskData.merchantId - 商户ID
   * @param {string} taskData.type - 任务类型
   * @param {number} taskData.commission - 佣金
   * @param {string} taskData.deadline - 截止日期
   * @param {number} taskData.minFans - 最低粉丝数
   * @param {number} taskData.quota - 名额
   * @param {string} taskData.requirements - 任务要求
   * @returns {Object} 创建的任务
   * @memberof HuiLifeDB
   */
  HuiLifeDB.createTask = function (taskData) {
    if (!taskData || !taskData.name) {
      console.warn('[HuiLifeDB] createTask 参数不完整');
      return null;
    }
    var data = _getData();
    var task = {
      id: generateId('T'),
      name: taskData.name,
      merchantId: taskData.merchantId || '',
      type: taskData.type || '图文笔记',
      commission: taskData.commission || 0,
      deadline: taskData.deadline || '',
      minFans: taskData.minFans || 500,
      quota: taskData.quota || 5,
      applied: 0,
      completed: 0,
      status: 'active',
      requirements: taskData.requirements || ''
    };
    data.tasks.push(task);
    _saveData(data);
    _notify('taskCreated', deepClone(task));
    return deepClone(task);
  };

  /**
   * C端申请探店任务
   * @param {string} taskId - 任务ID
   * @param {string} userId - 用户ID
   * @returns {Object|null} 创建的任务申请记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.applyTask = function (taskId, userId) {
    if (!taskId || !userId) {
      console.warn('[HuiLifeDB] applyTask 参数不完整');
      return null;
    }
    var data = _getData();

    // 查找任务
    var task = null;
    for (var i = 0; i < data.tasks.length; i++) {
      if (data.tasks[i].id === taskId) {
        task = data.tasks[i];
        break;
      }
    }
    if (!task) {
      console.warn('[HuiLifeDB] 任务不存在:', taskId);
      return null;
    }
    if (task.status !== 'active') {
      console.warn('[HuiLifeDB] 任务状态不可申请:', task.status);
      return null;
    }
    if (task.applied >= task.quota) {
      console.warn('[HuiLifeDB] 任务名额已满');
      return null;
    }

    // 查找用户信息
    var user = null;
    for (var j = 0; j < data.users.length; j++) {
      if (data.users[j].id === userId) {
        user = data.users[j];
        break;
      }
    }

    // 检查是否已申请
    for (var k = 0; k < data.taskApplications.length; k++) {
      if (data.taskApplications[k].taskId === taskId && data.taskApplications[k].userId === userId) {
        console.warn('[HuiLifeDB] 用户已申请过该任务');
        return null;
      }
    }

    var application = {
      id: generateId('TA'),
      taskId: taskId,
      userId: userId,
      userName: user ? user.name : '',
      fansCount: user ? user.fansCount : 0,
      status: 'pending',
      applyTime: nowStr()
    };
    data.taskApplications.push(application);

    // 更新任务申请数
    task.applied += 1;

    _saveData(data);
    _notify('taskApplied', deepClone(application));
    return deepClone(application);
  };

  /**
   * 管理员通过任务申请
   * @param {string} appId - 任务申请ID
   * @returns {Object|null} 更新后的申请记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.approveTaskApp = function (appId) {
    if (!appId) {
      console.warn('[HuiLifeDB] approveTaskApp 缺少 appId');
      return null;
    }
    var data = _getData();
    var app = null;
    for (var i = 0; i < data.taskApplications.length; i++) {
      if (data.taskApplications[i].id === appId) {
        app = data.taskApplications[i];
        break;
      }
    }
    if (!app || app.status !== 'pending') {
      console.warn('[HuiLifeDB] 任务申请不存在或状态不可审批:', appId);
      return null;
    }

    app.status = 'approved';

    _saveData(data);
    _notify('taskApplied', deepClone(app));
    return deepClone(app);
  };

  /**
   * 管理员拒绝任务申请
   * @param {string} appId - 任务申请ID
   * @returns {Object|null} 更新后的申请记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.rejectTaskApp = function (appId) {
    if (!appId) {
      console.warn('[HuiLifeDB] rejectTaskApp 缺少 appId');
      return null;
    }
    var data = _getData();
    var app = null;
    for (var i = 0; i < data.taskApplications.length; i++) {
      if (data.taskApplications[i].id === appId) {
        app = data.taskApplications[i];
        break;
      }
    }
    if (!app || app.status !== 'pending') {
      console.warn('[HuiLifeDB] 任务申请不存在或状态不可审批:', appId);
      return null;
    }

    app.status = 'rejected';

    // 更新任务申请数（回退）
    for (var j = 0; j < data.tasks.length; j++) {
      if (data.tasks[j].id === app.taskId) {
        data.tasks[j].applied = Math.max(0, data.tasks[j].applied - 1);
        break;
      }
    }

    _saveData(data);
    _notify('taskApplied', deepClone(app));
    return deepClone(app);
  };

  /**
   * C端提交任务回传
   * @param {string} appId - 任务申请ID
   * @param {Object} returnData - 回传数据
   * @param {string} returnData.link - 推文链接
   * @param {string} [returnData.note] - 备注
   * @returns {Object|null} 更新后的申请记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.submitTaskReturn = function (appId, returnData) {
    if (!appId) {
      console.warn('[HuiLifeDB] submitTaskReturn 缺少 appId');
      return null;
    }
    var data = _getData();
    var app = null;
    for (var i = 0; i < data.taskApplications.length; i++) {
      if (data.taskApplications[i].id === appId) {
        app = data.taskApplications[i];
        break;
      }
    }
    if (!app) {
      console.warn('[HuiLifeDB] 任务申请不存在:', appId);
      return null;
    }
    if (app.status !== 'approved') {
      console.warn('[HuiLifeDB] 任务申请尚未通过，无法回传');
      return null;
    }

    app.status = 'return_submitted';
    app.returnLink = (returnData && returnData.link) || '';
    app.returnNote = (returnData && returnData.note) || '';
    app.returnTime = nowStr();

    _saveData(data);
    _notify('taskReturnSubmitted', deepClone(app));
    return deepClone(app);
  };

  /**
   * 管理员通过任务回传，同时生成佣金财务记录
   * @param {string} appId - 任务申请ID
   * @returns {Object|null} 更新后的申请记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.approveTaskReturn = function (appId) {
    if (!appId) {
      console.warn('[HuiLifeDB] approveTaskReturn 缺少 appId');
      return null;
    }
    var data = _getData();
    var app = null;
    for (var i = 0; i < data.taskApplications.length; i++) {
      if (data.taskApplications[i].id === appId) {
        app = data.taskApplications[i];
        break;
      }
    }
    if (!app || app.status !== 'return_submitted') {
      console.warn('[HuiLifeDB] 任务申请不存在或状态不可审批:', appId);
      return null;
    }

    app.status = 'completed';

    // 查找任务获取佣金
    var task = null;
    for (var j = 0; j < data.tasks.length; j++) {
      if (data.tasks[j].id === app.taskId) {
        task = data.tasks[j];
        break;
      }
    }

    // 更新任务完成数
    if (task) {
      task.completed += 1;

      // 生成佣金财务记录
      var finCommission = {
        id: generateId('F'),
        type: 'expense',
        category: 'task_commission',
        amount: task.commission,
        description: '探店任务佣金-' + (task.name || ''),
        taskId: task.id,
        time: nowStr()
      };
      data.financialRecords.push(finCommission);
    }

    _saveData(data);
    _notify('taskReturnApproved', deepClone(app));
    return deepClone(app);
  };

  /**
   * 管理员创建套餐
   * @param {Object} pkgData - 套餐数据
   * @returns {Object} 创建的套餐
   * @memberof HuiLifeDB
   */
  HuiLifeDB.createPackage = function (pkgData) {
    if (!pkgData || !pkgData.name || !pkgData.merchantId) {
      console.warn('[HuiLifeDB] createPackage 参数不完整');
      return null;
    }
    var data = _getData();
    var pkg = deepClone(pkgData);
    pkg.id = generateId('P');
    pkg.sold = pkg.sold || 0;
    pkg.status = pkg.status || 'active';
    pkg.createdAt = pkg.createdAt || nowStr();
    // 秒杀和拼团套餐默认添加二级分销字段
    if (pkg.type === 'seckill' || pkg.type === 'group') {
      pkg.level1Commission = pkg.level1Commission || 0;
      pkg.level2Commission = pkg.level2Commission || 0;
      pkg.secondaryCommissionEnabled = pkg.secondaryCommissionEnabled || false;
    }
    data.packages.push(pkg);
    _saveData(data);
    _notify('packageCreated', deepClone(pkg));
    return deepClone(pkg);
  };

  /**
   * 管理员更新套餐
   * @param {string} id - 套餐ID
   * @param {Object} pkgData - 要更新的字段
   * @returns {Object|null} 更新后的套餐
   * @memberof HuiLifeDB
   */
  HuiLifeDB.updatePackage = function (id, pkgData) {
    if (!id || !pkgData) {
      console.warn('[HuiLifeDB] updatePackage 参数不完整');
      return null;
    }
    var data = _getData();
    var pkg = null;
    for (var i = 0; i < data.packages.length; i++) {
      if (data.packages[i].id === id) {
        pkg = data.packages[i];
        break;
      }
    }
    if (!pkg) {
      console.warn('[HuiLifeDB] 套餐不存在:', id);
      return null;
    }

    for (var key in pkgData) {
      if (pkgData.hasOwnProperty(key) && key !== 'id') {
        pkg[key] = pkgData[key];
      }
    }

    _saveData(data);
    _notify('packageUpdated', deepClone(pkg));
    return deepClone(pkg);
  };

  /**
   * 管理员切换套餐上下架状态
   * @param {string} id - 套餐ID
   * @returns {Object|null} 更新后的套餐
   * @memberof HuiLifeDB
   */
  HuiLifeDB.togglePackageStatus = function (id) {
    if (!id) {
      console.warn('[HuiLifeDB] togglePackageStatus 缺少 id');
      return null;
    }
    var data = _getData();
    var pkg = null;
    for (var i = 0; i < data.packages.length; i++) {
      if (data.packages[i].id === id) {
        pkg = data.packages[i];
        break;
      }
    }
    if (!pkg) {
      console.warn('[HuiLifeDB] 套餐不存在:', id);
      return null;
    }

    pkg.status = pkg.status === 'active' ? 'inactive' : 'active';

    _saveData(data);
    _notify('packageUpdated', deepClone(pkg));
    return deepClone(pkg);
  };

  /**
   * 切换套餐二级分销开关（仅限秒杀和拼团套餐）
   * @param {string} packageId - 套餐ID
   * @param {boolean} enabled - 是否启用二级分销
   * @returns {Object|null} 更新后的套餐
   * @memberof HuiLifeDB
   */
  HuiLifeDB.toggleSecondaryCommission = function (packageId, enabled) {
    if (!packageId) {
      console.warn('[HuiLifeDB] toggleSecondaryCommission 缺少 packageId');
      return null;
    }
    var data = _getData();
    var pkg = null;
    for (var i = 0; i < data.packages.length; i++) {
      if (data.packages[i].id === packageId) {
        pkg = data.packages[i];
        break;
      }
    }
    if (!pkg) {
      console.warn('[HuiLifeDB] 套餐不存在:', packageId);
      return null;
    }
    if (pkg.type !== 'seckill' && pkg.type !== 'group') {
      console.warn('[HuiLifeDB] 二级分销仅支持秒杀和拼团套餐，当前类型:', pkg.type);
      return null;
    }

    pkg.secondaryCommissionEnabled = !!enabled;

    _saveData(data);
    _notify('packageUpdated', deepClone(pkg));
    return deepClone(pkg);
  };

  /**
   * C端提交商户入驻申请
   * @param {Object} appData - 申请数据
   * @param {string} appData.name - 商户名称
   * @param {string} appData.contact - 联系人
   * @param {string} appData.phone - 联系电话
   * @param {string} appData.city - 城市
   * @param {Array} appData.categories - 经营品类
   * @returns {Object} 创建的申请记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.submitMerchantApp = function (appData) {
    if (!appData || !appData.name) {
      console.warn('[HuiLifeDB] submitMerchantApp 参数不完整');
      return null;
    }
    var data = _getData();
    var app = {
      id: generateId('MA'),
      name: appData.name,
      contact: appData.contact || '',
      phone: appData.phone || '',
      city: appData.city || '',
      categories: appData.categories || [],
      status: 'pending',
      submitTime: nowStr()
    };
    data.merchantApps.push(app);
    _saveData(data);
    _notify('merchantAppSubmitted', deepClone(app));
    return deepClone(app);
  };

  /**
   * 管理员通过商户入驻申请，同时创建商户记录和商家核销账户
   * @param {string} id - 申请ID
   * @returns {Object|null} 创建的商户记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.approveMerchantApp = function (id) {
    if (!id) {
      console.warn('[HuiLifeDB] approveMerchantApp 缺少 id');
      return null;
    }
    var data = _getData();
    var app = null;
    for (var i = 0; i < data.merchantApps.length; i++) {
      if (data.merchantApps[i].id === id) {
        app = data.merchantApps[i];
        break;
      }
    }
    if (!app || app.status !== 'pending') {
      console.warn('[HuiLifeDB] 商户申请不存在或状态不可审批:', id);
      return null;
    }

    app.status = 'approved';

    // 创建商户记录
    var merchant = {
      id: generateId('M'),
      name: app.name,
      rating: 0,
      categories: app.categories || [],
      city: app.city,
      distance: '',
      address: '',
      phone: app.phone,
      hours: '',
      status: 'active',
      salesRep: '',
      description: '',
      monthlySales: 0,
      verifyAccounts: 1
    };
    data.merchants.push(merchant);

    // 自动创建商家核销账户
    var accountData = {
      merchantId: merchant.id,
      contactName: app.contact,
      phone: app.phone
    };
    var newAccount = HuiLifeDB.createMerchantAccount(accountData);

    _saveData(data);
    _notify('merchantAppApproved', { app: deepClone(app), merchant: deepClone(merchant), account: newAccount ? deepClone(newAccount) : null });
    return deepClone(merchant);
  };

  /**
   * 管理员拒绝商户入驻申请
   * @param {string} id - 申请ID
   * @returns {Object|null} 更新后的申请记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.rejectMerchantApp = function (id) {
    if (!id) {
      console.warn('[HuiLifeDB] rejectMerchantApp 缺少 id');
      return null;
    }
    var data = _getData();
    var app = null;
    for (var i = 0; i < data.merchantApps.length; i++) {
      if (data.merchantApps[i].id === id) {
        app = data.merchantApps[i];
        break;
      }
    }
    if (!app || app.status !== 'pending') {
      console.warn('[HuiLifeDB] 商户申请不存在或状态不可审批:', id);
      return null;
    }

    app.status = 'rejected';

    _saveData(data);
    _notify('merchantAppApproved', deepClone(app));
    return deepClone(app);
  };

  /**
   * 管理员延长订单有效期
   * @param {string} orderId - 订单ID
   * @param {string} newDate - 新的有效期 (YYYY-MM-DD)
   * @returns {Object|null} 更新后的订单
   * @memberof HuiLifeDB
   */
  HuiLifeDB.extendOrderExpiry = function (orderId, newDate) {
    if (!orderId || !newDate) {
      console.warn('[HuiLifeDB] extendOrderExpiry 参数不完整');
      return null;
    }
    var data = _getData();
    var order = null;
    for (var i = 0; i < data.orders.length; i++) {
      if (data.orders[i].id === orderId) {
        order = data.orders[i];
        break;
      }
    }
    if (!order) {
      console.warn('[HuiLifeDB] 订单不存在:', orderId);
      return null;
    }

    order.expiryDate = newDate;

    _saveData(data);
    _notify('dataChanged', { source: 'extendOrderExpiry', orderId: orderId, newDate: newDate });
    return deepClone(order);
  };

  /**
   * 商户/业务员申请提现
   * @param {Object} withdrawData - 提现数据
   * @param {string} withdrawData.applicantId - 申请人ID
   * @param {string} withdrawData.applicantName - 申请人名称
   * @param {string} withdrawData.applicantType - 申请人类型 (merchant/salesRep)
   * @param {number} withdrawData.amount - 提现金额
   * @param {string} [withdrawData.bankInfo] - 银行信息
   * @returns {Object} 创建的提现记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.requestWithdrawal = function (withdrawData) {
    if (!withdrawData || !withdrawData.applicantId || !withdrawData.amount) {
      console.warn('[HuiLifeDB] requestWithdrawal 参数不完整');
      return null;
    }
    var data = _getData();
    var withdrawal = {
      id: generateId('W'),
      applicantId: withdrawData.applicantId,
      applicantName: withdrawData.applicantName || '',
      applicantType: withdrawData.applicantType || 'merchant',
      amount: withdrawData.amount,
      bankInfo: withdrawData.bankInfo || '',
      status: 'pending',
      requestTime: nowStr(),
      processTime: null
    };
    data.withdrawals.push(withdrawal);
    _saveData(data);
    _notify('withdrawalRequested', deepClone(withdrawal));
    return deepClone(withdrawal);
  };

  /**
   * 管理员通过提现申请
   * @param {string} id - 提现记录ID
   * @returns {Object|null} 更新后的提现记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.approveWithdrawal = function (id) {
    if (!id) {
      console.warn('[HuiLifeDB] approveWithdrawal 缺少 id');
      return null;
    }
    var data = _getData();
    var withdrawal = null;
    for (var i = 0; i < data.withdrawals.length; i++) {
      if (data.withdrawals[i].id === id) {
        withdrawal = data.withdrawals[i];
        break;
      }
    }
    if (!withdrawal || withdrawal.status !== 'pending') {
      console.warn('[HuiLifeDB] 提现记录不存在或状态不可审批:', id);
      return null;
    }

    withdrawal.status = 'approved';
    withdrawal.processTime = nowStr();

    // 生成提现财务记录
    var finWithdrawal = {
      id: generateId('F'),
      type: 'expense',
      category: 'withdrawal',
      amount: withdrawal.amount,
      description: '提现-' + (withdrawal.applicantName || withdrawal.applicantId),
      withdrawalId: withdrawal.id,
      time: nowStr()
    };
    data.financialRecords.push(finWithdrawal);

    _saveData(data);
    _notify('withdrawalApproved', deepClone(withdrawal));
    return deepClone(withdrawal);
  };

  /**
   * 管理员拒绝提现申请
   * @param {string} id - 提现记录ID
   * @returns {Object|null} 更新后的提现记录
   * @memberof HuiLifeDB
   */
  HuiLifeDB.rejectWithdrawal = function (id) {
    if (!id) {
      console.warn('[HuiLifeDB] rejectWithdrawal 缺少 id');
      return null;
    }
    var data = _getData();
    var withdrawal = null;
    for (var i = 0; i < data.withdrawals.length; i++) {
      if (data.withdrawals[i].id === id) {
        withdrawal = data.withdrawals[i];
        break;
      }
    }
    if (!withdrawal || withdrawal.status !== 'pending') {
      console.warn('[HuiLifeDB] 提现记录不存在或状态不可审批:', id);
      return null;
    }

    withdrawal.status = 'rejected';
    withdrawal.processTime = nowStr();

    _saveData(data);
    _notify('withdrawalApproved', deepClone(withdrawal));
    return deepClone(withdrawal);
  };

  // ==================== 推文管理 API ====================

  /**
   * 管理员创建推文
   * @param {Object} data - 推文数据
   * @param {string} data.title - 推文标题
   * @param {string} data.content - 推文内容
   * @param {string} [data.author] - 作者
   * @param {string} [data.authorAvatar] - 作者头像
   * @param {string} [data.coverImage] - 封面图
   * @param {Array} [data.images] - 图片列表
   * @param {string} [data.relatedMerchantId] - 关联商户ID
   * @param {string} [data.relatedPackageId] - 关联套餐ID
   * @param {Array} [data.tags] - 标签
   * @param {string} [data.type] - 类型 (platform)
   * @returns {Object} 创建的推文
   * @memberof HuiLifeDB
   */
  HuiLifeDB.createArticle = function (data) {
    if (!data || !data.title) {
      console.warn('[HuiLifeDB] createArticle 参数不完整');
      return null;
    }
    var db = _getData();
    var article = {
      id: generateId('A'),
      title: data.title,
      content: data.content || '',
      author: data.author || '惠生活官方',
      authorAvatar: data.authorAvatar || '惠',
      coverImage: data.coverImage || '',
      images: data.images || [],
      likes: 0,
      comments: 0,
      publishTime: null,
      status: 'draft',
      relatedMerchantId: data.relatedMerchantId || '',
      relatedPackageId: data.relatedPackageId || '',
      tags: data.tags || [],
      type: data.type || 'platform'
    };
    db.articles.push(article);
    _saveData(db);
    _notify('articleCreated', deepClone(article));
    return deepClone(article);
  };

  /**
   * 管理员更新推文
   * @param {string} id - 推文ID
   * @param {Object} data - 要更新的字段
   * @returns {Object|null} 更新后的推文
   * @memberof HuiLifeDB
   */
  HuiLifeDB.updateArticle = function (id, data) {
    if (!id || !data) {
      console.warn('[HuiLifeDB] updateArticle 参数不完整');
      return null;
    }
    var db = _getData();
    var article = null;
    for (var i = 0; i < db.articles.length; i++) {
      if (db.articles[i].id === id) {
        article = db.articles[i];
        break;
      }
    }
    if (!article) {
      console.warn('[HuiLifeDB] 推文不存在:', id);
      return null;
    }

    for (var key in data) {
      if (data.hasOwnProperty(key) && key !== 'id') {
        article[key] = data[key];
      }
    }

    _saveData(db);
    _notify('articleUpdated', deepClone(article));
    return deepClone(article);
  };

  /**
   * 管理员发布推文（C端发现页可见）
   * @param {string} id - 推文ID
   * @returns {Object|null} 更新后的推文
   * @memberof HuiLifeDB
   */
  HuiLifeDB.publishArticle = function (id) {
    if (!id) {
      console.warn('[HuiLifeDB] publishArticle 缺少 id');
      return null;
    }
    var db = _getData();
    var article = null;
    for (var i = 0; i < db.articles.length; i++) {
      if (db.articles[i].id === id) {
        article = db.articles[i];
        break;
      }
    }
    if (!article) {
      console.warn('[HuiLifeDB] 推文不存在:', id);
      return null;
    }

    article.status = 'published';
    article.publishTime = nowStr();

    _saveData(db);
    _notify('articlePublished', deepClone(article));
    return deepClone(article);
  };

  /**
   * 管理员取消发布推文
   * @param {string} id - 推文ID
   * @returns {Object|null} 更新后的推文
   * @memberof HuiLifeDB
   */
  HuiLifeDB.unpublishArticle = function (id) {
    if (!id) {
      console.warn('[HuiLifeDB] unpublishArticle 缺少 id');
      return null;
    }
    var db = _getData();
    var article = null;
    for (var i = 0; i < db.articles.length; i++) {
      if (db.articles[i].id === id) {
        article = db.articles[i];
        break;
      }
    }
    if (!article) {
      console.warn('[HuiLifeDB] 推文不存在:', id);
      return null;
    }

    article.status = 'draft';

    _saveData(db);
    _notify('articleUnpublished', deepClone(article));
    return deepClone(article);
  };

  // ==================== 平台配置 API ====================

  /**
   * 获取平台配置
   * @returns {Object} 平台配置对象
   * @memberof HuiLifeDB
   */
  HuiLifeDB.getPlatformConfig = function () {
    var data = _getData();
    return deepClone(data.platformConfig || {});
  };

  /**
   * 更新平台配置
   * @param {Object} data - 要更新的配置字段
   * @returns {Object} 更新后的完整配置
   * @memberof HuiLifeDB
   */
  HuiLifeDB.updatePlatformConfig = function (data) {
    if (!data || typeof data !== 'object') {
      console.warn('[HuiLifeDB] updatePlatformConfig 参数无效');
      return null;
    }
    var db = _getData();
    if (!db.platformConfig) {
      db.platformConfig = deepClone(DEFAULT_PLATFORM_CONFIG);
    }
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        db.platformConfig[key] = data[key];
      }
    }
    _saveData(db);
    _notify('configUpdated', deepClone(db.platformConfig));
    return deepClone(db.platformConfig);
  };

  // ==================== 商家核销账户 API ====================

  /**
   * 创建商家核销账户
   * @param {Object} data - 账户数据
   * @param {string} data.merchantId - 商户ID
   * @param {string} [data.username] - 登录用户名
   * @param {string} [data.password] - 登录密码
   * @param {string} [data.contactName] - 联系人姓名
   * @param {string} [data.phone] - 联系电话
   * @param {string} [data.role] - 角色 (main/sub)
   * @param {Array} [data.subStores] - 子门店列表
   * @returns {Object} 创建的账户
   * @memberof HuiLifeDB
   */
  HuiLifeDB.createMerchantAccount = function (data) {
    if (!data || !data.merchantId) {
      console.warn('[HuiLifeDB] createMerchantAccount 参数不完整');
      return null;
    }
    var db = _getData();
    var account = {
      id: generateId('MA'),
      merchantId: data.merchantId,
      username: data.username || '',
      password: data.password || '******',
      contactName: data.contactName || '',
      phone: data.phone || '',
      role: data.role || 'main',
      subStores: data.subStores || [],
      status: 'active',
      createTime: nowStr()
    };
    db.merchantAccounts.push(account);
    _saveData(db);
    _notify('merchantAccountCreated', deepClone(account));
    return deepClone(account);
  };

  /**
   * 更新商家核销账户
   * @param {string} id - 账户ID
   * @param {Object} data - 要更新的字段
   * @returns {Object|null} 更新后的账户
   * @memberof HuiLifeDB
   */
  HuiLifeDB.updateMerchantAccount = function (id, data) {
    if (!id || !data) {
      console.warn('[HuiLifeDB] updateMerchantAccount 参数不完整');
      return null;
    }
    var db = _getData();
    var account = null;
    for (var i = 0; i < db.merchantAccounts.length; i++) {
      if (db.merchantAccounts[i].id === id) {
        account = db.merchantAccounts[i];
        break;
      }
    }
    if (!account) {
      console.warn('[HuiLifeDB] 商家账户不存在:', id);
      return null;
    }

    for (var key in data) {
      if (data.hasOwnProperty(key) && key !== 'id') {
        account[key] = data[key];
      }
    }

    _saveData(db);
    _notify('merchantAccountUpdated', deepClone(account));
    return deepClone(account);
  };

  /**
   * 根据商户ID获取核销账户
   * @param {string} merchantId - 商户ID
   * @returns {Object|null} 商家账户
   * @memberof HuiLifeDB
   */
  HuiLifeDB.getMerchantAccount = function (merchantId) {
    if (!merchantId) {
      console.warn('[HuiLifeDB] getMerchantAccount 缺少 merchantId');
      return null;
    }
    var data = _getData();
    var list = data.merchantAccounts || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].merchantId === merchantId) {
        return deepClone(list[i]);
      }
    }
    return null;
  };

  // ==================== 统计 API ====================

  /**
   * 获取管理后台仪表盘统计数据
   * @returns {Object} 统计数据
   * @memberof HuiLifeDB
   */
  HuiLifeDB.getStats = function () {
    var data = _getData();
    var orders = data.orders || [];
    var financialRecords = data.financialRecords || [];
    var merchants = data.merchants || [];
    var packages = data.packages || [];
    var users = data.users || [];
    var certifications = data.certifications || [];
    var noteUploads = data.noteUploads || [];
    var merchantApps = data.merchantApps || [];
    var withdrawals = data.withdrawals || [];
    var articles = data.articles || [];

    // 计算总收入
    var totalIncome = 0;
    var totalExpense = 0;
    for (var i = 0; i < financialRecords.length; i++) {
      if (financialRecords[i].type === 'income') {
        totalIncome += financialRecords[i].amount;
      } else {
        totalExpense += financialRecords[i].amount;
      }
    }

    // 订单状态统计
    var orderStats = { pending_verify: 0, verified: 0, expired: 0, refunded: 0 };
    for (var j = 0; j < orders.length; j++) {
      if (orderStats.hasOwnProperty(orders[j].status)) {
        orderStats[orders[j].status]++;
      }
    }

    // 待审核统计
    var pendingCerts = certifications.filter(function (c) { return c.status === 'pending'; }).length;
    var pendingNotes = noteUploads.filter(function (n) { return n.status === 'pending'; }).length;
    var pendingMerchantApps = merchantApps.filter(function (m) { return m.status === 'pending'; }).length;
    var pendingWithdrawals = withdrawals.filter(function (w) { return w.status === 'pending'; }).length;

    // 今日订单
    var todayStr = new Date().getFullYear() + '-' +
      ('0' + (new Date().getMonth() + 1)).slice(-2) + '-' +
      ('0' + new Date().getDate()).slice(-2);
    var todayOrders = orders.filter(function (o) { return o.payTime && o.payTime.indexOf(todayStr) === 0; });
    var todayIncome = 0;
    for (var k = 0; k < financialRecords.length; k++) {
      if (financialRecords[k].type === 'income' && financialRecords[k].time && financialRecords[k].time.indexOf(todayStr) === 0) {
        todayIncome += financialRecords[k].amount;
      }
    }

    return {
      totalMerchants: merchants.filter(function (m) { return m.status === 'active'; }).length,
      totalPackages: packages.filter(function (p) { return p.status === 'active'; }).length,
      totalOrders: orders.length,
      totalUsers: users.length,
      totalArticles: articles.length,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netProfit: Math.round((totalIncome - totalExpense) * 100) / 100,
      todayOrders: todayOrders.length,
      todayIncome: Math.round(todayIncome * 100) / 100,
      orderStats: orderStats,
      pendingReviews: {
        certifications: pendingCerts,
        notes: pendingNotes,
        merchantApps: pendingMerchantApps,
        withdrawals: pendingWithdrawals,
        total: pendingCerts + pendingNotes + pendingMerchantApps + pendingWithdrawals
      }
    };
  };

  /**
   * 获取商户端统计数据
   * @param {string} merchantId - 商户ID
   * @returns {Object} 商户统计数据
   * @memberof HuiLifeDB
   */
  HuiLifeDB.getMerchantStats = function (merchantId) {
    if (!merchantId) {
      console.warn('[HuiLifeDB] getMerchantStats 缺少 merchantId');
      return null;
    }
    var data = _getData();
    var merchantOrders = data.orders.filter(function (o) { return o.merchantId === merchantId; });
    var merchantPackages = data.packages.filter(function (p) { return p.merchantId === merchantId; });

    // 待核销订单
    var pendingVerify = merchantOrders.filter(function (o) { return o.status === 'pending_verify'; });
    // 已核销订单
    var verified = merchantOrders.filter(function (o) { return o.status === 'verified'; });
    // 已过期订单
    var expired = merchantOrders.filter(function (o) { return o.status === 'expired'; });

    // 计算商户收入
    var totalRevenue = 0;
    for (var i = 0; i < merchantOrders.length; i++) {
      totalRevenue += merchantOrders[i].amount;
    }

    // 今日订单
    var todayStr = new Date().getFullYear() + '-' +
      ('0' + (new Date().getMonth() + 1)).slice(-2) + '-' +
      ('0' + new Date().getDate()).slice(-2);
    var todayOrders = merchantOrders.filter(function (o) { return o.payTime && o.payTime.indexOf(todayStr) === 0; });

    return {
      merchantId: merchantId,
      totalOrders: merchantOrders.length,
      pendingVerify: pendingVerify.length,
      verified: verified.length,
      expired: expired.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      todayOrders: todayOrders.length,
      activePackages: merchantPackages.filter(function (p) { return p.status === 'active'; }).length,
      totalPackages: merchantPackages.length,
      pendingVerifyOrders: deepClone(pendingVerify)
    };
  };

  /**
   * 获取业务员统计数据
   * @param {string} salesRepId - 业务员ID
   * @returns {Object} 业务员统计数据
   * @memberof HuiLifeDB
   */
  HuiLifeDB.getSalesRepStats = function (salesRepId) {
    if (!salesRepId) {
      console.warn('[HuiLifeDB] getSalesRepStats 缺少 salesRepId');
      return null;
    }
    var data = _getData();

    // 查找业务员负责的商户
    var myMerchants = data.merchants.filter(function (m) {
      // 通过 salesRep 字段匹配（名称匹配）
      return m.salesRep && m.salesRepId === salesRepId;
    });

    // 也通过名称匹配（兼容种子数据中使用名称的情况）
    var salesRepNames = {
      'SR001': '王磊',
      'SR002': '李娜',
      'SR003': '张伟'
    };
    var repName = salesRepNames[salesRepId] || '';
    if (repName) {
      var nameMatched = data.merchants.filter(function (m) {
        return m.salesRep === repName && !myMerchants.some(function (mm) { return mm.id === m.id; });
      });
      myMerchants = myMerchants.concat(nameMatched);
    }

    var myMerchantIds = myMerchants.map(function (m) { return m.id; });

    // 关联订单
    var myOrders = data.orders.filter(function (o) {
      return myMerchantIds.indexOf(o.merchantId) !== -1 || o.salesRepId === salesRepId;
    });

    // 计算佣金
    var totalCommission = 0;
    var myFinancialRecords = data.financialRecords.filter(function (f) {
      return f.category === 'sales_commission' && myOrders.some(function (o) { return o.id === f.orderId; });
    });
    for (var i = 0; i < myFinancialRecords.length; i++) {
      totalCommission += myFinancialRecords[i].amount;
    }

    // 今日订单
    var todayStr = new Date().getFullYear() + '-' +
      ('0' + (new Date().getMonth() + 1)).slice(-2) + '-' +
      ('0' + new Date().getDate()).slice(-2);
    var todayOrders = myOrders.filter(function (o) { return o.payTime && o.payTime.indexOf(todayStr) === 0; });

    return {
      salesRepId: salesRepId,
      name: repName,
      totalMerchants: myMerchants.length,
      totalOrders: myOrders.length,
      totalCommission: Math.round(totalCommission * 100) / 100,
      todayOrders: todayOrders.length,
      merchants: deepClone(myMerchants)
    };
  };

  // ==================== 事件监听 ====================

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @memberof HuiLifeDB
   */
  HuiLifeDB.on = function (event, callback) {
    if (!event || typeof callback !== 'function') {
      console.warn('[HuiLifeDB] on 参数无效');
      return;
    }
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(callback);
  };

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 要移除的回调函数
   * @memberof HuiLifeDB
   */
  HuiLifeDB.off = function (event, callback) {
    if (!event || !listeners[event]) return;
    if (typeof callback !== 'function') {
      // 如果没传 callback，移除该事件所有监听器
      delete listeners[event];
      return;
    }
    var cbs = listeners[event];
    for (var i = cbs.length - 1; i >= 0; i--) {
      if (cbs[i] === callback) {
        cbs.splice(i, 1);
      }
    }
    if (cbs.length === 0) {
      delete listeners[event];
    }
  };

  // ==================== 重置 ====================

  /**
   * 重置数据到默认种子数据
   * @memberof HuiLifeDB
   */
  HuiLifeDB.reset = function () {
    var seed = _getSeedData();
    _saveData(seed);
    _notify('dataChanged', { source: 'reset' });
  };

  // ==================== 导出 ====================

  // 自动初始化
  HuiLifeDB.init();

  // 挂载到全局
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = HuiLifeDB;
  } else {
    global.HuiLifeDB = HuiLifeDB;
  }

})(typeof window !== 'undefined' ? window : this);
