import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Typography, Space, theme } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  SolutionOutlined,
  FileSearchOutlined,
  UserOutlined,
  LogoutOutlined,
  CalendarOutlined,
  RiseOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  AuditOutlined,
  CarryOutOutlined,
  FolderOutlined,
  FormOutlined,
  SwapOutlined,
  SafetyCertificateOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  PieChartOutlined,
  TableOutlined,
  ClockCircleOutlined,
  SnippetsOutlined,
  ExceptionOutlined,
  GoldOutlined,
} from '@ant-design/icons';
import { getUser, hasRole, logout } from '../utils/auth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// ==================== 菜单配置（完整菜单，按角色过滤） ====================

const menuGroups = [
  {
    key: 'workspace',
    label: '工作台',
    items: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台', roles: ['admin', 'hr', 'manager', 'employee'] },
    ],
  },
  {
    key: 'recruitment',
    label: '智能招聘',
    roles: ['admin', 'hr'],
    items: [
      { key: '/recruitment/jobs', icon: <FormOutlined />, label: '岗位管理', roles: ['admin', 'hr'] },
      { key: '/recruitment/resumes', icon: <FolderOutlined />, label: '简历管理', roles: ['admin', 'hr'] },
      { key: '/recruitment/interviews', icon: <AuditOutlined />, label: '面试安排', roles: ['admin', 'hr'] },
      { key: '/recruitment/offers', icon: <SolutionOutlined />, label: 'Offer管理', roles: ['admin', 'hr'] },
      { key: '/recruitment/report', icon: <PieChartOutlined />, label: '招聘报表', roles: ['admin', 'hr'] },
    ],
  },
  {
    key: 'hr',
    label: '人事管理',
    roles: ['admin', 'hr'],
    items: [
      { key: '/hr/departments', icon: <TeamOutlined />, label: '部门管理', roles: ['admin', 'hr'] },
      { key: '/hr/employees', icon: <UserOutlined />, label: '员工档案', roles: ['admin', 'hr'] },
      { key: '/hr/changes', icon: <SwapOutlined />, label: '人事变动', roles: ['admin', 'hr'] },
      { key: '/hr/resignations', icon: <ExceptionOutlined />, label: '离职管理', roles: ['admin', 'hr'] },
    ],
  },
  {
    key: 'attendance',
    label: '考勤排班',
    roles: ['admin', 'hr', 'manager', 'employee'],
    items: [
      { key: '/attendance/check', icon: <ClockCircleOutlined />, label: '考勤打卡', roles: ['admin', 'hr', 'manager', 'employee'] },
      { key: '/attendance/leaves', icon: <CarryOutOutlined />, label: '请假管理', roles: ['admin', 'hr', 'manager', 'employee'] },
      { key: '/attendance/stats', icon: <BarChartOutlined />, label: '考勤统计', roles: ['admin', 'hr', 'manager'] },
    ],
  },
  {
    key: 'performance',
    label: '绩效薪酬',
    roles: ['admin', 'hr', 'manager', 'employee'],
    items: [
      { key: '/performance/list', icon: <RiseOutlined />, label: '绩效管理', roles: ['admin', 'hr', 'manager', 'employee'] },
      { key: '/salary/structure', icon: <GoldOutlined />, label: '薪资结构', roles: ['admin', 'hr'] },
      { key: '/salary/records', icon: <DollarOutlined />, label: '工资条', roles: ['admin', 'hr', 'employee'] },
    ],
  },
  {
    key: 'reports',
    label: '数据报表',
    roles: ['admin', 'hr', 'manager'],
    items: [
      { key: '/reports/recruitment', icon: <FileSearchOutlined />, label: '招聘报表', roles: ['admin', 'hr'] },
      { key: '/reports/staffing', icon: <TeamOutlined />, label: '人员报表', roles: ['admin', 'hr', 'manager'] },
      { key: '/reports/turnover', icon: <ExceptionOutlined />, label: '离职率报表', roles: ['admin', 'hr', 'manager'] },
      { key: '/reports/attendance', icon: <CalendarOutlined />, label: '考勤报表', roles: ['admin', 'hr', 'manager'] },
      { key: '/reports/cost', icon: <TableOutlined />, label: '成本报表', roles: ['admin', 'hr'] },
    ],
  },
  {
    key: 'system',
    label: '系统管理',
    roles: ['admin'],
    items: [
      { key: '/system/users', icon: <SafetyCertificateOutlined />, label: '用户管理', roles: ['admin'] },
      { key: '/system/logs', icon: <FileTextOutlined />, label: '操作日志', roles: ['admin'] },
    ],
  },
];

/**
 * 根据用户角色过滤菜单项
 * @returns {Array} 过滤后的菜单分组
 */
function filterMenuByRole() {
  return menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || hasRole(...item.roles)
      ),
    }))
    .filter((group) => !group.roles || hasRole(...group.roles))
    .filter((group) => group.items.length > 0);
}

const roleLabelMap = {
  admin: '超级管理员',
  hr: 'HR管理员',
  manager: '部门主管',
  employee: '普通员工',
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const user = getUser();
  const filteredGroups = filterMenuByRole();

  // 将菜单分组转换为 Ant Design Menu 的 items 格式
  const menuItems = filteredGroups.map((group) => ({
    key: group.key,
    label: group.label,
    type: 'group',
    children: group.items.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
    })),
  }));

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userDropdownItems = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Typography.Title
            level={4}
            style={{
              color: '#fff',
              margin: 0,
              fontSize: collapsed ? 16 : 18,
              whiteSpace: 'nowrap',
            }}
          >
            {collapsed ? 'HR' : 'HR 管理系统'}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{ cursor: 'pointer', fontSize: 18 }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Dropdown menu={userDropdownItems} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
              <Text>{user?.realName || user?.username || '未知用户'}</Text>
              <Text type="secondary">
                ({roleLabelMap[user?.role] || user?.role || ''})
              </Text>
            </Space>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: 16,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 64px - 32px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
