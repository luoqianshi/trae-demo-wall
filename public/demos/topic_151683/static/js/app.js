/**
 * 非遗乐器音色工坊 - 前端交互逻辑
 * 纯原生JS，无框架依赖
 */

(function () {
    'use strict';

    /* ============================================================
       全局状态管理
       ============================================================ */
    const state = {
        /** 上传的文件对象 */
        file: null,
        /** 上传后服务端返回的文件URL（用于原始音频试听） */
        fileObjectURL: null,
        /** 乐器列表数据（从API获取） */
        instruments: [],
        /** 已选中的乐器ID集合 */
        selectedInstruments: new Set(),
        /** 当前任务ID */
        taskId: null,
        /** 当前任务状态 */
        taskStatus: null,
        /** 轮询定时器 */
        pollTimer: null,
        /** SSE连接 */
        eventSource: null,
        /** 对比播放状态 */
        compare: {
            playing: false,
            currentIndex: -1,
            audio: null,
            indicators: [],
        },
        /** 各结果音频的Audio对象和波形数据缓存 */
        resultAudioCache: {},
        /** 原始音频AudioBuffer缓存（用于绘制波形） */
        originalAudioBuffer: null,
        /** 是否正在转换中 */
        converting: false,
        /** 是否正在上传 */
        uploading: false,
    };

    /* ============================================================
       XSS防护
       ============================================================ */
    /**
     * 转义HTML特殊字符，防止XSS注入
     * @param {string} str - 需要转义的字符串
     * @returns {string} 转义后的安全字符串
     */
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /* ============================================================
       工具函数
       ============================================================ */
    /** 格式化文件大小 */
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    /** 格式化时间 mm:ss */
    function formatTime(sec) {
        if (!isFinite(sec) || sec < 0) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ':' + String(s).padStart(2, '0');
    }

    /** 从文件名提取后缀 */
    function getFileExt(name) {
        const parts = name.split('.');
        return parts.length > 1 ? parts.pop().toUpperCase() : '未知';
    }

    /** 允许的文件类型 */
    const ALLOWED_TYPES = [
        'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave',
        'audio/flac', 'audio/ogg', 'audio/x-flac',
        'audio/x-m4a', 'audio/mp4', 'audio/aac',
    ];
    const ALLOWED_EXTS = ['mp3', 'wav', 'flac', 'ogg'];
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB

    /** 校验文件 */
    function validateFile(file) {
        if (!file) return '请选择文件';
        const ext = getFileExt(file.name).toLowerCase();
        if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
            return '不支持的文件格式，请上传 MP3/WAV/FLAC/OGG';
        }
        if (file.size > MAX_SIZE) {
            return '文件大小超过 50MB 限制';
        }
        return null;
    }

    /* ============================================================
       DOM元素引用
       ============================================================ */
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const DOM = {};

    function cacheDOM() {
        DOM.navbar = $('#navbar');
        DOM.menuToggle = $('#menu-toggle');
        DOM.mobileNav = $('#mobile-nav');
        DOM.navResultLink = $('#nav-result-link');
        DOM.navResultLinkMobile = $('#nav-result-link-mobile');

        // 上传相关
        DOM.dropzone = $('#dropzone');
        DOM.dropzoneContent = $('#dropzone-content');
        DOM.fileInput = $('#file-input');
        DOM.fileInfo = $('#file-info');
        DOM.fileName = $('#file-name');
        DOM.fileSize = $('#file-size');
        DOM.fileFormat = $('#file-format');
        DOM.originalAudioContainer = $('#original-audio-container');
        DOM.originalAudio = $('#original-audio');
        DOM.originalWaveformContainer = $('#original-waveform-container');
        DOM.originalWaveformCanvas = $('#original-waveform-canvas');
        DOM.removeFileBtn = $('#remove-file-btn');
        DOM.uploadProgress = $('#upload-progress');
        DOM.uploadProgressBar = $('#upload-progress-bar');
        DOM.uploadProgressText = $('#upload-progress-text');
        DOM.titleRow = $('#title-row');
        DOM.songTitle = $('#song-title');
        DOM.bpmRow = $('#bpm-row');
        DOM.detectBpmBtn = $('#detect-bpm-btn');
        DOM.bpmResult = $('#bpm-result');

        // 乐器选择
        DOM.instrumentsGrid = $('#instruments-grid');
        DOM.selectAllBtn = $('#select-all-btn');

        // 操作按钮
        DOM.convertBtn = $('#convert-btn');
        DOM.demoBtn = $('#demo-btn');

        // 加载状态
        DOM.loadingSection = $('#loading-section');
        DOM.loadingText = $('#loading-text');
        DOM.loadingSubText = $('#loading-sub-text');

        // 结果区域
        DOM.resultSection = $('#result-section');
        DOM.resultSheet = $('#result-sheet');
        DOM.sheetImage = $('#sheet-image');
        DOM.downloadSheetBtn = $('#download-sheet-btn');
        DOM.resultMidi = $('#result-midi');
        DOM.downloadMidiBtn = $('#download-midi-btn');
        DOM.resultCompare = $('#result-compare');
        DOM.comparePlayBtn = $('#compare-play-btn');
        DOM.compareProgress = $('#compare-progress');
        DOM.compareIndicators = $('#compare-indicators');
        DOM.compareProgressBar = $('#compare-progress-bar');
        DOM.compareCurrentLabel = $('#compare-current-label');
        DOM.audioPlayers = $('#audio-players');

        // Modal
        DOM.modalOverlay = $('#modal-overlay');
        DOM.modalCloseBtn = $('#modal-close-btn');
        DOM.modalIcon = $('#modal-icon');
        DOM.modalTitle = $('#modal-title');
        DOM.modalTitleEn = $('#modal-title-en');
        DOM.modalHeritageBadge = $('#modal-heritage-badge');
        DOM.modalBody = $('#modal-body');

        // Toast
        DOM.toastContainer = $('#toast-container');
    }

    /* ============================================================
       Toast消息系统
       ============================================================ */
    const TOAST_ICONS = {
        success: '\u2714\uFE0F',
        error: '\u274C',
        info: '\u2139\uFE0F',
        warning: '\u26A0\uFE0F',
    };

    /**
     * 显示Toast消息
     * @param {'success'|'error'|'info'|'warning'} type
     * @param {string} message
     * @param {number} [duration=4000] 自动消失时间(ms)
     */
    function showToast(type, message, duration) {
        if (duration === undefined) duration = 4000;
        const toast = document.createElement('div');
        toast.className = 'toast toast--' + type;
        toast.setAttribute('role', 'alert');
        toast.innerHTML =
            '<span class="toast__icon" aria-hidden="true">' + escapeHTML(TOAST_ICONS[type] || '') + '</span>' +
            '<span class="toast__message">' + escapeHTML(message) + '</span>' +
            '<button class="toast__close" aria-label="关闭">\u00D7</button>';

        // 关闭按钮
        var closeBtn = toast.querySelector('.toast__close');
        closeBtn.addEventListener('click', function () { removeToast(toast); });

        DOM.toastContainer.appendChild(toast);

        // 自动消失
        var timer = setTimeout(function () { removeToast(toast); }, duration);
        toast._timer = timer;
    }

    function removeToast(toast) {
        if (!toast || !toast.parentNode) return;
        clearTimeout(toast._timer);
        toast.classList.add('toast--exiting');
        toast.addEventListener('animationend', function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        });
    }

    /* ============================================================
       Modal系统
       ============================================================ */
    /** 当前打开Modal时捕获的上一个焦点元素 */
    let previousFocus = null;

    /**
     * 打开乐器科普Modal
     * @param {string} instrumentId - 乐器ID
     */
    function openModal(instrumentId) {
        // 查找乐器数据，优先从完整数据（如果已获取），否则从列表
        var inst = state.instruments.find(function (i) { return i.id === instrumentId; });
        if (!inst) {
            showToast('error', '未找到乐器信息');
            return;
        }

        // 如果只有列表数据，需要获取详情
        if (!inst.history) {
            fetchInstrumentDetail(instrumentId, function (detail) {
                if (detail) renderModalContent(detail);
            });
        } else {
            renderModalContent(inst);
        }

        previousFocus = document.activeElement;
        DOM.modalOverlay.hidden = false;
        DOM.modalCloseBtn.focus();
        document.body.style.overflow = 'hidden';
    }

    function renderModalContent(inst) {
        DOM.modalIcon.textContent = inst.icon || '';
        DOM.modalTitle.textContent = inst.name || '';
        DOM.modalTitleEn.textContent = inst.name_en || '';

        // 非遗徽章
        if (inst.heritage) {
            DOM.modalHeritageBadge.hidden = false;
        } else {
            DOM.modalHeritageBadge.hidden = true;
        }

        // 构建内容
        var html = '';

        if (inst.history) {
            html += '<h4>历史渊源</h4><p>' + escapeHTML(inst.history) + '</p>';
        }
        if (inst.techniques) {
            html += '<h4>演奏技法</h4><p>' + escapeHTML(inst.techniques) + '</p>';
        }
        if (inst.range) {
            html += '<h4>音域</h4><p>' + escapeHTML(inst.range) + '</p>';
        }
        if (inst.repertoire) {
            html += '<h4>代表曲目</h4><ul>';
            var list = inst.repertoire;
            if (typeof list === 'string') list = list.split(/[,，、]/);
            list.forEach(function (item) {
                html += '<li>' + escapeHTML(item.trim()) + '</li>';
            });
            html += '</ul>';
        }
        if (inst.heritage) {
            html += '<div class="modal__heritage-note"><p>';
            html += escapeHTML(inst.name) + ' 是中国国家级非物质文化遗产代表性项目，承载着千年的音乐文化传承。';
            html += '</p></div>';
        }

        // 如果没有详细数据
        if (!inst.history && !inst.techniques && !inst.range && !inst.repertoire) {
            html += '<p>暂无详细科普信息，敬请期待。</p>';
            if (inst.short_desc) {
                html += '<p>' + escapeHTML(inst.short_desc) + '</p>';
            }
        }

        DOM.modalBody.innerHTML = html;
    }

    function closeModal() {
        DOM.modalOverlay.hidden = true;
        document.body.style.overflow = '';
        if (previousFocus) {
            previousFocus.focus();
            previousFocus = null;
        }
    }

    /** 获取乐器详情 */
    function fetchInstrumentDetail(id, callback) {
        fetch('/api/instruments/' + encodeURIComponent(id))
            .then(function (r) { return r.json(); })
            .then(function (json) {
                if (json.success && json.data) {
                    // 更新列表中的数据
                    var idx = state.instruments.findIndex(function (i) { return i.id === id; });
                    if (idx !== -1) {
                        state.instruments[idx] = Object.assign({}, state.instruments[idx], json.data);
                    }
                    callback(json.data);
                } else {
                    callback(null);
                }
            })
            .catch(function () {
                showToast('error', '获取乐器详情失败');
                callback(null);
            });
    }

    /* ============================================================
       导航栏：滚动增强阴影 + 移动端菜单
       ============================================================ */
    function initNavbar() {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 10) {
                DOM.navbar.classList.add('navbar--scrolled');
            } else {
                DOM.navbar.classList.remove('navbar--scrolled');
            }
        }, { passive: true });

        // 移动端菜单切换
        DOM.menuToggle.addEventListener('click', function () {
            var isHidden = DOM.mobileNav.hidden;
            DOM.mobileNav.hidden = !isHidden;
            DOM.menuToggle.setAttribute('aria-expanded', String(!isHidden));
        });

        // 点击移动端导航链接后关闭菜单
        DOM.mobileNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                DOM.mobileNav.hidden = true;
                DOM.menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /** 显示结果导航链接 */
    function showResultNavLink() {
        DOM.navResultLink.classList.remove('navbar__link--hidden');
        DOM.navResultLink.classList.add('navbar__link--visible');
        DOM.navResultLinkMobile.classList.remove('navbar__link--hidden');
        DOM.navResultLinkMobile.classList.add('navbar__link--visible');
    }

    /* ============================================================
       文件上传
       ============================================================ */
    function initUpload() {
        // 点击上传区域触发文件选择
        DOM.dropzone.addEventListener('click', function (e) {
            // 如果已有文件，不触发（除非点击移除按钮）
            if (state.file && !e.target.closest('#remove-file-btn') && !e.target.closest('.upload__remove-btn')) {
                return;
            }
            DOM.fileInput.click();
        });

        // 键盘回车/空格也触发
        DOM.dropzone.addEventListener('keydown', function (e) {
            if ((e.key === 'Enter' || e.key === ' ') && !state.file) {
                e.preventDefault();
                DOM.fileInput.click();
            }
        });

        // 文件选择变化
        DOM.fileInput.addEventListener('change', function () {
            if (DOM.fileInput.files.length > 0) {
                handleFileSelected(DOM.fileInput.files[0]);
            }
        });

        // 拖拽事件
        DOM.dropzone.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (!state.file) {
                DOM.dropzone.classList.add('upload__dropzone--dragover');
            }
        });

        DOM.dropzone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            DOM.dropzone.classList.remove('upload__dropzone--dragover');
        });

        DOM.dropzone.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            DOM.dropzone.classList.remove('upload__dropzone--dragover');
            if (state.file) return;
            var files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelected(files[0]);
            }
        });

        // 移除文件
        DOM.removeFileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            removeFile();
        });
    }

    /** 处理文件选择 */
    function handleFileSelected(file) {
        var error = validateFile(file);
        if (error) {
            showToast('error', error);
            DOM.fileInput.value = '';
            return;
        }

        state.file = file;
        state.fileObjectURL = URL.createObjectURL(file);

        // 更新UI
        DOM.dropzoneContent.hidden = true;
        DOM.fileInfo.hidden = false;
        DOM.dropzone.classList.add('upload__dropzone--has-file');
        DOM.fileName.textContent = file.name;
        DOM.fileSize.textContent = formatFileSize(file.size);
        DOM.fileFormat.textContent = getFileExt(file.name);

        // 试听原始音频
        DOM.originalAudio.src = state.fileObjectURL;
        DOM.originalAudioContainer.hidden = false;

        // 绘制原始音频波形
        drawOriginalWaveform(file);

        // 显示曲名和BPM行
        DOM.titleRow.hidden = false;
        DOM.bpmRow.hidden = false;

        // 清除BPM结果
        DOM.bpmResult.textContent = '';

        // 更新转换按钮状态
        updateConvertBtn();

        showToast('success', '文件已选择：' + file.name);
    }

    /** 移除已选文件 */
    function removeFile() {
        if (state.fileObjectURL) {
            URL.revokeObjectURL(state.fileObjectURL);
        }
        state.file = null;
        state.fileObjectURL = null;
        state.originalAudioBuffer = null;

        DOM.fileInput.value = '';
        DOM.dropzoneContent.hidden = false;
        DOM.fileInfo.hidden = true;
        DOM.dropzone.classList.remove('upload__dropzone--has-file');
        DOM.originalAudioContainer.hidden = true;
        DOM.originalWaveformContainer.hidden = true;
        DOM.titleRow.hidden = true;
        DOM.bpmRow.hidden = true;
        DOM.bpmResult.textContent = '';

        updateConvertBtn();
    }

    /* ============================================================
       音频波形可视化
       ============================================================ */

    /** 绘制原始上传音频的波形 */
    function drawOriginalWaveform(file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            ctx.decodeAudioData(e.target.result, function (buffer) {
                state.originalAudioBuffer = buffer;
                var canvas = DOM.originalWaveformCanvas;
                var dpr = window.devicePixelRatio || 1;
                var rect = canvas.getBoundingClientRect();
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                var c = canvas.getContext('2d');
                c.scale(dpr, dpr);

                drawWaveformToCanvas(c, buffer, rect.width, rect.height, '#8B0000', '#C4A35A');
                DOM.originalWaveformContainer.hidden = false;

                ctx.close();
            }).catch(function () {
                // 解码失败，不显示波形
            });
        };
        reader.readAsArrayBuffer(file);
    }

    /**
     * 通用波形绘制函数
     * @param {CanvasRenderingContext2D} ctx
     * @param {AudioBuffer} buffer
     * @param {number} width
     * @param {number} height
     * @param {string} color1 - 波形颜色
     * @param {string} color2 - 中线颜色
     */
    function drawWaveformToCanvas(ctx, buffer, width, height, color1, color2) {
        var data = buffer.getChannelData(0);
        var step = Math.ceil(data.length / width);
        var mid = height / 2;

        ctx.clearRect(0, 0, width, height);

        // 中线
        ctx.strokeStyle = color2;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, mid);
        ctx.lineTo(width, mid);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 波形
        var gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(0.5, color2);
        gradient.addColorStop(1, color1);
        ctx.fillStyle = gradient;

        for (var i = 0; i < width; i++) {
            var min = 1.0, max = -1.0;
            var start = i * step;
            for (var j = 0; j < step && start + j < data.length; j++) {
                var datum = data[start + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            var barHeight = Math.max(1, (max - min) * mid);
            var y = mid - barHeight / 2;
            ctx.fillRect(i, y, 1, barHeight);
        }
    }

    /** 绘制结果音频波形并返回Promise<AudioBuffer> */
    function loadAndDrawResultWaveform(audioUrl, canvas) {
        return fetch(audioUrl)
            .then(function (r) { return r.arrayBuffer(); })
            .then(function (arrayBuf) {
                var actx = new (window.AudioContext || window.webkitAudioContext)();
                return actx.decodeAudioData(arrayBuf).then(function (buffer) {
                    var dpr = window.devicePixelRatio || 1;
                    var rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    var c = canvas.getContext('2d');
                    c.scale(dpr, dpr);
                    drawWaveformToCanvas(c, buffer, rect.width, rect.height, '#8B0000', '#C4A35A');
                    actx.close();
                    return buffer;
                });
            })
            .catch(function () {
                return null;
            });
    }

    /* ============================================================
       BPM检测
       ============================================================ */
    function initBPM() {
        DOM.detectBpmBtn.addEventListener('click', function () {
            if (!state.file) {
                showToast('warning', '请先上传音频文件');
                return;
            }
            DOM.detectBpmBtn.disabled = true;
            DOM.bpmResult.textContent = '检测中...';

            var formData = new FormData();
            formData.append('file', state.file);

            fetch('/api/bpm', {
                method: 'POST',
                body: formData,
            })
                .then(function (r) { return r.json(); })
                .then(function (json) {
                    DOM.detectBpmBtn.disabled = false;
                    if (json.success && typeof json.bpm === 'number') {
                        DOM.bpmResult.textContent = 'BPM: ' + Math.round(json.bpm);
                        showToast('success', '检测到节拍：' + Math.round(json.bpm) + ' BPM');
                    } else {
                        DOM.bpmResult.textContent = '检测失败';
                        showToast('error', json.message || 'BPM检测失败');
                    }
                })
                .catch(function () {
                    DOM.detectBpmBtn.disabled = false;
                    DOM.bpmResult.textContent = '检测失败';
                    showToast('error', '网络错误，BPM检测失败');
                });
        });
    }

    /* ============================================================
       乐器数据加载与渲染
       ============================================================ */
    function loadInstruments() {
        fetch('/api/instruments')
            .then(function (r) { return r.json(); })
            .then(function (json) {
                if (json.success && Array.isArray(json.data)) {
                    state.instruments = json.data;
                    renderInstrumentCards();
                } else {
                    showToast('error', '加载乐器列表失败');
                }
            })
            .catch(function () {
                showToast('error', '网络错误，无法加载乐器列表');
            });
    }

    /** 渲染乐器卡片 */
    function renderInstrumentCards() {
        var grid = DOM.instrumentsGrid;
        grid.innerHTML = '';

        state.instruments.forEach(function (inst) {
            var card = document.createElement('div');
            card.className = 'instrument-card';
            card.setAttribute('role', 'option');
            card.setAttribute('aria-selected', 'false');
            card.setAttribute('tabindex', '0');
            card.setAttribute('data-id', inst.id);
            card.setAttribute('aria-label', inst.name);

            var html = '';

            // 非遗徽章
            if (inst.heritage) {
                html += '<span class="badge badge--heritage instrument-card__badge">非遗</span>';
            }

            html += '<span class="instrument-card__icon" aria-hidden="true">' + escapeHTML(inst.icon || '') + '</span>';
            html += '<span class="instrument-card__name">' + escapeHTML(inst.name) + '</span>';
            html += '<span class="instrument-card__name-en">' + escapeHTML(inst.name_en || '') + '</span>';
            html += '<span class="instrument-card__desc">' + escapeHTML(inst.short_desc || inst.tagline || '') + '</span>';
            html += '<button class="instrument-card__info-btn" aria-label="查看' + escapeHTML(inst.name) + '科普" data-info-id="' + escapeHTML(inst.id) + '">i</button>';

            card.innerHTML = html;
            grid.appendChild(card);

            // 点击卡片切换选中（排除科普按钮）
            card.addEventListener('click', function (e) {
                if (e.target.closest('.instrument-card__info-btn')) return;
                toggleInstrument(inst.id, card);
            });

            // 键盘操作
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleInstrument(inst.id, card);
                }
            });

            // 科普按钮
            var infoBtn = card.querySelector('.instrument-card__info-btn');
            infoBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                openModal(inst.id);
            });
        });
    }

    /** 切换乐器选中 */
    function toggleInstrument(id, card) {
        if (state.selectedInstruments.has(id)) {
            state.selectedInstruments.delete(id);
            card.classList.remove('instrument-card--selected');
            card.setAttribute('aria-selected', 'false');
        } else {
            state.selectedInstruments.add(id);
            card.classList.add('instrument-card--selected');
            card.setAttribute('aria-selected', 'true');
        }
        updateConvertBtn();
        updateSelectAllBtnText();
    }

    /** 更新全选按钮文字 */
    function updateSelectAllBtnText() {
        var allSelected = state.instruments.length > 0 && state.selectedInstruments.size === state.instruments.length;
        DOM.selectAllBtn.textContent = allSelected ? '取消全选' : '全选乐器';
    }

    /** 全选/取消全选 */
    function initSelectAll() {
        DOM.selectAllBtn.addEventListener('click', function () {
            var allSelected = state.instruments.length > 0 && state.selectedInstruments.size === state.instruments.length;
            var cards = DOM.instrumentsGrid.querySelectorAll('.instrument-card');

            if (allSelected) {
                // 取消全选
                state.selectedInstruments.clear();
                cards.forEach(function (c) {
                    c.classList.remove('instrument-card--selected');
                    c.setAttribute('aria-selected', 'false');
                });
            } else {
                // 全选
                state.instruments.forEach(function (inst) {
                    state.selectedInstruments.add(inst.id);
                });
                cards.forEach(function (c) {
                    c.classList.add('instrument-card--selected');
                    c.setAttribute('aria-selected', 'true');
                });
            }

            updateConvertBtn();
            updateSelectAllBtnText();
        });
    }

    /** 更新转换按钮状态 */
    function updateConvertBtn() {
        var hasFile = !!state.file;
        var hasInstrument = state.selectedInstruments.size > 0;
        DOM.convertBtn.disabled = !hasFile || !hasInstrument || state.converting;
    }

    /* ============================================================
       转换功能
       ============================================================ */
    function initConvert() {
        DOM.convertBtn.addEventListener('click', startConvert);
    }

    /** 开始转换流程 */
    function startConvert() {
        if (!state.file || state.selectedInstruments.size === 0) {
            showToast('warning', '请先上传音频并选择至少一种乐器');
            return;
        }

        state.converting = true;
        state.uploading = true;
        updateConvertBtn();

        // 显示进度条
        DOM.uploadProgress.hidden = false;
        DOM.uploadProgressBar.style.width = '0%';
        DOM.uploadProgressBar.setAttribute('aria-valuenow', '0');
        DOM.uploadProgressText.textContent = '0%';

        // 构建表单
        var formData = new FormData();
        formData.append('file', state.file);
        formData.append('instruments', JSON.stringify(Array.from(state.selectedInstruments)));
        var title = DOM.songTitle.value.trim();
        formData.append('title', title || '');

        // XHR上传，跟踪进度
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');

        xhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
                var pct = Math.round((e.loaded / e.total) * 100);
                DOM.uploadProgressBar.style.width = pct + '%';
                DOM.uploadProgressBar.setAttribute('aria-valuenow', String(pct));
                DOM.uploadProgressText.textContent = pct + '%';
            }
        });

        xhr.addEventListener('load', function () {
            state.uploading = false;
            DOM.uploadProgress.hidden = true;

            try {
                var json = JSON.parse(xhr.responseText);
                if (json.success && json.task_id) {
                    state.taskId = json.task_id;
                    showToast('success', '上传成功，开始处理...');
                    showLoadingState();
                    startTaskMonitoring(json.task_id);
                } else {
                    state.converting = false;
                    updateConvertBtn();
                    showToast('error', json.message || '上传失败');
                }
            } catch (e) {
                state.converting = false;
                updateConvertBtn();
                showToast('error', '服务器响应异常');
            }
        });

        xhr.addEventListener('error', function () {
            state.uploading = false;
            state.converting = false;
            DOM.uploadProgress.hidden = true;
            updateConvertBtn();
            showToast('error', '网络错误，上传失败');
        });

        xhr.addEventListener('abort', function () {
            state.uploading = false;
            state.converting = false;
            DOM.uploadProgress.hidden = true;
            updateConvertBtn();
            showToast('warning', '上传已取消');
        });

        xhr.send(formData);
    }

    /* ============================================================
       Demo功能
       ============================================================ */
    function initDemo() {
        DOM.demoBtn.addEventListener('click', function () {
            // 如果没有选中乐器，默认全选
            var instList = state.selectedInstruments.size > 0
                ? Array.from(state.selectedInstruments)
                : state.instruments.map(function (inst) { return inst.id; });

            DOM.demoBtn.disabled = true;
            var instruments = instList.join(',');
            var title = DOM.songTitle.value.trim();
            var url = '/api/demo?instruments=' + encodeURIComponent(instruments) + '&title=' + encodeURIComponent(title || 'Demo');

            fetch(url)
                .then(function (r) { return r.json(); })
                .then(function (json) {
                    DOM.demoBtn.disabled = false;
                    if (json.success && json.task_id) {
                        state.taskId = json.task_id;
                        showToast('info', 'Demo 任务已创建，开始处理...');
                        showLoadingState();
                        startTaskMonitoring(json.task_id);
                    } else {
                        showToast('error', json.message || '创建Demo失败');
                    }
                })
                .catch(function () {
                    DOM.demoBtn.disabled = false;
                    showToast('error', '网络错误');
                });
        });
    }

    /* ============================================================
       任务状态监控（SSE + 轮询fallback）
       ============================================================ */

    /** 显示加载状态 */
    function showLoadingState() {
        DOM.loadingSection.hidden = false;
        DOM.resultSection.hidden = true;
        DOM.loadingText.textContent = 'AI 正在为您转换音色，请稍候...';
        DOM.loadingSubText.textContent = '这可能需要 30 秒至数分钟';

        // 滚动到加载区域
        DOM.loadingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /** 隐藏加载状态 */
    function hideLoadingState() {
        DOM.loadingSection.hidden = true;
        state.converting = false;
        updateConvertBtn();
    }

    /**
     * 开始任务监控：优先SSE，不支持则轮询
     * @param {string} taskId
     */
    function startTaskMonitoring(taskId) {
        // 清理之前的连接
        cleanupTaskMonitoring();

        // 尝试SSE
        if (typeof EventSource !== 'undefined') {
            trySSE(taskId);
        } else {
            // 不支持SSE，直接轮询
            startPolling(taskId);
        }
    }

    /** 尝试SSE连接 */
    function trySSE(taskId) {
        var es = new EventSource('/api/task/' + encodeURIComponent(taskId) + '/stream');
        state.eventSource = es;
        var connected = false;
        var fallbackTimer = setTimeout(function () {
            // 3秒内没有收到任何事件，fallback到轮询
            if (!connected) {
                es.close();
                state.eventSource = null;
                startPolling(taskId);
            }
        }, 3000);

        es.addEventListener('open', function () {
            connected = true;
            clearTimeout(fallbackTimer);
        });

        es.addEventListener('status', function (e) {
            try {
                var data = JSON.parse(e.data);
                if (data.status === 'processing') {
                    DOM.loadingText.textContent = data.message || '正在处理中...';
                }
            } catch (err) {
                // 忽略解析错误
            }
        });

        es.addEventListener('completed', function (e) {
            clearTimeout(fallbackTimer);
            es.close();
            state.eventSource = null;
            try {
                var data = JSON.parse(e.data);
                handleTaskComplete(data);
            } catch (err) {
                // 解析失败，手动获取结果
                fetchResult(taskId);
            }
        });

        es.addEventListener('error', function (e) {
            clearTimeout(fallbackTimer);
            es.close();
            state.eventSource = null;
            // SSE出错，fallback到轮询
            if (state.converting) {
                startPolling(taskId);
            }
        });
    }

    /** 轮询任务状态 */
    function startPolling(taskId) {
        function poll() {
            fetch('/api/task/' + encodeURIComponent(taskId))
                .then(function (r) { return r.json(); })
                .then(function (json) {
                    if (!json.success) {
                        showToast('error', '查询任务状态失败');
                        return;
                    }
                    var data = json.data;
                    if (data.status === 'completed') {
                        // 完成
                        cleanupTaskMonitoring();
                        fetchResult(taskId);
                    } else if (data.status === 'failed') {
                        cleanupTaskMonitoring();
                        hideLoadingState();
                        showToast('error', data.error || '转换失败');
                    } else if (data.status === 'processing') {
                        DOM.loadingText.textContent = '正在处理中...';
                    }
                    // pending状态继续轮询
                })
                .catch(function () {
                    // 网络错误，继续轮询
                });
        }

        // 立即执行一次
        poll();
        // 每3秒轮询
        state.pollTimer = setInterval(poll, 3000);
    }

    /** 清理任务监控 */
    function cleanupTaskMonitoring() {
        if (state.pollTimer) {
            clearInterval(state.pollTimer);
            state.pollTimer = null;
        }
        if (state.eventSource) {
            state.eventSource.close();
            state.eventSource = null;
        }
    }

    /** 获取任务结果 */
    function fetchResult(taskId) {
        fetch('/api/result/' + encodeURIComponent(taskId))
            .then(function (r) { return r.json(); })
            .then(function (json) {
                hideLoadingState();
                if (json.success && json.data) {
                    displayResult(json.data);
                } else {
                    showToast('error', json.message || '获取结果失败');
                }
            })
            .catch(function () {
                hideLoadingState();
                showToast('error', '网络错误，无法获取结果');
            });
    }

    /** 处理任务完成（SSE推送的数据可能直接包含结果） */
    function handleTaskComplete(data) {
        hideLoadingState();
        if (data && (data.sheet_url || (data.audio_files && data.audio_files.length > 0))) {
            displayResult(data);
        } else {
            // SSE可能只推送了完成事件，数据不完整，再获取一次
            fetchResult(state.taskId);
        }
    }

    /* ============================================================
       结果展示
       ============================================================ */

    /** 显示转换结果 */
    function displayResult(data) {
        // 清空之前的波形缓存
        state.resultAudioCache = {};

        // 五线谱
        if (data.sheet_url) {
            DOM.sheetImage.src = data.sheet_url;
            DOM.resultSheet.hidden = false;
            // 下载五线谱
            DOM.downloadSheetBtn.onclick = function () {
                downloadFile(data.sheet_url, 'sheet.png');
            };
        } else {
            DOM.resultSheet.hidden = true;
        }

        // MIDI
        if (data.midi_url) {
            DOM.resultMidi.hidden = false;
            DOM.downloadMidiBtn.onclick = function () {
                downloadFile(data.midi_url, 'output.mid');
            };
        } else {
            DOM.resultMidi.hidden = true;
        }

        // 对比收听
        if (data.audio_files && data.audio_files.length > 1) {
            DOM.resultCompare.hidden = false;
            initCompareMode(data.audio_files);
        } else {
            DOM.resultCompare.hidden = true;
        }

        // 各乐器音频播放器
        renderAudioPlayers(data.audio_files || []);

        // 显示结果区
        DOM.resultSection.hidden = false;
        showResultNavLink();

        // 滚动到结果区
        setTimeout(function () {
            DOM.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        showToast('success', '转换完成！');
    }

    /** 渲染各乐器音频播放器 */
    function renderAudioPlayers(audioFiles) {
        var container = DOM.audioPlayers;
        container.innerHTML = '';

        audioFiles.forEach(function (af, idx) {
            var player = document.createElement('div');
            player.className = 'audio-player';

            // 播放/暂停SVG图标
            var playSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
            var pauseSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
            var dlSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

            player.innerHTML =
                '<span class="audio-player__name">' + escapeHTML(af.instrument_name) + '</span>' +
                '<div class="audio-player__waveform-wrap">' +
                    '<canvas class="audio-player__waveform-canvas" data-idx="' + idx + '" aria-label="' + escapeHTML(af.instrument_name) + '波形"></canvas>' +
                '</div>' +
                '<div class="audio-player__controls">' +
                    '<button class="audio-player__play-btn" data-url="' + escapeHTML(af.url) + '" data-idx="' + idx + '" aria-label="播放' + escapeHTML(af.instrument_name) + '">' + playSvg + '</button>' +
                    '<button class="audio-player__download-btn" data-url="' + escapeHTML(af.url) + '" data-filename="' + escapeHTML(af.filename) + '" aria-label="下载' + escapeHTML(af.instrument_name) + '音频">' + dlSvg + '</button>' +
                '</div>' +
                '<span class="audio-player__time" data-idx="' + idx + '">0:00 / 0:00</span>';

            container.appendChild(player);

            // 创建Audio对象
            var audio = new Audio(af.url);
            audio.preload = 'auto';
            state.resultAudioCache[idx] = {
                audio: audio,
                url: af.url,
                name: af.instrument_name,
                filename: af.filename,
                playing: false,
            };

            // 播放/暂停按钮
            var playBtn = player.querySelector('.audio-player__play-btn');
            playBtn.addEventListener('click', function () {
                toggleResultAudio(idx, playBtn);
            });

            // 下载按钮
            var dlBtn = player.querySelector('.audio-player__download-btn');
            dlBtn.addEventListener('click', function () {
                downloadFile(af.url, af.filename);
            });

            // 波形点击跳转
            var canvas = player.querySelector('.audio-player__waveform-canvas');
            canvas.addEventListener('click', function (e) {
                var rect = canvas.getBoundingClientRect();
                var ratio = (e.clientX - rect.left) / rect.width;
                var cache = state.resultAudioCache[idx];
                if (cache && cache.audio.duration) {
                    cache.audio.currentTime = ratio * cache.audio.duration;
                }
            });

            // 时间更新
            audio.addEventListener('timeupdate', function () {
                var timeEl = player.querySelector('.audio-player__time');
                if (timeEl && audio.duration) {
                    timeEl.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
                }
            });

            // 播放结束
            audio.addEventListener('ended', function () {
                playBtn.innerHTML = playSvg;
                playBtn.setAttribute('aria-label', '播放' + af.instrument_name);
                state.resultAudioCache[idx].playing = false;
            });

            // 加载元数据后绘制波形
            audio.addEventListener('loadedmetadata', function () {
                // 尝试绘制波形
                var waveCanvas = player.querySelector('.audio-player__waveform-canvas');
                if (waveCanvas) {
                    loadAndDrawResultWaveform(af.url, waveCanvas).then(function (buffer) {
                        if (buffer) {
                            state.resultAudioCache[idx].buffer = buffer;
                        }
                    });
                }
            });
        });
    }

    /** 切换结果音频播放/暂停 */
    function toggleResultAudio(idx, btn) {
        var cache = state.resultAudioCache[idx];
        if (!cache) return;

        var playSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        var pauseSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

        // 如果对比模式正在播放，先停止
        if (state.compare.playing) {
            stopCompare();
        }

        // 暂停其他正在播放的音频
        Object.keys(state.resultAudioCache).forEach(function (key) {
            var other = state.resultAudioCache[key];
            if (other.playing && parseInt(key) !== idx) {
                other.audio.pause();
                other.playing = false;
                // 更新其他按钮图标
                var otherBtn = document.querySelector('.audio-player__play-btn[data-idx="' + key + '"]');
                if (otherBtn) {
                    otherBtn.innerHTML = playSvg;
                }
            }
        });

        if (cache.playing) {
            cache.audio.pause();
            cache.playing = false;
            btn.innerHTML = playSvg;
            btn.setAttribute('aria-label', '播放' + cache.name);
        } else {
            cache.audio.play().catch(function () {
                showToast('error', '音频播放失败');
            });
            cache.playing = true;
            btn.innerHTML = pauseSvg;
            btn.setAttribute('aria-label', '暂停' + cache.name);
        }
    }

    /* ============================================================
       对比收听模式
       ============================================================ */
    function initCompareMode(audioFiles) {
        state.compare.indicators = audioFiles.map(function (af) {
            return { name: af.instrument_name, url: af.url, filename: af.filename };
        });
        state.compare.currentIndex = -1;
        state.compare.playing = false;

        // 生成指示器
        DOM.compareIndicators.innerHTML = '';
        audioFiles.forEach(function (af, i) {
            var el = document.createElement('span');
            el.className = 'compare__indicator';
            el.setAttribute('data-compare-idx', i);
            el.textContent = af.instrument_name;
            DOM.compareIndicators.appendChild(el);
        });

        // 重置UI
        DOM.compareProgress.hidden = true;
        DOM.compareProgressBar.style.width = '0%';
        DOM.compareCurrentLabel.textContent = '';
        DOM.comparePlayBtn.textContent = '';
        DOM.comparePlayBtn.innerHTML =
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
            '开始对比收听';

        // 点击事件
        DOM.comparePlayBtn.onclick = function () {
            if (state.compare.playing) {
                stopCompare();
            } else {
                startCompare();
            }
        };
    }

    /** 开始对比播放 */
    function startCompare() {
        // 停止所有单独播放的音频
        Object.keys(state.resultAudioCache).forEach(function (key) {
            var cache = state.resultAudioCache[key];
            if (cache.playing) {
                cache.audio.pause();
                cache.playing = false;
                var btn = document.querySelector('.audio-player__play-btn[data-idx="' + key + '"]');
                if (btn) {
                    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
                }
            }
        });

        if (state.compare.indicators.length === 0) return;

        state.compare.playing = true;
        state.compare.currentIndex = 0;

        DOM.compareProgress.hidden = false;
        DOM.comparePlayBtn.innerHTML =
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
            '停止对比收听';

        playCompareItem(0);
    }

    /** 播放对比模式中的第i个 */
    function playCompareItem(index) {
        if (!state.compare.playing || index >= state.compare.indicators.length) {
            stopCompare();
            return;
        }

        state.compare.currentIndex = index;
        var item = state.compare.indicators[index];
        var total = state.compare.indicators.length;

        // 更新指示器
        var indicators = DOM.compareIndicators.querySelectorAll('.compare__indicator');
        indicators.forEach(function (el, i) {
            el.classList.remove('compare__indicator--active', 'compare__indicator--done');
            if (i < index) el.classList.add('compare__indicator--done');
            if (i === index) el.classList.add('compare__indicator--active');
        });

        // 更新进度条
        var pct = Math.round((index / total) * 100);
        DOM.compareProgressBar.style.width = pct + '%';

        // 更新当前标签
        DOM.compareCurrentLabel.textContent = '正在播放：' + item.name + '（' + (index + 1) + ' / ' + total + '）';

        // 创建并播放音频
        var audio = new Audio(item.url);
        state.compare.audio = audio;

        audio.addEventListener('ended', function () {
            // 播放下一个
            playCompareItem(index + 1);
        });

        audio.addEventListener('error', function () {
            showToast('error', item.name + ' 播放失败，跳到下一个');
            playCompareItem(index + 1);
        });

        audio.play().catch(function () {
            showToast('error', '播放失败');
            stopCompare();
        });
    }

    /** 停止对比播放 */
    function stopCompare() {
        state.compare.playing = false;
        if (state.compare.audio) {
            state.compare.audio.pause();
            state.compare.audio.src = '';
            state.compare.audio = null;
        }

        // 更新进度条到100%
        if (state.compare.indicators.length > 0) {
            DOM.compareProgressBar.style.width = '100%';
        }

        // 重置指示器
        var indicators = DOM.compareIndicators.querySelectorAll('.compare__indicator');
        indicators.forEach(function (el) {
            el.classList.remove('compare__indicator--active');
            el.classList.add('compare__indicator--done');
        });

        DOM.compareCurrentLabel.textContent = '对比收听结束';
        DOM.comparePlayBtn.innerHTML =
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
            '重新对比收听';
    }

    /* ============================================================
       下载功能
       ============================================================ */

    /**
     * 下载文件
     * @param {string} url - 文件URL
     * @param {string} filename - 保存的文件名
     */
    function downloadFile(url, filename) {
        var a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /* ============================================================
       减少动效偏好
       ============================================================ */
    function initReducedMotion() {
        var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        // CSS已处理，JS层面在需要时检查
        state.prefersReducedMotion = mq.matches;
        mq.addEventListener('change', function (e) {
            state.prefersReducedMotion = e.matches;
        });
    }

    /* ============================================================
       Modal键盘和焦点管理
       ============================================================ */
    function initModalA11y() {
        // 关闭按钮
        DOM.modalCloseBtn.addEventListener('click', closeModal);

        // 点击遮罩关闭
        DOM.modalOverlay.addEventListener('click', function (e) {
            if (e.target === DOM.modalOverlay) {
                closeModal();
            }
        });

        // ESC关闭
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !DOM.modalOverlay.hidden) {
                closeModal();
            }
        });

        // Tab焦点陷阱
        DOM.modalOverlay.addEventListener('keydown', function (e) {
            if (e.key !== 'Tab') return;
            var focusable = DOM.modalOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) return;
            var first = focusable[0];
            var last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }

    /* ============================================================
       窗口resize时重绘波形
       ============================================================ */
    function initResizeHandler() {
        var resizeTimer = null;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                // 重绘原始波形
                if (state.originalAudioBuffer) {
                    var canvas = DOM.originalWaveformCanvas;
                    var dpr = window.devicePixelRatio || 1;
                    var rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    var c = canvas.getContext('2d');
                    c.scale(dpr, dpr);
                    drawWaveformToCanvas(c, state.originalAudioBuffer, rect.width, rect.height, '#8B0000', '#C4A35A');
                }
                // 重绘结果波形
                Object.keys(state.resultAudioCache).forEach(function (idx) {
                    var cache = state.resultAudioCache[idx];
                    if (cache.buffer) {
                        var waveCanvas = document.querySelector('.audio-player__waveform-canvas[data-idx="' + idx + '"]');
                        if (waveCanvas) {
                            var dpr2 = window.devicePixelRatio || 1;
                            var rect2 = waveCanvas.getBoundingClientRect();
                            waveCanvas.width = rect2.width * dpr2;
                            waveCanvas.height = rect2.height * dpr2;
                            var c2 = waveCanvas.getContext('2d');
                            c2.scale(dpr2, dpr2);
                            drawWaveformToCanvas(c2, cache.buffer, rect2.width, rect2.height, '#8B0000', '#C4A35A');
                        }
                    }
                });
            }, 300);
        });
    }

    /* ============================================================
       初始化
       ============================================================ */
    function init() {
        cacheDOM();
        initNavbar();
        initUpload();
        initBPM();
        initSelectAll();
        initConvert();
        initDemo();
        initModalA11y();
        initReducedMotion();
        initResizeHandler();
        loadInstruments();
    }

    // DOM就绪后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();