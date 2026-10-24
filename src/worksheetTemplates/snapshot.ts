import type { CellValue, TableField, TableRow, TemplateValues, WorksheetTemplate } from './types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Đọc bản chụp mẫu đã lưu (JSON) của bài nộp; null nếu là bài kiểu cũ hoặc dữ liệu không hợp lệ. */
export const readTemplateSnapshot = (value: unknown): WorksheetTemplate | null =>
  isRecord(value) && typeof value.code === 'string' && Array.isArray(value.sections)
    ? (value as WorksheetTemplate)
    : null

export const readTemplateValues = (value: unknown): TemplateValues => (isRecord(value) ? (value as TemplateValues) : {})

export const readRows = (value: CellValue | TableRow[] | undefined): TableRow[] =>
  Array.isArray(value) ? value.filter(isRecord) : []

export const readScalar = (value: CellValue | TableRow[] | undefined): CellValue =>
  Array.isArray(value) || value === undefined ? null : value

const pad = (value: number) => String(value).padStart(2, '0')

/** Hiển thị giá trị theo kiểu trường: ngày dd/mm/yyyy, tháng mm/yyyy, còn lại giữ nguyên. */
export const formatValue = (value: CellValue, type: string, suffix?: string): string => {
  if (value === null || value === '') return ''

  if (typeof value === 'number') return `${value}${suffix ?? ''}`

  if (type === 'date') {
    const [year, month, day] = value.split('-')
    return day ? `${day}/${month}/${year}` : value
  }

  if (type === 'month') {
    const [year, month] = value.split('-')
    return month ? `${pad(Number(month))}/${year}` : value
  }

  return value
}

/** Phụ đề trong danh sách bài nộp (ví dụ tên trẻ), lấy theo `subtitleField` của bản chụp mẫu. */
export const readSubtitle = (snapshotValue: unknown, dataValue: unknown): string | null => {
  const snapshot = readTemplateSnapshot(snapshotValue)

  if (!snapshot?.subtitleField) return null

  const field = snapshot.sections.flatMap((section) => section.fields).find((item) => item.key === snapshot.subtitleField)
  const value = readScalar(readTemplateValues(dataValue)[snapshot.subtitleField])

  return field && typeof value === 'string' ? `${field.label}: ${value}` : null
}

// "Buổi {n}" → tiêu đề cột "Buổi"
export const rowHeader = (field: TableField) => (field.rowLabel ?? '').replace('{n}', '').trim() || 'Dòng'
