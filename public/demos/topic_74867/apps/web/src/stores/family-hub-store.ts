'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

/* ═══════════════ Types ═══════════════ */

export interface FamilyMetrics {
  understandingPercent: number;
  treeLevel: number;
  treeStage: string;
  treeGrowth: number; // 0-1
  longTermMemories: number;
  familyMembers: number;
  weeklyGrowthPercent: number;
  aiLevel: number;
  masteredSkills: number;
  activeAgents: number;
  newAbilities: number;
  wechatSync: 'connected' | 'disconnected';
  knowledgeDocs: number;
  growthValue: number;
}

export type ShimoStatus =
  | 'online'
  | 'thinking'
  | 'learning'
  | 'updating_memory'
  | 'updating_tree'
  | 'syncing_wechat';

export interface ShimoCore {
  status: ShimoStatus;
  understanding: number;
  level: number;
  agentCount: number;
  learningCount: number;
  recentLearning: string[];
}

export type AgentStatus = 'running' | 'thinking' | 'idle' | 'syncing' | 'learning' | 'ready';

export interface AgentRuntime {
  id: string;
  name: string;
  role: string;
  description?: string;
  status: AgentStatus;
  level: number;
  lastActive: string;
  calls: number;
  icon: string;
  color?: string;
  capabilities?: string[];
  welcomeMessage?: string;
  skillCount?: number;
}

export interface SkillProgress {
  id: string;
  name: string;
  description?: string;
  level: number;
  status: 'mastered' | 'learning' | 'new' | 'updated';
  progress?: number;
  sourceAgent: string;
  sourceAgentCode?: string;
  icon: string;
  color: string;
  category?: string;
  tags?: string[];
  examples?: string[];
}

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  detail: string;
  type: 'skill' | 'agent' | 'memory' | 'tree' | 'device';
}

export interface DeviceSync {
  id: string;
  name: string;
  status: 'connected' | 'synced' | 'coming_soon' | 'disconnected';
  icon: string;
}

export interface FamilyStatusItem {
  id: string;
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: string;
}

export interface MCPToolCall {
  id: string;
  tool: string;
  params: Record<string, unknown>;
  result?: unknown;
  status: 'idle' | 'calling' | 'success' | 'error';
  timestamp: number;
}

interface FamilyHubState {
  /* ── Data ── */
  metrics: FamilyMetrics;
  shimoCore: ShimoCore;
  agents: AgentRuntime[];
  skills: SkillProgress[];
  timeline: TimelineEntry[];
  devices: DeviceSync[];
  familyStatus: FamilyStatusItem[];

  /* ── Meta ── */
  loading: boolean;
  error: string | null;
  lastSync: number;

  /* ── MCP ── */
  mcpCalls: MCPToolCall[];

  /* ── Actions ── */
  fetchAll: () => Promise<void>;
  triggerInterviewComplete: () => Promise<void>;
  triggerSkillLearn: (skillId: string) => Promise<void>;
  invokeAgent: (agentCode: string, message: string) => Promise<{ success: boolean; response: string; agentName: string; tokensUsed: number; model: string }>;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  setShimoStatus: (status: ShimoStatus) => void;
  callMCPTool: (tool: string, params: Record<string, unknown>) => Promise<unknown>;
  clearMCPCalls: () => void;
}

/* ═══════════════ Default State (seed data) ═══════════════ */

const defaultMetrics: FamilyMetrics = {
  understandingPercent: 89,
  treeLevel: 8,
  treeStage: 'Young Tree',
  treeGrowth: 0.55,
  longTermMemories: 428,
  familyMembers: 5,
  weeklyGrowthPercent: 18,
  aiLevel: 12,
  masteredSkills: 53,
  activeAgents: 16,
  newAbilities: 3,
  wechatSync: 'connected',
  knowledgeDocs: 128,
  growthValue: 56,
};

const defaultShimoCore: ShimoCore = {
  status: 'online',
  understanding: 89,
  level: 12,
  agentCount: 16,
  learningCount: 3,
  recentLearning: ['家庭收纳', '家电维修', '慢病管理'],
};

const defaultAgents: AgentRuntime[] = [
  { id: 'life', name: 'Life Agent', role: '生活管理', status: 'running', level: 5, lastActive: '刚刚', calls: 128, icon: 'Heart' },
  { id: 'kitchen', name: 'Kitchen Agent', role: '智慧厨房', status: 'thinking', level: 8, lastActive: '2分钟前', calls: 89, icon: 'ChefHat' },
  { id: 'repair', name: 'Repair Agent', role: '家庭维修', status: 'idle', level: 4, lastActive: '1小时前', calls: 45, icon: 'Wrench' },
  { id: 'knowledge', name: 'Knowledge Agent', role: '知识库', status: 'syncing', level: 6, lastActive: '5分钟前', calls: 156, icon: 'BookOpen' },
  { id: 'health', name: 'Health Agent', role: '健康监测', status: 'learning', level: 4, lastActive: '10分钟前', calls: 67, icon: 'HeartPulse' },
  { id: 'travel', name: 'Travel Agent', role: '旅行规划', status: 'ready', level: 3, lastActive: '2天前', calls: 34, icon: 'Plane' },
  { id: 'care', name: 'Care Agent', role: '老人陪伴', status: 'learning', level: 2, lastActive: '3小时前', calls: 23, icon: 'HandHeart' },
  { id: 'growth', name: 'Growth Agent', role: '成长追踪', status: 'running', level: 5, lastActive: '刚刚', calls: 203, icon: 'Sprout' },
  { id: 'emotion', name: 'Emotion Agent', role: '情绪分析', status: 'thinking', level: 4, lastActive: '8分钟前', calls: 98, icon: 'Smile' },
  { id: 'shopping', name: 'Shopping Agent', role: '购物顾问', status: 'running', level: 4, lastActive: '15分钟前', calls: 112, icon: 'ShoppingCart' },
  { id: 'pet', name: 'Pet Agent', role: '宠物护理', status: 'idle', level: 2, lastActive: '5小时前', calls: 18, icon: 'PawPrint' },
  { id: 'finance', name: 'Finance Agent', role: '家庭财务', status: 'learning', level: 1, lastActive: '1天前', calls: 8, icon: 'TrendingUp' },
];

const defaultSkills: SkillProgress[] = [
  { id: 'kitchen', name: '智慧厨房', level: 8, status: 'new', sourceAgent: 'Kitchen Agent', icon: 'ChefHat', color: '#FBBF24' },
  { id: 'elder', name: '老人陪伴', level: 6, status: 'updated', sourceAgent: 'Care Agent', icon: 'HandHeart', color: '#FB923C' },
  { id: 'plant', name: '植物养护', level: 1, status: 'learning', progress: 82, sourceAgent: 'Life Agent', icon: 'Sprout', color: '#4ADE80' },
  { id: 'repair', name: '维修助手', level: 4, status: 'mastered', sourceAgent: 'Repair Agent', icon: 'Wrench', color: '#5E9EF5' },
  { id: 'cooking', name: '菜谱推荐', level: 7, status: 'mastered', sourceAgent: 'Kitchen Agent', icon: 'ChefHat', color: '#FB923C' },
  { id: 'shopping', name: '购物顾问', level: 5, status: 'mastered', sourceAgent: 'Shopping Agent', icon: 'ShoppingCart', color: '#22D3EE' },
  { id: 'travel', name: '旅行规划', level: 4, status: 'mastered', sourceAgent: 'Travel Agent', icon: 'Plane', color: '#A78BFA' },
  { id: 'health', name: '健康监测', level: 3, status: 'updated', sourceAgent: 'Health Agent', icon: 'HeartPulse', color: '#FB7185' },
];

const defaultTimeline: TimelineEntry[] = [
  { id: '1', date: '06-28', title: '学习：空气炸锅说明书', detail: 'Kitchen Skill Lv+1', type: 'skill' },
  { id: '2', date: '06-27', title: '新增：家庭收纳 Skill', detail: 'Life Agent 完成学习', type: 'skill' },
  { id: '3', date: '06-25', title: '新增：Care Agent', detail: '学习老年心理学知识库', type: 'agent' },
  { id: '4', date: '06-22', title: '新增 5 段珍贵回忆', detail: '访谈记录归档至长期记忆', type: 'memory' },
  { id: '5', date: '06-20', title: '新增：Plant Agent', detail: '识别到家庭植物养护需求', type: 'agent' },
  { id: '6', date: '06-21', title: '新增：植物养护 Skill', detail: '学习多肉植物养护指南', type: 'skill' },
  { id: '7', date: '06-18', title: '生命树长出新枝', detail: '家庭关系分支进一步繁茂', type: 'tree' },
  { id: '8', date: '06-15', title: '微信同步已连接', detail: '家庭群消息开始同步', type: 'device' },
];

const defaultDevices: DeviceSync[] = [
  { id: 'web', name: 'Web', status: 'connected', icon: 'Globe' },
  { id: 'wechat', name: 'WeChat', status: 'disconnected', icon: 'MessageCircle' },
  { id: 'family', name: 'Family Group', status: 'connected', icon: 'Users' },
  { id: 'memory', name: 'Memory', status: 'synced', icon: 'Database' },
  { id: 'app', name: 'App', status: 'coming_soon', icon: 'Smartphone' },
  { id: 'watch', name: 'Watch', status: 'coming_soon', icon: 'Watch' },
  { id: 'robot', name: 'Robot', status: 'coming_soon', icon: 'Bot' },
];

const defaultFamilyStatus: FamilyStatusItem[] = [
  { id: 'mood', label: '家庭情绪', value: '温暖', sub: '全员状态良好', color: '#FBBF24', icon: 'Smile' },
  { id: 'memory', label: '本周新增回忆', value: '3 段', sub: '昨天新增了1段', color: '#60A5FA', icon: 'BookOpen' },
  { id: 'tree', label: '生命树成长', value: 'Lv.8', sub: 'Young Tree 阶段', color: '#4ADE80', icon: 'TreePine' },
  { id: 'advice', label: '今日家庭建议', value: '给爸妈打个电话', sub: '已3天未联系', color: '#F87171', icon: 'Heart' },
  { id: 'todo', label: '本周待办', value: '周末家庭聚餐', sub: '周六晚上', color: '#A78BFA', icon: 'Calendar' },
  { id: 'ai', label: 'AI理解程度', value: '89%', sub: '持续学习中', color: '#5E9EF5', icon: 'Brain' },
];

/* ═══════════════ API Layer (with fallback) ═══════════════ */

async function fetchWithFallback<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const data = await apiClient.get<T>(endpoint);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

/* ═══════════════ MCP Tool Registry ═══════════════ */

const MCP_TOOLS: Record<string, (params: Record<string, unknown>, state: FamilyHubState) => unknown> = {
  'family.get_status': (_params, state) => ({
    metrics: state.metrics,
    shimoCore: state.shimoCore,
  }),
  'family.trigger_interview': () => ({
    triggered: true,
    message: 'Interview session started. Memory and tree will update on completion.',
  }),
  'family.add_memory': (params) => ({
    added: true,
    memoryId: `mem-${Date.now()}`,
    content: params.content ?? '',
  }),
  'shimo.get_core': (_params, state) => state.shimoCore,
  'shimo.set_status': (params, state) => {
    const status = params.status as ShimoStatus;
    if (status) state.setShimoStatus(status);
    return { status: status ?? state.shimoCore.status };
  },
  'agent.list': (_params, state) => state.agents,
  'agent.update_status': (params, state) => {
    const { agentId, status } = params as { agentId: string; status: AgentStatus };
    if (agentId && status) state.updateAgentStatus(agentId, status);
    return { agentId, status };
  },
  'skill.list': (_params, state) => state.skills,
  'skill.learn': (params, state) => {
    const skillId = params.skillId as string;
    if (skillId) void state.triggerSkillLearn(skillId);
    return { skillId, learning: true };
  },
  'timeline.list': (_params, state) => state.timeline,
  'device.list': (_params, state) => state.devices,
};

/* ═══════════════ Store ═══════════════ */

export const useFamilyHubStore = create<FamilyHubState>()(
  persist(
    (set, get) => ({
      metrics: defaultMetrics,
      shimoCore: defaultShimoCore,
      agents: defaultAgents,
      skills: defaultSkills,
      timeline: defaultTimeline,
      devices: defaultDevices,
      familyStatus: defaultFamilyStatus,

      loading: false,
      error: null,
      lastSync: Date.now(),

      mcpCalls: [],

      fetchAll: async () => {
        set({ loading: true, error: null });
        try {
          const [metrics, shimoCore, agents, skills, timeline, devices, familyStatus] =
            await Promise.all([
              fetchWithFallback('family-hub/metrics', defaultMetrics),
              fetchWithFallback('family-hub/shimo-core', defaultShimoCore),
              fetchWithFallback('family-hub/agents', defaultAgents),
              fetchWithFallback('family-hub/skills', defaultSkills),
              fetchWithFallback('family-hub/timeline', defaultTimeline),
              fetchWithFallback('family-hub/devices', defaultDevices),
              fetchWithFallback('family-hub/family-status', defaultFamilyStatus),
            ]);

          set({
            metrics,
            shimoCore,
            agents,
            skills,
            timeline,
            devices,
            familyStatus,
            loading: false,
            lastSync: Date.now(),
          });
        } catch (err) {
          set({ loading: false, error: err instanceof Error ? err.message : 'Unknown error' });
        }
      },

      triggerInterviewComplete: async () => {
        // Simulate real-time data updates after interview
        setShimoStatusTransient(set, 'updating_memory');

        setTimeout(() => {
          set((s) => ({
            metrics: {
              ...s.metrics,
              longTermMemories: s.metrics.longTermMemories + 1,
              growthValue: s.metrics.growthValue + 2,
              weeklyGrowthPercent: s.metrics.weeklyGrowthPercent + 1,
              understandingPercent: Math.min(100, s.metrics.understandingPercent + 1),
            },
            shimoCore: {
              ...s.shimoCore,
              status: 'updating_tree',
              understanding: Math.min(100, s.shimoCore.understanding + 1),
            },
            timeline: [
              {
                id: `tl-${Date.now()}`,
                date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace('/', '-'),
                title: '完成 AI 访谈',
                detail: '长期记忆 +1，生命树成长',
                type: 'memory' as const,
              },
              ...s.timeline,
            ],
          }));
        }, 800);

        setTimeout(() => {
          set((s) => ({ shimoCore: { ...s.shimoCore, status: 'online' } }));
        }, 2000);
      },

      triggerSkillLearn: async (skillId: string) => {
        setShimoStatusTransient(set, 'learning');

        try {
          const result = await apiClient.post<{
            id: string;
            name: string;
            level: number;
            status: string;
            progress: number;
            message: string;
          }>(`family-hub/skills/${skillId}/learn`);

          if (result) {
            set((s) => ({
              skills: s.skills.map((sk) =>
                sk.id === skillId
                  ? {
                      ...sk,
                      status: result.status as SkillProgress['status'],
                      level: result.level,
                      progress: result.progress,
                    }
                  : sk,
              ),
              metrics: result.status === 'mastered'
                ? { ...s.metrics, masteredSkills: s.metrics.masteredSkills + 1, newAbilities: s.metrics.newAbilities + 1, growthValue: s.metrics.growthValue + 5 }
                : s.metrics,
              shimoCore: { ...s.shimoCore, status: 'online' },
            }));
          }
        } catch {
          // Fallback to local simulation if API fails
          setTimeout(() => {
            set((s) => ({
              skills: s.skills.map((sk) =>
                sk.id === skillId
                  ? { ...sk, status: 'updated' as const, level: sk.level + 1, progress: 100 }
                  : sk,
              ),
              metrics: {
                ...s.metrics,
                masteredSkills: s.metrics.masteredSkills + 1,
                newAbilities: s.metrics.newAbilities + 1,
                growthValue: s.metrics.growthValue + 5,
              },
              shimoCore: { ...s.shimoCore, status: 'online' },
            }));
          }, 1500);
        }
      },

      invokeAgent: async (agentCode: string, message: string) => {
        // Optimistically set agent to thinking
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === agentCode ? { ...a, status: 'thinking' as const } : a,
          ),
        }));

        try {
          const result = await apiClient.post<{
            success: boolean;
            agentName: string;
            agentCode: string;
            response: string;
            tokensUsed: number;
            model: string;
          }>(`family-hub/agents/${agentCode}/invoke`, { message });

          // Update agent status back to running and increment calls
          set((s) => ({
            agents: s.agents.map((a) =>
              a.id === agentCode
                ? { ...a, status: 'running' as const, calls: a.calls + 1, lastActive: '刚刚' }
                : a,
            ),
          }));

          return result || {
            success: false,
            response: 'Agent 响应失败',
            agentName: agentCode,
            tokensUsed: 0,
            model: '',
          };
        } catch (err) {
          // Reset agent status on error
          set((s) => ({
            agents: s.agents.map((a) =>
              a.id === agentCode ? { ...a, status: 'idle' as const } : a,
            ),
          }));

          return {
            success: false,
            response: `调用失败：${err instanceof Error ? err.message : '请检查后端服务和 API Key 配置'}`,
            agentName: agentCode,
            tokensUsed: 0,
            model: '',
          };
        }
      },

      updateAgentStatus: (agentId: string, status: AgentStatus) => {
        set((s) => ({
          agents: s.agents.map((a) => (a.id === agentId ? { ...a, status } : a)),
        }));
      },

      setShimoStatus: (status: ShimoStatus) => {
        set((s) => ({ shimoCore: { ...s.shimoCore, status } }));
      },

      callMCPTool: async (tool: string, params: Record<string, unknown>) => {
        const callId = `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        set((s) => ({
          mcpCalls: [
            ...s.mcpCalls,
            { id: callId, tool, params, status: 'calling' as const, timestamp: Date.now() },
          ],
        }));

        try {
          const handler = MCP_TOOLS[tool];
          if (!handler) throw new Error(`Unknown MCP tool: ${tool}`);

          // Simulate async latency
          await new Promise((r) => setTimeout(r, 300));
          const result = handler(params, get());

          set((s) => ({
            mcpCalls: s.mcpCalls.map((c) =>
              c.id === callId ? { ...c, result, status: 'success' as const } : c,
            ),
          }));

          return result;
        } catch (err) {
          set((s) => ({
            mcpCalls: s.mcpCalls.map((c) =>
              c.id === callId ? { ...c, status: 'error' as const, result: err } : c,
            ),
          }));
          throw err;
        }
      },

      clearMCPCalls: () => set({ mcpCalls: [] }),
    }),
    {
      name: 'suiyan-family-hub',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        metrics: s.metrics,
        shimoCore: s.shimoCore,
        agents: s.agents,
        skills: s.skills,
        timeline: s.timeline,
        devices: s.devices,
        familyStatus: s.familyStatus,
        lastSync: s.lastSync,
      }),
    },
  ),
);

/* ── Helper: transient status with auto-recovery ── */
function setShimoStatusTransient(
  set: (fn: (s: FamilyHubState) => Partial<FamilyHubState>) => void,
  status: ShimoStatus,
) {
  set((s) => ({ shimoCore: { ...s.shimoCore, status } }));
}
