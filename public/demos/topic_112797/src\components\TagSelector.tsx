import { InterestTag } from '../types';

interface Props {
  tags: InterestTag[];
  selected: string[];
  onToggle: (id: string) => void;
}

export default function TagSelector({ tags, selected, onToggle }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {tags.map((tag) => {
        const isSelected = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 16px',
              borderRadius: 20,
              border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)',
              background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
              color: isSelected ? '#fff' : 'var(--text)',
              fontSize: 14,
              fontWeight: isSelected ? 600 : 400,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <span>{tag.icon}</span>
            <span>{tag.name}</span>
          </button>
        );
      })}
    </div>
  );
}
