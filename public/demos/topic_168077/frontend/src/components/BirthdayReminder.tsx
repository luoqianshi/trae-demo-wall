import React, { useEffect, useState } from 'react';
import { Badge, Tooltip, Popover, List, Tag, Spin } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import { birthdayAPI } from '../api/client';
import { childAPI } from '../api/client';

interface UpcomingBirthday {
  birthday: string;
  age: number;
  next_birthday: string;
  days_until: number;
  name?: string;
}

export default function BirthdayReminder() {
  const [upcoming, setUpcoming] = useState<UpcomingBirthday[]>([]);
  const [loading, setLoading] = useState(false);
  const [isToday, setIsToday] = useState(false);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    setLoading(true);
    try {
      const childRes = await childAPI.list();
      const children = childRes.data as any[];
      if (children.length === 0) return;

      const birthdays = children
        .filter((c: any) => c.birthday)
        .map((c: any) => c.birthday);

      if (birthdays.length === 0) return;

      const res = await birthdayAPI.upcoming(birthdays);
      const items = res.data as UpcomingBirthday[];

      // Merge child names
      const named = items.map((item: UpcomingBirthday) => {
        const child = children.find((c: any) => c.birthday === item.birthday);
        return { ...item, name: child?.name || '未知' };
      });

      setUpcoming(named);
      setIsToday(named.some((item: UpcomingBirthday) => item.days_until === 0));
    } catch {
      // Silent fail - birthday service may not be running
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div style={{ minWidth: 220 }}>
      {loading ? (
        <Spin size="small" />
      ) : upcoming.length === 0 ? (
        <div style={{ color: '#999', padding: 8 }}>暂无生日数据</div>
      ) : (
        <List
          size="small"
          dataSource={upcoming}
          renderItem={(item: UpcomingBirthday) => (
            <List.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span>
                  <GiftOutlined style={{ color: '#ff6b6b', marginRight: 6 }} />
                  {item.name}
                </span>
                <span>
                  {item.days_until === 0 ? (
                    <Tag color="red">今天! 🎉</Tag>
                  ) : item.days_until <= 7 ? (
                    <Tag color="orange">{item.days_until}天后</Tag>
                  ) : (
                    <Tag>{item.days_until}天后</Tag>
                  )}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                {item.birthday} → {item.age + 1}岁
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Popover content={content} title="🎂 生日提醒" trigger="click">
      <Badge dot={isToday} offset={[-2, 2]}>
        <Tooltip title="生日提醒">
          <GiftOutlined style={{ fontSize: 18, cursor: 'pointer', color: isToday ? '#ff4d4f' : '#999' }} />
        </Tooltip>
      </Badge>
    </Popover>
  );
}