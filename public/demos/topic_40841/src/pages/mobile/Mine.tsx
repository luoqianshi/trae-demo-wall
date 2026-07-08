import { useNavigate } from 'react-router-dom'
import { Modal, message } from 'antd'
import { useState } from 'react'
import {
  Heart, Upload, ShieldCheck, Settings, RefreshCw, ChevronRight,
  User, Award, AlertCircle,
} from 'lucide-react'
import { useStore } from '@/store'

export default function Mine() {
  const navigate = useNavigate()
  const resetDemoData = useStore(s => s.resetDemoData)
  const favoriteIds = useStore(s => s.favoriteIds)
  const uploads = useStore(s => s.uploads)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  const pendingCount = uploads.filter(u => u.status === 'pending').length

  const menuItems = [
    {
      icon: Heart,
      label: '收藏活动',
      desc: `已收藏 ${favoriteIds.length} 个活动`,
      color: 'var(--danger)',
      bg: 'var(--danger-bg)',
      onClick: () => navigate('/app/favorites'),
    },
    {
      icon: Upload,
      label: '我的上传',
      desc: pendingCount > 0 ? `${pendingCount} 条待审核` : `共 ${uploads.length} 条上传`,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      onClick: () => navigate('/app/my-uploads'),
    },
    {
      icon: ShieldCheck,
      label: '防骗指南',
      desc: '识别虚假活动，保护自身权益',
      color: 'var(--info)',
      bg: 'var(--info-bg)',
      onClick: () => navigate('/app/guide'),
    },
    {
      icon: Settings,
      label: '管理后台',
      desc: '审核上传、管理活动、查看风险日志',
      color: 'var(--info)',
      bg: 'var(--info-bg)',
      onClick: () => navigate('/admin'),
    },
  ]

  const handleReset = () => {
    resetDemoData()
    message.success('演示数据已重置')
    setResetConfirmOpen(false)
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <div className="mine-hero">
        <div className="flex items-center gap-3">
          <div className="mine-hero__avatar">
            <User size={26} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold">演示用户</h2>
              <span className="flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                <Award size={11} />
                活跃侦探
              </span>
            </div>
            <p className="mt-1 text-[12px] text-white/80">守护身边的活动安全</p>
          </div>
        </div>

        <div className="mine-stat-grid">
          <div className="mine-stat-grid__item">
            <div className="mine-stat-grid__num">{favoriteIds.length}</div>
            <div className="mine-stat-grid__label">收藏</div>
          </div>
          <div className="mine-stat-grid__item">
            <div className="mine-stat-grid__num">{uploads.length}</div>
            <div className="mine-stat-grid__label">上传</div>
          </div>
          <div className="mine-stat-grid__item">
            <div className="mine-stat-grid__num">{pendingCount}</div>
            <div className="mine-stat-grid__label">待审核</div>
          </div>
        </div>
      </div>

      <div className="mt-4 px-4">
        <div className="mobile-card overflow-hidden">
          {menuItems.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={i}
                type="button"
                onClick={item.onClick}
                className="mobile-menu-row"
              >
                <div
                  className="mobile-menu-row__icon"
                  style={{ backgroundColor: item.bg }}
                >
                  <Icon size={18} style={{ color: item.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold text-ink">{item.label}</div>
                  <div className="mt-0.5 truncate text-[12px] text-ink-muted">{item.desc}</div>
                </div>
                <ChevronRight size={18} className="flex-shrink-0 text-ink-faint" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 px-4">
        <div className="mobile-card overflow-hidden">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="mobile-menu-row"
          >
            <div className="mobile-menu-row__icon bg-warning-bg">
              <RefreshCw size={18} className="text-warning" />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-ink">重置演示数据</div>
              <div className="text-[12px] text-ink-muted">恢复活动、上传、收藏到初始状态</div>
            </div>
            <ChevronRight size={18} className="text-ink-faint" />
          </button>
        </div>
      </div>

      <p className="mt-8 pb-6 text-center text-[11px] text-ink-muted">Active Detective v1.0</p>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-warning" />
            <span>重置演示数据</span>
          </div>
        }
        open={resetConfirmOpen}
        onCancel={() => setResetConfirmOpen(false)}
        onOk={handleReset}
        okText="确认重置"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p className="py-2 text-[14px] leading-relaxed text-ink-secondary">
          确认要重置所有演示数据吗？此操作将清除收藏、上传记录，并恢复所有活动到初始状态。
        </p>
      </Modal>
    </div>
  )
}
