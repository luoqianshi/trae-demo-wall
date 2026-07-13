/**
 * 饭泛之交 - Mock Data 模拟数据
 * 模块化拆分自单文件原型
 */

// Mock data
const mockPosts = [
  {avatar:'👩',name:'小食光',time:'10分钟前',content:'发现了一家藏在胡同里的宝藏甜品店，提拉米苏绝绝子！有约的一起去二刷吗？',emoji:'🍰',likes:128,comments:23},
  {avatar:'👨',name:'美食探险家',time:'30分钟前',content:'本周五晚omakase，已订位，缺一位饭友，预算500/人，有一起的吗？',emoji:'🍣',likes:89,comments:15},
  {avatar:'👩‍🦰',name:'辣妹子',time:'1小时前',content:'火锅突击队本周六集结！蜀大侠已订包厢，目前3=2，能吃辣的优先~',emoji:'🌶️',likes:256,comments:45},
  {avatar:'🧑',name:'一人食博主',time:'2小时前',content:'整理了一份北京一人食友好餐厅清单，从日料到拉面到轻食，全部亲测！',emoji:'🍜',likes:412,comments:67}
];

const rankData = {
  recommend: [
    {emoji:'🍰',name:'蜜语甜品屋',addr:'朝阳区三里屯',tags:'甜品 · 下午茶',score:4.9},
    {emoji:'🍲',name:'蜀大侠火锅',addr:'海淀区五道口',tags:'火锅 · 聚会',score:4.8},
    {emoji:'🍣',name:'鮨一 Omakase',addr:'朝阳区国贸',tags:'日料 · 高端',score:4.8},
    {emoji:'🌶️',name:'马路边边串串香',addr:'朝阳区望京',tags:'串串 · 夜宵',score:4.7},
    {emoji:'🥟',name:'鼎泰丰',addr:'东城区王府井',tags:'点心 · 家庭',score:4.7},
  ],
  hot: [
    {emoji:'🍗',name:'火烧云傣家菜',addr:'朝阳区蓝色港湾',tags:'云南菜 · 排队王',score:4.6},
    {emoji:'🍜',name:'一兰拉面',addr:'朝阳区三里屯',tags:'拉面 · 一人食',score:4.5},
    {emoji:'🍕',name:'BOTTEGA意库',addr:'朝阳区亮马桥',tags:'披萨 · 约会',score:4.5},
    {emoji:'🥩',name:'京兆尹',addr:'东城区雍和宫',tags:'素食 · 米其林',score:4.4},
    {emoji:'🦐',name:'胡大小龙虾',addr:'东城区簋街',tags:'小龙虾 · 夜宵',score:4.4},
  ],
  new: [
    {emoji:'🍱',name:'暮然怀石料理',addr:'朝阳区大望路',tags:'日料 · 新店',score:4.7},
    {emoji:'🍛',name:'咖喱道场',addr:'海淀区中关村',tags:'咖喱 · 日式',score:4.6},
    {emoji:'🥗',name:'GreenOption',addr:'朝阳区望京',tags:'轻食 · 健康',score:4.5},
    {emoji:'🍖',name:'本垒美式烤肉',addr:'朝阳区三里屯',tags:'烤肉 · 美式',score:4.4},
    {emoji:'🧁',name:'B&C黄油与面包',addr:'朝阳区国贸',tags:'烘焙 · 网红',score:4.3},
  ],
  solo: [
    {emoji:'🍜',name:'一兰拉面',addr:'朝阳区三里屯',tags:'拉面 · 隔间',score:4.5},
    {emoji:'🍱',name:'吉野家',addr:'多门店',tags:'快餐 · 定食',score:4.2},
    {emoji:'🥗',name:'Wagas',addr:'多门店',tags:'轻食 · 咖啡',score:4.3},
    {emoji:'🍛',name:'CoCo壱番屋',addr:'多门店',tags:'咖喱 · 日式',score:4.2},
    {emoji:'🍝',name:'萨莉亚',addr:'多门店',tags:'意式 · 平价',score:4.0},
  ]
};

const mockEvents = [
  {emoji:'🌶️',title:'火锅突击队·第12期',time:'本周六 18:30',loc:'蜀大侠（望京店）',price:'¥88/人',joined:8,total:10},
  {emoji:'🎁',title:'周五盲盒饭局',time:'本周五 19:00',loc:'餐厅到店揭晓',price:'¥128/人',joined:5,total:6},
  {emoji:'🍣',title:'日料Omakase品鉴',time:'本周日 12:00',loc:'鮨一（国贸店）',price:'¥488/人',joined:3,total:4},
  {emoji:'📸',title:'美食摄影+探店',time:'下周六 14:00',loc:'三里屯集合',price:'¥9.9/人',joined:12,total:15},
];

const mockChats = [
  {avatar:'👩',name:'小食光',preview:'明天晚上见！我已经到餐厅附近了～',time:'2分钟前',unread:2},
  {avatar:'👨',name:'美食探险家',preview:'好的，那我们就定周五晚上7点',time:'1小时前',unread:0},
  {avatar:'👩‍🦰',name:'辣妹子',preview:'哈哈那家店确实好吃，下次再约！',time:'昨天',unread:0},
];

const mockProfiles = [
  {avatar:'👩',name:'小食光',meta:'25岁 · 设计师 · 朝阳区',tags:['ENFP','火锅控','摄影爱好者'],reason:'你们都是ENFP型人格，都热爱火锅和摄影，且都在朝阳区工作。她上周也打卡了你收藏的那家火锅店！',score:'98%'},
  {avatar:'👨',name:'美食探险家',meta:'28岁 · 产品经理 · 海淀区',tags:['INTJ','日料达人','徒步爱好者'],reason:'你们都偏爱安静的氛围和精致日料，且消费习惯相似。他曾在你想去的omakase留下过五星好评。',score:'95%'},
  {avatar:'👩‍🦰',name:'辣妹子',meta:'24岁 · 运营 · 望京',tags:['ESFP','无辣不欢','剧本杀'],reason:'你们都是川菜爱好者，社交倾向匹配度极高。她本周六正好有空，且距离你仅1.2公里！',score:'97%'},
  {avatar:'🧑',name:'文艺青年',meta:'26岁 · 编辑 · 东城区',tags:['INFP','咖啡馆','读书'],reason:'你们都爱在咖啡馆里安静度过午后，书单重合度高达78%。',score:'94%'},
];

const mockDishes = [
  {emoji:'🥘',name:'牛油麻辣锅底',restaurant:'蜀大侠火锅',tags:['招牌','辣度可选'],quote:'一锅红油翻滚，毛肚七上八下，这才是火锅的灵魂所在'},
  {emoji:'🍣',name:'特选寿司拼盘',restaurant:'鮨一 Omakase',tags:['当日鲜鱼','师傅手捏'],quote:'从北海道到东京湾，每一贯都是海洋的馈赠'},
  {emoji:'🦐',name:'蒜蓉小龙虾',restaurant:'胡大饭馆',tags:['季节限定','排队王'],quote:'簋街的夏夜，剥虾剥到手软，辣到流泪也不肯停'},
  {emoji:'🍰',name:'提拉米苏',restaurant:'蜜语甜品屋',tags:['手工现做','低糖版'],quote:'马斯卡彭的绵密与咖啡酒的微苦，一口沦陷'},
  {emoji:'🍜',name:'豚骨拉面',restaurant:'一兰拉面',tags:['单人隔间','汤头浓郁'],quote:'24小时熬制的骨汤，配上溏心蛋，治愈所有疲惫'},
  {emoji:'🥩',name:'M9和牛寿喜烧',restaurant:'暮然怀石料理',tags:['A5和牛','无菌蛋'],quote:'霜降纹理如雪花般细腻，蘸上蛋液入口即化'},
  {emoji:'🍕',name:'松露蘑菇披萨',restaurant:'BOTTEGA意库',tags:['窑烤','意式薄底'],quote:'黑松露的香气从窑炉里飘出来，这一刻只想慢下来'},
  {emoji:'🥟',name:'蟹粉小笼包',restaurant:'鼎泰丰',tags:['现点现蒸','18褶'],quote:'轻提窗、慢移门，先喝汤、再品鲜，一口江南'},
];