import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, ArrowLeft, User, Lock, Mail, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { validateEmail, validatePassword, hashPassword } from '@/utils/auth';
import Button from '@/components/common/Button';

type AuthMode = 'login' | 'register';

const DEFAULT_ACCOUNT = {
  email: 'admin@caomuzhi.com',
  password: '123456'
};

const Login = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const { login, register, showToast } = useStore();

  const fillDefaultAccount = () => {
    setEmail(DEFAULT_ACCOUNT.email);
    setPassword(DEFAULT_ACCOUNT.password);
    setMode('login');
    setErrors({});
    showToast('已填充默认账号', 'info');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = '请输入邮箱';
    } else if (!validateEmail(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!password) {
      newErrors.password = '请输入密码';
    } else if (!validatePassword(password)) {
      newErrors.password = '密码长度至少6位';
    }

    if (mode === 'register') {
      if (!username) {
        newErrors.username = '请输入用户名';
      } else if (username.length < 2) {
        newErrors.username = '用户名长度至少2位';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const hashedPassword = hashPassword(password);

    if (mode === 'login') {
      const success = login(email, hashedPassword);
      if (success) {
        showToast('登录成功', 'success');
        navigate('/');
      } else {
        showToast('邮箱或密码错误', 'error');
      }
    } else {
      const success = register({
        email,
        password: hashedPassword,
        username,
        createdAt: new Date().toISOString(),
        bio: '',
        location: ''
      });

      if (success) {
        showToast('注册成功，请登录', 'success');
        setMode('login');
        setPassword('');
      } else {
        showToast('该邮箱已被注册', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plant-dark via-plant-green to-plant-medium">
      <div className="absolute inset-0">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 text-accent-amber/20 animate-leafFall"
            style={{
              left: `${(i + 1) * 12}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + i}s`
            }}
          >
            <Leaf className="w-8 h-8" />
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回首页</span>
        </button>

        <div className="glass rounded-card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-plant-green/20 rounded-full flex items-center justify-center">
              <Leaf className="w-8 h-8 text-plant-green" />
            </div>
            <h1 className="text-3xl font-bold text-text-dark">
              {mode === 'login' ? '欢迎回来' : '创建账号'}
            </h1>
            <p className="text-text-medium mt-2">
              {mode === 'login'
                ? '登录您的账号，继续探索草木世界'
                : '注册账号，开启您的草木之旅'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  用户名
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 bg-bg-beige rounded-card outline-none focus:ring-2 transition-all ${
                      errors.username
                        ? 'ring-emphasis-coral'
                        : 'ring-plant-green/30'
                    }`}
                    placeholder="请输入用户名"
                  />
                </div>
                {errors.username && (
                  <p className="text-emphasis-coral text-sm mt-1">{errors.username}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 bg-bg-beige rounded-card outline-none focus:ring-2 transition-all ${
                    errors.email ? 'ring-emphasis-coral' : 'ring-plant-green/30'
                  }`}
                  placeholder="请输入邮箱"
                />
              </div>
              {errors.email && (
                <p className="text-emphasis-coral text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-3 bg-bg-beige rounded-card outline-none focus:ring-2 transition-all ${
                    errors.password ? 'ring-emphasis-coral' : 'ring-plant-green/30'
                  }`}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-emphasis-coral text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-6">
              {mode === 'login' ? '登录' : '注册'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-text-medium">
              {mode === 'login' ? '还没有账号？' : '已有账号？'}
            </span>
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrors({});
              }}
              className="ml-2 text-plant-green font-medium hover:text-plant-medium transition-colors"
            >
              {mode === 'login' ? '立即注册' : '立即登录'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-plant-green/10">
            {mode === 'login' && (
              <div className="mb-4 p-3 bg-plant-green/5 border border-plant-green/20 rounded-card">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-plant-green flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-text-medium mb-2">
                      默认体验账号（点击下方按钮快速填充）
                    </p>
                    <div className="text-xs text-text-dark space-y-1 mb-2">
                      <p>邮箱：<span className="font-mono text-plant-green">{DEFAULT_ACCOUNT.email}</span></p>
                      <p>密码：<span className="font-mono text-plant-green">{DEFAULT_ACCOUNT.password}</span></p>
                    </div>
                    <button
                      type="button"
                      onClick={fillDefaultAccount}
                      className="text-xs px-3 py-1 bg-plant-green text-white rounded-tag hover:bg-plant-medium transition-colors"
                    >
                      一键填充
                    </button>
                  </div>
                </div>
              </div>
            )}
            <p className="text-center text-text-light text-sm">
              登录即表示您同意我们的服务条款和隐私政策
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
