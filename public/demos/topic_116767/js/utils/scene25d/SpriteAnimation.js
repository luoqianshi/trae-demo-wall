var SpriteAnimation = (function() {
    'use strict';

    function Sprite(options) {
        options = options || {};
        this.id = options.id || 'sprite-' + Date.now() + Math.random().toString(36).substr(2, 9);
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 100;
        this.height = options.height || 100;
        this.currentState = options.initialState || 'idle';
        this.facing = options.facing || 'right';
        this.visible = options.visible !== false;
        this.opacity = options.opacity !== undefined ? options.opacity : 1;

        this._states = {};
        this._element = null;
        this._moveAnimating = false;
        this._moveStartX = 0;
        this._moveStartY = 0;
        this._moveTargetX = 0;
        this._moveTargetY = 0;
        this._moveDuration = 0;
        this._moveElapsed = 0;
        this._moveCallback = null;
        this._transitioning = false;
        this._transitionDuration = 0;
        this._transitionElapsed = 0;
        this._previousState = null;
        this._frameIndex = 0;
        this._frameElapsed = 0;
        this._animationType = 'css';
        this._animationFrameId = null;
        this._lastTime = 0;
        this._deltaTime = 0;
        this._running = false;
        this._updateCallbacks = [];
    }

    Sprite.prototype.registerState = function(name, config) {
        if (!name || !config) return;
        this._states[name] = {
            name: name,
            type: config.type || 'css',
            cssClass: config.cssClass || '',
            frames: config.frames || [],
            frameDuration: config.frameDuration || 100,
            loop: config.loop !== false,
            transitionDuration: config.transitionDuration || 200,
            onEnter: config.onEnter || null,
            onExit: config.onExit || null
        };
    };

    Sprite.prototype.setState = function(stateName) {
        if (!this._states[stateName] || this.currentState === stateName) return;

        var stateConfig = this._states[stateName];
        var prevConfig = this._states[this.currentState];

        if (prevConfig && prevConfig.onExit) {
            prevConfig.onExit(this);
        }

        this._previousState = this.currentState;
        this.currentState = stateName;
        this._frameIndex = 0;
        this._frameElapsed = 0;
        this._animationType = stateConfig.type;

        if (stateConfig.transitionDuration > 0) {
            this._transitioning = true;
            this._transitionDuration = stateConfig.transitionDuration;
            this._transitionElapsed = 0;
        }

        this._applyStateClass();

        if (stateConfig.onEnter) {
            stateConfig.onEnter(this);
        }
    };

    Sprite.prototype._applyStateClass = function() {
        if (!this._element) return;

        var stateConfig = this._states[this.currentState];
        if (!stateConfig) return;

        for (var stateName in this._states) {
            if (this._states.hasOwnProperty(stateName)) {
                var cfg = this._states[stateName];
                if (cfg.cssClass) {
                    this._element.classList.remove(cfg.cssClass);
                }
            }
        }

        if (stateConfig.cssClass) {
            this._element.classList.add(stateConfig.cssClass);
        }
    };

    Sprite.prototype.setPosition = function(x, y) {
        this.x = x;
        this.y = y;
        this._moveAnimating = false;
        this._updatePosition();
    };

    Sprite.prototype.moveTo = function(x, y, duration, callback) {
        if (duration <= 0 || !duration) {
            this.setPosition(x, y);
            if (callback) callback();
            return;
        }

        this._moveStartX = this.x;
        this._moveStartY = this.y;
        this._moveTargetX = x;
        this._moveTargetY = y;
        this._moveDuration = duration;
        this._moveElapsed = 0;
        this._moveAnimating = true;
        this._moveCallback = callback || null;

        if (x < this.x) {
            this.setFacing('left');
        } else if (x > this.x) {
            this.setFacing('right');
        }
    };

    Sprite.prototype.setFacing = function(direction) {
        if (direction !== 'left' && direction !== 'right') return;
        this.facing = direction;
        if (this._element) {
            if (direction === 'left') {
                this._element.classList.add('sprite-facing-left');
            } else {
                this._element.classList.remove('sprite-facing-left');
            }
        }
    };

    Sprite.prototype.setOpacity = function(opacity) {
        this.opacity = Math.max(0, Math.min(1, opacity));
        if (this._element) {
            this._element.style.opacity = this.opacity;
        }
    };

    Sprite.prototype.setVisible = function(visible) {
        this.visible = visible;
        if (this._element) {
            this._element.style.display = visible ? 'block' : 'none';
        }
    };

    Sprite.prototype._updatePosition = function() {
        if (!this._element) return;
        this._element.style.transform = 'translate3d(' + this.x + 'px, ' + this.y + 'px, 0)';
    };

    Sprite.prototype.update = function(deltaTime) {
        if (this._moveAnimating) {
            this._moveElapsed += deltaTime;
            var progress = this._moveElapsed / this._moveDuration;

            if (progress >= 1) {
                progress = 1;
                this._moveAnimating = false;
                this.x = this._moveTargetX;
                this.y = this._moveTargetY;
                this._updatePosition();
                if (this._moveCallback) {
                    var cb = this._moveCallback;
                    this._moveCallback = null;
                    cb();
                }
            } else {
                var easedProgress = this._easeInOutCubic(progress);
                this.x = this._moveStartX + (this._moveTargetX - this._moveStartX) * easedProgress;
                this.y = this._moveStartY + (this._moveTargetY - this._moveStartY) * easedProgress;
                this._updatePosition();
            }
        }

        if (this._transitioning) {
            this._transitionElapsed += deltaTime;
            if (this._transitionElapsed >= this._transitionDuration) {
                this._transitioning = false;
                this._previousState = null;
            }
        }

        if (this._animationType === 'frames') {
            this._updateFrameAnimation(deltaTime);
        }

        for (var i = 0; i < this._updateCallbacks.length; i++) {
            this._updateCallbacks[i](deltaTime, this);
        }
    };

    Sprite.prototype._updateFrameAnimation = function(deltaTime) {
        var stateConfig = this._states[this.currentState];
        if (!stateConfig || stateConfig.frames.length === 0) return;

        this._frameElapsed += deltaTime;

        if (this._frameElapsed >= stateConfig.frameDuration) {
            this._frameElapsed -= stateConfig.frameDuration;

            if (stateConfig.loop) {
                this._frameIndex = (this._frameIndex + 1) % stateConfig.frames.length;
            } else {
                this._frameIndex++;
                if (this._frameIndex >= stateConfig.frames.length) {
                    this._frameIndex = stateConfig.frames.length - 1;
                }
            }

            this._renderFrame();
        }
    };

    Sprite.prototype._renderFrame = function() {
    };

    Sprite.prototype._easeInOutCubic = function(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    Sprite.prototype.render = function() {
    };

    Sprite.prototype.getElement = function() {
        return this._element;
    };

    Sprite.prototype.addUpdateCallback = function(callback) {
        if (typeof callback === 'function' && this._updateCallbacks.indexOf(callback) === -1) {
            this._updateCallbacks.push(callback);
        }
    };

    Sprite.prototype.removeUpdateCallback = function(callback) {
        var index = this._updateCallbacks.indexOf(callback);
        if (index > -1) {
            this._updateCallbacks.splice(index, 1);
        }
    };

    Sprite.prototype.createDOM = function() {
        if (this._element) return this._element;

        this._element = document.createElement('div');
        this._element.className = 'sprite-animation';
        this._element.setAttribute('data-sprite-id', this.id);
        this._element.style.position = 'absolute';
        this._element.style.width = this.width + 'px';
        this._element.style.height = this.height + 'px';
        this._element.style.willChange = 'transform, opacity';
        this._element.style.opacity = this.opacity;
        this._element.style.display = this.visible ? 'block' : 'none';

        if (this.facing === 'left') {
            this._element.classList.add('sprite-facing-left');
        }

        this._applyStateClass();
        this._updatePosition();

        return this._element;
    };

    Sprite.prototype.attachTo = function(container) {
        var el = this.createDOM();
        if (container && el.parentNode !== container) {
            container.appendChild(el);
        }
    };

    Sprite.prototype.destroy = function() {
        this.stop();
        this._updateCallbacks = [];
        this._moveCallback = null;
        this._states = {};
        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
    };

    Sprite.prototype.start = function() {
        if (this._running) return;
        this._running = true;
        this._lastTime = performance.now();
        var self = this;
        this._animationFrameId = requestAnimationFrame(function(t) {
            self._loop(t);
        });
    };

    Sprite.prototype.stop = function() {
        this._running = false;
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    };

    Sprite.prototype._loop = function(currentTime) {
        if (!this._running) return;

        this._deltaTime = currentTime - this._lastTime;
        this._lastTime = currentTime;

        this.update(this._deltaTime);
        this.render();

        var self = this;
        this._animationFrameId = requestAnimationFrame(function(t) {
            self._loop(t);
        });
    };

    Sprite.prototype.getCurrentState = function() {
        return this.currentState;
    };

    Sprite.prototype.isMoving = function() {
        return this._moveAnimating;
    };

    Sprite.prototype.hasState = function(stateName) {
        return !!this._states[stateName];
    };

    return {
        Sprite: Sprite,
        create: function(options) {
            return new Sprite(options);
        }
    };
})();
