import clsx from 'clsx'
import React from 'react'

type Props = {
  /** Nút/hành động căn phải tiêu đề từ màn hình sm trở lên */
  actions?: React.ReactNode
  /** Mặc định `mb-4` */
  className?: string
  /** Nhãn nhỏ phía trên tiêu đề */
  eyebrow?: string
  lead?: React.ReactNode
  title: React.ReactNode
  titleTestId?: string
}

/** Đầu trang dùng chung: nhãn, h1 duy nhất của trang, mô tả và hành động. */
export const PageHeader = ({ actions, className, eyebrow, lead, title, titleTestId }: Props) => (
  <header
    className={clsx('d-flex flex-column flex-sm-row align-items-sm-end justify-content-between gap-3', className ?? 'mb-4')}
  >
    <div>
      {eyebrow && <p className="badge bg-primary-subtle text-primary-emphasis fs-6 mb-2">{eyebrow}</p>}
      <h1 className="mb-0" data-testid={titleTestId}>
        {title}
      </h1>
      {lead && <p className="lead text-body-secondary mt-2 mb-0">{lead}</p>}
    </div>
    {actions && <div className="flex-shrink-0">{actions}</div>}
  </header>
)
