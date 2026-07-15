import { useState, useEffect } from 'react';

interface ScanPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function ScanPage({ onNavigate }: ScanPageProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        onNavigate('appliance', { id: 'washing-machine' });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, onNavigate]);

  const handleScanSuccess = () => {
    setIsScanning(false);
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen bg-black p-4 flex flex-col">
      <button
        onClick={() => onNavigate('home')}
        className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white text-xl font-bold py-3 px-6 rounded-full appliance-button z-10"
      >
        ← 返回
      </button>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-sm aspect-square bg-gray-900 rounded-3xl overflow-hidden border-4 border-green-500">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-green-400 text-6xl mb-4">📱</div>
              <p className="text-white text-xl">请对准家电上的二维码</p>
            </div>
          </div>

          {isScanning && (
            <div className="scan-line absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-80" />
          )}

          {showSuccess && (
            <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-white text-8xl mb-4">✓</div>
                <p className="text-white text-2xl font-bold">扫码成功!</p>
              </div>
            </div>
          )}

          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-green-500 rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-green-500 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-green-500 rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-green-500 rounded-br-3xl" />
        </div>

        <button
          onClick={handleScanSuccess}
          disabled={!isScanning}
          className={`mt-8 w-full max-w-sm bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white text-2xl font-bold py-5 px-4 rounded-2xl appliance-button shadow-lg ${
            !isScanning ? 'opacity-50' : ''
          }`}
        >
          {isScanning ? '模拟扫码成功' : '识别中...'}
        </button>

        <p className="mt-4 text-gray-400 text-lg text-center">
          演示模式 - 点击按钮模拟扫码
        </p>
      </div>
    </div>
  );
}
