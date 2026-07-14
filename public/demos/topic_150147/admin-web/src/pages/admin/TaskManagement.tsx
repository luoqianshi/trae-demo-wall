import { useState, useEffect } from 'react';
import { Table, Tag, Input, Select, Button, Modal, Form, message, Popconfirm, Pagination, Space } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminAPI } from '../../services/api';
import { categoryLabels, categoryColors, difficultyLabels, difficultyColors } from '../../constants';

const statusLabels: Record<string, string> = { draft: '草稿', published: '已发布', archived: '已归档' };
const statusColors: Record<string, string> = { draft: 'default', published: 'green', archived: 'orange' };

export default function TaskManagement() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editTask, setEditTask] = useState<any>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { loadTasks(); }, [page, statusFilter, categoryFilter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res: any = await adminAPI.listTasks({ page, pageSize: 20, keyword, status: statusFilter, category: categoryFilter });
      if (res.code === 0) {
        setTasks(res.data.list);
        setTotal(res.data.total);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleSearch = () => { setPage(1); loadTasks(); };

  const handleEdit = (task: any) => {
    setEditTask(task);
    form.setFieldsValue({ title: task.title, category: task.category, difficulty: task.difficulty, status: task.status });
    setEditVisible(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      const res: any = await adminAPI.updateTask(editTask.id, values);
      if (res.code === 0) {
        message.success('更新成功');
        setEditVisible(false);
        loadTasks();
      }
    } catch { message.error('更新失败'); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res: any = await adminAPI.deleteTask(id);
      if (res.code === 0) {
        message.success('删除成功');
        loadTasks();
      }
    } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', width: 200, ellipsis: true },
    {
      title: '分类', dataIndex: 'category', width: 100,
      render: (v: string) => <Tag color={categoryColors[v]}>{categoryLabels[v] || v}</Tag>,
    },
    {
      title: '难度', dataIndex: 'difficulty', width: 80,
      render: (v: string) => <Tag color={difficultyColors[v]}>{difficultyLabels[v] || v}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v] || v}</Tag>,
    },
    { title: '提交数', dataIndex: 'submission_count', width: 80 },
    { title: '创建者', dataIndex: 'creator_name', width: 100, render: (v: string) => v || '-' },
    {
      title: '创建时间', dataIndex: 'created_at', width: 170,
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', width: 140, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除此任务？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>任务管理</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="搜索标题/描述"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 220 }}
          allowClear
        />
        <Select
          placeholder="状态筛选"
          value={statusFilter || undefined}
          onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
          allowClear
          style={{ width: 120 }}
          options={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))}
        />
        <Select
          placeholder="分类筛选"
          value={categoryFilter || undefined}
          onChange={(v) => { setCategoryFilter(v || ''); setPage(1); }}
          allowClear
          style={{ width: 120 }}
          options={Object.entries(categoryLabels).map(([k, v]) => ({ value: k, label: v }))}
        />
        <Button type="primary" onClick={handleSearch}>搜索</Button>
      </div>
      <Table
        dataSource={tasks}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1100 }}
      />
      {total > 20 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Pagination current={page} total={total} pageSize={20} onChange={setPage} showTotal={(t) => `共 ${t} 条`} />
        </div>
      )}

      <Modal title="编辑任务" open={editVisible} onCancel={() => setEditVisible(false)} onOk={handleSave} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="分类" name="category">
            <Select options={Object.entries(categoryLabels).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
          <Form.Item label="难度" name="difficulty">
            <Select options={[
              { value: 'beginner', label: '初级' }, { value: 'intermediate', label: '中级' }, { value: 'advanced', label: '高级' },
            ]} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select options={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}