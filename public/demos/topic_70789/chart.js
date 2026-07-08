// ===== 图表渲染模块 =====

const Charts = {
    // 雷达图实例缓存
    radarCharts: {},
    barCharts: {},
    
    // 销毁图表实例
    destroyChart: function(chartId) {
        if (this.radarCharts[chartId]) {
            this.radarCharts[chartId].destroy();
            delete this.radarCharts[chartId];
        }
        if (this.barCharts[chartId]) {
            this.barCharts[chartId].destroy();
            delete this.barCharts[chartId];
        }
    },
    
    // 渲染雷达图
    renderRadarChart: function(containerId, externalScores, internalScores, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Chart container not found: ${containerId}`);
            return;
        }
        
        const dimensionOrder = Cases.getDimensionOrder();
        const labels = dimensionOrder.map(dim => Cases.dimensionNames[dim]);
        const externalData = dimensionOrder.map(dim => externalScores[dim]?.score || 0);
        const internalData = dimensionOrder.map(dim => internalScores[dim] || 0);
        
        const config = {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '外部评估',
                        data: externalData,
                        backgroundColor: 'rgba(19, 122, 168, 0.2)',
                        borderColor: 'rgba(19, 122, 168, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(19, 122, 168, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(19, 122, 168, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: '内在感受',
                        data: internalData,
                        backgroundColor: 'rgba(15, 124, 79, 0.2)',
                        borderColor: 'rgba(15, 124, 79, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(15, 124, 79, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(15, 124, 79, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                scales: {
                    r: {
                        min: 0,
                        max: 5,
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 10
                            },
                            color: '#718096'
                        },
                        grid: {
                            color: '#e2e8f0',
                            circular: true
                        },
                        angleLines: {
                            color: '#e2e8f0'
                        },
                        pointLabels: {
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            color: '#022136'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            },
                            color: '#4a5568'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 46, 0.9)',
                        titleFont: {
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value}/5`;
                            }
                        }
                    }
                },
                ...options
            }
        };
        
        this.destroyChart(containerId);
        this.radarCharts[containerId] = new Chart(container, config);
        return this.radarCharts[containerId];
    },
    
    // 渲染柱状图（内外对比）
    renderBarChart: function(containerId, externalScores, internalScores, maxGapDimension = null, options = {}) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`[Charts] Container not found: ${containerId}`);
                return;
            }
            
            if (typeof Chart === 'undefined') {
                console.error('[Charts] Chart.js not loaded');
                this.renderBarChartFallback(containerId, externalScores, internalScores, maxGapDimension);
                return;
            }
            
            console.log(`[Charts] Rendering bar chart: ${containerId}`);
            console.log(`[Charts] External scores:`, externalScores);
            console.log(`[Charts] Internal scores:`, internalScores);
            
            const dimensionOrder = Cases.getDimensionOrder();
            console.log(`[Charts] Dimension order:`, dimensionOrder);
            
            const labels = dimensionOrder.map(dim => Cases.dimensionNames[dim]);
            const externalData = dimensionOrder.map(dim => {
                const score = externalScores[dim]?.score || 0;
                const numScore = typeof score === 'number' ? score : parseFloat(score) || 0;
                return Math.min(5, Math.max(0, numScore));
            });
            const internalData = dimensionOrder.map(dim => {
                const score = internalScores[dim] || 0;
                const numScore = typeof score === 'number' ? score : parseFloat(score) || 0;
                return Math.min(5, Math.max(0, numScore));
            });
            
            console.log(`[Charts] Labels:`, labels);
            console.log(`[Charts] External data:`, externalData);
            console.log(`[Charts] Internal data:`, internalData);
            
            const hasValidData = externalData.some(v => v > 0) || internalData.some(v => v > 0);
            if (!hasValidData) {
                console.warn('[Charts] No valid data to render, showing fallback');
                this.renderBarChartFallback(containerId, externalScores, internalScores, maxGapDimension);
                return;
            }
            
            const ctx = container.getContext ? container.getContext('2d') : null;
            if (!ctx) {
                console.error('[Charts] Cannot get 2D context from container');
                return;
            }
            
            const config = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '外部评估',
                            data: externalData,
                            backgroundColor: 'rgba(19, 122, 168, 0.8)',
                            borderColor: 'rgba(19, 122, 168, 1)',
                            borderWidth: 1,
                            borderRadius: 6,
                            barPercentage: 0.8,
                            categoryPercentage: 0.7
                        },
                        {
                            label: '内在感受',
                            data: internalData,
                            backgroundColor: 'rgba(15, 124, 79, 0.8)',
                            borderColor: 'rgba(15, 124, 79, 1)',
                            borderWidth: 1,
                            borderRadius: 6,
                            barPercentage: 0.8,
                            categoryPercentage: 0.7
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 800,
                        easing: 'easeOutQuart'
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 12,
                                    weight: '600'
                                },
                                color: '#1a202c'
                            }
                        },
                        y: {
                            min: 0,
                            max: 5,
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                font: {
                                    size: 11
                                },
                                color: '#718096'
                            },
                            grid: {
                                color: '#e2e8f0'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 12
                                },
                                color: '#4a5568'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(26, 26, 46, 0.9)',
                            titleFont: {
                                size: 14,
                                weight: '600'
                            },
                            bodyFont: {
                                size: 13
                            },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.raw || 0;
                                    return `${label}: ${value}/5`;
                                }
                            }
                        }
                    },
                    ...options
                }
            };
            
            this.destroyChart(containerId);
            
            try {
                this.barCharts[containerId] = new Chart(ctx, config);
                console.log(`[Charts] Bar chart created successfully: ${containerId}`);
                return this.barCharts[containerId];
            } catch (chartError) {
                console.error(`[Charts] Failed to create chart:`, chartError);
                console.error(`[Charts] Chart.js version:`, Chart.version);
                this.renderBarChartFallback(containerId, externalScores, internalScores, maxGapDimension);
            }
        } catch (error) {
            console.error(`[Charts] Unexpected error in renderBarChart:`, error);
            this.renderBarChartFallback(containerId, externalScores, internalScores, maxGapDimension);
        }
    },
    
    // 渲染差距柱状图（高亮显示）
    renderGapChart: function(containerId, externalScores, internalScores, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Chart container not found: ${containerId}`);
            return;
        }
        
        const dimensionOrder = Cases.getDimensionOrder();
        const labels = dimensionOrder.map(dim => Cases.dimensionNames[dim]);
        const gaps = dimensionOrder.map(dim => {
            const external = externalScores[dim]?.score || 0;
            const internal = internalScores[dim] || 0;
            return external - internal;
        });
        
        const colors = gaps.map(gap => {
            if (gap >= 1.5) return 'rgba(243, 149, 47, 0.8)';
            if (gap <= -1.5) return 'rgba(15, 124, 79, 0.8)';
            return 'rgba(113, 128, 150, 0.5)';
        });
        
        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '内外差距',
                        data: gaps,
                        backgroundColor: colors,
                        borderColor: colors.map(c => c.replace('0.8', '1').replace('0.5', '0.8')),
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.6,
                        categoryPercentage: 0.5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            color: '#1a202c'
                        }
                    },
                    y: {
                        min: -5,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 11
                            },
                            color: '#718096'
                        },
                        grid: {
                            color: '#e2e8f0'
                        },
                        zeroLine: {
                            color: '#cbd5e0',
                            width: 2
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 46, 0.9)',
                        titleFont: {
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const gap = context.raw || 0;
                                const type = gap > 0 ? '外高内低' : gap < 0 ? '内高外低' : '基本一致';
                                return `差距: ${gap > 0 ? '+' : ''}${gap.toFixed(1)} | ${type}`;
                            }
                        }
                    }
                },
                ...options
            }
        };
        
        this.destroyChart(containerId);
        this.barCharts[containerId] = new Chart(container, config);
        return this.barCharts[containerId];
    },
    
    // 渲染评分环形图
    renderScoreDonut: function(containerId, score, maxScore = 5, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Chart container not found: ${containerId}`);
            return;
        }
        
        const percentage = (score / maxScore) * 100;
        const remaining = maxScore - score;
        
        const config = {
            type: 'doughnut',
            data: {
                labels: ['已达成', '剩余'],
                datasets: [
                    {
                        data: [score, remaining],
                        backgroundColor: [
                            'rgba(19, 122, 168, 1)',
                            'rgba(226, 232, 240, 1)'
                        ],
                        borderColor: [
                            'rgba(19, 122, 168, 1)',
                            'rgba(226, 232, 240, 1)'
                        ],
                        borderWidth: 0,
                        cutout: '80%'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                ...options
            }
        };
        
        this.destroyChart(containerId);
        const chart = new Chart(container, config);
        
        const centerText = document.createElement('div');
        centerText.style.position = 'absolute';
        centerText.style.top = '50%';
        centerText.style.left = '50%';
        centerText.style.transform = 'translate(-50%, -50%)';
        centerText.style.textAlign = 'center';
        centerText.style.pointerEvents = 'none';
        centerText.innerHTML = `
            <div style="font-size: 2rem; font-weight: 700; color: #1a202c;">${score}</div>
            <div style="font-size: 0.875rem; color: #718096;">/ ${maxScore}</div>
        `;
        container.appendChild(centerText);
        
        return chart;
    },
    
    // 渲染进度条
    renderProgressBar: function(containerId, progress, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Progress container not found: ${containerId}`);
            return;
        }
        
        const { 
            color = '#137aa8', 
            backgroundColor = '#e2e8f0',
            height = '6px',
            borderRadius = '9999px'
        } = options;
        
        container.innerHTML = `
            <div style="
                height: ${height};
                background-color: ${backgroundColor};
                border-radius: ${borderRadius};
                overflow: hidden;
                width: 100%;
            ">
                <div style="
                    height: 100%;
                    background: linear-gradient(90deg, ${color}, #2199d4);
                    border-radius: ${borderRadius};
                    width: ${progress}%;
                    transition: width 0.5s ease;
                "></div>
            </div>
        `;
    },
    
    // 更新图表数据（增量更新）
    updateChartData: function(chartId, externalScores, internalScores) {
        const radarChart = this.radarCharts[chartId];
        const barChart = this.barCharts[chartId];
        
        if (radarChart) {
            const dimensionOrder = Cases.getDimensionOrder();
            radarChart.data.datasets[0].data = dimensionOrder.map(dim => externalScores[dim]?.score || 0);
            radarChart.data.datasets[1].data = dimensionOrder.map(dim => internalScores[dim] || 0);
            radarChart.update('none');
        }
        
        if (barChart) {
            const dimensionOrder = Cases.getDimensionOrder();
            barChart.data.datasets[0].data = dimensionOrder.map(dim => externalScores[dim]?.score || 0);
            barChart.data.datasets[1].data = dimensionOrder.map(dim => internalScores[dim] || 0);
            barChart.update('none');
        }
    },
    
    // 动画过渡到新数据
    animateToData: function(chartId, newExternalScores, newInternalScores, duration = 800) {
        const radarChart = this.radarCharts[chartId];
        const barChart = this.barCharts[chartId];
        
        if (!radarChart && !barChart) return;
        
        const dimensionOrder = Cases.getDimensionOrder();
        const startExternal = radarChart ? radarChart.data.datasets[0].data : [];
        const startInternal = radarChart ? radarChart.data.datasets[1].data : [];
        
        const targetExternal = dimensionOrder.map(dim => newExternalScores[dim]?.score || 0);
        const targetInternal = dimensionOrder.map(dim => newInternalScores[dim] || 0);
        
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            const currentExternal = targetExternal.map((target, i) => 
                startExternal[i] + (target - startExternal[i]) * easeOut
            );
            const currentInternal = targetInternal.map((target, i) => 
                startInternal[i] + (target - startInternal[i]) * easeOut
            );
            
            if (radarChart) {
                radarChart.data.datasets[0].data = currentExternal;
                radarChart.data.datasets[1].data = currentInternal;
                radarChart.update('none');
            }
            
            if (barChart) {
                barChart.data.datasets[0].data = currentExternal;
                barChart.data.datasets[1].data = currentInternal;
                barChart.update('none');
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // 检查Chart.js是否加载
    isChartJsLoaded: function() {
        return typeof Chart !== 'undefined' && typeof Chart === 'function';
    },
    
    // 获取Chart.js版本
    getChartJsVersion: function() {
        if (this.isChartJsLoaded()) {
            return Chart.version || 'unknown';
        }
        return 'not loaded';
    },
    
    // 预加载Chart.js（备用方案）
    loadChartJs: function(callback) {
        if (this.isChartJsLoaded()) {
            console.log(`[Charts] Chart.js already loaded, version: ${this.getChartJsVersion()}`);
            callback();
            return;
        }
        
        console.log('[Charts] Loading Chart.js from CDN...');
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js';
        script.onload = () => {
            console.log(`[Charts] Chart.js loaded successfully, version: ${this.getChartJsVersion()}`);
            callback();
        };
        script.onerror = () => {
            console.error('[Charts] Failed to load Chart.js from CDN');
            callback();
        };
        document.head.appendChild(script);
    },
    
    // 雷达图降级方案（HTML表格）
    renderRadarChartFallback: function(containerId, externalScores, internalScores) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const dimensionOrder = Cases.getDimensionOrder();
        
        let html = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                    <thead>
                        <tr style="background: var(--bg-secondary);">
                            <th style="padding: var(--spacing-md); text-align: left; border-bottom: 2px solid var(--border-medium);">维度</th>
                            <th style="padding: var(--spacing-md); text-align: center; border-bottom: 2px solid var(--border-medium);">外部评估</th>
                            <th style="padding: var(--spacing-md); text-align: center; border-bottom: 2px solid var(--border-medium);">内在感受</th>
                            <th style="padding: var(--spacing-md); text-align: center; border-bottom: 2px solid var(--border-medium);">差距</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        dimensionOrder.forEach(dim => {
            const external = externalScores[dim]?.score || 0;
            const internal = internalScores[dim] || 0;
            const gap = external - internal;
            const gapColor = gap >= 1.5 ? 'color: var(--warm-orange)' : gap <= -1.5 ? 'color: var(--secondary-green)' : 'color: var(--text-muted)';
            const gapText = gap > 0 ? `+${gap.toFixed(1)}` : gap.toFixed(1);
            
            html += `
                <tr style="border-bottom: 1px solid var(--border-light);">
                    <td style="padding: var(--spacing-md); font-weight: 600; color: var(--text-primary);">${Cases.dimensionNames[dim]}</td>
                    <td style="padding: var(--spacing-md); text-align: center;">
                        <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #137aa8, #2199d4); color: white; font-weight: 700;">${external}</span>
                    </td>
                    <td style="padding: var(--spacing-md); text-align: center;">
                        <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #0f7c4f, #aad4e6); color: white; font-weight: 700;">${internal}</span>
                    </td>
                    <td style="padding: var(--spacing-md); text-align: center; font-weight: 600; ${gapColor};">${gapText}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
                <div style="text-align: center; margin-top: var(--spacing-md); font-size: 0.75rem; color: var(--text-muted);">
                    图表加载失败，显示数据表格
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // 柱状图降级方案（HTML进度条）
    renderBarChartFallback: function(containerId, externalScores, internalScores, maxGapDimension) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const dimensionOrder = Cases.getDimensionOrder();
        
        let html = `
            <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
        `;
        
        dimensionOrder.forEach(dim => {
            const external = externalScores[dim]?.score || 0;
            const internal = internalScores[dim] || 0;
            const isMaxGap = dim === maxGapDimension;
            const externalPct = (external / 5) * 100;
            const internalPct = (internal / 5) * 100;
            
            html += `
                <div style="padding: var(--spacing-md); background: ${isMaxGap ? 'rgba(243, 149, 47, 0.05)' : 'var(--bg-secondary)'}; border-radius: var(--radius-md); border-left: ${isMaxGap ? '4px solid var(--warm-orange)' : '4px solid var(--border-light)'};">
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm);">
                        <span style="font-weight: 600; color: var(--text-primary);">${Cases.dimensionNames[dim]}</span>
                        <span style="font-size: 0.875rem; color: var(--text-muted);">
                            <span style="color: #137aa8;">外${external}</span> / <span style="color: #0f7c4f;">内${internal}</span>
                        </span>
                    </div>
                    <div style="display: flex; gap: var(--spacing-sm);">
                        <div style="flex: 1;">
                            <div style="font-size: 0.625rem; color: var(--text-muted); margin-bottom: 4px;">外部评估</div>
                            <div style="height: 20px; background: var(--border-light); border-radius: var(--radius-sm); overflow: hidden;">
                                <div style="height: 100%; background: linear-gradient(90deg, #137aa8, #2199d4); width: ${externalPct}%; border-radius: var(--radius-sm); transition: width 0.8s ease;"></div>
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.625rem; color: var(--text-muted); margin-bottom: 4px;">内在感受</div>
                            <div style="height: 20px; background: var(--border-light); border-radius: var(--radius-sm); overflow: hidden;">
                                <div style="height: 100%; background: linear-gradient(90deg, #0f7c4f, #aad4e6); width: ${internalPct}%; border-radius: var(--radius-sm); transition: width 0.8s ease;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                <div style="text-align: center; margin-top: var(--spacing-md); font-size: 0.75rem; color: var(--text-muted);">
                    图表加载失败，显示数据进度条
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // 安全渲染雷达图（带降级）
    safeRenderRadarChart: function(containerId, externalScores, internalScores, options = {}) {
        this.loadChartJs(() => {
            if (this.isChartJsLoaded()) {
                this.renderRadarChart(containerId, externalScores, internalScores, options);
            } else {
                this.renderRadarChartFallback(containerId, externalScores, internalScores);
            }
        });
    },
    
    // 安全渲染柱状图（带降级）
    safeRenderBarChart: function(containerId, externalScores, internalScores, maxGapDimension = null, options = {}) {
        console.log(`[Charts] safeRenderBarChart called for: ${containerId}`);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[Charts] Container not found: ${containerId}`);
            return;
        }
        
        if (!externalScores || !internalScores) {
            console.error('[Charts] Missing data for bar chart');
            this.renderBarChartFallback(containerId, externalScores || {}, internalScores || {}, maxGapDimension);
            return;
        }
        
        this.loadChartJs(() => {
            if (this.isChartJsLoaded()) {
                console.log(`[Charts] Chart.js loaded, version: ${this.getChartJsVersion()}`);
                this.renderBarChart(containerId, externalScores, internalScores, maxGapDimension, options);
            } else {
                console.warn('[Charts] Chart.js not loaded, using fallback');
                this.renderBarChartFallback(containerId, externalScores, internalScores, maxGapDimension);
            }
        });
    }
};

// 全局暴露
window.Charts = Charts;