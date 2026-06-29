import React, { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Monitor,
  Search,
  User,
  X,
} from "lucide-react";
import {
  doctorService,
  departmentService,
  registrationService,
  triageQueueService,
  queueDisplayService,
  patientService,
} from "@/lib/services";
import type { Patient, Doctor, Department, Registration } from "@/lib/types";
import { MotionCard } from "@/components/ui/motion";

const TIME_SLOTS = ["上午", "下午", "晚班"];
const DEFAULT_REG_FEE = 50;

const inputClass =
  "w-full px-3 py-2.5 border border-border rounded-xl bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
const labelClass = "block text-sm font-medium text-on-surface-variant mb-1";
const primaryButton =
  "motion-press inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";
const secondaryButton =
  "motion-press inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-primary/5 hover:text-primary";

const AppointmentRegistration: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [triageQueues, setTriageQueues] = useState<any[]>([]);
  const [queueDisplays, setQueueDisplays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"appointment" | "triage" | "display">("appointment");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [appointmentForm, setAppointmentForm] = useState({
    patientId: 0,
    doctorId: 0,
    dept: "",
    regFee: DEFAULT_REG_FEE,
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "上午",
    source: "online",
  });

  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    gender: "男",
    age: "",
    birthDate: "",
    phone: "",
    idCard: "",
    address: "",
    occupation: "",
    maritalStatus: "未婚",
    insuranceType: "自费",
    medicalInsuranceNo: "",
    contractUnit: "",
    emergencyContact: "",
    emergencyPhone: "",
    allergyHistory: "",
    hospitalId: "",
  });
  const [savingPatient, setSavingPatient] = useState(false);
  const [duplicatePatients, setDuplicatePatients] = useState<any[]>([]);
  const [lastRegistration, setLastRegistration] = useState<Registration | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "triage") loadTriageQueue();
    if (activeTab === "display") loadQueueDisplay();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [patientsRes, doctorsData, deptsData, regsData] = await Promise.all([
        fetch(`/api/patients?size=99999`).then((r) => r.json()).then((d) => d.patients || []),
        doctorService.getAll(),
        departmentService.getAll(),
        registrationService.getAll(),
      ]);
      setDoctors(doctorsData);
      setDepartments(deptsData);
      setRegistrations(regsData);
      void patientsRes;
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTriageQueue = async (deptId?: number, doctorId?: number) => {
    try {
      const data = await triageQueueService.getAll({
        deptId,
        doctorId,
        status: "waiting",
      });
      setTriageQueues(data);
    } catch (error) {
      console.error("加载分诊队列失败:", error);
    }
  };

  const loadQueueDisplay = async (deptId?: number) => {
    try {
      const data = await queueDisplayService.getAll(deptId);
      setQueueDisplays(data);
    } catch (error) {
      console.error("加载叫号大屏失败:", error);
    }
  };

  const handleSearchPatient = async () => {
    if (!searchTerm.trim()) return;
    try {
      const res = await fetch(`/api/patients?keyword=${encodeURIComponent(searchTerm)}`);
      const json = await res.json();
      const results = json.patients || json || [];
      setSearchResults(Array.isArray(results) ? results : []);
      setShowSearchResults(true);
    } catch (error) {
      console.error("搜索患者失败:", error);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setAppointmentForm((prev) => ({ ...prev, patientId: patient.id }));
    setShowSearchResults(false);
    setSearchTerm(patient.name);
  };

  const handleNewPatient = async () => {
    setSavingPatient(true);
    try {
      const duplicateCheck = await patientService.checkDuplicate({
        idCard: newPatientForm.idCard,
        phone: newPatientForm.phone,
        medicalInsuranceNo: newPatientForm.medicalInsuranceNo,
      });
      if (duplicateCheck.hasDuplicate) {
        setDuplicatePatients(duplicateCheck.duplicates || []);
        setSavingPatient(false);
        return;
      }
      const hospitalId = newPatientForm.hospitalId || `H${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const patientData = {
        name: newPatientForm.name || searchTerm,
        gender: newPatientForm.gender,
        age: parseInt(newPatientForm.age) || 0,
        birthDate: newPatientForm.birthDate || undefined,
        phone: newPatientForm.phone,
        idCard: newPatientForm.idCard,
        address: newPatientForm.address || undefined,
        occupation: newPatientForm.occupation || undefined,
        maritalStatus: newPatientForm.maritalStatus || undefined,
        insuranceType: newPatientForm.insuranceType || undefined,
        medicalInsuranceNo: newPatientForm.medicalInsuranceNo || undefined,
        contractUnit: newPatientForm.contractUnit || undefined,
        emergencyContact: newPatientForm.emergencyContact || undefined,
        emergencyPhone: newPatientForm.emergencyPhone || undefined,
        allergyHistory: newPatientForm.allergyHistory || undefined,
        medicalRecordNo: `MR${Date.now()}`,
        hospitalId,
      };
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      });
      const result = await res.json();
      if (result.success || result.id) {
        const newPatient: Patient = { ...patientData, id: result.id, age: parseInt(newPatientForm.age) || 0 };
        setSelectedPatient(newPatient);
        setAppointmentForm((prev) => ({ ...prev, patientId: result.id }));
        setShowNewPatientDialog(false);
        setDuplicatePatients([]);
        setSearchTerm(patientData.name);
        await loadData();
      }
    } catch (error) {
      console.error("创建患者失败:", error);
    } finally {
      setSavingPatient(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedPatient || !appointmentForm.doctorId) return;
    setLoading(true);
    try {
      const selectedDoc = doctors.find((d) => d.id === appointmentForm.doctorId);
      const regData = {
        patientId: selectedPatient.id,
        doctorId: appointmentForm.doctorId,
        dept: selectedDoc?.dept || appointmentForm.dept,
        regFee: appointmentForm.regFee,
        regStatus: "waiting",
        regTime: new Date().toISOString(),
      };
      const result = await registrationService.add(regData);
      if (result.success || result.id) {
        const newReg: Registration = {
          id: result.id || 0,
          ...regData,
          patientName: selectedPatient.name,
          doctorName: selectedDoc?.name || "",
          createTime: new Date().toISOString(),
        };
        setLastRegistration(newReg);
        setShowSuccess(true);
        await loadData();
        await loadTriageQueue();
      }
    } catch (error) {
      console.error("挂号失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallPatient = async (queueItem: any) => {
    try {
      await triageQueueService.update({
        id: queueItem.id,
        status: "calling",
        callCount: (queueItem.call_count || 0) + 1,
      });
      await queueDisplayService.add({
        deptId: queueItem.dept_id,
        deptName: queueItem.dept_name,
        doctorId: queueItem.doctor_id,
        doctorName: queueItem.doctor_name,
        doctorRoom: `${queueItem.dept_name}${queueItem.doctor_name}诊室`,
        currentQueueNo: queueItem.queue_no,
        currentPatientName: queueItem.patient_name,
        waitingList: JSON.stringify(triageQueues.filter((q) => q.status === "waiting").map((q) => q.patient_name)),
      });
      await loadTriageQueue();
      await loadQueueDisplay();
    } catch (error) {
      console.error("叫号失败:", error);
    }
  };

  const handleCompletePatient = async (queueItem: any) => {
    try {
      await triageQueueService.update({
        id: queueItem.id,
        status: "completed",
        callCount: queueItem.call_count || 0,
      });
      await loadTriageQueue();
    } catch (error) {
      console.error("完成就诊失败:", error);
    }
  };

  const filteredDoctors = selectedDept ? doctors.filter((d) => d.dept === selectedDept) : doctors;
  const filteredQueues = triageQueues.filter((q) => {
    if (selectedDept && q.dept_name !== selectedDept) return false;
    if (selectedDoctor && q.doctor_id !== selectedDoctor) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">预约挂号管理</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            患者核验、预约挂号、分诊队列和叫号大屏
          </p>
        </div>
      </div>

      <MotionCard className="w-fit rounded-xl border border-border bg-card p-1">
        <div className="flex gap-1">
          {[
            { key: "appointment", label: "预约挂号", icon: Calendar },
            { key: "triage", label: "分诊队列", icon: Clock },
            { key: "display", label: "叫号大屏", icon: Monitor },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`motion-press flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-on-surface-variant hover:bg-primary/5 hover:text-primary"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </MotionCard>

      {activeTab === "appointment" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <MotionCard index={1} className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                <User size={18} className="text-primary" />
                患者身份核验
              </h2>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="输入患者姓名、手机号或ID搜索..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSearchResults(false);
                    }}
                    className={inputClass}
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                      {searchResults.map((p, i) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className="motion-row flex items-center gap-3 px-4 py-3 hover:bg-primary/5 cursor-pointer border-b border-border last:border-0"
                          style={{ animationDelay: `${Math.min(i * 20, 100)}ms` }}
                        >
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User size={14} className="text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-on-surface">{p.name}</div>
                            <div className="text-xs text-on-surface-variant">
                              {p.gender} | {p.phone || "无电话"} | {p.hospitalId || "无ID"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={handleSearchPatient} className={primaryButton}>
                  <Search size={16} /> 查询
                </button>
                <button onClick={() => setShowNewPatientDialog(true)} className={secondaryButton}>
                  <User size={16} /> 新建建档
                </button>
              </div>

              {selectedPatient && (
                <div className="motion-feedback-success mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                        {selectedPatient.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-on-surface">{selectedPatient.name}</div>
                        <div className="text-xs text-on-surface-variant">
                          {selectedPatient.gender} | {selectedPatient.age}岁 | {selectedPatient.phone || "无电话"}
                          {selectedPatient.hospitalId && ` | ID: ${selectedPatient.hospitalId}`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setSearchTerm("");
                      }}
                      className="motion-press text-on-surface-variant hover:text-destructive"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )}
            </MotionCard>

            <MotionCard index={2} className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                预约挂号信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>挂号科室</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      setAppointmentForm((prev) => ({ ...prev, dept: e.target.value }));
                    }}
                    className={inputClass}
                  >
                    <option value="">选择科室</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>挂号医生</label>
                  <select
                    value={appointmentForm.doctorId}
                    onChange={(e) => setAppointmentForm((prev) => ({ ...prev, doctorId: parseInt(e.target.value) }))}
                    className={inputClass}
                  >
                    <option value="">选择医生</option>
                    {filteredDoctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.title})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>预约日期</label>
                  <input
                    type="date"
                    value={appointmentForm.appointmentDate}
                    onChange={(e) => setAppointmentForm((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>预约时段</label>
                  <select
                    value={appointmentForm.timeSlot}
                    onChange={(e) => setAppointmentForm((prev) => ({ ...prev, timeSlot: e.target.value }))}
                    className={inputClass}
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>挂号来源</label>
                  <select
                    value={appointmentForm.source}
                    onChange={(e) => setAppointmentForm((prev) => ({ ...prev, source: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="online">线上预约</option>
                    <option value="offline">线下窗口</option>
                    <option value="self">自助机</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>挂号费（元）</label>
                  <input
                    type="number"
                    value={appointmentForm.regFee}
                    onChange={(e) => setAppointmentForm((prev) => ({ ...prev, regFee: parseFloat(e.target.value) || 0 }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                onClick={handleRegister}
                disabled={!selectedPatient || !appointmentForm.doctorId || loading}
                className={`${primaryButton} mt-6 w-full py-3`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                {loading ? "处理中..." : "确认挂号"}
              </button>
            </MotionCard>
          </div>

          <div className="space-y-6">
            <MotionCard index={3} className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                <Bell size={16} className="text-warning" />
                今日挂号统计
              </h3>
              <div className="space-y-3">
                {[
                  ["今日挂号总数", registrations.length, "text-primary"],
                  ["在线预约", registrations.filter((r) => r.regStatus === "已挂号").length, "text-success"],
                  ["待分诊", triageQueues.filter((q) => q.status === "waiting").length, "text-warning"],
                ].map(([label, value, color], i) => (
                  <div key={label} className="motion-row flex justify-between items-center py-2 border-b border-border last:border-0" style={{ animationDelay: `${i * 24}ms` }}>
                    <span className="text-sm text-on-surface-variant">{label}</span>
                    <span className={`text-lg font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </MotionCard>

            <MotionCard index={4} className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                最近挂号记录
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {registrations.slice(-5).reverse().map((reg, i) => (
                  <div key={reg.id} className="motion-row p-2.5 bg-primary/5 rounded-lg text-sm" style={{ animationDelay: `${i * 24}ms` }}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-on-surface">{reg.patientName || `患者#${reg.patientId}`}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        reg.regStatus === "已挂号" ? "bg-success/10 text-success" : "bg-muted text-on-surface-variant"
                      }`}>{reg.regStatus}</span>
                    </div>
                    <div className="text-xs text-on-surface-variant mt-1">
                      {reg.doctorName || `医生#${reg.doctorId}`} | {reg.dept}
                    </div>
                  </div>
                ))}
              </div>
            </MotionCard>
          </div>
        </div>
      )}

      {activeTab === "triage" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MotionCard className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                分诊候诊队列
              </h2>
              <button onClick={() => loadTriageQueue()} className={secondaryButton}>
                刷新
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className={inputClass}>
                <option value="">全部科室</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(parseInt(e.target.value))} className={inputClass}>
                <option value={0}>全部医生</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["排队号", "患者姓名", "性别", "科室", "医生", "状态", "等待时长", "操作"].map((head) => (
                      <th key={head} className="text-left py-3 px-2 text-on-surface-variant font-medium">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredQueues.map((q, idx) => (
                    <tr key={q.id} className="motion-row border-b border-border hover:bg-primary/5" style={{ animationDelay: `${Math.min(idx * 20, 120)}ms` }}>
                      <td className="py-3 px-2"><span className="font-bold text-primary">{q.queue_no}</span></td>
                      <td className="py-3 px-2 font-medium text-on-surface">{q.patient_name}</td>
                      <td className="py-3 px-2 text-on-surface-variant">{q.patient_gender}</td>
                      <td className="py-3 px-2 text-on-surface-variant">{q.dept_name}</td>
                      <td className="py-3 px-2 text-on-surface-variant">{q.doctor_name}</td>
                      <td className="py-3 px-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          q.status === "waiting" ? "bg-warning/10 text-warning" :
                          q.status === "calling" ? "bg-success/10 text-success" :
                          "bg-muted text-on-surface-variant"
                        }`}>
                          {q.status === "waiting" ? "候诊中" : q.status === "calling" ? "叫诊中" : "已完成"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-on-surface-variant">{q.waiting_duration || 0}分钟</td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          {q.status === "waiting" && (
                            <button onClick={() => handleCallPatient(q)} className="motion-press px-2 py-1 bg-success text-success-foreground rounded-lg text-xs hover:opacity-90">
                              叫号
                            </button>
                          )}
                          {q.status === "calling" && (
                            <button onClick={() => handleCompletePatient(q)} className="motion-press px-2 py-1 bg-primary text-primary-foreground rounded-lg text-xs hover:opacity-90">
                              完成
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredQueues.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-on-surface-variant">暂无候诊患者</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </MotionCard>

          <MotionCard className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
              <Bell size={16} className="text-warning" />
              队列统计
            </h3>
            <div className="space-y-3">
              {[
                ["候诊中", triageQueues.filter((q) => q.status === "waiting").length, "text-warning"],
                ["叫诊中", triageQueues.filter((q) => q.status === "calling").length, "text-success"],
                ["已完成", triageQueues.filter((q) => q.status === "completed").length, "text-primary"],
              ].map(([label, value, color], i) => (
                <div key={label} className="motion-row flex justify-between py-2 border-b border-border last:border-0" style={{ animationDelay: `${i * 24}ms` }}>
                  <span className="text-sm text-on-surface-variant">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </MotionCard>
        </div>
      )}

      {activeTab === "display" && (
        <MotionCard className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2">
              <Monitor size={18} className="text-primary" />
              分诊叫号大屏
            </h2>
            <button onClick={() => loadQueueDisplay()} className={secondaryButton}>
              刷新
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queueDisplays.map((d, i) => (
              <div key={d.id} className="motion-card rounded-xl p-6 border border-primary/20 bg-primary/5" style={{ animationDelay: `${Math.min(i * 35, 180)}ms` }}>
                <div className="text-center">
                  <div className="text-sm text-primary font-medium">{d.dept_name}</div>
                  <div className="text-lg font-bold text-on-surface mt-1">{d.doctor_name} 医生</div>
                  <div className="text-xs text-on-surface-variant mt-1">{d.doctor_room}</div>
                  <div className="mt-4 p-4 bg-card rounded-xl border border-border">
                    <div className="text-3xl font-bold text-primary">{d.current_queue_no}</div>
                    <div className="text-lg font-semibold text-on-surface mt-1">{d.current_patient_name}</div>
                    <div className="text-xs text-on-surface-variant mt-1">当前叫号</div>
                  </div>
                  <div className="mt-3 text-xs text-on-surface-variant">
                    候诊人数: {d.waiting_list ? JSON.parse(d.waiting_list).length : 0}人
                  </div>
                </div>
              </div>
            ))}
            {queueDisplays.length === 0 && (
              <div className="col-span-full py-12 text-center text-on-surface-variant">
                <Monitor size={48} className="mx-auto mb-3 text-muted-foreground" />
                暂无叫号信息
              </div>
            )}
          </div>
        </MotionCard>
      )}

      {showNewPatientDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="motion-card bg-card rounded-2xl p-6 w-full max-w-lg shadow-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-on-surface">新建患者档案</h3>
              <button onClick={() => setShowNewPatientDialog(false)} className="motion-press text-on-surface-variant hover:text-on-surface">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "姓名", key: "name", type: "text" },
                { label: "性别", key: "gender", type: "select", options: ["男", "女"] },
                { label: "年龄", key: "age", type: "number" },
                { label: "出生日期", key: "birthDate", type: "date" },
                { label: "电话", key: "phone", type: "text" },
                { label: "身份证", key: "idCard", type: "text" },
                { label: "婚姻状况", key: "maritalStatus", type: "select", options: ["未婚", "已婚", "离异", "丧偶"] },
                { label: "医保类型", key: "insuranceType", type: "select", options: ["自费", "职工医保", "居民医保", "新农合"] },
                { label: "医保号", key: "medicalInsuranceNo", type: "text" },
                { label: "职业", key: "occupation", type: "text" },
                { label: "合同单位", key: "contractUnit", type: "text" },
                { label: "紧急联系人", key: "emergencyContact", type: "text" },
                { label: "紧急联系电话", key: "emergencyPhone", type: "text" },
                { label: "过敏史", key: "allergyHistory", type: "text" },
                { label: "地址", key: "address", type: "text" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      value={(newPatientForm as any)[field.key]}
                      onChange={(e) => setNewPatientForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className={inputClass}
                    >
                      {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={(newPatientForm as any)[field.key]}
                      onChange={(e) => setNewPatientForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className={inputClass}
                    />
                  )}
                </div>
              ))}
            </div>
            {duplicatePatients.length > 0 && (
              <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
                <div className="mb-2 font-medium text-warning">发现可能重复的患者档案，请优先选择已有患者</div>
                <div className="space-y-2">
                  {duplicatePatients.map((item, index) => {
                    const patient = item.patient || item;
                    return (
                      <button
                        key={patient.id || index}
                        type="button"
                        onClick={() => {
                          handleSelectPatient(patient);
                          setShowNewPatientDialog(false);
                          setDuplicatePatients([]);
                        }}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-left hover:border-primary"
                      >
                        <div className="font-medium">{patient.name} · {patient.gender} · {patient.age}岁</div>
                        <div className="text-xs text-on-surface-variant">
                          {patient.medicalRecordNo || patient.medical_record_no || "-"} · {patient.phone || "-"} · {patient.idCard || patient.id_card || "-"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewPatientDialog(false)} className={`${secondaryButton} flex-1`}>
                取消
              </button>
              <button onClick={handleNewPatient} disabled={savingPatient} className={`${primaryButton} flex-1`}>
                {savingPatient ? <Loader2 size={14} className="animate-spin" /> : null}
                确认建档
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && lastRegistration && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="motion-feedback-success bg-card rounded-2xl p-8 w-full max-w-md shadow-xl text-center border border-border">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">挂号成功</h3>
            <div className="text-sm text-on-surface-variant mb-6">
              患者 {lastRegistration.patientName} 已成功挂号
            </div>
            <div className="bg-primary/5 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">患者</span><span className="font-medium text-on-surface">{lastRegistration.patientName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">医生</span><span className="font-medium text-on-surface">{lastRegistration.doctorName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">科室</span><span className="font-medium text-on-surface">{lastRegistration.dept}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">挂号费</span><span className="font-medium text-primary">¥{lastRegistration.regFee}</span></div>
            </div>
            <button
              onClick={() => {
                setShowSuccess(false);
                setLastRegistration(null);
              }}
              className={`${primaryButton} w-full`}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentRegistration;
