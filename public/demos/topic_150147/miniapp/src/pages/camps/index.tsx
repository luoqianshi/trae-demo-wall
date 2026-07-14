import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { campAPI } from '../../services/api';
import CampCard from '../../components/CampCard';
import EmptyState from '../../components/EmptyState';

const typeOptions = [
  { label: '全部', value: 'all' },
  { label: '单日营', value: 'single' },
  { label: '7天营', value: '7day' },
  { label: '14天营', value: '14day' },
  { label: '寒假营', value: 'winter' },
  { label: '暑假营', value: 'summer' },
  { label: '周末营', value: 'weekend' },
];

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '已发布', value: 'published' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
];

export default function Camps() {
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => { loadCamps(); }, [selectedType, selectedStatus]);

  const loadCamps = async () => {
    setLoading(true);
    try {
      const params: any = { pageSize: 50 };
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      const res: any = await campAPI.list(params);
      if (res.code === 0) setCamps(res.data.list || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  // 搜索过滤（前端过滤）
  const filteredCamps = camps.filter((camp: any) => {
    if (!searchText.trim()) return true;
    const keyword = searchText.toLowerCase();
    return (camp.name || '').toLowerCase().includes(keyword) ||
      (camp.description || '').toLowerCase().includes(keyword);
  });

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 搜索栏 */}
      <View style={{ backgroundColor: '#fff', padding: '20rpx 32rpx' }}>
        <View style={{
          display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f5',
          borderRadius: '16rpx', padding: '16rpx 24rpx',
        }}>
          <View style={{
            width: '36rpx', height: '36rpx', borderRadius: '50%', background: '#e6f4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12rpx', flexShrink: 0,
          }}>
            <Text style={{ fontSize: '20rpx', color: '#1677ff', fontWeight: 'bold' }}>S</Text>
          </View>
          <Input
            style={{ flex: 1, fontSize: '26rpx' }}
            placeholder="搜索营期名称..."
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
          {searchText && (
            <Text onClick={() => setSearchText('')} style={{ fontSize: '26rpx', color: '#8c8c8c', padding: '0 8rpx' }}>
              ✕
            </Text>
          )}
        </View>
      </View>

      {/* 类型筛选 */}
      <View style={{ backgroundColor: '#fff', padding: '0 32rpx 16rpx' }}>
        <ScrollView scrollX style={{ whiteSpace: 'nowrap' }}>
          <View style={{ display: 'flex', gap: '12rpx' }}>
            {typeOptions.map((opt) => (
              <View key={opt.value} onClick={() => setSelectedType(opt.value)} style={{
                padding: '10rpx 24rpx', borderRadius: '20rpx', fontSize: '24rpx',
                backgroundColor: selectedType === opt.value ? '#1677ff' : '#f5f5f5',
                color: selectedType === opt.value ? '#fff' : '#666',
                whiteSpace: 'nowrap', display: 'inline-block',
              }}>
                {opt.label}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 状态筛选 */}
      <View style={{ backgroundColor: '#fff', padding: '0 32rpx 20rpx' }}>
        <View style={{ display: 'flex', gap: '12rpx' }}>
          {statusOptions.map((opt) => (
            <View key={opt.value} onClick={() => setSelectedStatus(opt.value)} style={{
              padding: '8rpx 20rpx', borderRadius: '16rpx', fontSize: '22rpx',
              backgroundColor: selectedStatus === opt.value ? '#1677ff' : '#f5f5f5',
              color: selectedStatus === opt.value ? '#fff' : '#666',
            }}>
              {opt.label}
            </View>
          ))}
        </View>
      </View>

      {/* 营地列表 */}
      <ScrollView scrollY style={{ padding: '16rpx 24rpx' }} refresherEnabled onRefresherRefresh={loadCamps}>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16rpx' }}>
          <Text style={{ fontSize: '26rpx', color: '#8c8c8c' }}>
            {searchText ? `搜索"${searchText}"` : ''} 共 {filteredCamps.length} 个营期
          </Text>
        </View>

        {filteredCamps.map((camp: any) => (
          <CampCard
            key={camp.id}
            camp={camp}
            onClick={() => Taro.navigateTo({ url: `/pages/camp-detail/index?id=${camp.id}` })}
          />
        ))}

        {filteredCamps.length === 0 && !loading && (
          <EmptyState icon="C" text={searchText ? '未找到匹配的营期' : '暂无营期'} subText="敬请期待更多精彩项目" />
        )}

        <View style={{ height: '40rpx' }} />
      </ScrollView>
    </View>
  );
}