/**
 * data-recipes.js — 菜谱数据库
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.recipes = [...] （全局数组，非 ES Module）
 * 适用环境：file:// 直接打开可用
 *
 * 字段说明：
 *  id            菜谱唯一标识（r_ 前缀）
 *  name          菜名
 *  emoji         展示图标
 *  mealType       适用餐次：breakfast(早餐) / lunch(午餐) / dinner(晚餐)
 *  dishType      菜品类型：主食 / 荤菜 / 素菜 / 汤 / 凉菜
 *  ingredients   用料数组：{ id(食材id), amount(数量), optional(是否可选) }
 *  tags          标签数组（低盐/软嫩易做/高蛋白/儿童友好 等，用于筛选展示）
 *  suitableFor   适配人群：family(全家) / elderly(老人) / child(儿童)
 *  adaptations   分人群适配：
 *      elderly:{ saltReducePct(减盐百分比), cookLongerMin(多煮分钟),
 *                softTip(软嫩处理提示), softnessCheck(熟度判断) }
 *      child :{ cutSize(切配尺寸), antiChoke(防呛噎提示),
 *               nutrition(营养说明) }
 *  cookingSteps  烹饪步骤数组：{ no(序号), text(步骤), duration(分钟),
 *                tip(技巧), safety(安全提示) }
 *  nutrition     营养概算（每份）：{ calories(千卡), protein(克),
 *                carbs(克), fat(克) }
 * -----------------------------------------------------------
 * 覆盖：早餐/午餐/晚餐 × 主食/荤菜/素菜/汤/凉菜
 * 共 17 道家常菜，每道均含完整的 elderly+child 适配与分步骤做法。
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.recipes = [

    /* ===================== 1. 番茄炒蛋（荤菜·早午晚）===================== */
    {
        id: 'r_001', name: '番茄炒蛋', emoji: '🍳',
        mealType: ['breakfast', 'lunch', 'dinner'],
        dishType: '荤菜',
        ingredients: [
            { id: 'i_tomato', amount: 2, optional: false },
            { id: 'i_egg', amount: 3, optional: false },
            { id: 'i_scallion', amount: 1, optional: true },
            { id: 'i_salt', amount: 2, optional: true },
            { id: 'i_cooking_oil', amount: 2, optional: true }
        ],
        tags: ['低盐', '软嫩易做', '高蛋白', '儿童友好'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 3,
                softTip: '番茄去皮、蛋炒嫩一些',
                softnessCheck: '番茄软烂、蛋白凝固即熟'
            },
            child: {
                cutSize: '番茄切≤1cm 小块',
                antiChoke: '去葱白仅用少量葱绿',
                nutrition: '提供优质蛋白与维C'
            }
        },
        cookingSteps: [
            { no: 1, text: '番茄洗净切块，鸡蛋打散', duration: 5, tip: '老人版番茄去皮', safety: '' },
            { no: 2, text: '热锅冷油，蛋液下锅划散盛出', duration: 3, tip: '', safety: '防溅油' },
            { no: 3, text: '下番茄翻炒出汁，回锅鸡蛋，少许盐调味', duration: 4, tip: '儿童版少盐', safety: '' }
        ],
        nutrition: { calories: 180, protein: 9, carbs: 6, fat: 12 }
    },

    /* ===================== 2. 清蒸鲈鱼（荤菜·午晚）===================== */
    {
        id: 'r_002', name: '清蒸鲈鱼', emoji: '🐟',
        mealType: ['lunch', 'dinner'],
        dishType: '荤菜',
        ingredients: [
            { id: 'i_sea_bass', amount: 1, optional: false },
            { id: 'i_scallion', amount: 2, optional: false },
            { id: 'i_ginger', amount: 1, optional: false },
            { id: 'i_cooking_wine', amount: 1, optional: true },
            { id: 'i_soy_sauce', amount: 2, optional: true },
            { id: 'i_cooking_oil', amount: 2, optional: true }
        ],
        tags: ['高蛋白', '低脂', '鲜嫩', '清蒸'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 2,
                softTip: '鱼肉蒸至筷子可轻松刺透、去主刺后给老人',
                softnessCheck: '鱼肉呈蒜瓣状且不透明即熟'
            },
            child: {
                cutSize: '去刺后撕成小块',
                antiChoke: '务必去除所有鱼刺',
                nutrition: '优质蛋白与DHA，易消化'
            }
        },
        cookingSteps: [
            { no: 1, text: '鲈鱼去鳞去内脏洗净，鱼身划两刀，葱姜切丝', duration: 5, tip: '老人版鱼腹黑膜去除干净去腥', safety: '' },
            { no: 2, text: '盘底铺葱姜，鱼放上面，淋料酒', duration: 2, tip: '', safety: '' },
            { no: 3, text: '水开后大火蒸 8-10 分钟', duration: 10, tip: '', safety: '防止蒸汽烫伤' },
            { no: 4, text: '倒掉蒸汁去腥，淋酱油，浇一勺热油激香', duration: 3, tip: '儿童版少酱油', safety: '热油防溅' }
        ],
        nutrition: { calories: 160, protein: 22, carbs: 2, fat: 6 }
    },

    /* ===================== 3. 红烧豆腐（素菜·午晚）===================== */
    {
        id: 'r_003', name: '红烧豆腐', emoji: '🍲',
        mealType: ['lunch', 'dinner'],
        dishType: '素菜',
        ingredients: [
            { id: 'i_tofu', amount: 1, optional: false },
            { id: 'i_scallion', amount: 1, optional: false },
            { id: 'i_ginger', amount: 1, optional: false },
            { id: 'i_soy_sauce', amount: 2, optional: true },
            { id: 'i_cooking_oil', amount: 2, optional: true }
        ],
        tags: ['低盐', '软嫩易做', '素食', '高钙', '老人友好'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 2,
                softTip: '豆腐切小块便于咀嚼，少煎多炖',
                softnessCheck: '豆腐入味呈浅褐色即熟'
            },
            child: {
                cutSize: '豆腐切 1.5cm 小方块',
                antiChoke: '',
                nutrition: '补钙补植物蛋白'
            }
        },
        cookingSteps: [
            { no: 1, text: '豆腐切 2cm 方块，葱姜切末', duration: 3, tip: '', safety: '' },
            { no: 2, text: '热锅冷油，下豆腐煎至两面金黄', duration: 5, tip: '老人版少煎多炖更软', safety: '防溅油' },
            { no: 3, text: '加酱油、小半碗水小火炖 5 分钟收汁', duration: 5, tip: '儿童版少酱油', safety: '' },
            { no: 4, text: '撒葱花出锅', duration: 1, tip: '', safety: '' }
        ],
        nutrition: { calories: 140, protein: 10, carbs: 4, fat: 8 }
    },

    /* ===================== 4. 丝瓜蛋汤（汤·午晚）===================== */
    {
        id: 'r_004', name: '丝瓜蛋汤', emoji: '🥣',
        mealType: ['lunch', 'dinner'],
        dishType: '汤',
        ingredients: [
            { id: 'i_loofah', amount: 1, optional: false },
            { id: 'i_egg', amount: 2, optional: false },
            { id: 'i_scallion', amount: 1, optional: true },
            { id: 'i_cooking_oil', amount: 1, optional: true },
            { id: 'i_salt', amount: 2, optional: true }
        ],
        tags: ['低盐', '清淡', '易消化', '软嫩'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 2,
                softTip: '丝瓜煮至软烂',
                softnessCheck: '丝瓜透明变软即熟'
            },
            child: {
                cutSize: '丝瓜切薄片',
                antiChoke: '',
                nutrition: '补充水分与维C'
            }
        },
        cookingSteps: [
            { no: 1, text: '丝瓜去皮切滚刀块，鸡蛋打散', duration: 3, tip: '', safety: '' },
            { no: 2, text: '热锅少油下丝瓜翻炒', duration: 2, tip: '', safety: '' },
            { no: 3, text: '加水烧开，淋蛋液煮 1 分钟', duration: 3, tip: '蛋液沿锅边淋更均匀', safety: '防热汤溅出' },
            { no: 4, text: '加盐撒葱花出锅', duration: 1, tip: '', safety: '' }
        ],
        nutrition: { calories: 90, protein: 6, carbs: 4, fat: 5 }
    },

    /* ===================== 5. 醋溜土豆丝（素菜·午晚）===================== */
    {
        id: 'r_005', name: '醋溜土豆丝', emoji: '🥔',
        mealType: ['lunch', 'dinner'],
        dishType: '素菜',
        ingredients: [
            { id: 'i_potato', amount: 2, optional: false },
            { id: 'i_scallion', amount: 1, optional: true },
            { id: 'i_vinegar', amount: 2, optional: true },
            { id: 'i_cooking_oil', amount: 2, optional: true },
            { id: 'i_salt', amount: 2, optional: true }
        ],
        tags: ['爽口', '开胃', '快手'],
        suitableFor: ['family', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 2,
                softTip: '土豆丝切细后多煮一会至软',
                softnessCheck: '土豆丝可轻松咬断即熟'
            },
            child: {
                cutSize: '土豆丝切细丝',
                antiChoke: '',
                nutrition: '提供碳水与钾'
            }
        },
        cookingSteps: [
            { no: 1, text: '土豆去皮切细丝，泡水去淀粉', duration: 5, tip: '老人版切细便于咀嚼', safety: '' },
            { no: 2, text: '热锅冷油下葱爆香', duration: 1, tip: '', safety: '' },
            { no: 3, text: '下土豆丝大火快炒，沿锅边淋醋', duration: 4, tip: '', safety: '大火快炒防粘锅' },
            { no: 4, text: '加盐出锅', duration: 1, tip: '', safety: '' }
        ],
        nutrition: { calories: 130, protein: 3, carbs: 22, fat: 4 }
    },

    /* ===================== 6. 黄瓜拌木耳（凉菜·午晚）===================== */
    {
        id: 'r_006', name: '黄瓜拌木耳', emoji: '🥒',
        mealType: ['lunch', 'dinner'],
        dishType: '凉菜',
        ingredients: [
            { id: 'i_cucumber', amount: 1, optional: false },
            { id: 'i_wood_ear', amount: 30, optional: false },
            { id: 'i_garlic', amount: 2, optional: true },
            { id: 'i_vinegar', amount: 2, optional: true },
            { id: 'i_salt', amount: 2, optional: true }
        ],
        tags: ['低盐', '爽脆', '凉拌', '补铁'],
        suitableFor: ['family', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 0,
                softTip: '木耳切碎、黄瓜拍碎便于咀嚼',
                softnessCheck: '木耳煮透回软即熟',
                warning: '老人吃木耳需切碎防呛'
            },
            child: {
                cutSize: '木耳切碎、黄瓜切小片',
                antiChoke: '木耳务必切碎防呛噎',
                nutrition: '补铁清肠'
            }
        },
        cookingSteps: [
            { no: 1, text: '木耳提前泡发洗净撕小朵，黄瓜拍碎', duration: 5, tip: '老人儿童版木耳切碎', safety: '泡发木耳不超过4小时防变质' },
            { no: 2, text: '木耳焯水 2 分钟', duration: 2, tip: '', safety: '防烫' },
            { no: 3, text: '蒜切末，加醋盐调汁', duration: 2, tip: '', safety: '' },
            { no: 4, text: '黄瓜木耳拌入蒜汁即可', duration: 1, tip: '', safety: '' }
        ],
        nutrition: { calories: 70, protein: 3, carbs: 8, fat: 2 }
    },

    /* ===================== 7. 小米粥（主食·早/晚）===================== */
    {
        id: 'r_007', name: '小米粥', emoji: '🥣',
        mealType: ['breakfast', 'dinner'],
        dishType: '主食',
        ingredients: [
            { id: 'i_millet', amount: 1, optional: false },
            { id: 'i_salt', amount: 1, optional: true }
        ],
        tags: ['低盐', '易消化', '养胃', '老人友好', '儿童友好'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 0, cookLongerMin: 5,
                softTip: '多加水熬至软烂',
                softnessCheck: '米粒开花粘稠即熟'
            },
            child: {
                cutSize: '',
                antiChoke: '',
                nutrition: '易消化养胃，补充碳水与B族'
            }
        },
        cookingSteps: [
            { no: 1, text: '小米淘洗 1-2 遍', duration: 2, tip: '', safety: '' },
            { no: 2, text: '锅中加水烧开下小米', duration: 2, tip: '', safety: '防溢锅' },
            { no: 3, text: '小火熬 20 分钟至粘稠', duration: 20, tip: '老人版多熬 5 分钟更软', safety: '' }
        ],
        nutrition: { calories: 120, protein: 3, carbs: 26, fat: 1 }
    },

    /* ===================== 8. 鸡蛋羹（荤菜·早餐）===================== */
    {
        id: 'r_008', name: '鸡蛋羹', emoji: '🥚',
        mealType: ['breakfast'],
        dishType: '荤菜',
        ingredients: [
            { id: 'i_egg', amount: 2, optional: false },
            { id: 'i_salt', amount: 1, optional: true },
            { id: 'i_soy_sauce', amount: 1, optional: true }
        ],
        tags: ['低盐', '软嫩易做', '高蛋白', '老人友好', '儿童友好'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 2,
                softTip: '多加温水蒸至极嫩',
                softnessCheck: '蛋液凝固不流动即熟'
            },
            child: {
                cutSize: '',
                antiChoke: '',
                nutrition: '优质蛋白易吞咽'
            }
        },
        cookingSteps: [
            { no: 1, text: '鸡蛋打散加 1.5 倍温水、少许盐', duration: 3, tip: '温水量决定嫩度', safety: '' },
            { no: 2, text: '过滤蛋液去气泡', duration: 2, tip: '过滤后更细腻', safety: '' },
            { no: 3, text: '水开上锅中小火蒸 8 分钟', duration: 8, tip: '老人版蒸久一点更软', safety: '防蒸汽烫伤' },
            { no: 4, text: '出锅淋少许酱油', duration: 1, tip: '', safety: '' }
        ],
        nutrition: { calories: 100, protein: 8, carbs: 1, fat: 7 }
    },

    /* ===================== 9. 青菜炒香菇（素菜·午晚）===================== */
    {
        id: 'r_009', name: '青菜炒香菇', emoji: '🍃',
        mealType: ['lunch', 'dinner'],
        dishType: '素菜',
        ingredients: [
            { id: 'i_greens', amount: 1, optional: false },
            { id: 'i_shiitake', amount: 6, optional: false },
            { id: 'i_garlic', amount: 2, optional: true },
            { id: 'i_cooking_oil', amount: 2, optional: true },
            { id: 'i_salt', amount: 2, optional: true }
        ],
        tags: ['低盐', '高纤维', '清淡', '素食'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 2,
                softTip: '青菜切小段、香菇切片煮至软',
                softnessCheck: '青菜变软、香菇回软即熟'
            },
            child: {
                cutSize: '青菜切碎、香菇切薄片',
                antiChoke: '',
                nutrition: '补充维生素与膳食纤维'
            }
        },
        cookingSteps: [
            { no: 1, text: '青菜洗净切段，香菇泡发切片', duration: 4, tip: '老人版切碎', safety: '' },
            { no: 2, text: '热锅冷油下蒜爆香', duration: 1, tip: '', safety: '' },
            { no: 3, text: '下香菇翻炒', duration: 2, tip: '', safety: '' },
            { no: 4, text: '下青菜大火快炒，加盐出锅', duration: 2, tip: '', safety: '' }
        ],
        nutrition: { calories: 80, protein: 4, carbs: 6, fat: 4 }
    },

    /* ===================== 10. 胡萝卜炖牛肉（荤菜·午晚）===================== */
    {
        id: 'r_010', name: '胡萝卜炖牛肉', emoji: '🥕',
        mealType: ['lunch', 'dinner'],
        dishType: '荤菜',
        ingredients: [
            { id: 'i_beef', amount: 1, optional: false },
            { id: 'i_carrot', amount: 2, optional: false },
            { id: 'i_ginger', amount: 1, optional: false },
            { id: 'i_soy_sauce', amount: 2, optional: true },
            { id: 'i_cooking_oil', amount: 2, optional: true }
        ],
        tags: ['高蛋白', '补铁', '补维A', '炖菜'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 15,
                softTip: '牛肉炖至软烂、胡萝卜切小块煮至软',
                softnessCheck: '牛肉用筷子可轻松戳透即熟'
            },
            child: {
                cutSize: '牛肉切碎、胡萝卜切小丁',
                antiChoke: '牛肉切碎防噎',
                nutrition: '补铁补维A'
            }
        },
        cookingSteps: [
            { no: 1, text: '牛肉切块焯水去血沫', duration: 8, tip: '老人版牛肉切小块', safety: '焯水防浮沫' },
            { no: 2, text: '胡萝卜切滚刀块，姜切片', duration: 3, tip: '儿童版胡萝卜切小丁便于接受', safety: '' },
            { no: 3, text: '热锅冷油下姜爆香，下牛肉翻炒', duration: 3, tip: '', safety: '防溅油' },
            { no: 4, text: '加酱油、水小火炖 40 分钟', duration: 40, tip: '老人版多炖 15 分钟更软', safety: '' },
            { no: 5, text: '下胡萝卜继续炖 15 分钟', duration: 15, tip: '', safety: '' }
        ],
        nutrition: { calories: 280, protein: 26, carbs: 8, fat: 14 }
    },

    /* ===================== 11. 鲫鱼豆腐汤（汤·午晚）===================== */
    {
        id: 'r_011', name: '鲫鱼豆腐汤', emoji: '🐟',
        mealType: ['lunch', 'dinner'],
        dishType: '汤',
        ingredients: [
            { id: 'i_crucian_carp', amount: 1, optional: false },
            { id: 'i_tofu', amount: 1, optional: false },
            { id: 'i_ginger', amount: 1, optional: false },
            { id: 'i_scallion', amount: 1, optional: false },
            { id: 'i_cooking_oil', amount: 2, optional: true },
            { id: 'i_salt', amount: 2, optional: true }
        ],
        tags: ['高蛋白', '补钙', '鲜美', '下奶'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 5,
                softTip: '汤炖至奶白、豆腐切小块、去鱼刺',
                softnessCheck: '汤色奶白、鱼肉脱骨即熟'
            },
            child: {
                cutSize: '去刺取鱼肉、豆腐切小块',
                antiChoke: '务必去鱼刺',
                nutrition: '补钙补蛋白'
            }
        },
        cookingSteps: [
            { no: 1, text: '鲫鱼去鳞去内脏洗净，豆腐切小块，姜切片', duration: 5, tip: '老人版豆腐切小块', safety: '' },
            { no: 2, text: '热锅冷油下鱼煎至两面金黄', duration: 4, tip: '', safety: '煎鱼防溅油防烫' },
            { no: 3, text: '加姜、水大火烧开转小火炖 20 分钟', duration: 20, tip: '大火炖汤更白', safety: '' },
            { no: 4, text: '下豆腐炖 10 分钟，加盐撒葱花', duration: 10, tip: '', safety: '' }
        ],
        nutrition: { calories: 150, protein: 18, carbs: 3, fat: 7 }
    },

    /* ===================== 12. 凉拌菠菜（凉菜·午晚）===================== */
    {
        id: 'r_012', name: '凉拌菠菜', emoji: '🥬',
        mealType: ['lunch', 'dinner'],
        dishType: '凉菜',
        ingredients: [
            { id: 'i_spinach', amount: 1, optional: false },
            { id: 'i_garlic', amount: 2, optional: true },
            { id: 'i_vinegar', amount: 2, optional: true },
            { id: 'i_salt', amount: 2, optional: true },
            { id: 'i_cooking_oil', amount: 1, optional: true }
        ],
        tags: ['低盐', '补铁', '清爽', '凉拌'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 0,
                softTip: '菠菜焯软切段',
                softnessCheck: '菠菜焯水变软即熟'
            },
            child: {
                cutSize: '菠菜切碎',
                antiChoke: '',
                nutrition: '补铁补叶酸'
            }
        },
        cookingSteps: [
            { no: 1, text: '菠菜洗净', duration: 2, tip: '', safety: '' },
            { no: 2, text: '烧水焯菠菜 1 分钟去草酸', duration: 2, tip: '焯水去草酸利于钙吸收', safety: '开水防烫' },
            { no: 3, text: '蒜切末，加醋盐调汁', duration: 2, tip: '', safety: '' },
            { no: 4, text: '菠菜切段拌入蒜汁', duration: 1, tip: '', safety: '' }
        ],
        nutrition: { calories: 60, protein: 3, carbs: 5, fat: 2 }
    },

    /* ===================== 13. 南瓜小米粥（主食·早/晚）===================== */
    {
        id: 'r_013', name: '南瓜小米粥', emoji: '🎃',
        mealType: ['breakfast', 'dinner'],
        dishType: '主食',
        ingredients: [
            { id: 'i_pumpkin', amount: 1, optional: false },
            { id: 'i_millet', amount: 1, optional: false }
        ],
        tags: ['低盐', '易消化', '养胃', '补维A', '儿童友好'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 0, cookLongerMin: 5,
                softTip: '南瓜煮化与粥融合更软',
                softnessCheck: '南瓜软烂、米粒开花即熟'
            },
            child: {
                cutSize: '南瓜切小块',
                antiChoke: '',
                nutrition: '养胃补维A，带微甜更讨喜'
            }
        },
        cookingSteps: [
            { no: 1, text: '南瓜去皮切小块，小米淘洗', duration: 3, tip: '老人版南瓜切小块易煮化', safety: '' },
            { no: 2, text: '锅中加水下南瓜煮开', duration: 3, tip: '', safety: '防溢锅' },
            { no: 3, text: '下小米小火熬 20 分钟至粘稠', duration: 20, tip: '老人版多熬 5 分钟', safety: '' }
        ],
        nutrition: { calories: 140, protein: 3, carbs: 30, fat: 1 }
    },

    /* ===================== 14. 蒜蓉西兰花（素菜·午晚）===================== */
    {
        id: 'r_014', name: '蒜蓉西兰花', emoji: '🥦',
        mealType: ['lunch', 'dinner'],
        dishType: '素菜',
        ingredients: [
            { id: 'i_broccoli', amount: 1, optional: false },
            { id: 'i_garlic', amount: 3, optional: false },
            { id: 'i_cooking_oil', amount: 2, optional: true },
            { id: 'i_salt', amount: 2, optional: true }
        ],
        tags: ['低盐', '高维C', '高纤维', '抗氧化'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 2,
                softTip: '西兰花焯水煮至软',
                softnessCheck: '西兰花变软即熟'
            },
            child: {
                cutSize: '西兰花切小朵',
                antiChoke: '',
                nutrition: '补维C增强免疫'
            }
        },
        cookingSteps: [
            { no: 1, text: '西兰花掰小朵洗净，蒜切末', duration: 3, tip: '老人版切小朵易煮软', safety: '' },
            { no: 2, text: '烧水焯西兰花 2 分钟', duration: 2, tip: '', safety: '焯水防烫' },
            { no: 3, text: '热锅冷油下蒜爆香', duration: 1, tip: '', safety: '' },
            { no: 4, text: '下西兰花翻炒，加盐出锅', duration: 2, tip: '', safety: '' }
        ],
        nutrition: { calories: 70, protein: 4, carbs: 6, fat: 3 }
    },

    /* ===================== 15. 冬瓜排骨汤（汤·午晚）===================== */
    {
        id: 'r_015', name: '冬瓜排骨汤', emoji: '🍲',
        mealType: ['lunch', 'dinner'],
        dishType: '汤',
        ingredients: [
            { id: 'i_wax_gourd', amount: 1, optional: false },
            { id: 'i_ribs', amount: 1, optional: false },
            { id: 'i_ginger', amount: 1, optional: false },
            { id: 'i_scallion', amount: 1, optional: false },
            { id: 'i_salt', amount: 2, optional: true }
        ],
        tags: ['低盐', '清热', '补钙', '鲜美'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 15,
                softTip: '排骨炖至脱骨、冬瓜煮至软烂',
                softnessCheck: '排骨肉可轻松脱骨即熟'
            },
            child: {
                cutSize: '冬瓜切小块、排骨去骨取肉',
                antiChoke: '去骨给肉防噎',
                nutrition: '补钙清热'
            }
        },
        cookingSteps: [
            { no: 1, text: '排骨焯水去血沫，冬瓜去皮切块', duration: 5, tip: '老人版冬瓜切小块', safety: '焯水防浮沫' },
            { no: 2, text: '热锅冷油下姜葱爆香下排骨翻炒', duration: 3, tip: '', safety: '防溅油' },
            { no: 3, text: '加水大火烧开转小火炖 40 分钟', duration: 40, tip: '', safety: '' },
            { no: 4, text: '下冬瓜炖 15 分钟，加盐', duration: 15, tip: '老人版多炖更软', safety: '' }
        ],
        nutrition: { calories: 220, protein: 20, carbs: 6, fat: 12 }
    },

    /* ===================== 16. 番茄鸡蛋面（主食·早/午）===================== */
    {
        id: 'r_016', name: '番茄鸡蛋面', emoji: '🍜',
        mealType: ['breakfast', 'lunch'],
        dishType: '主食',
        ingredients: [
            { id: 'i_noodles', amount: 1, optional: false },
            { id: 'i_tomato', amount: 1, optional: false },
            { id: 'i_egg', amount: 2, optional: false },
            { id: 'i_scallion', amount: 1, optional: true },
            { id: 'i_cooking_oil', amount: 2, optional: true },
            { id: 'i_salt', amount: 2, optional: true }
        ],
        tags: ['低盐', '快手', '营养均衡', '儿童友好'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 2,
                softTip: '面条煮软、番茄去皮',
                softnessCheck: '面条无硬心即熟'
            },
            child: {
                cutSize: '面条剪短、番茄切小块',
                antiChoke: '面条剪短防缠绕',
                nutrition: '碳水蛋白维C兼顾'
            }
        },
        cookingSteps: [
            { no: 1, text: '番茄切块，鸡蛋打散，葱切花', duration: 3, tip: '老人版番茄去皮', safety: '' },
            { no: 2, text: '热锅冷油炒蛋盛出', duration: 2, tip: '', safety: '防溅油' },
            { no: 3, text: '下番茄炒出汁，加水烧开', duration: 3, tip: '', safety: '' },
            { no: 4, text: '下面条煮熟，回锅鸡蛋，撒葱花', duration: 5, tip: '老人版面条多煮 2 分钟更软', safety: '防热汤溅出' }
        ],
        nutrition: { calories: 320, protein: 12, carbs: 48, fat: 8 }
    },

    /* ===================== 17. 香菇鸡肉粥（主食·早/晚）===================== */
    {
        id: 'r_017', name: '香菇鸡肉粥', emoji: '🍚',
        mealType: ['breakfast', 'dinner'],
        dishType: '主食',
        ingredients: [
            { id: 'i_rice', amount: 1, optional: false },
            { id: 'i_chicken_breast', amount: 1, optional: false },
            { id: 'i_shiitake', amount: 5, optional: false },
            { id: 'i_ginger', amount: 1, optional: false },
            { id: 'i_salt', amount: 2, optional: true }
        ],
        tags: ['低盐', '易消化', '养胃', '高蛋白', '老人友好'],
        suitableFor: ['family', 'elderly', 'child'],
        adaptations: {
            elderly: {
                saltReducePct: 50, cookLongerMin: 10,
                softTip: '鸡肉撕成丝、粥熬至软烂',
                softnessCheck: '米粒开花、鸡肉撕得动即熟'
            },
            child: {
                cutSize: '鸡肉切碎、香菇切丁',
                antiChoke: '',
                nutrition: '补蛋白养胃'
            }
        },
        cookingSteps: [
            { no: 1, text: '大米淘洗，鸡胸肉切丁，香菇泡发切丁，姜切末', duration: 5, tip: '老人版鸡肉撕丝', safety: '' },
            { no: 2, text: '锅中加水下大米烧开', duration: 3, tip: '', safety: '防溢锅' },
            { no: 3, text: '下鸡丁、香菇、姜末小火熬 30 分钟', duration: 30, tip: '老人版多熬 10 分钟', safety: '' },
            { no: 4, text: '加盐调味', duration: 1, tip: '', safety: '' }
        ],
        nutrition: { calories: 200, protein: 14, carbs: 30, fat: 3 }
    }

];

/* ============ 便捷查询工具（挂载到同一对象，供引擎/UI 使用） ============ */

// 按 id 查找菜谱
SMART_MENU.getRecipeById = function (id) {
    var list = SMART_MENU.recipes;
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) return list[i];
    }
    return null;
};

// 按餐次筛选（breakfast/lunch/dinner）
SMART_MENU.getRecipesByMeal = function (meal) {
    return SMART_MENU.recipes.filter(function (r) {
        return r.mealType.indexOf(meal) > -1;
    });
};

// 按菜品类型筛选（主食/荤菜/素菜/汤/凉菜）
SMART_MENU.getRecipesByDish = function (dish) {
    return SMART_MENU.recipes.filter(function (r) {
        return r.dishType === dish;
    });
};

// 按标签筛选（命中任一标签即返回）
SMART_MENU.getRecipesByTag = function (tag) {
    return SMART_MENU.recipes.filter(function (r) {
        return r.tags.indexOf(tag) > -1;
    });
};
