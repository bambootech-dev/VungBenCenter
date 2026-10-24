import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import { visuallyHidden } from '@mui/utils'
import React from 'react'

export default function Loading() {
  return (
    <Box role="status">
      <Box component="span" sx={visuallyHidden}>
        Đang tải…
      </Box>
      <Box aria-hidden="true" sx={{ display: 'grid', gap: 2.5 }}>
        <Skeleton height={40} sx={{ borderRadius: 2 }} variant="rounded" width={260} />
        {[0, 1, 2].map((index) => (
          <Skeleton height={88} key={index} sx={{ borderRadius: 3 }} variant="rounded" />
        ))}
      </Box>
    </Box>
  )
}
