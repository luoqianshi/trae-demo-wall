import React, { useState, useEffect } from 'react';

interface ReminderItem {
  id: string;
  type: 'vaccine' | 'feeding' | 'milestone' | 'checkup';
  icon: string;
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
}

const ReminderBar: React.FC = () => {
  // 从localStorage读取宝宝信息计算提醒
  // 根据月龄显示：
  // - 疫苗提醒：下次该打的疫苗
  // - 里程碑提醒：本月应该达成的里程碑
  // - 喂养提醒：距离上次喂养超过3小时
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 计算逻辑...
    const items: ReminderItem[] = [];
    
    // 检查疫苗
    const vaccines = JSON.parse(localStorage.getItem('wdhr_vaccines') || '[]');
    const pendingVaccine = vaccines.find((v: { status?: string; vaccineId?: string }) => v.status === 'pending');
    if (pendingVaccine) {
      items.push({
        id: 'vaccine_' + pendingVaccine.vaccineId,
        type: 'vaccine',
        icon: '💉',
        title: '疫苗接种提醒',
        message: `${pendingVaccine.name} 第${pendingVaccine.dose}针 该接种了`,
        actionText: '去记录',
        actionUrl: '/vaccine',
        priority: 'high',
      });
    }

    // 检查喂养间隔
    const records = JSON.parse(localStorage.getItem('wdhr_records') || '[]');
    const feedingRecords = records.filter((r: { type?: string }) => r.type === 'feeding');
    if (feedingRecords.length > 0) {
      const lastFeeding = new Date(feedingRecords[0].date + 'T' + feedingRecords[0].time);
      const hoursSince = (Date.now() - lastFeeding.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 4) {
        items.push({
          id: 'feeding_reminder',
          type: 'feeding',
          icon: '🍼',
          title: '喂养提醒',
          message: `距离上次喂奶已 ${Math.floor(hoursSince)} 小时`,
          actionText: '去记录',
          actionUrl: '/record',
          priority: 'medium',
        });
      }
    }

    setReminders(items);
  }, []);

  const activeReminders = reminders.filter(r => !dismissed.has(r.id));
  
  if (activeReminders.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '12px 16px', color: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '1200px', margin: '0 auto' }}>
        <span style={{ fontSize: '20px' }}>{activeReminders[0].icon}</span>
        <div style={{ flex: 1 }}>
          <strong>{activeReminders[0].title}</strong>
          <span style={{ marginLeft: '8px', opacity: 0.9 }}>{activeReminders[0].message}</span>
        </div>
        {activeReminders[0].actionText && (
          <a href={activeReminders[0].actionUrl} style={{
            background: 'rgba(255,255,255,0.2)', padding: '4px 12px',
            borderRadius: '12px', color: '#fff', textDecoration: 'none', fontSize: '13px'
          }}>{activeReminders[0].actionText}</a>
        )}
        <button onClick={() => {
          const next = new Set(dismissed); next.add(activeReminders[0].id); setDismissed(next);
        }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>✕</button>
      </div>
    </div>
  );
};

export default ReminderBar;
