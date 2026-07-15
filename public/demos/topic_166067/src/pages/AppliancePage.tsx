import { getApplianceById } from '../data/appliances';

interface AppliancePageProps {
  params: Record<string, string>;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function AppliancePage({ params, onNavigate }: AppliancePageProps) {
  const appliance = getApplianceById(params.id || '');

  if (!appliance) {
    return (
      <div className="min-h-screen bg-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">未找到该家电</p>
          <button
            onClick={() => onNavigate('home')}
            className="mt-4 bg-blue-500 text-white text-xl font-bold py-4 px-8 rounded-xl"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="mb-4 bg-white hover:bg-gray-50 text-gray-700 text-xl font-bold py-3 px-6 rounded-full appliance-button shadow-md"
        >
          ← 返回
        </button>

        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <div className="text-center">
            <div className="text-6xl mb-4">{appliance.icon}</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{appliance.name}</h1>
            <div className="inline-block bg-green-100 text-green-700 text-lg font-medium py-2 px-6 rounded-full">
              已识别，可以开始指导
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">常用任务</h2>
          <div className="grid grid-cols-2 gap-3">
            {appliance.tasks.map(task => (
              <button
                key={task.id}
                onClick={() => onNavigate('guide', { applianceId: appliance.id, taskId: task.id })}
                className="bg-white hover:bg-blue-50 text-gray-800 text-lg font-bold py-4 px-3 rounded-xl appliance-button shadow-md border-2 border-gray-100"
              >
                <div className="text-center">
                  <div className="mb-1">{task.title}</div>
                  <div className="text-xs text-gray-500 font-normal">{task.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-orange-50 rounded-2xl p-5">
          <h3 className="text-xl font-bold text-orange-700 mb-3 flex items-center gap-2">
            <span>⚠️</span>安全提醒
          </h3>
          <ul className="space-y-2">
            {appliance.safetyTips.map((tip, index) => (
              <li key={index} className="text-lg text-orange-600 flex items-start gap-2">
                <span className="text-orange-500">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
