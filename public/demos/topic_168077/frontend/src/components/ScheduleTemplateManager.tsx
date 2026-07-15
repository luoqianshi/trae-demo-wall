import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, TimePicker, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleAPI } from '../api/client';

export default function ScheduleTemplateManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchTemplates = async () => {
    const res = await scheduleAPI.listTemplates();
    setTemplates(res.data);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      day_of_week: template.day_of_week,
      activity: template.activity,
      sort_order: template.sort_order,
      is_required: template.is_required,
      time_range: [dayjs(template.start_time, 'HH:mm'), dayjs(template.end_time, 'HH:mm')],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    await scheduleAPI.deleteTemplate(id);
    message.success('模板删除成功');
    fetchTemplates();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      start_time: values.time_range?.[0]?.format('HH:mm'),
      end_time: values.time_range?.[1]?.format('HH:mm'),
    };
    if (editingTemplate) {
      await scheduleAPI.updateTemplate(editingTemplate.id, data);
      message.success('模板更新成功');
    } else {
      await scheduleAPI.createTemplate(data);
      message.success('模板创建成功');
    }
    setModalVisible(false);
    form.resetFields();
    setEditingTemplate(null);
    fetchTemplates();
  };

  const columns = [
    { title: '星期', dataIndex: 'day_of_week', key: 'day_of_week',
      render: (v: number) => ['日', '一', '二', '三', '四', '五', '六'][v] },
    { title: '开始', dataIndex: 'start_time', key: 'start_time' },
    { title: '结束', dataIndex: 'end_time', key: 'end_time' },
    { title: '活动', dataIndex: 'activity', key: 'activity' },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order' },
    {
      title: '必须', dataIndex: 'is_required', key: 'is_required',
      render: (v: boolean) => v ? <Tag color="red">必须</Tag> : <Tag>可选</Tag>,
    },
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
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
        添加模板
      </Button>
      <Table dataSource={templates} columns={columns} rowKey="id" />

      <Modal title={editingTemplate ? '编辑作息模板' : '添加作息模板'} open={modalVisible}
        onOk={handleSubmit} onCancel={() => { setModalVisible(false); setEditingTemplate(null); form.resetFields(); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="day_of_week" label="星期" rules={[{ required: true }]}>
            <Select options={[
              { value: 0, label: '周日' }, { value: 1, label: '周一' },
              { value: 2, label: '周二' }, { value: 3, label: '周三' },
              { value: 4, label: '周四' }, { value: 5, label: '周五' },
              { value: 6, label: '周六' },
            ]} />
          </Form.Item>
          <Form.Item name="time_range" label="时间段" rules={[{ required: true }]}>
            <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="activity" label="活动" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sort_order" label="排序"><Input type="number" /></Form.Item>
          <Form.Item name="is_required" label="必须完成" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}