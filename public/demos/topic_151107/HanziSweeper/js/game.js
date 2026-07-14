import { HANZI_DB, WORD_DB, IDIOM_DB } from './data.js';
import { DIFFICULTY } from './config.js';
import { generateBoard, countAdjacentRadicals } from './board.js';
import { SoundSystem, StorageSystem, Collection } from './systems.js';
import { findByComponents } from './decomposition.js';

/** 从 radicalEntries 获取部首内容 */
function getRadicalComponent(board, radicalIndex) {
    if (radicalIndex < 0 || !board.radicalEntries) return '?';
    return board.radicalEntries[radicalIndex].component;
}

export class HanziSweeperGame {
    constructor() {
        this.difficulty = 'easy';
        this.pendingDifficulty = 'easy';
        this.gameMode = 'classic';
        this.board = null;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lives = 3;
        this.maxLives = 3;
        this.energy = 0;
        this.matchedPairs = [];
        this.selectedRadicals = [];
        this.phase = 'sweep';
        this.gameOver = false;
        this.timerInterval = null;
        this.elapsedTime = 0;
        this.timerStarted = false;
        this.sound = new SoundSystem();
        this.storage = new StorageSystem();
        this.collection = new Collection();
        this.settings = {
            sound: this.storage.getSetting('sound'),
            animation: this.storage.getSetting('animation'),
            knowledge: this.storage.getSetting('knowledge'),
        };
        this.sound.enabled = this.settings.sound;
        this.currentPage = 'menu';
        this.updateGradeDisplay();
    }

    showPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const el = document.getElementById(`page${page.charAt(0).toUpperCase() + page.slice(1)}`);
        if (el) {
            el.classList.add('active');
            el.style.animation = 'none';
            el.offsetHeight;
            el.style.animation = '';
        }
        this.currentPage = page;
        if (page === 'settings') this.updateSettingsPage();
    }

    backToMenu() {
        this.stopTimer();
        this.showPage('menu');
    }

    startMode(mode) {
        this.gameMode = mode;
        this.pendingDifficulty = 'easy';
        this.openDifficultyModal();
    }

    openDifficultyModal() {
        this.selectDifficulty('easy');
        document.getElementById('difficultyModal').classList.add('active');
    }

    closeDifficultyModal() {
        document.getElementById('difficultyModal').classList.remove('active');
    }

    selectDifficulty(diff) {
        this.pendingDifficulty = diff;
        document.querySelectorAll('.diff-option').forEach(o => o.classList.remove('selected'));
        document.getElementById(`diffOpt-${diff}`).classList.add('selected');
    }

    confirmStart() {
        this.difficulty = this.pendingDifficulty;
        this.closeDifficultyModal();
        this.newGame();
        this.showPage('game');
    }

    showHowToPlay() { document.getElementById('howToPlayModal').classList.add('active'); }
    closeHowToPlay() { document.getElementById('howToPlayModal').classList.remove('active'); }

    toggleSetting(key) {
        this.settings[key] = !this.settings[key];
        this.storage.setSetting(key, this.settings[key]);
        const el = document.getElementById(`toggle${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (el) el.classList.toggle('on', this.settings[key]);
        if (key === 'sound') this.sound.enabled = this.settings[key];
    }

    updateSettingsPage() {
        document.getElementById('toggleSound').classList.toggle('on', this.settings.sound);
        document.getElementById('toggleAnimation').classList.toggle('on', this.settings.animation);
        document.getElementById('toggleKnowledge').classList.toggle('on', this.settings.knowledge);
        document.getElementById('statTotalGames').textContent = this.storage.getTotalGames();
        document.getElementById('statTotalChars').textContent = this.storage.getTotalChars();
    }

    newGame() {
        const cfg = DIFFICULTY[this.difficulty];
        this.initBuffs();
        
        // 获取已解锁汉字集合，用于优先选择未解锁的汉字
        const unlockedChars = new Set(this.collection.getAll());

        if (this.gameMode === 'endless') {
            this.endlessWave = 1;
            this.endlessScore = 0;
            this.board = generateBoard(cfg.width, cfg.height, cfg.charCount, unlockedChars);
        } else {
            this.board = generateBoard(cfg.width, cfg.height, cfg.charCount, unlockedChars);
        }
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.maxLives = cfg.lives;
        this.lives = cfg.lives;
        this.energy = 0;
        this.matchedPairs = [];
        this.selectedRadicals = [];
        this.phase = 'sweep';
        this.gameOver = false;
        this.elapsedTime = 0;
        this.timerStarted = false;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.gridEl = null;
        this.cellElements = null;
        this.cellStates = null;

        this.storage.incrementTotalGames();
        this.render();
        this.updateInfo();
        this.updateTimer();
        this.updatePhaseUI();
        this.updateMatchPanel();
        this.updateRadicalProgress();
        this.updateSkillBar();
        this.updateBuffBar();
        
        const modeHints = {
            'classic': '左键翻开格子，找到部首组合汉字！',
            'endless': '无尽模式：第1波开始，完成所有汉字进入下一波'
        };
        this.setStatus(modeHints[this.gameMode], 'info');

        if (this.hasBuff('peek2')) { this.applyBuff('peek2'); }
        if (this.hasBuff('peek4')) { this.applyBuff('peek4'); }
    }

    startTimer() {
        if (this.timerStarted) return;
        this.timerStarted = true;
        this.timerInterval = setInterval(() => {
            this.elapsedTime++;
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        const m = Math.floor(this.elapsedTime / 60);
        const s = this.elapsedTime % 60;
        const display = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        document.getElementById('timer').textContent = display;
    }

    getComboMultiplier() {
        if (this.combo >= 5) return 3;
        if (this.combo >= 3) return 2;
        if (this.combo >= 2) return 1.5;
        return 1;
    }

    isRadicalFound(cell) { return cell.state === 'flagged' || cell.state === 'revealed'; }

    handleCellClick(x, y) {
        if (this.gameOver) return;
        const cell = this.board.grid[y][x];

        if ((cell.state === 'revealed' || cell.state === 'flagged') && cell.type === 'radical') {
            this.toggleRadicalSelection(x, y);
            return;
        }

        if (cell.state !== 'hidden') return;
        this.startTimer();

        if (cell.type === 'radical') {
            this.lives--;
            cell.state = 'revealed';
            this.sound.play('fail');
            this.render();
            this.updateInfo();
            this.updateRadicalProgress();
            if (this.lives <= 0) {
                this.gameOver = true;
                this.stopTimer();
                this.revealAll();
                this.showResult(false);
            } else {
                this.setStatus(`踩到部首格！扣1血，剩余生命：${'❤'.repeat(this.lives)}`, 'error');
            }
            return;
        }

        if (cell.number === 0) {
            cell.state = 'revealed';
            this.floodFill(x, y);
            this.sound.play('reveal');
        } else {
            cell.state = 'revealed';
            this.sound.play('click');
        }
        this.render();
    }

    handleCellRightClick(x, y, e) {
        e.preventDefault();
        if (this.gameOver) return;
        const cell = this.board.grid[y][x];
        
        if (cell.state === 'revealed' && cell.type === 'number' && cell.number > 0) {
            this.doChord(x, y);
            return;
        }
        
        if (this.phase !== 'sweep') return;
        
        if (cell.state === 'hidden') {
            const energyCost = 5;
            if (cell.type === 'radical') {
                cell.state = 'flagged';
                this.sound.play('flag');
                this.setStatus(`发现部首「${getRadicalComponent(this.board, cell.radicalIndex)}」！免费标记`, 'success');
            } else {
                if (this.energy < energyCost) {
                    this.setStatus(`能量不足（需要${energyCost}，当前${this.energy}），无法探测`, 'warning');
                    return;
                }
                this.energy -= energyCost;
                cell.state = 'flagged';
                this.sound.play('flag');
                this.setStatus(`不是部首，消耗${energyCost}能量`, 'warning');
            }
        } else if (cell.state === 'flagged') {
            cell.state = 'hidden';
            this.sound.play('click');
        }
        this.render();
        this.updateInfo();
        this.updateRadicalProgress();
        this.checkAllRadicalsFound();
    }

    doChord(x, y) {
        const cell = this.board.grid[y][x];
        let flagCount = 0;
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < this.board.width && ny >= 0 && ny < this.board.height) {
                    const n = this.board.grid[ny][nx];
                    if (n.state === 'flagged') flagCount++;
                    else if (n.state === 'hidden') neighbors.push({ x: nx, y: ny, cell: n });
                }
            }
        }
        
        if (flagCount !== cell.number) {
            this.setStatus(`Chord 需要 ${cell.number} 面旗帜，当前 ${flagCount} 面`, 'warning');
            return;
        }
        
        if (neighbors.length === 0) {
            this.setStatus('周围没有可翻开的格子', 'info');
            return;
        }
        
        let hitRadical = false;
        for (const { x: nx, y: ny, cell: nc } of neighbors) {
            if (nc.type === 'radical') {
                hitRadical = true;
                nc.state = 'revealed';
            } else {
                nc.state = 'revealed';
                if (nc.number === 0) this.floodFill(nx, ny);
            }
        }
        
        if (hitRadical) {
            this.lives--;
            this.sound.play('fail');
            if (this.lives <= 0) {
                this.gameOver = true;
                this.stopTimer();
                this.revealAll();
                this.showResult(false);
            } else {
                this.setStatus(`Chord 踩到部首！扣1血，剩余：${'❤'.repeat(this.lives)}`, 'error');
            }
        } else {
            this.sound.play('reveal');
            this.setStatus(`Chord 成功！翻开 ${neighbors.length} 个格子`, 'success');
        }
        this.render();
        this.updateInfo();
        this.updateRadicalProgress();
        this.checkAllRadicalsFound();
    }

    floodFill(x, y) {
        for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < this.board.width && ny >= 0 && ny < this.board.height) {
                    const n = this.board.grid[ny][nx];
                    if (n.state === 'hidden' && n.type !== 'radical') {
                        n.state = 'revealed';
                        if (n.number === 0) this.floodFill(nx, ny);
                    }
                }
            }
    }

    checkAllRadicalsFound() {
        for (let y = 0; y < this.board.height; y++)
            for (let x = 0; x < this.board.width; x++) {
                const c = this.board.grid[y][x];
                if (c.type === 'radical' && !this.isRadicalFound(c)) return;
            }
        this.phase = 'match';
        this.selectedRadicals = [];
        this.updatePhaseUI();
        this.updateMatchPanel();
        this.updateRadicalProgress();
        this.setStatus('所有部首已找到！点击棋盘上的部首选择组字', 'success');
        this.sound.play('match');
    }

    getResonanceTargets(component) {
        const targets = new Set();
        for (const e of HANZI_DB) {
            if (e.left === component) targets.add(e.right);
            if (e.right === component) targets.add(e.left);
        }
        return targets;
    }

    getResonanceCells() {
        if (this.selectedRadicals.length !== 1) return new Set();
        const targets = this.getResonanceTargets(this.selectedRadicals[0].component);
        const cells = new Set();
        for (let y = 0; y < this.board.height; y++) {
            for (let x = 0; x < this.board.width; x++) {
                const c = this.board.grid[y][x];
                if (c.state === 'revealed' && c.type === 'radical' && targets.has(getRadicalComponent(this.board, c.radicalIndex))) {
                    cells.add(`${x},${y}`);
                }
            }
        }
        return cells;
    }

    toggleRadicalSelection(x, y) {
        const idx = this.selectedRadicals.findIndex(r => r.x === x && r.y === y);
        if (idx >= 0) { this.selectedRadicals.splice(idx, 1); }
        else if (this.selectedRadicals.length < 2) {
            const cell = this.board.grid[y][x];
            const component = getRadicalComponent(this.board, cell.radicalIndex);
            const charIndex = this.board.radicalEntries[cell.radicalIndex].charIndex;
            this.selectedRadicals.push({ x, y, component, charIndex });
            this.sound.play('click');
        }
        this.render();
        this.updateMatchPanel();
    }

    clearSelection() {
        this.selectedRadicals = [];
        this.render();
        this.updateMatchPanel();
    }

    /** 
     * 匹配两个部首能否组成汉字
     * 优先匹配 HANZI_DB 中的汉字（有拼音释义），其次匹配拆字库中的任意汉字
     */
    matchTargetComponents(r1, r2) {
        // 支持两种调用方式：传入完整部首对象 {component, charIndex} 或纯字符串
        const a = typeof r1 === 'string' ? r1 : r1.component;
        const b = typeof r2 === 'string' ? r2 : r2.component;
        const ci1 = typeof r1 === 'string' ? null : r1.charIndex;
        const ci2 = typeof r2 === 'string' ? null : r2.charIndex;

        // 1. 优先匹配 HANZI_DB 中的汉字（有拼音、释义、难度等信息）
        // 不再限制必须是当前棋盘上的汉字，允许组合任何有效汉字
        for (const e of HANZI_DB) {
            if ((e.left === a && e.right === b) || (e.left === b && e.right === a)) {
                // 扫雷阶段：如果传入了 charIndex，必须属于同一个目标汉字
                // 组字阶段：允许自由组合，跳过 charIndex 检查
                if (this.phase === 'sweep' && ci1 !== null && ci2 !== null) {
                    const idx = this.board.characters.findIndex(c => c.char === e.char);
                    if (idx < 0 || ci1 !== idx || ci2 !== idx) continue;
                }
                return e.char;
            }
        }

        // 2. 匹配拆字库中的任意汉字（无拼音释义，但能组合成功）
        const candidates = findByComponents(a, b);
        if (candidates.length > 0) {
            // 返回第一个能组成的汉字
            return candidates[0];
        }

        return null;
    }

    confirmMatch() {
        if (this.selectedRadicals.length !== 2) return;
        const [r1, r2] = this.selectedRadicals;
        const result = this.matchTargetComponents(r1, r2);

        if (!result) {
            this.setStatus(`「${r1.component}+${r2.component}」无法组合`, 'error');
            this.clearSelection();
            return;
        }

        if (result) {
            // 解锁新汉字
            const isNew = this.collection.unlock(result);
            if (isNew) {
                this.updateGradeDisplay();
            }

            this.matchedPairs.push({ char: result, left: r1.component, right: r2.component });
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            const mult = this.getComboMultiplier();
            
            let scoreMult = 1;
            if (this.hasBuff('score2x')) {
                scoreMult = 2;
            }
            if (this.hasBuff('score3x') && this.buff_effects.score3x.remaining > 0) {
                scoreMult = 3;
                this.buff_effects.score3x.remaining--;
            }
            
            const points = Math.floor(50 * mult * scoreMult);
            this.score += points;
            
            const energyGain = this.hasBuff('energy50') ? 40 : 20;
            this.energy += energyGain;
            
            if (this.hasBuff('lifeRecover')) {
                if (this.lives < this.maxLives) this.lives += 1;
            } else {
                if (this.lives < this.maxLives) this.lives += 0.5;
            }
            
            this.board.grid[r1.y][r1.x].state = 'matched';
            this.board.grid[r2.y][r2.x].state = 'matched';
            
            const comboText = mult > 1 ? ` (${mult}x 连击!)` : '';
            const buffText = scoreMult > 1 ? ` 🔥${scoreMult}x分数!` : '';
            const newCharText = isNew ? ` 🎉 解锁新字！` : '';
            this.setStatus(`成功组成「${result}」！+${points}分${comboText}${buffText}${newCharText}`, 'success');
            if (mult > 1) this.sound.play('combo'); else this.sound.play('match');

            this.updateDynamicNumbers(r1.x, r1.y, r2.x, r2.y);

            this.showKnowledgeCard(result, points, this.combo);

            setTimeout(() => this.triggerChainReaction(r1.x, r1.y, r2.x, r2.y), 600);

            this.checkComboReward();
        } else {
            const noFail = this.hasBuff('nofail');
            const comboKeep = this.hasBuff('comboKeep');
            if (!noFail) {
                this.score = Math.max(0, this.score - 20);
                if (!comboKeep) this.combo = 0;
                this.setStatus(`「${r1.component}」+「${r2.component}」无法组成汉字，-20分${comboKeep ? '（连击保留）' : ''}`, 'error');
            } else {
                this.setStatus(`「${r1.component}」+「${r2.component}」无法组成汉字（幸运星保护）`, 'info');
            }
            this.sound.play('fail');
        }

        this.selectedRadicals = [];
        this.updateInfo();
        this.updateMatchPanel();
        this.updateSkillBar();
        this.render();

        this.checkWinCondition();
    }

    checkWinCondition() {
        if (this.gameOver) return;

        if (this.gameMode === 'endless') {
            if (this.matchedPairs.length === this.board.characters.length) {
                console.log('无尽模式完成一波！matchedPairs:', this.matchedPairs.length, 'characters:', this.board.characters.length);
                this.endlessScore += this.score;
                this.endlessWave++;
                this.setStatus(`第${this.endlessWave - 1}波完成！选择增益继续战斗`, 'success');
                this.sound.play('win');
                
                this.showWaveBanner(`第 ${this.endlessWave - 1} 波完成！`);
                
                setTimeout(() => {
                    console.log('准备显示 buff 选择...');
                    this.showBuffSelection();
                }, 2000);
                return;
            }
        }

        if (this.gameMode === 'classic') {
            if (this.matchedPairs.length === this.board.characters.length) {
                this.gameOver = true;
                this.stopTimer();
                this.phase = 'complete';
                this.sound.play('win');
                setTimeout(() => this.showResult(true), 800);
            }
        }
    }

    startEndlessWave() {
        const cfg = DIFFICULTY[this.difficulty];
        const charCount = Math.min(cfg.charCount + this.endlessWave - 1, 12);
        this.board = generateBoard(cfg.width, cfg.height, charCount, null);
        this.matchedPairs = [];
        this.selectedRadicals = [];
        this.phase = 'sweep';
        this.gridEl = null;
        this.cellElements = null;
        this.cellStates = null;
        
        this.score = 0;
        this.combo = 0;
        
        this.lives = Math.min(this.lives + 2, this.maxLives);
        
        this.render();
        this.updateInfo();
        this.updatePhaseUI();
        this.updateMatchPanel();
        this.updateRadicalProgress();
        this.updateSkillBar();
        
        if (this.hasBuff('peek2')) { this.applyFreePeek(2); }
        if (this.hasBuff('peek4')) { this.applyFreePeek(4); }
        
        this.setStatus(`第${this.endlessWave}波开始！`, 'info');
        
        this.showWaveBanner(`第 ${this.endlessWave} 波`);
    }

    showWaveBanner(text) {
        const banner = document.getElementById('waveBanner');
        if (!banner) return;
        banner.textContent = text;
        banner.classList.remove('show');
        void banner.offsetWidth;
        banner.classList.add('show');
        setTimeout(() => banner.classList.remove('show'), 1500);
    }

    triggerChainReaction(x1, y1, x2, y2) {
        if (this.gameOver) return;
        
        const matchedChar = this.matchedPairs[this.matchedPairs.length - 1];
        const charData = HANZI_DB.find(h => h.char === matchedChar.char);
        const strokes = charData ? charData.strokes : 8;
        
        let chainRange = 1 + Math.floor(strokes / 4);
        if (this.hasBuff('chainPlus')) chainRange += 2;
        
        const positions = [[x1, y1], [x2, y2]];
        const revealedCells = [];
        
        for (const [px, py] of positions) {
            for (let dy = -chainRange; dy <= chainRange; dy++) {
                for (let dx = -chainRange; dx <= chainRange; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = px + dx, ny = py + dy;
                    if (nx >= 0 && nx < this.board.width && ny >= 0 && ny < this.board.height) {
                        const cell = this.board.grid[ny][nx];
                        if (cell.state === 'hidden') {
                            cell.state = 'revealed';
                            revealedCells.push({ x: nx, y: ny, cell });
                            
                            if (cell.type === 'number' && cell.number === 0) {
                                this.floodFill(nx, ny);
                            }
                        }
                    }
                }
            }
        }
        
        if (revealedCells.length > 0) {
            this.sound.play('chain');
            if (revealedCells.length > 3) {
                this.showChainPopup(`连锁翻开 ${revealedCells.length} 格！`);
            }
            this.render();
            
            let allFound = true;
            for (let y = 0; y < this.board.height; y++) {
                for (let x = 0; x < this.board.width; x++) {
                    const c = this.board.grid[y][x];
                    if (c.type === 'radical' && !this.isRadicalFound(c)) {
                        allFound = false;
                        break;
                    }
                }
                if (!allFound) break;
            }
            
            if (allFound) {
                this.phase = 'match';
                this.selectedRadicals = [];
                this.updatePhaseUI();
                this.updateMatchPanel();
                this.setStatus('所有部首已找到！继续组字', 'success');
                this.sound.play('match');
            }
        }
    }

    checkComboReward() {
        const combo = this.combo;
        if (combo === 3) {
            this.score += 10;
            this.flashScreen('#ffffff', 0.3);
            this.setStatus(`🔥 3连击！额外+10分`, 'success');
        } else if (combo === 5) {
            this.score += 30;
            this.revealRandomCells(2);
            this.flashScreen('#fbbf24', 0.4);
            this.setStatus(`⚡ 5连击！额外+30分 + 翻开2格`, 'success');
        } else if (combo === 8) {
            this.score += 50;
            this.highlightAllRadicals(3000);
            this.flashScreen('#a855f7', 0.5);
            this.setStatus(`💎 8连击！额外+50分 + 部首高亮`, 'success');
        } else if (combo >= 10) {
            this.autoCompleteWave();
            this.flashScreen('#f59e0b', 0.6);
            this.setStatus(`👑 10连击！自动完成本波！`, 'success');
        }
    }

    flashScreen(color, duration) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:${color};opacity:0.3;z-index:9999;pointer-events:none;transition:opacity 0.3s;`;
        document.body.appendChild(overlay);
        setTimeout(() => { overlay.style.opacity = '0'; }, duration * 1000);
        setTimeout(() => { overlay.remove(); }, (duration + 0.3) * 1000);
    }

    revealRandomCells(count) {
        let revealed = 0;
        const candidates = [];
        for (let y = 0; y < this.board.height; y++)
            for (let x = 0; x < this.board.width; x++) {
                const c = this.board.grid[y][x];
                if (c.state === 'hidden' && c.type === 'number') candidates.push({ x, y });
            }
        candidates.sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(count, candidates.length); i++) {
            const { x, y } = candidates[i];
            this.board.grid[y][x].state = 'revealed';
            if (this.board.grid[y][x].number === 0) this.floodFill(x, y);
            revealed++;
        }
        if (revealed > 0) this.render();
    }

    highlightAllRadicals(duration) {
        for (let y = 0; y < this.board.height; y++)
            for (let x = 0; x < this.board.width; x++) {
                const c = this.board.grid[y][x];
                if (c.type === 'radical' && c.state === 'revealed') {
                    const el = this.cellElements[y][x];
                    if (el) { el.classList.add('resonance'); setTimeout(() => el.classList.remove('resonance'), duration); }
                }
            }
    }

    autoCompleteWave() {
        const unrevealedRadicals = [];
        for (let y = 0; y < this.board.height; y++)
            for (let x = 0; x < this.board.width; x++) {
                const c = this.board.grid[y][x];
                if (c.type === 'radical' && c.state === 'hidden') {
                    c.state = 'revealed';
                    unrevealedRadicals.push({ x, y, component: getRadicalComponent(this.board, c.radicalIndex) });
                }
            }
        this.render();
        const remaining = this.board.characters.filter(c => !this.matchedPairs.some(p => p.char === c.char));
        let delay = 0;
        for (const charEntry of remaining) {
            setTimeout(() => {
                const r1 = unrevealedRadicals.find(r => r.component === charEntry.left);
                const r2 = unrevealedRadicals.find(r => r.component === charEntry.right);
                if (r1 && r2) {
                    this.board.grid[r1.y][r1.x].state = 'matched';
                    this.board.grid[r2.y][r2.x].state = 'matched';
                    this.matchedPairs.push({ char: charEntry.char, left: charEntry.left, right: charEntry.right });
                    this.score += 50;
                    this.sound.play('match');
                    this.render();
                    this.updateInfo();
                }
            }, delay);
            delay += 400;
        }
        setTimeout(() => this.checkWinCondition(), delay + 200);
    }

    matchWord(char1, char2) {
        for (const word of WORD_DB) {
            if ((word.chars[0] === char1 && word.chars[1] === char2) ||
                (word.chars[0] === char2 && word.chars[1] === char1)) {
                return word;
            }
        }
        return null;
    }

    matchIdiom(char1, char2, char3, char4) {
        for (const idiom of IDIOM_DB) {
            const chars = idiom.chars;
            const input = [char1, char2, char3, char4].sort();
            const target = [...chars].sort();
            if (input.every((c, i) => c === target[i])) {
                return idiom;
            }
        }
        return null;
    }

    initBuffs() {
        this.activeBuffs = [];
        this.buff_effects = {
            peek2:    { name: '小天眼', desc: '开局翻开2格', icon: '👁', rarity: 'common' },
            score2x:  { name: '分数×2', desc: '本波组字分数×2', icon: '✨', rarity: 'common' },
            life1:    { name: '生命+1', desc: '最大生命+1', icon: '❤️', rarity: 'common' },
            energy50: { name: '能量+50', desc: '立即获得50能量', icon: '⚡', rarity: 'common' },
            peek4:    { name: '天眼通', desc: '开局翻开4格', icon: '🔭', rarity: 'rare' },
            score3x:  { name: '分数狂热', desc: '接下来3次组字×3分', icon: '🔥', rarity: 'rare', remaining: 0 },
            nofail:   { name: '幸运星', desc: '组字失败不扣分', icon: '🌟', rarity: 'rare' },
            lifeRecover: { name: '满血回复', desc: '回复所有生命', icon: '💊', rarity: 'rare' },
            comboKeep: { name: '连击永动', desc: '组错不中断连击', icon: '🔗', rarity: 'epic' },
            chainPlus: { name: '连锁大师', desc: '连锁范围+2', icon: '💥', rarity: 'epic' },
            autoWave: { name: '一键通关', desc: '直接完成本波+额外奖励波', icon: '👑', rarity: 'legendary' },
        };
    }

    getRandomBuffs(count) {
        const keys = Object.keys(this.buff_effects);
        const available = keys.filter(k => !this.activeBuffs.includes(k));
        if (available.length === 0) return [];
        
        const wave = this.endlessWave || 1;
        const selected = [];
        const pool = [...available];
        
        for (let i = 0; i < count && pool.length > 0; i++) {
            const forceRare = (wave % 3 === 0) && (i === 0);
            const item = this.weightedPick(pool, forceRare);
            selected.push(item);
            pool.splice(pool.indexOf(item), 1);
        }
        return selected;
    }

    weightedPick(pool, forceRare) {
        const rarityWeights = { common: 50, rare: 30, epic: 15, legendary: 5 };
        if (forceRare) {
            const rarePool = pool.filter(k => ['epic', 'legendary'].includes(this.buff_effects[k].rarity));
            if (rarePool.length > 0) pool = rarePool;
        }
        let totalWeight = 0;
        const weights = pool.map(k => {
            const w = rarityWeights[this.buff_effects[k].rarity] || 10;
            totalWeight += w;
            return w;
        });
        let roll = Math.random() * totalWeight;
        for (let i = 0; i < pool.length; i++) {
            roll -= weights[i];
            if (roll <= 0) return pool[i];
        }
        return pool[pool.length - 1];
    }

    applyBuff(buffKey) {
        this.activeBuffs.push(buffKey);
        const buff = this.buff_effects[buffKey];
        
        switch (buffKey) {
            case 'peek2': this.applyFreePeek(2); break;
            case 'peek4': this.applyFreePeek(4); break;
            case 'score2x': this.buff_effects.score2x.multiplier = 2; break;
            case 'score3x': this.buff_effects.score3x.remaining = 3; break;
            case 'life1': this.maxLives++; this.lives = Math.min(this.lives + 1, this.maxLives); break;
            case 'energy50': this.energy += 50; break;
            case 'lifeRecover': this.lives = this.maxLives; break;
            case 'autoWave': this.autoCompleteWave(); break;
        }
        
        const rarityLabel = { common: '', rare: '【稀有】', epic: '【史诗】', legendary: '【传说】' };
        this.setStatus(`获得 ${rarityLabel[buff.rarity] || ''}${buff.icon} ${buff.name}`, 'success');
    }

    applyFreePeek(count) {
        let peeked = 0;
        for (let y = 0; y < this.board.height && peeked < count; y++) {
            for (let x = 0; x < this.board.width && peeked < count; x++) {
                const cell = this.board.grid[y][x];
                if (cell.state === 'hidden' && cell.type === 'number') {
                    cell.state = 'revealed';
                    if (cell.number === 0) this.floodFill(x, y);
                    peeked++;
                }
            }
        }
        if (peeked > 0) { this.render(); this.setStatus(`天眼通生效！自动翻开 ${peeked} 个格子`, 'success'); }
    }

    hasBuff(key) {
        return this.activeBuffs.includes(key);
    }

    showBuffSelection() {
        console.log('showBuffSelection 被调用');
        const buffs = this.getRandomBuffs(3);
        console.log('获取到的 buffs:', buffs);
        if (buffs.length === 0) {
            console.log('没有可用的 buff，直接开始下一波');
            this.startEndlessWave();
            return;
        }
        
        const modal = document.getElementById('buffModal');
        const list = document.getElementById('buffList');
        
        list.innerHTML = buffs.map(key => {
            const buff = this.buff_effects[key];
            const rarityNames = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
            return `
                <div class="buff-option rarity-${buff.rarity}" onclick="game.selectBuff('${key}')">
                    <span class="buff-rarity-tag ${buff.rarity}">${rarityNames[buff.rarity] || ''}</span>
                    <div class="buff-icon">${buff.icon}</div>
                    <div class="buff-name">${buff.name}</div>
                    <div class="buff-desc">${buff.desc}</div>
                </div>
            `;
        }).join('');
        
        modal.classList.add('active');
        console.log('Buff 选择弹窗已显示');
    }

    selectBuff(buffKey) {
        console.log('选择了 buff:', buffKey);
        this.applyBuff(buffKey);
        document.getElementById('buffModal').classList.remove('active');
        this.updateBuffBar();
        this.startEndlessWave();
    }

    updateBuffBar() {
        const bar = document.getElementById('buffBar');
        if (!bar || !this.activeBuffs || this.activeBuffs.length === 0) {
            if (bar) bar.style.display = 'none';
            return;
        }
        
        bar.style.display = 'flex';
        bar.innerHTML = this.activeBuffs.map(key => {
            const buff = this.buff_effects[key];
            return `<div class="buff-badge">${buff.icon} ${buff.name}</div>`;
        }).join('');
    }

    updateDynamicNumbers(x1, y1, x2, y2) {
        const positions = [[x1, y1], [x2, y2]];
        for (const [px, py] of positions) {
            for (let dy = -1; dy <= 1; dy++)
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = px + dx, ny = py + dy;
                    if (nx >= 0 && nx < this.board.width && ny >= 0 && ny < this.board.height) {
                        const n = this.board.grid[ny][nx];
                        if (n.type === 'number' && n.state === 'revealed') {
                            n.number = countAdjacentRadicals(this.board.grid, nx, ny, this.board.width, this.board.height);
                            let matchedAdj = 0;
                            for (let ddy = -1; ddy <= 1; ddy++)
                                for (let ddx = -1; ddx <= 1; ddx++) {
                                    if (ddx === 0 && ddy === 0) continue;
                                    const nnx = nx + ddx, nny = ny + ddy;
                                    if (nnx >= 0 && nnx < this.board.width && nny >= 0 && nny < this.board.height) {
                                        const nc = this.board.grid[nny][nnx];
                                        if (nc.type === 'radical' && nc.state === 'matched') matchedAdj++;
                                    }
                                }
                            n.number = Math.max(0, n.number - matchedAdj);
                        }
                    }
                }
        }
    }

    checkChainElimination() {
        if (this.gameOver || this.phase !== 'match') return;
        const foundRadicals = [];
        for (let y = 0; y < this.board.height; y++)
            for (let x = 0; x < this.board.width; x++) {
                const c = this.board.grid[y][x];
                if (c.type === 'radical' && this.isRadicalFound(c) && c.state !== 'matched') {
                    foundRadicals.push({ x, y, index: c.radicalIndex });
                }
            }

        for (let i = 0; i < foundRadicals.length; i++) {
            for (let j = i + 1; j < foundRadicals.length; j++) {
                const a = foundRadicals[i], b = foundRadicals[j];
                const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
                if (dx <= 1 && dy <= 1) {
                    const ca = { component: getRadicalComponent(this.board, a.index), charIndex: this.board.radicalEntries[a.index].charIndex };
                    const cb = { component: getRadicalComponent(this.board, b.index), charIndex: this.board.radicalEntries[b.index].charIndex };
                    const result = this.matchTargetComponents(ca, cb);
                    if (result) {
                        this.matchedPairs.push({ char: result, left: ca.component, right: cb.component });
                        this.combo++;
                        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
                        const mult = this.getComboMultiplier();
                        const points = Math.floor(50 * mult * 1.5);
                        this.score += points;
                        this.energy += 10;
                        if (this.lives < this.maxLives) this.lives += 0.5;
                        this.board.grid[a.y][a.x].state = 'matched';
                        this.board.grid[b.y][b.x].state = 'matched';

                        this.showChainPopup(`${ca} + ${cb} = ${result} 连锁!`);
                        this.sound.play('chain');

                        this.updateDynamicNumbers(a.x, a.y, b.x, b.y);
                        this.updateInfo();
                        this.updateSkillBar();
                        this.render();

                        if (this.matchedPairs.length === this.board.characters.length) {
                            this.gameOver = true;
                            this.stopTimer();
                            this.phase = 'complete';
                            this.sound.play('win');
                            this.storage.addTotalChars(this.matchedPairs.length);
                            setTimeout(() => this.showResult(true), 800);
                            return;
                        }

                        setTimeout(() => this.checkChainElimination(), 800);
                        return;
                    }
                }
            }
        }
    }

    showChainPopup(text) {
        const popup = document.createElement('div');
        popup.className = 'chain-popup';
        popup.textContent = text;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1300);
    }

    useSkill(type) {
        if (this.gameOver) return;
        const costs = { peek: 20, hint: 15, heal: 30, chain: 25, clear: 15 };
        if (this.energy < costs[type]) return;

        if (type === 'peek') {
            const hidden = [];
            for (let y = 0; y < this.board.height; y++)
                for (let x = 0; x < this.board.width; x++) {
                    const c = this.board.grid[y][x];
                    if (c.state === 'hidden') hidden.push({ x, y, cell: c });
                }
            if (hidden.length === 0) return;
            const target = hidden[Math.floor(Math.random() * hidden.length)];
            const el = this.cellElements[target.y][target.x];
            if (target.cell.type === 'radical') {
                el.setAttribute('data-peek', getRadicalComponent(this.board, target.cell.radicalIndex));
            } else {
                el.setAttribute('data-peek', target.cell.number > 0 ? target.cell.number.toString() : '·');
            }
            el.classList.add('peeked');
            this.energy -= costs[type];
            this.sound.play('skill');
            this.setStatus('使用透视！一个格子被标记了内容', 'info');
            setTimeout(() => { el.removeAttribute('data-peek'); el.classList.remove('peeked'); }, 3000);
            this.updateSkillBar();
            this.updateInfo();
        }
        else if (type === 'hint') {
            const unfound = [];
            for (let y = 0; y < this.board.height; y++)
                for (let x = 0; x < this.board.width; x++) {
                    const c = this.board.grid[y][x];
                    if (c.type === 'radical' && !this.isRadicalFound(c)) unfound.push({ x, y });
                }
            if (unfound.length === 0) return;
            const target = unfound[Math.floor(Math.random() * unfound.length)];
            const el = this.cellElements[target.y][target.x];
            el.classList.add('hint-pulse');
            this.energy -= costs[type];
            this.sound.play('skill');
            this.setStatus('使用提示！一个部首格被高亮了', 'info');
            setTimeout(() => el.classList.remove('hint-pulse'), 2100);
            this.updateSkillBar();
            this.updateInfo();
        }
        else if (type === 'heal') {
            if (this.lives >= this.maxLives) { this.setStatus('生命值已满！', 'info'); return; }
            this.lives = Math.min(this.lives + 1, this.maxLives);
            this.energy -= costs[type];
            this.sound.play('skill');
            this.setStatus(`使用回血！当前生命：${'❤'.repeat(Math.floor(this.lives))}`, 'success');
            this.updateSkillBar();
            this.updateInfo();
        }
        else if (type === 'chain') {
            // 扫描所有已翻开且未匹配的部首，自动组合相邻可配对部首
            const foundRadicals = [];
            for (let y = 0; y < this.board.height; y++)
                for (let x = 0; x < this.board.width; x++) {
                    const c = this.board.grid[y][x];
                    if (c.type === 'radical' && this.isRadicalFound(c) && c.state !== 'matched') {
                        foundRadicals.push({ x, y, index: c.radicalIndex });
                    }
                }
            // 找第一对相邻可组合的部首
            let paired = false;
            for (let i = 0; i < foundRadicals.length && !paired; i++) {
                for (let j = i + 1; j < foundRadicals.length && !paired; j++) {
                    const a = foundRadicals[i], b = foundRadicals[j];
                    const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
                    if (dx <= 1 && dy <= 1) {
                        const ca = { component: getRadicalComponent(this.board, a.index), charIndex: this.board.radicalEntries[a.index].charIndex };
                        const cb = { component: getRadicalComponent(this.board, b.index), charIndex: this.board.radicalEntries[b.index].charIndex };
                        const result = this.matchTargetComponents(ca, cb);
                        if (result) {
                            this.matchedPairs.push({ char: result, left: ca.component, right: cb.component });
                            this.combo++;
                            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
                            const mult = this.getComboMultiplier();
                            const points = Math.floor(50 * mult * 1.5);
                            this.score += points;
                            this.energy += 10;
                            if (this.lives < this.maxLives) this.lives += 0.5;
                            this.board.grid[a.y][a.x].state = 'matched';
                            this.board.grid[b.y][b.x].state = 'matched';
                            this.showChainPopup(`${ca} + ${cb} = ${result} 连锁!`);
                            this.sound.play('chain');
                            this.updateDynamicNumbers(a.x, a.y, b.x, b.y);
                            this.updateInfo();
                            this.render();
                            paired = true;
                        }
                    }
                }
            }
            if (!paired) { this.setStatus('没有可连锁的组合', 'info'); return; }
            this.energy -= costs[type];
            this.sound.play('skill');
            this.setStatus('使用连锁！自动组合相邻部首', 'success');
            this.updateSkillBar();
            // 连锁后继续检查是否有新的可组合对
            setTimeout(() => this.checkChainElimination(), 800);
        }
        else if (type === 'clear') {
            // 消除技能：消耗能量将一个已翻开的部首格变为普通数字格（解决死局）
            const foundRadicals = [];
            for (let y = 0; y < this.board.height; y++)
                for (let x = 0; x < this.board.width; x++) {
                    const c = this.board.grid[y][x];
                    if (c.type === 'radical' && this.isRadicalFound(c) && c.state !== 'matched') {
                        foundRadicals.push({ x, y });
                    }
                }
            if (foundRadicals.length === 0) { this.setStatus('没有可消除的部首', 'info'); return; }
            const target = foundRadicals[Math.floor(Math.random() * foundRadicals.length)];
            const cell = this.board.grid[target.y][target.x];
            const component = getRadicalComponent(this.board, cell.radicalIndex);
            const charIndex = this.board.radicalEntries[cell.radicalIndex].charIndex;
            const charEntry = this.board.characters[charIndex];
            const charName = charEntry ? charEntry.char : '?';
            
            // 将自身和配对部首格都变为普通数字格
            const clearedPositions = [];
            for (let y = 0; y < this.board.height; y++) {
                for (let x = 0; x < this.board.width; x++) {
                    const c = this.board.grid[y][x];
                    if (c.type === 'radical' && c.radicalIndex >= 0) {
                        const entry = this.board.radicalEntries[c.radicalIndex];
                        if (entry.charIndex === charIndex && c.state !== 'matched') {
                            c.type = 'number';
                            c.state = 'revealed';
                            c.number = countAdjacentRadicals(this.board.grid, x, y, this.board.width, this.board.height);
                            c.radicalIndex = -1;
                            clearedPositions.push({ x, y });
                        }
                    }
                }
            }
            
            // 移除已匹配的该汉字配对（如果有的话）
            this.matchedPairs = this.matchedPairs.filter(p => p.char !== charName);
            
            // 从目标汉字列表中移除该汉字
            this.board.characters.splice(charIndex, 1);
            
            // 更新所有 radicalEntries 的 charIndex（移除的汉字之后的所有索引减1）
            for (const entry of this.board.radicalEntries) {
                if (entry.charIndex > charIndex) entry.charIndex--;
            }
            
            // 同步更新已选中部首的 charIndex，避免 matchTargetComponents 中索引错位导致组字失败
            for (const sel of this.selectedRadicals) {
                if (sel.charIndex > charIndex) sel.charIndex--;
            }
            
            this.energy -= costs[type];
            this.sound.play('skill');
            this.setStatus(`使用消除！「${charName}」(${component})已被清除`, 'success');
            this.updateDynamicNumbers(target.x, target.y, target.x, target.y);
            this.updateSkillBar();
            this.updateInfo();
            this.render();
            this.updateRadicalProgress();
            this.updateMatchPanel();
            this.checkWinCondition();
        }
    }

    updateSkillBar() {
        const costs = { peek: 20, hint: 15, heal: 30, chain: 25, clear: 15 };
        document.getElementById('skillPeek').classList.toggle('disabled', this.energy < costs.peek);
        document.getElementById('skillHint').classList.toggle('disabled', this.energy < costs.hint);
        document.getElementById('skillHeal').classList.toggle('disabled', this.energy < costs.heal || this.lives >= this.maxLives);
        document.getElementById('skillChain').classList.toggle('disabled', this.energy < costs.chain);
        document.getElementById('skillClear').classList.toggle('disabled', this.energy < costs.clear);
    }

    // 处理消除技能后的棋盘状态更新

    showResult(won) {
        this.storage.addTotalChars(this.matchedPairs.length);
        const isNew = won ? this.storage.setHighScore(this.difficulty, this.score) : false;
        const timeStr = document.getElementById('timer').textContent;

        document.getElementById('resultIcon').textContent = won ? '🎉' : '💔';
        
        if (this.gameMode === 'endless') {
            document.getElementById('resultTitle').textContent = won ? '恭喜通关！' : '游戏结束';
            document.getElementById('resultSubtitle').textContent = `你在第${this.endlessWave}波倒下，共完成${this.endlessWave - 1}波`;
            const totalScore = this.endlessScore + this.score;
            document.getElementById('resultScore').textContent = totalScore;
        } else {
            document.getElementById('resultTitle').textContent = won ? '恭喜通关！' : '游戏结束';
            document.getElementById('resultSubtitle').textContent = won ? '你成功组成了所有汉字' : '不要气馁，再来一局！';
            document.getElementById('resultScore').textContent = this.score;
        }
        
        document.getElementById('resultTime').textContent = timeStr;
        document.getElementById('resultChars').textContent = this.matchedPairs.length;
        document.getElementById('resultMaxCombo').textContent = this.maxCombo;

        const recordRow = document.getElementById('resultRecordRow');
        recordRow.style.display = isNew ? 'flex' : 'none';

        const charItems = document.getElementById('resultCharItems');
        if (this.matchedPairs.length > 0) {
            charItems.innerHTML = this.matchedPairs.map(p =>
                `<div class="result-char-item">${p.char}</div>`
            ).join('');
        } else {
            charItems.innerHTML = '<div class="empty-hint">没有组成汉字</div>';
        }

        this.showPage('result');
    }

    playAgain() {
        this.newGame();
        this.showPage('game');
    }

    showKnowledgeCard(char, points, combo) {
        const d = HANZI_DB.find(c => c.char === char);
        // 如果不是数据库中的汉字，使用简化显示
        if (!d) {
            this.showSimpleCelebration(char, points, combo);
            return;
        }

        const celebration = document.getElementById('matchCelebration');
        if (!celebration) return;

        celebration.innerHTML = '';
        celebration.classList.remove('fade-out');

        const bgGlow = document.createElement('div');
        bgGlow.className = 'bg-glow';
        celebration.appendChild(bgGlow);

        for (let i = 0; i < 8; i++) {
            const ray = document.createElement('div');
            ray.className = 'light-ray';
            ray.style.transform = `rotate(${i * 45}deg)`;
            ray.style.animationDelay = `${0.1 + i * 0.05}s`;
            celebration.appendChild(ray);
        }

        const centerRing = document.createElement('div');
        centerRing.className = 'center-ring';
        celebration.appendChild(centerRing);

        const pulseRing = document.createElement('div');
        pulseRing.className = 'pulse-ring';
        celebration.appendChild(pulseRing);

        const charContainer = document.createElement('div');
        charContainer.className = 'char-container';

        const charEl = document.createElement('div');
        charEl.className = 'celebration-char';
        charEl.textContent = d.char;
        charContainer.appendChild(charEl);

        const radicalCombo = document.createElement('div');
        radicalCombo.className = 'radical-combo';
        radicalCombo.innerHTML = `
            <span>${d.left}</span>
            <span class="plus-sign">+</span>
            <span>${d.right}</span>
            <span class="equals-sign">=</span>
            <span>${d.char}</span>
        `;
        charContainer.appendChild(radicalCombo);

        const charInfo = document.createElement('div');
        charInfo.className = 'char-info';
        charInfo.innerHTML = `
            <div class="char-pinyin-celebration">${d.pinyin}</div>
            <div class="char-meaning-celebration">${d.meaning}</div>
        `;
        charContainer.appendChild(charInfo);

        celebration.appendChild(charContainer);

        if (points > 0) {
            const scoreFly = document.createElement('div');
            scoreFly.className = 'score-fly';
            scoreFly.textContent = `+${points}`;
            scoreFly.style.top = '60%';
            scoreFly.style.left = '50%';
            scoreFly.style.transform = 'translateX(-50%)';
            celebration.appendChild(scoreFly);
        }

        if (combo > 1) {
            const comboText = document.createElement('div');
            comboText.className = 'combo-text';
            comboText.textContent = `${combo}x 连击！`;
            celebration.appendChild(comboText);
        }

        const particleColors = ['#6366f1', '#10b981', '#fbbf24', '#f59e0b', '#ef4444'];
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const angle = (Math.PI * 2 * i) / 20;
            const velocity = 150 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.background = particleColors[Math.floor(Math.random() * particleColors.length)];
            particle.style.animation = `particleBurst 1.2s ease-out forwards`;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1200,
                easing: 'ease-out',
                fill: 'forwards'
            });
            celebration.appendChild(particle);
        }

        celebration.classList.add('active');

        setTimeout(() => {
            celebration.classList.add('fade-out');
        }, 600);

        setTimeout(() => {
            celebration.classList.remove('active', 'fade-out');
            celebration.innerHTML = '';
        }, 1000);
    }

    // 简化版庆祝动画（用于拆字库中的汉字）
    showSimpleCelebration(char, points, combo) {
        const celebration = document.getElementById('matchCelebration');
        if (!celebration) return;

        celebration.innerHTML = '';
        celebration.classList.remove('fade-out');

        const bgGlow = document.createElement('div');
        bgGlow.className = 'bg-glow';
        celebration.appendChild(bgGlow);

        const charContainer = document.createElement('div');
        charContainer.className = 'char-container';

        const charEl = document.createElement('div');
        charEl.className = 'celebration-char';
        charEl.textContent = char;
        charContainer.appendChild(charEl);

        celebration.appendChild(charContainer);

        if (points > 0) {
            const scoreFly = document.createElement('div');
            scoreFly.className = 'score-fly';
            scoreFly.textContent = `+${points}`;
            scoreFly.style.top = '60%';
            scoreFly.style.left = '50%';
            scoreFly.style.transform = 'translateX(-50%)';
            celebration.appendChild(scoreFly);
        }

        if (combo > 1) {
            const comboText = document.createElement('div');
            comboText.className = 'combo-text';
            comboText.textContent = `${combo}x 连击！`;
            celebration.appendChild(comboText);
        }

        celebration.classList.add('active');

        setTimeout(() => {
            celebration.classList.add('fade-out');
        }, 600);

        setTimeout(() => {
            celebration.classList.remove('active', 'fade-out');
            celebration.innerHTML = '';
        }, 1000);
    }

    closeKnowledgeCard() {
        document.getElementById('knowledgeModal').classList.remove('active');
    }

    updateGradeDisplay() {
        const grade = this.collection.getGrade(HANZI_DB);
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
        const gradeText = gradeNames[grade] || '学前班';
        
        const unlockedCount = this.collection.getCount();
        const totalChars = HANZI_DB.length;
        const progress = Math.round((unlockedCount / totalChars) * 100);
        
        const gradeLevelEl = document.getElementById('gradeLevel');
        const unlockedCountEl = document.getElementById('unlockedCount');
        const totalProgressEl = document.getElementById('totalProgress');
        
        if (gradeLevelEl) gradeLevelEl.textContent = gradeText;
        if (unlockedCountEl) unlockedCountEl.textContent = unlockedCount;
        if (totalProgressEl) totalProgressEl.textContent = `${progress}%`;
    }

    updateInfo() {
        document.getElementById('score').textContent = this.score;
        
        const waveItem = document.getElementById('waveInfoItem');
        if (this.gameMode === 'endless') {
            waveItem.style.display = '';
            document.getElementById('waveCounter').textContent = `第${this.endlessWave}波`;
            document.getElementById('matchedCountLabel').textContent = '本波进度';
            document.getElementById('matchedCount').textContent = `${this.matchedPairs.length}/${this.board.characters.length}`;
        } else {
            waveItem.style.display = 'none';
            document.getElementById('matchedCountLabel').textContent = '已组字';
            document.getElementById('matchedCount').textContent = `${this.matchedPairs.length}/${this.board.characters.length}`;
        }
        
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('lives').textContent = '❤'.repeat(Math.floor(this.lives)) + '♡'.repeat(this.maxLives - Math.floor(this.lives));
        document.getElementById('energy').textContent = this.energy;

        // 已移除目标汉字显示，玩家自由组字

        const pl = document.getElementById('pairList');
        if (this.matchedPairs.length === 0) {
            pl.innerHTML = '<div class="empty-hint">还没有组成汉字</div>';
        } else {
            pl.innerHTML = this.matchedPairs.map(p =>
                `<div class="pair-item"><span class="pair-char">${p.char}</span>${p.left} + ${p.right}</div>`
            ).join('');
        }
    }

    updatePhaseUI() {
        const el = document.getElementById('phaseIndicator');
        const matchPanel = document.getElementById('matchPanel');

        const modeLabels = {
            'classic': '🔍 扫雷中 — 点击已翻出的部首组字',
            'endless': `∞ 无尽模式 — 第${this.endlessWave || 1}波`
        };
        el.textContent = modeLabels[this.gameMode] || '🔍 扫雷中';

        matchPanel.style.display = '';
        
        if (this.phase === 'sweep') {
            el.className = 'phase-indicator sweep';
            el.textContent = modeLabels[this.gameMode] || '🔍 扫雷中 — 点击已翻出的部首组字';
        } else if (this.phase === 'match') {
            el.className = 'phase-indicator match';
            el.textContent = '📝 所有部首已找到！继续组字';
        } else {
            el.className = 'phase-indicator complete';
            el.textContent = '🎉 恭喜通关！';
            matchPanel.style.display = 'none';
        }
    }

    updateMatchPanel() {
        const slot1 = document.getElementById('slot1');
        const slot2 = document.getElementById('slot2');
        const slotResult = document.getElementById('slotResult');
        const btnMatch = document.getElementById('btnMatch');
        const matchResult = document.getElementById('matchResult');

        if (this.selectedRadicals.length >= 1) {
            slot1.textContent = this.selectedRadicals[0].component;
            slot1.className = 'match-slot filled';
        } else {
            slot1.textContent = '?';
            slot1.className = 'match-slot';
        }
        if (this.selectedRadicals.length >= 2) {
            slot2.textContent = this.selectedRadicals[1].component;
            slot2.className = 'match-slot filled';
        } else {
            slot2.textContent = '?';
            slot2.className = 'match-slot';
        }

        if (this.selectedRadicals.length === 2) {
            const result = this.matchTargetComponents(this.selectedRadicals[0], this.selectedRadicals[1]);
            if (result) {
                slotResult.textContent = result;
                slotResult.style.borderColor = '#48bb78';
                slotResult.style.background = 'linear-gradient(135deg, #c6f6d5, #9ae6b4)';
                slotResult.style.color = '#22543d';
                matchResult.textContent = '可以组成汉字！自动组合中...';
                matchResult.style.color = '#10b981';
                btnMatch.classList.add('ready');

                if (this._autoMatchTimer) clearTimeout(this._autoMatchTimer);
                this._autoMatchTimer = setTimeout(() => {
                    this._autoMatchTimer = null;
                    if (this.selectedRadicals.length === 2 && !this.gameOver) {
                        this.confirmMatch();
                    }
                }, 400);
            } else {
                slotResult.textContent = '?';
                slotResult.style.borderColor = '#fca5a5';
                slotResult.style.background = '#fef2f2';
                slotResult.style.color = '#ef4444';
                matchResult.textContent = '无法组成汉字，自动清除选择...';
                matchResult.style.color = '#ef4444';
                btnMatch.classList.remove('ready');

                if (this._autoMatchTimer) clearTimeout(this._autoMatchTimer);
                this._autoMatchTimer = setTimeout(() => {
                    this._autoMatchTimer = null;
                    this.clearSelection();
                }, 600);
            }
        } else {
            if (this._autoMatchTimer) {
                clearTimeout(this._autoMatchTimer);
                this._autoMatchTimer = null;
            }
            slotResult.textContent = '?';
            slotResult.style.borderColor = '#d1d5db';
            slotResult.style.background = '';
            slotResult.style.color = '#d1d5db';
            matchResult.textContent = this.selectedRadicals.length === 1 ? '再选一个部首' : '点击棋盘上的部首进行选择';
            matchResult.style.color = 'var(--text-secondary)';
            btnMatch.classList.remove('ready');
        }
    }

    updateRadicalProgress() {
        const foundEl = document.getElementById('radicalFoundCount');
        const totalEl = document.getElementById('radicalTotalCount');
        const progressCard = document.getElementById('radicalProgressCard');
        if (this.phase === 'sweep') {
            progressCard.style.display = '';
            let found = 0;
            for (let y = 0; y < this.board.height; y++)
                for (let x = 0; x < this.board.width; x++) {
                    const c = this.board.grid[y][x];
                    if (c.type === 'radical' && this.isRadicalFound(c)) found++;
                }
            foundEl.textContent = found;
            totalEl.textContent = this.board.totalRadicals;
        } else {
            progressCard.style.display = 'none';
        }
    }

    toggleSound() {
        this.settings.sound = !this.settings.sound;
        this.sound.enabled = this.settings.sound;
        this.storage.setSetting('sound', this.settings.sound);
        document.getElementById('soundIcon').textContent = this.settings.sound ? '🔊' : '🔇';
    }

    revealAll() {
        for (let y = 0; y < this.board.height; y++)
            for (let x = 0; x < this.board.width; x++)
                if (this.board.grid[y][x].state === 'hidden') this.board.grid[y][x].state = 'revealed';
        this.render();
    }

    setStatus(msg, type) {
        const el = document.getElementById('statusMessage');
        el.textContent = msg;
        el.className = `status-message ${type}`;
    }

    render() {
        const boardEl = document.getElementById('board');

        if (!this.gridEl) {
            this.gridEl = document.createElement('div');
            this.gridEl.className = 'board-grid';
            this.gridEl.style.gridTemplateColumns = `repeat(${this.board.width}, 50px)`;
            boardEl.innerHTML = '';
            boardEl.appendChild(this.gridEl);

            this.cellElements = [];
            this.cellStates = [];
            for (let y = 0; y < this.board.height; y++) {
                this.cellElements[y] = [];
                this.cellStates[y] = [];
                for (let x = 0; x < this.board.width; x++) {
                    const cellEl = document.createElement('div');
                    cellEl.className = 'cell hidden';
                    cellEl.textContent = '';
                    cellEl.dataset.x = x;
                    cellEl.dataset.y = y;
                    cellEl.addEventListener('click', () => this.handleCellClick(x, y));
                    cellEl.addEventListener('contextmenu', (e) => this.handleCellRightClick(x, y, e));
                    this.gridEl.appendChild(cellEl);
                    this.cellElements[y][x] = cellEl;
                    this.cellStates[y][x] = { key: '' };
                }
            }
        }

        for (let y = 0; y < this.board.height; y++) {
            for (let x = 0; x < this.board.width; x++) {
                const cell = this.board.grid[y][x];
                const cellEl = this.cellElements[y][x];
                const lastKey = this.cellStates[y][x].key;
                const isSelected = this.selectedRadicals.some(r => r.x === x && r.y === y);
                const resonanceCells = this.getResonanceCells();
                const isResonance = resonanceCells.has(`${x},${y}`);

                let curKey = `${cell.state}|${cell.type}|${cell.radicalIndex}|${isSelected}|${isResonance}`;
                if (cell.state === 'revealed' && cell.type === 'number') curKey += `|${cell.number}`;
                if (curKey === lastKey) continue;

                cellEl.className = 'cell';
                cellEl.textContent = '';
                cellEl.removeAttribute('data-peek');
                cellEl.classList.remove('peeked', 'hint-pulse', 'resonance');

                if (cell.state === 'hidden') {
                    cellEl.classList.add('hidden');
                } else if (cell.state === 'flagged') {
                    cellEl.classList.add('flagged');
                    if (cell.type === 'radical') {
                        cellEl.classList.add('radical');
                        cellEl.textContent = getRadicalComponent(this.board, cell.radicalIndex);
                        cellEl.setAttribute('data-flag', '🚩');
                    } else {
                        cellEl.textContent = '';
                    }
                } else if (cell.state === 'revealed') {
                    cellEl.classList.add('revealed');
                    if (cell.type === 'radical') {
                        cellEl.classList.add('radical');
                        cellEl.textContent = getRadicalComponent(this.board, cell.radicalIndex);
                        if (isSelected) cellEl.classList.add('selected');
                        if (isResonance) cellEl.classList.add('resonance');
                    } else {
                        cellEl.classList.add('number');
                        if (cell.number > 0) {
                            cellEl.classList.add(`number-${Math.min(cell.number, 8)}`);
                            cellEl.textContent = cell.number;
                        } else {
                            cellEl.classList.add('zero');
                        }
                    }
                } else if (cell.state === 'matched') {
                    cellEl.classList.add('matched');
                }

                this.cellStates[y][x].key = curKey;
            }
        }
    }
}
