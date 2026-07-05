// 登录注册页 - 苹果风极简

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import HeroBackground from "@/components/HeroBackground";
import { useStore } from "@/store/useStore";

type Mode = "login" | "register";

export default function Login() {
  const navigate = useNavigate();
  const { user, login, register, loginAsGuest } = useStore();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (mode === "register") {
        if (!username.trim()) {
          setError("请输入用户名");
          setLoading(false);
          return;
        }
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError("请输入有效的邮箱");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("密码至少 6 位");
          setLoading(false);
          return;
        }
        if (password !== confirm) {
          setError("两次密码不一致");
          setLoading(false);
          return;
        }
        if (!agree) {
          setError("请同意服务条款");
          setLoading(false);
          return;
        }
        const result = register(username, email, password);
        if (!result.success) {
          setError(result.message);
          setLoading(false);
          return;
        }
        navigate("/");
      } else {
        if (!account.trim()) {
          setError("请输入账号");
          setLoading(false);
          return;
        }
        if (!password) {
          setError("请输入密码");
          setLoading(false);
          return;
        }
        const result = login(account, password);
        if (!result.success) {
          setError(result.message);
          setLoading(false);
          return;
        }
        navigate("/");
      }
      setLoading(false);
    }, 400);
  };

  const handleGuest = () => {
    loginAsGuest();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* 背景装饰 */}
      <HeroBackground />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in-up">
          <BrandLogo size="lg" />
        </div>

        {/* 标题 */}
        <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            欢迎使用 easy图图
          </h1>
          <p className="mt-2 text-gray-500 text-base">
            简单上手，轻松掌握机械制图
          </p>
        </div>

        {/* 卡片 */}
        <div
          className="bg-white rounded-3xl shadow-soft-xl border border-gray-100 p-7 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          {/* 切换 */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            <button
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
                mode === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              登录
            </button>
            <button
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
                mode === "register"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  用户名
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" style={{ width: "18px", height: "18px" }} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}

            {mode === "register" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  邮箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" style={{ width: "18px", height: "18px" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  账号
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" style={{ width: "18px", height: "18px" }} />
                  <input
                    type="text"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder="邮箱或用户名（演示：demo）"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" style={{ width: "18px", height: "18px" }} />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（演示：123456）"
                  className="input-field pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" style={{ width: "18px", height: "18px" }} />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="请再次输入密码"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}

            {mode === "register" && (
              <label className="flex items-start gap-2 text-sm text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 accent-apple-500 w-4 h-4"
                />
                <span>
                  我已阅读并同意
                  <span className="text-apple-500">《服务条款》</span>
                  和
                  <span className="text-apple-500">《隐私政策》</span>
                </span>
              </label>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-apple-600 bg-apple-50 border border-apple-100 rounded-xl px-3.5 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  处理中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === "login" ? "登录" : "注册"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {mode === "login" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-400">或</span>
                </div>
              </div>

              <button
                onClick={handleGuest}
                className="w-full py-3 rounded-full bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition-colors"
              >
                以游客身份访问
              </button>

              <p className="mt-5 text-center text-xs text-gray-400">
                演示账号：<span className="text-apple-500 font-mono">demo / 123456</span>
              </p>
            </>
          )}
        </div>

        {/* 底部信息 */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2025 easy图图 · 让制图学习更简单
        </p>
      </div>
    </div>
  );
}
