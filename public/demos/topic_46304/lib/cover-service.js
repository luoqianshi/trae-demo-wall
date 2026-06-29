/* ============================================================
 * CoverService - 封面生成服务（IGA Pages 内存版）
 *
 * 从原项目 cover-service.js 迁移，db 操作改为使用内存 store。
 * SVG 生成逻辑完全保留。
 * ============================================================ */

const store = require('./store');

// 色板预设
const COLOR_PALETTES = {
  '历史穿越': { primary: '#8B4513', secondary: '#DAA520', text: '#FFF8DC' },
  '玄幻修仙': { primary: '#1a1a2e', secondary: '#16213e', text: '#e94560' },
  '都市异能': { primary: '#0f3460', secondary: '#16213e', text: '#e94560' },
  '悬疑推理': { primary: '#1a1a1a', secondary: '#2d2d2d', text: '#f0f0f0' },
  '甜宠言情': { primary: '#FF69B4', secondary: '#FFB6C1', text: '#4B0082' },
  '科幻未来': { primary: '#000814', secondary: '#001d3d', text: '#003566' },
  '武侠江湖': { primary: '#2C3E50', secondary: '#34495E', text: '#E8E8E8' },
  '恐怖惊悚': { primary: '#1a0000', secondary: '#330000', text: '#660000' },
};

const DEFAULT_PALETTE = { primary: '#c9a227', secondary: '#1a1a2e', text: '#FFFFFF' };

function generateCover(novelData) {
  const title = novelData.title || '未命名';
  const genre = novelData.genre || '通用';
  const author = novelData.referenceAuthor || novelData.author || '';
  const customColor = novelData.coverColor || novelData.color;
  const palette = customColor
    ? { primary: customColor, secondary: '#1a1a2e', text: '#FFFFFF' }
    : (COLOR_PALETTES[genre] || DEFAULT_PALETTE);

  const width = 600;
  const height = 800;
  const gradId = 'grad_' + Date.now();
  const decoLines = _generateDecorativeLines(width, height, palette);
  const titleLines = _wrapTitle(title, 8);
  const titleY = height * 0.4;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.primary}"/>
      <stop offset="100%" style="stop-color:${palette.secondary}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#${gradId})"/>
  ${decoLines}
  <rect x="40" y="60" width="${genre.length * 24 + 30}" height="36" rx="18" fill="rgba(255,255,255,0.15)"/>
  <text x="55" y="84" font-family="Noto Sans SC, sans-serif" font-size="16" fill="rgba(255,255,255,0.9)">${_escapeXml(genre)}</text>
  ${titleLines.map((line, i) => `<text x="${width/2}" y="${titleY + i * 56}" font-family="Noto Serif SC, serif" font-size="42" font-weight="700" fill="${palette.text}" text-anchor="middle">${_escapeXml(line)}</text>`).join('\n  ')}
  ${author ? `<text x="${width/2}" y="${height - 60}" font-family="Noto Sans SC, sans-serif" font-size="18" fill="rgba(255,255,255,0.7)" text-anchor="middle">${_escapeXml(author)}</text>` : ''}
  <line x1="100" y1="${height - 100}" x2="${width - 100}" y2="${height - 100}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
</svg>`;

  return svg;
}

function uploadCover(novelId, imageData) {
  const key = `cover_${novelId}`;
  store.setSetting(key, JSON.stringify({ type: 'custom', data: imageData, updatedAt: Date.now() }));
  return true;
}

function saveGeneratedCover(novelId, svgData) {
  const key = `cover_${novelId}`;
  store.setSetting(key, JSON.stringify({ type: 'generated', data: svgData, updatedAt: Date.now() }));
  return true;
}

function getCover(novelId) {
  const key = `cover_${novelId}`;
  const val = store.getSetting(key);
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
}

function deleteCover(novelId) {
  const key = `cover_${novelId}`;
  store.deleteSetting(key);
  return true;
}

// ===== 内部工具 =====

function _escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function _wrapTitle(title, maxCharsPerLine) {
  if (!title) return ['未命名'];
  const lines = [];
  let current = '';
  for (const char of title) {
    current += char;
    if (current.length >= maxCharsPerLine) {
      lines.push(current);
      current = '';
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function _generateDecorativeLines(width, height, palette) {
  const lines = [];
  lines.push(`<line x1="40" y1="120" x2="40" y2="${height - 120}" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>`);
  lines.push(`<line x1="${width - 40}" y1="120" x2="${width - 40}" y2="${height - 120}" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>`);
  lines.push(`<line x1="60" y1="130" x2="${width - 60}" y2="130" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`);
  const dots = 12;
  for (let i = 0; i < dots; i++) {
    const cx = 60 + Math.random() * (width - 120);
    const cy = 120 + Math.random() * (height - 240);
    const r = 1 + Math.random() * 2;
    lines.push(`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(1)}" fill="rgba(255,255,255,0.05)"/>`);
  }
  return lines.join('\n  ');
}

module.exports = {
  generateCover,
  uploadCover,
  saveGeneratedCover,
  getCover,
  deleteCover,
  COLOR_PALETTES,
};
