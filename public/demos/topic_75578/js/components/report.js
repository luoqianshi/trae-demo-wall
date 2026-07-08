/**
 * 学智云学习平台 - 学习报告组件
 */

const ReportComponent = {
    /**
     * 渲染学习报告页面
     * @returns {string} HTML字符串
     */
    render() {
        const reportData = API.getLearningReport();
        const weakPoints = this.analyzeWeakPoints();
        const targetedSuggestions = this.generateTargetedSuggestions(weakPoints);

        return `
            <!-- 今日学习统计 -->
            <div class="report-section">
                <h2 class="report-title">今日学习统计</h2>
                <div class="report-stats">
                    <div class="stat-card">
                        <div class="stat-value">${Helpers.formatTime(reportData.data.todayStats.totalTime)}</div>
                        <div class="stat-label">学习时长</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${reportData.data.todayStats.totalQuestions}</div>
                        <div class="stat-label">完成题目</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${reportData.data.todayStats.accuracy}%</div>
                        <div class="stat-label">正确率</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${reportData.data.todayStats.totalVideos}</div>
                        <div class="stat-label">观看视频</div>
                    </div>
                </div>
            </div>

            <!-- 本周学习趋势 -->
            <div class="report-section">
                <h2 class="report-title">本周学习趋势</h2>
                <div class="report-charts">
                    <div class="chart-container">
                        <h3 class="chart-title">每日学习时长</h3>
                        <div id="weeklyChart" style="height: 300px;"></div>
                    </div>
                    <div class="chart-container">
                        <h3 class="chart-title">每日正确率</h3>
                        <div id="accuracyChart" style="height: 300px;"></div>
                    </div>
                </div>
            </div>

            <!-- 科目掌握度 -->
            <div class="report-section">
                <h2 class="report-title">科目掌握度</h2>
                <div class="report-charts">
                    <div class="chart-container full-width">
                        <h3 class="chart-title">各科目正确率</h3>
                        <div id="subjectChart" style="height: 300px;"></div>
                    </div>
                </div>
            </div>

            <!-- 薄弱知识点分析 -->
            <div class="report-section">
                <h2 class="report-title">薄弱知识点分析</h2>
                ${weakPoints.length > 0 ? `
                    <div class="weak-points-container">
                        ${weakPoints.map(point => `
                            <div class="weak-point-card">
                                <div class="weak-point-header">
                                    <span class="weak-point-subject">${Helpers.getSubjectName(point.subject)}</span>
                                    <span class="weak-point-count">错题 ${point.count} 道</span>
                                </div>
                                <div class="weak-point-name">${point.knowledgePoint}</div>
                                <div class="weak-point-progress">
                                    <div class="progress-bar" style="width: ${point.accuracy}%"></div>
                                    <span class="progress-text">掌握度 ${point.accuracy}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="no-data-container">
                        <i class="el-icon-success" style="font-size: 48px; color: var(--success-color);"></i>
                        <p>太棒了！暂无薄弱知识点</p>
                        <p>继续保持，争取更好成绩！</p>
                    </div>
                `}
            </div>

            <!-- 针对性学习建议 -->
            <div class="report-section">
                <h2 class="report-title">针对性学习建议</h2>
                <div class="targeted-suggestions">
                    ${targetedSuggestions.map(suggestion => `
                        <div class="suggestion-card ${suggestion.priority}">
                            <div class="suggestion-header">
                                <i class="el-icon-${suggestion.priority === 'high' ? 'warning' : suggestion.priority === 'medium' ? 'info' : 'success'}"></i>
                                <span class="suggestion-subject">${Helpers.getSubjectName(suggestion.subject)}</span>
                                <span class="suggestion-priority ${suggestion.priority}">${suggestion.priority === 'high' ? '紧急' : suggestion.priority === 'medium' ? '重要' : '建议'}</span>
                            </div>
                            <div class="suggestion-content">
                                <h4>${suggestion.knowledgePoint}</h4>
                                <p>${suggestion.action}</p>
                            </div>
                            <div class="suggestion-resources">
                                <span>推荐资源：</span>
                                <a href="#courses" onclick="Router.navigate('courses')">${suggestion.resource}</a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 通用学习建议 -->
            <div class="report-section">
                <h2 class="report-title">学习建议</h2>
                <div class="recommendations">
                    ${reportData.data.recommendations.map(rec => `
                        <div class="recommendation-item">
                            <i class="el-icon-s-opportunity"></i>
                            <span>${rec}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * 分析薄弱知识点
     * @returns {array} 薄弱知识点列表
     */
    analyzeWeakPoints() {
        const mistakes = Storage.getMistakes();
        const subjectStats = Storage.getSubjectStats();

        if (mistakes.length === 0) {
            return [];
        }

        // 按知识点统计错题数量
        const knowledgePointStats = {};
        mistakes.forEach(mistake => {
            if (!knowledgePointStats[mistake.knowledgePoint]) {
                knowledgePointStats[mistake.knowledgePoint] = {
                    knowledgePoint: mistake.knowledgePoint,
                    subject: mistake.subject,
                    count: 0,
                    totalAttempts: 0,
                    correctAttempts: 0
                };
            }
            knowledgePointStats[mistake.knowledgePoint].count++;
            knowledgePointStats[mistake.knowledgePoint].totalAttempts++;
        });

        // 计算各知识点掌握度并排序
        const weakPoints = Object.values(knowledgePointStats)
            .map(point => {
                // 计算掌握度（简单估算：错题越多，掌握度越低）
                const accuracy = Math.max(0, Math.min(100, 100 - (point.count * 10)));
                return {
                    ...point,
                    accuracy
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // 只显示前5个薄弱知识点

        return weakPoints;
    },

    /**
     * 生成针对性学习建议
     * @param {array} weakPoints - 薄弱知识点列表
     * @returns {array} 针对性建议列表
     */
    generateTargetedSuggestions(weakPoints) {
        const currentGrade = Storage.getCurrentGrade();
        
        // 定义知识点对应的建议和推荐资源
        const suggestionMap = {
            '加法运算': { action: '多做加法练习题，可以用实物辅助理解加法概念', resource: '相关数学课程' },
            '减法运算': { action: '练习减法，特别注意退位减法的计算方法', resource: '相关数学课程' },
            '乘法运算': { action: '背诵乘法口诀表，每天练习口算乘法', resource: '相关数学课程' },
            '除法运算': { action: '理解除法的含义，多做平均分类型的应用题', resource: '相关数学课程' },
            '方程': { action: '理解方程的基本概念，多做解方程练习', resource: '相关数学课程' },
            '拼音': { action: '反复练习拼音读写，多听拼音音频', resource: '相关语文课程' },
            '成语': { action: '积累常用成语，理解成语的出处和用法', resource: '相关语文课程' },
            '古诗词': { action: '背诵经典诗词，理解诗词的意境和情感', resource: '相关语文课程' },
            '文言文': { action: '掌握文言文常见实词虚词的用法，多读经典文言文', resource: '相关语文课程' },
            '单词': { action: '每天记忆10个新单词，制作单词卡片', resource: '相关英语课程' },
            '语法': { action: '系统学习英语语法规则，多做语法练习题', resource: '相关英语课程' },
            '时态': { action: '对比学习各种时态的区别，多做时态转换练习', resource: '相关英语课程' },
            '声音': { action: '理解声音的产生和传播原理，做相关实验', resource: '相关物理课程' },
            '力': { action: '理解力的概念和作用效果，画力的示意图', resource: '相关物理课程' },
            '电学': { action: '学习电路基本原理，动手做简单电路实验', resource: '相关物理课程' },
            '化学变化': { action: '区分物理变化和化学变化，做化学实验观察', resource: '相关化学课程' },
            '元素': { action: '掌握常见元素的符号和性质，背诵元素周期表前20号元素', resource: '相关化学课程' },
            '细胞': { action: '理解细胞的结构和功能，画细胞结构图', resource: '相关生物课程' },
            '遗传': { action: '学习遗传的基本规律，理解DNA和基因的关系', resource: '相关生物课程' },
            '植物': { action: '观察植物的生长过程，记录植物变化', resource: '相关科学课程' },
            '动物': { action: '学习常见动物的特征和习性，做动物观察记录', resource: '相关科学课程' },
            'default': { action: '多做相关练习题，观看课程视频加深理解', resource: '相关课程' }
        };

        // 如果没有薄弱知识点，生成通用建议
        if (weakPoints.length === 0) {
            return [
                {
                    subject: 'math',
                    knowledgePoint: '保持学习节奏',
                    action: '继续保持每天的学习习惯，挑战更高难度的题目',
                    resource: '进阶课程',
                    priority: 'low'
                },
                {
                    subject: 'chinese',
                    knowledgePoint: '拓展阅读',
                    action: '阅读更多课外书籍，积累词汇和素材',
                    resource: '阅读推荐',
                    priority: 'low'
                }
            ];
        }

        // 根据薄弱知识点生成针对性建议
        return weakPoints.map(point => {
            const suggestion = suggestionMap[point.knowledgePoint] || suggestionMap['default'];
            const priority = point.accuracy < 30 ? 'high' : point.accuracy < 60 ? 'medium' : 'low';

            return {
                subject: point.subject,
                knowledgePoint: point.knowledgePoint,
                action: suggestion.action,
                resource: suggestion.resource,
                priority,
                accuracy: point.accuracy,
                count: point.count
            };
        });
    },

    /**
     * 初始化图表
     */
    initCharts() {
        this.initWeeklyChart();
        this.initAccuracyChart();
        this.initSubjectChart();
    },

    /**
     * 初始化每周学习时长图表
     */
    initWeeklyChart() {
        const chartDom = document.getElementById('weeklyChart');
        if (!chartDom) return;

        const myChart = echarts.init(chartDom);
        const weeklyStats = Storage.getWeeklyStats();

        // 处理空数据情况
        const dates = Object.keys(weeklyStats.dailyStats || {});
        if (dates.length === 0) {
            myChart.setOption({
                title: { text: '暂无学习数据', left: 'center', top: 'center', textStyle: { color: '#999' } }
            });
            return;
        }

        const times = dates.map(date => weeklyStats.dailyStats[date].time || 0);

        const option = {
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: dates.map(date => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                })
            },
            yAxis: {
                type: 'value',
                name: '分钟'
            },
            series: [{
                data: times,
                type: 'line',
                smooth: true,
                itemStyle: {
                    color: '#4A90E2'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0,
                            color: 'rgba(74, 144, 226, 0.5)'
                        }, {
                            offset: 1,
                            color: 'rgba(74, 144, 226, 0.1)'
                        }]
                    }
                }
            }]
        };

        myChart.setOption(option);
        window.addEventListener('resize', () => myChart.resize());
    },

    /**
     * 初始化正确率图表
     */
    initAccuracyChart() {
        const chartDom = document.getElementById('accuracyChart');
        if (!chartDom) return;

        const myChart = echarts.init(chartDom);
        const weeklyStats = Storage.getWeeklyStats();

        const dates = Object.keys(weeklyStats.dailyStats || {});
        if (dates.length === 0) {
            myChart.setOption({
                title: { text: '暂无学习数据', left: 'center', top: 'center', textStyle: { color: '#999' } }
            });
            return;
        }

        const accuracy = dates.map(date => weeklyStats.dailyStats[date].accuracy || 0);

        const option = {
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: dates.map(date => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                })
            },
            yAxis: {
                type: 'value',
                name: '正确率 (%)',
                max: 100
            },
            series: [{
                data: accuracy,
                type: 'bar',
                itemStyle: {
                    color: '#27AE60'
                }
            }]
        };

        myChart.setOption(option);
        window.addEventListener('resize', () => myChart.resize());
    },

    /**
     * 初始化科目掌握度图表
     */
    initSubjectChart() {
        const chartDom = document.getElementById('subjectChart');
        if (!chartDom) return;

        const myChart = echarts.init(chartDom);
        const subjectStats = Storage.getSubjectStats();
        const currentGrade = Storage.getCurrentGrade();

        // 根据年级动态调整显示的科目
        let subjects, colors;
        if (currentGrade <= 6) {
            subjects = ['数学', '语文', '英语', '科学'];
            colors = ['#4A90E2', '#E67E22', '#27AE60', '#8E44AD'];
        } else {
            subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '科学'];
            colors = ['#4A90E2', '#E67E22', '#27AE60', '#9B59B6', '#E74C3C', '#16A085', '#8E44AD'];
        }

        const data = subjects.map((name, index) => {
            const subjectKey = name === '数学' ? 'math' : name === '语文' ? 'chinese' : name === '英语' ? 'english' : 
                              name === '物理' ? 'physics' : name === '化学' ? 'chemistry' : name === '生物' ? 'biology' : 'science';
            return {
                value: subjectStats[subjectKey]?.accuracy || 0,
                itemStyle: { color: colors[index] }
            };
        });

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            xAxis: {
                type: 'value',
                name: '正确率 (%)',
                max: 100
            },
            yAxis: {
                type: 'category',
                data: subjects
            },
            series: [{
                data: data,
                type: 'bar'
            }]
        };

        myChart.setOption(option);
        window.addEventListener('resize', () => myChart.resize());
    }
};

window.ReportComponent = ReportComponent;