import type { Metadata } from 'next'

import React from 'react'

import { AuthSyncProvider } from '@/components/AuthSync'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getServerSideURL } from '@/utilities/getURL'
import { getViewer } from '@/utilities/viewer'

import { nunito } from './font'

import 'bootstrap-icons/font/bootstrap-icons.min.css'
import './styles/main.scss'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Trạng thái đăng nhập do server xác thực qua Payload; layout vì vậy render động theo cookie
  const viewer = await getViewer()

  return (
    <html className={nunito.variable} data-bs-theme="light" lang="vi">
      <head>
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body className="d-flex flex-column min-vh-100">
        <a className="visually-hidden-focusable btn btn-primary position-absolute top-0 start-0 m-2 z-3" href="#main">
          Bỏ qua, đến nội dung chính
        </a>
        <AuthSyncProvider viewer={viewer}>
          <SiteHeader />
          <main className="d-flex flex-column flex-grow-1" id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
        </AuthSyncProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: {
    default: 'Vững Bền Center',
    template: '%s | Vững Bền Center',
  },
  description: 'Nền tảng dành cho Học sinh / Phụ huynh và Giáo viên của Vững Bền Center.',
  openGraph: {
    type: 'website',
    siteName: 'Vững Bền Center',
    title: 'Vững Bền Center',
    description: 'Nền tảng dành cho Học sinh / Phụ huynh và Giáo viên của Vững Bền Center.',
  },
}
