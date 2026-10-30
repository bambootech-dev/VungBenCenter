import React from 'react'

import { LogoutButton } from '@/components/LogoutButton'
import { PageHeader } from '@/components/PageHeader'
import { SessionSync } from '@/components/SessionSync'

type Props = {
  eyebrow: string
  message: string
  title: string
}

/** Thay cho nội dung dashboard khi tài khoản đã đăng nhập nhưng chưa được kích hoạt. */
export const AccountStatusNotice = ({ eyebrow, message, title }: Props) => (
  <div className="container py-5">
    <SessionSync />
    <PageHeader eyebrow={eyebrow} title={title} />

    <div className="alert alert-warning d-flex gap-3 align-items-start" data-testid="account-pending" role="status">
      <i aria-hidden="true" className="bi bi-hourglass-split fs-4" />
      <div>
        <p className="fw-bold mb-1">{message}</p>
        <p className="mb-0">Bạn có thể đăng xuất và quay lại sau khi tài khoản được kích hoạt.</p>
      </div>
    </div>

    <LogoutButton className="btn btn-outline-primary" />
  </div>
)
