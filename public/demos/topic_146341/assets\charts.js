// yiding-guardian charts.js
(function() {
    'use strict';

    var style = getComputedStyle(document.documentElement);
    var accent = style.getPropertyValue('--accent').trim();
    var accent2 = style.getPropertyValue('--accent2').trim();
    var ink = style.getPropertyValue('--ink').trim();
    var muted = style.getPropertyValue('--muted').trim();
    var rule = style.getPropertyValue('--rule').trim();
    var bg2 = style.getPropertyValue('--bg2').trim();
    var accentBg = style.getPropertyValue('--accent-bg').trim();
    var danger = style.getPropertyValue('--danger').trim();
    var success = style.getPropertyValue('--success').trim();

    // --- Chart 1: Awareness Gap Bar Chart ---
    var chart1 = echarts.init(document.getElementById('chart-problem-bar'), null, { renderer: 'svg' });
    chart1.setOption({
        tooltip: {
            trigger: 'axis',
            appendToBody: true
        },
        animation: false,
        legend: {
            data: ['潜在需求用户', '当前签署量'],
            bottom: 0,
            textStyle: { color: muted, fontSize: 13 }
        },
        grid: {
            top: 20,
            bottom: 60,
            left: 60,
            right: 30
        },
        xAxis: {
            type: 'category',
            data: ['认知空白人群\n(2600万)', '了解但未行动\n(约10万)', '已完成签署\n(不足100)'],
            axisLabel: {
                color: muted,
                fontSize: 13,
                lineHeight: 18
            },
            axisLine: { lineStyle: { color: rule } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            name: '人数（对数尺度）',
            nameTextStyle: { color: muted, fontSize: 12 },
            axisLabel: {
                color: muted,
                formatter: function(v) {
                    if (v >= 10000000) return (v / 10000000).toFixed(0) + '千万';
                    if (v >= 10000) return (v / 10000).toFixed(0) + '万';
                    if (v >= 1000) return (v / 1000).toFixed(0) + '千';
                    return v;
                }
            },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: rule, type: 'dashed' } },
            type: 'log',
            min: 1,
            max: 30000000
        },
        series: [
            {
                name: '潜在需求用户',
                type: 'bar',
                barWidth: '30%',
                barGap: '20%',
                data: [
                    {
                        value: 26000000,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: accent },
                                { offset: 1, color: accent + '66' }
                            ]),
                            borderRadius: [6, 6, 0, 0]
                        }
                    },
                    {
                        value: 100000,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: accent },
                                { offset: 1, color: accent + '66' }
                            ]),
                            borderRadius: [6, 6, 0, 0]
                        }
                    },
                    {
                        value: 100,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: accent },
                                { offset: 1, color: accent + '66' }
                            ]),
                            borderRadius: [6, 6, 0, 0]
                        }
                    }
                ],
                label: {
                    show: true,
                    position: 'top',
                    formatter: function(p) {
                        if (p.value >= 10000000) return (p.value / 10000000).toFixed(1) + '千万';
                        if (p.value >= 10000) return (p.value / 10000).toFixed(0) + '万';
                        return p.value;
                    },
                    color: accent,
                    fontWeight: 700,
                    fontSize: 14
                }
            },
            {
                name: '当前签署量',
                type: 'bar',
                barWidth: '30%',
                data: [
                    { value: 0, itemStyle: { color: muted + '33', borderRadius: [6, 6, 0, 0] } },
                    { value: 0, itemStyle: { color: muted + '33', borderRadius: [6, 6, 0, 0] } },
                    {
                        value: 100,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: accent2 },
                                { offset: 1, color: accent2 + '66' }
                            ]),
                            borderRadius: [6, 6, 0, 0]
                        }
                    }
                ],
                label: {
                    show: true,
                    position: 'top',
                    formatter: function(p) {
                        if (p.value === 0) return '';
                        return p.value + '份';
                    },
                    color: accent2,
                    fontWeight: 700,
                    fontSize: 14
                }
            }
        ]
    });
    window.addEventListener('resize', function() { chart1.resize(); });

    // --- Chart 2: Cognitive Trend Line (dynamic) ---
    function getTrendData() {
        if (typeof localStorage !== 'undefined') {
            var data = localStorage.getItem('yiding_trend_data');
            if (data) {
                try { return JSON.parse(data); }
                catch(e) { return [85, 84, 86, 83, 82, 81, 80, 78, 76, 73, 68, 62]; }
            }
        }
        return [85, 84, 86, 83, 82, 81, 80, 78, 76, 73, 68, 62];
    }

    function initTrendChart() {
        var chart2 = echarts.init(document.getElementById('chart-trend-line'), null, { renderer: 'svg' });
        var trendData = getTrendData();
        var weeks = trendData.map(function(_, i) { return '第' + (i + 1) + '周'; });
        var lastIdx = trendData.length - 1;
        var isAlert = trendData[lastIdx] < 55;

        chart2.setOption({
            tooltip: {
                trigger: 'axis',
                appendToBody: true,
                formatter: function(params) {
                    var res = params[0].axisValue + '<br/>';
                    params.forEach(function(p) {
                        res += p.marker + ' ' + p.seriesName + ': ' + p.value;
                        if (p.seriesName === '认知评分') {
                            res += ' 分';
                        } else {
                            res += ' 分';
                        }
                        res += '<br/>';
                    });
                    return res;
                }
            },
            animation: false,
            legend: {
                data: ['认知评分', '关注阈值', '预警阈值'],
                bottom: 0,
                textStyle: { color: muted, fontSize: 13 }
            },
            grid: {
                top: 20,
                bottom: 60,
                left: 60,
                right: 30
            },
            xAxis: {
                type: 'category',
                data: weeks,
                boundaryGap: false,
                axisLabel: { color: muted, fontSize: 12 },
                axisLine: { lineStyle: { color: rule } },
                axisTick: { show: false }
            },
            yAxis: {
                type: 'value',
                min: 40,
                max: 100,
                axisLabel: { color: muted, fontSize: 12, formatter: '{value} 分' },
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { lineStyle: { color: rule, type: 'dashed' } }
            },
            series: [
                {
                    name: '认知评分',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    lineStyle: {
                        width: 3,
                        color: accent
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: accent + '44' },
                            { offset: 1, color: accent + '11' }
                        ])
                    },
                    itemStyle: {
                        color: accent
                    },
                    data: trendData.map(function(v, i) {
                        return {
                            value: v,
                            itemStyle: {
                                color: (i === lastIdx && isAlert) ? danger : accent,
                                borderColor: (i === lastIdx && isAlert) ? danger : accent
                            }
                        };
                    }),
                    markPoint: isAlert ? {
                        data: [{
                            name: '触发提醒',
                            coord: [lastIdx, trendData[lastIdx]],
                            value: trendData[lastIdx],
                            symbol: 'pin',
                            symbolSize: 50,
                            itemStyle: { color: danger },
                            label: {
                                formatter: '⚠️ 触发',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700
                            }
                        }],
                        symbol: 'pin',
                        symbolSize: 50
                    } : undefined,
                    markLine: {
                        silent: true,
                        data: [
                            {
                                yAxis: 65,
                                name: '关注阈值',
                                lineStyle: { color: accent2, width: 2, type: 'dashed' },
                                label: {
                                    formatter: '关注阈值 65',
                                    color: accent2,
                                    fontSize: 12,
                                    fontWeight: 600
                                }
                            },
                            {
                                yAxis: 55,
                                name: '预警阈值',
                                lineStyle: { color: danger, width: 2, type: 'dashed' },
                                label: {
                                    formatter: '预警阈值 55',
                                    color: danger,
                                    fontSize: 12,
                                    fontWeight: 600
                                }
                            }
                        ]
                    }
                }
            ]
        });
        window.trendChart = chart2;
        window.addEventListener('resize', function() { chart2.resize(); });
    }

    // Expose for dynamic updates
    window.initTrendChart = initTrendChart;
    window.getTrendData = getTrendData;
    // Initialize on load
    initTrendChart();

    // --- Chart 3: Problem Radar ---
    var chart3 = document.getElementById('chart-problem-radar');
    if (chart3) {
        var chart3i = echarts.init(chart3, null, { renderer: 'svg' });
        chart3i.setOption({
            tooltip: {
                appendToBody: true
            },
            animation: false,
            radar: {
                indicator: [
                    { name: '认知度', max: 100 },
                    { name: '激活率', max: 100 },
                    { name: '履约效率', max: 100 },
                    { name: '法律完善度', max: 100 },
                    { name: '社会关注度', max: 100 }
                ],
                center: ['50%', '50%'],
                radius: '70%',
                axisName: {
                    color: ink,
                    fontSize: 13,
                    fontWeight: 600
                },
                splitArea: {
                    areaStyle: {
                        color: [accentBg + '44', accentBg + '22']
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: rule
                    }
                }
            },
            series: [{
                type: 'radar',
                data: [{
                    value: [1, 5, 20, 100, 10],
                    name: '当前现状',
                    areaStyle: {
                        color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                            { offset: 0, color: accent2 + '44' },
                            { offset: 1, color: accent2 + '11' }
                        ])
                    },
                    lineStyle: { color: accent2, width: 2 },
                    itemStyle: { color: accent2 }
                }],
                label: {
                    show: true,
                    formatter: function(p) {
                        return p.value + '%';
                    },
                    color: accent2,
                    fontWeight: 700
                }
            }]
        });
        window.addEventListener('resize', function() { chart3i.resize(); });
    }

})();