import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { creditAPI } from '../../services/api';

export default function Credits() {
  const [summary, setSummary] = useState({ practice: 0, comprehensive: 0, total: 0 });
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadCredits(); }, []);

  const loadCredits = async () => {
    setLoading(true);
    try {
      const res: any = await creditAPI.getMy();
      if (res.code === 0) {
        const data = res.data;
        if (data?.summary) {
          setSummary(data.summary);
          setRecords(data.records || []);
        } else if (Array.isArray(data)) {
          setRecords(data);
          const total = data.reduce((sum: number, r: any) => sum + (r.points || r.credits || 0), 0);
          setSummary({ practice: 0, comprehensive: 0, total });
        }
      }
    } catch (err: any) {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    }
    setLoading(false);
  };

  // 学分目标（可从后端配置获取，此处使用默认值）
  const targetCredits = { practice: 10, comprehensive: 5 };
  const totalTarget = targetCredits.practice + targetCredits.comprehensive;

  return (
    <ScrollView scrollY style={{ height: '100vh' }} refresherEnabled onRefresherRefresh={loadCredits}>
      <View style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {/* 学分总览卡片 */}
        <View style={{
          background: 'linear-gradient(135deg, #1677ff, #3b9eff)',
          borderRadius: '16px', padding: '28px 24px', marginBottom: '16px',
          color: '#fff', textAlign: 'center',
        }}>
          <Text style={{ fontSize: '48px', fontWeight: 'bold', display: 'block' }}>
            {summary.total}
          </Text>
          <Text style={{ fontSize: '15px', opacity: 0.85, display: 'block', marginTop: '6px' }}>
            已获得学分 / 目标 {totalTarget} 学分
          </Text>
          {/* 进度条 */}
          <View style={{
            height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.3)',
            marginTop: '16px', overflow: 'hidden',
          }}>
            <View style={{
              height: '100%', borderRadius: '4px',
              backgroundColor: '#fff',
              width: `${Math.min((summary.total / totalTarget) * 100, 100)}%`,
              transition: 'width 0.5s',
            }} />
          </View>
        </View>

        {/* 分类学分 */}
        <View style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <View style={{
            flex: 1, backgroundColor: '#fff', borderRadius: '12px',
            padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#1677ff', display: 'block' }}>
              {summary.practice}
            </Text>
            <Text style={{ fontSize: '13px', color: '#8c8c8c', display: 'block', marginTop: '4px' }}>
              实践学分 / {targetCredits.practice}
            </Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: '#fff', borderRadius: '12px',
            padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a', display: 'block' }}>
              {summary.comprehensive}
            </Text>
            <Text style={{ fontSize: '13px', color: '#8c8c8c', display: 'block', marginTop: '4px' }}>
              综合素质 / {targetCredits.comprehensive}
            </Text>
          </View>
        </View>

        {/* 学分获取规则 */}
        <View style={{
          backgroundColor: '#fff', borderRadius: '12px', padding: '16px',
          marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a1a', display: 'block', marginBottom: '10px' }}>
            学分获取规则
          </Text>
          <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: '完成PBL营期任务', desc: '根据任务难度获得 1-5 学分' },
              { label: '提交高质量作品', desc: '教师评分优秀可获得额外 2 学分' },
              { label: '参与跨学段协作', desc: '完成跨学段任务可获得 3 学分' },
              { label: '获得结营证书', desc: '结营时自动获得 1 学分' },
            ].map((rule, i) => (
              <View key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <View style={{
                  width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#e6f4ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px',
                }}>
                  <Text style={{ fontSize: '12px', color: '#1677ff', fontWeight: 'bold' }}>{i + 1}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: '14px', color: '#333' }}>{rule.label}</Text>
                  <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>{rule.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 学分明细 */}
        <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a1a', display: 'block', marginBottom: '10px' }}>
          学分明细
        </Text>
        {records.length === 0 && !loading ? (
          <View style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
            <Text style={{ display: 'block', fontSize: '15px' }}>暂无学分记录</Text>
            <Text style={{ display: 'block', fontSize: '13px', marginTop: '6px' }}>完成PBL任务后学分将自动记录</Text>
          </View>
        ) : (
          records.map((record: any, idx: number) => (
            <View key={record.id || idx} style={{
              backgroundColor: '#fff', borderRadius: '12px', padding: '14px 16px',
              marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: '14px', color: '#333', display: 'block' }}>
                  {record.reason || record.description || record.source || '学分获取'}
                </Text>
                <Text style={{ fontSize: '12px', color: '#bfbfbf', display: 'block', marginTop: '4px' }}>
                  {record.created_at || record.date}
                </Text>
              </View>
              <Text style={{
                fontSize: '18px', fontWeight: 'bold',
                color: (record.points || record.credits || 0) > 0 ? '#52c41a' : '#ff4d4f',
              }}>
                +{record.points || record.credits || 0}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}