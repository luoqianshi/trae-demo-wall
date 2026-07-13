var TimelinePlayer = (function() {
    'use strict';

    var PLAYER_STATE = {
        IDLE: 'idle',
        PLAYING: 'playing',
        PAUSED: 'paused',
        FINISHED: 'finished'
    };

    function TimelinePlayer() {
        this.progressSync = null;
        this.objectManager = null;
        this.container = null;
        this._element = null;
        this._initialized = false;
        this._state = PLAYER_STATE.IDLE;
        this._currentStage = 0;
        this._targetStage = 6;
        this._stageDuration = 1500;
        this._stageTransitionTimer = null;
        this._totalStages = 6;
        this._callbacks = {
            onStart: [],
            onPause: [],
            onResume: [],
            onStop: [],
            onStageChange: [],
            onComplete: [],
            onProgress: []
        };
        this._originalSteps = [];
    }

    TimelinePlayer.prototype.init = function(options) {
        if (this._initialized) return;
        options = options || {};

        this.progressSync = options.progressSync || null;
        this.objectManager = options.objectManager || null;
        this._stageDuration = options.stageDuration || 1500;

        if (options.container) {
            if (typeof options.container === 'string') {
                this.container = document.querySelector(options.container);
            } else if (options.container instanceof Element) {
                this.container = options.container;
            }
        }

        this._initialized = true;
        return true;
    };

    TimelinePlayer.prototype.play = function(options) {
        if (this._state === PLAYER_STATE.PLAYING) return;

        options = options || {};
        var startStage = options.startStage !== undefined ? options.startStage : 0;
        var endStage = options.endStage !== undefined ? options.endStage : 6;

        if (this.progressSync) {
            this._originalSteps = this.progressSync.getCompletedStepIds();
            this.progressSync.setTimelineMode(true);
        }

        this._targetStage = Math.min(Math.max(endStage, 0), 6);
        this._currentStage = Math.min(Math.max(startStage, 0), this._targetStage);
        this._state = PLAYER_STATE.PLAYING;

        this._fireStart();
        this._showStage(this._currentStage, false);
        this._advanceToNextStage();
    };

    TimelinePlayer.prototype.pause = function() {
        if (this._state !== PLAYER_STATE.PLAYING) return;

        this._state = PLAYER_STATE.PAUSED;
        if (this._stageTransitionTimer) {
            clearTimeout(this._stageTransitionTimer);
            this._stageTransitionTimer = null;
        }
        this._firePause();
    };

    TimelinePlayer.prototype.resume = function() {
        if (this._state !== PLAYER_STATE.PAUSED) return;

        this._state = PLAYER_STATE.PLAYING;
        this._fireResume();
        this._advanceToNextStage();
    };

    TimelinePlayer.prototype.stop = function() {
        if (this._state === PLAYER_STATE.IDLE) return;

        if (this._stageTransitionTimer) {
            clearTimeout(this._stageTransitionTimer);
            this._stageTransitionTimer = null;
        }

        this._state = PLAYER_STATE.IDLE;

        if (this.progressSync) {
            this.progressSync.setTimelineMode(false);
        }

        this._fireStop();
    };

    TimelinePlayer.prototype.goToStage = function(stage, animate) {
        var targetStage = Math.min(Math.max(parseInt(stage), 0), 6);
        this._currentStage = targetStage;
        this._showStage(targetStage, animate !== false);
        this._fireStageChange(targetStage);
        this._fireProgress(this._calculateProgress(targetStage));
    };

    TimelinePlayer.prototype.nextStage = function() {
        if (this._currentStage < this._targetStage) {
            this._currentStage++;
            this._showStage(this._currentStage, true);
            this._fireStageChange(this._currentStage);
            this._fireProgress(this._calculateProgress(this._currentStage));
            return true;
        }
        return false;
    };

    TimelinePlayer.prototype.prevStage = function() {
        if (this._currentStage > 0) {
            this._currentStage--;
            this._showStage(this._currentStage, true);
            this._fireStageChange(this._currentStage);
            this._fireProgress(this._calculateProgress(this._currentStage));
            return true;
        }
        return false;
    };

    TimelinePlayer.prototype._advanceToNextStage = function() {
        if (this._state !== PLAYER_STATE.PLAYING) return;

        var self = this;

        if (this._currentStage >= this._targetStage) {
            this._state = PLAYER_STATE.FINISHED;
            this._fireComplete();
            return;
        }

        this._stageTransitionTimer = setTimeout(function() {
            if (self._state !== PLAYER_STATE.PLAYING) return;

            self._currentStage++;
            self._showStage(self._currentStage, true);
            self._fireStageChange(self._currentStage);
            self._fireProgress(self._calculateProgress(self._currentStage));

            self._advanceToNextStage();
        }, this._stageDuration);
    };

    TimelinePlayer.prototype._showStage = function(stage, animate) {
        if (this.progressSync) {
            this.progressSync.showStage(stage, animate);
        }
    };

    TimelinePlayer.prototype._calculateProgress = function(stage) {
        if (this._targetStage === 0) return 0;
        return Math.round((stage / this._targetStage) * 100);
    };

    TimelinePlayer.prototype.getCurrentStage = function() {
        return this._currentStage;
    };

    TimelinePlayer.prototype.getTargetStage = function() {
        return this._targetStage;
    };

    TimelinePlayer.prototype.getState = function() {
        return this._state;
    };

    TimelinePlayer.prototype.isPlaying = function() {
        return this._state === PLAYER_STATE.PLAYING;
    };

    TimelinePlayer.prototype.isPaused = function() {
        return this._state === PLAYER_STATE.PAUSED;
    };

    TimelinePlayer.prototype.getStageInfo = function(stage) {
        if (!StepObjectMapping) return null;
        var stageNum = parseInt(stage);
        return {
            stage: stageNum,
            name: StepObjectMapping.getStageName(stageNum),
            description: StepObjectMapping.getStageDescription(stageNum),
            objects: StepObjectMapping.getObjectsForStage(stageNum)
        };
    };

    TimelinePlayer.prototype.getAllStages = function() {
        if (!StepObjectMapping) return [];
        var result = [];
        for (var i = 0; i <= 6; i++) {
            result.push(this.getStageInfo(i));
        }
        return result;
    };

    TimelinePlayer.prototype.setStageDuration = function(duration) {
        this._stageDuration = Math.max(300, parseInt(duration) || 1500);
    };

    TimelinePlayer.prototype.getStageDuration = function() {
        return this._stageDuration;
    };

    TimelinePlayer.prototype.on = function(event, callback) {
        if (this._callbacks[event] && typeof callback === 'function') {
            this._callbacks[event].push(callback);
        }
    };

    TimelinePlayer.prototype.off = function(event, callback) {
        if (this._callbacks[event]) {
            var index = this._callbacks[event].indexOf(callback);
            if (index > -1) {
                this._callbacks[event].splice(index, 1);
            }
        }
    };

    TimelinePlayer.prototype._fireStart = function() {
        for (var i = 0; i < this._callbacks.onStart.length; i++) {
            try {
                this._callbacks.onStart[i](this._currentStage, this._targetStage);
            } catch (e) {
                console.error('TimelinePlayer onStart callback error:', e);
            }
        }
    };

    TimelinePlayer.prototype._firePause = function() {
        for (var i = 0; i < this._callbacks.onPause.length; i++) {
            try {
                this._callbacks.onPause[i](this._currentStage);
            } catch (e) {
                console.error('TimelinePlayer onPause callback error:', e);
            }
        }
    };

    TimelinePlayer.prototype._fireResume = function() {
        for (var i = 0; i < this._callbacks.onResume.length; i++) {
            try {
                this._callbacks.onResume[i](this._currentStage);
            } catch (e) {
                console.error('TimelinePlayer onResume callback error:', e);
            }
        }
    };

    TimelinePlayer.prototype._fireStop = function() {
        for (var i = 0; i < this._callbacks.onStop.length; i++) {
            try {
                this._callbacks.onStop[i](this._currentStage);
            } catch (e) {
                console.error('TimelinePlayer onStop callback error:', e);
            }
        }
    };

    TimelinePlayer.prototype._fireStageChange = function(stage) {
        for (var i = 0; i < this._callbacks.onStageChange.length; i++) {
            try {
                this._callbacks.onStageChange[i](stage, this.getStageInfo(stage));
            } catch (e) {
                console.error('TimelinePlayer onStageChange callback error:', e);
            }
        }
    };

    TimelinePlayer.prototype._fireComplete = function() {
        for (var i = 0; i < this._callbacks.onComplete.length; i++) {
            try {
                this._callbacks.onComplete[i](this._targetStage);
            } catch (e) {
                console.error('TimelinePlayer onComplete callback error:', e);
            }
        }
    };

    TimelinePlayer.prototype._fireProgress = function(progress) {
        for (var i = 0; i < this._callbacks.onProgress.length; i++) {
            try {
                this._callbacks.onProgress[i](progress, this._currentStage);
            } catch (e) {
                console.error('TimelinePlayer onProgress callback error:', e);
            }
        }
    };

    TimelinePlayer.prototype.createUI = function(container) {
        if (!container) return null;

        var self = this;
        var uiContainer = container;

        if (typeof container === 'string') {
            uiContainer = document.querySelector(container);
        }

        if (!uiContainer) return null;

        var timelineEl = document.createElement('div');
        timelineEl.className = 'timeline-player-ui';
        timelineEl.style.cssText = [
            'position: relative',
            'width: 100%',
            'background: rgba(255, 255, 255, 0.95)',
            'border-radius: 12px',
            'padding: 20px',
            'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1)'
        ].join(';');

        var headerEl = document.createElement('div');
        headerEl.className = 'timeline-header';
        headerEl.style.cssText = [
            'display: flex',
            'justify-content: space-between',
            'align-items: center',
            'margin-bottom: 16px'
        ].join(';');

        var titleEl = document.createElement('div');
        titleEl.className = 'timeline-title';
        titleEl.style.cssText = [
            'font-size: 16px',
            'font-weight: 600',
            'color: #333'
        ].join(';');
        titleEl.textContent = '装修时间线';

        var closeBtn = document.createElement('button');
        closeBtn.className = 'timeline-close-btn';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.style.cssText = [
            'width: 28px',
            'height: 28px',
            'border: none',
            'background: #f5f5f5',
            'border-radius: 50%',
            'cursor: pointer',
            'font-size: 16px',
            'color: #666',
            'display: flex',
            'align-items: center',
            'justify-content: center'
        ].join(';');
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', function() {
            self.stop();
            if (timelineEl.parentNode) {
                timelineEl.style.opacity = '0';
                timelineEl.style.transform = 'translateY(20px)';
                setTimeout(function() {
                    if (timelineEl.parentNode) {
                        timelineEl.parentNode.removeChild(timelineEl);
                    }
                }, 300);
            }
        });

        headerEl.appendChild(titleEl);
        headerEl.appendChild(closeBtn);

        var stageInfoEl = document.createElement('div');
        stageInfoEl.className = 'timeline-stage-info';
        stageInfoEl.style.cssText = [
            'text-align: center',
            'margin-bottom: 20px',
            'padding: 12px',
            'background: rgba(139, 111, 71, 0.08)',
            'border-radius: 8px'
        ].join(';');

        var stageNameEl = document.createElement('div');
        stageNameEl.className = 'timeline-stage-name';
        stageNameEl.style.cssText = [
            'font-size: 18px',
            'font-weight: 600',
            'color: #8B6F47',
            'margin-bottom: 4px'
        ].join(';');
        stageNameEl.textContent = '毛坯阶段';

        var stageDescEl = document.createElement('div');
        stageDescEl.className = 'timeline-stage-desc';
        stageDescEl.style.cssText = [
            'font-size: 13px',
            'color: #666'
        ].join(';');
        stageDescEl.textContent = '空荡荡的毛坯房，一切从零开始';

        stageInfoEl.appendChild(stageNameEl);
        stageInfoEl.appendChild(stageDescEl);

        var progressBarEl = document.createElement('div');
        progressBarEl.className = 'timeline-progress-bar';
        progressBarEl.style.cssText = [
            'width: 100%',
            'height: 6px',
            'background: #e0e0e0',
            'border-radius: 3px',
            'margin-bottom: 20px',
            'overflow: hidden'
        ].join(';');

        var progressFillEl = document.createElement('div');
        progressFillEl.className = 'timeline-progress-fill';
        progressFillEl.style.cssText = [
            'height: 100%',
            'width: 0%',
            'background: linear-gradient(90deg, #D4A853, #B89040)',
            'border-radius: 3px',
            'transition: width 0.3s ease'
        ].join(';');

        progressBarEl.appendChild(progressFillEl);

        var stagesEl = document.createElement('div');
        stagesEl.className = 'timeline-stages';
        stagesEl.style.cssText = [
            'display: flex',
            'justify-content: space-between',
            'margin-bottom: 20px',
            'position: relative'
        ].join(';');

        var stageDots = [];
        for (var s = 0; s <= 6; s++) {
            var stageDot = document.createElement('div');
            stageDot.className = 'timeline-stage-dot';
            stageDot.setAttribute('data-stage', s);
            stageDot.style.cssText = [
                'width: 32px',
                'height: 32px',
                'border-radius: 50%',
                'background: ' + (s === 0 ? '#D4A853' : '#e0e0e0'),
                'color: ' + (s === 0 ? '#fff' : '#999'),
                'display: flex',
                'align-items: center',
                'justify-content: center',
                'font-size: 12px',
                'font-weight: 600',
                'cursor: pointer',
                'transition: all 0.3s ease',
                'z-index: 1',
                'flex-shrink: 0'
            ].join(';');
            stageDot.textContent = s;

            (function(stageNum) {
                stageDot.addEventListener('click', function() {
                    if (self._state === PLAYER_STATE.PLAYING) {
                        self.pause();
                    }
                    self.goToStage(stageNum, true);
                });
            })(s);

            stageDots.push(stageDot);
            stagesEl.appendChild(stageDot);
        }

        var controlsEl = document.createElement('div');
        controlsEl.className = 'timeline-controls';
        controlsEl.style.cssText = [
            'display: flex',
            'justify-content: center',
            'align-items: center',
            'gap: 16px'
        ].join(';');

        var prevBtn = document.createElement('button');
        prevBtn.className = 'timeline-btn timeline-prev-btn';
        prevBtn.style.cssText = [
            'width: 40px',
            'height: 40px',
            'border: none',
            'background: #f5f5f5',
            'border-radius: 50%',
            'cursor: pointer',
            'font-size: 18px',
            'color: #666',
            'display: flex',
            'align-items: center',
            'justify-content: center',
            'transition: all 0.2s ease'
        ].join(';');
        prevBtn.innerHTML = '⏮';
        prevBtn.addEventListener('click', function() {
            if (self._state === PLAYER_STATE.PLAYING) {
                self.pause();
            }
            self.prevStage();
        });

        var playBtn = document.createElement('button');
        playBtn.className = 'timeline-btn timeline-play-btn';
        playBtn.style.cssText = [
            'width: 56px',
            'height: 56px',
            'border: none',
            'background: linear-gradient(135deg, #D4A853, #B89040)',
            'border-radius: 50%',
            'cursor: pointer',
            'font-size: 24px',
            'color: #fff',
            'display: flex',
            'align-items: center',
            'justify-content: center',
            'box-shadow: 0 4px 12px rgba(212, 168, 83, 0.4)',
            'transition: all 0.2s ease'
        ].join(';');
        playBtn.innerHTML = '▶';
        playBtn.addEventListener('click', function() {
            if (self._state === PLAYER_STATE.PLAYING) {
                self.pause();
                playBtn.innerHTML = '▶';
            } else if (self._state === PLAYER_STATE.PAUSED) {
                self.resume();
                playBtn.innerHTML = '⏸';
            } else {
                self.play();
                playBtn.innerHTML = '⏸';
            }
        });

        var nextBtn = document.createElement('button');
        nextBtn.className = 'timeline-btn timeline-next-btn';
        nextBtn.style.cssText = [
            'width: 40px',
            'height: 40px',
            'border: none',
            'background: #f5f5f5',
            'border-radius: 50%',
            'cursor: pointer',
            'font-size: 18px',
            'color: #666',
            'display: flex',
            'align-items: center',
            'justify-content: center',
            'transition: all 0.2s ease'
        ].join(';');
        nextBtn.innerHTML = '⏭';
        nextBtn.addEventListener('click', function() {
            if (self._state === PLAYER_STATE.PLAYING) {
                self.pause();
            }
            self.nextStage();
        });

        controlsEl.appendChild(prevBtn);
        controlsEl.appendChild(playBtn);
        controlsEl.appendChild(nextBtn);

        timelineEl.appendChild(headerEl);
        timelineEl.appendChild(stageInfoEl);
        timelineEl.appendChild(progressBarEl);
        timelineEl.appendChild(stagesEl);
        timelineEl.appendChild(controlsEl);

        uiContainer.appendChild(timelineEl);

        this.on('onStageChange', function(stage) {
            var info = self.getStageInfo(stage);
            if (info) {
                stageNameEl.textContent = info.name;
                stageDescEl.textContent = info.description;
            }

            for (var i = 0; i < stageDots.length; i++) {
                var dot = stageDots[i];
                var dotStage = parseInt(dot.getAttribute('data-stage'));
                if (dotStage <= stage) {
                    dot.style.background = '#D4A853';
                    dot.style.color = '#fff';
                } else {
                    dot.style.background = '#e0e0e0';
                    dot.style.color = '#999';
                }
            }
        });

        this.on('onProgress', function(progress) {
            progressFillEl.style.width = progress + '%';
        });

        this.on('onPause', function() {
            playBtn.innerHTML = '▶';
        });

        this.on('onResume', function() {
            playBtn.innerHTML = '⏸';
        });

        this.on('onComplete', function() {
            playBtn.innerHTML = '▶';
        });

        this._element = timelineEl;

        return timelineEl;
    };

    TimelinePlayer.prototype.destroy = function() {
        this.stop();

        for (var key in this._callbacks) {
            if (this._callbacks.hasOwnProperty(key)) {
                this._callbacks[key] = [];
            }
        }

        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }

        this._element = null;
        this.progressSync = null;
        this.objectManager = null;
        this.container = null;
        this._initialized = false;
    };

    return {
        TimelinePlayer: TimelinePlayer,
        STATE: PLAYER_STATE,
        create: function(options) {
            var player = new TimelinePlayer();
            if (options) {
                player.init(options);
            }
            return player;
        }
    };
})();
