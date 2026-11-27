import Link from 'next/link'
import React from 'react'

type Props = {
  action?: { href: string; label: string }
  icon?: string
  message: string
  testId?: string
}

/** Khung "chưa có dữ liệu" dùng chung: icon Bootstrap, thông báo và một nút tùy chọn. */
export const EmptyState = ({ action, icon = 'bi-inbox', message, testId }: Props) => (
  <div className="card card-body text-center py-5" data-testid={testId}>
    <i aria-hidden="true" className={`bi ${icon} display-5 text-primary`} />
    <p className="fs-5 fw-bold text-body-secondary mt-2 mb-0">{message}</p>
    {action && (
      <div className="mt-4">
        <Link className="btn btn-outline-primary" href={action.href}>
          {action.label}
        </Link>
      </div>
    )}
  </div>
)
