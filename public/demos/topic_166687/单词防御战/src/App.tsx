import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { GamePage } from '@/pages/GamePage';
import { ProgressPage } from '@/pages/ProgressPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/progress" element={<ProgressPage />} />
    </Routes>
  );
}

export default App;
