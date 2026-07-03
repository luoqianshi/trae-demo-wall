let wasmReady = false;
let wasmError = null;
let parse_docx = null;

async function initWasm() {
    try {
        const mod = await import('./pkg/offdiff.js');
        await mod.default();
        parse_docx = mod.parse_docx;
        wasmReady = true;
    } catch (e) {
        console.error('Wasm initialization failed:', e);
        wasmError = e.message || '未知错误';
    }
}

initWasm();

const sampleData = {
    metadata: {
        paragraph_count: 9
    },
    paragraphs: [
        {
            index: 0,
            content: "OffDiff 演示文档",
            style: {
                style_name: "Heading1",
                alignment: "center",
                runs: [
                    {
                        text: "OffDiff 演示文档",
                        style: {
                            bold: true,
                            font_size: "32",
                            font_name: "Calibri"
                        }
                    }
                ]
            }
        },
        {
            index: 1,
            content: "这是一个用于演示 OffDiff 解析能力的示例文档。",
            style: {
                runs: [
                    {
                        text: "这是一个用于演示 OffDiff 解析能力的示例文档。",
                        style: {
                            font_size: "22",
                            font_name: "Calibri"
                        }
                    }
                ]
            }
        },
        {
            index: 2,
            content: "OffDiff 支持提取以下格式信息：",
            style: {
                runs: [
                    {
                        text: "OffDiff 支持提取以下格式信息：",
                        style: {
                            font_size: "22",
                            font_name: "Calibri"
                        }
                    }
                ]
            }
        },
        {
            index: 3,
            content: "• 粗体文本  • 斜体文本  • 带下划线的文本",
            style: {
                runs: [
                    { text: "• 粗体文本", style: { bold: true, font_size: "22", font_name: "Calibri" } },
                    { text: "  ", style: { font_size: "22", font_name: "Calibri" } },
                    { text: "• 斜体文本", style: { italic: true, font_size: "22", font_name: "Calibri" } },
                    { text: "  ", style: { font_size: "22", font_name: "Calibri" } },
                    { text: "• 带下划线的文本", style: { underline: true, font_size: "22", font_name: "Calibri" } }
                ]
            }
        },
        {
            index: 4,
            content: "同时支持多种格式的混合使用，比如粗体加斜体加不同字体。",
            style: {
                runs: [
                    { text: "同时支持多种格式的", style: { font_size: "22", font_name: "Calibri" } },
                    { text: "混合使用", style: { bold: true, italic: true, font_size: "24", font_name: "Georgia" } },
                    { text: "，比如粗体加斜体加不同字体。", style: { font_size: "22", font_name: "Calibri" } }
                ]
            }
        },
        {
            index: 5,
            content: "段落样式也会被提取，例如标题样式、对齐方式和缩进等。",
            style: {
                runs: [
                    {
                        text: "段落样式也会被提取，例如标题样式、对齐方式和缩进等。",
                        style: { font_size: "22", font_name: "Calibri" }
                    }
                ]
            }
        },
        {
            index: 6,
            content: "右对齐的段落示例",
            style: {
                alignment: "right",
                runs: [
                    {
                        text: "右对齐的段落示例",
                        style: { font_size: "22", font_name: "Calibri" }
                    }
                ]
            }
        },
        {
            index: 7,
            content: "",
            style: {
                runs: [
                    { text: "", style: { font_size: "22", font_name: "Calibri" } }
                ]
            }
        },
        {
            index: 8,
            content: "—— OffDiff 团队",
            style: {
                runs: [
                    {
                        text: "—— OffDiff 团队",
                        style: { font_size: "22", font_name: "Calibri" }
                    }
                ]
            }
        }
    ]
};

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const sampleBtn = document.getElementById('sampleBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const resetBtn = document.getElementById('resetBtn');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('errorBox');
const errorMessage = document.getElementById('errorMessage');
const resultSection = document.getElementById('resultSection');
const visualContent = document.getElementById('visualContent');
const jsonContent = document.getElementById('jsonContent');
const paraCount = document.getElementById('paraCount');
const styleCount = document.getElementById('styleCount');
const copyJsonBtn = document.getElementById('copyJsonBtn');

const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

browseBtn.addEventListener('click', () => fileInput.click());
sampleBtn.addEventListener('click', showSampleData);
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

resetBtn.addEventListener('click', () => {
    fileInfo.style.display = 'none';
    resultSection.style.display = 'none';
    errorBox.style.display = 'none';
    fileInput.value = '';
});

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tab + 'Tab').classList.add('active');
    });
});

copyJsonBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonContent.textContent).then(() => {
        const originalText = copyJsonBtn.textContent;
        copyJsonBtn.textContent = '已复制！';
        setTimeout(() => {
            copyJsonBtn.textContent = originalText;
        }, 2000);
    });
});

function handleFile(file) {
    errorBox.style.display = 'none';
    resultSection.style.display = 'none';

    if (!file.name.toLowerCase().endsWith('.docx')) {
        showError('请上传 .docx 格式的文件。');
        return;
    }

    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'flex';

    loading.style.display = 'flex';

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            if (!wasmReady) {
                await new Promise(resolve => {
                    const check = setInterval(() => {
                        if (wasmReady) {
                            clearInterval(check);
                            resolve();
                        }
                    }, 100);
                });
            }

            const data = new Uint8Array(e.target.result);
            const result = parse_docx(data);
            displayResult(result);
        } catch (err) {
            showError(err.message || '解析过程中发生错误。');
        } finally {
            loading.style.display = 'none';
        }
    };
    reader.onerror = () => {
        loading.style.display = 'none';
        showError('文件读取失败。');
    };
    reader.readAsArrayBuffer(file);
}

function displayResult(doc) {
    paraCount.textContent = doc.metadata.paragraph_count;

    const styleNames = new Set();
    doc.paragraphs.forEach(p => {
        if (p.style?.style_name) {
            styleNames.add(p.style.style_name);
        }
    });
    styleCount.textContent = styleNames.size;

    renderVisual(doc);
    renderJson(doc);

    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderVisual(doc) {
    visualContent.innerHTML = '';

    if (doc.paragraphs.length === 0) {
        visualContent.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 40px;">文档为空</p>';
        return;
    }

    doc.paragraphs.forEach(para => {
        const div = document.createElement('div');
        div.className = 'doc-paragraph';

        const isHeading = para.style?.style_name?.toLowerCase().includes('heading');
        if (isHeading) {
            div.classList.add('heading');
        }

        const indexEl = document.createElement('div');
        indexEl.className = 'para-index';
        indexEl.textContent = `#${para.index}`;
        div.appendChild(indexEl);

        const contentEl = document.createElement('div');
        contentEl.className = 'para-content';

        if (para.style?.runs && para.style.runs.length > 0) {
            para.style.runs.forEach(run => {
                const span = document.createElement('span');
                span.textContent = run.text;
                if (run.style?.bold) {
                    span.style.fontWeight = 'bold';
                }
                if (run.style?.italic) {
                    span.style.fontStyle = 'italic';
                }
                if (run.style?.underline) {
                    span.style.textDecoration = 'underline';
                }
                if (run.style?.font_size) {
                    const sizePt = parseInt(run.style.font_size) / 2;
                    span.style.fontSize = sizePt + 'pt';
                }
                if (run.style?.font_name) {
                    span.style.fontFamily = run.style.font_name;
                }
                contentEl.appendChild(span);
            });
        } else {
            contentEl.textContent = para.content || '(空段落)';
        }

        if (para.style?.alignment === 'center') {
            contentEl.style.textAlign = 'center';
        } else if (para.style?.alignment === 'right') {
            contentEl.style.textAlign = 'right';
        }

        if (isHeading) {
            contentEl.style.fontSize = '1.25em';
            contentEl.style.fontWeight = '600';
        }

        div.appendChild(contentEl);

        const metaEl = document.createElement('div');
        metaEl.className = 'para-meta';

        if (para.style?.style_name) {
            const tag = document.createElement('span');
            tag.className = 'meta-tag style';
            tag.textContent = '样式: ' + para.style.style_name;
            metaEl.appendChild(tag);
        }

        if (para.style?.alignment) {
            const tag = document.createElement('span');
            tag.className = 'meta-tag';
            tag.textContent = '对齐: ' + para.style.alignment;
            metaEl.appendChild(tag);
        }

        const runCount = para.style?.runs?.length || 0;
        if (runCount > 0) {
            const tag = document.createElement('span');
            tag.className = 'meta-tag';
            tag.textContent = 'Runs: ' + runCount;
            metaEl.appendChild(tag);
        }

        if (para.style?.indentation) {
            const parts = [];
            if (para.style.indentation.left) parts.push('左' + para.style.indentation.left);
            if (para.style.indentation.right) parts.push('右' + para.style.indentation.right);
            if (para.style.indentation.first_line) parts.push('首行' + para.style.indentation.first_line);
            if (parts.length > 0) {
                const tag = document.createElement('span');
                tag.className = 'meta-tag';
                tag.textContent = '缩进: ' + parts.join(', ');
                metaEl.appendChild(tag);
            }
        }

        if (metaEl.children.length > 0) {
            div.appendChild(metaEl);
        }

        visualContent.appendChild(div);
    });
}

function renderJson(doc) {
    jsonContent.textContent = JSON.stringify(doc, null, 2);
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorBox.style.display = 'block';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showSampleData() {
    errorBox.style.display = 'none';
    fileInfo.style.display = 'none';
    displayResult(sampleData);
}
