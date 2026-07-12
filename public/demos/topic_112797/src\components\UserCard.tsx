import { User } from '../types';
import { getAvatarColor, getInitials } from '../data/users';

interface Props {
  user: User;
  matchScore?: number;
  onClick?: () => void;
}

export default function UserCard({ user, matchScore, onClick }: Props) {
  const color = getAvatarColor(parseInt(user.id.slice(1)) || 0);

  return (
    <div
      className="user-card"
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        marginBottom: '14px',
        boxShadow: 'var(--shadow)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'var(--transition)',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 22,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {getInitials(user.name)}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</span>
          <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
            {user.gender === 'male' ? '♂' : '♀'} {user.age}岁
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            📍{user.location}
          </span>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 10 }}>
          {user.occupation}
        </div>

        <p
          style={{
            fontSize: 13,
            color: 'var(--text-light)',
            marginBottom: 10,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {user.bio}
        </p>

        {/* Match Score */}
        {matchScore !== undefined && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: `linear-gradient(135deg, var(--primary), var(--primary-light))`,
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            🔥 匹配度 {matchScore}%
          </div>
        )}
      </div>
    </div>
  );
}
