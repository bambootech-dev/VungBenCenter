import type { Payload, PayloadRequest, Where } from 'payload'

import type { User } from '@/payload-types'

export const SUBSCRIPTIONS_SLUG = 'subscriptions'

/**
 * Chính sách riêng (đã được duyệt): Giáo viên đã được Admin duyệt xem được mọi bài để giảng dạy,
 * không thông qua gói học. Admin luôn xem được để quản lý và xem trước nội dung.
 */
export const TEACHERS_CAN_VIEW_ALL_LESSONS = true

export type LessonAccess = { all: true } | { all: false; lessonIds: ReadonlySet<number> }

const NO_ACCESS: LessonAccess = { all: false, lessonIds: new Set() }

type AccessUser = Pick<User, 'accountStatus' | 'id' | 'role'> | null | undefined

/**
 * Quyền học còn hiệu lực tại `now` (giờ server): trạng thái active, đã bắt đầu và chưa hết hạn.
 * Hết hạn được tính trực tiếp từ `endsAt`, không phụ thuộc cron đổi trạng thái.
 */
export const activeGrantWhere = (userId: number, now: Date): Where => ({
  and: [
    { user: { equals: userId } },
    { status: { equals: 'active' } },
    { startsAt: { less_than_equal: now.toISOString() } },
    { or: [{ endsAt: { greater_than: now.toISOString() } }, { endsAt: { exists: false } }] },
  ],
})

/**
 * Các bài người dùng được xem tại thời điểm hiện tại, tổng hợp từ mọi nguồn quyền (mua riêng,
 * gói thời hạn, Admin cấp). Một quyền hết hạn/thu hồi không ảnh hưởng quyền khác cùng bài.
 * Chỉ đọc dữ liệu phía server; không bao giờ dựa vào dữ liệu client gửi lên.
 */
export const getLessonAccess = async ({
  now = new Date(),
  payload,
  req,
  user,
}: {
  now?: Date
  payload: Payload
  req?: PayloadRequest
  user: AccessUser
}): Promise<LessonAccess> => {
  if (!user || user.accountStatus !== 'active') return NO_ACCESS

  if (user.role === 'admin') return { all: true }
  if (user.role === 'giaovien' && TEACHERS_CAN_VIEW_ALL_LESSONS) return { all: true }

  const { docs } = await payload.find({
    collection: SUBSCRIPTIONS_SLUG,
    depth: 0,
    limit: 0,
    // Lớp kiểm tra quyền tự đọc bảng quyền học (chỉ đọc, chỉ của chính user này)
    overrideAccess: true,
    pagination: false,
    req,
    select: { lessons: true },
    where: activeGrantWhere(user.id, now),
  })

  const lessonIds = new Set<number>()

  for (const grant of docs) {
    for (const lesson of grant.lessons ?? []) {
      lessonIds.add(typeof lesson === 'object' ? lesson.id : lesson)
    }
  }

  return { all: false, lessonIds }
}

export const hasLesson = (access: LessonAccess, lessonId: number) => access.all || access.lessonIds.has(lessonId)

/** `canAccessLesson(user, lessonId)`: đã đăng nhập, active và có quyền còn hiệu lực với bài này. */
export const canAccessLesson = async (args: {
  lessonId: number
  now?: Date
  payload: Payload
  req?: PayloadRequest
  user: AccessUser
}) => hasLesson(await getLessonAccess(args), args.lessonId)

// Field access chạy một lần cho mỗi bài trong danh sách: tính quyền một lần cho mỗi request
const accessByRequest = new WeakMap<PayloadRequest, Promise<LessonAccess>>()

export const getRequestLessonAccess = (req: PayloadRequest) => {
  let access = accessByRequest.get(req)

  if (!access) {
    access = getLessonAccess({ payload: req.payload, req, user: req.user as AccessUser })
    accessByRequest.set(req, access)
  }

  return access
}
