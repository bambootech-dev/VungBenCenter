import { describe, expect, it } from 'vitest'

import { computeEndsAt } from '@/collections/Plans/plan'
import { grantState } from '@/collections/Subscriptions/state'
import { addCalendarMonths } from '@/utilities/calendar'

// Mốc thời gian viết theo giờ Việt Nam (+07:00) để dễ đọc
const vn = (value: string) => new Date(`${value}+07:00`)

describe('addCalendarMonths: tháng lịch theo giờ Việt Nam', () => {
  it.each([
    ['2026-01-15T10:00:00', 1, '2026-02-15T10:00:00'],
    ['2026-01-31T10:00:00', 1, '2026-02-28T10:00:00'], // năm thường: về ngày cuối tháng 2
    ['2028-01-31T10:00:00', 1, '2028-02-29T10:00:00'], // năm nhuận
    ['2028-02-29T09:30:00', 1, '2028-03-29T09:30:00'],
    ['2028-02-29T09:30:00', 12, '2029-02-28T09:30:00'], // 29/02 sang năm không nhuận
    ['2026-03-31T08:00:00', 1, '2026-04-30T08:00:00'],
    ['2026-12-31T23:00:00', 1, '2027-01-31T23:00:00'], // qua năm mới
    ['2026-11-30T12:00:00', 3, '2027-02-28T12:00:00'],
    ['2026-05-31T00:00:00', 1, '2026-06-30T00:00:00'],
  ])('%s + %i tháng = %s', (start, months, expected) => {
    expect(addCalendarMonths(vn(start), months).toISOString()).toBe(vn(expected).toISOString())
  })

  it('không quy đổi 1 tháng thành 30 ngày', () => {
    const start = vn('2026-01-01T09:00:00')
    const end = addCalendarMonths(start, 1)

    expect((end.getTime() - start.getTime()) / 86_400_000).toBe(31)
  })

  it('tính theo ngày ở Việt Nam, kể cả lúc UTC vẫn là ngày hôm trước', () => {
    // 00:30 ngày 01/02 giờ VN = 17:30 ngày 31/01 UTC → hết hạn 00:30 ngày 01/03 giờ VN
    expect(addCalendarMonths(vn('2026-02-01T00:30:00'), 1).toISOString()).toBe(
      vn('2026-03-01T00:30:00').toISOString(),
    )
    // 23:30 ngày 31/01 giờ VN → 23:30 ngày 28/02 giờ VN
    expect(addCalendarMonths(vn('2026-01-31T23:30:00'), 1).toISOString()).toBe(
      vn('2026-02-28T23:30:00').toISOString(),
    )
  })

  it('từ chối số tháng không hợp lệ', () => {
    expect(() => addCalendarMonths(new Date(), 0)).toThrow()
    expect(() => addCalendarMonths(new Date(), 1.5)).toThrow()
  })
})

describe('computeEndsAt và grantState', () => {
  it('gói không thời hạn không có ngày hết hạn; gói tháng tính theo tháng lịch', () => {
    const start = vn('2028-01-31T10:00:00')

    expect(computeEndsAt({ durationType: 'lifetime', durationMonths: null }, start)).toBeNull()
    expect(computeEndsAt({ durationType: 'months', durationMonths: 1 }, start)?.toISOString()).toBe(
      vn('2028-02-29T10:00:00').toISOString(),
    )
    expect(() => computeEndsAt({ durationType: 'months', durationMonths: null }, start)).toThrow()
  })

  it('trạng thái thực tế tính từ thời gian hiện tại, không cần cron', () => {
    const now = vn('2026-06-01T12:00:00')
    const base = { startsAt: vn('2026-05-01T12:00:00'), status: 'active' }

    expect(grantState({ ...base, endsAt: vn('2026-06-01T12:00:01') }, now)).toBe('active')
    expect(grantState({ ...base, endsAt: vn('2026-06-01T12:00:00') }, now)).toBe('expired')
    expect(grantState({ ...base, endsAt: null }, now)).toBe('active')
    expect(grantState({ ...base, startsAt: vn('2026-06-02T00:00:00') }, now)).toBe('scheduled')
    expect(grantState({ ...base, status: 'revoked' }, now)).toBe('revoked')
  })
})
