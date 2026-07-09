import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Zap, 
  Users, 
  FileText, 
  Database, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Loader2,
  Workflow
} from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { useProjectStore } from '../store/projectStore';
import { analyzeRequirement } from '../utils/analyzer';
import { generatePrototype } from '../utils/generator';
import { generateFlowchart, generateNutritionFlowchart } from '../utils/flowchartGenerator';
import { FlowchartView } from '../components/FlowchartView';
import { Flowchart } from '../types';

export const RequirementAnalysisPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, setCurrentProject, setRequirement, setAnalysis, setPrototype } = useProjectStore();
  
  const project = projects.find(p => p.id === id);
  const [requirement, setRequirementText] = useState(project?.requirement || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingFlowchart, setIsGeneratingFlowchart] = useState(false);
  const [flowchart, setFlowchart] = useState<Flowchart | null>(null);

  useEffect(() => {
    if (project) {
      setCurrentProject(project);
      setRequirementText(project.requirement || '');
    }
  }, [project, setCurrentProject]);

  const handleAnalyze = async () => {
    if (!requirement.trim()) return;
    
    setIsAnalyzing(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysis = analyzeRequirement(requirement);
    setAnalysis(id!, analysis);
    
    setIsAnalyzing(false);
  };

  const handleGeneratePrototype = async () => {
    if (!project?.analysis) return;
    
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const prototype = generatePrototype(project.analysis);
    setPrototype(id!, prototype);
    
    setIsGenerating(false);
    navigate(`/project/${id}/prototype`);
  };

  const handleGenerateFlowchart = async () => {
    if (!project?.analysis) return;
    
    setIsGeneratingFlowchart(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (id === '5') {
      setFlowchart(generateNutritionFlowchart());
    } else {
      setFlowchart(generateFlowchart(project.analysis));
    }
    
    setIsGeneratingFlowchart(false);
  };

  const handleSaveRequirement = () => {
    setRequirement(id!, requirement);
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">项目不存在</p>
      </div>
    );
  }

  const analysis = project.analysis;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="需求分析" subtitle={project.name} />
      
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">需求描述</h3>
                  <p className="text-sm text-gray-500">输入项目需求，AI将自动分析</p>
                </div>
              </div>
              <button 
                onClick={handleSaveRequirement}
                className="btn-secondary text-sm"
              >
                保存
              </button>
            </div>

            <textarea
              value={requirement}
              onChange={(e) => setRequirementText(e.target.value)}
              placeholder="请详细描述您的项目需求..."
              rows={10}
              className="input-field resize-none font-mono text-sm"
            />

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {requirement.length} 字符
              </p>
              <button 
                onClick={handleAnalyze}
                disabled={!requirement.trim() || isAnalyzing}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    智能分析
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {analysis && (
              <>
                <div className="card animation-slide-up">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-secondary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">功能点</h3>
                      <p className="text-sm text-gray-500">提取的核心功能模块</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {analysis.features.map((feature) => (
                      <div 
                        key={feature.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{feature.name}</span>
                          <span className={`badge ${
                            feature.priority === 'high' ? 'badge-high' :
                            feature.priority === 'medium' ? 'badge-medium' : 'badge-low'
                          }`}>
                            {feature.priority === 'high' ? '高' : feature.priority === 'medium' ? '中' : '低'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card animation-slide-up">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">用户故事</h3>
                      <p className="text-sm text-gray-500">基于需求生成的用户场景</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {analysis.userStories.map((story) => (
                      <div 
                        key={story.id}
                        className="p-4 bg-blue-50 rounded-lg border border-blue-100"
                      >
                        <p className="text-sm">
                          <span className="font-medium text-blue-700">{story.role}</span>
                          想要 <span className="font-medium text-gray-900">{story.want}</span>
                          ，以便 <span className="text-gray-600">{story.reason}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card animation-slide-up">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">业务规则</h3>
                      <p className="text-sm text-gray-500">识别的业务约束和规则</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {analysis.businessRules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card animation-slide-up">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Database className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">实体关系</h3>
                      <p className="text-sm text-gray-500">识别的核心数据实体</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {analysis.entities.map((entity) => (
                      <div 
                        key={entity.id}
                        className="p-4 bg-purple-50 rounded-lg border border-purple-100"
                      >
                        <p className="font-medium text-purple-700 mb-2">{entity.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {entity.attributes.map((attr, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-white rounded text-xs text-gray-600 border border-purple-200"
                            >
                              {attr.name}: {attr.type}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card animation-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Workflow className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">业务流程图</h3>
                        <p className="text-sm text-gray-500">可视化展示业务流程</p>
                      </div>
                    </div>
                    {!flowchart && (
                      <button
                        onClick={handleGenerateFlowchart}
                        disabled={isGeneratingFlowchart}
                        className="btn-secondary text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingFlowchart ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Workflow className="w-4 h-4" />
                            生成流程图
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {flowchart ? (
                    <FlowchartView flowchart={flowchart} />
                  ) : isGeneratingFlowchart ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">正在生成业务流程图...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Workflow className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">点击上方按钮生成业务流程图</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleGeneratePrototype}
                  disabled={isGenerating}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成原型中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      一键生成原型
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}

            {!analysis && !isAnalyzing && (
              <div className="card text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">开始智能分析</h3>
                <p className="text-gray-500 mb-6">
                  在左侧输入需求描述，点击"智能分析"按钮，AI将自动提取功能点、用户故事和业务规则
                </p>
                <button 
                  onClick={handleAnalyze}
                  disabled={!requirement.trim()}
                  className="btn-primary flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Brain className="w-4 h-4" />
                  智能分析
                </button>
              </div>
            )}

            {isAnalyzing && (
              <div className="card text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI分析中...</h3>
                <p className="text-gray-500">正在提取功能点、用户故事和业务规则</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
