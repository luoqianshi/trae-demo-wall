import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Textarea } from '@tarojs/components';
import { pblAPI } from '../../services/api';
import './index.css';

const roundStatusLabels: Record<string, string> = {
  pending: '待反馈', critiqued: '已反馈', revised: '已修订', approved: '已通过',
};

export default function Critique() {
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [activeRound, setActiveRound] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [showReviseForm, setShowReviseForm] = useState(false);
  const [reviseContent, setReviseContent] = useState('');
  const [reviseNotes, setReviseNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const cid = params?.campId ? Number(params.campId) : null;
    if (cid) loadWorkspace(cid);
  }, []);

  const loadWorkspace = async (cid: number) => {
    try {
      const res: any = await pblAPI.getWorkspace(cid);
      if (res.code === 0) {
        const ws = res.data.workspace || res.data;
        setWorkspaceId(ws.id);
        // 找到第一个有提交的任务
        const tasks = res.data.tasks || [];
        const submittedTask = tasks.find((t: any) => t.submission?.id);
        if (submittedTask) {
          loadCritiqueRounds(submittedTask.submission.id);
        }
      }
    } catch { /* ignore */ }
  };

  const loadCritiqueRounds = async (submissionId: number) => {
    setLoading(true);
    try {
      const res: any = await pblAPI.getCritiqueRounds(submissionId);
      if (res.code === 0) {
        setRounds(res.data || []);
        if (res.data.length > 0) {
          loadRoundDetail(res.data[0].id);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadRoundDetail = async (roundId: number) => {
    try {
      const res: any = await pblAPI.getCritiqueRound(roundId);
      if (res.code === 0) {
        setActiveRound(res.data);
        setFeedbacks(res.data.feedbacks || []);
        setRevisions(res.data.revisions || []);
      }
    } catch { /* ignore */ }
  };

  const handleSubmitRevision = async () => {
    if (!activeRound || !reviseContent.trim()) {
      Taro.showToast({ title: '请输入修订内容', icon: 'none' });
      return;
    }
    try {
      await pblAPI.submitRevision(activeRound.id, {
        content: reviseContent,
        revision_notes: reviseNotes,
      });
      Taro.showToast({ title: '修订已提交', icon: 'success' });
      setShowReviseForm(false);
      setReviseContent('');
      setReviseNotes('');
      loadRoundDetail(activeRound.id);
    } catch { Taro.showToast({ title: '提交失败', icon: 'none' }); }
  };

  return (
    <View className="container">
      <Text className="page-title">反馈修订</Text>

      {rounds.length === 0 ? (
        <View className="card">
          <Text className="empty-hint">还没有反馈轮次</Text>
          <Text className="empty-hint" style={{ fontSize: '12px' }}>
            提交作品后，老师会发起反馈修订轮次，帮助你持续改进
          </Text>
        </View>
      ) : (
        <>
          {/* 轮次选择 */}
          <View className="round-tabs">
            {rounds.map((r: any) => (
              <View key={r.id} className={`round-tab ${activeRound?.id === r.id ? 'active' : ''}`}
                onClick={() => loadRoundDetail(r.id)}>
                <Text>第{r.round_number}轮</Text>
                <View className={`round-status ${r.status}`}>
                  <Text>{roundStatusLabels[r.status] || r.status}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* 反馈内容 */}
          {feedbacks.length > 0 && (
            <View className="card">
              <Text className="card-title">收到的反馈</Text>
              {feedbacks.map((fb: any) => (
                <View key={fb.id} className="feedback-item">
                  <View className="feedback-header">
                    <Text className="feedback-type">{fb.feedback_type === 'teacher' ? '教师反馈' : fb.feedback_type === 'peer' ? '同伴反馈' : fb.feedback_type === 'self' ? '自我评估' : '企业反馈'}</Text>
                    <Text className="feedback-reviewer">{fb.reviewer_name}</Text>
                  </View>
                  {fb.warm_feedback && (
                    <View className="feedback-warm">
                      <Text className="fb-label">做得好的：</Text>
                      <Text>{fb.warm_feedback}</Text>
                    </View>
                  )}
                  {fb.cool_feedback && (
                    <View className="feedback-cool">
                      <Text className="fb-label">可以改进的：</Text>
                      <Text>{fb.cool_feedback}</Text>
                    </View>
                  )}
                  {fb.specific_suggestions && (
                    <View className="feedback-suggestions">
                      <Text className="fb-label">具体建议：</Text>
                      <Text>{fb.specific_suggestions}</Text>
                    </View>
                  )}
                  <Text className="feedback-meta">{fb.created_at}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 修订记录 */}
          {revisions.length > 0 && (
            <View className="card">
              <Text className="card-title">我的修订</Text>
              {revisions.map((rev: any) => (
                <View key={rev.id} className="revision-item">
                  <Text className="revision-content">{rev.content}</Text>
                  {rev.revision_notes && (
                    <Text className="revision-notes">修改说明：{rev.revision_notes}</Text>
                  )}
                  <Text className="revision-meta">{rev.submitted_at}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 提交修订 */}
          {(activeRound?.status === 'critiqued' || activeRound?.status === 'pending') && (
            <View className="card">
              {!showReviseForm ? (
                <View className="btn-primary" onClick={() => setShowReviseForm(true)}>
                  <Text className="btn-text">提交修订</Text>
                </View>
              ) : (
                <>
                  <Text className="card-title" style={{ marginBottom: 12 }}>提交修订</Text>
                  <Textarea className="revise-textarea" value={reviseContent}
                    onInput={(e) => setReviseContent((e as any).detail.value)}
                    placeholder="根据反馈修改你的作品..." />
                  <Textarea className="revise-textarea" style={{ minHeight: 60, marginTop: 8 }}
                    value={reviseNotes}
                    onInput={(e) => setReviseNotes((e as any).detail.value)}
                    placeholder="修改说明（可选）" />
                  <View className="btn-primary" onClick={handleSubmitRevision}>
                    <Text className="btn-text">提交修订</Text>
                  </View>
                  <View className="btn-cancel" onClick={() => setShowReviseForm(false)}>
                    <Text className="btn-cancel-text">取消</Text>
                  </View>
                </>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}