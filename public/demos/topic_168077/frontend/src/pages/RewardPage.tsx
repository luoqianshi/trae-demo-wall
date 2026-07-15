import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tabs, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BulbOutlined } from '@ant-design/icons';
import { rewardAPI, childAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AIAssistant from '../components/AIAssistant';

export default function RewardPage() {
  const { role } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [aiVisible, setAiVisible] = useState(false);
  const [ruleForm] = Form.useForm();
  const [recordForm] = Form.useForm();

  useEffect(() => {
    childAPI.list().then(res => setChildren(res.data));
    fetchRules();
    fetchRecords();
  }, []);

  const fetchRules = async () => {
    const res = await rewardAPI.listRules();
    setRules(res.data);
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await rewardAPI.listRecords();
      setRecords(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    ruleForm.resetFields();
    setRuleModalVisible(true);
  };

  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    ruleForm.setFieldsValue(rule);
    setRuleModalVisible(true);
  };

  const handleRuleSubmit = async () => {
    const values = await ruleForm.validateFields();
    if (editingRule) {
      await rewardAPI.updateRule(editingRule.id, values);
      message.success('规则更新成功');
    } else {
      await rewardAPI.createRule(values);
      message.success('规则创建成功');
    }
    setRuleModalVisible(false);
    fetchRules();
  };

  const handleDeleteRule = async (id: string) => {
    await rewardAPI.deleteRule(id);
    message.success('删除成功');
    fetchRules();
  };

  const handleCreateRecord = () => {
    setEditingRecord(null);
    recordForm.resetFields();
    setRecordModalVisible(true);
  };

  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    recordForm.setFieldsValue(record);
    setRecordModalVisible(true);
  };

  const handleDeleteRecord = async (id: string) => {
    await rewardAPI.deleteRecord(id);
    message.success('删除成功');
    fetchRecords();
  };

  const handleRecordSubmit = async () => {
    const values = await recordForm.validateFields();
    if (editingRecord) {
      await rewardAPI.updateRecord(editingRecord.id, values);
      message.success('记录更新成功');
    } else {
      await rewardAPI.createRecord(values);
      message.success('记录创建成功');
    }
    setRecordModalVisible(false);
    setEditingRecord(null);
    fetchRecords();
  };

  const filteredRecords = records.filter((r: any) => {
    if (filterType && r.type !== filterType) return false;
    if (filterKeyword && !(r.reason || r.description || '').includes(filterKeyword)) return false;
    return true;
  });

  const ruleColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型', dataIndex: 'type', key: 'type',
      render: (v: string) => v === 'reward' ? <span style={{ color: 'green' }}>奖励</span> : <span style={{ color: 'red' }}>惩罚</span>,
    },
    { title: '分值', dataIndex: 'amount', key: 'amount', sorter: (a: any, b: any) => a.amount - b.amount, render: (v: number) => `${v} 元` },
    { title: '说明', dataIndex: 'description', key: 'description' },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        role === 'child' ? null : (
          <Space>
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEditRule(record)}>编辑</Button>
            <Popconfirm title="确定删除?" onConfirm={() => handleDeleteRule(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Space>
        )
      ),
    },
  ];

  const recordColumns = [
    { title: '孩子', dataIndex: 'child_id', key: 'child_id',
      render: (v: string) => children.find(c => c.id === v)?.name || v },
    {
      title: '类型', dataIndex: 'type', key: 'type',
      render: (v: string) => v === 'reward' ? <span style={{ color: 'green' }}>奖励</span> : <span style={{ color: 'red' }}>惩罚</span>,
    },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `${v} 元` },
    { title: '原因', dataIndex: 'reason', key: 'reason' },
    { title: '来源', dataIndex: 'created_by', key: 'created_by' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', sorter: (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (v: string) => new Date(v).toLocaleString('zh-CN') },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        role === 'child' ? null : (
          <Space>
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEditRecord(record)}>编辑</Button>
            <Popconfirm title="确定删除?" onConfirm={() => handleDeleteRecord(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Space>
        )
      ),
    },
  ];

  return (
    <div>
      <Tabs items={[
        {
          key: 'rules',
          label: '奖惩规则',
          children: (
            <div>
              {role === 'admin' && (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRule} style={{ marginBottom: 16 }}>
                  添加规则
                </Button>
              )}
              <Table dataSource={rules} columns={ruleColumns} rowKey="id" />
            </div>
          ),
        },
        {
          key: 'records',
          label: '奖惩记录',
          children: (
            <div>
              <Space style={{ marginBottom: 16 }}>
                {role === 'admin' && (
                  <>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRecord}>
                      添加记录
                    </Button>
                    <Button icon={<BulbOutlined />} onClick={() => setAiVisible(true)}>AI输入</Button>
                  </>
                )}
                <Select allowClear placeholder="筛选类型" style={{ width: 150 }} value={filterType} onChange={setFilterType} options={[
                  { value: '', label: '全部' },
                  { value: 'reward', label: '奖励' },
                  { value: 'penalty', label: '惩罚' },
                ]} />
                <Input.Search placeholder="搜索原因/描述" style={{ width: 250 }} onSearch={setFilterKeyword} />
              </Space>
              <Table dataSource={filteredRecords} columns={recordColumns} rowKey="id" loading={loading} />
            </div>
          ),
        },
      ]} />

      {/* Rule Modal */}
      <Modal title={editingRule ? '编辑规则' : '添加规则'} open={ruleModalVisible}
        onOk={handleRuleSubmit} onCancel={() => setRuleModalVisible(false)}>
        <Form form={ruleForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={[{ value: 'reward', label: '奖励' }, { value: 'penalty', label: '惩罚' }]} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Record Modal */}
      <Modal title={editingRecord ? '编辑奖惩记录' : '添加奖惩记录'} open={recordModalVisible}
        onOk={handleRecordSubmit} onCancel={() => { setRecordModalVisible(false); setEditingRecord(null); }}>
        <Form form={recordForm} layout="vertical">
          <Form.Item name="child_id" label="孩子" rules={[{ required: true }]}>
            <Select options={children.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={[{ value: 'reward', label: '奖励' }, { value: 'penalty', label: '惩罚' }]} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="原因">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="created_by" label="来源" initialValue="家长">
            <Select options={[{ value: '家长', label: '家长' }, { value: '系统', label: '系统' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <AIAssistant visible={aiVisible} onClose={() => setAiVisible(false)} mode="reward" onParsed={(data) => {
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          recordForm.setFieldsValue(item);
          setRecordModalVisible(true);
        }
      }} />
    </div>
  );
}