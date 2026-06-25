import { useState, useEffect, useRef } from "react";
import {
  FileText, Pill, ClipboardList, Heart, ShieldCheck, Plus,
  Search, Stethoscope, X
} from "lucide-react";
import {
  patientService, doctorService, departmentService, inpatientService
} from "@/lib/services";
import type { Patient, Doctor, Department, Inpatient } from "@/lib/types";

const API = "/api";

function SearchSelect<T extends { id: number; name?: string }>({
  value, onChange, items, loading, placeholder, displayKey = "name",
  onSearch, searchValue, onSearchChange,
}: {
  value: number;
  onChange: (id: number, item: T) => void;
  items: T[];
  loading: boolean;
  placeholder: string;
  displayKey?: string;
  onSearch?: () => void;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = items.find(i => i.id === value);
  const displayName = selected ? (selected as any)[displayKey] : "";

  return (
    <div ref={containerRef} className="relative">
      <div
        className="border rounded px-3 py-1.5 text-sm cursor-pointer bg-white flex items-center justify-between min-w-[140px]"
        onClick={() => { setOpen(!open); if (onSearch) onSearch(); }}
      >
        <span className={selected ? "" : "text-gray-400"}>
          {selected ? displayName : placeholder}
        </span>
        {selected && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange(0, {} as T); }}
            className="ml-1 hover:text-red-500"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
          {onSearchChange && (
            <div className="p-1 sticky top-0 bg-white border-b">
              <input
                autoFocus
                placeholder="搜索..."
                value={searchValue || ""}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}
          {loading ? (
            <div className="p-3 text-sm text-gray-400 text-center">加载中...</div>
          ) : items.length === 0 ? (
            <div className="p-3 text-sm text-gray-400 text-center">暂无数据</div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-pink-50 ${
                  item.id === value ? "bg-pink-100 text-pink-700" : ""
                }`}
                onClick={() => { onChange(item.id, item); setOpen(false); }}
              >
                {(item as any)[displayKey]}
                {item.id === value && " ✓"}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MedicalRecordPanel() {
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  const [form, setForm] = useState({
    patientId: 0, patientName: "", medicalRecordNo: "", visitNo: "",
    doctorId: 0, doctorName: "", deptId: 0, deptName: "", visitType: "初诊",
    chiefComplaint: "", presentIllnessHistory: "", pastHistory: "", personalHistory: "",
    familyHistory: "", allergyHistory: "", physicalExam: "", auxiliaryExam: "", diagnosis: "",
    icdCode: "", treatmentPlan: "", advice: "", status: "进行中"
  });

  useEffect(() => {
    fetch(`${API}/outpatient-medical-records`).then(r => r.json()).then(d => setRecords(d.items || []));
  }, []);

  const loadOptions = () => {
    setLoadingOpts(true);
    Promise.all([
      patientService.getAll(patientSearch || undefined),
      doctorService.getAll(doctorSearch || undefined),
      departmentService.getAll(),
    ]).then(([p, d, depts]) => {
      setPatients(Array.isArray(p) ? p : []);
      setDoctors(Array.isArray(d) ? d : []);
      setDepartments(Array.isArray(depts) ? depts : []);
    }).finally(() => setLoadingOpts(false));
  };

  const selectPatient = (id: number, item: Patient) => {
    setForm({ ...form, patientId: id, patientName: item.name || "" });
  };
  const selectDoctor = (id: number, item: Doctor) => {
    const dept = departments.find(dep => dep.name === item.dept);
    setForm({
      ...form, doctorId: id, doctorName: item.name || "",
      deptId: dept?.id || 0, deptName: item.dept || ""
    });
  };

  const save = () => fetch(`${API}/outpatient-medical-records`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...form, visitDate: new Date().toISOString().split("T")[0]
    })
  }).then(r => r.json()).then(d => {
    if (d.success) {
      setShowForm(false);
      fetch(`${API}/outpatient-medical-records`).then(r => r.json()).then(d => setRecords(d.items || []));
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">门诊病历管理</h3>
        <button onClick={() => { setShowForm(!showForm); if (!showForm) loadOptions(); }}
          className="bg-pink-500 text-white px-4 py-2 rounded flex items-center gap-1 text-sm">
          <Plus size={16} />新建病历
        </button>
      </div>
      {showForm && (
        <div className="bg-gray-50 p-4 rounded border space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <SearchSelect
              value={form.patientId} onChange={selectPatient}
              items={patients} loading={loadingOpts} placeholder="选择患者"
              searchValue={patientSearch} onSearchChange={setPatientSearch} onSearch={loadOptions}
            />
            <input placeholder="患者姓名" value={form.patientName} readOnly className="border rounded px-3 py-1.5 text-sm bg-gray-100" />
            <SearchSelect
              value={form.doctorId} onChange={selectDoctor}
              items={doctors} loading={loadingOpts} placeholder="选择医生"
              searchValue={doctorSearch} onSearchChange={setDoctorSearch} onSearch={loadOptions}
            />
            <select value={form.visitType} onChange={e => setForm({ ...form, visitType: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              {["初诊", "复诊", "急诊"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="病历号" value={form.medicalRecordNo} onChange={e => setForm({ ...form, medicalRecordNo: e.target.value })} className="border rounded px-3 py-1.5 text-sm" />
            <input placeholder="就诊号" value={form.visitNo} onChange={e => setForm({ ...form, visitNo: e.target.value })} className="border rounded px-3 py-1.5 text-sm" />
            <input placeholder="科室" value={form.deptName} readOnly className="border rounded px-3 py-1.5 text-sm bg-gray-100" />
          </div>
          <input placeholder="主诉" value={form.chiefComplaint} onChange={e => setForm({ ...form, chiefComplaint: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <textarea placeholder="现病史" rows={2} value={form.presentIllnessHistory} onChange={e => setForm({ ...form, presentIllnessHistory: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <textarea placeholder="体格检查" rows={2} value={form.physicalExam} onChange={e => setForm({ ...form, physicalExam: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <textarea placeholder="诊断" rows={2} value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <textarea placeholder="治疗方案" rows={2} value={form.treatmentPlan} onChange={e => setForm({ ...form, treatmentPlan: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <textarea placeholder="医嘱/建议" rows={2} value={form.advice} onChange={e => setForm({ ...form, advice: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <button onClick={save} className="bg-green-500 text-white px-6 py-2 rounded text-sm">保存</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">ID</th><th>患者</th><th>就诊类型</th><th>主诉</th><th>诊断</th><th>医生</th><th>科室</th><th>状态</th><th>日期</th></tr></thead>
          <tbody>{records.map(r => (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td>{r.id}</td><td>{r.patientName}</td>
              <td><span className={`px-2 py-0.5 rounded text-xs ${r.visitType === "急诊" ? "bg-red-100 text-red-700" : "bg-pink-100 text-pink-700"}`}>{r.visitType}</span></td>
              <td className="max-w-[200px] truncate">{r.chiefComplaint || "-"}</td>
              <td className="max-w-[200px] truncate">{r.diagnosis || "-"}</td>
              <td>{r.doctorName}</td><td>{r.deptName}</td>
              <td><span className={`px-2 py-0.5 rounded text-xs ${r.status === "完成" ? "bg-green-100 text-green-700" : r.status === "作废" ? "bg-gray-200 text-gray-600" : "bg-yellow-100 text-yellow-700"}`}>{r.status}</span></td>
              <td>{r.visitDate}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function PrescriptionPanel() {
  const [list, setList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  const [form, setForm] = useState({
    patientId: 0, patientName: "", medicalRecordNo: "", visitNo: "",
    doctorId: 0, doctorName: "", deptId: 0, deptName: "", prescriptionType: "西药",
    diagnosis: "", totalAmount: "0", status: "待审核"
  });

  useEffect(() => {
    fetch(`${API}/prescriptions-enhanced${filterStatus ? "?status=" + filterStatus : ""}`)
      .then(r => r.json()).then(d => setList(d.items || []));
  }, [filterStatus]);

  const loadOptions = () => {
    setLoadingOpts(true);
    Promise.all([
      patientService.getAll(patientSearch || undefined),
      doctorService.getAll(doctorSearch || undefined),
      departmentService.getAll(),
    ]).then(([p, d, depts]) => {
      setPatients(Array.isArray(p) ? p : []);
      setDoctors(Array.isArray(d) ? d : []);
      setDepartments(Array.isArray(depts) ? depts : []);
    }).finally(() => setLoadingOpts(false));
  };

  const selectPatient = (id: number, item: Patient) => {
    setForm({ ...form, patientId: id, patientName: item.name || "" });
  };
  const selectDoctor = (id: number, item: Doctor) => {
    const dept = departments.find(dep => dep.name === item.dept);
    setForm({
      ...form, doctorId: id, doctorName: item.name || "",
      deptId: dept?.id || 0, deptName: item.dept || ""
    });
  };

  const save = () => fetch(`${API}/prescriptions-enhanced`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  }).then(r => r.json()).then(d => {
    if (d.success) {
      setShowForm(false);
      fetch(`${API}/prescriptions-enhanced${filterStatus ? "?status=" + filterStatus : ""}`)
        .then(r => r.json()).then(d => setList(d.items || []));
    }
  });

  const refresh = () => fetch(`${API}/prescriptions-enhanced${filterStatus ? "?status=" + filterStatus : ""}`)
    .then(r => r.json()).then(d => setList(d.items || []));

  const updateStatus = (id: number, status: string) => fetch(`${API}/prescriptions-enhanced/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, reviewerId: 1, reviewerName: "药师李" })
  }).then(() => refresh());

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">处方管理</h3>
        <div className="flex gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="">全部状态</option><option>待审核</option><option>已审核</option><option>已发药</option><option>已退费</option>
          </select>
          <button onClick={() => { setShowForm(!showForm); if (!showForm) loadOptions(); }}
            className="bg-pink-500 text-white px-4 py-2 rounded flex items-center gap-1 text-sm">
            <Plus size={16} />开处方
          </button>
        </div>
      </div>
      {showForm && (
        <div className="bg-gray-50 p-4 rounded border space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <SearchSelect
              value={form.patientId} onChange={selectPatient}
              items={patients} loading={loadingOpts} placeholder="选择患者"
              searchValue={patientSearch} onSearchChange={setPatientSearch} onSearch={loadOptions}
            />
            <input placeholder="患者姓名" value={form.patientName} readOnly className="border rounded px-3 py-1.5 text-sm bg-gray-100" />
            <SearchSelect
              value={form.doctorId} onChange={selectDoctor}
              items={doctors} loading={loadingOpts} placeholder="选择医生"
              searchValue={doctorSearch} onSearchChange={setDoctorSearch} onSearch={loadOptions}
            />
            <select value={form.prescriptionType} onChange={e => setForm({ ...form, prescriptionType: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              {["西药", "中药", "草药", "麻醉药品", "精神药品"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="科室(自动)" value={form.deptName} readOnly className="border rounded px-3 py-1.5 text-sm bg-gray-100" />
            <input placeholder="诊断" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} className="border rounded px-3 py-1.5 text-sm" />
            <input placeholder="金额" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} className="border rounded px-3 py-1.5 text-sm" />
          </div>
          <button onClick={save} className="bg-green-500 text-white px-6 py-2 rounded text-sm">保存</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">处方号</th><th>患者</th><th>类型</th><th>诊断</th><th>医生</th><th>金额</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>{list.map(p => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="font-mono text-xs">{p.prescriptionNo}</td><td>{p.patientName}</td><td>{p.prescriptionType}</td>
              <td className="max-w-[150px] truncate">{p.diagnosis || "-"}</td><td>{p.doctorName}</td>
              <td className="text-orange-600">¥{p.totalAmount}</td>
              <td><span className={`px-2 py-0.5 rounded text-xs ${p.status === "已发药" ? "bg-green-100 text-green-700" : p.status === "待审核" ? "bg-yellow-100 text-yellow-700" : p.status === "已退费" ? "bg-red-100 text-red-700" : "bg-pink-100 text-pink-700"}`}>{p.status}</span></td>
              <td>
                {p.status === "待审核" && <button onClick={() => updateStatus(p.id, "已审核")} className="text-pink-500 text-xs mr-2">审核</button>}
                {p.status === "已审核" && <button onClick={() => updateStatus(p.id, "已发药")} className="text-green-500 text-xs mr-2">发药</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function InpatientOrderPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [inpatientSearch, setInpatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  const [form, setForm] = useState({
    inpatientId: 0, patientId: 0, patientName: "", admissionNo: "", bedNo: "",
    orderGroupNo: "", orderType: "长期医嘱", category: "药物", orderContent: "",
    drugName: "", dosage: "", dosageUnit: "", frequency: "qd", route: "口服",
    quantity: null as number | null, unit: "", doctorId: 0, doctorName: "",
    priority: "普通", remark: ""
  });

  useEffect(() => {
    let url = `${API}/inpatient-orders`;
    const params: string[] = [];
    if (filterType) params.push("type=" + filterType);
    if (filterStatus) params.push("status=" + filterStatus);
    if (params.length) url += "?" + params.join("&");
    fetch(url).then(r => r.json()).then(d => setOrders(d.items || []));
  }, [filterType, filterStatus]);

  const loadOptions = () => {
    setLoadingOpts(true);
    Promise.all([
      inpatientService.getAll(),
      doctorService.getAll(doctorSearch || undefined),
    ]).then(([inp, docs]) => {
      const inpatientsList = Array.isArray(inp) ? inp : [];
      if (inpatientSearch) {
        setInpatients(inpatientsList.filter(i =>
          (i.patientName || "").includes(inpatientSearch) ||
          (i.inpatientNo || "").includes(inpatientSearch)
        ));
      } else {
        setInpatients(inpatientsList);
      }
      setDoctors(Array.isArray(docs) ? docs : []);
    }).finally(() => setLoadingOpts(false));
  };

  const selectInpatient = (id: number, item: Inpatient) => {
    setForm({
      ...form, inpatientId: id, patientId: item.patientId || 0,
      patientName: item.patientName || "", admissionNo: item.inpatientNo || "",
      bedNo: item.bedNo || ""
    });
  };
  const selectDoctor = (id: number, item: Doctor) => {
    setForm({ ...form, doctorId: id, doctorName: item.name || "" });
  };

  const refresh = () => {
    let url = `${API}/inpatient-orders`;
    const params: string[] = [];
    if (filterType) params.push("type=" + filterType);
    if (filterStatus) params.push("status=" + filterStatus);
    if (params.length) url += "?" + params.join("&");
    fetch(url).then(r => r.json()).then(d => setOrders(d.items || []));
  };

  const save = () => fetch(`${API}/inpatient-orders`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  }).then(r => r.json()).then(d => { if (d.success) { setShowForm(false); refresh(); } });

  const updateOrder = (id: number, status: string, extra?: Record<string, unknown>) =>
    fetch(`${API}/inpatient-orders/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra })
    }).then(() => refresh());

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">住院医嘱管理</h3>
        <div className="flex gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="">全部类型</option><option>长期医嘱</option><option>临时医嘱</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="">全部状态</option><option>待审核</option><option>已审核</option><option>执行中</option><option>已停止</option>
          </select>
          <button onClick={() => { setShowForm(!showForm); if (!showForm) loadOptions(); }}
            className="bg-pink-500 text-white px-4 py-2 rounded flex items-center gap-1 text-sm">
            <Plus size={16} />开医嘱
          </button>
        </div>
      </div>
      {showForm && (
        <div className="bg-gray-50 p-4 rounded border space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <SearchSelect
              value={form.inpatientId} onChange={selectInpatient}
              items={inpatients} loading={loadingOpts} placeholder="选择住院患者"
              displayKey="patientName"
              searchValue={inpatientSearch} onSearchChange={(v) => { setInpatientSearch(v); loadOptions(); }}
              onSearch={loadOptions}
            />
            <input placeholder="患者姓名" value={form.patientName} readOnly className="border rounded px-3 py-1.5 text-sm bg-gray-100" />
            <input placeholder="床号(自动)" value={form.bedNo} readOnly className="border rounded px-3 py-1.5 text-sm bg-gray-100" />
            <SearchSelect
              value={form.doctorId} onChange={selectDoctor}
              items={doctors} loading={loadingOpts} placeholder="选择医生"
              searchValue={doctorSearch} onSearchChange={setDoctorSearch} onSearch={loadOptions}
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <select value={form.orderType} onChange={e => setForm({ ...form, orderType: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              <option>长期医嘱</option><option>临时医嘱</option>
            </select>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              {["药物", "检查", "检验", "护理", "饮食", "出院", "手术", "其他"].map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              <option>普通</option><option>紧急</option><option>st</option>
            </select>
          </div>
          <textarea placeholder="医嘱内容" rows={2} value={form.orderContent} onChange={e => setForm({ ...form, orderContent: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <div className="grid grid-cols-4 gap-3">
            <input placeholder="药品名称" value={form.drugName} onChange={e => setForm({ ...form, drugName: e.target.value })} className="border rounded px-3 py-1.5 text-sm" />
            <input placeholder="剂量" value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} className="border rounded px-3 py-1.5 text-sm" />
            <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              {["q8h", "q12h", "qd", "bid", "tid", "qid", "prn", "st"].map(f => <option key={f}>{f}</option>)}
            </select>
            <select value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              {["口服", "静脉注射", "肌肉注射", "外用", "吸入", "皮下注射", "其他"].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={save} className="bg-green-500 text-white px-6 py-2 rounded text-sm">保存</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">ID</th><th>患者</th><th>类型</th><th>类别</th><th>内容/药品</th><th>频次/途径</th><th>优先级</th><th>医生</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>{orders.map(o => (
            <tr key={o.id} className="border-b hover:bg-gray-50">
              <td>{o.id}</td>
              <td>{o.patientName}<br /><span className="text-xs text-gray-400">{o.bedNo || ""}</span></td>
              <td><span className={`px-2 py-0.5 rounded text-xs ${o.orderType === "临时医嘱" ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"}`}>{o.orderType}</span></td>
              <td>{o.category}</td>
              <td className="max-w-[180px] truncate">{o.drugName || o.orderContent || "-"}</td>
              <td className="text-xs">{o.dosage ? `${o.dosage}${o.dosageUnit || ""} ` : ""}{o.frequency || ""}{o.route ? ` ${o.route}` : ""}</td>
              <td><span className={`px-1.5 py-0.5 rounded text-xs ${o.priority === "st" ? "bg-red-100 text-red-700" : o.priority === "紧急" ? "bg-orange-100 text-orange-700" : "bg-gray-100"}`}>{o.priority}</span></td>
              <td>{o.doctorName}</td>
              <td><span className={`px-2 py-0.5 rounded text-xs ${o.status === "执行中" ? "bg-green-100 text-green-700" : o.status === "已停止" ? "bg-gray-200 text-gray-600" : o.status === "已作废" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{o.status}</span></td>
              <td>
                {o.status === "待审核" && <button onClick={() => updateOrder(o.id, "已审核")} className="text-pink-500 text-xs mr-1">审核</button>}
                {o.status === "已审核" && <button onClick={() => updateOrder(o.id, "执行中", { nurseId: 1, nurseName: "护士王" })} className="text-green-500 text-xs mr-1">执行</button>}
                {!["已停止", "已作废"].includes(o.status) && <button onClick={() => updateOrder(o.id, "已停止", { stopDoctorId: 1, stopDoctorName: "张医生", stopReason: "医嘱停用" })} className="text-red-500 text-xs">停嘱</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function NursingPanel() {
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [inpatientSearch, setInpatientSearch] = useState("");

  const [form, setForm] = useState({
    inpatientId: 0, patientId: 0, patientName: "", admissionNo: "", bedNo: "",
    recordType: "日常护理", recordLevel: "一级护理", nurseId: 1, nurseName: "护士王",
    vitalSigns: '{"temp":"36.5","pulse":"78","resp":"18","bp":"120/80","spo2":"98"}',
    consciousness: "清醒", diet: "普食", intakeAmount: "", outputAmount: "",
    conditionDescription: "", nursingMeasures: "", healthEducation: "",
    fallRiskScore: 1, pressureInjuryRiskScore: 10, painScore: 0, adlScore: 100,
    signature: "护士王"
  });

  useEffect(() => {
    fetch(`${API}/nursing-records`).then(r => r.json()).then(d => setRecords(d.items || []));
  }, []);

  const loadOptions = () => {
    setLoadingOpts(true);
    inpatientService.getAll().then(inp => {
      const inpatientsList = Array.isArray(inp) ? inp : [];
      if (inpatientSearch) {
        setInpatients(inpatientsList.filter(i =>
          (i.patientName || "").includes(inpatientSearch) ||
          (i.inpatientNo || "").includes(inpatientSearch)
        ));
      } else {
        setInpatients(inpatientsList);
      }
    }).finally(() => setLoadingOpts(false));
  };

  const selectInpatient = (id: number, item: Inpatient) => {
    setForm({
      ...form, inpatientId: id, patientId: item.patientId || 0,
      patientName: item.patientName || "", admissionNo: item.inpatientNo || "",
      bedNo: item.bedNo || ""
    });
  };

  const save = () => fetch(`${API}/nursing-records`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...form, recordTime: new Date().toISOString() })
  }).then(r => r.json()).then(d => {
    if (d.success) {
      setShowForm(false);
      fetch(`${API}/nursing-records`).then(r => r.json()).then(d => setRecords(d.items || []));
    }
  });

  let vitalData: { temp?: string; pulse?: string; resp?: string; bp?: string; spo2?: string } = {};
  try { vitalData = JSON.parse(form.vitalSigns || "{}"); } catch (e) { }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">护理记录管理</h3>
        <button onClick={() => { setShowForm(!showForm); if (!showForm) loadOptions(); }}
          className="bg-pink-500 text-white px-4 py-2 rounded flex items-center gap-1 text-sm">
          <Plus size={16} />新建护理记录
        </button>
      </div>
      {showForm && (
        <div className="bg-gray-50 p-4 rounded border space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <SearchSelect
              value={form.inpatientId} onChange={selectInpatient}
              items={inpatients} loading={loadingOpts} placeholder="选择住院患者"
              displayKey="patientName"
              searchValue={inpatientSearch} onSearchChange={(v) => { setInpatientSearch(v); loadOptions(); }}
              onSearch={loadOptions}
            />
            <input placeholder="患者姓名" value={form.patientName} readOnly className="border rounded px-3 py-1.5 text-sm bg-gray-100" />
            <input placeholder="床号(自动)" value={form.bedNo} readOnly className="border rounded px-3 py-1.5 text-sm bg-gray-100" />
            <select value={form.recordType} onChange={e => setForm({ ...form, recordType: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              {["入院评估", "日常护理", "病情观察", "护理措施", "健康教育", "出院指导", "交接班"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <select value={form.recordLevel} onChange={e => setForm({ ...form, recordLevel: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              {["特级护理", "一级护理", "二级护理", "三级护理"].map(l => <option key={l}>{l}</option>)}
            </select>
            <select value={form.consciousness} onChange={e => setForm({ ...form, consciousness: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              {["清醒", "嗜睡", "昏睡", "浅昏迷", "深昏迷", "谵妄"].map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={form.diet} onChange={e => setForm({ ...form, diet: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              {["普食", "半流质", "流质", "禁食", "低盐低脂", "糖尿病饮食"].map(d => <option key={d}>{d}</option>)}
            </select>
            <input placeholder="疼痛评分(0-10)" type="number" value={form.painScore} onChange={e => setForm({ ...form, painScore: +e.target.value })} className="border rounded px-3 py-1.5 text-sm" />
          </div>
          <div className="grid grid-cols-5 gap-3 bg-pink-50 p-3 rounded">
            <div><label className="text-xs text-gray-500">体温℃</label><input value={vitalData.temp || ""} onChange={e => setForm({ ...form, vitalSigns: JSON.stringify({ ...vitalData, temp: e.target.value }) })} className="w-full border rounded px-2 py-1 text-sm" /></div>
            <div><label className="text-xs text-gray-500">脉搏</label><input value={vitalData.pulse || ""} onChange={e => setForm({ ...form, vitalSigns: JSON.stringify({ ...vitalData, pulse: e.target.value }) })} className="w-full border rounded px-2 py-1 text-sm" /></div>
            <div><label className="text-xs text-gray-500">呼吸</label><input value={vitalData.resp || ""} onChange={e => setForm({ ...form, vitalSigns: JSON.stringify({ ...vitalData, resp: e.target.value }) })} className="w-full border rounded px-2 py-1 text-sm" /></div>
            <div><label className="text-xs text-gray-500">血压</label><input value={vitalData.bp || ""} onChange={e => setForm({ ...form, vitalSigns: JSON.stringify({ ...vitalData, bp: e.target.value }) })} className="w-full border rounded px-2 py-1 text-sm" /></div>
            <div><label className="text-xs text-gray-500">血氧%</label><input value={vitalData.spo2 || ""} onChange={e => setForm({ ...form, vitalSigns: JSON.stringify({ ...vitalData, spo2: e.target.value }) })} className="w-full border rounded px-2 py-1 text-sm" /></div>
          </div>
          <textarea placeholder="病情描述" rows={2} value={form.conditionDescription} onChange={e => setForm({ ...form, conditionDescription: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <textarea placeholder="护理措施" rows={2} value={form.nursingMeasures} onChange={e => setForm({ ...form, nursingMeasures: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <button onClick={save} className="bg-green-500 text-white px-6 py-2 rounded text-sm">保存</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">ID</th><th>患者</th><th>床号</th><th>记录类型</th><th>护理等级</th><th>生命体征</th><th>意识</th><th>护士</th><th>时间</th></tr></thead>
          <tbody>{records.map(n => {
            let vs: { temp?: string; pulse?: string; resp?: string; bp?: string; spo2?: string } = {};
            try { vs = JSON.parse(n.vitalSigns || "{}"); } catch (e) { }
            return (
              <tr key={n.id} className="border-b hover:bg-gray-50">
                <td>{n.id}</td><td>{n.patientName}</td><td>{n.bedNo || "-"}</td>
                <td><span className="px-2 py-0.5 rounded text-xs bg-pink-100 text-pink-700">{n.recordType}</span></td>
                <td><span className={`px-2 py-0.5 rounded text-xs ${n.recordLevel === "特级护理" ? "bg-red-100 text-red-700" : n.recordLevel === "一级护理" ? "bg-orange-100 text-orange-700" : n.recordLevel === "二级护理" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{n.recordLevel}</span></td>
                <td className="text-xs">{Object.keys(vs).length ? `T:${vs.temp || "-"} P:${vs.pulse || "-"} R:${vs.resp || "-"} BP:${vs.bp || "-"} SpO2:${vs.spo2 || "-"}` : "-"}</td>
                <td>{n.consciousness || "-"}</td>
                <td>{n.nurseName}</td>
                <td>{n.recordTime}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

function QualityControlPanel() {
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterTarget, setFilterTarget] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);

  const [form, setForm] = useState({
    qcType: "时限质控", targetType: "门诊病历", targetId: 1, targetNo: "",
    patientId: null as number | null, patientName: "", doctorId: null as number | null,
    doctorName: "", deptId: null as number | null, deptName: "",
    qcItem: "", qcStandard: "", actualValue: "", standardValue: "",
    result: "不合格", score: null as number | null, fullScore: 100,
    problemDescription: "", suggestion: "", qcPersonId: 1, qcPersonName: "质控员陈",
    rectifyDeadline: ""
  });

  useEffect(() => {
    let url = `${API}/quality-control`;
    const params: string[] = [];
    if (filterTarget) params.push("targetType=" + filterTarget);
    if (filterResult) params.push("result=" + filterResult);
    if (params.length) url += "?" + params.join("&");
    fetch(url).then(r => r.json()).then(d => setRecords(d.items || []));
  }, [filterTarget, filterResult]);

  const loadOptions = () => {
    setLoadingOpts(true);
    Promise.all([
      patientService.getAll(),
      doctorService.getAll(),
    ]).then(([p, d]) => {
      setPatients(Array.isArray(p) ? p : []);
      setDoctors(Array.isArray(d) ? d : []);
    }).finally(() => setLoadingOpts(false));
  };

  const refresh = () => {
    let url = `${API}/quality-control`;
    const params: string[] = [];
    if (filterTarget) params.push("targetType=" + filterTarget);
    if (filterResult) params.push("result=" + filterResult);
    if (params.length) url += "?" + params.join("&");
    fetch(url).then(r => r.json()).then(d => setRecords(d.items || []));
  };

  const save = () => fetch(`${API}/quality-control`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  }).then(r => r.json()).then(d => { if (d.success) { setShowForm(false); refresh(); } });

  const updateQC = (id: number, data: Record<string, unknown>) =>
    fetch(`${API}/quality-control/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(() => refresh());

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">病历质控管理</h3>
        <div className="flex gap-2">
          <select value={filterTarget} onChange={e => setFilterTarget(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="">全部对象</option><option>门诊病历</option><option>住院病历</option><option>处方</option><option>医嘱</option><option>护理记录</option>
          </select>
          <select value={filterResult} onChange={e => setFilterResult(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="">全部结果</option><option>合格</option><option>不合格</option><option>待复核</option>
          </select>
          <button onClick={() => { setShowForm(!showForm); if (!showForm) loadOptions(); }}
            className="bg-pink-500 text-white px-4 py-2 rounded flex items-center gap-1 text-sm">
            <Plus size={16} />新增质控
          </button>
        </div>
      </div>
      {showForm && (
        <div className="bg-gray-50 p-4 rounded border space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <select value={form.qcType} onChange={e => setForm({ ...form, qcType: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              {["时限质控", "内涵质控", "运行质控", "终末质控"].map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={form.targetType} onChange={e => setForm({ ...form, targetType: e.target.value })} className="border rounded px-3 py-1.5 text-sm">
              {["门诊病历", "住院病历", "处方", "医嘱", "护理记录"].map(t => <option key={t}>{t}</option>)}
            </select>
            <input placeholder="质控项目" value={form.qcItem} onChange={e => setForm({ ...form, qcItem: e.target.value })} className="border rounded px-3 py-1.5 text-sm" />
            <input placeholder="得分" type="number" value={form.score || ""} onChange={e => setForm({ ...form, score: +e.target.value || null })} className="border rounded px-3 py-1.5 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="目标编号" value={form.targetNo} onChange={e => setForm({ ...form, targetNo: e.target.value })} className="border rounded px-3 py-1.5 text-sm" />
            <input placeholder="患者姓名" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} className="border rounded px-3 py-1.5 text-sm" />
            <input placeholder="医生姓名" value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} className="border rounded px-3 py-1.5 text-sm" />
          </div>
          <input placeholder="质控标准" value={form.qcStandard} onChange={e => setForm({ ...form, qcStandard: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <textarea placeholder="问题描述" rows={2} value={form.problemDescription} onChange={e => setForm({ ...form, problemDescription: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <textarea placeholder="整改建议" rows={2} value={form.suggestion} onChange={e => setForm({ ...form, suggestion: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
          <button onClick={save} className="bg-green-500 text-white px-6 py-2 rounded text-sm">保存</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">ID</th><th>质控类型</th><th>对象</th><th>项目</th><th>结果</th><th>得分</th><th>问题描述</th><th>整改状态</th><th>质控人</th><th>操作</th></tr></thead>
          <tbody>{records.map(q => (
            <tr key={q.id} className="border-b hover:bg-gray-50">
              <td>{q.id}</td>
              <td><span className="px-2 py-0.5 rounded text-xs bg-pink-100 text-pink-700">{q.qcType}</span></td>
              <td><span className="px-2 py-0.5 rounded text-xs bg-pink-100 text-pink-700">{q.targetType}</span></td>
              <td className="max-w-[150px] truncate">{q.qcItem || "-"}</td>
              <td><span className={`px-2 py-0.5 rounded text-xs ${q.result === "合格" ? "bg-green-100 text-green-700" : q.result === "不合格" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{q.result}</span></td>
              <td>{q.score != null ? `${q.score}/${q.fullScore}` : "-"}</td>
              <td className="max-w-[150px] truncate">{q.problemDescription || "-"}</td>
              <td><span className={`px-2 py-0.5 rounded text-xs ${q.rectifyStatus === "已完成" ? "bg-green-100 text-green-700" : q.rectifyStatus === "逾期" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{q.rectifyStatus}</span></td>
              <td>{q.qcPersonName}</td>
              <td>
                {q.rectifyStatus === "待整改" && <button onClick={() => updateQC(q.id, { rectifyStatus: "整改中" })} className="text-pink-500 text-xs mr-1">整改</button>}
                {q.rectifyStatus === "整改中" && <button onClick={() => updateQC(q.id, { rectifyStatus: "已完成", rectifyResult: "已完成整改", verifyPersonId: 1, verifyPersonName: "质控员陈" })} className="text-green-500 text-xs mr-1">完成</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

export default function MedicalCoreService() {
  const [activeTab, setActiveTab] = useState("medical-record");
  const tabs = [
    { key: "medical-record", label: "门诊病历", icon: FileText },
    { key: "prescription", label: "处方管理", icon: Pill },
    { key: "inpatient-order", label: "住院医嘱", icon: ClipboardList },
    { key: "nursing", label: "护理记录", icon: Heart },
    { key: "quality-control", label: "病历质控", icon: ShieldCheck },
  ];
  return (
    <div className="theme-unified-page p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope size={24} className="text-pink-600" />
        <h1 className="text-2xl font-bold">医疗业务核心</h1>
      </div>
      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-pink-500 text-pink-600" : "border-transparent hover:text-gray-700"}`}>
            <tab.icon size={16} />{tab.label}
          </button>
        ))}
      </div>
      {activeTab === "medical-record" && <MedicalRecordPanel />}
      {activeTab === "prescription" && <PrescriptionPanel />}
      {activeTab === "inpatient-order" && <InpatientOrderPanel />}
      {activeTab === "nursing" && <NursingPanel />}
      {activeTab === "quality-control" && <QualityControlPanel />}
    </div>
  );
}
