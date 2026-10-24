import type { Access } from 'payload'

// Admin, hoặc Giáo viên đã được Admin duyệt (accountStatus active). Học sinh và khách bị từ chối.
export const activeTeacherOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') return true

  return user.role === 'giaovien' && user.accountStatus === 'active'
}
