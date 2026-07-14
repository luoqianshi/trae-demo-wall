import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { resourceAPI } from '../../services/api';

const categoryLabels: Record<string, string> = {
  document: '文档', video: '视频', image: '图片', other: '其他',
};
const categoryColors: Record<string, string> = {
  document: '#1677ff', video: '#52c41a', image: '#fa8c16', other: '#8c8c8c',
};

export default function Resources() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => { loadResources(); }, [category]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const params: any = { pageSize: 50 };
      if (category) params.category = category;
      const res: any = await resourceAPI.list(params);
      if (res.code === 0) setResources(res.data?.list || res.data || []);
    } catch (err: any) {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    }
    setLoading(false);
  };

  const handleDownload = async (item: any) => {
    try {
      await resourceAPI.download(item.id);
      if (item.file_url) {
        const url = item.file_url.startsWith('http') ? item.file_url : `http://localhost:3000${item.file_url}`;
        Taro.downloadFile({
          url,
          success: (res) => {
            if (res.statusCode === 200) {
              Taro.openDocument({ filePath: res.tempFilePath, showMenu: true });
            }
          },
          fail: () => Taro.showToast({ title: '下载失败', icon: 'none' }),
        });
      }
    } catch {
      Taro.showToast({ title: '下载失败', icon: 'none' });
    }
  };

  const filtered = keyword.trim()
    ? resources.filter((r: any) => (r.name || r.title || '').toLowerCase().includes(keyword.toLowerCase()))
    : resources;

  return (
    <ScrollView scrollY style={{ height: '100vh' }} refresherEnabled onRefresherRefresh={loadResources}>
      <View style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {/* 搜索栏 */}
        <View style={{
          display: 'flex', alignItems: 'center', backgroundColor: '#fff',
          borderRadius: '12px', padding: '10px 16px', marginBottom: '12px',
        }}>
          <View style={{
            width: '28px', height: '28px', borderRadius: '50%', background: '#e6f4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px',
          }}>
            <Text style={{ fontSize: '14px', color: '#1677ff', fontWeight: 'bold' }}>S</Text>
          </View>
          <Input
            style={{ flex: 1, fontSize: '14px' }}
            placeholder="搜索资源..."
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
          />
        </View>

        {/* 分类筛选 */}
        <View style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { label: '全部', value: '' },
            { label: '文档', value: 'document' },
            { label: '视频', value: 'video' },
            { label: '图片', value: 'image' },
            { label: '其他', value: 'other' },
          ].map((opt) => (
            <View key={opt.value} onClick={() => setCategory(opt.value)} style={{
              padding: '6px 14px', borderRadius: '16px', fontSize: '13px',
              backgroundColor: category === opt.value ? '#1677ff' : '#f5f5f5',
              color: category === opt.value ? '#fff' : '#666',
            }}>
              {opt.label}
            </View>
          ))}
        </View>

        {/* 资源列表 */}
        {filtered.length === 0 && !loading ? (
          <View style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
            <Text style={{ display: 'block', fontSize: '16px' }}>暂无资源</Text>
          </View>
        ) : (
          filtered.map((item: any) => (
            <View key={item.id} style={{
              backgroundColor: '#fff', borderRadius: '12px', padding: '16px',
              marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a1a', display: 'block' }}>
                    {item.name || item.title}
                  </Text>
                  {item.description && (
                    <Text style={{ fontSize: '13px', color: '#8c8c8c', display: 'block', marginTop: '4px' }}>
                      {item.description.length > 60 ? item.description.slice(0, 60) + '...' : item.description}
                    </Text>
                  )}
                </View>
                <View style={{
                  padding: '3px 10px', borderRadius: '4px', fontSize: '12px',
                  backgroundColor: (categoryColors[item.category] || '#8c8c8c') + '18',
                  color: categoryColors[item.category] || '#8c8c8c',
                }}>
                  {categoryLabels[item.category] || item.category || '其他'}
                </View>
              </View>
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <Text style={{ fontSize: '12px', color: '#bfbfbf' }}>
                  下载 {item.download_count || 0} 次
                </Text>
                <View onClick={() => handleDownload(item)} style={{
                  padding: '6px 16px', borderRadius: '6px', backgroundColor: '#1677ff',
                }}>
                  <Text style={{ color: '#fff', fontSize: '13px' }}>下载</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}