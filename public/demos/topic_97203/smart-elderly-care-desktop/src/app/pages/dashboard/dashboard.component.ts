import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivityService, ElderService } from '@core/services';
import { ActivityEvent, Elder } from '@core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  elder: Elder | null = null;
  events: ActivityEvent[] = [];
  dialogVisible = false;
  private subs: Subscription[] = [];

  // KPI 静态展示数据（演示用）
  kpi = {
    safety: { status: 'success' as const, value: '一切正常', note: '所有传感器运行正常' },
    health: {
      bp: '128/82',
      heart: '72 bpm',
      note: '指标在正常范围内',
    },
    medication: { taken: 3, total: 5, next: '下次用药：18:00 降压药' },
    pending: { value: 0, note: '暂无待处理事项' },
  };

  quickServices = [
    { icon: 'shop', iconBg: 'var(--brand-primary-lightest)', iconColor: 'var(--brand-primary)', title: '代点餐', desc: '为老人预订营养餐食' },
    { icon: 'skin', iconBg: 'var(--state-info-bg)', iconColor: 'var(--state-info)', title: '预约保洁', desc: '上门家政清洁服务' },
    { icon: 'medicine-box', iconBg: 'var(--state-success-bg)', iconColor: 'var(--state-success)', title: '在线问诊', desc: '视频连线专业医生' },
  ];

  constructor(
    private elderService: ElderService,
    private activityService: ActivityService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.elderService.activeElder$.subscribe((e) => {
        this.elder = e;
        this.cdr.markForCheck();
      }),
      this.activityService.events$.subscribe((events) => {
        this.events = events;
        this.cdr.markForCheck();
      })
    );
    this.elderService.loadElders().subscribe();
    this.activityService.loadEvents().subscribe();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  openActivityDialog(): void {
    this.dialogVisible = true;
  }

  formatTime(d: Date | string): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'HH:mm');
  }

  dotBg(e: ActivityEvent): string {
    if (e.severity === 'danger') return 'var(--state-error-bg)';
    if (e.severity === 'warning') return 'var(--state-warning-bg)';
    if (e.type === 'health') return 'var(--state-info-bg)';
    return 'var(--brand-primary-lightest)';
  }

  dotColor(e: ActivityEvent): string {
    if (e.severity === 'danger') return 'var(--state-error)';
    if (e.severity === 'warning') return 'var(--state-warning)';
    if (e.type === 'health') return 'var(--state-info)';
    return 'var(--brand-primary)';
  }
}
