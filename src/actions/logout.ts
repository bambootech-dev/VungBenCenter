'use server'

import config from '@payload-config'
import { logout } from '@payloadcms/next/auth'
import { redirect } from 'next/navigation'

/**
 * Đăng xuất bằng hàm chính thức của Payload: xóa session trong database (token cũ
 * hết hiệu lực kể cả ở tab khác) và xóa cookie. Xóa cookie trong Server Action khiến
 * Next.js render lại layout và xóa Client Cache, nên Header cập nhật ngay.
 */
export async function logoutAction() {
  await logout({ config })

  redirect('/')
}
