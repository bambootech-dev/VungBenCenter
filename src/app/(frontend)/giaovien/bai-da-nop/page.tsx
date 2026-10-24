import type { Metadata } from 'next'
import Stack from '@mui/material/Stack'
import React from 'react'

import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { readSubtitle } from '@/worksheetTemplates/snapshot'

import { Pagination } from '../_components/Pagination'
import { SubmissionCard } from '../_components/SubmissionCard'
import { parsePage } from '../_components/teacherUi'

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
    <>
      <PageHeader
        description={result.totalDocs > 0 ? `Tổng cộng ${result.totalDocs} bài, mới nhất ở trên cùng.` : undefined}
        eyebrow="Giáo viên"
        title="Bài đã nộp"
      />

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
        <Stack component="ul" data-testid="submission-list" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {result.docs.map((submission) => (
            <li key={submission.id}>
              <SubmissionCard
                id={submission.id}
                submittedAt={submission.submittedAt}
                subtitle={readSubtitle(submission.templateSnapshot, submission.data)}
                testId="submission-card"
                // Phiếu theo mẫu có `title`; bài kiểu cũ lấy tiêu đề từ bản chụp worksheet
                title={submission.title ?? submission.worksheetSnapshot?.title ?? 'Phiếu'}
              />
            </li>
          ))}
        </Stack>
      )}

      <Pagination basePath="/giaovien/bai-da-nop" page={page} totalPages={result.totalPages} />
    </>
  )
}
