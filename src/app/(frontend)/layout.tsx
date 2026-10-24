import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getServerSideURL } from '@/utilities/getURL'

import { lessonFont } from './bai-hoc/_components/lessonFont'

import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="vi">
      <head>
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      {/* Nền xanh nhạt và font Nunito của trang /bai-hoc cho mọi trang */}
      <body className={cn(lessonFont.className, 'lesson-page')}>
        <SiteHeader />
        {children}
        <SiteFooter />
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
