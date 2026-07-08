const Utils = {
  parseUrlParams() {
    const params = {};
    const search = window.location.search.substring(1);
    const pairs = search.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      params[key] = decodeURIComponent(value || '');
    }
    return params;
  },

  getUrlParam(name) {
    return this.parseUrlParams()[name];
  },

  setUrlParam(name, value) {
    const params = this.parseUrlParams();
    params[name] = value;
    const search = new URLSearchParams(params).toString();
    window.history.pushState({}, '', `${window.location.pathname}?${search}`);
  },

  storage: {
    get(key, defaultValue = null) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch {
        return defaultValue;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },

    clear() {
      try {
        localStorage.clear();
        return true;
      } catch {
        return false;
      }
    }
  },

  animateNumber(element, targetValue, duration = 1000) {
    const startValue = 0;
    const startTime = performance.now();
    const isFloat = targetValue % 1 !== 0;
    const decimals = isFloat ? 1 : 0;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * easeOut;

      element.textContent = isFloat 
        ? currentValue.toFixed(decimals)
        : Math.floor(currentValue).toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = isFloat 
          ? targetValue.toFixed(decimals)
          : targetValue.toLocaleString();
      }
    };

    requestAnimationFrame(animate);
  },

  typeWriter(element, text, speed = 50, callback = null) {
    let index = 0;
    element.textContent = '';

    const type = () => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      } else if (callback) {
        callback();
      }
    };

    type();
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  randomDelay(min, max) {
    return Math.random() * (max - min) + min;
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  renderStars(rating, maxStars = 5) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let html = '';

    for (let i = 0; i < fullStars; i++) {
      html += '<svg class="w-4 h-4 text-amber-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
    }

    if (hasHalfStar && fullStars < maxStars) {
      html += '<svg class="w-4 h-4 text-amber-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="none"/></svg>';
    }

    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < maxStars; i++) {
      html += '<svg class="w-4 h-4 text-zinc-700" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
    }

    return html;
  },

  getCompanyLevel(trustScore) {
    if (trustScore >= 95) return { level: 'S', label: '超级企业', color: 'text-purple-400', bg: 'bg-purple-500/20' };
    if (trustScore >= 90) return { level: 'A', label: '金牌企业', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    if (trustScore >= 85) return { level: 'B', label: '银牌企业', color: 'text-zinc-400', bg: 'bg-zinc-500/20' };
    if (trustScore >= 80) return { level: 'C', label: '铜牌企业', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return { level: 'D', label: '新入驻', color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
  },

  getTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 30) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  },

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  },

  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  highlightText(text, keyword) {
    if (!keyword || !text) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-100 text-yellow-800 px-0.5 rounded">$1</mark>');
  },

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-zinc-800';
    
    toast.className = `${bgColor} text-white px-6 py-3 rounded-xl shadow-lg fixed bottom-6 right-6 z-50 animate-slide-up`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  createModal(content, options = {}) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
    
    const backdrop = document.createElement('div');
    backdrop.className = 'absolute inset-0 bg-black/50 animate-fade-in';
    
    const container = document.createElement('div');
    container.className = 'relative bg-zinc-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-slide-up border border-white/10';
    
    container.innerHTML = content;
    modal.appendChild(backdrop);
    modal.appendChild(container);
    document.body.appendChild(modal);

    const close = () => {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    };

    backdrop.addEventListener('click', close);
    
    const closeBtn = container.querySelector('[data-close]');
    if (closeBtn) closeBtn.addEventListener('click', close);

    if (options.onClose) {
      const originalClose = close;
      close = () => {
        options.onClose();
        originalClose();
      };
    }

    return { close };
  },

  getMatchColor(matchPercent) {
    if (matchPercent >= 80) return 'text-emerald-400';
    if (matchPercent >= 60) return 'text-cyan-400';
    if (matchPercent >= 40) return 'text-amber-400';
    return 'text-red-400';
  },

  getMatchBgColor(matchPercent) {
    if (matchPercent >= 80) return 'bg-emerald-500/20';
    if (matchPercent >= 60) return 'bg-cyan-500/20';
    if (matchPercent >= 40) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  },

  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  isMobile() {
    return window.innerWidth < 768;
  },

  isTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  },

  isDesktop() {
    return window.innerWidth >= 1024;
  }
};

if (typeof module !== 'undefined') {
  module.exports = Utils;
}
