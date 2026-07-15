// =========================================
// Coding Land - 代码编辑器组件 <code-editor>
// 用法：<code-editor default="<h1>hi</h1>\n<h2>hello</h2>"></code-editor>
// 功能：实时预览 + 自动缩进 + 自动补全 <>(){}[]
//       + 网页全屏 + 刷新保留滚动位置 + 编辑器专业提示
//       + Tab补全标签 + 蓝色提示弹窗
// 依赖：../common.js（CL_Common）
// 本文件位于 web/ 目录，引用路径为 <script src="code-editor.js"></script>
// =========================================

class CodeEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['default'];
    }

    connectedCallback() {
        const raw = this.getAttribute('default') || '';
        let defaultCode = raw
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '    ')
            .replace(/\/\//g, '/');
        defaultCode = defaultCode.replace(/^(  )+/gm, function(match) {
            return '    '.repeat(match.length / 2);
        });

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    --ce-bg-primary: #0a0a0f;
                    --ce-bg-secondary: #12121a;
                    --ce-bg-tertiary: #1a1a2e;
                    --ce-text-primary: #ffffff;
                    --ce-text-secondary: #a0a0b0;
                    --ce-text-muted: #606070;
                    --ce-web-1: #ff00ff;
                    --ce-web-2: #00ffff;
                    --ce-border: rgba(255, 255, 255, 0.1);
                    --ce-glass-bg: rgba(255, 255, 255, 0.03);
                    --ce-glass-border: rgba(255, 255, 255, 0.08);
                    --ce-danger: #ff4466;
                    --ce-success: #39ff14;
                    --ce-font-display: 'Space Grotesk', system-ui, sans-serif;
                    --ce-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
                    --ce-gradient: linear-gradient(135deg, #ff00ff, #00ffff);
                }

                * { margin: 0; padding: 0; box-sizing: border-box; }

                .workspace {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .panel {
                    background: var(--ce-glass-bg);
                    border: 1px solid var(--ce-glass-border);
                    border-radius: 16px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .panel-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 20px;
                    background: var(--ce-bg-tertiary);
                    border-bottom: 1px solid var(--ce-border);
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .panel-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: var(--ce-font-display);
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--ce-text-secondary);
                }

                .panel-actions { display: flex; gap: 8px; flex-wrap: wrap; }

                .panel-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    background: var(--ce-glass-bg);
                    border: 1px solid var(--ce-border);
                    border-radius: 8px;
                    color: var(--ce-text-secondary);
                    font-family: var(--ce-font-display);
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .panel-btn:hover {
                    color: var(--ce-web-2);
                    border-color: var(--ce-web-2);
                    background: rgba(0, 255, 255, 0.05);
                }

                .editor-tip {
                    padding: 10px 20px;
                    background: rgba(255, 68, 102, 0.08);
                    border-bottom: 1px solid rgba(255, 68, 102, 0.25);
                    color: var(--ce-danger);
                    font-family: var(--ce-font-display);
                    font-size: 0.8rem;
                    line-height: 1.5;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .editor-tip svg { flex-shrink: 0; }

                .editor-container {
                    position: relative;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 420px;
                }

                .code-editor {
                    flex: 1;
                    width: 100%;
                    min-height: 420px;
                    padding: 20px;
                    background: transparent;
                    border: none;
                    outline: none;
                    resize: none;
                    font-family: var(--ce-font-mono);
                    font-size: 0.9rem;
                    line-height: 1.7;
                    color: transparent;
                    caret-color: var(--ce-text-primary);
                    tab-size: 4;
                    white-space: pre;
                    overflow: auto;
                    position: relative;
                    z-index: 1;
                }

                .syntax-layer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 20px;
                    background: var(--ce-bg-secondary);
                    font-family: var(--ce-font-mono);
                    font-size: 0.9rem;
                    line-height: 1.7;
                    white-space: pre;
                    overflow: auto;
                    pointer-events: none;
                    z-index: 0;
                    tab-size: 4;
                }

                .syn-comment { color: #6a9955; }
                .syn-string { color: #ce9178; }
                .syn-tag { color: #569cd6; }
                .syn-tagend { color: #569cd6; }
                .syn-attr { color: #9cdcfe; }
                .syn-keyword { color: #c586c0; }
                .syn-number { color: #b5cea8; }

                .tab-hint-popup {
                    position: absolute;
                    background: #0066ff;
                    color: #fff;
                    padding: 6px 14px;
                    border-radius: 6px;
                    font-family: var(--ce-font-mono);
                    font-size: 0.75rem;
                    pointer-events: none;
                    z-index: 1000;
                    display: none;
                    white-space: nowrap;
                    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.4);
                    left: 20px;
                    top: 8px;
                }

                .tab-hint-popup.show { display: block; }

                .tab-hint-popup kbd {
                    background: rgba(255,255,255,0.2);
                    padding: 1px 6px;
                    border-radius: 3px;
                    font-family: var(--ce-font-mono);
                    font-size: 0.7rem;
                    margin: 0 2px;
                }

                .preview-container {
                    flex: 1;
                    min-height: 420px;
                    background: #ffffff;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }

                .preview-iframe {
                    flex: 1;
                    width: 100%;
                    border: none;
                    background: #ffffff;
                    min-height: 380px;
                }

                .preview-title-bar {
                    padding: 8px 16px;
                    background: #f5f5f5;
                    border-top: 1px solid #e0e0e0;
                    font-family: var(--ce-font-mono);
                    font-size: 0.7rem;
                    color: #666;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .preview-title-bar::before {
                    content: '';
                    width: 8px;
                    height: 8px;
                    background: #39ff14;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .ce-fullscreen-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 999999;
                    background: #000;
                    display: none;
                    flex-direction: column;
                }

                .ce-fullscreen-overlay.show { display: flex; }

                .ce-fullscreen-bar {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 14px 20px;
                    background: rgba(10, 10, 15, 0.98);
                    border-bottom: 1px solid rgba(255, 0, 255, 0.3);
                }

                .ce-exit-fullscreen {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 28px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: #ff00ff;
                    font-family: var(--ce-font-display);
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .ce-exit-fullscreen:hover {
                    background: rgba(255, 0, 255, 0.1);
                    border-color: #ff00ff;
                }

                .ce-fullscreen-iframe {
                    flex: 1;
                    width: 100%;
                    border: none;
                    background: #fff;
                }

                @media (max-width: 900px) {
                    .workspace { grid-template-columns: 1fr; }
                }
            </style>

            <div class="workspace">
                <div class="panel">
                    <div class="panel-header">
                        <div class="panel-title">
                            <span>代码编辑器</span>
                        </div>
                        <div class="panel-actions">
                            <button class="panel-btn refresh-btn" title="刷新预览 (Ctrl+Enter)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M23 4v6h-6M1 20v-6h6"/>
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                                </svg>
                                <span>刷新</span>
                            </button>
                        </div>
                    </div>
                    <div class="editor-tip">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>推荐使用 Visual Studio Code 等专业编辑器，可以实现多文件、插件，更加完善。</span>
                    </div>
                    <div class="editor-container">
                        <div class="tab-hint-popup">按下 <kbd>Tab</kbd> 补全闭标签</div>
                        <pre class="syntax-layer"></pre>
                        <textarea class="code-editor" spellcheck="false"></textarea>
                    </div>
                </div>

                <div class="panel">
                    <div class="panel-header">
                        <div class="panel-title">
                            <span>实时预览</span>
                        </div>
                        <div class="panel-actions">
                            <button class="panel-btn fullscreen-btn" title="网页全屏">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
                                </svg>
                                <span>网页全屏</span>
                            </button>
                        </div>
                    </div>
                    <div class="preview-container">
                        <iframe class="preview-iframe"></iframe>
                        <div class="preview-title-bar">
                            <span class="preview-title-text">预览页面</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="ce-fullscreen-overlay">
                <div class="ce-fullscreen-bar">
                    <button class="ce-exit-fullscreen">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/>
                        </svg>
                        <span>退出预览网页全屏</span>
                    </button>
                </div>
                <iframe class="ce-fullscreen-iframe"></iframe>
            </div>
        `;

        this._editor = this.shadowRoot.querySelector('.code-editor');
        this._syntaxLayer = this.shadowRoot.querySelector('.syntax-layer');
        this._preview = this.shadowRoot.querySelector('.preview-iframe');
        this._previewTitle = this.shadowRoot.querySelector('.preview-title-text');
        this._refreshBtn = this.shadowRoot.querySelector('.refresh-btn');
        this._fullscreenBtn = this.shadowRoot.querySelector('.fullscreen-btn');
        this._fullscreenOverlay = this.shadowRoot.querySelector('.ce-fullscreen-overlay');
        this._fullscreenIframe = this.shadowRoot.querySelector('.ce-fullscreen-iframe');
        this._exitFullscreenBtn = this.shadowRoot.querySelector('.ce-exit-fullscreen');
        this._tabHintPopup = this.shadowRoot.querySelector('.tab-hint-popup');
        this._editorContainer = this.shadowRoot.querySelector('.editor-container');

        this._editor.value = defaultCode;
        this._debounceTimer = null;
        this._previewScrollTop = 0;
        this._fullscreenScrollTop = 0;
        this._easterEggShown = false;

        this._setupListeners();
        this._updateSyntax();
        this._updatePreviewTitle();
        setTimeout(() => this._runPreview(), 100);
    }

    _setupListeners() {
        this._editor.addEventListener('input', () => {
            if (this._editor.value.includes('250205')) {
                window.alert('Coding Land,2026TRAE创造力大赛作品，XT使用TRAE创作');
                this._editor.value = this._editor.value.replace('250205', '');
            }
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                this._runPreview();
                this._updatePreviewTitle();
            }, 300);
            this._updateTabHint();
            this._updateSyntax();
        });

        this._editor.addEventListener('scroll', () => {
            this._syntaxLayer.scrollTop = this._editor.scrollTop;
            this._syntaxLayer.scrollLeft = this._editor.scrollLeft;
        });

        this._editor.addEventListener('keydown', (e) => this._onKeydown(e));

        this._refreshBtn.addEventListener('click', () => {
            this._runPreview();
            this._updatePreviewTitle();
        });

        this._fullscreenBtn.addEventListener('click', () => this._enterFullscreen());
        this._exitFullscreenBtn.addEventListener('click', () => this._exitFullscreen());

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (!this._fullscreenOverlay.classList.contains('show')) return;
            this._exitFullscreen();
        });
    }

    _updatePreviewTitle() {
        const code = this._editor.value;
        const titleMatch = code.match(/<title>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '预览页面';
        this._previewTitle.textContent = title || '预览页面';
    }

    _enterFullscreen() {
        const navbar = document.querySelector('.navbar');
        const lessonNav = document.querySelector('.lesson-nav');
        if (navbar) navbar.style.display = 'none';
        if (lessonNav) lessonNav.style.display = 'none';
        document.body.style.overflow = 'hidden';

        this._fullscreenOverlay.classList.add('show');
        this._fullscreenIframe.srcdoc = this._preview.srcdoc;
    }

    _exitFullscreen() {
        const navbar = document.querySelector('.navbar');
        const lessonNav = document.querySelector('.lesson-nav');
        if (navbar) navbar.style.display = '';
        if (lessonNav) lessonNav.style.display = '';
        document.body.style.overflow = '';

        this._fullscreenOverlay.classList.remove('show');
    }

    _onKeydown(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this._runPreview();
            this._updatePreviewTitle();
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            this._handleEnter();
            this._updateTabHint();
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                this._unindent();
            } else {
                const tagInfo = this._getTagInfo();
                if (tagInfo) {
                    this._completeTag(tagInfo);
                } else {
                    this._indent();
                }
            }
            this._updateTabHint();
            return;
        }

        const openPairs = { '(': ')', '{': '}', '[': ']', '<': '>' };
        if (openPairs[e.key]) {
            e.preventDefault();
            this._autoClose(e.key, openPairs[e.key]);
            this._updateTabHint();
            return;
        }

        const closeChars = [')', '}', ']', '>'];
        if (closeChars.includes(e.key)) {
            const pos = this._editor.selectionStart;
            if (this._editor.selectionStart === this._editor.selectionEnd &&
                this._editor.value[pos] === e.key) {
                e.preventDefault();
                this._editor.selectionStart = this._editor.selectionEnd = pos + 1;
                this._editor.dispatchEvent(new Event('input'));
                return;
            }
        }

        if (e.key === 'Backspace') {
            const pos = this._editor.selectionStart;
            if (this._editor.selectionStart === this._editor.selectionEnd && pos > 0) {
                const pairs = { ')': '(', '}': '{', ']': '[', '>': '<' };
                const leftChar = this._editor.value[pos - 1];
                const rightChar = this._editor.value[pos];
                if (pairs[rightChar] && pairs[rightChar] === leftChar) {
                    e.preventDefault();
                    this._editor.value = this._editor.value.substring(0, pos - 1) + this._editor.value.substring(pos + 1);
                    this._editor.selectionStart = this._editor.selectionEnd = pos - 1;
                    this._editor.dispatchEvent(new Event('input'));
                    return;
                }
            }
        }
    }

    _autoClose(open, close) {
        const start = this._editor.selectionStart;
        const end = this._editor.selectionEnd;
        const value = this._editor.value;

        if (start !== end) {
            const selected = value.substring(start, end);
            this._editor.value = value.substring(0, start) + open + selected + close + value.substring(end);
            this._editor.selectionStart = start + 1;
            this._editor.selectionEnd = end + 1;
        } else {
            this._editor.value = value.substring(0, start) + open + close + value.substring(end);
            this._editor.selectionStart = this._editor.selectionEnd = start + 1;
        }
        this._editor.dispatchEvent(new Event('input'));
    }

    _handleEnter() {
        const start = this._editor.selectionStart;
        const end = this._editor.selectionEnd;
        const value = this._editor.value;

        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = value.substring(lineStart, start);
        const indentMatch = currentLine.match(/^[ \t]*/);
        const indent = indentMatch ? indentMatch[0] : '';

        const beforeCursor = value.substring(0, start);
        const afterCursor = value.substring(end);

        const containerTags = ['div', 'section', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'form', 'select', 'option', 'optgroup', 'button', 'a', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'footer', 'nav', 'main', 'article', 'aside', 'details', 'summary', 'dialog', 'fieldset', 'legend', 'label', 'figure', 'figcaption', 'blockquote', 'pre', 'code', 'em', 'strong', 'i', 'b', 'u', 's', 'sub', 'sup', 'mark', 'small', 'big', 'abbr', 'cite', 'dfn', 'kbd', 'samp', 'var', 'time', 'progress', 'meter', 'audio', 'video', 'canvas', 'map', 'area', 'object', 'param', 'picture', 'source', 'noscript', 'template', 'slot'];
        const selfClosingTags = ['input', 'br', 'hr', 'img', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];

        const beforeTagMatch = beforeCursor.match(/<([a-zA-Z][a-zA-Z0-9-]*)(\s[^<>]*)?>\s*$/);
        const afterTagMatch = afterCursor.match(/^\s*<\/([a-zA-Z][a-zA-Z0-9-]*)>/);

        if (beforeTagMatch && afterTagMatch && beforeTagMatch[1].toLowerCase() === afterTagMatch[1].toLowerCase()) {
            const tagName = beforeTagMatch[1];
            if (!selfClosingTags.includes(tagName.toLowerCase())) {
                const currentLineIsEmpty = /^\s*$/.test(currentLine);
                let newIndent;
                if (currentLineIsEmpty) {
                    newIndent = indent;
                } else {
                    const beforeTagLine = beforeCursor.substring(0, beforeCursor.lastIndexOf('\n') + 1);
                    const tagIndentMatch = beforeTagLine.match(/^[ \t]*/);
                    const tagIndent = tagIndentMatch ? tagIndentMatch[0] : '';
                    newIndent = tagIndent + '    ';
                }
                const newValue = value.substring(0, start) + '\n' + newIndent + value.substring(end);
                this._editor.value = newValue;
                const cursorPos = start + 1 + newIndent.length;
                this._editor.selectionStart = this._editor.selectionEnd = cursorPos;
                this._editor.dispatchEvent(new Event('input'));
                return;
            }
        }

        const startTagMatch = beforeCursor.match(/<([a-zA-Z][a-zA-Z0-9-]*)(\s[^<>]*)?>\s*$/);
        if (startTagMatch && containerTags.includes(startTagMatch[1].toLowerCase())) {
            const tagName = startTagMatch[1];
            const currentLineIsEmpty = /^\s*$/.test(currentLine);
            let newIndent;
            if (currentLineIsEmpty) {
                newIndent = indent;
            } else {
                const beforeTagLine = beforeCursor.substring(0, beforeCursor.lastIndexOf('\n') + 1);
                const tagIndentMatch = beforeTagLine.match(/^[ \t]*/);
                const tagIndent = tagIndentMatch ? tagIndentMatch[0] : '';
                newIndent = tagIndent + '    ';
            }
            const closeTag = '</' + tagName + '>';
            const newValue = value.substring(0, start) + '\n' + newIndent + '\n' + indent + closeTag + value.substring(end);
            this._editor.value = newValue;
            const cursorPos = start + 1 + newIndent.length;
            this._editor.selectionStart = this._editor.selectionEnd = cursorPos;
            this._editor.dispatchEvent(new Event('input'));
            return;
        }

        const newValue = value.substring(0, start) + '\n' + indent + value.substring(end);
        this._editor.value = newValue;
        const cursorPos = start + 1 + indent.length;
        this._editor.selectionStart = this._editor.selectionEnd = cursorPos;
        this._editor.dispatchEvent(new Event('input'));
    }

    _getTagInfo() {
        const pos = this._editor.selectionStart;
        if (pos !== this._editor.selectionEnd) return null;
        const value = this._editor.value;

        let left, right, cursorInside;

        if (pos > 0 && value[pos - 1] === '>') {
            right = pos - 1;
            cursorInside = false;
        } else if (pos < value.length && value[pos] === '>') {
            right = pos;
            cursorInside = true;
        } else {
            let r = pos;
            while (r < value.length && value[r] !== '>' && value[r] !== '<') r++;
            if (r < value.length && value[r] === '>') {
                right = r;
                cursorInside = true;
            } else {
                return null;
            }
        }

        left = right - 1;
        while (left >= 0 && value[left] !== '<' && value[left] !== '>') left--;
        if (left < 0 || value[left] !== '<') return null;

        const inside = value.substring(left + 1, right);
        const tagMatch = inside.match(/^([a-zA-Z][a-zA-Z0-9-]*)(\s.*)?$/);
        if (!tagMatch) return null;

        const tagName = tagMatch[1];
        const selfClosing = ['input', 'br', 'hr', 'img', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
        if (selfClosing.includes(tagName.toLowerCase())) return null;
        if (inside.trim().endsWith('/')) return null;

        return { tagName, left, right, cursorInside };
    }

    _updateTabHint() {
        const tagInfo = this._getTagInfo();
        if (!tagInfo) {
            this._tabHintPopup.classList.remove('show');
            return;
        }

        this._tabHintPopup.innerHTML = '按下 <kbd>Tab</kbd> 补全 <code>&lt;/' + tagInfo.tagName + '&gt;</code>';
        this._tabHintPopup.classList.add('show');
    }

    _completeTag(tagInfo) {
        const value = this._editor.value;
        const insertPos = tagInfo.right + 1;
        const afterClose = value.substring(insertPos);
        const closeRegex = new RegExp('^</' + tagInfo.tagName + '>', 'i');
        if (closeRegex.test(afterClose)) {
            this._editor.selectionStart = this._editor.selectionEnd = insertPos;
            this._editor.dispatchEvent(new Event('input'));
            return;
        }

        const insertText = '</' + tagInfo.tagName + '>';
        this._editor.value = value.substring(0, insertPos) + insertText + value.substring(insertPos);
        this._editor.selectionStart = this._editor.selectionEnd = insertPos;

        // 显示补全成功提示，1.5秒后消失
        this._tabHintPopup.innerHTML = '<span style="color: #39ff14;">✓ 已补全</span> <code>&lt;/' + tagInfo.tagName + '&gt;</code>';
        this._tabHintPopup.classList.add('show');
        this._tabHintPopup.style.background = '#1a4a1a';
        setTimeout(() => {
            this._tabHintPopup.classList.remove('show');
            this._tabHintPopup.style.background = '#0066ff';
        }, 1500);

        this._editor.dispatchEvent(new Event('input'));
    }

    _indent() {
        const start = this._editor.selectionStart;
        const end = this._editor.selectionEnd;
        const value = this._editor.value;

        if (start === end) {
            this._editor.value = value.substring(0, start) + '    ' + value.substring(end);
            this._editor.selectionStart = this._editor.selectionEnd = start + 4;
        } else {
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const before = value.substring(0, lineStart);
            const middle = value.substring(lineStart, end);
            const after = value.substring(end);
            const indented = middle.replace(/^/gm, '    ');
            this._editor.value = before + indented + after;
            this._editor.selectionStart = lineStart;
            this._editor.selectionEnd = lineStart + indented.length;
        }
        this._editor.dispatchEvent(new Event('input'));
    }

    _unindent() {
        const start = this._editor.selectionStart;
        const end = this._editor.selectionEnd;
        const value = this._editor.value;

        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const before = value.substring(0, lineStart);
        const middle = value.substring(lineStart, end);
        const after = value.substring(end);
        const unindented = middle.replace(/^    /gm, '');
        this._editor.value = before + unindented + after;
        this._editor.selectionStart = lineStart;
        this._editor.selectionEnd = lineStart + unindented.length;
        this._editor.dispatchEvent(new Event('input'));
    }

    _runPreview() {
        if (this._preview.contentWindow) {
            this._previewScrollTop = this._preview.contentWindow.scrollY || 0;
        }
        CL_Common.runPreview(this._editor.value, this._preview);
        if (this._fullscreenOverlay.classList.contains('show')) {
            CL_Common.runPreview(this._editor.value, this._fullscreenIframe);
        }
        if (this._preview.contentWindow) {
            this._preview.contentWindow.scrollTo(0, this._previewScrollTop);
        }
    }

    _highlight(code) {
        const escapeHtml = (s) => s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const patterns = [
            { type: 'comment', re: /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\n]*/ },
            { type: 'string', re: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/ },
            { type: 'tag', re: /<\/?[a-zA-Z][\w-]*/ },
            { type: 'tagend', re: /\/?>/ },
            { type: 'attr', re: /[a-zA-Z-]+(?=\s*=)/ },
            { type: 'keyword', re: /\b(?:var|let|const|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|super|try|catch|finally|throw|typeof|instanceof|in|of|void|delete|import|export|from|as|async|await|yield|static|get|set|default|true|false|null|undefined|NaN)\b/ },
            { type: 'number', re: /\b\d+\.?\d*(?:e[+-]?\d+)?\b/i },
        ];

        const combined = new RegExp(
            patterns.map(p => '(' + p.re.source + ')').join('|'),
            'g'
        );

        let result = '';
        let lastIndex = 0;
        let match;

        while ((match = combined.exec(code)) !== null) {
            result += escapeHtml(code.substring(lastIndex, match.index));
            for (let i = 0; i < patterns.length; i++) {
                if (match[i + 1] !== undefined) {
                    result += '<span class="syn-' + patterns[i].type + '">' + escapeHtml(match[0]) + '</span>';
                    break;
                }
            }
            lastIndex = combined.lastIndex;
        }
        result += escapeHtml(code.substring(lastIndex));

        return result;
    }

    _updateSyntax() {
        this._syntaxLayer.innerHTML = this._highlight(this._editor.value);
    }

    getValue() {
        return this._editor.value;
    }

    setValue(val) {
        this._editor.value = val;
        this._updateSyntax();
        this._runPreview();
        this._updatePreviewTitle();
    }
}

customElements.define('code-editor', CodeEditor);
