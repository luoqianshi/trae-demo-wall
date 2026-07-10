import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Elder } from '@core/models';

@Component({
  selector: 'app-status-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="banner card card-hover">
      <div class="left">
        <div class="avatar">
          <span nz-icon nzType="user" nzTheme="outline"></span>
        </div>
        <div class="info">
          <div class="name-row">
            <span class="name">{{ elder?.name ?? '王淑芬' }}</span>
            <span class="status-badge">
              <span class="status-dot pulse-safe"></span>
              安全
            </span>
          </div>
          <div class="activity-row">
            <span nz-icon nzType="clock-circle" nzTheme="outline"></span>
            <span>最后活动：30 分钟前在家中活动</span>
          </div>
        </div>
      </div>
      <div class="right">
        <button class="btn-secondary">
          <span nz-icon nzType="video-camera" nzTheme="outline"></span>
          <span>视频查看</span>
        </button>
        <button class="btn-primary">
          <span nz-icon nzType="phone" nzTheme="outline"></span>
          <span>一键通话</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1.5rem;
      border-color: var(--color-border-light);
    }
    .left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .avatar {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: var(--brand-primary-light);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      flex-shrink: 0;
    }
    .name-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }
    .name {
      font-size: var(--text-xl);
      font-weight: var(--weight-bold);
      color: var(--color-text-primary);
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 2px 10px;
      border-radius: 9999px;
      background: var(--state-success-bg);
      color: var(--state-success);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--state-success);
    }
    .activity-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }
    .right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-primary, .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      cursor: pointer;
      border: none;
      transition: all var(--transition-base);
    }
    .btn-primary {
      background: var(--brand-primary);
      color: #fff;
    }
    .btn-primary:hover { background: var(--brand-primary-dark); }
    .btn-secondary {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
    }
    .btn-secondary:hover { background: var(--color-bg-secondary); }
  `],
})
export class StatusBannerComponent {
  @Input() elder: Elder | null = null;
}
