import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Button, Input, List, Modal, Form, Select, Space, Tag, Empty, message, Popconfirm, Drawer } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useKnowledgeStore } from '../store';
import { shallow } from 'zustand/shallow';
import type { KnowledgeCategory, KnowledgeItem } from '../types';
import styles from './Knowledge.module.css';

const { TextArea } = Input;
const { Option } = Select;

const KnowledgeItemRow = memo(function KnowledgeItemRow({
  item,
  onEdit,
  onDelete,
  onView
}: {
  item: KnowledgeItem;
  onEdit: (item: KnowledgeItem) => void;
  onDelete: (id: string) => void;
  onView: (item: KnowledgeItem) => void;
}) {
  return (
    <div className={styles.kbItem}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <FileTextOutlined style={{ color: 'var(--c-primary)', fontSize: 16 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--c-text)', letterSpacing: '-0.01em' }}>{item.title}</div>
          </div>
          <div style={{ color: 'var(--c-text-soft)', fontSize: 13, lineHeight: 1.7, maxHeight: 68, overflow: 'hidden', position: 'relative' }}>
            {item.content}
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {(item.tags && item.tags.length > 0) &&
              item.tags.map((t: string) => (
                <Tag key={t} color="blue" style={{ margin: 0 }}>
                  #{t}
                </Tag>
              ))}
            <span style={{ color: 'var(--c-text-muted)', fontSize: 11, marginLeft: 'auto' }}>{item.updatedAt}</span>
          </div>
        </div>
        <Space size="small" style={{ flexShrink: 0 }}>
          <Button size="small" onClick={() => onView(item)}>查看</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(item)}>编辑</Button>
          <Popconfirm title="确认删除该条目?" onConfirm={() => onDelete(item.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      </div>
    </div>
  );
});

export default function KnowledgePage() {
  const categories = useKnowledgeStore((s) => s.categories, shallow);
  const items = useKnowledgeStore((s) => s.items, shallow);
  const loadItems = useKnowledgeStore((s) => s.loadItems);
  const addItem = useKnowledgeStore((s) => s.addItem);
  const updateItem = useKnowledgeStore((s) => s.updateItem);
  const removeItem = useKnowledgeStore((s) => s.removeItem);
  const addCategory = useKnowledgeStore((s) => s.addCategory);
  const updateCategory = useKnowledgeStore((s) => s.updateCategory);
  const removeCategory = useKnowledgeStore((s) => s.removeCategory);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [openItem, setOpenItem] = useState<KnowledgeItem | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState<KnowledgeCategory | null>(null);
  const [viewingItem, setViewingItem] = useState<KnowledgeItem | null>(null);

  useEffect(() => {
    if (categories.length > 0 && activeCategory === null) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (activeCategory) loadItems(activeCategory);
  }, [activeCategory, loadItems]);

  useEffect(() => {
    if (searchText) {
      window.api.searchKnowledge(searchText, tagFilter).then((rows) => {
        useKnowledgeStore.setState({ items: rows });
      });
    } else if (activeCategory) {
      loadItems(activeCategory);
    }
  }, [searchText, tagFilter, activeCategory, loadItems]);

  const handleOpenNew = useCallback(() => {
    if (!activeCategory) {
      message.warning('请先选择或创建一个分类');
      return;
    }
    setIsNewItem(true);
    setOpenItem({ id: '', categoryId: activeCategory, title: '', content: '', tags: [], filePaths: [], createdAt: '', updatedAt: '' });
  }, [activeCategory]);

  const handleEditItem = useCallback((item: KnowledgeItem) => {
    setIsNewItem(false);
    setOpenItem(item);
  }, []);

  const handleSaveItem = useCallback(async (data: any) => {
    const tags = (data.tags || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (isNewItem) {
      await addItem({ categoryId: activeCategory, title: data.title, content: data.content, tags });
      message.success('已添加新条目');
    } else {
      await updateItem({ id: data.id, categoryId: activeCategory, title: data.title, content: data.content, tags });
      message.success('已更新');
    }
    setOpenItem(null);
  }, [isNewItem, activeCategory, addItem, updateItem]);

  const handleSaveCategory = useCallback(async (data: any) => {
    if (editCategory) {
      await updateCategory({ id: editCategory.id, name: data.name, description: data.description || '', orderIndex: data.orderIndex || 0 });
      message.success('分类已更新');
    } else {
      await addCategory({ name: data.name, description: data.description || '', orderIndex: data.orderIndex || 0 });
      message.success('分类已添加');
    }
    setOpenCategoryModal(false);
    setEditCategory(null);
  }, [editCategory, updateCategory, addCategory]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      if (i.tags) for (const t of i.tags) set.add(t);
    }
    return Array.from(set);
  }, [items]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of items) {
      map[i.categoryId] = (map[i.categoryId] || 0) + 1;
    }
    return map;
  }, [items]);

  const handleSetCategory = useCallback((id: string) => {
    setActiveCategory(id);
    setSearchText('');
    setTagFilter('');
  }, []);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>知识库</h2>
        <div className={styles.pageSubtitle}>{items.length} 条条目 · {categories.length} 个分类</div>
      </div>

      <div className={styles.knowledgeLayout}>
        <div className={styles.knowledgeLeft}>
          <div className={styles.sideTitleRow}>
            <span className={styles.sideTitle}>分类</span>
            <Button type="link" size="small" onClick={() => { setEditCategory(null); setOpenCategoryModal(true); }}>
              管理
            </Button>
          </div>
          {categories.map((c) => {
            const count = categoryCounts[c.id] || 0;
            const isActive = activeCategory === c.id;
            return (
              <div
                key={c.id}
                className={`${styles.kbCategory}${isActive ? ' ' + styles.kbCategoryActive : ''}`}
                onClick={() => handleSetCategory(c.id)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FolderOpenOutlined style={{ fontSize: 13 }} />
                  {c.name}
                </span>
                <span className={styles.kbCount}>{count}</span>
              </div>
            );
          })}
          {categories.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13, padding: 20 }}>暂无分类</div>
          )}
        </div>

        <div className={styles.kbRight}>
          <div className={styles.kbToolbar}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索标题或内容…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 280 }}
                allowClear
              />
              <Select placeholder="按标签筛选" allowClear value={tagFilter || undefined} onChange={(v) => setTagFilter(v || '')} style={{ width: 200 }}>
                {allTags.map((t: string) => (
                  <Option key={t} value={t}>
                    #{t}
                  </Option>
                ))}
              </Select>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenNew}>
              新增条目
            </Button>
          </div>

          {items.length === 0 ? (
            <Empty description={searchText || tagFilter ? '没有符合条件的条目' : activeCategory ? '该分类下暂无条目' : '请先选择一个分类'} style={{ padding: '40px 0' }} />
          ) : (
            items.map((item) => (
              <KnowledgeItemRow
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={removeItem}
                onView={setViewingItem}
              />
            ))
          )}
        </div>
      </div>

      <ItemModal open={!!openItem} item={openItem} isNew={isNewItem} onClose={() => setOpenItem(null)} onSave={handleSaveItem} />

      <CategoryModal
        open={openCategoryModal}
        category={editCategory}
        categories={categories}
        onClose={() => {
          setOpenCategoryModal(false);
          setEditCategory(null);
        }}
        onSave={handleSaveCategory}
        onEdit={(c) => setEditCategory(c)}
        onDelete={async (id) => {
          await removeCategory(id);
          message.success('分类已删除');
        }}
      />

      <ViewItemModal open={!!viewingItem} item={viewingItem} onClose={() => setViewingItem(null)} />
    </div>
  );
}

function ItemModal({ open, item, isNew, onClose, onSave }: { open: boolean; item: KnowledgeItem | null; isNew: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [form] = Form.useForm();
  useEffect(() => {
    if (open) {
      form.resetFields();
      if (item) {
        form.setFieldsValue({
          id: item.id,
          title: item.title,
          content: item.content,
          tags: (item.tags || []).join(', ')
        });
      }
    }
  }, [open, item, form]);

  const handleOk = useCallback(async () => {
    try {
      const v = await form.validateFields();
      onSave(v);
    } catch (e) {
      // ignore
    }
  }, [form, onSave]);

  return (
    <Modal
      title={isNew ? '新增条目' : '编辑条目'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      width={720}
      centered
    >
      <Form form={form} layout="vertical">
        <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="例如：设备升级流程" style={{ fontSize: 15, padding: '8px 12px' }} />
        </Form.Item>
        <Form.Item label="内容" name="content" rules={[{ required: true, message: '请输入内容' }]}>
          <TextArea rows={12} placeholder="输入详细内容，支持纯文本；链接会被识别并可点击打开" style={{ lineHeight: 1.7 }} />
        </Form.Item>
        <Form.Item label="标签（逗号分隔）" name="tags">
          <Input placeholder="例如：网络, 配置, 常见问题" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function CategoryModal({ open, category, categories, onClose, onSave, onEdit, onDelete }: { open: boolean; category: KnowledgeCategory | null; categories: KnowledgeCategory[]; onClose: () => void; onSave: (data: any) => void; onEdit: (c: KnowledgeCategory) => void; onDelete: (id: string) => void }) {
  const [form] = Form.useForm();
  const [tab, setTab] = useState<'list' | 'edit'>(category ? 'edit' : 'list');

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (category) {
        form.setFieldsValue({ name: category.name, description: category.description, orderIndex: category.orderIndex });
      }
      setTab(category ? 'edit' : 'list');
    }
  }, [open, category, form]);

  const handleOk = useCallback(async () => {
    try {
      const v = await form.validateFields();
      onSave({ ...v, id: category?.id });
    } catch (e) {
      // ignore
    }
  }, [form, onSave, category]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
    [categories]
  );

  return (
    <Modal
      title="📚 分类管理"
      open={open}
      onCancel={onClose}
      onOk={tab === 'edit' ? handleOk : undefined}
      okText={tab === 'edit' ? '保存' : undefined}
      cancelText="关闭"
      width={680}
      centered
      footer={tab === 'edit' ? undefined : []}
    >
      <Space style={{ marginBottom: 12 }}>
        <Button type={tab === 'list' ? 'primary' : 'default'} onClick={() => setTab('list')}>分类列表</Button>
        <Button type={tab === 'edit' ? 'primary' : 'default'} onClick={() => { onEdit(null as any); setTab('edit'); }}>{category ? '编辑当前' : '新增分类'}</Button>
      </Space>

      {tab === 'list' && (
        <div>
          {sortedCategories.length === 0 ? (
            <Empty description="暂无分类" />
          ) : (
            <List
              dataSource={sortedCategories}
              renderItem={(c: KnowledgeCategory, index: number) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    marginBottom: 8,
                    background: index % 2 === 0 ? 'rgba(99,102,241,0.04)' : 'transparent',
                    border: '1px solid rgba(99,102,241,0.08)',
                    borderRadius: 12
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                      <FolderOpenOutlined style={{ marginRight: 8, color: '#6366f1' }} />
                      {c.name}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{c.description || '（无描述）'}</div>
                  </div>
                  <Space size="small">
                    <Button size="small" onClick={() => { onEdit(c); setTab('edit'); }}>编辑</Button>
                    <Popconfirm title="确认删除？该分类下的所有条目也会被删除" onConfirm={() => onDelete(c.id)}>
                      <Button size="small" danger>删除</Button>
                    </Popconfirm>
                  </Space>
                </div>
              )}
            />
          )}
        </div>
      )}

      {tab === 'edit' && (
        <Form form={form} layout="vertical">
          <Form.Item label="分类名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如：操作手册" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="简要描述该分类内容" />
          </Form.Item>
          <Form.Item label="排序（数字越小越靠前）" name="orderIndex" initialValue={0}>
            <InputNumber min={0} max={999} style={{ width: 200 }} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

function ViewItemModal({ open, item, onClose }: { open: boolean; item: KnowledgeItem | null; onClose: () => void }) {
  if (!item) return null;

  const contentParts = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    const content = item.content;
    while ((match = urlRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{content.substring(lastIndex, match.index)}</span>);
      }
      const url = match[0];
      parts.push(
        <a
          key={key++}
          href={url}
          onClick={(e) => {
            e.preventDefault();
            window.api.openExternal(url);
          }}
          style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'underline' }}
        >
          {url}
        </a>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push(<span key={key++}>{content.substring(lastIndex)}</span>);
    }
    return parts;
  }, [item.content]);

  return (
    <Modal title={item.title} open={open} onCancel={onClose} footer={[<Button key="close" onClick={onClose}>关闭</Button>]} width={760} centered>
      {(item.tags && item.tags.length > 0) && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {item.tags.map((t: string) => (
            <Tag key={t} color="blue">
              #{t}
            </Tag>
          ))}
        </div>
      )}
      <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.9, color: 'var(--c-text)' }}>{contentParts.length > 0 ? contentParts : item.content}</div>
      <div style={{ marginTop: 20, color: 'var(--c-text-muted)', fontSize: 12, textAlign: 'right' }}>更新时间：{item.updatedAt}</div>
    </Modal>
  );
}
