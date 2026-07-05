import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, ShieldCheck, Loader2, ArrowRight, LogOut, Sparkles } from 'lucide-react';
import SealStamp from '@/components/SealStamp';
import InkButton from '@/components/InkButton';
import { useAuthStore } from '@/store/useAuthStore';
import { cn, chineseDate } from '@/lib/utils';

const PHONE_RE = /^1[3-9]\d{9}$/;

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const { user, sendCode, verify, loading, error, clearError, logout } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | undefined>();

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // 已登录则跳转
  useEffect(() => {
    if (user) {
      const from = loc.state?.from || '/';
      nav(from, { replace: true });
    }
  }, [user, nav, loc.state]);

  const handleSend = async () => {
    if (!PHONE_RE.test(phone)) {
      useAuthStore.setState({ error: '请输入正确的 11 位手机号' });
      return;
    }
    try {
      const res = await sendCode(phone);
      setDevCode(res.devCode);
      setStep('code');
      setCountdown(60);
    } catch {
      /* error 已写入 store */
    }
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      useAuthStore.setState({ error: '请输入 6 位数字验证码' });
      return;
    }
    try {
      await verify(phone, code);
      // 跳转交给 useEffect
    } catch {
      /* error 已写入 store */
    }
  };

  const handleLogout = () => {
    logout();
    setPhone('');
    setCode('');
    setStep('phone');
    setDevCode(undefined);
  };

  const fillDevCode = () => {
    if (devCode) setCode(devCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-cinnabar/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-celadon/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* 报头 */}
        <div className="text-center mb-8 animate-ink-bloom">
          <div className="inline-flex items-center gap-3 mb-3">
            <SealStamp text="诵" size="lg" rotate={-4} />
            <div className="text-left">
              <h1 className="font-display text-4xl text-ink leading-none">拾诵</h1>
              <div className="font-en text-[10px] text-ink-mute tracking-widest mt-1">SHISONG · 现场记忆</div>
            </div>
          </div>
          <p className="text-xs text-ink-mute">{chineseDate()} · 扫描即诵，默写即改</p>
        </div>

        {/* 已登录卡片 */}
        {user ? (
          <div className="bg-paper border border-ink/10 rounded-sm p-8 shadow-float text-center">
            <div className="font-display text-xl text-ink mb-2">已登录</div>
            <div className="font-mono text-sm text-ink-soft mb-1 tabular">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</div>
            <div className="text-xs text-ink-mute mb-5">注册于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}</div>
            <InkButton variant="primary" size="md" className="w-full" onClick={() => nav('/')}>
              进入拾诵台 <ArrowRight size={14} />
            </InkButton>
            <InkButton variant="ghost" size="sm" className="mt-2" onClick={handleLogout}>
              <LogOut size={12} /> 切换账号
            </InkButton>
          </div>
        ) : (
          <div className="bg-paper border border-ink/10 rounded-sm p-8 shadow-float">
            {/* 步骤指示 */}
            <div className="flex items-center gap-2 mb-6">
              <StepDot active={step === 'phone'} done={step === 'code'} num={1} label="手机号" />
              <div className={cn('flex-1 h-px transition-colors', step === 'code' ? 'bg-cinnabar' : 'bg-ink/10')} />
              <StepDot active={step === 'code'} done={false} num={2} label="验证码" />
            </div>

            {step === 'phone' ? (
              <>
                <label className="block text-xs text-ink-mute mb-2 tracking-wide">手机号</label>
                <div className="relative mb-4">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); clearError(); }}
                    placeholder="请输入 11 位手机号"
                    className="w-full pl-10 pr-3 py-3 font-mono text-base tabular bg-paper-deep/30 border border-ink/15 rounded-sm focus:border-cinnabar transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                </div>
                <InkButton variant="primary" size="md" className="w-full" onClick={handleSend} disabled={loading || phone.length !== 11}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  获取验证码
                </InkButton>
              </>
            ) : (
              <>
                <label className="block text-xs text-ink-mute mb-2 tracking-wide">
                  验证码 <span className="font-mono text-ink-soft">已发送至 {phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                </label>
                <div className="relative mb-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); clearError(); }}
                    placeholder="6 位数字验证码"
                    className="w-full px-3 py-3 font-mono text-2xl tracking-[0.5em] text-center tabular bg-paper-deep/30 border border-ink/15 rounded-sm focus:border-cinnabar transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    autoFocus
                  />
                </div>

                {devCode && (
                  <button
                    onClick={fillDevCode}
                    className="w-full mb-3 px-3 py-2 text-xs text-cinnabar bg-cinnabar/8 border border-cinnabar/30 rounded-sm flex items-center justify-center gap-1.5 hover:bg-cinnabar/12 transition-colors cursor-pointer"
                  >
                    <Sparkles size={12} /> 开发模式：点击填入验证码 <span className="font-mono font-bold">{devCode}</span>
                  </button>
                )}

                <InkButton variant="primary" size="md" className="w-full mb-2" onClick={handleVerify} disabled={loading || code.length !== 6}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  登录
                </InkButton>
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => { setStep('phone'); clearError(); }}
                    className="text-ink-mute hover:text-ink cursor-pointer"
                  >
                    ← 换手机号
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={countdown > 0}
                    className={cn('cursor-pointer', countdown > 0 ? 'text-ink-mute/50' : 'text-cinnabar hover:underline')}
                  >
                    {countdown > 0 ? `${countdown}s 后可重发` : '重新发送'}
                  </button>
                </div>
              </>
            )}

            {error && (
              <div className="mt-4 px-3 py-2 text-xs text-cinnabar bg-cinnabar/8 border border-cinnabar/30 rounded-sm animate-fade-up">
                {error}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-[10px] text-ink-mute mt-6 leading-relaxed">
          首次登录自动注册 · 数据加密同步至云端 · 未登录可离线使用
        </p>
      </div>
    </div>
  );
}

function StepDot({ active, done, num, label }: { active: boolean; done: boolean; num: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono transition-all',
          done ? 'bg-celadon text-paper' : active ? 'bg-cinnabar text-paper' : 'bg-ink/8 text-ink-mute'
        )}
      >
        {done ? '✓' : num}
      </span>
      <span className={cn('text-[10px]', active || done ? 'text-ink' : 'text-ink-mute')}>{label}</span>
    </div>
  );
}
