import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import MobileLayout from './components/MobileLayout';
import TodayPage from './pages/TodayPage';
import AssessmentPage from './pages/AssessmentPage';
import CaredPeoplePage from './pages/CaredPeoplePage';
import NearbyPage from './pages/NearbyPage';
import EmergencyPage from './pages/EmergencyPage';
import ProfilePage from './pages/ProfilePage';
import StationModePage from './pages/StationModePage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <MobileLayout>
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/cared" element={<CaredPeoplePage />} />
            <Route path="/nearby" element={<NearbyPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/station" element={<StationModePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MobileLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
