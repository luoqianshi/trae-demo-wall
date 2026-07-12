import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCurrentUser } from '../data/users';
import { interestTags, interestTagMap } from '../data/tags';
import TagSelector from '../components/TagSelector';
import { getAvatarColor, getInitials } from '../data/users';

export default function MyProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ ...mockCurrentUser });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    age: String(user.age),
    bio: user.bio,
    location: user.location,
    occupation: user.occupation,
    interests: [...user.interests],
  });

  const handleToggleInterest = (id: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((t) => t !== id)
        : [...prev.interests, id],
    }));
  };

  const handleSave = () => {
    setUser({
      ...user,
      name: form.name,
      age: parseInt(form.age) || 0,
      bio: form.bio,
      location: form.location,
      occupation: form.occupation,
      interests: form.interests,
    });
    setEditing(false);
    mockCurrentUser.name = form.name;
    mockCurrentUser.age = parseInt(form.age) || 0;
    mockCurrentUser.bio = form.bio;
    mockCurrentUser.location = form.location;
    mockCurrentUser.occupation = form.occupation;
    mockCurrentUser.interests = form.interests;
  };

  const color = getAvatarColor(0);
  const userTags = form.interests.map((id) => interestTagMap.get(id)).filter(Boolean);

  return (
    <div style={{ paddingBottom: 40, animation: 'fadeIn 0.4s ease both' }}>
      {/* Back */}
      <button
        onClick={() => navigate('/')}
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
        <span>←</span> 返回首页
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>👤 我的资料</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              background: 'var(--primary)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            编辑资料
          </button>
        )}
      </div>

      {/* Avatar */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 30,
            fontWeight: 700,
            margin: '0 auto',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          {getInitials(form.name)}
        </div>
      </div>

      {editing ? (
        <div
          style={{
            padding: 20,
            borderRadius: 'var(--radius)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow)',
          }}
        >
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-light)' }}>
              昵称
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)',
                fontSize: 15,
                background: 'var(--bg)',
              }}
            />
          </div>

          {/* Age & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-light)' }}>
                年龄
              </label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border)',
                  fontSize: 15,
                  background: 'var(--bg)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-light)' }}>
                城市
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border)',
                  fontSize: 15,
                  background: 'var(--bg)',
                }}
              />
            </div>
          </div>

          {/* Occupation */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-light)' }}>
              职业
            </label>
            <input
              value={form.occupation}
              onChange={(e) => setForm({ ...form, occupation: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)',
                fontSize: 15,
                background: 'var(--bg)',
              }}
            />
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-light)' }}>
              个人简介
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)',
                fontSize: 15,
                background: 'var(--bg)',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Interests */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 10, color: 'var(--text-light)' }}>
              选择你的兴趣标签
            </label>
            <TagSelector
              tags={interestTags}
              selected={form.interests}
              onToggle={handleToggleInterest}
            />
          </div>

          {/* Save */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setEditing(false)}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-light)',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              style={{
                flex: 2,
                padding: '14px',
                borderRadius: 'var(--radius)',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
              }}
            >
              保存
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Read-only profile */}
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</h3>
            <div style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 2 }}>
              {user.gender === 'male' ? '♂' : '♀'} · {user.age}岁 · {user.occupation}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              📍 {user.location}
            </div>
          </div>

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

          <div
            style={{
              padding: 20,
              borderRadius: 'var(--radius)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🎯 我的兴趣标签</h3>
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
        </>
      )}
    </div>
  );
}
