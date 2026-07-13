var GrowthAnimations = (function() {
    'use strict';

    var _styleElement = null;
    var _animationsRegistered = false;
    var _cssAnimations = {};
    var _jsAnimations = {};
    var _activeAnimations = [];

    var EASING_FUNCTIONS = {
        linear: function(t) { return t; },
        easeInQuad: function(t) { return t * t; },
        easeOutQuad: function(t) { return t * (2 - t); },
        easeInOutQuad: function(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
        easeInCubic: function(t) { return t * t * t; },
        easeOutCubic: function(t) { return (--t) * t * t + 1; },
        easeInOutCubic: function(t) { return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; },
        easeOutElastic: function(t) {
            var c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        },
        easeOutBounce: function(t) {
            var n1 = 7.5625;
            var d1 = 2.75;
            if (t < 1 / d1) {
                return n1 * t * t;
            } else if (t < 2 / d1) {
                return n1 * (t -= 1.5 / d1) * t + 0.75;
            } else if (t < 2.5 / d1) {
                return n1 * (t -= 2.25 / d1) * t + 0.9375;
            } else {
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        },
        easeOutBack: function(t) {
            var c1 = 1.70158;
            var c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
    };

    function _registerCSSAnimations() {
        if (_animationsRegistered) return;

        _styleElement = document.createElement('style');
        _styleElement.id = 'growth-animations-style';

        var keyframes = '';

        keyframes += '@keyframes fadeScaleIn {\n';
        keyframes += '  0% { opacity: 0; transform: scale(0); }\n';
        keyframes += '  60% { opacity: 1; transform: scale(1.1); }\n';
        keyframes += '  100% { opacity: 1; transform: scale(1); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes fadeScaleOut {\n';
        keyframes += '  0% { opacity: 1; transform: scale(1); }\n';
        keyframes += '  100% { opacity: 0; transform: scale(0); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes dropBounceIn {\n';
        keyframes += '  0% { opacity: 0; transform: translateY(-200px) scale(0.8); }\n';
        keyframes += '  50% { opacity: 1; transform: translateY(0) scale(1); }\n';
        keyframes += '  65% { transform: translateY(-20px) scale(0.95); }\n';
        keyframes += '  80% { transform: translateY(0) scale(1); }\n';
        keyframes += '  90% { transform: translateY(-10px) scale(0.98); }\n';
        keyframes += '  100% { transform: translateY(0) scale(1); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes dropBounceOut {\n';
        keyframes += '  0% { opacity: 1; transform: translateY(0) scale(1); }\n';
        keyframes += '  100% { opacity: 0; transform: translateY(100px) scale(0.5); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes growIn {\n';
        keyframes += '  0% { opacity: 0; transform: scale(0.3); filter: blur(10px); }\n';
        keyframes += '  50% { opacity: 0.7; filter: blur(3px); }\n';
        keyframes += '  100% { opacity: 1; transform: scale(1); filter: blur(0); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes growOut {\n';
        keyframes += '  0% { opacity: 1; transform: scale(1); filter: blur(0); }\n';
        keyframes += '  100% { opacity: 0; transform: scale(0.3); filter: blur(10px); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes buildIn {\n';
        keyframes += '  0% { opacity: 0; transform: scaleY(0) translateY(100%); }\n';
        keyframes += '  50% { opacity: 0.5; transform: scaleY(0.5) translateY(50%); }\n';
        keyframes += '  100% { opacity: 1; transform: scaleY(1) translateY(0); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes buildOut {\n';
        keyframes += '  0% { opacity: 1; transform: scaleY(1) translateY(0); }\n';
        keyframes += '  100% { opacity: 0; transform: scaleY(0) translateY(100%); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes slideLeftIn {\n';
        keyframes += '  0% { opacity: 0; transform: translateX(-100px); }\n';
        keyframes += '  100% { opacity: 1; transform: translateX(0); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes slideLeftOut {\n';
        keyframes += '  0% { opacity: 1; transform: translateX(0); }\n';
        keyframes += '  100% { opacity: 0; transform: translateX(-100px); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes slideRightIn {\n';
        keyframes += '  0% { opacity: 0; transform: translateX(100px); }\n';
        keyframes += '  100% { opacity: 1; transform: translateX(0); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes slideRightOut {\n';
        keyframes += '  0% { opacity: 1; transform: translateX(0); }\n';
        keyframes += '  100% { opacity: 0; transform: translateX(100px); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes slideUpIn {\n';
        keyframes += '  0% { opacity: 0; transform: translateY(100px); }\n';
        keyframes += '  100% { opacity: 1; transform: translateY(0); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes slideUpOut {\n';
        keyframes += '  0% { opacity: 1; transform: translateY(0); }\n';
        keyframes += '  100% { opacity: 0; transform: translateY(100px); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes flipIn {\n';
        keyframes += '  0% { opacity: 0; transform: perspective(400px) rotateY(90deg); }\n';
        keyframes += '  40% { transform: perspective(400px) rotateY(-10deg); }\n';
        keyframes += '  70% { transform: perspective(400px) rotateY(10deg); }\n';
        keyframes += '  100% { opacity: 1; transform: perspective(400px) rotateY(0deg); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes flipOut {\n';
        keyframes += '  0% { opacity: 1; transform: perspective(400px) rotateY(0deg); }\n';
        keyframes += '  100% { opacity: 0; transform: perspective(400px) rotateY(90deg); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes zoomIn {\n';
        keyframes += '  0% { opacity: 0; transform: scale(0.5); }\n';
        keyframes += '  100% { opacity: 1; transform: scale(1); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes zoomOut {\n';
        keyframes += '  0% { opacity: 1; transform: scale(1); }\n';
        keyframes += '  100% { opacity: 0; transform: scale(0.5); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes swingIn {\n';
        keyframes += '  0% { opacity: 0; transform: rotate(-30deg) translateY(-50px); transform-origin: top center; }\n';
        keyframes += '  50% { transform: rotate(10deg); }\n';
        keyframes += '  70% { transform: rotate(-5deg); }\n';
        keyframes += '  100% { opacity: 1; transform: rotate(0deg) translateY(0); transform-origin: top center; }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes swingOut {\n';
        keyframes += '  0% { opacity: 1; transform: rotate(0deg); transform-origin: top center; }\n';
        keyframes += '  100% { opacity: 0; transform: rotate(30deg) translateY(-50px); transform-origin: top center; }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes pulse {\n';
        keyframes += '  0%, 100% { transform: scale(1); }\n';
        keyframes += '  50% { transform: scale(1.05); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes float {\n';
        keyframes += '  0%, 100% { transform: translateY(0); }\n';
        keyframes += '  50% { transform: translateY(-10px); }\n';
        keyframes += '}\n\n';

        keyframes += '@keyframes sparkleIn {\n';
        keyframes += '  0% { opacity: 0; transform: scale(0) rotate(0deg); filter: brightness(3); }\n';
        keyframes += '  50% { opacity: 1; filter: brightness(1.5); }\n';
        keyframes += '  100% { opacity: 1; transform: scale(1) rotate(360deg); filter: brightness(1); }\n';
        keyframes += '}\n\n';

        _styleElement.textContent = keyframes;
        document.head.appendChild(_styleElement);

        _cssAnimations = {
            fadeScale: { in: 'fadeScaleIn', out: 'fadeScaleOut', duration: 500, easing: 'ease-out-back' },
            build: { in: 'buildIn', out: 'buildOut', duration: 600, easing: 'ease-out' },
            dropBounce: { in: 'dropBounceIn', out: 'dropBounceOut', duration: 800, easing: 'ease-out' },
            grow: { in: 'growIn', out: 'growOut', duration: 700, easing: 'ease-out' },
            slideLeft: { in: 'slideLeftIn', out: 'slideLeftOut', duration: 500, easing: 'ease-out-cubic' },
            slideRight: { in: 'slideRightIn', out: 'slideRightOut', duration: 500, easing: 'ease-out-cubic' },
            slideUp: { in: 'slideUpIn', out: 'slideUpOut', duration: 500, easing: 'ease-out-cubic' },
            flip: { in: 'flipIn', out: 'flipOut', duration: 600, easing: 'ease-out' },
            zoom: { in: 'zoomIn', out: 'zoomOut', duration: 400, easing: 'ease-out-back' },
            swing: { in: 'swingIn', out: 'swingOut', duration: 700, easing: 'ease-out-back' },
            sparkle: { in: 'sparkleIn', out: 'fadeScaleOut', duration: 800, easing: 'ease-out-back' }
        };

        _animationsRegistered = true;
    }

    function _getAnimationName(name, direction) {
        var baseName = name;
        var isOut = false;

        if (name.indexOf('Out') === name.length - 3) {
            baseName = name.substring(0, name.length - 3);
            isOut = true;
        }

        var anim = _cssAnimations[baseName];
        if (!anim) return null;

        return isOut ? anim.out : anim.in;
    }

    function _getAnimationConfig(name) {
        var baseName = name;
        if (name.indexOf('Out') === name.length - 3) {
            baseName = name.substring(0, name.length - 3);
        }
        return _cssAnimations[baseName] || null;
    }

    function playCSSAnimation(element, animationName, options) {
        options = options || {};

        var cssName = _getAnimationName(animationName, 'in');
        var config = _getAnimationConfig(animationName);

        if (!cssName || !config) {
            if (options.onComplete) options.onComplete();
            return null;
        }

        var duration = options.duration || config.duration;
        var delay = options.delay || 0;
        var easing = options.easing || 'ease-out';

        element.style.animation = 'none';
        element.offsetHeight;

        var animationValue = cssName + ' ' + duration + 'ms ' + easing + ' ' + delay + 'ms forwards';
        element.style.animation = animationValue;

        var onEnd = function(e) {
            if (e.animationName !== cssName) return;
            element.removeEventListener('animationend', onEnd);
            if (options.onComplete) options.onComplete();
        };

        element.addEventListener('animationend', onEnd);

        return {
            element: element,
            animationName: cssName,
            cancel: function() {
                element.removeEventListener('animationend', onEnd);
                element.style.animation = 'none';
            }
        };
    }

    function playJSAnimation(element, animationName, options) {
        options = options || {};

        var baseName = animationName;
        var isOut = false;
        if (animationName.indexOf('Out') === animationName.length - 3) {
            baseName = animationName.substring(0, animationName.length - 3);
            isOut = true;
        }

        var config = _cssAnimations[baseName];
        var duration = options.duration || (config ? config.duration : 500);
        var delay = options.delay || 0;
        var easingName = options.easing || 'easeOutCubic';
        var easing = EASING_FUNCTIONS[easingName] || EASING_FUNCTIONS.easeOutCubic;

        var animationId = null;
        var startTime = null;

        var animFn = _jsAnimations[baseName];

        var animate = function(currentTime) {
            if (startTime === null) startTime = currentTime;
            var elapsed = currentTime - startTime - delay;

            if (elapsed < 0) {
                animationId = requestAnimationFrame(animate);
                return;
            }

            var progress = Math.min(elapsed / duration, 1);
            var easedProgress = isOut ? 1 - easing(1 - progress) : easing(progress);

            if (animFn) {
                animFn(element, easedProgress, isOut);
            }

            if (progress < 1) {
                animationId = requestAnimationFrame(animate);
            } else {
                if (options.onComplete) options.onComplete();
            }
        };

        animationId = requestAnimationFrame(animate);

        _activeAnimations.push({ id: animationId, element: element });

        return {
            element: element,
            animationName: animationName,
            cancel: function() {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            }
        };
    }

    _jsAnimations.fadeScale = function(element, progress, isOut) {
        var scale = isOut ? 1 - progress * 0.8 : progress * 1.1 - (progress > 0.6 ? (progress - 0.6) * 0.5 : 0);
        scale = Math.max(0, Math.min(1.1, scale));
        var opacity = progress;

        element.style.opacity = opacity;
        var currentTransform = element.style.transform || '';
        if (currentTransform.indexOf('translate') === -1) {
            element.style.transform = 'scale(' + scale + ')';
        } else {
            element.style.transform = currentTransform.replace(/scale\([^)]*\)/, 'scale(' + scale + ')');
            if (element.style.transform.indexOf('scale(') === -1) {
                element.style.transform = currentTransform + ' scale(' + scale + ')';
            }
        }
    };

    _jsAnimations.build = function(element, progress, isOut) {
        var scaleY = progress;
        var translateY = (1 - progress) * 100;
        var opacity = progress;

        element.style.opacity = opacity;
        element.style.transformOrigin = 'bottom center';
        var currentTransform = element.style.transform || '';
        if (currentTransform.indexOf('translate') === -1) {
            element.style.transform = 'scaleY(' + scaleY + ') translateY(' + translateY + '%)';
        } else {
            element.style.transform = currentTransform + ' scaleY(' + scaleY + ') translateY(' + translateY + '%)';
        }
    };

    _jsAnimations.dropBounce = function(element, progress, isOut) {
        var bounceProgress = EASING_FUNCTIONS.easeOutBounce(progress);
        var translateY = isOut ? progress * 100 : (1 - bounceProgress) * -200;
        var scale = 0.8 + bounceProgress * 0.2;
        var opacity = progress;

        element.style.opacity = opacity;
        var currentTransform = element.style.transform || '';
        if (currentTransform.indexOf('translate') === -1) {
            element.style.transform = 'translateY(' + translateY + 'px) scale(' + scale + ')';
        } else {
            element.style.transform = currentTransform + ' translateY(' + translateY + 'px) scale(' + scale + ')';
        }
    };

    _jsAnimations.grow = function(element, progress, isOut) {
        var scale = isOut ? 1 - progress * 0.7 : 0.3 + progress * 0.7;
        var blur = isOut ? progress * 10 : (1 - progress) * 10;
        var opacity = progress;

        element.style.opacity = opacity;
        element.style.filter = 'blur(' + blur + 'px)';
        var currentTransform = element.style.transform || '';
        if (currentTransform.indexOf('scale') === -1) {
            element.style.transform = 'scale(' + scale + ')';
        } else {
            element.style.transform = currentTransform.replace(/scale\([^)]*\)/, 'scale(' + scale + ')');
            if (element.style.transform.indexOf('scale(') === -1) {
                element.style.transform = currentTransform + ' scale(' + scale + ')';
            }
        }
    };

    _jsAnimations.slideLeft = function(element, progress, isOut) {
        var translateX = isOut ? -progress * 100 : (1 - progress) * -100;
        var opacity = progress;

        element.style.opacity = opacity;
        var currentTransform = element.style.transform || '';
        if (currentTransform.indexOf('translateX') === -1) {
            element.style.transform = 'translateX(' + translateX + 'px)';
        } else {
            element.style.transform = currentTransform.replace(/translateX\([^)]*\)/, 'translateX(' + translateX + 'px)');
        }
    };

    _jsAnimations.slideRight = function(element, progress, isOut) {
        var translateX = isOut ? progress * 100 : (1 - progress) * 100;
        var opacity = progress;

        element.style.opacity = opacity;
        var currentTransform = element.style.transform || '';
        if (currentTransform.indexOf('translateX') === -1) {
            element.style.transform = 'translateX(' + translateX + 'px)';
        } else {
            element.style.transform = currentTransform.replace(/translateX\([^)]*\)/, 'translateX(' + translateX + 'px)');
        }
    };

    _jsAnimations.slideUp = function(element, progress, isOut) {
        var translateY = isOut ? progress * 100 : (1 - progress) * 100;
        var opacity = progress;

        element.style.opacity = opacity;
        var currentTransform = element.style.transform || '';
        if (currentTransform.indexOf('translateY') === -1) {
            element.style.transform = 'translateY(' + translateY + 'px)';
        } else {
            element.style.transform = currentTransform.replace(/translateY\([^)]*\)/, 'translateY(' + translateY + 'px)');
        }
    };

    _jsAnimations.flip = function(element, progress, isOut) {
        var rotateY = isOut ? progress * 90 : (1 - progress) * 90;
        var opacity = progress;

        element.style.opacity = opacity;
        var currentTransform = element.style.transform || '';
        if (currentTransform.indexOf('rotateY') === -1) {
            element.style.transform = 'perspective(400px) rotateY(' + rotateY + 'deg)';
        } else {
            element.style.transform = currentTransform.replace(/rotateY\([^)]*\)/, 'rotateY(' + rotateY + 'deg)');
        }
    };

    _jsAnimations.zoom = function(element, progress, isOut) {
        var scale = isOut ? 1 - progress * 0.5 : 0.5 + progress * 0.5;
        var opacity = progress;

        element.style.opacity = opacity;
        var currentTransform = element.style.transform || '';
        if (currentTransform.indexOf('scale') === -1) {
            element.style.transform = 'scale(' + scale + ')';
        } else {
            element.style.transform = currentTransform.replace(/scale\([^)]*\)/, 'scale(' + scale + ')');
            if (element.style.transform.indexOf('scale(') === -1) {
                element.style.transform = currentTransform + ' scale(' + scale + ')';
            }
        }
    };

    _jsAnimations.swing = function(element, progress, isOut) {
        var rotation = 0;
        var translateY = 0;

        if (isOut) {
            rotation = progress * 30;
            translateY = -progress * 50;
        } else {
            if (progress < 0.5) {
                rotation = -30 + progress * 80;
            } else if (progress < 0.7) {
                rotation = 10 - (progress - 0.5) * 75;
            } else {
                rotation = -5 + (progress - 0.7) * 50 / 3;
            }
            translateY = -(1 - progress) * 50;
        }

        element.style.opacity = progress;
        element.style.transformOrigin = 'top center';
        var currentTransform = element.style.transform || '';
        element.style.transform = 'rotate(' + rotation + 'deg) translateY(' + translateY + 'px)';
    };

    _jsAnimations.sparkle = function(element, progress, isOut) {
        var scale = isOut ? 1 - progress : progress;
        var rotation = progress * 360;
        var brightness = isOut ? 1 + progress * 2 : 3 - progress * 2;
        var opacity = progress;

        element.style.opacity = opacity;
        element.style.filter = 'brightness(' + brightness + ')';
        var currentTransform = element.style.transform || '';
        if (currentTransform.indexOf('scale') === -1 && currentTransform.indexOf('rotate') === -1) {
            element.style.transform = 'scale(' + scale + ') rotate(' + rotation + 'deg)';
        } else {
            element.style.transform = 'scale(' + scale + ') rotate(' + rotation + 'deg)';
        }
    };

    function play(element, animationName, options) {
        _registerCSSAnimations();

        options = options || {};
        var useCSS = options.mode !== 'js';

        if (useCSS) {
            return playCSSAnimation(element, animationName, options);
        } else {
            return playJSAnimation(element, animationName, options);
        }
    }

    function stopAll() {
        for (var i = 0; i < _activeAnimations.length; i++) {
            if (_activeAnimations[i].id) {
                cancelAnimationFrame(_activeAnimations[i].id);
            }
        }
        _activeAnimations = [];
    }

    function getEasing(name) {
        return EASING_FUNCTIONS[name] || null;
    }

    function getAvailableAnimations() {
        _registerCSSAnimations();
        return Object.keys(_cssAnimations);
    }

    function getAnimationConfig(name) {
        _registerCSSAnimations();
        return _getAnimationConfig(name);
    }

    function animateProperty(element, property, from, to, duration, easing, onComplete) {
        var easingFn = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS.easeOutCubic;
        var startTime = null;
        var animationId = null;

        var animate = function(currentTime) {
            if (startTime === null) startTime = currentTime;
            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var easedProgress = easingFn(progress);
            var currentValue = from + (to - from) * easedProgress;

            element.style[property] = currentValue + (typeof from === 'number' ? 'px' : '');

            if (progress < 1) {
                animationId = requestAnimationFrame(animate);
            } else {
                if (onComplete) onComplete();
            }
        };

        animationId = requestAnimationFrame(animate);

        return {
            cancel: function() {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            }
        };
    }

    function staggerAnimation(elements, animationName, options) {
        options = options || {};
        var delay = options.staggerDelay !== undefined ? options.staggerDelay : 100;
        var completed = 0;
        var total = elements.length;
        var animations = [];

        for (var i = 0; i < elements.length; i++) {
            (function(index) {
                var animOptions = {
                    delay: (options.delay || 0) + index * delay,
                    duration: options.duration,
                    easing: options.easing,
                    mode: options.mode,
                    onComplete: function() {
                        completed++;
                        if (completed === total && options.onComplete) {
                            options.onComplete();
                        }
                    }
                };
                var anim = play(elements[index], animationName, animOptions);
                if (anim) animations.push(anim);
            })(i);
        }

        return {
            cancel: function() {
                for (var i = 0; i < animations.length; i++) {
                    if (animations[i] && animations[i].cancel) {
                        animations[i].cancel();
                    }
                }
            }
        };
    }

    return {
        play: play,
        stopAll: stopAll,
        getEasing: getEasing,
        getAvailableAnimations: getAvailableAnimations,
        getAnimationConfig: getAnimationConfig,
        animateProperty: animateProperty,
        staggerAnimation: staggerAnimation,
        EASING: EASING_FUNCTIONS,
        playCSS: playCSSAnimation,
        playJS: playJSAnimation
    };
})();
