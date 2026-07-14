import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography } from 'antd';
import {
  DashboardOutlined, UserOutlined, FileTextOutlined,
  CheckSquareOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/admin/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/admin/tasks', icon: <FileTextOutlined />, label: '任务管理' },
  { key: '/admin/submissions', icon: <CheckSquareOutlined />, label: '提交管理' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/login');
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== 'platform_admin' && u.role !== 'teacher') {
      navigate('/');
      return;
    }
    setUser(u);
  }, []);

  const selectedKey = menuItems.find(item =>
    location.pathname === item.key || (item.key !== '/admin' && location.pathname.startsWith(item.key))
  )?.key || '/admin';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={5} style={{ margin: 0, color: '#1677ff' }}>
            {collapsed ? 'P' : 'PBL 管理后台'}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
            返回前台
          </Button>
          <span style={{ color: '#8c8c8c', fontSize: 13 }}>
            {user?.realName || user?.username} ({user?.role === 'platform_admin' ? '管理员' : '教师'})
          </span>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}