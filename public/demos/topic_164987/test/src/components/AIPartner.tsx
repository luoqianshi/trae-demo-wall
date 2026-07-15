import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { PERSONALITY_CONFIG } from '@/types';

interface AIPartnerProps {
  showGreeting?: boolean;
  onComplete?: boolean;
}

export function AIPartner({ showGreeting = false, onComplete = false }: AIPartnerProps) {
  const { partner } = useStore();
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  
  const getRandomMessage = (messages: string[]) => {
    return messages[Math.floor(Math.random() * messages.length)];
  };
  
  useEffect(() => {
    if (!partner) return;
    
    if (showGreeting) {
      const greeting = getRandomMessage(PERSONALITY_CONFIG[partner.personality].greeting);
      setBubbleText(greeting);
      const timer = setTimeout(() => setBubbleText(null), 4000);
      return () => clearTimeout(timer);
    }
    
    if (onComplete) {
      const completion = getRandomMessage(PERSONALITY_CONFIG[partner.personality].completion);
      setBubbleText(completion);
      const timer = setTimeout(() => setBubbleText(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showGreeting, onComplete, partner]);
  
  const handleClick = () => {
    if (!partner || bubbleText) return;
    
    const tip = getRandomMessage(PERSONALITY_CONFIG[partner.personality].focusTips);
    setBubbleText(tip);
    const timer = setTimeout(() => setBubbleText(null), 5000);
    return () => clearTimeout(timer);
  };
  
  if (!partner) {
    return (
      <button
        onClick={() => window.location.href = '/settings'}
        className="fixed bottom-24 right-4 w-14 h-14 bg-soft-blue rounded-full flex items-center justify-center text-2xl shadow-sm hover:shadow-md transition-all animate-float z-50"
      >
        🤖
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-24 right-4 z-50">
      {bubbleText && (
        <div className="absolute bottom-16 right-0 max-w-[180px] bg-charcoal text-white px-4 py-3 rounded-2xl rounded-br-none text-sm shadow-lg animate-slide-up">
          <p className="leading-relaxed">{bubbleText}</p>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-charcoal transform rotate-45 translate-x-1.5 translate-y-1.5" />
        </div>
      )}
      
      <button
        onClick={handleClick}
        onMouseEnter={() => !bubbleText && setIsVisible(true)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all animate-float ${
          bubbleText ? 'ring-2 ring-muted-blue' : ''
        }`}
        title={bubbleText ? '点击关闭' : '点击获取专注建议'}
      >
        {partner.avatarUrl ? (
          <img
            src={partner.avatarUrl}
            alt={partner.name}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-fog-blue to-soft-blue rounded-full flex items-center justify-center text-3xl">
            {partner.name.charAt(0)}
          </div>
        )}
      </button>
      
      <div className="text-center mt-2">
        <span className="text-xs text-warm-gray font-medium">{partner.name}</span>
      </div>
    </div>
  );
}
