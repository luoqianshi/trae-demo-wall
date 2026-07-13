var DialogueSystem = (function() {
    'use strict';

    var dialogueHistory = [];
    var autoDialogueTimer = null;
    var autoDialogueInterval = 10000;
    var isAutoDialoguePaused = false;
    var speechBubble = null;
    var nianSprite = null;
    var lastDialogueState = null;
    var _initialized = false;

    var STATE_DIALOGUES = {
        idle: [
            '今天想做什么呢？',
            '有什么我可以帮忙的吗？',
            '随时准备好为您服务~',
            '装修进行得怎么样啦？',
            '今天天气真不错呢~',
            '休息一下也很重要哦~',
            '有问题随时找我呀~',
            '期待新家的样子！',
            '装修是件快乐的事~',
            '要不要看看装修知识呀？'
        ],
        renovating: [
            '努力装修中，加油！',
            '这一步很关键，要仔细哦~',
            '叮叮当当，装修进行时！',
            '看着家一点点变好，真开心~',
            '施工安全第一哦~',
            '一步一步来，不着急~',
            '师傅们辛苦啦！',
            '装修就是创造美的过程~',
            '每一步都在接近梦想家~',
            '质量把控很重要！'
        ],
        studying: [
            '让我研究一下装修知识...',
            '学海无涯，装修知识可真多呀~',
            '这个知识点很重要，记下来！',
            '好好学习，天天向上~',
            '装修学问可真不少~',
            '知识就是力量！',
            '研究研究怎么装更好看~',
            '多学一点总是好的~',
            '专业知识要扎实~',
            '学以致用，实践出真知~'
        ],
        shopping: [
            '出发去买装修材料啦！',
            '选材料要货比三家哦~',
            '买买买，为新家添置东西~',
            '猜猜我买了什么好东西？',
            '建材市场真是琳琅满目~',
            '选对材料很重要哦~',
            '今天又有新收获！',
            '好材料造就好品质~',
            '砍价也是一门学问~',
            '环保材料是首选！'
        ],
        resting: [
            'zzZ... 休息一下...',
            '工作辛苦了，好好休息~',
            '养足精神，明天继续加油！',
            '午安~ 做个好梦...',
            '休息是为了走更远的路~',
            '劳逸结合效率高~',
            '好好休息，明天见~',
            '睡眠很重要哦~',
            '做个关于新家的美梦~',
            '放松一下，别太累~'
        ],
        problem: [
            '咦？这个问题有点难...',
            '让我想想怎么办才好...',
            '遇到问题了，需要帮忙吗？',
            '别着急，我们一起想办法~',
            '问题总会解决的！',
            '冷静下来，分析问题~',
            '有困难找小管家~',
            '办法总比困难多~',
            '一步一步解决问题~',
            '相信我们能行的！'
        ]
    };

    var SPECIAL_DIALOGUES = {
        levelUp: [
            '恭喜升级啦！小管家也变强了~',
            '哇！等级提升了，继续加油！',
            '太棒了！又向梦想家迈进了一步~',
            '等级提升！解锁了新内容哦~',
            '恭喜恭喜！您真是太厉害了~'
        ],
        achievement: [
            '哇！解锁了新成就！太厉害啦~',
            '成就达成！您真棒！',
            '又获得一个成就，继续加油~',
            '成就满满，收获多多！',
            '太厉害了！这个成就可不简单~'
        ],
        newFurniture: [
            '新家具解锁啦！家越来越美了~',
            '哇！又有新家具了，好开心~',
            '家具收藏+1，继续收集吧~',
            '新家具有新风貌！',
            '这个家具真好看，我喜欢~'
        ],
        dailyGreeting: {
            morning: [
                '早上好！新的一天开始啦~',
                '早安！今天也要元气满满哦~',
                '早上好！今天想做什么装修呢？',
                '早安~ 又是美好的一天！',
                '早上好！让我们一起加油吧~'
            ],
            afternoon: [
                '下午好！装修进度怎么样啦？',
                '午安~ 休息一下再继续吧~',
                '下午好！今天效率真高~',
                '午后时光，来杯下午茶吧~',
                '下午好！继续为梦想家努力~'
            ],
            evening: [
                '晚上好！今天辛苦了~',
                '晚安前记得好好休息哦~',
                '晚上好！今天过得真充实~',
                '夜幕降临，家也变得温馨了~',
                '晚上好！明天继续加油~'
            ]
        },
        taskComplete: [
            '任务完成！太棒了~',
            '任务达成！继续加油哦~',
            '又完成一个任务，真厉害！',
            '任务完成，奖励拿到手软~',
            '今日任务完成，可以休息啦~'
        ],
        stageComplete: [
            '阶段完成！家又变美了~',
            '太棒了！这个阶段圆满完成~',
            '阶段性胜利，继续前进！',
            '又解锁新阶段啦，恭喜~',
            '离梦想家又近了一步！'
        ]
    };

    var CLICK_RESPONSES = {
        happy: [
            '嘿嘿，被发现啦~',
            '你好呀！今天过得怎么样？',
            '找我有什么事吗？',
            '我在呢~ 有什么需要帮忙的？',
            '哇！你点我了，好开心~',
            '随时为您服务~',
            '有什么想聊的吗？',
            '我正在想你呢~'
        ],
        curious: [
            '嗯？怎么啦？',
            '有什么问题吗？',
            '需要我帮忙吗？',
            '想了解装修知识吗？',
            '有什么我能做的吗？',
            '是关于装修的问题吗？',
            '别客气，尽管问~',
            '我随时都在哦~'
        ],
        playful: [
            '嘻嘻，点我点我~',
            '不要一直点人家啦~',
            '再点我就要害羞了~',
            '你真调皮~',
            '我们来玩个游戏吧~',
            '点一下，说句话~',
            '嘿嘿，被你抓到了~',
            '我在这呢~'
        ]
    };

    function init(options) {
        if (_initialized) return;
        options = options || {};
        
        speechBubble = options.speechBubble || null;
        nianSprite = options.nianSprite || null;
        
        bindEvents();
        _initialized = true;
        
        console.log('[DialogueSystem] Initialized');
    }

    function bindEvents() {
        if (typeof EventBus !== 'undefined' && EventBus.EVENTS) {
            if (EventBus.EVENTS.LEVEL_UP) {
                EventBus.on(EventBus.EVENTS.LEVEL_UP, function() {
                    triggerSpecialDialogue('levelUp');
                });
            }
            if (EventBus.EVENTS.ACHIEVEMENT_UNLOCKED) {
                EventBus.on(EventBus.EVENTS.ACHIEVEMENT_UNLOCKED, function() {
                    triggerSpecialDialogue('achievement');
                });
            }
            if (EventBus.EVENTS.STEP_COMPLETED) {
                EventBus.on(EventBus.EVENTS.STEP_COMPLETED, function() {
                    triggerSpecialDialogue('newFurniture');
                });
            }
            if (EventBus.EVENTS.SOP_STAGE_COMPLETE) {
                EventBus.on(EventBus.EVENTS.SOP_STAGE_COMPLETE, function() {
                    triggerSpecialDialogue('stageComplete');
                });
            }
        }
    }

    function getRandomDialogue(state) {
        var dialogues = STATE_DIALOGUES[state];
        if (!dialogues || dialogues.length === 0) {
            return '你好呀~';
        }
        var index = Math.floor(Math.random() * dialogues.length);
        return dialogues[index];
    }

    function getSpecialDialogue(type) {
        var dialogues = SPECIAL_DIALOGUES[type];
        
        if (type === 'dailyGreeting') {
            var hour = new Date().getHours();
            var period = 'morning';
            if (hour >= 12 && hour < 18) {
                period = 'afternoon';
            } else if (hour >= 18) {
                period = 'evening';
            }
            dialogues = SPECIAL_DIALOGUES.dailyGreeting[period];
        }
        
        if (!dialogues || dialogues.length === 0) {
            return null;
        }
        var index = Math.floor(Math.random() * dialogues.length);
        return dialogues[index];
    }

    function getClickResponse() {
        var categories = Object.keys(CLICK_RESPONSES);
        var category = categories[Math.floor(Math.random() * categories.length)];
        var responses = CLICK_RESPONSES[category];
        var index = Math.floor(Math.random() * responses.length);
        return {
            text: responses[index],
            category: category
        };
    }

    function showDialogue(text, state, duration) {
        if (!speechBubble) return;
        
        var bubbleState = state || 'idle';
        var bubbleDuration = duration || 4000;
        
        addToHistory(text, bubbleState);
        
        speechBubble.setText(text, true);
        speechBubble.setStateIcon(bubbleState);
        speechBubble.show();
        speechBubble.setAutoHideDuration(bubbleDuration);
    }

    function triggerRandomDialogue() {
        if (isAutoDialoguePaused) return;
        
        var currentState = getCurrentState();
        var dialogue = getRandomDialogue(currentState);
        var spriteState = mapStateToSpriteState(currentState);
        
        showDialogue(dialogue, spriteState, 3500);
    }

    function getCurrentState() {
        if (typeof CultivationData !== 'undefined' && CultivationData.getCharacterState) {
            return CultivationData.getCharacterState() || 'idle';
        }
        if (typeof CharacterStateMachine !== 'undefined') {
            if (window.__characterStateMachine && window.__characterStateMachine.currentState) {
                return window.__characterStateMachine.currentState;
            }
        }
        return 'idle';
    }

    function mapStateToSpriteState(state) {
        var stateMap = {
            idle: 'idle',
            renovating: 'work',
            studying: 'thinking',
            shopping: 'wave',
            resting: 'sleep',
            problem: 'confused'
        };
        return stateMap[state] || 'idle';
    }

    function triggerSpecialDialogue(type) {
        var dialogue = getSpecialDialogue(type);
        if (!dialogue) return;
        
        var state = 'happy';
        if (type === 'levelUp' || type === 'achievement' || type === 'stageComplete') {
            state = 'celebrate';
        } else if (type === 'newFurniture') {
            state = 'happy';
        }
        
        showDialogue(dialogue, state, 5000);
    }

    function triggerClickDialogue() {
        var response = getClickResponse();
        var state = response.category === 'happy' ? 'wave' : 
                    response.category === 'curious' ? 'thinking' : 'happy';
        
        showDialogue(response.text, state, 3000);
    }

    function triggerDailyGreeting() {
        var dialogue = getSpecialDialogue('dailyGreeting');
        if (dialogue) {
            showDialogue(dialogue, 'wave', 5000);
        }
    }

    function addToHistory(text, state) {
        dialogueHistory.push({
            text: text,
            state: state,
            timestamp: Date.now()
        });
        
        if (dialogueHistory.length > 10) {
            dialogueHistory.shift();
        }
    }

    function getHistory(limit) {
        if (limit && limit > 0) {
            return dialogueHistory.slice(-limit);
        }
        return dialogueHistory.slice();
    }

    function startAutoDialogue(interval) {
        if (interval) {
            autoDialogueInterval = interval;
        }
        stopAutoDialogue();
        
        isAutoDialoguePaused = false;
        autoDialogueTimer = setInterval(function() {
            if (!isAutoDialoguePaused && speechBubble && !speechBubble.isVisible()) {
                triggerRandomDialogue();
            }
        }, autoDialogueInterval);
    }

    function stopAutoDialogue() {
        if (autoDialogueTimer) {
            clearInterval(autoDialogueTimer);
            autoDialogueTimer = null;
        }
    }

    function pauseAutoDialogue() {
        isAutoDialoguePaused = true;
    }

    function resumeAutoDialogue() {
        isAutoDialoguePaused = false;
    }

    function setSpeechBubble(bubble) {
        speechBubble = bubble;
    }

    function setNianSprite(sprite) {
        nianSprite = sprite;
    }

    function isInitialized() {
        return _initialized;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            var bubbleEl = document.getElementById('nian-speech-bubble');
            if (bubbleEl && typeof SpeechBubble !== 'undefined') {
            }
        });
    }

    return {
        init: init,
        showDialogue: showDialogue,
        triggerRandomDialogue: triggerRandomDialogue,
        triggerSpecialDialogue: triggerSpecialDialogue,
        triggerClickDialogue: triggerClickDialogue,
        triggerDailyGreeting: triggerDailyGreeting,
        getRandomDialogue: getRandomDialogue,
        getSpecialDialogue: getSpecialDialogue,
        getClickResponse: getClickResponse,
        startAutoDialogue: startAutoDialogue,
        stopAutoDialogue: stopAutoDialogue,
        pauseAutoDialogue: pauseAutoDialogue,
        resumeAutoDialogue: resumeAutoDialogue,
        setSpeechBubble: setSpeechBubble,
        setNianSprite: setNianSprite,
        getHistory: getHistory,
        isInitialized: isInitialized,
        STATE_DIALOGUES: STATE_DIALOGUES,
        SPECIAL_DIALOGUES: SPECIAL_DIALOGUES,
        CLICK_RESPONSES: CLICK_RESPONSES
    };
})();
