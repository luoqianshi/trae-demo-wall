import { NavLink } from 'react-router-dom';
import { Home, Heart, MapPin, Siren, User } from 'lucide-react';
import { cn } from '../utils/cn';

const tabs = [
  { path: '/', label: '今日', icon: Home },
  { path: '/cared', label: '关心', icon: Heart },
  { path: '/nearby', label: '附近', icon: MapPin },
  { path: '/emergency', label: '应急', icon: Siren },
  { path: '/profile', label: '我的', icon: User },
];

export default function BottomNav() {
  return (
    <nav className="absolute bottom-0 left-0 right-0 glass border-t border-rule/50 safe-bottom z-50">
      <div className="flex items-center justify-around h-[68px] px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-2xl transition-all',
                isActive ? 'text-warm' : 'text-gray-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-xl transition-all',
                  isActive && 'bg-warm/15'
                )}>
                  <tab.icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  'text-[10px] transition-all',
                  isActive ? 'font-semibold' : 'font-normal'
                )}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
