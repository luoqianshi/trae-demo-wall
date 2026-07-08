import * as echarts from 'echarts/core'

// 按需引入图表类型
import { RadarChart, LineChart } from 'echarts/charts'

// 按需引入组件
import {
  TitleComponent,
  LegendComponent,
  GridComponent,
  TooltipComponent,
  RadarComponent,
  MarkAreaComponent,
} from 'echarts/components'

// 引入 Canvas 渲染器
import { CanvasRenderer } from 'echarts/renderers'

// 注册
echarts.use([
  TitleComponent,
  LegendComponent,
  GridComponent,
  TooltipComponent,
  RadarComponent,
  RadarChart,
  LineChart,
  MarkAreaComponent,
  CanvasRenderer,
])

export default echarts
