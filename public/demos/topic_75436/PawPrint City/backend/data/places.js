// 爪印城市 - 模拟场所数据
// 坐标系统：模拟地图使用像素坐标 (x, y)，地图尺寸 1200x900
// 覆盖区域：模拟北京朝阳区/三里屯核心商圈

const places = [
  {
    id: 1,
    name: 'Pawffee 爪咖啡·宠物友好咖啡馆',
    type: '餐饮',
    address: '朝阳区三里屯太古里南区B1层18号',
    coordinate: { x: 520, y: 280 },
    rating: 4.8,
    reviewCount: 326,
    phone: '010-64168888',
    hours: '09:00-22:00',
    description: '北京首家专为宠物打造的精品咖啡馆，店内设有宠物专属休息区，提供免费宠物饮用水和自制宠物零食。主理人是一位资深猫奴，店内还收养了3只流浪猫。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类', '猫类'],
      sizeLimit: ['小型', '中型'],
      requirements: '宠物需佩戴牵引绳，大型犬需戴嘴套，猫类需使用航空箱或宠物背包',
      facilities: ['宠物水碗', '宠物专区', '免费宠物零食', '拾便袋']
    },
    verifyCount: 48,
    verifies: [
      { user: '柴犬小丸子', content: '周末带我家狗狗去的，店员超级友好，还给了免费的宠物零食！狗子玩得很开心~', time: '2026-06-28', avatar: '🐕' },
      { user: '布偶猫的主人', content: '猫猫友好区真的超棒，有猫爬架和猫薄荷，我家布偶都不想走了。', time: '2026-06-25', avatar: '🐱' },
      { user: '柯基控', content: '室外有宠物草坪，狗狗可以自由奔跑，还有专门的宠物饮水机，很贴心！', time: '2026-06-20', avatar: '🐶' }
    ],
    images: ['cafe1', 'cafe2', 'cafe3', 'cafe4']
  },
  {
    id: 2,
    name: 'WOOF·宠物友好精酿餐吧',
    type: '餐饮',
    address: '朝阳区工体北路8号院三里屯SOHO 2号商场1层',
    coordinate: { x: 580, y: 320 },
    rating: 4.6,
    reviewCount: 198,
    phone: '010-64165555',
    hours: '11:00-次日01:00',
    description: '融合精酿啤酒与宠物友好的潮流餐吧，拥有超大户外露台，宠物可以陪伴主人一起享受美食与氛围。每周六举办宠物社交派对。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类'],
      sizeLimit: ['小型', '中型', '大型'],
      requirements: '犬只需佩戴牵引绳，烈性犬需戴嘴套，户外区域自由活动',
      facilities: ['宠物水碗', '宠物专区', '拾便袋']
    },
    verifyCount: 32,
    verifies: [
      { user: '金毛大暖男', content: '户外露台太适合带狗了！我家金毛在草坪上打滚，店员还送了狗狗啤酒（其实是肉汤）。', time: '2026-06-26', avatar: '🦮' },
      { user: '边牧麻麻', content: '周六的宠物派对超好玩，认识了好多狗友，狗狗也交到了新朋友。', time: '2026-06-22', avatar: '🐕' },
      { user: '哈士奇二哈', content: '老板说不管什么狗都欢迎，我家二哈终于找到组织了！', time: '2026-06-18', avatar: '🐺' }
    ],
    images: ['bar1', 'bar2', 'bar3']
  },
  {
    id: 3,
    name: 'MiaoMiao Cat·猫咪主题甜品屋',
    type: '餐饮',
    address: '朝阳区青年路朝阳大悦城B1层32号',
    coordinate: { x: 680, y: 240 },
    rating: 4.7,
    reviewCount: 215,
    phone: '010-85551234',
    hours: '10:00-21:00',
    description: '以猫咪为主题的甜品店，店内装修充满猫咪元素，提供猫形蛋糕、猫爪布丁等萌系甜品。猫咪友好专区设有猫爬架和玩具。',
    petPolicy: {
      allowed: true,
      petTypes: ['猫类'],
      sizeLimit: ['小型', '中型'],
      requirements: '猫需使用航空箱或宠物背包进入，店内提供猫砂盆',
      facilities: ['宠物专区', '免费宠物零食', '拾便袋']
    },
    verifyCount: 25,
    verifies: [
      { user: '英短控', content: '带我家英短蓝猫来的，猫猫区有超级大的猫爬架，还有各种逗猫棒，猫咪开心坏了。', time: '2026-06-27', avatar: '🐱' },
      { user: '橘猫爸爸', content: '猫爪蛋糕太可爱了！味道也很棒，猫咪也有专属的猫布丁可以吃。', time: '2026-06-21', avatar: '🐈' },
      { user: '多猫家庭', content: '可以一次带两只猫来，空间很大，每只猫都玩得很尽兴。', time: '2026-06-15', avatar: '😺' }
    ],
    images: ['catcafe1', 'catcafe2', 'catcafe3']
  },
  {
    id: 4,
    name: 'Pawtel 爪印·宠物友好设计酒店',
    type: '住宿',
    address: '朝阳区酒仙桥路4号798艺术区内',
    coordinate: { x: 380, y: 200 },
    rating: 4.9,
    reviewCount: 412,
    phone: '010-64360000',
    hours: '24小时营业',
    description: '国内首家宠物友好设计酒店，坐落于798艺术区，每间客房均配备宠物专属床铺、食盆、玩具礼包。酒店设有宠物SPA、宠物泳池和宠物餐厅。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类', '猫类'],
      sizeLimit: ['小型', '中型', '大型'],
      requirements: '宠物需提供疫苗证明，每间房限2只宠物，宠物不可单独留在房间',
      facilities: ['宠物水碗', '宠物专区', '免费宠物零食', '拾便袋']
    },
    verifyCount: 89,
    verifies: [
      { user: '旅行达人Lily', content: '住了两晚，宠物设施太齐全了！狗狗有自己的小床和玩具，酒店还提供宠物SPA服务。', time: '2026-06-30', avatar: '🏨' },
      { user: '萨摩耶家族', content: '宠物泳池太赞了！我家萨摩耶玩了一下午，房间还有宠物专属阳台，完美。', time: '2026-06-24', avatar: '🐕' },
      { user: '出差也要带狗', content: '出差住了三天，宠物餐厅的菜单很丰富，连我家挑食的泰迪都吃得很香。', time: '2026-06-19', avatar: '💼' }
    ],
    images: ['hotel1', 'hotel2', 'hotel3', 'hotel4']
  },
  {
    id: 5,
    name: '朝阳公园·宠物友好区',
    type: '公共空间',
    address: '朝阳区朝阳公园南路1号',
    coordinate: { x: 600, y: 400 },
    rating: 4.5,
    reviewCount: 567,
    phone: '010-65953666',
    hours: '06:00-22:00',
    description: '朝阳公园内设有专门宠物活动区，占地约5000平方米，分为大型犬区和中小型犬区，配备宠物饮水设施、宠物厕所和休息长椅。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类'],
      sizeLimit: ['小型', '中型', '大型'],
      requirements: '宠物需佩戴牵引绳，大型犬需戴嘴套，禁止猫类进入（公园内鸟类保护区）',
      facilities: ['宠物水碗', '宠物专区', '拾便袋']
    },
    verifyCount: 102,
    verifies: [
      { user: '拉布拉多铲屎官', content: '每天必来的遛狗圣地！大草坪很干净，狗狗可以尽情奔跑，认识的狗友越来越多。', time: '2026-06-29', avatar: '🦮' },
      { user: '周末遛狗人', content: '宠物区管理得很好，有专门的围栏，不用担心狗狗跑丢，环境也很干净。', time: '2026-06-26', avatar: '🌳' },
      { user: '两狗一猫', content: '大型犬区和小型犬区分开很合理，小型犬不会被大狗欺负，很安全。', time: '2026-06-20', avatar: '🐕' }
    ],
    images: ['park1', 'park2', 'park3']
  },
  {
    id: 6,
    name: 'PETS R US·宠物友好购物中心',
    type: '商业',
    address: '朝阳区东三环中路65号富力广场B1-F4',
    coordinate: { x: 480, y: 360 },
    rating: 4.4,
    reviewCount: 289,
    phone: '010-59051234',
    hours: '10:00-22:00',
    description: '全层宠物友好购物中心，商场内允许宠物推车或宠物背包进入，B1层设有宠物寄养中心和宠物用品超市。部分餐饮店铺允许宠物入座。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类', '猫类'],
      sizeLimit: ['小型', '中型'],
      requirements: '宠物需使用宠物推车或宠物背包，大型犬可在一层指定区域活动',
      facilities: ['宠物水碗', '宠物专区', '拾便袋']
    },
    verifyCount: 56,
    verifies: [
      { user: '逛街达人小美', content: '终于可以带宠物一起逛街了！B1的宠物用品超市东西很全，还遇到了宠物美容快闪店。', time: '2026-06-28', avatar: '🛍️' },
      { user: '泰迪控', content: '商场提供宠物推车租赁，很方便，我家泰迪坐在推车里跟着我逛了一下午。', time: '2026-06-23', avatar: '🐩' },
      { user: '宠物用品买手', content: 'B1的宠物寄养中心很专业，逛累了可以把宠物寄养一会儿，每小时才30元。', time: '2026-06-17', avatar: '🛒' }
    ],
    images: ['mall1', 'mall2', 'mall3', 'mall4']
  },
  {
    id: 7,
    name: '胡同猫咖·南锣鼓巷店',
    type: '餐饮',
    address: '东城区南锣鼓巷110号',
    coordinate: { x: 440, y: 180 },
    rating: 4.5,
    reviewCount: 178,
    phone: '010-64031234',
    hours: '10:00-20:00',
    description: '藏在胡同里的猫咪主题咖啡馆，店内收养了12只流浪猫，提供猫咪互动体验。同时也欢迎带自家猫咪前来social。',
    petPolicy: {
      allowed: true,
      petTypes: ['猫类'],
      sizeLimit: ['小型', '中型'],
      requirements: '携带自家猫咪需提供疫苗证明，建议使用航空箱',
      facilities: ['宠物水碗', '宠物专区', '免费宠物零食']
    },
    verifyCount: 34,
    verifies: [
      { user: '猫奴小七', content: '胡同里的猫咖太有氛围了，12只猫猫各有性格，我家猫和店里的猫居然玩到一起了！', time: '2026-06-28', avatar: '😻' },
      { user: '文艺猫青年', content: '坐在四合院里喝咖啡撸猫，简直是人生理想。店里的猫都很亲人。', time: '2026-06-22', avatar: '☕' },
      { user: '救助流浪猫', content: '听说这里的猫都是救助的流浪猫，非常有爱心，咖啡也很好喝。', time: '2026-06-16', avatar: '💚' }
    ],
    images: ['hutong1', 'hutong2', 'hutong3']
  },
  {
    id: 8,
    name: 'BarkPark·奥森宠物乐园',
    type: '公共空间',
    address: '朝阳区奥林匹克森林公园南园',
    coordinate: { x: 320, y: 120 },
    rating: 4.7,
    reviewCount: 423,
    phone: '010-84913210',
    hours: '06:00-21:00',
    description: '奥林匹克森林公园内设宠物专属乐园，占地8000平方米，拥有宠物游泳池、敏捷训练场、宠物社交草坪等专业设施。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类'],
      sizeLimit: ['小型', '中型', '大型'],
      requirements: '宠物需佩戴牵引绳，进入泳池需提前预约，提供疫苗证明',
      facilities: ['宠物水碗', '宠物专区', '拾便袋', '免费宠物零食']
    },
    verifyCount: 76,
    verifies: [
      { user: '边牧训练师', content: '敏捷训练场太专业了！我家边牧玩得不亦乐乎，还参加了周末的敏捷比赛。', time: '2026-06-30', avatar: '🏃' },
      { user: '游泳健将', content: '宠物游泳池有专人看护，很安全，我家拉布拉多游了一个小时都不想上来。', time: '2026-06-25', avatar: '🏊' },
      { user: '柯基家族', content: '社交草坪很大，柯基短腿也能跑得很开心，还有专门的柯基聚会群。', time: '2026-06-19', avatar: '🐕' }
    ],
    images: ['barkpark1', 'barkpark2', 'barkpark3']
  },
  {
    id: 9,
    name: 'PetHome·宠物友好服务式公寓',
    type: '住宿',
    address: '朝阳区望京街10号望京SOHO T3',
    coordinate: { x: 260, y: 280 },
    rating: 4.5,
    reviewCount: 156,
    phone: '010-84728888',
    hours: '24小时',
    description: '宠物友好服务式公寓，提供长短期住宿，配备宠物厨房、宠物洗衣房、宠物活动室。隔壁就是宠物医院，宠物健康有保障。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类', '猫类'],
      sizeLimit: ['小型', '中型'],
      requirements: '宠物需提供疫苗证明和绝育证明，月租需额外支付宠物清洁费200元',
      facilities: ['宠物水碗', '宠物专区', '拾便袋']
    },
    verifyCount: 28,
    verifies: [
      { user: '北漂养狗人', content: '在北京找宠物友好公寓太难了，这里简直是养宠人的天堂！宠物厨房可以自己给狗狗做零食。', time: '2026-06-27', avatar: '🏠' },
      { user: '猫猫公寓', content: '房间有猫爬架和猫抓板，猫猫适应得很好，宠物活动室每天都有猫咪聚会。', time: '2026-06-21', avatar: '🐱' },
      { user: '出差常住', content: '出差住了两周，宠物洗衣房很方便，隔壁宠物医院随时可以体检，很安心。', time: '2026-06-15', avatar: '✈️' }
    ],
    images: ['apt1', 'apt2', 'apt3']
  },
  {
    id: 10,
    name: 'Paws & Shop·宠物友好集合店',
    type: '商业',
    address: '朝阳区建国路87号SKP-S B1层',
    coordinate: { x: 540, y: 420 },
    rating: 4.6,
    reviewCount: 203,
    phone: '010-65305555',
    hours: '10:00-22:00',
    description: '高端宠物友好集合店，集合了宠物服装、宠物摄影、宠物美容、宠物烘焙等业态。宠物可在店内自由活动，还有宠物T台秀。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类', '猫类'],
      sizeLimit: ['小型', '中型'],
      requirements: '宠物需佩戴牵引绳或使用宠物推车，参加T台秀需提前报名',
      facilities: ['宠物水碗', '宠物专区', '免费宠物零食', '拾便袋']
    },
    verifyCount: 43,
    verifies: [
      { user: '时尚宠物博主', content: '宠物服装区太好逛了！给狗狗买了好几件衣服，还有宠物摄影棚可以拍写真。', time: '2026-06-29', avatar: '📸' },
      { user: '烘焙爱好者', content: '宠物烘焙课程很有意思，学会了做宠物蛋糕，我家狗狗吃得超开心。', time: '2026-06-24', avatar: '🎂' },
      { user: '美容达人', content: '宠物美容师手法很专业，给狗狗做了个超可爱的造型，还送了宠物香水。', time: '2026-06-18', avatar: '💇' }
    ],
    images: ['shop1', 'shop2', 'shop3']
  },
  {
    id: 11,
    name: '通州大运河宠物友好公园',
    type: '公共空间',
    address: '通州区滨河中路大运河森林公园',
    coordinate: { x: 780, y: 380 },
    rating: 4.3,
    reviewCount: 345,
    phone: '010-81521111',
    hours: '06:00-22:00',
    description: '大运河森林公园内设宠物友好区，沿运河有宠物散步道，设有宠物饮水点和宠物厕所。春季有大片花海，是宠物写真圣地。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类'],
      sizeLimit: ['小型', '中型', '大型'],
      requirements: '宠物需佩戴牵引绳，禁止进入湿地保护区和水域',
      facilities: ['宠物水碗', '拾便袋']
    },
    verifyCount: 58,
    verifies: [
      { user: '通州狗友', content: '运河边的散步道太适合遛狗了，风景好，距离也够长，狗狗走一圈刚好。', time: '2026-06-28', avatar: '🚶' },
      { user: '花海摄影', content: '春天的花海太美了，带狗狗拍了好多写真，朋友圈点赞爆了！', time: '2026-06-23', avatar: '🌸' },
      { user: '周末家庭日', content: '全家带狗一起来，孩子在草坪上玩，狗狗在宠物区跑，完美周末。', time: '2026-06-17', avatar: '👨‍👩‍👧‍👦' }
    ],
    images: ['canal1', 'canal2', 'canal3']
  },
  {
    id: 12,
    name: 'DoggyDay·宠物日托中心 & 咖啡',
    type: '餐饮',
    address: '朝阳区广渠路36号院首城国际B座',
    coordinate: { x: 620, y: 460 },
    rating: 4.6,
    reviewCount: 167,
    phone: '010-67789999',
    hours: '08:00-20:00',
    description: '宠物日托中心与咖啡馆的结合体，主人上班时将宠物托管在此，下班后来接顺便喝杯咖啡。提供宠物日间看护、训练、社交服务。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类', '猫类'],
      sizeLimit: ['小型', '中型', '大型'],
      requirements: '日托需提供疫苗证明，首次入托需进行行为评估',
      facilities: ['宠物水碗', '宠物专区', '免费宠物零食', '拾便袋']
    },
    verifyCount: 52,
    verifies: [
      { user: '上班族狗妈', content: '每天上班把狗狗送过来，下班来接，狗狗白天有伴玩，比在家拆家好多了！', time: '2026-06-30', avatar: '💼' },
      { user: '出差无忧', content: '临时出差两天，把猫咪寄养在这里，每天收到视频更新，看到猫咪玩得很开心就放心了。', time: '2026-06-24', avatar: '😌' },
      { user: '训练有方', content: '这里的训练师很专业，帮我家狗狗改掉了扑人的坏习惯，现在带出去特有面子。', time: '2026-06-18', avatar: '🎓' }
    ],
    images: ['daycare1', 'daycare2', 'daycare3']
  },
  {
    id: 13,
    name: 'CatForest·猫咪森林主题酒店',
    type: '住宿',
    address: '海淀区中关村大街15号中关村广场',
    coordinate: { x: 360, y: 340 },
    rating: 4.4,
    reviewCount: 134,
    phone: '010-62568888',
    hours: '24小时',
    description: '猫咪主题宠物友好酒店，每间房都有猫爬架和猫眺望台，酒店内设有猫咪图书馆和猫咪影院。同时欢迎犬类宠物入住。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类', '猫类'],
      sizeLimit: ['小型', '中型'],
      requirements: '犬只需佩戴牵引绳，猫需提供疫苗证明，宠物不可上床',
      facilities: ['宠物水碗', '宠物专区', '免费宠物零食', '拾便袋']
    },
    verifyCount: 22,
    verifies: [
      { user: '猫奴旅行家', content: '猫咪主题酒店太有创意了，房间里的猫爬架是我家猫的最爱，猫咪图书馆还能借阅猫咪相关书籍。', time: '2026-06-27', avatar: '📚' },
      { user: '情侣出游', content: '和男朋友带狗来住，酒店很贴心准备了宠物床和食盆，还有宠物欢迎礼包。', time: '2026-06-21', avatar: '💑' },
      { user: '猫咪影院', content: '猫咪影院太有意思了，可以抱着猫看电影，播放的还是猫咪主题电影。', time: '2026-06-14', avatar: '🎬' }
    ],
    images: ['catforest1', 'catforest2', 'catforest3']
  },
  {
    id: 14,
    name: 'PawPlaza·宠物友好社区商业',
    type: '商业',
    address: '朝阳区常营中路3号院长楹天街',
    coordinate: { x: 700, y: 320 },
    rating: 4.3,
    reviewCount: 178,
    phone: '010-65756666',
    hours: '10:00-22:00',
    description: '社区型宠物友好商业体，一层设有宠物服务站（美容、寄养、医疗），二层以上为宠物友好购物区。每月举办宠物领养日活动。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类', '猫类'],
      sizeLimit: ['小型', '中型'],
      requirements: '宠物需使用宠物推车或宠物背包，大型犬需在一层宠物服务站区域活动',
      facilities: ['宠物水碗', '宠物专区', '拾便袋']
    },
    verifyCount: 35,
    verifies: [
      { user: '社区邻居', content: '家门口的宠物友好商场太方便了，一层宠物服务站可以一站式搞定美容和体检。', time: '2026-06-28', avatar: '🏘️' },
      { user: '领养代替购买', content: '每月的领养日活动很有意义，已经帮朋友在这里领养了一只流浪猫。', time: '2026-06-22', avatar: '🤝' },
      { user: '宠物医疗', content: '宠物服务站里的宠物医院很专业，医生很耐心，收费也比较合理。', time: '2026-06-16', avatar: '🏥' }
    ],
    images: ['plaza1', 'plaza2', 'plaza3']
  },
  {
    id: 15,
    name: '花市宠物友好文化广场',
    type: '公共空间',
    address: '东城区花市大街与崇文门外大街交叉口',
    coordinate: { x: 500, y: 500 },
    rating: 4.2,
    reviewCount: 234,
    phone: '010-67151234',
    hours: '全天开放',
    description: '花市历史文化街区改造的宠物友好广场，保留老北京胡同文化特色，设有宠物饮水台、宠物雕塑打卡点，经常举办宠物文化活动。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类', '猫类'],
      sizeLimit: ['小型', '中型', '大型'],
      requirements: '宠物需佩戴牵引绳，猫类需使用宠物背包，注意保持环境卫生',
      facilities: ['宠物水碗', '拾便袋']
    },
    verifyCount: 41,
    verifies: [
      { user: '老北京狗友', content: '花市广场改造后太适合遛狗了，宠物雕塑很可爱，还保留了老北京的味道。', time: '2026-06-29', avatar: '🏮' },
      { user: '文化活动', content: '周末的宠物文化节很好玩，有宠物汉服秀、宠物书法展，很有意思。', time: '2026-06-23', avatar: '🎭' },
      { user: '打卡达人', content: '宠物雕塑打卡墙非常出片，带狗狗拍了好多照片，推荐傍晚来光线最好。', time: '2026-06-17', avatar: '📷' }
    ],
    images: ['square1', 'square2', 'square3']
  },
  {
    id: 16,
    name: '星巴克·宠物友好臻选店',
    type: '餐饮',
    address: '朝阳区建国门外大街1号国贸三期A座',
    coordinate: { x: 500, y: 260 },
    rating: 4.3,
    reviewCount: 289,
    phone: '010-65055555',
    hours: '07:00-23:00',
    description: '星巴克宠物友好臻选店，室外设有宠物专属休息区，提供免费的Puppuccino（宠物奶油杯），是CBD白领带宠物的热门打卡地。',
    petPolicy: {
      allowed: true,
      petTypes: ['犬类', '猫类'],
      sizeLimit: ['小型', '中型'],
      requirements: '宠物仅限室外区域，需佩戴牵引绳，不可进入室内点单区',
      facilities: ['宠物水碗', '宠物专区', '免费宠物零食']
    },
    verifyCount: 65,
    verifies: [
      { user: 'CBD白领', content: '上班前遛狗必来，狗狗喝Puppuccino我喝咖啡，元气满满的早晨！', time: '2026-06-30', avatar: '☕' },
      { user: '星巴克粉', content: 'Puppuccino是免费的，狗狗每次都喝得满脸都是奶油，太可爱了。', time: '2026-06-26', avatar: '🐶' },
      { user: '面试路过', content: '来国贸面试顺便遛狗，宠物区很干净，店员还会主动给狗狗倒水，服务满分。', time: '2026-06-20', avatar: '💯' }
    ],
    images: ['starbucks1', 'starbucks2', 'starbucks3']
  }
];

// ========== 上海城市场所数据 ==========
const shanghaiPlaces = [
  {
    id: 101, name: 'Pawbucks·宠物友好星巴克旗舰店', city: '上海', type: '餐饮',
    address: '静安区南京西路1515号静安嘉里中心1层',
    coordinate: { x: 520, y: 260 }, rating: 4.6, reviewCount: 312,
    phone: '021-62886666', hours: '07:00-23:00',
    description: '星巴克宠物友好旗舰店，室外设有超大面积宠物休息区，提供免费Puppuccino和宠物专属菜单，周末举办宠物领养活动。',
    petPolicy: { allowed: true, petTypes: ['犬类', '猫类'], sizeLimit: ['小型', '中型'], requirements: '宠物仅限室外区域，需佩戴牵引绳', facilities: ['宠物水碗', '宠物专区', '免费宠物零食'] },
    verifyCount: 56,
    verifies: [
      { user: '上海小资狗妈', content: '静安寺附近的宠物友好咖啡店，室外区域很大，狗狗可以自由活动，Puppuccino免费！', time: '2026-07-01', avatar: '🐕' },
      { user: '布偶猫公主', content: '带猫猫来的，有专门的猫包存放处，环境很干净，店员态度超好。', time: '2026-06-28', avatar: '🐱' },
      { user: '领养志愿者', content: '周末领养活动很有意义，已经帮三只流浪猫找到了新家。', time: '2026-06-22', avatar: '🤝' }
    ],
    images: ['shstarbucks1', 'shstarbucks2', 'shstarbucks3']
  },
  {
    id: 102, name: 'WOOF WOOF·外滩宠物友好餐吧', city: '上海', type: '餐饮',
    address: '黄浦区中山东一路18号外滩18号6层',
    coordinate: { x: 580, y: 300 }, rating: 4.8, reviewCount: 256,
    phone: '021-63391888', hours: '11:00-次日02:00',
    description: '外滩景观宠物友好餐吧，拥有180度江景露台，宠物可陪伴主人享受美食，提供宠物专属菜单和宠物摄影服务。',
    petPolicy: { allowed: true, petTypes: ['犬类'], sizeLimit: ['小型', '中型', '大型'], requirements: '犬只需佩戴牵引绳，大型犬需提前预约', facilities: ['宠物水碗', '宠物专区', '免费宠物零食', '拾便袋'] },
    verifyCount: 42,
    verifies: [
      { user: '外滩夜景控', content: '带狗狗在外滩看夜景太浪漫了！露台视野绝佳，狗狗还吃到了宠物牛排。', time: '2026-07-02', avatar: '🌃' },
      { user: '金毛爸爸', content: '大型犬友好！提前预约了露台位置，服务生还给金毛准备了专属坐垫。', time: '2026-06-26', avatar: '🦮' },
      { user: '摄影爱好者', content: '宠物摄影服务很棒，拍了一组外滩大片，狗狗超上镜。', time: '2026-06-20', avatar: '📸' }
    ],
    images: ['woofwoof1', 'woofwoof2', 'woofwoof3']
  },
  {
    id: 103, name: 'CatWalk·法租界猫咪咖啡馆', city: '上海', type: '餐饮',
    address: '徐汇区武康路376号武康庭1层',
    coordinate: { x: 460, y: 320 }, rating: 4.7, reviewCount: 198,
    phone: '021-64335555', hours: '10:00-21:00',
    description: '坐落于法租界梧桐树下的猫咪主题咖啡馆，店内收养了8只流浪猫，提供法式甜品和猫咪互动体验，欢迎带自家猫咪social。',
    petPolicy: { allowed: true, petTypes: ['猫类'], sizeLimit: ['小型', '中型'], requirements: '猫需使用航空箱或宠物背包，提供疫苗证明', facilities: ['宠物水碗', '宠物专区', '免费宠物零食', '拾便袋'] },
    verifyCount: 38,
    verifies: [
      { user: '法租界猫奴', content: '武康路上的猫咪天堂，法式甜品配猫咪，太治愈了！店里猫猫都很亲人。', time: '2026-07-01', avatar: '😻' },
      { user: '下午茶达人', content: '带闺蜜和猫猫一起下午茶，猫爬架和猫玩具都很丰富，猫咪玩得不想走。', time: '2026-06-25', avatar: '🍰' },
      { user: '流浪猫救助', content: '店里的猫都是救助的，很有爱心，咖啡也很好喝，强烈推荐。', time: '2026-06-18', avatar: '💚' }
    ],
    images: ['catwalk1', 'catwalk2', 'catwalk3']
  },
  {
    id: 104, name: 'Pawtel·上海宠物友好精品酒店', city: '上海', type: '住宿',
    address: '徐汇区衡山路12号豪华精选酒店内',
    coordinate: { x: 480, y: 280 }, rating: 4.9, reviewCount: 178,
    phone: '021-54668888', hours: '24小时',
    description: '衡山路宠物友好精品酒店，每间宠物客房配备豪华宠物床、定制食盆、宠物浴袍，提供宠物SPA、宠物管家服务和宠物专属客房服务。',
    petPolicy: { allowed: true, petTypes: ['犬类', '猫类'], sizeLimit: ['小型', '中型', '大型'], requirements: '宠物需提供疫苗证明，每间房限2只宠物，宠物不可单独留在房间', facilities: ['宠物水碗', '宠物专区', '免费宠物零食', '拾便袋'] },
    verifyCount: 65,
    verifies: [
      { user: '酒店控Peggy', content: '宠物管家服务太贴心了！有专人遛狗，房间里的宠物床比我家狗的还豪华。', time: '2026-07-02', avatar: '🏨' },
      { user: '出差狗妈', content: '出差带狗住了三天，宠物SPA和客房服务都很专业，狗狗都不想退房了。', time: '2026-06-27', avatar: '💼' },
      { user: '蜜月旅行', content: '和老公带狗度蜜月，酒店准备了宠物欢迎礼包，还有宠物专属下午茶，太惊喜了！', time: '2026-06-20', avatar: '💝' }
    ],
    images: ['shhotel1', 'shhotel2', 'shhotel3', 'shhotel4']
  },
  {
    id: 105, name: '世纪公园·宠物友好活动区', city: '上海', type: '公共空间',
    address: '浦东新区锦绣路1001号世纪公园',
    coordinate: { x: 640, y: 360 }, rating: 4.6, reviewCount: 489,
    phone: '021-38768888', hours: '06:00-21:00',
    description: '世纪公园内设有专门宠物活动区，占地约6000平方米，分为大型犬区、中小型犬区和宠物社交草坪，配备宠物饮水设施和宠物厕所。',
    petPolicy: { allowed: true, petTypes: ['犬类'], sizeLimit: ['小型', '中型', '大型'], requirements: '宠物需佩戴牵引绳，大型犬需戴嘴套', facilities: ['宠物水碗', '宠物专区', '拾便袋'] },
    verifyCount: 92,
    verifies: [
      { user: '浦东狗友会', content: '世纪公园宠物区是浦东遛狗圣地！大草坪很干净，狗狗可以尽情奔跑。', time: '2026-07-01', avatar: '🌳' },
      { user: '周末遛狗人', content: '宠物社交草坪认识了很多狗友，每周六都有自发组织的狗狗聚会。', time: '2026-06-26', avatar: '🐕' },
      { user: '柯基小分队', content: '小型犬区很安全，不用担心被大狗欺负，柯基们玩得超开心。', time: '2026-06-19', avatar: '🐶' }
    ],
    images: ['century1', 'century2', 'century3']
  },
  {
    id: 106, name: 'PAWS·新天地宠物友好商场', city: '上海', type: '商业',
    address: '黄浦区淮海中路333号新天地广场B1-F3',
    coordinate: { x: 500, y: 340 }, rating: 4.5, reviewCount: 234,
    phone: '021-53829999', hours: '10:00-22:00',
    description: '新天地宠物友好商场，全楼层允许宠物推车进入，B1层设有宠物寄养中心、宠物美容和宠物用品超市，屋顶设有宠物空中花园。',
    petPolicy: { allowed: true, petTypes: ['犬类', '猫类'], sizeLimit: ['小型', '中型'], requirements: '宠物需使用宠物推车或宠物背包，屋顶花园可自由活动', facilities: ['宠物水碗', '宠物专区', '拾便袋'] },
    verifyCount: 48,
    verifies: [
      { user: '新天地常客', content: '终于可以带宠物逛新天地了！屋顶宠物花园太美了，可以俯瞰淮海路。', time: '2026-07-01', avatar: '🛍️' },
      { user: '宠物美容控', content: 'B1的宠物美容很专业，逛完街顺便给狗狗做了个美容，一举两得。', time: '2026-06-25', avatar: '💇' },
      { user: '宠物用品买手', content: '宠物用品超市品牌很全，还有很多进口宠物零食，价格也合理。', time: '2026-06-18', avatar: '🛒' }
    ],
    images: ['paws1', 'paws2', 'paws3']
  },
  {
    id: 107, name: '滨江宠物友好步道', city: '上海', type: '公共空间',
    address: '浦东新区滨江大道1777号',
    coordinate: { x: 620, y: 420 }, rating: 4.4, reviewCount: 367,
    phone: '021-58798888', hours: '全天开放',
    description: '黄浦江畔宠物友好步道，全长约5公里，沿途设有宠物饮水点、宠物休息区和宠物厕所，可欣赏外滩和陆家嘴天际线。',
    petPolicy: { allowed: true, petTypes: ['犬类'], sizeLimit: ['小型', '中型', '大型'], requirements: '宠物需佩戴牵引绳，注意避让骑行道', facilities: ['宠物水碗', '拾便袋'] },
    verifyCount: 73,
    verifies: [
      { user: '跑步带狗', content: '滨江步道太适合遛狗跑步了！江景超美，狗狗跑一圈刚好，沿途饮水点很方便。', time: '2026-07-02', avatar: '🏃' },
      { user: '陆家嘴狗友', content: '每天下班带狗来散步，看陆家嘴日落，是城市里难得的宠物友好空间。', time: '2026-06-27', avatar: '🌇' },
      { user: '摄影打卡', content: '宠物步道拍照太出片了，背景是陆家嘴三件套，狗狗写真轻松get。', time: '2026-06-21', avatar: '📷' }
    ],
    images: ['bund1', 'bund2', 'bund3']
  },
  {
    id: 108, name: 'MiaoHome·田子坊猫咪民宿', city: '上海', type: '住宿',
    address: '黄浦区泰康路210弄田子坊内',
    coordinate: { x: 440, y: 360 }, rating: 4.5, reviewCount: 112,
    phone: '021-64153333', hours: '24小时',
    description: '田子坊弄堂里的猫咪主题民宿，每间房都有猫咪主题装饰和猫爬架，提供猫咪寄养服务，步行可达田子坊各宠物友好店铺。',
    petPolicy: { allowed: true, petTypes: ['猫类'], sizeLimit: ['小型', '中型'], requirements: '猫需提供疫苗证明，提供猫砂盆和猫抓板', facilities: ['宠物水碗', '宠物专区', '免费宠物零食'] },
    verifyCount: 25,
    verifies: [
      { user: '田子坊猫奴', content: '弄堂里的猫咪民宿太有上海味道了，猫猫在房间里玩得很开心，还有猫薄荷玩具。', time: '2026-07-01', avatar: '🏘️' },
      { user: '旅行猫妈', content: '带猫来上海旅行，选了这家民宿，猫咪寄养服务很放心，出去玩不用担心。', time: '2026-06-24', avatar: '🧳' },
      { user: '文艺青年', content: '房间装饰很有艺术感，猫爬架设计也很巧妙，猫猫喜欢在窗台上看弄堂人来人往。', time: '2026-06-17', avatar: '🎨' }
    ],
    images: ['miaohome1', 'miaohome2', 'miaohome3']
  },
  {
    id: 109, name: 'DoggyTown·宠物友好社区商业', city: '上海', type: '商业',
    address: '长宁区虹桥路1438号高岛屋百货B1',
    coordinate: { x: 380, y: 300 }, rating: 4.3, reviewCount: 156,
    phone: '021-62781111', hours: '10:00-22:00',
    description: '古北地区宠物友好社区商业，设有宠物推车租赁、宠物饮水站、宠物休息区，每月举办宠物社交日和宠物领养活动。',
    petPolicy: { allowed: true, petTypes: ['犬类', '猫类'], sizeLimit: ['小型', '中型'], requirements: '宠物需使用宠物推车或宠物背包', facilities: ['宠物水碗', '宠物专区', '拾便袋'] },
    verifyCount: 32,
    verifies: [
      { user: '古北宠友', content: '社区宠物友好商场太方便了，宠物推车免费租赁，带狗狗逛街无压力。', time: '2026-06-30', avatar: '🏬' },
      { user: '宠物社交', content: '每月宠物社交日很热闹，认识了很多邻居狗友，狗狗也交到了好朋友。', time: '2026-06-23', avatar: '🤝' },
      { user: '日系宠物', content: '高岛屋的宠物用品区有很多日系品牌，给狗狗买了超可爱的和风领结。', time: '2026-06-16', avatar: '🎀' }
    ],
    images: ['doggy1', 'doggy2', 'doggy3']
  },
  {
    id: 110, name: '西岸·宠物友好艺术公园', city: '上海', type: '公共空间',
    address: '徐汇区龙腾大道西岸美术馆旁',
    coordinate: { x: 400, y: 400 }, rating: 4.5, reviewCount: 278,
    phone: '021-64511111', hours: '06:00-22:00',
    description: '西岸艺术区宠物友好公园，融合当代艺术与宠物友好理念，设有宠物雕塑装置、宠物草坪剧场和宠物艺术打卡点。',
    petPolicy: { allowed: true, petTypes: ['犬类', '猫类'], sizeLimit: ['小型', '中型', '大型'], requirements: '宠物需佩戴牵引绳，猫类需使用宠物背包，爱护艺术装置', facilities: ['宠物水碗', '宠物专区', '拾便袋'] },
    verifyCount: 54,
    verifies: [
      { user: '艺术狗友', content: '西岸宠物公园太有艺术感了！宠物雕塑装置很适合拍照，狗狗在草坪上玩得很开心。', time: '2026-07-01', avatar: '🎨' },
      { user: '周末艺术之旅', content: '带狗逛完西岸美术馆，在宠物公园休息，艺术与宠物完美结合。', time: '2026-06-26', avatar: '🖼️' },
      { user: '宠物摄影师', content: '宠物艺术打卡点太出片了，拍了一组超有艺术感的宠物写真。', time: '2026-06-19', avatar: '📸' }
    ],
    images: ['westbund1', 'westbund2', 'westbund3']
  },
  {
    id: 111, name: 'Pawsitive·宠物友好brunch餐厅', city: '上海', type: '餐饮',
    address: '静安区巨鹿路758号',
    coordinate: { x: 500, y: 300 }, rating: 4.6, reviewCount: 145,
    phone: '021-62893333', hours: '08:00-17:00',
    description: '巨鹿路宠物友好brunch餐厅，主打健康轻食和宠物早午餐，设有宠物专属庭院和宠物菜单，提供宠物生日派对定制服务。',
    petPolicy: { allowed: true, petTypes: ['犬类', '猫类'], sizeLimit: ['小型', '中型'], requirements: '宠物需佩戴牵引绳，猫类需使用宠物背包', facilities: ['宠物水碗', '宠物专区', '免费宠物零食', '拾便袋'] },
    verifyCount: 28,
    verifies: [
      { user: 'brunch达人', content: '宠物brunch太有创意了！狗狗的宠物班尼迪克蛋超可爱，人吃的也很好吃。', time: '2026-07-01', avatar: '🥑' },
      { user: '生日派对', content: '给狗狗办了一岁生日派对，餐厅布置得很用心，还送了宠物生日蛋糕，超感动。', time: '2026-06-24', avatar: '🎂' },
      { user: '巨鹿路探店', content: '巨鹿路最爱的brunch店，阳光庭院很适合拍照，宠物友好氛围满分。', time: '2026-06-17', avatar: '☀️' }
    ],
    images: ['pawsitive1', 'pawsitive2', 'pawsitive3']
  },
  {
    id: 112, name: 'PetParadise·宠物友好奥特莱斯', city: '上海', type: '商业',
    address: '浦东新区申迪东路88号奕欧来奥特莱斯',
    coordinate: { x: 750, y: 340 }, rating: 4.2, reviewCount: 189,
    phone: '021-58969999', hours: '10:00-21:00',
    description: '宠物友好奥特莱斯，户外街区式购物环境，全区域允许宠物推车，设有宠物饮水站、宠物厕所和宠物草坪，提供宠物推车租赁。',
    petPolicy: { allowed: true, petTypes: ['犬类', '猫类'], sizeLimit: ['小型', '中型'], requirements: '宠物需使用宠物推车或宠物背包，户外区域可自由活动', facilities: ['宠物水碗', '宠物专区', '拾便袋'] },
    verifyCount: 36,
    verifies: [
      { user: '购物达人', content: '奥特莱斯也能带狗来了！户外街区很适合遛狗，逛累了在草坪上休息。', time: '2026-06-30', avatar: '🛍️' },
      { user: '迪士尼周边', content: '去迪士尼前先来逛逛，宠物推车很方便，折扣力度也大，买了好多宠物用品。', time: '2026-06-23', avatar: '🏰' },
      { user: '周末家庭', content: '全家带狗来购物，户外环境很好，宠物草坪让狗狗释放精力，大人安心逛街。', time: '2026-06-16', avatar: '👨‍👩‍👧‍👦' }
    ],
    images: ['petparadise1', 'petparadise2', 'petparadise3']
  }
];

// 为北京数据添加city字段
places.forEach(p => { p.city = '北京'; });

// 全局存储
const store = {
  places: [...places, ...shanghaiPlaces],
  favorites: {},
  merchantApplies: [],
  nextApplyId: 1,
  defaultUserId: 'user_demo_001',
  // 新增：用户系统
  users: {},
  nextUserId: 2,
  // 新增：评论系统
  comments: {},
  nextCommentId: 1,
  // 新增：宠物档案
  petProfiles: {},
  nextPetId: 1
};

// 预置演示用户
store.users['user_demo_001'] = {
  id: 'user_demo_001',
  username: '爪印宠主',
  phone: '138****8888',
  password: '123456',
  avatar: '🐾',
  createdAt: '2026-01-01'
};

module.exports = store;