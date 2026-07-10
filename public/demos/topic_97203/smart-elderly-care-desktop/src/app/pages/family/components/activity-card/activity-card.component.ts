import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommunityActivity } from '@core/models';

@Component({
  selector: 'app-activity-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card card-hover act-card">
      <div class="icon-wrap" [style.background-color]="bgColor" [style.color]="iconColor">
        <span nz-icon [nzType]="activity.icon" nzTheme="outline"></span>
      </div>
      <div class="content">
        <div class="title">{{ activity.title }}</div>
        <div class="schedule" *ngIf="activity.schedule">{{ activity.schedule }}</div>
      </div>
      <button
        *ngIf="activity.remindable"
        class="remind-btn"
        (click)="remind.emit()">
        提醒
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .act-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
    }
    .icon-wrap {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      flex-shrink: 0;
    }
    .content { flex: 1; min-width: 0; }
    .title {
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-text-primary);
    }
    .schedule {
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
      margin-top: 2px;
    }
    .remind-btn {
      padding: 0.25rem 0.625rem;
      background: var(--brand-primary-lightest);
      color: var(--brand-primary);
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      cursor: pointer;
    }
    .remind-btn:hover { background: var(--brand-primary-lighter); }
  `],
})
export class ActivityCardComponent {
  @Input() activity!: CommunityActivity;
  @Output() remind = new EventEmitter<void>();

  get bgColor(): string {
    if (this.activity.category === 'community') return 'var(--state-info-bg)';
    return 'var(--brand-primary-lightest)';
  }
  get iconColor(): string {
    if (this.activity.category === 'community') return 'var(--state-info)';
    return 'var(--brand-primary)';
  }
}
