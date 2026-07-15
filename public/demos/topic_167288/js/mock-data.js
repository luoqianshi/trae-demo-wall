// ===== 内置 Mock 数据 =====
const MockData = {
  // 初始化数据（首次访问时调用）
  init() {
    if (Store.getValue('initialized')) return

    // 创建 mock 用户
    const mockUsers = [
      { id: 'user_mock_1', nickname: '爱心猫猫', avatar: '🐱', verified: true, points: { base: 500, friendly: 3200 }, createdAt: Date.now() - 30 * 86400000 },
      { id: 'user_mock_2', nickname: '温暖狗狗', avatar: '🐶', verified: true, points: { base: 500, friendly: 1800 }, createdAt: Date.now() - 20 * 86400000 },
      { id: 'user_mock_3', nickname: '勇敢兔兔', avatar: '🐰', verified: false, points: { base: 0, friendly: 650 }, createdAt: Date.now() - 10 * 86400000 },
      { id: 'user_mock_4', nickname: '快乐熊熊', avatar: '🐻', verified: true, points: { base: 500, friendly: 5200 }, createdAt: Date.now() - 60 * 86400000 }
    ]
    Store.set('users', mockUsers)

    // 创建 mock 标记（北京坐标附近）
    const mockMarkers = [
      { id: 'marker_mock_1', type: 'rescue', title: '流浪橘猫求救助', desc: '小区楼下发现一只流浪橘猫，看起来很瘦，需要救助', images: [], lat: 39.908, lng: 116.397, address: '朝阳区团结湖路', userId: 'user_mock_1', isUrgent: false, status: 'active', adoptionId: '', createdAt: Date.now() - 3 * 3600000 },
      { id: 'marker_mock_2', type: 'rescue', title: '受伤小狗急需帮助', desc: '路边发现一只受伤的小狗，后腿跛行，需要紧急救治', images: [], lat: 39.915, lng: 116.404, address: '东城区王府井', userId: 'user_mock_2', isUrgent: true, status: 'active', adoptionId: '', createdAt: Date.now() - 1 * 3600000 },
      { id: 'marker_mock_3', type: 'adoption', title: '可爱白猫找家', desc: '救助的白猫，已绝育疫苗，找好心人领养', images: [], lat: 39.920, lng: 116.390, address: '西城区西单', userId: 'user_mock_3', isUrgent: false, status: 'active', adoptionId: 'adoption_mock_1', createdAt: Date.now() - 5 * 3600000 },
      { id: 'marker_mock_4', type: 'place', title: '宠物友好公园', desc: '允许宠物进入的公园，有大草坪可以遛狗', images: [], lat: 39.925, lng: 116.410, address: '朝阳区朝阳公园', userId: 'user_mock_4', isUrgent: false, status: 'active', adoptionId: '', createdAt: Date.now() - 2 * 86400000 },
      { id: 'marker_mock_5', type: 'hospital', title: '24小时宠物医院', desc: '全天候营业的宠物医院，设备齐全', images: [], lat: 39.905, lng: 116.415, address: '朝阳区国贸', userId: 'user_mock_1', isUrgent: false, status: 'active', adoptionId: '', createdAt: Date.now() - 5 * 86400000 }
    ]
    Store.set('markers', mockMarkers)

    // 创建 mock 领养信息
    const mockAdoptions = [
      { id: 'adoption_mock_1', name: '球球', type: 'cat', breed: '白猫', gender: '♀', age: '约8个月', weight: '2.8kg', tags: ['已绝育', '已疫苗', '胆小需耐心'], images: [], desc: '白猫，救助时在下雨天躲在车底。比较胆小，需要耐心相处，熟悉后很黏人。', requirements: ['有稳定住所', '耐心相处', '定期回访', '不弃养'], location: '西城区西单', ownerId: 'user_mock_3', ownerName: '喵星救援', ownerAvatar: '🏠', minPoints: 1500, isUrgent: true, status: 'available', createdAt: Date.now() - 86400000, applicantCount: 3 },
      { id: 'adoption_mock_2', name: '小橘', type: 'cat', breed: '橘猫', gender: '♀', age: '约1岁', weight: '3.5kg', tags: ['已绝育', '已疫苗', '已驱虫'], images: [], desc: '性格超亲人的橘猫，救助时瘦骨嶙峋，现在已恢复健康。会翻肚皮求摸摸，爱踩奶，不挑食。', requirements: ['有稳定住所', '科学喂养', '定期回访', '不弃养'], location: '朝阳区团结湖', ownerId: 'user_mock_1', ownerName: '爱心救助站', ownerAvatar: '🏠', minPoints: 2000, isUrgent: false, status: 'available', createdAt: Date.now() - 3 * 3600000, applicantCount: 5 },
      { id: 'adoption_mock_3', name: '大黄', type: 'dog', breed: '中华田园犬', gender: '♂', age: '约2岁', weight: '15kg', tags: ['已绝育', '已疫苗', '需大运动量'], images: [], desc: '中华田园犬，被遗弃在公园。性格温顺，会和小孩玩耍。需要每天至少1小时户外运动。', requirements: ['有稳定住所', '每天1小时运动', '定期回访', '不弃养'], location: '朝阳区朝阳公园', ownerId: 'user_mock_2', ownerName: '流浪动物之家', ownerAvatar: '🏠', minPoints: 2000, isUrgent: false, status: 'available', createdAt: Date.now() - 5 * 3600000, applicantCount: 8 },
      { id: 'adoption_mock_4', name: '豆豆', type: 'dog', breed: '柴犬混血', gender: '♂', age: '约3岁', weight: '12kg', tags: ['已绝育', '已疫苗', '适合有院子'], images: [], desc: '柴犬混血，活泼好动。主人移居海外无法带走，希望找有院子的家庭。', requirements: ['有院子', '有养狗经验', '定期回访', '不弃养'], location: '海淀区中关村', ownerId: 'user_mock_4', ownerName: '宠物转运站', ownerAvatar: '🏠', minPoints: 2000, isUrgent: false, status: 'available', createdAt: Date.now() - 2 * 86400000, applicantCount: 6 },
      { id: 'adoption_mock_5', name: '团子', type: 'other', breed: '熊猫兔', gender: '♀', age: '约1岁', weight: '1.5kg', tags: ['健康', '需要笼子'], images: [], desc: '被遗弃的兔子，黑白花色。已体检健康，需要准备合适笼子和干草。', requirements: ['有合适笼子', '科学喂养', '不弃养'], location: '东城区王府井', ownerId: 'user_mock_1', ownerName: '小动物救助', ownerAvatar: '🏠', minPoints: 1000, isUrgent: false, status: 'available', createdAt: Date.now() - 3 * 86400000, applicantCount: 2 }
    ]
    mockAdoptions.forEach(a => a.isMock = true)
    Store.set('adoptions', mockAdoptions)

    // 创建 mock 积分记录
    const mockPoints = [
      { id: 'pt_1', userId: 'user_mock_1', type: 'base', points: 500, reason: '实名认证', createdAt: Date.now() - 30 * 86400000 },
      { id: 'pt_2', userId: 'user_mock_1', type: 'friendly', points: 50, reason: '发布救助标记', createdAt: Date.now() - 25 * 86400000 },
      { id: 'pt_3', userId: 'user_mock_1', type: 'friendly', points: 200, reason: '成功救助', createdAt: Date.now() - 20 * 86400000 },
      { id: 'pt_4', userId: 'user_mock_1', type: 'friendly', points: 100, reason: '发布领养信息', createdAt: Date.now() - 15 * 86400000 },
      { id: 'pt_5', userId: 'user_mock_1', type: 'friendly', points: 300, reason: '完成领养', createdAt: Date.now() - 10 * 86400000 },
      { id: 'pt_6', userId: 'user_mock_1', type: 'friendly', points: 10, reason: '创建宠物档案', createdAt: Date.now() - 5 * 86400000 },
      { id: 'pt_7', userId: 'user_mock_1', type: 'friendly', points: 5, reason: '添加宠物日记', createdAt: Date.now() - 3 * 86400000 },
      { id: 'pt_8', userId: 'user_mock_1', type: 'friendly', points: 30, reason: '服务好评', createdAt: Date.now() - 1 * 86400000 }
    ]
    Store.set('points', mockPoints)

    // 创建 mock 宠物
    const mockPets = [
      { id: 'pet_mock_1', ownerId: 'user_mock_1', name: '咪咪', type: 'cat', breed: '橘猫', gender: 'female', birthday: Date.now() - 2 * 365 * 86400000, weight: '4.5kg', personality: '活泼亲人，爱吃爱睡', icon: '🐱', album: [], createdAt: Date.now() - 5 * 86400000 }
    ]
    Store.set('pets', mockPets)

    // 创建 mock 聊天
    const mockChats = [
      { id: 'chat_1', fromId: 'user_mock_2', toId: 'user_mock_1', content: '你好，我看到你发布的领养信息，想了解一下', type: 'text', read: false, createdAt: Date.now() - 2 * 3600000 },
      { id: 'chat_2', fromId: 'user_mock_1', toId: 'user_mock_2', content: '你好！请问你想领养哪只呢？', type: 'text', read: true, createdAt: Date.now() - 1.5 * 3600000 },
      { id: 'chat_3', fromId: 'user_mock_2', toId: 'user_mock_1', content: '我对小橘很感兴趣', type: 'text', read: false, createdAt: Date.now() - 1 * 3600000 }
    ]
    Store.set('chats', mockChats)

    Store.setValue('initialized', true)
  },

  // 创建或获取当前用户
  getCurrentUser() {
    let user = Store.getValue('current_user')
    if (!user) {
      // 首次访问，创建新用户
      const id = Util.genId('user')
      user = {
        id,
        nickname: Util.randomNickname(),
        avatar: '🐱',
        verified: false,
        points: { base: 0, friendly: 0 },
        createdAt: Date.now()
      }
      // 存入 users 集合
      const users = Store.get('users')
      users.push(user)
      Store.set('users', users)
      Store.setValue('current_user', { id })
    } else {
      // 从 users 集合获取完整信息
      user = Store.findById('users', user.id) || user
    }
    return user
  }
}
