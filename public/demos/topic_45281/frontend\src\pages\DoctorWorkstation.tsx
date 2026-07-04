import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Loader2, Stethoscope, Clock, ClipboardList, FileText, Pill, FlaskConical,
  Scan, Monitor, Activity, Heart, Droplets, History, Printer, Trash2, Scissors,
  Hash, AlertTriangle, CheckCircle2, ArrowRight, User, X, AlertCircle
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { doctorService, patientService, registrationService, drugService, doctorWorkstationService, pharmacyService } from "@/lib/services";
import type { Patient, Doctor, Registration, Drug, MedicalRecord, Prescription, VitalSign } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedPage from "@/components/ui/AnimatedPage";
import PrescriptionWarning from "@/components/doctor/PrescriptionWarning";
import ExaminationSelector from "@/components/doctor/ExaminationSelector";
import type { ExaminationItem } from "@/components/doctor/ExaminationSelector";
import ClinicalAttachmentPanel from "@/components/business/ClinicalAttachmentPanel";

interface QueueItem {
  id: number;
  patientId: number;
  patientName?: string;
  gender?: string;
  age?: number;
  queueNo: string;
  callStatus: "waiting" | "calling" | "passed";
  dept?: string;
  doctorId: number;
  doctorName?: string;
  registrationId: number;
  allergyHistory?: string;
  createTime?: string;
}

interface PrescriptionItem {
  drugId: number;
  drugName: string;
  spec: string;
  price: number;
  num: number;
  usage: string;
  days: number;
}

interface SurgeryOrderForm {
  enabled: boolean;
  surgeryName: string;
  surgeryType: string;
  surgeryRoom: string;
  anesthesiaType: string;
  surgeryDate: string;
  surgeryFee: number;
  anesthesiaFee: number;
}

const DoctorWorkstation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(null);
  const [queueList, setQueueList] = useState<QueueItem[]>([]);

  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [doctorSearchResults, setDoctorSearchResults] = useState<Doctor[]>([]);
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);

  const [consultStartTime, setConsultStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");

  const [emrForm, setEmrForm] = useState({
    chiefComplaint: "",
    presentIllness: "",
    pastHistory: "",
    physicalExam: "",
    diagnosis: "",
    treatmentPlan: "",
  });

  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [selectedExaminations, setSelectedExaminations] = useState<ExaminationItem[]>([]);
  const [surgeryOrder, setSurgeryOrder] = useState<SurgeryOrderForm>({
    enabled: false,
    surgeryName: "",
    surgeryType: "",
    surgeryRoom: "",
    anesthesiaType: "",
    surgeryDate: "",
    surgeryFee: 0,
    anesthesiaFee: 0,
  });

  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [patientHistory, setPatientHistory] = useState<{ records: MedicalRecord[]; prescriptions: Prescription[] }>({
    records: [],
    prescriptions: [],
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [latestVitalSign, setLatestVitalSign] = useState<VitalSign | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  const [activeRegistration, setActiveRegistration] = useState<Registration | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (location.state) {
      const state = location.state as { patientId?: number; registration?: Registration };
      if (state.registration) {
        setActiveRegistration(state.registration);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (consultStartTime) {
      timerRef.current = setInterval(() => {
        const diff = Math.floor((new Date().getTime() - consultStartTime.getTime()) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setElapsedTime(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [consultStartTime]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [doctorsData, patientsRes, regsData, drugsData] = await Promise.all([
        doctorService.getAll(),
        fetch(`/api/patients?size=99999`).then(r => r.json()).then(d => d.patients || []),
        registrationService.getAll(),
        drugService.getAll(),
      ]);
      setDoctors(doctorsData);
      setPatients(patientsRes);
      setRegistrations(regsData);
      setDrugs(drugsData);

      if (doctorsData.length > 0) {
        const loggedDoctorId = user?.doctorInfo?.id;
        if (loggedDoctorId && doctorsData.find(d => d.id === loggedDoctorId)) {
          handleDoctorChange(loggedDoctorId);
        } else {
          handleDoctorChange(doctorsData[0].id);
        }
      }
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPatientById = (id: number) => patients.find((p) => p.id === id);

  const loadPatientHistory = async (patientId: number) => {
    setHistoryLoading(true);
    try {
      const [recordsRes, presRes] = await Promise.all([
        fetch(`/api/medical-records?patientId=${patientId}`).then(r => r.json()),
        fetch(`/api/prescriptions?patientId=${patientId}`).then(r => r.json()),
      ]);
      setPatientHistory({
        records: Array.isArray(recordsRes) ? recordsRes : recordsRes.records || [],
        prescriptions: Array.isArray(presRes) ? presRes : presRes.prescriptions || [],
      });
    } catch (error) {
      console.error("加载患者历史失败:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDoctorChange = (doctorId: number) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor) return;

    setCurrentDoctor(doctor);
    setSelectedPatient(null);
    setSelectedQueueItem(null);
    setActiveRegistration(null);
    setConsultStartTime(null);
    setElapsedTime("00:00");
    setPrescriptionItems([]);
    setSelectedExaminations([]);
    setSurgeryOrder({
      enabled: false,
      surgeryName: "",
      surgeryType: "",
      surgeryRoom: "",
      anesthesiaType: "",
      surgeryDate: "",
      surgeryFee: 0,
      anesthesiaFee: 0,
    });
    setEmrForm({
      chiefComplaint: "",
      presentIllness: "",
      pastHistory: "",
      physicalExam: "",
      diagnosis: "",
      treatmentPlan: "",
    });

    const doctorRegs = registrations.filter(
      (r) => r.doctorId === doctor.id && (r.regStatus === "waiting" || r.regStatus === "in_progress")
    );
    const queueFromRegs: QueueItem[] = doctorRegs.map((reg, index) => ({
      id: reg.id,
      patientId: reg.patientId,
      patientName: patients.find((p) => p.id === reg.patientId)?.name,
      gender: patients.find((p) => p.id === reg.patientId)?.gender,
      age: patients.find((p) => p.id === reg.patientId)?.age,
      queueNo: String(index + 1),
      callStatus: (reg.regStatus === "in_progress" ? "calling" : "waiting") as "waiting" | "calling" | "passed",
      dept: reg.dept,
      doctorId: reg.doctorId,
      doctorName: doctor.name,
      registrationId: reg.id,
      allergyHistory: patients.find((p) => p.id === reg.patientId)?.allergyHistory,
      createTime: reg.regTime,
    }));
    setQueueList(queueFromRegs);
  };

  const handleCallPatient = async (queue: QueueItem) => {
    try {
      await registrationService.updateStatus(queue.registrationId, "in_progress");
      const updatedRegs = await registrationService.getAll();
      setRegistrations(updatedRegs);

      const reg = updatedRegs.find(r => r.id === queue.registrationId);
      if (reg) setActiveRegistration(reg);

      setQueueList((prev) =>
        prev.map((q) =>
          q.id === queue.id ? { ...q, callStatus: "calling" as const } : q
        )
      );
      setSelectedQueueItem({ ...queue, callStatus: "calling" });
      const patient = getPatientById(queue.patientId);
      if (patient) {
        setSelectedPatient(patient);
        setEmrForm({
          chiefComplaint: "",
          presentIllness: "",
          pastHistory: patient.allergyHistory || "",
          physicalExam: "",
          diagnosis: "",
          treatmentPlan: "",
        });
        setPrescriptionItems([]);
        loadPatientHistory(queue.patientId);
      }
      setConsultStartTime(new Date());
    } catch (error) {
      console.error("叫号失败:", error);
    }
  };

  const handleMissPatient = async (queue: QueueItem) => {
    try {
      await registrationService.updateStatus(queue.registrationId, "passed");
      const updatedRegs = await registrationService.getAll();
      setRegistrations(updatedRegs);
      setQueueList((prev) =>
        prev.map((q) =>
          q.id === queue.id ? { ...q, callStatus: "passed" as const } : q
        )
      );
    } catch (error) {
      console.error("过号失败:", error);
    }
  };

  const handleRecallPatient = async (queue: QueueItem) => {
    try {
      await registrationService.updateStatus(queue.registrationId, "waiting");
      const updatedRegs = await registrationService.getAll();
      setRegistrations(updatedRegs);
      setQueueList((prev) =>
        prev.map((q) =>
          q.id === queue.id ? { ...q, callStatus: "waiting" as const } : q
        )
      );
    } catch (error) {
      console.error("重新叫号失败:", error);
    }
  };

  const addDrugToPrescription = (drug: Drug) => {
    const existing = prescriptionItems.find((item) => item.drugId === drug.id);
    if (existing) {
      setPrescriptionItems((prev) =>
        prev.map((item) =>
          item.drugId === drug.id ? { ...item, num: item.num + 1 } : item
        )
      );
    } else {
      setPrescriptionItems((prev) => [
        ...prev,
        {
          drugId: drug.id,
          drugName: drug.name,
          spec: drug.spec || "",
          price: drug.price,
          num: 1,
          usage: "口服",
          days: 3,
        },
      ]);
    }
  };

  const removeDrugFromPrescription = (drugId: number) => {
    setPrescriptionItems((prev) => prev.filter((item) => item.drugId !== drugId));
  };

  const updatePrescriptionItem = (drugId: number, field: string, value: string | number) => {
    setPrescriptionItems((prev) =>
      prev.map((item) =>
        item.drugId === drugId ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateTotal = () => {
    const drugTotal = prescriptionItems.reduce((sum, item) => sum + item.price * item.num, 0);
    const examTotal = selectedExaminations.length * 100;
    const surgeryTotal = (surgeryOrder.surgeryFee || 0) + (surgeryOrder.anesthesiaFee || 0);
    return drugTotal + examTotal + surgeryTotal;
  };

  const handleFullDiagnosis = async () => {
    if (!selectedPatient || !currentDoctor) {
      alert("请选择患者");
      return;
    }

    if (!emrForm.diagnosis) {
      alert("请填写诊断结果");
      return;
    }

    if (prescriptionItems.length === 0 && selectedExaminations.length === 0 && !surgeryOrder.enabled) {
      alert("请添加处方药品、检查项目或手术预约");
      return;
    }

    const registrationId = activeRegistration?.id || selectedQueueItem?.registrationId || 0;
    if (!registrationId) {
      alert("未找到关联的挂号记录，请先挂号");
      return;
    }

    setSaving(true);
    try {
      const result = await doctorWorkstationService.fullDiagnosis({
        patientId: selectedPatient.id,
        doctorId: currentDoctor.id,
        registrationId,
        medicalRecord: {
          chiefComplaint: emrForm.chiefComplaint,
          presentIllness: emrForm.presentIllness,
          pastHistory: emrForm.pastHistory,
          physicalExam: emrForm.physicalExam,
          diagnosis: emrForm.diagnosis,
          treatmentPlan: emrForm.treatmentPlan,
        },
        prescription: {
          items: prescriptionItems.map((item) => ({
            drugId: item.drugId,
            num: item.num,
            usage: item.usage,
            days: item.days,
          })),
        },
      }) as { success: boolean; prescriptionId?: number };

      if (result.success) {
        await registrationService.updateStatus(registrationId, "completed");
        const updatedRegs = await registrationService.getAll();
        setRegistrations(updatedRegs);

        alert("诊疗完成！处方已生成，请引导患者前往收费处缴费。");

        setSelectedPatient(null);
        setSelectedQueueItem(null);
        setActiveRegistration(null);
        setConsultStartTime(null);
        setElapsedTime("00:00");
        setPrescriptionItems([]);
        setSelectedExaminations([]);
        setSurgeryOrder({
          enabled: false,
          surgeryName: "",
          surgeryType: "",
          surgeryRoom: "",
          anesthesiaType: "",
          surgeryDate: "",
          surgeryFee: 0,
          anesthesiaFee: 0,
        });
        setEmrForm({
          chiefComplaint: "",
          presentIllness: "",
          pastHistory: "",
          physicalExam: "",
          diagnosis: "",
          treatmentPlan: "",
        });

        if (currentDoctor) handleDoctorChange(currentDoctor.id);
      }
    } catch (error) {
      console.error("诊疗失败:", error);
      alert("诊疗失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    alert("打印功能已触发");
  };

  const handleExport = () => {
    alert("导出功能已触发");
  };

  const callingQueue = queueList.filter((q) => q.callStatus === "calling");
  const waitingQueue = queueList.filter((q) => q.callStatus === "waiting");
  const missedQueue = queueList.filter((q) => q.callStatus === "passed");

  const generateVitalBars = (value: number, color: string) => {
    const bars = [];
    const normalizedValue = Math.min(value / 100, 1);
    for (let i = 0; i < 15; i++) {
      const height = Math.random() * 0.8 + 0.2;
      const opacity = i < normalizedValue * 15 ? (Math.random() * 0.6 + 0.4) : 0.2;
      bars.push(
        <div
          key={i}
          className={`w-1 ${color}`}
          style={{ height: `${height * 100}%`, opacity }}
        />
      );
    }
    return bars;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">医生工作站</h1>
          <p className="text-xs text-muted-foreground mt-0.5">基于挂号ID接诊 · 电子病历 · 处方开具</p>
        </div>
        <div className="flex items-center gap-3">
          {currentDoctor && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-container/30 rounded-md">
              <Stethoscope className="text-primary" size={14} />
              <span className="text-xs font-medium text-primary">{currentDoctor.name}</span>
              <span className="text-[10px] text-muted-foreground">{currentDoctor.dept}</span>
            </div>
          )}
          {activeRegistration && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success/5 border border-success/20 rounded-md">
              <Hash className="text-success" size={14} />
              <span className="text-xs font-bold text-success font-mono">挂号 #{activeRegistration.id}</span>
            </div>
          )}
          {selectedPatient && consultStartTime && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary-container/20 rounded-md">
              <Clock className="text-tertiary" size={14} />
              <span className="text-xs font-mono font-bold text-tertiary">{elapsedTime}</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-3 space-y-5">
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
                <ClipboardList size={16} className="text-primary" />
                候诊队列
              </h3>

              {(user?.userType === "ADMIN" || user?.role === "admin") && (
                <div className="mb-4 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input
                      type="text"
                      value={doctorSearchTerm}
                      onChange={(e) => {
                        const term = e.target.value;
                        setDoctorSearchTerm(term);
                        if (term.trim()) {
                          const results = doctors.filter(d =>
                            d.name.toLowerCase().includes(term.toLowerCase()) ||
                            d.dept.toLowerCase().includes(term.toLowerCase())
                          );
                          setDoctorSearchResults(results);
                          setShowDoctorSearch(results.length > 0);
                        } else {
                          setShowDoctorSearch(false);
                          setDoctorSearchResults([]);
                        }
                      }}
                      onFocus={() => {
                        if (doctorSearchTerm.trim() && doctorSearchResults.length > 0) setShowDoctorSearch(true);
                      }}
                      onBlur={() => setTimeout(() => setShowDoctorSearch(false), 200)}
                      placeholder="搜索医生..."
                      className="w-full bg-muted border border-transparent rounded-md pl-8 pr-3 py-2 text-xs focus:bg-card focus:border-primary focus:outline-none transition-all"
                    />
                    {showDoctorSearch && doctorSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {doctorSearchResults.map((d) => (
                          <button
                            key={d.id}
                            onMouseDown={(e) => { e.preventDefault(); setDoctorSearchTerm(d.name); setShowDoctorSearch(false); handleDoctorChange(d.id); }}
                            className="w-full text-left px-3 py-2 hover:bg-muted border-b border-border last:border-b-0 transition-colors"
                          >
                            <span className="text-xs font-medium text-card-foreground">{d.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">{d.dept}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentDoctor && (user?.userType !== "ADMIN" || user?.role === "doctor") && (
                <div className="bg-primary-container/20 p-3 rounded-md mb-4 border-l-2 border-primary">
                  <span className="text-[10px] text-muted-foreground">当前医生</span>
                  <p className="text-sm font-bold text-primary">{currentDoctor.name}</p>
                  <p className="text-[10px] text-muted-foreground">{currentDoctor.dept}</p>
                </div>
              )}

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {callingQueue.map((queue) => {
                  const patient = getPatientById(queue.patientId);
                  const isSelected = selectedQueueItem?.id === queue.id;
                  if (!patient) return null;
                  return (
                    <div
                      key={queue.id}
                      onClick={() => {
                        setSelectedQueueItem(queue);
                        setSelectedPatient(patient);
                        const reg = registrations.find(r => r.id === queue.registrationId);
                        if (reg) setActiveRegistration(reg);
                        setEmrForm({
                          chiefComplaint: "",
                          presentIllness: "",
                          pastHistory: patient.allergyHistory || "",
                          physicalExam: "",
                          diagnosis: "",
                          treatmentPlan: "",
                        });
                        setPrescriptionItems([]);
                        loadPatientHistory(queue.patientId);
                      }}
                      className={`p-3 rounded-md cursor-pointer transition-all duration-200 border anim-queue-pop ${
                        isSelected ? "bg-primary-container/10 border-primary/30" : "bg-tertiary-container/10 border-tertiary/20 hover:border-tertiary/40"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            #{queue.registrationId}
                          </span>
                          <p className="text-sm font-bold text-card-foreground mt-1">{patient.name}</p>
                        </div>
                        <span className="text-[10px] text-tertiary font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-tertiary rounded-full" />
                          就诊中
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{patient.gender} · {patient.age}岁</p>
                      {patient.allergyHistory && patient.allergyHistory !== "无" && patient.allergyHistory !== "无过敏史" && (
                        <div className="mt-1.5">
                          <span className="text-[9px] bg-warning/10 text-warning px-1.5 py-0.5 rounded">过敏: {patient.allergyHistory}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {waitingQueue.length === 0 && callingQueue.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">暂无候诊患者</div>
                ) : (
                  waitingQueue.map((queue) => {
                    const patient = getPatientById(queue.patientId);
                    if (!patient) return null;
                    return (
                      <div
                        key={queue.id}
                        className="p-3 rounded-md border border-border hover:border-primary/30 transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              #{queue.registrationId}
                            </span>
                            <p className="text-sm font-medium text-card-foreground mt-1">{patient.name}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground">等待中</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{patient.gender} · {patient.age}岁</p>
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCallPatient(queue); }}
                            className="bg-primary text-primary-foreground px-3 py-1 text-[10px] font-medium rounded"
                          >
                            叫号
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMissPatient(queue); }}
                            className="border border-border text-muted-foreground px-3 py-1 text-[10px] font-medium rounded hover:border-warning hover:text-warning"
                          >
                            过号
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {missedQueue.length > 0 && (
                  <div className="mt-4">
                    <div className="py-2 text-[10px] text-muted-foreground font-medium">已过号</div>
                    {missedQueue.slice(0, 3).map((queue) => {
                      const patient = getPatientById(queue.patientId);
                      if (!patient) return null;
                      return (
                        <div key={queue.id} className="p-3 rounded-md border border-border opacity-60 mb-2">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <span className="text-[10px] font-mono text-muted-foreground">#{queue.registrationId}</span>
                              <p className="text-sm font-medium text-card-foreground">{patient.name}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground">已过号</span>
                          </div>
                          <button
                            onClick={() => handleRecallPatient(queue)}
                            className="text-[10px] text-primary font-medium hover:underline"
                          >
                            重新叫号
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 space-y-5">
            {selectedPatient ? (
              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        #{activeRegistration?.id || selectedQueueItem?.registrationId || "-"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">挂号ID</span>
                    </div>
                    <h2 className="text-lg font-bold text-card-foreground">{selectedPatient.name}</h2>
                    <div className="flex gap-3 text-[11px] text-muted-foreground mt-1">
                      <span>{selectedPatient.gender}</span>
                      <span>{selectedPatient.age}岁</span>
                      <span>{selectedPatient.phone || "-"}</span>
                      {selectedPatient.allergyHistory && selectedPatient.allergyHistory !== "无" && selectedPatient.allergyHistory !== "无过敏史" && (
                        <span className="text-warning font-medium">过敏: {selectedPatient.allergyHistory}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-border rounded-md hover:bg-muted transition-colors"
                    >
                      <History size={14} />
                      历史记录
                    </button>
                    <button
                      onClick={handleFullDiagnosis}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-[11px] font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {saving && <Loader2 className="animate-spin" size={14} />}
                      完成诊疗
                    </button>
                  </div>
                </div>

                {showHistory && (
                  <div className="border-t border-border bg-muted/30 p-4 max-h-64 overflow-y-auto mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-[10px] text-primary font-medium mb-3">
                          历史病历 ({patientHistory.records.length})
                        </h4>
                        {historyLoading ? (
                          <Loader2 className="animate-spin text-primary" size={16} />
                        ) : patientHistory.records.length > 0 ? (
                          <div className="space-y-2">
                            {patientHistory.records.slice(0, 5).map((record) => (
                              <div key={record.id} className="bg-card p-3 rounded-md border-l-2 border-primary/30">
                                <div className="text-[10px] text-muted-foreground font-mono mb-1">
                                  {record.createTime?.split(" ")[0]}
                                </div>
                                <div className="font-bold text-primary text-xs">诊断: {record.diagnosis}</div>
                                <div className="text-[10px] text-muted-foreground mt-1">主诉: {record.chiefComplaint}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground">暂无历史病历</div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[10px] text-primary font-medium mb-3">
                          历史处方 ({patientHistory.prescriptions.length})
                        </h4>
                        {historyLoading ? (
                          <Loader2 className="animate-spin text-primary" size={16} />
                        ) : patientHistory.prescriptions.length > 0 ? (
                          <div className="space-y-2">
                            {patientHistory.prescriptions.slice(0, 5).map((pres) => (
                              <div key={pres.id} className="bg-card p-3 rounded-md border-l-2 border-tertiary/30">
                                <div className="flex justify-between text-[10px] text-muted-foreground font-mono mb-1">
                                  <span>{pres.createTime?.split(" ")[0]}</span>
                                  <span className="text-tertiary font-bold">¥{pres.totalPrice?.toFixed(2)}</span>
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  状态: {pres.status === "paid" ? "已缴费" : pres.status === "dispensed" ? "已发药" : "待缴费"}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground">暂无历史处方</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <label className="text-xs font-bold text-card-foreground flex items-center gap-2">
                        <FileText size={14} className="text-primary" />
                        临床评估记录
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1 block">主诉</label>
                        <textarea
                          className="w-full bg-muted border border-transparent rounded-md text-xs p-3 resize-none focus:bg-card focus:border-primary focus:outline-none transition-all"
                          rows={3}
                          value={emrForm.chiefComplaint}
                          onChange={(e) => setEmrForm({ ...emrForm, chiefComplaint: e.target.value })}
                          placeholder="患者主诉..."
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1 block">现病史</label>
                        <textarea
                          className="w-full bg-muted border border-transparent rounded-md text-xs p-3 resize-none focus:bg-card focus:border-primary focus:outline-none transition-all"
                          rows={3}
                          value={emrForm.presentIllness}
                          onChange={(e) => setEmrForm({ ...emrForm, presentIllness: e.target.value })}
                          placeholder="现病史..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1 block">既往史</label>
                        <textarea
                          className="w-full bg-muted border border-transparent rounded-md text-xs p-3 resize-none focus:bg-card focus:border-primary focus:outline-none transition-all"
                          rows={2}
                          value={emrForm.pastHistory}
                          onChange={(e) => setEmrForm({ ...emrForm, pastHistory: e.target.value })}
                          placeholder="既往病史..."
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1 block">体格检查</label>
                        <textarea
                          className="w-full bg-muted border border-transparent rounded-md text-xs p-3 resize-none focus:bg-card focus:border-primary focus:outline-none transition-all"
                          rows={2}
                          value={emrForm.physicalExam}
                          onChange={(e) => setEmrForm({ ...emrForm, physicalExam: e.target.value })}
                          placeholder="体格检查结果..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">初步诊断 *</label>
                      <input
                        type="text"
                        className="w-full bg-muted border-l-2 border-warning rounded-md px-4 py-2.5 text-sm font-bold focus:bg-card focus:border-warning focus:outline-none transition-all"
                        value={emrForm.diagnosis}
                        onChange={(e) => setEmrForm({ ...emrForm, diagnosis: e.target.value })}
                        placeholder="输入诊断结果..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">治疗方案</label>
                      <textarea
                        className="w-full bg-muted border border-transparent rounded-md text-xs p-3 resize-none focus:bg-card focus:border-primary focus:outline-none transition-all"
                        rows={2}
                        value={emrForm.treatmentPlan}
                        onChange={(e) => setEmrForm({ ...emrForm, treatmentPlan: e.target.value })}
                        placeholder="治疗方案..."
                      />
                    </div>
                  </div>

                  <ClinicalAttachmentPanel
                    patientId={selectedPatient.id}
                    visitId={activeRegistration?.id || selectedQueueItem?.registrationId}
                    uploadedBy={user?.id}
                    title="病历附件 / 影像图片"
                  />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <label className="text-xs font-bold text-card-foreground flex items-center gap-2">
                        <Pill size={14} className="text-primary" />
                        药物处方
                      </label>
                      <select
                        onChange={(e) => {
                          const drugId = parseInt(e.target.value);
                          if (drugId && drugs.length > 0) {
                            const drug = drugs.find(d => d.id === drugId);
                            if (drug) addDrugToPrescription(drug);
                          }
                          e.target.value = "";
                        }}
                        className="bg-muted border border-transparent rounded-md px-3 py-1.5 text-xs focus:bg-card focus:border-primary focus:outline-none transition-all w-56"
                        defaultValue=""
                      >
                        <option value="" disabled>选择药品...</option>
                        {drugs.map((drug) => (
                          <option key={drug.id} value={drug.id}>
                            {drug.name} - {drug.spec} - ¥{drug.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    {prescriptionItems.length > 0 ? (
                      <div className="space-y-2">
                        {prescriptionItems.map((item) => {
                          const drug = drugs.find(d => d.id === item.drugId);
                          return (
                            <div key={item.drugId} className="grid grid-cols-12 gap-2 items-center bg-muted/50 p-3 rounded-md">
                              <div className="col-span-4">
                                <span className="text-[9px] text-muted-foreground">药品名称</span>
                                <input className="bg-transparent border-none p-0 text-sm font-bold text-card-foreground focus:ring-0 w-full" type="text" value={item.drugName} readOnly />
                                <div className="text-[10px] text-muted-foreground mt-0.5">{item.spec}</div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[9px] text-muted-foreground">数量</span>
                                <input className="bg-transparent border-none p-0 text-sm text-card-foreground focus:ring-0 w-full" type="number" value={item.num} onChange={(e) => updatePrescriptionItem(item.drugId, "num", parseInt(e.target.value) || 1)} min={1} />
                              </div>
                              <div className="col-span-3">
                                <span className="text-[9px] text-muted-foreground">用法</span>
                                <input className="bg-transparent border-none p-0 text-sm text-card-foreground focus:ring-0 w-full" type="text" value={item.usage} onChange={(e) => updatePrescriptionItem(item.drugId, "usage", e.target.value)} />
                              </div>
                              <div className="col-span-1">
                                <span className="text-[9px] text-muted-foreground">库存</span>
                                <div className={`text-sm font-bold ${drug && drug.stock < 20 ? 'text-error' : 'text-card-foreground'}`}>
                                  {drug?.stock || 0}
                                </div>
                              </div>
                              <div className="col-span-1 text-right">
                                <span className="text-xs font-bold text-tertiary">¥{(item.price * item.num).toFixed(2)}</span>
                              </div>
                              <div className="col-span-1 text-right">
                                <button onClick={() => removeDrugFromPrescription(item.drugId)} className="text-muted-foreground hover:text-error transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-xs border border-dashed border-border rounded-md">
                        从上方下拉菜单选择药品添加到处方
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <label className="text-xs font-bold text-card-foreground">检查项目</label>
                    </div>
                    <ExaminationSelector
                      selectedExaminations={selectedExaminations}
                      onChange={setSelectedExaminations}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <label className="text-xs font-bold text-card-foreground">手术预约</label>
                      <button
                        onClick={() => setSurgeryOrder({ ...surgeryOrder, enabled: !surgeryOrder.enabled })}
                        className={`text-[11px] px-3 py-1 rounded-md transition-colors ${surgeryOrder.enabled ? 'bg-warning/10 text-warning font-medium' : 'bg-muted text-muted-foreground border border-border'}`}
                      >
                        {surgeryOrder.enabled ? '已启用' : '添加手术'}
                      </button>
                    </div>
                    {surgeryOrder.enabled && (
                      <div className="space-y-3 bg-muted/30 p-4 rounded-md border border-border">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">手术名称</label>
                            <input type="text" value={surgeryOrder.surgeryName} onChange={(e) => setSurgeryOrder({ ...surgeryOrder, surgeryName: e.target.value })} className="w-full bg-muted border border-transparent rounded-md px-3 py-2 text-xs focus:bg-card focus:border-primary focus:outline-none transition-all" placeholder="如：阑尾切除术" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">手术类型</label>
                            <select value={surgeryOrder.surgeryType} onChange={(e) => setSurgeryOrder({ ...surgeryOrder, surgeryType: e.target.value })} className="w-full bg-muted border border-transparent rounded-md px-3 py-2 text-xs focus:bg-card focus:border-primary focus:outline-none transition-all">
                              <option value="">选择类型</option>
                              <option value="开颅手术">开颅手术</option>
                              <option value="心脏手术">心脏手术</option>
                              <option value="腹腔手术">腹腔手术</option>
                              <option value="骨科手术">骨科手术</option>
                              <option value="胸腔手术">胸腔手术</option>
                              <option value="泌尿手术">泌尿手术</option>
                              <option value="其他">其他</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">手术室</label>
                            <select value={surgeryOrder.surgeryRoom} onChange={(e) => setSurgeryOrder({ ...surgeryOrder, surgeryRoom: e.target.value })} className="w-full bg-muted border border-transparent rounded-md px-3 py-2 text-xs focus:bg-card focus:border-primary focus:outline-none transition-all">
                              <option value="">选择手术室</option>
                              <option value="手术室1">手术室1</option>
                              <option value="手术室2">手术室2</option>
                              <option value="手术室3">手术室3</option>
                              <option value="手术室4">手术室4</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">麻醉方式</label>
                            <select value={surgeryOrder.anesthesiaType} onChange={(e) => setSurgeryOrder({ ...surgeryOrder, anesthesiaType: e.target.value })} className="w-full bg-muted border border-transparent rounded-md px-3 py-2 text-xs focus:bg-card focus:border-primary focus:outline-none transition-all">
                              <option value="">选择麻醉</option>
                              <option value="全身麻醉">全身麻醉</option>
                              <option value="硬膜外麻醉">硬膜外麻醉</option>
                              <option value="局部麻醉">局部麻醉</option>
                              <option value="复合麻醉">复合麻醉</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">预约日期</label>
                            <input type="date" value={surgeryOrder.surgeryDate} onChange={(e) => setSurgeryOrder({ ...surgeryOrder, surgeryDate: e.target.value })} className="w-full bg-muted border border-transparent rounded-md px-3 py-2 text-xs focus:bg-card focus:border-primary focus:outline-none transition-all" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">手术费 (元)</label>
                            <input type="number" value={surgeryOrder.surgeryFee || ''} onChange={(e) => setSurgeryOrder({ ...surgeryOrder, surgeryFee: Number(e.target.value) })} className="w-full bg-muted border border-transparent rounded-md px-3 py-2 text-xs focus:bg-card focus:border-primary focus:outline-none transition-all" placeholder="0" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">麻醉费 (元)</label>
                            <input type="number" value={surgeryOrder.anesthesiaFee || ''} onChange={(e) => setSurgeryOrder({ ...surgeryOrder, anesthesiaFee: Number(e.target.value) })} className="w-full bg-muted border border-transparent rounded-md px-3 py-2 text-xs focus:bg-card focus:border-primary focus:outline-none transition-all" placeholder="0" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Scissors size={14} className="text-warning" />
                          <span>手术费用合计：¥{((surgeryOrder.surgeryFee || 0) + (surgeryOrder.anesthesiaFee || 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-muted-foreground">处方总额</span>
                      <p className="text-2xl font-bold text-tertiary">¥{calculateTotal().toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-muted-foreground mb-2 font-mono">
                        {new Date().toISOString().replace('T', ' ').slice(0, 19)}
                      </p>
                      <button
                        onClick={handleFullDiagnosis}
                        disabled={saving}
                        className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {saving ? "保存中..." : "完成诊疗"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-5 flex items-center justify-center py-20">
                <div className="text-center">
                  <Stethoscope className="mx-auto text-muted-foreground mb-4" size={48} />
                  <h2 className="text-base font-bold text-muted-foreground">选择患者开始诊疗</h2>
                  <p className="text-xs text-muted-foreground/70 mt-1">从左侧队列中选择已挂号患者进行诊疗</p>
                </div>
              </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-5">
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
                <Activity size={16} className="text-tertiary" />
                生命体征
              </h3>
              {latestVitalSign ? (
                <div className="space-y-3">
                  <div className="bg-muted/50 p-3 rounded-md border border-primary/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Heart size={12} className="text-error" />
                        心率 (BPM)
                      </span>
                      <span className="text-lg font-bold text-primary">{latestVitalSign.pulse || '-'}</span>
                    </div>
                    <div className="h-8 flex items-end gap-[2px]">
                      {generateVitalBars(latestVitalSign.pulse || 0, 'bg-primary')}
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md border border-tertiary/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Droplets size={12} className="text-tertiary" />
                        血氧 (%)
                      </span>
                      <span className="text-lg font-bold text-tertiary">{latestVitalSign.oxygenSaturation || '-'}</span>
                    </div>
                    <div className="h-2 bg-muted w-full mt-2 rounded-full overflow-hidden">
                      <div className="h-full bg-tertiary rounded-full" style={{ width: `${latestVitalSign.oxygenSaturation || 0}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md border border-warning/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-muted-foreground">血压 (mmHg)</span>
                      <span className="text-lg font-bold text-primary">
                        {latestVitalSign.bloodPressureHigh && latestVitalSign.bloodPressureLow
                          ? `${latestVitalSign.bloodPressureHigh}/${latestVitalSign.bloodPressureLow}`
                          : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 p-2 rounded-md border border-error/20">
                      <span className="text-[10px] text-muted-foreground block">体温</span>
                      <span className="text-sm font-bold text-error">{latestVitalSign.temperature ? `${latestVitalSign.temperature}°C` : '-'}</span>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-md border border-border">
                      <span className="text-[10px] text-muted-foreground block">呼吸</span>
                      <span className="text-sm font-bold text-card-foreground">{latestVitalSign.respiration ? `${latestVitalSign.respiration}/min` : '-'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Activity size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">暂无生命体征数据</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">需在护士工作站录入</p>
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
                  <History size={16} className="text-primary" />
                  患者时间线
                </h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-[10px] text-primary font-medium hover:underline"
                >
                  {showHistory ? "收起" : "查看全部"} ({patientHistory.records.length})
                </button>
              </div>
              {selectedPatient ? (
                <div className="relative pl-6 space-y-5">
                  <div className="absolute left-2.5 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/40 via-border to-transparent"></div>
                  <div className="relative">
                    <div className="absolute -left-4 w-2 h-2 bg-primary rounded-full"></div>
                    <div className="bg-primary-container/20 p-3 rounded-md border-l-2 border-primary">
                      <span className="text-[10px] text-muted-foreground font-mono">现在</span>
                      <p className="text-xs font-medium text-card-foreground mt-1">就诊中</p>
                    </div>
                  </div>
                  {showHistory
                    ? patientHistory.records.map((record) => (
                        <div key={record.id} className="relative">
                          <div className="absolute -left-4 w-2 h-2 bg-muted-foreground rounded-full"></div>
                          <div className="bg-muted/30 p-3 rounded-md">
                            <span className="text-[10px] text-muted-foreground font-mono">{record.createTime?.split(" ")[0]}</span>
                            <p className="text-xs font-medium text-card-foreground mt-1">{record.diagnosis}</p>
                            {record.chiefComplaint && (
                              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2">主诉: {record.chiefComplaint}</p>
                            )}
                          </div>
                        </div>
                      ))
                    : patientHistory.records.slice(0, 5).map((record) => (
                        <div key={record.id} className="relative">
                          <div className="absolute -left-4 w-2 h-2 bg-muted-foreground rounded-full"></div>
                          <div className="bg-muted/30 p-3 rounded-md">
                            <span className="text-[10px] text-muted-foreground font-mono">{record.createTime?.split(" ")[0]}</span>
                            <p className="text-xs font-medium text-card-foreground mt-1">{record.diagnosis}</p>
                          </div>
                        </div>
                      ))}
                  {patientHistory.records.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">暂无历史记录</div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-8">选择患者查看时间线</div>
              )}
            </div>

            <div className="bg-card rounded-lg border border-border p-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="bg-muted/50 p-3 rounded-md text-left hover:bg-muted transition-colors"
                  onClick={handlePrint}
                >
                  <Printer className="text-primary mb-1.5" size={16} />
                  <p className="text-[10px] font-medium text-card-foreground">打印病历</p>
                </button>
                <button
                  className="bg-muted/50 p-3 rounded-md text-left hover:bg-muted transition-colors"
                  onClick={handleExport}
                >
                  <FileText className="text-primary mb-1.5" size={16} />
                  <p className="text-[10px] font-medium text-card-foreground">导出报告</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorWorkstation;
