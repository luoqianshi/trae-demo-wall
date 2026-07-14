import { useState, useEffect } from 'react';
import { Table, Tag, Empty, Spin, Rate, Pagination } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { submissionAPI } from '../services/api';

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  submitted: { label: '待评价', color: 'processing', icon: <ClockCircleOutlined /> },
  evaluated: { label: '已评价', color: 'success', icon: <CheckCircleOutlined /> },
  draft: { label: '草稿', color: 'default', icon: <CloseCircleOutlined /> },
};

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadSubmissions();
  }, [page]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res: any = await submissionAPI.getMy(page, pageSize);
      if (res.code === 0) {
        setSubmissions(res.data.list || []);
        setTotal(res.data.total || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const columns = [
    {
      title: '项目任务',
      dataIndex: 'task_title',
      key: 'task_title',
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/tasks/${record.task_id}`)}>{text || `任务 #${record.task_id}`}</a>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (v: string) => {
        const labels: Record<string, string> = { science: '科学实验', nature: '自然观察', creative: '创意手工', programming: '编程入门', humanities: '人文探索', life: '生活实践', other: '其他' };
        return <Tag>{labels[v] || v}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const m = statusMap[s] || { label: s, color: 'default', icon: null };
        return <Tag color={m.color} icon={m.icon}>{m.label}</Tag>;
      },
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 160,
      render: (score: number) =>
        score !== null && score !== undefined ? (
          <Rate disabled value={Math.round(score / 20)} count={5} />
        ) : (
          <span style={{ color: '#8c8c8c' }}>-</span>
        ),
    },
    {
      title: '评语',
      dataIndex: 'feedback',
      key: 'feedback',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '提交时间',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 170,
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>我的作品</h1>
      <Spin spinning={loading}>
        {submissions.length === 0 && !loading ? (
          <Empty description="还没有提交过作品，去项目广场看看吧" />
        ) : (
          <>
            <Table
              dataSource={submissions}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
            {total > pageSize && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Pagination
                  current={page}
                  total={total}
                  pageSize={pageSize}
                  onChange={setPage}
                  showTotal={(t) => `共 ${t} 条记录`}
                />
              </div>
            )}
          </>
        )}
      </Spin>
    </div>
  );
}