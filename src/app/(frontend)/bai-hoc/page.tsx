import type { Metadata } from 'next'
import React from 'react'

import { formatSoundLabel, normalizeSound } from '@/collections/Lessons/sound'
import { cn } from '@/utilities/ui'
import { requireActiveUser } from '@/utilities/requireActiveUser'

import { LessonList, type LessonListItem } from './_components/LessonList'
import { lessonFont } from './_components/lessonFont'

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
    <main className={cn(lessonFont.className, 'lesson-page flex-1')}>
      <div className="lesson-container py-10 md:py-14">
        <p className="mb-3 inline-flex rounded-full bg-lesson-primary-soft px-4 py-1.5 text-sm font-bold text-lesson-primary-dark">
          Luyện phát âm
        </p>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-lesson-primary-dark md:text-5xl">
          Chọn bài để luyện
        </h1>

        <LessonList lessons={lessons} />
      </div>
    </main>
  )
}
