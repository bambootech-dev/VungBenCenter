import Link from 'next/link'
import React from 'react'

export default function NotFound() {
  return (
    <div className="container py-5 my-md-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm text-center">
            <div className="card-body p-5">
              <h1 className="display-1 text-primary mb-2">404</h1>
              <p className="lead text-body-secondary mb-4">Không tìm thấy trang bạn yêu cầu.</p>
              <Link className="btn btn-primary btn-lg" href="/">
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
