import type { ProjectMeta, ToolName, TaskStatus } from '../types';

interface ProjectFormProps {
  project: ProjectMeta;
  onChange: (project: ProjectMeta) => void;
}

const tools: ToolName[] = ['TRAE', 'Codex', 'Claude Code', 'Cursor', 'Qoder', 'Other'];
const statuses: { value: TaskStatus; label: string }[] = [
  { value: 'success', label: '成功' },
  { value: 'partial', label: '部分成功' },
  { value: 'failed', label: '失败' },
  { value: 'blocked', label: '阻塞' },
];

export function ProjectForm({ project, onChange }: ProjectFormProps) {
  const update = (field: keyof ProjectMeta, value: string | number) => {
    onChange({ ...project, [field]: value });
  };

  return (
    <div className="card">
      <h3 className="card-title">📋 项目信息</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>项目名称</label>
          <input
            type="text"
            value={project.projectName}
            onChange={e => update('projectName', e.target.value)}
            placeholder="例如：DocPilot 文档助手"
          />
        </div>
        <div className="form-group">
          <label>任务目标</label>
          <input
            type="text"
            value={project.taskGoal}
            onChange={e => update('taskGoal', e.target.value)}
            placeholder="描述本次 AI 任务的目标"
          />
        </div>
        <div className="form-group">
          <label>使用工具</label>
          <select
            value={project.tool}
            onChange={e => update('tool', e.target.value as ToolName)}
          >
            {tools.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>模型名称</label>
          <input
            type="text"
            value={project.modelName}
            onChange={e => update('modelName', e.target.value)}
            placeholder="例如：Claude 3.5 Sonnet"
          />
        </div>
        <div className="form-group">
          <label>开始时间</label>
          <input
            type="datetime-local"
            value={project.startTime.replace(' ', 'T')}
            onChange={e => update('startTime', e.target.value.replace('T', ' '))}
          />
        </div>
        <div className="form-group">
          <label>结束时间</label>
          <input
            type="datetime-local"
            value={project.endTime.replace(' ', 'T')}
            onChange={e => update('endTime', e.target.value.replace('T', ' '))}
          />
        </div>
        <div className="form-group">
          <label>耗时（分钟）</label>
          <input
            type="number"
            min="0"
            value={project.durationMinutes}
            onChange={e => update('durationMinutes', Number(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>任务状态</label>
          <select
            value={project.status}
            onChange={e => update('status', e.target.value as TaskStatus)}
          >
            {statuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
