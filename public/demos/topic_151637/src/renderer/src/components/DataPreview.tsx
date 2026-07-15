import { useAppStore } from '../store/appStore'

interface DataPreviewProps {
  embedded?: boolean
}

export default function DataPreview({ embedded = false }: DataPreviewProps) {
  const { selectedDataset } = useAppStore()

  if (!selectedDataset) {
    return (
      <div className="data-preview">
        {!embedded && <div className="panel-title">数据预览</div>}
        <div className="panel-placeholder">{embedded ? '选择数据集以预览' : '请从左侧选择数据源'}</div>
      </div>
    )
  }

  const { schema, head, name } = selectedDataset
  const columns = schema.columns

  return (
    <div className="data-preview">
      <div className="section-label">数据预览</div>
      <div className="data-preview-header">
        <span className="data-preview-name">{name}</span>
        <span className="data-preview-shape">
          {schema.shape[0]} 行 × {schema.shape[1]} 列
        </span>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>
                  <span className="col-name">{col}</span>
                  <span className="col-type">{schema.dtypes[col] || 'unknown'}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {head.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col}>{formatCell(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'number') {
    return Number.isInteger(val) ? String(val) : val.toFixed(2)
  }
  return String(val)
}
