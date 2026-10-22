import type { Access } from 'payload'

// Chỉ Giáo viên đã được Admin duyệt (accountStatus active). Admin, Học sinh và khách bị từ chối.
export const activeTeacher: Access = ({ req: { user } }) => {
  return Boolean(user && user.role === 'giaovien' && user.accountStatus === 'active')
}
