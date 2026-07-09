import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  MessageSquare, 
  Download, 
  ChevronDown,
  Image,
  Maximize2,
  CheckSquare,
  BarChart3
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';

export const PrototypePreviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  
  const project = projects.find(p => p.id === id);
  const [comments, setComments] = useState<{ id: string; content: string; position: { x: number; y: number } }[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Math.random().toString(36).substring(2, 9),
      content: newComment,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
    };
    
    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showComments) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const comment = {
        id: Math.random().toString(36).substring(2, 9),
        content: newComment || '请输入评论',
        position: { x, y },
      };
      
      setComments([...comments, comment]);
    }
  };

  if (!project?.prototype) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">暂无原型数据</p>
          <button 
            onClick={() => navigate(`/project/${id}/prototype`)}
            className="btn-primary"
          >
            去设计原型
          </button>
        </div>
      </div>
    );
  }

  const components = project.prototype.pages[0]?.components || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/project/${id}/prototype`)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">原型预览</h1>
            <p className="text-xs text-gray-500">{project.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`btn-secondary flex items-center gap-2 ${showComments ? 'bg-primary-50 text-primary-600 border-primary-200' : ''}`}
          >
            <MessageSquare className="w-4 h-4" />
            评论 ({comments.length})
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            分享
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      {showComments && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="输入评论内容，然后点击画布添加评论..."
              className="flex-1 px-4 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              添加评论
            </button>
          </div>
          <p className="text-xs text-blue-600 mt-2">💡 提示：点击画布任意位置添加评论标注</p>
        </div>
      )}

      <div className="flex justify-center items-center p-8">
        <div 
          className="bg-white rounded-xl shadow-xl overflow-hidden relative"
          style={{ 
            width: '100%', 
            maxWidth: '1200px',
            minHeight: '800px',
          }}
          onClick={handleCanvasClick}
        >
          <div className="absolute inset-0 overflow-auto">
            {components.map((component) => (
              <div
                key={component.id}
                className="absolute cursor-pointer hover:shadow-lg transition-shadow duration-200"
                style={{
                  left: component.position.x,
                  top: component.position.y,
                  ...component.style,
                }}
              >
                {component.type === 'navigation' && (
                  <div className="flex items-center justify-between w-full h-full px-4">
                    <span className="font-bold">{String(component.props.title || '')}</span>
                    <div className="flex items-center gap-4">
                      <span className="cursor-pointer hover:text-primary-600 transition-colors">首页</span>
                      <span className="cursor-pointer hover:text-primary-600 transition-colors">产品</span>
                      <span className="cursor-pointer hover:text-primary-600 transition-colors">关于</span>
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
                      <div className="w-8 bg-primary-500 rounded-t hover:bg-primary-600 transition-colors" style={{ height: '80%' }}></div>
                      <div className="w-8 bg-primary-400 rounded-t hover:bg-primary-500 transition-colors" style={{ height: '60%' }}></div>
                      <div className="w-8 bg-primary-300 rounded-t hover:bg-primary-400 transition-colors" style={{ height: '90%' }}></div>
                      <div className="w-8 bg-primary-400 rounded-t hover:bg-primary-500 transition-colors" style={{ height: '50%' }}></div>
                      <div className="w-8 bg-primary-500 rounded-t hover:bg-primary-600 transition-colors" style={{ height: '70%' }}></div>
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
                    <div className="flex items-center gap-2 py-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded bg-gray-100"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">列表项1</p>
                        <p className="text-xs text-gray-500">描述文字</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 py-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded bg-gray-100"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">列表项2</p>
                        <p className="text-xs text-gray-500">描述文字</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
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
                  <div className="w-full h-full border-2 border-gray-300 rounded hover:border-primary-500 cursor-pointer transition-colors">
                  </div>
                )}

                {component.type === 'radio' && (
                  <div className="w-full h-full border-2 border-gray-300 rounded-full hover:border-primary-500 cursor-pointer transition-colors">
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
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">取消</button>
                        <button className="px-4 py-2 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition-colors">确定</button>
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
                    <button className="mt-auto w-full py-2 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition-colors">提交</button>
                  </div>
                )}
              </div>
            ))}

            {comments.map((comment) => (
              <div 
                key={comment.id}
                className="absolute bg-blue-500 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-50 max-w-xs"
                style={{ 
                  left: comment.position.x, 
                  top: comment.position.y,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                {comment.content}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-8 border-transparent border-t-blue-500"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
