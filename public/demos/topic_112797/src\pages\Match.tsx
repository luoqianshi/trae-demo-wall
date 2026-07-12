import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockUsers, mockCurrentUser } from '../data/users';
import { interestTags, interestTagMap } from '../data/tags';
import TagSelector from '../components/TagSelector';
import UserCard from '../components/UserCard';
import { getAvatarColor, getInitials } from '../data/users';

export default function Match() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'result'>('select');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [results, setResults] = useState<typeof mockUsers>([]);

  // 模拟AI匹配动画
  const [matching, setMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleMatch = () => {
    if (selectedTags.length === 0) return;
    setStep('result');
    setMatching(true);
    setMatchProgress(0);
  };

  useEffect(() => {
    if (matching) {
      const timer = setInterval(() => {
        setMatchProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setMatching(false);
            // 计算匹配结果
            const matched = mockUsers
              .filter((u) => u.id !== 'me')
              .map((u) => {
                const common = u.interests.filter((t) => selectedTags.includes(t)).length;
                return { ...u, _score: Math.round((common / selectedTags.length) * 100) };
              })
              .filter((u) => u._score > 0)
              .sort((a, b) => b._score - a._score);
            setResults(matched);
            return 100;
          }
          return prev + 2;
        });
      }, 40);
      return () => clearInterval(timer);
    }
  }, [matching, selectedTags]);

  const calcMatchScore = (user: typeof mockUsers[0]): number => {
    const common = user.interests.filter((t) => selectedTags.includes(t)).length;
    return Math.round((common / selectedTags.length) * 100);
  };

  const selectedTagObjs = selectedTags.map((id) => interestTagMap.get(id)).filter(Boolean);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Back */}
      <button
        onClick={() => {
          if (step === 'result') {
            setStep('select');
            setResults([]);
            setMatching(false);
          } else {
            navigate('/');
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          color: 'var(--text-light)',
          fontSize: 14,
          padding: '16px 0 8px',
          fontWeight: 500,
        }}
      >
        <span>←</span> {step === 'result' ? '重新选择' : '返回'}
      </button>

      {step === 'select' && (
        <>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 6,
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🎯 精准匹配
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20 }}>
            选择你喜欢的兴趣标签，AI将为你找到最契合的伙伴
          </p>

          {/* Current User interests hint */}
          <div
            style={{
              padding: 14,
              borderRadius: 'var(--radius-sm)',
              background: '#FFF0F0',
              marginBottom: 18,
              fontSize: 13,
              color: 'var(--text-light)',
            }}
          >
            💡 你的当前兴趣：
            {mockCurrentUser.interests.map((id) => interestTagMap.get(id)).filter(Boolean).map((t) => (
              <span key={t!.id} style={{ marginLeft: 4 }}>
                {t!.icon}{t!.name}
              </span>
            ))}
          </div>

          {/* Tag Selection */}
          <div
            style={{
              padding: 18,
              borderRadius: 'var(--radius)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow)',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              选择你想匹配的兴趣（可多选）
            </div>
            <TagSelector
              tags={interestTags}
              selected={selectedTags}
              onToggle={toggleTag}
            />
          </div>

          {/* Selected Tags Summary */}
          {selectedTags.length > 0 && (
            <div
              className="fade-in"
              style={{
                padding: 16,
                borderRadius: 'var(--radius)',
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow)',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-light)' }}>
                已选择 {selectedTags.length} 个标签：
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedTagObjs.map((tag) => (
                  <span
                    key={tag!.id}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 16,
                      background: 'var(--primary)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {tag!.icon} {tag!.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Match Button */}
          <button
            onClick={handleMatch}
            disabled={selectedTags.length === 0}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 'var(--radius)',
              background: selectedTags.length > 0
                ? 'linear-gradient(135deg, var(--primary), var(--primary-light))'
                : '#E0E0E0',
              color: '#fff',
              fontSize: 17,
              fontWeight: 700,
              boxShadow: selectedTags.length > 0
                ? '0 4px 16px rgba(255, 107, 107, 0.35)'
                : 'none',
              transition: 'var(--transition)',
              cursor: selectedTags.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            🚀 开始匹配
          </button>
        </>
      )}

      {step === 'result' && (
        <>
          {/* Matching Animation */}
          {matching && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1s infinite' }}>
                🔮
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                AI正在为你智能匹配...
              </h3>
              <div
                style={{
                  width: '100%',
                  height: 8,
                  borderRadius: 4,
                  background: '#F0E0E0',
                  marginTop: 20,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                    width: `${matchProgress}%`,
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 14, color: 'var(--primary)' }}>
                {matchProgress}%
              </div>
            </div>
          )}

          {/* Results */}
          {!matching && (
            <>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  marginBottom: 4,
                }}
              >
                🎉 匹配结果
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
                根据你的兴趣标签，找到 {results.length} 位契合的伙伴
              </p>

              {results.map((user, i) => (
                <div key={user.id} className="fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                  <UserCard
                    user={user}
                    matchScore={calcMatchScore(user)}
                    onClick={() => navigate(`/profile/${user.id}`)}
                  />
                </div>
              ))}

              {results.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🤔</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>没有完全匹配的用户</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>试试减少或调整标签选择</div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
