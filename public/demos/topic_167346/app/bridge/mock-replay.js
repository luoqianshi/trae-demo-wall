/**
 * mock-replay.js · 事件回放（脱机开发用）
 *
 * 读 data/replay/*.events.jsonl，按事件之间的 ts 差异定时 emit
 * 支持加速倍率（x1 / x10 / x100）用于 QA 冒烟
 *
 * 用途：
 *   - M2c 步 2/3 开发时脱机联调 pet-engine
 *   - AC §6.1b JSON 回放验收（后续 tick 完善）
 */

export class MockReplay {
  constructor(bus, { onStatus } = {}) {
    this.bus = bus;
    this.onStatus = onStatus || (() => {});
    this.events = [];
    this.timer = null;
    this.index = 0;
    this.speed = 1;
    this.baseTs = 0;
    this.startedAt = 0;
  }

  /**
   * 从 URL 加载 NDJSON 文件（每行一条 JSON）
   */
  async load(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('fetch ' + url + ' failed: ' + resp.status);
    const text = await resp.text();
    this.events = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .map((l, i) => {
        try { return JSON.parse(l); }
        catch (e) { throw new Error('mock-replay line ' + (i + 1) + ' invalid JSON: ' + l); }
      });
    this._setStatus('loaded ' + this.events.length + ' events from ' + url);
    return this.events.length;
  }

  /**
   * 从数组直接注入（QA / 单测用）
   */
  loadFromArray(events) {
    this.events = events.slice();
    this._setStatus('loaded ' + this.events.length + ' events (inline)');
  }

  /**
   * 开始回放
   * @param {number} speed 加速倍率 (1 / 10 / 100)
   */
  play(speed = 1) {
    if (this.events.length === 0) throw new Error('no events loaded');
    this.stop();
    this.speed = speed;
    this.index = 0;
    this.baseTs = this.events[0].ts || 0;
    this.startedAt = performance.now();
    this._setStatus('playing @ x' + speed);
    this._scheduleNext();
  }

  _scheduleNext() {
    if (this.index >= this.events.length) {
      this._setStatus('done (' + this.events.length + ' events replayed)');
      return;
    }
    const evt = this.events[this.index];
    const targetElapsed = ((evt.ts || 0) - this.baseTs) / this.speed;
    const actualElapsed = performance.now() - this.startedAt;
    const wait = Math.max(0, targetElapsed - actualElapsed);
    this.timer = setTimeout(() => {
      // 深拷贝一份避免上游修改 seq 等字段影响后续重播
      this.bus.emit(Object.assign({}, evt, { _source: 'mock' }));
      this.index += 1;
      this._scheduleNext();
    }, wait);
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.index > 0 && this.index < this.events.length) {
      this._setStatus('stopped at ' + this.index + '/' + this.events.length);
    }
  }

  _setStatus(s) {
    this.status = s;
    this.onStatus(s);
  }
}
