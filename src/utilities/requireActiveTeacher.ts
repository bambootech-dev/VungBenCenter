import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

/**
 * Chỉ Giáo viên đã được duyệt vào được khu vực phiếu. Chưa đăng nhập hoặc tài khoản
 * chuyển sang pending (token cũ vẫn còn) → về trang đăng nhập Giáo viên; vai trò khác
 * → về khu vực của vai trò đó. Trả về user để truyền vào Local API cùng `overrideAccess: false`.
 */
export const requireActiveTeacher = async () => {
  const payload = await getPayload({ config })
  const headers = await getHeaders()

  const { user } = await payload.auth({
    headers,
    canSetHeaders: false,
  })

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
    redirect('/login/giaovien')
  }

  return { payload, user }
}
