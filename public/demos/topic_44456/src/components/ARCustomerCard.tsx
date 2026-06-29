import { useState } from 'react';
import { Mic, CreditCard, Check, User, AlertCircle } from 'lucide-react';
import type { ARCustomer } from '@/types';
import { formatPrice } from '@/utils';
import { useAppStore } from '@/store';

interface ARCustomerCardProps {
  customer: ARCustomer;
  onClick: () => void;
  isListening: boolean;
  onStartListening: (customerId: string) => void;
}

export const ARCustomerCard = ({ customer, onClick, isListening, onStartListening }: ARCustomerCardProps) => {
  const updateOrderStatus = useAppStore((state) => state.updateOrderStatus);
  const payOrder = useAppStore((state) => state.payOrder);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string; remainingAmount?: number } | null>(null);

  const handlePayment = async () => {
    if (!customer.order || customer.order.status !== 'pending') return;
    
    setIsProcessingPayment(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = payOrder(customer.order.id, customer.order.totalAmount);
    
    if (result.success) {
      setPaymentResult({ success: true, message: '支付成功' });
      setTimeout(() => setPaymentResult(null), 2000);
    } else {
      setPaymentResult({ 
        success: false, 
        message: result.message, 
        remainingAmount: result.remainingAmount 
      });
    }
    
    setIsProcessingPayment(false);
  };

  const handlePartialPayment = async () => {
    if (!customer.order || customer.order.status !== 'pending') return;
    
    setIsProcessingPayment(true);
    setShowPaymentWarning(false);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const partialAmount = customer.order.totalAmount * 0.7;
    const result = payOrder(customer.order.id, partialAmount);
    
    setPaymentResult({ 
      success: result.success, 
      message: result.message, 
      remainingAmount: result.remainingAmount 
    });
    
    setIsProcessingPayment(false);
  };

  const isPending = customer.order?.status === 'pending';
  const isPaid = customer.order?.status === 'paid';

  return (
    <div
      className={`absolute transform -translate-x-1/2 transition-all duration-300 ${
        isPaid ? 'opacity-80' : 'opacity-100'
      }`}
      style={{ left: `${customer.position.x}%`, top: `${customer.position.y}%` }}
      onClick={onClick}
    >
      <div
        className={`relative w-52 rounded-2xl p-3 backdrop-blur-md border-2 shadow-lg transition-all duration-500 ${
          isPaid
            ? 'border-green-400 bg-green-50/80'
            : isPending
            ? 'border-yellow-400 bg-yellow-50/80 animate-pulse-border'
            : 'border-gray-300 bg-white/80'
        }`}
      >
        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
              isPaid ? 'border-green-400 bg-green-100' : isPending ? 'border-yellow-400 bg-yellow-100' : 'border-gray-300 bg-gray-100'
            }`}
          >
            {customer.isRecognized ? (
              <User className={`w-6 h-6 ${isPaid ? 'text-green-600' : isPending ? 'text-yellow-600' : 'text-gray-500'}`} />
            ) : (
              <div className="w-4 h-4 bg-gray-400 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        <div className="mt-2 text-center">
          <p className={`font-bold text-sm ${isPaid ? 'text-green-700' : isPending ? 'text-yellow-700' : 'text-gray-700'}`}>
            {customer.name}
          </p>
          {customer.isRecognized && (
            <p className="text-xs text-gray-500 mt-0.5">已识别</p>
          )}
        </div>

        {customer.order && (
          <div className="mt-2 pt-2 border-t border-gray-200/50">
            <div className="max-h-20 overflow-y-auto space-y-1">
              {customer.order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate flex-1">
                    {item.productName} x{item.quantity}
                    {item.flavor && <span className="text-gray-400"> ({item.flavor})</span>}
                  </span>
                  <span className="text-gray-500 ml-2">¥{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50">
              <span className="text-xs font-medium text-gray-600">合计</span>
              <span className={`text-lg font-bold ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                ¥{formatPrice(customer.order.totalAmount)}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          {!customer.order && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartListening(customer.id);
              }}
              disabled={isListening}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                isListening
                  ? 'bg-red-100 text-red-600'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-pulse' : ''}`} />
              {isListening ? '录音中...' : '语音点餐'}
            </button>
          )}
          {isPending && !showPaymentWarning && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePayment();
                }}
                disabled={isProcessingPayment}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isProcessingPayment
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                {isProcessingPayment ? '支付中...' : '人脸支付'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPaymentWarning(true);
                }}
                className="px-3 py-2 rounded-lg text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors"
                title="模拟支付不足"
              >
                <AlertCircle className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {isPending && showPaymentWarning && (
            <div className="flex flex-col gap-2 w-full">
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                模拟支付金额不足
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePartialPayment();
                }}
                disabled={isProcessingPayment}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                确认少付
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPaymentWarning(false);
                }}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                返回
              </button>
            </div>
          )}
          {isPaid && (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-100 text-green-600 text-xs font-medium">
              <Check className="w-3.5 h-3.5" />
              已支付
            </div>
          )}
        </div>

        {paymentResult && (
          <div className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center ${
            paymentResult.success ? 'bg-green-500/90' : 'bg-red-500/90'
          }`}>
            {paymentResult.success ? (
              <Check className="w-8 h-8 text-white mb-1" />
            ) : (
              <AlertCircle className="w-8 h-8 text-white mb-1" />
            )}
            <p className="text-white text-xs font-medium">{paymentResult.message}</p>
            {paymentResult.remainingAmount !== undefined && (
              <p className="text-white/80 text-xs mt-1">
                还差 ¥{formatPrice(paymentResult.remainingAmount)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
