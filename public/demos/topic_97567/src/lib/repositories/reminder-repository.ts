// Reminder repository: CRUD for reminders.

import { readData, withTransaction, generateId } from './base';
import type { Reminder } from '../types/entities';

export function getReminders(userId: string): Reminder[] {
  const data = readData();
  return data.reminders.filter((r) => r.user_id === userId);
}

export function getReminder(reminderId: string): Reminder | null {
  const data = readData();
  return data.reminders.find((r) => r.id === reminderId) || null;
}

export function createReminder(reminderData: any): Reminder {
  return withTransaction((data) => {
    const newReminder: any = {
      id: generateId(),
      ...reminderData,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    data.reminders.push(newReminder);
    return newReminder;
  });
}

export function updateReminder(reminderId: string, updates: any): Reminder {
  return withTransaction((data) => {
    const idx = data.reminders.findIndex((r) => r.id === reminderId);
    if (idx === -1) throw new Error('Reminder not found');
    data.reminders[idx] = { ...data.reminders[idx], ...updates };
    return data.reminders[idx];
  });
}

export function deleteReminder(reminderId: string): boolean {
  return withTransaction((data) => {
    const idx = data.reminders.findIndex((r) => r.id === reminderId);
    if (idx === -1) throw new Error('Reminder not found');
    data.reminders.splice(idx, 1);
    return true;
  });
}
