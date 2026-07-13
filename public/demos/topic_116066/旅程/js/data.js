/* ============================================ */
/* data.js - 静态数据                           */
/* 作用：存放所有预设数据（城市/景点/美食等）     */
/* 小白理解：这是App的"数据库"，所有数据在这      */
/* ============================================ */

/**
 * Data 对象：所有静态数据的集合
 */
window.Data = {

    /* ======================================== */
    /* 城市数据：10个城市                        */
    /* ======================================== */
    cities: [
        { name: '成都', province: '四川', desc: '天府之国，美食之都', icon: '🐼' },
        { name: '大理', province: '云南', desc: '风花雪月，苍山洱海', icon: '🏔️' },
        { name: '厦门', province: '福建', desc: '海滨花园，鼓浪屿', icon: '🌊' },
        { name: '西安', province: '陕西', desc: '千年古都，兵马俑', icon: '🏛️' },
        { name: '长沙', province: '湖南', desc: '星城魅力，网红打卡', icon: '🌶️' },
        { name: '北京', province: '北京', desc: '帝都风情，故宫长城', icon: '🏯' },
        { name: '上海', province: '上海', desc: '魔都繁华，外滩夜景', icon: '🏙️' },
        { name: '杭州', province: '浙江', desc: '人间天堂，西湖美景', icon: '🌿' },
        { name: '重庆', province: '重庆', desc: '山城火锅，8D魔幻', icon: '🌆' },
        { name: '丽江', province: '云南', desc: '古城韵味，纳西风情', icon: '🏔️' },
        { name: '苏州', province: '江苏', desc: '江南水乡，园林之美', icon: '🏡' },
        { name: '青岛', province: '山东', desc: '海滨城市，啤酒之都', icon: '🍺' },
        { name: '三亚', province: '海南', desc: '热带天堂，海岛度假', icon: '🏝️' },
        { name: '南京', province: '江苏', desc: '六朝古都，中山陵', icon: '🌳' },
        { name: '桂林', province: '广西', desc: '山水甲天下', icon: '⛰️' }
    ],

    /* ======================================== */
    /* 天气数据：每个城市当前天气+5天预报          */
    /* ======================================== */
    weather: {
        '成都': {
            current: { temp: 34, desc: '晴', humidity: 65, wind: '微风', icon: '☀️' },
            forecast: [
                { day: '今天', temp: '34/25°', desc: '晴', icon: '☀️' },
                { day: '明天', temp: '33/24°', desc: '多云', icon: '⛅' },
                { day: '后天', temp: '28/22°', desc: '小雨', icon: '🌧️' },
                { day: '大后天', temp: '27/21°', desc: '中雨', icon: '🌧️' },
                { day: '周五', temp: '30/23°', desc: '多云', icon: '⛅' }
            ],
            advice: '近日午后高温达34°C，建议景点游览安排在上午或傍晚，避开正午暴晒。后天起有降雨，户外景点尽量安排在今天或明天。'
        },
        '大理': {
            current: { temp: 24, desc: '多云', humidity: 55, wind: '东南风2级', icon: '⛅' },
            forecast: [
                { day: '今天', temp: '24/18°', desc: '多云', icon: '⛅' },
                { day: '明天', temp: '26/19°', desc: '晴', icon: '☀️' },
                { day: '后天', temp: '25/18°', desc: '多云', icon: '⛅' },
                { day: '大后天', temp: '23/17°', desc: '阵雨', icon: '🌦️' },
                { day: '周五', temp: '24/18°', desc: '晴', icon: '☀️' }
            ],
            advice: '大理气候宜人，24°C适合户外游玩。建议做好防晒，苍山洱海日出日落最美。'
        },
        '厦门': {
            current: { temp: 28, desc: '晴', humidity: 72, wind: '海风3级', icon: '☀️' },
            forecast: [
                { day: '今天', temp: '28/24°', desc: '晴', icon: '☀️' },
                { day: '明天', temp: '29/25°', desc: '多云', icon: '⛅' },
                { day: '后天', temp: '27/23°', desc: '阵雨', icon: '🌦️' },
                { day: '大后天', temp: '28/24°', desc: '多云', icon: '⛅' },
                { day: '周五', temp: '30/26°', desc: '晴', icon: '☀️' }
            ],
            advice: '厦门海风舒适，适合海滨游玩。注意防晒，鼓浪屿建议早上去人少。'
        },
        '西安': {
            current: { temp: 32, desc: '晴', humidity: 45, wind: '东北风2级', icon: '☀️' },
            forecast: [
                { day: '今天', temp: '32/22°', desc: '晴', icon: '☀️' },
                { day: '明天', temp: '34/24°', desc: '晴', icon: '☀️' },
                { day: '后天', temp: '33/23°', desc: '多云', icon: '⛅' },
                { day: '大后天', temp: '30/21°', desc: '雷阵雨', icon: '⛈️' },
                { day: '周五', temp: '31/22°', desc: '多云', icon: '⛅' }
            ],
            advice: '西安近期炎热，户外景点建议早出晚归。兵马俑建议预约上午场次，避开下午高峰。'
        },
        '长沙': {
            current: { temp: 35, desc: '晴', humidity: 70, wind: '南风2级', icon: '☀️' },
            forecast: [
                { day: '今天', temp: '35/27°', desc: '晴', icon: '☀️' },
                { day: '明天', temp: '36/28°', desc: '多云', icon: '⛅' },
                { day: '后天', temp: '33/25°', desc: '雷阵雨', icon: '⛈️' },
                { day: '大后天', temp: '32/24°', desc: '阵雨', icon: '🌧️' },
                { day: '周五', temp: '34/26°', desc: '多云', icon: '⛅' }
            ],
            advice: '长沙高温炎热，注意防暑降温。夜生活丰富，建议白天室内活动，晚上逛太平老街。'
        },
        '北京': {
            current: { temp: 30, desc: '晴', humidity: 50, wind: '北风3级', icon: '☀️' },
            forecast: [
                { day: '今天', temp: '30/20°', desc: '晴', icon: '☀️' },
                { day: '明天', temp: '32/22°', desc: '晴', icon: '☀️' },
                { day: '后天', temp: '31/21°', desc: '多云', icon: '⛅' },
                { day: '大后天', temp: '28/19°', desc: '雷阵雨', icon: '⛈️' },
                { day: '周五', temp: '29/20°', desc: '晴', icon: '☀️' }
            ],
            advice: '北京天气较好，适合户外游览。故宫建议提前7天预约，长城建议早出发避开人流。'
        },
        '上海': {
            current: { temp: 29, desc: '多云', humidity: 75, wind: '东南风3级', icon: '⛅' },
            forecast: [
                { day: '今天', temp: '29/24°', desc: '多云', icon: '⛅' },
                { day: '明天', temp: '31/25°', desc: '晴', icon: '☀️' },
                { day: '后天', temp: '28/23°', desc: '阵雨', icon: '🌦️' },
                { day: '大后天', temp: '30/25°', desc: '多云', icon: '⛅' },
                { day: '周五', temp: '32/26°', desc: '晴', icon: '☀️' }
            ],
            advice: '上海湿度较大，体感闷热。外滩夜景建议晚上7点后去，迪士尼建议工作日前往。'
        },
        '杭州': {
            current: { temp: 27, desc: '多云', humidity: 68, wind: '东南风2级', icon: '⛅' },
            forecast: [
                { day: '今天', temp: '27/22°', desc: '多云', icon: '⛅' },
                { day: '明天', temp: '29/23°', desc: '晴', icon: '☀️' },
                { day: '后天', temp: '26/21°', desc: '阵雨', icon: '🌦️' },
                { day: '大后天', temp: '28/22°', desc: '多云', icon: '⛅' },
                { day: '周五', temp: '30/24°', desc: '晴', icon: '☀️' }
            ],
            advice: '杭州气候宜人，西湖骑行推荐。建议清晨游览断桥残雪，避开人流高峰。'
        },
        '重庆': {
            current: { temp: 36, desc: '晴', humidity: 75, wind: '微风', icon: '☀️' },
            forecast: [
                { day: '今天', temp: '36/28°', desc: '晴', icon: '☀️' },
                { day: '明天', temp: '37/29°', desc: '多云', icon: '⛅' },
                { day: '后天', temp: '34/26°', desc: '雷阵雨', icon: '⛈️' },
                { day: '大后天', temp: '33/25°', desc: '阵雨', icon: '🌧️' },
                { day: '周五', temp: '35/27°', desc: '多云', icon: '⛅' }
            ],
            advice: '重庆高温炎热，注意防暑。洪崖洞夜景最佳，建议晚上8点后前往。火锅建议选老字号。'
        },
        '丽江': {
            current: { temp: 22, desc: '晴', humidity: 50, wind: '西南风2级', icon: '☀️' },
            forecast: [
                { day: '今天', temp: '22/15°', desc: '晴', icon: '☀️' },
                { day: '明天', temp: '24/16°', desc: '晴', icon: '☀️' },
                { day: '后天', temp: '21/14°', desc: '多云', icon: '⛅' },
                { day: '大后天', temp: '20/13°', desc: '阵雨', icon: '🌦️' },
                { day: '周五', temp: '23/15°', desc: '晴', icon: '☀️' }
            ],
            advice: '丽江早晚温差大，注意添衣。古城夜景最美，玉龙雪山需提前预约。'
        }
    },

    /* ======================================== */
    /* 景点数据：25个景点                         */
    /* 每个景点含：基本信息 + 附近餐馆            */
    /* ======================================== */
    scenics: [
        // ========== 成都景点 ==========
        {
            id: 'cd001', city: '成都', name: '大熊猫繁育研究基地', type: '户外', category: '自然',
            rating: 4.8, price: 55, openTime: '07:30-18:00', transport: '地铁3号线',
            source: '携程/马蜂窝', reviews: 125680, icon: '🐼',
            desc: '世界最大的大熊猫繁育研究机构，可以近距离观察国宝大熊猫的生活。推荐清晨前往，此时熊猫最活跃。',
            restaurants: [
                { name: '熊猫餐厅', cuisine: '川菜', rating: 4.3, price: 80, distance: '500m', desc: '基地内简餐，方便快捷' },
                { name: '竹园农家乐', cuisine: '川菜', rating: 4.5, price: 60, distance: '1.2km', desc: '地道农家菜，回锅肉一绝' }
            ]
        },
        {
            id: 'cd002', city: '成都', name: '武侯祠', type: '室内', category: '人文',
            rating: 4.6, price: 50, openTime: '08:00-18:00', transport: '公交1路',
            source: '携程/马蜂窝', reviews: 89320, icon: '🏛️',
            desc: '中国唯一的君臣合祀祠庙，纪念诸葛亮和刘备。三国文化圣地，红墙竹影是经典打卡点。',
            restaurants: [
                { name: '锦里小吃街', cuisine: '小吃', rating: 4.2, price: 40, distance: '100m', desc: '紧邻武侯祠，各种成都小吃' },
                { name: '陈麻婆豆腐', cuisine: '川菜', rating: 4.6, price: 70, distance: '800m', desc: '百年老店，正宗麻婆豆腐' }
            ]
        },
        {
            id: 'cd003', city: '成都', name: '锦里古街', type: '户外', category: '人文',
            rating: 4.5, price: 0, openTime: '全天', transport: '公交1路',
            source: '马蜂窝/小红书', reviews: 156230, icon: '🏮',
            desc: '成都最古老的商业街之一，集旅游购物、美食小吃于一体。夜晚灯光璀璨，是感受成都慢生活的好去处。',
            restaurants: [
                { name: '三大碗', cuisine: '川菜', rating: 4.4, price: 90, distance: '50m', desc: '锦里内老字号川菜' },
                { name: '糖油果子摊', cuisine: '小吃', rating: 4.7, price: 10, distance: '30m', desc: '成都特色小吃，外酥内糯' }
            ]
        },

        // ========== 大理景点 ==========
        {
            id: 'dl001', city: '大理', name: '洱海', type: '户外', category: '自然',
            rating: 4.9, price: 0, openTime: '全天', transport: '环海公路自驾',
            source: '马蜂窝/小红书', reviews: 198450, icon: '🌊',
            desc: '大理的标志性景点，高原淡水湖。可环海骑行或自驾，沿途风景如画。推荐才村、双廊等观景点。',
            restaurants: [
                { name: '洱海边鱼庄', cuisine: '海鲜', rating: 4.5, price: 120, distance: '200m', desc: '新鲜湖鱼，酸辣鱼招牌' },
                { name: '双廊咖啡馆', cuisine: '饮品', rating: 4.6, price: 50, distance: '500m', desc: '湖景咖啡，拍照圣地' }
            ]
        },
        {
            id: 'dl002', city: '大理', name: '苍山', type: '户外', category: '自然',
            rating: 4.7, price: 40, openTime: '08:00-16:00', transport: '索道',
            source: '携程/马蜂窝', reviews: 76540, icon: '🏔️',
            desc: '大理标志性山脉，十九峰十八溪。可乘索道登顶俯瞰洱海，徒步玉带路感受苍山之美。',
            restaurants: [
                { name: '苍山茶室', cuisine: '饮品', rating: 4.4, price: 40, distance: '300m', desc: '品三道茶，看苍山景' },
                { name: '山脚农家乐', cuisine: '云南菜', rating: 4.3, price: 60, distance: '1km', desc: '山野菜新鲜，土鸡火锅' }
            ]
        },
        {
            id: 'dl003', city: '大理', name: '大理古城', type: '户外', category: '人文',
            rating: 4.5, price: 0, openTime: '全天', transport: '步行',
            source: '马蜂窝/小红书', reviews: 134560, icon: '🏚️',
            desc: '南诏古国遗址，白族建筑风格。洋人街热闹非凡，五华楼登高可俯瞰古城全貌。',
            restaurants: [
                { name: '再回首烧饵块', cuisine: '小吃', rating: 4.7, price: 15, distance: '100m', desc: '大理特色小吃，烤饵块' },
                { name: '梅子井酒家', cuisine: '云南菜', rating: 4.5, price: 100, distance: '200m', desc: '梅子酒+白族菜' }
            ]
        },

        // ========== 厦门景点 ==========
        {
            id: 'xm001', city: '厦门', name: '鼓浪屿', type: '户外', category: '人文',
            rating: 4.8, price: 35, openTime: '全天（轮渡06:30-21:00）', transport: '轮渡',
            source: '携程/马蜂窝', reviews: 234560, icon: '🏝️',
            desc: '世界文化遗产，万国建筑博览。无车马喧嚣，漫步小巷感受文艺气息。日光大坭看日落。',
            restaurants: [
                { name: '林氏鱼丸', cuisine: '海鲜', rating: 4.6, price: 30, distance: '200m', desc: '鼓浪屿老字号鱼丸' },
                { name: '黄胜记肉脯', cuisine: '小吃', rating: 4.5, price: 25, distance: '150m', desc: '百年肉脯老店' }
            ]
        },
        {
            id: 'xm002', city: '厦门', name: '南普陀寺', type: '室内', category: '人文',
            rating: 4.6, price: 0, openTime: '08:00-17:00', transport: '公交1路',
            source: '携程/马蜂窝', reviews: 87340, icon: '⛩️',
            desc: '闽南佛教圣地，千年古刹。寺内素菜馆闻名遐迩，登五老峰可俯瞰厦大和海滨。',
            restaurants: [
                { name: '南普陀素菜馆', cuisine: '闽菜', rating: 4.7, price: 80, distance: '50m', desc: '百年素菜，口碑极佳' },
                { name: '厦大周边小吃', cuisine: '小吃', rating: 4.3, price: 30, distance: '300m', desc: '学生街小吃，物美价廉' }
            ]
        },
        {
            id: 'xm003', city: '厦门', name: '曾厝垵', type: '户外', category: '人文',
            rating: 4.4, price: 0, openTime: '全天', transport: '公交29路',
            source: '小红书/马蜂窝', reviews: 112340, icon: '🏠',
            desc: '中国最文艺渔村，小吃酒吧林立。傍晚逛逛小巷，感受厦门慢生活。',
            restaurants: [
                { name: '阿杰五香', cuisine: '小吃', rating: 4.6, price: 15, distance: '50m', desc: '厦门特色五香卷' },
                { name: '海边大排档', cuisine: '海鲜', rating: 4.4, price: 100, distance: '200m', desc: '海鲜新鲜，海景佐餐' }
            ]
        },

        // ========== 西安景点 ==========
        {
            id: 'xa001', city: '西安', name: '秦始皇兵马俑博物馆', type: '室内', category: '人文',
            rating: 4.9, price: 120, openTime: '08:30-17:30', transport: '旅游专线5路',
            source: '携程/马蜂窝', reviews: 312450, icon: '🗿',
            desc: '世界第八大奇迹，秦始皇陵陪葬坑。一号坑规模最大，建议请讲解员了解历史背景。',
            restaurants: [
                { name: '兵马俑餐厅', cuisine: '陕菜', rating: 4.0, price: 80, distance: '300m', desc: '景区内简餐' },
                { name: '临潼特色面馆', cuisine: '面馆', rating: 4.5, price: 30, distance: '500m', desc: 'biangbiang面正宗' }
            ]
        },
        {
            id: 'xa002', city: '西安', name: '大雁塔', type: '户外', category: '人文',
            rating: 4.7, price: 65, openTime: '08:00-17:00', transport: '地铁4号线',
            source: '携程/马蜂窝', reviews: 156780, icon: '🗼',
            desc: '唐代高僧玄奘译经处，西安地标。北广场音乐喷泉亚洲最大，晚上观看最佳。',
            restaurants: [
                { name: '老孙家泡馍', cuisine: '陕菜', rating: 4.6, price: 50, distance: '400m', desc: '百年羊肉泡馍老店' },
                { name: '大悦城美食', cuisine: '陕菜', rating: 4.3, price: 70, distance: '300m', desc: '商场美食，选择多样' }
            ]
        },
        {
            id: 'xa003', city: '西安', name: '回民街', type: '户外', category: '人文',
            rating: 4.5, price: 0, openTime: '全天', transport: '地铁2号线',
            source: '小红书/马蜂窝', reviews: 198340, icon: '🥘',
            desc: '西安最著名的美食街，回民风味小吃集中地。肉夹馍、羊肉泡馍、烤肉串应有尽有。',
            restaurants: [
                { name: '老金家肉夹馍', cuisine: '小吃', rating: 4.7, price: 15, distance: '50m', desc: '回民街招牌肉夹馍' },
                { name: '红红酸菜炒米', cuisine: '小吃', rating: 4.5, price: 20, distance: '100m', desc: '酸菜炒米，西安特色' }
            ]
        },

        // ========== 长沙景点 ==========
        {
            id: 'cs001', city: '长沙', name: '橘子洲头', type: '户外', category: '自然',
            rating: 4.7, price: 0, openTime: '全天', transport: '地铁2号线',
            source: '携程/马蜂窝', reviews: 176540, icon: '🍊',
            desc: '湘江中流的江心岛，毛泽东青年艺术雕塑所在地。周六晚烟花最美，是长沙必打卡地。',
            restaurants: [
                { name: '橘子洲餐厅', cuisine: '湘菜', rating: 4.2, price: 100, distance: '300m', desc: '岛上中餐厅' },
                { name: '太平街小吃', cuisine: '小吃', rating: 4.5, price: 30, distance: '1km', desc: '出岛后去太平街吃小吃' }
            ]
        },
        {
            id: 'cs002', city: '长沙', name: '岳麓山', type: '户外', category: '自然',
            rating: 4.6, price: 0, openTime: '06:00-23:00', transport: '地铁4号线',
            source: '马蜂窝/小红书', reviews: 134560, icon: '⛰️',
            desc: '南岳衡山七十二峰之一，岳麓书院在山脚下。秋天枫叶最美，爱晚亭是赏枫胜地。',
            restaurants: [
                { name: '岳麓书院茶室', cuisine: '饮品', rating: 4.4, price: 40, distance: '100m', desc: '书院内品茶' },
                { name: '大学城美食街', cuisine: '湘菜', rating: 4.5, price: 40, distance: '500m', desc: '学生街，臭豆腐一绝' }
            ]
        },
        {
            id: 'cs003', city: '长沙', name: '太平老街', type: '户外', category: '人文',
            rating: 4.5, price: 0, openTime: '全天', transport: '地铁1号线',
            source: '小红书/马蜂窝', reviews: 167890, icon: '🏮',
            desc: '长沙最古老的街道之一，贾谊故居所在地。如今是网红美食打卡地，茶颜悦色总店在此。',
            restaurants: [
                { name: '茶颜悦色', cuisine: '饮品', rating: 4.8, price: 18, distance: '50m', desc: '长沙网红奶茶，必喝' },
                { name: '黑色经典臭豆腐', cuisine: '小吃', rating: 4.7, price: 10, distance: '30m', desc: '长沙臭豆腐代表' }
            ]
        },

        // ========== 北京景点 ==========
        {
            id: 'bj001', city: '北京', name: '故宫博物院', type: '室内', category: '人文',
            rating: 4.9, price: 60, openTime: '08:30-17:00（周一闭馆）', transport: '地铁1号线',
            source: '携程/马蜂窝', reviews: 456780, icon: '🏯',
            desc: '明清两代皇宫，世界现存最大宫殿建筑群。建议从午门入，神武门出，至少预留半天时间。',
            restaurants: [
                { name: '故宫角楼咖啡', cuisine: '饮品', rating: 4.5, price: 50, distance: '200m', desc: '故宫内网红咖啡' },
                { name: '四季民福烤鸭', cuisine: '京菜', rating: 4.7, price: 150, distance: '500m', desc: '故宫旁看景吃烤鸭' }
            ]
        },
        {
            id: 'bj002', city: '北京', name: '八达岭长城', type: '户外', category: '人文',
            rating: 4.8, price: 40, openTime: '06:30-19:00', transport: 'S2线/旅游大巴',
            source: '携程/马蜂窝', reviews: 287650, icon: '🧱',
            desc: '万里长城最著名段落，"不到长城非好汉"。建议早出发，坐缆车省体力，北段风景更好。',
            restaurants: [
                { name: '长城脚下农家院', cuisine: '京菜', rating: 4.3, price: 80, distance: '800m', desc: '农家菜，虹鳟鱼特色' },
                { name: '肯德基', cuisine: '快餐', rating: 4.0, price: 50, distance: '500m', desc: '景区附近，方便快捷' }
            ]
        },
        {
            id: 'bj003', city: '北京', name: '颐和园', type: '户外', category: '人文',
            rating: 4.7, price: 30, openTime: '06:30-18:00', transport: '地铁4号线',
            source: '携程/马蜂窝', reviews: 198760, icon: '🏞️',
            desc: '清代皇家园林，以昆明湖、万寿山为基址。长廊、十七孔桥是经典景点，建议坐船游湖。',
            restaurants: [
                { name: '听鹂馆', cuisine: '京菜', rating: 4.5, price: 200, distance: '100m', desc: '宫廷菜，园内老字号' },
                { name: '颐和园咖啡', cuisine: '饮品', rating: 4.3, price: 40, distance: '200m', desc: '园内网红咖啡' }
            ]
        },

        // ========== 上海景点 ==========
        {
            id: 'sh001', city: '上海', name: '外滩', type: '户外', category: '人文',
            rating: 4.8, price: 0, openTime: '全天', transport: '地铁2号线',
            source: '携程/马蜂窝', reviews: 345670, icon: '🌃',
            desc: '上海地标，万国建筑博览群。对岸是陆家嘴天际线，晚上灯光秀最美。建议晚上7点后前往。',
            restaurants: [
                { name: '外滩18号餐厅', cuisine: '江浙菜', rating: 4.6, price: 300, distance: '100m', desc: '高端江浙菜，景观位' },
                { name: '南京路小吃', cuisine: '小吃', rating: 4.3, price: 40, distance: '300m', desc: '步行街各种小吃' }
            ]
        },
        {
            id: 'sh002', city: '上海', name: '东方明珠塔', type: '室内', category: '人文',
            rating: 4.6, price: 120, openTime: '08:00-21:30', transport: '地铁2号线',
            source: '携程/马蜂窝', reviews: 234560, icon: '📡',
            desc: '上海标志性建筑，高468米。观光层可俯瞰全城，透明玻璃走廊挑战胆量。',
            restaurants: [
                { name: '旋转餐厅', cuisine: '江浙菜', rating: 4.4, price: 400, distance: '0m', desc: '塔内旋转餐厅，自助餐' },
                { name: '正大广场美食', cuisine: '江浙菜', rating: 4.3, price: 80, distance: '200m', desc: '商场美食，选择多' }
            ]
        },

        // ========== 杭州景点 ==========
        {
            id: 'hz001', city: '杭州', name: '西湖', type: '户外', category: '自然',
            rating: 4.9, price: 0, openTime: '全天', transport: '地铁1号线',
            source: '携程/马蜂窝', reviews: 423560, icon: '🌅',
            desc: '世界文化遗产，"淡妆浓抹总相宜"。推荐骑自行车环湖，断桥、苏堤、雷峰塔是经典景点。',
            restaurants: [
                { name: '楼外楼', cuisine: '浙菜', rating: 4.6, price: 200, distance: '100m', desc: '西湖醋鱼老字号' },
                { name: '知味观', cuisine: '浙菜', rating: 4.5, price: 80, distance: '500m', desc: '杭州传统小吃' }
            ]
        },
        {
            id: 'hz002', city: '杭州', name: '灵隐寺', type: '室内', category: '人文',
            rating: 4.7, price: 75, openTime: '07:00-18:00', transport: '公交7路',
            source: '携程/马蜂窝', reviews: 178450, icon: '🛕',
            desc: '江南著名古刹，已有1700年历史。飞来峰石刻造像精美，是杭州必游之地。',
            restaurants: [
                { name: '灵隐素斋', cuisine: '浙菜', rating: 4.5, price: 60, distance: '50m', desc: '寺内素斋，清淡养身' },
                { name: '灵隐路茶室', cuisine: '饮品', rating: 4.4, price: 50, distance: '300m', desc: '龙井茶，环境清幽' }
            ]
        },

        // ========== 重庆景点 ==========
        {
            id: 'cq001', city: '重庆', name: '洪崖洞', type: '户外', category: '人文',
            rating: 4.7, price: 0, openTime: '全天', transport: '地铁1号线',
            source: '小红书/马蜂窝', reviews: 312450, icon: '🏚️',
            desc: '重庆地标，吊脚楼建筑群。夜景如千与千寻现实版，建议晚上8点后前往。11层可坐电梯。',
            restaurants: [
                { name: '洪崖洞火锅', cuisine: '火锅', rating: 4.5, price: 120, distance: '50m', desc: '洞内火锅，氛围感足' },
                { name: '小滨楼', cuisine: '川菜', rating: 4.4, price: 80, distance: '100m', desc: '重庆老字号川菜' }
            ]
        },
        {
            id: 'cq002', city: '重庆', name: '磁器口古镇', type: '户外', category: '人文',
            rating: 4.5, price: 0, openTime: '全天', transport: '地铁1号线',
            source: '马蜂窝/小红书', reviews: 187650, icon: '🏺',
            desc: '千年古镇，重庆古城缩影。麻花、毛血旺是特色，建议避开节假日前往。',
            restaurants: [
                { name: '陈麻花', cuisine: '小吃', rating: 4.7, price: 20, distance: '50m', desc: '磁器口招牌麻花' },
                { name: '毛血旺老店', cuisine: '川菜', rating: 4.5, price: 70, distance: '100m', desc: '正宗毛血旺发源地' }
            ]
        },

        // ========== 丽江景点 ==========
        {
            id: 'lj001', city: '丽江', name: '丽江古城', type: '户外', category: '人文',
            rating: 4.6, price: 0, openTime: '全天', transport: '步行',
            source: '马蜂窝/小红书', reviews: 256780, icon: '🏚️',
            desc: '世界文化遗产，纳西族聚居地。四方街是中心，木府是纳西土司衙门。夜晚酒吧街热闹。',
            restaurants: [
                { name: '阿安酸奶', cuisine: '饮品', rating: 4.7, price: 15, distance: '100m', desc: '丽江网红酸奶' },
                { name: '腊排骨火锅', cuisine: '云南菜', rating: 4.6, price: 80, distance: '200m', desc: '丽江特色，腊排骨' }
            ]
        },
        {
            id: 'lj002', city: '丽江', name: '玉龙雪山', type: '户外', category: '自然',
            rating: 4.8, price: 130, openTime: '07:00-18:00', transport: '旅游大巴',
            source: '携程/马蜂窝', reviews: 198450, icon: '🏔️',
            desc: '北半球最南的大雪山，海拔5596米。可乘索道到4506米，蓝月谷是山脚最美景点。',
            restaurants: [
                { name: '雪山餐厅', cuisine: '云南菜', rating: 4.0, price: 100, distance: '300m', desc: '景区内简餐' },
                { name: '蓝月谷农家乐', cuisine: '云南菜', rating: 4.3, price: 60, distance: '500m', desc: '山脚农家菜' }
            ]
        }
    ],

    /* ======================================== */
    /* 美食数据：40条美食                         */
    /* ======================================== */
    foods: [
        // ========== 成都美食 ==========
        { city: '成都', name: '小龙坎火锅', cuisine: '火锅', area: '春熙路', price: 120, rating: 4.7, reviews: 15680, source: '大众点评', icon: '🍲', desc: '成都老牌火锅，麻辣鲜香', tip: '高峰期排队2h+，建议16:30前取号' },
        { city: '成都', name: '陈麻婆豆腐', cuisine: '川菜', area: '青羊区', price: 70, rating: 4.6, reviews: 8930, source: '大众点评', icon: '🥘', desc: '百年老店，麻婆豆腐发源地', tip: '招牌麻婆豆腐必点，配米饭绝佳' },
        { city: '成都', name: '龙抄手', cuisine: '小吃', area: '春熙路', price: 40, rating: 4.4, reviews: 12340, source: '小红书', icon: '🥟', desc: '成都名小吃，抄手皮薄馅嫩', tip: '总店在春熙路，游客较多' },
        { city: '成都', name: '钟水饺', cuisine: '小吃', area: '武侯区', price: 25, rating: 4.5, reviews: 9870, source: '大众点评', icon: '🥟', desc: '红油水饺，甜辣口味', tip: '搭配清汤更解腻' },

        // ========== 大理美食 ==========
        { city: '大理', name: '再回首烧饵块', cuisine: '小吃', area: '大理古城', price: 15, rating: 4.7, reviews: 6780, source: '小红书', icon: '🍚', desc: '大理特色烤饵块', tip: '古城内最火的饵块摊' },
        { city: '大理', name: '梅子井酒家', cuisine: '云南菜', area: '大理古城', price: 100, rating: 4.5, reviews: 5430, source: '大众点评', icon: '🫐', desc: '梅子酒+白族菜', tip: '梅子酒必喝，搭配酸辣鱼' },
        { city: '大理', name: '苍洱春饭店', cuisine: '云南菜', area: '才村', price: 80, rating: 4.6, reviews: 7890, source: '大众点评', icon: '🍲', desc: '洱海边白族农家菜', tip: '酸辣鱼、黄焖鸡招牌' },
        { city: '大理', name: '双廊咖啡馆', cuisine: '饮品', area: '双廊', price: 50, rating: 4.6, reviews: 4560, source: '小红书', icon: '☕', desc: '湖景咖啡，拍照圣地', tip: '下午去光线最好，坐二楼露台' },

        // ========== 厦门美食 ==========
        { city: '厦门', name: '林氏鱼丸', cuisine: '海鲜', area: '鼓浪屿', price: 30, rating: 4.6, reviews: 13450, source: '大众点评', icon: '🐟', desc: '鼓浪屿老字号鱼丸', tip: '买袋装鱼丸汤边走边吃' },
        { city: '厦门', name: '黄胜记肉脯', cuisine: '小吃', area: '鼓浪屿', price: 25, rating: 4.5, reviews: 11230, source: '大众点评', icon: '🥓', desc: '百年肉脯老店', tip: '可试吃，买散装更划算' },
        { city: '厦门', name: '阿杰五香', cuisine: '小吃', area: '曾厝垵', price: 15, rating: 4.6, reviews: 8760, source: '小红书', icon: '🌯', desc: '厦门特色五香卷', tip: '搭配甜辣酱更美味' },
        { city: '厦门', name: '1981海鲜大排档', cuisine: '海鲜', area: '曾厝垵', price: 120, rating: 4.4, reviews: 6540, source: '大众点评', icon: '🦐', desc: '海鲜新鲜，海景佐餐', tip: '晚上去有海风，注意比价' },

        // ========== 西安美食 ==========
        { city: '西安', name: '老孙家泡馍', cuisine: '陕菜', area: '大雁塔', price: 50, rating: 4.6, reviews: 15670, source: '大众点评', icon: '🍜', desc: '百年羊肉泡馍老店', tip: '自己掰馍更有仪式感，越小越好' },
        { city: '西安', name: '老金家肉夹馍', cuisine: '小吃', area: '回民街', price: 15, rating: 4.7, reviews: 18930, source: '小红书', icon: '🥙', desc: '回民街招牌肉夹馍', tip: '肥瘦相间最好吃，排队人多' },
        { city: '西安', name: '红红酸菜炒米', cuisine: '小吃', area: '回民街', price: 20, rating: 4.5, reviews: 9870, source: '大众点评', icon: '🍚', desc: '酸菜炒米，西安特色', tip: '搭配酸梅汤解腻' },
        { city: '西安', name: 'biangbiang面馆', cuisine: '面馆', area: '碑林区', price: 30, rating: 4.6, reviews: 11230, source: '大众点评', icon: '🍝', desc: '正宗biangbiang面', tip: '油泼面最香，面宽有嚼劲' },

        // ========== 长沙美食 ==========
        { city: '长沙', name: '茶颜悦色', cuisine: '饮品', area: '太平老街', price: 18, rating: 4.8, reviews: 34560, source: '小红书', icon: '🧋', desc: '长沙网红奶茶，必喝', tip: '幽兰拿铁是招牌，总店人最多' },
        { city: '长沙', name: '黑色经典臭豆腐', cuisine: '小吃', area: '太平老街', price: 10, rating: 4.7, reviews: 22340, source: '小红书', icon: '🟫', desc: '长沙臭豆腐代表', tip: '外酥内嫩，汤汁丰富' },
        { city: '长沙', name: '文和友老长沙龙虾馆', cuisine: '湘菜', area: '海信广场', price: 150, rating: 4.5, reviews: 27890, source: '大众点评', icon: '🦞', desc: '网红小龙虾，复古装修', tip: '排队恐怖，建议下午4点取号' },
        { city: '长沙', name: '新华楼', cuisine: '湘菜', area: '五一广场', price: 60, rating: 4.4, reviews: 8760, source: '大众点评', icon: '🍲', desc: '老长沙味道，刮凉粉', tip: '刮凉粉和荷兰粉都是特色' },

        // ========== 北京美食 ==========
        { city: '北京', name: '四季民福烤鸭', cuisine: '京菜', area: '故宫旁', price: 150, rating: 4.7, reviews: 34560, source: '大众点评', icon: '🦆', desc: '故宫旁看景吃烤鸭', tip: '提前取号，靠窗位看故宫角楼' },
        { city: '北京', name: '护国寺小吃', cuisine: '京菜', area: '西城区', price: 30, rating: 4.4, reviews: 12340, source: '大众点评', icon: '🥟', desc: '老北京小吃总汇', tip: '豆汁焦圈、艾窝窝、驴打滚' },
        { city: '北京', name: '南门涮肉', cuisine: '火锅', area: '簋街', price: 120, rating: 4.6, reviews: 15670, source: '大众点评', icon: '🍲', desc: '老北京铜锅涮肉', tip: '手切鲜羊肉最赞，麻酱必蘸' },
        { city: '北京', name: '方砖厂69号炸酱面', cuisine: '面馆', area: '东城区', price: 35, rating: 4.7, reviews: 13450, source: '小红书', icon: '🍜', desc: '北京最好吃的炸酱面', tip: '胡同小店，排队半小时起' },

        // ========== 上海美食 ==========
        { city: '上海', name: '南翔馒头店', cuisine: '江浙菜', area: '城隍庙', price: 60, rating: 4.5, reviews: 23450, source: '大众点评', icon: '🥟', desc: '百年小笼包老店', tip: '二楼堂食比一楼外带好' },
        { city: '上海', name: '老克勒面馆', cuisine: '面馆', area: '黄浦区', price: 45, rating: 4.6, reviews: 11230, source: '小红书', icon: '🍝', desc: '上海葱油拌面代表', tip: '葱油拌面+排骨年糕是标配' },
        { city: '上海', name: '大壶春', cuisine: '小吃', area: '四川路', price: 25, rating: 4.4, reviews: 9870, source: '大众点评', icon: '🥟', desc: '上海生煎包老字号', tip: '生煎分清水和浑水，大壶春是清水' },
        { city: '上海', name: 'M stand', cuisine: '饮品', area: '新天地', price: 45, rating: 4.6, reviews: 8760, source: '小红书', icon: '☕', desc: '精品咖啡连锁', tip: '西式咖啡+轻食，环境好' },

        // ========== 杭州美食 ==========
        { city: '杭州', name: '楼外楼', cuisine: '浙菜', area: '西湖边', price: 200, rating: 4.6, reviews: 27890, source: '大众点评', icon: '🐟', desc: '西湖醋鱼老字号', tip: '景区店价格高，味道正宗' },
        { city: '杭州', name: '知味观', cuisine: '浙菜', area: '湖滨路', price: 80, rating: 4.5, reviews: 16780, source: '大众点评', icon: '🥟', desc: '杭州传统小吃总汇', tip: '猫耳朵、幸福双是招牌' },
        { city: '杭州', name: '新白鹿餐厅', cuisine: '浙菜', area: '延安路', price: 70, rating: 4.5, reviews: 18930, source: '大众点评', icon: '🍲', desc: '杭州性价比最高的浙菜', tip: '蛋黄南瓜、西湖醋鱼必点' },
        { city: '杭州', name: '绿茶餐厅', cuisine: '浙菜', area: '龙井路', price: 75, rating: 4.4, reviews: 15670, source: '小红书', icon: '🍵', desc: '茶园里的网红餐厅', tip: '总店在龙井路，环境一流' },

        // ========== 重庆美食 ==========
        { city: '重庆', name: '洪崖洞火锅', cuisine: '火锅', area: '洪崖洞', price: 120, rating: 4.5, reviews: 22340, source: '大众点评', icon: '🍲', desc: '洞内火锅，氛围感足', tip: '晚上去边吃边看夜景' },
        { city: '重庆', name: '珮姐老火锅', cuisine: '火锅', area: '解放碑', price: 130, rating: 4.7, reviews: 28760, source: '小红书', icon: '🍲', desc: '重庆火锅排队王', tip: '提前在APP上取号' },
        { city: '重庆', name: '陈麻花', cuisine: '小吃', area: '磁器口', price: 20, rating: 4.7, reviews: 13450, source: '小红书', icon: '🥨', desc: '磁器口招牌麻花', tip: '多家同名，认准"陈昌银"' },
        { city: '重庆', name: '好又来酸辣粉', cuisine: '小吃', area: '磁器口', price: 12, rating: 4.6, reviews: 15670, source: '大众点评', icon: '🍜', desc: '磁器口最火酸辣粉', tip: '排队购买，站在路边吃' },

        // ========== 丽江美食 ==========
        { city: '丽江', name: '腊排骨火锅', cuisine: '云南菜', area: '丽江古城', price: 80, rating: 4.6, reviews: 11230, source: '大众点评', icon: '🍲', desc: '丽江特色，腊排骨', tip: '搭配水性杨花和丽江粑粑' },
        { city: '丽江', name: '阿安酸奶', cuisine: '饮品', area: '丽江古城', price: 15, rating: 4.7, reviews: 9870, source: '小红书', icon: '🥛', desc: '丽江网红酸奶', tip: '加红豆和水果，古城内多家分店' },
        { city: '丽江', name: '88号小吃', cuisine: '云南菜', area: '丽江古城', price: 50, rating: 4.4, reviews: 7650, source: '大众点评', icon: '🥘', desc: '纳西风味小吃', tip: '鸡豆凉粉和丽江粑粑必尝' },
        { city: '丽江', name: '束河烤鱼', cuisine: '云南菜', area: '束河古镇', price: 70, rating: 4.5, reviews: 6540, source: '大众点评', icon: '🐟', desc: '束河特色烤鱼', tip: '晚上去有篝火晚会' }
    ],

    /* ======================================== */
    /* 行程方案：每个城市2套                      */
    /* ======================================== */
    tripPlans: {
        '成都': [
            {
                name: '休闲2日游', tag: '休闲游', recommended: true,
                days: [
                    { day: 1, morning: '大熊猫繁育研究基地（上午熊猫最活跃）', afternoon: '武侯祠+锦里古街', evening: '锦里小吃街晚餐' },
                    { day: 2, morning: '人民公园喝茶', afternoon: '宽窄巷子逛街', evening: '小龙坎火锅' }
                ]
            },
            {
                name: '密集3日游', tag: '密集打卡', recommended: false,
                days: [
                    { day: 1, morning: '大熊猫繁育研究基地', afternoon: '武侯祠', evening: '锦里古街' },
                    { day: 2, morning: '都江堰', afternoon: '青城山', evening: '宽窄巷子' },
                    { day: 3, morning: '人民公园', afternoon: '春熙路/太古里', evening: '九眼桥酒吧街' }
                ]
            }
        ],
        '大理': [
            {
                name: '环海2日游', tag: '休闲游', recommended: true,
                days: [
                    { day: 1, morning: '大理古城', afternoon: '才村码头看洱海', evening: '古城夜市' },
                    { day: 2, morning: '环海骑行（才村→双廊）', afternoon: '双廊古镇', evening: '双廊晚餐' }
                ]
            },
            {
                name: '深度3日游', tag: '人文探索', recommended: false,
                days: [
                    { day: 1, morning: '大理古城', afternoon: '崇圣寺三塔', evening: '古城' },
                    { day: 2, morning: '苍山索道', afternoon: '环海到双廊', evening: '双廊' },
                    { day: 3, morning: '喜洲古镇', afternoon: '海舌公园', evening: '返回古城' }
                ]
            }
        ],
        '厦门': [
            {
                name: '文艺2日游', tag: '休闲游', recommended: true,
                days: [
                    { day: 1, morning: '鼓浪屿（早班轮渡人少）', afternoon: '鼓浪屿继续', evening: '中山路步行街' },
                    { day: 2, morning: '南普陀寺', afternoon: '曾厝垵', evening: '环岛路骑行' }
                ]
            },
            {
                name: '深度3日游', tag: '密集打卡', recommended: false,
                days: [
                    { day: 1, morning: '鼓浪屿', afternoon: '鼓浪屿', evening: '中山路' },
                    { day: 2, morning: '南普陀+厦大', afternoon: '胡里山炮台', evening: '曾厝垵' },
                    { day: 3, morning: '集美学村', afternoon: '环岛路', evening: '演武大桥观景平台' }
                ]
            }
        ],
        '西安': [
            {
                name: '经典3日游', tag: '人文探索', recommended: true,
                days: [
                    { day: 1, morning: '兵马俑（上午人少）', afternoon: '华清宫', evening: '回民街晚餐' },
                    { day: 2, morning: '陕西历史博物馆', afternoon: '大雁塔', evening: '大唐不夜城' },
                    { day: 3, morning: '古城墙骑行', afternoon: '碑林博物馆', evening: '永兴坊' }
                ]
            },
            {
                name: '精华2日游', tag: '密集打卡', recommended: false,
                days: [
                    { day: 1, morning: '兵马俑', afternoon: '大雁塔', evening: '回民街' },
                    { day: 2, morning: '古城墙', afternoon: '陕西历史博物馆', evening: '大唐不夜城' }
                ]
            }
        ],
        '长沙': [
            {
                name: '网红2日游', tag: '休闲游', recommended: true,
                days: [
                    { day: 1, morning: '岳麓山+岳麓书院', afternoon: '橘子洲头', evening: '太平老街（茶颜悦色）' },
                    { day: 2, morning: '湖南省博物馆', afternoon: 'IFS国金中心', evening: '文和友小龙虾' }
                ]
            },
            {
                name: '美食1日游', tag: '密集打卡', recommended: false,
                days: [
                    { day: 1, morning: '太平老街早餐', afternoon: '坡子街午餐', evening: '文和友晚餐' }
                ]
            }
        ],
        '北京': [
            {
                name: '经典3日游', tag: '人文探索', recommended: true,
                days: [
                    { day: 1, morning: '天安门广场', afternoon: '故宫博物院', evening: '王府井步行街' },
                    { day: 2, morning: '八达岭长城', afternoon: '明十三陵', evening: '簋街晚餐' },
                    { day: 3, morning: '颐和园', afternoon: '圆明园', evening: '鸟巢水立方' }
                ]
            },
            {
                name: '精华2日游', tag: '密集打卡', recommended: false,
                days: [
                    { day: 1, morning: '天安门+故宫', afternoon: '景山公园', evening: '王府井' },
                    { day: 2, morning: '长城', afternoon: '颐和园', evening: '簋街' }
                ]
            }
        ],
        '上海': [
            {
                name: '魔都2日游', tag: '休闲游', recommended: true,
                days: [
                    { day: 1, morning: '外滩+南京路', afternoon: '豫园', evening: '外滩夜景' },
                    { day: 2, morning: '东方明珠', afternoon: '田子坊', evening: '新天地' }
                ]
            },
            {
                name: '深度3日游', tag: '密集打卡', recommended: false,
                days: [
                    { day: 1, morning: '外滩', afternoon: '南京路', evening: '豫园' },
                    { day: 2, morning: '东方明珠', afternoon: '上海博物馆', evening: '新天地' },
                    { day: 3, morning: '迪士尼', afternoon: '迪士尼', evening: '迪士尼烟花' }
                ]
            }
        ],
        '杭州': [
            {
                name: '西湖2日游', tag: '休闲游', recommended: true,
                days: [
                    { day: 1, morning: '西湖（断桥→苏堤）', afternoon: '雷峰塔', evening: '河坊街' },
                    { day: 2, morning: '灵隐寺', afternoon: '龙井村', evening: '西湖音乐喷泉' }
                ]
            },
            {
                name: '深度3日游', tag: '人文探索', recommended: false,
                days: [
                    { day: 1, morning: '西湖', afternoon: '浙江省博物馆', evening: '河坊街' },
                    { day: 2, morning: '灵隐寺', afternoon: '宋城', evening: '宋城千古情' },
                    { day: 3, morning: '西溪湿地', afternoon: '龙井村', evening: '河坊街' }
                ]
            }
        ],
        '重庆': [
            {
                name: '山城2日游', tag: '休闲游', recommended: true,
                days: [
                    { day: 1, morning: '磁器口古镇', afternoon: '白公馆', evening: '洪崖洞夜景' },
                    { day: 2, morning: '长江索道', afternoon: '解放碑', evening: '南山一棵树看夜景' }
                ]
            },
            {
                name: '魔幻3日游', tag: '密集打卡', recommended: false,
                days: [
                    { day: 1, morning: '磁器口', afternoon: '渣滓洞', evening: '洪崖洞' },
                    { day: 2, morning: '长江索道', afternoon: '解放碑', evening: '南山一棵树' },
                    { day: 3, morning: '武隆天坑', afternoon: '武隆天坑', evening: '返回市区' }
                ]
            }
        ],
        '丽江': [
            {
                name: '古城2日游', tag: '休闲游', recommended: true,
                days: [
                    { day: 1, morning: '丽江古城', afternoon: '木府', evening: '古城酒吧街' },
                    { day: 2, morning: '玉龙雪山', afternoon: '蓝月谷', evening: '返回古城' }
                ]
            },
            {
                name: '深度3日游', tag: '人文探索', recommended: false,
                days: [
                    { day: 1, morning: '丽江古城', afternoon: '木府', evening: '古城' },
                    { day: 2, morning: '玉龙雪山', afternoon: '蓝月谷', evening: '古城' },
                    { day: 3, morning: '束河古镇', afternoon: '拉市海', evening: '返回古城' }
                ]
            }
        ]
    },

    /* ======================================== */
    /* 交通票务数据                              */
    /* ======================================== */
    tickets: {
        // 城际交通（城市间）
        intercity: [
            // 北京→成都
            { from: '北京', to: '成都', type: '高铁', code: 'G89', depTime: '06:00', arrTime: '14:30', duration: '8h30m', price: 780, seat: '二等座', remain: '充足' },
            { from: '北京', to: '成都', type: '高铁', code: 'G307', depTime: '08:35', arrTime: '20:55', duration: '12h20m', price: 780, seat: '二等座', remain: '紧张' },
            { from: '北京', to: '成都', type: '飞机', code: 'CA1415', depTime: '07:30', arrTime: '10:25', duration: '2h55m', price: 1280, seat: '经济舱', remain: '充足' },
            { from: '北京', to: '成都', type: '飞机', code: 'MU5237', depTime: '14:00', arrTime: '16:50', duration: '2h50m', price: 1150, seat: '经济舱', remain: '紧张' },
            { from: '北京', to: '成都', type: '火车', code: 'K1363', depTime: '21:50', arrTime: '07:32', duration: '33h42m', price: 263, seat: '硬座', remain: '充足' },

            // 北京→上海
            { from: '北京', to: '上海', type: '高铁', code: 'G1', depTime: '09:00', arrTime: '13:28', duration: '4h28m', price: 553, seat: '二等座', remain: '充足' },
            { from: '北京', to: '上海', type: '高铁', code: 'G3', depTime: '11:00', arrTime: '15:28', duration: '4h28m', price: 553, seat: '二等座', remain: '紧张' },
            { from: '北京', to: '上海', type: '飞机', code: 'CA1501', depTime: '08:00', arrTime: '10:15', duration: '2h15m', price: 980, seat: '经济舱', remain: '充足' },

            // 成都→大理
            { from: '成都', to: '大理', type: '高铁', code: 'G2845', depTime: '07:08', arrTime: '13:28', duration: '6h20m', price: 520, seat: '二等座', remain: '紧张' },
            { from: '成都', to: '大理', type: '飞机', code: '3U8675', depTime: '10:20', arrTime: '11:45', duration: '1h25m', price: 680, seat: '经济舱', remain: '充足' },

            // 成都→重庆
            { from: '成都', to: '重庆', type: '高铁', code: 'G8607', depTime: '07:00', arrTime: '08:55', duration: '1h55m', price: 154, seat: '二等座', remain: '充足' },
            { from: '成都', to: '重庆', type: '火车', code: 'K9455', depTime: '15:20', arrTime: '19:50', duration: '4h30m', price: 50, seat: '硬座', remain: '充足' },

            // 大理→丽江
            { from: '大理', to: '丽江', type: '火车', code: 'K9623', depTime: '09:10', arrTime: '11:30', duration: '2h20m', price: 34, seat: '硬座', remain: '充足' },
            { from: '大理', to: '丽江', type: '大巴', code: '大巴', depTime: '08:00-18:00每30分', arrTime: '约2.5h', duration: '2h30m', price: 65, seat: '普通座', remain: '充足' },

            // 上海→杭州
            { from: '上海', to: '杭州', type: '高铁', code: 'G7373', depTime: '07:15', arrTime: '08:25', duration: '1h10m', price: 73, seat: '二等座', remain: '充足' },
            { from: '上海', to: '杭州', type: '高铁', code: 'G7385', depTime: '12:00', arrTime: '13:15', duration: '1h15m', price: 73, seat: '二等座', remain: '紧张' },

            // 西安→成都
            { from: '西安', to: '成都', type: '高铁', code: 'D1917', depTime: '07:00', arrTime: '11:20', duration: '4h20m', price: 263, seat: '二等座', remain: '充足' },
            { from: '西安', to: '成都', type: '飞机', code: 'MU2215', depTime: '15:30', arrTime: '17:00', duration: '1h30m', price: 520, seat: '经济舱', remain: '紧张' },

            // 长沙→张家界（扩展）
            { from: '长沙', to: '成都', type: '高铁', code: 'G2156', depTime: '08:00', arrTime: '15:30', duration: '7h30m', price: 580, seat: '二等座', remain: '充足' },
            { from: '长沙', to: '成都', type: '飞机', code: 'CZ3215', depTime: '11:00', arrTime: '13:00', duration: '2h', price: 650, seat: '经济舱', remain: '紧张' },

            // 厦门→杭州
            { from: '厦门', to: '杭州', type: '高铁', code: 'G1654', depTime: '07:40', arrTime: '13:15', duration: '5h35m', price: 460, seat: '二等座', remain: '充足' },
            { from: '厦门', to: '杭州', type: '飞机', code: 'MF8325', depTime: '14:20', arrTime: '16:00', duration: '1h40m', price: 580, seat: '经济舱', remain: '充足' },

            // 重庆→丽江
            { from: '重庆', to: '丽江', type: '飞机', code: '3U8167', depTime: '09:30', arrTime: '11:15', duration: '1h45m', price: 720, seat: '经济舱', remain: '紧张' },

            // 北京→西安
            { from: '北京', to: '西安', type: '高铁', code: 'G87', depTime: '06:00', arrTime: '11:01', duration: '5h01m', price: 515, seat: '二等座', remain: '充足' },
            { from: '北京', to: '西安', type: '飞机', code: 'CA1201', depTime: '08:00', arrTime: '10:00', duration: '2h', price: 850, seat: '经济舱', remain: '充足' },

            // 上海→成都
            { from: '上海', to: '成都', type: '飞机', code: 'MU5401', depTime: '07:30', arrTime: '10:45', duration: '3h15m', price: 1100, seat: '经济舱', remain: '充足' },
            { from: '上海', to: '成都', type: '高铁', code: 'D352', depTime: '06:10', arrTime: '19:15', duration: '13h05m', price: 660, seat: '二等座', remain: '紧张' }
        ],

        // 市内交通
        cityTransport: [
            { city: '成都', type: '地铁', lines: '1/2/3/4/5/6/7号线', price: '2-7元', time: '06:00-23:30', eco: true },
            { city: '成都', type: '公交', lines: '覆盖全市', price: '2元', time: '06:00-22:00', eco: true },
            { city: '成都', type: '共享单车', lines: '哈啰/美团/青桔', price: '1.5元/半小时', time: '24小时', eco: true },
            { city: '大理', type: '环海公交', lines: 'C2路环海', price: '5元', time: '07:00-19:00', eco: true },
            { city: '大理', type: '出租车', lines: '起步价8元', price: '8元起', time: '24小时', eco: false },
            { city: '大理', type: '共享单车', lines: '环海骑行', price: '2元/小时', time: '07:00-19:00', eco: true },
            { city: '厦门', type: '公交', lines: '覆盖全岛', price: '1元', time: '06:00-22:00', eco: true },
            { city: '厦门', type: 'BRT', lines: '快1/快2/快3', price: '2-5元', time: '06:00-22:00', eco: true },
            { city: '厦门', type: '轮渡', lines: '鼓浪屿航线', price: '35元往返', time: '06:30-21:00', eco: true },
            { city: '西安', type: '地铁', lines: '1/2/3/4/5/6/9号线', price: '2-7元', time: '06:00-23:00', eco: true },
            { city: '西安', type: '公交', lines: '覆盖全市', price: '1-2元', time: '06:00-22:00', eco: true },
            { city: '西安', type: '共享单车', lines: '市区骑行', price: '1.5元/半小时', time: '24小时', eco: true },
            { city: '长沙', type: '地铁', lines: '1/2/3/4/5/6号线', price: '2-7元', time: '06:30-23:00', eco: true },
            { city: '长沙', type: '公交', lines: '覆盖全市', price: '2元', time: '06:00-22:00', eco: true },
            { city: '长沙', type: '共享单车', lines: '哈啰/美团', price: '1.5元/半小时', time: '24小时', eco: true },
            { city: '北京', type: '地铁', lines: '1-19号线/八通线/亦庄线等', price: '3-9元', time: '05:00-23:00', eco: true },
            { city: '北京', type: '公交', lines: '覆盖全市', price: '1-2元', time: '05:00-23:00', eco: true },
            { city: '北京', type: '共享单车', lines: '哈啰/美团/青桔', price: '1.5元/半小时', time: '24小时', eco: true },
            { city: '上海', type: '地铁', lines: '1-18号线/磁悬浮', price: '3-10元', time: '05:30-23:00', eco: true },
            { city: '上海', type: '公交', lines: '覆盖全市', price: '2元', time: '05:00-23:00', eco: true },
            { city: '上海', type: '共享单车', lines: '哈啰/美团', price: '1.5元/半小时', time: '24小时', eco: true },
            { city: '杭州', type: '地铁', lines: '1/2/4/5/6/7/9/16/19号线', price: '2-9元', time: '06:00-23:00', eco: true },
            { city: '杭州', type: '公交', lines: '覆盖全市', price: '1-2元', time: '06:00-22:00', eco: true },
            { city: '杭州', type: '共享单车', lines: '小红车（免费）', price: '1小时内免费', time: '24小时', eco: true },
            { city: '重庆', type: '地铁', lines: '1/2/3/4/5/6/9/10号线/环线', price: '2-7元', time: '06:30-23:00', eco: true },
            { city: '重庆', type: '公交', lines: '覆盖全市', price: '2元', time: '06:00-22:00', eco: true },
            { city: '重庆', type: '长江索道', lines: '新华路-上新街', price: '30元往返', time: '07:30-22:00', eco: false },
            { city: '丽江', type: '公交', lines: '古城-玉龙雪山等', price: '2-5元', time: '07:00-19:00', eco: true },
            { city: '丽江', type: '出租车', lines: '起步价8元', price: '8元起', time: '24小时', eco: false },
            { city: '丽江', type: '包车', lines: '一日游包车', price: '300-500元/天', time: '需预约', eco: false }
        ]
    },

    /* ======================================== */
    /* 住宿数据：每个城市1-2家酒店                 */
    /* ======================================== */
    hotels: [
        { city: '成都', name: '成都香格里拉大酒店', level: '高端', price: 880, rating: 4.8, source: '携程', area: '锦江区', desc: '五星豪华，俯瞰锦江' },
        { city: '成都', name: '全季酒店（春熙路店）', level: '中端', price: 320, rating: 4.6, source: '携程', area: '锦江区', desc: '市中心，交通便利' },
        { city: '大理', name: '大理洱海天域英迪格酒店', level: '高端', price: 980, rating: 4.9, source: '携程', area: '洱海边', desc: '海景房，白族风格' },
        { city: '大理', name: '大理古城民宿', level: '经济', price: 150, rating: 4.5, source: '小红书', area: '古城内', desc: '白族院落，温馨舒适' },
        { city: '厦门', name: '厦门康莱德酒店', level: '高端', price: 1200, rating: 4.9, source: '携程', area: '思明区', desc: '地标酒店，海景无敌' },
        { city: '厦门', name: '鼓浪屿民宿', level: '中端', price: 380, rating: 4.6, source: '小红书', area: '鼓浪屿', desc: '老别墅改造，文艺范' },
        { city: '西安', name: '西安W酒店', level: '高端', price: 980, rating: 4.8, source: '携程', area: '曲江新区', desc: '潮流奢华，夜生活' },
        { city: '西安', name: '汉庭酒店（钟楼店）', level: '经济', price: 180, rating: 4.4, source: '携程', area: '碑林区', desc: '市中心，步行到钟楼' },
        { city: '长沙', name: '长沙瑞吉酒店', level: '高端', price: 1100, rating: 4.9, source: '携程', area: '雨花区', desc: '顶级奢华，服务一流' },
        { city: '长沙', name: '如家酒店（五一广场店）', level: '经济', price: 160, rating: 4.3, source: '携程', area: '芙蓉区', desc: '市中心，近地铁' },
        { city: '北京', name: '北京饭店诺金', level: '高端', price: 1500, rating: 4.9, source: '携程', area: '东城区', desc: '百年老店，长安街旁' },
        { city: '北京', name: '锦江之星（天安门店）', level: '经济', price: 280, rating: 4.5, source: '携程', area: '东城区', desc: '近天安门，性价比高' },
        { city: '上海', name: '上海半岛酒店', level: '高端', price: 2800, rating: 4.9, source: '携程', area: '黄浦区', desc: '外滩地标，江景房' },
        { city: '上海', name: '如家酒店（外滩店）', level: '经济', price: 320, rating: 4.4, source: '携程', area: '黄浦区', desc: '近外滩，出行方便' },
        { city: '杭州', name: '杭州西湖国宾馆', level: '高端', price: 1380, rating: 4.9, source: '携程', area: '西湖区', desc: '国宾级，西湖边' },
        { city: '杭州', name: '亚朵酒店（西湖店）', level: '中端', price: 420, rating: 4.7, source: '携程', area: '西湖区', desc: '近西湖，文艺风' },
        { city: '重庆', name: '重庆尼依格罗酒店', level: '高端', price: 1080, rating: 4.9, source: '携程', area: '渝中区', desc: 'IFS楼上，俯瞰全城' },
        { city: '重庆', name: '汉庭酒店（解放碑店）', level: '经济', price: 200, rating: 4.4, source: '携程', area: '渝中区', desc: '市中心，近洪崖洞' },
        { city: '丽江', name: '丽江悦榕庄', level: '高端', price: 2200, rating: 4.9, source: '携程', area: '玉龙县', desc: '奢华度假，雪山view' },
        { city: '丽江', name: '丽江古城客栈', level: '经济', price: 120, rating: 4.5, source: '小红书', area: '古城内', desc: '纳西院落，温馨亲切' }
    ],

    /* ======================================== */
    /* 智小程关键词词典                          */
    /* ======================================== */
    aiKeywords: {
        cities: ['成都', '大理', '厦门', '西安', '长沙', '北京', '上海', '杭州', '重庆', '丽江', '苏州', '青岛', '三亚', '南京', '桂林'],
        scenics: ['景点', '好玩', '去哪', '游览', '旅游', '参观', '游玩', '逛', '打卡', '值得去', '推荐', '看看'],
        foods: ['美食', '吃', '餐馆', '火锅', '小吃', '餐厅', '好吃', '特色', '探店', '味道'],
        weather: ['天气', '温度', '下雨', '适合吗', '热吗', '冷吗', '下雨吗', '预报', '穿什么'],
        transport: ['交通', '高铁', '飞机', '怎么去', '路线', '怎么走', '票价', '时间', '车票', '火车'],
        trip: ['行程', '安排', '规划', '我的', '计划', '路线', '攻略'],
        intent: ['适合带娃', '亲子', '情侣', '周末', '一日游', '性价比', '省钱', '避坑', '推荐', '必去']
    },

    /* ======================================== */
    /* 快捷问题                                  */
    /* ======================================== */
    quickQuestions: [
        { icon: '🏯', label: '景点推荐', question: '推荐景点' },
        { icon: '🍽️', label: '美食推荐', question: '推荐美食' },
        { icon: '🌤️', label: '天气查询', question: '今天天气' },
        { icon: '🚄', label: '交通方案', question: '交通方案' },
        { icon: '✨', label: '行程建议', question: '我的行程' }
    ],

    /* ======================================== */
    /* 美食分类                                  */
    /* ======================================== */
    foodCategories: ['全部', '火锅', '川菜', '小吃', '海鲜', '饮品', '面馆', '云南菜', '陕菜', '湘菜', '京菜', '浙菜', '江浙菜', '烧烤', '亲子餐厅', '早餐', '夜宵'],

    /* ======================================== */
    /* 景点类型                                  */
    /* ======================================== */
    scenicTypes: ['全部', '户外', '室内'],
    scenicCategories: ['全部', '自然', '人文'],

    /* ======================================== */
    /* 数据查询方法                              */
    /* ======================================== */

    /**
     * 根据城市名获取景点列表
     * @param {string} cityName - 城市名
     * @returns {Array} 景点数组
     */
    getScenicsByCity(cityName) {
        return this.scenics.filter(s => s.city === cityName);
    },

    /**
     * 根据城市名获取美食列表
     * @param {string} cityName - 城市名
     * @returns {Array} 美食数组
     */
    getFoodsByCity(cityName) {
        return this.foods.filter(f => f.city === cityName);
    },

    /**
     * 根据城市名获取天气
     * @param {string} cityName - 城市名
     * @returns {object} 天气数据
     */
    getWeather(cityName) {
        return this.weather[cityName] || null;
    },

    /**
     * 根据城市名获取行程方案
     * @param {string} cityName - 城市名
     * @returns {Array} 行程方案数组
     */
    getTripPlans(cityName) {
        return this.tripPlans[cityName] || [];
    },

    /**
     * 根据城市名获取酒店
     * @param {string} cityName - 城市名
     * @returns {Array} 酒店数组
     */
    getHotels(cityName) {
        return this.hotels.filter(h => h.city === cityName);
    },

    /**
     * 根据出发地和目的地获取交通票务
     * @param {string} from - 出发地
     * @param {string} to - 目的地
     * @returns {Array} 票务数组
     */
    getTickets(from, to) {
        return this.tickets.intercity.filter(t => t.from === from && t.to === to);
    },

    /**
     * 根据城市名获取市内交通
     * @param {string} cityName - 城市名
     * @returns {Array} 市内交通数组
     */
    getCityTransport(cityName) {
        return this.tickets.cityTransport.filter(t => t.city === cityName);
    },

    /**
     * 搜索景点（支持城市名和景点名）
     * @param {string} keyword - 搜索关键词
     * @returns {Array} 匹配的景点数组
     */
    searchScenics(keyword) {
        if (!keyword) return [];
        return this.scenics.filter(s =>
            s.city.includes(keyword) ||
            s.name.includes(keyword) ||
            s.desc.includes(keyword)
        );
    },

    /**
     * 搜索美食
     * @param {string} keyword - 搜索关键词
     * @returns {Array} 匹配的美食数组
     */
    searchFoods(keyword) {
        if (!keyword) return [];
        return this.foods.filter(f =>
            f.name.includes(keyword) ||
            f.cuisine.includes(keyword) ||
            f.desc.includes(keyword)
        );
    }
};
