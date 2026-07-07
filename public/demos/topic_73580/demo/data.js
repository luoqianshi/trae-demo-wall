// AI 私藏美食路书数据库
// 每个城市的 3 套方案对应不同偏好组合,前端根据用户 chips 选中情况自动匹配最佳方案

const ROUTE_DB = {
  chengdu: {
    name: "成都",
    emoji: "🐼",
    routes: [
      {
        id: "cd-lao",
        theme: "老饕私藏",
        emoji: "👴",
        desc: "本地人吃了 30 年的老味道",
        matchTags: ["local", "spicy"],
        stops: [
          {
            time: "08:30", meal: "早餐",
            name: "甘记肥肠粉", tag: "本地 30 年",
            desc: "藏在青石桥的老字号,肥肠粉配锅盔是经典组合。",
            rating: 4.7, address: "青石桥北街", price: 25, distance: 800,
            x: 100, y: 120,
            reason: "AI 推理:本地论坛提及 326 次,无任何游客店标签,凌晨 5 点本地人就开始排队,符合'避开游客店'需求。"
          },
          {
            time: "12:00", meal: "午餐",
            name: "陈麻婆豆腐", tag: "青华路分店",
            desc: "避开游客爆满的总店,本地人更多的分店,有宝宝餐。",
            rating: 4.6, address: "青华路 38 号", price: 85, distance: 1200,
            x: 260, y: 180,
            reason: "AI 推理:同品牌下评分最高且距离亲子酒店更近,麻婆豆腐可做微辣,有儿童蛋羹可选。"
          },
          {
            time: "15:30", meal: "下午茶",
            name: "咖啡旅人·玉林老店", tag: "本地独立咖啡",
            desc: "玉林片区最具人气的独立咖啡馆,有儿童果汁。",
            rating: 4.8, address: "玉林街 12 号", price: 45, distance: 600,
            x: 380, y: 240,
            reason: "AI 推理:成都咖啡榜连续 3 年 TOP3,但仍属本地人常去,非游客打卡点,有低因饮品适合带娃家庭。"
          },
          {
            time: "19:00", meal: "晚餐",
            name: "蜀九香火锅·玉林店", tag: "本地私藏",
            desc: "成都人自己常去的火锅店,有宝宝番茄锅。",
            rating: 4.9, address: "玉林南路", price: 165, distance: 0,
            x: 480, y: 320,
            reason: "AI 推理:点评网本地用户占比 78%,有专门的儿童座椅和番茄锅底,妈妈再也不用担心孩子吃不了辣。"
          }
        ]
      },
      {
        id: "cd-kid",
        theme: "亲子友好",
        emoji: "👨‍👩‍👧",
        desc: "带娃不累,每站都有宝宝餐",
        matchTags: ["kid", "local", "light"],
        stops: [
          {
            time: "09:00", meal: "早餐",
            name: "老钟家甜水面", tag: "可做不辣",
            desc: "甜水面有微辣/不辣可选,孩子也能吃。",
            rating: 4.5, address: "奎星楼街", price: 18, distance: 500,
            x: 130, y: 140,
            reason: "AI 推理:有专属儿童不辣版本,老板会主动问孩子口味,本地妈妈群推荐 TOP5。"
          },
          {
            time: "12:30", meal: "午餐",
            name: "滋味烤鱼·亲子店", tag: "儿童套餐",
            desc: "有专门的儿童套餐+游乐区,孩子吃家长也轻松。",
            rating: 4.6, address: "春熙路", price: 75, distance: 900,
            x: 280, y: 200,
            reason: "AI 推理:大众点评亲子榜连续 12 周 TOP1,设独立儿童游乐角,饭后孩子有地方放电。"
          },
          {
            time: "15:00", meal: "下午茶",
            name: "熊猫奶茶研究所", tag: "孩子最爱",
            desc: "有熊猫拉花和儿童无糖款,孩子拍照发朋友圈。",
            rating: 4.7, address: "太古里", price: 38, distance: 400,
            x: 360, y: 150,
            reason: "AI 推理:可做零糖零咖啡因,杯子可带走,既不踩雷又让孩子有得玩。"
          },
          {
            time: "18:30", meal: "晚餐",
            name: "蓉锦小馆·家庭店", tag: "清淡川菜",
            desc: "川菜清淡版,孩子也能吃,还有儿童座椅。",
            rating: 4.8, address: "锦里附近", price: 95, distance: 0,
            x: 500, y: 280,
            reason: "AI 推理:川菜里少有的少油少盐版本,招牌回锅肉可做儿童版,服务评价里多次提到对带娃家庭友好。"
          }
        ]
      },
      {
        id: "cd-net",
        theme: "网红但不踩雷",
        emoji: "📸",
        desc: "出片好看,味道也在线",
        matchTags: ["local", "dessert", "cafe"],
        stops: [
          {
            time: "10:00", meal: "早午餐",
            name: "得劲儿·小酒馆早茶", tag: "出片圣地",
            desc: "复古港风装修,早茶颜值高味道也好。",
            rating: 4.6, address: "望平街", price: 65, distance: 700,
            x: 120, y: 160,
            reason: "AI 推理:小红书点赞 1.2 万+,但同时本地论坛评分 4.6 表明味道在线,非纯网红店。"
          },
          {
            time: "13:00", meal: "午餐",
            name: "冒椒火辣·奎星楼", tag: "排队之王",
            desc: "冒菜界的扛把子,串串按把称重。",
            rating: 4.7, address: "奎星楼街", price: 60, distance: 1000,
            x: 250, y: 220,
            reason: "AI 推理:本地人和游客都在排队,说明口味经受住了双层检验,排队约 25 分钟符合预设。"
          },
          {
            time: "16:00", meal: "下午茶",
            name: "柴门荟·露台茶", tag: "网红露台",
            desc: "270° 露台喝茶,看夕阳绝佳位置。",
            rating: 4.8, address: "宽窄巷子", price: 88, distance: 800,
            x: 380, y: 130,
            reason: "AI 推理:虽属网红但茶品质量过硬,有专人讲解茶艺,不是拍照就走的那种店。"
          },
          {
            time: "19:30", meal: "晚餐",
            name: "马路边边·麻辣串串", tag: "复古出片",
            desc: "80 年代复古风,小碗菜串串怀旧感拉满。",
            rating: 4.6, address: "玉林街", price: 80, distance: 0,
            x: 480, y: 290,
            reason: "AI 推理:装修出片但价格亲民,本地人占比 60%,不会被坑。"
          }
        ]
      }
    ]
  },

  hangzhou: {
    name: "杭州",
    emoji: "🍃",
    routes: [
      {
        id: "hz-lao",
        theme: "老饕私藏",
        emoji: "👴",
        desc: "杭帮菜老字号的私藏玩法",
        matchTags: ["local", "light"],
        stops: [
          {
            time: "08:00", meal: "早餐",
            name: "知味观·仁和路总店", tag: "百年老店",
            desc: "小笼包、猫耳朵、片儿川,杭州人从小吃到大。",
            rating: 4.6, address: "仁和路 80 号", price: 35, distance: 600,
            x: 110, y: 130,
            reason: "AI 推理:本地点评榜单常年 TOP3,无任何游客店标签,早市本地人占 85% 以上。"
          },
          {
            time: "12:00", meal: "午餐",
            name: "外婆家·马塍路店", tag: "本地分店",
            desc: "避开湖滨店游客,本地人更多,茶香鸡必点。",
            rating: 4.5, address: "马塍路", price: 70, distance: 1100,
            x: 270, y: 190,
            reason: "AI 推理:同品牌不同店,这家本地用户占比更高,等位时间比湖滨店少 40 分钟。"
          },
          {
            time: "15:00", meal: "下午茶",
            name: "江南驿·茶馆", tag: "本地茶客",
            desc: "本地茶客聚集地,一杯龙井一碟茶点,慢生活。",
            rating: 4.7, address: "满觉陇", price: 55, distance: 500,
            x: 390, y: 250,
            reason: "AI 推理:游客几乎不知道,本地茶客占 90%,能听到地道杭州话,真正'在地体验'。"
          },
          {
            time: "18:30", meal: "晚餐",
            name: "张生记·钱江店", tag: "钱塘江景",
            desc: "招牌笋干老鸭煲,看着江景吃,杭州人的排面。",
            rating: 4.8, address: "钱江新城", price: 130, distance: 0,
            x: 490, y: 320,
            reason: "AI 推理:杭帮菜高端代表,但本地点评价格合理,无宰客现象,带家人请客很有面子。"
          }
        ]
      },
      {
        id: "hz-kid",
        theme: "亲子友好",
        emoji: "👨‍👩‍👧",
        desc: "西湖周边带娃不暴走",
        matchTags: ["kid", "light", "cafe"],
        stops: [
          {
            time: "09:00", meal: "早餐",
            name: "新白鹿·儿童套餐", tag: "亲子友好",
            desc: "杭州平价杭帮菜,有儿童菜单+儿童椅。",
            rating: 4.5, address: "湖滨银泰", price: 45, distance: 400,
            x: 130, y: 150,
            reason: "AI 推理:价格亲民,儿童蛋羹和鱼丸汤被本地妈妈多次推荐,离西湖步行 5 分钟。"
          },
          {
            time: "12:00", meal: "午餐",
            name: "绿茶餐厅·灵隐店", tag: "景区平价",
            desc: "灵隐寺附近,孩子玩完正好吃饭,有面包诱惑。",
            rating: 4.5, address: "灵隐路", price: 65, distance: 1000,
            x: 260, y: 210,
            reason: "AI 推理:景区里少有的高性价比,招牌面包诱惑孩子最爱,玩完灵隐吃刚刚好。"
          },
          {
            time: "15:00", meal: "下午茶",
            name: "Line Friends 咖啡", tag: "拍照+歇脚",
            desc: "西湖边的卡通主题咖啡,孩子拍照+家长喝咖啡。",
            rating: 4.4, address: "湖滨步行街", price: 58, distance: 600,
            x: 380, y: 160,
            reason: "AI 推理:孩子喜欢的卡通主题+家长能喝到现磨咖啡,中间歇脚的最佳组合。"
          },
          {
            time: "18:30", meal: "晚餐",
            name: "弄堂里·南山店", tag: "杭帮家常",
            desc: "杭帮菜家常味,口味清淡,孩子吃得惯。",
            rating: 4.6, address: "南山路", price: 85, distance: 0,
            x: 490, y: 290,
            reason: "AI 推理:杭帮菜里少有的少糖少油版本,孩子吃完不闹肚子,服务对带娃家庭非常友好。"
          }
        ]
      },
      {
        id: "hz-net",
        theme: "网红但不踩雷",
        emoji: "📸",
        desc: "出片+味道都在线",
        matchTags: ["local", "dessert", "cafe"],
        stops: [
          {
            time: "10:00", meal: "早午餐",
            name: "Cycle&Cycle  Cycle", tag: "日式洋食",
            desc: "日式洋食 brunch,颜值天花板。",
            rating: 4.6, address: "中山北路", price: 88, distance: 700,
            x: 120, y: 170,
            reason: "AI 推理:出片+口味双在线,本地 brunch 圈长期 TOP3,非游客一次性打卡店。"
          },
          {
            time: "13:00", meal: "午餐",
            name: "老头儿油爆虾", tag: "本地传奇",
            desc: "杭州人吃了 20 年的油爆虾,本地人私藏。",
            rating: 4.7, address: "复兴路", price: 95, distance: 1000,
            x: 250, y: 230,
            reason: "AI 推理:虽被博主推荐过但本地点评依然 4.7,说明口味经得起放大镜检验。"
          },
          {
            time: "16:00", meal: "下午茶",
            name: "胡庆余堂·药膳咖啡", tag: "国潮新茶",
            desc: "百年老字号做的国潮咖啡,养生又好喝。",
            rating: 4.5, address: "河坊街", price: 42, distance: 600,
            x: 380, y: 140,
            reason: "AI 推理:国潮出片+药膳配方真材实料,本地年轻人也开始打卡,不是空有噱头。"
          },
          {
            time: "19:30", meal: "晚餐",
            name: "西湖楼·观景餐厅", tag: "湖景晚餐",
            desc: "落地窗正对西湖,看日落+吃杭帮菜。",
            rating: 4.6, address: "北山路", price: 158, distance: 0,
            x: 490, y: 300,
            reason: "AI 推理:有湖景有口味,价格在杭州观景餐厅里属于中位,本地人也常来,不会被坑。"
          }
        ]
      }
    ]
  },

  guangzhou: {
    name: "广州",
    emoji: "🦐",
    routes: [
      {
        id: "gz-lao",
        theme: "老饕私藏",
        emoji: "👴",
        desc: "广州老城区的本味",
        matchTags: ["local", "snack"],
        stops: [
          {
            time: "07:30", meal: "早餐",
            name: "银记肠粉店", tag: "老广早茶",
            desc: "广州人吃了 60 年的肠粉店,豉油王必点。",
            rating: 4.5, address: "上下九", price: 22, distance: 500,
            x: 110, y: 130,
            reason: "AI 推理:本地点评榜常年 TOP5,无任何游客店标签,清晨 6 点本地阿婆就开始排队。"
          },
          {
            time: "11:30", meal: "早茶",
            name: "陶陶居·总店", tag: "百年老字号",
            desc: "广州早茶代表,虾饺皇、凤爪、叉烧包一网打尽。",
            rating: 4.6, address: "第十甫路", price: 80, distance: 1000,
            x: 260, y: 200,
            reason: "AI 推理:本地家庭聚餐常选,虽然游客也知道但本地人占比仍有 50%,味道经得起双重检验。"
          },
          {
            time: "15:00", meal: "下午茶",
            name: "顺记冰室", tag: "老广甜品",
            desc: "椰子雪糕、芒果西米露,老广州的下午茶。",
            rating: 4.4, address: "长寿路", price: 28, distance: 600,
            x: 380, y: 250,
            reason: "AI 推理:60 年老店,游客几乎不知道,本地老广下午茶首选,价格依然亲民。"
          },
          {
            time: "19:00", meal: "晚餐",
            name: "炳胜·海印总店", tag: "粤菜代表",
            desc: "粤菜新派代表,脆皮叉烧、菠萝油,广州人请客首选。",
            rating: 4.7, address: "海印桥", price: 140, distance: 0,
            x: 490, y: 310,
            reason: "AI 推理:广州米其林推荐+本地老饕常去,粤菜体验天花板,值得作为终点大餐。"
          }
        ]
      },
      {
        id: "gz-kid",
        theme: "亲子友好",
        emoji: "👨‍👩‍👧",
        desc: "老广家庭带娃吃喝",
        matchTags: ["kid", "light", "snack"],
        stops: [
          {
            time: "09:00", meal: "早茶",
            name: "点都德·亲子店", tag: "家庭友好",
            desc: "广州早茶连锁,有儿童套餐+卡通点心。",
            rating: 4.5, address: "天河城", price: 55, distance: 500,
            x: 130, y: 140,
            reason: "AI 推理:广州早茶里少有的有儿童套餐的店,卡通造型点心孩子最爱,等位区有玩具。"
          },
          {
            time: "12:30", meal: "午餐",
            name: "大龙凤·亲子粤菜", tag: "儿童游乐区",
            desc: "粤菜家常味,设有儿童游乐角,孩子边玩边吃。",
            rating: 4.5, address: "珠江新城", price: 75, distance: 900,
            x: 270, y: 200,
            reason: "AI 推理:广州妈妈群推荐 TOP3,设独立儿童游乐角+儿童座椅,家长终于能好好吃顿饭。"
          },
          {
            time: "15:30", meal: "下午茶",
            name: "满记甜品·儿童款", tag: "甜品友好",
            desc: "糖水有专门儿童无糖款,杨枝甘露孩子最爱。",
            rating: 4.4, address: "北京路", price: 32, distance: 700,
            x: 390, y: 150,
            reason: "AI 推理:有儿童专属无糖糖水,糖分控制适合孩子,杨枝甘露颜值高孩子爱拍照。"
          },
          {
            time: "19:00", meal: "晚餐",
            name: "鹅公村·家庭店", tag: "烧鹅代表",
            desc: "烧鹅、卤味、白切鸡,孩子能吃的粤菜大餐。",
            rating: 4.6, address: "芳村", price: 110, distance: 0,
            x: 500, y: 290,
            reason: "AI 推理:广州烧鹅代表,口味相对清淡适合孩子,白切鸡可做儿童份,家庭聚餐首选。"
          }
        ]
      },
      {
        id: "gz-net",
        theme: "网红但不踩雷",
        emoji: "📸",
        desc: "出片+味道都在线",
        matchTags: ["local", "dessert", "cafe"],
        stops: [
          {
            time: "10:00", meal: "早午餐",
            name: "Superpinky·复古咖啡", tag: "复古出片",
            desc: "80 年代港风咖啡馆,出片天花板。",
            rating: 4.5, address: "东山口", price: 68, distance: 600,
            x: 120, y: 160,
            reason: "AI 推理:出片圣地+咖啡现磨非速溶,本地年轻人常来,非一次性打卡店。"
          },
          {
            time: "13:00", meal: "午餐",
            name: "八珍·煎饺专门店", tag: "排队之王",
            desc: "广州煎饺天花板,排队 20 分钟,值得。",
            rating: 4.6, address: "文明路", price: 45, distance: 1000,
            x: 250, y: 220,
            reason: "AI 推理:本地人占比 70%,出片+味道双在线,排队时间符合用户预设 30 分钟内。"
          },
          {
            time: "16:00", meal: "下午茶",
            name: "陈添记·老字号", tag: "鱼皮传奇",
            desc: "祖传爽鱼皮,广州三宝之一,几十年不涨价。",
            rating: 4.5, address: "宝华路", price: 30, distance: 500,
            x: 380, y: 130,
            reason: "AI 推理:虽然被推荐过但依然是几代广州人的记忆,价格依然亲民不算踩雷。"
          },
          {
            time: "19:30", meal: "晚餐",
            name: "瑰丽酒店·空中酒吧", tag: "高空夜景",
            desc: "珠江新城高空晚餐,看广州塔夜景。",
            rating: 4.7, address: "珠江新城", price: 320, distance: 0,
            x: 490, y: 300,
            reason: "AI 推理:广州高端餐饮代表,本地年轻人纪念日常选,虽然贵但服务和口味都值。"
          }
        ]
      }
    ]
  }
};