import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, LogOut, BookOpen, Trophy, BookMarked, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { EXAM_STAGE_OPTIONS, EXAM_STAGE_NAMES } from '../types';
import api from '../utils/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateExamStage = useAuthStore((state) => state.updateExamStage);
  const [saving, setSaving] = useState(false);

  const handleChangeStage = async (stage: number) => {
    if (saving) return;
    setSaving(true);

    try {
      const res: any = await api.put('/auth/user/exam-stage', {
        examStage: stage,
      });

      if (res.code === 200) {
        updateExamStage(stage);
      }
    } catch (err) {
      console.error('更新失败:', err);
      alert('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-base font-medium text-gray-800">个人中心</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
              {user?.nickname?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {user?.nickname || '学习者'}
              </h2>
              <p className="text-blue-100 text-sm">
                备考：{EXAM_STAGE_NAMES[user?.examStage || 1]}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white border-opacity-20">
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-blue-100">已读文章</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-blue-100">已学生词</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-blue-100">连续学习</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            备考阶段设置
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            选择你的备考阶段，系统会推荐对应难度的文章
          </p>
          <div className="space-y-2">
            {EXAM_STAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleChangeStage(opt.value)}
                disabled={saving}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                  user?.examStage === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-800">{opt.label}</p>
                  <p className="text-sm text-gray-500">{opt.desc}</p>
                </div>
                {user?.examStage === opt.value && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => navigate('/history')}
            className="w-full p-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">阅读历史</span>
            </div>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button
            onClick={() => navigate('/vocabulary')}
            className="w-full p-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookMarked className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">生词本</span>
            </div>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-6 py-3 bg-white text-red-500 font-medium rounded-2xl shadow-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-2xl mx-auto flex">
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500"
            onClick={() => navigate('/home')}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs">首页</span>
          </button>
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500"
            onClick={() => navigate('/vocabulary')}
          >
            <BookMarked className="w-5 h-5" />
            <span className="text-xs">生词本</span>
          </button>
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500"
            onClick={() => navigate('/history')}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs">历史</span>
          </button>
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-blue-600"
            onClick={() => navigate('/profile')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">我的</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default ProfilePage;
