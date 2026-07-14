import { useState, useRef } from 'react';
import { Camera, Upload, Check, X, Sparkles, ArrowLeft, Star } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function Checkin() {
  const [image, setImage] = useState<string | null>(null);
  const [tennisCount, setTennisCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const { addCheckin } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setTennisCount(0);
        setIsSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (tennisCount <= 0) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      const points = tennisCount * 20;
      addCheckin(tennisCount, image || '');
      setPointsEarned(points);
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  const handleReset = () => {
    setImage(null);
    setTennisCount(0);
    setIsSuccess(false);
    setPointsEarned(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 pt-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 mb-8">
          <button className="p-2 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">拍照打卡</h1>
        </div>

        {!image ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" onClick={handleCameraClick}>
              <Camera className="w-16 h-16 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">拍摄或上传网球照片</h2>
            <p className="text-gray-500 mb-6">
              请拍摄您收集的旧网球，系统将自动识别数量并给予积分奖励
            </p>
            <button
              onClick={handleCameraClick}
              className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all mb-4"
            >
              <div className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                <span>拍照上传</span>
              </div>
            </button>
            <label className="w-full py-4 bg-white text-gray-700 rounded-xl font-bold text-lg border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors cursor-pointer">
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                <span>从相册选择</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : isSuccess ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center animate-bounce-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
              <Check className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">打卡成功！</h2>
            <p className="text-gray-500 mb-6">感谢您的环保贡献！</p>
            
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-accent-600" />
                <span className="text-gray-600">本次获得积分</span>
              </div>
              <div className="text-5xl font-bold text-accent-600 mb-2">+{pointsEarned}</div>
              <div className="text-gray-500 text-sm">回收 {tennisCount} 个网球</div>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              {[...Array(Math.min(5, Math.floor(tennisCount / 5)))].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors"
              >
                继续打卡
              </button>
              <button
                className="flex-1 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                查看积分
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="relative">
              <img
                src={image}
                alt="网球照片"
                className="w-full h-64 object-cover"
              />
              <button
                onClick={handleReset}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">确认网球数量</h2>
              
              <div className="flex items-center justify-center gap-6 mb-8">
                <button
                  onClick={() => setTennisCount(Math.max(0, tennisCount - 1))}
                  className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  -
                </button>
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary-600">{tennisCount}</div>
                  <div className="text-gray-500 text-sm">个网球</div>
                </div>
                <button
                  onClick={() => setTennisCount(tennisCount + 1)}
                  className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all"
                >
                  +
                </button>
              </div>

              <div className="bg-accent-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">预计获得积分</span>
                  <span className="text-xl font-bold text-accent-600">🎁 {tennisCount * 20}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">每回收1个网球可获得20积分</div>
              </div>

              {isProcessing ? (
                <button
                  disabled
                  className="w-full py-4 bg-gray-200 text-gray-400 rounded-xl font-bold text-lg cursor-not-allowed"
                >
                  正在识别...
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={tennisCount <= 0}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    tennisCount > 0
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  确认提交
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-800 mb-4">📸 打卡指南</h3>
          <ul className="space-y-3 text-gray-600 text-sm">
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span>将收集的旧网球摆放在明亮处，确保清晰可见</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span>拍摄照片或从相册选择，系统将进行AI识别</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span>确认网球数量，提交后即可获得积分奖励</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
