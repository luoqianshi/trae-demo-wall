import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Tabs, Select } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res: any = await authAPI.login(values.username, values.password);
      if (res.code === 0) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data));
        message.success('登录成功');
        navigate('/');
      }
    } catch (err: any) {
      message.error(err?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await authAPI.register(
        values.username,
        values.password,
        values.realName,
        values.role,
        values.phone,
      );
      if (res.code === 0) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data));
        message.success('注册成功');
        navigate('/');
      }
    } catch (err: any) {
      message.error(err?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>PBL教育平台</h1>
        <p className="subtitle">中小学线上项目式学习管理系统</p>
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered items={[
          {
            key: 'login',
            label: '登录',
            children: (
              <Form onFinish={handleLogin} size="large">
                <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                  <Input prefix={<UserOutlined />} placeholder="用户名" />
                </Form.Item>
                <Form.Item name="password" rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' },
                ]}>
                  <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    登录
                  </Button>
                </Form.Item>
                <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 12 }}>
                  新用户请先注册，或联系管理员获取账号
                </div>
              </Form>
            ),
          },
          {
            key: 'register',
            label: '注册',
            children: (
              <Form onFinish={handleRegister} size="large">
                <Form.Item name="username" rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3位' },
                ]}>
                  <Input prefix={<UserOutlined />} placeholder="用户名" />
                </Form.Item>
                <Form.Item name="realName" rules={[{ required: true, message: '请输入姓名' }]}>
                  <Input placeholder="真实姓名" />
                </Form.Item>
                <Form.Item name="role" rules={[{ required: true, message: '请选择角色' }]} initialValue="student">
                  <Select
                    placeholder="角色"
                    options={[
                      { value: 'student', label: '学生' },
                      { value: 'teacher', label: '教师' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="phone" rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                ]}>
                  <Input prefix={<PhoneOutlined />} placeholder="手机号" />
                </Form.Item>
                <Form.Item name="password" rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位，建议包含字母和数字' },
                ]}>
                  <Input.Password prefix={<LockOutlined />} placeholder="密码（至少6位）" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    注册
                  </Button>
                </Form.Item>
                <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 12 }}>
                  注册即表示同意平台服务条款
                </div>
              </Form>
            ),
          },
        ]} />
      </div>
    </div>
  );
}