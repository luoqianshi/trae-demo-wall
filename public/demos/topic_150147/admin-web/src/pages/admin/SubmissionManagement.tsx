import { useState, useEffect } from 'react';
import { Table, Tag, Input, Select, Button, Modal, Form, message, Rate, Pagination } from 'antd';
import { SearchOutlined, StarOutlined } from '@ant-design/icons';
import { adminAPI } from '../../services/api';

const statusLabels: Record<string, string> = { submitted: '待评价', evaluated: '已评价', draft: '草稿' };
const statusColors: Record<string, string> = { submitted: 'processing', evaluated: 'success', draft: 'default' };

export default function SubmissionManagement() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [evaluateTarget, setEvaluateTarget] = useState<any>(null);
  const [evaluateVisible, setEvaluateVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { loadSubmissions(); }, [page, statusFilter]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res: any = await adminAPI.listSubmissions({ page, pageSize: 20, status: statusFilter });
      if (res.code === 0) {
        setSubmissions(res.data.list);
        setTotal(res.data.total);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleEvaluate = (sub: any) => {
    setEvaluateTarget(sub);
    form.setFieldsValue({ score: sub.score, feedback: sub.feedback });
    setEvaluateVisible(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      const res: any = await adminAPI.evaluate(evaluateTarget.id, values);
      if (res.code === 0) {
        message.success('评分成功');
        setEvaluateVisible(false);
        loadSubmissions();
      }
    } catch { message.error('评分失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '任务', dataIndex: 'task_title', width: 180, ellipsis: true },
    { title: '学生', dataIndex: 'student_name', width: 100 },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v] || v}</Tag>,
    },
    {
      title: '得分', dataIndex: 'score', width: 150,
      render: (score: number) =>
        score !== null && score !== undefined ? (
          <Rate disabled value={Math.round(score / 20)} count={5} />
        ) : <span style={{ color: '#8c8c8c' }}>未评分</span>,
    },
    { title: '评语', dataIndex: 'feedback', width: 200, ellipsis: true, render: (v: string) => v || '-' },
    {
      title: '提交时间', dataIndex: 'submitted_at', width: 170,
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', width: 100, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Button type="link" icon={<StarOutlined />} onClick={() => handleEvaluate(record)}>
          {record.status === 'evaluated' ? '修改评分' : '评分'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>提交管理</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Select
          placeholder="状态筛选"
          value={statusFilter || undefined}
          onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
          allowClear
          style={{ width: 130 }}
          options={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))}
        />
      </div>
      <Table
        dataSource={submissions}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1050 }}
      />
      {total > 20 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Pagination current={page} total={total} pageSize={20} onChange={setPage} showTotal={(t) => `共 ${t} 条`} />
        </div>
      )}

      <Modal title="评分" open={evaluateVisible} onCancel={() => setEvaluateVisible(false)} onOk={handleSave}>
        <Form form={form} layout="vertical">
          <Form.Item label="分数 (0-100)" name="score" rules={[{ required: true, message: '请输入分数' }]}>
            <Input type="number" min={0} max={100} />
          </Form.Item>
          <Form.Item label="评语" name="feedback">
            <Input.TextArea rows={4} placeholder="输入评语..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}