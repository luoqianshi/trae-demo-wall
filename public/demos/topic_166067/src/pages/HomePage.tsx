import { appliances } from '../data/appliances';

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-blue-700 mb-2">一扫就会用</h1>
          <p className="text-xl text-gray-600">扫码看步骤，家电不再难</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onNavigate('scan')}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-2xl font-bold py-6 px-4 rounded-2xl appliance-button shadow-lg flex items-center justify-center gap-3"
          >
            <span className="text-3xl">📷</span>
            <span>扫一扫</span>
          </button>

          <button
            onClick={() => onNavigate('appliance', { id: 'washing-machine' })}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold py-6 px-4 rounded-2xl appliance-button shadow-lg flex items-center justify-center gap-3"
          >
            <span className="text-3xl">🏠</span>
            <span>我的家电</span>
          </button>

          <button
            onClick={() => onNavigate('help')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold py-6 px-4 rounded-2xl appliance-button shadow-lg flex items-center justify-center gap-3"
          >
            <span className="text-3xl">👨‍👩‍👧</span>
            <span>找家人帮忙</span>
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">常用家电</h2>
          <div className="grid grid-cols-1 gap-4">
            {appliances.map(appliance => (
              <button
                key={appliance.id}
                onClick={() => onNavigate('appliance', { id: appliance.id })}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 text-xl font-bold py-5 px-4 rounded-2xl appliance-button shadow-md flex items-center justify-center gap-4 border-2 border-gray-100"
              >
                <span className="text-4xl">{appliance.icon}</span>
                <div className="text-left">
                  <div>{appliance.name}</div>
                  <div className="text-sm text-gray-500 font-normal">{appliance.description}</div>
                </div>
                <span className="text-gray-400 text-2xl">→</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => onNavigate('register')}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xl font-bold py-4 px-4 rounded-2xl appliance-button shadow-lg"
          >
            📝 大赛报名
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-lg">专为老年人设计，操作简单易懂</p>
        </div>
      </div>
    </div>
  );
}
