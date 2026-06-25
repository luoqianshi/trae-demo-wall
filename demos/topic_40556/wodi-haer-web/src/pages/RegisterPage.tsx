import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// 手机号格式验证
function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

function RegisterPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; code?: string; nickname?: string }>({});
  const { register, sendCode, isLoading, countdown, isSendingCode } = useAuth();
  const navigate = useNavigate();

  // 实时校验手机号（只允许数字）
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setPhone(digits);
    if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
  };

  // 实时校验验证码（只允许数字）
  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (errors.code) setErrors(prev => ({ ...prev, code: undefined }));
  };

  // 昵称变更时清除错误
  const handleNicknameChange = (value: string) => {
    // 限制长度并去除首尾空格
    setNickname(value.slice(0, 20).trimStart());
    if (errors.nickname) setErrors(prev => ({ ...prev, nickname: undefined }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 前端完整校验
    const newErrors: { phone?: string; code?: string; nickname?: string } = {};

    if (!nickname.trim()) {
      newErrors.nickname = '请输入昵称';
    } else if (nickname.trim().length < 2) {
      newErrors.nickname = '昵称至少需要2个字符';
    }

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
      await register(phone, code, nickname.trim());
      navigate('/');
    } catch {
      // error handled in hook
    }
  };

  const handleSendCode = () => {
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
  const isFormValid = nickname.trim().length >= 2 && phone.length === 11 && code.length === 6 && !isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/login" className="inline-block text-sm text-text-light hover:text-ice-blue mb-6">
            ‹ 返回登录
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">创建账号</h1>
          <p className="text-text-secondary mt-2">加入吾滴孩儿，开启科学育儿之旅</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-5" noValidate>
          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              昵称 <span className="text-text-light">(2-20字符)</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder="给自己起个昵称"
              maxLength={20}
              autoComplete="nickname"
              className={`w-full px-4 py-4 bg-white rounded-2xl border outline-none transition-all text-base ${
                errors.nickname
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20'
              }`}
            />
            {errors.nickname && (
              <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.nickname}</p>
            )}
          </div>

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
                ? 'bg-gradient-to-r from-soft-pink via-light-blue to-mint text-text-primary cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                注册中...
              </span>
            ) : (
              '注 册'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-light">
            注册即表示同意《用户协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
