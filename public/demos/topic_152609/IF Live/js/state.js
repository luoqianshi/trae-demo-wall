// ========================================
// IF LIFE · 状态管理
// ========================================

const State = {
  // 当前页面
  currentPage: 'landing',

  // 角色信息
  character: {
    name: '',
    params: {
      family: null,
      talent: null,
      city: null,
      personality: null,
      risk: null
    },
    mode: null,
    attributes: { wealth: 50, happiness: 50, health: 50, career: 50 }
  },

  // 模拟状态
  currentEventIndex: 0,
  selectedEvents: [],
  decisions: [],       // [{ eventId, optionId, isUserDecision, attributesBefore, attributesAfter, age }]
  eventPhase: 'choosing', // choosing | result

  // 平行人生
  originalLife: null,  // 保存原始决策数组用于回溯
  parallelLives: [],   // [{ id, decisions, branchEventId, originalOption, newOption, branchAge }]
  branchingPoint: null, // 当前正在创建的分叉点（兼容旧逻辑）

  // 当前在平行页查看的人生 ID（null 时默认看最新一条）
  viewingParallelId: null,

  // AI 生成事件
  aiEvent: null,

  // ===== 初始化 =====
  init() {
    this.selectedEvents = Engine.selectEvents();
  },

  // ===== 参数设置 =====
  setParam(param, value) {
    this.character.params[param] = value;
  },

  setMode(mode) {
    this.character.mode = mode;
  },

  isSetupComplete() {
    const p = this.character.params;
    return p.family && p.talent && p.city && p.personality && p.risk && this.character.mode && this.character.name.trim();
  },

  // ===== 计算初始属性 =====
  calculateInitialAttributes() {
    let attrs = { wealth: 50, happiness: 50, health: 50, career: 50 };
    const p = this.character.params;

    // 家庭背景
    const family = IF_LIFE_DATA.PARAMS.family.find(f => f.id === p.family);
    if (family && family.effects) {
      for (let key in family.effects) {
        attrs[key] = (attrs[key] || 0) + family.effects[key];
      }
    }

    // 天赋倾向
    const talent = IF_LIFE_DATA.PARAMS.talent.find(t => t.id === p.talent);
    if (talent && talent.effects) {
      for (let key in talent.effects) {
        attrs[key] = (attrs[key] || 0) + talent.effects[key];
      }
    }

    // 出生城市
    const city = IF_LIFE_DATA.PARAMS.city.find(c => c.id === p.city);
    if (city && city.effects) {
      for (let key in city.effects) {
        attrs[key] = (attrs[key] || 0) + city.effects[key];
      }
    }

    // 限制范围 0-100
    for (let key in attrs) {
      attrs[key] = Math.max(0, Math.min(100, attrs[key]));
    }

    this.character.attributes = attrs;
    return attrs;
  },

  // ===== 获取当前事件 =====
  getCurrentEvent() {
    if (this.currentEventIndex >= this.selectedEvents.length) return null;
    const eventId = this.selectedEvents[this.currentEventIndex];
    return IF_LIFE_DATA.events.find(e => e.id === eventId);
  },

  getCurrentAge() {
    const eventId = this.selectedEvents[this.currentEventIndex];
    return IF_LIFE_DATA.EVENT_AGES[eventId] || 25;
  },

  // ===== 做出决策 =====
  makeDecision(optionId, isUserDecision) {
    const event = this.getCurrentEvent();
    if (!event) return;

    const eventId = event.id;
    const age = this.getCurrentAge();
    const attrsBefore = { ...this.character.attributes };

    // 应用属性影响
    const impact = IF_LIFE_DATA.optionImpacts[eventId]?.[optionId];
    if (impact) {
      for (let key in impact) {
        this.character.attributes[key] = Math.max(0, Math.min(100, this.character.attributes[key] + impact[key]));
      }
    }

    const decision = {
      eventId,
      optionId,
      isUserDecision,
      attributesBefore: attrsBefore,
      attributesAfter: { ...this.character.attributes },
      age,
      impact: impact || {}
    };

    this.decisions.push(decision);
    this.eventPhase = 'result';
    return decision;
  },

  // ===== 进入下一个事件 =====
  nextEvent() {
    if (this.currentEventIndex < this.selectedEvents.length - 1) {
      this.currentEventIndex++;
      this.eventPhase = 'choosing';
      return true;
    }
    return false; // 已完成所有事件
  },

  prevEvent() {
    if (this.currentEventIndex > 0) {
      this.currentEventIndex--;
      this.eventPhase = 'result'; // 回看时直接显示结果
      return true;
    }
    return false;
  },

  // ===== 检查是否为关键节点 =====
  isKeyEvent(eventId) {
    return IF_LIFE_DATA.keyEvents.some(ke => ke.id === eventId);
  },

  // ===== 判断当前事件是否该由用户决策（混合模式）=====
  shouldUserDecide(eventId) {
    const mode = this.character.mode;
    if (mode === 'manual') return true;
    if (mode === 'auto') return false;
    if (mode === 'mixed') return this.isKeyEvent(eventId);
    return true;
  },

  // ===== 保存原始人生（用于平行人生回溯）=====
  saveOriginalLife() {
    this.originalLife = {
      decisions: JSON.parse(JSON.stringify(this.decisions)),
      attributes: { ...this.character.attributes },
      params: { ...this.character.params },
      name: this.character.name,
      mode: this.character.mode
    };
  },

  // ===== 创建平行人生（追加到数组，支持多条）=====
  createParallelLife(branchEventId, newOptionId) {
    if (!this.originalLife) return null;

    // 找到分叉点在 decisions 中的位置
    const branchIndex = this.originalLife.decisions.findIndex(d => d.eventId === branchEventId);
    if (branchIndex === -1) return null;

    const originalChoice = this.originalLife.decisions[branchIndex].optionId;
    const branchAge = IF_LIFE_DATA.EVENT_AGES[branchEventId];

    // 兼容旧的 branchingPoint
    this.branchingPoint = {
      eventId: branchEventId,
      originalOption: originalChoice,
      newOption: newOptionId
    };

    // 从分叉点开始重放
    const parallelDecisions = [];
    let attrs = { ...this.originalLife.decisions[0].attributesBefore };

    // 复制分叉点之前的决策
    for (let i = 0; i < branchIndex; i++) {
      const d = this.originalLife.decisions[i];
      parallelDecisions.push(JSON.parse(JSON.stringify(d)));
      attrs = { ...d.attributesAfter };
    }

    // 分叉点：使用新选项
    const branchEvent = IF_LIFE_DATA.events.find(e => e.id === branchEventId);
    const branchImpact = IF_LIFE_DATA.optionImpacts[branchEventId]?.[newOptionId];
    const attrsBeforeBranch = { ...attrs };

    if (branchImpact) {
      for (let key in branchImpact) {
        attrs[key] = Math.max(0, Math.min(100, attrs[key] + branchImpact[key]));
      }
    }

    parallelDecisions.push({
      eventId: branchEventId,
      optionId: newOptionId,
      isUserDecision: true,
      attributesBefore: attrsBeforeBranch,
      attributesAfter: { ...attrs },
      age: branchAge,
      impact: branchImpact || {}
    });

    // 分叉后的事件：使用原路径的选择
    for (let i = branchIndex + 1; i < this.originalLife.decisions.length; i++) {
      const origDecision = this.originalLife.decisions[i];
      const impact = IF_LIFE_DATA.optionImpacts[origDecision.eventId]?.[origDecision.optionId];
      const attrsBefore = { ...attrs };

      if (impact) {
        for (let key in impact) {
          attrs[key] = Math.max(0, Math.min(100, attrs[key] + impact[key]));
        }
      }

      parallelDecisions.push({
        eventId: origDecision.eventId,
        optionId: origDecision.optionId,
        isUserDecision: false,
        attributesBefore: attrsBefore,
        attributesAfter: { ...attrs },
        age: origDecision.age,
        impact: impact || {}
      });
    }

    // 追加到数组
    const lifeId = 'p' + (this.parallelLives.length + 1);
    const parallelLife = {
      id: lifeId,
      decisions: parallelDecisions,
      branchEventId,
      originalOption: originalChoice,
      newOption: newOptionId,
      branchAge
    };
    this.parallelLives.push(parallelLife);
    return parallelLife;
  },

  // ===== 获取最新创建的平行人生（兼容旧代码）=====
  get latestParallelLife() {
    return this.parallelLives.length > 0 ? this.parallelLives[this.parallelLives.length - 1] : null;
  },

  // ===== 获取所有人生（原始 + 平行）用于对比实验室 =====
  getAllLives() {
    if (!this.originalLife) return [];
    const lives = [{
      id: 'original',
      label: '原始人生',
      decisions: this.originalLife.decisions,
      color: '#8B7355',
      branchEventId: null
    }];
    const colors = ['#2C4A6B', '#A8362E', '#4A7C3A', '#7B4F9A', '#C97B1F'];
    for (let i = 0; i < this.parallelLives.length; i++) {
      const pl = this.parallelLives[i];
      lives.push({
        id: pl.id,
        label: `平行 ${String.fromCharCode(65 + i)}`,
        decisions: pl.decisions,
        color: colors[i % colors.length],
        branchEventId: pl.branchEventId
      });
    }
    return lives;
  },

  // ===== 检查某个关键节点是否已被回溯过 =====
  isBranched(eventId) {
    return this.parallelLives.some(pl => pl.branchEventId === eventId);
  },

  // ===== 获取属性历史（用于绘制曲线）=====
  getAttributeHistory(decisions) {
    const history = { wealth: [], happiness: [], health: [], career: [] };
    const initial = this.character.attributes;

    // 起点
    for (let key in history) {
      history[key].push(this.originalLife ? 50 : initial[key]);
    }

    for (let d of decisions) {
      for (let key in history) {
        history[key].push(d.attributesAfter[key]);
      }
    }

    return history;
  },

  // ===== 重置 =====
  reset() {
    this.currentPage = 'landing';
    this.character = {
      name: '',
      params: { family: null, talent: null, city: null, personality: null, risk: null },
      mode: null,
      attributes: { wealth: 50, happiness: 50, health: 50, career: 50 }
    };
    this.currentEventIndex = 0;
    this.selectedEvents = [];
    this.decisions = [];
    this.eventPhase = 'choosing';
    this.originalLife = null;
    this.parallelLives = [];
    this.branchingPoint = null;
    this.viewingParallelId = null;
    this.aiEvent = null;
    this.init();
  },

  // ===== LocalStorage 持久化 =====
  save() {
    try {
      localStorage.setItem('iflife_state', JSON.stringify({
        character: this.character,
        decisions: this.decisions,
        currentEventIndex: this.currentEventIndex,
        selectedEvents: this.selectedEvents
      }));
    } catch (e) { /* 静默失败 */ }
  },

  load() {
    try {
      const saved = localStorage.getItem('iflife_state');
      if (!saved) return false;
      const data = JSON.parse(saved);
      this.character = data.character;
      this.decisions = data.decisions || [];
      this.currentEventIndex = data.currentEventIndex || 0;
      this.selectedEvents = data.selectedEvents || [];
      return true;
    } catch (e) { return false; }
  }
};
