import { useState } from "react";
import { Plus, AlertTriangle, Package, Clock, Search } from "lucide-react";
import { cabinetItems, type CabinetItem } from "@/data/mock";
import { useAppStore } from "@/store/appStore";

type FilterType = "all" | "normal" | "expiring" | "low-stock";

export default function Cabinet() {
  const showToast = useAppStore((s) => s.showToast);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredItems = filter === "all" ? cabinetItems : cabinetItems.filter((i) => i.status === filter);

  const stats = {
    total: cabinetItems.length,
    expiring: cabinetItems.filter((i) => i.status === "expiring").length,
    lowStock: cabinetItems.filter((i) => i.status === "low-stock").length,
  };

  return (
    <div className="min-h-screen pb-24">
      {/* 顶部 */}
      <div className="gradient-teal px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold font-serif">家庭药箱</h1>
            <p className="text-white/70 text-sm mt-1">共 {stats.total} 种药品</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <Plus size={22} />
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-white text-2xl font-bold font-serif">{stats.total}</p>
            <p className="text-white/70 text-xs mt-0.5">药品总数</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-warn text-2xl font-bold font-serif">{stats.expiring}</p>
            <p className="text-white/70 text-xs mt-0.5">即将过期</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-danger text-2xl font-bold font-serif">{stats.lowStock}</p>
            <p className="text-white/70 text-xs mt-0.5">库存不足</p>
          </div>
        </div>
      </div>

      {/* 筛选标签 */}
      <div className="px-5 mt-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { key: "all" as const, label: "全部" },
            { key: "normal" as const, label: "正常" },
            { key: "expiring" as const, label: "即将过期" },
            { key: "low-stock" as const, label: "库存不足" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? "bg-teal text-white"
                  : "bg-white text-ink-light card-shadow"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 药品列表 */}
      <div className="px-5 mt-4 space-y-3">
        {filteredItems.map((item) => (
          <CabinetItemCard key={item.id} item={item} showToast={showToast} />
        ))}
      </div>

      {/* 全箱扫描按钮 */}
      <div className="px-5 mt-6">
        <button
          onClick={() => showToast("扫描完成，发现 1 项相互作用风险", "warning")}
          className="w-full bg-teal-pale text-teal py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-teal-pale/70 transition-colors"
        >
          <Search size={18} />
          全箱冲突扫描
        </button>
      </div>

      {/* 添加药品弹窗 */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white w-[390px] rounded-t-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-lg text-ink">添加药品</h3>
              <button onClick={() => setShowAddModal(false)} className="text-ink-light">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full bg-teal-pale rounded-2xl p-4 flex items-center gap-3 hover:bg-teal-pale/70 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center text-white">
                  📷
                </div>
                <div className="text-left">
                  <p className="font-semibold text-ink text-sm">拍照添加</p>
                  <p className="text-xs text-ink-light">AI 自动识别药品信息</p>
                </div>
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full bg-cream rounded-2xl p-4 flex items-center gap-3 hover:bg-warm transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-ink-mid flex items-center justify-center text-white">
                  ✏️
                </div>
                <div className="text-left">
                  <p className="font-semibold text-ink text-sm">手动添加</p>
                  <p className="text-xs text-ink-light">输入药品名称或批准文号</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CabinetItemCard({ item, showToast }: { item: CabinetItem; showToast: (msg: string, type?: "success" | "warning" | "error" | "info") => void }) {
  const statusConfig = {
    normal: { bg: "", label: "", color: "" },
    expiring: { bg: "bg-orange-50", label: "即将过期", color: "text-warn" },
    "low-stock": { bg: "bg-red-50", label: "库存不足", color: "text-danger" },
    expired: { bg: "bg-red-50", label: "已过期", color: "text-danger" },
  };
  const config = statusConfig[item.status];

  return (
    <div className={`bg-white rounded-2xl p-4 card-shadow ${config.bg}`}>
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-2xl bg-teal-pale flex items-center justify-center text-2xl flex-shrink-0">
          {item.medicine.image}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink text-sm truncate">{item.medicine.name}</h3>
            {config.label && (
              <span className={`text-[10px] font-medium ${config.color} flex-shrink-0`}>
                {config.label}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-light mt-0.5">{item.medicine.genericName}</p>

          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1 text-ink-mid">
              <Package size={12} />
              {item.quantity} 片
            </span>
            <span className="flex items-center gap-1 text-ink-mid">
              <Clock size={12} />
              {item.daysToExpiry > 365
                ? `${Math.floor(item.daysToExpiry / 365)}年后过期`
                : `${item.daysToExpiry}天后过期`}
            </span>
            <span className="text-ink-light">{item.owner}</span>
          </div>
        </div>
      </div>

      {item.status === "expiring" && (
        <div className="mt-3 flex items-center gap-2 text-xs text-warn bg-warn/10 rounded-lg px-3 py-2">
          <AlertTriangle size={14} />
          建议尽快使用或更换，避免过期浪费
        </div>
      )}
      {item.status === "low-stock" && (
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">
            <AlertTriangle size={14} />
            库存不足，建议补货
          </span>
          <button onClick={() => showToast("正在跳转购药渠道...", "info")} className="text-xs text-teal font-medium">一键购药 →</button>
        </div>
      )}
    </div>
  );
}
