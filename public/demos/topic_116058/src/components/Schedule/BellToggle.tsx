import { Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BellToggleProps {
  isOn: boolean;
  onToggle: () => void;
}

export default function BellToggle({ isOn, onToggle }: BellToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'btn-press w-9 h-9 rounded-full flex items-center justify-center transition-all',
        isOn
          ? 'bg-corgi-orange/20 text-corgi-orange hover:bg-corgi-orange/30'
          : 'bg-gray-200/50 text-gray-400 hover:bg-gray-300/50'
      )}
      title={isOn ? '提醒已开启' : '提醒已关闭'}
    >
      {isOn ? (
        <Bell size={18} className="animate-wiggle" fill="currentColor" />
      ) : (
        <BellOff size={18} />
      )}
    </button>
  );
}
