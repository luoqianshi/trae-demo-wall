'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-6">😵</div>
        <h1 className="text-2xl font-bold text-[#FFB6C1] mb-4">页面加载出错</h1>
        <p className="text-gray-400 text-sm mb-8">{error.message}</p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => reset()}
            className="bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
          >
            重试
          </button>
          <a
            href="/"
            className="text-[#87CEEB] hover:text-[#6BB6E8] font-semibold transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
