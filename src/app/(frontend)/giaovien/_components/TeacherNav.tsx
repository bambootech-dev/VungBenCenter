'use client'

import { ClipboardList, FileCheck2, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { cn } from '@/utilities/ui'

import { focusRing } from './teacherUi'

const items = [
  { href: '/giaovien/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/giaovien/phieu', icon: ClipboardList, label: 'Phiếu' },
  { href: '/giaovien/bai-da-nop', icon: FileCheck2, label: 'Bài đã nộp' },
]

export const TeacherNav = () => {
  const pathname = usePathname()

  return (
    <nav aria-label="Khu vực Giáo viên" className="py-3">
      <ul className="flex flex-wrap gap-1 sm:gap-2">
        {items.map(({ href, icon: Icon, label }) => {
          const isCurrent = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <li key={href}>
              <Link
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[0.95rem] font-bold transition sm:gap-2 sm:px-4 sm:text-base',
                  focusRing,
                  isCurrent
                    ? 'bg-lesson-primary text-white'
                    : 'text-lesson-primary-dark hover:bg-lesson-primary-soft',
                )}
                href={href}
              >
                <Icon aria-hidden="true" className="size-5" strokeWidth={2.5} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
