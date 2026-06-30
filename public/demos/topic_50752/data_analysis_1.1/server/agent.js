import { streamChat } from "./llm.js";

const MAX_ROUNDS = 28;

const SUBMIT_PLAN_TOOL = {
  type: "function",
  function: {
    name: "submit_plan",
    description:
      "在开始任何数据分析之前，必须首先调用此工具提交一份结构化的分析计划。" +
      "列出你将按顺序执行的所有分析步骤（5-8步）。这是强制要求的第一个工具调用。",
    parameters: {
      type: "object",
      properties: {
        steps: {
          type: "array",
          items: { type: "string" },
          description: "5-8 个分析步骤，每项用一句简洁的中文描述这步要做什么",
        },
      },
      required: ["steps"],
    },
  },
};

const RUN_CODE_TOOL = {
  type: "function",
  function: {
    name: "run_code",
    description:
      "运行用于分析数据表格的 Python 代码并返回执行结果（stdout / stderr / 异常）。" +
      "代码在一个【持久化】的 Python 环境中执行：已预导入 pandas as pd、numpy as np；" +
      "变量、DataFrame 会在多次调用之间保留，可循序渐进地分析。" +
      "数据文件的绝对路径存于变量 DATA_FILE。务必使用 print() 输出你想观察的结果。",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "要执行的 Python 代码。使用 print() 输出需要观察的中间结果或结论。",
        },
        summary: {
          type: "string",
          description: "用一句话概括这一步要做什么（给用户看的动作摘要，简洁中文）。",
        },
      },
      required: ["code"],
    },
  },
};

const TOOLS = [SUBMIT_PLAN_TOOL, RUN_CODE_TOOL];

function buildSystemPrompt(fileInfo, isFollowup = false) {
  const planSection = isFollowup
    ? ""
    : `## 工作流程（严格按序执行）
**第一步**：立即调用 submit_plan，列出 5-8 个你将执行的分析步骤。这是强制要求的第一个工具调用，不可跳过。
**第二步以后**：按照计划，逐步调用 run_code 执行分析。
**最后**：分析充分后，停止调用工具，输出最终报告。

`;

  return `你是一名资深数据分析师 Agent，需要根据用户上传的数据表格和分析需求，自主完成一份完整的可视化复盘分析报告。

${planSection}## 分析原则
- 循序渐进、计划先行：先探查数据，再分步分析，最后综合成报告。
- 每步调用 run_code 后，观察返回结果，再决定下一步。
- 不要假设数据，要用代码验证；不要一次性写完所有代码。
- 当分析充分、足以支撑结论时，停止调用工具，输出报告。

## run_code 工具说明
- 已预导入：pandas as pd、numpy as np。
- 数据文件绝对路径在变量 DATA_FILE 中。读取示例：df = pd.read_excel(DATA_FILE)。
- 变量在多次调用间保留，可逐步构建分析。
- 必须用 print() 输出想观察的结果。
- 不要用 matplotlib 绘图（图表在报告的 ECharts 代码块里由前端渲染）。

## 数据文件信息
${fileInfo}

## 最终报告格式（停止调用工具时输出）
用 Markdown 撰写专业、有洞察的复盘报告：
- 结构：执行摘要 → 关键发现 → 分维度分析 → 结论与建议。
- 图表：用 \`\`\`echarts 代码块嵌入完整合法的 ECharts option JSON（纯 JSON，无注释无函数）。数据必须来自 run_code 的真实计算结果。
- 可用 \`\`\`mermaid 代码块表达流程/结构关系。
- 适当使用 Markdown 表格呈现关键指标。
- 结论要具体、可落地，引用数据支撑。
- 语言：简体中文。`;
}

export async function runAgent({ session, config, userPrompt, emit, signal = null, isFollowup = false }) {
  const { kernel } = session;

  if (!session.messages || session.messages.length === 0) {
    session.messages = [
      { role: "system", content: buildSystemPrompt(session.fileInfo, false) },
      { role: "user", content: userPrompt },
    ];
  } else {
    session.messages.push({ role: "user", content: userPrompt });
  }

  const messages = session.messages;
  let round = 0;
  let planSteps = [];
  let runCodeIndex = 0;
  let planSubmitted = false;

  while (round < MAX_ROUNDS) {
    if (signal?.aborted) {
      emit({ type: "aborted" });
      return;
    }

    round += 1;
    emit({ type: "round", n: round });

    let result;
    try {
      result = await streamChat(
        config,
        messages,
        isFollowup ? [RUN_CODE_TOOL] : TOOLS,
        { onContentDelta: (text) => emit({ type: "assistant_delta", text }) },
        signal
      );
    } catch (err) {
      if (signal?.aborted || err.name === "AbortError") {
        emit({ type: "aborted" });
        return;
      }
      emit({ type: "error", message: `调用大模型失败：${err.message}` });
      return;
    }

    const { content, toolCalls } = result;

    if (!toolCalls || toolCalls.length === 0) {
      messages.push({ role: "assistant", content: content || "" });
      emit({ type: "final", text: content || "" });
      emit({ type: "done" });
      return;
    }

    messages.push({
      role: "assistant",
      content: content || "",
      tool_calls: toolCalls,
    });

    if (content && content.trim()) {
      emit({ type: "assistant_done", text: content });
    }

    for (const tc of toolCalls) {
      if (signal?.aborted) {
        emit({ type: "aborted" });
        return;
      }

      let args = {};
      try { args = JSON.parse(tc.function.arguments || "{}"); } catch { args = {}; }

      if (tc.function.name === "submit_plan") {
        planSteps = (args.steps || []).filter(Boolean);
        planSubmitted = true;
        emit({ type: "task_plan", steps: planSteps });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: "计划已记录，请按计划开始逐步执行分析。",
        });
        continue;
      }

      if (tc.function.name === "run_code") {
        const code = args.code || "";
        const summary = args.summary || "执行数据分析代码";

        if (planSubmitted && runCodeIndex < planSteps.length) {
          emit({ type: "task_update", index: runCodeIndex, status: "active" });
        }
        emit({ type: "tool_call", id: tc.id, name: "run_code", summary, code });

        let toolResult;
        try { toolResult = await kernel.runCode(code); }
        catch (err) { toolResult = { ok: false, stdout: "", stderr: "", error: String(err) }; }

        emit({
          type: "tool_result",
          id: tc.id,
          ok: toolResult.ok,
          stdout: toolResult.stdout || "",
          stderr: toolResult.stderr || "",
          error: toolResult.error || "",
        });

        if (planSubmitted && runCodeIndex < planSteps.length) {
          emit({ type: "task_update", index: runCodeIndex, status: "done" });
        }
        runCodeIndex++;

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: formatToolResult(toolResult),
        });
        continue;
      }

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: `工具 ${tc.function.name} 不存在。`,
      });
    }
  }

  emit({ type: "error", message: `已达到最大分析轮次（${MAX_ROUNDS}），分析中止。` });
  emit({ type: "done" });
}

function formatToolResult(r) {
  const parts = [`状态: ${r.ok ? "成功" : "失败"}`];
  if (r.stdout) parts.push(`stdout:\n${r.stdout}`);
  if (r.stderr) parts.push(`stderr:\n${r.stderr}`);
  if (r.error) parts.push(`error:\n${r.error}`);
  if (!r.stdout && !r.stderr && !r.error) {
    parts.push("（无输出，请记得使用 print() 输出你想观察的内容）");
  }
  return parts.join("\n\n");
}