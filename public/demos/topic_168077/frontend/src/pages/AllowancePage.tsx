import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Table, Select, Button, Modal, Form, InputNumber, Input, message } from 'antd';
import { DollarOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { allowanceAPI, childAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AllowancePage() {
  const { role, childId: authChildId } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [spendModalVisible, setSpendModalVisible] = useState(false);
  const [form] = Form.useForm();

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
      fetchData();
    }
  }, [selectedChild]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balanceRes, txRes] = await Promise.all([
        allowanceAPI.getBalance(selectedChild),
        allowanceAPI.listTransactions(selectedChild),
      ]);
      setBalance(balanceRes.data.balance || 0);
      setTransactions(txRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSpend = async () => {
    const values = await form.validateFields();
    try {
      await allowanceAPI.spend(selectedChild, values.amount, values.description);
      message.success('消费记录成功');
      setSpendModalVisible(false);
      form.resetFields();
      fetchData();
    } catch {
      message.error('消费失败（余额不足）');
    }
  };

  const columns = [
    { title: '类型', dataIndex: 'type', key: 'type',
      render: (v: string) => {
        const map: Record<string, { label: string; color: string }> = {
          reward: { label: '奖励', color: 'green' },
          penalty: { label: '惩罚', color: 'red' },
          spend: { label: '消费', color: 'orange' },
          adjust: { label: '调整', color: 'blue' },
        };
        const item = map[v] || { label: v, color: 'default' };
        return <span style={{ color: item.color }}>{item.label}</span>;
      },
    },
    {
      title: '金额', dataIndex: 'amount', key: 'amount',
      render: (v: number) => (
        <span style={{ color: v >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
          {v >= 0 ? `+${v}` : v} 元
        </span>
      ),
    },
    { title: '说明', dataIndex: 'description', key: 'description' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at',
      render: (v: string) => new Date(v).toLocaleString('zh-CN') },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Select
            value={selectedChild}
            onChange={setSelectedChild}
            style={{ width: '100%', marginBottom: 16 }}
            placeholder="选择孩子"
            options={children.map(c => ({ value: c.id, label: c.name }))}
            disabled={role === 'child'}
          />
          <Card>
            <Statistic
              title="当前零花钱"
              value={balance}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: balance >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={16}>
          <Card title="快速操作">
            {role === 'admin' && (
              <Button type="primary" icon={<MinusCircleOutlined />} onClick={() => setSpendModalVisible(true)}>
                消费记录
              </Button>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="交易记录">
        <Table dataSource={transactions} columns={columns} rowKey="id" loading={loading} />
      </Card>

      <Modal title="消费" open={spendModalVisible} onOk={handleSpend} onCancel={() => setSpendModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="amount" label="金额" rules={[{ required: true, type: 'number', min: 0.01 }]}>
            <InputNumber prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input placeholder="买了什么？" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}