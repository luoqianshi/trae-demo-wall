import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/store';

const PrivateRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-50 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default PrivateRoute;
