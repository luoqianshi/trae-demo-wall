import React, { useEffect, useState } from 'react';
import { Layout, Tabs, Spin, message } from 'antd';
import type { TabsProps } from 'antd';
import QuickAddPage from './pages/QuickAdd';
import OverviewPage from './pages/Overview';
import SettingsPage from './pages/Settings';
import KnowledgePage from './pages/Knowledge';
import StatisticsPage from './pages/Statistics';
import { useProjectStore, useFieldStore, useTemplateStore, useUiStore, useKnowledgeStore, useStatsStore, useJumperStore } from './store';

const { Header, Content } = Layout;

const tabIcons: Record<string, string> = {
  quickAdd: '⚡',
  overview: '📋',
  knowledge: '📚',
  statistics: '📊',
  settings: '⚙️'
};

const items: TabsProps['items'] = [
  { key: 'quickAdd', label: <span className="tab-label-inner"><span className="tab-icon">{tabIcons.quickAdd}</span>快速添加</span> },
  { key: 'overview', label: <span className="tab-label-inner"><span className="tab-icon">{tabIcons.overview}</span>总览</span> },
  { key: 'knowledge', label: <span className="tab-label-inner"><span className="tab-icon">{tabIcons.knowledge}</span>知识库</span> },
  { key: 'statistics', label: <span className="tab-label-inner"><span className="tab-icon">{tabIcons.statistics}</span>统计</span> },
  { key: 'settings', label: <span className="tab-label-inner"><span className="tab-icon">{tabIcons.settings}</span>设置</span> }
];

export default function App() {
  const [active, setActive] = useState<string>('quickAdd');
  const [loaded, setLoaded] = useState(false);
  const loadProjects = useProjectStore(s => s.load);
  const loadFields = useFieldStore(s => s.load);
  const loadTemplates = useTemplateStore(s => s.load);
  const loadUi = useUiStore(s => s.load);
  const loadKc = useKnowledgeStore(s => s.loadCategories);
  const loadStats = useStatsStore(s => s.load);
  const loadJumper = useJumperStore(s => s.load);

  useEffect(() => {
    (async () => {
      try {
        await loadUi();
        const state = useUiStore.getState();
        setActive(state.defaultPage || 'quickAdd');
        document.documentElement.style.setProperty('--aurora-opacity', String(state.cardOpacity));
        document.documentElement.style.setProperty('--aurora-enabled', state.auroraEnabled ? '1' : '0');
        document.documentElement.style.setProperty('--card-opacity', String(state.cardOpacityAlpha));
        if (state.theme && document.documentElement.getAttribute('data-theme') !== state.theme) {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
        await Promise.all([loadProjects(), loadFields(), loadTemplates(), loadKc(), loadStats(), loadJumper()]);
      } catch (e: any) {
        message.error('加载数据失败: ' + e.message);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const renderPage = () => {
    switch (active) {
      case 'quickAdd':
        return <QuickAddPage />;
      case 'overview':
        return <OverviewPage />;
      case 'knowledge':
        return <KnowledgePage />;
      case 'statistics':
        return <StatisticsPage />;
      case 'settings':
        return <SettingsPage onThemeChange={() => {}} onNavigate={setActive} />;
      default:
        return <QuickAddPage />;
    }
  };

  return (
    <Layout className="app-shell">
      <div className="aurora-bg">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />
        <div className="aurora-blob aurora-blob-5" />
      </div>
      <Header className="app-header">
        <div className="brand">
          <span className="brand-dot" />
          <span className="brand-name">局点项目信息管理</span>
          <span className="brand-sub">· Project Console</span>
        </div>
        <Tabs
          activeKey={active}
          onChange={setActive}
          items={items}
          className="app-tabs"
          size="large"
        />
      </Header>
      <Content className="app-content">
        {!loaded ? (
          <div className="boot-screen">
            <div className="boot-loader" />
            <div className="boot-text">正在初始化工作区…</div>
            <div className="boot-sub">loading your data</div>
          </div>
        ) : (
          <div className="page-enter">
            {renderPage()}
          </div>
        )}
      </Content>
    </Layout>
  );
}
