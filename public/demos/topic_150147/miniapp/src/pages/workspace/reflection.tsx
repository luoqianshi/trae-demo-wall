import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Textarea, InputNumber } from '@tarojs/components';
import { pblAPI } from '../../services/api';
import './index.css';

const phaseLabels: Record<string, string> = {
  inquiry: '启动探究', research: '深入调研', creation: '创作实践',
  revision: '反馈修订', showcase: '成果展示',
};

export default function Reflection() {
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState('inquiry');
  const [prompts, setPrompts] = useState<any[]>([]);
  const [reflections, setReflections] = useState<any[]>([]);
  const [activePrompt, setActivePrompt] = useState<any>(null);
  const [content, setContent] = useState('');
  const [score, setScore] = useState<number | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
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
        setCurrentPhase(ws.current_phase || 'inquiry');
        loadPrompts(ws.id);
        loadReflections(ws.id);
      }
    } catch { /* ignore */ }
  };

  const loadPrompts = async (wid: number) => {
    try {
      const res: any = await pblAPI.getReflectionPrompts(wid);
      if (res.code === 0) setPrompts(res.data.prompts || []);
    } catch { /* ignore */ }
  };

  const loadReflections = async (wid: number) => {
    setLoading(true);
    try {
      const res: any = await pblAPI.getReflections(wid);
      if (res.code === 0) setReflections(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleStartReflection = (prompt?: any) => {
    setActivePrompt(prompt || null);
    setContent('');
    setScore(undefined);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!workspaceId || !content.trim()) {
      Taro.showToast({ title: '请输入反思内容', icon: 'none' });
      return;
    }
    try {
      await pblAPI.createReflection(workspaceId, {
        phase: currentPhase,
        prompt: activePrompt?.prompt || '',
        content,
        self_assessment_score: score,
      });
      Taro.showToast({ title: '反思已保存', icon: 'success' });
      setShowForm(false);
      loadReflections(workspaceId);
    } catch { Taro.showToast({ title: '保存失败', icon: 'none' }); }
  };

  return (
    <View className="container">
      <Text className="page-title">反思日志</Text>

      {/* 当前阶段 */}
      <View className="phase-badge">
        <Text>当前阶段：{phaseLabels[currentPhase] || currentPhase}</Text>
      </View>

      {/* 反思提示 */}
      <View className="card">
        <View className="card-header flex-between">
          <Text className="card-title">反思提示</Text>
          <View className="btn-small" onClick={() => handleStartReflection()}>
            <Text className="btn-small-text">自由反思</Text>
          </View>
        </View>
        {prompts.length === 0 ? (
          <Text className="empty-hint">暂无反思提示</Text>
        ) : (
          prompts.map((p: any) => (
            <View key={p.id} className="prompt-item" onClick={() => handleStartReflection(p)}>
              <Text className="prompt-text">{p.prompt}</Text>
              <Text className="prompt-arrow">&gt;</Text>
            </View>
          ))
        )}
      </View>

      {/* 反思表单 */}
      {showForm && (
        <View className="card">
          <Text className="card-title" style={{ marginBottom: 12 }}>
            {activePrompt?.prompt || '自由反思'}
          </Text>
          <Textarea className="reflection-textarea" value={content}
            onInput={(e) => setContent((e as any).detail.value)}
            placeholder="写下你的反思..." />
          <View className="score-row">
            <Text className="score-label">自我评分 (1-10)：</Text>
            <InputNumber className="score-input" min={1} max={10} value={score}
              onChange={(v) => setScore(v as number)} />
          </View>
          <View className="btn-primary" onClick={handleSubmit}>
            <Text className="btn-text">保存反思</Text>
          </View>
          <View className="btn-cancel" onClick={() => setShowForm(false)}>
            <Text className="btn-cancel-text">取消</Text>
          </View>
        </View>
      )}

      {/* 反思历史 */}
      <View className="card">
        <Text className="card-title">反思历史 ({reflections.length})</Text>
        {reflections.length === 0 ? (
          <Text className="empty-hint">还没有反思记录</Text>
        ) : (
          reflections.map((r: any) => (
            <View key={r.id} className="reflection-item">
              <View className="reflection-header">
                <Text className="reflection-phase">{phaseLabels[r.phase] || r.phase}</Text>
                {r.self_assessment_score && (
                  <Text className="reflection-score">{r.self_assessment_score}/10</Text>
                )}
              </View>
              {r.prompt && <Text className="reflection-prompt">{r.prompt}</Text>}
              <Text className="reflection-content">{r.content}</Text>
              <Text className="reflection-meta">{r.created_at}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}