import { useStore } from './store/useStore';
import { HomePage } from './components/HomePage';
import { CalendarPage } from './components/CalendarPage';
import { ProfilePage } from './components/ProfilePage';
import { KnowledgePage } from './components/KnowledgePage';
import { AIAssistantPage } from './components/AIAssistantPage';
import { Nav } from './components/Nav';

function App() {
  const { currentPage } = useStore();

  return (
    <div className="max-w-lg mx-auto min-h-screen relative overflow-x-hidden bg-white">
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'ai' && <AIAssistantPage />}
      {currentPage === 'calendar' && <CalendarPage />}
      {currentPage === 'profile' && <ProfilePage />}
      {currentPage === 'knowledge' && <KnowledgePage />}
      <Nav />
    </div>
  );
}

export default App;
