import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message } from 'antd';
import { LinkOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { rfidAPI, childAPI } from '../api/client';

export default function RFIDBindingManager() {
  const [bindings, setBindings] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchBindings(); childAPI.list().then(res => setChildren(res.data)); }, []);

  const fetchBindings = async () => {
    try { const res = await rfidAPI.list(); setBindings(res.data); } catch { /* ignore */ }
  };

  const handleCreate = () => { setEditing(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (record: any) => { setEditing(record); form.setFieldsValue(record); setModalVisible(true); };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await rfidAPI.update(editing.id, values);
      message.success('RFID绑定更新成功');
    } else {
      await rfidAPI.create(values);
      message.success('RFID绑定成功');
    }
    setModalVisible(false);
    setEditing(null);
    fetchBindings();
  };

  const handleDelete = async (id: string) => {
    await rfidAPI.delete(id);
    message.success('删除成功');
    fetchBindings();
  };

  const columns = [
    { title: 'RFID UID', dataIndex: 'rfid_uid', key: 'rfid_uid' },
    { title: '孩子', dataIndex: 'child_id', key: 'child_id',
      render: (v: string) => children.find(c => c.id === v)?.name || v },
    { title: '标签', dataIndex: 'label', key: 'label' },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" icon={<LinkOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>绑定RFID卡</Button>
      <Table dataSource={bindings} columns={columns} rowKey="id" />
      <Modal title={editing ? '编辑RFID绑定' : '绑定RFID卡'} open={modalVisible}
        onOk={handleSubmit} onCancel={() => { setModalVisible(false); setEditing(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="rfid_uid" label="RFID卡UID" rules={[{ required: true, message: '请刷卡后输入UID' }]}>
            <Input placeholder="刷卡后显示的UID" />
          </Form.Item>
          <Form.Item name="child_id" label="绑定孩子" rules={[{ required: true }]}>
            <Select options={children.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="label" label="卡片标签"><Input placeholder="如：红色卡、蓝色卡" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}