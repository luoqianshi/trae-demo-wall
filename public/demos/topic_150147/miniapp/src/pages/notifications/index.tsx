import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { notificationAPI } from '../../services/api';

const typeLabels: Record<string, string> = {
  system: '系统通知', task: '任务提醒', camp: '营期通知', certificate: '证书通知',
  review: '评审通知', enrollment: '报名通知',
};
const typeColors: Record<string, string> = {
  system: '#8c8c8c', task: '#1677ff', camp: '#52c41a', certificate: '#722ed1',
  review: '#fa8c16', enrollment: '#13c2c2',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => { loadNotifications(); }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res: any = await notificationAPI.getMy({
        pageSize: 50,
        is_read: filter === 'unread' ? 0 : undefined,
      });
      if (res.code === 0) {
        setNotifications(res.data?.list || res.data || []);
      }
    } catch (err: any) {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    }
    setLoading(false);
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
    } catch { /* 静默处理 */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      Taro.showToast({ title: '已全部标记为已读', icon: 'success' });
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <ScrollView scrollY style={{ height: '100vh' }} refresherEnabled onRefresherRefresh={loadNotifications}>
      <View style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* 顶部筛选 */}
        <View style={{
          backgroundColor: '#fff', padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <View style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: '全部', value: 'all' },
              { label: `未读 (${unreadCount})`, value: 'unread' },
            ].map((opt) => (
              <View key={opt.value} onClick={() => setFilter(opt.value as any)} style={{
                padding: '6px 14px', borderRadius: '16px', fontSize: '13px',
                backgroundColor: filter === opt.value ? '#1677ff' : '#f5f5f5',
                color: filter === opt.value ? '#fff' : '#666',
              }}>
                {opt.label}
              </View>
            ))}
          </View>
          {unreadCount > 0 && (
            <Text onClick={handleMarkAllRead} style={{ fontSize: '13px', color: '#1677ff' }}>
              全部已读
            </Text>
          )}
        </View>

        {/* 通知列表 */}
        <View style={{ padding: '12px 16px' }}>
          {notifications.length === 0 && !loading ? (
            <View style={{ textAlign: 'center', padding: '80px 0', color: '#8c8c8c' }}>
              <Text style={{ display: 'block', fontSize: '16px' }}>暂无通知</Text>
            </View>
          ) : (
            notifications.map((item: any) => (
              <View key={item.id} onClick={() => handleMarkRead(item.id)} style={{
                backgroundColor: item.is_read ? '#fff' : '#f0f5ff',
                borderRadius: '12px', padding: '14px 16px', marginBottom: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                position: 'relative',
              }}>
                {/* 未读标记 */}
                {!item.is_read && (
                  <View style={{
                    position: 'absolute', top: '14px', right: '14px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: '#ff4d4f',
                  }} />
                )}
                <View style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <View style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                    backgroundColor: (typeColors[item.type] || '#8c8c8c') + '18',
                    color: typeColors[item.type] || '#8c8c8c',
                  }}>
                    {typeLabels[item.type] || item.type || '通知'}
                  </View>
                </View>
                <Text style={{
                  fontSize: '14px', color: item.is_read ? '#666' : '#1a1a1a',
                  fontWeight: item.is_read ? 'normal' : '500',
                  display: 'block', lineHeight: '20px',
                }}>
                  {item.title || item.message}
                </Text>
                {item.content && (
                  <Text style={{ fontSize: '13px', color: '#8c8c8c', display: 'block', marginTop: '4px' }}>
                    {item.content.length > 60 ? item.content.slice(0, 60) + '...' : item.content}
                  </Text>
                )}
                <Text style={{ fontSize: '11px', color: '#bfbfbf', display: 'block', marginTop: '8px' }}>
                  {item.created_at}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}