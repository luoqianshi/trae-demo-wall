import type { Expert, GroupMessage, TaskCard, ScheduleResult, ToolResult } from './types';

// ========== 路由上下文（打包发给路由器的数据） ==========

export interface ScheduleContext {
  idea: string;
  stage: string;
  experts: Expert[];
  tasks: TaskCard[];
  recentMessages: GroupMessage[];
  bossInput: string;
  quotedContext?: string;
  mentionTargetId?: string;
  lastToolResults?: ToolResult[];
  round: number;
}

// ========== 工具描述表（删掉 answer——路由器直接 routeTo 即可） ==========

function getToolDescriptions(): string {
  return `你可以调用以下工具（零个或多个）。每个工具写了"何时用/何时不用"，严格按此判断。

1. proceed
   参数：无
   效果：放行当前停顿点，推进到下一阶段
   何时用：老板明确同意推进（"就这么干""继续""出报告吧""可以了"）
   何时用：clarifying 阶段，老板补充完信息或确认理解后（"给老人用的，开干吧""就这么干"）→ proceed 进立项
   注意：老板一条消息可能既是回答 PM 问题又是放行，此时 routeTo PM 接话确认理解 + 同时调 proceed
   何时不用：老板还在质疑或要调整

2. update_plan
   参数：{ "feedback": "老板对分工的调整意见" }
   效果：重排分工，出新方案卡，回等批示
   何时用：老板对分工有意见（"加个人""这块换个方向""分工不合理"）
   何时不用：老板只是问问题没要求改

3. update_premise
   参数：{ "newPremise": "修正后的项目想法全文" }
   效果：更新顶栏想法，标所有任务需复核，回等批示
   何时用：老板纠正了想法本身（"不是录音是录屏""不是2C是2B"）
   何时不用：老板只是补充细节不是纠正方向

4. assign_research
   参数：{ "expertId": "成员id", "direction": "调研方向" }
   效果：给成员派新调研任务
   何时用：老板让某人再去查某个东西（"你再查查XX""去了解一下YY"）
   何时不用：老板是质疑已有结论（用 reexamine）

5. reexamine
   参数：{ "expertId": "成员id", "challengedConclusion": "被质疑的结论", "challengePoint": "质疑点" }
   效果：基于证据复核，有新证据才许改口（抗迎合硬校验）
   何时用：老板质疑某成员的具体结论（"你这结论不对""我听说有XX方案"）
   何时不用：老板只是问依据不要求重查（routeTo 让成员自己解释）

6. pause_work
   参数：无
   效果：当前步骤后暂停所有任务
   何时用：老板喊停（"先停一下""等等""先别干了"）
   何时不用：老板只是插话不是要停

7. resume_work
   参数：无
   效果：恢复暂停的任务
   何时用：老板说继续（"继续吧""接着干"）
   何时不用：任务没在暂停状态

8. refresh_report
   参数：无
   效果：刷新报告版本
   何时用：追问导致结论变化后（"把汇报更新一下""重新出报告"）
   何时不用：没有结论变化`;
}

// ========== 路由器 prompt 构造（不再生成 speech，只决定谁接话） ==========

export function getSchedulePrompt(ctx: ScheduleContext): string {
  const leader = ctx.experts.find(e => e.title.includes('产品')) || ctx.experts[0];

  const expertsList = ctx.experts.map(e =>
    `${e.id} | ${e.name} | ${e.title} | ${e.focusArea} | 方法论：${e.methodologySource}`
  ).join('\n');

  const tasksList = ctx.tasks.map(t => {
    const expert = ctx.experts.find(e => e.id === t.expertId);
    return `- ${t.title} | 状态：${t.status} | 负责人：${expert?.name || '未分配'} | 类型：${t.type}`;
  }).join('\n');

  const messagesList = ctx.recentMessages.map(m => {
    const author = m.authorId === 'boss' ? '老板' : ctx.experts.find(e => e.id === m.authorId)?.name || '系统';
    return `${author}：${m.content}`;
  }).join('\n');

  const mentionTarget = ctx.mentionTargetId
    ? ctx.experts.find(e => e.id === ctx.mentionTargetId)?.name || ctx.mentionTargetId
    : null;

  const toolResultsSection = ctx.lastToolResults && ctx.lastToolResults.length > 0
    ? `\n【上一轮工具执行结果】\n${ctx.lastToolResults.map((r, i) =>
        `${i + 1}. ${r.summary || r.error || '（无摘要）'}`
      ).join('\n')}\n请基于结果决定下一步。\n`
    : '';

  return `你是产品团队的路由器。老板刚在工作群里发了一句话，你要决定由谁接话、要不要调工具。

【铁律】
1. 你不替成员说话——你只决定"这话该谁接"，由成员自己用自己的腔调回复
2. routeTo 是成员 id 数组（通常 1 人，最多 2 人串行接话）
3. 工具调用要有依据，不要乱调
4. 老板@了某人 → routeTo 必须包含该人
5. 老板问一般性问题（没@） → routeTo 组长（${leader?.name || '产品负责人'}）
6. 老板明确要行动（重查/改分工/喊停/出报告）→ 调对应工具，routeTo 可为空
7. 只调工具不 routeTo 也是允许的（纯行动）

【项目背景】
想法：${ctx.idea}
当前阶段：${ctx.stage}

【团队成员】
${expertsList}

【任务列表】
${tasksList || '（无任务）'}

【最近群消息】
${messagesList || '（无消息）'}

【老板这句话（原文）】
${ctx.bossInput}
${ctx.quotedContext ? `\n【老板引用的原文】\n${ctx.quotedContext}\n` : ''}
${mentionTarget ? `【老板@了】${mentionTarget}\n` : ''}${toolResultsSection}
【你可以调用的工具】
${getToolDescriptions()}

【返回格式】
返回 JSON：
{
  "routeTo": ["成员id"],
  "reason": "为什么让他接（一句话）",
  "toolCalls": [{ "tool": "工具名", "args": {} }]
}

- routeTo 可为空数组（纯工具调用）
- toolCalls 可为空数组（只让成员接话）
- 成员 id 必须是上面团队成员列表里的 id
- 组长是 ${leader?.name || '产品负责人'}（${leader?.id || ''}）

只返回 JSON。`;
}

// ========== 解析路由器返回 ==========

export function parseScheduleResult(text: string): ScheduleResult {
  const json = extractJson(text);
  const routeTo = Array.isArray(json.routeTo)
    ? json.routeTo.map((id: any) => String(id || '')).filter((s: string) => s)
    : [];
  const reason = String(json.reason || '');
  const toolCalls = Array.isArray(json.toolCalls)
    ? json.toolCalls.map((tc: any) => ({
        tool: String(tc.tool || ''),
        args: tc.args && typeof tc.args === 'object' ? tc.args : {},
      }))
    : [];
  return { routeTo, reason, toolCalls };
}

// 从 LLM 输出中提取第一个完整 JSON 对象（括号匹配，跟踪字符串状态和转义）
function extractJson(text: string): any {
  const start = text.indexOf('{');
  if (start === -1) throw new Error('路由器返回中未找到 JSON');

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else {
      if (ch === '"') {
        inString = true;
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const jsonStr = text.slice(start, i + 1);
          return JSON.parse(jsonStr);
        }
      }
    }
  }

  throw new Error('路由器返回的 JSON 不完整');
}
