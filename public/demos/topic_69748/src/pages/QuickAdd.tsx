import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import { Button, Tag, Switch, Input, Select, DatePicker, Form, Empty, Upload, Popconfirm, message, Tabs, Modal, InputNumber } from 'antd';
import {
  PlusOutlined, ThunderboltOutlined, FolderOpenOutlined, InboxOutlined, DeleteOutlined,
  SearchOutlined, FileTextOutlined, UploadOutlined, PaperClipOutlined, EditOutlined,
  ClockCircleOutlined, CalendarOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useProjectStore, useTemplateStore, useFieldStore } from '../store';
import { shallow } from 'zustand/shallow';
import styles from './QuickAdd.module.css';

const { TextArea } = Input;
const { Option } = Select;

function statusToTag(status?: string): { label: string; color: string } {
  if (!status) return { label: '未设置', color: 'default' };
  const s = status.trim();
  if (/进行中|进行|in progress/i.test(s)) return { label: s, color: 'blue' };
  if (/待处理|待办|pending/i.test(s)) return { label: s, color: 'orange' };
  if (/已完成|完成|done|closed/i.test(s)) return { label: s, color: 'green' };
  if (/异常|问题|issue|blocked/i.test(s)) return { label: s, color: 'red' };
  return { label: s, color: 'default' };
}

const ProjectListItem = memo(function ProjectListItem({
  project,
  active,
  onClick,
  onToggleRecent
}: {
  project: any;
  active: boolean;
  onClick: () => void;
  onToggleRecent: (v: boolean) => void;
}) {
  const statusTag = useMemo(() => statusToTag(project.status), [project.status]);
  const handleClick = useCallback(() => onClick(), [onClick]);
  const handleToggle = useCallback(
    (checked: boolean) => { onToggleRecent(checked); },
    [onToggleRecent]
  );

  return (
    <div
      className={`${styles.projectListItem}${active ? ' ' + styles.projectListItemActive : ''}`}
      onClick={handleClick}
    >
      <div className={styles.pliHead}>
        <div className={styles.pliTitle}>
          <span className={styles.pliName}>{project.name}</span>
          <span className={styles.pliToggle} onClick={(e) => e.stopPropagation()}>
            <Switch size="small" checked={!!project.isRecent} onChange={handleToggle} />
          </span>
        </div>
        <div className={styles.pliSub}>
          {project.customer && <span>{project.customer}</span>}
          <Tag color={statusTag.color} className={styles.pliStatusTag}>{statusTag.label}</Tag>
        </div>
      </div>
    </div>
  );
});

export default function QuickAddPage() {
  const projects = useProjectStore((s) => s.projects, shallow);
  const toggleRecent = useProjectStore((s) => s.toggleRecent);

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  /* 初始化默认选中项：只在首次渲染 + projects 首次有数据时设置
   * 使用 lazy ref 来追踪是否已初始化，避免每次 render 都调用 setActiveProjectId
   * 触发额外重渲染（参考 rerender-derived-state / rerender-lazy-state-init 规则）
   */
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (!activeProjectId && projects.length > 0) {
      const firstRecent = projects.find((p: any) => p.isRecent);
      setActiveProjectId((firstRecent ?? projects[0]).id);
      hasInitializedRef.current = true;
    }
  }, [projects, activeProjectId]);

  // 搜索文本 - 用 useCallback 保持稳定引用
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  }, []);

  // 基于 projects 和搜索文本的派生数据（纯计算，无额外 state）
  const filteredProjects = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return projects;
    const lower = q;
    return projects.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      if (name.includes(lower)) return true;
      const customer = (p.customer || '').toLowerCase();
      if (customer.includes(lower)) return true;
      const status = (p.status || '').toLowerCase();
      return status.includes(lower);
    });
  }, [projects, searchText]);

  const { recentProjects, otherProjects } = useMemo(() => {
    const recent: any[] = [];
    const others: any[] = [];
    for (const p of filteredProjects) {
      if (p.isRecent) recent.push(p); else others.push(p);
    }
    return { recentProjects: recent, otherProjects: others };
  }, [filteredProjects]);

  // 当前选中项目（derived from store + activeProjectId，避免订阅整个数组变化）
  const activeProject = useMemo(
    () => (activeProjectId ? projects.find((p: any) => p.id === activeProjectId) || null : null),
    [projects, activeProjectId]
  );

  // 点击切换 —— 使用 useCallback 保持稳定引用
  const handleSelectProject = useCallback((id: string) => {
    setActiveProjectId(id);
  }, []);

  const handleToggleRecent = useCallback(
    (id: string, v: boolean) => toggleRecent(id, v),
    [toggleRecent]
  );

  return (
    <div className={styles.quickaddLayout}>
      {/* 左侧列表 */}
      <aside className={styles.quickaddSidebar}>
        <div className={styles.quickaddSearch}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索局点…"
            value={searchText}
            onChange={handleSearch}
            allowClear
          />
        </div>

        <div className={styles.quickaddSectionLabel}>最近访问</div>
        <div className={`${styles.quickaddCardList} ${styles.quickaddCardListRecent}`}>
          {recentProjects.length === 0 ? (
            <div className={styles.quickaddEmpty}>打开开关，将常用局点加入</div>
          ) : (
            recentProjects.map((p: any) => (
              <ProjectListItem
                key={p.id}
                project={p}
                active={p.id === activeProjectId}
                onClick={() => handleSelectProject(p.id)}
                onToggleRecent={(v) => handleToggleRecent(p.id, v)}
              />
            ))
          )}
        </div>

        <div className={styles.quickaddSectionLabel}>全部局点</div>
        <div className={`${styles.quickaddCardList} ${styles.quickaddCardListScroll}`}>
          {otherProjects.length === 0 ? (
            <div className={styles.quickaddEmpty}>暂无匹配的局点</div>
          ) : (
            otherProjects.map((p: any) => (
              <ProjectListItem
                key={p.id}
                project={p}
                active={p.id === activeProjectId}
                onClick={() => handleSelectProject(p.id)}
                onToggleRecent={(v) => handleToggleRecent(p.id, v)}
              />
            ))
          )}
        </div>
      </aside>

      {/* 右侧详情 */}
      <section className={styles.quickaddMain}>
        {!activeProject ? (
          <Empty description="请在左侧选择一个局点开始录入" style={{ marginTop: 160 }} />
        ) : (
          <DetailArea project={activeProject} />
        )}
      </section>
    </div>
  );
}

function DetailArea({ project }: { project: any }) {
  const updateProject = useProjectStore((s) => s.update);
  const fields = useFieldStore((s) => s.fields, shallow);
  const templates = useTemplateStore((s) => s.templates, shallow);

  /* ===== 性能优化：
   * 1. 不在切换 project.id 时卸载重建整个组件（已由父组件移除 key 保证）
   * 2. 使用 prevProjectIdRef 检测 project.id 变化，
   *    批量重置所有 state + 拉取新数据，避免多次 setState 触发多次重渲染
   * 3. useMemo / useCallback 使派生计算稳定
   * 参考: rerender-derived-state / rerender-lazy-state-init / rerender-functional-setstate
   */
  const prevProjectIdRef = useRef<string | null>(null);
  const [progressList, setProgressList] = useState<any[]>([]);
  const [mode, setMode] = useState<string>('manual');
  const [selectedTpl, setSelectedTpl] = useState<string>('');
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [aiText, setAiText] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editContent, setEditContent] = useState('');
  // 待保存的附件
  const [pendingAttachPaths, setPendingAttachPaths] = useState<string[]>([]);
  // 进展时间
  const [progressDate, setProgressDate] = useState<Dayjs | null>(dayjs());
  // 完整动态弹窗
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  // 编辑局点弹窗
  const [showProjectEdit, setShowProjectEdit] = useState(false);
  const [projectEditForm] = Form.useForm();
  // 编辑弹窗 - 新增待上传的附件（统一在这里声明，避免 later-use 问题）
  const [editPendingAttachPaths, setEditPendingAttachPaths] = useState<string[]>([]);

  const quickAddFields = useMemo(() => {
    return fields
      .filter((f) => f.showInQuickAdd)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [fields]);

  /* 关键优化：检测 project.id 变化，在单个 effect 中批量重置所有 state 并拉取新数据
   * 这样避免了每次切换项目时父组件的 key 导致整个 DetailArea 全量卸载+重建
   */
  useEffect(() => {
    const currentId = project.id;
    if (prevProjectIdRef.current === currentId) return; // ID 未变，跳过

    prevProjectIdRef.current = currentId;

    // 先异步拉取最新 progress（这是网络/本地 DB 操作，非阻塞）
    (async () => {
      try {
        const p = await window.api.listProgress(currentId);
        setProgressList(p || []);
      } catch (_e) {
        setProgressList([]);
      }
    })();

    // 重置所有输入态 —— 批量 setState，React 19 会自动批处理
    setSelectedTpl('');
    setContent('');
    setAiText('');
    setPendingAttachPaths([]);
    setProgressDate(dayjs());
    setEditingItem(null);
    setEditContent('');
    setEditPendingAttachPaths([]);
    setShowHistoryModal(false);
    setShowProjectEdit(false);
    form.resetFields();
  }, [project.id, form]);

  const tpl = useMemo(() => templates.find((t: any) => t.id === selectedTpl), [templates, selectedTpl]);
  const statusTag = useMemo(() => statusToTag(project.status), [project.status]);

  const refreshProgress = useCallback(async () => {
    const p = await window.api.listProgress(project.id);
    setProgressList(p || []);
  }, [project.id]);

  const handleSaveManual = useCallback(async () => {
    try {
      const values = form.getFieldsValue();
      let finalContent = content.trim();
      if (tpl) {
        const parts: string[] = [];
        for (const f of tpl.fields) {
          const v = values[f.key];
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            parts.push(`${f.label}：${v}`);
          }
        }
        if (parts.length > 0) finalContent = parts.join('\n');
      }
      if (!finalContent) {
        message.warning('请填写进展内容');
        return;
      }
      const createdAt = (progressDate ?? dayjs()).format('YYYY-MM-DD HH:mm');

      const progressId = await window.api.addProgress({
        projectId: project.id,
        content: finalContent,
        type: 'manual',
        template: tpl ? tpl.name : '',
        isReviewed: true,
        createdAt
      });

      if (pendingAttachPaths.length > 0) {
        const progressDateStr = (progressDate ?? dayjs()).format('YYYY-MM-DD');
        const uploadResult = await window.api.uploadAttachments(project.id, pendingAttachPaths, progressId, progressDateStr);
        if (uploadResult && uploadResult.ok) {
          message.success(`进展已保存，已添加 ${pendingAttachPaths.length} 个附件`);
        } else {
          message.success(`进展已保存（附件添加失败）`);
        }
      } else {
        message.success('进展已保存');
      }

      setContent('');
      setPendingAttachPaths([]);
      form.resetFields();
      setSelectedTpl('');
      setProgressDate(dayjs());
      await refreshProgress();
    } catch (e: any) {
      message.error(e.message);
    }
  }, [content, form, tpl, pendingAttachPaths, progressDate, project.id, refreshProgress]);

  const handleSaveAi = useCallback(async () => {
    if (!aiText.trim()) {
      message.warning('请粘贴聊天记录或原始文本');
      return;
    }
    try {
      await window.api.addProgress({
        projectId: project.id,
        content: aiText.trim(),
        type: 'ai',
        template: '',
        isReviewed: true,
        createdAt: (progressDate ?? dayjs()).format('YYYY-MM-DD HH:mm')
      });
      message.success('已保存 AI 提取的进展');
      setAiText('');
      await refreshProgress();
    } catch (e: any) {
      message.error(e.message);
    }
  }, [aiText, project.id, progressDate, refreshProgress]);

  // 提取文件路径（去重，避免多选后出现重复文件）
  const extractPaths = useCallback((fileList: any[]): string[] => {
    const seen = new Set<string>();
    const paths: string[] = [];
    for (const f of fileList) {
      const origin = (f as any).originFileObj;
      const rawPath = origin?.path || (f as any).path;
      if (!rawPath) continue;
      if (seen.has(rawPath)) continue;
      seen.add(rawPath);
      paths.push(rawPath);
    }
    return paths;
  }, []);

  const handleUpload = useCallback((fileList: any[]) => {
    const paths = extractPaths(fileList);
    if (paths.length === 0) return;
    // 再过滤一次，避免和已有 pending 重复
    const existing = new Set(pendingAttachPaths);
    const newPaths = paths.filter((p) => !existing.has(p));
    if (newPaths.length > 0) {
      setPendingAttachPaths((prev) => [...prev, ...newPaths]);
      message.success(`已添加 ${newPaths.length} 个待保存的附件（保存进展后生效）`);
    } else if (paths.length > 0) {
      message.info('这些附件已存在，未重复添加');
    }
  }, [extractPaths, pendingAttachPaths]);

  const handleClearPending = useCallback(() => {
    setPendingAttachPaths([]);
    message.success('已清空待保存的附件');
  }, []);

  const handleDeleteProgress = useCallback(async (id: string) => {
    try {
      await window.api.deleteProgress(project.id, id);
      message.success('已删除');
      setEditingItem(null);
      refreshProgress();
    } catch (e: any) {
      message.error(e.message);
    }
  }, [project.id, refreshProgress]);

  const handleOpenEdit = useCallback((item: any) => {
    setEditingItem(item);
    setEditContent(item.content || '');
    setEditPendingAttachPaths([]);
  }, []);

  const handleEditUpload = useCallback((fileList: any[]) => {
    const paths = extractPaths(fileList);
    if (paths.length === 0) return;
    const existing = new Set(editPendingAttachPaths);
    const newPaths = paths.filter((p) => !existing.has(p));
    if (newPaths.length > 0) {
      setEditPendingAttachPaths((prev) => [...prev, ...newPaths]);
    }
  }, [extractPaths, editPendingAttachPaths]);

  const handleEditAttachDelete = useCallback((id: string) => {
    try {
      window.api.deleteAttachment(id);
      // 从 editingItem 中移除
      setEditingItem((prev: any) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          attachments: (prev.attachments || []).filter((a: any) => a.id !== id)
        };
        return next;
      });
      message.success('附件已删除');
    } catch (e: any) {
      message.error(e.message);
    }
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingItem) return;
    if (!editContent.trim()) {
      message.warning('进展内容不能为空');
      return;
    }
    try {
      const api = window.api as any;
      // 1. 更新 content
      if (typeof api.updateProgress === 'function') {
        await api.updateProgress({ ...editingItem, content: editContent.trim() });
      } else {
        await api.deleteProgress(project.id, editingItem.id);
        await api.addProgress({
          projectId: project.id,
          content: editContent.trim(),
          type: editingItem.type || 'manual',
          template: editingItem.template || '',
          isReviewed: true,
          createdAt: editingItem.createdAt
        });
      }
      // 2. 上传新增的附件（如果有）
      if (editPendingAttachPaths.length > 0) {
        const editProgressDate = editingItem.createdAt ? editingItem.createdAt.slice(0, 10) : undefined;
        await api.uploadAttachments(project.id, editPendingAttachPaths, editingItem.id, editProgressDate);
      }
      message.success('已更新');
      setEditingItem(null);
      setEditPendingAttachPaths([]);
      await refreshProgress();
    } catch (e: any) {
      message.error(e.message);
    }
  }, [editingItem, editContent, editPendingAttachPaths, project.id, refreshProgress]);

  const openProjectEdit = useCallback(() => {
    const vals: any = {};
    const builtinKeys = new Set(['name', 'customer', 'region', 'status', 'currentPhase', 'nextAction', 'imGroup', 'imContact']);
    for (const f of fields) {
      const isBuiltin = builtinKeys.has(f.key);
      const v = isBuiltin ? (project as any)[f.key] : (project.customFields?.[f.key] || '');
      if (f.type === 'date' && v) {
        vals[isBuiltin ? f.key : `custom_${f.key}`] = dayjs(v);
      } else {
        vals[isBuiltin ? f.key : `custom_${f.key}`] = v || undefined;
      }
    }
    projectEditForm.setFieldsValue(vals);
    setShowProjectEdit(true);
  }, [project, projectEditForm, fields]);

  const handleSaveProject = useCallback(async () => {
    try {
      const values = await projectEditForm.validateFields();
      const newData: any = { id: project.id, customFields: {} };
      const builtinKeys = new Set(['name', 'customer', 'region', 'status', 'currentPhase', 'nextAction', 'imGroup', 'imContact']);
      for (const f of fields) {
        const isBuiltin = builtinKeys.has(f.key);
        const key = isBuiltin ? f.key : `custom_${f.key}`;
        const val = values[key];
        if (isBuiltin) {
          if (f.type === 'date' && val && val.format) {
            newData[f.key] = val.format('YYYY-MM-DD');
          } else {
            newData[f.key] = val || '';
          }
        } else {
          if (f.type === 'date' && val && val.format) {
            newData.customFields[f.key] = val.format('YYYY-MM-DD');
          } else {
            newData.customFields[f.key] = val || '';
          }
        }
      }
      newData.name = values.name || '未命名局点';
      await updateProject(newData);
      message.success('已保存局点信息');
      setShowProjectEdit(false);
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message);
    }
  }, [project, projectEditForm, updateProject, fields]);

  const metaParts = useMemo(() => {
    const parts: string[] = [];
    if (project.region) parts.push(`📍 ${project.region}`);
    if (project.manager) parts.push(`👤 负责人：${project.manager}`);
    if (project.deadline) parts.push(`📅 交付期限：${project.deadline}`);
    return parts;
  }, [project.region, project.manager, project.deadline]);

  const stackItems = useMemo(() => (progressList || []).slice(0, 10), [progressList]);

  return (
    <div className={styles.detailScrollV2}>
      {/* 顶部详情卡片 */}
      <div className={styles.detailHeaderV2}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className={styles.detailTitleV2}>{project.name}</h2>
          <div className={styles.detailMetaV2}>
            {metaParts.map((m, i) => (
              <span key={i} className={styles.detailMetaItemV2}>{m}</span>
            ))}
            {project.status && (
              <Tag color={statusTag.color}>{statusTag.label}</Tag>
            )}
            {quickAddFields.map((f) => {
              const val = project.customFields?.[f.key];
              if (!val) return null;
              if (f.type === 'jumper') {
                const mode = f.jumperMode || 'person';
                return (
                  <span
                    key={f.key}
                    className="detail-custom-field-tag"
                    style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}
                    onClick={async () => {
                      try {
                        const r = await window.api.executeJump(val, mode);
                        if (!r.ok) message.error(r.error || '跳转失败');
                      } catch (e: any) {
                        message.error(e.message || '跳转失败');
                      }
                    }}
                    title={`点击${mode === 'group' ? '打开群' : '打开联系人'}`}
                  >
                    {f.label}：<span className={styles.detailCustomFieldValue}>{val}</span>
                  </span>
                );
              }
              return (
                <span key={f.key} className="detail-custom-field-tag">
                  {f.label}：<span className={styles.detailCustomFieldValue}>{val}</span>
                </span>
              );
            })}
          </div>
        </div>
        <Button type="primary" className={styles.detailEditBtn} onClick={openProjectEdit}>
          <EditOutlined /> 编辑详情
        </Button>
      </div>

      {/* 上半部分：历史进展堆叠卡片 */}
      <div className={styles.historyStack}>
        <div className="history-stack-head">
          <h3 className="history-stack-title">历史进展摘要</h3>
          <span
            className={styles.historyStackAction}
            onClick={() => progressList.length > 0 && setShowHistoryModal(true)}
          >
            完整动态 →
          </span>
        </div>

        {stackItems.length === 0 ? (
          <Empty description="还没有进展记录" style={{ padding: '30px 0' }} />
        ) : (
          <div
            className={styles.stackCards}
            data-count={stackItems.length}
          >
            {stackItems.map((item: any, idx: number) => {
              const summaryText = (item.content || '').split('\n').filter((s: string) => s.trim()).slice(0, 2).join(' ');
              const reversedIdx = stackItems.length - 1 - idx; // 0 = latest
              return (
                <div
                  key={item.id}
                  className={styles.stackCard}
                  data-idx={idx}
                  data-reverse={reversedIdx}
                  onClick={() => handleOpenEdit(item)}
                  style={{ zIndex: 60 - idx }}
                >
                  <div className={styles.stackCardInner}>
                    <div className={styles.stackCardTime}>{item.createdAt}</div>
                    <div className={styles.stackCardSummary}>{summaryText || '（无详细内容）'}</div>

                    {(item.attachments && item.attachments.length > 0) ? (
                      <div className={styles.stackCardAttach}>
                        {item.attachments.slice(0, 3).map((att: any, ai: number) => {
                          const isImg = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(att.fileName || '');
                          return (
                            <div key={ai} className={`attach-mini ${isImg ? 'attach-img' : 'attach-file'}`}>
                              {isImg ? (
                                <div className={styles.attachMiniImg}><FileTextOutlined /></div>
                              ) : (
                                <div className="attach-mini-file"><PaperClipOutlined /></div>
                              )}
                              <div className={styles.attachMiniLabel}>
                                {(att.fileName || '附件').slice(0, 18)}
                              </div>
                            </div>
                          );
                        })}
                        {item.attachments.length > 3 && (
                          <div className={styles.attachMore}>+{item.attachments.length - 3}</div>
                        )}
                      </div>
                    ) : (
                      <div className="stack-card-attach stack-card-attach-empty">
                        <span>— 无附件 —</span>
                      </div>
                    )}

                    <div className={styles.stackCardActionRow}>
                      <span className="stack-card-hint">点击编辑</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 下半部分：录入操作区 */}
      <div className={styles.entryPanel}>
        <Tabs
          activeKey={mode}
          onChange={setMode}
          items={[
            { key: 'manual', label: <span><PlusOutlined /> 手动添加进展</span> },
            { key: 'ai', label: <span><ThunderboltOutlined /> AI 自动提取</span> }
          ]}
        />

        {mode === 'manual' && (
          <div className={styles.entryBody}>
            {/* 顶部操作栏：时间选择、附件上传、保存 */}
            <div className="entry-action-bar">
              <div className={styles.entryActionLeft}>
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  value={progressDate}
                  onChange={(v) => setProgressDate(v)}
                  placeholder="选择进展时间"
                  suffixIcon={<ClockCircleOutlined />}
                />
                <Upload
                  multiple
                  fileList={pendingAttachPaths.map((p, i) => ({ uid: `${i}`, name: p.split('/').pop() || p, status: 'done' as const }))}
                  beforeUpload={() => false}
                  onChange={(info) => { if (info.fileList.length > 0) handleUpload(info.fileList); }}
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />}>
                    上传附件 {pendingAttachPaths.length > 0 && <span className={styles.pendingCount}>({pendingAttachPaths.length})</span>}
                  </Button>
                </Upload>
              </div>
              <Button type="primary" size="middle" onClick={handleSaveManual}>
                保存进展
              </Button>
            </div>

            {/* 主体：模板选择 + 自定义字段 + 备注 */}
            <div className={styles.entryMain}>
              <Form form={form} layout="vertical" size="middle">
                <Form.Item label="选择模板">
                  <Select
                    placeholder="选择模板（可选，选择后将显示模板字段）"
                    allowClear
                    value={selectedTpl || undefined}
                    onChange={(v) => setSelectedTpl(v || '')}
                  >
                    {templates.map((t: any) => (
                      <Option key={t.id} value={t.id}>{t.name}</Option>
                    ))}
                  </Select>
                </Form.Item>

                {tpl && tpl.fields && tpl.fields.length > 0 && (
                  <div className="entry-grid-tpl-fields">
                    {tpl.fields.map((f: any) => (
                      <Form.Item key={f.key} label={f.label} name={f.key}>
                        {f.type === 'textarea' ? (
                          <TextArea rows={2} placeholder={`请输入${f.label}…`} />
                        ) : (
                          <Input placeholder={`请输入${f.label}…`} />
                        )}
                      </Form.Item>
                    ))}
                  </div>
                )}

                <Form.Item label="备注信息">
                  <TextArea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="详细描述该阶段的工作内容…"
                  />
                </Form.Item>
              </Form>
            </div>
          </div>
        )}

        {mode === 'ai' && (
          <div className={styles.entryBody}>
            <div className="entry-action-bar">
              <div className={styles.entryActionLeft}>
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  value={progressDate}
                  onChange={(v) => setProgressDate(v)}
                  placeholder="选择进展时间"
                  suffixIcon={<ClockCircleOutlined />}
                />
              </div>
              <Button type="primary" size="middle" onClick={handleSaveAi}>
                保存进展
              </Button>
            </div>

            <div className={styles.entryMain}>
              <div className={styles.aiGradientCard}>
                <div className="ai-label">智能提取</div>
                <div className={styles.aiDesc}>
                  粘贴聊天记录、会议纪要或其他原始文本，AI 将自动提取关键信息并保存为一条进展。
                </div>
              </div>
              <TextArea
                rows={6}
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder={'粘贴聊天记录、邮件或会议纪要内容…'}
                style={{ marginTop: 16 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 编辑进展弹窗 */}
      <Modal
        title="编辑进展"
        open={!!editingItem}
        onCancel={() => setEditingItem(null)}
        onOk={handleSaveEdit}
        okText="保存"
        cancelText="取消"
        width={720}
        centered
      >
        {editingItem && (
          <div>
            <div className={styles.editMeta}>
              <span>{editingItem.createdAt}</span>
              <span style={{ marginLeft: 12 }}>{editingItem.type === 'ai' ? '🤖 AI 提取' : '✍ 手动录入'}</span>
              {editingItem.template && <span style={{ marginLeft: 12 }}>模板：{editingItem.template}</span>}
            </div>
            <TextArea
              rows={8}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{ marginTop: 12 }}
            />

            {/* 附件管理区 */}
            <div className={styles.attachEditBox}>
              <div className={styles.attachEditTitle}>附件管理</div>

              {/* 已有附件 */}
              {editingItem.attachments && editingItem.attachments.length > 0 && (
                <div className={styles.attachEditList}>
                  {editingItem.attachments.map((att: any) => (
                    <div key={att.id} className={styles.attachListItem}>
                      <PaperClipOutlined />
                      <span className={styles.attachListName}>{att.fileName}</span>
                      <Popconfirm title="确认删除该附件?" onConfirm={() => handleEditAttachDelete(att.id)}>
                        <Button type="text" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                      </Popconfirm>
                    </div>
                  ))}
                </div>
              )}

              {/* 新增待上传的附件 */}
              {editPendingAttachPaths.length > 0 && (
                <div className="attach-edit-list attach-edit-list-pending">
                  <div style={{ fontSize: 12, color: 'var(--c-text-muted)', width: '100%', marginBottom: 4 }}>待保存的新附件：</div>
                  {editPendingAttachPaths.map((p, i) => (
                    <div key={i} className="attach-list-item attach-list-item-pending">
                      <PaperClipOutlined />
                      <span className="attach-list-name">{p.split('/').pop()?.split('\\').pop() || p}</span>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => setEditPendingAttachPaths((prev) => prev.filter((_, idx) => idx !== i))}
                      >移除</Button>
                    </div>
                  ))}
                </div>
              )}

              {/* 上传按钮 */}
              <div className={styles.attachEditFooter}>
                <Upload
                  multiple
                  fileList={[]}
                  beforeUpload={() => false}
                  onChange={(info) => { if (info.fileList.length > 0) handleEditUpload(info.fileList); }}
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />}>添加附件</Button>
                </Upload>
                {editPendingAttachPaths.length > 0 && (
                  <Button type="text" size="small" onClick={() => setEditPendingAttachPaths([])}>清空待上传</Button>
                )}
              </div>
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Popconfirm title="确认删除该进展?" onConfirm={() => handleDeleteProgress(editingItem.id)}>
                <Button danger type="text" icon={<DeleteOutlined />}>删除此进展</Button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Modal>

      {/* 完整动态弹窗 */}
      <Modal
        title={`历史进展 — ${progressList.length} 条`}
        open={showHistoryModal}
        onCancel={() => setShowHistoryModal(false)}
        footer={null}
        width={760}
      >
        <div className="full-history-list">
          {progressList.length === 0 ? (
            <Empty description="暂无进展记录" style={{ padding: 40 }} />
          ) : (
            progressList.map((item: any) => {
              const summaryText = (item.content || '').split('\n').filter((s: string) => s.trim()).slice(0, 3).join(' ');
              return (
                <div key={item.id} className="full-history-item">
                  <div className="full-history-head">
                    <div className={styles.fullHistoryMeta}>
                      <span className={styles.fullHistoryDate}>{item.createdAt}</span>
                      <span className={styles.fullHistoryType}>{item.type === 'ai' ? '🤖 AI 提取' : '✍ 手动录入'}</span>
                      {item.template && <span className={styles.fullHistoryType}>· {item.template}</span>}
                    </div>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setShowHistoryModal(false); handleOpenEdit(item); }}>
                      编辑
                    </Button>
                  </div>
                  <div className={styles.fullHistoryContent}>{summaryText || '（无详细内容）'}</div>
                  {item.attachments && item.attachments.length > 0 && (
                    <div className="full-history-attach">
                      {item.attachments.map((att: any) => (
                        <div key={att.id} className="attach-mini">
                          <div className="attach-mini-file"><PaperClipOutlined /></div>
                          <div className={styles.attachMiniLabel}>{(att.fileName || '附件').slice(0, 24)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* 编辑局点弹窗 */}
      <Modal
        title="编辑局点信息"
        open={showProjectEdit}
        onCancel={() => setShowProjectEdit(false)}
        onOk={handleSaveProject}
        okText="保存"
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        <Form form={projectEditForm} layout="vertical" size="middle">
          {fields.map((f: any) => {
            const builtinKeys = new Set(['name', 'customer', 'region', 'status', 'currentPhase', 'nextAction', 'imGroup', 'imContact']);
            const isBuiltin = builtinKeys.has(f.key);
            const name = isBuiltin ? f.key : `custom_${f.key}`;
            const rules = f.key === 'name' ? [{ required: true, message: '请输入局点名称' }] : [];
            return (
              <Form.Item key={name} label={f.label} name={name} rules={rules}>
                {renderFieldInput(f)}
              </Form.Item>
            );
          })}
        </Form>
      </Modal>
    </div>
  );
}

function renderFieldInput(field: any) {
  if (field.type === 'select') return <Select allowClear placeholder="请选择" options={(field.options || []).map((o: string) => ({ label: o, value: o }))} />;
  if (field.type === 'date') return <DatePicker style={{ width: '100%' }} />;
  if (field.type === 'number') return <InputNumber style={{ width: '100%' }} />;
  if (field.type === 'textarea') return <Input.TextArea rows={3} />;
  return <Input placeholder={`请输入${field.label}`} />;
}
