import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

/**
 * Người dùng của request hiện tại theo phiên Payload (cookie `payload-token`).
 * `payload.auth` kiểm tra chữ ký, hạn dùng và session còn trong database, rồi đọc
 * lại user từ database (role/trạng thái luôn mới nhất). `cache` gộp các lần gọi
 * trong cùng một request (layout + trang) thành một lần xác thực.
 */
export const getCurrentUser = cache(async () => {
  const payload = await getPayload({ config })
  const headers = await getHeaders()

  const { user } = await payload.auth({
    headers,
    canSetHeaders: false,
  })

  return { payload, user }
})
