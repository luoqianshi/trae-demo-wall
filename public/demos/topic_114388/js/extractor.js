// extractor.js - 文档/图片重点提取器
// 支持：
//   - 纯文本 (.txt) / 大纲 (.md)
//   - PDF (.pdf) - 使用 pdf.js CDN
//   - Word (.docx) - 解析 docx 中的 <w:t> 文本
//   - 图片 (.png/.jpg) - 使用 Tesseract.js OCR
//   - 直接粘贴文本
// 提取策略：识别章节标题、关键名词、高频术语，返回结构化重点列表

const CDN_PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const CDN_TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

/* ================ 章节标题/重点模式 ================ */
// 匹配"第X章 第X节 X.X X"等典型标题
const SECTION_PATTERNS = [
    /^\s*第\s*[一二三四五六七八九十百零\d]+\s*章[、\.\s]*(.{0,60})$/,
    /^\s*第\s*[一二三四五六七八九十百零\d]+\s*节[、\.\s]*(.{0,60})$/,
    /^\s*[一二三四五六七八九十百零\d]+[\.、\s]+(.{2,60})$/,
    /^\s*\d+(\.\d+)+[\.、\s]+(.{2,60})$/,
    /^\s*[（(]\s*[一二三四五六七八九十百零\d]+\s*[)）][\s]*(.{2,60})$/
];

/* ================ 关键术语启发式 ================ */
// 提取名词性短语（2-6 个汉字或带数字/字母的术语）
const KEYWORD_REGEX = /[\u4e00-\u9fa5]{2,6}(?:[A-Za-z0-9]+)?/g;
// 重点信号词
const SIGNAL_WORDS = ['重点', '难点', '关键', '核心', '必须', '掌握', '理解', '重点掌握', '考点', '常考', '高频', '重要', '基本', '基础'];
const SIGNAL_REGEX = new RegExp(`(${SIGNAL_WORDS.join('|')})[：:]?\\s*([\\u4e00-\\u9fa5A-Za-z0-9、，,\\s]{2,40})`, 'g');

/**
 * 智能去重（编辑距离简化的归一化 + 包含关系）
 */
function dedupePoints(items) {
    const seen = new Set();
    const result = [];
    for (const it of items) {
        const t = it.point.replace(/\s+/g, '').toLowerCase();
        if (!t || t.length < 2) continue;
        let dup = false;
        for (const s of seen) {
            if (s === t || s.includes(t) || t.includes(s)) { dup = true; break; }
        }
        if (!dup) {
            seen.add(t);
            result.push(it);
        }
    }
    return result;
}

/**
 * 从纯文本中抽取章节标题
 */
function extractSections(text) {
    const points = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
        const t = line.trim();
        if (!t || t.length > 80) continue;
        for (const pat of SECTION_PATTERNS) {
            const m = t.match(pat);
            if (m) {
                // 提取标题主体
                const title = (m[1] || t).replace(/[、\.\s]+$/, '').trim();
                if (title.length >= 2 && title.length <= 50) {
                    points.push({ point: title, source: '章节标题', confidence: 0.9 });
                }
                break;
            }
        }
    }
    return points;
}

/**
 * 从文本中抽取带"重点/难点"等信号词的短语
 */
function extractSignalPhrases(text) {
    const points = [];
    const matches = text.matchAll(SIGNAL_REGEX);
    for (const m of matches) {
        const phrase = m[2].split(/[、，,；;。\.\s]+/)[0].trim();
        if (phrase && phrase.length >= 2 && phrase.length <= 30) {
            points.push({ point: phrase, source: '重点信号', confidence: 0.85 });
        }
    }
    return points;
}

/**
 * 提取高频术语（排除"章节"、"思考"等常见词）
 */
const STOPWORDS = new Set([
    '我们', '你们', '他们', '这个', '那个', '一种', '这个', '可以', '应该', '就是',
    '因为', '所以', '如果', '但是', '然后', '现在', '已经', '还有', '也是', '不是',
    '可能', '需要', '问题', '答案', '练习', '习题', '作业', '本章', '本章', '课程',
    '教学', '学习', '学生', '教师', '老师', '例如', '比如', '方面', '部分', '内容',
    '同学', '大家', '由于', '因此', '其中', '相关', '其他', '一些', '所有', '比较',
    '非常', '这样', '那样', '怎样', '如何', '什么', '怎么', '哪里', '为什么', '多少'
]);
function extractKeywords(text, limit = 20) {
    const freq = new Map();
    const matches = text.matchAll(KEYWORD_REGEX);
    for (const m of matches) {
        const w = m[0];
        if (w.length < 2 || w.length > 8) continue;
        if (STOPWORDS.has(w)) continue;
        // 排除纯数字
        if (/^[\d.]+$/.test(w)) continue;
        freq.set(w, (freq.get(w) || 0) + 1);
    }
    return [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([w, c]) => ({ point: w, source: `高频术语(${c}次)`, confidence: Math.min(0.5 + c * 0.05, 0.8) }));
}

/**
 * 从纯文本提取重点（统一入口）
 */
export function extractFromText(text, opts = {}) {
    if (!text || typeof text !== 'string') return [];
    const sections = extractSections(text);
    const signals = extractSignalPhrases(text);
    const keywords = extractKeywords(text, opts.keywordLimit || 20);
    const merged = dedupePoints([...sections, ...signals, ...keywords]);
    // 按置信度排序
    merged.sort((a, b) => b.confidence - a.confidence);
    return merged;
}

/**
 * 加载 PDF 文本（用 pdf.js）
 */
async function loadPdfJs() {
    if (window.pdfjsLib) return window.pdfjsLib;
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = CDN_PDFJS;
        s.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
            resolve(window.pdfjsLib);
        };
        s.onerror = () => reject(new Error('PDF.js 加载失败'));
        document.head.appendChild(s);
    });
}

export async function extractFromPdf(file) {
    const pdfjs = await loadPdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(it => it.str || '');
        fullText += strings.join(' ') + '\n';
    }
    return { text: fullText, pages: pdf.numPages, source: 'PDF' };
}

/**
 * 解析 docx（docx 本质是 zip 包含 word/document.xml）
 * 直接用 JSZip 在浏览器里解压取 <w:t> 文本节点
 */
async function loadJSZip() {
    if (window.JSZip) return window.JSZip;
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        s.onload = () => resolve(window.JSZip);
        s.onerror = () => reject(new Error('JSZip 加载失败'));
        document.head.appendChild(s);
    });
}

export async function extractFromDocx(file) {
    const JSZip = await loadJSZip();
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('string');
    // 提取所有 <w:t>...</w:t> 文本，按段落切分
    const text = xml
        .replace(/<w:p[^>]*>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .trim();
    return { text, source: 'DOCX' };
}

/**
 * 图片 OCR（用 Tesseract.js）
 */
async function loadTesseract() {
    if (window.Tesseract) return window.Tesseract;
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = CDN_TESSERACT;
        s.onload = () => resolve(window.Tesseract);
        s.onerror = () => reject(new Error('Tesseract.js 加载失败'));
        document.head.appendChild(s);
    });
}

export async function extractFromImage(file, onProgress) {
    const Tesseract = await loadTesseract();
    const result = await Tesseract.recognize(file, 'chi_sim+eng', {
        logger: m => {
            if (onProgress && m.status === 'recognizing text') {
                onProgress(Math.round(m.progress * 100));
            }
        }
    });
    return { text: result.data.text, source: '图片OCR' };
}

/**
 * 统一入口：传入 File，根据扩展名/类型自动选择提取方式
 * @param {File} file
 * @param {Function} onProgress 进度回调 (0-100)
 */
export async function extractFromFile(file, onProgress) {
    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
        const { text, pages } = await extractFromPdf(file);
        return { text, meta: { type: 'PDF', pages } };
    }
    if (name.endsWith('.docx') || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { text } = await extractFromDocx(file);
        return { text, meta: { type: 'DOCX' } };
    }
    if (name.endsWith('.doc')) {
        throw new Error('暂不支持旧版 .doc，请另存为 .docx 后上传');
    }
    if (type.startsWith('image/') || /\.(png|jpg|jpeg|webp|bmp)$/.test(name)) {
        const { text } = await extractFromImage(file, onProgress);
        return { text, meta: { type: '图片OCR' } };
    }
    if (type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
        const text = await file.text();
        return { text, meta: { type: '文本' } };
    }
    throw new Error('不支持的文件类型：' + (type || name));
}
