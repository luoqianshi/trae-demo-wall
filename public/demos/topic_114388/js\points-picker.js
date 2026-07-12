// points-picker.js - 重点选取器弹窗
// 弹窗 UI：左侧"推荐/提取"来源、右侧可勾选列表 + 全选/全不选/搜索

import { escapeHTML } from './utils.js';

let modal = null;
let state = {
    candidates: [],   // {point, source, confidence, selected}
    onConfirm: null
};

/**
 * 创建/获取弹窗 DOM
 */
function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'pointsPickerModal';
    modal.className = 'picker-modal';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="picker-backdrop"></div>
        <div class="picker-panel" role="dialog" aria-labelledby="pickerTitle" aria-modal="true">
            <div class="picker-header">
                <h3 id="pickerTitle" class="picker-title">📋 选择重点</h3>
                <div class="picker-stats" id="pickerStats">0 / 0</div>
                <button class="picker-close" id="pickerClose" aria-label="关闭">✕</button>
            </div>
            <div class="picker-toolbar">
                <input type="search" id="pickerSearch" placeholder="搜索重点..." />
                <button class="picker-mini" id="pickerAll">全选</button>
                <button class="picker-mini" id="pickerNone">全不选</button>
                <button class="picker-mini" id="pickerInvert">反选</button>
            </div>
            <div class="picker-source" id="pickerSource">来源：</div>
            <div class="picker-list" id="pickerList" role="listbox" aria-multiselectable="true"></div>
            <div class="picker-footer">
                <span class="picker-hint">💡 提示：勾选要加入此科目的重点，按"确认导入"完成</span>
                <div class="picker-actions">
                    <button class="btn picker-cancel" id="pickerCancel">取消</button>
                    <button class="btn btn-primary picker-confirm" id="pickerConfirm">✅ 确认导入</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    bindEvents();
    return modal;
}

function bindEvents() {
    modal.querySelector('.picker-backdrop').addEventListener('click', close);
    modal.querySelector('#pickerClose').addEventListener('click', close);
    modal.querySelector('#pickerCancel').addEventListener('click', close);
    modal.querySelector('#pickerAll').addEventListener('click', () => bulkSet(true));
    modal.querySelector('#pickerNone').addEventListener('click', () => bulkSet(false));
    modal.querySelector('#pickerInvert').addEventListener('click', () => {
        state.candidates.forEach(c => c.selected = !c.selected);
        render();
    });
    modal.querySelector('#pickerSearch').addEventListener('input', e => {
        renderList(e.target.value.trim().toLowerCase());
    });
    modal.querySelector('#pickerConfirm').addEventListener('click', confirm);
    document.addEventListener('keydown', e => {
        if (modal.hidden) return;
        if (e.key === 'Escape') close();
    });
}

function bulkSet(val) {
    const keyword = modal.querySelector('#pickerSearch').value.trim().toLowerCase();
    state.candidates.forEach(c => {
        if (!keyword || c.point.toLowerCase().includes(keyword)) c.selected = val;
    });
    render();
}

function renderList(keyword = '') {
    const list = modal.querySelector('#pickerList');
    const filtered = keyword
        ? state.candidates.filter(c => c.point.toLowerCase().includes(keyword))
        : state.candidates;
    if (filtered.length === 0) {
        list.innerHTML = `<div class="picker-empty">没有匹配的重点</div>`;
    } else {
        list.innerHTML = filtered.map((c, idx) => {
            const conf = Math.round(c.confidence * 100);
            const confColor = c.confidence >= 0.85 ? '#10b981' : c.confidence >= 0.7 ? '#f59e0b' : '#94a3b8';
            return `
                <label class="picker-item ${c.selected ? 'selected' : ''}" data-idx="${state.candidates.indexOf(c)}">
                    <input type="checkbox" ${c.selected ? 'checked' : ''}>
                    <span class="picker-item-text">${escapeHTML(c.point)}</span>
                    <span class="picker-item-meta">
                        <span class="picker-source-tag" title="来源">${escapeHTML(c.source)}</span>
                        <span class="picker-conf" style="color:${confColor}" title="置信度 ${conf}%">${conf}%</span>
                    </span>
                </label>
            `;
        }).join('');
        // 绑定点击行切换选中
        list.querySelectorAll('.picker-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.tagName === 'INPUT') return;
                const cb = item.querySelector('input');
                cb.checked = !cb.checked;
                const idx = parseInt(item.dataset.idx, 10);
                state.candidates[idx].selected = cb.checked;
                item.classList.toggle('selected', cb.checked);
                updateStats();
            });
            item.querySelector('input').addEventListener('change', e => {
                const idx = parseInt(item.dataset.idx, 10);
                state.candidates[idx].selected = e.target.checked;
                item.classList.toggle('selected', e.target.checked);
                updateStats();
            });
        });
    }
    updateStats();
}

function updateStats() {
    const sel = state.candidates.filter(c => c.selected).length;
    const total = state.candidates.length;
    modal.querySelector('#pickerStats').textContent = `${sel} / ${total}`;
}

function render() {
    const source = state.candidates.length > 0 ? state.candidates[0].source : '未知';
    const sources = [...new Set(state.candidates.map(c => c.source))];
    modal.querySelector('#pickerSource').innerHTML =
        `<strong>来源：</strong>${sources.map(s => `<span class="picker-source-tag">${escapeHTML(s)}</span>`).join(' ')}`;
    modal.querySelector('#pickerSearch').value = '';
    renderList();
}

function close() {
    modal.hidden = true;
    state = { candidates: [], onConfirm: null };
}

function confirm() {
    const selected = state.candidates.filter(c => c.selected).map(c => c.point);
    if (selected.length === 0) {
        alert('请至少勾选一个重点');
        return;
    }
    if (typeof state.onConfirm === 'function') {
        state.onConfirm(selected);
    }
    close();
}

/**
 * 打开重点选取器
 * @param {Array<{point, source, confidence}>} candidates
 * @param {Function} onConfirm 回调，参数为已勾选的 point 字符串数组
 */
export function openPicker(candidates, onConfirm) {
    if (!candidates || candidates.length === 0) return;
    ensureModal();
    state = {
        candidates: candidates.map(c => ({ ...c, selected: true })),
        onConfirm
    };
    modal.hidden = false;
    render();
    // 焦点到搜索框
    setTimeout(() => modal.querySelector('#pickerSearch').focus(), 50);
}
