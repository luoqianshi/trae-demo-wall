// ============================================================
//  勇士大战恶龙风格 · 多职业对战 — 职业系统 + 暴击
// ============================================================

// ── 职业定义 ──────────────────────────────────────────────────
const CLASS_DEFS = [
    {
        name: '战士', emoji: '⚔️',
        hp: 150, maxHp: 150, mp: 60, maxMp: 60, critChance: 0.15,
        skills: [
            { name: '猛击',     icon: '⚔️', dmg: 20, heal: 0,  mpCost: 0  },
            { name: '旋风斩',   icon: '🌀', dmg: 35, heal: 0,  mpCost: 15 },
            { name: '战吼',     icon: '📯', dmg: 0,  heal: 15, mpCost: 10 },
            { name: '致命一击', icon: '💀', dmg: 50, heal: 0,  mpCost: 25 },
        ]
    },
    {
        name: '法师', emoji: '🧙',
        hp: 80, maxHp: 80, mp: 150, maxMp: 150, critChance: 0.25,
        skills: [
            { name: '火球术',   icon: '🔥', dmg: 18, heal: 0,  mpCost: 0  },
            { name: '暴风雪',   icon: '❄️', dmg: 30, heal: 0,  mpCost: 20 },
            { name: '魔法盾',   icon: '🛡️', dmg: 0,  heal: 25, mpCost: 15 },
            { name: '陨石术',   icon: '☄️', dmg: 45, heal: 0,  mpCost: 35 },
        ]
    },
    {
        name: '牧师', emoji: '✝️',
        hp: 100, maxHp: 100, mp: 120, maxMp: 120, critChance: 0.10,
        skills: [
            { name: '惩击',     icon: '✝️', dmg: 12, heal: 0,  mpCost: 0  },
            { name: '圣光术',   icon: '✨', dmg: 0,  heal: 35, mpCost: 15 },
            { name: '恢复',     icon: '💚', dmg: 0,  heal: 20, mpCost: 10 },
            { name: '神圣审判', icon: '⚖️', dmg: 30, heal: 0,  mpCost: 30 },
        ]
    },
    {
        name: '盗贼', emoji: '🗡️',
        hp: 90, maxHp: 90, mp: 80, maxMp: 80, critChance: 0.30,
        skills: [
            { name: '背刺',   icon: '🗡️', dmg: 18, heal: 0,  mpCost: 0  },
            { name: '毒刃',   icon: '☠️', dmg: 25, heal: 0,  mpCost: 15 },
            { name: '绷带',   icon: '🩹', dmg: 0,  heal: 15, mpCost: 10 },
            { name: '暗杀',   icon: '🌑', dmg: 40, heal: 0,  mpCost: 25 },
        ]
    }
];

// 深拷贝一份用于追踪运行时状态
function cloneClassDefs() {
    return CLASS_DEFS.map(c => ({
        ...c,
        skills: c.skills.map(s => ({ ...s }))
    }));
}

// ── 游戏状态对象 ──────────────────────────────────────────────
const gameState = {
    currentClass: 0,
    classes: cloneClassDefs(),
    enemy: {
        name: '🐉 恶龙',
        hp: 300, maxHp: 300,
        mp: 150, maxMp: 150,
        critChance: 0.10,
        skills: [
            { name: '爪击',     icon: '🐾', dmg: 15, heal: 0,  mpCost: 0  },
            { name: '龙息',     icon: '🔥', dmg: 28, heal: 0,  mpCost: 15 },
            { name: '龙鳞愈合', icon: '💚', dmg: 0,  heal: 22, mpCost: 10 },
            { name: '暗影爆裂', icon: '💀', dmg: 38, heal: 0,  mpCost: 30 },
        ]
    },
    logs: [],
    isGameOver: false,
    isPlayerTurn: true,
    critFlash: null  // { x, y, alpha, scale }
};

// ── DOM 引用 ─────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const classBtns = [0, 1, 2, 3].map(i => document.getElementById('classBtn' + i));
const skillBtns = [0, 1, 2, 3].map(i => document.getElementById('skillBtn' + i));
const resetBtn = document.getElementById('resetBtn');
const logContent = document.getElementById('logContent');

// ── 工具函数 ─────────────────────────────────────────────────

/** 获取当前职业对象 */
function getPlayer() {
    return gameState.classes[gameState.currentClass];
}

/** 暴击判定 */
function tryCrit(char) {
    if (Math.random() < char.critChance) {
        return { isCrit: true, multiplier: 2 };
    }
    return { isCrit: false, multiplier: 1 };
}

/** MP 回复 */
function regenMp(char) {
    char.mp = Math.min(char.maxMp, char.mp + 10);
}

/** 添加战斗日志 */
function addLog(msg) {
    gameState.logs.push(msg);
    if (gameState.logs.length > 4) {
        gameState.logs.shift();
    }
    updateLogUI();
}

/** 更新日志 UI */
function updateLogUI() {
    logContent.innerHTML = gameState.logs
        .map(m => `<div class="log-entry">▸ ${m}</div>`)
        .join('');
}

/** 更新职业切换按钮 */
function updateClassButtons() {
    classBtns.forEach((btn, i) => {
        if (i === gameState.currentClass) {
            btn.classList.add('class-btn-active');
        } else {
            btn.classList.remove('class-btn-active');
        }
    });
}

/** 更新技能按钮文字 */
function updateSkillButtons() {
    const player = getPlayer();
    skillBtns.forEach((btn, i) => {
        const skill = player.skills[i];
        btn.innerHTML = `${skill.icon} ${skill.name}<br><small>MP ${skill.mpCost}</small>`;
    });
}

/** 更新按钮状态 */
function updateButtons() {
    const player = getPlayer();
    const baseDisabled = gameState.isGameOver || !gameState.isPlayerTurn;
    skillBtns.forEach((btn, i) => {
        const skill = player.skills[i];
        btn.disabled = baseDisabled || player.mp < skill.mpCost;
    });
}

// ── 职业切换 ─────────────────────────────────────────────────
function switchClass(index) {
    if (gameState.isGameOver) return;
    if (index === gameState.currentClass) return;
    gameState.currentClass = index;
    updateClassButtons();
    updateSkillButtons();
    updateButtons();
    render();
}

// ── 玩家行动 ─────────────────────────────────────────────────
function playerAction(skillIndex) {
    if (gameState.isGameOver || !gameState.isPlayerTurn) return;

    const player = getPlayer();
    const skill = player.skills[skillIndex];

    if (player.mp < skill.mpCost) {
        addLog('⚠️ MP 不足，无法使用【' + skill.name + '】！');
        return;
    }

    gameState.isPlayerTurn = false;

    // 扣除 MP
    player.mp -= skill.mpCost;

    // 暴击判定
    const crit = tryCrit(player);

    // 执行技能效果
    if (skill.dmg > 0) {
        const finalDmg = skill.dmg * crit.multiplier;
        gameState.enemy.hp = Math.max(0, gameState.enemy.hp - finalDmg);
        let msg = `${player.name}${player.emoji} 使用【${skill.icon} ${skill.name}】，对 ${gameState.enemy.name} 造成 ${finalDmg} 伤害`;
        if (crit.isCrit) {
            msg += '  💥 暴击！';
            gameState.critFlash = { x: 600, y: 280, alpha: 1, scale: 1 };
        }
        addLog(msg);
    }
    if (skill.heal > 0) {
        const healed = Math.min(player.maxHp - player.hp, skill.heal);
        player.hp = Math.min(player.maxHp, player.hp + skill.heal);
        addLog(`${player.name}${player.emoji} 使用【${skill.icon} ${skill.name}】，恢复 ${healed} 生命`);
    }

    // MP 回复
    regenMp(player);

    render();

    if (checkGameOver()) {
        gameState.isPlayerTurn = true;
        updateButtons();
        return;
    }

    // 电脑行动
    updateButtons();
    setTimeout(() => {
        enemyTurn();
        render();
        gameState.isPlayerTurn = true;
        updateButtons();
    }, 600);
}

// ── 电脑 AI 行动 ─────────────────────────────────────────────
function enemyTurn() {
    if (gameState.isGameOver) return;

    const enemy = gameState.enemy;
    const skills = enemy.skills;

    // 筛选 MP 足够的技能
    const available = skills
        .map((s, i) => ({ ...s, index: i }))
        .filter(s => enemy.mp >= s.mpCost);

    if (available.length === 0) {
        available.push({ ...skills[0], index: 0 });
    }

    let chosen;
    // 低血量优先治疗
    if (enemy.hp <= 80) {
        const healSkill = available.find(s => s.heal > 0);
        chosen = healSkill && Math.random() < 0.7 ? healSkill : available[Math.floor(Math.random() * available.length)];
    } else {
        const weights = available.map(s => s.index === 3 ? 0.3 : 1);
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < available.length; i++) {
            r -= weights[i];
            if (r <= 0) { chosen = available[i]; break; }
        }
        if (!chosen) chosen = available[available.length - 1];
    }

    // 暴击判定
    const crit = tryCrit(enemy);

    // 执行技能
    enemy.mp -= chosen.mpCost;

    const player = getPlayer();
    if (chosen.dmg > 0) {
        const finalDmg = chosen.dmg * crit.multiplier;
        player.hp = Math.max(0, player.hp - finalDmg);
        let msg = `${enemy.name} 使用【${chosen.icon} ${chosen.name}】，对 ${player.name}${player.emoji} 造成 ${finalDmg} 伤害`;
        if (crit.isCrit) {
            msg += '  💥 暴击！';
            gameState.critFlash = { x: 200, y: 280, alpha: 1, scale: 1 };
        }
        addLog(msg);
    }
    if (chosen.heal > 0) {
        const healed = Math.min(enemy.maxHp - enemy.hp, chosen.heal);
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + chosen.heal);
        addLog(`${enemy.name} 使用【${chosen.icon} ${chosen.name}】，恢复 ${healed} 生命`);
    }

    regenMp(enemy);
    checkGameOver();
}

// ── 胜负判定 ─────────────────────────────────────────────────
function checkGameOver() {
    const player = getPlayer();
    if (player.hp <= 0) {
        gameState.isGameOver = true;
        addLog('💀 败北 — 恶龙获得了胜利！');
        return true;
    }
    if (gameState.enemy.hp <= 0) {
        gameState.isGameOver = true;
        addLog('🎉 胜利！英雄们击败了恶龙！');
        return true;
    }
    return false;
}

// ── 重置游戏 ─────────────────────────────────────────────────
function resetGame() {
    gameState.classes = cloneClassDefs();
    gameState.currentClass = 0;
    gameState.enemy.hp = gameState.enemy.maxHp;
    gameState.enemy.mp = gameState.enemy.maxMp;
    gameState.logs = [];
    gameState.isGameOver = false;
    gameState.isPlayerTurn = true;
    gameState.critFlash = null;
    logContent.innerHTML = '';
    addLog('⚔️ 新的战斗开始！选择职业和技能吧。');
    updateClassButtons();
    updateSkillButtons();
    render();
    updateButtons();
}

// ============================================================
//  赛尔号风格 · Canvas 渲染
// ============================================================

const W = canvas.width;
const H = canvas.height;

/** 主渲染入口 */
function render() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawBattlePlatform();
    drawCharacter(true, 200, getPlayer());
    drawCharacter(false, 600, gameState.enemy);
    drawTurnIndicator();
    if (gameState.isGameOver) drawGameOverOverlay();
    if (gameState.critFlash) drawCritEffect();
}

// ── 场景背景 ─────────────────────────────────────────────────
function drawBackground() {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0,    '#1a3a5c');
    skyGrad.addColorStop(0.2,  '#2c6faa');
    skyGrad.addColorStop(0.45, '#5ba3d9');
    skyGrad.addColorStop(0.7,  '#8dc8f0');
    skyGrad.addColorStop(1,    '#bfe4f8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    drawSun(660, 90);
    drawCloud(120, 75, 0.7);
    drawCloud(420, 55, 0.5);
    drawCloud(580, 120, 0.55);
    drawCloud(300, 140, 0.4);
    drawMountains();

    const grassGrad = ctx.createLinearGradient(0, 370, 0, H);
    grassGrad.addColorStop(0,    '#5cb85c');
    grassGrad.addColorStop(0.35, '#4caf50');
    grassGrad.addColorStop(0.7,  '#388e3c');
    grassGrad.addColorStop(1,    '#1b5e20');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 375, W, H - 375);
}

function drawSun(x, y) {
    const glow1 = ctx.createRadialGradient(x, y, 30, x, y, 120);
    glow1.addColorStop(0, 'rgba(255, 220, 80, 0.5)');
    glow1.addColorStop(0.4, 'rgba(255, 200, 60, 0.2)');
    glow1.addColorStop(1, 'rgba(255, 180, 40, 0)');
    ctx.fillStyle = glow1;
    ctx.beginPath();
    ctx.arc(x, y, 120, 0, Math.PI * 2);
    ctx.fill();

    const glow2 = ctx.createRadialGradient(x, y, 15, x, y, 60);
    glow2.addColorStop(0, 'rgba(255, 240, 150, 0.8)');
    glow2.addColorStop(0.5, 'rgba(255, 220, 100, 0.3)');
    glow2.addColorStop(1, 'rgba(255, 200, 60, 0)');
    ctx.fillStyle = glow2;
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffe082';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
}

function drawCloud(x, y, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#ffffff';
    const drawEllipse = (cx, cy, rx, ry) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    };
    drawEllipse(x, y, 45, 22);
    drawEllipse(x + 35, y - 10, 35, 20);
    drawEllipse(x + 60, y + 2, 30, 18);
    drawEllipse(x - 25, y + 5, 28, 16);
    ctx.restore();
}

function drawMountains() {
    ctx.fillStyle = 'rgba(90, 140, 120, 0.25)';
    ctx.beginPath(); ctx.moveTo(50, 375); ctx.lineTo(180, 280); ctx.lineTo(310, 375); ctx.fill();
    ctx.beginPath(); ctx.moveTo(250, 375); ctx.lineTo(400, 250); ctx.lineTo(550, 375); ctx.fill();
    ctx.beginPath(); ctx.moveTo(500, 375); ctx.lineTo(650, 290); ctx.lineTo(800, 375); ctx.fill();
}

// ── 竞技台 ───────────────────────────────────────────────────
function drawBattlePlatform() {
    ctx.fillStyle = '#4e342e';
    ctx.beginPath();
    ctx.ellipse(W / 2, 400, 340, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(W / 2, 400, 340 - i * 80, 50 - i * 10, 0, 0, Math.PI);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(W / 2, 400, 340, 50, 0, 0, Math.PI * 2);
    ctx.stroke();
}

// ── 角色绘制 ─────────────────────────────────────────────────
function drawCharacter(isPlayer, centerX, charData) {
    const emoji = charData.emoji || (isPlayer ? '⚔️' : '🐉');
    const hp = charData.hp;
    const maxHp = charData.maxHp;
    const mp = charData.mp;
    const maxMp = charData.maxMp;
    const name = isPlayer ? charData.name + charData.emoji : charData.name;

    // 站立阴影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(centerX, 395, 55, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 背景光晕
    const glow = ctx.createRadialGradient(centerX, 310, 20, centerX, 310, 80);
    glow.addColorStop(0, isPlayer ? 'rgba(100, 180, 255, 0.2)' : 'rgba(255, 120, 120, 0.2)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, 310, 80, 0, Math.PI * 2);
    ctx.fill();

    // emoji
    ctx.font = '100px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, centerX, 350);

    // 名称
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(name, centerX, 190);

    // 等级
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('Lv.50', centerX, 210);

    // HP 条
    drawBar(centerX, 225, hp, maxHp, 'HP', [
        { ratio: 0.5, colors: ['#5cdb5c', '#2e7d32'] },
        { ratio: 0.25, colors: ['#ffb74d', '#e65100'] },
        { ratio: 0,    colors: ['#ef5350', '#b71c1c'] },
    ]);

    // MP 条
    drawBar(centerX, 248, mp, maxMp, 'MP', [
        { ratio: 0, colors: ['#42a5f5', '#1565c0'] },
    ]);
}

function drawBar(centerX, y, val, maxVal, label, colorStops) {
    const barW = 190;
    const barH = label === 'HP' ? 14 : 10;
    const barX = centerX - barW / 2;

    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.roundRect(barX, y, barW, barH, 6);
    ctx.fill();

    const ratio = Math.max(0, val / maxVal);
    const fillW = barW * ratio;
    if (fillW > 0) {
        const grad = ctx.createLinearGradient(barX, y, barX + barW, y);
        let applied = false;
        for (const stop of colorStops) {
            if (ratio > stop.ratio) {
                grad.addColorStop(0, stop.colors[0]);
                grad.addColorStop(1, stop.colors[1]);
                applied = true;
                break;
            }
        }
        if (!applied && colorStops.length > 0) {
            grad.addColorStop(0, colorStops[colorStops.length - 1].colors[0]);
            grad.addColorStop(1, colorStops[colorStops.length - 1].colors[1]);
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(barX, y, fillW, barH, 6);
        ctx.fill();
    }

    const hlGrad = ctx.createLinearGradient(0, y, 0, y + barH / 2);
    hlGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
    hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.roundRect(barX, y, barW, barH / 2, [6, 6, 0, 0]);
    ctx.fill();

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX, y, barW, barH, 6);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${label} ${val} / ${maxVal}`, centerX, y + (label === 'HP' ? 11 : 9));
}

// ── 暴击特效 ─────────────────────────────────────────────────
function drawCritEffect() {
    const cf = gameState.critFlash;
    if (!cf || cf.alpha <= 0) {
        gameState.critFlash = null;
        return;
    }

    ctx.save();
    ctx.globalAlpha = cf.alpha;
    ctx.translate(cf.x, cf.y);
    ctx.scale(cf.scale, cf.scale);

    // 文字阴影
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💥 暴击！', 2, 2);

    // 文字主体
    ctx.fillStyle = '#ff4444';
    ctx.fillText('💥 暴击！', 0, 0);

    ctx.restore();

    // 衰减动画
    cf.alpha -= 0.03;
    cf.scale += 0.02;
    cf.y -= 2;
}

// ── 回合指示器 ───────────────────────────────────────────────
function drawTurnIndicator() {
    const turnText = gameState.isPlayerTurn ? '⚔️ 你的回合' : '⏳ 电脑思考中...';
    ctx.fillStyle = gameState.isPlayerTurn ? '#2ecc71' : '#e67e22';
    ctx.font = 'bold 17px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(turnText, W / 2, 32);

    const arrowX = gameState.isPlayerTurn ? 200 : 600;
    const arrowY = 270;
    ctx.fillStyle = gameState.isPlayerTurn ? '#2ecc71' : '#e67e22';
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - 10, arrowY - 16);
    ctx.lineTo(arrowX + 10, arrowY - 16);
    ctx.closePath();
    ctx.fill();
}

// ── 游戏结束遮罩 ─────────────────────────────────────────────
function drawGameOverOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, W, H);

    const player = getPlayer();
    const winnerText = player.hp > 0 ? '🎉 英雄胜利！' : '💀 恶龙胜利';
    ctx.font = 'bold 44px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(winnerText, W / 2 + 2, H / 2 + 2);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(winnerText, W / 2, H / 2);

    ctx.fillStyle = '#ffeaa7';
    ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('点击「重置」开始新战斗', W / 2, H / 2 + 50);
    ctx.textBaseline = 'alphabetic';
}

// ============================================================
//  事件绑定
// ============================================================
classBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => switchClass(i));
});
skillBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => playerAction(i));
});
resetBtn.addEventListener('click', resetGame);

// ============================================================
//  初始化
// ============================================================
resetGame();