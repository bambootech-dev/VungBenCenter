import React from 'react'

import { TeacherNav } from './_components/TeacherNav'

// Chỉ là khung giao diện: mỗi trang tự kiểm tra đăng nhập/quyền (layout không chạy lại khi chuyển trang)
export default function GiaoVienLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="bg-body border-bottom">
        <div className="container">
          <TeacherNav />
        </div>
      </div>
      {children}
    </>
  )
}
