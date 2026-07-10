import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

export type KpiStatus = 'success' | 'warning' | 'danger' | 'info';

@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpi card card-hover">
      <div class="head">
        <div class="icon-wrap" [style.background-color]="bgColor" [style.color]="iconColor">
          <span nz-icon [nzType]="icon" nzTheme="outline"></span>
        </div>
        <div class="title">{{ title }}</div>
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .kpi { padding: 1.5rem; }
    .head {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .icon-wrap {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .title {
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-text-secondary);
    }
  `],
})
export class KpiCardComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() status: KpiStatus = 'info';

  get bgColor(): string {
    return {
      success: 'var(--state-success-bg)',
      warning: 'var(--state-warning-bg)',
      danger: 'var(--state-error-bg)',
      info: 'var(--state-info-bg)',
    }[this.status];
  }
  get iconColor(): string {
    return {
      success: 'var(--state-success)',
      warning: 'var(--state-warning)',
      danger: 'var(--state-error)',
      info: 'var(--state-info)',
    }[this.status];
  }
}
