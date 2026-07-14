import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { campAPI, submissionAPI, orderAPI } from '../../services/api';
import StatusTag from '../../components/StatusTag';
import TaskCard from '../../components/TaskCard';
import EmptyState from '../../components/EmptyState';

const typeLabels: Record<string, string> = {
  single: '单日营', '7day': '7天营', '14day': '14天营',
  winter: '寒假营', summer: '暑假营', weekend: '周末营',
};

export default function CampDetail() {
  const router = useRouter();
  const { id } = router.params;
  const [camp, setCamp] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const isFirstShow = useRef(true);

  useEffect(() => {
    if (id) loadCamp();
  }, [id]);

  // 每次页面显示时重新加载提交状态（从提交页返回时触发）
  useDidShow(() => {
    if (isFirstShow.current) {
      isFirstShow.current = false;
      return;
    }
    if (id && enrolled) {
      loadMySubmissions();
    }
  });

  const loadCamp = async () => {
    try {
      const res: any = await campAPI.detail(Number(id));
      if (res.code === 0) {
        setCamp(res.data);
        setTasks(res.data.tasks || []);
      }
      // 检查是否已报名
      await checkEnrollment();
    } catch { /* ignore */ }
  };

  const checkEnrollment = async () => {
    const user = Taro.getStorageSync('user');
    if (user?.userId) {
      try {
        const studentsRes: any = await campAPI.getStudents(Number(id));
        if (studentsRes.code === 0) {
          const isEnrolled = (studentsRes.data || []).some((s: any) => s.user_id === user.userId);
          setEnrolled(isEnrolled);
          if (isEnrolled) {
            loadMySubmissions();
          }
        }
      } catch {}
    }
  };

  const loadMySubmissions = async () => {
    try {
      const subRes: any = await submissionAPI.getMy(Number(id));
      if (subRes.code === 0) setMySubmissions(subRes.data || []);
    } catch {}
  };

  const handleEnroll = () => {
    Taro.showModal({
      title: '确认报名',
      content: camp.price > 0
        ? `"${camp.name}" 费用为 ¥${camp.price}，确认报名并支付？`
        : `确认报名 "${camp.name}"？`,
      success: async (modalRes) => {
        if (modalRes.confirm) {
          setEnrolling(true);
          try {
            // 步骤1：报名
            const enrollRes: any = await campAPI.enroll(Number(id));
            if (enrollRes.code !== 0) throw new Error('报名失败');

            // 步骤2：如果是付费营地，创建订单并支付
            if (camp.price > 0) {
              try {
                const orderRes: any = await orderAPI.create(Number(id));
                if (orderRes.code === 0 && orderRes.data?.orderNo) {
                  Taro.showLoading({ title: '支付中...' });
                  await orderAPI.pay(orderRes.data.orderNo);
                  Taro.hideLoading();
                  Taro.showToast({ title: '报名并支付成功', icon: 'success' });
                } else {
                  Taro.showToast({ title: '报名成功，请稍后支付', icon: 'none' });
                }
              } catch {
                Taro.showToast({ title: '报名成功，请稍后支付', icon: 'none' });
              }
            } else {
              Taro.showToast({ title: '报名成功', icon: 'success' });
            }
            setEnrolled(true);
            loadCamp();
          } catch (err: any) {
            Taro.showToast({ title: err.message || '报名失败', icon: 'none' });
          }
          setEnrolling(false);
        }
      },
    });
  };

  const getTaskStatus = (taskId: number) => {
    const sub = mySubmissions.find((s: any) => s.task_id === taskId);
    if (!sub) return 'pending';
    if (sub.status === 'reviewed') return 'reviewed';
    if (sub.status === 'returned') return 'returned';
    return 'submitted';
  };

  const getTaskScore = (taskId: number) => {
    const sub = mySubmissions.find((s: any) => s.task_id === taskId);
    return sub?.score;
  };

  const isFull = camp?.enrollmentCount >= camp?.max_students;

  if (!camp) return <View style={{ padding: '60rpx', textAlign: 'center' }}><Text>加载中...</Text></View>;

  return (
    <ScrollView scrollY style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 营地基本信息 */}
      <View style={{ backgroundColor: '#fff', padding: '32rpx', marginBottom: '16rpx' }}>
        {/* 封面图 */}
        {camp.cover_image && (
          <View style={{ width: '100%', height: '320rpx', borderRadius: '12rpx', overflow: 'hidden', marginBottom: '20rpx' }}>
            <View style={{ width: '100%', height: '100%', backgroundImage: `url(${camp.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          </View>
        )}
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16rpx' }}>
          <Text style={{ fontSize: '36rpx', fontWeight: 700, color: '#1a1a1a', flex: 1, marginRight: '16rpx' }}>
            {camp.name}
          </Text>
          <StatusTag status={camp.status} type="camp" />
        </View>

        {/* 标签行 */}
        <View style={{ display: 'flex', gap: '12rpx', flexWrap: 'wrap', marginBottom: '16rpx' }}>
          <View style={{ fontSize: '22rpx', padding: '4rpx 14rpx', borderRadius: '8rpx', backgroundColor: '#e6f4ff', color: '#1677ff' }}>
            {typeLabels[camp.type] || camp.type}
          </View>
          {camp.template_name && (
            <View style={{ fontSize: '22rpx', padding: '4rpx 14rpx', borderRadius: '8rpx', backgroundColor: '#f6ffed', color: '#52c41a' }}>
              模板: {camp.template_name}
            </View>
          )}
          <View style={{ fontSize: '22rpx', padding: '4rpx 14rpx', borderRadius: '8rpx',
            backgroundColor: camp.price > 0 ? '#fff2f0' : '#f6ffed',
            color: camp.price > 0 ? '#f5222d' : '#52c41a',
          }}>
            {camp.price > 0 ? `¥${camp.price}` : '免费'}
          </View>
        </View>

        {/* 基本信息 */}
        <View style={{ display: 'flex', flexDirection: 'column', gap: '8rpx', fontSize: '24rpx', color: '#8c8c8c', marginBottom: '16rpx' }}>
          <View style={{ display: 'flex', alignItems: 'center', gap: '6rpx' }}>
            <View style={{ width: '28rpx', height: '28rpx', borderRadius: '4rpx', background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: '16rpx', color: '#1677ff', fontWeight: 'bold' }}>D</Text>
            </View>
            <Text>{camp.start_date} ~ {camp.end_date}</Text>
          </View>
          <View style={{ display: 'flex', alignItems: 'center', gap: '6rpx' }}>
            <View style={{ width: '28rpx', height: '28rpx', borderRadius: '4rpx', background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: '16rpx', color: '#52c41a', fontWeight: 'bold' }}>P</Text>
            </View>
            <Text>已报名 {camp.enrollmentCount || 0}/{camp.max_students}人</Text>
          </View>
          {camp.institution_name && (
            <View style={{ display: 'flex', alignItems: 'center', gap: '6rpx' }}>
              <View style={{ width: '28rpx', height: '28rpx', borderRadius: '4rpx', background: '#f9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '16rpx', color: '#722ed1', fontWeight: 'bold' }}>S</Text>
              </View>
              <Text>{camp.institution_name}</Text>
            </View>
          )}
        </View>

        {camp.description && (
          <Text style={{ fontSize: '26rpx', color: '#666', lineHeight: '40rpx', display: 'block', marginBottom: '16rpx' }}>
            {camp.description}
          </Text>
        )}

        {/* 报名按钮 */}
        <Button
          style={{
            width: '100%', borderRadius: '12rpx', height: '88rpx', lineHeight: '88rpx',
            fontSize: '30rpx', fontWeight: 500,
            backgroundColor: enrolled ? '#f5f5f5' : isFull ? '#f5f5f5' : '#1677ff',
            color: enrolled ? '#8c8c8c' : isFull ? '#8c8c8c' : '#fff',
          }}
          onClick={handleEnroll}
          loading={enrolling}
          disabled={enrolled || isFull || enrolling}
        >
          {enrolled ? '已报名' : isFull ? '已满员' : '立即报名'}
        </Button>

        {/* 进入项目工作台 */}
        {enrolled && (
          <Button
            style={{
              width: '100%', borderRadius: '12rpx', height: '88rpx', lineHeight: '88rpx',
              fontSize: '30rpx', fontWeight: 500,
              backgroundColor: '#52c41a', color: '#fff', marginTop: '16rpx',
            }}
            onClick={() => Taro.navigateTo({ url: `/pages/workspace/index?campId=${id}` })}
          >
            进入项目工作台
          </Button>
        )}
      </View>

      {/* PBL模板内容 */}
      {camp.template_id && (
        <View style={{ backgroundColor: '#fff', padding: '32rpx', marginBottom: '16rpx' }}>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16rpx' }}
            onClick={() => setShowTemplate(!showTemplate)}
          >
            <Text style={{ fontSize: '30rpx', fontWeight: 600 }}>项目详情</Text>
            <Text style={{ fontSize: '24rpx', color: '#1677ff' }}>{showTemplate ? '收起' : '展开'}</Text>
          </View>

          {showTemplate && (
            <View>
              {/* 驱动问题 */}
              {camp.driving_question && (
                <View style={{ backgroundColor: '#fff7e6', borderRadius: '12rpx', padding: '20rpx', marginBottom: '20rpx' }}>
                  <Text style={{ fontSize: '22rpx', color: '#d46b08', display: 'block', marginBottom: '6rpx' }}>驱动问题：</Text>
                  <Text style={{ fontSize: '26rpx', color: '#333', fontWeight: 500 }}>{camp.driving_question}</Text>
                </View>
              )}

              {/* 学习目标 */}
              {camp.learning_objectives && (() => {
                try {
                  const objs = JSON.parse(camp.learning_objectives);
                  if (objs.length === 0) return null;
                  return (
                    <View style={{ marginBottom: '20rpx' }}>
                      <Text style={{ fontSize: '26rpx', fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: '12rpx' }}>
                        学习目标
                      </Text>
                      {objs.map((obj: string, i: number) => (
                        <View key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12rpx', marginBottom: '8rpx' }}>
                          <View style={{ width: '36rpx', height: '36rpx', borderRadius: '50%', backgroundColor: '#e6f4ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Text style={{ fontSize: '22rpx', color: '#1677ff' }}>{i + 1}</Text>
                          </View>
                          <Text style={{ fontSize: '24rpx', color: '#555', lineHeight: '36rpx', flex: 1 }}>{obj}</Text>
                        </View>
                      ))}
                    </View>
                  );
                } catch { return null; }
              })()}

              {/* 技能清单 */}
              {camp.skills_list && (() => {
                try {
                  const skills = JSON.parse(camp.skills_list);
                  if (skills.length === 0) return null;
                  return (
                    <View style={{ marginBottom: '20rpx' }}>
                      <Text style={{ fontSize: '26rpx', fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: '12rpx' }}>
                        技能清单
                      </Text>
                      <View style={{ display: 'flex', gap: '10rpx', flexWrap: 'wrap' }}>
                        {skills.map((skill: string, i: number) => (
                          <View key={i} style={{ fontSize: '22rpx', padding: '6rpx 16rpx', borderRadius: '20rpx',
                            backgroundColor: '#f9f0ff', color: '#722ed1',
                          }}>
                            {skill}
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                } catch { return null; }
              })()}

              {/* 预期成果 */}
              {camp.expected_outcomes && (
                <View style={{ marginBottom: '20rpx' }}>
                  <Text style={{ fontSize: '26rpx', fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: '12rpx' }}>
                    预期成果
                  </Text>
                  <View style={{ backgroundColor: '#f6ffed', borderRadius: '12rpx', padding: '20rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#333', lineHeight: '38rpx' }}>{camp.expected_outcomes}</Text>
                  </View>
                </View>
              )}

              {/* 任务拆解时间线 */}
              {camp.tasks_json && (() => {
                try {
                  const taskList = JSON.parse(camp.tasks_json);
                  if (taskList.length === 0) return null;
                  return (
                    <View>
                      <Text style={{ fontSize: '26rpx', fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: '12rpx' }}>
                        任务拆解
                      </Text>
                      {taskList.map((task: any, i: number) => (
                        <View key={i} style={{ display: 'flex', marginBottom: i < taskList.length - 1 ? '0' : '0' }}>
                          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '16rpx' }}>
                            <View style={{ width: '16rpx', height: '16rpx', borderRadius: '50%', backgroundColor: '#1677ff', marginTop: '6rpx' }} />
                            {i < taskList.length - 1 && (
                              <View style={{ width: '2rpx', flex: 1, backgroundColor: '#e8e8e8', marginTop: '4rpx' }} />
                            )}
                          </View>
                          <View style={{ flex: 1, paddingBottom: '16rpx' }}>
                            <View style={{ display: 'flex', alignItems: 'center', gap: '8rpx', marginBottom: '4rpx' }}>
                              <Text style={{ fontSize: '26rpx', fontWeight: 500, color: '#1a1a1a' }}>{task.title}</Text>
                              <Text style={{ fontSize: '20rpx', color: '#8c8c8c' }}>{task.duration_hours}小时</Text>
                            </View>
                            {task.description && (
                              <Text style={{ fontSize: '22rpx', color: '#8c8c8c', lineHeight: '32rpx' }}>{task.description}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                } catch { return null; }
              })()}
            </View>
          )}
        </View>
      )}

      {/* 任务列表 */}
      <View style={{ backgroundColor: '#fff', padding: '32rpx', marginBottom: '16rpx' }}>
        <Text style={{ fontSize: '30rpx', fontWeight: 600, display: 'block', marginBottom: '16rpx' }}>
          任务列表 ({tasks.length})
        </Text>
        {tasks.length === 0 ? (
          <EmptyState icon="T" text="暂无任务" />
        ) : (
          tasks.map((task: any) => (
            <View key={task.id} onClick={() => {
              if (enrolled) {
                Taro.navigateTo({ url: `/pages/submit/index?taskId=${task.id}&campId=${id}` });
              } else {
                Taro.showToast({ title: '请先报名营地', icon: 'none' });
              }
            }}>
              <TaskCard
                task={task}
                showSubmissionStatus={true}
              />
            </View>
          ))
        )}
      </View>

      <View style={{ height: '40rpx' }} />
    </ScrollView>
  );
}