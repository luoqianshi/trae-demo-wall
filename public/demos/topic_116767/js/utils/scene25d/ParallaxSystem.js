var ParallaxSystem = (function() {
    'use strict';

    function ParallaxSystem(options) {
        options = options || {};
        this.sensitivity = options.sensitivity !== undefined ? options.sensitivity : 1;
        this.lerpFactor = options.lerpFactor !== undefined ? options.lerpFactor : 0.08;
        this.maxOffsetX = options.maxOffsetX !== undefined ? options.maxOffsetX : 50;
        this.maxOffsetY = options.maxOffsetY !== undefined ? options.maxOffsetY : 30;
        this.enabled = options.enabled !== undefined ? options.enabled : true;

        this._targetOffsetX = 0;
        this._targetOffsetY = 0;
        this._currentOffsetX = 0;
        this._currentOffsetY = 0;
        this._container = null;
        this._onMouseMove = null;
        this._onTouchMove = null;
        this._onTouchStart = null;
        this._onUpdate = null;
    }

    ParallaxSystem.prototype._calculateNormalizedOffset = function(clientX, clientY, containerRect) {
        var centerX = containerRect.left + containerRect.width / 2;
        var centerY = containerRect.top + containerRect.height / 2;
        var normalizedX = (clientX - centerX) / (containerRect.width / 2);
        var normalizedY = (clientY - centerY) / (containerRect.height / 2);

        normalizedX = Math.max(-1, Math.min(1, normalizedX));
        normalizedY = Math.max(-1, Math.min(1, normalizedY));

        return {
            x: normalizedX,
            y: normalizedY
        };
    };

    ParallaxSystem.prototype._handleMouseMove = function(e) {
        if (!this.enabled || !this._container) return;

        var rect = this._container.getBoundingClientRect();
        var normalized = this._calculateNormalizedOffset(e.clientX, e.clientY, rect);

        this._targetOffsetX = normalized.x * this.maxOffsetX * this.sensitivity;
        this._targetOffsetY = normalized.y * this.maxOffsetY * this.sensitivity;
    };

    ParallaxSystem.prototype._handleTouchMove = function(e) {
        if (!this.enabled || !this._container) return;

        if (e.touches && e.touches.length > 0) {
            var touch = e.touches[0];
            var rect = this._container.getBoundingClientRect();
            var normalized = this._calculateNormalizedOffset(touch.clientX, touch.clientY, rect);

            this._targetOffsetX = normalized.x * this.maxOffsetX * this.sensitivity;
            this._targetOffsetY = normalized.y * this.maxOffsetY * this.sensitivity;
        }
    };

    ParallaxSystem.prototype._handleTouchStart = function(e) {
        if (!this.enabled || !this._container) return;

        if (e.touches && e.touches.length > 0) {
            var touch = e.touches[0];
            var rect = this._container.getBoundingClientRect();
            var normalized = this._calculateNormalizedOffset(touch.clientX, touch.clientY, rect);

            this._targetOffsetX = normalized.x * this.maxOffsetX * this.sensitivity;
            this._targetOffsetY = normalized.y * this.maxOffsetY * this.sensitivity;
        }
    };

    ParallaxSystem.prototype.update = function(deltaTime) {
        var factor = this.lerpFactor;
        if (deltaTime !== undefined && deltaTime > 0) {
            factor = Math.min(1, this.lerpFactor * (deltaTime / 16.67));
        }

        this._currentOffsetX += (this._targetOffsetX - this._currentOffsetX) * factor;
        this._currentOffsetY += (this._targetOffsetY - this._currentOffsetY) * factor;

        if (typeof this._onUpdate === 'function') {
            this._onUpdate(this._currentOffsetX, this._currentOffsetY);
        }
    };

    ParallaxSystem.prototype.getCurrentOffset = function() {
        return {
            x: this._currentOffsetX,
            y: this._currentOffsetY
        };
    };

    ParallaxSystem.prototype.setOnUpdate = function(callback) {
        this._onUpdate = callback;
    };

    ParallaxSystem.prototype.setSensitivity = function(sensitivity) {
        this.sensitivity = sensitivity;
    };

    ParallaxSystem.prototype.setMaxOffset = function(maxX, maxY) {
        this.maxOffsetX = maxX;
        this.maxOffsetY = maxY;
    };

    ParallaxSystem.prototype.setEnabled = function(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this._targetOffsetX = 0;
            this._targetOffsetY = 0;
        }
    };

    ParallaxSystem.prototype.bind = function(container) {
        this._container = container;

        var self = this;
        this._onMouseMove = function(e) {
            self._handleMouseMove(e);
        };
        this._onTouchMove = function(e) {
            self._handleTouchMove(e);
        };
        this._onTouchStart = function(e) {
            self._handleTouchStart(e);
        };

        container.addEventListener('mousemove', this._onMouseMove);
        container.addEventListener('touchmove', this._onTouchMove, { passive: true });
        container.addEventListener('touchstart', this._onTouchStart, { passive: true });
    };

    ParallaxSystem.prototype.unbind = function() {
        if (this._container) {
            if (this._onMouseMove) {
                this._container.removeEventListener('mousemove', this._onMouseMove);
            }
            if (this._onTouchMove) {
                this._container.removeEventListener('touchmove', this._onTouchMove);
            }
            if (this._onTouchStart) {
                this._container.removeEventListener('touchstart', this._onTouchStart);
            }
        }
        this._container = null;
        this._onMouseMove = null;
        this._onTouchMove = null;
        this._onTouchStart = null;
    };

    ParallaxSystem.prototype.reset = function() {
        this._targetOffsetX = 0;
        this._targetOffsetY = 0;
        this._currentOffsetX = 0;
        this._currentOffsetY = 0;
    };

    ParallaxSystem.prototype.destroy = function() {
        this.unbind();
        this._onUpdate = null;
    };

    return {
        ParallaxSystem: ParallaxSystem,
        create: function(options) {
            return new ParallaxSystem(options);
        }
    };
})();
