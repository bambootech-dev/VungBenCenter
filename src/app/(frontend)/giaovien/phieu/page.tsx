import type { Metadata } from 'next'
import AddRounded from '@mui/icons-material/AddRounded'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import React from 'react'

import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { readSubtitle } from '@/worksheetTemplates/snapshot'

import { SubmissionCard } from '../_components/SubmissionCard'

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
    <>
      <PageHeader
        actions={
          <Button href="/giaovien/phieu/moi" size="large" startIcon={<AddRounded />} variant="contained">
            Tạo phiếu
          </Button>
        }
        description="Bấm “Tạo phiếu” để chọn mẫu và điền phiếu mới."
        eyebrow="Giáo viên"
        title="Phiếu"
      />

      <Typography component="h2" sx={{ mb: 2 }} variant="h5">
        Phiếu nộp gần đây
      </Typography>

      {recent.docs.length === 0 ? (
        <EmptyState message="Bạn chưa nộp phiếu nào." testId="recent-submissions-empty" />
      ) : (
        <>
          <Stack component="ul" data-testid="recent-submissions" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {recent.docs.map((submission) => (
              <li key={submission.id}>
                <SubmissionCard
                  id={submission.id}
                  submittedAt={submission.submittedAt}
                  subtitle={readSubtitle(submission.templateSnapshot, submission.data)}
                  title={submission.title ?? submission.worksheetSnapshot?.title ?? 'Phiếu'}
                />
              </li>
            ))}
          </Stack>
          {recent.totalDocs > RECENT_LIMIT && (
            <Button href="/giaovien/bai-da-nop" sx={{ mt: 3 }} variant="tonal">
              Xem tất cả bài đã nộp
            </Button>
          )}
        </>
      )}
    </>
  )
}
