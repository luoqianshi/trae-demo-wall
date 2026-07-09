import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  PenTool, 
  Eye, 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Brain,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { useProjectStore } from '../store/projectStore';
import { getStatusLabel, getStatusColor } from '../utils/mockData';

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  
  const project = projects.find(p => p.id === id);

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">项目不存在</p>
      </div>
    );
  }

  const steps = [
    { 
      id: 'analysis', 
      title: '需求分析', 
      icon: Brain, 
      status: project.analysis ? 'completed' : project.requirement ? 'in-progress' : 'pending',
      action: () => navigate(`/project/${id}/analysis`),
      description: project.analysis ? `${project.analysis.features.length} 个功能点` : project.requirement ? '正在分析中' : '请输入需求',
    },
    { 
      id: 'prototype', 
      title: '原型设计', 
      icon: PenTool, 
      status: project.prototype ? 'completed' : project.analysis ? 'in-progress' : 'pending',
      action: () => navigate(`/project/${id}/prototype`),
      description: project.prototype ? `${project.prototype.pages[0]?.components.length || 0} 个组件` : project.analysis ? '可以生成原型' : '完成分析后生成',
    },
    { 
      id: 'preview', 
      title: '预览分享', 
      icon: Eye, 
      status: project.prototype ? 'completed' : 'pending',
      action: () => navigate(`/project/${id}/preview`),
      description: project.prototype ? '已生成可预览原型' : '完成设计后预览',
    },
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'in-progress') return <Clock className="w-5 h-5 text-yellow-500" />;
    return <AlertCircle className="w-5 h-5 text-gray-300" />;
  };

  const getStatusLine = (index: number) => {
    if (index === steps.length - 1) return null;
    const currentStatus = steps[index].status;
    const nextStatus = steps[index + 1].status;
    
    if (currentStatus === 'completed' && (nextStatus === 'completed' || nextStatus === 'in-progress')) {
      return <div className="absolute top-6 left-8 w-8 h-0.5 bg-green-500"></div>;
    }
    return <div className="absolute top-6 left-8 w-8 h-0.5 bg-gray-200"></div>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={project.name} subtitle="项目详情" />
      
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate('/')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className={`badge ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {project.createdAt}
                </span>
              </div>
            </div>
          </div>

          <div className="card mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">项目描述</h3>
            <p className="text-gray-600">{project.description}</p>
          </div>

          <div className="card mb-8">
            <h3 className="font-semibold text-gray-900 mb-6">项目流程</h3>
            <div className="relative">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-6 mb-8 last:mb-0 relative">
                  {getStatusLine(index)}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.status === 'completed' ? 'bg-green-100' : 
                    step.status === 'in-progress' ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <step.icon className={`w-6 h-6 ${
                        step.status === 'in-progress' ? 'text-yellow-600' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${
                        step.status === 'completed' ? 'text-green-700' : 
                        step.status === 'in-progress' ? 'text-yellow-700' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </h4>
                      {step.status !== 'pending' && (
                        <button 
                          onClick={step.action}
                          className="btn-primary text-sm flex items-center gap-1"
                        >
                          查看
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {project.analysis && (
            <div className="card mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">分析摘要</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">{project.analysis.features.length}</p>
                  <p className="text-sm text-blue-500">功能点</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">{project.analysis.userStories.length}</p>
                  <p className="text-sm text-green-500">用户故事</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-purple-600">{project.analysis.businessRules.length}</p>
                  <p className="text-sm text-purple-500">业务规则</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-orange-600">{project.analysis.entities.length}</p>
                  <p className="text-sm text-orange-500">数据实体</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => navigate(`/project/${id}/analysis`)}
              className="card text-left group hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">需求分析</h4>
              <p className="text-sm text-gray-500">AI智能分析需求，提取功能点和用户故事</p>
            </button>

            <button 
              onClick={() => navigate(`/project/${id}/prototype`)}
              className="card text-left group hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <PenTool className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">原型设计</h4>
              <p className="text-sm text-gray-500">可视化拖拽编辑，快速构建界面原型</p>
            </button>

            <button 
              onClick={() => navigate(`/project/${id}/preview`)}
              className="card text-left group hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">预览分享</h4>
              <p className="text-sm text-gray-500">全屏预览原型，分享给团队和客户</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
