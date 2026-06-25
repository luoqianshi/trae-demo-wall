import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, ClipboardCheck, AlertTriangle, Bug, FileWarning, AlertCircle } from "lucide-react";

const API_BASE = "/api";

const tabs = [
  { key: "permission", label: "权限管理", icon: Shield },
  { key: "quality", label: "质量控制", icon: ClipboardCheck },
  { key: "critical", label: "危急值", icon: AlertTriangle },
  { key: "infection", label: "院感监测", icon: Bug },
  { key: "adverse", label: "不良事件", icon: FileWarning },
  { key: "infectious", label: "传染病上报", icon: AlertCircle },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  expired: "bg-red-100 text-red-800",
  reviewed: "bg-pink-100 text-pink-800",
  closed: "bg-gray-100 text-gray-800",
  notified: "bg-orange-100 text-orange-800",
  confirmed: "bg-pink-100 text-pink-800",
  resolved: "bg-green-100 text-green-800",
  submitted: "bg-pink-100 text-pink-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  reviewing: "bg-orange-100 text-orange-800",
  improving: "bg-pink-100 text-pink-800",
  completed: "bg-green-100 text-green-800",
};

function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
}

async function apiGet(endpoint: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}${endpoint}${query ? "?" + query : ""}`;
  const res = await fetch(url);
  return res.json();
}

async function apiPost(endpoint: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

function PermissionTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [filter, setFilter] = useState({ module_code: "", status: "", page: "1", size: "10" });
  const [form, setForm] = useState<Record<string, unknown>>({ userId: "", moduleCode: "", permissionType: "read", grantedBy: "", status: "active", remark: "" });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try { const data = await apiGet("/permissions", filter); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/permissions", { user_id: form.userId, module_code: form.moduleCode, permission_type: form.permissionType, granted_by: form.grantedBy, status: form.status, remark: form.remark });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Input placeholder="模块编码" value={filter.module_code} onChange={e => setFilter({ ...filter, module_code: e.target.value })} className="w-40" />
        <Select value={filter.status || "all"} onValueChange={v => setFilter({ ...filter, status: v === "all" ? "" : v })}>
          <SelectTrigger className="w-32"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="active">active</SelectItem><SelectItem value="inactive">inactive</SelectItem></SelectContent>
        </Select>
        <Button onClick={load}>查询</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增权限"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>用户ID</Label><Input value={String(form.userId || "")} onChange={e => setForm({ ...form, userId: e.target.value })} /></div>
          <div><Label>模块编码</Label><Input value={String(form.moduleCode || "")} onChange={e => setForm({ ...form, moduleCode: e.target.value })} /></div>
          <div><Label>权限类型</Label><Select value={String(form.permissionType || "read")} onValueChange={v => setForm({ ...form, permissionType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="read">读取</SelectItem><SelectItem value="write">写入</SelectItem><SelectItem value="delete">删除</SelectItem><SelectItem value="approve">审批</SelectItem></SelectContent>
          </Select></div>
          <div><Label>授权人ID</Label><Input value={String(form.grantedBy || "")} onChange={e => setForm({ ...form, grantedBy: e.target.value })} /></div>
          <div><Label>状态</Label><Select value={String(form.status || "active")} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">active</SelectItem><SelectItem value="inactive">inactive</SelectItem></SelectContent>
          </Select></div>
          <div><Label>备注</Label><Input value={String(form.remark || "")} onChange={e => setForm({ ...form, remark: e.target.value })} /></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>用户</TableHead><TableHead>模块</TableHead><TableHead>权限</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.userId || "-")}</TableCell><TableCell>{String(item.moduleCode || "-")}</TableCell><TableCell>{String(item.permissionType || "-")}</TableCell><TableCell><StatusBadge status={String(item.status || "")} /></TableCell><TableCell>-</TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

function QualityCheckTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ checkNo: "", checkType: "medical_record", deptName: "", patientName: "", checkerName: "", checkDate: "", score: "", totalScore: "", passFlag: "0", problemDesc: "", status: "pending" });

  const load = useCallback(async () => {
    try { const data = await apiGet("/quality-checks"); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/quality-checks", { check_no: form.checkNo, check_type: form.checkType, dept_name: form.deptName, patient_name: form.patientName, checker_name: form.checkerName, check_date: form.checkDate, score: Number(form.score), total_score: Number(form.totalScore), pass_flag: Number(form.passFlag), problem_desc: form.problemDesc, status: form.status });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Button onClick={load}>刷新</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增质控"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>检查单号</Label><Input value={String(form.checkNo || "")} onChange={e => setForm({ ...form, checkNo: e.target.value })} /></div>
          <div><Label>检查类型</Label><Select value={String(form.checkType || "medical_record")} onValueChange={v => setForm({ ...form, checkType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="medical_record">病历</SelectItem><SelectItem value="prescription">处方</SelectItem><SelectItem value="nursing">护理</SelectItem><SelectItem value="surgery">手术</SelectItem></SelectContent>
          </Select></div>
          <div><Label>科室</Label><Input value={String(form.deptName || "")} onChange={e => setForm({ ...form, deptName: e.target.value })} /></div>
          <div><Label>患者</Label><Input value={String(form.patientName || "")} onChange={e => setForm({ ...form, patientName: e.target.value })} /></div>
          <div><Label>检查人</Label><Input value={String(form.checkerName || "")} onChange={e => setForm({ ...form, checkerName: e.target.value })} /></div>
          <div><Label>日期</Label><Input type="date" value={String(form.checkDate || "")} onChange={e => setForm({ ...form, checkDate: e.target.value })} /></div>
          <div><Label>得分</Label><Input value={String(form.score || "")} onChange={e => setForm({ ...form, score: e.target.value })} /></div>
          <div><Label>总分</Label><Input value={String(form.totalScore || "")} onChange={e => setForm({ ...form, totalScore: e.target.value })} /></div>
          <div><Label>是否通过</Label><Select value={String(form.passFlag || "0")} onValueChange={v => setForm({ ...form, passFlag: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">不通过</SelectItem><SelectItem value="1">通过</SelectItem></SelectContent>
          </Select></div>
          <div className="col-span-3"><Label>问题描述</Label><Textarea value={String(form.problemDesc || "")} onChange={e => setForm({ ...form, problemDesc: e.target.value })} /></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>类型</TableHead><TableHead>科室</TableHead><TableHead>患者</TableHead><TableHead>检查人</TableHead><TableHead>得分</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.checkType || "-")}</TableCell><TableCell>{String(item.deptName || "-")}</TableCell><TableCell>{String(item.patientName || "-")}</TableCell><TableCell>{String(item.checkerName || "-")}</TableCell><TableCell>{String(item.score || "-")}/{String(item.totalScore || "-")}</TableCell><TableCell><StatusBadge status={String(item.status || "")} /></TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

function CriticalValueTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ reportNo: "", patientName: "", valueType: "lab", itemName: "", itemValue: "", unit: "", reporterName: "", isUrgent: "1", status: "pending" });

  const load = useCallback(async () => {
    try { const data = await apiGet("/critical-values"); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/critical-values", { report_no: form.reportNo, patient_name: form.patientName, value_type: form.valueType, item_name: form.itemName, item_value: form.itemValue, unit: form.unit, reporter_name: form.reporterName, is_urgent: Number(form.isUrgent), status: form.status });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Button onClick={load}>刷新</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增危急值"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>报告编号</Label><Input value={String(form.reportNo || "")} onChange={e => setForm({ ...form, reportNo: e.target.value })} /></div>
          <div><Label>患者姓名</Label><Input value={String(form.patientName || "")} onChange={e => setForm({ ...form, patientName: e.target.value })} /></div>
          <div><Label>值类型</Label><Select value={String(form.valueType || "lab")} onValueChange={v => setForm({ ...form, valueType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lab">检验</SelectItem><SelectItem value="imaging">影像</SelectItem><SelectItem value="vital_sign">生命体征</SelectItem></SelectContent>
          </Select></div>
          <div><Label>项目名称</Label><Input value={String(form.itemName || "")} onChange={e => setForm({ ...form, itemName: e.target.value })} /></div>
          <div><Label>检测值</Label><Input value={String(form.itemValue || "")} onChange={e => setForm({ ...form, itemValue: e.target.value })} className="text-red-600 font-bold" /></div>
          <div><Label>单位</Label><Input value={String(form.unit || "")} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
          <div><Label>报告人</Label><Input value={String(form.reporterName || "")} onChange={e => setForm({ ...form, reporterName: e.target.value })} /></div>
          <div><Label>紧急</Label><Select value={String(form.isUrgent || "1")} onValueChange={v => setForm({ ...form, isUrgent: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">是</SelectItem><SelectItem value="0">否</SelectItem></SelectContent>
          </Select></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>患者</TableHead><TableHead>类型</TableHead><TableHead>项目</TableHead><TableHead>检测值</TableHead><TableHead>单位</TableHead><TableHead>报告人</TableHead><TableHead>紧急</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.patientName || "-")}</TableCell><TableCell>{String(item.valueType || "-")}</TableCell><TableCell>{String(item.itemName || "-")}</TableCell><TableCell className="text-red-600 font-bold">{String(item.itemValue || "-")}</TableCell><TableCell>{String(item.unit || "-")}</TableCell><TableCell>{String(item.reporterName || "-")}</TableCell><TableCell>{Number(item.isUrgent) === 1 ? "是" : "-"}</TableCell><TableCell><StatusBadge status={String(item.status || "")} /></TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

function InfectionTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ surveillanceNo: "", patientName: "", deptName: "", bedNo: "", infectionType: "", infectionSite: "", pathogen: "", severity: "moderate", status: "pending" });

  const load = useCallback(async () => {
    try { const data = await apiGet("/infection-surveillances"); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/infection-surveillances", { surveillance_no: form.surveillanceNo, patient_name: form.patientName, dept_name: form.deptName, bed_no: form.bedNo, infection_type: form.infectionType, infection_site: form.infectionSite, pathogen: form.pathogen, severity: form.severity, status: form.status });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Button onClick={load}>刷新</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增院感"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>监测编号</Label><Input value={String(form.surveillanceNo || "")} onChange={e => setForm({ ...form, surveillanceNo: e.target.value })} /></div>
          <div><Label>患者姓名</Label><Input value={String(form.patientName || "")} onChange={e => setForm({ ...form, patientName: e.target.value })} /></div>
          <div><Label>科室</Label><Input value={String(form.deptName || "")} onChange={e => setForm({ ...form, deptName: e.target.value })} /></div>
          <div><Label>床号</Label><Input value={String(form.bedNo || "")} onChange={e => setForm({ ...form, bedNo: e.target.value })} /></div>
          <div><Label>感染类型</Label><Input value={String(form.infectionType || "")} onChange={e => setForm({ ...form, infectionType: e.target.value })} /></div>
          <div><Label>感染部位</Label><Input value={String(form.infectionSite || "")} onChange={e => setForm({ ...form, infectionSite: e.target.value })} /></div>
          <div><Label>病原体</Label><Input value={String(form.pathogen || "")} onChange={e => setForm({ ...form, pathogen: e.target.value })} /></div>
          <div><Label>严重程度</Label><Select value={String(form.severity || "moderate")} onValueChange={v => setForm({ ...form, severity: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mild">轻度</SelectItem><SelectItem value="moderate">中度</SelectItem><SelectItem value="severe">重度</SelectItem></SelectContent>
          </Select></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>患者</TableHead><TableHead>科室</TableHead><TableHead>感染类型</TableHead><TableHead>部位</TableHead><TableHead>病原体</TableHead><TableHead>严重程度</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.patientName || "-")}</TableCell><TableCell>{String(item.deptName || "-")}</TableCell><TableCell>{String(item.infectionType || "-")}</TableCell><TableCell>{String(item.infectionSite || "-")}</TableCell><TableCell>{String(item.pathogen || "-")}</TableCell><TableCell>{String(item.severity || "-")}</TableCell><TableCell><StatusBadge status={String(item.status || "")} /></TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

function AdverseEventTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ eventNo: "", patientName: "", eventType: "medication_error", eventDate: "", eventDescription: "", severity: "moderate", reporterName: "", department: "", status: "pending" });

  const load = useCallback(async () => {
    try { const data = await apiGet("/adverse-events"); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/adverse-events", { event_no: form.eventNo, patient_name: form.patientName, event_type: form.eventType, event_date: form.eventDate, event_description: form.eventDescription, severity: form.severity, reporter_name: form.reporterName, department: form.department, status: form.status });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Button onClick={load}>刷新</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增不良事件"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>事件编号</Label><Input value={String(form.eventNo || "")} onChange={e => setForm({ ...form, eventNo: e.target.value })} /></div>
          <div><Label>患者姓名</Label><Input value={String(form.patientName || "")} onChange={e => setForm({ ...form, patientName: e.target.value })} /></div>
          <div><Label>事件类型</Label><Select value={String(form.eventType || "medication_error")} onValueChange={v => setForm({ ...form, eventType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="medication_error">用药错误</SelectItem><SelectItem value="fall">跌倒</SelectItem><SelectItem value="pressure_injury">压疮</SelectItem><SelectItem value="infection">感染</SelectItem><SelectItem value="other">其他</SelectItem></SelectContent>
          </Select></div>
          <div><Label>事件日期</Label><Input type="date" value={String(form.eventDate || "")} onChange={e => setForm({ ...form, eventDate: e.target.value })} /></div>
          <div className="col-span-2"><Label>事件描述</Label><Textarea value={String(form.eventDescription || "")} onChange={e => setForm({ ...form, eventDescription: e.target.value })} /></div>
          <div><Label>严重程度</Label><Select value={String(form.severity || "moderate")} onValueChange={v => setForm({ ...form, severity: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mild">轻度</SelectItem><SelectItem value="moderate">中度</SelectItem><SelectItem value="severe">重度</SelectItem></SelectContent>
          </Select></div>
          <div><Label>报告人</Label><Input value={String(form.reporterName || "")} onChange={e => setForm({ ...form, reporterName: e.target.value })} /></div>
          <div><Label>科室</Label><Input value={String(form.department || "")} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>患者</TableHead><TableHead>事件类型</TableHead><TableHead>描述</TableHead><TableHead>严重程度</TableHead><TableHead>报告人</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.patientName || "-")}</TableCell><TableCell>{String(item.eventType || "-")}</TableCell><TableCell className="max-w-[200px] truncate">{String(item.eventDescription || "-")}</TableCell><TableCell>{String(item.severity || "-")}</TableCell><TableCell>{String(item.reporterName || "-")}</TableCell><TableCell><StatusBadge status={String(item.status || "")} /></TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

function InfectiousDiseaseTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ reportNo: "", patientName: "", diseaseName: "", diseaseCategory: "class_a", diagnosisDate: "", reporterName: "", deptName: "", status: "pending" });

  const load = useCallback(async () => {
    try { const data = await apiGet("/infectious-disease-reports"); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/infectious-disease-reports", { report_no: form.reportNo, patient_name: form.patientName, disease_name: form.diseaseName, disease_category: form.diseaseCategory, diagnosis_date: form.diagnosisDate, reporter_name: form.reporterName, dept_name: form.deptName, status: form.status });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Button onClick={load}>刷新</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增传染病上报"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>报告编号</Label><Input value={String(form.reportNo || "")} onChange={e => setForm({ ...form, reportNo: e.target.value })} /></div>
          <div><Label>患者姓名</Label><Input value={String(form.patientName || "")} onChange={e => setForm({ ...form, patientName: e.target.value })} /></div>
          <div><Label>病名</Label><Input value={String(form.diseaseName || "")} onChange={e => setForm({ ...form, diseaseName: e.target.value })} /></div>
          <div><Label>类别</Label><Select value={String(form.diseaseCategory || "class_a")} onValueChange={v => setForm({ ...form, diseaseCategory: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="class_a">甲类</SelectItem><SelectItem value="class_b">乙类</SelectItem><SelectItem value="class_c">丙类</SelectItem><SelectItem value="other">其他</SelectItem></SelectContent>
          </Select></div>
          <div><Label>诊断日期</Label><Input type="date" value={String(form.diagnosisDate || "")} onChange={e => setForm({ ...form, diagnosisDate: e.target.value })} /></div>
          <div><Label>报告人</Label><Input value={String(form.reporterName || "")} onChange={e => setForm({ ...form, reporterName: e.target.value })} /></div>
          <div><Label>科室</Label><Input value={String(form.deptName || "")} onChange={e => setForm({ ...form, deptName: e.target.value })} /></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>患者</TableHead><TableHead>病名</TableHead><TableHead>类别</TableHead><TableHead>诊断日期</TableHead><TableHead>报告人</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.patientName || "-")}</TableCell><TableCell>{String(item.diseaseName || "-")}</TableCell><TableCell>{String(item.diseaseCategory || "-")}</TableCell><TableCell>{String(item.diagnosisDate || "-")}</TableCell><TableCell>{String(item.reporterName || "-")}</TableCell><TableCell><StatusBadge status={String(item.status || "")} /></TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

export default function MedicalManagementService() {
  const [activeTab, setActiveTab] = useState("permission");

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader title="医疗管理模块 / MEDICAL MANAGEMENT" />
      </Card>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          {tabs.map(t => (<TabsTrigger key={t.key} value={t.key} className="flex items-center gap-1"><t.icon className="h-4 w-4" />{t.label}</TabsTrigger>))}
        </TabsList>
        <TabsContent value="permission"><Card><CardSection><PermissionTab /></CardSection></Card></TabsContent>
        <TabsContent value="quality"><Card><CardSection><QualityCheckTab /></CardSection></Card></TabsContent>
        <TabsContent value="critical"><Card><CardSection><CriticalValueTab /></CardSection></Card></TabsContent>
        <TabsContent value="infection"><Card><CardSection><InfectionTab /></CardSection></Card></TabsContent>
        <TabsContent value="adverse"><Card><CardSection><AdverseEventTab /></CardSection></Card></TabsContent>
        <TabsContent value="infectious"><Card><CardSection><InfectiousDiseaseTab /></CardSection></Card></TabsContent>
      </Tabs>
    </div>
  );
}
