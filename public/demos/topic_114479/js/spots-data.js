// 山西省红色景点数据库
// 城市名称映射（英文键 -> 中文名称）
const cityNames = {
    'taiyuan': '太原市',
    'datong': '大同市',
    'yangquan': '阳泉市',
    'changzhi': '长治市',
    'jincheng': '晋城市',
    'shuozhou': '朔州市',
    'jinzhong': '晋中市',
    'yuncheng': '运城市',
    'xinzhou': '忻州市',
    'linfen': '临汾市',
    'lvliang': '吕梁市'
};

// 出发地坐标配置（用户自定义输入地址，不再使用预设坐标）
const startPoints = {};

// 分类配置
const categoryConfig = {
    'museum':   { label: '纪念馆/博物馆',  color: '#c41e3a', icon: 'fa-building',  gradient: 'linear-gradient(135deg, #e63946, #8b0000)' },
    'battle':   { label: '战役遗址',      color: '#e67e22', icon: 'fa-flag',      gradient: 'linear-gradient(135deg, #f39c12, #d35400)' },
    'memorial': { label: '纪念碑/纪念地',  color: '#8e44ad', icon: 'fa-star',      gradient: 'linear-gradient(135deg, #9b59b6, #6c3483)' },
    'former':   { label: '故居/旧址',      color: '#2980b9', icon: 'fa-home',      gradient: 'linear-gradient(135deg, #3498db, #1f618d)' }
};

// 山西省红色景点数据库
const ShanxiRedSpots = {
    taiyuan: [
        {id:'ty-001',name:'彭真生平暨中共太原支部旧址纪念馆',category:'former',subCategory:'故居旧址',coordinates:[112.549, 37.87],address:'太原市文瀛公园内',phone:'0351-4223887',openingHours:'9:00-17:00（周一闭馆）',description:'彭真生平暨中共太原支部旧址纪念馆是为纪念中国共产党早期领导人彭真同志而建立的专题纪念馆，馆内陈列大量珍贵历史文物与文献资料。',rating:4.5,reviewCount:567},
        {id:'ty-002',name:'高君宇故居纪念馆',category:'former',subCategory:'故居旧址',coordinates:[112.283, 37.953],address:'太原市娄烦县静游镇',phone:'0351-5326889',openingHours:'9:00-17:00（周一闭馆）',description:'高君宇是中国共产党早期领导人之一，五四运动学生领袖之一，故居纪念馆展示了他的生平事迹。',rating:4.4,reviewCount:345},
        {id:'ty-003',name:'双塔寺革命烈士陵园',category:'memorial',subCategory:'纪念地',coordinates:[112.569, 37.878],address:'太原市迎泽区双塔寺街',phone:'0351-4396789',openingHours:'全天开放',description:'双塔寺革命烈士陵园是为纪念在解放太原战役中牺牲的革命烈士而建立的纪念设施。',rating:4.7,reviewCount:789},
        {id:'ty-004',name:'太原解放纪念馆',category:'museum',subCategory:'纪念馆',coordinates:[112.562, 37.87],address:'太原市迎泽大街',phone:'0351-4045678',openingHours:'9:00-17:00（周一闭馆）',description:'太原解放纪念馆展示了1949年解放太原战役的历史过程，馆内陈列大量珍贵历史文物。',rating:4.6,reviewCount:678},
        {id:'ty-005',name:'山西国民师范旧址纪念馆',category:'former',subCategory:'故居旧址',coordinates:[112.578, 37.885],address:'太原市五一路',phone:'0351-3167890',openingHours:'9:00-17:00（周一闭馆）',description:'山西国民师范旧址是中国共产党早期革命活动的重要阵地，被誉为"山西革命熔炉"。',rating:4.4,reviewCount:456},
    ],
    datong: [
        {id:'dt-001',name:'大同煤矿万人坑遗址纪念馆',category:'memorial',subCategory:'纪念馆',coordinates:[113.201, 40.076],address:'山西省大同市南郊区煤峪口矿',phone:'0352-7012345',openingHours:'9:00-17:00（周一闭馆）',description:'大同煤矿万人坑遗址纪念馆是日本侵略者掠夺大同煤矿资源、残害中国矿工的历史见证。',rating:4.9,reviewCount:1567},
        {id:'dt-002',name:'灵丘县平型关战役遗址',category:'battle',subCategory:'战役遗址',coordinates:[114.235, 39.459],address:'山西省灵丘县白崖台乡',phone:'0352-8523456',openingHours:'全天开放',description:'平型关战役是八路军出师抗日的第一个大胜仗，打破了日军不可战胜的神话。',rating:4.8,reviewCount:2134},
        {id:'dt-003',name:'阳高县大泉山红色教育基地',category:'memorial',subCategory:'教育基地',coordinates:[114.027, 40.389],address:'山西省阳高县大泉山村',phone:'0352-6789012',openingHours:'全天开放',description:'大泉山红色教育基地以毛泽东同志批示的大泉山治山治水事迹为主题。',rating:4.3,reviewCount:456},
    ],
    yangquan: [
        {id:'yq-001',name:'百团大战纪念馆',category:'museum',subCategory:'纪念馆',coordinates:[113.58, 37.856],address:'山西省阳泉市狮脑山',phone:'0353-2023456',openingHours:'9:00-17:00（周一闭馆）',description:'百团大战纪念馆位于百团大战主战场之一的狮脑山上，全面展示了百团大战的辉煌战果。',rating:4.7,reviewCount:1876},
        {id:'yq-002',name:'中共创建第一城——阳泉',category:'memorial',subCategory:'纪念地',coordinates:[113.58, 37.856],address:'山西省阳泉市城区',phone:'0353-8888888',openingHours:'全天开放',description:'阳泉是中共创建的第一座城市，1947年5月2日解放后在此建立了人民政权。',rating:4.5,reviewCount:678},
        {id:'yq-003',name:'七亘村伏击战遗址',category:'battle',subCategory:'战役遗址',coordinates:[113.785, 37.982],address:'山西省平定县七亘村',phone:'0353-5678901',openingHours:'全天开放',description:'七亘村伏击战是抗日战争时期八路军129师在此伏击日军的著名战役，刘伯承师长创造了我军"重叠待伏"战术典范。',rating:4.4,reviewCount:543},
    ],
    changzhi: [
        {id:'cz-001',name:'八路军太行纪念馆',category:'museum',subCategory:'纪念馆',coordinates:[112.432, 36.495],address:'山西省武乡县城太行街83号',phone:'0355-6437566',openingHours:'8:30-17:30（全年开放）',description:'八路军太行纪念馆是全国唯一一座全面反映八路军抗战史实的大型革命军事博物馆。',rating:5.0,reviewCount:3456},
        {id:'cz-002',name:'黄崖洞兵工厂旧址',category:'battle',subCategory:'工业遗址',coordinates:[113.025, 36.823],address:'山西省黎城县黄崖洞镇水峧村',phone:'0355-6567890',openingHours:'8:30-17:30（全年开放）',description:'黄崖洞兵工厂是抗日战争时期八路军总部建立的重要兵工生产基地，被誉为"人民军工摇篮"。',rating:4.8,reviewCount:2345},
        {id:'cz-003',name:'上党战役纪念馆',category:'museum',subCategory:'纪念馆',coordinates:[112.866, 36.195],address:'山西省长治市城区',phone:'0355-3012345',openingHours:'9:00-17:00（周一闭馆）',description:'上党战役纪念馆全面展示了1945年抗战胜利后国共两党在山西上党地区进行的重要战役。',rating:4.6,reviewCount:876},
        {id:'cz-004',name:'八路军总部砖壁旧址',category:'former',subCategory:'故居旧址',coordinates:[112.389, 36.478],address:'山西省武乡县砖壁村',phone:'0355-6456789',openingHours:'9:00-17:00（周一闭馆）',description:'砖壁村是八路军总部旧址所在地，彭德怀、刘伯承、邓小平等老一辈革命家曾在此工作和战斗过。',rating:4.7,reviewCount:1234},
        {id:'cz-005',name:'神头岭伏击战遗址',category:'battle',subCategory:'战役遗址',coordinates:[112.856, 36.289],address:'山西省潞城区神头岭',phone:'0355-6789012',openingHours:'全天开放',description:'神头岭伏击战是抗日战争时期八路军129师的著名伏击战，歼敌1500余人。',rating:4.5,reviewCount:567},
    ],
    jincheng: [
        {id:'jc-001',name:'町店战斗纪念园',category:'battle',subCategory:'战役遗址',coordinates:[112.426, 35.506],address:'山西省阳城县町店镇',phone:'0356-4234567',openingHours:'全天开放',description:'町店战斗是抗日战争时期八路军115师在此对日军进行的伏击战，歼敌800余人。',rating:4.4,reviewCount:654},
        {id:'jc-002',name:'太行太岳烈士陵园',category:'memorial',subCategory:'纪念地',coordinates:[112.851, 35.49],address:'山西省晋城市城区',phone:'0356-3034567',openingHours:'全天开放',description:'太行太岳烈士陵园是为纪念在太行、太岳地区牺牲的革命烈士而建立的纪念设施。',rating:4.6,reviewCount:789},
        {id:'jc-003',name:'孙文龙纪念馆',category:'museum',subCategory:'纪念馆',coordinates:[112.089, 35.802],address:'山西省阳城县河北镇孤堆底村',phone:'0356-4789012',openingHours:'9:00-17:00（周一闭馆）',description:'孙文龙纪念馆是为了纪念这位被誉为"山西焦裕禄"的好书记而建立的。',rating:4.5,reviewCount:456},
    ],
    shuozhou: [
        {id:'sz-001',name:'塞北革命烈士陵园',category:'memorial',subCategory:'纪念地',coordinates:[112.433, 39.331],address:'山西省朔州市朔城区',phone:'0349-2023456',openingHours:'全天开放',description:'塞北革命烈士陵园是为纪念在塞北地区牺牲的革命烈士而建立的纪念设施。',rating:4.5,reviewCount:567},
        {id:'sz-002',name:'平鲁区李林烈士陵园',category:'memorial',subCategory:'纪念地',coordinates:[112.289, 39.502],address:'山西省朔州市平鲁区',phone:'0349-3023456',openingHours:'全天开放',description:'李林烈士陵园纪念的是抗日女英雄李林，她是中国共产党早期优秀党员。',rating:4.6,reviewCount:678},
    ],
    jinzhong: [
        {id:'jz-001',name:'左权将军烈士陵园',category:'memorial',subCategory:'纪念地',coordinates:[113.375, 37.082],address:'山西省左权县',phone:'0354-8623456',openingHours:'全天开放',description:'左权将军烈士陵园是为了纪念在抗日战争中牺牲的八路军副参谋长左权将军而建立的。',rating:4.7,reviewCount:1234},
        {id:'jz-002',name:'麻田八路军总部纪念馆',category:'museum',subCategory:'纪念馆',coordinates:[113.352, 37.065],address:'山西省左权县麻田镇',phone:'0354-8856789',openingHours:'9:00-17:00（周一闭馆）',description:'麻田八路军总部纪念馆位于左权县麻田镇，是抗日战争时期八路军总部所在地。',rating:4.8,reviewCount:1567},
        {id:'jz-003',name:'大寨展览馆',category:'museum',subCategory:'纪念馆',coordinates:[113.111, 37.656],address:'山西省昔阳县大寨村',phone:'0354-4321098',openingHours:'8:30-17:30（全年开放）',description:'大寨展览馆展示了"农业学大寨"时期的历史，以及大寨人民自力更生、艰苦奋斗建设家园的光辉历程。',rating:4.5,reviewCount:2345},
    ],
    yuncheng: [
        {id:'yc-001',name:'运城盐湖革命烈士陵园',category:'memorial',subCategory:'纪念地',coordinates:[111.007, 35.026],address:'山西省运城市盐湖区',phone:'0359-2023456',openingHours:'全天开放',description:'运城盐湖革命烈士陵园是为了纪念在解放运城和历次革命斗争中牺牲的革命烈士而建立的纪念设施。',rating:4.4,reviewCount:567},
        {id:'yc-002',name:'河津抗日民主政府旧址',category:'former',subCategory:'故居旧址',coordinates:[110.712, 35.602],address:'山西省河津市区',phone:'0359-5023456',openingHours:'9:00-17:00（周一闭馆）',description:'河津抗日民主政府旧址是抗日战争时期中国共产党在河津地区建立的抗日民主政权所在地。',rating:4.3,reviewCount:345},
    ],
    xinzhou: [
        {id:'xz-001',name:'徐向前元帅故居纪念馆',category:'former',subCategory:'故居旧址',coordinates:[112.745, 38.403],address:'山西省五台县永安村',phone:'0350-6523456',openingHours:'9:00-17:00（周一闭馆）',description:'徐向前元帅故居纪念馆展示了徐向前元帅的生平事迹和革命历程。',rating:4.7,reviewCount:1234},
        {id:'xz-002',name:'晋察冀军区司令部旧址',category:'former',subCategory:'故居旧址',coordinates:[112.699, 38.415],address:'山西省五台县金岗库村',phone:'0350-6789012',openingHours:'9:00-17:00（周一闭馆）',description:'晋察冀军区司令部旧址是抗日战争时期八路军晋察冀军区司令部所在地。',rating:4.6,reviewCount:876},
        {id:'xz-003',name:'忻口战役遗址',category:'battle',subCategory:'战役遗址',coordinates:[112.896, 38.402],address:'山西省忻州市忻口村',phone:'0350-8123456',openingHours:'全天开放',description:'忻口战役是抗日战争时期中国军队在山西忻口地区对日军进行的一次大规模防御战。',rating:4.5,reviewCount:987},
        {id:'xz-004',name:'白求恩纪念馆',category:'museum',subCategory:'纪念馆',coordinates:[112.756, 38.422],address:'山西省五台县松岩口村',phone:'0350-9234567',openingHours:'9:00-17:00（周一闭馆）',description:'白求恩纪念馆是为了纪念加拿大国际主义战士白求恩大夫而建立的。',rating:4.8,reviewCount:1567},
    ],
    linfen: [
        {id:'lf-001',name:'永和县红军东征纪念馆',category:'museum',subCategory:'纪念馆',coordinates:[110.625, 36.329],address:'山西省永和县城',phone:'0357-7523456',openingHours:'9:00-17:00（周一闭馆）',description:'红军东征纪念馆展示了1936年红军东征山西的历史过程。',rating:4.5,reviewCount:678},
        {id:'lf-002',name:'临汾革命烈士陵园',category:'memorial',subCategory:'纪念地',coordinates:[111.519, 36.088],address:'山西省临汾市尧都区',phone:'0357-2023456',openingHours:'全天开放',description:'临汾革命烈士陵园是为了纪念在临汾地区牺牲的革命烈士而建立的纪念设施。',rating:4.4,reviewCount:567},
        {id:'lf-003',name:'侯马彭真故居',category:'former',subCategory:'故居旧址',coordinates:[111.372, 35.619],address:'山西省侯马市',phone:'0357-4223456',openingHours:'9:00-17:00（周一闭馆）',description:'彭真故居是中国共产党早期领导人彭真同志的出生和成长地。',rating:4.6,reviewCount:789},
    ],
    lvliang: [
        {id:'ll-001',name:'晋绥边区革命纪念馆',category:'museum',subCategory:'纪念馆',coordinates:[111.142, 38.468],address:'山西省兴县蔡家崖村',phone:'0358-6322678',openingHours:'9:00-17:00（周一闭馆）',description:'晋绥边区革命纪念馆位于蔡家崖村，是抗日战争时期晋绥边区政府的所在地。',rating:4.9,reviewCount:1567},
        {id:'ll-002',name:'晋绥解放区烈士陵园',category:'memorial',subCategory:'纪念地',coordinates:[111.142, 38.468],address:'山西省兴县',phone:'0358-6323456',openingHours:'全天开放',description:'晋绥解放区烈士陵园是为了纪念在晋绥解放区牺牲的革命烈士而建立的纪念设施。',rating:4.6,reviewCount:987},
        {id:'ll-003',name:'刘胡兰纪念馆',category:'museum',subCategory:'纪念馆',coordinates:[111.642, 37.157],address:'山西省文水县云周西村',phone:'0358-3023456',openingHours:'8:30-17:30（全年开放）',description:'刘胡兰纪念馆是为了纪念在解放战争中英勇就义的少年英雄刘胡兰而建立的。',rating:4.9,reviewCount:2345},
        {id:'ll-004',name:'四八烈士纪念馆',category:'memorial',subCategory:'纪念地',coordinates:[111.234, 37.856],address:'山西省兴县',phone:'0358-6327890',openingHours:'9:00-17:00（周一闭馆）',description:'四八烈士陵园是为了纪念1946年因飞机失事遇难的革命烈士而建立的纪念设施。',rating:4.7,reviewCount:876},
        {id:'ll-005',name:'红三十军军部旧址',category:'former',subCategory:'故居旧址',coordinates:[111.089, 37.423],address:'山西省中阳县',phone:'0358-5023456',openingHours:'9:00-17:00（周一闭馆）',description:'红三十军是中国工农红军第三十军军部所在地，见证了红军在吕梁地区的革命活动。',rating:4.4,reviewCount:456},
        {id:'ll-006',name:'红军东征纪念馆',category:'museum',subCategory:'纪念馆',coordinates:[111.456, 37.289],address:'山西省交口县',phone:'0358-5423456',openingHours:'9:00-17:00（周一闭馆）',description:'红军东征纪念馆展示了1936年红军东征山西的历史。',rating:4.5,reviewCount:567},
    ],
};
