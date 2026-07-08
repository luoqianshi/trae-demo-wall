'use client';

import { OptionId, Option, Scenario, RewardInfo, SensoryLevel } from '@/types';
import PixelCharacter, { SKINS, getSkinById, type SkinId } from './PixelCharacter';
import PrimaryButton from './PrimaryButton';
import styles from './Screen3Feedback.module.css';

interface Screen3FeedbackProps {
  scenario: Scenario;
  selectedOptionId: OptionId;
  reward: RewardInfo;
  selectedSkin: SkinId;
  sensoryLevel: SensoryLevel;
  onTryAgain: () => void;
  onChangeTopic: () => void;
}

export default function Screen3Feedback({
  scenario,
  selectedOptionId,
  reward,
  selectedSkin,
  sensoryLevel,
  onTryAgain,
  onChangeTopic,
}: Screen3FeedbackProps) {
  const selectedOption: Option | undefined = scenario.options.find(
    (o) => o.id === selectedOptionId
  );

  // quiet 模式下不显示光圈装饰；其他模式显示
  const showSparkle = sensoryLevel !== 'quiet';

  return (
    <div className={`${styles.container} ${styles['sensory-' + sensoryLevel]}`}>
      {/* 角色 + 反馈区域 */}
      <div className={styles.main}>
        {/* 角色区 */}
        <div className={styles.charArea} aria-hidden="true">
          {/* 温和庆祝：星星光圈，无闪烁；quiet 模式下不显示 */}
          {showSparkle && (
            <div className={styles.sparkleRing} aria-hidden="true">
              <span className={styles.sparkle} style={{ top: '2px', left: '50%', transform: 'translateX(-50%)', animationDelay: '0s' }}>✦</span>
              <span className={styles.sparkle} style={{ top: '50%', right: '2px', transform: 'translateY(-50%)', animationDelay: '0.55s' }}>✦</span>
              <span className={styles.sparkle} style={{ bottom: '2px', left: '50%', transform: 'translateX(-50%)', animationDelay: '1.1s' }}>✦</span>
              <span className={styles.sparkle} style={{ top: '50%', left: '2px', transform: 'translateY(-50%)', animationDelay: '1.65s' }}>✦</span>
            </div>
          )}
          <PixelCharacter
            skin={getSkinById(selectedSkin)}
            size={7}
          />
        </div>

        {/* 升级横幅：完成一圈+升级时显示更丰富的庆祝 */}
        {reward.justLeveledUp && reward.isLineComplete ? (
          <div className={`${styles.levelUpBanner} ${styles.levelUpBig}`}>
            <span>🎊 走完一段线路！升级到第 {reward.level} 级</span>
            <span className={styles.newLineSub}>🚇 新线路已开启，继续出发吧 ✦</span>
          </div>
        ) : reward.justLeveledUp ? (
          <div className={styles.levelUpBanner}>
            <span>🎊 第 {reward.level} 级！</span>
          </div>
        ) : reward.isLineComplete ? (
          <div className={styles.levelUpBanner}>
            <span>🎊 走完一段线路！继续加油 ✦</span>
          </div>
        ) : null}

        {/* 反馈标题 — 所有选项都给正向鼓励, 不再区分"对错" */}
        <h2 className={styles.feedbackTitle}>
          做得很棒！
        </h2>

        {/* 积分徽章 — 统一一个样式, 不标注"多少分", 只说明获得奖励 */}
        <div className={`${styles.rewardBadge} ${reward.justLeveledUp ? styles.rewardBig : ''}`}>
          <div className={styles.rewardInner}>
            <span className={styles.rewardStar}>✦</span>
            <span className={styles.rewardNum}>+{reward.gained}</span>
            <span className={styles.rewardWord}>分</span>
          </div>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>累计</span>
            <strong className={styles.totalNum}>{reward.newTotal}</strong>
            <span className={styles.totalLabel}>分</span>
          </div>
        </div>

        {/* 反馈文字 — 无论选哪个选项, 都给建设性、非评判的反馈 */}
        {selectedOption && (
          <div className={styles.feedbackCard}>
            <p className={styles.feedbackText}>{selectedOption.feedback}</p>
          </div>
        )}

        {/* 社交小规则 — 用亲切的第二人称 */}
        {scenario.socialRule && (
          <div className={styles.ruleCard}>
            <span className={styles.ruleLabel}>✨ 今天学到的</span>
            <p className={styles.ruleText}>{scenario.socialRule}</p>
          </div>
        )}

        {/* 家长提示 — 孩子端不渲染，数据保留供未来家长端复用 */}
        {/* {scenario.parentTip && (
          <div className={styles.parentTipCard}>
            <span className={styles.parentTipLabel}>👨‍👩‍👧 陪练小提示</span>
            <p className={styles.parentTipText}>{scenario.parentTip}</p>
          </div>
        )} */}

        {/* 动作按钮 */}
        <div className={styles.actions}>
          <PrimaryButton fullWidth onClick={onTryAgain}>
            再来一题 ✦
          </PrimaryButton>
          <button className={styles.textLink} onClick={onChangeTopic}>
            换个主题
          </button>
        </div>
      </div>
    </div>
  );
}
