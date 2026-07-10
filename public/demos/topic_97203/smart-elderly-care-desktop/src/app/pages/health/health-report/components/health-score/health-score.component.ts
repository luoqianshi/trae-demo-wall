import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-health-score',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card card-hover">
      <div class="score-card">
        <div class="left">
          <div class="label">本周健康评分</div>
          <div class="score">{{ totalScore }}<span class="unit">分</span></div>
          <div class="trend">
            <span nz-icon nzType="rise" nzTheme="outline"></span>
            较上周 +3 分
          </div>
        </div>
        <div class="right">
          <div *ngFor="let item of items" class="metric">
            <div class="metric-head">
              <span class="metric-name">{{ item.name }}</span>
              <span class="metric-value">{{ item.value }}</span>
            </div>
            <div class="progress">
              <div class="progress-fill" [style.width.%]="item.value"
                [style.background-color]="item.color"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card { padding: 1.5rem; }
    .score-card {
      display: flex;
      gap: 2rem;
    }
    .left {
      flex: 0 0 auto;
      text-align: center;
      padding-right: 2rem;
      border-right: 1px solid var(--color-border-light);
    }
    .label {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin-bottom: 0.5rem;
    }
    .score {
      font-size: 4rem;
      font-weight: var(--weight-bold);
      color: var(--brand-primary);
      line-height: 1;
      .unit { font-size: 1.5rem; color: var(--color-text-tertiary); margin-left: 0.25rem; }
    }
    .trend {
      margin-top: 0.75rem;
      font-size: var(--text-xs);
      color: var(--state-success);
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .right {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      align-content: center;
    }
    .metric-head {
      display: flex;
      justify-content: space-between;
      font-size: var(--text-xs);
      margin-bottom: 0.375rem;
    }
    .metric-name { color: var(--color-text-secondary); }
    .metric-value { font-weight: var(--weight-semibold); color: var(--color-text-primary); }
    .progress {
      height: 6px;
      background: var(--color-bg-tertiary);
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width var(--transition-base);
    }
  `],
})
export class HealthScoreComponent {
  @Input() totalScore = 0;
  @Input() bpScore = 0;
  @Input() bsScore = 0;
  @Input() activityScore = 0;
  @Input() medicationAdherence = 0;

  get items() {
    return [
      { name: '血压控制', value: this.bpScore, color: '#D4763C' },
      { name: '血糖控制', value: this.bsScore, color: '#5B8DC9' },
      { name: '运动达标', value: this.activityScore, color: '#4A9D6E' },
      { name: '用药依从', value: this.medicationAdherence, color: '#E89B6A' },
    ];
  }
}
