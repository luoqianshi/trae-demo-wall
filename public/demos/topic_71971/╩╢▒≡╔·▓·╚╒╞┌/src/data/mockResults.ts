import { DateResult } from '@/types';

export const mockResults: DateResult[] = [
  {
    id: '1',
    imageUrl: 'https://picsum.photos/id/401/300/300',
    productName: '牛奶',
    productionDate: '2026-06-15',
    shelfLife: '15天',
    shelfLifeDays: 15,
    expiryDate: '2026-06-30',
    remainingDays: 5,
    status: 'warning',
    createTime: '2026-07-05 10:30'
  },
  {
    id: '2',
    imageUrl: 'https://picsum.photos/id/292/300/300',
    productName: '面包',
    productionDate: '2026-07-03',
    shelfLife: '3天',
    shelfLifeDays: 3,
    expiryDate: '2026-07-06',
    remainingDays: 1,
    status: 'warning',
    createTime: '2026-07-05 09:15'
  },
  {
    id: '3',
    imageUrl: 'https://picsum.photos/id/570/300/300',
    productName: '食用油',
    productionDate: '2026-01-01',
    shelfLife: '1年',
    shelfLifeDays: 365,
    expiryDate: '2027-01-01',
    remainingDays: 180,
    status: 'normal',
    createTime: '2026-07-04 14:20'
  },
  {
    id: '4',
    imageUrl: 'https://picsum.photos/id/625/300/300',
    productName: '酸奶',
    productionDate: '2026-06-20',
    shelfLife: '21天',
    shelfLifeDays: 21,
    expiryDate: '2026-07-11',
    remainingDays: 6,
    status: 'warning',
    createTime: '2026-07-04 11:00'
  },
  {
    id: '5',
    imageUrl: 'https://picsum.photos/id/835/300/300',
    productName: '饼干',
    productionDate: '2025-12-01',
    shelfLife: '6个月',
    shelfLifeDays: 180,
    expiryDate: '2026-06-01',
    remainingDays: -34,
    status: 'expired',
    createTime: '2026-07-03 16:45'
  }
];

export const mockRecognitionResult = {
  productName: '示例商品',
  productionDate: '2026-06-20',
  shelfLife: '30天',
  shelfLifeDays: 30
};
