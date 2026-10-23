import type { TableColumn, WorksheetTemplate } from './types'

// Theo ảnh mẫu giấy trong docs/template_thamkhao.png và docs/template_thamkhao2.png.
// Đổi cấu trúc một mẫu → tăng `version`; bài đã nộp vẫn hiển thị theo bản chụp lúc nộp.

const opportunityColumns: TableColumn[] = Array.from({ length: 10 }, (_, index) => ({
  key: `co${index + 1}`,
  label: String(index + 1),
  type: 'text',
  group: 'Số cơ hội / Cách trẻ thực hiện',
  // Chưa chốt ký hiệu ghi trong ô (ví dụ +/−): tạm cho ký hiệu ngắn
  maxLength: 10,
}))

export const PHIEU_THEO_DOI_CA: WorksheetTemplate = {
  code: 'phieu-theo-doi-ca',
  version: 1,
  title: 'Dữ liệu quá trình can thiệp tổng hợp: Phiếu theo dõi ca',
  description: 'Theo dõi từng mục tiêu trong một ca can thiệp: 10 cơ hội và tỉ lệ đúng.',
  subtitleField: 'tre',
  sections: [
    {
      key: 'thong-tin',
      title: 'Thông tin ca can thiệp',
      accountFields: [{ label: 'Người CT', source: 'teacherName' }],
      fields: [
        { kind: 'field', key: 'tre', label: 'Trẻ', type: 'text', required: true, maxLength: 200 },
        { kind: 'field', key: 'ngayCT', label: 'Ngày CT', type: 'date', required: true },
        { kind: 'field', key: 'tuGio', label: 'Từ (giờ)', type: 'time' },
        { kind: 'field', key: 'denGio', label: 'Đến (giờ)', type: 'time' },
      ],
    },
    {
      key: 'du-lieu',
      title: 'Bảng dữ liệu',
      description: 'Mỗi dòng là một mục tiêu. Dòng để trống sẽ không được lưu.',
      fields: [
        {
          kind: 'table',
          key: 'mucTieu',
          label: 'Bảng dữ liệu',
          mode: 'dynamic',
          rows: 15,
          columns: [
            { key: 'soBaiHoc', label: 'Số bài học', type: 'text', maxLength: 20 },
            // Tiêu đề cột trên mẫu bị cắt ("Số bà… / Cấp độ"): tạm dùng phần đọc rõ
            { key: 'capDo', label: 'Cấp độ', type: 'text', maxLength: 20 },
            { key: 'mucTieuCuThe', label: 'Mục tiêu cụ thể', type: 'text', maxLength: 500 },
            ...opportunityColumns,
            { key: 'phanTramDung', label: '% đúng', type: 'integer', min: 0, max: 100, suffix: '%' },
          ],
        },
      ],
    },
  ],
}

export const PHIEU_AM_MUC_TIEU: WorksheetTemplate = {
  code: 'phieu-am-muc-tieu',
  version: 1,
  title: 'Phiếu theo dõi dữ liệu quá trình can thiệp âm mục tiêu',
  description: 'Theo dõi tỉ lệ đúng của một âm mục tiêu qua 15 buổi trong tháng.',
  subtitleField: 'tenTre',
  sections: [
    {
      key: 'thong-tin',
      title: 'Thông tin',
      accountFields: [{ label: 'Người can thiệp', source: 'teacherName' }],
      fields: [
        { kind: 'field', key: 'tenTre', label: 'Tên trẻ', type: 'text', required: true, maxLength: 200 },
        { kind: 'field', key: 'amMucTieu', label: 'Âm mục tiêu', type: 'text', required: true, maxLength: 50 },
        { kind: 'field', key: 'thangNam', label: 'Tháng/Năm', type: 'month', required: true },
      ],
    },
    {
      key: 'ket-qua',
      title: 'Kết quả theo buổi',
      description: 'Nhập ngày và tỉ lệ đúng (0–100%) của từng buổi. Buổi chưa học để trống.',
      fields: [
        {
          kind: 'table',
          key: 'buoi',
          label: 'Kết quả theo buổi',
          mode: 'fixed',
          rows: 15,
          rowLabel: 'Buổi {n}',
          columns: [
            { key: 'ngay', label: 'Ngày', type: 'integer', min: 1, max: 31 },
            { key: 'phanTram', label: 'Tỉ lệ đúng', type: 'integer', min: 0, max: 100, suffix: '%' },
          ],
          chart: { valueColumn: 'phanTram', min: 0, max: 100, step: 10 },
        },
      ],
    },
    {
      key: 'ghi-chu',
      title: 'Ghi chú',
      fields: [{ kind: 'field', key: 'ghiChu', label: 'Ghi chú', type: 'textarea', maxLength: 2000 }],
    },
  ],
}

export const WORKSHEET_TEMPLATES: WorksheetTemplate[] = [PHIEU_THEO_DOI_CA, PHIEU_AM_MUC_TIEU]

export const getTemplate = (code: unknown): WorksheetTemplate | undefined =>
  WORKSHEET_TEMPLATES.find((template) => template.code === code)
