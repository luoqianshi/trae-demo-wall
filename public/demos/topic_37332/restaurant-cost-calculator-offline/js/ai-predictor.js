// ==================== AI 智能预测分析器 ====================

class AIPredictor {
  constructor() {
    this.apiConfig = this.loadApiConfig();
    this.predictionCache = null;
    this.isLoading = false;
  }

  // ========== API 配置管理 ==========
  getDefaultApiConfig() {
    return {
      provider: 'deepseek',
      apiKey: '',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat'
    };
  }

  getProviderPresets() {
    return {
      deepseek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
      openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
      zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
      custom: { baseUrl: '', model: '' }
    };
  }

  loadApiConfig() {
    try {
      const saved = localStorage.getItem('ai_predictor_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...this.getDefaultApiConfig(), ...parsed };
      }
    } catch (e) {
      console.error('[AI预测] 加载配置失败:', e);
    }
    return this.getDefaultApiConfig();
  }

  saveApiConfig(config) {
    try {
      localStorage.setItem('ai_predictor_config', JSON.stringify(config));
      this.apiConfig = config;
      return true;
    } catch (e) {
      console.error('[AI预测] 保存配置失败:', e);
      return false;
    }
  }

  // ========== 数据准备 ==========
  prepareSalesData(sales, recipes) {
    const productSales = {};
    sales.forEach(s => {
      if (!productSales[s.product_id]) productSales[s.product_id] = { qty: 0, revenue: 0, days: new Set() };
      productSales[s.product_id].qty += s.quantity;
      productSales[s.product_id].revenue += s.revenue;
      productSales[s.product_id].days.add(s.date);
    });

    let summary = '近30天各产品销售数据汇总:\n';
    Object.entries(productSales).forEach(([pid, data]) => {
      const recipe = recipes.find(r => r.product_id === pid);
      const name = recipe ? recipe.name : pid;
      const avgDaily = Math.round(data.qty / data.days.size);
      summary += `- ${name}: 总销量${data.qty}杯, 日均${avgDaily}杯, 总收入¥${data.revenue.toFixed(0)}\n`;
    });

    return summary;
  }

  prepareStoreData(kpis, channelStats, promotions) {
    let summary = `门店经营数据:\n`;
    summary += `- 总收入: ¥${kpis.totalRevenue.toFixed(0)}\n`;
    summary += `- 总成本: ¥${kpis.totalCost.toFixed(0)}\n`;
    summary += `- 毛利: ¥${kpis.grossProfit.toFixed(0)}\n`;
    summary += `- 毛利率: ${kpis.profitMargin.toFixed(1)}%\n`;
    summary += `- 总销量: ${kpis.totalCups}杯\n\n`;

    if (channelStats) {
      summary += '渠道分布:\n';
      Object.entries(channelStats).forEach(([ch, data]) => {
        summary += `- ${ch}: 销量${data.quantity}杯, 收入¥${data.revenue.toFixed(0)}\n`;
      });
    }

    if (promotions) {
      summary += '\n当前活动:\n';
      promotions.forEach(p => {
        summary += `- ${p.name}: ${p.badge}, ${p.description}\n`;
      });
    }

    return summary;
  }

  // ========== AI API 调用 ==========
  async callAI(prompt, systemPrompt) {
    if (!this.apiConfig.apiKey) {
      throw new Error('未配置 API Key');
    }

    const response = await fetch(`${this.apiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: this.apiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API请求失败 (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async testConnection() {
    try {
      const result = await this.callAI('请回复"连接成功"', '你是一个测试助手，只回复"连接成功"四个字。');
      return { success: true, message: result || '连接成功' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ========== 三大预测功能 ==========

  // 1. 单品爆款预测
  async predictHotProducts(sales, recipes) {
    const data = this.prepareSalesData(sales, recipes);
    const systemPrompt = `你是一位星巴克门店数据分析专家。基于提供的近30天销售数据，预测未来7天各产品销量排名。
请严格以JSON格式返回结果，不要包含任何其他文字。
返回格式: {"predictions":[{"productId":"P001","name":"拿铁","predictedQty":1500,"confidence":85,"trend":"up","reason":"近30天日均销量稳定增长，季节性因素利好"}]}
trend可选值: up(上升), stable(稳定), down(下降)
confidence为0-100的整数，表示预测置信度
reason用中文简述理由`;

    const result = await this.callAI(data, systemPrompt);
    return this.parseJSONResult(result);
  }

  // 2. 店面运营分析
  async analyzeStore(kpis, channelStats, promotions) {
    const data = this.prepareStoreData(kpis, channelStats, promotions);
    const systemPrompt = `你是星巴克运营顾问。基于门店数据给出运营评分和具体建议。
请严格以JSON格式返回结果，不要包含任何其他文字。
返回格式: {"score":78,"level":"良好","highlights":["毛利率保持在70%以上","线上渠道增长稳定"],"suggestions":["建议增加下午茶时段促销","冷萃咖啡有增长潜力"],"dataSupport":["毛利率数据支撑: XX%","日均销量XX杯"]}
score为0-100的整数
level可选值: 优秀(>=85), 良好(>=70), 一般(>=55), 需改善(<55)
highlights和suggestions为字符串数组，每项2-3句话
dataSupport为数据支撑论据数组`;

    const result = await this.callAI(data, systemPrompt);
    return this.parseJSONResult(result);
  }

  // 3. 活动折扣决策
  async analyzePromotions(sales, recipes, promotions) {
    let data = '当前折扣活动及销售数据:\n';
    promotions.forEach(p => {
      const productNames = p.products.map(pid => {
        const r = recipes.find(r => r.product_id === pid);
        return r ? r.name : pid;
      }).join('、');
      data += `- ${p.name}(${p.badge}): 参与${productNames}, ${p.description}\n`;
    });

    data += '\n整体销售情况:\n' + this.prepareSalesData(sales, recipes);

    const systemPrompt = `你是星巴克营销分析师。分析当前折扣活动效果，给出优化建议。
请严格以JSON格式返回结果，不要包含任何其他文字。
返回格式: {"promotions":[{"name":"活动名称","effectiveness":"高","roi":"1.8x","suggestions":"建议延长活动时间","dataSupport":"活动期间销量增长XX%"}]}
effectiveness可选值: 高, 中, 低
roi为投资回报率倍数
suggestions用中文给出具体优化建议
dataSupport用数据支撑效果评估`;

    const result = await this.callAI(data, systemPrompt);
    return this.parseJSONResult(result);
  }

  // ========== 结果解析 ==========
  parseJSONResult(raw) {
    try {
      // 尝试提取JSON（可能被markdown包裹）
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('[AI预测] JSON解析失败:', e, '原始返回:', raw);
      return null;
    }
  }

  // ========== Mock 数据 ==========
  getMockHotProducts(recipes) {
    const sorted = [...recipes].sort(() => Math.random() - 0.5);
    return {
      predictions: sorted.map((r, i) => ({
        productId: r.product_id,
        name: r.name,
        predictedQty: Math.round(800 + Math.random() * 1200),
        confidence: Math.round(75 + Math.random() * 20),
        trend: i < 3 ? 'up' : i < 6 ? 'stable' : 'down',
        reason: `基于近30天销量趋势分析，${r.name}的${i < 3 ? '需求持续上升，建议备货充足' : i < 6 ? '销量保持稳定，维持当前库存即可' : '需求有所下降，可适当减少备货'}`
      }))
    };
  }

  getMockStoreAnalysis(kpis) {
    const score = Math.round(65 + Math.random() * 25);
    const level = score >= 85 ? '优秀' : score >= 70 ? '良好' : score >= 55 ? '一般' : '需改善';
    return {
      score,
      level,
      highlights: [
        `毛利率保持在${(kpis.profitMargin * 0.95).toFixed(1)}%以上`,
        '线上渠道占比合理，美团外卖贡献最大',
        '热销品集中度高，TOP3产品贡献超50%毛利'
      ],
      suggestions: [
        '建议增加下午14:00-16:00时段的促销活动，提升非高峰时段销量',
        '冷萃冰咖啡和抹茶拿铁有增长潜力，可加大推广力度',
        '淘宝闪购渠道占比偏低，建议优化线上运营策略'
      ],
      dataSupport: [
        `毛利率数据: ${kpis.profitMargin.toFixed(1)}%，高于行业平均水平`,
        `日均销量: ${Math.round(kpis.totalCups / 30)}杯`,
        `总收入: ¥${kpis.totalRevenue.toFixed(0)}`
      ]
    };
  }

  getMockPromotionAnalysis(promotions) {
    return {
      promotions: (promotions || []).map(p => ({
        name: p.name,
        effectiveness: Math.random() > 0.5 ? '高' : '中',
        roi: (1.2 + Math.random() * 1.5).toFixed(1) + 'x',
        suggestions: `建议${Math.random() > 0.5 ? '延长活动时间至月底' : '增加活动覆盖产品范围'}，${p.badge}活动对相关产品销量提升明显`,
        dataSupport: `活动期间参与产品销量平均提升${Math.round(15 + Math.random() * 25)}%`
      }))
    };
  }
}
