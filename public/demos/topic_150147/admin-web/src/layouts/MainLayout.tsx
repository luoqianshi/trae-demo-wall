import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Layout, Button, Space, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, HeartOutlined, HomeOutlined, FileTextOutlined, IdcardOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

const { Header, Content, Footer } = Layout;

const navItems = [
  { path: '/', label: '项目广场', icon: <HomeOutlined /> },
  { path: '/my-favorites', label: '收藏', icon: <HeartOutlined />, auth: true },
  { path: '/my-submissions', label: '作品', icon: <FileTextOutlined />, auth: true },
  { path: '/profile', label: '我的', icon: <IdcardOutlined />, auth: true },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff', borderBottom: '1px solid #f0f0f0',
        padding: '0 24px', height: 56, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link to="/" style={{ fontSize: 18, fontWeight: 'bold', color: '#1677ff', textDecoration: 'none' }}>
            PBL 项目学习
          </Link>
          {/* 桌面端导航 */}
          <Space className="desktop-nav" style={{ display: 'flex' }}>
            {navItems.filter(item => !item.auth || user).map(item => (
              <Button
                key={item.path}
                type={isActive(item.path) ? 'primary' : 'text'}
                onClick={() => navigate(item.path)}
              >
                {item.icon} {item.label}
              </Button>
            ))}
          </Space>
        </div>

        <div className="desktop-nav">
          {user ? (
            <Space>
              {(user.role === 'platform_admin' || user.role === 'teacher') && (
                <Button type="text" icon={<SettingOutlined />} onClick={() => navigate('/admin')}>
                  管理后台
                </Button>
              )}
              <Dropdown menu={{
                items: [
                  { key: 'info', label: user.realName || user.username, disabled: true },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: '退出', danger: true, onClick: handleLogout },
                ],
              }}>
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                  <span>{user.realName || user.username}</span>
                </div>
              </Dropdown>
            </Space>
          ) : (
            <Space>
              <Button onClick={() => navigate('/login')}>登录</Button>
            </Space>
          )}
        </div>
      </Header>

      <Content style={{ paddingBottom: 64 }}>
        <Outlet />
      </Content>

      {/* 移动端底部导航 */}
      <div className="mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 56, background: '#fff',
        borderTop: '1px solid #f0f0f0',
        zIndex: 100,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 4,
      }}>
        {navItems.filter(item => !item.auth || user).map(item => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 2, cursor: 'pointer',
              color: isActive(item.path) ? '#1677ff' : '#8c8c8c',
              fontSize: 11, padding: '4px 12px',
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* 移动端适配样式 */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-bottom-nav { display: flex !important; }
        }
      `}</style>

      {/* Footer */}
      <Footer style={{
        textAlign: 'center',
        background: '#fafafa',
        borderTop: '1px solid #f0f0f0',
        padding: '24px 16px',
        color: '#8c8c8c',
        fontSize: 13,
        display: 'block',
      }} className="desktop-footer">
        <div style={{ marginBottom: 8 }}>
          <Link to="/" style={{ color: '#1677ff', fontWeight: 600, textDecoration: 'none' }}>
            PBL 项目学习平台
          </Link>
          <span style={{ margin: '0 12px' }}>|</span>
          <span>让每个孩子都能动手学科学</span>
        </div>
        <div>
          <span>PBL Project-Based Learning</span>
          <span style={{ margin: '0 12px' }}>|</span>
          <span>108 个K-12项目任务</span>
          <span style={{ margin: '0 12px' }}>|</span>
          <span>面向小学生</span>
        </div>
        <div style={{ marginTop: 8 }}>
          Powered by PBL Team &copy; {new Date().getFullYear()}
        </div>
      </Footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-footer { display: none !important; }
        }
      `}</style>
    </Layout>
  );
}