import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Rocket, 
  Clock, 
  CheckCircle2,
  Plus,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { ProjectCard } from '../components/Dashboard/ProjectCard';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { useProjectStore } from '../store/projectStore';

export const HomePage = () => {
  const navigate = useNavigate();
  const { projects, loadProjects } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { 
      title: '项目总数', 
      value: projects.length, 
      icon: FolderKanban, 
      color: 'bg-primary-100 text-primary-600',
      trend: '+2 本周',
      trendType: 'up' as const
    },
    { 
      title: '进行中', 
      value: projects.filter(p => p.status !== 'completed').length, 
      icon: Rocket, 
      color: 'bg-secondary-100 text-secondary-600' 
    },
    { 
      title: '平均用时', 
      value: '2.5天', 
      icon: Clock, 
      color: 'bg-blue-100 text-blue-600',
      trend: '-15%',
      trendType: 'down' as const
    },
    { 
      title: '已完成', 
      value: projects.filter(p => p.status === 'completed').length, 
      icon: CheckCircle2, 
      color: 'bg-green-100 text-green-600' 
    },
  ];

  const recentProjects = projects.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="仪表盘" subtitle="查看项目概览和统计" />
      
      <main className="p-6">
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">AI驱动的智能原型设计</span>
              </div>
              <h2 className="text-3xl font-bold mb-3">
                快速完成需求分析与原型设计
              </h2>
              <p className="text-white/80 mb-6 max-w-lg">
                输入需求描述，AI自动分析功能点、用户故事和业务规则，一键生成可交互原型。
              </p>
              <button 
                onClick={() => navigate('/new')}
                className="px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                开始新项目
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">我的项目</h3>
            <p className="text-sm text-gray-500">查看和管理您的所有项目</p>
          </div>
          <button 
            onClick={() => navigate('/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建项目
          </button>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <FolderKanban className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无项目</h3>
            <p className="text-gray-500 mb-6">创建您的第一个项目，开始智能需求分析</p>
            <button 
              onClick={() => navigate('/new')}
              className="btn-primary"
            >
              新建项目
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
