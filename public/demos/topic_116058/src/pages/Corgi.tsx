import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Heart, Utensils, Gamepad2, Palette, Check, Sparkles, Star, Lock,
  Clock, Flame, AlertTriangle, Home, Cookie, X, Trophy,
  Gift, Backpack as BackpackIcon,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import CorgiMascot, { PET_LABEL } from '@/components/Corgi/CorgiMascot';
import SoftButton from '@/components/common/SoftButton';
import {
  useCorgiStore, FUR_COLORS, FUR_RARITY_CONFIG,
  AFFINITY_LEVELS, getAffinityLevel,
  FEED_COST, FEED_DAILY_LIMIT, PET_DAILY_LIMIT, PLAY_DAILY_LIMIT,
} from '@/store/corgiStore';
import { useBackpackStore } from '@/store/backpackStore';
import { checkCorgiNameUnique } from '@/store/friendStore';
import type { FurColor } from '@/types';
import { cn } from '@/lib/utils';

// 毛色解锁等级
const FUR_UNLOCK_LEVEL: Record<FurColor, number> = {
  classic: 1, tricolor: 1, red: 1, cream: 1,
  merle: 2, sable: 2, chocolate: 3,
  peach: 4, mint: 5, blue: 6,
  lilac: 8, lavender: 10,
};

export default function Corgi() {
  const navigate = useNavigate();
  const { corgi, setFurColor, interact, setName, applyOfflineSatiety, checkStreak, feedSnack, addInteractionMinutes } = useCorgiStore();
  const { backpack, spendPoints, consumeSnack, addPoints } = useBackpackStore();
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState(corgi.name);
  const [nameStatus, setNameStatus] = useState<{ unique: boolean; suggestions: string[] } | null>(null);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [showSnackPicker, setShowSnackPicker] = useState(false);
  const [showYard, setShowYard] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);

  // 防沉迷计时器
  const [interactionSeconds, setInteractionSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const affLevel = getAffinityLevel(corgi.affinity);
  const yardUnlocked = affLevel.level >= 5;
  const miniGameUnlocked = affLevel.level >= 5;
  const petUnlocked = affLevel.level >= 2;
  const petLabel = PET_LABEL[corgi.petType];

  // 应用离线饥饿值降低 + 检查连胜
  useEffect(() => {
    applyOfflineSatiety();
    checkStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 防沉迷计时：每秒+1；每满 1 分钟同步到 store 的 interactionMinutesToday，使 interact/feedSnack 内的防沉迷校验生效
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setInteractionSeconds((s) => {
        const next = s + 1;
        // 每满 60 秒累加 1 分钟到 store
        if (next % 60 === 0) {
          addInteractionMinutes(1);
        }
        if (next >= 20 * 60 && s < 20 * 60) {
          // 达到 20 分钟，跳转日程页
          setToast({ type: 'warning', message: '已达 20 分钟互动上限，去学习一下吧～' });
          setTimeout(() => navigate('/planner'), 2000);
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const spawnParticles = (emojis: string[]) => {
    const newParticles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: 50 + (Math.random() - 0.5) * 40,
      y: 50 + (Math.random() - 0.5) * 30,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);
  };

  const handleInteract = (action: 'pet' | 'feed' | 'play') => {
    if (action === 'feed') {
      // 喂食需要积分
      if (corgi.feedCountToday >= FEED_DAILY_LIMIT) {
        showToast('warning', `今日喂食已达上限 ${FEED_DAILY_LIMIT} 次～`);
        return;
      }
      if (backpack.points < FEED_COST) {
        showToast('error', `积分不足！喂食需要 ${FEED_COST} 积分`);
        return;
      }
      if (!spendPoints(FEED_COST)) {
        showToast('error', '积分扣除失败');
        return;
      }
      const result = interact('feed');
      if (!result.success) {
        // interact 失败（防沉迷等）：回滚已扣积分
        addPoints(FEED_COST);
        showToast('warning', result.message || '喂食失败');
        return;
      }
      spawnParticles(['🍖', '😋', '⭐']);
      showToast('success', `喂食成功！+1 好感 -${FEED_COST} 积分`);
      return;
    }

    if (action === 'pet' && !petUnlocked) {
      showToast('warning', '好感度等级 2 解锁抚摸功能，继续加油～');
      return;
    }

    const result = interact(action);
    if (!result.success) {
      showToast('warning', result.message || '操作失败');
      return;
    }
    if (action === 'pet') {
      spawnParticles(['💛', '💕', '✨']);
      showToast('success', `抚摸了${corgi.name}！+2 好感`);
    } else {
      spawnParticles(['🎉', '🌟', '💫']);
      showToast('success', `和${corgi.name}玩耍！+3 好感`);
    }
  };

  // 用零食喂食：先扣除零食，再用零食自身的饱食度值应用效果（事务式，避免静默丢失/白嫖）
  const handleFeedSnack = (snackId: string) => {
    const snack = backpack.snacks.find((s) => s.reward.id === snackId);
    if (!snack || snack.count <= 0) {
      showToast('error', '该零食已用完');
      return;
    }
    // 先扣除零食；失败则未发生任何效果
    const consumed = consumeSnack(snackId);
    if (!consumed) {
      showToast('error', '消耗失败');
      return;
    }
    // 按稀有度推导额外好感：epic +1，legendary +3，其余 +0（基础 +1 由 feedSnack 统一给）
    const affBonus = consumed.rarity === 'epic' ? 1 : consumed.rarity === 'legendary' ? 3 : 0;
    const result = feedSnack(consumed.satietyValue || 10, affBonus);
    if (!result.success) {
      // feedSnack 失败（防沉迷/上限）：回滚零食
      useBackpackStore.setState((state) => ({
        backpack: {
          ...state.backpack,
          snacks: state.backpack.snacks.map((s) =>
            s.reward.id === snackId ? { ...s, count: s.count + 1 } : s
          ),
        },
      }));
      showToast('error', result.message || '喂食失败');
      return;
    }
    spawnParticles([consumed.emoji, '😋', '✨']);
    showToast('success', `吃了${consumed.name}！饱食+${consumed.satietyValue || 10}`);
    setShowSnackPicker(false);
  };

  // 改名 + 全网唯一校验
  const handleCheckName = (name: string) => {
    setNameInput(name);
    if (name.length >= 2) {
      const result = checkCorgiNameUnique(name);
      setNameStatus(result);
    } else {
      setNameStatus(null);
    }
  };

  const handleSaveName = () => {
    if (!nameInput.trim()) {
      showToast('error', '名字不能为空');
      return;
    }
    if (nameStatus && !nameStatus.unique) {
      showToast('error', '该名字已被占用，请选择其他名字');
      return;
    }
    setName(nameInput.trim());
    setEditName(false);
    setNameStatus(null);
    showToast('success', '改名成功！');
  };

  const handleColorChange = (color: FurColor) => {
    if (FUR_UNLOCK_LEVEL[color] > affLevel.level) {
      showToast('warning', `需要 Lv.${FUR_UNLOCK_LEVEL[color]} 解锁`);
      return;
    }
    setFurColor(color);
  };

  // 互动分钟数显示
  const minutes = Math.floor(interactionSeconds / 60);
  const seconds = interactionSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const nearLimit = interactionSeconds >= 18 * 60;

  return (
    <div className="min-h-screen warm-bg pb-24">
      <PageHeader
        title={`${petLabel}养成`}
        subtitle={`和你的小${petLabel}互动吧`}
        right={
          <div className="flex items-center gap-1.5 bg-corgi-yellow/20 px-3 py-2 rounded-xl">
            <Sparkles size={16} className="text-corgi-orange" />
            <span className="font-bold text-corgi-dark text-sm">{backpack.points}</span>
          </div>
        }
      />

      {/* 盲盒与背包入口：固定在右侧的侧边导航栏（垂直浮动按钮） */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        <Link
          to="/blindbox"
          title="盲盒"
          className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-berry-pink/15 text-berry-rose shadow-soft border-2 border-berry-pink/30 hover:bg-berry-pink/25 transition-colors"
        >
          <Gift size={20} />
          <span className="text-[9px] font-bold mt-0.5">盲盒</span>
        </Link>
        <Link
          to="/backpack"
          title="背包"
          className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-corgi-yellow/15 text-corgi-dark shadow-soft border-2 border-corgi-yellow/30 hover:bg-corgi-yellow/25 transition-colors"
        >
          <BackpackIcon size={20} />
          <span className="text-[9px] font-bold mt-0.5">背包</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 pr-16 pt-6">
        {/* 防沉迷计时器 */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-2xl mb-4 border-2 transition-colors',
          nearLimit
            ? 'bg-berry-pink/10 border-berry-pink/40 animate-pulse'
            : 'bg-corgi-yellow/10 border-corgi-yellow/20'
        )}>
          <Clock size={16} className={nearLimit ? 'text-berry-rose' : 'text-corgi-orange'} />
          <span className={cn('text-xs font-bold', nearLimit ? 'text-berry-rose' : 'text-text-secondary')}>
            今日互动 {timeStr} / 20:00
          </span>
          {nearLimit && (
            <span className="ml-auto flex items-center gap-1 text-xs text-berry-rose font-bold">
              <AlertTriangle size={12} />
              即将达到上限
            </span>
          )}
        </div>

        {/* 柯基展示区 */}
        <div className="relative bg-gradient-to-b from-corgi-yellow/10 to-transparent rounded-puffy p-8 mb-6 flex flex-col items-center overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="particle text-2xl"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {p.emoji}
            </div>
          ))}

          <CorgiMascot
            furColor={corgi.furColor}
            mood={corgi.mood}
            petType={corgi.petType}
            size={220}
          />

          {/* 名字 */}
          <div className="mt-4 flex items-center gap-2">
            {editName ? (
              <>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => handleCheckName(e.target.value)}
                  className="px-3 py-1 rounded-xl bg-warm-light border-2 border-corgi-yellow/40 text-text-primary font-display text-lg outline-none focus:border-corgi-orange"
                  maxLength={10}
                />
                <button
                  onClick={handleSaveName}
                  className="btn-press w-8 h-8 rounded-full bg-mint-fresh text-white flex items-center justify-center"
                >
                  <Check size={16} />
                </button>
              </>
            ) : (
              <>
                <p className="font-display text-xl text-text-primary">{corgi.name}</p>
                <button
                  onClick={() => { setEditName(true); setNameInput(corgi.name); setNameStatus(null); }}
                  className="text-text-light hover:text-corgi-orange text-xs"
                >
                  ✏️改名
                </button>
              </>
            )}
          </div>

          {/* 名字唯一性提示 */}
          {editName && nameStatus && (
            <div className={cn(
              'mt-2 px-3 py-1.5 rounded-xl text-xs font-bold border',
              nameStatus.unique
                ? 'bg-mint-fresh/15 text-mint-deep border-mint-fresh/30'
                : 'bg-berry-pink/15 text-berry-rose border-berry-pink/30'
            )}>
              {nameStatus.unique ? (
                <>✓ 名字可用</>
              ) : (
                <>
                  ✗ 名字已被占用
                  {nameStatus.suggestions.length > 0 && (
                    <span className="block mt-1">推荐：{nameStatus.suggestions.slice(0, 3).join('、')}</span>
                  )}
                </>
              )}
            </div>
          )}

          {/* 等级和连胜 */}
          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            <span
              className="text-xs font-bold px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: affLevel.color }}
            >
              Lv.{affLevel.level} {affLevel.label} {affLevel.emoji}
            </span>
            <span className="text-xs text-text-secondary bg-corgi-yellow/15 px-2 py-1 rounded-full font-bold flex items-center gap-1">
              <Flame size={12} className="text-corgi-orange" />
              连胜 {corgi.streak} 天
            </span>
            <span className="text-xs text-text-secondary bg-warm-light px-2 py-1 rounded-full font-bold">
              {FUR_COLORS[corgi.furColor].name}
            </span>
          </div>

          {/* 状态条 */}
          <div className="flex flex-col gap-2 mt-4 w-full max-w-xs">
            <StatusBar label="饱食度" value={corgi.satiety} max={100} icon="🍖" color="bg-corgi-orange" />
            <StatusBar label="好感度" value={corgi.affinity} max={500} icon="💕" color="bg-gradient-to-r from-berry-rose to-corgi-orange" showLevel={true} currentLevel={affLevel.level} />
          </div>

          {/* 互动次数 */}
          <div className="grid grid-cols-3 gap-2 mt-4 w-full max-w-xs">
            <CountBox label="今日抚摸" current={corgi.petCountToday} max={petUnlocked ? PET_DAILY_LIMIT : 0} icon="💛" unlocked={petUnlocked} />
            <CountBox label="今日喂食" current={corgi.feedCountToday} max={FEED_DAILY_LIMIT} icon="🍖" unlocked={true} />
            <CountBox label="今日玩耍" current={corgi.playCountToday} max={PLAY_DAILY_LIMIT} icon="🎮" unlocked={true} />
          </div>
        </div>

        {/* 互动按钮 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <InteractButton
            icon={Heart}
            label="抚摸"
            sublabel={petUnlocked ? `+2好感 ${corgi.petCountToday}/${PET_DAILY_LIMIT}` : 'Lv2 解锁'}
            color="bg-berry-pink/15 text-berry-rose hover:bg-berry-pink/25"
            onClick={() => handleInteract('pet')}
            locked={!petUnlocked}
          />
          <InteractButton
            icon={Utensils}
            label="喂食"
            sublabel={`${FEED_COST}积分 ${corgi.feedCountToday}/${FEED_DAILY_LIMIT}`}
            color="bg-corgi-orange/15 text-corgi-dark hover:bg-corgi-orange/25"
            onClick={() => handleInteract('feed')}
          />
          <InteractButton
            icon={Gamepad2}
            label="玩耍"
            sublabel={`+3好感 ${corgi.playCountToday}/${PLAY_DAILY_LIMIT}`}
            color="bg-mint-fresh/15 text-mint-deep hover:bg-mint-fresh/25"
            onClick={() => handleInteract('play')}
          />
        </div>

        {/* 零食与院子快捷入口 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <SoftButton
            variant="secondary"
            size="md"
            onClick={() => setShowSnackPicker(true)}
          >
            <Cookie size={18} />
            零食背包
            <span className="ml-1 text-xs bg-corgi-orange text-white px-1.5 py-0.5 rounded-full">
              {backpack.snacks.reduce((sum, s) => sum + s.count, 0)}
            </span>
          </SoftButton>
          <SoftButton
            variant={yardUnlocked ? 'accent' : 'secondary'}
            size="md"
            onClick={() => yardUnlocked ? setShowYard(true) : showToast('warning', `好感度 Lv.5 解锁${petLabel}小院子`)}
            className={cn(!yardUnlocked && 'opacity-60')}
          >
            <Home size={18} />
            {yardUnlocked ? `${petLabel}小院子` : `Lv5 解锁院子`}
          </SoftButton>
        </div>

        {/* 小游戏入口（Lv5 解锁） */}
        {miniGameUnlocked && (
          <div className="bg-gradient-to-r from-purple-100 to-corgi-yellow/10 rounded-puffy p-4 mb-6 border-2 border-purple-200 flex items-center gap-3">
            <div className="text-3xl">🎯</div>
            <div className="flex-1">
              <p className="font-display text-base text-text-primary">{petLabel}接零食小游戏</p>
              <p className="text-xs text-text-secondary">Lv.5 解锁，玩小游戏获得积分和好感</p>
            </div>
            <SoftButton variant="accent" size="sm" onClick={() => setShowMiniGame(true)}>
              <Trophy size={14} />
              开始
            </SoftButton>
          </div>
        )}

        {/* 毛色定制 */}
        <div className="bg-warm-light rounded-puffy p-5 shadow-soft border-2 border-corgi-yellow/20 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={20} className="text-corgi-orange" />
            <h3 className="font-display text-lg text-text-primary">毛色定制</h3>
            <span className="ml-auto text-xs text-text-secondary">
              {Object.keys(FUR_COLORS).length} 种毛色
            </span>
          </div>

          {/* 稀有度图例 */}
          <div className="flex flex-wrap gap-3 mb-4 px-1">
            {(Object.keys(FUR_RARITY_CONFIG) as Array<keyof typeof FUR_RARITY_CONFIG>).map((rarity) => {
              const config = FUR_RARITY_CONFIG[rarity];
              return (
                <span
                  key={rarity}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: config.color }}
                >
                  {config.label}
                </span>
              );
            })}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {(Object.keys(FUR_COLORS) as FurColor[]).map((color) => {
              const config = FUR_COLORS[color];
              const isActive = corgi.furColor === color;
              const unlockLevel = FUR_UNLOCK_LEVEL[color];
              const isLocked = affLevel.level < unlockLevel;
              const rarityConfig = FUR_RARITY_CONFIG[config.rarity];

              return (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  disabled={isLocked}
                  className={cn(
                    'btn-press relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all',
                    isActive
                      ? 'border-corgi-orange bg-corgi-orange/10 shadow-soft'
                      : isLocked
                        ? 'border-gray-200 bg-gray-100/50 opacity-60 cursor-not-allowed'
                        : 'border-transparent bg-warm-cream/50 hover:border-corgi-yellow/40'
                  )}
                >
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-corgi-orange flex items-center justify-center z-10">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  {isLocked && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center z-10">
                      <Lock size={10} className="text-white" />
                    </div>
                  )}
                  <div className="flex gap-1">
                    <div className="w-7 h-7 rounded-full border-2 border-white shadow" style={{ backgroundColor: config.body }} />
                    <div className="w-7 h-7 rounded-full border-2 border-white shadow" style={{ backgroundColor: config.ear }} />
                  </div>
                  <span className="text-xs font-bold text-text-secondary text-center leading-tight">
                    {config.name}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: rarityConfig.color }}
                  >
                    {rarityConfig.label}
                  </span>
                  {isLocked && (
                    <span className="text-[9px] text-berry-rose font-bold">需要 Lv.{unlockLevel}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 提示 */}
          <div className="mt-4 bg-corgi-yellow/10 rounded-xl p-3 flex items-start gap-2">
            <Star size={14} className="text-corgi-orange shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              完成番茄钟和日程提升 <span className="font-bold text-corgi-dark">{petLabel}等级</span>，解锁更多稀有毛色～
            </p>
          </div>
        </div>

        {/* 等级路线图 */}
        <div className="bg-warm-light rounded-puffy p-5 shadow-soft border-2 border-corgi-yellow/20 mb-6">
          <h3 className="font-display text-lg text-text-primary mb-4">📜 好感度等级路线</h3>
          <div className="flex flex-col gap-2">
            {AFFINITY_LEVELS.map((lv) => {
              const isCurrent = lv.level === affLevel.level;
              const isUnlocked = lv.level <= affLevel.level;
              return (
                <div
                  key={lv.level}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl border-2 transition-all',
                    isCurrent
                      ? 'border-corgi-orange bg-corgi-orange/10 shadow-soft'
                      : isUnlocked
                        ? 'border-mint-fresh/30 bg-mint-fresh/5'
                        : 'border-gray-200 bg-gray-100/30 opacity-60'
                  )}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: lv.color }}
                  >
                    {lv.level}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-primary">
                      {lv.label} {lv.emoji}
                      {isCurrent && <span className="ml-2 text-xs text-corgi-orange">← 当前</span>}
                    </p>
                    <p className="text-xs text-text-secondary">{lv.unlock}</p>
                  </div>
                  <span className="text-xs text-text-light font-bold">
                    {lv.min}-{lv.max === 9999 ? '∞' : lv.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 提示 */}
        <div className="bg-corgi-yellow/10 rounded-2xl p-4 border-2 border-corgi-yellow/20 flex items-start gap-3">
          <Sparkles size={20} className="text-corgi-orange shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-text-primary mb-1">💡 玩法说明</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              · 抚摸/玩耍/喂食提升好感度，每 100 点升一级<br />
              · 离线时饱食度每小时降低 10 点，记得回来喂食<br />
              · 断签会重置连胜，每天至少互动一次保持连胜<br />
              · 单次互动 20 分钟会触发防沉迷，自动跳转日程页<br />
              · 盲盒可抽到零食，零食可代替积分喂食{petLabel}
            </p>
          </div>
        </div>
      </div>

      {/* 零食背包弹窗 */}
      {showSnackPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowSnackPicker(false)}
        >
          <div
            className="bg-warm-light rounded-puffy p-5 max-w-sm w-full shadow-puffy animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-text-primary flex items-center gap-2">
                <Cookie size={20} className="text-corgi-orange" />
                零食背包
              </h3>
              <button onClick={() => setShowSnackPicker(false)} className="text-text-light hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              零食可代替积分喂食{petLabel}，不同零食恢复不同饱食度
            </p>
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {backpack.snacks.map((snack) => (
                <button
                  key={snack.reward.id}
                  onClick={() => handleFeedSnack(snack.reward.id)}
                  disabled={snack.count <= 0}
                  className={cn(
                    'btn-press flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all',
                    snack.count > 0
                      ? 'bg-corgi-yellow/10 border-corgi-yellow/40 hover:border-corgi-orange'
                      : 'bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed'
                  )}
                >
                  <span className="text-3xl">{snack.reward.emoji}</span>
                  <span className="text-xs font-bold text-text-primary">{snack.reward.name}</span>
                  <span className="text-[10px] text-text-secondary">+{snack.reward.satietyValue} 饱食</span>
                  <span className="text-xs font-bold text-corgi-dark">x{snack.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 柯基小院子 */}
      {showYard && yardUnlocked && <YardScene onClose={() => setShowYard(false)} petLabel={petLabel} petType={corgi.petType} />}

      {/* 小游戏 */}
      {showMiniGame && miniGameUnlocked && (
        <MiniGame
          onClose={() => setShowMiniGame(false)}
          onWin={(points, affinity) => {
            useBackpackStore.getState().addPoints(points);
            useCorgiStore.getState().addAffinity(affinity);
            showToast('success', `游戏胜利！+${points}积分 +${affinity}好感`);
          }}
          petLabel={petLabel}
          petType={corgi.petType}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-puffy text-sm font-bold animate-pop-in flex items-center gap-2',
          toast.type === 'success' && 'bg-mint-deep text-white',
          toast.type === 'error' && 'bg-berry-rose text-white',
          toast.type === 'warning' && 'bg-corgi-orange text-white'
        )}>
          {toast.type === 'success' && <Check size={14} />}
          {toast.type === 'error' && <X size={14} />}
          {toast.type === 'warning' && <AlertTriangle size={14} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ===== 状态条 =====
function StatusBar({ label, value, max, icon, color, showLevel, currentLevel }: {
  label: string; value: number; max: number; icon: string; color: string;
  showLevel?: boolean; currentLevel?: number;
}) {
  const percent = (value / max) * 100;
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-text-secondary font-bold">{label}</span>
        {showLevel && currentLevel && (
          <span className="text-[10px] font-bold text-corgi-dark bg-corgi-yellow/20 px-1.5 py-0.5 rounded-full">
            Lv.{currentLevel}
          </span>
        )}
        <span className="ml-auto text-xs text-text-light font-bold">{value}/{max}</span>
      </div>
      <div className="w-full h-3 bg-corgi-yellow/20 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ===== 互动次数计数 =====
function CountBox({ label, current, max, icon, unlocked }: {
  label: string; current: number; max: number; icon: string; unlocked: boolean;
}) {
  return (
    <div className={cn(
      'rounded-2xl p-2 text-center border-2',
      unlocked ? 'bg-warm-cream/50 border-corgi-yellow/30' : 'bg-gray-100 border-gray-200 opacity-60'
    )}>
      <div className="text-base">{unlocked ? icon : '🔒'}</div>
      <p className="text-xs font-bold text-text-primary">{unlocked ? `${current}/${max}` : '未解锁'}</p>
      <p className="text-[10px] text-text-light">{label}</p>
    </div>
  );
}

// ===== 互动按钮 =====
function InteractButton({ icon: Icon, label, sublabel, color, onClick, locked }: {
  icon: typeof Heart; label: string; sublabel: string; color: string;
  onClick: () => void; locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'btn-press flex flex-col items-center gap-1 py-4 rounded-2xl font-bold transition-all relative',
        color,
        locked && 'opacity-60'
      )}
    >
      {locked && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center">
          <Lock size={10} className="text-white" />
        </div>
      )}
      <Icon size={26} />
      <span className="text-sm">{label}</span>
      <span className="text-[10px] opacity-70">{sublabel}</span>
    </button>
  );
}

// ===== 柯基小院子场景 =====
function YardScene({ onClose, petLabel, petType }: { onClose: () => void; petLabel: string; petType: import('@/types').PetType }) {
  const { corgi, interact } = useCorgiStore();
  const [toys, setToys] = useState<{ id: number; x: number; y: number; emoji: string }[]>([
    { id: 1, x: 20, y: 70, emoji: '🎾' },
    { id: 2, x: 75, y: 75, emoji: '🦴' },
    { id: 3, x: 50, y: 30, emoji: '🌷' },
  ]);
  const [pettings, setPettings] = useState(0);

  const handlePet = () => {
    interact('pet');
    setPettings(p => p + 1);
    // 让玩具浮动一下
    setToys(prev => prev.map(t => ({ ...t, y: Math.max(20, t.y - 5) })));
    setTimeout(() => {
      setToys(prev => prev.map(t => ({ ...t, y: t.y + 5 > 80 ? 80 : t.y + 5 })));
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-mint-fresh/30 to-corgi-yellow/20 rounded-puffy p-4 max-w-md w-full shadow-puffy animate-pop-in relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-warm-light flex items-center justify-center text-text-secondary hover:text-text-primary"
        >
          <X size={18} />
        </button>

        <h3 className="font-display text-lg text-text-primary text-center mb-2">🏡 {petLabel}的小院子</h3>
        <p className="text-xs text-text-secondary text-center mb-4">Lv.5 专属场景，和{corgi.name}尽情玩耍</p>

        {/* 院子场景 */}
        <div className="relative bg-gradient-to-b from-sky-200/50 to-mint-fresh/30 rounded-2xl h-72 overflow-hidden border-2 border-corgi-yellow/30">
          {/* 太阳 */}
          <div className="absolute top-3 right-3 text-3xl">☀️</div>
          {/* 云 */}
          <div className="absolute top-5 left-5 text-2xl animate-float">☁️</div>
          <div className="absolute top-12 left-20 text-xl animate-float" style={{ animationDelay: '0.5s' }}>☁️</div>

          {/* 草地 */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-mint-fresh/40 flex items-end justify-around px-2">
            <span className="text-xl">🌱</span>
            <span className="text-lg">🌼</span>
            <span className="text-xl">🌷</span>
            <span className="text-lg">🌻</span>
            <span className="text-xl">🌱</span>
          </div>

          {/* 玩具 */}
          {toys.map((toy) => (
            <div
              key={toy.id}
              className="absolute text-2xl transition-all duration-500"
              style={{ left: `${toy.x}%`, top: `${toy.y}%` }}
            >
              {toy.emoji}
            </div>
          ))}

          {/* 宠物 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <CorgiMascot
              furColor={corgi.furColor}
              petType={petType}
              mood="excited"
              size={140}
              floating={true}
            />
          </div>

          {/* 互动粒子 */}
          {pettings > 0 && pettings % 3 === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl animate-pop-in">
              💕
            </div>
          )}
        </div>

        {/* 院子互动 */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={handlePet}
            className="btn-press flex flex-col items-center gap-1 py-2 rounded-2xl bg-berry-pink/15 text-berry-rose hover:bg-berry-pink/25"
          >
            <Heart size={20} />
            <span className="text-xs font-bold">抚摸</span>
          </button>
          <button
            onClick={() => setToys(prev => [...prev, { id: Date.now(), x: Math.random() * 80 + 10, y: Math.random() * 50 + 30, emoji: '🪀' }])}
            className="btn-press flex flex-col items-center gap-1 py-2 rounded-2xl bg-corgi-orange/15 text-corgi-dark hover:bg-corgi-orange/25"
          >
            <span className="text-xl">🪀</span>
            <span className="text-xs font-bold">扔玩具</span>
          </button>
          <button
            onClick={() => setToys(prev => prev.filter((_, i) => i !== prev.length - 1))}
            className="btn-press flex flex-col items-center gap-1 py-2 rounded-2xl bg-mint-fresh/15 text-mint-deep hover:bg-mint-fresh/25"
          >
            <span className="text-xl">🧹</span>
            <span className="text-xs font-bold">收拾</span>
          </button>
        </div>

        <p className="text-center text-xs text-text-secondary mt-3">
          已抚摸 {pettings} 次 · 玩具 {toys.length} 个
        </p>
      </div>
    </div>
  );
}

// ===== {petLabel}接零食小游戏 =====
function MiniGame({ onClose, onWin, petLabel, petType }: { onClose: () => void; onWin: (points: number, affinity: number) => void; petLabel: string; petType: import('@/types').PetType }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [snacks, setSnacks] = useState<{ id: number; x: number; y: number; emoji: string; speed: number }[]>([]);
  const [corgiX, setCorgiX] = useState(50);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const gameRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setScore(0);
    setTimeLeft(20);
    setSnacks([]);
    setPlaying(true);
    setFinished(false);

    // 倒计时
    gameRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPlaying(false);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // 零食下落
    fallRef.current = setInterval(() => {
      setSnacks((prev) => {
        const moved = prev
          .map((s) => ({ ...s, y: s.y + s.speed }))
          .filter((s) => s.y < 100);
        // 检查是否被柯基接到
        const caught = moved.filter((s) => s.y > 75 && Math.abs(s.x - corgiX) < 12);
        if (caught.length > 0) {
          setScore((sc) => sc + caught.length * 10);
        }
        return moved.filter((s) => !(s.y > 75 && Math.abs(s.x - corgiX) < 12));
      });
      // 生成新零食
      if (Math.random() < 0.4) {
        const emojis = ['🍪', '🦴', '🍖', '🍗', '🐟'];
        setSnacks((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x: Math.random() * 90 + 5,
            y: 0,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            speed: 2 + Math.random() * 2,
          },
        ]);
      }
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (gameRef.current) clearInterval(gameRef.current);
      if (fallRef.current) clearInterval(fallRef.current);
    };
  }, []);

  useEffect(() => {
    if (finished) {
      if (gameRef.current) clearInterval(gameRef.current);
      if (fallRef.current) clearInterval(fallRef.current);
      const points = score;
      const affinity = Math.floor(score / 20);
      onWin(points, affinity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!playing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = ((clientX - rect.left) / rect.width) * 100;
    setCorgiX(Math.max(10, Math.min(90, x)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-warm-light rounded-puffy p-4 max-w-md w-full shadow-puffy animate-pop-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-text-primary flex items-center gap-2">
            <Trophy size={20} className="text-corgi-orange" />
            {petLabel}接零食
          </h3>
          <button onClick={onClose} className="text-text-light hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {!playing && !finished && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3 animate-float">🎯</div>
            <p className="text-sm font-bold text-text-primary mb-1">游戏规则</p>
            <p className="text-xs text-text-secondary mb-4">
              20 秒内移动手指/鼠标接住下落的零食<br />
              每个零食 +10 分，可换积分和好感
            </p>
            <SoftButton variant="accent" size="lg" onClick={start}>
              开始游戏
            </SoftButton>
          </div>
        )}

        {(playing || finished) && (
          <>
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-sm font-bold text-corgi-dark">分数: {score}</span>
              <span className="text-sm font-bold text-berry-rose">⏱ {timeLeft}s</span>
            </div>
            <div
              className="relative bg-gradient-to-b from-sky-100 to-mint-fresh/30 rounded-2xl h-72 overflow-hidden border-2 border-corgi-yellow/30 touch-none"
              onMouseMove={handleMove}
              onTouchMove={handleMove}
            >
              {/* 零食 */}
              {snacks.map((s) => (
                <div
                  key={s.id}
                  className="absolute text-2xl"
                  style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {s.emoji}
                </div>
              ))}
              {/* 宠物 */}
              <div
                className="absolute bottom-0 transition-all duration-100"
                style={{ left: `${corgiX}%`, transform: 'translateX(-50%)' }}
              >
                <CorgiMascot petType={petType} mood="excited" size={80} floating={false} />
              </div>
              {finished && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                  <p className="text-3xl font-bold mb-2">游戏结束</p>
                  <p className="text-xl">得分: {score}</p>
                  <p className="text-sm mt-1">+{score} 积分 · +{Math.floor(score / 20)} 好感</p>
                </div>
              )}
            </div>
            {finished && (
              <div className="flex gap-2 mt-3">
                <SoftButton variant="secondary" size="sm" className="flex-1" onClick={onClose}>
                  关闭
                </SoftButton>
                <SoftButton variant="accent" size="sm" className="flex-1" onClick={start}>
                  再玩一次
                </SoftButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
