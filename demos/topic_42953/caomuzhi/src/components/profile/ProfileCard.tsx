import { User, Calendar, MapPin, Edit3, Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';
import SafeImage from '@/components/common/SafeImage';
import { getAvatarUrl } from '@/utils/imageUtils';

const ProfileCard = () => {
  const { user, collections, history } = useStore();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (!user) return null;

  return (
    <div className="glass rounded-card p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative">
          <SafeImage
            src={user.avatar || getAvatarUrl(user.id)}
            alt={user.username}
            containerClassName="w-24 h-24 rounded-full overflow-hidden bg-plant-green/20"
            className="w-24 h-24 rounded-full object-cover"
            showLoading={false}
          />
          <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
            <Edit3 className="w-4 h-4 text-text-dark" />
          </button>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-text-dark">{user.username}</h2>
            <button className="p-2 hover:bg-plant-green/10 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-text-dark" />
            </button>
          </div>
          
          <p className="text-text-medium mb-4">{user.bio || '热爱自然，探索草木之美'}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1 text-text-medium">
              <Calendar className="w-4 h-4" />
              <span>注册于 {formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1 text-text-medium">
              <MapPin className="w-4 h-4" />
              <span>{user.location || '未知地点'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-plant-green/10">
        <div className="text-center">
          <div className="text-2xl font-bold text-plant-green">{collections.length}</div>
          <div className="text-text-medium text-sm">收藏草木</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-plant-medium">{history.length}</div>
          <div className="text-text-medium text-sm">识别记录</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-amber">
            {Math.floor(collections.length / 10) + 1}
          </div>
          <div className="text-text-medium text-sm">获得徽章</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
