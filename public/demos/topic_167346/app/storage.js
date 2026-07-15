/**
 * storage.js · LocalStorage 持久化
 *
 * 键：drinkpet.state.v1
 * 数据契约：
 *   last_date              YYYY-MM-DD, 用于跨零点检测（F-E2E-3）
 *   today_total_ml         今日 drink 累计（正数），来自 firmware.protocol drink.today_total_ml
 *   today_refill_ml        今日 refill 累计（正数），来自 refill.today_refill_ml
 *   milestone_fired_today  是否已触发 1500ml 达标反馈（每日仅一次）
 *
 * 契约细节：
 *   - drink 事件 → today_total_ml 递增；refill 事件 → today_refill_ml 递增
 *   - refill 不影响 today_total_ml（animations.md §2.1 明示）
 *   - 跨零点：读取时如 last_date != 今日 → 全部清零，写入新 last_date
 *
 * 不依赖 IndexedDB（Demo 体量下 LocalStorage 完全够用；简单可测）
 */

const KEY = 'drinkpet.state.v1';

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function freshState() {
  return {
    last_date: today(),
    today_total_ml: 0,
    today_refill_ml: 0,
    milestone_fired_today: false,
  };
}

export class Storage {
  constructor({ onRollover } = {}) {
    this.onRollover = onRollover || (() => {});
    this.state = this._read();
    this._maybeRollover();
  }

  _read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return freshState();
      const parsed = JSON.parse(raw);
      // 字段兜底（防止老版本缺字段）
      return Object.assign(freshState(), parsed);
    } catch (e) {
      console.warn('[Storage] read failed, resetting:', e);
      return freshState();
    }
  }

  _write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('[Storage] write failed:', e);
    }
  }

  /**
   * 跨零点自动清零（PRD F-E2E-3）
   * 会在构造 + 每次外部调用 checkMidnight() 时触发
   */
  _maybeRollover() {
    const t = today();
    if (this.state.last_date !== t) {
      const prevDate = this.state.last_date;
      const prevTotal = this.state.today_total_ml;
      this.state = freshState();
      this._write();
      this.onRollover({ prevDate, prevTotal, newDate: t });
      return true;
    }
    return false;
  }

  checkMidnight() { return this._maybeRollover(); }

  /** drink 事件到达时调用；ml 应为正数 */
  addDrink(ml) {
    if (!Number.isFinite(ml) || ml <= 0) return this.state;
    this.state.today_total_ml = +(this.state.today_total_ml + ml).toFixed(1);
    this._write();
    return this.state;
  }

  /** refill 事件到达时调用；ml 应为正数（added_ml） */
  addRefill(ml) {
    if (!Number.isFinite(ml) || ml <= 0) return this.state;
    this.state.today_refill_ml = +(this.state.today_refill_ml + ml).toFixed(1);
    this._write();
    return this.state;
  }

  markMilestone() {
    this.state.milestone_fired_today = true;
    this._write();
    return this.state;
  }

  /** 调试用：直接预置今日累计（保留 last_date） */
  debugSet(patch) {
    Object.assign(this.state, patch);
    this._write();
    return this.state;
  }

  /** 调试用：强制走一次跨零点（把 last_date 改成昨天再触发 rollover） */
  debugForceRollover() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.state.last_date = `${y}-${m}-${day}`;
    this._write();
    return this._maybeRollover();
  }

  get snapshot() { return Object.assign({}, this.state); }
}
