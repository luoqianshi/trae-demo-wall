var CaseStudies = (function() {
    'use strict';

    var CASES = [
        {
            id: 'case-001',
            title: '60㎡小户型北欧风，8万装出大空间感',
            area: 60,
            layout: '一室一厅',
            style: '北欧风',
            totalBudget: 80000,
            actualCost: 78000,
            duration: 60,
            delayDays: 0,
            city: '成都',
            ownerTag: '单身白领',
            summary: '60㎡小户型，通过开放式厨房、浅色家具和镜面设计，营造出80㎡的视觉效果。预算控制精准，几乎没有超支。',
            budgetBreakdown: {
                construction: { budget: 28000, actual: 27000 },
                mainMaterials: { budget: 30000, actual: 29500 },
                customFurniture: { budget: 10000, actual: 10500 },
                softDecoration: { budget: 8000, actual: 7000 },
                reserve: { budget: 4000, actual: 4000 }
            },
            pitfalls: [
                '厨房墙砖选了光面的，油烟一沾上就看得很清楚，难打理',
                '衣柜做的平开门，床头柜挡住了一个门，拿衣服不方便',
                '马桶坑距量错了，买回来装不上，又换了一次',
                '吊顶太低了，客厅显得有点压抑'
            ],
            highlights: [
                '开放式厨房让空间显大了20㎡，朋友来都说不像60㎡',
                '定制榻榻米床，底下收纳换季被褥，省了一个衣柜',
                '厨房用了高低台，洗菜切菜不弯腰，炒菜不架胳膊',
                '入户玄关柜做了换鞋凳，老人小孩换鞋都方便'
            ],
            regrets: [
                '应该做嵌入式冰箱，突出一块有点丑',
                '卫生间没做干湿分离，每次洗完澡满地水',
                '插座还是留少了，沙发旁边只能用插排',
                '应该装个洗碗机，现在手洗太麻烦了'
            ]
        },
        {
            id: 'case-002',
            title: '80㎡两居室现代简约，15万性价比之选',
            area: 80,
            layout: '两室一厅',
            style: '现代简约',
            totalBudget: 150000,
            actualCost: 158000,
            duration: 75,
            delayDays: 5,
            city: '武汉',
            ownerTag: '新婚夫妇',
            summary: '80㎡两居室，现代简约风格，整体以黑白灰为主色调，搭配原木色家具，温馨又不失格调。稍微超预算8000元，主要是加了定制衣柜。',
            budgetBreakdown: {
                construction: { budget: 52000, actual: 54000 },
                mainMaterials: { budget: 55000, actual: 58000 },
                customFurniture: { budget: 20000, actual: 23000 },
                softDecoration: { budget: 15000, actual: 15000 },
                reserve: { budget: 8000, actual: 8000 }
            },
            pitfalls: [
                '装修公司报的低价套餐，后期增项加了2万',
                '瓷砖买多了，退的时候商家说不是整箱不能退',
                '地板安装师傅手艺差，缝隙不均匀，返工了一次',
                '乳胶漆调色翻车，上墙比色卡深了好几个度'
            ],
            highlights: [
                '餐边柜做了嵌入式直饮机，喝水太方便了',
                '主卧做了L型衣柜，收纳空间翻倍',
                '客厅无主灯设计，氛围感拉满',
                '阳台改造成小书房，多出一间房'
            ],
            regrets: [
                '应该选半包的，全包材料质量一般',
                '厨房插座留少了，小电器不够用',
                '后悔没装新风，雾霾天太难受',
                '卫生间应该装智能马桶，用了就回不去'
            ]
        },
        {
            id: 'case-003',
            title: '90㎡三居室日式原木风，20万温馨治愈',
            area: 90,
            layout: '三室一厅',
            style: '日式原木风',
            totalBudget: 200000,
            actualCost: 195000,
            duration: 90,
            delayDays: 0,
            city: '杭州',
            ownerTag: '三口之家',
            summary: '90㎡三居室，日式原木风，全屋白橡木地板+原木色家具，搭配米色软装，温馨治愈。工期准时，预算还省了5000元。',
            budgetBreakdown: {
                construction: { budget: 70000, actual: 68000 },
                mainMaterials: { budget: 70000, actual: 69000 },
                customFurniture: { budget: 30000, actual: 28000 },
                softDecoration: { budget: 20000, actual: 20000 },
                reserve: { budget: 10000, actual: 10000 }
            },
            pitfalls: [
                '榻榻米做了地台，底下潮得很，还不好打扫',
                '厨房选了纯白台面，酱油滴上去就渗色了',
                '浴室柜做了岩板一体盆，下水慢还容易堵',
                '窗帘选了米白色，透得很，早上亮得睡不着'
            ],
            highlights: [
                '全屋通铺木地板，光脚踩太舒服了',
                '儿童房做了上下铺，还带滑梯，孩子超喜欢',
                '客厅背景墙做了整面书架，藏书500本',
                '玄关做了下沉式设计，换鞋区不脏里面'
            ],
            regrets: [
                '榻榻米应该做成箱体的，地台太鸡肋',
                '厨房台面应该选石英石的，岩板中看不中用',
                '应该装中央空调，风管机噪音有点大',
                '卫生间小了，应该把洗手台移到外面'
            ]
        },
        {
            id: 'case-004',
            title: '110㎡三居室新中式，30万典雅大气',
            area: 110,
            layout: '三室两厅',
            style: '新中式',
            totalBudget: 300000,
            actualCost: 315000,
            duration: 100,
            delayDays: 10,
            city: '西安',
            ownerTag: '中年夫妻',
            summary: '110㎡三居室，新中式风格，胡桃木色家具搭配水墨画背景墙，典雅大气。超预算1.5万，主要是定制了更多实木家具。',
            budgetBreakdown: {
                construction: { budget: 100000, actual: 105000 },
                mainMaterials: { budget: 100000, actual: 105000 },
                customFurniture: { budget: 50000, actual: 55000 },
                softDecoration: { budget: 35000, actual: 35000 },
                reserve: { budget: 15000, actual: 15000 }
            },
            pitfalls: [
                '实木家具色差太大，和样品差了好几个色号',
                '吊顶做了复杂造型，积灰难打扫',
                '卫生间装了木桶浴缸，用了两次就闲置了',
                '壁纸选了花纹太密的，看久了眼晕'
            ],
            highlights: [
                '客厅红木沙发，越坐越舒服，还能传家',
                '茶室做了榻榻米+茶桌，朋友来喝茶太有面',
                '主卧做了步入式衣帽间，老婆的衣服都放下了',
                '厨房装了集成灶，油烟吸得干干净净'
            ],
            regrets: [
                '应该选简约新中式，太复杂的造型容易过时',
                '浴缸真的没必要，淋浴更实用',
                '应该多留一些储物空间，东西越来越多',
                '后悔没装地暖，冬天空调太干了'
            ]
        },
        {
            id: 'case-005',
            title: '120㎡四居室轻奢风，40万品质之选',
            area: 120,
            layout: '四室两厅',
            style: '轻奢风',
            totalBudget: 400000,
            actualCost: 420000,
            duration: 120,
            delayDays: 15,
            city: '上海',
            ownerTag: '二胎家庭',
            summary: '120㎡四居室，轻奢风格，金属线条+大理石纹+丝绒面料，精致有质感。超预算2万，主要是加了很多智能化设备。',
            budgetBreakdown: {
                construction: { budget: 140000, actual: 145000 },
                mainMaterials: { budget: 130000, actual: 140000 },
                customFurniture: { budget: 60000, actual: 65000 },
                softDecoration: { budget: 50000, actual: 50000 },
                reserve: { budget: 20000, actual: 20000 }
            },
            pitfalls: [
                '岩板背景墙安装时碎了一块，补货等了半个月',
                '水晶吊灯太难擦了，一层灰擦了一上午',
                '开放式书架中看不中用，打扫卫生要疯',
                '浅色沙发太容易脏了，孩子乱画了一次就废了'
            ],
            highlights: [
                '全屋智能家居，语音控制太方便了',
                '双开门冰箱+蒸烤箱一体，厨房利用率超高',
                '主卧带卫生间+衣帽间，酒店式体验',
                '儿童房做了书桌+衣柜一体，学习收纳两不误'
            ],
            regrets: [
                '应该选深色沙发，浅色太不耐脏',
                '开放式书架应该加玻璃门，不然打扫太累',
                '后悔没装中央净水，水垢太严重',
                '应该多留一些储物空间，有娃后东西太多'
            ]
        },
        {
            id: 'case-006',
            title: '140㎡大平层极简风，50万高级感拉满',
            area: 140,
            layout: '四室两厅两卫',
            style: '极简风',
            totalBudget: 500000,
            actualCost: 520000,
            duration: 150,
            delayDays: 20,
            city: '深圳',
            ownerTag: '企业高管',
            summary: '140㎡大平层，极简主义风格，全屋无主灯、隐形门、嵌入式收纳，高级感拉满。超预算2万，主要是微水泥工艺复杂。',
            budgetBreakdown: {
                construction: { budget: 180000, actual: 190000 },
                mainMaterials: { budget: 160000, actual: 170000 },
                customFurniture: { budget: 80000, actual: 85000 },
                softDecoration: { budget: 55000, actual: 55000 },
                reserve: { budget: 25000, actual: 20000 }
            },
            pitfalls: [
                '微水泥开裂了，补了好几次还是有痕迹',
                '隐形门用久了会变形，开关不如普通门顺畅',
                '无主灯设计施工复杂，吊顶高度不够差点装不了',
                '定制衣柜周期太长，等了两个月才装上'
            ],
            highlights: [
                '客餐厅一体化，空间感超强，朋友来都惊呆了',
                '整面墙的嵌入式收纳，杂物全藏起来了',
                '主卧套间设计，书房+卧室+卫生间，私密性超好',
                '阳台落地窗+休闲区，看风景太惬意了'
            ],
            regrets: [
                '微水泥真的太娇贵了，一碰一个印',
                '应该多装几个主灯，全靠无主灯还是不够亮',
                '开放式厨房还是有点油烟，应该加个推拉门',
                '后悔没装电梯间挂钩，买菜回来放东西不方便'
            ]
        },
        {
            id: 'case-007',
            title: '160㎡叠墅美式复古风，60万复刻电影感',
            area: 160,
            layout: '四室三厅三卫',
            style: '美式复古',
            totalBudget: 600000,
            actualCost: 630000,
            duration: 180,
            delayDays: 30,
            city: '北京',
            ownerTag: '三代同堂',
            summary: '160㎡叠墅，美式复古风格，护墙板+仿古砖+铜质灯具，像走进了老电影。超预算3万，主要是楼梯改造花了不少钱。',
            budgetBreakdown: {
                construction: { budget: 220000, actual: 235000 },
                mainMaterials: { budget: 200000, actual: 210000 },
                customFurniture: { budget: 100000, actual: 105000 },
                softDecoration: { budget: 55000, actual: 60000 },
                reserve: { budget: 25000, actual: 20000 }
            },
            pitfalls: [
                '护墙板太容易受潮了，梅雨季节发霉了',
                '仿古砖缝隙大，美缝做了两次才做好',
                '楼梯踏步太陡了，老人上下楼不方便',
                '铜质灯具氧化变色，要经常擦'
            ],
            highlights: [
                '挑高客厅+水晶吊灯，一进门就很震撼',
                '美式厨房中岛台，做饭聚会两不误',
                '地下室改造成家庭影院，周末看电影太爽',
                '小院做了花架+水景，喝茶赏花惬意得很'
            ],
            regrets: [
                '护墙板应该选防潮的，不然太麻烦',
                '楼梯应该做缓一点，有老人小孩要注意',
                '应该装电梯，上下楼搬东西太累',
                '地下室防水没做好，雨季有点潮'
            ]
        },
        {
            id: 'case-008',
            title: '80㎡老破小改造，12万秒变ins风',
            area: 80,
            layout: '两室一厅',
            style: 'ins风',
            totalBudget: 120000,
            actualCost: 125000,
            duration: 60,
            delayDays: 3,
            city: '广州',
            ownerTag: '租房转买房',
            summary: '80㎡老破小，原来的装修惨不忍睹，花12万改造后秒变ins风网红家。拆改花了不少钱，但效果超预期。',
            budgetBreakdown: {
                construction: { budget: 45000, actual: 48000 },
                mainMaterials: { budget: 40000, actual: 42000 },
                customFurniture: { budget: 15000, actual: 15000 },
                softDecoration: { budget: 12000, actual: 12000 },
                reserve: { budget: 8000, actual: 8000 }
            },
            pitfalls: [
                '老房子水管全锈了，全部更换花了不少钱',
                '墙体空鼓严重，铲掉重做又加了预算',
                '楼板太薄，装吊顶时打穿了楼上的水管',
                '电路老化严重，全部重新布线超预算了'
            ],
            highlights: [
                '打掉客厅和阳台之间的墙，空间大了一倍',
                '厨房改成开放式，显大又通透',
                '卫生间做了干湿分离，早上不用抢',
                '主卧做了飘窗柜，多出一平米储物空间'
            ],
            regrets: [
                '应该做全屋重新布线，老线路还是有点隐患',
                '应该加隔音棉，老房子隔音太差了',
                '后悔没换窗户，马路边太吵',
                '应该装地暖，老房子暖气不热'
            ]
        }
    ];

    function getAllCases() {
        return CASES.slice();
    }

    function getCaseById(id) {
        if (!id) return null;
        for (var i = 0; i < CASES.length; i++) {
            if (CASES[i].id === id) {
                return CASES[i];
            }
        }
        return null;
    }

    function filterCases(filters) {
        if (!filters) return CASES.slice();
        var result = [];
        
        for (var i = 0; i < CASES.length; i++) {
            var item = CASES[i];
            var match = true;
            
            if (filters.minArea && item.area < filters.minArea) {
                match = false;
            }
            if (filters.maxArea && item.area > filters.maxArea) {
                match = false;
            }
            if (filters.minBudget && item.totalBudget < filters.minBudget) {
                match = false;
            }
            if (filters.maxBudget && item.totalBudget > filters.maxBudget) {
                match = false;
            }
            if (filters.style && item.style !== filters.style) {
                match = false;
            }
            if (filters.layout && item.layout !== filters.layout) {
                match = false;
            }
            if (filters.city && item.city !== filters.city) {
                match = false;
            }
            
            if (match) {
                result.push(item);
            }
        }
        
        return result;
    }

    function getCaseCount() {
        return CASES.length;
    }

    function getStyles() {
        var styles = [];
        var styleMap = {};
        for (var i = 0; i < CASES.length; i++) {
            var style = CASES[i].style;
            if (!styleMap[style]) {
                styleMap[style] = true;
                styles.push(style);
            }
        }
        return styles;
    }

    function getLayouts() {
        var layouts = [];
        var layoutMap = {};
        for (var i = 0; i < CASES.length; i++) {
            var layout = CASES[i].layout;
            if (!layoutMap[layout]) {
                layoutMap[layout] = true;
                layouts.push(layout);
            }
        }
        return layouts;
    }

    function getCities() {
        var cities = [];
        var cityMap = {};
        for (var i = 0; i < CASES.length; i++) {
            var city = CASES[i].city;
            if (!cityMap[city]) {
                cityMap[city] = true;
                cities.push(city);
            }
        }
        return cities;
    }

    return {
        getAllCases: getAllCases,
        getCaseById: getCaseById,
        filterCases: filterCases,
        getCaseCount: getCaseCount,
        getStyles: getStyles,
        getLayouts: getLayouts,
        getCities: getCities
    };
})();
