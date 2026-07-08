/**
 * 统计分析页
 * 多维度数据统计：类型分布、分类统计、处理人绩效、区域分布
 * 使用 ECharts 渲染图表
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.admin = LJ.admin || {}
    LJ.admin.pages = LJ.admin.pages || {}

    let statsData = null
    // ECharts 实例集合，用于销毁时释放
    const chartInstances = {}

    /**
     * 渲染页面骨架
     */
    function render() {
        return `
      <div id="statsPage">
        <div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>
      </div>
    `
    }

    /**
     * 页面挂载
     */
    async function onMount(container) {
        try {
            const res = await LJ.mockAdminApi.getStatistics()
            if (res.code !== 0) {
                container.querySelector('#statsPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
                return
            }
            statsData = res.data
            renderPage(container)
        } catch (err) {
            console.error('加载统计失败：', err)
            container.querySelector('#statsPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
        }
    }

    /**
     * 销毁
     */
    function onDestroy() {
        // 释放 ECharts 实例
        Object.values(chartInstances).forEach((chart) => chart.dispose())
        Object.keys(chartInstances).forEach((key) => delete chartInstances[key])
    }

    /**
     * 渲染页面
     */
    function renderPage(container) {
        const fixRate = statsData.totalReports > 0
            ? ((statsData.verifiedReports / statsData.totalReports) * 100).toFixed(1)
            : 0

        container.querySelector('#statsPage').innerHTML = `
      <!-- 总览 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-card-icon primary">📋</div>
          <div class="stat-card-info">
            <div class="stat-card-value">${statsData.totalReports}</div>
            <div class="stat-card-label">总上报数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon success">✅</div>
          <div class="stat-card-info">
            <div class="stat-card-value">${statsData.verifiedReports}</div>
            <div class="stat-card-label">已验证通过</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon secondary">📈</div>
          <div class="stat-card-info">
            <div class="stat-card-value">${fixRate}<span style="font-size:14px;">%</span></div>
            <div class="stat-card-label">修复率</div>
          </div>
        </div>
      </div>

      <!-- 问题类型统计 -->
      <div class="chart-card" style="margin-bottom:16px;">
        <div class="chart-card-header">
          <div class="chart-card-title">问题类型统计</div>
        </div>
        <div class="chart-container"><div id="typeBarChart" style="width:100%;height:280px;"></div></div>
      </div>

      <!-- 分类统计 + 处理人绩效 -->
      <div class="chart-grid">
        <div class="chart-card">
          <div class="chart-card-header">
            <div class="chart-card-title">问题分类统计</div>
          </div>
          <div class="chart-container">${renderCategoryTable(statsData.categoryStats)}</div>
        </div>
        <div class="chart-card">
          <div class="chart-card-header">
            <div class="chart-card-title">处理人绩效</div>
          </div>
          <div class="chart-container">${renderHandlerStats(statsData.handlerStats)}</div>
        </div>
      </div>
    `
        // 渲染 ECharts 柱状图
        renderTypeBarChart(statsData.typeStats)
    }

    /**
     * 渲染类型柱状图（ECharts）
     * 展示各问题类型的总数和已修复数，支持 tooltip 交互
     */
    function renderTypeBarChart(typeStats) {
        const el = document.getElementById('typeBarChart')
        if (!el || !global.echarts) return
        if (!typeStats || typeStats.length === 0) {
            el.innerHTML = '<div class="empty-state" style="padding:40px;"><div class="empty-icon" aria-hidden="true">📊</div><p>暂无数据</p></div>'
            return
        }
        if (chartInstances.typeBar) chartInstances.typeBar.dispose()
        const chart = echarts.init(el)
        chartInstances.typeBar = chart

        chart.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: 'rgba(28, 25, 23, 0.9)',
                borderColor: 'transparent',
                textStyle: { color: '#fff', fontSize: 12 },
                formatter: (params) => {
                    const item = typeStats[params[0].dataIndex]
                    const verifiedRate = item.total > 0 ? ((item.verified / item.total) * 100).toFixed(1) : 0
                    return `${params[0].name}<br/>
                        总数：${item.total}<br/>
                        已修复：${item.verified}<br/>
                        修复率：${verifiedRate}%`
                }
            },
            legend: {
                data: ['总数', '已修复'],
                top: 0,
                right: 10,
                textStyle: { color: '#57534E', fontSize: 12 }
            },
            grid: { top: 40, right: 20, bottom: 40, left: 40 },
            xAxis: {
                type: 'category',
                data: typeStats.map((t) => t.name),
                axisLine: { lineStyle: { color: '#E7E5E4' } },
                axisLabel: { color: '#57534E', fontSize: 11, interval: 0, rotate: typeStats.length > 6 ? 20 : 0 },
                axisTick: { alignWithLabel: true }
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: '#F5F5F4', type: 'dashed' } },
                axisLabel: { color: '#A8A29E', fontSize: 11 }
            },
            series: [
                {
                    name: '总数',
                    type: 'bar',
                    barWidth: '30%',
                    data: typeStats.map((t) => t.total),
                    itemStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#E8792B' },
                                { offset: 1, color: '#D97706' }
                            ]
                        },
                        borderRadius: [4, 4, 0, 0]
                    },
                    label: { show: true, position: 'top', color: '#1C1917', fontWeight: 600, fontSize: 11 }
                },
                {
                    name: '已修复',
                    type: 'bar',
                    barWidth: '30%',
                    data: typeStats.map((t) => t.verified),
                    itemStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#16A34A' },
                                { offset: 1, color: '#0D9488' }
                            ]
                        },
                        borderRadius: [4, 4, 0, 0]
                    },
                    label: { show: true, position: 'top', color: '#1C1917', fontWeight: 600, fontSize: 11 }
                }
            ]
        })
    }

    /**
     * 渲染分类统计表格
     */
    function renderCategoryTable(categoryStats) {
        if (!categoryStats || categoryStats.length === 0) {
            return '<div class="empty-state" style="padding:40px;"><div class="empty-icon" aria-hidden="true">📊</div><p>暂无数据</p></div>'
        }
        return `
      <table class="data-table">
        <thead>
          <tr>
            <th>分类</th>
            <th>总数</th>
            <th>已修复</th>
            <th>修复率</th>
          </tr>
        </thead>
        <tbody>
          ${categoryStats.map((c) => {
            const rate = c.total > 0 ? ((c.verified / c.total) * 100).toFixed(1) : 0
            return `
              <tr>
                <td>${LJ.utils.escapeHtml(c.name)}</td>
                <td>${c.total}</td>
                <td>${c.verified}</td>
                <td><span style="color:${rate >= 50 ? 'var(--color-success)' : 'var(--color-warning)'};font-weight:600;">${rate}%</span></td>
              </tr>
            `
        }).join('')}
        </tbody>
      </table>
    `
    }

    /**
     * 渲染处理人绩效
     */
    function renderHandlerStats(handlerStats) {
        if (!handlerStats || handlerStats.length === 0) {
            return '<div class="empty-state" style="padding:40px;"><div class="empty-icon" aria-hidden="true">👥</div><p>无处理人数据</p></div>'
        }
        const sorted = [...handlerStats].sort((a, b) => b.fixed - a.fixed)
        return `
      <ul class="rank-list">
        ${sorted.map((h, i) => {
            const rate = h.total > 0 ? ((h.fixed / h.total) * 100).toFixed(0) : 0
            const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : ''
            return `
            <li class="rank-item">
              <span class="rank-num ${rankClass}">${i + 1}</span>
              <div style="flex:1;">
                <div style="font-weight:500;">${LJ.utils.escapeHtml(h.name)}</div>
                <div style="font-size:12px;color:var(--color-text-tertiary);">处理 ${h.total} 单 · 完成 ${h.fixed} 单 · 完成率 ${rate}%</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:18px;font-weight:700;color:var(--color-primary);">${h.fixed}</div>
                <div style="font-size:11px;color:var(--color-text-tertiary);">已完成</div>
              </div>
            </li>
          `
        }).join('')}
      </ul>
    `
    }

    LJ.admin.pages.statistics = { render, onMount, onDestroy }
})(window)
