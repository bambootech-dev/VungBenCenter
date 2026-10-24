import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import AssignmentRounded from '@mui/icons-material/AssignmentRounded'
import FactCheckRounded from '@mui/icons-material/FactCheckRounded'
import NoteAddRounded from '@mui/icons-material/NoteAddRounded'
import Box from '@mui/material/Box'

import { PageHeader } from '@/components/PageHeader'
import { QuickLinkCard } from '@/components/QuickLinkCard'

export default async function GiaoVienDashboardPage() {
  const payload = await getPayload({ config })
  const headers = await getHeaders()

  const { user } = await payload.auth({
    headers,
    canSetHeaders: false,
  })

  if (!user) {
    redirect('/login/giaovien')
  }

  if (user.role !== 'giaovien') {
    if (user.role === 'admin') {
      redirect('/admin')
    }

    redirect('/hocsinh/dashboard')
  }

  return (
    <>
      <PageHeader
        description="Tạo phiếu theo mẫu và xem lại các bài bạn đã nộp."
        eyebrow="Trang Giáo viên"
        title={`Xin chào ${user.name || user.email}`}
      />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' } }}>
        <QuickLinkCard
          description="Chọn mẫu có sẵn và điền phiếu mới."
          href="/giaovien/phieu/moi"
          icon={<NoteAddRounded fontSize="inherit" />}
          title="Tạo phiếu mới"
        />
        <QuickLinkCard
          description="Danh sách phiếu và các phiếu nộp gần đây."
          href="/giaovien/phieu"
          icon={<AssignmentRounded fontSize="inherit" />}
          title="Danh sách phiếu"
        />
        <QuickLinkCard
          description="Xem chi tiết từng phiếu đã nộp."
          href="/giaovien/bai-da-nop"
          icon={<FactCheckRounded fontSize="inherit" />}
          title="Bài đã nộp"
        />
      </Box>
    </>
  )
}
