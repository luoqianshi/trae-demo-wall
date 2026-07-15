import { useState } from 'react';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import AppliancePage from './pages/AppliancePage';
import GuidePage from './pages/GuidePage';
import HelpPage from './pages/HelpPage';
import CompletePage from './pages/CompletePage';
import RegistrationPage from './pages/RegistrationPage';

interface PageState {
  page: string;
  params: Record<string, string>;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageState>({
    page: 'home',
    params: {},
  });

  const handleNavigate = (page: string, params: Record<string, string> = {}) => {
    setCurrentPage({ page, params });
  };

  const renderPage = () => {
    switch (currentPage.page) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'scan':
        return <ScanPage onNavigate={handleNavigate} />;
      case 'appliance':
        return <AppliancePage params={currentPage.params} onNavigate={handleNavigate} />;
      case 'guide':
        return <GuidePage params={currentPage.params} onNavigate={handleNavigate} />;
      case 'help':
        return <HelpPage params={currentPage.params} onNavigate={handleNavigate} />;
      case 'complete':
        return <CompletePage params={currentPage.params} onNavigate={handleNavigate} />;
      case 'register':
        return <RegistrationPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderPage()}
    </div>
  );
}
