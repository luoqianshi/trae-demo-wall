import type { CorgiMood, FurColor, PetType } from '@/types';
import { FUR_COLORS } from '@/store/corgiStore';
import { cn } from '@/lib/utils';

interface CorgiMascotProps {
  furColor?: FurColor;
  mood?: CorgiMood;
  petType?: PetType;
  size?: number;
  className?: string;
  floating?: boolean;
}

const PET_EMOJI: Record<PetType, string> = {
  corgi: '🐕',
  ragdoll: '🐱',
  golden: '🐶',
  shiba: '🐶',
  tabby: '🐱',
};

const PET_LABEL: Record<PetType, string> = {
  corgi: '柯基',
  ragdoll: '布偶猫',
  golden: '金毛',
  shiba: '柴犬',
  tabby: '虎斑猫',
};

// 是否是猫类
const isCat = (t: PetType) => t === 'ragdoll' || t === 'tabby';
// 是否是垂耳狗（金毛）
const isFloppy = (t: PetType) => t === 'golden';

export { PET_LABEL };

export default function CorgiMascot({
  furColor = 'classic',
  mood = 'happy',
  petType = 'corgi',
  size = 200,
  className,
  floating = true,
}: CorgiMascotProps) {
  const c = FUR_COLORS[furColor];
  const uid = `pet-${petType}-${furColor}-${mood}`;

  return (
    <div
      className={cn(floating && 'animate-float', 'flex flex-col items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 220" width="100%" height="100%">
        <defs>
          <radialGradient id={`${uid}-main`} cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor={lighten(c.body, 15)} />
            <stop offset="55%" stopColor={c.body} />
            <stop offset="100%" stopColor={c.patch} />
          </radialGradient>
          <radialGradient id={`${uid}-belly`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor={c.belly} />
            <stop offset="100%" stopColor={c.belly} />
          </radialGradient>
          <linearGradient id={`${uid}-ear`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={c.ear} />
            <stop offset="100%" stopColor={c.patch} />
          </linearGradient>
          <radialGradient id={`${uid}-shine`} cx="30%" cy="25%" r="40%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 地面阴影 */}
        <ellipse cx="100" cy="205" rx="55" ry="7" fill="#D4C5B0" opacity="0.4" />

        {/* 一体化身体 */}
        <path
          d="M 100 80 C 70 80, 50 100, 48 130 C 46 155, 56 178, 75 188 C 78 195, 80 198, 84 198 C 88 198, 92 195, 92 190 L 108 190 C 108 195, 112 198, 116 198 C 120 198, 122 195, 125 188 C 144 178, 154 155, 152 130 C 150 100, 130 80, 100 80 Z"
          fill={`url(#${uid}-main)`}
        />

        {/* 尾巴 */}
        <path
          d="M 145 150 C 165 140, 178 125, 175 110 C 173 102, 165 100, 160 108 C 156 116, 152 130, 145 145 Z"
          fill={`url(#${uid}-main)`}
        />
        <ellipse cx="172" cy="108" rx="7" ry="6" fill={c.belly} />
        <ellipse cx="171" cy="106" rx="3.5" ry="3" fill="#FFFFFF" opacity="0.7" />

        {/* 肚子 */}
        <ellipse cx="100" cy="155" rx="32" ry="28" fill={`url(#${uid}-belly)`} />

        {/* 身体高光 */}
        <ellipse cx="78" cy="115" rx="22" ry="18" fill={`url(#${uid}-shine)`} />

        {/* 脚掌 */}
        <ellipse cx="78" cy="192" rx="9" ry="5" fill={c.belly} />
        <ellipse cx="92" cy="193" rx="8" ry="4.5" fill={c.belly} />
        <ellipse cx="108" cy="193" rx="8" ry="4.5" fill={c.belly} />
        <ellipse cx="122" cy="192" rx="9" ry="5" fill={c.belly} />

        {/* 大圆头 */}
        <ellipse cx="100" cy="82" rx="50" ry="46" fill={`url(#${uid}-main)`} />
        <ellipse cx="80" cy="62" rx="22" ry="18" fill={`url(#${uid}-shine)`} />

        {/* 头顶花色 */}
        <path
          d="M 78 52 Q 88 42 100 44 Q 112 42 122 52 Q 124 66 112 74 Q 100 68 88 74 Q 76 66 78 52 Z"
          fill={`url(#${uid}-belly)`}
        />

        {/* 耳朵 */}
        {isCat(petType) ? (
          <>
            <path d="M 62 54 L 52 22 L 72 26 Z" fill={`url(#${uid}-ear)`} stroke={c.body} strokeWidth="2" strokeLinejoin="round" />
            <path d="M 138 54 L 148 22 L 128 26 Z" fill={`url(#${uid}-ear)`} stroke={c.body} strokeWidth="2" strokeLinejoin="round" />
          </>
        ) : isFloppy(petType) ? (
          <>
            <path d="M 60 55 Q 42 38 50 22 C 58 18 76 35 82 65 Z" fill={`url(#${uid}-ear)`} />
            <path d="M 140 55 Q 158 38 150 22 C 142 18 124 35 118 65 Z" fill={`url(#${uid}-ear)`} />
          </>
        ) : (
          <>
            <path d="M 58 58 Q 50 32 70 34 Q 86 40 84 70 Z" fill={`url(#${uid}-ear)`} />
            <path d="M 142 58 Q 150 32 130 34 Q 114 40 116 70 Z" fill={`url(#${uid}-ear)`} />
          </>
        )}

        {/* 眼睛 */}
        {mood === 'happy' && (
          <>
            <ellipse cx="76" cy="84" rx="7" ry="8" fill="#2E2418" />
            <ellipse cx="75" cy="80" rx="3" ry="2.8" fill="#FFFFFF" />
            <ellipse cx="124" cy="84" rx="7" ry="8" fill="#2E2418" />
            <ellipse cx="123" cy="80" rx="3" ry="2.8" fill="#FFFFFF" />
          </>
        )}
        {mood === 'excited' && (
          <>
            <ellipse cx="76" cy="84" rx="8" ry="8.5" fill="#2E2418" />
            <ellipse cx="75" cy="79" rx="4" ry="3.5" fill="#FFFFFF" />
            <ellipse cx="124" cy="84" rx="8" ry="8.5" fill="#2E2418" />
            <ellipse cx="123" cy="79" rx="4" ry="3.5" fill="#FFFFFF" />
          </>
        )}
        {mood === 'sleepy' && (
          <>
            <path d="M68 84 L84 84" stroke="#2E2418" strokeWidth="3" strokeLinecap="round" />
            <path d="M116 84 L132 84" stroke="#2E2418" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {mood === 'sad' && (
          <>
            <ellipse cx="76" cy="86" rx="6" ry="6.5" fill="#2E2418" />
            <ellipse cx="124" cy="86" rx="6" ry="6.5" fill="#2E2418" />
            <ellipse cx="78" cy="95" rx="3" ry="2" fill="#A0D8EF" opacity="0.7" />
            <ellipse cx="126" cy="95" rx="3" ry="2" fill="#A0D8EF" opacity="0.7" />
          </>
        )}
        {mood === 'normal' && (
          <>
            <ellipse cx="76" cy="84" rx="6.5" ry="7.5" fill="#2E2418" />
            <ellipse cx="75" cy="80" rx="2.5" ry="2.2" fill="#FFFFFF" />
            <ellipse cx="124" cy="84" rx="6.5" ry="7.5" fill="#2E2418" />
            <ellipse cx="123" cy="80" rx="2.5" ry="2.2" fill="#FFFFFF" />
          </>
        )}

        {/* 鼻子 */}
        <ellipse cx="100" cy="102" rx="6" ry="5" fill="#2E2418" />
        <ellipse cx="98" cy="100" rx="2.2" ry="1.5" fill="#FFFFFF" opacity="0.7" />

        {/* 嘴巴 */}
        {mood === 'happy' && (
          <path d="M86 108 Q100 122 114 108" stroke="#2E2418" strokeWidth="3" fill="#FF6B8A" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {mood === 'sleepy' && (
          <ellipse cx="100" cy="112" rx="5" ry="4" fill="#2E2418" opacity="0.6" />
        )}
        {mood === 'excited' && (
          <>
            <path d="M84 106 Q100 128 116 106 Z" fill="#FF6B8A" />
            <path d="M84 106 Q100 128 116 106" stroke="#2E2418" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        )}
        {mood === 'sad' && (
          <path d="M92 116 Q100 108 108 116" stroke="#2E2418" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        {mood === 'normal' && (
          <path d="M93 111 Q100 116 107 111" stroke="#2E2418" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        )}

        {/* 腮红 */}
        <ellipse cx="66" cy="98" rx="7" ry="5" fill="#FFB3B3" opacity="0.5" />
        <ellipse cx="134" cy="98" rx="7" ry="5" fill="#FFB3B3" opacity="0.5" />

        {/* 猫类胡须 + 虎斑条纹 */}
        {isCat(petType) && (
          <>
            <line x1="52" y1="98" x2="68" y2="100" stroke="#2E2418" strokeWidth="1.5" opacity="0.5" />
            <line x1="52" y1="104" x2="68" y2="104" stroke="#2E2418" strokeWidth="1.5" opacity="0.5" />
            <line x1="132" y1="100" x2="148" y2="98" stroke="#2E2418" strokeWidth="1.5" opacity="0.5" />
            <line x1="132" y1="104" x2="148" y2="104" stroke="#2E2418" strokeWidth="1.5" opacity="0.5" />
            {petType === 'tabby' && (
              <>
                <path d="M 78 52 Q 88 47 100 48 Q 112 47 122 52" stroke={c.patch} strokeWidth="3" fill="none" opacity="0.6" />
                <path d="M 82 56 Q 88 52 94 54" stroke={c.patch} strokeWidth="2.5" fill="none" opacity="0.5" />
                <path d="M 106 54 Q 112 52 118 56" stroke={c.patch} strokeWidth="2.5" fill="none" opacity="0.5" />
              </>
            )}
          </>
        )}

        {/* 装饰 */}
        {mood === 'excited' && (
          <>
            <text x="38" y="38" fontSize="14" fill="#FF9F43">✦</text>
            <text x="155" y="38" fontSize="12" fill="#FF9F43">✦</text>
          </>
        )}
        {mood === 'sleepy' && (
          <>
            <text x="160" y="42" fontSize="14" fill="#B0A088" opacity="0.7">z</text>
            <text x="170" y="34" fontSize="11" fill="#B0A088" opacity="0.6">z</text>
          </>
        )}
      </svg>

      {/* 宠物类型标签 */}
      <div className="mt-1 bg-warm-light/80 px-3 py-0.5 rounded-full text-xs font-bold text-text-secondary border border-corgi-yellow/20">
        {PET_EMOJI[petType]} {PET_LABEL[petType]}
      </div>
    </div>
  );
}

function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round((255 - ((num >> 16) & 0xff)) * (percent / 100)));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round((255 - ((num >> 8) & 0xff)) * (percent / 100)));
  const b = Math.min(255, (num & 0xff) + Math.round((255 - (num & 0xff)) * (percent / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}