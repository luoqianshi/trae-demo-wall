import React, { useState, useEffect } from 'react';
import { Table, Select, Tag, Button, Space, Tabs, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { clockAPI, deviceLogAPI, childAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const eventTypeLabels: Record<string, string> = {
  wake_up: '起床',
  sleep: '睡觉',
  sleep_check: '睡觉检测',
  study: '学习',
  meal: '用餐',
  play: '玩耍',
};

const eventTypeColors: Record<string, string> = {
  wake_up: 'orange',
  sleep: 'purple',
  sleep_check: 'purple',
  study: 'blue',
  meal: 'green',
  play: 'pink',
};

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  rejected: '已拒绝',
};

export default function ClockInPage() {
  const { role, childId: authChildId } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [records, setRecords] = useState<any[]>([]);
  const [deviceLogs, setDeviceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterChildId, setFilterChildId] = useState<string>('');

  useEffect(() => {
    childAPI.list().then(res => {
      setChildren(res.data);
      if (role === 'child' && authChildId) {
        setSelectedChild(authChildId);
      } else if (res.data.length > 0) {
        setSelectedChild(res.data[0].id);
      }
    });
  }, [role, authChildId]);

  useEffect(() => {
    if (selectedChild) {
      fetchRecords();
      fetchDeviceLogs();
    }
  }, [selectedChild]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await clockAPI.listByChild(selectedChild);
      setRecords(res.data);
    } finally { setLoading(false); }
  };

  const fetchDeviceLogs = async () => {
    try {
      const res = await deviceLogAPI.list({ child_id: selectedChild });
      setDeviceLogs(res.data);
    } catch { /* ignore */ }
  };

  const handleConfirm = async (id: string) => {
    await clockAPI.confirm(id);
    message.success('已确认');
    fetchRecords();
  };

  const handleReject = async (id: string) => {
    await clockAPI.reject(id);
    message.success('已拒绝');
    fetchRecords();
  };

  const filteredDeviceLogs = deviceLogs.filter((r: any) => {
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const legacyColumns = [
    {
      title: '打卡类型', dataIndex: 'event_type', key: 'event_type',
      render: (v: string) => <Tag color={eventTypeColors[v]}>{eventTypeLabels[v] || v}</Tag>,
    },
    {
      title: '设备', dataIndex: 'device_id', key: 'device_id',
      render: (v: string) => v ? <Tag>{v}</Tag> : '-',
    },
    {
      title: '时间', dataIndex: 'timestamp', key: 'timestamp',
      sorter: (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => {
        const colors: Record<string, string> = { pending: 'default', confirmed: 'success', rejected: 'error' };
        return <Tag color={colors[v]}>{statusLabels[v] || v}</Tag>;
      },
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        record.status === 'pending' && role === 'admin' ? (
          <Space>
            <Button type="primary" size="small" icon={<CheckCircleOutlined />}
              onClick={() => handleConfirm(record.id)}>确认</Button>
            <Button danger size="small" icon={<CloseCircleOutlined />}
              onClick={() => handleReject(record.id)}>拒绝</Button>
          </Space>
        ) : null
      ),
    },
  ];

  const deviceLogColumns = [
    {
      title: '类型', dataIndex: 'event_type', key: 'event_type',
      render: (v: string) => <Tag color={eventTypeColors[v]}>{eventTypeLabels[v] || v}</Tag>,
    },
    { title: '设备', dataIndex: 'device_id', key: 'device_id', render: (v: string) => v ? <Tag>{v}</Tag> : '-' },
    { title: 'RFID', dataIndex: 'rfid_uid', key: 'rfid_uid', render: (v: string) => v || '-' },
    {
      title: '数学题', dataIndex: 'math_problem', key: 'math_problem',
      render: (v: string) => v ? <span style={{ fontFamily: 'monospace' }}>{v}</span> : '-',
    },
    {
      title: '作答', dataIndex: 'math_user_answer', key: 'math_user_answer',
      render: (v: string) => v ? <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{v}</span> : '-',
    },
    {
      title: '结果', dataIndex: 'math_correct', key: 'math_correct',
      render: (v: boolean | null) => {
        if (v === null || v === undefined) return '-';
        return v ? <Tag color="success">正确</Tag> : <Tag color="error">错误</Tag>;
      },
    },
    {
      title: '刷卡时间', dataIndex: 'math_start_time', key: 'math_start_time',
      sorter: (a: any, b: any) => new Date(a.math_start_time || a.created_at).getTime() - new Date(b.math_start_time || b.created_at).getTime(),
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '答题时间', dataIndex: 'math_end_time', key: 'math_end_time',
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => {
        const colors: Record<string, string> = { pending: 'processing', confirmed: 'success', rejected: 'error' };
        return <Tag color={colors[v]}>{statusLabels[v] || v}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          value={selectedChild}
          onChange={setSelectedChild}
          style={{ width: 150 }}
          placeholder="选择孩子"
          options={children.map(c => ({ value: c.id, label: c.name }))}
          disabled={role === 'child'}
        />
        <Select allowClear placeholder="筛选状态" style={{ width: 130 }} value={filterStatus} onChange={setFilterStatus} options={[
          { value: '', label: '全部' },
          { value: 'pending', label: '待确认' },
          { value: 'confirmed', label: '已确认' },
          { value: 'rejected', label: '已拒绝' },
        ]} />
        <Button onClick={() => { fetchRecords(); fetchDeviceLogs(); }}>刷新</Button>
      </Space>

      <Tabs items={[
        {
          key: 'device-logs',
          label: '设备打卡记录',
          children: (
            <Table dataSource={filteredDeviceLogs} columns={deviceLogColumns} rowKey="id" loading={loading}
              locale={{ emptyText: '暂无设备打卡记录' }}
              scroll={{ x: 1000 }} />
          ),
        },
        {
          key: 'legacy',
          label: '简易打卡记录',
          children: (
            <Table dataSource={records} columns={legacyColumns} rowKey="id" loading={loading}
              locale={{ emptyText: '暂无打卡记录' }} />
          ),
        },
      ]} />
    </div>
  );
}