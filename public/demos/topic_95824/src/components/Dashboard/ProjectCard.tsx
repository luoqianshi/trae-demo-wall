import { useNavigate } from 'react-router-dom';
import { FileText, PenTool, Eye, Calendar, ArrowRight, MoreHorizontal } from 'lucide-react';
import { Project } from '../../types';
import { getStatusLabel, getStatusColor } from '../../utils/mockData';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    const color = getStatusColor(project.status);
    return (
      <span className={`badge ${color}`}>
        {getStatusLabel(project.status)}
      </span>
    );
  };

  const getProgress = () => {
    const progressMap: Record<string, number> = {
      draft: 10,
      analyzing: 30,
      designing: 60,
      reviewing: 80,
      completed: 100,
    };
    return progressMap[project.status] || 0;
  };

  return (
    <div 
      className="card cursor-pointer group animation-slide-up hover:shadow-lg hover:-translate-y-1"
      onClick={() => navigate(`/project/${project.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {project.name}
            </h3>
            {getStatusBadge()}
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {project.description}
      </p>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>项目进度</span>
          <span>{getProgress()}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${getProgress()}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {project.createdAt}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {project.analysis && (
            <button 
              onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}/analysis`); }}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              title="需求分析"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          {project.prototype && (
            <button 
              onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}/prototype`); }}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              title="原型设计"
            >
              <PenTool className="w-4 h-4" />
            </button>
          )}
          {project.prototype && (
            <button 
              onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}/preview`); }}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              title="预览"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};
