const ChartManager = {
    utilizationChart: null,
    memoryChart: null,
    utilizationData: [],
    memoryData: [],
    labels: [],

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: Config.CHART.ANIMATION_DURATION,
                easing: Config.CHART.ANIMATION_EASING
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        color: Config.COLORS.GRID
                    }
                },
                y: {
                    beginAtZero: true,
                    max: Config.CHART.Y_AXIS_MAX,
                    grid: {
                        color: Config.COLORS.GRID
                    },
                    ticks: {
                        color: Config.COLORS.AXIS,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: Config.COLORS.TOOLTIP_BG,
                    titleColor: Config.COLORS.TOOLTIP_TITLE,
                    bodyColor: Config.COLORS.TOOLTIP_BODY,
                    borderColor: Config.COLORS.TOOLTIP_BORDER,
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + '%';
                        }
                    }
                }
            },
            elements: {
                point: {
                    radius: Config.CHART.POINT_RADIUS,
                    hoverRadius: Config.CHART.POINT_HOVER_RADIUS
                },
                line: {
                    tension: Config.CHART.LINE_TENSION,
                    borderWidth: Config.CHART.BORDER_WIDTH
                }
            }
        };
    },

    initCharts() {
        const chartOptions = this.getChartOptions();

        const utilCtx = document.getElementById('utilizationChart').getContext('2d');
        this.utilizationChart = new Chart(utilCtx, {
            type: 'line',
            data: {
                labels: this.labels,
                datasets: [{
                    data: this.utilizationData,
                    borderColor: Config.COLORS.UTILIZATION_LINE,
                    backgroundColor: Config.COLORS.UTILIZATION_FILL,
                    fill: true
                }]
            },
            options: chartOptions
        });

        const memCtx = document.getElementById('memoryChart').getContext('2d');
        this.memoryChart = new Chart(memCtx, {
            type: 'line',
            data: {
                labels: this.labels,
                datasets: [{
                    data: this.memoryData,
                    borderColor: Config.COLORS.MEMORY_LINE,
                    backgroundColor: Config.COLORS.MEMORY_FILL,
                    fill: true
                }]
            },
            options: chartOptions
        });
    },

    updateCharts(utilization, memoryPercent) {
        const timeLabel = Utils.formatTime();

        this.labels.push(timeLabel);
        this.utilizationData.push(utilization);
        this.memoryData.push(memoryPercent);

        if (this.labels.length > Config.CHART.MAX_DATA_POINTS) {
            this.labels.shift();
            this.utilizationData.shift();
            this.memoryData.shift();
        }

        this.utilizationChart.update();
        this.memoryChart.update();
    },

    getUtilizationData() {
        return this.utilizationData;
    },

    getMemoryData() {
        return this.memoryData;
    }
};
