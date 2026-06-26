import Taro from '@tarojs/taro';
import { AIConfig, DEFAULT_CONFIG } from '@/services/ai';

// 存储键名常量
export const STORAGE_KEYS = {
  CHAT_MESSAGES: 'silver_companion_chat_messages',
  REMINDERS: 'silver_companion_reminders',
  USER_PROFILE: 'silver_companion_user_profile',
  AI_CONFIG: 'silver_companion_ai_config',
};

/**
 * 本地存储工具类
 */
export class StorageUtil {
  /**
   * 保存数据到本地
   */
  static set<T>(key: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        Taro.setStorageSync(key, data);
        resolve();
      } catch (error) {
        console.error('Storage save error:', error);
        reject(error);
      }
    });
  }

  /**
   * 获取AI配置
   */
  static getAIConfig(): AIConfig {
    try {
      const data = Taro.getStorageSync(STORAGE_KEYS.AI_CONFIG);
      if (data) {
        return { ...DEFAULT_CONFIG, ...data };
      }
    } catch (error) {
      console.error('获取AI配置失败:', error);
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * 保存AI配置
   */
  static async saveAIConfig(config: Partial<AIConfig>): Promise<void> {
    const currentConfig = this.getAIConfig();
    const newConfig = { ...currentConfig, ...config };
    await this.set(STORAGE_KEYS.AI_CONFIG, newConfig);
  }

  /**
   * 从本地读取数据
   */
  static get<T>(key: string, defaultValue?: T): T | null {
    try {
      const data = Taro.getStorageSync(key);
      return data !== '' ? data : (defaultValue ?? null);
    } catch (error) {
      console.error('Storage read error:', error);
      return defaultValue ?? null;
    }
  }

  /**
   * 删除指定数据
   */
  static remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        Taro.removeStorageSync(key);
        resolve();
      } catch (error) {
        console.error('Storage remove error:', error);
        reject(error);
      }
    });
  }

  /**
   * 清空所有数据
   */
  static clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        Taro.clearStorageSync();
        resolve();
      } catch (error) {
        console.error('Storage clear error:', error);
        reject(error);
      }
    });
  }
}
