import React, { useState, useEffect } from 'react';
import {
  Modal, Tabs, Input, Form, DatePicker, Button, message, Tag, Space, Spin
} from 'antd';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;

export function AiReviewModal({ open, onClose, project, onSaved }:
  { open: boolean; onClose: () => void; project: any; onSaved: () => void }) {

  const [chatText, setChatText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ raw: string; structured: any; chatText: string } | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [createdAt, setCreatedAt] = useState<string>(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    if (open) {
      setChatText('');
      setResult(null);
      setEditedContent('');
      setCreatedAt(dayjs().format('YYYY-MM-DD'));
    }
  }, [open]);

  const handleRun = async () => {
    if (!chatText.trim()) {
      message.warning('请先粘贴聊天记录或模拟内容');
      return;
    }
    setLoading(true);
    try {
      const r = await window.api.runAiExtract(chatText);
      if (!r.ok) {
        message.error(r.error || 'AI 提取失败');
        return;
      }
      setResult({ raw: r.raw || '', structured: r.structured, chatText: r.chatText || '' });
      if (r.structured) {
        const lines: string[] = [];
        if (r.structured.summary) lines.push(`摘要：${r.structured.summary}`);
        if (r.structured.currentStatus) lines.push(`当前状态：${r.structured.currentStatus}`);
        if (Array.isArray(r.structured.issues) && r.structured.issues.length > 0) {
          lines.push(`关键问题：` + r.structured.issues.map((x: string) => `- ${x}`).join('\n'));
        }
        if (Array.isArray(r.structured.nextActions) && r.structured.nextActions.length > 0) {
          lines.push(`下一步行动：` + r.structured.nextActions.map((x: string) => `- ${x}`).join('\n'));
        }
        setEditedContent(lines.join('\n'));
      } else {
        setEditedContent(r.raw || '');
      }
    } catch (e: any) {
      message.error(e.message || '调用失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedContent.trim()) {
      message.warning('进展内容不能为空');
      return;
    }
    await window.api.addProgress({
      projectId: project.id,
      content: editedContent.trim(),
      type: 'ai',
      template: '',
      isReviewed: true,
      createdAt
    });
    message.success('进展已保存');
    onSaved();
    onClose();
  };

  const items: TabsProps['items'] = [
    { key: 'input', label: '1. 聊天记录' },
    { key: 'review', label: '2. 审核编辑', disabled: !result }
  ];
  const [activeTab, setActiveTab] = useState('input');
  useEffect(() => { if (result) setActiveTab('review'); }, [result]);

  return (
    <Modal
      title={`🤖 AI 提取进展 - ${project.name}`}
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          {activeTab === 'input' && (
            <Button type="primary" loading={loading} icon={<span>🔍</span>} onClick={handleRun}>
              运行 AI 提取
            </Button>
          )}
          {activeTab === 'review' && result && (
            <Button type="primary" onClick={handleSave}>保存进展</Button>
          )}
        </Space>
      }
      width={820}
      destroyOnClose
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />

      {activeTab === 'input' && (
        <div style={{ paddingTop: 8 }}>
          <div style={{ color: '#6b7280', marginBottom: 8, fontSize: 13 }}>
            <Tag color="blue">提示</Tag>
            请粘贴 IM 聊天记录或模拟沟通内容。AI 会自动解析为结构化进展摘要。
          </div>
          <TextArea
            rows={10}
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder="示例：\n张三：今天的网络配置完成了吗？\n李四：核心节点已配置完成，还剩两个边缘节点。\n张三：预计明天上午能完成。\n李四：好的，注意下周客户验收。"
          />
          {loading && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spin tip="正在调用 AI 解析..." />
            </div>
          )}
        </div>
      )}

      {activeTab === 'review' && result && (
        <div style={{ paddingTop: 8 }}>
          <Form layout="vertical">
            <Form.Item label="日期">
              <DatePicker value={dayjs(createdAt)} onChange={(v) => setCreatedAt(v ? v.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'))} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="AI 结构化输出（可直接编辑下方内容）">
              {result.structured ? (
                <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 6, maxHeight: 180, overflow: 'auto' }}>
                  {JSON.stringify(result.structured, null, 2)}
                </pre>
              ) : (
                <div style={{ color: '#d97706' }}>AI 未返回 JSON，下方为原始文本</div>
              )}
            </Form.Item>

            <Form.Item label="最终进展内容（请核对编辑）">
              <TextArea rows={8} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} />
            </Form.Item>

            <Form.Item label="原始聊天记录">
              <TextArea rows={5} value={result.chatText} disabled style={{ background: '#fafafa' }} />
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
}
