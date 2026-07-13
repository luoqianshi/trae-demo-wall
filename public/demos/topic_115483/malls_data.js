// MallInsight 商场数据
// 6个标杆商场 + 13个扩展商场

const MALLS_DATA = [
    // ===== 6个标杆商场 =====
    {
        id: 20, name: '成都远洋太古里', short: '太古里', city: '成都', district: '锦江区',
        type: '特色街区', brand: '太古', area: 11.4, openedYear: 2015, dailyVisitors: 8,
        publicRating: 5, designerRating: 5, operatorRating: 4,
        lat: 30.6535, lng: 104.0817,
        tags: ['开放式街区', '历史建筑', '首店经济', '里巷', '快闪'],
        description: '成都远洋太古里毗邻大慈寺，是一座总楼面面积约11.4万平方米的开放式街区购物中心。融合历史建筑与现代零售空间，以"慢生活+快时尚"为定位，是成都城市商业名片。'
    },
    {
        id: 4, name: '北京SKP', short: 'SKP', city: '北京', district: '朝阳区',
        type: '高端', brand: 'SKP', area: 18, openedYear: 2007, dailyVisitors: 6,
        publicRating: 4, designerRating: 4, operatorRating: 5,
        lat: 39.9087, lng: 116.4633,
        tags: ['奢侈品', '高端百货', 'SKP-S', '会员体系', '单店销冠'],
        description: '北京SKP是中国销售额最高的百货商场，2020年起连续多年单店销售额全国第一。SKP-S区域以数字艺术空间重新定义高端零售体验，会员深度运营是核心竞争力。'
    },
    {
        id: 9, name: '上海新天地', short: '新天地', city: '上海', district: '黄浦区',
        type: '特色街区', brand: '新天地', area: 6, openedYear: 2001, dailyVisitors: 7,
        publicRating: 5, designerRating: 5, operatorRating: 4,
        lat: 31.2269, lng: 121.4747,
        tags: ['石库门', '历史街区', '时装周', '北里南里', '餐饮'],
        description: '上海新天地以石库门建筑为基础，融合现代商业元素，是中国城市更新经典案例。北里以餐饮酒吧为主，南里以零售为主，是上海时尚地标。'
    },
    {
        id: 16, name: '深圳万象天地', short: '万象天地', city: '深圳', district: '南山区',
        type: '综合型', brand: '华润', area: 23, openedYear: 2017, dailyVisitors: 9,
        publicRating: 5, designerRating: 4, operatorRating: 5,
        lat: 22.5340, lng: 113.9337,
        tags: ['首店经济', '华润万象', 'HAUS NOWHERE', '奇遇书局', 'MXTR街区'],
        description: '深圳万象天地是华润万象生活旗下标杆项目，以"街区+mall"空间形态呈现。首店占比38%，Gentle Monster全球最大店、Salomon SS级旗舰店等首店构成差异化护城河。'
    },
    {
        id: 3, name: '北京三里屯太古里', short: '太古里', city: '北京', district: '朝阳区',
        type: '特色街区', brand: '太古', area: 5.3, openedYear: 2008, dailyVisitors: 10,
        publicRating: 5, designerRating: 4, operatorRating: 4,
        lat: 39.9358, lng: 116.4551,
        tags: ['潮流地标', '开放式街区', '摩登派对', '品牌独栋', '首店'],
        description: '北京三里屯太古里是北京潮流文化发源地，分南区和北区。南区是初代潮流商业街区，北区以品牌独栋旗舰店为主。摩登派对已连续举办十届，是北京商业活动标杆。'
    },
    {
        id: 8, name: '上海前滩太古里', short: '前滩太古里', city: '上海', district: '浦东新区',
        type: '综合型', brand: '太古', area: 12, openedYear: 2021, dailyVisitors: 5,
        publicRating: 4, designerRating: 5, operatorRating: 4,
        lat: 31.1820, lng: 121.4656,
        tags: ['太古', '前滩', 'LUX OPEN', '天空秀场', '可持续发展'],
        description: '上海前滩太古里是太古地产在上海的第二个项目，以"自然主义"为设计理念，融合零售、 wellness和公共空间。LUX OPEN周年盛典串联VIP派对与体验周，是会员增长核心抓手。'
    },
    // ===== 扩展商场 =====
    {
        id: 1, name: '北京朝阳大悦城', short: '朝阳大悦城', city: '北京', district: '朝阳区',
        type: '综合型', brand: '大悦城', area: 23, openedYear: 2010, dailyVisitors: 12,
        publicRating: 4, designerRating: 3, operatorRating: 4,
        lat: 39.9243, lng: 116.5176,
        tags: ['大悦城', '青年潮流', '度嘉街区', '主题街区'],
        description: '北京朝阳大悦城是大悦城体系标杆项目，以青年潮流定位为核心，度嘉街区等主题空间持续迭代。'
    },
    {
        id: 6, name: '上海国金中心ifc商场', short: 'ifc', city: '上海', district: '浦东新区',
        type: '高端', brand: '新鸿基', area: 9, openedYear: 2009, dailyVisitors: 4,
        publicRating: 4, designerRating: 4, operatorRating: 5,
        lat: 31.2360, lng: 121.5010,
        tags: ['ifc', '陆家嘴', '奢侈品', '新鸿基'],
        description: '上海国金中心ifc商场位于陆家嘴金融区，是上海奢侈品零售标杆之一，租金坪效上海前三。'
    },
    {
        id: 11, name: '广州太古汇', short: '太古汇', city: '广州', district: '天河区',
        type: '高端', brand: '太古', area: 13.8, openedYear: 2011, dailyVisitors: 5,
        publicRating: 4, designerRating: 5, operatorRating: 4,
        lat: 23.1320, lng: 113.3246,
        tags: ['太古', '中庭设计', '阳台花园', '华南旗舰'],
        description: '广州太古汇是太古地产华南旗舰项目，中庭空间设计经典，阳台花园提供休憩空间。'
    },
    {
        id: 15, name: '深圳万象城', short: '万象城', city: '深圳', district: '罗湖区',
        type: '高端', brand: '华润', area: 18.8, openedYear: 2004, dailyVisitors: 7,
        publicRating: 4, designerRating: 3, operatorRating: 5,
        lat: 22.5376, lng: 114.1159,
        tags: ['华润', '奢侈品', '华南标杆', '坪效最高'],
        description: '深圳万象城是华润系华南标杆项目，奢侈品立面改造完成，坪效华南最高。'
    },
    {
        id: 21, name: '成都IFS', short: 'IFS', city: '成都', district: '锦江区',
        type: '高端', brand: '九龙仓', area: 7.6, openedYear: 2014, dailyVisitors: 8,
        publicRating: 4, designerRating: 4, operatorRating: 4,
        lat: 30.6571, lng: 104.0784,
        tags: ['九龙仓', '熊猫雕塑', '奢侈品', '顶层观景'],
        description: '成都IFS以隈研吾设计的熊猫雕塑为标志，是九龙仓西南旗舰项目，业绩领先。'
    },
    {
        id: 25, name: '杭州湖滨银泰in77', short: 'in77', city: '杭州', district: '上城区',
        type: '特色街区', brand: '银泰', area: 12, openedYear: 2005, dailyVisitors: 10,
        publicRating: 5, designerRating: 3, operatorRating: 4,
        lat: 30.2530, lng: 120.1610,
        tags: ['银泰', '西湖', '夜景', '连续街区'],
        description: '杭州湖滨银泰in77紧邻西湖，是银泰系客流最高项目，夜景打卡热门地点。'
    },
    {
        id: 26, name: '成都知美术馆', short: '知美术馆', city: '成都', district: '新津区',
        type: '艺术', brand: '', area: 3, openedYear: 2012, dailyVisitors: 0.5,
        publicRating: 4, designerRating: 5, operatorRating: 2,
        lat: 30.4100, lng: 103.8200,
        tags: ['隈研吾', '美术馆', '文化艺术', '茑屋书店'],
        description: '成都知美术馆由隈研吾设计，是文化艺术与商业融合的探索案例。'
    },
    {
        id: 34, name: '南京德基广场', short: '德基', city: '南京', district: '玄武区',
        type: '高端', brand: '德基', area: 16, openedYear: 2006, dailyVisitors: 8,
        publicRating: 4, designerRating: 4, operatorRating: 5,
        lat: 32.0479, lng: 118.7826,
        tags: ['德基', '美术馆', '南京销冠', '奢侈品'],
        description: '南京德基广场是南京销售额第一商场，内置德基美术馆，顶层观景台为特色。'
    },
    {
        id: 35, name: '苏州仁恒仓街', short: '仓街', city: '苏州', district: '姑苏区',
        type: '特色街区', brand: '仁恒', area: 14, openedYear: 2023, dailyVisitors: 3,
        publicRating: 4, designerRating: 4, operatorRating: 3,
        lat: 31.3060, lng: 120.6250,
        tags: ['仁恒', '云章公所', '历史建筑', '首店'],
        description: '苏州仁恒仓街是华润新一代产品线，融合云章公所历史建筑与现代商业，首店聚集。'
    },
    {
        id: 38, name: '武汉武商梦时代', short: '梦时代', city: '武汉', district: '武昌区',
        type: '综合型', brand: '武商', area: 80, openedYear: 2022, dailyVisitors: 15,
        publicRating: 4, designerRating: 2, operatorRating: 4,
        lat: 30.5430, lng: 114.3520,
        tags: ['武商', '超大规模', '华中旗舰', '动线挑战'],
        description: '武汉武商梦时代总建筑面积约80万平方米，是华中最大商业综合体，超大规模带来动线设计挑战。'
    },
    {
        id: 44, name: '北京八达岭奥莱', short: '八达岭奥莱', city: '北京', district: '昌平区',
        type: '奥莱', brand: '首创', area: 9, openedYear: 2015, dailyVisitors: 2,
        publicRating: 3, designerRating: 2, operatorRating: 3,
        lat: 40.3100, lng: 116.2200,
        tags: ['奥莱', '意式小镇', '折扣', '接驳车'],
        description: '北京八达岭奥莱是华北最大奥莱，意式小镇风格，二期扩建已开放。'
    },
    {
        id: 46, name: '西安SKP-S', short: 'SKP-S', city: '西安', district: '雁塔区',
        type: '高端', brand: 'SKP', area: 14, openedYear: 2021, dailyVisitors: 4,
        publicRating: 4, designerRating: 4, operatorRating: 4,
        lat: 34.2260, lng: 108.9520,
        tags: ['SKP', '西北旗舰', '奢侈品', '数字艺术'],
        description: '西安SKP-S延续北京SKP-S的数字艺术空间设计语言，是西北奢侈品销售第一商场。'
    },
    {
        id: 48, name: '西安大悦城', short: '大悦城', city: '西安', district: '雁塔区',
        type: '综合型', brand: '大悦城', area: 18, openedYear: 2018, dailyVisitors: 18,
        publicRating: 4, designerRating: 2, operatorRating: 4,
        lat: 34.2230, lng: 108.9480,
        tags: ['大悦城', '负一层美食', '西北第一', '动线问题'],
        description: '西安大悦城日均18万人次，是西北客流最高商场，负一层美食城升级后人气第一，但动线问题待改善。'
    }
];
