import React from 'react'

import { cn } from '@/utilities/ui'

import { lessonFont } from '../bai-hoc/_components/lessonFont'
import { TeacherNav } from './_components/TeacherNav'

// Chỉ là khung giao diện: mỗi trang tự kiểm tra đăng nhập/quyền (layout không chạy lại khi chuyển trang)
export default function GiaoVienLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(lessonFont.className, 'lesson-page flex flex-1 flex-col')}>
      <div className="border-b-2 border-lesson-border bg-lesson-surface/80">
        <div className="lesson-container">
          <TeacherNav />
        </div>
      </div>
      {children}
    </div>
  )
}
