import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { crossLevelAPI } from '../../services/api';

const statusLabels: Record<string, string> = {
  pending: '待接受', accepted: '已接受', in_progress: '进行中',
  submitted: '已提交', reviewed: '已审核', rejected: '已拒绝',
};
const statusColors: Record<string, string> = {
  pending: '#fa8c16', accepted: '#1677ff', in_progress: '#722ed1',
  submitted: '#13c2c2', reviewed: '#52c41a', rejected: '#ff4d4f',
};

export default function CrossTaskDetail() {
  const router = useRouter();
  const { assignmentId } = router.params;
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitContent, setSubmitContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  useEffect(() => {
    if (assignmentId) loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    setLoading(true);
    try {
      // 从my-assignments中找到匹配的assignment
      const res: any = await crossLevelAPI.getMyAssignments();
      if (res.code === 0) {
        const list = res.data?.list || res.data || [];
        const found = list.find((a: any) => String(a.id) === String(assignmentId));
        if (found) {
          setAssignment(found);
          // 加载该模块的提交记录
          loadSubmissions(found.module_id || found.moduleId);
        }
      }
    } catch (err: any) {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    }
    setLoading(false);
  };

  const loadSubmissions = async (moduleId: number) => {
    try {
      const res: any = await crossLevelAPI.getAssignments(moduleId);
      if (res.code === 0) {
        setSubmissions(res.data?.list || res.data || []);
      }
    } catch { /* 静默处理 */ }
  };

  const handleAccept = async () => {
    try {
      await crossLevelAPI.respond(Number(assignmentId), { action: 'accept' });
      Taro.showToast({ title: '已接受任务', icon: 'success' });
      setAssignment((prev: any) => ({ ...prev, status: 'accepted' }));
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const handleReject = async () => {
    Taro.showModal({
      title: '拒绝任务',
      content: '确认拒绝此跨学段任务？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await crossLevelAPI.respond(Number(assignmentId), { action: 'reject' });
            Taro.showToast({ title: '已拒绝任务', icon: 'success' });
            setAssignment((prev: any) => ({ ...prev, status: 'rejected' }));
          } catch {
            Taro.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (!submitContent.trim()) {
      Taro.showToast({ title: '请输入提交内容', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      await crossLevelAPI.submit(Number(assignmentId), { content: submitContent });
      Taro.showToast({ title: '提交成功', icon: 'success' });
      setSubmitContent('');
      setShowSubmit(false);
      loadAssignment();
    } catch {
      Taro.showToast({ title: '提交失败', icon: 'none' });
    }
    setSubmitting(false);
  };

  if (!assignment && !loading) {
    return (
      <View style={{ textAlign: 'center', padding: '80px 0', color: '#8c8c8c' }}>
        <Text style={{ display: 'block', fontSize: '16px' }}>任务不存在</Text>
      </View>
    );
  }

  return (
    <ScrollView scrollY style={{ height: '100vh' }} refresherEnabled onRefresherRefresh={loadAssignment}>
      <View style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {assignment && (
          <>
            {/* 任务基本信息 */}
            <View style={{
              backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
              marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', flex: 1 }}>
                  {assignment.title || assignment.task_title || '跨学段任务'}
                </Text>
                <View style={{
                  padding: '3px 10px', borderRadius: '4px', fontSize: '12px',
                  backgroundColor: (statusColors[assignment.status] || '#8c8c8c') + '18',
                  color: statusColors[assignment.status] || '#8c8c8c',
                  marginLeft: '8px',
                }}>
                  {statusLabels[assignment.status] || assignment.status}
                </View>
              </View>

              {assignment.description && (
                <Text style={{ fontSize: '14px', color: '#555', lineHeight: '22px', display: 'block', marginBottom: '12px' }}>
                  {assignment.description}
                </Text>
              )}

              {/* 任务信息 */}
              <View style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#8c8c8c' }}>
                {assignment.module_name && (
                  <Text>所属模块: {assignment.module_name}</Text>
                )}
                {assignment.target_grade && (
                  <Text>目标学段: {assignment.target_grade}</Text>
                )}
                {assignment.deadline && (
                  <Text style={{ color: '#ff4d4f' }}>截止日期: {assignment.deadline}</Text>
                )}
                {assignment.assigned_at && (
                  <Text>分配时间: {assignment.assigned_at}</Text>
                )}
              </View>
            </View>

            {/* 操作按钮 */}
            {assignment.status === 'pending' && (
              <View style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <View onClick={handleAccept} style={{
                  flex: 1, textAlign: 'center', padding: '12px', borderRadius: '8px',
                  backgroundColor: '#1677ff',
                }}>
                  <Text style={{ color: '#fff', fontSize: '15px' }}>接受任务</Text>
                </View>
                <View onClick={handleReject} style={{
                  flex: 1, textAlign: 'center', padding: '12px', borderRadius: '8px',
                  backgroundColor: '#ff4d4f',
                }}>
                  <Text style={{ color: '#fff', fontSize: '15px' }}>拒绝任务</Text>
                </View>
              </View>
            )}

            {/* 提交区域 */}
            {(assignment.status === 'accepted' || assignment.status === 'in_progress') && (
              <View style={{ marginBottom: '16px' }}>
                {!showSubmit ? (
                  <View onClick={() => setShowSubmit(true)} style={{
                    textAlign: 'center', padding: '12px', borderRadius: '8px',
                    backgroundColor: '#1677ff',
                  }}>
                    <Text style={{ color: '#fff', fontSize: '15px' }}>提交成果</Text>
                  </View>
                ) : (
                  <View style={{
                    backgroundColor: '#fff', borderRadius: '12px', padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <Textarea
                      style={{
                        width: '100%', minHeight: '120px', border: '1px solid #d9d9d9',
                        borderRadius: '8px', padding: '12px', fontSize: '14px',
                        marginBottom: '12px',
                      }}
                      placeholder="请输入提交内容..."
                      value={submitContent}
                      onInput={(e) => setSubmitContent(e.detail.value)}
                    />
                    <View style={{ display: 'flex', gap: '8px' }}>
                      <View onClick={handleSubmit} style={{
                        flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px',
                        backgroundColor: '#1677ff',
                      }}>
                        <Text style={{ color: '#fff', fontSize: '14px' }}>
                          {submitting ? '提交中...' : '提交'}
                        </Text>
                      </View>
                      <View onClick={() => setShowSubmit(false)} style={{
                        flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px',
                        backgroundColor: '#f5f5f5',
                      }}>
                        <Text style={{ color: '#666', fontSize: '14px' }}>取消</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* 已提交/已审核状态 */}
            {assignment.status === 'submitted' && (
              <View style={{
                backgroundColor: '#e6f7ff', borderRadius: '12px', padding: '16px',
                marginBottom: '16px', textAlign: 'center',
              }}>
                <Text style={{ fontSize: '15px', color: '#1677ff', display: 'block' }}>
                  已提交，等待审核
                </Text>
              </View>
            )}

            {assignment.status === 'reviewed' && (
              <View style={{
                backgroundColor: '#f6ffed', borderRadius: '12px', padding: '16px',
                marginBottom: '16px',
              }}>
                <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#52c41a', display: 'block', marginBottom: '8px' }}>
                  已审核通过
                </Text>
                {assignment.score !== undefined && (
                  <Text style={{ fontSize: '14px', color: '#333', display: 'block' }}>
                    得分: {assignment.score} 分
                  </Text>
                )}
                {assignment.feedback && (
                  <Text style={{ fontSize: '13px', color: '#666', display: 'block', marginTop: '6px' }}>
                    评语: {assignment.feedback}
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}