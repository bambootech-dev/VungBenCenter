export type GrantState = 'active' | 'cancelled' | 'expired' | 'revoked' | 'scheduled'

export const GRANT_STATE_LABELS: Record<GrantState, string> = {
  active: 'Đang hiệu lực',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn',
  revoked: 'Đã thu hồi',
  scheduled: 'Chưa bắt đầu',
}

type GrantLike = {
  endsAt?: Date | string | null
  startsAt?: Date | string | null
  status?: string | null
}

/** Trạng thái thực tế của một quyền học tại `now`; cùng điều kiện với `activeGrantWhere`. */
export const grantState = (grant: GrantLike, now = new Date()): GrantState => {
  if (grant.status === 'revoked') return 'revoked'
  if (grant.status === 'cancelled') return 'cancelled'
  if (grant.startsAt && new Date(grant.startsAt) > now) return 'scheduled'
  if (grant.endsAt && new Date(grant.endsAt) <= now) return 'expired'
  return 'active'
}
