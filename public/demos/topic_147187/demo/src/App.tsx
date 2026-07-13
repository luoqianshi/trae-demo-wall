import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TabBar } from '@/components/layout/Sidebar';
import { Home } from '@/pages/Home';
import { Classroom } from '@/pages/Classroom';
import { Records } from '@/pages/Records';
import { Profile } from '@/pages/Profile';

const PhoneFrame = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-indigo-100 dark:from-slate-950 dark:via-purple-950 dark:to-indigo-950 flex items-center justify-center p-4 lg:p-8">
      <div className="hidden lg:flex flex-col items-center gap-6 mr-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            远程辅导软件
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">移动端Demo</p>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-4 max-w-xs text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-800 dark:text-white mb-2">📱 移动端优先</p>
          <p>本Demo以App/小程序方向设计，桌面端将显示手机模拟框预览效果。</p>
          <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
            💡 已集成：AI多供应商 / Mock API / 多主题
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="hidden lg:block absolute -inset-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[3rem] blur-2xl"></div>

        <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-20 flex items-center justify-center">
            <div className="w-16 h-1 bg-gray-700 rounded-full"></div>
          </div>

          <div className="relative w-[390px] max-w-full h-[844px] max-h-[90vh] bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
            <TabBar />
          </div>

          <div className="absolute -right-1 top-32 w-1 h-12 bg-gray-700 rounded-r"></div>
          <div className="absolute -left-1 top-32 w-1 h-8 bg-gray-700 rounded-l"></div>
          <div className="absolute -left-1 top-44 w-1 h-12 bg-gray-700 rounded-l"></div>
          <div className="absolute -left-1 top-60 w-1 h-12 bg-gray-700 rounded-l"></div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-center gap-4 ml-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-4 max-w-xs">
          <p className="font-medium text-gray-800 dark:text-white mb-3 text-sm">🎯 技术栈</p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
            <li>✓ 声网Agora（音视频）</li>
            <li>✓ DeepSeek/通义/文心</li>
            <li>✓ RESTful API + Mock</li>
            <li>✓ 多主题系统</li>
            <li>✓ Canvas互动白板</li>
            <li>✓ Chart.js数据可视化</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/classroom/:id" element={<Classroom />} />
      <Route path="/records" element={<Records />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
};

export default function App() {
  return (
    <Router>
      <PhoneFrame>
        <AppRoutes />
      </PhoneFrame>
    </Router>
  );
}