/**
 * 通知服务接口层 — 预留真实 API 接入
 * 
 * 可接入：
 * - 微信小程序订阅消息
 * - 企业微信机器人
 * - 短信通知 (阿里云短信 / 腾讯云短信)
 * - 浏览器 Notification API (PWA)
 */

export interface NotificationService {
  sendCareReminder(phone: string, message: string): Promise<boolean>;
  sendTeamAlert(members: string[], message: string): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  scheduleDailyReminder(hour: number, minute: number): void;
}

export class MockNotificationService implements NotificationService {
  async sendCareReminder(phone: string, message: string): Promise<boolean> {
    console.log(`[Mock] 发送关怀提醒至 ${phone}: ${message}`);
    alert(`关怀提醒已发送（Mock）\n\n接收人：${phone}\n\n内容：${message}`);
    return true;
  }

  async sendTeamAlert(members: string[], message: string): Promise<boolean> {
    console.log(`[Mock] 发送班组提醒至 ${members.join(', ')}: ${message}`);
    return true;
  }

  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  scheduleDailyReminder(hour: number, minute: number): void {
    console.log(`[Mock] 设置每日提醒: ${hour}:${minute}`);
  }
}

export const notificationService = new MockNotificationService();
