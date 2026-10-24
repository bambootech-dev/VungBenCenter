import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import React from 'react'

type Props = {
  basePath: string
  page: number
  totalPages: number
}

const pageHref = (basePath: string, page: number) => (page > 1 ? `${basePath}?page=${page}` : basePath)

// Phân trang bằng liên kết (server render theo ?page=), không cần JavaScript phía client
export const Pagination = ({ basePath, page, totalPages }: Props) => {
  if (totalPages <= 1) return null

  return (
    <Stack aria-label="Phân trang" component="nav" direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 4 }}>
      {page > 1 ? (
        <Button href={pageHref(basePath, page - 1)} startIcon={<ChevronLeftRounded />} variant="outlined">
          Trang trước
        </Button>
      ) : (
        <Button component="span" disabled startIcon={<ChevronLeftRounded />} variant="outlined">
          Trang trước
        </Button>
      )}

      <Typography color="text.secondary" variant="body2">
        Trang {Math.min(page, totalPages)} / {totalPages}
      </Typography>

      {page < totalPages ? (
        <Button endIcon={<ChevronRightRounded />} href={pageHref(basePath, page + 1)} variant="outlined">
          Trang sau
        </Button>
      ) : (
        <Button component="span" disabled endIcon={<ChevronRightRounded />} variant="outlined">
          Trang sau
        </Button>
      )}
    </Stack>
  )
}
