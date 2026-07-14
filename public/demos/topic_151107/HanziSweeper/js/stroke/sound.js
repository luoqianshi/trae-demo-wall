// ====== 音效系统 - Web Audio API ======
// 参考经典模式实现，使用 Web Audio API 生成音效

class StrokeSoundSystem {
    constructor() {
        this.enabled = true;
        this.volume = 0.3;
    }

    /** 创建单音调 */
    createTone(frequency, duration, type = 'sine', volume = this.volume) {
        return () => {
            if (!this.enabled) return;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = frequency;
                osc.type = type;
                gain.gain.setValueAtTime(volume, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration);
            } catch (e) {}
        };
    }

    /** 创建和弦音效 */
    createChord(frequencies, duration, type = 'sine', volume = this.volume / frequencies.length) {
        return () => {
            if (!this.enabled) return;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                frequencies.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = freq;
                    osc.type = type;
                    gain.gain.setValueAtTime(volume, ctx.currentTime + i * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
                    osc.start(ctx.currentTime + i * 0.05);
                    osc.stop(ctx.currentTime + duration);
                });
            } catch (e) {}
        };
    }

    /** 创建滑动音调 */
    createSlide(freqStart, freqEnd, duration, volume = this.volume) {
        return () => {
            if (!this.enabled) return;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
                osc.type = 'sine';
                gain.gain.setValueAtTime(volume, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration);
            } catch (e) {}
        };
    }

    /** 初始化音效系统 */
    init() {
        // 预创建所有音效函数
        this.sounds = {
            // 基础点击音效（参考经典模式）
            click: this.createTone(800, 0.05, 'sine', 0.2),
            reveal: this.createTone(400, 0.1, 'sine', 0.2),
            flag: this.createTone(600, 0.08, 'sine', 0.2),
            
            // 部首/数字翻开
            revealRadical: this.createTone(500, 0.12, 'sine', 0.25),
            revealNumber: this.createTone(400, 0.1, 'sine', 0.2),
            
            // 探测成功/失败
            probeSuccess: this.createChord([600, 800], 0.15, 'sine', 0.2),
            probeFail: this.createTone(200, 0.15, 'sawtooth', 0.15),
            
            // 合成成功/失败
            synthesize: this.createChord([523, 659, 784, 1047], 0.4, 'sine', 0.2),
            synthesizeFail: this.createTone(200, 0.2, 'sawtooth', 0.15),
            
            // 消除部首格
            eliminate: this.createSlide(800, 200, 0.2, 0.2),
            
            // 技能相关 - 选择音效（清脆的短促选择音）
            skillActivate: this.createChord([660, 880, 1100], 0.12, 'sine', 0.3),
            skillUse: this.createChord([660, 880, 1100], 0.12, 'sine', 0.3),
            
            // 受伤/治疗
            takeDamage: this.createTone(200, 0.15, 'sawtooth', 0.2),
            heal: this.createChord([523, 659, 784], 0.3, 'sine', 0.2),
            
            // 解锁房间
            unlockRoom: this.createChord([523, 659, 784, 1047], 0.5, 'sine', 0.2),
            
            // 收集碎片
            collectFragment: this.createChord([784, 988, 1175], 0.4, 'sine', 0.25),
            
            // 锻造神器/胜利
            forgeArtifact: this.createChord([523, 659, 784, 1047, 1319], 0.6, 'sine', 0.25),
            victory: this.createChord([523, 659, 784, 1047, 1319], 0.6, 'sine', 0.25),
            
            // 游戏结束
            gameOver: this.createSlide(440, 110, 0.5, 0.2),
            
            // 按钮点击
            buttonClick: this.createTone(800, 0.05, 'sine', 0.2),
            
            // 切换房间
            roomTransition: this.createSlide(400, 600, 0.15, 0.15),
            
            // 护盾激活
            shieldActivate: this.createChord([880, 1100], 0.2, 'sine', 0.2),
            
            // 五行触发
            wuxingTrigger: this.createChord([700, 900], 0.15, 'sine', 0.2),
            
            // 连击
            combo: this.createChord([800, 1200], 0.15, 'sine', 0.25),
        };
    }

    /** 播放音效 */
    play(name) {
        if (!this.enabled) return;
        if (!this.sounds) this.init();
        if (this.sounds[name]) this.sounds[name]();
    }

    /** 点击格子音效 */
    click() {
        this.play('click');
    }

    /** 翻开部首格 */
    revealRadical() {
        this.play('revealRadical');
    }

    /** 翻开数字格 */
    revealNumber() {
        this.play('revealNumber');
    }

    /** 右键探测成功 */
    probeSuccess() {
        this.play('probeSuccess');
    }

    /** 右键探测失败 */
    probeFail() {
        this.play('probeFail');
    }

    /** 合成成功 */
    synthesize() {
        this.play('synthesize');
    }

    /** 合成失败 */
    synthesizeFail() {
        this.play('synthesizeFail');
    }

    /** 消除部首格 */
    eliminate() {
        this.play('eliminate');
    }

    /** 技能激活 */
    skillActivate() {
        this.play('skillActivate');
    }

    /** 技能使用 */
    skillUse() {
        this.play('skillUse');
    }

    /** 受到伤害 */
    takeDamage() {
        this.play('takeDamage');
    }

    /** 治疗/回血 */
    heal() {
        this.play('heal');
    }

    /** 解锁房间 */
    unlockRoom() {
        this.play('unlockRoom');
    }

    /** 收集碎片 */
    collectFragment() {
        this.play('collectFragment');
    }

    /** 锻造神器 */
    forgeArtifact() {
        this.play('forgeArtifact');
    }

    /** 游戏结束 */
    gameOver() {
        this.play('gameOver');
    }

    /** 游戏胜利 */
    victory() {
        this.play('victory');
    }

    /** 按钮点击 */
    buttonClick() {
        this.play('buttonClick');
    }

    /** 切换房间 */
    roomTransition() {
        this.play('roomTransition');
    }

    /** 护盾激活 */
    shieldActivate() {
        this.play('shieldActivate');
    }

    /** 五行触发 */
    wuxingTrigger() {
        this.play('wuxingTrigger');
    }

    /** 连击音效 */
    combo(level) {
        this.play('combo');
    }

    /** 切换音效开关 */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// 导出单例
export const soundSystem = new StrokeSoundSystem();
