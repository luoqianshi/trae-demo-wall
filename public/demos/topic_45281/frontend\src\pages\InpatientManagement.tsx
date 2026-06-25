import React, { useState, useEffect } from "react";
import {
  Bed,
  User,
  Calendar,
  DollarSign,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Search,
  FileText,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { patientService, doctorService, bedService, inpatientService, departmentService } from "@/lib/services";
import AnimatedPage from "@/components/ui/AnimatedPage";
import type { Patient, Doctor, Bed as BedType, Inpatient } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

const InpatientManagement: React.FC = () => {
  const { user } = useAuth();
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [beds, setBeds] = useState<BedType[]>([]);
  const [allBeds, setAllBeds] = useState<BedType[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"list" | "beds" | "admit">("list");
  const [selectedDept, setSelectedDept] = useState<string>("全部科室");

  const [bedPage, setBedPage] = useState(1);
  const [bedPageSize] = useState(20);
  const [bedTotal, setBedTotal] = useState(0);
  const [bedJumpPage, setBedJumpPage] = useState(1);

  const [patientPage, setPatientPage] = useState(1);
  const [patientPageSize] = useState(15);
  const [patientJumpPage, setPatientJumpPage] = useState(1);

  const [admitPatientSearch, setAdmitPatientSearch] = useState("");
  const [admitDeptSearch, setAdmitDeptSearch] = useState("");
  const [showAdmitPatientList, setShowAdmitPatientList] = useState(false);
  const [showAdmitDeptList, setShowAdmitDeptList] = useState(false);

  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showBedModal, setShowBedModal] = useState(false);
  const [editingBed, setEditingBed] = useState<BedType | null>(null);
  const [bedForm, setBedForm] = useState({
    bedNo: "",
    dept: "",
    status: "vacant" as "vacant" | "occupied" | "maintenance",
  });

  const [admitForm, setAdmitForm] = useState({
    inpatientNo: "",
    patientId: 0,
    bedNo: "",
    dept: "",
    doctorId: 0,
    diagnosis: "",
    deposit: 0,
  });

  const depts = ["全部科室", ...departments.map(d => d.name || d.deptName || d)];

  const loadBeds = async (page: number = 1) => {
    try {
      const res = await fetch(`/api/beds?page=${page}&size=${bedPageSize}`);
      const data = await res.json();
      setBeds(data.items || []);
      setBedTotal(data.total || data.count || 0);
    } catch (error) {
      console.error("加载床位失败:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const patientsRes = await fetch("/api/patients?size=99999");
      const patientsJson = await patientsRes.json();
      const [inpatientsData, doctorsData, deptData] = await Promise.all([
        inpatientService.getAll(),
        doctorService.getAll(),
        departmentService.getAll(),
      ]);
      console.log("住院患者数据:", inpatientsData);
      setInpatients(inpatientsData || []);
      setPatients(patientsJson.patients || []);
      setDoctors(doctorsData || []);
      setDepartments(deptData || []);
      await loadBeds(bedPage);
      try {
        const res = await fetch(`/api/beds?size=99999`);
        const data = await res.json();
        setAllBeds(data.items || data || []);
      } catch (e) {
        console.error("加载全量床位失败:", e);
      }
    } catch (error) {
      console.error("加载数据失败:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInpatients = selectedDept === "全部科室"
    ? inpatients
    : inpatients.filter(ip => ip.dept === selectedDept);

  const admittedInpatients = filteredInpatients.filter(ip => ip.status === "admitted");
  const dischargedInpatients = filteredInpatients.filter(ip => ip.status === "discharged");

  const pagedAdmitted = admittedInpatients.slice((patientPage - 1) * patientPageSize, patientPage * patientPageSize);
  const totalAdmittedPages = Math.ceil(admittedInpatients.length / patientPageSize);

  const vacantBeds = allBeds.filter(b => b.status === "vacant");
  const occupiedBeds = allBeds.filter(b => b.status === "occupied");
  const usageRate = allBeds.length > 0 ? Math.round((occupiedBeds.length / allBeds.length) * 1000) / 10 : 0;
  const usageRateColor = usageRate > 70 ? "text-error" : usageRate > 30 ? "text-secondary" : "text-tertiary";
  const usageRateBarColor = usageRate > 70 ? "bg-error" : usageRate > 30 ? "bg-secondary" : "bg-tertiary";

  const handleAdmit = async () => {
    if (!admitForm.patientId || !admitForm.bedNo || !admitForm.dept || !admitForm.doctorId) {
      alert("请填写完整信息");
      return;
    }

    try {
      await inpatientService.add({
        inpatientNo: admitForm.inpatientNo || undefined,
        patientId: admitForm.patientId,
        bedNo: admitForm.bedNo,
        dept: admitForm.dept,
        doctorId: admitForm.doctorId,
        diagnosis: admitForm.diagnosis,
        deposit: admitForm.deposit,
        admissionDate: new Date().toISOString(),
        status: "admitted",
      });

      const selectedBed = allBeds.find(b => b.bedNo === admitForm.bedNo);
      if (selectedBed) {
        await bedService.allocate(selectedBed.id, admitForm.patientId, patients.find(p => p.id === admitForm.patientId)?.name || "");
      }

      alert("入院办理成功");
      setShowAdmitModal(false);
      setAdmitForm({ inpatientNo: "", patientId: 0, bedNo: "", dept: "", doctorId: 0, diagnosis: "", deposit: 0 });
      loadData();
    } catch (error) {
      console.error("入院办理失败:", error);
      alert("入院办理失败");
    }
  };

  const handleOpenBedModal = (bed?: BedType) => {
    if (bed) {
      setEditingBed(bed);
      setBedForm({
        bedNo: bed.bedNo,
        dept: bed.dept,
        status: bed.status,
      });
    } else {
      setEditingBed(null);
      setBedForm({
        bedNo: "",
        dept: "",
        status: "vacant",
      });
    }
    setShowBedModal(true);
  };

  const handleSaveBed = async () => {
    if (!bedForm.bedNo || !bedForm.dept) {
      alert("请填写完整信息");
      return;
    }

    try {
      if (editingBed) {
        const res = await bedService.update(editingBed.id, {
          bedNo: bedForm.bedNo,
          dept: bedForm.dept,
          status: bedForm.status,
        });
        if (res && typeof res === 'object' && 'success' in res && !res.success) {
          alert("床位更新失败");
          return;
        }
        alert("床位更新成功");
      } else {
        const res = await bedService.add({
          bedNo: bedForm.bedNo,
          dept: bedForm.dept,
          status: bedForm.status,
        });
        if (res && typeof res === 'object' && 'success' in res && !res.success) {
          alert("床位添加失败");
          return;
        }
        alert("床位添加成功");
      }
      setShowBedModal(false);
      loadData();
    } catch (error) {
      console.error("保存床位失败:", error);
      alert("保存失败");
    }
  };

  const [settlementModal, setSettlementModal] = useState<{
    open: boolean;
    inpatient: Inpatient | null;
    settlement: {
      inpatientId: number;
      patientName: string;
      admissionDate: string;
      details: { name: string; amount: number }[];
      totalFee: number;
      deposit: number;
      balance: number;
    } | null;
  }>({ open: false, inpatient: null, settlement: null });

  const handleDischarge = async (inpatient: Inpatient) => {
    try {
      const raw = await inpatientService.getSettlement(inpatient.id) as any;
      const settlement = {
        inpatientId: raw?.inpatientId || inpatient.id,
        patientName: raw?.patientName || inpatient.patientName || "未知",
        admissionDate: raw?.admissionDate || "",
        details: Array.isArray(raw?.details) ? raw.details : [],
        totalFee: typeof raw?.totalFee === "number" ? raw.totalFee : 0,
        deposit: typeof raw?.deposit === "number" ? raw.deposit : 0,
        balance: typeof raw?.balance === "number" ? raw.balance : 0,
      };
      setSettlementModal({ open: true, inpatient, settlement });
    } catch (error) {
      console.error("获取结算信息失败:", error);
      if (confirm(`获取结算信息失败，是否仍要为患者「${inpatient.patientName}」办理出院？`)) {
        await doDischarge(inpatient);
      }
    }
  };

  const doDischarge = async (inpatient: Inpatient) => {
    try {
      await inpatientService.discharge(inpatient.id, inpatient.diagnosis || "已治愈");
      const selectedBed = allBeds.find(b => b.bedNo === inpatient.bedNo);
      if (selectedBed) {
        await bedService.vacate(selectedBed.id);
      }
      setSettlementModal({ open: false, inpatient: null, settlement: null });
      alert("出院办理成功");
      loadData();
    } catch (error) {
      console.error("出院办理失败:", error);
      alert("出院办理失败");
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface-dim">
      <div className="px-6 py-4 bg-surface-container border-b border-outline-variant/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bed className="text-primary" size={20} />
            </div>
            <div>
              <h1 className="font-headline font-bold text-lg text-on-surface">住院管理系统</h1>
              <p className="text-[10px] font-mono text-outline uppercase tracking-wider">Inpatient Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-mono text-outline uppercase">在院患者</p>
              <p className="text-xl font-headline font-bold text-primary">{admittedInpatients.length}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-outline uppercase">空床位</p>
              <p className="text-xl font-headline font-bold text-tertiary">{vacantBeds.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-outline-variant/10 bg-surface">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-6 py-3 font-headline text-xs uppercase tracking-widest transition-colors ${
            activeTab === "list"
              ? "text-primary border-b-2 border-primary"
              : "text-outline hover:text-on-surface"
          }`}
        >
          <FileText size={14} className="inline mr-2" />
          患者列表
        </button>
        <button
          onClick={() => setActiveTab("beds")}
          className={`px-6 py-3 font-headline text-xs uppercase tracking-widest transition-colors ${
            activeTab === "beds"
              ? "text-primary border-b-2 border-primary"
              : "text-outline hover:text-on-surface"
          }`}
        >
          <Bed size={14} className="inline mr-2" />
          床位管理
        </button>
        <button
          onClick={() => setActiveTab("admit")}
          className={`px-6 py-3 font-headline text-xs uppercase tracking-widest transition-colors ${
            activeTab === "admit"
              ? "text-primary border-b-2 border-primary"
              : "text-outline hover:text-on-surface"
          }`}
        >
          <Plus size={14} className="inline mr-2" />
          办理入院
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
                <div className="flex items-center gap-4">
                  <Search className="text-outline" size={16} />
                  <div className="flex gap-2">
                    {depts.map((dept) => (
                      <button
                        key={dept}
                        onClick={() => setSelectedDept(dept)}
                        className={`px-3 py-1.5 text-[10px] font-headline uppercase tracking-wider rounded transition-colors ${
                          selectedDept === dept
                            ? "bg-primary text-on-primary"
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
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">住院ID</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">床位</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">患者姓名</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">性别</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">年龄</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">科室</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">主治医生</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">入院日期</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">诊断</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">押金</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">状态</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedAdmitted.map((inpatient) => (
                        <tr key={inpatient.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-primary font-bold">{inpatient.inpatientNo || `IP${String(inpatient.id).padStart(6, '0')}`}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-primary">{inpatient.bedNo}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-headline text-on-surface">{inpatient.patientName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{inpatient.gender}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{inpatient.age}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{inpatient.dept}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{inpatient.doctorName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-outline">{inpatient.admissionDate?.split(" ")[0]}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline max-w-[120px] truncate block">{inpatient.diagnosis || "-"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-tertiary">¥{inpatient.deposit?.toFixed(0) || 0}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-primary/10 text-primary">
                              在院
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDischarge(inpatient)}
                              className="px-3 py-1 text-[9px] font-headline uppercase bg-secondary/10 text-secondary hover:bg-secondary/20 rounded transition-colors"
                            >
                              办理出院
                            </button>
                          </td>
                        </tr>
                      ))}
                      {admittedInpatients.length === 0 && (
                        <tr>
                          <td colSpan={12} className="px-4 py-8 text-center text-xs text-outline">
                            暂无在院患者
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {admittedInpatients.length > patientPageSize && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-outline font-mono">
                      共 {admittedInpatients.length} 条，第 {patientPage}/{totalAdmittedPages} 页
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setPatientPage(1); setPatientJumpPage(1); }}
                        disabled={patientPage === 1}
                        className="px-2 py-1 text-[10px] bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                      >
                        首页
                      </button>
                      <button
                        onClick={() => { const p = Math.max(1, patientPage - 1); setPatientPage(p); setPatientJumpPage(p); }}
                        disabled={patientPage === 1}
                        className="px-2 py-1 bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <div className="flex items-center gap-1 mx-2">
                        <input
                          type="number"
                          min={1}
                          max={totalAdmittedPages}
                          value={patientJumpPage}
                          onChange={e => setPatientJumpPage(Number(e.target.value))}
                          onKeyDown={e => { if (e.key === 'Enter') { const target = Math.max(1, Math.min(totalAdmittedPages, patientJumpPage)); setPatientPage(target); setPatientJumpPage(target); } }}
                          className="w-12 px-1 py-1 text-[10px] text-center bg-surface-container-high border border-outline-variant/20 rounded focus:ring-1 focus:ring-primary outline-none"
                        />
                        <span className="text-[10px] text-outline">/{totalAdmittedPages}</span>
                        <button
                          onClick={() => { const target = Math.max(1, Math.min(totalAdmittedPages, patientJumpPage)); setPatientPage(target); setPatientJumpPage(target); }}
                          className="px-2 py-1 text-[10px] bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                        >
                          跳转
                        </button>
                      </div>
                      <button
                        onClick={() => { const p = Math.min(totalAdmittedPages, patientPage + 1); setPatientPage(p); setPatientJumpPage(p); }}
                        disabled={patientPage >= totalAdmittedPages}
                        className="px-2 py-1 bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => { setPatientPage(totalAdmittedPages); setPatientJumpPage(totalAdmittedPages); }}
                        disabled={patientPage >= totalAdmittedPages}
                        className="px-2 py-1 text-[10px] bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                      >
                        末页
                      </button>
                    </div>
                  </div>
                )}

                {dischargedInpatients.length > 0 && (
                  <div>
                    <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-outline mb-4">已出院患者</h3>
                    <div className="bg-surface-container rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-surface-container-high">
                            <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">住院ID</th>
                            <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">床位</th>
                            <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">患者姓名</th>
                            <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">入院日期</th>
                            <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">出院日期</th>
                            <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">诊断</th>
                            <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">总费用</th>
                            <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dischargedInpatients.map((inpatient) => (
                            <tr key={inpatient.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                              <td className="px-4 py-3">
                                <span className="text-xs font-mono text-outline font-bold">{inpatient.inpatientNo || `IP${String(inpatient.id).padStart(6, '0')}`}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-mono text-outline">{inpatient.bedNo}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-headline text-on-surface">{inpatient.patientName}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-mono text-outline">{inpatient.admissionDate?.split(" ")[0]}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-mono text-outline">{inpatient.dischargeDate?.split(" ")[0]}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-outline">{inpatient.diagnosis || "-"}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-mono text-tertiary">¥{inpatient.totalFee?.toFixed(2) || 0}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-outline/10 text-outline">
                                  已出院
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "beds" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-4 gap-4 flex-1">
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-headline uppercase text-outline tracking-wider">总床位数</p>
                          <p className="text-2xl font-headline font-bold text-primary mt-1">{bedTotal || allBeds.length}</p>
                        </div>
                        <Bed className="text-primary/50" size={32} />
                      </div>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-headline uppercase text-outline tracking-wider">空床位</p>
                          <p className="text-2xl font-headline font-bold text-tertiary mt-1">{vacantBeds.length}</p>
                        </div>
                        <CheckCircle2 className="text-tertiary/50" size={32} />
                      </div>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-headline uppercase text-outline tracking-wider">占用中</p>
                          <p className="text-2xl font-headline font-bold text-secondary mt-1">{occupiedBeds.length}</p>
                        </div>
                        <User className="text-secondary/50" size={32} />
                      </div>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[10px] font-headline uppercase text-outline tracking-wider">使用率</p>
                          <p className={`text-2xl font-headline font-bold mt-1 ${usageRateColor}`}>
                            {usageRate}%
                          </p>
                          <div className="w-full h-1.5 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${usageRateBarColor}`}
                              style={{ width: `${Math.min(100, usageRate)}%` }}
                            />
                          </div>
                        </div>
                        <Clock className={`size-8 ml-3 ${usageRateColor}`} size={32} />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenBedModal()}
                    className="ml-4 px-4 py-2 bg-primary text-on-primary font-headline text-xs uppercase tracking-wider rounded hover:bg-primary/80 transition-colors flex items-center gap-2"
                  >
                    <Plus size={14} />
                    添加床位
                  </button>
                </div>

                <div className="bg-surface-container rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-container-high">
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">床位号</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">科室</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">状态</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">患者</th>
                        <th className="text-left px-4 py-3 text-[10px] font-headline uppercase tracking-widest text-outline">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beds.map((bed) => (
                        <tr key={bed.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-primary">{bed.bedNo}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-on-surface">{bed.dept}</span>
                          </td>
                          <td className="px-4 py-3">
                            {bed.status === "vacant" && (
                              <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-tertiary/10 text-tertiary">空闲</span>
                            )}
                            {bed.status === "occupied" && (
                              <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-secondary/10 text-secondary">占用</span>
                            )}
                            {bed.status === "maintenance" && (
                              <span className="px-2 py-0.5 text-[9px] font-headline uppercase rounded bg-outline/10 text-outline">维护</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-outline">{bed.patientName || "-"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleOpenBedModal(bed)}
                              className="px-3 py-1 text-[9px] font-headline uppercase bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
                            >
                              编辑
                            </button>
                          </td>
                        </tr>
                      ))}
                      {beds.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-xs text-outline">
                            暂无床位数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {bedTotal > bedPageSize && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-outline font-mono">
                      共 {bedTotal} 条，第 {bedPage}/{Math.ceil(bedTotal / bedPageSize)} 页
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setBedPage(1); loadBeds(1); setBedJumpPage(1); }}
                        disabled={bedPage === 1}
                        className="px-2 py-1 text-[10px] bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                      >
                        首页
                      </button>
                      <button
                        onClick={() => { const p = Math.max(1, bedPage - 1); setBedPage(p); setBedJumpPage(p); loadBeds(p); }}
                        disabled={bedPage === 1}
                        className="px-2 py-1 bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <div className="flex items-center gap-1 mx-2">
                        <input
                          type="number"
                          min={1}
                          max={Math.ceil(bedTotal / bedPageSize)}
                          value={bedJumpPage}
                          onChange={e => setBedJumpPage(Number(e.target.value))}
                          onKeyDown={e => { if (e.key === 'Enter') { const tp = Math.ceil(bedTotal / bedPageSize); const target = Math.max(1, Math.min(tp, bedJumpPage)); setBedPage(target); setBedJumpPage(target); loadBeds(target); } }}
                          className="w-12 px-1 py-1 text-[10px] text-center bg-surface-container-high border border-outline-variant/20 rounded focus:ring-1 focus:ring-primary outline-none"
                        />
                        <span className="text-[10px] text-outline">/{Math.ceil(bedTotal / bedPageSize)}</span>
                        <button
                          onClick={() => { const tp = Math.ceil(bedTotal / bedPageSize); const target = Math.max(1, Math.min(tp, bedJumpPage)); setBedPage(target); setBedJumpPage(target); loadBeds(target); }}
                          className="px-2 py-1 text-[10px] bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                        >
                          跳转
                        </button>
                      </div>
                      <button
                        onClick={() => { const p = Math.min(Math.ceil(bedTotal / bedPageSize), bedPage + 1); setBedPage(p); setBedJumpPage(p); loadBeds(p); }}
                        disabled={bedPage >= Math.ceil(bedTotal / bedPageSize)}
                        className="px-2 py-1 bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => { const p = Math.ceil(bedTotal / bedPageSize); setBedPage(p); setBedJumpPage(p); loadBeds(p); }}
                        disabled={bedPage >= Math.ceil(bedTotal / bedPageSize)}
                        className="px-2 py-1 text-[10px] bg-surface-container-high rounded hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                      >
                        末页
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "admit" && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-surface-container rounded-lg p-6">
                  <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-primary mb-6">入院登记</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">住院ID（自动使用患者医院ID）</label>
                      <input
                        type="text"
                        value={admitForm.inpatientNo}
                        readOnly
                        placeholder="请先选择患者"
                        className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded text-muted-foreground"
                      />
                    </div>

                    <div className="relative">
                      <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">选择患者</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={14} />
                        <input
                          type="text"
                          value={admitPatientSearch}
                          onChange={(e) => {
                            const term = e.target.value;
                            setAdmitPatientSearch(term);
                            if (term.trim()) {
                              setShowAdmitPatientList(true);
                            } else {
                              setShowAdmitPatientList(false);
                            }
                          }}
                          onFocus={() => { if (admitPatientSearch.trim()) setShowAdmitPatientList(true); }}
                          onBlur={() => setTimeout(() => setShowAdmitPatientList(false), 200)}
                          placeholder="搜索患者姓名..."
                          className="w-full bg-surface-container-high border-none text-sm text-on-surface pl-9 pr-3 py-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                        />
                      </div>
                      {showAdmitPatientList && (
                        <div className="absolute z-50 w-full mt-1 bg-surface border border-outline-variant/20 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                          onMouseDown={e => e.preventDefault()}>
                          {patients
                            .slice()
                            .sort((a, b) => (b.id || 0) - (a.id || 0))
                            .filter(p => !admitPatientSearch || p.name?.toLowerCase().includes(admitPatientSearch.toLowerCase()))
                            .slice(0, 20000)
                            .map((patient) => (
                              <button
                                key={patient.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setAdmitForm({ ...admitForm, patientId: patient.id, inpatientNo: patient.hospitalId || "" });
                                  setAdmitPatientSearch(patient.name);
                                  setShowAdmitPatientList(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-primary-container/10 border-b border-outline-variant/5 last:border-b-0 transition-colors"
                              >
                                <span className="text-xs font-headline font-bold text-on-surface">{patient.name}</span>
                                <span className="text-[10px] text-outline ml-2">{patient.gender} - {patient.age}岁</span>
                                {patient.hospitalId && <span className="text-[9px] text-primary ml-2 font-mono">ID: {patient.hospitalId}</span>}
                              </button>
                            ))}
                          {patients.filter(p => !admitPatientSearch || p.name?.toLowerCase().includes(admitPatientSearch.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-xs text-outline">无匹配患者</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">选择科室</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={14} />
                        <input
                          type="text"
                          value={admitDeptSearch}
                          onChange={(e) => {
                            const term = e.target.value;
                            setAdmitDeptSearch(term);
                            if (term.trim()) {
                              setShowAdmitDeptList(true);
                            } else {
                              setShowAdmitDeptList(false);
                            }
                          }}
                          onFocus={() => { if (admitDeptSearch.trim()) setShowAdmitDeptList(true); }}
                          onBlur={() => setTimeout(() => setShowAdmitDeptList(false), 200)}
                          placeholder="搜索科室..."
                          className="w-full bg-surface-container-high border-none text-sm text-on-surface pl-9 pr-3 py-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                        />
                      </div>
                      {showAdmitDeptList && (
                        <div className="absolute z-50 w-full mt-1 bg-surface border border-outline-variant/20 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                          onMouseDown={e => e.preventDefault()}>
                          {depts
                            .filter(d => d !== "全部科室" && (!admitDeptSearch || d.toLowerCase().includes(admitDeptSearch.toLowerCase())))
                            .slice(0, 200)
                            .map((dept) => (
                              <button
                                key={dept}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setAdmitForm({ ...admitForm, dept: dept });
                                  setAdmitDeptSearch(dept);
                                  setShowAdmitDeptList(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-primary-container/10 border-b border-outline-variant/5 last:border-b-0 transition-colors"
                              >
                                <span className="text-xs font-headline text-on-surface">{dept}</span>
                              </button>
                            ))}
                          {depts.filter(d => d !== "全部科室" && (!admitDeptSearch || d.toLowerCase().includes(admitDeptSearch.toLowerCase()))).length === 0 && (
                            <div className="px-3 py-2 text-xs text-outline">无匹配科室</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">选择床位</label>
                      <select
                        value={admitForm.bedNo}
                        onChange={(e) => setAdmitForm({ ...admitForm, bedNo: e.target.value })}
                        className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container"
                      >
                        <option value="">请选择床位</option>
                        {vacantBeds.filter(b => b.dept === admitForm.dept || admitForm.dept === "").map((bed) => (
                          <option key={bed.id} value={bed.bedNo}>
                            {bed.bedNo} - {bed.dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">主治医生</label>
                      <select
                        value={admitForm.doctorId}
                        onChange={(e) => setAdmitForm({ ...admitForm, doctorId: Number(e.target.value) })}
                        className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container"
                      >
                        <option value={0}>请选择医生</option>
                        {doctors.filter(d => d.dept === admitForm.dept || admitForm.dept === "").map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name} - {doctor.title} - {doctor.dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">初步诊断</label>
                      <input
                        type="text"
                        value={admitForm.diagnosis}
                        onChange={(e) => setAdmitForm({ ...admitForm, diagnosis: e.target.value })}
                        placeholder="请输入初步诊断"
                        className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">押金金额 (元)</label>
                      <input
                        type="number"
                        value={admitForm.deposit}
                        onChange={(e) => setAdmitForm({ ...admitForm, deposit: Number(e.target.value) })}
                        placeholder="请输入押金金额"
                        className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleAdmit}
                        className="w-full bg-primary-container text-on-primary font-headline font-bold text-xs py-3 rounded hover:bg-primary-container/80 transition-colors uppercase"
                      >
                        确认入院
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showBedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container rounded-lg w-full max-w-md p-6">
            <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-primary mb-6">
              {editingBed ? "编辑床位" : "添加床位"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">床位号</label>
                <input
                  type="text"
                  value={bedForm.bedNo}
                  onChange={(e) => setBedForm({ ...bedForm, bedNo: e.target.value })}
                  placeholder="如: 101-1"
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container placeholder:text-outline-variant"
                />
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">科室</label>
                <select
                  value={bedForm.dept}
                  onChange={(e) => setBedForm({ ...bedForm, dept: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container"
                >
                  <option value="">请选择科室</option>
                  {depts.filter(d => d !== "全部科室").map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-outline block mb-2">状态</label>
                <select
                  value={bedForm.status}
                  onChange={(e) => setBedForm({ ...bedForm, status: e.target.value as "vacant" | "occupied" | "maintenance" })}
                  className="w-full bg-surface-container-high border-none text-sm text-on-surface p-3 rounded focus:ring-1 focus:ring-primary-container"
                >
                  <option value="vacant">空闲</option>
                  <option value="occupied">占用</option>
                  <option value="maintenance">维护</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBedModal(false)}
                  className="flex-1 px-4 py-3 bg-surface-container text-on-surface font-headline text-xs uppercase tracking-wider rounded hover:bg-surface-container-high transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveBed}
                  className="flex-1 px-4 py-3 bg-primary text-on-primary font-headline text-xs uppercase tracking-wider rounded hover:bg-primary/80 transition-colors"
                >
                  确认保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {settlementModal.open && settlementModal.settlement && settlementModal.inpatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container rounded-lg shadow-xl w-[480px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="font-headline font-bold text-lg text-primary mb-4">出院结算确认</h2>
              <div className="mb-4">
                <p className="text-sm text-on-surface">患者：<span className="font-bold">{settlementModal.settlement.patientName}</span></p>
              </div>
              <div className="bg-surface-container-low rounded p-4 mb-4">
                <h3 className="font-headline text-xs uppercase tracking-widest text-outline mb-3">费用明细</h3>
                <div className="space-y-2">
                  {settlementModal.settlement.details.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-on-surface">{d.name}</span>
                      <span className="font-mono text-on-surface">¥{(d.amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-outline-variant/20 mt-3 pt-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-primary">费用合计</span>
                    <span className="font-mono text-primary">¥{(settlementModal.settlement.totalFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-outline">预交金</span>
                    <span className="font-mono text-outline">-¥{(settlementModal.settlement.deposit || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold mt-1">
                    <span className={(settlementModal.settlement.balance || 0) > 0 ? "text-error" : "text-tertiary"}>
                      {(settlementModal.settlement.balance || 0) > 0 ? "应补缴" : "应退回"}
                    </span>
                    <span className={`font-mono ${(settlementModal.settlement.balance || 0) > 0 ? "text-error" : "text-tertiary"}`}>
                      ¥{Math.abs(settlementModal.settlement.balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSettlementModal({ open: false, inpatient: null, settlement: null })}
                  className="flex-1 px-4 py-3 bg-surface-container-highest text-on-surface font-headline text-xs uppercase tracking-wider rounded hover:bg-surface-container-high transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => doDischarge(settlementModal.inpatient!)}
                  className="flex-1 px-4 py-3 bg-primary text-on-primary font-headline text-xs uppercase tracking-wider rounded hover:bg-primary/80 transition-colors"
                >
                  确认出院
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InpatientManagement;
