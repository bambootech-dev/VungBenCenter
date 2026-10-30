import { addCalendarMonths } from '@/utilities/calendar'

export type PlanKind = 'single' | 'bundle'
export type PlanDurationType = 'months' | 'lifetime'

export const PLAN_KIND_LABELS: Record<PlanKind, string> = {
  single: 'Mua riêng một bài',
  bundle: 'Gói học có thời hạn',
}

/**
 * Điều kiện của gói được chụp lại vào đơn (lúc đặt) và vào quyền học (lúc kích hoạt).
 * Admin sửa gói sau đó không làm thay đổi quyền đã bán.
 */
export type PlanSnapshot = {
  planId: number
  name: string
  code: string
  kind: PlanKind
  durationType: PlanDurationType
  durationMonths: number | null
  price: number
  currency: 'VND'
  lessons: { id: number; label: string }[]
}

const priceFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export const formatPrice = (price: number) => priceFormat.format(price)

export const formatDuration = ({
  durationType,
  durationMonths,
}: {
  durationType?: PlanDurationType | null
  durationMonths?: number | null
}) => (durationType === 'lifetime' ? 'Không thời hạn' : `${durationMonths ?? '?'} tháng`)

/** Thời điểm hết hạn; `null` = không thời hạn (Admin đã chọn rõ khi tạo gói). */
export const computeEndsAt = (
  { durationType, durationMonths }: Pick<PlanSnapshot, 'durationType' | 'durationMonths'>,
  startsAt: Date,
): Date | null => {
  if (durationType === 'lifetime') return null

  if (!durationMonths) {
    throw new Error('Gói có thời hạn nhưng chưa có số tháng.')
  }

  return addCalendarMonths(startsAt, durationMonths)
}
