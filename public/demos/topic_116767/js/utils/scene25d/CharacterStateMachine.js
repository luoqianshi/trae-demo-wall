var CharacterStateMachine = (function() {
    'use strict';

    var STATES = {
        IDLE: 'idle',
        RENOVATING: 'renovating',
        STUDYING: 'studying',
        SHOPPING: 'shopping',
        RESTING: 'resting',
        PROBLEM: 'problem'
    };

    var SPRITE_STATE_MAP = {
        idle: 'idle',
        renovating: 'work',
        studying: 'thinking',
        shopping: 'walk',
        resting: 'sleep',
        problem: 'confused'
    };

    var STATE_REGION_MAP = {
        idle: 'livingroom',
        renovating: null,
        studying: 'study',
        shopping: 'entryway',
        resting: 'bedroom',
        problem: null
    };

    var STATE_DIALOGUES = {
        idle: [
            '今天想做什么呢？',
            '有什么我可以帮忙的吗？',
            '随时准备好为您服务~',
            '装修进行得怎么样啦？'
        ],
        renovating: [
            '努力装修中，加油！',
            '这一步很关键，要仔细哦~',
            '叮叮当当，装修进行时！',
            '看着家一点点变好，真开心~'
        ],
        studying: [
            '让我研究一下装修知识...',
            '学海无涯，装修知识可真多呀~',
            '这个知识点很重要，记下来！',
            '好好学习，天天向上~'
        ],
        shopping: [
            '出发去买装修材料啦！',
            '选材料要货比三家哦~',
            '买买买，为新家添置东西~',
            '猜猜我买了什么好东西？'
        ],
        resting: [
            'zzZ... 休息一下...',
            '工作辛苦了，好好休息~',
            '养足精神，明天继续加油！',
            '午安~ 做个好梦...'
        ],
        problem: [
            '咦？这个问题有点难...',
            '让我想想怎么办才好...',
            '遇到问题了，需要帮忙吗？',
            '别着急，我们一起想办法~'
        ]
    };

    var STATE_TRANSITIONS = {
        idle: ['renovating', 'studying', 'shopping', 'resting', 'problem'],
        renovating: ['idle', 'celebrating', 'problem'],
        studying: ['idle', 'renovating', 'problem'],
        shopping: ['idle', 'renovating', 'problem'],
        resting: ['idle', 'problem'],
        problem: ['idle', 'renovating', 'studying']
    };

    var STAGE_REGION_MAP = {
        1: 'entryway',
        2: 'entryway',
        3: 'livingroom',
        4: 'study',
        5: 'balcony',
        6: 'bedroom'
    };

    var REGION_RANDOM_POOL = ['livingroom', 'kitchen', 'study', 'bedroom', 'balcony', 'entryway'];

    function CharacterStateMachine(options) {
        options = options || {};
        this.nianSprite = options.nianSprite || null;
        this.speechBubble = options.speechBubble || null;
        this.regionManager = options.regionManager || null;
        this.container = options.container || null;

        this.currentState = STATES.IDLE;
        this.previousState = null;
        this._initialized = false;
        this._isTransitioning = false;

        this._currentRegionId = null;
        this._celebrateTimeout = null;
        this._autoReturnTimeout = null;
        this._bubbleFollowUpdate = null;
    }

    CharacterStateMachine.prototype.init = function(options) {
        if (this._initialized) return;
        options = options || {};

        if (options.nianSprite) this.nianSprite = options.nianSprite;
        if (options.speechBubble) this.speechBubble = options.speechBubble;
        if (options.regionManager) this.regionManager = options.regionManager;
        if (options.container) this.container = options.container;

        var savedState = null;
        try {
            if (typeof CultivationData !== 'undefined' && 
                typeof CultivationData.getCharacterState === 'function') {
                savedState = CultivationData.getCharacterState();
            }
        } catch (e) {
            console.warn('[CharacterStateMachine] Failed to load saved state:', e);
        }

        if (savedState && STATES[savedState.toUpperCase()]) {
            this.currentState = savedState;
        }

        this._bindEvents();
        this._initialized = true;

        this._applyState(this.currentState, true);

        return true;
    };

    CharacterStateMachine.prototype._bindEvents = function() {
        var self = this;

        if (typeof EventBus !== 'undefined' && EventBus.EVENTS) {
            if (EventBus.EVENTS.STEP_COMPLETED) {
                EventBus.on(EventBus.EVENTS.STEP_COMPLETED, function(data) {
                    self._onStepCompleted(data);
                });
            }

            if (EventBus.EVENTS.SOP_STAGE_COMPLETE) {
                EventBus.on(EventBus.EVENTS.SOP_STAGE_COMPLETE, function(data) {
                    self._onStageComplete(data);
                });
            }

            if (EventBus.EVENTS.VIEW_CHANGED) {
                EventBus.on(EventBus.EVENTS.VIEW_CHANGED, function(data) {
                    self._onViewChanged(data);
                });
            }

            if (!EventBus.EVENTS.CHARACTER_STATE_CHANGED) {
                EventBus.EVENTS.CHARACTER_STATE_CHANGED = 'character:stateChanged';
            }
            if (!EventBus.EVENTS.CHARACTER_CELEBRATE) {
                EventBus.EVENTS.CHARACTER_CELEBRATE = 'character:celebrate';
            }
        }
    };

    CharacterStateMachine.prototype.canTransitionTo = function(targetState) {
        if (!targetState) return false;
        if (this.currentState === targetState) return false;
        
        var allowed = STATE_TRANSITIONS[this.currentState];
        if (!allowed) return false;
        
        return allowed.indexOf(targetState) !== -1;
    };

    CharacterStateMachine.prototype.changeState = function(targetState, options) {
        if (!this._initialized) return false;
        if (this._isTransitioning) return false;

        options = options || {};

        if (!targetState || !STATES[targetState.toUpperCase()]) {
            console.warn('[CharacterStateMachine] Invalid state:', targetState);
            return false;
        }

        targetState = targetState.toLowerCase();

        if (this.currentState === targetState) {
            this._showStateDialogue(targetState);
            return true;
        }

        var oldState = this.currentState;
        this.previousState = oldState;
        this.currentState = targetState;
        this._isTransitioning = true;

        this._saveState(targetState, options.reason);

        var self = this;
        this._transitionToState(oldState, targetState, options, function() {
            self._isTransitioning = false;
            self._emitStateChange(oldState, targetState, options.reason);
        });

        return true;
    };

    CharacterStateMachine.prototype._transitionToState = function(fromState, toState, options, callback) {
        var self = this;
        options = options || {};
        var targetRegionId = this._getTargetRegion(toState);

        var moveDuration = 0;
        if (this.nianSprite && targetRegionId && this.regionManager) {
            var targetPos = this._getRegionPosition(targetRegionId);
            if (targetPos) {
                moveDuration = this._calculateMoveDuration(targetPos.x, targetPos.y);
            }
        }

        if (this.nianSprite && moveDuration > 0) {
            this.nianSprite.setState('walk');
            var targetPos = this._getRegionPosition(targetRegionId);
            this.nianSprite.moveTo(targetPos.x, targetPos.y, moveDuration, function() {
                self._applyState(toState, false);
                if (callback) callback();
            });
        } else {
            this._applyState(toState, true);
            if (callback) callback();
        }

        if (this._autoReturnTimeout) {
            clearTimeout(this._autoReturnTimeout);
            this._autoReturnTimeout = null;
        }

        if (toState !== STATES.IDLE && options && options.autoReturn !== false) {
            var autoReturnDelay = options.autoReturnDelay || 8000;
            this._autoReturnTimeout = setTimeout(function() {
                if (self.currentState === toState) {
                    self.changeState(STATES.IDLE, { reason: 'auto_return' });
                }
            }, autoReturnDelay);
        }
    };

    CharacterStateMachine.prototype._applyState = function(state, immediate) {
        var spriteState = SPRITE_STATE_MAP[state] || 'idle';
        
        if (this.nianSprite) {
            this.nianSprite.setState(spriteState);
        }

        this._showStateDialogue(state);

        var regionId = this._getTargetRegion(state);
        if (regionId) {
            this._currentRegionId = regionId;
        }

        if (immediate && this.regionManager && this.nianSprite) {
            var pos = this._getRegionPosition(regionId);
            if (pos) {
                this.nianSprite.setPosition(pos.x, pos.y);
            }
        }
    };

    CharacterStateMachine.prototype._getTargetRegion = function(state) {
        var regionId = STATE_REGION_MAP[state];
        
        if (state === STATES.RENOVATING) {
            regionId = this._getRenovatingRegion();
        } else if (state === STATES.PROBLEM) {
            regionId = this._getRandomRegion();
        }

        return regionId;
    };

    CharacterStateMachine.prototype._getRenovatingRegion = function() {
        try {
            if (typeof App !== 'undefined' && typeof App.getDecorationMode === 'function') {
                var mode = App.getDecorationMode();
                var sopProgress = App.state && App.state.sopProgress 
                    ? App.state.sopProgress[mode] 
                    : null;
                
                if (sopProgress && sopProgress.currentStep) {
                    var match = sopProgress.currentStep.match(/^[FHS](\d+)-/);
                    if (match) {
                        var stage = parseInt(match[1], 10);
                        if (STAGE_REGION_MAP[stage]) {
                            return STAGE_REGION_MAP[stage];
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('[CharacterStateMachine] Failed to get renovating region:', e);
        }
        return 'livingroom';
    };

    CharacterStateMachine.prototype._getRandomRegion = function() {
        var index = Math.floor(Math.random() * REGION_RANDOM_POOL.length);
        return REGION_RANDOM_POOL[index];
    };

    CharacterStateMachine.prototype._getRegionPosition = function(regionId) {
        if (!this.regionManager || !regionId) return null;

        var region = this.regionManager.getRegion(regionId);
        if (!region) return null;

        var x = region.x + region.width / 2;
        var y = region.y + region.height * 0.7;

        return { x: x, y: y };
    };

    CharacterStateMachine.prototype._calculateMoveDuration = function(targetX, targetY) {
        if (!this.nianSprite) return 0;

        var dx = targetX - this.nianSprite.x;
        var dy = targetY - this.nianSprite.y;
        var distance = Math.sqrt(dx * dx + dy * dy);

        var speed = 0.15;
        var duration = distance / speed;

        return Math.max(500, Math.min(duration, 3000));
    };

    CharacterStateMachine.prototype._showStateDialogue = function(state) {
        if (!this.speechBubble) return;

        var dialogues = STATE_DIALOGUES[state];
        if (!dialogues || dialogues.length === 0) return;

        var randomIndex = Math.floor(Math.random() * dialogues.length);
        var text = dialogues[randomIndex];

        var spriteState = SPRITE_STATE_MAP[state] || 'idle';

        try {
            this.speechBubble.setStateIcon(spriteState);
            this.speechBubble.setText(text, true);
            this.speechBubble.show();
            this._updateBubblePosition();
        } catch (e) {
            console.warn('[CharacterStateMachine] Failed to show dialogue:', e);
        }
    };

    CharacterStateMachine.prototype._updateBubblePosition = function() {
        if (!this.speechBubble || !this.nianSprite) return;

        try {
            var x = this.nianSprite.x + this.nianSprite.width / 2;
            var y = this.nianSprite.y;
            this.speechBubble.setPosition(x, y);
        } catch (e) {
        }
    };

    CharacterStateMachine.prototype._saveState = function(state, reason) {
        try {
            if (typeof CultivationData !== 'undefined' && 
                typeof CultivationData.setCharacterState === 'function') {
                CultivationData.setCharacterState(state, reason);
            }
        } catch (e) {
            console.warn('[CharacterStateMachine] Failed to save state:', e);
        }
    };

    CharacterStateMachine.prototype._emitStateChange = function(oldState, newState, reason) {
        try {
            if (typeof EventBus !== 'undefined' && EventBus.EVENTS && EventBus.EVENTS.CHARACTER_STATE_CHANGED) {
                EventBus.emit(EventBus.EVENTS.CHARACTER_STATE_CHANGED, {
                    oldState: oldState,
                    newState: newState,
                    reason: reason || ''
                });
            }
        } catch (e) {
            console.warn('[CharacterStateMachine] Failed to emit state change:', e);
        }
    };

    CharacterStateMachine.prototype._onStepCompleted = function(data) {
        var self = this;
        this.triggerCelebrate();

        setTimeout(function() {
            if (self._celebrateTimeout) {
                return;
            }
            self.changeState(STATES.RENOVATING, { 
                reason: 'step_completed',
                autoReturnDelay: 6000
            });
        }, 2500);
    };

    CharacterStateMachine.prototype._onStageComplete = function(data) {
        this.triggerCelebrate(3000);
    };

    CharacterStateMachine.prototype._onViewChanged = function(data) {
        if (!data || !data.view) return;

        var view = data.view;

        if (view === 'sop') {
            this.changeState(STATES.RENOVATING, { 
                reason: 'enter_sop',
                autoReturn: false
            });
        } else if (view === 'home') {
            this._updateStateFromProgress();
        } else if (view === 'knowledge') {
            this.changeState(STATES.STUDYING, { 
                reason: 'enter_knowledge',
                autoReturnDelay: 10000
            });
        } else if (view === 'tools') {
            this.changeState(STATES.STUDYING, { 
                reason: 'enter_tools',
                autoReturnDelay: 8000
            });
        } else if (view === 'budget') {
            this.changeState(STATES.PROBLEM, { 
                reason: 'enter_budget',
                autoReturnDelay: 8000
            });
        }
    };

    CharacterStateMachine.prototype._updateStateFromProgress = function() {
        try {
            var completedSteps = 0;
            if (typeof App !== 'undefined' && typeof App.getDecorationMode === 'function') {
                var mode = App.getDecorationMode();
                var sopProgress = App.state && App.state.sopProgress 
                    ? App.state.sopProgress[mode] 
                    : null;
                
                if (sopProgress && sopProgress.completedSteps) {
                    completedSteps = sopProgress.completedSteps.length;
                }
            }

            if (completedSteps === 0) {
                this.changeState(STATES.IDLE, { reason: 'home_no_progress' });
            } else {
                this.changeState(STATES.IDLE, { reason: 'home_with_progress' });
            }
        } catch (e) {
            console.warn('[CharacterStateMachine] Failed to update state from progress:', e);
            this.changeState(STATES.IDLE, { reason: 'home_fallback' });
        }
    };

    CharacterStateMachine.prototype.triggerCelebrate = function(duration) {
        if (!this.nianSprite) return;
        if (this._celebrateTimeout) return;

        duration = duration || 2000;
        var previousState = this.currentState;
        var previousSpriteState = this.nianSprite.currentState || 
            (this.nianSprite.getCurrentState ? this.nianSprite.getCurrentState() : 'idle');

        this.nianSprite.setState('celebrate');

        var self = this;
        this._celebrateTimeout = setTimeout(function() {
            self._celebrateTimeout = null;
            if (self.nianSprite) {
                self.nianSprite.setState(previousSpriteState || 'idle');
            }
        }, duration);

        try {
            if (typeof EventBus !== 'undefined' && EventBus.EVENTS && EventBus.EVENTS.CHARACTER_CELEBRATE) {
                EventBus.emit(EventBus.EVENTS.CHARACTER_CELEBRATE, {
                    duration: duration,
                    previousState: previousState
                });
            }
        } catch (e) {
        }
    };

    CharacterStateMachine.prototype.getCurrentState = function() {
        return this.currentState;
    };

    CharacterStateMachine.prototype.getCurrentRegion = function() {
        return this._currentRegionId;
    };

    CharacterStateMachine.prototype.isTransitioning = function() {
        return this._isTransitioning;
    };

    CharacterStateMachine.prototype.setNianSprite = function(sprite) {
        this.nianSprite = sprite || null;
    };

    CharacterStateMachine.prototype.setSpeechBubble = function(bubble) {
        this.speechBubble = bubble || null;
    };

    CharacterStateMachine.prototype.setRegionManager = function(manager) {
        this.regionManager = manager || null;
    };

    CharacterStateMachine.prototype.update = function(deltaTime) {
        this._updateBubblePosition();
    };

    CharacterStateMachine.prototype.showTip = function(text, stateIcon, duration) {
        if (!this.speechBubble) return;

        if (stateIcon) {
            this.speechBubble.setStateIcon(stateIcon);
        }
        this.speechBubble.setText(text, true);
        this.speechBubble.show();
        this._updateBubblePosition();

        if (duration && duration > 0) {
            var self = this;
            setTimeout(function() {
                if (self.speechBubble) {
                    self.speechBubble.hide();
                }
            }, duration);
        }
    };

    CharacterStateMachine.prototype.reset = function() {
        if (this._celebrateTimeout) {
            clearTimeout(this._celebrateTimeout);
            this._celebrateTimeout = null;
        }
        if (this._autoReturnTimeout) {
            clearTimeout(this._autoReturnTimeout);
            this._autoReturnTimeout = null;
        }

        this.currentState = STATES.IDLE;
        this.previousState = null;
        this._isTransitioning = false;
        this._currentRegionId = null;

        if (this.nianSprite) {
            this.nianSprite.setState('idle');
        }
        if (this.speechBubble) {
            this.speechBubble.hide();
        }

        this._saveState(STATES.IDLE, 'reset');
    };

    CharacterStateMachine.prototype.destroy = function() {
        if (this._celebrateTimeout) {
            clearTimeout(this._celebrateTimeout);
            this._celebrateTimeout = null;
        }
        if (this._autoReturnTimeout) {
            clearTimeout(this._autoReturnTimeout);
            this._autoReturnTimeout = null;
        }

        this.nianSprite = null;
        this.speechBubble = null;
        this.regionManager = null;
        this.container = null;
        this._initialized = false;
    };

    return {
        CharacterStateMachine: CharacterStateMachine,
        STATES: STATES,
        create: function(options) {
            return new CharacterStateMachine(options);
        }
    };
})();
