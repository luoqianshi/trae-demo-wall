// ========================================
// IF LIFE · 模拟引擎
// 事件选择 / AI 决策 / 属性计算 / 画像生成
// ========================================

const Engine = {

  // ===== 选择 10 个事件 =====
  selectEvents() {
    return [...IF_LIFE_DATA.SELECTED_EVENTS];
  },

  // ===== AI 自动决策 =====
  // 基于人格偏好权重 + 风险偏好调整
  makeAIDecision(eventId, personalityId, riskId) {
    const event = IF_LIFE_DATA.events.find(e => e.id === eventId);
    if (!event) return 'A';

    // 自由人格默认用 striver 偏好
    const biasKey = personalityId === 'free' ? 'striver' : personalityId;
    const bias = event.personality_bias?.[biasKey];
    if (!bias) return 'A';

    // 复制权重
    const weights = { ...bias };

    // 风险偏好调整
    const risk = IF_LIFE_DATA.PARAMS.risk.find(r => r.id === riskId);
    if (risk && risk.biasAdjust) {
      for (let key in risk.biasAdjust) {
        weights[key] = (weights[key] || 0) + risk.biasAdjust[key];
      }
    }

    // 加权随机选择
    const options = ['A', 'B', 'C', 'D'];
    const total = options.reduce((sum, opt) => sum + (weights[opt] || 0), 0);
    if (total <= 0) return 'A';

    let rand = Math.random() * total;
    for (let opt of options) {
      rand -= (weights[opt] || 0);
      if (rand <= 0) return opt;
    }
    return 'D';
  },

  // ===== 匹配人格 =====
  // 判断某个选项最接近哪个人格
  matchPersonality(eventId, optionId) {
    const event = IF_LIFE_DATA.events.find(e => e.id === eventId);
    if (!event || !event.personality_bias) return null;

    let bestPersonality = null;
    let bestWeight = -1;

    for (let personality of ['striver', 'guardian', 'speculator']) {
      const weight = event.personality_bias[personality]?.[optionId] || 0;
      if (weight > bestWeight) {
        bestWeight = weight;
        bestPersonality = personality;
      }
    }

    return bestPersonality;
  },

  // ===== 获取洞察句 =====
  getInsight(eventId, optionId) {
    return IF_LIFE_DATA.insights[eventId]?.[optionId] || '';
  },

  // ===== 获取事件 =====
  getEvent(eventId) {
    return IF_LIFE_DATA.events.find(e => e.id === eventId);
  },

  // ===== 获取选项 =====
  getOption(eventId, optionId) {
    const event = this.getEvent(eventId);
    return event?.options.find(o => o.id === optionId);
  },

  // ===== 获取人生阶段 =====
  getLifeStage(stageId) {
    return IF_LIFE_DATA.lifeStages.find(s => s.id === stageId);
  },

  // ===== 统计人格选择分布 =====
  // 返回 { striver: n, guardian: n, speculator: n }
  countPersonalityChoices(decisions) {
    const counts = { striver: 0, guardian: 0, speculator: 0 };
    for (let d of decisions) {
      const personality = this.matchPersonality(d.eventId, d.optionId);
      if (personality) counts[personality]++;
    }
    return counts;
  },

  // ===== 生成人生画像 =====
  generatePortrait(decisions) {
    const counts = this.countPersonalityChoices(decisions);
    const total = decisions.length || 1;

    // 匹配标签
    const labels = IF_LIFE_DATA.portraitRules.labels || [];
    let matchedLabel = null;

    // 优先匹配纯型（min 7）
    for (let label of labels) {
      const c = label.condition;
      if (c.striver_min && counts.striver >= c.striver_min && !c.guardian_min && !c.speculator_min) {
        matchedLabel = label;
        break;
      }
      if (c.guardian_min && counts.guardian >= c.guardian_min && !c.striver_min && !c.speculator_min) {
        matchedLabel = label;
        break;
      }
      if (c.speculator_min && counts.speculator >= c.speculator_min && !c.striver_min && !c.guardian_min) {
        matchedLabel = label;
        break;
      }
    }

    // 混合型
    if (!matchedLabel) {
      for (let label of labels) {
        const c = label.condition;
        if (c.striver_min && c.guardian_min && counts.striver >= c.striver_min && counts.guardian >= c.guardian_min) {
          matchedLabel = label;
          break;
        }
        if (c.striver_min && c.speculator_min && counts.striver >= c.striver_min && counts.speculator >= c.speculator_min) {
          matchedLabel = label;
          break;
        }
        if (c.guardian_min && c.speculator_min && counts.guardian >= c.guardian_min && counts.speculator >= c.speculator_min) {
          matchedLabel = label;
          break;
        }
      }
    }

    // 三型都 >= 3
    if (!matchedLabel) {
      const balanced = labels.find(l => l.id === 'balanced_all');
      if (balanced && counts.striver >= 3 && counts.guardian >= 3 && counts.speculator >= 3) {
        matchedLabel = balanced;
      }
    }

    // 单型 >= 5
    if (!matchedLabel) {
      for (let label of labels) {
        const c = label.condition;
        if (c.striver_min >= 5 && counts.striver >= 5) { matchedLabel = label; break; }
        if (c.guardian_min >= 5 && counts.guardian >= 5) { matchedLabel = label; break; }
        if (c.speculator_min >= 5 && counts.speculator >= 5) { matchedLabel = label; break; }
      }
    }

    // 兜底
    if (!matchedLabel) {
      matchedLabel = labels.find(l => l.id === 'balanced_all') || labels[0];
    }

    // 生成洞察（最多3条）
    const insightRules = IF_LIFE_DATA.portraitRules.insight_rules || [];
    const insights = [];
    const usedThemes = new Set();

    for (let rule of insightRules) {
      if (insights.length >= 3) break;
      if (usedThemes.has(rule.theme)) continue;

      if (rule.condition.events && rule.condition.match_personality) {
        // 统计在指定事件中匹配某人格的次数
        let matchCount = 0;
        for (let eventId of rule.condition.events) {
          const decision = decisions.find(d => d.eventId === eventId);
          if (decision) {
            const personality = this.matchPersonality(eventId, decision.optionId);
            if (personality === rule.condition.match_personality) {
              matchCount++;
            }
          }
        }

        if (matchCount >= (rule.condition.min_matches || 1)) {
          let template = rule.template.replace('{n}', matchCount);
          insights.push({
            theme: rule.theme,
            text: template,
            priority: rule.priority
          });
          usedThemes.add(rule.theme);
        }
      }
    }

    // 如果不足3条，补充默认
    if (insights.length < 3) {
      const defaultRule = insightRules.find(r => r.condition.type === 'fallback');
      if (defaultRule) {
        insights.push({
          theme: '综合',
          text: defaultRule.template,
          priority: 99
        });
      }
    }

    return {
      label: matchedLabel,
      counts,
      insights: insights.sort((a, b) => a.priority - b.priority).slice(0, 3),
      finalAttributes: decisions.length > 0 ? decisions[decisions.length - 1].attributesAfter : { wealth: 50, happiness: 50, health: 50, career: 50 }
    };
  },

  // ===== 获取事件结局描述 =====
  getOutcomeText(decisions) {
    const lastDecision = decisions[decisions.length - 1];
    if (!lastDecision) return '';

    const attrs = lastDecision.attributesAfter;
    const wealth = attrs.wealth;
    const happiness = attrs.happiness;
    const health = attrs.health;
    const career = attrs.career;

    // 根据属性生成结局
    if (wealth > 70 && career > 70) return '事业有成，财富自由，但这条路是否值得，只有你自己知道。';
    if (happiness > 70 && health > 60) return '不算最富，但活得通透快乐，身体也还硬朗。';
    if (wealth < 30 && career < 30) return '一事无成，但你可能会说：至少我试过了。';
    if (health < 30) return '拼出了一片天，但身体替你记了账。';
    if (happiness < 30) return '外人看你什么都有，但你心里知道少了什么。';
    return '不好不坏，不温不火，这就是大多数人的一生。';
  },

  // ===== 获取平行人生结局对比 =====
  getParallelOutcome(originalDecisions, parallelDecisions) {
    const originalOutcome = this.getOutcomeText(originalDecisions);
    const parallelOutcome = this.getOutcomeText(parallelDecisions);
    return { originalOutcome, parallelOutcome };
  }
};
