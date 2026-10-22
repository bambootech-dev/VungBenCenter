import React from 'react'

export default function Loading() {
  return (
    <main className="flex-1">
      <div className="lesson-container py-10 md:py-14" role="status">
        <p className="sr-only">Đang tải…</p>
        <div aria-hidden="true" className="animate-pulse space-y-5 motion-reduce:animate-none">
          <div className="h-9 w-64 rounded-full bg-lesson-primary-soft" />
          {[0, 1, 2].map((index) => (
            <div className="h-28 rounded-[1.375rem] border-2 border-lesson-border bg-lesson-surface" key={index} />
          ))}
        </div>
      </div>
    </main>
  )
}
