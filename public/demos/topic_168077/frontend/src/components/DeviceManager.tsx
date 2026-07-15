import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, SoundOutlined, ScanOutlined, ApiOutlined, CameraOutlined } from '@ant-design/icons';
import { deviceAPI, deviceCommandAPI } from '../api/client';
import DevicePhotoGallery from './DevicePhotoGallery';

interface DeviceManagerProps {
  onSleepConfig: (device: any) => void;
}

const deviceTypeMap: Record<string, string> = { wake_up: '起床打卡', sleep_check: '睡觉检测', sleep: '睡觉检测', multi: '多功能' };
const deviceTypeColors: Record<string, string> = { wake_up: 'blue', sleep_check: 'purple', sleep: 'purple', multi: 'orange' };

export default function DeviceManager({ onSleepConfig }: DeviceManagerProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [form] = Form.useForm();
  const [photoDevice, setPhotoDevice] = useState<any>(null);

  useEffect(() => { fetchDevices(); }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try { const res = await deviceAPI.list(); setDevices(res.data); } finally { setLoading(false); }
  };

  const handleCreate = () => {
    setEditingDevice(null);
    form.resetFields();
    form.setFieldsValue({ device_type: 'multi', model: 'M5CoreS3', has_rfid: false, is_active: true });
    setModalVisible(true);
  };

  const handleEdit = (device: any) => {
    setEditingDevice(device);
    form.setFieldsValue(device);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingDevice) {
      await deviceAPI.update(editingDevice.id, values);
      message.success('设备更新成功');
    } else {
      await deviceAPI.create(values);
      message.success('设备创建成功');
    }
    setModalVisible(false);
    fetchDevices();
  };

  const handleDelete = async (id: string) => {
    await deviceAPI.delete(id);
    message.success('删除成功');
    fetchDevices();
  };

  const handleSendCommand = async (device: any, cmd: string) => {
    try {
      await deviceCommandAPI.send(device.id, cmd);
      const cmdMap: Record<string, string> = { wake: '唤醒', sleep: '熄屏', reset: '重置', enroll: '录入模式', calibrate: '校准', stop_calibrate: '停止校准' };
      message.success(`已向设备 ${device.name} 发送${cmdMap[cmd] || cmd}指令`);
    } catch { message.error('发送指令失败'); }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'device_type', key: 'device_type',
      render: (v: string) => <Tag color={deviceTypeColors[v]}>{deviceTypeMap[v] || v}</Tag> },
    { title: '型号', dataIndex: 'model', key: 'model' },
    { title: 'RFID', dataIndex: 'has_rfid', key: 'has_rfid',
      render: (v: boolean) => v ? <Tag color="green">有</Tag> : <Tag>无</Tag> },
    { title: '状态', dataIndex: 'is_active', key: 'is_active',
      render: (v: boolean) => v ? <Tag color="success">在线</Tag> : <Tag color="default">离线</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space wrap>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" icon={<ClockCircleOutlined />} size="small" onClick={() => onSleepConfig(record)}>睡觉配置</Button>
          <Button type="link" icon={<SoundOutlined />} size="small" onClick={() => handleSendCommand(record, 'calibrate')}>校准</Button>
          {record.has_rfid && (
            <Button type="link" icon={<ScanOutlined />} size="small" onClick={() => handleSendCommand(record, 'enroll')}>录入</Button>
          )}
          <Button type="link" icon={<ApiOutlined />} size="small" onClick={() => handleSendCommand(record, 'wake')}>唤醒</Button>
          <Button type="link" size="small" onClick={() => handleSendCommand(record, 'sleep')}>熄屏</Button>
          <Button type="link" size="small" onClick={() => handleSendCommand(record, 'reset')}>重置</Button>
          <Button type="link" size="small" onClick={() => handleSendCommand(record, 'stop_calibrate')}>停止校准</Button>
          <Button type="link" icon={<CameraOutlined />} size="small" onClick={() => setPhotoDevice(record)}>照片</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>添加设备</Button>
      <Table dataSource={devices} columns={columns} rowKey="id" loading={loading} />
      <Modal title={editingDevice ? '编辑设备' : '添加设备'} open={modalVisible}
        onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="设备名称" rules={[{ required: true }]}>
            <Input placeholder="如：卧室起床打卡机" />
          </Form.Item>
          <Form.Item name="device_type" label="设备类型" rules={[{ required: true }]}>
            <Select options={[
              { value: 'multi', label: '多功能 (推荐-CoreS3统一固件)' },
              { value: 'wake_up', label: '起床打卡 (Device A/B)' },
              { value: 'sleep_check', label: '睡觉检测' },
            ]} />
          </Form.Item>
          <Form.Item name="model" label="型号">
            <Select options={[
              { value: 'M5CoreS3', label: 'M5 CoreS3' },
              { value: 'ESP32-DevKit', label: 'ESP32-DevKit' },
              { value: 'M5StickC', label: 'M5 StickC' },
            ]} />
          </Form.Item>
          <Form.Item name="has_rfid" label="RFID读卡器" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="location" label="设备位置"><Input placeholder="如：儿童房床头、客厅书桌" /></Form.Item>
        </Form>
      </Modal>
      <Modal title={`${photoDevice?.name || '设备'} - 照片`} open={!!photoDevice}
        footer={null} onCancel={() => setPhotoDevice(null)} width={720} destroyOnClose>
        {photoDevice && <DevicePhotoGallery deviceId={photoDevice.id} deviceName={photoDevice.name} />}
      </Modal>
    </div>
  );
}