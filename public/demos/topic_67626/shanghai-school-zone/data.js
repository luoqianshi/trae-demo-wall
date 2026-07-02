// ========================================
// 上海学区数据库
// 包含各区域典型小区的学区对口信息
// 数据仅供演示参考，实际以教育局官方发布为准
// ========================================
const schoolDatabase = {
    // ==================== 浦东新区 ====================
    '仁恒滨江园': {
        district: '浦东新区', address: '浦东新区浦明路99弄', coordinates: [121.508211, 31.229795],
        street: '潍坊新村街道',
        kindergarten: { name: '仁恒幼儿园', level: 'A', type: '公办', address: '浦明路99弄', phone: '021-58888888' },
        primary: { name: '浦明师范学校附属小学', level: 'A', type: '公办', address: '浦东南路2166号', phone: '021-58886666', feature: '浦东新区重点小学' },
        middle: { name: '洋泾菊园实验学校', level: 'A', type: '公办', address: '浦城路333号', phone: '021-58887777', feature: '九年一贯制学校' },
        high: { name: '上海市洋泾中学', level: 'A', type: '公办市重点', address: '潍坊路111号', phone: '021-58889999', feature: '上海市实验性示范性高中' }
    },
    '世茂滨江花园': {
        district: '浦东新区', address: '浦东新区潍坊西路1弄', coordinates: [121.514032, 31.220619],
        street: '潍坊新村街道',
        kindergarten: { name: '浦东新区南码头幼儿园', level: 'B', type: '公办', address: '南码头路155号', phone: '021-58828888' },
        primary: { name: '上海市实验小学', level: 'A', type: '公办', address: '浦东新区潍坊西路1弄', phone: '021-58826666', feature: '上海市重点小学' },
        middle: { name: '浦东新区洋泾东校', level: 'B', type: '公办', address: '东方路900号', phone: '021-58827777', feature: '浦东新区重点中学' },
        high: { name: '上海市建平中学', level: 'A', type: '公办市重点', address: '崮山路517号', phone: '021-58829999', feature: '上海市实验性示范性高中' }
    },
    '汤臣一品': {
        district: '浦东新区', address: '浦东新区花园石桥路28弄', coordinates: [121.501529, 31.23301],
        street: '陆家嘴街道',
        kindergarten: { name: '浦东新区东方幼儿园', level: 'A', type: '公办', address: '商城路1088号', phone: '021-58818888' },
        primary: { name: '上海市浦东新区明珠小学', level: 'A', type: '公办', address: '崂山路600号', phone: '021-58816666', feature: '浦东新区重点小学' },
        middle: { name: '华东师范大学附属东昌中学', level: 'A', type: '公办', address: '栖霞路34号', phone: '021-58817777', feature: '华东师范大学附属' },
        high: { name: '上海市建平中学西校', level: 'A', type: '公办', address: '源深路383号', phone: '021-58819999', feature: '建平中学分校' }
    },
    '浦东星河湾': {
        district: '浦东新区', address: '浦东新区锦绣路2580弄', coordinates: [121.535271, 31.192474],
        street: '花木街道',
        kindergarten: { name: '浦东新区蒲公英幼儿园', level: 'A', type: '公办', address: '锦绣路2580弄', phone: '021-50188888' },
        primary: { name: '上海市实验学校东校', level: 'A', type: '公办', address: '黑松路251号', phone: '021-50186666', feature: '上海市实验学校分校' },
        middle: { name: '上海市实验学校东校', level: 'A', type: '公办', address: '黑松路251号', phone: '021-50187777', feature: '九年一贯制学校' },
        high: { name: '上海市建平世纪中学', level: 'A', type: '公办', address: '玉兰路356号', phone: '021-50189999', feature: '建平教育集团成员' }
    },
    '仁恒河滨城': {
        district: '浦东新区', address: '浦东新区丁香路1399弄', coordinates: [121.565527, 31.230172],
        street: '花木街道',
        kindergarten: { name: '浦东新区进才实验小学幼儿园', level: 'A', type: '公办', address: '丁香路1399弄', phone: '021-50388888' },
        primary: { name: '上海市进才实验小学', level: 'A', type: '公办', address: '丁香路1289号', phone: '021-50386666', feature: '进才教育集团' },
        middle: { name: '上海市进才实验中学', level: 'A', type: '公办', address: '金松路191号', phone: '021-50387777', feature: '进才教育集团' },
        high: { name: '上海市进才中学', level: 'A', type: '公办市重点', address: '杨高中路2788号', phone: '021-50389999', feature: '上海市实验性示范性高中' }
    },
    '仁恒公园世纪': {
        district: '浦东新区', address: '浦东新区花木路1707弄', coordinates: [121.533914, 31.209063],
        street: '花木街道',
        kindergarten: { name: '浦东新区牡丹幼儿园', level: 'A', type: '公办', address: '花木路1707弄', phone: '021-50758888' },
        primary: { name: '上海市浦东新区海桐小学', level: 'A', type: '公办', address: '海桐路58号', phone: '021-50756666', feature: '浦东新区重点小学' },
        middle: { name: '上海市建平中学西校', level: 'A', type: '公办', address: '源深路383号', phone: '021-50757777', feature: '建平教育集团' },
        high: { name: '上海市进才中学', level: 'A', type: '公办市重点', address: '杨高中路2788号', phone: '021-50759999', feature: '上海市实验性示范性高中' }
    },
    '联洋年华': {
        district: '浦东新区', address: '浦东新区丁香路910弄', coordinates: [121.554034, 31.22535],
        street: '花木街道',
        kindergarten: { name: '浦东新区东方幼儿园', level: 'A', type: '公办', address: '丁香路910弄', phone: '021-50818888' },
        primary: { name: '上海市进才实验小学', level: 'A', type: '公办', address: '丁香路1289号', phone: '021-50816666', feature: '进才教育集团' },
        middle: { name: '上海市进才实验中学', level: 'A', type: '公办', address: '金松路191号', phone: '021-50817777', feature: '进才教育集团' },
        high: { name: '上海市进才中学', level: 'A', type: '公办市重点', address: '杨高中路2788号', phone: '021-50819999', feature: '上海市实验性示范性高中' }
    },
    '陆家嘴国际华城': {
        district: '浦东新区', address: '浦东新区张杨路1518弄', coordinates: [121.535722, 31.23549],
        street: '洋泾街道',
        kindergarten: { name: '浦东新区阳光幼儿园', level: 'A', type: '公办', address: '张杨路1518弄', phone: '021-58608888' },
        primary: { name: '上海市浦东新区第六师范附属小学', level: 'A', type: '公办', address: '羽山路1476号', phone: '021-58606666', feature: '浦东新区重点小学' },
        middle: { name: '上海市进才中学北校', level: 'A', type: '公办', address: '羽山路601号', phone: '021-58607777', feature: '进才教育集团' },
        high: { name: '上海市进才中学', level: 'A', type: '公办市重点', address: '杨高中路2788号', phone: '021-58609999', feature: '上海市实验性示范性高中' }
    },
    '碧云国际社区晓园': {
        district: '浦东新区', address: '浦东新区碧云路456弄', coordinates: [121.591749, 31.24127],
        street: '金桥镇',
        kindergarten: { name: '浦东新区冰厂田幼儿园', level: 'A', type: '公办', address: '碧云路456弄', phone: '021-50338888' },
        primary: { name: '上海市实验学校东校', level: 'A', type: '公办', address: '黑松路251号', phone: '021-50336666', feature: '上海市实验学校分校' },
        middle: { name: '上海市实验学校东校', level: 'A', type: '公办', address: '黑松路251号', phone: '021-50337777', feature: '九年一贯制学校' },
        high: { name: '上海市建平中学', level: 'A', type: '公办市重点', address: '崮山路517号', phone: '021-50339999', feature: '上海市实验性示范性高中' }
    },
    '万科翡翠滨江': {
        district: '浦东新区', address: '浦东新区昌邑路1500弄', coordinates: [121.537345, 31.244162],
        street: '潍坊新村街道',
        kindergarten: { name: '浦东新区凌民幼儿园', level: 'A', type: '公办', address: '昌邑路1500弄', phone: '021-58838888' },
        primary: { name: '上海市浦东新区梅园小学', level: 'B', type: '公办', address: '梅园三村36号', phone: '021-58836666', feature: '浦东新区中心小学' },
        middle: { name: '上海市东昌东校', level: 'B', type: '公办', address: '南泉北路1040号', phone: '021-58837777', feature: '浦东新区重点中学' },
        high: { name: '上海市东昌中学', level: 'A', type: '公办市重点', address: '南泉北路1040号', phone: '021-58839999', feature: '浦东新区重点中学' }
    },
    '金桥瑞仕花园': {
        district: '浦东新区', address: '浦东新区枣庄路399弄', coordinates: [121.576686, 31.255644],
        street: '金桥镇',
        kindergarten: { name: '浦东新区金桥幼儿园', level: 'A', type: '公办', address: '枣庄路399弄', phone: '021-50708888' },
        primary: { name: '上海市浦东新区建平实验小学', level: 'A', type: '公办', address: '金业路72号', phone: '021-50706666', feature: '建平教育集团' },
        middle: { name: '上海市建平实验中学', level: 'A', type: '公办', address: '枣庄路111号', phone: '021-50707777', feature: '建平教育集团' },
        high: { name: '上海市建平中学', level: 'A', type: '公办市重点', address: '崮山路517号', phone: '021-50709999', feature: '上海市实验性示范性高中' }
    },
    '世纪公园大唐盛世花园': {
        district: '浦东新区', address: '浦东新区白杨路199弄', coordinates: [121.558851, 31.20813],
        street: '花木街道',
        kindergarten: { name: '浦东新区牡丹幼儿园', level: 'A', type: '公办', address: '白杨路199弄', phone: '021-50498888' },
        primary: { name: '上海市浦东新区花木中心小学', level: 'A', type: '公办', address: '杜鹃路152号', phone: '021-50496666', feature: '浦东新区重点小学' },
        middle: { name: '上海市建平中学西校', level: 'A', type: '公办', address: '源深路383号', phone: '021-50497777', feature: '建平教育集团' },
        high: { name: '上海市进才中学', level: 'A', type: '公办市重点', address: '杨高中路2788号', phone: '021-50499999', feature: '上海市实验性示范性高中' }
    },

    // ==================== 黄浦区 ====================
    '翠湖天地': {
        district: '黄浦区', address: '黄浦区顺昌路168弄', coordinates: [121.478011, 31.217902],
        street: '淮海中路街道',
        kindergarten: { name: '黄浦区威海路幼儿园', level: 'A', type: '公办', address: '威海路112号', phone: '021-63288888' },
        primary: { name: '上海师范大学附属卢湾实验小学', level: 'A', type: '公办', address: '局门路736号', phone: '021-63286666', feature: '上海师范大学附属' },
        middle: { name: '上海市向明初级中学', level: 'A', type: '公办', address: '巨鹿路334号', phone: '021-63287777', feature: '向明中学初中部' },
        high: { name: '上海市向明中学', level: 'A', type: '公办市重点', address: '瑞金一路151号', phone: '021-63289999', feature: '上海市实验性示范性高中' }
    },
    '绿城黄浦湾': {
        district: '黄浦区', address: '黄浦区中山南路566弄', coordinates: [121.503249, 31.216973],
        street: '半淞园路街道',
        kindergarten: { name: '黄浦区荷花池幼儿园', level: 'A', type: '公办', address: '中山南路566弄', phone: '021-63388888' },
        primary: { name: '上海市黄浦区第一中心小学', level: 'A', type: '公办', address: '黄浦区第一中心小学', phone: '021-63386666', feature: '黄浦区重点小学' },
        middle: { name: '上海市敬业初级中学', level: 'A', type: '公办', address: '尚文路73号', phone: '021-63387777', feature: '敬业中学初中部' },
        high: { name: '上海市敬业中学', level: 'A', type: '公办市重点', address: '蓬莱路345号', phone: '021-63389999', feature: '上海市实验性示范性高中' }
    },
    '复兴珑御': {
        district: '黄浦区', address: '黄浦区复兴东路1188弄', coordinates: [121.484666, 31.217711],
        street: '小东门街道',
        kindergarten: { name: '黄浦区百灵鸟幼儿园', level: 'A', type: '公办', address: '复兴东路1188弄', phone: '021-63328888' },
        primary: { name: '上海市黄浦区复兴东路第三小学', level: 'B', type: '公办', address: '复兴东路949号', phone: '021-63326666', feature: '黄浦区中心小学' },
        middle: { name: '上海市市八初级中学', level: 'B', type: '公办', address: '复兴东路123号', phone: '021-63327777', feature: '市八中学初中部' },
        high: { name: '上海市市八中学', level: 'A', type: '公办市重点', address: '复兴东路123号', phone: '021-63329999', feature: '上海市实验性示范性高中' }
    },
    '华府天地': {
        district: '黄浦区', address: '黄浦区马当路222弄', coordinates: [121.473799, 31.218866],
        street: '淮海中路街道',
        kindergarten: { name: '黄浦区重庆南路幼儿园', level: 'A', type: '公办', address: '马当路222弄', phone: '021-53068888' },
        primary: { name: '上海市黄浦区卢湾二中心小学', level: 'A', type: '公办', address: '复兴中路642号', phone: '021-53066666', feature: '黄浦区重点小学' },
        middle: { name: '上海市向明初级中学', level: 'A', type: '公办', address: '巨鹿路334号', phone: '021-53067777', feature: '向明中学初中部' },
        high: { name: '上海市向明中学', level: 'A', type: '公办市重点', address: '瑞金一路151号', phone: '021-53069999', feature: '上海市实验性示范性高中' }
    },
    '思南公馆': {
        district: '黄浦区', address: '黄浦区复兴中路517号', coordinates: [121.468956, 31.214509],
        street: '瑞金二路街道',
        kindergarten: { name: '黄浦区思南路幼儿园', level: 'A', type: '公办', address: '复兴中路517号', phone: '021-53018888' },
        primary: { name: '上海市黄浦区卢湾一中心小学', level: 'A', type: '公办', address: '淡水路450号', phone: '021-53016666', feature: '黄浦区重点小学' },
        middle: { name: '上海市兴业中学', level: 'B', type: '公办', address: '兴业路205号', phone: '021-53017777', feature: '黄浦区重点中学' },
        high: { name: '上海市向明中学', level: 'A', type: '公办市重点', address: '瑞金一路151号', phone: '021-53019999', feature: '上海市实验性示范性高中' }
    },

    // ==================== 徐汇区 ====================
    '徐汇中凯城市之光': {
        district: '徐汇区', address: '徐汇区嘉善路508号', coordinates: [121.428648, 31.192017],
        street: '湖南路街道',
        kindergarten: { name: '徐汇区宛南实验幼儿园', level: 'A', type: '公办', address: '嘉善路508号', phone: '021-54088888' },
        primary: { name: '上海市徐汇区向阳小学', level: 'A', type: '公办', address: '嘉善路508号', phone: '021-54086666', feature: '徐汇区重点小学' },
        middle: { name: '上海市位育初级中学', level: 'A', type: '公办', address: '复兴中路1261号', phone: '021-54087777', feature: '位育中学初中部' },
        high: { name: '上海市位育中学', level: 'A', type: '公办市重点', address: '位育路1号', phone: '021-54089999', feature: '上海市实验性示范性高中' }
    },
    '尚海湾豪庭': {
        district: '徐汇区', address: '徐汇区凯滨路18弄', coordinates: [121.45902, 31.178734],
        street: '龙华街道',
        kindergarten: { name: '徐汇区东安一村幼儿园', level: 'A', type: '公办', address: '凯滨路18弄', phone: '021-64098888' },
        primary: { name: '上海市徐汇区盛大花园小学', level: 'A', type: '民办', address: '龙华路2588号', phone: '021-64096666', feature: '徐汇区优质民办小学' },
        middle: { name: '上海市南洋模范初级中学', level: 'A', type: '公办', address: '天平路200号', phone: '021-64097777', feature: '南模中学初中部' },
        high: { name: '上海市南洋模范中学', level: 'A', type: '公办市重点', address: '零陵路453号', phone: '021-64099999', feature: '上海市实验性示范性高中' }
    },
    '东方曼哈顿': {
        district: '徐汇区', address: '徐汇区虹桥路168号', coordinates: [121.433831, 31.191094],
        street: '虹桥路街道',
        kindergarten: { name: '徐汇区科技幼儿园', level: 'A', type: '公办', address: '虹桥路168号', phone: '021-64058888' },
        primary: { name: '上海市徐汇区汇师小学', level: 'A', type: '公办', address: '文定路170号', phone: '021-64056666', feature: '徐汇区重点小学' },
        middle: { name: '上海市徐汇中学', level: 'A', type: '公办', address: '虹桥路68号', phone: '021-64057777', feature: '徐汇区重点中学' },
        high: { name: '上海市南洋模范中学', level: 'A', type: '公办市重点', address: '零陵路453号', phone: '021-64059999', feature: '上海市实验性示范性高中' }
    },
    '云锦东方': {
        district: '徐汇区', address: '徐汇区龙兰路399弄', coordinates: [121.454836, 31.163303],
        street: '龙华街道',
        kindergarten: { name: '徐汇区印象幼儿园', level: 'A', type: '公办', address: '龙兰路399弄', phone: '021-54358888' },
        primary: { name: '上海市徐汇区高安路第一小学', level: 'A', type: '公办', address: '康平路4号', phone: '021-54356666', feature: '徐汇区重点小学' },
        middle: { name: '上海市南洋模范初级中学', level: 'A', type: '公办', address: '天平路200号', phone: '021-54357777', feature: '南模中学初中部' },
        high: { name: '上海市南洋模范中学', level: 'A', type: '公办市重点', address: '零陵路453号', phone: '021-54359999', feature: '上海市实验性示范性高中' }
    },
    '保利西岸': {
        district: '徐汇区', address: '徐汇区瑞宁路908弄', coordinates: [121.45613, 31.180184],
        street: '徐家汇街道',
        kindergarten: { name: '徐汇区东安一村幼儿园', level: 'A', type: '公办', address: '瑞宁路908弄', phone: '021-64028888' },
        primary: { name: '上海市徐汇区东安路第二小学', level: 'B', type: '公办', address: '东安路221号', phone: '021-64026666', feature: '徐汇区中心小学' },
        middle: { name: '上海市南洋初级中学', level: 'B', type: '公办', address: ' pomme路40号', phone: '021-64027777', feature: '南洋中学初中部' },
        high: { name: '上海市南洋中学', level: 'A', type: '公办市重点', address: '龙华中路200号', phone: '021-64029999', feature: '上海市实验性示范性高中' }
    },
    '嘉御庭': {
        district: '徐汇区', address: '徐汇区建国西路268弄', coordinates: [121.459719, 31.206481],
        street: '天平路街道',
        kindergarten: { name: '徐汇区襄阳南路第一幼儿园', level: 'A', type: '公办', address: '建国西路268弄', phone: '021-54668888' },
        primary: { name: '上海市徐汇区建襄小学', level: 'A', type: '公办', address: '岳阳路255号', phone: '021-54666666', feature: '徐汇区重点小学' },
        middle: { name: '上海市位育初级中学', level: 'A', type: '公办', address: '复兴中路1261号', phone: '021-54667777', feature: '位育中学初中部' },
        high: { name: '上海市位育中学', level: 'A', type: '公办市重点', address: '位育路1号', phone: '021-54669999', feature: '上海市实验性示范性高中' }
    },

    // ==================== 静安区 ====================
    '静安豪景苑': {
        district: '静安区', address: '静安区西康路501弄', coordinates: [121.446917, 31.232765],
        street: '江宁路街道',
        kindergarten: { name: '静安区余姚路幼儿园', level: 'A', type: '公办', address: '余姚路487号', phone: '021-62558888' },
        primary: { name: '上海市静安区第一中心小学', level: 'A', type: '公办', address: '新闸路1461号', phone: '021-62556666', feature: '静安区重点小学' },
        middle: { name: '上海市五四中学', level: 'B', type: '公办', address: '新闸路1370号', phone: '021-62557777', feature: '静安区重点中学' },
        high: { name: '上海市市西中学', level: 'A', type: '公办市重点', address: '愚园路404号', phone: '021-62559999', feature: '上海市实验性示范性高中' }
    },
    '大宁金茂府': {
        district: '静安区', address: '静安区彭江路399弄', coordinates: [121.455285, 31.286682],
        street: '大宁路街道',
        kindergarten: { name: '静安区大宁国际幼儿园', level: 'A', type: '公办', address: '彭江路399弄', phone: '021-66258888' },
        primary: { name: '上海市静安区大宁国际小学', level: 'A', type: '公办', address: '万荣路948号', phone: '021-66256666', feature: '静安区重点小学' },
        middle: { name: '上海市风华初级中学', level: 'A', type: '公办', address: '永和东路393号', phone: '021-66257777', feature: '风华中学初中部' },
        high: { name: '上海市风华中学', level: 'A', type: '公办市重点', address: '大宁路1000号', phone: '021-66259999', feature: '上海市实验性示范性高中' }
    },
    '上海滩大宁城': {
        district: '静安区', address: '静安区平型关路1288弄', coordinates: [121.455586, 31.261355],
        street: '大宁路街道',
        kindergarten: { name: '静安区芷江中路幼儿园', level: 'A', type: '公办', address: '芷江西路45号', phone: '021-56308888' },
        primary: { name: '上海市静安区闸北实验小学', level: 'A', type: '公办', address: '大宁路670号', phone: '021-56306666', feature: '静安区重点小学' },
        middle: { name: '上海市市北初级中学', level: 'A', type: '公办', address: '西藏北路803号', phone: '021-56307777', feature: '市北中学初中部' },
        high: { name: '上海市市北中学', level: 'A', type: '公办市重点', address: '永兴路365号', phone: '021-56309999', feature: '上海市实验性示范性高中' }
    },
    '静安枫景苑': {
        district: '静安区', address: '静安区常德路500弄', coordinates: [121.446953, 31.230866],
        street: '静安寺街道',
        kindergarten: { name: '静安区余姚路第二幼儿园', level: 'A', type: '公办', address: '常德路500弄', phone: '021-62778888' },
        primary: { name: '上海市静安区第一师范学校附属小学', level: 'A', type: '公办', address: '西康路535号', phone: '021-62776666', feature: '静安区重点小学' },
        middle: { name: '上海市市西初级中学', level: 'A', type: '公办', address: '愚园路460号', phone: '021-62777777', feature: '市西中学初中部' },
        high: { name: '上海市市西中学', level: 'A', type: '公办市重点', address: '愚园路404号', phone: '021-62779999', feature: '上海市实验性示范性高中' }
    },
    '华侨城苏河湾': {
        district: '静安区', address: '静安区北苏州路928号', coordinates: [121.477656, 31.242294],
        street: '北站街道',
        kindergarten: { name: '静安区山西北路幼儿园', level: 'A', type: '公办', address: '北苏州路928号', phone: '021-63808888' },
        primary: { name: '上海市静安区闸北第一中心小学', level: 'A', type: '公办', address: '康乐路199号', phone: '021-63806666', feature: '静安区重点小学' },
        middle: { name: '上海市向东中学', level: 'B', type: '公办', address: '蒙古路48号', phone: '021-63807777', feature: '静安区重点中学' },
        high: { name: '上海市市北中学', level: 'A', type: '公办市重点', address: '永兴路365号', phone: '021-63809999', feature: '上海市实验性示范性高中' }
    },
    '中凯城市之光': {
        district: '静安区', address: '静安区大沽路368弄', coordinates: [121.464566, 31.226307],
        street: '南京西路街道',
        kindergarten: { name: '静安区威海路幼儿园', level: 'A', type: '公办', address: '大沽路368弄', phone: '021-63258888' },
        primary: { name: '上海市静安区威海路第三小学', level: 'B', type: '公办', address: '威海路870号', phone: '021-63256666', feature: '静安区中心小学' },
        middle: { name: '上海市民立中学', level: 'B', type: '公办', address: '威海路681号', phone: '021-63257777', feature: '静安区重点中学' },
        high: { name: '上海市市西中学', level: 'A', type: '公办市重点', address: '愚园路404号', phone: '021-63259999', feature: '上海市实验性示范性高中' }
    },

    // ==================== 长宁区 ====================
    '嘉里华庭': {
        district: '长宁区', address: '长宁区华山路1038弄', coordinates: [121.435671, 31.213045],
        street: '新华路街道',
        kindergarten: { name: '长宁区愚园路第一幼儿园', level: 'A', type: '公办', address: '愚园路1210弄', phone: '021-62118888' },
        primary: { name: '上海市江苏路第五小学', level: 'A', type: '公办', address: '昭化东路81号', phone: '021-62116666', feature: '长宁区重点小学' },
        middle: { name: '上海市延安初级中学', level: 'A', type: '公办', address: '延安西路601号', phone: '021-62117777', feature: '延安中学初中部' },
        high: { name: '上海市延安中学', level: 'A', type: '公办市重点', address: '茅台路1111号', phone: '021-62119999', feature: '上海市实验性示范性高中' }
    },
    '天山星城': {
        district: '长宁区', address: '长宁区威宁路358弄', coordinates: [121.387092, 31.213195],
        street: '天山路街道',
        kindergarten: { name: '长宁区天山幼儿园', level: 'A', type: '公办', address: '天山支路50号', phone: '021-62958888' },
        primary: { name: '上海市长宁区天山第一小学', level: 'B', type: '公办', address: '天山支路50号', phone: '021-62956666', feature: '长宁区中心小学' },
        middle: { name: '上海市娄山中学', level: 'B', type: '公办', address: '玉屏南路158号', phone: '021-62957777', feature: '长宁区重点中学' },
        high: { name: '上海市天山中学', level: 'B', type: '公办', address: '天中路155号', phone: '021-62959999', feature: '长宁区重点中学' }
    },
    '仁恒河滨花园': {
        district: '长宁区', address: '长宁区芙蓉江路388弄', coordinates: [121.394277, 31.215478],
        street: '周家桥街道',
        kindergarten: { name: '长宁区实验幼儿园', level: 'A', type: '公办', address: '芙蓉江路388弄', phone: '021-62918888' },
        primary: { name: '上海市长宁区天山第二小学', level: 'B', type: '公办', address: '天山五村170号', phone: '021-62916666', feature: '长宁区中心小学' },
        middle: { name: '上海市娄山中学', level: 'B', type: '公办', address: '玉屏南路158号', phone: '021-62917777', feature: '长宁区重点中学' },
        high: { name: '上海市天山中学', level: 'B', type: '公办', address: '天中路155号', phone: '021-62919999', feature: '长宁区重点中学' }
    },
    '西郊庄园': {
        district: '长宁区', address: '长宁区虹桥路1889弄', coordinates: [121.283717, 31.197585],
        street: '程家桥街道',
        kindergarten: { name: '长宁区哈密路幼儿园', level: 'A', type: '公办', address: '虹桥路1889弄', phone: '021-62608888' },
        primary: { name: '上海市长宁区绿苑小学', level: 'B', type: '公办', address: '淞虹路685号', phone: '021-62606666', feature: '长宁区中心小学' },
        middle: { name: '上海市西郊学校', level: 'B', type: '公办', address: '金浜路25号', phone: '021-62607777', feature: '长宁区重点中学' },
        high: { name: '上海市延安中学', level: 'A', type: '公办市重点', address: '茅台路1111号', phone: '021-62609999', feature: '上海市实验性示范性高中' }
    },

    // ==================== 杨浦区 ====================
    '创智坊': {
        district: '杨浦区', address: '杨浦区大学路187弄', coordinates: [121.509395, 31.304106],
        street: '五角场街道',
        kindergarten: { name: '杨浦区本溪路幼儿园', level: 'A', type: '公办', address: '本溪路151号', phone: '021-65558888' },
        primary: { name: '上海市二师附小', level: 'A', type: '公办', address: '密云路454号', phone: '021-65556666', feature: '杨浦区重点小学' },
        middle: { name: '上海市铁岭中学', level: 'A', type: '公办', address: '铁岭路109号', phone: '021-65557777', feature: '杨浦区重点中学' },
        high: { name: '上海市控江中学', level: 'A', type: '公办市重点', address: '双阳路388号', phone: '021-65559999', feature: '上海市实验性示范性高中' }
    },
    '新江湾城橡树湾': {
        district: '杨浦区', address: '杨浦区江湾城路88弄', coordinates: [121.520178, 31.338306],
        street: '新江湾城街道',
        kindergarten: { name: '杨浦区中福会幼儿园', level: 'A', type: '公办', address: '国晓路300号', phone: '021-65918888' },
        primary: { name: '上海市杨浦区复旦科技园小学', level: 'A', type: '公办', address: '恒学路100号', phone: '021-65916666', feature: '复旦大学附属' },
        middle: { name: '上海市上音实验学校', level: 'A', type: '公办', address: '政和路359号', phone: '021-65917777', feature: '上海音乐学院附属' },
        high: { name: '上海市复旦大学附属中学', level: 'A', type: '公办市重点', address: '国权路383号', phone: '021-65919999', feature: '上海市实验性示范性高中' }
    },
    '阳光城檀悦': {
        district: '杨浦区', address: '杨浦区辽源西路230弄', coordinates: [121.532457, 31.264102],
        street: '控江路街道',
        kindergarten: { name: '杨浦区打虎山路幼儿园', level: 'A', type: '公办', address: '辽源西路230弄', phone: '021-65058888' },
        primary: { name: '上海市杨浦区打虎山路第一小学', level: 'A', type: '公办', address: '打虎山路138号', phone: '021-65056666', feature: '杨浦区重点小学' },
        middle: { name: '上海市凯慧初级中学', level: 'B', type: '公办', address: '大连路1530号', phone: '021-65057777', feature: '杨浦区重点中学' },
        high: { name: '上海市控江中学', level: 'A', type: '公办市重点', address: '双阳路388号', phone: '021-65059999', feature: '上海市实验性示范性高中' }
    },
    '翡丽甲第': {
        district: '杨浦区', address: '杨浦区辽阳路58弄', coordinates: [121.518978, 31.258576],
        street: '大桥街道',
        kindergarten: { name: '杨浦区新跃幼稚园', level: 'A', type: '公办', address: '辽阳路58弄', phone: '021-65458888' },
        primary: { name: '上海市杨浦区齐齐哈尔路第一小学', level: 'B', type: '公办', address: '齐齐哈尔路669号', phone: '021-65456666', feature: '杨浦区中心小学' },
        middle: { name: '上海市市东初级中学', level: 'B', type: '公办', address: 'Vmc路999号', phone: '021-65457777', feature: '市东中学初中部' },
        high: { name: '上海市市东中学', level: 'A', type: '公办市重点', address: '荆州路42号', phone: '021-65459999', feature: '杨浦区重点中学' }
    },

    // ==================== 虹口区 ====================
    '瑞虹新城': {
        district: '虹口区', address: '虹口区临平路333弄', coordinates: [121.496632, 31.263799],
        street: '嘉兴路街道',
        kindergarten: { name: '虹口区瑞虹幼儿园', level: 'A', type: '公办', address: '临平路333弄', phone: '021-65018888' },
        primary: { name: '上海市虹口区红旗小学', level: 'B', type: '公办', address: '临平路333弄', phone: '021-65016666', feature: '虹口区重点小学' },
        middle: { name: '上海市华东师大一附中实验中学', level: 'A', type: '公办', address: '大连西路205号', phone: '021-65017777', feature: '华东师范大学附属' },
        high: { name: '上海市华东师大一附中', level: 'A', type: '公办市重点', address: '虹关路88号', phone: '021-65019999', feature: '上海市实验性示范性高中' }
    },
    '白金湾府邸': {
        district: '虹口区', address: '虹口区海平路58弄', coordinates: [121.50643, 31.250306],
        street: '北外滩街道',
        kindergarten: { name: '虹口区东余杭路幼儿园', level: 'A', type: '公办', address: '海平路58弄', phone: '021-65408888' },
        primary: { name: '上海市虹口区第一中心小学', level: 'A', type: '公办', address: '昆山路224号', phone: '021-65406666', feature: '虹口区重点小学' },
        middle: { name: '上海市虹口初级中学', level: 'B', type: '公办', address: '塘沽路834号', phone: '021-65407777', feature: '虹口区重点中学' },
        high: { name: '上海市北郊高级中学', level: 'A', type: '公办市重点', address: '曲阳路497号', phone: '021-65409999', feature: '上海市实验性示范性高中' }
    },
    '新湖青蓝国际': {
        district: '虹口区', address: '虹口区青云路168弄', coordinates: [121.473124, 31.262332],
        street: '广中路街道',
        kindergarten: { name: '虹口区芷江中路幼儿园', level: 'A', type: '公办', address: '青云路168弄', phone: '021-56608888' },
        primary: { name: '上海市虹口区第三中心小学', level: 'A', type: '公办', address: '山阴路103号', phone: '021-56606666', feature: '虹口区重点小学' },
        middle: { name: '上海市鲁迅初级中学', level: 'B', type: '公办', address: '鲁迅公园路999号', phone: '021-56607777', feature: '鲁迅中学初中部' },
        high: { name: '上海市鲁迅中学', level: 'B', type: '公办', address: '广中路132号', phone: '021-56609999', feature: '虹口区重点中学' }
    },

    // ==================== 普陀区 ====================
    '中海紫御豪庭': {
        district: '普陀区', address: '普陀区同普路688弄', coordinates: [121.381871, 31.228861],
        street: '长风新村街道',
        kindergarten: { name: '普陀区绿洲幼儿园', level: 'A', type: '公办', address: '同普路688弄', phone: '021-52888888' },
        primary: { name: '华师大附属小学', level: 'A', type: '公办', address: '中山北路3669号', phone: '021-52886666', feature: '华东师范大学附属' },
        middle: { name: '曹杨第二中学附属学校', level: 'A', type: '公办', address: '桐柏路108号', phone: '021-52887777', feature: '区重点中学' },
        high: { name: '上海市曹杨第二中学', level: 'A', type: '公办市重点', address: '梅川路160号', phone: '021-52889999', feature: '上海市实验性示范性高中' }
    },
    '中远两湾城': {
        district: '普陀区', address: '普陀区中潭路100弄', coordinates: [121.442988, 31.252108],
        street: '宜川路街道',
        kindergarten: { name: '普陀区宜川新村幼儿园', level: 'A', type: '公办', address: '中潭路100弄', phone: '021-56018888' },
        primary: { name: '上海市普陀区中远实验学校', level: 'A', type: '公办', address: '中潭路100弄', phone: '021-56016666', feature: '普陀区重点小学' },
        middle: { name: '上海市普陀区中远实验学校', level: 'A', type: '公办', address: '中潭路100弄', phone: '021-56017777', feature: '九年一贯制学校' },
        high: { name: '上海市宜川中学', level: 'B', type: '公办', address: '华阴路101号', phone: '021-56019999', feature: '普陀区重点中学' }
    },
    '万里雅筑': {
        district: '普陀区', address: '普陀区真华路295弄', coordinates: [121.403842, 31.265339],
        street: '万里街道',
        kindergarten: { name: '普陀区万里城实验幼儿园', level: 'A', type: '公办', address: '真华路295弄', phone: '021-56058888' },
        primary: { name: '上海市晋元高级中学附属学校', level: 'A', type: '公办', address: '真金路512号', phone: '021-56056666', feature: '晋元高中附属' },
        middle: { name: '上海市晋元高级中学附属学校', level: 'A', type: '公办', address: '真金路512号', phone: '021-56057777', feature: '九年一贯制学校' },
        high: { name: '上海市晋元高级中学', level: 'A', type: '公办市重点', address: '武威东路128号', phone: '021-56059999', feature: '上海市实验性示范性高中' }
    },
    '华侨城': {
        district: '普陀区', address: '普陀区西康路989弄', coordinates: [121.495819, 31.099166],
        street: '长寿路街道',
        kindergarten: { name: '普陀区常德路幼儿园', level: 'A', type: '公办', address: '西康路989弄', phone: '021-62758888' },
        primary: { name: '上海市江宁学校', level: 'A', type: '公办', address: '西康路1518弄', phone: '021-62756666', feature: '普陀区重点小学' },
        middle: { name: '上海市江宁学校', level: 'A', type: '公办', address: '西康路1518弄', phone: '021-62757777', feature: '九年一贯制学校' },
        high: { name: '上海市曹杨第二中学', level: 'A', type: '公办市重点', address: '梅川路160号', phone: '021-62759999', feature: '上海市实验性示范性高中' }
    },

    // ==================== 闵行区 ====================
    '万科城市花园': {
        district: '闵行区', address: '闵行区七莘路3333号', coordinates: [121.339615, 31.157001],
        street: '七宝镇',
        kindergarten: { name: '万科幼儿园', level: 'A', type: '公办', address: '七莘路3333号', phone: '021-64588888' },
        primary: { name: '闵行区万科双语学校', level: 'A', type: '民办', address: '七莘路3565号', phone: '021-64586666', feature: '双语教学特色' },
        middle: { name: '七宝第二中学', level: 'A', type: '公办', address: '航新路75号', phone: '021-64587777', feature: '闵行区重点中学' },
        high: { name: '上海市七宝中学', level: 'A', type: '公办市重点', address: '农南路22号', phone: '021-64589999', feature: '上海市首批实验性示范性高中' }
    },
    '古北壹号': {
        district: '闵行区', address: '闵行区红松东路1099弄', coordinates: [121.396013, 31.186635],
        street: '虹桥镇',
        kindergarten: { name: '闵行区虹桥中心幼儿园', level: 'A', type: '公办', address: '红松东路1099弄', phone: '021-64018888' },
        primary: { name: '上海市闵行区虹桥中心小学', level: 'B', type: '公办', address: '虹桥路2328号', phone: '021-64016666', feature: '闵行区重点小学' },
        middle: { name: '上海市金汇高级中学', level: 'B', type: '公办', address: '金汇路188号', phone: '021-64017777', feature: '闵行区重点中学' },
        high: { name: '上海市延安中学', level: 'A', type: '公办市重点', address: '茅台路1111号', phone: '021-64019999', feature: '上海市实验性示范性高中' }
    },
    '万源城御璄': {
        district: '闵行区', address: '闵行区万源路788弄', coordinates: [121.391408, 31.148951],
        street: '古美路街道',
        kindergarten: { name: '闵行区万源城幼儿园', level: 'A', type: '公办', address: '万源路788弄', phone: '021-54858888' },
        primary: { name: '上海市闵行区平南小学', level: 'A', type: '公办', address: '平南路48号', phone: '021-54856666', feature: '闵行区重点小学' },
        middle: { name: '上海市实验学校西校', level: 'A', type: '公办', address: '平吉路300号', phone: '021-54857777', feature: '上海市实验学校分校' },
        high: { name: '上海市七宝中学', level: 'A', type: '公办市重点', address: '农南路22号', phone: '021-54859999', feature: '上海市首批实验性示范性高中' }
    },
    '春申景城': {
        district: '闵行区', address: '闵行区莲花南路1147弄', coordinates: [121.412026, 31.106332],
        street: '莘庄镇',
        kindergarten: { name: '闵行区春申景城幼儿园', level: 'A', type: '公办', address: '莲花南路1147弄', phone: '021-54308888' },
        primary: { name: '上海市闵行区实验小学', level: 'A', type: '公办', address: '莘沥路203号', phone: '021-54306666', feature: '闵行区重点小学' },
        middle: { name: '上海市莘松中学', level: 'A', type: '公办', address: '莘沥路302号', phone: '021-54307777', feature: '闵行区重点中学' },
        high: { name: '上海市闵行中学', level: 'A', type: '公办市重点', address: '江川东路950号', phone: '021-54309999', feature: '闵行区重点中学' }
    },
    '浦江华侨城': {
        district: '闵行区', address: '闵行区浦驰路1528弄', coordinates: [121.495819, 31.099166],
        street: '浦锦街道',
        kindergarten: { name: '闵行区浦江宝邸幼儿园', level: 'A', type: '公办', address: '浦驰路1528弄', phone: '021-54358888' },
        primary: { name: '上海市闵行区浦江第一小学', level: 'B', type: '公办', address: '浦江路105号', phone: '021-54356666', feature: '闵行区中心小学' },
        middle: { name: '上海市浦江第一中学', level: 'B', type: '公办', address: '浦锦路139号', phone: '021-54357777', feature: '闵行区重点中学' },
        high: { name: '上海市闵行中学', level: 'A', type: '公办市重点', address: '江川东路950号', phone: '021-54359999', feature: '闵行区重点中学' }
    },
    '上海康城': {
        district: '闵行区', address: '闵行区莘松路958弄', coordinates: [121.354866, 31.104476],
        street: '莘庄镇',
        kindergarten: { name: '闵行区上海康城幼儿园', level: 'A', type: '公办', address: '莘松路958弄', phone: '021-64938888' },
        primary: { name: '上海市闵行区上师大康城实验学校', level: 'A', type: '公办', address: '莘松路958弄', phone: '021-64936666', feature: '上海师范大学附属' },
        middle: { name: '上海市闵行区上师大康城实验学校', level: 'A', type: '公办', address: '莘松路958弄', phone: '021-64937777', feature: '九年一贯制学校' },
        high: { name: '上海市莘庄中学', level: 'B', type: '公办', address: '腾冲路168号', phone: '021-64939999', feature: '闵行区重点中学' }
    },

    // ==================== 嘉定区 ====================
    '嘉定新城金郡': {
        district: '嘉定区', address: '嘉定区阿克苏路818弄', coordinates: [121.240155, 31.344137],
        street: '马陆镇',
        kindergarten: { name: '嘉定区新城幼儿园', level: 'A', type: '公办', address: '宝塔路318号', phone: '021-59158888' },
        primary: { name: '上海市嘉定区普通小学', level: 'A', type: '公办', address: '塔城路278号', phone: '021-59156666', feature: '嘉定区重点小学' },
        middle: { name: '上海市嘉定新城实验中学', level: 'B', type: '公办', address: '崇信路818号', phone: '021-59157777', feature: '嘉定区重点中学' },
        high: { name: '上海市嘉定区第一中学', level: 'A', type: '公办市重点', address: '嘉定区菊园新区嘉行公路851号', phone: '021-59159999', feature: '嘉定区重点中学' }
    },
    '南翔华润中央公园': {
        district: '嘉定区', address: '嘉定区芳林路819弄', coordinates: [121.311748, 31.314871],
        street: '南翔镇',
        kindergarten: { name: '嘉定区南翔幼儿园', level: 'A', type: '公办', address: '芳林路819弄', phone: '021-59128888' },
        primary: { name: '上海市嘉定区南翔小学', level: 'A', type: '公办', address: '南翔镇民主街8号', phone: '021-59126666', feature: '嘉定区重点小学' },
        middle: { name: '上海市嘉定区南翔中学', level: 'B', type: '公办', address: '南翔镇古猗园路718号', phone: '021-59127777', feature: '嘉定区重点中学' },
        high: { name: '上海市嘉定区第一中学', level: 'A', type: '公办市重点', address: '嘉定区菊园新区嘉行公路851号', phone: '021-59129999', feature: '嘉定区重点中学' }
    },
    '安亭新镇': {
        district: '嘉定区', address: '嘉定区安礼路255弄', coordinates: [121.174011, 31.268139],
        street: '安亭镇',
        kindergarten: { name: '嘉定区安亭幼儿园', level: 'A', type: '公办', address: '安礼路255弄', phone: '021-59578888' },
        primary: { name: '上海市嘉定区安亭小学', level: 'B', type: '公办', address: '安亭镇新源路828号', phone: '021-59576666', feature: '嘉定区中心小学' },
        middle: { name: '上海市嘉定区震川中学', level: 'B', type: '公办', address: '安亭镇和静路1388号', phone: '021-59577777', feature: '嘉定区重点中学' },
        high: { name: '上海市嘉定区第二中学', level: 'A', type: '公办市重点', address: '南翔镇德园路728号', phone: '021-59579999', feature: '嘉定区重点中学' }
    },

    // ==================== 宝山区 ====================
    '保利叶上海': {
        district: '宝山区', address: '宝山区菊联路89弄', coordinates: [121.358527, 31.346303],
        street: '杨行镇',
        kindergarten: { name: '宝山区小天鹅幼儿园', level: 'A', type: '公办', address: '菊联路89弄', phone: '021-56098888' },
        primary: { name: '上海市宝山区实验小学', level: 'A', type: '公办', address: '团结路181号', phone: '021-56096666', feature: '宝山区重点小学' },
        middle: { name: '上海市宝山区实验中学', level: 'B', type: '公办', address: '宝林路42号', phone: '021-56097777', feature: '宝山区重点中学' },
        high: { name: '上海市行知中学', level: 'A', type: '公办市重点', address: '子青路99号', phone: '021-56099999', feature: '上海市实验性示范性高中' }
    },
    '顾村公园保利叶语': {
        district: '宝山区', address: '宝山区陆翔路358弄', coordinates: [121.365238, 31.34271],
        street: '顾村镇',
        kindergarten: { name: '宝山区顾村中心幼儿园', level: 'A', type: '公办', address: '陆翔路358弄', phone: '021-56028888' },
        primary: { name: '上海市宝山区顾村中心小学', level: 'B', type: '公办', address: '顾村镇顾北路101号', phone: '021-56026666', feature: '宝山区中心小学' },
        middle: { name: '上海市刘行新华实验学校', level: 'B', type: '公办', address: '菊泉街528号', phone: '021-56027777', feature: '宝山区重点中学' },
        high: { name: '上海市行知中学', level: 'A', type: '公办市重点', address: '子青路99号', phone: '021-56029999', feature: '上海市实验性示范性高中' }
    },
    '大华锦绣华城': {
        district: '宝山区', address: '宝山区真华路999弄', coordinates: [121.539294, 31.181795],
        street: '大场镇',
        kindergarten: { name: '宝山区行知实验幼儿园', level: 'A', type: '公办', address: '真华路999弄', phone: '021-66358888' },
        primary: { name: '上海市宝山区大华小学', level: 'B', type: '公办', address: '华灵路895号', phone: '021-66356666', feature: '宝山区中心小学' },
        middle: { name: '上海市大华中学', level: 'B', type: '公办', address: '华灵路1391号', phone: '021-66357777', feature: '宝山区重点中学' },
        high: { name: '上海市行知中学', level: 'A', type: '公办市重点', address: '子青路99号', phone: '021-66359999', feature: '上海市实验性示范性高中' }
    },

    // ==================== 松江区 ====================
    '松江大学城万科梦想派': {
        district: '松江区', address: '松江区广富林路1518弄', coordinates: [121.244043, 31.061642],
        street: '广富林街道',
        kindergarten: { name: '松江区龙源幼儿园', level: 'A', type: '公办', address: '龙源路97号', phone: '021-57858888' },
        primary: { name: '上海市松江区民乐学校', level: 'A', type: '公办', address: '人民北路439号', phone: '021-57856666', feature: '松江区重点小学' },
        middle: { name: '上海市松江二中初级中学', level: 'A', type: '公办', address: '邱家湾21号', phone: '021-57857777', feature: '松江二中初中部' },
        high: { name: '上海市松江二中', level: 'A', type: '公办市重点', address: '中山东路250号', phone: '021-57859999', feature: '上海市实验性示范性高中' }
    },
    '九亭象屿都城': {
        district: '松江区', address: '松江区九亭镇沪亭北路750弄', coordinates: [121.334973, 31.124173],
        street: '九亭镇',
        kindergarten: { name: '松江区九亭幼儿园', level: 'A', type: '公办', address: '沪亭北路750弄', phone: '021-57658888' },
        primary: { name: '上海市松江区九亭小学', level: 'B', type: '公办', address: '九亭镇九杜路100号', phone: '021-57656666', feature: '松江区中心小学' },
        middle: { name: '上海市松江区九亭中学', level: 'B', type: '公办', address: '九亭镇涞亭南路559号', phone: '021-57657777', feature: '松江区重点中学' },
        high: { name: '上海市松江一中', level: 'A', type: '公办市重点', address: '松汇中路601号', phone: '021-57659999', feature: '松江区重点中学' }
    },
    '佘山珑原': {
        district: '松江区', address: '松江区辰花路5088弄', coordinates: [121.19824, 31.067941],
        street: '佘山镇',
        kindergarten: { name: '松江区佘山幼儿园', level: 'A', type: '公办', address: '辰花路5088弄', phone: '021-57618888' },
        primary: { name: '上海市松江区佘山学校', level: 'B', type: '公办', address: '佘山镇佘北路180号', phone: '021-57616666', feature: '松江区中心小学' },
        middle: { name: '上海市松江区佘山学校', level: 'B', type: '公办', address: '佘山镇佘北路180号', phone: '021-57617777', feature: '九年一贯制学校' },
        high: { name: '上海市松江二中', level: 'A', type: '公办市重点', address: '中山东路250号', phone: '021-57619999', feature: '上海市实验性示范性高中' }
    },

    // ==================== 青浦区 ====================
    '青浦新城盛青云锦': {
        district: '青浦区', address: '青浦区淀山湖大道399弄', coordinates: [121.100762, 31.152508],
        street: '夏阳街道',
        kindergarten: { name: '青浦区毓秀幼儿园', level: 'A', type: '公办', address: '秀禾路238号', phone: '021-59758888' },
        primary: { name: '上海市青浦区实验小学', level: 'A', type: '公办', address: '城中西路25号', phone: '021-59756666', feature: '青浦区重点小学' },
        middle: { name: '上海市青浦区实验中学', level: 'A', type: '公办', address: '青赵路1118号', phone: '021-59757777', feature: '青浦区重点中学' },
        high: { name: '上海市青浦高级中学', level: 'A', type: '公办市重点', address: '公园东路1100号', phone: '021-59759999', feature: '青浦区重点中学' }
    },
    '徐泾仁恒西郊花园': {
        district: '青浦区', address: '青浦区徐泾镇徐盈路1188弄', coordinates: [121.258179, 31.181903],
        street: '徐泾镇',
        kindergarten: { name: '青浦区徐泾幼儿园', level: 'A', type: '公办', address: '徐盈路1188弄', phone: '021-59728888' },
        primary: { name: '上海市青浦区徐泾小学', level: 'B', type: '公办', address: '徐泾镇育才路288号', phone: '021-59726666', feature: '青浦区中心小学' },
        middle: { name: '上海市青浦区徐泾中学', level: 'B', type: '公办', address: '徐泾镇京华路118号', phone: '021-59727777', feature: '青浦区重点中学' },
        high: { name: '上海市青浦高级中学', level: 'A', type: '公办市重点', address: '公园东路1100号', phone: '021-59729999', feature: '青浦区重点中学' }
    },
    '朱家角璟云里': {
        district: '青浦区', address: '青浦区朱家角镇绿舟路1188弄', coordinates: [121.025777, 31.110254],
        street: '朱家角镇',
        kindergarten: { name: '青浦区朱家角幼儿园', level: 'A', type: '公办', address: '绿舟路1188弄', phone: '021-59248888' },
        primary: { name: '上海市青浦区朱家角小学', level: 'B', type: '公办', address: '朱家角镇新风路175号', phone: '021-59246666', feature: '青浦区中心小学' },
        middle: { name: '上海市青浦区朱家角中学', level: 'B', type: '公办', address: '朱家角镇沙家埭路18号', phone: '021-59247777', feature: '青浦区重点中学' },
        high: { name: '上海市青浦高级中学', level: 'A', type: '公办市重点', address: '公园东路1100号', phone: '021-59249999', feature: '青浦区重点中学' }
    },

    // ==================== 奉贤区 ====================
    '奉贤南桥新城': {
        district: '奉贤区', address: '奉贤区望园路2509弄', coordinates: [121.503183, 30.918142],
        street: '南桥镇',
        kindergarten: { name: '奉贤区南中路幼儿园', level: 'A', type: '公办', address: '南中路68号', phone: '021-57118888' },
        primary: { name: '上海市奉贤区南桥小学', level: 'A', type: '公办', address: '南中路1号', phone: '021-57116666', feature: '奉贤区重点小学' },
        middle: { name: '上海市奉贤区实验中学', level: 'B', type: '公办', address: '秀南路13号', phone: '021-57117777', feature: '奉贤区重点中学' },
        high: { name: '上海市奉贤中学', level: 'A', type: '公办市重点', address: '南奉公路7058号', phone: '021-57119999', feature: '上海市实验性示范性高中' }
    },
    '海湾旅游区棕榈滩': {
        district: '奉贤区', address: '奉贤区海马路3499弄', coordinates: [121.541654, 30.821206],
        street: '海湾镇',
        kindergarten: { name: '奉贤区海湾幼儿园', level: 'A', type: '公办', address: '海马路3499弄', phone: '021-57158888' },
        primary: { name: '上海市奉贤区海湾小学', level: 'B', type: '公办', address: '海湾镇人民塘路1021号', phone: '021-57156666', feature: '奉贤区中心小学' },
        middle: { name: '上海市奉贤区五四学校', level: 'B', type: '公办', address: '海湾镇五四公路1255号', phone: '021-57157777', feature: '奉贤区重点中学' },
        high: { name: '上海市奉贤中学', level: 'A', type: '公办市重点', address: '南奉公路7058号', phone: '021-57159999', feature: '上海市实验性示范性高中' }
    },

    // ==================== 金山区 ====================
    '金山万达华府': {
        district: '金山区', address: '金山区龙皓路1088弄', coordinates: [121.33586, 30.756039],
        street: '山阳镇',
        kindergarten: { name: '金山区早教中心幼儿园', level: 'A', type: '公办', address: '龙皓路1088弄', phone: '021-57958888' },
        primary: { name: '上海市金山区第一实验小学', level: 'A', type: '公办', address: '金山大道251号', phone: '021-57956666', feature: '金山区重点小学' },
        middle: { name: '上海市金山初级中学', level: 'B', type: '公办', address: '杭州大道2800号', phone: '021-57957777', feature: '金山区重点中学' },
        high: { name: '上海市金山中学', level: 'A', type: '公办市重点', address: '众益街899号', phone: '021-57959999', feature: '上海市实验性示范性高中' }
    },
    '枫泾古镇长城逸府': {
        district: '金山区', address: '金山区枫泾镇泾波路529弄', coordinates: [121.030215, 30.900366],
        street: '枫泾镇',
        kindergarten: { name: '金山区枫泾幼儿园', level: 'A', type: '公办', address: '泾波路529弄', phone: '021-57358888' },
        primary: { name: '上海市金山区枫泾小学', level: 'B', type: '公办', address: '枫泾镇北大街265号', phone: '021-57356666', feature: '金山区中心小学' },
        middle: { name: '上海市金山区枫泾中学', level: 'B', type: '公办', address: '枫泾镇白牛路188号', phone: '021-57357777', feature: '金山区重点中学' },
        high: { name: '上海市金山中学', level: 'A', type: '公办市重点', address: '众益街899号', phone: '021-57359999', feature: '上海市实验性示范性高中' }
    },

    // ==================== 崇明区 ====================
    '崇明城桥镇绿地长岛': {
        district: '崇明区', address: '崇明区绿地长岛环路999弄', coordinates: [121.427395, 31.625902],
        street: '城桥镇',
        kindergarten: { name: '崇明区实验幼儿园', level: 'A', type: '公办', address: '绿海路800号', phone: '021-59618888' },
        primary: { name: '上海市崇明区实验小学', level: 'A', type: '公办', address: '八一路459号', phone: '021-59616666', feature: '崇明区重点小学' },
        middle: { name: '上海市崇明区东门中学', level: 'B', type: '公办', address: '育麟桥路388号', phone: '021-59617777', feature: '崇明区重点中学' },
        high: { name: '上海市崇明中学', level: 'A', type: '公办市重点', address: '鼓浪屿路801号', phone: '021-59619999', feature: '崇明区重点中学' }
    },
    '陈家镇揽海路别墅': {
        district: '崇明区', address: '崇明区揽海路1弄', coordinates: [121.824841, 31.463944],
        street: '陈家镇',
        kindergarten: { name: '崇明区陈家镇幼儿园', level: 'A', type: '公办', address: '揽海路1弄', phone: '021-59438888' },
        primary: { name: '上海市崇明区陈家镇小学', level: 'B', type: '公办', address: '陈家镇裕盛路118号', phone: '021-59436666', feature: '崇明区中心小学' },
        middle: { name: '上海市崇明区陈家镇中学', level: 'B', type: '公办', address: '陈家镇安振路188号', phone: '021-59437777', feature: '崇明区重点中学' },
        high: { name: '上海市崇明中学', level: 'A', type: '公办市重点', address: '鼓浪屿路801号', phone: '021-59439999', feature: '崇明区重点中学' }
    },

    // ==================== 徐汇区（领幼托育园Demo） ====================
    '徐汇苑': {
        district: '徐汇区', address: '徐汇区中山南二路1089号', coordinates: [121.443252, 31.178843],
        street: '枫林路街道',
        kindergarten: { name: '徐汇区领幼托育园', level: 'A', type: '民办', address: '中山南二路1089号', phone: '021-54970115' },
        primary: { name: '上海市徐汇区东安二村小学', level: 'B', type: '公办', address: '东安二村120号', phone: '021-64076666', feature: '徐汇区中心小学' },
        middle: { name: '上海市零陵中学', level: 'B', type: '公办', address: '东安路451号', phone: '021-64077777', feature: '徐汇区重点中学' },
        high: { name: '上海市南洋模范中学', level: 'A', type: '公办市重点', address: '零陵路453号', phone: '021-64079999', feature: '上海市实验性示范性高中' }
    },
    '盛大花园': {
        district: '徐汇区', address: '徐汇区龙华路2518弄', coordinates: [121.454377, 31.177717],
        street: '龙华街道',
        kindergarten: { name: '徐汇区领幼托育园', level: 'A', type: '民办', address: '中山南二路1089号', phone: '021-54970115' },
        primary: { name: '上海市徐汇区龙华小学', level: 'B', type: '公办', address: '龙华西路292号', phone: '021-64586666', feature: '徐汇区中心小学' },
        middle: { name: '上海市宛平中学', level: 'B', type: '公办', address: '宛平南路485号', phone: '021-64587777', feature: '徐汇区重点中学' },
        high: { name: '上海市南洋模范中学', level: 'A', type: '公办市重点', address: '零陵路453号', phone: '021-64589999', feature: '上海市实验性示范性高中' }
    },
    '龙吴路11弄小区': {
        district: '徐汇区', address: '徐汇区龙吴路11弄', coordinates: [121.443137, 31.174354],
        street: '龙华街道',
        kindergarten: { name: '徐汇区领幼托育园', level: 'A', type: '民办', address: '中山南二路1089号', phone: '021-54970115' },
        primary: { name: '上海市徐汇区东安三村小学', level: 'B', type: '公办', address: '龙华西路31号', phone: '021-64306666', feature: '徐汇区中心小学' },
        middle: { name: '上海市宛平中学', level: 'B', type: '公办', address: '宛平南路485号', phone: '021-64307777', feature: '徐汇区重点中学' },
        high: { name: '上海市南洋模范中学', level: 'A', type: '公办市重点', address: '零陵路453号', phone: '021-64309999', feature: '上海市实验性示范性高中' }
    },
    '宛平南路500弄小区': {
        district: '徐汇区', address: '徐汇区宛平南路500弄', coordinates: [121.448036, 31.189341],
        street: '徐家汇街道',
        kindergarten: { name: '徐汇区领幼托育园', level: 'A', type: '民办', address: '中山南二路1089号', phone: '021-54970115' },
        primary: { name: '上海市徐汇区光启小学', level: 'A', type: '公办', address: '宛平南路231号', phone: '021-64636666', feature: '徐汇区重点小学' },
        middle: { name: '上海市第四中学', level: 'A', type: '公办', address: '辛耕路153号', phone: '021-64637777', feature: '徐汇区重点中学' },
        high: { name: '上海市南洋模范中学', level: 'A', type: '公办市重点', address: '零陵路453号', phone: '021-64639999', feature: '上海市实验性示范性高中' }
    }
};
