import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Home } from '@/pages/Home';
import { Checkin } from '@/pages/Checkin';
import { Shop } from '@/pages/Shop';
import { Leaderboard } from '@/pages/Leaderboard';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/checkin" element={<Checkin />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
