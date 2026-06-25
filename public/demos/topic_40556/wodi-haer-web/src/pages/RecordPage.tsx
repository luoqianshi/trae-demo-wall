import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { recordService } from '../services/recordService';
import { useBabyStore, useStageStore } from '../store/index';
import { storage, STORAGE_KEYS } from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';
import type {
  StageKey,
  UnifiedRecord,
  RecordCategory,
  StageInfo,
  RecordFieldMeta,
} from '../types/global.d';
import { RECORD_FIELDS_CONFIG, STAGE_LIST } from '../types/global.d';
import type { FeedingRecord as ApiFeedingRecord, SleepRecord as ApiSleepRecord, DiaperRecord as ApiDiaperRecord } from '../services/recordService';

// ==================== 本地记录类型（向后兼容） ====================

interface LocalFeedingRecord {
  id: string;
  type: 'feeding';
  method: string;
  amount: string;
  duration: string;
  time: string;
  date: string;
  note: string;
}

interface LocalSleepRecord {
  id: string;
  type: 'sleep';
  startTime: string;
  endTime: string;
  quality: string;
  note: string;
  date: string;
}

interface LocalDiaperRecord {
  id: string;
  type: 'diaper';
  diaperType: string;
  status: string;
  time: string;
  date: string;
  note: string;
}

type LocalRecord = LocalFeedingRecord | LocalSleepRecord | LocalDiaperRecord;

// ==================== 本地存储工具 ====================

const RECORDS_KEY = STORAGE_KEYS.RECORDS;
const UNIFIED_RECORDS_KEY = 'wdhr_unified_records';

function getLocalRecords(): LocalRecord[] {
  try {
    return storage.get<LocalRecord[]>(RECORDS_KEY) || [];
  } catch {
    return [];
  }
}

function saveLocalRecords(records: LocalRecord[]) {
  storage.set(RECORDS_KEY, records);
}

function getUnifiedRecords(): UnifiedRecord[] {
  try {
    const raw = localStorage.getItem(UNIFIED_RECORDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UnifiedRecord[];
  } catch {
    return [];
  }
}

function saveUnifiedRecords(records: UnifiedRecord[]) {
  try {
    localStorage.setItem(UNIFIED_RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('保存统一记录失败:', e);
    toast.error('保存失败，存储空间可能已满');
  }
}

function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateUnifiedId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getNowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// ==================== 阶段颜色映射 ====================

const STAGE_COLORS: Record<StageKey, { dot: string; bg: string; text: string }> = {
  preparing: { dot: 'bg-mint', bg: 'bg-mint/10', text: 'text-mint' },
  pregnancy: { dot: 'bg-soft-pink', bg: 'bg-soft-pink/10', text: 'text-soft-pink' },
  birth: { dot: 'bg-light-blue', bg: 'bg-light-blue/10', text: 'text-light-blue' },
  parenting: { dot: 'bg-soft-blue', bg: 'bg-soft-blue/10', text: 'text-soft-blue' },
};

// ==================== 主组件 ====================

function RecordPage() {
  // ===== 阶段状态 =====
  const { currentStage, setStage } = useStageStore();
  const [selectedCategory, setSelectedCategory] = useState<RecordCategory | null>(null);

  // ===== 记录数据 =====
  const [records, setRecords] = useState<LocalRecord[]>(() => getLocalRecords());
  const [unifiedRecords, setUnifiedRecords] = useState<UnifiedRecord[]>(() => getUnifiedRecords());
  const { baby } = useBabyStore();

  // ===== 筛选状态 =====
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // ===== 编辑模式状态 =====
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UnifiedRecord>>({});

  // ===== 批量操作状态 =====
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ===== 删除确认弹窗 =====
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // ===== 表单状态（动态表单）=====
  const [formValue, setFormValue] = useState('');
  const [formNote, setFormNote] = useState('');

  // ===== 养育期特有表单状态（兼容原有逻辑）=====
  const [feedingMethod, setFeedingMethod] = useState('母乳');
  const [feedingDuration, setFeedingDuration] = useState('');
  const [feedingAmount, setFeedingAmount] = useState('');

  const [sleepStart, setSleepStart] = useState('');
  const [sleepEnd, setSleepEnd] = useState('');
  const [sleepQuality, setSleepQuality] = useState('好');

  const [diaperType, setDiaperType] = useState('大便');
  const [diaperStatus, setDiaperStatus] = useState('正常');

  // ===== 获取当前阶段的记录项配置 =====
  const currentStageFields = useMemo(() => {
    return (RECORD_FIELDS_CONFIG as any)[currentStage] || [];
  }, [currentStage]);

  // ===== 初始化选中第一个 category =====
  useEffect(() => {
    if (currentStageFields.length > 0) {
      const firstKey = currentStageFields[0].key;
      setSelectedCategory(firstKey);
      setFormValue('');
      setFormNote('');
    }
  }, [currentStage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== 获取当前选中 field 配置 =====
  const currentFieldConfig = useMemo(() => {
    if (!selectedCategory) return null;
    return currentStageFields.find((f: RecordFieldMeta) => f.key === selectedCategory) || null;
  }, [selectedCategory, currentStageFields]);

  // ===== 本地操作（始终可用）=====

  const addLocalRecord = useCallback((record: LocalRecord) => {
    setRecords(prev => {
      const updated = [record, ...prev];
      saveLocalRecords(updated);
      return updated;
    });
  }, []);

  // ===== 统一记录操作 =====

  const addUnifiedRecord = useCallback((record: UnifiedRecord) => {
    setUnifiedRecords(prev => {
      const updated = [record, ...prev];
      saveUnifiedRecords(updated);
      return updated;
    });
  }, []);

  const updateUnifiedRecord = useCallback((id: string, updates: Partial<UnifiedRecord>) => {
    setUnifiedRecords(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      saveUnifiedRecords(updated);
      return updated;
    });
  }, []);

  const removeUnifiedRecord = useCallback((id: string) => {
    setUnifiedRecords(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveUnifiedRecords(updated);
      return updated;
    });
  }, []);

  const removeBatchUnifiedRecords = useCallback((ids: string[]) => {
    setUnifiedRecords(prev => {
      const updated = prev.filter(r => !ids.includes(r.id));
      saveUnifiedRecords(updated);
      return updated;
    });
  }, []);

  // ===== 后台API同步（静默，不阻塞）=====

  const syncFromApi = useCallback(async () => {
    if (!baby?.id) return;
    try {
      const [feedingRes, sleepRes, diaperRes] = await Promise.all([
        recordService.getFeedingList(baby.id).catch(() => ({ data: null })),
        recordService.getSleepList(baby.id).catch(() => ({ data: null })),
        recordService.getDiaperList(baby.id).catch(() => ({ data: null })),
      ]);

      const apiRecords: LocalRecord[] = [];

      if (feedingRes.data && Array.isArray(feedingRes.data)) {
        feedingRes.data.forEach((r: ApiFeedingRecord) => {
          const dt = r.startTime ? new Date(r.startTime) : new Date();
          const time = dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
          const date = dt.toISOString().split('T')[0];
          const methodMap: Record<string, string> = { breast: '母乳', formula: '奶粉', solid: '辅食' };
          apiRecords.push({
            id: r.id,
            type: 'feeding',
            method: methodMap[r.type] || r.type,
            amount: r.amount ? String(r.amount) : '',
            duration: r.duration ? String(r.duration) : '',
            time,
            date,
            note: r.notes || '',
          });
        });
      }

      if (sleepRes.data && Array.isArray(sleepRes.data)) {
        sleepRes.data.forEach((r: ApiSleepRecord) => {
          const sDt = new Date(r.startTime);
          const eDt = new Date(r.endTime);
          const startTime = sDt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
          const endTime = eDt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
          const qualityMap: Record<string, string> = { good: '好', normal: '一般', bad: '差' };
          apiRecords.push({
            id: r.id,
            type: 'sleep',
            startTime,
            endTime,
            quality: qualityMap[r.quality] || r.quality,
            note: r.notes || '',
            date: sDt.toISOString().split('T')[0],
          });
        });
      }

      if (diaperRes.data && Array.isArray(diaperRes.data)) {
        diaperRes.data.forEach((r: ApiDiaperRecord) => {
          const dt = new Date(r.time);
          const time = dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
          const typeMap: Record<string, string> = { pee: '小便', poop: '大便', both: '都有' };
          apiRecords.push({
            id: r.id,
            type: 'diaper',
            diaperType: typeMap[r.type] || r.type,
            status: r.color || '正常',
            time,
            date: dt.toISOString().split('T')[0],
            note: r.notes || '',
          });
        });
      }

      const localOnly = records.filter(r => r.id.startsWith('local_'));
      const merged = [...apiRecords, ...localOnly];
      merged.sort((a, b) => {
        const dA = a.date + (a.type === 'sleep' ? (a as LocalSleepRecord).startTime : (a as LocalFeedingRecord | LocalDiaperRecord).time);
        const dB = b.date + (b.type === 'sleep' ? (b as LocalSleepRecord).startTime : (b as LocalFeedingRecord | LocalDiaperRecord).time);
        return dB.localeCompare(dA);
      });

      if (merged.length > 0) {
        setRecords(merged);
        saveLocalRecords(merged);
      }
    } catch (error) {
      console.error('API同步失败，使用本地数据', error);
    }
  }, [baby?.id, records]); // eslint-disable-line react-hooks/exhaustive-deps

  // 组件挂载时加载
  useEffect(() => {
    const localData = getLocalRecords();
    if (localData.length > 0) setRecords(localData);

    const unifiedData = getUnifiedRecords();
    if (unifiedData.length > 0) setUnifiedRecords(unifiedData);

    const timer = setTimeout(syncFromApi, 500);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== 筛选后的统一记录列表 =====

  const filteredUnifiedRecords = useMemo(() => {
    let result = unifiedRecords;

    // 类型筛选
    if (typeFilter !== 'all') {
      result = result.filter(r => r.category === typeFilter);
    }

    // 日期筛选
    if (dateFilter !== 'all') {
      const today = getToday();
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          result = result.filter(r => r.date === today);
          break;
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          result = result.filter(r => r.date >= weekAgo.toISOString().split('T')[0]);
          break;
        }
        case 'month': {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          result = result.filter(r => r.date >= monthAgo.toISOString().split('T')[0]);
          break;
        }
      }
    }

    // 按 createdAt 降序排序
    result.sort((a, b) => b.createdAt - a.createdAt);

    return result;
  }, [unifiedRecords, typeFilter, dateFilter]);

  // 统计摘要
  const statsSummary = useMemo(() => {
    const todayRecs = filteredUnifiedRecords.filter(r => r.date === getToday());

    const stageCounts: Record<string, number> = {};
    todayRecs.forEach(r => {
      stageCounts[r.stage] = (stageCounts[r.stage] || 0) + 1;
    });

    return {
      total: filteredUnifiedRecords.length,
      stageCounts,
      todayCount: todayRecs.length,
    };
  }, [filteredUnifiedRecords]);

  // ===== 统一提交处理 =====

  const handleUnifiedSubmit = async () => {
    if (!currentFieldConfig || !selectedCategory) return;

    let value = formValue;

    // 特殊处理：养育期的复杂表单
    if (currentStage === 'parenting') {
      if (selectedCategory === 'feeding') {
        if (!feedingDuration && feedingMethod !== '辅食') {
          toast.error('请输入喂养时长或奶量');
          return;
        }
        value = feedingMethod === '母乳'
          ? `方式:${feedingMethod},时长:${feedingDuration}分钟`
          : feedingMethod === '奶粉'
          ? `方式:${feedingMethod},奶量:${feedingAmount}ml`
          : `方式:${feedingMethod},内容:${feedingAmount}`;
      } else if (selectedCategory === 'sleep') {
        if (!sleepStart || !sleepEnd) {
          toast.error('请选择入睡和醒来时间');
          return;
        }
        value = `${sleepStart}-${sleepEnd}(质量:${sleepQuality})`;
      } else if (selectedCategory === 'diaper') {
        value = `类型:${diaperType},状态:${diaperStatus}`;
      }
    } else {
      // 其他阶段：简单验证
      if (currentFieldConfig.inputType === 'number' && !value) {
        toast.error(`请输入${currentFieldConfig.name}`);
        return;
      }
      if (currentFieldConfig.inputType === 'text' && !value) {
        toast.error(`请输入${currentFieldConfig.name}`);
        return;
      }
      if (currentFieldConfig.inputType === 'date' && !value) {
        toast.error(`请选择${currentFieldConfig.name}`);
        return;
      }
      if (currentFieldConfig.inputType === 'time' && !value) {
        toast.error(`请选择${currentFieldConfig.name}`);
        return;
      }
      if (currentFieldConfig.inputType === 'textarea' && !value) {
        toast.error(`请输入${currentFieldConfig.name}`);
        return;
      }
    }

    // 创建统一记录
    const now = new Date();
    const unifiedRecord: UnifiedRecord = {
      id: generateUnifiedId(),
      category: selectedCategory,
      stage: currentStage,
      value: value,
      note: formNote,
      time: now.toTimeString().slice(0, 5),
      date: now.toISOString().slice(0, 10),
      createdAt: now.getTime(),
    };

    // 保存到统一存储
    addUnifiedRecord(unifiedRecord);

    // 向后兼容：养育期的记录同时写入原有格式
    if (currentStage === 'parenting') {
      if (selectedCategory === 'feeding') {
        const localRecord: LocalFeedingRecord = {
          id: generateId(),
          type: 'feeding',
          method: feedingMethod,
          amount: feedingAmount,
          duration: feedingDuration,
          time: getNowTime(),
          date: getToday(),
          note: formNote,
        };
        addLocalRecord(localRecord);

        // API 同步
        if (baby?.id) {
          try {
            const typeMap: Record<string, 'breast' | 'formula' | 'solid'> = { '母乳': 'breast', '奶粉': 'formula', '辅食': 'solid' };
            await recordService.createFeeding({
              babyId: baby.id,
              type: typeMap[feedingMethod],
              duration: feedingDuration ? Number(feedingDuration) : undefined,
              amount: feedingAmount ? Number(feedingAmount) : undefined,
              startTime: new Date().toISOString(),
              notes: formNote || undefined,
            });
            syncFromApi();
          } catch { /* 静默 */ }
        }

        toast.success('🍼 喂养记录已保存！');
        setFeedingDuration('');
        setFeedingAmount('');
      } else if (selectedCategory === 'sleep') {
        const localRecord: LocalSleepRecord = {
          id: generateId(),
          type: 'sleep',
          startTime: sleepStart,
          endTime: sleepEnd,
          quality: sleepQuality,
          note: formNote,
          date: getToday(),
        };
        addLocalRecord(localRecord);

        // API 同步
        if (baby?.id) {
          try {
            const qualityMap: Record<string, 'good' | 'normal' | 'bad'> = { '好': 'good', '一般': 'normal', '差': 'bad' };
            await recordService.createSleep({
              babyId: baby.id,
              startTime: `${getToday()}T${sleepStart}:00`,
              endTime: `${getToday()}T${sleepEnd}:00`,
              quality: qualityMap[sleepQuality],
              notes: formNote || undefined,
            });
            syncFromApi();
          } catch { /* 静默 */ }
        }

        toast.success('😴 睡眠记录已保存！');
        setSleepStart('');
        setSleepEnd('');
      } else if (selectedCategory === 'diaper') {
        const localRecord: LocalDiaperRecord = {
          id: generateId(),
          type: 'diaper',
          diaperType: diaperType,
          status: diaperStatus,
          time: getNowTime(),
          date: getToday(),
          note: formNote,
        };
        addLocalRecord(localRecord);

        // API 同步
        if (baby?.id) {
          try {
            const typeMap: Record<string, 'pee' | 'poop' | 'both'> = { '小便': 'pee', '大便': 'poop', '都有': 'both' };
            await recordService.createDiaper({
              babyId: baby.id,
              type: typeMap[diaperType],
              time: new Date().toISOString(),
              color: diaperStatus !== '正常' ? diaperStatus : undefined,
              notes: formNote || undefined,
            });
            syncFromApi();
          } catch { /* 静默 */ }
        }

        toast.success('💩 排便记录已保存！');
      }
    } else {
      // 其他阶段
      toast.success(`${currentFieldConfig.icon} ${currentFieldConfig.name}记录已保存！`);
    }

    // 重置表单
    setFormValue('');
    setFormNote('');
  };

  // ===== 快捷一键记录函数（必须在 quickActions 之前声明，避免 TDZ 错误）====

  const handleQuickRecord = (category: RecordCategory, value: string) => {
    const record: UnifiedRecord = {
      id: generateUnifiedId(),
      category,
      stage: currentStage,
      value,
      note: '快捷记录',
      time: getNowTime(),
      date: getToday(),
      createdAt: Date.now(),
    };
    addUnifiedRecord(record);
    toast.success(`${value} 已快速记录！`);
  };

  const quickFeed = () => {
    const now = getNowTime();
    addLocalRecord({
      id: generateId(), type: 'feeding', method: '母乳', amount: '', duration: '15',
      time: now, date: getToday(), note: '快捷记录',
    });
    const unifiedRecord: UnifiedRecord = {
      id: generateUnifiedId(), category: 'feeding', stage: 'parenting',
      value: '方式:母乳,时长:15分钟', note: '快捷记录',
      time: now, date: getToday(), createdAt: Date.now(),
    };
    addUnifiedRecord(unifiedRecord);
    toast.success('🍼 快捷：母乳喂养15分钟');
  };

  const quickSleep = () => {
    const end = getNowTime();
    const startH = Math.max(0, parseInt(end.split(':')[0]) - 1);
    const startM = end.split(':')[1];
    const start = `${String(startH).padStart(2,'0')}:${startM}`;
    addLocalRecord({
      id: generateId(), type: 'sleep', startTime: start, endTime: end,
      quality: '好', note: '快捷记录', date: getToday(),
    });
    const unifiedRecord: UnifiedRecord = {
      id: generateUnifiedId(), category: 'sleep', stage: 'parenting',
      value: `${start}-${end}(质量:好)`, note: '快捷记录',
      time: end, date: getToday(), createdAt: Date.now(),
    };
    addUnifiedRecord(unifiedRecord);
    toast.success('😴 快捷：睡眠记录已添加');
  };

  const quickDiaper = () => {
    addLocalRecord({
      id: generateId(), type: 'diaper', diaperType: '大便', status: '正常',
      time: getNowTime(), date: getToday(), note: '快捷记录',
    });
    const unifiedRecord: UnifiedRecord = {
      id: generateUnifiedId(), category: 'diaper', stage: 'parenting',
      value: '类型:大便,状态:正常', note: '快捷记录',
      time: getNowTime(), date: getToday(), createdAt: Date.now(),
    };
    addUnifiedRecord(unifiedRecord);
    toast.success('💩 快捷：排便记录已添加');
  };

  // ===== 快捷操作列表（引用上面已声明的函数）=====

  const quickActions = useMemo(() => {
    switch (currentStage) {
      case 'preparing':
        return [
          { label: '叶酸已服', icon: '💊', action: () => handleQuickRecord('folic_acid', '已服用') },
          { label: '体温记录', icon: '🌡️', action: () => handleQuickRecord('basal_temp', '36.5') },
        ];
      case 'pregnancy':
        return [
          { label: '胎动记录', icon: '💓', action: () => handleQuickRecord('fetal_movement', '10次/小时') },
          { label: '心情不错', icon: '😊', action: () => handleQuickRecord('pregnancy_mood', '开心') },
        ];
      case 'birth':
        return [
          { label: '宫缩开始', icon: '⏱️', action: () => handleQuickRecord('contraction', '规律宫缩5分钟一次') },
          { label: '破水了', icon: '💧', action: () => handleQuickRecord('water_break', '已破水') },
        ];
      case 'parenting':
        return [
          { label: '喂奶', icon: '🍼', action: quickFeed },
          { label: '睡觉', icon: '😴', action: quickSleep },
          { label: '换尿布', icon: '💩', action: quickDiaper },
        ];
      default:
        return [];
    }
  }, [currentStage]);

  // ===== 编辑功能 =====

  const startEdit = (record: UnifiedRecord) => {
    setEditingId(record.id);
    setEditForm({ ...record });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateUnifiedRecord(editingId, {
      value: editForm.value || '',
      note: editForm.note || '',
    });
    toast.success('✅ 记录已更新');
    cancelEdit();
  };

  // ===== 删除功能（带确认弹窗）=====

  const confirmDelete = (id: string, name: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    if (!deleteTargetId) return;

    removeUnifiedRecord(deleteTargetId);

    toast.success('🗑️ 记录已删除');
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
    setDeleteTargetName('');
  };

  // ===== 批量操作 =====

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredUnifiedRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUnifiedRecords.map(r => r.id)));
    }
  };

  const batchDelete = () => {
    if (selectedIds.size === 0) return;

    setShowDeleteConfirm(true);
    setDeleteTargetName(`${selectedIds.size} 条记录`);
    setDeleteTargetId('__batch__');
  };

  const executeBatchDelete = () => {
    if (deleteTargetId === '__batch__' && selectedIds.size > 0) {
      removeBatchUnifiedRecords([...selectedIds]);
      toast.success(`🗑️ 已删除 ${selectedIds.size} 条记录`);
      setSelectedIds(new Set());
      setBatchMode(false);
    } else {
      executeDelete();
    }
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
    setDeleteTargetName('');
  };

  // ===== 导出CSV =====

  const exportCSV = () => {
    if (filteredUnifiedRecords.length === 0) {
      toast.error('没有可导出的记录');
      return;
    }

    const categoryNameMap: Record<string, string> = {};
    Object.values(RECORD_FIELDS_CONFIG as any).flat().forEach((field: any) => {
      categoryNameMap[field.key] = field.name;
    });

    const headers = ['阶段', '记录项', '日期', '时间', '数值', '备注'];
    const rows = filteredUnifiedRecords.map(r => {
      const stageInfo = (STAGE_LIST as any).find((s: StageInfo) => s.key === r.stage);
      const categoryName = categoryNameMap[r.category] || r.category;
      return [
        stageInfo?.name || r.stage,
        categoryName,
        r.date,
        r.time,
        String(r.value),
        r.note || '',
      ];
    });

    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `吾滴孩儿_四阶段记录_${getToday()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('📥 记录已导出为CSV文件');
  };

  // ===== 渲染动态表单字段 =====

  const renderDynamicForm = () => {
    if (!currentFieldConfig) return null;

    const field = currentFieldConfig;

    // 养育期特殊处理：显示原有详细表单
    if (currentStage === 'parenting') {
      return renderParentingForm();
    }

    // 通用动态表单
    return (
      <div className="card space-y-4 animate-fadeInUp">
        <h2 className="text-xl font-semibold text-text-primary">
          {field.icon} {field.name}
        </h2>

        {/* 根据输入类型渲染不同表单 */}
        {field.inputType === 'text' && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{field.name}</label>
            <input
              type="text"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder={field.placeholder || `请输入${field.name}`}
              className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all"
            />
          </div>
        )}

        {field.inputType === 'number' && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {field.name}{field.unit && ` (${field.unit})`}
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder={field.placeholder || `请输入${field.name}`}
                className="w-full px-4 py-3 pr-12 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all"
              />
              {field.unit && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-light">{field.unit}</span>
              )}
            </div>
          </div>
        )}

        {field.inputType === 'date' && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{field.name}</label>
            <input
              type="date"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all"
            />
          </div>
        )}

        {field.inputType === 'time' && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{field.name}</label>
            <input
              type="time"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all"
            />
          </div>
        )}

        {field.inputType === 'select' && field.options && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{field.name}</label>
            <div className={`grid grid-cols-${Math.min(field.options.length, 3)} gap-3`}>
              {field.options.map((option: string) => (
                <button
                  key={option}
                  onClick={() => setFormValue(option)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    formValue === option
                      ? 'bg-gradient-to-r from-soft-blue to-light-blue text-text-primary shadow-md'
                      : 'bg-cream text-text-secondary hover:bg-soft-blue/30'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {field.inputType === 'textarea' && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{field.name}</label>
            <textarea
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder={field.placeholder || `请输入${field.name}`}
              rows={3}
              className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all resize-none"
            />
          </div>
        )}

        {field.inputType === 'toggle' && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{field.name}</label>
            <button
              onClick={() => setFormValue(formValue === '是' ? '否' : '是')}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                formValue === '是'
                  ? 'bg-mint text-green-800'
                  : 'bg-gray-200 text-text-secondary'
              }`}
            >
              {formValue === '是' ? '✅ 是' : '⭕ 否'}
            </button>
          </div>
        )}

        {/* 备注 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">备注</label>
          <textarea
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            placeholder="可选：添加备注信息"
            rows={2}
            className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all resize-none"
          />
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleUnifiedSubmit}
          className="btn btn-primary w-full active:scale-[0.98] transition-transform"
        >
          💾 保存{field.name}记录
        </button>
      </div>
    );
  };

  // ===== 渲染养育期表单（保持原有逻辑）=====

  const renderParentingForm = () => {
    if (selectedCategory === 'feeding') {
      return (
        <div className="card space-y-4 animate-fadeInUp">
          <h2 className="text-xl font-semibold text-text-primary">🍼 喂养记录</h2>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">喂养方式</label>
            <div className="grid grid-cols-3 gap-3">
              {['母乳', '奶粉', '辅食'].map((m) => (
                <button key={m} onClick={() => setFeedingMethod(m)} className={
                  `py-3 rounded-xl text-sm font-medium transition-all ${
                    feedingMethod === m
                      ? 'bg-gradient-to-r from-soft-blue to-light-blue text-text-primary shadow-md'
                      : 'bg-cream text-text-secondary hover:bg-soft-blue/30'
                  }`
                }>{m}</button>
              ))}
            </div>
          </div>
          {(feedingMethod === '母乳' || feedingMethod === '奶粉') && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {feedingMethod === '母乳' ? '喂养时长（分钟）' : '奶量（ml）'}
              </label>
              <input type="number"
                value={feedingMethod === '母乳' ? feedingDuration : feedingAmount}
                onChange={(e) => feedingMethod === '母乳' ? setFeedingDuration(e.target.value) : setFeedingAmount(e.target.value)}
                placeholder={feedingMethod === '母乳' ? '如：15' : '如：120'}
                className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all"
              />
            </div>
          )}
          {feedingMethod === '辅食' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">辅食内容</label>
              <input type="text" value={feedingAmount} onChange={(e) => setFeedingAmount(e.target.value)} placeholder="如：米粉、南瓜泥"
                className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">备注</label>
            <textarea value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="可选：添加备注信息" rows={2}
              className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all resize-none" />
          </div>
          <button onClick={handleUnifiedSubmit} className="btn btn-primary w-full active:scale-[0.98] transition-transform">保存记录</button>
        </div>
      );
    }

    if (selectedCategory === 'sleep') {
      return (
        <div className="card space-y-4 animate-fadeInUp">
          <h2 className="text-xl font-semibold text-text-primary">😴 睡眠记录</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">入睡时间</label>
              <input type="time" value={sleepStart} onChange={(e) => setSleepStart(e.target.value)}
                className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">醒来时间</label>
              <input type="time" value={sleepEnd} onChange={(e) => setSleepEnd(e.target.value)}
                className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">睡眠质量</label>
            <div className="grid grid-cols-3 gap-3">
              {[{ label: '好', icon: '😊' }, { label: '一般', icon: '😐' }, { label: '差', icon: '😫' }].map((q) => (
                <button key={q.label} onClick={() => setSleepQuality(q.label)} className={
                  `py-3 rounded-xl text-sm font-medium transition-all ${
                    sleepQuality === q.label
                      ? 'bg-gradient-to-r from-soft-blue to-light-blue text-text-primary shadow-md'
                      : 'bg-cream text-text-secondary hover:bg-soft-blue/30'
                  }`
                }>
                  {q.icon} {q.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">备注</label>
            <textarea value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="可选：添加备注信息" rows={2}
              className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all resize-none" />
          </div>
          <button onClick={handleUnifiedSubmit} className="btn btn-primary w-full active:scale-[0.98] transition-transform">保存记录</button>
        </div>
      );
    }

    if (selectedCategory === 'diaper') {
      return (
        <div className="card space-y-4 animate-fadeInUp">
          <h2 className="text-xl font-semibold text-text-primary">💩 排便记录</h2>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">排便类型</label>
            <div className="grid grid-cols-3 gap-3">
              {['小便', '大便', '都有'].map((t) => (
                <button key={t} onClick={() => setDiaperType(t)} className={
                  `py-3 rounded-xl text-sm font-medium transition-all ${
                    diaperType === t
                      ? 'bg-gradient-to-r from-soft-blue to-light-blue text-text-primary shadow-md'
                      : 'bg-cream text-text-secondary hover:bg-soft-blue/30'
                  }`
                }>{t}</button>
              ))}
            </div>
          </div>
          {diaperType !== '小便' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">便便状态</label>
              <div className="grid grid-cols-4 gap-3">
                {['正常', '稀', '干', '异常'].map((s) => (
                  <button key={s} onClick={() => setDiaperStatus(s)} className={
                    `py-3 rounded-xl text-sm font-medium transition-all ${
                      diaperStatus === s
                        ? 'bg-gradient-to-r from-soft-blue to-light-blue text-text-primary shadow-md'
                        : 'bg-cream text-text-secondary hover:bg-soft-blue/30'
                    }`
                  }>{s}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">备注</label>
            <textarea value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="可选：如颜色、气味等" rows={2}
              className="w-full px-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all resize-none" />
          </div>
          <button onClick={handleUnifiedSubmit} className="btn btn-primary w-full active:scale-[0.98] transition-transform">保存记录</button>
        </div>
      );
    }

    return null;
  };

  // ===== 渲染历史记录项 =====

  const renderUnifiedRecordItem = (record: UnifiedRecord) => {
    const isSelected = selectedIds.has(record.id);
    const stageColor = STAGE_COLORS[record.stage] || STAGE_COLORS.parenting;

    // 获取记录项名称
    const allFields = Object.values(RECORD_FIELDS_CONFIG as any).flat() as any[];
    const fieldMeta = allFields.find(f => f.key === record.category);
    const recordName = fieldMeta?.name || record.category;
    const recordIcon = fieldMeta?.icon || '📝';

    if (batchMode) {
      return (
        <div key={record.id}
          className={`flex items-center p-4 rounded-2xl transition-all cursor-pointer animate-fadeInUp ${
            isSelected ? 'bg-soft-blue/30 border-2 border-ice-blue' : 'bg-cream hover:bg-soft-blue/10'
          }`}
          onClick={() => toggleSelect(record.id)}
        >
          <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
            isSelected ? 'bg-ice-blue border-ice-blue' : 'border-text-light'
          }`}>
            {isSelected && <span className="text-white text-xs">✓</span>}
          </div>
          <span className="text-xl mr-2">{recordIcon}</span>
          <div className={`w-2 h-2 rounded-full mr-2 ${stageColor.dot}`} title={(STAGE_LIST as any).find((s: any) => s.key === record.stage)?.name} />
          <span className="text-sm text-text-primary flex-1 truncate">{recordName}</span>
          <span className="text-xs text-text-light ml-2">{record.time}</span>
        </div>
      );
    }

    // 编辑模式
    if (editingId === record.id) {
      return (
        <div key={record.id} className="p-4 bg-gradient-to-r from-soft-blue/20 to-light-yellow/20 rounded-2xl border-2 border-ice-blue animate-fadeIn space-y-3">
          <p className="text-sm font-medium text-ice-blue">✏️ 编辑记录</p>

          <input
            value={editForm.value || ''}
            onChange={(e) => setEditForm(p => ({ ...p, value: e.target.value }))}
            placeholder="数值"
            className="w-full px-3 py-2 bg-white rounded-lg border text-sm"
          />

          <input
            value={editForm.note || ''}
            onChange={(e) => setEditForm(p => ({ ...p, note: e.target.value }))}
            placeholder="备注"
            className="w-full px-3 py-2 bg-white rounded-lg border text-sm"
          />

          <div className="flex gap-2">
            <button onClick={saveEdit} className="flex-1 py-2 bg-ice-blue text-white rounded-lg text-sm font-medium">保存</button>
            <button onClick={cancelEdit} className="flex-1 py-2 bg-gray-200 text-text-secondary rounded-lg text-sm">取消</button>
          </div>
        </div>
      );
    }

    // 正常显示模式
    return (
      <div key={record.id} className="group flex items-center p-4 bg-cream rounded-2xl hover:bg-soft-blue/20 transition-all animate-fadeInUp">
        <span className="text-2xl mr-3">{recordIcon}</span>

        {/* 阶段指示点 */}
        <div className={`w-3 h-3 rounded-full mr-2 ${stageColor.dot}`}
             title={(STAGE_LIST as any).find((s: any) => s.key === record.stage)?.name}
        />

        <div className="flex-1 min-w-0">
          <span className="text-text-primary font-medium">{recordName}</span>
          <span className="text-text-secondary text-sm ml-2">{String(record.value)}</span>
          {record.note && <p className="text-xs text-text-light mt-1 truncate">{record.note}</p>}
        </div>

        <span className="text-sm text-text-secondary mr-2 flex-shrink-0 hidden sm:inline">{record.date}</span>
        <span className="text-sm text-text-secondary mr-3 flex-shrink-0">{record.time}</span>

        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <button onClick={() => startEdit(record)} className="px-2 py-1 text-xs bg-soft-blue/20 hover:bg-soft-blue/40 rounded-lg text-ice-blue">编辑</button>
          <button onClick={() => confirmDelete(record.id, recordName)} className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 rounded-lg text-red-400">删除</button>
        </div>
      </div>
    );
  };

  // ===== 获取当前阶段的所有 categories 用于筛选 =====

  const currentStageCategories = useMemo(() => {
    return currentStageFields.map((f: RecordFieldMeta) => f.key);
  }, [currentStageFields]);

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl px-6 py-6 text-center shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-text-primary">📝 四阶段感知记录</h1>
        <p className="text-sm text-text-secondary mt-1">陪伴每一个重要时刻</p>
        {!baby?.id && (
          <p className="text-xs text-ice-blue mt-2 animate-pulse-slow">💡 当前为本地存储模式，添加宝宝后可同步云端</p>
        )}

        {/* 今日统计摘要 */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <span className="text-2xl font-bold text-ice-blue">{statsSummary.todayCount}</span>
            <p className="text-xs text-text-light">今日记录</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-soft-pink">{statsSummary.total}</span>
            <p className="text-xs text-text-light">总记录数</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* ========== 1. 四阶段选择器 ========== */}
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <p className="text-sm font-semibold text-text-secondary mb-3 text-center">🎯 选择当前阶段</p>
          <div className="grid grid-cols-4 gap-3">
            {(STAGE_LIST as any).map((stage: StageInfo) => (
              <button
                key={stage.key}
                onClick={() => setStage(stage.key as StageKey)}
                className={`relative py-4 px-3 rounded-2xl flex flex-col items-center transition-all duration-300 ${
                  currentStage === stage.key
                    ? 'text-white shadow-lg scale-[1.05]'
                    : 'bg-cream text-text-secondary hover:bg-soft-blue/20'
                }`}
                style={currentStage === stage.key ? {
                  background: `linear-gradient(135deg, ${stage.gradientFrom}, ${stage.gradientTo})`,
                } : {}}
              >
                <span className="text-3xl mb-1">{stage.icon}</span>
                <span className={`text-xs font-medium ${currentStage === stage.key ? 'font-bold' : ''}`}>
                  {stage.name}
                </span>
                {currentStage === stage.key && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/50 rounded-full" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-light mt-3 text-center">
            {(STAGE_LIST as any).find((s: StageInfo) => s.key === currentStage)?.description}
          </p>
        </div>

        {/* ========== 2. 快捷一键记录 ========== */}
        <div className="card p-4">
          <p className="text-sm font-semibold text-text-secondary mb-3">⚡ 快捷记录</p>
          <div className="flex gap-3">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className="flex-1 py-3 bg-soft-blue/20 hover:bg-soft-blue/40 rounded-xl text-sm font-medium transition-all active:scale-95"
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* ========== 3. 动态记录项 Tab ========== */}
        {currentStageFields.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide bg-white rounded-2xl p-2 shadow-lg">
            {currentStageFields.map((field: any) => (
              <button
                key={field.key}
                onClick={() => {
                  setSelectedCategory(field.key);
                  setFormValue('');
                  setFormNote('');
                }}
                className={`flex-shrink-0 px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === field.key
                    ? 'shadow-md scale-[1.02] text-white'
                    : 'bg-cream text-text-secondary hover:bg-soft-blue/30'
                }`}
                style={selectedCategory === field.key ? {
                  background: `linear-gradient(135deg, ${(STAGE_LIST as any).find((s: StageInfo) => s.key === currentStage)?.gradientFrom || '#E8EAF6'}, ${(STAGE_LIST as any).find((s: StageInfo) => s.key === currentStage)?.gradientTo || '#C5CAE9'})`,
                } : {}}
              >
                <span className="text-lg">{field.icon}</span>
                <span className="text-sm font-medium">{field.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* ========== 4. 动态录入表单 ========== */}
        {selectedCategory && currentFieldConfig && renderDynamicForm()}

        {/* ========== 5. 工具栏：筛选 + 批量操作 + 导出 ========== */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 日期筛选 */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm">
            {[
              { value: 'today' as const, label: '今天' },
              { value: 'week' as const, label: '本周' },
              { value: 'month' as const, label: '本月' },
              { value: 'all' as const, label: '全部' },
            ].map(f => (
              <button key={f.value} onClick={() => setDateFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateFilter === f.value ? 'bg-ice-blue text-white' : 'text-text-secondary hover:bg-cream'
                }`}>{f.label}</button>
            ))}
          </div>

          {/* 类型筛选 */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm max-w-xs overflow-x-auto">
            <button onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                typeFilter === 'all' ? 'bg-soft-pink text-white' : 'text-text-secondary hover:bg-cream'
              }`}>全部</button>
            {currentStageCategories.map((cat: string) => {
              const fieldMeta = currentStageFields.find((f: any) => f.key === cat) as any;
              return (
                <button key={cat} onClick={() => setTypeFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                    typeFilter === cat ? 'bg-soft-pink text-white' : 'text-text-secondary hover:bg-cream'
                  }`}>
                  {fieldMeta?.icon || ''} {fieldMeta?.name || cat}
                </button>
              );
            })}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 ml-auto">
            <button onClick={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                batchMode ? 'bg-red-500 text-white' : 'bg-white text-text-secondary hover:bg-cream shadow-sm'
              }`}>
              {batchMode ? '取消' : '多选'}
            </button>
            <button onClick={exportCSV} className="px-3 py-1.5 bg-mint/30 text-green-700 rounded-lg text-xs font-medium hover:bg-mint/50 shadow-sm transition-all">
              📥 导出
            </button>
          </div>
        </div>

        {/* 批量操作栏 */}
        {batchMode && (
          <div className="flex items-center justify-between p-3 bg-soft-pink/20 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <button onClick={selectAll} className="text-sm text-ice-blue font-medium">
                {selectedIds.size === filteredUnifiedRecords.length ? '取消全选' : '全选'}
              </button>
              <span className="text-sm text-text-secondary">已选 {selectedIds.size}/{filteredUnifiedRecords.length} 条</span>
            </div>
            <button onClick={batchDelete} disabled={selectedIds.size === 0}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedIds.size > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              删除选中 ({selectedIds.size})
            </button>
          </div>
        )}

        {/* ========== 6. 历史记录列表（统一格式）========= */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary">📋 历史记录</h2>
            <span className="text-xs text-text-light">
              共 {filteredUnifiedRecords.length} 条{typeFilter !== 'all' ? ' · 已筛选' : ''}
            </span>
          </div>
          {filteredUnifiedRecords.length > 0 ? (
            <div className="space-y-3">
              {filteredUnifiedRecords.map((record) => renderUnifiedRecordItem(record))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-5xl mb-3">📝</p>
              <p className="text-text-secondary font-medium">暂无记录</p>
              <p className="text-xs text-text-light mt-1">快添加第一条记录吧！也可以用快捷按钮一键录入~</p>
            </div>
          )}
        </div>
      </div>

      {/* ========== 删除确认弹窗 ========== */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="确认删除"
        message={`确定要删除这条「${deleteTargetName}」记录吗？删除后无法恢复。`}
        type="danger"
        onConfirm={deleteTargetId === '__batch__' ? executeBatchDelete : executeDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
          setDeleteTargetName('');
        }}
      />
    </div>
  );
}

export default RecordPage;
