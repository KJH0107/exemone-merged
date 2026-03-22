'use client'
import ReactECharts from 'echarts-for-react'

interface DonutChartProps {
  value: number
  max?: number
  label: string
  unit?: string
  color?: string
  size?: number
}

export default function DonutChart({ value, max = 100, label, unit = '%', color = '#006DFF', size = 120 }: DonutChartProps) {
  const pct = max === 100 ? value : Math.round((value / max) * 100)
  const option = {
    series: [{
      type: 'gauge',
      startAngle: 90, endAngle: -270,
      radius: '85%',
      pointer: { show: false },
      progress: { show: true, overlap: false, roundCap: true, clip: false,
        itemStyle: { color } },
      axisLine: { lineStyle: { width: 10, color: [[1, '#1E3050']] } },
      splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
      data: [{ value: pct, detail: {
        valueAnimation: true, offsetCenter: ['0%', '0%'],
        fontSize: 18, fontWeight: 700, color: '#E0E6ED',
        formatter: `{value}${unit}`,
      }}],
      title: { show: false },
    }],
    backgroundColor: 'transparent',
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <ReactECharts option={option} style={{ width: size, height: size }} notMerge />
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
      {max !== 100 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {value.toLocaleString()} / {max.toLocaleString()}{unit === '%' ? '' : ` ${unit}`}
        </div>
      )}
    </div>
  )
}
