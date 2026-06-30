import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { post } from '../utils/request';
import { setToken, setUser, getToken } from '../utils/auth';

const { Title, Text } = Typography;

/** 登录失败次数上限 */
const MAX_LOGIN_ATTEMPTS = 5;
/** 锁定状态过期时间（毫秒） */
const LOCK_DURATION = 15 * 60 * 1000; // 15分钟

/**
 * 从 sessionStorage 获取登录失败记录
 */
function getLoginAttempts() {
  try {
    const raw = sessionStorage.getItem('loginAttempts');
    if (!raw) return { count: 0, lockedUntil: 0 };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

/**
 * 保存登录失败记录到 sessionStorage
 */
function setLoginAttempts(data) {
  sessionStorage.setItem('loginAttempts', JSON.stringify(data));
}

/**
 * 重置登录失败记录
 */
function resetLoginAttempts() {
  sessionStorage.removeItem('loginAttempts');
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [form] = Form.useForm();

  // 检查是否已登录，已登录则直接跳转
  useEffect(() => {
    if (getToken()) {
      navigate('/dashboard', { replace: true });
    }
  }, []);

  // 检查锁定状态
  useEffect(() => {
    const checkLock = () => {
      const attempts = getLoginAttempts();
      if (attempts.lockedUntil > Date.now()) {
        setLocked(true);
        const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
        setLockCountdown(remaining);
        setFailCount(attempts.count);
      } else {
        setLocked(false);
        setFailCount(attempts.count);
      }
    };
    checkLock();
    const timer = setInterval(checkLock, 1000);
    return () => clearInterval(timer);
  }, []);

  // 格式化倒计时
  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (values) => {
    if (locked) {
      message.warning('账号已锁定，请稍后再试');
      return;
    }

    setLoading(true);
    try {
      const res = await post('/auth/login', {
        username: values.username,
        password: values.password,
      });

      // 登录成功 - 存储token和用户信息
      const { token, user } = res.data || res;
      if (token) {
        setToken(token);
      }
      if (user) {
        setUser(user);
      }

      // 重置失败次数
      resetLoginAttempts();
      setFailCount(0);
      setLocked(false);

      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      // 登录失败 - 记录失败次数
      const attempts = getLoginAttempts();
      const newCount = attempts.count + 1;

      if (newCount >= MAX_LOGIN_ATTEMPTS) {
        // 达到最大次数，锁定账号
        const lockedUntil = Date.now() + LOCK_DURATION;
        setLoginAttempts({ count: newCount, lockedUntil });
        setLocked(true);
        setFailCount(newCount);
        message.error(
          `登录失败次数已达${MAX_LOGIN_ATTEMPTS}次，账号已锁定${LOCK_DURATION / 60000}分钟，请稍后再试`
        );
      } else {
        setLoginAttempts({ count: newCount, lockedUntil: 0 });
        setFailCount(newCount);
        message.error(
          error?.response?.data?.message || error?.message || '用户名或密码错误'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰 */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }}
      />

      <Card
        style={{
          width: 420,
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          position: 'relative',
          zIndex: 1,
        }}
        styles={{ body: { padding: '40px 40px 32px' } }}
      >
        {/* 标题区域 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <SafetyCertificateOutlined
              style={{ fontSize: 28, color: '#fff' }}
            />
          </div>
          <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
            HR 管理系统
          </Title>
          <Text type="secondary">请登录您的账号</Text>
        </div>

        {/* 锁定提示 */}
        {locked && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <span>
                登录失败次数已达上限，账号已锁定。
                请在{' '}
                <Text strong style={{ color: '#ff4d4f' }}>
                  {formatCountdown(lockCountdown)}
                </Text>{' '}
                后重试，或联系管理员解锁。
              </span>
            }
          />
        )}

        {/* 失败次数提示 */}
        {!locked && failCount > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <span>
                用户名或密码错误，已失败{' '}
                <Text strong>{failCount}</Text> 次。
                还剩{' '}
                <Text strong>{MAX_LOGIN_ATTEMPTS - failCount}</Text>{' '}
                次机会。
              </span>
            }
          />
        )}

        {/* 登录表单 */}
        <Form
          form={form}
          onFinish={handleLogin}
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="用户名"
              disabled={locked}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="密码"
              disabled={locked}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={locked}
              block
              style={{
                height: 44,
                borderRadius: 8,
                background: locked
                  ? undefined
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontSize: 16,
              }}
            >
              {locked ? `账号已锁定 (${formatCountdown(lockCountdown)})` : '登 录'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
