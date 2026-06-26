import { StorageUtil, STORAGE_KEYS } from './storage';

export interface Reminder {
  id: string;
  title: string;
  time: string;
  repeat: 'daily' | 'once' | 'weekday';
  enabled: boolean;
  createdAt: string;
}

/**
 * 提醒管理工具
 */
export class ReminderManager {
  /**
   * 获取所有提醒
   */
  static getAll(): Reminder[] {
    const reminders = StorageUtil.get<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
    return reminders || [];
  }

  /**
   * 重置提醒数据（清理旧数据并重新初始化）
   */
  static resetReminders(): void {
    StorageUtil.remove(STORAGE_KEYS.REMINDERS);
    const presets = this.getPresetReminders();
    presets.forEach(preset => {
      this.add(preset);
    });
  }

  /**
   * 检查是否有重复ID
   */
  static hasDuplicateIds(): boolean {
    const reminders = this.getAll();
    const idSet = new Set(reminders.map(r => r.id));
    return idSet.size !== reminders.length;
  }

  /**
   * 添加新提醒
   */
  static add(reminder: Omit<Reminder, 'id' | 'createdAt'>): Reminder {
    const newReminder: Reminder = {
      ...reminder,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    const reminders = this.getAll();
    reminders.push(newReminder);
    StorageUtil.set(STORAGE_KEYS.REMINDERS, reminders);

    return newReminder;
  }

  /**
   * 更新提醒
   */
  static update(id: string, updates: Partial<Reminder>): boolean {
    const reminders = this.getAll();
    const index = reminders.findIndex(r => r.id === id);
    
    if (index === -1) return false;
    
    reminders[index] = { ...reminders[index], ...updates };
    StorageUtil.set(STORAGE_KEYS.REMINDERS, reminders);
    return true;
  }

  /**
   * 删除提醒
   */
  static delete(id: string): boolean {
    const reminders = this.getAll();
    const index = reminders.findIndex(r => r.id === id);
    
    if (index === -1) return false;
    
    reminders.splice(index, 1);
    StorageUtil.set(STORAGE_KEYS.REMINDERS, reminders);
    return true;
  }

  /**
   * 获取预设的健康提醒模板
   */
  static getPresetReminders(): Omit<Reminder, 'id' | 'createdAt'>[] {
    return [
      {
        title: '早上吃药',
        time: '08:00',
        repeat: 'daily',
        enabled: true
      },
      {
        title: '中午吃药',
        time: '12:00',
        repeat: 'daily',
        enabled: true
      },
      {
        title: '晚上吃药',
        time: '20:00',
        repeat: 'daily',
        enabled: true
      },
      {
        title: '喝杯水',
        time: '10:00',
        repeat: 'daily',
        enabled: false
      },
      {
        title: '散步时间',
        time: '07:00',
        repeat: 'daily',
        enabled: false
      }
    ];
  }
}
