import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { submissionAPI } from '../../services/api';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const userStr = Taro.getStorageSync('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user?.userId) {
        setLoading(false);
        return;
      }
      const userId = user.userId;
      const res: any = await submissionAPI.getPortfolio(userId);
      if (res.code === 0) setPortfolio(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <ScrollView className="container" scrollY>
      <View style={{ padding: '16px 0' }}>
        <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>我的作品集</Text>
      </View>

      {portfolio.length === 0 && !loading ? (
        <View style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
          <Text style={{ display: 'block', fontSize: '16px', marginBottom: '8px' }}>还没有作品</Text>
          <Text style={{ display: 'block', fontSize: '13px' }}>报名参加PBL营期后，你的作品将在这里展示</Text>
        </View>
      ) : (
        portfolio.map((camp: any, idx: number) => (
          <View key={idx} style={{ marginBottom: '16px' }}>
            <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#1677ff', display: 'block', marginBottom: '8px' }}>
              {camp.campName}
            </Text>
            {camp.submissions.map((sub: any, sIdx: number) => (
              <View key={sIdx} className="card">
                <View className="flex-between">
                  <Text style={{ fontWeight: 'bold' }}>{sub.task_title}</Text>
                  {sub.score !== null ? (
                    <Text className="tag tag-green">得分: {sub.score}分</Text>
                  ) : <Text className="tag tag-blue">已提交</Text>}
                </View>
                <Text style={{ color: '#666', fontSize: '13px', marginTop: '6px', display: 'block' }}>
                  {sub.content || '无内容'}
                </Text>
                {sub.feedback && (
                  <View style={{ marginTop: '8px', padding: '8px', background: '#f6ffed', borderRadius: '4px' }}>
                    <Text style={{ fontSize: '13px', color: '#52c41a' }}>评语: {sub.feedback}</Text>
                  </View>
                )}
                <Text style={{ color: '#bfbfbf', fontSize: '11px', marginTop: '6px', display: 'block' }}>
                  {sub.submitted_at}
                </Text>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}