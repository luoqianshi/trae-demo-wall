import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { DeviceService, ActivityService } from '@core/services';
import { Device, DeviceAlert, ActivityEvent } from '@core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-safety',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './safety.component.html',
  styleUrls: ['./safety.component.scss'],
})
export class SafetyComponent implements OnInit, OnDestroy {
  devices: Device[] = [];
  alerts: DeviceAlert[] = [];
  events: ActivityEvent[] = [];
  private subs: Subscription[] = [];

  // 演示数据
  readonly demoDevices: Device[] = [
    { id: 1, elderId: 1, type: 'bracelet', name: '智能手环', status: 'online', battery: 85, lastSyncAt: new Date(Date.now() - 60000), createdAt: new Date() },
    { id: 2, elderId: 1, type: 'door', name: '门磁传感器', status: 'online', battery: 92, lastSyncAt: new Date(Date.now() - 120000), createdAt: new Date() },
    { id: 3, elderId: 1, type: 'smoke', name: '烟雾报警器', status: 'online', battery: 78, lastSyncAt: new Date(Date.now() - 300000), createdAt: new Date() },
    { id: 4, elderId: 1, type: 'water', name: '水浸传感器', status: 'online', battery: 90, lastSyncAt: new Date(Date.now() - 180000), createdAt: new Date() },
    { id: 5, elderId: 1, type: 'gas', name: '燃气报警器', status: 'online', battery: 81, lastSyncAt: new Date(Date.now() - 60000), createdAt: new Date() },
    { id: 6, elderId: 1, type: 'camera', name: '客厅摄像头', status: 'online', battery: 65, lastSyncAt: new Date(), createdAt: new Date() },
  ];

  readonly demoAlerts: DeviceAlert[] = [
    { id: 1, deviceId: 5, elderId: 1, level: 'danger', title: '燃气浓度异常', description: '厨房燃气传感器检测到轻微浓度异常，请及时关注', occurredAt: new Date(Date.now() - 600000) },
    { id: 2, deviceId: 1, elderId: 1, level: 'warning', title: '心率偏高', description: '智能手环检测到心率持续高于正常值 5 分钟', occurredAt: new Date(Date.now() - 1800000) },
    { id: 3, deviceId: 2, elderId: 1, level: 'info', title: '出门提醒', description: '门磁传感器检测到大门已打开', occurredAt: new Date(Date.now() - 3600000) },
  ];

  readonly demoEvents: ActivityEvent[] = [
    { id: 1, elderId: 1, type: 'safety', title: '燃气浓度异常', description: '厨房检测到轻微异常', icon: 'warning', severity: 'danger', deviceId: null, recordedAt: new Date(Date.now() - 600000) },
    { id: 2, elderId: 1, type: 'daily', title: '检测到开门', description: '大门已打开 1 小时前', icon: 'check-circle', severity: 'info', deviceId: null, recordedAt: new Date(Date.now() - 3600000) },
    { id: 3, elderId: 1, type: 'daily', title: '活动量达标', description: '今日步数已达 1800 步', icon: 'check', severity: 'info', deviceId: null, recordedAt: new Date(Date.now() - 5400000) },
    { id: 4, elderId: 1, type: 'health', title: '心率正常', description: '智能手环检测到心率 72 bpm', icon: 'heart', severity: 'info', deviceId: null, recordedAt: new Date(Date.now() - 7200000) },
    { id: 5, elderId: 1, type: 'safety', title: '门磁检测', description: '门窗状态正常', icon: 'lock', severity: 'info', deviceId: null, recordedAt: new Date(Date.now() - 9000000) },
  ];

  constructor(
    private deviceService: DeviceService,
    private activityService: ActivityService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 加载真实数据（失败时使用演示数据）
    this.deviceService.loadDevices().subscribe({
      next: (d) => {
        this.devices = d;
        this.cdr.markForCheck();
      },
      error: () => {
        this.devices = this.demoDevices;
        this.cdr.markForCheck();
      },
    });
    this.deviceService.loadAlerts().subscribe({
      next: (a) => {
        this.alerts = a;
        this.cdr.markForCheck();
      },
      error: () => {
        this.alerts = this.demoAlerts;
        this.cdr.markForCheck();
      },
    });
    this.activityService.loadEvents().subscribe({
      next: (e) => {
        this.events = e;
        this.cdr.markForCheck();
      },
      error: () => {
        this.events = this.demoEvents;
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
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
