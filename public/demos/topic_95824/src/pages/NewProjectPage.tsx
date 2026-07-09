import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Sparkles, Save } from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { useProjectStore } from '../store/projectStore';
import { getStatusLabel, getStatusColor } from '../utils/mockData';

export const NewProjectPage = () => {
  const navigate = useNavigate();
  const addProject = useProjectStore((state) => state.addProject);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState(1);

  const handleCreate = () => {
    if (!name.trim()) return;
    
    const newProject = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      description: description.trim() || '暂无描述',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'draft' as const,
    };

    addProject(newProject);
    navigate(`/project/${newProject.id}/analysis`);
  };

  const handleQuickStart = () => {
    const examples = [
      { name: '在线商城系统', desc: '支持商品浏览、购物车、订单管理等功能' },
      { name: '企业OA系统', desc: '考勤管理、审批流程、文件共享' },
      { name: '客户管理系统', desc: '客户信息管理、销售跟进、报表分析' },
    ];
    
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    
    const newProject = {
      id: Math.random().toString(36).substring(2, 9),
      name: randomExample.name,
      description: randomExample.desc,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'draft' as const,
    };

    addProject(newProject);
    navigate(`/project/${newProject.id}/analysis`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="新建项目" subtitle="创建一个新的需求分析和原型设计项目" />
      
      <main className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-200 ${
                  step >= s 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-200 ${
                    step > s ? 'bg-primary-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="card animation-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">项目基本信息</h2>
                <span className={`badge ${getStatusColor('draft')}`}>
                  {getStatusLabel('draft')}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入项目名称，例如：在线商城系统"
                    className="input-field"
                    onKeyDown={(e) => e.key === 'Enter' && setStep(2)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目描述
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="请简要描述项目的目的和背景（可选）"
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button 
                  onClick={handleQuickStart}
                  className="btn-outline flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  使用示例快速开始
                </button>
                <button 
                  onClick={() => setStep(2)}
                  disabled={!name.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card animation-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-2">需求输入</h2>
              <p className="text-sm text-gray-500 mb-6">
                请描述您的需求，AI将自动分析功能点、用户故事和业务规则
              </p>
              
              <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl p-4 mb-4">
                <p className="text-sm text-primary-700">
                  💡 <strong>提示：</strong>可以描述您想要的功能，例如：
                  "我需要一个在线商城系统，支持商品浏览、搜索、购物车、下单支付等功能，包含用户注册登录、商品管理、订单管理等模块。"
                </p>
              </div>

              <textarea
                placeholder="请详细描述您的项目需求..."
                rows={8}
                className="input-field resize-none"
                defaultValue={description || '我需要一个在线商城系统，支持商品浏览、搜索、购物车、下单支付等功能。需要包含用户注册登录、商品管理、订单管理等模块。'}
              />

              <div className="flex items-center justify-between mt-8">
                <button 
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  上一步
                </button>
                <button 
                  onClick={handleCreate}
                  className="btn-primary flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  开始智能分析
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card animation-fade-in text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <Save className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">项目创建成功！</h2>
              <p className="text-gray-500 mb-8">即将跳转到需求分析页面...</p>
              <button 
                onClick={handleCreate}
                className="btn-primary"
              >
                进入项目
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
