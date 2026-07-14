import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { internshipAPI } from '../../services/api';

export default function Internships() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'my'>('list');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadOpportunities();
    loadMyApplications();
  }, []);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const res: any = await internshipAPI.list({ pageSize: 50 });
      if (res.code === 0) setOpportunities(res.data?.list || res.data || []);
    } catch (err: any) {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    }
    setLoading(false);
  };

  const loadMyApplications = async () => {
    try {
      const res: any = await internshipAPI.getMyApplications();
      if (res.code === 0) setMyApplications(res.data?.list || res.data || []);
    } catch { /* 静默加载 */ }
  };

  const handleApply = (item: any) => {
    Taro.showModal({
      title: '申请实习',
      content: `确认申请 "${item.title || item.position}" 实习岗位？`,
      success: async (modalRes) => {
        if (modalRes.confirm) {
          try {
            await internshipAPI.apply({ opportunityId: item.id, message: '我对这个岗位很感兴趣' });
            Taro.showToast({ title: '申请成功', icon: 'success' });
            loadMyApplications();
          } catch {
            Taro.showToast({ title: '申请失败', icon: 'none' });
          }
        }
      },
    });
  };

  const filtered = keyword.trim()
    ? opportunities.filter((o: any) =>
        (o.title || o.position || o.name || '').toLowerCase().includes(keyword.toLowerCase()) ||
        (o.company || o.enterprise_name || '').toLowerCase().includes(keyword.toLowerCase())
      )
    : opportunities;

  const locationLabel: Record<string, string> = { remote: '远程', onsite: '线下', hybrid: '混合' };

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Tab切换 */}
      <View style={{ display: 'flex', backgroundColor: '#fff', padding: '12px 16px' }}>
        {[
          { key: 'list', label: '推荐岗位' },
          { key: 'my', label: '我的申请' },
        ].map((tab) => (
          <View key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
            flex: 1, textAlign: 'center', padding: '8px 0',
            borderBottom: activeTab === tab.key ? '2px solid #1677ff' : '2px solid transparent',
          }}>
            <Text style={{
              fontSize: '15px', fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              color: activeTab === tab.key ? '#1677ff' : '#666',
            }}>
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 50px)' }} refresherEnabled onRefresherRefresh={() => {
        loadOpportunities(); loadMyApplications();
      }}>
        <View style={{ padding: '16px' }}>
          {activeTab === 'list' ? (
            <>
              {/* 搜索 */}
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
                  placeholder="搜索岗位或企业..."
                  value={keyword}
                  onInput={(e) => setKeyword(e.detail.value)}
                />
              </View>

              {filtered.length === 0 && !loading ? (
                <View style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
                  <Text style={{ display: 'block', fontSize: '16px' }}>暂无实习岗位</Text>
                </View>
              ) : (
                filtered.map((item: any) => (
                  <View key={item.id} style={{
                    backgroundColor: '#fff', borderRadius: '12px', padding: '16px',
                    marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', display: 'block' }}>
                      {item.title || item.position}
                    </Text>
                    <View style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: '13px', color: '#1677ff' }}>
                        {item.company || item.enterprise_name}
                      </Text>
                      {item.location && (
                        <Text style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: '#e6f4ff', color: '#1677ff' }}>
                          {locationLabel[item.location] || item.location}
                        </Text>
                      )}
                    </View>
                    {item.description && (
                      <Text style={{ fontSize: '13px', color: '#8c8c8c', display: 'block', marginTop: '8px' }}>
                        {item.description.length > 80 ? item.description.slice(0, 80) + '...' : item.description}
                      </Text>
                    )}
                    <View style={{ marginTop: '12px' }}>
                      <View onClick={() => handleApply(item)} style={{
                        display: 'inline-block', padding: '8px 24px', borderRadius: '8px',
                        backgroundColor: '#1677ff',
                      }}>
                        <Text style={{ color: '#fff', fontSize: '14px' }}>立即申请</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </>
          ) : (
            <>
              {myApplications.length === 0 ? (
                <View style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
                  <Text style={{ display: 'block', fontSize: '16px' }}>暂无申请记录</Text>
                </View>
              ) : (
                myApplications.map((app: any) => (
                  <View key={app.id} style={{
                    backgroundColor: '#fff', borderRadius: '12px', padding: '16px',
                    marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a1a' }}>
                        {app.opportunity_title || app.position || '实习岗位'}
                      </Text>
                      <View style={{
                        padding: '3px 10px', borderRadius: '4px', fontSize: '12px',
                        backgroundColor: app.status === 'approved' ? '#f6ffed' : app.status === 'rejected' ? '#fff2f0' : '#fff7e6',
                        color: app.status === 'approved' ? '#52c41a' : app.status === 'rejected' ? '#ff4d4f' : '#fa8c16',
                      }}>
                        {app.status === 'approved' ? '已通过' : app.status === 'rejected' ? '已拒绝' : '审核中'}
                      </View>
                    </View>
                    <Text style={{ fontSize: '13px', color: '#8c8c8c', display: 'block', marginTop: '6px' }}>
                      {app.company || app.enterprise_name}
                    </Text>
                    <Text style={{ fontSize: '12px', color: '#bfbfbf', display: 'block', marginTop: '4px' }}>
                      申请时间: {app.created_at || app.applied_at}
                    </Text>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}