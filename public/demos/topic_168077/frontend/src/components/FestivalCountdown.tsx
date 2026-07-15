import React, { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import api from '../api/client';

interface FestivalItem {
  key: string;
  name: string;
  date: string;
  type: string;
  theme: string;
}

interface CurrentFestival {
  festivals: FestivalItem[];
  theme: string;
  label: string;
}

interface CountdownInfo {
  name: string;
  date: string;
  daysUntil: number;
  theme: string;
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

export default function FestivalCountdown() {
  const [next, setNext] = useState<CountdownInfo | null>(null);
  const [currentLabel, setCurrentLabel] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current festival
        const curRes = await api.get('/themes/current');
        const cur = curRes.data as CurrentFestival;

        if (cur.festivals?.length > 0) {
          setCurrentLabel(cur.label);
        }

        // Get all festivals this year and calculate next upcoming
        const yearRes = await api.get('/festivals/year');
        const allFestivals = yearRes.data as FestivalItem[];

        if (allFestivals?.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const upcoming = allFestivals
            .map(f => ({ ...f, dateObj: new Date(f.date) }))
            .filter(f => f.dateObj >= today)
            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

          if (upcoming.length > 0) {
            const nextFestival = upcoming[0];
            // Skip if it's today (already shown in banner)
            if (nextFestival.dateObj.getTime() !== today.getTime()) {
              const diff = Math.ceil((nextFestival.dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              setNext({
                name: nextFestival.name,
                date: nextFestival.date,
                daysUntil: diff,
                theme: nextFestival.theme,
              });
            }
          }
        }
      } catch {
        // Silent
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 600000); // 10min
    return () => clearInterval(interval);
  }, []);

  if (!next && !currentLabel) return null;

  const color = next ? themeColors[next.theme] || '#1890ff' : '#1890ff';

  const content = next ? (
    <div>
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>下次节日</div>
      <div>{next.name} · {next.date}</div>
      <div style={{ color, fontWeight: 'bold', fontSize: 18, marginTop: 4 }}>{next.daysUntil} 天后</div>
    </div>
  ) : (
    <div>{currentLabel}</div>
  );

  return (
    <Tooltip title={content} color="white" overlayInnerStyle={{ color: '#333', minWidth: 150 }}>
      <span style={{ fontSize: 14, cursor: 'pointer', color, whiteSpace: 'nowrap' }}>
        {currentLabel || (next && `${next.name} ${next.daysUntil}天后`)}
      </span>
    </Tooltip>
  );
}