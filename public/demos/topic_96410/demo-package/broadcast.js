/**
 * broadcast.js — 3D末日求生：广播系统
 * 版本：v1.0 | P0最小集
 * 实现：求救信号 + 基地公告 + 方舟共鸣（3种类型）
 */
(function () {
    'use strict';

    // ==================== 枚举 ====================
    const EBroadcastType = {
        BaseNotice: 1,
        Distress: 2,
        ZoneWarning: 3,
        Encounter: 4,
        SurvivorMsg: 5,
        Weather: 6,
        ArkResonance: 7,
        Static: 8,
        EnemyComm: 9,
        BattleEcho: 10
    };

    const EPriority = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

    const EActionType = { None: 0, AcceptQuest: 1, MarkMap: 2, OpenDialog: 3 };

    // ==================== 类型配置 ====================
    const TYPE_CONFIG = {
        [EBroadcastType.BaseNotice]:   { icon: '📢', color: '#FFFFFF', textColor: '#E8E8E8', prefix: '方舟站·通讯台', scrollSpeed: 50, priority: EPriority.NORMAL },
        [EBroadcastType.Distress]:     { icon: '🆘', color: '#FF6B35', textColor: '#FFB088', prefix: '求救信号', scrollSpeed: 40, priority: EPriority.URGENT },
        [EBroadcastType.ArkResonance]: { icon: '⬡', color: '#FFD700', textColor: '#FFE873', prefix: '方舟系统', scrollSpeed: 45, priority: EPriority.HIGH },
        [EBroadcastType.Static]:       { icon: '📡', color: '#555555', textColor: '#777777', prefix: '未知信号', scrollSpeed: 55, priority: EPriority.LOW },
        [EBroadcastType.EnemyComm]:    { icon: '📴', color: '#AA2222', textColor: '#CC4444', prefix: '截获·黑雨教', scrollSpeed: 40, priority: EPriority.HIGH },
        [EBroadcastType.Weather]:      { icon: '🌧', color: '#888888', textColor: '#AAAAAA', prefix: '环境监测', scrollSpeed: 50, priority: EPriority.NORMAL },
        [EBroadcastType.Encounter]:    { icon: '✨', color: '#BB44FF', textColor: '#CC88FF', prefix: '侦察队', scrollSpeed: 50, priority: EPriority.NORMAL },
        [EBroadcastType.SurvivorMsg]:  { icon: '💬', color: '#44FF88', textColor: '#88FFAA', prefix: '幸存者', scrollSpeed: 45, priority: EPriority.NORMAL },
        [EBroadcastType.ZoneWarning]:  { icon: '⚠', color: '#FF3333', textColor: '#FF6666', prefix: '警戒系统', scrollSpeed: 50, priority: EPriority.HIGH },
        [EBroadcastType.BattleEcho]:   { icon: '💥', color: '#FFAA33', textColor: '#FFCC66', prefix: '战斗回响', scrollSpeed: 50, priority: EPriority.NORMAL }
    };

    // ==================== P0 内容池 ====================
    const DISTRESS_POOL = [
        {
            id: 'distress_01', text: '有人在吗？！我们在旧药厂地下室被困住了——有变异体在外面！坐标[旧药厂]·B1',
            sender: '未知幸存者', ttl: 7200, actionType: EActionType.AcceptQuest,
            actionParam: JSON.stringify({ questId: 'distress_01', area: '旧药厂', enemies: 8, timeLimit: 600, reward: { exp: 200, gold: 150, item: 'T1装备' } })
        },
        {
            id: 'distress_02', text: '求救求救！我是拾荒者·在加油站被三只冲锋者堵住了·油还剩半桶·它们在撞门！',
            sender: '拾荒者', ttl: 7200, actionType: EActionType.AcceptQuest,
            actionParam: JSON.stringify({ questId: 'distress_02', area: '加油站', enemies: 3, timeLimit: 300, reward: { exp: 180, gold: 120, item: '强化卡' } })
        },
        {
            id: 'distress_03', text: '我们有个伤员·腿被咬断了·在居民楼3楼·射击者在外面对着窗户·下不去！',
            sender: '幸存者小队', ttl: 7200, actionType: EActionType.AcceptQuest,
            actionParam: JSON.stringify({ questId: 'distress_03', area: '居民楼', enemies: 2, timeLimit: 480, reward: { exp: 220, gold: 100, item: 'HP药(大)×3' } })
        },
        {
            id: 'distress_04', text: '这里是城南小学·我们有14个孩子·围墙快撑不住了·求求你们——',
            sender: '小学教师', ttl: 7200, actionType: EActionType.AcceptQuest,
            actionParam: JSON.stringify({ questId: 'distress_04', area: '城南小学', enemies: 3, timeLimit: 300, reward: { exp: 250, gold: 200, item: '魔魂碎片×2' } })
        },
        {
            id: 'distress_05', text: '信号...差...超市地下室...门...顶不住...快来...',
            sender: '未知幸存者', ttl: 7200, signalQuality: 0.35, actionType: EActionType.AcceptQuest,
            actionParam: JSON.stringify({ questId: 'distress_05', area: '超市地下室', enemies: 6, timeLimit: 480, reward: { exp: 200, gold: 130, item: 'T1装备' } })
        }
    ];

    const BASE_NOTICE_POOL = [
        { id: 'base_01', text: '今日物资分配完毕·请各位到B1层领取', sender: '方舟站·通讯台' },
        { id: 'base_02', text: '周队长提醒：外出行动至少两人一组·携带备用电池', sender: '方舟站·通讯台' },
        { id: 'base_03', text: 'B3层铸魂台已校准·可正常使用', sender: '方舟站·通讯台' },
        { id: 'base_04', text: '林博士发布新任务·有意愿的觉醒者请到B2层接洽', sender: '方舟站·通讯台' },
        { id: 'base_05', text: '老张修理铺新到一批零件·先到先得', sender: '方舟站·通讯台' }
    ];

    const ARK_RESONANCE_POOL = [
        { id: 'ark_01', text: '方舟系统：宿主·你的方舟等级已提升·新的领域正在解锁', sender: '方舟系统' },
        { id: 'ark_02', text: '方舟系统·共鸣记录：检测到领域碎片·可前往方舟界面查看', sender: '方舟系统' }
    ];

    // ==================== 广播管理器 ====================
    const BroadcastManager = {
        // 队列与历史
        messageQueue: [],
        messageHistory: [],
        _historyMax: 80,
        _queueMax: 5,

        // 定时器（秒）
        distressTimer: 0,
        distressInterval: 1800,  // 实际：1800-3000秒，Demo测试：8分钟（480秒）
        _distressMin: 480, _distressMax: 1200,

        // 环境杂波定时器（填充空档）
        staticTimer: 0,
        staticInterval: 60,  // 随机环境杂波每60秒左右一次
        _staticMin: 40, _staticMax: 120,

        baseNoticeTriggered: false,  // 进入方舟站时触发一次

        // 状态
        isInCombat: false,
        isInArkStation: false,
        lastBroadcastTime: 0,
        gameTimeSeconds: 0,

        // 当前播放
        currentMessage: null,
        scrollTimer: 0,
        scrollDuration: 0,
        _queuePaused: false,

        // 回调
        onNewMessage: null,
        onQueueChange: null,

        // 引用
        _distressIndex: 0,
        _baseNoticeIndex: 0,
        _arkResonanceIndex: 0,
        _staticIndex: 0,

        // ==================== 初始化 ====================
        init: function () {
            this.messageQueue = [];
            this.messageHistory = [];
            this._distressIndex = 0;
            this._baseNoticeIndex = 0;
            this._arkResonanceIndex = 0;
            this._staticIndex = 0;
            this.baseNoticeTriggered = false;
            this.distressInterval = this._distressMin + Math.random() * (this._distressMax - this._distressMin);
            this.distressTimer = 10;  // 启动后10秒立即生成第一条求救信号
            this.staticInterval = this._staticMin + Math.random() * (this._staticMax - this._staticMin);
            this.staticTimer = 30;    // 30秒后生成第一条环境杂波
            this.gameTimeSeconds = 0;
            this.lastBroadcastTime = 0;
            this.currentMessage = null;
            this.scrollTimer = 0;
            this._queuePaused = false;

            // 种子消息：启动时立即放入一条基地公告
            this.generateBaseNotice();
        },

        // ==================== 消息生成 ====================
        _generateMsgId: function () {
            return 'bc_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        },

        _buildMessage: function (template, type, override) {
            override = override || {};
            var cfg = TYPE_CONFIG[type];
            var msg = {
                id: override.id || template.id || this._generateMsgId(),
                type: type,
                priority: override.priority !== undefined ? override.priority : cfg.priority,
                text: template.text || '',
                sender: override.sender || template.sender || cfg.prefix,
                timestamp: Date.now(),
                ttl: override.ttl !== undefined ? override.ttl : (template.ttl !== undefined ? template.ttl : -1),
                actionType: override.actionType || template.actionType || EActionType.None,
                actionParam: override.actionParam || template.actionParam || '',
                isRead: false,
                isIntercepted: type === EBroadcastType.EnemyComm,
                signalQuality: override.signalQuality !== undefined ? override.signalQuality : (template.signalQuality !== undefined ? template.signalQuality : 1.0),
                soundId: ''
            };
            return msg;
        },

        /** 生成求救信号 */
        generateDistress: function () {
            var tmpl = DISTRESS_POOL[this._distressIndex % DISTRESS_POOL.length];
            this._distressIndex++;
            var msg = this._buildMessage(tmpl, EBroadcastType.Distress);
            this._enqueue(msg);
            return msg;
        },

        /** 生成基地公告 */
        generateBaseNotice: function () {
            if (this.baseNoticeTriggered) return null;
            this.baseNoticeTriggered = true;
            var tmpl = BASE_NOTICE_POOL[this._baseNoticeIndex % BASE_NOTICE_POOL.length];
            this._baseNoticeIndex++;
            var msg = this._buildMessage(tmpl, EBroadcastType.BaseNotice);
            this._enqueue(msg);
            return msg;
        },

        /** 生成方舟共鸣 */
        generateArkResonance: function () {
            var tmpl = ARK_RESONANCE_POOL[this._arkResonanceIndex % ARK_RESONANCE_POOL.length];
            this._arkResonanceIndex++;
            var msg = this._buildMessage(tmpl, EBroadcastType.ArkResonance);
            this._enqueue(msg);
            return msg;
        },

        /** 生成环境杂波 */
        generateStatic: function () {
            var texts = [
                '...有人在吗...频道...重复...坐标...',
                '...听到请回答...我们还有...个人...',
                '...该死的...信号...又断了...',
                '...今天...天空...红色...不正常...',
                '...食物...还能撑...天...'
            ];
            var tmpl = { id: this._generateMsgId(), text: texts[Math.floor(Math.random() * texts.length)], sender: '未知', ttl: 300, signalQuality: 0.25 };
            var msg = this._buildMessage(tmpl, EBroadcastType.Static);
            this._enqueue(msg);
            return msg;
        },

        // ==================== 队列管理 ====================
        _enqueue: function (msg) {
            // 队列已满 → 检查是否可替换
            if (this.messageQueue.length >= this._queueMax) {
                // 找最低优先级最旧消息
                var lowestIdx = -1;
                var lowestPri = -1;
                for (var i = 0; i < this.messageQueue.length; i++) {
                    if (this.messageQueue[i].priority > lowestPri) {
                        lowestPri = this.messageQueue[i].priority;
                        lowestIdx = i;
                    }
                }
                if (msg.priority < lowestPri) {
                    // 新消息优先级更高 → 替换
                    this.messageQueue.splice(lowestIdx, 1);
                } else {
                    // 丢弃新消息
                    return;
                }
            }

            // 同类型最多2条限制
            var sameTypeCount = 0;
            for (var j = 0; j < this.messageQueue.length; j++) {
                if (this.messageQueue[j].type === msg.type) sameTypeCount++;
            }
            if (sameTypeCount >= 2) return;

            // 按优先级插入
            var inserted = false;
            for (var k = 0; k < this.messageQueue.length; k++) {
                if (msg.priority < this.messageQueue[k].priority) {
                    this.messageQueue.splice(k, 0, msg);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                this.messageQueue.push(msg);
            }

            // 加入历史
            this.messageHistory.push(msg);
            if (this.messageHistory.length > this._historyMax) {
                this.messageHistory.shift();
            }

            // 触发回调
            if (this.onNewMessage) {
                this.onNewMessage(msg);
            }
            if (this.onQueueChange) {
                this.onQueueChange();
            }
        },

        /** 获取下一条待播消息 */
        dequeueNext: function () {
            if (this.messageQueue.length === 0) return null;
            // 战斗中只播 URGENT/HIGH
            if (this.isInCombat) {
                for (var i = 0; i < this.messageQueue.length; i++) {
                    if (this.messageQueue[i].priority <= EPriority.HIGH) {
                        return this.messageQueue.splice(i, 1)[0];
                    }
                }
                return null;
            }
            return this.messageQueue.shift();
        },

        /** 获取队列长度 */
        getQueueLength: function () {
            return this.messageQueue.length;
        },

        /** 获取未读消息数 */
        getUnreadCount: function () {
            var count = 0;
            for (var i = 0; i < this.messageHistory.length; i++) {
                if (!this.messageHistory[i].isRead) count++;
            }
            return count;
        },

        // ==================== 更新循环 ====================
        update: function (dt) {
            if (this._queuePaused) return;

            this.gameTimeSeconds += dt;
            this.lastBroadcastTime += dt;

            // 定时器更新
            this.distressTimer -= dt;
            if (this.distressTimer <= 0 && !this.isInCombat) {
                this.generateDistress();
                this.distressInterval = this._distressMin + Math.random() * (this._distressMax - this._distressMin);
                this.distressTimer = this.distressInterval;
            }

            // 环境杂波定时器
            this.staticTimer -= dt;
            if (this.staticTimer <= 0 && !this.isInCombat) {
                this.generateStatic();
                this.staticInterval = this._staticMin + Math.random() * (this._staticMax - this._staticMin);
                this.staticTimer = this.staticInterval;
            }

            // 滚动计时
            if (this.currentMessage && this.scrollTimer > 0) {
                this.scrollTimer -= dt;
                if (this.scrollTimer <= 0) {
                    this.currentMessage = null;
                }
            }

            // 自动播放下一条
            if (!this.currentMessage && this.messageQueue.length > 0) {
                var minInterval = this.isInCombat ? 10 : 8;  // Demo：8秒间隔
                if (this.lastBroadcastTime >= minInterval) {
                    this.currentMessage = this.dequeueNext();
                    if (this.currentMessage) {
                        this.lastBroadcastTime = 0;
                        var cfg = TYPE_CONFIG[this.currentMessage.type];
                        var textLen = this.currentMessage.text.length;
                        this.scrollDuration = textLen * 0.08 + 3; // 估算滚动时长
                        this.scrollTimer = this.scrollDuration;
                    }
                }
            }
        },

        /** 暂停队列（方舟站内） */
        pause: function () { this._queuePaused = true; },
        /** 恢复队列 */
        resume: function () { this._queuePaused = false; },

        /** 进入方舟站 */
        onEnterArkStation: function () {
            this.isInArkStation = true;
            this.pause();
            this.generateBaseNotice();
        },

        /** 离开方舟站 */
        onLeaveArkStation: function () {
            this.isInArkStation = false;
            this.baseNoticeTriggered = false;
            this.resume();
        },

        /** 战斗开始 */
        onCombatStart: function () { this.isInCombat = true; },
        /** 战斗结束 */
        onCombatEnd: function () { this.isInCombat = false; },

        /** 方舟升级时触发 */
        onArkLevelUp: function () {
            this.generateArkResonance();
        },

        /** 获取信号质量文本（模拟干扰），缓存结果防止UI抖动 */
        getScrambledText: function (msg) {
            var quality = msg.signalQuality;
            if (quality >= 0.8) return msg.text;
            if (msg._cachedScrambled) return msg._cachedScrambled;
            var ratio = quality < 0.3 ? 0.4 : (quality < 0.5 ? 0.25 : 0.1);
            var chars = msg.text.split('');
            for (var i = 0; i < chars.length; i++) {
                if (chars[i] === ' ' || chars[i] === '·' || chars[i] === '，' || chars[i] === '。') continue;
                if (Math.random() < ratio) chars[i] = '█';
            }
            msg._cachedScrambled = chars.join('');
            return msg._cachedScrambled;
        },

        /** 检查消息是否过期 */
        isExpired: function (msg) {
            if (msg.ttl === -1) return false;
            var elapsed = (Date.now() - msg.timestamp) / 1000;
            return elapsed > msg.ttl;
        },

        /** 获取消息剩余TTL文本 */
        getTTLText: function (msg) {
            if (msg.ttl === -1) return '';
            var elapsed = (Date.now() - msg.timestamp) / 1000;
            var remaining = Math.max(0, msg.ttl - elapsed);
            if (remaining <= 0) return '已过期';
            var h = Math.floor(remaining / 3600);
            var m = Math.floor((remaining % 3600) / 60);
            if (h > 0) return h + '小时' + m + '分后过期';
            return m + '分后过期';
        },

        /** 标记消息已读 */
        markRead: function (msgId) {
            for (var i = 0; i < this.messageHistory.length; i++) {
                if (this.messageHistory[i].id === msgId) {
                    this.messageHistory[i].isRead = true;
                    break;
                }
            }
        },

        /** 标记全部已读 */
        markAllRead: function () {
            for (var i = 0; i < this.messageHistory.length; i++) {
                this.messageHistory[i].isRead = true;
            }
        },

        /** 清空已读消息 */
        clearRead: function () {
            this.messageHistory = this.messageHistory.filter(function (m) { return !m.isRead; });
        },

        /** 获取历史消息（按时间倒序） */
        getHistory: function () {
            var sorted = this.messageHistory.slice();
            sorted.sort(function (a, b) { return b.timestamp - a.timestamp; });
            return sorted;
        }
    };

    // ==================== 简易任务系统 ====================
    const QuestManager = {
        quests: [],
        _maxQuests: 5,

        /** 接受任务 */
        acceptQuest: function (msg) {
            if (this.quests.length >= this._maxQuests) {
                return { success: false, reason: '任务已满·请先完成或放弃现有任务' };
            }
            if (BroadcastManager.isExpired(msg)) {
                return { success: false, reason: '该求救信号已过期' };
            }
            var param = {};
            try { param = JSON.parse(msg.actionParam); } catch (e) { }
            var quest = {
                id: param.questId || msg.id,
                name: '救援任务：' + (param.area || '未知区域'),
                desc: msg.text,
                area: param.area || '未知区域',
                enemies: param.enemies || 1,
                timeLimit: param.timeLimit || 600,
                reward: param.reward || { exp: 100, gold: 50 },
                startTime: Date.now(),
                broadcastMsgId: msg.id,
                status: 'active'  // active / completed / failed
            };
            this.quests.push(quest);
            // 更新广播消息的actionParam
            msg.actionParam = JSON.stringify(Object.assign(param, { accepted: true }));
            return { success: true, quest: quest };
        },

        /** 获取任务列表 */
        getQuests: function () {
            var now = Date.now();
            for (var i = 0; i < this.quests.length; i++) {
                var q = this.quests[i];
                if (q.status === 'active' && (now - q.startTime) / 1000 > q.timeLimit) {
                    q.status = 'failed';
                }
            }
            return this.quests;
        },

        /** 完成任务 */
        completeQuest: function (questId) {
            for (var i = 0; i < this.quests.length; i++) {
                if (this.quests[i].id === questId && this.quests[i].status === 'active') {
                    this.quests[i].status = 'completed';
                    return this.quests[i].reward;
                }
            }
            return null;
        },

        /** 放弃任务 */
        abandonQuest: function (questId) {
            for (var i = 0; i < this.quests.length; i++) {
                if (this.quests[i].id === questId) {
                    this.quests.splice(i, 1);
                    return true;
                }
            }
            return false;
        }
    };

    // ==================== 暴露到全局 ====================
    window.BroadcastManager = BroadcastManager;
    window.QuestManager = QuestManager;
    window.EBroadcastType = EBroadcastType;
    window.EPriority = EPriority;
    window.EActionType = EActionType;
    window.TYPE_CONFIG = TYPE_CONFIG;

    console.log('[广播系统] P0最小集已加载 | 3种类型·12条内容·广播管理器+任务系统');
})();
