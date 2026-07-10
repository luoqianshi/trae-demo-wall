/**
 * 商务达人合作流程管理系统 - 前端公共逻辑
 * 纯静态 HTML Demo，数据使用 localStorage 持久化
 * 暴露全局对象 window.BDApp 供 HTML 调用
 */
(function () {
  'use strict';

  // ===================== 常量配置 =====================
  const STORAGE_KEY = 'bd-collab-v2';

  // 任务状态
  const TASK_STATUS = {
    PENDING: '待推荐达人',
    RECOMMENDED: '已有推荐',
    COLLABORATING: '对接中',
    COMPLETED: '已完成'
  };

  // 任务类型
  const TASK_TYPES = ['纯佣带货', '采买素材', '探店合作'];

  // 达人平台
  const PLATFORMS = ['抖音', '小红书', '视频号'];

  // 达人类目
  const CATEGORIES = ['美妆', '食品', '家居', '数码', '本地生活'];

  // 达人等级
  const LEVELS = ['S', 'A', 'B', 'C'];

  // 联系状态
  const CONTACT_STATUS = {
    NONE: '未联系',
    CONTACTED: '已联系',
    COOPERABLE: '可合作',
    NOT_NOW: '暂不合作',
    BLACKLIST: '黑名单'
  };

  // 推荐状态
  const REC_STATUS = {
    PENDING: '待商家确认',
    APPROVED: '商家已同意',
    REJECTED: '商家已拒绝'
  };

  // 对接单阶段（按顺序）
  const COLLAB_STAGES = [
    '待商务申请寄样',
    '待商家寄样',
    '待商务签收',
    '待商务交付',
    '待商家验收',
    '已完成',
    '已取消'
  ];

  // 商务负责人
  const BIZ_OWNERS = ['小李', '小王', '小陈', '小周'];

  // 看板阶段分组
  const KANBAN_GROUPS = [
    { key: 'sample', title: '寄样阶段', items: ['待商务申请寄样', '待商家寄样', '待商务签收'] },
    { key: 'deliver', title: '交付验收', items: ['待商务交付', '待商家验收'] },
    { key: 'finish', title: '完结/取消', items: ['已完成', '已取消'] }
  ];

  // ===================== 全局状态 =====================
  let store = {
    tasks: [],
    creators: [],
    recommendations: [],
    collabs: [],
    currentRole: 'business' // merchant / business / supervisor
  };

  let currentDrawer = { type: '', id: '' };

  // ===================== 工具函数 =====================
  function generateId(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function nowString() {
    return new Date().toISOString();
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function formatDateTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function parseDateLocal(str) {
    if (!str) return null;
    const d = new Date(str + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  function daysAgo(iso) {
    if (!iso) return 99;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 99;
    const diff = Date.now() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  function isValidUrl(str) {
    return /^https?:\/\/.+/.test(String(str));
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getTimestamp() {
    return new Date().toISOString();
  }

  // ===================== Mock 数据 =====================
  function getMockData() {
    const tasks = [
      {
        id: 'task-001',
        taskName: 'Outin 便携咖啡机达人带货',
        productName: 'Outin 便携咖啡机',
        taskType: '纯佣带货',
        creatorNeedCount: 3,
        commissionRate: 15,
        needSample: true,
        deadline: '2026-07-25',
        requirements: '咖啡/生活方式垂类达人，粉丝 10w+，视频需挂车并口播产品卖点，发布后需保留 30 天。',
        merchantName: '欧廷咖啡',
        status: '对接中',
        createdAt: '2026-06-20T10:00:00'
      },
      {
        id: 'task-002',
        taskName: '美妆新品短视频种草',
        productName: '水光唇釉套装',
        taskType: '采买素材',
        creatorNeedCount: 5,
        commissionRate: 0,
        needSample: true,
        deadline: '2026-07-20',
        requirements: '美妆垂类达人，需出 15-30s 种草视频，授权品牌官方使用 6 个月。',
        merchantName: '花颜美妆',
        status: '对接中',
        createdAt: '2026-06-22T10:00:00'
      },
      {
        id: 'task-003',
        taskName: '本地生活探店合作',
        productName: '轻食门店套餐',
        taskType: '探店合作',
        creatorNeedCount: 4,
        commissionRate: 8,
        needSample: false,
        deadline: '2026-07-18',
        requirements: '本地生活达人，坐标杭州，到店拍摄并发布带定位视频，需含门店环境展示。',
        merchantName: '轻食星球',
        status: '对接中',
        createdAt: '2026-06-25T10:00:00'
      },
      {
        id: 'task-004',
        taskName: '家居清洁用品内容合作',
        productName: '全能清洁剂套装',
        taskType: '纯佣带货',
        creatorNeedCount: 3,
        commissionRate: 12,
        needSample: true,
        deadline: '2026-07-22',
        requirements: '家居/好物分享达人，需展示使用前后对比，突出去污不伤手卖点。',
        merchantName: '洁家生活',
        status: '已有推荐',
        createdAt: '2026-06-28T10:00:00'
      },
      {
        id: 'task-005',
        taskName: '零食新品达人测评',
        productName: '低卡海苔脆',
        taskType: '采买素材',
        creatorNeedCount: 4,
        commissionRate: 0,
        needSample: true,
        deadline: '2026-07-28',
        requirements: '零食/测评达人，需试吃并给出真实评价，可二次剪辑授权用于信息流投放。',
        merchantName: '馋嘴小铺',
        status: '已完成',
        createdAt: '2026-06-15T10:00:00'
      },
      {
        id: 'task-006',
        taskName: '数码配件开箱种草',
        productName: '磁吸充电宝',
        taskType: '纯佣带货',
        creatorNeedCount: 2,
        commissionRate: 10,
        needSample: true,
        deadline: '2026-08-05',
        requirements: '数码/科技垂类达人，需展示产品外观、充电速度及便携场景。',
        merchantName: '极客充电',
        status: '待推荐达人',
        createdAt: '2026-07-01T10:00:00'
      }
    ];

    const creators = [
      { id: 'creator-001', creatorName: '小鹿探店', platform: '抖音', displayId: 'xiaolu_local', avatarText: '小鹿', fans: '28.4万', category: '本地生活', level: 'A', contactStatus: '已联系', cooperationCount: 5, successCount: 3, avgPrice: 3000, tags: ['探店', '轻食'], ownerBiz: '小李', lastContactAt: '2026-07-05T14:00:00', remark: '杭州本地达人，配合度高' },
      { id: 'creator-002', creatorName: '安安好物', platform: '抖音', displayId: 'anan_good', avatarText: '安安', fans: '63.1万', category: '家居', level: 'S', contactStatus: '可合作', cooperationCount: 8, successCount: 6, avgPrice: 8000, tags: ['家居', '收纳'], ownerBiz: '小王', lastContactAt: '2026-07-06T10:30:00', remark: '家居头部达人，报价偏高但转化好' },
      { id: 'creator-003', creatorName: '阿糖测评', platform: '抖音', displayId: 'atang_review', avatarText: '阿糖', fans: '14.8万', category: '数码', level: 'B', contactStatus: '可合作', cooperationCount: 3, successCount: 2, avgPrice: 2500, tags: ['数码', '测评'], ownerBiz: '小陈', lastContactAt: '2026-07-07T09:00:00', remark: '测评脚本专业，适合新品背书' },
      { id: 'creator-004', creatorName: '南瓜妈咪', platform: '抖音', displayId: 'pumpkin_mom', avatarText: '南瓜', fans: '120.6万', category: '家居', level: 'S', contactStatus: '可合作', cooperationCount: 12, successCount: 10, avgPrice: 15000, tags: ['母婴', '家居'], ownerBiz: '小周', lastContactAt: '2026-07-04T16:00:00', remark: '带货能力强，需提前锁档' },
      { id: 'creator-005', creatorName: '老林厨房', platform: '抖音', displayId: 'laolin_food', avatarText: '老林', fans: '42.0万', category: '食品', level: 'A', contactStatus: '可合作', cooperationCount: 7, successCount: 5, avgPrice: 5000, tags: ['零食', '测评'], ownerBiz: '小李', lastContactAt: '2026-07-08T11:00:00', remark: '食品测评口碑好，复购率高' },
      { id: 'creator-006', creatorName: '露营小北', platform: '抖音', displayId: 'camp_beibei', avatarText: '小北', fans: '51.7万', category: '本地生活', level: 'A', contactStatus: '未联系', cooperationCount: 4, successCount: 2, avgPrice: 6000, tags: ['户外', '露营'], ownerBiz: '小王', lastContactAt: '', remark: '私信未回复，建议换渠道' },
      { id: 'creator-007', creatorName: '七七穿搭', platform: '小红书', displayId: 'qiqi_style', avatarText: '七七', fans: '36.8万', category: '美妆', level: 'A', contactStatus: '已联系', cooperationCount: 6, successCount: 4, avgPrice: 5500, tags: ['穿搭', '美妆'], ownerBiz: '小陈', lastContactAt: '2026-07-06T15:00:00', remark: '图文种草质量高' },
      { id: 'creator-008', creatorName: '城市跑者阿峰', platform: '视频号', displayId: 'runner_afeng', avatarText: '阿峰', fans: '18.2万', category: '数码', level: 'B', contactStatus: '暂不合作', cooperationCount: 2, successCount: 1, avgPrice: 2000, tags: ['运动', '数码'], ownerBiz: '小周', lastContactAt: '2026-06-20T10:00:00', remark: '近期专注马拉松内容，暂不接商单' },
      { id: 'creator-009', creatorName: '咖啡师小鹿', platform: '抖音', displayId: 'coffee_lu', avatarText: '咖啡', fans: '22.5万', category: '食品', level: 'A', contactStatus: '可合作', cooperationCount: 4, successCount: 3, avgPrice: 4000, tags: ['咖啡', '生活方式'], ownerBiz: '小李', lastContactAt: '2026-07-07T10:00:00', remark: '咖啡垂类精准，适合 Outin' },
      { id: 'creator-010', creatorName: '美妆CC', platform: '小红书', displayId: 'beauty_cc', avatarText: 'CC', fans: '85.3万', category: '美妆', level: 'S', contactStatus: '可合作', cooperationCount: 15, successCount: 12, avgPrice: 12000, tags: ['美妆', '种草'], ownerBiz: '小王', lastContactAt: '2026-07-08T09:30:00', remark: '美妆头部，需严格审片' },
      { id: 'creator-011', creatorName: '居家小美', platform: '视频号', displayId: 'home_mei', avatarText: '小美', fans: '9.6万', category: '家居', level: 'C', contactStatus: '已联系', cooperationCount: 2, successCount: 1, avgPrice: 1500, tags: ['家居', '清洁'], ownerBiz: '小陈', lastContactAt: '2026-07-05T11:00:00', remark: '视频号家居小达人，性价比高' },
      { id: 'creator-012', creatorName: '吃货阿福', platform: '抖音', displayId: 'food_afu', avatarText: '阿福', fans: '33.3万', category: '食品', level: 'A', contactStatus: '可合作', cooperationCount: 9, successCount: 7, avgPrice: 4500, tags: ['零食', '测评'], ownerBiz: '小周', lastContactAt: '2026-07-08T14:00:00', remark: '零食测评爆款率高' },
      { id: 'creator-013', creatorName: '科技老张', platform: '抖音', displayId: 'tech_zhang', avatarText: '老张', fans: '58.9万', category: '数码', level: 'S', contactStatus: '可合作', cooperationCount: 11, successCount: 9, avgPrice: 9000, tags: ['数码', '科技'], ownerBiz: '小李', lastContactAt: '2026-07-07T16:00:00', remark: '数码开箱专业，男性用户多' },
      { id: 'creator-014', creatorName: '杭州探店酱', platform: '小红书', displayId: 'hz_tandian', avatarText: '探店', fans: '12.6万', category: '本地生活', level: 'B', contactStatus: '未联系', cooperationCount: 3, successCount: 1, avgPrice: 2200, tags: ['杭州', '探店'], ownerBiz: '小王', lastContactAt: '', remark: '小红书本地账号，数据真实' },
      { id: 'creator-015', creatorName: '辣妈甜甜', platform: '视频号', displayId: 'mom_tiantian', avatarText: '甜甜', fans: '45.7万', category: '美妆', level: 'A', contactStatus: '黑名单', cooperationCount: 5, successCount: 4, avgPrice: 5200, tags: ['母婴', '美妆'], ownerBiz: '小陈', lastContactAt: '2026-06-10T10:00:00', remark: '多次爽约，已暂停合作' }
    ];

    const recommendations = [
      {
        id: 'rec-001', taskId: 'task-001', creatorId: 'creator-009',
        creatorSnapshot: { creatorName: '咖啡师小鹿', platform: '抖音', displayId: 'coffee_lu', fans: '22.5万', category: '食品', level: 'A', avatarText: '咖啡' },
        creatorName: '咖啡师小鹿', platform: '抖音', fans: '22.5万', category: '食品', level: 'A',
        reason: '咖啡垂类精准，粉丝画像与便携咖啡机高度匹配。', estimatedPrice: 4000, needSample: true, bizOwner: '小李', source: '达人库', status: '待商家确认', createdAt: '2026-07-06T10:00:00'
      },
      {
        id: 'rec-002', taskId: 'task-001', creatorId: 'creator-003',
        creatorSnapshot: { creatorName: '阿糖测评', platform: '抖音', displayId: 'atang_review', fans: '14.8万', category: '数码', level: 'B', avatarText: '阿糖' },
        creatorName: '阿糖测评', platform: '抖音', fans: '14.8万', category: '数码', level: 'B',
        reason: '测评风格适合展示咖啡机便携性与使用场景。', estimatedPrice: 2500, needSample: true, bizOwner: '小陈', source: '达人库', status: '待商家确认', createdAt: '2026-07-06T11:00:00'
      },
      {
        id: 'rec-003', taskId: 'task-001', creatorId: 'creator-013',
        creatorSnapshot: { creatorName: '科技老张', platform: '抖音', displayId: 'tech_zhang', fans: '58.9万', category: '数码', level: 'S', avatarText: '老张' },
        creatorName: '科技老张', platform: '抖音', fans: '58.9万', category: '数码', level: 'S',
        reason: '数码头部达人，男性用户购买力强，适合科技类产品。', estimatedPrice: 9000, needSample: true, bizOwner: '小李', source: '达人库', status: '商家已同意', createdAt: '2026-07-06T12:00:00'
      },
      {
        id: 'rec-004', taskId: 'task-002', creatorId: 'creator-010',
        creatorSnapshot: { creatorName: '美妆CC', platform: '小红书', displayId: 'beauty_cc', fans: '85.3万', category: '美妆', level: 'S', avatarText: 'CC' },
        creatorName: '美妆CC', platform: '小红书', fans: '85.3万', category: '美妆', level: 'S',
        reason: '美妆头部账号，种草转化高，符合新品曝光需求。', estimatedPrice: 12000, needSample: true, bizOwner: '小王', source: '达人库', status: '商家已同意', createdAt: '2026-07-06T13:00:00'
      },
      {
        id: 'rec-005', taskId: 'task-002', creatorId: 'creator-007',
        creatorSnapshot: { creatorName: '七七穿搭', platform: '小红书', displayId: 'qiqi_style', fans: '36.8万', category: '美妆', level: 'A', avatarText: '七七' },
        creatorName: '七七穿搭', platform: '小红书', fans: '36.8万', category: '美妆', level: 'A',
        reason: '穿搭美妆兼顾，适合唇釉上妆展示。', estimatedPrice: 5500, needSample: true, bizOwner: '小陈', source: '达人库', status: '待商家确认', createdAt: '2026-07-06T14:00:00'
      },
      {
        id: 'rec-006', taskId: 'task-002', creatorId: 'creator-015',
        creatorSnapshot: { creatorName: '辣妈甜甜', platform: '视频号', displayId: 'mom_tiantian', fans: '45.7万', category: '美妆', level: 'A', avatarText: '甜甜' },
        creatorName: '辣妈甜甜', platform: '视频号', fans: '45.7万', category: '美妆', level: 'A',
        reason: '母婴美妆人群重叠，但近期在黑名单中。', estimatedPrice: 5200, needSample: true, bizOwner: '小陈', source: '达人库', status: '商家已拒绝', createdAt: '2026-07-06T15:00:00'
      },
      {
        id: 'rec-007', taskId: 'task-003', creatorId: 'creator-001',
        creatorSnapshot: { creatorName: '小鹿探店', platform: '抖音', displayId: 'xiaolu_local', fans: '28.4万', category: '本地生活', level: 'A', avatarText: '小鹿' },
        creatorName: '小鹿探店', platform: '抖音', fans: '28.4万', category: '本地生活', level: 'A',
        reason: '杭州本地探店达人，粉丝精准到门店商圈。', estimatedPrice: 3000, needSample: false, bizOwner: '小李', source: '达人库', status: '商家已同意', createdAt: '2026-07-06T16:00:00'
      },
      {
        id: 'rec-008', taskId: 'task-003', creatorId: 'creator-006',
        creatorSnapshot: { creatorName: '露营小北', platform: '抖音', displayId: 'camp_beibei', fans: '51.7万', category: '本地生活', level: 'A', avatarText: '小北' },
        creatorName: '露营小北', platform: '抖音', fans: '51.7万', category: '本地生活', level: 'A',
        reason: '本地生活流量大，但尚未建联。', estimatedPrice: 6000, needSample: false, bizOwner: '小王', source: '达人库', status: '待商家确认', createdAt: '2026-07-07T09:00:00'
      },
      {
        id: 'rec-009', taskId: 'task-003', creatorId: 'creator-014',
        creatorSnapshot: { creatorName: '杭州探店酱', platform: '小红书', displayId: 'hz_tandian', fans: '12.6万', category: '本地生活', level: 'B', avatarText: '探店' },
        creatorName: '杭州探店酱', platform: '小红书', fans: '12.6万', category: '本地生活', level: 'B',
        reason: '小红书本地账号真实种草，适合轻食打卡。', estimatedPrice: 2200, needSample: false, bizOwner: '小王', source: '达人库', status: '商家已同意', createdAt: '2026-07-07T10:00:00'
      },
      {
        id: 'rec-010', taskId: 'task-004', creatorId: 'creator-002',
        creatorSnapshot: { creatorName: '安安好物', platform: '抖音', displayId: 'anan_good', fans: '63.1万', category: '家居', level: 'S', avatarText: '安安' },
        creatorName: '安安好物', platform: '抖音', fans: '63.1万', category: '家居', level: 'S',
        reason: '家居头部达人，适合清洁剂类好物推荐。', estimatedPrice: 8000, needSample: true, bizOwner: '小王', source: '达人库', status: '待商家确认', createdAt: '2026-07-07T11:00:00'
      },
      {
        id: 'rec-011', taskId: 'task-004', creatorId: 'creator-011',
        creatorSnapshot: { creatorName: '居家小美', platform: '视频号', displayId: 'home_mei', fans: '9.6万', category: '家居', level: 'C', avatarText: '小美' },
        creatorName: '居家小美', platform: '视频号', fans: '9.6万', category: '家居', level: 'C',
        reason: '视频号家居小达人，性价比高，适合铺量。', estimatedPrice: 1500, needSample: true, bizOwner: '小陈', source: '达人库', status: '待商家确认', createdAt: '2026-07-07T12:00:00'
      },
      {
        id: 'rec-012', taskId: 'task-005', creatorId: 'creator-005',
        creatorSnapshot: { creatorName: '老林厨房', platform: '抖音', displayId: 'laolin_food', fans: '42.0万', category: '食品', level: 'A', avatarText: '老林' },
        creatorName: '老林厨房', platform: '抖音', fans: '42.0万', category: '食品', level: 'A',
        reason: '零食测评口碑好，已完成多期合作。', estimatedPrice: 5000, needSample: true, bizOwner: '小李', source: '达人库', status: '商家已同意', createdAt: '2026-07-01T10:00:00'
      },
      {
        id: 'rec-013', taskId: 'task-005', creatorId: 'creator-012',
        creatorSnapshot: { creatorName: '吃货阿福', platform: '抖音', displayId: 'food_afu', fans: '33.3万', category: '食品', level: 'A', avatarText: '阿福' },
        creatorName: '吃货阿福', platform: '抖音', fans: '33.3万', category: '食品', level: 'A',
        reason: '零食爆款率高，试吃真实感强。', estimatedPrice: 4500, needSample: true, bizOwner: '小周', source: '达人库', status: '商家已同意', createdAt: '2026-07-01T11:00:00'
      },
      {
        id: 'rec-014', taskId: 'task-005', creatorId: 'creator-004',
        creatorSnapshot: { creatorName: '南瓜妈咪', platform: '抖音', displayId: 'pumpkin_mom', fans: '120.6万', category: '家居', level: 'S', avatarText: '南瓜' },
        creatorName: '南瓜妈咪', platform: '抖音', fans: '120.6万', category: '家居', level: 'S',
        reason: '母婴家居场景可覆盖家庭零食消费决策。', estimatedPrice: 15000, needSample: true, bizOwner: '小周', source: '达人库', status: '商家已同意', createdAt: '2026-07-01T12:00:00'
      },
      {
        id: 'rec-015', taskId: 'task-005', creatorId: 'creator-009',
        creatorSnapshot: { creatorName: '咖啡师小鹿', platform: '抖音', displayId: 'coffee_lu', fans: '22.5万', category: '食品', level: 'A', avatarText: '咖啡' },
        creatorName: '咖啡师小鹿', platform: '抖音', fans: '22.5万', category: '食品', level: 'A',
        reason: '生活方式达人，可覆盖下午茶零食场景。', estimatedPrice: 4000, needSample: true, bizOwner: '小李', source: '达人库', status: '商家已同意', createdAt: '2026-07-01T13:00:00'
      }
    ];

    const collabs = [
      {
        id: 'collab-001', taskId: 'task-001', recommendationId: 'rec-003', creatorId: 'creator-013',
        creatorName: '科技老张', taskName: 'Outin 便携咖啡机达人带货', merchantName: '欧廷咖啡', bizOwner: '小李',
        stage: '待商务申请寄样',
        sampleApply: null,
        logistics: null,
        delivery: null,
        revisionNotes: [],
        timeline: [
          { time: '2026-07-06T12:00:00', text: '商家同意推荐，对接单创建，等待商务申请寄样。' }
        ],
        updatedAt: '2026-07-06T12:00:00',
        deadline: '2026-07-25'
      },
      {
        id: 'collab-002', taskId: 'task-002', recommendationId: 'rec-004', creatorId: 'creator-010',
        creatorName: '美妆CC', taskName: '美妆新品短视频种草', merchantName: '花颜美妆', bizOwner: '小王',
        stage: '待商家验收',
        sampleApply: { receiverName: '陈小姐', phone: '13800138001', address: '上海市静安区南京西路 1266 号恒隆广场 1 座 2801', note: '工作日可收件，请提前电话联系。' },
        logistics: { company: '顺丰速运', trackingNumber: 'SF1234567890', note: '样品已发出，预计次日达。' },
        delivery: { title: '水光唇釉套装种草视频', link: 'https://www.xiaohongshu.com/discovery/item/xxx', note: '已按 brief 完成口播与产品展示，请查收。', publishTime: '2026-07-09T10:00:00' },
        revisionNotes: [{ note: '口播需补充色号名称', createdAt: '2026-07-09T14:00:00' }],
        timeline: [
          { time: '2026-07-06T13:00:00', text: '商家同意推荐，对接单创建。' },
          { time: '2026-07-07T10:00:00', text: '商务申请寄样，收货信息已提交。' },
          { time: '2026-07-08T09:00:00', text: '商家寄出样品，顺丰速运 SF1234567890。' },
          { time: '2026-07-09T08:00:00', text: '商务签收样品。' },
          { time: '2026-07-09T10:00:00', text: '达人交付视频链接。' },
          { time: '2026-07-09T14:00:00', text: '商家提出修改意见：口播需补充色号名称。' }
        ],
        updatedAt: '2026-07-09T14:00:00',
        deadline: '2026-07-20'
      },
      {
        id: 'collab-003', taskId: 'task-003', recommendationId: 'rec-007', creatorId: 'creator-001',
        creatorName: '小鹿探店', taskName: '本地生活探店合作', merchantName: '轻食星球', bizOwner: '小李',
        stage: '待商务交付',
        sampleApply: { receiverName: '鹿小姐', phone: '13800138002', address: '浙江省杭州市西湖区文三路 478 号华星时代广场 A 座 1202', note: '无需寄样，探店到店即可。' },
        logistics: null,
        delivery: null,
        revisionNotes: [],
        timeline: [
          { time: '2026-07-06T16:00:00', text: '商家同意推荐，对接单创建。' },
          { time: '2026-07-07T10:00:00', text: '商务确认探店档期与到店信息。' },
          { time: '2026-07-08T12:00:00', text: '达人已完成到店拍摄，等待交付视频。' }
        ],
        updatedAt: '2026-07-08T12:00:00',
        deadline: '2026-07-18'
      },
      {
        id: 'collab-004', taskId: 'task-003', recommendationId: 'rec-009', creatorId: 'creator-014',
        creatorName: '杭州探店酱', taskName: '本地生活探店合作', merchantName: '轻食星球', bizOwner: '小王',
        stage: '已完成',
        sampleApply: { receiverName: '酱酱', phone: '13800138003', address: '浙江省杭州市拱墅区延安路 385 号嘉里中心 3 楼', note: '直接到店，无需提前寄样。' },
        logistics: null,
        delivery: { title: '轻食星球探店笔记', link: 'https://www.xiaohongshu.com/discovery/item/yyy', note: '已发布带定位笔记，数据良好。', publishTime: '2026-07-07T18:00:00' },
        revisionNotes: [],
        timeline: [
          { time: '2026-07-07T10:00:00', text: '商家同意推荐，对接单创建。' },
          { time: '2026-07-07T14:00:00', text: '商务确认到店时间与发布要求。' },
          { time: '2026-07-07T18:00:00', text: '达人发布探店笔记。' },
          { time: '2026-07-08T09:00:00', text: '商家验收通过，对接完成。' }
        ],
        updatedAt: '2026-07-08T09:00:00',
        deadline: '2026-07-18'
      },
      {
        id: 'collab-005', taskId: 'task-004', recommendationId: 'rec-011', creatorId: 'creator-011',
        creatorName: '居家小美', taskName: '家居清洁用品内容合作', merchantName: '洁家生活', bizOwner: '小陈',
        stage: '待商务签收',
        sampleApply: { receiverName: '小美', phone: '13800138004', address: '广东省深圳市南山区科技园南路 88 号阳光带海滨城 2 期 8B', note: '周末在家，可安排周末派送。' },
        logistics: { company: '京东物流', trackingNumber: 'JD9876543210', note: '清洁剂套装已发出。' },
        delivery: null,
        revisionNotes: [],
        timeline: [
          { time: '2026-07-07T12:00:00', text: '商家同意推荐，对接单创建。' },
          { time: '2026-07-08T10:00:00', text: '商务申请寄样，收货信息已提交。' },
          { time: '2026-07-08T16:00:00', text: '商家寄出样品，京东物流 JD9876543210。' }
        ],
        updatedAt: '2026-07-08T16:00:00',
        deadline: '2026-07-22'
      },
      {
        id: 'collab-006', taskId: 'task-005', recommendationId: 'rec-012', creatorId: 'creator-005',
        creatorName: '老林厨房', taskName: '零食新品达人测评', merchantName: '馋嘴小铺', bizOwner: '小李',
        stage: '已完成',
        sampleApply: { receiverName: '林先生', phone: '13800138005', address: '北京市朝阳区建国路 88 号 SOHO 现代城 3 号楼 1505', note: '请放快递柜。' },
        logistics: { company: '中通快递', trackingNumber: 'ZT1122334455', note: '已签收。' },
        delivery: { title: '低卡海苔脆真实测评', link: 'https://www.douyin.com/video/xxx', note: '试吃真实，评论区互动热烈。', publishTime: '2026-07-02T10:00:00' },
        revisionNotes: [],
        timeline: [
          { time: '2026-07-01T10:00:00', text: '商家同意推荐，对接单创建。' },
          { time: '2026-07-01T14:00:00', text: '商务申请寄样。' },
          { time: '2026-07-02T08:00:00', text: '商家寄样。' },
          { time: '2026-07-02T10:00:00', text: '商务签收并交付脚本方向。' },
          { time: '2026-07-02T10:00:00', text: '达人发布测评视频。' },
          { time: '2026-07-03T09:00:00', text: '商家验收通过，对接完成。' }
        ],
        updatedAt: '2026-07-03T09:00:00',
        deadline: '2026-07-28'
      },
      {
        id: 'collab-007', taskId: 'task-005', recommendationId: 'rec-013', creatorId: 'creator-012',
        creatorName: '吃货阿福', taskName: '零食新品达人测评', merchantName: '馋嘴小铺', bizOwner: '小周',
        stage: '已完成',
        sampleApply: { receiverName: '阿福', phone: '13800138006', address: '四川省成都市锦江区春熙路 168 号时代广场 2203', note: '工作日白天可收件。' },
        logistics: { company: '圆通速递', trackingNumber: 'YT5566778899', note: '已签收。' },
        delivery: { title: '海苔脆试吃', link: 'https://www.douyin.com/video/yyy', note: '零食测评风格，完播率高。', publishTime: '2026-07-02T15:00:00' },
        revisionNotes: [],
        timeline: [
          { time: '2026-07-01T11:00:00', text: '商家同意推荐，对接单创建。' },
          { time: '2026-07-01T15:00:00', text: '商务申请寄样。' },
          { time: '2026-07-02T09:00:00', text: '商家寄样。' },
          { time: '2026-07-02T11:00:00', text: '商务签收。' },
          { time: '2026-07-02T15:00:00', text: '达人发布试吃视频。' },
          { time: '2026-07-03T10:00:00', text: '商家验收通过，对接完成。' }
        ],
        updatedAt: '2026-07-03T10:00:00',
        deadline: '2026-07-28'
      },
      {
        id: 'collab-008', taskId: 'task-005', recommendationId: 'rec-014', creatorId: 'creator-004',
        creatorName: '南瓜妈咪', taskName: '零食新品达人测评', merchantName: '馋嘴小铺', bizOwner: '小周',
        stage: '已完成',
        sampleApply: { receiverName: '林女士', phone: '13800138007', address: '上海市浦东新区世纪大道 100 号环球金融中心 78 楼', note: '前台代收。' },
        logistics: { company: '顺丰速运', trackingNumber: 'SF2233445566', note: '已签收。' },
        delivery: { title: '家庭健康零食分享', link: 'https://www.douyin.com/video/zzz', note: '母婴场景植入，品牌方满意。', publishTime: '2026-07-03T10:00:00' },
        revisionNotes: [],
        timeline: [
          { time: '2026-07-01T12:00:00', text: '商家同意推荐，对接单创建。' },
          { time: '2026-07-01T16:00:00', text: '商务申请寄样。' },
          { time: '2026-07-02T10:00:00', text: '商家寄样。' },
          { time: '2026-07-02T14:00:00', text: '商务签收。' },
          { time: '2026-07-03T10:00:00', text: '达人发布分享视频。' },
          { time: '2026-07-04T09:00:00', text: '商家验收通过，对接完成。' }
        ],
        updatedAt: '2026-07-04T09:00:00',
        deadline: '2026-07-28'
      },
      {
        id: 'collab-009', taskId: 'task-005', recommendationId: 'rec-015', creatorId: 'creator-009',
        creatorName: '咖啡师小鹿', taskName: '零食新品达人测评', merchantName: '馋嘴小铺', bizOwner: '小李',
        stage: '已完成',
        sampleApply: { receiverName: '鹿先生', phone: '13800138008', address: '浙江省杭州市滨江区物联网街 369 号大华江虹国际创新园 A 座 606', note: '请预约派送。' },
        logistics: { company: 'EMS', trackingNumber: 'EM9988776655', note: '已签收。' },
        delivery: { title: '下午茶零食推荐', link: 'https://www.douyin.com/video/aaa', note: '咖啡场景植入自然，互动数据好。', publishTime: '2026-07-03T16:00:00' },
        revisionNotes: [],
        timeline: [
          { time: '2026-07-01T13:00:00', text: '商家同意推荐，对接单创建。' },
          { time: '2026-07-01T17:00:00', text: '商务申请寄样。' },
          { time: '2026-07-02T11:00:00', text: '商家寄样。' },
          { time: '2026-07-02T15:00:00', text: '商务签收。' },
          { time: '2026-07-03T16:00:00', text: '达人发布推荐视频。' },
          { time: '2026-07-04T10:00:00', text: '商家验收通过，对接完成。' }
        ],
        updatedAt: '2026-07-04T10:00:00',
        deadline: '2026-07-28'
      }
    ];

    return { tasks, creators, recommendations, collabs };
  }

  // ===================== 数据持久化 =====================
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.creators)) {
          store = {
            tasks: parsed.tasks || [],
            creators: parsed.creators || [],
            recommendations: parsed.recommendations || [],
            collabs: parsed.collabs || [],
            currentRole: parsed.currentRole || 'business'
          };
          return;
        }
      }
    } catch (e) {
      console.warn('读取本地数据失败，使用默认数据', e);
    }
    seedData();
    saveData();
  }

  function seedData() {
    const mock = getMockData();
    store.tasks = mock.tasks;
    store.creators = mock.creators;
    store.recommendations = mock.recommendations;
    store.collabs = mock.collabs;
    store.currentRole = 'business';
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn('保存本地数据失败', e);
    }
  }

  // ===================== 角色系统 =====================
  function getRole() {
    return store.currentRole;
  }

  function setRole(role) {
    if (!['merchant', 'business', 'supervisor'].includes(role)) {
      toast('角色参数错误');
      return;
    }
    store.currentRole = role;
    saveData();
    window.location.reload();
  }

  function resetDemoData() {
    if (!confirm('重置后，您在 Demo 中新增和修改的数据将恢复为初始状态，是否继续？')) {
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('bd-collabs-v1');
      seedData();
      saveData();
      toast('演示数据已重置，可以重新体验完整流程');
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      console.warn('重置演示数据失败', e);
      toast('重置失败，请刷新页面后重试');
    }
  }

  function startFullExperience() {
    store.currentRole = 'merchant';
    saveData();
    window.location.href = 'tasks.html';
  }

  // ===================== 实体查询 =====================
  function getTaskById(id) {
    return store.tasks.find(t => t.id === id);
  }

  function getCreatorById(id) {
    return store.creators.find(c => c.id === id);
  }

  function getRecById(id) {
    return store.recommendations.find(r => r.id === id);
  }

  function getCollabById(id) {
    return store.collabs.find(c => c.id === id);
  }

  function getRecommendationsByTask(taskId) {
    return store.recommendations.filter(r => r.taskId === taskId);
  }

  function getCollabsByTask(taskId) {
    return store.collabs.filter(c => c.taskId === taskId);
  }

  function getCollabByRecommendation(recId) {
    return store.collabs.find(c => c.recommendationId === recId);
  }

  // ===================== 业务规则 =====================
  function updateTaskStatus(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;

    const taskCollabs = getCollabsByTask(taskId);
    const completedCount = taskCollabs.filter(c => c.stage === '已完成').length;

    if (completedCount >= task.creatorNeedCount) {
      task.status = '已完成';
    } else if (taskCollabs.length > 0) {
      task.status = '对接中';
    } else {
      const recs = getRecommendationsByTask(taskId);
      const hasPending = recs.some(r => r.status === '待商家确认');
      const hasApproved = recs.some(r => r.status === '商家已同意');
      if (hasApproved) {
        task.status = '对接中';
      } else if (hasPending) {
        task.status = '已有推荐';
      } else {
        task.status = '待推荐达人';
      }
    }
    task.updatedAt = nowString();
  }

  function addTimeline(collab, text) {
    if (!collab.timeline) collab.timeline = [];
    collab.timeline.unshift({ time: nowString(), text: text });
    collab.updatedAt = nowString();
  }

  function isCollabOverdue(collab) {
    if (collab.stage === '已完成' || collab.stage === '已取消') return false;
    if (!collab.deadline) return false;
    return new Date(collab.deadline + 'T23:59:59') < new Date();
  }

  function isCollabStale(collab) {
    if (collab.stage === '已完成' || collab.stage === '已取消') return false;
    return daysAgo(collab.updatedAt) >= 4;
  }

  function getCurrentHandler(collab) {
    const stage = collab.stage;
    if (stage === '待商务申请寄样' || stage === '待商务签收' || stage === '待商务交付') {
      return '商务 ' + collab.bizOwner;
    }
    if (stage === '待商家寄样' || stage === '待商家验收') {
      return '商家 ' + collab.merchantName;
    }
    return '-';
  }

  function getNextActionText(collab) {
    const map = {
      '待商务申请寄样': '商务需填写寄样地址并申请寄样',
      '待商家寄样': '商家需根据寄样信息发货',
      '待商务签收': '商务收到样品后确认签收',
      '待商务交付': '商务需催促达人交付内容',
      '待商家验收': '商家需验收交付内容',
      '已完成': '合作已完成',
      '已取消': '合作已取消'
    };
    return map[collab.stage] || '-';
  }

  function getStageHandler(stage) {
    if (stage === '待商务申请寄样' || stage === '待商务签收' || stage === '待商务交付') {
      return { role: 'business', label: '商务' };
    }
    if (stage === '待商家寄样' || stage === '待商家验收') {
      return { role: 'merchant', label: '商家' };
    }
    return { role: '', label: '-' };
  }

  function getTaskNextAction(task) {
    const recs = getRecommendationsByTask(task.id);
    const collabs = getCollabsByTask(task.id);
    if (task.status === '已完成') return '任务已完成，可归档复盘';
    if (collabs.some(c => c.stage === '待商家验收')) return '商家有待验收内容';
    if (collabs.some(c => c.stage === '待商务交付')) return '商务需催促达人交付';
    if (collabs.some(c => c.stage === '待商务签收')) return '商务需确认签收';
    if (collabs.some(c => c.stage === '待商家寄样')) return '商家需填写物流并发货';
    if (collabs.some(c => c.stage === '待商务申请寄样')) return '商务需申请寄样';
    if (recs.some(r => r.status === '待商家确认')) return '等待商家确认推荐达人';
    if (task.status === '待推荐达人') return '商务需从达人库推荐达人';
    return '继续推进';
  }

  function getRecommendCountForTask(taskId) {
    return store.recommendations.filter(r => r.taskId === taskId).length;
  }

  function getApprovedCountForTask(taskId) {
    return store.recommendations.filter(r => r.taskId === taskId && r.status === '商家已同意').length;
  }

  // ===================== 核心交互函数 =====================
  function createTask(taskObj) {
    const needCount = Number(taskObj.creatorNeedCount);
    const commissionRate = Number(taskObj.commissionRate);
    const deadline = parseDateLocal(taskObj.deadline);

    if (!taskObj.taskName || !taskObj.taskName.trim()) {
      toast('请填写任务名称');
      return null;
    }
    if (!taskObj.productName || !taskObj.productName.trim()) {
      toast('请填写商品名称');
      return null;
    }
    if (!needCount || needCount < 1) {
      toast('需求达人数量必须大于 0');
      return null;
    }
    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      toast('佣金比例必须在 0 到 100 之间');
      return null;
    }
    if (!deadline) {
      toast('请选择截止时间');
      return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline < today) {
      toast('截止时间必须晚于当前日期');
      return null;
    }

    const task = {
      id: generateId('task'),
      taskName: taskObj.taskName.trim(),
      productName: taskObj.productName.trim(),
      taskType: taskObj.taskType || '纯佣带货',
      creatorNeedCount: needCount,
      commissionRate: commissionRate,
      needSample: !!taskObj.needSample,
      deadline: taskObj.deadline,
      requirements: taskObj.requirements || '',
      merchantName: taskObj.merchantName || '',
      status: '待推荐达人',
      createdAt: nowString(),
      updatedAt: nowString()
    };
    store.tasks.unshift(task);
    saveData();
    renderPage();
    toast('任务创建成功');
    return task;
  }

  function addCreator(creatorObj) {
    if (!creatorObj.creatorName || !creatorObj.creatorName.trim()) {
      toast('请填写达人昵称');
      return null;
    }
    const creator = {
      id: generateId('creator'),
      creatorName: creatorObj.creatorName.trim(),
      platform: creatorObj.platform || '抖音',
      displayId: creatorObj.displayId || '',
      avatarText: creatorObj.avatarText || creatorObj.creatorName?.slice(0, 2) || '达人',
      fans: creatorObj.fans || '0',
      category: creatorObj.category || '美妆',
      level: creatorObj.level || 'C',
      contactStatus: creatorObj.contactStatus || '未联系',
      cooperationCount: Number(creatorObj.cooperationCount) || 0,
      successCount: Number(creatorObj.successCount) || 0,
      avgPrice: Number(creatorObj.avgPrice) || 0,
      tags: Array.isArray(creatorObj.tags) ? creatorObj.tags : [],
      ownerBiz: creatorObj.ownerBiz || '小李',
      lastContactAt: creatorObj.lastContactAt || nowString(),
      remark: creatorObj.remark || '',
      createdAt: nowString()
    };
    store.creators.unshift(creator);
    saveData();
    renderPage();
    toast('达人录入成功');
    return creator;
  }

  function recommendCreator(taskId, creatorId, reason, estimatedPrice, needSample) {
    const task = getTaskById(taskId);
    const creator = getCreatorById(creatorId);
    if (!task || !creator) {
      toast('任务或达人不存在');
      return null;
    }
    if (!reason || !reason.trim()) {
      toast('请填写推荐理由');
      return null;
    }
    const price = Number(estimatedPrice);
    if (isNaN(price) || price < 0) {
      toast('预估合作价格不能为负数');
      return null;
    }

    const exists = store.recommendations.some(r => r.taskId === taskId && r.creatorId === creatorId);
    if (exists) {
      toast('该达人已推荐到当前任务，请勿重复推荐');
      return null;
    }

    const rec = {
      id: generateId('rec'),
      taskId: taskId,
      creatorId: creatorId,
      creatorSnapshot: {
        creatorName: creator.creatorName,
        platform: creator.platform,
        displayId: creator.displayId,
        fans: creator.fans,
        category: creator.category,
        level: creator.level,
        avatarText: creator.avatarText
      },
      creatorName: creator.creatorName,
      platform: creator.platform,
      fans: creator.fans,
      category: creator.category,
      level: creator.level,
      reason: reason.trim(),
      estimatedPrice: price || creator.avgPrice || 0,
      needSample: !!needSample,
      bizOwner: creator.ownerBiz,
      source: '达人库',
      status: '待商家确认',
      createdAt: nowString()
    };

    store.recommendations.unshift(rec);
    updateTaskStatus(taskId);
    saveData();
    renderPage();
    toast('达人推荐成功，等待商家确认');
    return rec;
  }

  function manualRecommend(taskId, creatorObj, reason, estimatedPrice, needSample) {
    const creator = addCreator(creatorObj);
    return recommendCreator(taskId, creator.id, reason, estimatedPrice, needSample);
  }

  function approveRecommendation(recId) {
    const rec = getRecById(recId);
    if (!rec) {
      toast('推荐记录不存在');
      return null;
    }
    if (rec.status !== '待商家确认') {
      toast('该推荐已处理，请勿重复操作');
      return null;
    }

    rec.status = '商家已同意';

    const task = getTaskById(rec.taskId);
    const collab = {
      id: generateId('collab'),
      taskId: rec.taskId,
      recommendationId: rec.id,
      creatorId: rec.creatorId,
      creatorName: rec.creatorName,
      avatarText: rec.creatorSnapshot && rec.creatorSnapshot.avatarText ? rec.creatorSnapshot.avatarText : rec.creatorName.slice(0, 2),
      taskName: task ? task.taskName : '',
      merchantName: task ? task.merchantName : '',
      bizOwner: rec.bizOwner,
      stage: '待商务申请寄样',
      sampleApply: null,
      logistics: null,
      delivery: null,
      revisionNotes: [],
      timeline: [{ time: nowString(), text: '商家同意推荐，对接单创建，当前阶段：待商务申请寄样。' }],
      updatedAt: nowString(),
      deadline: task ? task.deadline : ''
    };

    store.collabs.unshift(collab);
    updateTaskStatus(rec.taskId);
    saveData();
    renderPage();
    toast('已同意推荐，对接单已生成');
    return collab;
  }

  function rejectRecommendation(recId) {
    const rec = getRecById(recId);
    if (!rec) {
      toast('推荐记录不存在');
      return null;
    }
    if (rec.status !== '待商家确认') {
      toast('该推荐已处理，请勿重复操作');
      return null;
    }
    rec.status = '商家已拒绝';
    updateTaskStatus(rec.taskId);
    saveData();
    renderPage();
    toast('已拒绝该推荐');
    return rec;
  }

  function applySample(collabId, sampleApplyObj) {
    const collab = getCollabById(collabId);
    if (!collab) {
      toast('对接单不存在');
      return null;
    }
    if (collab.stage !== '待商务申请寄样') {
      toast('当前阶段不能申请寄样');
      return null;
    }
    if (!sampleApplyObj.receiverName || !sampleApplyObj.receiverName.trim()) {
      toast('请填写收样人姓名');
      return null;
    }
    if (!sampleApplyObj.phone || !sampleApplyObj.phone.trim()) {
      toast('请填写手机号');
      return null;
    }
    if (!sampleApplyObj.address || !sampleApplyObj.address.trim()) {
      toast('请填写详细地址');
      return null;
    }
    collab.sampleApply = {
      receiverName: sampleApplyObj.receiverName.trim(),
      phone: sampleApplyObj.phone.trim(),
      address: sampleApplyObj.address.trim(),
      note: (sampleApplyObj.note || '').trim()
    };
    collab.stage = '待商家寄样';
    addTimeline(collab, '商务提交寄样申请：' + collab.sampleApply.receiverName + '，' + collab.sampleApply.phone);
    saveData();
    renderPage();
    toast('寄样申请已提交');
    return collab;
  }

  function shipSample(collabId, logisticsObj) {
    const collab = getCollabById(collabId);
    if (!collab) {
      toast('对接单不存在');
      return null;
    }
    if (collab.stage !== '待商家寄样') {
      toast('当前阶段不能发货');
      return null;
    }
    if (!logisticsObj.company || !logisticsObj.company.trim()) {
      toast('请填写快递公司');
      return null;
    }
    if (!logisticsObj.trackingNumber || !logisticsObj.trackingNumber.trim()) {
      toast('请填写快递单号');
      return null;
    }
    collab.logistics = {
      company: logisticsObj.company.trim(),
      trackingNumber: logisticsObj.trackingNumber.trim(),
      note: (logisticsObj.note || '').trim()
    };
    collab.stage = '待商务签收';
    addTimeline(collab, '商家寄出样品：' + collab.logistics.company + ' ' + collab.logistics.trackingNumber);
    saveData();
    renderPage();
    toast('物流信息已更新');
    return collab;
  }

  function confirmReceive(collabId) {
    const collab = getCollabById(collabId);
    if (!collab) {
      toast('对接单不存在');
      return null;
    }
    if (collab.stage !== '待商务签收') {
      toast('当前阶段不能签收');
      return null;
    }
    collab.stage = '待商务交付';
    addTimeline(collab, '商务确认签收样品，进入待商务交付阶段。');
    saveData();
    renderPage();
    toast('样品签收成功');
    return collab;
  }

  function submitDelivery(collabId, deliveryObj) {
    const collab = getCollabById(collabId);
    if (!collab) {
      toast('对接单不存在');
      return null;
    }
    if (collab.stage !== '待商务交付') {
      toast('当前阶段不能提交交付');
      return null;
    }
    if (!deliveryObj.title || !deliveryObj.title.trim()) {
      toast('请填写交付标题');
      return null;
    }
    if (!deliveryObj.link || !deliveryObj.link.trim()) {
      toast('请填写交付链接');
      return null;
    }
    if (!isValidUrl(deliveryObj.link.trim())) {
      toast('交付链接必须以 http:// 或 https:// 开头');
      return null;
    }
    if (!deliveryObj.note || !deliveryObj.note.trim()) {
      toast('请填写交付说明');
      return null;
    }
    const publishTime = deliveryObj.publishTime ? new Date(deliveryObj.publishTime) : null;
    if (!publishTime || isNaN(publishTime.getTime())) {
      toast('请选择预计发布时间');
      return null;
    }
    if (publishTime < new Date()) {
      toast('预计发布时间必须晚于当前时间');
      return null;
    }
    collab.delivery = {
      title: deliveryObj.title.trim(),
      link: deliveryObj.link.trim(),
      note: deliveryObj.note.trim(),
      publishTime: deliveryObj.publishTime
    };
    collab.stage = '待商家验收';
    addTimeline(collab, '商务提交交付：' + collab.delivery.title);
    saveData();
    renderPage();
    toast('交付内容已提交，等待商家验收');
    return collab;
  }

  function acceptDelivery(collabId) {
    const collab = getCollabById(collabId);
    if (!collab) {
      toast('对接单不存在');
      return null;
    }
    if (collab.stage !== '待商家验收') {
      toast('当前阶段不能验收通过');
      return null;
    }
    collab.stage = '已完成';
    addTimeline(collab, '商家验收通过，对接完成。');

    const creator = getCreatorById(collab.creatorId);
    if (creator) {
      creator.cooperationCount = (creator.cooperationCount || 0) + 1;
      creator.successCount = (creator.successCount || 0) + 1;
      creator.lastContactAt = nowString();
    }

    updateTaskStatus(collab.taskId);
    saveData();
    renderPage();
    toast('验收通过，合作完成');
    return collab;
  }

  function requestRevision(collabId, note) {
    const collab = getCollabById(collabId);
    if (!collab) {
      toast('对接单不存在');
      return null;
    }
    if (collab.stage !== '待商家验收') {
      toast('当前阶段不能提出修改意见');
      return null;
    }
    if (!note || !note.trim()) {
      toast('请填写修改意见');
      return null;
    }
    if (!collab.revisionNotes) collab.revisionNotes = [];
    collab.revisionNotes.unshift({ note: note.trim(), createdAt: nowString() });
    collab.stage = '待商务交付';
    addTimeline(collab, '商家提出修改意见：' + note.trim());
    saveData();
    renderPage();
    toast('修改意见已提交，已退回商务交付阶段');
    return collab;
  }

  function cancelCollab(collabId) {
    const collab = getCollabById(collabId);
    if (!collab) {
      toast('对接单不存在');
      return null;
    }
    if (collab.stage === '已完成' || collab.stage === '已取消') {
      toast('已完结的对接单不能取消');
      return null;
    }
    collab.stage = '已取消';
    addTimeline(collab, '对接单已取消。');
    updateTaskStatus(collab.taskId);
    saveData();
    renderPage();
    toast('对接单已取消');
    return collab;
  }

  // ===================== 标签与状态展示 =====================
  function statusTagClass(status) {
    if (status === '已完成') return 'ok';
    if (status === '已取消' || status === '商家已拒绝' || status === '黑名单' || status === '暂不合作') return 'gray';
    if (status === '待商家确认' || status === '待推荐达人') return 'primary';
    if (status === '待商务申请寄样' || status === '待商家寄样' || status === '待商务签收') return 'info';
    if (status === '待商务交付') return 'warn';
    if (status === '待商家验收') return 'info';
    if (status === '对接中' || status === '商家已同意' || status === '可合作') return 'ok';
    if (status === '已有推荐') return 'info';
    return 'primary';
  }

  function renderTag(text, cls) {
    return `<span class="tag ${cls || statusTagClass(text)}">${escapeHtml(text)}</span>`;
  }

  const AVATAR_COLORS = ['#60a5fa', '#3b82f6', '#2563eb', '#0ea5e9', '#38bdf8', '#0284c7', '#1d4ed8', '#818cf8'];

  function generateAvatarSvg(seed) {
    const size = 64;
    const cells = 5;
    const cellSize = size / cells;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    const color = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];

    let rects = '';
    for (let i = 0; i < Math.ceil(cells / 2); i++) {
      for (let j = 0; j < cells; j++) {
        const bit = (hash >> ((i * cells + j) % 31)) & 1;
        if (bit) {
          const x = i * cellSize;
          const y = j * cellSize;
          rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`;
          if (i < Math.floor(cells / 2)) {
            const mirrorX = (cells - 1 - i) * cellSize;
            rects += `<rect x="${mirrorX}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`;
          }
        }
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#eff6ff"/>${rects}</svg>`;
    try {
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    } catch (e) {
      return '';
    }
  }

  function renderCreatorAvatar(creator, sizeClass) {
    const text = creator.avatarText || creator.creatorName?.slice(0, 2) || '达人';
    return `<div class="avatar ${sizeClass || ''}" aria-hidden="true" title="${escapeHtml(creator.creatorName || '')}">${escapeHtml(text)}</div>`;
  }

  // ===================== 抽屉详情 =====================
  function openDrawer(type, id) {
    currentDrawer = { type, id };
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    const title = document.getElementById('drawerTitle');
    const sub = document.getElementById('drawerSub');
    const body = document.getElementById('drawerBody');
    const actions = document.querySelector('.drawer-actions');

    if (!drawer || !body) return;

    let html = '';
    let titleText = '';
    let subText = '';
    let actionHtml = '';

    if (type === 'task') {
      const task = getTaskById(id);
      if (!task) {
        toast('数据不存在或已更新，请刷新页面后重试');
        return;
      }
      titleText = task.taskName;
      subText = `${task.merchantName} · ${task.taskType} · 需 ${task.creatorNeedCount} 位达人`;
      html = renderTaskDrawerBody(task);
      actionHtml = renderTaskDrawerActions(task);
    } else if (type === 'creator') {
      const creator = getCreatorById(id);
      if (!creator) {
        toast('数据不存在或已更新，请刷新页面后重试');
        return;
      }
      titleText = creator.creatorName;
      subText = `${creator.platform} · ${creator.displayId} · ${creator.fans} · ${creator.category}`;
      html = renderCreatorDrawerBody(creator);
      actionHtml = renderCreatorDrawerActions(creator);
    } else if (type === 'recommendation') {
      const rec = getRecById(id);
      if (!rec) {
        toast('数据不存在或已更新，请刷新页面后重试');
        return;
      }
      titleText = rec.creatorName + ' 推荐详情';
      subText = `推荐人：${rec.bizOwner} · 来源：${rec.source}`;
      html = renderRecommendationDrawerBody(rec);
      actionHtml = renderRecommendationDrawerActions(rec);
    } else if (type === 'collab') {
      const collab = getCollabById(id);
      if (!collab) {
        toast('数据不存在或已更新，请刷新页面后重试');
        return;
      }
      titleText = collab.creatorName + ' · ' + collab.stage;
      subText = `${collab.id} · ${collab.taskName} · ${collab.merchantName}`;
      html = renderCollabDrawerBody(collab);
      actionHtml = renderCollabDrawerActions(collab);
    } else {
      return;
    }

    if (title) title.textContent = titleText;
    if (sub) sub.textContent = subText;
    body.innerHTML = html;
    if (actions) actions.innerHTML = actionHtml;

    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.classList.add('open');
  }

  function closeDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    if (drawer) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    }
    if (overlay) overlay.classList.remove('open');
    currentDrawer = { type: '', id: '' };
  }

  function renderTaskDrawerBody(task) {
    const recs = getRecommendationsByTask(task.id);
    const collabs = getCollabsByTask(task.id);
    const completed = collabs.filter(c => c.stage === '已完成').length;
    return `
      <div class="info-grid">
        <div class="info"><span>任务状态</span><b>${renderTag(task.status)}</b></div>
        <div class="info"><span>任务类型</span><b>${escapeHtml(task.taskType)}</b></div>
        <div class="info"><span>需求人数</span><b>${completed}/${task.creatorNeedCount}</b></div>
        <div class="info"><span>佣金比例</span><b>${task.commissionRate || 0}%</b></div>
        <div class="info"><span>是否需要样品</span><b>${task.needSample ? '是' : '否'}</b></div>
        <div class="info"><span>截止日期</span><b>${task.deadline}</b></div>
        <div class="info"><span>商家名称</span><b>${escapeHtml(task.merchantName)}</b></div>
        <div class="info"><span>创建时间</span><b>${formatDateTime(task.createdAt)}</b></div>
      </div>
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 8px">合作要求</h4>
        <p style="margin:0;color:var(--muted)">${escapeHtml(task.requirements)}</p>
      </div>
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 12px">推荐达人 (${recs.length})</h4>
        ${recs.length ? recs.map(r => `
          <div class="alert-item" style="margin-bottom:8px" onclick="BDApp.openDrawer('recommendation','${r.id}')">
            ${renderCreatorAvatar(r.creatorSnapshot)}
            <div>
              <b>${escapeHtml(r.creatorName)} · ${escapeHtml(r.platform)} · ${r.fans}</b>
              <small>${renderTag(r.status)} ${escapeHtml(r.bizOwner)} · 报价 ¥${r.estimatedPrice}</small>
            </div>
          </div>
        `).join('') : '<div style="color:var(--muted);font-size:13px">暂无推荐达人</div>'}
      </div>
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 12px">对接单 (${collabs.length})</h4>
        ${collabs.length ? collabs.map(c => `
          <div class="alert-item" style="margin-bottom:8px" onclick="BDApp.openDrawer('collab','${c.id}')">
            ${renderCreatorAvatar(c)}
            <div>
              <b>${escapeHtml(c.creatorName)} · ${escapeHtml(c.stage)}</b>
              <small>${escapeHtml(c.bizOwner)} · 截止 ${c.deadline}</small>
            </div>
          </div>
        `).join('') : '<div style="color:var(--muted);font-size:13px">暂无对接单</div>'}
      </div>
    `;
  }

  function renderTaskDrawerActions(task) {
    const role = getRole();
    let html = '';
    if (role === 'business') {
      html += `<button class="mini-btn" type="button" onclick="BDApp._openRecommendModal('${task.id}')">推荐达人</button>`;
      html += `<button class="mini-btn light" onclick="BDApp._openManualRecommendModal('${task.id}')">手动新增达人并推荐</button>`;
    }
    if (!html) html = `<button class="mini-btn" disabled>无操作权限</button>`;
    return html;
  }

  function renderCreatorDrawerBody(creator) {
    const recs = store.recommendations.filter(r => r.creatorId === creator.id);
    const collabs = store.collabs.filter(c => c.creatorId === creator.id);
    return `
      <div class="card" style="box-shadow:none;display:flex;align-items:center;gap:14px">
        ${renderCreatorAvatar(creator, 'avatar-lg')}
        <div>
          <b style="font-size:18px">${escapeHtml(creator.creatorName)}</b>
          <small style="display:block;color:var(--muted)">${escapeHtml(creator.platform)} · ${escapeHtml(creator.displayId)} · ${creator.fans}</small>
          <div style="margin-top:8px">${renderTag(creator.level)} ${renderTag(creator.category)} ${renderTag(creator.contactStatus)}</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info"><span>商务负责人</span><b>${escapeHtml(creator.ownerBiz)}</b></div>
        <div class="info"><span>平均报价</span><b>¥${creator.avgPrice}</b></div>
        <div class="info"><span>合作次数</span><b>${creator.cooperationCount}</b></div>
        <div class="info"><span>成功次数</span><b>${creator.successCount}</b></div>
        <div class="info"><span>最近联系</span><b>${formatDateTime(creator.lastContactAt) || '未联系'}</b></div>
        <div class="info"><span>标签</span><b>${(creator.tags || []).map(t => escapeHtml(t)).join('、')}</b></div>
      </div>
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 8px">备注</h4>
        <p style="margin:0;color:var(--muted)">${escapeHtml(creator.remark) || '暂无备注'}</p>
      </div>
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 12px">相关推荐 (${recs.length}) / 对接 (${collabs.length})</h4>
        ${collabs.length ? collabs.map(c => `
          <div class="alert-item" style="margin-bottom:8px" onclick="BDApp.openDrawer('collab','${c.id}')">
            <div>
              <b>${escapeHtml(c.taskName)} · ${escapeHtml(c.stage)}</b>
              <small>${formatDateTime(c.updatedAt)}</small>
            </div>
          </div>
        `).join('') : '<div style="color:var(--muted);font-size:13px">暂无对接记录</div>'}
      </div>
    `;
  }

  function renderCreatorDrawerActions(creator) {
    const role = getRole();
    if (role === 'business') {
      return `<button class="mini-btn" type="button" onclick="BDApp._openCreatorEditModal('${creator.id}')">编辑达人</button>
              <button class="ghost" type="button" onclick="BDApp._contactCreator('${creator.id}')">标记已联系</button>`;
    }
    return `<button class="mini-btn" disabled>无操作权限</button>`;
  }

  function renderRecommendationDrawerBody(rec) {
    const task = getTaskById(rec.taskId);
    const collab = getCollabByRecommendation(rec.id);
    return `
      <div class="info-grid">
        <div class="info"><span>推荐状态</span><b>${renderTag(rec.status)}</b></div>
        <div class="info"><span>推荐来源</span><b>${escapeHtml(rec.source)}</b></div>
        <div class="info"><span>商务负责人</span><b>${escapeHtml(rec.bizOwner)}</b></div>
        <div class="info"><span>预估报价</span><b>¥${rec.estimatedPrice}</b></div>
        <div class="info"><span>是否需要样品</span><b>${rec.needSample ? '是' : '否'}</b></div>
        <div class="info"><span>推荐时间</span><b>${formatDateTime(rec.createdAt)}</b></div>
      </div>
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 8px">推荐达人</h4>
        <div style="display:flex;align-items:center;gap:12px">
          ${renderCreatorAvatar(rec.creatorSnapshot)}
          <div>
            <b>${escapeHtml(rec.creatorName)}</b>
            <small style="display:block;color:var(--muted)">${escapeHtml(rec.platform)} · ${rec.fans} · ${rec.category} · ${rec.level}</small>
          </div>
        </div>
      </div>
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 8px">关联任务</h4>
        <p style="margin:0"><b>${escapeHtml(task ? task.taskName : '-')}</b></p>
        <p style="margin:6px 0 0;color:var(--muted);font-size:13px">${escapeHtml(task ? task.merchantName : '')} · ${task ? task.deadline : ''}</p>
      </div>
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 8px">推荐理由</h4>
        <p style="margin:0;color:var(--muted)">${escapeHtml(rec.reason) || '未填写'}</p>
      </div>
      ${collab ? `
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 12px">已生成对接单</h4>
        <div class="alert-item" onclick="BDApp.openDrawer('collab','${collab.id}')">
          <div><b>${escapeHtml(collab.stage)}</b><small>${escapeHtml(collab.bizOwner)} · 更新于 ${formatDateTime(collab.updatedAt)}</small></div>
        </div>
      </div>` : ''}
    `;
  }

  function renderRecommendationDrawerActions(rec) {
    const role = getRole();
    if (rec.status !== '待商家确认') {
      return `<button class="mini-btn" disabled>已处理</button>`;
    }
    if (role === 'merchant') {
      return `<button class="mini-btn ok" onclick="BDApp.approveRecommendation('${rec.id}')">同意推荐</button>
              <button class="mini-btn danger" onclick="BDApp.rejectRecommendation('${rec.id}')">拒绝推荐</button>`;
    }
    return `<button class="mini-btn" disabled>等待商家确认</button>`;
  }

  function renderCollabDrawerBody(collab) {
    const task = getTaskById(collab.taskId);
    const rec = getRecById(collab.recommendationId);
    const stageIndex = COLLAB_STAGES.indexOf(collab.stage);
    const progress = COLLAB_STAGES.slice(0, 6).map((s, i) => {
      let cls = '';
      if (collab.stage === '已取消' && s === collab.stage) cls = 'cancel';
      else if (i < stageIndex && collab.stage !== '已取消') cls = 'done';
      else if (s === collab.stage) cls = 'now';
      return `<div class="flow-node ${cls}">${escapeHtml(s)}</div>`;
    }).join('');

    return `
      <div class="card" style="box-shadow:none">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          ${renderCreatorAvatar(collab)}
          <div>
            <b style="font-size:16px">${escapeHtml(collab.creatorName)}</b>
            <small style="display:block;color:var(--muted)">${escapeHtml(collab.platform || (rec ? rec.platform : ''))} · ${collab.fans || (rec ? rec.fans : '')}</small>
          </div>
        </div>
        <div class="status-flow" style="grid-template-columns:repeat(6,minmax(0,1fr))">${progress}</div>
      </div>
      <div class="info-grid">
        <div class="info"><span>当前阶段</span><b>${renderTag(collab.stage)}</b></div>
        <div class="info"><span>当前处理人</span><b>${escapeHtml(getCurrentHandler(collab))}</b></div>
        <div class="info"><span>下一步动作</span><b>${escapeHtml(getNextActionText(collab))}</b></div>
        <div class="info"><span>截止日期</span><b>${collab.deadline}</b></div>
        <div class="info"><span>商务负责人</span><b>${escapeHtml(collab.bizOwner)}</b></div>
        <div class="info"><span>商家名称</span><b>${escapeHtml(collab.merchantName)}</b></div>
      </div>
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 8px">关联任务</h4>
        <p style="margin:0"><b>${escapeHtml(task ? task.taskName : '-')}</b> · ${renderTag(task ? task.status : '')}</p>
      </div>
      ${collab.sampleApply ? `
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 8px">寄样申请</h4>
        <p style="margin:0;color:var(--muted);font-size:13px"><b>收件人：</b>${escapeHtml(collab.sampleApply.receiverName)} · ${escapeHtml(collab.sampleApply.phone)}</p>
        <p style="margin:6px 0 0;color:var(--muted);font-size:13px"><b>地址：</b>${escapeHtml(collab.sampleApply.address)}</p>
        ${collab.sampleApply.note ? `<p style="margin:6px 0 0;color:var(--muted);font-size:13px"><b>备注：</b>${escapeHtml(collab.sampleApply.note)}</p>` : ''}
      </div>` : ''}
      ${collab.logistics ? `
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 8px">物流信息</h4>
        <p style="margin:0;color:var(--muted);font-size:13px"><b>物流公司：</b>${escapeHtml(collab.logistics.company)}</p>
        <p style="margin:6px 0 0;color:var(--muted);font-size:13px"><b>运单号：</b>${escapeHtml(collab.logistics.trackingNumber)}</p>
        ${collab.logistics.note ? `<p style="margin:6px 0 0;color:var(--muted);font-size:13px"><b>备注：</b>${escapeHtml(collab.logistics.note)}</p>` : ''}
      </div>` : ''}
      ${collab.delivery ? `
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 8px">交付内容</h4>
        <p style="margin:0;color:var(--muted);font-size:13px"><b>标题：</b>${escapeHtml(collab.delivery.title)}</p>
        <p style="margin:6px 0 0;color:var(--muted);font-size:13px"><b>链接：</b><a href="${escapeHtml(collab.delivery.link)}" target="_blank" style="color:var(--primary)">${escapeHtml(collab.delivery.link)}</a></p>
        <p style="margin:6px 0 0;color:var(--muted);font-size:13px"><b>发布时间：</b>${formatDateTime(collab.delivery.publishTime)}</p>
        ${collab.delivery.note ? `<p style="margin:6px 0 0;color:var(--muted);font-size:13px"><b>备注：</b>${escapeHtml(collab.delivery.note)}</p>` : ''}
      </div>` : ''}
      ${collab.revisionNotes && collab.revisionNotes.length ? `
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 12px">修改意见</h4>
        ${collab.revisionNotes.map(r => `
          <div class="log" style="border-left-color:var(--danger)">
            <b>${escapeHtml(r.note)}</b>
            <span>${formatDateTime(r.createdAt)}</span>
          </div>
        `).join('')}
      </div>` : ''}
      <div class="card" style="box-shadow:none">
        <h4 style="margin:0 0 12px">时间线</h4>
        ${collab.timeline && collab.timeline.length ? collab.timeline.map(t => `
          <div class="log">
            <b>${escapeHtml(t.text)}</b>
            <span>${formatDateTime(t.time)}</span>
          </div>
        `).join('') : '<div style="color:var(--muted);font-size:13px">暂无记录</div>'}
      </div>
    `;
  }

  function renderCollabDrawerActions(collab) {
    const role = getRole();
    const stage = collab.stage;
    let buttons = '';

    if (stage === '已完成' || stage === '已取消') {
      return `<button class="mini-btn" disabled>已完结</button>`;
    }

    // 商务可操作
    if (role === 'business') {
      if (stage === '待商务申请寄样') {
        buttons += `<button class="mini-btn" type="button" onclick="BDApp._openApplySampleModal('${collab.id}')">申请寄样</button>`;
      }
      if (stage === '待商务签收') {
        buttons += `<button class="mini-btn" type="button" onclick="BDApp.confirmReceive('${collab.id}')">确认签收</button>`;
      }
      if (stage === '待商务交付') {
        buttons += `<button class="mini-btn" type="button" onclick="BDApp._openSubmitDeliveryModal('${collab.id}')">提交交付</button>`;
      }
      if (stage !== '已完成' && stage !== '已取消') {
        buttons += `<button class="mini-btn danger" onclick="BDApp.cancelCollab('${collab.id}')">取消对接</button>`;
      }
    }

    // 商家可操作
    if (role === 'merchant') {
      if (stage === '待商家寄样') {
        buttons += `<button class="mini-btn" type="button" onclick="BDApp._openShipSampleModal('${collab.id}')">发货</button>`;
      }
      if (stage === '待商家验收') {
        buttons += `<button class="mini-btn ok" onclick="BDApp.acceptDelivery('${collab.id}')">验收通过</button>`;
        buttons += `<button class="mini-btn warn" onclick="BDApp._openRequestRevisionModal('${collab.id}')">退回修改</button>`;
      }
    }

    return buttons || `<button class="mini-btn" disabled>当前角色无操作</button>`;
  }

  // ===================== 弹窗 =====================
  let modalSubmitting = false;

  function lockModalSubmit() {
    modalSubmitting = true;
    const btn = document.getElementById('modalConfirmBtn');
    if (btn) {
      btn.disabled = true;
      if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
      btn.textContent = '提交中...';
    }
  }

  function unlockModalSubmit() {
    modalSubmitting = false;
    const btn = document.getElementById('modalConfirmBtn');
    if (btn) {
      btn.disabled = false;
      if (btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
    }
  }

  function ensureModal() {
    if (document.getElementById('bdModal')) return;
    const div = document.createElement('div');
    div.id = 'bdModalWrap';
    div.innerHTML = `
      <div class="drawer-overlay" id="bdModalOverlay" onclick="BDApp.closeModal()"></div>
      <div class="drawer" id="bdModal" style="width:520px;z-index:40" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="bdModalTitle">
        <div class="drawer-head">
          <div><h3 id="bdModalTitle">弹窗</h3><p id="bdModalSub"></p></div>
          <button class="close" type="button" aria-label="关闭弹窗" onclick="BDApp.closeModal()">×</button>
        </div>
        <div class="drawer-body" id="bdModalBody"></div>
        <div class="drawer-actions" id="bdModalFooter"></div>
      </div>
    `;
    document.body.appendChild(div);

    const style = document.createElement('style');
    style.textContent = `
      #bdModalWrap .drawer-overlay { z-index: 35; }
      #bdModalWrap .drawer { z-index: 40; }
    `;
    document.head.appendChild(style);
  }

  function openModal(title, bodyHtml, footerHtml) {
    ensureModal();
    const modal = document.getElementById('bdModal');
    const overlay = document.getElementById('bdModalOverlay');
    const wrap = document.getElementById('bdModalWrap');
    const titleEl = document.getElementById('bdModalTitle');
    const bodyEl = document.getElementById('bdModalBody');
    const footerEl = document.getElementById('bdModalFooter');

    if (wrap) wrap.style.display = 'block';
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = bodyHtml;
    if (footerEl) footerEl.innerHTML = footerHtml || '';

    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
    if (overlay) overlay.classList.add('open');
  }

  function closeModal() {
    const modal = document.getElementById('bdModal');
    const overlay = document.getElementById('bdModalOverlay');
    const wrap = document.getElementById('bdModalWrap');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
    if (overlay) overlay.classList.remove('open');
    // 避免提交锁状态遗留，导致下一次弹窗确认按钮仍被禁用
    unlockModalSubmit();
    if (wrap) {
      setTimeout(() => {
        if (!modal || !modal.classList.contains('open')) {
          wrap.style.display = 'none';
        }
      }, 300);
    }
  }

  // 内部弹窗：推荐达人
  function _openRecommendModal(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;
    const existingRecCreatorIds = store.recommendations
      .filter(r => r.taskId === taskId)
      .map(r => r.creatorId);
    const candidates = store.creators.filter(c => !existingRecCreatorIds.includes(c.id));

    const body = `
      <p style="margin:0 0 12px;color:var(--muted);font-size:13px">任务：${escapeHtml(task.taskName)}</p>
      <div class="input-group" style="display:grid;gap:12px">
        <div>
          <label class="form-label" for="recCreatorId">选择达人</label>
          <select class="select" id="recCreatorId" aria-label="选择达人">
            ${candidates.map(c => `<option value="${c.id}">${escapeHtml(c.creatorName)} · ${escapeHtml(c.platform)} · ${c.fans} · ${escapeHtml(c.ownerBiz)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label" for="recReason">推荐理由</label>
          <textarea class="textarea" id="recReason" aria-label="推荐理由" placeholder="请填写推荐理由"></textarea>
        </div>
        <div>
          <label class="form-label" for="recPrice">预估报价</label>
          <input class="input" type="number" id="recPrice" aria-label="预估报价" placeholder="预估报价" />
        </div>
        <div>
          <label class="checkbox-row">
            <input type="checkbox" id="recNeedSample" ${task.needSample ? 'checked' : ''} /> 需要寄样
          </label>
        </div>
      </div>
    `;
    const footer = `
      <button class="ghost" type="button" onclick="BDApp.closeModal()">取消</button>
      <button class="mini-btn" type="button" id="modalConfirmBtn" onclick="BDApp._submitRecommend('${taskId}')">确认推荐</button>
    `;
    openModal('推荐达人', body, footer);
  }

  function _submitRecommend(taskId) {
    if (modalSubmitting) return;
    lockModalSubmit();
    const creatorId = document.getElementById('recCreatorId')?.value;
    const reason = document.getElementById('recReason')?.value;
    const price = document.getElementById('recPrice')?.value;
    const needSample = document.getElementById('recNeedSample')?.checked;
    if (!creatorId) {
      toast('请选择达人');
      unlockModalSubmit();
      return;
    }
    const result = recommendCreator(taskId, creatorId, reason, price, needSample);
    if (result) closeModal();
    else unlockModalSubmit();
  }

  // 内部弹窗：手动新增达人并推荐
  function _openManualRecommendModal(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;
    const body = `
      <p style="margin:0 0 12px;color:var(--muted);font-size:13px">任务：${escapeHtml(task.taskName)}</p>
      <div style="display:grid;gap:12px">
        <input class="input" id="manCreatorName" aria-label="达人名称" placeholder="达人名称" />
        <select class="select" id="manPlatform" aria-label="平台">${PLATFORMS.map(p => `<option value="${p}">${p}</option>`).join('')}</select>
        <input class="input" id="manDisplayId" aria-label="平台账号" placeholder="平台账号" />
        <input class="input" id="manFans" aria-label="粉丝数" placeholder="粉丝数，例如 10万" />
        <select class="select" id="manCategory" aria-label="达人类目">${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
        <select class="select" id="manLevel" aria-label="达人等级">${LEVELS.map(l => `<option value="${l}">${l}</option>`).join('')}</select>
        <input class="input" id="manAvgPrice" type="number" aria-label="平均报价" placeholder="平均报价" />
        <select class="select" id="manOwnerBiz" aria-label="归属商务">${BIZ_OWNERS.map(b => `<option value="${b}">${b}</option>`).join('')}</select>
        <textarea class="textarea" id="manReason" aria-label="推荐理由" placeholder="推荐理由"></textarea>
        <input class="input" id="manPrice" type="number" aria-label="本次预估报价" placeholder="本次预估报价" />
        <label class="checkbox-row"><input type="checkbox" id="manNeedSample" ${task.needSample ? 'checked' : ''} /> 需要寄样</label>
      </div>
    `;
    const footer = `
      <button class="ghost" type="button" onclick="BDApp.closeModal()">取消</button>
      <button class="mini-btn" type="button" id="modalConfirmBtn" onclick="BDApp._submitManualRecommend('${taskId}')">新增并推荐</button>
    `;
    openModal('手动新增达人并推荐', body, footer);
  }

  function _submitManualRecommend(taskId) {
    if (modalSubmitting) return;
    lockModalSubmit();
    const creatorObj = {
      creatorName: document.getElementById('manCreatorName')?.value,
      platform: document.getElementById('manPlatform')?.value,
      displayId: document.getElementById('manDisplayId')?.value,
      fans: document.getElementById('manFans')?.value,
      category: document.getElementById('manCategory')?.value,
      level: document.getElementById('manLevel')?.value,
      avgPrice: document.getElementById('manAvgPrice')?.value,
      ownerBiz: document.getElementById('manOwnerBiz')?.value,
      contactStatus: '已联系'
    };
    if (!creatorObj.creatorName || !creatorObj.creatorName.trim()) {
      toast('请填写达人名称');
      unlockModalSubmit();
      return;
    }
    const reason = document.getElementById('manReason')?.value;
    const price = document.getElementById('manPrice')?.value;
    const needSample = document.getElementById('manNeedSample')?.checked;
    if (!reason || !reason.trim()) {
      toast('请填写推荐理由');
      unlockModalSubmit();
      return;
    }
    const result = manualRecommend(taskId, creatorObj, reason, price, needSample);
    if (result) closeModal();
    else unlockModalSubmit();
  }

  // 内部弹窗：申请寄样
  function _openApplySampleModal(collabId) {
    const collab = getCollabById(collabId);
    if (!collab) return;
    const body = `
      <div style="display:grid;gap:12px">
        <input class="input" id="sampleName" aria-label="收件人姓名" placeholder="收件人姓名" value="${collab.sampleApply ? escapeHtml(collab.sampleApply.receiverName) : ''}" />
        <input class="input" id="samplePhone" aria-label="手机号" placeholder="手机号" value="${collab.sampleApply ? escapeHtml(collab.sampleApply.phone) : ''}" />
        <textarea class="textarea" id="sampleAddress" aria-label="详细地址" placeholder="详细地址">${collab.sampleApply ? escapeHtml(collab.sampleApply.address) : ''}</textarea>
        <textarea class="textarea" id="sampleNote" aria-label="备注" placeholder="备注">${collab.sampleApply ? escapeHtml(collab.sampleApply.note) : ''}</textarea>
      </div>
    `;
    const footer = `
      <button class="ghost" type="button" onclick="BDApp.closeModal()">取消</button>
      <button class="mini-btn" type="button" id="modalConfirmBtn" onclick="BDApp._submitApplySample('${collabId}')">提交申请</button>
    `;
    openModal('申请寄样', body, footer);
  }

  function _submitApplySample(collabId) {
    if (modalSubmitting) return;
    lockModalSubmit();
    const sampleApplyObj = {
      receiverName: document.getElementById('sampleName')?.value,
      phone: document.getElementById('samplePhone')?.value,
      address: document.getElementById('sampleAddress')?.value,
      note: document.getElementById('sampleNote')?.value
    };
    const result = applySample(collabId, sampleApplyObj);
    if (result) closeModal();
    else unlockModalSubmit();
  }

  // 内部弹窗：商家发货
  function _openShipSampleModal(collabId) {
    const body = `
      <div style="display:grid;gap:12px">
        <input class="input" id="shipCompany" aria-label="物流公司" placeholder="物流公司" />
        <input class="input" id="shipTracking" aria-label="运单号" placeholder="运单号" />
        <textarea class="textarea" id="shipNote" aria-label="备注" placeholder="备注"></textarea>
      </div>
    `;
    const footer = `
      <button class="ghost" type="button" onclick="BDApp.closeModal()">取消</button>
      <button class="mini-btn" type="button" id="modalConfirmBtn" onclick="BDApp._submitShipSample('${collabId}')">确认发货</button>
    `;
    openModal('填写物流信息', body, footer);
  }

  function _submitShipSample(collabId) {
    if (modalSubmitting) return;
    lockModalSubmit();
    const logisticsObj = {
      company: document.getElementById('shipCompany')?.value,
      trackingNumber: document.getElementById('shipTracking')?.value,
      note: document.getElementById('shipNote')?.value
    };
    const result = shipSample(collabId, logisticsObj);
    if (result) closeModal();
    else unlockModalSubmit();
  }

  // 内部弹窗：提交交付
  function _openSubmitDeliveryModal(collabId) {
    const body = `
      <div style="display:grid;gap:12px">
        <input class="input" id="deliveryTitle" aria-label="交付标题" placeholder="交付标题" />
        <input class="input" id="deliveryLink" aria-label="作品链接" placeholder="作品链接" />
        <input class="input" type="datetime-local" id="deliveryTime" aria-label="预计发布时间" />
        <textarea class="textarea" id="deliveryNote" aria-label="交付备注" placeholder="备注"></textarea>
      </div>
    `;
    const footer = `
      <button class="ghost" type="button" onclick="BDApp.closeModal()">取消</button>
      <button class="mini-btn" type="button" id="modalConfirmBtn" onclick="BDApp._submitDelivery('${collabId}')">提交交付</button>
    `;
    openModal('提交交付内容', body, footer);
  }

  function _submitDelivery(collabId) {
    if (modalSubmitting) return;
    lockModalSubmit();
    const deliveryObj = {
      title: document.getElementById('deliveryTitle')?.value,
      link: document.getElementById('deliveryLink')?.value,
      note: document.getElementById('deliveryNote')?.value,
      publishTime: document.getElementById('deliveryTime')?.value
    };
    const result = submitDelivery(collabId, deliveryObj);
    if (result) closeModal();
    else unlockModalSubmit();
  }

  // 内部弹窗：退回修改
  function _openRequestRevisionModal(collabId) {
    const body = `
      <textarea class="textarea" id="revisionNote" aria-label="修改意见" placeholder="请填写修改意见"></textarea>
    `;
    const footer = `
      <button class="ghost" type="button" onclick="BDApp.closeModal()">取消</button>
      <button class="mini-btn warn" type="button" id="modalConfirmBtn" onclick="BDApp._submitRevision('${collabId}')">确认退回</button>
    `;
    openModal('退回修改', body, footer);
  }

  function _submitRevision(collabId) {
    if (modalSubmitting) return;
    lockModalSubmit();
    const note = document.getElementById('revisionNote')?.value;
    const result = requestRevision(collabId, note);
    if (result) closeModal();
    else unlockModalSubmit();
  }

  // 内部弹窗：从达人库推荐到达人任务
  function _openRecommendToTaskModal(creatorId) {
    const creator = getCreatorById(creatorId);
    if (!creator) return;
    const validTasks = store.tasks.filter(t => t.status === '待推荐达人' || t.status === '已有推荐');
    const recTaskIds = store.recommendations
      .filter(r => r.creatorId === creatorId)
      .map(r => r.taskId);
    const candidates = validTasks.filter(t => !recTaskIds.includes(t.id));

    if (!candidates.length) {
      toast('暂无可推荐的任务');
      return;
    }

    const body = `
      <p style="margin:0 0 12px;color:var(--muted);font-size:13px">达人：${escapeHtml(creator.creatorName)} · ${escapeHtml(creator.platform)} · ${creator.fans}</p>
      <div style="display:grid;gap:12px">
        <div>
          <label class="form-label" for="recToTaskId">选择任务</label>
          <select class="select" id="recToTaskId">
            ${candidates.map(t => `<option value="${t.id}">${escapeHtml(t.taskName)} · ${escapeHtml(t.merchantName)} · 截止 ${t.deadline}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label" for="recToReason">推荐理由</label>
          <textarea class="textarea" id="recToReason" aria-label="推荐理由" placeholder="请填写推荐理由"></textarea>
        </div>
        <div>
          <label class="form-label" for="recToPrice">预估报价</label>
          <input class="input" type="number" id="recToPrice" aria-label="预估报价" placeholder="预估报价" value="${creator.avgPrice || ''}" />
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="recToNeedSample" checked />
          <span>需要寄样</span>
        </div>
      </div>
    `;
    const footer = `
      <button class="ghost" type="button" onclick="BDApp.closeModal()">取消</button>
      <button class="mini-btn" type="button" id="modalConfirmBtn" onclick="BDApp._submitRecommendToTask('${creatorId}')">确认推荐</button>
    `;
    openModal('推荐到任务', body, footer);
  }

  function _submitRecommendToTask(creatorId) {
    if (modalSubmitting) return;
    lockModalSubmit();
    const taskId = document.getElementById('recToTaskId')?.value;
    const reason = document.getElementById('recToReason')?.value;
    const price = document.getElementById('recToPrice')?.value;
    const needSample = document.getElementById('recToNeedSample')?.checked;
    if (!taskId) {
      toast('请选择任务');
      unlockModalSubmit();
      return;
    }
    const result = recommendCreator(taskId, creatorId, reason, price, needSample);
    if (result) closeModal();
    else unlockModalSubmit();
  }

  // 内部弹窗：新增达人
  function _openAddCreatorModal() {
    const body = `
      <div class="form-grid">
        <div>
          <label class="form-label" for="addCreatorName">达人昵称</label>
          <input class="input" id="addCreatorName" aria-label="达人昵称" placeholder="达人昵称" />
        </div>
        <div>
          <label class="form-label" for="addPlatform">平台</label>
          <select class="select" id="addPlatform" aria-label="平台">${PLATFORMS.map(p => `<option value="${p}">${p}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label" for="addDisplayId">平台账号</label>
          <input class="input" id="addDisplayId" aria-label="平台账号" placeholder="平台账号" />
        </div>
        <div>
          <label class="form-label" for="addFans">粉丝量</label>
          <input class="input" id="addFans" aria-label="粉丝量" placeholder="例如 10万" />
        </div>
        <div>
          <label class="form-label" for="addCategory">达人类目</label>
          <select class="select" id="addCategory" aria-label="达人类目">${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label" for="addLevel">达人等级</label>
          <select class="select" id="addLevel" aria-label="达人等级">${LEVELS.map(l => `<option value="${l}">${l}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label" for="addContactStatus">合作状态</label>
          <select class="select" id="addContactStatus" aria-label="合作状态">${Object.values(CONTACT_STATUS).map(s => `<option value="${s}">${s}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label" for="addAvgPrice">预估合作价格</label>
          <input class="input" type="number" id="addAvgPrice" aria-label="预估合作价格" placeholder="预估合作价格" />
        </div>
        <div>
          <label class="form-label" for="addOwnerBiz">归属商务</label>
          <select class="select" id="addOwnerBiz" aria-label="归属商务">${BIZ_OWNERS.map(b => `<option value="${b}">${b}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label" for="addTags">标签</label>
          <input class="input" id="addTags" aria-label="标签" placeholder="用空格分隔多个标签" />
        </div>
        <div class="full">
          <label class="form-label" for="addRemark">备注</label>
          <textarea class="textarea" id="addRemark" aria-label="备注" placeholder="备注"></textarea>
        </div>
      </div>
    `;
    const footer = `
      <button class="ghost" type="button" onclick="BDApp.closeModal()">取消</button>
      <button class="mini-btn" type="button" id="modalConfirmBtn" onclick="BDApp._submitAddCreator()">保存</button>
    `;
    openModal('新增达人', body, footer);
  }

  function _submitAddCreator() {
    if (modalSubmitting) return;
    lockModalSubmit();
    const tags = document.getElementById('addTags')?.value?.split(/\s+/).filter(Boolean) || [];
    const creatorObj = {
      creatorName: document.getElementById('addCreatorName')?.value,
      platform: document.getElementById('addPlatform')?.value,
      displayId: document.getElementById('addDisplayId')?.value,
      fans: document.getElementById('addFans')?.value,
      category: document.getElementById('addCategory')?.value,
      level: document.getElementById('addLevel')?.value,
      contactStatus: document.getElementById('addContactStatus')?.value,
      avgPrice: document.getElementById('addAvgPrice')?.value,
      ownerBiz: document.getElementById('addOwnerBiz')?.value,
      tags: tags,
      remark: document.getElementById('addRemark')?.value
    };
    const result = addCreator(creatorObj);
    if (result) closeModal();
    else unlockModalSubmit();
  }

  // 内部弹窗：发布任务
  function _openCreateTaskModal() {
    const body = `
      <div class="form-grid">
        <div>
          <label class="form-label" for="newTaskName">任务名称</label>
          <input class="input" id="newTaskName" aria-label="任务名称" placeholder="任务名称" />
        </div>
        <div>
          <label class="form-label" for="newProductName">商品名称</label>
          <input class="input" id="newProductName" aria-label="商品名称" placeholder="商品名称" />
        </div>
        <div>
          <label class="form-label" for="newTaskType">任务类型</label>
          <select class="select" id="newTaskType" aria-label="任务类型">${TASK_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label" for="newNeedCount">需求达人数量</label>
          <input class="input" type="number" id="newNeedCount" aria-label="需求达人数量" value="1" />
        </div>
        <div>
          <label class="form-label" for="newCommissionRate">佣金比例 (%)</label>
          <input class="input" type="number" id="newCommissionRate" aria-label="佣金比例" value="0" />
        </div>
        <div>
          <label class="form-label" for="newDeadline">截止时间</label>
          <input class="input" type="date" id="newDeadline" aria-label="截止时间" />
        </div>
        <div class="full checkbox-row">
          <input type="checkbox" id="newNeedSample" checked />
          <span>是否需要寄样</span>
        </div>
        <div class="full">
          <label class="form-label" for="newRequirements">发布要求</label>
          <textarea class="textarea" id="newRequirements" aria-label="发布要求" placeholder="请填写对达人和内容的要求"></textarea>
        </div>
      </div>
    `;
    const footer = `
      <button class="ghost" type="button" onclick="BDApp.closeModal()">取消</button>
      <button class="mini-btn" type="button" id="modalConfirmBtn" onclick="BDApp._submitCreateTask()">确认发布</button>
    `;
    openModal('发布新任务', body, footer);
  }

  function _submitCreateTask() {
    if (modalSubmitting) return;
    lockModalSubmit();
    const taskObj = {
      taskName: document.getElementById('newTaskName')?.value,
      productName: document.getElementById('newProductName')?.value,
      taskType: document.getElementById('newTaskType')?.value,
      creatorNeedCount: document.getElementById('newNeedCount')?.value,
      commissionRate: document.getElementById('newCommissionRate')?.value,
      needSample: document.getElementById('newNeedSample')?.checked,
      deadline: document.getElementById('newDeadline')?.value,
      requirements: document.getElementById('newRequirements')?.value,
      merchantName: '当前商家'
    };
    const result = createTask(taskObj);
    if (result) closeModal();
    else unlockModalSubmit();
  }

  // 内部弹窗：编辑达人
  function _openCreatorEditModal(creatorId) {
    const creator = getCreatorById(creatorId);
    if (!creator) return;
    const body = `
      <div style="display:grid;gap:12px">
        <input class="input" id="editCreatorName" value="${escapeHtml(creator.creatorName)}" aria-label="达人名称" placeholder="达人名称" />
        <select class="select" id="editPlatform" aria-label="平台">${PLATFORMS.map(p => `<option value="${p}" ${creator.platform === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
        <input class="input" id="editDisplayId" value="${escapeHtml(creator.displayId)}" aria-label="平台账号" placeholder="平台账号" />
        <input class="input" id="editFans" value="${escapeHtml(creator.fans)}" aria-label="粉丝数" placeholder="粉丝数" />
        <select class="select" id="editCategory" aria-label="达人类目">${CATEGORIES.map(c => `<option value="${c}" ${creator.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
        <select class="select" id="editLevel" aria-label="达人等级">${LEVELS.map(l => `<option value="${l}" ${creator.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select class="select" id="editContactStatus" aria-label="合作状态">${Object.values(CONTACT_STATUS).map(s => `<option value="${s}" ${creator.contactStatus === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <input class="input" id="editAvgPrice" type="number" value="${creator.avgPrice}" aria-label="平均报价" placeholder="平均报价" />
        <select class="select" id="editOwnerBiz" aria-label="归属商务">${BIZ_OWNERS.map(b => `<option value="${b}" ${creator.ownerBiz === b ? 'selected' : ''}>${b}</option>`).join('')}</select>
        <textarea class="textarea" id="editRemark" aria-label="备注" placeholder="备注">${escapeHtml(creator.remark)}</textarea>
      </div>
    `;
    const footer = `
      <button class="ghost" type="button" onclick="BDApp.closeModal()">取消</button>
      <button class="mini-btn" type="button" id="modalConfirmBtn" onclick="BDApp._submitCreatorEdit('${creatorId}')">保存</button>
    `;
    openModal('编辑达人', body, footer);
  }

  function _submitCreatorEdit(creatorId) {
    if (modalSubmitting) return;
    lockModalSubmit();
    const creator = getCreatorById(creatorId);
    if (!creator) {
      toast('达人不存在');
      unlockModalSubmit();
      return;
    }
    const creatorName = document.getElementById('editCreatorName')?.value;
    if (!creatorName || !creatorName.trim()) {
      toast('请填写达人名称');
      unlockModalSubmit();
      return;
    }
    creator.creatorName = creatorName.trim();
    creator.platform = document.getElementById('editPlatform')?.value || creator.platform;
    creator.displayId = document.getElementById('editDisplayId')?.value || creator.displayId;
    creator.fans = document.getElementById('editFans')?.value || creator.fans;
    creator.category = document.getElementById('editCategory')?.value || creator.category;
    creator.level = document.getElementById('editLevel')?.value || creator.level;
    creator.contactStatus = document.getElementById('editContactStatus')?.value || creator.contactStatus;
    creator.avgPrice = Number(document.getElementById('editAvgPrice')?.value) || creator.avgPrice;
    creator.ownerBiz = document.getElementById('editOwnerBiz')?.value || creator.ownerBiz;
    creator.remark = document.getElementById('editRemark')?.value || creator.remark;
    creator.avatarText = creator.creatorName.slice(0, 2);
    saveData();
    renderPage();
    toast('达人信息已保存');
    closeModal();
    if (currentDrawer.type === 'creator' && currentDrawer.id === creatorId) {
      openDrawer('creator', creatorId);
    }
  }

  function _contactCreator(creatorId) {
    const creator = getCreatorById(creatorId);
    if (!creator) return;
    creator.contactStatus = '已联系';
    creator.lastContactAt = nowString();
    saveData();
    renderPage();
    toast('已标记为已联系');
    if (currentDrawer.type === 'creator' && currentDrawer.id === creatorId) {
      openDrawer('creator', creatorId);
    }
  }

  // ===================== 页面渲染 =====================
  function detectPage() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path.endsWith('/')) return 'index';
    if (path.includes('tasks.html')) return 'tasks';
    if (path.includes('creators.html')) return 'creators';
    if (path.includes('recommendations.html')) return 'recommendations';
    if (path.includes('collabs.html')) return 'collabs';
    if (path.includes('demo.html')) return 'demo';
    if (path.includes('kanban.html')) return 'kanban';
    if (path.includes('alerts.html')) return 'alerts';
    if (path.includes('stats.html')) return 'stats';
    return 'index';
  }

  function renderPage() {
    const page = detectPage();
    switch (page) {
      case 'index': renderOverview(); break;
      case 'tasks': renderTasks(); break;
      case 'creators': renderCreators(); break;
      case 'recommendations': renderRecommendations(); break;
      case 'collabs': renderCollabs(); break;
      case 'kanban': renderKanban(); break;
      case 'alerts': renderAlerts(); break;
      case 'stats': renderStats(); break;
      case 'demo': renderRoleSwitcher(); break;
      default: renderOverview();
    }
    setNavActive(page);
  }

  function setNavActive(page) {
    const map = {
      index: 'nav-overview',
      collabs: 'nav-collabs',
      kanban: 'nav-kanban',
      alerts: 'nav-alerts',
      stats: 'nav-stats',
      tasks: 'nav-tasks',
      creators: 'nav-creators',
      recommendations: 'nav-recommendations',
      demo: 'nav-demo'
    };
    document.querySelectorAll('.nav a, .nav button').forEach(el => {
      el.classList.remove('active');
      el.removeAttribute('aria-current');
    });
    const id = map[page];
    if (id) {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('active');
        el.setAttribute('aria-current', 'page');
      }
    }
  }

  // ===================== 总览页 =====================
  function renderOverview() {
    renderRoleSwitcher();
    renderOverviewMetrics();
    renderFlowDiagram();
    renderKanbanPreview();
    renderOverviewAlerts();
    renderOverviewStatsPreview();
  }

  function renderOverviewMetrics() {
    const el = document.getElementById('metrics');
    if (!el) return;
    const s = getOverviewStats();
    el.innerHTML = `
      <div class="card metric"><span>任务总数</span><b>${s.totalTasks}</b><small>含已完成与进行中</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg></div></div>
      <div class="card metric info"><span>达人库总数</span><b>${s.totalCreators}</b><small>企业沉淀达人资源</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div></div>
      <div class="card metric warn"><span>待确认推荐</span><b>${s.pendingRecs}</b><small>等待商家审批</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div></div>
      <div class="card metric ok"><span>对接中合作</span><b>${s.activeCollabs}</b><small>已进入对接单流程</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div></div>
      <div class="card metric primary"><span>待申请寄样</span><b>${s.pendingApplySample}</b><small>商务需提交寄样地址</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div></div>
      <div class="card metric primary"><span>待商家寄样</span><b>${s.pendingShipSample}</b><small>商家需填写物流发货</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div></div>
      <div class="card metric info"><span>待商务签收</span><b>${s.pendingReceive}</b><small>等待商务确认签收</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div></div>
      <div class="card metric warn"><span>待商务交付</span><b>${s.pendingDeliver}</b><small>商务需提交内容</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div></div>
      <div class="card metric info"><span>待商家验收</span><b>${s.pendingAccept}</b><small>商家需验收交付</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg></div></div>
      <div class="card metric ok"><span>已完成合作</span><b>${s.completedCollabs}</b><small>可进入复盘归档</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></div></div>
    `;
  }

  function renderFlowDiagram() {
    const el = document.getElementById('flowDiagram');
    if (!el) return;
    const steps = [
      { num: 1, text: '商家发布任务', cls: 'merchant' },
      { num: 2, text: '商务筛选达人', cls: 'business' },
      { num: 3, text: '商务推荐达人', cls: 'business' },
      { num: 4, text: '商家同意推荐', cls: 'merchant' },
      { num: 5, text: '商务申请寄样', cls: 'business' },
      { num: 6, text: '商家寄样', cls: 'merchant' },
      { num: 7, text: '商务签收', cls: 'business' },
      { num: 8, text: '商务交付', cls: 'business' },
      { num: 9, text: '商家验收', cls: 'finish' }
    ];
    el.innerHTML = steps.map(s => `
      <div class="flow-step ${s.cls}">
        <div class="step-num">${s.num}</div>
        ${escapeHtml(s.text)}
      </div>
    `).join('');
  }

  function renderKanbanPreview() {
    const el = document.getElementById('kanbanPreview');
    if (!el) return;
    const groups = KANBAN_GROUPS;
    el.innerHTML = groups.map(group => {
      const items = store.collabs.filter(c => group.items.includes(c.stage));
      return `
        <div class="card" style="padding:14px">
          <h4 style="margin:0 0 10px;display:flex;justify-content:space-between;align-items:center;font-size:14px">${group.title}<span class="tag gray">${items.length}</span></h4>
          <div style="display:grid;gap:8px">
            ${items.slice(0, 3).map(item => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#f8fafc;border-radius:10px;font-size:13px;gap:8px">
                <span style="display:flex;align-items:center;gap:8px;min-width:0">${renderCreatorAvatar(item, 'avatar-sm')}<b>${escapeHtml(item.creatorName)}</b> · ${escapeHtml(item.bizOwner)}</span>
                ${renderTag(item.stage)}
              </div>
            `).join('') || '<div style="color:var(--muted);font-size:13px;text-align:center;padding:10px">暂无</div>'}
          </div>
          ${items.length > 3 ? `<div style="text-align:center;margin-top:8px"><a href="kanban.html" style="font-size:12px;color:var(--primary);font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px">查看全部 ${items.length} 个<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></a></div>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderOverviewAlerts() {
    const focusList = document.getElementById('focusList');
    if (!focusList) return;

    const alerts = getAlerts();
    const focusItems = [
      {
        icon: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        title: '待商家确认推荐',
        desc: `${alerts.pendingConfirmations.length} 位达人等待商家审批`,
        count: alerts.pendingConfirmations.length,
        action: "BDApp._openFocus('recommendations')"
      },
      {
        icon: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
        title: '待商务申请寄样',
        desc: `${alerts.pendingSamples.length} 个对接单需商务提交寄样地址`,
        count: alerts.pendingSamples.length,
        action: "BDApp._openFocus('collabs')"
      },
      {
        icon: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
        title: '待商家寄样',
        desc: `${alerts.pendingShipments.length} 个对接单等待商家发货`,
        count: alerts.pendingShipments.length,
        action: "BDApp._openFocus('collabs')"
      },
      {
        icon: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
        title: '待商务交付',
        desc: `${alerts.pendingDeliveries.length} 个对接单需商务提交内容`,
        count: alerts.pendingDeliveries.length,
        action: "BDApp._openFocus('collabs')"
      },
      {
        icon: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
        title: '待商家验收',
        desc: `${alerts.pendingAcceptances.length} 个对接单等待商家验收`,
        count: alerts.pendingAcceptances.length,
        action: "BDApp._openFocus('collabs')"
      },
      {
        icon: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        title: '逾期或久未推进',
        desc: `${alerts.overdue.length + alerts.stale.length} 个异常事项需要关注`,
        count: alerts.overdue.length + alerts.stale.length,
        action: "BDApp._openFocus('alerts')"
      }
    ];

    focusList.innerHTML = focusItems.map(item => `
      <div class="focus-item" onclick="${item.action}">
        <div class="focus-icon">${item.icon}</div>
        <div class="focus-main">
          <b>${escapeHtml(item.title)}</b>
          <small>${escapeHtml(item.desc)}</small>
        </div>
        ${item.count > 0 ? `<div class="focus-count">${item.count}</div>` : ''}
      </div>
    `).join('');
  }

  function _openFocus(page) {
    const map = {
      recommendations: 'recommendations.html',
      collabs: 'collabs.html',
      alerts: 'alerts.html'
    };
    if (map[page]) window.location.href = map[page];
  }

  function renderOverviewStatsPreview() {
    const el = document.getElementById('statsPreview');
    if (!el) return;
    const stats = getBizStats();
    el.innerHTML = stats.slice(0, 4).map(s => {
      const pct = s.totalCollabs ? Math.round((s.completedCollabs / s.totalCollabs) * 100) : 0;
      return `
        <div class="bar-row">
          <b>${escapeHtml(s.bizOwner)}</b>
          <div class="bar"><i style="width:${Math.max(8, pct)}%"></i></div>
          <span>${pct}%</span>
        </div>
        <small style="display:block;color:var(--muted);margin:-6px 0 10px 88px">对接 ${s.totalCollabs} 个，完成 ${s.completedCollabs} 个</small>
      `;
    }).join('') || '<div class="empty-state"><b>暂无数据</b></div>';
  }

  function renderRoleSwitcher() {
    const el = document.getElementById('roleSwitcher');
    if (!el) return;
    const roleLabels = { merchant: '商家', business: '商务', supervisor: '主管' };
    el.innerHTML = `
      <span class="role-label">当前视角：${roleLabels[getRole()]}</span>
      <div class="role-btns">
        ${Object.entries(roleLabels).map(([role, label]) => `
          <button class="role-btn ${getRole() === role ? 'active' : ''}" type="button" onclick="BDApp.setRole('${role}')">${label}</button>
        `).join('')}
      </div>
      <button class="reset-demo-btn" type="button" onclick="BDApp.resetDemoData()" title="恢复初始演示数据"><svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>重置演示数据</button>
    `;
  }

  // ===================== 任务页 =====================
  function renderTasks() {
    renderRoleSwitcher();
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) addTaskBtn.style.display = getRole() === 'merchant' ? '' : 'none';
    const container = document.getElementById('taskList') || document.getElementById('tableBody');
    if (!container) return;
    const isTable = container.tagName === 'TBODY';
    const role = getRole();

    const qEl = document.getElementById('q');
    const q = qEl ? qEl.value.trim().toLowerCase() : '';

    let list = store.tasks.filter(task => {
      const text = `${task.taskName} ${task.productName} ${task.merchantName} ${task.taskType}`.toLowerCase();
      return !q || text.includes(q);
    });

    const rows = list.map(task => {
      const recCount = getRecommendCountForTask(task.id);
      const approvedCount = getApprovedCountForTask(task.id);
      const completed = getCollabsByTask(task.id).filter(c => c.stage === '已完成').length;
      const nextAction = getTaskNextAction(task);

      let actionBtns = '';
      if (role === 'business') {
        if (task.status === '待推荐达人' || task.status === '已有推荐') {
          actionBtns += `<button class="mini-btn" type="button" onclick="event.stopPropagation();BDApp._openRecommendModal('${task.id}')">推荐达人</button>`;
          actionBtns += `<button class="mini-btn light" onclick="event.stopPropagation();BDApp._openManualRecommendModal('${task.id}')">手动新增</button>`;
        }
      }

      if (isTable) {
        return `
          <tr onclick="BDApp.openDrawer('task','${task.id}')">
            <td><b>${escapeHtml(task.taskName)}</b><br/><small style="color:var(--muted)">${escapeHtml(task.productName)}</small></td>
            <td>${escapeHtml(task.taskType)}</td>
            <td>${task.creatorNeedCount}</td>
            <td>${recCount}</td>
            <td>${approvedCount}</td>
            <td>${renderTag(task.status)}</td>
            <td>${task.deadline}</td>
            <td><small style="color:var(--muted)">${escapeHtml(nextAction)}</small></td>
            <td>
              <div class="action-btns">
                <button class="mini-btn light" onclick="event.stopPropagation();BDApp.openDrawer('task','${task.id}')">详情</button>
                ${actionBtns}
              </div>
            </td>
          </tr>
        `;
      }
      return `
        <div class="alert-item" onclick="BDApp.openDrawer('task','${task.id}')">
          <div>
            <b>${escapeHtml(task.taskName)}</b>
            <small>${escapeHtml(task.taskType)} · ${escapeHtml(task.merchantName)} · ${renderTag(task.status)} · 推荐 ${recCount} / 同意 ${approvedCount}</small>
          </div>
          ${actionBtns ? `<div class="action-btns" onclick="event.stopPropagation()">${actionBtns}</div>` : ''}
        </div>
      `;
    }).join('');

    if (isTable) {
      container.innerHTML = rows || '<tr><td colspan="9"><div class="empty-state"><b>暂无任务</b></div></td></tr>';
    } else {
      container.innerHTML = rows || '<div class="empty-state"><b>暂无任务</b></div>';
    }
  }

  // ===================== 达人库页 =====================
  function renderCreators() {
    renderRoleSwitcher();
    const addCreatorBtn = document.getElementById('addCreatorBtn');
    if (addCreatorBtn) addCreatorBtn.style.display = getRole() === 'business' ? '' : 'none';
    renderCreatorMetrics();

    const container = document.getElementById('creatorList') || document.getElementById('tableBody');
    if (!container) return;
    const isTable = container.tagName === 'TBODY';
    const role = getRole();

    const qEl = document.getElementById('q');
    const platformFilter = document.getElementById('platformFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const levelFilter = document.getElementById('levelFilter');
    const statusFilter = document.getElementById('statusFilter');
    const bizFilter = document.getElementById('bizFilter');

    const q = qEl ? qEl.value.trim().toLowerCase() : '';
    const pf = platformFilter ? platformFilter.value : '';
    const cf = categoryFilter ? categoryFilter.value : '';
    const lf = levelFilter ? levelFilter.value : '';
    const sf = statusFilter ? statusFilter.value : '';
    const bf = bizFilter ? bizFilter.value : '';

    let list = store.creators.filter(creator => {
      const text = `${creator.creatorName} ${creator.displayId} ${creator.platform} ${creator.category} ${creator.ownerBiz}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (pf && creator.platform !== pf) return false;
      if (cf && creator.category !== cf) return false;
      if (lf && creator.level !== lf) return false;
      if (sf && creator.contactStatus !== sf) return false;
      if (bf && creator.ownerBiz !== bf) return false;
      return true;
    });

    const rows = list.map(creator => {
      let actionBtns = '';
      if (role === 'business') {
        actionBtns += `<button class="mini-btn" type="button" onclick="event.stopPropagation();BDApp._openRecommendToTaskModal('${creator.id}')">推荐到任务</button>`;
        actionBtns += `<button class="mini-btn light" onclick="event.stopPropagation();BDApp._openCreatorEditModal('${creator.id}')">编辑</button>`;
      }

      if (isTable) {
        return `
          <tr onclick="BDApp.openDrawer('creator','${creator.id}')">
            <td>
              <div class="creator">
                ${renderCreatorAvatar(creator)}
                <div>
                  <b>${escapeHtml(creator.creatorName)}</b>
                  <small>${escapeHtml(creator.platform)} · ${escapeHtml(creator.displayId)} · ${creator.fans}</small>
                </div>
              </div>
            </td>
            <td>${escapeHtml(creator.platform)}</td>
            <td>${escapeHtml(creator.category)}</td>
            <td>${renderTag(creator.level)}</td>
            <td>${renderTag(creator.contactStatus)}</td>
            <td>${creator.cooperationCount}/${creator.successCount}</td>
            <td>${escapeHtml(creator.ownerBiz)}</td>
            <td>${(creator.tags || []).map(t => `<span class="tag gray">${escapeHtml(t)}</span>`).join(' ')}</td>
            <td>
              <div class="action-btns">
                <button class="mini-btn light" onclick="event.stopPropagation();BDApp.openDrawer('creator','${creator.id}')">详情</button>
                ${actionBtns}
              </div>
            </td>
          </tr>
        `;
      }
      return `
        <div class="alert-item" onclick="BDApp.openDrawer('creator','${creator.id}')">
          ${renderCreatorAvatar(creator)}
          <div>
            <b>${escapeHtml(creator.creatorName)}</b>
            <small>${escapeHtml(creator.platform)} · ${creator.fans} · ${renderTag(creator.level)} · ${renderTag(creator.contactStatus)} · ${escapeHtml(creator.ownerBiz)}</small>
          </div>
          ${actionBtns ? `<div class="action-btns" onclick="event.stopPropagation()">${actionBtns}</div>` : ''}
        </div>
      `;
    }).join('');

    if (isTable) {
      container.innerHTML = rows || '<tr><td colspan="9"><div class="empty-state"><b>暂无达人</b></div></td></tr>';
    } else {
      container.innerHTML = rows || '<div class="empty-state"><b>暂无达人</b></div>';
    }
  }

  function renderCreatorMetrics() {
    const el = document.getElementById('creatorMetrics');
    if (!el) return;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const total = store.creators.length;
    const cooperable = store.creators.filter(c => c.contactStatus === '可合作').length;
    const monthNew = store.creators.filter(c => {
      const d = new Date(c.createdAt || '2099');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const highLevel = store.creators.filter(c => c.level === 'S' || c.level === 'A').length;
    const cooperated = store.creators.filter(c => c.cooperationCount > 0).length;
    const notAvailable = store.creators.filter(c => c.contactStatus === '暂不合作' || c.contactStatus === '黑名单').length;

    el.innerHTML = `
      <div class="card metric"><span>达人总数</span><b>${total}</b><small>企业沉淀达人资源</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div></div>
      <div class="card metric ok"><span>可合作达人</span><b>${cooperable}</b><small>可立即推荐</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg></div></div>
      <div class="card metric info"><span>本月新增达人</span><b>${monthNew}</b><small>本月录入</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div></div>
      <div class="card metric primary"><span>高等级达人</span><b>${highLevel}</b><small>S/A 级达人</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div></div>
      <div class="card metric warn"><span>已合作达人</span><b>${cooperated}</b><small>有合作记录</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div></div>
      <div class="card metric danger"><span>暂不合作/黑名单</span><b>${notAvailable}</b><small>需特别关注</small><div class="metric-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div></div>
    `;
  }

  // ===================== 推荐页 =====================
  function renderRecommendations() {
    renderRoleSwitcher();
    const container = document.getElementById('recommendationList') || document.getElementById('tableBody');
    if (!container) return;
    const isTable = container.tagName === 'TBODY';
    const role = getRole();

    const qEl = document.getElementById('q');
    const statusFilter = document.getElementById('statusFilter');
    const q = qEl ? qEl.value.trim().toLowerCase() : '';
    const sf = statusFilter ? statusFilter.value : '';

    let list = store.recommendations.filter(rec => {
      const task = getTaskById(rec.taskId);
      const text = `${rec.creatorName} ${rec.platform} ${rec.bizOwner} ${task ? task.taskName : ''}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (sf && rec.status !== sf) return false;
      return true;
    });

    const rows = list.map(rec => {
      const task = getTaskById(rec.taskId);
      let actionBtns = '';
      if (rec.status === '待商家确认' && (role === 'merchant')) {
        actionBtns += `<button class="mini-btn ok" onclick="event.stopPropagation();BDApp.approveRecommendation('${rec.id}')">同意</button>`;
        actionBtns += `<button class="mini-btn danger" onclick="event.stopPropagation();BDApp.rejectRecommendation('${rec.id}')">拒绝</button>`;
      }

      if (isTable) {
        return `
          <tr onclick="BDApp.openDrawer('recommendation','${rec.id}')">
            <td>
              <div class="creator">
                ${renderCreatorAvatar(rec.creatorSnapshot)}
                <div>
                  <b>${escapeHtml(rec.creatorName)}</b>
                  <small>${escapeHtml(rec.platform)} · ${rec.displayId || rec.creatorSnapshot.displayId} · ${rec.fans}</small>
                </div>
              </div>
            </td>
            <td>${escapeHtml(rec.category)}</td>
            <td>${renderTag(rec.level)}</td>
            <td>${escapeHtml(rec.bizOwner)}</td>
            <td>${escapeHtml(task ? task.taskName : '-')}</td>
            <td><span class="tag ${rec.source === '达人库' ? 'info' : 'primary'}">${escapeHtml(rec.source)}</span></td>
            <td>${renderTag(rec.status)}</td>
            <td>¥${rec.estimatedPrice}</td>
            <td>
              <div class="action-btns">
                <button class="mini-btn light" onclick="event.stopPropagation();BDApp.openDrawer('recommendation','${rec.id}')">详情</button>
                ${actionBtns}
              </div>
            </td>
          </tr>
        `;
      }
      return `
        <div class="alert-item" onclick="BDApp.openDrawer('recommendation','${rec.id}')">
          ${renderCreatorAvatar(rec.creatorSnapshot)}
          <div>
            <b>${escapeHtml(rec.creatorName)} · ${escapeHtml(task ? task.taskName : '-')}</b>
            <small>${renderTag(rec.status)} · ${escapeHtml(rec.bizOwner)} · 报价 ¥${rec.estimatedPrice}</small>
          </div>
          ${actionBtns ? `<div class="action-btns" onclick="event.stopPropagation()">${actionBtns}</div>` : ''}
        </div>
      `;
    }).join('');

    if (isTable) {
      container.innerHTML = rows || '<tr><td colspan="9"><div class="empty-state"><b>暂无推荐</b></div></td></tr>';
    } else {
      container.innerHTML = rows || '<div class="empty-state"><b>暂无推荐</b></div>';
    }
  }

  // ===================== 对接单页 =====================
  function renderCollabs() {
    renderRoleSwitcher();
    const container = document.getElementById('collabList') || document.getElementById('tableBody');
    const meta = document.getElementById('tableMeta');
    if (!container) return;
    const isTable = container.tagName === 'TBODY';
    const role = getRole();

    const qEl = document.getElementById('q');
    const sfEl = document.getElementById('statusFilter');
    const bfEl = document.getElementById('bizFilter');
    const rfEl = document.getElementById('riskFilter');

    const q = qEl ? qEl.value.trim().toLowerCase() : '';
    const sf = sfEl ? sfEl.value : '';
    const bf = bfEl ? bfEl.value : '';
    const rf = rfEl ? rfEl.value : '';

    let list = store.collabs.filter(item => {
      const text = `${item.creatorName} ${item.taskName} ${item.bizOwner} ${item.merchantName}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (sf && item.stage !== sf) return false;
      if (bf && item.bizOwner !== bf) return false;
      if (rf === 'overdue' && !isCollabOverdue(item)) return false;
      if (rf === 'stale' && !isCollabStale(item)) return false;
      return true;
    });

    const rows = list.map(item => {
      const handler = getStageHandler(item.stage);
      let stageBtns = '';

      if (item.stage === '待商务申请寄样' && (role === 'business')) {
        stageBtns += `<button class="mini-btn" type="button" onclick="event.stopPropagation();BDApp._openApplySampleModal('${item.id}')">申请寄样</button>`;
      }
      if (item.stage === '待商家寄样' && (role === 'merchant')) {
        stageBtns += `<button class="mini-btn" type="button" onclick="event.stopPropagation();BDApp._openShipSampleModal('${item.id}')">填写物流</button>`;
      }
      if (item.stage === '待商务签收' && (role === 'business')) {
        stageBtns += `<button class="mini-btn" type="button" onclick="event.stopPropagation();BDApp.confirmReceive('${item.id}')">确认签收</button>`;
      }
      if (item.stage === '待商务交付' && (role === 'business')) {
        stageBtns += `<button class="mini-btn" type="button" onclick="event.stopPropagation();BDApp._openSubmitDeliveryModal('${item.id}')">提交交付</button>`;
      }
      if (item.stage === '待商家验收' && (role === 'merchant')) {
        stageBtns += `<button class="mini-btn ok" onclick="event.stopPropagation();BDApp.acceptDelivery('${item.id}')">验收通过</button>`;
        stageBtns += `<button class="mini-btn warn" onclick="event.stopPropagation();BDApp._openRequestRevisionModal('${item.id}')">退回修改</button>`;
      }

      if (isTable) {
        return `
          <tr onclick="BDApp.openDrawer('collab','${item.id}')">
            <td>
              <div class="creator">
                ${renderCreatorAvatar(item)}
                <div>
                  <b>${escapeHtml(item.creatorName)}</b>
                  <small>${escapeHtml(item.taskName)}</small>
                </div>
              </div>
            </td>
            <td><b>${escapeHtml(item.taskName)}</b><br/><small style="color:var(--muted)">${escapeHtml(item.merchantName)}</small></td>
            <td>${escapeHtml(item.bizOwner)}</td>
            <td>${renderTag(item.stage)}</td>
            <td>${escapeHtml(handler.label)}</td>
            <td><b>${item.deadline}</b><br/><small style="color:var(--muted)">${daysAgo(item.updatedAt)} 天前</small></td>
            <td>
              <div class="action-btns">
                <button class="mini-btn light" onclick="event.stopPropagation();BDApp.openDrawer('collab','${item.id}')">详情</button>
                ${stageBtns}
              </div>
            </td>
          </tr>
        `;
      }
      return `
        <div class="alert-item" onclick="BDApp.openDrawer('collab','${item.id}')">
          ${renderCreatorAvatar(item)}
          <div>
            <b>${escapeHtml(item.creatorName)} · ${escapeHtml(item.taskName)}</b>
            <small>${renderTag(item.stage)} · ${escapeHtml(item.bizOwner)} · ${escapeHtml(handler.label)}处理 · 截止 ${item.deadline}</small>
          </div>
          ${stageBtns ? `<div class="action-btns" onclick="event.stopPropagation()">${stageBtns}</div>` : ''}
        </div>
      `;
    }).join('');

    if (isTable) {
      container.innerHTML = rows || '<tr><td colspan="7"><div class="empty-state"><b>暂无对接单</b></div></td></tr>';
    } else {
      container.innerHTML = rows || '<div class="empty-state"><b>暂无对接单</b></div>';
    }

    if (meta) {
      meta.innerHTML = `<span>共 ${list.length} 条记录</span><span>当前显示全部匹配结果</span>`;
    }

    if (sfEl) {
      sfEl.innerHTML = '<option value="">全部状态</option>' + COLLAB_STAGES.map(s => `<option value="${s}">${s}</option>`).join('');
      sfEl.value = sf;
    }
    if (bfEl) {
      bfEl.innerHTML = '<option value="">全部商务</option>' + [...new Set(store.collabs.map(c => c.bizOwner))].map(b => `<option value="${b}">${b}</option>`).join('');
      bfEl.value = bf;
    }
  }

  // ===================== 看板页 =====================
  function renderKanban() {
    renderRoleSwitcher();
    const board = document.getElementById('kanbanBoard');
    if (!board) return;
    board.innerHTML = KANBAN_GROUPS.map(group => {
      const items = store.collabs.filter(c => group.items.includes(c.stage));
      return `
        <div class="column">
          <h4>${group.title}<span class="tag gray">${items.length}</span></h4>
          ${items.length === 0 ? '<div class="empty-state" style="padding:24px 10px"><b>暂无</b><span>该阶段暂无对接</span></div>' : ''}
          ${items.map(item => `
            <div class="deal-card" onclick="BDApp.openDrawer('collab','${item.id}')">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
                ${renderCreatorAvatar(item, 'avatar-sm')}
                <b>${escapeHtml(item.creatorName)}</b>
              </div>
              <small>${escapeHtml(item.taskName)}</small>
              <small>${escapeHtml(item.bizOwner)} · ${daysAgo(item.updatedAt)} 天前更新</small>
              <div class="row-tags">${renderTag(item.stage)}</div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
  }

  // ===================== 异常页 =====================
  function renderAlerts() {
    renderRoleSwitcher();
    const alerts = getAlerts();

    // 6类异常统计
    const sections = [
      { id: 'taskOverdueList', label: '任务逾期', countId: 'taskOverdueCount', items: alerts.overdue, dot: 'red', getTitle: i => escapeHtml(i.taskName), getDesc: i => `截止 ${i.deadline} · ${escapeHtml(i.merchantName)}`, drawerType: 'task', drawerIdFn: i => i.id },
      { id: 'staleList', label: '久未推进', countId: 'staleCount', items: alerts.stale, dot: 'yellow', getTitle: i => escapeHtml(i.creatorName), getDesc: i => `${escapeHtml(i.taskName)} · ${i.days} 天未更新`, drawerType: 'collab', drawerIdFn: i => i.id },
      { id: 'shipmentLagList', label: '寄样滞后', countId: 'shipmentLagCount', items: alerts.shipmentLag, dot: 'yellow', getTitle: i => escapeHtml(i.creatorName), getDesc: i => `${escapeHtml(i.taskName)} · ${i.days} 天未处理`, drawerType: 'collab', drawerIdFn: i => i.id },
      { id: 'acceptLagList', label: '验收滞后', countId: 'acceptLagCount', items: alerts.acceptLag, dot: 'yellow', getTitle: i => escapeHtml(i.creatorName), getDesc: i => `${escapeHtml(i.taskName)} · ${i.days} 天未处理`, drawerType: 'collab', drawerIdFn: i => i.id },
      { id: 'riskCreatorList', label: '风险达人', countId: 'riskCreatorCount', items: alerts.riskCreators, dot: 'red', getTitle: i => escapeHtml(i.creatorName), getDesc: i => `${escapeHtml(i.platform)} · ${escapeHtml(i.ownerBiz)} · ${escapeHtml(i.remark || '')}`, drawerType: 'creator', drawerIdFn: i => i.id },
      { id: 'longNoContactList', label: '长期未联系', countId: 'longNoContactCount', items: alerts.longNoContact, dot: 'yellow', getTitle: i => escapeHtml(i.creatorName), getDesc: i => `${escapeHtml(i.platform)} · ${escapeHtml(i.ownerBiz)} · ${i.days} 天未联系`, drawerType: 'creator', drawerIdFn: i => i.id },
    ];

    sections.forEach(section => {
      const listEl = document.getElementById(section.id);
      const countEl = document.getElementById(section.countId);
      if (!listEl) return;
      if (countEl) countEl.textContent = section.items.length;
      listEl.innerHTML = section.items.length ? section.items.map(item => `
        <div class="alert-item" onclick="BDApp.openDrawer('${section.drawerType}','${section.drawerIdFn(item)}')">
          <span class="dot ${section.dot}"></span>
          <div>
            <b>${section.getTitle(item)}</b>
            <small>${section.getDesc(item)}</small>
          </div>
        </div>
      `).join('') : `<div class="alert-item"><span class="dot green"></span><div><b>暂无${section.label}</b><small>当前没有异常。</small></div></div>`;
    });
  }

  // ===================== 统计页 =====================
  function renderStats() {
    renderRoleSwitcher();
    const statSummary = document.getElementById('statSummary');
    const bizBars = document.getElementById('bizBars');
    const statusDist = document.getElementById('statusDist');
    const bizTable = document.getElementById('bizTable');
    const stats = getOverviewStats();
    const bizStats = getBizStats();

    if (statSummary) {
      statSummary.innerHTML = `
        <div class="card stat-card"><b>${stats.totalTasks}</b><span>任务总数</span></div>
        <div class="card stat-card"><b>${stats.totalCollabs}</b><span>对接总数</span></div>
        <div class="card stat-card"><b>${stats.completedCollabs}</b><span>已完成</span></div>
        <div class="card stat-card"><b>${Math.round((stats.completedCollabs / (stats.totalCollabs || 1)) * 100)}%</b><span>整体完成率</span></div>
        <div class="card stat-card"><b>${stats.overdueCollabs}</b><span>逾期事项</span></div>
        <div class="card stat-card"><b>${stats.staleCollabs}</b><span>久未跟进</span></div>
      `;
    }

    if (bizBars) {
      bizBars.innerHTML = bizStats.map(s => {
        const pct = s.totalCollabs ? Math.round((s.completedCollabs / s.totalCollabs) * 100) : 0;
        return `
          <div class="bar-row">
            <b>${escapeHtml(s.bizOwner)}</b>
            <div class="bar"><i style="width:${Math.max(8, pct)}%"></i></div>
            <span>${pct}%</span>
          </div>
          <small style="display:block;color:var(--muted);margin:-6px 0 10px 88px">对接 ${s.totalCollabs} 个，完成 ${s.completedCollabs} 个，逾期 ${s.overdueCollabs} 个</small>
        `;
      }).join('');
    }

    if (statusDist) {
      const dist = COLLAB_STAGES.map(s => ({ label: s, count: store.collabs.filter(c => c.stage === s).length }));
      const max = Math.max(...dist.map(d => d.count), 1);
      statusDist.innerHTML = dist.map(d => `
        <div class="dist-row">
          <span>${escapeHtml(d.label)}</span>
          <div class="bar"><i style="width:${Math.max(4, Math.round((d.count / max) * 100))}%"></i></div>
          <span>${d.count}</span>
        </div>
      `).join('');
    }

    if (bizTable) {
      bizTable.innerHTML = `
        <table>
          <thead>
            <tr><th>商务</th><th>负责达人</th><th>可合作</th><th>已推荐</th><th>已同意</th><th>已拒绝</th><th>对接数</th><th>已完成</th><th>进行中</th><th>逾期</th><th>久未跟进</th><th>合作完成率</th></tr>
          </thead>
          <tbody>
            ${bizStats.map(s => {
              const active = s.totalCollabs - s.completedCollabs - s.cancelledCollabs;
              return `<tr>
                <td><b>${escapeHtml(s.bizOwner)}</b></td>
                <td>${s.totalCreators}</td>
                <td>${s.cooperableCreators}</td>
                <td>${s.totalRecs}</td>
                <td>${s.approvedRecs}</td>
                <td>${s.rejectedRecs}</td>
                <td>${s.totalCollabs}</td>
                <td>${s.completedCollabs}</td>
                <td>${active}</td>
                <td>${s.overdueCollabs}</td>
                <td>${s.staleCollabs}</td>
                <td><span class="tag ${s.collabCompletionRate >= 60 ? 'ok' : s.collabCompletionRate >= 30 ? 'warn' : 'danger'}">${s.collabCompletionRate}%</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  }

  // ===================== 统计与异常计算 =====================
  function getOverviewStats() {
    const totalTasks = store.tasks.length;
    const activeTasks = store.tasks.filter(t => t.status !== '已完成').length;
    const totalCreators = store.creators.length;
    const totalCollabs = store.collabs.length;
    const completedCollabs = store.collabs.filter(c => c.stage === '已完成').length;
    const activeCollabs = store.collabs.filter(c => c.stage !== '已完成' && c.stage !== '已取消').length;
    const overdueCollabs = store.collabs.filter(isCollabOverdue).length;
    const staleCollabs = store.collabs.filter(isCollabStale).length;
    const pendingRecs = store.recommendations.filter(r => r.status === '待商家确认').length;
    const pendingApplySample = store.collabs.filter(c => c.stage === '待商务申请寄样').length;
    const pendingShipSample = store.collabs.filter(c => c.stage === '待商家寄样').length;
    const pendingReceive = store.collabs.filter(c => c.stage === '待商务签收').length;
    const pendingDeliver = store.collabs.filter(c => c.stage === '待商务交付').length;
    const pendingAccept = store.collabs.filter(c => c.stage === '待商家验收').length;
    return {
      totalTasks, activeTasks, totalCreators, totalCollabs, completedCollabs, activeCollabs,
      overdueCollabs, staleCollabs, pendingRecs,
      pendingApplySample, pendingShipSample, pendingReceive, pendingDeliver, pendingAccept
    };
  }

  function getAlerts() {
    const today = new Date();
    const overdue = store.tasks
      .filter(t => t.status !== '已完成' && t.deadline && new Date(t.deadline + 'T23:59:59') < today)
      .map(t => ({ ...t, type: 'task-overdue' }));
    const stale = store.collabs
      .filter(c => isCollabStale(c))
      .map(c => ({ ...c, type: 'stale', days: daysAgo(c.updatedAt) }));
    const shipmentLag = store.collabs
      .filter(c => c.stage === '待商家寄样' && daysAgo(c.updatedAt) >= 2)
      .map(c => ({ ...c, type: 'shipment-lag', days: daysAgo(c.updatedAt) }));
    const acceptLag = store.collabs
      .filter(c => c.stage === '待商家验收' && daysAgo(c.updatedAt) >= 2)
      .map(c => ({ ...c, type: 'accept-lag', days: daysAgo(c.updatedAt) }));
    const riskCreators = store.creators
      .filter(c => c.contactStatus === '黑名单')
      .map(c => ({ ...c, type: 'risk-creator' }));
    const longNoContact = store.creators
      .filter(c => c.contactStatus !== '黑名单' && c.lastContactAt && daysAgo(c.lastContactAt) >= 30)
      .map(c => ({ ...c, type: 'long-no-contact', days: daysAgo(c.lastContactAt) }));

    const pendingConfirmations = store.recommendations.filter(r => r.status === '待商家确认');
    const pendingSamples = store.collabs.filter(c => c.stage === '待商务申请寄样');
    const pendingShipments = store.collabs.filter(c => c.stage === '待商家寄样');
    const pendingDeliveries = store.collabs.filter(c => c.stage === '待商务交付');
    const pendingAcceptances = store.collabs.filter(c => c.stage === '待商家验收');

    return {
      overdue, stale, shipmentLag, acceptLag, riskCreators, longNoContact,
      pendingConfirmations, pendingSamples, pendingShipments, pendingDeliveries, pendingAcceptances
    };
  }

  function getBizStats() {
    const owners = [...new Set([...store.collabs.map(c => c.bizOwner), ...store.creators.map(c => c.ownerBiz)])];
    return owners.map(bizOwner => {
      const collabItems = store.collabs.filter(c => c.bizOwner === bizOwner);
      const recItems = store.recommendations.filter(r => r.bizOwner === bizOwner);
      const creatorItems = store.creators.filter(c => c.ownerBiz === bizOwner);
      const completedCollabs = collabItems.filter(c => c.stage === '已完成').length;
      const cancelledCollabs = collabItems.filter(c => c.stage === '已取消').length;
      const overdueCollabs = collabItems.filter(isCollabOverdue).length;
      const staleCollabs = collabItems.filter(isCollabStale).length;
      const cooperableCreators = creatorItems.filter(c => c.contactStatus === '可合作').length;
      const successRate = creatorItems.length ? Math.round((creatorItems.filter(c => c.successCount > 0).length / creatorItems.length) * 100) : 0;
      const collabCompletionRate = collabItems.length ? Math.round((completedCollabs / collabItems.length) * 100) : 0;
      return {
        bizOwner, totalCollabs: collabItems.length, completedCollabs, cancelledCollabs,
        overdueCollabs, staleCollabs, totalRecs: recItems.length,
        approvedRecs: recItems.filter(r => r.status === '商家已同意').length,
        rejectedRecs: recItems.filter(r => r.status === '商家已拒绝').length,
        totalCreators: creatorItems.length, cooperableCreators,
        successRate, collabCompletionRate
      };
    });
  }

  // ===================== 通用提示 =====================
  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ===================== 事件绑定 =====================
  function bindEvents() {
    const closeBtn = document.querySelector('.drawer .close');
    const overlay = document.getElementById('drawerOverlay');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeDrawer();
        closeModal();
      }
    });

    // 通用筛选绑定 - 根据页面调用不同渲染函数
    const q = document.getElementById('q');
    const statusFilter = document.getElementById('statusFilter');
    const bizFilter = document.getElementById('bizFilter');
    const riskFilter = document.getElementById('riskFilter');
    const platformFilter = document.getElementById('platformFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const levelFilter = document.getElementById('levelFilter');
    const resetBtn = document.getElementById('resetBtn');

    // 达人库筛选
    if (platformFilter || categoryFilter || levelFilter) {
      const handler = () => { if (typeof renderCreators === 'function') renderCreators(); };
      if (platformFilter) platformFilter.addEventListener('change', handler);
      if (categoryFilter) categoryFilter.addEventListener('change', handler);
      if (levelFilter) levelFilter.addEventListener('change', handler);
    }

    // 对接单筛选
    if (q || statusFilter || bizFilter || riskFilter) {
      const handler = () => { if (typeof renderCollabs === 'function') renderCollabs(); };
      if (q) q.addEventListener('input', handler);
      if (statusFilter) statusFilter.addEventListener('change', handler);
      if (bizFilter) bizFilter.addEventListener('change', handler);
      if (riskFilter) riskFilter.addEventListener('change', handler);
    }

    // 任务页筛选
    if (q && document.getElementById('taskList')) {
      q.addEventListener('input', () => { if (typeof renderTasks === 'function') renderTasks(); });
    }

    // 推荐页筛选
    if (statusFilter && document.getElementById('recommendationList')) {
      statusFilter.addEventListener('change', () => { if (typeof renderRecommendations === 'function') renderRecommendations(); });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        document.querySelectorAll('.input, .select').forEach(el => el.value = '');
        const page = detectPage();
        if (page === 'collabs') renderCollabs();
        else if (page === 'creators') renderCreators();
        else if (page === 'tasks') renderTasks();
        else if (page === 'recommendations') renderRecommendations();
        toast('筛选已重置');
      });
    }
  }

  // ===================== 初始化 =====================
  function init() {
    loadData();
    renderPage();
    bindEvents();
  }

  // 暴露公共 API
  window.BDApp = {
    init,
    renderPage,
    setRole,
    getRole,
    resetDemoData,
    startFullExperience,
    openDrawer,
    closeDrawer,
    openModal,
    closeModal,
    toast,
    createTask,
    addCreator,
    recommendCreator,
    manualRecommend,
    approveRecommendation,
    rejectRecommendation,
    applySample,
    shipSample,
    confirmReceive,
    submitDelivery,
    acceptDelivery,
    requestRevision,
    cancelCollab,
    getOverviewStats,
    getAlerts,
    getBizStats,
    _openRecommendModal,
    _submitRecommend,
    _openManualRecommendModal,
    _submitManualRecommend,
    _openApplySampleModal,
    _submitApplySample,
    _openShipSampleModal,
    _submitShipSample,
    _openSubmitDeliveryModal,
    _submitDelivery,
    _openRequestRevisionModal,
    _submitRevision,
    _openRecommendToTaskModal,
    _submitRecommendToTask,
    _openAddCreatorModal,
    _submitAddCreator,
    _openCreateTaskModal,
    _submitCreateTask,
    _openCreatorEditModal,
    _submitCreatorEdit,
    _contactCreator,
    _openFocus
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();