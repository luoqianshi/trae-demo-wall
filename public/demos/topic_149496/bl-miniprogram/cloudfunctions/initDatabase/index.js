// 云函数：initDatabase - 初始化数据库（演示数据）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 演示数据默认中心点：上海市人民广场（附近10公里内分布）
// 真实用户登录后，会用自己的定位来计算距离
const DEMO_CENTER = { lat: 31.2317, lng: 121.4692 }

// 在中心点附近生成随机坐标（半径 km 内）
function randomLocation(center, radiusKm) {
  // 1度纬度≈111km，1度经度≈111*cos(lat)km
  const angle = Math.random() * 2 * Math.PI
  const r = Math.random() * radiusKm
  const dLat = (r * Math.sin(angle)) / 111
  const dLng = (r * Math.cos(angle)) / (111 * Math.cos(center.lat * Math.PI / 180))
  return {
    lat: +(center.lat + dLat).toFixed(6),
    lng: +(center.lng + dLng).toFixed(6)
  }
}

// 演示用户数据（围绕中心点5公里内分布）
const DEMO_USERS = [
  { nickname: '王阿姨', avatar: '', community: '阳光社区', credit_score: 320, credit_level: '邻里达人', help_count: 18, trade_count: 6, help_publish_count: 12, trade_publish_count: 4 },
  { nickname: '李师傅', avatar: '', community: '幸福社区', credit_score: 580, credit_level: '社区之星', help_count: 35, trade_count: 12, help_publish_count: 8, trade_publish_count: 10 },
  { nickname: '张奶奶', avatar: '', community: '和谐社区', credit_score: 150, credit_level: '活跃邻居', help_count: 8, trade_count: 2, help_publish_count: 15, trade_publish_count: 1 },
  { nickname: '小陈同学', avatar: '', community: '花园社区', credit_score: 85, credit_level: '热心邻居', help_count: 5, trade_count: 3, help_publish_count: 2, trade_publish_count: 5 },
  { nickname: '刘大叔', avatar: '', community: '锦绣社区', credit_score: 420, credit_level: '邻里达人', help_count: 22, trade_count: 18, help_publish_count: 6, trade_publish_count: 20 },
  { nickname: '赵女士', avatar: '', community: '翠园社区', credit_score: 260, credit_level: '活跃邻居', help_count: 14, trade_count: 8, help_publish_count: 9, trade_publish_count: 7 },
  { nickname: '孙老师', avatar: '', community: '望江社区', credit_score: 610, credit_level: '社区之星', help_count: 42, trade_count: 5, help_publish_count: 11, trade_publish_count: 3 },
  { nickname: '周阿姨', avatar: '', community: '春风社区', credit_score: 195, credit_level: '活跃邻居', help_count: 11, trade_count: 4, help_publish_count: 7, trade_publish_count: 6 },
  { nickname: '吴先生', avatar: '', community: '阳光社区', credit_score: 75, credit_level: '热心邻居', help_count: 4, trade_count: 2, help_publish_count: 3, trade_publish_count: 4 },
  { nickname: '钱奶奶', avatar: '', community: '幸福社区', credit_score: 340, credit_level: '邻里达人', help_count: 19, trade_count: 1, help_publish_count: 13, trade_publish_count: 2 }
]

// 演示互助数据（type: seeking提供帮助 / requesting请求帮助）
const DEMO_HELPS = [
  { type: 'requesting', title: '帮忙取快递', description: '今天有3个大件快递在小区驿站，自己搬不动，希望有邻居能帮忙搬到6楼，谢谢！', contact: { type: 'phone', value: '138****8888' }, status: '待帮助' },
  { type: 'requesting', title: '老人手机不会用', description: '我妈妈70岁了，新换的智能手机不会用微信视频，希望有耐心的邻居能教教她，可以上门或者视频教学。', contact: { type: 'wechat', value: '' }, status: '待帮助' },
  { type: 'seeking', title: '免费辅导小学数学', description: '我是退休数学老师，每周六下午有空，可以免费辅导附近小学生数学，限3-5年级，欢迎联系。', contact: { type: 'phone', value: '139****6666' }, status: '待帮助' },
  { type: 'requesting', title: '水管漏水急修', description: '厨房水管突然漏水，物业说要等明天，有没有懂维修的邻居能帮忙看看？有偿也可以。', contact: { type: 'phone', value: '137****1234' }, status: '待帮助' },
  { type: 'requesting', title: '代购药品', description: '我感冒发烧了，附近药店没有需要的药，希望有邻居去医院药房帮忙代购一下，药费转账。', contact: { type: 'wechat', value: '' }, status: '待帮助' },
  { type: 'seeking', title: '闲置衣物捐赠接收', description: '家里整理出一批八成新的冬装，想捐给有需要的邻居，男女老少都有，欢迎来取。', contact: { type: 'phone', value: '136****5555' }, status: '待帮助' },
  { type: 'requesting', title: '帮忙照看宠物', description: '周末要出差两天，家里有只温顺的猫咪，希望有养宠经验的邻居能帮忙照看两天，猫粮猫砂我都备齐。', contact: { type: 'phone', value: '135****9999' }, status: '待帮助' },
  { type: 'seeking', title: '免费理发服务', description: '我是理发师，每周日上午在小区活动室为65岁以上老人免费理发，有需要的邻居可以过来。', contact: { type: 'wechat', value: '' }, status: '待帮助' },
  { type: 'requesting', title: '搬运家具', description: '搬家有几个大件家具需要从1楼搬到5楼，包括一个衣柜和一张床，希望有2-3位邻居帮忙，有酬谢。', contact: { type: 'phone', value: '133****7777' }, status: '进行中' },
  { type: 'requesting', title: '辅导孩子作业', description: '孩子上三年级，英语作业辅导不了，希望有英语好的邻居每周二四晚上辅导一小时。', contact: { type: 'wechat', value: '' }, status: '待帮助' },
  { type: 'seeking', title: '免费修电脑', description: 'IT从业者，业余时间可以免费帮邻居修电脑、装系统、清理病毒，台式机笔记本都行。', contact: { type: 'phone', value: '188****0000' }, status: '待帮助' },
  { type: 'requesting', title: '陪同去医院', description: '下周三要去第一人民医院做体检，希望有邻居能陪同帮忙排队挂号，半天时间。', contact: { type: 'phone', value: '186****3333' }, status: '已完成' },
  { type: 'seeking', title: '社区广场舞教学', description: '每天晚上7点在小区广场带大家跳广场舞，欢迎中老年邻居参加，强身健体！', contact: { type: 'wechat', value: '' }, status: '待帮助' },
  { type: 'requesting', title: '借个电钻用', description: '家里装窗帘需要用电钻打孔，自己没有，希望有邻居能借我用一下，半小时就还。', contact: { type: 'phone', value: '159****2222' }, status: '待帮助' },
  { type: 'requesting', title: '帮忙遛狗', description: '出差三天，家里金毛需要每天遛两次，希望有养狗经验的邻居帮忙，狗很温顺。', contact: { type: 'wechat', value: '' }, status: '待帮助' }
]

// 演示闲置数据
const DEMO_IDLE = [
  { name: '九成新婴儿车', category: '母婴用品', price: 150, original_price: 600, description: '孩子大了用不上了，九成新，可折叠，买来600多，现在150出。', contact: { type: 'phone', value: '138****8888' }, status: '在售' },
  { name: '闲置书籍一摞', category: '图书音像', price: 20, original_price: 200, description: '孩子小学毕业了，整理出一摞课外书，有童话、科普、作文集，整体20元打包。', contact: { type: 'wechat', value: '' }, status: '在售' },
  { name: '美的电饭煲', category: '家用电器', price: 80, original_price: 299, description: '搬家用不上了，美的电饭煲，4L容量，功能正常，外观八成新。', contact: { type: 'phone', value: '139****6666' }, status: '在售' },
  { name: '儿童自行车', category: '运动户外', price: 100, original_price: 450, description: '14寸儿童自行车，孩子长高了骑不了，八成新，刹车好使。', contact: { type: 'phone', value: '137****1234' }, status: '在售' },
  { name: '实木书桌', category: '家具', price: 200, original_price: 800, description: '搬家处理，实木书桌1.2米，带抽屉，结实耐用，自取。', contact: { type: 'phone', value: '136****5555' }, status: '在售' },
  { name: '吉他一把', category: '乐器', price: 300, original_price: 1200, description: '民谣吉他，买来学了几次没坚持下来，几乎全新，送琴包和拨片。', contact: { type: 'wechat', value: '' }, status: '在售' },
  { name: '小米空气净化器', category: '家用电器', price: 250, original_price: 699, description: '小米空气净化器2代，用了半年，滤芯刚换新的，效果很好。', contact: { type: 'phone', value: '135****9999' }, status: '在售' },
  { name: '闲置女装外套', category: '服饰鞋包', price: 30, original_price: 280, description: '整理衣柜，几件女装外套，M码，九成新，30元一件，可多件优惠。', contact: { type: 'wechat', value: '' }, status: '在售' },
  { name: '钓鱼竿套装', category: '运动户外', price: 120, original_price: 500, description: '碳素钓鱼竿3.6米+4.5米各一根，带渔轮和鱼线，新手退坑出。', contact: { type: 'phone', value: '188****0000' }, status: '在售' },
  { name: '豆浆机', category: '家用电器', price: 60, original_price: 399, description: '九阳豆浆机，用了两年，功能正常，做的豆浆很细腻，搬家便宜出。', contact: { type: 'phone', value: '186****3333' }, status: '在售' },
  { name: '儿童积木玩具', category: '母婴用品', price: 25, original_price: 158, description: '一大桶乐高式积木，孩子玩腻了，零件齐全，适合3-6岁。', contact: { type: 'wechat', value: '' }, status: '在售' },
  { name: '办公转椅', category: '家具', price: 80, original_price: 350, description: '人体工学办公转椅，升降功能正常，网布透气，自取。', contact: { type: 'phone', value: '159****2222' }, status: '在售' }
]

// 生成演示用户ID（用固定前缀，避免和真实用户冲突）
function genDemoUserId(index) {
  return 'demo_user_' + String(index).padStart(3, '0')
}

exports.main = async (event, context) => {
  const results = { users: 0, helps: 0, idles: 0, messages: [] }

  try {
    // ============ 1. 初始化演示用户 ============
    const demoUserCount = await db.collection('users').where({ _id: /^demo_user_/ }).count()
    if (demoUserCount.total === 0) {
      for (let i = 0; i < DEMO_USERS.length; i++) {
        const u = DEMO_USERS[i]
        const location = randomLocation(DEMO_CENTER, 5)
        await db.collection('users').add({
          data: {
            _id: genDemoUserId(i),
            nickname: u.nickname,
            avatar: u.avatar,
            community: u.community,
            location,
            location_time: db.serverDate(),
            help_count: u.help_count,
            trade_count: u.trade_count,
            help_publish_count: u.help_publish_count,
            trade_publish_count: u.trade_publish_count,
            credit_score: u.credit_score,
            credit_level: u.credit_level,
            is_demo: true,
            create_time: db.serverDate(Date.now() - Math.random() * 30 * 24 * 3600 * 1000),
            update_time: db.serverDate()
          }
        })
      }
      results.users = DEMO_USERS.length
    } else {
      results.messages.push('演示用户已存在，跳过')
    }

    // ============ 2. 初始化演示互助数据 ============
    const demoHelpCount = await db.collection('help_requests').where({ is_demo: true }).count()
    if (demoHelpCount.total === 0) {
      const today = new Date()
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
      for (let i = 0; i < DEMO_HELPS.length; i++) {
        const h = DEMO_HELPS[i]
        const userId = genDemoUserId(i % DEMO_USERS.length)
        const userRes = await db.collection('users').where({ _id: userId }).get()
        const user = userRes.data[0] || {}
        const help_no = `HP${dateStr}${String(i + 1).padStart(4, '0')}`
        // 创建时间随机分布在最近7天内
        const createTime = new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000)
        await db.collection('help_requests').add({
          data: {
            help_no,
            user_id: userId,
            type: h.type,
            title: h.title,
            description: h.description,
            community: user.community || '',
            location: user.location || randomLocation(DEMO_CENTER, 5),
            contact: h.contact,
            status: h.status,
            helper_id: h.status === '进行中' ? genDemoUserId((i + 1) % DEMO_USERS.length) : '',
            is_demo: true,
            create_time: createTime,
            update_time: createTime,
            complete_time: h.status === '已完成' ? createTime : null
          }
        })
      }
      results.helps = DEMO_HELPS.length
    } else {
      results.messages.push('演示互助数据已存在，跳过')
    }

    // ============ 3. 初始化演示闲置数据 ============
    const demoIdleCount = await db.collection('idle_items').where({ is_demo: true }).count()
    if (demoIdleCount.total === 0) {
      const today = new Date()
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
      for (let i = 0; i < DEMO_IDLE.length; i++) {
        const it = DEMO_IDLE[i]
        const userId = genDemoUserId(i % DEMO_USERS.length)
        const userRes = await db.collection('users').where({ _id: userId }).get()
        const user = userRes.data[0] || {}
        const item_no = `ID${dateStr}${String(i + 1).padStart(4, '0')}`
        const createTime = new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000)
        await db.collection('idle_items').add({
          data: {
            item_no,
            user_id: userId,
            name: it.name,
            category: it.category,
            price: it.price,
            original_price: it.original_price,
            description: it.description,
            community: user.community || '',
            location: user.location || randomLocation(DEMO_CENTER, 5),
            contact: it.contact,
            status: it.status,
            buyer_id: '',
            is_demo: true,
            create_time: createTime,
            update_time: createTime,
            complete_time: null
          }
        })
      }
      results.idles = DEMO_IDLE.length
    } else {
      results.messages.push('演示闲置数据已存在，跳过')
    }

    // ============ 4. 初始化演示聊天会话和消息 ============
    const demoChatCount = await db.collection('chat_sessions').where({ is_demo: true }).count()
    if (demoChatCount.total === 0) {
      // 创建几个演示会话
      const demoChats = [
        { user_a: 'demo_user_000', user_b: 'demo_user_001', messages: [
          { from: 'demo_user_000', to: 'demo_user_001', content: '李师傅您好，看到您发布的免费辅导小学数学，我家孩子正需要，请问本周六下午方便吗？', time_offset: 3600000 * 5 },
          { from: 'demo_user_001', to: 'demo_user_000', content: '可以的，本周六下午2点在小区活动室，记得让孩子带上数学课本和作业本。', time_offset: 3600000 * 4.8 },
          { from: 'demo_user_000', to: 'demo_user_001', content: '好的，谢谢李师傅！孩子已经迫不及待了，我们准时到。', time_offset: 3600000 * 4.5 }
        ]},
        { user_a: 'demo_user_002', user_b: 'demo_user_003', messages: [
          { from: 'demo_user_002', to: 'demo_user_003', content: '小陈你好，看到你的闲置书籍，请问还有吗？我家孩子正需要这些课外书。', time_offset: 3600000 * 8 },
          { from: 'demo_user_003', to: 'demo_user_002', content: '张奶奶您好，还有的，一摞打包20元，您看什么时候方便来取？', time_offset: 3600000 * 7.5 },
          { from: 'demo_user_002', to: 'demo_user_003', content: '明天上午10点方便吗？我在和谐社区3号楼。', time_offset: 3600000 * 7 },
          { from: 'demo_user_003', to: 'demo_user_002', content: '可以的，明天上午10点见，我送到您楼下。', time_offset: 3600000 * 6.8 }
        ]},
        { user_a: 'demo_user_004', user_b: 'demo_user_005', messages: [
          { from: 'demo_user_004', to: 'demo_user_005', content: '赵女士您好，看到您发布的代购药品需求，我可以帮您去第一人民医院药房看看。', time_offset: 3600000 * 2 },
          { from: 'demo_user_005', to: 'demo_user_004', content: '太感谢了！需要布洛芬和感冒灵，药费我转账给您。', time_offset: 3600000 * 1.8 },
          { from: 'demo_user_004', to: 'demo_user_005', content: '好的，我现在就过去，大概1小时后回来，您在锦绣社区几号楼？', time_offset: 3600000 * 1.5 },
          { from: 'demo_user_005', to: 'demo_user_004', content: '我在5号楼302，等您回来，万分感谢！', time_offset: 3600000 * 1.3 }
        ]}
      ]

      for (const chat of demoChats) {
        const sessionRes = await db.collection('chat_sessions').add({
          data: {
            user_a: chat.user_a,
            user_b: chat.user_b,
            last_message: chat.messages[chat.messages.length - 1].content,
            last_time: db.serverDate(),
            unread_a: 0,
            unread_b: 0,
            is_demo: true,
            create_time: db.serverDate(Date.now() - 3600000 * 24),
            update_time: db.serverDate()
          }
        })
        const sessionId = sessionRes._id
        for (const msg of chat.messages) {
          await db.collection('chat_messages').add({
            data: {
              session_id: sessionId,
              from: msg.from,
              to: msg.to,
              content: msg.content,
              is_read: true,
              is_demo: true,
              create_time: db.serverDate(Date.now() - msg.time_offset)
            }
          })
        }
      }
      results.chats = demoChats.length
    } else {
      results.messages.push('演示聊天数据已存在，跳过')
    }

    return {
      success: true,
      message: '数据库初始化完成',
      results,
      tips: '演示数据已添加，包括' + (results.users + results.helps + results.idles) + '条演示记录'
    }
  } catch (err) {
    return { success: false, message: '初始化失败：' + err.message, results }
  }
}
