'use client';

import { useState } from 'react';
import { OptionId, Scenario, SensoryLevel } from '@/types';
import SceneIllustration from './SceneIllustration';
import PixelCharacter from './PixelCharacter';
import { getSkinById, type SkinId } from './PixelCharacter';
import PrimaryButton from './PrimaryButton';
import styles from './Screen2Scenario.module.css';

interface Screen2ScenarioProps {
  scenario: Scenario;
  selectedSkin: SkinId;
  sensoryLevel: SensoryLevel;
  demoHint: string | null;
  onConfirm: (optionId: OptionId) => void;
  onBack?: () => void;  // 返回首页，不清空进度
}

export default function Screen2Scenario({
  scenario,
  selectedSkin,
  sensoryLevel,
  demoHint,
  onConfirm,
  onBack,
}: Screen2ScenarioProps) {
  const [selected, setSelected] = useState<OptionId | null>(null);

  const handleConfirm = () => {
    if (selected) onConfirm(selected);
  };

  return (
    <div className={`${styles.container} ${styles['sensory-' + sensoryLevel]}`}>
      {/* 演示版提示横幅 */}
      {demoHint && (
        <div className={styles.demoHintBanner} role="status">
          <span className={styles.demoHintIcon}>💡</span>
          <span className={styles.demoHintText}>{demoHint}</span>
        </div>
      )}

      {/* 顶部导航栏：返回首页 */}
      <div className={styles.topBar}>
        <button
          className={styles.backBtn}
          onClick={onBack}
          aria-label="返回首页"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>首页</span>
        </button>
      </div>

      {/* 插画区 */}
      <SceneIllustration scene={scenario.scene} />

      {/* 角色陪伴 */}
      <div className={styles.charCorner} aria-hidden="true">
        <PixelCharacter
          skin={getSkinById(selectedSkin)}
          size={4}
          showBlink={sensoryLevel === 'lively'}  // 仅动感模式启用眨眼，避免意外视觉干扰
        />
      </div>

      {/* 卡片内容 */}
      <div className={styles.card}>
        {/* 情景 */}
        <div className={styles.scenarioSection}>
          <div className={styles.tagRow}>
            {/* 孩子端只展示主题名，技能分类保留在数据中供家长/教师端使用 */}
            {/* 使用 scenario.theme 确保标签与内容一致 */}
            <span className={styles.topicTag}>{scenario.theme}</span>
          </div>
          <p className={styles.description}>{scenario.description}</p>
        </div>

        {/* 分隔 */}
        <div className={styles.divider} />

        {/* 问询 */}
        <div className={styles.questionBlock}>
          <p className={styles.questionText}>{scenario.question || '你会怎么做？'}</p>

          <div className={styles.options} role="group">
            {scenario.options.map((option) => {
              const letter = option.id;
              const isSel = selected === option.id;
              return (
                <button
                  key={option.id}
                  className={`${styles.option} ${isSel ? styles.optionSelected : ''}`}
                  onClick={() => setSelected(option.id)}
                  aria-pressed={isSel}
                >
                  <span className={styles.optionLetter}>{letter}</span>
                  {option.icon && <span className={styles.optionIcon} aria-hidden="true">{option.icon}</span>}
                  <span className={styles.optionText}>{option.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 确认按钮 */}
        <div className={styles.actions}>
          <PrimaryButton
            fullWidth
            onClick={handleConfirm}
            disabled={!selected}
            className={selected ? styles.confirmActive : ''}
          >
            确认
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
