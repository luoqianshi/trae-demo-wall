import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page overflow-hidden">
      <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#FFE8E0] opacity-60 pointer-events-none" />
      <div className="absolute top-72 -left-20 w-40 h-40 rounded-full bg-[#FFE4D6] opacity-50 pointer-events-none" />

      <div className="text-center relative pt-6 pb-10">
        <div className="relative inline-block mb-5">
          <img
            src="/images/home-cat.jpg"
            alt="可爱猫咪"
            className="w-28 h-28 rounded-3xl object-cover"
            style={{ boxShadow: '0 6px 30px rgba(255,107,107,0.2)' }}
          />
          <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3DD598, #2ECB7A)', boxShadow: '0 3px 10px rgba(61,213,152,0.4)' }}>
            <span className="text-white text-sm leading-none">&#9829;</span>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold mb-3 leading-snug" style={{ color: '#E85A4F' }}>
          别担心，<br />小猫咪会回家的
        </h1>
        <div className="flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ background: 'rgba(255,107,107,0.1)', color: '#E85A4F' }}>
            <span>&#10084;&#65039;</span> 每一位铲屎官的焦虑我们都懂
          </span>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ background: 'rgba(255,169,77,0.1)', color: '#E89B4F' }}>
            <span>&#128008;</span> 在这里，你不再孤单
          </span>
        </div>
      </div>

      <div className="space-y-3.5 relative">
        <div
          onClick={() => navigate('/predict')}
          className="card flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform duration-200"
        >
          <img src="/images/predict-cat.jpg" alt="搜寻猫咪" className="w-[68px] h-[68px] rounded-2xl object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-800 mb-1">智能搜寻推荐</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-2.5">
              输入走失时长，告诉你猫咪可能藏在哪里
            </p>
            <button className="btn-green !w-auto !py-2 !px-4 !text-sm !rounded-xl !font-semibold">
              开始推算
            </button>
          </div>
        </div>

        <div
          onClick={() => navigate('/record')}
          className="card flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform duration-200"
        >
          <img src="/images/record-success.jpg" alt="分享故事" className="w-[68px] h-[68px] rounded-2xl object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-800 mb-1">分享寻回故事</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-2.5">
              你成功找回猫咪的经历，是其他铲屎官的希望之光
            </p>
            <button className="btn-coral !w-auto !py-2 !px-4 !text-sm !rounded-xl !font-semibold">
              分享经历
            </button>
          </div>
        </div>

        <div
          onClick={() => navigate('/records')}
          className="card flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform duration-200"
        >
          <img src="/images/warm-cat.jpg" alt="猫咪故事" className="w-[68px] h-[68px] rounded-2xl object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-800 mb-1">猫咪回家故事</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-2.5">
              每一个故事，都在点亮希望
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/records'); }}
              className="!w-auto !py-2 !px-4 !text-sm !rounded-xl !font-semibold flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #FFC078, #FFA94D)', color: 'white', boxShadow: '0 4px 12px rgba(255,169,77,0.3)', borderRadius: '0.75rem', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
            >
              查看故事
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">&#128161;</span>
          <h2 className="text-lg font-bold text-gray-800">搜寻小贴士</h2>
        </div>
        <div className="space-y-2.5">
          {[
            { emoji: '\u23F0', text: <>走失 <strong style={{ color: '#E85A4F' }}>72小时</strong> 内是黄金搜寻期，别放弃！</> },
            { emoji: '\uD83D\uDCCD', text: <>大多数猫咪就在 <strong style={{ color: '#E85A4F' }}>500米</strong> 内躲着</> },
            { emoji: '\uD83C\uDF19', text: '深夜和清晨是猫咪最活跃的时间' },
          ].map((tip, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-gray-700"
              style={{ background: '#FFF5F0' }}>
              <span className="text-lg">{tip.emoji}</span>
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <h2 className="text-lg font-bold text-gray-800 mb-5">
          我们一起创造的改变
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-3xl p-6 text-center"
            style={{ background: 'linear-gradient(135deg, #FFF0F0, #FFE8E8)' }}>
            <div className="text-3xl mb-1">&#128570;</div>
            <div className="text-4xl font-extrabold" style={{ color: '#E85A4F' }}>128+</div>
            <div className="text-sm font-medium text-gray-600 mt-1.5">成功找回</div>
            <div className="text-xs text-gray-400 mt-0.5">只可爱猫咪</div>
          </div>
          <div className="rounded-3xl p-6 text-center"
            style={{ background: 'linear-gradient(135deg, #FFF5EB, #FFEAD6)' }}>
            <div className="text-3xl mb-1">&#127747;</div>
            <div className="text-4xl font-extrabold" style={{ color: '#E89B4F' }}>35+</div>
            <div className="text-sm font-medium text-gray-600 mt-1.5">覆盖城市</div>
            <div className="text-xs text-gray-400 mt-0.5">全国范围</div>
          </div>
        </div>
        <p className="mt-5 text-sm text-gray-400">
          每一个数字背后，都是一个温暖的重逢故事 &#128149;
        </p>
      </div>

      <div className="h-8" />
    </div>
  );
}