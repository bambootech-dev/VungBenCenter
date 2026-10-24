import type { Metadata } from 'next'
import { ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { readSubtitle } from '@/worksheetTemplates/snapshot'

import { EmptyState } from '../_components/EmptyState'
import { Pagination } from '../_components/Pagination'
import {
  cardClass,
  formatDateTime,
  pageTitleClass,
  parsePage,
  pillClass,
  secondaryButtonClass,
} from '../_components/teacherUi'

export const metadata: Metadata = {
  title: 'Bài đã nộp',
}

const PAGE_SIZE = 10

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SubmissionListPage({ searchParams }: Props) {
  const { payload, user } = await requireActiveTeacher()
  const page = parsePage((await searchParams).page)

  // Access control đã giới hạn theo người nộp; điều kiện teacher ở đây chỉ để rõ ý
  const result = await payload.find({
    collection: 'worksheet-submissions',
    depth: 0,
    limit: PAGE_SIZE,
    overrideAccess: false,
    page,
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
        <h1 className={`${pageTitleClass} mb-8`}>Bài đã nộp</h1>

        {result.docs.length === 0 ? (
          result.totalDocs === 0 ? (
            <EmptyState
              action={{ href: '/giaovien/phieu', label: 'Xem danh sách phiếu' }}
              message="Bạn chưa nộp phiếu nào."
              testId="submission-list-empty"
            />
          ) : (
            <EmptyState
              action={{ href: '/giaovien/bai-da-nop', label: 'Về trang đầu' }}
              message="Trang này không có bài nộp."
              testId="submission-list-empty"
            />
          )
        ) : (
          <ul className="space-y-4" data-testid="submission-list">
            {result.docs.map((submission) => {
              // Phiếu theo mẫu có `title`; bài kiểu cũ lấy tiêu đề từ bản chụp worksheet
              const title = submission.title ?? submission.worksheetSnapshot?.title ?? 'Phiếu'
              const subtitle = readSubtitle(submission.templateSnapshot, submission.data)

              return (
              <li key={submission.id}>
                <article
                  className={cn(cardClass, 'flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6')}
                  data-testid="submission-card"
                >
                  <div>
                    <h2 className="text-lg font-extrabold text-lesson-primary-dark">{title}</h2>
                    {subtitle && <p className="mt-1 text-sm font-bold text-lesson-primary">{subtitle}</p>}
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-lesson-muted">
                      <Clock aria-hidden="true" className="size-4" strokeWidth={2.5} />
                      Nộp lúc{' '}
                      <time dateTime={submission.submittedAt}>{formatDateTime(submission.submittedAt)}</time>
                    </p>
                  </div>
                  <Link
                    aria-label={`Xem chi tiết bài nộp ${title} lúc ${formatDateTime(submission.submittedAt)}`}
                    className={cn(secondaryButtonClass, 'self-start sm:self-auto')}
                    href={`/giaovien/bai-da-nop/${submission.id}`}
                  >
                    Xem chi tiết
                    <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2.75} />
                  </Link>
                </article>
              </li>
              )
            })}
          </ul>
        )}

        <Pagination basePath="/giaovien/bai-da-nop" page={page} totalPages={result.totalPages} />
      </div>
    </main>
  )
}
