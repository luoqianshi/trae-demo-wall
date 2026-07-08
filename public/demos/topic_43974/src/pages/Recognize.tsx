import { useState } from "react";
import { Camera, Image, Search, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { medicines } from "@/data/mock";
import { useAppStore } from "@/store/appStore";

type Step = "upload" | "loading" | "result" | "fallback";

export default function Recognize() {
  const showToast = useAppStore((s) => s.showToast);
  const [step, setStep] = useState<Step>("upload");
  const [selectedMedicine, setSelectedMedicine] = useState(medicines[0]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleRecognize = () => {
    setStep("loading");
    setTimeout(() => {
      setStep("result");
      setSelectedMedicine(medicines[0]);
    }, 2000);
  };

  const filteredMedicines = medicines.filter(
    (m) => m.name.includes(searchKeyword) || m.genericName.includes(searchKeyword)
  );

  return (
    <div className="min-h-screen pb-24">
      {/* 顶部 */}
      <div className="gradient-teal px-5 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-white text-xl font-bold font-serif">拍照识药</h1>
        <p className="text-white/70 text-sm mt-1">拍一张照片，3秒识别药品信息</p>
      </div>

      <div className="px-5 mt-6">
        {step === "upload" && (
          <div className="animate-slide-up">
            {/* 拍照区域 */}
            <div className="bg-white rounded-3xl p-8 card-shadow-lg text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-teal-pale flex items-center justify-center mb-6 animate-float">
                <Camera size={48} className="text-teal" />
              </div>
              <h2 className="font-serif font-bold text-lg text-ink mb-2">拍照识别药品</h2>
              <p className="text-ink-light text-sm mb-6">支持药盒、药片、散装药品</p>

              <div className="space-y-3">
                <button
                  onClick={handleRecognize}
                  className="w-full gradient-mint text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Camera size={20} />
                  拍照识别
                </button>
                <button
                  onClick={handleRecognize}
                  className="w-full bg-cream text-ink py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-warm transition-colors"
                >
                  <Image size={20} />
                  从相册选择
                </button>
              </div>
            </div>

            {/* 识别说明 */}
            <div className="mt-6 bg-teal-pale rounded-2xl p-4">
              <h3 className="font-semibold text-teal text-sm mb-2">💡 拍照小贴士</h3>
              <ul className="text-xs text-ink-mid space-y-1.5">
                <li>• 将药品放在画面中央，保持光线充足</li>
                <li>• 药盒拍摄正面，确保文字清晰可见</li>
                <li>• 散装药片请拍摄正面，展示颜色和形状</li>
                <li>• 识别失败可手动输入药品名称查询</li>
              </ul>
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="bg-white rounded-3xl p-12 card-shadow-lg text-center">
            <Loader2 size={48} className="mx-auto text-teal animate-spin mb-4" />
            <h2 className="font-serif font-bold text-lg text-ink mb-1">AI 识别中...</h2>
            <p className="text-ink-light text-sm">正在分析药品图像，请稍候</p>
            <div className="mt-6 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-mint animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="animate-slide-up">
            {/* 识别成功提示 */}
            <div className="bg-mint/10 border border-mint/30 rounded-2xl p-4 flex items-center gap-3 mb-4">
              <CheckCircle2 size={24} className="text-mint" />
              <div>
                <p className="font-semibold text-ink text-sm">识别成功！</p>
                <p className="text-xs text-ink-light">置信度 96% · 用时 2.3 秒</p>
              </div>
            </div>

            {/* 药品信息卡 */}
            <div className="bg-white rounded-3xl p-5 card-shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-pale flex items-center justify-center text-3xl">
                  {selectedMedicine.image}
                </div>
                <div className="flex-1">
                  <h2 className="font-serif font-bold text-lg text-ink">{selectedMedicine.name}</h2>
                  <p className="text-sm text-ink-light">{selectedMedicine.genericName}</p>
                  <p className="text-xs text-teal mt-1">{selectedMedicine.approvalNumber}</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                <InfoRow label="成分" value={selectedMedicine.ingredients} />
                <InfoRow label="适应症" value={selectedMedicine.indication} />
                <InfoRow label="用法用量" value={selectedMedicine.dosage} highlight />
                <InfoRow label="生产厂家" value={selectedMedicine.manufacturer} />
              </div>

              {/* 冲突预警 */}
              <div className="mt-4 bg-orange-50 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={18} className="text-warn mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warn">冲突预警</p>
                  <p className="text-xs text-ink-mid mt-0.5">
                    与药箱中「布洛芬混悬液」存在相互作用风险，建议咨询医师
                  </p>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 bg-cream text-ink py-3 rounded-2xl font-semibold text-sm"
              >
                重新识别
              </button>
              <button
                onClick={() => showToast("已加入家庭药箱", "success")}
                className="flex-1 gradient-mint text-white py-3 rounded-2xl font-semibold text-sm"
              >
                加入药箱
              </button>
            </div>
          </div>
        )}

        {/* 手动搜索 - 仅在上传阶段显示 */}
        {step === "upload" && (
        <div className="mt-6">
          <h3 className="font-serif font-bold text-ink mb-3 text-sm">手动搜索药品</h3>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-light" />
            <input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="输入药品名称或批准文号"
              className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 text-sm card-shadow focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-light"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {searchKeyword && (
            <div className="mt-3 space-y-2">
              {filteredMedicines.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMedicine(m);
                    setStep("result");
                    setSearchKeyword("");
                  }}
                  className="w-full bg-white rounded-2xl p-3 card-shadow flex items-center gap-3 text-left hover:bg-cream transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-pale flex items-center justify-center text-xl">
                    {m.image}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-ink text-sm">{m.name}</p>
                    <p className="text-xs text-ink-light">{m.genericName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-ink-light w-16 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm flex-1 ${highlight ? "text-teal font-semibold" : "text-ink-mid"}`}>
        {value}
      </span>
    </div>
  );
}
