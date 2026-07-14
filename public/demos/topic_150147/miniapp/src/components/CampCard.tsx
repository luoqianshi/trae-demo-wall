import { View, Text, Image } from '@tarojs/components';
import StatusTag from './StatusTag';

interface CampCardProps {
  camp: any;
  onClick?: () => void;
}

const typeLabels: Record<string, string> = {
  single: '单日营', '7day': '7天营', '14day': '14天营',
  winter: '寒假营', summer: '暑假营', weekend: '周末营',
};
const typeColors: Record<string, string> = {
  single: '#1677ff', '7day': '#722ed1', '14day': '#eb2f96',
  winter: '#13c2c2', summer: '#fa8c16', weekend: '#52c41a',
};
const gradeLevelLabels: Record<string, string> = {
  elementary: '小学', middle: '初中', high: '高中',
  undergraduate: '本科', graduate: '研究生',
};
const gradeLevelColors: Record<string, string> = {
  elementary: '#52c41a', middle: '#1677ff', high: '#722ed1',
  undergraduate: '#fa8c16', graduate: '#f5222d',
};

export default function CampCard({ camp, onClick }: CampCardProps) {
  return (
    <View className="camp-card" onClick={onClick}>
      {/* 头部：名称 + 类型 */}
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12rpx' }}>
        <View style={{ flex: 1, marginRight: '16rpx' }}>
          <Text style={{ fontSize: '30rpx', fontWeight: 600, color: '#1a1a1a', lineHeight: '42rpx' }}>
            {camp.name}
          </Text>
        </View>
        <View style={{
          padding: '4rpx 14rpx', borderRadius: '8rpx', fontSize: '22rpx',
          backgroundColor: (typeColors[camp.type] || '#8c8c8c') + '18',
          color: typeColors[camp.type] || '#8c8c8c',
          whiteSpace: 'nowrap',
        }}>
          {typeLabels[camp.type] || camp.type}
        </View>
      </View>

      {/* 标签行 */}
      <View style={{ display: 'flex', gap: '10rpx', flexWrap: 'wrap', marginBottom: '12rpx' }}>
        {camp.template_grade_level && (
          <View style={{ fontSize: '20rpx', padding: '2rpx 10rpx', borderRadius: '6rpx',
            backgroundColor: (gradeLevelColors[camp.template_grade_level] || '#8c8c8c') + '15',
            color: gradeLevelColors[camp.template_grade_level] || '#8c8c8c',
          }}>
            {gradeLevelLabels[camp.template_grade_level] || camp.template_grade_level}
          </View>
        )}
        {camp.template_difficulty && (
          <View style={{ fontSize: '20rpx', padding: '2rpx 10rpx', borderRadius: '6rpx',
            backgroundColor: '#f0f5ff', color: '#1677ff',
          }}>
            {camp.template_difficulty === 'beginner' ? '入门' : camp.template_difficulty === 'intermediate' ? '进阶' : '高级'}
          </View>
        )}
        <StatusTag status={camp.status} type="camp" />
      </View>

      {/* 描述 */}
      {camp.description && (
        <Text style={{ fontSize: '24rpx', color: '#8c8c8c', lineHeight: '36rpx', marginBottom: '12rpx', display: 'block' }}>
          {camp.description.length > 60 ? camp.description.slice(0, 60) + '...' : camp.description}
        </Text>
      )}

      {/* 底部信息 */}
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '22rpx', color: '#8c8c8c' }}>
        <Text>{camp.start_date} ~ {camp.end_date}</Text>
        <View style={{ display: 'flex', gap: '16rpx' }}>
          <Text>P {camp.enrollment_count || 0}/{camp.max_students}</Text>
          <Text style={{ color: camp.price > 0 ? '#f5222d' : '#52c41a', fontWeight: camp.price > 0 ? 500 : 400 }}>
            {camp.price > 0 ? `¥${camp.price}` : '免费'}
          </Text>
        </View>
      </View>
    </View>
  );
}