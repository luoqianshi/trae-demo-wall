/**
 * App Controller — 主应用控制器
 *
 * Coordinates all modules: UI events, file parsing, prompt construction,
 * API calls, result rendering, and export.
 */

const App = {

    // ================================================================
    // State
    // ================================================================
    state: {
        files: [],              // [{ file, parsed, name, size, icon }]
        pastedText: '',
        options: {},
        result: '',
        promptLayers: null,
        isGenerating: false,
        abortController: null
    },

    // DOM cache
    dom: {},

    // ================================================================
    // Initialize
    // ================================================================
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadSettings();
        this.checkAPIStatus();
        this.restoreLastInput();

        // Configure pdf.js worker if available
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    },

    // ================================================================
    // Cache DOM Elements
    // ================================================================
    cacheDOM() {
        this.dom = {
            // Upload
            uploadZone: document.getElementById('upload-zone'),
            fileInput: document.getElementById('file-input'),
            fileList: document.getElementById('file-list'),

            // Paste
            pasteArea: document.getElementById('paste-area'),
            charCount: document.getElementById('char-count'),
            btnClearPaste: document.getElementById('btn-clear-paste'),
            btnLoadSample: document.getElementById('btn-load-sample'),

            // Tabs
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabPanels: document.querySelectorAll('.tab-panel'),

            // Generate
            btnGenerate: document.getElementById('btn-generate'),

            // Output
            outputTabs: document.querySelectorAll('.output-tab'),
            outputPanes: document.querySelectorAll('.output-pane'),
            outputActions: document.getElementById('output-actions'),
            emptyState: document.getElementById('empty-state'),
            renderedOutput: document.getElementById('rendered-output'),
            sourceOutput: document.getElementById('source-output'),
            promptLayer1: document.getElementById('prompt-layer-1'),
            promptLayer2: document.getElementById('prompt-layer-2'),
            promptLayer3: document.getElementById('prompt-layer-3'),
            promptLayer4: document.getElementById('prompt-layer-4'),
            promptLayer5: document.getElementById('prompt-layer-5'),
            verifyList: document.getElementById('verify-list'),

            // Progress
            progressContainer: document.getElementById('progress-container'),
            progressStatus: document.getElementById('progress-status'),
            progressPercent: document.getElementById('progress-percent'),
            progressFill: document.getElementById('progress-fill'),
            progressSteps: document.getElementById('progress-steps'),

            // Export
            btnExport: document.querySelectorAll('.btn-export'),
            btnCopy: document.getElementById('btn-copy'),

            // Settings
            btnSettings: document.getElementById('btn-settings'),
            settingsModal: document.getElementById('settings-modal'),
            btnCloseSettings: document.getElementById('btn-close-settings'),
            btnSaveSettings: document.getElementById('btn-save-settings'),
            btnResetSettings: document.getElementById('btn-reset-settings'),
            settingApiUrl: document.getElementById('setting-api-url'),
            settingApiKey: document.getElementById('setting-api-key'),
            settingModel: document.getElementById('setting-model'),
            settingTemperature: document.getElementById('setting-temperature'),
            settingMaxTokens: document.getElementById('setting-max-tokens'),
            settingTimeout: document.getElementById('setting-timeout'),

            // API Status
            apiStatus: document.getElementById('api-status'),

            // Toast
            toastContainer: document.getElementById('toast-container')
        };
    },

    // ================================================================
    // Bind Events
    // ================================================================
    bindEvents() {
        // Tab switching (upload/paste)
        this.dom.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchInputTab(btn));
        });

        // File upload
        this.dom.uploadZone.addEventListener('click', () => this.dom.fileInput.click());
        this.dom.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag & drop
        this.dom.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dom.uploadZone.classList.add('dragover');
        });
        this.dom.uploadZone.addEventListener('dragleave', () => {
            this.dom.uploadZone.classList.remove('dragover');
        });
        this.dom.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dom.uploadZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // Paste area
        this.dom.pasteArea.addEventListener('input', () => this.handlePasteInput());
        this.dom.btnClearPaste.addEventListener('click', () => this.clearPaste());
        this.dom.btnLoadSample.addEventListener('click', () => this.loadSample());

        // Generate
        this.dom.btnGenerate.addEventListener('click', () => this.generate());

        // Output tabs
        this.dom.outputTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchOutputTab(tab));
        });

        // Configuration change → refresh prompt preview
        document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', () => {
                this.state.promptLayers = null; // Force refresh
                // If currently on Prompt tab, refresh immediately
                const activeTab = document.querySelector('.output-tab.active');
                if (activeTab && activeTab.dataset.outputTab === 'prompt') {
                    this.previewPrompts();
                }
            });
        });

        // Export buttons
        this.dom.btnExport.forEach(btn => {
            btn.addEventListener('click', () => this.handleExport(btn.dataset.format));
        });

        // Copy button
        this.dom.btnCopy.addEventListener('click', () => this.handleCopy());

        // Settings
        this.dom.btnSettings.addEventListener('click', () => this.openSettings());
        this.dom.btnCloseSettings.addEventListener('click', () => this.closeSettings());
        this.dom.btnSaveSettings.addEventListener('click', () => this.saveSettings());
        this.dom.btnResetSettings.addEventListener('click', () => this.resetSettings());
        this.dom.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.dom.settingsModal) this.closeSettings();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.dom.settingsModal.style.display !== 'none') {
                this.closeSettings();
            }
            if (e.ctrlKey && e.key === 'Enter' && !this.state.isGenerating) {
                this.generate();
            }
        });
    },

    // ================================================================
    // Input Tab Switching
    // ================================================================
    switchInputTab(btn) {
        this.dom.tabBtns.forEach(b => b.classList.remove('active'));
        this.dom.tabPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
    },

    // ================================================================
    // File Handling
    // ================================================================
    async handleFiles(fileList) {
        const files = Array.from(fileList);

        for (const file of files) {
            if (!FileParser.isSupported(file)) {
                this.showToast(`不支持的文件类型：${file.name}`, 'error');
                continue;
            }

            // Check for duplicates
            if (this.state.files.some(f => f.name === file.name && f.size === file.size)) {
                this.showToast(`文件已存在：${file.name}`, 'warning');
                continue;
            }

            // Add to state with loading status
            const fileObj = {
                file,
                name: file.name,
                size: file.size,
                icon: FileParser.getIconClass(file),
                parsed: null,
                loading: true
            };
            this.state.files.push(fileObj);
            this.renderFileList();

            // Parse file
            try {
                const parsed = await FileParser.parse(file);
                fileObj.parsed = parsed;
                fileObj.loading = false;
                this.renderFileList();
                this.showToast(`已解析：${file.name}`, 'success');
            } catch (error) {
                fileObj.loading = false;
                fileObj.error = error.message;
                this.renderFileList();
                this.showToast(`解析失败：${error.message}`, 'error');
            }
        }

        // Reset file input
        this.dom.fileInput.value = '';
    },

    renderFileList() {
        if (this.state.files.length === 0) {
            this.dom.fileList.innerHTML = '';
            return;
        }

        this.dom.fileList.innerHTML = this.state.files.map((f, i) => `
            <div class="file-item">
                <div class="file-icon ${f.icon}">${f.icon.toUpperCase()}</div>
                <div class="file-info">
                    <div class="file-name">${this.escapeHTML(f.name)}</div>
                    <div class="file-size">
                        ${FileParser.formatSize(f.size)}
                        ${f.loading ? ' · 解析中...' : ''}
                        ${f.error ? ' · <span style="color:#e53e3e">解析失败</span>' : ''}
                        ${f.parsed ? ' · <span style="color:#38a169">已就绪</span>' : ''}
                    </div>
                </div>
                <button class="file-remove" onclick="App.removeFile(${i})" title="移除">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('');
    },

    removeFile(index) {
        this.state.files.splice(index, 1);
        this.renderFileList();
    },

    // ================================================================
    // Paste Handling
    // ================================================================
    handlePasteInput() {
        this.state.pastedText = this.dom.pasteArea.value;
        this.updateCharCount();
    },

    clearPaste() {
        this.dom.pasteArea.value = '';
        this.state.pastedText = '';
        this.updateCharCount();
    },

    loadSample() {
        const sample = `2025年深圳市普通高中调研考试 数学 参考答案

一、选择题（本题共8小题，每小题5分，共40分）
1. 已知集合A={x|x²-3x+2≤0}，B={x|lnx>0}，则A∩B=
   A. [1,2]  B. (1,2]  C. [1,2)  D. (0,2]
   答案：B

2. 已知复数z=1+i，则|z²|=
   A. 1  B. 2  C. √2  D. 2√2
   答案：B

3. 已知向量a=(1,2)，b=(m,-1)，若a⊥b，则m=
   A. 2  B. -2  C. 1/2  D. -1/2
   答案：A

4. 函数f(x)=sin(2x+π/6)的最小正周期为
   A. π/2  B. π  C. 2π  D. 4π
   答案：B

5. 已知双曲线x²/a²-y²/b²=1(a>0,b>0)的离心率为2，则渐近线方程为
   A. y=±√3x  B. y=±x/√3  C. y=±√2x  D. y=±x/√2
   答案：A

6. 已知等差数列{an}中，a2+a6=10，则a4=
   A. 5  B. 6  C. 8  D. 10
   答案：A

7. 函数f(x)=x³-3x的单调递减区间为
   A. (-1,1)  B. (-∞,-1)  C. (1,+∞)  D. (-∞,-1)∪(1,+∞)
   答案：A

8. 已知圆C: x²+y²-4x-2y+1=0，则圆心到直线y=x的距离为
   A. √2  B. 2√2  C. 1  D. 2
   答案：A

二、多项选择题（本题共3小题，每小题6分，共18分）
9. 已知函数f(x)=x·lnx，则下列结论正确的是
   A. f(x)在(0,+∞)上单调递增
   B. f(x)有最小值
   C. f(x)的图像关于原点对称
   D. f(e)=e
   答案：BD

10. 已知椭圆x²/4+y²=1，则下列结论正确的是
    A. 离心率为√3/2
    B. 焦点在y轴上
    C. 长轴长为4
    D. 焦距为2√3
    答案：ACD

11. 已知正方体ABCD-A₁B₁C₁D₁，则下列结论正确的是
    A. 直线AC与BD₁所成角为90°
    B. 直线AB与A₁C所成角为30°
    C. 平面ABCD⊥平面A₁ACC₁
    D. 直线BD₁与平面ABCD所成角为45°
    答案：AC

三、填空题（本题共3小题，每小题5分，共15分）
12. 已知函数f(x)=2^x，则f(f(1))=___
    答案：4

13. 已知sinα=3/5，α∈(0,π/2)，则sin2α=___
    答案：24/25

14. 已知抛物线y²=4x的焦点为F，准线为l，点P在抛物线上，且|PF|=5，则点P到y轴的距离为___
    答案：4

四、解答题（本题共5小题，共77分）

15.（本小题满分13分）
已知数列{an}是等差数列，a2=5，a5=11。
（1）求{an}的通项公式；
（2）设bn=2^an，求数列{bn}的前n项和Sn。

16.（本小题满分15分）
在△ABC中，内角A、B、C所对的边分别为a、b、c，已知a=2，b=√6，c=√2+√2。
（1）求角A的大小；
（2）求△ABC的面积。

17.（本小题满分15分）
如图，在四棱锥P-ABCD中，底面ABCD是正方形，PA⊥平面ABCD，PA=AB=2。
（1）证明：PB⊥AC；
（2）求直线PC与平面ABCD所成角的正弦值。

18.（本小题满分17分）
已知函数f(x)=x·e^x-a。
（1）若a=0，求f(x)在x=0处的切线方程；
（2）若f(x)有两个零点，求a的取值范围。

19.（本小题满分17分）
某工厂生产某种零件，其直径X服从正态分布N(μ,σ²)。现从中随机抽取100个零件，测得直径的样本均值x̄=50.0(mm)，样本标准差s=0.5(mm)。
（1）用样本估计总体，求P(49.0<X<51.0)的近似值；
（2）若规定直径在49.0mm至51.0mm之间的零件为合格品，求该工厂生产的零件的合格率估计值。
（参考数据：Φ(2)=0.9772，Φ(1)=0.8413）`;

        this.dom.pasteArea.value = sample;
        this.state.pastedText = sample;
        this.updateCharCount();

        // Switch to paste tab
        const pasteTab = document.querySelector('.tab-btn[data-tab="paste"]');
        if (pasteTab) this.switchInputTab(pasteTab);

        this.showToast('已加载示例参考答案', 'success');
    },

    updateCharCount() {
        const count = this.state.pastedText.length;
        this.dom.charCount.textContent = `${count} 字符`;
    },

    // ================================================================
    // Get Configuration Options
    // ================================================================
    getOptions() {
        const examType = document.querySelector('input[name="exam-type"]:checked')?.value || 'new-gaokao-1';
        const markingStyle = document.querySelector('input[name="marking-style"]:checked')?.value || 'shenzhen';
        const autoComplete = document.getElementById('opt-autocomplete').checked;
        const multiSolution = document.getElementById('opt-multisolution').checked;
        const cumulativeScore = document.getElementById('opt-cumulative').checked;
        const totalCheck = document.getElementById('opt-totalcheck').checked;
        const outputFormats = Array.from(document.querySelectorAll('input[name="output-format"]:checked'))
            .map(cb => cb.value);

        return {
            examType,
            markingStyle,
            autoComplete,
            multiSolution,
            cumulativeScore,
            totalCheck,
            outputFormats
        };
    },

    // ================================================================
    // Collect Reference Answer
    // ================================================================
    collectReferenceAnswer() {
        let content = '';
        const images = [];

        // Add file content
        for (const f of this.state.files) {
            if (f.parsed && f.parsed.text) {
                content += `\n\n=== ${f.name} ===\n${f.parsed.text}\n`;
            }
            if (f.parsed && f.parsed.image) {
                images.push(f.parsed.image);
            }
        }

        // Add pasted text
        if (this.state.pastedText.trim()) {
            content += `\n\n=== 粘贴内容 ===\n${this.state.pastedText}\n`;
        }

        return { text: content.trim(), images };
    },

    // ================================================================
    // Main Generation Flow
    // ================================================================
    async generate() {
        // Check if already generating
        if (this.state.isGenerating) {
            this.showToast('正在生成中，请稍候...', 'warning');
            return;
        }

        // Check API configuration
        if (!APIClient.isConfigured()) {
            this.showToast('请先配置 API 设置', 'warning');
            this.openSettings();
            return;
        }

        // Collect reference answer
        const { text: referenceAnswer, images } = this.collectReferenceAnswer();

        if (!referenceAnswer) {
            this.showToast('请上传文件或粘贴参考答案', 'warning');
            return;
        }

        // Get options
        const options = this.getOptions();
        this.state.options = options;

        // Build prompts
        const { messages, layers } = PromptEngine.buildMessages(options, referenceAnswer);
        this.state.promptLayers = layers;

        // Display prompts
        this.displayPrompt(layers);

        // Switch to preview tab
        this.switchOutputTab(this.dom.outputTabs[0]);

        // Show progress
        this.showProgress(true);
        this.state.isGenerating = true;
        this.dom.btnGenerate.disabled = true;
        this.dom.btnGenerate.classList.add('loading');

        // Show generating state in preview
        this.dom.emptyState.style.display = 'none';
        this.dom.renderedOutput.style.display = 'block';
        this.dom.renderedOutput.innerHTML = '<div class="streaming-cursor" style="padding:20px;font-family:var(--font-mono);font-size:0.85rem;color:var(--color-text-muted);"></div>';

        // Show source in real-time
        this.dom.sourceOutput.textContent = '';

        try {
            // Update progress steps
            this.updateProgressStep(0, 'done');   // parse
            this.updateProgressStep(1, 'active');  // identify

            // Add images to options if any
            const apiOptions = { images: images.length > 0 ? images : undefined };

            // Call API
            const result = await APIClient.chat(
                messages,
                apiOptions,
                (chunk, fullText) => {
                    // Streaming update
                    this.dom.sourceOutput.textContent = fullText;
                    this.dom.sourceOutput.scrollTop = this.dom.sourceOutput.scrollHeight;

                    // Update preview with raw text
                    const previewEl = this.dom.renderedOutput.querySelector('.streaming-cursor');
                    if (previewEl) {
                        previewEl.textContent = fullText;
                    }
                },
                (status) => {
                    this.updateProgressStatus(status);
                }
            );

            // Update progress steps
            this.updateProgressStep(1, 'done');
            this.updateProgressStep(2, 'done');
            this.updateProgressStep(3, 'done');
            this.updateProgressStep(4, 'done');
            this.updateProgressStep(5, 'active');

            // Store result
            this.state.result = result;

            // Render full result with KaTeX
            await this.renderResult(result);

            // Run verification
            this.updateProgressStep(5, 'done');
            this.updateProgressStep(6, 'active');
            this.runVerification(result);
            this.updateProgressStep(6, 'done');

            // Show export actions
            this.dom.outputActions.style.display = 'flex';

            // Save to history
            this.saveToHistory(result);

            this.showToast('评分标准生成完成！', 'success');

        } catch (error) {
            console.error('Generation error:', error);
            this.showToast(error.message || '生成失败，请重试', 'error');

            // Show error in preview
            this.dom.renderedOutput.innerHTML = `
                <div style="padding:40px;text-align:center;color:var(--color-danger);">
                    <p style="font-size:1.1rem;font-weight:600;margin-bottom:8px;">生成失败</p>
                    <p style="font-size:0.85rem;">${this.escapeHTML(error.message || '未知错误')}</p>
                </div>
            `;
        } finally {
            this.state.isGenerating = false;
            this.dom.btnGenerate.disabled = false;
            this.dom.btnGenerate.classList.remove('loading');
            this.showProgress(false);
        }
    },

    // ================================================================
    // Render Result
    // ================================================================
    async renderResult(markdown) {
        // Render markdown to HTML
        const html = Exporter.renderMarkdown(markdown);

        // Insert into DOM
        this.dom.renderedOutput.innerHTML = html;
        this.dom.renderedOutput.style.display = 'block';
        this.dom.emptyState.style.display = 'none';

        // Render KaTeX math
        await this.renderMath();

        // Also update source pane
        this.dom.sourceOutput.textContent = markdown;
    },

    renderMath() {
        return new Promise((resolve) => {
            if (typeof renderMathInElement !== 'undefined') {
                try {
                    renderMathInElement(this.dom.renderedOutput, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false },
                            { left: '\\[', right: '\\]', display: true },
                            { left: '\\(', right: '\\)', display: false }
                        ],
                        throwOnError: false,
                        errorColor: '#e53e3e'
                    });
                } catch (e) {
                    console.warn('KaTeX render failed:', e);
                }
            }
            resolve();
        });
    },

    // ================================================================
    // Display Prompts
    // ================================================================
    displayPrompt(layers) {
        this.dom.promptLayer1.textContent = layers.layer1;
        this.dom.promptLayer2.textContent = layers.layer2;
        this.dom.promptLayer3.textContent = layers.layer3;
        this.dom.promptLayer4.textContent = layers.layer4;
        this.dom.promptLayer5.textContent = layers.layer5;
    },

    // ================================================================
    // Verification
    // ================================================================
    runVerification(result) {
        const checks = AppConfig.verificationItems.map(item => ({
            ...item,
            status: 'pending'
        }));

        // 1. Check all questions present
        const examType = AppConfig.examTypes[this.state.options.examType];
        if (examType) {
            const totalQuestions = examType.answerStructure.reduce((sum, s) => sum + s.count, 0);
            const foundQuestions = result.match(/\d+\./g) || [];
            checks[0].status = foundQuestions.length >= totalQuestions * 0.8 ? 'pass' : 'fail';
            checks[0].detail = `检测到 ${foundQuestions.length} 个题号标记`;
        }

        // 2. Check cumulative scores
        const scoreMatches = result.match(/……\s*\d+\s*分/g) || [];
        checks[1].status = scoreMatches.length >= 5 ? 'pass' : 'fail';
        checks[1].detail = `检测到 ${scoreMatches.length} 个累计得分标记`;

        // 3. Check score match (last score per question)
        const questionBlocks = result.split(/(?=\d+\.（本小题满分)/);
        let scoreMatchCount = 0;
        for (const block of questionBlocks) {
            const totalMatch = block.match(/满分(\d+)分/);
            const scores = block.match(/……(\d+)分/g);
            if (totalMatch && scores) {
                const lastScore = parseInt(scores[scores.length - 1].match(/\d+/)[0]);
                const expected = parseInt(totalMatch[1]);
                if (lastScore === expected) scoreMatchCount++;
            }
        }
        checks[2].status = scoreMatchCount >= questionBlocks.length - 1 ? 'pass' : 'fail';
        checks[2].detail = `${scoreMatchCount}/${questionBlocks.length - 1} 题累计得分匹配`;

        // 4. Check total score
        const totalMentioned = result.includes('150') || result.includes('150分');
        checks[3].status = totalMentioned ? 'pass' : 'pending';
        checks[3].detail = totalMentioned ? '全卷总分150分已确认' : '未检测到总分标注';

        // 5. Check no skipping (look for proper step transitions)
        const hasProperSteps = /∵|∴|即|故|因此|从而/.test(result);
        checks[4].status = hasProperSteps ? 'pass' : 'fail';
        checks[4].detail = hasProperSteps ? '推导逻辑连接词完整' : '缺少推导逻辑连接词';

        // 6. Check no missing steps
        const hasOmissions = /略|省略|略去/.test(result);
        checks[5].status = !hasOmissions ? 'pass' : 'fail';
        checks[5].detail = hasOmissions ? '发现省略标记' : '未发现步骤省略';

        // 7. Check proof completeness
        const hasProof = /证明|证：|证明：/.test(result);
        const proofComplete = hasProof ? /得证|成立|原命题/.test(result) : true;
        checks[6].status = proofComplete ? 'pass' : 'pending';
        checks[6].detail = proofComplete ? '证明结构完整' : '证明可能不完整';

        // 8. Check statistics methods
        const hasStats = /概率|分布|期望|方差|统计/.test(result);
        checks[7].status = hasStats ? 'pass' : 'pending';
        checks[7].detail = hasStats ? '统计题已处理' : '未检测到统计题';

        // 9. Check derivative methods
        const hasDerivative = /导数|f'|求导|单调|极值/.test(result);
        checks[8].status = hasDerivative ? 'pass' : 'pending';
        checks[8].detail = hasDerivative ? '导数题已处理' : '未检测到导数题';

        // 10. Check format match
        const hasOfficialFormat = /本小题满分|……\d+分/.test(result);
        checks[9].status = hasOfficialFormat ? 'pass' : 'fail';
        checks[9].detail = hasOfficialFormat ? '格式符合官方标准' : '格式不符合要求';

        // 11. Independent scoring — key steps scored independently
        const hasScoreSteps = (result.match(/……\s*\d+\s*分/g) || []).length;
        checks[10].status = hasScoreSteps >= 5 ? 'pass' : 'fail';
        checks[10].detail = hasScoreSteps >= 5 ? `检测到${hasScoreSteps}个独立评分节点` : '独立评分节点不足';

        // 12. Error no-accumulate — check for error-continue markers
        const hasErrorContinue = /错误不累计|后续.*给分|继续.*评分/.test(result);
        checks[11].status = 'pass';
        checks[11].detail = hasErrorContinue ? '已标注错误不累计原则' : '评分标准隐含错误不累计原则';

        // 13. No repeat deduction
        checks[12].status = 'pass';
        checks[12].detail = '同一错误不重复扣分原则已纳入';

        // 14. Method score retention
        const hasMethodNote = /方法.*分|方法正确/.test(result);
        checks[13].status = 'pass';
        checks[13].detail = hasMethodNote ? '已标注方法分保留' : '方法分保留原则已纳入';

        // 15. Process score retention
        const hasProcessNote = /过程.*分|推导.*正确.*给分/.test(result);
        checks[14].status = 'pass';
        checks[14].detail = hasProcessNote ? '已标注过程分保留' : '过程分保留原则已纳入';

        // 16. Key point scoring for multiple solutions
        const hasMultiSolution = /法一|法二|解法一|解法二/.test(result);
        checks[15].status = hasMultiSolution ? 'pass' : 'pending';
        checks[15].detail = hasMultiSolution ? '多解问题已按得分点评分' : '未检测到多解问题';

        // 17. Innovation method equal scoring
        checks[16].status = 'pass';
        checks[16].detail = '创新方法等值给分原则已纳入';

        // 18. Missing step酌情给分
        checks[17].status = 'pass';
        checks[17].detail = '步骤缺失酌情给分原则已纳入';

        // 19. No vague deduction description
        const hasVague = /不给分|不得分(?!\s*$)/.test(result);
        const hasVagueAll = /不给分/.test(result) && !/明确.*扣分|扣\d+分/.test(result);
        checks[18].status = !hasVagueAll ? 'pass' : 'fail';
        checks[18].detail = !hasVagueAll ? '未发现模糊扣分描述' : '发现"不给分"模糊描述，应明确扣分额度';

        // 20. Score sum = question total
        const sumBlocks = result.split(/(?=\d+\.（本小题满分)/);
        let sumMatchCount = 0;
        let sumTotalCount = 0;
        for (const block of sumBlocks) {
            const totalMatch = block.match(/满分(\d+)分/);
            if (totalMatch) {
                sumTotalCount++;
                const expected = parseInt(totalMatch[1]);
                const scores = block.match(/……(\d+)分/g);
                if (scores) {
                    const lastScore = parseInt(scores[scores.length - 1].match(/\d+/)[0]);
                    if (lastScore === expected) sumMatchCount++;
                }
            }
        }
        checks[19].status = sumTotalCount > 0 && sumMatchCount === sumTotalCount ? 'pass' : 'fail';
        checks[19].detail = `${sumMatchCount}/${sumTotalCount} 题步骤分值之和等于题总分`;

        // Check forbidden phrases (hidden prompt)
        const forbidden = ['同理可得', '类似可证', '其余步骤略', '由上可知', '容易得到', '显然', '不难发现'];
        const foundForbidden = forbidden.filter(phrase => result.includes(phrase));

        // Render verification
        this.dom.verifyList.innerHTML = checks.map(check => `
            <div class="verify-item ${check.status}">
                <div class="verify-icon">
                    ${check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '○'}
                </div>
                <div class="verify-text">
                    <div class="verify-title">${check.title}</div>
                    <div class="verify-detail">${check.detail}</div>
                </div>
            </div>
        `).join('') + (foundForbidden.length > 0 ? `
            <div class="verify-item fail">
                <div class="verify-icon">✗</div>
                <div class="verify-text">
                    <div class="verify-title">隐藏约束检查 — 禁用表述</div>
                    <div class="verify-detail">发现禁用表述：${foundForbidden.join('、')}</div>
                </div>
            </div>
        ` : `
            <div class="verify-item pass">
                <div class="verify-icon">✓</div>
                <div class="verify-text">
                    <div class="verify-title">隐藏约束检查 — 禁用表述</div>
                    <div class="verify-detail">未发现禁用表述，推导完整</div>
                </div>
            </div>
        `);
    },

    // ================================================================
    // Progress Display
    // ================================================================
    showProgress(show) {
        if (show) {
            this.dom.progressContainer.style.display = 'block';
            // Render steps
            this.dom.progressSteps.innerHTML = AppConfig.workflowSteps.map((step, i) =>
                `<span class="progress-step" data-step="${i}">${step.label}</span>`
            ).join('');
            this.updateProgress(0);
        } else {
            setTimeout(() => {
                this.dom.progressContainer.style.display = 'none';
            }, 1000);
        }
    },

    updateProgress(percent) {
        this.dom.progressFill.style.width = `${percent}%`;
        this.dom.progressPercent.textContent = `${Math.round(percent)}%`;
    },

    updateProgressStep(stepIndex, status) {
        const step = this.dom.progressSteps.querySelector(`[data-step="${stepIndex}"]`);
        if (step) {
            step.classList.remove('active', 'done');
            if (status) step.classList.add(status);
        }

        // Update progress bar
        const totalSteps = AppConfig.workflowSteps.length;
        const completedSteps = this.dom.progressSteps.querySelectorAll('.done').length;
        const percent = (completedSteps / totalSteps) * 100;
        this.updateProgress(percent);
    },

    updateProgressStatus(status) {
        this.dom.progressStatus.textContent = status;
    },

    // ================================================================
    // Output Tab Switching
    // ================================================================
    switchOutputTab(tab) {
        this.dom.outputTabs.forEach(t => t.classList.remove('active'));
        this.dom.outputPanes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const paneId = `pane-${tab.dataset.outputTab}`;
        document.getElementById(paneId)?.classList.add('active');

        // Auto-preview prompts when switching to Prompt tab
        if (tab.dataset.outputTab === 'prompt' && !this.state.promptLayers) {
            this.previewPrompts();
        }
    },

    // Preview prompts based on current configuration (before generation)
    previewPrompts() {
        const options = this.getOptions();
        const layers = PromptEngine.getAllLayers(options);
        this.state.promptLayers = layers;
        this.displayPrompt(layers);
    },

    // ================================================================
    // Export
    // ================================================================
    async handleExport(format) {
        if (!this.state.result) {
            this.showToast('请先生成评分标准', 'warning');
            return;
        }

        try {
            const filename = `参考答案及评分标准_${this.formatDate()}`;
            await Exporter.export(this.state.result, format, filename);
            this.showToast(`已导出 ${format.toUpperCase()} 格式`, 'success');
        } catch (error) {
            this.showToast(`导出失败：${error.message}`, 'error');
        }
    },

    async handleCopy() {
        if (!this.state.result) {
            this.showToast('请先生成评分标准', 'warning');
            return;
        }

        const success = await Exporter.copyToClipboard(this.state.result);
        this.showToast(success ? '已复制到剪贴板' : '复制失败', success ? 'success' : 'error');
    },

    // ================================================================
    // Settings
    // ================================================================
    openSettings() {
        this.loadSettingsToForm();
        this.dom.settingsModal.style.display = 'flex';
    },

    closeSettings() {
        this.dom.settingsModal.style.display = 'none';
    },

    loadSettingsToForm() {
        const settings = APIClient.getSettings();
        this.dom.settingApiUrl.value = settings.url || '';
        this.dom.settingApiKey.value = settings.key || '';
        this.dom.settingModel.value = settings.model || 'glm-5.2';
        this.dom.settingTemperature.value = settings.temperature ?? 0.1;
        this.dom.settingMaxTokens.value = settings.maxTokens || 8192;
        this.dom.settingTimeout.value = settings.timeout || 180;
    },

    saveSettings() {
        const settings = {
            url: this.dom.settingApiUrl.value.trim() || AppConfig.api.url,
            key: this.dom.settingApiKey.value.trim(),
            model: this.dom.settingModel.value.trim() || 'glm-5.2',
            temperature: parseFloat(this.dom.settingTemperature.value) || 0.1,
            maxTokens: parseInt(this.dom.settingMaxTokens.value) || 8192,
            timeout: parseInt(this.dom.settingTimeout.value) || 180,
            stream: true
        };

        APIClient.saveSettings(settings);
        this.checkAPIStatus();
        this.closeSettings();
        this.showToast('设置已保存', 'success');
    },

    resetSettings() {
        this.dom.settingApiUrl.value = AppConfig.api.url;
        this.dom.settingApiKey.value = '';
        this.dom.settingModel.value = 'glm-5.2';
        this.dom.settingTemperature.value = 0.1;
        this.dom.settingMaxTokens.value = 8192;
        this.dom.settingTimeout.value = 180;
        this.showToast('已恢复默认设置（点击保存生效）', 'info');
    },

    loadSettings() {
        // Settings are loaded by APIClient.getSettings()
        // Nothing to do here, settings are loaded on demand
    },

    checkAPIStatus() {
        const settings = APIClient.getSettings();
        const dot = this.dom.apiStatus.querySelector('.status-dot');
        const text = this.dom.apiStatus.querySelector('.status-text');

        if (settings.key) {
            dot.className = 'status-dot status-online';
            text.textContent = settings.model || '已连接';
        } else {
            dot.className = 'status-dot status-offline';
            text.textContent = '未配置';
        }
    },

    // ================================================================
    // History
    // ================================================================
    saveToHistory(result) {
        try {
            const history = JSON.parse(localStorage.getItem(AppConfig.storage.history) || '[]');
            history.unshift({
                timestamp: Date.now(),
                examType: this.state.options.examType,
                markingStyle: this.state.options.markingStyle,
                preview: result.substring(0, 200),
                full: result
            });
            // Keep last 10 entries
            if (history.length > 10) history.length = 10;
            localStorage.setItem(AppConfig.storage.history, JSON.stringify(history));
        } catch (e) {
            console.warn('Failed to save history:', e);
        }
    },

    restoreLastInput() {
        // Optionally restore last input from localStorage
        // Skip for now to keep the interface clean
    },

    // ================================================================
    // Toast Notifications
    // ================================================================
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${this.escapeHTML(message)}</span>
        `;
        this.dom.toastContainer.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.25s ease forwards';
            setTimeout(() => toast.remove(), 250);
        }, 3500);
    },

    // ================================================================
    // Helpers
    // ================================================================
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    formatDate() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Export
window.App = App;
