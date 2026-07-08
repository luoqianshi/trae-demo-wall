// ============ 通用工具函数 ============

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function checkLogin() {
    return !!localStorage.getItem('neighbor_token');
}

function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('neighbor_user');
        if (userStr) return JSON.parse(userStr);
    } catch (e) {}
    return null;
}

function setCurrentUser(user) {
    try {
        localStorage.setItem('neighbor_user', JSON.stringify(user));
    } catch (e) {}
}

function logout() {
    try {
        localStorage.removeItem('neighbor_token');
        localStorage.removeItem('neighbor_user');
    } catch (e) {}
}

function navigateTo(url) {
    window.location.href = url;
}

// ============ Toast 提示 ============
let _toastTimer = null;
function showToast(msg, type, duration) {
    if (!msg) return;
    const typeName = type || 'success';
    const dur = duration || 2000;

    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        document.body.appendChild(toast);
    }

    const iconMap = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const colorMap = {
        success: '#52C41A',
        error: '#FF4D4F',
        warning: '#FAAD14',
        info: '#1890FF'
    };
    const icon = iconMap[typeName] || '';
    const bg = colorMap[typeName] || '#C45D3A';

    toast.textContent = (icon ? icon + '  ' : '') + msg;
    toast.style.cssText =
        'position:fixed;top:30%;left:50%;transform:translate(-50%,0);' +
        'background:' + bg + ';color:white;padding:12px 24px;border-radius:8px;' +
        'font-size:14px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.2);' +
        'max-width:80%;text-align:center;pointer-events:none;opacity:1;' +
        'transition:opacity .3s;';

    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
        toast.style.opacity = '0';
    }, dur);
}

// ============ Confirm 确认弹窗 ============
function showConfirm(title, content, okText, cancelText) {
    return new Promise(function (resolve) {
        const modalId = 'app-confirm-modal';
        let modal = document.getElementById(modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            document.body.appendChild(modal);
        }

        modal.style.cssText =
            'position:fixed;top:0;left:0;right:0;bottom:0;' +
            'background:rgba(0,0,0,0.5);z-index:99998;' +
            'display:flex;align-items:center;justify-content:center;padding:20px;';

        modal.innerHTML =
            '<div style="background:white;border-radius:12px;width:100%;max-width:360px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.15);">' +
                '<div style="padding:20px 16px 8px;text-align:center;font-size:16px;font-weight:500;color:#333;">' + (title || '提示') + '</div>' +
                '<div style="padding:0 16px 20px;text-align:center;font-size:14px;color:#666;line-height:1.6;">' + (content || '') + '</div>' +
                '<div style="display:flex;border-top:1px solid #eee;">' +
                    '<button id="app-confirm-cancel" style="flex:1;padding:14px;background:white;border:none;font-size:15px;color:#999;cursor:pointer;border-right:1px solid #eee;">' + (cancelText || '取消') + '</button>' +
                    '<button id="app-confirm-ok" style="flex:1;padding:14px;background:white;border:none;font-size:15px;color:#C45D3A;font-weight:500;cursor:pointer;">' + (okText || '确定') + '</button>' +
                '</div>' +
            '</div>';

        modal.querySelector('#app-confirm-cancel').onclick = function () {
            modal.style.display = 'none';
            resolve(false);
        };
        modal.querySelector('#app-confirm-ok').onclick = function () {
            modal.style.display = 'none';
            resolve(true);
        };
    });
}

// ============ 模态框控制 ============
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

// ============ 隐私协议复选框 ============
function bindPrivacyCheckbox(containerEl) {
    if (!containerEl) return;

    containerEl.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') return;
        containerEl.classList.toggle('checked');
    });

    return {
        isChecked: function () {
            return containerEl.classList.contains('checked');
        },
        setChecked: function (val) {
            if (val) containerEl.classList.add('checked');
            else containerEl.classList.remove('checked');
        },
        toggle: function () {
            containerEl.classList.toggle('checked');
        }
    };
}

// ============ 日期格式化 ============
function formatDate(date, fmt) {
    const d = date instanceof Date ? date : new Date(date);
    const f = fmt || 'YYYY-MM-DD HH:mm';
    const pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return f
        .replace('YYYY', d.getFullYear())
        .replace('MM', pad(d.getMonth() + 1))
        .replace('DD', pad(d.getDate()))
        .replace('HH', pad(d.getHours()))
        .replace('mm', pad(d.getMinutes()))
        .replace('ss', pad(d.getSeconds()));
}

// ============ 数字格式化（加千分位） ============
function formatNumber(num) {
    const n = Number(num) || 0;
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============ 手机隐藏中间四位 ============
function maskPhone(phone) {
    if (!phone || phone.length < 11) return phone;
    return phone.substr(0, 3) + '****' + phone.substr(7);
}

// ============ 简单防抖 ============
function debounce(fn, delay) {
    let timer = null;
    return function () {
        const ctx = this;
        const args = arguments;
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(ctx, args);
        }, delay || 300);
    };
}

// ============ 简单节流 ============
function throttle(fn, delay) {
    let last = 0;
    return function () {
        const now = Date.now();
        if (now - last >= (delay || 300)) {
            last = now;
            fn.apply(this, arguments);
        }
    };
}

// ============ 深拷贝（简单实现） ============
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(function (item) { return deepClone(item); });
    const result = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = deepClone(obj[key]);
        }
    }
    return result;
}

// ============ 页面初始化（路由） ============
function init() {
    const path = window.location.pathname.split('/').pop() || 'index.html';

    // 处理页面通用导航高亮
    const navItems = document.querySelectorAll('.tab-bar .tab-item');
    navItems.forEach(function (item) {
        const href = item.getAttribute('data-href') || item.getAttribute('href') || '';
        if (href && href.indexOf(path) !== -1) {
            item.classList.add('active');
        }
    });

    // 登录页面
    if (path === 'login.html') {
        const btnLogin = document.getElementById('btn-login-submit');
        if (btnLogin) {
            btnLogin.addEventListener('click', async function () {
                const phoneInput = document.getElementById('phone');
                const pwdInput = document.getElementById('password');
                const phone = phoneInput ? phoneInput.value.trim() : '';
                const password = pwdInput ? pwdInput.value.trim() : '';

                if (!/^1\d{10}$/.test(phone)) {
                    showToast('请输入正确的手机号', 'error');
                    return;
                }
                if (password.length < 6) {
                    showToast('密码至少6位', 'error');
                    return;
                }

                try {
                    const res = await window.AuthAPI.login(phone, password);
                    if (res && res.token) {
                        setCurrentUser(res.user);
                        localStorage.setItem('neighbor_token', res.token);
                        showToast('登录成功', 'success');
                        setTimeout(function () { navigateTo('index.html'); }, 1000);
                    } else {
                        showToast('登录失败', 'error');
                    }
                } catch (err) {
                    showToast('登录失败', 'error');
                }
            });
        }

        // 隐私协议绑定
        const privacyEl = document.querySelector('.privacy-agreement');
        if (privacyEl) bindPrivacyCheckbox(privacyEl);
    }

    // 注册页面
    if (path === 'register.html') {
        const btn = document.getElementById('btn-register');
        if (btn) {
            btn.addEventListener('click', async function () {
                const nameInput = document.getElementById('reg-name');
                const phoneInput = document.getElementById('reg-phone');
                const pwdInput = document.getElementById('reg-password');
                const pwd2Input = document.getElementById('reg-password2');
                const buildingInput = document.getElementById('reg-building');
                const unitInput = document.getElementById('reg-unit');
                const roomInput = document.getElementById('reg-room');

                const name = nameInput ? nameInput.value.trim() : '';
                const phone = phoneInput ? phoneInput.value.trim() : '';
                const password = pwdInput ? pwdInput.value.trim() : '';
                const password2 = pwd2Input ? pwd2Input.value.trim() : '';
                const building = buildingInput ? buildingInput.value.trim() : '';
                const unit = unitInput ? unitInput.value.trim() : '';
                const room = roomInput ? roomInput.value.trim() : '';

                if (!name) { showToast('请输入姓名', 'error'); return; }
                if (!/^1\d{10}$/.test(phone)) { showToast('请输入正确的手机号', 'error'); return; }
                if (password.length < 6) { showToast('密码至少6位', 'error'); return; }
                if (password !== password2) { showToast('两次密码不一致', 'error'); return; }
                if (!building || !unit || !room) { showToast('请填写完整的楼栋信息', 'error'); return; }

                const privacyEl = document.querySelector('.privacy-agreement');
                if (privacyEl && !privacyEl.classList.contains('checked')) {
                    showToast('请先同意用户协议和隐私政策', 'warning');
                    return;
                }

                try {
                    const res = await window.AuthAPI.register({
                        name: name, phone: phone, password: password,
                        building: building, unit: unit, room: room
                    });
                    if (res && res.success !== false) {
                        showToast('注册成功', 'success');
                        setTimeout(function () { navigateTo('login.html'); }, 1200);
                    } else {
                        showToast('注册失败', 'error');
                    }
                } catch (err) {
                    showToast('注册失败', 'error');
                }
            });
        }

        const privacyEl = document.querySelector('.privacy-agreement');
        if (privacyEl) bindPrivacyCheckbox(privacyEl);
    }

    // 首页
    if (path === 'index.html') {
        // 积分显示
        const pointsEl = document.getElementById('home-points');
        if (pointsEl && window.PointsAPI) {
            window.PointsAPI.getBalance().then(function (res) {
                pointsEl.textContent = res && res.balance != null ? res.balance : '0';
            }).catch(function () {
                pointsEl.textContent = checkLogin() ? '0' : '请登录';
            });
        }

        // 用户问候
        const greetEl = document.getElementById('greeting-text');
        if (greetEl) {
            const user = getCurrentUser();
            greetEl.textContent = user && user.name ? '您好，' + user.name : '欢迎来到邻里智联';
        }

        // 快捷入口
        document.querySelectorAll('[data-href]').forEach(function (item) {
            item.addEventListener('click', function () {
                const href = item.getAttribute('data-href');
                if (href) navigateTo(href);
            });
        });

        // 首页通知轮播
        const noticeText = document.getElementById('announcement-text');
        if (noticeText && window.NoticeAPI) {
            window.NoticeAPI.list({ page: 1, size: 3 }).then(function (res) {
                const list = (res && res.list) || [];
                if (list.length > 0) {
                    let idx = 0;
                    noticeText.textContent = list[0].title || '';
                    setInterval(function () {
                        idx = (idx + 1) % list.length;
                        noticeText.textContent = list[idx].title || '';
                    }, 3500);
                }
            }).catch(function () {});
        }

        // 热门共享
        const hotSharesContainer = document.getElementById('hot-shares');
        if (hotSharesContainer && window.ShareAPI) {
            window.ShareAPI.list({ page: 1, size: 6 }).then(function (res) {
                const list = (res && res.list) || [];
                if (!list.length) return;
                hotSharesContainer.innerHTML = '';
                list.forEach(function (item) {
                    const div = document.createElement('div');
                    div.style.cssText =
                        'flex-shrink:0;width:130px;background:white;border-radius:12px;' +
                        'padding:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);cursor:pointer;';
                    div.innerHTML =
                        '<div style="font-size:40px;text-align:center;">' + (item.image || '📦') + '</div>' +
                        '<div style="font-size:13px;font-weight:500;color:#333;margin-top:6px;' +
                        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (item.name || '') + '</div>' +
                        '<div style="font-size:12px;color:#C45D3A;margin-top:4px;font-weight:500;">' +
                        (item.price && !item.is_free ? '¥' + item.price + '/天' : '免费共享') + '</div>';
                    div.onclick = function () { navigateTo('share.html'); };
                    hotSharesContainer.appendChild(div);
                });
            }).catch(function () {});
        }
    }

    // 报修页面
    if (path === 'repair.html') {
        // 提交报修
        const btnSubmit = document.getElementById('btn-repair-submit');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', async function () {
                if (!checkLogin()) {
                    showToast('请先登录', 'warning');
                    setTimeout(function () { navigateTo('login.html'); }, 1000);
                    return;
                }
                const categoryItem = document.querySelector('.category-item.active');
                if (!categoryItem) { showToast('请选择问题分类', 'warning'); return; }
                const category = categoryItem.getAttribute('data-category') || '其他';
                const descEl = document.getElementById('repair-desc');
                const locationEl = document.getElementById('repair-location');
                const desc = descEl ? descEl.value.trim() : '';
                const location = locationEl ? locationEl.value.trim() : '';
                if (!desc) { showToast('请描述问题', 'warning'); return; }

                try {
                    const res = await window.WorkOrderAPI.create({
                        category: category, description: desc, location: location
                    });
                    if (res && res.success !== false) {
                        showToast('报修已提交', 'success');
                        if (descEl) descEl.value = '';
                        if (locationEl) locationEl.value = '';
                        document.querySelectorAll('.category-item').forEach(function (c) {
                            c.classList.remove('active');
                        });
                        loadRepairHistory();
                    } else {
                        showToast('提交失败', 'error');
                    }
                } catch (err) {
                    showToast('提交失败', 'error');
                }
            });
        }

        // 分类选择
        document.querySelectorAll('.category-item').forEach(function (item) {
            item.addEventListener('click', function () {
                document.querySelectorAll('.category-item').forEach(function (c) {
                    c.classList.remove('active');
                });
                item.classList.add('active');
            });
        });

        // 加载历史
        loadRepairHistory();

        // 评价按钮
        document.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'btn-rate-submit') {
                const stars = document.getElementById('rating-stars');
                const value = parseInt(stars && stars.getAttribute('data-value') || '0');
                if (value <= 0) { showToast('请选择评分', 'warning'); return; }
                const orderId = e.target.getAttribute('data-order-id');
                if (!orderId) return;
                window.WorkOrderAPI.rate(orderId, value, '').then(function () {
                    showToast('评价成功', 'success');
                    closeModal('rating-modal');
                    loadRepairHistory();
                }).catch(function () { showToast('评价失败', 'error'); });
            }
        });
    }

    // 共享页面
    if (path === 'share.html') {
        loadShareList();

        // 分类切换
        document.querySelectorAll('#share-categories .filter-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('#share-categories .filter-tab').forEach(function (t) {
                    t.classList.remove('active');
                });
                tab.classList.add('active');
                loadShareList(tab.getAttribute('data-cat'));
            });
        });

        // 发布
        document.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'btn-publish-submit') {
                submitShareItem();
            }
        });

        // 我的发布 / 我的借用 tab
        document.querySelectorAll('.page-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.page-tab').forEach(function (t) {
                    t.classList.remove('active');
                });
                tab.classList.add('active');
                const idx = Array.from(tab.parentElement.children).indexOf(tab);
                document.querySelectorAll('.tab-panel').forEach(function (p, i) {
                    p.style.display = i === idx ? 'block' : 'none';
                });
                if (idx === 1 && window.ShareAPI) {
                    window.ShareAPI.myPublished().then(function (res) {
                        renderMyPublished((res && res.list) || []);
                    }).catch(function () {});
                }
                if (idx === 2 && window.ShareAPI) {
                    window.ShareAPI.myBorrowed().then(function (res) {
                        renderMyBorrowed((res && res.list) || []);
                    }).catch(function () {});
                }
            });
        });
    }

    // 通知页面
    if (path === 'notices.html') {
        loadNoticeList();

        document.querySelectorAll('#notice-categories .filter-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('#notice-categories .filter-tab').forEach(function (t) {
                    t.classList.remove('active');
                });
                tab.classList.add('active');
                loadNoticeList(tab.getAttribute('data-cat'));
            });
        });
    }

    // 积分页面
    if (path === 'points.html') {
        // 余额
        if (window.PointsAPI) {
            window.PointsAPI.getBalance().then(function (res) {
                const el = document.getElementById('my-points');
                if (el) el.textContent = res && res.balance != null ? res.balance : '0';
            }).catch(function () {});
        }

        // 积分商城
        loadGoodsList();

        // tab 切换
        document.querySelectorAll('.page-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.page-tab').forEach(function (t) {
                    t.classList.remove('active');
                });
                tab.classList.add('active');
                const idx = Array.from(tab.parentElement.children).indexOf(tab);
                document.querySelectorAll('.tab-panel').forEach(function (p, i) {
                    p.style.display = i === idx ? 'block' : 'none';
                });
                if (idx === 1) loadPointsHistory();
                if (idx === 2) loadPointsRules();
            });
        });

        // 兑换按钮
        document.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'btn-exchange-confirm') {
                const goodsId = e.target.getAttribute('data-goods-id');
                if (!goodsId) return;
                window.PointsAPI.exchange(goodsId).then(function (res) {
                    if (res && res.success !== false) {
                        showToast('兑换成功', 'success');
                        closeModal('exchange-modal');
                        if (window.PointsAPI) {
                            window.PointsAPI.getBalance().then(function (r) {
                                const el = document.getElementById('my-points');
                                if (el) el.textContent = r && r.balance != null ? r.balance : '0';
                            }).catch(function () {});
                        }
                    } else {
                        showToast(res.message || '积分不足', 'error');
                    }
                }).catch(function () { showToast('兑换失败', 'error'); });
            }
        });
    }

    // 个人中心页面
    if (path === 'profile.html') {
        const user = getCurrentUser();
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML =
                '<div style="font-size:18px;font-weight:600;color:white;margin-bottom:6px;">' +
                (user && user.name ? user.name : '未登录') + '</div>' +
                '<div style="font-size:13px;color:rgba(255,255,255,0.85);">' +
                (user && user.phone ? maskPhone(user.phone) : '点击登录') + '</div>' +
                (user && (user.building || user.unit || user.room)
                    ? '<div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">' +
                      (user.building || '') + ' ' + (user.unit || '') + ' ' + (user.room || '') + '</div>'
                    : '');
        }

        // 积分显示
        const myPointsEl = document.getElementById('my-points');
        if (myPointsEl && window.PointsAPI) {
            window.PointsAPI.getBalance().then(function (res) {
                myPointsEl.textContent = res && res.balance != null ? res.balance : '0';
            }).catch(function () {});
        }

        // 菜单点击
        document.querySelectorAll('.menu-item').forEach(function (item) {
            item.addEventListener('click', function () {
                const href = item.getAttribute('data-href');
                if (href) navigateTo(href);
            });
        });

        // 退出登录
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                showConfirm('退出登录', '确定要退出当前账号吗？', '确定退出', '取消').then(function (ok) {
                    if (ok) {
                        if (window.AuthAPI) {
                            window.AuthAPI.logout().then(function () {
                                logout();
                                showToast('已退出登录', 'success');
                                setTimeout(function () { navigateTo('index.html'); }, 800);
                            }).catch(function () {
                                logout();
                                navigateTo('index.html');
                            });
                        } else {
                            logout();
                            navigateTo('index.html');
                        }
                    }
                });
            });
        }
    }

    // 政务页面 / 其他页面通用
    if (path === 'government.html') {
        // 快捷入口跳转
        document.querySelectorAll('[data-href]').forEach(function (item) {
            item.addEventListener('click', function () {
                const href = item.getAttribute('data-href');
                if (href) navigateTo(href);
            });
        });

        // 诉求列表
        if (window.AppealAPI) {
            window.AppealAPI.list({ page: 1, size: 10 }).then(function (res) {
                const container = document.getElementById('appeal-list');
                if (!container) return;
                const list = (res && res.list) || [];
                if (!list.length) {
                    container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">暂无诉求记录</div>';
                    return;
                }
                container.innerHTML = '';
                list.forEach(function (item) {
                    const statusColor = item.status === '已完成' ? '#52C41A'
                        : item.status === '处理中' ? '#FAAD14' : '#C45D3A';
                    const div = document.createElement('div');
                    div.style.cssText =
                        'background:white;border-radius:12px;padding:14px;margin-bottom:12px;' +
                        'box-shadow:0 2px 8px rgba(0,0,0,0.06);cursor:pointer;';
                    div.innerHTML =
                        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                            '<div style="font-size:15px;font-weight:500;color:#333;">' + (item.title || '') + '</div>' +
                            '<div style="background:' + statusColor + ';color:white;font-size:12px;' +
                            'padding:3px 10px;border-radius:4px;">' + (item.status || '待处理') + '</div>' +
                        '</div>' +
                        '<div style="font-size:13px;color:#666;line-height:1.6;margin-bottom:8px;">' +
                        (item.description || '') + '</div>' +
                        '<div style="font-size:12px;color:#999;">🕒 ' + (item.created_at || '') + '</div>';
                    container.appendChild(div);
                });
            }).catch(function () {});
        }

        // 提交诉求
        const submitBtn = document.getElementById('btn-appeal-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', async function () {
                if (!checkLogin()) {
                    showToast('请先登录', 'warning');
                    setTimeout(function () { navigateTo('login.html'); }, 1000);
                    return;
                }
                const titleEl = document.getElementById('appeal-title');
                const typeEl = document.getElementById('appeal-type');
                const descEl = document.getElementById('appeal-desc');
                const title = titleEl ? titleEl.value.trim() : '';
                const type = typeEl ? typeEl.value : '建议反馈';
                const desc = descEl ? descEl.value.trim() : '';
                if (!title) { showToast('请输入标题', 'warning'); return; }
                if (!desc) { showToast('请输入详细内容', 'warning'); return; }

                try {
                    const res = await window.AppealAPI.create({
                        title: title, description: desc, type: type
                    });
                    if (res && res.success !== false) {
                        showToast('提交成功', 'success');
                        if (titleEl) titleEl.value = '';
                        if (descEl) descEl.value = '';
                    } else {
                        showToast('提交失败', 'error');
                    }
                } catch (err) {
                    showToast('提交失败', 'error');
                }
            });
        }
    }
}

// ============ 报修历史加载 ============
function loadRepairHistory() {
    if (!window.WorkOrderAPI) return;
    const container = document.getElementById('repair-history-list');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">加载中...</div>';

    window.WorkOrderAPI.list({ page: 1, size: 20 }).then(function (res) {
        const list = (res && res.list) || [];
        if (!list.length) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-size:14px;">暂无报修记录</div>';
            return;
        }
        container.innerHTML = '';
        list.forEach(function (item) {
            const statusColor = item.status === '已完成' ? '#52C41A'
                : item.status === '处理中' ? '#FAAD14' : '#C45D3A';
            const div = document.createElement('div');
            div.style.cssText =
                'background:white;border-radius:12px;padding:14px;margin-bottom:12px;' +
                'box-shadow:0 2px 8px rgba(0,0,0,0.06);';
            div.innerHTML =
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">' +
                    '<div style="font-size:15px;font-weight:500;color:#333;">' + (item.category || '维修') + '</div>' +
                    '<div style="background:' + statusColor + ';color:white;font-size:12px;' +
                    'padding:3px 10px;border-radius:4px;">' + (item.status || '待处理') + '</div>' +
                '</div>' +
                '<div style="font-size:13px;color:#666;line-height:1.6;margin-bottom:6px;">' + (item.description || '') + '</div>' +
                (item.location ? '<div style="font-size:12px;color:#999;margin-bottom:8px;">📍 ' + item.location + '</div>' : '') +
                '<div style="font-size:12px;color:#999;margin-bottom:10px;">🕒 ' + (item.created_at || '') + '</div>';
            if (item.status === '已完成' && !item.rating) {
                const rateBtn = document.createElement('button');
                rateBtn.textContent = '评价服务';
                rateBtn.style.cssText =
                    'width:100%;padding:10px;background:#FFF5EE;border:none;border-radius:8px;' +
                    'color:#C45D3A;font-size:13px;font-weight:500;cursor:pointer;';
                rateBtn.onclick = function () { showRateModal(item.id); };
                div.appendChild(rateBtn);
            }
            container.appendChild(div);
        });
    }).catch(function () {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">加载失败</div>';
    });
}

// ============ 评价弹窗 ============
let _currentRateOrderId = null;
function showRateModal(orderId) {
    _currentRateOrderId = orderId;
    const modal = document.getElementById('rating-modal');
    if (!modal) return;
    const starsEl = document.getElementById('rating-stars');
    if (starsEl) {
        starsEl.style.cssText = 'display:flex;justify-content:center;gap:10px;padding:16px 0;font-size:32px;';
        starsEl.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.textContent = '★';
            star.style.cssText = 'cursor:pointer;color:#ddd;transition:color .2s;';
            star.setAttribute('data-v', i);
            star.onclick = function () {
                const v = parseInt(star.getAttribute('data-v'));
                starsEl.querySelectorAll('span').forEach(function (s, idx) {
                    s.style.color = idx < v ? '#FAAD14' : '#ddd';
                });
                starsEl.setAttribute('data-value', v);
            };
            starsEl.appendChild(star);
        }
        starsEl.setAttribute('data-value', '0');
    }
    const submitBtn = document.getElementById('btn-rate-submit');
    if (submitBtn) submitBtn.setAttribute('data-order-id', orderId);
    openModal('rating-modal');
}

// ============ 共享列表加载 ============
function loadShareList(category) {
    if (!window.ShareAPI) return;
    const container = document.getElementById('share-list');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">加载中...</div>';

    const params = {};
    if (category && category !== '全部') params.category = category;

    window.ShareAPI.list(params).then(function (res) {
        const list = (res && res.list) || [];
        if (!list.length) {
            container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">暂无物品</div>';
            return;
        }
        container.innerHTML = '';
        list.forEach(function (item) {
            const div = document.createElement('div');
            div.style.cssText =
                'background:white;border-radius:12px;padding:12px;' +
                'box-shadow:0 2px 8px rgba(0,0,0,0.06);cursor:pointer;';
            const priceText = item.is_free === false && item.price
                ? '¥' + item.price + '/天'
                : '免费';
            const statusText = item.available === false ? '已借出' : '可借';
            const statusColor = item.available === false ? '#999' : '#52C41A';
            div.innerHTML =
                '<div style="font-size:44px;text-align:center;">' + (item.image || '📦') + '</div>' +
                '<div style="font-size:14px;font-weight:500;color:#333;margin-top:6px;' +
                'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (item.name || '') + '</div>' +
                '<div style="font-size:12px;color:#999;margin-top:4px;">' + (item.condition || '') + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">' +
                    '<div style="font-size:14px;color:#C45D3A;font-weight:600;">' + priceText + '</div>' +
                    '<div style="font-size:11px;color:' + statusColor + ';">' + statusText + '</div>' +
                '</div>';
            div.onclick = function () { showShareItemDetail(item); };
            container.appendChild(div);
        });
    }).catch(function () {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">加载失败</div>';
    });
}

// ============ 共享详情 ============
let _currentDetailItem = null;
function showShareItemDetail(item) {
    _currentDetailItem = item;
    const body = document.getElementById('share-detail-body');
    if (!body) return;
    const priceText = item.is_free === false && item.price
        ? '¥' + item.price + '/天'
        : '免费共享';
    body.innerHTML =
        '<div style="text-align:center;padding:16px 0;">' +
            '<div style="font-size:72px;">' + (item.image || '📦') + '</div>' +
        '</div>' +
        '<div style="font-size:18px;font-weight:600;color:#333;text-align:center;">' + (item.name || '') + '</div>' +
        '<div style="font-size:14px;color:#C45D3A;font-weight:600;text-align:center;margin-top:6px;">' + priceText + '</div>' +
        '<div style="font-size:12px;color:#999;text-align:center;margin-top:6px;">' +
        '新旧程度：' + (item.condition || '') + ' · 分类：' + (item.category || '') + '</div>' +
        '<div style="background:#FFF5EE;padding:12px;border-radius:8px;margin:12px 0;' +
        'font-size:13px;color:#666;line-height:1.8;">' + (item.description || '暂无详细描述') + '</div>' +
        '<div style="font-size:12px;color:#999;">发布者：' + (item.owner || '社区住户') + '</div>' +
        '<div style="font-size:12px;color:#999;margin-top:4px;">发布时间：' + (item.created_at || '') + '</div>';

    const borrowBtn = document.getElementById('btn-borrow-item');
    if (borrowBtn) {
        borrowBtn.style.display = item.available === false ? 'none' : 'block';
        borrowBtn.onclick = function () {
            if (!checkLogin()) {
                showToast('请先登录', 'warning');
                setTimeout(function () { navigateTo('login.html'); }, 1000);
                return;
            }
            showConfirm('确认借用', '您确定要借用"' + (item.name || '') + '"吗？', '立即借用', '取消').then(function (ok) {
                if (!ok) return;
                window.ShareAPI.borrow(item.id).then(function () {
                    showToast('借用申请已发送', 'success');
                    closeModal('share-detail-modal');
                    loadShareList();
                }).catch(function () { showToast('借用失败', 'error'); });
            });
        };
    }

    const contactBtn = document.getElementById('btn-contact-owner');
    if (contactBtn) {
        contactBtn.onclick = function () {
            if (!checkLogin()) {
                showToast('请先登录', 'warning');
                setTimeout(function () { navigateTo('login.html'); }, 1000);
                return;
            }
            const contactId = 'share_' + item.id;
            const contact = {
                id: contactId,
                name: item.owner || '发布者',
                subject: '关于：' + (item.name || ''),
                color: '#C45D3A',
                lastMessage: '',
                unread: false,
                messages: [],
                lastTime: new Date().toLocaleString('zh-CN', { hour12: false })
            };
            saveOrUpdateContact(contact);
            navigateTo('notices.html?tab=contacts&open=' + contactId);
        };
    }

    const reportBtn = document.getElementById('btn-report-item');
    if (reportBtn) {
        reportBtn.onclick = function () {
            if (!checkLogin()) {
                showToast('请先登录', 'warning');
                setTimeout(function () { navigateTo('login.html'); }, 1000);
                return;
            }
            openComplaintModal({
                type: 'item',
                target_item_id: item.id,
                target_item_name: item.name,
                target_user_id: 'u_' + (item.owner || '发布者'),
                target_user_name: item.owner || '发布者'
            });
        };
    }
    openModal('share-detail-modal');
}

// ============ 联系人/消息管理工具函数 ============
function getContactsFromStorage() {
    try {
        const s = localStorage.getItem('neighbor_contacts');
        return s ? JSON.parse(s) : [];
    } catch (e) {
        return [];
    }
}

function saveContactsToStorage(list) {
    try {
        localStorage.setItem('neighbor_contacts', JSON.stringify(list));
    } catch (e) {}
}

function getContactList() {
    return getContactsFromStorage();
}

function getContactById(id) {
    const list = getContactsFromStorage();
    return list.find(function (c) { return c.id === id; }) || null;
}

function saveOrUpdateContact(contact) {
    const list = getContactsFromStorage();
    const idx = list.findIndex(function (c) { return c.id === contact.id; });
    if (idx >= 0) {
        list[idx] = Object.assign({}, list[idx], contact);
    } else {
        list.unshift(contact);
    }
    saveContactsToStorage(list);
}

function markContactRead(id) {
    const list = getContactsFromStorage();
    const idx = list.findIndex(function (c) { return c.id === id; });
    if (idx >= 0) {
        list[idx].unread = false;
        saveContactsToStorage(list);
    }
}

function sendMsgTextToContact(contactId, text) {
    const list = getContactsFromStorage();
    const idx = list.findIndex(function (c) { return c.id === contactId; });
    if (idx < 0) return;
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    list[idx].messages = list[idx].messages || [];
    list[idx].messages.push({ from: 'me', text: text, time: now });
    list[idx].lastMessage = text;
    list[idx].lastTime = now;

    // 模拟自动回复
    setTimeout(function () {
        const replies = [
            '收到，方便的话您可以来看看实物',
            '好的，我在家，随时可以联系',
            '您好，感谢关注，有什么需要了解的？',
            '物品还在，您什么时候方便过来取？'
        ];
        const replyText = replies[Math.floor(Math.random() * replies.length)];
        const list2 = getContactsFromStorage();
        const idx2 = list2.findIndex(function (c) { return c.id === contactId; });
        if (idx2 >= 0) {
            const t2 = new Date().toLocaleString('zh-CN', { hour12: false });
            list2[idx2].messages.push({ from: 'other', text: replyText, time: t2 });
            list2[idx2].lastMessage = replyText;
            list2[idx2].lastTime = t2;
            list2[idx2].unread = true;
            saveContactsToStorage(list2);
        }
    }, 1500);

    saveContactsToStorage(list);
}

// ============ 提交发布 ============
function submitShareItem() {
    if (!checkLogin()) {
        showToast('请先登录', 'warning');
        setTimeout(function () { navigateTo('login.html'); }, 1000);
        return;
    }
    const nameEl = document.getElementById('pub-name');
    const conditionEl = document.getElementById('pub-condition');
    const descEl = document.getElementById('pub-desc');
    const freeEl = document.getElementById('pub-free');
    const priceEl = document.getElementById('pub-price');
    const emojiEl = document.getElementById('pub-emoji');
    const activeCat = document.querySelector('#pub-category .filter-tab.active');

    const name = nameEl ? nameEl.value.trim() : '';
    const condition = conditionEl ? conditionEl.value : '八成新';
    const desc = descEl ? descEl.value.trim() : '';
    const is_free = freeEl ? freeEl.checked : true;
    const price = priceEl ? parseFloat(priceEl.value) || 0 : 0;
    const image = emojiEl ? emojiEl.value || '📦' : '📦';
    const category = activeCat ? activeCat.getAttribute('data-cat') || '其他' : '其他';

    if (!name) { showToast('请输入物品名称', 'warning'); return; }
    if (!is_free && !price) { showToast('请输入租金', 'warning'); return; }

    window.ShareAPI.publish({
        name: name, category: category, condition: condition,
        description: desc, is_free: is_free, price: price, image: image
    }).then(function (res) {
        if (res && res.success !== false) {
            showToast('发布成功', 'success');
            closeModal('publish-modal');
            setTimeout(function () { loadShareList(); }, 500);
        } else {
            showToast('发布失败', 'error');
        }
    }).catch(function () { showToast('发布失败', 'error'); });
}

// ============ 我的发布渲染 ============
function renderMyPublished(list) {
    const container = document.getElementById('my-publish-list');
    if (!container) return;
    if (!list.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-size:14px;">暂无发布物品</div>';
        return;
    }
    container.innerHTML = '';
    list.forEach(function (item) {
        const div = document.createElement('div');
        div.style.cssText =
            'background:white;border-radius:12px;padding:12px;margin-bottom:12px;' +
            'display:flex;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);';
        div.innerHTML =
            '<div style="font-size:36px;margin-right:12px;">' + (item.image || '📦') + '</div>' +
            '<div style="flex:1;">' +
                '<div style="font-size:14px;font-weight:500;color:#333;">' + (item.name || '') + '</div>' +
                '<div style="font-size:12px;color:#999;margin-top:4px;">' + (item.condition || '') + ' · ' + (item.category || '') + '</div>' +
                '<div style="font-size:12px;color:#C45D3A;margin-top:4px;">' +
                (item.is_free === false && item.price ? '¥' + item.price + '/天' : '免费') + '</div>' +
            '</div>' +
            '<div style="font-size:12px;color:' + (item.available === false ? '#999' : '#52C41A') + ';font-weight:500;">' +
            (item.available === false ? '已借出' : '可借') + '</div>';
        container.appendChild(div);
    });
}

// ============ 我的借用渲染 ============
function renderMyBorrowed(list) {
    const container = document.getElementById('my-borrow-list');
    if (!container) return;
    if (!list.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-size:14px;">暂无借用记录</div>';
        return;
    }
    container.innerHTML = '';
    list.forEach(function (item) {
        const div = document.createElement('div');
        div.style.cssText =
            'background:white;border-radius:12px;padding:12px;margin-bottom:12px;' +
            'display:flex;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);';
        div.innerHTML =
            '<div style="font-size:36px;margin-right:12px;">' + (item.image || '📦') + '</div>' +
            '<div style="flex:1;">' +
                '<div style="font-size:14px;font-weight:500;color:#333;">' + (item.name || '') + '</div>' +
                '<div style="font-size:12px;color:#999;margin-top:4px;">借用时间：' + (item.borrow_time || '') + '</div>' +
                '<div style="font-size:12px;color:#999;margin-top:2px;">到期时间：' + (item.expected_return || '') + '</div>' +
            '</div>';
        container.appendChild(div);
    });
}

// ============ 通知列表加载 ============
function loadNoticeList(category) {
    if (!window.NoticeAPI) return;
    const container = document.getElementById('notice-list');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">加载中...</div>';

    const params = {};
    if (category && category !== '全部') params.category = category;

    window.NoticeAPI.list(params).then(function (res) {
        const list = (res && res.list) || [];
        if (!list.length) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-size:14px;">暂无通知</div>';
            return;
        }
        container.innerHTML = '';
        list.forEach(function (item) {
            const icons = { '水电通知': '💧', '社区活动': '🎉', '安全提醒': '🛡️' };
            const icon = icons[item.category] || '📢';
            const div = document.createElement('div');
            div.style.cssText =
                'background:white;border-radius:12px;padding:14px;margin-bottom:12px;' +
                'box-shadow:0 2px 8px rgba(0,0,0,0.06);cursor:pointer;';
            div.innerHTML =
                '<div style="display:flex;gap:12px;">' +
                    '<div style="font-size:28px;flex-shrink:0;">' + icon + '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                            '<div style="font-size:15px;font-weight:500;color:#333;' +
                            'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (item.title || '') + '</div>' +
                            (item.is_read === false ? '<div style="width:8px;height:8px;border-radius:50%;background:#FF4D4F;flex-shrink:0;"></div>' : '') +
                        '</div>' +
                        '<div style="font-size:13px;color:#666;line-height:1.6;max-height:2.5em;overflow:hidden;">' +
                        (item.content || item.summary || '') + '</div>' +
                        '<div style="font-size:12px;color:#999;margin-top:8px;">🕒 ' + (item.created_at || '') + '</div>' +
                    '</div>' +
                '</div>';
            div.onclick = function () { showNoticeDetail(item); };
            container.appendChild(div);
        });
    }).catch(function () {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">加载失败</div>';
    });
}

// ============ 通知详情 ============
function showNoticeDetail(item) {
    const body = document.getElementById('notice-detail-body');
    if (!body) return;
    const icons = { '水电通知': '💧', '社区活动': '🎉', '安全提醒': '🛡️' };
    const icon = icons[item.category] || '📢';
    body.innerHTML =
        '<div style="padding:4px 0;">' +
            '<div style="font-size:20px;font-weight:600;color:#333;margin-bottom:8px;">' + (item.title || '') + '</div>' +
            '<div style="display:flex;gap:10px;font-size:12px;color:#999;margin-bottom:16px;">' +
                '<div>' + icon + ' ' + (item.category || '通知') + '</div>' +
                '<div>🕒 ' + (item.created_at || '') + '</div>' +
            '</div>' +
            '<div style="font-size:14px;color:#555;line-height:1.9;text-indent:2em;">' +
            (item.content || item.summary || '') + '</div>' +
        '</div>';
    if (item.id && window.NoticeAPI) {
        window.NoticeAPI.markRead(item.id).catch(function () {});
    }
    openModal('notice-detail-modal');
}

// ============ 积分商品列表 ============
function loadGoodsList() {
    const container = document.getElementById('goods-list');
    if (!container) return;
    if (!window.PointsAPI) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">加载失败</div>';
        return;
    }
    window.PointsAPI.getGoods().then(function (res) {
        const list = (res && res.list) || [];
        if (!list.length) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">暂无商品</div>';
            return;
        }
        container.innerHTML = '';
        list.forEach(function (item) {
            const div = document.createElement('div');
            div.style.cssText =
                'background:white;border-radius:12px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);';
            div.innerHTML =
                '<div style="font-size:44px;text-align:center;">' + (item.icon || '🎁') + '</div>' +
                '<div style="font-size:13px;font-weight:500;color:#333;margin-top:6px;text-align:center;' +
                'height:32px;line-height:1.3;overflow:hidden;">' + (item.name || '') + '</div>' +
                '<div style="font-size:16px;color:#C45D3A;font-weight:700;text-align:center;margin-top:4px;">' +
                (item.points || 0) + ' 积分</div>' +
                '<div style="font-size:11px;color:#999;text-align:center;margin-top:2px;">库存：' + (item.stock || 0) + '</div>' +
                '<button data-id="' + item.id + '" data-points="' + (item.points || 0) +
                '" data-name="' + (item.name || '') + '" class="exchange-btn" style="margin-top:8px;' +
                'width:100%;padding:8px;background:#C45D3A;color:white;border:none;' +
                'border-radius:6px;font-size:13px;cursor:pointer;">立即兑换</button>';
            const btn = div.querySelector('.exchange-btn');
            if (btn) {
                btn.addEventListener('click', function () {
                    if (!checkLogin()) {
                        showToast('请先登录', 'warning');
                        setTimeout(function () { navigateTo('login.html'); }, 1000);
                        return;
                    }
                    const goodsId = btn.getAttribute('data-id');
                    const body = document.getElementById('exchange-body');
                    if (body) {
                        body.innerHTML =
                            '<div style="padding:8px;">' +
                                '<div style="font-size:15px;color:#333;text-align:center;margin-bottom:10px;">您确定要兑换吗？</div>' +
                                '<div style="font-size:18px;font-weight:600;color:#C45D3A;text-align:center;margin-top:10px;">' +
                                (btn.getAttribute('data-name') || '') + '</div>' +
                                '<div style="font-size:13px;color:#666;text-align:center;margin-top:8px;">将消耗 ' +
                                btn.getAttribute('data-points') + ' 积分</div>' +
                            '</div>';
                    }
                    const confirmBtn = document.getElementById('btn-exchange-confirm');
                    if (confirmBtn) confirmBtn.setAttribute('data-goods-id', goodsId);
                    openModal('exchange-modal');
                });
            }
            container.appendChild(div);
        });
    }).catch(function () {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">加载失败</div>';
    });
}

// ============ 积分历史 ============
function loadPointsHistory() {
    if (!window.PointsAPI) return;
    const container = document.getElementById('history-list');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">加载中...</div>';

    window.PointsAPI.getHistory().then(function (res) {
        const list = (res && res.list) || [];
        if (!list.length) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-size:14px;">暂无积分记录</div>';
            return;
        }
        container.innerHTML = '';
        list.forEach(function (item) {
            const isPlus = (item.change || item.points || 0) > 0;
            const change = item.change || item.points || 0;
            const div = document.createElement('div');
            div.style.cssText =
                'background:white;border-radius:12px;padding:14px;margin-bottom:10px;' +
                'box-shadow:0 2px 8px rgba(0,0,0,0.06);display:flex;align-items:center;';
            div.innerHTML =
                '<div style="flex:1;">' +
                    '<div style="font-size:14px;color:#333;font-weight:500;">' + (item.title || item.description || '') + '</div>' +
                    '<div style="font-size:12px;color:#999;margin-top:4px;">' + (item.created_at || item.time || '') + '</div>' +
                '</div>' +
                '<div style="font-size:16px;font-weight:600;color:' + (isPlus ? '#52C41A' : '#FF4D4F') + ';">' +
                (isPlus ? '+' : '') + change + '</div>';
            container.appendChild(div);
        });
    }).catch(function () {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">加载失败</div>';
    });
}

// ============ 积分规则 ============
function loadPointsRules() {
    if (!window.PointsAPI) return;
    const container = document.getElementById('rules-list');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">加载中...</div>';

    window.PointsAPI.getRules().then(function (res) {
        const list = (res && res.list) || [];
        const rules = list.length ? list : [
            { title: '发布共享物品', desc: '在邻里共享平台发布闲置物品供邻居借用', points: '20 积分/件' },
            { title: '帮助邻居取快递', desc: '帮助邻居代取快递并送达', points: '10 积分/次' },
            { title: '帮忙照看宠物', desc: '邻居外出时代为照看宠物（猫、狗等）', points: '20 积分/天' },
            { title: '陪伴独居老人', desc: '主动陪伴社区登记的独居老人1小时以上', points: '30 积分/次' },
            { title: '报修后评价', desc: '完成报修并对服务质量进行评价反馈', points: '5 积分/次' },
            { title: '参加社区活动', desc: '参加社区组织的各类文化、体育、公益活动', points: '20-50 积分/次' },
            { title: '完善个人资料', desc: '首次完善个人信息并通过楼栋认证', points: '50 积分' },
            { title: '提出建设性建议', desc: '对社区建设或物业服务提出建议被采纳', points: '30-100 积分/条' }
        ];
        container.innerHTML = '';
        rules.forEach(function (item, idx) {
            const div = document.createElement('div');
            div.style.cssText =
                'background:white;border-radius:12px;padding:14px;margin-bottom:10px;' +
                'box-shadow:0 2px 8px rgba(0,0,0,0.06);';
            div.innerHTML =
                '<div style="display:flex;gap:12px;">' +
                    '<div style="width:28px;height:28px;border-radius:50%;background:#C45D3A;color:white;' +
                    'display:flex;align-items:center;justify-content:center;font-size:13px;' +
                    'font-weight:600;flex-shrink:0;">' + (idx + 1) + '</div>' +
                    '<div style="flex:1;">' +
                        '<div style="font-size:14px;font-weight:500;color:#333;margin-bottom:4px;">' +
                        (item.title || '') + '</div>' +
                        '<div style="font-size:12px;color:#666;line-height:1.6;">' +
                        (item.desc || item.description || '') + '</div>' +
                        '<div style="font-size:13px;color:#C45D3A;font-weight:600;margin-top:6px;">' +
                        (item.points || '') + '</div>' +
                    '</div>' +
                '</div>';
            container.appendChild(div);
        });
    }).catch(function () {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">加载失败</div>';
    });
}

// ============ 投诉弹窗（通用） ============
// target 参数: { type: 'item' | 'user', target_item_id, target_item_name, target_user_id, target_user_name }
function openComplaintModal(target) {
    if (!window.ComplaintAPI) {
        showToast('系统升级中，请稍后', 'warning');
        return;
    }
    target = target || {};

    // 动态创建投诉弹窗 DOM
    let modal = document.getElementById('complaint-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'complaint-modal';
        modal.innerHTML =
            '<div class="modal-mask" onclick="closeModal(\'complaint-modal\')"></div>' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<div id="complaint-title">投诉举报</div>' +
                    '<div class="modal-close" onclick="closeModal(\'complaint-modal\')">✕</div>' +
                '</div>' +
                '<div class="modal-body" style="padding:16px;">' +
                    '<div id="complaint-target" style="background:#FFF5EE;padding:10px 12px;border-radius:8px;margin-bottom:12px;font-size:13px;color:#C45D3A;"></div>' +
                    '<div class="form-group" style="margin-bottom:10px;">' +
                        '<label id="complaint-reason-label" style="font-size:13px;color:#333;font-weight:500;">投诉原因</label>' +
                        '<div id="complaint-reasons" style="margin-top:8px;"></div>' +
                    '</div>' +
                    '<div class="form-group" style="margin-bottom:10px;">' +
                        '<label style="font-size:13px;color:#333;font-weight:500;">详细说明 <span style="color:#999;font-weight:400;">（可选）</span></label>' +
                        '<textarea id="complaint-detail" rows="4" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-top:6px;font-size:13px;resize:vertical;font-family:inherit;" placeholder="请详细描述您遇到的问题，帮助我们更好处理..."></textarea>' +
                    '</div>' +
                    '<div style="background:#FAFAFA;padding:10px;border-radius:8px;font-size:12px;color:#999;line-height:1.6;">' +
                        '💡 温馨提示：请如实举报，恶意举报将受到相应处罚。举报信息仅管理员可见，我们会严格保护您的隐私。' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-block" style="background:#F5F5F5;color:#666;" onclick="closeModal(\'complaint-modal\')">取消</button>' +
                    '<button class="btn btn-primary btn-block" id="btn-complaint-submit">提交投诉</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modal);
    }

    // 填充内容
    const titleEl = document.getElementById('complaint-title');
    const targetEl = document.getElementById('complaint-target');
    const reasonLabelEl = document.getElementById('complaint-reason-label');
    const reasonsEl = document.getElementById('complaint-reasons');
    const detailEl = document.getElementById('complaint-detail');

    if (target.type === 'user') {
        titleEl.textContent = '投诉用户';
        targetEl.innerHTML = '👤 被投诉人：<strong>' + (target.target_user_name || '未知用户') + '</strong>';
        reasonLabelEl.textContent = '投诉原因';
    } else {
        titleEl.textContent = '投诉物品';
        targetEl.innerHTML = '📦 被投诉物品：<strong>' + (target.target_item_name || '未知物品') + '</strong><br>' +
                             '<span style="color:#999;font-size:12px;">发布人：' + (target.target_user_name || '未知') + '</span>';
        reasonLabelEl.textContent = '投诉原因';
    }
    detailEl.value = '';

    // 加载并渲染原因列表
    reasonsEl.innerHTML = '<div style="font-size:12px;color:#999;text-align:center;padding:10px;">加载中...</div>';
    window.ComplaintAPI.getReasons(target.type).then(function (res) {
        const reasons = (res && res.list) || [];
        reasonsEl.innerHTML = '';
        reasons.forEach(function (r, idx) {
            const opt = document.createElement('div');
            opt.setAttribute('data-reason', r.value);
            opt.style.cssText = 'padding:10px 12px;margin-bottom:6px;border:1px solid #ddd;border-radius:8px;cursor:pointer;font-size:13px;color:#333;transition:all 0.2s;';
            opt.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><span style="width:16px;height:16px;border:2px solid #ddd;border-radius:50%;flex-shrink:0;"></span><span>' + r.label + '</span></div>';
            opt.onclick = function () {
                reasonsEl.querySelectorAll('div[data-reason]').forEach(function (el) {
                    el.style.border = '1px solid #ddd';
                    el.style.background = 'transparent';
                    const circle = el.querySelector('span');
                    if (circle) { circle.style.borderColor = '#ddd'; circle.style.background = 'transparent'; }
                });
                opt.style.border = '2px solid #C45D3A';
                opt.style.background = '#FFF5EE';
                const circle = opt.querySelector('span');
                if (circle) { circle.style.borderColor = '#C45D3A'; circle.style.background = '#C45D3A'; }
                opt.setAttribute('data-selected', '1');
            };
            if (idx === 0) opt.onclick.call(opt); // 默认选中第一个
            reasonsEl.appendChild(opt);
        });
    });

    // 提交按钮
    const submitBtn = document.getElementById('btn-complaint-submit');
    if (submitBtn) {
        submitBtn.onclick = function () {
            const selectedReason = reasonsEl.querySelector('div[data-selected="1"]');
            const reason = selectedReason ? selectedReason.getAttribute('data-reason') : '';
            const reasonDetail = detailEl.value.trim();

            if (!reason) { showToast('请选择投诉原因', 'warning'); return; }

            submitBtn.textContent = '提交中...';
            submitBtn.style.opacity = '0.6';
            const payload = Object.assign({}, target, {
                reason: reason,
                reason_detail: reasonDetail,
                reporter: (function () {
                    try {
                        const u = JSON.parse(localStorage.getItem('neighbor_user') || '{}');
                        return u.name || u.building ? (u.building + u.room + ' ' + u.name) : '当前用户';
                    } catch (e) { return '当前用户'; }
                })()
            });
            window.ComplaintAPI.submit(payload).then(function (res) {
                submitBtn.textContent = '提交投诉';
                submitBtn.style.opacity = '1';
                if (res && res.success) {
                    showToast('投诉已提交，编号：' + res.no, 'success');
                    setTimeout(function () { closeModal('complaint-modal'); }, 800);
                } else {
                    showToast('提交失败，请重试', 'error');
                }
            }).catch(function () {
                submitBtn.textContent = '提交投诉';
                submitBtn.style.opacity = '1';
                showToast('提交失败，请重试', 'error');
            });
        };
    }
    openModal('complaint-modal');
}

// ============ DOM 就绪后自动初始化 ============
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
