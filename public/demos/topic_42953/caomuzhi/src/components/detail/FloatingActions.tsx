import { Heart, Share2, Bookmark, MessageCircle } from 'lucide-react';
import { Plant } from '@/types';
import { useStore } from '@/store/useStore';
import Button from '@/components/common/Button';

interface FloatingActionsProps {
  plant: Plant;
}

const FloatingActions = ({ plant }: FloatingActionsProps) => {
  const { collections, addCollection, removeCollection, isLoggedIn, showToast } = useStore();
  
  const isCollected = collections.some((c) => c.plantId === plant.id);

  const handleToggleCollection = () => {
    if (!isLoggedIn) {
      showToast('请先登录', 'error');
      return;
    }

    if (isCollected) {
      removeCollection(plant.id);
      showToast('已取消收藏', 'info');
    } else {
      addCollection({
        plantId: plant.id,
        name: plant.name,
        image: plant.image,
        category: plant.category,
        collectedAt: new Date().toISOString()
      });
      showToast('收藏成功', 'success');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: plant.name,
        text: plant.overview.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('链接已复制到剪贴板', 'success');
    }
  };

  const handleBookmark = () => {
    if (!isLoggedIn) {
      showToast('请先登录', 'error');
      return;
    }
    showToast('已添加到书签', 'success');
  };

  return (
    <div className="sticky top-20 space-y-3">
      <Button
        onClick={handleToggleCollection}
        className={`w-full flex items-center justify-center gap-2 ${
          isCollected ? 'bg-emphasis-coral' : ''
        }`}
        variant={isCollected ? 'primary' : 'secondary'}
      >
        <Heart className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} />
        {isCollected ? '取消收藏' : '收藏'}
      </Button>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 p-3 bg-bg-beige hover:bg-plant-green/10 rounded-button transition-colors"
          title="分享"
        >
          <Share2 className="w-5 h-5 text-text-dark" />
          <span className="text-xs text-text-medium">分享</span>
        </button>
        <button
          onClick={handleBookmark}
          className="flex flex-col items-center gap-1 p-3 bg-bg-beige hover:bg-plant-green/10 rounded-button transition-colors"
          title="书签"
        >
          <Bookmark className="w-5 h-5 text-text-dark" />
          <span className="text-xs text-text-medium">书签</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-3 bg-bg-beige hover:bg-plant-green/10 rounded-button transition-colors" title="评论">
          <MessageCircle className="w-5 h-5 text-text-dark" />
          <span className="text-xs text-text-medium">评论</span>
        </button>
      </div>

      <div className="p-4 bg-bg-beige rounded-card">
        <p className="text-text-medium text-sm">标签</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {plant.tags.map((tag) => (
            <span key={tag} className="tag tag-amber">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloatingActions;
