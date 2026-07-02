/**
 * AI Interview System — Common Utilities & Data Management
 * Shared JavaScript module used by both student and admin sides.
 */

/* ============================================
   DataStore — localStorage wrapper
   ============================================ */
const DataStore = {
  /**
   * Get a value from localStorage with namespaced key
   * @param {string} key
   * @returns {*} Parsed value or null
   */
  get(key) {
    try {
      return JSON.parse(localStorage.getItem('ai_interview_' + key));
    } catch {
      return null;
    }
  },

  /**
   * Set a value in localStorage with namespaced key
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    localStorage.setItem('ai_interview_' + key, JSON.stringify(value));
  },

  /**
   * Remove a value from localStorage by namespaced key
   * @param {string} key
   */
  remove(key) {
    localStorage.removeItem('ai_interview_' + key);
  },

  // ---- User ----
  getCurrentUser() {
    return this.get('currentUser');
  },
  setCurrentUser(user) {
    this.set('currentUser', user);
  },
  clearCurrentUser() {
    this.remove('currentUser');
  },

  // ---- Exam ----
  getExamSession() {
    return this.get('examSession');
  },
  setExamSession(session) {
    this.set('examSession', session);
  },
  getExamResult() {
    return this.get('examResult');
  },
  setExamResult(result) {
    this.set('examResult', result);
  },

  // ---- Video / AI ----
  getVideoRecord() {
    return this.get('videoRecord');
  },
  setVideoRecord(record) {
    this.set('videoRecord', record);
  },
  getAIReport() {
    return this.get('aiReport');
  },
  setAIReport(report) {
    this.set('aiReport', report);
  },

  // ---- Admin ----
  getAllStudents() {
    return this.get('allStudents') || [];
  },
  setAllStudents(data) {
    this.set('allStudents', data);
  },
  getAllInterviews() {
    return this.get('allInterviews') || [];
  },
  setAllInterviews(data) {
    this.set('allInterviews', data);
  },
  getAllReviews() {
    return this.get('allReviews') || [];
  },
  setAllReviews(data) {
    this.set('allReviews', data);
  },
  getAllQuestionnaires() {
    return this.get('allQuestionnaires') || [];
  },
  setAllQuestionnaires(data) {
    this.set('allQuestionnaires', data);
  },

  // ---- Reset ----
  /**
   * Remove all ai_interview_ prefixed keys from localStorage
   */
  resetAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('ai_interview_')) {
        localStorage.removeItem(key);
      }
    });
  }
};


/* ============================================
   Toast — Notification system
   ============================================ */
const Toast = {
  container: null,

  /**
   * Initialize the toast container (called automatically)
   */
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  /**
   * Show a toast notification
   * @param {string} message - Text to display
   * @param {string} type - 'info' | 'success' | 'error' | 'warning'
   * @param {number} duration - Auto-dismiss time in ms (default 3000)
   */
  show(message, type = 'info', duration = 3000) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.textContent = message;
    this.container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
    });

    // Auto dismiss
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /** Shorthand: show success toast */
  success(msg) { this.show(msg, 'success'); },

  /** Shorthand: show error toast */
  error(msg) { this.show(msg, 'error'); },

  /** Shorthand: show warning toast */
  warning(msg) { this.show(msg, 'warning'); },

  /** Shorthand: show info toast */
  info(msg) { this.show(msg, 'info'); }
};


/* ============================================
   Modal — Dialog system
   ============================================ */
const Modal = {
  /**
   * Show a modal dialog
   * @param {Object} options
   * @param {string} [options.title] - Modal title
   * @param {string} options.content - HTML content for the body
   * @param {string} [options.confirmText='确定'] - Confirm button text
   * @param {string|false} [options.cancelText='取消'] - Cancel button text (false to hide)
   * @param {Function} [options.onConfirm] - Confirm callback
   * @param {Function} [options.onCancel] - Cancel callback
   * @param {boolean} [options.closable=true] - Allow closing by clicking overlay or X button
   * @returns {{ close: Function, overlay: HTMLElement }}
   */
  show(options) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        ${options.title ? `
          <div class="modal-header">
            <h3>${options.title}</h3>
            ${options.closable !== false ? '<button class="modal-close">&times;</button>' : ''}
          </div>
        ` : ''}
        <div class="modal-body">${options.content}</div>
        ${options.confirmText || options.cancelText ? `
          <div class="modal-footer">
            ${options.cancelText !== false ? `<button class="btn btn-secondary modal-cancel">${options.cancelText || '取消'}</button>` : ''}
            ${options.confirmText !== false ? `<button class="btn btn-primary modal-confirm">${options.confirmText || '确定'}</button>` : ''}
          </div>
        ` : ''}
      </div>
    `;
    document.body.appendChild(overlay);

    // Trigger enter animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('show');
      });
    });

    // Close handler
    const close = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    };

    // Bind events
    overlay.querySelector('.modal-close')?.addEventListener('click', close);
    overlay.querySelector('.modal-cancel')?.addEventListener('click', () => {
      close();
      options.onCancel?.();
    });
    overlay.querySelector('.modal-confirm')?.addEventListener('click', () => {
      close();
      options.onConfirm?.();
    });

    // Close on overlay click
    if (options.closable !== false) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
      });
    }

    return { close, overlay };
  },

  /**
   * Show a confirmation dialog
   * @param {string} message
   * @param {Function} onConfirm
   * @returns {{ close: Function, overlay: HTMLElement }}
   */
  confirm(message, onConfirm) {
    return this.show({
      title: '确认',
      content: `<p>${message}</p>`,
      confirmText: '确定',
      cancelText: '取消',
      onConfirm
    });
  },

  /**
   * Show an alert dialog
   * @param {string} message
   * @param {string} [title='提示']
   * @returns {{ close: Function, overlay: HTMLElement }}
   */
  alert(message, title) {
    return this.show({
      title: title || '提示',
      content: `<p>${message}</p>`,
      confirmText: '知道了',
      cancelText: false
    });
  }
};


/* ============================================
   EventBus — Cross-tab communication via localStorage storage events
   ============================================ */
const EventBus = {
  _listeners: {},

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  },

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  },

  emit(event, data) {
    // Local listeners (same tab)
    if (this._listeners[event]) {
      this._listeners[event].forEach(cb => cb(data));
    }
    // Cross-tab via localStorage
    const key = 'ai_interview_event_' + event;
    localStorage.setItem(key, JSON.stringify({ event, data, timestamp: Date.now() }));
    // Clean up after a short delay
    setTimeout(() => localStorage.removeItem(key), 100);
  },

  // Initialize cross-tab listener (call once on page load)
  init() {
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('ai_interview_event_') && e.newValue) {
        try {
          const { event, data } = JSON.parse(e.newValue);
          if (this._listeners[event]) {
            this._listeners[event].forEach(cb => cb(data));
          }
        } catch (err) { /* ignore parse errors */ }
      }
    });
  }
};


/* ============================================
   InterviewStateManager
   ============================================ */
const InterviewState = {
  // Get student's status in an interview
  getStudentStatus(studentId, interviewId) {
    return DataStore.get(`student_status_${studentId}_${interviewId}`) || {
      studentId, interviewId,
      status: 'pending', // pending, check, waiting, interview, ended
      phase: 'check',
      examCompleted: false,
      aiDetectionCompleted: false,
      scored: false,
      reviewed: false,
      updatedAt: null
    };
  },

  // Update student's status
  setStudentStatus(studentId, interviewId, updates) {
    const current = this.getStudentStatus(studentId, interviewId);
    const updated = { ...current, ...updates, updatedAt: Date.now() };
    DataStore.set(`student_status_${studentId}_${interviewId}`, updated);
    EventBus.emit('student_status_changed', { studentId, interviewId, ...updated });
    return updated;
  },

  // Get AI detection result for a student
  getAIResult(studentId, interviewId) {
    return DataStore.get(`ai_result_${studentId}_${interviewId}`);
  },

  // Set AI detection result
  setAIResult(studentId, interviewId, result) {
    DataStore.set(`ai_result_${studentId}_${interviewId}`, result);
    EventBus.emit('ai_result_ready', { studentId, interviewId, result });
  },

  // Get interviewer score for a student
  getScore(studentId, interviewId) {
    return DataStore.get(`score_${studentId}_${interviewId}`);
  },

  // Set interviewer score
  setScore(studentId, interviewId, score) {
    DataStore.set(`score_${studentId}_${interviewId}`, score);
    EventBus.emit('score_submitted', { studentId, interviewId, score });
  },

  // Get review result
  getReview(studentId, interviewId) {
    return DataStore.get(`review_${studentId}_${interviewId}`);
  },

  // Set review result
  setReview(studentId, interviewId, review) {
    DataStore.set(`review_${studentId}_${interviewId}`, review);
    EventBus.emit('review_submitted', { studentId, interviewId, review });
  },

  // Get all student statuses for an interview
  getInterviewStudentStatuses(interviewId) {
    const interviews = DataStore.getAllInterviews();
    const interview = interviews.find(i => i.id === interviewId);
    if (!interview || !interview.students) return [];
    return interview.students.map(stuId => this.getStudentStatus(stuId, interviewId));
  },

  // Get interview progress stats
  getInterviewProgress(interviewId) {
    const statuses = this.getInterviewStudentStatuses(interviewId);
    const total = statuses.length;
    const questionnaire = statuses.filter(s => s.questionnaireCompleted || true).length;
    const exam = statuses.filter(s => s.examCompleted).length;
    const ai = statuses.filter(s => s.aiDetectionCompleted).length;
    const scored = statuses.filter(s => s.scored).length;
    return {
      total,
      questionnaire: Math.round((questionnaire / total) * 100),
      exam: total > 0 ? Math.round((exam / total) * 100) : 0,
      ai: total > 0 ? Math.round((ai / total) * 100) : 0,
      scored: total > 0 ? Math.round((scored / total) * 100) : 0
    };
  },

  // Get interview students list
  getInterviewStudents(interviewId) {
    const interviews = DataStore.getAllInterviews();
    const interview = interviews.find(i => i.id === interviewId);
    if (!interview || !interview.students) return [];
    const allStudents = DataStore.getAllStudents();
    return interview.students.map(stuId => allStudents.find(s => s.id === stuId)).filter(Boolean);
  },

  // Get interview progress stats
  getInterviewProgress(interviewId) {
    const students = this.getInterviewStudents(interviewId);
    const total = students.length;
    if (total === 0) return { questionnaire: 0, video: 0, detection: 0, scoring: 0, overall: 0 };

    let qDone = 0, vDone = 0, dDone = 0, sDone = 0;
    students.forEach(s => {
      const st = this.getStudentStatus(s.id, interviewId);
      const status = (st && st.status) || 'pending';
      if (status === 'interviewing' || status === 'completed') qDone++;
      if (status === 'completed') { vDone++; dDone++; }
      const score = this.getScore(s.id, interviewId);
      if (score) sDone++;
    });

    const pct = (done) => total > 0 ? Math.round((done / total) * 100) : 0;
    const qPct = pct(qDone);
    const vPct = pct(vDone);
    const dPct = pct(dDone);
    const sPct = pct(sDone);
    const overall = Math.round((qPct + vPct + dPct + sPct) / 4);

    return { questionnaire: qPct, video: vPct, detection: dPct, scoring: sPct, overall };
  },

  // Legacy compat: support (interviewId, studentId) parameter order
  getStatusByIds(interviewId, studentId) {
    return this.getStudentStatus(studentId, interviewId);
  },
  getScoreByIds(interviewId, studentId) {
    return this.getScore(studentId, interviewId);
  },
  getAIResultByIds(interviewId, studentId) {
    return this.getAIResult(studentId, interviewId);
  }
};

/**
 * Format seconds into MM:SS string
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format a Date object into 'YYYY-MM-DD HH:mm' string
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array (Fisher-Yates) — returns a new array
 * @param {Array} arr
 * @returns {Array}
 */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Animate a number from current value to target with easing
 * @param {HTMLElement} element - Element containing the number
 * @param {number} target - Target number
 * @param {number} duration - Animation duration in ms (default 1000)
 */
function animateNumber(element, target, duration = 1000) {
  const start = parseInt(element.textContent) || 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Cubic ease-out
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Navigate to a URL with a page-leave transition
 * @param {string} url
 */
function navigateTo(url) {
  document.body.classList.add('page-leaving');
  setTimeout(() => {
    window.location.href = url;
  }, 200);
}

/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle a function
 * @param {Function} fn
 * @param {number} limit
 * @returns {Function}
 */
function throttle(fn, limit = 300) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate a simple unique ID
 * @param {string} [prefix='']
 * @returns {string}
 */
function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Deep clone an object via JSON serialization
 * @param {*} obj
 * @returns {*}
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is a non-empty string
 * @param {*} value
 * @returns {boolean}
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}


/* ============================================
   Page Initialization
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize EventBus for cross-tab communication
  EventBus.init();

  // Initialize toast container
  Toast.init();

  // Add page-enter animation
  document.body.classList.add('page-entering');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.remove('page-entering');
      document.body.classList.add('page-entered');
    });
  });
});
