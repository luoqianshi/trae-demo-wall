import React, { useState, useEffect } from "react";
import {
  Scissors,
  Clock,
  Calendar,
  User,
  Activity,
  Loader2,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { patientService, doctorService, surgeryService, anesthesiaRecordService, inpatientService, departmentService } from "@/lib/services";
import type { Patient, Doctor, Surgery, AnesthesiaRecord, Inpatient } from "@/lib/types";

import { useAuth } from "@/contexts/AuthContext";
import AnimatedPage from "@/components/ui/AnimatedPage";

const SURGERY_TYPES = ["开颅手术", "心脏手术", "腹腔手术", "骨科手术", "胸腔手术", "泌尿手术", "神经外科手术", "其他"];
const ANESTHESIA_TYPES = ["全身麻醉", "硬膜外麻醉", "蛛网膜下腔麻醉", "局部麻醉", "复合麻醉", "静脉麻醉"];
const SURGERY_ROOMS = ["手术室1", "手术室2", "手术室3", "手术室4", "手术室5", "手术室6"];

const ANESTHESIA_DRUG_TEMPLATES = [
  { name: "丙泊酚", unit: "mg", defaultDose: "" },
  { name: "瑞芬太尼", unit: "μg", defaultDose: "" },
  { name: "芬太尼", unit: "μg", defaultDose: "" },
  { name: "咪达唑仑", unit: "mg", defaultDose: "" },
  { name: "罗库溴铵", unit: "mg", defaultDose: "" },
  { name: "顺阿曲库铵", unit: "mg", defaultDose: "" },
  { name: "舒芬太尼", unit: "μg", defaultDose: "" },
  { name: "右美托咪定", unit: "μg", defaultDose: "" },
  { name: "布托啡诺", unit: "mg", defaultDose: "" },
  { name: "地佐辛", unit: "mg", defaultDose: "" },
];

interface AnesthesiaDrugItem {
  name: string;
  dose: string;
  unit: string;
}

const SurgeryAnesthesiaManagement: React.FC = () => {
  const { user } = useAuth();
  const operatorName = user?.name || '操作员';
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [anesthesiaRecords, setAnesthesiaRecords] = useState<AnesthesiaRecord[]>([]);
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [patientSource, setPatientSource] = useState<"outpatient" | "inpatient">("outpatient");
  const [loading, setLoading] = useState(false);
  const [surgeryPatientSearch, setSurgeryPatientSearch] = useState("");
  const [showSurgeryPatientList, setShowSurgeryPatientList] = useState(false);

  const [activeTab, setActiveTab] = useState<"list" | "schedule" | "anesthesia">("list");
  const [statusFilter, setStatusFilter] = useState<string>("全部");
  const [deptFilter, setDeptFilter] = useState<string>("全部科室");

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAnesthesiaModal, setShowAnesthesiaModal] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<Surgery | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    patientId: 0,
    surgeryName: "",
    surgeryType: "",
    dept: "",
    doctorId: 0,
    surgeryDate: "",
    surgeryRoom: "",
    anesthesiaType: "",
    diagnosis: "",
  });

  const [anesthesiaForm, setAnesthesiaForm] = useState<{
    anesthesiaType: string;
    anesthesiaDrugs: AnesthesiaDrugItem[];
    vitalSignsDuring: string;
    duration: number;
  }>({
    anesthesiaType: "",
    anesthesiaDrugs: [],
    vitalSignsDuring: "",
    duration: 0,
  });

  const depts = ["全部科室", ...departments.map(d => d.name || d.deptName || d)];
  const surgeryTypes = SURGERY_TYPES;
  const anesthesiaTypes = ANESTHESIA_TYPES;
  const surgeryRooms = SURGERY_ROOMS;

  const loadData = async () => {
    setLoading(true);
    try {
      const patientsRes = await fetch("/api/patients?size=99999");
      const patientsJson = await patientsRes.json();
      const [surgeriesData, anesthesiaData, doctorsData, inpatientsData, deptData] = await Promise.all([
        surgeryService.getAll(),
        anesthesiaRecordService.getAll(),
        doctorService.getAll(),
        inpatientService.getAll(),
        departmentService.getAll(),
      ]);
      setSurgeries(surgeriesData || []);
      setAnesthesiaRecords(anesthesiaData || []);
      setPatients(patientsJson.patients || []);
      setDoctors(doctorsData || []);
      setInpatients(inpatientsData?.filter(i => i.status === "admitted") || []);
      setDepartments(deptData || []);
    } catch (error) {
      console.error("加载数据失败:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSurgeries = surgeries.filter((surgery) => {
    const matchesStatus = statusFilter === "全部" || surgery.status === statusFilter;
    const matchesDept = deptFilter === "全部科室" || surgery.dept === deptFilter;
    return matchesStatus && matchesDept;
  });

  const scheduledSurgeries = surgeries.filter((s) => s.status === "scheduled");
  const inProgressSurgeries = surgeries.filter((s) => s.status === "in_progress");
  const completedSurgeries = surgeries.filter((s) => s.status === "completed");

  const handleScheduleSurgery = async () => {
    if (!scheduleForm.patientId || !scheduleForm.surgeryName || !scheduleForm.surgeryDate || !scheduleForm.dept) {
      alert("请填写完整信息");
      return;
    }

    try {
      await surgeryService.add({
        patientId: scheduleForm.patientId,
        patientName: patients.find((p) => p.id === scheduleForm.patientId)?.name,
        surgeryName: scheduleForm.surgeryName,
        surgeryType: scheduleForm.surgeryType,
        dept: scheduleForm.dept,
        doctorId: scheduleForm.doctorId,
        doctorName: doctors.find((d) => d.id === scheduleForm.doctorId)?.name,
        surgeryDate: scheduleForm.surgeryDate,
        surgeryRoom: scheduleForm.surgeryRoom,
        anesthesiaType: scheduleForm.anesthesiaType,
        diagnosis: scheduleForm.diagnosis,
        status: "scheduled",
      });

      alert("手术预约成功");
      setShowScheduleModal(false);
      setScheduleForm({
        patientId: 0,
        surgeryName: "",
        surgeryType: "",
        dept: "",
        doctorId: 0,
        surgeryDate: "",
        surgeryRoom: "",
        anesthesiaType: "",
        diagnosis: "",
      });
      loadData();
    } catch (error) {
      console.error("预约失败:", error);
      alert("预约失败");
    }
  };

  const handleStartSurgery = async (surgery: Surgery) => {
    try {
      await surgeryService.updateStatus(surgery.id, "in_progress");
      alert("手术已开始");
      loadData();
    } catch (error) {
      console.error("开始手术失败:", error);
      alert("操作失败");
    }
  };

  const handleCompleteSurgery = async (surgery: Surgery) => {
    try {
      await surgeryService.updateStatus(surgery.id, "completed");
      alert("手术已完成");
      loadData();
    } catch (error) {
      console.error("完成手术失败:", error);
      alert("操作失败");
    }
  };

  const handleCancelSurgery = async (surgery: Surgery) => {
    if (!confirm("确定要取消该手术吗？")) return;
    try {
      await surgeryService.updateStatus(surgery.id, "cancelled");
      alert("手术已取消");
      loadData();
    } catch (error) {
      console.error("取消手术失败:", error);
      alert("操作失败");
    }
  };

  const handleAddAnesthesiaRecord = async () => {
    if (!selectedSurgery || !anesthesiaForm.anesthesiaType) {
      alert("请填写完整信息");
      return;
    }

    try {
      await anesthesiaRecordService.add({
        surgeryId: selectedSurgery.id,
        patientId: selectedSurgery.patientId,
        patientName: selectedSurgery.patientName,
        anesthesiaType: anesthesiaForm.anesthesiaType,
        anesthesiaDrugs: anesthesiaForm.anesthesiaDrugs.map(d => `${d.name} ${d.dose}${d.unit}`).join("; "),
        vitalSignsDuring: anesthesiaForm.vitalSignsDuring,
        duration: anesthesiaForm.duration,
        anesthesiologistId: user?.id || 0,
        anesthesiologistName: operatorName,
        recordTime: new Date().toISOString(),
      });

      alert("麻醉记录成功");
      setShowAnesthesiaModal(false);
      setAnesthesiaForm({
        anesthesiaType: "",
        anesthesiaDrugs: [],
        vitalSignsDuring: "",
        duration: 0,
      });
      loadData();
    } catch (error) {
      console.error("记录失败:", error);
      alert("记录失败");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-tertiary/10 text-tertiary">待手术</span>;
      case "in_progress":
        return <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-primary/10 text-primary">进行中</span>;
      case "completed":
        return <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-secondary/10 text-secondary">已完成</span>;
      case "cancelled":
        return <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-outline/10 text-outline">已取消</span>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface-dim">
      <div className="px-6 py-4 bg-surface-container border-b border-outline-variant/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scissors className="text-primary" size={20} />
            </div>
            <div>
              <h1 className="font-headline font-bold text-lg text-on-surface">手术麻醉管理</h1>
              <p className="text-[10px] font-mono text-outline uppercase tracking-wider">Surgery & Anesthesia</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-mono text-outline uppercase">待手术</p>
              <p className="text-xl font-headline font-bold text-tertiary">{scheduledSurgeries.length}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-outline uppercase">进行中</p>
              <p className="text-xl font-headline font-bold text-primary">{inProgressSurgeries.length}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-outline uppercase">已完成</p>
              <p className="text-xl font-headline font-bold text-secondary">{completedSurgeries.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-outline-variant/10 bg-surface">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-6 py-3 font-headline text-xs uppercase tracking-widest transition-colors ${
            activeTab === "list" ? "text-primary border-b-2 border-primary" : "text-outline hover:text-on-surface"
          }`}
        >
          <FileText size={14} className="inline mr-2" />
          手术列表
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-6 py-3 font-headline text-xs uppercase tracking-widest transition-colors ${
            activeTab === "schedule" ? "text-primary border-b-2 border-primary" : "text-outline hover:text-on-surface"
          }`}
        >
          <Calendar size={14} className="inline mr-2" />
          预约管理
        </button>
        <button
          onClick={() => setActiveTab("anesthesia")}
          className={`px-6 py-3 font-headline text-xs uppercase tracking-widest transition-colors ${
            activeTab === "anesthesia" ? "text-primary border-b-2 border-primary" : "text-outline hover:text-on-surface"
          }`}
        >
          <Activity size={14} className="inline mr-2" />
          麻醉记录
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-primary-container" size={40} />
          </div>
        ) : (
          <>
            {activeTab === "list" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {["全部", "scheduled", "in_progress", "completed", "cancelled"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 text-[10px] font-headline uppercase tracking-wider rounded transition-colors ${
                          statusFilter === status
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-outline hover:bg-surface-container-high"
                        }`}
                      >
                        {status === "全部"
                          ? "全部"
                          : status === "scheduled"
                          ? "待手术"
                          : status === "in_progress"
                          ? "进行中"
                          : status === "completed"
                          ? "已完成"
                          : "已取消"}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {depts.map((dept) => (
                      <button
                        key={dept}
                        onClick={() => setDeptFilter(dept)}
                        className={`px-3 py-1.5 text-[10px] font-headline uppercase tracking-wider rounded transition-colors ${
                          deptFilter === dept
                            ? "bg-secondary text-on-secondary"
                            : "bg-surface-container text-outline hover:bg-surface-container-high"
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-container-high">
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">手术名称</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">患者</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">科室</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">主刀医生</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">手术日期</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">手术室</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">麻醉类型</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">状态</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSurgeries.map((surgery) => (
                        <tr key={surgery.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs font-headline text-on-surface">{surgery.surgeryName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-headline text-primary">{surgery.patientName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{surgery.dept}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{surgery.doctorName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-outline">{surgery.surgeryDate}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{surgery.surgeryRoom}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{surgery.anesthesiaType || "-"}</span>
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(surgery.status)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {surgery.status === "scheduled" && (
                                <>
                                  <button
                                    onClick={() => handleStartSurgery(surgery)}
                                    className="px-2 py-1 text-[9px] font-headline uppercase bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
                                  >
                                    开始
                                  </button>
                                  <button
                                    onClick={() => handleCancelSurgery(surgery)}
                                    className="px-2 py-1 text-[9px] font-headline uppercase bg-outline/10 text-outline hover:bg-outline/20 rounded transition-colors"
                                  >
                                    取消
                                  </button>
                                </>
                              )}
                              {surgery.status === "in_progress" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedSurgery(surgery);
                                      setAnesthesiaForm({
                                        anesthesiaType: surgery.anesthesiaType || "",
                                        anesthesiaDrugs: [],
                                        vitalSignsDuring: "",
                                        duration: 0,
                                      });
                                      setShowAnesthesiaModal(true);
                                    }}
                                    className="px-2 py-1 text-[9px] font-headline uppercase bg-secondary/10 text-secondary hover:bg-secondary/20 rounded transition-colors"
                                  >
                                    麻醉记录
                                  </button>
                                  <button
                                    onClick={() => handleCompleteSurgery(surgery)}
                                    className="px-2 py-1 text-[9px] font-headline uppercase bg-tertiary/10 text-tertiary hover:bg-tertiary/20 rounded transition-colors"
                                  >
                                    完成
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredSurgeries.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-xs text-outline">
                            暂无手术记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="px-4 py-2 bg-primary text-on-primary font-headline text-xs uppercase tracking-wider rounded hover:bg-primary/80 transition-colors flex items-center gap-2"
                  >
                    <Plus size={14} />
                    新预约
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-surface-container p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-headline uppercase text-outline tracking-wider">今日预约</p>
                        <p className="text-2xl font-headline font-bold text-tertiary mt-1">
                          {scheduledSurgeries.filter((s) => s.surgeryDate === new Date().toISOString().split("T")[0]).length}
                        </p>
                      </div>
                      <Calendar className="text-tertiary/50" size={32} />
                    </div>
                  </div>
                  <div className="bg-surface-container p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-headline uppercase text-outline tracking-wider">进行中</p>
                        <p className="text-2xl font-headline font-bold text-primary mt-1">{inProgressSurgeries.length}</p>
                      </div>
                      <Activity className="text-primary/50" size={32} />
                    </div>
                  </div>
                  <div className="bg-surface-container p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-headline uppercase text-outline tracking-wider">本月完成</p>
                        <p className="text-2xl font-headline font-bold text-secondary mt-1">{completedSurgeries.length}</p>
                      </div>
                      <CheckCircle className="text-secondary/50" size={32} />
                    </div>
                  </div>
                  <div className="bg-surface-container p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-headline uppercase text-outline tracking-wider">手术室使用</p>
                        <p className="text-2xl font-headline font-bold text-primary mt-1">
                          {new Set(scheduledSurgeries.map((s) => s.surgeryRoom)).size}
                        </p>
                      </div>
                      <Scissors className="text-primary/50" size={32} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-outline mb-4">待手术列表</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {scheduledSurgeries.map((surgery) => (
                      <div key={surgery.id} className="bg-surface-container rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-headline text-primary">{surgery.surgeryName}</span>
                          {getStatusBadge(surgery.status)}
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <User className="text-outline" size={14} />
                          <span className="text-xs text-on-surface">{surgery.patientName}</span>
                        </div>
                        <div className="space-y-1 text-[10px] text-outline">
                          <p>科室: {surgery.dept}</p>
                          <p>主刀: {surgery.doctorName}</p>
                          <p>日期: {surgery.surgeryDate}</p>
                          <p>手术室: {surgery.surgeryRoom}</p>
                          <p>麻醉: {surgery.anesthesiaType || "-"}</p>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-outline-variant/20">
                          <button
                            onClick={() => handleStartSurgery(surgery)}
                            className="flex-1 px-2 py-1.5 text-[10px] font-headline uppercase bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
                          >
                            开始手术
                          </button>
                          <button
                            onClick={() => handleCancelSurgery(surgery)}
                            className="px-2 py-1.5 text-[10px] font-headline uppercase bg-outline/10 text-outline hover:bg-outline/20 rounded transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ))}
                    {scheduledSurgeries.length === 0 && (
                      <div className="col-span-3 text-xs text-outline text-center py-8">暂无待手术预约</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "anesthesia" && (
              <div className="space-y-6">
                <div className="bg-surface-container rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-container-high">
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">手术</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">患者</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">麻醉类型</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">麻醉药物</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">术中生命体征</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">时长(分钟)</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">记录时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anesthesiaRecords.map((record) => (
                        <tr key={record.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs text-on-surface">{surgeries.find((s) => s.id === record.surgeryId)?.surgeryName || "-"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-headline text-primary">{record.patientName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{record.anesthesiaType}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline max-w-[150px] truncate block">{record.anesthesiaDrugs || "-"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{record.vitalSignsDuring || "-"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-tertiary">{record.duration}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-outline">{record.recordTime?.split(" ")[0]}</span>
                          </td>
                        </tr>
                      ))}
                      {anesthesiaRecords.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-xs text-outline">
                            暂无麻醉记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-primary mb-6">预约手术</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">患者来源</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPatientSource("outpatient");
                      setScheduleForm({ ...scheduleForm, patientId: 0 });
                    }}
                    className={`flex-1 py-2 px-3 text-xs font-headline uppercase tracking-wider rounded transition-colors ${
                      patientSource === "outpatient"
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-outline hover:bg-surface-container-high/80"
                    }`}
                  >
                    门诊患者
                  </button>
                  <button
                    onClick={() => {
                      setPatientSource("inpatient");
                      setScheduleForm({ ...scheduleForm, patientId: 0 });
                    }}
                    className={`flex-1 py-2 px-3 text-xs font-headline uppercase tracking-wider rounded transition-colors ${
                      patientSource === "inpatient"
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-outline hover:bg-surface-container-high/80"
                    }`}
                  >
                    住院患者
                  </button>
                </div>
              </div>
              <div className="relative">
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">
                  选择{patientSource === "inpatient" ? "住院" : "门诊"}患者
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={14} />
                  <input
                    type="text"
                    value={surgeryPatientSearch}
                    onChange={(e) => {
                      const term = e.target.value;
                      setSurgeryPatientSearch(term);
                      if (term.trim()) {
                        setShowSurgeryPatientList(true);
                      } else {
                        setShowSurgeryPatientList(false);
                      }
                    }}
                    onFocus={() => { if (surgeryPatientSearch.trim()) setShowSurgeryPatientList(true); }}
                    onBlur={() => setTimeout(() => setShowSurgeryPatientList(false), 200)}
                    placeholder="搜索患者姓名..."
                    className="w-full bg-surface-container-high border-none text-sm text-on-surface pl-9 pr-3 py-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                  />
                </div>
                {showSurgeryPatientList && (
                  <div className="absolute z-50 w-full mt-1 bg-surface border border-outline-variant/20 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                    onMouseDown={e => e.preventDefault()}>
                    {patientSource === "inpatient" ? (
                      inpatients
                        .filter(ip => !surgeryPatientSearch || (ip.patientName?.toLowerCase().includes(surgeryPatientSearch.toLowerCase())))
                        .slice(0, 200)
                        .map((inpatient) => (
                          <button
                            key={inpatient.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setScheduleForm({ ...scheduleForm, patientId: inpatient.patientId });
                              setSurgeryPatientSearch(inpatient.patientName || "");
                              setShowSurgeryPatientList(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-primary-container/10 border-b border-outline-variant/5 last:border-b-0 transition-colors"
                          >
                            <span className="text-xs font-headline font-bold text-on-surface">{inpatient.patientName}</span>
                            <span className="text-[10px] text-outline ml-2">床位:{inpatient.bedNo} - {inpatient.dept}</span>
                          </button>
                        ))
                    ) : (
                      patients
                        .slice()
                        .sort((a, b) => (b.id || 0) - (a.id || 0))
                        .filter(p => !surgeryPatientSearch || p.name?.toLowerCase().includes(surgeryPatientSearch.toLowerCase()))
                        .slice(0, 20000)
                        .map((patient) => (
                          <button
                            key={patient.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setScheduleForm({ ...scheduleForm, patientId: patient.id });
                              setSurgeryPatientSearch(patient.name);
                              setShowSurgeryPatientList(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-primary-container/10 border-b border-outline-variant/5 last:border-b-0 transition-colors"
                          >
                            <span className="text-xs font-headline font-bold text-on-surface">{patient.name}</span>
                            <span className="text-[10px] text-outline ml-2">{patient.gender} - {patient.age}岁</span>
                          </button>
                        ))
                    )}
                    {(patientSource === "inpatient"
                      ? inpatients.filter(ip => !surgeryPatientSearch || (ip.patientName?.toLowerCase().includes(surgeryPatientSearch.toLowerCase()))).length
                      : patients.filter(p => !surgeryPatientSearch || p.name?.toLowerCase().includes(surgeryPatientSearch.toLowerCase())).length) === 0 && (
                      <div className="px-3 py-2 text-xs text-outline">无匹配患者</div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">手术名称</label>
                <input
                  type="text"
                  value={scheduleForm.surgeryName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, surgeryName: e.target.value })}
                  placeholder="请输入手术名称"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">手术类型</label>
                <select
                  value={scheduleForm.surgeryType}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, surgeryType: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container"
                >
                  <option value="">请选择手术类型</option>
                  {surgeryTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">科室</label>
                <select
                  value={scheduleForm.dept}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, dept: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container"
                >
                  <option value="">请选择科室</option>
                  {depts.filter((d) => d !== "全部科室").map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">主刀医生</label>
                <select
                  value={scheduleForm.doctorId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, doctorId: Number(e.target.value) })}
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container"
                >
                  <option value={0}>请选择医生</option>
                  {doctors.filter((d) => d.dept === scheduleForm.dept || !scheduleForm.dept).map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.title} - {doctor.dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">手术日期</label>
                <input
                  type="date"
                  value={scheduleForm.surgeryDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, surgeryDate: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">手术室</label>
                <select
                  value={scheduleForm.surgeryRoom}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, surgeryRoom: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container"
                >
                  <option value="">请选择手术室</option>
                  {surgeryRooms.map((room) => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">麻醉类型</label>
                <select
                  value={scheduleForm.anesthesiaType}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, anesthesiaType: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container"
                >
                  <option value="">请选择麻醉类型</option>
                  {anesthesiaTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">术前诊断</label>
                <input
                  type="text"
                  value={scheduleForm.diagnosis}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, diagnosis: e.target.value })}
                  placeholder="请输入术前诊断"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-3 bg-surface-container text-on-surface font-headline text-xs uppercase tracking-wider rounded hover:bg-surface-container-high transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleScheduleSurgery}
                  className="flex-1 px-4 py-3 bg-primary text-on-primary font-headline text-xs uppercase tracking-wider rounded hover:bg-primary/80 transition-colors"
                >
                  确认预约
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAnesthesiaModal && selectedSurgery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container rounded-lg w-full max-w-md p-6">
            <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-primary mb-6">麻醉记录</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">患者</label>
                <p className="text-sm font-headline text-on-surface">{selectedSurgery.patientName}</p>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">手术名称</label>
                <p className="text-sm text-on-surface">{selectedSurgery.surgeryName}</p>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">麻醉类型</label>
                <select
                  value={anesthesiaForm.anesthesiaType}
                  onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, anesthesiaType: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container"
                >
                  <option value="">请选择麻醉类型</option>
                  {anesthesiaTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">麻醉药物</label>
                <div className="space-y-3">
                  {ANESTHESIA_DRUG_TEMPLATES.map((tpl) => {
                    const existing = anesthesiaForm.anesthesiaDrugs.find(d => d.name === tpl.name);
                    return (
                      <div key={tpl.name} className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!existing) {
                              setAnesthesiaForm({ ...anesthesiaForm, anesthesiaDrugs: [...anesthesiaForm.anesthesiaDrugs, { name: tpl.name, dose: "", unit: tpl.unit }] });
                            } else {
                              setAnesthesiaForm({ ...anesthesiaForm, anesthesiaDrugs: anesthesiaForm.anesthesiaDrugs.filter(d => d.name !== tpl.name) });
                            }
                          }}
                          className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] transition-colors ${existing ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high border-outline-variant/30 hover:border-primary'}`}
                        >
                          {existing ? '✓' : '+'}
                        </button>
                        <span className={`text-xs flex-shrink-0 w-20 ${existing ? 'text-on-surface font-medium' : 'text-outline-variant'}`}>{tpl.name}</span>
                        {existing && (
                          <>
                            <input
                              type="text"
                              value={existing.dose}
                              onChange={(e) => setAnesthesiaForm({
                                ...anesthesiaForm,
                                anesthesiaDrugs: anesthesiaForm.anesthesiaDrugs.map(d =>
                                  d.name === tpl.name ? { ...d, dose: e.target.value } : d
                                )
                              })}
                              placeholder="剂量"
                              className="w-16 bg-surface-container-high border-none text-xs text-on-surface p-1.5 rounded focus:ring-1 focus:ring-primary-container text-center"
                            />
                            <span className="text-[10px] text-outline-variant">{tpl.unit}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      id="customDrugName"
                      placeholder="自定义药物名称"
                      className="flex-1 bg-surface-container-high border-none text-xs text-on-surface p-1.5 rounded focus:ring-1 focus:ring-primary-container"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const name = (e.target as HTMLInputElement).value.trim();
                          if (name && !anesthesiaForm.anesthesiaDrugs.find(d => d.name === name)) {
                            setAnesthesiaForm({ ...anesthesiaForm, anesthesiaDrugs: [...anesthesiaForm.anesthesiaDrugs, { name, dose: '', unit: '' }] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('customDrugName') as HTMLInputElement;
                        const name = input?.value.trim();
                        if (name && !anesthesiaForm.anesthesiaDrugs.find(d => d.name === name)) {
                          setAnesthesiaForm({ ...anesthesiaForm, anesthesiaDrugs: [...anesthesiaForm.anesthesiaDrugs, { name, dose: '', unit: '' }] });
                          if (input) input.value = '';
                        }
                      }}
                      className="px-2 py-1.5 bg-surface-container-high text-[10px] text-outline-variant rounded hover:bg-surface-container-highest transition-colors"
                    >添加</button>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">术中生命体征</label>
                <input
                  type="text"
                  value={anesthesiaForm.vitalSignsDuring}
                  onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, vitalSignsDuring: e.target.value })}
                  placeholder="如: BP: 120/80, HR: 72, SpO2: 98%"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">麻醉时长 (分钟)</label>
                <input
                  type="number"
                  value={anesthesiaForm.duration}
                  onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, duration: Number(e.target.value) })}
                  placeholder="请输入麻醉时长"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAnesthesiaModal(false)}
                  className="flex-1 px-4 py-3 bg-surface-container text-on-surface font-headline text-xs uppercase tracking-wider rounded hover:bg-surface-container-high transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddAnesthesiaRecord}
                  className="flex-1 px-4 py-3 bg-secondary text-on-secondary font-headline text-xs uppercase tracking-wider rounded hover:bg-secondary/80 transition-colors"
                >
                  确认记录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurgeryAnesthesiaManagement;
