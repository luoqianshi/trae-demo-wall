import { useState } from 'react';
import { Pencil, Eraser, Type, Square, Circle, Minus, Trash2, Download, Undo2, Redo2, MoreHorizontal } from 'lucide-react';
import { useWhiteboardStore, ToolType } from '../../stores/whiteboardStore';

const tools: { icon: typeof Pencil; tool: ToolType; label: string }[] = [
  { icon: Pencil, tool: 'pen', label: '画笔' },
  { icon: Eraser, tool: 'eraser', label: '橡皮擦' },
  { icon: Type, tool: 'text', label: '文字' },
  { icon: Square, tool: 'rectangle', label: '矩形' },
  { icon: Circle, tool: 'circle', label: '圆形' },
  { icon: Minus, tool: 'line', label: '直线' },
];

const colors = ['#6366f1', '#ef4444', '#22c55e', '#eab308', '#14b8a6', '#f43f5e', '#1e293b'];

const sizes = [2, 4, 6, 8];

export const WhiteboardToolbar = () => {
  const { currentTool, toolColor, toolSize, setTool, setColor, setSize, clearCanvas } = useWhiteboardStore();
  const [showColors, setShowColors] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-2 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {tools.map(({ icon: Icon, tool, label }) => (
            <button
              key={tool}
              onClick={() => setTool(tool)}
              className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                currentTool === tool
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button
            onClick={() => setShowColors(!showColors)}
            className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: toolColor }}
          />
          <button
            onClick={() => setShowMore(!showMore)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showColors && (
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-3 py-2 flex items-center gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => { setColor(color); setShowColors(false); }}
              className={`w-7 h-7 rounded-full transition-all ${
                toolColor === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSize(size)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                toolSize === size
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <div className="rounded-full bg-current" style={{ width: size * 1.5, height: size * 1.5 }} />
            </button>
          ))}
        </div>
      )}

      {showMore && (
        <div className="lg:hidden absolute right-2 top-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-30">
          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
            <Undo2 className="w-4 h-4" /> 撤销
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
            <Redo2 className="w-4 h-4" /> 重做
          </button>
          <button
            onClick={() => { clearCanvas(); setShowMore(false); }}
            className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> 清空画布
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> 导出
          </button>
        </div>
      )}

      <div className="hidden lg:flex bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 items-center justify-between">
        <div className="flex items-center gap-1">
          {tools.map(({ icon: Icon, tool, label }) => (
            <button
              key={tool}
              onClick={() => setTool(tool)}
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                currentTool === tool
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              title={label}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setColor(color)}
                className={`w-8 h-8 rounded-full transition-all duration-200 ${
                  toolColor === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSize(size)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  toolSize === size
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                title={`粗细 ${size}px`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: size * 2, height: size * 2 }}
                />
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-1">
            <button className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" title="撤销">
              <Undo2 className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" title="重做">
              <Redo2 className="w-5 h-5" />
            </button>
            <button onClick={() => clearCanvas()} className="p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500" title="清空画布">
              <Trash2 className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" title="导出">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};