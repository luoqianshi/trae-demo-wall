import { useState, useEffect } from 'react';
import { Table, Tag, Select, Space } from 'antd';
import { adminAPI } from '../services/api';

const EDUCATION_OPTIONS = [
  { value: '', label: '全部学段' },
  { value: 'primary', label: '小学' },
  { value: 'junior', label: '初中' },
  { value: 'senior', label: '高中' },
  { value: 'undergraduate', label: '大学本科' },
  { value: 'postgraduate', label: '硕士研究生' },
  { value: 'doctoral', label: '博士研究生' },
];

const EDU_LABELS: Record<string, string> = {
  primary: '小学', junior: '初中', senior: '高中',
  undergraduate: '大学本科', postgraduate: '硕士研究生', doctoral: '博士研究生',
};

const EDU_COLORS: Record<string, string> = {
  primary: 'green', junior: 'cyan', senior: 'blue',
  undergraduate: 'purple', postgraduate: 'orange', doctoral: 'red',
};

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [eduLevel, setEduLevel] = useState('');

  useEffect(() => { loadData(); }, [page, role, eduLevel]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await adminAPI.getUsers({ page, pageSize: 20, role: role || undefined, educationLevel: eduLevel || undefined });
      if (res.code === 0) { setUsers(res.data.list); setTotal(res.data.total); }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const roleLabel: Record<string, string> = { platform_admin: '平台管理员', institution_admin: '机构管理员', teacher: '教师', student: '学生', enterprise_mentor: '企业导师', university_mentor: '高校导师' };
  const roleColor: Record<string, string> = { platform_admin: 'red', institution_admin: 'purple', teacher: 'blue', student: 'green', enterprise_mentor: 'orange', university_mentor: 'cyan' };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'real_name', key: 'real_name' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (r: string) => <Tag color={roleColor[r]}>{roleLabel[r]}</Tag> },
    {
      title: '学段', dataIndex: 'education_level', key: 'education_level', width: 100,
      render: (v: string) => v ? <Tag color={EDU_COLORS[v] || 'default'}>{EDU_LABELS[v] || v}</Tag> : '-',
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '所属机构', dataIndex: 'institution_name', key: 'institution_name', render: (t: string) => t || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '正常' : '禁用'}</Tag> },
    { title: '注册时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>用户管理</h2>
        <Space>
          <Select placeholder="学段筛选" allowClear style={{ width: 150 }} value={eduLevel || undefined} onChange={(v) => { setEduLevel(v || ''); setPage(1); }}
            options={EDUCATION_OPTIONS.filter(o => o.value !== '')} />
          <Select placeholder="角色筛选" allowClear style={{ width: 150 }} onChange={(v) => { setRole(v || ''); setPage(1); }}
            options={[
              { label: '平台管理员', value: 'platform_admin' }, { label: '教师', value: 'teacher' },
              { label: '学生', value: 'student' }, { label: '企业导师', value: 'enterprise_mentor' },
              { label: '高校导师', value: 'university_mentor' },
            ]} />
        </Space>
      </div>
      <Table columns={columns} dataSource={users} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => setPage(p) }} />
    </div>
  );
}