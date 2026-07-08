/* ==========================================
   小译 XiaoYi Demo — Shared JS Utilities
   Store / Toast / Theme / Navigation / Clock
   ========================================== */

(function (global) {
  'use strict';

  /* ============ Store (localStorage-backed) ============ */
  const STORE_KEY = 'xiaoyi_demo_store_v1';

  const defaultStore = {
    user: {
      name: '王小明',
      initial: 'W',
      bio: '坚持每天学习30分钟 | 英语/日语学习中',
      stats: { works: 12, courses: 8, favorites: 36, points: 2480 },
      streak: 7,
      studyDays: 128,
      vocabLearned: 3200,
      achievements: 12,
    },
    theme: 'dark', // 'dark' | 'light'
    bookedCourses: [], // [{id, name, teacher, price, rating}]
    likedPosts: [], // [postId]
    myPosts: [], // [{id, title, content, category, time}]
    quizProgress: { answered: 23, correct: 18, total: 50 },
    joinedRooms: ['english-corner'],
    translateHistory: [],
    studyTimeSeconds: 5025, // 01:23:45
  };

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return { ...defaultStore };
      const parsed = JSON.parse(raw);
      // shallow merge top-level keys
      return { ...defaultStore, ...parsed, user: { ...defaultStore.user, ...(parsed.user || {}), stats: { ...defaultStore.user.stats, ...((parsed.user && parsed.user.stats) || {}) } }, quizProgress: { ...defaultStore.quizProgress, ...(parsed.quizProgress || {}) } };
    } catch (e) {
      return { ...defaultStore };
    }
  }

  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(global.XY.store)); } catch (e) {}
  }

  global.XY = {
    store: loadStore(),

    /* ----- Theme ----- */
    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.store.theme);
    },
    toggleTheme() {
      this.store.theme = this.store.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme();
      saveStore();
      return this.store.theme;
    },

    /* ----- Toast ----- */
    toast(message, type = 'info', duration = 1800) {
      let el = document.getElementById('xy-toast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'xy-toast';
        el.className = 'toast';
        document.body.appendChild(el);
      }
      el.className = 'toast ' + type;
      el.textContent = message;
      // force reflow
      void el.offsetWidth;
      el.classList.add('show');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        el.classList.remove('show');
      }, duration);
    },

    /* ----- Modal ----- */
    openModal(contentBuilder) {
      let overlay = document.getElementById('xy-modal-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'xy-modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) overlay.classList.remove('show');
        });
      }
      overlay.innerHTML = '';
      const sheet = document.createElement('div');
      sheet.className = 'modal-sheet';
      contentBuilder(sheet);
      overlay.appendChild(sheet);
      // force reflow then show
      void overlay.offsetWidth;
      overlay.classList.add('show');
      return { overlay, sheet, close: () => overlay.classList.remove('show') };
    },

    closeModal() {
      const overlay = document.getElementById('xy-modal-overlay');
      if (overlay) overlay.classList.remove('show');
    },

    /* ----- Booked Courses ----- */
    bookCourse(course) {
      const exists = this.store.bookedCourses.find(c => c.id === course.id);
      if (exists) { this.toast('已经预约过该课程', 'info'); return false; }
      this.store.bookedCourses.push(course);
      saveStore();
      this.toast('预约成功！可在「我的-我的课程」查看', 'success');
      return true;
    },
    isBooked(courseId) {
      return this.store.bookedCourses.some(c => c.id === courseId);
    },

    /* ----- Liked Posts ----- */
    toggleLike(postId) {
      const idx = this.store.likedPosts.indexOf(postId);
      if (idx >= 0) {
        this.store.likedPosts.splice(idx, 1);
        saveStore();
        return false;
      }
      this.store.likedPosts.push(postId);
      saveStore();
      return true;
    },
    isLiked(postId) { return this.store.likedPosts.includes(postId); },

    /* ----- Posts ----- */
    addPost(post) {
      post.id = 'p_' + Date.now();
      post.time = '刚刚';
      this.store.myPosts.unshift(post);
      saveStore();
      return post;
    },

    /* ----- Quiz ----- */
    recordQuiz(isCorrect) {
      this.store.quizProgress.answered++;
      if (isCorrect) this.store.quizProgress.correct++;
      saveStore();
    },

    /* ----- Persist ----- */
    save: saveStore,

    /* ----- Helpers ----- */
    formatTime(seconds) {
      const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      return `${h}:${m}:${s}`;
    },

    /* ----- Status Bar Clock ----- */
    startClock() {
      const update = () => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        document.querySelectorAll('.status-bar .time').forEach(el => {
          el.textContent = `${hh}:${mm}`;
        });
      };
      update();
      setInterval(update, 30000);
    },
  };

  /* ----- Apply theme & start clock on DOM ready ----- */
  function init() {
    global.XY.applyTheme();
    global.XY.startClock();

    // Listen for theme changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === STORE_KEY) {
        global.XY.store = loadStore();
        global.XY.applyTheme();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
