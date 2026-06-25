/**
 * PRD生成模块 - 负责PRD文档的生成、格式化和导出
 */

class PRDGenerator {
  /**
   * 生成PRD文件名
   */
  static generateFileName(pageName) {
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');

    const name = pageName || '未命名页面';
    return `${name}PRD文档_${timestamp}.md`;
  }

  /**
   * 格式化时间为可读字符串
   */
  static formatTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  /**
   * 导出MD文件
   */
  static exportMarkdown(content, fileName) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: fileName,
      saveAs: false,
    }, (downloadId) => {
      URL.revokeObjectURL(url);
      if (chrome.runtime.lastError) {
        console.error('下载失败:', chrome.runtime.lastError.message);
      }
    });
  }

  /**
   * 从AI生成的内容中提取页面功能名
   */
  static extractPageName(content) {
    const match = content.match(/^#\s*【(.+?)】/m) || content.match(/^#\s*(.+?)产品需求文档/m) || content.match(/^#\s*(.+?)[\r\n]/m);
    return match ? match[1].trim() : '未命名页面';
  }

  /**
   * 验证PRD内容完整性
   */
  static validatePRD(content) {
    const requiredSections = [
      '功能概述',
      '页面信息',
      '核心功能列表',
      '操作流程说明',
      '页面元素说明',
      '业务规则',
      '异常场景',
      '功能优先级',
    ];

    const missing = [];
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        missing.push(section);
      }
    }

    return {
      isValid: missing.length === 0,
      missing,
    };
  }
}
