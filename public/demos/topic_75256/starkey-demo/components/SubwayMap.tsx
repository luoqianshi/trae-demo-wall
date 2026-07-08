'use client';

import { useEffect, useState, useRef } from 'react';
import PixelCharacter from './PixelCharacter';
import { getSkinById, type SkinId } from './PixelCharacter';
import { Difficulty, SensoryLevel, getStationIndex, STATION_THRESHOLDS } from '@/types';
import styles from './SubwayMap.module.css';

// 难度 → 站点名称池（可按需调整）
const STATION_NAMES: Record<Difficulty, string[]> = {
  easy:   ['起点站', '公园站', '博物馆站', '图书馆站', '终点站'],
  medium: ['起点站', '公园站', '博物馆站', '图书馆站', '科技馆站', '游乐园站', '海边站', '终点站'],
  hard:   ['起点站', '公园站', '博物馆站', '图书馆站', '科技馆站', '游乐园站', '海边站', '山顶站', '城堡站', '星空站', '彩虹站', '终点站'],
};

// 根据等级获取装扮名称（升级提示用）
function getSkinNameForLevel(level: number): string {
  const nameMap: Record<number, string> = {
    1: '小星星',
    2: '蓝天蓝',
    3: '森林绿',
    4: '晚霞粉',
    5: '小星星',
  };
  return nameMap[level] || '小星星';
}

interface SubwayMapProps {
  totalScore: number;
  level: number;
  selectedSkin: SkinId;
  difficulty: Difficulty;
  stationIndex?: number;  // 可选：来自 reward 的精确站点索引，优先使用
  sensoryLevel?: SensoryLevel;
  showCelebration?: boolean;
  isLineComplete?: boolean; // 可选：来自 reward 的线路完成状态
}

export default function SubwayMap({
  totalScore,
  level,
  selectedSkin,
  difficulty,
  stationIndex: passedStationIndex,
  sensoryLevel = 'gentle',
  showCelebration = false,
  isLineComplete: passedIsLineComplete,
}: SubwayMapProps) {
  const stations = STATION_NAMES[difficulty];
  const stationCount = stations.length;

  // 优先使用传入的站点索引（来自最新 reward），否则从总分计算
  const currentStationIndex = passedStationIndex !== undefined
    ? passedStationIndex
    : getStationIndex(difficulty, totalScore);

  // 当前使用的皮肤：优先用户选择的皮肤
  const currentSkin = getSkinById(selectedSkin);

  // 是否刚过站（用于触发微动效）
  const [justPassedStation, setJustPassedStation] = useState<number | null>(null);
  const prevStationRef = useRef(currentStationIndex);

  useEffect(() => {
    if (currentStationIndex > prevStationRef.current) {
      setJustPassedStation(prevStationRef.current + 1);
      const timer = setTimeout(() => setJustPassedStation(null), 800);
      prevStationRef.current = currentStationIndex;
      return () => clearTimeout(timer);
    } else if (currentStationIndex < prevStationRef.current) {
      prevStationRef.current = currentStationIndex;
    }
  }, [currentStationIndex]);

  // 解锁提示
  const [showUnlockTip, setShowUnlockTip] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);

  useEffect(() => {
    if (level > prevLevel) {
      setShowUnlockTip(true);
      setTimeout(() => setShowUnlockTip(false), 3000);
      setPrevLevel(level);
    }
  }, [level, prevLevel]);

  // 优先使用传入的线路完成状态（来自 reward），否则自行判断
  const isLineComplete = passedIsLineComplete !== undefined
    ? passedIsLineComplete
    : currentStationIndex === stationCount - 1;

  // 新线路开启提示：到达终点并升级时显示
  const [showNewLineTip, setShowNewLineTip] = useState(false);
  const prevLineCompleteRef = useRef(false);

  useEffect(() => {
    if (isLineComplete && !prevLineCompleteRef.current) {
      setShowNewLineTip(true);
      const timer = setTimeout(() => setShowNewLineTip(false), 3500);
      prevLineCompleteRef.current = true;
      return () => clearTimeout(timer);
    } else if (!isLineComplete) {
      prevLineCompleteRef.current = false;
    }
  }, [isLineComplete]);

  return (
    <div className={`${styles.container} ${styles['sensory-' + sensoryLevel]}`}>
      {/* 解锁提示 */}
      {showUnlockTip && (
        <div className={styles.unlockTip}>
          <span className={styles.unlockIcon}>🎉</span>
          <span>达到第{level}级！解锁新装扮「{getSkinNameForLevel(level)}」</span>
        </div>
      )}

      {/* 新线路开启提示 */}
      {showNewLineTip && (
        <div className={styles.newLineTip}>
          <span className={styles.newLineIcon}>🚇</span>
          <span>开启第{level}级新线路！继续出发 ✦</span>
        </div>
      )}

      {/* 线路名称 */}
      <div className={styles.lineName}>
        <span className={styles.lineIcon}>🚇</span>
        <span>星钥小地铁 · 第{level}级 · {stationCount}站</span>
      </div>

      {/* 地铁线路（可横向滚动） */}
      <div className={styles.scrollWrapper}>
        <div className={styles.lineContainer} data-count={stationCount}>
          {/* 线路（铁轨） */}
          <div className={styles.track}>
            <div className={styles.trackLine} />
          </div>

          {/* 站点 */}
          <div className={styles.stations}>
            {stations.map((station, index) => {
              const isPast = index < currentStationIndex;
              const isCurrent = index === currentStationIndex;
              const isLast = index === stations.length - 1;
              const isJustPassed = index === justPassedStation;

              return (
                <div
                  key={station}
                  className={`${styles.stationWrapper} ${isCurrent ? styles.current : ''}`}
                  style={{ left: `${(index / (stations.length - 1)) * 100}%` }}
                >
                  {/* 站点圆点 */}
                  <div
                    className={`${styles.stationDot} ${isPast ? styles.passed : ''} ${isCurrent ? styles.active : ''} ${isJustPassed ? styles.justPassed : ''}`}
                  >
                    {isPast && <span className={styles.checkmark}>✓</span>}
                  </div>

                  {/* 站点名称（所有站点名称均显示，小字体） */}
                  <span className={styles.stationName}>{station}</span>

                  {/* 小人（只在当前站点显示） */}
                  {isCurrent && (
                    <div className={`${styles.characterWrapper} ${showCelebration ? styles.celebrate : ''} ${isLineComplete ? styles.atDestination : ''}`}>
                      <PixelCharacter
                        skin={currentSkin}
                        size={4}
                        showBlink={sensoryLevel === 'lively'}  // 仅动感模式启用眨眼，避免意外视觉干扰
                      />
                      {/* 到达终点的星星 */}
                      {isLineComplete && (
                        <div className={styles.arrivedEffect}>
                          <span className={styles.star}>★</span>
                          <span className={styles.star}>★</span>
                          <span className={styles.star}>★</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 进度信息 */}
      <div className={styles.progressInfo}>
        {isLineComplete ? (
          <span className={styles.levelUp}>🎊 走完一段线路！继续加油 ✦</span>
        ) : currentStationIndex === 0 && level > 1 ? (
          <span>第{level}级新线路 · 起点站</span>
        ) : (
          <span>下一站：{stations[currentStationIndex + 1]}</span>
        )}
      </div>
    </div>
  );
}
