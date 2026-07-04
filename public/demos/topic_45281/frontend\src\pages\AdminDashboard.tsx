import React, { useState, useEffect, useCallback } from "react";
import {
  Shield, Users, Activity, Key, Lock, Unlock, RefreshCw, Search,
  Eye, EyeOff, Loader2, AlertTriangle, CheckCircle, XCircle,
  UserCheck, UserX, LogIn, ChevronLeft, ChevronRight, Filter, Trash2,
  Plus, Edit
} from "lucide-react";
import { authService } from "@/lib/services";
import type { User } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const PAGE_SIZE = 15;

interface LoginLog {
  id: number;
  accountId: number;
  loginName: string;
  userType: string;
  loginTime: string;
  loginIp: string;
  loginResult: string;
  failReason: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isCinnamoroll = theme === "cinnamoroll";

  const themeBorder = isCinnamoroll ? "border-sky-200" : "border-pink-200";
  const themeText = isCinnamoroll ? "text-sky-500" : "text-pink-500";
  const themeTextDark = isCinnamoroll ? "text-sky-600" : "text-pink-600";
  const themeTextDarkest = isCinnamoroll ? "text-sky-700" : "text-pink-700";
  const themeBg = isCinnamoroll ? "bg-sky-50" : "bg-pink-50";
  const themeGradFrom = isCinnamoroll ? "from-sky-400" : "from-pink-400";
  const themeGradTo = isCinnamoroll ? "to-sky-300" : "to-pink-300";
  const themeStatusDot = isCinnamoroll ? "bg-sky-400" : "bg-pink-400";
  const themeStatusText = isCinnamoroll ? "text-sky-500" : "text-pink-500";
  const themeStatusBg = isCinnamoroll ? "bg-sky-100" : "bg-pink-100";
  const themeHoverBg = isCinnamoroll ? "hover:bg-sky-50" : "hover:bg-pink-50";

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<User[]>([]);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(0);

  const [activeTab, setActiveTab] = useState<"accounts" | "logs">("accounts");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ loginName: "", userType: "DOCTOR", relateId: "" });

  useEffect(() => {
    if (user?.userType !== "ADMIN") return;
    loadData();
  }, [user]);

  useEffect(() => {
    let result = accounts;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((a) =>
        a.loginName?.toLowerCase().includes(term)
      );
    }
    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (typeFilter) {
      result = result.filter((a) => a.userType === typeFilter);
    }
    setFilteredAccounts(result);
    setPage(1);
  }, [searchTerm, statusFilter, typeFilter, accounts]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accRes, logRes] = await Promise.all([
        authService.getAccounts(),
        authService.getLoginLogs(0, 50),
      ]);
      setAccounts(accRes.accounts || []);
      setFilteredAccounts(accRes.accounts || []);
      setLogs(logRes.logs || []);
      setLogsTotal(logRes.total || 0);
    } catch (e) {
      console.error("加载管理数据失败:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (offset: number) => {
    try {
      const res = await authService.getLoginLogs(offset, PAGE_SIZE);
      setLogs(res.logs || []);
      setLogsTotal(res.total || 0);
      setLogsPage(offset / PAGE_SIZE);
    } catch (e) {
      console.error("加载日志失败:", e);
    }
  };

  const handleResetPwd = async (accountId: number) => {
    setActionLoading(accountId);
    try {
      await authService.resetPassword(accountId);
      alert("密码已重置为 123456");
    } catch (e) {
      alert("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlock = async (accountId: number) => {
    setActionLoading(accountId);
    try {
      await authService.unlock(accountId);
      await loadData();
    } catch (e) {
      alert("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (accountId: number, status: string) => {
    setActionLoading(accountId);
    try {
      await authService.updateAccount(accountId, { status });
      await loadData();
    } catch (e) {
      alert("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.loginName.trim()) {
      alert("请输入登录名");
      return;
    }
    try {
      await authService.createAccount({
        loginName: newAccount.loginName,
        userType: newAccount.userType,
        relateId: parseInt(newAccount.relateId) || 0,
      });
      alert("账号创建成功，默认密码: 123456");
      setCreateOpen(false);
      setNewAccount({ loginName: "", userType: "DOCTOR", relateId: "" });
      await loadData();
    } catch (e) {
      alert("创建失败");
    }
  };

  const totalPages = Math.ceil(filteredAccounts.length / PAGE_SIZE);
  const pagedAccounts = filteredAccounts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total: accounts.length,
    active: accounts.filter((a) => a.status === "ACTIVE").length,
    locked: accounts.filter((a) => a.status === "LOCKED").length,
  };

  const STATUS_NAMES: Record<string, string> = { ACTIVE: "正常", LOCKED: "锁定", DISABLED: "禁用" };
  const TYPE_NAMES: Record<string, string> = { DOCTOR: "医生", PATIENT: "患者", ADMIN: "管理员" };

  if (user?.userType !== "ADMIN") {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Shield size={48} className="text-red-300" />
        <p className="text-sm text-red-400 font-medium">无权限访问</p>
        <p className="text-xs text-gray-400">仅管理员可访问此页面</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className={`animate-spin ${themeText}`} size={40} />
        <p className={`${themeText} text-sm`}>加载管理数据中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${themeTextDarkest}`}>管理员控制台</h1>
          <p className={`text-xs ${themeText} mt-0.5`}>系统账户管理 · 登录审计日志</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs ${themeStatusText} ${themeStatusBg} px-3 py-1 rounded-full`}>
            <span className={`w-1.5 h-1.5 ${themeStatusDot} rounded-full`} />
            管理员模式
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`bg-white rounded-2xl border ${themeBorder} p-5`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${themeBg} rounded-xl flex items-center justify-center`}>
              <Users className={themeText} size={20} />
            </div>
            <div>
              <p className={`text-lg font-bold ${themeTextDarkest}`}>{stats.total}</p>
              <p className={`text-[11px] ${themeText}`}>系统总账号</p>
            </div>
          </div>
        </div>
        <div className={`bg-white rounded-2xl border ${themeBorder} p-5`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <UserCheck className="text-green-400" size={20} />
            </div>
            <div>
              <p className={`text-lg font-bold ${themeTextDarkest}`}>{stats.active}</p>
              <p className={`text-[11px] ${themeText}`}>正常账号</p>
            </div>
          </div>
        </div>
        <div className={`bg-white rounded-2xl border ${themeBorder} p-5`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <UserX className="text-orange-400" size={20} />
            </div>
            <div>
              <p className={`text-lg font-bold ${themeTextDarkest}`}>{stats.locked}</p>
              <p className={`text-[11px] ${themeText}`}>锁定/禁用</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`bg-white rounded-2xl border ${themeBorder} overflow-hidden`}>
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              activeTab === "accounts"
                ? `${themeText} border-b-2 ${isCinnamoroll ? "border-sky-400" : "border-pink-400"}`
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            账号管理
          </button>
          <button
            onClick={() => { setActiveTab("logs"); loadLogs(0); }}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              activeTab === "logs"
                ? `${themeText} border-b-2 ${isCinnamoroll ? "border-sky-400" : "border-pink-400"}`
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            登录日志
          </button>
        </div>

        {activeTab === "accounts" && (
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  placeholder="搜索登录名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-300"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-300"
              >
                <option value="">全部状态</option>
                <option value="ACTIVE">正常</option>
                <option value="LOCKED">锁定</option>
                <option value="DISABLED">禁用</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-300"
              >
                <option value="">全部类型</option>
                <option value="DOCTOR">医生</option>
                <option value="PATIENT">患者</option>
                <option value="ADMIN">管理员</option>
              </select>
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-1.5 text-xs bg-blue-500 text-white px-3 py-2 rounded-xl hover:bg-blue-600 transition-colors ml-auto"
              >
                <Plus size={14} />
                新建账号
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-400 font-medium">ID</th>
                    <th className="text-left py-2 text-gray-400 font-medium">登录名</th>
                    <th className="text-left py-2 text-gray-400 font-medium">类型</th>
                    <th className="text-left py-2 text-gray-400 font-medium">状态</th>
                    <th className="text-left py-2 text-gray-400 font-medium">失败次数</th>
                    <th className="text-left py-2 text-gray-400 font-medium">最后登录</th>
                    <th className="text-left py-2 text-gray-400 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedAccounts.map((acc) => (
                    <tr key={acc.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 text-gray-400">{acc.id}</td>
                      <td className="py-2.5 font-medium text-gray-700">{acc.loginName}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          acc.userType === "ADMIN"
                            ? "bg-purple-100 text-purple-600"
                            : acc.userType === "DOCTOR"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-green-100 text-green-600"
                        }`}>
                          {TYPE_NAMES[acc.userType] || acc.userType}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          acc.status === "ACTIVE"
                            ? "bg-green-100 text-green-600"
                            : acc.status === "LOCKED"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-red-100 text-red-600"
                        }`}>
                          {STATUS_NAMES[acc.status] || acc.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500">{(acc as any).loginFailCount || 0}</td>
                      <td className="py-2.5 text-gray-400 text-[11px]">
                        {(acc as any).lastLoginTime
                          ? new Date((acc as any).lastLoginTime).toLocaleString("zh-CN")
                          : "-"}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleResetPwd(acc.id)}
                            disabled={actionLoading === acc.id}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
                            title="重置密码"
                          >
                            {actionLoading === acc.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Key size={14} />
                            )}
                          </button>
                          {acc.status === "LOCKED" && (
                            <button
                              onClick={() => handleUnlock(acc.id)}
                              disabled={actionLoading === acc.id}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-400 hover:text-green-600 transition-colors"
                              title="解锁"
                            >
                              <Unlock size={14} />
                            </button>
                          )}
                          {acc.status === "ACTIVE" && acc.userType !== "ADMIN" && (
                            <button
                              onClick={() => handleUpdateStatus(acc.id, "LOCKED")}
                              disabled={actionLoading === acc.id}
                              className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-400 hover:text-orange-600 transition-colors"
                              title="锁定"
                            >
                              <Lock size={14} />
                            </button>
                          )}
                          {acc.status !== "DISABLED" && acc.userType !== "ADMIN" && (
                            <button
                              onClick={() => handleUpdateStatus(acc.id, "DISABLED")}
                              disabled={actionLoading === acc.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                              title="禁用"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pagedAccounts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        <Shield size={24} className="mx-auto mb-2 opacity-50" />
                        暂无匹配账号
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <span className="text-[11px] text-gray-400">
                  共 {filteredAccounts.length} 个账号，第 {page}/{totalPages} 页
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-400 font-medium">时间</th>
                    <th className="text-left py-2 text-gray-400 font-medium">登录名</th>
                    <th className="text-left py-2 text-gray-400 font-medium">类型</th>
                    <th className="text-left py-2 text-gray-400 font-medium">IP</th>
                    <th className="text-left py-2 text-gray-400 font-medium">结果</th>
                    <th className="text-left py-2 text-gray-400 font-medium">失败原因</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 text-gray-500 text-[11px]">
                        {log.loginTime ? new Date(log.loginTime).toLocaleString("zh-CN") : "-"}
                      </td>
                      <td className="py-2.5 font-medium text-gray-700">{log.loginName}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">
                          {TYPE_NAMES[log.userType] || log.userType}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-400 font-mono text-[11px]">{log.loginIp || "-"}</td>
                      <td className="py-2.5">
                        {log.loginResult === "SUCCESS" ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle size={12} />
                            成功
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle size={12} />
                            失败
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-gray-400 text-[11px]">{log.failReason || "-"}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        <LogIn size={24} className="mx-auto mb-2 opacity-50" />
                        暂无登录日志
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {logsTotal > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <span className="text-[11px] text-gray-400">共 {logsTotal} 条记录</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => loadLogs(Math.max(0, logsPage * PAGE_SIZE - PAGE_SIZE))}
                    disabled={logsPage === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => loadLogs((logsPage + 1) * PAGE_SIZE)}
                    disabled={((logsPage + 1) * PAGE_SIZE) >= logsTotal}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {createOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setCreateOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-sm font-bold ${themeTextDarkest} mb-4`}>新建账号</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">登录名</label>
                <input
                  type="text"
                  value={newAccount.loginName}
                  onChange={(e) => setNewAccount({ ...newAccount, loginName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-300"
                  placeholder="如: D0011"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">用户类型</label>
                <select
                  value={newAccount.userType}
                  onChange={(e) => setNewAccount({ ...newAccount, userType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-300"
                >
                  <option value="DOCTOR">医生</option>
                  <option value="PATIENT">患者</option>
                  <option value="ADMIN">管理员</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">关联实体ID (可选)</label>
                <input
                  type="number"
                  value={newAccount.relateId}
                  onChange={(e) => setNewAccount({ ...newAccount, relateId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-300"
                  placeholder="医生ID或患者ID"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setCreateOpen(false)} className="flex-1 py-2 text-xs border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={handleCreateAccount} className={`flex-1 py-2 text-xs text-white rounded-xl bg-gradient-to-r ${themeGradFrom} ${themeGradTo} hover:opacity-90 transition-opacity`}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
