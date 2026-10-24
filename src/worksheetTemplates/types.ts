// Mẫu phiếu do hệ thống định nghĩa sẵn (không do Admin tạo). Bài nộp lưu bản chụp của đúng
// phiên bản mẫu lúc nộp, nên mọi kiểu dưới đây phải tuần tự hóa được thành JSON.

/** Ô nhập đơn ở phần đầu phiếu */
export type ScalarFieldType =
  | 'date' // YYYY-MM-DD
  | 'month' // YYYY-MM
  | 'text'
  | 'textarea'
  | 'time' // HH:MM

export type ScalarField = {
  kind: 'field'
  key: string
  label: string
  type: ScalarFieldType
  required?: boolean
  maxLength?: number
}

/** Ô trong một dòng của bảng */
export type ColumnType = 'integer' | 'text'

export type TableColumn = {
  key: string
  label: string
  type: ColumnType
  // Tiêu đề nhóm cột (ví dụ "Số cơ hội / Cách trẻ thực hiện" phía trên cột 1–10)
  group?: string
  maxLength?: number
  min?: number
  max?: number
  // Đơn vị hiển thị sau giá trị, ví dụ "%"
  suffix?: string
}

export type TableField = {
  kind: 'table'
  key: string
  label: string
  columns: TableColumn[]
  // fixed: đúng `rows` dòng có sẵn (ví dụ Buổi 1–15); dynamic: giáo viên thêm dòng, tối đa `rows`
  mode: 'dynamic' | 'fixed'
  rows: number
  // Nhãn đầu dòng của bảng fixed, `{n}` = số thứ tự (ví dụ "Buổi {n}")
  rowLabel?: string
  // Biểu đồ hiển thị kèm bảng ở trang chi tiết (giống lưới % trong mẫu giấy)
  chart?: { valueColumn: string; min: number; max: number; step: number }
}

export type TemplateField = ScalarField | TableField

export type TemplateSection = {
  key: string
  title: string
  // Ghi chú nhỏ dưới tiêu đề phần
  description?: string
  // Ô tự lấy từ tài khoản người nộp (chỉ hiển thị, không nhập)
  accountFields?: { label: string; source: 'teacherName' }[]
  fields: TemplateField[]
}

export type WorksheetTemplate = {
  code: string
  version: number
  title: string
  description: string
  // Trường dùng làm phụ đề trong danh sách bài nộp (ví dụ tên trẻ)
  subtitleField?: string
  sections: TemplateSection[]
}

export type CellValue = number | string | null
export type TableRow = Record<string, CellValue>
export type TemplateValues = Record<string, CellValue | TableRow[]>
