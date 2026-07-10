import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Device, DeviceStatus } from '@core/models';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

@Component({
  selector: 'app-device-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card card-hover device-card">
      <div class="device-header">
        <div class="device-icon" [style.background-color]="bgColor" [style.color]="iconColor">
          <span nz-icon [nzType]="iconName" nzTheme="outline"></span>
        </div>
        <div class="status-pill" [style.background-color]="statusBg" [style.color]="statusColor">
          <span class="status-dot" [style.background-color]="statusColor"></span>
          {{ statusText }}
        </div>
      </div>
      <div class="device-name">{{ device.name }}</div>
      <div class="device-meta">
        <div class="meta-row">
          <span class="meta-label">电量</span>
          <div class="battery">
            <div class="battery-bar">
              <div class="battery-fill" [style.width.%]="(device.battery ?? 0)"
                [style.background-color]="(device.battery ?? 0) > 20 ? 'var(--state-success)' : 'var(--state-error)'"></div>
            </div>
            <span class="battery-text">{{ device.battery ?? 0 }}%</span>
          </div>
        </div>
        <div class="meta-row">
          <span class="meta-label">最后同步</span>
          <span class="meta-value">{{ fromNow(device.lastSyncAt) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .device-card { padding: 1.25rem; }
    .device-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .device-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .device-name {
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
      color: var(--color-text-primary);
      margin-bottom: 0.75rem;
    }
    .device-meta { display: flex; flex-direction: column; gap: 0.5rem; }
    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: var(--text-xs);
    }
    .meta-label { color: var(--color-text-tertiary); }
    .meta-value { color: var(--color-text-secondary); }
    .battery {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .battery-bar {
      width: 60px;
      height: 6px;
      background: var(--color-bg-tertiary);
      border-radius: 9999px;
      overflow: hidden;
    }
    .battery-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width var(--transition-base);
    }
    .battery-text {
      font-weight: var(--weight-medium);
      color: var(--color-text-primary);
    }
  `],
})
export class DeviceCardComponent {
  @Input() device!: Device;

  get iconName(): string {
    return {
      bracelet: 'mobile',
      door: 'border',
      smoke: 'fire',
      water: 'cloud',
      gas: 'experiment',
      camera: 'video-camera',
    }[this.device.type] || 'desktop';
  }

  get bgColor(): string {
    return {
      bracelet: 'var(--brand-primary-lightest)',
      door: 'var(--state-info-bg)',
      smoke: 'var(--state-error-bg)',
      water: 'var(--state-info-bg)',
      gas: 'var(--state-warning-bg)',
      camera: 'var(--state-success-bg)',
    }[this.device.type] || 'var(--color-bg-tertiary)';
  }

  get iconColor(): string {
    return {
      bracelet: 'var(--brand-primary)',
      door: 'var(--state-info)',
      smoke: 'var(--state-error)',
      water: 'var(--state-info)',
      gas: 'var(--state-warning)',
      camera: 'var(--state-success)',
    }[this.device.type] || 'var(--color-text-secondary)';
  }

  get statusText(): string {
    return {
      online: '在线',
      offline: '离线',
      alert: '告警',
    }[this.device.status] || '未知';
  }

  get statusBg(): string {
    return {
      online: 'var(--state-success-bg)',
      offline: 'var(--color-bg-tertiary)',
      alert: 'var(--state-error-bg)',
    }[this.device.status] || 'var(--color-bg-tertiary)';
  }

  get statusColor(): string {
    return {
      online: 'var(--state-success)',
      offline: 'var(--color-text-tertiary)',
      alert: 'var(--state-error)',
    }[this.device.status] || 'var(--color-text-tertiary)';
  }

  fromNow(d: Date | string | null): string {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    const txt = formatDistanceToNow(date, { addSuffix: false, locale: zhCN });
    return `${txt}前`;
  }
}
