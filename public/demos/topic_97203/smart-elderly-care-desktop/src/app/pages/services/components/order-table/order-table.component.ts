import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ServiceOrder } from '@core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-order-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-header">
        <h2>近期订单</h2>
        <button class="link">查看全部</button>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>服务类型</th>
            <th>时间</th>
            <th>状态</th>
            <th>费用</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let o of orders">
            <td>{{ o.serviceName }}</td>
            <td>{{ formatTime(o.orderedAt) }}</td>
            <td>
              <span class="status" [style.background-color]="statusBg(o.status)" [style.color]="statusColor(o.status)">
                {{ statusText(o.status) }}
              </span>
            </td>
            <td>¥{{ o.amount }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card { padding: 1.5rem; }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      h2 { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--color-text-primary); }
      .link { background: none; border: none; color: var(--brand-primary); font-size: var(--text-sm); cursor: pointer; }
    }
    .table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
    .table th, .table td {
      padding: 0.625rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--color-border-light);
    }
    .table th {
      color: var(--color-text-tertiary);
      font-weight: var(--weight-medium);
      font-size: var(--text-xs);
      text-transform: uppercase;
    }
    .table tr:last-child td { border-bottom: none; }
    .status {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
    }
  `],
})
export class OrderTableComponent {
  @Input() orders: ServiceOrder[] = [];

  formatTime(d: Date | string): string {
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'MM-dd HH:mm');
  }

  statusText(s: string): string {
    return { delivered: '已送达', completed: '已完成', pending: '待处理', confirmed: '已确认', cancelled: '已取消' }[s] ?? s;
  }

  statusBg(s: string): string {
    return { delivered: 'var(--state-success-bg)', completed: 'var(--state-success-bg)', pending: 'var(--state-warning-bg)', confirmed: 'var(--state-info-bg)', cancelled: 'var(--color-bg-tertiary)' }[s] ?? 'var(--color-bg-tertiary)';
  }

  statusColor(s: string): string {
    return { delivered: 'var(--state-success)', completed: 'var(--state-success)', pending: 'var(--state-warning)', confirmed: 'var(--state-info)', cancelled: 'var(--color-text-tertiary)' }[s] ?? 'var(--color-text-secondary)';
  }
}
