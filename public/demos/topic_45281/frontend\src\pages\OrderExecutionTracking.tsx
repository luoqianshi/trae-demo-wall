import React, { useState, useEffect } from "react";
import { ClipboardList, Search, Loader2, Plus, X, CheckCircle2, Clock, AlertTriangle, FileText, User, Microscope, Pill, Activity, Hash, ArrowRight } from "lucide-react";
import { orderExecutionService, specimenService, examinationReportService, treatmentExecutionService, patientService } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";

const OrderExecutionTracking: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "specimens" | "reports" | "treatment">("orders");

  const [orders, setOrders] = useState<any[]>([]);
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  const [searchPatientId, setSearchPatientId] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (activeTab === "orders") loadOrders();
    else if (activeTab === "specimens") loadSpecimens();
    else if (activeTab === "reports") loadReports();
    else if (activeTab === "treatment") loadTreatments();
  }, [activeTab, searchPatientId, statusFilter]);

  const loadPatients = async () => {
    try {
      const res = await fetch("/api/patients?size=99999");
      const json = await res.json();
      setPatients(json.patients || []);
    } catch (e) { console.error(e); }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderExecutionService.getAll({
        patientId: searchPatientId ? parseInt(searchPatientId) : undefined,
        status: statusFilter || undefined,
      });
      setOrders(data);
    } finally { setLoading(false); }
  };

  const loadSpecimens = async () => {
    setLoading(true);
    try {
      const data = await specimenService.getAll({
        patientId: searchPatientId ? parseInt(searchPatientId) : undefined,
        status: statusFilter || undefined,
      });
      setSpecimens(data);
    } finally { setLoading(false); }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await examinationReportService.getAll({
        patientId: searchPatientId ? parseInt(searchPatientId) : undefined,
      });
      setReports(data);
    } finally { setLoading(false); }
  };

  const loadTreatments = async () => {
    setLoading(true);
    try {
      const data = await treatmentExecutionService.getAll({
        patientId: searchPatientId ? parseInt(searchPatientId) : undefined,
        status: statusFilter || undefined,
      });
      setTreatments(data);
    } finally { setLoading(false); }
  };

  const handleSearchPatient = async () => {
    if (!searchKeyword.trim()) return;
    try {
      const res = await fetch(`/api/patients?keyword=${encodeURIComponent(searchKeyword)}`);
      const json = await res.json();
      const results = json.patients || json || [];
      setSearchResults(Array.isArray(results) ? results : []);
      setShowSearchResults(true);
    } catch (e) { console.error(e); }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setSearchPatientId(String(patient.id));
    setSearchKeyword(patient.name);
    setShowSearchResults(false);
  };

  const openDialog = (type: string, data?: any) => {
    setDialogType(type);
    setFormData(data || getDefaultForm(type));
    setShowDialog(true);
  };

  const getDefaultForm = (type: string) => {
    switch (type) {
      case "order":
        return { executionNo: `EO${Date.now()}`, orderId: 0, orderType: "prescription", patientId: selectedPatient?.id || 0,
          patientName: selectedPatient?.name || "", deptId: 0, deptName: "", doctorId: user?.relateId || 0,
          doctorName: user?.name || "", executionType: "drug", executorId: user?.id, executorName: user?.name };
      case "specimen":
        return { barcode: `S${Date.now()}`, orderId: 0, patientId: selectedPatient?.id || 0, patientName: selectedPatient?.name || "",
          specimenType: "blood", specimenName: "", collectionMethod: "venous", collectorName: user?.name || "",
          bodyPart: "", container: "vacuum_tube" };
      case "report":
        return { reportNo: `R${Date.now()}`, orderId: 0, patientId: selectedPatient?.id || 0, patientName: selectedPatient?.name || "",
          examinationId: 0, examinationName: "", examinationType: "lab", reporterId: user?.id, reporterName: user?.name };
      case "treatment":
        return { executionNo: `T${Date.now()}`, orderId: 0, patientId: selectedPatient?.id || 0, patientName: selectedPatient?.name || "",
          treatmentName: "", treatmentType: "physiotherapy", deptId: 0, deptName: "", treatmentLocation: "",
          scheduledDate: new Date().toISOString().split("T")[0], scheduledTimeSlot: "上午", executorId: user?.id, executorName: user?.name };
      default: return {};
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      switch (dialogType) {
        case "order": result = await orderExecutionService.add(formData); break;
        case "specimen": result = await specimenService.add(formData); break;
        case "report": result = await examinationReportService.add(formData); break;
        case "treatment": result = await treatmentExecutionService.add(formData); break;
      }
      if (result?.success || result?.id) {
        setShowDialog(false);
        if (activeTab === "orders") loadOrders();
        else if (activeTab === "specimens") loadSpecimens();
        else if (activeTab === "reports") loadReports();
        else if (activeTab === "treatment") loadTreatments();
      }
    } catch (e) { console.error("保存失败:", e); } finally { setSaving(false); }
  };

  const handleUpdateStatus = async (type: string, id: number, status: string, result?: string) => {
    try {
      if (type === "order") {
        await orderExecutionService.update({ id, executionStatus: status, executorId: user?.id, executorName: user?.name, executionResult: result });
      } else if (type === "specimen") {
        await specimenService.update({ id, status, receiverName: user?.name, testerName: user?.name });
      } else if (type === "report") {
        await examinationReportService.update({ id, reportStatus: status, reportContent: result, reporterId: user?.id, reporterName: user?.name });
      } else if (type === "treatment") {
        await treatmentExecutionService.update({ id, executionStatus: status, executorId: user?.id, executorName: user?.name, executionResult: result });
      }
      loadOrders();
      loadSpecimens();
      loadReports();
      loadTreatments();
    } catch (e) { console.error(e); }
  };

  const tabs = [
    { key: "orders", label: "医嘱执行", icon: ClipboardList },
    { key: "specimens", label: "标本管理", icon: Microscope },
    { key: "reports", label: "检查报告", icon: FileText },
    { key: "treatment", label: "治疗执行", icon: Activity },
  ];

  const renderSearchBar = () => (
    <div className="flex gap-3 items-center">
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="搜索患者姓名..."
          value={searchKeyword}
          onChange={(e) => { setSearchKeyword(e.target.value); setShowSearchResults(false); }}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
            {searchResults.map(p => (
              <div key={p.id} onClick={() => handleSelectPatient(p)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={14} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.gender} | {p.phone || "无电话"} | {p.hospitalId || "无ID"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={handleSearchPatient} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 flex items-center gap-1">
        <Search size={14} /> 查询
      </button>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
        <option value="">全部状态</option>
        <option value="pending">待执行</option>
        <option value="in_progress">执行中</option>
        <option value="completed">已完成</option>
        <option value="cancelled">已取消</option>
      </select>
      {selectedPatient && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl text-sm">
          <User size={14} className="text-blue-500" />
          <span className="text-blue-700">{selectedPatient.name}</span>
          <button onClick={() => { setSelectedPatient(null); setSearchPatientId(""); setSearchKeyword(""); }} className="text-blue-400 hover:text-red-500"><X size={14} /></button>
        </div>
      )}
    </div>
  );

  const renderOrdersTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">医嘱执行记录</h2>
        <button onClick={() => openDialog("order")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm flex items-center gap-1">
          <Plus size={14} /> 新建医嘱执行
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-600">执行编号</th>
              <th className="text-left py-3 px-2 text-gray-600">患者</th>
              <th className="text-left py-3 px-2 text-gray-600">医嘱类型</th>
              <th className="text-left py-3 px-2 text-gray-600">执行类型</th>
              <th className="text-left py-3 px-2 text-gray-600">科室</th>
              <th className="text-left py-3 px-2 text-gray-600">执行人</th>
              <th className="text-left py-3 px-2 text-gray-600">状态</th>
              <th className="text-left py-3 px-2 text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium">{o.execution_no}</td>
                <td className="py-3 px-2">{o.patient_name}</td>
                <td className="py-3 px-2">{o.order_type === "prescription" ? "处方" : o.order_type === "examination" ? "检查" : "检验"}</td>
                <td className="py-3 px-2">{o.execution_type}</td>
                <td className="py-3 px-2">{o.dept_name}</td>
                <td className="py-3 px-2">{o.executor_name || "-"}</td>
                <td className="py-3 px-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    o.execution_status === "completed" ? "bg-green-100 text-green-700" :
                    o.execution_status === "in_progress" ? "bg-blue-100 text-blue-700" :
                    o.execution_status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {o.execution_status === "pending" ? "待执行" : o.execution_status === "in_progress" ? "执行中" :
                     o.execution_status === "completed" ? "已完成" : "已取消"}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-1">
                    {o.execution_status === "pending" && (
                      <button onClick={() => handleUpdateStatus("order", o.id, "in_progress")} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs">开始</button>
                    )}
                    {o.execution_status === "in_progress" && (
                      <button onClick={() => handleUpdateStatus("order", o.id, "completed", "执行完成")} className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs">完成</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">暂无医嘱执行记录</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSpecimensTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">标本管理（LIS对接）</h2>
        <button onClick={() => openDialog("specimen")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm flex items-center gap-1">
          <Plus size={14} /> 新增标本
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-600">条码</th>
              <th className="text-left py-3 px-2 text-gray-600">患者</th>
              <th className="text-left py-3 px-2 text-gray-600">标本类型</th>
              <th className="text-left py-3 px-2 text-gray-600">标本名称</th>
              <th className="text-left py-3 px-2 text-gray-600">采集方法</th>
              <th className="text-left py-3 px-2 text-gray-600">采集人</th>
              <th className="text-left py-3 px-2 text-gray-600">状态</th>
              <th className="text-left py-3 px-2 text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {specimens.map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-mono text-xs">{s.barcode}</td>
                <td className="py-3 px-2">{s.patient_name}</td>
                <td className="py-3 px-2">{s.specimen_type === "blood" ? "血液" : s.specimen_type === "urine" ? "尿液" : s.specimen_type === "stool" ? "粪便" : "其他"}</td>
                <td className="py-3 px-2">{s.specimen_name}</td>
                <td className="py-3 px-2">{s.collection_method}</td>
                <td className="py-3 px-2">{s.collector_name}</td>
                <td className="py-3 px-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    s.status === "completed" ? "bg-green-100 text-green-700" :
                    s.status === "testing" ? "bg-blue-100 text-blue-700" :
                    s.status === "received" ? "bg-purple-100 text-purple-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {s.status === "collected" ? "已采集" : s.status === "received" ? "已接收" :
                     s.status === "testing" ? "检测中" : "已完成"}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-1">
                    {s.status === "collected" && (
                      <button onClick={() => handleUpdateStatus("specimen", s.id, "received")} className="px-2 py-1 bg-purple-500 text-white rounded-lg text-xs">接收</button>
                    )}
                    {s.status === "received" && (
                      <button onClick={() => handleUpdateStatus("specimen", s.id, "testing")} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs">上机</button>
                    )}
                    {s.status === "testing" && (
                      <button onClick={() => handleUpdateStatus("specimen", s.id, "completed")} className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs">完成</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {specimens.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">暂无标本数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">检查检验报告（RIS/PACS对接）</h2>
        <button onClick={() => openDialog("report")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm flex items-center gap-1">
          <Plus size={14} /> 新建报告
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-600">报告编号</th>
              <th className="text-left py-3 px-2 text-gray-600">患者</th>
              <th className="text-left py-3 px-2 text-gray-600">检查项目</th>
              <th className="text-left py-3 px-2 text-gray-600">检查类型</th>
              <th className="text-left py-3 px-2 text-gray-600">报告人</th>
              <th className="text-left py-3 px-2 text-gray-600">异常标记</th>
              <th className="text-left py-3 px-2 text-gray-600">状态</th>
              <th className="text-left py-3 px-2 text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium">{r.report_no}</td>
                <td className="py-3 px-2">{r.patient_name}</td>
                <td className="py-3 px-2">{r.examination_name}</td>
                <td className="py-3 px-2">{r.examination_type === "lab" ? "检验" : "影像"}</td>
                <td className="py-3 px-2">{r.reporter_name || "-"}</td>
                <td className="py-3 px-2">
                  {r.is_abnormal ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                      <AlertTriangle size={10} /> 异常
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">正常</span>
                  )}
                </td>
                <td className="py-3 px-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    r.report_status === "final" ? "bg-green-100 text-green-700" :
                    r.report_status === "verified" ? "bg-blue-100 text-blue-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {r.report_status === "draft" ? "草稿" : r.report_status === "verified" ? "已审核" : "已签发"}
                  </span>
                </td>
                <td className="py-3 px-2">
                  {r.report_status === "draft" && (
                    <button onClick={() => handleUpdateStatus("report", r.id, "verified", "报告审核通过")} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs">审核</button>
                  )}
                  {r.report_status === "verified" && (
                    <button onClick={() => handleUpdateStatus("report", r.id, "final", "报告签发")} className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs">签发</button>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">暂无报告数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTreatmentTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">治疗执行管理</h2>
        <button onClick={() => openDialog("treatment")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm flex items-center gap-1">
          <Plus size={14} /> 新建治疗
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-600">执行编号</th>
              <th className="text-left py-3 px-2 text-gray-600">患者</th>
              <th className="text-left py-3 px-2 text-gray-600">治疗名称</th>
              <th className="text-left py-3 px-2 text-gray-600">治疗类型</th>
              <th className="text-left py-3 px-2 text-gray-600">治疗位置</th>
              <th className="text-left py-3 px-2 text-gray-600">预约日期</th>
              <th className="text-left py-3 px-2 text-gray-600">执行人</th>
              <th className="text-left py-3 px-2 text-gray-600">状态</th>
              <th className="text-left py-3 px-2 text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {treatments.map(t => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium">{t.execution_no}</td>
                <td className="py-3 px-2">{t.patient_name}</td>
                <td className="py-3 px-2">{t.treatment_name}</td>
                <td className="py-3 px-2">{t.treatment_type === "physiotherapy" ? "理疗" : t.treatment_type === "acupuncture" ? "针灸" : t.treatment_type === "massage" ? "推拿" : "其他"}</td>
                <td className="py-3 px-2">{t.treatment_location || "-"}</td>
                <td className="py-3 px-2 text-gray-500">{t.scheduled_date}</td>
                <td className="py-3 px-2">{t.executor_name || "-"}</td>
                <td className="py-3 px-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    t.execution_status === "completed" ? "bg-green-100 text-green-700" :
                    t.execution_status === "in_progress" ? "bg-blue-100 text-blue-700" :
                    t.execution_status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {t.execution_status === "pending" ? "待执行" : t.execution_status === "in_progress" ? "执行中" :
                     t.execution_status === "completed" ? "已完成" : "已取消"}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-1">
                    {t.execution_status === "pending" && (
                      <button onClick={() => handleUpdateStatus("treatment", t.id, "in_progress")} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs">开始</button>
                    )}
                    {t.execution_status === "in_progress" && (
                      <button onClick={() => handleUpdateStatus("treatment", t.id, "completed", "治疗完成")} className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs">完成</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {treatments.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-gray-400">暂无治疗记录</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDialog = () => {
    if (!showDialog) return null;
    const fieldsMap: Record<string, any[]> = {
      order: [
        { label: "执行编号", key: "executionNo" },
        { label: "患者姓名", key: "patientName" },
        { label: "医嘱类型", key: "orderType", type: "select", options: [{ v: "prescription", l: "处方" }, { v: "examination", l: "检查" }, { v: "lab", l: "检验" }] },
        { label: "执行类型", key: "executionType" },
        { label: "科室名称", key: "deptName" },
        { label: "医生姓名", key: "doctorName" },
      ],
      specimen: [
        { label: "条码", key: "barcode" },
        { label: "患者姓名", key: "patientName" },
        { label: "标本类型", key: "specimenType", type: "select", options: [{ v: "blood", l: "血液" }, { v: "urine", l: "尿液" }, { v: "stool", l: "粪便" }, { v: "other", l: "其他" }] },
        { label: "标本名称", key: "specimenName" },
        { label: "采集方法", key: "collectionMethod" },
        { label: "采集部位", key: "bodyPart" },
      ],
      report: [
        { label: "报告编号", key: "reportNo" },
        { label: "患者姓名", key: "patientName" },
        { label: "检查项目", key: "examinationName" },
        { label: "检查类型", key: "examinationType", type: "select", options: [{ v: "lab", l: "检验" }, { v: "image", l: "影像" }] },
      ],
      treatment: [
        { label: "执行编号", key: "executionNo" },
        { label: "患者姓名", key: "patientName" },
        { label: "治疗名称", key: "treatmentName" },
        { label: "治疗类型", key: "treatmentType", type: "select", options: [{ v: "physiotherapy", l: "理疗" }, { v: "acupuncture", l: "针灸" }, { v: "massage", l: "推拿" }, { v: "other", l: "其他" }] },
        { label: "治疗位置", key: "treatmentLocation" },
        { label: "预约日期", key: "scheduledDate", type: "date" },
        { label: "预约时段", key: "scheduledTimeSlot", type: "select", options: [{ v: "上午", l: "上午" }, { v: "下午", l: "下午" }] },
        { label: "科室名称", key: "deptName" },
      ],
    };

    const fields = fieldsMap[dialogType] || [];
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {dialogType === "order" ? "新建医嘱执行" : dialogType === "specimen" ? "新增标本" :
               dialogType === "report" ? "新建报告" : "新建治疗"}
            </h3>
            <button onClick={() => setShowDialog(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                {f.type === "select" ? (
                  <select value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                    {f.options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : (
                  <input type={f.type || "text"} value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowDialog(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">取消</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              保存
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">医嘱执行跟踪系统</h1>
          <p className="text-sm text-gray-500 mt-1">医嘱执行 → 标本采集（LIS）→ 检查报告（RIS/PACS）→ 治疗执行，全流程闭环管控</p>
        </div>
      </div>

      <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? "bg-blue-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {renderSearchBar()}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      )}

      {activeTab === "orders" && renderOrdersTab()}
      {activeTab === "specimens" && renderSpecimensTab()}
      {activeTab === "reports" && renderReportsTab()}
      {activeTab === "treatment" && renderTreatmentTab()}

      {renderDialog()}
    </div>
  );
};

export default OrderExecutionTracking;