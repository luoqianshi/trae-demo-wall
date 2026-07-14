/**
 * AutoFlow — 流程引擎
 * 模拟 AI 任务解析与流程执行
 */
const FlowEngine = {

  // AI 解析步骤（用于动画展示）
  parseSteps: [
    '正在分析任务意图...',
    '提取关键实体：时间、对象、动作、目标',
    '匹配自动化场景模板...',
    'AI 推理操作步骤与执行顺序...',
    '生成流程方案与预估耗时',
  ],

  // 解析任务
  parse(input) {
    const match = Scenarios.match(input);
    if (!match) return null;
    const scenario = match.scenario;
    return {
      scenarioId: scenario.id,
      taskName: scenario.parsed.taskName,
      trigger: scenario.parsed.trigger,
      schedule: scenario.parsed.schedule,
      confidence: match.confidence > 0 ? match.confidence : scenario.parsed.confidence,
      steps: JSON.parse(JSON.stringify(scenario.parsed.steps)), // deep clone
      result: scenario.result,
      icon: scenario.icon,
      inputText: input,
    };
  },

  // 模拟 AI 解析过程（带动画回调）
  async simulateParse(input, onStep) {
    for (let i = 0; i < this.parseSteps.length; i++) {
      onStep({ index: i, text: this.parseSteps[i], done: false });
      await this.delay(600 + Math.random() * 400);
      onStep({ index: i, text: this.parseSteps[i], done: true });
    }
    return this.parse(input);
  },

  // 执行流程（带回调）
  async execute(steps, onStepStart, onLog, onStepDone, onComplete) {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      // 标记步骤开始
      step.status = 'running';
      onStepStart(i, step);

      // 逐条输出日志
      for (const log of step.logs) {
        await this.delay(500 + Math.random() * 600);
        onLog(i, log);
      }

      // 标记步骤完成
      await this.delay(300);
      step.status = 'done';
      onStepDone(i, step);
    }

    onComplete();
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};
