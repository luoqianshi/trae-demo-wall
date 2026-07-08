/**
 * 学智云学习平台 - 图表工具
 */

const ChartsHelper = {
    /**
     * 创建学习进度环形图
     * @param {HTMLElement} container - 图表容器
     */
    createProgressChart(container) {
        if (!container) return;

        const myChart = echarts.init(container);
        const subjectStats = Storage.getSubjectStats();

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}%'
            },
            series: [
                {
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: false
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: '20',
                            fontWeight: 'bold'
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: [
                        { value: subjectStats.math.accuracy || 0, name: '数学', itemStyle: { color: '#4A90E2' } },
                        { value: subjectStats.chinese.accuracy || 0, name: '语文', itemStyle: { color: '#E67E22' } },
                        { value: subjectStats.english.accuracy || 0, name: '英语', itemStyle: { color: '#27AE60' } }
                    ]
                }
            ]
        };

        myChart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
            myChart.resize();
        });
    },

    /**
     * 创建学科对比柱状图
     * @param {HTMLElement} container - 图表容器
     */
    createSubjectBarChart(container) {
        if (!container) return;

        const myChart = echarts.init(container);
        const subjectStats = Storage.getSubjectStats();

        const option = {
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: ['数学', '语文', '英语', '物理', '化学', '生物', '科学']
            },
            yAxis: {
                type: 'value',
                name: '正确率 (%)',
                max: 100
            },
            series: [{
                data: [
                    { value: subjectStats.math.accuracy || 0, itemStyle: { color: '#4A90E2' } },
                    { value: subjectStats.chinese.accuracy || 0, itemStyle: { color: '#E67E22' } },
                    { value: subjectStats.english.accuracy || 0, itemStyle: { color: '#27AE60' } },
                    { value: subjectStats.physics.accuracy || 0, itemStyle: { color: '#9B59B6' } },
                    { value: subjectStats.chemistry.accuracy || 0, itemStyle: { color: '#E74C3C' } },
                    { value: subjectStats.biology.accuracy || 0, itemStyle: { color: '#16A085' } },
                    { value: subjectStats.science.accuracy || 0, itemStyle: { color: '#8E44AD' } }
                ],
                type: 'bar',
                barWidth: '60%'
            }]
        };

        myChart.setOption(option);
        window.addEventListener('resize', () => myChart.resize());
    },

    /**
     * 创建学习趋势折线图
     * @param {HTMLElement} container - 图表容器
     * @param {object} data - 图表数据
     */
    createTrendChart(container, data) {
        if (!container || !data) return;

        const myChart = echarts.init(container);

        const option = {
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: data.dates || []
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                data: data.values || [],
                type: 'line',
                smooth: true,
                itemStyle: {
                    color: '#4A90E2'
                },
                areaStyle: {
                    color: 'rgba(74, 144, 226, 0.1)'
                }
            }]
        };

        myChart.setOption(option);
        window.addEventListener('resize', () => myChart.resize());
    },

    /**
     * 创建雷达图（知识点掌握度）
     * @param {HTMLElement} container - 图表容器
     * @param {object} data - 图表数据
     */
    createRadarChart(container, data) {
        if (!container || !data) return;

        const myChart = echarts.init(container);

        const option = {
            tooltip: {},
            radar: {
                indicator: data.indicators || []
            },
            series: [{
                type: 'radar',
                data: [{
                    value: data.values || [],
                    name: '知识点掌握度',
                    itemStyle: {
                        color: '#4A90E2'
                    },
                    areaStyle: {
                        color: 'rgba(74, 144, 226, 0.3)'
                    }
                }]
            }]
        };

        myChart.setOption(option);
        window.addEventListener('resize', () => myChart.resize());
    }
};

window.ChartsHelper = ChartsHelper;