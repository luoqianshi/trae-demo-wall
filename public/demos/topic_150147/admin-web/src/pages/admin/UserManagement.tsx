import { useState, useEffect } from 'react';
import { Table, Tag, Input, Select, Button, Modal, Form, message, Space, Pagination } from 'antd';
import { SearchOutlined, EditOutlined } from '@ant-design/icons';
import { adminAPI } from '../../services/api';

const roleLabels: Record<string, string> = {
  student: '学生', teacher: '教师', institution_admin: '机构管理', platform_admin: '平台管理',
};
const roleColors: Record<string, string> = {
  student: 'blue', teacher: 'green', institution_admin: 'orange', platform_admin: 'red',
};
const statusLabels: Record<string, string> = { active: '正常', disabled: '已禁用' };

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState<any>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { loadUsers(); }, [page, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res: any = await adminAPI.listUsers({ page, pageSize: 20, keyword, role: roleFilter });
      if (res.code === 0) {
        setUsers(res.data.list);
        setTotal(res.data.total);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const handleEdit = (user: any) => {
    setEditUser(user);
    form.setFieldsValue({ role: user.role, status: user.status });
    setEditVisible(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      const res: any = await adminAPI.updateUser(editUser.id, values);
      if (res.code === 0) {
        message.success('更新成功');
        setEditVisible(false);
        loadUsers();
      }
    } catch { message.error('更新失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'real_name', width: 100 },
    {
      title: '角色', dataIndex: 'role', width: 100,
      render: (v: string) => <Tag color={roleColors[v]}>{roleLabels[v] || v}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{statusLabels[v] || v}</Tag>,
    },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '机构', dataIndex: 'institution_name', width: 140, render: (v: string) => v || '-' },
    {
      title: '注册时间', dataIndex: 'created_at', width: 170,
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', width: 80, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>用户管理</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input
          placeholder="搜索用户名/姓名/手机号"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 260 }}
          allowClear
        />
        <Select
          placeholder="角色筛选"
          value={roleFilter || undefined}
          onChange={(v) => { setRoleFilter(v || ''); setPage(1); }}
          allowClear
          style={{ width: 130 }}
          options={Object.entries(roleLabels).map(([k, v]) => ({ value: k, label: v }))}
        />
        <Button type="primary" onClick={handleSearch}>搜索</Button>
      </div>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1000 }}
      />
      {total > 20 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Pagination current={page} total={total} pageSize={20} onChange={setPage} showTotal={(t) => `共 ${t} 条`} />
        </div>
      )}

      <Modal title="编辑用户" open={editVisible} onCancel={() => setEditVisible(false)} onOk={handleSave}>
        <Form form={form} layout="vertical">
          <Form.Item label="角色" name="role" rules={[{ required: true }]}>
            <Select options={Object.entries(roleLabels).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true }]}>
            <Select options={[{ value: 'active', label: '正常' }, { value: 'disabled', label: '已禁用' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}