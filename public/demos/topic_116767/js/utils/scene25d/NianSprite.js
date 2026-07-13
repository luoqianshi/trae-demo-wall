var NianSprite = (function() {
    'use strict';

    var STATE_CONFIGS = {
        idle: {
            name: 'idle',
            type: 'css',
            cssClass: 'nian-sprite-idle',
            transitionDuration: 200,
            loop: true
        },
        walk: {
            name: 'walk',
            type: 'css',
            cssClass: 'nian-sprite-walk',
            transitionDuration: 150,
            loop: true
        },
        happy: {
            name: 'happy',
            type: 'css',
            cssClass: 'nian-sprite-happy',
            transitionDuration: 200,
            loop: true
        },
        thinking: {
            name: 'thinking',
            type: 'css',
            cssClass: 'nian-sprite-thinking',
            transitionDuration: 200,
            loop: true
        },
        wave: {
            name: 'wave',
            type: 'css',
            cssClass: 'nian-sprite-wave',
            transitionDuration: 200,
            loop: true
        },
        sleep: {
            name: 'sleep',
            type: 'css',
            cssClass: 'nian-sprite-sleep',
            transitionDuration: 300,
            loop: true
        },
        work: {
            name: 'work',
            type: 'css',
            cssClass: 'nian-sprite-work',
            transitionDuration: 150,
            loop: true
        },
        celebrate: {
            name: 'celebrate',
            type: 'css',
            cssClass: 'nian-sprite-celebrate',
            transitionDuration: 200,
            loop: true
        },
        confused: {
            name: 'confused',
            type: 'css',
            cssClass: 'nian-sprite-confused',
            transitionDuration: 200,
            loop: true
        },
        point: {
            name: 'point',
            type: 'css',
            cssClass: 'nian-sprite-point',
            transitionDuration: 200,
            loop: true
        }
    };

    function generateBulbSVG() {
        return '' +
            '<svg class="nian-bulb-svg" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">' +
                '<defs>' +
                    '<radialGradient id="bulbGlow" cx="50%" cy="40%" r="50%">' +
                        '<stop offset="0%" style="stop-color:#FFF9E6;stop-opacity:1" />' +
                        '<stop offset="100%" style="stop-color:#FFE066;stop-opacity:0.8" />' +
                    '</radialGradient>' +
                    '<linearGradient id="bulbBase" x1="0%" y1="0%" x2="0%" y2="100%">' +
                        '<stop offset="0%" style="stop-color:#C0C0C0;stop-opacity:1" />' +
                        '<stop offset="100%" style="stop-color:#808080;stop-opacity:1" />' +
                    '</linearGradient>' +
                '</defs>' +
                '<g class="nian-body">' +
                    '<ellipse class="nian-bulb-glow" cx="50" cy="45" rx="38" ry="42" fill="url(#bulbGlow)" />' +
                    '<ellipse class="nian-bulb-outline" cx="50" cy="45" rx="35" ry="40" fill="none" stroke="#DAA520" stroke-width="2" />' +
                    '<ellipse class="nian-bulb-highlight" cx="35" cy="30" rx="10" ry="15" fill="white" opacity="0.6" />' +
                    '<g class="nian-face">' +
                        '<g class="nian-eyes">' +
                            '<ellipse class="nian-eye nian-eye-left" cx="38" cy="42" rx="5" ry="6" fill="#333" />' +
                            '<ellipse class="nian-eye nian-eye-right" cx="62" cy="42" rx="5" ry="6" fill="#333" />' +
                            '<circle class="nian-eye-shine" cx="39" cy="40" r="2" fill="white" />' +
                            '<circle class="nian-eye-shine" cx="63" cy="40" r="2" fill="white" />' +
                        '</g>' +
                        '<g class="nian-cheeks">' +
                            '<ellipse class="nian-cheek nian-cheek-left" cx="28" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6" />' +
                            '<ellipse class="nian-cheek nian-cheek-right" cx="72" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6" />' +
                        '</g>' +
                        '<path class="nian-mouth" d="M 42 55 Q 50 62 58 55" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" />' +
                    '</g>' +
                '</g>' +
                '<g class="nian-base">' +
                    '<rect class="nian-base-top" x="35" y="80" width="30" height="8" rx="2" fill="url(#bulbBase)" />' +
                    '<rect class="nian-base-mid" x="38" y="88" width="24" height="8" rx="2" fill="url(#bulbBase)" />' +
                    '<rect class="nian-base-bot" x="40" y="96" width="20" height="10" rx="3" fill="url(#bulbBase)" />' +
                '</g>' +
                '<g class="nian-arms">' +
                    '<g class="nian-arm nian-arm-left">' +
                        '<ellipse cx="18" cy="60" rx="8" ry="12" fill="#FFE066" stroke="#DAA520" stroke-width="1.5" />' +
                    '</g>' +
                    '<g class="nian-arm nian-arm-right">' +
                        '<ellipse cx="82" cy="60" rx="8" ry="12" fill="#FFE066" stroke="#DAA520" stroke-width="1.5" />' +
                    '</g>' +
                '</g>' +
                '<g class="nian-legs">' +
                    '<ellipse class="nian-leg nian-leg-left" cx="42" cy="115" rx="7" ry="10" fill="#DAA520" />' +
                    '<ellipse class="nian-leg nian-leg-right" cx="58" cy="115" rx="7" ry="10" fill="#DAA520" />' +
                '</g>' +
            '</svg>';
    }

    function generateEffects() {
        return '' +
            '<div class="nian-effects">' +
                '<div class="nian-effect nian-effect-stars">' +
                    '<span class="star star-1">★</span>' +
                    '<span class="star star-2">✦</span>' +
                    '<span class="star star-3">★</span>' +
                '</div>' +
                '<div class="nian-effect nian-effect-hearts">' +
                    '<span class="heart heart-1">♥</span>' +
                    '<span class="heart heart-2">♥</span>' +
                    '<span class="heart heart-3">♥</span>' +
                '</div>' +
                '<div class="nian-effect nian-effect-sweat">' +
                    '<span class="sweat-drop sweat-1">💧</span>' +
                    '<span class="sweat-drop sweat-2">💧</span>' +
                '</div>' +
                '<div class="nian-effect nian-effect-zzz">' +
                    '<span class="zzz z1">Z</span>' +
                    '<span class="zzz z2">z</span>' +
                    '<span class="zzz z3">z</span>' +
                '</div>' +
                '<div class="nian-effect nian-effect-question">' +
                    '<span class="question-mark">?</span>' +
                '</div>' +
                '<div class="nian-effect nian-effect-confetti">' +
                    '<span class="confetti c1"></span>' +
                    '<span class="confetti c2"></span>' +
                    '<span class="confetti c3"></span>' +
                    '<span class="confetti c4"></span>' +
                    '<span class="confetti c5"></span>' +
                    '<span class="confetti c6"></span>' +
                '</div>' +
                '<div class="nian-effect nian-effect-pointing">' +
                    '<span class="pointing-arrow">→</span>' +
                '</div>' +
            '</div>';
    }

    function NianSprite(options) {
        options = options || {};
        this.width = options.width || 100;
        this.height = options.height || 140;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.initialState = options.initialState || 'idle';
        this.facing = options.facing || 'right';

        this._sprite = null;
        this._element = null;
        this._initialized = false;
    }

    NianSprite.prototype.init = function(container) {
        if (this._initialized) return;

        this._sprite = SpriteAnimation.create({
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            initialState: this.initialState,
            facing: this.facing
        });

        this._registerStates();
        this._createDOM();

        if (container) {
            this.attachTo(container);
        }

        this._initialized = true;
    };

    NianSprite.prototype._registerStates = function() {
        for (var stateName in STATE_CONFIGS) {
            if (STATE_CONFIGS.hasOwnProperty(stateName)) {
                this._sprite.registerState(stateName, STATE_CONFIGS[stateName]);
            }
        }
    };

    NianSprite.prototype._createDOM = function() {
        this._element = this._sprite.createDOM();
        this._element.classList.add('nian-sprite');

        var content = document.createElement('div');
        content.className = 'nian-sprite-content';
        content.innerHTML = generateBulbSVG() + generateEffects();

        this._element.appendChild(content);
    };

    NianSprite.prototype.setState = function(stateName) {
        if (this._sprite) {
            this._sprite.setState(stateName);
        }
    };

    NianSprite.prototype.setPosition = function(x, y) {
        if (this._sprite) {
            this._sprite.setPosition(x, y);
        }
    };

    NianSprite.prototype.moveTo = function(x, y, duration, callback) {
        if (this._sprite) {
            this._sprite.moveTo(x, y, duration, callback);
        }
    };

    NianSprite.prototype.setFacing = function(direction) {
        if (this._sprite) {
            this._sprite.setFacing(direction);
        }
    };

    NianSprite.prototype.update = function(deltaTime) {
        if (this._sprite) {
            this._sprite.update(deltaTime);
        }
    };

    NianSprite.prototype.start = function() {
        if (this._sprite) {
            this._sprite.start();
        }
    };

    NianSprite.prototype.stop = function() {
        if (this._sprite) {
            this._sprite.stop();
        }
    };

    NianSprite.prototype.getElement = function() {
        return this._element;
    };

    NianSprite.prototype.attachTo = function(container) {
        if (this._sprite) {
            this._sprite.attachTo(container);
        }
    };

    NianSprite.prototype.getCurrentState = function() {
        if (this._sprite) {
            return this._sprite.getCurrentState();
        }
        return null;
    };

    NianSprite.prototype.isMoving = function() {
        if (this._sprite) {
            return this._sprite.isMoving();
        }
        return false;
    };

    NianSprite.prototype.addUpdateCallback = function(callback) {
        if (this._sprite) {
            this._sprite.addUpdateCallback(callback);
        }
    };

    NianSprite.prototype.removeUpdateCallback = function(callback) {
        if (this._sprite) {
            this._sprite.removeUpdateCallback(callback);
        }
    };

    NianSprite.prototype.destroy = function() {
        if (this._sprite) {
            this._sprite.destroy();
            this._sprite = null;
        }
        this._element = null;
        this._initialized = false;
    };

    NianSprite.prototype.addToScene = function(scene, layerId) {
        if (!scene || !scene.getLayer) return false;

        var layer = scene.getLayer(layerId);
        if (!layer) return false;

        var el = this.getElement();
        if (el) {
            layer.addElement(el);
        }

        if (scene.addUpdateCallback) {
            var self = this;
            scene.addUpdateCallback(function(deltaTime) {
                self.update(deltaTime);
            });
        }

        return true;
    };

    return {
        NianSprite: NianSprite,
        STATES: Object.keys(STATE_CONFIGS),
        create: function(options) {
            var sprite = new NianSprite(options);
            return sprite;
        }
    };
})();
