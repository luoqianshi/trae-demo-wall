import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import type { DatasetSummary } from '../../../types/shared'

const TableIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

interface DataSourceSelectorProps {
  embedded?: boolean
}

export default function DataSourceSelector({ embedded = false }: DataSourceSelectorProps) {
  const { datasets, selectedDataset, loadSamples, selectDataset, clearDataset, deleteDataset } = useAppStore()

  useEffect(() => {
    if (datasets.length === 0) {
      loadSamples()
    }
  }, [datasets.length, loadSamples])

  const handleSelect = (id: string) => {
    if (selectedDataset?.id === id) {
      clearDataset()
    } else {
      selectDataset(id)
    }
  }

  return (
    <div className="data-source-selector">
      {!embedded && (
        <div className="panel-title">
          <span className="panel-icon">
            <TableIcon />
            数据源
          </span>
          {selectedDataset && (
            <button className="panel-clear-btn" onClick={clearDataset} title="取消选中">
              清除
            </button>
          )}
        </div>
      )}
      <div className="sample-list">
        {datasets.map((ds) => (
          <SampleItem
            key={ds.id}
            dataset={ds}
            selected={selectedDataset?.id === ds.id}
            onSelect={() => handleSelect(ds.id)}
            onDelete={ds.source === 'upload' ? () => deleteDataset(ds.id) : undefined}
          />
        ))}
        {datasets.length === 0 && (
          <div className="panel-placeholder">暂无样例数据</div>
        )}
      </div>
    </div>
  )
}

function SampleItem({
  dataset,
  selected,
  onSelect,
  onDelete
}: {
  dataset: DatasetSummary
  selected: boolean
  onSelect: () => void
  onDelete?: () => void
}) {
  return (
    <button
      className={`sample-item ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <span className="sample-icon">
        <TableIcon />
      </span>
      <span className="sample-text">
        <span className="sample-name">{dataset.name}</span>
        {dataset.rowCount !== undefined && (
          <span className="sample-meta">{dataset.rowCount} 行</span>
        )}
      </span>
      {onDelete && (
        <span
          className="sample-delete"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          title="删除数据集"
        >
          <CloseIcon />
        </span>
      )}
    </button>
  )
}