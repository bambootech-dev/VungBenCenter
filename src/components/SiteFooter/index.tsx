import Link from 'next/link'
import React from 'react'

import { Logo } from '@/components/Logo/Logo'

const columns = [
  {
    title: 'Học tập',
    links: [
      { href: '/bai-hoc', label: 'Bài học phát âm' },
      { href: '/hocsinh/dashboard', label: 'Trang Học sinh / Phụ huynh' },
      { href: '/giaovien/dashboard', label: 'Trang Giáo viên' },
    ],
  },
  {
    title: 'Tài khoản',
    links: [
      { href: '/login', label: 'Đăng nhập' },
      { href: '/register/hocsinh', label: 'Đăng ký tài khoản người học' },
      { href: '/register/giaovien', label: 'Đăng ký Giáo viên' },
    ],
  },
]

export const SiteFooter = () => {
  return (
    <footer className="mt-auto bg-body border-top">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <Logo />
            <p className="text-body-secondary mt-3 mb-0 col-lg-10">
              Nền tảng học tập dành cho Học sinh / Phụ huynh và Giáo viên của trung tâm.
            </p>
          </div>

          {columns.map((column) => (
            <nav aria-labelledby={`footer-${column.title}`} className="col-6 col-lg-3" key={column.title}>
              <h2 className="h6 text-uppercase text-body-secondary fw-bold mb-3" id={`footer-${column.title}`}>
                {column.title}
              </h2>
              <ul className="list-unstyled d-grid gap-2 mb-0">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link className="link-body-emphasis link-underline-opacity-0 link-underline-opacity-100-hover fw-semibold" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="small text-body-secondary border-top pt-4 mt-5 mb-0">
          © {new Date().getFullYear()} Vững Bền Center
        </p>
      </div>
    </footer>
  )
}
