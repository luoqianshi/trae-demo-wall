import { Component, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';

@Component({
  selector: 'app-voice-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="voice">
      <button class="play-btn" (click)="toggle()">
        <span nz-icon [nzType]="playing ? 'pause-circle' : 'play-circle'" nzTheme="outline"></span>
      </button>
      <div class="waveform">
        <span
          *ngFor="let h of heights; let i = index"
          class="bar"
          [class.playing]="playing && i === activeIndex">
        </span>
      </div>
      <span class="duration">{{ formatDuration(duration) }}</span>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .voice {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-lg);
      background: var(--color-bg-secondary);
    }
    .play-btn {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      background: var(--brand-primary);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      border: none;
      cursor: pointer;
      flex-shrink: 0;
    }
    .waveform {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 2px;
      min-width: 120px;
    }
    .bar {
      width: 3px;
      background: var(--color-text-tertiary);
      border-radius: 2px;
      flex-shrink: 0;
    }
    .bar.playing { background: var(--brand-primary); }
    .duration {
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
      flex-shrink: 0;
    }
  `],
})
export class VoicePlayerComponent implements OnDestroy {
  @Input() audioUrl = '';
  @Input() duration = 0;
  @Input() waveform: number[] = [];

  playing = false;
  activeIndex = -1;
  private audio: HTMLAudioElement | null = null;
  private intervalId: number | null = null;

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  get heights(): number[] {
    if (this.waveform.length) return this.waveform;
    return Array.from({ length: 24 }, () => 8 + Math.round(Math.random() * 16));
  }

  toggle(): void {
    if (this.playing) {
      this.stop();
    } else {
      this.play();
    }
  }

  play(): void {
    if (!this.audioUrl) {
      // 模拟播放
      this.playing = true;
      this.startSimulatedProgress();
      return;
    }
    if (!this.audio) this.audio = new Audio(this.audioUrl);
    this.audio.play().then(() => {
      this.playing = true;
      this.cdr.markForCheck();
    }).catch(() => {
      this.playing = true;
      this.startSimulatedProgress();
    });
  }

  stop(): void {
    if (this.audio) this.audio.pause();
    this.playing = false;
    this.activeIndex = -1;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.stop();
    if (this.audio) {
      this.audio.src = '';
      this.audio = null;
    }
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private startSimulatedProgress(): void {
    if (this.intervalId !== null) return;
    let i = 0;
    this.zone.runOutsideAngular(() => {
      this.intervalId = window.setInterval(() => {
        i = (i + 1) % this.heights.length;
        this.zone.run(() => {
          this.activeIndex = i;
          this.cdr.markForCheck();
        });
        if (this.duration && i >= this.heights.length - 1) this.stop();
      }, 150);
    });
  }
}
