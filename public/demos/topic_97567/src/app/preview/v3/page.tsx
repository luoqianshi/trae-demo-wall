'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AIFeedback from '@/app/components/AIFeedback';
import { ReturnWelcome } from '@/app/components/ReturnWelcome';
import { DiscoveryCard } from '@/app/components/DiscoveryCard';
import OnboardingFlow from '@/app/components/OnboardingFlow';
import type { Discovery } from '@/lib/discovery-engine';

const SAMPLE_FEEDBACK = [
  {
    content: '哇！你记录了"今天主动发言了"，我又变大了一圈！每一步小小的成功都在让我越滚越大。嘿嘿~继续保持！',
    emotion: 'positive',
  },
  {
    content: '别急，慢慢来~你已经在面对了，这本身就是勇气。现在能做的一件小事是什么？先完成它，我就会开始滚动。🌬️',
    emotion: 'anxious',
  },
  {
    content: '今天能来就已经很棒了，我在呢~哪怕只滚了一点点，也是在前进。☁️',
    emotion: 'depressed',
  },
  {
    content: '嘿嘿，我又长大了一点点！❄️',
    emotion: 'micro',
  },
];

const SAMPLE_DISCOVERIES: Discovery[] = [
  {
    type: 'pattern',
    title: '你在持续关注「运动」',
    content: '我注意到你最近3次记录都和「运动」有关。这种持续的关注，说明你正在这个方向上积累力量 🦋',
    relatedRecordIndices: [0, 1, 2],
  },
  {
    type: 'comparison',
    title: '你在加速成长',
    content: '相比上周，这周你的记录多了3条。你正在从"想"变成"做"，这种转变让我很开心！ 👏',
  },
];

export default function V3PreviewPage() {
  const [showReturnWelcome, setShowReturnWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<number | null>(null);
  const [selectedDiscovery, setSelectedDiscovery] = useState<number | null>(null);
  const [daysInactive, setDaysInactive] = useState(5);

  const currentFeedback = selectedFeedback !== null ? SAMPLE_FEEDBACK[selectedFeedback].content : undefined;
  const currentDiscovery = selectedDiscovery !== null ? SAMPLE_DISCOVERIES[selectedDiscovery] : undefined;

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-[#87CEEB] to-[#FFB6C1] rounded-3xl p-6 mb-6 shadow-lg">
          <h1 className="text-2xl font-bold text-white">V3 迭代预览</h1>
          <p className="text-white/80 text-sm mt-1">雪球效应体验层强化</p>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-[#87CEEB] mb-4">1. AI反馈雪球口吻</h2>
            <p className="text-sm text-gray-500 mb-4">点击不同情绪查看对应的雪球反馈风格</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {SAMPLE_FEEDBACK.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedFeedback(i)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                    selectedFeedback === i
                      ? 'bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.emotion === 'positive' && '😊 积极情绪'}
                  {f.emotion === 'anxious' && '😰 焦虑情绪'}
                  {f.emotion === 'depressed' && '😢 低落情绪'}
                  {f.emotion === 'micro' && '✨ 简短反馈'}
                </button>
              ))}
            </div>

            {selectedFeedback !== null && (
              <AIFeedback feedback={currentFeedback} />
            )}
          </section>

          <section className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-[#FFD700] mb-4">2. AI主动发现洞察</h2>
            <p className="text-sm text-gray-500 mb-4">点击查看不同类型的洞察卡片</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {SAMPLE_DISCOVERIES.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDiscovery(i)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                    selectedDiscovery === i
                      ? 'bg-gradient-to-r from-[#FFD700] to-[#87CEEB] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d.type === 'pattern' && '🔍 模式发现'}
                  {d.type === 'comparison' && '📊 对比发现'}
                </button>
              ))}
            </div>

            {selectedDiscovery !== null && (
              <div className="bg-gradient-to-r from-[#FFB6C1]/10 to-[#87CEEB]/10 rounded-2xl p-4 mt-3 border border-[#FFB6C1]/20">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">❄️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#FFB6C1] mb-1">雪球说</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {SAMPLE_FEEDBACK[0].content}
                    </p>
                  </div>
                </div>
                <DiscoveryCard discovery={SAMPLE_DISCOVERIES[selectedDiscovery]} />
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-[#FFB6C1] mb-4">3. 回归欢迎弹窗</h2>
            <p className="text-sm text-gray-500 mb-4">模拟用户中断3天+后回归的场景</p>
            
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm text-gray-600">中断天数：</label>
              <input
                type="range"
                min="3"
                max="30"
                value={daysInactive}
                onChange={(e) => setDaysInactive(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-[#87CEEB]">{daysInactive} 天</span>
            </div>

            <button
              onClick={() => setShowReturnWelcome(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#87CEEB] to-[#FFB6C1] text-white rounded-2xl font-medium hover:shadow-lg transition-all"
            >
              显示回归欢迎弹窗
            </button>
          </section>

          <section className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-[#87CEEB] mb-4">4. 连续天数文案改造</h2>
            <p className="text-sm text-gray-500 mb-4">"连续打卡"改为"连续滚雪球"</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-2">导航栏下拉卡片</p>
                <div className="text-sm text-gray-600">
                  今日 +5分 · <span className="text-[#87CEEB] font-medium">连续滚雪球 7 天</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-2">庆祝效果</p>
                <div className="text-sm text-gray-600">
                  <span className="text-[#FFB6C1] font-medium">连续滚雪球第7天！🔥</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-[#FFD700] mb-4">5. 回顾页动能数据卡片</h2>
            <p className="text-sm text-gray-500 mb-4">在回顾页"雪球状态"区域展示动能数据</p>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 flex justify-center items-center bg-gradient-to-br from-[#87CEEB]/10 to-[#FFB6C1]/10 rounded-2xl p-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#87CEEB] to-[#FFB6C1] rounded-full flex items-center justify-center text-4xl mx-auto mb-2">
                    ⛄
                  </div>
                  <p className="text-sm text-gray-500">小雪球</p>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center gap-4">
                <div className="bg-gradient-to-br from-[#FFB6C1]/20 to-[#FFB6C1]/5 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-[#FFB6C1]">156</p>
                  <p className="text-sm text-gray-400 mt-1">雪球体积 · 小雪球</p>
                </div>
                
                <div className="bg-gradient-to-br from-[#87CEEB]/20 to-[#87CEEB]/5 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-[#87CEEB]">7</p>
                  <p className="text-sm text-gray-400 mt-1">连续滚雪球 · 天</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-[#FFB6C1] mb-4">6. 初次登录引导流程</h2>
            <p className="text-sm text-gray-500 mb-4">新用户首次打开App时看到的4步引导</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">😔→😊</div>
                <p className="text-xs text-gray-500">Step 1: 问题共鸣</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">✏️</div>
                <p className="text-xs text-gray-500">Step 2: 体验记录</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">❄️</div>
                <p className="text-xs text-gray-500">Step 3: 雪球惊喜</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">🤝</div>
                <p className="text-xs text-gray-500">Step 4: 做个约定</p>
              </div>
            </div>

            <button
              onClick={() => setShowOnboarding(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl font-medium hover:shadow-lg transition-all"
            >
              体验完整引导流程
            </button>
          </section>
        </div>
      </div>

      <ReturnWelcome
        isVisible={showReturnWelcome}
        daysInactive={daysInactive}
        onQuickRecord={() => {
          setShowReturnWelcome(false);
          alert('点击了"记一件今天的小事"');
        }}
        onEasyRoll={() => {
          setShowReturnWelcome(false);
          alert('点击了"轻松滚一下就好"');
        }}
        onDismiss={() => setShowReturnWelcome(false)}
      />

      {showOnboarding && (
        <OnboardingFlow
          onComplete={() => setShowOnboarding(false)}
          onCreateRecord={() => {}}
        />
      )}
    </div>
  );
}
