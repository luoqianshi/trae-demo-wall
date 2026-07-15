import React, { useEffect } from 'react';
import { Modal, Form, TimePicker, InputNumber, Switch, message } from 'antd';
import dayjs from 'dayjs';
import { sleepConfigAPI } from '../api/client';

interface SleepConfigModalProps {
  device: any;
  visible: boolean;
  onClose: () => void;
}

export default function SleepConfigModal({ device, visible, onClose }: SleepConfigModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && device) {
      sleepConfigAPI.get(device.id).then(res => {
        form.setFieldsValue({
          ...res.data,
          start_time: res.data.start_time ? dayjs(res.data.start_time, 'HH:mm') : dayjs('22:00', 'HH:mm'),
          end_time: res.data.end_time ? dayjs(res.data.end_time, 'HH:mm') : dayjs('22:20', 'HH:mm'),
        });
      }).catch(() => {
        form.setFieldsValue({
          start_time: dayjs('22:00', 'HH:mm'), end_time: dayjs('22:20', 'HH:mm'),
          reminder_1_min: 20, reminder_2_min: 10, sound_threshold: 500, is_enabled: true,
        });
      });
    }
  }, [visible, device, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      device_id: device.id,
      start_time: values.start_time.format('HH:mm'),
      end_time: values.end_time.format('HH:mm'),
    };
    await sleepConfigAPI.update(device.id, data);
    message.success('睡觉检测配置已保存并推送到设备');
    onClose();
  };

  return (
    <Modal title={`睡觉检测配置 - ${device?.name || ''}`} open={visible}
      onOk={handleSubmit} onCancel={onClose} width={500}>
      <Form form={form} layout="vertical">
        <Form.Item name="start_time" label="检测开始时间" rules={[{ required: true }]}>
          <TimePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="end_time" label="检测结束时间" rules={[{ required: true }]}>
          <TimePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="reminder_1_min" label="第一次提醒（提前分钟数）">
          <InputNumber min={1} max={60} style={{ width: '100%' }} addonAfter="分钟" />
        </Form.Item>
        <Form.Item name="reminder_2_min" label="第二次提醒（提前分钟数）">
          <InputNumber min={1} max={60} style={{ width: '100%' }} addonAfter="分钟" />
        </Form.Item>
        <Form.Item name="sound_threshold" label="声音检测阈值">
          <InputNumber min={0} max={4095} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="is_enabled" label="启用" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>
  );
}