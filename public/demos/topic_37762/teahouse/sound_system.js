var SoundSystem = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    //  音频上下文 — 使用Web Audio API生成程序化音效
    // ═══════════════════════════════════════════════════════════

    var _ctx = null;
    var _masterGain = null;
    var _musicGain = null;
    var _sfxGain = null;
    var _isMuted = false;
    var _musicVolume = 0.3;
    var _sfxVolume = 0.5;
    var _currentBgm = null;
    var _bgmNodes = [];

    // ═══════════════════════════════════════════════════════════
    //  音效定义 — 程序化生成
    // ═══════════════════════════════════════════════════════════

    var SFX = {
        SERVE_TEA:    { freq: 600, duration: 0.15, type: 'sine', decay: 0.3 },
        COIN:         { freq: 880, duration: 0.1, type: 'square', decay: 0.2 },
        CLICK:        { freq: 440, duration: 0.05, type: 'sine', decay: 0.1 },
        OPEN_SHOP:    { freq: 300, duration: 0.3, type: 'sine', decay: 0.5, sweep: 600 },
        CLOSE_SHOP:   { freq: 500, duration: 0.3, type: 'sine', decay: 0.5, sweep: 200 },
        UPGRADE:      { freq: 400, duration: 0.5, type: 'sine', decay: 0.8, sweep: 800 },
        DISCOVERY:    { freq: 700, duration: 0.4, type: 'triangle', decay: 0.6, sweep: 1200 },
        ENCOUNTER:    { freq: 350, duration: 0.2, type: 'triangle', decay: 0.3 },
        MOVE:         { freq: 200, duration: 0.08, type: 'sine', decay: 0.1 },
        NEW_DAY:      { freq: 500, duration: 0.6, type: 'sine', decay: 0.8, sweep: 700 },
        SEASON_CHANGE:{ freq: 300, duration: 0.8, type: 'sine', decay: 1.0, sweep: 900 },
        RAIN:         { freq: 100, duration: 0.05, type: 'sawtooth', decay: 0.05 },
        WIND:         { freq: 150, duration: 0.3, type: 'sawtooth', decay: 0.2 },
        ERROR:        { freq: 200, duration: 0.2, type: 'square', decay: 0.3 }
    };

    // BGM定义 — 简单的程序化旋律
    var BGM = {
        spring: {
            notes: [262, 294, 330, 349, 392, 349, 330, 294],
            tempo: 0.4,
            type: 'sine',
            name: '春晓'
        },
        summer: {
            notes: [392, 440, 494, 523, 494, 440, 392, 349],
            tempo: 0.35,
            type: 'triangle',
            name: '夏蝉'
        },
        autumn: {
            notes: [330, 349, 392, 440, 392, 349, 330, 294],
            tempo: 0.5,
            type: 'sine',
            name: '秋思'
        },
        winter: {
            notes: [262, 294, 262, 247, 262, 294, 330, 294],
            tempo: 0.6,
            type: 'triangle',
            name: '冬雪'
        },
        night: {
            notes: [196, 220, 262, 247, 220, 196, 175, 196],
            tempo: 0.7,
            type: 'sine',
            name: '月夜'
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  核心逻辑
    // ═══════════════════════════════════════════════════════════

    function _ensureContext() {
        if (_ctx) return true;
        try {
            _ctx = new (window.AudioContext || window.webkitAudioContext)();
            _masterGain = _ctx.createGain();
            _masterGain.gain.value = 1.0;
            _masterGain.connect(_ctx.destination);

            _musicGain = _ctx.createGain();
            _musicGain.gain.value = _musicVolume;
            _musicGain.connect(_masterGain);

            _sfxGain = _ctx.createGain();
            _sfxGain.gain.value = _sfxVolume;
            _sfxGain.connect(_masterGain);

            return true;
        } catch (e) {
            return false;
        }
    }

    function _playSfx(def) {
        if (!_ensureContext() || _isMuted) return;
        if (_ctx.state === 'suspended') _ctx.resume();

        var osc = _ctx.createOscillator();
        var gain = _ctx.createGain();

        osc.type = def.type || 'sine';
        osc.frequency.value = def.freq || 440;

        // 频率扫描
        if (def.sweep) {
            osc.frequency.setValueAtTime(def.freq, _ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(def.sweep, _ctx.currentTime + (def.duration || 0.2));
        }

        gain.gain.setValueAtTime(0.3, _ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + (def.duration || 0.2));

        osc.connect(gain);
        gain.connect(_sfxGain);

        osc.start(_ctx.currentTime);
        osc.stop(_ctx.currentTime + (def.duration || 0.2) + 0.05);
    }

    var _bgmTimerId = null;
    var _bgmNoteIndex = 0;

    function _playBgm(bgmKey) {
        if (!_ensureContext() || _isMuted) return;
        _stopBgm();

        var bgm = BGM[bgmKey];
        if (!bgm) return;

        _currentBgm = bgmKey;
        _bgmNoteIndex = 0;
        _bgmLoop(bgm);
    }

    function _bgmLoop(bgm) {
        if (!_ctx || _isMuted || _currentBgm !== bgm.name) return;

        var note = bgm.notes[_bgmNoteIndex % bgm.notes.length];
        _bgmNoteIndex++;

        try {
            if (_ctx.state === 'suspended') _ctx.resume();

            var osc = _ctx.createOscillator();
            var gain = _ctx.createGain();

            osc.type = bgm.type || 'sine';
            osc.frequency.value = note;

            gain.gain.setValueAtTime(0.15, _ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + bgm.tempo * 0.9);

            osc.connect(gain);
            gain.connect(_musicGain);

            osc.start(_ctx.currentTime);
            osc.stop(_ctx.currentTime + bgm.tempo);

            _bgmNodes.push(osc);
        } catch (e) { /* ignore */ }

        _bgmTimerId = setTimeout(function() { _bgmLoop(bgm); }, bgm.tempo * 1000);
    }

    function _stopBgm() {
        _currentBgm = null;
        if (_bgmTimerId) {
            clearTimeout(_bgmTimerId);
            _bgmTimerId = null;
        }
        for (var i = 0; i < _bgmNodes.length; i++) {
            try { _bgmNodes[i].stop(); } catch (e) { /* already stopped */ }
        }
        _bgmNodes = [];
    }

    // ═══════════════════════════════════════════════════════════
    //  公开接口
    // ═══════════════════════════════════════════════════════════

    function init() {
        // 延迟初始化AudioContext（需要用户交互后才能创建）
        document.addEventListener('click', function() {
            _ensureContext();
        }, { once: true });
        if (window.Logger) Logger.info('SoundSystem', '音效系统初始化');
    }

    function play(sfxName) {
        var def = SFX[sfxName];
        if (def) _playSfx(def);
    }

    function playBgm(key) {
        _playBgm(key);
    }

    function stopBgm() {
        _stopBgm();
    }

    function updateBgmByTime() {
        if (!window.GameTime || !_ensureContext()) return;
        var period = GameTime.getPeriod();
        var season = GameTime.getSeason();

        var bgmKey = period.id === 'night' ? 'night' : season.id;
        var bgmName = BGM[bgmKey] ? BGM[bgmKey].name : null;

        if (_currentBgm !== bgmName) {
            _playBgm(bgmKey);
        }
    }

    function setMusicVolume(v) {
        _musicVolume = Math.max(0, Math.min(1, v));
        if (_musicGain) _musicGain.gain.value = _musicVolume;
    }

    function setSfxVolume(v) {
        _sfxVolume = Math.max(0, Math.min(1, v));
        if (_sfxGain) _sfxGain.gain.value = _sfxVolume;
    }

    function toggleMute() {
        _isMuted = !_isMuted;
        if (_masterGain) _masterGain.gain.value = _isMuted ? 0 : 1;
        if (_isMuted) _stopBgm();
        return _isMuted;
    }

    function isMuted() { return _isMuted; }

    return {
        init: init,
        play: play,
        playBgm: playBgm,
        stopBgm: stopBgm,
        updateBgmByTime: updateBgmByTime,
        setMusicVolume: setMusicVolume,
        setSfxVolume: setSfxVolume,
        toggleMute: toggleMute,
        isMuted: isMuted,
        SFX: SFX,
        BGM: BGM
    };
})();

window.SoundSystem = SoundSystem;
