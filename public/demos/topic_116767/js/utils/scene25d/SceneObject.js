var SceneObject = (function() {
    'use strict';

    function SceneObject(config) {
        config = config || {};
        this.id = config.id || 'obj-' + Date.now() + Math.random().toString(36).substr(2, 9);
        this.name = config.name || 'Object';
        this.type = config.type || 'default';
        this.x = config.x !== undefined ? config.x : 0;
        this.y = config.y !== undefined ? config.y : 0;
        this.width = config.width || 60;
        this.height = config.height || 60;
        this.layer = config.layer || 'mid';
        this.visible = config.visible !== false;
        this.opacity = config.opacity !== undefined ? config.opacity : 1;
        this.scale = config.scale !== undefined ? config.scale : 1;
        this.rotation = config.rotation || 0;
        this.icon = config.icon || '📦';
        this.animationType = config.animationType || 'fadeScale';

        this._element = null;
        this._contentElement = null;
        this._animating = false;
        this._animationFrameId = null;
        this._currentAnimation = null;
        this._animationCallbacks = [];
    }

    SceneObject.prototype.createElement = function() {
        if (this._element) return this._element;

        this._element = document.createElement('div');
        this._element.className = 'scene-object';
        this._element.setAttribute('data-object-id', this.id);
        this._element.setAttribute('data-object-type', this.type);
        this._element.setAttribute('data-object-name', this.name);

        this._element.style.position = 'absolute';
        this._element.style.width = this.width + 'px';
        this._element.style.height = this.height + 'px';
        this._element.style.opacity = this.opacity;
        this._element.style.display = this.visible ? 'flex' : 'none';
        this._element.style.alignItems = 'center';
        this._element.style.justifyContent = 'center';
        this._element.style.willChange = 'transform, opacity';
        this._element.style.pointerEvents = 'none';
        this._element.style.userSelect = 'none';

        this._contentElement = document.createElement('div');
        this._contentElement.className = 'scene-object-content';
        this._contentElement.style.fontSize = Math.min(this.width, this.height) * 0.7 + 'px';
        this._contentElement.style.lineHeight = '1';
        this._contentElement.style.textAlign = 'center';
        this._contentElement.innerHTML = this.icon;

        this._element.appendChild(this._contentElement);
        this._updateTransform();

        return this._element;
    };

    SceneObject.prototype.setPosition = function(x, y) {
        this.x = x;
        this.y = y;
        this._updateTransform();
    };

    SceneObject.prototype.setScale = function(scale) {
        this.scale = scale;
        this._updateTransform();
    };

    SceneObject.prototype.setOpacity = function(opacity) {
        this.opacity = Math.max(0, Math.min(1, opacity));
        if (this._element) {
            this._element.style.opacity = this.opacity;
        }
    };

    SceneObject.prototype.setRotation = function(rotation) {
        this.rotation = rotation;
        this._updateTransform();
    };

    SceneObject.prototype._updateTransform = function() {
        if (!this._element) return;
        this._element.style.transform = 'translate3d(' + this.x + 'px, ' + this.y + 'px, 0) scale(' + this.scale + ') rotate(' + this.rotation + 'deg)';
    };

    SceneObject.prototype.show = function(animate, animationConfig) {
        if (this.visible) return;

        this.visible = true;
        if (this._element) {
            this._element.style.display = 'flex';
        }

        if (animate && GrowthAnimations) {
            this.playAnimation(this.animationType, animationConfig);
        } else {
            this.setOpacity(1);
            this.setScale(1);
        }
    };

    SceneObject.prototype.hide = function(animate, animationConfig) {
        if (!this.visible) return;

        if (animate && GrowthAnimations) {
            var self = this;
            var hideConfig = animationConfig || {};
            hideConfig.onComplete = function() {
                self.visible = false;
                if (self._element) {
                    self._element.style.display = 'none';
                }
                if (animationConfig && animationConfig.onComplete) {
                    animationConfig.onComplete();
                }
            };
            this.playAnimation(this.animationType + 'Out', hideConfig);
        } else {
            this.visible = false;
            if (this._element) {
                this._element.style.display = 'none';
            }
        }
    };

    SceneObject.prototype.playAnimation = function(animationName, options) {
        if (!this._element) {
            this.createElement();
        }

        options = options || {};

        if (this._animating && this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }

        this._animating = true;
        this._currentAnimation = animationName;

        var self = this;
        var completeHandler = function() {
            self._animating = false;
            self._currentAnimation = null;
            if (options.onComplete && typeof options.onComplete === 'function') {
                options.onComplete(self);
            }
        };

        if (GrowthAnimations && GrowthAnimations.play) {
            GrowthAnimations.play(this._element, animationName, {
                duration: options.duration,
                delay: options.delay || 0,
                easing: options.easing,
                onComplete: completeHandler
            });
        } else {
            completeHandler();
        }
    };

    SceneObject.prototype.stopAnimation = function() {
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
        this._animating = false;
        this._currentAnimation = null;
    };

    SceneObject.prototype.getElement = function() {
        if (!this._element) {
            this.createElement();
        }
        return this._element;
    };

    SceneObject.prototype.attachTo = function(container) {
        var el = this.getElement();
        if (container && el.parentNode !== container) {
            container.appendChild(el);
        }
    };

    SceneObject.prototype.destroy = function() {
        this.stopAnimation();
        this._animationCallbacks = [];
        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
        this._contentElement = null;
    };

    SceneObject.prototype.isAnimating = function() {
        return this._animating;
    };

    SceneObject.prototype.getCurrentAnimation = function() {
        return this._currentAnimation;
    };

    SceneObject.prototype.setIcon = function(icon) {
        this.icon = icon;
        if (this._contentElement) {
            this._contentElement.innerHTML = icon;
        }
    };

    return {
        SceneObject: SceneObject,
        create: function(config) {
            return new SceneObject(config);
        }
    };
})();
