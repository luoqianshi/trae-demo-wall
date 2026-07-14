import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Gift } from '@/types';
import { useStore } from '@/store/useStore';

interface RedeemModalProps {
  gift: Gift | null;
  onClose: () => void;
}

export function RedeemModal({ gift, onClose }: RedeemModalProps) {
  const { user, redeemGift } = useStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRedeem = () => {
    if (!gift) return;
    setIsProcessing(true);
    setTimeout(() => {
      redeemGift(gift.price);
      setIsSuccess(true);
      setIsProcessing(false);
    }, 1000);
  };

  if (!gift) return null;
  const canAfford = user.points >= gift.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl animate-bounce-in">
        {isSuccess ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">兑换成功!</h3>
            <p className="text-gray-500 mb-6">您已成功兑换 "{gift.name}"，感谢您的环保贡献！</p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              确定
            </button>
          </div>
        ) : (
          <>
            <div className="h-32 bg-gradient-to-br from-primary-400 to-primary-600 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={gift.image}
                alt={gift.name}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-24 h-24 rounded-xl shadow-lg object-cover border-4 border-white"
              />
            </div>
            <div className="p-6 pt-14">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{gift.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{gift.description}</p>
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-600">所需积分</span>
                <span className={`text-xl font-bold ${canAfford ? 'text-accent-600' : 'text-red-500'}`}>
                  🎁 {gift.price}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">当前积分</span>
                  <span className="font-medium text-gray-800">{user.points}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      canAfford ? 'bg-primary-500' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, (user.points / gift.price) * 100)}%` }}
                  />
                </div>
              </div>
              <button
                onClick={handleRedeem}
                disabled={!canAfford || isProcessing}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  canAfford && !isProcessing
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? '处理中...' : canAfford ? '确认兑换' : '积分不足'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
