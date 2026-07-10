import { Component, ChangeDetectionStrategy, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { WebSocketService } from '@core/services/websocket.service';
import { DeviceAlert } from '@core/models';
import { DeviceService } from '@core/services/device.service';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() activeKey: string = '';
  private wsSub: Subscription | null = null;

  readonly navItems = [
    { key: 'dashboard', icon: 'dashboard', label: '首页概览' },
    { key: 'safety', icon: 'safety', label: '安全守护' },
    { key: 'health', icon: 'heart', label: '健康管理' },
    { key: 'services', icon: 'customer-service', label: '生活服务' },
    { key: 'family', icon: 'message', label: '情感陪伴' },
  ];

  readonly systemItems = [
    { key: 'settings', icon: 'setting', label: '个人设置' },
  ];

  constructor(private ws: WebSocketService, private deviceService: DeviceService) {}

  ngOnInit(): void {
    this.wsSub = this.ws.onDeviceAlert().subscribe((alert: DeviceAlert) => {
      this.deviceService.pushAlert(alert);
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }
}
