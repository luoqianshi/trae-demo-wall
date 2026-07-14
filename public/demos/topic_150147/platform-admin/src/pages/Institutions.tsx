import { useState, useEffect } from 'react';
import { Table, Tag, Button, Select, message, Space } from 'antd';
import { adminAPI } from '../services/api';

export default function Institutions() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => { loadData(); }, [page, status]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await adminAPI.getInstitutions({ page, pageSize: 20, status: status || undefined });
      if (res.code === 0) { setInstitutions(res.data.list); setTotal(res.data.total); }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleApprove = async (id: number, newStatus: string) => {
    try {
      await adminAPI.approveInstitution(id, newStatus);
      message.success('操作成功');
      loadData();
    } catch (err: any) { message.error(err?.message || '操作失败'); }
  };

  const statusColor: Record<string, string> = { pending: 'orange', approved: 'green', rejected: 'red', disabled: 'default' };
  const statusLabel: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝', disabled: '已禁用' };
  const typeLabel: Record<string, string> = { steam: 'STEAM科创', research: '研学实践', art: '美育素养', independent: '独立教师', school: '学校社团' };

  const columns = [
    { title: '机构名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => typeLabel[t] || t },
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name' },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone' },
    { title: '营期数', dataIndex: 'camp_count', key: 'camp_count' },
    { title: '订阅', dataIndex: 'subscription_type', key: 'subscription_type', render: (t: string) => {
      const labels: Record<string, string> = { free: '免费版', personal: '个人版', studio: '工作室版', institution: '机构版' };
      return labels[t] || t;
    }},
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: any, r: any) => (
        <Space>
          {r.status === 'pending' && (
            <>
              <Button type="link" size="small" onClick={() => handleApprove(r.id, 'approved')}>通过</Button>
              <Button type="link" size="small" danger onClick={() => handleApprove(r.id, 'rejected')}>拒绝</Button>
            </>
          )}
          {r.status === 'approved' && <Button type="link" size="small" danger onClick={() => handleApprove(r.id, 'disabled')}>禁用</Button>}
          {r.status === 'disabled' && <Button type="link" size="small" onClick={() => handleApprove(r.id, 'approved')}>启用</Button>}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>机构管理</h2>
        <Select placeholder="状态筛选" allowClear style={{ width: 150 }} onChange={(v) => { setStatus(v || ''); setPage(1); }}
          options={[
            { label: '待审核', value: 'pending' }, { label: '已通过', value: 'approved' },
            { label: '已拒绝', value: 'rejected' }, { label: '已禁用', value: 'disabled' },
          ]} />
      </div>
      <Table columns={columns} dataSource={institutions} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => setPage(p) }} />
    </div>
  );
}