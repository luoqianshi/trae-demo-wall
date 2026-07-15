import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { AIPartner } from '@/components/AIPartner';
import type { FlashCard } from '@/types';

const mockCards: FlashCard[] = [
  {
    id: '1',
    front: '马克思主义哲学的核心观点是什么？',
    back: '物质决定意识、实践是检验真理的唯一标准',
    mastered: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    front: '唯物辩证法的三大规律是什么？',
    back: '对立统一规律、质量互变规律、否定之否定规律',
    mastered: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    front: '什么是对立统一规律？',
    back: '揭示了事物发展的源泉和动力，是唯物辩证法的实质和核心',
    mastered: false,
    createdAt: new Date(),
  },
  {
    id: '4',
    front: '质量互变规律说明了什么？',
    back: '说明了事物发展的形式和状态',
    mastered: false,
    createdAt: new Date(),
  },
  {
    id: '5',
    front: '否定之否定规律揭示了什么？',
    back: '揭示了事物发展的方向和道路',
    mastered: false,
    createdAt: new Date(),
  },
];

export function FlashCards() {
  const navigate = useNavigate();
  const { partner, cards, addCards, toggleMastered } = useStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  
  useEffect(() => {
    if (!partner) {
      navigate('/settings');
    }
    
    if (cards.length === 0) {
      addCards(mockCards);
    }
  }, [partner, cards.length, addCards, navigate]);
  
  const currentCard = cards[currentIndex];
  
  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowEncouragement(true);
      setTimeout(() => setShowEncouragement(false), 3000);
    }
  };
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };
  
  const handleMastered = () => {
    toggleMastered(currentCard.id);
    setShowEncouragement(true);
    setTimeout(() => setShowEncouragement(false), 3000);
  };
  
  if (!currentCard) {
    return (
      <div className="min-h-screen bg-cream pb-24 flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-warm-gray mb-4">暂无背诵卡片</p>
          <button
            onClick={() => addCards(mockCards)}
            className="px-8 py-3 bg-charcoal text-white rounded-xl font-medium"
          >
            加载示例卡片
          </button>
        </div>
      </div>
    );
  }
  
  const masteredCount = cards.filter((c) => c.mastered).length;
  
  return (
    <div className="min-h-screen bg-cream pb-24">
      <AIPartner onComplete={showEncouragement} />
      
      <div className="max-w-md mx-auto px-6 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-charcoal">卡片背诵</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-warm-gray">{masteredCount}/{cards.length} 已掌握</span>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-light-gray rounded-full transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>
        
        <div className="flex justify-center mb-8">
          <div className="flex gap-1">
            {cards.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-charcoal w-6'
                    : index < currentIndex
                    ? cards[index].mastered
                      ? 'bg-green-400'
                      : 'bg-fog-blue'
                    : 'bg-light-gray'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="relative h-[400px] mb-8" style={{ perspective: '1000px' }}>
          <div
            className="absolute inset-0 cursor-pointer transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className="w-full h-full bg-white rounded-2xl shadow-md flex flex-col items-center justify-center p-8"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-sm text-warm-gray mb-4">问题</span>
              <p className="text-xl text-charcoal text-center leading-relaxed">
                {currentCard.front}
              </p>
              <span className="text-sm text-muted-blue mt-6">点击卡片查看答案</span>
            </div>
            
            <div
              className="w-full h-full bg-white rounded-2xl shadow-md flex flex-col items-center justify-center p-8 absolute inset-0"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <span className="text-sm text-warm-gray mb-4">答案</span>
              <p className="text-lg text-charcoal text-center leading-relaxed">
                {currentCard.back}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-6 py-3 bg-light-gray text-warm-gray rounded-xl font-medium hover:bg-soft-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一张
          </button>
          
          {!isFlipped ? (
            <button
              onClick={() => setIsFlipped(true)}
              className="px-8 py-3 bg-charcoal text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              看答案
            </button>
          ) : (
            <>
              <button
                onClick={handleMastered}
                className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                  currentCard.mastered
                    ? 'bg-green-100 text-green-600'
                    : 'bg-light-gray text-warm-gray hover:bg-green-50 hover:text-green-600'
                }`}
              >
                {currentCard.mastered ? '已掌握 ✓' : '标记掌握'}
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === cards.length - 1}
                className="px-6 py-3 bg-charcoal text-white rounded-xl font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一张
              </button>
            </>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/settings')}
            className="text-sm text-warm-gray hover:text-charcoal transition-colors"
          >
            + 添加新卡片
          </button>
        </div>
      </div>
    </div>
  );
}
