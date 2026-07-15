import { getApplianceById, getTaskById } from '../data/appliances';

interface HelpPageProps {
  params: Record<string, string>;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function HelpPage({ params, onNavigate }: HelpPageProps) {
  const appliance = getApplianceById(params.applianceId || '');
  const task = getTaskById(params.applianceId || '', params.taskId || '');
  const stepIndex = parseInt(params.stepIndex || '0');

  const currentStep = task?.steps[stepIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 p-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="mb-4 bg-white hover:bg-gray-50 text-gray-700 text-xl font-bold py-3 px-6 rounded-full appliance-button shadow-md"
        >
          ← 返回
        </button>

        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📞</div>
          <h1 className="text-3xl font-bold text-gray-800">正在联系家人</h1>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg mb-4">
          <h3 className="text-xl font-bold text-gray-700 mb-3">当前问题</h3>
          <div className="space-y-2 text-lg text-gray-600">
            <div className="flex justify-between">
              <span>家电：</span>
              <span className="font-medium">{appliance?.name || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span>任务：</span>
              <span className="font-medium">{task?.title || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span>当前步骤：</span>
              <span className="font-medium">第 {stepIndex + 1} 步 - {currentStep?.title || '未知'}</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-2xl p-5 shadow-lg mb-4 border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">✓</span>
            </div>
            <span className="text-lg font-bold text-green-700">已把当前步骤发送给家人</span>
          </div>
          <p className="text-green-600 ml-13">家人可以看到您卡在哪一步</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-5 shadow-lg mb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">👦</span>
            </div>
            <div>
              <div className="font-bold text-blue-700 text-lg mb-1">儿子</div>
              <p className="text-blue-600 text-lg">妈，您现在按右下角那个写着"启动"的按钮就可以。如果找不到，可以看看屏幕下面，有个绿色的圆形按钮。</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onNavigate('guide', { applianceId: params.applianceId || '', taskId: params.taskId || '', stepIndex: params.stepIndex || '0' })}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold py-5 px-4 rounded-2xl appliance-button shadow-lg"
          >
            返回当前步骤
          </button>

          <button
            onClick={() => onNavigate('appliance', { id: params.applianceId || '' })}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white text-2xl font-bold py-5 px-4 rounded-2xl appliance-button shadow-lg"
          >
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
}
