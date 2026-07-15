import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ChildrenPage from './pages/ChildrenPage';
import SchedulePage from './pages/SchedulePage';
import AllowancePage from './pages/AllowancePage';
import RewardPage from './pages/RewardPage';
import ClockInPage from './pages/ClockInPage';
import DevicePage from './pages/DevicePage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';

const adminOnlyPaths = ['/children', '/devices', '/settings'];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const location = useLocation();
  if (role === 'child' && adminOnlyPaths.includes(location.pathname)) {
    return <Navigate to="/schedules" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
        <Route path="/" element={<Navigate to="/children" replace />} />
        <Route path="/children" element={<ProtectedRoute><ChildrenPage /></ProtectedRoute>} />
        <Route path="/schedules" element={<SchedulePage />} />
        <Route path="/allowance" element={<AllowancePage />} />
        <Route path="/rewards" element={<RewardPage />} />
        <Route path="/clock-in" element={<ClockInPage />} />
        <Route path="/devices" element={<ProtectedRoute><DevicePage /></ProtectedRoute>} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;