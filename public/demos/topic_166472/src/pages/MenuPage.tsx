import { useNavigate } from 'react-router-dom';
import { MenuScreen } from '@/components/MenuScreen';
import { useGameStore } from '@/store/useGameStore';

export const MenuPage = () => {
  const navigate = useNavigate();
  const startGame = useGameStore((s) => s.startGame);

  const handleStart = () => {
    startGame();
    navigate('/game');
  };

  return <MenuScreen onStart={handleStart} />;
};
