/**
 * 溯光应用 — 核心类型定义
 *
 * 统一导出 Goal（目标）、Submission（成果提交）、Conversation（对话历史）
 * 三个核心实体类型，供 db 层和业务层共用。
 */

/** 目标状态 */
export type GoalStatus = 'active' | 'paused' | 'completed';

/** 目标频率 */
export type GoalFrequency = 'daily' | 'weekly' | 'custom';

/**
 * 目标（Goal）
 *
 * 用户设定的练习目标，如"练字"、"每日阅读"等。
 * frequency 为 custom 时，通过 customDays 指定每周哪几天需要执行（0=周日，6=周六）。
 */
export interface Goal {
  /** 自增主键，新增时由数据库生成 */
  id?: number;
  /** 目标标题 */
  title: string;
  /** 详细描述 */
  description: string;
  /** 执行频率 */
  frequency: GoalFrequency;
  /** 自定义执行日（0-6，0=周日），仅在 frequency='custom' 时有效 */
  customDays?: number[];
  /** 创建时间戳（ms） */
  createdAt: number;
  /** 最后更新时间戳（ms） */
  updatedAt: number;
  /** 当前状态 */
  status: GoalStatus;
}

/** 成果类型 */
export type SubmissionType = 'image' | 'audio' | 'text';

/**
 * 成果提交（Submission）
 *
 * 用户针对某个目标提交的练习成果，可附带 AI 反馈和改进建议。
 */
export interface Submission {
  /** 自增主键 */
  id?: number;
  /** 所属目标 ID */
  goalId: number;
  /** 成果类型 */
  type: SubmissionType;
  /** 内容：图片 base64 / 音频 base64 / 纯文字 */
  content: string;
  /** AI 鼓励反馈 */
  aiFeedback: string;
  /** 留给下次的改进建议 */
  improvementHint?: string;
  /** 提交时间戳（ms） */
  createdAt: number;
}

/** 对话角色 */
export type ConversationRole = 'user' | 'ai';

/** 对话消息类型 */
export type ConversationType = 'voice' | 'text' | 'system';

/**
 * 对话历史（Conversation）
 *
 * 用户与 AI 之间的对话记录，可关联到某个目标，也可以是全局对话。
 */
export interface Conversation {
  /** 自增主键 */
  id?: number;
  /** 关联目标 ID（可选，为 undefined 时表示全局对话） */
  goalId?: number;
  /** 发言角色 */
  role: ConversationRole;
  /** 消息内容 */
  content: string;
  /** 消息类型 */
  type: ConversationType;
  /** 消息时间戳（ms） */
  createdAt: number;
}
