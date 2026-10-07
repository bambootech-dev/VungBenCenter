import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

/**
 * Xác thực phiên từ cookie/header của request. Chưa đăng nhập hoặc tài khoản
 * chưa kích hoạt → chuyển về /login. Trả về user để truyền vào Local API
 * cùng `overrideAccess: false`.
 */
export const requireActiveUser = async () => {
  const payload = await getPayload({ config })
  const headers = await getHeaders()

  const { user } = await payload.auth({
    headers,
    canSetHeaders: false,
  })

  if (!user || user.accountStatus !== 'active') {
    redirect('/login')
  }

  return { payload, user }
}
