import React from 'react';
import { Radio, Space } from 'antd';

const DEFAULT_AVATARS = {
  male: [
    { value: '/avatars/boy1.png', label: '男孩1' },
    { value: '/avatars/boy2.png', label: '男孩2' },
    { value: '/avatars/boy3.png', label: '男孩3' },
  ],
  female: [
    { value: '/avatars/girl1.png', label: '女孩1' },
    { value: '/avatars/girl2.png', label: '女孩2' },
    { value: '/avatars/girl3.png', label: '女孩3' },
  ],
  animal: [
    { value: '/avatars/cat.png', label: '小猫' },
    { value: '/avatars/dog.png', label: '小狗' },
    { value: '/avatars/rabbit.png', label: '兔子' },
    { value: '/avatars/panda.png', label: '熊猫' },
    { value: '/avatars/lion.png', label: '狮子' },
  ],
};

function getRecommended(gender: string) {
  if (gender === 'male') return [...DEFAULT_AVATARS.male, ...DEFAULT_AVATARS.animal];
  if (gender === 'female') return [...DEFAULT_AVATARS.female, ...DEFAULT_AVATARS.animal];
  return Object.values(DEFAULT_AVATARS).flat();
}

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  gender?: string;
}

export default function AvatarSelector({ value, onChange, gender }: Props) {
  const avatars = getRecommended(gender || '');
  return (
    <Radio.Group value={value} onChange={e => onChange?.(e.target.value)}>
      <Space wrap>
        {avatars.map(a => (
          <Radio.Button key={a.value} value={a.value} style={{ height: 64, width: 64, padding: 4 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f0f0', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#999' }}>{a.label[0]}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>{a.label}</div>
            </div>
          </Radio.Button>
        ))}
      </Space>
    </Radio.Group>
  );
}