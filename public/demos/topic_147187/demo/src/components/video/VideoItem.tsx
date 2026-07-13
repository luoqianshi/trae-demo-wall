import { Mic, MicOff, Video, VideoOff, Hand } from 'lucide-react';
import { Participant } from '../../utils/mockData';

interface VideoItemProps {
  participant: Participant;
  isHost?: boolean;
}

export const VideoItem = ({ participant, isHost }: VideoItemProps) => {
  const colors = [
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-green-400 to-green-600',
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-orange-400 to-orange-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
    'bg-gradient-to-br from-cyan-400 to-cyan-600',
  ];

  const colorIndex = (participant.id.charCodeAt(1) || 0) % colors.length;

  return (
    <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-lg h-full w-full">
      {participant.isCameraOn ? (
        <div className={`${colors[colorIndex]} h-full w-full flex items-center justify-center`}>
          <div className="text-center">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1 lg:mb-2">
              <span className="text-2xl lg:text-3xl font-bold text-white">
                {participant.name.charAt(0)}
              </span>
            </div>
            <p className="text-white font-medium text-sm lg:text-base">{participant.name}</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 h-full w-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1 lg:mb-2">
              <VideoOff className="w-6 h-6 lg:w-8 lg:h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 font-medium text-sm lg:text-base">{participant.name}</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 lg:p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 lg:gap-2 min-w-0">
            <span
              className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full flex-shrink-0 ${participant.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}
            ></span>
            <span className="text-white text-xs lg:text-sm font-medium truncate">{participant.name}</span>
            {isHost && (
              <span className="text-[10px] lg:text-xs px-1.5 py-0.5 bg-indigo-500 text-white rounded-full flex-shrink-0">
                主持人
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {participant.isHandRaised && (
              <div className="p-1 bg-yellow-500 rounded-full animate-bounce">
                <Hand className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={`p-1 rounded-full ${participant.isMuted ? 'bg-red-500' : 'bg-black/50'}`}
            >
              {participant.isMuted ? (
                <MicOff className="w-3 h-3 text-white" />
              ) : (
                <Mic className="w-3 h-3 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};