import { APIError, type CollectionConfig } from 'payload'

import { admin } from '../../access/admin'
import { auditTrail } from '../AuditLogs/audit'
import { PLAN_KIND_LABELS } from './plan'

export const PLANS_SLUG = 'plans'

const audit = auditTrail({
  label: 'Gói học',
  fields: ['name', 'code', 'kind', 'price', 'durationType', 'durationMonths', 'lessons', 'isActive'],
  describe: (doc) => String(doc.name ?? ''),
})

/**
 * Gói bán: mua riêng một bài hoặc gói nhiều bài có thời hạn. Mọi thời hạn do Admin chọn rõ
 * ("N tháng" hoặc "Không thời hạn"), hệ thống không tự mặc định.
 */
export const Plans: CollectionConfig = {
  slug: PLANS_SLUG,
  labels: {
    singular: 'Gói học',
    plural: 'Gói học',
  },

  access: {
    create: admin,
    // Ngừng bán thay vì xóa; đơn và quyền đã bán vẫn giữ bản chụp của gói
    delete: admin,
    // Ai cũng xem được gói đang bán (trang Gói học công khai); Admin xem tất cả
    read: ({ req: { user } }) => (user?.role === 'admin' ? true : { isActive: { equals: true } }),
    update: admin,
  },

  admin: {
    defaultColumns: ['name', 'kind', 'price', 'durationType', 'isActive', 'sortOrder'],
    description: 'Sửa gói chỉ áp dụng cho đơn đặt sau đó; quyền đã kích hoạt giữ nguyên danh sách bài và thời hạn lúc mua.',
    group: 'Gói học & quyền học',
    useAsTitle: 'name',
  },

  defaultSort: 'sortOrder',

  hooks: {
    afterChange: [audit.afterChange],
    afterDelete: [audit.afterDelete],
    beforeValidate: [
      ({ data }) => {
        if (data && typeof data.code === 'string') {
          data.code = data.code.trim().toLowerCase()
        }

        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        // Khi cập nhật, `data` chỉ có các field được gửi lên: kiểm tra trên bản đã gộp
        const plan = { ...originalDoc, ...data }
        const lessons = Array.isArray(plan.lessons) ? plan.lessons : []

        if (plan.kind === 'single' && lessons.length !== 1) {
          throw new APIError('Gói mua riêng phải có đúng một bài học.', 400, undefined, true)
        }

        if (plan.kind === 'bundle' && plan.durationType !== 'months') {
          throw new APIError('Gói học có thời hạn phải chọn thời hạn theo tháng.', 400, undefined, true)
        }

        if (plan.durationType === 'months' && !(Number.isInteger(plan.durationMonths) && plan.durationMonths >= 1)) {
          throw new APIError('Nhập số tháng (số nguyên từ 1 trở lên).', 400, undefined, true)
        }

        if (plan.durationType === 'lifetime') {
          data.durationMonths = null
        }

        return data
      },
    ],
  },

  fields: [
    {
      name: 'name',
      label: 'Tên gói',
      type: 'text',
      required: true,
    },
    {
      name: 'code',
      label: 'Mã gói',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Viết liền, không dấu, ví dụ: am-th, luyen-phat-am-co-ban.' },
      validate: (value: unknown) =>
        typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim().toLowerCase())
          ? true
          : 'Mã gói chỉ gồm chữ thường không dấu, số và dấu gạch ngang.',
    },
    {
      name: 'description',
      label: 'Mô tả',
      type: 'textarea',
    },
    {
      name: 'kind',
      label: 'Loại gói',
      type: 'select',
      required: true,
      options: Object.entries(PLAN_KIND_LABELS).map(([value, label]) => ({ label, value })),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          label: 'Giá bán',
          type: 'number',
          required: true,
          min: 0,
          admin: { step: 1000 },
          validate: (value: unknown) =>
            Number.isInteger(value) && (value as number) >= 0 ? true : 'Giá là số nguyên không âm (VND).',
        },
        {
          name: 'currency',
          label: 'Đơn vị tiền tệ',
          type: 'select',
          required: true,
          defaultValue: 'VND',
          options: [{ label: 'VND', value: 'VND' }],
        },
      ],
    },
    {
      name: 'lessons',
      label: 'Bài học được truy cập',
      type: 'relationship',
      relationTo: 'lessons',
      hasMany: true,
      required: true,
      minRows: 1,
    },
    {
      type: 'row',
      fields: [
        {
          // Không có giá trị mặc định: Admin phải chọn rõ thời hạn cho từng gói
          name: 'durationType',
          label: 'Thời hạn sử dụng',
          type: 'select',
          required: true,
          options: [
            { label: 'Theo tháng lịch', value: 'months' },
            { label: 'Không thời hạn', value: 'lifetime' },
          ],
        },
        {
          name: 'durationMonths',
          label: 'Số tháng',
          type: 'number',
          min: 1,
          admin: {
            condition: (_, siblingData) => siblingData?.durationType === 'months',
            description: 'Tính theo tháng lịch từ lúc kích hoạt (31/01 + 1 tháng = 28 hoặc 29/02).',
          },
        },
      ],
    },
    {
      name: 'benefits',
      label: 'Quyền lợi',
      type: 'array',
      labels: { singular: 'Quyền lợi', plural: 'Quyền lợi' },
      fields: [{ name: 'text', label: 'Nội dung', type: 'text', required: true }],
    },
    {
      name: 'isActive',
      label: 'Đang bán',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Bật để hiển thị trên trang Gói học và cho phép đặt mua.', position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      label: 'Thứ tự hiển thị',
      type: 'number',
      defaultValue: 0,
      index: true,
      admin: { position: 'sidebar' },
    },
  ],

  timestamps: true,
}
