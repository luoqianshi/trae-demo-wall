import { Routes, Route } from 'react-router-dom';
import { RecognitionProvider } from './context/RecognitionContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import MyLibraryPage from './pages/MyLibraryPage';
import './App.css';

function App() {
  return (
    <RecognitionProvider>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/library" element={<MyLibraryPage />} />
          </Routes>
        </main>
      </div>
    </RecognitionProvider>
  );
}

export default App;
