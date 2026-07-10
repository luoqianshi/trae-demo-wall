import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, SettingsService, NotificationService } from '@core/services';
import { FamilyMember, NotificationSettings } from '@core/models';

interface NotificationItem {
  key: keyof NotificationSettings;
  title: string;
  desc: string;
  value: boolean;
}

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  notifications: NotificationItem[] = [];
  members: FamilyMember[] = [];
  logoutDialogVisible = false;
  currentPlan = {
    name: '尊享版',
    price: 199,
    endDate: '2026-08-15',
  };

  appSettings = {
    doNotDisturb: '22:00 - 07:00',
    language: '简体中文',
    syncStatus: '自动同步',
  };

  account = {
    phoneMasked: '138****6789',
    passwordMasked: '****',
    emergencyName: '李芳',
    emergencyPhone: '139****1234',
  };

  private subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.notifications = [
      { key: 'safetyAlert', title: '安全告警通知', desc: '异常情况立即推送', value: true },
      { key: 'medicationReminder', title: '用药提醒通知', desc: '每日用药时间推送', value: true },
      { key: 'deviceOffline', title: '设备离线提醒', desc: '设备断连时推送', value: true },
      { key: 'healthAnomaly', title: '健康数据异常', desc: '数据超出正常范围时提醒', value: false },
    ];

    this.members = [
      { id: '1', name: '王淑芬', relation: '妈妈', role: 'elderly', roleLabel: '被照护人', avatarColor: '#E6A23C' },
      { id: '2', name: '张明', relation: '你', role: 'admin', roleLabel: '管理员', avatarColor: '#D4763C' },
      { id: '3', name: '李芳', relation: '妹妹', role: 'assistant', roleLabel: '协助者', avatarColor: '#5B8DC9' },
    ];

    this.settingsService.getFamilyMembers().subscribe({
      next: (m) => {
        if (m.length) {
          this.members = m;
          this.cdr.markForCheck();
        }
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  toggleNotification(item: NotificationItem): void {
    item.value = !item.value;
    this.notificationService.update({ [item.key]: item.value } as Partial<NotificationSettings>).subscribe({
      error: () => {},
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  openLogoutDialog(): void {
    this.logoutDialogVisible = true;
  }

  confirmLogout(): void {
    this.logoutDialogVisible = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
