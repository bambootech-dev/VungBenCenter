'use client'

import { useEffect } from 'react'

// Số form đang có dữ liệu chưa lưu trên trang (module dùng chung trong một tab)
let dirtyForms = 0
const clearedListeners = new Set<() => void>()

export const hasUnsavedChanges = () => dirtyForms > 0

/** Gọi `listener` khi trang không còn form nào chưa lưu. Trả về hàm hủy đăng ký. */
export const onUnsavedChangesCleared = (listener: () => void) => {
  clearedListeners.add(listener)

  return () => {
    clearedListeners.delete(listener)
  }
}

const warnBeforeUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault()
}

/**
 * Đánh dấu form đang có dữ liệu chưa lưu: trình duyệt hỏi lại trước khi tải lại/đóng thẻ,
 * và Header không tự render lại trang (có thể chuyển hướng) khi phiên hết hạn.
 */
export const useUnsavedChanges = (dirty: boolean) => {
  useEffect(() => {
    if (!dirty) return

    dirtyForms += 1
    window.addEventListener('beforeunload', warnBeforeUnload)

    return () => {
      dirtyForms -= 1
      window.removeEventListener('beforeunload', warnBeforeUnload)

      if (dirtyForms === 0) clearedListeners.forEach((listener) => listener())
    }
  }, [dirty])
}
