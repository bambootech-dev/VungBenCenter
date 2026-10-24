import type { Metadata } from 'next'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText } from '@payloadcms/richtext-lexical/react'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import type { SxProps, Theme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { notFound } from 'next/navigation'
import React from 'react'

import { formatSoundLabel } from '@/collections/Lessons/sound'
import { LESSON_STEP_COUNT, LESSON_STEP_KEYS, parseLessonStep } from '@/collections/Lessons/steps'
import { PageHeader } from '@/components/PageHeader'
import { requireActiveUser } from '@/utilities/requireActiveUser'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata: Metadata = {
  title: 'Bài học',
}

const stepHref = (lessonId: number, step: number) => `/bai-hoc/${lessonId}?step=${step}`

// Rich Text của từng bước: chữ lớn, dễ đọc cho trẻ nhỏ
const proseSx: SxProps<Theme> = {
  color: 'text.primary',
  fontSize: { xs: '1.125rem', md: '1.25rem' },
  lineHeight: 1.7,
  overflowWrap: 'anywhere',
  '& > * + *': { mt: 2 },
  '& h1, & h2, & h3, & h4': { color: 'primary.main', fontWeight: 500, lineHeight: 1.25 },
  '& h1': { fontSize: { xs: '1.875rem', md: '2.25rem' } },
  '& h2': { fontSize: { xs: '1.5rem', md: '1.875rem' } },
  '& h3': { fontSize: { xs: '1.25rem', md: '1.5rem' } },
  '& h4': { fontSize: '1.25rem' },
  '& ul, & ol': { pl: 3.5 },
  '& li + li': { mt: 0.75 },
  '& li::marker': { color: 'primary.main', fontWeight: 500 },
  '& a': { color: 'primary.main', fontWeight: 500, textUnderlineOffset: '3px' },
  '& a:focus-visible': { borderRadius: 1, outline: '3px solid', outlineColor: 'secondary.main', outlineOffset: 2 },
  '& strong': { fontWeight: 700 },
  '& blockquote': { bgcolor: 'm3.surfaceContainer', borderRadius: 3, color: 'text.secondary', m: 0, px: 2.5, py: 1.5 },
  '& img': { borderRadius: 4, height: 'auto', maxWidth: '100%' },
}

export default async function LessonPage({ params, searchParams }: Props) {
  const { payload, user } = await requireActiveUser()

  const { id } = await params
  const step = parseLessonStep((await searchParams).step)

  // ID của Postgres là số nguyên; giá trị khác không bao giờ khớp bài học nào
  if (!/^\d+$/.test(id)) {
    notFound()
  }

  const {
    docs: [lesson],
  } = await payload.find({
    collection: 'lessons',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      id: {
        equals: Number(id),
      },
    },
  })

  if (!lesson) {
    notFound()
  }

  const content = lesson.steps?.[LESSON_STEP_KEYS[step - 1]]
  const hasContent = Boolean(content?.root?.children?.length)

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader back={{ href: '/bai-hoc', label: 'Danh sách bài học' }} eyebrow="Luyện phát âm" title={formatSoundLabel(lesson.sound)}>
        <Paper aria-label="Các bước" component="nav" elevation={0} sx={{ bgcolor: 'm3.surfaceContainer', borderRadius: 7, display: 'inline-block', mt: 3, p: 1, maxWidth: '100%' }}>
          {/* Mobile: lưới 5 cột (5 + 4), mỗi nút vẫn ≥ 44px; từ sm trở lên: một hàng */}
          <Box
            component="ol"
            sx={{
              display: { xs: 'grid', sm: 'flex' },
              gap: { xs: 0.75, sm: 1 },
              gridTemplateColumns: 'repeat(5, 1fr)',
              justifyItems: 'center',
              listStyle: 'none',
              m: 0,
              p: 0,
            }}
          >
            {LESSON_STEP_KEYS.map((key, index) => {
              const number = index + 1
              const isCurrent = number === step

              return (
                <li key={key}>
                  <Button
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`Bước ${number}`}
                    href={stepHref(lesson.id, number)}
                    sx={{
                      borderRadius: '50%',
                      fontSize: '1.125rem',
                      fontWeight: 500,
                      height: 44,
                      minHeight: 44,
                      minWidth: 44,
                      p: 0,
                      width: 44,
                      // Bước hiện tại: nền đậm + vòng viền, không chỉ dựa vào màu
                      ...(isCurrent
                        ? { bgcolor: 'primary.main', color: 'primary.contrastText', outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2, '&:hover': { bgcolor: 'primary.dark' } }
                        : { bgcolor: 'm3.surfaceContainerLowest', color: 'text.primary', '&:hover': { bgcolor: 'm3.secondaryContainer' } }),
                    }}
                  >
                    {number}
                  </Button>
                </li>
              )
            })}
          </Box>
        </Paper>
      </PageHeader>

      <Paper
        aria-labelledby="step-heading"
        component="section"
        elevation={0}
        sx={{ bgcolor: 'm3.surfaceContainerLowest', borderRadius: 7, p: { xs: 2.5, sm: 4, md: 6 } }}
      >
        <Chip
          component="h2"
          id="step-heading"
          label={`Bước ${step} / ${LESSON_STEP_COUNT}`}
          sx={{ bgcolor: 'm3.tertiaryContainer', color: 'm3.onTertiaryContainer', fontSize: '1rem', height: 36, mb: 3, px: 0.5 }}
        />

        <Box data-testid="step-content" sx={{ minHeight: 224 }}>
          {hasContent ? (
            <Box sx={proseSx}>
              <RichText data={content as SerializedEditorState} />
            </Box>
          ) : (
            <Typography color="text.secondary" variant="subtitle1">
              Bước này chưa có nội dung.
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={2} sx={{ borderTop: 1, borderColor: 'divider', justifyContent: 'space-between', mt: 5, pt: 3 }}>
          <StepButton href={step > 1 ? stepHref(lesson.id, step - 1) : null} variant="tonal">
            <ArrowBackRounded aria-hidden="true" />
            Trước
          </StepButton>
          <StepButton href={step < LESSON_STEP_COUNT ? stepHref(lesson.id, step + 1) : null} variant="contained">
            Tiếp
            <ArrowForwardRounded aria-hidden="true" />
          </StepButton>
        </Stack>
      </Paper>
    </Container>
  )
}

const StepButton = ({
  children,
  href,
  variant,
}: {
  children: React.ReactNode
  href: string | null
  variant: 'contained' | 'tonal'
}) => {
  const sx = { fontSize: '1.125rem', gap: 1, minHeight: 56, minWidth: { xs: 128, sm: 160 } }

  // Bước đầu/cuối: nút vẫn hiển thị ở cùng vị trí nhưng bị vô hiệu hóa (không lưu tiến độ)
  if (!href) {
    return (
      <Button aria-disabled="true" component="span" disabled role="link" size="large" sx={sx} variant={variant}>
        {children}
      </Button>
    )
  }

  return (
    <Button href={href} size="large" sx={sx} variant={variant}>
      {children}
    </Button>
  )
}
