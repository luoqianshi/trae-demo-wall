import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from '@/pages/Home';
import Search from '@/pages/Search';
import RouteDetail from '@/pages/RouteDetail';
import Community from '@/pages/Community';
import Profile from '@/pages/Profile';
import Favorites from '@/pages/Favorites';
import AuthPage from '@/pages/AuthPage';
import BoomerangPage from '@/pages/BoomerangPage';
import DigitalNomadPage from '@/pages/DigitalNomadPage';
import Navbar from '@/components/Navbar';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout() {
  const location = useLocation();
  const hideNavbarRoutes = ['/login', '/register'];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/boomerang" element={<BoomerangPage />} />
        <Route path="/nomad" element={<DigitalNomadPage />} />
        <Route path="/route/:id" element={<RouteDetail />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
