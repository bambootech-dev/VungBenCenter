import InboxOutlined from '@mui/icons-material/InboxOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import React from 'react'

type Props = {
  action?: { href: string; label: string }
  icon?: React.ReactNode
  message: string
  testId?: string
}

export const EmptyState = ({ action, icon, message, testId }: Props) => (
  <Paper
    data-testid={testId}
    elevation={0}
    sx={{
      alignItems: 'center',
      bgcolor: 'm3.surfaceContainerLow',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      px: 3,
      py: { xs: 5, md: 6 },
      textAlign: 'center',
    }}
  >
    <Box
      aria-hidden="true"
      component="span"
      sx={{
        alignItems: 'center',
        bgcolor: 'm3.secondaryContainer',
        borderRadius: '50%',
        color: 'm3.onSecondaryContainer',
        display: 'flex',
        fontSize: 32,
        height: 64,
        justifyContent: 'center',
        width: 64,
      }}
    >
      {icon ?? <InboxOutlined fontSize="inherit" />}
    </Box>
    <Typography color="text.secondary" component="p" variant="h6">
      {message}
    </Typography>
    {action && (
      <Button href={action.href} variant="tonal">
        {action.label}
      </Button>
    )}
  </Paper>
)
