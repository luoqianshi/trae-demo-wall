import React, { useEffect, useState, useMemo, useCallback, memo, useDeferredValue } from 'react';
import { Card, Button, Modal, Form, Input, Select, Space, Empty, message, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, BarChartOutlined, PieChartOutlined, LineChartOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Pie, Column, Line } from '@ant-design/charts';
import { useStatsStore, useProjectStore } from '../store';
import { shallow } from 'zustand/shallow';
import type { RegisteredStat } from '../types';
import styles from './Statistics.module.css';

const { Option } = Select;

const CHART_META: Record<string, { icon: any; name: string; color: string }> = {
  pie: { icon: PieChartOutlined, name: '饼图', color: '#6366f1' },
  bar: { icon: BarChartOutlined, name: '柱状图', color: '#ec4899' },
  line: { icon: LineChartOutlined, name: '折线图', color: '#22d3ee' }
};

/*
 * 在模块级别缓存统计计算结果，避免每次渲染都重新遍历 projects。
 * 使用 WeakMap 以 project 数组引用为 key，当数组引用变化时自动失效。
 */
const statsCache = new WeakMap<any[], Record<string, any[]>>();

function computeStatsData(projects: any[], dataSource: string): any[] {
  let cache = statsCache.get(projects);
  if (!cache) {
    cache = {};
    statsCache.set(projects, cache);
  }
  if (cache[dataSource]) return cache[dataSource];

  let result: any[] = [];
  switch (dataSource) {
    case 'project-status': {
      const map: Record<string, number> = {};
      for (const p of projects) {
        const k = (p as any).status || '未设置';
        map[k] = (map[k] || 0) + 1;
      }
      result = Object.entries(map).map(([name, value]) => ({ name, value }));
      break;
    }
    case 'project-region': {
      const map: Record<string, number> = {};
      for (const p of projects) {
        const k = (p as any).region || '未设置';
        map[k] = (map[k] || 0) + 1;
      }
      result = Object.entries(map).map(([name, value]) => ({ name, value }));
      break;
    }
    case 'progress-trend': {
      const map: Record<string, number> = {};
      for (const p of projects) {
        const k = (p as any).updatedAt?.slice(0, 10) || '';
        if (k) map[k] = (map[k] || 0) + 1;
      }
      result = Object.entries(map).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
      break;
    }
    default:
      result = [];
  }
  cache[dataSource] = result;
  return result;
}

const StatCard = memo(function StatCard({
  stat,
  projects,
  onEdit,
  onDelete
}: {
  stat: RegisteredStat;
  projects: any[];
  onEdit: (stat: RegisteredStat) => void;
  onDelete: (id: string) => void;
}) {
  const meta = CHART_META[stat.chartType] || CHART_META.pie;
  const IconComp = meta.icon;

  const data = useMemo(() => computeStatsData(projects, stat.dataSource), [projects, stat.dataSource]);
  const deferredData = useDeferredValue(data);

  /* 性能优化：
   * 1. 关闭 autoFit：避免每个图表都注册 ResizeObserver 监听窗口大小（每个图表至少 1 个 Observer）
   * 2. 固定 width / height：图表绘制时无需反复测量容器
   * 3. useMemo 依赖最小化：只要 deferredData 和 chartType 不变就不会重建图表
   * 参考: rendering-hoist-jsx / rerender-use-ref-transient-values
   */
  const chartNode = useMemo(() => {
    if (deferredData.length === 0) {
      return <div className="stat-empty">暂无数据可供展示</div>;
    }
    const baseSize = { width: 380, height: 280 };
    if (stat.chartType === 'pie') {
      const config: any = {
        data: deferredData,
        autoFit: false,
        width: baseSize.width,
        height: baseSize.height,
        angleField: 'value',
        colorField: 'name',
        radius: 0.9,
        innerRadius: 0.55,
        label: {
          text: 'name',
          style: { fontSize: 12, fontWeight: 500, fill: 'var(--c-text)' }
        },
        legend: {
          color: {
            title: false,
            position: 'bottom',
            itemMarker: 'circle',
            itemLabel: { style: { fontSize: 12, color: 'var(--c-text-soft)' } }
          }
        },
        color: ['#6366f1', '#ec4899', '#22d3ee', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6']
      };
      return <Pie {...config} />;
    }
    if (stat.chartType === 'bar') {
      const config: any = {
        data: deferredData,
        autoFit: false,
        width: baseSize.width,
        height: baseSize.height,
        xField: 'name',
        yField: 'value',
        radius: 8,
        style: { fill: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)' },
        label: { position: 'top', style: { fontSize: 12, fontWeight: 600, fill: 'var(--c-text)' } },
        axis: {
          x: { title: false, labelFill: 'var(--c-text-muted)', line: false, tick: false },
          y: { title: false, labelFill: 'var(--c-text-muted)', line: false, grid: true, gridStroke: 'var(--c-border)' }
        }
      };
      return <Column {...config} />;
    }
    if (stat.chartType === 'line') {
      const config: any = {
        data: deferredData,
        autoFit: false,
        width: baseSize.width,
        height: baseSize.height,
        xField: 'date',
        yField: 'value',
        smooth: true,
        point: { size: 5, style: { stroke: '#6366f1', lineWidth: 2, fill: '#ffffff' } },
        lineStyle: { stroke: 'linear-gradient(90deg, #6366f1, #ec4899)', lineWidth: 3 },
        label: { style: { fontSize: 12, fontWeight: 600, fill: 'var(--c-text)' } },
        axis: {
          x: { title: false, labelFill: 'var(--c-text-muted)', line: false, tick: false },
          y: { title: false, labelFill: 'var(--c-text-muted)', line: false, grid: true, gridStroke: 'var(--c-border)' }
        },
        area: {
          style: {
            fill: 'linear-gradient(180deg, rgba(99,102,241,0.35) 0%, rgba(236,72,153,0.05) 100%)'
          }
        }
      };
      return <Line {...config} />;
    }
    return <Empty description="不支持的图表类型" />;
  }, [deferredData, stat.chartType]);

  const handleEdit = useCallback(() => onEdit(stat), [onEdit, stat]);
  const handleDelete = useCallback(() => onDelete(stat.id), [onDelete, stat.id]);

  return (
    <div className={styles.statCard}>
      <div className={styles.statCardHeader}>
        <div className={styles.statCardTitle}>
          <div className={styles.statIconBadge} style={{ background: `linear-gradient(135deg, ${meta.color}, #6366f1)` }}>
            <IconComp style={{ fontSize: 18 }} />
          </div>
          <div>
            <div className="stat-card-title-text">{stat.name}</div>
            <div className="stat-card-subtitle">
              {meta.name} · {stat.dataSource}
            </div>
          </div>
        </div>
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={handleEdit}>编辑</Button>
          <Popconfirm title="确认删除该统计图?" onConfirm={handleDelete}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      </div>
      {chartNode}
    </div>
  );
});

export default function StatisticsPage() {
  const stats = useStatsStore((s) => s.stats, shallow);
  const projects = useProjectStore((s) => s.projects, shallow);
  const loadStats = useStatsStore((s) => s.load);
  const addStat = useStatsStore((s) => s.add);
  const updateStat = useStatsStore((s) => s.update);
  const removeStat = useStatsStore((s) => s.remove);

  const [openAdd, setOpenAdd] = useState(false);
  const [editStat, setEditStat] = useState<RegisteredStat | null>(null);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const enabledStats = useMemo(
    () => stats.filter((s) => s.enabled).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
    [stats]
  );

  const handleEdit = useCallback((stat: RegisteredStat) => {
    setEditStat(stat);
    setOpenAdd(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditStat(null);
    setOpenAdd(true);
  }, []);

  const handleSave = useCallback(async (data: any) => {
    if (editStat) {
      await updateStat({ ...editStat, ...data });
      message.success('已更新');
    } else {
      await addStat(data);
      message.success('已添加');
    }
  }, [editStat, updateStat, addStat]);

  const handleClose = useCallback(() => {
    setOpenAdd(false);
    setEditStat(null);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>数据统计</h2>
        <div className="header-meta">{enabledStats.length} 个统计图 · 基于 {projects.length} 个局点</div>
      </div>

      <div style={{ marginBottom: 20, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增统计图</Button>
      </div>

      {enabledStats.length === 0 ? (
        <Empty description="暂无启用的统计图 —— 点击右上角新增第一个图表" style={{ padding: '60px 0' }} />
      ) : (
        <div className="stat-layout-grid">
          {enabledStats.map((stat: RegisteredStat) => (
            <StatCard
              key={stat.id}
              stat={stat}
              projects={projects}
              onEdit={handleEdit}
              onDelete={removeStat}
            />
          ))}
        </div>
      )}

      <StatModal
        open={openAdd}
        edit={!!editStat}
        stat={editStat}
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
}

function StatModal({ open, edit, stat, onClose, onSave }: { open: boolean; edit: boolean; stat: RegisteredStat | null; onClose: () => void; onSave: (data: any) => void }) {
  const [form] = Form.useForm();
  useEffect(() => {
    if (open) {
      form.resetFields();
      if (edit && stat) {
        form.setFieldsValue({ name: stat.name, chartType: stat.chartType, dataSource: stat.dataSource, orderIndex: stat.orderIndex, enabled: stat.enabled });
      } else {
        form.setFieldsValue({ chartType: 'pie', dataSource: 'project-status', orderIndex: 10, enabled: true });
      }
    }
  }, [open, edit, stat, form]);

  const handleOk = useCallback(async () => {
    try {
      const v = await form.validateFields();
      onSave({ ...v });
    } catch (e) {
      // ignore
    }
  }, [form, onSave]);

  return (
    <Modal
      title={edit ? '编辑统计图' : '新增统计图'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      width={560}
      centered
    >
      <Form form={form} layout="vertical">
        <Form.Item label="图表名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="例如：按状态分布" />
        </Form.Item>
        <div className={styles.gridContainer}>
          <Form.Item label="图表类型" name="chartType" rules={[{ required: true }]}>
            <Select>
              <Option value="pie">饼图（分布）</Option>
              <Option value="bar">柱状图（计数）</Option>
              <Option value="line">折线图（趋势）</Option>
            </Select>
          </Form.Item>
          <Form.Item label="数据源" name="dataSource" rules={[{ required: true }]}>
            <Select>
              <Option value="project-status">项目 - 状态分布</Option>
              <Option value="project-region">项目 - 地区分布</Option>
              <Option value="progress-trend">项目 - 更新时间趋势</Option>
            </Select>
          </Form.Item>
        </div>
        <Form.Item label="排序（数字越小越靠前）" name="orderIndex" initialValue={10}>
          <InputNumber min={0} max={999} style={{ width: 200 }} />
        </Form.Item>
        <Form.Item label="启用" name="enabled" valuePropName="checked">
          <Select style={{ width: 160 }}>
            <Option value={true}>启用（显示）</Option>
            <Option value={false}>关闭（隐藏）</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
