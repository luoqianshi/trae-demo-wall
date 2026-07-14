import { useState, useEffect } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { authAPI, creditAPI, certAPI } from '../../services/api';

const BASE_URL = 'http://localhost:3000/api';

const educationLabel: Record<string, string> = {
  primary: '小学',
  junior: '初中',
  senior: '高中',
  undergraduate: '大学本科',
  postgraduate: '硕士研究生',
  doctoral: '博士研究生',
};

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState({
    enrollments: 0,
    submissions: 0,
    credits: 0,
    certificates: 0,
  });
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    const token = Taro.getStorageSync('token');
    const userStr = Taro.getStorageSync('user');
    if (token && userStr) {
      const parsed = JSON.parse(userStr);
      setUser(parsed);
      loadUserStats();
      loadAchievements();
    }
  }, []);

  const loadUserStats = async () => {
    const token = Taro.getStorageSync('token');
    const header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // 参与项目数（报名数）— API返回 {code:0, data:[...enrollments...]}
    try {
      const res = await Taro.request({
        url: `${BASE_URL}/camps/my-enrollments`,
        method: 'GET',
        header,
      });
      if (res.statusCode === 200) {
        const body = res.data as any;
        const list = body?.data || [];
        const count = Array.isArray(list) ? list.length : 0;
        setStats(prev => ({ ...prev, enrollments: count }));
      }
    } catch { /* ignore */ }

    // 完成作品数（提交数）— API返回 {code:0, data:[...submissions...]}
    try {
      const res = await Taro.request({
        url: `${BASE_URL}/submissions/my`,
        method: 'GET',
        header,
      });
      if (res.statusCode === 200) {
        const body = res.data as any;
        const list = body?.data || [];
        const count = Array.isArray(list) ? list.length : 0;
        setStats(prev => ({ ...prev, submissions: count }));
      }
    } catch { /* ignore */ }

    // 获得学分 — API返回 {code:0, data:{records:[], summary:{practice:0, comprehensive:0, total:0}}}
    try {
      const res: any = await creditAPI.getMy();
      if (res.code === 0) {
        const data = res.data;
        const total = data?.summary?.total ?? data?.total ?? data?.credits ?? 0;
        setStats(prev => ({ ...prev, credits: Number(total) }));
      }
    } catch { /* ignore */ }

    // 获得证书 — API返回 {code:0, data:[...certs...]}
    try {
      const res: any = await certAPI.getMy();
      if (res.code === 0) {
        const list = Array.isArray(res.data) ? res.data : [];
        setStats(prev => ({ ...prev, certificates: list.length }));
      }
    } catch { /* ignore */ }
  };

  const loadAchievements = async () => {
    const token = Taro.getStorageSync('token');
    try {
      const res = await Taro.request({
        url: `${BASE_URL}/certificates/my`,
        method: 'GET',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.statusCode === 200) {
        const data = res.data as any;
        const list = data?.data?.list || data?.list || data || [];
        if (Array.isArray(list)) {
          setAchievements(list.slice(0, 6));
        }
      }
    } catch { /* ignore */ }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Taro.showToast({ title: '请输入用户名和密码', icon: 'none' });
      return;
    }
    setLoggingIn(true);
    try {
      const res: any = await authAPI.login(username, password);
      if (res.code === 0) {
        Taro.setStorageSync('token', res.data.token);
        Taro.setStorageSync('user', JSON.stringify(res.data));
        setUser(res.data);
        Taro.showToast({ title: '登录成功', icon: 'success' });
        loadUserStats();
        loadAchievements();
      }
    } catch { /* ignore */ }
    setLoggingIn(false);
  };

  const handleLogout = () => {
    Taro.removeStorageSync('token');
    Taro.removeStorageSync('user');
    setUser(null);
    setStats({ enrollments: 0, submissions: 0, credits: 0, certificates: 0 });
    setAchievements([]);
    Taro.showToast({ title: '已退出', icon: 'success' });
  };

  const roleLabel: Record<string, string> = { teacher: '教师', student: '学生', platform_admin: '管理员' };

  return (
    <View className="container">
      {user ? (
        <>
          {/* 用户基本信息卡片 */}
          <View className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <View style={{
              width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #1677ff, #4096ff)',
              margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#fff', fontSize: '24px' }}>{user.realName?.[0] || '用'}</Text>
            </View>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', display: 'block' }}>{user.realName}</Text>
            <Text style={{ color: '#8c8c8c', display: 'block', marginTop: '4px' }}>
              {roleLabel[user.role] || user.role}
            </Text>
            {/* 学段显示 */}
            {user.educationLevel && (
              <View style={{
                display: 'inline-block',
                marginTop: '8px',
                padding: '4px 12px',
                borderRadius: '12px',
                background: '#e6f7ff',
              }}>
                <Text style={{ color: '#1677ff', fontSize: '13px' }}>
                  {educationLabel[user.educationLevel] || user.educationLevel}
                </Text>
              </View>
            )}
          </View>

          {/* 用户详细信息 */}
          <View className="card">
            <View className="flex-between" style={{ marginBottom: '8px' }}>
              <Text style={{ color: '#8c8c8c' }}>用户名</Text>
              <Text>{user.username}</Text>
            </View>
            <View className="flex-between">
              <Text style={{ color: '#8c8c8c' }}>手机号</Text>
              <Text>{user.phone || '未绑定'}</Text>
            </View>
          </View>

          {/* 项目统计卡片 */}
          <View style={{ marginBottom: '12px' }}>
            <Text style={{
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '12px',
            }}>
              项目统计
            </Text>
            <View style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}>
              {/* 参与项目数 */}
              <View style={{
                width: '48%',
                background: '#fff',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#1677ff' }}>
                  {stats.enrollments}
                </Text>
                <Text style={{ fontSize: '13px', color: '#8c8c8c', marginTop: '4px' }}>
                  参与项目数
                </Text>
              </View>

              {/* 完成作品数 */}
              <View style={{
                width: '48%',
                background: '#fff',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.submissions}
                </Text>
                <Text style={{ fontSize: '13px', color: '#8c8c8c', marginTop: '4px' }}>
                  完成作品数
                </Text>
              </View>

              {/* 获得学分 */}
              <View style={{
                width: '48%',
                background: '#fff',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {stats.credits}
                </Text>
                <Text style={{ fontSize: '13px', color: '#8c8c8c', marginTop: '4px' }}>
                  获得学分
                </Text>
              </View>

              {/* 获得证书 */}
              <View style={{
                width: '48%',
                background: '#fff',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#722ed1' }}>
                  {stats.certificates}
                </Text>
                <Text style={{ fontSize: '13px', color: '#8c8c8c', marginTop: '4px' }}>
                  获得证书
                </Text>
              </View>
            </View>
          </View>

          {/* 成就/证书展示 */}
          {achievements.length > 0 && (
            <View style={{ marginBottom: '12px' }}>
              <Text style={{
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'block',
                marginBottom: '12px',
              }}>
                我的成就
              </Text>
              <View style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {achievements.map((item: any, index: number) => (
                  <View
                    key={item.id || index}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: '0',
                    }}
                  >
                    <View style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: '#f9f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px',
                      flexShrink: 0,
                    }}>
                      <Text style={{ color: '#722ed1', fontSize: '18px', fontWeight: 'bold' }}>
                        {item.name?.[0] || '证'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        {item.name || item.title || '证书'}
                      </Text>
                      <Text style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                        {item.issueDate || item.created_at || item.date || ''}
                      </Text>
                    </View>
                    <View style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#f6ffed',
                    }}>
                      <Text style={{ color: '#52c41a', fontSize: '11px' }}>已获得</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Button style={{
            marginTop: '16px',
            backgroundColor: '#ff4d4f',
            color: '#fff',
            borderRadius: '8px',
          }} onClick={handleLogout}>退出登录</Button>
        </>
      ) : (
        <View className="card" style={{ marginTop: '40px' }}>
          <Text style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', display: 'block', marginBottom: '20px' }}>
            登录PBL平台
          </Text>
          <Input
            style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '14px' }}
            placeholder="用户名"
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
          <Input
            style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '10px', marginBottom: '16px', fontSize: '14px' }}
            placeholder="密码"
            type="password"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
          <Button style={{ backgroundColor: '#1677ff', color: '#fff', borderRadius: '8px' }}
            onClick={handleLogin} loading={loggingIn}>
            登录
          </Button>
          <Text style={{ textAlign: 'center', color: '#8c8c8c', fontSize: '12px', display: 'block', marginTop: '12px' }}>
            测试账号: student / student123
          </Text>
        </View>
      )}
    </View>
  );
}