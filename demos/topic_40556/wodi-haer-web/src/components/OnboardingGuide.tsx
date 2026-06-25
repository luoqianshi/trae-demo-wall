import React, { useState, useEffect, useCallback } from 'react';

interface OnboardingGuideProps {
  onComplete: () => void;
}

// 引导步骤数据
const steps = [
  {
    emoji: '👶',
    title: '欢迎使用吾滴孩儿',
    description: '记录宝宝成长的每一个珍贵瞬间，从第一次微笑到第一步蹒跚，我们陪伴您见证所有美好时刻。',
    icon: null,
  },
  {
    emoji: '📝',
    title: '添加宝宝信息',
    description: '前往个人中心，添加您可爱的宝宝信息。设置昵称、生日、性别等，让我们更好地为您服务。',
    icon: '👤',
  },
  {
    emoji: '📊',
    title: '记录日常点滴',
    description: '轻松记录宝宝的喂养、睡眠、排便等日常数据，科学追踪成长轨迹，让育儿更轻松。',
    icons: ['🍼', '😴', '💩'],
  },
  {
    emoji: '🚀',
    title: '准备好开始了吗？',
    description: '点击下方按钮，开启您的育儿记录之旅！我们会一直陪伴在您身边。',
    icon: '✨',
  },
];

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  // 检查是否已完成引导（虽然通常由父组件控制，这里做双重保险）
  useEffect(() => {
    const isDone = localStorage.getItem('wdhr_onboarding_done');
    if (isDone === 'true') {
      onComplete();
    }
  }, [onComplete]);

  // 切换到下一步
  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection('right');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentStep]);

  // 切换到上一步
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection('left');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentStep]);

  // 跳过引导
  const skipOnboarding = useCallback(() => {
    localStorage.setItem('wdhr_onboarding_done', 'true');
    onComplete();
  }, [onComplete]);

  // 完成引导
  const completeOnboarding = useCallback(() => {
    localStorage.setItem('wdhr_onboarding_done', 'true');
    onComplete();
  }, [onComplete]);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep === steps.length - 1) {
          completeOnboarding();
        } else {
          nextStep();
        }
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      } else if (e.key === 'Escape') {
        skipOnboarding();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, nextStep, prevStep, completeOnboarding, skipOnboarding]);

  // 触摸滑动支持
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) { // 最小滑动距离
      if (diff > 0) {
        nextStep(); // 向左滑 → 下一步
      } else {
        prevStep(); // 向右滑 → 上一步
      }
    }
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div
      className="onboarding-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 75%, #f5576c 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflow: 'hidden',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 跳过按钮 */}
      <button
        onClick={skipOnboarding}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '20px',
          color: '#fff',
          fontSize: '14px',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.2)';
        }}
      >
        跳过
      </button>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '500px',
          width: '100%',
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating
            ? `translateX(${direction === 'right' ? '-50' : '50'}px)`
            : 'translateX(0)',
          transition: 'all 0.3s ease-out',
        }}
      >
        {/* Emoji图标 */}
        <div
          style={{
            fontSize: '120px',
            marginBottom: '30px',
            animation: isAnimating ? 'none' : 'fadeInUp 0.6s ease-out',
            filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2))',
          }}
        >
          {step.emoji}
        </div>

        {/* 标题 */}
        <h1
          style={{
            color: '#fff',
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '16px',
            textAlign: 'center',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            animation: isAnimating ? 'none' : 'fadeInUp 0.6s ease-out 0.1s both',
          }}
        >
          {step.title}
        </h1>

        {/* 描述文字 */}
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '16px',
            lineHeight: '1.6',
            textAlign: 'center',
            marginBottom: '40px',
            animation: isAnimating ? 'none' : 'fadeInUp 0.6s ease-out 0.2s both',
          }}
        >
          {step.description}
        </p>

        {/* 额外图标展示（第2、3步） */}
        {step.icon && (
          <div
            style={{
              fontSize: '60px',
              marginBottom: '20px',
              animation: 'bounce 2s infinite',
            }}
          >
            {step.icon}
          </div>
        )}

        {step.icons && (
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginTop: '10px',
            }}
          >
            {step.icons.map((icon, index) => (
              <div
                key={index}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`,
                }}
              >
                {icon}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 圆点指示器 */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '30px',
        }}
      >
        {steps.map((_, index) => (
          <div
            key={index}
            onClick={() => {
              if (index !== currentStep) {
                setDirection(index > currentStep ? 'right' : 'left');
                setIsAnimating(true);
                setTimeout(() => {
                  setCurrentStep(index);
                  setIsAnimating(false);
                }, 300);
              }
            }}
            style={{
              width: currentStep === index ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: currentStep === index ? '#fff' : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: currentStep === index ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
            }}
          />
        ))}
      </div>

      {/* 操作按钮区域 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '40px',
        }}
      >
        {/* 上一步按钮（非第一步显示） */}
        {currentStep > 0 && (
          <button
            onClick={prevStep}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.6)',
              background: 'transparent',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              const btn = e.target as HTMLElement;
              btn.style.background = 'rgba(255, 255, 255, 0.2)';
              btn.style.borderColor = '#fff';
            }}
            onMouseLeave={(e) => {
              const btn = e.target as HTMLElement;
              btn.style.background = 'transparent';
              btn.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            ←
          </button>
        )}

        {/* 下一步/完成按钮 */}
        {isLastStep ? (
          <button
            onClick={completeOnboarding}
            style={{
              padding: '14px 40px',
              borderRadius: '25px',
              border: 'none',
              background: '#fff',
              color: '#667eea',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              const btn = e.target as HTMLElement;
              btn.style.transform = 'scale(1.05)';
              btn.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              const btn = e.target as HTMLElement;
              btn.style.transform = 'scale(1)';
              btn.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
            }}
          >
            开始使用 ✨
          </button>
        ) : (
          <button
            onClick={nextStep}
            style={{
              padding: '14px 40px',
              borderRadius: '25px',
              border: 'none',
              background: '#fff',
              color: '#667eea',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              const btn = e.target as HTMLElement;
              btn.style.transform = 'scale(1.05)';
              btn.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              const btn = e.target as HTMLElement;
              btn.style.transform = 'scale(1)';
              btn.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
            }}
          >
            下一步 →
          </button>
        )}
      </div>

      {/* CSS动画定义 */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingGuide;
