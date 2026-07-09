import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { HomePage } from './pages/HomePage';
import { NewProjectPage } from './pages/NewProjectPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { RequirementAnalysisPage } from './pages/RequirementAnalysisPage';
import { PrototypeEditorPage } from './pages/PrototypeEditorPage';
import { PrototypePreviewPage } from './pages/PrototypePreviewPage';
import { HistoryPage } from './pages/HistoryPage';
import { ChatAnalysisPage } from './pages/ChatAnalysisPage';
import { ChatPrototypePage } from './pages/ChatPrototypePage';
import { useProjectStore } from './store/projectStore';

function App() {
  const loadProjects = useProjectStore((state) => state.loadProjects);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/new" element={<NewProjectPage />} />
            <Route path="/chat-analysis" element={<ChatAnalysisPage />} />
            <Route path="/chat-prototype" element={<ChatPrototypePage />} />
            <Route path="/project/:id" element={<ProjectDetailPage />} />
            <Route path="/project/:id/analysis" element={<RequirementAnalysisPage />} />
            <Route path="/project/:id/prototype" element={<PrototypeEditorPage />} />
            <Route path="/project/:id/preview" element={<PrototypePreviewPage />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
