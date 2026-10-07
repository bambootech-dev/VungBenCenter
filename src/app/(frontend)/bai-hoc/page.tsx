import type { Metadata } from 'next'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { formatSoundLabel, normalizeSound } from '@/collections/Lessons/sound'
import type { Media } from '@/payload-types'
import { requireActiveUser } from '@/utilities/requireActiveUser'

export const metadata: Metadata = {
  title: 'Bài học',
}

export default async function LessonsPage() {
  const { payload, user } = await requireActiveUser()

  const { docs: lessons } = await payload.find({
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

  return (
    <main className="flex-1 bg-emerald-50/60">
      <div className="container py-10 md:py-14">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-emerald-950 md:text-4xl">
          Chọn bài để luyện
        </h1>

        {lessons.length === 0 ? (
          <p className="text-muted-foreground">Chưa có bài học nào.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {lessons.map((lesson) => {
              const thumbnail = typeof lesson.thumbnail === 'object' ? lesson.thumbnail : null

              return (
                <li key={lesson.id}>
                  <Link
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-emerald-600"
                    data-testid="lesson-card"
                    href={`/bai-hoc/${lesson.id}`}
                  >
                    <LessonThumbnail sound={lesson.sound} thumbnail={thumbnail} />
                    <span className="flex items-center justify-between gap-2 px-4 py-3">
                      <span className="text-lg font-semibold text-emerald-950">
                        {formatSoundLabel(lesson.sound)}
                      </span>
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition group-hover:bg-emerald-700"
                      >
                        <ChevronRight className="size-5" />
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}

const LessonThumbnail = ({ sound, thumbnail }: { sound: string; thumbnail: Media | null }) => {
  if (thumbnail?.url) {
    return (
      <span className="relative block aspect-[4/3] bg-emerald-100">
        <Image
          alt={thumbnail.alt || ''}
          className="object-cover"
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          src={thumbnail.url}
        />
      </span>
    )
  }

  // Không có ảnh: hiển thị chính âm đó cỡ lớn
  return (
    <span
      aria-hidden="true"
      className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-emerald-100 to-lime-50 text-5xl font-bold text-emerald-700"
    >
      {normalizeSound(sound)}
    </span>
  )
}
