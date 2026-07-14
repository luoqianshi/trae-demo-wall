// ====== 笔划扫雷 v2 游戏逻辑 ======
import { DungeonManager, DUNGEON_MAP } from './dungeon.js';
import { generateStrokeBoard, matchComponents, getStrokeCount } from './board.js';
import { HANZI_DB, getWuxing } from '../data.js';
import { soundSystem } from './sound.js';
import { effectSystem } from './effects.js';

export class StrokeGame {
    constructor() {
        this.dungeon = new DungeonManager();
        this.gameOver = false;
        this.phase = 'sweep'; // sweep | synthesis
        this.gridEl = null;
        this.cellElements = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.timerStarted = false;
        this.targetingMode = null; // 瞄准模式：{effect, traitName, slotIndex}
        this.pendingTrait = null; // 待存入技能（栏满时等待用户选择替换槽位）
        this.soundInitialized = false;
    }

    /** 初始化音效系统（需要用户交互后调用） */
    initSound() {
        if (!this.soundInitialized) {
            soundSystem.init();
            this.soundInitialized = true;
        }
    }

    /** 播放格子翻开动画 */
    playCellRevealAnim(x, y, type = 'normal') {
        if (!this.cellElements || !this.cellElements[y] || !this.cellElements[y][x]) return;
        const cellEl = this.cellElements[y][x];
        cellEl.classList.remove('reveal-anim', 'radical-discover', 'damage-anim');
        void cellEl.offsetWidth; // 强制重排以重新触发动画
        
        if (type === 'radical') {
            cellEl.classList.add('radical-discover');
            setTimeout(() => cellEl.classList.remove('radical-discover'), 600);
        } else {
            cellEl.classList.add('reveal-anim');
            setTimeout(() => cellEl.classList.remove('reveal-anim'), 400);
        }
    }

    /** 播放合成动画 */
    playSynthesisAnim(x, y) {
        if (!this.cellElements || !this.cellElements[y] || !this.cellElements[y][x]) return;
        const cellEl = this.cellElements[y][x];
        cellEl.classList.add('synthesis-anim');
        setTimeout(() => cellEl.classList.remove('synthesis-anim'), 800);
    }

    /** 播放消除动画 */
    playEliminateAnim(x, y) {
        if (!this.cellElements || !this.cellElements[y] || !this.cellElements[y][x]) return;
        const cellEl = this.cellElements[y][x];
        cellEl.classList.add('eliminate-anim');
        setTimeout(() => cellEl.classList.remove('eliminate-anim'), 500);
    }

    /** 播放受伤动画 */
    playDamageAnim(x, y) {
        if (!this.cellElements || !this.cellElements[y] || !this.cellElements[y][x]) return;
        const cellEl = this.cellElements[y][x];
        cellEl.classList.add('damage-anim');
        setTimeout(() => cellEl.classList.remove('damage-anim'), 400);
        
        // 界面震动
        const dungeonPage = document.querySelector('.dungeon-page');
        if (dungeonPage) {
            dungeonPage.classList.add('shake-anim');
            setTimeout(() => dungeonPage.classList.remove('shake-anim'), 400);
        }
    }

    /** 显示浮动文字 */
    showFloatingText(x, y, text, type = 'damage') {
        if (!this.cellElements || !this.cellElements[y] || !this.cellElements[y][x]) return;
        const cellEl = this.cellElements[y][x];
        const rect = cellEl.getBoundingClientRect();
        
        const floater = document.createElement('div');
        floater.className = `floating-text ${type}`;
        floater.textContent = text;
        floater.style.left = `${rect.left + rect.width / 2}px`;
        floater.style.top = `${rect.top}px`;
        document.body.appendChild(floater);
        
        setTimeout(() => floater.remove(), 1000);
    }

    /** 播放治疗动画 */
    playHealAnim() {
        const livesEl = document.getElementById('dungeonLives');
        if (livesEl) {
            livesEl.classList.add('heal-anim');
            setTimeout(() => livesEl.classList.remove('heal-anim'), 600);
        }
    }

    /** 播放分数增加动画 */
    playScoreAnim() {
        const scoreEl = document.getElementById('dungeonScore');
        if (scoreEl) {
            scoreEl.classList.add('score-anim');
            setTimeout(() => scoreEl.classList.remove('score-anim'), 400);
        }
    }

    /** 播放技能激活动画 */
    playSkillActivateAnim(slotIndex) {
        const slot = document.getElementById(`dungeonTraitSlot${slotIndex}`);
        if (slot) {
            slot.classList.add('skill-activate-anim');
            setTimeout(() => slot.classList.remove('skill-activate-anim'), 800);
        }
    }

    /** 播放技能使用动画 */
    playSkillUseAnim(slotIndex) {
        const slot = document.getElementById(`dungeonTraitSlot${slotIndex}`);
        if (slot) {
            slot.classList.add('skill-use-anim');
            setTimeout(() => slot.classList.remove('skill-use-anim'), 500);
        }
    }

    /** 显示连击动画 */
    showComboAnim(combo) {
        if (combo < 3) return;
        const comboEl = document.createElement('div');
        comboEl.className = 'combo-display';
        comboEl.textContent = `${combo} 连击！`;
        document.body.appendChild(comboEl);
        setTimeout(() => comboEl.remove(), 1000);
    }

    /** 播放房间解锁动画 */
    playRoomUnlockAnim(roomId) {
        const mapRooms = document.querySelectorAll('.map-room');
        mapRooms.forEach(room => {
            if (room.onclick && room.onclick.toString().includes(roomId)) {
                room.classList.add('unlock-anim');
                setTimeout(() => room.classList.remove('unlock-anim'), 800);
            }
        });
    }

    /** 播放碎片收集动画 */
    playFragmentCollectAnim() {
        const fragEl = document.getElementById('dungeonFragments');
        if (fragEl) {
            fragEl.classList.add('fragment-anim');
            setTimeout(() => fragEl.classList.remove('fragment-anim'), 600);
        }
    }

    /** 播放锻造动画 */
    playForgeAnim() {
        const btn = document.getElementById('dungeonBtnForge');
        if (btn) {
            btn.classList.add('forge-anim');
            setTimeout(() => btn.classList.remove('forge-anim'), 1500);
        }
    }

    /** 播放护盾激活动画 */
    playShieldAnim() {
        const shieldEl = document.getElementById('dungeonShieldIndicator');
        if (shieldEl) {
            shieldEl.classList.add('shield-anim');
            setTimeout(() => shieldEl.classList.remove('shield-anim'), 600);
        }
    }

    /** 播放五行触发动画 */
    playWuxingAnim() {
        const wuxingEl = document.getElementById('dungeonWuxing');
        if (wuxingEl) {
            wuxingEl.classList.add('wuxing-anim');
            setTimeout(() => wuxingEl.classList.remove('wuxing-anim'), 500);
        }
    }

    /** 开始新游戏 */
    startGame() {
        this.initSound();
        soundSystem.buttonClick();
        this.dungeon.reset();
        this.gameOver = false;
        this.phase = 'sweep';
        this.elapsedTime = 0;
        this.timerStarted = false;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = null;

        this.enterRoom('castle');
        this.showPage('dungeon');
        this.renderDungeonMap();
    }

    /** 进入房间 */
    enterRoom(roomId) {
        this.initSound();
        soundSystem.roomTransition();
        const room = this.dungeon.enterRoom(roomId);
        if (!room) return;

        // 生成新棋盘（如果还没有）
        if (!room.board) {
            const def = DUNGEON_MAP[roomId];
            const entryChars = this.dungeon.getEntryChars();
            // 碎片房间：确保神器字部首出现在棋盘上，避免"幽灵目标"
            const requiredChars = def.fragment && this.dungeon.artifact
                ? [...entryChars, this.dungeon.artifact]
                : entryChars;
            // 跨房间去重：排除已用字（入口字不参与排除，允许跨房间重复）
            const excludeChars = this.dungeon.getUsedChars();
            room.board = generateStrokeBoard(
                def.boardSize.width,
                def.boardSize.height,
                def.boardSize.charCount,
                requiredChars,
                excludeChars
            );
            // 记录本房间已用字（入口字除外，入口字跨房间会重复出现是合理的）
            const usedInBoard = room.board.characters
                .map(c => c.char)
                .filter(ch => !entryChars.some(ec => ec.char === ch));
            this.dungeon.addUsedChars(usedInBoard);
        }
        room.synthesisSelection = [];

        // 清空房间内交互临时状态，避免跨房间泄漏
        this.pendingTrait = null;     // 清空待放置词条（sourceCell 引用旧房间格子）
        this.targetingMode = null;    // 清空瞄准模式（同样会跨房间泄漏）

        this.gameOver = false;
        this.phase = 'sweep';
        this.gridEl = null;
        this.cellElements = null;

        this.render();
        this.renderBackpack();
        this.renderMatchedChars();
        this.renderTraitSlots();
        this.renderDungeonMap();
        this.updateUI();
        this.updateStatus();
        this.updateForgeButton();
    }

    /** 返回主城 */
    returnToCastle() {
        // 保存当前房间状态
        const currentRoom = this.dungeon.currentRoom;
        if (currentRoom) {
            currentRoom.backpack = [];
            currentRoom.synthesisSelection = [];
        }
        this.enterRoom('castle');
    }

    /** 返回主菜单 */
    backToMenu() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerStarted = false;
        this.showPage('menu');
    }

    /** 手动合成 */
    doSynthesize() {
        this.synthesize();
    }

    /** 更新锻造按钮显示 */
    updateForgeButton() {
        const btn = document.getElementById('dungeonBtnForge');
        if (btn) {
            btn.style.display = this.dungeon.canForgeArtifact() ? '' : 'none';
        }
    }

    // ====== 棋盘操作 ======
    handleCellClick(x, y) {
        if (this.gameOver) return;
        const room = this.dungeon.currentRoom;
        if (!room || !room.board) return;
        const cell = room.board.grid[y][x];

        // 瞄准模式：点击格子应用词条效果
        if (this.targetingMode) {
            const { effect, traitName, slotIndex } = this.targetingMode;
            const targetCell = room.board.grid[y][x];
            // 校验目标合法性（非法目标不消耗词条，保持瞄准模式）
            let valid = true;
            if (effect === 'eliminateRadical') {
                valid = targetCell.type === 'radical' && targetCell.state === 'hidden';
            } else if (effect === 'resetCell') {
                valid = targetCell.type === 'number' && targetCell.state === 'revealed' && targetCell.number > 0;
            }
            // peekArea / revealArea / revealRow 任意格均可
            if (!valid) {
                this.setStatus('无效目标，请重新选择', 'warning');
                return;
            }
            this.targetingMode = null;
            this.applyTraitEffect({ effect, name: traitName }, { x, y });
            this.dungeon.traitSlots[slotIndex] = null;
            this.renderTraitSlots();
            this.render();
            this.updateUI();
            return;
        }

        this.startTimer();

        // 已翻开的部首格 → 放入合成选择
        if (cell.state === 'revealed' && cell.type === 'radical') {
            this.toggleSynthesisSelection(x, y);
            return;
        }

        // 点击已合成的汉字格 → 收集词条或显示信息
        if (cell.state === 'matched' || cell.state === 'consumed') {
            const char = cell.matchedChar || cell.consumedChar;
            // 已收集过 → 仅显示信息
            if (cell.traitCollected) {
                this.showCharTraitInfo(char);
                return;
            }
            // 未收集 → 查找该字的词条，进入待放置状态
            const trait = this.getCharTrait(char);
            if (!trait) {
                this.showCharTraitInfo(char);
                return;
            }
            const hasSame = this.dungeon.traitSlots.some(t => t && t.effect === trait.effect);
            if (hasSame) {
                this.setStatus(`「${char}」的技能「${trait.name}」已拥有`, 'info');
                cell.traitCollected = true;
                if (cell.pairCell) cell.pairCell.traitCollected = true;
                this.render();
                return;
            }
            // 进入待放置状态，记录源格子以便放置后标记为已收集
            this.pendingTrait = { ...trait, sourceCell: cell };
            this.renderTraitSlots();
            this.setStatus(`「${char}」技能「${trait.name}」已激活，点击槽位放置/替换`, 'info');
            return;
        }

        // 点击旗子标记的格子 → 翻开（技能标记的部首格）
        if (cell.state === 'flagged') {
            if (cell.type === 'radical') {
                // 检查是否已在背包（revealRadicals 已收集）→ 直接翻开不扣血
                const inBackpack = room.backpack.some(bp => bp.gridX === x && bp.gridY === y);
                if (inBackpack) {
                    cell.state = 'revealed';
                    const entry = room.board.radicalEntries[cell.radicalIndex];
                    this.render();
                    this.renderBackpack();
                    this.updateUI();
                    this.setStatus(`翻开标记格「${entry.component}」(${cell.strokes}画)，可选中合成`, 'success');
                    return;
                }
                // revealArea 仅标记未收集 → 扣血翻开并加入背包
                let damage = cell.strokes;
                if (this.dungeon.nextStrokeReduced) {
                    damage = Math.ceil(damage / 2);
                    this.dungeon.nextStrokeReduced = false;
                }
                this.dungeon.hp -= damage;
                cell.state = 'revealed';
                const entry = room.board.radicalEntries[cell.radicalIndex];
                room.backpack.push({
                    component: entry.component,
                    strokes: cell.strokes,
                    charIndex: entry.charIndex,
                    gridX: x, gridY: y
                });
                this.render();
                this.renderBackpack();
                this.updateUI();
                this.setStatus(`翻开标记格「${entry.component}」(${cell.strokes}画)，扣${damage}命！剩余: ${this.dungeon.hp}`, 'warning');
                if (this.dungeon.hp <= 0) {
                    this.dungeon.hp = 0;
                    this.gameOver = true;
                    this.stopTimer();
                    this.revealAll();
                    this.setStatus('生命归零！探索失败', 'danger');
                    setTimeout(() => this.showResult(false), 1000);
                }
                return;
            }
            // 数字格被标记（理论不会，保险起见翻开）
            cell.state = 'revealed';
            if (cell.number === 0) this.floodFill(x, y);
            this.triggerWuxingEffects(x, y);
            this.render();
            this.updateUI();
            return;
        }

        if (cell.state !== 'hidden') return;

        if (cell.type === 'radical') {
            // 护盾
            if (this.dungeon.shieldActive) {
                this.dungeon.shieldActive = false;
                cell.state = 'revealed';
                const entry = room.board.radicalEntries[cell.radicalIndex];
                room.backpack.push({
                    component: entry.component,
                    strokes: cell.strokes,
                    charIndex: entry.charIndex,
                    gridX: x, gridY: y
                });
                this.render();
                this.renderBackpack();
                this.renderTraitSlots();
                this.updateUI();
                this.setStatus(`护盾抵挡！发现部首「${entry.component}」(${cell.strokes}画)，未扣命`, 'success');
                // 音效和动画
                soundSystem.shieldActivate();
                this.playCellRevealAnim(x, y, 'radical');
                this.playShieldAnim();
                return;
            }
            // 翻开部首格：扣该部首笔画数的生命（reduceStroke时减半）
            let damage = cell.strokes;
            if (this.dungeon.nextStrokeReduced) {
                damage = Math.ceil(damage / 2);
                this.dungeon.nextStrokeReduced = false;
            }
            this.dungeon.hp -= damage;
            cell.state = 'revealed';
            const entry = room.board.radicalEntries[cell.radicalIndex];
            room.backpack.push({
                component: entry.component,
                strokes: cell.strokes,
                charIndex: entry.charIndex,
                gridX: x, gridY: y
            });
            this.render();
            this.renderBackpack();
            this.updateUI();
            this.setStatus(`发现部首「${entry.component}」(${cell.strokes}画)，扣${damage}命！剩余生命: ${this.dungeon.hp}`, 'warning');
            // 音效和动画
            soundSystem.revealRadical();
            soundSystem.takeDamage();
            this.playCellRevealAnim(x, y, 'radical');
            this.playDamageAnim(x, y);
            this.showFloatingText(x, y, `-${damage}`, 'damage');

            if (this.dungeon.hp <= 0) {
                this.dungeon.hp = 0;
                this.gameOver = true;
                this.stopTimer();
                this.revealAll();
                this.setStatus('生命归零！探索失败', 'danger');
                soundSystem.gameOver();
                setTimeout(() => this.showResult(false), 1000);
            }
            return;
        }

        // 数字格
        cell.state = 'revealed';
        soundSystem.revealNumber();
        if (cell.number === 0) this.floodFill(x, y);

        // 蔓延效果：额外翻开1个相邻隐藏数字格
        if (this.dungeon.spreadCharges > 0) {
            this.dungeon.spreadCharges--;
            this.doSpread(x, y);
        }

        // 五行被动效果（Canvas 粒子立即发射，与 DOM 无关）
        this.triggerWuxingEffects(x, y);

        this.render();
        this.playCellRevealAnim(x, y, 'normal');  // 翻转动画作用于新 cellEl
        this.updateUI();
    }

    /**
     * 五行被动技能触发（点击数字格翻开后自动触发）
     * 金：十字翻开（上下左右4格数字格）
     * 木：向棋盘中心方向翻开1格
     * 水（需火激活）：周围一圈全部翻开
     * 土：随机翻开1格隐藏数字格
     */
    triggerWuxingEffects(x, y) {
        const room = this.dungeon.currentRoom;
        if (!room || !room.board) return;
        const { grid, width, height } = room.board;
        // 从技能栏检查五行被动是否激活
        const slots = this.dungeon.traitSlots;
        const w = {
            metal: slots.some(t => t && t.effect === 'metal'),
            wood: slots.some(t => t && t.effect === 'wood'),
            water: slots.some(t => t && t.effect === 'water'),
            fire: slots.some(t => t && t.effect === 'fire'),
            earth: slots.some(t => t && t.effect === 'earth'),
        };
        const wuxingMsgs = [];

        // 获取格子中心坐标
        const getCellCenter = (cx, cy) => {
            const cell = this.cellElements?.[cy]?.[cx];
            if (!cell) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            const rect = cell.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        };

        const revealNum = (cx, cy) => {
            if (cx >= 0 && cx < width && cy >= 0 && cy < height
                && grid[cy][cx].state === 'hidden' && grid[cy][cx].type === 'number') {
                grid[cy][cx].state = 'revealed';
                if (grid[cy][cx].number === 0) this.floodFill(cx, cy);
                return true;
            }
            return false;
        };

        // 金：十字翻开 - 金色切割特效
        if (w.metal) {
            let cnt = 0;
            if (revealNum(x, y - 1)) cnt++;
            if (revealNum(x, y + 1)) cnt++;
            if (revealNum(x - 1, y)) cnt++;
            if (revealNum(x + 1, y)) cnt++;
            if (cnt > 0) {
                wuxingMsgs.push(`金·十字翻开${cnt}格`);
                const center = getCellCenter(x, y);
                effectSystem.metalSlash(center.x, center.y);
            }
        }
        // 木：向中心方向翻开3格 - 藤蔓延伸特效
        if (w.wood) {
            const cx = Math.floor(width / 2), cy = Math.floor(height / 2);
            const dx = cx > x ? 1 : (cx < x ? -1 : 0);
            const dy = cy > y ? 1 : (cy < y ? -1 : 0);
            let woodCnt = 0;
            const woodCells = [];
            for (let step = 1; step <= 3; step++) {
                const tx = x + dx * step, ty = y + dy * step;
                if (revealNum(tx, ty)) {
                    woodCnt++;
                    woodCells.push({ x: tx, y: ty });
                }
            }
            if (woodCnt > 0) {
                wuxingMsgs.push(`木·向心延伸${woodCnt}格`);
                const startCenter = getCellCenter(x, y);
                const endCenter = getCellCenter(x + dx * woodCnt, y + dy * woodCnt);
                effectSystem.woodExtend(startCenter.x, startCenter.y, endCenter.x, endCenter.y);
            }
        }
        // 水（需火激活）：周围一圈全部翻开 - 水波扩散特效
        if (w.water && w.fire) {
            const dirs = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
            let cnt = 0;
            for (const [dx, dy] of dirs) {
                if (revealNum(x + dx, y + dy)) cnt++;
            }
            if (cnt > 0) {
                wuxingMsgs.push(`水·蔓延翻开${cnt}格`);
                const center = getCellCenter(x, y);
                effectSystem.waterWave(center.x, center.y);
            }
        }
        // 土：随机翻开3格 - 落石特效
        if (w.earth) {
            const hidden = [];
            for (let hy = 0; hy < height; hy++)
                for (let hx = 0; hx < width; hx++)
                    if (grid[hy][hx].state === 'hidden' && grid[hy][hx].type === 'number') hidden.push({ x: hx, y: hy });
            if (hidden.length > 0) {
                let earthCnt = 0;
                const targets = [];
                for (let i = 0; i < 3 && hidden.length > 0; i++) {
                    const idx = Math.floor(Math.random() * hidden.length);
                    const t = hidden.splice(idx, 1)[0];
                    if (revealNum(t.x, t.y)) {
                        earthCnt++;
                        targets.push(t);
                    }
                }
                if (earthCnt > 0) {
                    wuxingMsgs.push(`土·落石翻开${earthCnt}格`);
                    for (const t of targets) {
                        const center = getCellCenter(t.x, t.y);
                        effectSystem.earthRockFall(center.x, center.y);
                    }
                }
            }
        }

        if (wuxingMsgs.length > 0) {
            this.setStatus(`五行触发：${wuxingMsgs.join('，')}`, 'info');
            soundSystem.wuxingTrigger();
            this.playWuxingAnim();
        }
    }

    /** 蔓延：翻开目标周围1个隐藏数字格 */
    doSpread(x, y) {
        const room = this.dungeon.currentRoom;
        if (!room || !room.board) return;
        const { grid, width, height } = room.board;
        const candidates = [];
        for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height
                    && grid[ny][nx].state === 'hidden' && grid[ny][nx].type === 'number') {
                    candidates.push({ x: nx, y: ny });
                }
            }
        if (candidates.length > 0) {
            const t = candidates[Math.floor(Math.random() * candidates.length)];
            grid[t.y][t.x].state = 'revealed';
            if (grid[t.y][t.x].number === 0) this.floodFill(t.x, t.y);
            this.setStatus(`蔓延！额外翻开一格`, 'success');
        }
    }

    handleCellRightClick(x, y, e) {
        e.preventDefault();
        if (this.gameOver) return;
        const room = this.dungeon.currentRoom;
        if (!room || !room.board) return;
        const cell = room.board.grid[y][x];

        // 瞄准模式激活时，右键取消瞄准（不触发探测/Chord）
        if (this.targetingMode) {
            this.targetingMode = null;
            this.setStatus('已取消瞄准', 'info');
            this.renderTraitSlots();
            return;
        }

        // 已翻开数字格 → Chord 操作
        if (cell.state === 'revealed' && cell.type === 'number' && cell.number > 0) {
            this.chord(x, y);
            return;
        }
        if (cell.state === 'revealed') return;

        // 右键探测隐藏格子：猜中免费收集，猜错扣1命
        if (cell.state === 'hidden') {
            this.startTimer();
            if (cell.type === 'radical') {
                // 猜中！免费收集，不扣命
                cell.state = 'revealed';
                const entry = room.board.radicalEntries[cell.radicalIndex];
                room.backpack.push({
                    component: entry.component,
                    strokes: cell.strokes,
                    charIndex: entry.charIndex,
                    gridX: x, gridY: y
                });
                this.render();
                this.renderBackpack();
                this.updateUI();
                this.setStatus(`发现部首「${entry.component}」(${cell.strokes}画)！免费收集 ✓`, 'success');
                // 音效和动画
                soundSystem.probeSuccess();
                this.playCellRevealAnim(x, y, 'radical');
            } else {
                // 猜错，是数字格，扣2命并翻开
                const probeDmg = 2;
                this.dungeon.hp -= probeDmg;
                cell.state = 'revealed';
                if (cell.number === 0) {
                    this.floodFill(x, y);
                }
                this.render();
                this.updateUI();
                // 音效和动画
                soundSystem.probeFail();
                soundSystem.takeDamage();
                this.playDamageAnim(x, y);
                this.showFloatingText(x, y, `-${probeDmg}`, 'damage');
                if (this.dungeon.hp <= 0) {
                    this.dungeon.hp = 0;
                    this.gameOver = true;
                    this.stopTimer();
                    this.revealAll();
                    this.setStatus('生命归零！探索失败', 'danger');
                    soundSystem.gameOver();
                    setTimeout(() => this.showResult(false), 1000);
                } else {
                    this.setStatus(`右键探测：这里不是部首，扣${probeDmg}命！剩余生命: ${this.dungeon.hp}`, 'warning');
                }
            }
        }
    }

    chord(x, y) {
        const room = this.dungeon.currentRoom;
        if (!room || !room.board) return;
        // 防御性：瞄准模式激活时不执行 Chord（避免误消耗词条）
        if (this.targetingMode) return;
        const { grid, width, height } = room.board;

        let flaggedSum = 0;
        const adjHidden = [];
        for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    if (grid[ny][nx].state === 'flagged') {
                        flaggedSum += grid[ny][nx].strokes;
                    } else if (grid[ny][nx].state === 'hidden') {
                        adjHidden.push({ x: nx, y: ny });
                    }
                }
            }

        if (flaggedSum === grid[y][x].number) {
            for (const { x: nx, y: ny } of adjHidden) {
                this.handleCellClick(nx, ny);
            }
        }
    }

    floodFill(x, y) {
        const room = this.dungeon.currentRoom;
        if (!room || !room.board) return;
        const { grid, width, height } = room.board;
        for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx].state === 'hidden') {
                    // 对数字格自动翻开，部首格跳过（不自动翻开）
                    if (grid[ny][nx].type === 'number') {
                        grid[ny][nx].state = 'revealed';
                        if (grid[ny][nx].number === 0) this.floodFill(nx, ny);
                    }
                }
            }
    }

    // ====== 合成系统 ======
    toggleSynthesisSelection(x, y) {
        const room = this.dungeon.currentRoom;
        if (!room) return;
        const idx = room.synthesisSelection.findIndex(s => s.x === x && s.y === y);
        if (idx >= 0) {
            room.synthesisSelection.splice(idx, 1);
        } else {
            if (room.synthesisSelection.length >= 2) {
                room.synthesisSelection = [];
            }
            room.synthesisSelection.push({ x, y });
        }
        this.render();
        this.renderBackpack();

        if (room.synthesisSelection.length === 2) {
            setTimeout(() => this.synthesize(), 400);
        }
    }

    selectBackpackItem(idx) {
        const room = this.dungeon.currentRoom;
        if (!room || this.gameOver) return;
        if (idx >= room.backpack.length) return;
        const item = room.backpack[idx];

        // 已选中同一格 → 取消选择（防止重复选同一格导致自组合成）
        const already = room.synthesisSelection.some(s => s.x === item.gridX && s.y === item.gridY);
        if (already) {
            room.synthesisSelection = room.synthesisSelection.filter(s => !(s.x === item.gridX && s.y === item.gridY));
            this.render();
            this.renderBackpack();
            return;
        }

        if (room.synthesisSelection.length >= 2) {
            room.synthesisSelection = [];
        }
        room.synthesisSelection.push({ x: item.gridX, y: item.gridY, backpackIdx: idx });
        this.render();
        this.renderBackpack();

        if (room.synthesisSelection.length === 2) {
            setTimeout(() => this.synthesize(), 400);
        }
    }

    synthesize() {
        const room = this.dungeon.currentRoom;
        if (!room || room.synthesisSelection.length !== 2) return;
        const [s1, s2] = room.synthesisSelection;
        room.synthesisSelection = [];

        const cell1 = room.board.grid[s1.y][s1.x];
        const cell2 = room.board.grid[s2.y][s2.x];
        const r1 = room.board.radicalEntries[cell1.radicalIndex];
        const r2 = room.board.radicalEntries[cell2.radicalIndex];

        const result = matchComponents(r1.component, r2.component);
        if (!result) {
            this.setStatus(`「${r1.component}」和「${r2.component}」无法组合`, 'danger');
            soundSystem.synthesizeFail();
            this.render();
            this.renderBackpack();
            return;
        }

        const char = result.char || result;
        const strokes = result.strokes || getStrokeCount(char);
        const baseScore = strokes * 10;
        this.dungeon.combo++;
        if (this.dungeon.combo > this.dungeon.maxCombo) this.dungeon.maxCombo = this.dungeon.combo;
        const comboBonus = this.dungeon.combo >= 3 ? Math.floor(baseScore * 0.5) : 0;
        // 矿洞房间分数+50%
        const roomDef = DUNGEON_MAP[this.dungeon.currentRoom.id];
        const roomBonus = roomDef && roomDef.scoreBonus ? 1.5 : 1.0;
        const totalScore = Math.floor((baseScore + comboBonus) * this.dungeon.scoreMultiplier * roomBonus);
        this.dungeon.score += totalScore;

        // 回复生命（合成回3点）
        const healAmt = 3;
        const healed = this.dungeon.hp < this.dungeon.maxHp ? Math.min(healAmt, this.dungeon.maxHp - this.dungeon.hp) : 0;
        this.dungeon.hp = Math.min(this.dungeon.maxHp, this.dungeon.hp + healAmt);

        room.matchedChars.push({ char, left: r1.component, right: r2.component, strokes });

        // 合成后字显示在格子上：left格显示汉字，right格用虚线显示同一个字（表示已消耗）
        const leftCell = r1.component === result.left ? cell1 : cell2;
        const rightCell = r1.component === result.left ? cell2 : cell1;
        leftCell.state = 'matched';
        leftCell.matchedChar = char;
        leftCell.matchedWuxing = getWuxing(char);
        rightCell.state = 'consumed';
        rightCell.consumedChar = char; // right格也显示合成后的字，虚线样式
        // 建立双向链接：收集词条时同步标记两个格子，防止重复收集
        leftCell.pairCell = rightCell;
        rightCell.pairCell = leftCell;

        // 消耗两个部首（从背包移除）
        const removeFromBackpack = (x, y) => {
            const bi = room.backpack.findIndex(bp => bp.gridX === x && bp.gridY === y);
            if (bi >= 0) room.backpack.splice(bi, 1);
        };
        removeFromBackpack(s1.x, s1.y);
        removeFromBackpack(s2.x, s2.y);

        this.render();
        this.renderBackpack();
        this.renderMatchedChars();
        this.updateUI();

        // 音效和动画
        soundSystem.synthesize();
        this.playSynthesisAnim(s1.x, s1.y);
        this.playSynthesisAnim(s2.x, s2.y);
        this.playScoreAnim();
        if (healed > 0) this.playHealAnim();
        if (this.dungeon.combo >= 3) {
            this.showComboAnim(this.dungeon.combo);
            soundSystem.combo(this.dungeon.combo);
        }

        // 收集所有合成后事件信息，最后统一显示（避免互相覆盖）
        const messages = [];
        let traitObtained = null;

        // 检测是否为入口字
        const entryChars = this.dungeon.getEntryChars();
        const isEntry = entryChars.find(ec => ec.char === char);
        if (isEntry) {
            this.dungeon.unlockRoom(isEntry.targetRoom);
            messages.push(`🔑 解锁 ${isEntry.label}！`);
            this.renderDungeonMap();
            soundSystem.unlockRoom();
        }
        // 检测是否为神器碎片（合成 boss 字）
        if (char === this.dungeon.artifact.char) {
            const collected = this.dungeon.collectFragment();
            if (collected) {
                messages.push(`💎 神器碎片！(${this.dungeon.fragmentsCollected}/${this.dungeon.totalFragments})`);
                this.renderDungeonMap();
                this.updateForgeButton();
                soundSystem.collectFragment();
                this.playFragmentCollectAnim();
            }
        }
        // 检测五行属性（被动技能）或词条（一次技能），都存入技能栏
        const trait = this.getCharTrait(char);
        if (trait) {
            // 检查是否已有相同效果（避免重复）
            const hasSame = this.dungeon.traitSlots.some(t => t && t.effect === trait.effect);
            if (!hasSame) {
                // 不自动进入待放置状态，用户可随时点击格子上的合成字来收集词条
                messages.push(`✨「${char}」含技能「${trait.name}」，点击该字收集`);
            } else {
                // 已拥有该效果，自动标记为已收集
                leftCell.traitCollected = true;
            }
        }

        const comboText = this.dungeon.combo >= 3 ? ` (${this.dungeon.combo}连击!)` : '';
        const mainMsg = `合成「${char}」(${r1.component}+${r2.component})！+${totalScore}分${healed ? `，回${healed}命` : ''}${comboText}`;
        this.setStatus(messages.length > 0 ? `${mainMsg} | ${messages.join(' | ')}` : mainMsg, 'success');

        this.showMatchCelebration(char, r1.component, r2.component, totalScore);
    }

    // ====== 技能系统 ======
    /** 获取汉字的词条（HANZI_DB 一次技能优先，其次五行被动） */
    getCharTrait(char) {
        if (!char) return null;
        // 优先返回 HANZI_DB 中显式定义的一次技能（避免五行被动遮蔽）
        const charEntry = HANZI_DB.find(h => h.char === char);
        if (charEntry && charEntry.trait) return charEntry.trait;
        // 其次返回五行被动技能
        const wuxing = getWuxing(char);
        if (wuxing) {
            const wuxingTraits = {
                metal: { name: '金·十字', type: 'passive', effect: 'metal', desc: '点击数字格十字翻开', rarity: 'rare' },
                wood: { name: '木·延伸', type: 'passive', effect: 'wood', desc: '向中心方向翻3格', rarity: 'rare' },
                water: { name: '水·蔓延', type: 'passive', effect: 'water', desc: '周围一圈全翻(需火激活)', rarity: 'rare' },
                fire: { name: '火·激活', type: 'passive', effect: 'fire', desc: '激活水的蔓延', rarity: 'rare' },
                earth: { name: '土·落石', type: 'passive', effect: 'earth', desc: '随机翻开3格', rarity: 'rare' },
            };
            if (wuxingTraits[wuxing]) return wuxingTraits[wuxing];
        }
        return null;
    }

    /** 显示合成字的词条信息（点击格子上的合成汉字时触发） */
    showCharTraitInfo(char) {
        if (!char) return;
        const t = this.getCharTrait(char);
        if (!t) {
            this.setStatus(`「${char}」无词条`, 'info');
            return;
        }
        const typeLabel = t.type === 'passive' ? '被动(五行)' : (t.type === 'combat' ? '战斗' : (t.type === 'explore' ? '探索' : t.type));
        const rarityLabel = { common: '普通', rare: '稀有', epic: '史诗' }[t.rarity] || t.rarity || '';
        this.setStatus(`「${char}」${typeLabel ? typeLabel + '·' : ''}${rarityLabel} ${t.name} — ${t.desc}`, 'info');
    }

    useTrait(slotIndex) {
        if (this.gameOver) return;

        // 如果有 pendingTrait，点击空槽放入，点击占用槽替换
        if (this.pendingTrait) {
            const oldTrait = this.dungeon.traitSlots[slotIndex];
            this.dungeon.traitSlots[slotIndex] = {
                name: this.pendingTrait.name,
                type: this.pendingTrait.type,
                effect: this.pendingTrait.effect,
                desc: this.pendingTrait.desc,
                rarity: this.pendingTrait.rarity,
                value: this.pendingTrait.value,
            };
            const newName = this.dungeon.traitSlots[slotIndex].name;
            // 标记源格子为已收集（变虚显示），同步标记配对格防止重复收集
            if (this.pendingTrait.sourceCell) {
                this.pendingTrait.sourceCell.traitCollected = true;
                if (this.pendingTrait.sourceCell.pairCell) {
                    this.pendingTrait.sourceCell.pairCell.traitCollected = true;
                }
            }
            this.pendingTrait = null;
            this.renderTraitSlots();
            this.render();
            if (oldTrait) {
                this.setStatus(`已替换「${oldTrait.name}」→「${newName}」`, 'success');
            } else {
                this.setStatus(`已放入「${newName}」`, 'success');
            }
            soundSystem.skillActivate();
            this.playSkillActivateAnim(slotIndex);
            return;
        }

        const trait = this.dungeon.traitSlots[slotIndex];
        if (!trait) return;

        // 被动技能不可点击使用（持续生效）
        if (trait.type === 'passive') {
            this.setStatus(`「${trait.name}」是被动技能，已持续生效中（${trait.desc}）`, 'info');
            return;
        }

        const room = this.dungeon.currentRoom;
        if (!room || !room.board) return;

        // 需要选择目标的词条：进入瞄准模式
        const targetingEffects = ['peekArea', 'revealArea', 'revealRow', 'resetCell', 'eliminateRadical'];
        if (targetingEffects.includes(trait.effect)) {
            this.targetingMode = { effect: trait.effect, traitName: trait.name, slotIndex };
            this.setStatus(`「${trait.name}」已激活：点击棋盘上目标格子`, 'info');
            return;
        }

        this.applyTraitEffect(trait, null);
        this.dungeon.traitSlots[slotIndex] = null;
        this.renderTraitSlots();
        this.updateUI();
        this.render();
        soundSystem.skillUse();
        this.playSkillUseAnim(slotIndex);
    }

    /** 应用词条效果（targetCell = {x,y} 或 null） */
    applyTraitEffect(trait, targetCell) {
        const room = this.dungeon.currentRoom;
        if (!room || !room.board) return;
        const { grid, width, height } = room.board;

        // 获取目标格子中心坐标（用于特效）
        const getCellCenter = (x, y) => {
            const cell = this.cellElements?.[y]?.[x];
            if (!cell) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            const rect = cell.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        };

        switch (trait.effect) {
            case 'heal': {
                const healAmt = trait.value || 2;
                this.dungeon.hp = Math.min(this.dungeon.hp + healAmt, this.dungeon.maxHp);
                this.setStatus(`使用「${trait.name}」：回复${healAmt}点生命`, 'success');
                soundSystem.heal();
                this.playHealAnim();
                // 治疗特效
                effectSystem.healEffect(window.innerWidth / 2, 100);
                break;
            }
            case 'fullHeal':
                this.dungeon.hp = this.dungeon.maxHp;
                this.setStatus(`使用「${trait.name}」：回复所有生命！`, 'success');
                soundSystem.heal();
                this.playHealAnim();
                // 治疗特效
                effectSystem.healEffect(window.innerWidth / 2, 100);
                break;
            case 'shield':
                this.dungeon.shieldActive = true;
                this.setStatus(`使用「${trait.name}」：下次翻开部首格不扣血`, 'success');
                soundSystem.shieldActivate();
                this.playShieldAnim();
                // 护盾特效
                effectSystem.shieldEffect(window.innerWidth / 2, window.innerHeight / 2);
                break;
            case 'revealRadicals': {
                const unfound = [];
                for (let y = 0; y < height; y++)
                    for (let x = 0; x < width; x++) {
                        if (grid[y][x].type === 'radical' && grid[y][x].state === 'hidden') unfound.push({ x, y });
                    }
                const count = Math.min(3, unfound.length);
                for (let i = 0; i < count; i++) {
                    const idx = Math.floor(Math.random() * unfound.length);
                    const t = unfound.splice(idx, 1)[0];
                    grid[t.y][t.x].state = 'flagged';
                    const entry = room.board.radicalEntries[grid[t.y][t.x].radicalIndex];
                    room.backpack.push({ component: entry.component, strokes: grid[t.y][t.x].strokes, charIndex: entry.charIndex, gridX: t.x, gridY: t.y });
                    // 透视特效
                    const center = getCellCenter(t.x, t.y);
                    effectSystem.peekEffect(center.x, center.y);
                }
                this.setStatus(`使用「${trait.name}」：标记了${count}个部首格`, 'success');
                this.renderBackpack();
                break;
            }
            case 'eliminateRadical': {
                // 消除目标部首格→变为数字格，重算相邻数字
                if (!targetCell) {
                    const hidden = [];
                    for (let y = 0; y < height; y++)
                        for (let x = 0; x < width; x++)
                            if (grid[y][x].type === 'radical' && grid[y][x].state === 'hidden') hidden.push({ x, y });
                    if (hidden.length === 0) { this.setStatus('没有可消除的部首格', 'danger'); return; }
                    targetCell = hidden[Math.floor(Math.random() * hidden.length)];
                }
                grid[targetCell.y][targetCell.x].type = 'number';
                grid[targetCell.y][targetCell.x].radicalIndex = -1;
                grid[targetCell.y][targetCell.x].strokes = 0;
                this.recalculateNumbers();
                grid[targetCell.y][targetCell.x].state = 'revealed';
                this.setStatus(`使用「${trait.name}」：消除部首格，变为数字${grid[targetCell.y][targetCell.x].number}`, 'success');
                soundSystem.eliminate();
                // Canvas 消除特效立即发射（与 DOM 无关）
                const eliminateCenter = getCellCenter(targetCell.x, targetCell.y);
                effectSystem.eliminateEffect(eliminateCenter.x, eliminateCenter.y);
                // 标记待播放消除动画（render 后执行，作用于新 cellEl）
                this._pendingEliminateAnim = { x: targetCell.x, y: targetCell.y };
                break;
            }
            case 'reduceStroke':
                this.dungeon.nextStrokeReduced = true;
                this.setStatus(`使用「${trait.name}」：下次翻开部首格伤害减半`, 'success');
                break;
            case 'xpBoost': {
                const boost = trait.value != null ? trait.value : 0.3;
                this.dungeon.scoreMultiplier = 1 + boost;
                this.setStatus(`使用「${trait.name}」：本局分数+${Math.round(boost * 100)}%`, 'success');
                break;
            }
            case 'peekArea': {
                // 透视目标周围8格（临时显示3秒）
                if (!targetCell) targetCell = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
                const peeked = [];
                for (let dy = -1; dy <= 1; dy++)
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = targetCell.x + dx, ny = targetCell.y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx].state === 'hidden') {
                            grid[ny][nx].state = 'peeked';
                            peeked.push({ x: nx, y: ny });
                        }
                    }
                this.setStatus(`使用「${trait.name}」：透视${peeked.length}格（3秒后恢复）`, 'success');
                // 透视特效
                const peekCenter = getCellCenter(targetCell.x, targetCell.y);
                effectSystem.peekEffect(peekCenter.x, peekCenter.y);
                this.render();
                setTimeout(() => {
                    for (const p of peeked) if (grid[p.y][p.x].state === 'peeked') grid[p.y][p.x].state = 'hidden';
                    this.render();
                }, 3000);
                break;
            }
            case 'energy': {
                // 星辰：免费翻开3个随机隐藏数字格
                const hiddenNums = [];
                for (let y = 0; y < height; y++)
                    for (let x = 0; x < width; x++)
                        if (grid[y][x].type === 'number' && grid[y][x].state === 'hidden') hiddenNums.push({ x, y });
                const cnt = Math.min(3, hiddenNums.length);
                for (let i = 0; i < cnt; i++) {
                    const idx = Math.floor(Math.random() * hiddenNums.length);
                    const t = hiddenNums.splice(idx, 1)[0];
                    grid[t.y][t.x].state = 'revealed';
                    if (grid[t.y][t.x].number === 0) this.floodFill(t.x, t.y);
                    // 星辰特效
                    const center = getCellCenter(t.x, t.y);
                    effectSystem.playEffect('wood', center.x, center.y);
                }
                this.setStatus(`使用「${trait.name}」：翻开${cnt}个数字格`, 'success');
                break;
            }
            case 'weakenAll': {
                // 所有未翻开部首格笔画-1，重算数字
                let cnt = 0;
                for (let y = 0; y < height; y++)
                    for (let x = 0; x < width; x++)
                        if (grid[y][x].type === 'radical' && grid[y][x].state === 'hidden') {
                            grid[y][x].strokes = Math.max(1, grid[y][x].strokes - 1);
                            cnt++;
                            // 削弱特效
                            const center = getCellCenter(x, y);
                            effectSystem.playEffect('earth', center.x, center.y);
                        }
                this.recalculateNumbers();
                this.setStatus(`使用「${trait.name}」：${cnt}个部首格笔画-1`, 'success');
                break;
            }
            case 'resetCell': {
                // 重置目标已翻开数字格为隐藏
                if (!targetCell) {
                    const revealed = [];
                    for (let y = 0; y < height; y++)
                        for (let x = 0; x < width; x++)
                            if (grid[y][x].type === 'number' && grid[y][x].state === 'revealed' && grid[y][x].number > 0) revealed.push({ x, y });
                    if (revealed.length === 0) { this.setStatus('没有可重置的数字格', 'danger'); return; }
                    targetCell = revealed[Math.floor(Math.random() * revealed.length)];
                }
                grid[targetCell.y][targetCell.x].state = 'hidden';
                this.setStatus(`使用「${trait.name}」：重置一格为隐藏`, 'success');
                break;
            }
            case 'revealRow': {
                // 翻开目标所在行所有数字格
                if (!targetCell) targetCell = { x: 0, y: Math.floor(height / 2) };
                let cnt = 0;
                for (let x = 0; x < width; x++) {
                    if (grid[targetCell.y][x].state === 'hidden' && grid[targetCell.y][x].type === 'number') {
                        grid[targetCell.y][x].state = 'revealed';
                        if (grid[targetCell.y][x].number === 0) this.floodFill(x, targetCell.y);
                        cnt++;
                    }
                }
                this.setStatus(`使用「${trait.name}」：翻开第${targetCell.y + 1}行${cnt}格`, 'success');
                break;
            }
            case 'revealArea': {
                // 显示目标周围8格中部首位置（标记并加入背包，与 revealRadicals 一致）
                if (!targetCell) targetCell = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
                let cnt = 0;
                for (let dy = -1; dy <= 1; dy++)
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = targetCell.x + dx, ny = targetCell.y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height
                            && grid[ny][nx].type === 'radical' && grid[ny][nx].state === 'hidden') {
                            grid[ny][nx].state = 'flagged';
                            const entry = room.board.radicalEntries[grid[ny][nx].radicalIndex];
                            room.backpack.push({ component: entry.component, strokes: grid[ny][nx].strokes, charIndex: entry.charIndex, gridX: nx, gridY: ny });
                            cnt++;
                            const center = getCellCenter(nx, ny);
                            effectSystem.peekEffect(center.x, center.y);
                        }
                    }
                this.setStatus(`使用「${trait.name}」：标记并收集${cnt}个部首`, 'success');
                this.renderBackpack();
                break;
            }
            case 'spread':
                // 蔓延：接下来3次点击数字格时，额外翻开1个相邻隐藏格
                this.dungeon.spreadCharges = 3;
                this.setStatus(`使用「${trait.name}」：接下来3次翻格附带蔓延效果`, 'success');
                break;
            case 'peekStart': {
                // 照明：立即翻开3个随机隐藏格（含部首格）
                const hiddenAll = [];
                for (let y = 0; y < height; y++)
                    for (let x = 0; x < width; x++)
                        if (grid[y][x].state === 'hidden') hiddenAll.push({ x, y });
                const cnt = Math.min(3, hiddenAll.length);
                for (let i = 0; i < cnt; i++) {
                    const idx = Math.floor(Math.random() * hiddenAll.length);
                    const t = hiddenAll.splice(idx, 1)[0];
                    const c = grid[t.y][t.x];
                    c.state = 'revealed';
                    if (c.type === 'number' && c.number === 0) this.floodFill(t.x, t.y);
                    const center = getCellCenter(t.x, t.y);
                    effectSystem.peekEffect(center.x, center.y);
                }
                this.setStatus(`使用「${trait.name}」：翻开${cnt}个隐藏格`, 'success');
                break;
            }
        }
        this.render();
        // 待播放的格子级动画（render 后执行，作用于新 cellEl）
        if (this._pendingEliminateAnim) {
            const { x, y } = this._pendingEliminateAnim;
            this._pendingEliminateAnim = null;
            this.playEliminateAnim(x, y);
        }
        this.updateUI();
    }

    /** 重算棋盘所有数字格（消除部首/削弱后调用） */
    recalculateNumbers() {
        const room = this.dungeon.currentRoom;
        if (!room || !room.board) return;
        const { grid, width, height } = room.board;
        for (let y = 0; y < height; y++)
            for (let x = 0; x < width; x++) {
                if (grid[y][x].type === 'number') {
                    let sum = 0;
                    for (let dy = -1; dy <= 1; dy++)
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx].type === 'radical') {
                                sum += grid[ny][nx].strokes;
                            }
                        }
                    grid[y][x].number = sum;
                }
            }
    }

    // ====== 锻造神器 ======
    forgeArtifact() {
        if (!this.dungeon.canForgeArtifact()) return;
        const success = this.dungeon.forgeArtifact();
        if (success) {
            this.gameOver = true;
            this.stopTimer();
            this.setStatus(`🎉 神器「${this.dungeon.artifact.char}」锻造成功！通关！`, 'success');
            soundSystem.forgeArtifact();
            this.playForgeAnim();
            setTimeout(() => {
                soundSystem.victory();
                this.showResult(true);
            }, 1500);
        }
    }

    // ====== UI 渲染 ======
    render() {
        const boardEl = document.getElementById('dungeonBoard');
        if (!boardEl) return;
        const room = this.dungeon.currentRoom;
        if (!room || !room.board) return;

        const { grid, width, height } = room.board;
        boardEl.innerHTML = '';
        const gridEl = document.createElement('div');
        gridEl.className = 'board-grid';
        gridEl.style.gridTemplateColumns = `repeat(${width}, 52px)`;
        gridEl.style.gridTemplateRows = `repeat(${height}, 52px)`;
        this.gridEl = gridEl;
        this.cellElements = [];

        for (let y = 0; y < height; y++) {
            this.cellElements[y] = [];
            for (let x = 0; x < width; x++) {
                const cell = grid[y][x];
                const cellEl = document.createElement('div');
                cellEl.className = 'cell';
                cellEl.addEventListener('click', () => this.handleCellClick(x, y));
                cellEl.addEventListener('contextmenu', (e) => this.handleCellRightClick(x, y, e));

                if (cell.state === 'hidden') {
                    cellEl.classList.add('hidden');
                } else if (cell.state === 'matched') {
                    // 合成成功：显示完整汉字
                    cellEl.classList.add('matched');
                    if (cell.matchedWuxing) cellEl.classList.add(`wx-${cell.matchedWuxing}`);
                    if (cell.traitCollected) cellEl.classList.add('trait-collected');
                    cellEl.innerHTML = `<span class="matched-char">${cell.matchedChar || ''}</span>`;
                } else if (cell.state === 'consumed') {
                    // 部首已消耗：用虚线显示合成后的字
                    cellEl.classList.add('consumed');
                    if (cell.traitCollected) cellEl.classList.add('trait-collected');
                    if (cell.consumedChar) {
                        cellEl.innerHTML = `<span class="consumed-char">${cell.consumedChar}</span>`;
                    }
                } else if (cell.state === 'peeked') {
                    // 透视状态：半透明显示内容
                    cellEl.classList.add('peeked');
                    if (cell.type === 'radical') {
                        cellEl.innerHTML = `<span class="radical-comp">${room.board.radicalEntries[cell.radicalIndex].component}</span>`;
                    } else {
                        cellEl.textContent = cell.number === 0 ? '' : cell.number;
                    }
                } else if (cell.state === 'flagged') {
                    cellEl.classList.add('flagged');
                    cellEl.textContent = '🚩';
                } else if (cell.type === 'radical') {
                    cellEl.classList.add('radical', 'revealed');
                    const comp = room.board.radicalEntries[cell.radicalIndex].component;
                    cellEl.innerHTML = `<span class="radical-comp">${comp}</span><span class="radical-strokes">${cell.strokes}</span>`;
                    const isSelected = room.synthesisSelection.some(s => s.x === x && s.y === y);
                    if (isSelected) cellEl.classList.add('synthesis-selected');
                } else if (cell.type === 'number') {
                    cellEl.classList.add('number');
                    cellEl.textContent = cell.number === 0 ? '' : cell.number;
                    if (cell.number === 0) cellEl.classList.add('zero');
                }
                gridEl.appendChild(cellEl);
                this.cellElements[y][x] = cellEl;
            }
        }
        boardEl.appendChild(gridEl);
    }

    renderBackpack() {
        const el = document.getElementById('dungeonBackpack');
        if (!el) return;
        const room = this.dungeon.currentRoom;
        if (!room || room.backpack.length === 0) {
            el.innerHTML = '<div class="empty-hint">背包为空</div>';
        } else {
            el.innerHTML = room.backpack.map((item, idx) => {
                const isSelected = room.synthesisSelection.some(s => s.backpackIdx === idx);
                return `<div class="backpack-item${isSelected ? ' selected' : ''}" onclick="dungeonGame.selectBackpackItem(${idx})">
                    <span class="bp-comp">${item.component}</span>
                    <span class="bp-strokes">${item.strokes}画</span>
                </div>`;
            }).join('');
        }
        // 显示/隐藏合成按钮
        const btn = document.getElementById('dungeonBtnSynth');
        if (btn) {
            btn.style.display = room && room.synthesisSelection.length === 2 ? '' : 'none';
        }
    }

    renderMatchedChars() {
        const el = document.getElementById('dungeonMatchedChars');
        if (!el) return;
        const room = this.dungeon.currentRoom;
        if (!room || room.matchedChars.length === 0) {
            el.innerHTML = '<div class="empty-hint">还没有合成汉字</div>';
            return;
        }
        el.innerHTML = room.matchedChars.map(m =>
            `<div class="matched-item">${m.char}<span class="matched-detail">${m.left}+${m.right}</span></div>`
        ).join('');
    }

    renderTraitSlots() {
        const bar = document.getElementById('dungeonTraitBar');
        if (!bar) return;
        for (let i = 0; i < 3; i++) {
            const slot = document.getElementById(`dungeonTraitSlot${i}`);
            if (!slot) continue;
            const trait = this.dungeon.traitSlots[i];
            // 有 pendingTrait 时所有槽位高亮可点击（替换模式）
            if (this.pendingTrait) {
                slot.classList.add('replaceable');
                slot.onclick = () => this.useTrait(i);
                if (!trait) {
                    slot.innerHTML = '<span class="trait-empty">空（替换）</span>';
                }
                continue;
            }
            slot.classList.remove('replaceable');
            if (trait) {
                const icon = trait.type === 'passive' ? '🔮' : (trait.type === 'combat' ? '⚔️' : '🔍');
                // 技能名颜色：五行被动用对应五行色，一次技能按稀有度着色
                let colorClass = '';
                if (trait.type === 'passive' && ['metal','wood','water','fire','earth'].includes(trait.effect)) {
                    colorClass = `trait-wx trait-wx-${trait.effect}`;
                } else {
                    colorClass = `trait-rarity trait-rarity-${trait.rarity || 'common'}`;
                }
                slot.innerHTML = `<span class="trait-icon">${icon}</span><span class="trait-name ${colorClass}">${trait.name}</span>`;
                slot.className = `trait-slot filled rarity-${trait.rarity}`;
                slot.onclick = () => this.useTrait(i);
            } else {
                slot.innerHTML = '<span class="trait-empty">空</span>';
                slot.className = 'trait-slot';
                slot.onclick = null;
            }
        }
        const shieldInd = document.getElementById('dungeonShieldIndicator');
        if (shieldInd) shieldInd.style.display = this.dungeon.shieldActive ? 'inline' : 'none';
    }

    renderDungeonMap() {
        const el = document.getElementById('dungeonMap');
        if (!el) return;
        const rooms = this.dungeon.getUnlockedRooms();
        el.innerHTML = rooms.map(r => {
            const isCurrent = this.dungeon.currentRoom && r.id === this.dungeon.currentRoom.id;
            const def = DUNGEON_MAP[r.id];
            const frag = def.fragment && r.fragmentCollected ? ' 💎' : '';
            return `<div class="map-room${isCurrent ? ' current' : ''}" onclick="dungeonGame.enterRoom('${r.id}')">
                <span class="map-icon">${r.icon}</span>
                <span class="map-name">${r.name}${frag}</span>
            </div>`;
        }).join('');

        // 碎片进度
        const fragEl = document.getElementById('dungeonFragments');
        if (fragEl) {
            fragEl.textContent = `${this.dungeon.fragmentsCollected}/${this.dungeon.totalFragments}`;
        }
    }

    updateUI() {
        const room = this.dungeon.currentRoom;
        // 生命显示（maxHp > 10 时用数字格式，否则用 ❤❤❤）
        const livesEl = document.getElementById('dungeonLives');
        if (livesEl) {
            const lives = Math.max(0, this.dungeon.hp);
            if (this.dungeon.maxHp > 10) {
                livesEl.textContent = `❤ ${lives}/${this.dungeon.maxHp}`;
            } else {
                livesEl.textContent = '❤'.repeat(lives) + '🖤'.repeat(Math.max(0, this.dungeon.maxHp - lives));
            }
        }
        document.getElementById('dungeonScore').textContent = this.dungeon.score;
        document.getElementById('dungeonRoomName').textContent = room ? room.name : '';

        // 神器目标
        const artifactEl = document.getElementById('dungeonArtifact');
        if (artifactEl) {
            artifactEl.textContent = this.dungeon.artifact ? this.dungeon.artifact.char : '—';
        }

        // 五行被动状态（从技能栏读取）
        const wuxingEl = document.getElementById('dungeonWuxing');
        if (wuxingEl) {
            const slots = this.dungeon.traitSlots;
            const has = (eff) => slots.some(t => t && t.effect === eff);
            const parts = [];
            if (has('metal')) parts.push('<span class="wx metal">金</span>');
            if (has('wood')) parts.push('<span class="wx wood">木</span>');
            if (has('water')) parts.push('<span class="wx water">水</span>');
            if (has('fire')) parts.push('<span class="wx fire">火</span>');
            if (has('earth')) parts.push('<span class="wx earth">土</span>');
            wuxingEl.innerHTML = parts.length > 0 ? parts.join(' ') : '—';
        }

        // 目标字
        if (room && room.board) {
            const targetList = document.getElementById('dungeonTargetList');
            if (targetList) {
                targetList.innerHTML = room.board.characters.map(ch => {
                    const matched = room.matchedChars.some(m => m.char === ch.char);
                    return `<span class="target-item${matched ? ' found' : ''}">${ch.char}</span>`;
                }).join('');
            }
        }
    }

    updateStatus() {
        const room = this.dungeon.currentRoom;
        if (!room) return;
        const def = DUNGEON_MAP[room.id];
        let msg = `${room.name} - ${def.desc}`;
        if (def.fragment) {
            const artChar = this.dungeon.artifact ? this.dungeon.artifact.char : '？';
            const collected = room.fragmentCollected ? '（已收集）' : '';
            msg += ` | 合成「${artChar}」收集碎片 ${this.dungeon.fragmentsCollected}/${this.dungeon.totalFragments}${collected}`;
        }
        if (def.boss) msg += ` | 击败Boss`;
        if (def.traitShop) msg += ` | 收集词条`;
        if (def.scoreBonus) msg += ` | 矿洞合成分数+50%`;
        if (def.artifactForge && this.dungeon.hasAllFragments()) {
            msg += ` | ⚡可以锻造神器！`;
        } else if (def.artifactForge && !this.dungeon.hasAllFragments()) {
            msg += ` | 前往外郭/宫殿/港口收集3片碎片后回此锻造`;
        }
        this.setStatus(msg, 'info');
    }

    setStatus(msg, type) {
        const el = document.getElementById('dungeonStatus');
        if (!el) return;
        el.textContent = msg;
        el.className = 'status-bar ' + type;
    }

    showMatchCelebration(char, left, right, score) {
        const el = document.getElementById('dungeonCelebration');
        if (!el) return;
        el.innerHTML = `<div class="celebration-text">${char}<span class="celebration-detail">${left}+${right}</span><span class="celebration-score">+${score}</span></div>`;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 1200);
    }

    // ====== 计时器 ======
    startTimer() {
        if (this.timerStarted) return;
        this.timerStarted = true;
        this.timerInterval = setInterval(() => {
            this.elapsedTime++;
            const m = Math.floor(this.elapsedTime / 60);
            const s = this.elapsedTime % 60;
            const el = document.getElementById('dungeonTimer');
            if (el) el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    revealAll() {
        const room = this.dungeon.currentRoom;
        if (!room || !room.board) return;
        for (let y = 0; y < room.board.height; y++)
            for (let x = 0; x < room.board.width; x++) {
                if (room.board.grid[y][x].state === 'hidden') {
                    room.board.grid[y][x].state = 'revealed';
                }
            }
        this.render();
    }

    // ====== 结算 ======
    showResult(won) {
        document.getElementById('dungeonResultIcon').textContent = won ? '🎉' : '💀';
        document.getElementById('dungeonResultTitle').textContent = won ? '神器锻造成功！' : '生命归零！';
        document.getElementById('dungeonResultScore').textContent = this.dungeon.score;
        document.getElementById('dungeonResultFrags').textContent = `${this.dungeon.fragmentsCollected}/${this.dungeon.totalFragments}`;
        document.getElementById('dungeonResultRooms').textContent = this.dungeon.unlocked.size;
        this.showPage('dungeonResult');
    }

    // ====== 页面切换 ======
    showPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const el = document.getElementById(`page${page.charAt(0).toUpperCase() + page.slice(1)}`);
        if (el) {
            el.classList.add('active');
            el.style.animation = 'none';
            el.offsetHeight;
            el.style.animation = '';
        }
    }
}