// 校园广场 - 共享数据存储层
// 所有4个端（C移动、C PC、B PC、B移动）共享此数据源

(function() {
  'use strict';

  const STORE_KEY = 'campus_square_shared_data';
  const AUTH_KEY = 'campus_square_auth';

  // 初始 Mock 数据
  const defaultData = {
    // 帖子 (26条)
    posts: [
      { id: 1, schoolId: 1, userId: 2, category: 'confession', title: '', content: '给图书馆三楼靠窗的小哥哥，周三下午穿白T恤戴眼镜的，想认识一下，qq：123456789', images: ['https://picsum.photos/400/300?random=1'], isAnonymous: true, contactInfo: 'QQ: 123456789', status: 1, viewCount: 328, likeCount: 128, commentCount: 6, collectCount: 15, isHot: true, createdAt: '2026-06-24T14:00:00' },
      { id: 2, schoolId: 1, userId: 3, category: 'confession', title: '表白计算机学院李同学', content: '从大一就开始喜欢你了，每次在食堂看到你都很开心。希望能有机会认识一下。', images: [], isAnonymous: false, contactInfo: '微信: wxid_abc', status: 1, viewCount: 520, likeCount: 256, commentCount: 5, collectCount: 32, isHot: true, createdAt: '2026-06-24T10:00:00' },
      { id: 3, schoolId: 1, userId: 4, category: 'confession', title: '', content: '求问经管学院张老师的课表，想旁听，有没有同学知道？', images: [], isAnonymous: true, contactInfo: '', status: 1, viewCount: 86, likeCount: 12, commentCount: 0, collectCount: 3, isHot: false, createdAt: '2026-06-23T16:00:00' },
      { id: 4, schoolId: 1, userId: 5, category: 'gossip', title: '食堂阿姨手抖治好了？', content: '今天去食堂打饭，阿姨居然给我打了满满一勺肉！这不会是放假前的福利吧？', images: ['https://picsum.photos/400/300?random=2'], isAnonymous: false, contactInfo: '', status: 1, viewCount: 410, likeCount: 189, commentCount: 6, collectCount: 18, isHot: true, createdAt: '2026-06-24T08:00:00' },
      { id: 5, schoolId: 1, userId: 6, category: 'gossip', title: '校园惊现神秘小黑猫', content: '在教学楼A座后面发现一只超可爱的黑色小猫，有人知道它的来历吗？', images: ['https://picsum.photos/400/300?random=3', 'https://picsum.photos/400/300?random=4'], isAnonymous: false, contactInfo: '', status: 1, viewCount: 356, likeCount: 167, commentCount: 5, collectCount: 25, isHot: true, createdAt: '2026-06-23T12:00:00' },
      { id: 6, schoolId: 1, userId: 7, category: 'lost_found', title: '丢失一把蓝色雨伞', content: '昨天在图书馆二楼丢失一把蓝色自动雨伞，柄上有个小熊挂件，有捡到请联系我，谢谢！', images: [], isAnonymous: false, contactInfo: '手机: 138****1234', status: 1, viewCount: 95, likeCount: 8, commentCount: 0, collectCount: 2, isHot: false, createdAt: '2026-06-24T09:00:00' },
      { id: 7, schoolId: 1, userId: 8, category: 'second_hand', title: '出闲置iPad Air 4', content: 'iPad Air 4 64G 天蓝色，成色9新，带Apple Pencil二代，打包价2800，可小刀。', images: ['https://picsum.photos/400/300?random=5', 'https://picsum.photos/400/300?random=6'], isAnonymous: false, contactInfo: '微信: ipad_seller', status: 1, viewCount: 478, likeCount: 45, commentCount: 4, collectCount: 28, isHot: true, createdAt: '2026-06-23T20:00:00' },
      { id: 8, schoolId: 1, userId: 9, category: 'confession', title: '', content: '操场夜跑遇到一个穿紫色运动服的小姐姐，跑得超快又超有气质，想知道是哪个学院的。', images: ['https://picsum.photos/400/300?random=7'], isAnonymous: true, contactInfo: 'QQ: 2233445566', status: 1, viewCount: 267, likeCount: 98, commentCount: 4, collectCount: 12, isHot: false, createdAt: '2026-06-23T19:00:00' },
      { id: 9, schoolId: 1, userId: 10, category: 'gossip', title: '期末周图书馆占座大战', content: '早上六点去图书馆，座位已经全被占满了，占座的人能不能自觉点啊！', images: ['https://picsum.photos/400/300?random=8'], isAnonymous: false, contactInfo: '', status: 1, viewCount: 512, likeCount: 234, commentCount: 4, collectCount: 45, isHot: true, createdAt: '2026-06-22T08:00:00' },
      { id: 10, schoolId: 1, userId: 11, category: 'gossip', title: '学校要装空调了？！', content: '听说学校准备给所有宿舍装空调了，是真的吗？有没有内部消息？', images: [], isAnonymous: false, contactInfo: '', status: 1, viewCount: 389, likeCount: 156, commentCount: 0, collectCount: 22, isHot: true, createdAt: '2026-06-21T14:00:00' },
      { id: 11, schoolId: 1, userId: 12, category: 'lost_found', title: '捡到一张校园卡', content: '在三教101门口捡到一张校园卡，姓名：陈同学，卡号2023开头，失主请联系我。', images: ['https://picsum.photos/400/300?random=9'], isAnonymous: false, contactInfo: '微信: find_card', status: 1, viewCount: 123, likeCount: 15, commentCount: 3, collectCount: 5, isHot: false, createdAt: '2026-06-24T11:00:00' },
      { id: 12, schoolId: 1, userId: 13, category: 'lost_found', title: 'AirPods Pro充电仓丢了', content: '昨晚在体育馆打完羽毛球，发现AirPods Pro的充电仓不见了，耳机还在，求求了有捡到的吗？', images: [], isAnonymous: false, contactInfo: '手机: 139****5678', status: 1, viewCount: 67, likeCount: 5, commentCount: 0, collectCount: 1, isHot: false, createdAt: '2026-06-22T20:00:00' },
      { id: 13, schoolId: 1, userId: 14, category: 'second_hand', title: '出全套考研资料', content: '数学一、英语一、政治全套复习资料，含张宇36讲、肖秀荣全家桶，笔记很详细，300元出。', images: ['https://picsum.photos/400/300?random=10', 'https://picsum.photos/400/300?random=11'], isAnonymous: false, contactInfo: 'QQ: 1122334455', status: 1, viewCount: 289, likeCount: 34, commentCount: 3, collectCount: 19, isHot: false, createdAt: '2026-06-21T10:00:00' },
      { id: 14, schoolId: 1, userId: 15, category: 'second_hand', title: '出一辆二手自行车', content: '捷安特山地车，买了两年，成色还行，刹车灵敏，300元出，可试骑。', images: ['https://picsum.photos/400/300?random=12'], isAnonymous: false, contactInfo: '微信: bike_sale', status: 1, viewCount: 156, likeCount: 18, commentCount: 0, collectCount: 8, isHot: false, createdAt: '2026-06-20T16:00:00' },
      { id: 15, schoolId: 1, userId: 16, category: 'second_hand', title: '宿舍小电锅便宜出', content: '小熊牌电煮锅，用了半年，功能完好，送蒸笼，30元自取。', images: ['https://picsum.photos/400/300?random=13'], isAnonymous: false, contactInfo: '手机: 137****8888', status: 1, viewCount: 198, likeCount: 22, commentCount: 0, collectCount: 11, isHot: false, createdAt: '2026-06-23T14:00:00' },
      { id: 16, schoolId: 1, userId: 17, category: 'task', title: '求组队做大作业', content: '软件工程课大作业，做一个校园二手交易平台，求2-3个队友，要有前端或后端基础。', images: ['https://picsum.photos/400/300?random=14'], isAnonymous: false, contactInfo: 'QQ: 9988776655', status: 1, viewCount: 145, likeCount: 10, commentCount: 0, collectCount: 6, isHot: false, createdAt: '2026-06-22T12:00:00' },
      { id: 17, schoolId: 1, userId: 18, category: 'task', title: '求代写实验报告', content: '物理实验报告3份，数据已经测好了，只需要整理成报告，字迹工整即可。', images: [], isAnonymous: true, contactInfo: '微信: lab_help', status: 1, viewCount: 78, likeCount: 2, commentCount: 0, collectCount: 0, isHot: false, createdAt: '2026-06-23T09:00:00' },
      { id: 18, schoolId: 1, userId: 19, category: 'confession', title: '感谢昨晚帮我搬行李的学长', content: '昨晚下雨，从校门口搬行李到宿舍，一个好心学长主动帮我，还没来得及道谢就消失了，想当面感谢！', images: ['https://picsum.photos/400/300?random=15'], isAnonymous: false, contactInfo: 'QQ: 5544332211', status: 1, viewCount: 445, likeCount: 312, commentCount: 2, collectCount: 67, isHot: true, createdAt: '2026-06-24T07:00:00' },
      { id: 19, schoolId: 1, userId: 20, category: 'gossip', title: '网红来我们学校拍视频了', content: '今天下午在南门看到一个百万粉丝网红在拍探店视频，好多人在围观，有人知道是谁吗？', images: ['https://picsum.photos/400/300?random=16', 'https://picsum.photos/400/300?random=17'], isAnonymous: false, contactInfo: '', status: 1, viewCount: 678, likeCount: 445, commentCount: 0, collectCount: 89, isHot: true, createdAt: '2026-06-24T16:00:00' },
      { id: 20, schoolId: 1, userId: 21, category: 'lost_found', title: '在教室捡到U盘一个', content: '在二教305捡到蓝色金士顿U盘一个，里面有课件，失主请描述内容来认领。', images: [], isAnonymous: false, contactInfo: '微信: usb_finder', status: 1, viewCount: 54, likeCount: 4, commentCount: 0, collectCount: 1, isHot: false, createdAt: '2026-06-21T09:00:00' },
      { id: 21, schoolId: 1, userId: 22, category: 'second_hand', title: '出24寸显示器', content: 'AOC 24寸IPS显示器，1080p，无坏点，用了1年，400元出，可小刀。', images: ['https://picsum.photos/400/300?random=18', 'https://picsum.photos/400/300?random=19'], isAnonymous: false, contactInfo: 'QQ: 6677889900', status: 1, viewCount: 234, likeCount: 28, commentCount: 0, collectCount: 14, isHot: false, createdAt: '2026-06-22T18:00:00' },
      { id: 22, schoolId: 1, userId: 23, category: 'task', title: '求借微单相机周末用', content: '这周末去春游，想借一台微单相机，索尼或佳能都行，会小心使用，可有偿。', images: [], isAnonymous: false, contactInfo: '微信: camera_borrow', status: 1, viewCount: 112, likeCount: 8, commentCount: 0, collectCount: 3, isHot: false, createdAt: '2026-06-23T11:00:00' },
      { id: 23, schoolId: 1, userId: 24, category: 'confession', title: '表白音乐学院弹吉他的女生', content: '每天傍晚经过音乐楼都能听到吉他声，弹的是《晴天》，太好听了，想知道是谁。', images: ['https://picsum.photos/400/300?random=20'], isAnonymous: true, contactInfo: '', status: 1, viewCount: 567, likeCount: 289, commentCount: 0, collectCount: 56, isHot: true, createdAt: '2026-06-22T17:00:00' },
      { id: 24, schoolId: 1, userId: 25, category: 'gossip', title: '南门新开了一家奶茶店', content: '南门新开的奶茶店，第二杯半价，今天去试了，杨枝甘露还不错！', images: ['https://picsum.photos/400/300?random=21'], isAnonymous: false, contactInfo: '', status: 1, viewCount: 234, likeCount: 98, commentCount: 0, collectCount: 17, isHot: false, createdAt: '2026-06-23T13:00:00' },
      { id: 25, schoolId: 1, userId: 26, category: 'lost_found', title: '丢失一本高等数学教材', content: '在食堂二楼丢失一本同济版高等数学下册，里面有我的笔记，很重要，捡到请联系。', images: [], isAnonymous: false, contactInfo: '手机: 136****6666', status: 1, viewCount: 34, likeCount: 1, commentCount: 0, collectCount: 0, isHot: false, createdAt: '2026-06-24T10:00:00' },
      { id: 26, schoolId: 1, userId: 27, category: 'second_hand', title: '出闲置吉他', content: '雅马哈FG830民谣吉他，买了半年，几乎全新，送琴包和变调夹，1200元出。', images: ['https://picsum.photos/400/300?random=22', 'https://picsum.photos/400/300?random=23'], isAnonymous: false, contactInfo: '微信: guitar_sale', status: 1, viewCount: 178, likeCount: 21, commentCount: 0, collectCount: 9, isHot: false, createdAt: '2026-06-21T15:00:00' },
    ],
    // 评论 (42条，含嵌套回复)
    comments: [
      { id: 1, postId: 1, userId: 10, parentId: 0, content: '顶！我也在图书馆见过！', isAnonymous: false, likeCount: 5, status: 1, createdAt: '2026-06-24T15:00:00' },
      { id: 2, postId: 1, userId: 11, parentId: 0, content: '我也见过这个小哥哥！周三下午确实穿白T恤', isAnonymous: false, likeCount: 12, status: 1, createdAt: '2026-06-24T16:00:00' },
      { id: 3, postId: 1, userId: 0, parentId: 0, content: 'qq号是不是写错了？搜不到啊', isAnonymous: true, likeCount: 2, status: 1, createdAt: '2026-06-24T17:00:00' },
      { id: 4, postId: 1, userId: 12, parentId: 1, content: '真的假的，求更多信息，哪个学院的？', isAnonymous: false, likeCount: 3, status: 1, createdAt: '2026-06-24T15:30:00' },
      { id: 5, postId: 1, userId: 13, parentId: 2, content: '不会是那个李学长吧，计算机的挺多人认识他', isAnonymous: false, likeCount: 8, status: 1, createdAt: '2026-06-24T16:30:00' },
      { id: 6, postId: 1, userId: 14, parentId: 0, content: '冲啊姐妹！图书馆的爱情我磕了', isAnonymous: false, likeCount: 15, status: 1, createdAt: '2026-06-24T18:00:00' },
      { id: 7, postId: 2, userId: 15, parentId: 0, content: '祝成功！勇敢追爱的人最棒', isAnonymous: false, likeCount: 8, status: 1, createdAt: '2026-06-24T11:00:00' },
      { id: 8, postId: 2, userId: 16, parentId: 0, content: '计算机学院李同学很多啊，说清楚是哪个班的', isAnonymous: false, likeCount: 20, status: 1, createdAt: '2026-06-24T12:00:00' },
      { id: 9, postId: 2, userId: 17, parentId: 0, content: '这又是哪个李同学，我今天已经看到三个表白的了哈哈', isAnonymous: false, likeCount: 35, status: 1, createdAt: '2026-06-24T13:00:00' },
      { id: 10, postId: 2, userId: 18, parentId: 8, content: '盲猜是研二的李明学长，确实挺受欢迎的', isAnonymous: false, likeCount: 12, status: 1, createdAt: '2026-06-24T12:30:00' },
      { id: 11, postId: 2, userId: 19, parentId: 0, content: '勇敢追爱！失败了也不怕，至少不留遗憾', isAnonymous: false, likeCount: 6, status: 1, createdAt: '2026-06-24T14:00:00' },
      { id: 12, postId: 4, userId: 20, parentId: 0, content: '我也发现了！今天肉确实多了，不可思议', isAnonymous: false, likeCount: 15, status: 1, createdAt: '2026-06-24T09:30:00' },
      { id: 13, postId: 4, userId: 21, parentId: 0, content: '是不是要放假了阿姨良心发现？保持住啊', isAnonymous: false, likeCount: 22, status: 1, createdAt: '2026-06-24T10:00:00' },
      { id: 14, postId: 4, userId: 22, parentId: 12, content: '别做梦了，明天就恢复正常了哈哈', isAnonymous: false, likeCount: 9, status: 1, createdAt: '2026-06-24T09:45:00' },
      { id: 15, postId: 4, userId: 23, parentId: 12, content: '确实！我还以为就我一个是错觉，原来大家都感受到了', isAnonymous: false, likeCount: 7, status: 1, createdAt: '2026-06-24T10:15:00' },
      { id: 16, postId: 4, userId: 24, parentId: 0, content: '这是假消息吧，我今天去二食堂还是老样子啊', isAnonymous: false, likeCount: 5, status: 1, createdAt: '2026-06-24T11:00:00' },
      { id: 17, postId: 4, userId: 25, parentId: 16, content: '真的假的，我现在就去食堂验证一下', isAnonymous: false, likeCount: 3, status: 1, createdAt: '2026-06-24T11:30:00' },
      { id: 18, postId: 5, userId: 26, parentId: 0, content: '在哪在哪，我要去看！猫控狂喜', isAnonymous: false, likeCount: 18, status: 1, createdAt: '2026-06-23T13:00:00' },
      { id: 19, postId: 5, userId: 27, parentId: 0, content: '它好像已经在学校待了好久了，经常看到有人喂它', isAnonymous: false, likeCount: 10, status: 1, createdAt: '2026-06-23T14:00:00' },
      { id: 20, postId: 5, userId: 1, parentId: 18, content: 'A座后面小花园，快去！刚才还在晒太阳', isAnonymous: false, likeCount: 6, status: 1, createdAt: '2026-06-23T13:30:00' },
      { id: 21, postId: 5, userId: 2, parentId: 19, content: '有人喂它吗，要是没人的话我可以带点猫粮来', isAnonymous: true, likeCount: 4, status: 1, createdAt: '2026-06-23T14:30:00' },
      { id: 22, postId: 5, userId: 3, parentId: 0, content: '求组团撸猫，有没有一起的', isAnonymous: false, likeCount: 8, status: 1, createdAt: '2026-06-23T15:00:00' },
      { id: 23, postId: 7, userId: 4, parentId: 0, content: '还能刀多少，诚心要，面交', isAnonymous: false, likeCount: 3, status: 1, createdAt: '2026-06-23T21:00:00' },
      { id: 24, postId: 7, userId: 5, parentId: 0, content: '电池健康度多少？有购买记录吗', isAnonymous: false, likeCount: 5, status: 1, createdAt: '2026-06-23T22:00:00' },
      { id: 25, postId: 7, userId: 6, parentId: 24, content: '电池还有92%，很耐用，有电子发票', isAnonymous: false, likeCount: 2, status: 1, createdAt: '2026-06-23T22:30:00' },
      { id: 26, postId: 7, userId: 7, parentId: 0, content: '面交吗，我想要，明天下午图书馆可以吗', isAnonymous: false, likeCount: 1, status: 1, createdAt: '2026-06-24T08:00:00' },
      { id: 27, postId: 8, userId: 8, parentId: 0, content: '是我们学校的吗，求描述一下长相', isAnonymous: false, likeCount: 4, status: 1, createdAt: '2026-06-23T20:00:00' },
      { id: 28, postId: 8, userId: 9, parentId: 0, content: '操场每晚都有好多人跑步吧，这怎么找', isAnonymous: false, likeCount: 6, status: 1, createdAt: '2026-06-23T21:00:00' },
      { id: 29, postId: 8, userId: 10, parentId: 28, content: '穿紫色运动服那个，跑超快，马尾辫', isAnonymous: false, likeCount: 9, status: 1, createdAt: '2026-06-23T21:30:00' },
      { id: 30, postId: 8, userId: 11, parentId: 0, content: '不会是体育系的吧，我们系没听说有这么快的', isAnonymous: false, likeCount: 3, status: 1, createdAt: '2026-06-24T08:00:00' },
      { id: 31, postId: 9, userId: 12, parentId: 0, content: '太真实了，早上六点去就已经被占了', isAnonymous: false, likeCount: 25, status: 1, createdAt: '2026-06-22T09:00:00' },
      { id: 32, postId: 9, userId: 13, parentId: 0, content: '占座的人能不能自觉点，人不在还放本书占着', isAnonymous: false, likeCount: 18, status: 1, createdAt: '2026-06-22T10:00:00' },
      { id: 33, postId: 9, userId: 14, parentId: 31, content: '我五点半去都已经没位置了，卷疯了', isAnonymous: false, likeCount: 12, status: 1, createdAt: '2026-06-22T09:30:00' },
      { id: 34, postId: 9, userId: 15, parentId: 0, content: '建议学校管一管，至少禁止隔夜占座', isAnonymous: false, likeCount: 30, status: 1, createdAt: '2026-06-22T11:00:00' },
      { id: 35, postId: 11, userId: 16, parentId: 0, content: '已联系失主，谢谢大家关心，卡已归还', isAnonymous: false, likeCount: 20, status: 1, createdAt: '2026-06-24T12:00:00' },
      { id: 36, postId: 11, userId: 17, parentId: 0, content: '在哪捡到的，我昨天也丢了卡', isAnonymous: false, likeCount: 2, status: 1, createdAt: '2026-06-24T12:30:00' },
      { id: 37, postId: 11, userId: 18, parentId: 36, content: '三教101门口，你快去看看是不是你的', isAnonymous: false, likeCount: 1, status: 1, createdAt: '2026-06-24T13:00:00' },
      { id: 38, postId: 13, userId: 19, parentId: 0, content: '多少钱，数学专业的我想收', isAnonymous: false, likeCount: 2, status: 1, createdAt: '2026-06-21T11:00:00' },
      { id: 39, postId: 13, userId: 20, parentId: 0, content: '资料全吗，有没有笔记和重点勾画', isAnonymous: false, likeCount: 1, status: 1, createdAt: '2026-06-21T12:00:00' },
      { id: 40, postId: 13, userId: 21, parentId: 39, content: '有手写笔记，很详细，还有我自己整理的错题集', isAnonymous: false, likeCount: 4, status: 1, createdAt: '2026-06-21T13:00:00' },
      { id: 41, postId: 18, userId: 22, parentId: 0, content: '好人一生平安！这样的学长给我来一打', isAnonymous: false, likeCount: 45, status: 1, createdAt: '2026-06-24T08:00:00' },
      { id: 42, postId: 18, userId: 23, parentId: 0, content: '这就是校园的温暖，泪目了', isAnonymous: false, likeCount: 38, status: 1, createdAt: '2026-06-24T09:00:00' },
    ],
    // 任务 (13条)
    tasks: [
      { id: 1, schoolId: 1, publisherId: 2, category: 'errand', title: '代取快递，5元', description: '快递已到南门菜鸟驿站，取件码3-2-1054，送到宿舍3号楼楼下即可。', reward: 5.00, location: '南门菜鸟驿站 → 3号楼', contactInfo: '手机: 138****5678', deadline: '2026-06-24T20:00:00', status: 0, takerId: null, takenAt: null, completedAt: null, createdAt: '2026-06-24T10:00:00' },
      { id: 2, schoolId: 1, publisherId: 3, category: 'substitute', title: '求代课，周三下午马原', description: '周三下午2-4节，马克思主义基本原理，只需要点名答到即可。', reward: 30.00, location: '教学楼B座302', contactInfo: 'QQ: 987654321', deadline: '2026-06-25T14:00:00', status: 1, takerId: 5, takenAt: '2026-06-24T11:00:00', completedAt: null, createdAt: '2026-06-23T18:00:00' },
      { id: 3, schoolId: 1, publisherId: 4, category: 'tutor', title: '求高数辅导', description: '高数下册微积分部分，需要每周辅导2次，每次1小时。', reward: 50.00, location: '图书馆或咖啡厅', contactInfo: '微信: math_help', deadline: '2026-06-30T23:59:00', status: 0, takerId: null, takenAt: null, completedAt: null, createdAt: '2026-06-23T14:00:00' },
      { id: 4, schoolId: 1, publisherId: 5, category: 'errand', title: '帮忙买饭，送到宿舍', description: '想吃二食堂的麻辣香锅，帮忙买一份送到5号楼，报酬10元。', reward: 10.00, location: '二食堂 → 5号楼', contactInfo: '手机: 139****9999', deadline: '2026-06-24T19:00:00', status: 2, takerId: 6, takenAt: '2026-06-24T12:00:00', completedAt: '2026-06-24T13:00:00', createdAt: '2026-06-24T11:00:00' },
      { id: 5, schoolId: 1, publisherId: 7, category: 'errand', title: '代打印复习资料', description: '需要打印50页复习资料，双面黑白，送到图书馆。', reward: 3.00, location: '打印店 → 图书馆', contactInfo: 'QQ: 3344556677', deadline: '2026-06-25T12:00:00', status: 0, takerId: null, takenAt: null, completedAt: null, createdAt: '2026-06-24T09:00:00' },
      { id: 6, schoolId: 1, publisherId: 8, category: 'substitute', title: '求代周五体育课', description: '周五下午3-4节体育课，内容是羽毛球，需要签个到。', reward: 25.00, location: '体育馆', contactInfo: '微信: pe_substitute', deadline: '2026-06-27T15:00:00', status: 1, takerId: 8, takenAt: '2026-06-24T14:00:00', completedAt: null, createdAt: '2026-06-23T16:00:00' },
      { id: 7, schoolId: 1, publisherId: 9, category: 'tutor', title: '求英语六级辅导', description: '六级考了两次都没过，阅读和听力比较弱，需要针对性辅导。', reward: 40.00, location: '图书馆研讨室', contactInfo: '手机: 137****1111', deadline: '2026-07-10T23:59:00', status: 0, takerId: null, takenAt: null, completedAt: null, createdAt: '2026-06-22T10:00:00' },
      { id: 8, schoolId: 1, publisherId: 10, category: 'help', title: '帮忙搬宿舍', description: '从6号楼搬到9号楼，东西不多，需要一个男生帮忙搬重物。', reward: 50.00, location: '6号楼 → 9号楼', contactInfo: 'QQ: 5566778899', deadline: '2026-06-26T18:00:00', status: 1, takerId: 12, takenAt: '2026-06-24T08:00:00', completedAt: null, createdAt: '2026-06-23T09:00:00' },
      { id: 9, schoolId: 1, publisherId: 11, category: 'other', title: '求借正装面试用', description: '下周有企业面试，想借一套男士正装，身高175，身材中等。', reward: 0.00, location: '校内自取', contactInfo: '微信: suit_borrow', deadline: '2026-06-28T09:00:00', status: 0, takerId: null, takenAt: null, completedAt: null, createdAt: '2026-06-24T10:00:00' },
      { id: 10, schoolId: 1, publisherId: 13, category: 'errand', title: '代取外卖送到宿舍', description: '点了南门奶茶和炸鸡，求送到7号楼3楼，报酬5元。', reward: 5.00, location: '南门 → 7号楼', contactInfo: '手机: 138****2222', deadline: '2026-06-24T19:30:00', status: 2, takerId: 14, takenAt: '2026-06-24T18:00:00', completedAt: '2026-06-24T18:30:00', createdAt: '2026-06-24T17:00:00' },
      { id: 11, schoolId: 1, publisherId: 15, category: 'tutor', title: '求Python编程辅导', description: '数据结构与算法课程需要Python基础，求大佬带飞，每周一次。', reward: 60.00, location: '机房或咖啡厅', contactInfo: 'QQ: 2233445566', deadline: '2026-07-05T23:59:00', status: 0, takerId: null, takenAt: null, completedAt: null, createdAt: '2026-06-22T14:00:00' },
      { id: 12, schoolId: 1, publisherId: 16, category: 'help', title: '帮忙重装电脑系统', description: '电脑中病毒了，需要重装Win11系统，连带Office激活。', reward: 20.00, location: '宿舍区', contactInfo: '微信: pc_fix', deadline: '2026-06-25T20:00:00', status: 0, takerId: null, takenAt: null, completedAt: null, createdAt: '2026-06-24T11:00:00' },
      { id: 13, schoolId: 1, publisherId: 17, category: 'substitute', title: '求代签学术讲座', description: '周四晚上学术讲座需要签到，人在外面实习回不来。', reward: 15.00, location: '学术报告厅', contactInfo: '手机: 139****3333', deadline: '2026-06-26T19:00:00', status: 1, takerId: 20, takenAt: '2026-06-24T15:00:00', completedAt: null, createdAt: '2026-06-23T20:00:00' },
    ],
    // 兼职 (12条)
    jobs: [
      { id: 1, schoolId: 1, publisherId: 15, title: '校内奶茶店招兼职', description: '校内奶茶店招聘兼职员工，主要负责制作奶茶、收银、清洁。', salary: '15元/小时', workTime: '周末全天或工作日晚上', location: '学校食堂一楼奶茶店', requirements: '有责任心，能长期做优先', contactInfo: '微信: milktea_boss', status: 1, createdAt: '2026-06-24T08:00:00' },
      { id: 2, schoolId: 1, publisherId: 16, title: '图书馆助理', description: '协助图书馆整理书籍、引导读者、维持秩序。', salary: '12元/小时', workTime: '周一至周五下午', location: '学校图书馆', requirements: '细心耐心，图书馆学专业优先', contactInfo: 'QQ: lib_admin', status: 1, createdAt: '2026-06-23T10:00:00' },
      { id: 3, schoolId: 1, publisherId: 17, title: '校园跑腿团队招募', description: '组建校园跑腿团队，承接代取快递、代买饭等任务。', salary: '按单结算，5-20元/单', workTime: '灵活时间', location: '全校', requirements: '有电动车优先，时间灵活', contactInfo: '手机: 137****7777', status: 1, createdAt: '2026-06-22T16:00:00' },
      { id: 4, schoolId: 1, publisherId: 18, title: '家教-小学数学', description: '辅导三年级小学生数学，每周两次，每次两小时。', salary: '80元/小时', workTime: '周末上午', location: '学校附近小区', requirements: '数学基础好，有耐心，有家教经验优先', contactInfo: '微信: tutor_math', status: 1, createdAt: '2026-06-21T09:00:00' },
      { id: 5, schoolId: 1, publisherId: 19, title: '二食堂服务员', description: '负责打饭、收拾餐桌、清洁地面等。', salary: '13元/小时', workTime: '午餐和晚餐时段', location: '学校二食堂', requirements: '吃苦耐劳，身体健康', contactInfo: 'QQ: canteen_hr', status: 1, createdAt: '2026-06-20T10:00:00' },
      { id: 6, schoolId: 1, publisherId: 20, title: '校园活动推广员', description: '在校园里推广品牌活动，发放传单，引导扫码。', salary: '20元/小时', workTime: '周三、周五中午', location: '食堂门口、宿舍区', requirements: '性格开朗，善于沟通', contactInfo: '手机: 138****4444', status: 1, createdAt: '2026-06-22T14:00:00' },
      { id: 7, schoolId: 1, publisherId: 21, title: '海报设计师', description: '为社团活动设计海报、宣传单页，需熟练使用PS或AI。', salary: '30元/小时', workTime: '按项目制，时间灵活', location: '线上或社团办公室', requirements: '有设计基础，审美在线', contactInfo: '微信: design_hire', status: 1, createdAt: '2026-06-23T11:00:00' },
      { id: 8, schoolId: 1, publisherId: 22, title: '实验室助理', description: '协助老师准备实验器材、整理数据、维护实验室。', salary: '18元/小时', workTime: '周一至周五上午', location: '化学楼实验室', requirements: '化学相关专业，做事细心', contactInfo: 'QQ: lab_assistant', status: 1, createdAt: '2026-06-21T15:00:00' },
      { id: 9, schoolId: 1, publisherId: 23, title: '快递分拣员', description: '协助校内快递点分拣包裹，录入信息。', salary: '16元/小时', workTime: '下午2点-6点', location: '南门快递点', requirements: '吃苦耐劳，手脚麻利', contactInfo: '手机: 136****5555', status: 1, createdAt: '2026-06-20T09:00:00' },
      { id: 10, schoolId: 1, publisherId: 24, title: '校园记者', description: '采访校园活动、撰写新闻稿、拍摄活动照片。', salary: '15元/小时', workTime: '有活动时', location: '校园各处', requirements: '文笔好，会拍照，新闻专业优先', contactInfo: '微信: campus_reporter', status: 1, createdAt: '2026-06-22T10:00:00' },
      { id: 11, schoolId: 1, publisherId: 25, title: '健身房前台', description: '负责会员登记、器材借还、简单的咨询服务。', salary: '12元/小时', workTime: '晚上6点-10点', location: '校内健身房', requirements: '形象良好，服务意识强', contactInfo: 'QQ: gym_front', status: 1, createdAt: '2026-06-23T16:00:00' },
      { id: 12, schoolId: 1, publisherId: 26, title: '便利店收银员', description: '宿舍区便利店收银、理货、清洁。', salary: '14元/小时', workTime: '轮班制', location: '宿舍区便利店', requirements: '认真负责，有收银经验优先', contactInfo: '手机: 139****6666', status: 1, createdAt: '2026-06-24T09:00:00' },
    ],
    // 公告 (10条)
    announcements: [
      { id: 1, schoolId: 1, title: '端午节放假通知', content: '端午节假期安排：6月22日至24日放假，共3天。6月25日正常上课。', type: 'notice', isTop: true, sortOrder: 10, status: 'published', publishTime: '2026-06-20T09:00:00', createdAt: '2026-06-20T09:00:00' },
      { id: 2, schoolId: 1, title: '校园歌手大赛报名开始', content: '校园歌手大赛开始报名啦！报名方式：登录校园广场APP填写报名表。截止时间：7月5日。', type: 'activity', isTop: true, sortOrder: 9, status: 'published', publishTime: '2026-06-20T14:00:00', createdAt: '2026-06-20T14:00:00' },
      { id: 3, schoolId: 1, title: '图书馆开放时间调整', content: '暑假期间图书馆开放时间调整为：周一至周日 8:00-22:00。', type: 'notice', isTop: false, sortOrder: 5, status: 'published', publishTime: '2026-06-18T10:00:00', createdAt: '2026-06-18T10:00:00' },
      { id: 4, schoolId: 1, title: '新学期选课通知', content: '新学期选课将于7月1日开始，请同学们提前登录教务系统查看课程安排。', type: 'news', isTop: false, sortOrder: 3, status: 'published', publishTime: '2026-06-15T09:00:00', createdAt: '2026-06-15T09:00:00' },
      { id: 5, schoolId: 1, title: '期末考试安排', content: '期末考试将于6月28日至7月8日进行，请同学们做好复习准备，诚信应考。', type: 'notice', isTop: true, sortOrder: 8, status: 'published', publishTime: '2026-06-19T09:00:00', createdAt: '2026-06-19T09:00:00' },
      { id: 6, schoolId: 1, title: '篮球赛报名通知', content: '校内篮球赛开始报名，每队5-8人，冠军队伍奖金1000元，报名截止6月30日。', type: 'activity', isTop: false, sortOrder: 6, status: 'published', publishTime: '2026-06-21T10:00:00', createdAt: '2026-06-21T10:00:00' },
      { id: 7, schoolId: 1, title: '校园网络维护通知', content: '6月25日凌晨0:00-4:00校园网进行维护，期间可能出现断网，请提前安排。', type: 'notice', isTop: false, sortOrder: 4, status: 'published', publishTime: '2026-06-22T14:00:00', createdAt: '2026-06-22T14:00:00' },
      { id: 8, schoolId: 1, title: '优秀毕业生评选启动', content: '2026届优秀毕业生评选工作正式启动，请各学院于7月1日前提交推荐名单。', type: 'news', isTop: false, sortOrder: 2, status: 'published', publishTime: '2026-06-17T09:00:00', createdAt: '2026-06-17T09:00:00' },
      { id: 9, schoolId: 1, title: '暑期社会实践报名', content: '暑期社会实践活动开始报名，提供多个实践基地选择，可获得学分认定。', type: 'activity', isTop: false, sortOrder: 7, status: 'published', publishTime: '2026-06-23T10:00:00', createdAt: '2026-06-23T10:00:00' },
      { id: 10, schoolId: 1, title: '食堂新菜品上线', content: '为满足同学们需求，食堂新增麻辣烫窗口和轻食套餐，欢迎品尝。', type: 'news', isTop: false, sortOrder: 1, status: 'published', publishTime: '2026-06-16T11:00:00', createdAt: '2026-06-16T11:00:00' },
    ],
    // 用户 (28条)
    users: [
      { id: 1, schoolId: 1, phone: '13800138000', nickname: '王小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=王小明', isVerified: true, status: 1, createdAt: '2026-06-01T10:00:00' },
      { id: 2, schoolId: 1, phone: '13800138001', nickname: '匿名用户', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=匿名用户', isVerified: false, status: 1, createdAt: '2026-06-10T10:00:00' },
      { id: 3, schoolId: 1, phone: '13800138002', nickname: '李同学', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=李同学', isVerified: true, status: 1, createdAt: '2026-06-05T10:00:00' },
      { id: 4, schoolId: 1, phone: '13800138003', nickname: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=张三', isVerified: false, status: 1, createdAt: '2026-06-12T10:00:00' },
      { id: 5, schoolId: 1, phone: '13800138004', nickname: '小红', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=小红', isVerified: true, status: 1, createdAt: '2026-06-08T10:00:00' },
      { id: 6, schoolId: 1, phone: '13800138005', nickname: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=李四', isVerified: true, status: 1, createdAt: '2026-06-15T10:00:00' },
      { id: 7, schoolId: 1, phone: '13800138006', nickname: '赵六', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=赵六', isVerified: false, status: 1, createdAt: '2026-06-18T10:00:00' },
      { id: 8, schoolId: 1, phone: '13800138007', nickname: '钱七', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=钱七', isVerified: true, status: 1, createdAt: '2026-06-20T10:00:00' },
      { id: 9, schoolId: 1, phone: '13800138008', nickname: '孙八', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=孙八', isVerified: false, status: 0, createdAt: '2026-06-22T10:00:00' },
      { id: 10, schoolId: 1, phone: '13800138009', nickname: '周九', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=周九', isVerified: true, status: 1, createdAt: '2026-06-01T10:00:00' },
      { id: 11, schoolId: 1, phone: '13800138010', nickname: '吴十', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=吴十', isVerified: true, status: 1, createdAt: '2026-06-03T10:00:00' },
      { id: 12, schoolId: 1, phone: '13800138011', nickname: '郑十一', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=郑十一', isVerified: false, status: 1, createdAt: '2026-06-07T10:00:00' },
      { id: 13, schoolId: 1, phone: '13800138012', nickname: '陈十二', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=陈十二', isVerified: true, status: 1, createdAt: '2026-06-11T10:00:00' },
      { id: 14, schoolId: 1, phone: '13800138013', nickname: '刘十三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=刘十三', isVerified: true, status: 1, createdAt: '2026-06-14T10:00:00' },
      { id: 15, schoolId: 1, phone: '13800138014', nickname: '黄十四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=黄十四', isVerified: false, status: 1, createdAt: '2026-06-17T10:00:00' },
      { id: 16, schoolId: 1, phone: '13800138015', nickname: '林十五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=林十五', isVerified: true, status: 1, createdAt: '2026-06-19T10:00:00' },
      { id: 17, schoolId: 1, phone: '13800138016', nickname: '何十六', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=何十六', isVerified: true, status: 1, createdAt: '2026-06-21T10:00:00' },
      { id: 18, schoolId: 1, phone: '13800138017', nickname: '郭十七', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=郭十七', isVerified: false, status: 1, createdAt: '2026-06-23T10:00:00' },
      { id: 19, schoolId: 1, phone: '13800138018', nickname: '马十八', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=马十八', isVerified: true, status: 1, createdAt: '2026-06-04T10:00:00' },
      { id: 20, schoolId: 1, phone: '13800138019', nickname: '罗十九', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=罗十九', isVerified: false, status: 0, createdAt: '2026-06-24T10:00:00' },
      { id: 21, schoolId: 1, phone: '13800138020', nickname: '梁二十', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=梁二十', isVerified: true, status: 1, createdAt: '2026-06-06T10:00:00' },
      { id: 22, schoolId: 1, phone: '13800138021', nickname: '宋二十一', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=宋二十一', isVerified: true, status: 1, createdAt: '2026-06-09T10:00:00' },
      { id: 23, schoolId: 1, phone: '13800138022', nickname: '谢二十二', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=谢二十二', isVerified: false, status: 1, createdAt: '2026-06-13T10:00:00' },
      { id: 24, schoolId: 1, phone: '13800138023', nickname: '韩二十三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=韩二十三', isVerified: true, status: 1, createdAt: '2026-06-16T10:00:00' },
      { id: 25, schoolId: 1, phone: '13800138024', nickname: '唐二十四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=唐二十四', isVerified: true, status: 1, createdAt: '2026-06-20T10:00:00' },
      { id: 26, schoolId: 1, phone: '13800138025', nickname: '许二十五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=许二十五', isVerified: true, status: 1, createdAt: '2026-06-02T10:00:00' },
      { id: 27, schoolId: 1, phone: '13800138026', nickname: '邓二十六', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=邓二十六', isVerified: false, status: 1, createdAt: '2026-06-24T10:00:00' },
      { id: 28, schoolId: 1, phone: '13800138027', nickname: '冯二十七', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=冯二十七', isVerified: true, status: 1, createdAt: '2026-06-25T10:00:00' },
    ],
    // 通知 (18条)
    notifications: [
      { id: 1, userId: 1, type: 'comment', title: '新评论', content: '小红 评论了你的帖子：顶！', relatedId: 1, isRead: false, createdAt: '2026-06-24T15:00:00' },
      { id: 2, userId: 1, type: 'like', title: '新点赞', content: '张三 赞了你的帖子', relatedId: 1, isRead: false, createdAt: '2026-06-24T16:00:00' },
      { id: 3, userId: 1, type: 'system', title: '系统通知', content: '欢迎加入校园广场！', relatedId: null, isRead: true, createdAt: '2026-06-01T10:00:00' },
      { id: 4, userId: 1, type: 'task', title: '任务状态更新', content: '你的任务"代取快递"已被接取', relatedId: 1, isRead: false, createdAt: '2026-06-24T12:00:00' },
      { id: 5, userId: 1, type: 'verification', title: '认证通知', content: '你的学生认证已通过', relatedId: null, isRead: true, createdAt: '2026-06-05T10:00:00' },
      { id: 6, userId: 1, type: 'comment', title: '新评论', content: '李四 评论了你的帖子：确实！', relatedId: 2, isRead: true, createdAt: '2026-06-23T11:00:00' },
      { id: 7, userId: 2, type: 'like', title: '新点赞', content: '王小明 赞了你的帖子', relatedId: 1, isRead: false, createdAt: '2026-06-24T15:30:00' },
      { id: 8, userId: 2, type: 'system', title: '系统通知', content: '请尽快完成学生认证，解锁更多功能', relatedId: null, isRead: false, createdAt: '2026-06-10T10:00:00' },
      { id: 9, userId: 3, type: 'task', title: '任务被接取', content: '你的任务"求代课，周三下午马原"已被接取', relatedId: 2, isRead: false, createdAt: '2026-06-24T11:00:00' },
      { id: 10, userId: 3, type: 'comment', title: '新评论', content: '赵六 评论了你的帖子：说清楚是哪个李同学', relatedId: 2, isRead: true, createdAt: '2026-06-24T12:00:00' },
      { id: 11, userId: 5, type: 'like', title: '新点赞', content: '周九 赞了你的帖子', relatedId: 4, isRead: false, createdAt: '2026-06-24T09:30:00' },
      { id: 12, userId: 5, type: 'verification', title: '认证通知', content: '你的学生认证已通过', relatedId: null, isRead: true, createdAt: '2026-06-08T10:00:00' },
      { id: 13, userId: 6, type: 'task', title: '任务已完成', content: '你接取的任务"帮忙买饭，送到宿舍"已完成', relatedId: 4, isRead: false, createdAt: '2026-06-24T13:00:00' },
      { id: 14, userId: 7, type: 'comment', title: '新评论', content: '钱七 评论了你的帖子：我也丢了伞', relatedId: 6, isRead: false, createdAt: '2026-06-24T10:00:00' },
      { id: 15, userId: 8, type: 'system', title: '系统通知', content: '校园广场版本更新，新增夜间模式', relatedId: null, isRead: true, createdAt: '2026-06-20T10:00:00' },
      { id: 16, userId: 10, type: 'like', title: '新点赞', content: '孙八 赞了你的评论', relatedId: 1, isRead: false, createdAt: '2026-06-24T16:00:00' },
      { id: 17, userId: 12, type: 'task', title: '任务被接取', content: '你的任务"帮忙搬宿舍"已被接取', relatedId: 8, isRead: false, createdAt: '2026-06-24T08:00:00' },
      { id: 18, userId: 15, type: 'comment', title: '新评论', content: '吴十 评论了你的帖子：多少钱出', relatedId: 13, isRead: true, createdAt: '2026-06-21T11:00:00' },
    ],
    // 举报 (10条)
    reports: [
      { id: 1, schoolId: 1, reporterId: 5, targetType: 'post', targetId: 2, reason: '内容涉嫌骚扰，泄露个人隐私信息', status: 0, handlerId: null, handleResult: '', createdAt: '2026-06-24T10:00:00', handledAt: null },
      { id: 2, schoolId: 1, reporterId: 6, targetType: 'post', targetId: 4, reason: '虚假信息，食堂并没有多给肉', status: 0, handlerId: null, handleResult: '', createdAt: '2026-06-24T09:00:00', handledAt: null },
      { id: 3, schoolId: 1, reporterId: 7, targetType: 'comment', targetId: 5, reason: '评论中含有不文明用语', status: 1, handlerId: 1, handleResult: '已删除该评论，警告用户', createdAt: '2026-06-23T14:00:00', handledAt: '2026-06-23T16:00:00' },
      { id: 4, schoolId: 1, reporterId: 8, targetType: 'post', targetId: 17, reason: '发布代写论文相关信息，违反学术诚信', status: 0, handlerId: null, handleResult: '', createdAt: '2026-06-24T10:00:00', handledAt: null },
      { id: 5, schoolId: 1, reporterId: 9, targetType: 'post', targetId: 19, reason: '拍摄他人照片未经同意，侵犯肖像权', status: 1, handlerId: 1, handleResult: '已要求删除照片，警告发帖人', createdAt: '2026-06-24T17:00:00', handledAt: '2026-06-24T18:00:00' },
      { id: 6, schoolId: 1, reporterId: 10, targetType: 'comment', targetId: 9, reason: '评论恶意攻击他人，语言粗俗', status: 0, handlerId: null, handleResult: '', createdAt: '2026-06-24T13:00:00', handledAt: null },
      { id: 7, schoolId: 1, reporterId: 11, targetType: 'post', targetId: 7, reason: '疑似诈骗，二手交易价格异常', status: 1, handlerId: 1, handleResult: '经核实交易正常，举报不成立', createdAt: '2026-06-23T22:00:00', handledAt: '2026-06-24T09:00:00' },
      { id: 8, schoolId: 1, reporterId: 12, targetType: 'user', targetId: 9, reason: '该用户多次发布违规内容', status: 1, handlerId: 1, handleResult: '已封禁用户账号7天', createdAt: '2026-06-22T10:00:00', handledAt: '2026-06-22T14:00:00' },
      { id: 9, schoolId: 1, reporterId: 13, targetType: 'post', targetId: 1, reason: '表白内容过于详细，可能泄露他人信息', status: 0, handlerId: null, handleResult: '', createdAt: '2026-06-24T18:00:00', handledAt: null },
      { id: 10, schoolId: 1, reporterId: 14, targetType: 'comment', targetId: 17, reason: '评论散布虚假消息', status: 1, handlerId: 1, handleResult: '已删除评论', createdAt: '2026-06-24T12:00:00', handledAt: '2026-06-24T14:00:00' },
    ],
    // 学生认证申请 (10条)
    verifications: [
      { id: 1, userId: 2, schoolId: 1, realName: '张伟', studentId: '202301001', idCard: '110101200501011234', studentCardUrl: '', department: '计算机学院', status: 0, rejectReason: '', reviewerId: null, verifiedAt: null, createdAt: '2026-06-24T08:00:00' },
      { id: 2, userId: 7, schoolId: 1, realName: '赵强', studentId: '202302015', idCard: '110101200502025678', studentCardUrl: '', department: '经济管理学院', status: 0, rejectReason: '', reviewerId: null, verifiedAt: null, createdAt: '2026-06-23T10:00:00' },
      { id: 3, userId: 4, schoolId: 1, realName: '李娜', studentId: '202201088', idCard: '110101200401089012', studentCardUrl: '', department: '外国语学院', status: 1, rejectReason: '', reviewerId: 1, verifiedAt: '2026-06-22T14:00:00', createdAt: '2026-06-22T08:00:00' },
      { id: 4, userId: 12, schoolId: 1, realName: '郑涛', studentId: '202303056', idCard: '110101200503059876', studentCardUrl: '', department: '机械工程学院', status: 1, rejectReason: '', reviewerId: 1, verifiedAt: '2026-06-21T10:00:00', createdAt: '2026-06-21T08:00:00' },
      { id: 5, userId: 15, schoolId: 1, realName: '黄伟', studentId: '202304112', idCard: '110101200504011223', studentCardUrl: '', department: '文学院', status: 2, rejectReason: '学生证照片不清晰，请重新上传', reviewerId: 1, verifiedAt: '2026-06-20T14:00:00', createdAt: '2026-06-20T08:00:00' },
      { id: 6, userId: 18, schoolId: 1, realName: '郭芳', studentId: '202305078', idCard: '110101200505023344', studentCardUrl: '', department: '化学学院', status: 0, rejectReason: '', reviewerId: null, verifiedAt: null, createdAt: '2026-06-24T09:00:00' },
      { id: 7, userId: 23, schoolId: 1, realName: '谢军', studentId: '202206034', idCard: '110101200206035566', studentCardUrl: '', department: '体育学院', status: 1, rejectReason: '', reviewerId: 1, verifiedAt: '2026-06-19T12:00:00', createdAt: '2026-06-19T08:00:00' },
      { id: 8, userId: 27, schoolId: 1, realName: '邓敏', studentId: '202306099', idCard: '110101200506047788', studentCardUrl: '', department: '法学院', status: 0, rejectReason: '', reviewerId: null, verifiedAt: null, createdAt: '2026-06-24T11:00:00' },
      { id: 9, userId: 9, schoolId: 1, realName: '孙丽', studentId: '202107045', idCard: '110101200107049900', studentCardUrl: '', department: '艺术学院', status: 2, rejectReason: '身份信息与学籍系统不匹配', reviewerId: 1, verifiedAt: '2026-06-18T16:00:00', createdAt: '2026-06-18T08:00:00' },
      { id: 10, userId: 20, schoolId: 1, realName: '罗平', studentId: '202208067', idCard: '110101200208061122', studentCardUrl: '', department: '物理学院', status: 1, rejectReason: '', reviewerId: 1, verifiedAt: '2026-06-17T10:00:00', createdAt: '2026-06-17T08:00:00' },
    ],
    // 学校
    schools: [
      { id: 1, name: '北京大学', code: 'pku', domain: 'pku.campussquare.com', logoUrl: '', description: '中国顶尖综合性大学', status: 1, config: {}, createdAt: '2026-01-01T00:00:00' },
      { id: 2, name: '清华大学', code: 'thu', domain: 'thu.campussquare.com', logoUrl: '', description: '中国顶尖理工科大学', status: 1, config: {}, createdAt: '2026-01-01T00:00:00' },
      { id: 3, name: '复旦大学', code: 'fudan', domain: 'fudan.campussquare.com', logoUrl: '', description: '上海顶尖综合性大学', status: 1, config: {}, createdAt: '2026-01-01T00:00:00' },
    ],
    // 管理员操作日志 (18条)
    auditLogs: [
      { id: 1, adminId: 1, schoolId: 1, action: '屏蔽帖子', target: 'post:2', detail: '屏蔽帖子：表白计算机学院李同学', createdAt: '2026-06-24T11:00:00' },
      { id: 2, adminId: 1, schoolId: 1, action: '发布公告', target: 'announcement:5', detail: '发布新公告：期末考试安排', createdAt: '2026-06-24T09:00:00' },
      { id: 3, adminId: 1, schoolId: 1, action: '审核通过', target: 'user:4', detail: '通过学生认证：李娜', createdAt: '2026-06-22T14:00:00' },
      { id: 4, adminId: 1, schoolId: 1, action: '禁用用户', target: 'user:9', detail: '禁用用户：孙八（发布违规内容）', createdAt: '2026-06-23T10:00:00' },
      { id: 5, adminId: 1, schoolId: 1, action: '处理举报', target: 'report:3', detail: '处理举报：删除不文明评论，警告用户', createdAt: '2026-06-23T16:00:00' },
      { id: 6, adminId: 1, schoolId: 1, action: '置顶公告', target: 'announcement:2', detail: '置顶公告：校园歌手大赛报名开始', createdAt: '2026-06-21T10:00:00' },
      { id: 7, adminId: 1, schoolId: 1, action: '审核通过', target: 'user:12', detail: '通过学生认证：郑涛', createdAt: '2026-06-21T10:00:00' },
      { id: 8, adminId: 1, schoolId: 1, action: '审核驳回', target: 'user:15', detail: '驳回学生认证：黄伟（照片不清晰）', createdAt: '2026-06-20T14:00:00' },
      { id: 9, adminId: 1, schoolId: 1, action: '解封用户', target: 'user:20', detail: '解封用户：罗平（禁言期已满）', createdAt: '2026-06-24T08:00:00' },
      { id: 10, adminId: 1, schoolId: 1, action: '删除评论', target: 'comment:17', detail: '删除散布虚假消息的评论', createdAt: '2026-06-24T14:00:00' },
      { id: 11, adminId: 1, schoolId: 1, action: '取消置顶', target: 'announcement:3', detail: '取消置顶：图书馆开放时间调整', createdAt: '2026-06-19T09:00:00' },
      { id: 12, adminId: 1, schoolId: 1, action: '审核通过', target: 'user:23', detail: '通过学生认证：谢军', createdAt: '2026-06-19T12:00:00' },
      { id: 13, adminId: 1, schoolId: 1, action: '屏蔽帖子', target: 'post:19', detail: '临时屏蔽帖子：网红来我们学校拍视频了（涉及肖像权争议）', createdAt: '2026-06-24T18:00:00' },
      { id: 14, adminId: 1, schoolId: 1, action: '处理举报', target: 'report:5', detail: '处理举报：要求删除照片，警告发帖人', createdAt: '2026-06-24T18:00:00' },
      { id: 15, adminId: 1, schoolId: 1, action: '审核通过', target: 'user:20', detail: '通过学生认证：罗平', createdAt: '2026-06-17T10:00:00' },
      { id: 16, adminId: 1, schoolId: 1, action: '发布公告', target: 'announcement:7', detail: '发布新公告：校园网络维护通知', createdAt: '2026-06-22T14:00:00' },
      { id: 17, adminId: 1, schoolId: 1, action: '处理举报', target: 'report:8', detail: '处理举报：封禁用户孙八账号7天', createdAt: '2026-06-22T14:00:00' },
      { id: 18, adminId: 1, schoolId: 1, action: '审核驳回', target: 'user:9', detail: '驳回学生认证：孙丽（身份信息不匹配）', createdAt: '2026-06-18T16:00:00' },
    ],
    // 当前登录用户（C端）
    currentUser: {
      id: 1,
      schoolId: 1,
      phone: '13800138000',
      nickname: '王小明',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=王小明',
      isVerified: true,
      status: 1,
    },
    // 当前登录管理员（B端）
    currentAdmin: {
      id: 1,
      schoolId: 1,
      username: 'admin',
      realName: '管理员',
      role: 'school_admin',
    },
  };

  // 初始化数据存储
  function initStore() {
    const existing = localStorage.getItem(STORE_KEY);
    if (!existing) {
      localStorage.setItem(STORE_KEY, JSON.stringify(defaultData));
    }
  }

  // 获取数据
  function getData() {
    const data = localStorage.getItem(STORE_KEY);
    return data ? JSON.parse(data) : { ...defaultData };
  }

  // 保存数据
  function saveData(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  // 通用 CRUD 操作
  const DataStore = {
    // 帖子
    getPosts: () => getData().posts,
    getPostById: (id) => getData().posts.find(p => p.id === id),
    addPost: (post) => {
      const data = getData();
      post.id = Date.now();
      post.createdAt = new Date().toISOString();
      data.posts.unshift(post);
      saveData(data);
      return post;
    },
    updatePost: (id, updates) => {
      const data = getData();
      const idx = data.posts.findIndex(p => p.id === id);
      if (idx !== -1) {
        data.posts[idx] = { ...data.posts[idx], ...updates };
        saveData(data);
      }
      return data.posts[idx];
    },
    deletePost: (id) => {
      const data = getData();
      data.posts = data.posts.filter(p => p.id !== id);
      saveData(data);
    },
    blockPost: (id) => DataStore.updatePost(id, { status: 2 }),
    unblockPost: (id) => DataStore.updatePost(id, { status: 1 }),
    likePost: (id) => {
      const post = DataStore.getPostById(id);
      if (post) DataStore.updatePost(id, { likeCount: post.likeCount + 1 });
    },

    // 评论
    getComments: (postId) => getData().comments.filter(c => c.postId === postId),
    addComment: (comment) => {
      const data = getData();
      comment.id = Date.now();
      comment.createdAt = new Date().toISOString();
      data.comments.push(comment);
      // 更新帖子评论数
      const post = data.posts.find(p => p.id === comment.postId);
      if (post) post.commentCount = (post.commentCount || 0) + 1;
      saveData(data);
      return comment;
    },
    deleteComment: (id) => {
      const data = getData();
      data.comments = data.comments.filter(c => c.id !== id);
      saveData(data);
    },

    // 任务
    getTasks: () => getData().tasks,
    getTaskById: (id) => getData().tasks.find(t => t.id === id),
    addTask: (task) => {
      const data = getData();
      task.id = Date.now();
      task.createdAt = new Date().toISOString();
      data.tasks.unshift(task);
      saveData(data);
      return task;
    },
    updateTask: (id, updates) => {
      const data = getData();
      const idx = data.tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        data.tasks[idx] = { ...data.tasks[idx], ...updates };
        saveData(data);
      }
      return data.tasks[idx];
    },
    takeTask: (id, userId) => DataStore.updateTask(id, { status: 1, takerId: userId, takenAt: new Date().toISOString() }),
    completeTask: (id) => DataStore.updateTask(id, { status: 2, completedAt: new Date().toISOString() }),
    cancelTask: (id) => DataStore.updateTask(id, { status: 3 }),

    // 兼职
    getJobs: () => getData().jobs,
    getJobById: (id) => getData().jobs.find(j => j.id === id),
    addJob: (job) => {
      const data = getData();
      job.id = Date.now();
      job.createdAt = new Date().toISOString();
      data.jobs.unshift(job);
      saveData(data);
      return job;
    },
    closeJob: (id) => {
      const data = getData();
      const idx = data.jobs.findIndex(j => j.id === id);
      if (idx !== -1) {
        data.jobs[idx].status = 0;
        saveData(data);
      }
    },

    // 公告
    getAnnouncements: () => getData().announcements,
    addAnnouncement: (ann) => {
      const data = getData();
      ann.id = Date.now();
      ann.createdAt = new Date().toISOString();
      data.announcements.unshift(ann);
      saveData(data);
      return ann;
    },
    updateAnnouncement: (id, updates) => {
      const data = getData();
      const idx = data.announcements.findIndex(a => a.id === id);
      if (idx !== -1) {
        data.announcements[idx] = { ...data.announcements[idx], ...updates };
        saveData(data);
      }
      return data.announcements[idx];
    },
    deleteAnnouncement: (id) => {
      const data = getData();
      data.announcements = data.announcements.filter(a => a.id !== id);
      saveData(data);
    },

    // 用户
    getUsers: () => getData().users,
    getUserById: (id) => getData().users.find(u => u.id === id),
    updateUser: (id, updates) => {
      const data = getData();
      const idx = data.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        data.users[idx] = { ...data.users[idx], ...updates };
        saveData(data);
      }
      return data.users[idx];
    },
    disableUser: (id) => DataStore.updateUser(id, { status: 0 }),
    enableUser: (id) => DataStore.updateUser(id, { status: 1 }),

    // 认证
    getVerifications: () => getData().verifications,
    verifyStudent: (id, status, rejectReason = '') => {
      const data = getData();
      const idx = data.verifications.findIndex(v => v.id === id);
      if (idx !== -1) {
        data.verifications[idx].status = status;
        data.verifications[idx].rejectReason = rejectReason;
        data.verifications[idx].verifiedAt = new Date().toISOString();
        // 同步更新用户认证状态
        const userId = data.verifications[idx].userId;
        const userIdx = data.users.findIndex(u => u.id === userId);
        if (userIdx !== -1) {
          data.users[userIdx].isVerified = status === 1;
        }
        saveData(data);
      }
      return data.verifications[idx];
    },

    // 通知
    getNotifications: (userId) => getData().notifications.filter(n => n.userId === userId),
    addNotification: (notif) => {
      const data = getData();
      notif.id = Date.now();
      notif.createdAt = new Date().toISOString();
      notif.isRead = false;
      data.notifications.unshift(notif);
      saveData(data);
      return notif;
    },
    markRead: (id) => {
      const data = getData();
      const idx = data.notifications.findIndex(n => n.id === id);
      if (idx !== -1) {
        data.notifications[idx].isRead = true;
        saveData(data);
      }
    },
    markAllRead: (userId) => {
      const data = getData();
      data.notifications.forEach(n => { if (n.userId === userId) n.isRead = true; });
      saveData(data);
    },

    // 举报
    getReports: () => getData().reports,
    addReport: (report) => {
      const data = getData();
      report.id = Date.now();
      report.createdAt = new Date().toISOString();
      report.status = 0;
      data.reports.unshift(report);
      saveData(data);
      return report;
    },
    handleReport: (id, handlerId, result) => {
      const data = getData();
      const idx = data.reports.findIndex(r => r.id === id);
      if (idx !== -1) {
        data.reports[idx].status = 1;
        data.reports[idx].handlerId = handlerId;
        data.reports[idx].handleResult = result;
        data.reports[idx].handledAt = new Date().toISOString();
        saveData(data);
      }
      return data.reports[idx];
    },

    // 学校
    getSchools: () => getData().schools,
    addSchool: (school) => {
      const data = getData();
      school.id = Date.now();
      school.createdAt = new Date().toISOString();
      data.schools.push(school);
      saveData(data);
      return school;
    },
    updateSchool: (id, updates) => {
      const data = getData();
      const idx = data.schools.findIndex(s => s.id === id);
      if (idx !== -1) {
        data.schools[idx] = { ...data.schools[idx], ...updates };
        saveData(data);
      }
      return data.schools[idx];
    },

    // 审计日志
    getAuditLogs: () => getData().auditLogs,
    addAuditLog: (log) => {
      const data = getData();
      log.id = Date.now();
      log.createdAt = new Date().toISOString();
      data.auditLogs.unshift(log);
      saveData(data);
    },

    // 当前用户
    getCurrentUser: () => getData().currentUser,
    setCurrentUser: (user) => {
      const data = getData();
      data.currentUser = user;
      saveData(data);
    },

    // 当前管理员
    getCurrentAdmin: () => getData().currentAdmin,
    setCurrentAdmin: (admin) => {
      const data = getData();
      data.currentAdmin = admin;
      saveData(data);
    },

    // 重置数据
    resetData: () => {
      localStorage.setItem(STORE_KEY, JSON.stringify(defaultData));
    },

    // 获取统计
    getStats: () => {
      const data = getData();
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      return {
        totalPosts: data.posts.length,
        totalUsers: data.users.length,
        totalTasks: data.tasks.length,
        totalJobs: data.jobs.length,
        pendingReports: data.reports.filter(r => r.status === 0).length,
        pendingVerifications: data.verifications.filter(v => v.status === 0).length,
        todayPosts: data.posts.filter(p => p.createdAt.startsWith(today)).length,
        todayUsers: data.users.filter(u => u.createdAt.startsWith(today)).length,
        hotPosts: data.posts.filter(p => p.isHot).length,
      };
    },
  };

  // 初始化
  initStore();

  // 暴露到全局
  window.DataStore = DataStore;

})();
