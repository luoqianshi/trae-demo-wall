import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { useAppStore } from '../store/appStore'
import { CHART_STYLE_PRESETS } from '../../../agents/shared/styleGuide'

interface ChartViewProps {
  embedded?: boolean
}

export default function ChartView({ embedded = false }: ChartViewProps) {
  const { charts, settings } = useAppStore()

  // 获取当前活跃的风格预设
  const activePreset = useMemo(() => {
    const customStyles = settings.customStyles || []
    const custom = customStyles.find((s) => s.id === settings.activeStyleId)
    if (custom) {
      return {
        id: custom.id,
        name: custom.name,
        plotlyTemplate: {
          paper_bgcolor: '#ffffff',
          plot_bgcolor: '#ffffff',
          font: { color: '#1a1a1a', family: 'Inter, PingFang SC, sans-serif' },
          colorway: ['#c2410c', '#d97706', '#b45309', '#92400e', '#78350f'],
        },
      }
    }
    return CHART_STYLE_PRESETS.find((s) => s.id === settings.activeStyleId) || CHART_STYLE_PRESETS[1]
  }, [settings.activeStyleId, settings.customStyles])

  if (!charts || charts.length === 0) {
    return null
  }

  return (
    <div className="chart-view">
      {!embedded && <div className="panel-title">图表</div>}
      {(charts || []).map((chart, i) => {
        const figure = chart.figure as Record<string, unknown>
        const data = (figure.data as unknown[]) || []
        const layout = (figure.layout as Record<string, unknown>) || {}
        const template = activePreset.plotlyTemplate as Record<string, unknown>

        // 合并风格预设到图表布局
        const mergedLayout: Record<string, unknown> = {
          ...template,
          ...layout,
          // 保持原图表的标题和轴标签
          title: layout.title,
          xaxis: { ...(template.xaxis as object || {}), ...(layout.xaxis as object || {}) },
          yaxis: { ...(template.yaxis as object || {}), ...(layout.yaxis as object || {}) },
          // 响应式
          autosize: true,
          margin: { l: 50, r: 20, t: 40, b: 50 },
        }

        return (
          <div key={i} className={`chart-card ${embedded ? 'embedded' : ''}`}>
            <div className="chart-title">
              <div className="chart-title-bar" />
              <span>{chart.title}</span>
            </div>
            {chart.reasoning && (
              <div className="chart-reasoning">{chart.reasoning}</div>
            )}
            <Plot
              data={data as Plotly.Data[]}
              layout={mergedLayout}
              config={{
                responsive: true,
                displayModeBar: false,
                scrollZoom: false,
              }}
              useResizeHandler
              style={{ width: '100%', minHeight: embedded ? 240 : 300, maxHeight: embedded ? 360 : 420 }}
            />
          </div>
        )
      })}
    </div>
  )
}