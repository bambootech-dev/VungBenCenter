'use client'

import React from 'react'
import { useFormStatus } from 'react-dom'

import { logoutAction } from '@/actions/logout'

const SubmitButton = ({ className }: { className: string }) => {
  const { pending } = useFormStatus()

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? (
        <span aria-hidden="true" className="spinner-border spinner-border-sm me-2" />
      ) : (
        <i aria-hidden="true" className="bi bi-box-arrow-right me-2" />
      )}
      {pending ? 'Đang đăng xuất...' : 'Đăng xuất'}
    </button>
  )
}

/** Form gọi Server Action đăng xuất (vẫn hoạt động khi JavaScript chưa tải xong). */
export const LogoutButton = ({ className }: { className: string }) => (
  <form action={logoutAction}>
    <SubmitButton className={className} />
  </form>
)
