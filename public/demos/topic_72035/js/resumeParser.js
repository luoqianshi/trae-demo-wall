// ============================================
// Resume Parser — PDF / Word / Image OCR
// ============================================

const ResumeParser = {
  // Set PDF.js worker path
  _pdfjsReady: false,

  _initPDFJS() {
    if (this._pdfjsReady) return;
    if (window.pdfjsLib) {
      // Use CDN worker matching the library version
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      this._pdfjsReady = true;
    }
  },

  // Main entry: detect file type and parse
  async parse(file, onProgress) {
    if (!file) throw new Error('未选择文件');

    const name = file.name.toLowerCase();
    let fileType = 'unknown';

    if (name.endsWith('.pdf')) {
      fileType = 'pdf';
    } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
      fileType = 'word';
    } else if (name.match(/\.(jpg|jpeg|png|bmp|webp)$/)) {
      fileType = 'image';
    } else if (name.endsWith('.txt')) {
      fileType = 'text';
    } else {
      throw new Error('不支持的文件格式，请上传 PDF、Word 或图片文件');
    }

    let text = '';

    switch (fileType) {
      case 'pdf':
        text = await this.parsePDF(file, onProgress);
        break;
      case 'word':
        text = await this.parseWord(file, onProgress);
        break;
      case 'image':
        text = await this.parseImage(file, onProgress);
        break;
      case 'text':
        text = await file.text();
        break;
    }

    if (!text || text.trim().length < 10) {
      throw new Error('提取到的文本内容过少，可能是扫描件或图片质量不佳。建议使用文字版 PDF。');
    }

    return { text: text.trim(), fileName: file.name, fileType };
  },

  // Parse PDF using PDF.js
  async parsePDF(file, onProgress) {
    this._initPDFJS();
    if (!window.pdfjsLib) throw new Error('PDF.js 未加载，请刷新页面重试');

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      if (onProgress) {
        onProgress({
          stage: 'pdf',
          current: i,
          total: numPages,
          message: `正在解析 PDF 第 ${i}/${numPages} 页...`,
        });
      }

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Reconstruct text with proper line breaks
      let lastY = null;
      let pageText = '';

      for (const item of textContent.items) {
        if (item.str === ' ') continue;
        const y = item.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          pageText += '\n';
        } else if (pageText && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = y;
      }

      fullText += pageText + '\n\n';
    }

    return fullText;
  },

  // Parse Word document using mammoth.js
  async parseWord(file, onProgress) {
    if (!window.mammoth) throw new Error('mammoth.js 未加载，请刷新页面重试');

    if (onProgress) {
      onProgress({
        stage: 'word',
        message: '正在解析 Word 文档...',
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
  },

  // Parse image using Tesseract.js OCR
  async parseImage(file, onProgress) {
    if (!window.Tesseract) throw new Error('Tesseract.js 未加载，请刷新页面重试');

    if (onProgress) {
      onProgress({
        stage: 'ocr-init',
        message: '正在初始化 OCR 引擎（首次使用需下载语言包，请耐心等待）...',
      });
    }

    const worker = await window.Tesseract.createWorker('chi_sim+eng', 1, {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress({
            stage: 'ocr',
            progress: m.progress,
            message: `正在识别文字... ${Math.round(m.progress * 100)}%`,
          });
        }
      },
    });

    const { data } = await worker.recognize(file);
    await worker.terminate();

    return data.text;
  },
};
