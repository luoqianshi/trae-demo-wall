import { View, Text } from '@tarojs/components';
import StatusTag from './StatusTag';

interface TaskCardProps {
  task: any;
  onClick?: () => void;
  showSubmissionStatus?: boolean;
}

const taskTypeLabels: Record<string, string> = {
  research: '调研', discussion: '讨论', creation: '创作',
  submission: '提交', defense: '答辩', normal: '普通',
};

export default function TaskCard({ task, onClick, showSubmissionStatus }: TaskCardProps) {
  return (
    <View className="task-card" onClick={onClick} style={{
      padding: '24rpx', marginBottom: '16rpx', borderRadius: '16rpx',
      backgroundColor: '#fff', boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.06)',
    }}>
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10rpx' }}>
        <View style={{ flex: 1, marginRight: '16rpx' }}>
          <Text style={{ fontSize: '28rpx', fontWeight: 500, color: '#1a1a1a' }}>{task.title}</Text>
        </View>
        <View style={{ display: 'flex', gap: '8rpx', alignItems: 'center' }}>
          <View style={{ fontSize: '20rpx', padding: '2rpx 10rpx', borderRadius: '6rpx',
            backgroundColor: '#f0f5ff', color: '#1677ff',
          }}>
            {taskTypeLabels[task.task_type] || task.task_type}
          </View>
          {showSubmissionStatus && task.submission_status && (
            <StatusTag status={task.submission_status} type="submission" />
          )}
        </View>
      </View>

      {task.description && (
        <Text style={{ fontSize: '24rpx', color: '#8c8c8c', lineHeight: '34rpx', display: 'block', marginBottom: '10rpx' }}>
          {task.description}
        </Text>
      )}

      <View style={{ display: 'flex', justifyContent: 'space-between', fontSize: '22rpx', color: '#8c8c8c' }}>
        {task.deadline && <Text>截止: {task.deadline}</Text>}
        <View style={{ display: 'flex', gap: '16rpx' }}>
          {task.max_score && <Text>满分: {task.max_score}分</Text>}
          {task.score !== undefined && task.score !== null && (
            <Text style={{ color: '#52c41a', fontWeight: 500 }}>得分: {task.score}</Text>
          )}
        </View>
      </View>
    </View>
  );
}