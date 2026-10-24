import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import React from 'react'

import { TeacherNav } from './_components/TeacherNav'

// Chỉ là khung giao diện: mỗi trang tự kiểm tra đăng nhập/quyền (layout không chạy lại khi chuyển trang)
export default function GiaoVienLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Box
        sx={{
          alignItems: 'start',
          display: 'grid',
          gap: { xs: 3, md: 5 },
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '256px minmax(0, 1fr)' },
        }}
      >
        <TeacherNav />
        <Box sx={{ minWidth: 0 }}>{children}</Box>
      </Box>
    </Container>
  )
}
