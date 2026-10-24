// Lớp CSS thương hiệu dùng chung nằm ở components/ui/brand; ở đây thêm các tiện ích của khu vực Giáo viên

export {
  cardClass,
  focusRing,
  pageTitleClass,
  pillClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/ui/brand'

// Thời gian nộp hiển thị theo giờ Việt Nam, không phụ thuộc múi giờ của server
const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
})

export const formatDateTime = (value: string) => dateTimeFormat.format(new Date(value))

/** Đọc `?page=` thành số trang ≥ 1; giá trị sai → 1. */
export const parsePage = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number.parseInt(raw ?? '', 10)

  return Number.isInteger(page) && page > 0 ? page : 1
}
