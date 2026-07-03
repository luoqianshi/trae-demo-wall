import { Sparkles, Layers, Crosshair, Play } from 'lucide-react';
import { useTarotStore } from '@/stores/useTarotStore';

const spreads = [
  {
    id: 'single',
    name: '单张牌',
    desc: '快速指引，揭示当下最核心的问题与答案',
    count: 1,
    icon: Sparkles,
    positions: ['当前'],
  },
  {
    id: 'three',
    name: '三张牌',
    desc: '过去、现在、未来，洞察时间之流',
    count: 3,
    icon: Layers,
    positions: ['过去', '现在', '未来'],
  },
  {
    id: 'celtic-cross',
    name: '凯尔特十字',
    desc: '十张牌全面解读，深入探索命运全貌',
    count: 10,
    icon: Crosshair,
    positions: ['现状', '阻碍', '过去', '未来', '意识', '潜意识', '建议', '环境', '希望', '结果'],
  },
];

export default function SpreadSelector() {
  const { selectedSpread, setSelectedSpread, setPhase, setIsShuffling } = useTarotStore();

  const handleSelect = (id: string) => {
    setSelectedSpread(id);
  };

  const handleStart = () => {
    if (!selectedSpread) return;
    setPhase('shuffle');
    setIsShuffling(true);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-2xl font-display text-mystic-gold text-glow animate-fade-in-up">
        请选择牌阵
      </h2>

      <div className="flex flex-wrap justify-center gap-6">
        {spreads.map((spread, i) => {
          const Icon = spread.icon;
          const isSelected = selectedSpread === spread.id;
          return (
            <div
              key={spread.id}
              className={`glass rounded-xl p-5 w-64 cursor-pointer transition-all duration-500 hover:scale-105 animate-fade-in-up ${
                isSelected ? 'gold-border-thick shadow-lg' : 'gold-border'
              }`}
              style={{
                animationDelay: `${i * 0.15}s`,
                boxShadow: isSelected
                  ? '0 0 25px rgba(212,168,83,0.3), inset 0 0 20px rgba(212,168,83,0.05)'
                  : '0 0 10px rgba(0,0,0,0.3)',
              }}
              onClick={() => handleSelect(spread.id)}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSelected ? 'bg-mystic-gold/20' : 'bg-mystic-purple/20'
                  }`}
                >
                  <Icon
                    size={28}
                    className={isSelected ? 'text-mystic-gold' : 'text-mystic-silver'}
                  />
                </div>
                <div>
                  <h3
                    className={`text-lg font-display font-semibold transition-colors ${
                      isSelected ? 'text-mystic-gold' : 'text-mystic-silver'
                    }`}
                  >
                    {spread.name}
                  </h3>
                  <p className="text-xs text-mystic-silver/60 mt-1 leading-relaxed">
                    {spread.desc}
                  </p>
                </div>
                <span className="text-xs text-mystic-gold/60 font-body">
                  {spread.count} 张牌
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleStart}
        disabled={!selectedSpread}
        className={`flex items-center gap-2 px-8 py-3 rounded-full font-display text-lg tracking-wider transition-all duration-500 animate-fade-in-up ${
          selectedSpread
            ? 'bg-mystic-gold text-mystic-deeper hover:bg-mystic-gold/90 hover:shadow-lg hover:shadow-mystic-gold/25 cursor-pointer active:scale-95'
            : 'bg-mystic-purple/30 text-mystic-silver/40 cursor-not-allowed'
        }`}
        style={{ animationDelay: '0.5s' }}
      >
        <Play size={18} />
        开始洗牌
      </button>
    </div>
  );
}