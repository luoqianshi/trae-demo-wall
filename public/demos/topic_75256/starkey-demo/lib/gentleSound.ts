// 温和音效模块：使用 WebAudio API 合成简短的低频声音
// 所有声音音量低、时长短、无尖锐高频，不刺耳
// 默认关闭，仅在 lively 模式下开启

type SoundType = 'confirm' | 'arrive' | 'levelup' | 'click';

class GentleSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;

  setEnabled(on: boolean) {
    this.enabled = on;
    // 若开启，提前初始化 AudioContext（需用户交互后才允许启动）
    if (on && !this.ctx) {
      try {
        // 尝试初始化，但不强制（浏览器可能拒绝自动启动）
      } catch { /* ignore */ }
    }
  }

  private ensureContext(): boolean {
    if (!this.enabled) return false;
    try {
      if (!this.ctx) {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return false;
        this.ctx = new Ctx();
      }
      const ctx = this.ctx;
      // 恢复被浏览器挂起的 context（iOS Safari 常见）
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  }

  // 通用音符：合成一个短促、带指数衰减的低频正弦音
  private playTone(freq: number, duration: number, volume = 0.08, type: OscillatorType = 'sine', delay = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    // 指数衰减包络：柔和起始与收尾
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  play(type: SoundType) {
    if (!this.enabled) return;
    if (!this.ensureContext() || !this.ctx) return;

    // 音量与频率都保持温和（250–880Hz，0.04–0.1 音量）
    switch (type) {
      case 'click':
        // 简短轻按：约 100ms 的中低音
        this.playTone(660, 0.08, 0.06, 'triangle');
        break;
      case 'confirm':
        // 完成选择：两下轻柔上扬
        this.playTone(520, 0.1, 0.07, 'sine');
        this.playTone(780, 0.12, 0.07, 'sine', 0.12);
        break;
      case 'arrive':
        // 到站：一下明亮柔和的叮咚
        this.playTone(880, 0.15, 0.06, 'sine');
        break;
      case 'levelup':
        // 升级：三下轻柔上升的音
        this.playTone(440, 0.1, 0.06, 'sine');
        this.playTone(550, 0.1, 0.07, 'sine', 0.1);
        this.playTone(660, 0.16, 0.07, 'sine', 0.22);
        break;
    }
  }
}

// 单例实例，全局共享一个 AudioContext
export const gentleSound = new GentleSoundEngine();
