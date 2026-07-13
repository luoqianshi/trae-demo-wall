import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, User, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCorgiStore } from '@/store/corgiStore';
import { useUserStore, isNicknameTaken } from '@/store/userStore';

// 宠物类型选项
const PET_TYPES = [
  { id: 'corgi', label: '柯基狗狗', emoji: '🐕', desc: '软萌短腿小短腿' },
  { id: 'ragdoll', label: '布偶猫', emoji: '🐱', desc: '优雅布偶仙女猫' },
  { id: 'golden', label: '金毛', emoji: '🐶', desc: '暖男大金毛' },
  { id: 'shiba', label: '柴犬', emoji: '🐶', desc: '微笑柴柴' },
  { id: 'tabby', label: '虎斑猫', emoji: '🐱', desc: '霸气虎斑' },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { setCorgiName, setPetType, adopt } = useCorgiStore();
  const { profile, setProfile } = useUserStore();

  // 深色欢迎页：点击"单击继续"后进入昵称填写
  const [showDarkWelcome, setShowDarkWelcome] = useState(true);

  const [nickname, setNickname] = useState(profile.nickname || '');
  const [petName, setPetName] = useState('');
  const [selectedPetType, setSelectedPetType] = useState<'corgi' | 'ragdoll' | 'golden' | 'shiba' | 'tabby'>('corgi');

  // 生成今日日期字符串
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 昵称唯一性校验：排除当前用户已保存的昵称（编辑场景下允许保持原昵称）
  const currentNickname = profile.nickname;
  const nicknameTaken = nickname.trim().length > 0 && isNicknameTaken(nickname, currentNickname);
  // 可提交：昵称非空、未被占用、宠物名非空
  const canStart = nickname.trim().length > 0 && !nicknameTaken && petName.trim().length > 0;

  const handleStart = () => {
    if (!canStart) return;
    const finalNickname = nickname.trim();
    setCorgiName(petName.trim());
    setPetType(selectedPetType);
    setProfile({
      nickname: finalNickname,
      enrollmentDate: todayStr(),
    });
    adopt();
    navigate('/routine');
  };

  return (
    <>
      {/* 深色欢迎页：首次进入时展示，点击"单击继续"后进入昵称填写 */}
      {showDarkWelcome && (
        <div
          className="fixed inset-0 z-50 bg-gradient-to-b from-corgi-deep via-corgi-dark to-corgi-brown flex flex-col items-center justify-center px-6 cursor-pointer animate-fade-in"
          onClick={() => setShowDarkWelcome(false)}
        >
          <div className="text-center">
            <p className="text-6xl mb-4 animate-float">⏱️✨</p>
            <h1 className="font-display text-4xl text-warm-light mb-2">时间优化大师</h1>
            <p className="text-sm text-warm-light/70 mt-2">个性化学生时间管理 · 智能计划生成</p>
          </div>
          {/* 单击继续提示 */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-warm-light/90 text-sm font-bold">单击继续</span>
            <ChevronRight size={20} className="text-warm-light/70" />
          </div>
        </div>
      )}

      {/* 昵称填写表单（原有设置界面） */}
    <div className="min-h-screen warm-bg flex flex-col items-center justify-center px-4 pb-10">
      <div className="text-center mb-8">
        <p className="text-4xl mb-2">⏱️✨</p>
        <h1 className="font-display text-3xl text-text-primary">时间优化大师</h1>
        <p className="text-sm text-text-secondary mt-1">个性化学生时间管理 · 智能计划生成</p>
      </div>

      <div className="w-full max-w-md bg-warm-light rounded-3xl p-6 shadow-soft border-2 border-corgi-orange/30">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-corgi-orange" />
          <h2 className="font-display text-lg text-text-primary">开始设置</h2>
        </div>

        {/* 用户昵称（系统内唯一，不可重复） */}
        <div className="mb-4">
          <label className="text-xs text-text-secondary font-bold block mb-1">你的昵称</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="给自己起个名字，如：小明"
            className={cn(
              'w-full px-3 py-2 rounded-xl border-2 bg-warm-cream text-sm font-bold focus:outline-none transition-colors',
              nicknameTaken
                ? 'border-berry-rose focus:border-berry-rose'
                : 'border-corgi-yellow/30 focus:border-corgi-orange'
            )}
          />
          {nicknameTaken ? (
            <p className="text-[10px] text-berry-rose mt-1 font-bold">⚠️ 这个昵称已被使用，请换一个</p>
          ) : (
            <p className="text-[10px] text-text-light mt-1">📝 昵称在系统内唯一，请记住它以便下次使用</p>
          )}
        </div>

        {/* 宠物名字 */}
        <div className="mb-4">
          <label className="text-xs text-text-secondary font-bold block mb-1">给你的宠物起个名字</label>
          <input
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="比如：布丁 / 奶糖"
            className="w-full px-3 py-2 rounded-xl border-2 border-corgi-yellow/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-corgi-orange"
          />
        </div>

        {/* 宠物类型 */}
        <div className="mb-4">
          <label className="text-xs text-text-secondary font-bold block mb-2">选择宠物类型</label>
          <div className="grid grid-cols-3 gap-2">
            {PET_TYPES.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPetType(p.id as any)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all',
                  selectedPetType === p.id
                    ? 'border-corgi-orange bg-corgi-orange/15'
                    : 'border-corgi-yellow/20 bg-warm-cream hover:border-corgi-yellow/40'
                )}
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-xs font-bold">{p.label}</span>
                <span className="text-[10px] text-text-light">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 年级和学期选择已移除，默认按入学日期自动推算 */}

        <button
          onClick={handleStart}
          disabled={!canStart}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-2xl text-white font-bold shadow-soft transition-all',
            !canStart
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-corgi-orange to-berry-rose hover:shadow-puffy'
          )}
        >
          <Sparkles size={18} />
          下一步
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-text-secondary">
        <p>首次设置后可在设置页修改信息</p>
      </div>
    </div>
    </>
  );
}
