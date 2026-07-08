/**
 * 主应用模块
 */

const app = {
    // 当前状态
    currentPage: 'home',
    analyzeMode: 'person', // 'person' | 'family'
    selectedTarget: null,
    inputMethod: 'text', // 'image' | 'voice' | 'text'
    analyzeResult: null,
    currentReadingButton: null, // 当前正在播放的按钮元素

    // 初始化
    init() {
        this.checkDisclaimer();
        this.bindEvents();
        this.initElderMode();
    },

    // 检查免责声明
    checkDisclaimer() {
        if (!Storage.isDisclaimerAccepted()) {
            document.getElementById('disclaimer-modal').classList.remove('hidden');
        }
    },

    // 关闭免责声明
    closeDisclaimer() {
        Storage.acceptDisclaimer();
        document.getElementById('disclaimer-modal').classList.add('hidden');
    },

    // 切换长辈模式
    toggleElderMode() {
        const enabled = !Storage.getElderMode();
        Storage.setElderMode(enabled);
        this.applyElderMode(enabled);
    },

    // 初始化长辈模式（从 localStorage 恢复）
    initElderMode() {
        this.applyElderMode(Storage.getElderMode());
    },

    // 应用长辈模式到 DOM
    applyElderMode(enabled) {
        document.body.classList.toggle('elder-mode', enabled);
        const btn = document.getElementById('elder-toggle');
        if (btn) btn.classList.toggle('active', enabled);
    },

    // 绑定事件
    bindEvents() {
        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', () => {
            this.renderPersonList();
            this.renderFamilyList();
        });
    },

    // 页面导航
    navigateTo(page) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        // 显示目标页面
        document.getElementById(page + '-page').classList.add('active');
        this.currentPage = page;

        // 页面特定初始化
        if (page === 'health-card') {
            this.renderPersonList();
            this.renderFamilyList();
        } else if (page === 'analyze') {
            this.renderAnalyzeTargets();
            this.refreshInputMethodState();
        } else if (page === 'result') {
            this.renderResult();
        }
    },

    // 渲染个人健康卡列表
    renderPersonList() {
        const container = document.getElementById('person-list');
        const persons = Storage.getPersons();

        if (persons.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👤</div>
                    <div class="empty-text">暂无个人健康卡</div>
                    <button type="button" class="btn-small" onclick="app.showPersonForm()">+ 去创建</button>
                </div>
            `;
            return;
        }

        container.innerHTML = persons.map(person => {
            const indicators = this.formatIndicators(person);

            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <div class="list-item-name">${person.name}</div>
                        <div class="list-item-meta">
                            ${person.age ? person.age + '岁' : ''}
                            ${indicators.length > 0 ? ' · ' + indicators.join('、') : ''}
                        </div>
                    </div>
                    <div class="list-item-actions">
                        <button type="button" onclick="app.editPerson('${person.id}')">编辑</button>
                        <button type="button" onclick="app.deletePerson('${person.id}')">删除</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 格式化人员指标摘要（高 / 偏高）
    formatIndicators(person) {
        const indicators = [];
        if (person.lipid === 'high') indicators.push('血脂高');
        else if (person.lipid === 'high-normal') indicators.push('血脂偏高');
        if (person.bloodPressure === 'high') indicators.push('血压高');
        else if (person.bloodPressure === 'high-normal') indicators.push('血压偏高');
        if (person.glucose === 'high') indicators.push('血糖高');
        else if (person.glucose === 'high-normal') indicators.push('血糖偏高');
        if (person.uricAcid === 'high') indicators.push('尿酸高');
        else if (person.uricAcid === 'high-normal') indicators.push('尿酸偏高');
        return indicators;
    },

    // 渲染家庭组列表
    renderFamilyList() {
        const container = document.getElementById('family-list');
        const families = Storage.getFamilies();

        if (families.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👨‍👩‍👧‍👦</div>
                    <div class="empty-text">暂无家庭组</div>
                    <button type="button" class="btn-small" onclick="app.showFamilyForm()">+ 去创建</button>
                </div>
            `;
            return;
        }

        container.innerHTML = families.map(family => {
            const members = Storage.getFamilyMembers(family.id);
            const meta = members.length === 0
                ? '该家庭暂无成员'
                : `${members.length}人 · ${members.map(m => m.name).join('、')}`;
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <div class="list-item-name">${family.name}</div>
                        <div class="list-item-meta">${meta}</div>
                    </div>
                    <div class="list-item-actions">
                        <button type="button" onclick="app.editFamily('${family.id}')">编辑</button>
                        <button type="button" onclick="app.deleteFamily('${family.id}')">删除</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 显示个人表单
    showPersonForm(personId = null) {
        const form = document.getElementById('person-form');
        const title = document.getElementById('person-form-title');

        if (personId) {
            const person = Storage.getPerson(personId);
            if (!person) return;

            title.textContent = '编辑个人健康卡';
            document.getElementById('person-id').value = person.id;
            document.getElementById('person-name').value = person.name;
            document.getElementById('person-age').value = person.age || '';
            document.getElementById('person-lipid').value = person.lipid || '';
            document.getElementById('person-blood-pressure').value = person.bloodPressure || '';
            document.getElementById('person-glucose').value = person.glucose || '';
            document.getElementById('person-uric-acid').value = person.uricAcid || '';
            document.getElementById('person-symptoms').value = person.symptoms || '';
        } else {
            title.textContent = '新建个人健康卡';
            form.reset();
            document.getElementById('person-id').value = '';
        }

        this.navigateTo('person-form');
    },

    // 保存个人
    savePerson(event) {
        event.preventDefault();

        const person = {
            id: document.getElementById('person-id').value || Date.now().toString(),
            name: document.getElementById('person-name').value,
            age: document.getElementById('person-age').value,
            lipid: document.getElementById('person-lipid').value,
            bloodPressure: document.getElementById('person-blood-pressure').value,
            glucose: document.getElementById('person-glucose').value,
            uricAcid: document.getElementById('person-uric-acid').value,
            symptoms: document.getElementById('person-symptoms').value
        };

        Storage.savePerson(person);
        this.navigateTo('health-card');
    },

    // 编辑个人
    editPerson(id) {
        this.showPersonForm(id);
    },

    // 删除个人
    deletePerson(id) {
        if (confirm('确定要删除这张健康卡吗？')) {
            Storage.deletePerson(id);
            this.renderPersonList();
            this.renderFamilyList();
        }
    },

    // 显示家庭组表单
    showFamilyForm(familyId = null) {
        const form = document.getElementById('family-form');
        const title = document.getElementById('family-form-title');
        const memberSelect = document.getElementById('family-member-select');

        // 渲染成员选择
        const persons = Storage.getPersons();
        if (persons.length === 0) {
            memberSelect.innerHTML = '<p style="color: var(--muted);">请先创建个人健康卡</p>';
        } else {
            memberSelect.innerHTML = persons.map(person => `
                <label class="member-option">
                    <input type="checkbox" value="${person.id}" data-family-member>
                    <span>${person.name}</span>
                </label>
            `).join('');
        }

        if (familyId) {
            const family = Storage.getFamily(familyId);
            if (!family) return;

            title.textContent = '编辑家庭组';
            document.getElementById('family-id').value = family.id;
            document.getElementById('family-name').value = family.name;

            // 勾选已选成员
            family.members.forEach(memberId => {
                const checkbox = memberSelect.querySelector(`input[value="${memberId}"]`);
                if (checkbox) checkbox.checked = true;
            });
        } else {
            title.textContent = '新建家庭组';
            form.reset();
            document.getElementById('family-id').value = '';
        }

        this.navigateTo('family-form');
    },

    // 保存家庭组
    saveFamily(event) {
        event.preventDefault();

        const memberCheckboxes = document.querySelectorAll('[data-family-member]:checked');
        const members = Array.from(memberCheckboxes).map(cb => cb.value);

        if (members.length === 0) {
            alert('请至少选择一个成员');
            return;
        }

        const family = {
            id: document.getElementById('family-id').value || Date.now().toString(),
            name: document.getElementById('family-name').value,
            members: members
        };

        Storage.saveFamily(family);
        this.navigateTo('health-card');
    },

    // 编辑家庭组
    editFamily(id) {
        this.showFamilyForm(id);
    },

    // 删除家庭组
    deleteFamily(id) {
        if (confirm('确定要删除这个家庭组吗？')) {
            Storage.deleteFamily(id);
            this.renderFamilyList();
        }
    },

    // 切换分析模式
    switchAnalyzeMode(mode) {
        this.analyzeMode = mode;
        this.selectedTarget = null;

        // 更新标签样式
        document.getElementById('tab-person').classList.toggle('active', mode === 'person');
        document.getElementById('tab-family').classList.toggle('active', mode === 'family');

        this.renderAnalyzeTargets();
    },

    // 渲染分析目标选择
    renderAnalyzeTargets() {
        const container = document.getElementById('analyze-target-select');

        if (this.analyzeMode === 'person') {
            const persons = Storage.getPersons();
            if (persons.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">👤</div>
                        <div class="empty-text">暂无个人健康卡</div>
                        <button type="button" class="btn-small" onclick="app.navigateTo('health-card')">去管理健康卡</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = persons.map(person => {
                const indicators = this.formatIndicators(person);
                const metaParts = [];
                if (person.age) metaParts.push(person.age + '岁');
                if (indicators.length > 0) metaParts.push(indicators.join('、'));
                return `
                <div class="target-option ${this.selectedTarget === person.id ? 'selected' : ''}" onclick="app.selectTarget('${person.id}')">
                    <div class="avatar">${person.name.charAt(0)}</div>
                    <div class="info">
                        <div class="name">${person.name}</div>
                        <div class="meta">${metaParts.join(' · ')}</div>
                    </div>
                </div>
                `;
            }).join('');
        } else {
            const families = Storage.getFamilies();
            if (families.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">👨‍👩‍👧‍👦</div>
                        <div class="empty-text">暂无家庭组</div>
                        <button type="button" class="btn-small" onclick="app.navigateTo('health-card')">去管理健康卡</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = families.map(family => {
                const members = Storage.getFamilyMembers(family.id);
                return `
                    <div class="target-option ${this.selectedTarget === family.id ? 'selected' : ''}" onclick="app.selectTarget('${family.id}')">
                        <div class="avatar">家</div>
                        <div class="info">
                            <div class="name">${family.name}</div>
                            <div class="meta">${members.map(m => m.name).join('、')}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    // 选择分析目标
    selectTarget(id) {
        this.selectedTarget = id;
        this.renderAnalyzeTargets();
    },

    // 选择输入方式
    selectInputMethod(method, el) {
        this.inputMethod = method;

        // 更新样式
        document.querySelectorAll('.input-method').forEach(node => node.classList.remove('active'));
        if (el) el.classList.add('active');

        // 显示对应输入区域
        document.getElementById('input-image').classList.add('hidden');
        document.getElementById('input-voice').classList.add('hidden');
        document.getElementById('input-text').classList.add('hidden');
        document.getElementById('input-' + method).classList.remove('hidden');

        // 清除其他输入区残留
        if (method !== 'image') {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = '';
            preview.classList.add('hidden');
        }
        if (method !== 'voice') {
            document.getElementById('voice-result').textContent = '';
        }
    },

    // 刷新输入方式选中态与对应输入区显示（用于返回分析页时恢复状态）
    refreshInputMethodState() {
        document.querySelectorAll('.input-method').forEach(node => node.classList.remove('active'));
        const methods = document.querySelectorAll('.input-method');
        methods.forEach(node => {
            const text = node.querySelector('span:last-child');
            const label = text ? text.textContent : '';
            let expected = '';
            if (this.inputMethod === 'image') expected = '图片上传';
            else if (this.inputMethod === 'voice') expected = '语音输入';
            else expected = '文字输入';
            if (label === expected) node.classList.add('active');
        });

        document.getElementById('input-image').classList.add('hidden');
        document.getElementById('input-voice').classList.add('hidden');
        document.getElementById('input-text').classList.add('hidden');
        const area = document.getElementById('input-' + this.inputMethod);
        if (area) area.classList.remove('hidden');
    },

    // 处理图片上传
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${e.target.result}" alt="上传的图片">`;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    },

    // 开始语音输入
    startVoiceInput() {
        const btn = document.getElementById('voice-btn');
        const text = document.getElementById('voice-text');
        const result = document.getElementById('voice-result');

        if (Voice.isRecording) {
            Voice.stopRecording();
            btn.classList.remove('recording');
            text.textContent = '按住说话';
        } else {
            result.textContent = '';
            btn.classList.add('recording');
            text.textContent = '正在录音...';

            Voice.startRecording(
                (data) => {
                    if (data.isFinal) {
                        result.textContent = data.final;
                        Voice.stopRecording();
                        btn.classList.remove('recording');
                        text.textContent = '按住说话';
                    } else {
                        result.textContent = data.interim;
                    }
                },
                (error) => {
                    alert('语音识别失败：' + error);
                    btn.classList.remove('recording');
                    text.textContent = '按住说话';
                }
            );
        }
    },

    // 开始分析
    async startAnalyze() {
        if (!this.selectedTarget) {
            alert('请选择分析对象');
            return;
        }

        let foodInput;
        if (this.inputMethod === 'image') {
            const preview = document.getElementById('image-preview');
            const img = preview.querySelector('img');
            if (!img) {
                alert('请上传图片');
                return;
            }
            const base64 = img.src;
            try {
                this.showLoading();
                const result = await LLMClient.recognizeFood(base64);
                this.hideLoading();
                foodInput = result.foods.join('、');
            } catch (err) {
                this.hideLoading();
                alert('图片识别失败，请改用文字输入');
                return;
            }
        } else if (this.inputMethod === 'voice') {
            const result = document.getElementById('voice-result').textContent;
            if (!result) {
                alert('请先语音输入');
                return;
            }
            foodInput = result;
        } else {
            const text = document.getElementById('food-text').value;
            if (!text.trim()) {
                alert('请输入食物名称');
                return;
            }
            foodInput = text;
        }

        // 获取分析目标
        let targets;
        if (this.analyzeMode === 'person') {
            const person = Storage.getPerson(this.selectedTarget);
            targets = [person];
        } else {
            targets = Storage.getFamilyMembers(this.selectedTarget);
        }

        // 显示加载
        this.showLoading();

        try {
            // 调用 LLM 分析
            this.analyzeResult = await LLMClient.analyzeFood(foodInput, targets);
            this.hideLoading();
            this.navigateTo('result');
        } catch (error) {
            this.hideLoading();
            alert('分析失败：' + error.message);
        }
    },

    // 显示加载
    showLoading() {
        const loading = document.createElement('div');
        loading.id = 'loading-overlay';
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-card">
                <div class="loading-icon">🍽️</div>
                <div class="loading-text">正在为家人分析…</div>
            </div>
        `;
        document.body.appendChild(loading);
    },

    // 隐藏加载
    hideLoading() {
        const loading = document.getElementById('loading-overlay');
        if (loading) loading.remove();
    },

    // 渲染分析结果
    renderResult() {
        if (!this.analyzeResult) return;

        // 渲染目标信息
        const targetInfo = document.getElementById('result-target-info');
        if (this.analyzeMode === 'person') {
            const person = Storage.getPerson(this.selectedTarget);
            targetInfo.innerHTML = `分析对象：<strong>${person.name}</strong>`;
        } else {
            const family = Storage.getFamily(this.selectedTarget);
            targetInfo.innerHTML = `分析家庭：<strong>${family.name}</strong>`;
        }

        // 渲染食物卡片
        const cardsContainer = document.getElementById('result-cards');
        cardsContainer.innerHTML = this.analyzeResult.map((item, index) => {
            const topRisk = this.getTopRiskLevel(item.results);
            const personResults = item.results.map(r => `
                <div class="person-result risk-${r.riskLevel}">
                    <div class="person-avatar">${r.personName.charAt(0)}</div>
                    <div class="person-info">
                        <div class="person-name">${r.personName}</div>
                        <span class="risk-badge ${r.riskLevel}">${this.getRiskIcon(r.riskLevel)} ${r.riskLabel}</span>
                        <div class="impact">${r.impact}</div>
                        <div class="suggestion">${r.suggestion}</div>
                    </div>
                </div>
            `).join('');

            const readings = item.results.map(r => r.reading).join('');

            return `
                <div class="food-card risk-${topRisk}">
                    <div class="food-card-header">
                        <span class="food-icon">${item.icon}</span>
                        <span class="food-name">${item.food}</span>
                    </div>
                    ${personResults}
                    <div class="reading-section">
                        <div class="reading-text">${readings}</div>
                        <button type="button" onclick="app.playReading(${index})" class="reading-btn" data-idx="${index}">
                            ▶️ 朗读
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // 渲染汇总
        this.renderSummary();
    },

    // 风险等级图标
    getRiskIcon(level) {
        const icons = { avoid: '🔴', caution: '🟡', safe: '🟢', recommend: '🔵' };
        return icons[level] || '';
    },

    // 取一组结果中的最高风险等级（avoid > caution > safe > recommend）
    getTopRiskLevel(results) {
        const priority = { avoid: 4, caution: 3, safe: 2, recommend: 1 };
        let top = 'safe';
        let topP = 0;
        (results || []).forEach(r => {
            const p = priority[r.riskLevel] || 0;
            if (p > topP) {
                topP = p;
                top = r.riskLevel;
            }
        });
        return top;
    },

    // 渲染汇总
    renderSummary() {
        const summary = document.getElementById('result-summary');
        const levels = {
            avoid: { label: '尽量避免食用', icon: '🔴', foods: [] },
            caution: { label: '谨慎食用', icon: '🟡', foods: [] },
            safe: { label: '可以食用', icon: '🟢', foods: [] },
            recommend: { label: '推荐食用', icon: '🔵', foods: [] }
        };

        this.analyzeResult.forEach(item => {
            item.results.forEach(r => {
                if (!levels[r.riskLevel].foods.includes(item.food)) {
                    levels[r.riskLevel].foods.push(item.food);
                }
            });
        });

        summary.innerHTML = `
            <h3>📊 结果汇总</h3>
            ${Object.entries(levels).map(([key, value]) => value.foods.length > 0 ? `
                <div class="summary-section risk-${key}">
                    <div class="summary-title">${value.icon} ${value.label}</div>
                    <div class="summary-items">
                        ${value.foods.map(food => `<span class="summary-item">${food}</span>`).join('')}
                    </div>
                </div>
            ` : '').join('')}
        `;
    },

    // 播放单个朗读
    playReading(idx) {
        if (!this.analyzeResult) return;
        const item = this.analyzeResult[idx];
        if (!item) return;

        const btn = document.querySelector(`button.reading-btn[data-idx="${idx}"]`);

        // 正在播放且点击的是同一按钮：停止并恢复
        if (this.currentReadingButton && this.currentReadingButton === btn) {
            Voice.stopSpeaking();
            this.restoreReadingButton(btn);
            this.currentReadingButton = null;
            return;
        }

        // 切换前先停止旧播放并恢复旧按钮
        if (this.currentReadingButton) {
            Voice.stopSpeaking();
            this.restoreReadingButton(this.currentReadingButton);
        }

        const text = item.results.map(r => r.reading).join('');
        Voice.speak(text, {
            onStart: () => {
                if (btn) {
                    btn.textContent = '⏹️ 停止';
                    this.currentReadingButton = btn;
                }
            },
            onEnd: () => {
                if (btn) this.restoreReadingButton(btn);
                if (this.currentReadingButton === btn) this.currentReadingButton = null;
            }
        });
    },

    // 恢复朗读按钮文案
    restoreReadingButton(btn) {
        if (!btn) return;
        if (btn.id === 'play-all-btn') {
            btn.textContent = '🎙️ 播放全部朗读';
        } else {
            btn.textContent = '▶️ 朗读';
        }
    },

    // 播放全部朗读
    playAllReadings() {
        if (!this.analyzeResult) return;

        const btn = document.getElementById('play-all-btn');

        // 正在播放且点击的是同一按钮：停止并恢复
        if (this.currentReadingButton && this.currentReadingButton === btn) {
            Voice.stopSpeaking();
            this.restoreReadingButton(btn);
            this.currentReadingButton = null;
            return;
        }

        // 切换前先停止旧播放并恢复旧按钮
        if (this.currentReadingButton) {
            Voice.stopSpeaking();
            this.restoreReadingButton(this.currentReadingButton);
        }

        const text = this.analyzeResult.map(item =>
            item.results.map(r => r.reading).join('')
        ).join('');

        Voice.speak(text, {
            onStart: () => {
                if (btn) {
                    btn.textContent = '⏹️ 停止朗读';
                    this.currentReadingButton = btn;
                }
            },
            onEnd: () => {
                if (btn) this.restoreReadingButton(btn);
                if (this.currentReadingButton === btn) this.currentReadingButton = null;
            }
        });
    }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
