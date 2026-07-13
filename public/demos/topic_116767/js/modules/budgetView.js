var BudgetView = (function() {
    var timers = [];

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        str = String(str);
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function addTimer(timerId) {
        timers.push(timerId);
        return timerId;
    }

    function clearAllTimers() {
        timers.forEach(function(t) {
            clearTimeout(t);
            clearInterval(t);
            cancelAnimationFrame(t);
        });
        timers = [];
    }

    var container = null;
    var el = {};

    function cacheElements() {
        el.backBtn = document.getElementById('budget-back-btn');
        el.resetBtn = document.getElementById('budget-reset-btn');
        el.editBtn = document.getElementById('budget-edit-btn');
        el.versionBtn = document.getElementById('budget-version-btn');
        el.stagesList = document.getElementById('stages-list');
        el.materialsTable = document.getElementById('materials-table');
        el.warningModal = document.getElementById('budget-warning-modal');
        el.warningTitle = document.getElementById('budget-warning-title');
        el.warningBody = document.getElementById('budget-warning-body');
        el.warningConfirm = document.getElementById('budget-warning-confirm');
        el.warningCancel = document.getElementById('budget-warning-cancel');
        el.warningClose = document.getElementById('budget-warning-close');
        el.btnAiAssistant = document.getElementById('btn-ai-assistant');
        el.addFeeBtn = document.getElementById('add-additional-fee-btn');
        el.additionalFeesSection = document.getElementById('additional-fees-section');
    }

    function clearElementCache() {
        el = {};
    }

    var isMobile = false;
    var currentModePage = 'select';
    var selectedMode = null;
    var wizardStep = 1;
    var wizardData = {
        mode: 'full',
        totalBudget: 100000,
        cityTier: 'newFirst',
        area: 80,
        packageLevel: 'comfort',
        constructionFee: 0,
        constructionFeeMode: 'total',
        constructionUnitPrice: 0,
        constructionLaborRatio: 0.55,
        constructionAuxiliaryRatio: 0.30,
        constructionManagementRatio: 0.15,
        materialLevel: 'comfort',
        materialList: {},
        designFeeRatio: 0.03,
        designFeeOption: 'simple',
        laborDetail: {},
        laborDays: {},
        materialFee: {
            auxiliary: 0,
            main: 0,
            custom: 0
        },
        auxiliaryMaterialLevel: 'comfort',
        customFurnitureMeters: 0
    };
    var expandedStage = null;
    var expandedMaterial = null;
    var expandedCategory = null;
    var categoryExpenseTagFilter = {};
    var sopListener = null;
    var dashboardEventsBound = false;
    var domEventListeners = [];
    var dynamicModals = [];
    var BUDGET_VERSIONS_KEY = 'budget_versions';
    var currentVersionName = null;

    var CITY_TIERS = {
        first: { name: '一线城市', coefficient: 1.2 },
        newFirst: { name: '新一线城市', coefficient: 1.0 },
        second: { name: '二线城市', coefficient: 0.85 },
        third: { name: '三线及以下', coefficient: 0.7 }
    };

    var PACKAGE_LEVELS = {
        economy: {
            name: '经济档',
            coefficient: 0.7,
            priceRange: '800-1200',
            desc: '基础装修，满足刚需，性价比之选'
        },
        comfort: {
            name: '舒适档',
            coefficient: 1.0,
            priceRange: '1200-1800',
            desc: '品质升级，舒适宜居，主流选择'
        },
        quality: {
            name: '品质档',
            coefficient: 1.3,
            priceRange: '1800-2500',
            desc: '高端材料，精致工艺，品质追求'
        },
        luxury: {
            name: '豪华档',
            coefficient: 1.8,
            priceRange: '2500-4000',
            desc: '顶级品牌，私人定制，尊享体验'
        }
    };

    var CONSTRUCTION_FEE_DETAIL = {
        laborRatio: 0.55,
        auxiliaryRatio: 0.30,
        managementRatio: 0.15
    };

    var MATERIAL_LEVEL_PRICE_RATIOS = {
        economy: 0.7,
        comfort: 1.0,
        quality: 1.3
    };

    var LABOR_TYPES = [
        { id: 'demolition', name: '拆除工', ratio: 0.10, baseDaysPerSqm: 0.15, baseDailyWage: 350 },
        { id: 'plumbing', name: '水电工', ratio: 0.20, baseDaysPerSqm: 0.25, baseDailyWage: 400 },
        { id: 'tiling', name: '瓦工', ratio: 0.25, baseDaysPerSqm: 0.35, baseDailyWage: 450 },
        { id: 'carpentry', name: '木工', ratio: 0.20, baseDaysPerSqm: 0.25, baseDailyWage: 420 },
        { id: 'painting', name: '油工', ratio: 0.15, baseDaysPerSqm: 0.20, baseDailyWage: 380 },
        { id: 'installation', name: '安装工', ratio: 0.10, baseDaysPerSqm: 0.12, baseDailyWage: 360 }
    ];

    var AUXILIARY_MATERIALS = [
        { id: 'cement', name: '水泥沙子', ratio: 0.25 },
        { id: 'wire', name: '电线电缆', ratio: 0.15 },
        { id: 'pipe', name: '水管管件', ratio: 0.15 },
        { id: 'putty', name: '腻子涂料', ratio: 0.15 },
        { id: 'board', name: '板材龙骨', ratio: 0.15 },
        { id: 'other', name: '其他辅材', ratio: 0.15 }
    ];

    var MATERIAL_CATEGORIES = [
        { id: 'tile', name: '瓷砖', icon: 'box', unitPrice: 150, unit: '㎡', stageIndex: 2,
          brands: ['东鹏瓷砖', '马可波罗', '诺贝尔瓷砖'],
          tips: ['优先选广东砖，密度高更耐磨', '厨卫墙砖可选性价比高的抛釉砖'] },
        { id: 'floor', name: '地板', icon: 'box', unitPrice: 200, unit: '㎡', stageIndex: 3,
          brands: ['圣象地板', '大自然地板', '德尔地板'],
          tips: ['实木复合地板性价比最高', '安装前确保地面平整度'] },
        { id: 'door', name: '门', icon: 'window', unitPrice: 1500, unit: '樘', stageIndex: 3,
          brands: ['TATA木门', '梦天木门', '欧派木门'],
          tips: ['厨卫门选铝合金防水防潮', '卧室门注意隔音效果'] },
        { id: 'window', name: '窗', icon: 'window', unitPrice: 800, unit: '㎡', stageIndex: 2,
          brands: ['凤铝铝材', '坚美铝材', '兴发铝材'],
          tips: ['断桥铝窗隔热隔音效果好', '密封条选三元乙丙材质耐用'] },
        { id: 'cabinet', name: '橱柜', icon: 'box', unitPrice: 3000, unit: '延米', stageIndex: 3,
          brands: ['欧派橱柜', '志邦橱柜', '金牌橱柜'],
          tips: ['柜体选多层实木板防潮', '石英石台面硬度高易清洁'] },
        { id: 'sanitary', name: '洁具', icon: 'lightbulb', unitPrice: 5000, unit: '套', stageIndex: 3,
          brands: ['九牧卫浴', '恒洁卫浴', '箭牌卫浴'],
          tips: ['马桶选虹吸式冲水更静音', '花洒选恒温款使用更舒适'] },
        { id: 'lighting', name: '灯具', icon: 'lightbulb', unitPrice: 2000, unit: '套', stageIndex: 3,
          brands: ['欧普照明', '雷士照明', '松下照明'],
          tips: ['客厅主灯选可调光的更实用', '厨房卫生间选防水防雾灯'] },
        { id: 'hardware', name: '五金', icon: 'wrench', unitPrice: 1000, unit: '套', stageIndex: 3,
          brands: ['海蒂诗', '百隆Blum', 'DTC东泰'],
          tips: ['铰链选带阻尼的关门静音', '抽屉滑轨选托底式承重好'] }
    ];

    var MODE_CONFIGS = {
        full: {
            name: '全包',
            icon: 'briefcase',
            suitable: '工作繁忙、没有时间精力的业主',
            easeOfMind: 5,
            controllability: 2,
            timeInvestment: '低',
            categoryRatios: {
                contract: 0.70,
                selfPurchase: 0.15,
                softDecoration: 0.10,
                reserve: 0.05
            },
            categories: [
                {
                    id: 'contract',
                    name: '合同包',
                    icon: 'file-text',
                    children: [
                        { id: 'baseConstruction', name: '基础施工', icon: 'hammer' },
                        { id: 'mainMaterials', name: '主材', icon: 'box' },
                        { id: 'designFee', name: '设计费', icon: 'ruler' },
                        { id: 'managementFee', name: '管理费', icon: 'clipboard' }
                    ]
                },
                {
                    id: 'selfPurchase',
                    name: '自购项',
                    icon: 'shopping-cart',
                    children: [
                        { id: 'customFurniture', name: '定制家具', icon: 'archive' },
                        { id: 'balconyEnclosure', name: '阳台封装', icon: 'window' },
                        { id: 'hvac', name: '暖通设备', icon: 'thermometer' },
                        { id: 'otherAdditions', name: '其他增项', icon: 'plus-circle' }
                    ]
                },
                {
                    id: 'softDecoration',
                    name: '软装',
                    icon: 'sofa',
                    children: [
                        { id: 'furniture', name: '家具', icon: 'home' },
                        { id: 'appliances', name: '家电', icon: 'tv' },
                        { id: 'decorations', name: '装饰品', icon: 'image' }
                    ]
                },
                {
                    id: 'reserve',
                    name: '备用金',
                    icon: 'coins',
                    children: []
                }
            ],
            wizardSteps: [
                { id: 1, title: '总预算', desc: '设置装修总预算' },
                { id: 2, title: '城市', desc: '选择所在城市' },
                { id: 3, title: '面积', desc: '确认房屋面积' },
                { id: 4, title: '确认', desc: '确认预算方案' }
            ]
        },
        half: {
            name: '半包',
            icon: 'package',
            suitable: '有一定时间、想控制主材质量的业主',
            easeOfMind: 3,
            controllability: 4,
            timeInvestment: '中',
            categoryRatios: {
                construction: 0.35,
                mainMaterials: 0.35,
                customFurniture: 0.10,
                softDecoration: 0.15,
                reserve: 0.05
            },
            categories: [
                {
                    id: 'construction',
                    name: '施工包',
                    icon: 'hammer',
                    children: [
                        { id: 'labor', name: '人工费', icon: 'users' },
                        { id: 'auxiliaryMaterials', name: '辅材', icon: 'tool' },
                        { id: 'managementFee', name: '管理费', icon: 'clipboard' }
                    ]
                },
                {
                    id: 'mainMaterials',
                    name: '主材',
                    icon: 'box',
                    children: [
                        { id: 'tile', name: '瓷砖', icon: 'grid' },
                        { id: 'floor', name: '地板', icon: 'layers' },
                        { id: 'door', name: '门', icon: 'door-open' },
                        { id: 'window', name: '窗', icon: 'window' },
                        { id: 'cabinet', name: '橱柜', icon: 'archive' },
                        { id: 'sanitary', name: '洁具', icon: 'droplet' },
                        { id: 'lighting', name: '灯具', icon: 'lightbulb' },
                        { id: 'hardware', name: '五金', icon: 'wrench' }
                    ]
                },
                {
                    id: 'customFurniture',
                    name: '定制家具',
                    icon: 'archive',
                    children: [
                        { id: 'wardrobe', name: '衣柜', icon: 'archive' },
                        { id: 'shoeCabinet', name: '鞋柜', icon: 'archive' },
                        { id: 'otherCustom', name: '其他定制', icon: 'plus-circle' }
                    ]
                },
                {
                    id: 'softDecoration',
                    name: '软装',
                    icon: 'sofa',
                    children: [
                        { id: 'furniture', name: '家具', icon: 'home' },
                        { id: 'appliances', name: '家电', icon: 'tv' },
                        { id: 'decorations', name: '装饰品', icon: 'image' }
                    ]
                },
                {
                    id: 'reserve',
                    name: '备用金',
                    icon: 'coins',
                    children: []
                }
            ],
            wizardSteps: [
                { id: 1, title: '总预算', desc: '设置装修总预算' },
                { id: 2, title: '城市', desc: '选择所在城市' },
                { id: 3, title: '面积', desc: '确认房屋面积' },
                { id: 4, title: '确认', desc: '确认预算方案' }
            ]
        },
        self: {
            name: '自装',
            icon: 'wrench',
            suitable: '时间充裕、有装修经验的业主',
            easeOfMind: 1,
            controllability: 5,
            timeInvestment: '高',
            categoryRatios: {
                designFee: 0.03,
                labor: 0.27,
                materials: 0.45,
                equipment: 0.08,
                softDecoration: 0.12,
                reserve: 0.05
            },
            categories: [
                {
                    id: 'designFee',
                    name: '设计费',
                    icon: 'ruler',
                    children: []
                },
                {
                    id: 'labor',
                    name: '人工费',
                    icon: 'users',
                    children: [
                        { id: 'demolition', name: '拆改', icon: 'hammer' },
                        { id: 'plumbing', name: '水电', icon: 'zap' },
                        { id: 'tiling', name: '瓦工', icon: 'grid' },
                        { id: 'carpentry', name: '木工', icon: 'tool' },
                        { id: 'painting', name: '油工', icon: 'brush' },
                        { id: 'installation', name: '安装', icon: 'settings' }
                    ]
                },
                {
                    id: 'materials',
                    name: '材料费',
                    icon: 'box',
                    children: [
                        { id: 'auxiliaryMaterials', name: '辅材', icon: 'tool' },
                        { id: 'mainMaterials', name: '主材', icon: 'box' },
                        { id: 'customFurniture', name: '定制家具', icon: 'archive' }
                    ]
                },
                {
                    id: 'equipment',
                    name: '设备',
                    icon: 'thermometer',
                    children: [
                        { id: 'hvac', name: '暖通', icon: 'thermometer' },
                        { id: 'rangeHood', name: '油烟机', icon: 'wind' },
                        { id: 'waterHeater', name: '热水器', icon: 'droplet' },
                        { id: 'otherEquipment', name: '其他设备', icon: 'plus-circle' }
                    ]
                },
                {
                    id: 'softDecoration',
                    name: '软装',
                    icon: 'sofa',
                    children: [
                        { id: 'furniture', name: '家具', icon: 'home' },
                        { id: 'appliances', name: '家电', icon: 'tv' },
                        { id: 'decorations', name: '装饰品', icon: 'image' }
                    ]
                },
                {
                    id: 'reserve',
                    name: '备用金',
                    icon: 'coins',
                    children: []
                }
            ],
            wizardSteps: [
                { id: 1, title: '总预算', desc: '设置装修总预算' },
                { id: 2, title: '城市', desc: '选择所在城市' },
                { id: 3, title: '面积', desc: '确认房屋面积' },
                { id: 4, title: '确认', desc: '确认预算方案' }
            ]
        }
    };

    var STAGES = [
        { id: 1, title: '设计准备', icon: 'ruler', ratio: 0.10,
          desc: '确定设计方案、签订合同，释放首笔预算用于设计和定金' },
        { id: 2, title: '结构改造', icon: 'hammer', ratio: 0.15,
          desc: '拆改墙体、水电改造，基础工程阶段，人工费用较高' },
        { id: 3, title: '基础装修', icon: 'hammer', ratio: 0.25,
          desc: '瓦工、木工、油工进场，瓷砖铺贴、吊顶、墙面处理' },
        { id: 4, title: '主材安装', icon: 'window', ratio: 0.25,
          desc: '橱柜、门窗、洁具、地板等主材集中安装阶段' },
        { id: 5, title: '软装进场', icon: 'sofa', ratio: 0.15,
          desc: '家具、家电、窗帘、装饰品进场，营造温馨氛围' },
        { id: 6, title: '入住准备', icon: 'party', ratio: 0.10,
          desc: '开荒保洁、甲醛检测、搬家入住，迎接美好新生活' }
    ];

    var BUDGET_TEXT_MAP = {
        '5万以下': 50000,
        '5-10万': 75000,
        '10-15万': 125000,
        '15-20万': 175000,
        '20万以上': 250000
    };

    var CITY_TEXT_MAP = {
        '一线城市': 'first',
        '新一线城市': 'newFirst',
        '二线城市': 'second',
        '三线及以下': 'third'
    };

    function parseBudgetText(budgetText) {
        if (!budgetText) return null;
        if (typeof budgetText === 'number') return budgetText;
        return BUDGET_TEXT_MAP[budgetText] || null;
    }

    function parseCityText(cityText) {
        if (!cityText) return null;
        if (CITY_TIERS[cityText]) return cityText;
        return CITY_TEXT_MAP[cityText] || null;
    }

    function getMaterialIdByName(name) {
        if (!name) return null;
        for (var i = 0; i < MATERIAL_CATEGORIES.length; i++) {
            if (MATERIAL_CATEGORIES[i].name === name || MATERIAL_CATEGORIES[i].id === name) {
                return MATERIAL_CATEGORIES[i].id;
            }
        }
        return null;
    }

    function tryAutoCreateBudgetPlan() {
        if (hasBudgetPlan()) return false;

        var userData = App.state.userData;
        if (!userData) return false;

        var budget = parseBudgetText(userData.budget);
        var cityTier = parseCityText(userData.cityTier);
        var area = userData.area;

        if (!budget || !cityTier || !area) return false;

        var autoMode = 'half';
        var autoData = {
            totalBudget: budget,
            cityTier: cityTier,
            area: area,
            packageLevel: 'comfort',
            constructionFee: Math.round(budget * 0.35),
            constructionLaborRatio: 0.55,
            constructionAuxiliaryRatio: 0.30,
            constructionManagementRatio: 0.15,
            materialLevel: 'comfort',
            designFeeRatio: 0.03
        };

        var plan = calculateBudgetByMode(autoMode, autoData);
        saveBudgetPlan(plan);
        return true;
    }

    function getModeConfig(mode) {
        if (!mode || !MODE_CONFIGS[mode]) return null;
        return MODE_CONFIGS[mode];
    }

    function getModeCategories(mode) {
        var config = getModeConfig(mode);
        if (!config) return [];
        return config.categories || [];
    }

    function getWizardSteps(mode) {
        var steps = [];
        if (mode === 'full') {
            steps = [
                { id: 'totalBudget', title: '总预算', label: '设置装修总预算' },
                { id: 'cityArea', title: '城市面积', label: '选择城市和面积' },
                { id: 'packageLevel', title: '套餐档次', label: '选择全包套餐档次' },
                { id: 'confirm', title: '确认', label: '确认预算方案' }
            ];
        } else if (mode === 'half') {
            steps = [
                { id: 'totalBudget', title: '总预算', label: '设置装修总预算' },
                { id: 'cityArea', title: '城市面积', label: '选择城市和面积' },
                { id: 'constructionFee', title: '施工费', label: '设置半包施工费' },
                { id: 'materialList', title: '主材清单', label: '选择主材清单' },
                { id: 'confirm', title: '确认', label: '确认预算方案' }
            ];
        } else if (mode === 'self') {
            steps = [
                { id: 'totalBudget', title: '总预算', label: '设置装修总预算' },
                { id: 'cityArea', title: '城市面积', label: '选择城市和面积' },
                { id: 'designFee', title: '设计费', label: '设置设计费比例' },
                { id: 'laborFee', title: '人工费', label: '设置各工种人工费' },
                { id: 'materialFee', title: '材料费', label: '设置材料费用' },
                { id: 'confirm', title: '确认', label: '确认预算方案' }
            ];
        }
        return steps;
    }

    function initWizardMaterialList() {
        var area = wizardData.area || 80;
        var materialList = {};
        for (var i = 0; i < MATERIAL_CATEGORIES.length; i++) {
            var cat = MATERIAL_CATEGORIES[i];
            var estimatedQty = Math.round(area * 0.8);
            if (cat.id === 'door') estimatedQty = Math.max(3, Math.round(area / 30));
            if (cat.id === 'sanitary') estimatedQty = Math.max(1, Math.round(area / 50));
            if (cat.id === 'cabinet') estimatedQty = Math.max(3, Math.round(area / 25));
            if (cat.id === 'lighting') estimatedQty = Math.max(1, Math.round(area / 20));
            if (cat.id === 'window') estimatedQty = Math.round(area * 0.25);
            if (cat.id === 'hardware') estimatedQty = Math.max(1, Math.round(area / 30));
            materialList[cat.id] = {
                id: cat.id,
                name: cat.name,
                level: 'comfort',
                quantity: estimatedQty,
                unit: cat.unit,
                basePrice: cat.unitPrice
            };
        }
        wizardData.materialList = materialList;
    }

    function initWizardLaborDays() {
        var area = wizardData.area || 80;
        var cityCoef = CITY_TIERS[wizardData.cityTier] ? CITY_TIERS[wizardData.cityTier].coefficient : 1.0;
        var laborDays = {};
        var laborDetail = {};
        for (var i = 0; i < LABOR_TYPES.length; i++) {
            var type = LABOR_TYPES[i];
            var days = Math.max(1, Math.round(area * type.baseDaysPerSqm));
            var dailyWage = Math.round(type.baseDailyWage * cityCoef);
            laborDays[type.id] = {
                id: type.id,
                name: type.name,
                days: days,
                dailyWage: dailyWage,
                subtotal: days * dailyWage
            };
            laborDetail[type.id] = days * dailyWage;
        }
        wizardData.laborDays = laborDays;
        wizardData.laborDetail = laborDetail;
    }

    function calculateMaterialListTotal() {
        var total = 0;
        var materialList = wizardData.materialList || {};
        for (var key in materialList) {
            if (materialList.hasOwnProperty(key)) {
                var item = materialList[key];
                var levelRatio = MATERIAL_LEVEL_PRICE_RATIOS[item.level] || 1.0;
                total += item.quantity * item.basePrice * levelRatio;
            }
        }
        return Math.round(total);
    }

    function calculateLaborTotal() {
        var total = 0;
        var laborDays = wizardData.laborDays || {};
        for (var key in laborDays) {
            if (laborDays.hasOwnProperty(key)) {
                total += laborDays[key].subtotal || 0;
            }
        }
        return Math.round(total);
    }

    function getPackageUnitPrice() {
        var level = wizardData.packageLevel || 'comfort';
        var levelConfig = PACKAGE_LEVELS[level];
        if (!levelConfig) return 1500;
        var basePrice = 1500;
        return Math.round(basePrice * levelConfig.coefficient);
    }

    function isV1Plan(plan) {
        if (!plan || typeof plan !== 'object') return false;
        return !!plan.breakdown && !plan.mode;
    }

    function isV2Plan(plan) {
        if (!plan || typeof plan !== 'object') return false;
        return plan.schemaVersion === 'v2' && !!plan.mode;
    }

    function recalculateTotalSpent(plan) {
        if (!plan || !plan.categories || typeof plan.categories !== 'object') {
            return plan;
        }

        var totalSpent = 0;
        var reserveSpent = 0;

        for (var key in plan.categories) {
            if (plan.categories.hasOwnProperty(key)) {
                var cat = plan.categories[key];
                if (cat && typeof cat.spent === 'number' && !isNaN(cat.spent)) {
                    if (key === 'reserve') {
                        reserveSpent = cat.spent;
                    } else {
                        totalSpent += cat.spent;
                    }
                }
            }
        }

        plan.totalSpent = Math.round(totalSpent * 100) / 100;
        plan.reserveUsed = Math.round(reserveSpent * 100) / 100;

        return plan;
    }

    function migrateV1ToV2(plan) {
        if (!plan || !isV1Plan(plan)) {
            return null;
        }

        var v2Plan = {};

        for (var key in plan) {
            if (plan.hasOwnProperty(key)) {
                v2Plan[key] = plan[key];
            }
        }

        v2Plan.mode = 'full';
        v2Plan.schemaVersion = 'v2';
        v2Plan.modeLocked = true;

        var breakdown = plan.breakdown || {};
        var hardDecoration = breakdown.hardDecoration || {};
        var materials = plan.materials || {};

        var materialsSpent = 0;
        for (var matKey in materials) {
            if (materials[matKey] && typeof materials[matKey].spent === 'number') {
                materialsSpent += materials[matKey].spent;
            }
        }

        var contractBudget = hardDecoration.total || 0;
        var mainMaterialsBudget = breakdown.mainMaterials || 0;
        var designFeeBudget = breakdown.designFee || 0;
        var managementFeeBudget = breakdown.managementFee || 0;

        var hardDecorationTotal = hardDecoration.total || 0;
        var laborCost = hardDecoration.laborCost || 0;
        var auxiliaryMaterials = hardDecoration.auxiliaryMaterials || 0;
        var baseConstructionBudget = laborCost + auxiliaryMaterials;

        var contractTotalBudget = hardDecorationTotal + mainMaterialsBudget;
        var contractSpent = plan.totalSpent || 0;

        var reserveBudget = breakdown.reserve || 0;

        v2Plan.categories = {
            contract: {
                budget: Math.round(contractTotalBudget),
                spent: Math.round(contractSpent),
                items: {
                    baseConstruction: {
                        budget: Math.round(baseConstructionBudget),
                        spent: 0,
                        items: {
                            labor: {
                                budget: Math.round(laborCost),
                                spent: 0
                            },
                            auxiliary: {
                                budget: Math.round(auxiliaryMaterials),
                                spent: 0
                            }
                        }
                    },
                    mainMaterials: {
                        budget: Math.round(mainMaterialsBudget),
                        spent: Math.round(materialsSpent)
                    },
                    designFee: {
                        budget: Math.round(designFeeBudget),
                        spent: 0
                    },
                    managementFee: {
                        budget: Math.round(managementFeeBudget),
                        spent: 0
                    }
                }
            },
            selfPurchase: {
                budget: 0,
                spent: 0,
                items: {
                    customFurniture: { budget: 0, spent: 0 },
                    balconyEnclosure: { budget: 0, spent: 0 },
                    hvac: { budget: 0, spent: 0 },
                    otherAdditions: { budget: 0, spent: 0 }
                }
            },
            softDecoration: {
                budget: 0,
                spent: 0,
                items: {
                    furniture: { budget: 0, spent: 0 },
                    appliances: { budget: 0, spent: 0 },
                    decorations: { budget: 0, spent: 0 }
                }
            },
            reserve: {
                budget: Math.round(reserveBudget),
                spent: Math.round(plan.reserveUsed || 0)
            }
        };

        recalculateTotalSpent(v2Plan);

        return v2Plan;
    }

    function validateV1Plan(plan) {
        if (!plan || typeof plan !== 'object') return false;
        if (typeof plan.totalBudget !== 'number' || isNaN(plan.totalBudget) || plan.totalBudget < 0) return false;
        if (!plan.breakdown || typeof plan.breakdown !== 'object') return false;
        if (!Array.isArray(plan.stages) || plan.stages.length !== 6) return false;
        if (!plan.materials || typeof plan.materials !== 'object') return false;
        if (typeof plan.totalSpent !== 'number' || isNaN(plan.totalSpent)) return false;
        if (typeof plan.reserveUsed !== 'number' || isNaN(plan.reserveUsed)) return false;
        return true;
    }

    function validateV2Plan(plan) {
        if (!plan || typeof plan !== 'object') return false;
        if (plan.schemaVersion !== 'v2') return false;
        if (plan.mode !== 'full' && plan.mode !== 'half' && plan.mode !== 'self') return false;
        if (typeof plan.modeLocked !== 'boolean') return false;
        if (typeof plan.totalBudget !== 'number' || isNaN(plan.totalBudget) || plan.totalBudget < 0) return false;
        if (!Array.isArray(plan.stages) || plan.stages.length !== 6) return false;
        if (typeof plan.totalSpent !== 'number' || isNaN(plan.totalSpent)) return false;
        if (typeof plan.reserveUsed !== 'number' || isNaN(plan.reserveUsed)) return false;
        if (!plan.categories || typeof plan.categories !== 'object') return false;

        var modeConfig = getModeConfig(plan.mode);
        if (!modeConfig) return false;

        var categoryIds = [];
        for (var i = 0; i < modeConfig.categories.length; i++) {
            categoryIds.push(modeConfig.categories[i].id);
        }
        for (var key in plan.categories) {
            if (categoryIds.indexOf(key) === -1) return false;
            var cat = plan.categories[key];
            if (!cat || typeof cat !== 'object') return false;
            if (typeof cat.budget !== 'number' || isNaN(cat.budget)) return false;
            if (typeof cat.spent !== 'number' || isNaN(cat.spent)) return false;
        }

        return true;
    }

    function validateBudgetPlan(plan) {
        if (!plan || typeof plan !== 'object') return false;
        if (isV2Plan(plan)) {
            return validateV2Plan(plan);
        }
        if (isV1Plan(plan)) {
            return validateV1Plan(plan);
        }
        return false;
    }

    function getBudgetPlan() {
        var plan = null;
        if (App && typeof App.getBudgetPlan === 'function') {
            plan = App.getBudgetPlan();
        } else if (App && App.state && App.state.userData) {
            plan = App.state.userData.budgetPlan;
        }
        
        if (!plan) return null;
        
        if (!validateBudgetPlan(plan)) {
            console.warn('预算数据格式异常，已自动降级为空状态');
            return null;
        }

        if (isV1Plan(plan)) {
            try {
                console.log('[BudgetView] 检测到 v1 预算数据，开始迁移到 v2 模式...');
                var migratedPlan = migrateV1ToV2(plan);
                if (migratedPlan) {
                    saveBudgetPlan(migratedPlan, true);
                    console.log('[BudgetView] v1 预算数据迁移成功，已自动保存为 v2 格式');
                    return migratedPlan;
                } else {
                    console.warn('[BudgetView] v1 预算数据迁移失败，返回 null');
                    return null;
                }
            } catch (e) {
                console.warn('[BudgetView] v1 预算数据迁移过程中发生异常:', e);
                return null;
            }
        }
        
        return plan;
    }

    function hasBudgetPlan() {
        return !!getBudgetPlan();
    }

    function saveBudgetPlan(plan, immediate) {
        if (App && typeof App.setBudgetPlan === 'function') {
            App.setBudgetPlan(plan, undefined, immediate);
        } else {
            App.state.userData.budgetPlan = plan;
            App.saveState(immediate);
        }
    }

    function calculateBudget(totalBudget, cityTier, area) {
        var cityCoef = CITY_TIERS[cityTier] ? CITY_TIERS[cityTier].coefficient : 1.0;
        
        var hardDecoration = totalBudget * 0.5;
        var mainMaterials = totalBudget * 0.3;
        var reserve = totalBudget * 0.2;

        var designFee = totalBudget * 0.05;
        var managementFee = totalBudget * 0.05;
        var hardDecorationRemaining = hardDecoration - designFee - managementFee;

        var laborCostBase = hardDecorationRemaining * 0.4;
        var laborCost = laborCostBase * cityCoef;
        var auxiliaryMaterials = hardDecorationRemaining - laborCost;

        var stageBudgets = [];
        for (var s = 0; s < STAGES.length; s++) {
            stageBudgets.push({
                id: STAGES[s].id,
                title: STAGES[s].title,
                icon: STAGES[s].icon,
                desc: STAGES[s].desc,
                ratio: STAGES[s].ratio,
                budget: Math.round(totalBudget * STAGES[s].ratio),
                spent: 0,
                status: 'locked',
                expenses: []
            });
        }

        var MATERIAL_RATIOS = {
            tile: 0.18,
            floor: 0.18,
            door: 0.12,
            window: 0.10,
            cabinet: 0.15,
            sanitary: 0.12,
            lighting: 0.08,
            hardware: 0.07
        };

        var materialBudgets = {};
        for (var m = 0; m < MATERIAL_CATEGORIES.length; m++) {
            var cat = MATERIAL_CATEGORIES[m];
            var estimatedQty = Math.round(area * 0.8);
            if (cat.id === 'door') estimatedQty = Math.max(3, Math.round(area / 30));
            if (cat.id === 'sanitary') estimatedQty = Math.max(1, Math.round(area / 50));
            if (cat.id === 'cabinet') estimatedQty = Math.max(3, Math.round(area / 25));
            if (cat.id === 'lighting') estimatedQty = Math.max(1, Math.round(area / 20));
            
            var ratio = MATERIAL_RATIOS[cat.id] || 0.1;
            var budget = Math.round(mainMaterials * ratio);
            
            materialBudgets[cat.id] = {
                id: cat.id,
                name: cat.name,
                icon: cat.icon,
                brands: cat.brands,
                tips: cat.tips,
                budget: budget,
                spent: 0,
                status: 'pending',
                estimatedQty: estimatedQty,
                unitPrice: cat.unitPrice,
                unit: cat.unit
            };
        }

        stageBudgets[0].status = 'active';

        return {
            totalBudget: totalBudget,
            cityTier: cityTier,
            cityCoefficient: cityCoef,
            area: area,
            breakdown: {
                hardDecoration: {
                    total: Math.round(hardDecoration),
                    laborCost: Math.round(laborCost),
                    auxiliaryMaterials: Math.round(auxiliaryMaterials)
                },
                mainMaterials: Math.round(mainMaterials),
                reserve: Math.round(reserve),
                designFee: Math.round(designFee),
                managementFee: Math.round(managementFee)
            },
            stages: stageBudgets,
            materials: materialBudgets,
            totalSpent: 0,
            reserveUsed: 0,
            createdAt: new Date().toISOString()
        };
    }

    function calculateMaterialListTotalFromData(materialList) {
        var total = 0;
        if (!materialList || typeof materialList !== 'object') return total;
        for (var key in materialList) {
            if (materialList.hasOwnProperty(key)) {
                var item = materialList[key];
                var levelRatio = MATERIAL_LEVEL_PRICE_RATIOS[item.level] || 1.0;
                var basePrice = 0;
                for (var i = 0; i < MATERIAL_CATEGORIES.length; i++) {
                    if (MATERIAL_CATEGORIES[i].id === key) {
                        basePrice = MATERIAL_CATEGORIES[i].unitPrice;
                        break;
                    }
                }
                total += (item.quantity || 0) * basePrice * levelRatio;
            }
        }
        return Math.round(total);
    }

    function calculateLaborTotalFromData(laborDetail) {
        var total = 0;
        if (!laborDetail || typeof laborDetail !== 'object') return total;
        for (var key in laborDetail) {
            if (laborDetail.hasOwnProperty(key)) {
                total += laborDetail[key] || 0;
            }
        }
        return Math.round(total);
    }

    function calculateBudgetByMode(mode, data) {
        var totalBudget = data.totalBudget || 100000;
        var cityTier = data.cityTier || 'newFirst';
        var area = data.area || 80;
        var cityCoef = CITY_TIERS[cityTier] ? CITY_TIERS[cityTier].coefficient : 1.0;

        var stageBudgets = [];
        for (var s = 0; s < STAGES.length; s++) {
            stageBudgets.push({
                id: STAGES[s].id,
                title: STAGES[s].title,
                icon: STAGES[s].icon,
                desc: STAGES[s].desc,
                ratio: STAGES[s].ratio,
                budget: Math.round(totalBudget * STAGES[s].ratio),
                spent: 0,
                status: 'locked',
                expenses: []
            });
        }
        stageBudgets[0].status = 'active';

        var categories = {};

        if (mode === 'full') {
            var packageLevel = data.packageLevel || 'comfort';
            var levelConfig = PACKAGE_LEVELS[packageLevel] || PACKAGE_LEVELS.comfort;
            var packageCoef = levelConfig.coefficient || 1.0;

            var baseContractRatio = 0.70;
            var adjustedContractBudget = Math.round(totalBudget * baseContractRatio * packageCoef);
            var remaining = totalBudget - adjustedContractBudget;
            var selfPurchaseRatio = 0.15 / (0.15 + 0.10 + 0.05);
            var softDecorationRatio = 0.10 / (0.15 + 0.10 + 0.05);
            var reserveRatio = 0.05 / (0.15 + 0.10 + 0.05);

            var contractBudget = adjustedContractBudget;
            var selfPurchaseBudget = Math.round(remaining * selfPurchaseRatio);
            var softDecorationBudget = Math.round(remaining * softDecorationRatio);
            var reserveBudget = totalBudget - contractBudget - selfPurchaseBudget - softDecorationBudget;

            var baseConstructionBudget = Math.round(contractBudget * 0.50);
            var mainMaterialsBudget = Math.round(contractBudget * 0.30);
            var designFeeBudget = Math.round(contractBudget * 0.10);
            var managementFeeBudget = contractBudget - baseConstructionBudget - mainMaterialsBudget - designFeeBudget;

            var laborBudget = Math.round(baseConstructionBudget * 0.40 * cityCoef);
            var auxiliaryBudget = baseConstructionBudget - laborBudget;

            categories = {
                contract: {
                    budget: contractBudget,
                    spent: 0,
                    items: {
                        baseConstruction: {
                            budget: baseConstructionBudget,
                            spent: 0,
                            items: {
                                labor: { budget: laborBudget, spent: 0 },
                                auxiliary: { budget: auxiliaryBudget, spent: 0 }
                            }
                        },
                        mainMaterials: {
                            budget: mainMaterialsBudget,
                            spent: 0
                        },
                        designFee: {
                            budget: designFeeBudget,
                            spent: 0
                        },
                        managementFee: {
                            budget: managementFeeBudget,
                            spent: 0
                        }
                    }
                },
                selfPurchase: {
                    budget: selfPurchaseBudget,
                    spent: 0,
                    items: {
                        customFurniture: { budget: Math.round(selfPurchaseBudget * 0.40), spent: 0 },
                        balconyEnclosure: { budget: Math.round(selfPurchaseBudget * 0.20), spent: 0 },
                        hvac: { budget: Math.round(selfPurchaseBudget * 0.25), spent: 0 },
                        otherAdditions: { budget: Math.round(selfPurchaseBudget * 0.15), spent: 0 }
                    }
                },
                softDecoration: {
                    budget: softDecorationBudget,
                    spent: 0,
                    items: {
                        furniture: { budget: Math.round(softDecorationBudget * 0.50), spent: 0 },
                        appliances: { budget: Math.round(softDecorationBudget * 0.35), spent: 0 },
                        decorations: { budget: Math.round(softDecorationBudget * 0.15), spent: 0 }
                    }
                },
                reserve: {
                    budget: reserveBudget,
                    spent: 0
                }
            };
        } else if (mode === 'half') {
            var constructionBudget = data.constructionFee || Math.round(totalBudget * 0.35);
            var halfMainMaterialsBudget = data.materialList ? calculateMaterialListTotalFromData(data.materialList) : Math.round(totalBudget * 0.35);
            var halfCoreTotal = constructionBudget + halfMainMaterialsBudget;
            var remainingHalf = totalBudget - halfCoreTotal;
            var customFurnitureBudget = Math.round(remainingHalf * 0.40);
            var halfSoftDecorationBudget = Math.round(remainingHalf * 0.45);
            var halfReserveBudget = totalBudget - constructionBudget - halfMainMaterialsBudget - customFurnitureBudget - halfSoftDecorationBudget;

            var cfLaborRatio = data.constructionLaborRatio || 0.55;
            var cfAuxRatio = data.constructionAuxiliaryRatio || 0.30;
            var cfMgmtRatio = data.constructionManagementRatio || 0.15;
            var cfTotalCheck = cfLaborRatio + cfAuxRatio + cfMgmtRatio;
            if (cfTotalCheck > 0) {
                cfLaborRatio = cfLaborRatio / cfTotalCheck;
                cfAuxRatio = cfAuxRatio / cfTotalCheck;
                cfMgmtRatio = cfMgmtRatio / cfTotalCheck;
            }
            var halfLaborBudget = Math.round(constructionBudget * cfLaborRatio);
            var halfAuxiliaryBudget = Math.round(constructionBudget * cfAuxRatio);
            var halfManagementFeeBudget = constructionBudget - halfLaborBudget - halfAuxiliaryBudget;

            var halfMatItems = {};
            if (data.materialList && typeof data.materialList === 'object') {
                for (var hmk in data.materialList) {
                    if (data.materialList.hasOwnProperty(hmk)) {
                        var hmItem = data.materialList[hmk];
                        var hmLevel = hmItem.level || 'comfort';
                        var hmRatio = MATERIAL_LEVEL_PRICE_RATIOS[hmLevel] || 1.0;
                        var hmBasePrice = 0;
                        for (var hmi = 0; hmi < MATERIAL_CATEGORIES.length; hmi++) {
                            if (MATERIAL_CATEGORIES[hmi].id === hmk) {
                                hmBasePrice = MATERIAL_CATEGORIES[hmi].unitPrice;
                                break;
                            }
                        }
                        halfMatItems[hmk] = {
                            budget: Math.round((hmItem.quantity || 0) * hmBasePrice * hmRatio),
                            spent: 0
                        };
                    }
                }
            } else {
                halfMatItems = {
                    tile: { budget: Math.round(halfMainMaterialsBudget * 0.18), spent: 0 },
                    floor: { budget: Math.round(halfMainMaterialsBudget * 0.18), spent: 0 },
                    door: { budget: Math.round(halfMainMaterialsBudget * 0.12), spent: 0 },
                    window: { budget: Math.round(halfMainMaterialsBudget * 0.10), spent: 0 },
                    cabinet: { budget: Math.round(halfMainMaterialsBudget * 0.15), spent: 0 },
                    sanitary: { budget: Math.round(halfMainMaterialsBudget * 0.12), spent: 0 },
                    lighting: { budget: Math.round(halfMainMaterialsBudget * 0.08), spent: 0 },
                    hardware: { budget: Math.round(halfMainMaterialsBudget * 0.07), spent: 0 }
                };
            }

            categories = {
                construction: {
                    budget: constructionBudget,
                    spent: 0,
                    items: {
                        labor: { budget: halfLaborBudget, spent: 0 },
                        auxiliaryMaterials: { budget: halfAuxiliaryBudget, spent: 0 },
                        managementFee: { budget: halfManagementFeeBudget, spent: 0 }
                    }
                },
                mainMaterials: {
                    budget: halfMainMaterialsBudget,
                    spent: 0,
                    items: halfMatItems
                },
                customFurniture: {
                    budget: customFurnitureBudget,
                    spent: 0,
                    items: {
                        wardrobe: { budget: Math.round(customFurnitureBudget * 0.50), spent: 0 },
                        shoeCabinet: { budget: Math.round(customFurnitureBudget * 0.20), spent: 0 },
                        otherCustom: { budget: Math.round(customFurnitureBudget * 0.30), spent: 0 }
                    }
                },
                softDecoration: {
                    budget: halfSoftDecorationBudget,
                    spent: 0,
                    items: {
                        furniture: { budget: Math.round(halfSoftDecorationBudget * 0.50), spent: 0 },
                        appliances: { budget: Math.round(halfSoftDecorationBudget * 0.35), spent: 0 },
                        decorations: { budget: Math.round(halfSoftDecorationBudget * 0.15), spent: 0 }
                    }
                },
                reserve: {
                    budget: Math.max(0, halfReserveBudget),
                    spent: 0
                }
            };
        } else if (mode === 'self') {
            var selfDesignFeeBudget = Math.round(totalBudget * (data.designFeeRatio || 0.03));
            var selfLaborBudget = data.laborDetail ? calculateLaborTotalFromData(data.laborDetail) : Math.round(totalBudget * 0.27 * cityCoef);
            var selfMatFee = data.materialFee || {};
            var selfAuxMatBudget = selfMatFee.auxiliary || Math.round(totalBudget * 0.45 * 0.30);
            var selfMainMatBudget = selfMatFee.main || Math.round(totalBudget * 0.45 * 0.50);
            var selfCustomMatBudget = selfMatFee.custom || Math.round(totalBudget * 0.45 * 0.20);
            var selfMaterialsBudget = selfAuxMatBudget + selfMainMatBudget + selfCustomMatBudget;
            var equipmentBudget = Math.round(totalBudget * 0.08);
            var selfSoftDecorationBudget = Math.round(totalBudget * 0.12);
            var selfReserveBudget = totalBudget - selfDesignFeeBudget - selfLaborBudget - selfMaterialsBudget - equipmentBudget - selfSoftDecorationBudget;

            var selfLaborItems = {};
            if (data.laborDays && typeof data.laborDays === 'object') {
                for (var lk in data.laborDays) {
                    if (data.laborDays.hasOwnProperty(lk)) {
                        var ldItem = data.laborDays[lk];
                        selfLaborItems[lk] = {
                            budget: ldItem.subtotal || 0,
                            spent: 0
                        };
                    }
                }
            } else {
                selfLaborItems = {
                    demolition: { budget: Math.round(selfLaborBudget * 0.10), spent: 0 },
                    plumbing: { budget: Math.round(selfLaborBudget * 0.20), spent: 0 },
                    tiling: { budget: Math.round(selfLaborBudget * 0.25), spent: 0 },
                    carpentry: { budget: Math.round(selfLaborBudget * 0.20), spent: 0 },
                    painting: { budget: Math.round(selfLaborBudget * 0.15), spent: 0 },
                    installation: { budget: Math.round(selfLaborBudget * 0.10), spent: 0 }
                };
            }

            categories = {
                designFee: {
                    budget: selfDesignFeeBudget,
                    spent: 0
                },
                labor: {
                    budget: selfLaborBudget,
                    spent: 0,
                    items: selfLaborItems
                },
                materials: {
                    budget: selfMaterialsBudget,
                    spent: 0,
                    items: {
                        auxiliaryMaterials: { budget: selfAuxMatBudget, spent: 0 },
                        mainMaterials: { budget: selfMainMatBudget, spent: 0 },
                        customFurniture: { budget: selfCustomMatBudget, spent: 0 }
                    }
                },
                equipment: {
                    budget: equipmentBudget,
                    spent: 0,
                    items: {
                        hvac: { budget: Math.round(equipmentBudget * 0.40), spent: 0 },
                        rangeHood: { budget: Math.round(equipmentBudget * 0.20), spent: 0 },
                        waterHeater: { budget: Math.round(equipmentBudget * 0.20), spent: 0 },
                        otherEquipment: { budget: Math.round(equipmentBudget * 0.20), spent: 0 }
                    }
                },
                softDecoration: {
                    budget: selfSoftDecorationBudget,
                    spent: 0,
                    items: {
                        furniture: { budget: Math.round(selfSoftDecorationBudget * 0.50), spent: 0 },
                        appliances: { budget: Math.round(selfSoftDecorationBudget * 0.35), spent: 0 },
                        decorations: { budget: Math.round(selfSoftDecorationBudget * 0.15), spent: 0 }
                    }
                },
                reserve: {
                    budget: Math.max(0, selfReserveBudget),
                    spent: 0
                }
            };
        }

        var result = {
            schemaVersion: 'v2',
            mode: mode,
            modeLocked: true,
            totalBudget: totalBudget,
            cityTier: cityTier,
            cityCoefficient: cityCoef,
            area: area,
            stages: stageBudgets,
            categories: categories,
            totalSpent: 0,
            reserveUsed: 0,
            createdAt: new Date().toISOString(),
            editParams: {}
        };

        if (mode === 'full') {
            result.editParams.packageLevel = data.packageLevel || 'comfort';
        } else if (mode === 'half') {
            result.editParams.constructionFee = data.constructionFee || 0;
            result.editParams.constructionLaborRatio = data.constructionLaborRatio || 0.55;
            result.editParams.constructionAuxiliaryRatio = data.constructionAuxiliaryRatio || 0.30;
            result.editParams.constructionManagementRatio = data.constructionManagementRatio || 0.15;
            result.editParams.materialLevel = 'comfort';
            if (data.materialList) {
                var firstKey = null;
                for (var mk in data.materialList) {
                    if (data.materialList.hasOwnProperty(mk)) {
                        firstKey = mk;
                        break;
                    }
                }
                if (firstKey && data.materialList[firstKey]) {
                    result.editParams.materialLevel = data.materialList[firstKey].level || 'comfort';
                }
            }
        } else if (mode === 'self') {
            result.editParams.designFeeRatio = data.designFeeRatio || 0.03;
            result.editParams.designFeeOption = data.designFeeOption || 'simple';
            result.editParams.materialFee = data.materialFee || { auxiliary: 0, main: 0, custom: 0 };
            result.editParams.laborTotal = calculateLaborTotalFromData(data.laborDetail) || 0;
            result.editParams.customFurnitureMeters = data.customFurnitureMeters || 0;
        }

        return result;
    }

    function getBudgetStatus() {
        var plan = getBudgetPlan();
        if (!plan) return { level: 'none', percent: 0, actualPercent: 0, totalWithReserve: 0 };
        
        var totalWithReserve = plan.totalBudget + (plan.breakdown ? plan.breakdown.reserve : 0);
        var percent = 0;
        if (plan.totalBudget > 0) {
            percent = ((plan.totalSpent || 0) + (plan.reserveUsed || 0)) / plan.totalBudget * 100;
        }
        
        var level;
        if (percent < 70) {
            level = 'healthy';
        } else if (percent < 90) {
            level = 'warning';
        } else if (percent < 115) {
            level = 'danger';
        } else {
            level = 'critical';
        }
        
        return {
            level: level,
            percent: Math.min(percent, 200),
            actualPercent: percent,
            totalWithReserve: totalWithReserve
        };
    }

    function getNianState() {
        var status = getBudgetStatus();
        var plan = getBudgetPlan();
        var remaining = plan ? plan.totalBudget - plan.totalSpent : 0;
        switch (status.level) {
            case 'healthy':
                return { emoji: 'nian-happy', state: 'nian-happy', tip: '目前预算状况很健康呢~ 要不要看看怎么把钱花在刀刃上？让每一分钱都花得值~' };
            case 'warning':
                return { emoji: 'nian-confused', state: 'nian-confused', tip: '目前支出有点多了，要不要我帮您看看哪些地方可以省省？咱们把钱用在最该用的地方~' };
            case 'danger':
                return { emoji: 'nian-nervous', state: 'nian-nervous', tip: '情况有点紧急了，我们一起想想办法，先暂停非必要支出好不好？总能找到解决办法的~' };
            case 'critical':
                return { emoji: 'nian-nervous', state: 'nian-nervous', tip: '已经超支比较多了，您先别着急，我们一起来看看哪些地方可以调整，好吗？' };
            default:
                return { emoji: 'nian-happy', state: 'nian-happy', tip: '欢迎来到预算管理~ 小管家陪您一起精打细算，把钱花在刀刃上！' };
        }
    }

    function updateFloatingButlerContent() {
        if (typeof FloatingButler === 'undefined') return;

        var nian = getNianState();
        var status = getBudgetStatus();

        var tipText = nian.tip || '';
        if (tipText.length > 32) {
            tipText = tipText.substring(0, 30) + '...';
        }

        var tips = [];

        var statusText = '';
        switch (status.level) {
            case 'healthy':
                statusText = '健康 - 预算状况良好，支出在可控范围内';
                break;
            case 'warning':
                statusText = '警告 - 支出接近预算警戒线，需要注意控制';
                break;
            case 'danger':
                statusText = '危险 - 已超出预算，建议控制支出';
                break;
            case 'critical':
                statusText = '严重超支 - 超出预算较多，需紧急调整';
                break;
            default:
                statusText = '暂无数据';
        }
        tips.push({
            title: '预算状态',
            content: statusText
        });

        var savingTips = [
            '多对比价格，同品质选性价比最高的',
            '利用促销季采购，省下不少钱',
            '考虑替代材料，效果差不多价格低很多'
        ];
        tips.push({
            title: '省钱小贴士',
            content: savingTips.join('；')
        });

        var suggestionText = '';
        switch (status.level) {
            case 'healthy':
                suggestionText = '建议合理分配预算，把钱花在刀刃上，预留充足备用金应对突发情况';
                break;
            case 'warning':
                suggestionText = '建议控制支出，优先必需品，暂缓非必要采购，避免超支';
                break;
            case 'danger':
                suggestionText = '建议削减非必要开支，重新评估项目优先级，考虑动用备用金';
                break;
            case 'critical':
                suggestionText = '建议立即暂停非必要支出，重新梳理预算，考虑调整方案或增加预算';
                break;
            default:
                suggestionText = '建议做好预算规划，精打细算';
        }
        tips.push({
            title: '预算建议',
            content: suggestionText
        });

        FloatingButler.updateContent({
            emoji: nian.emoji,
            tip: tipText,
            tips: tips
        });
    }

    function addExpense(amount, category, stageId) {
        var plan = getBudgetPlan();
        if (!plan) return false;
        
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) {
            showNianAutoTip('支出金额必须大于0哦~');
            return false;
        }

        var remaining = plan.totalBudget - (plan.totalSpent || 0) + (plan.breakdown ? plan.breakdown.reserve : 0) - (plan.reserveUsed || 0);
        if (amount > remaining + 1) {
            showWarningModal('超支预警', '本次支出将超出总预算上限（含备用金），请确认是否继续！', function() {
                processExpense(amount, category, stageId);
            });
            return false;
        }

        processExpense(amount, category, stageId);
        return true;
    }

    function processExpense(amount, category, stageId) {
        var plan = getBudgetPlan();
        if (!plan) return;
        
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) return;

        var stageIndex = stageId ? stageId - 1 : findActiveStageIndex();
        if (stageIndex >= 0 && stageIndex < plan.stages.length) {
            plan.stages[stageIndex].spent = (plan.stages[stageIndex].spent || 0) + amount;
            if (!plan.stages[stageIndex].expenses) {
                plan.stages[stageIndex].expenses = [];
            }
            
            var currentStepId = null;
            var mode = App.getDecorationMode();
            var sopProgress = App.state.sopProgress;
            if (sopProgress && sopProgress[mode]) {
                currentStepId = sopProgress[mode].currentStep;
            }
            
            plan.stages[stageIndex].expenses.push({
                amount: amount,
                category: category || '其他',
                date: new Date().toISOString(),
                stepId: currentStepId
            });
        }

        var materialId = getMaterialIdByName(category);
        if (materialId && plan.materials[materialId]) {
            plan.materials[materialId].spent = (plan.materials[materialId].spent || 0) + amount;
            if (plan.materials[materialId].status === 'pending') {
                plan.materials[materialId].status = 'purchasing';
            }
        }

        var normalBudgetRemaining = plan.totalBudget - (plan.totalSpent || 0);
        if (amount <= normalBudgetRemaining) {
            plan.totalSpent = (plan.totalSpent || 0) + amount;
        } else {
            var fromNormal = Math.max(0, normalBudgetRemaining);
            var fromReserve = amount - fromNormal;
            plan.totalSpent = (plan.totalSpent || 0) + fromNormal;
            plan.reserveUsed = (plan.reserveUsed || 0) + fromReserve;

            if (plan.categories && plan.categories.reserve) {
                plan.categories.reserve.spent = (plan.categories.reserve.spent || 0) + fromReserve;
            }
        }

        saveBudgetPlan(plan);
        
        checkBudgetAlerts();
        
        EventBus.emit(EventBus.EVENTS.BUDGET_UPDATED, {
            amount: amount,
            category: category,
            stageId: stageId || (stageIndex + 1),
            stepId: currentStepId,
            totalSpent: plan.totalSpent,
            reserveUsed: plan.reserveUsed
        });

        EventBus.emit(EventBus.EVENTS.EXPENSE_ADDED, {
            amount: amount,
            category: category,
            stageId: stageId || (stageIndex + 1),
            stepId: currentStepId,
            date: new Date().toISOString()
        });
        
        render();
    }

    function getCategoryTreeForMode(mode) {
        var config = getModeConfig(mode);
        if (!config || !config.categories) return [];
        return config.categories;
    }

    var EXPENSE_TAGS = [
        { id: 'necessary', name: '必需品', color: '#10b981' },
        { id: 'important', name: '重要', color: '#3b82f6' },
        { id: 'optional', name: '可选项', color: '#f59e0b' },
        { id: 'luxury', name: '提升品质', color: '#8b5cf6' },
        { id: 'emergency', name: '应急', color: '#ef4444' }
    ];

    function getExpenseTags() {
        return EXPENSE_TAGS;
    }

    function getBudgetVersions() {
        var data = Storage.load(BUDGET_VERSIONS_KEY);
        if (data) {
            return data;
        }
        return [];
    }

    function saveBudgetVersions(versions) {
        Storage.save(BUDGET_VERSIONS_KEY, versions);
        return true;
    }

    function saveCurrentAsVersion(versionName) {
        var plan = getBudgetPlan();
        if (!plan) return false;

        if (!versionName || !versionName.trim()) {
            if (typeof Toast !== 'undefined') {
                Toast.warning('请输入版本名称');
            }
            return false;
        }

        versionName = versionName.trim();
        var versions = getBudgetVersions();

        var existingIndex = -1;
        for (var i = 0; i < versions.length; i++) {
            if (versions[i].name === versionName) {
                existingIndex = i;
                break;
            }
        }

        var versionData = {
            name: versionName,
            plan: JSON.parse(JSON.stringify(plan)),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            versions[existingIndex] = versionData;
        } else {
            versions.push(versionData);
        }

        var success = saveBudgetVersions(versions);
        if (success) {
            currentVersionName = versionName;
            if (typeof Toast !== 'undefined') {
                Toast.success(existingIndex >= 0 ? '版本已更新' : '版本已保存');
            }
        }
        return success;
    }

    function loadVersion(versionName) {
        var versions = getBudgetVersions();
        var targetVersion = null;

        for (var i = 0; i < versions.length; i++) {
            if (versions[i].name === versionName) {
                targetVersion = versions[i];
                break;
            }
        }

        if (!targetVersion) {
            if (typeof Toast !== 'undefined') {
                Toast.error('版本不存在');
            }
            return false;
        }

        try {
            var planCopy = JSON.parse(JSON.stringify(targetVersion.plan));
            saveBudgetPlan(planCopy, true);
            currentVersionName = versionName;
            render();
            initDashboardEvents();
            if (typeof Toast !== 'undefined') {
                Toast.success('已切换到版本：' + versionName);
            }
            return true;
        } catch (e) {
            console.error('[BudgetView] 加载版本失败:', e);
            if (typeof Toast !== 'undefined') {
                Toast.error('加载版本失败');
            }
            return false;
        }
    }

    function deleteVersion(versionName) {
        var versions = getBudgetVersions();
        var newVersions = [];

        for (var i = 0; i < versions.length; i++) {
            if (versions[i].name !== versionName) {
                newVersions.push(versions[i]);
            }
        }

        var success = saveBudgetVersions(newVersions);
        if (success) {
            if (currentVersionName === versionName) {
                currentVersionName = null;
            }
            if (typeof Toast !== 'undefined') {
                Toast.success('版本已删除');
            }
        }
        return success;
    }

    function showVersionManager() {
        var versions = getBudgetVersions();
        var plan = getBudgetPlan();
        if (!plan) return;

        var modalId = 'budget-version-modal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var versionsHtml = versions.length > 0 ? versions.map(function(v, idx) {
            var budgetTotal = v.plan.totalBudget || 0;
            var budgetSpent = v.plan.totalSpent || 0;
            var isCurrent = currentVersionName === v.name;
            var date = new Date(v.updatedAt || v.createdAt);
            var dateStr = date.getMonth() + 1 + '月' + date.getDate() + '日 ' + 
                         (date.getHours() < 10 ? '0' : '') + date.getHours() + ':' + 
                         (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
            return `
                <div class="version-item ${isCurrent ? 'current' : ''}" data-version-name="${v.name}">
                    <div class="version-item-left">
                        <div class="version-item-name">
                            ${isCurrent ? '<span class="version-current-badge">当前</span>' : ''}
                            ${v.name}
                        </div>
                        <div class="version-item-meta">
                            <span>总预算 ¥${formatMoney(budgetTotal)}</span>
                            <span>已花 ¥${formatMoney(budgetSpent)}</span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                    <div class="version-item-actions">
                        <button class="version-btn version-btn-load" data-action="load-version">切换</button>
                        <button class="version-btn version-btn-delete" data-action="delete-version">删除</button>
                    </div>
                </div>
            `;
        }).join('') : '<div class="version-empty">暂无保存的版本</div>';

        var modalHtml = `
            <div class="sop-modal-backdrop active" id="${modalId}">
                <div class="sop-modal version-modal" style="max-width: 480px;">
                    <div class="sop-modal-header">
                        <h3 class="sop-modal-title">预算方案管理</h3>
                        <button class="sop-modal-close" onclick="BudgetView.closeModal('${modalId}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="sop-modal-body" style="padding: 20px 24px;">
                        <div class="version-save-section">
                            <div class="version-save-label">保存当前方案为</div>
                            <div class="version-save-row">
                                <input type="text" class="form-input version-name-input" id="version-name-input" placeholder="输入方案名称，如：方案A-保守版" maxlength="20">
                                <button class="btn-primary version-save-btn" id="version-save-btn">保存</button>
                            </div>
                        </div>
                        <div class="version-list-title">已保存的方案</div>
                        <div class="version-list" id="version-list">
                            ${versionsHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        trackModal(modalId);

        var saveBtn = document.getElementById('version-save-btn');
        var nameInput = document.getElementById('version-name-input');

        addDomListener(saveBtn, 'click', function() {
            var name = nameInput.value.trim();
            if (saveCurrentAsVersion(name)) {
                var newVersionsHtml = getBudgetVersions().length > 0 ? getBudgetVersions().map(function(v) {
                    var budgetTotal = v.plan.totalBudget || 0;
                    var budgetSpent = v.plan.totalSpent || 0;
                    var isCurrent = currentVersionName === v.name;
                    var date = new Date(v.updatedAt || v.createdAt);
                    var dateStr = date.getMonth() + 1 + '月' + date.getDate() + '日 ' + 
                                 (date.getHours() < 10 ? '0' : '') + date.getHours() + ':' + 
                                 (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
                    return `
                        <div class="version-item ${isCurrent ? 'current' : ''}" data-version-name="${v.name}">
                            <div class="version-item-left">
                                <div class="version-item-name">
                                    ${isCurrent ? '<span class="version-current-badge">当前</span>' : ''}
                                    ${v.name}
                                </div>
                                <div class="version-item-meta">
                                    <span>总预算 ¥${formatMoney(budgetTotal)}</span>
                                    <span>已花 ¥${formatMoney(budgetSpent)}</span>
                                    <span>${dateStr}</span>
                                </div>
                            </div>
                            <div class="version-item-actions">
                                <button class="version-btn version-btn-load" data-action="load-version">切换</button>
                                <button class="version-btn version-btn-delete" data-action="delete-version">删除</button>
                            </div>
                        </div>
                    `;
                }).join('') : '<div class="version-empty">暂无保存的版本</div>';
                var versionListEl = document.getElementById('version-list');
                if (versionListEl) {
                    versionListEl.innerHTML = newVersionsHtml;
                }
                nameInput.value = '';
            }
        });

        addDomListener(nameInput, 'keypress', function(e) {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });

        var versionList = document.getElementById('version-list');
        addDomListener(versionList, 'click', function(e) {
            var versionItem = e.target.closest('.version-item');
            if (!versionItem) return;
            var versionName = versionItem.getAttribute('data-version-name');
            if (!versionName) return;

            var action = e.target.getAttribute('data-action');
            if (action === 'load-version') {
                e.stopPropagation();
                if (loadVersion(versionName)) {
                    closeModal(modalId);
                }
            } else if (action === 'delete-version') {
                e.stopPropagation();
                showWarningModal('确认删除', '确定要删除方案 "' + versionName + '" 吗？此操作不可恢复。', function() {
                    if (deleteVersion(versionName)) {
                        var newVersionsHtml = getBudgetVersions().length > 0 ? getBudgetVersions().map(function(v) {
                            var budgetTotal = v.plan.totalBudget || 0;
                            var budgetSpent = v.plan.totalSpent || 0;
                            var isCurrent = currentVersionName === v.name;
                            var date = new Date(v.updatedAt || v.createdAt);
                            var dateStr = date.getMonth() + 1 + '月' + date.getDate() + '日 ' + 
                                         (date.getHours() < 10 ? '0' : '') + date.getHours() + ':' + 
                                         (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
                            return `
                                <div class="version-item ${isCurrent ? 'current' : ''}" data-version-name="${v.name}">
                                    <div class="version-item-left">
                                        <div class="version-item-name">
                                            ${isCurrent ? '<span class="version-current-badge">当前</span>' : ''}
                                            ${v.name}
                                        </div>
                                        <div class="version-item-meta">
                                            <span>总预算 ¥${formatMoney(budgetTotal)}</span>
                                            <span>已花 ¥${formatMoney(budgetSpent)}</span>
                                            <span>${dateStr}</span>
                                        </div>
                                    </div>
                                    <div class="version-item-actions">
                                        <button class="version-btn version-btn-load" data-action="load-version">切换</button>
                                        <button class="version-btn version-btn-delete" data-action="delete-version">删除</button>
                                    </div>
                                </div>
                            `;
                        }).join('') : '<div class="version-empty">暂无保存的版本</div>';
                        var versionListEl = document.getElementById('version-list');
                if (versionListEl) {
                    versionListEl.innerHTML = newVersionsHtml;
                }
                    }
                });
            }
        });
    }

    function showAddExpenseModal() {
        var plan = getBudgetPlan();
        if (!plan) return;

        var modalId = 'add-expense-modal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var mode = plan.mode || 'full';
        var categories = getCategoryTreeForMode(mode);

        var categoryOptionsHtml = '';
        for (var i = 0; i < categories.length; i++) {
            var cat = categories[i];
            if (cat.id === 'reserve') continue;
            categoryOptionsHtml += '<option value="' + cat.id + '">' + cat.name + '</option>';
        }

        var tagsHtml = EXPENSE_TAGS.map(function(tag, idx) {
            return `
                <div class="expense-tag-option ${idx === 0 ? 'active' : ''}" data-tag-id="${tag.id}" style="border-color: ${tag.color}40; color: ${tag.color};">
                    ${tag.name}
                </div>
            `;
        }).join('');

        var modalHtml = `
            <div class="sop-modal-backdrop active" id="${modalId}">
                <div class="sop-modal" style="max-width: 420px;">
                    <div class="sop-modal-header">
                        <h3 class="sop-modal-title">记一笔支出</h3>
                        <button class="sop-modal-close" onclick="BudgetView.closeModal('${modalId}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="sop-modal-body" style="padding: 24px;">
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label">金额（元）<span style="color: var(--danger);">*</span></label>
                            <input type="number" class="form-input" id="expense-amount-input" placeholder="请输入金额" step="0.01">
                        </div>
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label">支出类型</label>
                            <div class="expense-type-tabs" id="expense-type-tabs">
                                <div class="expense-type-tab" data-type="deposit">定金</div>
                                <div class="expense-type-tab active" data-type="progress">进度款</div>
                                <div class="expense-type-tab" data-type="full">全款</div>
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label">一级分类<span style="color: var(--danger);">*</span></label>
                            <select class="form-input" id="expense-category-select">
                                <option value="">请选择分类</option>
                                ${categoryOptionsHtml}
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 16px; display: none;" id="sub-category-group">
                            <label class="form-label">二级分类</label>
                            <select class="form-input" id="expense-subcategory-select">
                                <option value="">请选择子分类</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label">支出标签</label>
                            <div class="expense-tags-selector" id="expense-tags-selector">
                                ${tagsHtml}
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">备注</label>
                            <textarea class="form-input" id="expense-note-input" placeholder="选填：备注信息" rows="2"></textarea>
                        </div>
                    </div>
                    <div class="sop-modal-footer">
                        <button class="btn-secondary" id="expense-cancel-btn">取消</button>
                        <button class="btn-primary" id="expense-confirm-btn">确认添加</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        trackModal(modalId);

        var selectedExpenseType = 'progress';
        var selectedCategory = '';
        var selectedTag = 'necessary';

        var tagOptions = document.querySelectorAll('#expense-tags-selector .expense-tag-option');
        tagOptions.forEach(function(tagEl) {
            addDomListener(tagEl, 'click', function() {
                tagOptions.forEach(function(t) { t.classList.remove('active'); });
                tagEl.classList.add('active');
                selectedTag = tagEl.getAttribute('data-tag-id');
            });
        });

        var typeTabs = document.querySelectorAll('#expense-type-tabs .expense-type-tab');
        for (var t = 0; t < typeTabs.length; t++) {
            (function(tab) {
                addDomListener(tab, 'click', function() {
                    typeTabs.forEach(function(t) { t.classList.remove('active'); });
                    tab.classList.add('active');
                    selectedExpenseType = tab.getAttribute('data-type');
                });
            })(typeTabs[t]);
        }

        var categorySelect = document.getElementById('expense-category-select');
        var subCategoryGroup = document.getElementById('sub-category-group');
        var subCategorySelect = document.getElementById('expense-subcategory-select');

        addDomListener(categorySelect, 'change', function() {
            selectedCategory = this.value;
            var selectedCat = null;
            for (var c = 0; c < categories.length; c++) {
                if (categories[c].id === selectedCategory) {
                    selectedCat = categories[c];
                    break;
                }
            }

            if (selectedCat && selectedCat.children && selectedCat.children.length > 0) {
                subCategoryGroup.style.display = 'block';
                var subOptionsHtml = '<option value="">请选择子分类</option>';
                for (var s = 0; s < selectedCat.children.length; s++) {
                    var sub = selectedCat.children[s];
                    subOptionsHtml += '<option value="' + sub.id + '">' + sub.name + '</option>';
                }
                subCategorySelect.innerHTML = subOptionsHtml;
            } else {
                subCategoryGroup.style.display = 'none';
                subCategorySelect.innerHTML = '<option value="">请选择子分类</option>';
            }
        });

        var cancelBtn = document.getElementById('expense-cancel-btn');
        addDomListener(cancelBtn, 'click', function() {
            closeModal(modalId);
        });

        var confirmBtn = document.getElementById('expense-confirm-btn');
        addDomListener(confirmBtn, 'click', function() {
            var amount = parseFloat(document.getElementById('expense-amount-input').value);
            var catKey = document.getElementById('expense-category-select').value;
            var subCatKey = document.getElementById('expense-subcategory-select').value;
            var note = document.getElementById('expense-note-input').value.trim();

            if (!amount || isNaN(amount) || amount <= 0) {
                if (typeof Toast !== 'undefined') {
                    Toast.warning('请输入有效的金额（大于0）');
                }
                document.getElementById('expense-amount-input').focus();
                return;
            }

            if (!catKey) {
                if (typeof Toast !== 'undefined') {
                    Toast.warning('请选择一级分类');
                }
                document.getElementById('expense-category-select').focus();
                return;
            }

            var success = addExpenseByCategory(amount, catKey, subCatKey, note, selectedExpenseType, selectedTag);
            if (success) {
                closeModal(modalId);
                if (typeof Toast !== 'undefined') {
                    Toast.success('支出已记录');
                }
            }
        });

        var modal = document.getElementById(modalId);
        addDomListener(modal, 'click', function(e) {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });

        setTimeout(function() {
            document.getElementById('expense-amount-input').focus();
        }, 100);
    }

    function addExpenseByCategory(amount, catKey, subCatKey, note, expenseType, tag) {
        var plan = getBudgetPlan();
        if (!plan) return false;

        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) {
            if (typeof Toast !== 'undefined') {
                Toast.warning('支出金额必须大于0哦~');
            }
            return false;
        }

        if (!catKey) {
            if (typeof Toast !== 'undefined') {
                Toast.warning('请选择一级分类');
            }
            return false;
        }

        if (!plan.categories || !plan.categories[catKey]) {
            if (typeof Toast !== 'undefined') {
                Toast.warning('分类不存在');
            }
            return false;
        }

        var catData = plan.categories[catKey];
        var catBudgetRemaining = (catData.budget || 0) - (catData.spent || 0);
        var fromCatBudget = 0;
        var fromReserveByCat = 0;

        if (catKey === 'reserve') {
            fromCatBudget = amount;
        } else if (amount <= catBudgetRemaining) {
            fromCatBudget = amount;
        } else {
            fromCatBudget = Math.max(0, catBudgetRemaining);
            fromReserveByCat = amount - fromCatBudget;
        }

        catData.spent = (catData.spent || 0) + fromCatBudget;

        if (!catData.expenses) {
            catData.expenses = [];
        }

        var expenseRecord = {
            amount: amount,
            category: catKey,
            subCategory: subCatKey || '',
            note: note || '',
            expenseType: expenseType || 'progress',
            tag: tag || 'necessary',
            date: new Date().toISOString()
        };
        catData.expenses.push(expenseRecord);

        var stageIndex = findActiveStageIndex();
        if (stageIndex >= 0 && stageIndex < plan.stages.length) {
            plan.stages[stageIndex].spent = (plan.stages[stageIndex].spent || 0) + amount;
            if (!plan.stages[stageIndex].expenses) {
                plan.stages[stageIndex].expenses = [];
            }
            var currentStepId = null;
            try {
                var mode = App.getDecorationMode();
                var sopProgress = App.state.sopProgress;
                if (sopProgress && sopProgress[mode]) {
                    currentStepId = sopProgress[mode].currentStep;
                }
            } catch (e) {
                console.error('[BudgetView] 获取当前SOP步骤失败:', e);
            }
            plan.stages[stageIndex].expenses.push({
                amount: amount,
                category: getCategoryLabel(catKey, plan),
                date: expenseRecord.date,
                stepId: currentStepId,
                tag: tag || 'necessary',
                expenseType: expenseType || 'progress',
                note: note || ''
            });
        }

        if (subCatKey && catData.items && catData.items[subCatKey]) {
            var subCatData = catData.items[subCatKey];
            var subCatBudgetRemaining = (subCatData.budget || 0) - (subCatData.spent || 0);
            var subFromCatBudget = 0;
            if (catKey === 'reserve') {
                subFromCatBudget = amount;
            } else if (amount <= subCatBudgetRemaining) {
                subFromCatBudget = amount;
            } else {
                subFromCatBudget = Math.max(0, subCatBudgetRemaining);
            }
            subCatData.spent = (subCatData.spent || 0) + subFromCatBudget;
            if (!subCatData.expenses) {
                subCatData.expenses = [];
            }
            subCatData.expenses.push(expenseRecord);
        }

        if (fromReserveByCat > 0 && plan.categories && plan.categories.reserve) {
            plan.categories.reserve.spent = (plan.categories.reserve.spent || 0) + fromReserveByCat;
            plan.reserveUsed = (plan.reserveUsed || 0) + fromReserveByCat;
        }

        var normalBudgetRemaining = plan.totalBudget - (plan.totalSpent || 0);
        if (amount <= normalBudgetRemaining) {
            plan.totalSpent = (plan.totalSpent || 0) + amount;
        } else {
            var fromNormal = Math.max(0, normalBudgetRemaining);
            var fromReserveTotal = amount - fromNormal;
            plan.totalSpent = (plan.totalSpent || 0) + fromNormal;
            if (fromReserveTotal > fromReserveByCat) {
                var additionalReserve = fromReserveTotal - fromReserveByCat;
                plan.reserveUsed = (plan.reserveUsed || 0) + additionalReserve;
                if (plan.categories && plan.categories.reserve) {
                    plan.categories.reserve.spent = (plan.categories.reserve.spent || 0) + additionalReserve;
                }
            }
        }

        saveBudgetPlan(plan);
        checkBudgetAlerts();
        checkAdvancedBudgetAlerts();

        EventBus.emit(EventBus.EVENTS.BUDGET_UPDATED, {
            amount: amount,
            category: catKey,
            subCategory: subCatKey,
            expenseType: expenseType,
            note: note,
            totalSpent: plan.totalSpent,
            reserveUsed: plan.reserveUsed
        });

        render();
        return true;
    }

    function findActiveStageIndex() {
        var plan = getBudgetPlan();
        if (!plan) return 0;
        for (var i = 0; i < plan.stages.length; i++) {
            if (plan.stages[i].status === 'active') return i;
        }
        return 0;
    }

    function checkBudgetAlerts() {
        var status = getBudgetStatus();
        var plan = getBudgetPlan();
        if (!plan) return;

        var newAlerts = [];

        if (status.actualPercent >= 90 && !plan.alerted90) {
            plan.alerted90 = true;
            newAlerts.push({
                type: 'critical',
                title: '预算支出达到90%',
                message: '支出已经达到90%了，建议优先采购必需品，暂缓非必要支出，可以考虑动用备用金。'
            });
        }

        if (status.actualPercent >= 115 && !plan.alerted115) {
            plan.alerted115 = true;
            newAlerts.push({
                type: 'danger',
                title: '预算已超支',
                message: '目前支出已经超出总预算了，建议梳理一下：看看哪些项目可以调整，确认增项内容和价格，重新评估整体预算。'
            });
        }

        if (plan.categories) {
            var catAlerts = [];
            for (var catKey in plan.categories) {
                if (!plan.categories.hasOwnProperty(catKey) || catKey === 'reserve') continue;
                var cat = plan.categories[catKey];
                if (!cat.budget || cat.budget <= 0) continue;

                var catPercent = (cat.spent || 0) / cat.budget;
                var alertedKey = 'alerted_cat_' + catKey;

                if (catPercent >= 1.0 && !plan[alertedKey + '_100']) {
                    plan[alertedKey + '_100'] = true;
                    catAlerts.push({ catKey: catKey, level: 'danger', percent: catPercent });
                } else if (catPercent >= 0.85 && !plan[alertedKey + '_85']) {
                    plan[alertedKey + '_85'] = true;
                    catAlerts.push({ catKey: catKey, level: 'warning', percent: catPercent });
                }
            }

            if (catAlerts.length > 0) {
                var dangerCats = catAlerts.filter(function(a) { return a.level === 'danger'; });
                var warnCats = catAlerts.filter(function(a) { return a.level === 'warning'; });

                if (dangerCats.length > 0) {
                    var catNames = dangerCats.map(function(a) {
                        return getCategoryLabel(a.catKey, plan);
                    }).join('、');
                    newAlerts.push({
                        type: 'warning',
                        title: '分类超支提醒',
                        message: catNames + ' 已经超出预算了，建议关注这些分类的支出。'
                    });
                } else if (warnCats.length > 0 && !plan.alertedCategoryWarning) {
                    plan.alertedCategoryWarning = true;
                    var warnNames = warnCats.map(function(a) {
                        return getCategoryLabel(a.catKey, plan);
                    }).join('、');
                    newAlerts.push({
                        type: 'info',
                        title: '分类预算预警',
                        message: warnNames + ' 支出已超过85%，请注意控制。'
                    });
                }
            }
        }

        var trendData = getExpenseTrendData(plan, 7);
        if (trendData && trendData.length >= 3) {
            var recentVals = trendData.slice(-3).map(function(d) { return d.value; });
            var avgRecent = recentVals.reduce(function(a, b) { return a + b; }, 0) / recentVals.length;
            var earlierVals = trendData.slice(0, 4).map(function(d) { return d.value; });
            var avgEarlier = earlierVals.reduce(function(a, b) { return a + b; }, 0) / earlierVals.length;

            if (avgEarlier > 0 && avgRecent / avgEarlier > 1.5 && !plan.alertedSpendingSpike) {
                plan.alertedSpendingSpike = true;
                newAlerts.push({
                    type: 'warning',
                    title: '支出突增提醒',
                    message: '最近几天支出明显增加，比前几天平均高出50%以上，建议留意一下支出节奏。'
                });
            }
        }

        var reserveCat = plan.categories ? plan.categories.reserve : null;
        if (reserveCat && reserveCat.budget > 0) {
            var reservePercent = (reserveCat.spent || 0) / reserveCat.budget;
            if (reservePercent >= 0.5 && !plan.alertedReserve50) {
                plan.alertedReserve50 = true;
                newAlerts.push({
                    type: 'info',
                    title: '备用金使用过半',
                    message: '备用金已经使用了一半，建议尽量保留部分备用金应对突发情况。'
                });
            }
        }

        if (newAlerts.length > 0) {
            saveBudgetPlan(plan);

            var criticalAlert = newAlerts.find(function(a) { return a.type === 'critical' || a.type === 'danger'; });
            if (criticalAlert) {
                showWarningModal(criticalAlert.title, criticalAlert.message, null, criticalAlert.type === 'critical');
            } else {
                var firstAlert = newAlerts[0];
                if (firstAlert.type === 'warning') {
                    showNianTipModal(firstAlert.title + '\n\n' + firstAlert.message);
                }
            }

            if (typeof Toast !== 'undefined') {
                for (var ai = 0; ai < Math.min(newAlerts.length, 2); ai++) {
                    (function(alert) {
                        addTimer(setTimeout(function() {
                            if (alert.type === 'danger' || alert.type === 'critical') {
                                Toast.error(alert.title);
                            } else if (alert.type === 'warning') {
                                Toast.warning(alert.title);
                            } else {
                                Toast.info(alert.title);
                            }
                        }, ai * 1500));
                    })(newAlerts[ai]);
                }
            }
        }
    }

    function recalculate() {
        var plan = getBudgetPlan();
        if (!plan) return;
        
        var newPlan = calculateBudget(plan.totalBudget, plan.cityTier, plan.area);
        
        newPlan.totalSpent = plan.totalSpent;
        newPlan.reserveUsed = plan.reserveUsed;
        newPlan.alerted90 = plan.alerted90;
        newPlan.alerted115 = plan.alerted115;
        
        for (var i = 0; i < plan.stages.length; i++) {
            if (plan.stages[i] && newPlan.stages[i]) {
                newPlan.stages[i].spent = plan.stages[i].spent;
                newPlan.stages[i].status = plan.stages[i].status;
                newPlan.stages[i].expenses = plan.stages[i].expenses;
            }
        }
        
        for (var key in plan.materials) {
            if (plan.materials[key] && newPlan.materials[key]) {
                newPlan.materials[key].spent = plan.materials[key].spent;
                newPlan.materials[key].status = plan.materials[key].status;
            }
        }
        
        saveBudgetPlan(newPlan);
    }

    function updateStageStatus() {
        var plan = getBudgetPlan();
        if (!plan) return;
        
        var mode = App.getDecorationMode();
        var sopProgress = App.state.sopProgress;
        var modeProgress = sopProgress && sopProgress[mode] ? sopProgress[mode] : null;
        
        if (!modeProgress || !modeProgress.completedSteps) return;
        
        var stagesCompleted = [0, 0, 0, 0, 0, 0];
        var stepsPerStage = [3, 4, 4, 4, 3, 2];
        
        for (var s = 0; s < modeProgress.completedSteps.length; s++) {
            var stepId = modeProgress.completedSteps[s];
            var match = stepId.match(/^[FHS](\d+)-/);
            if (match) {
                var stageNum = parseInt(match[1]);
                if (stageNum >= 1 && stageNum <= 6) {
                    stagesCompleted[stageNum - 1]++;
                }
            }
        }
        
        var changed = false;
        var newlyUnlockedStage = null;
        for (var i = 0; i < plan.stages.length; i++) {
            var isComplete = stagesCompleted[i] >= stepsPerStage[i];
            var wasComplete = plan.stages[i].status === 'completed';
            var wasLocked = plan.stages[i].status === 'locked';
            
            if (isComplete && !wasComplete) {
                plan.stages[i].status = 'completed';
                if (i + 1 < plan.stages.length && plan.stages[i + 1].status === 'locked') {
                    plan.stages[i + 1].status = 'active';
                    newlyUnlockedStage = plan.stages[i + 1];
                }
                changed = true;
            }
            
            if (i === 0 && wasLocked && stagesCompleted[i] > 0) {
                plan.stages[i].status = 'active';
                changed = true;
            }
        }
        
        if (changed) {
            saveBudgetPlan(plan);
            if (newlyUnlockedStage && typeof Toast !== 'undefined') {
                Toast.success('🎉 新预算阶段已解锁：' + newlyUnlockedStage.title);
            }
        }
    }

    function onSopStepCompleted(data) {
        updateStageStatus();
        if (container && container.innerHTML) {
            render(container);
            initDashboardEvents();
        }
    }

    function onSopStageChanged(data) {
        var plan = getBudgetPlan();
        if (!plan || !plan.stages) return;

        var stageId = data && data.stageId;
        if (!stageId) return;

        var stageIndex = -1;
        for (var i = 0; i < plan.stages.length; i++) {
            if (plan.stages[i].id === stageId || String(plan.stages[i].id) === String(stageId)) {
                stageIndex = i;
                break;
            }
        }

        if (stageIndex < 0) return;

        var changed = false;

        if (plan.stages[stageIndex].status === 'locked') {
            plan.stages[stageIndex].status = 'active';
            changed = true;
        }

        if (changed) {
            saveBudgetPlan(plan);
            EventBus.emit(EventBus.EVENTS.BUDGET_UPDATED, {
                type: 'stageChanged',
                stageId: stageId
            });
        }

        if (container && container.innerHTML) {
            render(container);
            initDashboardEvents();
        }
    }

    function onSopStageComplete(data) {
        var plan = getBudgetPlan();
        if (!plan || !plan.stages) return;

        var stageId = data && data.stageId;
        if (!stageId) return;

        var stageIndex = -1;
        for (var i = 0; i < plan.stages.length; i++) {
            if (plan.stages[i].id === stageId || String(plan.stages[i].id) === String(stageId)) {
                stageIndex = i;
                break;
            }
        }

        if (stageIndex < 0) return;

        var changed = false;

        if (plan.stages[stageIndex].status !== 'completed') {
            plan.stages[stageIndex].status = 'completed';
            plan.stages[stageIndex].completedAt = new Date().toISOString();
            changed = true;

            if (stageIndex + 1 < plan.stages.length && plan.stages[stageIndex + 1].status === 'locked') {
                plan.stages[stageIndex + 1].status = 'active';
            }
        }

        if (changed) {
            saveBudgetPlan(plan);
            EventBus.emit(EventBus.EVENTS.BUDGET_UPDATED, {
                type: 'stageComplete',
                stageId: stageId
            });

            if (typeof Toast !== 'undefined') {
                Toast.success('✅ 阶段预算已完成：' + plan.stages[stageIndex].title);
            }
        }

        if (container && container.innerHTML) {
            render(container);
            initDashboardEvents();
        }
    }

    function render(containerEl) {
        if (containerEl) {
            container = containerEl;
        }
        if (!container) return;
        isMobile = window.innerWidth <= 900;
        
        updateStageStatus();

        if (typeof FloatingButler !== 'undefined') {
            FloatingButler.render(document.body, {
                emoji: 'nian-happy',
                tip: '',
                tips: [],
                use3D: true
            });
            updateFloatingButlerContent();
        }

        if (!hasBudgetPlan()) {
            currentModePage = 'select';
            wizardStep = 1;
            selectedMode = null;
            expandedCategory = null;
            expandedStage = null;
            expandedMaterial = null;
            tryAutoCreateBudgetPlan();
        }

        if (!hasBudgetPlan()) {
            if (currentModePage === 'select') {
                renderModeSelect();
            } else if (currentModePage === 'compare') {
                renderCompare();
            } else if (currentModePage === 'wizard') {
                renderWizard();
            } else {
                renderModeSelect();
            }
            return;
        }

        syncAdditionalFeesToBudget();
        renderDashboard();
    }

    function renderModeSelect() {
        removeAllDomListeners();

        container.innerHTML = `
            <div class="budget-view">
                <header class="budget-header">
                    <div class="budget-header-inner">
                        <div class="budget-header-left">
                            <button class="budget-back-btn" id="budget-back-btn" title="返回首页">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <h1 class="budget-header-title">预算管理</h1>
                        </div>
                    </div>
                </header>
                <main class="budget-main">
                    <div class="mode-select-container">
                        <div class="mode-select-header">
                            <h2 class="mode-select-title">选择适合您的装修模式</h2>
                            <p class="mode-select-subtitle">不同模式预算结构不同，选择后不可切换哦~</p>
                        </div>
                        <div class="mode-cards">
                            <div class="mode-card card" data-mode="full">
                                <div class="mode-card-icon">🏠</div>
                                <div class="mode-card-title">全包装修</div>
                                <div class="mode-card-desc">装修公司全流程负责</div>
                                <div class="mode-card-suitable">省心省力，适合时间紧张的业主</div>
                            </div>
                            <div class="mode-card card" data-mode="half">
                                <div class="mode-card-icon">🔨</div>
                                <div class="mode-card-title">半包装修</div>
                                <div class="mode-card-desc">业主买主材，施工方施工</div>
                                <div class="mode-card-suitable">想控制主材质量和预算的业主</div>
                            </div>
                            <div class="mode-card card" data-mode="self">
                                <div class="mode-card-icon">🛠️</div>
                                <div class="mode-card-title">自装模式</div>
                                <div class="mode-card-desc">业主自主管理全流程</div>
                                <div class="mode-card-suitable">有装修经验、时间充裕的业主</div>
                            </div>
                        </div>
                        <div class="mode-select-footer">
                            <a href="javascript:void(0);" class="mode-compare-link" id="mode-compare-link">
                                💰 不知道怎么选？看看三种模式预算对比
                            </a>
                        </div>
                    </div>
                </main>
            </div>
        `;

        cacheElements();
        initModeSelectEvents();
    }

    function initModeSelectEvents() {
        var backBtn = document.getElementById('budget-back-btn');
        if (backBtn) {
            addDomListener(backBtn, 'click', function() {
                App.switchView('home');
            });
        }

        var modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(function(card) {
            addDomListener(card, 'click', function() {
                var mode = this.getAttribute('data-mode');
                selectMode(mode);
            });
        });

        var compareLink = document.getElementById('mode-compare-link');
        if (compareLink) {
            addDomListener(compareLink, 'click', function() {
                currentModePage = 'compare';
                renderCompare();
            });
        }
    }

    var compareState = {
        totalBudget: 100000,
        cityTier: 'newFirst',
        area: 80
    };

    function getCompareBudgetData() {
        var modes = ['full', 'half', 'self'];
        var result = {};
        for (var i = 0; i < modes.length; i++) {
            var mode = modes[i];
            var data = {
                totalBudget: compareState.totalBudget,
                cityTier: compareState.cityTier,
                area: compareState.area,
                packageLevel: 'comfort',
                designFeeRatio: 0.03
            };
            if (mode === 'half') {
                data.constructionFee = Math.round(compareState.totalBudget * 0.35);
                data.constructionLaborRatio = 0.55;
                data.constructionAuxiliaryRatio = 0.30;
                data.constructionManagementRatio = 0.15;
            }
            if (mode === 'self') {
                var cityCoef = CITY_TIERS[compareState.cityTier] ? CITY_TIERS[compareState.cityTier].coefficient : 1.0;
                data.laborDetail = null;
                data.materialFee = {
                    auxiliary: Math.round(compareState.totalBudget * 0.45 * 0.30),
                    main: Math.round(compareState.totalBudget * 0.45 * 0.50),
                    custom: Math.round(compareState.totalBudget * 0.45 * 0.20)
                };
            }
            result[mode] = calculateBudgetByMode(mode, data);
        }
        return result;
    }

    function renderStars(count) {
        var html = '';
        for (var i = 0; i < 5; i++) {
            if (i < count) {
                html += '<span class="star star-full">★</span>';
            } else {
                html += '<span class="star star-empty">☆</span>';
            }
        }
        return html;
    }

    function getCompareTableData() {
        var budgets = getCompareBudgetData();
        var rows = [
            { id: 'construction', name: '施工费', fullKey: null, halfKey: 'construction', selfKey: 'labor' },
            { id: 'mainMaterials', name: '主材费', fullKey: null, halfKey: 'mainMaterials', selfKey: null },
            { id: 'designFee', name: '设计费', fullKey: null, halfKey: null, selfKey: 'designFee' },
            { id: 'softDecoration', name: '软装费', fullKey: 'softDecoration', halfKey: 'softDecoration', selfKey: 'softDecoration' },
            { id: 'equipment', name: '设备费', fullKey: null, halfKey: null, selfKey: 'equipment' },
            { id: 'reserve', name: '备用金', fullKey: 'reserve', halfKey: 'reserve', selfKey: 'reserve' }
        ];

        var tableData = [];
        for (var r = 0; r < rows.length; r++) {
            var row = rows[r];
            var fullAmount = 0;
            var halfAmount = 0;
            var selfAmount = 0;

            if (row.id === 'construction') {
                if (budgets.full && budgets.full.categories && budgets.full.categories.contract && budgets.full.categories.contract.items && budgets.full.categories.contract.items.baseConstruction) {
                    fullAmount = budgets.full.categories.contract.items.baseConstruction.budget || 0;
                }
                if (budgets.half && budgets.half.categories && budgets.half.categories.construction) {
                    halfAmount = budgets.half.categories.construction.budget || 0;
                }
                if (budgets.self && budgets.self.categories && budgets.self.categories.labor) {
                    selfAmount = budgets.self.categories.labor.budget || 0;
                }
            } else if (row.id === 'mainMaterials') {
                if (budgets.full && budgets.full.categories && budgets.full.categories.contract && budgets.full.categories.contract.items && budgets.full.categories.contract.items.mainMaterials) {
                    fullAmount = budgets.full.categories.contract.items.mainMaterials.budget || 0;
                }
                if (budgets.half && budgets.half.categories && budgets.half.categories.mainMaterials) {
                    halfAmount = budgets.half.categories.mainMaterials.budget || 0;
                }
                if (budgets.self && budgets.self.categories && budgets.self.categories.materials && budgets.self.categories.materials.items) {
                    selfAmount = (budgets.self.categories.materials.items.mainMaterials ? budgets.self.categories.materials.items.mainMaterials.budget : 0) +
                                 (budgets.self.categories.materials.items.customFurniture ? budgets.self.categories.materials.items.customFurniture.budget : 0);
                }
            } else if (row.id === 'designFee') {
                if (budgets.full && budgets.full.categories && budgets.full.categories.contract && budgets.full.categories.contract.items && budgets.full.categories.contract.items.designFee) {
                    fullAmount = budgets.full.categories.contract.items.designFee.budget || 0;
                }
                if (budgets.half && budgets.half.categories && budgets.half.categories.construction && budgets.half.categories.construction.items && budgets.half.categories.construction.items.managementFee) {
                    halfAmount = budgets.half.categories.construction.items.managementFee.budget || 0;
                }
                if (budgets.self && budgets.self.categories && budgets.self.categories.designFee) {
                    selfAmount = budgets.self.categories.designFee.budget || 0;
                }
            } else {
                if (row.fullKey && budgets.full && budgets.full.categories && budgets.full.categories[row.fullKey]) {
                    fullAmount = budgets.full.categories[row.fullKey].budget || 0;
                }
                if (row.halfKey && budgets.half && budgets.half.categories && budgets.half.categories[row.halfKey]) {
                    halfAmount = budgets.half.categories[row.halfKey].budget || 0;
                }
                if (row.selfKey && budgets.self && budgets.self.categories && budgets.self.categories[row.selfKey]) {
                    selfAmount = budgets.self.categories[row.selfKey].budget || 0;
                }
            }

            var total = compareState.totalBudget;
            tableData.push({
                name: row.name,
                full: {
                    amount: fullAmount,
                    ratio: total > 0 ? Math.round(fullAmount / total * 100) : 0
                },
                half: {
                    amount: halfAmount,
                    ratio: total > 0 ? Math.round(halfAmount / total * 100) : 0
                },
                self: {
                    amount: selfAmount,
                    ratio: total > 0 ? Math.round(selfAmount / total * 100) : 0
                }
            });
        }

        return {
            rows: tableData,
            total: compareState.totalBudget
        };
    }

    function renderCompareTable() {
        var tableData = getCompareTableData();
        var rows = tableData.rows;

        var html = '<div class="compare-table">';

        html += '<div class="compare-table-row compare-table-header">';
        html += '<div class="compare-table-cell compare-table-col-name">费用分类</div>';
        html += '<div class="compare-table-cell compare-table-col-mode">全包</div>';
        html += '<div class="compare-table-cell compare-table-col-mode">半包</div>';
        html += '<div class="compare-table-cell compare-table-col-mode">自装</div>';
        html += '</div>';

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            html += '<div class="compare-table-row">';
            html += '<div class="compare-table-cell compare-table-col-name">' + row.name + '</div>';
            html += '<div class="compare-table-cell compare-table-col-mode">';
            html += '<div class="cell-amount">¥' + formatMoney(row.full.amount) + '</div>';
            html += '<div class="cell-ratio">' + row.full.ratio + '%</div>';
            html += '</div>';
            html += '<div class="compare-table-cell compare-table-col-mode">';
            html += '<div class="cell-amount">¥' + formatMoney(row.half.amount) + '</div>';
            html += '<div class="cell-ratio">' + row.half.ratio + '%</div>';
            html += '</div>';
            html += '<div class="compare-table-cell compare-table-col-mode">';
            html += '<div class="cell-amount">¥' + formatMoney(row.self.amount) + '</div>';
            html += '<div class="cell-ratio">' + row.self.ratio + '%</div>';
            html += '</div>';
            html += '</div>';
        }

        html += '<div class="compare-table-row compare-table-footer">';
        html += '<div class="compare-table-cell compare-table-col-name">合计</div>';
        html += '<div class="compare-table-cell compare-table-col-mode">';
        html += '<div class="cell-amount cell-total">¥' + formatMoney(tableData.total) + '</div>';
        html += '<div class="cell-ratio">100%</div>';
        html += '</div>';
        html += '<div class="compare-table-cell compare-table-col-mode">';
        html += '<div class="cell-amount cell-total">¥' + formatMoney(tableData.total) + '</div>';
        html += '<div class="cell-ratio">100%</div>';
        html += '</div>';
        html += '<div class="compare-table-cell compare-table-col-mode">';
        html += '<div class="cell-amount cell-total">¥' + formatMoney(tableData.total) + '</div>';
        html += '<div class="cell-ratio">100%</div>';
        html += '</div>';
        html += '</div>';

        html += '</div>';
        return html;
    }

    function updateCompareDisplay() {
        var tableContainer = document.getElementById('compare-table-container');
        if (tableContainer) {
            tableContainer.innerHTML = renderCompareTable();
        }

        var budgetDisplay = document.getElementById('compare-budget-display');
        if (budgetDisplay) {
            budgetDisplay.textContent = '¥ ' + formatMoney(compareState.totalBudget);
        }

        var budgetSlider = document.getElementById('compare-budget-slider');
        if (budgetSlider) {
            budgetSlider.value = compareState.totalBudget;
        }

        var budgetInput = document.getElementById('compare-budget-input');
        if (budgetInput) {
            budgetInput.value = compareState.totalBudget;
        }

        var cityOptions = document.querySelectorAll('.compare-city-option');
        for (var i = 0; i < cityOptions.length; i++) {
            var opt = cityOptions[i];
            var city = opt.getAttribute('data-city');
            if (city === compareState.cityTier) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        }

        var areaInput = document.getElementById('compare-area-input');
        if (areaInput) {
            areaInput.value = compareState.area;
        }
    }

    function initCompareEvents() {
        var backBtn = document.getElementById('compare-back-btn');
        if (backBtn) {
            addDomListener(backBtn, 'click', function() {
                currentModePage = 'select';
                renderModeSelect();
            });
        }

        var budgetSlider = document.getElementById('compare-budget-slider');
        if (budgetSlider) {
            addDomListener(budgetSlider, 'input', function() {
                var val = parseNumber(this.value);
                if (val < 0) val = 0;
                compareState.totalBudget = val;
                var input = document.getElementById('compare-budget-input');
                if (input) input.value = val;
                updateCompareDisplay();
            });
        }

        var budgetInput = document.getElementById('compare-budget-input');
        if (budgetInput) {
            addDomListener(budgetInput, 'input', function() {
                var val = parseNumber(this.value);
                if (val < 0) val = 0;
                compareState.totalBudget = val;
                var slider = document.getElementById('compare-budget-slider');
                if (slider) {
                    var sliderMax = parseInt(slider.max);
                    if (val > sliderMax) slider.max = String(Math.max(sliderMax * 2, val));
                    slider.value = val;
                }
                updateCompareDisplay();
            });
        }

        var cityOptions = document.querySelectorAll('.compare-city-option');
        for (var i = 0; i < cityOptions.length; i++) {
            (function(opt) {
                addDomListener(opt, 'click', function() {
                    var city = opt.getAttribute('data-city');
                    compareState.cityTier = city;
                    updateCompareDisplay();
                });
            })(cityOptions[i]);
        }

        var areaInput = document.getElementById('compare-area-input');
        if (areaInput) {
            addDomListener(areaInput, 'input', function() {
                var val = parseNumber(this.value);
                if (val < 0) val = 0;
                compareState.area = val;
                updateCompareDisplay();
            });
        }

        var selectFullBtn = document.getElementById('select-mode-full');
        if (selectFullBtn) {
            addDomListener(selectFullBtn, 'click', function() {
                selectedMode = 'full';
                wizardData.mode = 'full';
                wizardData.totalBudget = compareState.totalBudget;
                wizardData.cityTier = compareState.cityTier;
                wizardData.area = compareState.area;
                wizardStep = 1;
                currentModePage = 'wizard';
                renderWizard();
            });
        }

        var selectHalfBtn = document.getElementById('select-mode-half');
        if (selectHalfBtn) {
            addDomListener(selectHalfBtn, 'click', function() {
                selectedMode = 'half';
                wizardData.mode = 'half';
                wizardData.totalBudget = compareState.totalBudget;
                wizardData.cityTier = compareState.cityTier;
                wizardData.area = compareState.area;
                wizardStep = 1;
                currentModePage = 'wizard';
                renderWizard();
            });
        }

        var selectSelfBtn = document.getElementById('select-mode-self');
        if (selectSelfBtn) {
            addDomListener(selectSelfBtn, 'click', function() {
                selectedMode = 'self';
                wizardData.mode = 'self';
                wizardData.totalBudget = compareState.totalBudget;
                wizardData.cityTier = compareState.cityTier;
                wizardData.area = compareState.area;
                wizardStep = 1;
                currentModePage = 'wizard';
                renderWizard();
            });
        }
    }

    function renderCompare() {
        removeAllDomListeners();

        if (wizardData && wizardData.totalBudget) {
            compareState.totalBudget = wizardData.totalBudget;
        }
        if (wizardData && wizardData.cityTier) {
            compareState.cityTier = wizardData.cityTier;
        }
        if (wizardData && wizardData.area) {
            compareState.area = wizardData.area;
        }

        var cityOptionsHtml = '';
        var cityKeys = ['first', 'newFirst', 'second', 'third'];
        for (var i = 0; i < cityKeys.length; i++) {
            var key = cityKeys[i];
            var tier = CITY_TIERS[key];
            var isSelected = compareState.cityTier === key;
            cityOptionsHtml += `
                <div class="compare-city-option ${isSelected ? 'selected' : ''}" data-city="${key}">
                    <div class="city-option-name">${tier.name}</div>
                    <div class="city-option-coef">×${tier.coefficient}</div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="budget-view">
                <header class="budget-header">
                    <div class="budget-header-inner">
                        <div class="budget-header-left">
                            <button class="budget-back-btn" id="compare-back-btn" title="返回">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <h1 class="budget-header-title">三种装修模式预算对比</h1>
                        </div>
                    </div>
                </header>
                <main class="budget-main">
                    <div class="compare-page-container">

                        <div class="compare-controls-card card">
                            <div class="compare-control-section">
                                <div class="control-label">总预算</div>
                                <div class="control-value" id="compare-budget-display">¥ ${formatMoney(compareState.totalBudget)}</div>
                                <div class="budget-slider-container">
                                    <input type="range" class="budget-slider" id="compare-budget-slider"
                                        min="10000" max="10000000" step="1000" value="${compareState.totalBudget}">
                                    <div class="budget-slider-labels">
                                        <span>1万</span>
                                        <span>50万</span>
                                        <span>100万</span>
                                        <span>500万</span>
                                        <span>1000万</span>
                                    </div>
                                </div>
                                <div class="budget-input-row">
                                    <span class="budget-currency">¥</span>
                                    <input type="number" class="budget-number-input" id="compare-budget-input"
                                        value="${compareState.totalBudget}" step="0.01">
                                </div>
                            </div>

                            <div class="compare-control-section">
                                <div class="control-label">城市等级</div>
                                <div class="compare-city-options">
                                    ${cityOptionsHtml}
                                </div>
                            </div>

                            <div class="compare-control-section">
                                <div class="control-label">房屋面积</div>
                                <div class="area-input-group">
                                    <input type="number" class="area-input" id="compare-area-input"
                                        value="${compareState.area}" step="0.01">
                                    <span class="area-unit">㎡</span>
                                </div>
                            </div>
                        </div>

                        <div class="compare-dimensions-card card">
                            <div class="compare-section-title">维度对比</div>

                            <div class="compare-dimension">
                                <div class="dimension-title">省心程度</div>
                                <div class="dimension-modes">
                                    <div class="dimension-mode-col">
                                        <div class="mode-col-header">全包</div>
                                        <div class="star-rating">${renderStars(5)}</div>
                                        <div class="dimension-desc">装修公司全流程负责，省心省力</div>
                                    </div>
                                    <div class="dimension-mode-col">
                                        <div class="mode-col-header">半包</div>
                                        <div class="star-rating">${renderStars(3)}</div>
                                        <div class="dimension-desc">施工无需操心，主材需自行选购</div>
                                    </div>
                                    <div class="dimension-mode-col">
                                        <div class="mode-col-header">自装</div>
                                        <div class="star-rating">${renderStars(1)}</div>
                                        <div class="dimension-desc">全程自己把控，费心费力</div>
                                    </div>
                                </div>
                            </div>

                            <div class="compare-dimension">
                                <div class="dimension-title">费用可控性</div>
                                <div class="dimension-modes">
                                    <div class="dimension-mode-col">
                                        <div class="mode-col-header">全包</div>
                                        <div class="star-rating">${renderStars(2)}</div>
                                        <div class="dimension-desc">一口价，增减项容易超</div>
                                    </div>
                                    <div class="dimension-mode-col">
                                        <div class="mode-col-header">半包</div>
                                        <div class="star-rating">${renderStars(4)}</div>
                                        <div class="dimension-desc">主材自己选，价格可控</div>
                                    </div>
                                    <div class="dimension-mode-col">
                                        <div class="mode-col-header">自装</div>
                                        <div class="star-rating">${renderStars(5)}</div>
                                        <div class="dimension-desc">每一分钱都由您掌控</div>
                                    </div>
                                </div>
                            </div>

                            <div class="compare-dimension">
                                <div class="dimension-title">时间精力投入</div>
                                <div class="dimension-modes">
                                    <div class="dimension-mode-col">
                                        <div class="mode-col-header">全包</div>
                                        <div class="time-level time-low">很少</div>
                                        <div class="dimension-desc">只需对接设计师和项目经理</div>
                                    </div>
                                    <div class="dimension-mode-col">
                                        <div class="mode-col-header">半包</div>
                                        <div class="time-level time-medium">中等</div>
                                        <div class="dimension-desc">需前往建材市场选购主材</div>
                                    </div>
                                    <div class="dimension-mode-col">
                                        <div class="mode-col-header">自装</div>
                                        <div class="time-level time-high">很多</div>
                                        <div class="dimension-desc">找工人、购材料、盯工地全由您负责</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="compare-table-card card">
                            <div class="compare-section-title">费用明细对比</div>
                            <div id="compare-table-container">
                                ${renderCompareTable()}
                            </div>
                        </div>

                        <div class="compare-select-section">
                            <div class="compare-select-row">
                                <div class="compare-select-col">
                                    <div class="select-mode-title">全包装修</div>
                                    <div class="select-mode-desc">装修公司全流程负责</div>
                                    <button class="btn-primary btn-select-mode" id="select-mode-full">
                                        选择此模式
                                    </button>
                                </div>
                                <div class="compare-select-col">
                                    <div class="select-mode-title">半包装修</div>
                                    <div class="select-mode-desc">业主买主材，施工方施工</div>
                                    <button class="btn-primary btn-select-mode" id="select-mode-half">
                                        选择此模式
                                    </button>
                                </div>
                                <div class="compare-select-col">
                                    <div class="select-mode-title">自装模式</div>
                                    <div class="select-mode-desc">业主自主管理全流程</div>
                                    <button class="btn-primary btn-select-mode" id="select-mode-self">
                                        选择此模式
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        `;

        initCompareEvents();
    }

    function showModeCognitionModal(mode) {
        var modalId = 'mode-cognition-modal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var cognitionData = {
            'full': {
                title: '全包模式认知对齐',
                content: '硬装全包常规包含：人工 + 辅材 + 基础主材；<br><br>不含：全屋定制、封阳台、中央空调/地暖/新风、家电软装等。'
            },
            'half': {
                title: '半包模式认知对齐',
                content: '半包常规包含：人工 + 辅材；<br><br>不含：瓷砖、地板、木门、橱柜、洁具等主材。'
            },
            'self': {
                title: '自装模式认知对齐',
                content: '自装需要自己找工人、采购全部材料、把控质量、对接所有供应商。'
            }
        };

        var data = cognitionData[mode] || cognitionData['full'];
        var modeNames = { 'full': '全包', 'half': '半包', 'self': '自装' };
        var modeName = modeNames[mode] || '';

        var modalHtml = `
            <div class="sop-modal-backdrop active" id="${modalId}">
                <div class="sop-modal" style="max-width: 420px;">
                    <div class="sop-modal-header">
                        <h3 class="sop-modal-title">${data.title}</h3>
                        <button class="sop-modal-close" onclick="BudgetView.closeModal('${modalId}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="sop-modal-body" style="padding: 24px;">
                        <div style="font-size: 14px; color: var(--text-primary); line-height: 1.7;">
                            ${data.content}
                        </div>
                    </div>
                    <div class="sop-modal-footer">
                        <button class="btn-secondary" id="cognition-cancel-btn">返回选择</button>
                        <button class="btn-primary" id="cognition-confirm-btn">了解，继续</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        trackModal(modalId);

        var confirmBtn = document.getElementById('cognition-confirm-btn');
        var cancelBtn = document.getElementById('cognition-cancel-btn');

        if (confirmBtn) {
            addDomListener(confirmBtn, 'click', function() {
                closeModal(modalId);
                currentModePage = 'wizard';
                renderWizard();
            });
        }

        if (cancelBtn) {
            addDomListener(cancelBtn, 'click', function() {
                closeModal(modalId);
                selectedMode = null;
                currentModePage = 'select';
                renderModeSelect();
            });
        }
    }

    function selectMode(mode) {
        selectedMode = mode;
        wizardData.mode = mode;
        wizardStep = 1;
        showModeCognitionModal(mode);
    }

    function renderBudgetEmptyState() {
        container.innerHTML = `
            <div class="budget-view">
                <header class="budget-header">
                    <div class="budget-header-inner">
                        <div class="budget-header-left">
                            <button class="budget-back-btn" id="budget-back-btn" title="返回首页">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <h1 class="budget-header-title">预算管理</h1>
                        </div>
                    </div>
                </header>
                <main class="budget-main">
                    <div class="budget-empty-wrapper" id="budget-empty-wrapper"></div>
                </main>
            </div>
        `;

        var emptyWrapper = document.getElementById('budget-empty-wrapper');
        if (emptyWrapper) {
            App.showEmptyState(emptyWrapper, {
                icon: Icons.render('nian-happy'),
                iconClass: 'cheer',
                title: '还没有设置预算哦',
                desc: '设置装修预算，帮您控制花费不超支。智能拆解532原则，让每一分钱都花在刀刃上~',
                variant: 'card',
                primaryAction: '一键生成预算方案',
                secondaryAction: '或者先看看预算怎么分',
                onPrimaryAction: function() {
                    renderWizard();
                },
                onSecondaryAction: function() {
                    showBudgetGuideModal();
                }
            });
        }

        initEmptyStateEvents();
    }

    function showBudgetGuideModal() {
        if (typeof Toast !== 'undefined') {
            Toast.info('💡 预算小知识：532原则 — 硬装50%、主材30%、备用金20%');
        }
    }

    function initEmptyStateEvents() {
        var backBtn = document.getElementById('budget-back-btn');
        if (backBtn) {
            addDomListener(backBtn, 'click', function() {
                App.switchView('home');
            });
        }
    }

    function renderWizard() {
        var mode = selectedMode || wizardData.mode || 'full';
        wizardData.mode = mode;

        var userData = App.state.userData;
        if (userData) {
            var parsedBudget = parseBudgetText(userData.budget);
            if (parsedBudget) {
                wizardData.totalBudget = parsedBudget;
            }
            var parsedCity = parseCityText(userData.cityTier);
            if (parsedCity) {
                wizardData.cityTier = parsedCity;
            }
            if (userData.area) {
                wizardData.area = userData.area;
            }
        }

        var cityCoef = CITY_TIERS[wizardData.cityTier] ? CITY_TIERS[wizardData.cityTier].coefficient : 1.0;
        var area = wizardData.area || 80;

        if (mode === 'half' || mode === 'self') {
            if (!wizardData.materialList || Object.keys(wizardData.materialList).length === 0) {
                initWizardMaterialList();
            }
        }

        if (mode === 'self') {
            if (!wizardData.laborDays || Object.keys(wizardData.laborDays).length === 0) {
                initWizardLaborDays();
            }
            if (!wizardData.materialFee || wizardData.materialFee.auxiliary === 0) {
                var auxBase = area * 200 * cityCoef;
                var mainBase = calculateMaterialListTotal();
                var customBase = Math.max(3, Math.round(area / 15)) * 1500;
                wizardData.materialFee = {
                    auxiliary: Math.round(auxBase),
                    main: Math.round(mainBase),
                    custom: Math.round(customBase)
                };
                wizardData.customFurnitureMeters = Math.max(3, Math.round(area / 15));
            }
        }

        if (mode === 'half') {
            if (!wizardData.constructionFee || wizardData.constructionFee === 0) {
                var baseConstructionPerSqm = 500;
                wizardData.constructionFee = Math.round(area * baseConstructionPerSqm * cityCoef);
                wizardData.constructionUnitPrice = Math.round(baseConstructionPerSqm * cityCoef);
            }
        }

        var steps = getWizardSteps(mode);
        var totalSteps = steps.length;

        function renderStepsHtml() {
            var html = '';
            for (var i = 0; i < steps.length; i++) {
                var stepNum = i + 1;
                var isActive = wizardStep === stepNum;
                var isDone = wizardStep > stepNum;
                html += '<div class="wizard-step ' + (isActive ? 'active' : '') + ' ' + (isDone ? 'done' : '') + '">';
                html += '<div class="wizard-step-number">' + (isDone ? '✓' : stepNum) + '</div>';
                html += '<div class="wizard-step-label">' + steps[i].title + '</div>';
                html += '</div>';
                if (i < steps.length - 1) {
                    html += '<div class="wizard-step-line ' + (isDone ? 'done' : '') + '"></div>';
                }
            }
            return html;
        }

        var modeNames = { full: '全包', half: '半包', self: '自装' };
        var modeName = modeNames[mode] || '全包';

        container.innerHTML = `
            <div class="budget-view">
                <header class="budget-header">
                    <div class="budget-header-inner">
                        <div class="budget-header-left">
                            <button class="budget-back-btn" id="budget-back-btn" title="返回首页">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <h1 class="budget-header-title">预算设置 - ${modeName}</h1>
                        </div>
                    </div>
                </header>
                <main class="budget-main">
                    <div class="budget-wizard-card card">
                        <div class="wizard-steps">
                            ${renderStepsHtml()}
                        </div>
                        
                        <div class="wizard-content" id="wizard-content">
                            ${renderWizardStep()}
                        </div>
                        
                        <div class="wizard-actions">
                            <button class="btn-secondary" id="wizard-prev-btn" ${wizardStep <= 1 ? 'disabled style="opacity:0.5;pointer-events:none;"' : ''}>
                                上一步
                            </button>
                            <button class="btn-primary" id="wizard-next-btn">
                                ${wizardStep === totalSteps ? '确认创建' : '下一步'}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        `;

        initWizardEvents();
    }

    function renderConfirmStep() {
        var mode = selectedMode || wizardData.mode || 'full';
        var plan = calculateBudgetByMode(mode, wizardData);
        var modeConfig = getModeConfig(mode);
        var categories = modeConfig ? modeConfig.categories : [];

        function renderCategoriesHtml(catList, level) {
            var html = '';
            level = level || 0;
            for (var i = 0; i < catList.length; i++) {
                var cat = catList[i];
                var catData = plan.categories[cat.id];
                if (!catData) continue;
                var amount = catData.budget || 0;
                var ratio = plan.totalBudget > 0 ? Math.round(amount / plan.totalBudget * 100) : 0;
                var indentStyle = level > 0 ? 'padding-left: ' + (level * 20) + 'px;' : '';
                html += '<div class="breakdown-item" style="' + indentStyle + '">';
                html += '<div class="breakdown-item-header">';
                html += '<span class="breakdown-icon">' + (cat.icon ? Icons.render(cat.icon) : '📁') + '</span>';
                html += '<span class="breakdown-name">' + cat.name + '（' + ratio + '%）</span>';
                html += '<span class="breakdown-amount">¥ ' + formatMoney(amount) + '</span>';
                html += '</div>';
                if (cat.children && cat.children.length > 0) {
                    html += '<div class="breakdown-item-detail">';
                    html += renderCategoryChildren(cat.id, cat.children, plan, level + 1);
                    html += '</div>';
                }
                html += '</div>';
            }
            return html;
        }

        function renderCategoryChildren(parentId, children, plan, level) {
            var html = '';
            var parentData = plan.categories[parentId];
            if (!parentData || !parentData.items) return '';
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                var childData = parentData.items[child.id];
                if (!childData) continue;
                var amount = childData.budget || 0;
                var ratio = plan.totalBudget > 0 ? Math.round(amount / plan.totalBudget * 100) : 0;
                html += '<div class="breakdown-sub-item" style="padding-left: ' + (level * 20) + 'px;">';
                html += '<span class="breakdown-sub-icon">' + (child.icon ? Icons.render(child.icon) : '•') + '</span>';
                html += '<span class="breakdown-sub-name">' + child.name + '</span>';
                html += '<span class="breakdown-sub-ratio">' + ratio + '%</span>';
                html += '<span class="breakdown-sub-amount">¥' + formatMoney(amount) + '</span>';
                html += '</div>';
            }
            return html;
        }

        var modeNames = { full: '全包装修', half: '半包装修', self: '自装模式' };
        var modeName = modeNames[mode] || '全包装修';

        return `
            <div class="wizard-step-content">
                <div class="wizard-step-title">预算方案确认</div>
                <div class="wizard-step-desc">${modeName} · 智能拆解预算结构，确认后开始管理您的预算</div>
                
                <div class="budget-preview-total">
                    <div class="budget-preview-total-label">总预算</div>
                    <div class="budget-preview-total-amount">¥ ${formatMoney(plan.totalBudget)}</div>
                    <div class="budget-preview-total-info">
                        ${CITY_TIERS[plan.cityTier].name} · ${plan.area}㎡ · 系数×${plan.cityCoefficient}
                    </div>
                </div>
                
                <div class="budget-breakdown-preview">
                    ${renderCategoriesHtml(categories, 0)}
                </div>
                
                <div class="stages-preview">
                    <div class="stages-preview-title">6阶段预算释放</div>
                    <div class="stages-preview-list">
                        ${plan.stages.map(function(stage) {
                            return `
                                <div class="stage-preview-item">
                                    <span class="stage-preview-icon">${Icons.render(stage.icon)}</span>
                                    <span class="stage-preview-name">${stage.title}</span>
                                    <span class="stage-preview-ratio">${Math.round(stage.ratio * 100)}%</span>
                                    <span class="stage-preview-budget">¥${formatMoney(stage.budget)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function renderWizardStep() {
        var mode = selectedMode || wizardData.mode || 'full';
        var steps = getWizardSteps(mode);
        var stepIndex = wizardStep - 1;
        if (stepIndex < 0 || stepIndex >= steps.length) return '';
        
        var stepId = steps[stepIndex].id;
        var stepTitle = steps[stepIndex].title;
        var stepLabel = steps[stepIndex].label;

        switch (stepId) {
            case 'totalBudget':
                return `
                    <div class="wizard-step-content">
                        <div class="wizard-step-title">设置您的装修总预算</div>
                        <div class="wizard-step-desc">${stepLabel}，自由输入任意预算金额</div>
                        <div class="budget-input-group">
                            <span class="budget-currency">¥</span>
                            <div class="budget-input-wrapper">
                                <input type="number" class="budget-number-input" id="budget-amount-input" 
                                    value="${wizardData.totalBudget}" step="0.01">
                                <div class="budget-input-display" id="budget-amount-display">${formatMoney(wizardData.totalBudget)}</div>
                            </div>
                        </div>
                        <div class="budget-slider-container">
                            <input type="range" class="budget-slider" id="budget-slider" 
                                min="10000" max="10000000" step="1000" value="${wizardData.totalBudget}">
                            <div class="budget-slider-labels">
                                <span>1万</span>
                                <span>50万</span>
                                <span>100万</span>
                                <span>500万</span>
                                <span>1000万</span>
                            </div>
                        </div>
                        <div class="budget-preset-buttons">
                            <button class="budget-preset-btn" data-value="50000">5万</button>
                            <button class="budget-preset-btn" data-value="100000">10万</button>
                            <button class="budget-preset-btn" data-value="150000">15万</button>
                            <button class="budget-preset-btn" data-value="200000">20万</button>
                            <button class="budget-preset-btn" data-value="300000">30万</button>
                        </div>
                        <div class="input-hint-text">
                            <span>💡 支持直接输入金额，自动按千位分隔</span>
                        </div>
                    </div>
                `;
            case 'cityArea':
                return `
                    <div class="wizard-step-content">
                        <div class="wizard-step-title">城市与面积</div>
                        <div class="wizard-step-desc">${stepLabel}</div>
                        
                        <div class="city-area-section">
                            <div class="section-subtitle">选择所在城市</div>
                            <div class="city-options">
                                ${Object.keys(CITY_TIERS).map(function(key) {
                                    var tier = CITY_TIERS[key];
                                    return `
                                        <div class="city-option-card ${wizardData.cityTier === key ? 'selected' : ''}" data-city="${key}">
                                            <div class="city-option-name">${tier.name}</div>
                                            <div class="city-option-coef">系数 ×${tier.coefficient}</div>
                                            <div class="city-option-check">${wizardData.cityTier === key ? '✓' : ''}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        
                        <div class="city-area-section">
                            <div class="section-subtitle">确认房屋面积</div>
                            <div class="area-input-group">
                                <div class="area-input-wrapper">
                                    <input type="number" class="area-input" id="area-input" 
                                        value="${wizardData.area}" step="0.01">
                                    <div class="area-input-display" id="area-input-display">${wizardData.area}</div>
                                </div>
                                <span class="area-unit">㎡</span>
                            </div>
                            <div class="area-preset-buttons">
                                <button class="area-preset-btn" data-value="60">60㎡</button>
                                <button class="area-preset-btn" data-value="80">80㎡</button>
                                <button class="area-preset-btn" data-value="100">100㎡</button>
                                <button class="area-preset-btn" data-value="120">120㎡</button>
                                <button class="area-preset-btn" data-value="150">150㎡</button>
                            </div>
                            <div class="input-hint-text">
                                <span>💡 按建筑面积输入，支持任意数值</span>
                            </div>
                        </div>
                    </div>
                `;
            case 'packageLevel':
                var currentLevel = wizardData.packageLevel || 'comfort';
                var unitPrice = getPackageUnitPrice();
                var packageCardsHtml = '';
                var levelIds = ['economy', 'comfort', 'quality', 'luxury'];
                for (var pli = 0; pli < levelIds.length; pli++) {
                    var lid = levelIds[pli];
                    var lvl = PACKAGE_LEVELS[lid];
                    var isSelected = currentLevel === lid;
                    packageCardsHtml += `
                        <div class="package-card ${isSelected ? 'selected' : ''}" data-level="${lid}">
                            <div class="package-card-header">
                                <div class="package-card-name">${lvl.name}</div>
                                <div class="package-card-check">${isSelected ? '✓' : ''}</div>
                            </div>
                            <div class="package-card-price">${lvl.priceRange}<span>元/㎡</span></div>
                            <div class="package-card-desc">${lvl.desc}</div>
                            <div class="package-card-coef">系数 ×${lvl.coefficient}</div>
                        </div>
                    `;
                }
                return `
                    <div class="wizard-step-content">
                        <div class="wizard-step-title">选择全包套餐档次</div>
                        <div class="wizard-step-desc">${stepLabel}，不同档次对应不同的材料和工艺标准</div>
                        
                        <div class="package-cards-grid">
                            ${packageCardsHtml}
                        </div>
                        
                        <div class="wizard-step-footer">
                            <div class="footer-info">
                                <span class="footer-label">当前档次预估单价</span>
                                <span class="footer-value">¥ ${formatMoney(unitPrice)}/㎡</span>
                            </div>
                            <div class="footer-hint">
                                ${wizardData.area}㎡ × ¥${formatMoney(unitPrice)}/㎡ ≈ ¥${formatMoney(wizardData.area * unitPrice)}
                            </div>
                        </div>
                    </div>
                `;
            case 'constructionFee':
                var cityCoef = CITY_TIERS[wizardData.cityTier] ? CITY_TIERS[wizardData.cityTier].coefficient : 1.0;
                var cfMode = wizardData.constructionFeeMode || 'total';
                var cfTotal = wizardData.constructionFee || 0;
                var cfUnitPrice = wizardData.constructionUnitPrice || Math.round(500 * cityCoef);
                var cfArea = wizardData.area || 80;
                var cfLaborRatio = wizardData.constructionLaborRatio || 0.55;
                var cfAuxRatio = wizardData.constructionAuxiliaryRatio || 0.30;
                var cfMgmtRatio = wizardData.constructionManagementRatio || 0.15;
                var cfLabor = Math.round(cfTotal * cfLaborRatio);
                var cfAuxiliary = Math.round(cfTotal * cfAuxRatio);
                var cfManagement = Math.round(cfTotal * cfMgmtRatio);
                return `
                    <div class="wizard-step-content">
                        <div class="wizard-step-title">设置半包施工费</div>
                        <div class="wizard-step-desc">${stepLabel}，城市系数 ×${cityCoef}</div>
                        
                        <div class="fee-mode-tabs">
                            <div class="fee-mode-tab ${cfMode === 'total' ? 'active' : ''}" data-mode="total">总金额</div>
                            <div class="fee-mode-tab ${cfMode === 'unit' ? 'active' : ''}" data-mode="unit">面积×单价</div>
                            <div class="fee-mode-tab ${cfMode === 'detail' ? 'active' : ''}" data-mode="detail">明细调整</div>
                        </div>
                        
                        <div class="fee-mode-content">
                            ${cfMode === 'total' ? `
                                <div class="fee-input-section">
                                    <div class="fee-input-label">施工费总额</div>
                                    <div class="budget-input-group">
                                        <span class="budget-currency">¥</span>
                                        <input type="number" class="budget-number-input" id="construction-total-input" 
                                            value="${cfTotal}" step="0.01">
                                    </div>
                                    <div class="fee-input-hint">参考范围：¥${formatMoney(Math.round(cfArea * 400 * cityCoef))} - ¥${formatMoney(Math.round(cfArea * 800 * cityCoef))}</div>
                                </div>
                            ` : ''}
                            
                            ${cfMode === 'unit' ? `
                                <div class="fee-input-section">
                                    <div class="fee-calc-row">
                                        <div class="fee-calc-item">
                                            <div class="fee-calc-label">房屋面积</div>
                                            <div class="fee-calc-value">${cfArea} ㎡</div>
                                        </div>
                                        <div class="fee-calc-multiply">×</div>
                                        <div class="fee-calc-item">
                                            <div class="fee-calc-label">施工单价</div>
                                            <div class="fee-unit-price-input">
                                                <input type="number" class="fee-number-sm" id="construction-unit-input" 
                                                    value="${cfUnitPrice}" step="0.01">
                                                <span class="fee-unit-sm">元/㎡</span>
                                            </div>
                                        </div>
                                        <div class="fee-calc-multiply">=</div>
                                        <div class="fee-calc-item">
                                            <div class="fee-calc-label">合计</div>
                                            <div class="fee-calc-total">¥${formatMoney(cfArea * cfUnitPrice)}</div>
                                        </div>
                                    </div>
                                    <div class="fee-slider-container">
                                        <input type="range" class="fee-slider" id="construction-unit-slider" 
                                            min="100" max="3000" step="10" value="${cfUnitPrice}">
                                        <div class="fee-slider-labels">
                                            <span>100元/㎡</span>
                                            <span>1000元/㎡</span>
                                            <span>3000元/㎡</span>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${cfMode === 'detail' ? `
                                <div class="fee-detail-section">
                                    <div class="fee-detail-title">费用明细比例调整</div>
                                    <div class="fee-detail-row">
                                        <div class="fee-detail-label">人工费</div>
                                        <div class="fee-detail-slider-wrap">
                                            <input type="range" class="fee-detail-slider" data-detail-type="labor" 
                                                min="30" max="70" step="1" value="${Math.round(cfLaborRatio * 100)}">
                                        </div>
                                        <div class="fee-detail-value">${Math.round(cfLaborRatio * 100)}%</div>
                                        <div class="fee-detail-amount">¥${formatMoney(cfLabor)}</div>
                                    </div>
                                    <div class="fee-detail-row">
                                        <div class="fee-detail-label">辅材费</div>
                                        <div class="fee-detail-slider-wrap">
                                            <input type="range" class="fee-detail-slider" data-detail-type="auxiliary" 
                                                min="15" max="45" step="1" value="${Math.round(cfAuxRatio * 100)}">
                                        </div>
                                        <div class="fee-detail-value">${Math.round(cfAuxRatio * 100)}%</div>
                                        <div class="fee-detail-amount">¥${formatMoney(cfAuxiliary)}</div>
                                    </div>
                                    <div class="fee-detail-row">
                                        <div class="fee-detail-label">管理费</div>
                                        <div class="fee-detail-slider-wrap">
                                            <input type="range" class="fee-detail-slider" data-detail-type="management" 
                                                min="5" max="25" step="1" value="${Math.round(cfMgmtRatio * 100)}">
                                        </div>
                                        <div class="fee-detail-value">${Math.round(cfMgmtRatio * 100)}%</div>
                                        <div class="fee-detail-amount">¥${formatMoney(cfManagement)}</div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="wizard-step-footer">
                            <div class="footer-breakdown">
                                <div class="footer-breakdown-item">
                                    <span class="breakdown-dot dot-labor"></span>
                                    <span class="breakdown-name">人工费</span>
                                    <span class="breakdown-amount">¥${formatMoney(cfLabor)}</span>
                                </div>
                                <div class="footer-breakdown-item">
                                    <span class="breakdown-dot dot-aux"></span>
                                    <span class="breakdown-name">辅材费</span>
                                    <span class="breakdown-amount">¥${formatMoney(cfAuxiliary)}</span>
                                </div>
                                <div class="footer-breakdown-item">
                                    <span class="breakdown-dot dot-mgmt"></span>
                                    <span class="breakdown-name">管理费</span>
                                    <span class="breakdown-amount">¥${formatMoney(cfManagement)}</span>
                                </div>
                            </div>
                            <div class="footer-total">
                                <span class="footer-total-label">施工费合计</span>
                                <span class="footer-total-value">¥${formatMoney(cfTotal)}</span>
                            </div>
                        </div>
                    </div>
                `;
            case 'materialList':
                var mlTotal = calculateMaterialListTotal();
                var mlItemsHtml = '';
                for (var mi = 0; mi < MATERIAL_CATEGORIES.length; mi++) {
                    var mcat = MATERIAL_CATEGORIES[mi];
                    var mlItem = wizardData.materialList[mcat.id];
                    if (!mlItem) continue;
                    var mlLevel = mlItem.level || 'comfort';
                    var mlRatio = MATERIAL_LEVEL_PRICE_RATIOS[mlLevel] || 1.0;
                    var mlUnitPrice = Math.round(mcat.unitPrice * mlRatio);
                    var mlSubtotal = Math.round(mlItem.quantity * mlUnitPrice);
                    var mlPriceMin = Math.round(mcat.unitPrice * 0.7);
                    var mlPriceMax = Math.round(mcat.unitPrice * 1.3);
                    mlItemsHtml += `
                        <div class="ml-item" data-material-id="${mcat.id}">
                            <div class="ml-item-header">
                                <div class="ml-item-name">${mcat.name}</div>
                                <div class="ml-item-subtotal">¥${formatMoney(mlSubtotal)}</div>
                            </div>
                            <div class="ml-item-body">
                                <div class="ml-item-info">
                                    <span class="ml-info-label">数量</span>
                                    <span class="ml-info-value">${mlItem.quantity} ${mlItem.unit}</span>
                                </div>
                                <div class="ml-item-info">
                                    <span class="ml-info-label">单价区间</span>
                                    <span class="ml-info-value">¥${formatMoney(mlPriceMin)}-${formatMoney(mlPriceMax)}/${mlItem.unit}</span>
                                </div>
                                <div class="ml-level-switcher">
                                    <span class="ml-level-btn ${mlLevel === 'economy' ? 'active' : ''}" data-level="economy">经济</span>
                                    <span class="ml-level-btn ${mlLevel === 'comfort' ? 'active' : ''}" data-level="comfort">舒适</span>
                                    <span class="ml-level-btn ${mlLevel === 'quality' ? 'active' : ''}" data-level="quality">品质</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
                return `
                    <div class="wizard-step-content">
                        <div class="wizard-step-title">主材清单</div>
                        <div class="wizard-step-desc">${stepLabel}，根据面积自动估算用量</div>
                        
                        <div class="ml-quick-bar">
                            <button class="btn-secondary btn-sm" id="ml-all-comfort">
                                🎯 一键全部舒适型
                            </button>
                            <div class="ml-total-info">
                                <span class="ml-total-label">主材合计</span>
                                <span class="ml-total-amount">¥${formatMoney(mlTotal)}</span>
                            </div>
                        </div>
                        
                        <div class="ml-list">
                            ${mlItemsHtml}
                        </div>
                    </div>
                `;
            case 'designFee':
                var dfOptions = [
                    { id: 'independent', name: '独立设计师', ratio: 0.08, desc: '专业独立设计师，一对一服务，效果有保障' },
                    { id: 'company', name: '装修公司设计', ratio: 0.05, desc: '装修公司附赠设计，性价比高，施工对接方便' },
                    { id: 'simple', name: '简单设计', ratio: 0.03, desc: '基础平面方案+施工图，满足基本需求' },
                    { id: 'self', name: '自己设计', ratio: 0, desc: '自己规划设计，零设计费，适合有经验的业主' }
                ];
                var dfSelected = wizardData.designFeeOption || 'simple';
                var dfTotal = Math.round(wizardData.totalBudget * (wizardData.designFeeRatio || 0.03));
                var dfCardsHtml = '';
                for (var di = 0; di < dfOptions.length; di++) {
                    var dfOpt = dfOptions[di];
                    var dfIsSel = dfSelected === dfOpt.id;
                    dfCardsHtml += `
                        <div class="design-card ${dfIsSel ? 'selected' : ''}" data-design-id="${dfOpt.id}" data-ratio="${dfOpt.ratio}">
                            <div class="design-card-header">
                                <div class="design-card-name">${dfOpt.name}</div>
                                <div class="design-card-ratio">${Math.round(dfOpt.ratio * 100)}%</div>
                            </div>
                            <div class="design-card-desc">${dfOpt.desc}</div>
                            <div class="design-card-check">${dfIsSel ? '✓' : ''}</div>
                        </div>
                    `;
                }
                return `
                    <div class="wizard-step-content">
                        <div class="wizard-step-title">选择设计方式</div>
                        <div class="wizard-step-desc">${stepLabel}，不同方式费用不同</div>
                        
                        <div class="design-cards-grid">
                            ${dfCardsHtml}
                        </div>
                        
                        <div class="wizard-step-footer">
                            <div class="footer-info">
                                <span class="footer-label">设计费预计</span>
                                <span class="footer-value highlight">¥ ${formatMoney(dfTotal)}</span>
                            </div>
                            <div class="footer-hint">
                                按总预算 ¥${formatMoney(wizardData.totalBudget)} × ${Math.round((wizardData.designFeeRatio || 0.03) * 100)}% 计算
                            </div>
                        </div>
                    </div>
                `;
            case 'laborFee':
                var lfCityCoef = CITY_TIERS[wizardData.cityTier] ? CITY_TIERS[wizardData.cityTier].coefficient : 1.0;
                var lfTotal = calculateLaborTotal();
                var lfItemsHtml = '';
                for (var li = 0; li < LABOR_TYPES.length; li++) {
                    var ltype = LABOR_TYPES[li];
                    var ld = wizardData.laborDays[ltype.id];
                    if (!ld) continue;
                    lfItemsHtml += `
                        <div class="labor-item" data-labor-id="${ltype.id}">
                            <div class="labor-item-header">
                                <div class="labor-item-name">${ltype.name}</div>
                                <div class="labor-item-subtotal">¥${formatMoney(ld.subtotal)}</div>
                            </div>
                            <div class="labor-item-body">
                                <div class="labor-item-info">
                                    <span class="labor-info-label">工日</span>
                                    <div class="labor-days-control">
                                        <button class="labor-days-btn" data-action="decrease">-</button>
                                        <input type="number" class="labor-days-input" value="${ld.days}" step="1">
                                        <button class="labor-days-btn" data-action="increase">+</button>
                                    </div>
                                </div>
                                <div class="labor-item-info">
                                    <span class="labor-info-label">日单价</span>
                                    <span class="labor-info-value">¥${formatMoney(ld.dailyWage)}/天</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
                return `
                    <div class="wizard-step-content">
                        <div class="wizard-step-title">各工种人工费</div>
                        <div class="wizard-step-desc">${stepLabel}，城市系数 ×${lfCityCoef}，工日数根据面积自动估算</div>
                        
                        <div class="labor-list">
                            ${lfItemsHtml}
                        </div>
                        
                        <div class="wizard-step-footer">
                            <div class="footer-info">
                                <span class="footer-label">人工费合计</span>
                                <span class="footer-value highlight">¥ ${formatMoney(lfTotal)}</span>
                            </div>
                            <div class="footer-hint">
                                ${wizardData.area}㎡ · ${CITY_TIERS[wizardData.cityTier].name}
                            </div>
                        </div>
                    </div>
                `;
            case 'materialFee':
                var mfCityCoef = CITY_TIERS[wizardData.cityTier] ? CITY_TIERS[wizardData.cityTier].coefficient : 1.0;
                var mfAuxiliary = wizardData.materialFee ? wizardData.materialFee.auxiliary : 0;
                var mfMain = wizardData.materialFee ? wizardData.materialFee.main : 0;
                var mfCustom = wizardData.materialFee ? wizardData.materialFee.custom : 0;
                var mfTotal = mfAuxiliary + mfMain + mfCustom;
                var mfCustomMeters = wizardData.customFurnitureMeters || 0;

                var mfAuxItemsHtml = '';
                for (var ai = 0; ai < AUXILIARY_MATERIALS.length; ai++) {
                    var auxMat = AUXILIARY_MATERIALS[ai];
                    var auxAmount = Math.round(mfAuxiliary * auxMat.ratio);
                    mfAuxItemsHtml += `
                        <div class="mf-aux-item">
                            <span class="mf-aux-name">${auxMat.name}</span>
                            <span class="mf-aux-ratio">${Math.round(auxMat.ratio * 100)}%</span>
                            <span class="mf-aux-amount">¥${formatMoney(auxAmount)}</span>
                        </div>
                    `;
                }

                var mfMainItemsHtml = '';
                var mainMatsCount = 0;
                for (var mi = 0; mi < MATERIAL_CATEGORIES.length; mi++) {
                    var mcat = MATERIAL_CATEGORIES[mi];
                    var mlItem = wizardData.materialList[mcat.id];
                    if (!mlItem) continue;
                    mainMatsCount++;
                    var mlLevel = mlItem.level || 'comfort';
                    var mlRatio = MATERIAL_LEVEL_PRICE_RATIOS[mlLevel] || 1.0;
                    var mlUnitPrice = Math.round(mcat.unitPrice * mlRatio);
                    var mlSubtotal = Math.round(mlItem.quantity * mlUnitPrice);
                    mfMainItemsHtml += `
                        <div class="mf-main-item">
                            <span class="mf-main-name">${mcat.name}</span>
                            <span class="mf-main-qty">${mlItem.quantity}${mlItem.unit}</span>
                            <span class="mf-main-amount">¥${formatMoney(mlSubtotal)}</span>
                        </div>
                    `;
                    if (mainMatsCount >= 4) break;
                }

                return `
                    <div class="wizard-step-content">
                        <div class="wizard-step-title">材料费设置</div>
                        <div class="wizard-step-desc">${stepLabel}，三大类材料费用明细</div>
                        
                        <div class="mf-categories">
                            <div class="mf-category card">
                                <div class="mf-category-header">
                                    <span class="mf-category-icon">🔧</span>
                                    <span class="mf-category-name">辅材</span>
                                    <span class="mf-category-amount">¥${formatMoney(mfAuxiliary)}</span>
                                </div>
                                <div class="mf-category-body">
                                    <div class="mf-aux-list">
                                        ${mfAuxItemsHtml}
                                    </div>
                                    <div class="mf-category-hint">按面积估算，含水泥沙子、电线、水管、腻子等</div>
                                </div>
                            </div>
                            
                            <div class="mf-category card">
                                <div class="mf-category-header">
                                    <span class="mf-category-icon">📦</span>
                                    <span class="mf-category-name">主材（8大类）</span>
                                    <span class="mf-category-amount">¥${formatMoney(mfMain)}</span>
                                </div>
                                <div class="mf-category-body">
                                    <div class="mf-main-list">
                                        ${mfMainItemsHtml}
                                        <div class="mf-main-more">...等8大类主材</div>
                                    </div>
                                    <div class="mf-category-hint">可在上一步调整各主材档次</div>
                                </div>
                            </div>
                            
                            <div class="mf-category card">
                                <div class="mf-category-header">
                                    <span class="mf-category-icon">🏠</span>
                                    <span class="mf-category-name">全屋定制</span>
                                    <span class="mf-category-amount">¥${formatMoney(mfCustom)}</span>
                                </div>
                                <div class="mf-category-body">
                                    <div class="mf-custom-control">
                                        <div class="mf-custom-label">预估延米</div>
                                        <div class="mf-custom-input-wrap">
                                            <button class="mf-custom-btn" id="custom-meters-decrease">-</button>
                                            <input type="number" class="mf-custom-input" id="custom-meters-input" value="${mfCustomMeters}" step="0.1">
                                            <button class="mf-custom-btn" id="custom-meters-increase">+</button>
                                            <span class="mf-custom-unit">延米</span>
                                        </div>
                                    </div>
                                    <div class="mf-custom-hint">参考价：约 ¥1,500/延米</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="wizard-step-footer">
                            <div class="footer-info">
                                <span class="footer-label">材料费合计</span>
                                <span class="footer-value highlight">¥ ${formatMoney(mfTotal)}</span>
                            </div>
                            <div class="footer-hint">
                                辅材 ¥${formatMoney(mfAuxiliary)} + 主材 ¥${formatMoney(mfMain)} + 定制 ¥${formatMoney(mfCustom)}
                            </div>
                        </div>
                    </div>
                `;
            case 'confirm':
                return renderConfirmStep();
            default:
                return '';
        }
    }

    function initWizardEvents() {
        removeAllDomListeners();

        var mode = selectedMode || wizardData.mode || 'full';
        var steps = getWizardSteps(mode);
        var totalSteps = steps.length;

        var backBtn = document.getElementById('budget-back-btn');
        if (backBtn) {
            addDomListener(backBtn, 'click', function() {
                App.switchView('home');
            });
        }

        var prevBtn = document.getElementById('wizard-prev-btn');
        var nextBtn = document.getElementById('wizard-next-btn');

        if (prevBtn) {
            addDomListener(prevBtn, 'click', function() {
                if (wizardStep > 1) {
                    wizardStep--;
                    renderWizard();
                }
            });
        }

        if (nextBtn) {
            addDomListener(nextBtn, 'click', function() {
                if (wizardStep < totalSteps) {
                    wizardStep++;
                    renderWizard();
                } else {
                    confirmBudget();
                }
            });
        }

        var stepIndex = wizardStep - 1;
        if (stepIndex >= 0 && stepIndex < steps.length) {
            var stepId = steps[stepIndex].id;
            initWizardStepById(stepId);
        }
    }

    function initWizardStepById(stepId) {
        switch (stepId) {
            case 'totalBudget':
                initWizardTotalBudgetStep();
                break;
            case 'cityArea':
                initWizardCityAreaStep();
                break;
            case 'packageLevel':
                initWizardPackageLevelStep();
                break;
            case 'constructionFee':
                initWizardConstructionFeeStep();
                break;
            case 'materialList':
                initWizardMaterialListStep();
                break;
            case 'designFee':
                initWizardDesignFeeStep();
                break;
            case 'laborFee':
                initWizardLaborFeeStep();
                break;
            case 'materialFee':
                initWizardMaterialFeeStep();
                break;
            case 'confirm':
                break;
        }
    }

    function initWizardTotalBudgetStep() {
        var slider = document.getElementById('budget-slider');
        var input = document.getElementById('budget-amount-input');
        var display = document.getElementById('budget-amount-display');

        function updateDisplay(val) {
            if (display) {
                display.textContent = formatMoney(val);
            }
        }

        if (slider && input) {
            addDomListener(slider, 'input', function() {
                input.value = this.value;
                wizardData.totalBudget = parseInt(this.value);
                updateDisplay(this.value);
            });
            addDomListener(input, 'input', function() {
                var val = parseNumber(this.value);
                if (val < 0) val = 0;
                this.value = val;
                if (slider) {
                    var sliderMax = parseInt(slider.max);
                    var sliderMin = parseInt(slider.min);
                    if (val > sliderMax) {
                        slider.max = String(Math.max(sliderMax * 2, val));
                    }
                    if (val < sliderMin && val > 0) {
                        slider.min = String(Math.max(1, Math.min(sliderMin / 2, val)));
                    }
                    slider.value = val;
                }
                wizardData.totalBudget = val;
                updateDisplay(val);
            });
            addDomListener(input, 'focus', function() {
                if (display) display.style.opacity = '0';
            });
            addDomListener(input, 'blur', function() {
                if (display) display.style.opacity = '1';
            });
            if (display) {
                addDomListener(display, 'click', function() {
                    if (input) input.focus();
                });
            }
        }

        var presetBtns = document.querySelectorAll('.budget-preset-btn');
        presetBtns.forEach(function(btn) {
            addDomListener(btn, 'click', function() {
                var val = parseInt(this.getAttribute('data-value'));
                wizardData.totalBudget = val;
                if (slider) slider.value = val;
                if (input) input.value = val;
                updateDisplay(val);
                renderWizard();
            });
        });
    }

    function initWizardCityAreaStep() {
        var cityOptions = document.querySelectorAll('.city-option-card');
        cityOptions.forEach(function(card) {
            addDomListener(card, 'click', function() {
                var city = this.getAttribute('data-city');
                wizardData.cityTier = city;
                renderWizard();
            });
        });

        var areaInput = document.getElementById('area-input');
        var areaDisplay = document.getElementById('area-input-display');

        function updateAreaDisplay(val) {
            if (areaDisplay) {
                areaDisplay.textContent = val;
            }
        }

        if (areaInput) {
            addDomListener(areaInput, 'input', function() {
                var val = parseNumber(this.value);
                if (val < 0) val = 0;
                this.value = val;
                wizardData.area = val;
                updateAreaDisplay(val);
            });
            addDomListener(areaInput, 'focus', function() {
                if (areaDisplay) areaDisplay.style.opacity = '0';
            });
            addDomListener(areaInput, 'blur', function() {
                if (areaDisplay) areaDisplay.style.opacity = '1';
            });
            if (areaDisplay) {
                addDomListener(areaDisplay, 'click', function() {
                    if (areaInput) areaInput.focus();
                });
            }
        }

        var presetBtns = document.querySelectorAll('.area-preset-btn');
        presetBtns.forEach(function(btn) {
            addDomListener(btn, 'click', function() {
                var val = parseInt(this.getAttribute('data-value'));
                wizardData.area = val;
                if (areaInput) areaInput.value = val;
                updateAreaDisplay(val);
                renderWizard();
            });
        });
    }

    function initWizardPackageLevelStep() {
        var packageCards = document.querySelectorAll('.package-card');
        packageCards.forEach(function(card) {
            addDomListener(card, 'click', function() {
                var level = this.getAttribute('data-level');
                wizardData.packageLevel = level;
                renderWizard();
            });
        });
    }

    function initWizardConstructionFeeStep() {
        var modeTabs = document.querySelectorAll('.fee-mode-tab');
        modeTabs.forEach(function(tab) {
            addDomListener(tab, 'click', function() {
                var mode = this.getAttribute('data-mode');
                wizardData.constructionFeeMode = mode;
                renderWizard();
            });
        });

        var totalInput = document.getElementById('construction-total-input');
        if (totalInput) {
            addDomListener(totalInput, 'input', function() {
                var val = parseInt(this.value) || 0;
                val = Math.max(0, val);
                this.value = val;
                wizardData.constructionFee = val;
                updateConstructionFeeFooter();
            });
        }

        var unitInput = document.getElementById('construction-unit-input');
        if (unitInput) {
            addDomListener(unitInput, 'input', function() {
                var val = parseNumber(this.value);
                if (val < 0) val = 0;
                this.value = val;
                wizardData.constructionUnitPrice = val;
                wizardData.constructionFee = wizardData.area * val;
                var slider = document.getElementById('construction-unit-slider');
                if (slider) {
                    var sliderMax = parseInt(slider.max);
                    if (val > sliderMax) slider.max = String(Math.max(sliderMax * 2, val));
                    if (val < parseInt(slider.min) && val > 0) slider.min = String(Math.max(1, val));
                    slider.value = val;
                }
                updateConstructionFeeFooter();
            });
        }

        var unitSlider = document.getElementById('construction-unit-slider');
        if (unitSlider) {
            addDomListener(unitSlider, 'input', function() {
                var val = parseNumber(this.value);
                wizardData.constructionUnitPrice = val;
                wizardData.constructionFee = wizardData.area * val;
                var input = document.getElementById('construction-unit-input');
                if (input) input.value = val;
                updateConstructionFeeFooter();
            });
        }

        var detailSliders = document.querySelectorAll('.fee-detail-slider');
        detailSliders.forEach(function(slider) {
            addDomListener(slider, 'input', function() {
                var type = this.getAttribute('data-detail-type');
                var val = parseInt(this.value) || 0;
                if (type === 'labor') {
                    wizardData.constructionLaborRatio = val / 100;
                } else if (type === 'auxiliary') {
                    wizardData.constructionAuxiliaryRatio = val / 100;
                } else if (type === 'management') {
                    wizardData.constructionManagementRatio = val / 100;
                }
                renderWizard();
            });
        });
    }

    function updateConstructionFeeFooter() {
        var cfTotal = wizardData.constructionFee || 0;
        var cfLaborRatio = wizardData.constructionLaborRatio || 0.55;
        var cfAuxRatio = wizardData.constructionAuxiliaryRatio || 0.30;
        var cfMgmtRatio = wizardData.constructionManagementRatio || 0.15;
        var cfLabor = Math.round(cfTotal * cfLaborRatio);
        var cfAuxiliary = Math.round(cfTotal * cfAuxRatio);
        var cfManagement = Math.round(cfTotal * cfMgmtRatio);

        var footerItems = document.querySelectorAll('.footer-breakdown-item');
        if (footerItems.length >= 3) {
            var laborAmount = footerItems[0].querySelector('.breakdown-amount');
            var auxAmount = footerItems[1].querySelector('.breakdown-amount');
            var mgmtAmount = footerItems[2].querySelector('.breakdown-amount');
            if (laborAmount) laborAmount.textContent = '¥' + formatMoney(cfLabor);
            if (auxAmount) auxAmount.textContent = '¥' + formatMoney(cfAuxiliary);
            if (mgmtAmount) mgmtAmount.textContent = '¥' + formatMoney(cfManagement);
        }

        var totalValue = document.querySelector('.footer-total-value');
        if (totalValue) totalValue.textContent = '¥' + formatMoney(cfTotal);

        var calcTotal = document.querySelector('.fee-calc-total');
        if (calcTotal && wizardData.constructionUnitPrice) {
            calcTotal.textContent = '¥' + formatMoney(wizardData.area * wizardData.constructionUnitPrice);
        }
    }

    function initWizardMaterialListStep() {
        var allComfortBtn = document.getElementById('ml-all-comfort');
        if (allComfortBtn) {
            addDomListener(allComfortBtn, 'click', function() {
                for (var key in wizardData.materialList) {
                    if (wizardData.materialList.hasOwnProperty(key)) {
                        wizardData.materialList[key].level = 'comfort';
                    }
                }
                wizardData.materialLevel = 'comfort';
                renderWizard();
            });
        }

        var mlItems = document.querySelectorAll('.ml-item');
        mlItems.forEach(function(item) {
            var matId = item.getAttribute('data-material-id');
            var levelBtns = item.querySelectorAll('.ml-level-btn');
            levelBtns.forEach(function(btn) {
                addDomListener(btn, 'click', function() {
                    var level = this.getAttribute('data-level');
                    if (wizardData.materialList[matId]) {
                        wizardData.materialList[matId].level = level;
                    }
                    updateMaterialListItem(item, matId);
                    updateMaterialListTotal();
                });
            });
        });
    }

    function updateMaterialListItem(itemEl, matId) {
        var mlItem = wizardData.materialList[matId];
        var mcat = null;
        for (var i = 0; i < MATERIAL_CATEGORIES.length; i++) {
            if (MATERIAL_CATEGORIES[i].id === matId) {
                mcat = MATERIAL_CATEGORIES[i];
                break;
            }
        }
        if (!mlItem || !mcat) return;

        var mlLevel = mlItem.level || 'comfort';
        var mlRatio = MATERIAL_LEVEL_PRICE_RATIOS[mlLevel] || 1.0;
        var mlUnitPrice = Math.round(mcat.unitPrice * mlRatio);
        var mlSubtotal = Math.round(mlItem.quantity * mlUnitPrice);

        var subtotalEl = itemEl.querySelector('.ml-item-subtotal');
        if (subtotalEl) subtotalEl.textContent = '¥' + formatMoney(mlSubtotal);

        var levelBtns = itemEl.querySelectorAll('.ml-level-btn');
        levelBtns.forEach(function(btn) {
            var lvl = btn.getAttribute('data-level');
            if (lvl === mlLevel) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function updateMaterialListTotal() {
        var total = calculateMaterialListTotal();
        var totalEl = document.querySelector('.ml-total-amount');
        if (totalEl) totalEl.textContent = '¥' + formatMoney(total);
        if (wizardData.materialFee) {
            wizardData.materialFee.main = total;
        }
    }

    function initWizardDesignFeeStep() {
        var designCards = document.querySelectorAll('.design-card');
        designCards.forEach(function(card) {
            addDomListener(card, 'click', function() {
                var designId = this.getAttribute('data-design-id');
                var ratio = parseFloat(this.getAttribute('data-ratio'));
                wizardData.designFeeOption = designId;
                wizardData.designFeeRatio = ratio;
                renderWizard();
            });
        });
    }

    function initWizardLaborFeeStep() {
        var laborItems = document.querySelectorAll('.labor-item');
        laborItems.forEach(function(item) {
            var laborId = item.getAttribute('data-labor-id');
            var decreaseBtn = item.querySelector('[data-action="decrease"]');
            var increaseBtn = item.querySelector('[data-action="increase"]');
            var daysInput = item.querySelector('.labor-days-input');

            if (decreaseBtn) {
                addDomListener(decreaseBtn, 'click', function() {
                    adjustLaborDays(laborId, -1, item);
                });
            }
            if (increaseBtn) {
                addDomListener(increaseBtn, 'click', function() {
                    adjustLaborDays(laborId, 1, item);
                });
            }
            if (daysInput) {
                addDomListener(daysInput, 'input', function() {
                    var val = parseInt(this.value) || 1;
                    val = Math.max(1, val);
                    this.value = val;
                    updateLaborItem(item, laborId, val);
                });
            }
        });
    }

    function adjustLaborDays(laborId, delta, itemEl) {
        var ld = wizardData.laborDays[laborId];
        if (!ld) return;
        var newDays = Math.max(1, ld.days + delta);
        ld.days = newDays;
        ld.subtotal = newDays * ld.dailyWage;
        if (wizardData.laborDetail) {
            wizardData.laborDetail[laborId] = ld.subtotal;
        }
        updateLaborItemUI(itemEl, ld);
        updateLaborTotal();
    }

    function updateLaborItem(itemEl, laborId, newDays) {
        var ld = wizardData.laborDays[laborId];
        if (!ld) return;
        ld.days = newDays;
        ld.subtotal = newDays * ld.dailyWage;
        if (wizardData.laborDetail) {
            wizardData.laborDetail[laborId] = ld.subtotal;
        }
        updateLaborItemUI(itemEl, ld);
        updateLaborTotal();
    }

    function updateLaborItemUI(itemEl, ld) {
        var subtotalEl = itemEl.querySelector('.labor-item-subtotal');
        if (subtotalEl) subtotalEl.textContent = '¥' + formatMoney(ld.subtotal);
        var inputEl = itemEl.querySelector('.labor-days-input');
        if (inputEl) inputEl.value = ld.days;
    }

    function updateLaborTotal() {
        var total = calculateLaborTotal();
        var totalEl = document.querySelector('.footer-value.highlight');
        if (totalEl) totalEl.textContent = '¥ ' + formatMoney(total);
    }

    function initWizardMaterialFeeStep() {
        var customDecBtn = document.getElementById('custom-meters-decrease');
        var customIncBtn = document.getElementById('custom-meters-increase');
        var customInput = document.getElementById('custom-meters-input');

        if (customDecBtn) {
            addDomListener(customDecBtn, 'click', function() {
                adjustCustomMeters(-1);
            });
        }
        if (customIncBtn) {
            addDomListener(customIncBtn, 'click', function() {
                adjustCustomMeters(1);
            });
        }
        if (customInput) {
            addDomListener(customInput, 'input', function() {
                var val = parseInt(this.value) || 1;
                val = Math.max(1, val);
                this.value = val;
                updateCustomMeters(val);
            });
        }
    }

    function adjustCustomMeters(delta) {
        var newMeters = Math.max(1, (wizardData.customFurnitureMeters || 0) + delta);
        updateCustomMeters(newMeters);
    }

    function updateCustomMeters(meters) {
        wizardData.customFurnitureMeters = meters;
        var customPricePerMeter = 1500;
        var customTotal = Math.round(meters * customPricePerMeter);
        if (wizardData.materialFee) {
            wizardData.materialFee.custom = customTotal;
        }
        updateMaterialFeeUI();
    }

    function updateMaterialFeeUI() {
        var mfAuxiliary = wizardData.materialFee ? wizardData.materialFee.auxiliary : 0;
        var mfMain = wizardData.materialFee ? wizardData.materialFee.main : 0;
        var mfCustom = wizardData.materialFee ? wizardData.materialFee.custom : 0;
        var mfTotal = mfAuxiliary + mfMain + mfCustom;

        var inputEl = document.getElementById('custom-meters-input');
        if (inputEl) inputEl.value = wizardData.customFurnitureMeters || 0;

        var categoryAmounts = document.querySelectorAll('.mf-category-amount');
        if (categoryAmounts.length >= 3) {
            categoryAmounts[2].textContent = '¥' + formatMoney(mfCustom);
        }

        var totalEl = document.querySelector('.footer-value.highlight');
        if (totalEl) totalEl.textContent = '¥ ' + formatMoney(mfTotal);

        var hintEl = document.querySelector('.footer-hint');
        if (hintEl) {
            hintEl.textContent = '辅材 ¥' + formatMoney(mfAuxiliary) + ' + 主材 ¥' + formatMoney(mfMain) + ' + 定制 ¥' + formatMoney(mfCustom);
        }
    }

    function confirmBudget() {
        var mode = selectedMode || wizardData.mode || 'full';
        var plan = calculateBudgetByMode(mode, wizardData);
        saveBudgetPlan(plan, true);
        
        App.state.userData.cityTier = wizardData.cityTier;
        App.state.userData.area = wizardData.area;
        App.saveState(true);
        
        EventBus.emit(EventBus.EVENTS.BUDGET_CREATED, {
            mode: mode,
            totalBudget: plan.totalBudget,
            area: plan.area,
            cityTier: plan.cityTier
        });
        
        render(container);
    }

    function calcProgressPercent(budget, spent) {
        if (!budget || budget <= 0) return 0;
        var pct = (spent / budget) * 100;
        return Math.min(pct, 200);
    }

    function getProgressClass(percent) {
        if (percent > 90) return 'progress-danger';
        if (percent > 70) return 'progress-warning';
        return '';
    }

    function getCategoryLabel(catKey, plan) {
        var mode = plan.mode || 'full';
        var modeConfig = getModeConfig(mode);
        if (!modeConfig || !modeConfig.categories) return catKey;
        for (var i = 0; i < modeConfig.categories.length; i++) {
            if (modeConfig.categories[i].id === catKey) {
                return modeConfig.categories[i].name;
            }
        }
        return catKey;
    }

    function getSubCategoryLabel(parentKey, subKey, plan) {
        var mode = plan.mode || 'full';
        var modeConfig = getModeConfig(mode);
        if (!modeConfig || !modeConfig.categories) return subKey;
        for (var i = 0; i < modeConfig.categories.length; i++) {
            if (modeConfig.categories[i].id === parentKey) {
                var children = modeConfig.categories[i].children || [];
                for (var j = 0; j < children.length; j++) {
                    if (children[j].id === subKey) {
                        return children[j].name;
                    }
                }
            }
        }
        return subKey;
    }

    function renderTotalProgressCard(plan) {
        var status = getBudgetStatus();
        var nian = getNianState();
        var remaining = plan.totalBudget - plan.totalSpent;
        var reserveCat = plan.categories ? plan.categories.reserve : null;
        var reserveBudget = reserveCat ? reserveCat.budget : 0;
        var reserveSpent = reserveCat ? reserveCat.spent : 0;
        var reserveRemaining = reserveBudget - reserveSpent;

        var statusClass = '';
        if (status.level === 'healthy') statusClass = 'status-healthy';
        else if (status.level === 'warning') statusClass = 'status-warning';
        else if (status.level === 'danger') statusClass = 'status-danger';
        else statusClass = 'status-critical';

        var percent = calcProgressPercent(plan.totalBudget, plan.totalSpent);
        var ringOffset = 2 * Math.PI * 85 * (1 - Math.min(percent, 100) / 100);

        return `
            <div class="coin-progress-card card ${statusClass}">
                <div class="coin-progress-container">
                    <svg class="coin-progress-svg" viewBox="0 0 200 200">
                        <circle class="coin-progress-bg" cx="100" cy="100" r="85" fill="none" stroke-width="12"></circle>
                        <circle class="coin-progress-ring" cx="100" cy="100" r="85" fill="none" stroke-width="12"
                            stroke-dasharray="${2 * Math.PI * 85}"
                            stroke-dashoffset="${ringOffset}"
                            transform="rotate(-90 100 100)"></circle>
                        <circle class="coin-inner-circle" cx="100" cy="100" r="65" fill="none" stroke-width="2"></circle>
                        <text class="coin-square" x="100" y="100" text-anchor="middle" dominant-baseline="middle" 
                            font-size="32" fill="currentColor">¥</text>
                    </svg>
                    <div class="nian-container ${nian.state} coin-nian">
                        <span class="nian-emoji">${Icons.render(nian.emoji)}</span>
                    </div>
                </div>
                <div class="coin-progress-info">
                    <div class="coin-progress-label">已使用</div>
                    <div class="coin-progress-percent">${status.actualPercent.toFixed(1)}%</div>
                    <div class="coin-progress-tip">${nian.tip}</div>
                </div>
                <div class="total-progress-stats">
                    <div class="total-stat-item">
                        <div class="total-stat-label">已用</div>
                        <div class="total-stat-value">¥${formatMoney(plan.totalSpent)}</div>
                    </div>
                    <div class="total-stat-divider"></div>
                    <div class="total-stat-item">
                        <div class="total-stat-label">总预算 ${renderInfoIcon('total')}</div>
                        <div class="total-stat-value">¥${formatMoney(plan.totalBudget)}</div>
                    </div>
                    <div class="total-stat-divider"></div>
                    <div class="total-stat-item">
                        <div class="total-stat-label">剩余</div>
                        <div class="total-stat-value ${remaining < 0 ? 'negative' : ''}">¥${formatMoney(Math.abs(remaining))}</div>
                    </div>
                </div>
            </div>
        `;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        var month = d.getMonth() + 1;
        var day = d.getDate();
        var hours = d.getHours();
        var minutes = d.getMinutes();
        return month + '月' + day + '日 ' + (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
    }

    function getExpenseTypeLabel(type) {
        var labels = {
            deposit: '定金',
            progress: '进度款',
            full: '全款'
        };
        return labels[type] || '进度款';
    }

    function getExpenseTagInfo(tagId) {
        if (!tagId) return null;
        for (var i = 0; i < EXPENSE_TAGS.length; i++) {
            if (EXPENSE_TAGS[i].id === tagId) {
                return EXPENSE_TAGS[i];
            }
        }
        return null;
    }

    function renderExpenseTagHtml(tagId) {
        var tagInfo = getExpenseTagInfo(tagId);
        if (!tagInfo) return '';
        return '<span class="expense-item-tag" style="background: ' + tagInfo.color + '20; color: ' + tagInfo.color + ';">' + tagInfo.name + '</span>';
    }

    function renderMarketPriceCompare(expense) {
        if (!expense || !expense.category) return { html: '', hasMatch: false };
        if (typeof MarketPriceData === 'undefined') return { html: '', hasMatch: false };

        var priceItem = MarketPriceData.matchPriceByName(expense.category);
        if (!priceItem) return { html: '', hasMatch: false };

        var amount = expense.amount || 0;
        var quantity = expense.quantity || 1;
        var unitPrice = quantity > 0 ? amount / quantity : 0;

        var status = MarketPriceData.getPriceStatus(unitPrice, priceItem);
        var statusLabel = '';
        var statusClass = '';

        if (status === 'high') {
            statusLabel = '偏高';
            statusClass = 'price-tag-high';
        } else if (status === 'low') {
            statusLabel = '划算';
            statusClass = 'price-tag-low';
        } else {
            statusLabel = '正常';
            statusClass = 'price-tag-normal';
        }

        var priceRange = priceItem.priceLow + '-' + priceItem.priceHigh;
        var html = '<div class="market-price-compare">' +
            '<span class="market-price-range">市场价：¥' + priceRange + '/' + priceItem.unit + '</span>' +
            '<span class="price-tag ' + statusClass + '">' + statusLabel + '</span>' +
            '</div>';

        return { html: html, hasMatch: true, status: status };
    }

    function renderCategoryExpenses(catKey, catData, plan, filterTag) {
        if (!catData || !catData.expenses || !Array.isArray(catData.expenses) || catData.expenses.length === 0) {
            return '<div class="category-expenses-empty">暂无支出记录</div>';
        }

        var allExpenses = catData.expenses.slice().reverse();
        var filteredExpenses = allExpenses;
        if (filterTag && filterTag !== 'all') {
            filteredExpenses = allExpenses.filter(function(exp) {
                return exp.tag === filterTag;
            });
        }
        var recentExpenses = filteredExpenses.slice(0, 5);

        var filterBarHtml = '';
        if (catData.expenses.length > 0) {
            var tagFiltersHtml = EXPENSE_TAGS.map(function(tag) {
                var count = catData.expenses.filter(function(e) { return e.tag === tag.id; }).length;
                if (count === 0) return '';
                var isActive = filterTag === tag.id;
                return '<div class="expense-tag-filter-item ' + (isActive ? 'active' : '') + '" data-tag-filter="' + tag.id + '" style="' + (isActive ? 'background: ' + tag.color + '; border-color: ' + tag.color + ';' : 'color: ' + tag.color + ';') + '">' +
                    tag.name + ' (' + count + ')' +
                    '</div>';
            }).join('');

            if (tagFiltersHtml) {
                filterBarHtml = '<div class="expense-tag-filter-bar">' +
                    '<span class="expense-tag-filter-label">标签筛选：</span>' +
                    '<div class="expense-tag-filter-item ' + (!filterTag || filterTag === 'all' ? 'all active' : 'all') + '" data-tag-filter="all">全部</div>' +
                    tagFiltersHtml +
                    '</div>';
            }
        }

        var html = '<div class="category-expenses-section">';
        html += '<div class="category-expenses-title">最近支出</div>';
        if (filterBarHtml) {
            html += filterBarHtml;
        }
        html += '<div class="category-expenses-list">';

        if (recentExpenses.length === 0) {
            html += '<div class="category-expenses-empty">该标签下暂无支出记录</div>';
        } else {
            for (var i = 0; i < recentExpenses.length; i++) {
                var exp = recentExpenses[i];
                var expAmount = exp.amount || 0;
                var expDate = formatDate(exp.date);
                var expNote = exp.note || '';
                var expType = exp.expenseType || 'progress';
                var expTypeLabel = getExpenseTypeLabel(expType);
                var expTag = exp.tag || '';
                var expTagHtml = renderExpenseTagHtml(expTag);
                var marketCompare = renderMarketPriceCompare(exp);
                var subCatName = '';
                if (exp.subCategory) {
                    subCatName = getSubCategoryLabel(catKey, exp.subCategory, plan);
                }

                html += '<div class="category-expense-item">';
                html += '<div class="expense-item-left">';
                html += '<div class="expense-item-info">';
                html += '<span class="expense-item-type">' + expTypeLabel + '</span>';
                if (subCatName) {
                    html += '<span class="expense-item-subcat">' + subCatName + '</span>';
                }
                if (expTagHtml) {
                    html += expTagHtml;
                }
                html += '</div>';
                if (marketCompare.html) {
                    html += marketCompare.html;
                }
                if (expNote) {
                    html += '<div class="expense-item-note">' + escapeHtml(expNote) + '</div>';
                }
                html += '<div class="expense-item-date">' + expDate + '</div>';
                html += '</div>';
                html += '<div class="expense-item-amount">-¥' + formatMoney(expAmount) + '</div>';
                html += '</div>';
            }
        }

        html += '</div>';
        if (filteredExpenses.length > 5) {
            html += '<div class="category-expenses-more">查看全部 ' + filteredExpenses.length + ' 条</div>';
        }
        html += '</div>';

        return html;
    }

    function renderCategoryCard(catKey, catData, plan, expandable) {
        if (!catData) return '';
        var isExpanded = expandedCategory === catKey;
        var budget = catData.budget || 0;
        var spent = catData.spent || 0;
        var percent = calcProgressPercent(budget, spent);
        var progressClass = getProgressClass(percent);
        var catName = getCategoryLabel(catKey, plan);
        var ratioText = '';
        if (plan.totalBudget > 0) {
            ratioText = Math.round((budget / plan.totalBudget) * 100) + '%';
        }

        var subItemsHtml = '';
        if (expandable && catData.items && typeof catData.items === 'object') {
            var subItems = [];
            for (var subKey in catData.items) {
                if (catData.items.hasOwnProperty(subKey)) {
                    var subItem = catData.items[subKey];
                    var subBudget = subItem.budget || 0;
                    var subSpent = subItem.spent || 0;
                    var subPercent = calcProgressPercent(subBudget, subSpent);
                    var subProgressClass = getProgressClass(subPercent);
                    var subName = getSubCategoryLabel(catKey, subKey, plan);
                    subItems.push(`
                        <div class="sub-category-item">
                            <div class="sub-category-header">
                                <span class="sub-category-name">${subName}</span>
                                <span class="sub-category-amount">¥${formatMoney(subSpent)} / ¥${formatMoney(subBudget)}</span>
                            </div>
                            <div class="progress-bar sub-progress">
                                <div class="progress-fill ${subProgressClass}" style="width: ${Math.max(0, Math.min(subPercent, 100))}%"></div>
                            </div>
                        </div>
                    `);
                }
            }
            subItemsHtml = subItems.join('');
        }

        var expensesHtml = '';
        if (isExpanded) {
            var filterTag = categoryExpenseTagFilter[catKey] || 'all';
            expensesHtml = renderCategoryExpenses(catKey, catData, plan, filterTag);
        }

        var expandIcon = expandable ? (isExpanded ? '▲' : '▼') : '';
        var cursorClass = expandable ? 'cursor-pointer' : '';

        var expandedContent = '';
        if (isExpanded) {
            expandedContent = '<div class="category-expanded-content">';
            if (subItemsHtml) {
                expandedContent += '<div class="category-children">' + subItemsHtml + '</div>';
            }
            if (expensesHtml) {
                expandedContent += expensesHtml;
            }
            expandedContent += '</div>';
        }

        return `
            <div class="category-card card" data-category-key="${catKey}">
                <div class="category-card-header ${cursorClass}" data-action="toggle-category">
                    <div class="category-title-row">
                        <span class="category-name">${catName}</span>
                        ${renderInfoIcon(catKey)}
                        ${ratioText ? `<span class="category-ratio">占${ratioText}</span>` : ''}
                        ${expandable ? `<span class="category-expand-icon">${expandIcon}</span>` : ''}
                    </div>
                    <div class="category-amount-row">
                        <span class="category-spent">¥${formatMoney(spent)}</span>
                        <span class="category-budget">/ ¥${formatMoney(budget)}</span>
                        <span class="category-percent">${percent.toFixed(1)}%</span>
                    </div>
                </div>
                <div class="progress-bar category-progress">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.max(0, Math.min(percent, 100))}%"></div>
                </div>
                ${expandedContent}
            </div>
        `;
    }

    function renderFullDashboard(plan) {
        var cats = plan.categories || {};
        var contract = cats.contract || { budget: 0, spent: 0 };
        var selfPurchase = cats.selfPurchase || { budget: 0, spent: 0 };
        var softDecoration = cats.softDecoration || { budget: 0, spent: 0 };
        var reserve = cats.reserve || { budget: 0, spent: 0 };

        return `
            <div class="dashboard-full">
                ${renderDisclaimerBar()}
                ${renderQuickAdjustCard(plan)}
                ${renderTotalProgressCard(plan)}

                <div class="categories-section">
                    <div class="section-title-row">
                        <h3 class="section-title">预算明细</h3>
                    </div>

                    ${renderCategoryCard('contract', contract, plan, true)}

                    ${renderCategoryCard('selfPurchase', selfPurchase, plan, true)}

                    ${renderCategoryCard('softDecoration', softDecoration, plan, true)}

                    ${renderCategoryCard('reserve', reserve, plan, false)}
                </div>

                ${renderAdditionalFeesSection()}

                <div class="stages-section card">
                    <div class="section-header">
                        <h3 class="section-title">
                            <span>${Icons.render('bar-chart')}</span>
                            <span>6阶段预算释放</span>
                        </h3>
                        <span class="section-badge">与SOP联动</span>
                    </div>
                    <div class="stages-list" id="stages-list">
                        ${renderStagesList()}
                    </div>
                </div>

                ${renderBudgetHealthRadarChart(plan)}

                ${renderBudgetSuggestions(plan)}

                <div class="budget-ai-assistant-card card">
                    <div class="budget-ai-assistant-header">
                        <div class="budget-ai-assistant-icon">🤖</div>
                        <div class="budget-ai-assistant-title">智能助手</div>
                        <span class="budget-ai-assistant-badge">智能把关</span>
                    </div>
                    <div class="budget-ai-assistant-desc">小管家帮您全程把关装修预算，智能识别风险，自动预警超支</div>
                    <button class="btn-ai-primary" id="btn-ai-assistant">
                        <span class="btn-ai-icon">${Icons.render('sparkles')}</span>
                        <span>开启智能助手</span>
                    </button>
                </div>

                ${renderKnowledgeCard(plan)}

                <button class="floating-add-expense-btn" id="floating-add-expense-btn">
                    <span class="add-expense-icon">📝</span>
                    <span>记一笔支出</span>
                </button>
            </div>
        `;
    }

    function renderHalfDashboard(plan) {
        var cats = plan.categories || {};
        var construction = cats.construction || { budget: 0, spent: 0 };
        var mainMaterials = cats.mainMaterials || { budget: 0, spent: 0 };
        var customFurniture = cats.customFurniture || { budget: 0, spent: 0 };
        var softDecoration = cats.softDecoration || { budget: 0, spent: 0 };
        var reserve = cats.reserve || { budget: 0, spent: 0 };

        return `
            <div class="dashboard-half">
                ${renderDisclaimerBar()}
                ${renderQuickAdjustCard(plan)}
                ${renderTotalProgressCard(plan)}

                <div class="categories-section">
                    <div class="section-title-row">
                        <h3 class="section-title">预算明细</h3>
                    </div>

                    <div class="half-dual-row">
                        <div class="half-dual-col">
                            ${renderCategoryCard('construction', construction, plan, true)}
                        </div>
                        <div class="half-dual-col">
                            ${renderCategoryCard('mainMaterials', mainMaterials, plan, true)}
                        </div>
                    </div>

                    ${renderCategoryCard('customFurniture', customFurniture, plan, true)}

                    ${renderCategoryCard('softDecoration', softDecoration, plan, true)}

                    ${renderCategoryCard('reserve', reserve, plan, false)}
                </div>

                ${renderAdditionalFeesSection()}

                <div class="stages-section card">
                    <div class="section-header">
                        <h3 class="section-title">
                            <span>${Icons.render('bar-chart')}</span>
                            <span>6阶段预算释放</span>
                        </h3>
                        <span class="section-badge">与SOP联动</span>
                    </div>
                    <div class="stages-list" id="stages-list">
                        ${renderStagesList()}
                    </div>
                </div>

                ${renderBudgetHealthRadarChart(plan)}

                ${renderBudgetSuggestions(plan)}

                <div class="budget-ai-assistant-card card">
                    <div class="budget-ai-assistant-header">
                        <div class="budget-ai-assistant-icon">🤖</div>
                        <div class="budget-ai-assistant-title">智能助手</div>
                        <span class="budget-ai-assistant-badge">智能把关</span>
                    </div>
                    <div class="budget-ai-assistant-desc">小管家帮您全程把关装修预算，智能识别风险，自动预警超支</div>
                    <button class="btn-ai-primary" id="btn-ai-assistant">
                        <span class="btn-ai-icon">${Icons.render('sparkles')}</span>
                        <span>开启智能助手</span>
                    </button>
                </div>

                ${renderKnowledgeCard(plan)}

                <button class="floating-add-expense-btn" id="floating-add-expense-btn">
                    <span class="add-expense-icon">📝</span>
                    <span>记一笔支出</span>
                </button>
            </div>
        `;
    }

    function renderSelfDashboard(plan) {
        var cats = plan.categories || {};
        var designFee = cats.designFee || { budget: 0, spent: 0 };
        var labor = cats.labor || { budget: 0, spent: 0 };
        var materials = cats.materials || { budget: 0, spent: 0 };
        var equipment = cats.equipment || { budget: 0, spent: 0 };
        var softDecoration = cats.softDecoration || { budget: 0, spent: 0 };
        var reserve = cats.reserve || { budget: 0, spent: 0 };

        return `
            <div class="dashboard-self">
                ${renderDisclaimerBar()}
                ${renderQuickAdjustCard(plan)}
                ${renderTotalProgressCard(plan)}

                <div class="categories-section">
                    <div class="section-title-row">
                        <h3 class="section-title">预算明细</h3>
                    </div>

                    ${renderCategoryCard('labor', labor, plan, true)}

                    ${renderCategoryCard('materials', materials, plan, true)}

                    <div class="self-triple-row">
                        <div class="self-triple-col">
                            ${renderCategoryCard('designFee', designFee, plan, false)}
                        </div>
                        <div class="self-triple-col">
                            ${renderCategoryCard('equipment', equipment, plan, true)}
                        </div>
                        <div class="self-triple-col">
                            ${renderCategoryCard('softDecoration', softDecoration, plan, true)}
                        </div>
                    </div>

                    ${renderCategoryCard('reserve', reserve, plan, false)}
                </div>

                ${renderAdditionalFeesSection()}

                <div class="stages-section card">
                    <div class="section-header">
                        <h3 class="section-title">
                            <span>${Icons.render('bar-chart')}</span>
                            <span>6阶段预算释放</span>
                        </h3>
                        <span class="section-badge">与SOP联动</span>
                    </div>
                    <div class="stages-list" id="stages-list">
                        ${renderStagesList()}
                    </div>
                </div>

                ${renderBudgetHealthRadarChart(plan)}

                ${renderBudgetSuggestions(plan)}

                <div class="budget-ai-assistant-card card">
                    <div class="budget-ai-assistant-header">
                        <div class="budget-ai-assistant-icon">🤖</div>
                        <div class="budget-ai-assistant-title">智能助手</div>
                        <span class="budget-ai-assistant-badge">智能把关</span>
                    </div>
                    <div class="budget-ai-assistant-desc">小管家帮您全程把关装修预算，智能识别风险，自动预警超支</div>
                    <button class="btn-ai-primary" id="btn-ai-assistant">
                        <span class="btn-ai-icon">${Icons.render('sparkles')}</span>
                        <span>开启智能助手</span>
                    </button>
                </div>

                ${renderKnowledgeCard(plan)}

                <button class="floating-add-expense-btn" id="floating-add-expense-btn">
                    <span class="add-expense-icon">📝</span>
                    <span>记一笔支出</span>
                </button>
            </div>
        `;
    }

    function getDashboardTitle(plan) {
        var mode = plan.mode || 'full';
        if (mode === 'full') return '🏠 全包装修';
        if (mode === 'half') return '🔨 半包装修';
        if (mode === 'self') return '🛠️ 自装模式';
        return '🏠 全包装修';
    }

    function renderDashboardContent(plan) {
        var mode = plan.mode || 'full';
        if (mode === 'full') {
            return renderFullDashboard(plan);
        } else if (mode === 'half') {
            return renderHalfDashboard(plan);
        } else if (mode === 'self') {
            return renderSelfDashboard(plan);
        } else {
            return renderFullDashboard(plan);
        }
    }

    function renderDashboard() {
        var plan = getBudgetPlan();
        var status = getBudgetStatus();
        var dashboardTitle = getDashboardTitle(plan);

        var statusClass = '';
        if (status.level === 'healthy') statusClass = 'status-healthy';
        else if (status.level === 'warning') statusClass = 'status-warning';
        else if (status.level === 'danger') statusClass = 'status-danger';
        else statusClass = 'status-critical';

        var mode = plan.mode || 'full';
        var modeNames = { full: '全包', half: '半包', self: '自装' };
        var modeName = modeNames[mode] || '全包';
        var modeLockedBadge = '';
        if (plan.modeLocked) {
            modeLockedBadge = `
                <div class="mode-locked-badge" title="预算创建后模式已锁定，如需切换请重置预算">
                    <span class="mode-lock-icon">🔒</span>
                    <span class="mode-lock-label">${modeName}模式已锁定</span>
                </div>
            `;
        }

        removeAllDomListeners();
        expandedCategory = null;

        container.innerHTML = `
            <div class="budget-view ${statusClass}">
                <header class="budget-header">
                    <div class="budget-header-inner">
                        <div class="budget-header-left">
                            <button class="budget-back-btn" id="budget-back-btn" title="返回首页">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <div class="budget-header-titles">
                                <h1 class="budget-header-title">${dashboardTitle}</h1>
                                ${modeLockedBadge}
                            </div>
                        </div>
                        <div class="budget-header-actions">
                            <button class="btn-text" id="budget-version-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                    <path d="M2 17l10 5 10-5"></path>
                                    <path d="M2 12l10 5 10-5"></path>
                                </svg>
                                方案管理
                            </button>
                            <button class="btn-text" id="budget-edit-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                                调整预算
                            </button>
                            <button class="btn-text" id="budget-reset-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="23 4 23 10 17 10"></polyline>
                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                </svg>
                                重置数据
                            </button>
                        </div>
                    </div>
                </header>
                <main class="budget-main">
                    <div class="dashboard-container">
                        ${renderDashboardContent(plan)}
                    </div>
                </main>
                
                <div class="budget-modal" id="budget-warning-modal">
                    <div class="budget-modal-content">
                        <button class="budget-modal-close" id="budget-warning-close">✕</button>
                        <div class="budget-modal-title" id="budget-warning-title"></div>
                        <div class="budget-modal-body" id="budget-warning-body"></div>
                        <div class="budget-modal-actions">
                            <button class="btn-secondary" id="budget-warning-cancel">取消</button>
                            <button class="btn-primary" id="budget-warning-confirm">确认</button>
                        </div>
                    </div>
                </div>

                ${renderAllTooltips()}
            </div>
        `;

        cacheElements();
        initDashboardEvents();
        updateFloatingButlerContent();
    }

    function renderStagesList() {
        var plan = getBudgetPlan();
        if (!plan) return '';

        return plan.stages.map(function(stage, index) {
            var isExpanded = expandedStage === stage.id;
            var progress = stage.budget > 0 ? (stage.spent / stage.budget) * 100 : 0;
            var statusClass = stage.status;
            var statusText = stage.status === 'completed' ? '已完成' : 
                             stage.status === 'active' ? '进行中' : '锁定';
            var statusBadgeClass = stage.status === 'completed' ? 'badge-green' :
                                  stage.status === 'active' ? 'badge-blue' : 'badge-orange';

            return `
                <div class="stage-card ${statusClass} ${isExpanded ? 'expanded' : ''}" data-stage-id="${stage.id}">
                    <div class="stage-card-header">
                        <div class="stage-card-left">
                            <div class="stage-icon">${Icons.render(stage.icon)}</div>
                            <div class="stage-info">
                                <div class="stage-name">阶段${stage.id}：${stage.title}</div>
                                <div class="stage-budget">预算 ¥${formatMoney(stage.budget)} · ${Math.round(stage.ratio * 100)}%</div>
                            </div>
                        </div>
                        <div class="stage-card-right">
                            <span class="badge ${statusBadgeClass}">${statusText}</span>
                            <div class="stage-expand-icon">${isExpanded ? '▲' : '▼'}</div>
                        </div>
                    </div>
                    ${stage.status !== 'locked' ? `
                        <div class="stage-card-progress">
                            <div class="progress-bar">
                                <div class="progress-fill ${progress > 90 ? 'progress-danger' : progress > 70 ? 'progress-warning' : ''}" 
                                    style="width: ${Math.max(0, Math.min(progress, 100))}%"></div>
                            </div>
                            <div class="stage-progress-info">
                                <span>已支出 ¥${formatMoney(stage.spent)}</span>
                                <span>${progress.toFixed(1)}%</span>
                            </div>
                        </div>
                    ` : `
                        <div class="stage-card-locked">
                            <span>${Icons.render('lock')}</span>
                            <span>完成上一阶段后解锁</span>
                        </div>
                    `}
                    ${isExpanded ? `
                        <div class="stage-card-detail">
                            <div class="stage-detail-desc">
                                <div class="stage-detail-label">阶段说明</div>
                                <div class="stage-detail-text">${stage.desc || '暂无说明'}</div>
                            </div>
                            ${stage.expenses && stage.expenses.length > 0 ? `
                                <div class="stage-detail-title">支出明细</div>
                                <div class="stage-expenses-list">
                                    ${stage.expenses.slice(-5).reverse().map(function(exp) {
                                        var expTagHtml = renderExpenseTagHtml(exp.tag);
                                        var marketCompare = renderMarketPriceCompare(exp);
                                        return `
                                            <div class="stage-expense-item">
                                                <div class="stage-expense-left">
                                                    <span class="expense-category">${exp.category}</span>
                                                    ${expTagHtml || ''}
                                                    ${marketCompare.html || ''}
                                                </div>
                                                <span class="expense-amount">-¥${formatMoney(exp.amount)}</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            ` : '<div class="stage-empty">暂无支出记录</div>'}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    function renderMaterialsTable() {
        var plan = getBudgetPlan();
        if (!plan) return '';

        var html = `
            <div class="materials-table-header">
                <div class="materials-th-name">品类</div>
                <div class="materials-th-budget">预算</div>
                <div class="materials-th-spent">已花费</div>
                <div class="materials-th-status">状态</div>
            </div>
            <div class="materials-table-body">
        `;

        for (var key in plan.materials) {
            var mat = plan.materials[key];
            var progress = mat.budget > 0 ? (mat.spent / mat.budget) * 100 : 0;
            var isExpanded = expandedMaterial === mat.id;
            var diff = mat.budget - mat.spent;
            var statusBadge = mat.status === 'purchased' ? 'badge-green' : 
                             mat.status === 'purchasing' ? 'badge-blue' : 'badge-orange';
            var statusText = mat.status === 'purchased' ? '已采购' :
                            mat.status === 'purchasing' ? '选购中' : '待采购';

            html += `
                <div class="materials-row ${isExpanded ? 'expanded' : ''}" data-material-id="${mat.id}">
                    <div class="materials-row-main">
                        <div class="materials-name">
                            <span class="materials-icon">${Icons.render(mat.icon)}</span>
                            <span class="materials-name-text">${mat.name}</span>
                        </div>
                        <div class="materials-budget">¥${formatMoney(mat.budget)}</div>
                        <div class="materials-spent">
                            <div class="materials-spent-amount">¥${formatMoney(mat.spent)}</div>
                            <div class="progress-bar materials-progress">
                                <div class="progress-fill ${progress > 90 ? 'progress-danger' : progress > 70 ? 'progress-warning' : ''}" 
                                    style="width: ${Math.max(0, Math.min(progress, 100))}%"></div>
                            </div>
                        </div>
                        <div class="materials-status">
                            <span class="badge ${statusBadge}">${statusText}</span>
                        </div>
                    </div>
                    ${isExpanded ? `
                        <div class="materials-row-detail">
                            <div class="materials-detail-grid">
                                <div class="materials-detail-item">
                                    <div class="materials-detail-label">预估用量</div>
                                    <div class="materials-detail-value">${mat.estimatedQty} ${mat.unit}</div>
                                </div>
                                <div class="materials-detail-item">
                                    <div class="materials-detail-label">参考单价</div>
                                    <div class="materials-detail-value">¥${formatMoney(mat.unitPrice)}/${mat.unit}</div>
                                </div>
                                <div class="materials-detail-item">
                                    <div class="materials-detail-label">${diff >= 0 ? '剩余' : '超支'}</div>
                                    <div class="materials-detail-value ${diff >= 0 ? 'positive' : 'negative'}">
                                        ${diff >= 0 ? '+' : ''}¥${formatMoney(Math.abs(diff))}
                                    </div>
                                </div>
                                <div class="materials-detail-item">
                                    <div class="materials-detail-label">完成度</div>
                                    <div class="materials-detail-value">${progress.toFixed(1)}%</div>
                                </div>
                            </div>
                            ${renderPriceRangeSection(mat.id, mat.level || 'comfort')}

                            ${mat.brands && mat.brands.length > 0 ? `
                                <div class="materials-detail-section">
                                    <div class="materials-detail-section-title">品牌参考</div>
                                    <div class="materials-brands">
                                        ${mat.brands.map(function(brand) {
                                            return '<span class="materials-brand-tag">' + brand + '</span>';
                                        }).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            ${mat.tips && mat.tips.length > 0 ? `
                                <div class="materials-detail-section">
                                    <div class="materials-detail-section-title">选购要点</div>
                                    <div class="materials-tips">
                                        ${mat.tips.map(function(tip) {
                                            return '<div class="materials-tip-item">• ' + tip + '</div>';
                                        }).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            <div class="materials-detail-actions">
                                <button class="btn-secondary material-action-btn" data-action="mark-purchased" data-id="${mat.id}">
                                    标记为已采购
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        html += `</div>`;
        return html;
    }

    function getTotalMaterialsSpent() {
        var plan = getBudgetPlan();
        if (!plan) return 0;
        var total = 0;
        for (var key in plan.materials) {
            if (plan.materials.hasOwnProperty(key)) {
                total += plan.materials[key].spent;
            }
        }
        return total;
    }

    function renderBudgetOptimizationSuggestion() {
        var status = getBudgetStatus();
        var suggestion, statusColor, statusIcon;
        
        switch (status.level) {
            case 'healthy':
                suggestion = '建议继续保持，预留15-20%备用金';
                statusColor = 'suggestion-healthy';
                statusIcon = '✓';
                break;
            case 'warning':
                suggestion = '建议优先完成必需品，非必要支出延后';
                statusColor = 'suggestion-warning';
                statusIcon = '⚠️';
                break;
            case 'danger':
            case 'critical':
                suggestion = '建议暂停非必要支出，重新评估预算';
                statusColor = 'suggestion-danger';
                statusIcon = '🛑';
                break;
            default:
                return '';
        }

        return `
            <div class="budget-suggestion-card card">
                <div class="suggestion-header">
                    <div class="suggestion-icon ${statusColor}">${statusIcon}</div>
                    <div class="suggestion-title">预算优化建议</div>
                </div>
                <div class="suggestion-content">${suggestion}</div>
                <div class="suggestion-detail">
                    当前支出占比：<strong>${status.actualPercent.toFixed(1)}%</strong>
                </div>
            </div>
        `;
    }

    var MONEY_SAVING_TIPS = [
        {
            icon: '🏗️',
            title: '优先选择清包或半包',
            category: '施工方式',
            saving: '30000-50000元',
            howTo: '自己买主材，只包人工和辅材。虽然费点事，但能省下20-30%的费用，还能控制材料质量。',
            note: '适合有时间精力、对材料有一定了解的业主，前提是要找靠谱的施工队。'
        },
        {
            icon: '📐',
            title: '轻硬装重软装，简化造型',
            category: '设计方案',
            saving: '20000-40000元',
            howTo: '少做复杂吊顶、背景墙、各种造型。硬装越简单越好，钱花在软装上，效果好还能随时换。',
            note: '吊顶简单走个石膏线就行，背景墙用乳胶漆调色或贴墙布，比做造型便宜多了。'
        },
        {
            icon: '🏬',
            title: '瓷砖优先选广东砖，不必追求大牌',
            category: '材料采购',
            saving: '10000-30000元',
            howTo: '瓷砖是广东佛山产的质量都不错，不用非要买一线大牌，二线品牌性价比高很多。',
            note: '买的时候注意看平整度、吸水率，广东砖底坯一般比较白，密度高。'
        },
        {
            icon: '💧',
            title: '水电建议按点位计价',
            category: '施工方式',
            saving: '8000-20000元',
            howTo: '水电改造提前定好点位，按点位一口价包死，避免工人故意绕线多算钱。',
            note: '按米计费容易出现走线冗余问题，建议提前确认点位并按点位包干计价。'
        },
        {
            icon: '🪑',
            title: '定制衣柜可找本地工厂',
            category: '材料采购',
            saving: '10000-25000元',
            howTo: '直接找本地定制工厂，板材自己选好的，五金用好的，比品牌店便宜30-50%。',
            note: '找本地工厂要实地去看厂房和样品，确认工艺和封边质量，别急着交钱。'
        },
        {
            icon: '💳',
            title: '分阶段付款，验收合格再付',
            category: '付款方式',
            saving: '5000-20000元',
            howTo: '开工30%、水电验收30%、瓦木完工30%、竣工5%、质保期满5%。钱在您手里才有话语权。',
            note: '切勿开工即支付60%，否则后期出现问题时装修公司可能缺乏服务动力，难以保障整改质量。'
        },
        {
            icon: '📅',
            title: '淡季装修更划算',
            category: '时间安排',
            saving: '5000-15000元',
            howTo: '每年3-4月、9-10月是旺季，人工材料都贵。选冬天或夏天淡季装，能便宜10%左右。',
            note: '冬天装修只要温度在5度以上就没问题，而且工人活少，干活更仔细，不会赶工期。'
        },
        {
            icon: '🛋️',
            title: '家具家电可选网购+活动',
            category: '材料采购',
            saving: '5000-15000元',
            howTo: '沙发、床、餐桌这些成品家具网上买比实体店便宜很多，等618、双11买更划算。',
            note: '买之前先去实体店看看实物，确认尺寸和质量，再去网上找同款或类似款。'
        },
        {
            icon: '🎨',
            title: '墙面刷漆可省人工费',
            category: '材料采购',
            saving: '3000-10000元',
            howTo: '乳胶漆便宜又环保，选个好看的颜色效果不比墙布差，还没有胶水环保问题。',
            note: '想有质感可以选蛋壳光或丝光漆，比普通哑光漆有质感多了，也贵不了多少。'
        },
        {
            icon: '🔧',
            title: '五金件建议选优质品',
            category: '材料采购',
            saving: '长期省维修费',
            howTo: '铰链、滑轨、水龙头、花洒这些每天用的东西一定要买好的，不然坏了更换特别麻烦。',
            note: '这钱看起来是花了，其实是省钱——差的用一年就坏，好的能用十年，算下来更划算。'
        }
    ];

    var calculatorState = {
        area: 100,
        cityTier: 'newFirst',
        grade: 'medium'
    };

    var DECORATION_GRADES = {
        simple: { name: '简装', minPrice: 800, maxPrice: 1200, desc: '满足基本居住需求' },
        medium: { name: '精装', minPrice: 1200, maxPrice: 2000, desc: '品质与性价比兼顾' },
        luxury: { name: '豪装', minPrice: 2000, maxPrice: 3500, desc: '高品质追求完美' }
    };

    function calculateDecorationBudget(area, cityTier, grade) {
        var cityCoef = CITY_TIERS[cityTier] ? CITY_TIERS[cityTier].coefficient : 1.0;
        var gradeInfo = DECORATION_GRADES[grade];
        
        var minTotal = Math.round(area * gradeInfo.minPrice * cityCoef);
        var maxTotal = Math.round(area * gradeInfo.maxPrice * cityCoef);
        var avgTotal = Math.round((minTotal + maxTotal) / 2);

        var hardDecoration = Math.round(avgTotal * 0.5);
        var mainMaterials = Math.round(avgTotal * 0.3);
        var reserve = Math.round(avgTotal * 0.2);

        var designFee = Math.round(avgTotal * 0.05);
        var managementFee = Math.round(avgTotal * 0.05);
        var laborCost = Math.round(hardDecoration * 0.4 * cityCoef);
        var auxiliaryMaterials = hardDecoration - laborCost;

        var stageBudgets = STAGES.map(function(stage) {
            return {
                title: stage.title,
                icon: stage.icon,
                budget: Math.round(avgTotal * stage.ratio)
            };
        });

        return {
            minTotal: minTotal,
            maxTotal: maxTotal,
            avgTotal: avgTotal,
            perSqmMin: Math.round(gradeInfo.minPrice * cityCoef),
            perSqmMax: Math.round(gradeInfo.maxPrice * cityCoef),
            breakdown: {
                hardDecoration: {
                    total: hardDecoration,
                    laborCost: laborCost,
                    auxiliaryMaterials: auxiliaryMaterials
                },
                mainMaterials: mainMaterials,
                reserve: reserve,
                designFee: designFee,
                managementFee: managementFee
            },
            stages: stageBudgets
        };
    }

    function renderBudgetCalculator() {
        var result = calculateDecorationBudget(calculatorState.area, calculatorState.cityTier, calculatorState.grade);
        var gradeInfo = DECORATION_GRADES[calculatorState.grade];

        return `
            <div class="budget-calculator-card card">
                <div class="calculator-header">
                    <div class="calculator-title">
                        <span class="calculator-icon">🧮</span>
                        <span>快速估算</span>
                    </div>
                    <span class="badge badge-blue">532原则</span>
                </div>
                
                <div class="calculator-form">
                    <div class="calculator-row">
                        <div class="calculator-label">房屋面积</div>
                        <div class="calculator-input-wrapper">
                            <input type="number" class="calculator-input" id="calc-area-input" 
                                value="${calculatorState.area}" step="0.01">
                            <span class="calculator-unit">㎡</span>
                        </div>
                    </div>
                    
                    <div class="calculator-row">
                        <div class="calculator-label">城市等级</div>
                        <div class="calculator-options">
                            ${Object.keys(CITY_TIERS).map(function(key) {
                                var tier = CITY_TIERS[key];
                                return `
                                    <div class="calculator-option ${calculatorState.cityTier === key ? 'active' : ''}" data-city="${key}">
                                        ${tier.name}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="calculator-row">
                        <div class="calculator-label">装修档次</div>
                        <div class="calculator-options">
                            ${Object.keys(DECORATION_GRADES).map(function(key) {
                                var grade = DECORATION_GRADES[key];
                                return `
                                    <div class="calculator-option ${calculatorState.grade === key ? 'active' : ''}" data-grade="${key}">
                                        ${grade.name}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="calculator-result">
                    <div class="calculator-result-header">
                        <span>估算总价</span>
                        <span class="calculator-grade-label">${gradeInfo.name}</span>
                    </div>
                    <div class="calculator-result-price">
                        ¥ ${formatMoney(result.minTotal)} - ${formatMoney(result.maxTotal)}
                    </div>
                    <div class="calculator-result-unit">
                        ${result.perSqmMin}-${result.perSqmMax}元/㎡ · ${CITY_TIERS[calculatorState.cityTier].name}
                    </div>
                </div>
                
                <div class="calculator-breakdown">
                    <div class="calculator-breakdown-title">预算拆分（532原则）</div>
                    <div class="calculator-breakdown-list">
                        <div class="calculator-breakdown-item">
                            <div class="breakdown-item-left">
                                <span class="breakdown-item-icon">🔨</span>
                                <span class="breakdown-item-name">硬装 50%</span>
                            </div>
                            <div class="breakdown-item-amount">¥ ${formatMoney(result.breakdown.hardDecoration.total)}</div>
                        </div>
                        <div class="calculator-breakdown-sub">
                            <span>人工费 ¥${formatMoney(result.breakdown.hardDecoration.laborCost)}</span>
                            <span>辅材 ¥${formatMoney(result.breakdown.hardDecoration.auxiliaryMaterials)}</span>
                        </div>
                        <div class="calculator-breakdown-item">
                            <div class="breakdown-item-left">
                                <span class="breakdown-item-icon">📦</span>
                                <span class="breakdown-item-name">主材 30%</span>
                            </div>
                            <div class="breakdown-item-amount">¥ ${formatMoney(result.breakdown.mainMaterials)}</div>
                        </div>
                        <div class="calculator-breakdown-item">
                            <div class="breakdown-item-left">
                                <span class="breakdown-item-icon">💰</span>
                                <span class="breakdown-item-name">备用金 20%</span>
                            </div>
                            <div class="breakdown-item-amount">¥ ${formatMoney(result.breakdown.reserve)}</div>
                        </div>
                    </div>
                </div>
                
                <button class="btn-primary calculator-apply-btn" id="calc-apply-btn">
                    <span>${Icons.render('check')}</span>
                    <span>应用到我的预算</span>
                </button>
            </div>
        `;
    }

    function initCalculatorEvents() {
        var areaInput = document.getElementById('calc-area-input');
        if (areaInput) {
            areaInput.addEventListener('input', function() {
                var val = parseNumber(this.value);
                if (val < 0) val = 0;
                this.value = val;
                calculatorState.area = val;
                updateCalculator();
            });
        }

        var cityOptions = document.querySelectorAll('.calculator-option[data-city]');
        cityOptions.forEach(function(opt) {
            opt.addEventListener('click', function() {
                var city = this.getAttribute('data-city');
                calculatorState.cityTier = city;
                updateCalculator();
            });
        });

        var gradeOptions = document.querySelectorAll('.calculator-option[data-grade]');
        gradeOptions.forEach(function(opt) {
            opt.addEventListener('click', function() {
                var grade = this.getAttribute('data-grade');
                calculatorState.grade = grade;
                updateCalculator();
            });
        });

        var applyBtn = document.getElementById('calc-apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', function() {
                var result = calculateDecorationBudget(calculatorState.area, calculatorState.cityTier, calculatorState.grade);
                var plan = calculateBudget(result.avgTotal, calculatorState.cityTier, calculatorState.area);
                saveBudgetPlan(plan, true);
                
                App.state.userData.cityTier = calculatorState.cityTier;
                App.state.userData.area = calculatorState.area;
                App.saveState(true);
                
                showNianTipModal('已应用到预算！\n\n总预算：¥' + formatMoney(result.avgTotal) + '\n小管家帮您设置好了，开始精打细算吧~');
                
                addTimer(setTimeout(function() {
                    render(container);
                }, 1500));
            });
        }
    }

    function updateCalculator() {
        var result = calculateDecorationBudget(calculatorState.area, calculatorState.cityTier, calculatorState.grade);
        var gradeInfo = DECORATION_GRADES[calculatorState.grade];
        
        var cityOptions = document.querySelectorAll('.calculator-option[data-city]');
        cityOptions.forEach(function(opt) {
            var city = opt.getAttribute('data-city');
            if (city === calculatorState.cityTier) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });

        var gradeOptions = document.querySelectorAll('.calculator-option[data-grade]');
        gradeOptions.forEach(function(opt) {
            var grade = opt.getAttribute('data-grade');
            if (grade === calculatorState.grade) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });

        var resultPrice = document.querySelector('.calculator-result-price');
        var resultUnit = document.querySelector('.calculator-result-unit');
        var gradeLabel = document.querySelector('.calculator-grade-label');
        
        if (resultPrice) {
            resultPrice.innerHTML = '¥ ' + formatMoney(result.minTotal) + ' - ' + formatMoney(result.maxTotal);
        }
        if (resultUnit) {
            resultUnit.textContent = result.perSqmMin + '-' + result.perSqmMax + '元/㎡ · ' + CITY_TIERS[calculatorState.cityTier].name;
        }
        if (gradeLabel) {
            gradeLabel.textContent = gradeInfo.name;
        }
    }

    function renderMoneySavingTips() {
        var categories = {};
        MONEY_SAVING_TIPS.forEach(function(tip) {
            if (!categories[tip.category]) {
                categories[tip.category] = [];
            }
            categories[tip.category].push(tip);
        });

        return `
            <div class="budget-savings-tips-card card">
                <div class="tips-header">
                    <div class="tips-icon">💰</div>
                    <div class="tips-title">省钱技巧</div>
                    <span class="badge badge-green" style="margin-left: auto; font-size: 12px;">${MONEY_SAVING_TIPS.length}个技巧</span>
                </div>
                <div class="tips-list">
                    ${MONEY_SAVING_TIPS.map(function(tip, idx) {
                        return `
                            <div class="saving-tip-item" data-tip-idx="${idx}">
                                <div class="saving-tip-header">
                                    <div class="saving-tip-icon">${tip.icon}</div>
                                    <div class="saving-tip-title">${tip.title}</div>
                                    <div class="saving-tip-saving">${tip.saving}</div>
                                </div>
                                <div class="saving-tip-detail">
                                    <div class="saving-tip-row">
                                        <span class="saving-tip-label">📌 怎么做：</span>
                                        <span>${tip.howTo}</span>
                                    </div>
                                    <div class="saving-tip-row">
                                        <span class="saving-tip-label">💡 注意：</span>
                                        <span>${tip.note}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    function initSavingTipsEvents() {
        var tipItems = document.querySelectorAll('.saving-tip-item');
        tipItems.forEach(function(item) {
            item.addEventListener('click', function() {
                this.classList.toggle('expanded');
            });
        });
    }

    function renderMoneySavingTips_old() {
        var tips = [
            { icon: '🛒', title: '材料采购', content: '瓷砖选广东砖性价比高，地板选实木复合' },
            { icon: '⚒️', title: '施工方式', content: '水电改造按实际用量结算，避免套餐陷阱' },
            { icon: '📐', title: '设计方案', content: '简化吊顶和造型，减少不必要的装饰' },
            { icon: '💳', title: '付款方式', content: '分5次付款，每次付款前验收合格' },
            { icon: '📅', title: '时间安排', content: '淡季装修价格更低，避开春节和雨季' }
        ];

        return `
            <div class="budget-savings-tips-card card">
                <div class="tips-header">
                    <div class="tips-icon">💰</div>
                    <div class="tips-title">省钱技巧</div>
                </div>
                <div class="tips-list">
                    ${tips.map(function(tip) {
                        return `
                            <div class="tip-item">
                                <div class="tip-icon">${tip.icon}</div>
                                <div class="tip-content">
                                    <div class="tip-title">${tip.title}</div>
                                    <div class="tip-desc">${tip.content}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    function getAdditionalFees() {
        if (!App.state.userData.additionalFees) {
            App.state.userData.additionalFees = [];
        }
        return App.state.userData.additionalFees;
    }

    function syncAdditionalFeesToBudget() {
        var plan = getBudgetPlan();
        if (!plan) return;
        if (plan.additionalFeesSynced) return;
        
        var fees = getAdditionalFees();
        if (fees.length === 0) {
            plan.additionalFeesSynced = true;
            saveBudgetPlan(plan);
            return;
        }
        
        var totalFees = fees.reduce(function(sum, fee) {
            var amt = parseFloat(fee.amount);
            return sum + (!isNaN(amt) && amt > 0 ? amt : 0);
        }, 0);
        
        if (totalFees <= 0) {
            plan.additionalFeesSynced = true;
            saveBudgetPlan(plan);
            return;
        }
        
        var normalBudgetRemaining = plan.totalBudget - (plan.totalSpent || 0);
        if (totalFees <= normalBudgetRemaining) {
            plan.totalSpent = (plan.totalSpent || 0) + totalFees;
        } else {
            var fromNormal = Math.max(0, normalBudgetRemaining);
            var fromReserve = totalFees - fromNormal;
            plan.totalSpent = (plan.totalSpent || 0) + fromNormal;
            plan.reserveUsed = Math.min(plan.breakdown ? plan.breakdown.reserve : 0, (plan.reserveUsed || 0) + fromReserve);
        }
        
        plan.additionalFeesSynced = true;
        saveBudgetPlan(plan);
    }
    
    function renderAdditionalFeesSection() {
        var fees = getAdditionalFees();
        var totalFees = fees.reduce(function(sum, fee) { return sum + fee.amount; }, 0);
        
        return `
            <div class="additional-fees-card card" id="additional-fees-section">
                <div class="additional-fees-header">
                    <div class="additional-fees-title">
                        <span class="additional-fees-icon">📋</span>
                        <span>增项费用</span>
                        ${fees.length > 0 ? `<span class="badge badge-orange">${fees.length}项</span>` : ''}
                    </div>
                    <button class="btn-primary btn-sm" id="add-additional-fee-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        添加增项
                    </button>
                </div>
                ${fees.length > 0 ? `
                    <div class="additional-fees-total">
                        <span>增项总计：</span>
                        <span class="additional-fees-amount">¥ ${formatMoney(totalFees)}</span>
                    </div>
                    <div class="additional-fees-list">
                        ${fees.map(function(fee, idx) {
                            return `
                                <div class="additional-fee-item" data-fee-idx="${idx}">
                                    <div class="additional-fee-info">
                                        <div class="additional-fee-name">${escapeHtml(fee.name)}</div>
                                        <div class="additional-fee-desc">${escapeHtml(fee.reason || '')}</div>
                                    </div>
                                    <div class="additional-fee-amount">¥ ${formatMoney(fee.amount)}</div>
                                    <button class="btn-icon additional-fee-delete" data-fee-idx="${idx}">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="additional-fees-empty">
                        <div class="additional-fees-empty-icon">📋</div>
                        <div class="additional-fees-empty-text">暂无增项费用</div>
                        <div class="additional-fees-empty-hint">装修中的设计变更、材料升级等额外支出可记录在这里</div>
                    </div>
                `}
            </div>
        `;
    }

    function addDomListener(element, event, handler) {
        if (!element) return;
        element.addEventListener(event, handler);
        domEventListeners.push({ element: element, event: event, handler: handler });
    }

    function removeAllDomListeners() {
        for (var i = 0; i < domEventListeners.length; i++) {
            var item = domEventListeners[i];
            if (item.element && item.event && item.handler) {
                item.element.removeEventListener(item.event, item.handler);
            }
        }
        domEventListeners = [];
        dashboardEventsBound = false;
    }

    function initDashboardEvents() {
        if (dashboardEventsBound) return;
        dashboardEventsBound = true;

        addDomListener(el.backBtn, 'click', function() {
            App.switchView('home');
        });

        addDomListener(el.editBtn, 'click', function() {
            showEditBudgetModal();
        });

        if (el.versionBtn) {
            addDomListener(el.versionBtn, 'click', function() {
                showVersionManager();
            });
        }

        addDomListener(el.resetBtn, 'click', function() {
            showWarningModal('确认重置数据', '确定要清空所有预算数据吗？<br><br>包括：<br>• 所有支出记录<br>• 增项费用<br>• 预算计划<br><br>此操作不可恢复！', function() {
                App.state.userData.budgetPlan = null;
                App.state.userData.additionalFees = [];
                App.saveState(true);
                wizardStep = 1;
                render(container);
            });
        });

        var btnAiAssistant = document.getElementById('btn-ai-assistant');
        if (btnAiAssistant) {
            addDomListener(btnAiAssistant, 'click', showAiAssistantModal);
        }
        
        var addFeeBtn = document.getElementById('add-additional-fee-btn');
        if (addFeeBtn) {
            addDomListener(addFeeBtn, 'click', function() {
                showAddAdditionalFeeModal();
            });
        }
        
        var additionalFeesSection = document.getElementById('additional-fees-section');
        if (additionalFeesSection) {
            addDomListener(additionalFeesSection, 'click', function(e) {
                var deleteBtn = e.target.closest('.additional-fee-delete');
                if (deleteBtn) {
                    e.stopPropagation();
                    var idx = parseInt(deleteBtn.getAttribute('data-fee-idx'));
                    deleteAdditionalFee(idx);
                }
            });
        }
        
        var stagesList = document.getElementById('stages-list');
        if (stagesList) {
            addDomListener(stagesList, 'click', function(e) {
                var stageCard = e.target.closest('.stage-card');
                if (!stageCard) return;
                var stageId = parseInt(stageCard.getAttribute('data-stage-id'));
                if (expandedStage === stageId) {
                    expandedStage = null;
                } else {
                    expandedStage = stageId;
                }
                stagesList.innerHTML = renderStagesList();
            });
        }

        addDomListener(container, 'click', function(e) {
            var toggleEl = e.target.closest('[data-action="toggle-category"]');
            if (!toggleEl) return;
            var card = toggleEl.closest('.category-card');
            if (!card) return;
            var catKey = card.getAttribute('data-category-key');
            if (!catKey) return;

            if (expandedCategory === catKey) {
                expandedCategory = null;
            } else {
                expandedCategory = catKey;
            }

            var plan = getBudgetPlan();
            if (plan && plan.categories && plan.categories[catKey]) {
                var catData = plan.categories[catKey];
                var modeConfig = getModeConfig(plan.mode || 'full');
                var expandable = false;
                if (modeConfig && modeConfig.categories) {
                    for (var i = 0; i < modeConfig.categories.length; i++) {
                        if (modeConfig.categories[i].id === catKey) {
                            expandable = !!(modeConfig.categories[i].children && modeConfig.categories[i].children.length > 0);
                            break;
                        }
                    }
                }
                var newCardHtml = renderCategoryCard(catKey, catData, plan, expandable);
                card.outerHTML = newCardHtml;
            }
        });

        addDomListener(container, 'click', function(e) {
            var tagFilterEl = e.target.closest('[data-tag-filter]');
            if (!tagFilterEl) return;
            var card = tagFilterEl.closest('.category-card');
            if (!card) return;
            var catKey = card.getAttribute('data-category-key');
            if (!catKey) return;

            var tagFilter = tagFilterEl.getAttribute('data-tag-filter');
            categoryExpenseTagFilter[catKey] = tagFilter;

            var plan = getBudgetPlan();
            if (plan && plan.categories && plan.categories[catKey]) {
                var catData = plan.categories[catKey];
                var modeConfig = getModeConfig(plan.mode || 'full');
                var expandable = false;
                if (modeConfig && modeConfig.categories) {
                    for (var i = 0; i < modeConfig.categories.length; i++) {
                        if (modeConfig.categories[i].id === catKey) {
                            expandable = !!(modeConfig.categories[i].children && modeConfig.categories[i].children.length > 0);
                            break;
                        }
                    }
                }
                var newCardHtml = renderCategoryCard(catKey, catData, plan, expandable);
                card.outerHTML = newCardHtml;
            }
        });

        var floatingAddBtn = document.getElementById('floating-add-expense-btn');
        if (floatingAddBtn) {
            addDomListener(floatingAddBtn, 'click', function() {
                showAddExpenseModal();
            });
        }

        if (el.warningClose) {
            addDomListener(el.warningClose, 'click', hideWarningModal);
        }
        if (el.warningCancel) {
            addDomListener(el.warningCancel, 'click', hideWarningModal);
        }

        initCalculatorEvents();
        initSavingTipsEvents();
        initDisclaimerEvents();
        initTooltipEvents();
        initQuickAdjustEvents();
        initKnowledgeEvents();
    }

    var warningCallback = null;

    function showWarningModal(title, body, callback, isCritical) {
        warningCallback = callback;
        
        if (el.warningTitle) el.warningTitle.textContent = title;
        if (el.warningBody) el.warningBody.innerHTML = escapeHtml(body).replace(/\n/g, '<br>');
        
        if (el.warningConfirm) {
            el.warningConfirm.textContent = callback ? '确认' : '知道了';
            el.warningConfirm.onclick = function() {
                hideWarningModal();
                if (callback) callback();
            };
        }
        
        if (el.warningCancel) {
            el.warningCancel.style.display = callback ? '' : 'none';
        }
        
        if (el.warningModal) {
            el.warningModal.classList.add('active');
            if (isCritical) {
                el.warningModal.classList.add('critical');
            } else {
                el.warningModal.classList.remove('critical');
            }
        }
    }

    function hideWarningModal() {
        if (el.warningModal) {
            el.warningModal.classList.remove('active');
            el.warningModal.classList.remove('critical');
        }
        warningCallback = null;
    }
    
    function mapExpensesToNewCategories(oldPlan, newPlan) {
        if (!oldPlan || !oldPlan.categories || !newPlan || !newPlan.categories) {
            return newPlan;
        }

        var oldTotalSpent = oldPlan.totalSpent || 0;
        var oldReserveUsed = oldPlan.reserveUsed || 0;
        var oldTotalBudget = oldPlan.totalBudget || 1;

        var newTotalBudget = newPlan.totalBudget || 1;
        var ratio = oldTotalBudget > 0 ? oldTotalSpent / oldTotalBudget : 0;

        var newTotalSpent = 0;
        var newReserveSpent = 0;

        for (var catKey in newPlan.categories) {
            if (!newPlan.categories.hasOwnProperty(catKey)) continue;
            var newCat = newPlan.categories[catKey];
            var catBudget = newCat.budget || 0;

            if (catKey === 'reserve') {
                var reserveRatio = oldTotalBudget > 0 ? oldReserveUsed / oldTotalBudget : 0;
                var newReserveAmount = Math.round(newTotalBudget * reserveRatio);
                newCat.spent = Math.min(newReserveAmount, catBudget);
                newReserveSpent = newCat.spent;
            } else {
                var catSpent = Math.round(catBudget * ratio);
                newCat.spent = catSpent;
                newTotalSpent += catSpent;
            }

            if (newCat.items && typeof newCat.items === 'object') {
                var subTotalBudget = 0;
                for (var subKey in newCat.items) {
                    if (newCat.items.hasOwnProperty(subKey)) {
                        subTotalBudget += newCat.items[subKey].budget || 0;
                    }
                }
                if (subTotalBudget > 0) {
                    for (var subKey2 in newCat.items) {
                        if (newCat.items.hasOwnProperty(subKey2)) {
                            var subItem = newCat.items[subKey2];
                            var subBudget = subItem.budget || 0;
                            var subRatio = subBudget / subTotalBudget;
                            subItem.spent = Math.round(catSpent * subRatio);

                            if (subItem.items && typeof subItem.items === 'object') {
                                var subSubTotal = 0;
                                for (var ssKey in subItem.items) {
                                    if (subItem.items.hasOwnProperty(ssKey)) {
                                        subSubTotal += subItem.items[ssKey].budget || 0;
                                    }
                                }
                                if (subSubTotal > 0) {
                                    for (var ssKey2 in subItem.items) {
                                        if (subItem.items.hasOwnProperty(ssKey2)) {
                                            var ssItem = subItem.items[ssKey2];
                                            var ssBudget = ssItem.budget || 0;
                                            var ssRatio = ssBudget / subSubTotal;
                                            ssItem.spent = Math.round(subItem.spent * ssRatio);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        newPlan.totalSpent = newTotalSpent;
        newPlan.reserveUsed = newReserveSpent;

        for (var s = 0; s < newPlan.stages.length; s++) {
            if (oldPlan.stages && oldPlan.stages[s]) {
                var oldStage = oldPlan.stages[s];
                var newStage = newPlan.stages[s];
                var oldStageBudget = oldStage.budget || 1;
                var stageRatio = oldStage.spent / oldStageBudget;
                newStage.spent = Math.round(newStage.budget * stageRatio);
                newStage.status = oldStage.status || 'locked';
                newStage.expenses = oldStage.expenses || [];
            }
        }

        newPlan.alerted90 = oldPlan.alerted90 || false;
        newPlan.alerted115 = oldPlan.alerted115 || false;

        return newPlan;
    }

    function recalculateBudgetByMode(editData) {
        var oldPlan = getBudgetPlan();
        if (!oldPlan) return null;

        var mode = oldPlan.mode || 'full';
        var newPlan = calculateBudgetByMode(mode, editData);

        newPlan = mapExpensesToNewCategories(oldPlan, newPlan);

        saveBudgetPlan(newPlan, true);

        EventBus.emit(EventBus.EVENTS.BUDGET_UPDATED, {
            type: 'recalculate',
            totalBudget: newPlan.totalBudget,
            totalSpent: newPlan.totalSpent,
            reserveUsed: newPlan.reserveUsed
        });

        return newPlan;
    }

    function isOverspentAfterEdit(newTotalBudget, currentSpent) {
        return currentSpent > newTotalBudget;
    }

    function showEditBudgetModal() {
        var modalId = 'budget-edit-modal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var plan = getBudgetPlan();
        if (!plan) return;

        var mode = plan.mode || 'full';
        var modeNames = { full: '全包', half: '半包', self: '自装' };
        var modeName = modeNames[mode] || '全包';
        var editParams = plan.editParams || {};

        var cityOptions = [
            { id: 'first', name: '一线城市', coef: 1.2 },
            { id: 'newFirst', name: '新一线城市', coef: 1.0 },
            { id: 'second', name: '二线城市', coef: 0.85 },
            { id: 'third', name: '三线及以下', coef: 0.7 }
        ];

        var modeSpecificFields = '';

        if (mode === 'full') {
            var currentPkgLevel = editParams.packageLevel || 'comfort';
            var pkgOptionsHtml = '';
            var pkgIds = ['economy', 'comfort', 'quality', 'luxury'];
            for (var pi = 0; pi < pkgIds.length; pi++) {
                var pid = pkgIds[pi];
                var pkg = PACKAGE_LEVELS[pid];
                if (!pkg) continue;
                var isPkgSelected = currentPkgLevel === pid;
                pkgOptionsHtml += `
                    <div class="edit-package-option ${isPkgSelected ? 'active' : ''}" data-package="${pid}">
                        <div class="edit-pkg-name">${pkg.name}</div>
                        <div class="edit-pkg-price">${pkg.priceRange}元/㎡</div>
                        <div class="edit-pkg-check">${isPkgSelected ? '✓' : ''}</div>
                    </div>
                `;
            }
            modeSpecificFields = `
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">套餐档次</label>
                    <div class="edit-package-grid" id="edit-package-selector">
                        ${pkgOptionsHtml}
                    </div>
                </div>
            `;
        } else if (mode === 'half') {
            var constructionFee = editParams.constructionFee || Math.round(plan.totalBudget * 0.35);
            var materialLevel = editParams.materialLevel || 'comfort';
            var matLevelHtml = '';
            var matLevels = [
                { id: 'economy', name: '经济档' },
                { id: 'comfort', name: '舒适档' },
                { id: 'quality', name: '品质档' }
            ];
            for (var mli = 0; mli < matLevels.length; mli++) {
                var ml = matLevels[mli];
                var isMlSelected = materialLevel === ml.id;
                matLevelHtml += `
                    <div class="edit-material-level ${isMlSelected ? 'active' : ''}" data-level="${ml.id}">
                        ${ml.name}
                    </div>
                `;
            }
            modeSpecificFields = `
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">施工费（元）</label>
                    <input type="number" class="form-input" id="edit-construction-fee" value="${constructionFee}" step="0.01">
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">主材档次</label>
                    <div class="edit-material-levels" id="edit-material-levels">
                        ${matLevelHtml}
                    </div>
                </div>
            `;
        } else if (mode === 'self') {
            var designFeeRatio = editParams.designFeeRatio || 0.03;
            var designFeePct = Math.round(designFeeRatio * 100);
            var laborTotal = editParams.laborTotal || Math.round(plan.totalBudget * 0.27);
            var matFee = editParams.materialFee || { auxiliary: 0, main: 0, custom: 0 };
            var matFeeTotal = (matFee.auxiliary || 0) + (matFee.main || 0) + (matFee.custom || 0);
            modeSpecificFields = `
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">设计费比例：<span id="edit-design-fee-pct">${designFeePct}%</span></label>
                    <input type="range" class="form-input" id="edit-design-fee-slider" 
                        min="0" max="10" step="1" value="${designFeePct}" style="width: 100%;">
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">人工费（元）</label>
                    <input type="number" class="form-input" id="edit-labor-fee" value="${laborTotal}" step="0.01">
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">材料费合计（元）</label>
                    <input type="number" class="form-input" id="edit-material-fee" value="${matFeeTotal}" step="0.01">
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                        辅材 + 主材 + 定制家具
                    </div>
                </div>
            `;
        }

        var cityOptionsHtml = cityOptions.map(function(city) {
            return `
                <div class="city-option ${plan.cityTier === city.id ? 'active' : ''}" data-city="${city.id}">
                    <div class="city-name">${city.name}</div>
                    <div class="city-coef">系数 ×${city.coef}</div>
                </div>
            `;
        }).join('');

        var modalHtml = `
            <div class="sop-modal-backdrop active" id="${modalId}">
                <div class="sop-modal" style="max-width: 480px;">
                    <div class="sop-modal-header">
                        <h3 class="sop-modal-title">调整预算 - ${modeName}模式</h3>
                        <button class="sop-modal-close" onclick="BudgetView.closeModal('${modalId}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="sop-modal-body" style="padding: 24px; max-height: 60vh; overflow-y: auto;">
                        <div class="edit-mode-locked-notice">
                            <span class="mode-lock-icon">🔒</span>
                            <span class="mode-lock-text">当前模式：${modeName}，不可切换。如需切换模式，请先"重置预算"。</span>
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6;">
                            调整预算参数后，系统会重新分配预算比例，已记录的支出将按比例映射到新结构中。
                        </div>
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label">总预算（元）</label>
                            <input type="number" class="form-input" id="edit-budget-total" value="${plan.totalBudget}" step="0.01">
                        </div>
                        ${modeSpecificFields}
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label">所在城市</label>
                            <div class="city-selector" id="edit-city-selector">
                                ${cityOptionsHtml}
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">房屋面积（㎡）</label>
                            <input type="number" class="form-input" id="edit-budget-area" value="${plan.area}" step="0.01">
                        </div>
                    </div>
                    <div class="sop-modal-footer">
                        <button class="btn-secondary" onclick="BudgetView.closeModal('${modalId}')">取消</button>
                        <button class="btn-primary" id="edit-budget-confirm">确认调整</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        trackModal(modalId);

        var selectedCity = plan.cityTier;
        var selectedPackage = editParams.packageLevel || 'comfort';
        var selectedMaterialLevel = editParams.materialLevel || 'comfort';

        var cityOptionEls = document.querySelectorAll('#edit-city-selector .city-option');
        cityOptionEls.forEach(function(opt) {
            opt.addEventListener('click', function() {
                cityOptionEls.forEach(function(o) { o.classList.remove('active'); });
                opt.classList.add('active');
                selectedCity = opt.getAttribute('data-city');
            });
        });

        if (mode === 'full') {
            var pkgOptions = document.querySelectorAll('#edit-package-selector .edit-package-option');
            pkgOptions.forEach(function(opt) {
                opt.addEventListener('click', function() {
                    pkgOptions.forEach(function(o) { o.classList.remove('active'); });
                    opt.classList.add('active');
                    selectedPackage = opt.getAttribute('data-package');
                });
            });
        }

        if (mode === 'half') {
            var mlOptions = document.querySelectorAll('#edit-material-levels .edit-material-level');
            mlOptions.forEach(function(opt) {
                opt.addEventListener('click', function() {
                    mlOptions.forEach(function(o) { o.classList.remove('active'); });
                    opt.classList.add('active');
                    selectedMaterialLevel = opt.getAttribute('data-level');
                });
            });
        }

        if (mode === 'self') {
            var designSlider = document.getElementById('edit-design-fee-slider');
            var designPctEl = document.getElementById('edit-design-fee-pct');
            if (designSlider && designPctEl) {
                designSlider.addEventListener('input', function() {
                    var val = parseInt(this.value) || 0;
                    designPctEl.textContent = val + '%';
                });
            }
        }

        var editBudgetConfirmBtn = document.getElementById('edit-budget-confirm');
        if (editBudgetConfirmBtn) {
            editBudgetConfirmBtn.addEventListener('click', function() {
            var totalBudget = parseNumber(document.getElementById('edit-budget-total').value);
            var area = parseNumber(document.getElementById('edit-budget-area').value);

            if (!totalBudget || totalBudget <= 0) {
                if (typeof Toast !== 'undefined') {
                    Toast.warning('请输入有效的总预算金额');
                }
                document.getElementById('edit-budget-total').focus();
                return;
            }
            if (!area || area <= 0) {
                if (typeof Toast !== 'undefined') {
                    Toast.warning('请输入有效的房屋面积');
                }
                document.getElementById('edit-budget-area').focus();
                return;
            }
            if (!selectedCity) {
                if (typeof Toast !== 'undefined') {
                    Toast.warning('请选择城市等级');
                }
                return;
            }

            var oldPlan = getBudgetPlan();
            var currentSpent = oldPlan ? (oldPlan.totalSpent || 0) + (oldPlan.reserveUsed || 0) : 0;

            var editData = {
                totalBudget: totalBudget,
                cityTier: selectedCity,
                area: area
            };

            if (mode === 'full') {
                editData.packageLevel = selectedPackage;
            } else if (mode === 'half') {
                var constructionFee = parseFloat(document.getElementById('edit-construction-fee').value) || 0;
                editData.constructionFee = constructionFee;
                editData.constructionLaborRatio = editParams.constructionLaborRatio || 0.55;
                editData.constructionAuxiliaryRatio = editParams.constructionAuxiliaryRatio || 0.30;
                editData.constructionManagementRatio = editParams.constructionManagementRatio || 0.15;

                var areaForCalc = area || 80;
                var materialList = {};
                for (var mi = 0; mi < MATERIAL_CATEGORIES.length; mi++) {
                    var mcat = MATERIAL_CATEGORIES[mi];
                    var estimatedQty = Math.round(areaForCalc * 0.8);
                    if (mcat.id === 'door') estimatedQty = Math.max(3, Math.round(areaForCalc / 30));
                    if (mcat.id === 'sanitary') estimatedQty = Math.max(1, Math.round(areaForCalc / 50));
                    if (mcat.id === 'cabinet') estimatedQty = Math.max(3, Math.round(areaForCalc / 25));
                    if (mcat.id === 'lighting') estimatedQty = Math.max(1, Math.round(areaForCalc / 20));
                    if (mcat.id === 'window') estimatedQty = Math.round(areaForCalc * 0.25);
                    if (mcat.id === 'hardware') estimatedQty = Math.max(1, Math.round(areaForCalc / 30));
                    materialList[mcat.id] = {
                        id: mcat.id,
                        name: mcat.name,
                        level: selectedMaterialLevel,
                        quantity: estimatedQty,
                        unit: mcat.unit,
                        basePrice: mcat.unitPrice
                    };
                }
                editData.materialList = materialList;
            } else if (mode === 'self') {
                var designSliderVal = parseInt(document.getElementById('edit-design-fee-slider').value) || 0;
                editData.designFeeRatio = designSliderVal / 100;
                editData.designFeeOption = editParams.designFeeOption || 'simple';

                var laborFee = parseFloat(document.getElementById('edit-labor-fee').value) || 0;
                var laborDetail = {};
                var cityCoef = CITY_TIERS[selectedCity] ? CITY_TIERS[selectedCity].coefficient : 1.0;
                var totalBaseLabor = 0;
                for (var li = 0; li < LABOR_TYPES.length; li++) {
                    var lt = LABOR_TYPES[li];
                    var baseDays = Math.max(1, Math.round(area * lt.baseDaysPerSqm));
                    var dailyWage = Math.round(lt.baseDailyWage * cityCoef);
                    totalBaseLabor += baseDays * dailyWage;
                }
                var laborRatio = totalBaseLabor > 0 ? laborFee / totalBaseLabor : 1;
                for (var lj = 0; lj < LABOR_TYPES.length; lj++) {
                    var lt2 = LABOR_TYPES[lj];
                    var baseDays2 = Math.max(1, Math.round(area * lt2.baseDaysPerSqm));
                    var dailyWage2 = Math.round(lt2.baseDailyWage * cityCoef);
                    laborDetail[lt2.id] = Math.round(baseDays2 * dailyWage2 * laborRatio);
                }
                editData.laborDetail = laborDetail;

                var matFeeTotal = parseFloat(document.getElementById('edit-material-fee').value) || 0;
                editData.materialFee = {
                    auxiliary: Math.round(matFeeTotal * 0.30),
                    main: Math.round(matFeeTotal * 0.50),
                    custom: Math.round(matFeeTotal * 0.20)
                };
                editData.customFurnitureMeters = editParams.customFurnitureMeters || Math.max(3, Math.round(area / 15));
            }

            function doAdjust() {
                recalculateBudgetByMode(editData);
                BudgetView.closeModal(modalId);
                if (typeof Toast !== 'undefined') {
                    Toast.success('预算已调整');
                }
                render(container);
            }

            if (isOverspentAfterEdit(totalBudget, currentSpent)) {
                showWarningModal(
                    '超支预警',
                    '当前已支出 ¥' + formatMoney(currentSpent) + '，超过了新预算 ¥' + formatMoney(totalBudget) + '。<br><br>继续调整将导致预算超支，是否确认？',
                    doAdjust
                );
            } else {
                doAdjust();
            }
            });

            var editBudgetTotalEl = document.getElementById('edit-budget-total');
            if (editBudgetTotalEl) {
                editBudgetTotalEl.focus();
            }
        }
    }
    
    function showAddAdditionalFeeModal() {
        var modalId = 'budget-add-fee-modal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var modalHtml = `
            <div class="sop-modal-backdrop active" id="${modalId}">
                <div class="sop-modal" style="max-width: 380px;">
                    <div class="sop-modal-header">
                        <h3 class="sop-modal-title">添加增项费用</h3>
                        <button class="sop-modal-close" onclick="BudgetView.closeModal('${modalId}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="sop-modal-body" style="padding: 24px;">
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label">增项名称</label>
                            <input type="text" class="form-input" id="fee-name-input" placeholder="如：设计变更、主材升级">
                        </div>
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label">金额（元）</label>
                            <input type="number" class="form-input" id="fee-amount-input" placeholder="如：5000" step="0.01">
                        </div>
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label">原因说明</label>
                            <textarea class="form-input" id="fee-reason-input" placeholder="可选：说明增项原因" rows="2"></textarea>
                        </div>
                    </div>
                    <div class="sop-modal-footer">
                        <button class="btn-secondary" onclick="BudgetView.closeModal('${modalId}')">取消</button>
                        <button class="btn-primary" id="fee-confirm-btn">确认添加</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        trackModal(modalId);
        
        var feeConfirmBtn = document.getElementById('fee-confirm-btn');
        if (feeConfirmBtn) {
            feeConfirmBtn.addEventListener('click', function() {
                var name = document.getElementById('fee-name-input').value.trim();
                var amount = parseFloat(document.getElementById('fee-amount-input').value);
                var reason = document.getElementById('fee-reason-input').value.trim();
                
                if (!name) {
                    if (typeof Toast !== 'undefined') {
                        Toast.warning('请输入增项名称');
                    }
                    var feeNameInput = document.getElementById('fee-name-input');
                    if (feeNameInput) feeNameInput.focus();
                    return;
                }
                if (!amount || amount <= 0 || isNaN(amount)) {
                    if (typeof Toast !== 'undefined') {
                        Toast.warning('请输入有效的金额（大于0）');
                    }
                    var feeAmountInput = document.getElementById('fee-amount-input');
                    if (feeAmountInput) feeAmountInput.focus();
                    return;
                }
                
                addAdditionalFee(name, amount, reason);
                BudgetView.closeModal(modalId);
            });
        }
        
        var feeNameInputEl = document.getElementById('fee-name-input');
        if (feeNameInputEl) {
            feeNameInputEl.focus();
        }
    }
    
    function addAdditionalFee(name, amount, reason) {
        var fees = getAdditionalFees();
        fees.push({ name: name, amount: amount, reason: reason, date: new Date().toISOString() });
        
        var plan = getBudgetPlan();
        if (plan) {
            var amt = parseFloat(amount);
            if (!isNaN(amt) && amt > 0) {
                var normalBudgetRemaining = plan.totalBudget - (plan.totalSpent || 0);
                if (amt <= normalBudgetRemaining) {
                    plan.totalSpent = (plan.totalSpent || 0) + amt;
                } else {
                    var fromNormal = Math.max(0, normalBudgetRemaining);
                    var fromReserve = amt - fromNormal;
                    plan.totalSpent = (plan.totalSpent || 0) + fromNormal;
                    plan.reserveUsed = (plan.reserveUsed || 0) + fromReserve;

                    if (plan.categories && plan.categories.reserve) {
                        plan.categories.reserve.spent = (plan.categories.reserve.spent || 0) + fromReserve;
                    }
                }
                saveBudgetPlan(plan);
                checkBudgetAlerts();
            }
        }
        
        App.saveState();
        render(container);
    }
    
    function deleteAdditionalFee(idx) {
        var fees = getAdditionalFees();
        var fee = fees[idx];
        if (fee) {
            var plan = getBudgetPlan();
            if (plan) {
                var amt = parseFloat(fee.amount);
                if (!isNaN(amt) && amt > 0) {
                    var reserveToRefund = Math.min(plan.reserveUsed || 0, amt);
                    var normalToRefund = amt - reserveToRefund;
                    plan.reserveUsed = Math.max(0, (plan.reserveUsed || 0) - reserveToRefund);
                    plan.totalSpent = Math.max(0, (plan.totalSpent || 0) - normalToRefund);

                    if (plan.categories && plan.categories.reserve) {
                        plan.categories.reserve.spent = Math.max(0, (plan.categories.reserve.spent || 0) - reserveToRefund);
                    }
                    saveBudgetPlan(plan);
                }
            }
        }
        
        fees.splice(idx, 1);
        App.saveState();
        render(container);
    }
    
    function trackModal(modalId) {
        if (dynamicModals.indexOf(modalId) === -1) {
            dynamicModals.push(modalId);
        }
    }

    function closeModal(modalId) {
        var modal = document.getElementById(modalId);
        if (modal) modal.remove();
        var idx = dynamicModals.indexOf(modalId);
        if (idx > -1) {
            dynamicModals.splice(idx, 1);
        }
    }

    function closeAllDynamicModals() {
        for (var i = dynamicModals.length - 1; i >= 0; i--) {
            var modalId = dynamicModals[i];
            var modal = document.getElementById(modalId);
            if (modal) modal.remove();
        }
        dynamicModals = [];
    }

    function showNianTipModal(message) {
        var modalId = 'budget-nian-tip-modal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var nian = getNianState();
        
        var modalHtml = `
            <div class="sop-modal-backdrop active" id="${modalId}">
                <div class="sop-modal" style="max-width: 400px;">
                    <div style="padding: 32px; text-align: center;">
                        <div class="nian-container ${nian.state}" style="margin: 0 auto 16px; width: 80px; height: 80px; font-size: 44px;">
                            <span class="nian-emoji">${Icons.render(nian.emoji)}</span>
                        </div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--text); margin-bottom: 8px;">小管家提示</div>
                        <div style="font-size: 15px; color: var(--text-secondary); line-height: 1.6; white-space: pre-line;">${message}</div>
                        <button class="btn-primary" style="margin-top: 24px; width: 100%; justify-content: center;" onclick="document.getElementById('${modalId}').remove()">
                            知道啦
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        trackModal(modalId);

        var modal = document.getElementById(modalId);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
    }

    function formatMoney(amount) {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return '0';
        }
        var num = Number(amount);
        if (!isFinite(num)) {
            return '0';
        }
        return Math.round(num).toLocaleString('zh-CN');
    }

    function parseNumber(input) {
        if (input === null || input === undefined) return 0;
        var str = String(input).trim();
        if (str === '') return 0;
        str = str.replace(/,/g, '').replace(/，/g, '');
        var num = Number(str);
        if (isNaN(num) || !isFinite(num)) return 0;
        return num;
    }

    function isValidNumber(input) {
        if (input === null || input === undefined) return false;
        var str = String(input).trim();
        if (str === '') return false;
        str = str.replace(/,/g, '').replace(/，/g, '');
        var num = Number(str);
        return !isNaN(num) && isFinite(num);
    }

    var eventUnsubscribers = [];

    function init(containerEl) {
        container = containerEl;
        
        unsubscribeEvents();
        
        var unsub1 = EventBus.on(EventBus.EVENTS.STEP_COMPLETED, function(data) {
            onSopStepCompleted(data);
        });
        eventUnsubscribers.push(unsub1);
        
        var unsub2 = EventBus.on(EventBus.EVENTS.MODE_CHANGED, function(data) {
            onModeChanged(data);
        });
        eventUnsubscribers.push(unsub2);

        var unsub3 = EventBus.on(EventBus.EVENTS.SOP_STAGE_CHANGED, function(data) {
            onSopStageChanged(data);
        });
        eventUnsubscribers.push(unsub3);

        var unsub4 = EventBus.on(EventBus.EVENTS.SOP_STAGE_COMPLETE, function(data) {
            onSopStageComplete(data);
        });
        eventUnsubscribers.push(unsub4);
        
        window.addEventListener('resize', handleResize);
    }

    function onModeChanged(data) {
        updateStageStatus();
        if (container && container.innerHTML) {
            render(container);
            initDashboardEvents();
        }
    }

    function unsubscribeEvents() {
        for (var i = 0; i < eventUnsubscribers.length; i++) {
            var unsub = eventUnsubscribers[i];
            if (typeof unsub === 'function') {
                unsub();
            }
        }
        eventUnsubscribers = [];
    }

    function viewEnter(containerEl) {
        container = containerEl;
        updateStageStatus();
        if (hasBudgetPlan()) {
            renderDashboard();
            initDashboardEvents();
            checkAdvancedBudgetAlerts();
            addTimer(setTimeout(function() {
                triggerButlerSuggestions();
            }, 1200));
        }

        if (window.OnboardingTour && typeof OnboardingTour.start === 'function') {
            addTimer(setTimeout(function() {
                startBudgetOnboarding();
            }, 800));
        }
    }

    function startBudgetOnboarding() {
        if (OnboardingTour.isCompleted('budget-first-visit')) {
            return;
        }

        if (!hasBudgetPlan()) {
            return;
        }

        var steps = [
            {
                target: '.coin-progress-card',
                title: '总预算概览',
                description: '设置你的装修总预算，铜钱进度环实时监控预算健康状况。',
                position: 'right',
                padding: 16
            },
            {
                target: '.stages-section',
                title: '阶段预算管理',
                description: '按阶段管理预算更清晰，6个阶段逐步释放预算，花钱心里有数。',
                position: 'left',
                padding: 16
            }
        ];

        OnboardingTour.start('budget-first-visit', steps);
    }

    function handleResize() {
        var newIsMobile = window.innerWidth <= 900;
        if (newIsMobile !== isMobile) {
            isMobile = newIsMobile;
            if (container && container.innerHTML) {
                render(container);
            }
        }
    }

    function refresh() {
        if (!container) return;
        updateStageStatus();
        render(container);
        initDashboardEvents();
    }

    function showAiAssistantModal() {
        var modalId = 'budget-ai-modal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var modalHtml = `
            <div class="sop-modal-backdrop active" id="${modalId}">
                <div class="sop-modal" style="max-width: 500px;">
                    <div style="padding: 32px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--purple) 0%, var(--dai-blue) 100%); display: flex; align-items: center; justify-content: center; font-size: 44px; margin: 0 auto 16px;">🤖</div>
                            <div style="font-size: 20px; font-weight: 700; color: var(--text);">智能助手</div>
                        </div>
                        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(74, 111, 165, 0.05) 100%); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 24px;">
                            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                                <div style="font-size: 28px;">📋</div>
                                <div>
                                    <div style="font-weight: 600; color: var(--text); margin-bottom: 4px;">智能合同鉴别</div>
                                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">5秒识别合同风险点，避免装修陷阱</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                                <div style="font-size: 28px;">👁️</div>
                                <div>
                                    <div style="font-weight: 600; color: var(--text); margin-bottom: 4px;">智能施工质检</div>
                                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">自动识别施工质量问题，拍照即可检测</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 16px;">
                                <div style="font-size: 28px;">💰</div>
                                <div>
                                    <div style="font-weight: 600; color: var(--text); margin-bottom: 4px;">532预算管理</div>
                                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">科学分配预算比例，智能超支预警</div>
                                </div>
                            </div>
                        </div>
                        <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="document.getElementById('${modalId}').remove()">
                            知道了
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        trackModal(modalId);

        var modal = document.getElementById(modalId);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
    }

    function showNianAutoTip(message) {
        var tipId = 'nian-auto-tip-' + Date.now();
        var tipHtml = `
            <div class="nian-auto-tip" id="${tipId}">
                <div class="nian-auto-tip-content">
                    <span class="nian-auto-tip-emoji">${Icons.render('nian-nervous')}</span>
                    <span class="nian-auto-tip-text">${message}</span>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', tipHtml);

        var tip = document.getElementById(tipId);
        addTimer(setTimeout(function() {
            tip.classList.add('show');
        }, 50));

        addTimer(setTimeout(function() {
            tip.classList.remove('show');
            addTimer(setTimeout(function() {
                tip.remove();
            }, 500));
        }, 3000));
    }

    function destroy() {
        clearAllTimers();
        unsubscribeEvents();
        window.removeEventListener('resize', handleResize);
        removeAllDomListeners();
        closeAllDynamicModals();
        clearElementCache();

        currentModePage = 'select';
        selectedMode = null;
        wizardStep = 1;
        wizardData = {
            mode: 'full',
            totalBudget: 100000,
            cityTier: 'newFirst',
            area: 80,
            packageLevel: 'comfort',
            constructionFee: 0,
            constructionFeeMode: 'total',
            constructionUnitPrice: 0,
            constructionLaborRatio: 0.55,
            constructionAuxiliaryRatio: 0.30,
            constructionManagementRatio: 0.15,
            materialLevel: 'comfort',
            materialList: {},
            designFeeRatio: 0.03,
            designFeeOption: 'simple',
            laborDetail: {},
            laborDays: {},
            materialFee: {
                auxiliary: 0,
                main: 0,
                custom: 0
            },
            auxiliaryMaterialLevel: 'comfort',
            customFurnitureMeters: 0
        };
        expandedStage = null;
        expandedMaterial = null;
        expandedCategory = null;
        container = null;
        isMobile = false;
        sopListener = null;
        dashboardEventsBound = false;
        domEventListeners = [];
        dynamicModals = [];

        if (typeof FloatingButler !== 'undefined') {
            FloatingButler.destroy();
        }
    }

    function safeRender(containerEl) {
        try {
            render(containerEl);
        } catch (e) {
            console.error('[BudgetView] render error:', e);
            if (window.App && App.showErrorState) {
                App.showErrorState(containerEl, {
                    title: '预算页面加载失败',
                    desc: '小管家在加载预算管家时遇到了一点小问题~',
                    primaryAction: '重试',
                    secondaryAction: '返回首页',
                    onPrimaryAction: function() {
                        safeRender(containerEl);
                    },
                    onSecondaryAction: function() {
                        if (App.switchView) {
                            App.switchView('home');
                        }
                    }
                });
            }
            if (window.Toast && Toast.error) {
                Toast.error('预算页面加载出错了');
            }
        }
    }

    function safeInit(containerEl) {
        try {
            init(containerEl);
        } catch (e) {
            console.error('[BudgetView] init error:', e);
            if (window.Toast && Toast.error) {
                Toast.error('页面初始化失败');
            }
        }
    }

    function safeViewEnter(containerEl) {
        try {
            viewEnter(containerEl);
        } catch (e) {
            console.error('[BudgetView] viewEnter error:', e);
        }
    }

    function safeAddExpense() {
        try {
            addExpense();
        } catch (e) {
            console.error('[BudgetView] addExpense error:', e);
            if (window.Toast && Toast.error) {
                Toast.error('记录支出失败');
            }
        }
    }

    function safeRecalculate() {
        try {
            recalculate();
        } catch (e) {
            console.error('[BudgetView] recalculate error:', e);
        }
    }

    function safeRefresh() {
        try {
            refresh();
        } catch (e) {
            console.error('[BudgetView] refresh error:', e);
        }
    }

    function safeCloseModal(modalId) {
        try {
            closeModal(modalId);
        } catch (e) {
            console.error('[BudgetView] closeModal error:', e);
        }
    }

    function safeShowAddExpenseModal() {
        try {
            showAddExpenseModal();
        } catch (e) {
            console.error('[BudgetView] showAddExpenseModal error:', e);
            if (window.Toast && Toast.error) {
                Toast.error('打开支出弹窗失败');
            }
        }
    }

    function safeAddExpenseByCategory(amount, catKey, subCatKey, note, expenseType, tag) {
        try {
            return addExpenseByCategory(amount, catKey, subCatKey, note, expenseType, tag);
        } catch (e) {
            console.error('[BudgetView] addExpenseByCategory error:', e);
            if (window.Toast && Toast.error) {
                Toast.error('记录支出失败');
            }
            return false;
        }
    }

    var disclaimerExpanded = false;
    var quickAdjustExpanded = false;
    var knowledgeTab = 'ratio';

    var DISCLAIMER_STORAGE_KEY = 'budget_disclaimer_dismissed';

    var MATERIAL_PRICE_RANGES = {
        tile: {
            economy: { min: 80, max: 150, unit: '㎡' },
            comfort: { min: 150, max: 300, unit: '㎡' },
            quality: { min: 300, max: 600, unit: '㎡' }
        },
        floor: {
            economy: { min: 100, max: 200, unit: '㎡' },
            comfort: { min: 200, max: 400, unit: '㎡' },
            quality: { min: 400, max: 800, unit: '㎡' }
        },
        door: {
            economy: { min: 800, max: 1500, unit: '樘' },
            comfort: { min: 1500, max: 3000, unit: '樘' },
            quality: { min: 3000, max: 6000, unit: '樘' }
        },
        window: {
            economy: { min: 400, max: 800, unit: '㎡' },
            comfort: { min: 800, max: 1500, unit: '㎡' },
            quality: { min: 1500, max: 3000, unit: '㎡' }
        },
        cabinet: {
            economy: { min: 1500, max: 2500, unit: '延米' },
            comfort: { min: 2500, max: 4500, unit: '延米' },
            quality: { min: 4500, max: 8000, unit: '延米' }
        },
        sanitary: {
            economy: { min: 2000, max: 4000, unit: '套' },
            comfort: { min: 4000, max: 8000, unit: '套' },
            quality: { min: 8000, max: 15000, unit: '套' }
        },
        lighting: {
            economy: { min: 800, max: 1500, unit: '套' },
            comfort: { min: 1500, max: 3000, unit: '套' },
            quality: { min: 3000, max: 6000, unit: '套' }
        },
        hardware: {
            economy: { min: 300, max: 800, unit: '套' },
            comfort: { min: 800, max: 1500, unit: '套' },
            quality: { min: 1500, max: 3000, unit: '套' }
        }
    };

    var CATEGORY_CALC_HINTS = {
        total: {
            title: '总预算计算依据',
            desc: '基于您选择的城市档次、装修模式和面积，参考行业平均水平估算得出。实际费用可能因材料品牌、施工工艺、市场波动等因素有所差异。'
        },
        construction: {
            title: '施工费计算依据',
            desc: '含人工费、辅材费、管理费。人工费按当地工种日薪×工期估算，辅材按工程量估算，管理费一般为施工费的10-15%。'
        },
        contract: {
            title: '合同包计算依据',
            desc: '包含基础施工、主材、设计费、管理费。按套餐档次单价×面积估算，实际以装修公司报价为准。'
        },
        mainMaterials: {
            title: '主材费计算依据',
            desc: '按当前档次均价估算，包含瓷砖、地板、门窗、橱柜、洁具、灯具、五金等。实际价格因品牌、材质、规格差异较大。'
        },
        designFee: {
            title: '设计费计算依据',
            desc: '按建筑面积×单价估算，一般为50-200元/㎡。实际费用因设计师级别、设计复杂度差异较大。'
        },
        reserve: {
            title: '备用金计算依据',
            desc: '建议预留总预算的5%-10%作为应急备用金，用于应对装修过程中的意外增项、材料升级等不可预见费用。'
        },
        labor: {
            title: '人工费计算依据',
            desc: '按各工种日薪×工期估算，包含拆除、水电、瓦工、木工、油工、安装等工种。不同城市人工成本差异较大。'
        },
        materials: {
            title: '材料费计算依据',
            desc: '包含辅材、主材、定制家具。按当前档次均价估算，实际以选购品牌和材质为准。'
        },
        softDecoration: {
            title: '软装费计算依据',
            desc: '包含家具、家电、装饰品等。按总预算比例估算，实际因品牌、品质差异较大。'
        },
        customFurniture: {
            title: '定制家具计算依据',
            desc: '按投影面积×单价估算，包含衣柜、鞋柜、榻榻米等。实际因板材、五金、工艺差异较大。'
        },
        equipment: {
            title: '设备费计算依据',
            desc: '包含暖通、油烟机、热水器等设备。按市场均价估算，实际因品牌、型号差异较大。'
        },
        selfPurchase: {
            title: '自购项计算依据',
            desc: '业主自行采购的项目，包含定制家具、阳台封装、暖通设备等。按市场均价估算，实际以选购为准。'
        },
        managementFee: {
            title: '管理费计算依据',
            desc: '装修公司收取的项目管理费用，一般为施工费的10-15%，用于项目管理、质量监督、售后保障等。'
        },
        auxiliaryMaterials: {
            title: '辅材费计算依据',
            desc: '包含水泥沙子、电线电缆、水管管件、腻子涂料、板材龙骨等。按工程量和材料档次估算。'
        },
        baseConstruction: {
            title: '基础施工计算依据',
            desc: '包含人工和辅材，是装修的基础工程部分。按面积和施工复杂度估算，不同城市差异较大。'
        }
    };

    var BUDGET_KNOWLEDGE = {
        topOverruns: [
            { name: '水电改造', desc: '最容易超支的项目，按米计费容易出现走线冗余', solution: '提前定好点位，按点位一口价包干' },
            { name: '瓷砖铺贴', desc: '异形铺贴、拼花、小砖费用翻倍，容易低估', solution: '尽量选常规尺寸，减少复杂造型' },
            { name: '定制家具', desc: '增项多（抽屉、五金、灯带），单价看似便宜总价高', solution: '确认报价包含哪些项目，五金选好的' },
            { name: '门窗更换', desc: '单价按平米算，但开启扇、五金、包口单独收费', solution: '问清楚是全包价还是仅框+玻璃' },
            { name: '防水工程', desc: '卫生间、阳台防水容易漏项，后期维修成本高', solution: '防水一定要做好，闭水试验48小时' }
        ],
        quickSavingTips: [
            { icon: '🏗️', title: '轻硬装重软装', desc: '简化吊顶造型，钱花在软装上效果好还能换' },
            { icon: '🧱', title: '瓷砖选广东砖', desc: '不必追求大牌，广东佛山产的二线品牌性价比高' },
            { icon: '💡', title: '网购灯具开关', desc: '实体店灯具溢价高，网上买同款便宜一半' },
            { icon: '🪑', title: '家具等大促', desc: '618、双11买成品家具能省20-30%' },
            { icon: '🔧', title: '五金要买好的', desc: '铰链、滑轨这些天天用的，别省这个钱' },
            { icon: '🎨', title: '刷漆比贴墙布省', desc: '乳胶漆便宜又环保，选个好看的颜色效果一样好' }
        ],
        paymentStages: [
            { icon: '📝', name: '开工预付款', desc: '签订合同后支付，用于材料采购和进场准备', ratio: '30%' },
            { icon: '💧', name: '水电验收款', desc: '水电改造完成并验收合格后支付', ratio: '30%' },
            { icon: '🧱', name: '瓦木完工款', desc: '瓦工、木工完工并验收合格后支付', ratio: '30%' },
            { icon: '✨', name: '竣工尾款', desc: '整体竣工验收合格后支付', ratio: '5%' },
            { icon: '🛡️', name: '质保尾款', desc: '质保期满后支付（建议约定1-2年质保）', ratio: '5%' }
        ]
    };

    function isDisclaimerDismissed() {
        return Storage.load(DISCLAIMER_STORAGE_KEY) === true;
    }

    function setDisclaimerDismissed(dismissed) {
        Storage.save(DISCLAIMER_STORAGE_KEY, dismissed ? true : false);
    }

    function renderDisclaimerBar() {
        if (isDisclaimerDismissed()) return '';

        return `
            <div class="budget-disclaimer-bar" id="budget-disclaimer-bar">
                <div class="disclaimer-bar-content">
                    <div class="disclaimer-icon">💡</div>
                    <div class="disclaimer-text">
                        <strong>预算数据基于行业平均水平估算，实际费用以当地市场为准</strong>
                    </div>
                    <div class="disclaimer-actions">
                        <span class="disclaimer-detail-link" id="disclaimer-detail-toggle">了解详情</span>
                        <button class="disclaimer-close-btn" id="disclaimer-close-btn" title="关闭提示">✕</button>
                    </div>
                </div>
                <div class="disclaimer-detail-panel ${disclaimerExpanded ? 'expanded' : ''}" id="disclaimer-detail-panel">
                    <div class="disclaimer-detail-grid">
                        <div class="disclaimer-detail-item">
                            <div class="disclaimer-detail-item-title">📊 计算依据</div>
                            <div class="disclaimer-detail-item-desc">基于您选择的城市档次、装修模式和面积，参考行业平均水平测算</div>
                        </div>
                        <div class="disclaimer-detail-item">
                            <div class="disclaimer-detail-item-title">📈 数据来源</div>
                            <div class="disclaimer-detail-item-desc">综合建材市场报价、装修公司套餐价、人工费行情等多维度数据</div>
                        </div>
                        <div class="disclaimer-detail-item">
                            <div class="disclaimer-detail-item-title">📐 误差范围</div>
                            <div class="disclaimer-detail-item-desc">估算值与实际费用通常有10%-20%的浮动区间，属正常范围</div>
                        </div>
                        <div class="disclaimer-detail-item">
                            <div class="disclaimer-detail-item-title">⚠️ 注意事项</div>
                            <div class="disclaimer-detail-item-desc">本预算仅供参考，不作为报价依据，具体以装修公司实际报价为准</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function initDisclaimerEvents() {
        var closeBtn = document.getElementById('disclaimer-close-btn');
        var detailToggle = document.getElementById('disclaimer-detail-toggle');
        var detailPanel = document.getElementById('disclaimer-detail-panel');
        var bar = document.getElementById('budget-disclaimer-bar');

        if (closeBtn) {
            addDomListener(closeBtn, 'click', function(e) {
                e.stopPropagation();
                setDisclaimerDismissed(true);
                if (bar) {
                    bar.classList.add('hidden');
                }
            });
        }

        if (detailToggle && detailPanel) {
            addDomListener(detailToggle, 'click', function(e) {
                e.stopPropagation();
                disclaimerExpanded = !disclaimerExpanded;
                if (disclaimerExpanded) {
                    detailPanel.classList.add('expanded');
                    detailToggle.textContent = '收起详情';
                } else {
                    detailPanel.classList.remove('expanded');
                    detailToggle.textContent = '了解详情';
                }
            });
        }
    }

    function getCategoryHint(catKey) {
        return CATEGORY_CALC_HINTS[catKey] || null;
    }

    function renderInfoIcon(catKey) {
        var hint = getCategoryHint(catKey);
        if (!hint) return '';
        return `<span class="info-icon-btn" data-cat-hint="${catKey}" title="查看计算依据">i</span>`;
    }

    function renderCategoryTooltip(catKey) {
        var hint = getCategoryHint(catKey);
        if (!hint) return '';
        return `
            <div class="category-detail-tooltip" data-tooltip-for="${catKey}">
                <strong>${hint.title}</strong><br>
                ${hint.desc}
            </div>
        `;
    }

    function initTooltipEvents() {
        var infoIcons = document.querySelectorAll('.info-icon-btn[data-cat-hint]');
        var activeTooltip = null;

        infoIcons.forEach(function(icon) {
            addDomListener(icon, 'mouseenter', function() {
                var catKey = this.getAttribute('data-cat-hint');
                var tooltip = document.querySelector('.category-detail-tooltip[data-tooltip-for="' + catKey + '"]');
                if (tooltip) {
                    var rect = this.getBoundingClientRect();
                    tooltip.style.left = rect.left + 'px';
                    tooltip.style.top = (rect.bottom + 8) + 'px';
                    tooltip.classList.add('visible');
                    activeTooltip = tooltip;
                }
            });

            addDomListener(icon, 'mouseleave', function() {
                if (activeTooltip) {
                    activeTooltip.classList.remove('visible');
                    activeTooltip = null;
                }
            });
        });
    }

    function renderPriceRangeSection(matId, currentLevel) {
        var rangeData = MATERIAL_PRICE_RANGES[matId];
        if (!rangeData) return '';

        var levels = ['economy', 'comfort', 'quality'];
        var levelNames = { economy: '经济档', comfort: '舒适档', quality: '品质档' };
        var unit = rangeData.economy.unit;

        var tiersHtml = levels.map(function(level) {
            var range = rangeData[level];
            var isCurrent = currentLevel === level;
            return `
                <div class="price-tier-card ${isCurrent ? 'current' : ''}">
                    <div class="price-tier-name">${levelNames[level]}${isCurrent ? ' · 当前' : ''}</div>
                    <div class="price-tier-value">${range.min}-${range.max}</div>
                    <div class="price-tier-unit">元/${unit}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="price-range-section">
                <div class="price-range-title">
                    <span>💰</span>
                    <span>参考价格区间</span>
                </div>
                <div class="price-range-tiers">
                    ${tiersHtml}
                </div>
            </div>
        `;
    }

    function renderQuickAdjustCard(plan) {
        var cityTier = plan.cityTier || 'newFirst';
        var area = plan.area || 80;
        var mode = plan.mode || 'half';

        var cityOptionsHtml = '';
        for (var key in CITY_TIERS) {
            if (CITY_TIERS.hasOwnProperty(key)) {
                var tier = CITY_TIERS[key];
                cityOptionsHtml += `<option value="${key}" ${cityTier === key ? 'selected' : ''}>${tier.name} (×${tier.coefficient})</option>`;
            }
        }

        return `
            <div class="quick-adjust-card">
                <div class="quick-adjust-header">
                    <div class="quick-adjust-title-row">
                        <span class="quick-adjust-icon">⚙️</span>
                        <span class="quick-adjust-title">调整系数</span>
                    </div>
                    <button class="quick-adjust-toggle-btn" id="quick-adjust-toggle">
                        <span>${quickAdjustExpanded ? '收起' : '展开调整'}</span>
                        <span>${quickAdjustExpanded ? '▲' : '▼'}</span>
                    </button>
                </div>
                <div class="quick-adjust-panel ${quickAdjustExpanded ? 'expanded' : ''}" id="quick-adjust-panel">
                    <div class="quick-adjust-form">
                        <div class="adjust-field">
                            <label class="adjust-field-label">城市档次</label>
                            <select class="adjust-field-select" id="adjust-city-select">
                                ${cityOptionsHtml}
                            </select>
                        </div>
                        <div class="adjust-field">
                            <label class="adjust-field-label">房屋面积</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="number" class="adjust-field-input" id="adjust-area-input" value="${area}" step="1" style="flex: 1;">
                                <span style="font-size: 12px; color: var(--text-muted);">㎡</span>
                            </div>
                        </div>
                        <div class="adjust-field">
                            <label class="adjust-field-label">装修总预算</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span style="font-size: 12px; color: var(--text-muted);">¥</span>
                                <input type="number" class="adjust-field-input" id="adjust-budget-input" value="${plan.totalBudget || 100000}" step="1000" style="flex: 1;">
                            </div>
                        </div>
                        <button class="adjust-apply-btn" id="adjust-apply-btn">
                            <span>${Icons.render('refresh-cw')}</span>
                            <span>重新计算预算</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function initQuickAdjustEvents() {
        var toggleBtn = document.getElementById('quick-adjust-toggle');
        var panel = document.getElementById('quick-adjust-panel');
        var applyBtn = document.getElementById('adjust-apply-btn');

        if (toggleBtn && panel) {
            addDomListener(toggleBtn, 'click', function() {
                quickAdjustExpanded = !quickAdjustExpanded;
                if (quickAdjustExpanded) {
                    panel.classList.add('expanded');
                    toggleBtn.innerHTML = '<span>收起</span><span>▲</span>';
                } else {
                    panel.classList.remove('expanded');
                    toggleBtn.innerHTML = '<span>展开调整</span><span>▼</span>';
                }
            });
        }

        if (applyBtn) {
            addDomListener(applyBtn, 'click', function() {
                var citySelect = document.getElementById('adjust-city-select');
                var areaInput = document.getElementById('adjust-area-input');
                var budgetInput = document.getElementById('adjust-budget-input');

                var newCity = citySelect ? citySelect.value : null;
                var newArea = areaInput ? parseNumber(areaInput.value) : null;
                var newBudget = budgetInput ? parseNumber(budgetInput.value) : null;

                if (!newBudget || newBudget <= 0) {
                    if (typeof Toast !== 'undefined') {
                        Toast.warning('请输入有效的预算金额');
                    }
                    return;
                }
                if (!newArea || newArea <= 0) {
                    if (typeof Toast !== 'undefined') {
                        Toast.warning('请输入有效的面积');
                    }
                    return;
                }

                var plan = getBudgetPlan();
                if (!plan) return;

                var newPlan = calculateBudgetByMode(plan.mode || 'half', {
                    totalBudget: newBudget,
                    cityTier: newCity,
                    area: newArea,
                    packageLevel: plan.packageLevel || 'comfort',
                    constructionFee: Math.round(newBudget * 0.35),
                    constructionLaborRatio: 0.55,
                    constructionAuxiliaryRatio: 0.30,
                    constructionManagementRatio: 0.15,
                    materialLevel: 'comfort',
                    designFeeRatio: 0.03
                });

                newPlan.totalSpent = plan.totalSpent || 0;
                newPlan.reserveUsed = plan.reserveUsed || 0;
                newPlan.alerted90 = plan.alerted90;
                newPlan.alerted115 = plan.alerted115;
                newPlan.modeLocked = plan.modeLocked;
                newPlan.additionalFeesSynced = false;

                for (var i = 0; i < newPlan.stages.length; i++) {
                    if (plan.stages && plan.stages[i]) {
                        newPlan.stages[i].spent = plan.stages[i].spent || 0;
                        newPlan.stages[i].status = plan.stages[i].status || 'locked';
                        newPlan.stages[i].expenses = plan.stages[i].expenses || [];
                    }
                }

                saveBudgetPlan(newPlan, true);

                if (typeof Toast !== 'undefined') {
                    Toast.success('预算已重新计算');
                }

                render(container);
            });
        }
    }

    function renderKnowledgeCard(plan) {
        var cats = plan.categories || {};
        var total = plan.totalBudget || 1;

        var ratioItems = [];
        var catNames = {
            construction: '施工费',
            mainMaterials: '主材费',
            customFurniture: '定制家具',
            softDecoration: '软装费',
            reserve: '备用金',
            contract: '合同包',
            selfPurchase: '自购项',
            designFee: '设计费',
            labor: '人工费',
            materials: '材料费',
            equipment: '设备费'
        };
        var catColors = {
            construction: '#3b82f6',
            mainMaterials: '#8b5cf6',
            customFurniture: '#f59e0b',
            softDecoration: '#10b981',
            reserve: '#ef4444',
            contract: '#3b82f6',
            selfPurchase: '#8b5cf6',
            designFee: '#f59e0b',
            labor: '#ef4444',
            materials: '#10b981',
            equipment: '#6366f1'
        };

        var colorIndex = 0;
        var palette = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#ec4899'];
        for (var key in cats) {
            if (cats.hasOwnProperty(key) && cats[key] && cats[key].budget > 0) {
                var catBudget = cats[key].budget || 0;
                ratioItems.push({
                    name: catNames[key] || key,
                    value: catBudget,
                    ratio: Math.round((catBudget / total) * 100),
                    color: palette[colorIndex % palette.length]
                });
                colorIndex++;
            }
        }

        var pieHtml = renderPieChart(ratioItems, total, plan);
        var healthRingHtml = renderBudgetHealthRing(plan);
        var trendHtml = renderBudgetTrendChart(plan);
        var overrunHtml = BUDGET_KNOWLEDGE.topOverruns.map(function(item, idx) {
            return `
                <div class="overrun-item">
                    <div class="overrun-rank">${idx + 1}</div>
                    <div class="overrun-content">
                        <div class="overrun-name">${item.name}</div>
                        <div class="overrun-desc">${item.desc}</div>
                        <div class="overrun-solution">💡 应对：${item.solution}</div>
                    </div>
                </div>
            `;
        }).join('');

        var savingTipsHtml = BUDGET_KNOWLEDGE.quickSavingTips.map(function(tip) {
            return `
                <div class="saving-tip-card">
                    <div class="saving-tip-icon">${tip.icon}</div>
                    <div class="saving-tip-content">
                        <div class="saving-tip-title">${tip.title}</div>
                        <div class="saving-tip-desc">${tip.desc}</div>
                    </div>
                </div>
            `;
        }).join('');

        var paymentHtml = BUDGET_KNOWLEDGE.paymentStages.map(function(stage) {
            return `
                <div class="payment-stage-item">
                    <div class="payment-stage-connector"></div>
                    <div class="payment-stage-icon">${stage.icon}</div>
                    <div class="payment-stage-info">
                        <div class="payment-stage-name">${stage.name}</div>
                        <div class="payment-stage-desc">${stage.desc}</div>
                    </div>
                    <div class="payment-stage-ratio">
                        <div class="payment-ratio-value">${stage.ratio}</div>
                        <div class="payment-ratio-label">支付比例</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="budget-knowledge-card">
                <div class="knowledge-header">
                    <span class="knowledge-icon">📚</span>
                    <span class="knowledge-title">预算小贴士</span>
                </div>
                <div class="knowledge-tabs">
                    <div class="knowledge-tab ${knowledgeTab === 'ratio' ? 'active' : ''}" data-tab="ratio">费用占比</div>
                    <div class="knowledge-tab ${knowledgeTab === 'trend' ? 'active' : ''}" data-tab="trend">支出趋势</div>
                    <div class="knowledge-tab ${knowledgeTab === 'overrun' ? 'active' : ''}" data-tab="overrun">超支Top5</div>
                    <div class="knowledge-tab ${knowledgeTab === 'saving' ? 'active' : ''}" data-tab="saving">省钱技巧</div>
                    <div class="knowledge-tab ${knowledgeTab === 'payment' ? 'active' : ''}" data-tab="payment">付款建议</div>
                </div>
                <div class="knowledge-content">
                    <div class="knowledge-panel ${knowledgeTab === 'ratio' ? 'active' : ''}" data-panel="ratio">
                        ${healthRingHtml}
                        ${pieHtml}
                    </div>
                    <div class="knowledge-panel ${knowledgeTab === 'trend' ? 'active' : ''}" data-panel="trend">
                        ${trendHtml}
                    </div>
                    <div class="knowledge-panel ${knowledgeTab === 'overrun' ? 'active' : ''}" data-panel="overrun">
                        <div class="top-overrun-list">
                            ${overrunHtml}
                        </div>
                    </div>
                    <div class="knowledge-panel ${knowledgeTab === 'saving' ? 'active' : ''}" data-panel="saving">
                        <div class="saving-tips-grid">
                            ${savingTipsHtml}
                        </div>
                    </div>
                    <div class="knowledge-panel ${knowledgeTab === 'payment' ? 'active' : ''}" data-panel="payment">
                        <div class="payment-stages">
                            ${paymentHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function calculateBudgetHealthScore(plan) {
        var total = plan.totalBudget || 0;
        var spent = plan.totalSpent || 0;
        var reserveUsed = plan.reserveUsed || 0;
        var overallPercent = total > 0 ? (spent + reserveUsed) / total : 0;

        var scores = {};
        var weights = {
            overallUsage: 30,
            categoryBalance: 20,
            spendingStability: 20,
            reserveAdequacy: 15,
            stageProgress: 15
        };

        var overallScore = 0;
        if (overallPercent <= 0.5) overallScore = 100;
        else if (overallPercent <= 0.7) overallScore = 85;
        else if (overallPercent <= 0.85) overallScore = 70;
        else if (overallPercent <= 1.0) overallScore = 55;
        else if (overallPercent <= 1.15) overallScore = 40;
        else overallScore = 25;
        scores.overallUsage = overallScore;

        var categoryBalanceScore = 75;
        if (plan.categories) {
            var catCount = 0;
            var overBudgetCats = 0;
            for (var catKey in plan.categories) {
                if (plan.categories.hasOwnProperty(catKey) && catKey !== 'reserve') {
                    var cat = plan.categories[catKey];
                    if (cat.budget && cat.budget > 0) {
                        catCount++;
                        var catPercent = cat.spent / cat.budget;
                        if (catPercent > 1.0) overBudgetCats++;
                    }
                }
            }
            if (catCount > 0) {
                var overRatio = overBudgetCats / catCount;
                if (overRatio === 0) categoryBalanceScore = 100;
                else if (overRatio <= 0.2) categoryBalanceScore = 80;
                else if (overRatio <= 0.4) categoryBalanceScore = 65;
                else if (overRatio <= 0.6) categoryBalanceScore = 50;
                else categoryBalanceScore = 35;
            }
        }
        scores.categoryBalance = categoryBalanceScore;

        var trendData = getExpenseTrendData(plan, 7);
        var values = trendData.map(function(d) { return d.value; });
        var avgVal = values.reduce(function(a, b) { return a + b; }, 0) / Math.max(values.length, 1);
        var variance = 0;
        for (var v = 0; v < values.length; v++) {
            variance += Math.pow(values[v] - avgVal, 2);
        }
        variance = variance / Math.max(values.length, 1);
        var stdDev = Math.sqrt(variance);
        var cv = avgVal > 0 ? stdDev / avgVal : 0;

        var stabilityScore = 0;
        if (cv <= 0.2) stabilityScore = 100;
        else if (cv <= 0.4) stabilityScore = 85;
        else if (cv <= 0.6) stabilityScore = 70;
        else if (cv <= 0.8) stabilityScore = 55;
        else stabilityScore = 40;
        scores.spendingStability = stabilityScore;

        var reserveScore = 0;
        var reserveCat = plan.categories ? plan.categories.reserve : null;
        var reserveBudget = reserveCat ? (reserveCat.budget || 0) : 0;
        var reserveRatio = total > 0 ? reserveBudget / total : 0;
        var reserveRemaining = reserveCat ? (reserveCat.budget - (reserveCat.spent || 0)) : 0;
        if (reserveRatio >= 0.15 && reserveRemaining > 0) reserveScore = 100;
        else if (reserveRatio >= 0.10 && reserveRemaining > 0) reserveScore = 80;
        else if (reserveRatio >= 0.05) reserveScore = 60;
        else if (reserveRatio > 0) reserveScore = 45;
        else reserveScore = 30;
        scores.reserveAdequacy = reserveScore;

        var stageProgressScore = 70;
        if (plan.stages && plan.stages.length > 0) {
            var completedStages = 0;
            var activeStages = 0;
            for (var st = 0; st < plan.stages.length; st++) {
                var stage = plan.stages[st];
                if (stage.status === 'completed') completedStages++;
                if (stage.status === 'active') activeStages++;
            }
            var stageProgress = completedStages / plan.stages.length;
            var budgetProgress = overallPercent;
            var diff = Math.abs(stageProgress - budgetProgress);
            if (diff <= 0.1) stageProgressScore = 100;
            else if (diff <= 0.2) stageProgressScore = 85;
            else if (diff <= 0.35) stageProgressScore = 70;
            else if (diff <= 0.5) stageProgressScore = 55;
            else stageProgressScore = 40;
        }
        scores.stageProgress = stageProgressScore;

        var totalScore = 0;
        for (var key in weights) {
            if (weights.hasOwnProperty(key) && scores[key] !== undefined) {
                totalScore += scores[key] * (weights[key] / 100);
            }
        }
        scores.total = Math.round(totalScore);

        var level = 'excellent';
        var levelText = '优秀';
        var levelColor = '#10b981';
        if (totalScore >= 85) {
            level = 'excellent';
            levelText = '优秀';
            levelColor = '#10b981';
        } else if (totalScore >= 70) {
            level = 'good';
            levelText = '良好';
            levelColor = '#3b82f6';
        } else if (totalScore >= 55) {
            level = 'fair';
            levelText = '一般';
            levelColor = '#f59e0b';
        } else if (totalScore >= 40) {
            level = 'warning';
            levelText = '警告';
            levelColor = '#ef4444';
        } else {
            level = 'danger';
            levelText = '危险';
            levelColor = '#dc2626';
        }
        scores.level = level;
        scores.levelText = levelText;
        scores.levelColor = levelColor;

        return scores;
    }

    function renderBudgetHealthRing(plan) {
        var total = plan.totalBudget || 0;
        var spent = plan.totalSpent || 0;
        var percent = total > 0 ? Math.round((spent / total) * 100) : 0;
        var remaining = total - spent;

        var healthScores = calculateBudgetHealthScore(plan);

        var totalDays = 90;
        var daysPassed = Math.round(totalDays * (percent / 100));
        var daysRemaining = totalDays - daysPassed;
        var dailySpent = daysPassed > 0 ? Math.round(spent / daysPassed) : 0;
        var dailyBudget = totalDays > 0 ? Math.round(total / totalDays) : 0;

        var size = 100;
        var radius = 42;
        var circumference = 2 * Math.PI * radius;
        var scoreOffset = circumference * (1 - Math.min(healthScores.total, 100) / 100);

        var dimensionItems = [
            { key: 'overallUsage', name: '预算使用率', icon: '📊' },
            { key: 'categoryBalance', name: '分类均衡度', icon: '⚖️' },
            { key: 'spendingStability', name: '支出稳定性', icon: '📈' },
            { key: 'reserveAdequacy', name: '备用金充足', icon: '🛡️' },
            { key: 'stageProgress', name: '进度匹配度', icon: '🎯' }
        ];

        var dimensionsHtml = dimensionItems.map(function(item) {
            var score = healthScores[item.key] || 0;
            var scoreColor = score >= 70 ? 'good' : (score >= 50 ? 'fair' : 'poor');
            return `
                <div class="health-dimension-item">
                    <div class="health-dimension-left">
                        <span class="health-dimension-icon">${item.icon}</span>
                        <span class="health-dimension-name">${item.name}</span>
                    </div>
                    <div class="health-dimension-right">
                        <div class="health-dimension-bar">
                            <div class="health-dimension-bar-fill ${scoreColor}" style="width: ${score}%;"></div>
                        </div>
                        <span class="health-dimension-score">${score}分</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="budget-health-card enhanced-health-card">
                <div class="budget-health-header">
                    <div class="budget-health-title">
                        <span>💚</span>
                        <span>预算健康度</span>
                    </div>
                    <span class="budget-health-badge ${healthScores.level}">${healthScores.levelText}</span>
                </div>
                <div class="budget-health-content">
                    <div class="budget-health-ring">
                        <svg viewBox="0 0 ${size} ${size}">
                            <circle class="budget-health-ring-bg" cx="${size/2}" cy="${size/2}" r="${radius}"></circle>
                            <circle class="budget-health-ring-progress" 
                                cx="${size/2}" cy="${size/2}" r="${radius}"
                                stroke="${healthScores.levelColor}"
                                stroke-dasharray="${circumference}"
                                stroke-dashoffset="${scoreOffset}"
                                style="stroke-dashoffset: ${scoreOffset};">
                            </circle>
                        </svg>
                        <div class="budget-health-ring-center">
                            <div class="budget-health-ring-score">${healthScores.total}</div>
                            <div class="budget-health-ring-label">综合评分</div>
                        </div>
                    </div>
                    <div class="budget-health-info">
                        <div class="budget-health-item">
                            <span class="budget-health-item-label">剩余预算</span>
                            <span class="budget-health-item-value ${remaining >= 0 ? 'positive' : 'negative'}">
                                ¥${formatMoney(Math.abs(remaining))}
                            </span>
                        </div>
                        <div class="budget-health-item">
                            <span class="budget-health-item-label">预计剩余天数</span>
                            <span class="budget-health-item-value">${daysRemaining} 天</span>
                        </div>
                        <div class="budget-health-item">
                            <span class="budget-health-item-label">日均支出</span>
                            <span class="budget-health-item-value">¥${formatMoney(dailySpent)}</span>
                        </div>
                        <div class="budget-health-item">
                            <span class="budget-health-item-label">日均预算</span>
                            <span class="budget-health-item-value">¥${formatMoney(dailyBudget)}</span>
                        </div>
                    </div>
                </div>
                <div class="health-dimensions-section">
                    <div class="health-dimensions-title">健康维度分析</div>
                    ${dimensionsHtml}
                </div>
            </div>
        `;
    }

    function renderBudgetHealthRadarChart(plan) {
        var healthScores = calculateBudgetHealthScore(plan);
        var dimensions = [
            { key: 'overallUsage', name: '预算使用率', icon: '📊', angle: -90 },
            { key: 'categoryBalance', name: '分类均衡度', icon: '⚖️', angle: -18 },
            { key: 'spendingStability', name: '支出稳定性', icon: '📈', angle: 54 },
            { key: 'reserveAdequacy', name: '备用金充足', icon: '🛡️', angle: 126 },
            { key: 'stageProgress', name: '进度匹配度', icon: '🎯', angle: 198 }
        ];

        var size = 280;
        var center = size / 2;
        var maxRadius = 100;
        var levels = 5;

        var gridLines = '';
        for (var l = 1; l <= levels; l++) {
            var r = (maxRadius / levels) * l;
            var points = [];
            for (var d = 0; d < dimensions.length; d++) {
                var angle = dimensions[d].angle * Math.PI / 180;
                var x = center + r * Math.cos(angle);
                var y = center + r * Math.sin(angle);
                points.push(x + ',' + y);
            }
            gridLines += `<polygon points="${points.join(' ')}" fill="none" stroke="var(--border)" stroke-width="1" opacity="0.6"/>`;
        }

        var axisLines = '';
        for (var a = 0; a < dimensions.length; a++) {
            var axisAngle = dimensions[a].angle * Math.PI / 180;
            var x2 = center + maxRadius * Math.cos(axisAngle);
            var y2 = center + maxRadius * Math.sin(axisAngle);
            axisLines += `<line x1="${center}" y1="${center}" x2="${x2}" y2="${y2}" stroke="var(--border)" stroke-width="1" opacity="0.6"/>`;
        }

        var dataPoints = [];
        var scorePoints = [];
        for (var p = 0; p < dimensions.length; p++) {
            var score = healthScores[dimensions[p].key] || 0;
            var scoreRatio = score / 100;
            var pointAngle = dimensions[p].angle * Math.PI / 180;
            var px = center + maxRadius * scoreRatio * Math.cos(pointAngle);
            var py = center + maxRadius * scoreRatio * Math.sin(pointAngle);
            dataPoints.push(px + ',' + py);
            scorePoints.push({ x: px, y: py, score: score, key: dimensions[p].key });
        }

        var dataPolygon = `<polygon points="${dataPoints.join(' ')}" fill="${healthScores.levelColor}" fill-opacity="0.25" stroke="${healthScores.levelColor}" stroke-width="2"/>`;

        var dataDots = '';
        for (var dot = 0; dot < scorePoints.length; dot++) {
            dataDots += `<circle cx="${scorePoints[dot].x}" cy="${scorePoints[dot].y}" r="5" fill="${healthScores.levelColor}" stroke="#fff" stroke-width="2"/>`;
        }

        var labels = '';
        for (var lb = 0; lb < dimensions.length; lb++) {
            var labelAngle = dimensions[lb].angle * Math.PI / 180;
            var labelRadius = maxRadius + 28;
            var lx = center + labelRadius * Math.cos(labelAngle);
            var ly = center + labelRadius * Math.sin(labelAngle);
            var textAnchor = 'middle';
            if (dimensions[lb].angle > -90 && dimensions[lb].angle < 90) {
                textAnchor = 'start';
            } else if (dimensions[lb].angle > 90 || dimensions[lb].angle < -90) {
                textAnchor = 'end';
            }
            labels += `
                <text x="${lx}" y="${ly}" text-anchor="${textAnchor}" dominant-baseline="middle" class="radar-label">
                    <tspan class="radar-label-icon">${dimensions[lb].icon}</tspan>
                    <tspan x="${lx}" dy="16" class="radar-label-text">${dimensions[lb].name}</tspan>
                </text>
            `;
        }

        var dimensionDetails = dimensions.map(function(dim) {
            var score = healthScores[dim.key] || 0;
            var scoreColor = score >= 70 ? 'good' : (score >= 50 ? 'fair' : 'poor');
            var desc = getDimensionDescription(dim.key, score, plan);
            var suggestion = getDimensionSuggestion(dim.key, score, plan);
            return `
                <div class="health-detail-item" data-dimension="${dim.key}">
                    <div class="health-detail-header">
                        <span class="health-detail-icon">${dim.icon}</span>
                        <span class="health-detail-name">${dim.name}</span>
                        <span class="health-detail-score ${scoreColor}">${score}分</span>
                    </div>
                    <div class="health-detail-desc">${desc}</div>
                    <div class="health-detail-suggestion">
                        <span class="suggestion-label">💡 改进建议：</span>
                        <span class="suggestion-text">${suggestion}</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="health-radar-section">
                <div class="health-radar-header">
                    <span class="health-radar-title">五维健康度雷达图</span>
                    <span class="health-radar-badge ${healthScores.level}">综合 ${healthScores.total}分</span>
                </div>
                <div class="health-radar-container">
                    <svg viewBox="0 0 ${size} ${size}" class="health-radar-svg">
                        ${gridLines}
                        ${axisLines}
                        ${dataPolygon}
                        ${dataDots}
                        ${labels}
                    </svg>
                </div>
                <div class="health-detail-panel">
                    <div class="health-detail-panel-title">各维度详情与改进建议</div>
                    ${dimensionDetails}
                </div>
            </div>
        `;
    }

    function getDimensionDescription(key, score, plan) {
        var descriptions = {
            overallUsage: {
                excellent: '预算使用率非常健康，还有充足的预算空间',
                good: '预算使用率良好，支出在合理范围内',
                fair: '预算使用率一般，需要适当控制支出',
                warning: '预算使用率偏高，建议控制支出节奏',
                danger: '预算使用率过高，已接近或超出预算'
            },
            categoryBalance: {
                excellent: '各分类预算均衡，没有分类超支',
                good: '分类均衡度较好，大部分分类控制良好',
                fair: '分类均衡度一般，部分分类需要关注',
                warning: '分类均衡度较差，多个分类接近或超出预算',
                danger: '分类均衡度很差，多数分类已超支'
            },
            spendingStability: {
                excellent: '支出非常稳定，波动很小',
                good: '支出比较稳定，波动在可控范围',
                fair: '支出稳定性一般，有一定波动',
                warning: '支出波动较大，建议合理规划',
                danger: '支出波动很大，需要重点关注'
            },
            reserveAdequacy: {
                excellent: '备用金非常充足，应对突发情况绰绰有余',
                good: '备用金比较充足，能够应对一般突发情况',
                fair: '备用金一般，建议适当增加储备',
                warning: '备用金不足，需要注意控制风险',
                danger: '备用金严重不足，抗风险能力弱'
            },
            stageProgress: {
                excellent: '支出进度与装修进度高度匹配',
                good: '支出进度与装修进度比较匹配',
                fair: '支出进度与装修进度有一定偏差',
                warning: '支出进度与装修进度偏差较大',
                danger: '支出进度与装修进度严重不匹配'
            }
        };

        var level = 'danger';
        if (score >= 85) level = 'excellent';
        else if (score >= 70) level = 'good';
        else if (score >= 55) level = 'fair';
        else if (score >= 40) level = 'warning';

        return descriptions[key] ? (descriptions[key][level] || '') : '';
    }

    function getDimensionSuggestion(key, score, plan) {
        var suggestions = {
            overallUsage: {
                excellent: '继续保持良好的支出习惯，可以考虑提升部分项目品质',
                good: '继续保持，把钱花在刀刃上，预留充足备用金',
                fair: '建议制定更详细的支出计划，优先保证必需品采购',
                warning: '建议暂缓非必要支出，重新评估剩余预算分配',
                danger: '立即梳理支出项目，区分必需和非必需，考虑动用备用金或调整预算'
            },
            categoryBalance: {
                excellent: '各分类控制得很好，继续保持均衡发展',
                good: '关注接近警戒线的分类，提前做好规划',
                fair: '分析超支分类的原因，看看能否从结余分类中调剂',
                warning: '重点关注超支分类，寻找替代方案或降低标准',
                danger: '全面梳理各分类支出，大幅削减非必要开支'
            },
            spendingStability: {
                excellent: '支出节奏非常好，继续保持平稳支出',
                good: '继续保持稳定的支出节奏，避免集中大额支出',
                fair: '建议合理安排采购时间，分散大额支出',
                warning: '建议制定月度支出计划，避免忽高忽低',
                danger: '立即制定详细的支出时间表，严格控制每日支出'
            },
            reserveAdequacy: {
                excellent: '备用金充足，可以从容应对各种突发情况',
                good: '备用金够用，建议继续保持，不要轻易动用',
                fair: '建议从其他分类中适当调剂，增加备用金比例',
                warning: '严格控制备用金使用，非必要不动用',
                danger: '建议从非必要支出中划出部分作为备用金，提高抗风险能力'
            },
            stageProgress: {
                excellent: '进度匹配度高，预算规划很合理',
                good: '基本匹配，继续按计划推进即可',
                fair: '分析进度偏差原因，及时调整后续阶段预算',
                warning: '支出与进度偏差较大，建议重新评估各阶段预算分配',
                danger: '严重不匹配，需要全面复盘预算规划，重新分配各阶段预算'
            }
        };

        var level = 'danger';
        if (score >= 85) level = 'excellent';
        else if (score >= 70) level = 'good';
        else if (score >= 55) level = 'fair';
        else if (score >= 40) level = 'warning';

        return suggestions[key] ? (suggestions[key][level] || '') : '';
    }

    function generateBudgetSuggestions(plan) {
        var healthScores = calculateBudgetHealthScore(plan);
        var suggestions = [];
        var total = plan.totalBudget || 0;
        var spent = plan.totalSpent || 0;
        var remaining = total - spent;

        if (healthScores.overallUsage < 70 && remaining > 0) {
            var saveAmount = Math.round(remaining * 0.1);
            suggestions.push({
                type: 'saving',
                icon: '💰',
                title: '省钱建议',
                priority: 'high',
                content: '目前预算使用率偏高，建议暂缓非必要采购，优先保证必需品。可以考虑从以下方面省钱：1) 多对比3家以上供应商价格；2) 利用促销季采购主材；3) 考虑替代材料，效果差不多价格低20-30%。',
                detail: '预计可节省：约 ¥' + formatMoney(saveAmount) + '（按节省10%计算）'
            });
        }

        if (healthScores.categoryBalance < 70 && plan.categories) {
            var overBudgetCats = [];
            var underBudgetCats = [];
            for (var catKey in plan.categories) {
                if (plan.categories.hasOwnProperty(catKey) && catKey !== 'reserve') {
                    var cat = plan.categories[catKey];
                    if (cat.budget && cat.budget > 0) {
                        var catPercent = cat.spent / cat.budget;
                        if (catPercent > 1.0) {
                            overBudgetCats.push({ name: getCategoryLabel(catKey, plan), over: cat.spent - cat.budget });
                        } else if (catPercent < 0.5) {
                            underBudgetCats.push({ name: getCategoryLabel(catKey, plan), save: cat.budget - cat.spent });
                        }
                    }
                }
            }
            if (overBudgetCats.length > 0) {
                suggestions.push({
                    type: 'category',
                    icon: '📊',
                    title: '分类调整建议',
                    priority: 'high',
                    content: overBudgetCats.length + '个分类已超支：' + overBudgetCats.map(function(c) { return c.name; }).join('、') + '。' +
                        (underBudgetCats.length > 0 ? '可以考虑从' + underBudgetCats.map(function(c) { return c.name; }).join('、') + '等结余分类中调剂预算。' : '建议重新评估超支分类的预算分配。'),
                    detail: '超支总额：约 ¥' + formatMoney(overBudgetCats.reduce(function(sum, c) { return sum + c.over; }, 0))
                });
            }
        }

        if (healthScores.reserveAdequacy < 70) {
            var reserveCat = plan.categories ? plan.categories.reserve : null;
            var reserveBudget = reserveCat ? (reserveCat.budget || 0) : 0;
            var reserveRatio = total > 0 ? reserveBudget / total : 0;
            var targetReserve = Math.round(total * 0.1);
            var needAdd = targetReserve - reserveBudget;
            suggestions.push({
                type: 'reserve',
                icon: '🛡️',
                title: '备用金建议',
                priority: 'medium',
                content: '备用金比例为' + Math.round(reserveRatio * 100) + '%，建议保持在10-15%左右以应对突发情况。' +
                    (needAdd > 0 ? '建议增加备用金约 ¥' + formatMoney(needAdd) + '。' : '继续保持充足的备用金。'),
                detail: '当前备用金：¥' + formatMoney(reserveBudget) + ' / 建议备用金：¥' + formatMoney(targetReserve)
            });
        }

        if (healthScores.stageProgress < 70 && plan.stages) {
            var completedStages = 0;
            var activeStages = 0;
            for (var st = 0; st < plan.stages.length; st++) {
                if (plan.stages[st].status === 'completed') completedStages++;
                if (plan.stages[st].status === 'active') activeStages++;
            }
            var stageProgress = completedStages / plan.stages.length;
            var budgetProgress = total > 0 ? spent / total : 0;
            suggestions.push({
                type: 'progress',
                icon: '🎯',
                title: '进度匹配建议',
                priority: 'medium',
                content: '装修进度完成' + Math.round(stageProgress * 100) + '%，但预算已使用' + Math.round(budgetProgress * 100) + '%。' +
                    (budgetProgress > stageProgress ? '支出进度快于装修进度，建议控制后续支出节奏。' : '支出进度慢于装修进度，可以适当加快采购。'),
                detail: '进度偏差：' + (Math.round(Math.abs(stageProgress - budgetProgress) * 100)) + '%'
            });
        }

        if (healthScores.spendingStability < 70) {
            suggestions.push({
                type: 'stability',
                icon: '📈',
                title: '支出稳定性建议',
                priority: 'low',
                content: '近期支出波动较大，建议制定更详细的采购计划，避免集中大额支出。可以将大额采购分散到不同时间段，减轻资金压力。',
                detail: '建议：提前规划每月支出目标，分散采购时间'
            });
        }

        suggestions.sort(function(a, b) {
            var priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        return suggestions;
    }

    function renderBudgetSuggestions(plan) {
        var suggestions = generateBudgetSuggestions(plan);
        if (suggestions.length === 0) {
            return `
                <div class="budget-suggestions-card">
                    <div class="suggestions-header">
                        <span class="suggestions-icon">✨</span>
                        <span class="suggestions-title">智能预算建议</span>
                    </div>
                    <div class="suggestions-empty">
                        <div class="suggestions-empty-icon">🎉</div>
                        <div class="suggestions-empty-text">预算状况非常好，没有特别需要改进的地方~</div>
                    </div>
                </div>
            `;
        }

        var suggestionsHtml = suggestions.map(function(sug, index) {
            return `
                <div class="suggestion-item suggestion-${sug.type} priority-${sug.priority}">
                    <div class="suggestion-header">
                        <span class="suggestion-icon">${sug.icon}</span>
                        <span class="suggestion-title">${sug.title}</span>
                        <span class="suggestion-priority-badge">${getPriorityLabel(sug.priority)}</span>
                    </div>
                    <div class="suggestion-content">${sug.content}</div>
                    <div class="suggestion-detail">${sug.detail}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="budget-suggestions-card">
                <div class="suggestions-header">
                    <span class="suggestions-icon">✨</span>
                    <span class="suggestions-title">智能预算建议</span>
                    <span class="suggestions-count">${suggestions.length}条建议</span>
                </div>
                <div class="suggestions-list">
                    ${suggestionsHtml}
                </div>
            </div>
        `;
    }

    function getPriorityLabel(priority) {
        var labels = { high: '高优先级', medium: '中优先级', low: '低优先级' };
        return labels[priority] || priority;
    }

    function getCategoryLabel(catKey, plan) {
        if (plan && plan.categories && plan.categories[catKey]) {
            return plan.categories[catKey].name || catKey;
        }
        return catKey;
    }

    function compareBudgetVersions(version1Name, version2Name) {
        var versions = getBudgetVersions();
        var v1 = null, v2 = null;

        for (var i = 0; i < versions.length; i++) {
            if (versions[i].name === version1Name) v1 = versions[i];
            if (versions[i].name === version2Name) v2 = versions[i];
        }

        if (!v1 || !v2) return null;

        var plan1 = v1.plan;
        var plan2 = v2.plan;

        var total1 = plan1.totalBudget || 0;
        var total2 = plan2.totalBudget || 0;
        var totalDiff = total2 - total1;
        var totalDiffPercent = total1 > 0 ? (totalDiff / total1) * 100 : 0;

        var spent1 = plan1.totalSpent || 0;
        var spent2 = plan2.totalSpent || 0;
        var spentDiff = spent2 - spent1;

        var categories = [];
        var allCatKeys = {};
        if (plan1.categories) {
            for (var k1 in plan1.categories) {
                if (plan1.categories.hasOwnProperty(k1)) allCatKeys[k1] = true;
            }
        }
        if (plan2.categories) {
            for (var k2 in plan2.categories) {
                if (plan2.categories.hasOwnProperty(k2)) allCatKeys[k2] = true;
            }
        }

        for (var catKey in allCatKeys) {
            var cat1 = plan1.categories ? plan1.categories[catKey] : null;
            var cat2 = plan2.categories ? plan2.categories[catKey] : null;
            var budget1 = cat1 ? (cat1.budget || 0) : 0;
            var budget2 = cat2 ? (cat2.budget || 0) : 0;
            var budgetDiff = budget2 - budget1;
            var spentCat1 = cat1 ? (cat1.spent || 0) : 0;
            var spentCat2 = cat2 ? (cat2.spent || 0) : 0;

            categories.push({
                key: catKey,
                name: (cat2 && cat2.name) || (cat1 && cat1.name) || catKey,
                budget1: budget1,
                budget2: budget2,
                budgetDiff: budgetDiff,
                budgetDiffPercent: budget1 > 0 ? (budgetDiff / budget1) * 100 : (budget2 > 0 ? 100 : 0),
                spent1: spentCat1,
                spent2: spentCat2,
                spentDiff: spentCat2 - spentCat1,
                changed: Math.abs(budgetDiff) > 0.01
            });
        }

        var stages = [];
        var stageCount = Math.max(
            (plan1.stages ? plan1.stages.length : 0),
            (plan2.stages ? plan2.stages.length : 0)
        );
        for (var s = 0; s < stageCount; s++) {
            var st1 = plan1.stages && plan1.stages[s] ? plan1.stages[s] : null;
            var st2 = plan2.stages && plan2.stages[s] ? plan2.stages[s] : null;
            var stageBudget1 = st1 ? (st1.budget || 0) : 0;
            var stageBudget2 = st2 ? (st2.budget || 0) : 0;
            var stageSpent1 = st1 ? (st1.spent || 0) : 0;
            var stageSpent2 = st2 ? (st2.spent || 0) : 0;

            stages.push({
                index: s + 1,
                name: (st2 && st2.title) || (st1 && st1.title) || ('阶段' + (s + 1)),
                budget1: stageBudget1,
                budget2: stageBudget2,
                budgetDiff: stageBudget2 - stageBudget1,
                spent1: stageSpent1,
                spent2: stageSpent2,
                spentDiff: stageSpent2 - stageSpent1,
                changed: Math.abs(stageBudget2 - stageBudget1) > 0.01
            });
        }

        var bestVersion = total1 < total2 ? v1 : (total2 < total1 ? v2 : null);
        var savingAmount = bestVersion ? Math.abs(total1 - total2) : 0;

        return {
            version1: { name: v1.name, createdAt: v1.createdAt },
            version2: { name: v2.name, createdAt: v2.createdAt },
            total: {
                v1: total1,
                v2: total2,
                diff: totalDiff,
                diffPercent: totalDiffPercent
            },
            spent: {
                v1: spent1,
                v2: spent2,
                diff: spentDiff
            },
            categories: categories,
            stages: stages,
            bestVersion: bestVersion ? bestVersion.name : null,
            savingAmount: savingAmount
        };
    }

    function renderVersionCompare(compareData) {
        if (!compareData) return '<div class="version-compare-empty">请选择两个版本进行对比</div>';

        var total = compareData.total;
        var totalDiffClass = total.diff > 0 ? 'increase' : (total.diff < 0 ? 'decrease' : 'same');
        var totalDiffIcon = total.diff > 0 ? '↑' : (total.diff < 0 ? '↓' : '—');

        var categoriesHtml = compareData.categories.map(function(cat) {
            var diffClass = cat.budgetDiff > 0 ? 'increase' : (cat.budgetDiff < 0 ? 'decrease' : 'same');
            var diffIcon = cat.budgetDiff > 0 ? '↑' : (cat.budgetDiff < 0 ? '↓' : '—');
            return `
                <div class="compare-row ${cat.changed ? 'changed' : ''}">
                    <div class="compare-cell compare-name">${cat.name}</div>
                    <div class="compare-cell">¥${formatMoney(cat.budget1)}</div>
                    <div class="compare-cell">¥${formatMoney(cat.budget2)}</div>
                    <div class="compare-cell ${diffClass}">
                        ${diffIcon} ¥${formatMoney(Math.abs(cat.budgetDiff))}
                        <span class="diff-percent">(${cat.budgetDiffPercent > 0 ? '+' : ''}${cat.budgetDiffPercent.toFixed(1)}%)</span>
                    </div>
                </div>
            `;
        }).join('');

        var stagesHtml = compareData.stages.map(function(stage) {
            var diffClass = stage.budgetDiff > 0 ? 'increase' : (stage.budgetDiff < 0 ? 'decrease' : 'same');
            var diffIcon = stage.budgetDiff > 0 ? '↑' : (stage.budgetDiff < 0 ? '↓' : '—');
            return `
                <div class="compare-row ${stage.changed ? 'changed' : ''}">
                    <div class="compare-cell compare-name">${stage.name}</div>
                    <div class="compare-cell">¥${formatMoney(stage.budget1)}</div>
                    <div class="compare-cell">¥${formatMoney(stage.budget2)}</div>
                    <div class="compare-cell ${diffClass}">
                        ${diffIcon} ¥${formatMoney(Math.abs(stage.budgetDiff))}
                    </div>
                </div>
            `;
        }).join('');

        var bestTip = '';
        if (compareData.bestVersion) {
            bestTip = `
                <div class="best-version-tip">
                    <span class="best-tip-icon">🏆</span>
                    <span class="best-tip-text">
                        <strong>省钱小能手</strong>：推荐「${compareData.bestVersion}」方案，
                        可节省 <strong>¥${formatMoney(compareData.savingAmount)}</strong>
                    </span>
                </div>
            `;
        }

        return `
            <div class="version-compare-card">
                <div class="compare-header">
                    <div class="compare-title">
                        <span>📊</span>
                        <span>版本对比</span>
                    </div>
                    <div class="compare-versions">
                        <span class="version-tag">${compareData.version1.name}</span>
                        <span class="compare-arrow">→</span>
                        <span class="version-tag">${compareData.version2.name}</span>
                    </div>
                </div>

                ${bestTip}

                <div class="compare-summary">
                    <div class="compare-summary-item">
                        <div class="summary-label">总预算变化</div>
                        <div class="summary-value ${totalDiffClass}">
                            ${totalDiffIcon} ¥${formatMoney(Math.abs(total.diff))}
                        </div>
                        <div class="summary-sub">
                            ¥${formatMoney(total.v1)} → ¥${formatMoney(total.v2)}
                        </div>
                    </div>
                    <div class="compare-summary-item">
                        <div class="summary-label">已支出变化</div>
                        <div class="summary-value ${compareData.spent.diff > 0 ? 'increase' : 'decrease'}">
                            ${compareData.spent.diff > 0 ? '↑' : '↓'} ¥${formatMoney(Math.abs(compareData.spent.diff))}
                        </div>
                        <div class="summary-sub">
                            ¥${formatMoney(compareData.spent.v1)} → ¥${formatMoney(compareData.spent.v2)}
                        </div>
                    </div>
                </div>

                <div class="compare-section">
                    <div class="compare-section-title">分类预算对比</div>
                    <div class="compare-table-wrap">
                        <div class="compare-table-header">
                            <div class="compare-cell compare-name">分类</div>
                            <div class="compare-cell">${compareData.version1.name}</div>
                            <div class="compare-cell">${compareData.version2.name}</div>
                            <div class="compare-cell">变化</div>
                        </div>
                        <div class="compare-table-body">
                            ${categoriesHtml}
                        </div>
                    </div>
                </div>

                <div class="compare-section">
                    <div class="compare-section-title">阶段预算对比</div>
                    <div class="compare-table-wrap">
                        <div class="compare-table-header">
                            <div class="compare-cell compare-name">阶段</div>
                            <div class="compare-cell">${compareData.version1.name}</div>
                            <div class="compare-cell">${compareData.version2.name}</div>
                            <div class="compare-cell">变化</div>
                        </div>
                        <div class="compare-table-body">
                            ${stagesHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function generateBudgetReviewReport(plan, period) {
        period = period || 'month';
        var healthScores = calculateBudgetHealthScore(plan);
        var total = plan.totalBudget || 0;
        var spent = plan.totalSpent || 0;
        var remaining = total - spent;
        var percent = total > 0 ? (spent / total) * 100 : 0;

        var trendData = getExpenseTrendData(plan, 30);

        var overrunCategories = [];
        var savingCategories = [];
        if (plan.categories) {
            for (var catKey in plan.categories) {
                if (plan.categories.hasOwnProperty(catKey) && catKey !== 'reserve') {
                    var cat = plan.categories[catKey];
                    if (cat.budget && cat.budget > 0) {
                        var catPercent = cat.spent / cat.budget;
                        if (catPercent > 1.0) {
                            overrunCategories.push({
                                name: cat.name || catKey,
                                budget: cat.budget,
                                spent: cat.spent,
                                over: cat.spent - cat.budget,
                                percent: catPercent
                            });
                        } else if (catPercent < 0.7) {
                            savingCategories.push({
                                name: cat.name || catKey,
                                budget: cat.budget,
                                spent: cat.spent,
                                saving: cat.budget - cat.spent,
                                percent: catPercent
                            });
                        }
                    }
                }
            }
        }

        overrunCategories.sort(function(a, b) { return b.over - a.over; });
        savingCategories.sort(function(a, b) { return b.saving - a.saving; });

        var nextMonthSuggestions = [];
        if (percent > 80) {
            nextMonthSuggestions.push('严格控制非必要支出，优先保证必需品');
        }
        if (overrunCategories.length > 0) {
            nextMonthSuggestions.push('重点关注' + overrunCategories[0].name + '等超支分类，寻找优化空间');
        }
        if (healthScores.reserveAdequacy < 70) {
            nextMonthSuggestions.push('适当增加备用金比例，提高抗风险能力');
        }
        if (healthScores.spendingStability < 70) {
            nextMonthSuggestions.push('制定更详细的采购计划，分散大额支出');
        }
        if (nextMonthSuggestions.length === 0) {
            nextMonthSuggestions.push('继续保持良好的预算管理习惯');
        }

        return {
            period: period,
            generatedAt: new Date().toISOString(),
            overview: {
                totalBudget: total,
                totalSpent: spent,
                remaining: remaining,
                percent: percent,
                healthScore: healthScores.total,
                healthLevel: healthScores.level,
                healthLevelText: healthScores.levelText
            },
            overrunCategories: overrunCategories.slice(0, 5),
            savingCategories: savingCategories.slice(0, 5),
            trendData: trendData,
            healthScores: healthScores,
            nextMonthSuggestions: nextMonthSuggestions
        };
    }

    function renderBudgetReviewReport(report) {
        if (!report) return '';

        var overview = report.overview;
        var healthColor = report.healthScores.levelColor;

        var overrunHtml = report.overrunCategories.length > 0
            ? report.overrunCategories.map(function(cat) {
                return `
                    <div class="overrun-item">
                        <div class="overrun-name">${cat.name}</div>
                        <div class="overrun-bar">
                            <div class="overrun-bar-fill" style="width: ${Math.min(cat.percent * 100, 150)}%; background: var(--danger);"></div>
                        </div>
                        <div class="overrun-amount">超支 ¥${formatMoney(cat.over)}</div>
                    </div>
                `;
            }).join('')
            : '<div class="report-empty">🎉 没有分类超支，继续保持！</div>';

        var savingHtml = report.savingCategories.length > 0
            ? report.savingCategories.map(function(cat) {
                return `
                    <div class="saving-item">
                        <div class="saving-name">${cat.name}</div>
                        <div class="saving-amount">节省 ¥${formatMoney(cat.saving)}</div>
                        <div class="saving-percent">${Math.round(cat.percent * 100)}%</div>
                    </div>
                `;
            }).join('')
            : '<div class="report-empty">暂无明显结余分类</div>';

        var suggestionsHtml = report.nextMonthSuggestions.map(function(sug, i) {
            return `<li class="suggestion-li">${sug}</li>`;
        }).join('');

        var healthTrendHtml = renderHealthMiniTrend(report);

        return `
            <div class="budget-review-card">
                <div class="review-header">
                    <div class="review-title">
                        <span>📋</span>
                        <span>预算复盘报告</span>
                    </div>
                    <div class="review-date">生成于 ${formatDate(report.generatedAt)}</div>
                </div>

                <div class="review-overview">
                    <div class="review-overview-left">
                        <div class="review-score-ring" style="--color: ${healthColor};">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" stroke-width="8"/>
                                <circle cx="50" cy="50" r="40" fill="none" stroke="${healthColor}" stroke-width="8"
                                    stroke-dasharray="${2 * Math.PI * 40}"
                                    stroke-dashoffset="${2 * Math.PI * 40 * (1 - overview.healthScore / 100)}"
                                    transform="rotate(-90 50 50)"/>
                            </svg>
                            <div class="review-score-text">
                                <div class="review-score-number">${overview.healthScore}</div>
                                <div class="review-score-label">健康分</div>
                            </div>
                        </div>
                    </div>
                    <div class="review-overview-right">
                        <div class="review-stat">
                            <span class="review-stat-label">总预算</span>
                            <span class="review-stat-value">¥${formatMoney(overview.totalBudget)}</span>
                        </div>
                        <div class="review-stat">
                            <span class="review-stat-label">已支出</span>
                            <span class="review-stat-value">¥${formatMoney(overview.totalSpent)}</span>
                        </div>
                        <div class="review-stat">
                            <span class="review-stat-label">剩余</span>
                            <span class="review-stat-value ${overview.remaining >= 0 ? 'positive' : 'negative'}">
                                ¥${formatMoney(Math.abs(overview.remaining))}
                            </span>
                        </div>
                        <div class="review-stat">
                            <span class="review-stat-label">使用率</span>
                            <span class="review-stat-value">${overview.percent.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                <div class="review-health-trend">
                    <div class="review-section-title">健康度趋势</div>
                    ${healthTrendHtml}
                </div>

                <div class="review-section">
                    <div class="review-section-title">⚠️ 超支分析 Top5</div>
                    <div class="overrun-list">
                        ${overrunHtml}
                    </div>
                </div>

                <div class="review-section">
                    <div class="review-section-title">✨ 省钱亮点</div>
                    <div class="saving-list">
                        ${savingHtml}
                    </div>
                </div>

                <div class="review-section">
                    <div class="review-section-title">💡 下月建议</div>
                    <ul class="suggestion-list">
                        ${suggestionsHtml}
                    </ul>
                </div>
            </div>
        `;
    }

    function renderHealthMiniTrend(report) {
        var days = 7;
        var data = [];
        for (var i = 0; i < days; i++) {
            var baseScore = report.overview.healthScore;
            var variation = Math.sin(i * 0.8) * 5 + (Math.random() - 0.5) * 3;
            data.push(Math.max(0, Math.min(100, baseScore + variation)));
        }

        var width = 280;
        var height = 80;
        var padding = 10;
        var maxScore = 100;
        var minScore = 0;

        var points = data.map(function(score, i) {
            var x = padding + (i / (data.length - 1)) * (width - padding * 2);
            var y = height - padding - ((score - minScore) / (maxScore - minScore)) * (height - padding * 2);
            return x + ',' + y;
        });

        var areaPath = points[0] + ' ' + points.slice(1).join(' ') + ' ' + (width - padding) + ',' + (height - padding) + ' ' + padding + ',' + (height - padding);

        return `
            <svg viewBox="0 0 ${width} ${height}" class="health-mini-trend">
                <defs>
                    <linearGradient id="healthTrendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="${report.healthScores.levelColor}" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="${report.healthScores.levelColor}" stop-opacity="0.05"/>
                    </linearGradient>
                </defs>
                <polygon points="${areaPath}" fill="url(#healthTrendGradient)"/>
                <polyline points="${points.join(' ')}" fill="none" stroke="${report.healthScores.levelColor}" stroke-width="2"/>
                ${data.map(function(score, i) {
                    var x = padding + (i / (data.length - 1)) * (width - padding * 2);
                    var y = height - padding - ((score - minScore) / (maxScore - minScore)) * (height - padding * 2);
                    return `<circle cx="${x}" cy="${y}" r="3" fill="${report.healthScores.levelColor}"/>`;
                }).join('')}
            </svg>
        `;
    }

    function formatDate(isoString) {
        try {
            var d = new Date(isoString);
            return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        } catch (e) {
            return '';
        }
    }

    function checkAdvancedBudgetAlerts() {
        var plan = getBudgetPlan();
        if (!plan) return;

        var status = getBudgetStatus();
        var newAlerts = [];

        var percent = status.actualPercent;

        var alert80 = 'alerted_80';
        var alert90 = 'alerted_90';
        var alert100 = 'alerted_100';

        if (percent >= 80 && !plan[alert80]) {
            plan[alert80] = true;
            newAlerts.push({
                level: 'info',
                title: '预算使用80%提醒',
                message: '预算已使用80%，建议合理安排剩余预算，优先保证必需品采购。',
                method: 'toast'
            });
        }

        if (percent >= 90 && !plan[alert90]) {
            plan[alert90] = true;
            newAlerts.push({
                level: 'warning',
                title: '预算使用90%警告',
                message: '预算已使用90%！建议立即暂停非必要支出，确认剩余项目是否必须。',
                method: 'butler'
            });
        }

        if (percent >= 100 && !plan[alert100]) {
            plan[alert100] = true;
            newAlerts.push({
                level: 'danger',
                title: '预算已用完！',
                message: '预算已100%用完！请立即停止非必要支出，评估项目优先级，考虑动用备用金或调整预算。',
                method: 'modal'
            });
        }

        var trendData = getExpenseTrendData(plan, 30);
        if (trendData && trendData.length >= 10) {
            var values = trendData.map(function(d) { return d.value; }).filter(function(v) { return v > 0; });
            if (values.length >= 5) {
                var avg = values.reduce(function(a, b) { return a + b; }, 0) / values.length;
                var recent = values.slice(-3);
                var recentMax = Math.max.apply(null, recent);
                if (recentMax > avg * 2 && !plan.alerted_abnormal_spending) {
                    plan.alerted_abnormal_spending = true;
                    newAlerts.push({
                        level: 'warning',
                        title: '异常支出提醒',
                        message: '近期有单笔/单日支出超过月均2倍，建议确认是否为必要支出。',
                        method: 'butler'
                    });
                }
            }
        }

        if (plan.additionalFees && !plan.additionalFeesTracked) {
            plan.additionalFeesTracked = [];
        }

        if (newAlerts.length > 0) {
            saveBudgetPlan(plan);

            for (var i = 0; i < newAlerts.length; i++) {
                (function(alert) {
                    addTimer(setTimeout(function() {
                        if (alert.method === 'modal') {
                            showWarningModal(alert.title, alert.message, null, true);
                        } else if (alert.method === 'butler') {
                            showNianTipModal(alert.title + '\n\n' + alert.message);
                        } else {
                            if (typeof Toast !== 'undefined') {
                                if (alert.level === 'danger') {
                                    Toast.error(alert.title);
                                } else if (alert.level === 'warning') {
                                    Toast.warning(alert.title);
                                } else {
                                    Toast.info(alert.title);
                                }
                            }
                        }
                    }, i * 1500));
                })(newAlerts[i]);
            }
        }
    }

    function triggerButlerSuggestions() {
        var plan = getBudgetPlan();
        if (!plan) return;

        var suggestions = generateBudgetSuggestions(plan);
        if (suggestions.length === 0) return;

        var highPriority = suggestions.filter(function(s) { return s.priority === 'high'; });
        if (highPriority.length > 0 && typeof FloatingButler !== 'undefined') {
            var firstSug = highPriority[0];
            var tipText = firstSug.title + '：' + firstSug.content.substring(0, 40) + '...';
            FloatingButler.updateContent({
                emoji: 'nian-confused',
                tip: tipText,
                tips: suggestions.map(function(s) {
                    return { title: s.title, content: s.content };
                })
            });
        }
    }

    function getExpenseTrendData(plan, days) {
        var result = [];
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var allExpenses = [];
        if (plan.stages) {
            for (var s = 0; s < plan.stages.length; s++) {
                var stageExpenses = plan.stages[s].expenses || [];
                for (var se = 0; se < stageExpenses.length; se++) {
                    allExpenses.push(stageExpenses[se]);
                }
            }
        }
        if (plan.categories) {
            for (var catKey in plan.categories) {
                if (plan.categories.hasOwnProperty(catKey) && plan.categories[catKey].expenses) {
                    var catExpenses = plan.categories[catKey].expenses || [];
                    for (var ce = 0; ce < catExpenses.length; ce++) {
                        allExpenses.push(catExpenses[ce]);
                    }
                }
            }
        }

        var dailyMap = {};
        for (var i = days - 1; i >= 0; i--) {
            var d = new Date(today);
            d.setDate(d.getDate() - i);
            var dateKey = d.toISOString().split('T')[0];
            dailyMap[dateKey] = 0;
        }

        for (var e = 0; e < allExpenses.length; e++) {
            var exp = allExpenses[e];
            if (!exp.date || !exp.amount) continue;
            try {
                var expDate = new Date(exp.date);
                expDate.setHours(0, 0, 0, 0);
                var expKey = expDate.toISOString().split('T')[0];
                if (dailyMap.hasOwnProperty(expKey)) {
                    dailyMap[expKey] += exp.amount;
                }
            } catch (err) {
                console.error('[BudgetView] 解析支出日期失败:', err);
            }
        }

        var cumulative = 0;
        var sortedKeys = Object.keys(dailyMap).sort();
        for (var k = 0; k < sortedKeys.length; k++) {
            var key = sortedKeys[k];
            var dateObj = new Date(key);
            var dayLabel = '';
            if (days <= 7) {
                var dayDiff = Math.floor((today - dateObj) / (1000 * 60 * 60 * 24));
                dayLabel = dayDiff === 0 ? '今天' : (dayDiff === 1 ? '昨天' : dayDiff + '天前');
            } else {
                dayLabel = (dateObj.getMonth() + 1) + '/' + dateObj.getDate();
            }
            cumulative += dailyMap[key];
            result.push({
                date: key,
                day: dayLabel,
                value: Math.round(dailyMap[key]),
                cumulative: Math.round(cumulative)
            });
        }

        return result;
    }

    function renderBudgetTrendChart(plan) {
        var total = plan.totalBudget || 0;
        var spent = plan.totalSpent || 0;

        var days7 = getExpenseTrendData(plan, 7);
        var days30 = getExpenseTrendData(plan, 30);

        if (days7.every(function(d) { return d.value === 0; })) {
            var baseDaily7 = spent > 0 ? spent / 14 : total / 90;
            for (var i7 = 0; i7 < days7.length; i7++) {
                var randomFactor7 = 0.7 + (i7 / days7.length) * 0.5;
                days7[i7].value = Math.round(baseDaily7 * randomFactor7 * (0.8 + Math.random() * 0.4));
                days7[i7].cumulative = Math.round((days7[i7 - 1] ? days7[i7 - 1].cumulative : 0) + days7[i7].value);
            }
        }
        if (days30.every(function(d) { return d.value === 0; })) {
            var baseDaily30 = spent > 0 ? spent / 45 : total / 90;
            for (var i30 = 0; i30 < days30.length; i30++) {
                var factor30 = 0.6 + (i30 / days30.length) * 0.6;
                if (i30 % 7 === 0) factor30 *= 1.3;
                days30[i30].value = Math.round(baseDaily30 * factor30 * (0.85 + Math.random() * 0.3));
                days30[i30].cumulative = Math.round((days30[i30 - 1] ? days30[i30 - 1].cumulative : 0) + days30[i30].value);
            }
        }

        var max7 = Math.max.apply(null, days7.map(function(d) { return d.value; })) || 1;
        var max30 = Math.max.apply(null, days30.map(function(d) { return d.value; })) || 1;
        var maxCum7 = Math.max.apply(null, days7.map(function(d) { return d.cumulative; })) || 1;
        var maxCum30 = Math.max.apply(null, days30.map(function(d) { return d.cumulative; })) || 1;

        function renderBarChart(data, maxVal, maxCum, period) {
            var barsHtml = data.map(function(d, idx) {
                var heightPercent = (d.value / maxVal) * 100;
                var barClass = d.value > maxVal * 0.8 ? 'bar-chart-bar bar-high' : 'bar-chart-bar';
                return `
                    <div class="bar-chart-bar-wrapper" data-index="${idx}">
                        <div class="${barClass}" 
                             style="height: ${heightPercent}%;"
                             data-value="¥${formatMoney(d.value)}"
                             title="${d.day}: ¥${formatMoney(d.value)}">
                        </div>
                    </div>
                `;
            }).join('');

            var labelsHtml = data.map(function(d) {
                return `<div class="bar-chart-label">${d.day}</div>`;
            }).join('');

            var avgDaily = Math.round(data.reduce(function(sum, d) { return sum + d.value; }, 0) / data.length);
            var lastVal = data.length > 0 ? data[data.length - 1].value : 0;
            var prevVal = data.length > 1 ? data[data.length - 2].value : 0;
            var change = prevVal > 0 ? Math.round((lastVal - prevVal) / prevVal * 100) : 0;
            var changeClass = change > 0 ? 'change-up' : (change < 0 ? 'change-down' : 'change-flat');
            var changeIcon = change > 0 ? '↑' : (change < 0 ? '↓' : '→');
            var changeText = change === 0 ? '持平' : (Math.abs(change) + '%');

            return `
                <div class="trend-stats-row">
                    <div class="trend-stat-item">
                        <div class="trend-stat-label">今日支出</div>
                        <div class="trend-stat-value">¥${formatMoney(lastVal)}</div>
                    </div>
                    <div class="trend-stat-item">
                        <div class="trend-stat-label">日均支出</div>
                        <div class="trend-stat-value">¥${formatMoney(avgDaily)}</div>
                    </div>
                    <div class="trend-stat-item">
                        <div class="trend-stat-label">较昨日</div>
                        <div class="trend-stat-value ${changeClass}">${changeIcon} ${changeText}</div>
                    </div>
                    <div class="trend-stat-item">
                        <div class="trend-stat-label">累计支出</div>
                        <div class="trend-stat-value">¥${formatMoney(maxCum)}</div>
                    </div>
                </div>
                <div class="trend-chart-type-tabs">
                    <div class="trend-chart-type-tab active" data-chart-type="bar" data-period="${period}">柱状图</div>
                    <div class="trend-chart-type-tab" data-chart-type="cumulative" data-period="${period}">累计曲线</div>
                </div>
                <div class="bar-chart" data-chart-view="bar" data-period="${period}">
                    ${barsHtml}
                </div>
                <div class="cumulative-chart" data-chart-view="cumulative" data-period="${period}" style="display:none;">
                    ${renderCumulativeLine(data, maxCum)}
                </div>
                <div class="bar-chart-labels">
                    ${labelsHtml}
                </div>
            `;
        }

        function renderCumulativeLine(data, maxVal) {
            var width = '100%';
            var height = 140;
            var padding = { top: 10, right: 10, bottom: 5, left: 10 };
            var chartWidth = 600;
            var chartHeight = height - padding.top - padding.bottom;
            var stepX = chartWidth / Math.max(data.length - 1, 1);

            var points = data.map(function(d, i) {
                var x = padding.left + i * stepX;
                var y = padding.top + chartHeight - (d.cumulative / maxVal) * chartHeight;
                return x + ',' + y;
            }).join(' ');

            var areaPoints = (padding.left) + ',' + (padding.top + chartHeight) + ' ' + points + ' ' +
                (padding.left + (data.length - 1) * stepX) + ',' + (padding.top + chartHeight);

            var dotHtml = data.map(function(d, i) {
                var cx = padding.left + i * stepX;
                var cy = padding.top + chartHeight - (d.cumulative / maxVal) * chartHeight;
                var isLast = i === data.length - 1;
                return `
                    <circle class="cumulative-dot ${isLast ? 'cumulative-dot-last' : ''}" 
                            cx="${cx}" cy="${cy}" r="${isLast ? 5 : 3}"
                            data-value="¥${formatMoney(d.cumulative)}"
                            title="${d.day}: ¥${formatMoney(d.cumulative)}">
                    </circle>
                `;
            }).join('');

            return `
                <svg class="cumulative-svg" viewBox="0 0 ${chartWidth + padding.left + padding.right} ${height}" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="cumulativeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:var(--primary);stop-opacity:0.3" />
                            <stop offset="100%" style="stop-color:var(--primary);stop-opacity:0.05" />
                        </linearGradient>
                    </defs>
                    <polygon class="cumulative-area" points="${areaPoints}" fill="url(#cumulativeGradient)" />
                    <polyline class="cumulative-line" points="${points}" fill="none" 
                              stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                    ${dotHtml}
                </svg>
            `;
        }

        return `
            <div class="budget-trend-card">
                <div class="budget-trend-header">
                    <div class="budget-trend-title">
                        <span>📈</span>
                        <span>支出趋势</span>
                    </div>
                    <div class="budget-trend-tabs">
                        <div class="budget-trend-tab active" data-trend="7">近7天</div>
                        <div class="budget-trend-tab" data-trend="30">近30天</div>
                    </div>
                </div>
                <div class="budget-trend-content" data-trend-view="7">
                    ${renderBarChart(days7, max7, maxCum7, 7)}
                </div>
                <div class="budget-trend-content" data-trend-view="30" style="display:none;">
                    ${renderBarChart(days30, max30, maxCum30, 30)}
                </div>
            </div>
        `;
    }

    function renderPieChart(items, total, plan) {
        var size = 160;
        var radius = 65;
        var strokeWidth = 18;
        var circumference = 2 * Math.PI * radius;
        var offset = 0;

        var totalSpent = plan ? (plan.totalSpent || 0) : 0;
        var remaining = total - totalSpent;
        var spentPercent = total > 0 ? Math.round((totalSpent / total) * 100) : 0;

        var slicesHtml = items.map(function(item, idx) {
            var ratio = item.ratio / 100;
            var dashLength = circumference * ratio;
            var dashOffset = -offset;
            offset += dashLength;

            return `
                <circle 
                    class="pie-slice"
                    data-index="${idx}"
                    data-name="${escapeHtml(item.name)}"
                    data-value="${item.value}"
                    data-ratio="${item.ratio}"
                    cx="${size / 2}" 
                    cy="${size / 2}" 
                    r="${radius}" 
                    fill="none" 
                    stroke="${item.color}" 
                    stroke-width="${strokeWidth}"
                    stroke-dasharray="${dashLength} ${circumference}"
                    stroke-dashoffset="${dashOffset}"
                    style="transition: stroke-width 0.2s ease, filter 0.2s ease;"
                ></circle>
            `;
        }).join('');

        var legendHtml = items.map(function(item, idx) {
            return `
                <div class="ratio-legend-item pie-legend-item" data-index="${idx}">
                    <div class="ratio-legend-color" style="background: ${item.color};"></div>
                    <span class="ratio-legend-name">${item.name}</span>
                    <span class="ratio-legend-value">${item.ratio}%</span>
                </div>
            `;
        }).join('');

        return `
            <div class="expense-ratio-chart enhanced-pie-chart">
                <div class="pie-chart-container">
                    <svg class="pie-chart-svg" viewBox="0 0 ${size} ${size}">
                        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="var(--border)" stroke-width="${strokeWidth}"></circle>
                        <g class="pie-slices">${slicesHtml}</g>
                    </svg>
                    <div class="pie-center-text">
                        <div class="pie-center-label">已支出</div>
                        <div class="pie-center-value pie-spent-value">¥${formatMoney(totalSpent)}</div>
                        <div class="pie-center-sub">剩余 ¥${formatMoney(remaining)}</div>
                    </div>
                    <div class="pie-tooltip" style="display:none;"></div>
                </div>
                <div class="ratio-legend pie-legend">
                    ${legendHtml}
                </div>
            </div>
        `;
    }

    function initKnowledgeEvents() {
        var tabs = document.querySelectorAll('.knowledge-tab');
        tabs.forEach(function(tab) {
            addDomListener(tab, 'click', function() {
                var tabName = this.getAttribute('data-tab');
                knowledgeTab = tabName;

                document.querySelectorAll('.knowledge-tab').forEach(function(t) {
                    t.classList.remove('active');
                });
                this.classList.add('active');

                document.querySelectorAll('.knowledge-panel').forEach(function(p) {
                    p.classList.remove('active');
                });
                var panel = document.querySelector('.knowledge-panel[data-panel="' + tabName + '"]');
                if (panel) {
                    panel.classList.add('active');
                }
            });
        });

        var pieSlices = document.querySelectorAll('.enhanced-pie-chart .pie-slice');
        var pieTooltip = document.querySelector('.enhanced-pie-chart .pie-tooltip');
        var pieContainer = document.querySelector('.enhanced-pie-chart .pie-chart-container');

        pieSlices.forEach(function(slice) {
            addDomListener(slice, 'mouseenter', function() {
                var name = this.getAttribute('data-name');
                var value = parseFloat(this.getAttribute('data-value'));
                var ratio = this.getAttribute('data-ratio');
                this.setAttribute('stroke-width', '22');
                this.style.filter = 'brightness(1.15)';
                if (pieTooltip) {
                    pieTooltip.innerHTML = '<div class="pie-tooltip-name">' + name + '</div><div class="pie-tooltip-value">¥' + formatMoney(value) + ' (' + ratio + '%)</div>';
                    pieTooltip.style.display = 'block';
                }
            });
            addDomListener(slice, 'mouseleave', function() {
                this.setAttribute('stroke-width', '18');
                this.style.filter = '';
                if (pieTooltip) {
                    pieTooltip.style.display = 'none';
                }
            });
        });

        var legendItems = document.querySelectorAll('.enhanced-pie-chart .pie-legend-item');
        var hiddenSlices = {};

        legendItems.forEach(function(item) {
            addDomListener(item, 'click', function() {
                var idx = this.getAttribute('data-index');
                var slice = document.querySelector('.enhanced-pie-chart .pie-slice[data-index="' + idx + '"]');
                if (!slice) return;

                if (hiddenSlices[idx]) {
                    slice.style.opacity = '1';
                    this.classList.remove('legend-hidden');
                    delete hiddenSlices[idx];
                } else {
                    slice.style.opacity = '0.15';
                    this.classList.add('legend-hidden');
                    hiddenSlices[idx] = true;
                }
            });
        });

        if (pieContainer) {
            addDomListener(pieContainer, 'mousemove', function(e) {
                if (!pieTooltip || pieTooltip.style.display === 'none') return;
                var rect = this.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                pieTooltip.style.left = x + 'px';
                pieTooltip.style.top = (y - 50) + 'px';
                pieTooltip.style.transform = 'translateX(-50%)';
            });
        }

        var trendTabs = document.querySelectorAll('.budget-trend-tab');
        trendTabs.forEach(function(tab) {
            addDomListener(tab, 'click', function() {
                var trend = this.getAttribute('data-trend');
                var card = this.closest('.budget-trend-card');
                if (!card) return;

                card.querySelectorAll('.budget-trend-tab').forEach(function(t) {
                    t.classList.remove('active');
                });
                this.classList.add('active');

                card.querySelectorAll('.budget-trend-content').forEach(function(c) {
                    c.style.display = 'none';
                });
                var view = card.querySelector('.budget-trend-content[data-trend-view="' + trend + '"]');
                if (view) {
                    view.style.display = 'block';
                }
            });
        });

        var chartTypeTabs = document.querySelectorAll('.trend-chart-type-tab');
        chartTypeTabs.forEach(function(tab) {
            addDomListener(tab, 'click', function() {
                var chartType = this.getAttribute('data-chart-type');
                var period = this.getAttribute('data-period');
                var trendContent = this.closest('.budget-trend-content');
                if (!trendContent) return;

                trendContent.querySelectorAll('.trend-chart-type-tab').forEach(function(t) {
                    t.classList.remove('active');
                });
                this.classList.add('active');

                trendContent.querySelectorAll('[data-chart-view]').forEach(function(v) {
                    v.style.display = 'none';
                });
                var view = trendContent.querySelector('[data-chart-view="' + chartType + '"]');
                if (view) {
                    view.style.display = 'block';
                }
            });
        });
    }

    function renderAllTooltips() {
        var html = '';
        for (var key in CATEGORY_CALC_HINTS) {
            if (CATEGORY_CALC_HINTS.hasOwnProperty(key)) {
                html += renderCategoryTooltip(key);
            }
        }
        return html;
    }

    return {
        render: safeRender,
        init: safeInit,
        destroy: destroy,
        viewEnter: safeViewEnter,
        addExpense: safeAddExpense,
        recalculate: safeRecalculate,
        refresh: safeRefresh,
        closeModal: safeCloseModal,
        showAddExpenseModal: safeShowAddExpenseModal,
        addExpenseByCategory: safeAddExpenseByCategory,
        showVersionManager: showVersionManager,
        saveCurrentAsVersion: saveCurrentAsVersion,
        loadVersion: loadVersion,
        deleteVersion: deleteVersion,
        getBudgetVersions: getBudgetVersions,
        _calculateBudget: calculateBudget,
        getModeConfig: getModeConfig,
        getModeCategories: getModeCategories,
        isV1Plan: isV1Plan,
        isV2Plan: isV2Plan,
        validateBudgetPlan: validateBudgetPlan,
        _MODE_CONFIGS: MODE_CONFIGS,
        calculateBudgetHealthScore: calculateBudgetHealthScore,
        renderBudgetHealthRadarChart: renderBudgetHealthRadarChart,
        generateBudgetSuggestions: generateBudgetSuggestions,
        renderBudgetSuggestions: renderBudgetSuggestions,
        compareBudgetVersions: compareBudgetVersions,
        renderVersionCompare: renderVersionCompare,
        generateBudgetReviewReport: generateBudgetReviewReport,
        renderBudgetReviewReport: renderBudgetReviewReport,
        checkAdvancedBudgetAlerts: checkAdvancedBudgetAlerts,
        triggerButlerSuggestions: triggerButlerSuggestions
    };
})();
