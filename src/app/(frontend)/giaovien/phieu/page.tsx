import type { Metadata } from 'next'
import { ArrowRight, Clock, Plus } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { readSubtitle } from '@/worksheetTemplates/snapshot'

import { EmptyState } from '../_components/EmptyState'
import {
  cardClass,
  formatDateTime,
  pageTitleClass,
  pillClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../_components/teacherUi'

export const metadata: Metadata = {
  title: 'Phiếu',
}

const RECENT_LIMIT = 5

export default async function WorksheetHomePage() {
  const { payload, user } = await requireActiveTeacher()

  // Vài phiếu nộp gần nhất của chính giáo viên (access control đã giới hạn theo người nộp)
  const recent = await payload.find({
    collection: 'worksheet-submissions',
    depth: 0,
    limit: RECENT_LIMIT,
    overrideAccess: false,
    select: {
      data: true,
      submittedAt: true,
      templateSnapshot: true,
      title: true,
      worksheetSnapshot: { title: true },
    },
    sort: '-submittedAt',
    user,
    where: { teacher: { equals: user.id } },
  })

  return (
    <main className="flex-1">
      <div className="lesson-container py-10 md:py-14">
        <p className={`${pillClass} mb-3`}>Giáo viên</p>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className={pageTitleClass}>Phiếu</h1>
            <p className="mt-2 text-base font-semibold text-lesson-muted">
              Bấm “Tạo phiếu” để chọn mẫu và điền phiếu mới.
            </p>
          </div>
          <Link className={cn(primaryButtonClass, 'self-start sm:self-auto')} href="/giaovien/phieu/moi">
            <Plus aria-hidden="true" className="size-5" strokeWidth={3} />
            Tạo phiếu
          </Link>
        </div>

        <h2 className="mb-4 text-xl font-extrabold text-lesson-primary-dark">Phiếu nộp gần đây</h2>

        {recent.docs.length === 0 ? (
          <EmptyState message="Bạn chưa nộp phiếu nào." testId="recent-submissions-empty" />
        ) : (
          <>
            <ul className="space-y-3" data-testid="recent-submissions">
              {recent.docs.map((submission) => {
                const title = submission.title ?? submission.worksheetSnapshot?.title ?? 'Phiếu'
                const subtitle = readSubtitle(submission.templateSnapshot, submission.data)

                return (
                  <li key={submission.id}>
                    <Link
                      className={cn(
                        cardClass,
                        'flex items-center justify-between gap-4 p-4 transition hover:border-lesson-primary/40 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lesson-primary-dark sm:p-5',
                      )}
                      href={`/giaovien/bai-da-nop/${submission.id}`}
                    >
                      <span>
                        <span className="block font-extrabold text-lesson-primary-dark">{title}</span>
                        <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold text-lesson-muted">
                          {subtitle && <span>{subtitle}</span>}
                          <span className="inline-flex items-center gap-1.5">
                            <Clock aria-hidden="true" className="size-4" strokeWidth={2.5} />
                            <time dateTime={submission.submittedAt}>{formatDateTime(submission.submittedAt)}</time>
                          </span>
                        </span>
                      </span>
                      <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-lesson-primary" strokeWidth={2.75} />
                    </Link>
                  </li>
                )
              })}
            </ul>
            {recent.totalDocs > RECENT_LIMIT && (
              <Link className={cn(secondaryButtonClass, 'mt-5')} href="/giaovien/bai-da-nop">
                Xem tất cả bài đã nộp
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  )
}
