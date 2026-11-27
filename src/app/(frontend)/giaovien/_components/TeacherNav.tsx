'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const items = [
  { href: '/giaovien/dashboard', icon: 'bi-grid-fill', label: 'Tổng quan' },
  { href: '/giaovien/phieu', icon: 'bi-clipboard2-fill', label: 'Phiếu' },
  { href: '/giaovien/bai-da-nop', icon: 'bi-file-earmark-check-fill', label: 'Bài đã nộp' },
]

export const TeacherNav = () => {
  const pathname = usePathname()

  return (
    <nav aria-label="Khu vực Giáo viên" className="py-2">
      <ul className="nav nav-pills flex-nowrap overflow-x-auto gap-1 gap-sm-2">
        {items.map(({ href, icon, label }) => {
          const isCurrent = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <li className="nav-item" key={href}>
              <Link
                aria-current={isCurrent ? 'page' : undefined}
                className={clsx('nav-link d-flex align-items-center gap-2 text-nowrap py-2', isCurrent ? 'active' : 'text-body')}
                href={href}
              >
                <i aria-hidden="true" className={clsx('bi', icon)} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
