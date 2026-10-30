import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'

import { admin } from '../../access/admin'
import { adminOrOwner } from '../../access/adminOrOwner'
import { formatSoundLabel } from '../Lessons/sound'
import { auditTrail } from '../AuditLogs/audit'
import { computeEndsAt, type PlanSnapshot } from '../Plans/plan'
import { SUBSCRIPTIONS_SLUG } from '@/utilities/lessonAccess'

import { grantState, GRANT_STATE_LABELS } from './state'

/** Đơn đã thanh toán tạo quyền học qua hook của Orders; đánh dấu này chỉ được đặt phía server. */
export const ORDER_ACTIVATION_CONTEXT = 'orderActivation'

// Field không đổi sau khi tạo: bản ghi quyền gắn với người, nguồn và bản chụp lúc kích hoạt
const IMMUTABLE_FIELDS = ['user', 'source', 'plan', 'order', 'snapshot'] as const

const idOf = (value: unknown) =>
  value && typeof value === 'object' && 'id' in value ? Number((value as { id: unknown }).id) : Number(value)

// Relationship trong bản gốc có thể đã được populate: lưu lại bằng ID
const restore = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value) && 'id' in value ? (value as { id: unknown }).id : value

const lessonLabels = async (req: PayloadRequest, ids: number[]) => {
  const { docs } = await req.payload.find({
    collection: 'lessons',
    depth: 0,
    limit: 0,
    overrideAccess: true,
    pagination: false,
    req,
    select: { sound: true },
    where: { id: { in: ids } },
  })

  return ids.map((id) => {
    const lesson = docs.find((doc) => doc.id === id)
    return { id, label: lesson ? formatSoundLabel(lesson.sound) : `Bài #${id}` }
  })
}

const audit = auditTrail({
  label: 'Quyền học',
  fields: ['status', 'statusReason', 'lessons', 'startsAt', 'endsAt', 'noExpiry'],
  relatedUser: (doc) => doc.user,
  describe: (doc) => String(doc.title ?? ''),
})

/**
 * Quyền học đã kích hoạt: từ đơn đã thanh toán (mua riêng / gói thời hạn) hoặc Admin cấp thủ công.
 * Mỗi bản ghi giữ danh sách bài và thời hạn của riêng nó; hết hạn hay thu hồi một bản ghi không
 * ảnh hưởng bản ghi khác của cùng bài. Không xóa được: thu hồi bằng trạng thái để giữ lịch sử.
 */
export const Subscriptions: CollectionConfig = {
  slug: SUBSCRIPTIONS_SLUG,
  labels: {
    singular: 'Quyền học',
    plural: 'Quyền học (gói đã kích hoạt)',
  },

  access: {
    create: admin,
    delete: () => false,
    read: adminOrOwner,
    update: admin,
  },

  admin: {
    defaultColumns: ['title', 'user', 'source', 'state', 'startsAt', 'endsAt'],
    description:
      'Cấp quyền thủ công: tạo mới với nguồn "Admin cấp". Thu hồi: đổi trạng thái sang "Đã thu hồi". Lọc theo Học viên để xem quyền của một tài khoản.',
    group: 'Gói học & quyền học',
    useAsTitle: 'title',
  },

  defaultSort: '-startsAt',

  hooks: {
    afterChange: [audit.afterChange],
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (operation === 'update') {
          for (const field of IMMUTABLE_FIELDS) data[field] = restore(originalDoc[field])
        }

        const grant = { ...originalDoc, ...data }

        if (operation === 'create') {
          if (grant.source === 'order' && !req.context?.[ORDER_ACTIVATION_CONTEXT]) {
            throw new APIError(
              'Quyền từ đơn mua chỉ được tạo khi xác nhận thanh toán đơn. Hãy chọn nguồn "Admin cấp".',
              400,
              undefined,
              true,
            )
          }

          if (!grant.startsAt) data.startsAt = grant.startsAt = new Date().toISOString()

          // Admin cấp theo một gói có sẵn: lấy danh sách bài và thời hạn của gói nếu chưa nhập
          if (grant.source === 'manual' && grant.plan) {
            const plan = await req.payload.findByID({
              collection: 'plans',
              depth: 0,
              id: idOf(grant.plan),
              overrideAccess: true,
              req,
            })

            if (!grant.lessons?.length) data.lessons = grant.lessons = plan.lessons
            if (!grant.endsAt && !grant.noExpiry) {
              const endsAt = computeEndsAt(
                { durationType: plan.durationType, durationMonths: plan.durationMonths ?? null },
                new Date(grant.startsAt),
              )
              data.endsAt = grant.endsAt = endsAt?.toISOString() ?? null
              data.noExpiry = grant.noExpiry = endsAt === null
            }
          }

          const lessonIds = (grant.lessons ?? []).map(idOf)

          if (lessonIds.length === 0) {
            throw new APIError('Chọn ít nhất một bài học.', 400, undefined, true)
          }

          if (!data.snapshot) {
            const lessons = await lessonLabels(req, lessonIds)
            data.snapshot = { source: 'manual', lessons }
          }

          const user = await req.payload.findByID({
            collection: 'users',
            depth: 0,
            id: idOf(grant.user),
            overrideAccess: true,
            req,
          })
          const name = (data.snapshot as Partial<PlanSnapshot>).name ?? 'Admin cấp'
          data.title = `${name} — ${user.email}`
        }

        if (grant.noExpiry) {
          data.endsAt = grant.endsAt = null
        } else if (!grant.endsAt) {
          throw new APIError('Chọn ngày hết hạn hoặc đánh dấu "Không thời hạn".', 400, undefined, true)
        } else if (new Date(grant.endsAt) <= new Date(grant.startsAt)) {
          throw new APIError('Ngày hết hạn phải sau ngày bắt đầu.', 400, undefined, true)
        }

        return data
      },
    ],
  },

  fields: [
    {
      name: 'title',
      label: 'Tên',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'user',
      label: 'Học viên',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'source',
      label: 'Nguồn quyền',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Đơn mua', value: 'order' },
        { label: 'Admin cấp', value: 'manual' },
      ],
    },
    {
      name: 'plan',
      label: 'Gói học',
      type: 'relationship',
      relationTo: 'plans',
      admin: {
        description: 'Admin cấp theo gói: để trống "Bài học" và "Ngày hết hạn" để lấy theo gói.',
      },
    },
    {
      // unique: một đơn chỉ tạo đúng một quyền học, kể cả khi xác nhận lặp lại/đồng thời
      name: 'order',
      label: 'Đơn mua',
      type: 'relationship',
      relationTo: 'orders',
      unique: true,
      admin: { readOnly: true },
    },
    {
      name: 'lessons',
      label: 'Bài học được truy cập',
      type: 'relationship',
      relationTo: 'lessons',
      hasMany: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startsAt',
          label: 'Bắt đầu',
          type: 'date',
          index: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'endsAt',
          label: 'Hết hạn',
          type: 'date',
          index: true,
          admin: {
            condition: (_, siblingData) => !siblingData?.noExpiry,
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
        {
          name: 'noExpiry',
          label: 'Không thời hạn',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      required: true,
      defaultValue: 'active',
      index: true,
      options: [
        { label: 'Đang hiệu lực', value: 'active' },
        { label: 'Đã hủy', value: 'cancelled' },
        { label: 'Đã thu hồi', value: 'revoked' },
      ],
      admin: { description: '"Hết hạn" được tính tự động từ ngày hết hạn, không cần đổi tay.' },
    },
    {
      name: 'statusReason',
      label: 'Lý do hủy / thu hồi',
      type: 'text',
    },
    {
      // Trạng thái thực tế lúc đọc (gồm "Hết hạn"), tính từ giờ server; không lưu trong database
      name: 'state',
      label: 'Hiệu lực',
      type: 'text',
      virtual: true,
      admin: { readOnly: true },
      hooks: {
        afterRead: [({ siblingData }) => GRANT_STATE_LABELS[grantState(siblingData)]],
      },
    },
    {
      name: 'snapshot',
      label: 'Bản chụp gói lúc kích hoạt',
      type: 'json',
      admin: { readOnly: true },
    },
    {
      name: 'note',
      label: 'Ghi chú',
      type: 'textarea',
    },
  ],

  timestamps: true,
}
