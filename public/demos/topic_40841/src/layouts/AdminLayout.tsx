import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  UnorderedListOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  UploadOutlined,
  WarningOutlined,
  HeartOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'

const { Sider, Header, Content } = Layout

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/admin/activities', icon: <UnorderedListOutlined />, label: '活动管理' },
  { key: '/admin/review', icon: <AuditOutlined />, label: '审核工作台' },
  { key: '/admin/trust-rules', icon: <SafetyCertificateOutlined />, label: '可信规则' },
  { key: '/admin/push-config', icon: <EnvironmentOutlined />, label: '分区推送' },
  { key: '/admin/uploads', icon: <UploadOutlined />, label: '用户上传' },
  { key: '/admin/risk-logs', icon: <WarningOutlined />, label: '风险拦截' },
  { key: '/admin/mutual', icon: <HeartOutlined />, label: '互助审核' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const selectedKey = menuItems.find(item => item.key === location.pathname)?.key || '/admin'
  const pageTitle = menuItems.find(item => item.key === selectedKey)?.label || '管理后台'

  return (
    <Layout className="admin-shell min-h-screen">
      <Sider width={240} className="admin-sider" theme="light">
        <div className="admin-brand">
          <div className="admin-brand__icon">
            <SafetyCertificateOutlined />
          </div>
          <div>
            <div className="admin-brand__title">活动真探</div>
            <div className="admin-brand__sub">运营控制台</div>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="admin-menu"
        />

        <div className="admin-sider-footer">
          <button type="button" onClick={() => navigate('/app')} className="admin-back-btn">
            <ArrowLeftOutlined />
            返回用户端
          </button>
        </div>
      </Sider>

      <Layout>
        <Header className="admin-header">
          <div>
            <h1 className="admin-header__title">{pageTitle}</h1>
            <p className="admin-header__sub">数据实时同步 · 与用户端联动</p>
          </div>
          <div className="admin-header__user">
            <div className="text-right">
              <div className="text-sm font-medium text-ink">运营管理员</div>
              <div className="text-[11px] text-ink-muted">admin@demo.local</div>
            </div>
            <div className="admin-avatar">管</div>
          </div>
        </Header>
        <Content className="admin-content-area">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
