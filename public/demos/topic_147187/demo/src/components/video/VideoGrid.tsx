import { useVideoStore } from '../../stores/videoStore';
import { VideoItem } from './VideoItem';

interface VideoGridProps {
  classroomId: string;
}

export const VideoGrid = ({ classroomId }: VideoGridProps) => {
  const { participants } = useVideoStore();

  const filteredParticipants = participants.filter(
    (p) => p.classroomId === classroomId && p.isOnline
  );

  const host = filteredParticipants.find((p) => p.role === 'host');
  const students = filteredParticipants.filter((p) => p.role === 'student');

  return (
    <div className="space-y-3 lg:space-y-4 h-full">
      {host && (
        <div className="h-48 lg:h-64">
          <VideoItem participant={host} isHost />
        </div>
      )}

      {students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-4">
          {students.map((participant) => (
            <div key={participant.id} className="aspect-video">
              <VideoItem participant={participant} />
            </div>
          ))}
        </div>
      )}

      {filteredParticipants.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-4xl">📹</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">暂无在线参与者</p>
        </div>
      )}
    </div>
  );
};