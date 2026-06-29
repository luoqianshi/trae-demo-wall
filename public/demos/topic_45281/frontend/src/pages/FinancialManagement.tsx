import React, { useState, useEffect } from "react";
import { DollarSign, BarChart3, Users, PieChart, Search, Loader2, Plus, X, FileText, Calendar, Building2, CheckCircle2, TrendingUp, TrendingDown, Hash } from "lucide-react";
import { financeGeneralLedgerService, financeBudgetService, payrollService, costAccountingDetailService, departmentService } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";

const FinancialManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ledger" | "budget" | "payroll" | "cost">("ledger");

  const [ledgers, setLedgers] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [costDetails, setCostDetails] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const [periodFilter, setPeriodFilter] = useState(new Date().toISOString().slice(0, 7));
  const [deptFilter, setDeptFilter] = useState("");

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (activeTab === "ledger") loadLedgers();
    else if (activeTab === "budget") loadBudgets();
    else if (activeTab === "payroll") loadPayrolls();
    else if (activeTab === "cost") loadCostDetails();
  }, [activeTab, periodFilter, deptFilter]);

  const loadDepartments = async () => {
    try { const data = await departmentService.getAll(); setDepartments(data); } catch (e) { console.error(e); }
  };

  const loadLedgers = async () => {
    setLoading(true);
    try {
      const data = await financeGeneralLedgerService.getAll({ period: periodFilter });
      setLedgers(data);
    } finally { setLoading(false); }
  };

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await financeBudgetService.getAll({
        year: periodFilter.split("-")[0],
        deptId: deptFilter ? parseInt(deptFilter) : undefined,
      });
      setBudgets(data);
    } finally { setLoading(false); }
  };

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const data = await payrollService.getAll({
        period: periodFilter,
        deptId: deptFilter ? parseInt(deptFilter) : undefined,
      });
      setPayrolls(data);
    } finally { setLoading(false); }
  };

  const loadCostDetails = async () => {
    setLoading(true);
    try {
      const data = await costAccountingDetailService.getAll({
        period: periodFilter,
        deptId: deptFilter ? parseInt(deptFilter) : undefined,
      });
      setCostDetails(data);
    } finally { setLoading(false); }
  };

  const openDialog = (type: string, data?: any) => {
    setDialogType(type);
    setFormData(data || getDefaultForm(type));
    setShowDialog(true);
  };

  const getDefaultForm = (type: string) => {
    switch (type) {
      case "ledger":
        return { voucherNo: `V${Date.now()}`, accountPeriod: periodFilter, accountDate: new Date().toISOString().split("T")[0],
          summary: "", subjectCode: "", subjectName: "", subjectType: "revenue", debitAmount: 0, creditAmount: 0,
          businessType: "", deptId: "", deptName: "", operatorId: user?.id || 0, operatorName: user?.name || "" };
      case "budget":
        return { budgetNo: `B${Date.now()}`, budgetYear: periodFilter.split("-")[0], budgetPeriod: periodFilter,
          deptId: "", deptName: "", budgetType: "annual", budgetCategory: "", budgetAmount: 0, remark: "" };
      case "payroll":
        return { payrollNo: `P${Date.now()}`, staffId: 0, staffNo: "", staffName: "", deptId: "", deptName: "",
          payPeriod: periodFilter, baseSalary: 0, performanceSalary: 0, positionSalary: 0, overtimePay: 0,
          bonus: 0, subsidy: 0, grossPay: 0, pensionInsurance: 0, medicalInsurance: 0, unemploymentInsurance: 0,
          housingFund: 0, incomeTax: 0, otherDeductions: 0, totalDeductions: 0, netPay: 0 };
      case "cost":
        return { accountingNo: `C${Date.now()}`, accountPeriod: periodFilter, deptId: "", deptName: "",
          costType: "direct", costCategory: "", directCost: 0, indirectCost: 0, totalCost: 0, revenueAmount: 0, remark: "" };
      default: return {};
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      switch (dialogType) {
        case "ledger": result = await financeGeneralLedgerService.add(formData); break;
        case "budget": result = await financeBudgetService.add(formData); break;
        case "payroll": result = await payrollService.add(formData); break;
        case "cost": result = await costAccountingDetailService.add(formData); break;
      }
      if (result?.success || result?.id) {
        setShowDialog(false);
        if (activeTab === "ledger") loadLedgers();
        else if (activeTab === "budget") loadBudgets();
        else if (activeTab === "payroll") loadPayrolls();
        else if (activeTab === "cost") loadCostDetails();
      }
    } catch (e) { console.error("保存失败:", e); } finally { setSaving(false); }
  };

  const handleUpdateStatus = async (type: string, id: number, status: string) => {
    try {
      if (type === "ledger") {
        await financeGeneralLedgerService.update({ id, voucherStatus: status, auditorId: user?.id, auditorName: user?.name });
      } else if (type === "budget") {
        await financeBudgetService.update({ id, status, approverId: user?.id, approverName: user?.name });
      } else if (type === "payroll") {
        await payrollService.update({ id, payStatus: status, payDate: new Date().toISOString().split("T")[0], operatorId: user?.id, operatorName: user?.name });
      }
      loadLedgers();
      loadBudgets();
      loadPayrolls();
    } catch (e) { console.error(e); }
  };

  const tabs = [
    { key: "ledger", label: "总账管理", icon: DollarSign },
    { key: "budget", label: "预算管理", icon: BarChart3 },
    { key: "payroll", label: "薪资管理", icon: Users },
    { key: "cost", label: "成本核算", icon: PieChart },
  ];

  const totalRevenue = ledgers.filter(l => l.subject_type === "revenue").reduce((s, l) => s + parseFloat(l.credit_amount || 0), 0);
  const totalExpense = ledgers.filter(l => l.subject_type === "expense").reduce((s, l) => s + parseFloat(l.debit_amount || 0), 0);
  const totalPayroll = payrolls.reduce((s, p) => s + parseFloat(p.net_pay || 0), 0);
  const totalCost = costDetails.reduce((s, c) => s + parseFloat(c.total_cost || 0), 0);

  const renderLedgerTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "本期总收入", value: `¥${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "本期总支出", value: `¥${totalExpense.toFixed(2)}`, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
          { label: "本期结余", value: `¥${(totalRevenue - totalExpense).toFixed(2)}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "凭证总数", value: ledgers.length, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.bg} rounded-xl p-4 border border-gray-100`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">{stat.label}</div>
                <div className={`text-lg font-bold ${stat.color} mt-1`}>{stat.value}</div>
              </div>
              <stat.icon size={24} className={stat.color} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">总账财务凭证</h2>
          <div className="flex gap-2">
            <input type="month" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            <button onClick={() => openDialog("ledger")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm flex items-center gap-1">
              <Plus size={14} /> 新增凭证
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-600">凭证编号</th>
                <th className="text-left py-3 px-2 text-gray-600">摘要</th>
                <th className="text-left py-3 px-2 text-gray-600">科目</th>
                <th className="text-left py-3 px-2 text-gray-600">借方金额</th>
                <th className="text-left py-3 px-2 text-gray-600">贷方金额</th>
                <th className="text-left py-3 px-2 text-gray-600">业务类型</th>
                <th className="text-left py-3 px-2 text-gray-600">状态</th>
                <th className="text-left py-3 px-2 text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {ledgers.map(l => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">{l.voucher_no}</td>
                  <td className="py-3 px-2 max-w-[150px] truncate">{l.summary}</td>
                  <td className="py-3 px-2">{l.subject_name}</td>
                  <td className="py-3 px-2 text-red-600">{l.debit_amount > 0 ? `¥${l.debit_amount}` : "-"}</td>
                  <td className="py-3 px-2 text-green-600">{l.credit_amount > 0 ? `¥${l.credit_amount}` : "-"}</td>
                  <td className="py-3 px-2 text-gray-600">{l.business_type || "-"}</td>
                  <td className="py-3 px-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      l.voucher_status === "audited" ? "bg-green-100 text-green-700" :
                      l.voucher_status === "posted" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {l.voucher_status === "draft" ? "草稿" : l.voucher_status === "posted" ? "已过账" : "已审核"}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {l.voucher_status === "draft" && (
                      <button onClick={() => handleUpdateStatus("ledger", l.id, "posted")} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs">过账</button>
                    )}
                    {l.voucher_status === "posted" && (
                      <button onClick={() => handleUpdateStatus("ledger", l.id, "audited")} className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs">审核</button>
                    )}
                  </td>
                </tr>
              ))}
              {ledgers.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">暂无凭证数据</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBudgetTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">全面预算管理</h2>
        <div className="flex gap-2">
          <input type="month" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
          <button onClick={() => openDialog("budget")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm flex items-center gap-1">
            <Plus size={14} /> 新增预算
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-600">预算编号</th>
              <th className="text-left py-3 px-2 text-gray-600">科室</th>
              <th className="text-left py-3 px-2 text-gray-600">预算类型</th>
              <th className="text-left py-3 px-2 text-gray-600">预算金额</th>
              <th className="text-left py-3 px-2 text-gray-600">已使用</th>
              <th className="text-left py-3 px-2 text-gray-600">剩余</th>
              <th className="text-left py-3 px-2 text-gray-600">执行率</th>
              <th className="text-left py-3 px-2 text-gray-600">状态</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map(b => {
              const rate = b.budget_amount > 0 ? ((b.used_amount / b.budget_amount) * 100).toFixed(1) : "0";
              return (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">{b.budget_no}</td>
                  <td className="py-3 px-2">{b.dept_name}</td>
                  <td className="py-3 px-2">{b.budget_type === "annual" ? "年度预算" : "月度预算"}</td>
                  <td className="py-3 px-2 text-blue-600 font-medium">¥{b.budget_amount}</td>
                  <td className="py-3 px-2">¥{b.used_amount || 0}</td>
                  <td className="py-3 px-2">¥{b.remaining_amount || 0}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${parseFloat(rate) > 90 ? "bg-red-500" : parseFloat(rate) > 70 ? "bg-orange-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(100, parseFloat(rate))}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{rate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      b.status === "approved" ? "bg-green-100 text-green-700" :
                      b.status === "executing" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {b.status === "draft" ? "草稿" : b.status === "approved" ? "已审批" : "执行中"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {budgets.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">暂无预算数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayrollTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">人力薪资工资管理</h2>
        <div className="flex gap-2">
          <input type="month" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
          <button onClick={() => openDialog("payroll")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm flex items-center gap-1">
            <Plus size={14} /> 新增薪资
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-xs text-gray-500">本期应发总额</div>
          <div className="text-lg font-bold text-blue-600 mt-1">¥{payrolls.reduce((s, p) => s + parseFloat(p.gross_pay || 0), 0).toFixed(2)}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-xs text-gray-500">本期实发总额</div>
          <div className="text-lg font-bold text-green-600 mt-1">¥{totalPayroll.toFixed(2)}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-xs text-gray-500">发放人数</div>
          <div className="text-lg font-bold text-purple-600 mt-1">{payrolls.length}人</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-600">工号</th>
              <th className="text-left py-3 px-2 text-gray-600">姓名</th>
              <th className="text-left py-3 px-2 text-gray-600">科室</th>
              <th className="text-left py-3 px-2 text-gray-600">基本工资</th>
              <th className="text-left py-3 px-2 text-gray-600">绩效工资</th>
              <th className="text-left py-3 px-2 text-gray-600">应发合计</th>
              <th className="text-left py-3 px-2 text-gray-600">扣款合计</th>
              <th className="text-left py-3 px-2 text-gray-600">实发工资</th>
              <th className="text-left py-3 px-2 text-gray-600">状态</th>
              <th className="text-left py-3 px-2 text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 text-gray-600">{p.staff_no}</td>
                <td className="py-3 px-2 font-medium">{p.staff_name}</td>
                <td className="py-3 px-2">{p.dept_name}</td>
                <td className="py-3 px-2">¥{p.base_salary}</td>
                <td className="py-3 px-2">¥{p.performance_salary}</td>
                <td className="py-3 px-2 text-blue-600 font-medium">¥{p.gross_pay}</td>
                <td className="py-3 px-2 text-red-600">¥{p.total_deductions}</td>
                <td className="py-3 px-2 text-green-600 font-bold">¥{p.net_pay}</td>
                <td className="py-3 px-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.pay_status === "paid" ? "bg-green-100 text-green-700" :
                    p.pay_status === "paying" ? "bg-blue-100 text-blue-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {p.pay_status === "pending" ? "待发放" : p.pay_status === "paying" ? "发放中" : "已发放"}
                  </span>
                </td>
                <td className="py-3 px-2">
                  {p.pay_status === "pending" && (
                    <button onClick={() => handleUpdateStatus("payroll", p.id, "paid")} className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs">发放</button>
                  )}
                </td>
              </tr>
            ))}
            {payrolls.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-gray-400">暂无薪资数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCostTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">全成本核算</h2>
        <div className="flex gap-2">
          <input type="month" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
          <button onClick={() => openDialog("cost")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm flex items-center gap-1">
            <Plus size={14} /> 新增核算
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: "总成本", value: `¥${totalCost.toFixed(2)}`, color: "text-red-600" },
          { label: "总收入", value: `¥${costDetails.reduce((s, c) => s + parseFloat(c.revenue_amount || 0), 0).toFixed(2)}`, color: "text-green-600" },
          { label: "利润", value: `¥${(costDetails.reduce((s, c) => s + parseFloat(c.revenue_amount || 0), 0) - totalCost).toFixed(2)}`, color: "text-blue-600" },
          { label: "平均利润率", value: costDetails.length > 0 ? `${(costDetails.reduce((s, c) => s + parseFloat(c.profit_margin || 0), 0) / costDetails.length).toFixed(1)}%` : "0%", color: "text-purple-600" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500">{stat.label}</div>
            <div className={`text-lg font-bold ${stat.color} mt-1`}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-600">核算编号</th>
              <th className="text-left py-3 px-2 text-gray-600">科室</th>
              <th className="text-left py-3 px-2 text-gray-600">成本类型</th>
              <th className="text-left py-3 px-2 text-gray-600">直接成本</th>
              <th className="text-left py-3 px-2 text-gray-600">间接成本</th>
              <th className="text-left py-3 px-2 text-gray-600">总成本</th>
              <th className="text-left py-3 px-2 text-gray-600">收入</th>
              <th className="text-left py-3 px-2 text-gray-600">利润率</th>
            </tr>
          </thead>
          <tbody>
            {costDetails.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium">{c.accounting_no}</td>
                <td className="py-3 px-2">{c.dept_name}</td>
                <td className="py-3 px-2">{c.cost_type === "direct" ? "直接成本" : "间接成本"}</td>
                <td className="py-3 px-2">¥{c.direct_cost}</td>
                <td className="py-3 px-2">¥{c.indirect_cost}</td>
                <td className="py-3 px-2 text-red-600 font-medium">¥{c.total_cost}</td>
                <td className="py-3 px-2 text-green-600">¥{c.revenue_amount}</td>
                <td className="py-3 px-2">
                  <span className={c.profit_margin >= 0 ? "text-green-600" : "text-red-600"}>{c.profit_margin}%</span>
                </td>
              </tr>
            ))}
            {costDetails.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">暂无成本核算数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDialog = () => {
    if (!showDialog) return null;
    const renderFields = () => {
      const fieldsMap: Record<string, any[]> = {
        ledger: [
          { label: "凭证编号", key: "voucherNo" },
          { label: "会计期间", key: "accountPeriod" },
          { label: "记账日期", key: "accountDate", type: "date" },
          { label: "摘要", key: "summary", span: 2 },
          { label: "科目编码", key: "subjectCode" },
          { label: "科目名称", key: "subjectName" },
          { label: "科目类型", key: "subjectType", type: "select", options: [{ v: "asset", l: "资产" }, { v: "liability", l: "负债" }, { v: "revenue", l: "收入" }, { v: "expense", l: "支出" }] },
          { label: "借方金额", key: "debitAmount", type: "number" },
          { label: "贷方金额", key: "creditAmount", type: "number" },
          { label: "业务类型", key: "businessType" },
        ],
        budget: [
          { label: "预算编号", key: "budgetNo" },
          { label: "预算年度", key: "budgetYear" },
          { label: "预算期间", key: "budgetPeriod" },
          { label: "科室名称", key: "deptName" },
          { label: "预算类型", key: "budgetType", type: "select", options: [{ v: "annual", l: "年度预算" }, { v: "monthly", l: "月度预算" }] },
          { label: "预算金额", key: "budgetAmount", type: "number" },
          { label: "备注", key: "remark", span: 2 },
        ],
        payroll: [
          { label: "薪资单号", key: "payrollNo" },
          { label: "工号", key: "staffNo" },
          { label: "姓名", key: "staffName" },
          { label: "科室名称", key: "deptName" },
          { label: "基本工资", key: "baseSalary", type: "number" },
          { label: "绩效工资", key: "performanceSalary", type: "number" },
          { label: "岗位工资", key: "positionSalary", type: "number" },
          { label: "加班费", key: "overtimePay", type: "number" },
          { label: "奖金", key: "bonus", type: "number" },
          { label: "补贴", key: "subsidy", type: "number" },
          { label: "养老保险", key: "pensionInsurance", type: "number" },
          { label: "医疗保险", key: "medicalInsurance", type: "number" },
          { label: "失业保险", key: "unemploymentInsurance", type: "number" },
          { label: "住房公积金", key: "housingFund", type: "number" },
          { label: "个税", key: "incomeTax", type: "number" },
        ],
        cost: [
          { label: "核算编号", key: "accountingNo" },
          { label: "会计期间", key: "accountPeriod" },
          { label: "科室名称", key: "deptName" },
          { label: "成本类型", key: "costType", type: "select", options: [{ v: "direct", l: "直接成本" }, { v: "indirect", l: "间接成本" }] },
          { label: "直接成本", key: "directCost", type: "number" },
          { label: "间接成本", key: "indirectCost", type: "number" },
          { label: "收入金额", key: "revenueAmount", type: "number" },
          { label: "备注", key: "remark", span: 2 },
        ],
      };

      const fields = fieldsMap[dialogType] || [];
      return (
        <div className="grid grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
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
      );
    };

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {dialogType === "ledger" ? "财务凭证" : dialogType === "budget" ? "预算信息" : dialogType === "payroll" ? "薪资信息" : "成本核算"}
            </h3>
            <button onClick={() => setShowDialog(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          {renderFields()}
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
          <h1 className="text-2xl font-bold text-gray-800">医院财务管理信息系统</h1>
          <p className="text-sm text-gray-500 mt-1">总账核算 → 全面预算 → 薪资管理 → 全成本核算，全院资金全周期信息化管控</p>
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

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      )}

      {activeTab === "ledger" && renderLedgerTab()}
      {activeTab === "budget" && renderBudgetTab()}
      {activeTab === "payroll" && renderPayrollTab()}
      {activeTab === "cost" && renderCostTab()}

      {renderDialog()}
    </div>
  );
};

export default FinancialManagement;
