/**
 * web-serial.js · Web Serial 桥接层
 *
 * 消费 firmware/protocol.md v1.0 事件流：
 *   - §1.1 UTF-8 + \n 分帧
 *   - §2.2 seq wrap（gap uint32 判丢包/reboot）
 *   - §4.6 malformed_line → emit 客户端 error 事件（不递增 error_count）
 *
 * 断连自动重试：最多 3 次，指数退避 500ms / 1s / 2s
 */

const BAUD_RATE = 115200;         // firmware/protocol.md §1.1
const MAX_RECONNECT = 3;
const REBOOT_GAP_THRESHOLD = 0x80000000; // §2.2

/**
 * LineBreakTransformer · 把任意 chunk 按 \n 切成完整 line
 * 兼容跨 chunk 半行；empty line 跳过
 */
class LineBreakTransformer {
  constructor() { this.buffer = ''; }
  transform(chunk, controller) {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) controller.enqueue(trimmed);
    }
  }
  flush(controller) {
    const rest = this.buffer.trim();
    if (rest) controller.enqueue(rest);
  }
}

export class WebSerialBridge {
  constructor(bus, { onStatus } = {}) {
    this.bus = bus;
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.readTask = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.onStatus = onStatus || (() => {});
    this.lastSeq = null;
    this.bootCount = null;
  }

  static isSupported() {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  async connect() {
    if (!WebSerialBridge.isSupported()) {
      this._setStatus('unsupported');
      throw new Error('Web Serial API not supported (need Chromium ≥ 89)');
    }
    this._setStatus('requesting-port');
    this.port = await navigator.serial.requestPort();
    await this._openAndRead();
  }

  async _openAndRead() {
    await this.port.open({ baudRate: BAUD_RATE });
    this.connected = true;
    this.reconnectAttempts = 0;
    this._setStatus('connected');

    // writer 独立 pipeline，供后续命令下发
    this.writer = this.port.writable.getWriter();

    // reader pipeline: bytes → utf-8 → lines
    const decoder = new TextDecoderStream();
    const readable = this.port.readable
      .pipeThrough(decoder)
      .pipeThrough(new TransformStream(new LineBreakTransformer()));
    this.reader = readable.getReader();

    this.readTask = this._readLoop().catch(err => {
      console.error('[WebSerial] read loop crashed:', err);
      this._setStatus('read-error');
      this._scheduleReconnect();
    });
  }

  async _readLoop() {
    while (this.connected) {
      const { value, done } = await this.reader.read();
      if (done) {
        this._setStatus('reader-closed');
        break;
      }
      this._handleLine(value);
    }
  }

  _handleLine(line) {
    let event;
    try {
      event = JSON.parse(line);
    } catch (e) {
      // §4.6 契约：非 JSON 行 → 客户端 error（不作为设备 error_count 计数）
      this.bus.emit({
        type: 'error',
        ts: Date.now(),
        state: 'unknown',
        seq: -1,
        message: 'malformed_line: ' + line.slice(0, 80),
        error_count: 0,
        _source: 'client'
      });
      return;
    }

    // seq wrap / reboot 检测（§2.2）
    this._checkSeq(event);

    // boot_count 变化 → reboot 二次确认（O-P3）
    if (event.boot_count !== undefined) {
      if (this.bootCount !== null && event.boot_count !== this.bootCount) {
        this.lastSeq = null; // 允许 seq 序列重置
      }
      this.bootCount = event.boot_count;
    }

    this.bus.emit(event);
  }

  _checkSeq(event) {
    if (typeof event.seq !== 'number') return;
    const newSeq = event.seq >>> 0;
    if (this.lastSeq === null) {
      this.lastSeq = newSeq;
      return;
    }
    const gap = (newSeq - this.lastSeq) >>> 0;
    if (gap === 0) {
      console.warn('[WebSerial] duplicate frame seq=' + newSeq);
      return;
    }
    if (gap > REBOOT_GAP_THRESHOLD) {
      console.warn('[WebSerial] reboot suspected, gap=' + gap);
      // 允许 lastSeq 前进；后续 boot_count 变化会二次确认
    } else if (gap > 1) {
      console.warn('[WebSerial] gap=' + gap + ' (possibly dropped frames)');
    }
    this.lastSeq = newSeq;
  }

  async sendCommand(cmd) {
    if (!this.writer) throw new Error('not connected');
    const payload = JSON.stringify(cmd) + '\n';
    await this.writer.write(new TextEncoder().encode(payload));
  }

  async disconnect() {
    this.connected = false;
    try { if (this.reader) await this.reader.cancel(); } catch {}
    try { if (this.writer) await this.writer.close(); } catch {}
    try { if (this.port) await this.port.close(); } catch {}
    this.reader = null;
    this.writer = null;
    this.port = null;
    this._setStatus('disconnected');
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= MAX_RECONNECT) {
      this._setStatus('reconnect-exhausted');
      return;
    }
    const delay = 500 * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts += 1;
    this._setStatus('reconnecting-in-' + delay + 'ms (attempt ' + this.reconnectAttempts + '/' + MAX_RECONNECT + ')');
    setTimeout(() => {
      this._openAndRead().catch(err => {
        console.error('[WebSerial] reconnect failed:', err);
        this._scheduleReconnect();
      });
    }, delay);
  }

  _setStatus(s) {
    this.status = s;
    this.onStatus(s);
  }
}
