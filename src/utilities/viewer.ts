import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { User } from '@/payload-types'

import { getCurrentUser } from './getCurrentUser'

/** Trang chính của từng vai trò. Giáo viên chưa duyệt vẫn về dashboard để thấy thông báo chờ duyệt. */
export const getDashboardHref = (user: Pick<User, 'role'>) => {
  if (user.role === 'admin') return '/admin'
  if (user.role === 'giaovien') return '/giaovien/dashboard'
  return '/hocsinh/dashboard'
}

/**
 * Thông tin tối thiểu để Header/Footer hiển thị trạng thái đăng nhập. Không chứa token,
 * email hay quyền: chỉ để hiển thị, mọi trang và API vẫn tự xác thực.
 */
export type Viewer = {
  /** Đổi theo từng phiên đăng nhập (kể cả đăng nhập lại cùng tài khoản); dùng để đồng bộ giữa các tab */
  key: string
  name: string
  dashboardHref: string
  dashboardLabel: string
  /**
   * Thời gian còn lại của phiên (ms) tính trên server lúc render, để giao diện tự cập nhật khi hết
   * phiên. Dùng khoảng còn lại thay cho mốc tuyệt đối để không phụ thuộc đồng hồ máy người dùng.
   */
  expiresIn: number | null
}

// Payload ký JWT có `exp` (giây). Chỉ đọc sau khi payload.auth đã xác thực token này.
const readTokenExpiry = (token: string | undefined) => {
  try {
    const exp = token && JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).exp
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

// Payload gắn id phiên (`_sid`) vào user khi xác thực bằng JWT. Chỉ đưa bản băm ngắn xuống client.
const sessionKey = (user: User & { _sid?: unknown }) => {
  const sid = typeof user._sid === 'string' ? user._sid : ''

  return `${user.id}:${createHash('sha256').update(sid).digest('hex').slice(0, 12)}`
}

export const getViewer = async (): Promise<Viewer | null> => {
  const { payload, user } = await getCurrentUser()

  if (!user) return null

  const token = (await cookies()).get(`${payload.config.cookiePrefix}-token`)?.value
  const expiresAt = readTokenExpiry(token)

  return {
    key: sessionKey(user),
    name: user.name || user.email,
    dashboardHref: getDashboardHref(user),
    dashboardLabel: user.role === 'admin' ? 'Trang quản trị' : 'Trang cá nhân',
    expiresIn: expiresAt === null ? null : Math.max(expiresAt - Date.now(), 0),
  }
}

/** Trang đăng nhập/đăng ký: đã có phiên hợp lệ thì về trang chính của vai trò. */
export const redirectSignedInUser = async () => {
  const { user } = await getCurrentUser()

  if (user) redirect(getDashboardHref(user))
}
