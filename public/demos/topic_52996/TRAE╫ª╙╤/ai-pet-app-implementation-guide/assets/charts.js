// charts.js - ECharts图表初始化
(function() {
    var style = getComputedStyle(document.documentElement);
    var accent = style.getPropertyValue('--accent').trim();
    var accent2 = style.getPropertyValue('--accent2').trim();
    var accent3 = style.getPropertyValue('--accent3').trim();
    var ink = style.getPropertyValue('--ink').trim();
    var muted = style.getPropertyValue('--muted').trim();
    var rule = style.getPropertyValue('--rule').trim();
    var bg2 = style.getPropertyValue('--bg2').trim();

    // --- Chart 1: 实施路线图 (Gantt) ---
    var chart1 = echarts.init(document.getElementById('chart-timeline'), null, { renderer: 'svg' });
    
    // 甘特图数据：[开始周, 持续周数, 任务名, 阶段]
    var phases = [
        // Phase 1: 3D形象生成 (Week 1-3)
        {name: '3D模型美术外包', start: 0, dur: 3, phase: 1},
        {name: 'AI视觉服务搭建', start: 0, dur: 2, phase: 1},
        {name: 'SD纹理生成Pipeline', start: 1, dur: 2, phase: 1},
        {name: 'Unity客户端集成', start: 2, dur: 1, phase: 1},
        // Phase 2: 生命感交互 (Week 4-6)
        {name: 'LLM对话系统', start: 3, dur: 2, phase: 2},
        {name: '情感状态机', start: 3, dur: 1, phase: 2},
        {name: '触摸物理反馈', start: 4, dur: 2, phase: 2},
        {name: '动画状态机集成', start: 5, dur: 1, phase: 2},
        // Phase 3: 多模态与成长 (Week 7-8)
        {name: 'TTS/ASR语音集成', start: 6, dur: 1, phase: 3},
        {name: '成长系统+云端同步', start: 6, dur: 2, phase: 3},
        {name: 'Addressables热更新', start: 7, dur: 1, phase: 3},
        {name: '测试与发布准备', start: 7, dur: 1, phase: 3}
    ];
    
    var phaseColors = {
        1: accent,
        2: accent2,
        3: accent3
    };
    
    var phaseNames = {
        1: '阶段一：3D形象生成',
        2: '阶段二：生命感交互',
        3: '阶段三：多模态成长'
    };
    
    chart1.setOption({
        title: {
            text: '8周MVP开发甘特图',
            left: 'center',
            textStyle: { fontSize: 14, color: ink, fontWeight: 600 }
        },
        tooltip: {
            trigger: 'item',
            appendToBody: true,
            formatter: function(p) {
                var d = p.data;
                return '<b>' + d[3] + '</b><br/>第' + (d[0]+1) + '-' + (d[0]+d[1]) + '周<br/>' + phaseNames[d[4]];
            }
        },
        legend: {
            bottom: 0,
            data: ['阶段一：3D形象生成', '阶段二：生命感交互', '阶段三：多模态成长'],
            textStyle: { color: muted, fontSize: 12 },
            itemWidth: 12,
            itemHeight: 12
        },
        grid: {
            left: '18%',
            right: '5%',
            top: '12%',
            bottom: '15%'
        },
        xAxis: {
            type: 'value',
            min: 0,
            max: 8,
            interval: 1,
            axisLabel: {
                formatter: function(v) { return '第' + (v+1) + '周'; },
                color: muted,
                fontSize: 11
            },
            splitLine: { lineStyle: { color: rule, type: 'dashed' } },
            axisLine: { lineStyle: { color: rule } }
        },
        yAxis: {
            type: 'category',
            data: phases.map(function(p) { return p.name; }).reverse(),
            axisLabel: { color: ink, fontSize: 12 },
            axisLine: { lineStyle: { color: rule } },
            axisTick: { show: false }
        },
        series: [{
            type: 'custom',
            renderItem: function(params, api) {
                var start = api.coord([api.value(0), api.value(1)]);
                var end = api.coord([api.value(0) + api.value(1), api.value(1)]);
                var height = api.size([0, 1])[1] * 0.6;
                var phase = api.value(4);
                
                return {
                    type: 'rect',
                    shape: {
                        x: start[0],
                        y: start[1] - height / 2,
                        width: end[0] - start[0],
                        height: height,
                        r: 4
                    },
                    style: {
                        fill: phaseColors[phase],
                        stroke: '#fff',
                        lineWidth: 1
                    }
                };
            },
            encode: { x: [0, 1], y: 2 },
            data: phases.map(function(p, i) {
                return [p.start, p.dur, i, p.name, p.phase];
            }).reverse()
        }],
        animation: false
    });
    
    window.addEventListener('resize', function() { chart1.resize(); });

    // --- Chart 2: 成本构成 (Pie) ---
    var chart2 = echarts.init(document.getElementById('chart-cost'), null, { renderer: 'svg' });
    
    chart2.setOption({
        title: {
            text: 'MVP总成本约26万元',
            subtext: '8周开发周期',
            left: 'center',
            textStyle: { fontSize: 16, color: ink, fontWeight: 700 },
            subtextStyle: { color: muted, fontSize: 13 }
        },
        tooltip: {
            trigger: 'item',
            appendToBody: true,
            formatter: '{b}: {c}元 ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: '5%',
            top: 'middle',
            textStyle: { color: ink, fontSize: 13 },
            itemWidth: 14,
            itemHeight: 14
        },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['65%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 8,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: true,
                formatter: '{d}%',
                fontSize: 14,
                fontWeight: 600,
                color: ink
            },
            labelLine: { show: true, length: 10, length2: 10 },
            data: [
                { value: 246000, name: '人力成本', itemStyle: { color: accent } },
                { value: 11100, name: '云服务器', itemStyle: { color: accent2 } },
                { value: 2200, name: '第三方API', itemStyle: { color: accent3 } },
                { value: 1488, name: '其他费用', itemStyle: { color: muted } }
            ]
        }],
        animation: false
    });
    
    window.addEventListener('resize', function() { chart2.resize(); });

    // --- Mermaid初始化 ---
    if (window.mermaid) {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'neutral',
            securityLevel: 'loose',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            }
        });
    }
})();
