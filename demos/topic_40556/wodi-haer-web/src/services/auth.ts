// 认证服务

import { api } from './api';
import { useUserStore } from '../store';
import { UserInfo } from '../store';

interface LoginParams {
  phone: string;
  code: string;
}

interface RegisterParams {
  phone: string;
  code: string;
  nickname: string;
  password?: string;
}

interface LoginResult {
  user: UserInfo;
  token: string;
}

// 模拟登录（开发阶段使用真实API，此处为fallback）
export const authService = {
  // 发送验证码
  async sendCode(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      await api.post('/auth/send-code', { phone });
      return { success: true, message: '验证码已发送' };
    } catch (_e) {
      // 开发模式：模拟发送成功
      console.log('[Mock] 验证码已发送至:', phone);
      return { success: true, message: '验证码已发送（模拟）' };
    }
  },

  // 登录
  async login(params: LoginParams): Promise<LoginResult> {
    try {
      const result = await api.post<LoginResult>('/auth/login', params);
      return result.data;
    } catch (e) {
      // 开发模式：模拟登录
      console.log('[Mock] 登录:', params.phone);

      if (params.code !== '123456' && params.code !== '000000') {
        throw new Error('验证码错误（模拟：请输入123456或000000）');
      }

      const mockUser: UserInfo = {
        id: 'user_001',
        phone: params.phone,
        nickname: '快乐妈妈',
        avatar: undefined,
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_token_' + Date.now();

      return {
        user: mockUser,
        token: mockToken,
      };
    }
  },

  // 注册
  async register(params: RegisterParams): Promise<LoginResult> {
    try {
      const res = await api.post<LoginResult>('/auth/register', params);
      return res.data;
    } catch (e) {
      // 开发模式：模拟注册
      console.log('[Mock] 注册:', params.phone);

      if (params.code !== '123456') {
        throw new Error('验证码错误（模拟：请输入123456）');
      }

      const mockUser: UserInfo = {
        id: 'user_' + Date.now(),
        phone: params.phone,
        nickname: params.nickname,
        avatar: undefined,
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_token_' + Date.now();

      return {
        user: mockUser,
        token: mockToken,
      };
    }
  },

  // 退出登录
  logout(): void {
    const store = useUserStore.getState();
    store.logout();
  },

  // 检查Token是否有效
  async validateToken(): Promise<boolean> {
    try {
      await api.get('/auth/validate', {}, { skipAuth: false });
      return true;
    } catch {
      return false;
    }
  },
};
