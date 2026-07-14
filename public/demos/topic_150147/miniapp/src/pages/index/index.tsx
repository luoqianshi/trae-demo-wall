import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { campAPI, pblAPI } from '../../services/api';

const BASE_URL = 'http://localhost:3000/api';

const typeLabel: Record<string, string> = {
  single: '单日营', '7day': '7天营', '14day': '14天营', winter: '寒假营', summer: '暑假营', weekend: '周末营',
};

export default function Index() {
  const [camps, setCamps] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = () => {
    const token = Taro.getStorageSync('token');
    const userStr = Taro.getStorageSync('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }
    if (token) {
      loadCamps();
      loadWorkspaces();
    }
  };

  useDidShow(() => { loadAll(); });

  useEffect(() => { loadAll(); }, []);

  const loadCamps = async () => {
    try {
      const res: any = await campAPI.list({ status: 'published', pageSize: 5 });
      if (res.code === 0) setCamps(res.data.list || []);
    } catch {}
  };

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const res: any = await pblAPI.getMyWorkspaces();
      if (res.code === 0) setWorkspaces(res.data || []);
    } catch {}
    setLoading(false);
  };

  const phaseLabels: Record<string, string> = {
    inquiry: '启动探究', research: '深入调研', creation: '创作实践',
    revision: '反馈修订', showcase: '成果展示',
  };

  return (
    <ScrollView scrollY style={{ height: '100vh' }} refresherEnabled onRefresherRefresh={loadAll}>
      <View style={{ padding: '16px 16px 0' }}>
        {/* 用户问候 */}
        {user ? (
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '12px 0', marginBottom: '12px' }}>
            <View style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1677ff, #4096ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px',
            }}>
              <Text style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                {user.realName?.[0] || '用'}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: '17px', fontWeight: 'bold', color: '#1a1a1a', display: 'block' }}>
                {user.realName || '同学'}，你好
              </Text>
              <Text style={{ fontSize: '13px', color: '#8c8c8c', display: 'block', marginTop: '2px' }}>
                开始你的项目式学习之旅
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ padding: '20px 0', textAlign: 'center' }}>
            <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#1677ff' }}>PBL项目学习</Text>
            <Text style={{ display: 'block', marginTop: '8px', color: '#8c8c8c', fontSize: '14px' }}>
              中小学线上项目式学习平台
            </Text>
          </View>
        )}

        {/* 我的项目 - 工作台入口 */}
        {user && workspaces.length > 0 && (
          <View style={{ marginBottom: '16px' }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a' }}>我的项目</Text>
              <Text style={{ color: '#1677ff', fontSize: '14px' }} onClick={() => Taro.switchTab({ url: '/pages/camps/index' })}>
                浏览更多 &gt;
              </Text>
            </View>
            {workspaces.map((ws: any) => (
              <View key={ws.id} style={{
                background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '4px solid #1677ff',
              }} onClick={() => Taro.navigateTo({ url: `/pages/workspace/index?campId=${ws.camp_id}` })}>
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', flex: 1 }}>{ws.camp_name}</Text>
                  <Text style={{
                    fontSize: '12px', padding: '2px 8px', borderRadius: '4px',
                    background: '#e6f4ff', color: '#1677ff', whiteSpace: 'nowrap', marginLeft: '8px',
                  }}>
                    {phaseLabels[ws.current_phase] || ws.current_phase}
                  </Text>
                </View>
                {ws.template_name && (
                  <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block' }}>
                    模板：{ws.template_name}
                  </Text>
                )}
                <View style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <Text style={{ fontSize: '11px', color: '#bfbfbf' }}>{ws.start_date} ~ {ws.end_date}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 快捷入口 */}
        {user && (
          <View style={{
            display: 'flex', flexDirection: 'row', justifyContent: 'space-around',
            background: '#fff', borderRadius: '12px', padding: '16px 8px', marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            {[ 
              { label: '我的任务', letter: 'T', color: '#1677ff', url: '/pages/portfolio/index' },
              { label: '作品集', letter: 'P', color: '#52c41a', url: '/pages/portfolio/index' },
              { label: '证书', letter: 'C', color: '#fa8c16', url: '/pages/certificates/index' },
              { label: '展示广场', letter: 'S', color: '#722ed1', url: '/pages/showcase/index' },
            ].map((item, i) => (
              <View key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                onClick={() => Taro.navigateTo({ url: item.url })}
              >
                <View style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: '16px', fontWeight: 'bold', color: item.color }}>{item.letter}</Text>
                </View>
                <Text style={{ fontSize: '12px', color: '#666' }}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 推荐营期 */}
        <View style={{ marginBottom: '16px' }}>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a' }}>推荐营期</Text>
            <Text style={{ color: '#1677ff', fontSize: '14px' }} onClick={() => Taro.switchTab({ url: '/pages/camps/index' })}>
              查看全部 &gt;
            </Text>
          </View>

          {camps.length === 0 ? (
            <View style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
              <Text style={{ display: 'block', fontSize: '15px' }}>暂无推荐营期</Text>
              <Text style={{ display: 'block', fontSize: '13px', marginTop: '8px' }}>请先登录查看</Text>
            </View>
          ) : (
            camps.map((camp: any) => (
              <View key={camp.id} style={{
                background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }} onClick={() => Taro.navigateTo({ url: `/pages/camp-detail/index?id=${camp.id}` })}>
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', flex: 1 }}>{camp.name}</Text>
                  <Text style={{
                    fontSize: '12px', padding: '2px 8px', borderRadius: '4px',
                    background: camp.price > 0 ? '#fff2f0' : '#f6ffed',
                    color: camp.price > 0 ? '#ff4d4f' : '#52c41a',
                    whiteSpace: 'nowrap', marginLeft: '8px',
                  }}>
                    {camp.price > 0 ? `P${camp.price}` : '免费'}
                  </Text>
                </View>
                <View style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <Text style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: '#e6f4ff', color: '#1677ff' }}>
                    {typeLabel[camp.type] || camp.type}
                  </Text>
                  {camp.template_name && (
                    <Text style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: '#f6ffed', color: '#52c41a' }}>
                      {camp.template_name}
                    </Text>
                  )}
                </View>
                <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>
                  {camp.start_date} ~ {camp.end_date} | 已报名 {camp.enrolled_count || 0}人
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}