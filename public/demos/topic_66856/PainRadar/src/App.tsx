import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { OpportunitiesPage } from './components/opportunities/OpportunitiesPage';
import { TrendsPage } from './components/trends/TrendsPage';
import { ValidatorPage } from './components/validator/ValidatorPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { useAppStore } from './store';

function App() {
  const { activeTab } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'opportunities' && <OpportunitiesPage />}
        {activeTab === 'trends' && <TrendsPage />}
        {activeTab === 'validator' && <ValidatorPage />}
        {activeTab === 'reports' && <ReportsPage />}
      </main>

      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">R</span>
              </div>
              <span className="text-gray-600">PainRadar - AI全球产品机会挖掘引擎</span>
            </div>
            <p className="text-sm text-gray-400">© 2026 PainRadar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
