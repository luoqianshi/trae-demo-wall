import { Card, Typography, Collapse } from 'antd';
import { BulbOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

interface TaskPrincipleProps {
  summary: string;
  detail: string;
}

export default function TaskPrinciple({ summary, detail }: TaskPrincipleProps) {
  if (!summary) return null;

  return (
    <Card
      style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #ffe58f' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BulbOutlined style={{ fontSize: 18, color: '#faad14' }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>科学原理</span>
        </div>
      }
    >
      {/* 核心原理总结 */}
      <div style={{
        background: 'linear-gradient(135deg, #fffbe6, #fff7e6)',
        borderRadius: 8,
        padding: '16px 20px',
        border: '1px solid #ffe58f',
        marginBottom: detail ? 16 : 0,
      }}>
        <Paragraph style={{
          margin: 0, fontSize: 15, lineHeight: 2.2,
          color: '#434343', whiteSpace: 'pre-wrap',
        }}>
          {summary}
        </Paragraph>
      </div>

      {/* 详细讲解 - 折叠面板 */}
      {detail && (
        <Collapse
          ghost
          items={[{
            key: 'detail',
            label: <span style={{ fontSize: 14, fontWeight: 600, color: '#1890ff' }}>展开详细讲解</span>,
            children: (
              <Paragraph style={{
                margin: 0, fontSize: 14, lineHeight: 2.2,
                color: '#595959', whiteSpace: 'pre-wrap',
              }}>
                {detail}
              </Paragraph>
            ),
          }]}
        />
      )}
    </Card>
  );
}