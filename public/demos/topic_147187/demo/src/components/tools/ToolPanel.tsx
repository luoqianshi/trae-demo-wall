import { useState } from 'react';
import { Image, BookOpen, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import { OCRTool } from './OCRTool';
import { DictionaryTool } from './DictionaryTool';
import { CalculatorTool } from './CalculatorTool';

type ToolType = 'ocr' | 'dictionary' | 'calculator' | null;

export const ToolPanel = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolType>(null);

  const tools = [
    { id: 'ocr' as const, icon: Image, label: 'OCR识别', color: 'blue' },
    { id: 'dictionary' as const, icon: BookOpen, label: '词典', color: 'green' },
    { id: 'calculator' as const, icon: Calculator, label: '计算器', color: 'orange' },
  ];

  const colorMap = {
    blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900/70',
    green: 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-400 dark:hover:bg-green-900/70',
    orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-900/70',
  };

  return (
    <div
      className={`bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full transition-all duration-300 ${
        isExpanded ? 'w-full lg:w-80' : 'w-14'
      }`}
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {isExpanded && <h3 className="font-semibold text-gray-800 dark:text-white text-sm">学习工具</h3>}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-auto"
        >
          {isExpanded ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      <div className="flex-1 p-3 overflow-auto">
        {!activeTool ? (
          <div className="space-y-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${colorMap[tool.color]}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && <span className="font-medium text-sm">{tool.label}</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-full">
            {activeTool === 'ocr' && <OCRTool onClose={() => setActiveTool(null)} />}
            {activeTool === 'dictionary' && (
              <DictionaryTool onClose={() => setActiveTool(null)} />
            )}
            {activeTool === 'calculator' && (
              <CalculatorTool onClose={() => setActiveTool(null)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};