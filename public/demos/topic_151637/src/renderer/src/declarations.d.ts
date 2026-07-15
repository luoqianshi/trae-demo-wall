/**
 * Ambient module declarations for Plotly-related packages without TypeScript types.
 */

declare module 'react-plotly.js' {
  import type { FC } from 'react'
  interface PlotProps {
    data: any[]
    layout?: any
    config?: any
    style?: React.CSSProperties
    useResizeHandler?: boolean
    [key: string]: any
  }
  const Plot: FC<PlotProps>
  export default Plot
}

declare module 'react-plotly.js/factory' {
  import type PlotlyComponent from 'react-plotly.js'
  const createPlotlyComponent: (plotly: any) => typeof PlotlyComponent
  export default createPlotlyComponent
}

declare module 'plotly.js-dist-min' {
  const Plotly: any
  export default Plotly
}
