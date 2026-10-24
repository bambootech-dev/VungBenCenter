'use client'

import React from 'react'

import { primaryButtonClass } from './_components/teacherUi'

// Không hiển thị error.message: lỗi từ server có thể chứa chi tiết kỹ thuật
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex-1">
      <div className="lesson-container py-10 md:py-14">
        <div
          className="rounded-3xl border-2 border-red-200 bg-lesson-surface p-8 text-center"
          data-testid="teacher-load-error"
          role="alert"
        >
          <p className="text-xl font-extrabold text-lesson-primary-dark">Không tải được dữ liệu.</p>
          <p className="mt-2 text-base font-semibold text-lesson-muted">
            Vui lòng kiểm tra kết nối mạng rồi thử lại.
          </p>
          <button className={`${primaryButtonClass} mt-6`} onClick={() => retry()} type="button">
            Thử lại
          </button>
        </div>
      </div>
    </main>
  )
}
