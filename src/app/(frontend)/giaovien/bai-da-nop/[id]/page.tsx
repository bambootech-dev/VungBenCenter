import type { Metadata } from 'next'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import PersonRounded from '@mui/icons-material/PersonRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { visuallyHidden } from '@mui/utils'
import { notFound } from 'next/navigation'
import React from 'react'

import { PageHeader } from '@/components/PageHeader'
import { TemplateValuesView } from '@/components/WorksheetTemplate/TemplateValuesView'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { readTemplateSnapshot, readTemplateValues } from '@/worksheetTemplates/snapshot'

import { formatDateTime } from '../../_components/teacherUi'

// Hiển thị như assist chip M3: viền outline-variant, bo góc 8px
const META_ITEM_SX = {
  alignItems: 'center',
  border: 1,
  borderColor: 'divider',
  borderRadius: 2,
  display: 'inline-flex',
  gap: 1,
  minHeight: 32,
  px: 1.5,
  py: 0.5,
} as const

export const metadata: Metadata = {
  title: 'Bài đã nộp',
}

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SubmissionDetailPage({ params, searchParams }: Props) {
  const { payload, user } = await requireActiveTeacher()
  const { id } = await params
  const justSubmitted = (await searchParams)['vua-nop'] === '1'

  if (!/^\d+$/.test(id)) {
    notFound()
  }

  // overrideAccess: false → bài của Giáo viên khác không bao giờ được trả về, kể cả khi đổi ID trên URL
  const {
    docs: [submission],
  } = await payload.find({
    collection: 'worksheet-submissions',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    populate: {
      users: { name: true },
    },
    user,
    where: { id: { equals: Number(id) } },
  })

  if (!submission) {
    notFound()
  }

  // Phiếu theo mẫu hệ thống: hiển thị theo bản chụp mẫu lúc nộp; bài kiểu cũ: theo bản chụp worksheet
  const template = readTemplateSnapshot(submission.templateSnapshot)
  const snapshot = submission.worksheetSnapshot
  const title = submission.title ?? snapshot?.title ?? 'Phiếu'
  const teacherName =
    submission.teacher && typeof submission.teacher === 'object' ? submission.teacher.name : user.name
  // Ghép câu trả lời theo mã câu hỏi của bản chụp đề, không theo vị trí
  const answers = new Map((submission.answers ?? []).map((answer) => [answer.questionKey, answer.value]))

  return (
    <Box sx={{ maxWidth: template ? undefined : 860 }}>
      {justSubmitted && (
        <Alert data-testid="submission-success" role="status" severity="success" sx={{ mb: 3 }}>
          Đã nộp phiếu thành công.
        </Alert>
      )}

      <PageHeader back={{ href: '/giaovien/bai-da-nop', label: 'Bài đã nộp' }} eyebrow="Bài đã nộp" title={title} titleTestId="submission-title">
        <Stack component="dl" direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, m: 0, mt: 2.5 }}>
          <Box sx={META_ITEM_SX}>
            <Typography color="text.secondary" component="dt" sx={{ alignItems: 'center', display: 'inline-flex', gap: 0.75 }} variant="body2">
              <PersonRounded aria-hidden="true" sx={{ fontSize: 18 }} />
              Người nộp:
            </Typography>
            <Typography component="dd" data-testid="submission-teacher" sx={{ fontWeight: 500, m: 0 }} variant="body2">
              {teacherName}
            </Typography>
          </Box>
          <Box sx={META_ITEM_SX}>
            <Typography color="text.secondary" component="dt" sx={{ alignItems: 'center', display: 'inline-flex', gap: 0.75 }} variant="body2">
              <AccessTimeRounded aria-hidden="true" sx={{ fontSize: 18 }} />
              Nộp lúc:
            </Typography>
            <Typography component="dd" data-testid="submission-time" sx={{ fontWeight: 500, m: 0 }} variant="body2">
              <time dateTime={submission.submittedAt}>{formatDateTime(submission.submittedAt)}</time>
            </Typography>
          </Box>
        </Stack>
      </PageHeader>

      {template && (
        <TemplateValuesView teacherName={teacherName} template={template} values={readTemplateValues(submission.data)} />
      )}

      {!template && snapshot?.instructions && (
        <Card aria-label="Hướng dẫn" component="section" sx={{ mb: 3 }}>
          <CardContent>
            <Typography component="h2" sx={{ mb: 1 }} variant="h6">
              Hướng dẫn
            </Typography>
            <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
              {snapshot.instructions}
            </Typography>
          </CardContent>
        </Card>
      )}

      {!template && (
        <Stack component="ol" data-testid="submission-answers" spacing={2} sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {(snapshot?.questions ?? []).map((question, index) => {
            const answer = answers.get(question.key)

            return (
              <Card component="li" data-question-key={question.key} key={question.key}>
                <CardContent>
                  <Typography component="h2" sx={{ mb: 1.5 }} variant="h6">
                    <Box component="span" sx={{ color: 'primary.main', mr: 1 }}>
                      {index + 1}.
                    </Box>
                    {question.label}
                    {question.required && (
                      <>
                        <Box aria-hidden="true" component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                          *
                        </Box>
                        <Box component="span" sx={visuallyHidden}>
                          {' '}
                          (bắt buộc)
                        </Box>
                      </>
                    )}
                  </Typography>
                  {answer ? (
                    <Typography
                      data-testid="submission-answer"
                      sx={{ bgcolor: 'm3.surfaceContainerHigh', borderRadius: 3, overflowWrap: 'anywhere', p: 2, whiteSpace: 'pre-line' }}
                    >
                      {answer}
                    </Typography>
                  ) : (
                    <Typography
                      color="text.secondary"
                      data-testid="submission-no-answer"
                      sx={{ border: 1, borderColor: 'divider', borderRadius: 3, fontStyle: 'italic', p: 2 }}
                    >
                      Không trả lời
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
