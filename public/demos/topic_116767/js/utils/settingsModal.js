var SettingsModal = (function() {
    var APP_VERSION = '1.0.0';
    var EXPORT_VERSION = 2;
    var modalElement = null;
    var fileInput = null;

    var EXTRA_STORAGE_KEYS = [
        'achievements',
        'achievements_stats',
        'favorites',
        'history',
        'global_search_history',
        'budget_versions'
    ];

    function getExportData() {
        var state = App.state;
        var extraData = {};

        for (var i = 0; i < EXTRA_STORAGE_KEYS.length; i++) {
            var key = EXTRA_STORAGE_KEYS[i];
            var value = Storage.load(key);
            if (value !== null && value !== undefined) {
                extraData[key] = value;
            }
        }

        return {
            version: EXPORT_VERSION,
            exportDate: new Date().toISOString(),
            appVersion: APP_VERSION,
            userData: state.userData,
            sopProgress: state.sopProgress,
            budgetPlans: state.budgetPlans,
            homeData: state.homeData,
            globalState: state.globalState,
            extraStorage: extraData
        };
    }

    function validateImportData(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: '数据格式错误' };
        }
        if (!data.sopProgress) {
            return { valid: false, error: '数据损坏或版本不兼容' };
        }
        if (data.version && typeof data.version !== 'number') {
            return { valid: false, error: '版本格式错误' };
        }
        return { valid: true };
    }

    function formatDate(date) {
        var d = new Date(date);
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return year + month + day;
    }

    function exportData() {
        try {
            var exportData = getExportData();
            var jsonStr = JSON.stringify(exportData, null, 2);
            var blob = new Blob([jsonStr], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            
            var a = document.createElement('a');
            a.href = url;
            a.download = 'xm2-backup-' + formatDate(new Date()) + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Toast.success('数据导出成功');
        } catch (e) {
            console.error('Export failed:', e);
            Toast.error('导出失败，请重试');
        }
    }

    function importData(file) {
        if (!file) return;

        var fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.json')) {
            Toast.error('文件格式不正确，请选择正确的备份文件');
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                var validation = validateImportData(data);
                
                if (!validation.valid) {
                    Toast.error(validation.error);
                    return;
                }

                showConfirmModal({
                    title: '确认导入',
                    message: '导入数据会覆盖当前所有进度，是否继续？',
                    confirmText: '确认导入',
                    cancelText: '取消',
                    danger: false,
                    onConfirm: function() {
                        doImport(data);
                    }
                });
            } catch (err) {
                console.error('Import parse error:', err);
                Toast.error('文件格式不正确，请选择正确的备份文件');
            }
        };
        reader.onerror = function() {
            Toast.error('文件读取失败，请重试');
        };
        reader.readAsText(file);
    }

    function doImport(data) {
        try {
            var state = App.state;
            
            if (data.userData) {
                state.userData = deepClone(data.userData);
            }
            if (data.sopProgress) {
                state.sopProgress = deepClone(data.sopProgress);
            }
            if (data.budgetPlans) {
                state.budgetPlans = deepClone(data.budgetPlans);
            }
            if (data.homeData) {
                state.homeData = deepClone(data.homeData);
            }
            if (data.globalState) {
                state.globalState = deepClone(data.globalState);
            }

            if (data.extraStorage && typeof data.extraStorage === 'object') {
                for (var key in data.extraStorage) {
                    if (data.extraStorage.hasOwnProperty(key)) {
                        var value = data.extraStorage[key];
                        Storage.save(key, value);
                    }
                }
            }

            App.saveStateImmediate();
            hide();
            
            Toast.success('数据导入成功');
            setTimeout(function() {
                window.location.reload();
            }, 500);
        } catch (e) {
            console.error('Import failed:', e);
            Toast.error('导入失败，请重试');
        }
    }

    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(deepClone);
        var result = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = deepClone(obj[key]);
            }
        }
        return result;
    }

    function resetData() {
        showConfirmModal({
            title: '确认重置',
            message: '确定要重置所有数据吗？此操作不可撤销！',
            confirmText: '确认重置',
            cancelText: '取消',
            danger: true,
            onConfirm: function() {
                for (var i = 0; i < EXTRA_STORAGE_KEYS.length; i++) {
                    Storage.remove(EXTRA_STORAGE_KEYS[i]);
                }
                App.resetAllData(function() {
                    hide();
                    window.location.reload();
                });
            }
        });
    }

    function showConfirmModal(options) {
        options = options || {};
        
        var overlay = document.createElement('div');
        overlay.className = 'settings-confirm-overlay';
        
        var modal = document.createElement('div');
        modal.className = 'settings-confirm-modal';
        
        var iconHtml = options.danger 
            ? '<div class="confirm-icon danger">⚠️</div>'
            : '<div class="confirm-icon">📋</div>';
        
        modal.innerHTML = `
            ${iconHtml}
            <div class="confirm-title">${options.title || '确认操作'}</div>
            <div class="confirm-message">${options.message || ''}</div>
            <div class="confirm-actions">
                <button class="confirm-btn cancel">${options.cancelText || '取消'}</button>
                <button class="confirm-btn confirm ${options.danger ? 'danger' : ''}">${options.confirmText || '确认'}</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        function closeModal() {
            overlay.classList.add('leaving');
            setTimeout(function() {
                overlay.remove();
            }, 200);
        }
        
        var cancelBtn = modal.querySelector('.confirm-btn.cancel');
        var confirmBtn = modal.querySelector('.confirm-btn.confirm');
        
        cancelBtn.addEventListener('click', function() {
            closeModal();
            if (options.onCancel && typeof options.onCancel === 'function') {
                options.onCancel();
            }
        });
        
        confirmBtn.addEventListener('click', function() {
            closeModal();
            if (options.onConfirm && typeof options.onConfirm === 'function') {
                options.onConfirm();
            }
        });
        
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeModal();
            }
        });
        
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                overlay.classList.add('active');
            });
        });
    }

    function buildModalHTML() {
        return `
            <div class="settings-modal-overlay" id="settings-modal-overlay">
                <div class="settings-modal">
                    <div class="settings-modal-header">
                        <div class="settings-modal-title">设置</div>
                        <button class="settings-modal-close" id="settings-modal-close" aria-label="关闭">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="settings-modal-body">
                        <div class="settings-section">
                            <div class="settings-section-title">成就与收藏</div>
                            <div class="settings-item">
                                <div class="settings-item-info">
                                    <div class="settings-item-icon" style="color: var(--gold);">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                                            <path d="M4 22h16"></path>
                                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                                        </svg>
                                    </div>
                                    <div class="settings-item-content">
                                        <div class="settings-item-name">成就图鉴</div>
                                        <div class="settings-item-desc">查看所有成就和收集进度</div>
                                    </div>
                                </div>
                                <button class="settings-btn" id="settings-achievements-btn">查看</button>
                            </div>
                        </div>
                        <div class="settings-section">
                            <div class="settings-section-title">数据管理</div>
                            <div class="settings-item">
                                <div class="settings-item-info">
                                    <div class="settings-item-icon" style="color: var(--accent-purple, #9333ea);">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                    </div>
                                    <div class="settings-item-content">
                                        <div class="settings-item-name">打包下载</div>
                                        <div class="settings-item-desc">下载完整离线版 ZIP 压缩包</div>
                                    </div>
                                </div>
                                <button class="settings-btn" id="settings-zip-btn">打包</button>
                            </div>
                            <div class="settings-item">
                                <div class="settings-item-info">
                                    <div class="settings-item-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                    </div>
                                    <div class="settings-item-content">
                                        <div class="settings-item-name">导出数据</div>
                                        <div class="settings-item-desc">导出所有数据为 JSON 备份文件</div>
                                    </div>
                                </div>
                                <button class="settings-btn" id="settings-export-btn">导出</button>
                            </div>
                            <div class="settings-item">
                                <div class="settings-item-info">
                                    <div class="settings-item-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="17 8 12 3 7 8"></polyline>
                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                        </svg>
                                    </div>
                                    <div class="settings-item-content">
                                        <div class="settings-item-name">导入数据</div>
                                        <div class="settings-item-desc">从备份文件恢复数据</div>
                                    </div>
                                </div>
                                <button class="settings-btn" id="settings-import-btn">导入</button>
                                <input type="file" id="settings-file-input" accept=".json" style="display: none;">
                            </div>
                            <div class="settings-item">
                                <div class="settings-item-info">
                                    <div class="settings-item-icon danger">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </div>
                                    <div class="settings-item-content">
                                        <div class="settings-item-name">重置所有数据</div>
                                        <div class="settings-item-desc">清空所有数据，恢复初始状态</div>
                                    </div>
                                </div>
                                <button class="settings-btn danger" id="settings-reset-btn">重置</button>
                            </div>
                        </div>
                        <div class="settings-section">
                            <div class="settings-section-title">关于</div>
                            <div class="settings-about">
                                <div class="settings-about-icon">🏠</div>
                                <div class="settings-about-name">我的宝贝房子</div>
                                <div class="settings-about-version">版本 v${APP_VERSION}</div>
                                <div class="settings-about-desc">
                                    陪伴你走过装修的每一步
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function ensureModal() {
        if (modalElement) return;
        
        modalElement = document.createElement('div');
        modalElement.innerHTML = buildModalHTML();
        document.body.appendChild(modalElement.firstElementChild);
        modalElement = document.getElementById('settings-modal-overlay');
        
        bindEvents();
    }

    function bindEvents() {
        if (!modalElement) return;
        
        var closeBtn = modalElement.querySelector('#settings-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hide);
        }
        
        modalElement.addEventListener('click', function(e) {
            if (e.target === modalElement) {
                hide();
            }
        });
        
        var exportBtn = modalElement.querySelector('#settings-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportData);
        }
        
        var importBtn = modalElement.querySelector('#settings-import-btn');
        fileInput = modalElement.querySelector('#settings-file-input');
        
        if (importBtn && fileInput) {
            importBtn.addEventListener('click', function() {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', function(e) {
                if (e.target.files && e.target.files[0]) {
                    importData(e.target.files[0]);
                    fileInput.value = '';
                }
            });
        }
        
        var resetBtn = modalElement.querySelector('#settings-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetData);
        }

        var achievementsBtn = modalElement.querySelector('#settings-achievements-btn');
        if (achievementsBtn) {
            achievementsBtn.addEventListener('click', function() {
                if (typeof AchievementModal !== 'undefined' && AchievementModal.show) {
                    hide();
                    setTimeout(function() {
                        AchievementModal.show();
                    }, 200);
                }
            });
        }

        var zipBtn = modalElement.querySelector('#settings-zip-btn');
        if (zipBtn) {
            zipBtn.addEventListener('click', function() {
                if (typeof ZipPackager !== 'undefined' && ZipPackager.packageProject) {
                    ZipPackager.packageProject();
                } else {
                    Toast.error('打包功能未加载');
                }
            });
        }
    }

    function show() {
        ensureModal();
        if (!modalElement) return;
        
        modalElement.style.display = 'flex';
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                modalElement.classList.add('active');
            });
        });
    }

    function hide() {
        if (!modalElement) return;
        
        modalElement.classList.remove('active');
        setTimeout(function() {
            if (modalElement) {
                modalElement.style.display = 'none';
            }
        }, 200);
    }

    function init() {
        var settingsBtns = document.querySelectorAll('[data-action="settings"]');
        settingsBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                show();
            });

            btn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    show();
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        show: show,
        hide: hide,
        exportData: exportData,
        importData: importData,
        resetData: resetData
    };
})();
