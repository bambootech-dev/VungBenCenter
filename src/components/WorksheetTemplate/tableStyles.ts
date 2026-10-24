import type { SxProps, Theme } from '@mui/material/styles'

/** Bảng dữ liệu kiểu mẫu giấy (viền ô rõ ràng), dùng chung cho form điền phiếu và trang xem phiếu. */
export const worksheetTableSx: SxProps<Theme> = {
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
  width: '100%',
  '& th, & td': {
    border: 1,
    borderColor: 'divider',
    color: 'text.primary',
    px: 1,
    py: 1,
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  '& th': {
    bgcolor: 'm3.surfaceContainer',
    color: 'text.secondary',
    fontSize: '0.8125rem',
    fontWeight: 500,
    lineHeight: 1.3,
  },
  '& tbody tr:nth-of-type(even) td': { bgcolor: 'm3.surfaceContainerLow' },
  // Bỏ viền ngoài cùng: khung bo góc bên ngoài đã là viền của bảng
  // (hàng tiêu đề thứ hai của cột gộp không chạm mép trái nên không bỏ viền)
  '& tbody tr > :first-of-type, & thead tr:first-of-type > :first-of-type': { borderLeft: 0 },
  '& tbody tr > :last-child, & thead tr:first-of-type > :last-child': { borderRight: 0 },
  '& thead tr:first-of-type > *': { borderTop: 0 },
  '& tbody tr:last-child > *': { borderBottom: 0 },
}
