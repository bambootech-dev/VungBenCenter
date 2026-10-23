import type {
  CellValue,
  ColumnType,
  ScalarFieldType,
  TableField,
  TableRow,
  TemplateValues,
  WorksheetTemplate,
} from './types'

export type TemplateError = { path: string; message: string }

const DEFAULT_TEXT_MAX = 500

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isValidDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) return false

  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

const SCALAR_FORMATS: Record<Exclude<ScalarFieldType, 'text' | 'textarea'>, { test: (v: string) => boolean; message: string }> = {
  date: { test: isValidDate, message: 'Ngày không hợp lệ.' },
  month: { test: (v) => /^\d{4}-(0[1-9]|1[0-2])$/.test(v), message: 'Tháng/Năm không hợp lệ.' },
  time: { test: (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v), message: 'Giờ không hợp lệ.' },
}

type Result<T> = { ok: true; value: T } | { ok: false; message: string }

// Chuỗi: bỏ khoảng trắng đầu/cuối; chuỗi rỗng hoặc chỉ khoảng trắng → null (không có giá trị)
const normalizeString = (raw: unknown, maxLength: number): Result<string | null> => {
  if (raw === undefined || raw === null) return { ok: true, value: null }

  if (typeof raw !== 'string') return { ok: false, message: 'Giá trị phải là văn bản.' }

  const value = raw.normalize('NFC').trim()

  if (value === '') return { ok: true, value: null }

  if (value.length > maxLength) return { ok: false, message: `Tối đa ${maxLength} ký tự.` }

  return { ok: true, value }
}

const normalizeScalar = (raw: unknown, type: ScalarFieldType, maxLength?: number): Result<string | null> => {
  const result = normalizeString(raw, maxLength ?? (type === 'textarea' ? 2000 : DEFAULT_TEXT_MAX))

  if (!result.ok || result.value === null || type === 'text' || type === 'textarea') return result

  const format = SCALAR_FORMATS[type]

  return format.test(result.value) ? result : { ok: false, message: format.message }
}

const normalizeCell = (
  raw: unknown,
  column: { type: ColumnType; maxLength?: number; min?: number; max?: number },
): Result<CellValue> => {
  if (column.type === 'text') return normalizeString(raw, column.maxLength ?? DEFAULT_TEXT_MAX)

  // Số nguyên: nhận số hoặc chuỗi chữ số (giá trị từ ô nhập)
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    return { ok: true, value: null }
  }

  const value = typeof raw === 'string' && /^-?\d+$/.test(raw.trim()) ? Number(raw.trim()) : raw

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return { ok: false, message: 'Phải là số nguyên.' }
  }

  if ((column.min !== undefined && value < column.min) || (column.max !== undefined && value > column.max)) {
    return { ok: false, message: `Phải từ ${column.min} đến ${column.max}.` }
  }

  return { ok: true, value }
}

const normalizeTable = (raw: unknown, field: TableField, errors: TemplateError[]): TableRow[] => {
  const path = `values.${field.key}`

  if (raw !== undefined && raw !== null && !Array.isArray(raw)) {
    errors.push({ path, message: 'Dữ liệu bảng không hợp lệ.' })
    return []
  }

  const input = (raw ?? []) as unknown[]

  if (input.length > field.rows) {
    errors.push({ path, message: `Bảng tối đa ${field.rows} dòng.` })
    return []
  }

  const rows: TableRow[] = []

  for (let index = 0; index < (field.mode === 'fixed' ? field.rows : input.length); index++) {
    const item = input[index]
    const source = isRecord(item) ? item : {}

    if (item !== undefined && item !== null && !isRecord(item)) {
      errors.push({ path: `${path}.${index}`, message: 'Dòng không hợp lệ.' })
      continue
    }

    const row: TableRow = {}

    for (const column of field.columns) {
      const result = normalizeCell(source[column.key], column)

      if (result.ok) {
        row[column.key] = result.value
      } else {
        row[column.key] = null
        errors.push({ path: `${path}.${index}.${column.key}`, message: result.message })
      }
    }

    // Bảng dynamic: bỏ dòng trống; bảng fixed: giữ đủ số dòng (Buổi 1–15)
    if (field.mode === 'fixed' || Object.values(row).some((value) => value !== null)) {
      rows.push(row)
    }
  }

  return rows
}

/**
 * Chuẩn hóa và kiểm tra dữ liệu giáo viên nhập theo một mẫu. Dùng chung ở form (client) và
 * hook của collection (server). Chỉ giữ các trường có trong mẫu; trường lạ bị bỏ.
 * `path` của lỗi: `values.<key>` hoặc `values.<bảng>.<chỉ số dòng gửi lên>.<cột>`.
 */
export const normalizeTemplateValues = (
  template: WorksheetTemplate,
  input: unknown,
): { errors: TemplateError[]; values: TemplateValues } => {
  const errors: TemplateError[] = []
  const values: TemplateValues = {}

  if (input !== undefined && input !== null && !isRecord(input)) {
    return { errors: [{ path: 'values', message: 'Dữ liệu phiếu không hợp lệ.' }], values }
  }

  const source = input ?? {}

  for (const section of template.sections) {
    for (const field of section.fields) {
      if (field.kind === 'table') {
        values[field.key] = normalizeTable(source[field.key], field, errors)
        continue
      }

      const result = normalizeScalar(source[field.key], field.type, field.maxLength)
      const path = `values.${field.key}`

      if (!result.ok) {
        values[field.key] = null
        errors.push({ path, message: result.message })
      } else {
        values[field.key] = result.value

        if (field.required && result.value === null) {
          errors.push({ path, message: `Vui lòng nhập ${field.label}.` })
        }
      }
    }
  }

  return { errors, values }
}
