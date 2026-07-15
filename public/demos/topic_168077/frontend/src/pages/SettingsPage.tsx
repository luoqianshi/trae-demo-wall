import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Spin, Result, Space } from 'antd';
import { settingsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { role } = useAuth();
  const [mqttForm] = Form.useForm();
  const [aiForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.get();
      mqttForm.setFieldsValue(res.data.mqtt || {});
      aiForm.setFieldsValue(res.data.ai || {});
    } catch {
      message.error('获取设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMQTT = async () => {
    const values = await mqttForm.validateFields();
    setSaving(true);
    try {
      await settingsAPI.update({ mqtt: values });
      message.success('MQTT 设置保存成功');
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAI = async () => {
    const values = await aiForm.validateFields();
    setSaving(true);
    try {
      const currentSettings = await settingsAPI.get();
      await settingsAPI.update({ mqtt: currentSettings.data.mqtt, ai: values });
      message.success('AI 设置保存成功');
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const testAIConnection = async () => {
    try {
      const res = await settingsAPI.get();
      const ai = res.data.ai;
      if (!ai?.api_endpoint) {
        message.warning('请先填写 API 地址');
        return;
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (ai.api_key) headers['Authorization'] = `Bearer ${ai.api_key}`;
      const testResp = await fetch(ai.api_endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: ai.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      });
      if (testResp.ok) message.success('AI API 连接测试成功');
      else message.error('AI API 连接测试失败: HTTP ' + testResp.status);
    } catch (e: any) {
      message.error('AI API 连接测试失败: ' + e.message);
    }
  };

  if (role !== 'admin') {
    return <Result status="403" title="无权限" subTitle="孩子模式下无法访问系统设置" />;
  }

  if (loading) return <Spin style={{ display: 'block', marginTop: 100 }} />;

  return (
    <div style={{ maxWidth: 600 }}>
      <Card title="MQTT 服务器设置" style={{ marginBottom: 24 }}>
        <Form form={mqttForm} layout="vertical">
          <Form.Item name="broker" label="Broker 地址" rules={[{ required: true }]} tooltip="MQTT服务器地址，如 mqtt://broker.emqx.io:1883">
            <Input placeholder="mqtt://broker.emqx.io:1883" />
          </Form.Item>
          <Form.Item name="username" label="用户名">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="password" label="密码">
            <Input.Password placeholder="可选" />
          </Form.Item>
          <Form.Item name="client_id" label="Client ID">
            <Input placeholder="coin-kids-web" />
          </Form.Item>
          <Form.Item name="topic_prefix" label="主题前缀">
            <Input placeholder="coin-kids" />
          </Form.Item>
          <Button type="primary" onClick={handleSaveMQTT} loading={saving}>保存 MQTT 设置</Button>
        </Form>
      </Card>

      <Card title="AI API 接口设置">
        <Form form={aiForm} layout="vertical">
          <Form.Item name="api_endpoint" label="API 地址" rules={[{ required: true }]} tooltip="AI API 的完整请求地址">
            <Input placeholder="https://api.openai.com/v1/chat/completions" />
          </Form.Item>
          <Form.Item name="api_key" label="API Key">
            <Input.Password placeholder="sk-..." />
          </Form.Item>
          <Form.Item name="model" label="模型名称" tooltip="使用的 AI 模型，如 gpt-3.5-turbo、deepseek-chat 等">
            <Input placeholder="gpt-3.5-turbo" />
          </Form.Item>
          <Space>
            <Button type="primary" onClick={handleSaveAI} loading={saving}>保存 AI 设置</Button>
            <Button onClick={testAIConnection}>测试连接</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}