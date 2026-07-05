// ECharts 图表初始化脚本
(function() {
    // 读取CSS变量
    var style = getComputedStyle(document.documentElement);
    var accent = style.getPropertyValue('--accent').trim() || '#2563eb';
    var accent2 = style.getPropertyValue('--accent2').trim() || '#10b981';
    var ink = style.getPropertyValue('--ink').trim() || '#1f2937';
    var muted = style.getPropertyValue('--muted').trim() || '#6b7280';
    var rule = style.getPropertyValue('--rule').trim() || '#e5e7eb';
    var bg2 = style.getPropertyValue('--bg2').trim() || '#ffffff';
    var danger = style.getPropertyValue('--danger').trim() || '#ef4444';
    var warning = style.getPropertyValue('--warning').trim() || '#f59e0b';

    // --- 设备状态分布饼图 ---
    var statusChartEl = document.getElementById('statusChart');
    if (statusChartEl) {
        var statusChart = echarts.init(statusChartEl, null, { renderer: 'svg' });
        statusChart.setOption({
            tooltip: {
                trigger: 'item',
                backgroundColor: bg2,
                borderColor: rule,
                textStyle: { color: ink }
            },
            legend: {
                bottom: 10,
                textStyle: { color: muted }
            },
            series: [{
                type: 'pie',
                radius: ['35%', '65%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: bg2,
                    borderWidth: 2
                },
                label: { show: false },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: ink
                    }
                },
                data: [
                    { value: 142, name: '运行中', itemStyle: { color: accent2 } },
                    { value: 8, name: '维护中', itemStyle: { color: warning } },
                    { value: 3, name: '故障', itemStyle: { color: danger } },
                    { value: 3, name: '待机', itemStyle: { color: accent } }
                ]
            }]
        });
        window.addEventListener('resize', function() { statusChart.resize(); });
    }

    // --- 工单趋势折线图 ---
    var orderTrendChartEl = document.getElementById('orderTrendChart');
    if (orderTrendChartEl) {
        var orderTrendChart = echarts.init(orderTrendChartEl, null, { renderer: 'svg' });
        orderTrendChart.setOption({
            tooltip: {
                trigger: 'axis',
                backgroundColor: bg2,
                borderColor: rule,
                textStyle: { color: ink }
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
                boundaryGap: false,
                data: ['1日', '5日', '10日', '15日', '20日', '25日', '31日'],
                axisLine: { lineStyle: { color: rule } },
                axisLabel: { color: muted }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: rule } },
                axisLabel: { color: muted },
                splitLine: { lineStyle: { color: rule } }
            },
            series: [
                {
                    name: '新增工单',
                    type: 'line',
                    smooth: true,
                    data: [8, 15, 12, 18, 22, 16, 20],
                    lineStyle: { color: accent, width: 3 },
                    itemStyle: { color: accent },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: accent + '40' },
                                { offset: 1, color: accent + '05' }
                            ]
                        }
                    }
                },
                {
                    name: '完成工单',
                    type: 'line',
                    smooth: true,
                    data: [6, 14, 11, 16, 20, 15, 18],
                    lineStyle: { color: accent2, width: 3 },
                    itemStyle: { color: accent2 },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: accent2 + '40' },
                                { offset: 1, color: accent2 + '05' }
                            ]
                        }
                    }
                }
            ],
            legend: {
                top: 5,
                textStyle: { color: muted }
            }
        });
        window.addEventListener('resize', function() { orderTrendChart.resize(); });
    }

    // --- 设备利用率分析 ---
    var utilizationChartEl = document.getElementById('utilizationChart');
    if (utilizationChartEl) {
        var utilizationChart = echarts.init(utilizationChartEl, null, { renderer: 'svg' });
        utilizationChart.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: bg2,
                borderColor: rule,
                textStyle: { color: ink }
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
                data: ['车间A', '车间B', '车间C', '车间D', '车间E', '车间F'],
                axisLine: { lineStyle: { color: rule } },
                axisLabel: { color: muted }
            },
            yAxis: {
                type: 'value',
                max: 100,
                name: '利用率%',
                nameTextStyle: { color: muted },
                axisLine: { lineStyle: { color: rule } },
                axisLabel: { color: muted },
                splitLine: { lineStyle: { color: rule } }
            },
            series: [{
                type: 'bar',
                data: [
                    { value: 87, itemStyle: { color: accent2 } },
                    { value: 96, itemStyle: { color: accent2 } },
                    { value: 90, itemStyle: { color: accent } },
                    { value: 95, itemStyle: { color: accent2 } },
                    { value: 93, itemStyle: { color: accent2 } },
                    { value: 85, itemStyle: { color: warning } }
                ],
                barWidth: 40,
                itemStyle: { borderRadius: [4, 4, 0, 0] },
                label: {
                    show: true,
                    position: 'top',
                    color: ink,
                    formatter: '{c}%'
                }
            }]
        });
        window.addEventListener('resize', function() { utilizationChart.resize(); });
    }

    // --- 故障类型分布 ---
    var faultTypeChartEl = document.getElementById('faultTypeChart');
    if (faultTypeChartEl) {
        var faultTypeChart = echarts.init(faultTypeChartEl, null, { renderer: 'svg' });
        faultTypeChart.setOption({
            tooltip: {
                trigger: 'item',
                backgroundColor: bg2,
                borderColor: rule,
                textStyle: { color: ink }
            },
            legend: {
                orient: 'vertical',
                right: 20,
                top: 'center',
                textStyle: { color: muted }
            },
            series: [{
                type: 'pie',
                radius: ['30%', '60%'],
                center: ['40%', '50%'],
                data: [
                    { value: 35, name: '机械故障', itemStyle: { color: danger } },
                    { value: 28, name: '电气故障', itemStyle: { color: warning } },
                    { value: 20, name: '通讯故障', itemStyle: { color: accent } },
                    { value: 15, name: '软件故障', itemStyle: { color: '#8b5cf6' } },
                    { value: 12, name: '其他', itemStyle: { color: '#64748b' } }
                ],
                itemStyle: {
                    borderRadius: 4,
                    borderColor: bg2,
                    borderWidth: 2
                },
                label: { show: false }
            }]
        });
        window.addEventListener('resize', function() { faultTypeChart.resize(); });
    }

    // --- 月度产能趋势 ---
    var productionChartEl = document.getElementById('productionChart');
    if (productionChartEl) {
        var productionChart = echarts.init(productionChartEl, null, { renderer: 'svg' });
        productionChart.setOption({
            tooltip: {
                trigger: 'axis',
                backgroundColor: bg2,
                borderColor: rule,
                textStyle: { color: ink }
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
                data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                axisLine: { lineStyle: { color: rule } },
                axisLabel: { color: muted }
            },
            yAxis: {
                type: 'value',
                name: '产量(万件)',
                nameTextStyle: { color: muted },
                axisLine: { lineStyle: { color: rule } },
                axisLabel: { color: muted },
                splitLine: { lineStyle: { color: rule } }
            },
            series: [{
                type: 'bar',
                data: [12.5, 13.8, 14.2, 15.6, 16.8, 17.5, 18.2, 17.8, 16.5, 15.8, 14.5, 13.2],
                barWidth: 30,
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: accent },
                            { offset: 1, color: accent2 }
                        ]
                    },
                    borderRadius: [4, 4, 0, 0]
                }
            }]
        });
        window.addEventListener('resize', function() { productionChart.resize(); });
    }

    // --- 设备效率排名 ---
    var efficiencyChartEl = document.getElementById('efficiencyChart');
    if (efficiencyChartEl) {
        var efficiencyChart = echarts.init(efficiencyChartEl, null, { renderer: 'svg' });
        efficiencyChart.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: bg2,
                borderColor: rule,
                textStyle: { color: ink }
            },
            grid: {
                left: '3%',
                right: '15%',
                bottom: '3%',
                top: '5%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                max: 100,
                axisLine: { lineStyle: { color: rule } },
                axisLabel: { color: muted },
                splitLine: { lineStyle: { color: rule } }
            },
            yAxis: {
                type: 'category',
                data: [
                    '焊接机器人-R01',
                    '装配线-L01',
                    '注塑机-P01',
                    'CNC加工-A01',
                    '冲压机床-S01',
                    '检测设备-D01',
                    '注塑机-P02',
                    'CNC加工-A02'
                ],
                axisLine: { lineStyle: { color: rule } },
                axisLabel: { color: ink }
            },
            series: [{
                type: 'bar',
                data: [
                    { value: 96, itemStyle: { color: accent2 } },
                    { value: 93, itemStyle: { color: accent2 } },
                    { value: 91, itemStyle: { color: accent } },
                    { value: 88, itemStyle: { color: accent } },
                    { value: 85, itemStyle: { color: warning } },
                    { value: 82, itemStyle: { color: warning } },
                    { value: 78, itemStyle: { color: warning } },
                    { value: 75, itemStyle: { color: danger } }
                ],
                barWidth: 20,
                itemStyle: { borderRadius: [0, 4, 4, 0] },
                label: {
                    show: true,
                    position: 'right',
                    color: ink,
                    formatter: '{c}%'
                }
            }]
        });
        window.addEventListener('resize', function() { efficiencyChart.resize(); });
    }

    // --- 实时数据采集图表 ---
    function initRealtimeChart() {
        var realtimeChartEl = document.getElementById('realtimeChart');
        if (realtimeChartEl) {
            var realtimeChart = echarts.init(realtimeChartEl, null, { renderer: 'svg' });
            
            // 生成模拟数据
            var now = new Date();
            var data = [];
            var timeData = [];
            for (var i = 29; i >= 0; i--) {
                var t = new Date(now - i * 5000);
                timeData.push(t.toLocaleTimeString());
                data.push(Math.floor(Math.random() * 80 + 20));
            }
            
            realtimeChart.setOption({
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: bg2,
                    borderColor: rule,
                    textStyle: { color: ink }
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
                    boundaryGap: false,
                    data: timeData,
                    axisLine: { lineStyle: { color: rule } },
                    axisLabel: { 
                        color: muted,
                        rotate: 30,
                        fontSize: 10
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '数据量',
                    nameTextStyle: { color: muted },
                    axisLine: { lineStyle: { color: rule } },
                    axisLabel: { color: muted },
                    splitLine: { lineStyle: { color: rule } }
                },
                series: [{
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    data: data,
                    lineStyle: { color: accent, width: 2 },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: accent + '30' },
                                { offset: 1, color: accent + '05' }
                            ]
                        }
                    }
                }]
            });
            
            // 实时更新
            setInterval(function() {
                now = new Date();
                timeData.shift();
                timeData.push(now.toLocaleTimeString());
                data.shift();
                data.push(Math.floor(Math.random() * 80 + 20));
                
                realtimeChart.setOption({
                    xAxis: { data: timeData },
                    series: [{ data: data }]
                });
            }, 5000);
            
            window.addEventListener('resize', function() { realtimeChart.resize(); });
        }
    }

    // 初始化实时图表
    initRealtimeChart();

    // --- 数据分析页图表初始化 ---
    function initAnalysisCharts() {
        // 设备利用率
        var utilChartEl = document.getElementById('utilizationChart');
        if (utilChartEl && !utilChartEl.getAttribute('data-init')) {
            utilChartEl.setAttribute('data-init', 'true');
            var utilChart = echarts.init(utilChartEl, null, { renderer: 'svg' });
            utilChart.setOption({
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: bg2,
                    borderColor: rule,
                    textStyle: { color: ink }
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
                    data: ['车间A', '车间B', '车间C', '车间D', '车间E', '车间F'],
                    axisLine: { lineStyle: { color: rule } },
                    axisLabel: { color: muted }
                },
                yAxis: {
                    type: 'value',
                    max: 100,
                    axisLine: { lineStyle: { color: rule } },
                    axisLabel: { color: muted },
                    splitLine: { lineStyle: { color: rule } }
                },
                series: [{
                    type: 'bar',
                    data: [87, 96, 90, 95, 93, 85],
                    barWidth: 40,
                    itemStyle: {
                        color: accent,
                        borderRadius: [4, 4, 0, 0]
                    },
                    label: {
                        show: true,
                        position: 'top',
                        color: ink,
                        formatter: '{c}%'
                    }
                }]
            });
            window.addEventListener('resize', function() { utilChart.resize(); });
        }

        // 故障类型
        var faultChartEl = document.getElementById('faultTypeChart');
        if (faultChartEl && !faultChartEl.getAttribute('data-init')) {
            faultChartEl.setAttribute('data-init', 'true');
            var faultChart = echarts.init(faultChartEl, null, { renderer: 'svg' });
            faultChart.setOption({
                tooltip: {
                    trigger: 'item',
                    backgroundColor: bg2,
                    borderColor: rule,
                    textStyle: { color: ink }
                },
                legend: {
                    orient: 'vertical',
                    right: 10,
                    top: 'center',
                    textStyle: { color: muted }
                },
                series: [{
                    type: 'pie',
                    radius: ['30%', '60%'],
                    center: ['40%', '50%'],
                    data: [
                        { value: 35, name: '机械故障', itemStyle: { color: danger } },
                        { value: 28, name: '电气故障', itemStyle: { color: warning } },
                        { value: 20, name: '通讯故障', itemStyle: { color: accent } },
                        { value: 15, name: '软件故障', itemStyle: { color: '#8b5cf6' } },
                        { value: 12, name: '其他', itemStyle: { color: '#64748b' } }
                    ],
                    itemStyle: {
                        borderRadius: 4,
                        borderColor: bg2,
                        borderWidth: 2
                    },
                    label: { show: false }
                }]
            });
            window.addEventListener('resize', function() { faultChart.resize(); });
        }

        // 月度产能
        var prodChartEl = document.getElementById('productionChart');
        if (prodChartEl && !prodChartEl.getAttribute('data-init')) {
            prodChartEl.setAttribute('data-init', 'true');
            var prodChart = echarts.init(prodChartEl, null, { renderer: 'svg' });
            prodChart.setOption({
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: bg2,
                    borderColor: rule,
                    textStyle: { color: ink }
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
                    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
                    axisLine: { lineStyle: { color: rule } },
                    axisLabel: { color: muted }
                },
                yAxis: {
                    type: 'value',
                    name: '产量(万件)',
                    nameTextStyle: { color: muted },
                    axisLine: { lineStyle: { color: rule } },
                    axisLabel: { color: muted },
                    splitLine: { lineStyle: { color: rule } }
                },
                series: [{
                    type: 'bar',
                    data: [12.5, 13.8, 14.2, 15.6, 16.8, 18.2],
                    barWidth: 30,
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: accent },
                                { offset: 1, color: accent2 }
                            ]
                        },
                        borderRadius: [4, 4, 0, 0]
                    }
                }]
            });
            window.addEventListener('resize', function() { prodChart.resize(); });
        }

        // 设备效率排名
        var effChartEl = document.getElementById('efficiencyChart');
        if (effChartEl && !effChartEl.getAttribute('data-init')) {
            effChartEl.setAttribute('data-init', 'true');
            var effChart = echarts.init(effChartEl, null, { renderer: 'svg' });
            effChart.setOption({
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: bg2,
                    borderColor: rule,
                    textStyle: { color: ink }
                },
                grid: {
                    left: '3%',
                    right: '15%',
                    bottom: '3%',
                    top: '5%',
                    containLabel: true
                },
                xAxis: {
                    type: 'value',
                    max: 100,
                    axisLine: { lineStyle: { color: rule } },
                    axisLabel: { color: muted },
                    splitLine: { lineStyle: { color: rule } }
                },
                yAxis: {
                    type: 'category',
                    data: [
                        '焊接机器人-R01',
                        '装配线-L01',
                        '注塑机-P01',
                        'CNC加工-A01',
                        '冲压机床-S01',
                        '检测设备-D01',
                        '注塑机-P02',
                        'CNC加工-A02'
                    ],
                    axisLine: { lineStyle: { color: rule } },
                    axisLabel: { color: ink }
                },
                series: [{
                    type: 'bar',
                    data: [96, 93, 91, 88, 85, 82, 78, 75],
                    barWidth: 20,
                    itemStyle: {
                        color: function(params) {
                            var val = params.value;
                            if (val >= 90) return accent2;
                            if (val >= 80) return accent;
                            if (val >= 70) return warning;
                            return danger;
                        },
                        borderRadius: [0, 4, 4, 0]
                    },
                    label: {
                        show: true,
                        position: 'right',
                        color: ink,
                        formatter: '{c}%'
                    }
                }]
            });
            window.addEventListener('resize', function() { effChart.resize(); });
        }
    }

    // 暴露给全局
    window.initAnalysisCharts = initAnalysisCharts;
    window.initRealtimeChart = initRealtimeChart;
})();