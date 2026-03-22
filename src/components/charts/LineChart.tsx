'use client'
import ReactECharts from 'echarts-for-react'
import type { TimeSeriesPoint } from '@/types/db.types'

interface LineChartProps {
  data: TimeSeriesPoint[]
  color?: string
  height?: number
  unit?: string
}

export default function LineChart({ data, color = '#006DFF', height = 80, unit = '' }: LineChartProps) {
  const option = {
    grid: { top: 4, bottom: 4, left: 4, right: 4 },
    xAxis: { type: 'time', show: false },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line',
      data: data.map(d => [d.timestamp, d.value]),
      smooth: true,
      symbol: 'none',
      lineStyle: { color, width: 2 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + '55' },
            { offset: 1, color: color + '00' },
          ]},
      },
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#19293E',
      borderColor: '#2A3D55',
      textStyle: { color: '#E0E6ED', fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0]
        const t = new Date(p.value[0]).toLocaleTimeString('ko-KR')
        return `${t}<br/><b>${Math.round(p.value[1])}${unit}</b>`
      },
    },
    backgroundColor: 'transparent',
  }
  return <ReactECharts option={option} style={{ height, width: '100%' }} notMerge />
}
