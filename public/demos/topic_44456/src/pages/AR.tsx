import { useState, useEffect } from 'react';
import { Camera, Mic, CreditCard, RefreshCw, ZoomIn, ZoomOut, Maximize2, X, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import { ARCustomerCard } from '@/components/ARCustomerCard';
import { useSpeechRecognition, useFaceRecognition } from '@/hooks';
import { formatPrice } from '@/utils';

export const AR = () => {
  const arCustomers = useAppStore((state) => state.arCustomers);
  const updateARCustomers = useAppStore((state) => state.updateARCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { isListening, transcript, startListening } = useSpeechRecognition();
  const { isDetecting, detectedCustomer, faces, videoRef, startDetection, stopDetection } = useFaceRecognition();

  useEffect(() => {
    if (detectedCustomer) {
      setSelectedCustomerId(detectedCustomer);
      updateARCustomers(arCustomers.map(c => 
        c.id === detectedCustomer ? { ...c, isRecognized: true } : c
      ));
    }
  }, [detectedCustomer, arCustomers, updateARCustomers]);

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId === selectedCustomerId ? null : customerId);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleReset = () => {
    updateARCustomers(arCustomers.map(c => ({ ...c, order: undefined })));
    setSelectedCustomerId(null);
  };

  const selectedCustomer = arCustomers.find(c => c.id === selectedCustomerId);

  const pendingOrders = arCustomers.filter(c => c.order?.status === 'pending').length;
  const paidOrders = arCustomers.filter(c => c.order?.status === 'paid').length;

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-40 h-40 bg-yellow-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-green-500/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-48 bg-white/5 rounded-lg" />
          <div className="absolute top-1/3 right-1/3 w-28 h-44 bg-white/5 rounded-lg" />
          <div className="absolute bottom-1/3 left-1/3 w-36 h-52 bg-white/5 rounded-lg" />
        </div>

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent" />
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-transparent via-primary-500 to-transparent" />
        <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-transparent via-primary-500 to-transparent" />

        <div className="absolute top-4 left-4 flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 rounded-full backdrop-blur-sm">
            <Camera className={`w-4 h-4 ${isDetecting ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
            <span className="text-xs text-white">{isDetecting ? '人脸识别中' : '摄像头就绪'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 rounded-full backdrop-blur-sm">
            <Mic className={`w-4 h-4 ${isListening ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
            <span className="text-xs text-white">{isListening ? '录音中...' : '语音识别就绪'}</span>
          </div>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 rounded-full backdrop-blur-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-300">{pendingOrders} 待支付</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 rounded-full backdrop-blur-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-300">{paidOrders} 已支付</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              <span className="px-3 py-1 bg-black/50 rounded-lg text-white text-sm">{(zoom * 100).toFixed(0)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => isDetecting ? stopDetection() : startDetection()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDetecting
                    ? 'bg-green-500 text-white'
                    : 'bg-black/50 text-white hover:bg-black/70'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-medium">{isDetecting ? '停止识别' : '开始人脸识别'}</span>
              </button>

              <button
                onClick={handleReset}
                className="p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={handleToggleFullscreen}
                className="p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
              >
                <Maximize2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {videoRef && (
          <div className="absolute bottom-20 right-4 w-32 h-40 border-2 border-primary-500/50 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {faces.map((face, index) => (
              <div
                key={index}
                className="absolute border-2 border-green-400 rounded"
                style={{
                  left: `${face.box.x}px`,
                  top: `${face.box.y}px`,
                  width: `${face.box.width}px`,
                  height: `${face.box.height}px`,
                }}
              />
            ))}
          </div>
        )}

        <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
          {arCustomers.map(customer => (
            <ARCustomerCard
              key={customer.id}
              customer={customer}
              onClick={() => handleCustomerClick(customer.id)}
              isListening={isListening}
              onStartListening={startListening}
            />
          ))}
        </div>

        {isListening && transcript && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-xl px-6 py-4 max-w-md shadow-2xl">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-red-400 animate-pulse" />
              <p className="text-white text-lg font-medium">{transcript}</p>
            </div>
          </div>
        )}

        {selectedCustomer && (
          <div className="absolute top-20 right-4 bg-white/95 backdrop-blur-md rounded-xl p-4 w-72 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedCustomer.isRecognized ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <User className={`w-4 h-4 ${selectedCustomer.isRecognized ? 'text-green-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{selectedCustomer.name}</h3>
                  <p className={`text-xs ${selectedCustomer.isRecognized ? 'text-green-600' : 'text-gray-400'}`}>
                    {selectedCustomer.isRecognized ? '已识别' : '未识别'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {selectedCustomer.order && (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium ${
                  selectedCustomer.order.status === 'paid' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedCustomer.order.status === 'paid' ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  {selectedCustomer.order.status === 'paid' ? '绿色菜单 - 已支付' : '黄色菜单 - 待支付'}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-500">订单详情</p>
                  {selectedCustomer.order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-700">{item.productName} x{item.quantity}</span>
                        {item.flavor && (
                          <span className="text-xs text-gray-400 ml-1">({item.flavor})</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">¥{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-800">合计</span>
                    <span className={`text-lg font-bold ${
                      selectedCustomer.order.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      ¥{formatPrice(selectedCustomer.order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {!selectedCustomer.order && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">点击下方"语音点餐"</p>
                <p className="text-xs text-gray-400 mt-1">系统将自动识别对话内容生成订单</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
