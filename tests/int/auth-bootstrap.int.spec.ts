// @vitest-environment node
import config from '@payload-config'
import { getPayload, handleEndpoints, type Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { registerAccount } from '@/actions/registerAccount'
import {
  INVALID_SIGNUP_ROLE_MESSAGE,
  PUBLIC_SIGNUP_SOURCE,
  SYSTEM_NOT_INITIALIZED_MESSAGE,
} from '@/collections/Users/registration'
import type { User } from '@/payload-types'

import { assertConnectedToLocalTestDatabase } from '../helpers/localTestDatabase'

// Chỉ chạy trên database local trong .env.test (guard trong vitest.setup.ts)

let payload: Payload

const PASSWORD = 'MatKhau123!'
const ADMIN_EMAIL = 'admin@test.local'

type SignupInput = Parameters<typeof registerAccount>[0]

const signupInput = (role: unknown, email: string): SignupInput =>
  ({
    name: 'Người dùng thử',
    email,
    password: PASSWORD,
    confirmPassword: PASSWORD,
    role,
  }) as SignupInput

const resetUsers = () => payload.db.deleteMany({ collection: 'users', where: {} })

const countUsers = async () => (await payload.count({ collection: 'users' })).totalDocs

const countAdmins = async () =>
  (await payload.count({ collection: 'users', where: { role: { equals: 'admin' } } })).totalDocs

const findByEmail = async (email: string): Promise<User | undefined> => {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })

  return docs[0]
}

// Gọi đúng endpoint mà trang /admin/create-first-user sử dụng
const firstRegister = (body: Record<string, unknown>) =>
  handleEndpoints({
    config,
    request: new Request('http://localhost:3000/api/users/first-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  })

const bootstrapAdmin = async (): Promise<User> => {
  const response = await firstRegister({
    name: 'Quản trị viên',
    email: ADMIN_EMAIL,
    password: PASSWORD,
  })

  expect(response.status).toBe(200)

  const admin = await findByEmail(ADMIN_EMAIL)
  expect(admin).toBeDefined()

  return admin as User
}

const asUser = (user: User) => ({ ...user, collection: 'users' as const })

beforeAll(async () => {
  payload = await getPayload({ config })
  await assertConnectedToLocalTestDatabase(payload.db)
})

describe('Khởi tạo Admin đầu tiên', () => {
  beforeEach(async () => {
    await resetUsers()
  })

  it('từ chối đăng ký Học sinh công khai khi chưa có User', async () => {
    const result = await registerAccount(signupInput('hocsinh', 'hs@test.local'))

    expect(result).toEqual({ success: false, error: SYSTEM_NOT_INITIALIZED_MESSAGE })
    expect(await countUsers()).toBe(0)
  })

  it('từ chối đăng ký Giáo viên công khai khi chưa có User', async () => {
    const result = await registerAccount(signupInput('giaovien', 'gv@test.local'))

    expect(result).toEqual({ success: false, error: SYSTEM_NOT_INITIALIZED_MESSAGE })
    expect(await countUsers()).toBe(0)
  })

  it('tạo Admin đầu tiên qua /api/users/first-register với role admin và active', async () => {
    const response = await firstRegister({
      name: 'Quản trị viên',
      email: ADMIN_EMAIL,
      password: PASSWORD,
      // Dù body gửi role khác, bootstrap vẫn ép thành admin/active
      role: 'hocsinh',
      accountStatus: 'pending',
    })

    expect(response.status).toBe(200)

    const admin = await findByEmail(ADMIN_EMAIL)
    expect(admin?.role).toBe('admin')
    expect(admin?.accountStatus).toBe('active')

    const login = await payload.login({
      collection: 'users',
      data: { email: ADMIN_EMAIL, password: PASSWORD },
    })
    expect(login.user?.role).toBe('admin')
  })

  it('không cho first-register khi đã có User', async () => {
    await bootstrapAdmin()

    const response = await firstRegister({
      name: 'Kẻ tấn công',
      email: 'attacker@test.local',
      password: PASSWORD,
    })

    expect(response.status).toBe(403)
    expect(await countUsers()).toBe(1)
    expect(await findByEmail('attacker@test.local')).toBeUndefined()
  })

  it('Local API không có dấu hiệu bootstrap thì không nâng thành Admin khi DB trống', async () => {
    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Script',
        email: 'script@test.local',
        password: PASSWORD,
        role: 'hocsinh',
        accountStatus: 'active',
      },
    })

    expect(user.role).not.toBe('admin')
    expect(await countAdmins()).toBe(0)
  })

  it('đăng ký công khai đồng thời với first-register không bao giờ tạo ra Admin', async () => {
    const [bootstrapResponse] = await Promise.all([
      firstRegister({ name: 'Quản trị viên', email: ADMIN_EMAIL, password: PASSWORD }),
      registerAccount(signupInput('hocsinh', 'race-hs@test.local')),
      registerAccount(signupInput('giaovien', 'race-gv@test.local')),
      registerAccount(signupInput('hocsinh', 'race-hs2@test.local')),
    ])

    expect(bootstrapResponse.status).toBe(200)

    const { docs: admins } = await payload.find({
      collection: 'users',
      where: { role: { equals: 'admin' } },
    })

    expect(admins.map((user) => user.email)).toEqual([ADMIN_EMAIL])
  })
})

describe('Đăng ký công khai khi đã có Admin', () => {
  beforeEach(async () => {
    await resetUsers()
    await bootstrapAdmin()
  })

  it('tạo Học sinh với role hocsinh và active', async () => {
    const result = await registerAccount(signupInput('hocsinh', 'hs@test.local'))

    expect(result.success).toBe(true)

    const user = await findByEmail('hs@test.local')
    expect(user?.role).toBe('hocsinh')
    expect(user?.accountStatus).toBe('active')
  })

  it('tạo Giáo viên với role giaovien và pending', async () => {
    const result = await registerAccount(signupInput('giaovien', 'gv@test.local'))

    expect(result.success).toBe(true)

    const user = await findByEmail('gv@test.local')
    expect(user?.role).toBe('giaovien')
    expect(user?.accountStatus).toBe('pending')
  })

  it.each([
    'admin',
    'Admin',
    'ADMIN',
    ' admin',
    '',
    undefined,
    null,
    ['admin'],
    { role: 'admin' },
  ])('từ chối role không hợp lệ: %j', async (role) => {
    const result = await registerAccount(signupInput(role, 'bad-role@test.local'))

    expect(result).toEqual({ success: false, error: INVALID_SIGNUP_ROLE_MESSAGE })
    expect(await findByEmail('bad-role@test.local')).toBeUndefined()
    expect(await countAdmins()).toBe(1)
  })

  it('bỏ qua accountStatus do client tự gửi lên', async () => {
    const result = await registerAccount({
      ...signupInput('giaovien', 'gv-sneaky@test.local'),
      accountStatus: 'active',
    } as SignupInput)

    expect(result.success).toBe(true)

    const user = await findByEmail('gv-sneaky@test.local')
    expect(user?.role).toBe('giaovien')
    expect(user?.accountStatus).toBe('pending')
  })

  it('hook chặn role admin cho mọi thao tác mang dấu hiệu đăng ký công khai', async () => {
    await expect(
      payload.create({
        collection: 'users',
        overrideAccess: true,
        context: { registrationSource: PUBLIC_SIGNUP_SOURCE },
        data: {
          name: 'X',
          email: 'direct-admin@test.local',
          password: PASSWORD,
          role: 'admin',
          accountStatus: 'active',
        },
      }),
    ).rejects.toThrow(INVALID_SIGNUP_ROLE_MESSAGE)

    // accountStatus bị ép theo role, kể cả khi gọi thẳng Local API
    const teacher = await payload.create({
      collection: 'users',
      overrideAccess: true,
      context: { registrationSource: PUBLIC_SIGNUP_SOURCE },
      data: {
        name: 'Y',
        email: 'direct-gv@test.local',
        password: PASSWORD,
        role: 'giaovien',
        accountStatus: 'active',
      },
    })

    expect(teacher.accountStatus).toBe('pending')
    expect(await findByEmail('direct-admin@test.local')).toBeUndefined()
    expect(await countAdmins()).toBe(1)
  })
})

describe('Phân quyền và đăng nhập sau đăng ký', () => {
  let admin: User

  beforeEach(async () => {
    await resetUsers()
    admin = await bootstrapAdmin()
    await registerAccount(signupInput('hocsinh', 'hs@test.local'))
    await registerAccount(signupInput('giaovien', 'gv@test.local'))
  })

  it('Học sinh không tự sửa được role hoặc accountStatus', async () => {
    const student = (await findByEmail('hs@test.local')) as User

    await payload.update({
      collection: 'users',
      id: student.id,
      data: { role: 'admin', accountStatus: 'pending' },
      overrideAccess: false,
      user: asUser(student),
    })

    const after = await findByEmail('hs@test.local')
    expect(after?.role).toBe('hocsinh')
    expect(after?.accountStatus).toBe('active')
  })

  it('Giáo viên pending không tự kích hoạt hay đổi role được', async () => {
    const teacher = (await findByEmail('gv@test.local')) as User

    await payload.update({
      collection: 'users',
      id: teacher.id,
      data: { role: 'admin', accountStatus: 'active' },
      overrideAccess: false,
      user: asUser(teacher),
    })

    const after = await findByEmail('gv@test.local')
    expect(after?.role).toBe('giaovien')
    expect(after?.accountStatus).toBe('pending')
  })

  it('Giáo viên pending không đăng nhập được, sau khi Admin duyệt thì đăng nhập được', async () => {
    await expect(
      payload.login({
        collection: 'users',
        data: { email: 'gv@test.local', password: PASSWORD },
      }),
    ).rejects.toThrow('Tài khoản Giáo viên đang chờ Admin phê duyệt.')

    const teacher = (await findByEmail('gv@test.local')) as User

    await payload.update({
      collection: 'users',
      id: teacher.id,
      data: { accountStatus: 'active' },
      overrideAccess: false,
      user: asUser(admin),
    })

    const login = await payload.login({
      collection: 'users',
      data: { email: 'gv@test.local', password: PASSWORD },
    })
    expect(login.user?.role).toBe('giaovien')
  })

  it('Học sinh đăng nhập được nhưng không tạo được User qua API', async () => {
    const login = await payload.login({
      collection: 'users',
      data: { email: 'hs@test.local', password: PASSWORD },
    })
    expect(login.user?.role).toBe('hocsinh')

    const student = (await findByEmail('hs@test.local')) as User

    await expect(
      payload.create({
        collection: 'users',
        overrideAccess: false,
        user: asUser(student),
        data: {
          name: 'Z',
          email: 'z@test.local',
          password: PASSWORD,
          role: 'admin',
          accountStatus: 'active',
        },
      }),
    ).rejects.toThrow()

    expect(await countAdmins()).toBe(1)
  })
})
