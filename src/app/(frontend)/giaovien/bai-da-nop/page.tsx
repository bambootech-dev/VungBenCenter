import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { readSubtitle } from '@/worksheetTemplates/snapshot'

import { Pagination } from '../_components/Pagination'
import { formatDateTime, parsePage } from '../_components/teacherUi'

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
    <div className="container py-5">
      <PageHeader eyebrow="Giáo viên" title="Bài đã nộp" />

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
        <ul className="list-group shadow-sm" data-testid="submission-list">
          {result.docs.map((submission) => {
            // Phiếu theo mẫu có `title`; bài kiểu cũ lấy tiêu đề từ bản chụp worksheet
            const title = submission.title ?? submission.worksheetSnapshot?.title ?? 'Phiếu'
            const subtitle = readSubtitle(submission.templateSnapshot, submission.data)

            return (
              <li className="list-group-item p-0" key={submission.id}>
                <article
                  className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 p-4"
                  data-testid="submission-card"
                >
                  <div>
                    <h2 className="h5 mb-1">{title}</h2>
                    {subtitle && <p className="small fw-bold text-primary mb-1">{subtitle}</p>}
                    <p className="small fw-semibold text-body-secondary mb-0">
                      <i aria-hidden="true" className="bi bi-clock me-1" />
                      Nộp lúc <time dateTime={submission.submittedAt}>{formatDateTime(submission.submittedAt)}</time>
                    </p>
                  </div>
                  <Link
                    aria-label={`Xem chi tiết bài nộp ${title} lúc ${formatDateTime(submission.submittedAt)}`}
                    className="btn btn-outline-primary align-self-start align-self-sm-center text-nowrap"
                    href={`/giaovien/bai-da-nop/${submission.id}`}
                  >
                    Xem chi tiết
                    <i aria-hidden="true" className="bi bi-arrow-right ms-2" />
                  </Link>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      <Pagination basePath="/giaovien/bai-da-nop" page={page} totalPages={result.totalPages} />
    </div>
  )
}
