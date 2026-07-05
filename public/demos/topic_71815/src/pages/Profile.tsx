import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Pencil,
  Check,
  X,
  LogOut,
  RefreshCw,
  CloudUpload,
  CloudDownload,
  Flame,
  ListChecks,
  PenLine,
  BookMarked,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import Layout from '@/components/Layout';
import InkButton from '@/components/InkButton';
import SealStamp from '@/components/SealStamp';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { cn, chineseDate, relativeTime } from '@/lib/utils';

function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export default function Profile() {
  const nav = useNavigate();
  const { user, updateNickname, logout, fetchMe } = useAuthStore();
  const {
    tasks,
    dictations,
    wrongChars,
    stats,
    syncing,
    lastSyncAt,
    syncError,
    pullFromServer,
    pushToServer,
  } = useAppStore();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.nickname || '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const masteredTasks = tasks.filter((t) => t.mastered).length;
  const pendingWrongChars = wrongChars.filter((w) => !w.mastered).length;

  const handleStartEdit = () => {
    setNameInput(user?.nickname || '');
    setEditingName(true);
    setNameError(null);
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setNameError(null);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('昵称不能为空');
      return;
    }
    if (trimmed.length > 20) {
      setNameError('昵称最多 20 个字');
      return;
    }
    setSavingName(true);
    try {
      await updateNickname(trimmed);
      setEditingName(false);
      setNameError(null);
    } catch {
      setNameError('保存失败，请重试');
    } finally {
      setSavingName(false);
    }
  };

  const handleSync = async () => {
    await pushToServer();
    await pullFromServer();
    await fetchMe();
  };

  const handleLogout = () => {
    logout();
    nav('/login', { replace: true });
  };

  const sealChar = (user?.nickname || '诵').slice(0, 1);

  return (
    <Layout title="用户中心" subtitle="PROFILE">
      <div className="space-y-8 animate-fade-up">
        {/* ============ 用户身份卡 ============ */}
        <section className="relative bg-paper border border-ink/10 rounded-sm p-6 md:p-8 shadow-float overflow-hidden">
          {/* 装饰：右上角朱砂晕染 */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-cinnabar/6 blur-2xl pointer-events-none" />
          <div className="absolute top-4 right-6 flex flex-col items-center gap-1 opacity-50 pointer-events-none">
            <div className="w-px h-10 bg-cinnabar/40" />
            <div className="w-1 h-1 rounded-full bg-cinnabar/60" />
          </div>

          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            {/* 印章头像 */}
            <div className="flex items-center gap-5">
              <SealStamp text={sealChar} size="xl" rotate={-4} />
              <div>
                <div className="font-en text-[10px] text-ink-mute tracking-widest mb-1">SHISONG · 学子</div>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={nameInput}
                      onChange={(e) => { setNameInput(e.target.value); setNameError(null); }}
                      maxLength={20}
                      autoFocus
                      className="font-display text-2xl bg-paper-deep/40 border border-cinnabar/40 rounded-sm px-2 py-0.5 outline-none focus:border-cinnabar w-48"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="text-celadon hover:bg-celadon/10 p-1 rounded-sm cursor-pointer disabled:opacity-40"
                      title="保存"
                    >
                      {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={savingName}
                      className="text-ink-mute hover:bg-ink/5 p-1 rounded-sm cursor-pointer disabled:opacity-40"
                      title="取消"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2 className="font-display text-2xl text-ink leading-none">
                      {user?.nickname || '未命名学子'}
                    </h2>
                    <button
                      onClick={handleStartEdit}
                      className="text-ink-mute hover:text-cinnabar opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="编辑昵称"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-2 text-sm text-ink-mute">
                  <Phone size={13} />
                  <span className="font-mono tabular">{user ? maskPhone(user.phone) : '-'}</span>
                </div>
              </div>
            </div>

            <div className="md:ml-auto md:text-right text-xs text-ink-mute space-y-1">
              <div>注册于 {user ? chineseDate(user.createdAt) : '-'}</div>
              <div className="flex md:justify-end items-center gap-1">
                <Clock size={11} />
                <span>注册 {user ? Math.max(1, Math.floor((Date.now() - user.createdAt) / 86400000) + 1) : 0} 天</span>
              </div>
            </div>
          </div>

          {nameError && (
            <div className="mt-3 px-3 py-1.5 text-xs text-cinnabar bg-cinnabar/8 border border-cinnabar/30 rounded-sm inline-block">
              {nameError}
            </div>
          )}
        </section>

        {/* ============ 数据统计 ============ */}
        <section>
          <SectionTitle title="学业概览" sub="OVERVIEW" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<ListChecks size={18} />}
              label="任务总数"
              value={tasks.length}
              hint={`已掌握 ${masteredTasks}`}
              tone="ink"
            />
            <StatCard
              icon={<PenLine size={18} />}
              label="默写次数"
              value={dictations.length}
              hint={`累计 ${stats.totalDictations}`}
              tone="cinnabar"
            />
            <StatCard
              icon={<BookMarked size={18} />}
              label="错字收录"
              value={wrongChars.length}
              hint={`待复习 ${pendingWrongChars}`}
              tone="ink"
            />
            <StatCard
              icon={<Flame size={18} />}
              label="连续打卡"
              value={stats.streakDays}
              hint="天"
              tone="cinnabar"
            />
          </div>
        </section>

        {/* ============ 同步状态 ============ */}
        <section>
          <SectionTitle title="云端同步" sub="SYNC" />
          <div className="bg-paper border border-ink/10 rounded-sm p-6 shadow-float">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    syncing ? 'bg-cinnabar animate-pulse' : syncError ? 'bg-cinnabar' : 'bg-celadon'
                  )} />
                  <span className="font-display text-lg text-ink">
                    {syncing ? '同步中…' : syncError ? '同步异常' : '已同步'}
                  </span>
                </div>
                <div className="text-xs text-ink-mute">
                  {lastSyncAt > 0 ? (
                    <>上次同步：{relativeTime(lastSyncAt)}</>
                  ) : (
                    <>尚未同步</>
                  )}
                  {user?.lastSyncAt ? <> · 服务端记录：{relativeTime(user.lastSyncAt)}</> : null}
                </div>
                {syncError && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-cinnabar">
                    <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{syncError}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <InkButton
                  variant="outline"
                  size="md"
                  onClick={pullFromServer}
                  disabled={syncing}
                >
                  {syncing ? <Loader2 size={14} className="animate-spin" /> : <CloudDownload size={14} />}
                  拉取
                </InkButton>
                <InkButton
                  variant="outline"
                  size="md"
                  onClick={pushToServer}
                  disabled={syncing}
                >
                  {syncing ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                  推送
                </InkButton>
                <InkButton
                  variant="primary"
                  size="md"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  立即同步
                </InkButton>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-ink/8 text-[11px] text-ink-mute leading-relaxed">
              本地改动会自动在 1.5 秒后推送至云端；「立即同步」会先推送本地、再拉取服务端最新数据。
              多设备登录时，请在另一设备点击「拉取」或「立即同步」以获取最新数据。
            </div>
          </div>
        </section>

        {/* ============ 账户操作 ============ */}
        <section>
          <SectionTitle title="账户" sub="ACCOUNT" />
          <div className="bg-paper border border-ink/10 rounded-sm p-6 shadow-float flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="font-display text-base text-ink mb-1">退出登录</div>
              <div className="text-xs text-ink-mute">
                退出后本地数据保留，重新登录会自动拉取云端数据。未登录时仍可离线使用基础功能。
              </div>
            </div>
            <InkButton variant="ghost" size="md" onClick={handleLogout} className="text-cinnabar border-cinnabar/30 hover:bg-cinnabar/8">
              <LogOut size={14} />
              退出登录
            </InkButton>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <span className="font-en text-[10px] text-ink-mute tracking-widest">{sub}</span>
      <div className="flex-1 h-px bg-ink/8" />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  tone: 'ink' | 'cinnabar';
}

function StatCard({ icon, label, value, hint, tone }: StatCardProps) {
  return (
    <div className="bg-paper border border-ink/10 rounded-sm p-5 shadow-float relative overflow-hidden group hover:border-ink/20 transition-colors">
      <div className={cn(
        'absolute top-0 left-0 w-1 h-full',
        tone === 'cinnabar' ? 'bg-cinnabar/60' : 'bg-ink/30'
      )} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-ink-mute tracking-wide">{label}</span>
        <span className={cn(
          'p-1.5 rounded-sm',
          tone === 'cinnabar' ? 'text-cinnabar bg-cinnabar/8' : 'text-ink-soft bg-ink/5'
        )}>
          {icon}
        </span>
      </div>
      <div className="font-display text-3xl text-ink tabular leading-none">
        {value}
        {hint && <span className="font-sans text-xs text-ink-mute ml-1.5">{hint}</span>}
      </div>
    </div>
  );
}
