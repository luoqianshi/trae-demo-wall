'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 用户
    await queryInterface.bulkInsert('users', [
      { id: 1, username: 'admin', password: hashedPassword, nickname: '管理员', gender: 'secret', role: 'super_admin', creditScore: 100, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, username: 'linxiaoman', password: hashedPassword, nickname: '林小满', gender: 'secret', role: 'user', creditScore: 92, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, username: 'zhouyu', password: hashedPassword, nickname: '周屿', gender: 'secret', role: 'user', creditScore: 95, createdAt: new Date(), updatedAt: new Date() },
      { id: 4, username: 'chenyi', password: hashedPassword, nickname: '陈一', gender: 'secret', role: 'user', creditScore: 89, createdAt: new Date(), updatedAt: new Date() },
      { id: 5, username: 'xuan', password: hashedPassword, nickname: '许安', gender: 'secret', role: 'user', creditScore: 98, createdAt: new Date(), updatedAt: new Date() },
      { id: 6, username: 'yeweihui', password: hashedPassword, nickname: '业委会观察员', gender: 'secret', role: 'user', creditScore: 91, createdAt: new Date(), updatedAt: new Date() },
      { id: 7, username: 'nangua', password: hashedPassword, nickname: '南瓜烘焙', gender: 'secret', role: 'user', creditScore: 96, createdAt: new Date(), updatedAt: new Date() },
    ], { ignoreDuplicates: true });

    // 邻圈
    await queryInterface.bulkInsert('circles', [
      {
        id: 1, name: '梧桐里小区', type: 'community',
        description: '围绕物业维修、闲置交易、邻里互助和民生建议形成的真实社区邻圈。',
        safetyInfo: '实名率 96%', memberCount: 3268,
        services: JSON.stringify(['物业电话', '维修上报', '微信群列表', '通知公告', '意见反馈', '打卡共治']),
        groups: JSON.stringify(['业主总群', '二手闲置群', '跑步搭子群', '宝妈互助群']),
        status: 'active', verifyType: 'location',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 2, name: '江北大学邻圈', type: 'university',
        description: '覆盖宿舍维修、校园活动、技能互助、创业摊位和校园建议的大学生活圈。',
        safetyInfo: '学籍认证', memberCount: 14820,
        services: JSON.stringify(['宿舍报修', '校园活动', '考研互助', '社团招新', '意见反馈', '失物招领']),
        groups: JSON.stringify(['25级新生群', '羽毛球群', '兼职互助群', '创业集市群']),
        status: 'active', verifyType: 'student',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 3, name: '老友朋友圈', type: 'friends',
        description: '以微信好友和线下熟人关系为基础的私密邻圈，适合小范围活动和交易。',
        safetyInfo: '好友验证', memberCount: 216,
        services: JSON.stringify(['好友动态', '聚会报名', '私域交易', '心情树洞', '问答互助', '共同收藏']),
        groups: JSON.stringify(['周末骑行群', '桌游群', '宠物互助群']),
        status: 'active', verifyType: 'friend',
        createdAt: new Date(), updatedAt: new Date()
      },
    ], { ignoreDuplicates: true });

    // 邻圈成员关系
    await queryInterface.bulkInsert('circle_members', [
      { userId: 1, circleId: 1, role: 'owner', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { userId: 2, circleId: 1, role: 'member', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { userId: 3, circleId: 2, role: 'member', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { userId: 4, circleId: 1, role: 'member', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { userId: 5, circleId: 3, role: 'member', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { userId: 6, circleId: 1, role: 'admin', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { userId: 7, circleId: 1, role: 'member', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
    ], { ignoreDuplicates: true });

    // 需求
    await queryInterface.bulkInsert('needs', [
      {
        id: 1, title: '周六羽毛球双打缺 2 人', category: 'activity',
        description: '校体育馆 3 号场，19:00-21:00，水平不限，希望大家线下认识新朋友。',
        price: 'AA 28 元', distance: '800m', boosts: 86,
        tags: JSON.stringify(['实名', '线下活动', '可报名']),
        circleId: 2, publisherId: 3, status: 'active',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 2, title: '出 9 成新小米显示器 27 寸', category: 'idle_item',
        description: '支持上门验货，小区门口交易，带原包装和电源线。',
        price: '520', distance: '120m', boosts: 38,
        tags: JSON.stringify(['小区自提', '平台担保', '可议价']),
        circleId: 1, publisherId: 4, status: 'active',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 3, title: '下班后辅导 Python 入门', category: 'skill_service',
        description: '互联网后端工程师，支持线上讲解或社区咖啡厅面对面辅导。',
        price: '80/小时', distance: '1.6km', boosts: 64,
        tags: JSON.stringify(['行业认证', '可试看', '好友可见']),
        circleId: 3, publisherId: 5, status: 'active',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 4, title: '建议增设夜间照明和电动车棚', category: 'feedback',
        description: '3 栋到北门小路夜间偏暗，建议物业与社区街道共同推进改造。',
        price: '民生建议', distance: '本小区', boosts: 214,
        tags: JSON.stringify(['意见反馈', '助力排名', '社区共治']),
        circleId: 1, publisherId: 6, status: 'active',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 5, title: '居家烘焙接生日蛋糕预定', category: 'home_business',
        description: '持食品健康证，支持小区自提，提前 24 小时预约。',
        price: '88 起', distance: '300m', boosts: 102,
        tags: JSON.stringify(['创业者', '行业认证', '邻里优惠']),
        circleId: 1, publisherId: 7, status: 'active',
        createdAt: new Date(), updatedAt: new Date()
      },
    ], { ignoreDuplicates: true });

    // 活动
    await queryInterface.bulkInsert('activities', [
      {
        id: 1, title: '邻里露天电影夜', type: 'culture',
        description: '周五晚上小区中心花园放映经典电影，提供爆米花和饮料。',
        eventTime: new Date('2026-06-27T19:30:00'),
        location: '小区中心花园', maxPeople: 100, enrolledCount: 68,
        fee: 0, status: 'upcoming', circleId: 1, organizerId: 1,
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 2, title: '校园创业跳蚤市集', type: 'other',
        description: '学生创业者展示和交易闲置物品、手工制品。',
        eventTime: new Date('2026-06-28T14:00:00'),
        location: '江北大学东广场', maxPeople: 200, enrolledCount: 126,
        fee: 0, status: 'upcoming', circleId: 2, organizerId: 3,
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 3, title: '新手友好桌游局', type: 'game',
        description: '适合新手的桌游聚会，提供多款热门桌游。',
        eventTime: new Date('2026-06-29T15:00:00'),
        location: '邻聚共享客厅', maxPeople: 16, enrolledCount: 12,
        fee: 15, status: 'upcoming', circleId: 3, organizerId: 5,
        createdAt: new Date(), updatedAt: new Date()
      },
    ], { ignoreDuplicates: true });

    // 反馈
    await queryInterface.bulkInsert('feedbacks', [
      {
        id: 1, title: '北门人行道积水', description: '雨天北门人行道积水严重，影响行人通行。',
        boosts: 302, progress: '已转交物业', status: 'processing',
        circleId: 1, publisherId: 2,
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 2, title: '宿舍热水供应时间延长', description: '建议将热水供应时间延长至23:30。',
        boosts: 518, progress: '校务处处理中', status: 'processing',
        circleId: 2, publisherId: 3,
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 3, title: '增设宠物便民箱', description: '建议在小区公共区域增设宠物拾便纸和垃圾袋。',
        boosts: 167, progress: '征集中', status: 'open',
        circleId: 1, publisherId: 2,
        createdAt: new Date(), updatedAt: new Date()
      },
    ], { ignoreDuplicates: true });

    // 订单
    await queryInterface.bulkInsert('orders', [
      {
        id: 1, orderNo: 'LH20260626001', needId: 2,
        buyerId: 2, sellerId: 4, amount: 520,
        status: 'pending_pay', meetLocation: '小区门口',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 2, orderNo: 'LH20260626002', needId: 3,
        buyerId: 2, sellerId: 5, amount: 160,
        status: 'pending_participate', meetLocation: '社区咖啡厅',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 3, orderNo: 'LH20260626003', needId: 1,
        buyerId: 2, sellerId: 3, amount: 28,
        status: 'pending_review',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: 4, orderNo: 'LH20260626004', needId: 5,
        buyerId: 2, sellerId: 7, amount: 128,
        status: 'completed', completedAt: new Date(),
        createdAt: new Date(), updatedAt: new Date()
      },
    ], { ignoreDuplicates: true });

    // 认证记录
    await queryInterface.bulkInsert('auth_records', [
      { id: 1, userId: 2, type: 'real_name', status: 'approved', realName: '林小满', reviewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 2, userId: 2, type: 'industry', status: 'pending', description: '正在核验互联网从业资质', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, userId: 2, type: 'community', status: 'approved', realName: '林小满', reviewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 4, userId: 2, type: 'university', status: 'pending', createdAt: new Date(), updatedAt: new Date() },
    ], { ignoreDuplicates: true });

    // 评论
    await queryInterface.bulkInsert('comments', [
      { id: 1, content: '请问今晚方便线下确认吗？', needId: 2, userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, content: '周末可以约时间验货', needId: 2, userId: 4, createdAt: new Date(), updatedAt: new Date() },
    ], { ignoreDuplicates: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('comments', null, {});
    await queryInterface.bulkDelete('auth_records', null, {});
    await queryInterface.bulkDelete('orders', null, {});
    await queryInterface.bulkDelete('feedbacks', null, {});
    await queryInterface.bulkDelete('activities', null, {});
    await queryInterface.bulkDelete('needs', null, {});
    await queryInterface.bulkDelete('circle_members', null, {});
    await queryInterface.bulkDelete('circles', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
