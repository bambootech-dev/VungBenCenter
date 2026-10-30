import { cache } from 'react'

import { getCurrentUser } from './getCurrentUser'
import { getLessonAccess } from './lessonAccess'

/** Quyền học của người đang xem, tính một lần cho mỗi request (layout + trang dùng chung). */
export const getViewerLessonAccess = cache(async () => {
  const { payload, user } = await getCurrentUser()

  return getLessonAccess({ payload, user })
})
