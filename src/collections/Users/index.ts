import { APIError, type CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',

  access: {
    // Chỉ Admin được truy cập Payload CMS
    admin: ({ req }) => {
      return req.user?.role === 'admin'
    },

    // Không mở API tạo Users công khai.
    // Học sinh/Giáo viên sẽ đăng ký qua Server Action riêng.
    create: ({ req }) => {
      return req.user?.role === 'admin'
    },

    // Chỉ Admin được xóa tài khoản
    delete: ({ req }) => {
      return req.user?.role === 'admin'
    },

    // Admin đọc tất cả.
    // Giáo viên và Học sinh chỉ đọc tài khoản của mình.
    read: ({ req }) => {
      if (!req.user) return false

      if (req.user.role === 'admin') {
        return true
      }

      return {
        id: {
          equals: req.user.id,
        },
      }
    },

    // Admin cập nhật tất cả.
    // Giáo viên và Học sinh chỉ cập nhật tài khoản của mình.
    update: ({ req }) => {
      if (!req.user) return false

      if (req.user.role === 'admin') {
        return true
      }

      return {
        id: {
          equals: req.user.id,
        },
      }
    },
  },

  admin: {
    defaultColumns: [
      'name',
      'email',
      'role',
      'accountStatus',
      'updatedAt',
    ],
    useAsTitle: 'name',
  },

  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },

  hooks: {
    // Tài khoản đầu tiên (tạo qua /admin/create-first-user) luôn là Admin,
    // nếu không sẽ nhận role mặc định 'hocsinh' và bị khóa khỏi Payload CMS
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data

        const { totalDocs } = await req.payload.count({
          collection: 'users',
          req,
        })

        if (totalDocs === 0) {
          return { ...data, role: 'admin', accountStatus: 'active' }
        }

        return data
      },
    ],

    // Chặn Giáo viên đăng nhập khi chưa được Admin duyệt
    beforeLogin: [
      ({ user }) => {
        const loginUser = user as {
          role?: 'admin' | 'giaovien' | 'hocsinh'
          accountStatus?: 'pending' | 'active'
        }

        if (
          loginUser.role === 'giaovien' &&
          loginUser.accountStatus !== 'active'
        ) {
          throw new APIError(
            'Tài khoản Giáo viên đang chờ Admin phê duyệt.',
            403,
            undefined,
            true,
          )
        }

        return user
      },
    ],
  },

  fields: [
    {
      name: 'name',
      label: 'Họ và tên',
      type: 'text',
      required: true,
    },

    {
      name: 'role',
      label: 'Vai trò',
      type: 'select',
      required: true,
      defaultValue: 'hocsinh',
      saveToJWT: true,

      // Không cho Học sinh/Giáo viên tự đổi vai trò qua API
      access: {
        create: ({ req }) => {
          return req.user?.role === 'admin'
        },
        update: ({ req }) => {
          return req.user?.role === 'admin'
        },
      },

      options: [
        {
          label: 'Quản trị viên',
          value: 'admin',
        },
        {
          label: 'Giáo viên',
          value: 'giaovien',
        },
        {
          label: 'Học sinh',
          value: 'hocsinh',
        },
      ],
    },

    {
      name: 'accountStatus',
      label: 'Trạng thái tài khoản',
      type: 'select',
      required: true,
      defaultValue: 'active',
      saveToJWT: true,

      // Chỉ Admin được thay đổi trạng thái tài khoản
      access: {
        create: ({ req }) => {
          return req.user?.role === 'admin'
        },
        update: ({ req }) => {
          return req.user?.role === 'admin'
        },
      },

      options: [
        {
          label: 'Chờ phê duyệt',
          value: 'pending',
        },
        {
          label: 'Đã kích hoạt',
          value: 'active',
        },
      ],
    },
  ],

  timestamps: true,
}
