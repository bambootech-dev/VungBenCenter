'use client'

import Link from 'next/link'
import React, { useId, useMemo, useState } from 'react'

import { normalizeSound } from '@/collections/Lessons/sound'
import { EmptyState } from '@/components/EmptyState'

import { LessonThumbnail } from './LessonThumbnail'

// Chỉ những gì cần để hiển thị card; trang server đã đọc bài học bằng quyền của user
export type LessonListItem = {
  id: number
  label: string
  sound: string
  thumbnailUrl: string | null
  /** Server đã kiểm tra quyền; chỉ quyết định hiển thị, trang bài học vẫn tự kiểm tra lại */
  unlocked: boolean
}

type StatusFilter = 'all' | 'locked' | 'unlocked'

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'Tất cả bài học', value: 'all' },
  { label: 'Đã mở khóa', value: 'unlocked' },
  { label: 'Chưa mở khóa', value: 'locked' },
]

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
  const [status, setStatus] = useState<StatusFilter>('all')
  const inputId = useId()

  const visibleLessons = useMemo(
    () =>
      lessons.filter(
        (lesson) =>
          matchesLesson(lesson, query) &&
          (status === 'all' || (status === 'unlocked') === lesson.unlocked),
      ),
    [lessons, query, status],
  )

  const countOf = (value: StatusFilter) =>
    value === 'all' ? lessons.length : lessons.filter((lesson) => (value === 'unlocked') === lesson.unlocked).length

  if (lessons.length === 0) {
    return <EmptyState icon="bi-journal-text" message="Chưa có bài học nào." />
  }

  return (
    <>
      <div className="col-md-8 col-lg-6 mb-4 mb-md-5" role="search">
        <label className="visually-hidden" htmlFor={inputId}>
          Tìm bài học âm
        </label>
        <div className="input-group input-group-lg shadow-sm rounded">
          <span className="input-group-text bg-body">
            <i aria-hidden="true" className="bi bi-search" />
          </span>
          <input
            autoComplete="off"
            className="form-control border-start-0 ps-0"
            id={inputId}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm bài học âm..."
            type="search"
            value={query}
          />
        </div>
      </div>

      <div aria-label="Lọc theo trạng thái" className="d-flex flex-wrap gap-2 mb-4" role="group">
        {FILTERS.map((filter) => (
          <button
            aria-pressed={status === filter.value}
            className={`btn ${status === filter.value ? 'btn-primary' : 'btn-outline-primary'}`}
            key={filter.value}
            onClick={() => setStatus(filter.value)}
            type="button"
          >
            {filter.label} <span className="badge text-bg-light ms-1">{countOf(filter.value)}</span>
          </button>
        ))}
      </div>

      {/* Báo số kết quả cho trình đọc màn hình khi lọc */}
      <p aria-live="polite" className="visually-hidden">
        {query.trim() || status !== 'all' ? `Tìm thấy ${visibleLessons.length} bài học` : ''}
      </p>

      {visibleLessons.length === 0 ? (
        <EmptyState icon="bi-search" message="Không tìm thấy bài học phù hợp." testId="lesson-search-empty" />
      ) : (
        // Số cột cố định theo màn hình: 1–2 bài vẫn giữ độ rộng card, căn từ trái
        <ul className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4 list-unstyled mb-0" data-testid="lesson-grid">
          {visibleLessons.map((lesson, index) => (
            <li className="col" key={lesson.id}>
              {/* Chưa mở khóa: card dẫn tới các gói có bài này thay vì trang bài học */}
              <Link
                className="card card-hover h-100 overflow-hidden"
                data-testid="lesson-card"
                data-unlocked={lesson.unlocked}
                href={lesson.unlocked ? `/bai-hoc/${lesson.id}` : `/goi-hoc?bai=${lesson.id}`}
              >
                <LessonThumbnail eager={index < 3} sound={lesson.sound} url={lesson.thumbnailUrl} />
                <span className="card-body d-flex flex-column gap-3">
                  <span className="d-flex align-items-center justify-content-between gap-3">
                    <span className="h3 mb-0">{lesson.label}</span>
                    {lesson.unlocked ? (
                      <span className="badge bg-primary-subtle text-primary-emphasis">
                        <i aria-hidden="true" className="bi bi-unlock-fill me-1" />
                        Đã mở khóa
                      </span>
                    ) : (
                      <span className="badge text-bg-light border">
                        <i aria-hidden="true" className="bi bi-lock-fill me-1" />
                        Chưa mở khóa
                      </span>
                    )}
                  </span>
                  <span className={`btn ${lesson.unlocked ? 'btn-primary' : 'btn-outline-primary'} mt-auto`}>
                    {lesson.unlocked ? 'Vào học' : 'Xem gói học'}
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
