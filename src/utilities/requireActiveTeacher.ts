import { redirect } from 'next/navigation'

import { getCurrentUser } from './getCurrentUser'

/**
 * Chỉ Giáo viên đã được duyệt vào được khu vực phiếu. Chưa đăng nhập → trang đăng nhập
 * Giáo viên; tài khoản chuyển sang pending (token cũ vẫn còn) → dashboard Giáo viên với
 * thông báo chờ duyệt; vai trò khác → khu vực của vai trò đó. Trả về user để truyền vào
 * Local API cùng `overrideAccess: false`.
 */
export const requireActiveTeacher = async () => {
  const { payload, user } = await getCurrentUser()

  if (!user) {
    redirect('/login/giaovien')
  }

  if (user.role === 'admin') {
    redirect('/admin')
  }

  if (user.role !== 'giaovien') {
    redirect('/hocsinh/dashboard')
  }

  if (user.accountStatus !== 'active') {
    redirect('/giaovien/dashboard')
  }

  return { payload, user }
}
