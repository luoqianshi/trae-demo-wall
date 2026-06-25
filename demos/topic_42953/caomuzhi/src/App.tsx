import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Detail from '@/pages/Detail';
import Collection from '@/pages/Collection';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Plants from '@/pages/Plants';
import Toast from '@/components/common/Toast';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plants" element={<Plants />} />
        <Route path="/plants/:category" element={<Plants />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Toast />
    </Router>
  );
}
