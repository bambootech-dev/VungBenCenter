'use client'

import { alpha, createTheme, responsiveFontSizes, type Shadows } from '@mui/material/styles'
import { LinkBehavior } from './LinkBehavior'

// Bảng vai trò màu Material Design 3 (light scheme) sinh từ màu xanh lá của trung tâm.
// Mọi cặp on-*/nền tương ứng đạt tương phản ≥ 4.5:1 (WCAG AA).
const m3 = {
  primary: '#1b6c3d',
  onPrimary: '#ffffff',
  primaryContainer: '#a4f4b7',
  onPrimaryContainer: '#00210d',
  secondary: '#4f6353',
  onSecondary: '#ffffff',
  secondaryContainer: '#d1e8d4',
  onSecondaryContainer: '#0c1f13',
  // Tertiary vàng hổ phách: điểm nhấn vui mắt cho trẻ nhỏ
  tertiary: '#775a00',
  onTertiary: '#ffffff',
  tertiaryContainer: '#ffdf9a',
  onTertiaryContainer: '#251a00',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',
  surface: '#f6fbf3',
  onSurface: '#181d18',
  onSurfaceVariant: '#414941',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f5ed',
  surfaceContainer: '#eaefe7',
  surfaceContainerHigh: '#e4eae2',
  surfaceContainerHighest: '#dfe4dc',
  outline: '#717971',
  outlineVariant: '#c1c9bf',
  inverseSurface: '#2d322d',
  inverseOnSurface: '#edf2ea',
  inversePrimary: '#89d79c',
}

declare module '@mui/material/styles' {
  interface Palette {
    m3: typeof m3
  }
  interface PaletteOptions {
    m3?: typeof m3
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    // "Filled tonal button" của M3
    tonal: true
  }
}

// --font-roboto do next/font khai báo trên <html> (src/theme/fonts.ts)
const fontFamily = 'var(--font-roboto), Roboto, "Segoe UI", system-ui, -apple-system, sans-serif'

// Elevation M3: level 0–5, các bậc cao hơn của MUI dùng level 5
const level = [
  'none',
  '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15)',
  '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15)',
  '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 4px 8px 3px rgb(0 0 0 / 0.15)',
  '0 2px 3px 0 rgb(0 0 0 / 0.3), 0 6px 10px 4px rgb(0 0 0 / 0.15)',
  '0 4px 4px 0 rgb(0 0 0 / 0.3), 0 8px 12px 6px rgb(0 0 0 / 0.15)',
]
const shadows = Array.from({ length: 25 }, (_, index) => level[Math.min(index, 5)]) as Shadows

// State layer M3: màu chữ của thành phần phủ lên với độ mờ cố định
const stateLayer = { hover: 0.08, focus: 0.1, pressed: 0.1 }

let theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { light: '#3b8754', main: m3.primary, dark: '#005227', contrastText: m3.onPrimary },
    secondary: { light: m3.secondaryContainer, main: m3.secondary, dark: '#384b3c', contrastText: m3.onSecondary },
    success: { light: m3.primaryContainer, main: m3.primary, contrastText: m3.onPrimary },
    error: { light: m3.errorContainer, main: m3.error, contrastText: m3.onError },
    warning: { light: m3.tertiaryContainer, main: m3.tertiary, contrastText: m3.onTertiary },
    info: { main: '#00658e', contrastText: '#ffffff' },
    text: { primary: m3.onSurface, secondary: m3.onSurfaceVariant },
    background: { default: m3.surface, paper: m3.surfaceContainerLow },
    divider: m3.outlineVariant,
    action: {
      hover: alpha(m3.onSurface, stateLayer.hover),
      hoverOpacity: stateLayer.hover,
      focusOpacity: stateLayer.focus,
      selected: m3.secondaryContainer,
      disabled: alpha(m3.onSurface, 0.38),
      disabledBackground: alpha(m3.onSurface, 0.12),
    },
    m3,
  },
  // Thang bo góc M3: sx borderRadius 1 = 4px (extra-small), 2 = 8px, 3 = 12px (medium), 4 = 16px, 7 = 28px (extra-large)
  shape: { borderRadius: 4 },
  shadows,
  typography: {
    fontFamily,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    // Thang chữ M3: h1 = Display medium, h2–h4 = Headline, h5–h6 = Title, body = Body, button = Label large
    h1: { fontSize: '2.8125rem', fontWeight: 400, lineHeight: 52 / 45 },
    h2: { fontSize: '2rem', fontWeight: 400, lineHeight: 40 / 32 },
    h3: { fontSize: '1.75rem', fontWeight: 400, lineHeight: 36 / 28 },
    h4: { fontSize: '1.5rem', fontWeight: 400, lineHeight: 32 / 24 },
    h5: { fontSize: '1.375rem', fontWeight: 400, lineHeight: 28 / 22 },
    h6: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5, letterSpacing: '0.009em' },
    subtitle1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5, letterSpacing: '0.031em', color: m3.onSurfaceVariant },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 20 / 14, letterSpacing: '0.007em' },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5, letterSpacing: '0.031em' },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 20 / 14, letterSpacing: '0.018em' },
    button: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 20 / 14, letterSpacing: '0.007em', textTransform: 'none' },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 16 / 12, letterSpacing: '0.033em' },
    // M3 không còn overline: dùng Label large, không viết hoa
    overline: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 20 / 14, letterSpacing: '0.007em', textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
        '::selection': { backgroundColor: m3.primaryContainer, color: m3.onPrimaryContainer },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },
    MuiButtonBase: {
      defaultProps: { LinkComponent: LinkBehavior },
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': { outline: `3px solid ${m3.secondary}`, outlineOffset: 2 },
        },
      },
    },
    MuiLink: {
      defaultProps: { component: LinkBehavior, underline: 'hover' },
      styleOverrides: {
        root: {
          fontWeight: 500,
          textUnderlineOffset: 4,
          borderRadius: 4,
          '&:focus-visible': { outline: `3px solid ${m3.secondary}`, outlineOffset: 2 },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          minHeight: 40,
          paddingInline: 24,
          whiteSpace: 'nowrap',
          variants: [
            {
              props: { variant: 'tonal' },
              style: {
                backgroundColor: m3.secondaryContainer,
                color: m3.onSecondaryContainer,
                '&:hover': { backgroundColor: `color-mix(in srgb, ${m3.onSecondaryContainer} 8%, ${m3.secondaryContainer})`, boxShadow: level[1] },
                '&.Mui-disabled': { backgroundColor: alpha(m3.onSurface, 0.12), color: alpha(m3.onSurface, 0.38) },
              },
            },
          ],
        },
        sizeSmall: { minHeight: 32, paddingInline: 16 },
        // Nút lớn cho các thao tác chính: vùng chạm rộng, dễ bấm với trẻ nhỏ
        sizeLarge: { minHeight: 48, paddingInline: 28, fontSize: '1rem' },
        contained: {
          '&:hover': { boxShadow: level[1] },
        },
        outlined: {
          borderColor: m3.outline,
          '&:hover': { borderColor: m3.outline },
          '&.Mui-disabled': { borderColor: alpha(m3.onSurface, 0.12) },
        },
        text: { paddingInline: 12 },
        startIcon: { marginLeft: -8 },
        endIcon: { marginRight: -8 },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { color: m3.onSurfaceVariant } },
    },
    MuiFab: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: level[3], textTransform: 'none', '&:active': { boxShadow: level[3] } },
        primary: {
          backgroundColor: m3.primaryContainer,
          color: m3.onPrimaryContainer,
          '&:hover': { backgroundColor: `color-mix(in srgb, ${m3.onPrimaryContainer} 8%, ${m3.primaryContainer})`, boxShadow: level[4] },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 12 },
        outlined: { borderColor: m3.outlineVariant, backgroundColor: m3.surface },
      },
    },
    // Card mặc định là "Elevated card" của M3; variant="outlined" là "Outlined card"
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        root: { borderRadius: 12, transition: 'box-shadow 200ms, background-color 200ms' },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          padding: 16,
          '&:last-child': { paddingBottom: 16 },
          [t.breakpoints.up('sm')]: { padding: 24, '&:last-child': { paddingBottom: 24 } },
        }),
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: { '&.Mui-focusVisible': { outlineOffset: -3 } },
        focusHighlight: { backgroundColor: m3.onSurface },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 32,
          fontSize: '0.875rem',
          fontWeight: 500,
          letterSpacing: '0.007em',
          variants: [
            {
              props: { variant: 'filled', color: 'primary' },
              style: { backgroundColor: m3.secondaryContainer, color: m3.onSecondaryContainer, '& .MuiChip-icon': { color: m3.onSecondaryContainer } },
            },
          ],
        },
        outlined: { borderColor: m3.outlineVariant },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        colorDefault: { backgroundColor: m3.primaryContainer, color: m3.onPrimaryContainer },
      },
    },
    // Top app bar M3: cùng màu surface, chuyển sang surface-container khi nội dung cuộn bên dưới
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: { backgroundColor: m3.surface, color: m3.onSurface, transition: 'background-color 200ms' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: m3.surfaceContainerLow,
          borderRight: 0,
          variants: [
            { props: { anchor: 'left' }, style: { borderRadius: '0 16px 16px 0' } },
            { props: { anchor: 'right' }, style: { borderRadius: '16px 0 0 16px' } },
          ],
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 28, backgroundColor: m3.surfaceContainerHigh },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: m3.outlineVariant } },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: { color: m3.onSurfaceVariant },
        asterisk: { color: m3.error },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: m3.outline },
          '&:hover:not(.Mui-disabled, .Mui-error, .Mui-focused) .MuiOutlinedInput-notchedOutline': { borderColor: m3.onSurface },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { marginInline: 16, marginTop: 4, fontSize: '0.75rem', letterSpacing: '0.033em' } },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          alignItems: 'flex-start',
          variants: [
            {
              props: { variant: 'standard', severity: 'success' },
              style: { backgroundColor: m3.primaryContainer, color: m3.onPrimaryContainer, '& .MuiAlert-icon': { color: m3.primary } },
            },
            {
              props: { variant: 'standard', severity: 'error' },
              style: { backgroundColor: m3.errorContainer, color: m3.onErrorContainer, '& .MuiAlert-icon': { color: m3.error } },
            },
            {
              props: { variant: 'standard', severity: 'warning' },
              style: { backgroundColor: m3.tertiaryContainer, color: m3.onTertiaryContainer, '& .MuiAlert-icon': { color: m3.tertiary } },
            },
          ],
        },
      },
    },
    MuiAlertTitle: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    // Mục điều hướng M3 (navigation drawer): cao 56px, chỉ báo hình viên thuốc màu secondary-container
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          minHeight: 56,
          paddingInline: 16,
          color: m3.onSurfaceVariant,
          '&.Mui-selected': {
            backgroundColor: m3.secondaryContainer,
            color: m3.onSecondaryContainer,
            '& .MuiListItemIcon-root': { color: m3.onSecondaryContainer },
            '&:hover': { backgroundColor: `color-mix(in srgb, ${m3.onSecondaryContainer} 8%, ${m3.secondaryContainer})` },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: { root: { minWidth: 36, color: m3.onSurfaceVariant } },
    },
    MuiListItemText: {
      styleOverrides: { primary: { fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.007em' } },
    },
    // Navigation bar M3 (màn hình nhỏ)
    MuiBottomNavigation: {
      styleOverrides: { root: { backgroundColor: m3.surfaceContainer, height: 80 } },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: m3.onSurfaceVariant,
          gap: 4,
          paddingTop: 12,
          paddingBottom: 16,
          '&.Mui-selected': { color: m3.onSurface },
        },
        label: {
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.042em',
          '&.Mui-selected': { fontSize: '0.75rem', fontWeight: 700 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: m3.outlineVariant, color: m3.onSurface },
        head: { backgroundColor: m3.surfaceContainer, fontWeight: 500, color: m3.onSurfaceVariant, lineHeight: 1.3 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.75rem', fontWeight: 400, backgroundColor: m3.inverseSurface, color: m3.inverseOnSurface, borderRadius: 4 },
      },
    },
    MuiSkeleton: {
      styleOverrides: { root: { backgroundColor: m3.surfaceContainerHighest } },
    },
  },
})

theme = responsiveFontSizes(theme, { factor: 2 })

export default theme
