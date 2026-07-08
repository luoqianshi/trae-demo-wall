/**
 * 学智云学习平台 - 首页组件
 */

const HomeComponent = {
    /**
     * 渲染首页
     * @returns {string} HTML字符串
     */
    render() {
        return `
            <!-- 学科选择区域 -->
            <div class="subject-section">
                <h2 class="section-title">选择学科开始学习</h2>
                <div class="subject-grid">
                    ${this.renderSubjectCards()}
                </div>
            </div>

            <!-- 学习进度概览 -->
            <div class="progress-overview">
                <h2>学习进度概览</h2>
                <div class="progress-chart-container">
                    <div id="progressChart" class="progress-chart"></div>
                    <div class="progress-details">
                        ${this.renderProgressDetails()}
                    </div>
                </div>
            </div>

            <!-- 推荐课程 -->
            <div class="recommend-courses">
                <h2>推荐课程</h2>
                <div class="course-slider">
                    ${this.renderRecommendedCourses()}
                </div>
            </div>
        `;
    },

    /**
     * 渲染学科卡片
     * @returns {string} HTML字符串
     */
    renderSubjectCards() {
        const currentGrade = Storage.getCurrentGrade();
        
        // 根据年级动态调整学科
        let subjects;
        if (currentGrade <= 6) {
            // 小学：语文、数学、英语、科学
            subjects = [
                { name: 'chinese', label: '语文', desc: '阅读、写作、诗词鉴赏', icon: 'el-icon-document' },
                { name: 'math', label: '数学', desc: '计算、几何、应用题', icon: 'el-icon-c-scale-to-original' },
                { name: 'english', label: '英语', desc: '词汇、语法、阅读理解', icon: 'el-icon-chat-line-square' },
                { name: 'science', label: '科学', desc: '自然、实验、探究', icon: 'el-icon-flask-round', grades: '1-6年级' }
            ];
        } else {
            // 初中：语文、数学、英语、物理、化学、生物
            subjects = [
                { name: 'chinese', label: '语文', desc: '阅读、写作、诗词鉴赏', icon: 'el-icon-document' },
                { name: 'math', label: '数学', desc: '计算、几何、应用题', icon: 'el-icon-c-scale-to-original' },
                { name: 'english', label: '英语', desc: '词汇、语法、阅读理解', icon: 'el-icon-chat-line-square' },
                { name: 'physics', label: '物理', desc: '力学、电学、光学', icon: 'el-icon-connection', grades: '7-9年级' },
                { name: 'chemistry', label: '化学', desc: '元素、反应、实验', icon: 'el-icon-magic-stick', grades: '7-9年级' },
                { name: 'biology', label: '生物', desc: '细胞、遗传、生态', icon: 'el-icon-s-flag', grades: '7-9年级' }
            ];
        }

        return subjects.map(subject => `
            <div class="subject-card ${subject.name}" onclick="HomeComponent.selectSubject('${subject.name}')">
                <div class="subject-icon">
                    <i class="${subject.icon}"></i>
                </div>
                <h3 class="subject-name">${subject.label}</h3>
                <p class="subject-desc">${subject.desc}</p>
                ${subject.grades ? `<p class="subject-grade">${subject.grades}</p>` : ''}
            </div>
        `).join('');
    },

    /**
     * 渲染进度详情
     * @returns {string} HTML字符串
     */
    renderProgressDetails() {
        const todayStats = Storage.getTodayStats();

        return `
            <div class="progress-item">
                <div class="progress-icon" style="background: linear-gradient(135deg, #4A90E2, #5BA3F5);">
                    <i class="el-icon-time"></i>
                </div>
                <div class="progress-info">
                    <h4>今日学习时长</h4>
                    <span>${Helpers.formatTime(todayStats.totalTime)}</span>
                </div>
            </div>

            <div class="progress-item">
                <div class="progress-icon" style="background: linear-gradient(135deg, #27AE60, #2ECC71);">
                    <i class="el-icon-success"></i>
                </div>
                <div class="progress-info">
                    <h4>今日正确率</h4>
                    <span>${todayStats.accuracy}% (${todayStats.correctQuestions}/${todayStats.totalQuestions}题)</span>
                </div>
            </div>

            <div class="progress-item">
                <div class="progress-icon" style="background: linear-gradient(135deg, #F5A623, #F7B731);">
                    <i class="el-icon-video-camera-solid"></i>
                </div>
                <div class="progress-info">
                    <h4>今日观看视频</h4>
                    <span>${todayStats.totalVideos} 个</span>
                </div>
            </div>
        `;
    },

    /**
     * 渲染推荐课程
     * @returns {string} HTML字符串
     */
    renderRecommendedCourses() {
        const currentGrade = Storage.getCurrentGrade();
        const courses = API.getCourses({ grade: currentGrade });

        if (courses.length === 0) {
            return '<p class="no-data">暂无推荐课程</p>';
        }

        return courses.slice(0, 3).map(course => `
            <div class="course-card" onclick="Router.navigate('courses')">
                <img src="${course.coverImage}" alt="${course.title}" class="course-cover" onerror="this.src='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=课程封面，学习教育，渐变背景&image_size=landscape_4_3'">
                <div class="course-info">
                    <h4 class="course-title">${course.title}</h4>
                    <div class="course-meta">
                        <div class="course-students">
                            <i class="el-icon-user"></i>
                            <span>${course.studentsCount}人学习</span>
                        </div>
                        <div class="course-difficulty">
                            ${Helpers.generateStarsHTML(course.difficulty)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * 选择学科
     * @param {string} subject - 学科名称
     */
    selectSubject(subject) {
        // 设置当前学科
        Storage.setCurrentSubject(subject);

        // 跳转到题库练习页面
        Router.navigate('practice');

        Helpers.showMessage(`已选择${Helpers.getSubjectName(subject)}，开始学习！`, 'success');
    },

    /**
     * 初始化进度图表
     */
    initProgressChart() {
        const chartDom = document.getElementById('progressChart');
        if (!chartDom) return;

        const myChart = echarts.init(chartDom);
        const subjectStats = Storage.getSubjectStats();

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}%'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                show: false
            },
            series: [
                {
                    name: '学习进度',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: false,
                        position: 'center'
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
                        { value: subjectStats.english.accuracy || 0, name: '英语', itemStyle: { color: '#27AE60' } },
                        { value: subjectStats.physics.accuracy || 0, name: '物理', itemStyle: { color: '#9B59B6' } },
                        { value: subjectStats.chemistry.accuracy || 0, name: '化学', itemStyle: { color: '#E74C3C' } },
                        { value: subjectStats.biology.accuracy || 0, name: '生物', itemStyle: { color: '#16A085' } },
                        { value: subjectStats.science.accuracy || 0, name: '科学', itemStyle: { color: '#8E44AD' } }
                    ]
                }
            ]
        };

        myChart.setOption(option);

        // 响应式调整
        window.addEventListener('resize', () => {
            myChart.resize();
        });
    }
};

// 导出HomeComponent对象
window.HomeComponent = HomeComponent;