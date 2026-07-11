/* ==================== 应用设置模块 ==================== */
const Settings = {
    STORAGE_KEY: 'mingchen_settings',

    // 默认设置
    defaults: {
        soundShot: true,      // 击发音效开关
        soundUI: true,        // 界面音效开关
        vibrate: true,        // 震动反馈开关
        cardTheme: 'cyan'     // 战绩卡主题
    },

    // 战绩卡主题配置
    cardThemes: {
        cyan: {
            name: '赛博青',
            primary: '#00f0ff',
            borderColors: ['#00f0ff', '#bc13fe', '#ff2a6d'],
            scanline: '#00f0ff',
            brandShadow: '#00f0ff',
            valueColor: '#00f0ff',
            labelColor: '#555566',
            subTitleColor: '#888899'
        },
        pink: {
            name: '霓虹粉',
            primary: '#ff6b9d',
            borderColors: ['#ff6b9d', '#ff2a6d', '#bc13fe'],
            scanline: '#ff6b9d',
            brandShadow: '#ff6b9d',
            valueColor: '#ff6b9d',
            labelColor: '#665555',
            subTitleColor: '#998888'
        },
        green: {
            name: '激光绿',
            primary: '#39ff14',
            borderColors: ['#39ff14', '#00f0ff', '#00ff9d'],
            scanline: '#39ff14',
            brandShadow: '#39ff14',
            valueColor: '#39ff14',
            labelColor: '#556655',
            subTitleColor: '#889988'
        },
        purple: {
            name: '暗影紫',
            primary: '#bc13fe',
            borderColors: ['#bc13fe', '#ff2a6d', '#00f0ff'],
            scanline: '#bc13fe',
            brandShadow: '#bc13fe',
            valueColor: '#bc13fe',
            labelColor: '#665566',
            subTitleColor: '#998899'
        }
    },

    // 当前设置
    data: {},

    // 初始化
    init() {
        this.load();
    },

    // 从 localStorage 加载
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            this.data = saved ? { ...this.defaults, ...JSON.parse(saved) } : { ...this.defaults };
        } catch (e) {
            this.data = { ...this.defaults };
        }
    },

    // 保存到 localStorage
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('保存设置失败:', e);
        }
    },

    // 获取设置项
    get(key) {
        return this.data[key] !== undefined ? this.data[key] : this.defaults[key];
    },

    // 设置项
    set(key, value) {
        this.data[key] = value;
        this.save();
    },

    // 切换布尔值
    toggle(key) {
        this.set(key, !this.get(key));
        return this.get(key);
    },

    // ========== 音效 ==========
    playShotSound() {
        if (!this.get('soundShot')) return;
        // 使用 Web Audio API 生成简单的击发声效
        this._playTone(800, 0.1, 'square', 0.15);
    },

    playUISound() {
        if (!this.get('soundUI')) return;
        this._playTone(1200, 0.05, 'sine', 0.08);
    },

    _audioCtx: null,
    _audioResumed: false,

    _getAudioCtx() {
        if (!this._audioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            this._audioCtx = new AudioCtx();
        }
        // 只在首次恢复一次
        if (!this._audioResumed && this._audioCtx.state === 'suspended') {
            this._audioCtx.resume();
            this._audioResumed = true;
        }
        return this._audioCtx;
    },

    _playTone(freq, duration, type, volume) {
        try {
            const ctx = this._getAudioCtx();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume || 0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            // 忽略音频播放错误
        }
    },

    // ========== 震动 ==========
    vibrate(pattern) {
        if (!this.get('vibrate')) return;
        if (navigator.vibrate) {
            navigator.vibrate(pattern || 30);
        }
    }
};
