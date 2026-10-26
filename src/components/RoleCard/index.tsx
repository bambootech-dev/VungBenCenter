import clsx from 'clsx'
import Link from 'next/link'
import React from 'react'

type Action = { href: string; label: string; primary?: boolean }

type Props = {
  actions: Action[]
  description: string
  /** Lớp Bootstrap Icons, ví dụ `bi-person-workspace` */
  icon: string
  note?: string
  title: string
}

/** Card chọn vai trò (Giáo viên / Học sinh – Phụ huynh) ở trang chủ và trang /login. */
export const RoleCard = ({ actions, description, icon, note, title }: Props) => (
  <article className="card h-100 shadow-sm">
    <div className="card-body d-flex flex-column p-4 p-md-5">
      <span aria-hidden="true" className="icon-circle bg-primary-subtle text-primary mb-4">
        <i className={clsx('bi', icon)} />
      </span>
      <h2 className="h3 mb-2">{title}</h2>
      <p className="text-body-secondary mb-4">{description}</p>

      <div className="d-grid gap-2 mt-auto">
        {actions.map((action) => (
          <Link
            className={clsx('btn btn-lg', action.primary ? 'btn-primary' : 'btn-outline-primary')}
            href={action.href}
            key={action.href}
          >
            {action.label}
          </Link>
        ))}
      </div>

      {note && <p className="small text-body-secondary mt-3 mb-0">{note}</p>}
    </div>
  </article>
)
