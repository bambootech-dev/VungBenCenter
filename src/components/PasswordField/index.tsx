'use client'

import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField, { type TextFieldProps } from '@mui/material/TextField'
import React, { useState } from 'react'

/** Ô mật khẩu có nút hiện/ẩn ký tự (nhãn nút không chứa chữ "mật khẩu" để không trùng nhãn ô nhập). */
export const PasswordField = (props: Omit<TextFieldProps, 'type'>) => {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      slotProps={{
        ...props.slotProps,
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={visible ? 'Ẩn ký tự' : 'Hiện ký tự'}
                aria-pressed={visible}
                edge="end"
                onClick={() => setVisible((value) => !value)}
                size="small"
              >
                {visible ? <VisibilityOffRounded fontSize="small" /> : <VisibilityRounded fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      type={visible ? 'text' : 'password'}
    />
  )
}
