export type OrderStatus = 'cancelled' | 'paid' | 'pending' | 'refunded'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
}

/** Chuyển trạng thái hợp lệ; đơn đã thanh toán không quay lại "Chờ thanh toán". */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['refunded'],
  cancelled: [],
  refunded: [],
}

export const PAYMENT_METHOD_LABELS = {
  bank_transfer: 'Chuyển khoản',
  cash: 'Tiền mặt',
  other: 'Khác',
} as const
