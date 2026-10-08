'use client'

import { ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import React, { useId, useMemo, useState } from 'react'

import { normalizeSound } from '@/collections/Lessons/sound'

import { LessonThumbnail } from './LessonThumbnail'

// Chỉ những gì cần để hiển thị card; trang server đã đọc bài học bằng quyền của user
export type LessonListItem = {
  id: number
  label: string
  sound: string
  thumbnailUrl: string | null
}

const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('vi')

// "th", "TH", "Âm Th" đều khớp bài "Th"; ô trống → hiển thị tất cả
export const matchesLesson = (lesson: Pick<LessonListItem, 'label' | 'sound'>, query: string) => {
  const keyword = normalize(query)

  if (!keyword) return true

  return (
    normalize(lesson.label).includes(keyword) ||
    normalize(lesson.sound).includes(normalize(normalizeSound(query)))
  )
}

export const LessonList = ({ lessons }: { lessons: LessonListItem[] }) => {
  const [query, setQuery] = useState('')
  const inputId = useId()

  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => matchesLesson(lesson, query)),
    [lessons, query],
  )

  if (lessons.length === 0) {
    return (
      <p className="rounded-3xl border border-lesson-border bg-lesson-surface p-8 text-lg font-semibold text-lesson-muted">
        Chưa có bài học nào.
      </p>
    )
  }

  return (
    <>
      <div className="mb-8 w-full md:mb-10 md:max-w-[32rem]" role="search">
        <label className="sr-only" htmlFor={inputId}>
          Tìm bài học âm
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-5 top-1/2 size-6 -translate-y-1/2 text-lesson-muted"
            strokeWidth={2.5}
          />
          <input
            autoComplete="off"
            className="h-14 w-full rounded-full border-2 border-lesson-border bg-lesson-surface pl-14 pr-5 text-lg font-semibold text-lesson-primary-dark shadow-[0_6px_20px_-14px_rgb(20_83_45/0.4)] transition placeholder:font-semibold placeholder:text-lesson-muted/80 focus:border-lesson-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-lesson-primary/25 [&::-webkit-search-cancel-button]:cursor-pointer"
            id={inputId}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm bài học âm..."
            type="search"
            value={query}
          />
        </div>
      </div>

      {/* Báo số kết quả cho trình đọc màn hình khi lọc */}
      <p aria-live="polite" className="sr-only">
        {query.trim() ? `Tìm thấy ${visibleLessons.length} bài học` : ''}
      </p>

      {visibleLessons.length === 0 ? (
        <p
          className="rounded-3xl border-2 border-dashed border-lesson-border bg-lesson-surface/80 p-8 text-center text-lg font-bold text-lesson-muted"
          data-testid="lesson-search-empty"
        >
          Không tìm thấy bài học phù hợp.
        </p>
      ) : (
        // Số cột cố định theo màn hình: 1–2 bài vẫn giữ độ rộng card, căn từ trái
        <ul
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3"
          data-testid="lesson-grid"
        >
          {visibleLessons.map((lesson, index) => (
            <li key={lesson.id}>
              <Link
                className="group flex h-full flex-col overflow-hidden rounded-[1.375rem] border-2 border-lesson-border bg-lesson-surface shadow-[0_6px_20px_-12px_rgb(20_83_45/0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-lesson-primary/40 hover:shadow-[0_14px_28px_-14px_rgb(20_83_45/0.45)] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-lesson-primary-dark motion-reduce:hover:translate-y-0"
                data-testid="lesson-card"
                href={`/bai-hoc/${lesson.id}`}
              >
                <LessonThumbnail eager={index < 3} sound={lesson.sound} url={lesson.thumbnailUrl} />
                <span className="flex items-center justify-between gap-3 px-5 py-4">
                  <span className="text-2xl font-extrabold text-lesson-primary-dark">
                    {lesson.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-full bg-lesson-primary text-white shadow-[0_4px_10px_-4px_rgb(21_128_61/0.7)] transition group-hover:bg-lesson-primary-dark"
                  >
                    <ArrowRight className="size-6" strokeWidth={2.75} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
