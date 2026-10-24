'use client'

import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import React from 'react'

// Không hiển thị error.message: lỗi từ server có thể chứa chi tiết kỹ thuật
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Alert
      action={
        <Button color="inherit" onClick={() => retry()} size="small" variant="outlined">
          Thử lại
        </Button>
      }
      data-testid="teacher-load-error"
      severity="error"
      sx={{ alignItems: 'center', px: 2.5, py: 2 }}
    >
      <AlertTitle>Không tải được dữ liệu.</AlertTitle>
      Vui lòng kiểm tra kết nối mạng rồi thử lại.
    </Alert>
  )
}
