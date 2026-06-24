import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import HeroSection from '@/components/home/HeroSection';
import AiRecognition from '@/components/home/AiRecognition';
import DailyRecommend from '@/components/home/DailyRecommend';
import CategoryNav from '@/components/home/CategoryNav';
import HotPlants from '@/components/home/HotPlants';
import AncientSection from '@/components/home/AncientSection';
import StatsSection from '@/components/home/StatsSection';

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-bg-cream">
      <Navbar />
      
      <main>
        <HeroSection />
        <AiRecognition />
        <DailyRecommend />
        <CategoryNav />
        <HotPlants />
        <AncientSection />
        <StatsSection />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
