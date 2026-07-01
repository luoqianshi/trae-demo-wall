'use strict';

window.WM = {
    state: {
        phase: 'intro',
        stageIndex: 0,
        progress: 0,
        hp: 100,
        totalCost: 0,
        totalDuration: 0,
    },
    currentStage: null,
    currentEnding: null,
    mapImgLoaded: false,
    tex: {},
    STAGES: [],
    ROUTES: {},
    scenes: {},
    endings: {},
    walkEffects: {},
    flow: {},
    map: {},
};

WM.VIEW_W = 480;
WM.VIEW_H = 270;
WM.TILE = 16;

WM.PAL = {
    floor:'#8b5a2b', floorDk:'#6b4423', floorLt:'#ab7a4b',
    wall:'#6b4423', wallDk:'#4a2f1a', wallLt:'#8b5a2b',
    bar:'#4a2f1a', barDk:'#2a180a', barLt:'#6b4423', barTop:'#3a2010',
    machine:'#2a2a2a', machineDk:'#0a0a0a', machineLt:'#5a5a5a',
    machineBtn:'#cc3333', coffee:'#4a2810',
    table:'#6b4423', tableDk:'#3a2010', tableLt:'#8b5a2b',
    chair:'#5a3a1a', chairDk:'#3a2010',
    lamp:'#ffcc00', lampDk:'#cc6600', lampGlow:'#ffee88',
    boardFrame:'#2a180a', boardBg:'#f5f5dc', boardText:'#2a180a',
    windowSky:'#6cb4e8', windowFrame:'#4a2f1a',
    plant:'#2d5016', plantLt:'#4a7c3a', pot:'#8b5a2b', potDk:'#6b4423',
    skin:'#ffd5b5', skinDk:'#e8b890',
    shirt:'#cc3333', shirtDk:'#992222', shirtLt:'#ff5555',
    pants:'#3333cc', pantsDk:'#222288',
    hair:'#4a2810', shoe:'#222222',
    black:'#000000', white:'#ffffff',
    star:'#ffdd44', starLt:'#ffff88',
    sky1:'#87CEEB', sky2:'#B0E0E6',
    ground1:'#8B7355', ground2:'#6B5333', grass:'#2ECC71',
    bldg1:'#B0B0B0', bldg2:'#C0C0C0', bldg3:'#A0A0A0',
    bldgWindow:'#FFD700', bldgWindow2:'#FF8C00',
    treeTrunk:'#6B5333',
    citySky1:'#1a2a4a', citySky2:'#2a3a5a',
    forestSky1:'#a8d8f0', forestSky2:'#c8e8f8',
    commercialSky1:'#3a1a3a', commercialSky2:'#5a2a5a',
    seasideSky1:'#ff7a3a', seasideSky2:'#ffaa5a',
    bldgWindow3:'#FFD700',
    yellow:'#FFD700', red:'#E74C3C', green:'#2ECC71', cyan:'#00D2D3',
};

WM.gameCanvas = document.getElementById('gameCanvas');
WM.gctx = WM.gameCanvas.getContext('2d');
WM.gctx.imageSmoothingEnabled = false;
WM.mapCanvas = document.getElementById('mapCanvas');
WM.mctx = WM.mapCanvas.getContext('2d');

WM.makeTex = function (w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    drawFn(g);
    return c;
};

WM.tx = function (i) { return i * WM.TILE; };
WM.ty = function (i) { return i * WM.TILE; };

WM.setProgress = function (text) {
    const el = document.getElementById('progressInfo');
    if (el) el.textContent = text;
};

WM.setStageInfo = function (text) {
    const el = document.getElementById('stageInfo');
    if (el) el.textContent = text;
};

WM.toGameCoord = function (e) {
    const rect = WM.gameCanvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / rect.width * WM.VIEW_W,
        y: (e.clientY - rect.top) / rect.height * WM.VIEW_H,
    };
};

WM.fitGameCanvas = function () {
    const section = WM.gameCanvas.parentElement;
    const rect = section.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    if (Math.abs(rect.width - (WM._gsW || 0)) < 0.5 && Math.abs(rect.height - (WM._gsH || 0)) < 0.5) return;
    WM._gsW = rect.width;
    WM._gsH = rect.height;
    const scale = Math.min(rect.width / WM.VIEW_W, rect.height / WM.VIEW_H);
    WM.gameCanvas.style.width = Math.round(WM.VIEW_W * scale) + 'px';
    WM.gameCanvas.style.height = Math.round(WM.VIEW_H * scale) + 'px';
};

window.addEventListener('keydown', function (e) {
    const phase = WM.state.phase;
    if (e.key === ' ') {
        const scene = WM.scenes[phase];
        if (scene && typeof scene.handleInput === 'function') {
            scene.handleInput('space');
        }
        if (phase === 'ending' && WM.currentEnding && typeof WM.currentEnding.handleInput === 'function') {
            WM.currentEnding.handleInput('space');
        }
        e.preventDefault();
    } else if (e.key === 'Enter') {
        if (phase === 'finale') {
            const scene = WM.scenes.finale;
            if (scene && typeof scene.handleInput === 'function') {
                scene.handleInput('enter');
            }
            e.preventDefault();
        }
    }
});

WM.gameCanvas.addEventListener('click', function (e) {
    const phase = WM.state.phase;
    const pos = WM.toGameCoord(e);
    const scene = WM.scenes[phase];
    if (scene && typeof scene.handleInput === 'function') {
        scene.handleInput('click', pos);
    }
    if (phase === 'ending' && WM.currentEnding && typeof WM.currentEnding.handleInput === 'function') {
        WM.currentEnding.handleInput('click', pos);
    }
});

WM.gameCanvas.addEventListener('mousemove', function (e) {
    if (WM.state.phase !== 'ending') return;
    if (!WM.currentEnding) return;
    const pos = WM.toGameCoord(e);
    if (typeof WM.currentEnding.handleMouseMove === 'function') {
        WM.currentEnding.handleMouseMove(pos.x, pos.y);
        WM.gameCanvas.style.cursor = WM.currentEnding.popupHover ? 'pointer' : 'default';
    }
});

window.addEventListener('resize', function () {
    WM.fitGameCanvas();
    if (WM.map && typeof WM.map.resize === 'function') WM.map.resize();
});

WM.lastTime = 0;
WM.gameLoop = function (now) {
    const dt = Math.min(now - WM.lastTime, 50);
    WM.lastTime = now;
    const phase = WM.state.phase;

    WM.fitGameCanvas();

    if (phase === 'ending') {
        if (WM.currentEnding) {
            if (typeof WM.currentEnding.update === 'function') WM.currentEnding.update(dt);
            if (typeof WM.currentEnding.draw === 'function') WM.currentEnding.draw(WM.gctx);
        }
    } else {
        const scene = WM.scenes[phase];
        if (scene) {
            if (typeof scene.update === 'function') scene.update(dt);
            if (typeof scene.draw === 'function') scene.draw(WM.gctx);
        }
    }

    if (phase === 'walk' || phase === 'arrived' || phase === 'transition') {
        if (WM.map && typeof WM.map.draw === 'function') WM.map.draw(WM.state.stageIndex);
    } else if (phase === 'finale') {
        if (WM.map && typeof WM.map.drawAll === 'function') WM.map.drawAll();
    }

    requestAnimationFrame(WM.gameLoop);
};

WM.start = function () {
    WM.fitGameCanvas();
    if (WM.map && typeof WM.map.init === 'function') WM.map.init();
    if (WM.textures && typeof WM.textures.init === 'function') WM.textures.init();
    WM.state.stageIndex = 0;
    WM.currentStage = WM.STAGES[0];
    if (WM.currentStage) {
        WM.setStageInfo('STAGE 1/4 · ' + WM.currentStage.name);
    }
    if (WM.flow && typeof WM.flow.enterIntro === 'function') {
        WM.flow.enterIntro(WM.currentStage);
    }
    requestAnimationFrame(WM.gameLoop);
};
