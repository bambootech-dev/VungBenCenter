// Giờ Việt Nam cố định UTC+7 (không có giờ mùa hè), nên cộng/trừ một khoảng cố định là đủ
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000

const daysInMonth = (year: number, monthIndex: number) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()

/**
 * Cộng `months` tháng lịch theo giờ Việt Nam, giữ nguyên giờ trong ngày. Ngày không tồn tại ở
 * tháng đích được đưa về ngày cuối tháng: 31/01 + 1 tháng = 28/02 (hoặc 29/02 năm nhuận),
 * 31/03 + 1 tháng = 30/04. Không quy đổi tháng thành 30 ngày.
 */
export const addCalendarMonths = (start: Date, months: number): Date => {
  if (!Number.isInteger(months) || months < 1) {
    throw new Error('Số tháng phải là số nguyên dương.')
  }

  // Dời sang "giờ Việt Nam" để đọc ngày/tháng/năm bằng các hàm UTC
  const local = new Date(start.getTime() + VIETNAM_OFFSET_MS)
  const totalMonths = local.getUTCMonth() + months
  const year = local.getUTCFullYear() + Math.floor(totalMonths / 12)
  const monthIndex = totalMonths % 12
  const day = Math.min(local.getUTCDate(), daysInMonth(year, monthIndex))

  const shifted = Date.UTC(
    year,
    monthIndex,
    day,
    local.getUTCHours(),
    local.getUTCMinutes(),
    local.getUTCSeconds(),
    local.getUTCMilliseconds(),
  )

  return new Date(shifted - VIETNAM_OFFSET_MS)
}

const vietnamDateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
})

/** Ngày giờ hiển thị cho người dùng, luôn theo giờ Việt Nam. */
export const formatVietnamDateTime = (value: Date | string) => vietnamDateFormat.format(new Date(value))
