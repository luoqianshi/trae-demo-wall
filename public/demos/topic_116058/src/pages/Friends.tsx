import { useState } from 'react';
import { Search, UserPlus, Heart, Gift, Trash2, Users, X, Check, AlertCircle, CalendarDays, CalendarPlus } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import CorgiMascot, { PET_LABEL } from '@/components/Corgi/CorgiMascot';
import { useFriendStore, checkCorgiNameUnique } from '@/store/friendStore';
import { getAffinityLevel } from '@/store/corgiStore';
import { cn } from '@/lib/utils';
import type { Friend } from '@/types';

// 生成 mock 日程数据（单机应用，使用模拟数据）
// 根据 friendId 字符码和生成稳定偏移，让不同好友日程略有差异
function generateMockSchedule(friendId: string) {
  const seed = friendId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const baseSchedules = [
    { time: '07:00 - 07:30', activity: '起床洗漱' },
    { time: '07:30 - 08:00', activity: '早餐' },
    { time: '08:00 - 12:00', activity: '上课' },
    { time: '12:00 - 13:00', activity: '午餐' },
    { time: '13:00 - 14:00', activity: '午休' },
    { time: '14:00 - 17:00', activity: '上课' },
    { time: '17:00 - 18:00', activity: '自由活动' },
    { time: '18:00 - 19:00', activity: '晚餐' },
    { time: '19:00 - 21:00', activity: '学习时间' },
    { time: '21:00 - 22:00', activity: '准备睡觉' },
  ];
  // 部分好友（seed 能被 3 整除）有额外的晨跑安排
  if (seed % 3 === 0) {
    return [{ time: '06:30 - 07:00', activity: '晨跑' }, ...baseSchedules];
  }
  return baseSchedules;
}

export default function Friends() {
  const { friends, searchResults, search, addFriend, removeFriend, interactWithFriend } = useFriendStore();
  const [query, setQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [toast, setToast] = useState<string>('');
  // 查看日程与邀约出行相关状态
  const [showSchedule, setShowSchedule] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteDate, setInviteDate] = useState('');
  const [inviteTime, setInviteTime] = useState('');
  const [inviteActivity, setInviteActivity] = useState('');

  const handleSearch = (q: string) => {
    setQuery(q);
    search(q);
  };

  // 选中好友：同时重置日程/邀约子状态，避免上一位好友的展开态泄漏到下一位
  const openFriend = (friend: Friend) => {
    setShowSchedule(false);
    setShowInvite(false);
    setInviteDate('');
    setInviteTime('');
    setInviteActivity('');
    setSelectedFriend(friend);
  };

  // 关闭好友弹窗：一并收起日程/邀约面板与表单
  const closeFriend = () => {
    setSelectedFriend(null);
    setShowSchedule(false);
    setShowInvite(false);
    setInviteDate('');
    setInviteTime('');
    setInviteActivity('');
  };

  // 今日日期字符串（邀约日期不可早于今天）
  const todayDateStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const handleAdd = (friend: Friend) => {
    addFriend(friend.id);
    // 添加后清空搜索，避免下方仍显示"未找到用户"
    setQuery('');
    search('');
    setToast(`已添加 ${friend.name} 为好友！`);
    setTimeout(() => setToast(''), 2000);
  };

  const handleInteract = (friend: Friend, action: 'pet' | 'sendGift') => {
    interactWithFriend(friend.id, action);
    setToast(action === 'pet' ? `抚摸了 ${friend.corgiName}！好感+3` : `给 ${friend.corgiName} 送了礼物！好感+8`);
    setTimeout(() => setToast(''), 2000);
    // 更新选中好友
    const updated = useFriendStore.getState().friends.find((f) => f.id === friend.id);
    if (updated) setSelectedFriend(updated);
  };

  // 发送邀约出行
  const handleSendInvite = (friend: Friend) => {
    if (!inviteDate || !inviteTime || !inviteActivity.trim()) {
      setToast('请填写完整邀约信息');
      setTimeout(() => setToast(''), 2000);
      return;
    }
    setToast(`已向 ${friend.name} 发送邀约！`);
    setTimeout(() => setToast(''), 2000);
    // 重置表单并关闭
    setInviteDate('');
    setInviteTime('');
    setInviteActivity('');
    setShowInvite(false);
  };

  return (
    <div className="min-h-screen warm-bg pb-24">
      <PageHeader title="好友" subtitle="搜索宠物主人，互相互动" />

      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* 搜索框 */}
        <div className="bg-warm-light rounded-puffy p-4 shadow-soft border-2 border-corgi-yellow/20 mb-6">
          <div className="flex items-center gap-2 bg-warm-cream/60 rounded-2xl px-4 py-3 border-2 border-corgi-yellow/30 focus-within:border-corgi-orange transition-colors">
            <Search size={20} className="text-text-light" />
            <input
              type="text"
              placeholder="搜索用户名或宠物名字..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-text-primary text-sm"
            />
            {query && (
              <button onClick={() => { setQuery(''); search(''); }} className="text-text-light hover:text-text-primary">
                <X size={16} />
              </button>
            )}
          </div>

          {/* 搜索结果 */}
          {query && (
            <div className="mt-3">
              {searchResults.length === 0 ? (
                <p className="text-center text-sm text-text-light py-4">
                  没有找到匹配的用户，换个名字试试？
                </p>
              ) : (
                <>
                  <p className="text-xs font-bold text-text-secondary mb-2">🔍 搜索结果</p>
                  <div className="flex flex-col gap-2">
                    {searchResults.map((user) => {
                      const isFriend = friends.some((f) => f.id === user.id);
                      const affLevel = getAffinityLevel(user.affinity);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-warm-cream/60 border border-corgi-yellow/30"
                        >
                          <div className="text-2xl">{user.avatar}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-primary truncate">
                              {user.name} · {PET_LABEL[user.petType]}「{user.corgiName}」
                            </p>
                            <p className="text-xs text-text-secondary">
                              <span style={{ color: affLevel.color }}>Lv.{affLevel.level} {affLevel.label}</span>
                              · {user.lastActive}
                            </p>
                          </div>
                          {isFriend ? (
                            <span className="text-xs font-bold text-mint-deep bg-mint-fresh/15 px-2 py-1 rounded-full">
                              已是好友
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAdd(user)}
                              className="btn-press flex items-center gap-1 px-3 py-1.5 rounded-full bg-corgi-orange text-white text-xs font-bold hover:bg-corgi-dark transition-colors"
                            >
                              <UserPlus size={14} />
                              加好友
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 我的好友列表 */}
        <div className="bg-warm-light rounded-puffy p-5 shadow-soft border-2 border-corgi-yellow/20 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-corgi-orange" />
            <h3 className="font-display text-lg text-text-primary">我的好友</h3>
            <span className="ml-auto text-xs text-text-secondary bg-warm-cream px-3 py-1 rounded-full font-bold">
              {friends.length} 人
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-4xl mb-2">🐾</div>
              <p className="text-sm text-text-secondary">还没有好友，快去搜索添加吧～</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map((friend) => {
                const affLevel = getAffinityLevel(friend.affinity);
                return (
                  <div
                    key={friend.id}
                    className="bg-warm-cream/50 rounded-2xl p-4 border-2 border-corgi-yellow/30 hover:border-corgi-orange/50 transition-all cursor-pointer"
                    onClick={() => openFriend(friend)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{friend.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary truncate">{friend.name}</p>
                        <p className="text-xs text-text-secondary truncate">{PET_LABEL[friend.petType]}「{friend.corgiName}」</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: affLevel.color }}
                          >
                            Lv.{affLevel.level} {affLevel.label}
                          </span>
                          <span className="text-[10px] text-text-light">{friend.lastActive}</span>
                        </div>
                      </div>
                    </div>
                    {/* 好感度进度条 */}
                    <div className="mt-3">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] text-text-light">好感度</span>
                        <span className="text-[10px] font-bold text-text-secondary ml-auto">{friend.affinity}</span>
                      </div>
                      <div className="w-full h-1.5 bg-corgi-yellow/20 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(friend.affinity / 500) * 100}%`,
                            backgroundColor: affLevel.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 宠物名字全网唯一性提示 */}
        <div className="bg-corgi-yellow/10 rounded-2xl p-4 border-2 border-corgi-yellow/20 flex items-start gap-3">
          <AlertCircle size={20} className="text-corgi-orange shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-text-primary mb-1">💎 宠物名字全网唯一</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              每只宠物的名字在全球范围内唯一。在「养成」页面可以改名，
              系统会校验名字是否被占用，并推荐可用名字。
            </p>
          </div>
        </div>
      </div>

      {/* 好友详情弹窗 */}
      {selectedFriend && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={closeFriend}
        >
          <div
            className="bg-warm-light rounded-puffy p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-puffy animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button onClick={closeFriend} className="text-text-light hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center mb-4">
              <CorgiMascot
                furColor={selectedFriend.corgiColor}
                petType={selectedFriend.petType}
                mood="happy"
                size={140}
                floating={true}
              />
              <p className="font-display text-lg text-text-primary mt-2">
                {selectedFriend.name} & 「{selectedFriend.corgiName}」
              </p>
              <p className="text-xs text-text-secondary">
                好感度 {selectedFriend.affinity} · {selectedFriend.lastActive}
              </p>
            </div>

            {/* 互动按钮 */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => handleInteract(selectedFriend, 'pet')}
                className="btn-press flex flex-col items-center gap-1 py-3 rounded-2xl bg-berry-pink/15 text-berry-rose hover:bg-berry-pink/25 transition-colors"
              >
                <Heart size={22} />
                <span className="text-xs font-bold">抚摸</span>
                <span className="text-[10px] opacity-70">+3 好感</span>
              </button>
              <button
                onClick={() => handleInteract(selectedFriend, 'sendGift')}
                className="btn-press flex flex-col items-center gap-1 py-3 rounded-2xl bg-corgi-orange/15 text-corgi-dark hover:bg-corgi-orange/25 transition-colors"
              >
                <Gift size={22} />
                <span className="text-xs font-bold">送礼物</span>
                <span className="text-[10px] opacity-70">+8 好感</span>
              </button>
            </div>

            {/* 看日程 / 邀约出行 按钮 */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => {
                  setShowSchedule(!showSchedule);
                  setShowInvite(false);
                }}
                className={cn(
                  'btn-press flex flex-col items-center gap-1 py-3 rounded-2xl transition-colors',
                  showSchedule
                    ? 'bg-corgi-yellow/30 text-corgi-dark'
                    : 'bg-corgi-yellow/15 text-corgi-dark hover:bg-corgi-yellow/25'
                )}
              >
                <CalendarDays size={22} />
                <span className="text-xs font-bold">看日程</span>
                <span className="text-[10px] opacity-70">查看对方行程</span>
              </button>
              <button
                onClick={() => {
                  setShowInvite(!showInvite);
                  setShowSchedule(false);
                }}
                className={cn(
                  'btn-press flex flex-col items-center gap-1 py-3 rounded-2xl transition-colors',
                  showInvite
                    ? 'bg-mint-fresh/30 text-mint-deep'
                    : 'bg-mint-fresh/15 text-mint-deep hover:bg-mint-fresh/25'
                )}
              >
                <CalendarPlus size={22} />
                <span className="text-xs font-bold">邀约出行</span>
                <span className="text-[10px] opacity-70">约Ta出去玩</span>
              </button>
            </div>

            {/* 日程列表（mock 数据） */}
            {showSchedule && (() => {
              const mockSchedule = generateMockSchedule(selectedFriend.id);
              return (
                <div className="mb-3 bg-warm-cream/60 rounded-2xl p-4 border-2 border-corgi-yellow/30">
                  <p className="text-xs font-bold text-text-secondary mb-3 flex items-center gap-1">
                    <CalendarDays size={14} />
                    {selectedFriend.name} 的今日日程
                  </p>
                  <div className="flex flex-col gap-2">
                    {mockSchedule.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-corgi-orange" />
                          {idx < mockSchedule.length - 1 && (
                            <div className="w-0.5 h-6 bg-corgi-yellow/40" />
                          )}
                        </div>
                        <div className="flex-1 flex items-center justify-between pb-1">
                          <span className="text-xs font-bold text-text-primary">{item.activity}</span>
                          <span className="text-[10px] text-text-light">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 邀约出行表单 */}
            {showInvite && (
              <div className="mb-3 bg-warm-cream/60 rounded-2xl p-4 border-2 border-mint-fresh/30">
                <p className="text-xs font-bold text-text-secondary mb-3 flex items-center gap-1">
                  <CalendarPlus size={14} />
                  向 {selectedFriend.name} 发送邀约
                </p>
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-secondary">日期</span>
                    <input
                      type="date"
                      min={todayDateStr}
                      value={inviteDate}
                      onChange={(e) => setInviteDate(e.target.value)}
                      className="bg-warm-light border-2 border-corgi-yellow/30 rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-corgi-orange"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-secondary">时间</span>
                    <input
                      type="time"
                      value={inviteTime}
                      onChange={(e) => setInviteTime(e.target.value)}
                      className="bg-warm-light border-2 border-corgi-yellow/30 rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-corgi-orange"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-secondary">活动名称</span>
                    <input
                      type="text"
                      placeholder="如：一起去公园散步"
                      value={inviteActivity}
                      onChange={(e) => setInviteActivity(e.target.value)}
                      className="bg-warm-light border-2 border-corgi-yellow/30 rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-corgi-orange"
                    />
                  </label>
                  <button
                    onClick={() => handleSendInvite(selectedFriend)}
                    className="btn-press w-full flex items-center justify-center gap-1 py-2.5 rounded-xl bg-corgi-orange text-white text-xs font-bold hover:bg-corgi-dark transition-colors"
                  >
                    <CalendarPlus size={14} />
                    发送邀约
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                removeFriend(selectedFriend.id);
                closeFriend();
                setToast('已删除好友');
                setTimeout(() => setToast(''), 2000);
              }}
              className="w-full flex items-center justify-center gap-1 py-2 text-xs text-berry-rose hover:bg-berry-pink/10 rounded-xl transition-colors"
            >
              <Trash2 size={14} />
              删除好友
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-corgi-dark text-white px-4 py-2 rounded-full shadow-puffy text-sm font-bold animate-pop-in flex items-center gap-2">
          <Check size={14} />
          {toast}
        </div>
      )}
    </div>
  );
}
