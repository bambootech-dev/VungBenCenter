import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import React from 'react'

import { formatDateTime } from './teacherUi'

type Props = {
  id: number
  subtitle?: string | null
  submittedAt: string
  testId?: string
  title: string
}

/** Một dòng bài nộp: cả thẻ là liên kết tới trang chi tiết. */
export const SubmissionCard = ({ id, subtitle, submittedAt, testId, title }: Props) => (
  <Card component="article" data-testid={testId} variant="outlined">
    <CardActionArea href={`/giaovien/bai-da-nop/${id}`} sx={{ alignItems: 'center', display: 'flex', gap: 2, px: 2, py: 1.5 }}>
      <Box
        aria-hidden="true"
        sx={{
          alignItems: 'center',
          bgcolor: 'm3.primaryContainer',
          borderRadius: '50%',
          color: 'm3.onPrimaryContainer',
          display: { xs: 'none', sm: 'flex' },
          flexShrink: 0,
          height: 40,
          justifyContent: 'center',
          width: 40,
        }}
      >
        <DescriptionOutlined fontSize="small" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="h2" sx={{ overflowWrap: 'anywhere' }} variant="h6">
          {title}
        </Typography>
        <Stack direction="row" sx={{ alignItems: 'center', columnGap: 2, flexWrap: 'wrap', mt: 0.5, rowGap: 1 }}>
          {subtitle && <Chip color="primary" label={subtitle} size="small" />}
          <Typography color="text.secondary" component="span" sx={{ alignItems: 'center', display: 'inline-flex', gap: 0.75 }} variant="body2">
            <AccessTimeRounded aria-hidden="true" sx={{ fontSize: 18 }} />
            Nộp lúc <time dateTime={submittedAt}>{formatDateTime(submittedAt)}</time>
          </Typography>
        </Stack>
      </Box>
      <ChevronRightRounded aria-hidden="true" sx={{ color: 'text.secondary' }} />
    </CardActionArea>
  </Card>
)
