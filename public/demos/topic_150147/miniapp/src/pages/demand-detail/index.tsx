import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { enterpriseAPI } from '../../services/api';

const statusLabels: Record<string, string> = {
  draft: '草稿', published: '已发布', in_progress: '对接中', completed: '已完成', cancelled: '已取消',
};
const statusColors: Record<string, string> = {
  draft: '#8c8c8c', published: '#1677ff', in_progress: '#fa8c16', completed: '#52c41a', cancelled: '#ff4d4f',
};

export default function DemandDetail() {
  const router = useRouter();
  const { id } = router.params;
  const [demand, setDemand] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) loadDemand();
  }, [id]);

  const loadDemand = async () => {
    setLoading(true);
    try {
      const res: any = await enterpriseAPI.getDemandDetail(Number(id));
      if (res.code === 0) {
        setDemand(res.data);
        setModules(res.data.modules || []);
      }
    } catch (err: any) {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    }
    setLoading(false);
  };

  // 递归渲染模块树
  const renderModules = (mods: any[], level = 0) => {
    if (!mods || mods.length === 0) return null;
    return mods.map((mod: any) => (
      <View key={mod.id}>
        <View style={{
          padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '8px',
          marginBottom: '8px', marginLeft: `${level * 16}px`,
          backgroundColor: level === 0 ? '#fafafa' : '#fff',
        }}>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
              {mod.name || mod.title}
            </Text>
            {mod.grade_level && (
              <View style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                backgroundColor: '#e6f4ff', color: '#1677ff',
              }}>
                {mod.grade_level === 'elementary' ? '小学' : mod.grade_level === 'middle' ? '初中' :
                 mod.grade_level === 'high' ? '高中' : mod.grade_level === 'undergraduate' ? '本科' : '研究生'}
              </View>
            )}
          </View>
          {mod.description && (
            <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginTop: '4px' }}>
              {mod.description}
            </Text>
          )}
          {mod.deadline && (
            <Text style={{ fontSize: '11px', color: '#bfbfbf', display: 'block', marginTop: '4px' }}>
              截止: {mod.deadline}
            </Text>
          )}
        </View>
        {mod.children && renderModules(mod.children, level + 1)}
      </View>
    ));
  };

  if (!demand && !loading) {
    return (
      <View style={{ textAlign: 'center', padding: '80px 0', color: '#8c8c8c' }}>
        <Text style={{ display: 'block', fontSize: '16px' }}>需求不存在</Text>
      </View>
    );
  }

  return (
    <ScrollView scrollY style={{ height: '100vh' }} refresherEnabled onRefresherRefresh={loadDemand}>
      <View style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {demand && (
          <>
            {/* 需求基本信息 */}
            <View style={{
              backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
              marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', flex: 1 }}>
                  {demand.title || demand.name}
                </Text>
                <View style={{
                  padding: '3px 10px', borderRadius: '4px', fontSize: '12px',
                  backgroundColor: (statusColors[demand.status] || '#8c8c8c') + '18',
                  color: statusColors[demand.status] || '#8c8c8c',
                  marginLeft: '8px',
                }}>
                  {statusLabels[demand.status] || demand.status}
                </View>
              </View>

              {demand.enterprise_name && (
                <Text style={{ fontSize: '14px', color: '#1677ff', display: 'block', marginBottom: '8px' }}>
                  {demand.enterprise_name}
                </Text>
              )}

              {demand.description && (
                <Text style={{ fontSize: '14px', color: '#555', lineHeight: '22px', display: 'block' }}>
                  {demand.description}
                </Text>
              )}

              {demand.business_goal && (
                <View style={{
                  backgroundColor: '#fff7e6', borderRadius: '8px', padding: '12px',
                  marginTop: '12px', border: '1px solid #ffd591',
                }}>
                  <Text style={{ fontSize: '12px', color: '#d46b08', display: 'block', marginBottom: '4px' }}>
                    商业目标
                  </Text>
                  <Text style={{ fontSize: '13px', color: '#333' }}>{demand.business_goal}</Text>
                </View>
              )}
            </View>

            {/* 模块树 */}
            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', display: 'block', marginBottom: '12px' }}>
              项目模块 ({modules.length})
            </Text>
            {modules.length === 0 ? (
              <View style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                <Text style={{ display: 'block', fontSize: '15px' }}>暂无模块</Text>
              </View>
            ) : (
              renderModules(modules)
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}