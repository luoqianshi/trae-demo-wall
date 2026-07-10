import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

export interface MedicationAdherence {
  id: string;
  name: string;
  frequency: string;
  total: number;
  taken: number;
  rate: number;
}

@Component({
  selector: 'app-medication-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-header">
        <h2>用药依从性</h2>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>药品</th>
            <th>频率</th>
            <th>应服</th>
            <th>已服</th>
            <th>依从率</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of medications">
            <td>{{ item.name }}</td>
            <td>{{ item.frequency }}</td>
            <td>{{ item.total }}</td>
            <td>{{ item.taken }}</td>
            <td>
              <div class="rate-cell">
                <div class="rate-bar">
                  <div class="rate-fill" [style.width.%]="item.rate"
                    [style.background-color]="rateColor(item.rate)"></div>
                </div>
                <span [style.color]="rateColor(item.rate)">{{ item.rate }}%</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card { padding: 1.5rem; }
    .card-header { margin-bottom: 1rem; h2 { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--color-text-primary); } }
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-sm);
      th, td { padding: 0.625rem 0.75rem; text-align: left; border-bottom: 1px solid var(--color-border-light); }
      th { color: var(--color-text-tertiary); font-weight: var(--weight-medium); font-size: var(--text-xs); text-transform: uppercase; }
      tr:last-child td { border-bottom: none; }
    }
    .rate-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .rate-bar {
      width: 80px;
      height: 6px;
      border-radius: 9999px;
      background: var(--color-bg-tertiary);
      overflow: hidden;
    }
    .rate-fill {
      height: 100%;
      border-radius: 9999px;
    }
  `],
})
export class MedicationTableComponent {
  @Input() medications: MedicationAdherence[] = [];

  rateColor(rate: number): string {
    if (rate >= 95) return 'var(--state-success)';
    if (rate >= 80) return 'var(--state-warning)';
    return 'var(--state-error)';
  }
}
