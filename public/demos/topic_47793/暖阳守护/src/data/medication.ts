export interface Medication {
  id: string;
  name: string;
  dosage: string;
  unit: string;
  times: string[];
  reminderEnabled: boolean;
  withFood: boolean;
  notes: string;
  color: string;
  records: MedicationRecord[];
}

export interface MedicationRecord {
  id: string;
  date: string;
  time: string;
  status: 'taken' | 'missed' | 'skipped';
  takenAt?: string;
}

export const medicationList: Medication[] = [
  {
    id: '1',
    name: '硝苯地平缓释片',
    dosage: '1',
    unit: '片',
    times: ['08:00', '20:00'],
    reminderEnabled: true,
    withFood: false,
    notes: '降压药，空腹服用效果更佳',
    color: '#FF6B6B',
    records: [
      { id: 'r1', date: '2026-06-27', time: '08:00', status: 'taken', takenAt: '08:05' },
      { id: 'r2', date: '2026-06-26', time: '08:00', status: 'taken', takenAt: '08:02' },
      { id: 'r3', date: '2026-06-26', time: '20:00', status: 'taken', takenAt: '20:10' }
    ]
  },
  {
    id: '2',
    name: '阿司匹林肠溶片',
    dosage: '1',
    unit: '片',
    times: ['08:30'],
    reminderEnabled: true,
    withFood: true,
    notes: '饭后服用，保护胃肠道',
    color: '#4ECDC4',
    records: [
      { id: 'r4', date: '2026-06-27', time: '08:30', status: 'taken', takenAt: '08:32' },
      { id: 'r5', date: '2026-06-26', time: '08:30', status: 'taken', takenAt: '08:31' }
    ]
  },
  {
    id: '3',
    name: '钙尔奇D片',
    dosage: '1',
    unit: '片',
    times: ['12:00'],
    reminderEnabled: true,
    withFood: false,
    notes: '补钙，促进钙吸收',
    color: '#FFE66D',
    records: [
      { id: 'r6', date: '2026-06-27', time: '12:00', status: 'missed', takenAt: undefined }
    ]
  }
];