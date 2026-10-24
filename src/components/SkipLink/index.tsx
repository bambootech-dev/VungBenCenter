import Button from '@mui/material/Button'
import React from 'react'

export const MAIN_CONTENT_ID = 'noi-dung'

// Người dùng bàn phím/trình đọc màn hình bỏ qua header để vào thẳng nội dung
export const SkipLink = () => (
  <Button
    href={`#${MAIN_CONTENT_ID}`}
    sx={{
      position: 'fixed',
      top: 12,
      left: 12,
      zIndex: 'tooltip',
      transform: 'translateY(-200%)',
      '&:focus-visible, &.Mui-focusVisible': { transform: 'none' },
    }}
    variant="contained"
  >
    Bỏ qua tới nội dung
  </Button>
)
