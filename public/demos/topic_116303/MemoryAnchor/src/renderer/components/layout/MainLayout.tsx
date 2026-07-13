import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, NavKey } from './Sidebar';
import { Header } from './Header';
import { useResponsive } from '../../hooks/useResponsive';
import { useCollectionStore } from '../../store/collectionStore';
import { formatBytes } from '../../utils/format';

export interface MainLayoutProps {
  children?: React.ReactNode;
  title?: string;
}

const NAV_TITLE_MAP: Record<NavKey, string> = {
  home: '全部收藏',
  today: '今日新增',
  unread: '未读',
  tags: '标签管理',
  import: '内容采集',
  trash: '回收站',
  settings: '系统设置',
};

const PATH_TO_NAV: Record<string, NavKey> = {
  '/import': 'import',
  '/settings': 'settings',
  '/search': 'home',
};

// Home-page sub-views are distinguished by the `?view=` query param so the
// sidebar can highlight them and HomePage can apply the matching filter.
const HOME_VIEW_KEYS: NavKey[] = ['today', 'unread', 'tags', 'trash'];

export function MainLayout({
  children,
  title,
}: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const responsive = useResponsive();
  const stats = useCollectionStore((s) => s.stats);
  const fetchStats = useCollectionStore((s) => s.fetchStats);

  React.useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const viewParam = new URLSearchParams(location.search).get('view') as NavKey | null;
  const activeNav: NavKey =
    location.pathname === '/'
      ? viewParam && HOME_VIEW_KEYS.includes(viewParam)
        ? viewParam
        : 'home'
      : PATH_TO_NAV[location.pathname] || 'home';

  const handleNavChange = (key: NavKey) => {
    switch (key) {
      case 'home':
        void navigate('/');
        break;
      case 'import':
        void navigate('/import');
        break;
      case 'settings':
        void navigate('/settings');
        break;
      case 'today':
      case 'unread':
      case 'tags':
      case 'trash':
        void navigate(`/?view=${key}`);
        break;
      default:
        void navigate('/');
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleHelp = () => {
    console.log('Help button clicked');
  };

  const handleSearch = (query: string) => {
    void navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search');
  };

  const showSidebar = responsive.isDesktop || (!responsive.isMobile && !sidebarCollapsed);

  const displayTitle = title || NAV_TITLE_MAP[activeNav];

  return (
    <main className="h-screen overflow-hidden" style={{ fontFamily: 'var(--body)' }}>
      <div
        className="flex h-full overflow-hidden"
        style={{ background: 'var(--bg-0)', color: 'var(--ink)' }}
      >
        {showSidebar && (
          <Sidebar
            activeNav={activeNav}
            onNavChange={handleNavChange}
            onImport={() => void navigate('/import')}
            storageSize={stats ? formatBytes(stats.storageBytes) : '—'}
            totalCount={stats?.total}
            todayCount={stats?.todayCount}
            collapsed={sidebarCollapsed || responsive.isTablet}
            onToggleCollapse={handleToggleSidebar}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title={displayTitle}
            onSearch={handleSearch}
            onHelp={handleHelp}
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
