var StageTransition = (function() {
    'use strict';

    var MILESTONE_STAGES = [1, 3, 6];

    var LAYER_ORDER = {
        'background': 0,
        'mid': 1,
        'foreground': 2
    };

    function StageTransition() {
        this.container = null;
        this.scene = null;
        this.objectManager = null;
        this.ambientLighting = null;
        this.nianSprite = null;
        this.stageStyles = {};
        this.lowPerformanceMode = false;

        this._initialized = false;
        this._isTransitioning = false;
        this._currentStage = 0;
        this._skipRequested = false;
        this._timers = [];
        this._eventCallbacks = {
            start: [],
            midpoint: [],
            complete: []
        };
        this._overlay = null;
        this._confettiContainer = null;
        this._interactionBlocker = null;
        this._skipButton = null;
    }

    StageTransition.prototype.init = function(options) {
        if (this._initialized) return;
        options = options || {};

        if (typeof options.container === 'string') {
            this.container = document.querySelector(options.container);
        } else if (options.container instanceof Element) {
            this.container = options.container;
        }

        this.scene = options.scene || null;
        this.objectManager = options.objectManager || null;
        this.ambientLighting = options.ambientLighting || null;
        this.nianSprite = options.nianSprite || null;
        this.stageStyles = options.stageStyles || {};
        this.lowPerformanceMode = options.lowPerformanceMode || false;
        this._currentStage = options.initialStage !== undefined ? options.initialStage : 0;

        if (!this.container) {
            console.error('[StageTransition] Container not found');
            return false;
        }

        this._createOverlay();
        this._createConfettiContainer();
        this._createInteractionBlocker();
        this._createSkipButton();

        this._initialized = true;
        return true;
    };

    StageTransition.prototype._createOverlay = function() {
        this._overlay = document.createElement('div');
        this._overlay.className = 'stage-transition-overlay';
        this._overlay.style.cssText = [
            'position: absolute',
            'top: 0',
            'left: 0',
            'width: 100%',
            'height: 100%',
            'background: rgba(0, 0, 0, 0)',
            'pointer-events: none',
            'z-index: 50',
            'opacity: 0',
            'transition: opacity 0.3s ease-in-out'
        ].join(';');
        this.container.appendChild(this._overlay);
    };

    StageTransition.prototype._createConfettiContainer = function() {
        this._confettiContainer = document.createElement('div');
        this._confettiContainer.className = 'stage-transition-confetti';
        this._confettiContainer.style.cssText = [
            'position: absolute',
            'top: 0',
            'left: 0',
            'width: 100%',
            'height: 100%',
            'pointer-events: none',
            'z-index: 60',
            'overflow: hidden'
        ].join(';');
        this.container.appendChild(this._confettiContainer);
    };

    StageTransition.prototype._createInteractionBlocker = function() {
        this._interactionBlocker = document.createElement('div');
        this._interactionBlocker.className = 'stage-transition-blocker';
        this._interactionBlocker.style.cssText = [
            'position: absolute',
            'top: 0',
            'left: 0',
            'width: 100%',
            'height: 100%',
            'pointer-events: none',
            'z-index: 40',
            'opacity: 0'
        ].join(';');
        this.container.appendChild(this._interactionBlocker);
    };

    StageTransition.prototype._createSkipButton = function() {
        var self = this;
        this._skipButton = document.createElement('button');
        this._skipButton.className = 'stage-transition-skip-btn';
        this._skipButton.textContent = '跳过';
        this._skipButton.style.cssText = [
            'position: absolute',
            'bottom: 20px',
            'right: 20px',
            'padding: 8px 16px',
            'background: rgba(139, 111, 71, 0.9)',
            'color: #fff',
            'border: none',
            'border-radius: 20px',
            'font-size: 12px',
            'cursor: pointer',
            'z-index: 70',
            'pointer-events: none',
            'opacity: 0',
            'transition: opacity 0.3s ease',
            'backdrop-filter: blur(4px)',
            '-webkit-backdrop-filter: blur(4px)'
        ].join(';');

        this._skipButton.addEventListener('click', function(e) {
            e.stopPropagation();
            self.skip();
        });

        this.container.appendChild(this._skipButton);
    };

    StageTransition.prototype._showSkipButton = function() {
        if (!this._skipButton || this.lowPerformanceMode) return;
        this._skipButton.style.pointerEvents = 'auto';
        this._skipButton.style.opacity = '1';
    };

    StageTransition.prototype._hideSkipButton = function() {
        if (!this._skipButton) return;
        this._skipButton.style.pointerEvents = 'none';
        this._skipButton.style.opacity = '0';
    };

    StageTransition.prototype._addTimer = function(timerId) {
        this._timers.push(timerId);
        return timerId;
    };

    StageTransition.prototype._clearAllTimers = function() {
        for (var i = 0; i < this._timers.length; i++) {
            clearTimeout(this._timers[i]);
        }
        this._timers = [];
    };

    StageTransition.prototype.transitionTo = function(newStageId, options) {
        var self = this;
        options = options || {};

        if (this._isTransitioning) {
            return false;
        }

        if (newStageId === this._currentStage && !options.force) {
            return false;
        }

        var oldStageId = this._currentStage;
        this._isTransitioning = true;
        this._skipRequested = false;

        this._fireEvent('start', { newStage: newStageId, oldStage: oldStageId });

        var isMilestone = MILESTONE_STAGES.indexOf(newStageId) !== -1 && newStageId > oldStageId;
        var isForward = newStageId > oldStageId;

        var durations = this._getDurations();
        var newObjectIds = options.newObjectIds || [];

        this._blockInteractions(true);
        this._showSkipButton();

        this._showNianReaction(newStageId, isMilestone, isForward);

        if (typeof options.onNotification === 'function') {
            options.onNotification(newStageId, isMilestone);
        }

        this._addTimer(setTimeout(function() {
            if (self._skipRequested) {
                self._finishTransition(newStageId, oldStageId, newObjectIds, isMilestone, options);
                return;
            }
            self._dimScene(durations.dimOut, function() {
                if (self._skipRequested) {
                    self._finishTransition(newStageId, oldStageId, newObjectIds, isMilestone, options);
                    return;
                }

                self._fireEvent('midpoint', { newStage: newStageId, oldStage: oldStageId });

                self._updateSceneStyle(newStageId);
                self._updateAmbientLighting(newStageId);

                if (typeof options.onMidpoint === 'function') {
                    options.onMidpoint(newStageId, oldStageId);
                }

                self._addTimer(setTimeout(function() {
                    if (self._skipRequested) {
                        self._finishTransition(newStageId, oldStageId, newObjectIds, isMilestone, options);
                        return;
                    }

                    self._brightenScene(durations.brightenIn, function() {
                        if (self._skipRequested) {
                            self._finishTransition(newStageId, oldStageId, newObjectIds, isMilestone, options);
                            return;
                        }

                        if (newObjectIds.length > 0 && isForward) {
                            self._animateNewObjects(newObjectIds, durations.objectDelay, function() {
                                self._afterObjectsAppear(newStageId, isMilestone, options, oldStageId);
                            });
                        } else {
                            self._afterObjectsAppear(newStageId, isMilestone, options, oldStageId);
                        }
                    });
                }, durations.holdDark));
            });
        }, durations.reactionDelay));

        return true;
    };

    StageTransition.prototype._getDurations = function() {
        if (this.lowPerformanceMode) {
            return {
                reactionDelay: 100,
                dimOut: 150,
                holdDark: 50,
                brightenIn: 200,
                objectDelay: 80,
                nianMoveDelay: 200
            };
        }
        return {
            reactionDelay: 300,
            dimOut: 300,
            holdDark: 150,
            brightenIn: 400,
            objectDelay: 200,
            nianMoveDelay: 500
        };
    };

    StageTransition.prototype._showNianReaction = function(newStageId, isMilestone, isForward) {
        if (!this.nianSprite || !this.nianSprite.setState) return;

        if (!isForward) {
            this.nianSprite.setState('thinking');
            return;
        }

        if (isMilestone) {
            this.nianSprite.setState('celebrate');
        } else {
            this.nianSprite.setState('happy');
        }
    };

    StageTransition.prototype._dimScene = function(duration, callback) {
        var self = this;
        if (!this._overlay) {
            if (callback) callback();
            return;
        }

        this._overlay.style.transition = 'opacity ' + duration + 'ms ease-in-out';
        this._overlay.style.opacity = '1';
        this._overlay.style.background = 'rgba(20, 15, 10, 0.5)';

        var bgLayer = this._getBackgroundLayer();
        if (bgLayer) {
            bgLayer.style.transition = 'filter ' + duration + 'ms ease-in-out';
            bgLayer.style.filter = 'brightness(0.6)';
        }

        this._addTimer(setTimeout(function() {
            if (callback) callback();
        }, duration));
    };

    StageTransition.prototype._brightenScene = function(duration, callback) {
        var self = this;
        if (!this._overlay) {
            if (callback) callback();
            return;
        }

        this._overlay.style.transition = 'opacity ' + duration + 'ms ease-out';
        this._overlay.style.opacity = '0';

        var bgLayer = this._getBackgroundLayer();
        if (bgLayer) {
            bgLayer.style.transition = 'filter ' + duration + 'ms ease-out';
            bgLayer.style.filter = 'brightness(1)';
        }

        this._addTimer(setTimeout(function() {
            if (self._overlay) {
                self._overlay.style.background = 'rgba(0, 0, 0, 0)';
            }
            if (callback) callback();
        }, duration));
    };

    StageTransition.prototype._getBackgroundLayer = function() {
        if (!this.scene || !this.scene.getLayer) return null;
        var bgLayer = this.scene.getLayer('background');
        return bgLayer && bgLayer._element ? bgLayer._element : null;
    };

    StageTransition.prototype._updateSceneStyle = function(stage) {
        if (!this.scene || !this.scene.getLayer) return;

        var style = this.stageStyles[stage];
        if (!style) return;

        var bgLayer = this.scene.getLayer('background');
        if (!bgLayer || !bgLayer._element) return;

        var wall = bgLayer._element.querySelector('.scene25d-bg-wall');
        var floor = bgLayer._element.querySelector('.scene25d-bg-floor');

        var transitionDuration = this.lowPerformanceMode ? '0.3s' : '1s';

        if (wall) {
            wall.style.transition = 'background ' + transitionDuration + ' ease-in-out';
            wall.style.background = style.wallColor;
        }
        if (floor) {
            floor.style.transition = 'background ' + transitionDuration + ' ease-in-out';
            floor.style.background = style.floorColor;
        }

        if (this.container && style.ambiance) {
            this.container.style.transition = 'box-shadow ' + transitionDuration + ' ease-in-out';
            this.container.style.boxShadow = 'inset 0 0 100px ' + style.ambiance;
        }
    };

    StageTransition.prototype._updateAmbientLighting = function(stage) {
        if (this.ambientLighting && typeof this.ambientLighting.setStage === 'function') {
            this.ambientLighting.setStage(stage);
        }
    };

    StageTransition.prototype._animateNewObjects = function(objectIds, delay, callback) {
        var self = this;
        if (!this.objectManager || !objectIds || objectIds.length === 0) {
            if (callback) callback();
            return;
        }

        var sortedObjects = this._sortObjectsForEntry(objectIds);

        for (var i = 0; i < sortedObjects.length; i++) {
            (function(index, objId) {
                self._addTimer(setTimeout(function() {
                    if (self._skipRequested) return;
                    if (self.objectManager) {
                        var obj = self.objectManager.getObject(objId);
                        if (!obj) {
                            self.objectManager.addObject(objId);
                        }
                        self.objectManager.showObject(objId, true);
                    }
                }, index * delay));
            })(i, sortedObjects[i]);
        }

        var totalDuration = sortedObjects.length * delay + 500;
        this._addTimer(setTimeout(function() {
            if (callback) callback();
        }, totalDuration));
    };

    StageTransition.prototype._sortObjectsForEntry = function(objectIds) {
        var self = this;
        var objectsWithInfo = [];

        for (var i = 0; i < objectIds.length; i++) {
            var objId = objectIds[i];
            var obj = this.objectManager ? this.objectManager.getObject(objId) : null;
            var config = null;

            if (typeof ObjectConfig !== 'undefined' && ObjectConfig.getConfig) {
                config = ObjectConfig.getConfig(objId);
            }

            var layer = obj ? obj.layer : (config ? config.layer : 'mid');
            var layerIndex = LAYER_ORDER[layer] !== undefined ? LAYER_ORDER[layer] : 1;
            var y = obj ? obj.y : (config ? config.y : 0);
            var width = obj ? obj.width : (config ? config.width : 60);
            var height = obj ? obj.height : (config ? config.height : 60);
            var size = width * height;

            objectsWithInfo.push({
                id: objId,
                layerIndex: layerIndex,
                y: y,
                size: size
            });
        }

        objectsWithInfo.sort(function(a, b) {
            if (a.layerIndex !== b.layerIndex) {
                return a.layerIndex - b.layerIndex;
            }
            if (a.y !== b.y) {
                return a.y - b.y;
            }
            return b.size - a.size;
        });

        var sortedIds = [];
        for (var j = 0; j < objectsWithInfo.length; j++) {
            sortedIds.push(objectsWithInfo[j].id);
        }

        return sortedIds;
    };

    StageTransition.prototype._afterObjectsAppear = function(newStageId, isMilestone, options, oldStageId) {
        var self = this;
        var durations = this._getDurations();

        if (isMilestone) {
            this._playMilestoneEffect(newStageId);
        }

        if (typeof options.onNianMove === 'function') {
            this._addTimer(setTimeout(function() {
                options.onNianMove(newStageId, function() {
                    self._completeTransition(newStageId, oldStageId, options);
                });
            }, durations.nianMoveDelay));
        } else {
            this._completeTransition(newStageId, oldStageId, options);
        }
    };

    StageTransition.prototype._playMilestoneEffect = function(stageId) {
        if (this.lowPerformanceMode) return;

        this._createConfetti(stageId);

        if (this.container) {
            this.container.style.transition = 'box-shadow 0.3s ease-out';
            this.container.style.boxShadow = 'inset 0 0 150px rgba(255, 215, 0, 0.3)';

            var self = this;
            this._addTimer(setTimeout(function() {
                if (self.container && self.stageStyles[stageId]) {
                    self.container.style.transition = 'box-shadow 1s ease-in-out';
                    self.container.style.boxShadow = 'inset 0 0 100px ' + self.stageStyles[stageId].ambiance;
                }
            }, 800));
        }
    };

    StageTransition.prototype._createConfetti = function(stageId) {
        if (!this._confettiContainer) return;

        var colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        var confettiCount = this.lowPerformanceMode ? 15 : 40;

        for (var i = 0; i < confettiCount; i++) {
            var confetti = document.createElement('div');
            var size = 6 + Math.random() * 8;
            var color = colors[Math.floor(Math.random() * colors.length)];
            var leftPos = Math.random() * 100;
            var delay = Math.random() * 0.5;
            var duration = 2 + Math.random() * 2;
            var shape = Math.random() > 0.5 ? '50%' : '2px';

            confetti.style.cssText = [
                'position: absolute',
                'width: ' + size + 'px',
                'height: ' + size + 'px',
                'background: ' + color,
                'left: ' + leftPos + '%',
                'top: -20px',
                'border-radius: ' + shape,
                'opacity: 0.8',
                'animation: stageConfettiFall ' + duration + 's ease-in ' + delay + 's forwards'
            ].join(';');

            this._confettiContainer.appendChild(confetti);
        }

        var self = this;
        this._addTimer(setTimeout(function() {
            self._clearConfetti();
        }, 4500));
    };

    StageTransition.prototype._clearConfetti = function() {
        if (!this._confettiContainer) return;
        while (this._confettiContainer.firstChild) {
            this._confettiContainer.removeChild(this._confettiContainer.firstChild);
        }
    };

    StageTransition.prototype._completeTransition = function(newStageId, oldStageId, options) {
        this._currentStage = newStageId;
        this._isTransitioning = false;
        this._blockInteractions(false);
        this._hideSkipButton();

        this._fireEvent('complete', { newStage: newStageId, oldStage: oldStageId });

        if (typeof options.onComplete === 'function') {
            options.onComplete(newStageId, oldStageId);
        }
    };

    StageTransition.prototype._finishTransition = function(newStageId, oldStageId, newObjectIds, isMilestone, options) {
        this._clearAllTimers();

        if (this._overlay) {
            this._overlay.style.opacity = '0';
            this._overlay.style.background = 'rgba(0, 0, 0, 0)';
        }

        var bgLayer = this._getBackgroundLayer();
        if (bgLayer) {
            bgLayer.style.filter = 'brightness(1)';
        }

        this._updateSceneStyle(newStageId);
        this._updateAmbientLighting(newStageId);

        if (newObjectIds && newObjectIds.length > 0 && this.objectManager) {
            for (var i = 0; i < newObjectIds.length; i++) {
                var obj = this.objectManager.getObject(newObjectIds[i]);
                if (!obj) {
                    this.objectManager.addObject(newObjectIds[i]);
                }
                this.objectManager.showObject(newObjectIds[i], false);
            }
        }

        this._clearConfetti();

        this._completeTransition(newStageId, oldStageId, options);
    };

    StageTransition.prototype._blockInteractions = function(block) {
        if (!this._interactionBlocker) return;
        this._interactionBlocker.style.pointerEvents = block ? 'auto' : 'none';
        this._interactionBlocker.style.opacity = block ? '0.01' : '0';
    };

    StageTransition.prototype.skip = function() {
        if (!this._isTransitioning) return false;
        this._skipRequested = true;
        return true;
    };

    StageTransition.prototype.on = function(event, callback) {
        if (this._eventCallbacks[event] && typeof callback === 'function') {
            this._eventCallbacks[event].push(callback);
        }
    };

    StageTransition.prototype._fireEvent = function(event, data) {
        if (!this._eventCallbacks[event]) return;
        for (var i = 0; i < this._eventCallbacks[event].length; i++) {
            try {
                this._eventCallbacks[event][i](data);
            } catch (e) {
                console.error('[StageTransition] Event callback error:', e);
            }
        }
    };

    StageTransition.prototype.isTransitioning = function() {
        return this._isTransitioning;
    };

    StageTransition.prototype.getCurrentStage = function() {
        return this._currentStage;
    };

    StageTransition.prototype.setLowPerformanceMode = function(enabled) {
        this.lowPerformanceMode = enabled;
    };

    StageTransition.prototype.setNianSprite = function(sprite) {
        this.nianSprite = sprite;
    };

    StageTransition.prototype.setStageStyles = function(styles) {
        this.stageStyles = styles || {};
    };

    StageTransition.prototype.pause = function() {
        if (!this._isTransitioning) return;
        this._skipRequested = true;
    };

    StageTransition.prototype.resume = function() {
    };

    StageTransition.prototype.destroy = function() {
        this._clearAllTimers();

        this._eventCallbacks = {
            start: [],
            midpoint: [],
            complete: []
        };

        if (this._overlay && this._overlay.parentNode) {
            this._overlay.parentNode.removeChild(this._overlay);
        }
        if (this._confettiContainer && this._confettiContainer.parentNode) {
            this._confettiContainer.parentNode.removeChild(this._confettiContainer);
        }
        if (this._interactionBlocker && this._interactionBlocker.parentNode) {
            this._interactionBlocker.parentNode.removeChild(this._interactionBlocker);
        }
        if (this._skipButton && this._skipButton.parentNode) {
            this._skipButton.parentNode.removeChild(this._skipButton);
        }

        this._overlay = null;
        this._confettiContainer = null;
        this._interactionBlocker = null;
        this._skipButton = null;
        this.container = null;
        this.scene = null;
        this.objectManager = null;
        this.ambientLighting = null;
        this.nianSprite = null;
        this._initialized = false;
        this._isTransitioning = false;
    };

    return {
        StageTransition: StageTransition,
        create: function(options) {
            var transition = new StageTransition();
            if (options) {
                transition.init(options);
            }
            return transition;
        },
        isMilestoneStage: function(stageId) {
            return MILESTONE_STAGES.indexOf(parseInt(stageId)) !== -1;
        }
    };
})();
