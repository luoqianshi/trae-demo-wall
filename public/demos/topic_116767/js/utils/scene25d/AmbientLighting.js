var AmbientLighting = (function() {
    'use strict';

    var PIXEL_STYLE_ENABLED = false;

    var CEILING_LIGHT_CONFIGS = [
        { region: 'livingroom', x: 350, y: 120, size: 28 },
        { region: 'bedroom', x: 675, y: 340, size: 24 },
        { region: 'study', x: 80, y: 385, size: 22 },
        { region: 'kitchen', x: 675, y: 140, size: 24 },
        { region: 'entryway', x: 50, y: 200, size: 20 },
        { region: 'balcony', x: 400, y: 50, size: 22 }
    ];

    var STAGE_LIGHTING = {
        0: {
            ambianceTop: 'rgba(80, 80, 100, 0.15)',
            ambianceBottom: 'rgba(139, 111, 71, 0.05)',
            lightIntensity: 0.3,
            warmth: 0.2,
            name: '毛坯阶段'
        },
        1: {
            ambianceTop: 'rgba(74, 111, 165, 0.12)',
            ambianceBottom: 'rgba(139, 111, 71, 0.06)',
            lightIntensity: 0.4,
            warmth: 0.3,
            name: '设计阶段'
        },
        2: {
            ambianceTop: 'rgba(100, 80, 60, 0.14)',
            ambianceBottom: 'rgba(200, 74, 62, 0.05)',
            lightIntensity: 0.35,
            warmth: 0.35,
            name: '水电阶段'
        },
        3: {
            ambianceTop: 'rgba(91, 140, 90, 0.1)',
            ambianceBottom: 'rgba(139, 111, 71, 0.07)',
            lightIntensity: 0.5,
            warmth: 0.45,
            name: '泥木阶段'
        },
        4: {
            ambianceTop: 'rgba(255, 200, 100, 0.08)',
            ambianceBottom: 'rgba(255, 215, 0, 0.06)',
            lightIntensity: 0.7,
            warmth: 0.7,
            name: '安装阶段'
        },
        5: {
            ambianceTop: 'rgba(255, 220, 150, 0.06)',
            ambianceBottom: 'rgba(255, 200, 100, 0.08)',
            lightIntensity: 0.85,
            warmth: 0.8,
            name: '软装阶段'
        },
        6: {
            ambianceTop: 'rgba(255, 230, 180, 0.05)',
            ambianceBottom: 'rgba(255, 215, 120, 0.1)',
            lightIntensity: 1,
            warmth: 0.9,
            name: '竣工阶段'
        }
    };

    var REGION_LIGHTING = {
        livingroom: {
            glowColor: 'rgba(255, 220, 150, 0.15)',
            glowSize: 120,
            intensity: 1
        },
        bedroom: {
            glowColor: 'rgba(255, 200, 150, 0.12)',
            glowSize: 100,
            intensity: 0.8
        },
        study: {
            glowColor: 'rgba(200, 220, 255, 0.1)',
            glowSize: 80,
            intensity: 0.7
        },
        kitchen: {
            glowColor: 'rgba(255, 255, 220, 0.12)',
            glowSize: 90,
            intensity: 0.85
        },
        entryway: {
            glowColor: 'rgba(255, 200, 150, 0.1)',
            glowSize: 70,
            intensity: 0.6
        },
        balcony: {
            glowColor: 'rgba(200, 230, 255, 0.12)',
            glowSize: 100,
            intensity: 0.75
        }
    };

    function AmbientLighting() {
        this.container = null;
        this._initialized = false;
        this._currentStage = 0;
        this._currentHour = 14;
        this._lowPerformanceMode = false;
        this._pixelStyleEnabled = false;
        this._lightingLayer = null;
        this._ambianceOverlay = null;
        this._lightSpots = [];
        this._windowLights = [];
        this._wallDecorations = [];
        this._floorHighlights = null;
        this._ceilingLights = [];
        this._workLights = [];
        this._animationFrame = null;
        this._animationTime = 0;
        this._lightAnimationEnabled = true;
        this._mouseOffsetX = 0;
        this._mouseOffsetY = 0;
        this._onMouseMove = null;
    }

    AmbientLighting.prototype.init = function(container, options) {
        if (this._initialized) return;
        options = options || {};

        if (typeof container === 'string') {
            this.container = document.querySelector(container);
        } else if (container instanceof Element) {
            this.container = container;
        }

        if (!this.container) {
            console.error('[AmbientLighting] Container not found');
            return false;
        }

        this._lowPerformanceMode = options.lowPerformanceMode || false;
        this._currentStage = options.stage !== undefined ? options.stage : 0;
        this._currentHour = options.hour !== undefined ? options.hour : 14;
        this._pixelStyleEnabled = options.pixelStyleEnabled || false;

        this._createLightingLayer();
        this._createAmbianceOverlay();
        this._createLightSpots();
        this._createWindowLights();
        this._createWallDecorations();
        this._createFloorHighlights();

        if (this._pixelStyleEnabled) {
            this._createCeilingLights();
            this._createWorkLights();
        }

        if (!this._lowPerformanceMode) {
            this._bindMouseMove();
            this._startLightAnimation();
        }

        this._initialized = true;
        this.setStage(this._currentStage);

        return true;
    };

    AmbientLighting.prototype._createLightingLayer = function() {
        this._lightingLayer = document.createElement('div');
        this._lightingLayer.className = 'ambient-lighting-layer';
        this._lightingLayer.style.cssText = [
            'position: absolute',
            'width: 100%',
            'height: 100%',
            'top: 0',
            'left: 0',
            'pointer-events: none',
            'z-index: 2',
            'overflow: hidden'
        ].join(';');
        this.container.appendChild(this._lightingLayer);
    };

    AmbientLighting.prototype._createAmbianceOverlay = function() {
        this._ambianceOverlay = document.createElement('div');
        this._ambianceOverlay.className = 'ambient-ambiance-overlay';
        this._ambianceOverlay.style.cssText = [
            'position: absolute',
            'width: 100%',
            'height: 100%',
            'top: 0',
            'left: 0',
            'pointer-events: none',
            'transition: background 1.5s ease-in-out'
        ].join(';');
        this._lightingLayer.appendChild(this._ambianceOverlay);

        var vignette = document.createElement('div');
        vignette.className = 'ambient-vignette';
        vignette.style.cssText = [
            'position: absolute',
            'width: 100%',
            'height: 100%',
            'top: 0',
            'left: 0',
            'pointer-events: none',
            'background: radial-gradient(ellipse at center, transparent 40%, rgba(80, 60, 40, 0.1) 100%)'
        ].join(';');
        this._lightingLayer.appendChild(vignette);
    };

    AmbientLighting.prototype._createLightSpots = function() {
        var spotConfigs = [
            { x: 350, y: 150, size: 150, color: 'rgba(255, 230, 180, 0.12)', region: 'livingroom' },
            { x: 650, y: 350, size: 100, color: 'rgba(255, 210, 160, 0.1)', region: 'bedroom' },
            { x: 100, y: 400, size: 80, color: 'rgba(200, 220, 255, 0.08)', region: 'study' }
        ];

        for (var i = 0; i < spotConfigs.length; i++) {
            var config = spotConfigs[i];
            var spot = document.createElement('div');
            spot.className = 'ambient-light-spot ambient-light-spot-' + i;
            spot.setAttribute('data-region', config.region);
            spot.style.cssText = [
                'position: absolute',
                'width: ' + config.size + 'px',
                'height: ' + config.size + 'px',
                'left: ' + (config.x - config.size / 2) + 'px',
                'top: ' + (config.y - config.size / 2) + 'px',
                'border-radius: 50%',
                'background: radial-gradient(circle, ' + config.color + ' 0%, transparent 70%)',
                'pointer-events: none',
                'opacity: 0.6',
                'transition: opacity 1s ease-in-out'
            ].join(';');
            this._lightingLayer.appendChild(spot);
            this._lightSpots.push({
                element: spot,
                x: config.x,
                y: config.y,
                size: config.size,
                baseColor: config.color,
                region: config.region
            });
        }
    };

    AmbientLighting.prototype._createWindowLights = function() {
        var windowConfigs = [
            { x: 300, y: 10, width: 200, height: 80, angle: -15, opacity: 0.15, region: 'balcony' }
        ];

        for (var i = 0; i < windowConfigs.length; i++) {
            var config = windowConfigs[i];
            var windowLight = document.createElement('div');
            windowLight.className = 'ambient-window-light ambient-window-light-' + i;
            windowLight.setAttribute('data-region', config.region);
            windowLight.style.cssText = [
                'position: absolute',
                'width: ' + config.width + 'px',
                'height: ' + config.height + 'px',
                'left: ' + config.x + 'px',
                'top: ' + config.y + 'px',
                'pointer-events: none',
                'opacity: ' + config.opacity,
                'transform-origin: top center',
                'transform: skewX(' + config.angle + 'deg)',
                'background: repeating-linear-gradient(',
                '  90deg,',
                '  transparent,',
                '  transparent 20px,',
                '  rgba(255, 240, 200, 0.3) 20px,',
                '  rgba(255, 240, 200, 0.3) 22px',
                ')',
                'transition: opacity 1s ease-in-out'
            ].join(';');
            this._lightingLayer.appendChild(windowLight);
            this._windowLights.push({
                element: windowLight,
                x: config.x,
                y: config.y,
                width: config.width,
                height: config.height,
                angle: config.angle,
                baseOpacity: config.opacity,
                region: config.region
            });
        }
    };

    AmbientLighting.prototype._createWallDecorations = function() {
        var decorationConfigs = [
            { x: 200, y: 120, width: 60, height: 50, frameColor: '#8B6F47', innerColor: '#E8F0F8' },
            { x: 500, y: 130, width: 50, height: 60, frameColor: '#A07858', innerColor: '#F5EEE8' },
            { x: 700, y: 150, width: 45, height: 55, frameColor: '#8B6F47', innerColor: '#F0E8F0' }
        ];

        for (var i = 0; i < decorationConfigs.length; i++) {
            var config = decorationConfigs[i];
            var frame = document.createElement('div');
            frame.className = 'ambient-wall-frame ambient-wall-frame-' + i;
            frame.style.cssText = [
                'position: absolute',
                'width: ' + config.width + 'px',
                'height: ' + config.height + 'px',
                'left: ' + config.x + 'px',
                'top: ' + config.y + 'px',
                'border: 3px solid ' + config.frameColor,
                'background: ' + config.innerColor,
                'box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.15)',
                'pointer-events: none',
                'opacity: 0.7',
                'transition: opacity 1s ease-in-out'
            ].join(';');

            var innerArt = document.createElement('div');
            innerArt.style.cssText = [
                'position: absolute',
                'width: 70%',
                'height: 60%',
                'left: 15%',
                'top: 20%',
                'background: linear-gradient(135deg, rgba(135, 206, 235, 0.4) 0%, rgba(144, 238, 144, 0.3) 100%)',
                'border-radius: 2px'
            ].join(';');
            frame.appendChild(innerArt);

            this._lightingLayer.appendChild(frame);
            this._wallDecorations.push({
                element: frame,
                x: config.x,
                y: config.y
            });
        }
    };

    AmbientLighting.prototype._createFloorHighlights = function() {
        this._floorHighlights = document.createElement('div');
        this._floorHighlights.className = 'ambient-floor-highlights';
        this._floorHighlights.style.cssText = [
            'position: absolute',
            'width: 100%',
            'height: 30%',
            'bottom: 0',
            'left: 0',
            'pointer-events: none',
            'background: linear-gradient(180deg, transparent 0%, rgba(255, 250, 240, 0.05) 50%, rgba(255, 245, 230, 0.08) 100%)'
        ].join(';');
        this._lightingLayer.appendChild(this._floorHighlights);
    };

    AmbientLighting.prototype._createCeilingLights = function() {
        for (var i = 0; i < CEILING_LIGHT_CONFIGS.length; i++) {
            var config = CEILING_LIGHT_CONFIGS[i];
            var light = document.createElement('div');
            light.className = 'pixel-ceiling-light';
            light.setAttribute('data-region', config.region);
            var size = config.size || 24;
            light.style.cssText = [
                'position: absolute',
                'width: ' + size + 'px',
                'height: ' + size + 'px',
                'left: ' + (config.x - size / 2) + 'px',
                'top: ' + (config.y - size / 2) + 'px',
                'pointer-events: none',
                'z-index: 5',
                'image-rendering: pixelated',
                'opacity: 0',
                'transition: opacity 0.8s steps(4)'
            ].join(';');

            var body = document.createElement('div');
            body.className = 'pixel-ceiling-light-body';
            body.style.cssText = [
                'position: absolute',
                'width: 100%',
                'height: 60%',
                'top: 0',
                'background: #F5F0E8',
                'border: 2px solid #8B6F47',
                'box-sizing: border-box',
                'box-shadow: inset 2px 2px 0 rgba(255,255,255,0.5), inset -2px -2px 0 rgba(0,0,0,0.1)'
            ].join(';');

            var glow = document.createElement('div');
            glow.className = 'pixel-ceiling-light-glow';
            glow.style.cssText = [
                'position: absolute',
                'width: 200%',
                'height: 200%',
                'left: -50%',
                'top: 20%',
                'opacity: 0',
                'transition: opacity 1s ease-in-out',
                'background: radial-gradient(ellipse at top, rgba(255,240,200,0.15) 0%, transparent 50%)'
            ].join(';');

            light.appendChild(body);
            light.appendChild(glow);
            this._lightingLayer.appendChild(light);

            this._ceilingLights.push({
                element: light,
                region: config.region,
                x: config.x,
                y: config.y,
                size: size,
                body: body,
                glow: glow
            });
        }
    };

    AmbientLighting.prototype._createWorkLights = function() {
        var workLightConfigs = [
            { x: 200, y: 200, size: 18 },
            { x: 500, y: 250, size: 16 }
        ];

        for (var i = 0; i < workLightConfigs.length; i++) {
            var config = workLightConfigs[i];
            var light = document.createElement('div');
            light.className = 'pixel-work-light';
            var size = config.size || 16;
            light.style.cssText = [
                'position: absolute',
                'width: ' + size + 'px',
                'height: ' + (size + 10) + 'px',
                'left: ' + (config.x - size / 2) + 'px',
                'top: ' + (config.y - size / 2) + 'px',
                'pointer-events: none',
                'z-index: 4',
                'image-rendering: pixelated',
                'opacity: 0',
                'transition: opacity 0.6s steps(3)'
            ].join(';');

            var body = document.createElement('div');
            body.className = 'pixel-work-light-body';
            body.style.cssText = [
                'position: absolute',
                'width: 100%',
                'height: 65%',
                'top: 0',
                'background: #FFD700',
                'border: 2px solid #8B6F47',
                'box-sizing: border-box'
            ].join(';');

            var stand = document.createElement('div');
            stand.className = 'pixel-work-light-stand';
            stand.style.cssText = [
                'position: absolute',
                'width: 4px',
                'height: 35%',
                'bottom: 0',
                'left: 50%',
                'transform: translateX(-50%)',
                'background: #666'
            ].join(';');

            light.appendChild(body);
            light.appendChild(stand);
            this._lightingLayer.appendChild(light);

            this._workLights.push({
                element: light,
                x: config.x,
                y: config.y,
                body: body
            });
        }
    };

    AmbientLighting.prototype._bindMouseMove = function() {
        var self = this;
        this._onMouseMove = function(e) {
            if (!self.container) return;
            var rect = self.container.getBoundingClientRect();
            var centerX = rect.left + rect.width / 2;
            var centerY = rect.top + rect.height / 2;
            var normalizedX = (e.clientX - centerX) / (rect.width / 2);
            var normalizedY = (e.clientY - centerY) / (rect.height / 2);
            normalizedX = Math.max(-1, Math.min(1, normalizedX));
            normalizedY = Math.max(-1, Math.min(1, normalizedY));
            self._mouseOffsetX = normalizedX * 8;
            self._mouseOffsetY = normalizedY * 5;
        };
        this.container.addEventListener('mousemove', this._onMouseMove);
    };

    AmbientLighting.prototype._unbindMouseMove = function() {
        if (this._onMouseMove && this.container) {
            this.container.removeEventListener('mousemove', this._onMouseMove);
            this._onMouseMove = null;
        }
    };

    AmbientLighting.prototype._startLightAnimation = function() {
        var self = this;
        var lastTime = 0;

        function animate(currentTime) {
            if (!self._lightAnimationEnabled) {
                self._animationFrame = requestAnimationFrame(animate);
                return;
            }

            var deltaTime = lastTime ? (currentTime - lastTime) / 1000 : 0;
            lastTime = currentTime;

            self._animationTime += deltaTime;
            self._updateLightAnimation();

            self._animationFrame = requestAnimationFrame(animate);
        }

        this._animationFrame = requestAnimationFrame(animate);
    };

    AmbientLighting.prototype._stopLightAnimation = function() {
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
    };

    AmbientLighting.prototype._updateLightAnimation = function() {
        var time = this._animationTime;
        var slowCycle = time * 0.03;
        var fastCycle = time * 0.1;

        for (var i = 0; i < this._lightSpots.length; i++) {
            var spot = this._lightSpots[i];
            var element = spot.element;
            var offsetX = Math.sin(slowCycle + i * 2) * 5;
            var offsetY = Math.cos(slowCycle * 0.7 + i * 1.5) * 3;
            var scale = 1 + Math.sin(fastCycle + i) * 0.03;
            var parallaxX = this._mouseOffsetX * (0.3 + i * 0.1);
            var parallaxY = this._mouseOffsetY * (0.3 + i * 0.1);
            element.style.transform = 'translate3d(' + (offsetX + parallaxX) + 'px, ' + (offsetY + parallaxY) + 'px, 0) scale(' + scale + ')';
        }

        for (var j = 0; j < this._windowLights.length; j++) {
            var windowLight = this._windowLights[j];
            var wElement = windowLight.element;
            var wOpacity = windowLight.baseOpacity * (0.85 + Math.sin(slowCycle + j) * 0.15);
            wElement.style.opacity = wOpacity;
            var wSkew = windowLight.angle + Math.sin(slowCycle * 0.5 + j) * 2;
            wElement.style.transform = 'skewX(' + wSkew + 'deg) translateX(' + (this._mouseOffsetX * 0.2) + 'px)';
        }

        for (var k = 0; k < this._wallDecorations.length; k++) {
            var deco = this._wallDecorations[k];
            var dElement = deco.element;
            var dOffsetX = this._mouseOffsetX * (0.1 + k * 0.05);
            var dOffsetY = this._mouseOffsetY * (0.1 + k * 0.05);
            dElement.style.transform = 'translate3d(' + dOffsetX + 'px, ' + dOffsetY + 'px, 0)';
        }
    };

    AmbientLighting.prototype.setStage = function(stageId) {
        try {
            this._currentStage = stageId;
            var lighting = STAGE_LIGHTING[stageId] || STAGE_LIGHTING[0];

            if (this._ambianceOverlay) {
                this._ambianceOverlay.style.background = [
                    'linear-gradient(180deg,',
                    lighting.ambianceTop + ' 0%,',
                    'transparent 30%,',
                    'transparent 70%,',
                    lighting.ambianceBottom + ' 100%)'
                ].join(' ');
            }

            var intensity = lighting.lightIntensity;
            for (var i = 0; i < this._lightSpots.length; i++) {
                var spot = this._lightSpots[i];
                var regionLight = REGION_LIGHTING[spot.region];
                var spotIntensity = regionLight ? intensity * regionLight.intensity : intensity * 0.5;
                spot.element.style.opacity = spotIntensity * 0.8;
            }

            for (var j = 0; j < this._windowLights.length; j++) {
                var windowLight = this._windowLights[j];
                var windowIntensity = intensity * 0.6;
                windowLight.element.style.opacity = windowLight.baseOpacity * windowIntensity;
            }

            for (var k = 0; k < this._wallDecorations.length; k++) {
                var decoOpacity = 0.4 + intensity * 0.4;
                this._wallDecorations[k].element.style.opacity = decoOpacity;
            }

            if (this._floorHighlights) {
                var floorOpacity = 0.3 + intensity * 0.5;
                this._floorHighlights.style.opacity = floorOpacity;
            }

            if (this._pixelStyleEnabled) {
                this._updatePixelLighting(stageId, intensity);
            }
        } catch (e) {
            console.error('[AmbientLighting] setStage error:', e);
        }
    };

    AmbientLighting.prototype._updatePixelLighting = function(stageId, intensity) {
        var ceilingLightOnStage = 3;
        var allLightsOnStage = 4;

        for (var i = 0; i < this._ceilingLights.length; i++) {
            var cl = this._ceilingLights[i];
            var shouldShow = stageId >= ceilingLightOnStage;
            var shouldBeOn = stageId >= allLightsOnStage;

            cl.element.style.opacity = shouldShow ? (shouldBeOn ? 1 : 0.6) : 0;

            if (shouldBeOn) {
                cl.element.classList.add('on');
                cl.glow.style.opacity = intensity * 0.8;
            } else {
                cl.element.classList.remove('on');
                cl.glow.style.opacity = 0;
            }
        }

        for (var j = 0; j < this._workLights.length; j++) {
            var wl = this._workLights[j];
            var workLightOn = stageId >= 2 && stageId < 4;
            wl.element.style.opacity = workLightOn ? 1 : 0;
            if (workLightOn) {
                wl.element.classList.add('on');
            } else {
                wl.element.classList.remove('on');
            }
        }
    };

    AmbientLighting.prototype.setTimeOfDay = function(hour) {
        this._currentHour = hour;

        var dayFactor = 1;
        if (hour >= 6 && hour < 12) {
            dayFactor = 0.6 + (hour - 6) / 6 * 0.4;
        } else if (hour >= 12 && hour < 18) {
            dayFactor = 1;
        } else if (hour >= 18 && hour < 21) {
            dayFactor = 1 - (hour - 18) / 3 * 0.4;
        } else {
            dayFactor = 0.4;
        }

        var warmth = 0.5;
        if (hour >= 6 && hour < 10) {
            warmth = 0.7;
        } else if (hour >= 17 && hour < 21) {
            warmth = 0.8;
        } else if (hour >= 21 || hour < 6) {
            warmth = 0.9;
        } else {
            warmth = 0.5;
        }

        for (var i = 0; i < this._lightSpots.length; i++) {
            var spot = this._lightSpots[i];
            spot.element.style.opacity = (0.4 + dayFactor * 0.4) * (this._lowPerformanceMode ? 0.5 : 1);
        }

        if (this._pixelStyleEnabled) {
            this._updatePixelNightMode(hour, dayFactor, warmth);
        }
    };

    AmbientLighting.prototype._updatePixelNightMode = function(hour, dayFactor, warmth) {
        var isNight = hour >= 20 || hour < 6;

        for (var i = 0; i < this._ceilingLights.length; i++) {
            var cl = this._ceilingLights[i];
            if (cl.element.classList.contains('on')) {
                var glowOpacity = isNight ? 1.2 : 0.8;
                cl.glow.style.opacity = glowOpacity;
            }
        }

        for (var j = 0; j < this._workLights.length; j++) {
            var wl = this._workLights[j];
            if (wl.element.classList.contains('on')) {
                wl.body.style.boxShadow = isNight ? '0 0 20px rgba(255,255,150,0.7)' : '0 0 15px rgba(255,255,150,0.5)';
            }
        }
    };

    AmbientLighting.prototype.setPixelStyleEnabled = function(enabled) {
        if (this._pixelStyleEnabled === enabled) return;
        this._pixelStyleEnabled = enabled;

        if (enabled && this._initialized) {
            this._createCeilingLights();
            this._createWorkLights();
            this._updatePixelLighting(this._currentStage, STAGE_LIGHTING[this._currentStage] ? STAGE_LIGHTING[this._currentStage].lightIntensity : 0.5);
        } else if (!enabled) {
            for (var i = 0; i < this._ceilingLights.length; i++) {
                if (this._ceilingLights[i].element && this._ceilingLights[i].element.parentNode) {
                    this._ceilingLights[i].element.parentNode.removeChild(this._ceilingLights[i].element);
                }
            }
            this._ceilingLights = [];

            for (var j = 0; j < this._workLights.length; j++) {
                if (this._workLights[j].element && this._workLights[j].element.parentNode) {
                    this._workLights[j].element.parentNode.removeChild(this._workLights[j].element);
                }
            }
            this._workLights = [];
        }
    };

    AmbientLighting.prototype.setLowPerformanceMode = function(enabled) {
        this._lowPerformanceMode = enabled;

        if (enabled) {
            this._lightAnimationEnabled = false;
            this._unbindMouseMove();
            this._stopLightAnimation();

            for (var i = 0; i < this._lightSpots.length; i++) {
                this._lightSpots[i].element.style.transition = 'none';
                this._lightSpots[i].element.style.transform = 'none';
            }
            for (var j = 0; j < this._windowLights.length; j++) {
                this._windowLights[j].element.style.transition = 'none';
                this._windowLights[j].element.style.transform = 'none';
            }
            for (var k = 0; k < this._wallDecorations.length; k++) {
                this._wallDecorations[k].element.style.transition = 'none';
                this._wallDecorations[k].element.style.transform = 'none';
            }

            this.setStage(this._currentStage);
        } else {
            this._lightAnimationEnabled = true;
            this._bindMouseMove();
            this._startLightAnimation();
            this.setStage(this._currentStage);
        }
    };

    AmbientLighting.prototype.pause = function() {
        if (!this._initialized) return;
        this._lightAnimationEnabled = false;
        this._stopLightAnimation();
    };

    AmbientLighting.prototype.resume = function() {
        if (!this._initialized) return;
        if (this._lowPerformanceMode) return;
        this._lightAnimationEnabled = true;
        this._startLightAnimation();
    };

    AmbientLighting.prototype.destroy = function() {
        if (!this._initialized) return;

        this._stopLightAnimation();
        this._unbindMouseMove();

        this._lightSpots = [];
        this._windowLights = [];
        this._wallDecorations = [];
        this._ceilingLights = [];
        this._workLights = [];

        if (this._lightingLayer && this._lightingLayer.parentNode) {
            this._lightingLayer.parentNode.removeChild(this._lightingLayer);
        }
        this._lightingLayer = null;
        this._ambianceOverlay = null;
        this._floorHighlights = null;

        this.container = null;
        this._initialized = false;
    };

    return {
        AmbientLighting: AmbientLighting,
        create: function(container, options) {
            var lighting = new AmbientLighting();
            lighting.init(container, options);
            return lighting;
        }
    };
})();
