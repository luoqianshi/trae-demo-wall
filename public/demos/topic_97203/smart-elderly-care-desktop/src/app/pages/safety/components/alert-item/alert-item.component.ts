import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { DeviceAlert } from '@core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-alert-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alert-item" [class]="'level-' + alert.level">
      <div class="alert-content">
        <div class="alert-title">
          <span class="badge" [style.background-color]="bgColor" [style.color]="textColor">
            {{ levelLabel }}
          </span>
          <span class="alert-name">{{ alert.title }}</span>
        </div>
        <div class="alert-desc">{{ alert.description }}</div>
        <div class="alert-time">{{ formatTime(alert.occurredAt) }}</div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .alert-item {
      padding: 0.875rem 1rem;
      border-radius: var(--radius-md);
      background: var(--color-bg-secondary);
      border-left: 3px solid;
      margin-bottom: 0.75rem;
    }
    .level-danger { border-left-color: var(--state-error); }
    .level-warning { border-left-color: var(--state-warning); }
    .level-info { border-left-color: var(--state-info); }
    .alert-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: var(--weight-medium);
    }
    .alert-name {
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-text-primary);
    }
    .alert-desc {
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      margin: 0.25rem 0;
    }
    .alert-time {
      font-size: 0.625rem;
      color: var(--color-text-tertiary);
    }
  `],
})
export class AlertItemComponent {
  @Input() alert!: DeviceAlert;

  get levelLabel(): string {
    return { danger: '紧急', warning: '警告', info: '信息' }[this.alert.level] || '信息';
  }

  get bgColor(): string {
    return { danger: 'var(--state-error-bg)', warning: 'var(--state-warning-bg)', info: 'var(--state-info-bg)' }[this.alert.level] || 'var(--color-bg-tertiary)';
  }

  get textColor(): string {
    return { danger: 'var(--state-error)', warning: 'var(--state-warning)', info: 'var(--state-info)' }[this.alert.level] || 'var(--color-text-secondary)';
  }

  formatTime(d: Date | string): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'MM-dd HH:mm');
  }
}
