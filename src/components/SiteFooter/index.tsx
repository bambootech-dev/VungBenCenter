'use client'

import Link from 'next/link'
import React from 'react'

import { useAuthState } from '@/components/AuthSync'
import { Logo } from '@/components/Logo/Logo'
import { LogoutButton } from '@/components/LogoutButton'

const linkClass = 'link-body-emphasis link-underline-opacity-0 link-underline-opacity-100-hover fw-semibold'

const guestColumns = [
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

const FooterColumn = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <nav aria-labelledby={`footer-${title}`} className="col-6 col-lg-3">
    <h2 className="h6 text-uppercase text-body-secondary fw-bold mb-3" id={`footer-${title}`}>
      {title}
    </h2>
    <ul className="list-unstyled d-grid gap-2 mb-0">{children}</ul>
  </nav>
)

export const SiteFooter = () => {
  const { viewer } = useAuthState()

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

          {viewer ? (
            <>
              <FooterColumn title="Học tập">
                <li>
                  <Link className={linkClass} href="/bai-hoc">
                    Bài học phát âm
                  </Link>
                </li>
              </FooterColumn>
              <FooterColumn title="Tài khoản">
                <li>
                  <Link className={linkClass} href={viewer.dashboardHref}>
                    {viewer.dashboardLabel}
                  </Link>
                </li>
                <li>
                  <LogoutButton className={`btn btn-link p-0 text-decoration-none ${linkClass}`} />
                </li>
              </FooterColumn>
            </>
          ) : (
            guestColumns.map((column) => (
              <FooterColumn key={column.title} title={column.title}>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link className={linkClass} href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </FooterColumn>
            ))
          )}
        </div>

        <p className="small text-body-secondary border-top pt-4 mt-5 mb-0">
          © {new Date().getFullYear()} Vững Bền Center
        </p>
      </div>
    </footer>
  )
}
