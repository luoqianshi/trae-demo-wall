/**
 * utils.js - 工具函数模块
 */
const Utils = {
  /**
   * Extract birth date from 18-digit ID card
   * @param {string} idCard - 18-character ID card number
   * @returns {string} birth date in "YYYY-MM-DD" format, or empty string
   */
  extractBirthDate(idCard) {
    if (!idCard || idCard.length !== 18) return '';
    const year = idCard.substring(6, 10);
    const month = idCard.substring(10, 12);
    const day = idCard.substring(12, 14);
    return `${year}-${month}-${day}`;
  },

  /**
   * Extract gender from ID card
   * @param {string} idCard - 18-character ID card number
   * @returns {string} 'male' or 'female'
   */
  extractGender(idCard) {
    if (!idCard || idCard.length !== 18) return 'male';
    // The 17th character (index 16) represents gender: odd = male, even = female
    const genderCode = parseInt(idCard.charAt(16), 10);
    return genderCode % 2 === 1 ? 'male' : 'female';
  },

  /**
   * Calculate age from birth date string "YYYY-MM-DD"
   * @param {string} birthDate - birth date string
   * @returns {number} calculated age in years
   */
  calculateAge(birthDate) {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    // If birthday hasn't occurred yet this year, subtract 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  },

  /**
   * Format date string for display
   * @param {string} dateStr - date string (YYYY-MM-DD or ISO format)
   * @returns {string} formatted date "YYYY年MM月DD日"
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    // Handle ISO datetime strings by taking just the date portion
    const datePart = dateStr.substring(0, 10);
    const parts = datePart.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${year}年${month}月${day}日`;
  },

  /**
   * Get relationship display text from key
   * @param {string} key - relationship key
   * @returns {string} Chinese display text
   */
  getRelationshipText(key) {
    const map = {
      father: '父亲',
      mother: '母亲',
      spouse: '配偶',
      son: '儿子',
      daughter: '女儿',
      grandfather: '祖父',
      grandmother: '祖母',
      other: '其他',
      self: '本人'
    };
    return map[key] || key || '未知';
  },

  /**
   * Get blood type display text
   * @param {string} type - blood type key
   * @returns {string} Chinese display text
   */
  getBloodTypeText(type) {
    const map = {
      A: 'A型',
      B: 'B型',
      AB: 'AB型',
      O: 'O型',
      unknown: '未知'
    };
    return map[type] || type || '未知';
  },

  /**
   * Get treatment type display text
   * @param {string} key - treatment type key
   * @returns {string} Chinese display text
   */
  getTreatmentTypeText(key) {
    const map = {
      medication: '药物治疗',
      physical: '物理治疗',
      surgery: '手术治疗',
      tcm: '中医治疗',
      rehabilitation: '康复训练',
      psychological: '心理治疗',
      other: '其他'
    };
    return map[key] || key || '未知';
  },

  /**
   * Generate unique ID
   * @param {string} prefix - prefix for the ID
   * @returns {string} unique id string
   */
  generateId(prefix) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}_${timestamp}_${random}`;
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} str - string to escape
   * @returns {string} escaped string
   */
  escapeHtml(str) {
    if (!str) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(str).replace(/[&<>"']/g, (m) => map[m]);
  },

  /**
   * Re-render a page module by triggering hashchange
   * @param {Object} pageModule - page module to re-render
   */
  render(pageModule) {
    if (pageModule && typeof pageModule.render === 'function') {
      const app = document.getElementById('app');
      if (app) {
        app.innerHTML = pageModule.render();
        if (typeof pageModule.init === 'function') {
          pageModule.init();
        }
      }
    }
  },

  /**
   * Debounce function
   * @param {Function} fn - function to debounce
   * @param {number} delay - delay in milliseconds
   * @returns {Function} debounced function
   */
  debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, delay);
    };
  },

  /**
   * Get today's date as "YYYY-MM-DD"
   * @returns {string} today's date
   */
  getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Validate ID card format (basic 18-digit check)
   * @param {string} idCard - ID card number to validate
   * @returns {boolean} true if valid format
   */
  isValidIdCard(idCard) {
    if (!idCard) return false;
    // Basic check: 18 characters, all digits except last can be X
    const pattern = /^\d{17}[\dXx]$/;
    if (!pattern.test(idCard)) return false;
    // Additional check: validate the date portion (characters 7-14)
    const dateStr = idCard.substring(6, 14);
    const date = new Date(dateStr.substring(0, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8));
    if (isNaN(date.getTime())) return false;
    return true;
  },

};
