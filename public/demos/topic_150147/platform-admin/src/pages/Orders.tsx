import { useState, useEffect } from 'react';
import { Table, Tag } from 'antd';
import { adminAPI } from '../services/api';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => { loadData(); }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await adminAPI.getOrders({ page, pageSize: 20 });
      if (res.code === 0) { setOrders(res.data.list); setTotal(res.data.total); }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const statusColor: Record<string, string> = { pending: 'orange', paid: 'green', cancelled: 'default', refunded: 'red' };
  const statusLabel: Record<string, string> = { pending: '待支付', paid: '已支付', cancelled: '已取消', refunded: '已退款' };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '用户', dataIndex: 'user_name', key: 'user_name' },
    { title: '营期', dataIndex: 'camp_name', key: 'camp_name' },
    { title: '机构', dataIndex: 'institution_name', key: 'institution_name' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (a: number) => `¥${a}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>订单管理</h2>
      <Table columns={columns} dataSource={orders} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => setPage(p) }} />
    </div>
  );
}