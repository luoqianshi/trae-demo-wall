var ObjectConfig = (function() {
    'use strict';

    var RARITY_CONFIG = {
        common: { name: '普通', color: '#9ca3af' },
        rare: { name: '稀有', color: '#4a6f95' },
        epic: { name: '史诗', color: '#6b5ce0' },
        legendary: { name: '传说', color: '#c9a227' }
    };

    var ROOM_CATEGORIES = {
        living_room: { name: '客厅', icon: '🛋️' },
        bedroom: { name: '卧室', icon: '🛏️' },
        kitchen: { name: '厨房', icon: '🍳' },
        bathroom: { name: '卫生间', icon: '🚿' },
        decoration: { name: '装饰', icon: '🎨' }
    };

    var STAGE_CONFIGS = {
        stage0: {
            name: '毛坯阶段',
            objects: [
                {
                    id: 'cement_wall',
                    name: '水泥墙',
                    type: 'structure',
                    width: 120,
                    height: 100,
                    defaultX: 100,
                    defaultY: 200,
                    layer: 'background',
                    animationType: 'fadeScale',
                    icon: '🧱',
                    rarity: 'common',
                    roomCategory: null,
                    description: '毛坯房的原始墙面，等待被精心装扮~',
                    guidanceMessage: '这是水泥墙，是家的基础哦~'
                },
                {
                    id: 'cement_floor',
                    name: '水泥地',
                    type: 'structure',
                    width: 140,
                    height: 60,
                    defaultX: 340,
                    defaultY: 400,
                    layer: 'background',
                    animationType: 'fadeScale',
                    icon: '⬜',
                    rarity: 'common',
                    roomCategory: null,
                    description: '平整的水泥地面，未来会铺上美美的地板~',
                    guidanceMessage: '水泥地已经铺好了，接下来就要开始装修啦！'
                },
                {
                    id: 'building_materials',
                    name: '建筑材料',
                    type: 'material',
                    width: 70,
                    height: 70,
                    defaultX: 580,
                    defaultY: 280,
                    layer: 'mid',
                    animationType: 'build',
                    icon: '🏗️',
                    rarity: 'common',
                    roomCategory: null,
                    description: '各种建筑材料堆放在一起，装修正式开始！',
                    guidanceMessage: '建筑材料都准备好了，开工！'
                },
                {
                    id: 'toolbox',
                    name: '工具箱',
                    type: 'tool',
                    width: 55,
                    height: 55,
                    defaultX: 700,
                    defaultY: 380,
                    layer: 'foreground',
                    animationType: 'dropBounce',
                    icon: '🧰',
                    rarity: 'rare',
                    roomCategory: null,
                    description: '装修师傅的百宝箱，各种工具一应俱全~',
                    guidanceMessage: '工具箱里什么都有，有问题随时找我~'
                }
            ]
        },
        stage1: {
            name: '设计阶段',
            objects: [
                {
                    id: 'blueprint',
                    name: '图纸',
                    type: 'design',
                    width: 80,
                    height: 65,
                    defaultX: 120,
                    defaultY: 180,
                    layer: 'mid',
                    animationType: 'fadeScale',
                    icon: '📐',
                    rarity: 'common',
                    roomCategory: null,
                    description: '精心设计的装修蓝图，家的模样就在这里~'
                },
                {
                    id: 'tape_measure',
                    name: '卷尺',
                    type: 'tool',
                    width: 50,
                    height: 50,
                    defaultX: 260,
                    defaultY: 250,
                    layer: 'mid',
                    animationType: 'dropBounce',
                    icon: '📏',
                    rarity: 'common',
                    roomCategory: null,
                    description: '精准测量每一寸空间，尺寸可是装修的关键！'
                },
                {
                    id: 'design_tools',
                    name: '设计工具',
                    type: 'tool',
                    width: 65,
                    height: 65,
                    defaultX: 400,
                    defaultY: 190,
                    layer: 'mid',
                    animationType: 'grow',
                    icon: '✏️',
                    rarity: 'rare',
                    roomCategory: null,
                    description: '设计师的得力助手，画出理想的家~'
                },
                {
                    id: 'sample_board',
                    name: '样板',
                    type: 'design',
                    width: 75,
                    height: 75,
                    defaultX: 560,
                    defaultY: 260,
                    layer: 'mid',
                    animationType: 'build',
                    icon: '🎨',
                    rarity: 'rare',
                    roomCategory: null,
                    description: '各种材质色卡样板，选对颜色家就成功了一半！'
                }
            ]
        },
        stage2: {
            name: '水电阶段',
            objects: [
                {
                    id: 'wire_pipe',
                    name: '电线管',
                    type: 'material',
                    width: 60,
                    height: 60,
                    defaultX: 140,
                    defaultY: 320,
                    layer: 'background',
                    animationType: 'build',
                    icon: '🔌',
                    rarity: 'common',
                    roomCategory: null,
                    description: '隐蔽工程的电线管，用电安全第一！'
                },
                {
                    id: 'water_pipe',
                    name: '水管',
                    type: 'material',
                    width: 60,
                    height: 60,
                    defaultX: 280,
                    defaultY: 350,
                    layer: 'background',
                    animationType: 'fadeScale',
                    icon: '🚿',
                    rarity: 'common',
                    roomCategory: null,
                    description: '水管走顶不走地，检修方便更安心~'
                },
                {
                    id: 'distribution_box',
                    name: '配电箱',
                    type: 'equipment',
                    width: 70,
                    height: 80,
                    defaultX: 440,
                    defaultY: 280,
                    layer: 'mid',
                    animationType: 'dropBounce',
                    icon: '⚡',
                    rarity: 'rare',
                    roomCategory: null,
                    description: '家里的电力中枢，合理分配每一度电~'
                },
                {
                    id: 'slotting_tool',
                    name: '开槽工具',
                    type: 'tool',
                    width: 55,
                    height: 55,
                    defaultX: 600,
                    defaultY: 340,
                    layer: 'foreground',
                    animationType: 'grow',
                    icon: '🔨',
                    rarity: 'common',
                    roomCategory: null,
                    description: '水电改造必备神器，横平竖直才规范！'
                }
            ]
        },
        stage3: {
            name: '泥木阶段',
            objects: [
                {
                    id: 'tiles',
                    name: '瓷砖',
                    type: 'material',
                    width: 70,
                    height: 70,
                    defaultX: 130,
                    defaultY: 280,
                    layer: 'background',
                    animationType: 'build',
                    icon: '🟫',
                    rarity: 'common',
                    roomCategory: null,
                    description: '漂亮的瓷砖，让家更有质感~'
                },
                {
                    id: 'paint_bucket',
                    name: '油漆桶',
                    type: 'material',
                    width: 55,
                    height: 65,
                    defaultX: 270,
                    defaultY: 310,
                    layer: 'mid',
                    animationType: 'dropBounce',
                    icon: '🪣',
                    rarity: 'common',
                    roomCategory: null,
                    description: '环保油漆桶，给家换上温暖的新装~'
                },
                {
                    id: 'wood_board',
                    name: '木板',
                    type: 'material',
                    width: 90,
                    height: 50,
                    defaultX: 420,
                    defaultY: 250,
                    layer: 'mid',
                    animationType: 'fadeScale',
                    icon: '🪵',
                    rarity: 'rare',
                    roomCategory: null,
                    description: '优质实木板材，打造结实耐用的家具~'
                },
                {
                    id: 'cement_bag',
                    name: '水泥袋',
                    type: 'material',
                    width: 60,
                    height: 70,
                    defaultX: 580,
                    defaultY: 300,
                    layer: 'foreground',
                    animationType: 'grow',
                    icon: '🏜️',
                    rarity: 'common',
                    roomCategory: null,
                    description: '瓦工的好帮手，粘砖砌墙都靠它~'
                }
            ]
        },
        stage4: {
            name: '安装阶段',
            objects: [
                {
                    id: 'lamp',
                    name: '灯具',
                    type: 'furniture',
                    width: 60,
                    height: 70,
                    defaultX: 150,
                    defaultY: 150,
                    layer: 'foreground',
                    animationType: 'dropBounce',
                    icon: '💡',
                    rarity: 'rare',
                    roomCategory: 'living_room',
                    description: '温馨的吊灯，夜晚也能照亮家的每个角落~'
                },
                {
                    id: 'floor',
                    name: '地板',
                    type: 'structure',
                    width: 120,
                    height: 50,
                    defaultX: 320,
                    defaultY: 420,
                    layer: 'background',
                    animationType: 'build',
                    icon: '🟫',
                    rarity: 'rare',
                    roomCategory: 'living_room',
                    description: '木地板铺好了，光脚踩上去真舒服~'
                },
                {
                    id: 'door',
                    name: '门',
                    type: 'structure',
                    width: 70,
                    height: 110,
                    defaultX: 500,
                    defaultY: 180,
                    layer: 'mid',
                    animationType: 'grow',
                    icon: '🚪',
                    rarity: 'rare',
                    roomCategory: 'bedroom',
                    description: '一扇好门，守护家的安全与温暖~'
                },
                {
                    id: 'cabinet',
                    name: '橱柜',
                    type: 'furniture',
                    width: 90,
                    height: 90,
                    defaultX: 650,
                    defaultY: 280,
                    layer: 'mid',
                    animationType: 'fadeScale',
                    icon: '🗄️',
                    rarity: 'epic',
                    roomCategory: 'kitchen',
                    description: '收纳神器！再多杂物都能藏得整整齐齐~'
                },
                {
                    id: 'window',
                    name: '窗户',
                    type: 'structure',
                    width: 80,
                    height: 80,
                    defaultX: 100,
                    defaultY: 120,
                    layer: 'background',
                    animationType: 'fadeScale',
                    icon: '🪟',
                    rarity: 'rare',
                    roomCategory: 'living_room',
                    description: '明亮的落地窗，阳光洒进来暖洋洋~'
                },
                {
                    id: 'nordic_sofa',
                    name: '北欧风沙发',
                    type: 'furniture',
                    width: 110,
                    height: 80,
                    defaultX: 180,
                    defaultY: 320,
                    layer: 'mid',
                    animationType: 'fadeScale',
                    icon: '🛋️',
                    rarity: 'epic',
                    roomCategory: 'living_room',
                    description: '简约舒适的北欧风沙发，客厅的灵魂所在~'
                },
                {
                    id: 'minimal_tv_stand',
                    name: '极简电视柜',
                    type: 'furniture',
                    width: 100,
                    height: 50,
                    defaultX: 380,
                    defaultY: 350,
                    layer: 'mid',
                    animationType: 'build',
                    icon: '📺',
                    rarity: 'rare',
                    roomCategory: 'living_room',
                    description: '极简主义电视柜，美观又实用~'
                },
                {
                    id: 'floor_lamp',
                    name: '落地灯',
                    type: 'furniture',
                    width: 40,
                    height: 90,
                    defaultX: 600,
                    defaultY: 200,
                    layer: 'foreground',
                    animationType: 'grow',
                    icon: '🪔',
                    rarity: 'rare',
                    roomCategory: 'living_room',
                    description: '温馨的落地灯，营造舒适的阅读角落~'
                }
            ]
        },
        stage5: {
            name: '软装阶段',
            objects: [
                {
                    id: 'sofa',
                    name: '沙发',
                    type: 'furniture',
                    width: 110,
                    height: 80,
                    defaultX: 180,
                    defaultY: 320,
                    layer: 'mid',
                    animationType: 'fadeScale',
                    icon: '🛋️',
                    rarity: 'rare',
                    roomCategory: 'living_room',
                    description: '柔软舒适的沙发，葛优躺的最佳拍档~'
                },
                {
                    id: 'table',
                    name: '餐桌',
                    type: 'furniture',
                    width: 85,
                    height: 70,
                    defaultX: 380,
                    defaultY: 350,
                    layer: 'mid',
                    animationType: 'build',
                    icon: '🪑',
                    rarity: 'rare',
                    roomCategory: 'kitchen',
                    description: '实用的餐桌，一家人围坐吃饭真幸福~'
                },
                {
                    id: 'chair',
                    name: '餐椅',
                    type: 'furniture',
                    width: 55,
                    height: 65,
                    defaultX: 530,
                    defaultY: 370,
                    layer: 'foreground',
                    animationType: 'dropBounce',
                    icon: '💺',
                    rarity: 'common',
                    roomCategory: 'kitchen',
                    description: '舒服的餐椅，吃饭也要有仪式感~'
                },
                {
                    id: 'curtain',
                    name: '窗帘',
                    type: 'decoration',
                    width: 70,
                    height: 120,
                    defaultX: 90,
                    defaultY: 100,
                    layer: 'background',
                    animationType: 'grow',
                    icon: '🪟',
                    rarity: 'rare',
                    roomCategory: 'bedroom',
                    description: '飘逸的窗帘，瞬间提升家的氛围感~'
                },
                {
                    id: 'plant',
                    name: '绿植盆栽',
                    type: 'decoration',
                    width: 60,
                    height: 75,
                    defaultX: 680,
                    defaultY: 300,
                    layer: 'foreground',
                    animationType: 'grow',
                    icon: '🪴',
                    rarity: 'common',
                    roomCategory: 'living_room',
                    description: '生机勃勃的绿植，让家充满大自然的气息~'
                },
                {
                    id: 'painting',
                    name: '装饰画',
                    type: 'decoration',
                    width: 65,
                    height: 55,
                    defaultX: 300,
                    defaultY: 160,
                    layer: 'mid',
                    animationType: 'fadeScale',
                    icon: '🖼️',
                    rarity: 'rare',
                    roomCategory: 'decoration',
                    description: '精美的装饰画，墙面不再单调~'
                },
                {
                    id: 'carpet',
                    name: '地毯',
                    type: 'decoration',
                    width: 120,
                    height: 80,
                    defaultX: 200,
                    defaultY: 380,
                    layer: 'background',
                    animationType: 'fadeScale',
                    icon: '🧶',
                    rarity: 'epic',
                    roomCategory: 'living_room',
                    description: '柔软的地毯，赤脚踩上去真舒服~'
                },
                {
                    id: 'wood_bed',
                    name: '实木双人床',
                    type: 'furniture',
                    width: 120,
                    height: 90,
                    defaultX: 400,
                    defaultY: 280,
                    layer: 'mid',
                    animationType: 'build',
                    icon: '🛏️',
                    rarity: 'epic',
                    roomCategory: 'bedroom',
                    description: '优质实木双人床，每晚都有好睡眠~'
                },
                {
                    id: 'nightstand',
                    name: '床头柜',
                    type: 'furniture',
                    width: 50,
                    height: 55,
                    defaultX: 550,
                    defaultY: 310,
                    layer: 'mid',
                    animationType: 'dropBounce',
                    icon: '🗄️',
                    rarity: 'rare',
                    roomCategory: 'bedroom',
                    description: '精致的床头柜，睡前读物的好去处~'
                },
                {
                    id: 'wardrobe',
                    name: '衣柜',
                    type: 'furniture',
                    width: 90,
                    height: 120,
                    defaultX: 100,
                    defaultY: 180,
                    layer: 'mid',
                    animationType: 'grow',
                    icon: '🚪',
                    rarity: 'epic',
                    roomCategory: 'bedroom',
                    description: '大容量衣柜，再多衣服也能装下~'
                },
                {
                    id: 'dresser',
                    name: '梳妆台',
                    type: 'furniture',
                    width: 70,
                    height: 80,
                    defaultX: 620,
                    defaultY: 250,
                    layer: 'mid',
                    animationType: 'fadeScale',
                    icon: '💄',
                    rarity: 'epic',
                    roomCategory: 'bedroom',
                    description: '美美的梳妆台，每天都是精致的一天~'
                },
                {
                    id: 'integrated_cabinet',
                    name: '整体橱柜',
                    type: 'furniture',
                    width: 100,
                    height: 90,
                    defaultX: 150,
                    defaultY: 300,
                    layer: 'mid',
                    animationType: 'build',
                    icon: '🗄️',
                    rarity: 'legendary',
                    roomCategory: 'kitchen',
                    description: '定制整体橱柜，厨房收纳的终极解决方案~'
                },
                {
                    id: 'built_in_fridge',
                    name: '嵌入式冰箱',
                    type: 'equipment',
                    width: 60,
                    height: 100,
                    defaultX: 300,
                    defaultY: 280,
                    layer: 'mid',
                    animationType: 'grow',
                    icon: '🧊',
                    rarity: 'epic',
                    roomCategory: 'kitchen',
                    description: '嵌入式冰箱，美观又省空间~'
                },
                {
                    id: 'range_hood',
                    name: '抽油烟机',
                    type: 'equipment',
                    width: 70,
                    height: 60,
                    defaultX: 450,
                    defaultY: 200,
                    layer: 'foreground',
                    animationType: 'dropBounce',
                    icon: '💨',
                    rarity: 'rare',
                    roomCategory: 'kitchen',
                    description: '强力抽油烟机，远离油烟困扰~'
                },
                {
                    id: 'dining_set',
                    name: '餐桌椅套装',
                    type: 'furniture',
                    width: 90,
                    height: 70,
                    defaultX: 580,
                    defaultY: 340,
                    layer: 'mid',
                    animationType: 'fadeScale',
                    icon: '🍽️',
                    rarity: 'epic',
                    roomCategory: 'kitchen',
                    description: '精致餐桌椅套装，用餐更有仪式感~'
                },
                {
                    id: 'sideboard',
                    name: '餐边柜',
                    type: 'furniture',
                    width: 80,
                    height: 70,
                    defaultX: 680,
                    defaultY: 300,
                    layer: 'mid',
                    animationType: 'build',
                    icon: '🗄️',
                    rarity: 'rare',
                    roomCategory: 'kitchen',
                    description: '实用餐边柜，餐具酒水都能放~'
                },
                {
                    id: 'smart_toilet',
                    name: '智能马桶',
                    type: 'equipment',
                    width: 55,
                    height: 65,
                    defaultX: 120,
                    defaultY: 320,
                    layer: 'mid',
                    animationType: 'dropBounce',
                    icon: '🚽',
                    rarity: 'epic',
                    roomCategory: 'bathroom',
                    description: '智能马桶，享受科技带来的舒适~'
                },
                {
                    id: 'sink',
                    name: '洗手台',
                    type: 'equipment',
                    width: 65,
                    height: 70,
                    defaultX: 280,
                    defaultY: 300,
                    layer: 'mid',
                    animationType: 'build',
                    icon: '🚰',
                    rarity: 'rare',
                    roomCategory: 'bathroom',
                    description: '精致洗手台，洗漱也能很享受~'
                },
                {
                    id: 'shower_head',
                    name: '淋浴花洒',
                    type: 'equipment',
                    width: 40,
                    height: 80,
                    defaultX: 420,
                    defaultY: 220,
                    layer: 'foreground',
                    animationType: 'grow',
                    icon: '🚿',
                    rarity: 'rare',
                    roomCategory: 'bathroom',
                    description: '雨淋式花洒，洗澡像做SPA~'
                },
                {
                    id: 'bathroom_cabinet',
                    name: '浴室柜',
                    type: 'furniture',
                    width: 60,
                    height: 80,
                    defaultX: 560,
                    defaultY: 280,
                    layer: 'mid',
                    animationType: 'fadeScale',
                    icon: '🗄️',
                    rarity: 'rare',
                    roomCategory: 'bathroom',
                    description: '防潮浴室柜，洗漱用品好收纳~'
                },
                {
                    id: 'vase',
                    name: '花瓶',
                    type: 'decoration',
                    width: 40,
                    height: 55,
                    defaultX: 250,
                    defaultY: 260,
                    layer: 'foreground',
                    animationType: 'dropBounce',
                    icon: '🏺',
                    rarity: 'rare',
                    roomCategory: 'decoration',
                    description: '精美花瓶，插上鲜花心情都变好了~'
                },
                {
                    id: 'table_lamp',
                    name: '台灯',
                    type: 'decoration',
                    width: 35,
                    height: 50,
                    defaultX: 480,
                    defaultY: 250,
                    layer: 'foreground',
                    animationType: 'grow',
                    icon: '💡',
                    rarity: 'common',
                    roomCategory: 'decoration',
                    description: '温馨的台灯，深夜阅读的好伙伴~'
                },
                {
                    id: 'pillow',
                    name: '抱枕',
                    type: 'decoration',
                    width: 45,
                    height: 40,
                    defaultX: 350,
                    defaultY: 330,
                    layer: 'foreground',
                    animationType: 'dropBounce',
                    icon: '🧸',
                    rarity: 'common',
                    roomCategory: 'decoration',
                    description: '软萌抱枕，靠上去就不想起来~'
                },
                {
                    id: 'wall_clock',
                    name: '挂钟',
                    type: 'decoration',
                    width: 45,
                    height: 45,
                    defaultX: 550,
                    defaultY: 150,
                    layer: 'mid',
                    animationType: 'fadeScale',
                    icon: '🕐',
                    rarity: 'rare',
                    roomCategory: 'decoration',
                    description: '简约挂钟，装点墙面又实用~'
                },
                {
                    id: 'mirror',
                    name: '镜子',
                    type: 'decoration',
                    width: 50,
                    height: 80,
                    defaultX: 650,
                    defaultY: 180,
                    layer: 'mid',
                    animationType: 'fadeScale',
                    icon: '🪞',
                    rarity: 'rare',
                    roomCategory: 'decoration',
                    description: '全身镜，出门前整理仪容必备~'
                },
                {
                    id: 'golden_vase',
                    name: '鎏金花瓶',
                    type: 'decoration',
                    width: 45,
                    height: 60,
                    defaultX: 300,
                    defaultY: 230,
                    layer: 'foreground',
                    animationType: 'dropBounce',
                    icon: '🏺',
                    rarity: 'legendary',
                    roomCategory: 'decoration',
                    description: '珍贵的鎏金花瓶，收藏级艺术品~'
                }
            ]
        }
    };

    var ALL_OBJECTS = {};

    (function initAllObjects() {
        for (var stageKey in STAGE_CONFIGS) {
            if (STAGE_CONFIGS.hasOwnProperty(stageKey)) {
                var stage = STAGE_CONFIGS[stageKey];
                for (var i = 0; i < stage.objects.length; i++) {
                    var obj = stage.objects[i];
                    obj.stage = stageKey;
                    if (!obj.rarity) obj.rarity = 'common';
                    ALL_OBJECTS[obj.id] = obj;
                }
            }
        }
    })();

    function getConfig(objectId) {
        return ALL_OBJECTS[objectId] || null;
    }

    function getStageObjects(stageId) {
        var stage = STAGE_CONFIGS[stageId];
        return stage ? stage.objects : [];
    }

    function getStageConfig(stageId) {
        return STAGE_CONFIGS[stageId] || null;
    }

    function getAllStages() {
        var stages = [];
        for (var key in STAGE_CONFIGS) {
            if (STAGE_CONFIGS.hasOwnProperty(key)) {
                stages.push({
                    id: key,
                    name: STAGE_CONFIGS[key].name,
                    objects: STAGE_CONFIGS[key].objects
                });
            }
        }
        return stages;
    }

    function getAllObjects() {
        var result = [];
        for (var key in ALL_OBJECTS) {
            if (ALL_OBJECTS.hasOwnProperty(key)) {
                result.push(ALL_OBJECTS[key]);
            }
        }
        return result;
    }

    function getObjectsByType(type) {
        var result = [];
        for (var key in ALL_OBJECTS) {
            if (ALL_OBJECTS.hasOwnProperty(key) && ALL_OBJECTS[key].type === type) {
                result.push(ALL_OBJECTS[key]);
            }
        }
        return result;
    }

    function getObjectsByRoomCategory(roomCategory) {
        var result = [];
        for (var key in ALL_OBJECTS) {
            if (ALL_OBJECTS.hasOwnProperty(key) && ALL_OBJECTS[key].roomCategory === roomCategory) {
                result.push(ALL_OBJECTS[key]);
            }
        }
        return result;
    }

    function getObjectsByRarity(rarity) {
        var result = [];
        for (var key in ALL_OBJECTS) {
            if (ALL_OBJECTS.hasOwnProperty(key) && ALL_OBJECTS[key].rarity === rarity) {
                result.push(ALL_OBJECTS[key]);
            }
        }
        return result;
    }

    function getObjectCount() {
        var count = 0;
        for (var key in ALL_OBJECTS) {
            if (ALL_OBJECTS.hasOwnProperty(key)) {
                count++;
            }
        }
        return count;
    }

    function getRarityConfig() {
        return RARITY_CONFIG;
    }

    function getRoomCategories() {
        return ROOM_CATEGORIES;
    }

    var STAGE_DIALOGUES = [
        [
            '装修准备得怎么样啦？风格定好了吗？',
            '有什么装修上的问题随时问我哦~',
            '第一步很重要的，咱们慢慢来~',
            '需要我给您讲讲装修流程吗？',
            '别着急，我们一步一步来~',
            '您对装修风格有想法了吗？'
        ],
        [
            '现在在做结构改造吧？注意安全哦~',
            '水电改造可是隐蔽工程，要仔细把关~',
            '有什么问题随时找我商量~',
            '这一步很关键，有什么不懂的问我~',
            '记得多去现场看看哦~',
            '防水一定要做好，不然后期麻烦~'
        ],
        [
            '瓦工木工进行中，家慢慢有样子了吧？',
            '瓷砖贴得怎么样啦？空鼓率检查了吗？',
            '柜子做出来效果满意吗？',
            '这时候最有成就感了，看着家一点点变好~',
            '有什么选材上的问题可以问我~',
            '记得验收要仔细哦~'
        ],
        [
            '油漆和软装阶段啦，马上就要完工了！',
            '墙面颜色选好了吗？上墙效果怎么样？',
            '地板铺好了吗？脚感是不是很舒服？',
            '灯具选得怎么样了？氛围感很重要哦~',
            '现在可以开始看家具了呢~',
            '越到最后越要耐心，细节决定品质~'
        ],
        [
            '保洁都做好了吧？是不是亮堂堂的？',
            '家具都进场了吗？家的感觉出来了吧？',
            '家电都调试好了吗？',
            '马上就能住新家了，激动不激动？',
            '入住前记得测甲醛哦~',
            '搬家的时候记得保护好家具和地板~'
        ],
        [
            '恭喜恭喜！终于住新家啦！',
            '乔迁之喜！小管家也替您开心~',
            '住得还习惯吗？有什么问题随时找我~',
            '新家收拾得怎么样啦？',
            '记得有质保期的，有问题及时找装修公司~',
            '祝您在新家里每天都开开心心的~'
        ]
    ];

    function getStageDialogues(stageIndex) {
        var idx = Math.max(0, Math.min(stageIndex, STAGE_DIALOGUES.length - 1));
        return STAGE_DIALOGUES[idx] || [];
    }

    function getRandomStageDialogue(stageIndex) {
        var dialogues = getStageDialogues(stageIndex);
        if (dialogues.length === 0) return '';
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    }

    function getObjectGuidanceMessage(objectId) {
        var obj = ALL_OBJECTS[objectId];
        if (obj && obj.guidanceMessage) {
            return obj.guidanceMessage;
        }
        if (obj && obj.name) {
            return '看！' + obj.name + ' 已经就位了~';
        }
        return '又有新东西啦，快来看看~';
    }

    return {
        getConfig: getConfig,
        getStageObjects: getStageObjects,
        getStageConfig: getStageConfig,
        getAllStages: getAllStages,
        getAllObjects: getAllObjects,
        getObjectsByType: getObjectsByType,
        getObjectsByRoomCategory: getObjectsByRoomCategory,
        getObjectsByRarity: getObjectsByRarity,
        getObjectCount: getObjectCount,
        getRarityConfig: getRarityConfig,
        getRoomCategories: getRoomCategories,
        getStageDialogues: getStageDialogues,
        getRandomStageDialogue: getRandomStageDialogue,
        getObjectGuidanceMessage: getObjectGuidanceMessage,
        STAGES: STAGE_CONFIGS,
        OBJECTS: ALL_OBJECTS,
        DIALOGUES: STAGE_DIALOGUES,
        RARITY: RARITY_CONFIG,
        ROOMS: ROOM_CATEGORIES
    };
})();
