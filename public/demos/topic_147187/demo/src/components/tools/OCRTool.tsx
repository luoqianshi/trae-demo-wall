import { useState } from 'react';
import { Image, FileText, Upload, X } from 'lucide-react';

export const OCRTool = ({ onClose }: { onClose: () => void }) => {
  const [uploadedText, setUploadedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mockOCRResult = `这是一段模拟的OCR识别结果文本。

题目：小明有5个苹果，分给小红2个，还剩下几个？

解析：这是一道简单的减法应用题。
5 - 2 = 3

答案：小明还剩下3个苹果。`;

  const handleUpload = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setUploadedText(mockOCRResult);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <Image className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-white">OCR识别</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {!uploadedText ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">点击下方按钮上传图片进行OCR识别</p>
            <button
              onClick={handleUpload}
              disabled={isProcessing}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              {isProcessing ? '识别中...' : '上传图片'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <FileText className="w-4 h-4" />
              <span>识别结果</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 whitespace-pre-wrap text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
              {uploadedText}
            </div>
            <button
              onClick={() => setUploadedText('')}
              className="w-full py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              重新上传
            </button>
          </div>
        )}
      </div>
    </div>
  );
};