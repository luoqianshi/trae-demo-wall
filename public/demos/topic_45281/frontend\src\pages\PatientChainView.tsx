import React, { useState, useEffect, useCallback } from "react";
import {
  User, FileText, Pill, Bed, ClipboardList, Heart, DollarSign,
  Search, ChevronRight, ChevronDown, ChevronUp, Activity,
  AlertTriangle, Shield, Clock, CheckCircle2, XCircle,
  ArrowRightLeft, Home, Stethoscope, Syringe, Calendar,
  Phone, MapPin, CreditCard, Eye, Loader2,
} from "lucide-react";
import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ClinicalAttachmentPanel from "@/components/business/ClinicalAttachmentPanel";
import { clinicalAttachmentService } from "@/lib/services";

const API = "/api";

type PatientInfo = Record<string, unknown>;
type OutpatientRecord = Record<string, unknown> & { prescriptions?: Prescription[] };
type Prescription = Record<string, unknown> & { details?: Record<string, unknown>[], examinations?: Record<string, unknown>[] };
type Admission = Record<string, unknown> & { orders?: Record<string, unknown>[], nursingRecords?: Record<string, unknown>[], charges?: Record<string, unknown>[], qualityControls?: Record<string, unknown>[] };
type ChargeRecord = Record<string, unknown>;
type ChainData = {
  patient: PatientInfo | null;
  outpatientRecords: OutpatientRecord[];
  inpatientAdmissions: Admission[];
  allCharges: ChargeRecord[];
};

const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
  "完成": { color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  "进行中": { color: "bg-pink-100 text-pink-800", icon: <Activity className="h-3 w-3" /> },
  "已发药": { color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  "待审核": { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  "执行中": { color: "bg-pink-100 text-pink-800", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  "在院": { color: "bg-red-100 text-red-800", icon: <Bed className="h-3 w-3" /> },
  "已出院": { color: "bg-gray-100 text-gray-800", icon: <Home className="h-3 w-3" /> },
  "paid": { color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  "合格": { color: "bg-green-100 text-green-800", icon: <Shield className="h-3 w-3" /> },
  "不合格": { color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] || { color: "bg-gray-100 text-gray-800", icon: null };
  return <Badge className={s.color}>{s.icon} {status}</Badge>;
}

function SectionCard({ title, icon, children, defaultOpen = true, badge }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="mb-3">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2 font-semibold text-sm">{icon}{title}{badge}</div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
      {open && <CardSection>{children}</CardSection>}
    </Card>
  );
}

export default function PatientChainView() {
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [chainData, setChainData] = useState<ChainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "outpatient" | "inpatient" | "finance">("overview");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/patients`).then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : (Array.isArray(d.patients) ? d.patients : (Array.isArray(d.items) ? d.items : []));
      setPatients(list);
    }).catch(() => {});
  }, []);

  const loadChain = useCallback(async (pid: number) => {
    setLoading(true);
    setSelectedId(pid);
    try {
      const res = await fetch(`${API}/patient-chain/${pid}`);
      const json = await res.json();
      if (json.success) setChainData(json.data);
      else setChainData(null);
      setPhotoUrl(null);
      try {
        const photos = await clinicalAttachmentService.getByPatient({ patientId: pid, attachmentType: "patient_photo" });
        const latestPhoto = Array.isArray(photos) ? photos.find((item: any) => item.file?.fileUuid) : null;
        setPhotoUrl(latestPhoto?.file?.fileUuid ? clinicalAttachmentService.fileUrl(latestPhoto.file.fileUuid) : null);
      } catch {
        setPhotoUrl(null);
      }
    } catch { setChainData(null); }
    setLoading(false);
  }, []);

  const filteredPatients = patients.filter((p: PatientInfo) =>
    !search || String(p.name || "").includes(search) || String(p.medicalRecordNo || p.medical_record_no || "").includes(search) || String(p.phone || "").includes(search)
  );

  const p = chainData?.patient as PatientInfo | undefined;
  const outRecords = chainData?.outpatientRecords as OutpatientRecord[] || [];
  const admissions = chainData?.inpatientAdmissions as Admission[] || [];
  const allCharges = chainData?.allCharges as ChargeRecord[] || [];

  const totalSpent = allCharges.reduce((sum: number, c: ChargeRecord) => sum + (Number(c.totalAmount) || 0), 0);
  const totalPaid = allCharges.reduce((sum: number, c: ChargeRecord) => sum + (Number(c.actualAmount) || 0), 0);

  if (!selectedId || !chainData) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Card><CardHeader title="患者全链路视图 / PATIENT CHAIN VIEW" /></Card>
        <Card>
          <CardSection className="space-y-4">
            <div className="text-center text-gray-500 mb-4">
              <User className="h-16 w-16 mx-auto mb-2 opacity-30" />
              <p className="text-lg">选择一位患者，查看其完整就诊链路</p>
              <p className="text-sm mt-1">挂号 → 门诊病历 → 处方 → 检查 → 收费 → (住院?) → 床位 → 医嘱 → 护理 → 费用</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="搜索患者姓名 / 病历号 / 手机号..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
              {filteredPatients.map((pt: PatientInfo) => (
                <button key={String(pt.id || "")} onClick={() => loadChain(Number(pt.id))}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:border-pink-400 hover:bg-pink-50 transition-all text-left group">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0 group-hover:bg-pink-200">
                    <User className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{String(pt.name || "-")}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {String(pt.gender || "-")} · {String(pt.age || "-")}岁 · {String(pt.medicalRecordNo || pt.medical_record_no || "")}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{String(pt.phone || "")} · {String(pt.insuranceType || pt.insurance_type || "自费")}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 self-center shrink-0 group-hover:text-pink-500" />
                </button>
              ))}
            </div>
            {filteredPatients.length === 0 && <div className="text-center text-gray-400 py-8">未找到匹配的患者</div>}
          </CardSection>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-3">
      {/* 顶部导航栏 */}
      <div className="flex items-center gap-3 flex-wrap sticky top-0 z-10 bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setChainData(null); }}>
          <ArrowRightLeft className="h-4 w-4 mr-1" />切换患者
        </Button>
        <div className="h-6 w-px bg-gray-300" />
        <div className="flex items-center gap-2 font-bold text-lg">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-pink-100 flex items-center justify-center">
            {photoUrl ? <img src={photoUrl} alt="患者照片" className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-pink-600" />}
          </div>
          {String(p?.name || "")}
        </div>
        <Badge variant="outline">{String(p?.medicalRecordNo || p?.medical_record_no || "")}</Badge>
        <Badge className={String(p?.gender) === "男" ? "bg-pink-50 text-pink-700" : "bg-pink-50 text-pink-700"}>
          {String(p?.gender || "")} · {String(p?.age || "")}岁
        </Badge>
        {[
          { key: "overview", label: "总览", icon: <Eye className="h-3 w-3" />, count: `${outRecords.length}门诊 ${admissions.length}住院` },
          { key: "outpatient", label: "门诊链路", icon: <Stethoscope className="h-3 w-3" />, count: String(outRecords.length) },
          { key: "inpatient", label: "住院链路", icon: <Bed className="h-3 w-3" />, count: String(admissions.length) },
          { key: "finance", label: "费用汇总", icon: <DollarSign className="h-3 w-3" />, count: `¥${totalPaid.toFixed(2)}` },
        ].map(tab => (
          <Button key={tab.key} size="sm" variant={activeView === tab.key ? "default" : "ghost"}
            onClick={() => setActiveView(tab.key as typeof activeView)}>
            {tab.icon} {tab.label} <span className="ml-1 text-xs opacity-70">({tab.count})</span>
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-pink-500" /></div>
      ) : activeView === "overview" ? (
        <>
          {/* 基本信息卡片 */}
          <SectionCard title="基本信息" icon={<User className="h-4 w-4" />} badge={<Badge variant="outline">ID:{String(p?.id || "")}</Badge>}>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
              {[["姓名", p?.name], ["性别", p?.gender], ["年龄", p?.age ? `${p?.age}岁` : ""],
                ["身份证", p?.idCard || p?.id_card], ["电话", p?.phone], ["地址", p?.address],
                ["医保类型", p?.insuranceType || p?.insurance_type], ["医保号", p?.medicalInsuranceNo || p?.medical_insurance_no], ["过敏史", p?.allergyHistory || p?.allergy_history],
                ["职业", p?.occupation], ["婚姻状况", p?.maritalStatus || p?.marital_status], ["合同单位", p?.contractUnit || p?.contract_unit]].map(([label, val]: [string, unknown]) =>
                <div key={String(label)}><div className="text-gray-400 text-xs">{label}</div><div className="font-medium truncate" title={String(val || "")}>{String(val || "-")}</div></div>)}
            </div>
          </SectionCard>

          <ClinicalAttachmentPanel
            patientId={Number(p?.id || selectedId)}
            compact
            title="患者图片与临床附件"
          />

          {/* 就诊时间线 */}
          {(outRecords.length > 0 || admissions.length > 0) && (
            <SectionCard title="就诊时间线" icon={<Clock className="h-4 w-4" />} badge={<Badge>{outRecords.length + admissions.length}条记录</Badge>}>
              <div className="space-y-2 relative before:absolute before:left-4 before:top-6 before:bottom-2 before:w-0.5 before:bg-pink-200">
                {outRecords.map((omr: OutpatientRecord, i: number) => (
                  <div key={`o-${i}`} className="relative pl-10 pb-3">
                    <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs z-10">
                      <FileText className="h-3 w-3" />
                    </div>
                    <div className="border rounded-lg p-3 bg-white hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setActiveView("outpatient")}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-pink-700">门诊就诊 #{String(omr.visitNo || omr.id)}</span>
                        <StatusBadge status={String(omr.status || "")} />
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                        <span><Calendar className="h-3 w-3 inline mr-0.5" />{String(omr.visitDate || "")}</span>
                        <span><Stethoscope className="h-3 w-3 inline mr-0.5" />{String(omr.doctorName || "")}·{String(omr.deptName || "")}</span>
                        <span>{String(omr.visitType || "")}</span>
                      </div>
                      <div className="text-xs mt-1 text-gray-600 truncate">主诉：{String(omr.chiefComplaint || "-")}</div>
                      {(omr.prescriptions?.length || 0) > 0 && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {omr.prescriptions!.map((pr: Prescription, j: number) => (
                            <Badge key={j} variant="outline" className="text-xs"><Pill className="h-3 w-3 mr-0.5" />处方#{String(pr.prescriptionNo || pr.id)} ¥{String(pr.totalAmount || 0)} <StatusBadge status={String(pr.status || "")} /></Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {/* 住院记录 */}
                {admissions.map((adm: Admission, i: number) => (
                  <div key={`a-${i}`} className="relative pl-10 pb-3">
                    <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs z-10">
                      <Bed className="h-3 w-3" />
                    </div>
                    <div className="border rounded-lg p-3 bg-red-50/50 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setActiveView("inpatient")}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-red-700">住院 #{String(adm.admissionNo || adm.id)}</span>
                        <StatusBadge status={String(adm.status || "")} />
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                        <span><Calendar className="h-3 w-3 inline mr-0.5" />{String(adm.admissionDate || "")}</span>
                        <span><Bed className="h-3 w-3 inline mr-0.5" />床{String(adm.bedNo || "")}({String(adm.bedType || "")})</span>
                        <span>{String(adm.deptName || "")}·{String(adm.wardName || "")}</span>
                        <span>{String(adm.attendingDoctorName || "")}</span>
                      </div>
                      <div className="text-xs mt-1 text-gray-600">诊断：{String(adm.admissionDiagnosis || "-")} | 护理等级：{String(adm.nursingLevel || "")}</div>
                      <div className="text-xs mt-1 flex gap-3 text-gray-500">
                        <span>预交金 ¥{String(adm.deposit || 0)}</span>
                        <span>总费用 ¥{String(adm.totalCost || 0)}</span>
                        <span>医嘱{(adm.orders?.length || 0)}条</span>
                        <span>护理记录{(adm.nursingRecords?.length || 0)}条</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* 费用汇总 */}
          <SectionCard title="费用汇总" icon={<DollarSign className="h-4 w-4" />}
            badge={<span className="text-sm font-bold text-red-600">实付 ¥{totalPaid.toFixed(2)}</span>}>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-pink-50 rounded-lg p-3"><div className="text-xs text-gray-500">总费用</div><div className="text-xl font-bold text-pink-700">¥{totalSpent.toFixed(2)}</div></div>
              <div className="bg-green-50 rounded-lg p-3"><div className="text-xs text-gray-500">已支付</div><div className="text-xl font-bold text-green-700">¥{totalPaid.toFixed(2)}</div></div>
              <div className="bg-orange-50 rounded-lg p-3"><div className="text-xs text-gray-500">收费笔数</div><div className="text-xl font-bold text-orange-700">{allCharges.length}</div></div>
            </div>
            {allCharges.slice(0, 5).map((c: ChargeRecord, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b text-sm last:border-0">
                <div><Badge variant="outline" className="mr-2">{String(c.chargeNo || "")}</Badge>{String(c.chargeType || "")}</div>
                <div className="flex items-center gap-2"><span className="font-mono font-bold">¥{String(c.totalAmount || 0)}</span><StatusBadge status={String(c.status || "")} /></div>
              </div>
            ))}
          </SectionCard>
        </>
      ) : activeView === "outpatient" ? (
        <>
          <Button variant="ghost" size="sm" onClick={() => setActiveView("overview")} className="mb-2"><ChevronLeft className="h-4 w-4 mr-1" />返回总览</Button>
          {outRecords.length === 0 ? (
            <Card><CardSection className="py-12 text-center text-gray-400">暂无门诊记录</CardSection></Card>
          ) : outRecords.map((omr: OutpatientRecord, oi: number) => (
            <SectionCard key={oi} title={`门诊 #${String(omr.visitNo || omr.id)}`} icon={<FileText className="h-4 w-4" />}
              badge={<StatusBadge status={String(omr.status || "")} />} defaultOpen={oi === 0}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm bg-gray-50 p-3 rounded-lg">
                <div><span className="text-gray-400 text-xs">就诊日期</span><div className="font-medium">{String(omr.visitDate || "")}</div></div>
                <div><span className="text-gray-400 text-xs">医生</span><div className="font-medium">{String(omr.doctorName || "")}</div></div>
                <div><span className="text-gray-400 text-xs">科室</span><div className="font-medium">{String(omr.deptName || "")}</div></div>
                <div><span className="text-gray-400 text-xs">类型</span><div className="font-medium">{String(omr.visitType || "")}</div></div>
              </div>
              <div className="mb-2 text-sm"><span className="text-gray-400">主诉：</span>{String(omr.chiefComplaint || "-")}</div>
              <div className="mb-3 text-sm"><span className="text-gray-400">诊断：</span>{String(omr.diagnosis || "-")}</div>

              {/* 处方列表 */}
              {(omr.prescriptions?.length || 0) > 0 && (
                <div className="space-y-2 mt-3">
                  <div className="text-sm font-semibold flex items-center gap-1"><Pill className="h-4 w-4" />关联处方 ({omr.prescriptions!.length})</div>
                  {omr.prescriptions!.map((pr: Prescription, pi: number) => (
                    <div key={pi} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 text-sm">
                        <span className="font-medium">处方 #{String(pr.prescriptionNo || pr.id)}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-pink-600">¥{String(pr.totalAmount || 0)}</span>
                          <StatusBadge status={String(pr.status || "")} />
                        </div>
                      </div>
                      {/* 处方明细 */}
                      {pr.details && pr.details.length > 0 && (
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100"><tr>
                            <th className="px-2 py-1 text-left">药品名称</th><th className="px-2 py-1">规格</th><th className="px-2 py-1">用法</th>
                            <th className="px-2 py-1">数量</th><th className="px-2 py-1">单价</th><th className="px-2 py-1">金额</th><th className="px-2 py-1">状态</th>
                          </tr></thead>
                          <tbody>{pr.details.map((d: Record<string, unknown>, di: number) => (
                            <tr key={di} className="border-t hover:bg-gray-50">
                              <td className="px-2 py-1 font-medium">{String(d.drugName || "")}</td>
                              <td className="px-2 py-1">{String(d.drugSpec || "")}</td>
                              <td className="px-2 py-1">{String(d.dosage || "")}{String(d.dosageUnit || "")} {String(d.frequency || "")} {String(d.route || "")}</td>
                              <td className="px-2 py-1">{String(d.quantity || "")}{String(d.unit || "")}</td>
                              <td className="px-2 py-1">¥{String(d.unitPrice || 0)}</td>
                              <td className="px-2 py-1 font-bold">¥{String(d.amount || 0)}</td>
                              <td className="px-2 py-1"><StatusBadge status={String(d.dispenseStatus || "")} /></td>
                            </tr>
                          ))}</tbody>
                        </table>
                      )}
                      {/* 关联检查 */}
                      {pr.examinations && pr.examinations.length > 0 && (
                        <div className="px-3 py-2 bg-pink-50/50 border-t text-xs">
                          <span className="font-medium">关联检查：</span>
                          {pr.examinations.map((e: Record<string, unknown>, ei: number) => (
                            <Badge key={ei} variant="outline" className="mr-1 mb-1">
                              {String(e.examName || "")} ¥{String(e.price || 0)} <StatusBadge status={String(e.status || "")} />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!omr.prescriptions?.length && <div className="text-sm text-gray-400 mt-2">暂无关联处方</div>}
            </SectionCard>
          ))}
        </>
      ) : activeView === "inpatient" ? (
        <>
          <Button variant="ghost" size="sm" onClick={() => setActiveView("overview")} className="mb-2"><ChevronLeft className="h-4 w-4 mr-1" />返回总览</Button>
          {admissions.length === 0 ? (
            <Card><CardSection className="py-12 text-center text-gray-400">暂无住院记录</CardSection></Card>
          ) : admissions.map((adm: Admission, ai: number) => (
            <div key={ai} className="space-y-3">
              {/* 住院头部信息 */}
              <Card className="border-l-4 border-l-red-500">
                <CardSection>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-lg font-bold text-red-700">住院 #{String(adm.admissionNo || adm.id)}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 inline mr-1" />入院 {String(adm.admissionDate || "")}
                        {adm.dischargeDate && <> → 出院 {String(adm.dischargeDate)}</>}
                      </div>
                    </div>
                    <StatusBadge status={String(adm.status || "")} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                    {[["床位", `${String(adm.bedNo || "")}(${String(adm.bedType || "")})`], ["日费用", `¥${adm.dailyRate || 0}`], ["病区", String(adm.wardName || "")],
                      ["科室", String(adm.deptName || "")], ["主治医生", String(adm.attendingDoctorName || "")], ["入院类型", String(adm.admissionType || "")],
                      ["入院诊断", String(adm.admissionDiagnosis || "")], ["护理等级", String(adm.nursingLevel || "")], ["病情", String(adm.admissionCondition || "")],
                      ["预交金", `¥${adm.deposit || 0}`], ["总费用", `¥${adm.totalCost || 0}`], ["已缴费", `¥${adm.paidAmount || 0}`]
                    ].map(([label, val]) => (
                      <div key={label}><div className="text-gray-400 text-xs">{label}</div><div className="font-medium truncate" title={String(val || "")}>{String(val || "-")}</div></div>
                    ))}
                  </div>
                </CardSection>
              </Card>

              {/* 医嘱 */}
              <SectionCard title="住院医嘱" icon={<ClipboardList className="h-4 w-4" />}
                badge={<Badge>{adm.orders?.length || 0}条</Badge>} defaultOpen={ai === 0}>
                {adm.orders && adm.orders.length > 0 ? (
                  <div className="space-y-1">
                    {adm.orders.map((o: Record<string, unknown>, oi: number) => (
                      <div key={oi} className="flex items-start gap-2 p-2 border rounded text-sm hover:bg-gray-50">
                        <Badge className={String(o.orderType) === "长期医嘱" ? "bg-pink-50 text-pink-700" : "bg-orange-50 text-orange-700"} variant="outline" style={{ marginTop: 2 }}>
                          {String(o.orderType || "")}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{String(o.orderContent || o.drugName || "")}</div>
                          {o.drugName && <div className="text-xs text-gray-500">{String(o.dosage || "")}{String(o.dosageUnit || "")} {String(o.frequency || "")} {String(o.route || "")}</div>}
                          <div className="text-xs text-gray-400 mt-0.5">{String(o.doctorName || "")} · {String(o.startTime || "")} {o.stopTime && `→停:${String(o.stopTime)}`}</div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <StatusBadge status={String(o.status || "")} />
                          {String(o.priority) !== "普通" && <Badge className="bg-red-50 text-red-600 text-xs">{String(o.priority)}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-sm text-gray-400 py-4 text-center">暂无医嘱</div>}
              </SectionCard>

              {/* 护理记录 */}
              <SectionCard title="护理记录" icon={<Heart className="h-4 w-4" />}
                badge={<Badge>{adm.nursingRecords?.length || 0}条</Badge>} defaultOpen={false}>
                {adm.nursingRecords && adm.nursingRecords.length > 0 ? (
                  <div className="space-y-2">
                    {adm.nursingRecords.map((n: Record<string, unknown>, ni: number) => {
                      let vitalData: Record<string, unknown> = {};
                      try { vitalData = JSON.parse(String(n.vitalSigns || "{}")); } catch {}
                      return (
                        <div key={ni} className="border rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{String(n.recordType || "")}</Badge>
                              <span className="text-gray-500 text-xs">{String(n.recordTime || "")}</span>
                              <Badge className="bg-purple-50 text-purple-700 text-xs">{String(n.recordLevel || "")}</Badge>
                            </div>
                            <span className="text-xs text-gray-400">{String(n.nurseName || "")}</span>
                          </div>
                          {Object.keys(vitalData).length > 0 && (
                            <div className="flex gap-3 my-2 text-xs bg-pink-50/50 p-2 rounded flex-wrap">
                              {vitalData.temp && <span>🌡️体温 {String(vitalData.temp)}°C</span>}
                              {vitalData.pulse && <span>💓脉搏 {String(vitalData.pulse)}次/分</span>}
                              {vitalData.resp && <span>🫁呼吸 {String(vitalData.resp)}次/分</span>}
                              {vitalData.bp && <span>🩺血压 {String(vitalData.bp)}mmHg</span>}
                              {vitalData.spo2 && <span>🩸血氧 {String(vitalData.spo2)}%</span>}
                            </div>
                          )}
                          <div className="text-xs text-gray-600 mt-1">{String(n.conditionDescription || "")}</div>
                          {n.nursingMeasures && <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{String(n.nursingMeasures)}</div>}
                          <div className="flex gap-3 mt-2 text-xs text-gray-400">
                            {n.fallRiskScore !== undefined && <span>跌倒风险:{String(n.fallRiskScore)}分</span>}
                            {n.pressureInjuryRiskScore !== undefined && <span>压疮风险:{String(n.pressureInjuryRiskScore)}分</span>}
                            {n.painScore !== undefined && <span>疼痛评分:{String(n.painScore)}分</span>}
                            {n.intakeAmount && <span>入量:{String(n.intakeAmount)}ml</span>}
                            {n.outputAmount && <span>出量:{String(n.outputAmount)}ml</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <div className="text-sm text-gray-400 py-4 text-center">暂无护理记录</div>}
              </SectionCard>

              {/* 质控记录 */}
              {adm.qualityControls && adm.qualityControls.length > 0 && (
                <SectionCard title="质控检查" icon={<Shield className="h-4 w-4" />}
                  badge={<Badge>{adm.qualityControls.length}项</Badge>} defaultOpen={false}>
                  <div className="space-y-1">
                    {adm.qualityControls.map((q: Record<string, unknown>, qi: number) => (
                      <div key={qi} className="flex items-center gap-2 p-2 border rounded text-sm">
                        <StatusBadge status={String(q.result || "")} />
                        <div className="flex-1"><span className="font-medium">{String(q.qcItem || "")}</span>
                          <span className="text-xs text-gray-400 ml-2">[{String(q.qcType || "")}] {String(q.score || "")}/{String(q.fullScore || "")}分</span>
                        </div>
                        <StatusBadge status={String(q.rectifyStatus || "")} />
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* 住院收费 */}
              {adm.charges && adm.charges.length > 0 && (
                <SectionCard title="住院费用" icon={<CreditCard className="h-4 w-4" />}
                  badge={<Badge>{adm.charges.length}笔</Badge>} defaultOpen={false}>
                  {adm.charges.map((c: Record<string, unknown>, ci: number) => (
                    <div key={ci} className="flex items-center justify-between py-2 border-b text-sm last:border-0">
                      <div><Badge variant="outline" className="mr-2 text-xs">{String(c.chargeNo || "")}</Badge>
                        <span className="text-xs text-gray-500">{String(c.chargerName || "")} · {String(c.chargeTime || "")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">¥{String(c.totalAmount || 0)}</span>
                        <StatusBadge status={String(c.status || "")} />
                      </div>
                    </div>
                  ))}
                </SectionCard>
              )}
            </div>
          ))}
        </>
      ) : (
        <>
          <Button variant="ghost" size="sm" onClick={() => setActiveView("overview")} className="mb-2"><ChevronLeft className="h-4 w-4 mr-1" />返回总览</Button>
          <SectionCard title="全部费用明细" icon={<DollarSign className="h-4 w-4" />}
            badge={<span className="font-bold text-red-600">总计 ¥{totalSpent.toFixed(2)} / 实付 ¥{totalPaid.toFixed(2)}</span>}>
            <table className="w-full text-sm">
              <thead className="bg-gray-100"><tr>
                <th className="px-3 py-2 text-left">单号</th><th className="px-3 py-2">类型</th><th className="px-3 py-2 text-right">金额</th>
                <th className="px-3 py-2 text-right">实付</th><th className="px-3 py-2">方式</th><th className="px-3 py-2">状态</th><th className="px-3 py-2">时间</th>
              </tr></thead>
              <tbody>{allCharges.map((c: ChargeRecord, i: number) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{String(c.chargeNo || "")}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className={
                    String(c.chargeType) === "outpatient" ? "bg-pink-50" :
                    String(c.chargeType) === "inpatient" ? "bg-red-50" : "bg-gray-50"
                  }>{String(c.chargeType || "")}</Badge></td>
                  <td className="px-3 py-2 text-right font-bold">¥{String(c.totalAmount || 0)}</td>
                  <td className="px-3 py-2 text-right text-green-600">¥{String(c.actualAmount || 0)}</td>
                  <td className="px-3 py-2">{String(c.paymentMethod || "")}</td>
                  <td className="px-3 py-2"><StatusBadge status={String(c.status || "")} /></td>
                  <td className="px-3 py-2 text-xs text-gray-400">{String(c.chargeTime || "")}</td>
                </tr>
              ))}</tbody>
            </table>
          </SectionCard>
        </>
      )}
    </div>
  );
}
