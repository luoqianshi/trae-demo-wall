import type { UserConfig, ProjectSession, ProviderId, ProviderConfig } from './types';

const CONFIG_KEY = 'pm-agent-config';
const SESSIONS_KEY = 'pm-agent-sessions';
const PERSONA_KEY = 'pm-agent-personas';

// ========== 服务商默认值 ==========

export const PROVIDER_DEFAULTS: Record<ProviderId, ProviderConfig> = {
  deepseek: { apiKey: '', apiBaseUrl: 'https://api.deepseek.com/v1', modelName: 'deepseek-chat' },
  openai:   { apiKey: '', apiBaseUrl: 'https://api.openai.com/v1', modelName: 'gpt-4o' },
  kimi:     { apiKey: '', apiBaseUrl: 'https://api.moonshot.cn/v1', modelName: 'moonshot-v1-8k' },
  custom:   { apiKey: '', apiBaseUrl: '', modelName: '' },
};

export function createDefaultUserConfig(): UserConfig {
  return {
    activeProvider: 'deepseek',
    providers: {
      deepseek: { ...PROVIDER_DEFAULTS.deepseek },
      openai:   { ...PROVIDER_DEFAULTS.openai },
      kimi:     { ...PROVIDER_DEFAULTS.kimi },
      custom:   { ...PROVIDER_DEFAULTS.custom },
    },
    tavilyApiKey: '',
  };
}

// 根据 apiBaseUrl 推断服务商（旧数据迁移用）
function detectProviderByBaseUrl(apiBaseUrl: string): ProviderId {
  const lower = (apiBaseUrl || '').toLowerCase();
  if (lower.includes('deepseek.com')) return 'deepseek';
  if (lower.includes('openai.com')) return 'openai';
  if (lower.includes('moonshot.cn')) return 'kimi';
  return 'custom';
}

// ========== 用户配置 ==========

export function loadConfig(): UserConfig {
  const defaults = createDefaultUserConfig();
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw);

    // 旧格式：有顶层 apiKey 但没有 providers 字段 —— 迁移
    if (typeof parsed.apiKey === 'string' && !parsed.providers) {
      const providerId = detectProviderByBaseUrl(parsed.apiBaseUrl || '');
      const providers = { ...defaults.providers };
      providers[providerId] = {
        apiKey: parsed.apiKey || '',
        apiBaseUrl: parsed.apiBaseUrl || PROVIDER_DEFAULTS[providerId].apiBaseUrl,
        modelName: parsed.modelName || PROVIDER_DEFAULTS[providerId].modelName,
      };
      return {
        activeProvider: providerId,
        providers,
        tavilyApiKey: parsed.tavilyApiKey || '',
      };
    }

    // 新格式：确保四个 provider 都有，缺失的补默认
    if (parsed.providers && typeof parsed.providers === 'object') {
      const providers = { ...defaults.providers };
      for (const id of Object.keys(PROVIDER_DEFAULTS) as ProviderId[]) {
        const existing = parsed.providers[id];
        if (existing) {
          providers[id] = {
            apiKey: existing.apiKey || '',
            apiBaseUrl: existing.apiBaseUrl ?? PROVIDER_DEFAULTS[id].apiBaseUrl,
            modelName: existing.modelName ?? PROVIDER_DEFAULTS[id].modelName,
          };
        }
      }
      const activeProvider: ProviderId =
        parsed.activeProvider && parsed.activeProvider in PROVIDER_DEFAULTS
          ? parsed.activeProvider
          : 'deepseek';
      return {
        activeProvider,
        providers,
        tavilyApiKey: parsed.tavilyApiKey || '',
      };
    }
  } catch {
    // 忽略解析错误
  }
  return defaults;
}

export function saveConfig(config: UserConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// ========== 项目档案 ==========

export function loadSessions(): ProjectSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) {
      const sessions = JSON.parse(raw) as ProjectSession[];
      const seen = new Set<string>();
      return sessions
        .filter(s => s && s.tasks) // 过滤掉旧格式数据（没有 tasks 字段的 DiscussionSession）
        .filter(s => { // 去重：按 id 保留第一个（防止脏数据导致 React key 重复）
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        })
        .map(s => ({
          ...s,
          stage: s.stage || 'done', // 兜底：没有 stage 的旧 session 视为已完成
          createdAt: new Date(s.createdAt),
          groupMessages: (s.groupMessages || []).map(m => ({ ...m, createdAt: new Date(m.createdAt) })),
          bossInterruptions: (s.bossInterruptions || []).map(b => ({ ...b, createdAt: new Date(b.createdAt) })),
          reportVersions: (s.reportVersions || []).map(v => ({ ...v, createdAt: new Date(v.createdAt) })), // 兜底：旧 session 没有 reportVersions
          tasks: (s.tasks || []).map(t => {
            // 兜底：旧 ResearchResult 只有 summary+sources，补 findings:[]/dataPoints:[] 避免渲染崩
            if (t.type === 'research' && t.result) {
              const r = t.result as any;
              if (!r.findings) r.findings = [];
              if (!r.dataPoints) r.dataPoints = [];
            }
            // 兜底：旧 AnalysisResult 用 stance（看好/有条件看好/看衰），迁移到 verdict + oneLiner
            if (t.type === 'analysis' && t.result) {
              const r = t.result as any;
              if (r.stance && !r.verdict) {
                r.verdict = r.stance === '看好' ? 'pass'
                  : r.stance === '有条件看好' ? 'conditional'
                  : 'fail';
                r.oneLiner = r.oneLiner || (Array.isArray(r.findings) && r.findings[0]
                  ? String(r.findings[0]).slice(0, 15)
                  : r.stance);
                delete r.stance;
              }
              // conclusionHistory 里旧版 result 也要迁移
              if (Array.isArray(t.conclusionHistory)) {
                t.conclusionHistory.forEach(h => {
                  const hr = h?.result as any;
                  if (hr && hr.stance && !hr.verdict) {
                    hr.verdict = hr.stance === '看好' ? 'pass'
                      : hr.stance === '有条件看好' ? 'conditional'
                      : 'fail';
                    hr.oneLiner = hr.oneLiner || (Array.isArray(hr.findings) && hr.findings[0]
                      ? String(hr.findings[0]).slice(0, 15)
                      : hr.stance);
                    delete hr.stance;
                  }
                });
              }
            }
            // 兜底：activities 的 at 字段转 Date
            if (t.activities) {
              t.activities = t.activities.map(a => ({ ...a, at: new Date(a.at) }));
            }
            return t;
          }),
        }));
    }
  } catch {
    // 忽略解析错误
  }
  return [];
}

export function saveSessions(sessions: ProjectSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    // 隐私模式 / 配额满 / localStorage 被禁用时，setItem 会抛 QuotaExceededError 等
    console.warn('[storage] saveSessions 写入失败:', err);
    // 通知 UI 层显示"本地存储写入失败"提示，不阻断主流程（内存里的 session 仍可用）
    try {
      window.dispatchEvent(new CustomEvent('storage-write-failed'));
    } catch {
      // window 不存在的环境（SSR 等）忽略
    }
  }
}

export function addSession(session: ProjectSession): ProjectSession[] {
  const sessions = loadSessions();
  sessions.unshift(session);
  saveSessions(sessions);
  return sessions;
}

export function updateSession(session: ProjectSession): ProjectSession[] {
  const sessions = loadSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  saveSessions(sessions);
  return sessions;
}

export function clearSessions(): void {
  localStorage.removeItem(SESSIONS_KEY);
}

// ========== 人物卡缓存（按人名） ==========

export function loadPersonaCard(name: string): string | null {
  try {
    const raw = localStorage.getItem(PERSONA_KEY);
    if (raw) {
      const personas = JSON.parse(raw) as Record<string, string>;
      return personas[name] || null;
    }
  } catch {
    // 忽略解析错误
  }
  return null;
}

export function savePersonaCard(name: string, card: string): void {
  try {
    const raw = localStorage.getItem(PERSONA_KEY);
    const personas = raw ? JSON.parse(raw) as Record<string, string> : {};
    personas[name] = card;
    localStorage.setItem(PERSONA_KEY, JSON.stringify(personas));
  } catch {
    // 忽略解析错误
  }
}

export function clearPersonaCache(): void {
  localStorage.removeItem(PERSONA_KEY);
}
