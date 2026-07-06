'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BarChartOutlined, DatabaseOutlined, FileSearchOutlined, HomeOutlined } from '@ant-design/icons';
import { Layout, Menu, Space, Tag, Typography } from 'antd';
import { LegalDisclaimerModal } from '@/components/legal/legal-disclaimer-modal';
import { AmbientCanvas } from '@/components/scene/ambient-canvas';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/tasks', icon: <DatabaseOutlined />, label: '采集任务' },
  { key: '/jobs', icon: <FileSearchOutlined />, label: '岗位数据' },
  { key: '/reports', icon: <BarChartOutlined />, label: '分析报告' },
];

const routeCopy: Record<string, { title: string; subtitle: string }> = {
  '/': { title: '总览工作台', subtitle: '' },
  '/tasks': { title: '采集任务管理', subtitle: '' },
  '/jobs': { title: '岗位数据管理', subtitle: '' },
  '/reports': { title: '分析报告中心', subtitle: '' },
};

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  const pageCopy = useMemo(() => routeCopy[pathname] ?? routeCopy['/'], [pathname]);

  return (
    <Layout className="jobscope-shell">
      <AmbientCanvas />
      <Sider breakpoint="lg" collapsedWidth={72} width={248} className="jobscope-sider">
        <div className="jobscope-brand-block">
          <Typography.Text className="jobscope-brand-kicker">Orbiting Data Console</Typography.Text>
          <Typography.Title level={4} style={{ margin: 0, color: '#f5f7fb' }}>
            JobScope
          </Typography.Title>
          <Typography.Text style={{ color: '#96a3bf' }}>招聘数据采集与 AI 分析平台</Typography.Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname || '/']}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          className="jobscope-side-menu"
        />
        <div className="jobscope-side-note">
          <span>限定范围</span>
          <strong>实习僧 · 应届生</strong>
          <small>只保留当前真实接入的平台与双模型分析链路。</small>
        </div>
      </Sider>
      <Layout>
        <Header className="jobscope-topbar">
          <Space direction="vertical" size={2}>
            <Typography.Title level={5} style={{ margin: 0, color: '#f5f7fb' }}>
              {pageCopy.title}
            </Typography.Title>
            <Typography.Text className="jobscope-topbar-subtitle">{pageCopy.subtitle}</Typography.Text>
          </Space>
          <Space size={10} wrap>
            <Tag color="cyan">双平台采集</Tag>
            <Tag color="purple">双模型分析</Tag>
            <Tag color="green">开发环境</Tag>
          </Space>
        </Header>
        <Content className="jobscope-content">
          {children}
          <LegalDisclaimerModal />
        </Content>
      </Layout>
    </Layout>
  );
}
