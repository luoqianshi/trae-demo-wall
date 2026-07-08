import { useState } from "react";
import { Calculator, AlertTriangle, CheckCircle2, Baby } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { medicines } from "@/data/mock";

export default function Dosage() {
  const showToast = useAppStore((s) => s.showToast);
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState(medicines[3]); // 默认美林
  const [result, setResult] = useState<{ singleDose: string; dailyDose: string; warning?: string } | null>(null);

  const handleCalculate = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      showToast("请输入有效的体重", "warning");
      return;
    }

    // 布洛芬：5-10mg/kg/次，每日不超过 4 次
    if (selectedMedicine.id === 4) {
      const singleDoseMin = (w * 5).toFixed(1);
      const singleDoseMax = (w * 10).toFixed(1);
      const dailyMax = (w * 40).toFixed(1);
      // 混悬液 100mg/5ml = 20mg/ml
      const volumeMin = ((w * 5) / 20).toFixed(1);
      const volumeMax = ((w * 10) / 20).toFixed(1);

      let warning: string | undefined;
      if (w < 5) {
        warning = "体重低于 5kg，建议就医咨询，不建议自行给药";
      } else if (w > 30) {
        warning = "体重超过 30kg，建议使用成人剂量或咨询医师";
      }

      setResult({
        singleDose: `${singleDoseMin}~${singleDoseMax}mg（${volumeMin}~${volumeMax}ml 混悬液）`,
        dailyDose: `每日不超过 ${dailyMax}mg，间隔 6-8 小时一次`,
        warning,
      });
      showToast("计算完成", "success");
    } else {
      setResult({
        singleDose: "该药品请遵医嘱使用",
        dailyDose: "儿童用药需咨询医师",
        warning: "此药品儿童剂量需医师指导，不建议自行计算",
      });
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* 顶部 */}
      <div className="gradient-teal px-5 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-white text-xl font-bold font-serif">儿童剂量计算</h1>
        <p className="text-white/70 text-sm mt-1">按体重精确计算，安全用药</p>
      </div>

      <div className="px-5 mt-6 space-y-4">
        {/* 儿童信息 */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Baby size={20} className="text-teal" />
            <h2 className="font-serif font-bold text-ink">儿童信息</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-ink-mid font-medium block mb-2">体重 (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例如：12"
                className="w-full bg-cream rounded-xl px-4 py-3 text-lg font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
            <div>
              <label className="text-sm text-ink-mid font-medium block mb-2">年龄（选填）</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="例如：3"
                className="w-full bg-cream rounded-xl px-4 py-3 text-lg font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
          </div>
        </div>

        {/* 选择药品 */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <h2 className="font-serif font-bold text-ink mb-3">选择药品</h2>
          <div className="space-y-2">
            {medicines.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMedicine(m)}
                className={`w-full rounded-xl p-3 flex items-center gap-3 transition-colors ${
                  selectedMedicine.id === m.id
                    ? "bg-teal-pale border-2 border-teal"
                    : "bg-cream border-2 border-transparent"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl">
                  {m.image}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-ink text-sm">{m.name}</p>
                  <p className="text-xs text-ink-light">{m.ingredients}</p>
                </div>
                {selectedMedicine.id === m.id && (
                  <CheckCircle2 size={18} className="text-teal" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 计算按钮 */}
        <button
          onClick={handleCalculate}
          className="w-full gradient-mint text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Calculator size={20} />
          计算剂量
        </button>

        {/* 计算结果 */}
        {result && (
          <div className="animate-slide-up space-y-3">
            {/* 禁用警告 */}
            {result.warning && (
              <div className="bg-red-50 border border-danger/30 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-danger mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-danger text-sm">安全警告</p>
                  <p className="text-xs text-ink-mid mt-1">{result.warning}</p>
                </div>
              </div>
            )}

            {/* 剂量结果 */}
            <div className="bg-white rounded-2xl p-5 card-shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={20} className="text-mint" />
                <h2 className="font-serif font-bold text-ink">计算结果</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-teal-pale rounded-xl p-4">
                  <p className="text-xs text-teal font-medium mb-1">单次剂量</p>
                  <p className="text-lg font-bold text-teal">{result.singleDose}</p>
                </div>
                <div className="bg-cream rounded-xl p-4">
                  <p className="text-xs text-ink-light font-medium mb-1">每日总量</p>
                  <p className="text-sm font-semibold text-ink">{result.dailyDose}</p>
                </div>
              </div>

              {/* 计算依据 */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-ink-light">计算依据</p>
                <p className="text-xs text-ink-mid mt-1">
                  {selectedMedicine.name} · {selectedMedicine.ingredients}
                </p>
                <p className="text-xs text-ink-mid mt-0.5">
                  体重 {weight}kg · 布洛芬 5-10mg/kg/次
                </p>
              </div>
            </div>

            {/* 免责声明 */}
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-warn">
                ⚠️ 以上计算仅供参考，不能替代医师处方。如症状持续请及时就医。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
