import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import AutoStoriesRounded from '@mui/icons-material/AutoStoriesRounded'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'

import { PageHeader } from '@/components/PageHeader'
import { QuickLinkCard } from '@/components/QuickLinkCard'

export default async function HocSinhDashboardPage() {
  const payload = await getPayload({ config })
  const headers = await getHeaders()

  const { user } = await payload.auth({
    headers,
    canSetHeaders: false,
  })

  if (!user) {
    redirect('/login/hocsinh')
  }

  if (user.role !== 'hocsinh') {
    if (user.role === 'admin') {
      redirect('/admin')
    }

    redirect('/giaovien/dashboard')
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
      <PageHeader
        description="Chọn một mục bên dưới để bắt đầu."
        eyebrow="Trang Học sinh / Phụ huynh"
        title={`Xin chào ${user.name || user.email}`}
      />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
        <QuickLinkCard
          description="Luyện phát âm từng bước với các bài học của trung tâm."
          href="/bai-hoc"
          icon={<AutoStoriesRounded fontSize="inherit" />}
          title="Bài học"
        />
      </Box>
    </Container>
  )
}
