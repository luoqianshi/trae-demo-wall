import styles from './PixelCharacter.module.css';

// 像素角色模板：数值对应调色板索引
// 0=透明 1=皮肤 2=头发/帽子 3=衣服 4=裤子 5=鞋子 6=眼睛高光 7=腮红
export const PIXEL_ROWS = 13;
export const PIXEL_COLS = 9;

export const PIXEL_MAP = [
  [0,0,0,2,2,2,2,0,0],
  [0,0,2,2,2,2,2,2,0],
  [0,0,1,1,1,1,1,0,0],
  [0,1,1,6,1,1,6,1,1],
  [0,1,1,1,7,1,1,1,1],
  [0,0,1,1,1,1,1,0,0],
  [0,0,3,3,3,3,3,0,0],
  [0,3,3,3,3,3,3,3,0],
  [0,3,3,3,3,3,3,3,0],
  [0,0,3,3,3,3,3,0,0],
  [0,0,4,4,4,4,0,0,0],
  [0,0,4,4,4,4,0,0,0],
  [0,5,5,0,5,5,5,0,0],
];

export type SkinId = 'default' | 'sky' | 'forest' | 'sunset' | 'locked_a' | 'locked_b';

export interface SkinPalette {
  id: SkinId;
  name: string;
  desc: string;
  colors: string[];       // 0-7 对应 PIXEL_MAP 中的索引
  bgGradient: string;      // 预览卡片背景
  unlocked: boolean;
  unlockHint?: string;
}

export const SKINS: SkinPalette[] = [
  {
    id: 'default',
    name: '小星星',
    desc: '最温暖的陪伴',
    colors: [
      'transparent',       // 0
      '#f5c9a0',          // 1 皮肤
      '#e8a84c',          // 2 暖金头发
      '#5a7ab5',          // 3 蓝色衣服
      '#3d5a80',          // 4 深蓝裤子
      '#2a3a6e',          // 5 深蓝鞋
      '#2a1a00',          // 6 眼睛
      '#f5b5a0',          // 7 腮红
    ],
    bgGradient: 'linear-gradient(135deg, #fff8ec 0%, #ffe9b8 100%)',
    unlocked: true,
  },
  {
    id: 'sky',
    name: '蓝天蓝',
    desc: '如天空般清澈',
    colors: [
      'transparent',
      '#f5e6d0',
      '#87ceeb',
      '#4a90d9',
      '#2e6bb5',
      '#1a4a7a',
      '#0d2a4a',
      '#f5d0c0',
    ],
    bgGradient: 'linear-gradient(135deg, #e8f4fd 0%, #b8d8f5 100%)',
    unlocked: true,  // 第2级解锁
    unlockHint: '达到第2级解锁',
  },
  {
    id: 'forest',
    name: '森林绿',
    desc: '自然的气息',
    colors: [
      'transparent',
      '#f0dcc0',
      '#7ab55c',
      '#5a9e6e',
      '#3d7a4a',
      '#2a5a3a',
      '#1a3a2a',
      '#c0e8c0',
    ],
    bgGradient: 'linear-gradient(135deg, #f0f8e8 0%, #c0e0b0 100%)',
    unlocked: true,  // 第3级解锁
    unlockHint: '达到第3级解锁',
  },
  {
    id: 'sunset',
    name: '晚霞粉',
    desc: '温柔的晚霞',
    colors: [
      'transparent',
      '#f5d5c0',
      '#f5a0b8',
      '#e87a9a',
      '#c85a78',
      '#9a3a58',
      '#5a1a38',
      '#f5b0c0',
    ],
    bgGradient: 'linear-gradient(135deg, #fff0f5 0%, #f5c0d8 100%)',
    unlocked: true,  // 第4级解锁
    unlockHint: '达到第4级解锁',
  },
  {
    id: 'locked_a',
    name: '???',
    desc: '收集更多关卡解锁',
    colors: ['transparent','#e0dcd4','#c0bdb5','#a0a0a0','#808080','#606060','#404040','#c0c0b8'],
    bgGradient: 'linear-gradient(135deg, #e8e4e0 0%, #c8c4c0 100%)',
    unlocked: false,
    unlockHint: '继续闯关解锁更多',
  },
  {
    id: 'locked_b',
    name: '???',
    desc: '达到3级后解锁',
    colors: ['transparent','#d0cce4','#b0a8d8','#9088c8','#7068a8','#504888','#302868','#b0a8c8'],
    bgGradient: 'linear-gradient(135deg, #e8e4f0 0%, #c8c0e0 100%)',
    unlocked: false,
    unlockHint: '达到第5级解锁',
  },
];

export function getSkinById(id: SkinId): SkinPalette {
  return SKINS.find(skin => skin.id === id) || SKINS[0];
}

interface PixelCharacterProps {
  skin?: SkinPalette;
  size?: number;       // px，角色的像素单元格大小
  showBlink?: boolean;  // 眨眼动画
  className?: string;
}

export default function PixelCharacter({
  skin = SKINS[0],
  size = 5,
  showBlink = false,  // 默认为 false，避免意外的闪烁干扰；由父组件根据 sensoryLevel 控制是否启用
  className = '',
}: PixelCharacterProps) {
  const width = PIXEL_COLS * size;
  const height = PIXEL_ROWS * size;

  return (
    <div
      className={`${styles.character} ${className}`}
      style={{
        width,
        height,
        ['--pixel-size' as string]: `${size}px`,
      }}
      aria-hidden="true"
    >
      {PIXEL_MAP.map((row, r) =>
        row.map((pixelIndex, c) => (
          <div
            key={`${r}-${c}`}
            className={`${styles.pixel} ${pixelIndex === 0 ? styles.empty : ''} ${showBlink && pixelIndex === 6 ? styles.blink : ''}`}
            style={{
              backgroundColor: skin.colors[pixelIndex] || 'transparent',
            }}
          />
        ))
      )}
    </div>
  );
}
