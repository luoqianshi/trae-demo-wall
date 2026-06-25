// 认证Hook — 修复内存泄漏

import { useState, useCallback, useRef, useEffect } from 'react';
import { authService } from '../services/auth';
import { useUserStore } from '../store';
import toast from 'react-hot-toast';

interface UseAuthReturn {
  isLoading: boolean;
  login: (phone: string, code: string) => Promise<void>;
  register: (phone: string, code: string, nickname: string) => Promise<void>;
  handleLogout: () => void;
  sendCode: (phone: string) => Promise<void>;
  countdown: number;
  isSendingCode: boolean;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { login: storeLogin } = useUserStore();

  // 用 ref 存储定时器ID，确保组件卸载时能清除
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 组件卸载时清除倒计时定时器（防止内存泄漏）
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  // 发送验证码
  const sendCode = useCallback(async (phone: string) => {
    if (!phone || phone.length !== 11) {
      toast.error('请输入正确的手机号');
      return;
    }

    // 防止重复发送
    if (countdown > 0) return;

    setIsSendingCode(true);
    try {
      await authService.sendCode(phone);
      toast.success('验证码已发送（模拟：123456）');

      // 先清除可能存在的旧定时器
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }

      // 启动60秒倒计时
      setCountdown(60);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      toast.error(e.message || '发送失败');
    } finally {
      setIsSendingCode(false);
    }
  }, [countdown]);

  // 登录
  const login = useCallback(async (phone: string, code: string) => {
    if (!phone || !code) {
      toast.error('请填写完整信息');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login({ phone, code });
      storeLogin(result.user, result.token);
      toast.success(`欢迎回来，${result.user.nickname}！`);
    } catch (e: any) {
      toast.error(e.message || '登录失败');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [storeLogin]);

  // 注册
  const register = useCallback(async (phone: string, code: string, nickname: string) => {
    if (!phone || !code || !nickname) {
      toast.error('请填写完整信息');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.register({ phone, code, nickname });
      storeLogin(result.user, result.token);
      toast.success(`注册成功，欢迎 ${result.user.nickname}！`);
    } catch (e: any) {
      toast.error(e.message || '注册失败');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [storeLogin]);

  // 登出
  const handleLogout = useCallback(() => {
    // 清除倒计时
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(0);
    authService.logout();
    toast.success('已退出登录');
  }, []);

  return {
    isLoading,
    login,
    register,
    handleLogout,
    sendCode,
    countdown,
    isSendingCode,
  };
}
