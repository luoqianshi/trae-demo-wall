import React, { useState, useEffect } from "react";
import { Search, Loader2, User, Plus, X, UserPlus, Phone, Clock, AlertTriangle, AlertCircle, CheckCircle2, ArrowRight, Hash, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { patientService, doctorService, registrationService, departmentService } from "@/lib/services";
import type { Patient, Doctor, Registration, Department } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedPage from "@/components/ui/AnimatedPage";

const DEFAULT_REG_FEE = 50;

const OutpatientManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [registrationForm, setRegistrationForm] = useState({
    patientId: 0,
    doctorId: 0,
    dept: "",
    regFee: DEFAULT_REG_FEE,
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
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [duplicatePatients, setDuplicatePatients] = useState<any[]>([]);

  const [lastRegistration, setLastRegistration] = useState<Registration | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [patientsRes, doctorsData, regsData, deptsData] = await Promise.all([
        fetch(`/api/patients?size=99999`).then(r => r.json()).then(d => d.patients || []),
        doctorService.getAll(),
        registrationService.getAll(),
        departmentService.getAll(),
      ]);
      setPatients(patientsRes);
      setDoctors(doctorsData);
      setRegistrations(regsData);
      setDepartments(deptsData);
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setRegistrationForm((prev) => ({ ...prev, patientId: patient.id }));
    setShowSearchResults(false);
    setSearchTerm(patient.name);
  };

  const handleNewPatient = () => {
    setNewPatientForm(prev => ({
      ...prev,
      name: searchTerm,
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
    }));
    setShowNewPatientDialog(true);
  };

  const handleSaveNewPatient = async () => {
    if (!newPatientForm.name || !newPatientForm.age) {
      alert("请填写姓名和年龄");
      return;
    }

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
      const patientData = {
        name: newPatientForm.name,
        gender: newPatientForm.gender,
        age: parseInt(newPatientForm.age) || 0,
        birthDate: newPatientForm.birthDate || undefined,
        phone: newPatientForm.phone,
        id_card: newPatientForm.idCard,
        address: newPatientForm.address || undefined,
        occupation: newPatientForm.occupation || undefined,
        maritalStatus: newPatientForm.maritalStatus || undefined,
        insuranceType: newPatientForm.insuranceType || undefined,
        medicalInsuranceNo: newPatientForm.medicalInsuranceNo || undefined,
        contractUnit: newPatientForm.contractUnit || undefined,
        emergencyContact: newPatientForm.emergencyContact || undefined,
        emergencyPhone: newPatientForm.emergencyPhone || undefined,
        allergy_history: newPatientForm.allergyHistory || undefined,
      };

      const result = (await patientService.add(patientData)) as { success: boolean; id?: number };

      if (result.success && result.id) {
        const fresh = await fetch(`/api/patients?size=99999`).then(r => r.json()).then(d => d.patients || []);
        setPatients(fresh);
        const newPatient = fresh.find((p) => p.id === result.id);
        if (newPatient) {
          setSelectedPatient(newPatient);
          setRegistrationForm((prev) => ({ ...prev, patientId: newPatient.id }));
          setSearchTerm(newPatient.name);
        } else {
          const fallbackPatient: Patient = {
            id: result.id,
            hospitalId: "",
            medicalRecordNo: `MR${Date.now()}`,
            name: patientData.name,
            gender: patientData.gender,
            age: parseInt(newPatientForm.age) || 0,
            birthDate: patientData.birthDate,
            phone: patientData.phone,
            idCard: patientData.id_card,
            address: patientData.address,
            occupation: patientData.occupation,
            maritalStatus: patientData.maritalStatus,
            insuranceType: patientData.insuranceType,
            medicalInsuranceNo: patientData.medicalInsuranceNo,
            contractUnit: patientData.contractUnit,
            emergencyContact: patientData.emergencyContact,
            emergencyPhone: patientData.emergencyPhone,
            allergyHistory: patientData.allergy_history,
          };
          setSelectedPatient(fallbackPatient);
          setRegistrationForm((prev) => ({ ...prev, patientId: fallbackPatient.id }));
          setSearchTerm(fallbackPatient.name);
        }
        setShowNewPatientDialog(false);
        setDuplicatePatients([]);
        alert("患者档案创建成功！");
      } else {
        alert("创建失败，请重试");
      }
    } catch (error) {
      console.error("创建患者失败:", error);
      const message = error instanceof Error ? error.message : "创建失败，请重试";
      alert(message);
    } finally {
      setSavingPatient(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedPatient || !registrationForm.doctorId || !registrationForm.dept) {
      alert("请填写完整挂号信息");
      return;
    }

    try {
      const result = await registrationService.add({
        patientId: selectedPatient.id,
        doctorId: registrationForm.doctorId,
        dept: registrationForm.dept,
        regFee: registrationForm.regFee,
        regStatus: "waiting",
      }) as { success: boolean; id?: number };

      if (result.success && result.id) {
        const regsData = await registrationService.getAll();
        setRegistrations(regsData);
        const newReg = regsData.find(r => r.id === result.id);
        if (newReg) {
          setLastRegistration(newReg);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 5000);
        }
        setSelectedPatient(null);
        setSearchTerm("");
        setRegistrationForm({ patientId: 0, doctorId: 0, dept: "", regFee: DEFAULT_REG_FEE });
      }
    } catch (error) {
      console.error("挂号失败:", error);
      alert("挂号失败，请重试");
    }
  };

  const waitingRegistrations = registrations.filter((r) => r.regStatus === "waiting");
  const inProgressRegistrations = registrations.filter((r) => r.regStatus === "in_progress");

  const getPatientName = (patientId: number) => patients.find((p) => p.id === patientId)?.name || "未知";
  const getPatientInfo = (patientId: number) => patients.find((p) => p.id === patientId);
  const getDoctorName = (doctorId: number) => doctors.find((d) => d.id === doctorId)?.name || "未知";

  const handleGoToDoctor = (reg: Registration) => {
    navigate("/doctor-workstation", {
      state: { patientId: reg.patientId, registration: reg }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">门诊挂号</h1>
          <p className="text-xs text-muted-foreground mt-0.5">患者挂号 · 分诊管理 · 以挂号ID为全流程唯一标识</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-success bg-tertiary-container px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
            挂号终端在线
          </span>
        </div>
      </div>

      {showSuccess && lastRegistration && (
        <div className="bg-success/5 border border-success/30 rounded-lg p-4 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-success" size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-success">挂号成功！</p>
              <p className="text-xs text-success/70">
                挂号ID: <span className="font-mono font-bold">#{lastRegistration.id}</span> · 
                患者: {getPatientName(lastRegistration.patientId)} · 
                科室: {lastRegistration.dept}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleGoToDoctor(lastRegistration)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            前往医生工作站 <ArrowRight size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
              <Search size={16} className="text-primary" />
              查找患者
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                value={selectedPatient ? selectedPatient.name : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedPatient(null);
                  setRegistrationForm(prev => ({ ...prev, patientId: 0 }));
                  if (e.target.value.trim()) {
                    const term = e.target.value.trim().toLowerCase();
                    const results = patients.filter(p => p.name?.toLowerCase().includes(term));
                    setSearchResults(results);
                    setShowSearchResults(results.length > 0);
                  } else {
                    setShowSearchResults(false);
                    setSearchResults([]);
                  }
                }}
                placeholder="输入患者姓名搜索..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-muted border border-transparent rounded-md focus:bg-card focus:border-primary focus:outline-none transition-all"
              />
              {(selectedPatient || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearchTerm("");
                    setShowSearchResults(false);
                    setRegistrationForm(prev => ({ ...prev, patientId: 0 }));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {showSearchResults && !selectedPatient && (
              <div className="mt-2 border border-border rounded-md max-h-56 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-card-foreground">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground">{p.gender} · {p.age}岁</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      <span className="text-primary font-medium">{p.hospitalId || `H${String(p.id).padStart(8, "0")}`}</span> · {p.phone || "无电话"}
                    </div>
                  </button>
                ))}
                {searchResults.length === 0 && searchTerm.trim() && (
                  <div className="px-4 py-3 text-center">
                    <p className="text-xs text-muted-foreground">未找到匹配患者</p>
                    <button
                      onClick={handleNewPatient}
                      className="mt-2 text-xs text-primary font-medium hover:underline"
                    >
                      + 新建患者档案
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleNewPatient}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary-container transition-colors"
            >
              <UserPlus size={14} />
              新建患者档案
            </button>
          </div>

          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
              <Hash size={16} className="text-primary" />
              挂号信息
            </h3>

            {selectedPatient ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-primary-container/30 rounded-md">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {selectedPatient.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-card-foreground">{selectedPatient.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="text-primary font-medium">{selectedPatient.hospitalId || `H${String(selectedPatient.id).padStart(8, "0")}`}</span> · {selectedPatient.gender} · {selectedPatient.age}岁 · {selectedPatient.phone || "无电话"}
                    </p>
                  </div>
                </div>

                {selectedPatient.allergyHistory && selectedPatient.allergyHistory !== "无" && selectedPatient.allergyHistory !== "无过敏史" && (
                  <div className="bg-warning/5 border border-warning/20 rounded-md p-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-warning shrink-0" />
                    <p className="text-[11px] text-warning">过敏史: {selectedPatient.allergyHistory}</p>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-muted-foreground font-medium mb-1">挂号科室</label>
                  <select
                    className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all"
                    value={registrationForm.dept}
                    onChange={(e) => setRegistrationForm((prev) => ({ ...prev, dept: e.target.value, doctorId: 0 }))}
                  >
                    <option value="">请选择科室</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-muted-foreground font-medium mb-1">接诊医生</label>
                  <select
                    className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all"
                    value={registrationForm.doctorId}
                    onChange={(e) => setRegistrationForm((prev) => ({ ...prev, doctorId: parseInt(e.target.value) }))}
                  >
                    <option value="">请选择医生</option>
                    {doctors
                      .filter((d) => !registrationForm.dept || d.dept === registrationForm.dept)
                      .map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>{doctor.name} ({doctor.title})</option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground">挂号费用</p>
                    <p className="text-lg font-bold text-primary">¥{registrationForm.regFee}</p>
                  </div>
                  <button
                    onClick={handleRegister}
                    disabled={!selectedPatient || !registrationForm.doctorId}
                    className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确认挂号
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                  <User className="text-muted-foreground" size={24} />
                </div>
                <p className="text-sm text-muted-foreground">请先搜索并选择患者</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">支持患者姓名检索</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
              <Clock size={16} className="text-warning" />
              候诊队列
              <span className="ml-auto text-[11px] text-muted-foreground">{waitingRegistrations.length} 人</span>
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {waitingRegistrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">暂无候诊患者</div>
              ) : (
                waitingRegistrations.map((reg) => {
                  const patient = getPatientInfo(reg.patientId);
                  return (
                    <div key={reg.id} className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary/30 transition-colors">
                      <div className="w-8 h-8 bg-primary-container rounded-md flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        #{reg.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">{getPatientName(reg.patientId)}</p>
                        <p className="text-[11px] text-muted-foreground">{reg.dept} · {getDoctorName(reg.doctorId)}</p>
                      </div>
                      <button
                        onClick={() => handleGoToDoctor(reg)}
                        className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground text-[11px] font-medium rounded-md hover:opacity-90 transition-opacity"
                      >
                        就诊
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
              <Activity size={16} className="text-tertiary" />
              就诊中
              <span className="ml-auto text-[11px] text-muted-foreground">{inProgressRegistrations.length} 人</span>
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {inProgressRegistrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">暂无就诊中患者</div>
              ) : (
                inProgressRegistrations.map((reg) => (
                  <div key={reg.id} className="flex items-center gap-3 p-3 rounded-md bg-tertiary-container/20 border border-tertiary/20">
                    <div className="w-8 h-8 bg-tertiary-container rounded-md flex items-center justify-center text-xs font-bold text-tertiary shrink-0">
                      #{reg.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{getPatientName(reg.patientId)}</p>
                      <p className="text-[11px] text-muted-foreground">{reg.dept} · {getDoctorName(reg.doctorId)}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-tertiary-container text-tertiary rounded font-medium">就诊中</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4">流程说明</h3>
            <div className="space-y-3">
              {[
                { step: "1", label: "挂号登记", desc: "生成唯一挂号ID", icon: Hash, active: true },
                { step: "2", label: "医生诊疗", desc: "基于挂号ID接诊", icon: StethoscopeIcon },
                { step: "3", label: "开具处方", desc: "处方关联挂号ID", icon: FileTextIcon },
                { step: "4", label: "收费结算", desc: "按挂号ID汇总费用", icon: DollarSignIcon },
                { step: "5", label: "药房发药", desc: "已收费处方发药", icon: PillIcon },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${item.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {item.step}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-card-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showNewPatientDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-card-foreground">新建患者档案</h3>
              <button onClick={() => setShowNewPatientDialog(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">医院ID（自动生成）</label>
                <input type="text" value={newPatientForm.hospitalId || '(新建时自动生成)'} disabled className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">姓名 *</label>
                  <input type="text" value={newPatientForm.name} onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">性别</label>
                  <select value={newPatientForm.gender} onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all">
                    <option value="男">男</option><option value="女">女</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">年龄 *</label>
                  <input type="number" value={newPatientForm.age} onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">出生日期</label>
                  <input type="date" value={newPatientForm.birthDate} onChange={(e) => setNewPatientForm({ ...newPatientForm, birthDate: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">联系电话</label>
                  <input type="text" value={newPatientForm.phone} onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">身份证号</label>
                  <input type="text" value={newPatientForm.idCard} onChange={(e) => setNewPatientForm({ ...newPatientForm, idCard: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">婚姻状况</label>
                  <select value={newPatientForm.maritalStatus} onChange={(e) => setNewPatientForm({ ...newPatientForm, maritalStatus: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all">
                    <option value="未婚">未婚</option><option value="已婚">已婚</option><option value="离异">离异</option><option value="丧偶">丧偶</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">医保类型</label>
                  <select value={newPatientForm.insuranceType} onChange={(e) => setNewPatientForm({ ...newPatientForm, insuranceType: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all">
                    <option value="自费">自费</option><option value="城镇职工医保">城镇职工医保</option><option value="城乡居民医保">城乡居民医保</option><option value="公费医疗">公费医疗</option><option value="商业保险">商业保险</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">医保号</label>
                  <input type="text" value={newPatientForm.medicalInsuranceNo} onChange={(e) => setNewPatientForm({ ...newPatientForm, medicalInsuranceNo: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">职业</label>
                  <input type="text" value={newPatientForm.occupation} onChange={(e) => setNewPatientForm({ ...newPatientForm, occupation: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">合同单位</label>
                  <input type="text" value={newPatientForm.contractUnit} onChange={(e) => setNewPatientForm({ ...newPatientForm, contractUnit: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">紧急联系人</label>
                  <input type="text" value={newPatientForm.emergencyContact} onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyContact: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">紧急联系电话</label>
                  <input type="text" value={newPatientForm.emergencyPhone} onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyPhone: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">地址</label>
                <input type="text" value={newPatientForm.address} onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">过敏史</label>
                <input type="text" value={newPatientForm.allergyHistory} onChange={(e) => setNewPatientForm({ ...newPatientForm, allergyHistory: e.target.value })} className="w-full bg-muted border border-transparent rounded-md py-2 px-3 text-sm focus:bg-card focus:border-primary focus:outline-none transition-all" placeholder="如：青霉素过敏" />
              </div>
              {duplicatePatients.length > 0 && (
                <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">
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
                          className="w-full rounded-md border border-border bg-card px-3 py-2 text-left hover:border-primary"
                        >
                          <div className="font-medium">{patient.name} · {patient.gender} · {patient.age}岁</div>
                          <div className="text-xs text-muted-foreground">
                            {patient.medicalRecordNo || patient.medical_record_no || "-"} · {patient.phone || "-"} · {patient.idCard || patient.id_card || "-"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNewPatientDialog(false)} className="flex-1 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors">取消</button>
                <button onClick={handleSaveNewPatient} disabled={savingPatient} className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50">
                  {savingPatient ? "保存中..." : "创建档案"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StethoscopeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .2.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>;
const FileTextIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
const DollarSignIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const PillIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>;

export default OutpatientManagement;
