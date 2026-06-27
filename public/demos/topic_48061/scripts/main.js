/**
 * main.js · 应用入口
 * - 初始化主题
 * - 初始化路由
 * - 启动提醒调度
 * - 绑定 sidebar 导航
 * - 绑定 topbar 主题切换按钮
 */
import { initRouter } from './router.js';
import { state } from './state.js';
import { scheduleReminder } from './notifications.js';
import { initTheme, getTheme, setTheme, measureSegLabels } from './theme.js';
import { $, $$ } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // sidebar 点击 → 切换 hash
    $$('.nav-item').forEach(n => {
        n.addEventListener('click', () => {
            const tab = n.dataset.tab;
            if (tab) location.hash = `#${tab}`;
        });
    });

    initRouter();

    // 启动提醒（如已开启）
    if (state.settings.remindOn && state.settings.remindTime) {
        scheduleReminder(state.settings.remindTime);
    }

    // topbar 主题切换分段控件
    const seg = $('#themeSeg');
    const segBtns = seg ? $$('.theme-seg-btn', seg) : [];
    function syncSeg() {
        const t = getTheme();
        segBtns.forEach(b => b.classList.toggle('is-on', b.dataset.theme === t));
    }
    syncSeg();
    window.addEventListener('themechange', syncSeg);
    segBtns.forEach(b => b.addEventListener('click', () => setTheme(b.dataset.theme)));

    // 测量每段 label 真实宽度 → 写入 --label-w；窗口尺寸/字号变化时重测
    measureSegLabels(seg);
    let resizeRaf = 0;
    window.addEventListener('resize', () => {
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => measureSegLabels(seg));
    });
});

