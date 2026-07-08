import type { HealthData, HealthTrend } from '@/types';

export const healthDataList: HealthData[] = [
  {
    id: '1',
    type: 'heartRate',
    value: 72,
    unit: '次/分',
    status: 'normal',
    time: '2026-06-27 09:30'
  },
  {
    id: '2',
    type: 'bloodPressure',
    value: 125,
    unit: '/85 mmHg',
    status: 'normal',
    time: '2026-06-27 09:30'
  },
  {
    id: '3',
    type: 'sleep',
    value: 7.5,
    unit: '小时',
    status: 'normal',
    time: '2026-06-27 06:00'
  }
];

export const heartRateTrend: HealthTrend[] = [
  { date: '6/21', value: 75 },
  { date: '6/22', value: 70 },
  { date: '6/23', value: 73 },
  { date: '6/24', value: 78 },
  { date: '6/25', value: 71 },
  { date: '6/26', value: 74 },
  { date: '6/27', value: 72 }
];

export const bloodPressureTrend: HealthTrend[] = [
  { date: '6/21', value: 128 },
  { date: '6/22', value: 120 },
  { date: '6/23', value: 125 },
  { date: '6/24', value: 130 },
  { date: '6/25', value: 122 },
  { date: '6/26', value: 126 },
  { date: '6/27', value: 125 }
];

export const sleepTrend: HealthTrend[] = [
  { date: '6/21', value: 6.5 },
  { date: '6/22', value: 7.2 },
  { date: '6/23', value: 7.0 },
  { date: '6/24', value: 6.8 },
  { date: '6/25', value: 7.5 },
  { date: '6/26', value: 7.1 },
  { date: '6/27', value: 7.5 }
];