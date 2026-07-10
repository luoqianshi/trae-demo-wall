import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { HealthRecord } from '@core/models';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-bs-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div echarts [options]="chartOptions" class="chart"></div>`,
  styles: [`
    :host { display: block; width: 100%; height: 280px; }
    .chart { width: 100%; height: 100%; }
  `],
})
export class BsChartComponent implements OnChanges {
  @Input() data: HealthRecord[] = [];

  chartOptions: EChartsOption = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.chartOptions = this.buildOptions();
    }
  }

  private buildOptions(): EChartsOption {
    const dates = this.data.map((d) => d.recordDate);
    const sugar = this.data.map((d) => d.bloodSugar);
    return {
      color: ['#5B8DC9'],
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '6%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#E8DDD4' } } },
      yAxis: { type: 'value', min: 3, max: 10, splitLine: { lineStyle: { color: '#F0E8E0' } } },
      series: [{ name: '血糖', type: 'bar', data: sugar, barWidth: '40%', itemStyle: { borderRadius: [4, 4, 0, 0] } }],
    };
  }
}
