import { Card, Empty } from 'antd';

interface Step {
  step: number;
  title: string;
  content: string;
}

interface TaskStepsProps {
  steps: Step[];
  progress: any;
  user: any;
  onStepClick: (stepNum: number) => void;
}

export default function TaskSteps({ steps, progress, user, onStepClick }: TaskStepsProps) {
  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>学习步骤 ({steps.length}步)</span>
          {progress && (
            <span style={{ fontSize: 12, color: progress.completed ? '#52c41a' : '#1890ff' }}>
              {progress.completed ? '已完成' : `已完成 ${progress.current_step}/${progress.total_steps} 步`}
            </span>
          )}
        </div>
      }
      style={{ borderRadius: 12, position: 'sticky', top: 16 }}
      size="small"
    >
      {steps.length > 0 ? (
        <div style={{ position: 'relative', paddingLeft: 2 }}>
          {/* 时间轴竖线 */}
          <div style={{
            position: 'absolute', left: 9, top: 6, bottom: 6,
            width: 2, background: '#e8e8e8',
          }} />
          {steps.map((step: any, idx: number) => {
            const stepNum = step.step || (idx + 1);
            const isActive = progress && progress.current_step >= stepNum;
            return (
              <div
                key={idx}
                onClick={() => onStepClick(stepNum)}
                style={{
                  position: 'relative', paddingLeft: 28, marginBottom: idx < steps.length - 1 ? 12 : 0,
                  cursor: user ? 'pointer' : 'default', opacity: isActive ? 1 : 0.7,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* 步骤圆点 */}
                <div style={{
                  position: 'absolute', left: 0, top: 2,
                  width: 20, height: 20, borderRadius: '50%',
                  background: isActive ? '#52c41a' : '#1890ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 11,
                  border: '2px solid #fff',
                  boxShadow: `0 0 0 1px ${isActive ? '#52c41a' : '#1890ff'}`,
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}>
                  {isActive ? '✓' : stepNum}
                </div>
                {/* 步骤内容 */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#52c41a' : '#262626', lineHeight: 1.4, marginBottom: 2 }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {step.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty description="暂无步骤" style={{ padding: '20px 0' }} />
      )}
    </Card>
  );
}