/**
 * 溯光应用 — IndexedDB 数据持久化层
 *
 * 使用 idb 库封装 IndexedDB 操作，提供 Goal、Submission、Conversation
 * 三个 object store 的完整 CRUD 能力。
 *
 * @module lib/db
 */

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Goal, Submission, Conversation } from '../types';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

/** 溯光数据库 Schema 定义（供 idb 类型推导） */
interface SuguangDB extends DBSchema {
  goals: {
    key: number;
    value: Goal;
    indexes: {
      'status': Goal['status'];
    };
  };
  submissions: {
    key: number;
    value: Submission;
    indexes: {
      'goalId': number;
      'createdAt': number;
    };
  };
  conversations: {
    key: number;
    value: Conversation;
    indexes: {
      'goalId': number;
      'createdAt': number;
    };
  };
}

// ---------------------------------------------------------------------------
// 数据库实例
// ---------------------------------------------------------------------------

const DB_NAME = 'suguang-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<SuguangDB> | null = null;

// ---------------------------------------------------------------------------
// 初始化
// ---------------------------------------------------------------------------

/**
 * 初始化（或获取已有）数据库连接。
 *
 * 首次调用时会创建数据库及三个 object store 和相关索引；
 * 后续调用直接返回缓存的实例。
 *
 * @returns 打开后的 IDB 数据库实例
 * @throws 当浏览器不支持 IndexedDB 或数据库升级失败时抛出异常
 */
export async function initDB(): Promise<IDBPDatabase<SuguangDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SuguangDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // goals store
      if (!db.objectStoreNames.contains('goals')) {
        const goalStore = db.createObjectStore('goals', {
          keyPath: 'id',
          autoIncrement: true,
        });
        goalStore.createIndex('status', 'status');
      }

      // submissions store
      if (!db.objectStoreNames.contains('submissions')) {
        const subStore = db.createObjectStore('submissions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        subStore.createIndex('goalId', 'goalId');
        subStore.createIndex('createdAt', 'createdAt');
      }

      // conversations store
      if (!db.objectStoreNames.contains('conversations')) {
        const convStore = db.createObjectStore('conversations', {
          keyPath: 'id',
          autoIncrement: true,
        });
        convStore.createIndex('goalId', 'goalId');
        convStore.createIndex('createdAt', 'createdAt');
      }
    },
  });

  return dbInstance;
}

// ---------------------------------------------------------------------------
// Goal 操作
// ---------------------------------------------------------------------------

/**
 * 新增目标。
 *
 * @param goal - 目标对象（不需要提供 id，数据库自动生成）
 * @returns 带有自增 id 的目标对象
 */
export async function addGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
  const db = await initDB();
  const id = await db.add('goals', goal as Goal);
  return { ...goal, id } as Goal;
}

/**
 * 获取所有目标（按创建时间升序）。
 *
 * @returns 目标数组
 */
export async function getGoals(): Promise<Goal[]> {
  const db = await initDB();
  const goals = await db.getAll('goals');
  return goals.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * 根据 ID 获取单个目标。
 *
 * @param id - 目标 ID
 * @returns 目标对象，不存在时返回 undefined
 */
export async function getGoal(id: number): Promise<Goal | undefined> {
  const db = await initDB();
  return db.get('goals', id);
}

/**
 * 更新目标。
 *
 * @param goal - 必须包含已存在的 id 字段
 */
export async function updateGoal(goal: Goal): Promise<void> {
  const db = await initDB();
  await db.put('goals', goal);
}

/**
 * 获取所有「进行中」的目标（按创建时间升序）。
 *
 * @returns 状态为 active 的目标数组
 */
export async function getActiveGoals(): Promise<Goal[]> {
  const db = await initDB();
  const goals = await db.getAllFromIndex('goals', 'status', 'active');
  return goals.sort((a, b) => a.createdAt - b.createdAt);
}

// ---------------------------------------------------------------------------
// Submission 操作
// ---------------------------------------------------------------------------

/**
 * 新增成果提交。
 *
 * @param sub - 提交对象（不需要提供 id）
 * @returns 带有自增 id 的提交对象
 */
export async function addSubmission(sub: Omit<Submission, 'id'>): Promise<Submission> {
  const db = await initDB();
  const id = await db.add('submissions', sub as Submission);
  return { ...sub, id } as Submission;
}

/**
 * 获取指定目标的所有提交记录（按时间升序）。
 *
 * @param goalId - 目标 ID
 * @returns 该目标下的提交数组
 */
export async function getSubmissionsByGoal(goalId: number): Promise<Submission[]> {
  const db = await initDB();
  const subs = await db.getAllFromIndex('submissions', 'goalId', goalId);
  return subs.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * 获取指定目标的最近一条提交记录。
 *
 * @param goalId - 目标 ID
 * @returns 最近一条提交，不存在时返回 undefined
 */
export async function getLatestSubmission(goalId: number): Promise<Submission | undefined> {
  const db = await initDB();
  const subs = await db.getAllFromIndex('submissions', 'goalId', goalId);
  if (subs.length === 0) return undefined;
  return subs.reduce((latest, cur) => (cur.createdAt > latest.createdAt ? cur : latest));
}

// ---------------------------------------------------------------------------
// Conversation 操作
// ---------------------------------------------------------------------------

/**
 * 新增对话记录。
 *
 * @param conv - 对话对象（不需要提供 id）
 * @returns 带有自增 id 的对话对象
 */
export async function addConversation(conv: Omit<Conversation, 'id'>): Promise<Conversation> {
  const db = await initDB();
  const id = await db.add('conversations', conv as Conversation);
  return { ...conv, id } as Conversation;
}

/**
 * 获取所有对话记录（按时间升序）。
 *
 * @returns 对话数组
 */
export async function getConversations(): Promise<Conversation[]> {
  const db = await initDB();
  const convs = await db.getAll('conversations');
  return convs.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * 获取指定目标的对话记录（按时间升序）。
 *
 * @param goalId - 目标 ID
 * @returns 该目标下的对话数组
 */
export async function getConversationsByGoal(goalId: number): Promise<Conversation[]> {
  const db = await initDB();
  const convs = await db.getAllFromIndex('conversations', 'goalId', goalId);
  return convs.sort((a, b) => a.createdAt - b.createdAt);
}

// ---------------------------------------------------------------------------
// 调试工具
// ---------------------------------------------------------------------------

/**
 * 清空所有 object store 中的数据（仅用于开发调试）。
 *
 * @warning 此操作不可逆，请勿在生产环境随意调用
 */
export async function clearAll(): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(['goals', 'submissions', 'conversations'], 'readwrite');
  await Promise.all([
    tx.objectStore('goals').clear(),
    tx.objectStore('submissions').clear(),
    tx.objectStore('conversations').clear(),
    tx.done,
  ]);
}
