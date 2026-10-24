import React from 'react'

import type { TableColumn } from '@/worksheetTemplates/types'

type Props = {
  cellClassName?: string
  cellStyle?: React.CSSProperties
  columns: TableColumn[]
  // Cột nhãn đầu dòng (ví dụ "Buổi"), đặt trước các cột dữ liệu
  leadingLabel?: string
}

/**
 * Tiêu đề bảng theo mẫu giấy: cột có `group` được gom dưới một ô tiêu đề chung
 * (ví dụ "Số cơ hội / Cách trẻ thực hiện" phía trên các cột 1–10).
 */
export const TableHeader = ({ cellClassName, cellStyle, columns, leadingLabel }: Props) => {
  const hasGroups = columns.some((column) => column.group)
  const top: { key: string; label: string; colSpan: number; rowSpan: number }[] = []

  for (const column of columns) {
    const last = top[top.length - 1]

    if (column.group && last && last.label === column.group && last.rowSpan === 1) {
      last.colSpan += 1
    } else {
      top.push({
        key: column.key,
        label: column.group ?? column.label,
        colSpan: 1,
        rowSpan: column.group || !hasGroups ? 1 : 2,
      })
    }
  }

  return (
    <thead>
      <tr>
        {leadingLabel !== undefined && (
          <th className={cellClassName} rowSpan={hasGroups ? 2 : 1} scope="col" style={cellStyle}>
            {leadingLabel}
          </th>
        )}
        {top.map((cell) => (
          <th
            className={cellClassName}
            colSpan={cell.colSpan}
            key={cell.key}
            rowSpan={cell.rowSpan}
            scope={cell.colSpan > 1 ? 'colgroup' : 'col'}
            style={cellStyle}
          >
            {cell.label}
          </th>
        ))}
      </tr>
      {hasGroups && (
        <tr>
          {columns
            .filter((column) => column.group)
            .map((column) => (
              <th className={cellClassName} key={column.key} scope="col" style={cellStyle}>
                {column.label}
              </th>
            ))}
        </tr>
      )}
    </thead>
  )
}
