var PerformanceUtils = (function() {
    'use strict';

    var STORAGE_KEY = 'performance_mode';
    var LOW_END_CPU_CORES = 4;
    var LOW_END_MEMORY_GB = 4;

    var state = {
        isLowEndDevice: false,
        prefersReducedMotion: false,
        initialized: false
    };

    function detectLowEndDevice() {
        var isLowEnd = false;
        var reasons = [];

        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= LOW_END_CPU_CORES) {
            isLowEnd = true;
            reasons.push('cpu_cores_low:' + navigator.hardwareConcurrency);
        }

        if (navigator.deviceMemory && navigator.deviceMemory <= LOW_END_MEMORY_GB) {
            isLowEnd = true;
            reasons.push('memory_low:' + navigator.deviceMemory);
        }

        var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            var screenWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
            if (screenWidth <= 480) {
                isLowEnd = true;
                reasons.push('mobile_small_screen');
            }
        }

        return {
            isLowEnd: isLowEnd,
            reasons: reasons
        };
    }

    function checkReducedMotion() {
        if (window.matchMedia) {
            var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
            return mq.matches;
        }
        return false;
    }

    function applyLowEndMode() {
        document.documentElement.classList.add('low-end-device');
    }

    function removeLowEndMode() {
        document.documentElement.classList.remove('low-end-device');
    }

    function init() {
        if (state.initialized) return;

        var savedMode = Storage.load(STORAGE_KEY);
        if (savedMode && savedMode.forced) {
            state.isLowEndDevice = savedMode.enabled;
        } else {
            var detection = detectLowEndDevice();
            state.isLowEndDevice = detection.isLowEnd;
        }

        state.prefersReducedMotion = checkReducedMotion();

        if (state.isLowEndDevice) {
            applyLowEndMode();
        }

        if (window.matchMedia) {
            var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (mq.addEventListener) {
                mq.addEventListener('change', function(e) {
                    state.prefersReducedMotion = e.matches;
                });
            } else if (mq.addListener) {
                mq.addListener(function(e) {
                    state.prefersReducedMotion = e.matches;
                });
            }
        }

        state.initialized = true;
    }

    function isLowEnd() {
        return state.isLowEndDevice;
    }

    function shouldReduceMotion() {
        return state.prefersReducedMotion || state.isLowEndDevice;
    }

    function setLowEndMode(enabled) {
        state.isLowEndDevice = enabled;
        Storage.save(STORAGE_KEY, {
            enabled: enabled,
            forced: true,
            updatedAt: Date.now()
        });

        if (enabled) {
            applyLowEndMode();
        } else {
            removeLowEndMode();
        }
    }

    function resetToAuto() {
        Storage.remove(STORAGE_KEY);
        var detection = detectLowEndDevice();
        state.isLowEndDevice = detection.isLowEnd;

        if (state.isLowEndDevice) {
            applyLowEndMode();
        } else {
            removeLowEndMode();
        }
    }

    function getDeviceInfo() {
        return {
            cores: navigator.hardwareConcurrency || null,
            memory: navigator.deviceMemory || null,
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth || document.documentElement.clientWidth,
            screenHeight: window.innerHeight || document.documentElement.clientHeight,
            isLowEnd: state.isLowEndDevice,
            prefersReducedMotion: state.prefersReducedMotion
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        init: init,
        isLowEnd: isLowEnd,
        shouldReduceMotion: shouldReduceMotion,
        setLowEndMode: setLowEndMode,
        resetToAuto: resetToAuto,
        getDeviceInfo: getDeviceInfo
    };
})();
