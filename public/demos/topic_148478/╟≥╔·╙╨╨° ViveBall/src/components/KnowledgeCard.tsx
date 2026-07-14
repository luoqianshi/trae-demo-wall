import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Knowledge } from '@/types';

interface KnowledgeCardProps {
  knowledge: Knowledge;
}

export function KnowledgeCard({ knowledge }: KnowledgeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 h-48 md:h-auto">
          <img
            src={knowledge.image}
            alt={knowledge.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="md:w-2/3 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">{knowledge.title}</h3>
          <p className={`text-gray-600 text-sm leading-relaxed transition-all duration-300 ${
            isExpanded ? 'max-h-48' : 'max-h-20'
          } overflow-hidden`}>
            {knowledge.content}
          </p>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            {isExpanded ? '收起' : '了解更多'}
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
