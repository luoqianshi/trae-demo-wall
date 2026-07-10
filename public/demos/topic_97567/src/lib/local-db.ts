// Backward-compatibility layer.
//
// All implementations have been migrated to src/lib/repositories/.
// This file re-exports them so that existing `import * as db from '@/lib/local-db'`
// continues to work without changes to API routes or tests.
//
// See docs/superpowers/plans/2026-07-08-backend-refactor.md for the full
// refactor design.

export { resetData } from './repositories/base';
export { getUser, updateUser } from './repositories/user-repository';
export { getTasks, createTask, updateTask, completeTaskWithScore, deleteTask } from './repositories/task-repository';
export {
  getRecords,
  getRecord,
  createRecord,
  createRecordWithScore,
  updateRecord,
  deleteRecord,
} from './repositories/record-repository';
export { getGrowthData, updateGrowthData } from './repositories/growth-repository';
export {
  getConversations,
  createConversation,
} from './repositories/conversation-repository';
export {
  getUserAchievements,
  checkAndUnlockAchievements,
  getUserStats,
} from './repositories/achievement-repository';
export { getThresholds, upsertThresholds } from './repositories/threshold-repository';
export {
  getProcrastinationSessions,
  getProcrastinationSession,
  createProcrastinationSession,
  updateProcrastinationSession,
} from './repositories/procrastination-repository';
export {
  getChallenges,
  setChallenges,
  getUserChallenges,
  createUserChallenge,
  updateUserChallenge,
} from './repositories/challenge-repository';
export {
  getEncouragementPosts,
  createEncouragementPost,
  toggleEncouragementLike,
} from './repositories/encouragement-repository';
export {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
} from './repositories/reminder-repository';
export {
  getUserSettings,
  upsertUserSettings,
  getUserInteractions,
  incrementUserInteraction,
} from './repositories/user-settings-repository';
export { addScoreEvent, getScoreEvents } from './repositories/score-repository';
