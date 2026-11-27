'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

import { Logo } from '@/components/Logo/Logo'

const links = [
  { href: '/', label: 'Trang chủ' },
  { href: '/bai-hoc', label: 'Bài học' },
]

// Chỉ nạp plugin offcanvas của Bootstrap (kèm data-api cho data-bs-toggle) ở trình duyệt
const loadOffcanvas = () => import('bootstrap/js/dist/offcanvas').then((module) => module.default)

export const SiteHeader = () => {
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void loadOffcanvas()
  }, [])

  // Chuyển trang phía client không tải lại trang: tự đóng menu mobile
  useEffect(() => {
    void loadOffcanvas().then((Offcanvas) => {
      if (menuRef.current) Offcanvas.getInstance(menuRef.current)?.hide()
    })
  }, [pathname])

  return (
    <header className="sticky-top bg-body border-bottom shadow-sm">
      <nav aria-label="Điều hướng chính" className="navbar navbar-expand-lg">
        <div className="container">
          <Link aria-label="Vững Bền Center — Trang chủ" className="navbar-brand" href="/">
            <Logo />
          </Link>

          <button
            aria-controls="site-menu"
            aria-label="Mở menu"
            className="navbar-toggler"
            data-bs-target="#site-menu"
            data-bs-toggle="offcanvas"
            type="button"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div aria-labelledby="site-menu-title" className="offcanvas offcanvas-end" id="site-menu" ref={menuRef} tabIndex={-1}>
            <div className="offcanvas-header border-bottom">
              <p className="offcanvas-title h5 mb-0" id="site-menu-title">
                Menu
              </p>
              <button aria-label="Đóng menu" className="btn-close" data-bs-dismiss="offcanvas" type="button" />
            </div>

            <div className="offcanvas-body align-items-lg-center">
              <ul className="navbar-nav me-auto ms-lg-3 gap-lg-2">
                {links.map(({ href, label }) => {
                  const isCurrent = href === '/' ? pathname === '/' : pathname.startsWith(href)

                  return (
                    <li className="nav-item" key={href}>
                      <Link
                        aria-current={isCurrent ? 'page' : undefined}
                        className={clsx('nav-link', isCurrent && 'active')}
                        href={href}
                      >
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <div className="d-flex flex-column flex-lg-row gap-2 mt-4 mt-lg-0">
                <Link className="btn btn-outline-primary" href="/register/hocsinh">
                  Đăng ký
                </Link>
                <Link className="btn btn-primary" href="/login">
                  Đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
