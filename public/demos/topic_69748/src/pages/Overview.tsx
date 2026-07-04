import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import {
  Button, Table, Modal, Form, Input, Select, DatePicker, Space, Tag,
  message, Drawer, List, Popconfirm, Switch, InputNumber, Tooltip, Upload,
  Typography, Empty, Row, Col, Collapse
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, SettingOutlined,
  FolderOpenOutlined, UploadOutlined, InboxOutlined, SearchOutlined,
  FilterOutlined, CloseOutlined, ExportOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useProjectStore, useFieldStore, useUiStore } from '../store';
import { shallow } from 'zustand/shallow';
import type { FieldConfig, Project } from '../types';
import styles from './Overview.module.css';

const { TextArea } = Input;
const { Option } = Select;

/* 性能优化：RecentSwitch 的 handleChange 只依赖 record.id + isRecent 的原始值
 * 这样避免 record 对象整体变化时重建回调
 * 参考: rerender-derived-state - 订阅派生标量而非对象
 */
const RecentSwitch = memo(function RecentSwitch({
  record,
  updateProject
}: {
  record: Project;
  updateProject: (p: Project) => void;
}) {
  const id = record.id;
  const isRecent = !!(record as any).isRecent;

  const handleChange = useCallback((checked: boolean) => {
    // 只重建需要变化的字段，避免整条 record 对象重建时产生额外计算
    updateProject({ ...record, isRecent: checked });
  }, [id, isRecent, record, updateProject]);

  return <Switch size="small" checked={isRecent} onChange={handleChange} />;
});

const AttachmentList = memo(function AttachmentList({
  project,
  onRefresh
}: { project: Project; onRefresh?: () => void }) {
  const [list, setList] = useState<any[]>([]);

  const refresh = useCallback(() => {
    window.api.listAttachments(project.id).then(setList);
  }, [project.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUpload = useCallback(async (fileList: any[]) => {
    const seen = new Set<string>();
    const paths: string[] = [];
    for (const f of fileList) {
      const origin = f.originFileObj || f;
      const p = origin.path;
      if (p && !seen.has(p)) { seen.add(p); paths.push(p); }
    }
    if (paths.length === 0) return;
    await window.api.uploadAttachments(project.id, paths);
    message.success(`已添加 ${paths.length} 个附件`);
    refresh();
  }, [project.id, refresh]);

  const handleDelete = useCallback(async (id: string) => {
    await window.api.deleteAttachment(id);
    message.success('已删除');
    refresh();
  }, [refresh]);

  const handleOpenFolder = useCallback(async (filePath: string) => {
    const dir = filePath.replace(/[\\/][^\\/]*$/, '') || filePath;
    const r = await window.api.openPath(dir);
    if (!r?.ok) message.warning('无法打开目录');
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Upload.Dragger
        multiple
        fileList={[]}
        beforeUpload={() => false}
        onChange={(info) => {
          if (info.fileList.length > 0) handleUpload(info.fileList);
        }}
        showUploadList={false}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text" style={{ fontWeight: 600, fontSize: 15 }}>拖拽或点击选择文件</p>
        <p className="ant-upload-hint" style={{ color: '#94a3b8', fontSize: 12 }}>支持批量上传多个文件</p>
      </Upload.Dragger>

      {list.length === 0 ? (
        <Empty description="暂无附件" />
      ) : (
        <List
          dataSource={list}
          renderItem={(item: any) => (
            <List.Item
              style={{
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 8,
                background: 'rgba(99,102,241,0.04)',
                border: '1px solid rgba(99,102,241,0.08)'
              }}
              actions={[
                <Tooltip key="folder" title="打开所在目录">
                  <Button size="small" onClick={() => handleOpenFolder(item.filePath)}>
                    <FolderOpenOutlined />目录
                  </Button>
                </Tooltip>,
                <Popconfirm key="del" title="确认删除?" onConfirm={() => handleDelete(item.id)}>
                  <Button size="small" danger>删除</Button>
                </Popconfirm>
              ]}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>📄 {item.fileName}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                  {item.fileType} · {(item.fileSize / 1024).toFixed(1)} KB · {item.createdAt}
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
      {onRefresh && <Button type="link" size="small" onClick={onRefresh} style={{ alignSelf: 'flex-end' }}>完成</Button>}
    </div>
  );
});

const DeleteAction = memo(function DeleteAction({ record, removeProject }: { record: Project; removeProject: (id: string) => void }) {
  const handleConfirm = useCallback(() => removeProject(record.id), [record.id, removeProject]);
  return (
    <Popconfirm title="确认删除该局点?" onConfirm={handleConfirm} okText="删除" cancelText="取消">
      <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
    </Popconfirm>
  );
});

interface AdvancedFilter {
  name?: string;
  customer?: string;
  status?: string;
  region?: string;
  manager?: string;
  onlyRecent?: boolean;
  customFields: Record<string, string>;
}

const BUILTIN_FIELD_KEYS = new Set(['name', 'customer', 'region', 'status']);
const EMPTY_FILTER: AdvancedFilter = { customFields: {} };

export default function OverviewPage() {
  const projects = useProjectStore((s) => s.projects, shallow);
  const addProject = useProjectStore((s) => s.add);
  const updateProject = useProjectStore((s) => s.update);
  const removeProject = useProjectStore((s) => s.remove);
  const fields = useFieldStore((s) => s.fields, shallow);
  const tableDensity = useUiStore((s) => s.tableDensity);

  const [openAdd, setOpenAdd] = useState(false);
  const [openColCfg, setOpenColCfg] = useState(false);
  // 性能优化：将 colWidths 分为 state（渲染用）和 ref（拖动中读最新值）
  // 拖动过程中用 DOM 操作 + ref 更新，不触发 React 重渲染
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const colWidthsRef = useRef<Record<string, number>>({}); // 实时的最新值
  colWidthsRef.current = colWidths; // 同步 ref 到 state
  const resizingColRef = useRef<{ key: string; startX: number; startWidth: number; headerEl: HTMLElement | null } | null>(null);
  const rafRef = useRef<number | null>(null);
  const tableWrapRef = useRef<HTMLDivElement | null>(null);

  const [searchText, setSearchText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState<AdvancedFilter>(EMPTY_FILTER);

  // 编辑弹窗
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm] = Form.useForm();

  // 分页
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12 });

  const { allFields, visibleKeys } = useMemo(() => {
    const all = fields
      .filter((f) => f.key !== 'isRecent')
      .sort((a, b) => a.orderIndex - b.orderIndex);
    return {
      allFields: all,
      visibleKeys: new Set(all.filter((f) => f.visible).map((f) => f.key))
    };
  }, [fields]);

  // 性能优化：拖动过程中直接操作 DOM，不触发 React 重渲染
  // 参考 rerender-move-effect-to-event：将高频变化从状态中分离
  const startResize = useCallback((key: string, defaultWidth: number) => (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset?.resizeHandle === 'true') {
      // 找到目标表头的 th 元素（向上遍历）
      const handleEl = e.target as HTMLElement;
      const headerEl = handleEl.closest('th') as HTMLElement | null;
      if (!headerEl) return;
      const colIndex = Array.from(headerEl.parentElement?.children || []).indexOf(headerEl);
      if (colIndex < 0) return;

      const startW = colWidthsRef.current[key] ?? defaultWidth;
      resizingColRef.current = { key, startX: e.clientX, startWidth: startW, headerEl };

      e.preventDefault();
      e.stopPropagation();

      const onMove = (ev: MouseEvent) => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const info = resizingColRef.current;
          if (!info) return;
          const diff = ev.clientX - info.startX;
          const newWidth = Math.max(60, Math.min(500, info.startWidth + diff));

          // 1) 更新 ref（不触发重渲染）
          colWidthsRef.current = { ...colWidthsRef.current, [info.key]: newWidth };

          // 2) 直接操作 DOM：找到 table 内对应列的所有 th/td，直接设置 width
          if (!tableWrapRef.current) return;
          const cells = tableWrapRef.current.querySelectorAll(`tr > *:nth-child(${colIndex + 1})`);
          cells.forEach((cell) => {
            (cell as HTMLElement).style.width = `${newWidth}px`;
            (cell as HTMLElement).style.minWidth = `${newWidth}px`;
            (cell as HTMLElement).style.maxWidth = `${newWidth}px`;
          });
        });
      };

      const onUp = () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        const info = resizingColRef.current;
        resizingColRef.current = null;
        document.body.classList.remove('col-resizing');
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);

        // 3) 拖动结束时：只更新一次 state（持久化到 React）
        if (info) {
          const finalWidth = colWidthsRef.current[info.key] ?? info.startWidth;
          setColWidths((prev) => {
            if (prev[info.key] === finalWidth) return prev;
            return { ...prev, [info.key]: finalWidth };
          });
        }
      };

      document.body.classList.add('col-resizing');
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
  }, []);

  const filteredProjects = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return projects.filter((p: Project) => {
      // 简单搜索
      if (keyword) {
        const haystack = [
          p.name, p.customer, p.status, p.region, p.manager,
          ...Object.values(p.customFields || {}).map((v) => v || '')
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      // 高级过滤
      if (advancedFilter.name && !String(p.name).toLowerCase().includes(advancedFilter.name.toLowerCase())) return false;
      if (advancedFilter.customer && !String(p.customer).toLowerCase().includes(advancedFilter.customer.toLowerCase())) return false;
      if (advancedFilter.status && p.status !== advancedFilter.status) return false;
      if (advancedFilter.region && !String(p.region).toLowerCase().includes(advancedFilter.region.toLowerCase())) return false;
      if (advancedFilter.manager && !String(p.manager).toLowerCase().includes(advancedFilter.manager.toLowerCase())) return false;
      if (advancedFilter.onlyRecent && !(p as any).isRecent) return false;
      for (const key in advancedFilter.customFields) {
        const v = advancedFilter.customFields[key];
        if (!v) continue;
        const pv = (p.customFields || {})[key] || '';
        if (!String(pv).toLowerCase().includes(v.toLowerCase())) return false;
      }
      return true;
    });
  }, [projects, searchText, advancedFilter]);

  const statusOptions = useMemo(() => {
    const s = new Set<string>();
    for (const p of projects) {
      if ((p as any).status) s.add((p as any).status);
    }
    return Array.from(s);
  }, [projects]);

  const columns = useMemo(() => {
    const cols: any[] = [];

    const resizeTitle = (title: React.ReactNode) => (
      <span className={styles.colTitleWrap}>
        {title}
        <span className={styles.colResizeHandle} data-resize-handle="true" />
      </span>
    );

    const addResizableColumn = (col: any) => {
      const key = String(col.key);
      const defaultWidth = Number(col.width) || 140;
      const width = colWidths[key] ?? defaultWidth;
      return { ...col, width, onHeaderCell: () => ({ onMouseDown: startResize(key, defaultWidth) }), title: resizeTitle(col.title) };
    };

    for (const field of allFields) {
      if (!visibleKeys.has(field.key)) continue;
      const isBuiltin = BUILTIN_FIELD_KEYS.has(field.key);
      const dataIndex = isBuiltin ? field.key : `custom_${field.key}`;
      const key = isBuiltin ? field.key : `custom_${field.key}`;
      const width = field.key === 'name' ? 200 : 140;
      cols.push(addResizableColumn({
        title: field.label,
        dataIndex,
        key,
        width,
        render: (_val: any, record: Project) => {
          const cellValue = isBuiltin ? (record as any)[field.key] ?? '' : (record.customFields?.[field.key] ?? '');
          if (field.key === 'status' && cellValue) return <Tag color="blue">{cellValue}</Tag>;
          if (!cellValue) return <span style={{ color: '#94a3b8' }}>—</span>;
          if (field.type === 'jumper') {
            const mode = field.jumperMode || 'person';
            return (
              <a
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const r = await window.api.executeJump(cellValue, mode);
                    if (!r.ok) message.error(r.error || '跳转失败');
                  } catch (e2: any) {
                    message.error(e2.message || '跳转失败');
                  }
                }}
                title={`点击${mode === 'group' ? '打开群' : '打开联系人'}`}
              >
                {cellValue}
              </a>
            );
          }
          return cellValue;
        }
      }));
    }

    cols.push(addResizableColumn({
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160
    }));

    return cols;
  }, [allFields, visibleKeys, startResize, colWidths]);
  // colWidths 现在仅在拖动结束时更新一次，不会触发高频重渲染

  const openEditProject = useCallback((record: Project) => {
    const vals: any = {};
    for (const f of allFields) {
      const isBuiltin = BUILTIN_FIELD_KEYS.has(f.key);
      const v = isBuiltin ? (record as any)[f.key] : (record.customFields?.[f.key] || '');
      if (f.type === 'date' && v) {
        vals[isBuiltin ? f.key : `custom_${f.key}`] = dayjs(v);
      } else {
        vals[isBuiltin ? f.key : `custom_${f.key}`] = v || undefined;
      }
    }
    editForm.setFieldsValue(vals);
    setEditingProject(record);
  }, [allFields, editForm]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingProject) return;
    try {
      const values = await editForm.validateFields();
      const data: any = { id: editingProject.id, customFields: {} };
      for (const key in values) {
        if (key.startsWith('custom_')) {
          const ck = key.substring('custom_'.length);
          data.customFields[ck] = values[key] || '';
        } else if (values[key] instanceof dayjs || (values[key] && values[key].format)) {
          data[key] = values[key].format('YYYY-MM-DD');
        } else {
          data[key] = values[key] || '';
        }
      }
      data.name = values.name || '未命名局点';
      await updateProject(data);
      message.success('已保存');
      setEditingProject(null);
    } catch (e) {
      // ignore
    }
  }, [editingProject, editForm, updateProject]);

  const handleExport = useCallback(async () => {
    try {
      const res = await window.api.showSaveDialog({
        title: '导出 Excel',
        defaultPath: `局点数据_${dayjs().format('YYYYMMDD')}.xlsx`,
        filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }]
      });
      if (!res.filePath) return;
      const r = await window.api.exportExcel(res.filePath, filteredProjects);
      if (r.ok) {
        message.success(`已导出 ${filteredProjects.length} 条数据`);
      } else {
        message.error(r.error || '导出失败');
      }
    } catch (e: any) {
      message.error(e.message || '导出失败');
    }
  }, [filteredProjects]);

  const [attachmentDrawerProject, setAttachmentDrawerProject] = useState<Project | null>(null);
  const openAttachmentDrawer = useCallback((record: Project) => {
    setAttachmentDrawerProject(record);
  }, []);

  const actionCol: any = useMemo(() => ({
    title: '操作',
    key: 'actions',
    width: 260,
    fixed: 'right',
    align: 'center',
    onCell: () => ({ style: { background: 'var(--c-card-bg-opaque)' } }),
    onHeaderCell: () => ({ style: { background: 'var(--c-card-bg-opaque)' } }),
    render: (_: any, record: Project) => (
      <Space size="small" style={{ width: '100%', justifyContent: 'center' }}>
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => openEditProject(record)}
        >
          编辑
        </Button>
        <Space size={2} align="center">
          <span style={{ fontSize: 12, color: '#64748b' }}>近期</span>
          <RecentSwitch record={record} updateProject={updateProject} />
        </Space>
        <Popconfirm title="管理该项目的附件?" onConfirm={() => openAttachmentDrawer(record)} okText="打开" cancelText="取消">
          <Button size="small" icon={<FolderOpenOutlined />}>附件</Button>
        </Popconfirm>
        <DeleteAction record={record} removeProject={removeProject} />
      </Space>
    )
  }), [removeProject, updateProject, openEditProject, openAttachmentDrawer]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>局点总览</h2>
        <div className={styles.pageSubtitle}>共 {projects.length} 个局点 · 当前显示 {filteredProjects.length} 条</div>
      </div>

      {/* 搜索工具栏 */}
      <div className={styles.searchBarWrap}>
        <div className={styles.searchBar}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索局点名称、客户、经理、状态、自定义字段..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ flex: 1, minWidth: 240 }}
          />
          <Button
            icon={<FilterOutlined />}
            type={showAdvanced ? 'primary' : 'default'}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            高级过滤
          </Button>
          <div style={{ flex: 1 }} />
          <Tooltip title="导出当前筛选结果为 Excel">
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
          </Tooltip>
          <Tooltip title="配置表格显示的列和顺序">
            <Button icon={<SettingOutlined />} onClick={() => setOpenColCfg(true)}>列设置</Button>
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenAdd(true)}>新增局点</Button>
        </div>

        {showAdvanced && (
          <div className={styles.advancedFilterCard}>
            <Row gutter={[12, 10]}>
              <Col xs={24} sm={12} md={6}>
                <div className={styles.filterLabel}>局点名称</div>
                <Input
                  value={advancedFilter.name || ''}
                  placeholder="模糊匹配"
                  onChange={(e) => setAdvancedFilter({ ...advancedFilter, name: e.target.value })}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div className={styles.filterLabel}>客户/合作方</div>
                <Input
                  value={advancedFilter.customer || ''}
                  placeholder="模糊匹配"
                  onChange={(e) => setAdvancedFilter({ ...advancedFilter, customer: e.target.value })}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div className={styles.filterLabel}>状态</div>
                <Select
                  value={advancedFilter.status || undefined}
                  placeholder="选择状态"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(v) => setAdvancedFilter({ ...advancedFilter, status: v || '' })}
                >
                  {statusOptions.map((s) => (
                    <Option key={s} value={s}>{s}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div className={styles.filterLabel}>地区</div>
                <Input
                  value={advancedFilter.region || ''}
                  placeholder="模糊匹配"
                  onChange={(e) => setAdvancedFilter({ ...advancedFilter, region: e.target.value })}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div className={styles.filterLabel}>负责人</div>
                <Input
                  value={advancedFilter.manager || ''}
                  placeholder="模糊匹配"
                  onChange={(e) => setAdvancedFilter({ ...advancedFilter, manager: e.target.value })}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div className={styles.filterLabel}>仅显示近期</div>
                <Switch checked={!!advancedFilter.onlyRecent} onChange={(v) => setAdvancedFilter({ ...advancedFilter, onlyRecent: v })} />
              </Col>
            </Row>
            {allFields.filter((f) => !BUILTIN_FIELD_KEYS.has(f.key)).length > 0 && (
              <>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 12, marginBottom: 8 }}>其他字段</div>
                <Row gutter={[12, 10]}>
                  {allFields.filter((f) => !BUILTIN_FIELD_KEYS.has(f.key)).map((f) => (
                    <Col key={f.key} xs={24} sm={12} md={6}>
                      <div className={styles.filterLabel}>{f.label}</div>
                      <Input
                        value={advancedFilter.customFields[f.key] || ''}
                        placeholder="模糊匹配"
                        onChange={(e) => setAdvancedFilter({
                          ...advancedFilter,
                          customFields: { ...advancedFilter.customFields, [f.key]: e.target.value }
                        })}
                        allowClear
                      />
                    </Col>
                  ))}
                </Row>
              </>
            )}
            <div style={{ marginTop: 14, textAlign: 'right' }}>
              <Button onClick={() => { setAdvancedFilter(EMPTY_FILTER); setSearchText(''); }} icon={<CloseOutlined />}>重置全部条件</Button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.resizableTableWrap} ref={tableWrapRef}>
        <Table
          rowKey="id"
          columns={[...columns, actionCol] as any}
          dataSource={filteredProjects}
          size={tableDensity as any}
          scroll={{ x: 'max-content', y: 'calc(100vh - 360px)' }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredProjects.length,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['8', '12', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 条`,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
            onShowSizeChange: (_current, pageSize) => setPagination({ current: 1, pageSize })
          }}
        />
      </div>

      <Modal
        title="编辑局点"
        open={!!editingProject}
        onCancel={() => setEditingProject(null)}
        onOk={handleSaveEdit}
        okText="保存"
        cancelText="取消"
        width={640}
        centered
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          {allFields.map((field: FieldConfig) => {
            const isBuiltin = BUILTIN_FIELD_KEYS.has(field.key);
            const name = isBuiltin ? field.key : `custom_${field.key}`;
            return (
              <Form.Item key={name} label={field.label} name={name} rules={field.key === 'name' ? [{ required: true, message: '请输入局点名称' }] : []}>
                {renderFieldInput(field)}
              </Form.Item>
            );
          })}
        </Form>
      </Modal>

      <AddProjectModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        fields={allFields}
        onSubmit={async (data: any) => {
          await addProject(data);
          message.success('局点已添加');
          setOpenAdd(false);
        }}
      />

      <ColumnConfigDrawer open={openColCfg} onClose={() => setOpenColCfg(false)} />

      {attachmentDrawerProject && (
        <Drawer
          title={`📎 附件管理 · ${attachmentDrawerProject.name}`}
          open={!!attachmentDrawerProject}
          onClose={() => setAttachmentDrawerProject(null)}
          width={520}
          placement="right"
          destroyOnClose
        >
          <AttachmentList project={attachmentDrawerProject} onRefresh={() => setAttachmentDrawerProject(null)} />
        </Drawer>
      )}
    </div>
  );
}

function AddProjectModal({ open, onClose, onSubmit, fields }: {
  open: boolean; onClose: () => void; onSubmit: (data: any) => void;
  fields: FieldConfig[];
}) {
  const [form] = Form.useForm();
  useEffect(() => {
    if (open) form.resetFields();
  }, [open]);

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const data: any = { customFields: {} };
      for (const key in values) {
        if (key.startsWith('custom_')) {
          const ck = key.substring('custom_'.length);
          data.customFields[ck] = values[key] || '';
        } else if (values[key] instanceof dayjs || (values[key] && values[key].format)) {
          data[key] = values[key].format('YYYY-MM-DD');
        } else {
          data[key] = values[key] || '';
        }
      }
      data.name = values.name || '未命名局点';
      onSubmit(data);
    } catch (e) {
      // ignore
    }
  }, [form, onSubmit]);

  return (
    <Modal title="新增局点" open={open} onCancel={onClose} onOk={handleOk} okText="保存" cancelText="取消" width={640} centered>
      <Form form={form} layout="vertical">
        {fields.map((field: FieldConfig) => {
          const isBuiltin = BUILTIN_FIELD_KEYS.has(field.key);
          const name = isBuiltin ? field.key : `custom_${field.key}`;
          return (
            <Form.Item key={name} label={field.label} name={name} rules={field.key === 'name' ? [{ required: true, message: '请输入局点名称' }] : []}>
              {renderFieldInput(field)}
            </Form.Item>
          );
        })}
      </Form>
    </Modal>
  );
}

function renderFieldInput(field: FieldConfig) {
  if (field.type === 'select') return <Select allowClear placeholder="请选择" options={(field.options || []).map((o: string) => ({ label: o, value: o }))} />;
  if (field.type === 'date') return <DatePicker style={{ width: '100%' }} />;
  if (field.type === 'number') return <InputNumber style={{ width: '100%' }} />;
  if (field.type === 'textarea') return <TextArea rows={3} />;
  return <Input placeholder={`请输入${field.label}`} />;
}

function ColumnConfigDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fields = useFieldStore((s) => s.fields, shallow);
  const updateField = useFieldStore((s) => s.update);
  const [local, setLocal] = useState<FieldConfig[]>(fields);

  useEffect(() => { if (open) setLocal(fields); }, [open, fields]);

  const handleVisibleChange = useCallback((key: string, visible: boolean) => {
    setLocal((prev) => prev.map((p) => (p.key === key ? { ...p, visible } : p)));
    const target = fields.find((f) => f.key === key);
    if (target) updateField({ ...target, visible });
  }, [fields, updateField]);

  const handleOrderChange = useCallback((key: string, orderIndex: number) => {
    setLocal((prev) => prev.map((p) => (p.key === key ? { ...p, orderIndex } : p)));
    const target = fields.find((f) => f.key === key);
    if (target) updateField({ ...target, orderIndex });
  }, [fields, updateField]);

  const allList = useMemo(() => [...local].sort((a, b) => a.orderIndex - b.orderIndex), [local]);

  return (
    <Drawer title="⚙ 列配置" open={open} onClose={onClose} width={520} placement="right">
      <Typography.Text style={{ color: '#64748b', fontSize: 13, display: 'block', marginBottom: 16 }}>调整字段的显示状态与排序。数字越小越靠前。</Typography.Text>
      <FieldGroup title="所有字段" list={allList} onVisibleChange={handleVisibleChange} onOrderChange={handleOrderChange} />
    </Drawer>
  );
}

const FieldGroup = memo(function FieldGroup({ title, list, onVisibleChange, onOrderChange }: {
  title: string; list: FieldConfig[]; onVisibleChange: (key: string, v: boolean) => void; onOrderChange: (key: string, v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>{title}</div>
      {list.map((f) => (
        <div
          key={f.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(99,102,241,0.04)',
            border: '1px solid rgba(99,102,241,0.06)',
            marginBottom: 6
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{f.label}</div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{f.type} · key: {f.key}</div>
          </div>
          <InputNumber size="small" min={0} max={999} value={f.orderIndex} onChange={(v) => onOrderChange(f.key, Number(v) || 0)} style={{ width: 80, marginRight: 12 }} />
          <Switch size="small" checked={f.visible} onChange={(v) => onVisibleChange(f.key, v)} />
        </div>
      ))}
    </div>
  );
});
