import Box from '@mui/material/Box'
import React from 'react'

type Props = {
  // Ẩn chữ trên màn hình rất hẹp, chỉ giữ biểu tượng
  compact?: boolean
}

export const Logo = ({ compact = false }: Props) => (
  <Box component="span" sx={{ alignItems: 'center', color: 'text.primary', display: 'inline-flex', gap: 1.5 }}>
    <Box
      aria-hidden="true"
      component="span"
      sx={{
        alignItems: 'center',
        bgcolor: 'primary.main',
        borderRadius: 3,
        color: 'primary.contrastText',
        display: 'flex',
        fontSize: '0.875rem',
        fontWeight: 700,
        height: 40,
        justifyContent: 'center',
        letterSpacing: '0.02em',
        width: 40,
      }}
    >
      VB
    </Box>
    <Box
      component="span"
      sx={{
        display: compact ? { xs: 'none', sm: 'inline' } : 'inline',
        fontSize: '1.375rem',
        fontWeight: 400,
        letterSpacing: 0,
        lineHeight: 28 / 22,
      }}
    >
      Vững Bền Center
    </Box>
  </Box>
)
