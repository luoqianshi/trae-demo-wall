import { useNavigate } from "react-router-dom";
import {
  User,
  Crown,
  Volume2,
  Type,
  Bell,
  Shield,
  ChevronRight,
  LogOut,
  Users,
  FileText,
  HelpCircle,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";

export default function Profile() {
  const navigate = useNavigate();
  const { elderMode, toggleElderMode, voiceEnabled, toggleVoice, showToast } = useAppStore();

  return (
    <div className="min-h-screen pb-24">
      {/* 顶部 */}
      <div className="gradient-teal px-5 pt-12 pb-20 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
            👨‍👩‍👧
          </div>
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold font-serif">我的家庭</h1>
            <p className="text-white/70 text-sm">138****8888 · 家庭管理员</p>
          </div>
          <span className="bg-warn/80 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <Crown size={12} /> 会员
          </span>
        </div>
      </div>

      {/* 会员卡片 */}
      <div className="px-5 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl p-4 card-shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif font-bold text-ink">家庭年卡</p>
              <p className="text-xs text-ink-light mt-0.5">有效期至 2027-06-23</p>
            </div>
            <button
              onClick={() => showToast("会员功能开发中", "info")}
              className="text-teal text-sm font-medium"
            >
              续费 →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-teal font-serif">10</p>
              <p className="text-[10px] text-ink-light">家庭成员</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-teal font-serif">∞</p>
              <p className="text-[10px] text-ink-light">识药次数</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-teal font-serif">24h</p>
              <p className="text-[10px] text-ink-light">专属客服</p>
            </div>
          </div>
        </div>
      </div>

      {/* 功能设置 */}
      <div className="px-5 mt-6 space-y-4">
        {/* 用药设置 */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <p className="text-xs text-ink-light px-4 pt-3 pb-1">用药设置</p>
          <SettingItem
            icon={Type}
            label="适老化大字体"
            color="bg-teal-pale text-teal"
            right={
              <ToggleSwitch checked={elderMode} onChange={toggleElderMode} />
            }
          />
          <SettingItem
            icon={Volume2}
            label="语音播报"
            color="bg-blue-50 text-blue-500"
            right={
              <ToggleSwitch checked={voiceEnabled} onChange={toggleVoice} />
            }
          />
          <SettingItem
            icon={Bell}
            label="推送通知设置"
            color="bg-orange-50 text-warn"
            onClick={() => showToast("通知设置开发中", "info")}
          />
        </div>

        {/* 家庭管理 */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <p className="text-xs text-ink-light px-4 pt-3 pb-1">家庭管理</p>
          <SettingItem
            icon={Users}
            label="家庭成员"
            color="bg-purple-50 text-purple-500"
            right={<span className="text-xs text-ink-light">3 人</span>}
            onClick={() => navigate("/family")}
          />
          <SettingItem
            icon={FileText}
            label="用药报告"
            color="bg-teal-pale text-teal"
            onClick={() => showToast("用药报告开发中", "info")}
          />
        </div>

        {/* 其他 */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <p className="text-xs text-ink-light px-4 pt-3 pb-1">其他</p>
          <SettingItem
            icon={Shield}
            label="隐私与安全"
            color="bg-gray-100 text-ink-mid"
            onClick={() => showToast("数据已加密存储", "success")}
          />
          <SettingItem
            icon={HelpCircle}
            label="帮助与反馈"
            color="bg-gray-100 text-ink-mid"
            onClick={() => showToast("客服热线：400-888-0000", "info")}
          />
          <SettingItem
            icon={LogOut}
            label="退出登录"
            color="bg-red-50 text-danger"
            onClick={() => showToast("已退出登录", "info")}
          />
        </div>

        {/* 免责声明 */}
        <div className="bg-cream rounded-xl p-3 text-center">
          <p className="text-[10px] text-ink-light leading-relaxed">
            AI 药管家 v1.0.0\n本应用提供的信息仅供参考，不能替代医师处方
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingItem({
  icon: Icon,
  label,
  color,
  right,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number | string }>;
  label: string;
  color: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cream transition-colors"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <span className="flex-1 text-left text-sm font-medium text-ink">{label}</span>
      {right || <ChevronRight size={16} className="text-ink-light" />}
    </button>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`w-11 h-6 rounded-full transition-colors relative ${
        checked ? "bg-mint" : "bg-gray-300"
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
