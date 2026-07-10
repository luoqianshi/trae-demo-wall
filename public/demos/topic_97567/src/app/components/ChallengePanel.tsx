'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Challenge, UserChallenge, CompletionData } from '@/hooks/useChallenges';
import ChallengeCard from './ChallengeCard';

interface ChallengePanelProps {
  dailyChallenge?: Challenge | null;
  silverChallenges: Challenge[];
  goldChallenges: Challenge[];
  activeChallenge?: UserChallenge | null;
  userChallenges: UserChallenge[];
  onJoin: (challengeId: string) => void;
  onAbandon: (userChallengeId: string) => void;
  onMakeUp: (userChallengeId: string) => void;
  onOpenRecordForm: (challenge: Challenge, userChallenge: UserChallenge) => void;
  onCloseForm?: () => void;
  openFormChallengeId?: string | null;
  onSubmitForm?: (data: { content: string; type: string; mood: string; tags: string[]; related_task_id?: string; completionData: CompletionData; userChallengeId: string }) => void;
  isLoading?: boolean;
  progressSuccess?: boolean;
  milestoneReached?: { score: number; title: string } | null;
  joinSuccess?: boolean;
  error?: string | null;
}

type TabType = 'bronze' | 'silver' | 'gold';

const TAB_CONFIG: Record<TabType, { label: string; icon: string; color: string; activeColor: string }> = {
  bronze: {
    label: '今日挑战',
    icon: '⭐',
    color: 'text-gray-400',
    activeColor: 'text-[#CD7F32] border-[#CD7F32]',
  },
  silver: {
    label: '进阶挑战',
    icon: '💎',
    color: 'text-gray-400',
    activeColor: 'text-[#87CEEB] border-[#87CEEB]',
  },
  gold: {
    label: '大师挑战',
    icon: '👑',
    color: 'text-gray-400',
    activeColor: 'text-[#FFD700] border-[#FFD700]',
  },
};

const ChallengePanel: React.FC<ChallengePanelProps> = ({
  dailyChallenge,
  silverChallenges,
  goldChallenges,
  activeChallenge,
  userChallenges,
  onJoin,
  onAbandon,
  onMakeUp,
  onOpenRecordForm,
  onCloseForm,
  openFormChallengeId,
  onSubmitForm,
  isLoading,
  progressSuccess,
  milestoneReached,
  joinSuccess,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('bronze');

  const hasBronze = !!dailyChallenge;
  const hasSilver = silverChallenges.length > 0;
  const hasGold = goldChallenges.length > 0;

  const bronzeUserChallenge = dailyChallenge
    ? userChallenges.find(uc => uc.challenge_id === dailyChallenge.id)
    : undefined;

  const renderBronzeContent = () => {
    if (!dailyChallenge) {
      return (
        <div className="text-center py-8 text-gray-400">
          <span className="text-3xl mb-2 block">🌙</span>
          <p className="text-sm">今日挑战已结束，明天再来吧！</p>
        </div>
      );
    }

    return (
      <ChallengeCard
        challenge={dailyChallenge}
        userChallenge={bronzeUserChallenge}
        onJoin={onJoin}
        onAbandon={onAbandon}
        onMakeUp={onMakeUp}
        onOpenRecordForm={onOpenRecordForm}
        onCloseForm={onCloseForm}
        isFormOpen={openFormChallengeId === dailyChallenge.id}
        onSubmitForm={onSubmitForm}
        isLoading={isLoading}
        progressSuccess={progressSuccess}
        milestoneReached={milestoneReached}
      />
    );
  };

  const renderSilverContent = () => {
    if (silverChallenges.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <span className="text-3xl mb-2 block">💎</span>
          <p className="text-sm">暂无白银挑战</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {silverChallenges.map(challenge => {
          const uc = userChallenges.find(u => u.challenge_id === challenge.id && u.status === 'active');
          
          if (uc) {
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={uc}
                onJoin={onJoin}
                onAbandon={onAbandon}
                onMakeUp={onMakeUp}
                onOpenRecordForm={onOpenRecordForm}
                onCloseForm={onCloseForm}
                isFormOpen={openFormChallengeId === challenge.id}
                onSubmitForm={onSubmitForm}
                isLoading={isLoading}
                progressSuccess={progressSuccess}
                milestoneReached={milestoneReached}
              />
            );
          }

          const completedUC = userChallenges.find(u => u.challenge_id === challenge.id && u.status === 'completed');
          if (completedUC) {
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={completedUC}
                onJoin={onJoin}
                onAbandon={onAbandon}
                onMakeUp={onMakeUp}
                onOpenRecordForm={onOpenRecordForm}
                onCloseForm={onCloseForm}
                isFormOpen={openFormChallengeId === challenge.id}
                onSubmitForm={onSubmitForm}
                isLoading={isLoading}
                progressSuccess={progressSuccess}
                milestoneReached={milestoneReached}
              />
            );
          }

          return (
            <div
              key={challenge.id}
              className="bg-gradient-to-br from-[#87CEEB]/10 to-[#87CEEB]/5 rounded-2xl p-4 border border-[#87CEEB]/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💎</span>
                  <span className="text-xs font-medium text-[#5BA8D4]">{challenge.duration_days}天挑战</span>
                </div>
                <span className="text-xs text-gray-400">雪球+{challenge.reward?.score || 15}</span>
              </div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">{challenge.title}</h4>
              <p className="text-xs text-gray-400 mb-3">{challenge.description}</p>
              <button
                onClick={() => onJoin(challenge.id)}
                disabled={isLoading}
                className="w-full py-2 px-3 bg-gradient-to-r from-[#87CEEB] to-[#5BA8D4] text-white text-xs font-medium rounded-xl hover:shadow-md transition-all disabled:opacity-50"
              >
                接受挑战
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGoldContent = () => {
    if (goldChallenges.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <span className="text-3xl mb-2 block">👑</span>
          <p className="text-sm">暂无大师挑战</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {goldChallenges.map(challenge => {
          const uc = userChallenges.find(u => u.challenge_id === challenge.id && u.status === 'active');
          
          if (uc) {
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={uc}
                onJoin={onJoin}
                onAbandon={onAbandon}
                onMakeUp={onMakeUp}
                onOpenRecordForm={onOpenRecordForm}
                onCloseForm={onCloseForm}
                isFormOpen={openFormChallengeId === challenge.id}
                onSubmitForm={onSubmitForm}
                isLoading={isLoading}
                progressSuccess={progressSuccess}
                milestoneReached={milestoneReached}
              />
            );
          }

          const completedUC = userChallenges.find(u => u.challenge_id === challenge.id && u.status === 'completed');
          if (completedUC) {
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={completedUC}
                onJoin={onJoin}
                onAbandon={onAbandon}
                onMakeUp={onMakeUp}
                onOpenRecordForm={onOpenRecordForm}
                onCloseForm={onCloseForm}
                isFormOpen={openFormChallengeId === challenge.id}
                onSubmitForm={onSubmitForm}
                isLoading={isLoading}
                progressSuccess={progressSuccess}
                milestoneReached={milestoneReached}
              />
            );
          }

          return (
            <div
              key={challenge.id}
              className="bg-gradient-to-br from-[#FFD700]/10 to-[#FFD700]/5 rounded-2xl p-4 border border-[#FFD700]/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👑</span>
                  <span className="text-xs font-medium text-[#D4A800]">{challenge.duration_days}天挑战</span>
                </div>
                <span className="text-xs text-gray-400">雪球+{challenge.reward?.score || 50}</span>
              </div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">{challenge.title}</h4>
              <p className="text-xs text-gray-400 mb-3">{challenge.description}</p>
              <button
                onClick={() => onJoin(challenge.id)}
                disabled={isLoading}
                className="w-full py-2 px-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white text-xs font-medium rounded-xl hover:shadow-md transition-all disabled:opacity-50"
              >
                接受挑战
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-white/80 overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b border-gray-100">
        {(['bronze', 'silver', 'gold'] as TabType[]).map(tab => {
          const config = TAB_CONFIG[tab];
          const isActive = activeTab === tab;
          const hasContent = tab === 'bronze' ? hasBronze : tab === 'silver' ? hasSilver : hasGold;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
                isActive ? config.activeColor : config.color
              } ${!hasContent ? 'opacity-50' : ''}`}
              disabled={!hasContent}
            >
              <span className="mr-1">{config.icon}</span>
              <span>{config.label}</span>
              {isActive && (
                <motion.div
                  layoutId="challengeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{
                    background: tab === 'bronze' ? '#CD7F32' : tab === 'silver' ? '#87CEEB' : '#FFD700',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Success/Error messages */}
      {joinSuccess && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium flex items-center gap-2">
          <span>✅</span>
          <span>成功参加挑战！完成挑战后雪球会成长哦</span>
        </div>
      )}
      {error && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tab content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'bronze' && renderBronzeContent()}
            {activeTab === 'silver' && renderSilverContent()}
            {activeTab === 'gold' && renderGoldContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChallengePanel;
