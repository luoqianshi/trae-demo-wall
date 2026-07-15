// =========================================
// Coding Land - 公共工具库
// =========================================

const CL_Common = (function() {

    const STORAGE_PREFIX = 'coding_land_';

    function setStorage(name, value) {
        try {
            localStorage.setItem(STORAGE_PREFIX + name, value);
        } catch (e) {
            console.warn('[CL_Common] localStorage 设置失败:', e);
        }
    }

    function getStorage(name) {
        try {
            return localStorage.getItem(STORAGE_PREFIX + name) || '';
        } catch (e) {
            console.warn('[CL_Common] localStorage 获取失败:', e);
            return '';
        }
    }

    function removeStorage(name) {
        try {
            localStorage.removeItem(STORAGE_PREFIX + name);
        } catch (e) {
            console.warn('[CL_Common] localStorage 删除失败:', e);
        }
    }

    // ===== 进度相关 =====
    function getCompletedLessons(courseKey) {
        const raw = getStorage(courseKey + '_progress');
        if (!raw) return [];
        return raw.split(',').filter(n => n).map(Number);
    }

    function markLessonComplete(courseKey, lessonNum) {
        const completed = getCompletedLessons(courseKey);
        if (!completed.includes(lessonNum)) {
            completed.push(lessonNum);
            setStorage(courseKey + '_progress', completed.join(','));
            
            if (window.CL_Game) {
                const isPractice = courseKey.includes('practice');
                
                if (isPractice) {
                    CL_Game.completePractice();
                    showRewardModal([
                        { name: '升级剑', icon: '⚔️', color: '#ff4444', action: 'upgrade_sword' },
                        { name: '升级盾', icon: '🛡️', color: '#4488ff', action: 'upgrade_shield' },
                        { name: '5金币', icon: '💰', color: '#ffd700', action: 'add_coins' },
                        { name: '恢复3心', icon: '❤️', color: '#ff6b6b', action: 'add_hearts' }
                    ], 2, (action) => {
                        switch(action) {
                            case 'upgrade_sword': CL_Game.upgradeSword(); break;
                            case 'upgrade_shield': CL_Game.upgradeShield(); break;
                            case 'add_coins': CL_Game.addCoins(5); break;
                            case 'add_hearts': CL_Game.addHearts(3); break;
                        }
                    });
                } else if (courseKey === 'web') {
                    CL_Game.completeLesson();
                    showRewardModal([
                        { name: '升级剑', icon: '⚔️', color: '#ff4444', action: 'upgrade_sword' },
                        { name: '升级盾', icon: '🛡️', color: '#4488ff', action: 'upgrade_shield' },
                        { name: '5金币', icon: '💰', color: '#ffd700', action: 'add_coins' }
                    ], 1, (action) => {
                        switch(action) {
                            case 'upgrade_sword': CL_Game.upgradeSword(); break;
                            case 'upgrade_shield': CL_Game.upgradeShield(); break;
                            case 'add_coins': CL_Game.addCoins(5); break;
                        }
                    });
                }
            }
        }
    }

    // ===== 游戏奖励系统 =====
    function showRewardModal(options, count, onSelect) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            font-family: system-ui, sans-serif;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ffd700; border-radius: 20px;
            padding: 30px; max-width: 400px;
            text-align: center; box-shadow: 0 0 40px rgba(255,215,0,0.3);
        `;

        const title = document.createElement('h2');
        title.style.cssText = `
            color: #ffd700; margin-bottom: 10px; font-size: 24px;
            text-shadow: 0 0 10px rgba(255,215,0,0.5);
        `;
        title.textContent = count === 1 ? '🎉 完成课程！获得奖励' : '🎉 完成实战！获得奖励';

        const subtitle = document.createElement('p');
        subtitle.style.cssText = 'color: #a0a0b0; margin-bottom: 20px;';
        subtitle.textContent = count === 1 ? '选择一项奖励：' : '选择两项奖励：';

        const selected = [];
        const buttons = options.map((opt, idx) => {
            const btn = document.createElement('button');
            btn.style.cssText = `
                display: block; width: 100%; padding: 14px 20px;
                margin: 8px 0; border: 2px solid rgba(255,255,255,0.2);
                border-radius: 12px; background: rgba(255,255,255,0.05);
                color: #fff; font-size: 16px; cursor: pointer;
                transition: all 0.2s; text-align: left;
            `;
            btn.innerHTML = `<span style="color: ${opt.color}">${opt.icon}</span> ${opt.name}`;
            btn.onclick = () => {
                if (selected.includes(idx)) {
                    selected.splice(selected.indexOf(idx), 1);
                    btn.style.borderColor = 'rgba(255,255,255,0.2)';
                    btn.style.background = 'rgba(255,255,255,0.05)';
                } else if (selected.length < count) {
                    selected.push(idx);
                    btn.style.borderColor = '#ffd700';
                    btn.style.background = 'rgba(255,215,0,0.2)';
                }
                confirmBtn.disabled = selected.length < count;
            };
            return btn;
        });

        const confirmBtn = document.createElement('button');
        confirmBtn.style.cssText = `
            margin-top: 20px; padding: 12px 40px;
            background: linear-gradient(135deg, #ffd700, #ff8c00);
            border: none; border-radius: 30px; color: #000;
            font-size: 18px; font-weight: bold; cursor: pointer;
            transition: transform 0.2s;
        `;
        confirmBtn.textContent = '确认';
        confirmBtn.disabled = selected.length < count;
        confirmBtn.onclick = () => {
            selected.forEach(idx => onSelect(options[idx].action));
            modal.remove();
        };

        panel.appendChild(title);
        panel.appendChild(subtitle);
        buttons.forEach(b => panel.appendChild(b));
        panel.appendChild(confirmBtn);
        modal.appendChild(panel);
        document.body.appendChild(modal);
    }

    function completeLessonWithReward(courseKey, lessonNum) {
        markLessonComplete(courseKey, lessonNum);

        if (window.CL_Game) {
            CL_Game.completeLesson();
            showRewardModal([
                { name: '升级剑', icon: '⚔️', color: '#ff4444', action: 'upgrade_sword' },
                { name: '升级盾', icon: '🛡️', color: '#4488ff', action: 'upgrade_shield' },
                { name: '5金币', icon: '💰', color: '#ffd700', action: 'add_coins' }
            ], 1, (action) => {
                switch(action) {
                    case 'upgrade_sword': CL_Game.upgradeSword(); break;
                    case 'upgrade_shield': CL_Game.upgradeShield(); break;
                    case 'add_coins': CL_Game.addCoins(5); break;
                }
            });
        }
    }

    function completePracticeWithReward() {
        if (window.CL_Game) {
            CL_Game.completePractice();
            showRewardModal([
                { name: '升级剑', icon: '⚔️', color: '#ff4444', action: 'upgrade_sword' },
                { name: '升级盾', icon: '🛡️', color: '#4488ff', action: 'upgrade_shield' },
                { name: '5金币', icon: '💰', color: '#ffd700', action: 'add_coins' },
                { name: '恢复3心', icon: '❤️', color: '#ff6b6b', action: 'add_hearts' }
            ], 2, (action) => {
                switch(action) {
                    case 'upgrade_sword': CL_Game.upgradeSword(); break;
                    case 'upgrade_shield': CL_Game.upgradeShield(); break;
                    case 'add_coins': CL_Game.addCoins(5); break;
                    case 'add_hearts': CL_Game.addHearts(3); break;
                }
            });
        }
    }

    function clearAllProgress() {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith(STORAGE_PREFIX)) {
                localStorage.removeItem(key);
            }
        }
    }

    // ===== 课程配置加载 =====
    // 缓存，避免重复fetch
    const lessonCache = {};

    // courseKey → 全局变量名映射（兼容 web / cpp / python 三类课程）
    // 各课程目录下的 lessons.js 会向 window 暴露对应数组，本地预览（file://）可用
    const GLOBAL_KEY_MAP = {
        web: 'WEB_LESSONS',
        web_lesson: 'WEB_LESSONS',
        web_practice: 'WEB_PRACTICES',
        web_total_practice: 'WEB_TOTAL_PRACTICES',
        cpp: 'CPP_LESSONS',
        python: 'PYTHON_LESSONS'
    };

    function parseConfig(text) {
        return text.trim().split('\n')
            .filter(line => line.trim())
            .map(line => {
                const idx = line.indexOf(' ');
                if (idx === -1) return { title: line.trim(), desc: '' };
                return { title: line.substring(0, idx).trim(), desc: line.substring(idx + 1).trim() };
            });
    }

    async function loadLessons(courseKey, configPath) {
        if (lessonCache[courseKey]) return lessonCache[courseKey];

        // 1) 优先从全局变量读取（lessons.js 注入，本地预览可用）
        const globalName = GLOBAL_KEY_MAP[courseKey];
        if (globalName && window[globalName] && Array.isArray(window[globalName]) && window[globalName].length > 0) {
            lessonCache[courseKey] = window[globalName];
            return window[globalName];
        }

        // 2) 回退到 fetch lessons.js（兼容旧方案，需 http(s) 协议）
        try {
            const resp = await fetch(configPath);
            if (resp.ok) {
                const text = await resp.text();
                const parsed = parseConfig(text);
                if (parsed.length > 0) {
                    lessonCache[courseKey] = parsed;
                    return parsed;
                }
            }
        } catch (e) {
            console.log(`[CL_Common] config加载失败: ${configPath}`);
        }

        lessonCache[courseKey] = [];
        return [];
    }

    // ===== 跳级解锁 =====
    // 将从 1 到 targetNum 的所有课程标记为已完成（用于「跳级至此」按钮）
    function unlockUntil(courseKey, targetNum) {
        const completed = getCompletedLessons(courseKey);
        for (let i = 1; i <= targetNum; i++) {
            if (!completed.includes(i)) completed.push(i);
        }
        setStorage(courseKey + '_progress', completed.join(','));
    }

    // ===== 进度跳转 =====
    async function getNextLesson(courseKey, configPath) {
        const lessons = await loadLessons(courseKey, configPath);
        const completed = getCompletedLessons(courseKey);
        const total = lessons.length;

        if (completed.length === 0) return { next: 1, total, lessons, completed };

        let next = total + 1;
        for (let i = 1; i <= total; i++) {
            if (!completed.includes(i)) {
                next = i;
                break;
            }
        }

        return { next, total, lessons, completed };
    }

    // ===== 预览运行 =====
    function runPreview(code, iframeEl) {
        const trimmed = code.trim();
        const isFullDoc = /^<!doctype/i.test(trimmed) || /^<html/i.test(trimmed);

        let htmlDoc;
        if (isFullDoc) {
            htmlDoc = code;
        } else {
            htmlDoc = '<!DOCTYPE html>\n' +
                '<html>\n' +
                '<head>\n' +
                '<meta charset="UTF-8">\n' +
                '<style>\n' +
                '    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }\n' +
                '    * { box-sizing: border-box; }\n' +
                '</style>\n' +
                '</head>\n' +
                '<body>\n' +
                code +
                '\n</body>\n' +
                '</html>';
        }

        iframeEl.srcdoc = htmlDoc;

        return [];
    }

    // ===== 导出 =====
    return {
        // storage
        setStorage, getStorage, removeStorage,
        // 进度
        getCompletedLessons, markLessonComplete, clearAllProgress, unlockUntil,
        // 课程
        loadLessons, parseConfig,
        // 跳转
        getNextLesson,
        // 预览
        runPreview,
        // 游戏奖励
        completeLessonWithReward, completePracticeWithReward,
        // 常量
        STORAGE_PREFIX
    };
})();

const currentPath = window.location.pathname;
const isLessonOrEditor = 
    (currentPath.includes('/lesson/web/') || 
     currentPath.includes('/lesson/cpp/') || 
     currentPath.includes('/lesson/python/')) &&
    !currentPath.endsWith('index.html');

if (isLessonOrEditor) {
    window.addEventListener('beforeunload', function(e) {
        e.preventDefault();
        e.returnValue = '是否离开？你所做的更改可能未保存。';
        return e.returnValue;
    });
}
