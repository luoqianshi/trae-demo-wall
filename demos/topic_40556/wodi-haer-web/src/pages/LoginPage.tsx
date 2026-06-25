import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// 手机号格式验证
function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; code?: string }>({});
  const { login, sendCode, isLoading, countdown, isSendingCode } = useAuth();
  const navigate = useNavigate();

  // 实时校验手机号
  const handlePhoneChange = (value: string) => {
    // 只允许数字，最多11位
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setPhone(digits);
    // 清除之前的错误
    if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
  };

  // 实时校验验证码
  const handleCodeChange = (value: string) => {
    // 只允许数字，最多6位
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (errors.code) setErrors(prev => ({ ...prev, code: undefined }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 前端校验
    const newErrors: { phone?: string; code?: string } = {};
    if (!phone) {
      newErrors.phone = '请输入手机号';
    } else if (!isValidPhone(phone)) {
      newErrors.phone = '手机号格式不正确（1开头11位数字）';
    }
    if (!code) {
      newErrors.code = '请输入验证码';
    } else if (code.length < 6) {
      newErrors.code = '验证码为6位数字';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await login(phone, code);
      navigate('/');
    } catch {
      // error handled in hook
    }
  };

  const handleSendCode = () => {
    // 发送前也做一次校验
    if (!phone) {
      setErrors({ phone: '请先输入手机号' });
      return;
    }
    if (!isValidPhone(phone)) {
      setErrors({ phone: '手机号格式不正确' });
      return;
    }
    sendCode(phone);
  };

  // 表单是否可提交
  const isFormValid = phone.length === 11 && code.length === 6 && !isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-soft-blue to-soft-pink shadow-lg mb-4">
            <span className="text-5xl">👶</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">吾滴孩儿</h1>
          <p className="text-text-secondary mt-2">从备孕到养育，陪伴每一个成长瞬间</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5" noValidate>
          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              手机号
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light">+86</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="请输入手机号"
                maxLength={11}
                autoComplete="tel"
                className={`w-full pl-14 pr-4 py-4 bg-white rounded-2xl border outline-none transition-all text-base ${
                  errors.phone
                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.phone}</p>
            )}
          </div>

          {/* Code Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              验证码
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="请输入验证码（模拟：123456）"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className={`w-full px-4 py-4 bg-white rounded-2xl border outline-none transition-all text-base ${
                    errors.code
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0 || isSendingCode}
                className={`px-5 py-4 rounded-2xl text-sm font-medium whitespace-nowrap transition-all ${
                  countdown > 0 || isSendingCode
                    ? 'bg-cream text-text-light cursor-not-allowed'
                    : 'bg-gradient-to-r from-soft-blue to-light-blue text-text-primary hover:shadow-lg'
                }`}
              >
                {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
            {errors.code && (
              <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.code}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] ${
              isFormValid
                ? 'bg-gradient-to-r from-soft-blue via-light-blue to-soft-pink text-text-primary cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                登录中...
              </span>
            ) : (
              '登 录'
            )}
          </button>

          {/* Tips */}
          <p className="text-xs text-center text-text-light">
            未注册手机号验证后自动创建账号 · 模拟验证码：123456
          </p>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-3">
          <Link
            to="/register"
            className="block text-sm text-ice-blue hover:text-soft-blue transition-colors"
          >
            还没有账号？立即注册 →
          </Link>
          <p className="text-xs text-text-light">
            登录即表示同意《用户协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
