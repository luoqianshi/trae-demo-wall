import { useState } from 'react';
import { Lightbulb, CheckCircle, AlertCircle, Target, Code, DollarSign } from 'lucide-react';
import { useAppStore } from '../../store';

export function ValidatorPage() {
  const { validationResult, validateIdea } = useAppStore();
  const [inputIdea, setInputIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!inputIdea.trim()) return;
    setIsLoading(true);
    await validateIdea(inputIdea);
    setIsLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">想法验证器</h2>
        <p className="text-gray-500 mt-1">输入你的想法，AI帮你评估市场潜力</p>
      </div>

      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-accent-600" />
          <h3 className="font-semibold text-gray-900">输入你的产品想法</h3>
        </div>

        <textarea
          value={inputIdea}
          onChange={(e) => setInputIdea(e.target.value)}
          placeholder="例如：一个AI驱动的社交媒体内容自动发布工具..."
          className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-32 text-gray-900"
        />

        <button
          onClick={handleSubmit}
          disabled={!inputIdea.trim() || isLoading}
          className="mt-4 btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>AI分析中...</span>
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4" />
              <span>开始验证</span>
            </>
          )}
        </button>
      </div>

      {validationResult && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getScoreBg(validationResult.validationScore)}`}>
                <span className={`text-3xl font-bold ${getScoreColor(validationResult.validationScore)}`}>
                  {validationResult.validationScore}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">验证得分</h3>
                <p className="text-gray-500">{validationResult.idea}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-primary-600" />
                  <span className="text-sm text-gray-500">市场规模</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {validationResult.marketSize === 'large' ? '大' : 
                   validationResult.marketSize === 'medium' ? '中' : '小'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Code className="w-4 h-4 text-accent-600" />
                  <span className="text-sm text-gray-500">MVP可行性</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{validationResult.mvpFeasibility}%</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-500">竞争程度</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{validationResult.competitionAnalysis.existingSolutions} 竞品</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">竞争分析</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">现有解决方案</span>
                  <span className="font-semibold text-gray-900">{validationResult.competitionAnalysis.existingSolutions} 个</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">竞品平均评分</span>
                  <span className="font-semibold text-gray-900">{validationResult.competitionAnalysis.avgRating} / 5</span>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500 mb-2 block">市场缺口</span>
                  <ul className="space-y-2">
                    {validationResult.competitionAnalysis.gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">建议功能</h3>
              <ul className="space-y-2">
                {validationResult.suggestedFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">变现策略建议</h3>
            <div className="flex flex-wrap gap-3">
              {validationResult.monetizationStrategy.map((strategy, idx) => (
                <span key={idx} className="tag tag-blue">{strategy}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
