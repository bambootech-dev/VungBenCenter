'use client'

import React from 'react'


// Không hiển thị error.message: lỗi từ server có thể chứa chi tiết kỹ thuật
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="container py-5">
      <div className="card shadow-sm border-danger-subtle" data-testid="teacher-load-error" role="alert">
        <div className="card-body text-center p-5">
          <i aria-hidden="true" className="bi bi-wifi-off display-5 text-danger" />
          <p className="h4 mt-3 mb-2">Không tải được dữ liệu.</p>
          <p className="text-body-secondary mb-4">Vui lòng kiểm tra kết nối mạng rồi thử lại.</p>
          <button className="btn btn-primary btn-lg" onClick={() => retry()} type="button">
            Thử lại
          </button>
        </div>
      </div>
    </div>
  )
}
