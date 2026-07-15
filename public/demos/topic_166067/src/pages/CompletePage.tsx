import { getApplianceById, getTaskById } from '../data/appliances';

interface CompletePageProps {
  params: Record<string, string>;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function CompletePage({ params, onNavigate }: CompletePageProps) {
  const appliance = getApplianceById(params.applianceId || '');
  const task = getTaskById(params.applianceId || '', params.taskId || '');

  const getCompletionMessage = () => {
    if (!appliance) return '操作完成';
    if (appliance.id === 'washing-machine') return '洗衣机已经开始工作，请等待洗衣结束。';
    if (appliance.id === 'air-conditioner') return '空调已经设置好，请享受舒适的温度。';
    if (appliance.id === 'microwave') return '微波炉已经开始工作，请等待提示音。';
    return '操作完成，请等待设备运行结束。';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center py-8">
          <div className="text-8xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-green-700 mb-2">操作完成</h1>
          <p className="text-xl text-gray-600">{getCompletionMessage()}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-5xl">{appliance?.icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{appliance?.name}</div>
              <div className="text-lg text-gray-500">{task?.title}</div>
            </div>
          </div>

          <div className="bg-green-100 rounded-xl p-4 text-center">
            <p className="text-green-700 text-xl">✓ 所有步骤已完成</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onNavigate('home')}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-2xl font-bold py-5 px-4 rounded-2xl appliance-button shadow-lg"
          >
            回到首页
          </button>

          <button
            onClick={() => onNavigate('guide', { applianceId: params.applianceId || '', taskId: params.taskId || '' })}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold py-5 px-4 rounded-2xl appliance-button shadow-lg"
          >
            再看一遍步骤
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-lg">有其他问题随时来找我哦！</p>
        </div>
      </div>
    </div>
  );
}
