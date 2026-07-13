import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Hand, PhoneOff, Maximize2 } from 'lucide-react';
import { useVideoStore } from '../../stores/videoStore';

interface VideoControlsProps {
  onLeave?: () => void;
}

export const VideoControls = ({ onLeave }: VideoControlsProps) => {
  const { isMuted, isCameraOn, isScreenSharing, toggleMute, toggleCamera, toggleScreenSharing } = useVideoStore();

  const controls = [
    {
      icon: isMuted ? MicOff : Mic,
      label: isMuted ? '取消静音' : '静音',
      onClick: toggleMute,
      active: !isMuted,
      danger: false,
    },
    {
      icon: isCameraOn ? Video : VideoOff,
      label: isCameraOn ? '关闭' : '开启',
      onClick: toggleCamera,
      active: isCameraOn,
      danger: false,
    },
    {
      icon: isScreenSharing ? MonitorOff : Monitor,
      label: isScreenSharing ? '停止' : '共享',
      onClick: toggleScreenSharing,
      active: isScreenSharing,
      danger: false,
    },
    {
      icon: Hand,
      label: '举手',
      onClick: () => {},
      active: false,
      danger: false,
    },
    {
      icon: Maximize2,
      label: '全屏',
      onClick: () => {},
      active: false,
      danger: false,
    },
  ];

  return (
    <>
      <div className="hidden lg:block bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {controls.map((control) => {
            const Icon = control.icon;
            return (
              <button
                key={control.label}
                onClick={control.onClick}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  control.active
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{control.label}</span>
              </button>
            );
          })}
          <button
            onClick={onLeave}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-sm">离开</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-16 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-2 z-30">
        <div className="flex items-center justify-around">
          {controls.map((control) => {
            const Icon = control.icon;
            return (
              <button
                key={control.label}
                onClick={control.onClick}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  control.active
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <div className={`p-1.5 rounded-full ${
                  control.active ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5">{control.label}</span>
              </button>
            );
          })}
          <button
            onClick={onLeave}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-red-500"
          >
            <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/50">
              <PhoneOff className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5">挂断</span>
          </button>
        </div>
      </div>
    </>
  );
};