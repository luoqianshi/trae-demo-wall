/**
 * WakeLockManager — 屏幕常亮控制
 */
class WakeLockManager {
  static lock = null;

  static async acquire() {
    if ('wakeLock' in navigator) {
      try {
        this.lock = await navigator.wakeLock.request('screen');
        document.addEventListener('visibilitychange', async () => {
          if (document.visibilityState === 'visible' && this.lock === null) {
            try {
              this.lock = await navigator.wakeLock.request('screen');
            } catch {}
          }
        });
      } catch {}
    }
  }

  static async release() {
    if (this.lock) {
      try { await this.lock.release(); } catch {}
      this.lock = null;
    }
  }
}
