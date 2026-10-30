import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

import { AUDIT_LOGS_SLUG } from './index'

type Doc = Record<string, unknown> & { id: number | string }

type AuditOptions = {
  /** Tên hiển thị của loại bản ghi, ví dụ "Đơn mua" */
  label: string
  /** Các field được so sánh và ghi lại khi cập nhật */
  fields: string[]
  /** Tài khoản liên quan (người mua/người được cấp quyền) để lọc lịch sử theo tài khoản */
  relatedUser?: (doc: Doc) => unknown
  /** Mô tả ngắn của bản ghi trong nội dung nhật ký */
  describe?: (doc: Doc) => string
}

// Relationship có thể là ID hoặc object (depth > 0): luôn so sánh/ghi theo ID
const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: unknown }).id
  return value ?? null
}

const idOf = (value: unknown) => {
  const id = normalize(value)
  return typeof id === 'number' || typeof id === 'string' ? id : undefined
}

const writeLog = async (
  req: PayloadRequest,
  data: {
    action: 'create' | 'delete' | 'update'
    changes?: Record<string, unknown>
    relatedUser?: unknown
    summary: string
    targetCollection: string
    targetId: number | string
  },
) => {
  const relatedUser = idOf(data.relatedUser)

  await req.payload.create({
    collection: AUDIT_LOGS_SLUG,
    // Hook phía server ghi nhật ký; access của audit-logs chặn mọi đường ghi khác
    overrideAccess: true,
    req,
    data: {
      ...data,
      targetId: String(data.targetId),
      actor: req.user?.id ?? null,
      actorLabel: req.user ? `${req.user.email} (${req.user.role})` : 'Hệ thống',
      relatedUser: relatedUser === undefined ? null : Number(relatedUser),
    },
  })
}

/** Hook ghi nhật ký cho một collection; chạy trong cùng transaction (truyền `req`). */
export const auditTrail = ({ describe, fields, label, relatedUser }: AuditOptions) => {
  const title = (doc: Doc) => `${label} #${doc.id}${describe ? ` (${describe(doc)})` : ''}`

  const afterChange: CollectionAfterChangeHook = async ({ collection, doc, operation, previousDoc, req }) => {
    const changes: Record<string, unknown> = {}

    for (const field of fields) {
      const before = operation === 'create' ? null : normalize(previousDoc?.[field])
      const after = normalize(doc[field])

      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changes[field] = operation === 'create' ? after : { from: before, to: after }
      }
    }

    if (operation === 'update' && Object.keys(changes).length === 0) return doc

    await writeLog(req, {
      action: operation,
      changes,
      relatedUser: relatedUser?.(doc),
      summary: `${operation === 'create' ? 'Tạo' : 'Cập nhật'} ${title(doc)}`,
      targetCollection: collection.slug,
      targetId: doc.id,
    })

    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ collection, doc, req }) => {
    await writeLog(req, {
      action: 'delete',
      changes: Object.fromEntries(fields.map((field) => [field, normalize(doc[field])])),
      relatedUser: relatedUser?.(doc),
      summary: `Xóa ${title(doc)}`,
      targetCollection: collection.slug,
      targetId: doc.id,
    })
  }

  return { afterChange, afterDelete }
}
