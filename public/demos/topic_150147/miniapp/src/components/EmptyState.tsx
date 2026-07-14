import { View, Text, Image } from '@tarojs/components';

interface EmptyStateProps {
  icon?: string;
  text?: string;
  subText?: string;
}

export default function EmptyState({ icon = '--', text = '暂无数据', subText }: EmptyStateProps) {
  return (
    <View style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80rpx 40rpx',
    }}>
      <Text style={{ fontSize: '80rpx', marginBottom: '24rpx' }}>{icon}</Text>
      <Text style={{ fontSize: '28rpx', color: '#8c8c8c', marginBottom: '8rpx' }}>{text}</Text>
      {subText && <Text style={{ fontSize: '22rpx', color: '#bfbfbf' }}>{subText}</Text>}
    </View>
  );
}