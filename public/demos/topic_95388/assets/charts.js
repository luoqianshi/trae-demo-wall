// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#b8382e';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#2e5e8a';
  var gold = style.getPropertyValue('--gold').trim() || '#c9a227';
  var jade = style.getPropertyValue('--jade').trim() || '#5a8a6e';
  var lacquer = style.getPropertyValue('--lacquer').trim() || '#5c2c2c';
  var ink = style.getPropertyValue('--ink').trim() || '#2c2416';
  var muted = style.getPropertyValue('--muted').trim() || '#7a6d58';
  var rule = style.getPropertyValue('--rule').trim() || '#d9cfbc';
  var bg2 = style.getPropertyValue('--bg2').trim() || '#efe7d8';
  var bg = style.getPropertyValue('--bg').trim() || '#faf6ef';

  // 通用配置
  var commonOption = {
    animation: false,
    textStyle: {
      fontFamily: 'InstrumentSans, sans-serif',
      color: ink
    }
  };

  // --- Chart 1: 非遗门类分布（环形图） ---
  var chart1El = document.getElementById('chart-category');
  if (chart1El) {
    var chart1 = echarts.init(chart1El, null, { renderer: 'svg' });
    chart1.setOption({
      ...commonOption,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        formatter: '{b}: {c}项 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: ink, fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12
      },
      series: [{
        name: '非遗门类',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: bg,
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: ink
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 155, name: '民间文学', itemStyle: { color: accent } },
          { value: 170, name: '传统音乐', itemStyle: { color: accent2 } },
          { value: 132, name: '传统舞蹈', itemStyle: { color: gold } },
          { value: 162, name: '传统戏剧', itemStyle: { color: jade } },
          { value: 130, name: '曲艺', itemStyle: { color: lacquer } },
          { value: 115, name: '传统体育游艺杂技', itemStyle: { color: '#8b6914' } },
          { value: 152, name: '传统美术', itemStyle: { color: '#a0522d' } },
          { value: 240, name: '传统技艺', itemStyle: { color: '#6b4423' } },
          { value: 83, name: '传统医药', itemStyle: { color: '#4a6741' } },
          { value: 218, name: '民俗', itemStyle: { color: '#8e2a22' } }
        ]
      }]
    });
    window.addEventListener('resize', function() { chart1.resize(); });
  }

  // --- Chart 2: 八大文化区项目数量对比 ---
  var chart2El = document.getElementById('chart-region');
  if (chart2El) {
    var chart2 = echarts.init(chart2El, null, { renderer: 'svg' });
    chart2.setOption({
      ...commonOption,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['江浙水乡', '晋陕黄土', '川滇雪域', '粤闽海丝', '京津冀畿', '鲁豫中原', '湘楚荆襄', '边疆草原'],
        axisLabel: {
          color: muted,
          fontSize: 11,
          interval: 0,
          rotate: 30
        },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '项目数',
        nameTextStyle: { color: muted, fontSize: 11 },
        axisLabel: { color: muted, fontSize: 11 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [{
        type: 'bar',
        data: [
          { value: 168, itemStyle: { color: accent } },
          { value: 142, itemStyle: { color: accent2 } },
          { value: 195, itemStyle: { color: jade } },
          { value: 156, itemStyle: { color: gold } },
          { value: 128, itemStyle: { color: lacquer } },
          { value: 173, itemStyle: { color: '#8b6914' } },
          { value: 134, itemStyle: { color: '#a0522d' } },
          { value: 201, itemStyle: { color: '#4a6741' } }
        ],
        barWidth: '50%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: ink,
          fontSize: 11
        }
      }]
    });
    window.addEventListener('resize', function() { chart2.resize(); });
  }

  // --- Chart 3: 用户学习路径 ---
  var chart3El = document.getElementById('chart-journey');
  if (chart3El) {
    var chart3 = echarts.init(chart3El, null, { renderer: 'svg' });
    chart3.setOption({
      ...commonOption,
      tooltip: {
        trigger: 'item',
        appendToBody: true
      },
      series: [{
        type: 'sankey',
        layout: 'none',
        emphasis: { focus: 'adjacency' },
        nodeWidth: 16,
        nodeGap: 12,
        layoutIterations: 0,
        label: {
          color: ink,
          fontSize: 11
        },
        lineStyle: {
          color: 'gradient',
          curveness: 0.5,
          opacity: 0.3
        },
        data: [
          { name: '发现星图', itemStyle: { color: accent } },
          { name: '点击项目', itemStyle: { color: accent2 } },
          { name: '浏览历史', itemStyle: { color: gold } },
          { name: '体验工坊', itemStyle: { color: jade } },
          { name: '认识传承人', itemStyle: { color: lacquer } },
          { name: '参与PBL项目', itemStyle: { color: '#8b6914' } },
          { name: '创作作品', itemStyle: { color: '#a0522d' } },
          { name: '展示分享', itemStyle: { color: '#4a6741' } }
        ],
        links: [
          { source: '发现星图', target: '点击项目', value: 100 },
          { source: '点击项目', target: '浏览历史', value: 80 },
          { source: '点击项目', target: '体验工坊', value: 60 },
          { source: '点击项目', target: '认识传承人', value: 40 },
          { source: '浏览历史', target: '参与PBL项目', value: 50 },
          { source: '体验工坊', target: '创作作品', value: 55 },
          { source: '认识传承人', target: '参与PBL项目', value: 30 },
          { source: '参与PBL项目', target: '创作作品', value: 70 },
          { source: '创作作品', target: '展示分享', value: 100 }
        ]
      }]
    });
    window.addEventListener('resize', function() { chart3.resize(); });
  }

})();
