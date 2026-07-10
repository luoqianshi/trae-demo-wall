import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { HealthMetric, HealthMetricType } from '@core/models';

@Component({
  selector: 'app-health-metric-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card card-hover metric-card">
      <div class="head">
        <div class="label">{{ metric.label }}</div>
        <div class="status-pill" [style.background-color]="statusBg" [style.color]="statusColor">
          {{ statusText }}
        </div>
      </div>
      <div class="value-row">
        <span class="value">{{ metric.value }}</span>
        <span class="unit">{{ metric.unit }}</span>
        <span class="trend" *ngIf="metric.trend === 'up'" style="color: var(--state-error);">
          ↑ 偏高
        </span>
        <span class="trend" *ngIf="metric.trend === 'down'" style="color: var(--state-info);">
          ↓ 偏低
        </span>
        <span class="trend" *ngIf="metric.trend === 'flat'" style="color: var(--state-success);">
          → 稳定
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .metric-card { padding: 1.5rem; }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .label {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }
    .status-pill {
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
    }
    .value-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    .value {
      font-size: var(--text-3xl);
      font-weight: var(--weight-bold);
      color: var(--color-text-primary);
    }
    .unit {
      font-size: var(--text-sm);
      color: var(--color-text-tertiary);
    }
    .trend {
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      margin-left: auto;
    }
  `],
})
export class HealthMetricCardComponent {
  @Input() metric!: HealthMetric;

  get statusText(): string {
    return { normal: '正常', warning: '偏高', danger: '异常' }[this.metric.status];
  }
  get statusBg(): string {
    return { normal: 'var(--state-success-bg)', warning: 'var(--state-warning-bg)', danger: 'var(--state-error-bg)' }[this.metric.status];
  }
  get statusColor(): string {
    return { normal: 'var(--state-success)', warning: 'var(--state-warning)', danger: 'var(--state-error)' }[this.metric.status];
  }
}
