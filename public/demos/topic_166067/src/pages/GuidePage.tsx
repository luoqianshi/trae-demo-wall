import { useState, useCallback } from 'react';
import { getApplianceById, getTaskById } from '../data/appliances';

interface GuidePageProps {
  params: Record<string, string>;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function GuidePage({ params, onNavigate }: GuidePageProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(parseInt(params.stepIndex || '0'));
  const [isSpeaking, setIsSpeaking] = useState(false);

  const appliance = getApplianceById(params.applianceId || '');
  const task = getTaskById(params.applianceId || '', params.taskId || '');

  if (!appliance || !task) {
    return (
      <div className="min-h-screen bg-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">未找到相关指导</p>
          <button
            onClick={() => onNavigate('home')}
            className="mt-4 bg-blue-500 text-white text-xl font-bold py-4 px-8 rounded-xl"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const currentStep = task.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === task.steps.length - 1;

  const speak = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentStep.voiceText);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('正在为您朗读当前步骤：' + currentStep.voiceText);
    }
  }, [currentStep.voiceText]);

  const handleNext = () => {
    if (isLastStep) {
      onNavigate('complete', { applianceId: appliance.id, taskId: task.id });
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => onNavigate('appliance', { id: appliance.id })}
          className="mb-4 bg-white hover:bg-gray-50 text-gray-700 text-xl font-bold py-3 px-6 rounded-full appliance-button shadow-md"
        >
          ← 返回
        </button>

        <div className="bg-white rounded-3xl p-6 shadow-lg mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl text-gray-600">{appliance.name}</span>
            <span className="text-xl text-blue-600 font-bold">
              第 {currentStepIndex + 1} 步 / 共 {task.steps.length} 步
            </span>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{currentStep.title}</h2>
            <p className="text-xl text-gray-600 leading-relaxed">{currentStep.instruction}</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-3">示意面板</div>
              <div className="flex justify-center gap-4 flex-wrap">
                {['电源键', '模式键', '启动键', '温度加键', '温度减键', '机门', '洗涤盒', '数字键', '风速键', '解冻键'].map(btn => (
                  <button
                    key={btn}
                    disabled
                    className={`w-16 h-16 rounded-xl text-lg font-bold ${
                      currentStep.highlightButton === btn
                        ? 'bg-green-500 text-white shadow-lg ring-4 ring-green-300 scale-110'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {btn.length > 3 ? btn.substring(0, 2) : btn}
                  </button>
                ))}
              </div>
              {currentStep.highlightButton && (
                <div className="mt-3 text-green-600 text-lg font-medium">
                  ← 请按「{currentStep.highlightButton}」
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={speak}
            className={`w-full bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-4 px-4 rounded-xl appliance-button shadow-md flex items-center justify-center gap-2 ${
              isSpeaking ? 'speaking-indicator' : ''
            }`}
          >
            <span>{isSpeaking ? '🔊' : '🔈'}</span>
            {isSpeaking ? '正在朗读...' : '播放语音'}
          </button>

          <button
            onClick={() => onNavigate('help', { applianceId: appliance.id, taskId: task.id, stepIndex: String(currentStepIndex) })}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold py-4 px-4 rounded-xl appliance-button shadow-md flex items-center justify-center gap-2"
          >
            <span>🙋</span>
            找家人帮忙
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`w-full text-xl font-bold py-4 px-4 rounded-xl appliance-button shadow-md ${
              isFirstStep
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            上一步
          </button>

          <button
            onClick={handleNext}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-4 rounded-xl appliance-button shadow-md"
          >
            {isLastStep ? '完成' : '我完成了，下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}
