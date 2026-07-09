import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Trash2, 
  Copy, 
  Undo, 
  Redo,
  Plus,
  Square,
  Type,
  AlignLeft,
  CheckSquare,
  Circle,
  ChevronDown,
  LayoutGrid,
  List,
  Navigation,
  FileText,
  Table,
  BarChart3,
  Image,
  Maximize2,
  Move,
  CornerDownRight,
  Save
} from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { useProjectStore } from '../store/projectStore';
import { Component } from '../types';
import { createComponent } from '../utils/generator';

const componentIcons: Record<string, any> = {
  button: Square,
  input: Type,
  textarea: AlignLeft,
  checkbox: CheckSquare,
  radio: Circle,
  dropdown: ChevronDown,
  card: LayoutGrid,
  list: List,
  navigation: Navigation,
  form: FileText,
  table: Table,
  chart: BarChart3,
  image: Image,
  modal: Maximize2,
  text: Type,
};

const componentLibrary = [
  { type: 'button', name: '按钮', category: '基础' },
  { type: 'input', name: '输入框', category: '基础' },
  { type: 'textarea', name: '文本域', category: '基础' },
  { type: 'checkbox', name: '复选框', category: '基础' },
  { type: 'radio', name: '单选框', category: '基础' },
  { type: 'dropdown', name: '下拉菜单', category: '基础' },
  { type: 'card', name: '卡片', category: '容器' },
  { type: 'list', name: '列表', category: '容器' },
  { type: 'navigation', name: '导航栏', category: '导航' },
  { type: 'form', name: '表单', category: '表单' },
  { type: 'table', name: '表格', category: '数据' },
  { type: 'chart', name: '图表', category: '数据' },
  { type: 'image', name: '图片', category: '媒体' },
  { type: 'modal', name: '弹窗', category: '反馈' },
  { type: 'text', name: '文本', category: '基础' },
];

export const PrototypeEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject } = useProjectStore();
  
  const project = projects.find(p => p.id === id);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [components, setComponents] = useState<Component[]>(project?.prototype?.pages[0]?.components || []);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragComponentId, setDragComponentId] = useState<string | null>(null);
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  const [componentToAdd, setComponentToAdd] = useState<string | null>(null);

  useEffect(() => {
    if (project?.prototype?.pages[0]) {
      setComponents(project.prototype.pages[0].components);
    }
  }, [project]);

  const selectedComponent = components.find(c => c.id === selectedComponentId);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isAddingComponent && componentToAdd && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 50;
      const y = e.clientY - rect.top - 50;
      
      const newComponent = createComponent(componentToAdd, Math.max(0, x), Math.max(0, y));
      setComponents([...components, newComponent]);
      setSelectedComponentId(newComponent.id);
      setIsAddingComponent(false);
      setComponentToAdd(null);
    } else {
      setSelectedComponentId(null);
    }
  };

  const handleComponentMouseDown = (e: React.MouseEvent, componentId: string) => {
    e.stopPropagation();
    setSelectedComponentId(componentId);
    setIsDragging(true);
    setDragComponentId(componentId);
    
    const component = components.find(c => c.id === componentId);
    if (component) {
      setDragOffset({
        x: e.clientX - component.position.x,
        y: e.clientY - component.position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragComponentId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - (dragOffset.x - components.find(c => c.id === dragComponentId)?.position.x || 0);
      const y = e.clientY - rect.top - (dragOffset.y - components.find(c => c.id === dragComponentId)?.position.y || 0);
      
      setComponents(components.map(c => 
        c.id === dragComponentId 
          ? { ...c, position: { x: Math.max(0, x), y: Math.max(0, y) } }
          : c
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragComponentId(null);
  };

  const handleAddComponent = (type: string) => {
    setIsAddingComponent(true);
    setComponentToAdd(type);
  };

  const handleDeleteComponent = () => {
    if (selectedComponentId) {
      setComponents(components.filter(c => c.id !== selectedComponentId));
      setSelectedComponentId(null);
    }
  };

  const handleCopyComponent = () => {
    if (selectedComponent) {
      const newComponent = {
        ...selectedComponent,
        id: Math.random().toString(36).substring(2, 9),
        position: {
          x: selectedComponent.position.x + 20,
          y: selectedComponent.position.y + 20,
        },
      };
      setComponents([...components, newComponent]);
      setSelectedComponentId(newComponent.id);
    }
  };

  const handleSave = () => {
    if (project && project.prototype) {
      updateProject(id!, {
        prototype: {
          ...project.prototype,
          pages: [{ ...project.prototype.pages[0], components }],
        },
      });
    }
  };

  const handleStyleChange = (key: string, value: string | number) => {
    if (selectedComponentId) {
      setComponents(components.map(c => 
        c.id === selectedComponentId 
          ? { ...c, style: { ...c.style, [key]: value } }
          : c
      ));
    }
  };

  const handleUndo = () => {
    // TODO: 实现撤销功能
  };

  const handleRedo = () => {
    // TODO: 实现重做功能
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">项目不存在</p>
      </div>
    );
  }

  const categories = [...new Set(componentLibrary.map(c => c.category))];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="原型设计" subtitle={project.name} />
      
      <div className="flex-1 flex">
        <div className="w-64 bg-white border-r border-gray-100 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">组件库</h3>
            <button 
              onClick={() => setIsAddingComponent(false)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {isAddingComponent ? '取消' : ''}
            </button>
          </div>

          {categories.map((category) => (
            <div key={category} className="mb-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                {category}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {componentLibrary
                  .filter(c => c.category === category)
                  .map((item) => {
                    const Icon = componentIcons[item.type] || Square;
                    return (
                      <button
                        key={item.type}
                        onClick={() => handleAddComponent(item.type)}
                        className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center gap-2 ${
                          isAddingComponent && componentToAdd === item.type
                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{item.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleUndo}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="撤销"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button 
                onClick={handleRedo}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="重做"
              >
                <Redo className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-2"></div>
              <button 
                onClick={handleCopyComponent}
                disabled={!selectedComponentId}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="复制"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDeleteComponent}
                disabled={!selectedComponentId}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleSave}
                className="btn-secondary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
              <button 
                onClick={() => navigate(`/project/${id}/preview`)}
                className="btn-primary flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                预览
              </button>
            </div>
          </div>

          <div 
            ref={canvasRef}
            className="flex-1 bg-gray-100 relative overflow-auto"
            style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {isAddingComponent && (
              <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg border border-primary-200">
                <p className="text-sm text-gray-700">点击画布添加 <span className="font-medium text-primary-600">{componentLibrary.find(c => c.type === componentToAdd)?.name}</span></p>
              </div>
            )}

            {components.map((component) => (
              <div
                key={component.id}
                className={`absolute cursor-move transition-shadow duration-200 ${
                  selectedComponentId === component.id ? 'ring-2 ring-primary-500 ring-offset-2 z-10' : ''
                }`}
                style={{
                  left: component.position.x,
                  top: component.position.y,
                  ...component.style,
                }}
                onMouseDown={(e) => handleComponentMouseDown(e, component.id)}
              >
                {component.type === 'navigation' && (
                  <div className="flex items-center justify-between w-full h-full px-4">
                    <span className="font-bold">{String(component.props.title || '')}</span>
                    <div className="flex items-center gap-4">
                      <span>首页</span>
                      <span>产品</span>
                      <span>关于</span>
                    </div>
                  </div>
                )}

                {component.type === 'card' && (
                  <div className="h-full flex flex-col">
                    <h4 className="font-semibold text-gray-900 mb-2">{String(component.props.title || '')}</h4>
                    {component.props.description && (
                      <p className="text-xs text-gray-600 mb-2">{String(component.props.description || '')}</p>
                    )}
                    {component.props.items && Array.isArray(component.props.items) && (
                      <ul className="text-xs text-gray-500 space-y-1 mt-auto">
                        {(component.props.items as string[]).map((item: string, index: number) => (
                          <li key={index} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    {component.props.stories && Array.isArray(component.props.stories) && (
                      <div className="text-xs text-gray-600 space-y-2 mt-auto">
                        {(component.props.stories as any[]).map((story: any, index: number) => (
                          <p key={index}>
                            <span className="font-medium text-blue-600">{story.role}</span>
                            想要 {story.want}
                          </p>
                        ))}
                      </div>
                    )}
                    {component.props.attributes && Array.isArray(component.props.attributes) && (
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {(component.props.attributes as any[]).map((attr: any, index: number) => (
                          <span key={index} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                            {attr.name}: {attr.type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {component.type === 'button' && (
                  <span className="font-medium">{String(component.props.label || '按钮')}</span>
                )}

                {component.type === 'input' && (
                  <input 
                    type="text" 
                    className="w-full h-full bg-transparent border-none outline-none text-gray-400"
                    placeholder={String(component.props.label || '输入框')}
                    readOnly
                  />
                )}

                {component.type === 'textarea' && (
                  <textarea 
                    className="w-full h-full bg-transparent border-none outline-none text-gray-400 resize-none"
                    placeholder={String(component.props.label || '文本域')}
                    readOnly
                  />
                )}

                {component.type === 'dropdown' && (
                  <div className="w-full h-full flex items-center justify-between text-gray-400">
                    <span>{String(component.props.label || '请选择')}</span>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                )}

                {component.type === 'image' && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Image className="w-8 h-8 mb-2" />
                    <span className="text-xs">图片占位</span>
                  </div>
                )}

                {component.type === 'chart' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex items-end gap-2 h-3/4">
                      <div className="w-8 bg-primary-500 rounded-t" style={{ height: '80%' }}></div>
                      <div className="w-8 bg-primary-400 rounded-t" style={{ height: '60%' }}></div>
                      <div className="w-8 bg-primary-300 rounded-t" style={{ height: '90%' }}></div>
                      <div className="w-8 bg-primary-400 rounded-t" style={{ height: '50%' }}></div>
                      <div className="w-8 bg-primary-500 rounded-t" style={{ height: '70%' }}></div>
                    </div>
                  </div>
                )}

                {component.type === 'table' && (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex border-b border-gray-200 bg-gray-50">
                      <div className="flex-1 px-2 py-1 text-xs font-medium text-gray-600">列1</div>
                      <div className="flex-1 px-2 py-1 text-xs font-medium text-gray-600">列2</div>
                      <div className="flex-1 px-2 py-1 text-xs font-medium text-gray-600">列3</div>
                    </div>
                    <div className="flex border-b border-gray-200">
                      <div className="flex-1 px-2 py-1 text-xs text-gray-600">数据1</div>
                      <div className="flex-1 px-2 py-1 text-xs text-gray-600">数据2</div>
                      <div className="flex-1 px-2 py-1 text-xs text-gray-600">数据3</div>
                    </div>
                    <div className="flex">
                      <div className="flex-1 px-2 py-1 text-xs text-gray-600">数据4</div>
                      <div className="flex-1 px-2 py-1 text-xs text-gray-600">数据5</div>
                      <div className="flex-1 px-2 py-1 text-xs text-gray-600">数据6</div>
                    </div>
                  </div>
                )}

                {component.type === 'list' && (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex items-center gap-2 py-2 border-b border-gray-100">
                      <div className="w-8 h-8 rounded bg-gray-100"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">列表项1</p>
                        <p className="text-xs text-gray-500">描述文字</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 py-2 border-b border-gray-100">
                      <div className="w-8 h-8 rounded bg-gray-100"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">列表项2</p>
                        <p className="text-xs text-gray-500">描述文字</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-8 h-8 rounded bg-gray-100"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">列表项3</p>
                        <p className="text-xs text-gray-500">描述文字</p>
                      </div>
                    </div>
                  </div>
                )}

                {component.type === 'text' && (
                  <span>{String(component.props.label || '文本内容')}</span>
                )}

                {component.type === 'checkbox' && (
                  <div className={`w-full h-full border-2 rounded ${selectedComponentId === component.id ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                    {selectedComponentId === component.id && (
                      <CheckSquare className="w-full h-full text-white" />
                    )}
                  </div>
                )}

                {component.type === 'radio' && (
                  <div className={`w-full h-full border-2 rounded-full ${selectedComponentId === component.id ? 'border-primary-500' : 'border-gray-300'}`}>
                    {selectedComponentId === component.id && (
                      <div className="w-3/4 h-3/4 bg-primary-500 rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                )}

                {component.type === 'modal' && (
                  <div className="w-full h-full flex flex-col items-center justify-center border border-gray-200 rounded-lg">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-gray-400" />
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">弹窗标题</h4>
                      <p className="text-sm text-gray-500 mb-4">弹窗内容描述</p>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm">取消</button>
                        <button className="px-4 py-2 bg-primary-500 text-white rounded text-sm">确定</button>
                      </div>
                    </div>
                  </div>
                )}

                {component.type === 'form' && (
                  <div className="w-full h-full flex flex-col gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">用户名</label>
                      <input type="text" className="w-full px-2 py-1 border border-gray-200 rounded text-xs" placeholder="请输入用户名" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">密码</label>
                      <input type="password" className="w-full px-2 py-1 border border-gray-200 rounded text-xs" placeholder="请输入密码" />
                    </div>
                    <button className="mt-auto w-full py-2 bg-primary-500 text-white rounded text-sm">提交</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedComponent && (
          <div className="w-72 bg-white border-l border-gray-100 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">属性面板</h3>
              <button 
                onClick={() => setSelectedComponentId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">组件类型</label>
                <p className="text-sm font-medium text-gray-900">
                  {componentLibrary.find(c => c.type === selectedComponent.type)?.name}
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">位置</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={Math.round(selectedComponent.position.x)}
                      onChange={(e) => handleStyleChange('left', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={Math.round(selectedComponent.position.y)}
                      onChange={(e) => handleStyleChange('top', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">尺寸</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={Math.round(selectedComponent.style.width as number) || 100}
                      onChange={(e) => handleStyleChange('width', parseInt(e.target.value) || 100)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={Math.round(selectedComponent.style.height as number) || 100}
                      onChange={(e) => handleStyleChange('height', parseInt(e.target.value) || 100)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {selectedComponent.props.title !== undefined && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">标题</label>
                  <input
                    type="text"
                    value={String(selectedComponent.props.title || '')}
                    onChange={(e) => {
                      setComponents(components.map(c => 
                        c.id === selectedComponentId 
                          ? { ...c, props: { ...c.props, title: e.target.value } }
                          : c
                      ));
                    }}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                  />
                </div>
              )}

              {selectedComponent.props.label !== undefined && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">标签</label>
                  <input
                    type="text"
                    value={String(selectedComponent.props.label || '')}
                    onChange={(e) => {
                      setComponents(components.map(c => 
                        c.id === selectedComponentId 
                          ? { ...c, props: { ...c.props, label: e.target.value } }
                          : c
                      ));
                    }}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
