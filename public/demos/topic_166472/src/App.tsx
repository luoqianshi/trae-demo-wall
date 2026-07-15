import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MenuPage } from '@/pages/MenuPage';
import { GamePage } from '@/pages/GamePage';
import { ResultPage } from '@/pages/ResultPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
