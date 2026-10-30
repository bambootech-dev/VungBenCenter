import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { Logo } from '@/components/Logo/Logo'
import { NotFoundContent } from '@/components/NotFoundContent'

import { nunito } from './(frontend)/font'

import 'bootstrap-icons/font/bootstrap-icons.min.css'
import './(frontend)/styles/main.scss'

export const metadata: Metadata = {
  title: 'Không tìm thấy trang | Vững Bền Center',
  description: 'Trang bạn yêu cầu không tồn tại.',
}

/**
 * URL không khớp route nào. Dự án có hai root layout (frontend và Payload Admin) nên cần
 * global-not-found (experimental.globalNotFound). File này bỏ qua layout: tự nạp style/font
 * và không đọc phiên đăng nhập, nên Header ở đây chỉ có logo, không có nút tài khoản.
 */
export default function GlobalNotFound() {
  return (
    <html className={nunito.variable} data-bs-theme="light" lang="vi">
      <head>
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body className="d-flex flex-column min-vh-100">
        <header className="bg-body border-bottom shadow-sm">
          <nav aria-label="Điều hướng chính" className="navbar">
            <div className="container">
              <Link aria-label="Vững Bền Center — Trang chủ" className="navbar-brand" href="/">
                <Logo />
              </Link>
            </div>
          </nav>
        </header>
        <main className="d-flex flex-column flex-grow-1" id="main">
          <NotFoundContent />
        </main>
      </body>
    </html>
  )
}
