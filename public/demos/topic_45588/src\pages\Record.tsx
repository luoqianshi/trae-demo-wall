import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStories } from '@/hooks/useStories';

export default function Record() {
  const navigate = useNavigate();
  const { addStory } = useStories();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    catName: '',
    catFeatures: '',
    lostTime: '',
    lostLocation: '',
    foundTime: '',
    foundLocation: '',
    distance: '',
    story: '',
    photoUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.lostTime) errs.lostTime = '请选择走失时间';
    if (!form.lostLocation) errs.lostLocation = '请填写走失地点';
    if (!form.foundTime) errs.foundTime = '请选择找回时间';
    if (!form.foundLocation) errs.foundLocation = '请填写找回地点';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    addStory({
      catName: form.catName || '未命名猫咪',
      catFeatures: form.catFeatures || undefined,
      lostTime: form.lostTime,
      lostLocation: form.lostLocation,
      foundTime: form.foundTime,
      foundLocation: form.foundLocation,
      distance: form.distance ? Number(form.distance) : undefined,
      story: form.story || undefined,
      photoUrl: form.photoUrl || undefined,
    });
    setSubmitted(true);
    setTimeout(() => navigate('/'), 2500);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('照片大小不能超过5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, photoUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  if (submitted) {
    return (
      <div className="page flex flex-col items-center justify-center text-center">
        <div className="card w-full max-w-sm">
          <div className="flex justify-center mb-4">
            <img
              src="/images/record-success.jpg"
              alt="幸福的猫咪"
              className="w-28 h-28 rounded-3xl object-cover"
              style={{ boxShadow: '0 4px 16px rgba(61,213,152,0.2)' }}
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">感谢你的分享！</h2>
          <p className="text-gray-500 text-sm mb-4">
            你的经验将帮助更多迷失的小猫咪<br />找到回家的路
          </p>
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl mb-5"
            style={{ background: '#FFF5F0' }}>
            <span>✨</span>
            <span className="text-sm text-gray-600">你的故事已加入寻猫大数据，帮助更多铲屎官</span>
          </div>
          <button onClick={() => navigate('/')} className="btn-coral">
            ♥ 返回首页
          </button>
          <p className="text-xs text-gray-400 mt-3">2秒后自动返回...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page overflow-hidden">
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#FFE0E0] opacity-50 pointer-events-none" />

      {/* 导航栏 */}
      <div className="flex items-center gap-3 mb-6 relative">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
        >
          <span className="text-gray-500 text-lg">←</span>
        </button>
        <h1 className="text-lg font-bold text-gray-800">找猫经历</h1>
      </div>

      {/* 顶部说明 */}
      <div className="card text-center mb-6 relative overflow-hidden">
        <div className="flex justify-center mb-4">
          <img
            src="/images/warm-cat.jpg"
            alt="开心的猫咪"
            className="w-28 h-28 rounded-3xl object-cover"
            style={{ boxShadow: '0 4px 16px rgba(255,107,107,0.15)' }}
          />
        </div>
        <p className="text-gray-700 font-medium mb-1">太棒了！你找到了猫咪</p>
        <p className="text-sm text-gray-400">把你的经验分享出来，帮助更多铲屎官</p>
      </div>

      {/* 表单 */}
      <div className="card space-y-5">
        {/* 猫咪信息 */}
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <span>🐱</span> 猫咪信息 <span className="text-xs text-gray-400 font-normal">（选填）</span>
          </p>
          <div className="space-y-3">
            <input className="input-box" placeholder="猫咪名字 · 例如：小白" value={form.catName} onChange={e => setForm({ ...form, catName: e.target.value })} />
            <input className="input-box" placeholder="猫咪特征 · 例如：橘猫，左耳有缺口" value={form.catFeatures} onChange={e => setForm({ ...form, catFeatures: e.target.value })} />
          </div>
        </div>

        {/* 走失信息 */}
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <span>📍</span> 走失信息
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">走失时间 <span className="text-red-500">*</span></label>
              <input type="date" className={`input-box ${errors.lostTime ? 'input-error' : ''}`} value={form.lostTime} onChange={e => setForm({ ...form, lostTime: e.target.value })} />
              {errors.lostTime && <p className="text-red-500 text-xs mt-1">{errors.lostTime}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">走失地点 <span className="text-red-500">*</span></label>
              <input className={`input-box ${errors.lostLocation ? 'input-error' : ''}`} placeholder="例如：朝阳区望京街道" value={form.lostLocation} onChange={e => setForm({ ...form, lostLocation: e.target.value })} />
              {errors.lostLocation && <p className="text-red-500 text-xs mt-1">{errors.lostLocation}</p>}
            </div>
          </div>
        </div>

        {/* 找回信息 */}
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <span>🎉</span> 找回信息
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">找回时间 <span className="text-red-500">*</span></label>
              <input type="date" className={`input-box ${errors.foundTime ? 'input-error' : ''}`} value={form.foundTime} onChange={e => setForm({ ...form, foundTime: e.target.value })} />
              {errors.foundTime && <p className="text-red-500 text-xs mt-1">{errors.foundTime}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">找回地点 <span className="text-red-500">*</span></label>
              <input className={`input-box ${errors.foundLocation ? 'input-error' : ''}`} placeholder="例如：楼下绿化带" value={form.foundLocation} onChange={e => setForm({ ...form, foundLocation: e.target.value })} />
              {errors.foundLocation && <p className="text-red-500 text-xs mt-1">{errors.foundLocation}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">估计距离（米）</label>
              <input type="number" className="input-box" placeholder="例如：200" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} />
            </div>
          </div>
        </div>

        {/* 照片上传 */}
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <span>📸</span> 猫咪照片 <span className="text-xs text-gray-400 font-normal">（选填）</span>
          </p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          {form.photoUrl ? (
            <div className="relative inline-block">
              <img src={form.photoUrl} alt="猫咪照片" className="w-24 h-24 rounded-2xl object-cover" />
              <button onClick={() => setForm({ ...form, photoUrl: '' })} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white shadow text-gray-400 text-xs flex items-center justify-center hover:text-red-500">✕</button>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-[#FFB8B8] transition-colors">
              <span className="text-3xl mb-2 block">📷</span>
              <p className="text-sm text-gray-500">点击上传猫咪照片</p>
              <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、GIF、WebP，最大 5MB</p>
            </div>
          )}
        </div>

        {/* 搜寻心得 */}
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <span>💬</span> 搜寻心得
          </p>
          <textarea
            className="input-box min-h-[100px] resize-none"
            placeholder="分享你是怎么找到猫咪的，帮助其他人..."
            value={form.story}
            onChange={e => setForm({ ...form, story: e.target.value })}
          />
        </div>
      </div>

      {/* 提交按钮 */}
      <button onClick={handleSubmit} className="btn-coral mt-5">
        ✨ 分享找猫经历
      </button>

      <p className="text-center text-xs text-gray-400 mt-3">
        感谢你的分享，这将帮助更多迷失的小猫咪找到回家的路 💕
      </p>

      <div className="h-8" />
    </div>
  );
}