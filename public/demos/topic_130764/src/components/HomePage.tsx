import React from 'react';

/**
 * 首页 Props
 */
interface HomePageProps {
  /** 点击"开始对话"按钮 */
  onStartChat: () => void;
  /** 点击"个人中心"按钮 */
  onOpenProfile: () => void;
}

/**
 * HomePage -- 溯光首页
 *
 * 以卡通拟人吉祥物为核心的欢迎页面。
 * 吉祥物带有上下浮动动画，底部放置主操作按钮与次级入口。
 */
const HomePage: React.FC<HomePageProps> = ({ onStartChat, onOpenProfile }) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
         style={{ backgroundColor: '#faf8f5' }}>

      {/* ---- 柔和渐变光晕背景 ---- */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(224,122,58,0.35) 0%, rgba(91,140,90,0.15) 50%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(91,140,90,0.4) 0%, transparent 70%)',
        }}
      />

      {/* ---- 吉祥物形象 ---- */}
      <div className="animate-float relative z-10 mb-6">
        <img
          src="../assets/mascot.png"
          alt="溯光吉祥物"
          className="w-[280px] h-[360px] object-contain drop-shadow-lg"
          onError={(e) => {
            // 图片加载失败时显示橙色圆形占位符
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        {/* 图片加载失败时的占位符 */}
        <div className="hidden w-[280px] h-[360px] rounded-3xl flex items-center justify-center text-6xl"
             style={{ background: 'linear-gradient(135deg, #e07a3a 0%, #d4692e 100%)' }}>
          <span className="text-white font-bold">溯</span>
        </div>
      </div>

      {/* ---- 应用名称 ---- */}
      <h1
        className="relative z-10 text-5xl font-bold tracking-wider mb-2"
        style={{ color: '#2c2418' }}
      >
        溯光
      </h1>

      {/* ---- 副标题 ---- */}
      <p
        className="relative z-10 text-lg mb-10"
        style={{ color: '#8a7e6e' }}
      >
        会一直鼓励你的语音智能伙伴
      </p>

      {/* ---- 主按钮：开始对话 ---- */}
      <button
        type="button"
        onClick={onStartChat}
        className="relative z-10 px-12 py-4 rounded-full text-white text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #e07a3a 0%, #c96930 100%)',
        }}
      >
        开始对话
      </button>

      {/* ---- 次级按钮：个人中心 ---- */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="relative z-10 mt-4 px-10 py-3 rounded-full text-base font-medium border-2 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        style={{
          borderColor: '#e07a3a',
          color: '#e07a3a',
          backgroundColor: 'transparent',
        }}
      >
        个人中心
      </button>
    </div>
  );
};

export default HomePage;
