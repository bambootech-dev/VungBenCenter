'use client'

import NextLink, { type LinkProps } from 'next/link'
import React from 'react'

type Props = Omit<React.ComponentPropsWithRef<'a'>, 'href'> & LinkProps

/**
 * Cầu nối để mọi component MUI có `href` (Button, Link, ListItemButton, CardActionArea…)
 * điều hướng bằng next/link mà không phải truyền `component={Link}` từ Server Component.
 */
export const LinkBehavior = (props: Props) => <NextLink {...props} />
