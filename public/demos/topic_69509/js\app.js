/**
 * 股析通 - 主应用脚本
 * 
 * 功能模块：
 * - 股票数据加载与管理
 * - 搜索功能与候选列表
 * - Tab 导航切换
 * - 股票切换与面板更新
 * - K线图与技术指标渲染
 * - 基本面分析展示
 * - 行业与宏观面分析
 * - AI智能解读
 */

'use strict';

// 应用命名空间
const GuXiTong = {
    stocks: [],
    currentStock: null,
    currentTab: 'overview',
    charts: {},

    init() {
        this.loadStocksData();
        this.bindEvents();
        this.initWindowResize();
    },

    initWindowResize() {
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.resizeAllCharts();
            }, 200);
        });
    },

    resizeAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    },

    async loadStocksData() {
        try {
            const response = await fetch('data/stocks.json');
            this.stocks = await response.json();
            console.log('股票数据加载成功，共', this.stocks.length, '只股票');
            
            if (this.stocks.length > 0) {
                this.selectStock(this.stocks[0].basic.code);
            }
        } catch (error) {
            console.error('股票数据加载失败:', error);
            this.updateStockInfo('数据加载失败');
        }
    },

    bindEvents() {
        this.initSearch();
        this.initTabs();
        this.initClickOutside();
    },

    initSearch() {
        const searchInput = document.getElementById('stockSearch');
        const searchResults = document.getElementById('searchResults');

        if (!searchInput || !searchResults) return;

        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim();
            this.handleSearch(keyword);
        });

        searchInput.addEventListener('focus', (e) => {
            const keyword = e.target.value.trim();
            if (keyword) {
                this.handleSearch(keyword);
            } else {
                this.showAllStocks();
            }
        });
    },

    initClickOutside() {
        document.addEventListener('click', (e) => {
            const searchContainer = document.querySelector('.search-container');
            const searchResults = document.getElementById('searchResults');
            
            if (searchContainer && !searchContainer.contains(e.target)) {
                searchResults.classList.add('hidden');
            }
        });
    },

    handleSearch(keyword) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (!keyword) {
            searchResults.classList.add('hidden');
            return;
        }

        const matchedStocks = this.stocks.filter(stock => {
            const code = stock.basic.code || '';
            const name = stock.basic.name || '';
            const lowerKeyword = keyword.toLowerCase();
            return code.toLowerCase().includes(lowerKeyword) || 
                   name.toLowerCase().includes(lowerKeyword);
        });

        this.renderSearchResults(matchedStocks);
    },

    showAllStocks() {
        this.renderSearchResults(this.stocks.slice(0, 10));
    },

    renderSearchResults(stocks) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (stocks.length === 0) {
            searchResults.innerHTML = `
                <div class="search-result-empty" style="padding: 24px; text-align: center; color: var(--text-tertiary);">
                    未找到匹配的股票
                </div>
            `;
        } else {
            searchResults.innerHTML = stocks.map(stock => `
                <div class="search-result-item" data-code="${stock.basic.code}">
                    <div class="search-result-left">
                        <span class="search-result-code">${stock.basic.code}</span>
                        <span class="search-result-name">${stock.basic.name}</span>
                    </div>
                    <span class="search-result-industry">${stock.basic.industry || ''}</span>
                </div>
            `).join('');

            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const code = item.dataset.code;
                    this.selectStock(code);
                    searchResults.classList.add('hidden');
                    const searchInput = document.getElementById('stockSearch');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                });
            });
        }

        searchResults.classList.remove('hidden');
    },

    initTabs() {
        const tabItems = document.querySelectorAll('.tab-item');
        
        tabItems.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    },

    switchTab(tabId) {
        this.currentTab = tabId;

        document.querySelectorAll('.tab-item').forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        document.querySelectorAll('.tab-panel').forEach(panel => {
            if (panel.id === tabId) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        setTimeout(() => {
            this.initAndResizeChartsForTab(tabId);
        }, 100);
    },

    initAndResizeChartsForTab(tabId) {
        const stock = this.currentStock;
        if (!stock) return;

        if (tabId === 'overview') {
            if (!this.charts.overviewRadar) {
                this.initOverviewRadar();
            }
            if (this.charts.overviewRadar) {
                const scores = (stock.summary || {}).scores || {};
                this.updateOverviewRadar(scores);
                this.charts.overviewRadar.resize();
            }
        } else if (tabId === 'technical') {
            const technical = stock.technical || {};
            const indicators = technical.indicators || {};

            if (!this.charts.kline) {
                this.initKLineChart();
            }
            if (!this.charts.indicator) {
                this.initIndicatorChart();
            }
            if (this.charts.kline) {
                this.updateKLineChart();
                this.charts.kline.resize();
            }
            if (this.charts.indicator) {
                this.updateIndicatorChart(this.currentIndicator || 'macd');
                this.charts.indicator.resize();
            }
        } else if (tabId === 'fundamental') {
            const fundamental = stock.fundamental || {};

            if (!this.charts.fundamentalPie) {
                this.initFundamentalPieChart();
            }
            if (!this.charts.fundamentalTrend) {
                this.initFundamentalTrendChart();
            }
            if (this.charts.fundamentalPie) {
                this.updateFundamentalPieChart(fundamental.business_segments || []);
                this.charts.fundamentalPie.resize();
            }
            if (this.charts.fundamentalTrend) {
                this.updateFundamentalTrendChart(fundamental.financials || []);
                this.charts.fundamentalTrend.resize();
            }
        }
    },

    selectStock(code) {
        this.currentStock = this.stocks.find(s => s.basic.code === code);
        if (this.currentStock) {
            console.log('切换股票:', this.currentStock.basic.name, `(${this.currentStock.basic.code})`);
            this.updateStockInfo(`${this.currentStock.basic.name} ${this.currentStock.basic.code}`);
            this.renderStockDetail();
        }
    },

    updateStockInfo(text) {
        const stockInfo = document.getElementById('currentStockInfo');
        if (stockInfo) {
            stockInfo.querySelector('.stock-name').textContent = text;
        }
    },

    renderStockDetail() {
        if (!this.currentStock) return;

        this.disposeAllCharts();

        this.renderOverviewPanel();
        this.renderTechnicalPanel();
        this.renderFundamentalPanel();
        this.renderIndustryPanel();
        this.renderMacroPanel();

        this.initAndResizeChartsForTab(this.currentTab);
    },

    disposeAllCharts() {
        const chartKeys = Object.keys(this.charts);
        chartKeys.forEach(key => {
            if (this.charts[key] && typeof this.charts[key].dispose === 'function') {
                this.charts[key].dispose();
                this.charts[key] = null;
            }
        });
    },

    renderOverviewPanel() {
        const panel = document.getElementById('overview');
        if (!panel || !this.currentStock) return;

        const stock = this.currentStock;
        const basic = stock.basic || {};
        const summary = stock.summary || {};
        const scores = summary.scores || {};
        const bullFactors = summary.bull_factors || [];
        const bearFactors = summary.bear_factors || [];
        const crossValidation = this.parseCrossValidation(summary.cross_validation || '');

        const isUp = (basic.changePercent || 0) >= 0;
        const priceClass = isUp ? 'up' : 'down';
        const changePrefix = isUp ? '+' : '';

        const bullFactorsHtml = bullFactors.map(f => `
            <div class="factor-item bull">
                <span class="factor-dot bull"></span>
                <span>${f}</span>
            </div>
        `).join('');

        const bearFactorsHtml = bearFactors.map(f => `
            <div class="factor-item bear">
                <span class="factor-dot bear"></span>
                <span>${f}</span>
            </div>
        `).join('');

        panel.querySelector('.panel-content').innerHTML = `
            <div class="overview-container">
                <div class="stock-header">
                    <div class="stock-header-left">
                        <div class="stock-header-name-row">
                            <span class="stock-header-name">${basic.name || '--'}</span>
                            <span class="stock-header-code">${basic.code || '--'}</span>
                        </div>
                        <div class="stock-header-name-row">
                            <span class="stock-header-industry">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 21h18"></path>
                                    <path d="M5 21V7l8-4v18"></path>
                                    <path d="M19 21V11l-6-4"></path>
                                </svg>
                                ${basic.industry || '--'}
                            </span>
                        </div>
                    </div>
                    <div class="stock-header-right">
                        <span class="stock-header-price ${priceClass}">${basic.currentPrice ? basic.currentPrice.toFixed(2) : '--'}</span>
                        <span class="stock-header-change ${priceClass}">
                            ${changePrefix}${basic.changePercent ? basic.changePercent.toFixed(2) : '--'}%
                        </span>
                    </div>
                </div>

                <div class="overview-row-2">
                    <div class="ai-summary-card">
                        <div class="ai-summary-header">
                            <div class="ai-summary-icon">AI</div>
                            <span class="ai-summary-title">AI 一句话投资摘要</span>
                            <span class="ai-summary-badge">智能生成</span>
                        </div>
                        <p class="ai-summary-text">${summary.one_sentence || '暂无综合分析'}</p>
                    </div>

                    <div class="bull-bear-card">
                        <div class="bull-bear-header">
                            <span class="bull-bear-title">多空因素对比</span>
                        </div>
                        <div class="bull-bear-content">
                            <div class="bull-column">
                                <div class="column-title bull">
                                    <span class="column-title-icon bull">↑</span>
                                    利多因素
                                </div>
                                ${bullFactorsHtml || '<div class="factor-item bull"><span>暂无数据</span></div>'}
                            </div>
                            <div class="bear-column">
                                <div class="column-title bear">
                                    <span class="column-title-icon bear">↓</span>
                                    利空因素
                                </div>
                                ${bearFactorsHtml || '<div class="factor-item bear"><span>暂无数据</span></div>'}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="overview-row-3">
                    <div class="radar-card">
                        <div class="radar-header">
                            <span class="radar-title">四维评分雷达图</span>
                        </div>
                        <div id="overviewRadarChart" class="radar-chart-container"></div>
                    </div>

                    <div class="cross-validation-card">
                        <div class="cv-header">
                            <span class="cv-title">AI 交叉验证分析</span>
                            <span class="cv-ai-badge">AI 分析</span>
                        </div>
                        <div class="cv-content">
                            <div class="cv-section consensus">
                                <div class="cv-section-title consensus">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    一致性点
                                </div>
                                <p class="cv-section-text">${crossValidation.consensus || '暂无一致性分析'}</p>
                            </div>
                            <div class="cv-section conflict">
                                <div class="cv-section-title conflict">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                    </svg>
                                    矛盾点
                                </div>
                                <p class="cv-section-text">${crossValidation.conflict || '暂无矛盾点分析'}</p>
                            </div>
                            <div class="cv-section judgment">
                                <div class="cv-section-title judgment">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                    综合判断
                                </div>
                                <p class="cv-section-text">${crossValidation.judgment || '暂无综合判断'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    },

    parseCrossValidation(text) {
        if (!text) return { consensus: '', conflict: '', judgment: '' };

        let consensus = '';
        let conflict = '';
        let judgment = '';

        const conflictIdx = text.search(/矛盾点|矛盾/);
        const judgmentIdx = text.search(/综合判断/);

        if (conflictIdx > 0) {
            consensus = text.substring(0, conflictIdx).trim().replace(/^[，。；、\s]+|[，。；、\s]+$/g, '');
        }

        if (conflictIdx >= 0 && judgmentIdx > conflictIdx) {
            const conflictStart = text.indexOf('：', conflictIdx);
            const start = conflictStart >= 0 ? conflictStart + 1 : conflictIdx;
            conflict = text.substring(start, judgmentIdx).trim().replace(/^[，。；、\s]+|[，。；、\s]+$/g, '');
        } else if (conflictIdx >= 0 && judgmentIdx < 0) {
            const conflictStart = text.indexOf('：', conflictIdx);
            const start = conflictStart >= 0 ? conflictStart + 1 : conflictIdx;
            conflict = text.substring(start).trim().replace(/^[，。；、\s]+|[，。；、\s]+$/g, '');
        }

        if (judgmentIdx >= 0) {
            const judgmentStart = text.indexOf('：', judgmentIdx);
            const start = judgmentStart >= 0 ? judgmentStart + 1 : judgmentIdx;
            judgment = text.substring(start).trim().replace(/^[，。；、\s]+|[，。；、\s]+$/g, '');
        }

        if (!consensus && !conflict && !judgment) {
            consensus = text;
        }

        return { consensus, conflict, judgment };
    },

    initOverviewRadar() {
        if (this.charts.overviewRadar) return;

        const chartDom = document.getElementById('overviewRadarChart');
        if (!chartDom || typeof echarts === 'undefined') return;

        this.charts.overviewRadar = echarts.init(chartDom);
    },

    updateOverviewRadar(scores) {
        if (!this.charts.overviewRadar) {
            this.initOverviewRadar();
            if (!this.charts.overviewRadar) return;
        }

        const technical = scores.technical || 0;
        const fundamental = scores.fundamental || 0;
        const industry = scores.industry || 0;
        const macro = scores.macro || 0;

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(26, 29, 41, 0.95)',
                borderColor: '#2a2d3e',
                borderWidth: 1,
                textStyle: {
                    color: '#e8eaed',
                    fontSize: 13
                },
                formatter: function(params) {
                    const data = params.value;
                    return `
                        <div style="font-weight: 600; margin-bottom: 6px;">四维评分</div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <div style="display: flex; justify-content: space-between; gap: 16px;">
                                <span style="color: #9ca0ab;">技术面</span>
                                <span style="color: #5ee7b1; font-weight: 600;">${data[0]}分</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; gap: 16px;">
                                <span style="color: #9ca0ab;">基本面</span>
                                <span style="color: #6ba4ff; font-weight: 600;">${data[1]}分</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; gap: 16px;">
                                <span style="color: #9ca0ab;">行业面</span>
                                <span style="color: #ffd93d; font-weight: 600;">${data[2]}分</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; gap: 16px;">
                                <span style="color: #9ca0ab;">宏观面</span>
                                <span style="color: #ff6b6b; font-weight: 600;">${data[3]}分</span>
                            </div>
                        </div>
                    `;
                }
            },
            radar: {
                indicator: [
                    { name: '技术面', max: 100, color: '#9ca0ab' },
                    { name: '基本面', max: 100, color: '#9ca0ab' },
                    { name: '行业面', max: 100, color: '#9ca0ab' },
                    { name: '宏观面', max: 100, color: '#9ca0ab' }
                ],
                shape: 'polygon',
                splitNumber: 5,
                axisName: {
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'InstrumentSans, sans-serif'
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(42, 45, 62, 0.8)',
                        width: 1
                    }
                },
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: [
                            'rgba(30, 33, 48, 0.3)',
                            'rgba(30, 33, 48, 0.2)',
                            'rgba(30, 33, 48, 0.15)',
                            'rgba(30, 33, 48, 0.1)',
                            'rgba(30, 33, 48, 0.05)'
                        ]
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: 'rgba(42, 45, 62, 0.8)'
                    }
                },
                radius: '65%',
                center: ['50%', '52%']
            },
            series: [{
                type: 'radar',
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                    width: 2,
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 1, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#5ee7b1' },
                            { offset: 0.5, color: '#6ba4ff' },
                            { offset: 1, color: '#5ee7b1' }
                        ]
                    }
                },
                itemStyle: {
                    color: '#5ee7b1',
                    borderColor: '#fff',
                    borderWidth: 2,
                    shadowBlur: 10,
                    shadowColor: 'rgba(94, 231, 177, 0.5)'
                },
                areaStyle: {
                    color: {
                        type: 'radial',
                        x: 0.5, y: 0.5, r: 0.5,
                        colorStops: [
                            { offset: 0, color: 'rgba(94, 231, 177, 0.4)' },
                            { offset: 1, color: 'rgba(107, 164, 255, 0.15)' }
                        ]
                    }
                },
                data: [
                    {
                        value: [technical, fundamental, industry, macro],
                        name: '评分'
                    }
                ]
            }]
        };

        this.charts.overviewRadar.setOption(option, true);
    },

    currentIndicator: 'macd',

    renderTechnicalPanel() {
        const panel = document.getElementById('technical');
        if (!panel || !this.currentStock) return;

        const stock = this.currentStock;
        const technical = stock.technical || {};
        const indicators = technical.indicators || {};
        const ma = indicators.ma || {};
        const macd = indicators.macd || {};
        const rsi = indicators.rsi || {};
        const kdj = indicators.kdj || {};
        const boll = indicators.boll || {};
        const supportResistance = technical.support_resistance || {};
        const trend = technical.trend || {};
        const aiAnalysis = technical.ai_analysis || '';

        const indicatorList = [
            { key: 'ma', name: 'MA均线', value: ma.ma5 ? ma.ma5.toFixed(2) : '--', signal: ma.signal || '中性' },
            { key: 'macd', name: 'MACD', value: macd.macd !== undefined ? macd.macd.toFixed(2) : '--', signal: macd.signal || '中性' },
            { key: 'rsi', name: 'RSI', value: rsi.value !== undefined ? rsi.value.toFixed(2) : '--', signal: rsi.signal || '中性' },
            { key: 'kdj', name: 'KDJ', value: kdj.k !== undefined ? kdj.k.toFixed(2) : '--', signal: kdj.signal || '中性' },
            { key: 'boll', name: 'BOLL', value: boll.middle ? boll.middle.toFixed(2) : '--', signal: boll.signal || '中性' }
        ];

        const aiParsed = this.parseAIAnalysis(aiAnalysis);

        const signalClass = (signal) => {
            if (signal === '看多') return 'signal-bull';
            if (signal === '看空') return 'signal-bear';
            return 'signal-neutral';
        };

        const indicatorsTableHtml = indicatorList.map(item => `
            <tr>
                <td class="indicator-name">${item.name}</td>
                <td class="indicator-value">${item.value}</td>
                <td class="indicator-signal">
                    <span class="signal-badge ${signalClass(item.signal)}">${item.signal}</span>
                </td>
            </tr>
        `).join('');

        panel.querySelector('.panel-content').innerHTML = `
            <div class="technical-container">
                <div class="kline-card">
                    <div class="card-header">
                        <h3 class="card-title">K线图 + 成交量</h3>
                        <div class="kline-legend">
                            <span class="legend-item"><span class="legend-dot ma5"></span>MA5</span>
                            <span class="legend-item"><span class="legend-dot ma10"></span>MA10</span>
                            <span class="legend-item"><span class="legend-dot ma20"></span>MA20</span>
                        </div>
                    </div>
                    <div id="klineChart" class="kline-chart-container"></div>
                </div>

                <div class="indicator-card">
                    <div class="card-header">
                        <h3 class="card-title">技术指标</h3>
                        <div class="indicator-tabs">
                            <button class="indicator-tab active" data-indicator="macd">MACD</button>
                            <button class="indicator-tab" data-indicator="rsi">RSI</button>
                            <button class="indicator-tab" data-indicator="kdj">KDJ</button>
                            <button class="indicator-tab" data-indicator="boll">BOLL</button>
                        </div>
                    </div>
                    <div id="indicatorChart" class="indicator-chart-container"></div>
                </div>

                <div class="technical-row">
                    <div class="signal-table-card">
                        <div class="card-header">
                            <h3 class="card-title">技术指标状态</h3>
                        </div>
                        <table class="signal-table">
                            <thead>
                                <tr>
                                    <th>指标</th>
                                    <th>当前值</th>
                                    <th>信号方向</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${indicatorsTableHtml}
                            </tbody>
                        </table>
                    </div>

                    <div class="support-resistance-card">
                        <div class="card-header">
                            <h3 class="card-title">支撑位与压力位</h3>
                        </div>
                        <div class="sr-content">
                            <div class="sr-item support">
                                <div class="sr-label">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="20 15 10 5 4 15"></polyline>
                                    </svg>
                                    支撑位
                                </div>
                                <div class="sr-value">${supportResistance.support ? supportResistance.support.toFixed(2) : '--'}</div>
                            </div>
                            <div class="sr-divider"></div>
                            <div class="sr-item resistance">
                                <div class="sr-label">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="18 8 12 2 6 8"></polyline>
                                        <path d="M6 20h12"></path>
                                        <path d="M12 2v18"></path>
                                    </svg>
                                    压力位
                                </div>
                                <div class="sr-value">${supportResistance.resistance ? supportResistance.resistance.toFixed(2) : '--'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="trend-card">
                    <div class="card-header">
                        <h3 class="card-title">趋势概率评估</h3>
                    </div>
                    <div class="trend-content">
                        <div class="trend-item">
                            <div class="trend-header">
                                <span class="trend-label">短期趋势（1-2周）</span>
                                <span class="trend-percent">${trend.short_term || 0}%</span>
                            </div>
                            <div class="trend-progress-bar">
                                <div class="trend-progress-fill" style="width: ${trend.short_term || 0}%;"></div>
                            </div>
                            <div class="trend-desc">
                                ${(trend.short_term || 0) >= 60 ? '偏多' : (trend.short_term || 0) <= 40 ? '偏空' : '震荡'}
                            </div>
                        </div>
                        <div class="trend-item">
                            <div class="trend-header">
                                <span class="trend-label">中期趋势（1-3个月）</span>
                                <span class="trend-percent">${trend.mid_term || 0}%</span>
                            </div>
                            <div class="trend-progress-bar">
                                <div class="trend-progress-fill" style="width: ${trend.mid_term || 0}%;"></div>
                            </div>
                            <div class="trend-desc">
                                ${(trend.mid_term || 0) >= 60 ? '偏多' : (trend.mid_term || 0) <= 40 ? '偏空' : '震荡'}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="ai-analysis-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <span class="ai-icon-badge">AI</span>
                            AI 技术面解读
                        </h3>
                    </div>
                    <div class="ai-analysis-content">
                        <div class="ai-section">
                            <div class="ai-section-title">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                信号总结
                            </div>
                            <p class="ai-section-text">${aiParsed.summary || '暂无信号总结'}</p>
                        </div>
                        <div class="ai-section">
                            <div class="ai-section-title warning">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                关键点位提醒
                            </div>
                            <p class="ai-section-text">${aiParsed.keyPoints || '暂无关键点位分析'}</p>
                        </div>
                        <div class="ai-section">
                            <div class="ai-section-title danger">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                风险提示
                            </div>
                            <p class="ai-section-text">${aiParsed.risk || '暂无风险提示'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindIndicatorTabs();
    },

    parseAIAnalysis(text) {
        if (!text) return { summary: '', keyPoints: '', risk: '' };

        let summary = '';
        let keyPoints = '';
        let risk = '';

        const supportIdx = text.search(/支撑位|压力位|关键位|点位/);
        const riskIdx = text.search(/风险|注意|建议|关注/);

        if (supportIdx > 0) {
            summary = text.substring(0, supportIdx).trim().replace(/[，。；、\s]+$/g, '');
        } else if (riskIdx > 0) {
            summary = text.substring(0, riskIdx).trim().replace(/[，。；、\s]+$/g, '');
        } else {
            summary = text;
        }

        if (supportIdx >= 0 && riskIdx > supportIdx) {
            keyPoints = text.substring(supportIdx, riskIdx).trim().replace(/^[，。；、\s]+|[，。；、\s]+$/g, '');
        } else if (supportIdx >= 0 && riskIdx < 0) {
            keyPoints = text.substring(supportIdx).trim().replace(/^[，。；、\s]+|[，。；、\s]+$/g, '');
        }

        if (riskIdx >= 0) {
            risk = text.substring(riskIdx).trim().replace(/^[，。；、\s]+|[，。；、\s]+$/g, '');
        }

        if (!summary) summary = text;
        if (!keyPoints) keyPoints = '支撑位与压力位可参考左侧数据卡片';

        return { summary, keyPoints, risk };
    },

    bindIndicatorTabs() {
        const tabs = document.querySelectorAll('.indicator-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const indicator = tab.dataset.indicator;
                this.switchIndicator(indicator);
            });
        });
    },

    switchIndicator(indicator) {
        this.currentIndicator = indicator;

        document.querySelectorAll('.indicator-tab').forEach(tab => {
            if (tab.dataset.indicator === indicator) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        this.updateIndicatorChart(indicator);
    },

    initKLineChart() {
        if (this.charts.kline) return;

        const chartDom = document.getElementById('klineChart');
        if (!chartDom || typeof echarts === 'undefined') return;

        this.charts.kline = echarts.init(chartDom);
    },

    initIndicatorChart() {
        if (this.charts.indicator) return;

        const chartDom = document.getElementById('indicatorChart');
        if (!chartDom || typeof echarts === 'undefined') return;

        this.charts.indicator = echarts.init(chartDom);
    },

    updateKLineChart() {
        if (!this.charts.kline) {
            this.initKLineChart();
            if (!this.charts.kline) return;
        }
        if (!this.currentStock) return;

        const technical = this.currentStock.technical || {};
        const klineData = technical.kline || [];
        const indicators = technical.indicators || {};
        const ma = indicators.ma || {};
        const supportResistance = technical.support_resistance || {};

        const dates = klineData.map(item => item.date);
        const klineValues = klineData.map(item => [item.open, item.close, item.low, item.high]);
        const volumes = klineData.map(item => item.volume);
        const ma5Values = ma.ma5_values || [];
        const ma10Values = ma.ma10_values || [];
        const ma20Values = ma.ma20_values || [];

        const option = {
            backgroundColor: 'transparent',
            animation: false,
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                backgroundColor: 'rgba(26, 29, 41, 0.95)',
                borderColor: '#2a2d3e',
                borderWidth: 1,
                textStyle: {
                    color: '#e8eaed',
                    fontSize: 12
                }
            },
            legend: {
                show: false
            },
            grid: [
                {
                    left: '60px',
                    right: '20px',
                    top: '10px',
                    height: '55%'
                },
                {
                    left: '60px',
                    right: '20px',
                    top: '72%',
                    height: '22%'
                }
            ],
            xAxis: [
                {
                    type: 'category',
                    data: dates,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: '#353849' } },
                    axisLabel: { color: '#6b7080', fontSize: 11 },
                    splitLine: { show: false },
                    axisTick: { show: false }
                },
                {
                    type: 'category',
                    gridIndex: 1,
                    data: dates,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: '#353849' } },
                    axisLabel: { show: false },
                    splitLine: { show: false },
                    axisTick: { show: false }
                }
            ],
            yAxis: [
                {
                    scale: true,
                    splitNumber: 4,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#6b7080', fontSize: 11 },
                    splitLine: { lineStyle: { color: 'rgba(42, 45, 62, 0.6)', type: 'dashed' } }
                },
                {
                    scale: true,
                    gridIndex: 1,
                    splitNumber: 2,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#6b7080', fontSize: 10 },
                    splitLine: { lineStyle: { color: 'rgba(42, 45, 62, 0.6)', type: 'dashed' } }
                }
            ],
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0, 1],
                    start: 40,
                    end: 100
                },
                {
                    show: true,
                    xAxisIndex: [0, 1],
                    type: 'slider',
                    bottom: 2,
                    height: 16,
                    start: 40,
                    end: 100,
                    borderColor: '#2a2d3e',
                    fillerColor: 'rgba(94, 231, 177, 0.15)',
                    handleStyle: {
                        color: '#5ee7b1'
                    },
                    textStyle: {
                        color: '#6b7080'
                    }
                }
            ],
            series: [
                {
                    name: 'K线',
                    type: 'candlestick',
                    data: klineValues,
                    itemStyle: {
                        color: '#5ee7b1',
                        color0: '#ff6b6b',
                        borderColor: '#5ee7b1',
                        borderColor0: '#ff6b6b'
                    },
                    markLine: {
                        silent: true,
                        symbol: 'none',
                        lineStyle: {
                            type: 'dashed',
                            width: 1
                        },
                        data: [
                            {
                                yAxis: supportResistance.support,
                                lineStyle: { color: '#5ee7b1' },
                                label: {
                                    show: true,
                                    position: 'end',
                                    formatter: '支撑',
                                    color: '#5ee7b1',
                                    fontSize: 10,
                                    backgroundColor: 'rgba(94, 231, 177, 0.15)',
                                    padding: [2, 6]
                                }
                            },
                            {
                                yAxis: supportResistance.resistance,
                                lineStyle: { color: '#ff6b6b' },
                                label: {
                                    show: true,
                                    position: 'end',
                                    formatter: '压力',
                                    color: '#ff6b6b',
                                    fontSize: 10,
                                    backgroundColor: 'rgba(255, 107, 107, 0.15)',
                                    padding: [2, 6]
                                }
                            }
                        ]
                    }
                },
                {
                    name: 'MA5',
                    type: 'line',
                    data: ma5Values,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        width: 1,
                        color: '#ffd93d'
                    }
                },
                {
                    name: 'MA10',
                    type: 'line',
                    data: ma10Values,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        width: 1,
                        color: '#6ba4ff'
                    }
                },
                {
                    name: 'MA20',
                    type: 'line',
                    data: ma20Values,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        width: 1,
                        color: '#c084fc'
                    }
                },
                {
                    name: '成交量',
                    type: 'bar',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: volumes.map((vol, idx) => ({
                        value: vol,
                        itemStyle: {
                            color: klineValues[idx][1] >= klineValues[idx][0] ? '#5ee7b1' : '#ff6b6b'
                        }
                    }))
                }
            ]
        };

        this.charts.kline.setOption(option, true);
    },

    updateIndicatorChart(indicatorType) {
        if (!this.charts.indicator) {
            this.initIndicatorChart();
            if (!this.charts.indicator) return;
        }
        if (!this.currentStock) return;

        const technical = this.currentStock.technical || {};
        const klineData = technical.kline || [];
        const indicators = technical.indicators || {};
        const dates = klineData.map(item => item.date);

        let option = {};

        if (indicatorType === 'macd') {
            const macd = indicators.macd || {};
            const difValues = macd.dif_values || [];
            const deaValues = macd.dea_values || [];
            const macdValues = macd.macd_values || [];

            option = {
                backgroundColor: 'transparent',
                animation: false,
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(26, 29, 41, 0.95)',
                    borderColor: '#2a2d3e',
                    borderWidth: 1,
                    textStyle: { color: '#e8eaed', fontSize: 12 }
                },
                legend: {
                    data: ['DIF', 'DEA', 'MACD'],
                    top: 0,
                    right: 10,
                    textStyle: { color: '#9ca0ab', fontSize: 11 },
                    itemWidth: 12,
                    itemHeight: 8
                },
                grid: {
                    left: '60px',
                    right: '20px',
                    top: '30px',
                    bottom: '10px'
                },
                xAxis: {
                    type: 'category',
                    data: dates,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: '#353849' } },
                    axisLabel: { color: '#6b7080', fontSize: 11 },
                    splitLine: { show: false },
                    axisTick: { show: false }
                },
                yAxis: {
                    scale: true,
                    splitNumber: 3,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#6b7080', fontSize: 11 },
                    splitLine: { lineStyle: { color: 'rgba(42, 45, 62, 0.6)', type: 'dashed' } }
                },
                dataZoom: [
                    {
                        type: 'inside',
                        start: 40,
                        end: 100
                    }
                ],
                series: [
                    {
                        name: 'DIF',
                        type: 'line',
                        data: difValues,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: { width: 1.5, color: '#6ba4ff' }
                    },
                    {
                        name: 'DEA',
                        type: 'line',
                        data: deaValues,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: { width: 1.5, color: '#ffd93d' }
                    },
                    {
                        name: 'MACD',
                        type: 'bar',
                        data: macdValues.map(v => ({
                            value: v,
                            itemStyle: { color: v >= 0 ? '#5ee7b1' : '#ff6b6b' }
                        }))
                    }
                ]
            };
        } else if (indicatorType === 'rsi') {
            const rsi = indicators.rsi || {};
            const rsiValues = rsi.values || [];

            option = {
                backgroundColor: 'transparent',
                animation: false,
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(26, 29, 41, 0.95)',
                    borderColor: '#2a2d3e',
                    borderWidth: 1,
                    textStyle: { color: '#e8eaed', fontSize: 12 },
                    formatter: function(params) {
                        const data = params[0];
                        return `${data.name}<br/>RSI: <strong>${data.value !== null ? data.value.toFixed(2) : '--'}</strong>`;
                    }
                },
                grid: {
                    left: '60px',
                    right: '20px',
                    top: '20px',
                    bottom: '10px'
                },
                xAxis: {
                    type: 'category',
                    data: dates,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: '#353849' } },
                    axisLabel: { color: '#6b7080', fontSize: 11 },
                    splitLine: { show: false },
                    axisTick: { show: false }
                },
                yAxis: {
                    min: 0,
                    max: 100,
                    splitNumber: 4,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#6b7080', fontSize: 11 },
                    splitLine: { lineStyle: { color: 'rgba(42, 45, 62, 0.6)', type: 'dashed' } }
                },
                dataZoom: [
                    {
                        type: 'inside',
                        start: 40,
                        end: 100
                    }
                ],
                series: [
                    {
                        name: 'RSI',
                        type: 'line',
                        data: rsiValues,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: { width: 1.5, color: '#c084fc' },
                        areaStyle: {
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 0, y2: 1,
                                colorStops: [
                                    { offset: 0, color: 'rgba(192, 132, 252, 0.3)' },
                                    { offset: 1, color: 'rgba(192, 132, 252, 0.02)' }
                                ]
                            }
                        },
                        markLine: {
                            silent: true,
                            symbol: 'none',
                            lineStyle: { type: 'dashed', width: 1 },
                            data: [
                                {
                                    yAxis: 70,
                                    lineStyle: { color: '#ff6b6b' },
                                    label: { show: true, position: 'end', formatter: '超买', color: '#ff6b6b', fontSize: 10 }
                                },
                                {
                                    yAxis: 30,
                                    lineStyle: { color: '#5ee7b1' },
                                    label: { show: true, position: 'end', formatter: '超卖', color: '#5ee7b1', fontSize: 10 }
                                }
                            ]
                        }
                    }
                ]
            };
        } else if (indicatorType === 'kdj') {
            const kdj = indicators.kdj || {};
            const kValues = kdj.k_values || [];
            const dValues = kdj.d_values || [];
            const jValues = kdj.j_values || [];

            option = {
                backgroundColor: 'transparent',
                animation: false,
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(26, 29, 41, 0.95)',
                    borderColor: '#2a2d3e',
                    borderWidth: 1,
                    textStyle: { color: '#e8eaed', fontSize: 12 }
                },
                legend: {
                    data: ['K', 'D', 'J'],
                    top: 0,
                    right: 10,
                    textStyle: { color: '#9ca0ab', fontSize: 11 },
                    itemWidth: 12,
                    itemHeight: 8
                },
                grid: {
                    left: '60px',
                    right: '20px',
                    top: '30px',
                    bottom: '10px'
                },
                xAxis: {
                    type: 'category',
                    data: dates,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: '#353849' } },
                    axisLabel: { color: '#6b7080', fontSize: 11 },
                    splitLine: { show: false },
                    axisTick: { show: false }
                },
                yAxis: {
                    min: 0,
                    max: 100,
                    splitNumber: 4,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#6b7080', fontSize: 11 },
                    splitLine: { lineStyle: { color: 'rgba(42, 45, 62, 0.6)', type: 'dashed' } }
                },
                dataZoom: [
                    {
                        type: 'inside',
                        start: 40,
                        end: 100
                    }
                ],
                series: [
                    {
                        name: 'K',
                        type: 'line',
                        data: kValues,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: { width: 1.5, color: '#6ba4ff' }
                    },
                    {
                        name: 'D',
                        type: 'line',
                        data: dValues,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: { width: 1.5, color: '#ffd93d' }
                    },
                    {
                        name: 'J',
                        type: 'line',
                        data: jValues,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: { width: 1.5, color: '#c084fc' }
                    }
                ]
            };
        } else if (indicatorType === 'boll') {
            const boll = indicators.boll || {};
            const upperValues = boll.upper_values || [];
            const middleValues = boll.middle_values || [];
            const lowerValues = boll.lower_values || [];

            option = {
                backgroundColor: 'transparent',
                animation: false,
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(26, 29, 41, 0.95)',
                    borderColor: '#2a2d3e',
                    borderWidth: 1,
                    textStyle: { color: '#e8eaed', fontSize: 12 }
                },
                legend: {
                    data: ['上轨', '中轨', '下轨'],
                    top: 0,
                    right: 10,
                    textStyle: { color: '#9ca0ab', fontSize: 11 },
                    itemWidth: 12,
                    itemHeight: 8
                },
                grid: {
                    left: '60px',
                    right: '20px',
                    top: '30px',
                    bottom: '10px'
                },
                xAxis: {
                    type: 'category',
                    data: dates,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: '#353849' } },
                    axisLabel: { color: '#6b7080', fontSize: 11 },
                    splitLine: { show: false },
                    axisTick: { show: false }
                },
                yAxis: {
                    scale: true,
                    splitNumber: 4,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#6b7080', fontSize: 11 },
                    splitLine: { lineStyle: { color: 'rgba(42, 45, 62, 0.6)', type: 'dashed' } }
                },
                dataZoom: [
                    {
                        type: 'inside',
                        start: 40,
                        end: 100
                    }
                ],
                series: [
                    {
                        name: '上轨',
                        type: 'line',
                        data: upperValues,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: { width: 1, color: '#ff6b6b' },
                        areaStyle: {
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 0, y2: 1,
                                colorStops: [
                                    { offset: 0, color: 'rgba(255, 107, 107, 0.1)' },
                                    { offset: 1, color: 'rgba(255, 107, 107, 0.02)' }
                                ]
                            }
                        }
                    },
                    {
                        name: '中轨',
                        type: 'line',
                        data: middleValues,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: { width: 1.5, color: '#6ba4ff' }
                    },
                    {
                        name: '下轨',
                        type: 'line',
                        data: lowerValues,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: { width: 1, color: '#5ee7b1' },
                        areaStyle: {
                            color: {
                                type: 'linear',
                                x: 0, y: 1, x2: 0, y2: 0,
                                colorStops: [
                                    { offset: 0, color: 'rgba(94, 231, 177, 0.1)' },
                                    { offset: 1, color: 'rgba(94, 231, 177, 0.02)' }
                                ]
                            }
                        }
                    }
                ]
            };
        }

        this.charts.indicator.setOption(option, true);
    },

    renderFundamentalPanel() {
        const panel = document.getElementById('fundamental');
        if (!panel || !this.currentStock) return;

        const stock = this.currentStock;
        const fundamental = stock.fundamental || {};
        const healthScore = fundamental.health_score || {};
        const hotTags = fundamental.hot_tags || [];
        const businessSegments = fundamental.business_segments || [];
        const financials = fundamental.financials || [];
        const aiAnalysis = fundamental.ai_analysis || '';

        const aiParsed = this.parseFundamentalAI(aiAnalysis);

        const hotTagsHtml = hotTags.length > 0 ? hotTags.map(tag => `
            <span class="hot-tag">${tag}</span>
        `).join('') : '<span style="color: var(--text-tertiary); font-size: 13px;">暂无标签</span>';

        panel.querySelector('.panel-content').innerHTML = `
            <div class="fundamental-container">
                <div class="company-intro-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 21h18"></path>
                                <path d="M5 21V7l8-4v18"></path>
                                <path d="M19 21V11l-6-4"></path>
                            </svg>
                            公司简介
                        </h3>
                    </div>
                    <p class="company-intro-text">${fundamental.company_intro || '暂无公司简介'}</p>
                </div>

                <div class="fundamental-row-1">
                    <div class="business-pie-card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                                </svg>
                                主营业务构成
                            </h3>
                        </div>
                        <div id="fundamentalPieChart" class="pie-chart-container"></div>
                    </div>

                    <div class="financial-health-card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                                财务健康度
                            </h3>
                        </div>
                        <div class="health-score-wrapper">
                            <div class="health-score-ring">
                                <svg class="health-score-svg" viewBox="0 0 120 120">
                                    <circle class="health-score-bg" cx="60" cy="60" r="52"></circle>
                                    <circle class="health-score-progress" cx="60" cy="60" r="52" 
                                            stroke-dasharray="${(healthScore.score || 0) * 3.267} 326.7"
                                            style="--score: ${healthScore.score || 0};"></circle>
                                </svg>
                                <div class="health-score-inner">
                                    <span class="health-score-value">${healthScore.score || '--'}</span>
                                    <span class="health-score-label">健康分</span>
                                </div>
                            </div>
                            <p class="health-score-desc">${healthScore.description || '暂无健康度评估'}</p>
                        </div>
                    </div>
                </div>

                <div class="trend-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            盈利能力趋势
                        </h3>
                        <div class="trend-legend">
                            <span class="legend-item"><span class="legend-dot gross-margin"></span>毛利率</span>
                            <span class="legend-item"><span class="legend-dot net-margin"></span>净利率</span>
                            <span class="legend-item"><span class="legend-dot roe"></span>ROE</span>
                        </div>
                    </div>
                    <div id="fundamentalTrendChart" class="trend-chart-container"></div>
                </div>

                <div class="hot-tags-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                <line x1="7" y1="7" x2="7.01" y2="7"></line>
                            </svg>
                            风口概念标签
                        </h3>
                    </div>
                    <div class="hot-tags-wrapper">
                        ${hotTagsHtml}
                    </div>
                </div>

                <div class="ai-analysis-card fundamental-ai-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <span class="ai-icon-badge">AI</span>
                            AI 基本面深度解读
                        </h3>
                    </div>
                    <div class="ai-analysis-content">
                        <div class="ai-section highlight">
                            <div class="ai-section-title">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z"></path>
                                </svg>
                                核心亮点
                            </div>
                            <p class="ai-section-text">${aiParsed.highlights || '暂无核心亮点分析'}</p>
                        </div>
                        <div class="ai-section warning">
                            <div class="ai-section-title warning">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                主要风险
                            </div>
                            <p class="ai-section-text">${aiParsed.risks || '暂无风险分析'}</p>
                        </div>
                        <div class="ai-section info">
                            <div class="ai-section-title info">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                经营质量评估
                            </div>
                            <p class="ai-section-text">${aiParsed.quality || '暂无经营质量评估'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

    },

    parseFundamentalAI(text) {
        if (!text) return { highlights: '', risks: '', quality: '' };

        let highlights = '';
        let risks = '';
        let quality = '';

        const riskKeywords = /风险|风险点|风险提示|承压|压力|不确定性|不及预期|波动/;
        const qualityKeywords = /质量|稳健|健康|现金流|盈利能力|研发投入|增长|改善/;

        const riskIdx = text.search(riskKeywords);

        const sentences = text.split(/[。；\n]/).filter(s => s.trim().length > 0);

        const highlightSentences = [];
        const riskSentences = [];
        const qualitySentences = [];

        sentences.forEach(sentence => {
            const trimmed = sentence.trim();
            if (!trimmed) return;

            if (riskKeywords.test(trimmed)) {
                riskSentences.push(trimmed);
            } else if (qualityKeywords.test(trimmed) && /提升|增长|改善|稳健|充沛|优秀|强劲|高/.test(trimmed)) {
                qualitySentences.push(trimmed);
                highlightSentences.push(trimmed);
            } else {
                highlightSentences.push(trimmed);
            }
        });

        if (riskIdx >= 0) {
            highlights = text.substring(0, riskIdx).trim().replace(/^[，。；、\s]+|[，。；、\s]+$/g, '');
            risks = text.substring(riskIdx).trim().replace(/^[，。；、\s]+|[，。；、\s]+$/g, '');
        } else {
            highlights = text;
        }

        if (highlightSentences.length > 0) {
            highlights = highlightSentences.slice(0, Math.ceil(highlightSentences.length * 0.6)).join('。') + '。';
        }
        if (qualitySentences.length > 0) {
            quality = qualitySentences.join('。') + '。';
        } else if (highlightSentences.length > 0) {
            quality = highlightSentences.slice(Math.floor(highlightSentences.length * 0.4)).join('。') + '。';
        }
        if (riskSentences.length > 0) {
            risks = riskSentences.join('。') + '。';
        }

        if (!highlights) highlights = text;
        if (!quality) quality = '公司经营整体稳健，财务状况良好。';
        if (!risks) risks = '需关注行业周期性波动和宏观经济变化。';

        return { highlights, risks, quality };
    },

    initFundamentalPieChart() {
        if (this.charts.fundamentalPie) return;

        const chartDom = document.getElementById('fundamentalPieChart');
        if (!chartDom || typeof echarts === 'undefined') return;

        this.charts.fundamentalPie = echarts.init(chartDom);
    },

    updateFundamentalPieChart(segments) {
        if (!this.charts.fundamentalPie) {
            this.initFundamentalPieChart();
            if (!this.charts.fundamentalPie) return;
        }

        const data = segments.map((s, idx) => ({
            name: s.name,
            value: (s.ratio * 100).toFixed(1)
        }));

        const colors = [
            ['#5ee7b1', '#2dd4bf'],
            ['#6ba4ff', '#6366f1'],
            ['#ffd93d', '#f59e0b'],
            ['#c084fc', '#a855f7'],
            ['#fb7185', '#f43f5e'],
            ['#34d399', '#10b981']
        ];

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(26, 29, 41, 0.95)',
                borderColor: '#2a2d3e',
                borderWidth: 1,
                textStyle: {
                    color: '#e8eaed',
                    fontSize: 13
                },
                formatter: function(params) {
                    return `
                        <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
                        <div style="display: flex; justify-content: space-between; gap: 16px;">
                            <span style="color: #9ca0ab;">占比</span>
                            <span style="color: #5ee7b1; font-weight: 600;">${params.value}%</span>
                        </div>
                    `;
                }
            },
            legend: {
                orient: 'vertical',
                right: '5%',
                top: 'center',
                textStyle: {
                    color: '#9ca0ab',
                    fontSize: 12
                },
                itemWidth: 12,
                itemHeight: 12,
                itemGap: 12
            },
            series: [
                {
                    name: '主营业务',
                    type: 'pie',
                    radius: ['45%', '70%'],
                    center: ['35%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 6,
                        borderColor: '#1a1d29',
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
                            color: '#e8eaed'
                        },
                        itemStyle: {
                            shadowBlur: 20,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(94, 231, 177, 0.4)'
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: data.map((item, idx) => ({
                        name: item.name,
                        value: parseFloat(item.value),
                        itemStyle: {
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 1, y2: 1,
                                colorStops: [
                                    { offset: 0, color: colors[idx % colors.length][0] },
                                    { offset: 1, color: colors[idx % colors.length][1] }
                                ]
                            }
                        }
                    }))
                }
            ],
            graphic: [
                {
                    type: 'text',
                    left: '35%',
                    top: '45%',
                    style: {
                        text: '主营业务',
                        textAlign: 'center',
                        fill: '#9ca0ab',
                        fontSize: 12
                    }
                },
                {
                    type: 'text',
                    left: '35%',
                    top: '55%',
                    style: {
                        text: '100%',
                        textAlign: 'center',
                        fill: '#e8eaed',
                        fontSize: 18,
                        fontWeight: 'bold'
                    }
                }
            ]
        };

        this.charts.fundamentalPie.setOption(option, true);
    },

    initFundamentalTrendChart() {
        if (this.charts.fundamentalTrend) return;

        const chartDom = document.getElementById('fundamentalTrendChart');
        if (!chartDom || typeof echarts === 'undefined') return;

        this.charts.fundamentalTrend = echarts.init(chartDom);
    },

    updateFundamentalTrendChart(financials) {
        if (!this.charts.fundamentalTrend) {
            this.initFundamentalTrendChart();
            if (!this.charts.fundamentalTrend) return;
        }

        const periods = financials.map(f => f.period);
        const grossMargins = financials.map(f => f.gross_margin);
        const netMargins = financials.map(f => f.net_margin);
        const roes = financials.map(f => f.roe);

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(26, 29, 41, 0.95)',
                borderColor: '#2a2d3e',
                borderWidth: 1,
                textStyle: {
                    color: '#e8eaed',
                    fontSize: 12
                },
                axisPointer: {
                    type: 'cross'
                }
            },
            legend: {
                show: false
            },
            grid: {
                left: '60px',
                right: '60px',
                top: '20px',
                bottom: '30px'
            },
            xAxis: {
                type: 'category',
                data: periods,
                axisLine: { lineStyle: { color: '#353849' } },
                axisLabel: { color: '#6b7080', fontSize: 11 },
                splitLine: { show: false },
                axisTick: { show: false }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '利润率 (%)',
                    nameTextStyle: { color: '#6b7080', fontSize: 11 },
                    splitNumber: 4,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#6b7080', fontSize: 11, formatter: '{value}%' },
                    splitLine: { lineStyle: { color: 'rgba(42, 45, 62, 0.6)', type: 'dashed' } }
                },
                {
                    type: 'value',
                    name: 'ROE (%)',
                    nameTextStyle: { color: '#6b7080', fontSize: 11 },
                    splitNumber: 4,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#6b7080', fontSize: 11, formatter: '{value}%' },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: '毛利率',
                    type: 'line',
                    data: grossMargins,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    lineStyle: {
                        width: 2,
                        color: '#5ee7b1'
                    },
                    itemStyle: {
                        color: '#5ee7b1',
                        borderColor: '#1a1d29',
                        borderWidth: 2
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(94, 231, 177, 0.25)' },
                                { offset: 1, color: 'rgba(94, 231, 177, 0.02)' }
                            ]
                        }
                    }
                },
                {
                    name: '净利率',
                    type: 'line',
                    data: netMargins,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    lineStyle: {
                        width: 2,
                        color: '#6ba4ff'
                    },
                    itemStyle: {
                        color: '#6ba4ff',
                        borderColor: '#1a1d29',
                        borderWidth: 2
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(107, 164, 255, 0.2)' },
                                { offset: 1, color: 'rgba(107, 164, 255, 0.02)' }
                            ]
                        }
                    }
                },
                {
                    name: 'ROE',
                    type: 'bar',
                    yAxisIndex: 1,
                    data: roes,
                    barWidth: '30%',
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#ffd93d' },
                                { offset: 1, color: 'rgba(255, 217, 61, 0.3)' }
                            ]
                        },
                        borderRadius: [4, 4, 0, 0]
                    }
                }
            ]
        };

        this.charts.fundamentalTrend.setOption(option, true);
    },

    renderIndustryPanel() {
        const panel = document.getElementById('industry');
        if (!panel || !this.currentStock) return;

        const stock = this.currentStock;
        const industry = stock.industry || {};
        const rating = industry.rating || {};
        const reasons = rating.reasons || [];
        const aiAnalysis = industry.ai_analysis || '';

        const aiParsed = this.parseIndustryAI(aiAnalysis);

        const ratingLevel = rating.level || '--';
        let ratingClass = 'neutral';
        if (ratingLevel === '向好' || ratingLevel === '乐观') ratingClass = 'positive';
        if (ratingLevel === '向坏' || ratingLevel === '悲观') ratingClass = 'negative';

        const reasonsHtml = reasons.length > 0 ? reasons.map((reason, idx) => `
            <div class="rating-reason-item">
                <div class="rating-reason-index">${idx + 1}</div>
                <p class="rating-reason-text">${reason}</p>
            </div>
        `).join('') : '<p style="color: var(--text-tertiary); font-size: 13px;">暂无评级依据</p>';

        panel.querySelector('.panel-content').innerHTML = `
            <div class="industry-container">
                <div class="industry-overview-card">
                    <div class="overview-column">
                        <div class="overview-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 21h18"></path>
                                <path d="M5 21V7l8-4v18"></path>
                                <path d="M19 21V11l-6-4"></path>
                            </svg>
                            所属行业
                        </div>
                        <div class="overview-value">${industry.name || '--'}</div>
                    </div>
                    <div class="overview-divider"></div>
                    <div class="overview-column">
                        <div class="overview-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            生命周期
                        </div>
                        <div class="overview-value lifecycle">${industry.lifecycle || '--'}</div>
                    </div>
                    <div class="overview-divider"></div>
                    <div class="overview-column">
                        <div class="overview-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            行业评级
                        </div>
                        <div class="overview-value rating ${ratingClass}">${ratingLevel}</div>
                    </div>
                </div>

                <div class="rating-reasons-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            评级核心依据
                        </h3>
                    </div>
                    <div class="rating-reasons-list">
                        ${reasonsHtml}
                    </div>
                </div>

                <div class="industry-row-1">
                    <div class="policy-card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                    <path d="M2 17l10 5 10-5"></path>
                                    <path d="M2 12l10 5 10-5"></path>
                                </svg>
                                政策环境
                            </h3>
                        </div>
                        <div class="policy-content">
                            <p class="policy-text">${industry.policy || '暂无政策分析'}</p>
                        </div>
                    </div>

                    <div class="competition-card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="12" r="6"></circle>
                                    <circle cx="12" cy="12" r="2"></circle>
                                </svg>
                                竞争格局
                            </h3>
                        </div>
                        <div class="competition-content">
                            <p class="competition-text">${industry.competition || '暂无竞争分析'}</p>
                        </div>
                    </div>
                </div>

                <div class="ai-analysis-card industry-ai-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <span class="ai-icon-badge">AI</span>
                            AI 行业深度解读
                        </h3>
                    </div>
                    <div class="ai-analysis-content">
                        <div class="ai-section prosperity">
                            <div class="ai-section-title prosperity">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                    <polyline points="17 6 23 6 23 12"></polyline>
                                </svg>
                                景气度判断
                            </div>
                            <p class="ai-section-text">${aiParsed.prosperity || '暂无景气度分析'}</p>
                        </div>
                        <div class="ai-section drivers">
                            <div class="ai-section-title drivers">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                </svg>
                                关键驱动因素
                            </div>
                            <p class="ai-section-text">${aiParsed.drivers || '暂无驱动因素分析'}</p>
                        </div>
                        <div class="ai-section risks">
                            <div class="ai-section-title risks">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                潜在风险
                            </div>
                            <p class="ai-section-text">${aiParsed.risks || '暂无风险分析'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    parseIndustryAI(text) {
        if (!text) return { prosperity: '', drivers: '', risks: '' };

        let prosperity = '';
        let drivers = '';
        let risks = '';

        const riskKeywords = /风险|风险点|需关注|不确定性|承压|压力|注意|关注/;
        const driverKeywords = /驱动|主线|核心|关键|动力|推动|带动|需求|增长/;

        const sentences = text.split(/[。；\n]/).filter(s => s.trim().length > 0);

        const prosperitySentences = [];
        const driverSentences = [];
        const riskSentences = [];

        sentences.forEach(sentence => {
            const trimmed = sentence.trim();
            if (!trimmed) return;

            if (riskKeywords.test(trimmed)) {
                riskSentences.push(trimmed);
            } else if (driverKeywords.test(trimmed)) {
                driverSentences.push(trimmed);
            } else {
                prosperitySentences.push(trimmed);
            }
        });

        if (prosperitySentences.length > 0) {
            prosperity = prosperitySentences.slice(0, Math.ceil(prosperitySentences.length * 0.6)).join('。') + '。';
        }
        if (driverSentences.length > 0) {
            drivers = driverSentences.join('。') + '。';
        } else if (prosperitySentences.length > 0) {
            drivers = prosperitySentences.slice(Math.floor(prosperitySentences.length * 0.4)).join('。') + '。';
        }
        if (riskSentences.length > 0) {
            risks = riskSentences.join('。') + '。';
        }

        if (!prosperity) prosperity = text;
        if (!drivers) drivers = '行业发展受多重因素驱动，包括政策支持、技术进步、需求增长等。';
        if (!risks) risks = '需关注宏观经济波动和行业政策变化。';

        return { prosperity, drivers, risks };
    },

    currentMacroFilter: 'all',

    macroFilterTypes: [
        { key: 'all', label: '全部' },
        { key: '政策', label: '政策' },
        { key: '地缘', label: '地缘政治' },
        { key: '行业', label: '行业动态' },
        { key: '经济', label: '宏观经济' },
        { key: '突发事件', label: '突发事件' }
    ],

    renderMacroPanel() {
        const panel = document.getElementById('macro');
        if (!panel || !this.currentStock) return;

        const stock = this.currentStock;
        const macro = stock.macro || {};
        const events = macro.events || [];
        const aiAnalysis = macro.ai_analysis || '';

        const aiParsed = this.parseMacroAI(aiAnalysis);
        const filteredEvents = this.filterMacroEvents(events, this.currentMacroFilter);

        const filterButtonsHtml = this.macroFilterTypes.map(f => `
            <button class="macro-filter-btn ${this.currentMacroFilter === f.key ? 'active' : ''}" data-filter="${f.key}">
                ${f.label}
            </button>
        `).join('');

        const eventsHtml = filteredEvents.length > 0 ? filteredEvents.map((event, idx) => {
            const impactClass = event.impact_direction === '利好' ? 'positive' : 
                                event.impact_direction === '利空' ? 'negative' : 'neutral';
            return `
                <div class="macro-event-card ${impactClass}" data-index="${idx}">
                    <div class="event-left-bar"></div>
                    <div class="event-content">
                        <div class="event-header">
                            <span class="event-title">${event.title}</span>
                            <span class="event-type-tag">${event.type}</span>
                        </div>
                        <div class="event-meta">
                            <span class="event-time">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                ${event.time}
                            </span>
                            <span class="event-impact ${impactClass}">
                                <span class="impact-dot"></span>
                                ${event.impact_direction} · ${event.impact_level}
                            </span>
                        </div>
                        <div class="event-description-wrapper">
                            <p class="event-description">${event.description}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('') : `
            <div class="empty-events">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p>暂无相关事件</p>
            </div>
        `;

        panel.querySelector('.panel-content').innerHTML = `
            <div class="macro-container">
                <div class="macro-events-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5"></path>
                                <path d="M2 12l10 5 10-5"></path>
                            </svg>
                            宏观重要事件
                        </h3>
                        <span class="event-count-badge">共 ${events.length} 条</span>
                    </div>
                    <div class="macro-filter-bar">
                        ${filterButtonsHtml}
                    </div>
                    <div class="macro-events-list">
                        ${eventsHtml}
                    </div>
                </div>

                <div class="ai-analysis-card macro-ai-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <span class="ai-icon-badge">AI</span>
                            AI 宏观面深度解读
                        </h3>
                    </div>
                    <div class="ai-analysis-content">
                        <div class="ai-section mechanism">
                            <div class="ai-section-title mechanism">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                                影响机制分析
                            </div>
                            <p class="ai-section-text">${aiParsed.mechanism || '暂无影响机制分析'}</p>
                        </div>
                        <div class="ai-section duration">
                            <div class="ai-section-title duration">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                持续时间预估
                            </div>
                            <p class="ai-section-text">${aiParsed.duration || '暂无持续时间预估'}</p>
                        </div>
                        <div class="ai-section uncertainty">
                            <div class="ai-section-title uncertainty">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                不确定性提示
                            </div>
                            <p class="ai-section-text">${aiParsed.uncertainty || '暂无不确定性提示'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindMacroFilterEvents();
    },

    filterMacroEvents(events, filter) {
        if (filter === 'all') return events;
        return events.filter(e => e.type === filter);
    },

    bindMacroFilterEvents() {
        const filterBtns = document.querySelectorAll('.macro-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.currentMacroFilter = filter;
                this.renderMacroPanel();
            });
        });
    },

    parseMacroAI(text) {
        if (!text) return { mechanism: '', duration: '', uncertainty: '' };

        let mechanism = '';
        let duration = '';
        let uncertainty = '';

        const uncertaintyKeywords = /不确定|风险|注意|关注|需关注|难以|可能|或|变数|波动/;
        const durationKeywords = /持续|周期|短期|中期|长期|时间|预计|展望|季度|年度/;

        const sentences = text.split(/[。；\n]/).filter(s => s.trim().length > 0);

        const mechanismSentences = [];
        const durationSentences = [];
        const uncertaintySentences = [];

        sentences.forEach(sentence => {
            const trimmed = sentence.trim();
            if (!trimmed) return;

            if (uncertaintyKeywords.test(trimmed)) {
                uncertaintySentences.push(trimmed);
            } else if (durationKeywords.test(trimmed)) {
                durationSentences.push(trimmed);
            } else {
                mechanismSentences.push(trimmed);
            }
        });

        if (mechanismSentences.length > 0) {
            mechanism = mechanismSentences.slice(0, Math.ceil(mechanismSentences.length * 0.5)).join('。') + '。';
        }
        if (durationSentences.length > 0) {
            duration = durationSentences.join('。') + '。';
        } else if (mechanismSentences.length > 0) {
            duration = mechanismSentences.slice(Math.floor(mechanismSentences.length * 0.3), Math.ceil(mechanismSentences.length * 0.7)).join('。') + '。';
        }
        if (uncertaintySentences.length > 0) {
            uncertainty = uncertaintySentences.join('。') + '。';
        }

        if (!mechanism) mechanism = text;
        if (!duration) duration = '宏观事件影响周期通常为1-3个季度，具体持续时间取决于事件性质和后续政策应对。';
        if (!uncertainty) uncertainty = '宏观环境复杂多变，需密切关注政策动向和经济数据变化。';

        return { mechanism, duration, uncertainty };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    GuXiTong.init();
});
