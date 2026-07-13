import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { useTheme } from './hooks/useTheme';
import HomePage from './pages/HomePage';
import ImportPage from './pages/ImportPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import DetailPage from './pages/DetailPage';

function App() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    console.log('Theme:', resolvedTheme);
  }, [resolvedTheme]);

  return (
    <HashRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/collection/:id" element={<DetailPage />} />
        </Routes>
      </MainLayout>
    </HashRouter>
  );
}

export default App;
