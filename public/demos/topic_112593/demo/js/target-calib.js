/* ==================== 靶纸校准模块（预留接口） ==================== */
const TargetCalib = {
    STORAGE_KEY: 'mingchen_target_calibs',
    currentCalib: null,
    savedCalibs: [],

    // 初始化
    init() {
        this.loadSaved();
        this.updateUI();
    },

    // 加载已保存的校准参数
    loadSaved() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            this.savedCalibs = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.savedCalibs = [];
        }
    },

    // 保存校准参数
    saveCalib(calib) {
        calib.id = Date.now();
        calib.name = '校准 ' + new Date().toLocaleString('zh-CN');
        this.savedCalibs.unshift(calib);
        // 最多保存 10 条
        if (this.savedCalibs.length > 10) {
            this.savedCalibs = this.savedCalibs.slice(0, 10);
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.savedCalibs));
        this.updateUI();
    },

    // 删除校准参数
    deleteCalib(id) {
        this.savedCalibs = this.savedCalibs.filter(c => c.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.savedCalibs));
        this.updateUI();
    },

    // 应用校准参数
    applyCalib(calib) {
        this.currentCalib = calib;
        console.log('[靶纸校准] 应用校准参数:', calib);
        this.updateStatusLabel();
    },

    // 执行校准（预留接口）
    async calibrate() {
        console.log('[靶纸校准] 开始 AR 平面检测...');

        // TODO: 接入实际的 AR 平面检测（WebXR / camera 图像处理）
        // 模拟校准过程
        await new Promise(r => setTimeout(r, 2000));

        // 模拟校准结果
        const quality = Math.random();
        let grade, gradeClass, hint;

        if (quality > 0.8) {
            grade = '优秀';
            gradeClass = 'quality-excellent';
            hint = '校准质量优秀，可以开始训练';
        } else if (quality > 0.6) {
            grade = '良好';
            gradeClass = 'quality-good';
            hint = '校准质量良好，可以开始训练';
        } else if (quality > 0.4) {
            grade = '一般';
            gradeClass = 'quality-fair';
            hint = '校准质量一般，建议重新校准';
        } else {
            grade = '较差';
            gradeClass = 'quality-poor';
            hint = '校准质量较差，建议重新校准';
        }

        const result = {
            offsetX: Math.round((Math.random() - 0.5) * 40),
            offsetY: Math.round((Math.random() - 0.5) * 40),
            scale: (0.9 + Math.random() * 0.2).toFixed(2),
            angle: Math.round((Math.random() - 0.5) * 10),
            quality: grade,
            qualityClass: gradeClass,
            hint: hint
        };

        this.currentCalib = result;
        console.log('[靶纸校准] 校准完成:', result);
        return result;
    },

    // 更新 UI
    updateUI() {
        const elList = document.getElementById('calib-saved-list');
        const elSaved = document.getElementById('calib-saved');

        if (this.savedCalibs.length > 0 && elList) {
            elList.innerHTML = this.savedCalibs.map(c => `
                <div class="calib-saved-item" data-id="${c.id}">
                    <div>
                        <div class="calib-saved-name">${c.name}</div>
                        <div class="calib-saved-meta">质量: ${c.quality} | 缩放: ${c.scale}</div>
                    </div>
                    <span class="about-arrow">&rsaquo;</span>
                </div>
            `).join('');

            // 绑定点击事件
            elList.querySelectorAll('.calib-saved-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = parseInt(item.dataset.id);
                    const calib = this.savedCalibs.find(c => c.id === id);
                    if (calib) this.applyCalib(calib);
                });
            });

            if (elSaved) elSaved.style.display = 'block';
        } else if (elSaved) {
            elSaved.style.display = 'none';
        }

        this.updateStatusLabel();
    },

    // 更新设置面板中的校准状态
    updateStatusLabel() {
        const label = document.getElementById('calib-status-label');
        if (!label) return;
        if (this.currentCalib) {
            label.textContent = '校准状态: ' + this.currentCalib.quality + ' (' + this.currentCalib.qualityClass.replace('quality-', '') + ')';
        } else if (this.savedCalibs.length > 0) {
            label.textContent = '校准状态: 已保存 ' + this.savedCalibs.length + ' 组参数';
        } else {
            label.textContent = '校准状态: 未校准';
        }
    }
};
