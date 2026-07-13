var Scene25D = (function() {
    'use strict';

    function Scene25D() {
        this.container = null;
        this.layerManager = null;
        this.parallaxSystem = null;
        this.animationLoop = null;
        this._initialized = false;
        this._onResize = null;
        this._resizeTimeout = null;
        this._baseWidth = 800;
        this._baseHeight = 600;
        this._scale = 1;
        this._fpsMonitorInterval = null;
        this._lowPerformanceMode = false;
    }

    Scene25D.prototype.init = function(options) {
        if (this._initialized) return;

        options = options || {};

        this._baseWidth = options.baseWidth || 800;
        this._baseHeight = options.baseHeight || 600;

        if (typeof options.container === 'string') {
            this.container = document.querySelector(options.container);
        } else if (options.container instanceof Element) {
            this.container = options.container;
        }

        if (!this.container) {
            console.error('[Scene25D] Container not found');
            return false;
        }

        this.container.classList.add('scene25d-container');
        this._initLayerManager(options.layers);
        this._initParallaxSystem(options.parallax);
        this._initAnimationLoop();
        this._initResizeHandler();
        this._updateScale();

        this._initialized = true;
        this.start();

        return true;
    };

    Scene25D.prototype._initLayerManager = function(layersConfig) {
        this.layerManager = LayerManager.create();
        this.layerManager.render(this.container);

        if (layersConfig && layersConfig.length > 0) {
            for (var i = 0; i < layersConfig.length; i++) {
                this.layerManager.addLayer(layersConfig[i]);
            }
        }
    };

    Scene25D.prototype._initParallaxSystem = function(parallaxOptions) {
        this.parallaxSystem = ParallaxSystem.create(parallaxOptions);
        this.parallaxSystem.bind(this.container);

        var self = this;
        this.parallaxSystem.setOnUpdate(function(offsetX, offsetY) {
            if (self.layerManager) {
                self.layerManager.setParallaxOffset(offsetX, offsetY);
            }
        });
    };

    Scene25D.prototype._initAnimationLoop = function() {
        this.animationLoop = AnimationLoop.create();

        var self = this;
        this.animationLoop.addUpdateCallback(function(deltaTime) {
            if (self.parallaxSystem) {
                self.parallaxSystem.update(deltaTime);
            }
        });
    };

    Scene25D.prototype._initResizeHandler = function() {
        var self = this;
        var resizeDelay = 100;

        this._onResize = function() {
            if (self._resizeTimeout) {
                clearTimeout(self._resizeTimeout);
            }
            self._resizeTimeout = setTimeout(function() {
                self._updateScale();
                self._resizeTimeout = null;
            }, resizeDelay);
        };
        window.addEventListener('resize', this._onResize);
    };

    Scene25D.prototype._updateScale = function() {
        if (!this.container) return;

        var containerWidth = this.container.offsetWidth;
        var containerHeight = this.container.offsetHeight;

        var scaleX = containerWidth / this._baseWidth;
        var scaleY = containerHeight / this._baseHeight;
        this._scale = Math.min(scaleX, scaleY);

        var layers = this.container.querySelectorAll('.scene25d-layer');
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            layer.style.width = this._baseWidth + 'px';
            layer.style.height = this._baseHeight + 'px';
            layer.style.left = '50%';
            layer.style.top = '50%';
            layer.style.marginLeft = (-this._baseWidth / 2) + 'px';
            layer.style.marginTop = (-this._baseHeight / 2) + 'px';
            layer.style.transformOrigin = 'center center';
        }
    };

    Scene25D.prototype.getScale = function() {
        return this._scale;
    };

    Scene25D.prototype.addLayer = function(layerConfig) {
        if (this.layerManager) {
            var layer = this.layerManager.addLayer(layerConfig);
            this._updateScale();
            return layer;
        }
        return null;
    };

    Scene25D.prototype.removeLayer = function(id) {
        if (this.layerManager) {
            this.layerManager.removeLayer(id);
        }
    };

    Scene25D.prototype.getLayer = function(id) {
        if (this.layerManager) {
            return this.layerManager.getLayer(id);
        }
        return null;
    };

    Scene25D.prototype.start = function() {
        if (this.animationLoop) {
            this.animationLoop.start();
        }
        if (!this._fpsMonitorInterval) {
            this._startFPSMonitor();
        }
    };

    Scene25D.prototype.stop = function() {
        if (this.animationLoop) {
            this.animationLoop.stop();
        }
        if (this._fpsMonitorInterval) {
            clearInterval(this._fpsMonitorInterval);
            this._fpsMonitorInterval = null;
        }
    };

    Scene25D.prototype.pause = function() {
        if (this.animationLoop) {
            this.animationLoop.pause();
        }
    };

    Scene25D.prototype.resume = function() {
        if (this.animationLoop) {
            this.animationLoop.resume();
        }
    };

    Scene25D.prototype.addUpdateCallback = function(callback) {
        if (this.animationLoop) {
            this.animationLoop.addUpdateCallback(callback);
        }
    };

    Scene25D.prototype.removeUpdateCallback = function(callback) {
        if (this.animationLoop) {
            this.animationLoop.removeUpdateCallback(callback);
        }
    };

    Scene25D.prototype.addRenderCallback = function(callback) {
        if (this.animationLoop) {
            this.animationLoop.addRenderCallback(callback);
        }
    };

    Scene25D.prototype.removeRenderCallback = function(callback) {
        if (this.animationLoop) {
            this.animationLoop.removeRenderCallback(callback);
        }
    };

    Scene25D.prototype.getFPS = function() {
        if (this.animationLoop) {
            return this.animationLoop.getFPS();
        }
        return 0;
    };

    Scene25D.prototype.setParallaxEnabled = function(enabled) {
        if (this.parallaxSystem) {
            this.parallaxSystem.setEnabled(enabled);
        }
    };

    Scene25D.prototype.setParallaxSensitivity = function(sensitivity) {
        if (this.parallaxSystem) {
            this.parallaxSystem.setSensitivity(sensitivity);
        }
    };

    Scene25D.prototype._startFPSMonitor = function() {
        var self = this;
        var lowFPSCount = 0;
        var checkInterval = 2000;
        var lowFPSThreshold = 30;
        var maxLowFPSChecks = 3;

        this._fpsMonitorInterval = setInterval(function() {
            if (!self.animationLoop) return;

            var fps = self.animationLoop.getFPS();
            if (fps > 0 && fps < lowFPSThreshold) {
                lowFPSCount++;
                if (lowFPSCount >= maxLowFPSChecks && !self._lowPerformanceMode) {
                    self._enterLowPerformanceMode();
                }
            } else if (fps >= lowFPSThreshold + 10 && self._lowPerformanceMode) {
                lowFPSCount = Math.max(0, lowFPSCount - 1);
                if (lowFPSCount === 0) {
                    self._exitLowPerformanceMode();
                }
            } else {
                lowFPSCount = Math.max(0, lowFPSCount - 1);
            }
        }, checkInterval);
    };

    Scene25D.prototype._enterLowPerformanceMode = function() {
        this._lowPerformanceMode = true;
        if (this.parallaxSystem) {
            this.parallaxSystem.setEnabled(false);
        }
        if (this.container) {
            this.container.classList.add('low-performance-mode');
        }
        console.info('[Scene25D] 低性能模式已启用（帧率持续低于30fps）');
    };

    Scene25D.prototype._exitLowPerformanceMode = function() {
        this._lowPerformanceMode = false;
        if (this.parallaxSystem) {
            this.parallaxSystem.setEnabled(true);
        }
        if (this.container) {
            this.container.classList.remove('low-performance-mode');
        }
        console.info('[Scene25D] 低性能模式已关闭');
    };

    Scene25D.prototype.isLowPerformanceMode = function() {
        return this._lowPerformanceMode;
    };

    Scene25D.prototype.setLowPerformanceMode = function(enabled) {
        if (enabled) {
            this._enterLowPerformanceMode();
        } else {
            this._exitLowPerformanceMode();
        }
    };

    Scene25D.prototype.destroy = function() {
        if (!this._initialized) return;

        if (this._onResize) {
            window.removeEventListener('resize', this._onResize);
            this._onResize = null;
        }
        if (this._resizeTimeout) {
            clearTimeout(this._resizeTimeout);
            this._resizeTimeout = null;
        }
        if (this._fpsMonitorInterval) {
            clearInterval(this._fpsMonitorInterval);
            this._fpsMonitorInterval = null;
        }

        if (this.parallaxSystem) {
            this.parallaxSystem.destroy();
            this.parallaxSystem = null;
        }

        if (this.animationLoop) {
            this.animationLoop.destroy();
            this.animationLoop = null;
        }

        if (this.layerManager) {
            this.layerManager.destroy();
            this.layerManager = null;
        }

        if (this.container) {
            this.container.classList.remove('scene25d-container');
            this.container = null;
        }

        this._initialized = false;
    };

    return {
        Scene25D: Scene25D,
        create: function(options) {
            var scene = new Scene25D();
            if (options) {
                scene.init(options);
            }
            return scene;
        }
    };
})();
