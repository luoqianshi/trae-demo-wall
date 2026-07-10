import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ActivityEvent, ActivityType } from '@core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-activity-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-modal
      [nzVisible]="visible"
      [nzWidth]="720"
      [nzFooter]="null"
      nzTitle="活动详情"
      (nzOnCancel)="close.emit()">
      <ng-container *nzModalContent>
        <div class="filters">
          <nz-range-picker [(ngModel)]="dateRange"></nz-range-picker>
          <div class="tabs">
            <button
              *ngFor="let t of tabs"
              class="tab"
              [class.active]="activeType === t.key"
              (click)="activeType = t.key">
              {{ t.label }}
            </button>
          </div>
          <nz-input-group [nzPrefix]="searchPrefix">
            <input nz-input placeholder="搜索活动" />
          </nz-input-group>
          <ng-template #searchPrefix><span nz-icon nzType="search"></span></ng-template>
        </div>

        <div class="summary">共 {{ filteredEvents.length }} 条活动记录</div>

        <div class="timeline">
          <div *ngFor="let e of filteredEvents" class="event-item" [class.is-danger]="e.severity === 'danger'">
            <div class="dot" [style.background-color]="dotColor(e)"></div>
            <div class="content">
              <div class="title">{{ e.title }}</div>
              <div class="desc">{{ e.description }}</div>
            </div>
            <div class="time">{{ formatTime(e.recordedAt) }}</div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-secondary">
            <span nz-icon nzType="download" nzTheme="outline"></span>
            导出
          </button>
          <button class="btn-secondary">
            <span nz-icon nzType="file-text" nzTheme="outline"></span>
            下载
          </button>
          <button class="btn-primary" (click)="close.emit()">关闭</button>
        </div>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    :host ::ng-deep .ant-modal-content { padding: 0; }
    .filters {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border-light);
      flex-wrap: wrap;
    }
    .tabs { display: flex; gap: 0.25rem; }
    .tab {
      padding: 0.375rem 0.875rem;
      border-radius: var(--radius-md);
      background: var(--color-bg-tertiary);
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
      cursor: pointer;
      border: none;
    }
    .tab.active {
      background: var(--brand-primary);
      color: #fff;
    }
    .summary {
      padding: 1rem 0;
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }
    .timeline {
      max-height: 400px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
    .event-item {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 0.75rem 0.75rem 1rem;
      margin-bottom: 0.5rem;
      border-radius: var(--radius-md);
      border-left: 3px solid transparent;
    }
    .event-item.is-danger { border-left-color: var(--state-error); background: var(--state-error-bg); }
    .dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      margin-top: 0.5rem;
      flex-shrink: 0;
    }
    .content { flex: 1; min-width: 0; }
    .title { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-text-primary); }
    .desc { font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 0.25rem; }
    .time { font-size: var(--text-xs); color: var(--color-text-tertiary); flex-shrink: 0; }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border-light);
    }
    .btn-primary, .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      cursor: pointer;
      border: none;
    }
    .btn-primary { background: var(--brand-primary); color: #fff; }
    .btn-primary:hover { background: var(--brand-primary-dark); }
    .btn-secondary { background: var(--color-bg-tertiary); color: var(--color-text-primary); }
  `],
})
export class ActivityDialogComponent {
  @Input() visible = false;
  @Input() events: ActivityEvent[] = [];
  @Output() close = new EventEmitter<void>();

  dateRange: Date[] = [];
  activeType: ActivityType | 'all' = 'all';
  readonly tabs: { key: ActivityType | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'daily', label: '日常活动' },
    { key: 'health', label: '健康监测' },
    { key: 'safety', label: '安全事件' },
  ];

  get filteredEvents(): ActivityEvent[] {
    if (this.activeType === 'all') return this.events;
    return this.events.filter((e) => e.type === this.activeType);
  }

  formatTime(d: Date | string): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'MM-dd HH:mm');
  }

  dotColor(e: ActivityEvent): string {
    if (e.severity === 'danger') return 'var(--state-error)';
    if (e.severity === 'warning') return 'var(--state-warning)';
    if (e.type === 'health') return 'var(--state-info)';
    return 'var(--state-success)';
  }
}
