import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { useClassroomStore } from '../stores/classroomStore';
import { Calendar, Users, Clock, Plus, Play, FileText, Bell, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const { classrooms, createClassroom } = useClassroomStore();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassroom, setNewClassroom] = useState({ name: '', description: '', startTime: '', endTime: '' });

  const ongoingClassrooms = classrooms.filter((c) => c.status === 'ongoing');
  const upcomingClassrooms = classrooms.filter((c) => c.status === 'upcoming');
  const endedClassrooms = classrooms.filter((c) => c.status === 'ended');

  const handleCreateClassroom = () => {
    if (!newClassroom.name || !newClassroom.startTime || !newClassroom.endTime) return;
    createClassroom({
      name: newClassroom.name,
      description: newClassroom.description,
      startTime: newClassroom.startTime,
      endTime: newClassroom.endTime,
      status: 'upcoming',
      hostId: 'host1',
      hostName: '王老师',
      participantCount: 0,
    });
    setShowCreateModal(false);
    setNewClassroom({ name: '', description: '', startTime: '', endTime: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <Header title="远程辅导软件" subtitle="在线辅导，随时开始" />

      <main className="px-4 lg:px-6 py-4 pb-24 lg:pb-6 max-w-5xl mx-auto">
        <section className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-white/80">早上好，王老师</p>
              <h3 className="text-xl font-bold mt-0.5">今日有 1 节课程</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-white/80 mt-0.5">在线学生</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">20h</p>
              <p className="text-xs text-white/80 mt-0.5">本周学习</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">92</p>
              <p className="text-xs text-white/80 mt-0.5">平均得分</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <button
            onClick={() => navigate('/classroom/1')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
              <Play className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-white">进入课堂</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-white">创建课堂</span>
          </button>
          <button
            onClick={() => navigate('/records')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-white">学习记录</span>
          </button>
          <button className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-white">消息中心</span>
          </button>
        </section>

        {ongoingClassrooms.length > 0 && (
          <section className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">进行中</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{ongoingClassrooms.length} 节</span>
            </div>
            <div className="space-y-3">
              {ongoingClassrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/25"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-xs text-white/90">正在直播</span>
                      </div>
                      <h4 className="font-bold text-lg truncate">{classroom.name}</h4>
                      <p className="text-sm text-white/80 mt-0.5 line-clamp-1">{classroom.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-white/90">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {classroom.participantCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {classroom.startTime.split(' ')[1]}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/classroom/${classroom.id}`)}
                      className="px-4 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
                    >
                      立即加入
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {upcomingClassrooms.length > 0 && (
          <section className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">即将开始</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{upcomingClassrooms.length} 节</span>
            </div>
            <div className="space-y-3">
              {upcomingClassrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-white truncate">{classroom.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{classroom.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {classroom.startTime}
                      </span>
                    </div>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">王老师</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {endedClassrooms.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">历史记录</h3>
              <button
                onClick={() => navigate('/records')}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium"
              >
                查看更多
              </button>
            </div>
            <div className="space-y-3">
              {endedClassrooms.slice(0, 3).map((classroom) => (
                <div
                  key={classroom.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 opacity-80"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-800 dark:text-white truncate">{classroom.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{classroom.description}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
                      已结束
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {classroom.startTime}
                    </span>
                    <span>{classroom.participantCount}人参与</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {showCreateModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl p-5 w-full lg:max-w-md lg:mx-4 max-h-[90vh] overflow-auto shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 lg:hidden"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">创建新课堂</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="lg:hidden text-gray-500 dark:text-gray-400"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">课堂名称</label>
                <input
                  type="text"
                  value={newClassroom.name}
                  onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="例如：数学基础辅导"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">课堂描述</label>
                <textarea
                  value={newClassroom.description}
                  onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  rows={2}
                  placeholder="简单描述课堂内容..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">开始</label>
                  <input
                    type="datetime-local"
                    value={newClassroom.startTime}
                    onChange={(e) => setNewClassroom({ ...newClassroom, startTime: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">结束</label>
                  <input
                    type="datetime-local"
                    value={newClassroom.endTime}
                    onChange={(e) => setNewClassroom({ ...newClassroom, endTime: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5 pb-4 lg:pb-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateClassroom}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};