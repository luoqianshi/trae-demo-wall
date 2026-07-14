import { Card, Button, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TaskVideoProps {
  aiVideo: string;
  externalVideo: string;
  coverImage: string;
}

export default function TaskVideo({ aiVideo, externalVideo, coverImage }: TaskVideoProps) {
  return (
    <Card
      title={<span style={{ fontSize: 16, fontWeight: 600 }}>教学视频</span>}
      style={{ marginBottom: 16, borderRadius: 12 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {aiVideo ? (
          <video
            controls
            style={{ width: '100%', borderRadius: 8, background: '#000' }}
            poster={coverImage || undefined}
          >
            <source src={aiVideo} type="video/mp4" />
            您的浏览器不支持视频播放
          </video>
        ) : null}

        {externalVideo ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', background: '#e6f7ff',
            borderRadius: 8, border: '1px solid #91d5ff',
          }}>
            <PlayCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: 14 }}>推荐观看：B站教学视频</Text>
              <br />
              <Text style={{ fontSize: 12, color: '#666' }}>
                点击前往B站观看实验完整教程（含讲解+演示）
              </Text>
            </div>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => window.open(externalVideo, '_blank')}
            >
              观看
            </Button>
          </div>
        ) : null}

        {!aiVideo && !externalVideo && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: 24, color: '#bbb', fontSize: 13,
          }}>
            <PlayCircleOutlined style={{ fontSize: 18, opacity: 0.4 }} />
            <Text style={{ color: '#bbb', fontSize: 13 }}>暂无视频教程，请参考右侧步骤学习</Text>
          </div>
        )}
      </div>
    </Card>
  );
}