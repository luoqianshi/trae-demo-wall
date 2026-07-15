/**
 * FileParser - 文件解析模块
 * Demo阶段仅支持Word(.docx)文件解析，使用mammoth.js
 */

class FileParser {
  constructor() {
    this.supportedExtensions = ['.docx'];
    this.parsers = {
      '.docx': this._parseDocx.bind(this)
    };
  }

  /**
   * 检查文件是否支持解析
   */
  isSupported(fileName) {
    const ext = this._getExtension(fileName);
    return this.supportedExtensions.includes(ext);
  }

  /**
   * 解析文件，返回文本内容
   * @param {File} file - 用户上传的文件
   * @returns {Promise<{name: string, content: string, size: number}>}
   */
  async parse(file) {
    const ext = this._getExtension(file.name);

    if (!this.isSupported(file.name)) {
      const supported = this.supportedExtensions.join('、');
      throw new Error(
        `暂不支持 "${ext}" 格式的文件。Demo阶段仅支持 ${supported} 格式。\n` +
        `PDF、PPT、图片等格式将在后续版本中支持。`
      );
    }

    const parser = this.parsers[ext];
    if (!parser) {
      throw new Error(`找不到 "${ext}" 格式的解析器`);
    }

    const content = await parser(file);
    return {
      name: file.name,
      content: content,
      size: file.size
    };
  }

  /**
   * 解析 .docx 文件（使用 mammoth.js）
   */
  async _parseDocx(file) {
    // 动态加载 mammoth.js
    if (typeof mammoth === 'undefined') {
      await this._loadMammoth();
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (err) {
          reject(new Error(`Word文件解析失败：${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 动态加载 mammoth.js CDN
   */
  async _loadMammoth() {
    return new Promise((resolve, reject) => {
      if (typeof mammoth !== 'undefined') {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('mammoth.js 加载失败，请检查网络连接'));
      document.head.appendChild(script);
    });
  }

  /**
   * 获取文件扩展名
   */
  _getExtension(fileName) {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) return '';
    return fileName.substring(lastDot).toLowerCase();
  }

  /**
   * 格式化文件大小
   */
  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

// 暴露到全局
window.FileParser = FileParser;