export interface HealthRecord {
  id: number;
  elderId: number;
  recordDate: string;
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  bloodSugar: number | null;
  weight: number | null;
  steps: number | null;
  activeMinutes: number | null;
  sleepStart: string | null;
  sleepEnd: string | null;
  deepSleepMinutes: number | null;
  createdAt: Date;
}

export type HealthMetricType = 'bp' | 'heartRate' | 'bloodSugar' | 'weight';

export interface HealthMetric {
  type: HealthMetricType;
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
  trend: 'up' | 'down' | 'flat';
}

export interface HealthReport {
  elderId: number;
  totalScore: number;
  bpScore: number;
  bsScore: number;
  activityScore: number;
  medicationAdherence: number;
  bpTrend: HealthRecord[];
  bsTrend: HealthRecord[];
  medications: { id: number; name: string; total: number; taken: number; rate: number }[];
  advice: string[];
}
