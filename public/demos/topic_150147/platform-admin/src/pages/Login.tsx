import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res: any = await authAPI.login(values.username, values.password);
      if (res.code === 0) {
        if (res.data.role !== 'platform_admin') {
          message.error('仅平台管理员可登录此后台');
          return;
        }
        localStorage.setItem('token', res.data.token);
        message.success('登录成功');
        navigate('/');
      }
    } catch (err: any) {
      message.error(err?.message || '登录失败');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      <div style={{ width: 400, padding: 40, background: '#fff', borderRadius: 12 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8, color: '#1677ff' }}>PBL平台管理后台</h1>
        <p style={{ textAlign: 'center', marginBottom: 32, color: '#8c8c8c', fontSize: 14 }}>超级管理员登录</p>
        <Form onFinish={handleLogin} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="管理员用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 12 }}>admin / admin123</div>
        </Form>
      </div>
    </div>
  );
}