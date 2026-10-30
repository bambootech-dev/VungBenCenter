import Link from 'next/link'
import React from 'react'

/** Nội dung trang 404 dùng chung cho `notFound()` trong frontend và URL không khớp route nào. */
export const NotFoundContent = () => (
  <div className="container py-5 my-md-5">
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-sm text-center">
          <div className="card-body p-4 p-sm-5">
            <span aria-hidden="true" className="icon-circle bg-primary-subtle text-primary mb-3">
              <i className="bi bi-signpost-split" />
            </span>
            <h1 className="display-1 text-primary mb-2">404</h1>
            <p className="lead fw-bold mb-2">Không tìm thấy trang bạn yêu cầu.</p>
            <p className="text-body-secondary mb-4">
              Đường dẫn có thể đã thay đổi hoặc không còn tồn tại. Hãy kiểm tra lại địa chỉ hoặc quay về Trang chủ.
            </p>
            <Link className="btn btn-primary btn-lg" href="/">
              <i aria-hidden="true" className="bi bi-house-door me-2" />
              Về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
)
