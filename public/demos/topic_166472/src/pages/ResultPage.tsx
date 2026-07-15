import { useNavigate } from 'react-router-dom';
import { ResultScreen } from '@/components/ResultScreen';
import { useGameStore } from '@/store/useGameStore';

export const ResultPage = () => {
  const navigate = useNavigate();
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);

  const handleRestart = () => {
    startGame();
    navigate('/game');
  };

  const handleHome = () => {
    resetGame();
    navigate('/');
  };

  return <ResultScreen onRestart={handleRestart} onHome={handleHome} />;
};
