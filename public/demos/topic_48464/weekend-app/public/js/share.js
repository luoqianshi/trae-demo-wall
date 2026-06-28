/**
 * 方案分享图片生成 (WI-1.2 / F4)
 * 用 Canvas 绘制杂志风竖版分享图：刊头/方案名/时间线/预算/水印。
 * 延续 The Weekend Dispatch 编辑视觉系统。
 * 支持高DPI屏幕、字体等待加载、动态内容截断。
 */
(function () {
  'use strict';

  const canvas = document.getElementById('share-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // 逻辑尺寸（设计稿尺寸），实际像素按 devicePixelRatio 缩放
  const W = 600;
  const H = 900;

  // 杂志色板（与 CSS :root 保持一致）
  const C = {
    paper: '#F0E9DC',
    paper2: '#E8DFCE',
    ink: '#1C1814',
    inkSoft: '#5C534A',
    inkMute: '#8A7F72',
    accent: '#B8410E',
    moss: '#3F5147',
    rule: '#C9BCA5'
  };

  // 截断中文友好：中文字符算2宽度
  function truncateText(str, maxWidth, font) {
    if (!str) return '';
    ctx.font = font;
    let width = 0;
    let result = '';
    for (const ch of str) {
      const w = ctx.measureText(ch).width;
      if (width + w > maxWidth) return result + '…';
      width += w;
      result += ch;
    }
    return str;
  }

  // 清理文件名非法字符
  function sanitizeFilename(name) {
    return String(name || '周末方案').replace(/[\\/:*?"<>|]/g, '_').slice(0, 50);
  }

  function drawShareImage(plan, prefs, source) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 背景
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);

    // 纸张纹理（简化噪点）
    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = `rgba(120,100,70,${Math.random() * 0.03})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    const pad = 44;
    const contentWidth = W - pad * 2;
    let y = 0;

    // === 刊头条 ===
    ctx.fillStyle = C.inkSoft;
    ctx.font = '500 11px "JetBrains Mono", "DM Mono", monospace';
    ctx.textAlign = 'left';
    const d = new Date();
    const months = ['一','二','三','四','五','六','七','八','九','十','十一','十二'];
    const m = months[d.getMonth()];
    ctx.fillText(`${d.getFullYear()} · ${m}月 ${d.getDate()}日`, pad, 40);
    ctx.textAlign = 'right';
    ctx.fillText('THE WEEKEND DISPATCH', W - pad, 40);
    ctx.textAlign = 'left';

    // 粗线
    ctx.fillStyle = C.ink;
    ctx.fillRect(pad, 52, contentWidth, 4);

    // === 标题 ===
    y = 95;
    ctx.fillStyle = C.ink;
    ctx.font = '900 38px "Fraunces", "Instrument Sans", serif';
    ctx.fillText('周末方案', pad, y);
    ctx.font = 'italic 400 16px "Newsreader", "Instrument Sans", serif';
    ctx.fillStyle = C.inkSoft;
    ctx.fillText('A weekend, well dispatched.', pad, y + 22);

    y += 50;

    // === 偏好信息条 ===
    ctx.fillStyle = C.inkMute;
    ctx.font = '700 10px "JetBrains Mono", "DM Mono", monospace';
    const city = prefs.city || '';
    const budget = prefs.budget || '';
    const weather = prefs.weather || '';
    const companion = prefs.companion || '';
    const weatherLabel = { sunny:'晴', rainy:'雨', cloudy:'多云', hot:'高温', cold:'低温' }[weather] || weather;
    const companionLabel = { solo:'solo', couple:'couple', family:'family', friends:'friends' }[companion] || companion;
    const prefsText = [
      city && `城市  ${city}`,
      budget && `预算  ${budget}`,
      weatherLabel && `天气  ${weatherLabel}`,
      companionLabel && `同行  ${companionLabel}`
    ].filter(Boolean).join('    ·    ');
    ctx.fillText(prefsText.toUpperCase(), pad, y);
    y += 18;

    // 细线
    ctx.fillStyle = C.rule;
    ctx.fillRect(pad, y, contentWidth, 1);
    y += 24;

    // === 方案名 ===
    ctx.fillStyle = C.ink;
    ctx.font = '600 28px "Fraunces", "Instrument Sans", serif';
    const name = plan.plan_name || '周末方案';
    ctx.fillText(truncateText(name, contentWidth, ctx.font), pad, y);
    y += 16;

    // 标签
    ctx.font = '700 9px "JetBrains Mono", "DM Mono", monospace';
    let tagX = pad;
    const maxTagWidth = contentWidth - 10;
    (plan.tags || []).slice(0, 4).forEach(tag => {
      const tw = ctx.measureText(tag).width;
      if (tagX + tw + 22 > W - pad) return; // 超出不绘制
      ctx.fillStyle = C.rule;
      ctx.fillRect(tagX, y, 2, 12);
      ctx.fillStyle = C.inkSoft;
      ctx.fillText(tag, tagX + 8, y + 10);
      tagX += tw + 22;
    });
    y += 30;

    // === 时间线 ===
    const activities = plan.activities || [];
    const timeColW = 70;
    const actColW = contentWidth - timeColW - 10;
    activities.forEach((a, idx) => {
      // 时间
      ctx.fillStyle = C.accent;
      ctx.font = '700 14px "JetBrains Mono", "DM Mono", monospace';
      ctx.fillText(a.time || '', pad, y);

      // 活动名
      ctx.fillStyle = C.ink;
      ctx.font = '600 15px "Fraunces", "Instrument Sans", serif';
      const actName = a.name || '';
      ctx.fillText(truncateText(actName, actColW, ctx.font), pad + timeColW, y);

      // 地点 + 费用
      ctx.fillStyle = C.inkSoft;
      ctx.font = '400 11px "Newsreader", "Instrument Sans", serif';
      const costStr = a.cost != null ? (Number(a.cost) === 0 ? ' · 免费' : ` · ¥${Number(a.cost)}/人`) : '';
      const locRaw = (a.location || '') + costStr;
      ctx.fillText(truncateText(locRaw, actColW, ctx.font), pad + timeColW, y + 16);

      // 虚线分隔
      if (idx < activities.length - 1) {
        ctx.strokeStyle = C.rule;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(pad, y + 26);
        ctx.lineTo(W - pad, y + 26);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      y += 40;
    });

    y += 10;

    // === 备选建议 ===
    if (plan.backup) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(pad, y, 3, 36);
      ctx.fillStyle = C.inkSoft;
      ctx.font = 'italic 400 11px "Newsreader", "Instrument Sans", serif';
      const backup = truncateText('备选: ' + plan.backup, contentWidth - 12, ctx.font);
      ctx.fillText(backup, pad + 12, y + 14);
      y += 50;
    }

    // === 底部预算汇总 ===
    ctx.fillStyle = C.ink;
    ctx.fillRect(pad, y, contentWidth, 1);
    y += 20;

    ctx.fillStyle = C.inkMute;
    ctx.font = '700 10px "JetBrains Mono", "DM Mono", monospace';
    ctx.fillText('总预算 / TOTAL', pad, y);

    ctx.fillStyle = C.accent;
    ctx.font = '700 32px "Fraunces", "Instrument Sans", serif';
    ctx.textAlign = 'right';
    ctx.fillText(`¥${Number(plan.total_cost) || 0}`, W - pad, y + 8);
    ctx.fillStyle = C.inkMute;
    ctx.font = '400 11px "Newsreader", "Instrument Sans", serif';
    ctx.fillText('元/人', W - pad, y + 28);
    ctx.textAlign = 'left';

    // === 水印 ===
    y = H - 50;
    ctx.fillStyle = C.ink;
    ctx.fillRect(pad, y, contentWidth, 1);
    ctx.fillStyle = C.inkMute;
    ctx.font = '500 10px "JetBrains Mono", "DM Mono", monospace';
    ctx.fillText('WEEKEND DISPATCH · 周末纪事', pad, y + 22);
    ctx.textAlign = 'right';
    // 根据来源显示不同水印
    let watermark = '由 AI 为你生成';
    if (source === 'mock' || source === 'mock(fallback)') {
      watermark = '规则引擎精选';
    } else if (source === 'template' || source === 'mock+template' || source === 'mock(fallback)+template') {
      watermark = '精选模板方案';
    } else if (source === 'cache') {
      watermark = 'AI 生成 · 缓存命中';
    }
    ctx.fillText(watermark, W - pad, y + 22);
    ctx.textAlign = 'left';
  }

  async function open() {
    const app = window.__weekendApp;
    if (!app) return;
    const plan = app.getCurrentPlan();
    const prefs = app.getPrefs();
    const source = app.getCurrentSource ? app.getCurrentSource() : '';
    if (!plan) return;

    // 等待字体加载完成
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    } catch (e) { /* 忽略字体加载失败 */ }

    drawShareImage(plan, prefs || {}, source);
    document.getElementById('share-overlay').classList.remove('hidden');
  }

  function close() {
    document.getElementById('share-overlay').classList.add('hidden');
  }

  function download() {
    const app = window.__weekendApp;
    const plan = app ? app.getCurrentPlan() : null;
    const filename = sanitizeFilename(plan ? plan.plan_name : '周末方案') + '-分享图.png';
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    // Toast 反馈
    if (window.__weekendApp && window.__weekendApp.toast) {
      window.__weekendApp.toast('分享图已保存', 'success');
    }
  }

  // 事件绑定
  document.getElementById('share-close').addEventListener('click', close);
  document.getElementById('download-btn').addEventListener('click', download);
  document.getElementById('share-overlay').addEventListener('mousedown', (e) => {
    if (e.target.id === 'share-overlay') close();
  });

  // ESC 关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('share-overlay').classList.contains('hidden')) {
      close();
    }
  });

  // 暴露接口
  window.__shareModule = { open, close };
})();
