import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Input } from '@tarojs/components';
import { pblAPI } from '../../services/api';
import './index.css';

export default function ShowcaseIndex() {
  const [showcases, setShowcases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadShowcases(); }, []);

  const loadShowcases = async () => {
    setLoading(true);
    try {
      const res: any = await pblAPI.getShowcaseList();
      if (res.code === 0) {
        setShowcases(res.data.list || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/showcase/detail?id=${id}` });
  };

  if (loading) {
    return <View className="container"><View className="loading">加载中...</View></View>;
  }

  return (
    <View className="container">
      <Text className="page-title">成果展示广场</Text>

      <Input className="search-bar" value={search}
        onInput={(e) => setSearch((e as any).detail.value)}
        placeholder="搜索展示项目..." />

      {showcases.length === 0 ? (
        <View className="empty-state">
          <Text className="empty-icon">[ ]</Text>
          <Text className="empty-text">还没有展示项目</Text>
          <Text className="empty-hint">完成项目后，将你的成果发布到展示广场</Text>
        </View>
      ) : (
        <View className="showcase-grid">
          {showcases.map((s: any) => (
            <View key={s.id} className="showcase-card" onClick={() => handleDetail(s.id)}>
              <View className="showcase-cover">
                {s.cover_image ? (
                  <View className="cover-img" style={{ backgroundImage: `url(${s.cover_image})` }} />
                ) : (
                  <View className="cover-placeholder">
                    <Text className="cover-icon">P</Text>
                  </View>
                )}
              </View>
              <View className="showcase-info">
                <Text className="showcase-title">{s.title}</Text>
                <Text className="showcase-author">{s.real_name} - {s.camp_name}</Text>
                <View className="showcase-stats">
                  <Text className="stat-item">L {s.likes_count || 0}</Text>
                  <Text className="stat-item">V {s.views_count || 0}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}