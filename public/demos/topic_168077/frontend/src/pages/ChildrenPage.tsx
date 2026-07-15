import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BulbOutlined } from '@ant-design/icons';
import { childAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AIAssistant from '../components/AIAssistant';
import dayjs from 'dayjs';

interface Child {
  id: string;
  name: string;
  age: number;
  birthday?: string;
  avatar: string;
}

export default function ChildrenPage() {
  const { role, childId: authChildId } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [aiVisible, setAiVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchChildren = async () => {
    setLoading(true);
    try {
      if (role === 'child' && authChildId) {
        const res = await childAPI.get(authChildId);
        setChildren([res.data]);
      } else {
        const res = await childAPI.list();
        setChildren(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [role, authChildId]);

  const handleCreate = () => {
    setEditingChild(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    form.setFieldsValue({
      ...child,
      birthday: child.birthday ? dayjs(child.birthday, 'YYYY-MM-DD') : undefined,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await childAPI.delete(id);
      message.success('删除成功');
      fetchChildren();
    } catch {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
      };
      if (editingChild) {
        await childAPI.update(editingChild.id, data);
        message.success('更新成功');
      } else {
        await childAPI.create(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchChildren();
    } catch {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '年龄', dataIndex: 'age', key: 'age' },
    { title: '生日', dataIndex: 'birthday', key: 'birthday', render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Child) => (
        role === 'child' ? (
          <span style={{ color: '#888' }}>只读</span>
        ) : (
          <Space>
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {role === 'admin' && (
          <>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginRight: 8 }}>
              添加孩子
            </Button>
            <Button icon={<BulbOutlined />} onClick={() => setAiVisible(true)}>AI输入</Button>
          </>
        )}
      </div>
      <Table dataSource={children} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editingChild ? '编辑孩子' : '添加孩子'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="age" label="年龄">
            <InputNumber min={0} max={30} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select allowClear placeholder="选择性别" options={[
              { value: 'male', label: '男' },
              { value: 'female', label: '女' },
            ]} />
          </Form.Item>
          <Form.Item name="birthday" label="生日">
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="school" label="学校">
            <Input placeholder="如：阳光小学" />
          </Form.Item>
          <Form.Item name="class" label="班级">
            <Input placeholder="如：三年级二班" />
          </Form.Item>
        </Form>
      </Modal>

      <AIAssistant visible={aiVisible} onClose={() => setAiVisible(false)} mode="child" onParsed={(data) => {
        form.setFieldsValue(data);
        setModalVisible(true);
      }} />
    </div>
  );
}