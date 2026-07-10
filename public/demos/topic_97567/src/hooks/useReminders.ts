'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { getReminderText, type ReminderType } from '@/lib/reminder-templates';
import type { ReminderItem } from '@/app/api/reminders/route';

const STORAGE_KEYS = {
  REMINDERS: 'snowball_reminders',
  NOTIFICATION_PERMISSION: 'snowball_notification_permission',
  LAST_REMINDER_DATE: 'snowball_last_reminder_date',
  LAST_ACTIVE_DATE: 'snowball_last_active_date',
  NEAR_MILESTONE: 'snowball_near_milestone',
} as const;

export function useReminders() {
  const { token } = useAuth();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearMilestone, setNearMilestone] = useState(false);
  const [error, setError] = useState('');
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReminders = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/reminders', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
        localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(data.reminders || []));
      } else {
        const localReminders = localStorage.getItem(STORAGE_KEYS.REMINDERS);
        if (localReminders) {
          setReminders(JSON.parse(localReminders));
        }
      }
    } catch {
      const localReminders = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (localReminders) {
        setReminders(JSON.parse(localReminders));
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const requestPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('此浏览器不支持通知功能');
      return false;
    }

    if (Notification.permission === 'granted') {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSION, 'granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSION, permission);
    return granted;
  };

  const createReminder = async (time: string, label: string): Promise<ReminderItem | null> => {
    if (!token) return null;

    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ time, label }),
      });

      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
        localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(data.reminders || []));
        return data.reminder;
      }
    } catch (err) {
      console.error('Failed to create reminder:', err);
      setError('创建提醒失败');
    }
    return null;
  };

  const updateReminder = async (id: string, updates: Partial<Pick<ReminderItem, 'time' | 'enabled' | 'label'>>): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch('/api/reminders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
        localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(data.reminders || []));
        return true;
      }
    } catch (err) {
      console.error('Failed to update reminder:', err);
      setError('更新提醒失败');
    }
    return false;
  };

  const deleteReminder = async (id: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`/api/reminders?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
        localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(data.reminders || []));
        return true;
      }
    } catch (err) {
      console.error('Failed to delete reminder:', err);
      setError('删除提醒失败');
    }
    return false;
  };

  const sendNotification = (title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  };

  const checkAndSendReminders = useCallback(() => {
    const enabledReminders = reminders.filter(r => r.enabled);
    if (enabledReminders.length === 0) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastSentDate = localStorage.getItem(STORAGE_KEYS.LAST_REMINDER_DATE);

    if (lastSentDate === today) return;

    for (const reminder of enabledReminders) {
      const [hours, minutes] = reminder.time.split(':').map(Number);
      const reminderDate = new Date();
      reminderDate.setHours(hours, minutes, 0, 0);

      const diff = Math.abs(now.getTime() - reminderDate.getTime());
      const fiveMinutes = 5 * 60 * 1000;

      if (diff <= fiveMinutes) {
        let type: ReminderType = 'daily';
        if (nearMilestone) {
          type = 'milestone';
        }

        const text = getReminderText(type);
        sendNotification('雪球日记', text);
        localStorage.setItem(STORAGE_KEYS.LAST_REMINDER_DATE, today);
        break;
      }
    }
  }, [reminders, nearMilestone]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  useEffect(() => {
    if (reminders.length === 0) return;

    checkAndSendReminders();
    checkIntervalRef.current = setInterval(checkAndSendReminders, 60 * 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [reminders, checkAndSendReminders]);

  return {
    reminders,
    loading,
    error,
    nearMilestone,
    requestPermission,
    createReminder,
    updateReminder,
    deleteReminder,
    sendNotification,
    checkAndSendReminders,
  };
}
