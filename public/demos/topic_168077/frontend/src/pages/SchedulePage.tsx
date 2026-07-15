import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, TimePicker, Space, Tabs, Popconfirm, message, Tag, Collapse, Checkbox, List } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, BulbOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleAPI, childAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AIAssistant from '../components/AIAssistant';
import ScheduleTemplateManager from '../components/ScheduleTemplateManager';

const statusColors: Record<string, string> = {
  pending: 'default',
  done: 'success',
  missed: 'error',
  reviewing: 'processing',
};

const statusLabels: Record<string, string> = {
  pending: '待完成',
  done: '已完成',
  missed: '未完成',
  reviewing: '审核中',
};

export default function SchedulePage() {
  const { role, childId: authChildId } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [aiVisible, setAiVisible] = useState(false);
  const [form] = Form.useForm();
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

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
      fetchSchedules();
    }
    fetchTemplates();
  }, [selectedChild, date]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await scheduleAPI.listByChildAndDate(selectedChild, date);
      setSchedules(res.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    const res = await scheduleAPI.listTemplates();
    setTemplates(res.data);
  };

  const handleCreate = () => {
    setEditingSchedule(null);
    form.resetFields();
    form.setFieldsValue({ child_id: selectedChild, date, status: 'pending' });
    setModalVisible(true);
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    form.setFieldsValue({
      child_id: schedule.child_id,
      date: schedule.date,
      activity: schedule.activity,
      status: schedule.status,
      time_range: [dayjs(schedule.start_time, 'HH:mm'), dayjs(schedule.end_time, 'HH:mm')],
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      start_time: values.time_range?.[0]?.format('HH:mm'),
      end_time: values.time_range?.[1]?.format('HH:mm'),
      is_fixed: true,
    };
    if (editingSchedule) {
      await scheduleAPI.update(editingSchedule.id, data);
      message.success('更新成功');
      setEditingSchedule(null);
    } else {
      await scheduleAPI.create(data);
      message.success('创建成功');
    }
    setModalVisible(false);
    fetchSchedules();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await scheduleAPI.update(id, { status });
    message.success('状态更新成功');
    fetchSchedules();
  };

  const handleDelete = async (id: string) => {
    await scheduleAPI.delete(id);
    message.success('删除成功');
    fetchSchedules();
  };

  const handleGenerate = async () => {
    if (!selectedChild) return;
    const dow = dayjs(date).day();
    const matchingTemplates = templates.filter(t => t.day_of_week === dow);
    if (matchingTemplates.length === 0) {
      message.warning('当前日期没有匹配的作息模板');
      return;
    }
    setSelectedTemplateIds(matchingTemplates.map(t => t.id));
    setGenerateModalVisible(true);
  };

  const handleGenerateConfirm = async () => {
    if (!selectedChild || selectedTemplateIds.length === 0) return;
    setGenerating(true);
    try {
      await scheduleAPI.generate(selectedChild, date, selectedTemplateIds);
      message.success(`已从 ${selectedTemplateIds.length} 个模板生成作息`);
      setGenerateModalVisible(false);
      fetchSchedules();
    } catch {
      message.error('生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const columns = [
    { title: '开始', dataIndex: 'start_time', key: 'start_time' },
    { title: '结束', dataIndex: 'end_time', key: 'end_time' },
    { title: '活动', dataIndex: 'activity', key: 'activity' },
    {
      title: '类型', dataIndex: 'is_fixed', key: 'is_fixed',
      render: (v: boolean) => v ? <Tag color="blue">固定</Tag> : <Tag>自主</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string, record: any) =>
        role === 'child' ? (
          <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>
        ) : (
          <Select
            value={status}
            style={{ width: 100 }}
            onChange={(val) => handleStatusChange(record.id, val)}
            options={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))}
          />
        ),
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        role === 'child' ? null : (
          <Space>
            <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
            </Popconfirm>
          </Space>
        )
      ),
    },
  ];

  return (
    <div>
      <Collapse size="small" items={[
  { key: 'help', label: '📖 操作指导（点击展开）',
    children: (
      <div style={{ background: '#f6f8fa', padding: 16, borderRadius: 8 }}>
        <h4>📅 每日作息</h4>
        <p>• <strong>添加作息:</strong> 选择一个孩子并指定日期，点击"添加作息"按钮。</p>
        <p>• 活动名称：如"起床"、"早餐"、"上学"</p>
        <p>• 开始/结束时间：如 07:00-07:30</p>
        <p>• 参考示例：起床(07:00)→早餐(07:30)→上学(08:00)→作业(19:00)→洗漱(20:30)→睡觉(21:00)</p>
        <h4 style={{ marginTop: 16 }}>📋 作息模板</h4>
        <p>• 先创建模板（按星期设置），再选择日期一键生成</p>
        <p>• 星期：可多选（1=周一...7=周日）</p>
        <p>• 排序：数字越小越靠前</p>
      </div>
    ),
  },
]} style={{ marginBottom: 16 }} />
      <Space style={{ marginBottom: 16 }}>
        <Select
          value={selectedChild}
          onChange={setSelectedChild}
          style={{ width: 150 }}
          placeholder="选择孩子"
          options={children.map(c => ({ value: c.id, label: c.name }))}
          disabled={role === 'child'}
        />
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ width: 160 }}
        />
        {role === 'admin' && (
          <>
            <Button type="primary" onClick={handleCreate}>添加作息</Button>
            <Button onClick={handleGenerate}>从模板生成</Button>
            <Button icon={<BulbOutlined />} onClick={() => setAiVisible(true)}>AI输入</Button>
          </>
        )}
      </Space>

      <Tabs items={[
        {
          key: 'daily',
          label: '每日作息',
          children: <Table dataSource={schedules} columns={columns} rowKey="id" loading={loading} />,
        },
        ...(role === 'admin' ? [{
          key: 'templates',
          label: '作息模板',
          children: <ScheduleTemplateManager />,
        }] : []),
      ]} />

      {/* Schedule Create/Edit Modal */}
      <Modal title={editingSchedule ? '编辑作息' : '添加作息'} open={modalVisible}
        onOk={handleSubmit} onCancel={() => { setModalVisible(false); setEditingSchedule(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="child_id" label="孩子" hidden><Input /></Form.Item>
          <Form.Item name="date" label="日期"><Input /></Form.Item>
          <Form.Item name="time_range" label="时间段" rules={[{ required: true }]}>
            <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="activity" label="活动" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Template Selection for Generate */}
      <Modal title="从模板生成作息" open={generateModalVisible}
        onOk={handleGenerateConfirm} onCancel={() => setGenerateModalVisible(false)}
        confirmLoading={generating}
        okText={`生成 (${selectedTemplateIds.length} 个模板)`}
      >
        <div style={{ marginBottom: 12, color: '#666' }}>
          当前日期 <b>{date}</b>（{['周日','周一','周二','周三','周四','周五','周六'][dayjs(date).day()]}）
          匹配以下作息模板：
        </div>
        <List
          dataSource={templates.filter(t => t.day_of_week === dayjs(date).day())}
          renderItem={(item: any) => (
            <List.Item>
              <Checkbox
                checked={selectedTemplateIds.includes(item.id)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedTemplateIds(prev => [...prev, item.id]);
                  else setSelectedTemplateIds(prev => prev.filter(id => id !== item.id));
                }}
              >
                <Tag color="blue">{item.start_time}-{item.end_time}</Tag>
                {item.activity}
                {item.is_required && <Tag color="red" style={{ marginLeft: 8 }}>必须</Tag>}
              </Checkbox>
            </List.Item>
          )}
        />
      </Modal>

      <AIAssistant visible={aiVisible} onClose={() => setAiVisible(false)} mode="schedule" onParsed={(data) => {
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          form.setFieldsValue({
            child_id: selectedChild,
            date,
            activity: item.activity,
            time_range: item.start_time ? [dayjs(item.start_time, 'HH:mm'), dayjs(item.start_time, 'HH:mm').add(30, 'minute')] : undefined,
          });
          setModalVisible(true);
        }
      }} />
    </div>
  );
}