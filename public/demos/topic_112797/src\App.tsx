import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Match from './pages/Match';
import Profile from './pages/Profile';
import MyProfile from './pages/MyProfile';

export default function App() {
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/match" element={<Match />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/me" element={<MyProfile />} />
      </Routes>
    </div>
  );
}
