'use server'

import { redirect } from 'next/navigation'
import { APIError } from 'payload'

import { getCurrentUser } from '@/utilities/getCurrentUser'

export type CreateOrderState = { error: string } | null

/**
 * Học sinh / Phụ huynh đặt mua một gói: tạo đơn "Chờ thanh toán". Không cấp quyền gì ở đây; quyền
 * chỉ được kích hoạt khi Admin xác nhận đã nhận tiền. Chạy Local API với `overrideAccess: false`
 * và user của phiên, nên access + hook của Orders quyết định giá, người mua và trạng thái.
 */
export async function createOrder(_previous: CreateOrderState, formData: FormData): Promise<CreateOrderState> {
  const { payload, user } = await getCurrentUser()

  if (!user) {
    redirect('/login/hocsinh')
  }

  if (user.role !== 'hocsinh' || user.accountStatus !== 'active') {
    return { error: 'Chỉ tài khoản Học sinh / Phụ huynh đã kích hoạt mới đặt mua được gói học.' }
  }

  const planId = Number(formData.get('planId'))

  if (!Number.isInteger(planId) || planId <= 0) {
    return { error: 'Gói học không hợp lệ.' }
  }

  // Đã có đơn chờ thanh toán cho gói này: dùng lại, không tạo đơn trùng
  const {
    docs: [pending],
  } = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: { and: [{ plan: { equals: planId } }, { status: { equals: 'pending' } }] },
  })

  let orderId = pending?.id

  if (!orderId) {
    try {
      const order = await payload.create({
        collection: 'orders',
        data: { plan: planId } as never,
        depth: 0,
        overrideAccess: false,
        user,
      })
      orderId = order.id
    } catch (error) {
      if (error instanceof APIError && error.isPublic) return { error: error.message }

      payload.logger.error({ err: error, userId: user.id }, 'createOrder failed')
      return { error: 'Chưa tạo được đơn. Vui lòng thử lại sau ít phút.' }
    }
  }

  redirect(`/hocsinh/dashboard?don-hang=${orderId}#goi-hoc-cua-toi`)
}
