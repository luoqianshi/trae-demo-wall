import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import type { Partner, Personality } from '@/types';
import { PERSONALITY_LABELS } from '@/types';

export function Settings() {
  const navigate = useNavigate();
  const { partner, setPartner, updatePartner, clearCards, setPomodoroDuration, currentPomodoroDuration } = useStore();
  
  const [name, setName] = useState(partner?.name || '');
  const [nickname, setNickname] = useState(partner?.nickname || '');
  const [personality, setPersonality] = useState<Personality>(partner?.personality || 'gentle');
  const [avatarUrl, setAvatarUrl] = useState(partner?.avatarUrl || '');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleGenerateAvatar = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const mockAvatar = 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20minimalist%20paper%20cut%20style%20character%20avatar%20soft%20blue%20background&image_size=square';
    setAvatarUrl(mockAvatar);
    setIsGenerating(false);
  };
  
  const handleSave = () => {
    const newPartner: Partner = {
      id: partner?.id || Math.random().toString(36).substring(2, 11),
      name: name || '小伴',
      personality,
      nickname: nickname || '同学',
      avatarUrl,
    };
    
    setPartner(newPartner);
    navigate('/pomodoro');
  };
  
  const handleClearCards = () => {
    if (confirm('确定要清除所有背诵卡片吗？')) {
      clearCards();
    }
  };
  
  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="max-w-md mx-auto px-6 pt-8">
        <div className="flex items-center gap-2 mb-8">
          <button onClick={() => navigate('/pomodoro')} className="p-2 hover:bg-light-gray rounded-full transition-colors">
            ←
          </button>
          <h1 className="text-xl font-semibold text-charcoal">设置</h1>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-charcoal mb-6">人偶设置</h2>
          
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className={`w-24 h-24 rounded-full ${avatarUrl ? '' : 'bg-gradient-to-br from-fog-blue to-soft-blue'} flex items-center justify-center`}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-3xl">{name.charAt(0) || '?'}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-charcoal text-white rounded-full flex items-center justify-center text-sm shadow-md hover:bg-gray-700 transition-colors"
              >
                📷
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            <button
              onClick={handleGenerateAvatar}
              disabled={isGenerating}
              className="px-4 py-2 bg-light-gray text-warm-gray rounded-lg text-sm font-medium hover:bg-soft-blue transition-colors disabled:opacity-50"
            >
              {isGenerating ? '生成中...' : 'AI生成形象'}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-warm-gray mb-2">人偶称呼</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="给人偶起个名字"
                className="w-full px-4 py-3 bg-light-gray rounded-xl border-none focus:ring-2 focus:ring-fog-blue outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm text-warm-gray mb-2">你的称呼</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="人偶如何称呼你"
                className="w-full px-4 py-3 bg-light-gray rounded-xl border-none focus:ring-2 focus:ring-fog-blue outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm text-warm-gray mb-2">人偶性格</label>
              <div className="grid grid-cols-3 gap-3">
                {(['gentle', 'strict', 'playful'] as Personality[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPersonality(p)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      personality === p
                        ? 'bg-charcoal text-white'
                        : 'bg-light-gray text-warm-gray hover:bg-soft-blue'
                    }`}
                  >
                    {PERSONALITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-charcoal mb-6">番茄钟设置</h2>
          
          <div>
            <label className="block text-sm text-warm-gray mb-2">默认时长</label>
            <div className="flex gap-3">
              {[25, 45, 60].map((duration) => (
                <button
                  key={duration}
                  onClick={() => setPomodoroDuration(duration)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentPomodoroDuration === duration
                      ? 'bg-fog-blue text-charcoal'
                      : 'bg-light-gray text-warm-gray hover:bg-soft-blue'
                  }`}
                >
                  {duration}分钟
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-charcoal mb-6">数据管理</h2>
          
          <button
            onClick={handleClearCards}
            className="w-full py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
          >
            清除背诵卡片
          </button>
        </div>
        
        <button
          onClick={handleSave}
          className="w-full py-4 bg-charcoal text-white rounded-xl font-medium hover:bg-gray-700 transition-colors shadow-lg"
        >
          保存设置
        </button>
        
        <div className="mt-8 text-center text-xs text-warm-gray">
          <p>AI学习伴侣 v1.0</p>
          <p className="mt-1">极简治愈，专注学习</p>
        </div>
      </div>
    </div>
  );
}
