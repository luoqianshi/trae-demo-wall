export type ActivityType = 'daily' | 'health' | 'safety';
export type ActivitySeverity = 'info' | 'warning' | 'danger';

export interface ActivityEvent {
  id: number;
  elderId: number;
  type: ActivityType;
  title: string;
  description: string;
  icon: string | null;
  severity: ActivitySeverity;
  recordedAt: Date;
  deviceId: number | null;
}
