import React from 'react'

import { SessionCheck } from '@/components/AuthSync'
import { GUEST_KEY } from '@/utilities/authSync'
import { getViewer } from '@/utilities/viewer'

/**
 * Chuyển trang phía client không render lại layout, nên Header có thể còn trạng thái cũ (ví dụ
 * phiên bị thu hồi từ thiết bị khác rồi trang được bảo vệ chuyển về /login). Trang đặt component
 * này để so key phiên của chính request đó với Header. Dùng chung kết quả xác thực đã cache.
 */
export const SessionSync = async () => {
  const viewer = await getViewer()

  return <SessionCheck serverKey={viewer?.key ?? GUEST_KEY} />
}
