import { useState, useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { pblAPI } from '../../services/api';
import './index.css';

const phaseLabels: Record<string, string> = {
  inquiry: '启动探究', research: '深入调研', creation: '创作实践',
  revision: '反馈修订', showcase: '成果展示',
};
const phaseIcons: Record<string, string> = {
  inquiry: '?', research: 'R', creation: 'C', revision: 'F', showcase: 'S',
};
const phaseColors: Record<string, string> = {
  inquiry: '#ff7a45', research: '#1677ff', creation: '#52c41a',
  revision: '#722ed1', showcase: '#fa8c16',
};

export default function WorkspaceIndex() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campId, setCampId] = useState<number | null>(null);

  useDidShow(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const cid = params?.campId ? Number(params.campId) : null;
    if (cid) {
      setCampId(cid);
      loadWorkspace(cid);
    } else {
      loadMyWorkspaces();
    }
  });

  const loadWorkspace = async (cid: number) => {
    setLoading(true);
    try {
      const res: any = await pblAPI.getWorkspace(cid);
      if (res.code === 0) setWorkspace(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadMyWorkspaces = async () => {
    setLoading(true);
    try {
      const res: any = await pblAPI.getMyWorkspaces();
      if (res.code === 0 && res.data.length > 0) {
        setWorkspace(res.data[0]);
        setCampId(res.data[0].camp_id);
        loadWorkspace(res.data[0].camp_id);
        return;
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handlePhaseChange = async (phase: string) => {
    try {
      await pblAPI.updatePhase(workspace.workspace?.id || workspace.id, phase);
      loadWorkspace(campId!);
    } catch { Taro.showToast({ title: '切换失败', icon: 'none' }); }
  };

  const navigateTo = (path: string) => {
    Taro.navigateTo({ url: `${path}?campId=${campId}&workspaceId=${workspace?.workspace?.id || workspace?.id}` });
  };

  if (loading) {
    return (
      <View className="container">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  if (!workspace) {
    return (
      <View className="container">
        <View className="empty-state">
          <Text className="empty-icon">[ ]</Text>
          <Text className="empty-text">还没有项目工作台</Text>
          <Text className="empty-hint">请先报名一个营期，然后进入工作台开始项目制学习</Text>
        </View>
      </View>
    );
  }

  const ws = workspace.workspace || workspace;
  const camp = workspace.camp;
  const template = workspace.template;
  const stats = workspace.stats;
  const activities = workspace.activities || [];

  return (
    <View className="container">
      {/* 项目头部 */}
      <View className="project-header">
        <Text className="project-name">{camp?.name || '项目工作台'}</Text>
        {template?.driving_question && (
          <View className="driving-question">
            <Text className="dq-label">驱动性问题</Text>
            <Text className="dq-text">{template.driving_question}</Text>
          </View>
        )}
      </View>

      {/* 阶段进度条 */}
      <View className="phase-tracker">
        {['inquiry', 'research', 'creation', 'revision', 'showcase'].map((phase, i) => {
          const isActive = ws.current_phase === phase;
          const isPast = ['inquiry', 'research', 'creation', 'revision', 'showcase'].indexOf(ws.current_phase) >
            ['inquiry', 'research', 'creation', 'revision', 'showcase'].indexOf(phase);
          return (
            <View key={phase} className={`phase-node ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
              onClick={() => handlePhaseChange(phase)}>
              <View className="phase-dot" style={{ backgroundColor: isActive || isPast ? phaseColors[phase] : '#d9d9d9' }}>
                <Text className="phase-icon">{isPast ? 'V' : phaseIcons[phase]}</Text>
              </View>
              <Text className="phase-label" style={{ color: isActive ? phaseColors[phase] : '#8c8c8c' }}>
                {phaseLabels[phase]}
              </Text>
              {i < 4 && <View className="phase-line" style={{ backgroundColor: isPast ? phaseColors[phase] : '#e8e8e8' }} />}
            </View>
          );
        })}
      </View>

      {/* 快捷入口 */}
      <View className="quick-actions">
        <View className="action-card" onClick={() => navigateTo('/pages/workspace/inquiry')}>
          <View className="action-icon" style={{ backgroundColor: '#e6f4ff' }}>
            <Text style={{ color: '#1677ff', fontSize: '20px' }}>K</Text>
          </View>
          <Text className="action-text">探究板</Text>
          <Text className="action-desc">KWL + 研究笔记 + 问题板</Text>
        </View>
        <View className="action-card" onClick={() => navigateTo('/pages/workspace/reflection')}>
          <View className="action-icon" style={{ backgroundColor: '#f6ffed' }}>
            <Text style={{ color: '#52c41a', fontSize: '20px' }}>R</Text>
          </View>
          <Text className="action-text">反思日志</Text>
          <Text className="action-desc">阶段反思 + 自我评估</Text>
        </View>
        <View className="action-card" onClick={() => navigateTo('/pages/workspace/critique')}>
          <View className="action-icon" style={{ backgroundColor: '#f9f0ff' }}>
            <Text style={{ color: '#722ed1', fontSize: '20px' }}>F</Text>
          </View>
          <Text className="action-text">反馈修订</Text>
          <Text className="action-desc">多轮反馈 + 持续改进</Text>
        </View>
        {workspace.group && (
          <View className="action-card" onClick={() => navigateTo('/pages/workspace/group')}>
            <View className="action-icon" style={{ backgroundColor: '#fff7e6' }}>
              <Text style={{ color: '#fa8c16', fontSize: '20px' }}>G</Text>
            </View>
            <Text className="action-text">小组协作</Text>
            <Text className="action-desc">讨论 + 任务分配</Text>
          </View>
        )}
      </View>

      {/* 任务进度 */}
      <View className="section">
        <Text className="section-title">任务进度 ({stats?.completedTasks || 0}/{stats?.totalTasks || 0})</Text>
        <View className="progress-bar-bg">
          <View className="progress-bar-fill" style={{
            width: `${stats?.totalTasks > 0 ? ((stats?.completedTasks || 0) / stats.totalTasks) * 100 : 0}%`,
            backgroundColor: '#1677ff',
          }} />
        </View>
        {(workspace.tasks || []).slice(0, 5).map((task: any) => (
          <View key={task.id} className="task-item">
            <View className="task-left">
              <View className={`task-status-dot ${task.submission?.status === 'reviewed' ? 'done' : task.submission ? 'submitted' : 'pending'}`} />
              <Text className="task-title">{task.title}</Text>
            </View>
            <Text className="task-deadline">{task.deadline || ''}</Text>
          </View>
        ))}
        {(workspace.tasks || []).length > 5 && (
          <View className="view-more">
            <Text style={{ color: '#1677ff', fontSize: '13px' }}>查看全部 {workspace.tasks.length} 个任务</Text>
          </View>
        )}
      </View>

      {/* 动态日志 */}
      <View className="section">
        <Text className="section-title">项目动态</Text>
        {activities.length === 0 ? (
          <Text className="empty-hint" style={{ padding: '16px', display: 'block' }}>暂无动态</Text>
        ) : (
          activities.map((act: any) => (
            <View key={act.id} className="activity-item">
              <View className="activity-dot" />
              <View className="activity-content">
                <Text className="activity-desc">{act.description}</Text>
                <Text className="activity-meta">{act.real_name} - {act.created_at}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 成果展示入口 */}
      <View className="showcase-entry" onClick={() => navigateTo('/pages/showcase/index')}>
        <Text className="showcase-text">查看成果展示广场</Text>
        <Text className="showcase-arrow">&gt;</Text>
      </View>
    </View>
  );
}