// Agent 类型
export interface Agent {
  name: string;
  displayName: string;
  description: string;
  available: boolean;
  version?: string;
}

export interface Workspace {
  name: string;
  path: string;
}

export interface Session {
  id: string;
  title: string;
  agent: string;
  cwd: string;
  status: 'idle' | 'running' | 'error';
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export interface AgentTask {
  id: string;
  sessionId: string;
  agent: string;
  prompt: string;
  cwd: string;
  status: 'queued' | 'running' | 'done' | 'error';
  startedAt: number;
  finishedAt?: number;
  error?: string;
}

// 消息类型
export interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'code' | 'diff' | 'file';
  metadata?: {
    language?: string;
    filePath?: string;
    diff?: DiffChange[];
  };
}

// Diff 变更
export interface DiffChange {
  type: 'add' | 'remove' | 'unchanged';
  lineNumber: number;
  content: string;
}

// 文件树节点
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}

// Git 相关
export interface GitStatus {
  branch: string | null;
  files: GitFile[];
  isRepo: boolean;
}

export interface GitFile {
  path: string;
  status: 'modified' | 'untracked' | 'added' | 'deleted' | 'renamed';
  staged: boolean;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

// Agent 原生会话
export interface AgentNativeSession {
  id: string;
  agent: string;
  project: string;
  title: string;
  lastActive: number;
  path: string;
}

// 侧边栏面板
export type SidebarPanel = 'agents' | 'files' | 'git';

// 右侧面板 Tab
export type RightPanelTab = 'status' | 'files' | 'memory';

// Agent 记忆
export interface AgentMemory {
  name: string;
  path: string;
  scope: 'project' | 'global';
  content: string;
}

// Agent TODO
export interface AgentTodo {
  text: string;
  done: boolean;
  source: string;
}

// 产物
export interface Artifact {
  id: string;
  type: 'file' | 'image' | 'code' | 'markdown';
  name: string;
  content: string;
  timestamp: number;
}

// WebSocket 消息
export interface WSMessage {
  type: 'connected' | 'start' | 'output' | 'done' | 'error' | 'stopped';
  content?: string;
  agent?: string;
  info?: {
    name: string;
    description: string;
    version?: string;
  };
  prompt?: string;
  message?: string;
}
