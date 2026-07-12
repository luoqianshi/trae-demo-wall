import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockUsers } from '../data/users';
import { interestTags, interestTagMap } from '../data/tags';
import TagSelector from '../components/TagSelector';
import UserCard from '../components/UserCard';

export default function Home() {
  const navigate = useNavigate();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const filteredUsers = selectedTags.length === 0
    ? mockUsers
    : mockUsers.filter((user) =>
        selectedTags.some((tag) => user.interests.includes(tag))
      );

  const calcMatchScore = (user: typeof mockUsers[0]): number => {
    if (selectedTags.length === 0) return 0;
    const common = user.interests.filter((t) => selectedTags.includes(t)).length;
    return Math.round((common / selectedTags.length) * 100);
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (selectedTags.length === 0) return b.matchCount - a.matchCount;
    return calcMatchScore(b) - calcMatchScore(a);
  });

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--bg)',
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              💫 趣遇
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 2 }}>
              兴趣相投，遇见对的人
            </p>
          </div>
          <button
            onClick={() => navigate('/me')}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: '#fff',
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.35)',
            }}
          >
            👤
          </button>
        </div>

        {/* Search Bar */}
        <div
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 20 }}>🔍</span>
          <span style={{ flex: 1, color: 'var(--text-muted)', fontSize: 14 }}>
            {selectedTags.length === 0
              ? '选择你的兴趣，找到志同道合的伙伴...'
              : `已选 ${selectedTags.length} 个兴趣标签`}
          </span>
          <span
            style={{
              color: 'var(--text-muted)',
              transform: showFilters ? 'rotate(180deg)' : '',
              transition: 'var(--transition)',
            }}
          >
            ▼
          </span>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div
            className="fade-in"
            style={{
              marginTop: 12,
              padding: 16,
              borderRadius: 'var(--radius)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow)',
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
                选择你感兴趣的活动（可多选）
              </div>
              <TagSelector
                tags={interestTags}
                selected={selectedTags}
                onToggle={toggleTag}
              />
            </div>

            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                style={{
                  marginTop: 8,
                  padding: '8px 20px',
                  borderRadius: 20,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-light)',
                  fontSize: 13,
                }}
              >
                清除全部筛选
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{ marginTop: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 14, color: 'var(--text-light)' }}>
            找到 {sortedUsers.length} 位用户
          </span>
          {selectedTags.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--primary)' }}>
              按匹配度排序 ↓
            </span>
          )}
        </div>

        {sortedUsers.map((user, i) => (
          <div key={user.id} className="fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <UserCard
              user={user}
              matchScore={selectedTags.length > 0 ? calcMatchScore(user) : undefined}
              onClick={() => navigate(`/profile/${user.id}`)}
            />
          </div>
        ))}

        {sortedUsers.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 60,
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>暂无匹配用户</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>试试选择更多兴趣标签吧</div>
          </div>
        )}
      </div>
    </div>
  );
}
