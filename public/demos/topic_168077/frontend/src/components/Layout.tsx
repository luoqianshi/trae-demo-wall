import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Select, Modal, Input, Space, message, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TeamOutlined,
  ScheduleOutlined,
  DollarOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { childAPI } from '../api/client';
import BirthdayReminder from './BirthdayReminder';
import FestivalBanner from './FestivalBanner';
import FestivalCountdown from './FestivalCountdown';

const { Header, Content, Sider } = AntLayout;

const menuItems = [
  { key: '/children', icon: <TeamOutlined />, label: '孩子管理' },
  { key: '/schedules', icon: <ScheduleOutlined />, label: '作息管理' },
  { key: '/allowance', icon: <DollarOutlined />, label: '零花钱' },
  { key: '/rewards', icon: <GiftOutlined />, label: '奖惩规则' },
  { key: '/clock-in', icon: <ClockCircleOutlined />, label: '打卡记录' },
  { key: '/devices', icon: <ApiOutlined />, label: '设备管理' },
  { key: '/stats', icon: <BarChartOutlined />, label: '统计看板' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
];

const adminOnlyPaths = ['/children', '/devices', '/settings'];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, childName, switchToAdmin, switchToChild } = useAuth();
  const { currentTheme, allThemes, autoSwitch, setTheme, toggleAuto } = useTheme();
  const [childrenList, setChildrenList] = useState<{ id: string; name: string }[]>([]);
  const [childSelectVisible, setChildSelectVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (role === 'admin') {
      childAPI.list().then(res => setChildrenList(res.data)).catch(() => console.error('Failed to load children list'));
    }
  }, [role]);

  const filteredItems = role === 'child'
    ? menuItems.filter(item => !adminOnlyPaths.includes(item.key))
    : menuItems;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Coin Kids · 好习惯培养</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={filteredItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 500 }}>多胞胎孩子好习惯培养系统</span>
          <Space>
            {role === 'child' && childName && (
              <span style={{ color: '#1890ff' }}>👶 {childName}</span>
            )}
            <FestivalCountdown />
            <BirthdayReminder />
            <Select
              value={currentTheme}
              onChange={(val) => setTheme(val)}
              style={{ width: 150 }}
              options={allThemes.map(t => ({ value: t.theme, label: t.label }))}
            />
            <a onClick={toggleAuto} style={{ color: autoSwitch ? '#1890ff' : '#999', cursor: 'pointer', fontSize: 12 }}>
              {autoSwitch ? '自动' : '手动'}
            </a>
            <Select
              value={role}
              onChange={(val) => {
                if (val === 'child') {
                  setChildSelectVisible(true);
                } else {
                  setPasswordVisible(true);
                }
              }}
              style={{ width: 130 }}
              options={[
                { value: 'admin', label: '👑 管理员' },
                { value: 'child', label: '👶 孩子模式' },
              ]}
            />
          </Space>
        </Header>
        <Content style={{ margin: 24 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, minHeight: 'calc(100vh - 112px)' }}>
            <FestivalBanner />
            {children}
          </div>
        </Content>
      </AntLayout>

      {/* 选择孩子 */}
      <Modal title="选择孩子视图" open={childSelectVisible} onCancel={() => setChildSelectVisible(false)} footer={null}>
        <Space wrap>
          {childrenList.map((c) => (
            <Button key={c.id} onClick={() => { switchToChild(c.id, c.name); setChildSelectVisible(false); }}>
              {c.name}
            </Button>
          ))}
        </Space>
      </Modal>

      {/* 输入密码 */}
      <Modal title="切换为管理员" open={passwordVisible} onOk={() => { if (switchToAdmin(password)) { setPasswordVisible(false); setPassword(''); } else { message.error('密码错误'); } }} onCancel={() => setPasswordVisible(false)}>
        <Input.Password value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入管理员密码" />
      </Modal>
    </AntLayout>
  );
}