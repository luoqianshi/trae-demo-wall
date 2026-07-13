var ParticleSystem = (function() {
    var canvas = null;
    var ctx = null;
    var particles = [];
    var particlePool = [];
    var poolSize = 0;
    var animationId = null;
    var running = false;
    var gravity = 0.15;
    var friction = 0.98;
    var emitters = {};
    var savedEmitters = {};
    var canvasWidth = 0;
    var canvasHeight = 0;
    var visibilityHandler = null;
    var enabled = true;

    var maxParticles = 80;
    var targetFPS = 30;
    var lastFrameTime = 0;
    var resizeTimeout = null;

    var isMobileDevice = false;
    var isLowEndDevice = false;
    var devicePixelRatio = 1;

    function detectDevice() {
        devicePixelRatio = window.devicePixelRatio || 1;
        isMobileDevice = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        var cores = navigator.hardwareConcurrency || 2;
        var memory = navigator.deviceMemory || 2;
        var lowDPR = devicePixelRatio <= 1.5;
        var lowCores = cores <= 4;
        var lowMemory = memory <= 2;

        isLowEndDevice = isMobileDevice && (lowDPR || lowCores || lowMemory);

        if (isLowEndDevice) {
            maxParticles = Math.floor(80 * 0.3);
            targetFPS = 20;
        } else if (isMobileDevice) {
            maxParticles = Math.floor(80 * 0.5);
            targetFPS = 24;
        } else {
            maxParticles = 80;
            targetFPS = 30;
        }

        poolSize = maxParticles;
    }

    function initParticlePool() {
        particlePool = [];
        for (var i = 0; i < poolSize; i++) {
            particlePool.push(createEmptyParticle());
        }
    }

    function createEmptyParticle() {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            lifeSpan: 0,
            maxLife: 0,
            alpha: 0,
            size: 0,
            type: 'dust',
            color: '',
            rotation: 0,
            rotationSpeed: 0,
            gravity: 0,
            friction: 0,
            twinkle: 0,
            twinkleSpeed: 0,
            swayAmplitude: 0,
            swaySpeed: 0,
            swayOffset: 0,
            driftPhase: 0,
            driftSpeed: 0,
            active: false
        };
    }

    function resetParticle(p) {
        p.x = 0;
        p.y = 0;
        p.vx = 0;
        p.vy = 0;
        p.lifeSpan = 0;
        p.maxLife = 0;
        p.alpha = 0;
        p.size = 0;
        p.type = 'dust';
        p.color = '';
        p.rotation = 0;
        p.rotationSpeed = 0;
        p.gravity = 0;
        p.friction = 0;
        p.twinkle = 0;
        p.twinkleSpeed = 0;
        p.swayAmplitude = 0;
        p.swaySpeed = 0;
        p.swayOffset = 0;
        p.driftPhase = 0;
        p.driftSpeed = 0;
        p.active = false;
    }

    function acquireParticle() {
        if (particlePool.length > 0) {
            var p = particlePool.pop();
            resetParticle(p);
            p.active = true;
            return p;
        }
        var np = createEmptyParticle();
        np.active = true;
        return np;
    }

    function releaseParticle(p) {
        p.active = false;
        if (particlePool.length < poolSize * 2) {
            particlePool.push(p);
        }
    }

    function init(canvasElement) {
        if (!canvasElement) {
            console.error('ParticleSystem: canvas element is required');
            return false;
        }

        if (canvas && canvas === canvasElement) {
            return true;
        }

        if (canvas) {
            destroy();
        }

        detectDevice();

        if (!enabled) {
            return false;
        }

        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', debouncedResize);

        initParticlePool();

        visibilityHandler = function() {
            if (document.hidden) {
                handlePageHide();
            } else {
                handlePageShow();
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);

        return true;
    }

    function handlePageHide() {
        stop();
        for (var name in emitters) {
            savedEmitters[name] = Object.assign({}, emitters[name]);
        }
        for (var name in emitters) {
            emitters[name].active = false;
            delete emitters[name];
        }
    }

    function handlePageShow() {
        var hasSavedEmitters = Object.keys(savedEmitters).length > 0;
        if (hasSavedEmitters) {
            for (var name in savedEmitters) {
                emitters[name] = savedEmitters[name];
                emitters[name].active = true;
            }
            savedEmitters = {};
            start();
        } else if (particles.length > 0) {
            start();
        }
    }

    function debouncedResize() {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            resizeCanvas();
        }, 150);
    }

    function resizeCanvas() {
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        ctx.scale(devicePixelRatio, devicePixelRatio);
        canvasWidth = rect.width;
        canvasHeight = rect.height;
    }

    function createParticle(x, y, type, options) {
        options = options || {};
        var particle = acquireParticle();

        particle.x = x;
        particle.y = y;
        particle.vx = 0;
        particle.vy = 0;
        particle.lifeSpan = 60 + Math.random() * 40;
        particle.maxLife = 100;
        particle.alpha = 0.7 + Math.random() * 0.3;
        particle.size = 3 + Math.random() * 8;
        particle.type = type || 'ink';
        particle.rotation = 0;
        particle.rotationSpeed = 0;
        particle.gravity = gravity;
        particle.friction = friction;

        if (type === 'ink') {
            var angle = Math.random() * Math.PI * 2;
            var speed = Math.random() * 4 + 2;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 2;
            particle.color = 'rgba(44, 44, 44, ';
            particle.gravity = 0.12 + Math.random() * 0.06;
            particle.size = 2 + Math.random() * 10;
            particle.lifeSpan = 80 + Math.random() * 60;
        } else if (type === 'gold') {
            var angle = Math.random() * Math.PI * 2;
            var speed = Math.random() * 5 + 3;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 3;
            particle.color = 'rgba(232, 195, 106, ';
            particle.gravity = 0.15 + Math.random() * 0.05;
            particle.size = 2 + Math.random() * 6;
            particle.lifeSpan = 70 + Math.random() * 50;
            particle.twinkle = Math.random() * Math.PI * 2;
            particle.twinkleSpeed = 0.1 + Math.random() * 0.1;
        } else if (type === 'bamboo') {
            particle.vx = (Math.random() - 0.5) * 1.5;
            particle.vy = 0.5 + Math.random() * 1;
            particle.color = 'rgba(107, 155, 106, ';
            particle.gravity = 0.02 + Math.random() * 0.02;
            particle.size = 8 + Math.random() * 8;
            particle.lifeSpan = 200 + Math.random() * 150;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.03;
            particle.swayAmplitude = 0.5 + Math.random() * 0.5;
            particle.swaySpeed = 0.02 + Math.random() * 0.02;
            particle.swayOffset = Math.random() * Math.PI * 2;
        } else if (type === 'dust') {
            particle.vx = (Math.random() - 0.5) * 0.3;
            particle.vy = (Math.random() - 0.5) * 0.2;
            particle.color = 'rgba(247, 243, 236, ';
            particle.gravity = -0.005 + Math.random() * 0.01;
            particle.size = 1 + Math.random() * 3;
            particle.lifeSpan = 300 + Math.random() * 200;
            particle.alpha = 0.3 + Math.random() * 0.4;
            particle.driftPhase = Math.random() * Math.PI * 2;
            particle.driftSpeed = 0.01 + Math.random() * 0.01;
        }

        if (options.vx !== undefined) particle.vx = options.vx;
        if (options.vy !== undefined) particle.vy = options.vy;
        if (options.size !== undefined) particle.size = options.size;
        if (options.lifeSpan !== undefined) particle.lifeSpan = options.lifeSpan;

        particle.maxLife = particle.lifeSpan;
        return particle;
    }

    function burst(x, y, count, type, options) {
        if (!ctx || !enabled) {
            return;
        }
        var actualCount = Math.min(count, maxParticles - particles.length);
        for (var i = 0; i < actualCount; i++) {
            particles.push(createParticle(x, y, type, options));
        }
        if (!running && particles.length > 0) {
            start();
        }
    }

    function startEmitter(name, config) {
        if (!ctx || !enabled) return;
        if (emitters[name]) {
            stopEmitter(name);
        }
        emitters[name] = Object.assign({
            type: 'dust',
            rate: 2,
            x: 0,
            y: 0,
            width: canvasWidth,
            height: 0,
            active: true,
            frameCount: 0
        }, config);
        
        if (!running) {
            start();
        }
    }

    function stopEmitter(name) {
        if (emitters[name]) {
            emitters[name].active = false;
            delete emitters[name];
        }
    }

    function updateEmitters() {
        for (var name in emitters) {
            var emitter = emitters[name];
            if (!emitter.active) continue;
            
            emitter.frameCount++;
            var framesPerParticle = Math.max(1, Math.floor(targetFPS / emitter.rate));
            
            if (emitter.frameCount >= framesPerParticle) {
                emitter.frameCount = 0;
                if (particles.length < maxParticles) {
                    var x = emitter.x + Math.random() * emitter.width;
                    var y = emitter.y + Math.random() * emitter.height;
                    particles.push(createParticle(x, y, emitter.type, emitter.particleOptions));
                }
            }
        }
    }

    function updateParticles() {
        var writeIndex = 0;
        var margin = 30;

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            p.vy += p.gravity || gravity;
            p.vx *= p.friction || friction;
            p.vy *= p.friction || friction;

            if (p.type === 'bamboo' && !isLowEndDevice) {
                p.swayOffset += p.swaySpeed;
                p.vx += Math.sin(p.swayOffset) * p.swayAmplitude * 0.1;
                p.rotation += p.rotationSpeed;
            }

            if (p.type === 'dust') {
                p.driftPhase += p.driftSpeed;
                p.vx += Math.sin(p.driftPhase) * 0.02;
            }

            p.x += p.vx;
            p.y += p.vy;

            p.lifeSpan--;
            p.alpha = (p.lifeSpan / p.maxLife) * 0.8;

            if (p.type === 'ink') {
                p.size *= 0.995;
            }

            if (p.type === 'gold') {
                p.twinkle += p.twinkleSpeed;
                p.alpha *= 0.7 + 0.3 * Math.sin(p.twinkle);
            }

            var isDead = p.lifeSpan <= 0 || p.alpha <= 0.05 ||
                p.x < -margin || p.x > canvasWidth + margin ||
                p.y < -margin || p.y > canvasHeight + margin;

            if (isDead) {
                releaseParticle(p);
            } else {
                if (writeIndex !== i) {
                    particles[writeIndex] = p;
                }
                writeIndex++;
            }
        }

        particles.length = writeIndex;
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        var dustParticles = [];
        var inkParticles = [];
        var goldParticles = [];
        var bambooParticles = [];

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            switch (p.type) {
                case 'dust':
                    dustParticles.push(p);
                    break;
                case 'ink':
                    inkParticles.push(p);
                    break;
                case 'gold':
                    goldParticles.push(p);
                    break;
                case 'bamboo':
                    bambooParticles.push(p);
                    break;
            }
        }

        drawDustParticles(dustParticles);
        drawInkParticles(inkParticles);
        drawGoldParticles(goldParticles);
        drawBambooParticles(bambooParticles);
    }

    function drawDustParticles(list) {
        if (list.length === 0) return;
        ctx.fillStyle = 'rgba(247, 243, 236, 1)';
        for (var i = 0; i < list.length; i++) {
            var p = list[i];
            ctx.globalAlpha = p.alpha;
            var s = Math.max(1, Math.round(p.size));
            ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        }
        ctx.globalAlpha = 1;
    }

    function drawInkParticles(list) {
        if (list.length === 0) return;
        for (var i = 0; i < list.length; i++) {
            var p = list[i];
            if (isLowEndDevice) {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = '#2C2C2C';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                var gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, p.color + p.alpha + ')');
                gradient.addColorStop(0.6, p.color + (p.alpha * 0.6) + ')');
                gradient.addColorStop(1, p.color + '0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    function drawGoldParticles(list) {
        if (list.length === 0) return;
        for (var i = 0; i < list.length; i++) {
            var p = list[i];
            if (isLowEndDevice) {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = '#E8C36A';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                var gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, p.color + p.alpha + ')');
                gradient.addColorStop(0.6, p.color + (p.alpha * 0.6) + ')');
                gradient.addColorStop(1, p.color + '0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    function drawBambooParticles(list) {
        if (list.length === 0) return;
        for (var i = 0; i < list.length; i++) {
            var p = list[i];
            ctx.save();
            ctx.translate(p.x, p.y);
            if (!isLowEndDevice) {
                ctx.rotate(p.rotation);
            }
            if (isLowEndDevice) {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = '#6B9B6A';
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size / 4, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                var gradient = ctx.createLinearGradient(-p.size / 2, 0, p.size / 2, 0);
                gradient.addColorStop(0, p.color + '0)');
                gradient.addColorStop(0.3, p.color + p.alpha + ')');
                gradient.addColorStop(0.7, p.color + p.alpha + ')');
                gradient.addColorStop(1, p.color + '0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size / 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    function animate(timestamp) {
        if (!running) return;

        var elapsed = timestamp - lastFrameTime;
        if (elapsed < 1000 / targetFPS) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        lastFrameTime = timestamp - (elapsed % (1000 / targetFPS));

        updateEmitters();
        updateParticles();

        drawParticles();

        if (particles.length > 0 || Object.keys(emitters).length > 0) {
            animationId = requestAnimationFrame(animate);
        } else {
            running = false;
            animationId = null;
        }
    }

    function start() {
        if (running || !enabled) return;
        running = true;
        lastFrameTime = 0;
        animate(0);
    }

    function stop() {
        running = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function clear() {
        for (var i = 0; i < particles.length; i++) {
            releaseParticle(particles[i]);
        }
        particles = [];
        emitters = {};
        savedEmitters = {};
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        }
    }

    function destroy() {
        stop();
        clear();

        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
            resizeTimeout = null;
        }

        window.removeEventListener('resize', debouncedResize);

        if (visibilityHandler) {
            document.removeEventListener('visibilitychange', visibilityHandler);
            visibilityHandler = null;
        }

        particlePool = [];
        canvas = null;
        ctx = null;
    }

    function isRunning() {
        return running;
    }

    function getParticleCount() {
        return particles.length;
    }

    function isLowEnd() {
        return isLowEndDevice;
    }

    function isMobile() {
        return isMobileDevice;
    }

    function setEnabled(flag) {
        enabled = !!flag;
        if (!enabled) {
            stop();
            clear();
        }
    }

    function isEnabled() {
        return enabled;
    }

    function getConfig() {
        return {
            maxParticles: maxParticles,
            targetFPS: targetFPS,
            isMobile: isMobileDevice,
            isLowEnd: isLowEndDevice,
            devicePixelRatio: devicePixelRatio
        };
    }

    return {
        init: init,
        burst: burst,
        startEmitter: startEmitter,
        stopEmitter: stopEmitter,
        start: start,
        stop: stop,
        clear: clear,
        destroy: destroy,
        isRunning: isRunning,
        getParticleCount: getParticleCount,
        isLowEnd: isLowEnd,
        isMobile: isMobile,
        setEnabled: setEnabled,
        isEnabled: isEnabled,
        getConfig: getConfig
    };
})();
