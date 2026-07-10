import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { HealthService } from '@core/services';
import { HealthRecord } from '@core/models';
import { Location } from '@angular/common';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-health-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './health-report.component.html',
  styleUrls: ['./health-report.component.scss'],
})
export class HealthReportComponent implements OnInit, OnDestroy {
  period: 'week' | 'month' | 'quarter' = 'week';
  bpData: HealthRecord[] = [];
  bsData: HealthRecord[] = [];

  score = {
    total: 87,
    bp: 72,
    bs: 91,
    activity: 85,
    medication: 96,
  };

  sleep = {
    bedTime: '22:30',
    wakeTime: '06:15',
    deepSleep: '1h 45min',
    steps: '8240',
    activeMinutes: 145,
  };

  advice = [
    '血压近期偏高，建议按时服用降压药，限制盐分摄入',
    '继续保持规律运动，建议每天散步30分钟以上',
    '辛伐他汀服药依从性略低，可设置固定时间提醒',
  ];

  medicationAdherence = [
    { id: '1', name: '硝苯地平', frequency: '每日1次', total: 7, taken: 7, rate: 100 },
    { id: '2', name: '二甲双胍', frequency: '每日2次', total: 14, taken: 13, rate: 93 },
    { id: '3', name: '阿司匹林', frequency: '每日1次', total: 7, taken: 7, rate: 100 },
    { id: '4', name: '辛伐他汀', frequency: '每日1次', total: 7, taken: 6, rate: 86 },
    { id: '5', name: '维生素D', frequency: '每日1次', total: 7, taken: 7, rate: 100 },
  ];

  private subs: Subscription[] = [];

  constructor(
    private health: HealthService,
    private location: Location,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  setPeriod(p: 'week' | 'month' | 'quarter'): void {
    this.period = p;
    this.loadChartData();
  }

  back(): void { this.location.back(); }

  exportPdf(): void { this.message.info('PDF 导出中...'); }
  shareToDoctor(): void { this.message.info('分享给医生...'); }

  private loadChartData(): void {
    // 模拟数据：当前周期内的 7 天
    this.zone.runOutsideAngular(() => {
      const generateData = (): HealthRecord[] => {
        const data: HealthRecord[] = [];
        const today = new Date();
        const days = this.period === 'week' ? 7 : this.period === 'month' ? 30 : 90;
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          data.push({
            id: i,
            elderId: 1,
            recordDate: d.toISOString().slice(0, 10),
            systolicBP: 130 + Math.round(Math.sin(i / 2) * 10 + Math.random() * 6),
            diastolicBP: 82 + Math.round(Math.cos(i / 2) * 5 + Math.random() * 4),
            heartRate: 70 + Math.round(Math.random() * 8),
            bloodSugar: 5.5 + Math.random() * 0.8,
            weight: 62,
            steps: 7000 + Math.round(Math.random() * 2500),
            activeMinutes: 120 + Math.round(Math.random() * 60),
            sleepStart: '22:30',
            sleepEnd: '06:15',
            deepSleepMinutes: 100 + Math.round(Math.random() * 30),
            createdAt: d,
          });
        }
        return data;
      };

      const data = generateData();
      this.bpData = data;
      this.bsData = data;
      this.zone.run(() => this.cdr.markForCheck());
    });
  }
}
