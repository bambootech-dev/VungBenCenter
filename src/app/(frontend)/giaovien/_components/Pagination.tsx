import clsx from 'clsx'
import Link from 'next/link'
import React from 'react'

type Props = {
  basePath: string
  page: number
  totalPages: number
}

const pageHref = (basePath: string, page: number) => (page > 1 ? `${basePath}?page=${page}` : basePath)

const PageLink = ({ children, href }: { children: React.ReactNode; href: string | null }) => (
  <li className={clsx('page-item', !href && 'disabled')}>
    {href ? (
      <Link className="page-link d-flex align-items-center gap-1" href={href}>
        {children}
      </Link>
    ) : (
      <span aria-disabled="true" className="page-link d-flex align-items-center gap-1">
        {children}
      </span>
    )}
  </li>
)

export const Pagination = ({ basePath, page, totalPages }: Props) => {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Phân trang" className="mt-4">
      <ul className="pagination pagination-lg justify-content-between align-items-center mb-0">
        <PageLink href={page > 1 ? pageHref(basePath, page - 1) : null}>
          <i aria-hidden="true" className="bi bi-chevron-left" />
          Trang trước
        </PageLink>

        <li className="fw-bold text-body-secondary">
          Trang {Math.min(page, totalPages)} / {totalPages}
        </li>

        <PageLink href={page < totalPages ? pageHref(basePath, page + 1) : null}>
          Trang sau
          <i aria-hidden="true" className="bi bi-chevron-right" />
        </PageLink>
      </ul>
    </nav>
  )
}
