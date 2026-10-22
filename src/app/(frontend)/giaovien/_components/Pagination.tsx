import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'

import { secondaryButtonClass } from './teacherUi'

type Props = {
  basePath: string
  page: number
  totalPages: number
}

const pageHref = (basePath: string, page: number) => (page > 1 ? `${basePath}?page=${page}` : basePath)

export const Pagination = ({ basePath, page, totalPages }: Props) => {
  if (totalPages <= 1) return null

  const disabled = 'pointer-events-none opacity-45'

  return (
    <nav aria-label="Phân trang" className="mt-8 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link className={secondaryButtonClass} href={pageHref(basePath, page - 1)}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.75} />
          Trang trước
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(secondaryButtonClass, disabled)}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.75} />
          Trang trước
        </span>
      )}

      <p className="text-base font-bold text-lesson-muted">
        Trang {Math.min(page, totalPages)} / {totalPages}
      </p>

      {page < totalPages ? (
        <Link className={secondaryButtonClass} href={pageHref(basePath, page + 1)}>
          Trang sau
          <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2.75} />
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(secondaryButtonClass, disabled)}>
          Trang sau
          <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2.75} />
        </span>
      )}
    </nav>
  )
}
