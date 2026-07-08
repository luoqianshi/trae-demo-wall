/**
 * 学智云学习平台 - 登录/注册组件
 */

const LoginComponent = {
    render() {
        return `
            <div class="auth-container">
                <div class="auth-form">
                    <h2>用户登录</h2>
                    <form id="loginFormMain" onsubmit="LoginComponent.handleLogin(event)">
                        <div class="form-group">
                            <label>手机号/邮箱</label>
                            <input type="text" id="loginPhoneMain" placeholder="请输入手机号或邮箱" required>
                            <span class="error-message" id="loginPhoneError"></span>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="loginPasswordMain" placeholder="请输入密码" required>
                            <span class="error-message" id="loginPasswordError"></span>
                        </div>
                        <div class="form-group">
                            <label>用户类型</label>
                            <select id="loginRoleMain">
                                <option value="student">学生</option>
                                <option value="parent">家长</option>
                                <option value="teacher">教师</option>
                            </select>
                        </div>
                        <button type="submit" class="action-btn submit-btn">登录</button>
                        <p class="register-link">还没有账号？<a href="#/register">立即注册</a></p>
                    </form>
                    <div class="demo-accounts">
                        <h4>示例账号：</h4>
                        <p>学生：13800138001 / 123456</p>
                        <p>家长：13900139001 / 123456</p>
                        <p>教师：13700137001 / 123456</p>
                    </div>
                </div>
            </div>
        `;
    },

    clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.parentElement.classList.remove('has-error');
        });
    },

    showError(fieldId, message) {
        this.clearErrors();
        const errorEl = document.getElementById(fieldId + 'Error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.parentElement.classList.add('has-error');
        }
    },

    handleLogin(e) {
        e.preventDefault();
        const phone = document.getElementById('loginPhoneMain').value;
        const password = document.getElementById('loginPasswordMain').value;
        const role = document.getElementById('loginRoleMain').value;

        this.clearErrors();

        if (!phone) {
            this.showError('loginPhone', '请输入手机号或邮箱');
            return;
        }

        if (!password) {
            this.showError('loginPassword', '请输入密码');
            return;
        }

        const result = Auth.login({ phone, password, role });

        if (result.success) {
            Helpers.showMessage('登录成功！', 'success');
            Router.navigate('home');
        } else {
            if (result.banned) {
                const appealBtn = confirm(`${result.message}\n\n是否提交解封申诉？`);
                if (appealBtn) {
                    Router.navigate('profile');
                }
            }
            Helpers.showMessage(result.message, 'error');
        }
    }
};

const RegisterComponent = {
    currentCaptcha: '',

    render() {
        this.currentCaptcha = this.generateCaptcha();
        return `
            <div class="auth-container">
                <div class="auth-form">
                    <h2>用户注册</h2>
                    <form id="registerForm" onsubmit="RegisterComponent.handleRegister(event)">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="registerName" placeholder="请输入用户名" required>
                            <span class="error-message" id="registerNameError"></span>
                        </div>
                        <div class="form-group">
                            <label>手机号</label>
                            <input type="text" id="registerPhone" placeholder="请输入手机号（11位）" required>
                            <span class="error-message" id="registerPhoneError"></span>
                        </div>
                        <div class="form-group">
                            <label>邮箱（可选）</label>
                            <input type="email" id="registerEmail" placeholder="请输入邮箱">
                            <span class="error-message" id="registerEmailError"></span>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="registerPassword" placeholder="请输入密码（至少6位）" required minlength="6">
                            <span class="error-message" id="registerPasswordError"></span>
                        </div>
                        <div class="form-group">
                            <label>确认密码</label>
                            <input type="password" id="registerPasswordConfirm" placeholder="请再次输入密码" required minlength="6">
                            <span class="error-message" id="registerPasswordConfirmError"></span>
                        </div>
                        <div class="form-group">
                            <label>用户类型</label>
                            <select id="registerRole">
                                <option value="student">学生</option>
                                <option value="parent">家长</option>
                                <option value="teacher">教师</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>验证码</label>
                            <div class="captcha-row">
                                <input type="text" id="registerCaptcha" placeholder="请输入验证码" required maxlength="4">
                                <div class="captcha-code" onclick="RegisterComponent.refreshCaptcha()">${this.currentCaptcha}</div>
                                <button type="button" class="captcha-refresh" onclick="RegisterComponent.refreshCaptcha()">
                                    <i class="el-icon-refresh"></i>
                                </button>
                            </div>
                            <span class="error-message" id="registerCaptchaError"></span>
                        </div>
                        <button type="submit" class="action-btn submit-btn">注册</button>
                        <p class="register-link">已有账号？<a href="#/login">立即登录</a></p>
                    </form>
                </div>
            </div>
        `;
    },

    generateCaptcha() {
        const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let captcha = '';
        for (let i = 0; i < 4; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.currentCaptcha = captcha;
        return captcha;
    },

    refreshCaptcha() {
        this.currentCaptcha = this.generateCaptcha();
        const captchaCode = document.querySelector('.captcha-code');
        if (captchaCode) {
            captchaCode.textContent = this.currentCaptcha;
        }
    },

    validateCaptcha(input) {
        return input.toUpperCase() === this.currentCaptcha.toUpperCase();
    },

    clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.parentElement.classList.remove('has-error');
        });
    },

    showError(fieldId, message) {
        const errorEl = document.getElementById(fieldId + 'Error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.parentElement.classList.add('has-error');
        }
    },

    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const phone = document.getElementById('registerPhone').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        const role = document.getElementById('registerRole').value;
        const captcha = document.getElementById('registerCaptcha').value;

        this.clearErrors();

        if (!name || name.trim().length < 2) {
            this.showError('registerName', '用户名至少需要2个字符');
            return;
        }

        if (!Helpers.validatePhone(phone)) {
            this.showError('registerPhone', '请输入正确的11位手机号');
            return;
        }

        if (email && !Helpers.validateEmail(email)) {
            this.showError('registerEmail', '请输入正确的邮箱格式');
            return;
        }

        if (password.length < 6) {
            this.showError('registerPassword', '密码至少需要6位');
            return;
        }

        if (password !== passwordConfirm) {
            this.showError('registerPasswordConfirm', '两次输入的密码不一致');
            return;
        }

        if (!this.validateCaptcha(captcha)) {
            this.showError('registerCaptcha', '验证码错误');
            this.refreshCaptcha();
            document.getElementById('registerCaptcha').value = '';
            return;
        }

        const result = Auth.register({ name, phone, email, password, role });

        if (result.success) {
            Helpers.showMessage('注册成功！', 'success');
            Router.navigate('home');
        } else {
            if (result.message.includes('手机号')) {
                this.showError('registerPhone', result.message);
            } else if (result.message.includes('邮箱')) {
                this.showError('registerEmail', result.message);
            } else {
                Helpers.showMessage(result.message, 'error');
            }
        }
    }
};

const ParentComponent = {
    render() {
        const currentUser = Auth.getCurrentUser();
        
        if (!currentUser || currentUser.role !== 'parent') {
            return `<p>请以家长身份登录</p>`;
        }

        const students = Auth.getBindStudents();

        return `
            <div class="parent-container">
                <h2>家长端</h2>
                <div class="bind-student">
                    <h3>绑定学生</h3>
                    <div class="form-group">
                        <input type="text" id="bindStudentPhone" placeholder="请输入学生手机号">
                        <button class="action-btn submit-btn" onclick="ParentComponent.bindStudent()">绑定</button>
                    </div>
                </div>
                <div class="students-list">
                    <h3>已绑定学生 (${students.length})</h3>
                    ${students.map(student => `
                        <div class="student-card">
                            <h4>${student.name}</h4>
                            <p>${Helpers.getGradeName(student.grade)}</p>
                            <p>学习记录：${Storage.getLearningRecords().filter(r => r.userId === student.id).length}条</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    bindStudent() {
        const phone = document.getElementById('bindStudentPhone').value;
        const result = Auth.bindStudent(phone);

        if (result.success) {
            Helpers.showMessage('绑定成功', 'success');
            Router.refresh();
        } else {
            Helpers.showMessage(result.message, 'error');
        }
    }
};

const TeacherComponent = {
    render() {
        const currentUser = Auth.getCurrentUser();
        
        if (!currentUser || currentUser.role !== 'teacher') {
            return `<p>请以教师身份登录</p>`;
        }

        const appeals = Auth.getAppeals();

        return `
            <div class="teacher-container">
                <h2>教师端</h2>
                <div class="teacher-info">
                    <h3>个人信息</h3>
                    <p>姓名：${currentUser.name}</p>
                    <p>学校：${currentUser.school || '未设置'}</p>
                    <p>科目：${Helpers.getSubjectName(currentUser.subject || 'math')}</p>
                </div>
                <div class="teacher-actions">
                    <h3>教学管理</h3>
                    <p>功能开发中...</p>
                </div>
                <div class="appeal-management">
                    <h3>申诉管理</h3>
                    <div class="appeals-list">
                        ${appeals.length > 0 ? appeals.map(appeal => `
                            <div class="appeal-item">
                                <div class="appeal-header">
                                    <span>申诉ID：${appeal.id}</span>
                                    <span class="appeal-status ${appeal.status}">
                                        ${appeal.status === 'pending' ? '待处理' : appeal.status === 'approved' ? '已通过' : '已拒绝'}
                                    </span>
                                </div>
                                <p>申诉理由：${appeal.reason}</p>
                                <p>提交时间：${Helpers.formatDate(appeal.createdAt)}</p>
                                ${appeal.status === 'pending' ? `
                                    <div class="appeal-actions">
                                        <button class="action-btn submit-btn" onclick="TeacherComponent.handleAppeal('${appeal.id}', 'approved')">通过</button>
                                        <button class="action-btn skip-btn" onclick="TeacherComponent.handleAppeal('${appeal.id}', 'rejected')">拒绝</button>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('') : '<p class="no-data">暂无申诉</p>'}
                    </div>
                </div>
            </div>
        `;
    },

    handleAppeal(appealId, status) {
        const result = Auth.handleAppeal(appealId, status);
        if (result.success) {
            Helpers.showMessage(status === 'approved' ? '申诉已通过，用户已解封' : '申诉已拒绝', 'success');
            Router.refresh();
        } else {
            Helpers.showMessage(result.message, 'error');
        }
    }
};

window.LoginComponent = LoginComponent;
window.RegisterComponent = RegisterComponent;
window.ParentComponent = ParentComponent;
window.TeacherComponent = TeacherComponent;