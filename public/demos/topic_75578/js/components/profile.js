/**
 * 学智云学习平台 - 个人中心组件
 */

const ProfileComponent = {
    /**
     * 渲染个人中心页面
     * @returns {string} HTML字符串
     */
    render() {
        const currentUser = Auth.getCurrentUser();

        if (!currentUser) {
            return `
                <div class="no-data-container">
                    <i class="el-icon-user" style="font-size: 48px; color: var(--text-light);"></i>
                    <p>请先登录</p>
                    <button class="action-btn submit-btn" onclick="App.showLoginModal()">登录</button>
                </div>
            `;
        }

        return `
            <!-- 用户信息 -->
            <div class="profile-section">
                <div class="profile-header">
                    <div class="avatar-upload-wrapper">
                        <img src="${currentUser.avatar}" alt="${currentUser.name}" class="profile-avatar" id="profileAvatar" onerror="this.src='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=用户头像图标，简约风格，绿色背景&image_size=square'">
                        <div class="avatar-upload-overlay" onclick="ProfileComponent.showAvatarUpload()">
                            <i class="el-icon-camera"></i>
                            <span>更换头像</span>
                        </div>
                    </div>
                    <!-- 隐藏的文件上传input -->
                    <input type="file" id="avatarInput" accept="image/*" style="display: none;" onchange="ProfileComponent.handleAvatarUpload(event)">
                    <div class="profile-info">
                        <h2 class="profile-name">${currentUser.name}</h2>
                        <p class="profile-meta">
                            ${Helpers.getGradeName(currentUser.grade || 1)} | 
                            ${currentUser.role === 'student' ? '学生' : currentUser.role === 'parent' ? '家长' : '教师'}
                        </p>
                        <p class="profile-meta">注册时间：${Helpers.formatDate(currentUser.createdAt)}</p>
                    </div>
                </div>

                <div class="profile-form">
                    <h3>修改个人信息</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>姓名</label>
                            <input type="text" value="${currentUser.name}" id="profileName">
                        </div>
                        <div class="form-group">
                            <label>年级</label>
                            <select id="profileGrade">
                                ${Array.from({ length: 9 }, (_, i) => `
                                    <option value="${i + 1}" ${currentUser.grade === i + 1 ? 'selected' : ''}>
                                        ${Helpers.getGradeName(i + 1)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>邮箱</label>
                            <input type="email" value="${currentUser.email || ''}" id="profileEmail">
                        </div>
                        <div class="form-group">
                            <label>手机号</label>
                            <input type="text" value="${currentUser.phone}" id="profilePhone" disabled>
                        </div>
                    </div>
                    <button class="action-btn submit-btn" onclick="ProfileComponent.updateProfile()">保存修改</button>
                </div>
            </div>

            <!-- 学习统计 -->
            <div class="profile-section">
                <h3>学习统计</h3>
                <div class="report-stats">
                    <div class="stat-card">
                        <div class="stat-value">${Storage.getLearningRecords().length}</div>
                        <div class="stat-label">总学习记录</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Storage.getMistakes().length}</div>
                        <div class="stat-label">错题数量</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Storage.getTodayStats().accuracy}%</div>
                        <div class="stat-label">今日正确率</div>
                    </div>
                </div>
            </div>

            <!-- 账号状态 -->
            ${this.renderAccountStatus()}

            <!-- 快速入口 -->
            <div class="profile-section">
                <h3>快速入口</h3>
                <div class="quick-access">
                    <button class="action-btn skip-btn" onclick="Router.navigate('mistakes')">
                        <i class="el-icon-document"></i> 错题本
                    </button>
                    <button class="action-btn skip-btn" onclick="Router.navigate('history')">
                        <i class="el-icon-time"></i> 学习历史
                    </button>
                    <button class="action-btn skip-btn" onclick="Router.navigate('report')">
                        <i class="el-icon-data-analysis"></i> 学习报告
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * 显示头像上传选择器
     */
    showAvatarUpload() {
        const input = document.getElementById('avatarInput');
        if (input) {
            input.click();
        }
    },

    /**
     * 处理头像上传
     * @param {Event} event - 文件选择事件
     */
    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            Helpers.showMessage('请选择图片文件', 'warning');
            return;
        }

        // 检查文件大小（限制为2MB）
        if (file.size > 2 * 1024 * 1024) {
            Helpers.showMessage('图片大小不能超过2MB', 'warning');
            return;
        }

        // 读取文件并转换为base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Image = e.target.result;
            
            // 更新头像显示
            const avatarImg = document.getElementById('profileAvatar');
            if (avatarImg) {
                avatarImg.src = base64Image;
            }

            // 更新导航栏头像
            const navbarAvatar = document.querySelector('.avatar');
            if (navbarAvatar) {
                navbarAvatar.src = base64Image;
            }

            // 保存到用户数据
            const result = Auth.updateUser({ avatar: base64Image });
            
            if (result.success) {
                Helpers.showMessage('头像更新成功', 'success');
            } else {
                Helpers.showMessage('头像保存失败', 'error');
            }
        };

        reader.onerror = () => {
            Helpers.showMessage('图片读取失败', 'error');
        };

        reader.readAsDataURL(file);
        
        // 清空input，允许重复选择同一文件
        event.target.value = '';
    },

    /**
     * 更新用户信息
     */
    updateProfile() {
        const name = document.getElementById('profileName').value;
        const grade = document.getElementById('profileGrade').value;
        const email = document.getElementById('profileEmail').value;

        if (!name) {
            Helpers.showMessage('请填写姓名', 'warning');
            return;
        }

        const result = Auth.updateUser({ name, grade: parseInt(grade), email });

        if (result.success) {
            Helpers.showMessage('信息更新成功', 'success');
            Router.refresh();
        } else {
            Helpers.showMessage(result.message, 'error');
        }
    },

    /**
     * 渲染错题本
     * @returns {string} HTML字符串
     */
    renderMistakes() {
        const mistakes = Storage.getMistakes();

        if (mistakes.length === 0) {
            return `
                <div class="no-data-container">
                    <i class="el-icon-document" style="font-size: 48px; color: var(--text-light);"></i>
                    <p>错题本为空</p>
                    <p>继续加油，保持正确率！</p>
                </div>
            `;
        }

        return `
            <div class="mistakes-list">
                <h2>错题本 (${mistakes.length}题)</h2>
                ${mistakes.map(mistake => `
                    <div class="mistake-item">
                        <div class="mistake-question">${mistake.question}</div>
                        <div class="mistake-answer">
                            <span class="wrong">错误答案：${mistake.wrongAnswer}</span>
                            <span class="correct">正确答案：${mistake.correctAnswer}</span>
                        </div>
                        <div class="mistake-explanation">${mistake.explanation}</div>
                        <div class="mistake-actions">
                            <button class="action-btn skip-btn" onclick="ProfileComponent.removeMistake('${mistake.id}')">
                                已掌握
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * 移除错题
     * @param {string} mistakeId - 错题ID
     */
    removeMistake(mistakeId) {
        Storage.removeMistake(mistakeId);
        Helpers.showMessage('已从错题本移除', 'success');
        Router.refresh();
    },

    /**
     * 渲染学习历史
     * @returns {string} HTML字符串
     */
    renderHistory() {
        const records = Storage.getLearningRecords();

        if (records.length === 0) {
            return `
                <div class="no-data-container">
                    <i class="el-icon-time" style="font-size: 48px; color: var(--text-light);"></i>
                    <p>暂无学习记录</p>
                    <p>开始学习吧！</p>
                </div>
            `;
        }

        return `
            <div class="history-list">
                <h2>学习历史</h2>
                ${records.slice(0, 20).map(record => `
                    <div class="history-item">
                        <div class="history-time">${Helpers.formatDate(record.startTime)}</div>
                        <div class="history-content">
                            ${record.itemType === 'question' ? '完成题目' : '观看视频'}
                            ${record.subject ? ` - ${Helpers.getSubjectName(record.subject)}` : ''}
                            ${record.score ? ` - 正确率 ${record.score}%` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderAccountStatus() {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return '';

        const banInfo = Auth.checkBlacklist(currentUser.id);
        const isWhitelisted = Auth.checkWhitelist(currentUser.id);

        let statusHtml = `
            <div class="profile-section">
                <h3>账号状态</h3>
                <div class="account-status">
                    <div class="status-item">
                        <span class="status-label">账号状态：</span>
                        <span class="status-value ${banInfo ? 'banned' : 'normal'}">
                            ${banInfo ? '已封禁' : '正常'}
                        </span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">白名单：</span>
                        <span class="status-value ${isWhitelisted ? 'whitelisted' : ''}">
                            ${isWhitelisted ? '是' : '否'}
                        </span>
                    </div>
        `;

        if (banInfo) {
            statusHtml += `
                    <div class="ban-details">
                        <p><strong>封禁原因：</strong>${banInfo.reason || '未说明'}</p>
                        <p><strong>封禁开始：</strong>${Helpers.formatDate(banInfo.banStartTime)}</p>
                        ${banInfo.banEndTime ? `
                            <p><strong>封禁结束：</strong>${Helpers.formatDate(banInfo.banEndTime)}</p>
                        ` : '<p><strong>封禁类型：</strong>永久封禁</p>'}
                    </div>
                    <div class="appeal-section">
                        <textarea id="appealReason" placeholder="请输入解封申诉理由..." rows="3"></textarea>
                        <button class="action-btn submit-btn" onclick="ProfileComponent.submitAppeal()">提交申诉</button>
                    </div>
            `;
        }

        statusHtml += `
                </div>
            </div>
        `;

        return statusHtml;
    },

    submitAppeal() {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        const reason = document.getElementById('appealReason').value;
        if (!reason.trim()) {
            Helpers.showMessage('请输入申诉理由', 'warning');
            return;
        }

        const result = Auth.submitAppeal(currentUser.id, reason);
        if (result.success) {
            Helpers.showMessage(result.message, 'success');
            document.getElementById('appealReason').value = '';
        } else {
            Helpers.showMessage(result.message, 'error');
        }
    }
};

window.ProfileComponent = ProfileComponent;