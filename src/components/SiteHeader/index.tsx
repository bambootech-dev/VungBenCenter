'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

import { useAuthState } from '@/components/AuthSync'
import { Logo } from '@/components/Logo/Logo'
import { LogoutButton } from '@/components/LogoutButton'

const links = [
  { href: '/', label: 'Trang chủ' },
  { href: '/bai-hoc', label: 'Bài học' },
]

// Chỉ nạp plugin offcanvas của Bootstrap (kèm data-api cho data-bs-toggle) ở trình duyệt
const loadOffcanvas = () => import('bootstrap/js/dist/offcanvas').then((module) => module.default)

/** Header hiển thị trạng thái đăng nhập do server xác thực (qua AuthSyncProvider). */
export const SiteHeader = () => {
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  const { sessionEndedWhileEditing, viewer } = useAuthState()

  useEffect(() => {
    void loadOffcanvas()
    void import('bootstrap/js/dist/dropdown')
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

              {viewer ? (
                <ul className="navbar-nav mt-4 mt-lg-0" data-testid="account-menu">
                  <li className="nav-item dropdown">
                    <button
                      aria-expanded="false"
                      className="nav-link dropdown-toggle d-flex align-items-center gap-2 fw-bold"
                      data-bs-toggle="dropdown"
                      type="button"
                    >
                      <i aria-hidden="true" className="bi bi-person-circle fs-4 text-primary" />
                      <span className="text-truncate account-name">{viewer.name}</span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                      <li>
                        <Link className="dropdown-item" href={viewer.dashboardHref}>
                          <i aria-hidden="true" className="bi bi-speedometer2 me-2" />
                          {viewer.dashboardLabel}
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <LogoutButton className="dropdown-item text-danger" />
                      </li>
                    </ul>
                  </li>
                </ul>
              ) : (
                <div className="d-flex flex-column flex-lg-row gap-2 mt-4 mt-lg-0">
                  <Link className="btn btn-outline-primary" href="/register/hocsinh">
                    Đăng ký
                  </Link>
                  <Link className="btn btn-primary" href="/login">
                    Đăng nhập
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {sessionEndedWhileEditing && (
        <div className="alert alert-warning rounded-0 border-0 border-top mb-0" data-testid="session-ended" role="alert">
          <div className="container d-flex gap-2 align-items-start">
            <i aria-hidden="true" className="bi bi-exclamation-triangle-fill" />
            <p className="mb-0">
              Phiên đăng nhập đã kết thúc. Nội dung bạn đang nhập vẫn được giữ ở trang này —{' '}
              <Link className="alert-link" href="/login" rel="noopener" target="_blank">
                đăng nhập lại trong thẻ mới
              </Link>{' '}
              rồi quay lại đây để tiếp tục.
            </p>
          </div>
        </div>
      )}
    </header>
  )
}
