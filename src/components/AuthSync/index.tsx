'use client'

import { useRouter } from 'next/navigation'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { AUTH_CHANNEL, GUEST_KEY } from '@/utilities/authSync'
import { hasUnsavedChanges, onUnsavedChangesCleared } from '@/utilities/unsavedChanges'
import type { Viewer } from '@/utilities/viewer'

type AuthSyncValue = {
  /** Trạng thái để hiển thị: do server xác thực, hoặc `null` khi phiên đã hết trong lúc đang nhập liệu */
  viewer: Viewer | null
  /** Phiên đã hết/đã đăng xuất nhưng trang được giữ nguyên để không mất dữ liệu đang nhập */
  sessionEndedWhileEditing: boolean
  /** Báo key phiên mà server vừa thấy (từ tab khác hoặc từ trang); khác Header thì render lại */
  syncWith: (serverKey: string) => void
}

const AuthSyncContext = createContext<AuthSyncValue>({
  viewer: null,
  sessionEndedWhileEditing: false,
  syncWith: () => {},
})

export const useAuthState = () => useContext(AuthSyncContext)

// setTimeout chỉ nhận tối đa ~24,8 ngày
const MAX_TIMEOUT = 2 ** 31 - 1

/**
 * Lớp đồng bộ giao diện, không phải nguồn xác thực: `viewer` luôn do layout lấy từ Payload
 * trên server. Ở đây chỉ yêu cầu server render lại (`router.refresh()`) khi trạng thái có
 * thể đã đổi: tab khác đăng nhập/đăng xuất, trang vừa render thấy phiên khác Header, hoặc
 * token vừa hết hạn. Không polling.
 *
 * Nếu render lại lúc phiên đã hết, trang được bảo vệ sẽ chuyển hướng và form đang nhập bị mất,
 * nên khi trang có dữ liệu chưa lưu thì chỉ đổi Header sang trạng thái khách, giữ nguyên trang,
 * và render lại sau khi dữ liệu đã được nộp/bỏ hoặc người dùng đăng nhập lại ở thẻ khác.
 */
export const AuthSyncProvider = ({ children, viewer }: { children: React.ReactNode; viewer: Viewer | null }) => {
  const router = useRouter()
  const viewerKey = viewer?.key ?? GUEST_KEY
  const expiresIn = viewer?.expiresIn
  const lastKey = useRef(viewerKey)
  // Key của lần render server mà việc render lại đang được hoãn
  const [heldFor, setHeldFor] = useState<string | null>(null)
  const held = heldFor === viewerKey

  const syncWith = useCallback(
    (serverKey: string) => {
      if (serverKey === viewerKey) return

      if (serverKey === GUEST_KEY && hasUnsavedChanges()) {
        setHeldFor(viewerKey)
        return
      }

      router.refresh()
    },
    [router, viewerKey],
  )

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return

    const channel = new BroadcastChannel(AUTH_CHANNEL)
    channel.onmessage = ({ data }) => {
      if (typeof data === 'string') syncWith(data)
    }

    // Tab này vừa nhận trạng thái mới từ server: báo các tab khác
    if (lastKey.current !== viewerKey) {
      lastKey.current = viewerKey
      channel.postMessage(viewerKey)
    }

    return () => channel.close()
  }, [syncWith, viewerKey])

  useEffect(() => {
    if (expiresIn == null) return

    const timer = window.setTimeout(() => syncWith(GUEST_KEY), Math.min(expiresIn + 1000, MAX_TIMEOUT))

    return () => window.clearTimeout(timer)
  }, [expiresIn, syncWith])

  useEffect(() => {
    if (!held) return

    return onUnsavedChangesCleared(() => router.refresh())
  }, [held, router])

  return (
    <AuthSyncContext value={{ viewer: held ? null : viewer, sessionEndedWhileEditing: held, syncWith }}>
      {children}
    </AuthSyncContext>
  )
}

/** Đặt trong trang (Server Component truyền key phiên của request) để sửa Header nếu đang lệch. */
export const SessionCheck = ({ serverKey }: { serverKey: string }) => {
  const { syncWith } = useAuthState()

  useEffect(() => {
    syncWith(serverKey)
  }, [serverKey, syncWith])

  return null
}
