import { ICONS } from "@/lib/icons";
import type { LucideIcon } from "lucide-react";
import type { CareerAvatar } from "@/types";

export type AvatarAction = "idle" | "typing" | "wave" | "think" | "coffee";

interface AvatarSVGProps {
  avatar: CareerAvatar;
  gender: "male" | "female" | "other" | undefined;
  size?: number;
  className?: string;
  float?: boolean; // 是否有呼吸浮动动画
  action?: AvatarAction; // 场景中的动作
  bubble?: string; // 对话气泡内容（可选）
}

/**
 * 极简几何风格卡通人物（苹果风）
 * 用基础几何图形组合：圆（头）、圆角矩形（身体）、路径（头发）
 * - 眼镜戴在眼睛位置
 * - 眉毛随动作变化
 * - 衣服有纽扣/口袋细节
 * - 支持 typing/wave/think/coffee 等动作
 */
export default function AvatarSVG({
  avatar,
  gender,
  size = 200,
  className = "",
  float = true,
  action = "idle",
  bubble,
}: AvatarSVGProps) {
  const Accessory = (ICONS[avatar.accessory] || ICONS.Glasses) as LucideIcon;
  const isFemale = gender === "female";
  const isOther = gender === "other" || !gender;

  // 唯一 ID（避免多个 SVG 渐变冲突）
  const uid = `${avatar.costume.replace("#", "")}-${action}`;

  // 发型路径
  const hairPath = (() => {
    switch (avatar.hairStyle) {
      case "long":
        return isFemale
          ? "M 56 78 Q 50 50 75 42 Q 100 34 125 42 Q 150 50 144 78 L 148 120 Q 146 126 140 124 L 138 90 Q 130 84 100 84 Q 70 84 62 90 L 60 124 Q 54 126 52 120 Z"
          : "M 58 80 Q 52 52 75 44 Q 100 36 125 44 Q 148 52 142 80 L 140 96 Q 130 88 100 88 Q 70 88 60 96 Z";
      case "bun":
        return "M 58 80 Q 52 52 75 44 Q 100 36 125 44 Q 148 52 142 80 L 140 92 Q 130 86 100 86 Q 70 86 60 92 Z M 88 30 Q 100 18 112 30 Q 112 42 100 44 Q 88 42 88 30 Z";
      case "curly":
        return "M 54 82 Q 44 60 60 48 Q 70 36 85 42 Q 100 30 115 42 Q 130 36 140 48 Q 156 60 146 82 L 142 94 Q 132 86 100 86 Q 68 86 58 94 Z";
      case "short":
      default:
        return "M 58 80 Q 52 52 75 44 Q 100 36 125 44 Q 148 52 142 80 L 140 92 Q 130 86 100 86 Q 70 86 60 92 Z";
    }
  })();

  // 身体路径（圆角梯形）
  const bodyPath = "M 62 150 Q 62 138 74 136 L 126 136 Q 138 138 138 150 L 138 200 L 62 200 Z";

  // 眉毛路径（根据动作变化）
  const browPath = (() => {
    switch (action) {
      case "think":
        // 思考：左眉上挑
        return "M 82 84 Q 89 80 96 84 M 104 86 Q 111 84 118 86";
      case "coffee":
        // 满足：眉毛放松
        return "M 82 85 Q 89 83 96 85 M 104 85 Q 111 83 118 85";
      case "wave":
        // 开心：眉毛上扬
        return "M 82 82 Q 89 78 96 82 M 104 82 Q 111 78 118 82";
      case "typing":
      case "idle":
      default:
        // 平静
        return "M 82 84 Q 89 83 96 84 M 104 84 Q 111 83 118 84";
    }
  })();

  // 嘴巴路径（根据动作变化）
  const mouthPath = (() => {
    switch (action) {
      case "think":
        return "M 95 110 L 105 110"; // 一字嘴
      case "coffee":
        return "M 92 108 Q 100 113 108 108"; // 满足微笑
      case "wave":
        return "M 90 107 Q 100 116 110 107"; // 大笑
      case "typing":
        return "M 93 109 Q 100 112 107 109"; // 专注小嘴
      case "idle":
      default:
        return isFemale ? "M 92 108 Q 100 114 108 108" : "M 93 108 Q 100 112 107 108";
    }
  })();

  // 是否显示手持道具
  const showCoffee = action === "coffee";
  const showWave = action === "wave";
  const showTyping = action === "typing";

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        animation: float ? "avatar-breath 3.5s ease-in-out infinite" : undefined,
      }}
    >
      <style>{`
        @keyframes avatar-breath {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.01); }
        }
        @keyframes avatar-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        .avatar-eye-${uid} {
          animation: avatar-blink 4s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes avatar-arm-type-${uid} {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-6deg); }
          75% { transform: rotate(6deg); }
        }
        @keyframes avatar-arm-wave-${uid} {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
        @keyframes bubble-pop-${uid} {
          0% { transform: scale(0) translateY(10px); opacity: 0; }
          60% { transform: scale(1.08) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>

      {/* 对话气泡 */}
      {bubble && (
        <div
          style={{
            position: "absolute",
            top: -12,
            right: -24,
            transformOrigin: "bottom right",
            animation: `bubble-pop-${uid} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(15, 20, 36, 0.92)",
              color: "#f5f7ff",
              padding: "7px 14px",
              borderRadius: 12,
              borderBottomRightRadius: 4,
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.4,
              maxWidth: 180,
              whiteSpace: "normal",
              wordBreak: "break-word",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
              textRendering: "optimizeLegibility",
              WebkitFontSmoothing: "antialiased",
              backdropFilter: "blur(8px)",
            }}
          >
            {bubble}
          </div>
        </div>
      )}

      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`costume-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={avatar.costume} stopOpacity="0.95" />
            <stop offset="100%" stopColor={avatar.costume} stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id={`skin-${uid}`} cx="0.4" cy="0.3">
            <stop offset="0%" stopColor="#fce7d4" />
            <stop offset="100%" stopColor="#e8c4a0" />
          </radialGradient>
          <filter id={`glow-${uid}`}>
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 光晕背景 */}
        <circle cx="100" cy="100" r="90" fill={avatar.costume} opacity="0.08" filter={`url(#glow-${uid})`} />

        {/* 手臂（动作相关） */}
        {showTyping && (
          <g style={{ transformOrigin: "62px 150px", animation: `avatar-arm-type-${uid} 0.6s ease-in-out infinite` }}>
            <rect x="48" y="148" width="20" height="38" rx="9" fill={`url(#costume-${uid})`} />
            <circle cx="58" cy="186" r="8" fill={`url(#skin-${uid})`} />
          </g>
        )}
        {showWave && (
          <g style={{ transformOrigin: "138px 150px", animation: `avatar-arm-wave-${uid} 0.5s ease-in-out infinite` }}>
            <rect x="132" y="120" width="20" height="38" rx="9" fill={`url(#costume-${uid})`} />
            <circle cx="142" cy="118" r="9" fill={`url(#skin-${uid})`} />
          </g>
        )}

        {/* 身体 */}
        <path d={bodyPath} fill={`url(#costume-${uid})`} />
        {/* 衣领 V 口 */}
        <path d="M 82 136 Q 100 150 118 136 L 118 144 Q 100 158 82 144 Z" fill={avatar.costume} opacity="0.5" />
        {/* 衣服纽扣 */}
        <circle cx="100" cy="160" r="2" fill="#fff" opacity="0.5" />
        <circle cx="100" cy="172" r="2" fill="#fff" opacity="0.5" />
        <circle cx="100" cy="184" r="2" fill="#fff" opacity="0.5" />
        {/* 口袋 */}
        <path d="M 70 165 L 84 165 L 84 178 L 70 178 Z" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.2" />
        <path d="M 116 165 L 130 165 L 130 178 L 116 178 Z" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.2" />

        {/* 脖子 */}
        <rect x="90" y="118" width="20" height="22" rx="6" fill={`url(#skin-${uid})`} />

        {/* 头部 */}
        <circle cx="100" cy="92" r="32" fill={`url(#skin-${uid})`} />

        {/* 头发 */}
        <path d={hairPath} fill="#2a1f1a" />

        {/* 眉毛 */}
        <path d={browPath} stroke="#2a1f1a" strokeWidth="2.2" strokeLinecap="round" fill="none" />

        {/* 眼睛 */}
        <g className={`avatar-eye-${uid}`}>
          <ellipse cx="89" cy="92" rx="3" ry="4" fill="#1a1a2e" />
          <ellipse cx="111" cy="92" rx="3" ry="4" fill="#1a1a2e" />
        </g>
        {/* 眼睛高光 */}
        <circle cx="90" cy="90" r="1" fill="#fff" opacity="0.9" />
        <circle cx="112" cy="90" r="1" fill="#fff" opacity="0.9" />

        {/* 腮红（女性/其他） */}
        {(isFemale || isOther) && (
          <>
            <circle cx="82" cy="102" r="4" fill={avatar.costume} opacity="0.25" />
            <circle cx="118" cy="102" r="4" fill={avatar.costume} opacity="0.25" />
          </>
        )}

        {/* 嘴巴 */}
        <path d={mouthPath} stroke="#c47070" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* 配饰（眼镜戴在眼睛位置） */}
        {avatar.accessory && (
          <g transform="translate(78, 84)">
            <Accessory
              x={0}
              y={0}
              width={44}
              height={16}
              color={avatar.costume}
              strokeWidth={1.8}
              fill="none"
            />
          </g>
        )}

        {/* 手持咖啡杯 */}
        {showCoffee && (
          <g transform="translate(124, 150)">
            {/* 杯身 */}
            <rect x="0" y="0" width="14" height="16" rx="2" fill="#d4a574" />
            {/* 杯盖 */}
            <rect x="-1" y="-2" width="16" height="4" rx="1.5" fill="#8b5a3c" />
            {/* 蒸汽 */}
            <g opacity="0.6">
              <ellipse cx="4" cy="-8" rx="1.5" ry="3" fill="#fff" style={{ animation: `avatar-blink 2s ease-in-out infinite`, transformOrigin: "4px -8px" }} />
              <ellipse cx="9" cy="-10" rx="1.5" ry="3" fill="#fff" style={{ animation: `avatar-blink 2.4s ease-in-out infinite 0.4s`, transformOrigin: "9px -10px" }} />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
