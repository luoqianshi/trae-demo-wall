var AnimationLoop = (function() {
    'use strict';

    function AnimationLoop() {
        this._updateCallbacks = [];
        this._renderCallbacks = [];
        this._running = false;
        this._paused = false;
        this._lastTime = 0;
        this._deltaTime = 0;
        this._fps = 0;
        this._fpsCounter = 0;
        this._fpsLastTime = 0;
        this._animationFrameId = null;
        this._boundLoop = null;
    }

    AnimationLoop.prototype.addUpdateCallback = function(callback) {
        if (typeof callback === 'function' && this._updateCallbacks.indexOf(callback) === -1) {
            this._updateCallbacks.push(callback);
        }
    };

    AnimationLoop.prototype.removeUpdateCallback = function(callback) {
        var index = this._updateCallbacks.indexOf(callback);
        if (index > -1) {
            this._updateCallbacks.splice(index, 1);
        }
    };

    AnimationLoop.prototype.addRenderCallback = function(callback) {
        if (typeof callback === 'function' && this._renderCallbacks.indexOf(callback) === -1) {
            this._renderCallbacks.push(callback);
        }
    };

    AnimationLoop.prototype.removeRenderCallback = function(callback) {
        var index = this._renderCallbacks.indexOf(callback);
        if (index > -1) {
            this._renderCallbacks.splice(index, 1);
        }
    };

    AnimationLoop.prototype._loop = function(currentTime) {
        if (!this._running) return;

        this._deltaTime = currentTime - this._lastTime;
        this._lastTime = currentTime;

        this._fpsCounter++;
        if (currentTime - this._fpsLastTime >= 1000) {
            this._fps = this._fpsCounter;
            this._fpsCounter = 0;
            this._fpsLastTime = currentTime;
        }

        if (!this._paused) {
            for (var i = 0; i < this._updateCallbacks.length; i++) {
                try {
                    this._updateCallbacks[i](this._deltaTime);
                } catch (e) {
                    console.error('[AnimationLoop] Update callback error:', e);
                }
            }

            for (var j = 0; j < this._renderCallbacks.length; j++) {
                try {
                    this._renderCallbacks[j](this._deltaTime);
                } catch (e) {
                    console.error('[AnimationLoop] Render callback error:', e);
                }
            }
        }

        this._animationFrameId = requestAnimationFrame(this._boundLoop);
    };

    AnimationLoop.prototype.start = function() {
        if (this._running) return;

        this._running = true;
        this._paused = false;
        this._lastTime = performance.now();
        this._fpsLastTime = this._lastTime;
        this._fpsCounter = 0;
        this._fps = 0;

        var self = this;
        this._boundLoop = function(currentTime) {
            self._loop(currentTime);
        };

        this._animationFrameId = requestAnimationFrame(this._boundLoop);
    };

    AnimationLoop.prototype.stop = function() {
        this._running = false;
        this._paused = false;
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
        this._boundLoop = null;
    };

    AnimationLoop.prototype.pause = function() {
        this._paused = true;
    };

    AnimationLoop.prototype.resume = function() {
        this._paused = false;
        this._lastTime = performance.now();
    };

    AnimationLoop.prototype.isRunning = function() {
        return this._running;
    };

    AnimationLoop.prototype.isPaused = function() {
        return this._paused;
    };

    AnimationLoop.prototype.getDeltaTime = function() {
        return this._deltaTime;
    };

    AnimationLoop.prototype.getFPS = function() {
        return this._fps;
    };

    AnimationLoop.prototype.destroy = function() {
        this.stop();
        this._updateCallbacks = [];
        this._renderCallbacks = [];
    };

    return {
        AnimationLoop: AnimationLoop,
        create: function() {
            return new AnimationLoop();
        }
    };
})();
