import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Typography, Modal, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { submissionAPI } from '../../services/api';

const { TextArea } = Input;
const { Paragraph } = Typography;

interface TaskSubmitProps {
  taskId: number;
  requirements: string;
  user: any;
  onSubmitted: () => void;
}

export default function TaskSubmit({ taskId, requirements, user, onSubmitted }: TaskSubmitProps) {
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    if (!content.trim()) {
      message.warning('请输入提交内容');
      return;
    }
    Modal.confirm({
      title: '确认提交作品',
      content: (
        <div style={{ maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap', color: '#595959', fontSize: 13 }}>
          {content.trim()}
        </div>
      ),
      okText: '确认提交',
      cancelText: '再改改',
      onOk: async () => {
        setSubmitting(true);
        try {
          const res: any = await submissionAPI.submit(taskId, { content: content.trim() });
          if (res.code === 0) {
            message.success('提交成功');
            setShowSubmit(false);
            setContent('');
            onSubmitted();
          }
        } catch { message.error('提交失败'); }
        setSubmitting(false);
      },
    });
  };

  return (
    <div>
      {requirements && (
        <Card
          title={<span style={{ fontSize: 16, fontWeight: 600 }}>任务要求</span>}
          style={{ marginBottom: 24, borderRadius: 12 }}
        >
          <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 14, lineHeight: 1.8 }}>
            {requirements}
          </Paragraph>
        </Card>
      )}

      {/* 提交区 */}
      {user ? (
        showSubmit ? (
          <Card title={<span style={{ fontSize: 16, fontWeight: 600 }}>提交作品</span>} style={{ borderRadius: 12 }}>
            <TextArea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入你的作品内容、实验记录、代码链接、文档地址等..."
              style={{ marginBottom: 16, fontSize: 14 }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button size="large" onClick={() => setShowSubmit(false)}>取消</Button>
              <Button type="primary" size="large" loading={submitting} onClick={handleSubmit} icon={<UploadOutlined />}>
                提交作品
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{
            textAlign: 'center', padding: 48, background: '#fafafa', borderRadius: 12,
          }}>
            <UploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <p style={{ fontSize: 16, color: '#595959', marginBottom: 20 }}>
              完成学习后，上传你的作品吧！
            </p>
            <Button type="primary" size="large" onClick={() => setShowSubmit(true)} icon={<UploadOutlined />}>
              提交作品
            </Button>
          </div>
        )
      ) : (
        <div style={{
          textAlign: 'center', padding: 48, background: '#fafafa', borderRadius: 12,
        }}>
          <p style={{ color: '#8c8c8c', fontSize: 15, marginBottom: 16 }}>登录后即可提交作品</p>
          <Button type="primary" size="large" onClick={() => navigate('/login')}>去登录</Button>
        </div>
      )}
    </div>
  );
}