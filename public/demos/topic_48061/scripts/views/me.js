/**
 * views/me.js · 我的 Tab
 * 个人 hero / 提醒 / 卡池偏好 / 外观主题 / 数据管理 / 关于
 */
import { state, saveState, resetState, reloadState, defaultState } from '../state.js';
import { CARD_POOL, TAG_LABEL, TAG_EMOJI } from '../../data/cards.js';
import { toast } from '../ui.js';
import { syncTopMeta } from '../router.js';
import { requestNotificationPermission, scheduleReminder, cancelReminder } from '../notifications.js';
import { getTheme, setTheme, themeLabel } from '../theme.js';
import { $, $$, el, daysSince } from '../utils.js';

const TAG_ORDER = ['sit', 'eye', 'neck', 'back', 'meeting', 'stress', 'mood', 'sleepy', 'brain', 'hungry'];

export function mountMe() {
    renderHero();
    bindRemind();
    bindPool();
    bindTheme();
    bindData();
    renderAbout();
}

/* ----- Hero ----- */
function renderHero() {
    const set = (id, v) => { const n = $(id); if (n) n.textContent = v; };
    const got = Object.keys(state.library).filter(k => state.library[k] > 0).length;
    set('#meHp', state.hpTotal);
    set('#meStreak', state.streak);
    set('#meCards', state.history.length);
    set('#meCollect', `${got}/${CARD_POOL.length}`);
    set('#meSub', `已陪伴你 ${daysSince(state.installDate)} 天`);
    const $av = $('#meAvatar');
    if ($av) {
        const hp = state.hpTotal;
        $av.textContent = hp < 50 ? '🌱' : hp < 200 ? '🌿' : hp < 500 ? '🌳' : '🌳✨';
    }
}

/* ----- 提醒 ----- */
function bindRemind() {
    const sw = $('#meRemindOn');
    const tm = $('#meRemindTime');
    if (sw) {
        sw.checked = !!state.settings.remindOn;
        sw.onchange = async () => {
            if (sw.checked) {
                const ok = await requestNotificationPermission();
                if (!ok) {
                    sw.checked = false;
                    toast('未获得通知权限', 'error');
                    return;
                }
                state.settings.remindOn = true;
                scheduleReminder(state.settings.remindTime);
                toast(`已开启，每日 ${state.settings.remindTime} 提醒`, 'success');
            } else {
                state.settings.remindOn = false;
                cancelReminder();
                toast('已关闭提醒');
            }
            saveState(state);
        };
    }
    if (tm) {
        tm.value = state.settings.remindTime || '14:30';
        tm.onchange = () => {
            state.settings.remindTime = tm.value || '14:30';
            saveState(state);
            if (state.settings.remindOn) {
                scheduleReminder(state.settings.remindTime);
                toast(`已更新提醒时间：${state.settings.remindTime}`, 'success');
            }
        };
    }
}

/* ----- 卡池偏好 ----- */
function bindPool() {
    const hourSw = $('#meHourLimit');
    if (hourSw) {
        hourSw.checked = !!state.settings.hourLimit;
        hourSw.onchange = () => {
            state.settings.hourLimit = hourSw.checked;
            saveState(state);
            toast(hourSw.checked ? '已开启饭点限定' : '已关闭饭点限定（饭点卡随时出现）', 'success');
        };
    }
    const host = $('#meTagChips');
    const totalN = $('#meTagAllN');
    if (totalN) totalN.textContent = String(TAG_ORDER.length);
    if (host) {
        host.innerHTML = '';
        TAG_ORDER.forEach(tag => {
            const disabled = state.settings.disabledTags?.includes(tag);
            const chip = el('button', {
                class: `chip ${disabled ? '' : 'is-on'}`,
                title: disabled ? '点击恢复（重新加入卡池）' : '点击禁用（从卡池排除）',
                onClick: () => {
                    const arr = state.settings.disabledTags || (state.settings.disabledTags = []);
                    const i = arr.indexOf(tag);
                    if (i >= 0) arr.splice(i, 1);
                    else arr.push(tag);
                    saveState(state);
                    bindPool();
                },
            }, [
                el('span', { class: 'chip-emoji' }, TAG_EMOJI[tag] || ''),
                TAG_LABEL[tag],
            ]);
            host.appendChild(chip);
        });
    }
}

/* ----- 外观主题 ----- */
function bindTheme() {
    const row = $('#meThemeRow');
    if (!row) return;
    const chips = $$('.theme-chip', row);

    function sync() {
        const cur = getTheme();
        chips.forEach(c => c.classList.toggle('is-on', c.dataset.theme === cur));
    }
    sync();

    chips.forEach(c => {
        c.addEventListener('click', () => {
            const t = c.dataset.theme;
            setTheme(t);
            toast(`已切换主题：${themeLabel(t)}`, 'success');
        });
    });

    // 监听外部 topbar 圆形按钮触发的切换，保持高亮同步
    window.addEventListener('themechange', sync);
}

/* ----- 数据管理 ----- */
function bindData() {
    const $exp = $('#meExportBtn');
    const $imp = $('#meImportBtn');
    const $impFile = $('#meImportFile');
    const $rst = $('#meResetBtn');

    if ($exp) $exp.onclick = () => {
        try {
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `heal-card-backup-${state.today.date}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast('已导出 JSON 备份', 'success');
        } catch (err) {
            toast('导出失败', 'error');
        }
    };

    if ($imp && $impFile) {
        $imp.onclick = () => $impFile.click();
        $impFile.onchange = (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const data = JSON.parse(String(reader.result));
                    if (typeof data !== 'object' || !data) throw new Error('invalid');
                    // 覆盖式：直接写入存储然后 reload
                    const merged = Object.assign(defaultState(), data);
                    merged.settings = Object.assign(defaultState().settings, data.settings || {});
                    localStorage.setItem('heal-app-state-v1', JSON.stringify(merged));
                    reloadState();
                    mountMe();
                    syncTopMeta();
                    toast('已导入并覆盖当前数据', 'success');
                } catch (err) {
                    toast('导入失败：JSON 格式不正确', 'error');
                } finally {
                    $impFile.value = '';
                }
            };
            reader.readAsText(f);
        };
    }

    if ($rst) $rst.onclick = () => {
        if (!confirm('确定要清空所有数据吗？\n（HP / 连签 / 图鉴 / 历史 / 设置都会重置，且无法恢复）')) return;
        resetState();
        reloadState();
        cancelReminder();
        mountMe();
        syncTopMeta();
        toast('已重置所有数据', 'success');
    };
}

/* ----- 关于 ----- */
function renderAbout() {
    const $about = $('#meAbout');
    if (!$about) return;
    $about.innerHTML = '';
    const meta = [
        ['应用名', 'HEAL CARD · 工位回血'],
        ['版本', 'v1.0.0'],
        ['卡池', `${CARD_POOL.length} 张（N 14 · R 8 · SR 4 · SSR 2）`],
        ['模块', '今日 / 图鉴 / 历史 / 我的'],
        ['存储', 'localStorage（本地）'],
        ['首启', state.installDate || '今日'],
    ];
    const grid = el('div', { class: 'about-meta' });
    meta.forEach(([k, v]) => {
        grid.appendChild(el('div', { class: 'k' }, k));
        grid.appendChild(el('div', { class: 'v' }, String(v)));
    });
    $about.appendChild(grid);
    $about.appendChild(el('p', { class: 'text-dim', style: { marginTop: '16px', fontSize: '12px' } },
        '致谢：所有愿意在工位上「动一下」的你 ❤️'));
}
