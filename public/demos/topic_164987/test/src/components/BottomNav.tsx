import { useNavigate, useLocation } from 'react-router-dom';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const tabs = [
    { path: '/pomodoro', icon: '⏱️', label: '专注' },
    { path: '/cards', icon: '📚', label: '背诵' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-light-gray px-6 py-3 z-40">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-10 py-2 rounded-xl transition-all ${
                isActive
                  ? 'text-charcoal'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
