import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { readSubtitle } from '@/worksheetTemplates/snapshot'

import { formatDateTime } from '../_components/teacherUi'

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
    <div className="container py-5">
      <PageHeader
        actions={
          <Link className="btn btn-primary btn-lg" href="/giaovien/phieu/moi">
            <i aria-hidden="true" className="bi bi-plus-lg me-2" />
            Tạo phiếu
          </Link>
        }
        eyebrow="Giáo viên"
        lead="Bấm “Tạo phiếu” để chọn mẫu và điền phiếu mới."
        title="Phiếu"
      />

      <h2 className="h4 mb-3">Phiếu nộp gần đây</h2>

      {recent.docs.length === 0 ? (
        <EmptyState message="Bạn chưa nộp phiếu nào." testId="recent-submissions-empty" />
      ) : (
        <>
          <ul className="list-group shadow-sm" data-testid="recent-submissions">
            {recent.docs.map((submission) => {
              const title = submission.title ?? submission.worksheetSnapshot?.title ?? 'Phiếu'
              const subtitle = readSubtitle(submission.templateSnapshot, submission.data)

              return (
                <li className="list-group-item p-0" key={submission.id}>
                  <Link
                    className="list-group-item-action d-flex align-items-center justify-content-between gap-3 px-4 py-3 text-decoration-none"
                    href={`/giaovien/bai-da-nop/${submission.id}`}
                  >
                    <span>
                      <span className="d-block fw-bolder text-primary-emphasis">{title}</span>
                      <span className="d-flex flex-wrap column-gap-3 small fw-semibold text-body-secondary mt-1">
                        {subtitle && <span>{subtitle}</span>}
                        <span>
                          <i aria-hidden="true" className="bi bi-clock me-1" />
                          <time dateTime={submission.submittedAt}>{formatDateTime(submission.submittedAt)}</time>
                        </span>
                      </span>
                    </span>
                    <i aria-hidden="true" className="bi bi-chevron-right text-primary" />
                  </Link>
                </li>
              )
            })}
          </ul>
          {recent.totalDocs > RECENT_LIMIT && (
            <Link className="btn btn-outline-primary mt-4" href="/giaovien/bai-da-nop">
              Xem tất cả bài đã nộp
            </Link>
          )}
        </>
      )}
    </div>
  )
}
