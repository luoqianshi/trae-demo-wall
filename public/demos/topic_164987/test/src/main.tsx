import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Pomodoro } from '@/pages/Pomodoro';
import { FlashCards } from '@/pages/FlashCards';
import { Settings } from '@/pages/Settings';
import { BottomNav } from '@/components/BottomNav';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/pomodoro" />} />
        <Route path="/pomodoro" element={<><Pomodoro /><BottomNav /></>} />
        <Route path="/cards" element={<><FlashCards /><BottomNav /></>} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
