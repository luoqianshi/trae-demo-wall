/**
 * TimeForge X - 图表配置
 * ECharts图表通用配置和主题
 */
(function() {
  'use strict';

  // 深色主题配色
  const theme = {
    bgColor: 'transparent',
    textColor: '#94A3B8',
    axisColor: '#334155',
    splitColor: 'rgba(51,65,85,0.5)',
    colors: ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899', '#14B8A6'],
  };

  window.TimeForgeCharts = {
    theme,

    /**
     * 创建通用图表配置
     */
    baseOption(type) {
      return {
        backgroundColor: theme.bgColor,
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      };
    },

    /**
     * 折线图
     */
    createLineChart(domId, data, options = {}) {
      const dom = document.getElementById(domId);
      if (!dom) return null;
      const chart = echarts.init(dom);
      chart.setOption({
        ...this.baseOption(),
        tooltip: { trigger: 'axis' },
        legend: { data: options.legend || ['数据'], textStyle: { color: theme.textColor }, top: 0 },
        xAxis: {
          type: 'category',
          data: data.labels || [],
          axisLine: { lineStyle: { color: theme.axisColor } },
          axisLabel: { color: theme.textColor },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: theme.axisColor } },
          splitLine: { lineStyle: { color: theme.splitColor } },
          axisLabel: { color: theme.textColor },
        },
        series: [{
          name: (options.legend || ['数据'])[0],
          type: 'line',
          data: data.values || [],
          smooth: true,
          lineStyle: { color: options.color || theme.colors[0], width: 2 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: (options.color || theme.colors[0]) + '40' },
            { offset: 1, color: 'transparent' },
          ])},
          itemStyle: { color: options.color || theme.colors[0] },
        }],
      });
      return chart;
    },

    /**
     * 柱状图
     */
    createBarChart(domId, data, options = {}) {
      const dom = document.getElementById(domId);
      if (!dom) return null;
      const chart = echarts.init(dom);
      chart.setOption({
        ...this.baseOption(),
        tooltip: { trigger: 'axis' },
        legend: { data: options.legend || ['数据'], textStyle: { color: theme.textColor }, top: 0 },
        xAxis: {
          type: 'category',
          data: data.labels || [],
          axisLine: { lineStyle: { color: theme.axisColor } },
          axisLabel: { color: theme.textColor },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: theme.axisColor } },
          splitLine: { lineStyle: { color: theme.splitColor } },
          axisLabel: { color: theme.textColor },
        },
        series: (data.series || [{ name: '数据', values: data.values || [] }]).map((s, i) => ({
          name: s.name,
          type: 'bar',
          data: s.values || s.data || [],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: theme.colors[i % theme.colors.length] },
              { offset: 1, color: theme.colors[i % theme.colors.length] + '60' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          barMaxWidth: 40,
        })),
      });
      return chart;
    },

    /**
     * 饼图/环形图
     */
    createPieChart(domId, data, options = {}) {
      const dom = document.getElementById(domId);
      if (!dom) return null;
      const chart = echarts.init(dom);
      chart.setOption({
        backgroundColor: theme.bgColor,
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: theme.textColor } },
        series: [{
          type: 'pie',
          radius: options.radius || ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: '#0F172A', borderWidth: 3 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          data: data.values || [],
          color: theme.colors,
        }],
      });
      return chart;
    },

    /**
     * 热力图（日历）
     */
    createHeatmap(domId, data, options = {}) {
      const dom = document.getElementById(domId);
      if (!dom) return null;
      const chart = echarts.init(dom);

      const heatData = (data.heatmap || data).map(d => [d.date, d.value || 0]);

      chart.setOption({
        backgroundColor: theme.bgColor,
        tooltip: {
          formatter: (p) => `${p.data[0]}: ${p.data[1]}分钟`,
        },
        visualMap: {
          min: 0,
          max: options.max || 240,
          type: 'piecewise',
          orient: 'horizontal',
          left: 'center',
          bottom: 0,
          textStyle: { color: theme.textColor },
          pieces: [
            { min: 180, label: '>3h', color: '#10B981' },
            { min: 120, max: 179, label: '2-3h', color: '#34D399' },
            { min: 60, max: 119, label: '1-2h', color: '#F59E0B' },
            { min: 1, max: 59, label: '<1h', color: '#EF4444' },
            { value: 0, label: '0', color: '#1E293B' },
          ],
        },
        calendar: {
          top: 'middle',
          left: 'center',
          range: options.range || '2024-01',
          cellSize: ['auto', 15],
          yearLabel: { show: false },
          dayLabel: { color: theme.textColor },
          monthLabel: { color: theme.textColor },
          itemStyle: { borderColor: '#0F172A', borderWidth: 2, borderRadius: 3 },
          splitLine: { show: false },
        },
        series: [{
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: heatData,
        }],
      });
      return chart;
    },

    /**
     * 雷达图
     */
    createRadarChart(domId, data, options = {}) {
      const dom = document.getElementById(domId);
      if (!dom) return null;
      const chart = echarts.init(dom);

      const indicators = (data.labels || []).map(label => ({ name: label, max: 100 }));
      const seriesData = (data.series || [{ name: '当前水平', values: data.values || [] }]).map((s, i) => ({
        name: s.name,
        value: s.values || s.data || [],
        itemStyle: { color: theme.colors[i] },
        lineStyle: { color: theme.colors[i] },
        areaStyle: { color: theme.colors[i] + '30' },
      }));

      chart.setOption({
        backgroundColor: theme.bgColor,
        tooltip: {},
        legend: { data: seriesData.map(s => s.name), textStyle: { color: theme.textColor }, bottom: 0 },
        radar: {
          indicator: indicators,
          axisName: { color: theme.textColor },
          splitArea: { areaStyle: { color: ['rgba(99,102,241,0.05)', 'rgba(99,102,241,0.02)'] } },
          splitLine: { lineStyle: { color: theme.splitColor } },
          axisLine: { lineStyle: { color: theme.axisColor } },
        },
        series: [{ type: 'radar', data: seriesData }],
      });
      return chart;
    },

    /**
     * 甘特图（自定义）
     */
    createGanttChart(domId, ganttData) {
      const dom = document.getElementById(domId);
      if (!dom) return null;
      const chart = echarts.init(dom);

      const tasks = ganttData.map((d, i) => ({
        name: d.name,
        start: d.start,
        end: d.end,
        progress: d.progress || 0,
        itemStyle: { color: theme.colors[i % theme.colors.length] },
      }));

      const minDate = Math.min(...tasks.map(t => new Date(t.start).getTime()));
      const maxDate = Math.max(...tasks.map(t => new Date(t.end).getTime()));

      chart.setOption({
        backgroundColor: theme.bgColor,
        tooltip: {
          formatter: (p) => `${p.name}<br/>${p.value[0]} ~ ${p.value[1]}`,
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'time',
          min: minDate,
          max: maxDate,
          axisLabel: { color: theme.textColor },
          axisLine: { lineStyle: { color: theme.axisColor } },
          splitLine: { lineStyle: { color: theme.splitColor } },
        },
        yAxis: {
          type: 'category',
          data: tasks.map(t => t.name),
          axisLabel: { color: theme.textColor },
          axisLine: { lineStyle: { color: theme.axisColor } },
        },
        series: [{
          type: 'custom',
          renderItem: (params, api) => {
            const catIndex = api.value(0);
            const start = api.coord([api.value(1), catIndex]);
            const end = api.coord([api.value(2), catIndex]);
            const height = api.size([0, 1])[1] * 0.6;
            return {
              type: 'rect',
              shape: {
                x: start[0],
                y: start[1] - height / 2,
                width: Math.max(end[0] - start[0], 4),
                height: height,
              },
              style: { fill: theme.colors[catIndex % theme.colors.length], rx: 4, ry: 4 },
            };
          },
          dimensions: ['category', 'start', 'end'],
          encode: { x: [1, 2], y: 0 },
          data: tasks.map((t, i) => [i, new Date(t.start).getTime(), new Date(t.end).getTime()]),
        }],
      });
      return chart;
    },

    /**
     * 响应式调整
     */
    resizeAll() {
      // 自动查找所有echarts实例并resize
      document.querySelectorAll('[id]').forEach(el => {
        const instance = echarts.getInstanceByDom(el);
        if (instance) instance.resize();
      });
    },
  };

  // 窗口大小变化时自动调整
  window.addEventListener('resize', () => {
    window.TimeForgeCharts.resizeAll();
  });
})();