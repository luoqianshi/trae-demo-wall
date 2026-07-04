import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Button,
  Form,
  Input,
  Select,
  Table,
  Space,
  Modal,
  Switch,
  message,
  InputNumber,
  Tooltip,
  Tag,
  Popconfirm
} from 'antd';
import type { ColumnsType } from 'antd/table';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, ExportOutlined, ImportOutlined, SettingOutlined, DatabaseOutlined, FileTextOutlined, ThunderboltOutlined, LinkOutlined } from '@ant-design/icons';
import { useFieldStore, useAiStore, useUiStore, useTemplateStore, useProjectStore, useJumperStore } from '../store';
import { shallow } from 'zustand/shallow';
import type { FieldConfig } from '../types';
import styles from './Settings.module.css';

const { TextArea } = Input;
const { Option } = Select;

interface SettingsPageProps {
  onThemeChange?: () => void;
  onNavigate?: (key: string) => void;
}

export default function SettingsPage(_props: SettingsPageProps) {
  const [tab, setTab] = useState('fields');

  const tabItems = [
    { key: 'fields', label: <span><SettingOutlined style={{ marginRight: 6 }} />字段管理</span> },
    { key: 'templates', label: <span><FileTextOutlined style={{ marginRight: 6 }} />进展模板</span> },
    { key: 'jumper', label: <span><LinkOutlined style={{ marginRight: 6 }} />跳转配置</span> },
    { key: 'ai', label: <span><ThunderboltOutlined style={{ marginRight: 6 }} />AI 配置</span> },
    { key: 'io', label: <span><DatabaseOutlined style={{ marginRight: 6 }} />导入 / 导出</span> },
    { key: 'ui', label: <span>🎨 界面配置</span> }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>设置</h2>
        <div className={styles.pageSubtitle}>管理数据结构、模板、AI 能力与界面偏好</div>
      </div>
      <div className="settings-panel">
        <Tabs activeKey={tab} onChange={setTab} items={tabItems as any} style={{ marginBottom: 12 }} />
        {tab === 'fields' && <FieldManagement />}
        {tab === 'templates' && <TemplateManagement />}
        {tab === 'jumper' && <JumperConfigPanel />}
        {tab === 'ai' && <AiConfigPanel />}
        {tab === 'io' && <ImportExportPanel />}
        {tab === 'ui' && <UiConfigPanel />}
      </div>
    </div>
  );
}

function FieldManagement() {
  const fields = useFieldStore((s) => s.fields, shallow);
  const addField = useFieldStore((s) => s.add);
  const updateField = useFieldStore((s) => s.update);
  const removeField = useFieldStore((s) => s.remove);
  const [openAdd, setOpenAdd] = useState(false);
  const [editField, setEditField] = useState<FieldConfig | null>(null);

  const columns: ColumnsType<FieldConfig> = [
    { title: '字段名', dataIndex: 'label', key: 'label', width: 180, render: (v: string) => <span className={styles.fieldLabel}>{v}</span> },
    { title: 'Key', dataIndex: 'key', key: 'key', width: 180, render: (v: string) => <code style={{ background: 'rgba(99,102,241,0.08)', padding: '3px 8px', borderRadius: 6, fontSize: 12, color: '#4f46e5' }}>{v}</code> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 110, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '选项', dataIndex: 'options', key: 'options', render: (v: string[]) => (Array.isArray(v) && v.length > 0 ? v.map((x: string) => <Tag key={x}>{x}</Tag>) : <span className="tag-muted">—</span>) },
    { title: '顺序', dataIndex: 'orderIndex', key: 'orderIndex', width: 80, render: (v: number) => <span className={styles.settingDesc}>{v}</span> },
    { title: '显示', dataIndex: 'visible', key: 'visible', width: 100, align: 'center', render: (v: boolean, record) => <Switch size="small" checked={v} onChange={(checked) => updateField({ ...record, visible: checked })} /> },
    { title: '快速添加页', dataIndex: 'showInQuickAdd', key: 'showInQuickAdd', width: 110, align: 'center', render: (v: boolean, record) => <Switch size="small" checked={!!v} onChange={(checked) => updateField({ ...record, showInQuickAdd: checked })} /> },
    {
      title: '操作',
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_: any, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditField(record)}>编辑</Button>
          <Popconfirm title="确认删除该字段?" onConfirm={() => removeField(record.key)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className={styles.sectionTitle}>
        <span>共 {fields.length} 个字段</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenAdd(true)}>新增字段</Button>
      </div>
      <div className={styles.resizableTableWrap}>
        <Table rowKey="key" size="middle" columns={columns} dataSource={fields} pagination={false} scroll={{ x: 1000 }} />
      </div>
      <FieldModal open={openAdd} onClose={() => setOpenAdd(false)} onSubmit={(data) => { addField(data); setOpenAdd(false); message.success('已添加字段'); }} />
      <FieldModal edit open={!!editField} field={editField} onClose={() => setEditField(null)} onSubmit={(data) => { updateField(data); setEditField(null); message.success('已更新'); }} />
    </div>
  );
}

function FieldModal({ open, onClose, onSubmit, edit, field }: { open: boolean; onClose: () => void; onSubmit: (data: any) => void; edit?: boolean; field?: FieldConfig | null }) {
  const [form] = Form.useForm();
  const [fieldType, setFieldType] = useState<string>('text');
  const [optionsText, setOptionsText] = useState('');
  const [jumperMode, setJumperMode] = useState<'person' | 'group'>('person');

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (edit && field) {
        form.setFieldsValue({ key: field.key, label: field.label, type: field.type, orderIndex: field.orderIndex, defaultValue: field.defaultValue });
        setFieldType(field.type);
        setOptionsText((field.options || []).join('\n'));
        setJumperMode(field.jumperMode || 'person');
      } else {
        setFieldType('text');
        setOptionsText('');
        setJumperMode('person');
      }
    }
  }, [open]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const options = optionsText.split('\n').map((s) => s.trim()).filter(Boolean);
      onSubmit({ key: values.key, label: values.label, type: values.type, orderIndex: values.orderIndex || 0, options, defaultValue: values.defaultValue || '', visible: true, showInQuickAdd: false, jumperMode });
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal title={edit ? '编辑字段' : '新增字段'} open={open} onCancel={onClose} onOk={handleOk} okText="保存" cancelText="取消" width={560} centered>
      <Form form={form} layout="vertical">
        <Form.Item label="字段 Key" name="key" rules={[{ required: true, message: '请输入 Key' }]}>
          <Input placeholder="自定义字段的唯一标识，如 projectManager" disabled={edit} />
        </Form.Item>
        <Form.Item label="显示名称" name="label" rules={[{ required: true, message: '请输入显示名称' }]}>
          <Input placeholder="例如：项目经理" />
        </Form.Item>
        <Form.Item label="字段类型" name="type" initialValue="text">
          <Select onChange={(v) => setFieldType(v)}>
            <Option value="text">文本</Option>
            <Option value="textarea">多行文本</Option>
            <Option value="number">数字</Option>
            <Option value="date">日期</Option>
            <Option value="select">下拉选择</Option>
            <Option value="jumper">跳转（联系人/群）</Option>
          </Select>
        </Form.Item>
        {fieldType === 'select' && (
          <Form.Item label="选项（每行一个）">
            <TextArea rows={4} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder={'选项A\n选项B\n选项C'} />
          </Form.Item>
        )}
        {fieldType === 'jumper' && (
          <Form.Item label="跳转模式">
            <Select value={jumperMode} onChange={(v) => setJumperMode(v)}>
              <Option value="person">跳转个人</Option>
              <Option value="group">跳转群</Option>
            </Select>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 6 }}>
              数据格式：显示名称 + 空格 + 工号/号码，如「小明 x00123456」
            </div>
          </Form.Item>
        )}
        <Form.Item label="默认值" name="defaultValue">
          <Input placeholder="可选" />
        </Form.Item>
        <Form.Item label="显示顺序" name="orderIndex" initialValue={1}>
          <InputNumber min={0} max={999} style={{ width: 200 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function TemplateManagement() {
  const templates = useTemplateStore((s) => s.templates, shallow);
  const addTpl = useTemplateStore((s) => s.add);
  const updateTpl = useTemplateStore((s) => s.update);
  const removeTpl = useTemplateStore((s) => s.remove);
  const [openAdd, setOpenAdd] = useState(false);
  const [editTpl, setEditTpl] = useState<any>(null);

  const columns: ColumnsType<any> = [
    { title: '模板名称', dataIndex: 'name', width: 200, render: (v: string) => <span className="field-label">{v}</span> },
    {
      title: '字段',
      dataIndex: 'fields',
      render: (v: any[]) => (Array.isArray(v) ? v.map((x: any) => <Tag key={x.key} color="blue">{x.label}({x.type})</Tag>) : null)
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => setEditTpl(record)}>编辑</Button>
          <Popconfirm title="确认删除该模板?" onConfirm={() => removeTpl(record.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className={styles.sectionTitle}>
        <span>共 {templates.length} 个模板</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenAdd(true)}>新增模板</Button>
      </div>
      <div className={styles.resizableTableWrap}>
        <Table rowKey="id" columns={columns} dataSource={templates} pagination={false} size="middle" scroll={{ x: 900 }} />
      </div>
      <TemplateModal open={openAdd} onClose={() => setOpenAdd(false)} onSubmit={(data) => { addTpl(data); setOpenAdd(false); message.success('已添加模板'); }} />
      <TemplateModal open={!!editTpl} edit template={editTpl} onClose={() => setEditTpl(null)} onSubmit={(data) => { updateTpl(data); setEditTpl(null); message.success('已更新'); }} />
    </div>
  );
}

function TemplateModal({ open, onClose, onSubmit, edit, template }: { open: boolean; onClose: () => void; onSubmit: (data: any) => void; edit?: boolean; template?: any }) {
  const [form] = Form.useForm();
  const [fieldDefs, setFieldDefs] = useState<Array<{ key: string; label: string; type: string }>>([]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (edit && template) {
        form.setFieldsValue({ name: template.name });
        setFieldDefs(template.fields || []);
      } else {
        setFieldDefs([{ key: 'summary', label: '摘要', type: 'text' }]);
      }
    }
  }, [open]);

  const updateField = (idx: number, patch: any) => setFieldDefs((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  const removeField = (idx: number) => setFieldDefs((prev) => prev.filter((_, i) => i !== idx));
  const addField = () => setFieldDefs((prev) => [...prev, { key: 'field' + (prev.length + 1), label: '新字段', type: 'text' }]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (fieldDefs.length === 0) {
        message.warning('至少需要一个字段');
        return;
      }
      for (const f of fieldDefs) {
        if (!f.key || !f.label) {
          message.warning('字段 Key 和名称不能为空');
          return;
        }
      }
      onSubmit({ id: edit ? template.id : undefined, name: values.name, fields: fieldDefs });
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal title={edit ? '编辑模板' : '新增模板'} open={open} onCancel={onClose} onOk={handleOk} okText="保存" cancelText="取消" width={640} centered>
      <Form form={form} layout="vertical">
        <Form.Item label="模板名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="例如：客户沟通进展" />
        </Form.Item>
        <Form.Item label="字段定义">
          <div>
            {fieldDefs.map((f, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, padding: 10, borderRadius: 10, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.08)' }}>
                <Input placeholder="Key" value={f.key} onChange={(e) => updateField(idx, { key: e.target.value })} style={{ width: 140 }} />
                <Input placeholder="名称" value={f.label} onChange={(e) => updateField(idx, { label: e.target.value })} style={{ width: 160 }} />
                <Select value={f.type} onChange={(v) => updateField(idx, { type: v })} style={{ width: 130 }}>
                  <Option value="text">文本</Option>
                  <Option value="textarea">多行</Option>
                  <Option value="date">日期</Option>
                </Select>
                <Button danger size="small" onClick={() => removeField(idx)}>删除</Button>
              </div>
            ))}
            <Button size="small" icon={<PlusOutlined />} onClick={addField}>添加字段</Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}

function JumperConfigPanel() {
  const personTemplate = useJumperStore((s) => s.personTemplate);
  const groupTemplate = useJumperStore((s) => s.groupTemplate);
  const save = useJumperStore((s) => s.save);
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ personTemplate, groupTemplate });
  }, [personTemplate, groupTemplate, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await save({ personTemplate: values.personTemplate || '', groupTemplate: values.groupTemplate || '' });
      message.success('跳转配置已保存');
    } catch (_e) { /* ignore */ }
  };

  const handleTest = async (mode: 'person' | 'group') => {
    try {
      const values = form.getFieldsValue();
      const tpl = mode === 'group' ? values.groupTemplate : values.personTemplate;
      if (!tpl) {
        message.warning('请先填写对应模板');
        return;
      }
      const testValue = mode === 'group' ? '测试群 x1234567' : '测试员 x0012345';
      const r = await window.api.executeJump(testValue, mode);
      if (r.ok) {
        message.success(`执行成功：${r.command}`);
      } else {
        message.error(r.error || '执行失败');
      }
    } catch (e: any) {
      message.error(e.message);
    }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div className={styles.uiCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div className="stat-icon-badge" style={{ width: 32, height: 32, borderRadius: 9 }}><LinkOutlined /></div>
          <div className={styles.uiCardTitle} style={{ margin: 0, letterSpacing: '-0.01em' }}>跳转命令配置</div>
        </div>
        <div className={styles.uiCardSub} style={{ marginBottom: 16 }}>
          配置跳转命令模板。模板中使用 <code>{'{id}'}</code> 表示从字段值中提取的工号/号码，使用 <code>{'{value}'}</code> 表示完整字段值。
          <br />支持 http(s) 链接（会用浏览器打开）或系统命令（如 cmd、powershell 等）。
        </div>

        <Form form={form} layout="vertical">
          <Form.Item label="跳转个人模板" name="personTemplate">
            <TextArea rows={3} placeholder={'例如：cmd /c start "wemeet://user/{id}"'} />
          </Form.Item>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button size="small" onClick={() => handleTest('person')}>测试跳转个人</Button>
          </div>

          <Form.Item label="跳转群模板" name="groupTemplate">
            <TextArea rows={3} placeholder={'例如：cmd /c start "wemeet://group/{id}"'} />
          </Form.Item>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button size="small" onClick={() => handleTest('group')}>测试跳转群</Button>
          </div>

          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存配置</Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

function AiConfigPanel() {
  const config = useAiStore((s) => s.config);
  const save = useAiStore((s) => s.save);
  const [form] = Form.useForm();

  useEffect(() => {
    if (config) {
      form.setFieldsValue({ apiUrl: config.apiUrl, apiKey: config.apiKey, model: config.model, promptTemplate: config.promptTemplate });
    }
  }, [config]);

  const handleSave = async () => {
    const v = form.getFieldsValue();
    await save(v);
    message.success('AI 配置已保存');
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <div className={styles.gradientCard}>
        <span className={styles.labelText}>AI 提取能力</span>
        <div className={styles.bodyText}>
          粘贴聊天记录、会议纪要或其他原始文本，AI 将自动提取关键信息并记录为进展条目。
          返回 JSON 需包含字段：summary、currentStatus、issues、nextActions。
        </div>
      </div>
      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <Form.Item label="API 地址" name="apiUrl">
            <Input placeholder="https://api.example.com/v1/chat/completions" />
          </Form.Item>
          <Form.Item label="模型名称" name="model">
            <Input placeholder="gpt-4o-mini" />
          </Form.Item>
        </div>
        <Form.Item label="API Key" name="apiKey">
          <Input.Password placeholder="输入密钥" autoComplete="new-password" />
        </Form.Item>
        <Form.Item label="提示词模板（返回 JSON，需包含 summary、currentStatus、issues、nextActions 字段）" name="promptTemplate">
          <TextArea rows={10} placeholder={'请从以下聊天记录提取进展信息，并严格以 JSON 返回：\n{"summary": "...", "currentStatus": "...", "issues": ["..."], "nextActions": ["..."]}\n\n聊天记录：\n{chat_records}'} />
        </Form.Item>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存配置</Button>
      </Form>
    </div>
  );
}

function ImportExportPanel() {
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('overwrite');

  const handleExport = async () => {
    try {
      const res = await window.api.showSaveDialog({ title: '导出 Excel', defaultPath: 'projects.xlsx', filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
      if (res.canceled || !res.filePath) return;
      await window.api.exportExcel(res.filePath);
      message.success('Excel 已导出：' + res.filePath);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleExportAttachments = async () => {
    try {
      const res = await window.api.showSaveDialog({ title: '导出附件', defaultPath: 'attachments.zip', filters: [{ name: 'ZIP', extensions: ['zip'] }] });
      if (res.canceled || !res.filePath) return;
      await window.api.exportAttachments(res.filePath);
      message.success('附件 ZIP 已导出：' + res.filePath);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleImport = async () => {
    try {
      const res = await window.api.showOpenDialog({ title: '选择 Excel 文件', properties: ['openFile'], filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
      if (res.canceled || !res.filePaths || res.filePaths.length === 0) return;
      await window.api.importExcel(res.filePaths[0], importMode);
      message.success('数据已导入');
      useProjectStore.getState().load();
      useFieldStore.getState().load();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleImportAttachments = async () => {
    try {
      const res = await window.api.showOpenDialog({ title: '选择附件 ZIP', properties: ['openFile'], filters: [{ name: 'ZIP', extensions: ['zip'] }] });
      if (res.canceled || !res.filePaths || res.filePaths.length === 0) return;
      await window.api.importAttachments(res.filePaths[0]);
      message.success('附件已导入');
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const SectionCard = ({ title, icon, children, description }: { title: string; icon: React.ReactNode; children: React.ReactNode; description?: string }) => (
    <div className={styles.uiCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div className="stat-icon-badge" style={{ width: 32, height: 32, borderRadius: 9 }}>{icon}</div>
        <div className={styles.uiCardTitle} style={{ margin: 0, letterSpacing: '-0.01em' }}>{title}</div>
      </div>
      {description && <div className={styles.uiCardSub}>{description}</div>}
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      <SectionCard
        title="导出数据"
        icon={<ExportOutlined />}
        description="导出全部局点数据及系统配置（字段、模板、知识库、统计图等）为 Excel 文件。如需导出部分局点或筛选结果，请到「总览」页使用导出功能。附件可单独打包为 ZIP。"
      >
        <Space size="middle">
          <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>导出 Excel</Button>
          <Button icon={<ExportOutlined />} onClick={handleExportAttachments}>导出附件 ZIP</Button>
        </Space>
      </SectionCard>

      <SectionCard
        title="导入数据"
        icon={<ImportOutlined />}
        description="从 Excel 或附件 ZIP 中恢复数据。覆盖模式会清空现有数据后导入；追加模式会保留现有记录并新增。"
      >
        <Form layout="vertical">
          <Form.Item label="导入模式">
            <Select value={importMode} onChange={(v) => setImportMode(v)} style={{ width: 280 }}>
              <Option value="overwrite">覆盖（清空现有数据后导入）</Option>
              <Option value="append">追加（保留现有数据，仅新增）</Option>
            </Select>
          </Form.Item>
          <Space size="middle">
            <Button type="primary" icon={<ImportOutlined />} onClick={handleImport}>导入 Excel</Button>
            <Button icon={<ImportOutlined />} onClick={handleImportAttachments}>导入附件 ZIP</Button>
          </Space>
        </Form>
      </SectionCard>
    </div>
  );
}

function UiConfigPanel() {
  const theme = useUiStore((s) => s.theme);
  const tableDensity = useUiStore((s) => s.tableDensity);
  const defaultPage = useUiStore((s) => s.defaultPage);
  const cardOpacity = useUiStore((s) => s.cardOpacity);
  const auroraEnabled = useUiStore((s) => s.auroraEnabled);
  const cardOpacityAlpha = useUiStore((s) => s.cardOpacityAlpha);
  const demoModeEnabled = useUiStore((s) => s.demoModeEnabled);
  const save = useUiStore((s) => s.save);
  const [form] = Form.useForm();

  useEffect(() => {
    document.documentElement.style.setProperty('--aurora-enabled', auroraEnabled ? '1' : '0');
    document.documentElement.style.setProperty('--aurora-opacity', String(cardOpacity));
    document.documentElement.style.setProperty('--card-opacity', String(cardOpacityAlpha));
  }, [auroraEnabled, cardOpacity, cardOpacityAlpha]);

  useEffect(() => {
    form.setFieldsValue({
      theme, tableDensity, defaultPage,
      cardOpacity: Math.round(cardOpacity * 100),
      auroraEnabled,
      cardOpacityAlpha: Math.round(cardOpacityAlpha * 100),
      demoModeEnabled
    });
  }, [theme, tableDensity, defaultPage, cardOpacity, auroraEnabled, cardOpacityAlpha, demoModeEnabled, form]);

  const handleSave = async () => {
    const v = form.getFieldsValue();
    await save({
      theme: v.theme,
      tableDensity: v.tableDensity,
      defaultPage: v.defaultPage,
      cardOpacity: (v.cardOpacity ?? 72) / 100,
      auroraEnabled: !!v.auroraEnabled,
      cardOpacityAlpha: (v.cardOpacityAlpha ?? 82) / 100,
      demoModeEnabled: !!v.demoModeEnabled
    });
    message.success('界面配置已保存');
  };

  const handleToggleDemoMode = async (checked: boolean) => {
    try {
      if (checked) {
        const r = await window.api.generateDemoProjects(100);
        if (r && r.ok) {
          message.success(`已生成 ${r.inserted || 100} 条模拟局点数据`);
        } else {
          message.error('生成模拟数据失败' + (r && r.error ? '：' + r.error : ''));
        }
      } else {
        const r = await window.api.clearDemoProjects();
        if (r && r.ok) {
          message.success(`已清除 ${r.deleted || 0} 条模拟局点数据`);
        } else {
          message.error('清除模拟数据失败' + (r && r.error ? '：' + r.error : ''));
        }
      }
      await save({ demoModeEnabled: checked });
      await useProjectStore.getState().load();
    } catch (e: any) {
      message.error('操作失败：' + e.message);
    }
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <div className={styles.gradientCard}>
        <span className={styles.labelText}>当前偏好</span>
        <div className={styles.bodyText}>
          主题：{theme === 'dark' ? '深色' : '浅色'} ·
          表格密度：{tableDensity === 'small' ? '紧凑' : tableDensity === 'large' ? '宽松' : '舒适'} ·
          默认页：{defaultPage || 'quickAdd'} ·
          极光效果：{auroraEnabled ? '开启' : '关闭'} ·
          卡片透明度：{Math.round(cardOpacityAlpha * 100)}% ·
          极光强度：{Math.round(cardOpacity * 100)}% ·
          调试模式：{demoModeEnabled ? '开启' : '关闭'}
        </div>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item label="默认页面（应用启动后首先展示的页面）" name="defaultPage">
          <Select>
            <Option value="quickAdd">快速添加</Option>
            <Option value="overview">总览</Option>
            <Option value="knowledge">知识库</Option>
            <Option value="statistics">统计</Option>
            <Option value="settings">设置</Option>
          </Select>
        </Form.Item>
        <Form.Item label="主题（需刷新应用）" name="theme">
          <Select>
            <Option value="light">浅色（默认）</Option>
            <Option value="dark">深色</Option>
            <Option value="industrial">工业简约（黑白灰）</Option>
          </Select>
        </Form.Item>
        <Form.Item label="表格密度" name="tableDensity">
          <Select>
            <Option value="small">紧凑</Option>
            <Option value="middle">舒适</Option>
            <Option value="large">宽松</Option>
          </Select>
        </Form.Item>
        <Form.Item label="透明度" name="cardOpacityAlpha">
          <InputNumber min={10} max={100} addonAfter="%" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item label="极光背景效果开关" name="auroraEnabled" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="极光特效强度" name="cardOpacity">
          <InputNumber min={0} max={100} addonAfter="%" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item
          label={<span>调试模式（开启自动生成 100 条模拟局点数据，关闭则清除所有模拟数据）</span>}
          name="demoModeEnabled"
          valuePropName="checked"
        >
          <Switch onChange={handleToggleDemoMode} />
        </Form.Item>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存偏好</Button>
      </Form>
    </div>
  );
}
