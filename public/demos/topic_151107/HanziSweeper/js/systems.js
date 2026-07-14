export class SoundSystem {
    constructor() {
        this.enabled = true;
        this.sounds = {
            click: this.createTone(800, 0.05),
            flag: this.createTone(600, 0.08),
            reveal: this.createTone(1000, 0.03),
            match: this.createChord([523, 659, 784], 0.3),
            fail: this.createTone(200, 0.2),
            combo: this.createChord([784, 988, 1175], 0.2),
            win: this.createChord([523, 659, 784, 1047], 0.5),
            skill: this.createChord([659, 880], 0.15),
            chain: this.createChord([523, 659, 784, 1047, 1319], 0.4),
        };
    }
    createTone(frequency, duration) {
        return () => {
            if (!this.enabled) return;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.frequency.value = frequency; osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
            } catch(e) {}
        };
    }
    createChord(frequencies, duration) {
        return () => {
            if (!this.enabled) return;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                frequencies.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.frequency.value = freq; osc.type = 'sine';
                    gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
                    osc.start(ctx.currentTime + i * 0.05); osc.stop(ctx.currentTime + duration);
                });
            } catch(e) {}
        };
    }
    play(name) { if (this.sounds[name]) this.sounds[name](); }
    toggle() { this.enabled = !this.enabled; return this.enabled; }
}

export class StorageSystem {
    constructor() { this.prefix = 'hanzi_sweeper_'; }
    getHighScore(diff) { return parseInt(localStorage.getItem(`${this.prefix}high_score_${diff}`) || '0'); }
    setHighScore(diff, score) {
        const key = `${this.prefix}high_score_${diff}`;
        const cur = this.getHighScore(diff);
        if (score > cur) { localStorage.setItem(key, score.toString()); return true; }
        return false;
    }
    incrementTotalGames() { localStorage.setItem(`${this.prefix}total_games`, (this.getTotalGames() + 1).toString()); }
    getTotalGames() { return parseInt(localStorage.getItem(`${this.prefix}total_games`) || '0'); }
    addTotalChars(n) { localStorage.setItem(`${this.prefix}total_chars`, (this.getTotalChars() + n).toString()); }
    getTotalChars() { return parseInt(localStorage.getItem(`${this.prefix}total_chars`) || '0'); }
    getSetting(key) { const v = localStorage.getItem(`${this.prefix}setting_${key}`); return v === null ? true : v === 'true'; }
    setSetting(key, val) { localStorage.setItem(`${this.prefix}setting_${key}`, val.toString()); }
}

// 汉字收集系统：管理已解锁汉字和玩家等级
export class Collection {
    constructor() {
        this.storageKey = 'hanzi_sweeper_collection';
        this.unlocked = this.load();
    }
    
    // 从 localStorage 加载已解锁汉字
    load() {
        const data = localStorage.getItem(this.storageKey);
        return data ? new Set(JSON.parse(data)) : new Set();
    }
    
    // 保存已解锁汉字到 localStorage
    save() {
        localStorage.setItem(this.storageKey, JSON.stringify([...this.unlocked]));
    }
    
    // 解锁新汉字
    unlock(char) {
        if (!this.unlocked.has(char)) {
            this.unlocked.add(char);
            this.save();
            return true;
        }
        return false;
    }
    
    // 检查汉字是否已解锁
    isUnlocked(char) {
        return this.unlocked.has(char);
    }
    
    // 获取已解锁汉字数量
    getCount() {
        return this.unlocked.size;
    }
    
    // 获取所有已解锁汉字
    getAll() {
        return [...this.unlocked];
    }
    
    // 根据已解锁汉字计算玩家等级（1-9年级）
    // 等级 = 已解锁汉字中的最高难度
    getGrade(hanziDB) {
        if (this.unlocked.size === 0 || !hanziDB) return 0;
        
        let maxDifficulty = 0;
        for (const char of this.unlocked) {
            const entry = hanziDB.find(h => h.char === char);
            if (entry && entry.difficulty > maxDifficulty) {
                maxDifficulty = entry.difficulty;
            }
        }
        return maxDifficulty;
    }
    
    // 获取等级描述文本
    getGradeText(grade) {
        const gradeNames = {
            0: '学前班',
            1: '一年级',
            2: '二年级',
            3: '三年级',
            4: '四年级',
            5: '五年级',
            6: '六年级',
            7: '初中生',
            8: '高中生',
            9: '大学生'
        };
        return gradeNames[grade] || '学前班';
    }
    
    // 重置收集（用于测试）
    reset() {
        this.unlocked.clear();
        this.save();
    }
}
