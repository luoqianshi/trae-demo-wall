import { useState } from 'react';
import { X, Star, TrendingUp, Users, Globe, DollarSign, Briefcase, Calendar, Link, ExternalLink, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Download, Target, TrendingDown, BarChart2, Play, Wrench, Rocket } from 'lucide-react';
import { Opportunity } from '../../types';
import { useAppStore } from '../../store';

interface OpportunityDetailProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export function OpportunityDetail({ opportunity, onClose }: OpportunityDetailProps) {
  const { favorites, toggleFavorite } = useAppStore();
  const isFavorite = favorites.includes(opportunity.id);
  const [activeTab, setActiveTab] = useState<'analysis' | 'steps' | 'sources'>('analysis');
  const [expandedStrategies, setExpandedStrategies] = useState<string[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['validation', 'mvp']);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const [showMarketDetail, setShowMarketDetail] = useState(false);
  const [showMonetizationDetail, setShowMonetizationDetail] = useState(false);

  const toggleStrategy = (name: string) => {
    setExpandedStrategies(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => 
      prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase]
    );
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev => 
      prev.includes(stepNumber) ? prev.filter(n => n !== stepNumber) : [...prev, stepNumber]
    );
  };

  const getPainLevelColor = (level: number) => {
    if (level >= 80) return 'text-red-600 bg-red-50';
    if (level >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getCompetitionColor = (level: number) => {
    if (level <= 40) return 'text-green-600 bg-green-50';
    if (level <= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'very_high': return 'text-green-600';
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'social': return '🌐';
      case 'video': return '📹';
      case 'news': return '📰';
      case 'developer': return '💻';
      case 'ecommerce': return '🛒';
      case 'blog': return '📝';
      case 'forum': return '💬';
      case 'live': return '🎬';
      case 'search': return '🔍';
      default: return '🌐';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'validation': return <Target className="w-5 h-5" />;
      case 'mvp': return <Wrench className="w-5 h-5" />;
      case 'growth': return <Rocket className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const generateReport = () => {
    const reportContent = `# PainRadar 机会分析报告

## ${opportunity.title}

### 基本信息
- 类别: ${opportunity.category}
- 验证得分: ${opportunity.validationScore}%
- 痛度指数: ${opportunity.painLevel}%
- 竞争程度: ${opportunity.competitionLevel}%
- 潜力评级: ${opportunity.potential === 'very_high' ? '极高潜力' : opportunity.potential === 'high' ? '高潜力' : opportunity.potential === 'medium' ? '中潜力' : '低潜力'}
- 提及次数: ${opportunity.mentions.toLocaleString()}

### 需求描述
${opportunity.description}

### 标签
${opportunity.tags.join(', ')}

### 数据来源统计
- 总来源数: ${opportunity.dataSources.length}个
${opportunity.sourceDistribution?.map(d => `- ${d.typeLabel}: ${d.count}条 (${d.percentage}%)`).join('\n') || ''}

### 实施步骤
${opportunity.implementationSteps.map(phase => `
#### ${phase.phaseName} (${phase.duration})
${phase.steps.map(step => `
##### 步骤${step.number}: ${step.title}
${step.description}

**所需工具:**
${step.tools.map(t => `- ${t.name} (${t.type}) - ${t.url} - ${t.cost}`).join('\n')}

**参考资源:**
${step.resources.map(r => `- ${r}`).join('\n')}
`).join('\n')}
`).join('\n')}

### 市场分析
- 市场规模: ${opportunity.marketDetail.size === 'large' ? '大型市场' : opportunity.marketDetail.size === 'medium' ? '中型市场' : '小型市场'}
- 市场价值: ${opportunity.marketDetail.marketValue}
- 增长率: +${opportunity.marketDetail.growthRate}%
- 目标用户: ${opportunity.marketDetail.targetUsers.join(', ')}

**关键数据:**
${opportunity.marketDetail.keyStatistics.map(s => `- ${s.label}: ${s.value}${s.unit} (来源: ${s.source})`).join('\n')}

### 变现策略
${opportunity.monetizationDetail.strategies.map(s => `
#### ${s.name}
${s.description}

预期转化率: ${s.expectedConversion}

优点: ${s.pros.join(', ')}
缺点: ${s.cons.join(', ')}

实施步骤:
${s.implementationSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

所需工具:
${s.tools.map(t => `- ${t.name} - ${t.url}`).join('\n')}
`).join('\n')}

### 定价方案
${opportunity.monetizationDetail.pricingModel.tiers.map(t => `- ${t.name}: ${t.price} - ${t.targetUsers}`).join('\n')}

推荐方案: ${opportunity.monetizationDetail.pricingModel.recommendedTier}

### 预期收入
- 第1月: ${opportunity.monetizationDetail.expectedRevenue.month1}
- 第3月: ${opportunity.monetizationDetail.expectedRevenue.month3}
- 第6月: ${opportunity.monetizationDetail.expectedRevenue.month6}
- 第12月: ${opportunity.monetizationDetail.expectedRevenue.month12}

假设条件: ${opportunity.monetizationDetail.expectedRevenue.assumptions.join(', ')}

---
Generated by PainRadar - AI全球产品机会挖掘引擎
`.trim();

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PainRadar-${opportunity.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="tag tag-blue">{opportunity.category}</span>
            <button
              onClick={() => toggleFavorite(opportunity.id)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
              }`}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={generateReport}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>下载报告</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{opportunity.title}</h1>
          <p className="text-gray-600 mb-6">{opportunity.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <TrendingUp className="w-4 h-4 text-primary-600" />
              </div>
              <span className="text-xl font-bold text-primary-600">{opportunity.validationScore}%</span>
              <p className="text-xs text-gray-500">验证得分</p>
            </div>

            <div className={`rounded-xl p-3 text-center ${getPainLevelColor(opportunity.painLevel)}`}>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold">{opportunity.painLevel}%</span>
              <p className="text-xs">痛度指数</p>
            </div>

            <div className={`rounded-xl p-3 text-center ${getCompetitionColor(opportunity.competitionLevel)}`}>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold">{opportunity.competitionLevel}%</span>
              <p className="text-xs">竞争程度</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <BarChart2 className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-xl font-bold text-gray-900">{opportunity.mentions.toLocaleString()}</span>
              <p className="text-xs text-gray-500">提及次数</p>
            </div>

            <div className={`rounded-xl p-3 text-center ${getPotentialColor(opportunity.potential)} bg-green-50`}>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold">
                {opportunity.potential === 'very_high' ? '极高' : 
                 opportunity.potential === 'high' ? '高' : 
                 opportunity.potential === 'medium' ? '中' : '低'}
              </span>
              <p className="text-xs">潜力</p>
            </div>
          </div>

          {/* 来源分布 */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">数据来源分布</span>
              <span className="text-sm text-gray-500">{opportunity.dataSources.length}个来源</span>
            </div>
            <div className="flex items-center space-x-1 mb-3">
              {opportunity.sourceDistribution?.map((dist) => (
                <div 
                  key={dist.type}
                  className={`h-3 rounded-full ${dist.color}`}
                  style={{ width: `${dist.percentage}%`, minWidth: '12px' }}
                  title={`${dist.typeLabel}: ${dist.count}条 (${dist.percentage}%)`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {opportunity.sourceDistribution?.map((dist) => (
                <div key={dist.type} className="flex items-center space-x-2">
                  <span className="text-lg">{getSourceTypeIcon(dist.type)}</span>
                  <span className="text-sm text-gray-600">{dist.typeLabel}</span>
                  <span className="text-sm font-bold text-gray-900">{dist.count}</span>
                  <span className="text-xs text-gray-400">({dist.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analysis' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              详细分析
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'steps' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              实施步骤
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sources' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              数据来源
            </button>
          </div>

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* 市场分析 */}
              <div className="card">
                <button 
                  onClick={() => setShowMarketDetail(!showMarketDetail)}
                  className="w-full flex items-center justify-between"
                >
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-primary-600" />
                    <span>市场分析</span>
                  </h3>
                  {showMarketDetail ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                
                {showMarketDetail ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <span className="text-sm text-gray-500 mb-2 block">市场规模</span>
                      <span className={`text-lg font-semibold ${
                        opportunity.marketDetail.size === 'large' ? 'text-green-600' :
                        opportunity.marketDetail.size === 'medium' ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {opportunity.marketDetail.size === 'large' ? '大型市场' :
                         opportunity.marketDetail.size === 'medium' ? '中型市场' : '小型市场'}
                      </span>
                      <p className="text-gray-600 mt-1">{opportunity.marketDetail.sizeDescription}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-sm text-gray-500">市场价值</span>
                        <p className="text-lg font-bold text-gray-900">{opportunity.marketDetail.marketValue}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <span className="text-sm text-gray-500">年增长率</span>
                        <p className="text-lg font-bold text-green-600">+{opportunity.marketDetail.growthRate}%</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500 mb-2 block">目标用户</span>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.marketDetail.targetUsers.map((user, idx) => (
                          <span key={idx} className="tag bg-gray-100 text-gray-600">{user}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500 mb-2 block">用户画像</span>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-xs text-gray-500">年龄</span>
                          <p className="text-sm font-medium text-gray-900">{opportunity.marketDetail.demographics.ageRange}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-xs text-gray-500">地区</span>
                          <p className="text-sm font-medium text-gray-900">{opportunity.marketDetail.demographics.location.join(', ')}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-xs text-gray-500">收入</span>
                          <p className="text-sm font-medium text-gray-900">{opportunity.marketDetail.demographics.incomeLevel.join(', ')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <span className="text-sm text-blue-600 mb-3 block font-medium">关键数据</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {opportunity.marketDetail.keyStatistics.map((stat, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500">{stat.label}</p>
                            <p className="text-xl font-bold text-gray-900">{stat.value}<span className="text-sm font-normal text-gray-500">{stat.unit}</span></p>
                            <p className="text-xs text-gray-400">{stat.source}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">点击展开查看详细市场分析</p>
                )}
              </div>

              {/* 变现策略 */}
              <div className="card">
                <button 
                  onClick={() => setShowMonetizationDetail(!showMonetizationDetail)}
                  className="w-full flex items-center justify-between"
                >
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span>变现策略</span>
                  </h3>
                  {showMonetizationDetail ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                
                {showMonetizationDetail ? (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-4">
                      {opportunity.monetizationDetail.strategies.map((strategy) => (
                        <div key={strategy.name} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleStrategy(strategy.name)}
                            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <Briefcase className="w-5 h-5 text-primary-600" />
                              <span className="font-medium text-gray-900">{strategy.name}</span>
                              <span className="tag tag-blue">{strategy.expectedConversion}</span>
                            </div>
                            {expandedStrategies.includes(strategy.name) ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </button>

                          {expandedStrategies.includes(strategy.name) && (
                            <div className="px-4 py-4 space-y-4">
                              <p className="text-gray-600">{strategy.description}</p>

                              <div>
                                <span className="text-sm text-gray-500 mb-2 block font-medium">实施步骤</span>
                                <ol className="space-y-2">
                                  {strategy.implementationSteps.map((step, idx) => (
                                    <li key={idx} className="flex items-start space-x-2">
                                      <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                                      <span className="text-sm text-gray-700">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>

                              <div>
                                <span className="text-sm text-gray-500 mb-2 block font-medium">所需工具</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {strategy.tools.map((tool) => (
                                    <div key={tool.name} className="bg-gray-50 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-900 text-sm">{tool.name}</span>
                                        <span className="text-xs text-gray-500">{tool.type}</span>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2">{tool.description}</p>
                                      <div className="flex items-center justify-between">
                                        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 flex items-center space-x-1 hover:underline">
                                          <Link className="w-3 h-3" />
                                          <span>获取工具</span>
                                        </a>
                                        <span className="text-xs text-gray-500">{tool.cost}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 rounded-lg p-3">
                                  <span className="text-xs text-green-600 mb-1 block font-medium">优点</span>
                                  <ul className="space-y-1">
                                    {strategy.pros.map((pro, idx) => (
                                      <li key={idx} className="text-xs text-green-700 flex items-center space-x-1">
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                        <span>{pro}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3">
                                  <span className="text-xs text-red-600 mb-1 block font-medium">缺点</span>
                                  <ul className="space-y-1">
                                    {strategy.cons.map((con, idx) => (
                                      <li key={idx} className="text-xs text-red-700 flex items-center space-x-1">
                                        <AlertCircle className="w-3 h-3 text-red-500" />
                                        <span>{con}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-4">定价方案</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {opportunity.monetizationDetail.pricingModel.tiers.map((tier) => (
                          <div key={tier.name} className={`rounded-xl p-4 border-2 ${
                            tier.name === opportunity.monetizationDetail.pricingModel.recommendedTier
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-100'
                          }`}>
                            {tier.name === opportunity.monetizationDetail.pricingModel.recommendedTier && (
                              <span className="tag bg-green-100 text-green-600 mb-2 inline-block">推荐</span>
                            )}
                            <h5 className="font-semibold text-gray-900">{tier.name}</h5>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{tier.price}</p>
                            <p className="text-xs text-gray-500 mt-1">{tier.targetUsers}</p>
                            <ul className="mt-3 space-y-2">
                              {tier.features.map((feature, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-center space-x-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-4">预期收入</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-xs text-gray-500">第1月</p>
                          <p className="text-xl font-bold text-gray-900">{opportunity.monetizationDetail.expectedRevenue.month1}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-xs text-gray-500">第3月</p>
                          <p className="text-xl font-bold text-gray-900">{opportunity.monetizationDetail.expectedRevenue.month3}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-xs text-gray-500">第6月</p>
                          <p className="text-xl font-bold text-gray-900">{opportunity.monetizationDetail.expectedRevenue.month6}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <p className="text-xs text-gray-500">第12月</p>
                          <p className="text-xl font-bold text-green-600">{opportunity.monetizationDetail.expectedRevenue.month12}</p>
                        </div>
                      </div>
                      <div className="mt-4 bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600">
                          <span className="font-medium">假设条件:</span> {opportunity.monetizationDetail.expectedRevenue.assumptions.join(' | ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">点击展开查看详细变现策略</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-4">
              {opportunity.implementationSteps.map((phase) => (
                <div key={phase.phase} className="card">
                  <button 
                    onClick={() => togglePhase(phase.phase)}
                    className="w-full flex items-center justify-between mb-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        phase.phase === 'validation' ? 'bg-blue-100 text-blue-600' :
                        phase.phase === 'mvp' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {getPhaseIcon(phase.phase)}
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{phase.phaseName}</h3>
                        <p className="text-sm text-gray-500">预计时长: {phase.duration}</p>
                      </div>
                    </div>
                    {expandedPhases.includes(phase.phase) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedPhases.includes(phase.phase) && (
                    <div className="space-y-4 pl-13">
                      {phase.steps.map((step) => (
                        <div key={step.number} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                              {step.number}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{step.title}</h4>
                                <button
                                  onClick={() => toggleStep(step.number)}
                                  className="text-primary-600 hover:text-primary-700 text-sm"
                                >
                                  {expandedSteps.includes(step.number) ? '收起' : '展开'}
                                </button>
                              </div>
                              <p className="text-gray-600 text-sm mb-4">{step.description}</p>

                              {expandedSteps.includes(step.number) && (
                                <>
                                  <div className="mb-4">
                                    <span className="text-sm text-gray-500 mb-2 block font-medium">所需工具</span>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {step.tools.map((tool) => (
                                        <div key={tool.name} className="bg-white rounded-lg p-3 border border-gray-100">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-gray-900 text-sm">{tool.name}</span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{tool.type}</span>
                                          </div>
                                          <p className="text-xs text-gray-600 mb-2">{tool.description}</p>
                                          <div className="flex items-center justify-between">
                                            <a 
                                              href={tool.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="text-xs text-primary-600 flex items-center space-x-1 hover:underline"
                                            >
                                              <ExternalLink className="w-3 h-3" />
                                              <span>访问</span>
                                            </a>
                                            <span className="text-xs text-gray-500">{tool.cost}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {step.resources && step.resources.length > 0 && (
                                    <div>
                                      <span className="text-sm text-gray-500 mb-2 block font-medium">参考资源</span>
                                      <div className="space-y-1">
                                        {step.resources.map((resource, idx) => (
                                          <a
                                            key={idx}
                                            href={resource.split(' - ')[0]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1 hover:underline"
                                          >
                                            <Link className="w-3 h-3" />
                                            <span>{resource.includes(' - ') ? resource.split(' - ')[1] : resource}</span>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">数据来源分布</span>
                <span className="text-sm font-medium text-gray-900">{opportunity.dataSources.length} 个来源</span>
              </div>

              {/* 来源类型统计 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-1 mb-3">
                  {opportunity.sourceDistribution?.map((dist) => (
                    <div 
                      key={dist.type}
                      className={`h-3 rounded-full ${dist.color}`}
                      style={{ width: `${dist.percentage}%`, minWidth: '12px' }}
                      title={`${dist.typeLabel}: ${dist.count}条 (${dist.percentage}%)`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {opportunity.sourceDistribution?.map((dist) => (
                    <div key={dist.type} className="flex items-center space-x-2">
                      <span className="text-lg">{getSourceTypeIcon(dist.type)}</span>
                      <div>
                        <p className="text-sm text-gray-600">{dist.typeLabel}</p>
                        <p className="text-xs font-medium text-gray-900">{dist.count}条</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunity.dataSources.map((source, idx) => (
                  <div key={idx} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                          <span className="text-lg">{getSourceTypeIcon(source.platformType)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{source.platform}</p>
                          <p className="text-xs text-gray-500 flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{source.postDate}</span>
                          </p>
                        </div>
                      </div>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{source.excerpt}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">作者</p>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{source.author}</p>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{source.engagement.comments}</p>
                          <p className="text-xs text-gray-500">评论</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{source.engagement.likes.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">点赞</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{source.engagement.shares.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">分享</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className={`tag ${
                        source.sentiment === 'negative' ? 'bg-red-50 text-red-600' :
                        source.sentiment === 'positive' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {source.sentiment === 'negative' ? '😤 负面反馈' :
                         source.sentiment === 'positive' ? '😊 正面反馈' : '😐 中性'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
