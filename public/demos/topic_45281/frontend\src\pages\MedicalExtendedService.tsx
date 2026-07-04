import React, { useState, useEffect } from "react";
import { FlaskConical, Scan, Pill, Scissors, ClipboardList, Loader2, Search, User, Stethoscope, CheckCircle, Clock, AlertCircle, X, Eye, FileText } from "lucide-react";
import { prescriptionExaminationService, prescriptionService, prescriptionItemService, surgeryService, physicalExamService, patientService, doctorService } from "@/lib/services";
import type { PrescriptionExamination, Prescription, PrescriptionItem, Surgery, PhysicalExam, Patient, Doctor } from "@/lib/types";

const MedicalExtendedService: React.FC = () => {
  const [activeTab, setActiveTab] = useState("exam");
  const [searchTerm, setSearchTerm] = useState("");

  const tabs = [
    { key: "exam", label: "检验检查报告", icon: FlaskConical },
    { key: "prescription", label: "处方药品报告", icon: Pill },
    { key: "surgery", label: "手术报告", icon: Scissors },
    { key: "physical", label: "体检报告", icon: ClipboardList },
  ];

  return (
    <div className="theme-unified-page p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">医疗业务扩展报告</h1>
        <p className="text-xs text-outline">基于医生工作站实际开具数据</p>
      </div>

      <div className="flex items-center gap-3 bg-surface-container-low rounded-lg p-3 border border-outline-variant/10">
        <div className="relative flex-1 max-w-md">
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-2 pl-10 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            placeholder="搜索患者姓名..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-outline" size={18} />
        </div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent hover:text-on-surface-variant'
            }`}>
            <tab.icon size={16} />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "exam" && <ExamReportPanel searchTerm={searchTerm} />}
      {activeTab === "prescription" && <PrescriptionReportPanel searchTerm={searchTerm} />}
      {activeTab === "surgery" && <SurgeryReportPanel searchTerm={searchTerm} />}
      {activeTab === "physical" && <PhysicalReportPanel searchTerm={searchTerm} />}
    </div>
  );
};

/* ========== 检验检查报告 ========== */
const ExamReportPanel: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [items, setItems] = useState<PrescriptionExamination[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "lab" | "image">("all");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      prescriptionExaminationService.getAll(),
      patientService.getAll(),
      prescriptionService.getAll(),
    ]).then(([examData, patientData, prescData]) => {
      setItems(Array.isArray(examData) ? examData : []);
      setPatients(Array.isArray(patientData) ? patientData : []);
      setPrescriptions(Array.isArray(prescData) ? prescData : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getPatientIdByPrescription = (prescriptionId: number): number => {
    const p = prescriptions.find(p => p.id === prescriptionId);
    return p ? p.patientId : 0;
  };

  const getPatientName = (patientId: number) => {
    const p = patients.find(p => p.id === patientId);
    return p ? p.name : `患者#${patientId}`;
  };

  const filtered = items.filter(item => {
    if (filter !== "all" && item.category !== filter) return false;
    if (searchTerm) {
      const pid = getPatientIdByPrescription(item.prescriptionId);
      const name = getPatientName(pid);
      if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  const groupedByPatient = filtered.reduce((groups, item) => {
    const pid = getPatientIdByPrescription(item.prescriptionId);
    if (!groups[pid]) groups[pid] = [];
    groups[pid].push(item);
    return groups;
  }, {} as Record<number, PrescriptionExamination[]>);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["all", "lab", "image"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-outline hover:bg-surface-container-high'
            }`}>
            {f === "all" ? "全部" : f === "lab" ? "化验检查" : "影像检查"}
          </button>
        ))}
      </div>

      {Object.keys(groupedByPatient).length === 0 ? (
        <div className="p-8 text-center text-outline bg-surface-container-low rounded-lg">
          <FlaskConical size={40} className="mx-auto mb-2 opacity-30" />
          <p>暂无检查记录</p>
          <p className="text-xs mt-1">医生开具检查后，数据将显示在这里</p>
        </div>
      ) : (
        Object.entries(groupedByPatient).map(([patientIdStr, examItems]) => {
          const patientId = Number(patientIdStr);
          const labItems = examItems.filter(e => e.category === "lab");
          const imageItems = examItems.filter(e => e.category === "image");
          const completedCount = examItems.filter(e => e.status === "completed").length;

          return (
            <div key={patientId} className="bg-surface-container-low rounded-lg border border-outline-variant/10 overflow-hidden">
              <div className="bg-primary/5 p-3 border-b border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  <span className="font-bold text-sm">{getPatientName(patientId)}</span>
                  <span className="text-[10px] text-outline">{examItems.length} 项检查</span>
                </div>
                <span className="text-[10px] text-outline">{completedCount}/{examItems.length} 已完成</span>
              </div>
              <div className="p-3 space-y-2">
                {labItems.length > 0 && (
                  <div>
                    <p className="text-[10px] font-label text-outline uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FlaskConical size={12} /> 化验项目
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {labItems.map(item => (
                        <span key={item.id} className={`px-2 py-1 text-[11px] rounded flex items-center gap-1 ${
                          item.status === "completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          item.status === "cancelled" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}>
                          {item.status === "completed" ? <CheckCircle size={10} /> :
                           item.status === "cancelled" ? <X size={10} /> : <Clock size={10} />}
                          {item.examinationName || `检查#${item.examinationId}`}
                          {item.result && <span className="text-[10px] opacity-75">: {item.result}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {imageItems.length > 0 && (
                  <div>
                    <p className="text-[10px] font-label text-outline uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Scan size={12} /> 影像项目
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {imageItems.map(item => (
                        <span key={item.id} className={`px-2 py-1 text-[11px] rounded flex items-center gap-1 ${
                          item.status === "completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          item.status === "cancelled" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}>
                          {item.status === "completed" ? <CheckCircle size={10} /> :
                           item.status === "cancelled" ? <X size={10} /> : <Clock size={10} />}
                          {item.examinationName || `检查#${item.examinationId}`}
                          {item.result && <span className="text-[10px] opacity-75">: {item.result}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

/* ========== 处方药品报告 ========== */
const PrescriptionReportPanel: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      prescriptionService.getAll(),
      prescriptionItemService.getAll(),
      patientService.getAll(),
      doctorService.getAll(),
    ]).then(([prescData, itemData, patientData, doctorData]) => {
      setPrescriptions(Array.isArray(prescData) ? prescData : []);
      setItems(Array.isArray(itemData) ? itemData : []);
      setPatients(Array.isArray(patientData) ? patientData : []);
      setDoctors(Array.isArray(doctorData) ? doctorData : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getPatientName = (patientId: number) => {
    const p = patients.find(p => p.id === patientId);
    return p ? p.name : `患者#${patientId}`;
  };

  const getDoctorName = (doctorId: number) => {
    const d = doctors.find(d => d.id === doctorId);
    return d ? d.name : `医生#${doctorId}`;
  };

  const filtered = prescriptions.filter(p => {
    if (!searchTerm) return true;
    const name = getPatientName(p.patientId);
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>;

  return (
    <div className="space-y-3">
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-outline bg-surface-container-low rounded-lg">
          <Pill size={40} className="mx-auto mb-2 opacity-30" />
          <p>暂无处方记录</p>
        </div>
      ) : (
        filtered.map(p => {
          const drugItems = items.filter(i => i.prescriptionId === p.id);
          const isExpanded = expandedId === p.id;

          return (
            <div key={p.id} className="bg-surface-container-low rounded-lg border border-outline-variant/10 overflow-hidden">
              <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-surface-container-high/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Pill size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{getPatientName(p.patientId)}</p>
                    <p className="text-[10px] text-outline">
                      医生: {getDoctorName(p.doctorId)} | {p.createTime ? new Date(p.createTime).toLocaleString("zh-CN") : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary">¥{p.totalPrice?.toFixed(2) || "0.00"}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded ${
                    p.status === "dispensed" ? "bg-green-500/10 text-green-400" :
                    p.status === "paid" ? "bg-blue-500/10 text-blue-400" :
                    "bg-yellow-500/10 text-yellow-400"
                  }`}>{p.status}</span>
                  <FileText size={14} className="text-outline" />
                </div>
              </div>
              {isExpanded && drugItems.length > 0 && (
                <div className="border-t border-outline-variant/10 p-3 space-y-1.5">
                  {drugItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-surface-container-high/50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Pill size={12} className="text-primary" />
                        <span className="font-medium">{item.drugName || `药品#${item.drugId}`}</span>
                        {item.drugSpec && <span className="text-outline">{item.drugSpec}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-outline">x{item.num}</span>
                        {item.usage && <span className="text-outline">{item.usage}</span>}
                        <span className="font-bold text-primary">¥{(item.drugPrice * item.num).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isExpanded && drugItems.length === 0 && (
                <div className="border-t border-outline-variant/10 p-3 text-xs text-outline text-center">
                  暂无药品明细
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

/* ========== 手术报告 ========== */
const SurgeryReportPanel: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      surgeryService.getAll(),
      patientService.getAll(),
    ]).then(([surgData, patientData]) => {
      const list = Array.isArray(surgData) ? surgData : (surgData as any)?.items || [];
      setSurgeries(list);
      setPatients(Array.isArray(patientData) ? patientData : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getPatientName = (patientId: number) => {
    const p = patients.find(p => p.id === patientId);
    return p ? p.name : `患者#${patientId}`;
  };

  const filtered = surgeries.filter(s => {
    if (!searchTerm) return true;
    const name = getPatientName(s.patientId);
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (s.surgeryName || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>;

  return (
    <div className="space-y-3">
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-outline bg-surface-container-low rounded-lg">
          <Scissors size={40} className="mx-auto mb-2 opacity-30" />
          <p>暂无手术记录</p>
        </div>
      ) : (
        filtered.map(s => (
          <div key={s.id} className="bg-surface-container-low rounded-lg border border-outline-variant/10 overflow-hidden">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Scissors size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">{s.surgeryName}</p>
                  <p className="text-[10px] text-outline">
                    {getPatientName(s.patientId)} | {s.surgeonName || s.doctorName || "-"} | {s.dept || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-outline">
                  {s.surgeryDate ? new Date(s.surgeryDate).toLocaleDateString("zh-CN") : "-"}
                </span>
                <span className={`px-2 py-0.5 text-[10px] rounded ${
                  s.status === "completed" ? "bg-green-500/10 text-green-400" :
                  s.status === "in_progress" ? "bg-blue-500/10 text-blue-400" :
                  s.status === "cancelled" ? "bg-red-500/10 text-red-400" :
                  "bg-yellow-500/10 text-yellow-400"
                }`}>
                  {s.status === "completed" ? "已完成" :
                   s.status === "in_progress" ? "进行中" :
                   s.status === "cancelled" ? "已取消" :
                   s.status === "scheduled" ? "已安排" : s.status}
                </span>
              </div>
            </div>
            <div className="border-t border-outline-variant/10 p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-outline">手术室</span>
                <p className="font-medium">{s.surgeryRoom || "-"}</p>
              </div>
              <div>
                <span className="text-outline">麻醉方式</span>
                <p className="font-medium">{s.anesthesiaType || "-"}</p>
              </div>
              <div>
                <span className="text-outline">手术费用</span>
                <p className="font-medium text-primary">¥{s.surgeryFee?.toFixed(2) || "0.00"}</p>
              </div>
              <div>
                <span className="text-outline">麻醉费用</span>
                <p className="font-medium text-primary">¥{s.anesthesiaFee?.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/* ========== 体检报告 ========== */
const PhysicalReportPanel: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [exams, setExams] = useState<PhysicalExam[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<PhysicalExam | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      physicalExamService.getAll(),
      patientService.getAll(),
    ]).then(([examData, patientData]) => {
      setExams(Array.isArray(examData) ? examData : []);
      setPatients(Array.isArray(patientData) ? patientData : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getPatientName = (patientId: number) => {
    const p = patients.find(p => p.id === patientId);
    return p ? p.name : `患者#${patientId}`;
  };

  const filtered = exams.filter(e => {
    if (!searchTerm) return true;
    const name = getPatientName(e.patientId);
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>;

  return (
    <div className="space-y-3">
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-outline bg-surface-container-low rounded-lg">
          <ClipboardList size={40} className="mx-auto mb-2 opacity-30" />
          <p>暂无体检记录</p>
        </div>
      ) : (
        filtered.map(e => (
          <div key={e.id} className="bg-surface-container-low rounded-lg border border-outline-variant/10 overflow-hidden">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <ClipboardList size={16} className="text-teal-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">{getPatientName(e.patientId)}</p>
                  <p className="text-[10px] text-outline">
                    {e.examDate ? new Date(e.examDate).toLocaleDateString("zh-CN") : "-"}
                    {e.doctorName && ` | ${e.doctorName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[10px] rounded ${
                  e.status === "completed" ? "bg-green-500/10 text-green-400" :
                  e.status === "in_progress" ? "bg-blue-500/10 text-blue-400" :
                  "bg-yellow-500/10 text-yellow-400"
                }`}>{e.status === "completed" ? "已完成" : e.status === "in_progress" ? "进行中" : "已安排"}</span>
                <button onClick={() => setSelectedExam(e)}
                  className="p-1.5 rounded-lg bg-surface-container-high text-outline hover:text-primary transition-colors">
                  <Eye size={14} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {selectedExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-[560px] max-h-[90vh] overflow-auto space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ClipboardList size={20} className="text-primary" /> 体检详情
              </h3>
              <button onClick={() => setSelectedExam(null)} className="p-1 hover:bg-surface-container-high rounded">
                <X size={20} />
              </button>
            </div>
            <div className="text-sm">
              <p><span className="text-outline">患者:</span> {getPatientName(selectedExam.patientId)}</p>
              <p><span className="text-outline">日期:</span> {selectedExam.examDate ? new Date(selectedExam.examDate).toLocaleDateString("zh-CN") : "-"}</p>
              {selectedExam.doctorName && <p><span className="text-outline">医生:</span> {selectedExam.doctorName}</p>}
              {selectedExam.conclusion && (
                <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                  <p className="text-[10px] font-label text-outline uppercase tracking-wider">结论</p>
                  <p className="font-medium text-sm mt-1">{selectedExam.conclusion}</p>
                </div>
              )}
            </div>
            {selectedExam.examItems && selectedExam.examItems.length > 0 && (
              <div>
                <p className="text-xs font-label text-outline uppercase tracking-wider mb-2">检查项目</p>
                <div className="space-y-2">
                  {selectedExam.examItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-surface-container-high rounded text-xs">
                      <span className="font-medium">{item.name}</span>
                      <span>{item.result} {item.unit || ""}</span>
                      {item.reference && <span className="text-outline">(参考: {item.reference})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalExtendedService;
