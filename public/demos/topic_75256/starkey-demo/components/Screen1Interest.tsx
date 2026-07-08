'use client';

import { useState } from 'react';
import { TrainingTopic, Difficulty, DIFFICULTY_LABELS } from '@/types';
import TopicTag from './TopicTag';
import PrimaryButton from './PrimaryButton';
import PixelCharacter from './PixelCharacter';
import { SKINS, getSkinById, type SkinId } from './PixelCharacter';
import HowToPlayModal from './HowToPlayModal';
import styles from './Screen1Interest.module.css';

// 预生成的主题列表（与 pregenerate.mjs 保持一致）
const PREGEN_TOPICS = ['地铁', '恐龙', '乐高', '海洋', '太空', '汽车', '动物', '公园'];

// 主题对应的 emoji 图标
const TOPIC_EMOJIS: Record<string, string> = {
  '地铁': '🚇',
  '恐龙': '🦖',
  '乐高': '🧩',
  '海洋': '🌊',
  '太空': '🚀',
  '汽车': '🚗',
  '动物': '🐾',
  '公园': '🌳',
};

// 用于给未预置兴趣做"最接近"匹配的关键词映射
const INTEREST_FALLBACK: { match: RegExp; target: string }[] = [
  { match: /(火车|铁路|站台|车站|铁轨|动车|高铁)/, target: '地铁' },
  { match: /(动物|古生物|霸王龙|翼龙|三角龙|化石|恐龙蛋|迅猛龙|侏罗纪)/, target: '恐龙' },
  { match: /(积木|拼搭|组装|我的世界|拼装|乐高)/, target: '乐高' },
  { match: /(天文|星星|行星|宇宙|银河|太空|外星人|宇航员|星空|月|航天)/, target: '太空' },
  { match: /(海洋|鱼|海底|鲸鱼|鲨鱼|海豚|海滩|章鱼|珊瑚|海龟|潜水)/, target: '海洋' },
  { match: /(汽车|卡车|交通|工程车|警车|消防车|巴士|救护车|交通工具)/, target: '汽车' },
  { match: /(宠物|猫|狗|鸟|兔子|动物园)/, target: '动物' },
  { match: /(公园|花园|草地|游乐场)/, target: '公园' },
  { match: /(足球|运动|比赛|队伍|篮球|体育|运动员|球场)/, target: '公园' },
  { match: /(机器人|编程|机械|电路|乐高编程|电子积木)/, target: '乐高' },
];

interface Screen1InterestProps {
  initialInterest?: string;
  initialTopic: TrainingTopic;
  initialDifficulty: Difficulty;
  selectedSkin: SkinId;
  totalScore: number;
  level: number;
  nextThreshold: number;
  isDemoMode: boolean;
  onStart: (interest: string, topic: TrainingTopic, difficulty: Difficulty, useAI?: boolean) => void;
  onChangeSkin: (skinId: SkinId) => void;
  onChangeInterest?: (interest: string) => void;
  onChangeTopic?: (topic: TrainingTopic) => void;
  onChangeDifficulty?: (difficulty: Difficulty) => void;
}

export default function Screen1Interest({
  initialInterest = '',
  initialTopic,
  initialDifficulty,
  selectedSkin,
  totalScore,
  level,
  nextThreshold,
  isDemoMode,
  onStart,
  onChangeSkin,
  onChangeInterest,
  onChangeTopic,
  onChangeDifficulty,
}: Screen1InterestProps) {
  const [interest, setInterest] = useState(initialInterest);
  const [topic, setTopic] = useState<TrainingTopic>(initialTopic);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [showSkinSelector, setShowSkinSelector] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const progressPercent = level <= 5
    ? Math.min(100, Math.max(3, (totalScore / nextThreshold) * 100))
    : 100;

  const trimmedInterest = interest.trim();

  // 判断当前输入是否是预生成主题
  const isPregenTopic = PREGEN_TOPICS.some(
    (name) => trimmedInterest === name
  );

  // 找到最接近的预生成主题
  const findFallbackTopic = (input: string): string | null => {
    const fallback = INTEREST_FALLBACK.find((r) => r.match.test(input));
    if (fallback) return fallback.target;
    // 如果完全不匹配，返回 null
    return null;
  };

  const closestTopic = isPregenTopic ? trimmedInterest : findFallbackTopic(trimmedInterest);

  // 当输入不在预生成主题时，显示实时生成选项
  const showAIButton = trimmedInterest && !isPregenTopic;

  const handleStart = (useAI = false) => {
    // 如果不使用 AI，且输入不在预生成主题，则使用最接近的预生成主题
    let effectiveInterest = trimmedInterest;
    if (!useAI && !isPregenTopic && trimmedInterest) {
      effectiveInterest = closestTopic || '地铁';
    }
    const finalInterest = effectiveInterest || '地铁';
    onStart(finalInterest, topic, difficulty, useAI);
  };

  return (
    <div className={styles.container}>
      {/* 顶部导航栏 */}
      <div className={styles.topBar}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <img
              src="/logo.svg"
              alt="星钥"
              className={styles.logoImage}
              width="18"
              height="18"
            />
          </div>
          <span className={styles.logoName}>星钥</span>
        </div>

        {/* 角色皮肤切换按钮 */}
        <div className={styles.topBarRight}>
          <button
            className={styles.howToPlayBtn}
            onClick={() => setShowHowToPlay(true)}
            aria-label="怎么玩"
          >
            <span className={styles.howToPlayIcon}>?</span>
          </button>
          <button
            className={styles.skinBtn}
            onClick={() => setShowSkinSelector(!showSkinSelector)}
            aria-label="更换皮肤"
          >
            <PixelCharacter
              skin={getSkinById(selectedSkin)}
              size={5}
              showBlink={false}
            />
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 皮肤选择器（展开） */}
      {showSkinSelector && (
        <div className={styles.skinPanel}>
          <div className={styles.skinPanelInner}>
            {SKINS.filter(s => s.unlocked).map((skin) => (
              <button
                key={skin.id}
                className={`${styles.skinOption} ${skin.id === selectedSkin ? styles.skinSelected : ''}`}
                onClick={() => {
                  onChangeSkin(skin.id as SkinId);
                  setShowSkinSelector(false);
                }}
                aria-label={skin.name}
              >
                <PixelCharacter skin={skin} size={5} showBlink={false} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 欢迎区 */}
      <div className={styles.brandBlock}>
        <h1 className={styles.brandTitle}>
          准备好了吗？✦
        </h1>
        <p className={styles.brandDesc}>
          出发吧，我们走 ✦
        </p>
      </div>

      {/* 等级进度卡 */}
      <div className={styles.levelCard}>
        <div className={styles.levelLeft}>
          <span className={styles.levelStar}>★</span>
          <span className={styles.levelNum}>第 {level} 级</span>
        </div>
        <div className={styles.levelRight}>
          <span className={styles.scoreNum}>{totalScore}</span>
          <span className={styles.scoreUnit}>分</span>
        </div>
        {level <= 5 && (
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
        {level <= 5 && (
          <p className={styles.progressHint}>
            再得 <strong>{Math.max(0, nextThreshold - totalScore)}</strong> 分升到第 {level + 1} 级 ✦
          </p>
        )}
      </div>

      {/* 问询 */}
      <div className={styles.questionBlock}>
        <h2 className={styles.questionTitle}>
          你想玩什么？
        </h2>
        <p className={styles.questionSub}>
          选一个，或者自己写也行
        </p>
      </div>

      {/* 兴趣输入 */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="interest-input">
          写下来
        </label>
        <input
          id="interest-input"
          type="text"
          className={styles.input}
          placeholder="演示版精选 8 个，正式版支持任意兴趣 AI 生成"
          value={interest}
          onChange={(e) => setInterest(e.target.value.slice(0, 30))}
          maxLength={30}
        />
        <div className={styles.inputFooter}>
          <span className={styles.hint}>写你喜欢的就好（演示版：地铁、恐龙、乐高、海洋、太空、汽车、动物、公园）</span>
        </div>
      </div>

      {/* 主题标签 */}
      <div className={styles.field}>
        <p className={styles.label}>快速选择</p>
        <div className={styles.chipRow}>
          {PREGEN_TOPICS.map((item) => {
            const isActive = trimmedInterest === item;
            return (
              <button
                key={item}
                type="button"
                className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                onClick={() => setInterest(item)}
                aria-pressed={isActive}
              >
                <span className={styles.chipEmoji}>{TOPIC_EMOJIS[item] || '✨'}</span>
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* 输入不在预置主题时的友好提示 */}
      {showAIButton && (
        <div className={styles.demoHintCard} role="status">
          <div className={styles.demoHintTitle}>
            <span className={styles.demoHintIcon}>✨</span>
            <span>「{trimmedInterest}」听起来很有趣</span>
          </div>
          <p className={styles.demoHintText}>
            演示版暂不支持「{trimmedInterest}」的专属情景，正式版会为你实时生成 ✦
          </p>
          {closestTopic && (
            <p className={styles.demoHintFallback}>
              先用「{closestTopic}」带你体验，同样很好玩！
            </p>
          )}
        </div>
      )}

      {/* 想练什么 */}
      <div className={styles.field}>
        <p className={styles.label}>今天想练哪个小本领？</p>
        <TopicTag selected={topic} onChange={setTopic} />
      </div>

      {/* 难度 */}
      <div className={styles.field}>
        <p className={styles.label}>想要多大挑战？</p>
        <div className={styles.difficultyRow}>
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((key) => (
            <button
              key={key}
              className={`${styles.difficultyBtn} ${difficulty === key ? styles.difficultyActive : ''}`}
              onClick={() => {
                setDifficulty(key);
                onChangeDifficulty?.(key);
              }}
              aria-pressed={difficulty === key}
            >
              {DIFFICULTY_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* 开始按钮 */}
      <div className={styles.actions}>
        {/* 默认：使用预生成数据 */}
        <PrimaryButton fullWidth onClick={() => handleStart(false)}>
          {isPregenTopic ? '开始玩' : (closestTopic ? `先用「${closestTopic}」开始` : '开始玩')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </PrimaryButton>

        {/* AI 实时生成按钮（仅当输入不在预置主题时显示） */}
        {showAIButton && (
          <button
            className={styles.aiButton}
            onClick={() => handleStart(true)}
            aria-label="试试为我准备新的小故事"
          >
            <span className={styles.aiIcon}>✨</span>
            <span>为我准备「{trimmedInterest}」的小故事</span>
          </button>
        )}
      </div>

      {/* 怎么玩弹窗 */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
}
