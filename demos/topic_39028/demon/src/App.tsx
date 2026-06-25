import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import TravelDetail from '@/pages/TravelDetail';
import AIProcessing from '@/pages/AIProcessing';
import MemoryBook from '@/pages/MemoryBook';
import { Navigation } from '@/components/Navigation';

export default function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/travel/:id" element={<TravelDetail />} />
        <Route path="/travel/:id/memory-book" element={<MemoryBook />} />
        <Route path="/processing/:id" element={<AIProcessing />} />
      </Routes>
    </Router>
  );
}
