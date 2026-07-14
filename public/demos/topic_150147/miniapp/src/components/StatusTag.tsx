import Taro from '@tarojs/taro';
import { View, Text, Tag } from '@tarojs/components';
import './StatusTag.css';

interface StatusTagProps {
  status: string;
  type?: 'camp' | 'task' | 'submission' | 'enrollment' | 'payment';
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  // 营地状态
  draft: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5' },
  published: { label: '已发布', color: '#1677ff', bg: '#e6f4ff' },
  in_progress: { label: '进行中', color: '#52c41a', bg: '#f6ffed' },
  completed: { label: '已完成', color: '#389e0d', bg: '#f6ffed' },
  cancelled: { label: '已取消', color: '#ff4d4f', bg: '#fff2f0' },
  // 任务状态
  pending: { label: '待提交', color: '#fa8c16', bg: '#fff7e6' },
  submitted: { label: '已提交', color: '#1677ff', bg: '#e6f4ff' },
  reviewed: { label: '已评分', color: '#52c41a', bg: '#f6ffed' },
  returned: { label: '已退回', color: '#ff4d4f', bg: '#fff2f0' },
  // 支付/报名状态
  unpaid: { label: '未支付', color: '#fa8c16', bg: '#fff7e6' },
  paid: { label: '已支付', color: '#52c41a', bg: '#f6ffed' },
  confirmed: { label: '已确认', color: '#1677ff', bg: '#e6f4ff' },
};

export default function StatusTag({ status, type = 'task' }: StatusTagProps) {
  const config = statusConfig[status] || { label: status, color: '#8c8c8c', bg: '#f5f5f5' };
  return (
    <View className="status-tag" style={{ backgroundColor: config.bg, borderColor: config.color }}>
      <Text style={{ color: config.color, fontSize: '22rpx', lineHeight: 1 }}>{config.label}</Text>
    </View>
  );
}