import React from 'react'

import type { TableField, TableRow } from '@/worksheetTemplates/types'

type Props = {
  field: TableField
  rows: TableRow[]
}

// Màu cố định (không dùng biến CSS của Bootstrap) để dùng được cả ở frontend lẫn /admin; theo token ở styles/_variables.scss
const COLORS = { grid: '#dfe3e6', axis: '#575760', line: '#15803d', point: '#14532d' }

/**
 * Lưới tỉ lệ % theo buổi như mẫu giấy: trục dọc theo `chart.step`, trục ngang là các dòng của bảng.
 * Buổi chưa có giá trị không có điểm; đường nối các buổi có giá trị liên tiếp theo thứ tự.
 */
export const TemplateChart = ({ field, rows }: Props) => {
  const { chart } = field

  if (!chart) return null

  const width = 640
  const height = 300
  const pad = { top: 16, right: 16, bottom: 36, left: 48 }
  const plotWidth = width - pad.left - pad.right
  const plotHeight = height - pad.top - pad.bottom
  const count = Math.max(rows.length, 1)
  const x = (index: number) => pad.left + (plotWidth / count) * (index + 0.5)
  const y = (value: number) => pad.top + plotHeight - ((value - chart.min) / (chart.max - chart.min)) * plotHeight

  const ticks: number[] = []
  for (let value = chart.min; value <= chart.max; value += chart.step) ticks.push(value)

  const points = rows
    .map((row, index) => ({ index, value: row[chart.valueColumn] }))
    .filter((point): point is { index: number; value: number } => typeof point.value === 'number')

  const summary = points.length
    ? points.map((point) => `Buổi ${point.index + 1}: ${point.value}%`).join(', ')
    : 'Chưa có dữ liệu'

  return (
    <svg
      aria-label={`Biểu đồ ${field.label}. ${summary}`}
      role="img"
      style={{ display: 'block', height: 'auto', maxWidth: '100%', width: '100%' }}
      viewBox={`0 0 ${width} ${height}`}
    >
      {ticks.map((value) => (
        <g key={value}>
          <line stroke={COLORS.grid} x1={pad.left} x2={width - pad.right} y1={y(value)} y2={y(value)} />
          <text fill={COLORS.axis} fontSize="12" textAnchor="end" x={pad.left - 8} y={y(value) + 4}>
            {value}%
          </text>
        </g>
      ))}
      {rows.map((_, index) => (
        <g key={index}>
          <line
            stroke={COLORS.grid}
            x1={pad.left + (plotWidth / count) * index}
            x2={pad.left + (plotWidth / count) * index}
            y1={pad.top}
            y2={pad.top + plotHeight}
          />
          <text fill={COLORS.axis} fontSize="12" textAnchor="middle" x={x(index)} y={height - pad.bottom + 18}>
            {index + 1}
          </text>
        </g>
      ))}
      <line stroke={COLORS.grid} x1={width - pad.right} x2={width - pad.right} y1={pad.top} y2={pad.top + plotHeight} />
      <text fill={COLORS.axis} fontSize="12" textAnchor="middle" x={pad.left + plotWidth / 2} y={height - 4}>
        Buổi
      </text>
      {points.length > 1 && (
        <polyline
          fill="none"
          points={points.map((point) => `${x(point.index)},${y(point.value)}`).join(' ')}
          stroke={COLORS.line}
          strokeWidth="2.5"
        />
      )}
      {points.map((point) => (
        <circle cx={x(point.index)} cy={y(point.value)} fill={COLORS.point} key={point.index} r="4.5" />
      ))}
    </svg>
  )
}
