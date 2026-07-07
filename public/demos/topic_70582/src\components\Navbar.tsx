import { Link, useLocation } from 'react-router-dom';
import { Search, MapPin, User, Compass, Heart, Sparkles, Laptop } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function Navbar() {
  const location = useLocation();
  const { isLoggedIn, user } = useAuthStore();

  const navLinks = [
    { path: '/', label: '首页', icon: Search },
    { path: '/boomerang', label: '特色玩法', icon: Sparkles },
    { path: '/nomad', label: '数字游民', icon: Laptop },
    { path: '/community', label: '社区', icon: Compass },
    { path: '/favorites', label: '收藏', icon: Heart },
    { path: '/profile', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🧭</span>
            <span className="font-display text-xl font-bold text-primary-700">路游者</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-700 text-white shadow-md'
                      : 'text-primary-700/70 hover:text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn && user ? (
              <Link to="/profile" className="flex items-center gap-2">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-9 h-9 rounded-full border-2 border-accent-400/50"
                />
                <span className="hidden sm:block text-sm font-medium text-primary-700">
                  {user.username}
                </span>
                <span className="hidden sm:block text-xs text-accent-500 font-medium">
                  {user.points}里程
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-400 text-white text-sm font-medium rounded-full hover:shadow-glow transition-all duration-300"
              >
                <User size={16} />
                登录
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/20">
        <div className="flex justify-around py-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg ${
                  isActive ? 'text-accent-500' : 'text-primary-700/50'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
