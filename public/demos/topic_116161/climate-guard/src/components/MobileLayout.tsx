import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import { useLocation } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

export default function MobileLayout({ children }: Props) {
  const location = useLocation();
  const hideNavPaths = ['/station'];
  const showNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="h-full w-full flex flex-col bg-app-bg text-ink relative max-w-md mx-auto">
      <main 
        className="flex-1 overflow-y-auto scrollbar-hide pb-24"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
