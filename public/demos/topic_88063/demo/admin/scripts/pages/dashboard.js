/**
 * 数据看板页
 * 统计卡片、近 7 天趋势折线图、问题类型分布饼图、最近工单
 * 使用 ECharts 渲染图表
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.admin = LJ.admin || {}
    LJ.admin.pages = LJ.admin.pages || {}

    let dashboardData = null
    let recentReports = []
    let refreshTimer = null
    // ECharts 实例集合，用于销毁时释放
    const chartInstances = {}

    /**
     * 渲染页面骨架
     */
    function render() {
        return `
      <div id="dashboardPage">
        <div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>
      </div>
    `
    }

    /**
     * 页面挂载
     */
    async function onMount(container) {
        await loadData(container)
        // 每 30 秒自动刷新
        refreshTimer = setInterval(() => loadData(container, true), 30000)
    }

    /**
     * 销毁
     */
    function onDestroy() {
        if (refreshTimer) {
            clearInterval(refreshTimer)
            refreshTimer = null
        }
        // 释放 ECharts 实例
        Object.values(chartInstances).forEach((chart) => chart.dispose())
        Object.keys(chartInstances).forEach((key) => delete chartInstances[key])
    }

    /**
     * 加载数据
     */
    async function loadData(container, silent = false) {
        try {
            const [dashRes, recentRes] = await Promise.all([
                LJ.mockAdminApi.getDashboardData(),
                LJ.mockAdminApi.getReportList({ page: 1, pageSize: 5 })
            ])
            dashboardData = dashRes.data
            recentReports = recentRes.data.list
            renderPage(container)
        } catch (err) {
            console.error('加载看板失败：', err)
            if (!silent) {
                container.querySelector('#dashboardPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
            }
        }
    }

    /**
     * 渲染页面
     */
    function renderPage(container) {
        const d = dashboardData
        container.querySelector('#dashboardPage').innerHTML = `
      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-card-icon primary">📋</div>
          <div class="stat-card-info">
            <div class="stat-card-value">${d.total}</div>
            <div class="stat-card-label">总上报数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon warning">⏳</div>
          <div class="stat-card-info">
            <div class="stat-card-value">${d.pendingCount}</div>
            <div class="stat-card-label">待处理工单</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon success">✅</div>
          <div class="stat-card-info">
            <div class="stat-card-value">${d.verifiedCount}</div>
            <div class="stat-card-label">已验证通过</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon secondary">⚡</div>
          <div class="stat-card-info">
            <div class="stat-card-value">${d.avgProcessDays || 0}<span style="font-size:14px;">天</span></div>
            <div class="stat-card-label">平均处理时长</div>
          </div>
        </div>
      </div>

      <!-- 图表区 -->
      <div class="chart-grid">
        <div class="chart-card">
          <div class="chart-card-header">
            <div class="chart-card-title">近 7 天上报趋势</div>
          </div>
          <div class="chart-container"><div id="lineChart" style="width:100%;height:240px;"></div></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-header">
            <div class="chart-card-title">问题类型分布</div>
          </div>
          <div class="chart-container"><div id="pieChart" style="width:100%;height:240px;"></div></div>
        </div>
      </div>

      <!-- 最近工单 -->
      <div class="table-wrapper">
        <div class="table-toolbar">
          <div class="card-title">最近工单</div>
          <button type="button" class="btn btn-outline btn-sm" onclick="LJ.admin.navigate('/reports')">查看全部</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>工单号</th>
              <th>标题</th>
              <th>类型</th>
              <th>状态</th>
              <th>上报时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${recentReports.map((r) => {
            const status = LJ.utils.getStatusInfo(r.status)
            return `
                <tr>
                  <td class="table-cell-id">${r.orderId}</td>
                  <td class="table-cell-title">${LJ.utils.escapeHtml(r.title)}</td>
                  <td>${LJ.utils.escapeHtml(r.typeName)}</td>
                  <td><span class="status-tag" style="color:${status.color};background:${status.bgColor};">${status.name}</span></td>
                  <td style="font-size:12px;color:var(--color-text-tertiary);">${r.createTime}</td>
                  <td><button type="button" class="table-action-btn" onclick="LJ.admin.navigate('/report-detail', { id: '${r._id}' })">详情</button></td>
                </tr>
              `
        }).join('')}
          </tbody>
        </table>
      </div>
    `
        // 渲染 ECharts 图表
        renderLineChart(d.trend)
        renderPieChart(d.typeDistribution)
    }

    /**
     * 渲染折线图（ECharts）
     */
    function renderLineChart(trend) {
        const el = document.getElementById('lineChart')
        if (!el || !global.echarts) return
        // 复用已有实例，避免重复初始化
        if (chartInstances.line) chartInstances.line.dispose()
        const chart = echarts.init(el)
        chartInstances.line = chart

        chart.setOption({
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(28, 25, 23, 0.9)',
                borderColor: 'transparent',
                textStyle: { color: '#fff', fontSize: 12 }
            },
            grid: { top: 30, right: 20, bottom: 30, left: 40 },
            xAxis: {
                type: 'category',
                data: trend.map((t) => t.date),
                axisLine: { lineStyle: { color: '#E7E5E4' } },
                axisLabel: { color: '#A8A29E', fontSize: 11 }
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: '#F5F5F4', type: 'dashed' } },
                axisLabel: { color: '#A8A29E', fontSize: 11 }
            },
            series: [{
                data: trend.map((t) => t.count),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { color: '#E8792B', width: 2.5 },
                itemStyle: { color: '#E8792B', borderColor: '#fff', borderWidth: 2 },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(232, 121, 43, 0.3)' },
                            { offset: 1, color: 'rgba(232, 121, 43, 0)' }
                        ]
                    }
                },
                label: { show: true, position: 'top', color: '#1C1917', fontWeight: 600, fontSize: 11 }
            }]
        })
    }

    /**
     * 渲染饼图（ECharts）
     */
    function renderPieChart(distribution) {
        const el = document.getElementById('pieChart')
        if (!el || !global.echarts) return
        if (chartInstances.pie) chartInstances.pie.dispose()
        const chart = echarts.init(el)
        chartInstances.pie = chart

        const colors = ['#E8792B', '#0D9488', '#D97706', '#16A34A', '#7C3AED', '#DC2626', '#0891B2', '#BE185D', '#4F46E5', '#65A30D']

        chart.setOption({
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)',
                backgroundColor: 'rgba(28, 25, 23, 0.9)',
                borderColor: 'transparent',
                textStyle: { color: '#fff', fontSize: 12 }
            },
            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: 10,
                top: 'center',
                textStyle: { color: '#57534E', fontSize: 12 },
                formatter: (name) => {
                    const item = distribution.find((d) => d.name === name)
                    return item ? `${name} (${item.count})` : name
                }
            },
            color: colors,
            series: [{
                type: 'pie',
                radius: ['40%', '65%'],
                center: ['35%', '50%'],
                avoidLabelOverlap: true,
                label: { show: false },
                labelLine: { show: false },
                data: distribution.map((d) => ({ name: d.name, value: d.count }))
            }]
        })
    }

    LJ.admin.pages.dashboard = { render, onMount, onDestroy }
})(window)
