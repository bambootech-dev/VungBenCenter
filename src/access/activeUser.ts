import type { Access } from 'payload'

// Chỉ tài khoản đã đăng nhập và đã kích hoạt (mọi vai trò). Khách luôn bị từ chối.
export const activeUser: Access = ({ req: { user } }) => {
  return Boolean(user && user.accountStatus === 'active')
}
