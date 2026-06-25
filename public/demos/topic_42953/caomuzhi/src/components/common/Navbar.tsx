import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Search, User, ChevronDown, Home, Camera, Book, Scroll, LogOut, Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';
import SafeImage from '@/components/common/SafeImage';
import { getAvatarUrl } from '@/utils/imageUtils';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isLoggedIn, user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowMenu(false);
  };

  const navLinks = [
    { name: '首页', icon: Home, path: '/' },
    { name: '识别', icon: Camera, path: '/', hash: '#identify' },
    { name: '图鉴', icon: Book, path: '/collection', requireLogin: true },
    { name: '古籍', icon: Scroll, path: '/', hash: '#ancient' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass py-2 shadow-md'
            : 'bg-plant-green/95 py-4 shadow-sm'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="relative">
                <Leaf className="w-8 h-8 text-plant-green transition-transform duration-300 group-hover:rotate-12" />
              </div>
              <span className={`text-xl font-bold ${scrolled ? 'text-plant-green' : 'text-white'}`}>
                草木志
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                if (link.requireLogin && !isLoggedIn) return null;
                return (
                  <button
                    key={link.name}
                    onClick={() => {
                      if (link.hash) {
                        if (location.pathname === '/') {
                          setTimeout(() => {
                            const element = document.querySelector(link.hash!);
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }, 50);
                        } else {
                          navigate(link.path);
                          setTimeout(() => {
                            const element = document.querySelector(link.hash!);
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }, 300);
                        }
                      } else {
                        if (location.pathname === '/' && link.path === '/') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          navigate(link.path);
                        }
                      }
                    }}
                    className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-plant-medium ${
                      scrolled ? 'text-text-dark' : 'text-white/90'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <SafeImage
                      src={user?.avatar || getAvatarUrl(user?.id || 'default')}
                      alt={user?.nickname || user?.username || ''}
                      containerClassName="w-8 h-8 rounded-full border-2 border-white overflow-hidden"
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      showLoading={false}
                    />
                    <span className={`${scrolled ? 'text-text-dark' : 'text-white'} text-sm font-medium`}>
                      {user?.nickname || user?.username}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''} ${scrolled ? 'text-text-dark' : 'text-white'}`} />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 glass rounded-card shadow-lg py-2 z-50">
                      <button
                        onClick={() => { navigate('/profile'); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-plant-green/5 transition-colors"
                      >
                        <User className="w-4 h-4 text-plant-green" />
                        <span className="text-sm">个人中心</span>
                      </button>
                      <button
                        onClick={() => { navigate('/collection'); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-plant-green/5 transition-colors"
                      >
                        <Book className="w-4 h-4 text-plant-green" />
                        <span className="text-sm">我的图鉴</span>
                      </button>
                      <button
                        onClick={() => { navigate('/collection#history'); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-plant-green/5 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-plant-green" />
                        <span className="text-sm">识别历史</span>
                      </button>
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-plant-green/5 transition-colors text-emphasis-coral"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">退出登录</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary text-sm"
                >
                  登录/注册
                </button>
              )}
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <div className={`w-6 h-5 flex flex-col justify-between ${scrolled ? 'text-text-dark' : 'text-white'}`}>
                <span className={`h-0.5 rounded-full transition-all ${showMobileMenu ? 'rotate-45 translate-y-2' : ''}`} style={{ backgroundColor: scrolled ? '#1C1C1E' : '#FFFFFF' }} />
                <span className={`h-0.5 rounded-full transition-all ${showMobileMenu ? 'opacity-0' : ''}`} style={{ backgroundColor: scrolled ? '#1C1C1E' : '#FFFFFF' }} />
                <span className={`h-0.5 rounded-full transition-all ${showMobileMenu ? '-rotate-45 -translate-y-2' : ''}`} style={{ backgroundColor: scrolled ? '#1C1C1E' : '#FFFFFF' }} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {showMobileMenu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute top-16 left-0 right-0 glass p-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                if (link.requireLogin && !isLoggedIn) return null;
                return (
                  <button
                    key={link.name}
                    onClick={() => {
                      if (link.hash) {
                        if (location.pathname === '/') {
                          setTimeout(() => {
                            const element = document.querySelector(link.hash!);
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }, 50);
                        } else {
                          navigate(link.path);
                          setTimeout(() => {
                            const element = document.querySelector(link.hash!);
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }, 300);
                        }
                      } else {
                        if (location.pathname === '/' && link.path === '/') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          navigate(link.path);
                        }
                      }
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-button hover:bg-plant-green/5 transition-colors text-text-dark"
                  >
                    <link.icon className="w-5 h-5 text-plant-green" />
                    {link.name}
                  </button>
                );
              })}
              {!isLoggedIn && (
                <button
                  onClick={() => { navigate('/login'); setShowMobileMenu(false); }}
                  className="btn-primary mt-4"
                >
                  登录/注册
                </button>
              )}
              {isLoggedIn && (
                <>
                  <hr className="my-2" />
                  <button
                    onClick={() => { navigate('/profile'); setShowMobileMenu(false); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-button hover:bg-plant-green/5 transition-colors text-text-dark"
                  >
                    <Settings className="w-5 h-5 text-plant-green" />
                    个人中心
                  </button>
                  <button
                    onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-button hover:bg-plant-green/5 transition-colors text-emphasis-coral"
                  >
                    <LogOut className="w-5 h-5" />
                    退出登录
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
