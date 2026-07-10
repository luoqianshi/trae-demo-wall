import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-2xl font-bold text-[#87CEEB] mb-4">页面未找到</h1>
        <p className="text-gray-500 mb-8">你访问的页面不存在，可能已被移动或删除</p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
