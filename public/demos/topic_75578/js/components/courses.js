/**
 * 学智云学习平台 - 视频课程组件
 */

const CoursesComponent = {
    currentCourse: null,
    currentVideo: null,

    /**
     * 渲染课程列表页面
     * @returns {string} HTML字符串
     */
    render() {
        const params = Router.getParams();

        if (params.courseId) {
            return this.renderCourseDetail(params.courseId);
        }

        return this.renderCourseList();
    },

    /**
     * 获取当前年级可用的科目列表
     * @returns {array} 科目列表
     */
    getAvailableSubjects() {
        const currentGrade = Storage.getCurrentGrade();
        
        if (currentGrade <= 6) {
            return [
                { name: 'all', label: '全部' },
                { name: 'chinese', label: '语文' },
                { name: 'math', label: '数学' },
                { name: 'english', label: '英语' },
                { name: 'science', label: '科学' }
            ];
        } else {
            return [
                { name: 'all', label: '全部' },
                { name: 'chinese', label: '语文' },
                { name: 'math', label: '数学' },
                { name: 'english', label: '英语' },
                { name: 'physics', label: '物理' },
                { name: 'chemistry', label: '化学' },
                { name: 'biology', label: '生物' }
            ];
        }
    },

    /**
     * 根据年级获取可用的课程列表
     * @returns {array} 课程列表
     */
    getFilteredCourses() {
        const currentGrade = Storage.getCurrentGrade();
        const allCourses = API.getCourses();

        if (currentGrade <= 6) {
            return allCourses.filter(course => {
                return course.grade === currentGrade && 
                       !['physics', 'chemistry', 'biology'].includes(course.subject);
            });
        } else {
            return allCourses.filter(course => {
                return course.grade === currentGrade &&
                       course.subject !== 'science';
            });
        }
    },

    /**
     * 渲染课程列表
     * @returns {string} HTML字符串
     */
    renderCourseList() {
        const currentGrade = Storage.getCurrentGrade();
        const courses = this.getFilteredCourses();
        const subjects = this.getAvailableSubjects();

        return `
            <div class="page-header">
                <h1>视频课程</h1>
                <p>${Helpers.getGradeName(currentGrade)} - 选择课程开始学习，提升你的知识水平</p>
            </div>

            <!-- 科目筛选 -->
            <div class="course-filter">
                ${subjects.map(s => `
                    <button class="filter-option ${s.name === 'all' ? 'active' : ''}"
                            onclick="CoursesComponent.filterBySubject('${s.name}')">
                        ${s.label}
                    </button>
                `).join('')}
            </div>

            <!-- 课程列表 -->
            <div class="course-list" id="courseList">
                ${courses.length > 0 ? courses.map(course => this.renderCourseItem(course)).join('') : this.renderEmptyState()}
            </div>
        `;
    },

    /**
     * 渲染空状态
     * @returns {string} HTML字符串
     */
    renderEmptyState() {
        const currentGrade = Storage.getCurrentGrade();
        return `
            <div class="no-data-container">
                <i class="el-icon-document" style="font-size: 48px; color: var(--text-light);"></i>
                <p>${Helpers.getGradeName(currentGrade)}暂无课程</p>
                <p>请尝试选择其他年级或科目</p>
            </div>
        `;
    },

    /**
     * 渲染课程项
     * @param {object} course - 课程信息
     * @returns {string} HTML字符串
     */
    renderCourseItem(course) {
        return `
            <div class="course-item" onclick="CoursesComponent.viewCourse('${course.id}')">
                <div class="course-thumbnail-wrapper">
                    <img src="${course.coverImage}" alt="${course.title}" class="course-thumbnail" onerror="this.src='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=课程封面，学习教育，渐变背景&image_size=landscape_4_3'">
                    <div class="course-badge">${Helpers.getSubjectName(course.subject)}</div>
                </div>
                <div class="course-body">
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-desc">${course.description}</p>
                    <div class="course-footer">
                        <div class="course-duration">
                            <i class="el-icon-video-camera-solid"></i>
                            <span>${course.videos ? course.videos.length : 0}个视频</span>
                        </div>
                        <div class="course-difficulty">
                            ${Helpers.generateStarsHTML(course.difficulty)}
                        </div>
                    </div>
                    <div class="course-stats">
                        <span><i class="el-icon-user"></i> ${course.studentsCount}人学习</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 渲染课程详情页
     * @param {string} courseId - 课程ID
     * @returns {string} HTML字符串
     */
    renderCourseDetail(courseId) {
        const course = API.getCourse(courseId);

        if (!course) {
            return `
                <div class="no-data-container">
                    <i class="el-icon-document" style="font-size: 48px; color: var(--text-light);"></i>
                    <p>课程不存在</p>
                    <button class="action-btn submit-btn" onclick="CoursesComponent.backToList()">返回课程列表</button>
                </div>
            `;
        }

        this.currentCourse = course;
        const videos = course.videos || [];
        const firstVideo = videos.length > 0 ? videos[0] : null;

        return `
            <!-- 返回按钮 -->
            <div class="back-link">
                <button class="action-btn skip-btn" onclick="CoursesComponent.backToList()">
                    <i class="el-icon-arrow-left"></i> 返回课程列表
                </button>
            </div>

            <!-- 课程详情 -->
            <div class="course-detail">
                <div class="course-detail-header">
                    <div class="course-detail-info">
                        <span class="course-badge">${Helpers.getSubjectName(course.subject)}</span>
                        <h1>${course.title}</h1>
                        <p>${course.description}</p>
                        <div class="course-meta-row">
                            <span><i class="el-icon-user"></i> ${course.studentsCount}人学习</span>
                            <span><i class="el-icon-video-camera-solid"></i> ${videos.length}个视频</span>
                            <span>难度：${Helpers.generateStarsHTML(course.difficulty)}</span>
                        </div>
                    </div>
                    <img src="${course.coverImage}" alt="${course.title}" class="course-detail-cover" onerror="this.src='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=课程封面，学习教育，渐变背景&image_size=landscape_4_3'">
                </div>

                <!-- 视频播放区域 -->
                <div class="video-player-section">
                    <h3>课程视频</h3>
                    <div class="video-layout">
                        <!-- 视频播放器 -->
                        <div class="video-player-wrapper">
                            <video id="courseVideoPlayer" class="video-player" controls>
                                <source src="${firstVideo ? firstVideo.url : ''}" type="video/mp4">
                                您的浏览器不支持视频播放。
                            </video>
                            <!-- 视频错误提示容器 -->
                            <div id="videoErrorContainer" class="video-error-container" style="display: none;">
                            </div>
                            <div class="video-info">
                                <h4 id="currentVideoTitle">${firstVideo ? firstVideo.title : '暂无视频'}</h4>
                                ${firstVideo ? `
                                <div class="video-knowledge">
                                    <span>知识点：</span>
                                    ${firstVideo.knowledgePoints.map(kp => `<span class="knowledge-tag">${kp}</span>`).join('')}
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- 视频列表 -->
                        <div class="video-list-sidebar">
                            <h5>课程目录</h5>
                            <div class="video-list">
                                ${videos.map((video, index) => `
                                    <div class="video-list-item ${index === 0 ? 'active' : ''}"
                                         onclick="CoursesComponent.playVideo('${video.id}')">
                                        <div class="video-item-number">${index + 1}</div>
                                        <div class="video-item-info">
                                            <div class="video-item-title">${video.title}</div>
                                            <div class="video-item-duration">
                                                <i class="el-icon-time"></i> ${Helpers.formatTimestamp(video.duration)}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 查看课程详情
     * @param {string} courseId - 课程ID
     */
    viewCourse(courseId) {
        Router.setParams({ courseId });
    },

    /**
     * 返回课程列表
     */
    backToList() {
        // 清除参数
        window.location.hash = 'courses';
        Router.refresh();
    },

    /**
     * 播放指定视频
     * @param {string} videoId - 视频ID
     */
    playVideo(videoId) {
        if (!this.currentCourse) return;

        const video = this.currentCourse.videos.find(v => v.id === videoId);
        if (!video) return;

        this.currentVideo = video;

        // 更新视频播放器源
        const player = document.getElementById('courseVideoPlayer');
        const errorContainer = document.getElementById('videoErrorContainer');
        if (player) {
            // 隐藏错误提示
            if (errorContainer) {
                errorContainer.style.display = 'none';
            }
            
            player.src = video.url;
            player.load();
            
            // 尝试播放
            try {
                player.play().catch(error => {
                    // 处理自动播放失败（浏览器可能阻止自动播放）
                    if (error.name === 'NotAllowedError') {
                        Helpers.showMessage('请点击播放按钮开始播放', 'info');
                    }
                });
            } catch (e) {
                this.showVideoError('视频加载失败，请稍后重试');
            }
        }

        // 更新当前视频标题
        const titleEl = document.getElementById('currentVideoTitle');
        if (titleEl) {
            titleEl.textContent = video.title;
        }

        // 更新视频列表激活状态
        const videoItems = document.querySelectorAll('.video-list-item');
        videoItems.forEach(item => {
            item.classList.remove('active');
        });

        // 记录观看
        API.recordVideoWatch(videoId, this.currentCourse.id);
    },

    /**
     * 显示视频错误提示
     * @param {string} message - 错误消息
     */
    showVideoError(message) {
        const errorContainer = document.getElementById('videoErrorContainer');
        const player = document.getElementById('courseVideoPlayer');
        
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="video-error-content">
                    <i class="el-icon-warning" style="font-size: 48px; color: var(--danger-color);"></i>
                    <p>${message}</p>
                    <button onclick="CoursesComponent.retryVideo()" class="retry-btn">
                        <i class="el-icon-refresh"></i> 重试
                    </button>
                </div>
            `;
            errorContainer.style.display = 'flex';
        }
        
        if (player) {
            player.style.display = 'none';
        }
    },

    /**
     * 重试播放视频
     */
    retryVideo() {
        if (this.currentVideo) {
            const errorContainer = document.getElementById('videoErrorContainer');
            const player = document.getElementById('courseVideoPlayer');
            
            if (errorContainer) {
                errorContainer.style.display = 'none';
            }
            
            if (player) {
                player.style.display = 'block';
                player.load();
                player.play().catch(e => {
                    Helpers.showMessage('视频播放失败，请检查网络连接', 'error');
                });
            }
        }
    },

    /**
     * 按科目筛选课程
     * @param {string} subject - 科目名称
     */
    filterBySubject(subject) {
        const buttons = document.querySelectorAll('.course-filter .filter-option');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === Helpers.getSubjectName(subject) || (subject === 'all' && btn.textContent === '全部')) {
                btn.classList.add('active');
            }
        });

        const courseList = document.getElementById('courseList');
        if (courseList) {
            let courses = this.getFilteredCourses();
            if (subject !== 'all') {
                courses = courses.filter(c => c.subject === subject);
            }
            courseList.innerHTML = courses.length > 0 ? courses.map(course => this.renderCourseItem(course)).join('') : this.renderEmptyState();
        }
    },

    /**
     * 初始化视频课程组件
     */
    init() {
        const params = Router.getParams();
        if (params.courseId && this.currentCourse) {
            // 如果在课程详情页，添加视频事件监听
            const player = document.getElementById('courseVideoPlayer');
            if (player) {
                // 视频播放完成
                player.addEventListener('ended', () => {
                    Helpers.showMessage('视频播放完成！', 'success');
                });
                
                // 视频加载错误
                player.addEventListener('error', (e) => {
                    const error = player.error;
                    let message = '视频加载失败';
                    
                    if (error) {
                        switch (error.code) {
                            case 1:
                                message = '视频加载被中止';
                                break;
                            case 2:
                                message = '网络错误，请检查网络连接';
                                break;
                            case 3:
                                message = '视频解码失败';
                                break;
                            case 4:
                                message = '视频格式不支持';
                                break;
                        }
                    }
                    
                    this.showVideoError(message);
                });
                
                // 视频加载等待
                player.addEventListener('waiting', () => {
                    Helpers.showMessage('视频缓冲中...', 'info');
                });
                
                // 视频可以播放
                player.addEventListener('canplay', () => {
                    const errorContainer = document.getElementById('videoErrorContainer');
                    if (errorContainer) {
                        errorContainer.style.display = 'none';
                    }
                    player.style.display = 'block';
                });
            }
        }
    }
};

window.CoursesComponent = CoursesComponent;