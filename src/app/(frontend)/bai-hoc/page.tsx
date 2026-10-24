import type { Metadata } from 'next'
import Container from '@mui/material/Container'
import React from 'react'

import { formatSoundLabel, normalizeSound } from '@/collections/Lessons/sound'
import { PageHeader } from '@/components/PageHeader'
import { requireActiveUser } from '@/utilities/requireActiveUser'

import { LessonList, type LessonListItem } from './_components/LessonList'

export const metadata: Metadata = {
  title: 'Bài học',
}

export default async function LessonsPage() {
  const { payload, user } = await requireActiveUser()

  const { docs } = await payload.find({
    collection: 'lessons',
    depth: 1,
    overrideAccess: false,
    pagination: false,
    select: {
      sound: true,
      thumbnail: true,
    },
    sort: 'order',
    user,
  })

  // Chỉ truyền xuống client những gì card cần (không có nội dung các bước).
  // Tìm kiếm lọc trên danh sách này, không gọi /api/lessons từ trình duyệt.
  const lessons: LessonListItem[] = docs.map((lesson) => {
    // depth: 1 trả về Media object; null hoặc chỉ có ID → placeholder
    const thumbnail =
      lesson.thumbnail && typeof lesson.thumbnail === 'object' ? lesson.thumbnail : null

    return {
      id: lesson.id,
      label: formatSoundLabel(lesson.sound),
      sound: normalizeSound(lesson.sound),
      thumbnailUrl: thumbnail?.url || null,
    }
  })

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
      <PageHeader eyebrow="Luyện phát âm" title="Chọn bài để luyện" />
      <LessonList lessons={lessons} />
    </Container>
  )
}
