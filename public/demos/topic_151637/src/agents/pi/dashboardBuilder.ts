/**
 * 看板 HTML 构建器 — 从 dashboard.ts 中提取的共享模块。
 *
 * 供 CodingAgent（旧）和 PiAgent（新）共同使用。
 */

import type { ChartStylePreset } from '../shared/styleGuide'

export interface DashboardBuildOptions {
  title: string
  content?: string
  sections?: Array<{ heading: string; content: string }>
  charts: Array<{ title: string; figure: object; reasoning: string }>
  stylePreset: ChartStylePreset
  apiPort?: number
}

export function buildDashboardHTML(opts: DashboardBuildOptions): string {
  const { title, content, sections, charts, stylePreset, apiPort } = opts
  const t = stylePreset.plotlyTemplate as Record<string, unknown>
  const colorway = (t.colorway as string[]) || ['#c2410c', '#d97706', '#b45309', '#92400e', '#78350f']
  const bg = (t.paper_bgcolor as string) || '#ffffff'
  const ink = (t.font as Record<string, unknown>)?.color as string || '#1a1a1a'
  const fontFamily = (t.font as Record<string, unknown>)?.family as string || 'Inter, PingFang SC, sans-serif'

  const isDark = stylePreset.id === 'minimal-dark' || (bg as string).match(/#0[0-9a-f]{4}/)
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const accentColor = colorway[0] || '#c2410c'
  const mutedColor = isDark ? '#888' : '#78716c'

  // 报告内容
  const allSections = sections || (content ? [{ heading: '分析报告', content }] : [])
  const reportHTML = allSections.map(s =>
    `<div class="section"><h2>${escapeHTML(s.heading)}</h2>${renderMarkdown(s.content)}</div>`
  ).join('\n')

  // 图表
  const chartJSONs = charts.map(c => JSON.stringify(c.figure))

  const chartCards = charts.map((c, i) => `
    <div class="chart-card">
      <div class="chart-header">
        <h3>${escapeHTML(c.title)}</h3>
        <span class="chart-reason">${escapeHTML(c.reasoning || '')}</span>
      </div>
      <div id="chart-${i}" class="chart-container"></div>
    </div>
  `).join('\n')

  // ── 交互式控件区域 ──
  const controlsHTML = apiPort ? `
  <div class="dashboard-controls">
    <div class="control-group">
      <label class="control-label">时间范围</label>
      <div class="control-row">
        <input type="date" id="filter-start" class="control-input" onchange="applyFilters()" />
        <span class="control-sep">至</span>
        <input type="date" id="filter-end" class="control-input" onchange="applyFilters()" />
      </div>
    </div>
    <div class="control-group">
      <label class="control-label">快捷筛选</label>
      <div class="control-row">
        <select id="filter-preset" class="control-select" onchange="handlePreset(this.value)">
          <option value="">全部</option>
          <option value="7d">最近 7 天</option>
          <option value="30d">最近 30 天</option>
          <option value="90d">最近 90 天</option>
          <option value="1y">最近 1 年</option>
        </select>
      </div>
    </div>
    <div class="control-group" id="extra-controls"></div>
    <div class="control-group">
      <button class="control-btn refresh" onclick="refreshDashboard()" title="刷新数据">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        刷新
      </button>
    </div>
  </div>
  ` : ''

  // ── API 辅助脚本 ──
  const apiScript = apiPort ? `
  <script>
    // ── DataPilot API 辅助函数 ──
    const API_BASE = 'http://127.0.0.1:${apiPort}';

    /**
     * 执行 SQL 查询（通过主进程内嵌 Express API）
     * @param sql SQL 语句
     * @param params 参数化查询参数
     * @returns 查询结果行数组
     */
    async function querySQL(sql, params) {
      const res = await fetch(API_BASE + '/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sql, params: params || undefined })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    }

    /**
     * 获取表结构
     */
    async function getSchema(table) {
      const res = await fetch(API_BASE + '/api/schema/' + table);
      const json = await res.json();
      return json.columns;
    }

    /**
     * 获取所有表
     */
    async function getTables() {
      const res = await fetch(API_BASE + '/api/tables');
      const json = await res.json();
      return json.tables;
    }

    // ── 筛选控件逻辑 ──
    function handlePreset(val) {
      if (!val) return;
      const now = new Date();
      let start = new Date();
      const map = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      start.setDate(now.getDate() - (map[val] || 0));
      document.getElementById('filter-start').value = start.toISOString().slice(0, 10);
      document.getElementById('filter-end').value = now.toISOString().slice(0, 10);
      applyFilters();
    }

    function getFilterDates() {
      const start = document.getElementById('filter-start')?.value || '';
      const end = document.getElementById('filter-end')?.value || '';
      return { start, end };
    }

    /**
     * 由看板自定义的筛选回调（默认空实现，Agent 可在生成时覆盖）
     * 看板页面通过覆写 applyFilters() 实现自定义筛选逻辑。
     */
    function applyFilters() {
      // Agent 生成看板时会覆写此函数
      console.log('筛选条件已变更', getFilterDates());
    }

    /**
     * 刷新看板（重新执行所有查询和图表更新）
     */
    function refreshDashboard() {
      applyFilters();
    }
  <\/script>
  ` : ''

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(title)}</title>
<script src="https://cdn.plot.ly/plotly-3.0.0.min.js"><\/script>
<style>
  :root {
    --bg: ${bg};
    --ink: ${ink};
    --accent: ${accentColor};
    --muted: ${mutedColor};
    --card-bg: ${cardBg};
    --card-border: ${cardBorder};
    --font: ${fontFamily};
    --radius: 8px;
    --shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--ink);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 32px;
  }
  .dashboard-header {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--card-border);
  }
  .dashboard-header h1 {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--ink);
  }
  .dashboard-header .meta {
    margin-top: 8px;
    font-size: 13px;
    color: var(--muted);
  }

  /* ── 交互控件 ── */
  .dashboard-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end;
    padding: 16px 20px;
    margin-bottom: 24px;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
  }
  .control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .control-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .control-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .control-sep {
    font-size: 12px;
    color: var(--muted);
  }
  .control-input {
    padding: 6px 10px;
    border: 1px solid var(--card-border);
    border-radius: 6px;
    font-size: 13px;
    font-family: var(--font);
    background: var(--bg);
    color: var(--ink);
    outline: none;
    transition: border-color 0.15s;
  }
  .control-input:focus {
    border-color: var(--accent);
  }
  .control-select {
    padding: 6px 10px;
    border: 1px solid var(--card-border);
    border-radius: 6px;
    font-size: 13px;
    font-family: var(--font);
    background: var(--bg);
    color: var(--ink);
    outline: none;
    cursor: pointer;
    min-width: 120px;
  }
  .control-select:focus {
    border-color: var(--accent);
  }
  .control-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border: 1px solid var(--card-border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--ink);
    font-size: 13px;
    font-family: var(--font);
    cursor: pointer;
    transition: all 0.15s;
  }
  .control-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .control-btn svg {
    width: 14px;
    height: 14px;
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  .summary-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    padding: 20px;
    transition: border-color 0.15s ease;
  }
  .summary-card:hover {
    border-color: ${accentColor}33;
  }
  .summary-card .label {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .summary-card .value {
    font-size: 28px;
    font-weight: 700;
    margin-top: 4px;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  .summary-card .delta {
    font-size: 12px;
    margin-top: 4px;
  }
  .summary-card .delta.up { color: ${isDark ? '#34d399' : '#059669'}; }
  .summary-card .delta.down { color: #ef4444; }
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
  }
  .chart-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    padding: 20px;
    transition: box-shadow 0.15s ease;
  }
  .chart-card:hover {
    box-shadow: var(--shadow);
  }
  .chart-header {
    margin-bottom: 12px;
  }
  .chart-header h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
  }
  .chart-header .chart-reason {
    font-size: 12px;
    color: var(--muted);
  }
  .chart-container {
    width: 100%;
    min-height: 320px;
  }
  .report-section {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    padding: 32px;
    margin-bottom: 24px;
  }
  .report-section h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--card-border);
    color: var(--ink);
  }
  .report-section h3 {
    font-size: 16px;
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 8px;
    color: var(--ink);
  }
  .report-section p {
    margin-bottom: 12px;
    color: ${isDark ? '#ccc' : '#444'};
    font-size: 14px;
  }
  .report-section ul, .report-section ol {
    margin: 8px 0 16px 20px;
    color: ${isDark ? '#ccc' : '#444'};
  }
  .report-section li {
    margin-bottom: 4px;
  }
  .report-section strong {
    color: var(--accent);
    font-weight: 600;
  }
  .report-section table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
  }
  .report-section th {
    text-align: left;
    padding: 8px 12px;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    border-bottom: 2px solid var(--card-border);
  }
  .report-section td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--card-border);
  }
  .report-section code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
    padding: 2px 6px;
    border-radius: 4px;
  }
  .report-section pre {
    background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 12px 0;
  }
  @media (max-width: 768px) {
    .dashboard { padding: 24px 16px; }
    .charts-grid { grid-template-columns: 1fr; }
    .summary-cards { grid-template-columns: repeat(2, 1fr); }
    .dashboard-controls { flex-direction: column; }
  }
</style>
</head>
<body>
<div class="dashboard">
  <header class="dashboard-header">
    <h1>${escapeHTML(title)}</h1>
    <div class="meta">${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} · 由 DataPilot AI 生成${apiPort ? ' · 交互式' : ''}</div>
  </header>
  ${controlsHTML}
  ${reportHTML ? `<div class="report-section">${reportHTML}</div>` : ''}
  ${charts.length > 0 ? `<div class="charts-grid">${chartCards}</div>` : ''}
</div>
${apiScript}
<script>
  const plotlyTemplate = ${JSON.stringify(stylePreset.plotlyTemplate)};
  const chartData = [${chartJSONs.join(',')}];
  chartData.forEach(function(fig, i) {
    var container = document.getElementById('chart-' + i);
    if (!container) return;
    var layout = Object.assign({}, plotlyTemplate, fig.layout || {}, {
      autosize: true,
      margin: { l: 50, r: 20, t: 40, b: 50 }
    });
    Plotly.newPlot(container, fig.data || [], layout, {
      responsive: true,
      displayModeBar: false
    });
  });
<\/script>
</body>
</html>`
}

export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 简单的 Markdown 转 HTML（仅处理常见格式） */
export function renderMarkdown(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    .replace(/^(?!<[hlu/])(.+)$/gm, '<p>$1</p>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, '</p><p>')
  return html
}