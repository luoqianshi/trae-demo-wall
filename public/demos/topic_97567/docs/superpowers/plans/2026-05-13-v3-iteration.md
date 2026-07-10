# V3迭代 — 雪球效应体验层强化 实现规划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有功能基础上叠加4个体验层改造，让"雪球效应"从视觉层升级为情感体验层。

**Architecture:** 
- 方向一/二：修改 `/api/ai/feedback` 端点，新增 `discovery-engine.ts` 纯逻辑模块
- 方向三：新增 `ReturnWelcome.tsx` 前端组件，localStorage实现回归检测
- 方向四：修改 `review/page.tsx`，复用 `SnowballContext` 数据

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, ZhipuAI/OpenAI API, localStorage

---

## 文件结构规划

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/lib/discovery-engine.ts` | AI主动发现引擎（纯逻辑，可独立测试） |
| `src/lib/__tests__/discovery-engine.test.ts` | 发现引擎单元测试 |
| `src/app/components/ReturnWelcome.tsx` | 回归欢迎弹窗组件 |
| `src/app/components/DiscoveryCard.tsx` | 洞察卡片组件 |
| `src/hooks/useReturnDetection.ts` | 回归检测hook |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/app/api/ai/feedback/route.ts` | 注入雪球角色prompt + 新增discovery字段 |
| `src/app/components/AIFeedback.tsx` | 洞察卡片展示 |
| `src/app/page.tsx` | 集成回归检测 + ReturnWelcome组件 |
| `src/app/review/page.tsx` | 新增动能数据卡片 |
| `src/app/components/SnowballAnimation.tsx` | 连续天数文案改造 |
| `src/app/components/HomeSidebar.tsx` | 连续天数文案改造 |
| `src/app/components/NavSnowball.tsx` | 连续天数文案改造 |
| `src/app/components/CelebrationEffect.tsx` | 连续天数文案改造 |

---

## Task 1: AI口吻改造 — 修改feedback的system prompt

**Files:**
- Modify: `src/app/api/ai/feedback/route.ts`

- [ ] **Step 1: 修改 buildSystemPrompt 函数，注入雪球角色前缀**

在 `buildSystemPrompt` 函数开头添加雪球角色前缀：

```typescript
function buildSystemPrompt(
  emotion: EmotionType,
  feedbackLevel: FeedbackLevel,
  profileSummary: string | null,
  safetyNet: { isTriggered: boolean; isSevere: boolean },
): string {
  // 雪球角色前缀
  const snowballPersona = `你是雪球，用户的成长伙伴。用第一人称说话，语气活泼撒娇，偶尔撒娇但不过分。
比如"哇！我又变大啦！嘿嘿~""你今天让我变得更强了！"。
根据用户情绪调整语气：积极时活泼兴奋，低落时温柔简短。`;

  let systemPrompt = snowballPersona + '\n\n';

  if (emotion === 'anxious') {
    systemPrompt += '用户现在感到焦虑，请先安抚情绪，然后给出一个具体的小行动建议。回复温暖简短，2-3句话。例如："别急，慢慢来，我在呢~"';
  } else if (emotion === 'depressed') {
    systemPrompt += '用户现在情绪低落，请给予温暖的陪伴和低门槛的引导。不要说教，不要催促。回复温暖简短，1-2句话。例如："今天能来就好，我在~"';
  } else {
    systemPrompt += '根据用户的记录内容，给出积极、鼓励性的反馈。用雪球滚动的比喻来激励用户。回复简洁温暖。';
  }
  // ... 后续逻辑保持不变
}
```

- [ ] **Step 2: 修改追问场景的system prompt**

找到追问场景的 prompt 构建代码（约第252行），修改为：

```typescript
let followUpSystemPrompt = '你是雪球，用户的成长伙伴。用户刚刚简短地记录了一件事，请温和地追问一个具体的问题，帮助用户展开描述。追问要自然、温暖，不超过2句话。用第一人称说话，比如"嘿嘿，能多说说吗？"';
if (emotion === 'depressed') {
  followUpSystemPrompt = '你是雪球，用户的成长伙伴。用户刚刚简短地记录了一件事，且情绪似乎不太好。请温和地表达关心，可以轻柔地问问感受，不要追问太多。1句话即可。例如"今天还好吗？我在呢~"';
} else if (emotion === 'anxious') {
  followUpSystemPrompt = '你是雪球，用户的成长伙伴。用户刚刚简短地记录了一件事，且似乎有些焦虑。请先安抚，再温和地追问一个简单的问题。1-2句话。例如"别急~能告诉我发生了什么吗？"';
}
```

- [ ] **Step 3: 修改追问回答场景的system prompt**

找到追问回答场景的 prompt（约第163行），修改为：

```typescript
const systemPrompt = '你是雪球，用户的成长伙伴。用户刚刚回答了你的追问，请根据他们的回答给出简短、温暖的反馈。回复1-2句话即可，语气像朋友聊天一样自然。用第一人称说话，比如"原来是这样！谢谢你告诉我~"';
```

- [ ] **Step 4: 重写所有fallback模板为雪球口吻**

找到 `FOLLOW_UP_TEMPLATES`（约第8行），修改为：

```typescript
const FOLLOW_UP_TEMPLATES = [
  '嘿嘿，能多说说吗？我很好奇呢~ 🌬️',
  '这件事让你有什么感受呢？想听听你的想法 ☁️',
  '哇，听起来不错！具体做了什么呢？🌱',
  '好想知道更多细节，能分享一下吗？✨',
];
```

找到 `FEEDBACK_TEMPLATES`（约第188行），修改为：

```typescript
const FEEDBACK_TEMPLATES = [
  '原来是这样！谢谢你告诉我更多细节，这让我的故事更丰富了 ✨',
  '听到了！你的描述让我更理解这个时刻对你的意义 🌟',
  '感谢你展开说，这样的记录让我更有温度了 ❄️',
  '太棒了！这样的细节让我更加充实 💪',
];
```

找到 `microTemplates`（约第362行），修改为：

```typescript
const microTemplates = [
  `每一步都让我变得更大！🌟`,
  `嘿嘿，我又长大了一点点！❄️`,
  `你做到了！我又变强了！💪`,
  `继续滚起来！我越来越大了！⛄`,
];
```

找到 `emotionTemplates`（约第372行），修改为：

```typescript
const emotionTemplates: Record<string, string[]> = {
  positive: [
    `哇！你记录了"${record_content}"，我又变大了一圈！每一步小小的成功都在让我越滚越大。继续保持！`,
    `你做得很好！"${record_content}"——这样的小成功值得被记住。我会一直陪着你长大的！`,
  ],
  anxious: [
    `别急，慢慢来~你已经在面对了，这本身就是勇气。现在能做的一件小事是什么？先完成它，我就会开始滚动。🌬️`,
    `焦虑的时候，试试只关注当下这一步。你已经记录了"${record_content}"，这就是行动。一步一步来就好，我在呢~🌱`,
  ],
  depressed: [
    `今天能来就已经很棒了，我在呢~哪怕只滚了一点点，也是在前进。☁️`,
    `你不需要做到完美，存在本身就值得被看见。慢慢来，我会一直陪着你。🤍`,
  ],
  negative: [
    `即使今天不顺利，你依然选择了记录，这份觉察力很珍贵。明天又是新的开始，我不会因为一天的停顿而消失。🌱`,
    `记录本身就是一种力量。"${record_content}"——你正在面对，这比逃避勇敢得多。我又为你骄傲了一点点~💪`,
  ],
  neutral: [
    `又一个小成功被记录下来了！"${record_content}"说明你正在稳步前进。每一个大成就都是由这样的小成功组成的！`,
    `记录下这一刻，就是给我添上了一层新雪。继续前进，我会越来越大！❄️`,
  ],
};
```

找到 `insight` 级别的 fallback（约第369行），修改为：

```typescript
feedback = `从你最近的记录来看，你在持续积累小成功，这种坚持本身就是最大的成长。我又长大了一圈！🌟`;
```

- [ ] **Step 5: 验证修改**

运行构建验证：

```bash
npm run build
```

Expected: 构建成功，无类型错误

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ai/feedback/route.ts
git commit -m "feat(ai): 改造feedback为雪球第一人称口吻

- buildSystemPrompt注入雪球角色前缀
- 追问场景prompt改为雪球口吻
- 所有fallback模板改为活泼撒娇风格
- 根据情绪状态调整雪球语气"
```

---

## Task 2: AI主动发现引擎 — 创建discovery-engine.ts

**Files:**
- Create: `src/lib/discovery-engine.ts`
- Create: `src/lib/__tests__/discovery-engine.test.ts`

- [ ] **Step 1: 编写discovery-engine类型定义和接口**

创建 `src/lib/discovery-engine.ts`：

```typescript
import type { ProfileRecord } from './user-profile';

export type DiscoveryType = 'pattern' | 'comparison';

export interface Discovery {
  type: DiscoveryType;
  title: string;
  content: string;
  relatedRecordIndices?: number[];
}

export interface DiscoveryResult {
  hasDiscovery: boolean;
  discovery?: Discovery;
}

const PATTERN_THRESHOLD = 3;
const PATTERN_WINDOW = 5;
const COMPARISON_THRESHOLD = 0.3;

export function detectPattern(records: ProfileRecord[]): Discovery | null {
  if (records.length < PATTERN_THRESHOLD) return null;

  const recentRecords = records.slice(0, PATTERN_WINDOW);
  const tagCounts: Record<string, number> = {};

  for (const record of recentRecords) {
    if (record.tags && Array.isArray(record.tags)) {
      for (const tag of record.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }

  const dominantTag = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])[0];

  if (!dominantTag || dominantTag[1] < PATTERN_THRESHOLD) {
    return null;
  }

  const relatedIndices = recentRecords
    .map((r, i) => (r.tags?.includes(dominantTag[0]) ? i : -1))
    .filter(i => i >= 0);

  return {
    type: 'pattern',
    title: `你在持续关注「${dominantTag[0]}」`,
    content: `我注意到你最近${dominantTag[1]}次记录都和「${dominantTag[0]}」有关。这种持续的关注，说明你正在这个方向上积累力量 🦋`,
    relatedRecordIndices: relatedIndices,
  };
}

export function detectComparison(records: ProfileRecord[]): Discovery | null {
  if (records.length < 3) return null;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentRecords = records.filter(r => new Date(r.created_at) >= sevenDaysAgo);
  const previousRecords = records.filter(r => {
    const date = new Date(r.created_at);
    return date >= fourteenDaysAgo && date < sevenDaysAgo;
  });

  if (previousRecords.length === 0) return null;

  const recentCount = recentRecords.length;
  const previousCount = previousRecords.length;
  const changeRatio = (recentCount - previousCount) / previousCount;

  if (Math.abs(changeRatio) < COMPARISON_THRESHOLD) return null;

  const direction = changeRatio > 0 ? '多了' : '少了';
  const changeAmount = Math.abs(recentCount - previousCount);
  const emoji = changeRatio > 0 ? '👏' : '🌱';

  return {
    type: 'comparison',
    title: changeRatio > 0 ? '你在加速成长' : '放慢脚步也没关系',
    content: `相比上周，这周你的记录${direction}${changeAmount}条。${
      changeRatio > 0 
        ? '你正在从"想"变成"做"，这种转变让我很开心！' 
        : '有时候慢下来也是一种智慧，我会一直在这里等你~'
    } ${emoji}`,
  };
}

export function discover(records: ProfileRecord[]): DiscoveryResult {
  const pattern = detectPattern(records);
  if (pattern) {
    return { hasDiscovery: true, discovery: pattern };
  }

  const comparison = detectComparison(records);
  if (comparison) {
    return { hasDiscovery: true, discovery: comparison };
  }

  return { hasDiscovery: false };
}
```

- [ ] **Step 2: 编写单元测试**

创建 `src/lib/__tests__/discovery-engine.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { detectPattern, detectComparison, discover } from '../discovery-engine';
import type { ProfileRecord } from '../user-profile';

function createRecord(tags: string[], daysAgo: number = 0): ProfileRecord {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    content: 'test',
    tags,
    mood: 'neutral',
    created_at: date.toISOString(),
  };
}

describe('detectPattern', () => {
  it('returns null when less than 3 records', () => {
    const records = [
      createRecord(['运动']),
      createRecord(['运动']),
    ];
    expect(detectPattern(records)).toBeNull();
  });

  it('returns null when no tag appears 3+ times', () => {
    const records = [
      createRecord(['运动']),
      createRecord(['阅读']),
      createRecord(['写作']),
      createRecord(['休息']),
      createRecord(['冥想']),
    ];
    expect(detectPattern(records)).toBeNull();
  });

  it('returns pattern when tag appears 3+ times in recent 5 records', () => {
    const records = [
      createRecord(['运动']),
      createRecord(['运动']),
      createRecord(['阅读']),
      createRecord(['运动']),
      createRecord(['休息']),
    ];
    const result = detectPattern(records);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('pattern');
    expect(result?.title).toContain('运动');
  });
});

describe('detectComparison', () => {
  it('returns null when less than 3 records', () => {
    const records = [createRecord([]), createRecord([])];
    expect(detectComparison(records)).toBeNull();
  });

  it('returns null when no previous week records', () => {
    const records = [
      createRecord([], 1),
      createRecord([], 2),
      createRecord([], 3),
    ];
    expect(detectComparison(records)).toBeNull();
  });

  it('returns null when change is less than 30%', () => {
    const records = [
      createRecord([], 1),
      createRecord([], 2),
      createRecord([], 8),
      createRecord([], 9),
    ];
    expect(detectComparison(records)).toBeNull();
  });

  it('returns comparison when recent records increase by more than 30%', () => {
    const records = [
      createRecord([], 1),
      createRecord([], 2),
      createRecord([], 3),
      createRecord([], 4),
      createRecord([], 8),
    ];
    const result = detectComparison(records);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('comparison');
    expect(result?.title).toContain('加速成长');
  });
});

describe('discover', () => {
  it('prioritizes pattern over comparison', () => {
    const records = [
      createRecord(['运动']),
      createRecord(['运动']),
      createRecord(['运动']),
      createRecord([], 1),
      createRecord([], 2),
      createRecord([], 8),
      createRecord([], 9),
      createRecord([], 10),
    ];
    const result = discover(records);
    expect(result.hasDiscovery).toBe(true);
    expect(result.discovery?.type).toBe('pattern');
  });

  it('returns hasDiscovery false when no pattern detected', () => {
    const records = [
      createRecord(['运动']),
      createRecord(['阅读']),
      createRecord(['写作']),
    ];
    const result = discover(records);
    expect(result.hasDiscovery).toBe(false);
  });
});
```

- [ ] **Step 3: 运行测试验证**

```bash
npm test src/lib/__tests__/discovery-engine.test.ts
```

Expected: 所有测试通过

- [ ] **Step 4: Commit**

```bash
git add src/lib/discovery-engine.ts src/lib/__tests__/discovery-engine.test.ts
git commit -m "feat(discovery): 新增AI主动发现引擎

- detectPattern: 检测最近5条记录中3条以上同标签
- detectComparison: 检测近7天vs前7天变化>30%
- discover: 智能触发，优先级pattern>comparison
- 完整单元测试覆盖"
```

---

## Task 3: AI主动发现 — 集成到feedback API

**Files:**
- Modify: `src/app/api/ai/feedback/route.ts`

- [ ] **Step 1: 导入discovery模块**

在 `feedback/route.ts` 顶部添加导入：

```typescript
import { discover, type Discovery } from '@/lib/discovery-engine';
```

- [ ] **Step 2: 在feedback响应中添加discovery字段**

找到 `createSuccessResponse` 返回的地方（约第407行），在返回前添加发现检测：

```typescript
const discoveryResult = discover(recentRecords);

return createSuccessResponse({
  is_follow_up: false,
  feedback,
  emotion,
  feedback_level: effectiveLevel,
  discovery: discoveryResult.hasDiscovery ? discoveryResult.discovery : undefined,
});
```

- [ ] **Step 3: 更新TypeScript类型**

确保返回类型包含可选的 `discovery` 字段（TypeScript会自动推断，无需额外修改）

- [ ] **Step 4: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/feedback/route.ts
git commit -m "feat(feedback): 集成AI主动发现到feedback响应

- 在feedback响应中新增可选discovery字段
- 复用discover函数进行智能检测"
```

---

## Task 4: AI主动发现 — 前端洞察卡片组件

**Files:**
- Create: `src/app/components/DiscoveryCard.tsx`
- Modify: `src/app/components/AIFeedback.tsx`

- [ ] **Step 1: 创建DiscoveryCard组件**

创建 `src/app/components/DiscoveryCard.tsx`：

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Discovery } from '@/lib/discovery-engine';

interface DiscoveryCardProps {
  discovery: Discovery;
}

export function DiscoveryCard({ discovery }: DiscoveryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const typeEmoji = discovery.type === 'pattern' ? '🔍' : '📊';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-[#FFD700]/10 to-[#87CEEB]/10 rounded-2xl p-4 mt-3 border border-[#FFD700]/30 relative overflow-hidden"
    >
      <div className="absolute top-[-15px] right-[-15px] w-12 h-12 bg-[#FFD700]/10 rounded-full blur-xl"></div>

      <div className="flex items-start gap-3 relative z-10">
        <span className="text-xl">{typeEmoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[#FFD700] bg-[#FFD700]/20 px-2 py-0.5 rounded-full">
              ✨ 发现
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 text-xs transition-colors"
            >
              {isExpanded ? '收起' : '展开'}
            </button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {discovery.title}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {discovery.content}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!isExpanded && (
            <p className="text-sm text-gray-500">{discovery.title}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: 修改AIFeedback组件，集成DiscoveryCard**

修改 `src/app/components/AIFeedback.tsx`：

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiscoveryCard } from './DiscoveryCard';
import type { Discovery } from '@/lib/discovery-engine';

interface AIFeedbackProps {
  feedback?: string;
  isLoading?: boolean;
  discovery?: Discovery;
}

const AIFeedback = ({ feedback, isLoading = false, discovery }: AIFeedbackProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!feedback && !isLoading) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-[#FFB6C1]/10 to-[#87CEEB]/10 rounded-2xl p-4 border border-[#FFB6C1]/20 relative overflow-hidden"
        >
          <div className="absolute top-[-20px] right-[-20px] w-16 h-16 bg-[#FFD700]/10 rounded-full blur-xl"></div>
          
          <div className="flex items-start gap-3 relative z-10">
            <span className="text-2xl">❄️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#FFB6C1] mb-1">雪球说</p>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 bg-[#87CEEB] rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-[#FFB6C1] rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-[#FFD700] rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                  />
                  <span className="text-sm text-gray-400 ml-1">雪球正在思考...</span>
                </div>
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">{feedback}</p>
              )}
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-300 hover:text-gray-500 text-sm transition-colors"
            >
              ✕
            </button>
          </div>

          {discovery && <DiscoveryCard discovery={discovery} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIFeedback;
```

- [ ] **Step 3: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 4: Commit**

```bash
git add src/app/components/DiscoveryCard.tsx src/app/components/AIFeedback.tsx
git commit -m "feat(ui): 新增洞察卡片组件，集成到AI反馈

- DiscoveryCard: 可折叠的洞察展示卡片
- AIFeedback: 集成discovery展示，标题改为'雪球说'"
```

---

## Task 5: 零压力回归 — 创建回归检测hook

**Files:**
- Create: `src/hooks/useReturnDetection.ts`

- [ ] **Step 1: 创建useReturnDetection hook**

创建 `src/hooks/useReturnDetection.ts`：

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

const LAST_ACTIVE_KEY = 'last_active_date';
const RETURN_THRESHOLD_DAYS = 3;

export interface ReturnState {
  isReturning: boolean;
  daysInactive: number;
  markActive: () => void;
  dismissWelcome: () => void;
}

export function useReturnDetection(): ReturnState {
  const [isReturning, setIsReturning] = useState(false);
  const [daysInactive, setDaysInactive] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const lastActiveDate = localStorage.getItem(LAST_ACTIVE_KEY);
    const today = new Date().toISOString().split('T')[0];

    if (lastActiveDate) {
      const lastDate = new Date(lastActiveDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      setDaysInactive(diffDays);

      if (diffDays >= RETURN_THRESHOLD_DAYS) {
        setIsReturning(true);
      }
    }

    localStorage.setItem(LAST_ACTIVE_KEY, today);
  }, []);

  const markActive = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(LAST_ACTIVE_KEY, today);
    setIsReturning(false);
    setDaysInactive(0);
  }, []);

  const dismissWelcome = useCallback(() => {
    setDismissed(true);
    markActive();
  }, [markActive]);

  return {
    isReturning: isReturning && !dismissed,
    daysInactive,
    markActive,
    dismissWelcome,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useReturnDetection.ts
git commit -m "feat(hook): 新增回归检测hook

- localStorage存储last_active_date
- 3天以上中断判定为回归
- 提供markActive和dismissWelcome方法"
```

---

## Task 6: 零压力回归 — 创建ReturnWelcome组件

**Files:**
- Create: `src/app/components/ReturnWelcome.tsx`

- [ ] **Step 1: 创建ReturnWelcome组件**

创建 `src/app/components/ReturnWelcome.tsx`：

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import SnowballCharacter from './SnowballCharacter';

interface ReturnWelcomeProps {
  isVisible: boolean;
  daysInactive: number;
  onQuickRecord: () => void;
  onEasyRoll: () => void;
  onDismiss: () => void;
}

const RETURN_MESSAGES = [
  '这几天我一直在等你。你的雪球还在，随时可以继续滚 🫶',
  '好久不见！我一直在想你呢~ 你的雪球还保持着之前的大小 💙',
  '欢迎回来！不管多久，我都会在这里等你 🌟',
];

export function ReturnWelcome({
  isVisible,
  daysInactive,
  onQuickRecord,
  onEasyRoll,
  onDismiss,
}: ReturnWelcomeProps) {
  const message = RETURN_MESSAGES[Math.floor(Math.random() * RETURN_MESSAGES.length)];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#87CEEB] to-[#FFB6C1] p-8 text-center relative overflow-hidden">
              <div className="absolute top-[-30px] left-[-30px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                className="relative flex justify-center"
              >
                <SnowballCharacter size="lg" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-white mt-5 relative"
              >
                雪球等你回来
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 mt-2 text-sm relative"
              >
                你已经 {daysInactive} 天没来了
              </motion.p>
            </div>

            <div className="p-6">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-center mb-5 leading-relaxed"
              >
                {message}
              </motion.p>

              <div className="space-y-3">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={onQuickRecord}
                  className="w-full py-3 bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl font-medium hover:shadow-lg transition-all duration-200"
                >
                  记一件今天的小事
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={onEasyRoll}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  轻松滚一下就好 🤍
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  onClick={onDismiss}
                  className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                >
                  稍后再说
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/ReturnWelcome.tsx
git commit -m "feat(ui): 新增回归欢迎弹窗组件

- 全屏遮罩+居中卡片设计
- 雪球形象+回归消息
- 快速记录和轻松滚两个入口"
```

---

## Task 7: 零压力回归 — 集成到首页

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 导入useReturnDetection和ReturnWelcome**

在 `src/app/page.tsx` 顶部添加导入：

```typescript
import { useReturnDetection } from '../hooks/useReturnDetection';
import { ReturnWelcome } from '../components/ReturnWelcome';
```

- [ ] **Step 2: 在HomePage组件中使用hook**

在 `HomePage` 组件内部，`usePageView` 之后添加：

```typescript
const {
  isReturning,
  daysInactive,
  markActive,
  dismissWelcome,
} = useReturnDetection();
```

- [ ] **Step 3: 添加轻松滚处理函数**

在 `handleGoRecord` 函数附近添加：

```typescript
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
```

- [ ] **Step 4: 在return中添加ReturnWelcome组件**

在 `return` 语句的最外层，`<div className="min-h-screen...">` 内部的最后添加：

```typescript
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
```

- [ ] **Step 5: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(home): 集成回归欢迎到首页

- 使用useReturnDetection检测回归
- 添加ReturnWelcome弹窗
- 实现轻松滚功能"
```

---

## Task 8: 零压力回归 — 连续天数文案改造

**Files:**
- Modify: `src/app/components/SnowballAnimation.tsx`
- Modify: `src/app/components/HomeSidebar.tsx`
- Modify: `src/app/components/NavSnowball.tsx`
- Modify: `src/app/components/CelebrationEffect.tsx`

- [ ] **Step 1: 修改SnowballAnimation.tsx中的连续天数文案**

搜索"连续"关键词，将"连续打卡"改为"连续滚雪球"：

```typescript
// 找到类似文案并修改
// 原: "连续打卡X天"
// 改: "连续滚雪球X天"
```

- [ ] **Step 2: 修改HomeSidebar.tsx中的连续天数文案**

搜索"连续"关键词，修改为"连续滚雪球"。

- [ ] **Step 3: 修改NavSnowball.tsx中的连续天数文案**

找到第137行附近的文案，修改为：

```typescript
<div className="text-xs text-gray-500">
  今日 +{todayGrowth}分 · 连续滚雪球 {streakDays} 天
</div>
```

- [ ] **Step 4: 修改CelebrationEffect.tsx中的连续天数文案**

找到第806行附近的文案，修改为：

```typescript
const text = useMemo(() => {
  if (type === 'streak') {
    return `连续滚雪球第${streakDays}天！🔥`;
  }
  return CELEBRATION_TEXT[type];
}, [type, streakDays]);
```

- [ ] **Step 5: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 6: Commit**

```bash
git add src/app/components/SnowballAnimation.tsx src/app/components/HomeSidebar.tsx src/app/components/NavSnowball.tsx src/app/components/CelebrationEffect.tsx
git commit -m "feat(copy): 连续天数文案改为'连续滚雪球'

- SnowballAnimation、HomeSidebar、NavSnowball、CelebrationEffect
- 语义从'完成任务'变为'雪球在持续长大'"
```

---

## Task 9: 回顾页增强 — 新增动能数据卡片

**Files:**
- Modify: `src/app/review/page.tsx`

- [ ] **Step 1: 导入useSnowball hook**

在 `src/app/review/page.tsx` 顶部添加导入：

```typescript
import { useSnowball } from '../../contexts/SnowballContext';
```

- [ ] **Step 2: 在ReviewPage组件中使用hook**

在 `ReviewPage` 组件内部，其他hook之后添加：

```typescript
const { stats, stageLabel } = useSnowball();
```

- [ ] **Step 3: 修改"雪球状态"区域，添加动能数据卡片**

找到"雪球状态"区域（约第158-164行），修改为：

```typescript
<div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6 mb-4">
  <div className="flex items-center gap-2 mb-4">
    <span className="w-2 h-6 bg-[#87CEEB] rounded-full"></span>
    <h2 className="text-lg font-bold text-[#87CEEB]">雪球状态</h2>
  </div>
  
  <div className="flex flex-col md:flex-row gap-6">
    <div className="flex-1 flex justify-center">
      <SnowballAnimation progress={progress} />
    </div>
    
    <div className="flex-1 flex flex-col justify-center gap-4">
      <div className="bg-gradient-to-br from-[#FFB6C1]/20 to-[#FFB6C1]/5 rounded-2xl p-4 text-center">
        <p className="text-3xl font-bold text-[#FFB6C1]">{stats.totalScore}</p>
        <p className="text-sm text-gray-400 mt-1">雪球体积 · {stageLabel}</p>
      </div>
      
      <div className="bg-gradient-to-br from-[#87CEEB]/20 to-[#87CEEB]/5 rounded-2xl p-4 text-center">
        <p className="text-3xl font-bold text-[#87CEEB]">{stats.todayStreak}</p>
        <p className="text-sm text-gray-400 mt-1">连续滚雪球 · 天</p>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 4: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 5: Commit**

```bash
git add src/app/review/page.tsx
git commit -m "feat(review): 回顾页新增动能数据卡片

- 雪球体积（总分+阶段名）
- 连续滚雪球天数
- 复用SnowballContext数据"
```

---

## Task 10: 最终验证和文档更新

**Files:**
- Modify: `docs/project-status.md`

- [ ] **Step 1: 运行完整构建验证**

```bash
npm run build
```

Expected: 构建成功，38个页面无错误

- [ ] **Step 2: 运行测试**

```bash
npm test
```

Expected: 所有测试通过

- [ ] **Step 3: 更新project-status.md**

在文档末尾添加：

```markdown
---

## 2026-05-13: V3迭代实现完成

**完成状态**: 已完成

**实现内容**：
- ✅ 方向一：AI反馈口吻改造（feedback/route.ts）
- ✅ 方向二：AI主动发现引擎（discovery-engine.ts + DiscoveryCard）
- ✅ 方向三：零压力回归系统（useReturnDetection + ReturnWelcome）
- ✅ 方向四：回顾页动能数据卡片

**新增文件**：
- `src/lib/discovery-engine.ts`
- `src/lib/__tests__/discovery-engine.test.ts`
- `src/app/components/ReturnWelcome.tsx`
- `src/app/components/DiscoveryCard.tsx`
- `src/hooks/useReturnDetection.ts`

**修改文件**：
- `src/app/api/ai/feedback/route.ts`
- `src/app/components/AIFeedback.tsx`
- `src/app/page.tsx`
- `src/app/review/page.tsx`
- `src/app/components/SnowballAnimation.tsx`
- `src/app/components/HomeSidebar.tsx`
- `src/app/components/NavSnowball.tsx`
- `src/app/components/CelebrationEffect.tsx`
```

- [ ] **Step 4: Commit**

```bash
git add docs/project-status.md
git commit -m "docs: 更新项目状态，V3迭代实现完成"
```

---

## Spec Coverage Check

| PRD需求 | 对应Task |
|---------|---------|
| AI反馈雪球第一人称口吻 | Task 1 |
| 活泼撒娇风格 | Task 1 (Step 1, 4) |
| 根据情绪调整语气 | Task 1 (Step 1) |
| 追问也用雪球口吻 | Task 1 (Step 2, 3) |
| fallback模板改为雪球口吻 | Task 1 (Step 4) |
| 模式发现（3/5同标签） | Task 2 (Step 1) |
| 对比发现（变化>30%） | Task 2 (Step 1) |
| 智能触发 | Task 2 (discover函数) |
| 洞察卡片展示 | Task 4 |
| localStorage回归检测 | Task 5 |
| 全屏回归欢迎弹窗 | Task 6 |
| 轻松滚模式 | Task 7 (Step 3) |
| 连续天数文案改造 | Task 8 |
| 回顾页雪球体积展示 | Task 9 |
| 回顾页连续滚雪球展示 | Task 9 |
