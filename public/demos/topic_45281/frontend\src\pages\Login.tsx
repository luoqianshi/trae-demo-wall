import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Hospital,
  KeyRound,
  Loader2,
  Settings,
  Shield,
  Stethoscope,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const roles = [
  { value: "DOCTOR", icon: Stethoscope, label: "医生", hint: "门诊工作站" },
  { value: "PATIENT", icon: User, label: "患者", hint: "个人服务" },
  { value: "ADMIN", icon: Settings, label: "管理", hint: "系统运维" },
];

const Login: React.FC = () => {
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("DOCTOR");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!loginName.trim()) {
      setError("请输入登录账号");
      return;
    }
    if (!password.trim()) {
      setError("请输入密码");
      return;
    }

    setLoading(true);
    const result = await login({ loginName, password, userType });
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate("/"), 500);
    } else {
      setError(result.error || "登录失败");
    }
  };

  return (
    <div className="theme-unified-page min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_28%),radial-gradient(circle_at_80%_70%,color-mix(in_srgb,var(--tertiary)_10%,transparent),transparent_30%)]" />
      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Hospital size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">医院 HIS</h1>
              <p className="text-xs text-muted-foreground">医院管理系统</p>
            </div>
          </div>

          <div className="max-w-xl motion-page">
            <p className="text-sm font-medium text-primary mb-3">Secure clinical workspace</p>
            <h2 className="text-4xl font-bold tracking-normal text-foreground leading-tight">
              面向门诊、药房、收费和住院业务的统一工作台
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              保留主题切换能力，界面动效服务于状态确认、页面进入和数据加载，不再使用持续粒子、贴纸或彩带反馈。
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-xl">
            {["身份认证", "业务审计", "数据同步"].map((item, index) => (
              <div
                key={item}
                className="motion-card rounded-xl border border-border bg-card/80 p-4"
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <div className="h-1 w-8 rounded-full bg-primary mb-3" />
                <p className="text-sm font-semibold text-foreground">{item}</p>
                <p className="text-[11px] text-muted-foreground mt-1">已启用</p>
              </div>
            ))}
          </div>
        </section>

        <main className="flex items-center justify-center px-5 py-10">
          <div className="motion-card w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-xl">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Shield size={13} />
                安全登录
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">登录医院管理系统</h2>
              <p className="mt-1 text-sm text-muted-foreground">请选择身份并输入账号密码</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">身份选择</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map(({ value, icon: Icon, label, hint }) => {
                    const active = userType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setUserType(value)}
                        className={`motion-press rounded-xl border px-3 py-3 text-left transition-colors ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-surface-container/60 text-on-surface-variant hover:border-primary/40 hover:bg-primary/5"
                        }`}
                      >
                        <Icon size={16} />
                        <span className="block mt-2 text-xs font-semibold">{label}</span>
                        <span className="block mt-0.5 text-[10px] opacity-70">{hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">登录账号</label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder={userType === "DOCTOR" ? "请输入工号" : userType === "PATIENT" ? "请输入病历号" : "请输入管理员账号"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">密码</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="请输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="motion-press absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-primary/5 hover:text-primary"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="motion-feedback-success rounded-xl border border-success/25 bg-success/10 p-3 text-sm text-success flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  登录成功，正在进入工作台
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="motion-press w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                {loading ? "验证中..." : "登录"}
              </button>
            </form>

            <div className="mt-6 border-t border-border pt-5">
              <p className="mb-3 text-center text-[11px] text-muted-foreground">演示账号</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["管理员", "admin"],
                  ["医生", "D001"],
                  ["患者", "P001"],
                  ["初始密码", "123456"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-primary/5 p-2.5 text-center">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="mt-0.5 block font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
