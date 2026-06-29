import React, { useState, useEffect } from "react";
import { ClipboardList, Search, CheckCircle, Clock, AlertCircle, Loader2, Eye, Save, FileCheck } from "lucide-react";
import { patientService, prescriptionExaminationService, prescriptionService, medicalRecordService } from "@/lib/services";
import type { Patient, Prescription, PrescriptionExamination, MedicalRecord } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

const PhysicalExamManagement: React.FC = () => {
  const { user } = useAuth();
  const [examItems, setExamItems] = useState<PrescriptionExamination[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const patientsRes = await fetch("/api/patients?size=99999");
      const patientsJson = await patientsRes.json();
      const [examData, prescData, recordData] = await Promise.all([
        prescriptionExaminationService.getAll(),
        prescriptionService.getAll(),
        medicalRecordService.getAll(),
      ]);
      setExamItems(examData || []);
      setPrescriptions(prescData || []);
      setPatients(patientsJson.patients || []);
      setMedicalRecords(recordData || []);
    } catch (error) {
      console.error("加载体检数据失败:", error);
    }
    setLoading(false);
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || '未知患者';
  };

  const getPrescription = (prescriptionId: number) => {
    return prescriptions.find(p => p.id === prescriptionId);
  };

  const getMedicalRecord = (patientId: number) => {
    return medicalRecords.find(r => r.patientId === patientId);
  };

  const pendingExams = examItems.filter(e => e.status === 'pending' || e.status !== 'completed');

  const groupedByPatient = examItems.reduce((groups, item) => {
    const presc = getPrescription(item.prescriptionId);
    const patientId = presc?.patientId || 0;
    if (!groups[patientId]) {
      groups[patientId] = [];
    }
    groups[patientId].push(item);
    return groups;
  }, {} as Record<number, PrescriptionExamination[]>);

  const filteredPatients = Object.keys(groupedByPatient)
    .map(Number)
    .filter(pid => {
      const items = groupedByPatient[pid] || [];
      const hasMatching = statusFilter === "all"
        ? items.length > 0
        : statusFilter === "completed"
          ? items.some(i => i.status === 'completed')
          : items.some(i => i.status !== 'completed');
      if (!hasMatching) return false;
      const name = getPatientName(pid);
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             pid.toString().includes(searchTerm);
    })
    .sort((a, b) => b - a);

  const handleSaveResult = async (itemId: number, result: string) => {
    setSaving(true);
    try {
      await prescriptionExaminationService.update(itemId, { result, status: 'completed' });
      setExamItems(examItems.map(item =>
        item.id === itemId ? { ...item, result, status: 'completed' as const } : item
      ));
    } catch (error) {
      console.error("保存结果失败:", error);
      alert("保存失败，请重试");
    }
    setSaving(false);
  };

  const handleSyncToDiagnosis = async (patientId: number) => {
    const completedItems = examItems.filter(
      e => {
        const presc = getPrescription(e.prescriptionId);
        return presc?.patientId === patientId && e.status === 'completed' && e.result;
      }
    );

    if (completedItems.length === 0) {
      alert("没有可同步的检查结果");
      return;
    }

    const diagnosisText = completedItems
      .map(item => `${item.examinationName}: ${item.result}`)
      .join('; ');

    const existingRecord = getMedicalRecord(patientId);

    try {
      if (existingRecord) {
        const updatedDiagnosis = existingRecord.diagnosis
          ? `${existingRecord.diagnosis}\n${diagnosisText}`
          : diagnosisText;
        await medicalRecordService.update(existingRecord.id, { diagnosis: updatedDiagnosis });
        setMedicalRecords(medicalRecords.map(r =>
          r.id === existingRecord.id ? { ...r, diagnosis: updatedDiagnosis } : r
        ));
      } else {
        await medicalRecordService.add({
          patientId,
          doctorId: user?.id || 0,
          registrationId: 0,
          diagnosis: diagnosisText,
        });
      }
      alert("诊断已同步到病历");
      loadData();
    } catch (error) {
      console.error("同步诊断失败:", error);
      alert("同步失败，请重试");
    }
  };

  const getPatientStats = (patientId: number) => {
    const items = groupedByPatient[patientId] || [];
    const total = items.length;
    const done = items.filter(i => i.status === 'completed').length;
    const totalFee = items.reduce((sum, i) => sum + (i.totalPrice || i.price || 0), 0);
    return { total, done, totalFee };
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-full px-8 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline font-bold text-3xl text-primary tracking-tight">体检管理</h1>
          <p className="text-sm text-on-surface-variant mt-2 font-label uppercase tracking-widest">
            PHYSICAL EXAMINATION / 检查检验
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface-container-low p-6 border-l-2 border-primary">
          <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-2">待检患者</p>
          <p className="text-3xl font-headline font-bold text-primary">{filteredPatients.length}</p>
        </div>
        <div className="bg-surface-container-low p-6 border-l-2 border-secondary">
          <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-2">待检项目</p>
          <p className="text-3xl font-headline font-bold text-secondary">{pendingExams.length}</p>
        </div>
        <div className="bg-surface-container-low p-6 border-l-2 border-tertiary">
          <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-2">已完成</p>
          <p className="text-3xl font-headline font-bold text-tertiary">{examItems.filter(e => e.status === 'completed').length}</p>
        </div>
        <div className="bg-surface-container-low p-6 border-l-2 border-outline">
          <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-2">总费用</p>
          <p className="text-3xl font-headline font-bold text-outline">
            ¥{pendingExams.reduce((s, e) => s + (e.totalPrice || e.price || 0), 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索患者姓名或ID..."
            className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none font-body text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none font-body text-sm min-w-[140px]"
        >
          <option value="pending">待完成</option>
          <option value="completed">已完成</option>
          <option value="all">全部</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <div className="bg-surface-container-low p-12 text-center">
            <ClipboardList className="mx-auto text-outline mb-4 opacity-50" size={48} />
            <p className="font-headline text-outline uppercase tracking-widest">
              {statusFilter === "completed" ? "暂无已完成项目" : "暂无待检项目"}
            </p>
            <p className="text-xs text-on-surface-variant mt-2">
              {statusFilter === "completed" ? "完成检查后，记录会显示在这里" : "医生开检查后，患者会出现在这里"}
            </p>
          </div>
        ) : (
          filteredPatients.map((patientId) => {
            const items = groupedByPatient[patientId] || [];
            const filteredItems = statusFilter === "all" ? items : statusFilter === "completed" ? items.filter(i => i.status === 'completed') : items.filter(i => i.status !== 'completed');
            const stats = getPatientStats(patientId);
            const record = getMedicalRecord(patientId);

            if (filteredItems.length === 0) return null;

            return (
              <div key={patientId} className="bg-surface-container-low p-6 hover:bg-surface-container-high transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-surface-container flex items-center justify-center border-l-2 border-primary">
                      <FileCheck className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg text-primary">{getPatientName(patientId)}</h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        ID: {patientId.toString().padStart(3, '0')} | 处方号: {[...new Set(items.map(i => i.prescriptionId))].join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <span className="block text-[10px] font-label text-on-surface-variant uppercase">进度</span>
                      <span className="text-sm font-body text-primary">{stats.done}/{stats.total}</span>
                    </div>
                    <div className="text-right hidden md:block">
                      <span className="block text-[10px] font-label text-on-surface-variant uppercase">费用</span>
                      <span className="text-lg font-headline font-bold text-tertiary">¥{stats.totalFee.toFixed(2)}</span>
                    </div>
                    {record?.diagnosis && (
                      <span className="px-3 py-1 text-xs font-label bg-tertiary/10 text-tertiary border border-tertiary/30">
                        已有诊断
                      </span>
                    )}
                    <button
                      onClick={() => { setSelectedPatientId(patientId); setShowDetailModal(true); }}
                      className="py-2 px-4 bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <Eye size={14} />
                      填写结果
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-outline-variant/10">
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <span
                        key={item.id}
                        className={`px-3 py-1 text-xs font-label ${
                          item.status === 'completed'
                            ? "bg-tertiary/10 text-tertiary border border-tertiary/30"
                            : "bg-surface-container text-outline border border-outline-variant/20"
                        }`}
                      >
                        {item.examinationName || `检查${item.examinationId}`}
                        {item.result && `: ${item.result}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showDetailModal && selectedPatientId && (
        <ExamDetailModal
          patientId={selectedPatientId}
          patientName={getPatientName(selectedPatientId)}
          examItems={examItems.filter(e => {
            const presc = getPrescription(e.prescriptionId);
            return presc?.patientId === selectedPatientId;
          })}
          medicalRecord={getMedicalRecord(selectedPatientId)}
          onSaveResult={handleSaveResult}
          onSyncDiagnosis={() => handleSyncToDiagnosis(selectedPatientId)}
          saving={saving}
          onClose={() => { setShowDetailModal(false); setSelectedPatientId(null); }}
        />
      )}
    </div>
  );
};

interface ExamDetailModalProps {
  patientId: number;
  patientName: string;
  examItems: PrescriptionExamination[];
  medicalRecord?: MedicalRecord;
  onSaveResult: (itemId: number, result: string) => void;
  onSyncDiagnosis: () => void;
  saving: boolean;
  onClose: () => void;
}

const ExamDetailModal: React.FC<ExamDetailModalProps> = ({
  patientName,
  examItems,
  medicalRecord,
  onSaveResult,
  onSyncDiagnosis,
  saving,
  onClose,
}) => {
  const [results, setResults] = useState<Record<number, string>>({});
  const [localItems, setLocalItems] = useState(examItems);

  useEffect(() => {
    setLocalItems(examItems);
    const initial: Record<number, string> = {};
    examItems.forEach(item => {
      if (item.result) initial[item.id] = item.result;
    });
    setResults(initial);
  }, [examItems]);

  const handleItemSave = async (itemId: number) => {
    const result = results[itemId];
    if (!result || !result.trim()) {
      alert("请填写检查结果");
      return;
    }
    await onSaveResult(itemId, result);
    setLocalItems(localItems.map(item =>
      item.id === itemId ? { ...item, result, status: 'completed' as const } : item
    ));
  };

  const allCompleted = localItems.every(i => i.status === 'completed');
  const hasCompletedWithResult = localItems.some(i => i.status === 'completed' && i.result);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-dim/80 backdrop-blur-md px-4">
      <div className="bg-surface w-full max-w-2xl p-8 relative max-h-[90vh] overflow-auto">
        <h2 className="font-headline font-bold text-xl text-primary mb-2">填写检查结果</h2>
        <p className="text-sm text-on-surface-variant mb-6">{patientName}</p>

        <div className="space-y-4 mb-6">
          {localItems.map((item) => (
            <div key={item.id} className={`p-4 bg-surface-container-low border-l-2 ${item.status === 'completed' ? 'border-tertiary' : 'border-outline-variant/20'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {item.status === 'completed' ? (
                      <CheckCircle className="text-tertiary" size={16} />
                    ) : (
                      <Clock className="text-primary" size={16} />
                    )}
                    <span className="font-headline font-bold text-sm">{item.examinationName || `检查${item.examinationId}`}</span>
                    <span className="text-xs text-outline font-label px-2 py-0.5 bg-surface-container">
                      ¥{(item.totalPrice || item.price || 0).toFixed(2)}
                    </span>
                  </div>
                  {item.status !== 'completed' ? (
                    <textarea
                      value={results[item.id] || ''}
                      onChange={(e) => setResults({ ...results, [item.id]: e.target.value })}
                      placeholder="输入检查结果..."
                      rows={2}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant/30 focus:border-primary focus:outline-none font-body text-sm resize-none"
                    />
                  ) : (
                    <p className="text-sm text-on-surface bg-surface p-2 rounded">{item.result}</p>
                  )}
                </div>
                {item.status !== 'completed' && (
                  <button
                    onClick={() => handleItemSave(item.id)}
                    disabled={saving}
                    className="motion-press shrink-0 py-2 px-4 bg-primary text-on-primary font-label text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Save size={14} />
                    保存
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-outline-variant/10 pt-4 space-y-4">
          {medicalRecord?.diagnosis && (
            <div className="p-4 bg-surface-container-low">
              <span className="font-label text-xs text-on-surface-variant block mb-2">当前诊断</span>
              <pre className="text-sm text-on-surface whitespace-pre-wrap font-body">{medicalRecord.diagnosis}</pre>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-outline-variant text-on-surface-variant font-label text-xs uppercase tracking-widest hover:bg-white/5"
            >
              关闭
            </button>
            {hasCompletedWithResult && (
              <button
                onClick={onSyncDiagnosis}
                disabled={!hasCompletedWithResult}
                className="motion-press flex-1 py-3 bg-tertiary text-on-tertiary font-label font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileCheck size={14} />
                同步到病历诊断
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysicalExamManagement;
