import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isLogin = mode === 'login';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('请填写完整信息');
      return;
    }

    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }

    let success = false;
    if (isLogin) {
      success = login(email, password);
    } else {
      if (!username) {
        setError('请填写用户名');
        return;
      }
      success = register(username, email, password);
    }

    if (success) {
      navigate('/');
    } else {
      setError('操作失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-accent-400 filter blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-tealish-400 filter blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          返回
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🧭</div>
            <h1 className="font-display text-2xl font-bold text-primary-800 mb-1">
              {isLogin ? '欢迎回来' : '加入路游者'}
            </h1>
            <p className="text-sm text-primary-700/50">
              {isLogin ? '登录发现更多省钱中转方案' : '注册账号，开启省钱之旅'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm text-primary-700/70 mb-1.5 block">用户名</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="w-full pl-10 pr-4 py-3 bg-primary-50/50 border border-transparent rounded-xl focus:border-accent-400 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-primary-700/70 mb-1.5 block">邮箱</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="w-full pl-10 pr-4 py-3 bg-primary-50/50 border border-transparent rounded-xl focus:border-accent-400 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-primary-700/70 mb-1.5 block">密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少6位）"
                  className="w-full pl-10 pr-10 py-3 bg-primary-50/50 border border-transparent rounded-xl focus:border-accent-400 focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-accent-500 to-accent-400 text-white font-semibold rounded-xl hover:shadow-glow transition-all duration-300 mt-2"
            >
              {isLogin ? '登录' : '注册'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-primary-700/30">或者</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['微信', '手机号', 'QQ'].map((item) => (
              <button
                key={item}
                className="py-2.5 bg-primary-50/50 hover:bg-primary-50 rounded-xl text-sm text-primary-600 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-primary-700/50 mt-6">
            {isLogin ? '还没有账号？' : '已有账号？'}
            <Link
              to={isLogin ? '/register' : '/login'}
              className="text-accent-500 font-medium hover:underline ml-1"
            >
              {isLogin ? '立即注册' : '去登录'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
