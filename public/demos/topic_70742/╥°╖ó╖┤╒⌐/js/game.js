/**
 * 银发反诈守护人 - 游戏核心引擎
 * 处理分支剧情逻辑、对话流转、状态管理
 */

const GameEngine = {
  currentScenario: null,
  currentNode: null,
  isPlaying: false,
  isTyping: false,
  typingTimer: null,
  history: [], // 对话历史
  currentNodeHistory: [], // 当前流程节点历史
  totalNodes: 0, // 当前场景总节点数

  TIPS: [
    '接到陌生来电，提到"转账"、"安全账户"的，一律挂断！',
    '真正的公检法机关不会通过电话要求你汇款转账。',
    '中奖先交税？这是典型的诈骗套路，千万别信！',
    '熟人通过微信、QQ借钱，一定要打电话核实身份。',
    '短信里的陌生链接不要点，可能是钓鱼网站。',
    '验证码是最后一道防线，谁都不能给！',
    '投资理财请认准正规渠道，高收益背后往往是陷阱。',
    '遇到可疑情况，拨打96110反诈专线咨询。',
    '保健品不能替代药品，免费体检可能是推销陷阱。',
    '天上不会掉馅饼，不贪小便宜就不容易上当。'
  ],

  /**
   * 初始化游戏引擎
   */
  init() {
    Storage.init();
    this.currentScenario = null;
    this.currentNode = null;
    this.isPlaying = false;
    this.history = [];
    this.currentNodeHistory = [];
    this.totalNodes = 0;
  },

  /**
   * 开始一个场景
   */
  startScenario(scenarioId) {
    const scenario = SCENARIOS[scenarioId];
    if (!scenario) {
      console.error('Scenario not found:', scenarioId);
      return false;
    }

    this.currentScenario = scenario;
    this.currentNode = scenario.nodes[scenario.startNode];
    this.isPlaying = true;
    this.history = [];
    this.currentNodeHistory = [scenario.startNode];
    this.totalNodes = Object.keys(scenario.nodes).length;

    // 保存进度
    Storage.saveGameProgress(scenarioId, scenario.startNode);
    // 增加当日游玩次数
    Storage.incrementTodayPlayCount();

    return this.currentNode;
  },

  /**
   * 继续游戏（从存档）
   */
  continueGame() {
    const progress = Storage.getGameProgress();
    if (!progress || !progress.scenarioId) return false;

    const scenario = SCENARIOS[progress.scenarioId];
    if (!scenario) return false;

    this.currentScenario = scenario;
    this.currentNode = scenario.nodes[progress.nodeId];
    this.isPlaying = true;
    this.history = [];
    this.currentNodeHistory = [progress.nodeId];
    this.totalNodes = Object.keys(scenario.nodes).length;

    return this.currentNode;
  },

  /**
   * 处理选择
   */
  makeChoice(choiceIndex) {
    if (!this.currentNode || !this.currentNode.choices) return null;
    if (choiceIndex < 0 || choiceIndex >= this.currentNode.choices.length) return null;

    const choice = this.currentNode.choices[choiceIndex];
    if (!choice) return null;

    // 将当前节点加入历史
    this.history.push({
      speaker: this.currentNode.speaker,
      text: this.currentNode.text,
      isPlayer: this.currentNode.speaker === '玩家'
    });

    // 跳转到下一个节点
    const nextNode = this.currentScenario.nodes[choice.next];
    if (!nextNode) return null;

    this.currentNode = nextNode;
    this.currentNodeHistory.push(choice.next);

    // 保存进度
    if (this.currentScenario) {
      Storage.saveGameProgress(this.currentScenario.id, choice.next);
    }

    return nextNode;
  },

  /**
   * 自动继续（无选择的节点）
   */
  autoContinue() {
    if (!this.currentNode || !this.currentNode.autoContinue) return null;
    if (!this.currentNode.next) return null;

    // 将当前节点加入历史
    this.history.push({
      speaker: this.currentNode.speaker,
      text: this.currentNode.text,
      isPlayer: this.currentNode.speaker === '玩家'
    });

    const nextNode = this.currentScenario.nodes[this.currentNode.next];
    if (!nextNode) return null;

    this.currentNode = nextNode;
    this.currentNodeHistory.push(this.currentNode.id);

    // 保存进度
    if (this.currentScenario) {
      Storage.saveGameProgress(this.currentScenario.id, this.currentNode.id);
    }

    return nextNode;
  },

  /**
   * 检查当前节点是否为结局
   */
  checkEnding() {
    if (!this.currentNode) return null;
    return this.currentNode.ending || null;
  },

  /**
   * 触发结局
   */
  triggerEnding(endingId) {
    if (!this.currentScenario) return null;

    const ending = ENDINGS[endingId];
    if (!ending) return null;

    // 添加到历史
    this.history.push({
      speaker: this.currentNode.speaker,
      text: this.currentNode.text,
      isPlayer: false
    });

    // 解锁结局
    Storage.unlockEnding(endingId);
    // 解锁图鉴
    Storage.unlockEncyclopedia(this.currentScenario.id);
    // 标记场景完成
    Storage.completeScenario(this.currentScenario.id);
    // 更新统计
    Storage.updateStats(ending.type);

    this.isPlaying = false;
    Storage.clearGameProgress();

    // 自动检查并解锁成就
    this.checkAchievements();

    return ending;
  },

  /**
   * 获取当前节点
   */
  getCurrentNode() {
    return this.currentNode;
  },

  /**
   * 获取当前场景
   */
  getCurrentScenario() {
    return this.currentScenario;
  },

  /**
   * 获取对话历史
   */
  getHistory() {
    return this.history;
  },

  /**
   * 是否有存档
   */
  hasSaveData() {
    const progress = Storage.getGameProgress();
    return progress && progress.scenarioId ? true : false;
  },

  /**
   * 获取场景完成状态
   */
  getScenarioStatus(scenarioId) {
    const completed = Storage.getCompletedScenarios();
    const endings = Storage.getUnlockedEndings();
    return {
      completed: completed.includes(scenarioId),
      unlocked: completed.includes(scenarioId) || endings.length > 0
    };
  },

  /**
   * 获取所有场景的进度概览
   */
  getAllScenarioProgress() {
    const completed = Storage.getCompletedScenarios();
    const encyclopedia = Storage.getEncyclopediaProgress();
    const endings = Storage.getUnlockedEndings();

    return Object.keys(SCENARIOS).map(id => ({
      id,
      title: SCENARIOS[id].title,
      icon: SCENARIOS[id].icon,
      completed: completed.includes(id),
      encyclopediaUnlocked: encyclopedia.includes(id),
      endingCount: endings.length
    }));
  },

  /**
   * 获取游戏进度
   * @returns {{ visited: number, total: number, percentage: number }}
   */
  getProgress() {
    const visited = this.currentNodeHistory.length;
    const total = this.totalNodes;
    const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
    return { visited, total, percentage };
  },

  /**
   * 获取当前节点情绪状态
   * @returns {string} 情绪状态: 'neutral' | 'confident' | 'anxious' | 'excited' | 'shocked' | 'doubtful' | 'normal'
   */
  getEmotion() {
    if (!this.currentNode) return 'normal';
    const speaker = this.currentNode.speaker || '';

    if (speaker === '系统提示') return 'neutral';
    if (speaker === '玩家') return 'confident';
    if (speaker.includes('(紧张)') || speaker.includes('害怕')) return 'anxious';
    if (speaker.includes('(兴奋)') || speaker.includes('激动')) return 'excited';
    if (speaker.includes('(震惊)') || speaker.includes('愤怒')) return 'shocked';
    if (speaker.includes('(犹豫)') || speaker.includes('将信将疑')) return 'doubtful';

    return 'normal';
  },

  /**
   * 自动检查并解锁成就
   * 在 triggerEnding 后自动调用
   */
  checkAchievements() {
    const completed = Storage.getCompletedScenarios();
    const endings = Storage.getUnlockedEndings();
    const encyclopedia = Storage.getEncyclopediaProgress();
    const stats = Storage.getStats();
    const allScenarioIds = Object.keys(SCENARIOS);

    // 首次完成任意场景
    if (completed.length >= 1) {
      Storage.unlockAchievement('first_play');
    }

    // 完成4个场景（假设总共有4个场景）
    if (completed.length >= allScenarioIds.length) {
      Storage.unlockAchievement('all_scenarios');
    }

    // 解锁4种结局
    const uniqueEndingTypes = new Set();
    endings.forEach(eid => {
      if (ENDINGS[eid]) {
        uniqueEndingTypes.add(ENDINGS[eid].type);
      }
    });
    if (uniqueEndingTypes.size >= 4) {
      Storage.unlockAchievement('all_endings');
    }

    // 所有场景都获得report结局（通过检查已完成场景数+存在report结局来判断）
    const hasReportEnding = endings.some(eid => {
      const ending = ENDINGS[eid];
      return ending && ending.type === 'report';
    });
    if (completed.length >= allScenarioIds.length && hasReportEnding) {
      Storage.unlockAchievement('perfect_guardian');
    }

    // 解锁全部图鉴
    if (encyclopedia.length >= allScenarioIds.length) {
      Storage.unlockAchievement('encyclopedia_master');
    }

    // 从未获得loss结局
    if (stats.lossCount === 0 && stats.totalPlays > 0) {
      Storage.unlockAchievement('no_loss');
    }
  },

  /**
   * 从反诈小贴士数组中随机返回一条
   * @returns {string}
   */
  getRandomTip() {
    const index = Math.floor(Math.random() * this.TIPS.length);
    return this.TIPS[index];
  }
};