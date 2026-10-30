import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { formatSoundLabel, normalizeSound } from '@/collections/Lessons/sound'
import { PageHeader } from '@/components/PageHeader'
import { SessionSync } from '@/components/SessionSync'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { hasLesson } from '@/utilities/lessonAccess'
import { getViewerLessonAccess } from '@/utilities/viewerLessonAccess'

import { LessonList, type LessonListItem } from './_components/LessonList'

export const metadata: Metadata = {
  title: 'Bài học',
}

export default async function LessonsPage() {
  // Danh sách công khai (tên âm, ảnh); trạng thái mở khóa tính trên server theo quyền thực tế
  const { payload, user } = await getCurrentUser()
  const access = await getViewerLessonAccess()

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
    user: user ?? undefined,
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
      unlocked: hasLesson(access, lesson.id),
    }
  })

  return (
    <div className="container py-5">
      {/* Trạng thái mở khóa phụ thuộc phiên: giữ Header khớp với trang */}
      <SessionSync />
      <PageHeader
        actions={
          <Link className="btn btn-outline-primary" href="/goi-hoc">
            <i aria-hidden="true" className="bi bi-bag-heart me-2" />
            Xem gói học
          </Link>
        }
        eyebrow="Luyện phát âm"
        lead={user ? undefined : 'Đăng nhập và mua gói để mở khóa nội dung từng bài.'}
        title="Chọn bài để luyện"
      />
      <LessonList lessons={lessons} />
    </div>
  )
}
