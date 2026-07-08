import type { ReactNode } from 'react'

interface Tab {
  key: string
  label: string
}

interface Props {
  title: string
  icon?: ReactNode
  subtitle?: string
  tabs?: Tab[]
  activeTab?: string
  onTabChange?: (key: string) => void
}

export default function MobileSubpageHeader({
  title,
  icon,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
}: Props) {
  return (
    <header className="mobile-header-glass sticky top-0 z-30 px-4 pb-3 pt-3">
      <div className="mobile-channel-title">
        {icon && <span className="mobile-channel-title__icon">{icon}</span>}
        <div>
          <h1 className="text-[18px] font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[12px] text-ink-muted">{subtitle}</p>}
        </div>
      </div>

      {tabs && tabs.length > 0 && (
        <div className="mobile-segmented mt-3" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => onTabChange?.(tab.key)}
              className={`mobile-segmented__item${activeTab === tab.key ? ' mobile-segmented__item--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
