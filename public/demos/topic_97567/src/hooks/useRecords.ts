import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useAchievements } from './useAchievements';
import { useSnowball } from '@/contexts/SnowballContext';
import { analytics } from '@/lib/analytics';
import { triggerAchievementCelebration } from '@/app/components/GlobalCelebration';

type CelebrationType = 'breakthrough' | 'streak' | 'late_night' | 'normal' | 'question_answer';

const getTodayKey = (type: string): string => {
  // 修复 R8-1: 使用本地日期替代 UTC 日期，与 useReturnDetection 修复相同的 bug 模式
  // toISOString().split('T')[0] 产生 UTC 日期，UTC 午夜（北京 08:00）时 key 会切换
  // 导致 hasTriggeredToday 失效，streak/late_night 庆祝在 UTC 午夜前后重复触发
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const today = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return `celebration_${type}_${today}`;
};

const hasTriggeredToday = (type: string): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(getTodayKey(type)) === 'true';
};

const markTriggeredToday = (type: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getTodayKey(type), 'true');
};

const ACHIEVEMENT_MESSAGES: Record<string, string> = {
  records_1: '雪球之旅，由此启程 🌱',
  records_3: '初试身手，雪球开始滚动 ✨',
  records_7: '一周足迹，习惯正在萌芽 📅',
  records_14: '两周坚持，每一步都算数 💪',
  records_30: '月度记录者，习惯已成自然 🎯',
  records_66: '习惯养成，雪球越滚越大 🔄',
  records_100: '百条长路，你已走过百步，未来可期 🌟',
  records_200: '双百里程，记录已成为你的生活方式 🌈',
  streak_3: '三连击！习惯正在养成 🔥',
  streak_7: '一周达人！坚持的力量 📆',
  streak_14: '两周坚持！你真的很棒 🌙',
  streak_21: '习惯养成！21天的蜕变 🔄',
  streak_30: '月度勇士！坚持已成为你的标签 💪',
  streak_66: '深度习惯！雪球势不可挡 ⚡',
  streak_100: '百日坚持！你是真正的强者 🏅',
  streak_365: '全年坚持！传奇就此诞生 👑',
  challenge_first: '挑战者！勇敢迈出第一步 🎯',
  challenge_bronze_5: '青铜新手！挑战之路越走越宽 🥉',
  challenge_silver_1: '白银进阶！实力不断提升 🥈',
  challenge_gold_1: '黄金勇士！挑战巅峰 🥇',
  challenge_all_types: '全能挑战者！无所不能 🏆',
  challenge_10: '挑战达人！挑战已成为习惯 ⭐',
  task_first: '行动派！第一个任务完成 ✅',
  task_5: '执行者！行动力满满 📋',
  task_10: '任务达人！效率之星 🎖️',
  interact_first: '雪球之友！友谊开始 ❄️',
  interact_10: '亲密伙伴！默契十足 💙',
  interact_50: '雪球知己！心有灵犀 💜',
  interact_100: '最佳拍档！形影不离 💝',
  hidden_midnight: '夜猫子！深夜的坚持最动人 🦉',
  hidden_clicker: '雪球按摩师！手法专业 👆',
  hidden_perfect: '完美主义者！追求极致 💎',
  first_procrastination: '急救先锋！迈出第一步 ⚡',
  master_all: '雪球大师！你已登顶，继续创造奇迹 🌈',
};

interface Conversation {
  id: string;
  record_id: string;
  role: 'assistant' | 'user';
  content: string;
  created_at: string;
}

interface CreateRecordOptions {
  source?: 'normal' | 'question';
  skipCelebration?: boolean;
  skipAchievementCheck?: boolean;
}

function isFollowUpByKeywords(text: string): boolean {
  return text.includes('？') || text.includes('?') ||
    text.includes('说说') || text.includes('分享') ||
    text.includes('能') || text.includes('可以');
}

export function useRecords() {
  const { token } = useAuth();
  const { newlyUnlockedAchievements, checkAchievements } = useAchievements();
  const { stats: snowballStats } = useSnowball();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [records, setRecords] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [followUpMap, setFollowUpMap] = useState<Record<string, string>>({});
  const [loadingFeedbackMap, setLoadingFeedbackMap] = useState<Record<string, boolean>>({});
  const [conversationsMap, setConversationsMap] = useState<Record<string, Conversation[]>>({});
  const [answeringFollowUpMap, setAnsweringFollowUpMap] = useState<Record<string, boolean>>({});

  // Celebration & feedback state
  const [celebrationType, setCelebrationType] = useState<CelebrationType | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedbackBubble, setShowFeedbackBubble] = useState(false);
  const [aiQuickFeedback, setAiQuickFeedback] = useState('');
  // 修复 R5-4.2: 使用 ?? 替代 ||，避免 todayStreak=0 时被错误替换为 1
  const streakDays = snowballStats.todayStreak ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recordsBeforeCreate = useRef<any[]>([]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [recordsRes, bigTasksRes] = await Promise.all([
        fetch('/api/records', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/tasks/big', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        setRecords(recordsData.records);
      } else {
        setError('获取记录失败');
      }
      if (bigTasksRes.ok) {
        const bigTasksData = await bigTasksRes.json();
        setGoals((bigTasksData.tasks || []).map((t: any) => ({ id: t.id, title: t.title })));
      }
    } catch (err) {
      console.error(err);
      setError('获取记录失败');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecords();
  }, [fetchRecords]);

  const fetchFeedback = async (recordId: string, content: string, goalTitle?: string, goalProgress?: number) => {
    if (!token) return;
    setLoadingFeedbackMap(prev => ({ ...prev, [recordId]: true }));
    try {
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          record_content: content,
          goal_title: goalTitle,
          goal_progress: goalProgress,
        }),
      });
      if (!response.ok) throw new Error('获取反馈失败');
      const data = await response.json();
      if (!data || typeof data !== 'object') return;
      if (data.is_follow_up && data.follow_up) {
        setFollowUpMap(prev => ({ ...prev, [recordId]: data.follow_up }));
        
        try {
          const saveResponse = await fetch('/api/records/follow-up', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              record_id: recordId,
              role: 'assistant',
              content: data.follow_up,
            }),
          });
          setConversationsMap(prev => ({
            ...prev,
            [recordId]: [...(prev[recordId] || []), {
              id: `initial-${Date.now()}`,
              record_id: recordId,
              role: 'assistant' as const,
              content: data.follow_up,
              created_at: new Date().toISOString(),
            }],
          }));
        } catch (saveErr) {
          console.error('[雪球对话] Failed to persist initial follow-up:', saveErr);
        }
      } else if (data.feedback) {
        setFeedbackMap(prev => ({ ...prev, [recordId]: data.feedback }));
      }
    } catch (err) {
      console.error('[雪球对话] fetchFeedback error:', err);
    } finally {
      setLoadingFeedbackMap(prev => ({ ...prev, [recordId]: false }));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const determineCelebrationType = (
    prevRecords: any[], 
    source: 'normal' | 'question' = 'normal',
    newlyUnlockedAchievements: string[] = []
  ): CelebrationType => {
    // 1. Question answer - special celebration (highest priority)
    if (source === 'question') return 'question_answer';

    // 2. Breakthrough - achievement unlocked (highest priority after question)
    if (newlyUnlockedAchievements.length > 0) return 'breakthrough';

    // Check streak - did user record yesterday?
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hasRecordedYesterday = prevRecords.some((r) => {
      const recordDate = new Date(r.created_at);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === yesterday.getTime();
    });

    // 3. Streak - higher priority than late_night, but only once per day
    if (hasRecordedYesterday && !hasTriggeredToday('streak')) {
      markTriggeredToday('streak');
      return 'streak';
    }

    // 4. Late night (after 22:00) - only once per day
    const currentHour = new Date().getHours();
    if (currentHour >= 22 && !hasTriggeredToday('late_night')) {
      markTriggeredToday('late_night');
      return 'late_night';
    }

    // 5. Normal - default
    return 'normal';
  };

  const getFeedbackMessage = (
    type: CelebrationType, 
    answerContent?: string,
    achievementId?: string
  ): string => {
    switch (type) {
      case 'breakthrough': {
        if (achievementId && ACHIEVEMENT_MESSAGES[achievementId]) {
          return ACHIEVEMENT_MESSAGES[achievementId];
        }
        return '雪球又变大了！🎊';
      }
      case 'streak': {
        // 修复 R5-4.2: streakDays=0 时（stats 滞后竞态）兜底，避免显示"连续第0天"
        if (streakDays < 1) return '雪球持续滚动！🔥';
        return `连续第${streakDays}天！🔥`;
      }
      case 'late_night':
        return '这么晚还在坚持，真了不起 🌙';
      case 'normal':
        return '雪球+5% 🎈';
      case 'question_answer':
        return answerContent || '感谢你的分享！❄️';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createRecord = async (recordData: any, options?: CreateRecordOptions) => {
    if (!token) return null;
    try {
      // Save records count before creating for celebration determination
      recordsBeforeCreate.current = records;

      const bodyData = {
        ...recordData,
        related_task_id: recordData.related_task_id || undefined,
      };

      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || '创建记录失败');
        return null;
      }
      setRecords(prev => [data.record, ...prev]);
      const taskId = recordData.related_task_id;
      const goalTitle = taskId 
        ? goals.find((g: any) => g.id === taskId)?.title 
        : undefined;
      fetchFeedback(data.record.id, data.record.content, goalTitle).catch((err) => {
        console.error('[雪球对话] fetchFeedback unhandled:', err);
      });

      const skipAchievementCheck = options?.skipAchievementCheck || false;
      let newlyUnlocked: string[] = [];

      if (!skipAchievementCheck) {
        const currentHour = new Date().getHours();
        const isMidnight = currentHour >= 22 || currentHour < 6;
        const isLongRecord = (recordData.content || '').length >= 500;
        newlyUnlocked = await checkAchievements({
          skipCelebration: true,
          midnight_record: isMidnight,
          record_500_words: isLongRecord,
        });
      }

      // Analytics: track record creation
      analytics.trackRecordCreate(
        data.record.id,
        data.record.type,
        data.record.mood,
        data.record.content?.length || 0,
        !!data.record.related_goal_id
      );

      const source = options?.source || 'normal';
      const skipCelebration = options?.skipCelebration || false;

      if (!skipCelebration && newlyUnlocked.length > 0) {
        triggerAchievementCelebration(newlyUnlocked);
      }

      if (!skipCelebration && newlyUnlocked.length === 0) {
        const type = determineCelebrationType(recordsBeforeCreate.current, source, newlyUnlocked);
        const message = getFeedbackMessage(type, data.record.content, undefined);
        setCelebrationType(type);
        setFeedbackMessage(message);
        setShowCelebration(true);
      }

      return data.record;
    } catch (err) {
      setError('创建记录失败');
      console.error(err);
      return null;
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (!token) return false;
    try {
      const response = await fetch('/api/records', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: recordId }),
      });
      if (!response.ok) throw new Error('删除记录失败');
      setRecords(prev => prev.filter(r => r.id !== recordId));
      return true;
    } catch (err) {
      console.error(err);
      setError('删除记录失败');
      return false;
    }
  };

  const updateRecord = async (recordId: string, data: { type?: string; tags?: string[] }) => {
    if (!token) return false;
    try {
      const response = await fetch('/api/records', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: recordId, ...data }),
      });
      if (!response.ok) throw new Error('更新记录失败');
      const result = await response.json();
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...data } : r));
      return true;
    } catch (err) {
      console.error(err);
      setError('更新记录失败');
      return false;
    }
  };

  const onCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setShowFeedbackBubble(true);
  }, []);

  const onFeedbackBubbleComplete = useCallback(() => {
    setShowFeedbackBubble(false);
    // Fetch AI quick feedback
    if (token) {
      fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          record_content: feedbackMessage,
          quick: true,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.feedback) {
            setAiQuickFeedback(data.feedback);
          }
        })
        .catch(() => {
          // Silently fail for quick feedback
        });
    }
  }, [token, feedbackMessage]);

  // 获取单条记录的对话历史
  const fetchConversations = useCallback(async (recordId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/records/follow-up?record_id=${recordId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setConversationsMap(prev => ({ ...prev, [recordId]: data.conversations || [] }));
        
        // 恢复 followUp 状态（如果最后一条是对话且是追问）
        const conversations = data.conversations || [];
        if (conversations.length > 0) {
          const lastConv = conversations[conversations.length - 1];
          if (lastConv.role === 'assistant') {
            const isQuestion = isFollowUpByKeywords(lastConv.content);
            if (isQuestion) {
              setFollowUpMap(prev => ({ ...prev, [recordId]: lastConv.content }));
            } else {
              // 如果是普通反馈，设置到 feedbackMap
              setFeedbackMap(prev => ({ ...prev, [recordId]: lastConv.content }));
            }
          }
        }
      }
    } catch (err) {
      console.error('[雪球对话] Failed to fetch conversations:', err);
    }
  }, [token]);

  const initialFetchDoneRef = useRef(false);

  const fetchAllConversations = useCallback(async (recordIds: string[]) => {
    if (!recordIds || recordIds.length === 0 || !token) return;

    await Promise.all(recordIds.map(recordId => fetchConversations(recordId)));
  }, [token, fetchConversations]);

  useEffect(() => {
    if (!loading && records.length > 0 && token && !initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      const recordIds = records.map(r => r.id);
      fetchAllConversations(recordIds);
    }
  }, [loading, records, token, fetchAllConversations]);

  // 回答追问
  const answerFollowUp = useCallback(async (recordId: string, answer: string, followUpQuestion: string) => {
    if (!token) return null;
    setAnsweringFollowUpMap(prev => ({ ...prev, [recordId]: true }));
    try {
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          record_id: recordId,
          follow_up_question: followUpQuestion,
          follow_up_answer: answer,
        }),
      });
      if (!response.ok) throw new Error('提交回答失败');
      const data = await response.json();
      
      // 更新对话历史
      if (data.feedback) {
        // 先将原始追问加入对话历史（如果还没有的话）
        setConversationsMap(prev => {
          const existingConversations = prev[recordId] || [];
          const hasOriginalQuestion = existingConversations.some(
            c => c.content === followUpQuestion && c.role === 'assistant'
          );
          
          let updatedConversations = [...existingConversations];
          
          // 添加原始追问（如果不存在，同时持久化到数据库）
          if (!hasOriginalQuestion) {
            // 异步持久化原始追问（不阻塞UI更新）
            fetch('/api/records/follow-up', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                record_id: recordId,
                role: 'assistant',
                content: followUpQuestion,
              }),
            }).catch(err => console.error('Failed to persist original question:', err));
            
            updatedConversations.push({
              id: `q-${Date.now()}`,
              record_id: recordId,
              role: 'assistant',
              content: followUpQuestion,
              created_at: new Date().toISOString(),
            });
          }
          
          // 添加用户回答
          updatedConversations.push({
            id: `a-${Date.now()}`,
            record_id: recordId,
            role: 'user',
            content: answer,
            created_at: new Date().toISOString(),
          });
          
          // 判断AI反馈是追问还是普通反馈
          const isFollowUpResponse = data.is_follow_up ?? isFollowUpByKeywords(data.feedback);
          
          if (isFollowUpResponse) {
            // 如果是新的追问，添加到对话并设置followUp
            updatedConversations.push({
              id: `f-${Date.now()}`,
              record_id: recordId,
              role: 'assistant',
              content: data.feedback,
              created_at: new Date().toISOString(),
            });
            
            return {
              ...prev,
              [recordId]: updatedConversations,
            };
          } else {
            // 如果是普通反馈，只添加到对话
            updatedConversations.push({
              id: `fb-${Date.now()}`,
              record_id: recordId,
              role: 'assistant',
              content: data.feedback,
              created_at: new Date().toISOString(),
            });
            
            return {
              ...prev,
              [recordId]: updatedConversations,
            };
          }
        });
        
        // 清除当前追问状态（因为已经加入对话历史了）
        setFollowUpMap(prev => {
          const newMap = { ...prev };
          delete newMap[recordId];
          return newMap;
        });
        
        // 判断是否需要设置新的追问
        const isFollowUpResponse2 = data.is_follow_up ?? isFollowUpByKeywords(data.feedback);
        
        if (isFollowUpResponse2) {
          // 设置新的追问
          setFollowUpMap(prev => ({ ...prev, [recordId]: data.feedback }));
        } else {
          // 设置为普通反馈（用于显示完成状态）
          setFeedbackMap(prev => ({ ...prev, [recordId]: data.feedback }));
        }
      }
      return data;
    } catch (err) {
      console.error('Failed to answer follow-up:', err);
      return null;
    } finally {
      setAnsweringFollowUpMap(prev => ({ ...prev, [recordId]: false }));
    }
  }, [token]);

  // 继续聊天（用户主动发起的新对话）
  const continueChat = useCallback(async (recordId: string, message: string) => {
    if (!token) return null;
    setAnsweringFollowUpMap(prev => ({ ...prev, [recordId]: true }));
    try {
      // 1. 先将用户消息持久化到数据库
      await fetch('/api/records/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          record_id: recordId,
          role: 'user',
          content: message,
        }),
      });

      // 2. 更新本地状态
      setConversationsMap(prev => {
        const existing = prev[recordId] || [];
        return {
          ...prev,
          [recordId]: [...existing, {
            id: `chat-${Date.now()}`,
            record_id: recordId,
            role: 'user',
            content: message,
            created_at: new Date().toISOString(),
          }],
        };
      });

      // 3. 调用 AI 获取响应
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          record_content: message,
          feedback_level: 'micro',
        }),
      });
      
      if (!response.ok) throw new Error('获取AI响应失败');
      const data = await response.json();

      if (data.feedback || data.follow_up) {
        const aiResponse = data.feedback || data.follow_up;
        
        // 判断是追问还是普通反馈
        const isFollowUpResponse = data.is_follow_up ?? isFollowUpByKeywords(aiResponse);

        // 4. 将AI响应也持久化到数据库
        await fetch('/api/records/follow-up', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            record_id: recordId,
            role: 'assistant',
            content: aiResponse,
          }),
        });

        // 5. 更新本地状态
        setConversationsMap(prev => {
          const existing = prev[recordId] || [];
          return {
            ...prev,
            [recordId]: [...existing, {
              id: `resp-${Date.now()}`,
              record_id: recordId,
              role: 'assistant',
              content: aiResponse,
              created_at: new Date().toISOString(),
            }],
          };
        });

        if (isFollowUpResponse) {
          setFollowUpMap(prev => ({ ...prev, [recordId]: aiResponse }));
        } else {
          setFollowUpMap(prev => {
            const newMap = { ...prev };
            delete newMap[recordId];
            return newMap;
          });
          setFeedbackMap(prev => ({ ...prev, [recordId]: aiResponse }));
        }
      }
      
      return data;
    } catch (err) {
      console.error('Failed to continue chat:', err);
      return null;
    } finally {
      setAnsweringFollowUpMap(prev => ({ ...prev, [recordId]: false }));
    }
  }, [token]);

  return {
    records, goals, loading, error, createRecord, deleteRecord, updateRecord, fetchFeedback, feedbackMap, followUpMap, loadingFeedbackMap, refetch: fetchRecords, newlyUnlockedAchievements,
    celebrationType, showCelebration, streakDays,
    feedbackMessage, showFeedbackBubble,
    aiQuickFeedback,
    onCelebrationComplete,
    onFeedbackBubbleComplete,
    conversationsMap,
    answeringFollowUpMap,
    fetchConversations,
    answerFollowUp,
    continueChat,
  };
}
