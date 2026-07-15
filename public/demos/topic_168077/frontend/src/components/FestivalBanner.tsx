import React, { useEffect, useState } from 'react';
import api from '../api/client';

interface FestivalInfo {
  festivals: Array<{ key: string; name: string; type: string; theme: string }>;
  theme: string;
  label: string;
}

const themeColors: Record<string, string> = {
  'spring-festival': '#cc0000',
  'new-year': '#cc0000',
  'children-day': '#52c41a',
  'dragon-boat': '#1890ff',
  'mid-autumn': '#faad14',
  'national-day': '#cc0000',
  'winter-solstice': '#722ed1',
  'qixi': '#eb2f96',
};

const themeIcons: Record<string, string> = {
  'spring-festival': '🧧',
  'new-year': '🎉',
  'children-day': '🎈',
  'dragon-boat': '🐉',
  'mid-autumn': '🥮',
  'national-day': '🇨🇳',
  'winter-solstice': '❄️',
  'qixi': '💕',
};

export default function FestivalBanner() {
  const [info, setInfo] = useState<FestivalInfo | null>(null);

  useEffect(() => {
    api.get('/themes/current').then(res => {
      const data = res.data as FestivalInfo;
      if (data.festivals?.length > 0) {
        setInfo(data);
      }
    }).catch(() => {});
  }, []);

  if (!info || info.festivals.length === 0) return null;

  const theme = info.theme;
  const color = themeColors[theme] || '#1890ff';
  const icon = themeIcons[theme] || '🎉';

  return (
    <div className="festival-banner" style={{
      background: `linear-gradient(135deg, ${color}22, ${color}44)`,
      border: `1px solid ${color}44`,
      borderRadius: 8,
      padding: '8px 16px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 14,
      color: color,
    }}>
      <span className="festival-banner-icon" style={{ fontSize: 24 }}>{icon}</span>
      <span>
        <strong>{info.label || info.festivals[0].name}</strong>
        {info.festivals.length > 1 && (
          <span style={{ marginLeft: 8, color: '#666' }}>
            · {info.festivals.slice(1).map(f => f.name).join('、')}
          </span>
        )}
      </span>
    </div>
  );
}