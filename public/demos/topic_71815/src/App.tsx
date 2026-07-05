import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Scan from '@/pages/Scan';
import Tasks from '@/pages/Tasks';
import Recite from '@/pages/Recite';
import Dictate from '@/pages/Dictate';
import Notebook from '@/pages/Notebook';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import Protected from '@/components/Protected';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const token = useAuthStore((s) => s.token);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const pullFromServer = useAppStore((s) => s.pullFromServer);

  // 启动时若有 token，验证并拉取数据
  useEffect(() => {
    if (token) {
      fetchMe().then(() => pullFromServer()).catch(() => {});
    }
  }, [token, fetchMe, pullFromServer]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Home /></Protected>} />
        <Route path="/scan" element={<Protected><Scan /></Protected>} />
        <Route path="/tasks" element={<Protected><Tasks /></Protected>} />
        <Route path="/recite/:taskId" element={<Protected><Recite /></Protected>} />
        <Route path="/dictate/:taskId" element={<Protected><Dictate /></Protected>} />
        <Route path="/notebook" element={<Protected><Notebook /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
      </Routes>
    </Router>
  );
}
