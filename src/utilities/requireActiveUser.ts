import { redirect } from 'next/navigation'

import { getCurrentUser } from './getCurrentUser'
import { getDashboardHref } from './viewer'

/**
 * Xác thực phiên từ cookie/header của request. Chưa đăng nhập → /login; đã đăng nhập
 * nhưng tài khoản chưa kích hoạt → trang chính của vai trò (hiển thị thông báo).
 * Trả về user để truyền vào Local API cùng `overrideAccess: false`.
 */
export const requireActiveUser = async () => {
  const { payload, user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.accountStatus !== 'active') {
    redirect(getDashboardHref(user))
  }

  return { payload, user }
}
