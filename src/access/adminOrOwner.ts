import type { Access } from 'payload'

// Admin đọc tất cả; người khác chỉ đọc bản ghi có field `user` là chính mình. Khách luôn bị từ chối.
export const adminOrOwner: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true

  return { user: { equals: user.id } }
}
