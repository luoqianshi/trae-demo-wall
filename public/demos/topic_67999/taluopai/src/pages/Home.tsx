import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Eye } from 'lucide-react';
import StarBackground from '@/components/StarBackground';
import MysticCircle from '@/components/MysticCircle';
import SpreadSelector from '@/components/SpreadSelector';
import ShuffleAnimation from '@/components/ShuffleAnimation';
import CardFlip from '@/components/CardFlip';
import CardDetailModal from '@/components/CardDetailModal';
import MagicParticles from '@/components/MagicParticles';
import { useTarotStore } from '@/stores/useTarotStore';
import type { Card } from '@/../shared/types';

const threeCardPositions = ['过去', '现在', '未来'];
const celticPositions = [
  '现状', '阻碍', '过去', '未来',
  '意识', '潜意识', '建议', '环境',
  '希望', '结果',
];

export default function Home() {
  const { phase, drawnCards, selectedSpread, reset } = useTarotStore();
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [detailReversed, setDetailReversed] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);

  const handleReveal = useCallback(() => {
    setRevealedCount((prev) => prev + 1);
  }, []);

  const handleReset = () => {
    reset();
    setRevealedCount(0);
    setDetailCard(null);
  };

  const handleShowDetail = (card: Card, isReversed: boolean) => {
    setDetailCard(card);
    setDetailReversed(isReversed);
  };

  const spreadCount = selectedSpread === 'single' ? 1 : selectedSpread === 'three' ? 3 : 10;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StarBackground />
      <MysticCircle />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-display text-mystic-gold text-glow tracking-widest mb-2">
            命运之轮
          </h1>
          <p className="text-lg text-mystic-silver/60 font-body tracking-wider">
            塔罗牌占卜
          </p>
        </div>

        {/* Phase: Select */}
        {phase === 'select' && (
          <div className="w-full max-w-4xl">
            <SpreadSelector />
          </div>
        )}

        {/* Phase: Shuffle */}
        {phase === 'shuffle' && <ShuffleAnimation />}

        {/* Phase: Result */}
        {phase === 'result' && (
          <div className="w-full max-w-5xl animate-fade-in-up">
            <MagicParticles count={25} area="wide" />

            {/* Single card layout */}
            {selectedSpread === 'single' && drawnCards.length > 0 && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-mystic-gold/70">当前</span>
                  <CardFlip
                    card={drawnCards[0].card!}
                    isReversed={drawnCards[0].isReversed}
                    index={0}
                    autoFlip
                    onClick={() => handleReveal()}
                  />
                </div>
                {drawnCards[0].card && (
                  <button
                    onClick={() => handleShowDetail(drawnCards[0].card!, drawnCards[0].isReversed)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs bg-mystic-gold/10 text-mystic-gold gold-border hover:bg-mystic-gold/20 transition-all"
                  >
                    <Eye size={14} />
                    牌义解读
                  </button>
                )}
              </div>
            )}

            {/* Three cards layout */}
            {selectedSpread === 'three' && drawnCards.length >= 3 && (
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 items-end">
                  {drawnCards.slice(0, 3).map((dc, i) => (
                    <div key={dc.id} className="flex flex-col items-center gap-2">
                      <span className="text-xs text-mystic-gold/70">{threeCardPositions[i]}</span>
                      <CardFlip
                        card={dc.card!}
                        isReversed={dc.isReversed}
                        index={i}
                        autoFlip
                        onClick={() => handleReveal()}
                      />
                      {dc.card && (
                        <button
                          onClick={() => handleShowDetail(dc.card!, dc.isReversed)}
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-mystic-gold/10 text-mystic-gold gold-border hover:bg-mystic-gold/20 transition-all"
                        >
                          <Eye size={12} />
                          解读
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Celtic Cross layout */}
            {selectedSpread === 'celtic-cross' && drawnCards.length >= 10 && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-full max-w-lg mx-auto" style={{ height: '360px' }}>
                  {/* Card 0: Present - center */}
                  <div className="absolute flex flex-col items-center gap-1" style={{ left: '50%', top: '35%', transform: 'translate(-50%, -50%)' }}>
                    <span className="text-[10px] text-mystic-gold/60">{celticPositions[0]}</span>
                    <div style={{ transform: 'scale(0.8)' }}>
                      <CardFlip card={drawnCards[0].card!} isReversed={drawnCards[0].isReversed} index={0} autoFlip onClick={handleReveal} />
                    </div>
                  </div>
                  {/* Card 1: Challenge - crossing */}
                  <div className="absolute flex flex-col items-center gap-1" style={{ left: 'calc(50% + 15px)', top: 'calc(35% - 10px)', transform: 'translate(-50%, -50%) rotate(90deg)' }}>
                    <div style={{ transform: 'scale(0.7)' }}>
                      <CardFlip card={drawnCards[1].card!} isReversed={drawnCards[1].isReversed} index={1} autoFlip onClick={handleReveal} />
                    </div>
                  </div>
                  {/* Card 2: Past - left */}
                  <div className="absolute flex flex-col items-center gap-1" style={{ left: '10%', top: '35%', transform: 'translate(-50%, -50%)' }}>
                    <span className="text-[10px] text-mystic-gold/60">{celticPositions[2]}</span>
                    <div style={{ transform: 'scale(0.7)' }}>
                      <CardFlip card={drawnCards[2].card!} isReversed={drawnCards[2].isReversed} index={2} autoFlip onClick={handleReveal} />
                    </div>
                  </div>
                  {/* Card 3: Future - right */}
                  <div className="absolute flex flex-col items-center gap-1" style={{ left: '90%', top: '35%', transform: 'translate(-50%, -50%)' }}>
                    <span className="text-[10px] text-mystic-gold/60">{celticPositions[3]}</span>
                    <div style={{ transform: 'scale(0.7)' }}>
                      <CardFlip card={drawnCards[3].card!} isReversed={drawnCards[3].isReversed} index={3} autoFlip onClick={handleReveal} />
                    </div>
                  </div>
                  {/* Card 4: Above */}
                  <div className="absolute flex flex-col items-center gap-1" style={{ left: '50%', top: '5%', transform: 'translate(-50%, -50%)' }}>
                    <span className="text-[10px] text-mystic-gold/60">{celticPositions[4]}</span>
                    <div style={{ transform: 'scale(0.65)' }}>
                      <CardFlip card={drawnCards[4].card!} isReversed={drawnCards[4].isReversed} index={4} autoFlip onClick={handleReveal} />
                    </div>
                  </div>
                  {/* Card 5: Below */}
                  <div className="absolute flex flex-col items-center gap-1" style={{ left: '50%', bottom: '5%', transform: 'translate(-50%, 50%)' }}>
                    <div style={{ transform: 'scale(0.65)' }}>
                      <CardFlip card={drawnCards[5].card!} isReversed={drawnCards[5].isReversed} index={5} autoFlip onClick={handleReveal} />
                    </div>
                    <span className="text-[10px] text-mystic-gold/60">{celticPositions[5]}</span>
                  </div>
                  {/* Cards 6-9: Staff row on right */}
                  <div className="absolute flex flex-col gap-3" style={{ right: '2%', top: '5%' }}>
                    {drawnCards.slice(6, 10).map((dc, i) => (
                      <div key={dc.id} className="flex items-center gap-1">
                        <span className="text-[10px] text-mystic-gold/60 w-8 text-right">{celticPositions[6 + i]}</span>
                        <div style={{ transform: 'scale(0.55)' }}>
                          <CardFlip card={dc.card!} isReversed={dc.isReversed} index={6 + i} autoFlip onClick={handleReveal} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Detail buttons for celtic cross */}
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {drawnCards.map((dc, i) => (
                    dc.card && (
                      <button
                        key={dc.id}
                        onClick={() => handleShowDetail(dc.card!, dc.isReversed)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] bg-mystic-gold/10 text-mystic-gold gold-border hover:bg-mystic-gold/20 transition-all"
                      >
                        <Eye size={10} />
                        {celticPositions[i]}
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Reset button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full font-display text-mystic-gold gold-border hover:bg-mystic-gold/10 transition-all duration-300 hover:shadow-lg hover:shadow-mystic-gold/15"
              >
                <RefreshCw size={16} />
                重新抽取
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center z-10">
          <Link
            to="/admin/login"
            className="text-xs text-mystic-silver/20 hover:text-mystic-silver/40 transition-colors"
          >
            管理员入口
          </Link>
        </div>
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={detailCard}
        isOpen={!!detailCard}
        isReversed={detailReversed}
        onClose={() => setDetailCard(null)}
      />
    </div>
  );
}