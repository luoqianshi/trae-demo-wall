/**
 * File Parser — 文件解析模块
 *
 * Supports: PDF, Word (.docx), Images (PNG/JPG), LaTeX, Markdown, TXT
 * Uses: pdf.js, mammoth.js
 */

const FileParser = {

    // Supported file types
    supportedTypes: {
        'application/pdf': { ext: 'pdf', label: 'PDF', icon: 'pdf' },
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', label: 'Word', icon: 'doc' },
        'application/msword': { ext: 'doc', label: 'Word', icon: 'doc' },
        'image/png': { ext: 'png', label: 'Image', icon: 'img' },
        'image/jpeg': { ext: 'jpg', label: 'Image', icon: 'img' },
        'image/jpg': { ext: 'jpg', label: 'Image', icon: 'img' },
        'image/webp': { ext: 'webp', label: 'Image', icon: 'img' },
        'application/x-tex': { ext: 'tex', label: 'LaTeX', icon: 'tex' },
        'text/markdown': { ext: 'md', label: 'Markdown', icon: 'md' },
        'text/plain': { ext: 'txt', label: 'Text', icon: 'txt' },
        'text/x-tex': { ext: 'tex', label: 'LaTeX', icon: 'tex' }
    },

    // Extension to type mapping (for fallback)
    extToType: {
        'pdf': 'pdf',
        'docx': 'docx',
        'doc': 'doc',
        'png': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'webp': 'image',
        'tex': 'text',
        'md': 'text',
        'txt': 'text'
    },

    /**
     * Parse a single file and return its text content
     * @param {File} file - The file to parse
     * @returns {Promise<{text: string, type: string, images?: string[]}>}
     */
    async parse(file) {
        const fileType = this.getFileType(file);

        switch (fileType) {
            case 'pdf':
                return await this.parsePDF(file);
            case 'docx':
            case 'doc':
                return await this.parseWord(file);
            case 'image':
                return await this.parseImage(file);
            case 'text':
                return await this.parseText(file);
            default:
                // Try to infer from extension
                const ext = this.getExtension(file.name);
                if (['md', 'tex', 'txt'].includes(ext)) {
                    return await this.parseText(file);
                }
                throw new Error(`不支持的文件类型：${file.name}`);
        }
    },

    /**
     * Parse multiple files and combine results
     */
    async parseMultiple(files) {
        const results = [];
        for (const file of files) {
            try {
                const result = await this.parse(file);
                results.push({ file: file.name, ...result, success: true });
            } catch (error) {
                results.push({ file: file.name, text: '', success: false, error: error.message });
            }
        }
        return results;
    },

    /**
     * Parse PDF file using pdf.js
     */
    async parsePDF(file) {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF解析库未加载，请刷新页面重试');
        }

        // Set worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        const images = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Reconstruct text from text items
            let pageText = '';
            let lastY = null;

            for (const item of textContent.items) {
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                    pageText += '\n';
                }
                pageText += item.str;
                if (item.hasEOL) {
                    pageText += '\n';
                }
                lastY = item.transform[5];
            }

            fullText += `\n--- 第${i}页 ---\n${pageText}\n`;
        }

        return { text: fullText.trim(), type: 'pdf' };
    },

    /**
     * Parse Word file using mammoth.js
     */
    async parseWord(file) {
        if (typeof mammoth === 'undefined') {
            throw new Error('Word解析库未加载，请刷新页面重试');
        }

        const arrayBuffer = await file.arrayBuffer();

        // Extract both raw text and HTML
        const rawResult = await mammoth.extractRawText({ arrayBuffer });
        let text = rawResult.value;

        // Clean up text
        text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

        return { text, type: 'word' };
    },

    /**
     * Parse image file — convert to base64 for vision API
     */
    async parseImage(file) {
        const dataUrl = await this.fileToDataUrl(file);

        // For images, we return the data URL and a note
        // The API client will handle sending this to the vision model
        return {
            text: `[图片文件：${file.name}，需要视觉识别]`,
            type: 'image',
            image: dataUrl,
            imageName: file.name
        };
    },

    /**
     * Parse text file (LaTeX, Markdown, TXT)
     */
    async parseText(file) {
        const text = await file.text();
        return { text: text.trim(), type: this.getExtension(file.name) };
    },

    /**
     * Convert file to base64 data URL
     */
    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Get file type from file object
     */
    getFileType(file) {
        // Check MIME type first
        if (file.type) {
            for (const [mimeType, info] of Object.entries(this.supportedTypes)) {
                if (file.type === mimeType) {
                    return info.ext === 'png' || info.ext === 'jpg' || info.ext === 'webp' ? 'image' : info.ext;
                }
            }
        }

        // Fallback to extension
        const ext = this.getExtension(file.name);
        return this.extToType[ext] || 'unknown';
    },

    /**
     * Get file extension
     */
    getExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    },

    /**
     * Get file icon class
     */
    getIconClass(file) {
        const ext = this.getExtension(file.name);
        if (ext === 'pdf') return 'pdf';
        if (['docx', 'doc'].includes(ext)) return 'doc';
        if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'img';
        if (ext === 'tex') return 'tex';
        if (ext === 'md') return 'md';
        return 'txt';
    },

    /**
     * Format file size
     */
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    /**
     * Check if file is supported
     */
    isSupported(file) {
        const type = this.getFileType(file);
        return type !== 'unknown';
    },

    /**
     * Get accepted file extensions string
     */
    getAcceptString() {
        return '.pdf,.docx,.doc,.png,.jpg,.jpeg,.tex,.md,.txt';
    }
};

// Export
window.FileParser = FileParser;
