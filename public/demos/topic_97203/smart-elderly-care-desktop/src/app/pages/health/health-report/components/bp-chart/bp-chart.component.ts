import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { HealthRecord } from '@core/models';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-bp-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div echarts [options]="chartOptions" class="chart"></div>`,
  styles: [`
    :host { display: block; width: 100%; height: 280px; }
    .chart { width: 100%; height: 100%; }
  `],
})
export class BpChartComponent implements OnChanges {
  @Input() data: HealthRecord[] = [];
  @Input() period: 'week' | 'month' | 'quarter' = 'week';

  chartOptions: EChartsOption = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['period']) {
      this.chartOptions = this.buildOptions();
    }
  }

  private buildOptions(): EChartsOption {
    const dates = this.data.map((d) => d.recordDate);
    const systolic = this.data.map((d) => d.systolicBP);
    const diastolic = this.data.map((d) => d.diastolicBP);
    return {
      color: ['#D4763C', '#E89B6A'],
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['收缩压', '舒张压'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#E8DDD4' } } },
      yAxis: { type: 'value', min: 60, max: 200, splitLine: { lineStyle: { color: '#F0E8E0' } } },
      series: [
        { name: '收缩压', type: 'bar', data: systolic, barWidth: '32%' },
        { name: '舒张压', type: 'bar', data: diastolic, barWidth: '32%' },
      ],
    };
  }
}
