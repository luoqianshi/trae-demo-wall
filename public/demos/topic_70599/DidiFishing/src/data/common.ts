import type { City, HotTag } from '../types/common';

export const cities: City[] = [
  { id: 'c_hz', name: '杭州' },
  { id: 'c_sz', name: '苏州' },
  { id: 'c_nb', name: '宁波' },
  { id: 'c_zs', name: '舟山' },
  { id: 'c_huz', name: '湖州' },
  { id: 'c_gz', name: '广州' },
  { id: 'c_sh', name: '上海' },
  { id: 'c_nj', name: '南京' }
];

export const hotTags: HotTag[] = [
  { id: 't1', name: '路亚' },
  { id: 't2', name: '台钓' },
  { id: 't3', name: '海钓' },
  { id: 't4', name: '矶钓' },
  { id: 't5', name: '筏钓' },
  { id: 't6', name: '传统钓' },
  { id: 't7', name: '翘嘴' },
  { id: 't8', name: '大物' },
  { id: 't9', name: '新手友好' },
  { id: 't10', name: '免费' }
];

export const fishingTypes = [
  { value: 'all', label: '全部钓法' },
  { value: '台钓', label: '台钓' },
  { value: '路亚', label: '路亚' },
  { value: '海钓', label: '海钓' },
  { value: '矶钓', label: '矶钓' },
  { value: '筏钓', label: '筏钓' },
  { value: '传统钓', label: '传统钓' }
];

export const dateRanges = [
  { value: 'all', label: '不限时间' },
  { value: 'week', label: '本周' },
  { value: 'weekend', label: '本周末' }
];

export const priceRanges = [
  { value: 'all', label: '不限费用' },
  { value: 'free', label: '免费' },
  { value: 'low', label: '100元以下' },
  { value: 'mid', label: '100-500元' },
  { value: 'high', label: '500元以上' }
];

export const articleCategories = [
  { value: 'all', label: '全部', color: '' },
  { value: 'tech', label: '钓技', color: 'primary' },
  { value: 'spot', label: '钓点', color: 'accent' },
  { value: 'gear', label: '装备', color: 'success' },
  { value: 'experience', label: '渔获故事', color: 'warning' }
];

export default function mockCommon() {
  return {
    code: 0,
    message: 'ok',
    data: { cities, hotTags, fishingTypes, dateRanges, priceRanges, articleCategories }
  };
}
