import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { WebSocketService } from '@core/services/websocket.service';
import { AuthService } from '@core/services/auth.service';

const TITLE_MAP: Record<string, string> = {
  '/dashboard': '首页概览',
  '/safety': '安全守护',
  '/health': '健康管理',
  '/health/report': '健康报告',
  '/services': '生活服务',
  '/family': '情感陪伴',
  '/settings': '个人设置',
  '/settings/add-member': '添加家庭成员',
  '/settings/change-phone': '修改手机号',
  '/settings/change-password': '修改密码',
  '/settings/edit-emergency': '编辑紧急联系人',
  '/settings/subscription': '管理订阅',
};

const KEY_MAP: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/safety': 'safety',
  '/health': 'health',
  '/health/report': 'health',
  '/services': 'services',
  '/family': 'family',
  '/settings': 'settings',
  '/settings/add-member': 'settings',
  '/settings/change-phone': 'settings',
  '/settings/change-password': 'settings',
  '/settings/edit-emergency': 'settings',
  '/settings/subscription': 'settings',
};

@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  pageTitle = '';
  activeKey = '';
  private routerSub: Subscription | null = null;

  constructor(
    private router: Router,
    private ws: WebSocketService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.ws.connect();
    }
    this.updateMeta(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => this.updateMeta((e as NavigationEnd).urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.ws.disconnect();
  }

  private updateMeta(url: string): void {
    const path = url.split('?')[0];
    this.pageTitle = TITLE_MAP[path] ?? '云守护';
    this.activeKey = KEY_MAP[path] ?? '';
    this.cdr.markForCheck();
  }
}
