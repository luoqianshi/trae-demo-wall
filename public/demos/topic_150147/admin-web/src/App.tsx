import { Routes, Route, Navigate } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import MainLayout from './layouts/MainLayout';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import MySubmissions from './pages/MySubmissions';
import MyFavorites from './pages/MyFavorites';
import Profile from './pages/Profile';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import TaskManagement from './pages/admin/TaskManagement';
import SubmissionManagement from './pages/admin/SubmissionManagement';

function App() {
  return (
    <AntdApp>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<TaskList />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="my-submissions" element={<MySubmissions />} />
          <Route path="my-favorites" element={<MyFavorites />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="tasks" element={<TaskManagement />} />
          <Route path="submissions" element={<SubmissionManagement />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AntdApp>
  );
}

export default App;