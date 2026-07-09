import Storage from './storage.js';
import { PATTERNS } from './recognizer.js';
import { ROTATION_PATTERNS } from './rotationDetector.js';

// ===== SVG ICONS =====
const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.17 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.17 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  music: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  message: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  finger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`,
  // Rhythm icons (replacing emoji)
  tapSingle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2v6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2z"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>`,
  tapDouble: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2a2 2 0 0 1 2 2v6h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V4a2 2 0 0 1 2-2z"/><path d="M18 2a2 2 0 0 1 2 2v6h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V4a2 2 0 0 1 2-2z" opacity="0.5"/></svg>`,
  tapTriple: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2a2 2 0 0 1 2 2v6h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V4a2 2 0 0 1 2-2z"/><path d="M13 2a2 2 0 0 1 2 2v6h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V4a2 2 0 0 1 2-2z" opacity="0.6"/><path d="M20 2a2 2 0 0 1 2 2v6h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V4a2 2 0 0 1 2-2z" opacity="0.3"/></svg>`,
  longShort: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="8" height="12" rx="1"/><path d="M16 2a2 2 0 0 1 2 2v6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2z"/></svg>`,
  doubleLong: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="8" height="14" rx="1"/><rect x="14" y="6" width="8" height="14" rx="1"/></svg>`,
  // Onboarding icons
  onboardingFinger: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M32 8v20h8a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4h8V12a4 4 0 0 1 4-4z"/><circle cx="32" cy="52" r="2" fill="currentColor"/></svg>`,
  onboardingPhone: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="4" width="32" height="56" rx="6"/><line x1="24" y1="12" x2="40" y2="12"/><circle cx="32" cy="52" r="3"/></svg>`,
  onboardingTarget: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="28"/><circle cx="32" cy="32" r="16"/><circle cx="32" cy="32" r="6" fill="currentColor"/></svg>`,
  // Avatar
  avatar: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="24" r="12"/><path d="M12 56c0-11 9-20 20-20h0c11 0 20 9 20 20"/></svg>`,
  // Empty state
  emptyTap: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 4v16h4a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4h4V8a4 4 0 0 1 4-4z"/><circle cx="24" cy="42" r="1.5" fill="currentColor"/></svg>`,
  // Rotation icons
  rotateCW: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>`,
  rotateCCW: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 6.219-8.56"/><polyline points="3 3 3 9 9 9"/></svg>`,
  skipForward: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>`,
  skipBack: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>`,
  fastForward: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 19 9 12 13 5"/><polygon points="19 19 15 12 19 5"/><line x1="3" y1="19" x2="3" y2="5"/></svg>`,
  rewind: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 19 15 12 11 5"/><polygon points="5 19 9 12 5 5"/><line x1="21" y1="19" x2="21" y2="5"/></svg>`,
  volumeUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  volumeDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  rotate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M2.5 11.5a10 10 0 0 1 18.8-4.3M21.5 12.5a10 10 0 0 1-18.8 4.2"/></svg>`,
  rotateRing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10" stroke-dasharray="4 4"/><polyline points="20 6 22 12 16 10"/></svg>`
};

function formatTime(ms) {
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  return new Date(ms).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatSaved(s) {
  if (s < 60) return `${s} 秒`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (rs === 0) return `${m} 分钟`;
  return `${m} 分 ${rs} 秒`;
}

// ===== RENDER FUNCTIONS =====

export function renderHome(data, tapCount) {
  const d = Storage.getData();
  const history = d.history.slice(0, 5);

  return `
    <div class="status-bar">
      <div class="status-dot ${data.isListening ? '' : 'inactive'}"></div>
      <span class="status-text">${data.isListening ? '敲击检测中' : '检测已暂停'}</span>
      <span class="status-sub">${tapCount > 0 ? `已检测到 ${tapCount} 次敲击` : '等待敲击...'}</span>
    </div>

    <div class="wave-container">
      <canvas id="waveCanvas"></canvas>
      <div class="wave-overlay">
        <div class="tap-hint">敲击手机背面查看波形</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">${d.stats.todayTaps}</div>
        <div class="stat-label">今日敲击</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${formatSaved(d.stats.totalSaved)}</div>
        <div class="stat-label">累计节省时间</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">最近操作</div>
      <div class="history-list">
        ${history.length === 0 ? `
          <div class="empty-state">
            <div style="width: 48px; height: 48px; margin: 0 auto 8px; color: var(--text-tertiary);">${ICONS.emptyTap}</div>
            <div>暂无操作记录</div>
            <div style="font-size: 13px; margin-top: 4px;">敲击手机开始体验</div>
          </div>
        ` : history.map(h => `
          <div class="history-item">
            <div class="history-icon">${ICONS[getIconForAction(h.action)]}</div>
            <div class="history-info">
              <div class="history-action">${h.action}</div>
              <div class="history-time">${formatTime(h.timestamp)} · ${h.pattern}</div>
            </div>
            <div class="history-saved">+${h.savedSeconds}s</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="virtual-tap-panel">
      <button class="vtap-btn" data-sim="single"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;">${ICONS.tapSingle}</span>模拟单击</span></button>
      <button class="vtap-btn" data-sim="double"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;">${ICONS.tapDouble}</span>模拟双击</span></button>
      <button class="vtap-btn" data-sim="triple"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;">${ICONS.tapTriple}</span>模拟三连击</span></button>
      <button class="vtap-btn" data-sim="longShort"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;">${ICONS.longShort}</span>模拟长短</span></button>
    </div>

    <div class="card" style="margin-top: 16px;">
      <div class="card-title">旋转模拟</div>
      <div class="virtual-tap-panel" style="margin-top:0;">
        <button class="vtap-btn" data-rot="cw" style="border-color: rgba(52,199,89,0.3);"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;color:#30d158;">${ICONS.rotateCW}</span>顺时针</span></button>
        <button class="vtap-btn" data-rot="ccw" style="border-color: rgba(0,122,255,0.3);"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;color:#0a84ff;">${ICONS.rotateCCW}</span>逆时针</span></button>
        <button class="vtap-btn" data-rot="cw1" style="border-color: rgba(52,199,89,0.3);"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;color:#30d158;">${ICONS.rotateCW}</span>顺转 1 圈</span></button>
        <button class="vtap-btn" data-rot="ccw1" style="border-color: rgba(0,122,255,0.3);"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;color:#0a84ff;">${ICONS.rotateCCW}</span>逆转 1 圈</span></button>
      </div>
    </div>
  `;
}

export function renderCommands() {
  const tapItems = [
    { key: 'single', rhythm: ICONS.tapSingle, name: '单击', desc: '播放/暂停音乐', saved: '8秒', type: 'tap' },
    { key: 'double', rhythm: ICONS.tapDouble, name: '双击', desc: '接听/挂断来电', saved: '10秒', type: 'tap' },
    { key: 'triple', rhythm: ICONS.tapTriple, name: '三连击', desc: '拒接来电 + 发送短信', saved: '15秒', type: 'tap' },
    { key: 'longShort', rhythm: ICONS.longShort, name: '长短', desc: '发送定位给紧急联系人', saved: '20秒', type: 'tap' },
    { key: 'doubleLong', rhythm: ICONS.doubleLong, name: '双长', desc: '触发预设快捷指令', saved: '12秒', type: 'tap' }
  ];

  const rotItems = [
    { key: 'cw', rhythm: ICONS.rotateCW, name: '顺时针', desc: '下一首 / 音量增加', saved: '5秒', color: '#30d158' },
    { key: 'ccw', rhythm: ICONS.rotateCCW, name: '逆时针', desc: '上一首 / 音量减少', saved: '5秒', color: '#0a84ff' },
    { key: 'cw1', rhythm: ICONS.fastForward, name: '顺转 1 圈', desc: '快进 15 秒', saved: '10秒', color: '#30d158' },
    { key: 'cw2', rhythm: ICONS.fastForward, name: '顺转 2 圈', desc: '快进 60 秒', saved: '15秒', color: '#30d158' },
    { key: 'ccw1', rhythm: ICONS.rewind, name: '逆转 1 圈', desc: '后退 15 秒', saved: '10秒', color: '#0a84ff' },
    { key: 'ccwHalf', rhythm: ICONS.skipBack, name: '逆转半圈', desc: '暂停播放', saved: '8秒', color: '#0a84ff' }
  ];

  return `
    <div class="card">
      <div class="card-title">敲击指令</div>
      <div class="command-list">
        ${tapItems.map(item => `
          <div class="command-item">
            <div class="command-rhythm">${item.rhythm}</div>
            <div class="command-info">
              <div class="command-name">${item.name}</div>
              <div class="command-desc">${item.desc} · 节省 ${item.saved}</div>
            </div>
            <button class="command-action" data-exec="${item.key}" data-type="${item.type}">执行</button>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-title">旋转指令</div>
      <div class="command-list">
        ${rotItems.map(item => `
          <div class="command-item">
            <div class="command-rhythm" style="color:${item.color};">${item.rhythm}</div>
            <div class="command-info">
              <div class="command-name">${item.name}</div>
              <div class="command-desc">${item.desc} · 节省 ${item.saved}</div>
            </div>
            <button class="command-action" data-exec="${item.key}" data-type="rotation" style="background:${item.color};">执行</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderTraining() {
  return `
    <div class="training-stage" id="trainingStage">
      <div class="training-title" id="trainingTitle">敲击训练</div>
      <div class="training-desc" id="trainingDesc">点击下方按钮练习不同的敲击节奏</div>

      <div class="tap-target" id="tapTarget">
        <div class="ripple"></div>
        <span style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">${ICONS.tapSingle}</span>
      </div>

      <div class="training-progress" id="trainingProgress">
        <div class="progress-dot active"></div>
        <div class="progress-dot"></div>
        <div class="progress-dot"></div>
        <div class="progress-dot"></div>
      </div>

      <div style="margin-top: 32px; text-align: center;">
        <div style="font-size: 13px; color: var(--text-tertiary); margin-bottom: 8px;">当前训练阶段</div>
        <div style="font-size: 18px; font-weight: 600;" id="stageLabel">单击</div>
      </div>
    </div>
  `;
}

export function renderSettings() {
  const d = Storage.getData();
  return `
    <div class="card">
      <div class="card-title">检测设置</div>
      <div class="setting-item">
        <span class="setting-label">灵敏度</span>
        <div class="setting-value">
          <input type="range" class="slider" id="sensitivitySlider" min="1" max="5" step="0.5" value="${d.settings.sensitivity}">
          <span id="sensitivityValue">${d.settings.sensitivity}g</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">反馈设置</div>
      <div class="setting-item">
        <span class="setting-label">音效反馈</span>
        <div class="toggle ${d.settings.soundEnabled ? 'on' : ''}" id="soundToggle"></div>
      </div>
      <div class="setting-item">
        <span class="setting-label">震动反馈</span>
        <div class="toggle ${d.settings.hapticEnabled ? 'on' : ''}" id="hapticToggle"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">数据管理</div>
      <div class="setting-item">
        <span class="setting-label">累计敲击</span>
        <span style="color: var(--accent); font-weight: 600;">${d.stats.totalTaps} 次</span>
      </div>
      <div class="setting-item">
        <span class="setting-label">累计节省时间</span>
        <span style="color: var(--accent); font-weight: 600;">${formatSaved(d.stats.totalSaved)}</span>
      </div>
      <div class="setting-item" style="padding-top: 20px;">
        <button id="resetDataBtn" style="background: var(--bg-tertiary); color: var(--ios-red); border: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer;">重置所有数据</button>
      </div>
    </div>

    <div style="text-align: center; padding: 24px; color: var(--text-tertiary); font-size: 12px;">
      键语 KeyTalk Demo v1.0<br>
      Web App 使用 DeviceMotion API
    </div>
  `;
}

export function renderOnboarding() {
  return `
    <div class="onboarding" id="onboarding">
      <div class="onboarding-step active" data-step="0">
        <div class="onboarding-icon">${ICONS.onboardingFinger}</div>
        <div class="onboarding-title">欢迎来到键语</div>
        <div class="onboarding-desc">键语将手指敲击转化为数字指令。无需看屏，手指轻叩即可完成操作。</div>
        <button class="onboarding-btn" id="onboardingNext">开始体验</button>
      </div>
      <div class="onboarding-step" data-step="1">
        <div class="onboarding-icon">${ICONS.onboardingPhone}</div>
        <div class="onboarding-title">敲击手机背面</div>
        <div class="onboarding-desc">用手指敲击手机背面，App 会检测振动并识别节奏。试试敲一下吧！</div>
        <button class="onboarding-btn" id="onboardingSimTap">模拟敲击</button>
      </div>
      <div class="onboarding-step" data-step="2">
        <div class="onboarding-icon">${ICONS.onboardingTarget}</div>
        <div class="onboarding-title">你已经学会了</div>
        <div class="onboarding-desc">不同的敲击节奏对应不同的指令。前往训练页面练习更多节奏吧！</div>
        <button class="onboarding-btn" id="onboardingDone">进入 App</button>
      </div>
      <div class="onboarding-dots">
        <div class="onboarding-dot active"></div>
        <div class="onboarding-dot"></div>
        <div class="onboarding-dot"></div>
      </div>
    </div>
  `;
}

export function renderToast(feedback) {
  const iconSvg = feedback.type === 'success' ? ICONS.check : ICONS.alert;
  return `
    <div class="toast" id="toast">
      <div class="toast-icon ${feedback.type}">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${feedback.title}</div>
        <div class="toast-desc">${feedback.desc}</div>
      </div>
    </div>
  `;
}

export function renderCallOverlay() {
  return `
    <div class="call-overlay" id="callOverlay">
      <div class="call-avatar">${ICONS.avatar}</div>
      <div class="call-name">妈妈</div>
      <div class="call-status">正在呼叫...</div>
      <div class="call-buttons">
        <div style="text-align: center;">
          <button class="call-btn decline" id="callDecline">
            ${ICONS.x}
          </button>
          <div class="call-btn-label">拒绝</div>
        </div>
        <div style="text-align: center;">
          <button class="call-btn accept" id="callAccept">
            ${ICONS.phone}
          </button>
          <div class="call-btn-label">接听</div>
        </div>
      </div>
    </div>
  `;
}

function getIconForAction(action) {
  if (action.includes('音乐') || action.includes('暂停播放')) return 'music';
  if (action.includes('来电') || action.includes('接听') || action.includes('挂断')) return 'phone';
  if (action.includes('短信') || action.includes('拒接')) return 'message';
  if (action.includes('定位')) return 'mapPin';
  if (action.includes('快捷')) return 'zap';
  if (action.includes('下一首')) return 'skipForward';
  if (action.includes('上一首')) return 'skipBack';
  if (action.includes('快进')) return 'fastForward';
  if (action.includes('后退')) return 'rewind';
  return 'finger';
}

export { ICONS, formatTime, formatSaved, getIconForAction };
