import { useState } from 'react';
import { FileText, Download, Calendar, Copy, Check, Plus, BarChart3, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store';

export function ReportsPage() {
  const { opportunities, trends } = useAppStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateComprehensiveReport = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const reportContent = `
# PainRadar 市场分析综合报告

生成时间: ${new Date().toISOString().split('T')[0]}

---

## 📊 概览

本次分析共扫描 ${opportunities.length} 个市场机会，覆盖以下类别：
${opportunities.map(o => `- ${o.category}`).join('\n')}

---

## 🔥 热门趋势

${trends.map((trend, idx) => `### ${idx + 1}. ${trend.title}
- 类别: ${trend.category}
- 增长率: +${trend.growthRate}%
- 讨论量: ${(trend.volume / 1000).toFixed(1)}K
- 热门关键词: ${trend.keywords.join(', ')}`).join('\n\n')}

---

## 💎 高潜力机会推荐

${opportunities
  .filter(o => o.potential === 'very_high' || o.potential === 'high')
  .map((o, idx) => `### ${idx + 1}. ${o.title}
- 类别: ${o.category}
- 验证得分: ${o.validationScore}%
- 痛度指数: ${o.painLevel}%
- 竞争程度: ${o.competitionLevel}%
- 提及次数: ${o.mentions}
- 潜力评级: ${o.potential}
- 市场规模: ${o.marketDetail.size}
- 预期年收入: ${o.monetizationDetail.expectedRevenue.month12}

描述: ${o.description}`).join('\n\n')}

---

## 📈 数据统计

### 痛度分布
- 高痛度(&gt;80%): ${opportunities.filter(o => o.painLevel > 80).length} 个
- 中痛度(60-80%): ${opportunities.filter(o => o.painLevel >= 60 && o.painLevel <= 80).length} 个
- 低痛度(&lt;60%): ${opportunities.filter(o => o.painLevel < 60).length} 个

### 竞争分布
- 低竞争(&lt;40%): ${opportunities.filter(o => o.competitionLevel < 40).length} 个
- 中竞争(40-60%): ${opportunities.filter(o => o.competitionLevel >= 40 && o.competitionLevel <= 60).length} 个
- 高竞争(&gt;60%): ${opportunities.filter(o => o.competitionLevel > 60).length} 个

### 潜力分布
- 极高潜力: ${opportunities.filter(o => o.potential === 'very_high').length} 个
- 高潜力: ${opportunities.filter(o => o.potential === 'high').length} 个
- 中潜力: ${opportunities.filter(o => o.potential === 'medium').length} 个
- 低潜力: ${opportunities.filter(o => o.potential === 'low').length} 个

---

## 💡 投资建议

### 强烈推荐 (竞争小、市场大、痛度高)
${opportunities
  .filter(o => o.competitionLevel <= 45 && o.painLevel >= 80 && o.marketDetail.size === 'large')
  .map(o => `- ${o.title} (验证得分: ${o.validationScore}%)`).join('\n') || '暂无符合条件的机会'}

### 值得关注
${opportunities
  .filter(o => o.validationScore >= 85 && o.potential === 'high')
  .map(o => `- ${o.title} (验证得分: ${o.validationScore}%)`).join('\n') || '暂无符合条件的机会'}

---

## 📝 数据来源

数据来源于以下平台：
- Reddit
- 小红书
- Twitter
- Product Hunt
- B站
- 抖音
- TikTok
- YouTube
- 知乎
- Hacker News
- LinkedIn
- 淘宝/亚马逊

---

**报告生成器**: PainRadar - AI全球产品机会挖掘引擎
**数据更新**: 实时

`.trim();

      const blob = new Blob([reportContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PainRadar-综合市场分析报告-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
      
      setIsGenerating(false);
    }, 2000);
  };

  const mockReports = [
    {
      id: '1',
      title: '2026年AI工具市场趋势分析报告',
      date: '2026-06-28',
      views: 1234,
      type: 'markdown',
      size: '25KB',
      opportunities: 15,
      highPotential: 8,
    },
    {
      id: '2',
      title: '独立开发者创业机会洞察',
      date: '2026-06-25',
      views: 856,
      type: 'markdown',
      size: '18KB',
      opportunities: 12,
      highPotential: 6,
    },
    {
      id: '3',
      title: '蓝海市场机会挖掘报告',
      date: '2026-06-20',
      views: 678,
      type: 'markdown',
      size: '32KB',
      opportunities: 20,
      highPotential: 10,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">报告中心</h2>
          <p className="text-gray-500 mt-1">生成和管理你的市场分析报告</p>
        </div>
        <button
          onClick={generateComprehensiveReport}
          disabled={isGenerating}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>生成中...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>生成综合报告</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{mockReports.length}</p>
              <p className="text-sm text-gray-500">已生成报告</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{opportunities.filter(o => o.potential === 'very_high').length}</p>
              <p className="text-sm text-gray-500">极高潜力机会</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{opportunities.length}</p>
              <p className="text-sm text-gray-500">扫描机会总数</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">我的报告</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-gray-500">总计 {mockReports.reduce((sum, r) => sum + r.views, 0)} 浏览</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {mockReports.map((report) => (
            <div key={report.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{report.title}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{report.date}</span>
                      </span>
                      <span className="text-xs text-gray-500">{report.size}</span>
                      <span className="tag tag-blue">{report.type.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">{report.views}</p>
                    <p className="text-xs text-gray-500">浏览</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-green-600">{report.highPotential}</p>
                    <p className="text-xs text-gray-500">高潜力</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopy(report.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {copiedId === report.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mockReports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">暂无报告</div>
            <p className="text-gray-500">点击上方按钮生成你的第一份分析报告</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">报告生成说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">报告内容</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>市场趋势分析</li>
              <li>高潜力机会推荐</li>
              <li>痛度与竞争分布</li>
              <li>投资建议</li>
            </ul>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">使用建议</span>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>定期生成报告跟踪趋势</li>
              <li>关注高潜力机会变化</li>
              <li>结合详细分析做决策</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
