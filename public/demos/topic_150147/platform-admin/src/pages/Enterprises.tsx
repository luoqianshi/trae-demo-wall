import { useState, useEffect } from 'react';
import { Table, Tag, Button, Select, message, Space } from 'antd';
import { enterpriseAPI } from '../services/api';

export default function Enterprises() {
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => { loadData(); }, [page, status]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await enterpriseAPI.list({ page, pageSize: 20, status: status || undefined });
      if (res.code === 0) { setEnterprises(res.data.list); setTotal(res.data.total); }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleApprove = async (id: number, newStatus: string) => {
    try {
      await enterpriseAPI.approve(id, newStatus);
      message.success('操作成功');
      loadData();
    } catch (err: any) { message.error(err?.message || '操作失败'); }
  };

  const statusColor: Record<string, string> = { pending: 'orange', approved: 'green', rejected: 'red', disabled: 'default' };
  const statusLabel: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝', disabled: '已禁用' };
  const industryLabel: Record<string, string> = { internet: '互联网', design: '设计', ecommerce: '电商', engineering: '工程', media: '新媒体', education: '教育', finance: '金融', medical: '医疗', other: '其他' };
  const scaleLabel: Record<string, string> = { startup: '初创', sme: '中小', large: '大型', group: '集团' };

  const columns = [
    { title: '企业名称', dataIndex: 'name', key: 'name' },
    { title: '行业', dataIndex: 'industry', key: 'industry', render: (t: string) => industryLabel[t] || t },
    { title: '规模', dataIndex: 'scale', key: 'scale', render: (s: string) => <Tag>{scaleLabel[s] || s}</Tag> },
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name' },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone' },
    { title: '需求数', dataIndex: 'demand_count', key: 'demand_count' },
    { title: '导师数', dataIndex: 'mentor_count', key: 'mentor_count' },
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
        <h2>企业管理</h2>
        <Select placeholder="状态筛选" allowClear style={{ width: 150 }} onChange={(v) => { setStatus(v || ''); setPage(1); }}
          options={[
            { label: '待审核', value: 'pending' }, { label: '已通过', value: 'approved' },
            { label: '已拒绝', value: 'rejected' }, { label: '已禁用', value: 'disabled' },
          ]} />
      </div>
      <Table columns={columns} dataSource={enterprises} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => setPage(p) }} />
    </div>
  );
}