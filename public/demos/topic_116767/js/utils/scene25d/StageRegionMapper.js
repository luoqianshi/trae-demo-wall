var StageRegionMapper = (function() {
    'use strict';

    var REGION_DIALOGS = {
        entryway: [
            '玄关是家的第一印象呢~',
            '鞋柜设计得好，出门回家心情都好~',
            '换鞋凳一定要舒服哦~',
            '玄关挂一面镜子，出门前整理下~',
            '收纳很重要，鞋子包包都要收好~',
            '门口放个地垫，干净又卫生~',
            '玄关灯光要温馨哦~'
        ],
        livingroom: [
            '客厅是家的中心区域呢~',
            '沙发一定要选舒服的~',
            '电视背景墙设计得好，客厅更有格调~',
            '茶几选圆角的，更安全哦~',
            '客厅采光好的话，心情都会变好~',
            '绿植放几盆，空气更清新~',
            '地毯铺上，脚感暖暖的~'
        ],
        kitchen: [
            '厨房是美食诞生的地方~',
            '橱柜布局要合理，做饭更顺手~',
            '抽油烟机选吸力大的~',
            '台面要选耐脏好清洁的~',
            '厨房收纳很重要哦~',
            '冰箱位置要规划好~',
            '厨房灯要亮，做饭更方便~'
        ],
        study: [
            '书房是学习工作的好地方~',
            '书桌选大一点更舒服~',
            '椅子要选人体工学的哦~',
            '书房采光很重要呢~',
            '书架要够大，才能装下所有书~',
            '安静的环境效率更高~',
            '放盆绿植，缓解眼疲劳~'
        ],
        bedroom: [
            '卧室是休息的港湾~',
            '床垫一定要选好的，睡眠很重要~',
            '衣柜要够大，衣服才能装下~',
            '窗帘选遮光的，睡得更香~',
            '卧室颜色选暖色调更温馨~',
            '床头柜放个台灯，晚上起夜方便~',
            '卧室要通风好，睡觉更舒服~'
        ],
        balcony: [
            '阳台晒太阳好舒服呀~',
            '养点花草，心情都会变好~',
            '晾衣架选升降的更方便~',
            '阳台视野好，适合发呆~',
            '放个小桌椅，喝喝茶聊聊天~',
            '洗衣机放阳台，晾晒方便~',
            '阳台封起来，灰尘少很多~'
        ]
    };

    var TIME_DIALOGS = {
        morning: [
            '早上好呀！今天也是充满活力的一天~',
            '早安！装修进度怎么样啦？',
            '早上好，记得吃早餐哦~',
            '清晨的阳光真好，适合开工~',
            '新的一天，加油装修继续努力！',
            '早呀，今天打算做什么呢？'
        ],
        noon: [
            '中午好，吃饭了吗？',
            '午休时间到，休息一下吧~',
            '午饭要吃好，下午才有劲干活~',
            '中午了，上午进展顺利吗？',
            '正午阳光正好，适合监工~',
            '午安，记得午休一会下午更有精神~'
        ],
        afternoon: [
            '下午好，继续加油~',
            '下午茶时间到了吗？',
            '下午进度怎么样啦？',
            '阳光斜斜的，真舒服~',
            '再坚持一下，快下班啦~',
            '下午好呀，有什么问题问我~'
        ],
        evening: [
            '晚上好，今天辛苦了~',
            '晚饭吃了吗？',
            '晚上适合规划明天的工作~',
            '今天进展不错吧？',
            '晚上好，记得早点休息哦~',
            '夜色真美，适合发呆~'
        ],
        night: [
            '这么晚还没睡呀？',
            '夜深了，早点休息吧~',
            '晚安，明天继续加油~',
            '熬夜对身体不好哦~',
            '睡不着吗？聊聊装修吧~',
            '夜晚静悄悄，适合思考~'
        ]
    };

    var CLICK_DIALOGS = [
        { text: '哎呀，你点我啦~', state: 'happy' },
        { text: '有什么事吗？', state: 'thinking' },
        { text: '嘿嘿，被你发现了~', state: 'happy' },
        { text: '我正在思考装修方案呢~', state: 'thinking' },
        { text: '需要我帮忙吗？', state: 'wave' },
        { text: '点我点我，我超可爱的~', state: 'happy' },
        { text: '哇，好开心！', state: 'celebrate' },
        { text: '你好呀~', state: 'wave' },
        { text: '我在努力工作哦~', state: 'work' },
        { text: '怎么啦？有问题吗？', state: 'confused' }
    ];

    var STAGE_REGION_MAP = {
        1: {
            stageId: 1,
            stageName: '开工准备',
            regionId: 'entryway',
            nianState: 'thinking',
            dialogs: [
                '开工准备阶段，让我们好好规划一下~',
                '设计方案定好了吗？有问题随时问我哦~',
                '装修第一步很重要，咱们稳扎稳打~',
                '预算准备好了吗？我可以帮您把控哦~',
                '期待和您一起打造梦想之家！',
                '先看看设计图，想象一下未来的家~',
                '量房很重要，数据要准确哦~',
                '合同要仔细看，条款都要清楚~'
            ]
        },
        2: {
            stageId: 2,
            stageName: '拆改/水电',
            regionId: 'livingroom',
            nianState: 'work',
            dialogs: [
                '结构改造进行中，注意安全第一~',
                '水电改造可是隐蔽工程，要仔细把关哦~',
                '承重墙绝对不能碰，这个很重要！',
                '防水一定要做好，不然后期很麻烦~',
                '水管走顶不走地，记住这个小技巧~',
                '插座位置要规划好，不然以后不够用~',
                '强弱电要分开，避免干扰~',
                '闭水试验一定要做够48小时~'
            ]
        },
        3: {
            stageId: 3,
            stageName: '泥木/瓦工',
            regionId: 'kitchen',
            nianState: 'work',
            dialogs: [
                '瓦工木工进行中，家慢慢有样子了~',
                '瓷砖贴得怎么样？记得检查空鼓率哦~',
                '厨房的橱柜做出来效果满意吗？',
                '这时候最有成就感了，看着家一点点变好~',
                '记得验收要仔细，细节决定品质~',
                '地砖要选防滑的，安全第一~',
                '木工做的柜子更贴合户型~',
                '阴阳角要做直，才好看~'
            ]
        },
        4: {
            stageId: 4,
            stageName: '油漆/安装',
            regionId: 'study',
            nianState: 'work',
            dialogs: [
                '油漆和安装阶段，马上就要完工了！',
                '墙面颜色选好了吗？上墙效果怎么样？',
                '书房的环境很适合工作学习呢~',
                '灯具选得怎么样？氛围感很重要哦~',
                '越到最后越要耐心，加油！',
                '底漆面漆都要刷够遍数~',
                '安装的时候要保护好成品~',
                '开关插座高度要合适~'
            ]
        },
        5: {
            stageId: 5,
            stageName: '软装/收尾',
            regionId: 'bedroom',
            nianState: 'happy',
            dialogs: [
                '软装阶段啦，家越来越温馨了~',
                '卧室是休息的地方，一定要舒服哦~',
                '家具都进场了吗？效果满意吗？',
                '窗帘选遮光的，睡眠质量更好~',
                '马上就能住新家了，激动不激动？',
                '软装是家的灵魂，要用心搭配~',
                '装饰品慢慢添，不要急~',
                '绿植放对位置，家更有生气~'
            ]
        },
        6: {
            stageId: 6,
            stageName: '入住准备',
            regionId: 'livingroom',
            nianState: 'celebrate',
            dialogs: [
                '恭喜恭喜！终于要住新家啦！',
                '乔迁之喜！小管家也替您开心~',
                '客厅是家里的核心区域，要好好布置~',
                '入住前记得测甲醛哦，健康最重要~',
                '祝您在新家里每天都开开心心的！',
                '开荒保洁要做彻底~',
                '搬家公司要选靠谱的~',
                '新家新气象，开启新生活~'
            ]
        },
        7: {
            stageId: 7,
            stageName: '完全完成',
            regionId: 'balcony',
            nianState: 'idle',
            dialogs: [
                '装修全部完成啦，好好享受新家吧~',
                '阳台采光真好，适合晒太阳发呆~',
                '住得还习惯吗？有问题随时找我~',
                '家是温暖的港湾，要好好爱护哦~',
                '感谢您让我陪伴您的装修之旅~',
                '有什么问题随时回来找我~',
                '记得定期维护哦~',
                '祝您生活幸福美满~'
            ]
        }
    };

    function StageRegionMapper(options) {
        options = options || {};
        this._regionManager = options.regionManager || null;
        this._stageChangeCallbacks = [];
        this._currentStage = 0;
    }

    StageRegionMapper.prototype.setRegionManager = function(regionManager) {
        this._regionManager = regionManager;
    };

    StageRegionMapper.prototype.getMapping = function(stageId) {
        var stage = parseInt(stageId);
        if (isNaN(stage) || stage < 1 || stage > 7) {
            stage = 1;
        }
        var mapping = STAGE_REGION_MAP[stage];
        if (!mapping) {
            return null;
        }

        var result = {};
        for (var key in mapping) {
            if (mapping.hasOwnProperty(key)) {
                result[key] = mapping[key];
            }
        }

        var position = this.getTargetPosition(stage);
        result.targetX = position.x;
        result.targetY = position.y;

        return result;
    };

    StageRegionMapper.prototype.getAllMappings = function() {
        var result = [];
        for (var i = 1; i <= 7; i++) {
            result.push(this.getMapping(i));
        }
        return result;
    };

    StageRegionMapper.prototype.getTargetPosition = function(stageId) {
        var mapping = STAGE_REGION_MAP[parseInt(stageId)];
        if (!mapping) {
            return { x: 350, y: 280 };
        }

        var regionId = mapping.regionId;
        var region = null;

        if (this._regionManager && typeof this._regionManager.getRegion === 'function') {
            region = this._regionManager.getRegion(regionId);
        }

        if (!region) {
            region = this._getDefaultRegion(regionId);
        }

        if (!region) {
            return { x: 350, y: 280 };
        }

        var centerX = region.x + region.width / 2;
        var centerY = region.y + region.height / 2;

        var offsetX = (Math.random() - 0.5) * Math.min(region.width * 0.3, 60);
        var offsetY = (Math.random() - 0.5) * Math.min(region.height * 0.3, 40);

        var x = centerX + offsetX;
        var y = centerY + offsetY;

        x = Math.max(region.x + 30, Math.min(x, region.x + region.width - 30));
        y = Math.max(region.y + 30, Math.min(y, region.y + region.height - 30));

        return {
            x: Math.round(x),
            y: Math.round(y)
        };
    };

    StageRegionMapper.prototype._getDefaultRegion = function(regionId) {
        var defaultRegions = {
            'entryway': { x: 0, y: 100, width: 150, height: 250 },
            'livingroom': { x: 150, y: 100, width: 400, height: 250 },
            'kitchen': { x: 550, y: 100, width: 250, height: 180 },
            'study': { x: 0, y: 350, width: 250, height: 150 },
            'bedroom': { x: 550, y: 280, width: 250, height: 220 },
            'balcony': { x: 50, y: 0, width: 700, height: 100 }
        };
        return defaultRegions[regionId] || null;
    };

    StageRegionMapper.prototype.getStageDialogs = function(stageId) {
        var mapping = STAGE_REGION_MAP[parseInt(stageId)];
        if (!mapping) {
            return [];
        }
        return mapping.dialogs.slice();
    };

    StageRegionMapper.prototype.getRandomDialog = function(stageId) {
        var dialogs = this.getStageDialogs(stageId);
        if (dialogs.length === 0) {
            return '';
        }
        return dialogs[Math.floor(Math.random() * dialogs.length)];
    };

    StageRegionMapper.prototype.onStageChange = function(callback) {
        if (typeof callback === 'function') {
            this._stageChangeCallbacks.push(callback);
        }
    };

    StageRegionMapper.prototype._fireStageChange = function(newStage, oldStage) {
        for (var i = 0; i < this._stageChangeCallbacks.length; i++) {
            try {
                this._stageChangeCallbacks[i](newStage, oldStage);
            } catch (e) {
                console.error('StageRegionMapper stage change callback error:', e);
            }
        }
    };

    StageRegionMapper.prototype.setCurrentStage = function(stageId) {
        var oldStage = this._currentStage;
        var newStage = parseInt(stageId);
        if (isNaN(newStage) || newStage < 0) {
            newStage = 0;
        }
        if (newStage > 7) {
            newStage = 7;
        }
        if (newStage !== oldStage) {
            this._currentStage = newStage;
            this._fireStageChange(newStage, oldStage);
        }
        return this._currentStage;
    };

    StageRegionMapper.prototype.getCurrentStage = function() {
        return this._currentStage;
    };

    StageRegionMapper.prototype.getRegionDialogs = function(regionId) {
        var dialogs = REGION_DIALOGS[regionId];
        return dialogs ? dialogs.slice() : [];
    };

    StageRegionMapper.prototype.getRandomRegionDialog = function(regionId) {
        var dialogs = this.getRegionDialogs(regionId);
        if (dialogs.length === 0) {
            return '';
        }
        return dialogs[Math.floor(Math.random() * dialogs.length)];
    };

    StageRegionMapper.prototype.getTimeOfDay = function() {
        var hour = new Date().getHours();
        if (hour >= 5 && hour < 11) {
            return 'morning';
        } else if (hour >= 11 && hour < 14) {
            return 'noon';
        } else if (hour >= 14 && hour < 18) {
            return 'afternoon';
        } else if (hour >= 18 && hour < 22) {
            return 'evening';
        } else {
            return 'night';
        }
    };

    StageRegionMapper.prototype.getTimeDialogs = function(timeOfDay) {
        if (!timeOfDay) {
            timeOfDay = this.getTimeOfDay();
        }
        var dialogs = TIME_DIALOGS[timeOfDay];
        return dialogs ? dialogs.slice() : [];
    };

    StageRegionMapper.prototype.getRandomTimeDialog = function(timeOfDay) {
        var dialogs = this.getTimeDialogs(timeOfDay);
        if (dialogs.length === 0) {
            return '';
        }
        return dialogs[Math.floor(Math.random() * dialogs.length)];
    };

    StageRegionMapper.prototype.getClickDialogs = function() {
        return CLICK_DIALOGS.slice();
    };

    StageRegionMapper.prototype.getRandomClickDialog = function() {
        if (CLICK_DIALOGS.length === 0) {
            return { text: '', state: 'idle' };
        }
        var idx = Math.floor(Math.random() * CLICK_DIALOGS.length);
        return {
            text: CLICK_DIALOGS[idx].text,
            state: CLICK_DIALOGS[idx].state
        };
    };

    StageRegionMapper.prototype.getSmartDialog = function(stageId, regionId) {
        var candidates = [];

        var stageDialogs = this.getStageDialogs(stageId);
        for (var i = 0; i < stageDialogs.length; i++) {
            candidates.push({ text: stageDialogs[i], weight: 3 });
        }

        if (regionId && REGION_DIALOGS[regionId]) {
            var regionDialogs = REGION_DIALOGS[regionId];
            for (var j = 0; j < regionDialogs.length; j++) {
                candidates.push({ text: regionDialogs[j], weight: 2 });
            }
        }

        var timeDialogs = this.getTimeDialogs();
        for (var k = 0; k < timeDialogs.length; k++) {
            candidates.push({ text: timeDialogs[k], weight: 1 });
        }

        if (candidates.length === 0) {
            return '';
        }

        var totalWeight = 0;
        for (var m = 0; m < candidates.length; m++) {
            totalWeight += candidates[m].weight;
        }

        var random = Math.random() * totalWeight;
        var cumulative = 0;
        for (var n = 0; n < candidates.length; n++) {
            cumulative += candidates[n].weight;
            if (random < cumulative) {
                return candidates[n].text;
            }
        }

        return candidates[candidates.length - 1].text;
    };

    return {
        StageRegionMapper: StageRegionMapper,
        create: function(options) {
            return new StageRegionMapper(options);
        }
    };
})();
