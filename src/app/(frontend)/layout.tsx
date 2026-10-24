import type { Metadata, Viewport } from 'next'

import Box from '@mui/material/Box'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import React from 'react'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { SkipLink, MAIN_CONTENT_ID } from '@/components/SkipLink'
import { roboto } from '@/theme/fonts'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { getServerSideURL } from '@/utilities/getURL'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={roboto.variable} lang="vi">
      <head>
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider>
            <SkipLink />
            <SiteHeader />
            {/* Mỗi trang chỉ dựng nội dung; khung <main> dùng chung đặt ở đây */}
            <Box component="main" id={MAIN_CONTENT_ID} sx={{ display: 'flex', flex: 1, flexDirection: 'column', '&:focus': { outline: 'none' } }} tabIndex={-1}>
              {children}
            </Box>
            <SiteFooter />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}

export const viewport: Viewport = {
  themeColor: '#f6fbf3',
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
