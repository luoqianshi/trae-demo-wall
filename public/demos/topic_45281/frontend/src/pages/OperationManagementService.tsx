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
import { Bed, DollarSign, Calculator, Award, Wrench, Users } from "lucide-react";

const API_BASE = "/api";

const tabs = [
  { key: "bed", label: "床位管理", icon: Bed },
  { key: "finance", label: "财务收费", icon: DollarSign },
  { key: "cost", label: "成本核算", icon: Calculator },
  { key: "performance", label: "绩效考核", icon: Award },
  { key: "equipment", label: "物资设备", icon: Wrench },
  { key: "hr", label: "人力资源", icon: Users },
];

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  occupied: "bg-red-100 text-red-800",
  reserved: "bg-yellow-100 text-yellow-800",
  maintenance: "bg-gray-100 text-gray-800",
  unpaid: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  partial: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-pink-100 text-pink-800",
  rejected: "bg-red-100 text-red-800",
  normal: "bg-green-100 text-green-800",
  warning: "bg-orange-100 text-orange-800",
  scrap: "bg-gray-400 text-white",
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

function BedTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [filter, setFilter] = useState({ bed_status: "", bed_type: "", page: "1", size: "10" });
  const [form, setForm] = useState<Record<string, unknown>>({ bedNo: "", wardId: "", wardName: "", deptId: "", deptName: "", bedType: "standard", bedStatus: "available", dailyRate: "", remark: "" });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try { const data = await apiGet("/beds", filter); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/beds", { bed_no: form.bedNo, ward_id: Number(form.wardId), ward_name: form.wardName, dept_id: Number(form.deptId), dept_name: form.deptName, bed_type: form.bedType, bed_status: form.bedStatus, daily_rate: Number(form.dailyRate), remark: form.remark });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Select value={filter.bed_status || "all"} onValueChange={v => setFilter({ ...filter, bed_status: v === "all" ? "" : v })}>
          <SelectTrigger className="w-32"><SelectValue placeholder="床位状态" /></SelectTrigger>
          <SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="available">空闲</SelectItem><SelectItem value="occupied">占用</SelectItem><SelectItem value="reserved">预留</SelectItem></SelectContent>
        </Select>
        <Select value={filter.bed_type || "all"} onValueChange={v => setFilter({ ...filter, bed_type: v === "all" ? "" : v })}>
          <SelectTrigger className="w-32"><SelectValue placeholder="床位类型" /></SelectTrigger>
          <SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="standard">普通</SelectItem><SelectItem value="vip">VIP</SelectItem><SelectItem value="icu">ICU</SelectItem></SelectContent>
        </Select>
        <Button onClick={load}>查询</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增床位"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>床号</Label><Input value={String(form.bedNo || "")} onChange={e => setForm({ ...form, bedNo: e.target.value })} /></div>
          <div><Label>病区ID</Label><Input value={String(form.wardId || "")} onChange={e => setForm({ ...form, wardId: e.target.value })} /></div>
          <div><Label>病区名称</Label><Input value={String(form.wardName || "")} onChange={e => setForm({ ...form, wardName: e.target.value })} /></div>
          <div><Label>科室ID</Label><Input value={String(form.deptId || "")} onChange={e => setForm({ ...form, deptId: e.target.value })} /></div>
          <div><Label>科室名称</Label><Input value={String(form.deptName || "")} onChange={e => setForm({ ...form, deptName: e.target.value })} /></div>
          <div><Label>床位类型</Label><Select value={String(form.bedType || "standard")} onValueChange={v => setForm({ ...form, bedType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="standard">普通</SelectItem><SelectItem value="vip">VIP</SelectItem><SelectItem value="icu">ICU</SelectItem><SelectItem value="isolation">隔离</SelectItem></SelectContent>
          </Select></div>
          <div><Label>日费用</Label><Input type="number" value={String(form.dailyRate || "")} onChange={e => setForm({ ...form, dailyRate: e.target.value })} /></div>
          <div className="col-span-2"><Label>备注</Label><Input value={String(form.remark || "")} onChange={e => setForm({ ...form, remark: e.target.value })} /></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>床号</TableHead><TableHead>病区</TableHead><TableHead>科室</TableHead><TableHead>类型</TableHead><TableHead>状态</TableHead><TableHead>日费用</TableHead><TableHead>患者</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.bedNo || "-")}</TableCell><TableCell>{String(item.wardName || "-")}</TableCell><TableCell>{String(item.deptName || "-")}</TableCell><TableCell>{String(item.bedType || "-")}</TableCell><TableCell><StatusBadge status={String(item.bedStatus || "")} /></TableCell><TableCell>{String(item.dailyRate || "-")}</TableCell><TableCell>{String(item.patientName || "-")}</TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

function FinanceTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ chargeNo: "", patientName: "", chargeType: "treatment", amount: "", payMethod: "cash", status: "unpaid" });

  const load = useCallback(async () => {
    try { const data = await apiGet("/finance-charges"); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/finance-charges", { charge_no: form.chargeNo, patient_name: form.patientName, charge_type: form.chargeType, amount: Number(form.amount), pay_method: form.payMethod, status: form.status });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Button onClick={load}>刷新</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增收费"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>收费单号</Label><Input value={String(form.chargeNo || "")} onChange={e => setForm({ ...form, chargeNo: e.target.value })} /></div>
          <div><Label>患者姓名</Label><Input value={String(form.patientName || "")} onChange={e => setForm({ ...form, patientName: e.target.value })} /></div>
          <div><Label>收费类型</Label><Select value={String(form.chargeType || "treatment")} onValueChange={v => setForm({ ...form, chargeType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="treatment">治疗费</SelectItem><SelectItem value="drug">药品费</SelectItem><SelectItem value="exam">检查费</SelectItem><SelectItem value="bed">床位费</SelectItem><SelectItem value="other">其他</SelectItem></SelectContent>
          </Select></div>
          <div><Label>金额</Label><Input type="number" value={String(form.amount || "")} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          <div><Label>支付方式</Label><Select value={String(form.payMethod || "cash")} onValueChange={v => setForm({ ...form, payMethod: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">现金</SelectItem><SelectItem value="card">刷卡</SelectItem><SelectItem value="wechat">微信</SelectItem><SelectItem value="alipay">支付宝</SelectItem></SelectContent>
          </Select></div>
          <div><Label>状态</Label><Select value={String(form.status || "unpaid")} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unpaid">未付</SelectItem><SelectItem value="paid">已付</SelectItem><SelectItem value="partial">部分付款</SelectItem></SelectContent>
          </Select></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>单号</TableHead><TableHead>患者</TableHead><TableHead>类型</TableHead><TableHead>金额</TableHead><TableHead>支付方式</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.chargeNo || "-")}</TableCell><TableCell>{String(item.patientName || "-")}</TableCell><TableCell>{String(item.chargeType || "-")}</TableCell><TableCell className="font-bold">{String(item.amount || "-")}</TableCell><TableCell>{String(item.payMethod || "-")}</TableCell><TableCell><StatusBadge status={String(item.status || "")} /></TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

function CostTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ costNo: "", deptName: "", period: "", directCost: "", indirectCost: "", totalCost: "", revenue: "", profit: "" });

  const load = useCallback(async () => {
    try { const data = await apiGet("/cost-accountings"); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/cost-accountings", { cost_no: form.costNo, dept_name: form.deptName, period: form.period, direct_cost: Number(form.directCost), indirect_cost: Number(form.indirectCost), total_cost: Number(form.totalCost), revenue: Number(form.revenue), profit: Number(form.profit) });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Button onClick={load}>刷新</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增核算"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>核算单号</Label><Input value={String(form.costNo || "")} onChange={e => setForm({ ...form, costNo: e.target.value })} /></div>
          <div><Label>科室</Label><Input value={String(form.deptName || "")} onChange={e => setForm({ ...form, deptName: e.target.value })} /></div>
          <div><Label>期间</Label><Input value={String(form.period || "")} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="2026-01" /></div>
          <div><Label>直接成本</Label><Input type="number" value={String(form.directCost || "")} onChange={e => setForm({ ...form, directCost: e.target.value })} /></div>
          <div><Label>间接成本</Label><Input type="number" value={String(form.indirectCost || "")} onChange={e => setForm({ ...form, indirectCost: e.target.value })} /></div>
          <div><Label>总成本</Label><Input type="number" value={String(form.totalCost || "")} onChange={e => setForm({ ...form, totalCost: e.target.value })} /></div>
          <div><Label>收入</Label><Input type="number" value={String(form.revenue || "")} onChange={e => setForm({ ...form, revenue: e.target.value })} /></div>
          <div><Label>利润</Label><Input type="number" value={String(form.profit || "")} onChange={e => setForm({ ...form, profit: e.target.value })} /></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>科室</TableHead><TableHead>期间</TableHead><TableHead>直接成本</TableHead><TableHead>间接成本</TableHead><TableHead>总成本</TableHead><TableHead>收入</TableHead><TableHead>利润</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.deptName || "-")}</TableCell><TableCell>{String(item.period || "-")}</TableCell><TableCell>{String(item.directCost || "-")}</TableCell><TableCell>{String(item.indirectCost || "-")}</TableCell><TableCell className="font-bold">{String(item.totalCost || "-")}</TableCell><TableCell>{String(item.revenue || "-")}</TableCell><TableCell className={Number(item.profit) >= 0 ? "text-green-600" : "text-red-600"}>{String(item.profit || "-")}</TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

function PerformanceTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ assessNo: "", staffName: "", deptName: "", period: "", workQuantity: "", workQuality: "", patientSatisfaction: "", attendanceScore: "", totalScore: "", level: "" });

  const load = useCallback(async () => {
    try { const data = await apiGet("/performance-assessments"); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/performance-assessments", { assess_no: form.assessNo, staff_name: form.staffName, dept_name: form.deptName, period: form.period, work_quantity: Number(form.workQuantity), work_quality: Number(form.workQuality), patient_satisfaction: Number(form.patientSatisfaction), attendance_score: Number(form.attendanceScore), total_score: Number(form.totalScore), level: form.level });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Button onClick={load}>刷新</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增考核"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>考核编号</Label><Input value={String(form.assessNo || "")} onChange={e => setForm({ ...form, assessNo: e.target.value })} /></div>
          <div><Label>姓名</Label><Input value={String(form.staffName || "")} onChange={e => setForm({ ...form, staffName: e.target.value })} /></div>
          <div><Label>科室</Label><Input value={String(form.deptName || "")} onChange={e => setForm({ ...form, deptName: e.target.value })} /></div>
          <div><Label>期间</Label><Input value={String(form.period || "")} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="2026-Q1" /></div>
          <div><Label>工作量分</Label><Input type="number" value={String(form.workQuantity || "")} onChange={e => setForm({ ...form, workQuantity: e.target.value })} /></div>
          <div><Label>质量分</Label><Input type="number" value={String(form.workQuality || "")} onChange={e => setForm({ ...form, workQuality: e.target.value })} /></div>
          <div><Label>满意度分</Label><Input type="number" value={String(form.patientSatisfaction || "")} onChange={e => setForm({ ...form, patientSatisfaction: e.target.value })} /></div>
          <div><Label>考勤分</Label><Input type="number" value={String(form.attendanceScore || "")} onChange={e => setForm({ ...form, attendanceScore: e.target.value })} /></div>
          <div><Label>总分</Label><Input type="number" value={String(form.totalScore || "")} onChange={e => setForm({ ...form, totalScore: e.target.value })} /></div>
          <div><Label>等级</Label><Select value={String(form.level || "")} onValueChange={v => setForm({ ...form, level: v })}>
            <SelectTrigger><SelectValue placeholder="等级" /></SelectTrigger><SelectContent><SelectItem value="A">A - 优秀</SelectItem><SelectItem value="B">B - 良好</SelectItem><SelectItem value="C">C - 合格</SelectItem><SelectItem value="D">D - 待改进</SelectItem></SelectContent>
          </Select></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>姓名</TableHead><TableHead>科室</TableHead><TableHead>期间</TableHead><TableHead>工作量</TableHead><TableHead>质量</TableHead><TableHead>满意度</TableHead><TableHead>总分</TableHead><TableHead>等级</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.staffName || "-")}</TableCell><TableCell>{String(item.deptName || "-")}</TableCell><TableCell>{String(item.period || "-")}</TableCell><TableCell>{String(item.workQuantity || "-")}</TableCell><TableCell>{String(item.workQuality || "-")}</TableCell><TableCell>{String(item.patientSatisfaction || "-")}</TableCell><TableCell className="font-bold">{String(item.totalScore || "-")}</TableCell><TableCell><Badge className={String(item.level) === "A" ? "bg-green-100 text-green-800" : String(item.level) === "D" ? "bg-red-100 text-red-800" : "bg-pink-100 text-pink-800"}>{String(item.level || "-")}</Badge></TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

function EquipmentTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ assetNo: "", assetName: "", category: "", model: "", manufacturer: "", purchaseDate: "", originalValue: "", currentValue: "", status: "normal", location: "" });

  const load = useCallback(async () => {
    try { const data = await apiGet("/equipment-assets"); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/equipment-assets", { asset_no: form.assetNo, asset_name: form.assetName, category: form.category, model: form.model, manufacturer: form.manufacturer, purchase_date: form.purchaseDate, original_value: Number(form.originalValue), current_value: Number(form.currentValue), status: form.status, location: form.location });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Button onClick={load}>刷新</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增设备"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>资产编号</Label><Input value={String(form.assetNo || "")} onChange={e => setForm({ ...form, assetNo: e.target.value })} /></div>
          <div><Label>资产名称</Label><Input value={String(form.assetName || "")} onChange={e => setForm({ ...form, assetName: e.target.value })} /></div>
          <div><Label>类别</Label><Input value={String(form.category || "")} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
          <div><Label>型号</Label><Input value={String(form.model || "")} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
          <div><Label>制造商</Label><Input value={String(form.manufacturer || "")} onChange={e => setForm({ ...form, manufacturer: e.target.value })} /></div>
          <div><Label>购入日期</Label><Input type="date" value={String(form.purchaseDate || "")} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} /></div>
          <div><Label>原值</Label><Input type="number" value={String(form.originalValue || "")} onChange={e => setForm({ ...form, originalValue: e.target.value })} /></div>
          <div><Label>现值</Label><Input type="number" value={String(form.currentValue || "")} onChange={e => setForm({ ...form, currentValue: e.target.value })} /></div>
          <div><Label>状态</Label><Select value={String(form.status || "normal")} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">正常</SelectItem><SelectItem value="warning">预警</SelectItem><SelectItem value="repair">维修中</SelectItem><SelectItem value="scrap">报废</SelectItem></SelectContent>
          </Select></div>
          <div className="col-span-3"><Label>位置</Label><Input value={String(form.location || "")} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>编号</TableHead><TableHead>名称</TableHead><TableHead>类别</TableHead><TableHead>型号</TableHead><TableHead>原值</TableHead><TableHead>现值</TableHead><TableHead>状态</TableHead><TableHead>位置</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.assetNo || "-")}</TableCell><TableCell>{String(item.assetName || "-")}</TableCell><TableCell>{String(item.category || "-")}</TableCell><TableCell>{String(item.model || "-")}</TableCell><TableCell>{String(item.originalValue || "-")}</TableCell><TableCell>{String(item.currentValue || "-")}</TableCell><TableCell><StatusBadge status={String(item.status || "")} /></TableCell><TableCell>{String(item.location || "-")}</TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

function HrTab() {
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ staffNo: "", name: "", gender: "男", deptName: "", position: "", title: "", phone: "", email: "", status: "active" });

  const load = useCallback(async () => {
    try { const data = await apiGet("/hr-staff"); setList(Array.isArray(data) ? data : data.items || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await apiPost("/hr-staff", { staff_no: form.staffNo, name: form.name, gender: form.gender, dept_name: form.deptName, position: form.position, title: form.title, phone: form.phone, email: form.email, status: form.status });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <Button onClick={load}>刷新</Button>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">{showForm ? "取消" : "新增人员"}</Button>
      </div>
      {showForm && (
        <Card><CardSection className="grid grid-cols-3 gap-3">
          <div><Label>工号</Label><Input value={String(form.staffNo || "")} onChange={e => setForm({ ...form, staffNo: e.target.value })} /></div>
          <div><Label>姓名</Label><Input value={String(form.name || "")} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>性别</Label><Select value={String(form.gender || "男")} onValueChange={v => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="男">男</SelectItem><SelectItem value="女">女</SelectItem></SelectContent>
          </Select></div>
          <div><Label>科室</Label><Input value={String(form.deptName || "")} onChange={e => setForm({ ...form, deptName: e.target.value })} /></div>
          <div><Label>职位</Label><Input value={String(form.position || "")} onChange={e => setForm({ ...form, position: e.target.value })} /></div>
          <div><Label>职称</Label><Input value={String(form.title || "")} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>电话</Label><Input value={String(form.phone || "")} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>邮箱</Label><Input value={String(form.email || "")} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>状态</Label><Select value={String(form.status || "active")} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">在职</SelectItem><SelectItem value="inactive">离职</SelectItem><SelectItem value="leave">休假</SelectItem></SelectContent>
          </Select></div>
          <Button onClick={handleAdd} className="col-span-3">提交</Button>
        </CardSection></Card>
      )}
      <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>工号</TableHead><TableHead>姓名</TableHead><TableHead>性别</TableHead><TableHead>科室</TableHead><TableHead>职位</TableHead><TableHead>职称</TableHead><TableHead>电话</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
        <TableBody>{list.map((item: Record<string, unknown>, i) => (
          <TableRow key={i}><TableCell>{String(item.id || "-")}</TableCell><TableCell>{String(item.staffNo || "-")}</TableCell><TableCell>{String(item.name || "-")}</TableCell><TableCell>{String(item.gender || "-")}</TableCell><TableCell>{String(item.deptName || "-")}</TableCell><TableCell>{String(item.position || "-")}</TableCell><TableCell>{String(item.title || "-")}</TableCell><TableCell>{String(item.phone || "-")}</TableCell><TableCell><StatusBadge status={String(item.status || "")} /></TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}

export default function OperationManagementService() {
  const [activeTab, setActiveTab] = useState("bed");

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader title="运行管理模块 / OPERATION MANAGEMENT" />
      </Card>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          {tabs.map(t => (<TabsTrigger key={t.key} value={t.key} className="flex items-center gap-1"><t.icon className="h-4 w-4" />{t.label}</TabsTrigger>))}
        </TabsList>
        <TabsContent value="bed"><Card><CardSection><BedTab /></CardSection></Card></TabsContent>
        <TabsContent value="finance"><Card><CardSection><FinanceTab /></CardSection></Card></TabsContent>
        <TabsContent value="cost"><Card><CardSection><CostTab /></CardSection></Card></TabsContent>
        <TabsContent value="performance"><Card><CardSection><PerformanceTab /></CardSection></Card></TabsContent>
        <TabsContent value="equipment"><Card><CardSection><EquipmentTab /></CardSection></Card></TabsContent>
        <TabsContent value="hr"><Card><CardSection><HrTab /></CardSection></Card></TabsContent>
      </Tabs>
    </div>
  );
}
