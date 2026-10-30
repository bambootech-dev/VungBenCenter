import type { CollectionConfig } from 'payload'

import { admin } from '../../access/admin'

export const AUDIT_LOGS_SLUG = 'audit-logs'

/**
 * Nhật ký các thay đổi quan trọng (gói học, đơn mua, quyền học). Chỉ được ghi bởi hook phía
 * server trong cùng transaction với thay đổi; không ai sửa/xóa được qua API hay Admin.
 */
export const AuditLogs: CollectionConfig = {
  slug: AUDIT_LOGS_SLUG,
  labels: {
    singular: 'Nhật ký thay đổi',
    plural: 'Nhật ký thay đổi',
  },

  access: {
    create: () => false,
    delete: () => false,
    read: admin,
    update: () => false,
  },

  admin: {
    defaultColumns: ['summary', 'actorLabel', 'relatedUser', 'createdAt'],
    description: 'Ai đã tạo, sửa, xác nhận hoặc thu hồi gì, vào lúc nào. Chỉ đọc.',
    group: 'Gói học & quyền học',
    useAsTitle: 'summary',
  },

  defaultSort: '-createdAt',

  fields: [
    {
      name: 'action',
      label: 'Thao tác',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Tạo mới', value: 'create' },
        { label: 'Cập nhật', value: 'update' },
        { label: 'Xóa', value: 'delete' },
      ],
    },
    {
      name: 'targetCollection',
      label: 'Loại dữ liệu',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'targetId',
      label: 'ID bản ghi',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'summary',
      label: 'Nội dung',
      type: 'text',
      required: true,
    },
    {
      name: 'actor',
      label: 'Người thực hiện',
      type: 'relationship',
      relationTo: 'users',
      admin: { description: 'Trống nếu thao tác do hệ thống thực hiện.' },
    },
    {
      // Giữ lại email/tên ngay cả khi tài khoản sau này bị xóa
      name: 'actorLabel',
      label: 'Người thực hiện (lúc ghi)',
      type: 'text',
      required: true,
    },
    {
      name: 'relatedUser',
      label: 'Tài khoản liên quan',
      type: 'relationship',
      relationTo: 'users',
      index: true,
    },
    {
      name: 'changes',
      label: 'Thay đổi (trước → sau)',
      type: 'json',
    },
  ],

  timestamps: true,
}
