const AIEngine = {
  industryKeywords: {
    '电子制造': ['电子', '电路板', 'PCB', '芯片', '半导体', '元器件', '连接器', '光电', '显示', '传感器'],
    '服装': ['服装', '服饰', '制衣', '纺织', '鞋帽', '运动服', '男装', '女装', '针织', '印花'],
    '机械': ['机械', '机床', '模具', '重工', '起重', '设备', '液压', '加工', '自动化'],
    '软件服务': ['软件', '开发', '云计算', '大数据', 'AI', '人工智能', 'App', '小程序', '系统', 'IT'],
    '设计': ['设计', '工业设计', '品牌设计', '平面设计', '空间设计', 'UI', '视觉'],
    '新能源': ['新能源', '光伏', '锂电', '电池', '储能', '太阳能', '风电']
  },

  capabilityKeywords: {
    '精密CNC加工': ['CNC', '精密加工', '数控'],
    '小批量定制': ['小批量', '定制', 'OEM'],
    '快速打样': ['打样', '样品', 'prototyping'],
    'PCB设计': ['PCB', '电路板', '线路板'],
    'SMT贴片': ['SMT', '贴片', '焊接'],
    '芯片封装': ['芯片', '封装', '半导体'],
    '模具设计': ['模具', 'mold', '注塑'],
    '云服务': ['云', 'cloud', '服务器'],
    '大数据': ['大数据', '数据分析', 'BI'],
    '产品设计': ['产品设计', '工业设计', 'ID'],
    '品牌设计': ['品牌', 'VI', '视觉'],
    '光伏组件': ['光伏', '太阳能', '组件'],
    '锂电池': ['锂电', '电池', '储能']
  },

  extractTags(query) {
    if (!query) return [];
    const tags = [];
    const queryLower = query.toLowerCase();
    
    for (const [tag, keywords] of Object.entries(this.capabilityKeywords)) {
      if (keywords.some(k => queryLower.includes(k.toLowerCase()))) {
        tags.push(tag);
      }
    }

    const companyNames = Data.COMPANIES.map(c => c.name);
    for (const name of companyNames) {
      if (queryLower.includes(name.toLowerCase())) {
        tags.push(name);
      }
    }

    return [...new Set(tags)];
  },

  extractIndustry(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();
    
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      if (keywords.some(k => queryLower.includes(k.toLowerCase()))) {
        return industry;
      }
    }
    
    return null;
  },

  calculateMatch(company, tags = [], targetIndustry = null) {
    let capabilityScore = 0;
    let industryScore = 0;
    let ratingScore = 0;
    let scaleScore = 0;

    if (tags.length > 0) {
      const matchedTags = tags.filter(tag => 
        company.capabilities.some(cap => cap.includes(tag) || tag.includes(cap))
      );
      capabilityScore = (matchedTags.length / tags.length) * 100;
    } else {
      capabilityScore = 50;
    }

    if (targetIndustry) {
      industryScore = company.industry === targetIndustry ? 100 : 
        company.industry.includes(targetIndustry) || targetIndustry.includes(company.industry) ? 50 : 0;
    } else {
      industryScore = 50;
    }

    ratingScore = company.trustScore.overall;

    const employeeRanges = { '50-100人': 60, '100-200人': 80, '200-500人': 90, '500-1000人': 100 };
    scaleScore = employeeRanges[company.employeeRange] || 50;

    const finalScore = (capabilityScore * 0.4) + (industryScore * 0.25) + (ratingScore * 0.2) + (scaleScore * 0.15);
    
    return Math.round(finalScore);
  },

  searchCompanies(query, filters = {}) {
    const tags = this.extractTags(query);
    const industry = this.extractIndustry(query);

    let companies = [...Data.COMPANIES];

    if (filters.industries && filters.industries.length > 0) {
      companies = companies.filter(c => filters.industries.includes(c.industry));
    }

    if (filters.minRating) {
      companies = companies.filter(c => c.trustScore.overall >= filters.minRating);
    }

    if (filters.city) {
      companies = companies.filter(c => c.city === filters.city);
    }

    if (filters.employeeRange) {
      companies = companies.filter(c => c.employeeRange === filters.employeeRange);
    }

    const results = companies.map(company => ({
      ...company,
      matchScore: this.calculateMatch(company, tags, industry),
      matchReason: this.generateReason(company, tags, industry)
    }));

    let sortBy = filters.sortBy || 'match';
    if (sortBy === 'match') {
      results.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortBy === 'rating') {
      results.sort((a, b) => b.trustScore.overall - a.trustScore.overall);
    } else if (sortBy === 'date') {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return {
      results,
      total: results.length,
      tags,
      industry,
      avgMatchScore: results.length > 0 ? 
        Math.round(results.reduce((sum, r) => sum + r.matchScore, 0) / results.length) : 0
    };
  },

  generateReason(company, tags = [], industry = null) {
    const reasons = [];

    if (tags.length > 0) {
      const matchedCaps = company.capabilities.filter(cap => 
        tags.some(tag => cap.includes(tag) || tag.includes(cap))
      );
      if (matchedCaps.length > 0) {
        reasons.push(`具备${matchedCaps.slice(0, 2).join('、')}等核心能力`);
      }
    }

    if (industry && company.industry === industry) {
      reasons.push(`专注${industry}领域，经验丰富`);
    }

    if (company.trustScore.overall >= 90) {
      reasons.push('信用评分优秀，值得信赖');
    } else if (company.trustScore.overall >= 80) {
      reasons.push('信用评分良好');
    }

    if (company.cooperationCount >= 100) {
      reasons.push(`已有${company.cooperationCount}次成功合作记录`);
    }

    if (reasons.length === 0) {
      reasons.push('综合评估符合您的需求');
    }

    return `AI推荐：${reasons.join('，')}。`;
  },

  getSimilarCompanies(companyId) {
    const company = Data.getCompanyById(companyId);
    if (!company) return [];

    const similar = Data.COMPANIES
      .filter(c => c.id !== companyId && c.industry === company.industry)
      .map(c => ({
        ...c,
        matchScore: this.calculateMatch(c, company.capabilities.slice(0, 3), company.industry),
        matchReason: this.generateReason(c, company.capabilities.slice(0, 3))
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return similar;
  },

  analyzeCompanyInfo(info) {
    const analysis = {
      name: '',
      industry: '',
      capabilities: [],
      description: '',
      confidence: {
        name: 0.8,
        industry: 0.75,
        capabilities: 0.7,
        description: 0.65
      }
    };

    if (!info) return analysis;

    const infoLower = info.toLowerCase();

    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      if (keywords.some(k => infoLower.includes(k.toLowerCase()))) {
        analysis.industry = industry;
        analysis.confidence.industry = 0.9;
        break;
      }
    }

    for (const [cap, keywords] of Object.entries(this.capabilityKeywords)) {
      if (keywords.some(k => infoLower.includes(k.toLowerCase()))) {
        analysis.capabilities.push(cap);
      }
    }

    if (analysis.capabilities.length === 0) {
      analysis.capabilities = ['定制开发', '技术服务'];
    }

    if (info.includes('.com') || info.includes('.cn')) {
      const parts = info.replace('https://', '').replace('http://', '').split('.');
      analysis.name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + '科技有限公司';
    } else {
      analysis.name = info + '有限公司';
    }

    const industryDesc = {
      '电子制造': '专注于电子元器件研发与生产，为客户提供高品质的电子制造解决方案。',
      '服装': '专业服装设计与生产企业，提供从设计到生产的一站式服务。',
      '机械': '专注于机械设备研发与制造，为工业领域提供专业的设备解决方案。',
      '软件服务': '专业软件技术服务公司，提供软件开发、云计算、大数据等技术服务。',
      '设计': '专业设计服务机构，提供工业设计、品牌设计、视觉设计等服务。',
      '新能源': '专注于新能源领域，提供光伏、锂电等新能源产品与解决方案。'
    };

    analysis.description = industryDesc[analysis.industry] || '致力于为客户提供优质的产品和服务。';

    return analysis;
  },

  generateCooperationSuggestion(company) {
    const suggestions = [];

    if (company.trustScore.quality >= 90) {
      suggestions.push('建议重点关注产品质量标准，该企业质量评分优秀');
    }

    if (company.trustScore.delivery >= 90) {
      suggestions.push('该企业交货准时率高，可放心约定交货周期');
    }

    if (company.trustScore.communication >= 90) {
      suggestions.push('沟通效率高，建议直接联系对接具体需求');
    }

    if (company.capabilities.length >= 3) {
      suggestions.push(`核心能力包括${company.capabilities.slice(0, 3).join('、')}，可按需选择合作方式`);
    }

    if (company.certifications.length >= 2) {
      suggestions.push(`已通过${company.certifications.slice(0, 2).join('、')}等认证，资质齐全`);
    }

    if (suggestions.length === 0) {
      suggestions.push('建议根据具体需求与对方沟通合作细节');
    }

    return suggestions.join('\n');
  },

  extractDemandTags(demandText) {
    if (!demandText) return [];
    
    const tags = [];
    const textLower = demandText.toLowerCase();

    for (const [tag, keywords] of Object.entries(this.capabilityKeywords)) {
      if (keywords.some(k => textLower.includes(k.toLowerCase()))) {
        tags.push(tag);
      }
    }

    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      if (keywords.some(k => textLower.includes(k.toLowerCase()))) {
        tags.push(industry);
      }
    }

    const budgetKeywords = {
      '预算充足': ['10万以上', '预算充足', '大量'],
      '中等预算': ['1-5万', '5-10万', '适中'],
      '小预算': ['小于1万', '少量', '小批量']
    };

    for (const [tag, keywords] of Object.entries(budgetKeywords)) {
      if (keywords.some(k => textLower.includes(k.toLowerCase()))) {
        tags.push(tag);
      }
    }

    return [...new Set(tags)];
  },

  estimateMatchCount(tags) {
    if (!tags || tags.length === 0) return Data.COMPANIES.length;

    return Data.COMPANIES.filter(c => 
      tags.some(tag => 
        c.capabilities.some(cap => cap.includes(tag) || tag.includes(cap)) ||
        c.industry === tag || c.subIndustry === tag
      )
    ).length;
  },

  generateReplyDraft(intent) {
    const templates = [
      `您好！感谢您的合作意向。我们对您提出的${intent.cooperationType}需求非常感兴趣。\n\n关于${intent.description}，我们具备相关能力和经验，希望能进一步沟通细节。\n\n期待您的回复！`,
      `您好！收到您的合作意向，我们非常重视。\n\n针对您提出的需求：${intent.description}，我们有以下建议：\n1. 可以提供定制化方案\n2. 保证交货周期\n3. 提供优质售后服务\n\n请告知您方便沟通的时间，谢谢！`,
      `您好！很高兴收到您的合作邀请。\n\n我们仔细阅读了您的需求描述，认为双方有很好的合作基础。\n\n建议我们安排一次线上会议，详细讨论合作细节。\n\n期待与您合作！`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }
};

if (typeof module !== 'undefined') {
  module.exports = AIEngine;
}
