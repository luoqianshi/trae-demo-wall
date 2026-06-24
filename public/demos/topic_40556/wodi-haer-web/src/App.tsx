﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy, useState } from 'react';
import { useUserStore } from './store';
import Layout from './components/Layout';
import { ErrorBoundary } from './components';
import OnboardingGuide from './components/OnboardingGuide';
import ReminderBar from './components/ReminderBar';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const StagePage = lazy(() => import('./pages/StagePage'));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'));
const RecordPage = lazy(() => import('./pages/RecordPage'));
const VaccinePage = lazy(() => import('./pages/VaccinePage'));
const MilestonePage = lazy(() => import('./pages/MilestonePage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

// 加载占位
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-soft-blue border-t-ice-blue rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary text-sm">加载中...</p>
      </div>
    </div>
  );
}

// 认证守卫
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// 已登录重定向
function GuestOnly({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('wdhr_onboarding_done') !== 'true';
  });

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FFFFFF',
              color: '#4A4A4A',
              borderRadius: '16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
              padding: '16px 20px',
            },
          }}
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          } />
          <Route path="/register" element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          } />

          {/* 需要认证的路由 */}
          <Route path="/" element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }>
            <Route index element={<HomePage />} />
            <Route path="stage/:stageKey" element={<StagePage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="knowledge/:articleId" element={<ArticlePage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="news/:newsId" element={<NewsDetailPage />} />
            <Route path="record" element={<RecordPage />} />
            <Route path="vaccine" element={<VaccinePage />} />
            <Route path="milestone" element={<MilestonePage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* 404 — 产品级设计 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center px-6">
              <div className="text-center max-w-sm animate-fadeInUp">
                <div className="text-8xl mb-6">🍼</div>
                <h2 className="text-2xl font-bold text-text-primary mb-3">页面走丢了</h2>
                <p className="text-text-secondary mb-8 leading-relaxed">
                  您访问的页面可能已移动或不存在<br/>
                  <span className="text-sm text-text-light">别担心，宝宝还在等你~</span>
                </p>
                <div className="flex gap-3 justify-center">
                  <a href="/" className="btn btn-primary inline-flex items-center gap-2">
                    🏠 返回首页
                  </a>
                  <a href="/knowledge" className="btn btn-secondary inline-flex items-center gap-2">
                    📚 浏览知识库
                  </a>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
      <ReminderBar />
      {showOnboarding && <OnboardingGuide onComplete={() => setShowOnboarding(false)} />}
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;