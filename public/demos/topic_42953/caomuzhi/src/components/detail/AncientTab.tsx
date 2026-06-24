import { Quote, BookOpen, Scroll } from 'lucide-react';
import { Plant } from '@/types';

interface AncientTabProps {
  plant: Plant;
}

const AncientTab = ({ plant }: AncientTabProps) => {
  const ancient = plant.ancient;

  if (!ancient) {
    return (
      <div className="text-center py-12 text-text-medium">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>暂无古籍记载</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {ancient.benCaoGangMu && (
        <div className="relative p-6 bg-gradient-to-br from-plant-dark/5 to-plant-green/5 rounded-card border border-plant-green/10">
          <Quote className="absolute top-4 left-4 w-10 h-10 text-plant-green/20" />
          <div className="flex items-center gap-2 mb-3">
            <Scroll className="w-4 h-4 text-plant-green" />
            <span className="text-sm font-medium text-plant-green">《本草纲目》</span>
            <span className="text-xs text-text-medium">{ancient.benCaoGangMu.volume}</span>
          </div>
          <blockquote className="text-lg text-text-dark italic pl-8 border-l-4 border-plant-green">
            {ancient.benCaoGangMu.original}
          </blockquote>
          <p className="mt-3 pl-8 text-text-medium text-sm">
            {ancient.benCaoGangMu.translation}
          </p>
          {ancient.benCaoGangMu.usage && (
            <p className="mt-2 pl-8 text-sm text-plant-green">
              用法：{ancient.benCaoGangMu.usage}
            </p>
          )}
        </div>
      )}

      {ancient.shenNongBenCao && (
        <div className="p-4 bg-bg-beige rounded-card">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-accent-amber" />
            <span className="text-sm font-medium text-accent-amber">《神农本草经》</span>
            {ancient.shenNongBenCao.grade && (
              <span className="text-xs px-2 py-0.5 bg-accent-amber/20 text-accent-amber rounded-tag">
                {ancient.shenNongBenCao.grade}
              </span>
            )}
          </div>
          <blockquote className="text-text-dark italic mb-2">
            {ancient.shenNongBenCao.original}
          </blockquote>
          {ancient.shenNongBenCao.property && (
            <p className="text-sm text-text-medium">
              性味：{ancient.shenNongBenCao.property}
            </p>
          )}
          {ancient.shenNongBenCao.efficacy && (
            <p className="text-sm text-plant-green">
              功效：{ancient.shenNongBenCao.efficacy}
            </p>
          )}
        </div>
      )}

      {ancient.zhiWuMingShi && (
        <div className="p-4 bg-bg-beige rounded-card">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-plant-medium" />
            <span className="text-sm font-medium text-plant-medium">《植物名实图考》</span>
          </div>
          <blockquote className="text-text-dark italic mb-2">
            {ancient.zhiWuMingShi.original}
          </blockquote>
          {ancient.zhiWuMingShi.description && (
            <p className="text-sm text-text-medium">
              {ancient.zhiWuMingShi.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AncientTab;
