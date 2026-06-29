import React, { useState, useEffect } from "react";
import { Package, Truck, ArrowRightLeft, Pill, Search, Loader2, Plus, X, AlertTriangle, CheckCircle2, Building2, Hash, FileText, DollarSign, Clock, Shield, Eye } from "lucide-react";
import { drugSupplierService, drugPurchaseOrderService, drugPurchaseItemService, drugTransferOrderService, drugTransferItemService, pharmacyWindowService, drugInventoryLedgerService, drugService } from "@/lib/services";
import type { Drug } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedPage from "@/components/ui/AnimatedPage";

const DrugManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"supplier" | "purchase" | "transfer" | "window" | "inventory" | "safety">("supplier");

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [transferOrders, setTransferOrders] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "supplier") loadSuppliers();
    else if (activeTab === "purchase") loadPurchaseOrders();
    else if (activeTab === "transfer") loadTransferOrders();
    else if (activeTab === "window") loadWindows();
    else if (activeTab === "inventory") loadInventory();
    else if (activeTab === "safety") loadDrugs();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSuppliers(), loadPurchaseOrders(), loadTransferOrders(),
        loadWindows(), loadInventory(), loadDrugs(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try { const data = await drugSupplierService.getAll(searchKeyword); setSuppliers(data); } catch (e) { console.error(e); }
  };
  const loadPurchaseOrders = async () => {
    try { const data = await drugPurchaseOrderService.getAll(); setPurchaseOrders(data); } catch (e) { console.error(e); }
  };
  const loadTransferOrders = async () => {
    try { const data = await drugTransferOrderService.getAll(); setTransferOrders(data); } catch (e) { console.error(e); }
  };
  const loadWindows = async () => {
    try { const data = await pharmacyWindowService.getAll(); setWindows(data); } catch (e) { console.error(e); }
  };
  const loadInventory = async () => {
    try { const data = await drugInventoryLedgerService.getAll({ drugName: searchKeyword }); setInventory(data); } catch (e) { console.error(e); }
  };
  const loadDrugs = async () => {
    try { const data = await drugService.getAll(); setDrugs(data); } catch (e) { console.error(e); }
  };

  const openDialog = (type: string, data?: any) => {
    setDialogType(type);
    setFormData(data || getDefaultForm(type));
    setShowDialog(true);
  };

  const getDefaultForm = (type: string) => {
    switch (type) {
      case "supplier": return { supplierCode: "", supplierName: "", contactPerson: "", contactPhone: "", contactAddress: "", cooperationStatus: "active", supplierRating: "B" };
      case "purchase": return { purchaseNo: `PO${Date.now()}`, supplierId: "", supplierName: "", totalAmount: 0, orderDate: new Date().toISOString().split("T")[0] };
      case "transfer": return { transferNo: `TF${Date.now()}`, sourceWarehouse: "", targetWarehouse: "", transferType: "apply", totalItems: 0, totalQuantity: 0 };
      case "window": return { windowNo: "", windowName: "", windowType: "western", deptId: "", deptName: "门诊药房", locationDesc: "" };
      case "inventory": return { drugId: "", drugName: "", batchNo: "", expireDate: "", warehouseType: "center", warehouseName: "中心药库", quantity: 0, unitPrice: 0, minStock: 10, maxStock: 500 };
      default: return {};
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      switch (dialogType) {
        case "supplier":
          result = formData.id ? await drugSupplierService.update(formData) : await drugSupplierService.add(formData);
          break;
        case "purchase":
          result = await drugPurchaseOrderService.add(formData);
          break;
        case "transfer":
          result = await drugTransferOrderService.add(formData);
          break;
        case "window":
          result = await pharmacyWindowService.add(formData);
          break;
        case "inventory":
          result = await drugInventoryLedgerService.add(formData);
          break;
      }
      if (result?.success || result?.id) {
        setShowDialog(false);
        loadAllData();
      }
    } catch (e) {
      console.error("保存失败:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (type: string, id: number, status: string) => {
    try {
      if (type === "purchase") {
        await drugPurchaseOrderService.update({ id, orderStatus: status });
      } else if (type === "transfer") {
        await drugTransferOrderService.update({ id, status });
      }
      loadAllData();
    } catch (e) { console.error(e); }
  };

  const tabs = [
    { key: "supplier", label: "供应商管理", icon: Truck },
    { key: "purchase", label: "采购入库", icon: Package },
    { key: "transfer", label: "药品调拨", icon: ArrowRightLeft },
    { key: "window", label: "发药窗口", icon: Pill },
    { key: "inventory", label: "库存台账", icon: FileText },
    { key: "safety", label: "安全监测", icon: Shield },
  ];

  const renderSupplierTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">药品供应商管理</h2>
        <button onClick={() => openDialog("supplier")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 flex items-center gap-1">
          <Plus size={14} /> 新增供应商
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-600">供应商编码</th>
              <th className="text-left py-3 px-2 text-gray-600">供应商名称</th>
              <th className="text-left py-3 px-2 text-gray-600">联系人</th>
              <th className="text-left py-3 px-2 text-gray-600">联系电话</th>
              <th className="text-left py-3 px-2 text-gray-600">合作状态</th>
              <th className="text-left py-3 px-2 text-gray-600">评级</th>
              <th className="text-left py-3 px-2 text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 text-gray-600">{s.supplier_code}</td>
                <td className="py-3 px-2 font-medium">{s.supplier_name}</td>
                <td className="py-3 px-2">{s.contact_person}</td>
                <td className="py-3 px-2">{s.contact_phone}</td>
                <td className="py-3 px-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${s.cooperation_status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {s.cooperation_status === "active" ? "合作中" : "已停止"}
                  </span>
                </td>
                <td className="py-3 px-2">{s.supplier_rating}</td>
                <td className="py-3 px-2">
                  <button onClick={() => openDialog("supplier", s)} className="text-blue-500 hover:text-blue-600 text-xs">编辑</button>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">暂无供应商数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPurchaseTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">采购入库管理</h2>
        <button onClick={() => openDialog("purchase")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 flex items-center gap-1">
          <Plus size={14} /> 新建采购单
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-600">采购单号</th>
              <th className="text-left py-3 px-2 text-gray-600">供应商</th>
              <th className="text-left py-3 px-2 text-gray-600">总金额</th>
              <th className="text-left py-3 px-2 text-gray-600">药品数量</th>
              <th className="text-left py-3 px-2 text-gray-600">采购日期</th>
              <th className="text-left py-3 px-2 text-gray-600">状态</th>
              <th className="text-left py-3 px-2 text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium">{o.purchase_no}</td>
                <td className="py-3 px-2">{o.supplier_name}</td>
                <td className="py-3 px-2 text-blue-600 font-medium">¥{o.total_amount}</td>
                <td className="py-3 px-2">{o.drug_count}种/{o.total_quantity}件</td>
                <td className="py-3 px-2 text-gray-500">{o.order_date}</td>
                <td className="py-3 px-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    o.order_status === "completed" ? "bg-green-100 text-green-700" :
                    o.order_status === "inspected" ? "bg-blue-100 text-blue-700" :
                    o.order_status === "warehoused" ? "bg-purple-100 text-purple-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {o.order_status === "draft" ? "草稿" : o.order_status === "ordered" ? "已下单" :
                     o.order_status === "inspected" ? "已验收" : o.order_status === "warehoused" ? "已入库" : "已完成"}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-1">
                    {o.order_status === "draft" && (
                      <button onClick={() => handleUpdateStatus("purchase", o.id, "ordered")} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs">下单</button>
                    )}
                    {o.order_status === "ordered" && (
                      <button onClick={() => handleUpdateStatus("purchase", o.id, "inspected")} className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs">验收</button>
                    )}
                    {o.order_status === "inspected" && (
                      <button onClick={() => handleUpdateStatus("purchase", o.id, "warehoused")} className="px-2 py-1 bg-purple-500 text-white rounded-lg text-xs">入库</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {purchaseOrders.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">暂无采购单</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTransferTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">药品调拨管理</h2>
        <button onClick={() => openDialog("transfer")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 flex items-center gap-1">
          <Plus size={14} /> 新建调拨单
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-600">调拨单号</th>
              <th className="text-left py-3 px-2 text-gray-600">源仓库</th>
              <th className="text-left py-3 px-2 text-gray-600">目标仓库</th>
              <th className="text-left py-3 px-2 text-gray-600">调拨类型</th>
              <th className="text-left py-3 px-2 text-gray-600">数量</th>
              <th className="text-left py-3 px-2 text-gray-600">状态</th>
              <th className="text-left py-3 px-2 text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {transferOrders.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium">{o.transfer_no}</td>
                <td className="py-3 px-2">{o.source_warehouse}</td>
                <td className="py-3 px-2">{o.target_warehouse}</td>
                <td className="py-3 px-2">{o.transfer_type === "apply" ? "申领" : "退药"}</td>
                <td className="py-3 px-2">{o.total_items}种/{o.total_quantity}件</td>
                <td className="py-3 px-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    o.status === "approved" ? "bg-green-100 text-green-700" :
                    o.status === "sent" ? "bg-blue-100 text-blue-700" :
                    o.status === "received" ? "bg-purple-100 text-purple-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {o.status === "draft" ? "草稿" : o.status === "approved" ? "已审批" :
                     o.status === "sent" ? "已发货" : o.status === "received" ? "已收货" : o.status}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-1">
                    {o.status === "draft" && (
                      <button onClick={() => handleUpdateStatus("transfer", o.id, "approved")} className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs">审批</button>
                    )}
                    {o.status === "approved" && (
                      <button onClick={() => handleUpdateStatus("transfer", o.id, "sent")} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs">发货</button>
                    )}
                    {o.status === "sent" && (
                      <button onClick={() => handleUpdateStatus("transfer", o.id, "received")} className="px-2 py-1 bg-purple-500 text-white rounded-lg text-xs">收货</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {transferOrders.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">暂无调拨单</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWindowTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">发药窗口管理</h2>
        <button onClick={() => openDialog("window")} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 flex items-center gap-1">
          <Plus size={14} /> 新增窗口
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {windows.map(w => (
          <div key={w.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-blue-600">{w.window_no}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                w.window_type === "western" ? "bg-blue-100 text-blue-700" :
                w.window_type === "chinese_patent" ? "bg-green-100 text-green-700" :
                "bg-orange-100 text-orange-700"
              }`}>
                {w.window_type === "western" ? "西药窗口" : w.window_type === "chinese_patent" ? "中成药窗口" : "中草药窗口"}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-800">{w.window_name}</div>
            <div className="text-xs text-gray-500 mt-1">{w.dept_name} | {w.location_desc}</div>
          </div>
        ))}
        {windows.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            <Pill size={48} className="mx-auto mb-3 text-gray-300" />
            暂无发药窗口
          </div>
        )}
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">药品库存台账</h2>
        <div className="flex gap-2">
          <input type="text" placeholder="搜索药品..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm w-48" />
          <button onClick={loadInventory} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm">查询</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-600">药品名称</th>
              <th className="text-left py-3 px-2 text-gray-600">批号</th>
              <th className="text-left py-3 px-2 text-gray-600">效期</th>
              <th className="text-left py-3 px-2 text-gray-600">仓库</th>
              <th className="text-left py-3 px-2 text-gray-600">库存数量</th>
              <th className="text-left py-3 px-2 text-gray-600">单价</th>
              <th className="text-left py-3 px-2 text-gray-600">总金额</th>
              <th className="text-left py-3 px-2 text-gray-600">库存状态</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const isLow = item.quantity <= item.min_stock;
              const isExpired = item.expire_date && new Date(item.expire_date) < new Date();
              return (
                <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 ${isLow || isExpired ? "bg-red-50" : ""}`}>
                  <td className="py-3 px-2 font-medium">{item.drug_name}</td>
                  <td className="py-3 px-2 text-gray-600">{item.batch_no}</td>
                  <td className="py-3 px-2">
                    <span className={isExpired ? "text-red-600 font-medium" : "text-gray-600"}>{item.expire_date}</span>
                  </td>
                  <td className="py-3 px-2">{item.warehouse_name}</td>
                  <td className="py-3 px-2">
                    <span className={isLow ? "text-red-600 font-bold" : ""}>{item.quantity}</span>
                    {isLow && <AlertTriangle size={12} className="inline ml-1 text-red-500" />}
                  </td>
                  <td className="py-3 px-2">¥{item.unit_price}</td>
                  <td className="py-3 px-2 text-blue-600">¥{item.total_amount}</td>
                  <td className="py-3 px-2">
                    {isExpired ? <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">已过期</span> :
                     isLow ? <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">库存不足</span> :
                     <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">正常</span>}
                  </td>
                </tr>
              );
            })}
            {inventory.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">暂无库存数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSafetyTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield size={18} className="text-blue-500" />
          安全用药智能监测
        </h2>
        <div className="space-y-3">
          {drugs.filter(d => d.stock <= d.stockWarn).map(d => (
            <div key={d.id} className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-500" />
                  <span className="font-medium text-gray-800">{d.name}</span>
                </div>
                <span className="text-xs text-orange-600 font-medium">库存预警</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">当前库存: {d.stock} | 最低警戒: {d.stockWarn}</div>
            </div>
          ))}
          {drugs.filter(d => d.stock <= d.stockWarn).length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400" />
              当前无库存预警药品
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={18} className="text-green-500" />
          药品基础信息
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-600">药品名称</th>
                <th className="text-left py-2 px-2 text-gray-600">规格</th>
                <th className="text-left py-2 px-2 text-gray-600">库存</th>
                <th className="text-left py-2 px-2 text-gray-600">价格</th>
              </tr>
            </thead>
            <tbody>
              {drugs.map(d => (
                <tr key={d.id} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-medium">{d.name}</td>
                  <td className="py-2 px-2 text-gray-600">{d.spec}</td>
                  <td className="py-2 px-2">
                    <span className={d.stock <= d.stockWarn ? "text-red-600 font-medium" : ""}>{d.stock}</span>
                  </td>
                  <td className="py-2 px-2">¥{d.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDialog = () => {
    if (!showDialog) return null;
    const renderFields = () => {
      switch (dialogType) {
        case "supplier":
          return (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "供应商编码", key: "supplierCode" },
                { label: "供应商名称", key: "supplierName" },
                { label: "联系人", key: "contactPerson" },
                { label: "联系电话", key: "contactPhone" },
                { label: "联系地址", key: "contactAddress" },
                { label: "合作状态", key: "cooperationStatus", type: "select", options: [{ v: "active", l: "合作中" }, { v: "stopped", l: "已停止" }] },
                { label: "供应商评级", key: "supplierRating", type: "select", options: [{ v: "A", l: "A级" }, { v: "B", l: "B级" }, { v: "C", l: "C级" }] },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  {f.type === "select" ? (
                    <select value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                      {f.options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                  )}
                </div>
              ))}
            </div>
          );
        case "purchase":
          return (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "采购单号", key: "purchaseNo" },
                { label: "供应商名称", key: "supplierName" },
                { label: "总金额", key: "totalAmount", type: "number" },
                { label: "采购日期", key: "orderDate", type: "date" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type || "text"} value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
              ))}
            </div>
          );
        case "transfer":
          return (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "调拨单号", key: "transferNo" },
                { label: "源仓库", key: "sourceWarehouse" },
                { label: "目标仓库", key: "targetWarehouse" },
                { label: "调拨类型", key: "transferType", type: "select", options: [{ v: "apply", l: "申领" }, { v: "return", l: "退药" }] },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  {f.type === "select" ? (
                    <select value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                      {f.options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                  )}
                </div>
              ))}
            </div>
          );
        case "window":
          return (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "窗口编号", key: "windowNo" },
                { label: "窗口名称", key: "windowName" },
                { label: "窗口类型", key: "windowType", type: "select", options: [{ v: "western", l: "西药窗口" }, { v: "chinese_patent", l: "中成药窗口" }, { v: "herbal", l: "中草药窗口" }] },
                { label: "所属科室", key: "deptName" },
                { label: "位置描述", key: "locationDesc" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  {f.type === "select" ? (
                    <select value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                      {f.options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                  )}
                </div>
              ))}
            </div>
          );
        case "inventory":
          return (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "药品名称", key: "drugName" },
                { label: "批号", key: "batchNo" },
                { label: "效期", key: "expireDate", type: "date" },
                { label: "仓库类型", key: "warehouseType", type: "select", options: [{ v: "center", l: "中心药库" }, { v: "inpatient", l: "住院药房" }, { v: "outpatient", l: "门诊药房" }] },
                { label: "仓库名称", key: "warehouseName" },
                { label: "数量", key: "quantity", type: "number" },
                { label: "单价", key: "unitPrice", type: "number" },
                { label: "最低库存", key: "minStock", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type || "text"} value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
              ))}
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {dialogType === "supplier" ? "供应商信息" : dialogType === "purchase" ? "采购单信息" :
               dialogType === "transfer" ? "调拨单信息" : dialogType === "window" ? "窗口信息" : "库存信息"}
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
    <div className="theme-unified-page p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">药品管理信息系统</h1>
          <p className="text-sm text-gray-500 mt-1">药品供应链 → 药库药房调拨 → 终端发药 → 安全用药监测 → 三流一体化闭环管控</p>
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

      {activeTab === "supplier" && renderSupplierTab()}
      {activeTab === "purchase" && renderPurchaseTab()}
      {activeTab === "transfer" && renderTransferTab()}
      {activeTab === "window" && renderWindowTab()}
      {activeTab === "inventory" && renderInventoryTab()}
      {activeTab === "safety" && renderSafetyTab()}

      {renderDialog()}
    </div>
  );
};

export default DrugManagement;
