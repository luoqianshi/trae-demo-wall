import { useParams, useNavigate } from 'react-router-dom';
import { mockUsers } from '../data/users';
import { interestTagMap } from '../data/tags';
import { getAvatarColor, getInitials } from '../data/users';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const user = mockUsers.find((u) => u.id === userId);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>用户不存在</div>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 16,
            padding: '10px 24px',
            borderRadius: 20,
            background: 'var(--primary)',
            color: '#fff',
            fontSize: 14,
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  const color = getAvatarColor(parseInt(user.id.slice(1)) || 0);
  const userTags = user.interests.map((id) => interestTagMap.get(id)).filter(Boolean);

  return (
    <div style={{ paddingBottom: 40, animation: 'fadeIn 0.4s ease both' }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
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
        <span>←</span> 返回
      </button>

      {/* Profile Header */}
      <div
        style={{
          textAlign: 'center',
          padding: '24px 0 20px',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 34,
            fontWeight: 700,
            margin: '0 auto 14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          {getInitials(user.name)}
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700 }}>{user.name}</h2>
        <div style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 4 }}>
          {user.gender === 'male' ? '♂' : '♀'} · {user.age}岁 · {user.occupation}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          📍 {user.location}
        </div>
        <div
          style={{
            marginTop: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 16px',
            borderRadius: 20,
            background: '#FFF0F0',
            color: 'var(--primary)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          💬 {user.matchCount} 人想认识TA
        </div>
      </div>

      {/* Bio */}
      <div
        style={{
          padding: 20,
          borderRadius: 'var(--radius)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow)',
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>📝 个人简介</h3>
        <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.7 }}>
          {user.bio}
        </p>
      </div>

      {/* Interests */}
      <div
        style={{
          padding: 20,
          borderRadius: 'var(--radius)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow)',
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🎯 兴趣标签</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {userTags.map((tag) => (
            <span
              key={tag!.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '8px 16px',
                borderRadius: 20,
                background: '#FEE',
                color: 'var(--primary)',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {tag!.icon} {tag!.name}
            </span>
          ))}
        </div>
      </div>

      {/* Action */}
      <button
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 'var(--radius)',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          boxShadow: '0 4px 16px rgba(255, 107, 107, 0.35)',
          animation: 'pulse 2s infinite',
        }}
      >
        💌 打招呼
      </button>
    </div>
  );
}
