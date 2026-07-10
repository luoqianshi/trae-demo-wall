'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useRecordsContext } from '../contexts/RecordsContext';
import { useProcrastination } from '../hooks/useProcrastination';
import { useChallenges } from '../hooks/useChallenges';
import { useTips } from '../hooks/useTips';
import { useTasks } from '../hooks/useTasks';
import { usePageView } from '../hooks/usePageView';
import { useAchievements } from '../hooks/useAchievements';
import { triggerChallengeCelebration, triggerAchievementCelebration } from './components/GlobalCelebration';
import { getSnowballStage, getNextStageThreshold } from '../lib/snowball-score';
import { useSnowball } from '@/contexts/SnowballContext';
import HomeSidebar from './components/HomeSidebar';
import { useReturnDetection } from '../hooks/useReturnDetection';
import { ReturnWelcome } from './components/ReturnWelcome';

// Dynamic imports for heavy components
const SnowballAnimation = dynamic(() => import('./components/SnowballAnimation'), { ssr: false });
const SnowballStageCard = dynamic(() => import('./components/SnowballStageCard'), { ssr: false });
const OnboardingFlow = dynamic(() => import('./components/OnboardingFlow'), { ssr: false });
const GoalStateForm = dynamic(() => import('./components/GoalStateForm'), { ssr: false });
const SnowballGuide = dynamic(() => import('./components/SnowballGuide'), { ssr: false });
const QuickRecord = dynamic(() => import('./components/QuickRecord'), { ssr: false });
const RecordCard = dynamic(() => import('./components/RecordCard'), { ssr: false });
const ChallengePanel = dynamic(() => import('./components/ChallengePanel'), { ssr: false });
const ChallengeRecordForm = dynamic(() => import('./components/ChallengeRecordForm'), { ssr: false });
const DailyQuestion = dynamic(() => import('./components/DailyQuestion'), { ssr: false });
const TipCard = dynamic(() => import('./components/TipCard'), { ssr: false });
const CelebrationEffect = dynamic(() => import('./components/CelebrationEffect'), { ssr: false });
const FeedbackBubble = dynamic(() => import('./components/FeedbackBubble'), { ssr: false });

// ─── Helper: streak calculation ────────────────────────────────────────────────

// 修复 R5-4.1: 统一使用本地日期，与 snowball-score-calculator 的 toLocalDateStr 一致，
// 避免 UTC+8 凌晨 00:00-08:00 时段"今日记录"被算到昨天
function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toLocalDateStrFromISO(isoStr: string): string {
  return toLocalDateStr(new Date(isoStr));
}

function calculateStreak(records: { created_at: string }[]): number {
  if (!records || records.length === 0) return 0;

  const sortedDates = [...new Set(
    records.map(r => toLocalDateStrFromISO(r.created_at))
  )].sort().reverse();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = toLocalDateStr(checkDate);
    if (sortedDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // Today has no record yet, check from yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    } else {
      break;
    }
  }

  return streak;
}

function getTodayRecordCount(records: { created_at: string }[]): number {
  const todayStr = toLocalDateStr(new Date());
  return records.filter(r => r.created_at && toLocalDateStrFromISO(r.created_at) === todayStr).length;
}

// ─── Main Component ────────────────────────────────────────────────────────────

const HomePage = () => {
  const { token, isLoading: authLoading } = useAuth();
  const {
    records, goals: recordGoals, loading: recordsLoading, error: recordsError,
    createRecord, deleteRecord, updateRecord, feedbackMap, followUpMap, loadingFeedbackMap,
    celebrationType, showCelebration, streakDays, feedbackMessage, showFeedbackBubble,
    onCelebrationComplete, onFeedbackBubbleComplete,
    conversationsMap, answeringFollowUpMap, answerFollowUp, continueChat,
  } = useRecordsContext();

  const {
    activeSession, loading: procrastinationLoading, error: procrastinationError,
    createSession, completeStep, resetSession,
  } = useProcrastination();

  const {
    dailyChallenge, activeChallenge, userChallenges, loading: challengesLoading,
    joinChallenge, updateProgress, abandonChallenge, makeUpChallenge,
    joinSuccess, progressSuccess, milestoneReached,
    silverChallenges, goldChallenges,
    error: challengesError,
  } = useChallenges();

  const { currentTip, dismissed, dismissTip } = useTips();
  const { tasks, createTask } = useTasks();
  const { addScore, refreshStats } = useSnowball();

  // 从 tasks 中提取长任务用于首页进度展示
  const bigTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    return tasks
      .filter(t => t.type === 'big')
      .map(t => ({ id: t.id, title: t.title, progress: t.progress || 0, status: t.status }));
  }, [tasks]);

  // 成就数据
  const [achievements, setAchievements] = useState<Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    level: string;
    category: string;
    unlocked: boolean;
    unlocked_at?: string;
  }>>([]);

  // Local state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showQuickRecord, setShowQuickRecord] = useState(false);
  const [showProcrastination, setShowProcrastination] = useState(false);
  const [triggerRoll, setTriggerRoll] = useState(0);
  const [openFormChallengeId, setOpenFormChallengeId] = useState<string | null>(null);

  usePageView('home');

  const { checkAchievements } = useAchievements();

  const {
    isReturning,
    daysInactive,
    dismissWelcome,
  } = useReturnDetection();

  // 获取成就数据
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const response = await fetch('/api/achievements', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAchievements(data.achievements || []);
        }
      } catch (err) {
        console.error('Failed to fetch achievements:', err);
      }
    };
    if (token) fetchAchievements();
  }, [token]);

  // Onboarding check
  useEffect(() => {
    try {
      const completed = localStorage.getItem('onboarding_completed');
      if (!completed) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('Onboarding check error:', err);
    }
  }, []);

  // Derived data
  const totalRecords = records.length;
  const todayRecordCount = useMemo(() => getTodayRecordCount(records), [records]);
  const stageConfig = useMemo(() => getSnowballStage(totalRecords), [totalRecords]);
  const nextThreshold = useMemo(() => getNextStageThreshold(totalRecords), [totalRecords]);

  // Goal title lookup (from big tasks / legacy goals)
  const goalTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of recordGoals) {
      map[g.id] = g.title;
    }
    return map;
  }, [recordGoals]);

  // Recent records - 大屏显示更多
  const recentRecords = useMemo(() => records.slice(0, 5), [records]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleOnboardingComplete = (reminderTime?: string) => {
    setShowOnboarding(false);
    if (reminderTime) {
      try {
        localStorage.setItem('reminder_time', reminderTime);
      } catch (err) {
        console.error('Failed to save reminder time:', err);
      }
    }
  };

  const handleOnboardingCreateRecord = async (content: string) => {
    try {
      const result = await createRecord(
        {
          content,
          type: 'success',
          mood: 'proud',
          tags: [],
        },
        { skipCelebration: true }
      );
      if (result) addScore('RECORD_CREATED');
    } catch (err) {
      console.error('Onboarding create record error:', err);
    }
  };

  const handleQuickRecordSubmit = async (data: { content: string; type: string; mood: string; tags: string[]; related_task_id: string }) => {
    try {
      const result = await createRecord(data);
      if (result) addScore('RECORD_CREATED');
      setTriggerRoll(prev => prev + 1);
      return result;
    } catch (err) {
      console.error('[HomePage] handleQuickRecordSubmit error:', err);
      return null;
    }
  };

  const handleUpdateRecord = async (recordId: string, data: { type: string; tags: string[] }) => {
    await updateRecord(recordId, data);
  };

  const handleGoRecord = useCallback(() => {
    setShowQuickRecord(true);
    setTimeout(() => {
      document.getElementById('quick-record-input')?.focus();
    }, 300);
  }, []);

  const handleEasyRoll = async () => {
    const result = await createRecord({
      content: '今天雪球日记陪着我，这就够了 🤍',
      type: 'success',
      mood: 'neutral',
      tags: [],
    });
    if (result) {
      addScore('RECORD_CREATED');
      setTriggerRoll(prev => prev + 1);
    }
    dismissWelcome();
  };

  const handleChallengeRecordSubmit = (data: { content: string; type: string; mood: string; tags: string[]; related_task_id?: string; completionData: any; userChallengeId: string }) => {
    // 修复 R5-3.1: 为 fire-and-forget Promise 链添加 .catch()，避免 unhandled rejection
    createRecord({
      content: data.content,
      type: data.type,
      mood: data.mood,
      tags: data.tags,
      related_task_id: data.related_task_id,
    }, { skipCelebration: true, skipAchievementCheck: true }).then((result: any) => {
      if (result) addScore('RECORD_CREATED');
    }).catch((err) => {
      console.error('[HomePage] createRecord in challenge submit failed:', err);
    });
    setTriggerRoll(prev => prev + 1);

    updateProgress(data.userChallengeId, data.completionData).then(async (result: any) => {
      setOpenFormChallengeId(null);
      if (!result) {
        return;
      }

      const challenge = result.user_challenge?.challenge;
      const isCompleted = result.completed === true;
      const hasMilestone = !!result.milestone_reward;

      // refreshStats 已由 useChallenges.updateProgress 内部统一调用，此处无需重复

      const newAchievements = await checkAchievements({ skipCelebration: true });

      if (newAchievements && newAchievements.length > 0) {
        // 修复 R8-3: 成就解锁时触发成就庆祝（因为 skipCelebration:true 跳过了 hook 内部的触发）
        triggerAchievementCelebration(newAchievements);
      } else {
        if (isCompleted && challenge) {
          triggerChallengeCelebration({
            difficulty: challenge.type,
            reward: challenge.reward || {},
            milestoneReward: result.milestone_reward || null,
          });
        } else if (hasMilestone) {
          triggerChallengeCelebration({
            difficulty: challenge?.type || 'bronze',
            reward: {},
            milestoneReward: result.milestone_reward,
          });
        } else if (result.user_challenge) {
          triggerChallengeCelebration({
            difficulty: challenge?.type || 'bronze',
            reward: {},
            milestoneReward: null,
          });
        }
      }
    }).catch((err) => {
      console.error('[HomePage] updateProgress in challenge submit failed:', err);
    });
  };

  const handleOpenRecordForm = (challenge: any, userChallenge: any) => {
    setOpenFormChallengeId(challenge.id);
  };

  const handleCloseForm = () => {
    setOpenFormChallengeId(null);
  };

  const handleProcrastinationSubmit = (goal: string, currentState: string) => {
    createSession(goal, currentState);
  };

  const handleStepComplete = (stepIndex: number) => {
    completeStep(stepIndex);
    setTriggerRoll(prev => prev + 1);
  };

  const handleAbandon = () => {
    resetSession();
    setShowProcrastination(false);
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFB6C1]/30 border-t-[#FFB6C1] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="max-w-3xl w-full mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-pulse">
            <div className="flex flex-col items-center gap-6">
              <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
              <div className="h-10 bg-gray-200 rounded-2xl w-3/4"></div>
              <div className="h-5 bg-gray-200 rounded-2xl w-1/2"></div>
              <div className="h-12 w-full bg-gray-200 rounded-2xl"></div>
              <div className="h-12 w-full bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Procrastination overlay ───────────────────────────────────────────────

  const procrastinationOverlay = showProcrastination && (
    <div className="fixed inset-0 z-40 bg-[#FFF8F0]/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">拖延急救</h2>
          <button
            onClick={() => setShowProcrastination(false)}
            className="text-gray-400 hover:text-gray-600 text-sm px-4 py-2 rounded-2xl hover:bg-gray-100 transition-all"
          >
            关闭
          </button>
        </div>
        {activeSession && (activeSession.status === 'active' || activeSession.status === 'completed') ? (
          <SnowballGuide
            goal={activeSession.goal}
            currentState={activeSession.current_state}
            steps={activeSession.steps}
            currentStepIndex={activeSession.current_step_index}
            onCompleteStep={handleStepComplete}
            onAbandon={handleAbandon}
            onRestart={handleAbandon}
            loading={procrastinationLoading}
          />
        ) : (
          <GoalStateForm
            onSubmit={handleProcrastinationSubmit}
            loading={procrastinationLoading}
            error={procrastinationError}
          />
        )}
      </div>
    </div>
  );

  // ─── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Onboarding overlay */}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onCreateRecord={handleOnboardingCreateRecord}
        />
      )}

      {/* Celebration & Feedback effects */}
      {celebrationType && (
        <CelebrationEffect
          isActive={showCelebration}
          type={celebrationType}
          onComplete={onCelebrationComplete}
          answerContent={celebrationType === 'question_answer' ? feedbackMessage : undefined}
          streakDays={streakDays}
        />
      )}
      <FeedbackBubble
        isVisible={showFeedbackBubble}
        message={feedbackMessage}
        onComplete={onFeedbackBubbleComplete}
      />

      {/* Procrastination overlay */}
      {procrastinationOverlay}

      {/* 
        响应式布局：
        - < 900px: 单列，侧边栏隐藏，雪球状态卡片显示在主内容区顶部
        - >= 900px: 双栏，左侧边栏，右侧主内容区
      */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 移动端/平板：单列布局（< 900px）*/}
        <div className="lg:hidden">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* 雪球状态卡片（仅在单列时显示）*/}
            <SnowballStageCard
              totalRecords={totalRecords}
              streakDays={streakDays}
              todayRecordCount={todayRecordCount}
            />

            {/* 主内容区 */}
            <MainContent
              token={token}
              currentTip={currentTip}
              dismissed={dismissed}
              dismissTip={dismissTip}
              showQuickRecord={showQuickRecord}
              setShowQuickRecord={setShowQuickRecord}
              showProcrastination={showProcrastination}
              setShowProcrastination={setShowProcrastination}
              handleQuickRecordSubmit={handleQuickRecordSubmit}
              handleUpdateRecord={handleUpdateRecord}
              createRecord={createRecord}
              setTriggerRoll={setTriggerRoll}
              dailyChallenge={dailyChallenge}
              silverChallenges={silverChallenges}
              goldChallenges={goldChallenges}
              activeChallenge={activeChallenge}
              userChallenges={userChallenges}
              joinChallenge={joinChallenge}
              abandonChallenge={abandonChallenge}
              makeUpChallenge={makeUpChallenge}
              handleOpenRecordForm={handleOpenRecordForm}
              handleCloseForm={handleCloseForm}
              openFormChallengeId={openFormChallengeId}
              handleChallengeRecordSubmit={handleChallengeRecordSubmit}
              challengesLoading={challengesLoading}
              progressSuccess={progressSuccess}
              milestoneReached={milestoneReached}
              joinSuccess={joinSuccess}
              challengesError={challengesError}
              recentRecords={recentRecords.slice(0, 3)}
              goalTitleMap={goalTitleMap}
              deleteRecord={deleteRecord}
              feedbackMap={feedbackMap}
              followUpMap={followUpMap}
              loadingFeedbackMap={loadingFeedbackMap}
              conversationsMap={conversationsMap}
              answeringFollowUpMap={answeringFollowUpMap}
              answerFollowUp={answerFollowUp}
              continueChat={continueChat}
              addScore={addScore}
              refreshStats={refreshStats}
              createTask={createTask}
            />
          </div>
        </div>

        {/* 大屏：双栏布局（>= 900px）*/}
        <div className="hidden lg:flex gap-8">
          {/* 左侧边栏 */}
          <HomeSidebar
            totalRecords={totalRecords}
            todayRecordCount={todayRecordCount}
            streakDays={streakDays}
            stageConfig={stageConfig}
            nextThreshold={nextThreshold}
            bigTasks={bigTasks}
            tasks={tasks}
            achievements={achievements}
          />

          {/* 右侧主内容区 */}
          <div className="flex-1 max-w-4xl">
            <MainContent
              token={token}
              currentTip={currentTip}
              dismissed={dismissed}
              dismissTip={dismissTip}
              showQuickRecord={showQuickRecord}
              setShowQuickRecord={setShowQuickRecord}
              showProcrastination={showProcrastination}
              setShowProcrastination={setShowProcrastination}
              handleQuickRecordSubmit={handleQuickRecordSubmit}
              handleUpdateRecord={handleUpdateRecord}
              createRecord={createRecord}
              setTriggerRoll={setTriggerRoll}
              dailyChallenge={dailyChallenge}
              silverChallenges={silverChallenges}
              goldChallenges={goldChallenges}
              activeChallenge={activeChallenge}
              userChallenges={userChallenges}
              joinChallenge={joinChallenge}
              abandonChallenge={abandonChallenge}
              makeUpChallenge={makeUpChallenge}
              handleOpenRecordForm={handleOpenRecordForm}
              handleCloseForm={handleCloseForm}
              openFormChallengeId={openFormChallengeId}
              handleChallengeRecordSubmit={handleChallengeRecordSubmit}
              challengesLoading={challengesLoading}
              progressSuccess={progressSuccess}
              milestoneReached={milestoneReached}
              joinSuccess={joinSuccess}
              challengesError={challengesError}
              recentRecords={recentRecords}
              goalTitleMap={goalTitleMap}
              deleteRecord={deleteRecord}
              feedbackMap={feedbackMap}
              followUpMap={followUpMap}
              loadingFeedbackMap={loadingFeedbackMap}
              conversationsMap={conversationsMap}
              answeringFollowUpMap={answeringFollowUpMap}
              answerFollowUp={answerFollowUp}
              continueChat={continueChat}
              isLargeScreen={true}
              addScore={addScore}
              refreshStats={refreshStats}
              createTask={createTask}
            />
          </div>
        </div>
      </div>

      <ReturnWelcome
        isVisible={isReturning}
        daysInactive={daysInactive}
        onQuickRecord={() => {
          dismissWelcome();
          setShowQuickRecord(true);
        }}
        onEasyRoll={handleEasyRoll}
        onDismiss={dismissWelcome}
      />
    </div>
  );
};

// ─── MainContent Component ───────────────────────────────────────────────────

interface MainContentProps {
  token: string | null;
  currentTip: any;
  dismissed: boolean;
  dismissTip: () => void;
  showQuickRecord: boolean;
  setShowQuickRecord: (value: boolean | ((prev: boolean) => boolean)) => void;
  showProcrastination: boolean;
  setShowProcrastination: (value: boolean) => void;
  handleQuickRecordSubmit: (data: any) => Promise<any>;
  handleUpdateRecord: (recordId: string, data: any) => Promise<void>;
  createRecord: (data: any, options?: any) => Promise<any>;
  setTriggerRoll: (value: number | ((prev: number) => number)) => void;
  dailyChallenge: any;
  silverChallenges: any[];
  goldChallenges: any[];
  activeChallenge: any;
  userChallenges: any[];
  joinChallenge: (challengeId: string) => Promise<any>;
  abandonChallenge: (userChallengeId: string) => Promise<any>;
  makeUpChallenge: (userChallengeId: string) => Promise<any>;
  handleOpenRecordForm: (challenge: any, userChallenge: any) => void;
  handleCloseForm: () => void;
  openFormChallengeId: string | null;
  handleChallengeRecordSubmit: (data: any) => void;
  challengesLoading: boolean;
  progressSuccess: boolean;
  milestoneReached: { score: number; title: string } | null;
  joinSuccess: boolean;
  challengesError: string | null;
  recentRecords: any[];
  goalTitleMap: Record<string, string>;
  deleteRecord: (id: string) => Promise<boolean>;
  feedbackMap: Record<string, any>;
  followUpMap: Record<string, any>;
  loadingFeedbackMap: Record<string, boolean>;
  conversationsMap: Record<string, any[]>;
  answeringFollowUpMap: Record<string, boolean>;
  answerFollowUp: (recordId: string, answer: string, followUpQuestion: string) => Promise<any>;
  continueChat: (recordId: string, message: string) => Promise<void>;
  isLargeScreen?: boolean;
  addScore: (action: import('@/lib/snowball-score').ScoreAction) => void;
  refreshStats: () => Promise<void>;
  createTask: (data: any) => Promise<any>;
}

function MainContent({
  token,
  currentTip,
  dismissed,
  dismissTip,
  showQuickRecord,
  setShowQuickRecord,
  showProcrastination,
  setShowProcrastination,
  handleQuickRecordSubmit,
  handleUpdateRecord,
  createRecord,
  setTriggerRoll,
  dailyChallenge,
  silverChallenges,
  goldChallenges,
  activeChallenge,
  userChallenges,
  joinChallenge,
  abandonChallenge,
  makeUpChallenge,
  handleOpenRecordForm,
  handleCloseForm,
  openFormChallengeId,
  handleChallengeRecordSubmit,
  challengesLoading,
  progressSuccess,
  milestoneReached,
  joinSuccess,
  challengesError,
  recentRecords,
  goalTitleMap,
  deleteRecord,
  feedbackMap,
  followUpMap,
  loadingFeedbackMap,
  conversationsMap,
  answeringFollowUpMap,
  answerFollowUp,
  continueChat,
  isLargeScreen = false,
  addScore,
  refreshStats,
  createTask,
}: MainContentProps) {
  return (
    <div className="space-y-6">
      {/* Zone 1: 雪球问你 */}
      {token && (
        <DailyQuestion
          token={token}
          onRecordFromAnswer={async (content, questionText) => {
            try {
              const result = await createRecord({
                content,
                type: 'success',
                mood: 'proud',
                tags: [],
              }, { source: 'question' });
              if (result) {
                addScore('RECORD_CREATED');
                setTriggerRoll(prev => prev + 1);
              }
              return result;
            } catch (err) {
              console.error('[HomePage] onRecordFromAnswer error:', err);
              return null;
            }
          }}
        />
      )}

      {/* Zone 2: 快速行动栏 */}
      <section className="space-y-4">
        {/* Tip card */}
        {currentTip && !dismissed && (
          <TipCard tip={currentTip} onDismiss={dismissTip} />
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {/* Record button */}
          <button
            onClick={() => setShowQuickRecord(prev => !prev)}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#FFB6C1] to-[#FF99AA] text-white rounded-3xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">✨</span>
            <span>{showQuickRecord ? '收起记录' : '记录小成功'}</span>
          </button>

          {/* Procrastination button */}
          <button
            onClick={() => setShowProcrastination(true)}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-[#87CEEB] to-[#5BA8D4] text-white rounded-3xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>拖延急救</span>
          </button>
        </div>

        {/* Inline QuickRecord */}
        {showQuickRecord && (
          <div className="bg-white rounded-3xl shadow-lg border border-[#FFB6C1]/15 p-5">
            <QuickRecord
              onSubmit={handleQuickRecordSubmit}
              onUpdateRecord={handleUpdateRecord}
            />
          </div>
        )}
      </section>

      {/* Zone 3: 每日挑战 */}
      <ChallengePanel
        dailyChallenge={dailyChallenge}
        silverChallenges={silverChallenges}
        goldChallenges={goldChallenges}
        activeChallenge={activeChallenge}
        userChallenges={userChallenges}
        onJoin={joinChallenge}
        onAbandon={abandonChallenge}
        onMakeUp={makeUpChallenge}
        onOpenRecordForm={handleOpenRecordForm}
        onCloseForm={handleCloseForm}
        openFormChallengeId={openFormChallengeId}
        onSubmitForm={handleChallengeRecordSubmit}
        isLoading={challengesLoading}
        progressSuccess={progressSuccess}
        milestoneReached={milestoneReached}
        joinSuccess={joinSuccess}
        error={challengesError}
      />

      {/* Zone 4: 成长信息流 */}
      <section className="space-y-4">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">成长信息流</h2>
          <Link
            href="/records"
            className="text-xs text-[#87CEEB] hover:text-[#5BA8D4] transition-colors font-medium"
          >
            查看全部 &rarr;
          </Link>
        </div>

        {/* Recent records */}
        {recentRecords.length > 0 ? (
          <div className="space-y-3">
            {recentRecords.map((record: any) => (
              <RecordCard
                key={record.id}
                record={record}
                goalTitle={record.related_task_id ? goalTitleMap[record.related_task_id] : undefined}
                onDelete={deleteRecord}
                feedback={feedbackMap[record.id]}
                followUp={followUpMap[record.id]}
                isLoadingFeedback={loadingFeedbackMap[record.id]}
                conversations={conversationsMap[record.id] || []}
                onAnswerFollowUp={answerFollowUp}
                onContinueChat={continueChat}
                isAnswering={answeringFollowUpMap[record.id]}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-8 text-center">
            <div className="text-4xl mb-3">🌨️</div>
            <p className="text-gray-500 text-sm mb-1">还没有记录</p>
            <p className="text-gray-400 text-xs">点击上方「记录小成功」开始你的雪球之旅吧</p>
          </div>
        )}
      </section>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
}

export default HomePage;
