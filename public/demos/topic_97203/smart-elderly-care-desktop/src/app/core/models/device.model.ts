export type DeviceType = 'bracelet' | 'door' | 'smoke' | 'water' | 'gas' | 'camera';
export type DeviceStatus = 'online' | 'offline' | 'alert';

export interface Device {
  id: number;
  elderId: number;
  type: DeviceType;
  name: string;
  status: DeviceStatus;
  battery: number | null;
  lastSyncAt: Date | null;
  createdAt: Date;
}

export interface DeviceAlert {
  id: number;
  deviceId: number | null;
  elderId: number;
  level: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
  occurredAt: Date;
}
