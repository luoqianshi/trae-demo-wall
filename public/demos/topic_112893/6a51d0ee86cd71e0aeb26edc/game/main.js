// ===================================================================
// main.js - 游戏入口
// 获取 Canvas 与 UI 元素，实例化引擎并启动主循环
// ===================================================================

import { Game } from './engine.js';

// 等待 DOM 就绪
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game');

    // 收集所有 UI 元素引用
    const ui = {
        // 菜单
        overlayMenu: document.getElementById('overlay-menu'),
        diffBtns: document.querySelectorAll('.diff-btn'),
        btnStart: document.getElementById('btn-start'),

        // Boss 警告
        overlayWarning: document.getElementById('overlay-warning'),
        warningBossName: document.getElementById('warning-boss-name'),

        // 通关 / 暂停 / 失败 / 胜利
        overlayClear: document.getElementById('overlay-clear'),
        clearSub: document.getElementById('clear-sub'),
        overlayPause: document.getElementById('overlay-pause'),
        overlayOver: document.getElementById('overlay-over'),
        overScore: document.getElementById('over-score'),
        overRecord: document.getElementById('over-record'),
        btnRetry: document.getElementById('btn-retry'),
        overlayVictory: document.getElementById('overlay-victory'),
        vicScore: document.getElementById('vic-score'),
        vicRecord: document.getElementById('vic-record'),
        btnVictory: document.getElementById('btn-victory'),

        // Boss 血条
        bossHp: document.getElementById('boss-hp'),
        bossName: document.getElementById('boss-name'),
        bossFill: document.getElementById('boss-fill'),

        // 左侧 HUD
        level: document.getElementById('hud-level'),
        score: document.getElementById('hud-score'),
        high: document.getElementById('hud-high'),
        weapon: document.getElementById('hud-weapon'),
        killFill: document.getElementById('hud-kill-fill'),
        killText: document.getElementById('hud-kill-text'),

        // 右侧 HUD
        hpFill: document.getElementById('hud-hp-fill'),
        hpText: document.getElementById('hud-hp-text'),
        diff: document.getElementById('hud-diff'),
    };

    const game = new Game(canvas, ui);
    game.showMenu();

    // 启动主循环
    requestAnimationFrame(game.loop);
});
