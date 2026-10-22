// @vitest-environment node
import config from '@payload-config'
import { GRAPHQL_POST } from '@payloadcms/next/routes'
import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  ANSWER_MAX_LENGTH,
  normalizeAnswers,
} from '@/collections/WorksheetSubmissions/answers'
import type { User, Worksheet, WorksheetSubmission } from '@/payload-types'

import { assertConnectedToLocalTestDatabase } from '../helpers/localTestDatabase'

// Chỉ chạy trên database local trong .env.test (guard trong vitest.setup.ts)

let payload: Payload

const PASSWORD = 'MatKhau123!'

// Chuỗi đánh dấu câu trả lời: không được xuất hiện trong phản hồi cho người không có quyền
const SECRET_ANSWER = 'CAU-TRA-LOI-CHI-CHU-BAI-VA-ADMIN-DUOC-XEM'

const SLUG = 'worksheet-submissions'

type CreateUserInput = Pick<User, 'role' | 'accountStatus'> & { email: string }

const createUser = ({ email, role, accountStatus }: CreateUserInput) =>
  payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { name: email, email, password: PASSWORD, role, accountStatus },
  })

const loginToken = async (email: string) => {
  const { token } = await payload.login({
    collection: 'users',
    data: { email, password: PASSWORD },
  })

  if (!token) throw new Error(`Không lấy được token cho ${email}`)

  return token
}

const asUser = (user: User) => ({ ...user, collection: 'users' as const })

const authHeaders = (token?: string): Record<string, string> =>
  token ? { Authorization: `JWT ${token}` } : {}

const rest = (
  path: string,
  { body, method = 'GET', token }: { body?: unknown; method?: string; token?: string } = {},
) =>
  handleEndpoints({
    config,
    request: new Request(`http://localhost:3000/api${path}`, {
      method,
      headers: {
        ...authHeaders(token),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  })

const graphql = (query: string, token?: string) =>
  GRAPHQL_POST(config)(
    new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ query }),
    }),
  )

// Payload trả lỗi validation dạng { errors: [{ data: { errors: [{ path, message }] } }] }
const validationErrors = async (response: Response) => {
  const body = (await response.json()) as {
    errors?: { data?: { errors?: { message: string; path: string }[] } }[]
  }

  return (body.errors ?? []).flatMap((error) => error.data?.errors ?? [])
}

const countSubmissions = async () =>
  (await payload.count({ collection: SLUG, overrideAccess: true })).totalDocs

const resetData = async () => {
  // Bài nộp trước: teacher/worksheet là NOT NULL nên không xóa được user/worksheet còn bài nộp
  await payload.db.deleteMany({ collection: SLUG, where: {} })
  await payload.db.deleteMany({ collection: 'worksheets', where: {} })
  await payload.db.deleteMany({ collection: 'users', where: {} })
}

let admin: User
let teacherA: User
let teacherB: User
let pendingTeacher: User
let student: User
let worksheet: Worksheet
let tokenA: string

const validAnswers = (prefix = SECRET_ANSWER) => [
  { questionKey: 'muc-tieu', value: `  ${prefix} mục tiêu  ` },
  { questionKey: 'ghi-chu', value: `${prefix} ghi chú` },
]

const submit = (body: Record<string, unknown>, token = tokenA) =>
  rest(`/${SLUG}`, { method: 'POST', token, body })

const submitValid = async (token = tokenA, prefix?: string) => {
  const response = await submit({ worksheet: worksheet.id, answers: validAnswers(prefix) }, token)
  expect(response.status).toBe(201)

  return ((await response.json()) as { doc: WorksheetSubmission }).doc
}

const relationID = (value: unknown) =>
  value && typeof value === 'object' && 'id' in value ? (value as { id: unknown }).id : value

beforeAll(async () => {
  payload = await getPayload({ config })
  await assertConnectedToLocalTestDatabase(payload.db)
})

afterAll(async () => {
  await resetData()
})

beforeEach(async () => {
  await resetData()

  admin = await createUser({ email: 'admin@test.local', role: 'admin', accountStatus: 'active' })
  teacherA = await createUser({ email: 'gv-a@test.local', role: 'giaovien', accountStatus: 'active' })
  teacherB = await createUser({ email: 'gv-b@test.local', role: 'giaovien', accountStatus: 'active' })
  pendingTeacher = await createUser({
    email: 'gv-pending@test.local',
    role: 'giaovien',
    accountStatus: 'pending',
  })
  student = await createUser({ email: 'hs@test.local', role: 'hocsinh', accountStatus: 'active' })

  worksheet = await payload.create({
    collection: 'worksheets',
    overrideAccess: true,
    data: {
      title: 'Worksheet mẫu',
      instructions: 'Điền các ô bên dưới.',
      questions: [
        { key: 'muc-tieu', label: 'Câu bắt buộc', required: true },
        { key: 'ghi-chu', label: 'Câu không bắt buộc', required: false },
      ],
    },
  })

  tokenA = await loginToken(teacherA.email)
})

describe('Đăng ký collection', () => {
  it('collection worksheet-submissions có các field worksheet, teacher, submittedAt, worksheetSnapshot, answers', () => {
    const fields = payload.collections[SLUG].config.fields
      .filter((field) => 'name' in field)
      .map((field) => ('name' in field ? field.name : null))

    expect(fields.filter((name) => !['id', 'updatedAt', 'createdAt'].includes(name ?? ''))).toEqual([
      'worksheet',
      'teacher',
      'submittedAt',
      'worksheetSnapshot',
      'answers',
    ])
  })
})

describe('Nộp hợp lệ', () => {
  it('lưu bài nộp, đúng giáo viên, đúng worksheet, kèm bản chụp đề và thời gian server', async () => {
    const before = Date.now()
    const doc = await submitValid()
    const after = Date.now()

    const saved = await payload.findByID({ collection: SLUG, id: doc.id, depth: 0 })

    expect(saved.teacher).toBe(teacherA.id)
    expect(saved.worksheet).toBe(worksheet.id)
    expect(saved.worksheetSnapshot).toMatchObject({
      title: 'Worksheet mẫu',
      instructions: 'Điền các ô bên dưới.',
      questions: [
        { key: 'muc-tieu', label: 'Câu bắt buộc', required: true },
        { key: 'ghi-chu', label: 'Câu không bắt buộc', required: false },
      ],
    })
    // Câu trả lời được bỏ khoảng trắng đầu/cuối
    expect(saved.answers?.map(({ questionKey, value }) => ({ questionKey, value }))).toEqual([
      { questionKey: 'muc-tieu', value: `${SECRET_ANSWER} mục tiêu` },
      { questionKey: 'ghi-chu', value: `${SECRET_ANSWER} ghi chú` },
    ])

    const submittedAt = new Date(saved.submittedAt).getTime()
    expect(submittedAt).toBeGreaterThanOrEqual(before - 1000)
    expect(submittedAt).toBeLessThanOrEqual(after + 1000)
    expect(saved.createdAt).toBeTruthy()
    expect(saved.updatedAt).toBeTruthy()
  })

  it('được bỏ qua câu không bắt buộc; câu chỉ có khoảng trắng không được lưu', async () => {
    const response = await submit({
      worksheet: worksheet.id,
      answers: [
        { questionKey: 'muc-tieu', value: 'Có trả lời' },
        { questionKey: 'ghi-chu', value: '   ' },
      ],
    })
    expect(response.status).toBe(201)

    const { doc } = (await response.json()) as { doc: WorksheetSubmission }
    expect(doc.answers?.map((answer) => answer.questionKey)).toEqual(['muc-tieu'])
  })

  it('một giáo viên nộp được nhiều bài riêng biệt cho cùng worksheet', async () => {
    const first = await submitValid()
    const second = await submitValid()

    expect(first.id).not.toBe(second.id)
    expect(await countSubmissions()).toBe(2)
  })

  it('Local API với overrideAccess: false và user Giáo viên active nộp được', async () => {
    const doc = await payload.create({
      collection: SLUG,
      overrideAccess: false,
      user: asUser(teacherA),
      data: { worksheet: worksheet.id, answers: validAnswers() } as never,
    })

    expect(relationID(doc.teacher)).toBe(teacherA.id)
  })
})

describe('Không giả mạo được', () => {
  it('teacher, submittedAt và worksheetSnapshot do client gửi đều bị bỏ', async () => {
    const response = await submit({
      worksheet: worksheet.id,
      answers: validAnswers(),
      teacher: teacherB.id,
      submittedAt: '2000-01-01T00:00:00.000Z',
      createdAt: '2000-01-01T00:00:00.000Z',
      worksheetSnapshot: {
        title: 'ĐỀ GIẢ',
        instructions: 'HƯỚNG DẪN GIẢ',
        questions: [{ key: 'muc-tieu', label: 'NHÃN GIẢ', required: false }],
      },
    })
    expect(response.status).toBe(201)
    const { doc } = (await response.json()) as { doc: WorksheetSubmission }

    const saved = await payload.findByID({ collection: SLUG, id: doc.id, depth: 0 })
    expect(saved.teacher).toBe(teacherA.id)
    expect(new Date(saved.submittedAt).getFullYear()).toBeGreaterThan(2000)
    expect(new Date(saved.createdAt).getFullYear()).toBeGreaterThan(2000)
    expect(JSON.stringify(saved.worksheetSnapshot)).not.toMatch(/GIẢ/)
    expect(saved.worksheetSnapshot.title).toBe('Worksheet mẫu')
  })

  it('bản chụp giả không làm câu bắt buộc thành không bắt buộc', async () => {
    const response = await submit({
      worksheet: worksheet.id,
      answers: [{ questionKey: 'ghi-chu', value: 'Chỉ trả lời câu không bắt buộc' }],
      worksheetSnapshot: {
        title: 'x',
        questions: [{ key: 'muc-tieu', label: 'x', required: false }],
      },
    })
    expect(response.status).toBe(400)
    expect(await countSubmissions()).toBe(0)
  })

  it('Local API với overrideAccess: true nhưng không có user bị từ chối (không có giáo viên để gán)', async () => {
    await expect(
      payload.create({
        collection: SLUG,
        overrideAccess: true,
        data: { worksheet: worksheet.id, teacher: teacherA.id, answers: validAnswers() } as never,
      }),
    ).rejects.toThrow()
    expect(await countSubmissions()).toBe(0)
  })
})

describe('Validation', () => {
  const expectRejected = async (body: Record<string, unknown>, path: string) => {
    const response = await submit(body)
    expect(response.status).toBe(400)
    expect((await validationErrors(response)).map((error) => error.path)).toContain(path)
    expect(await countSubmissions()).toBe(0)
  }

  it('từ chối khi thiếu câu bắt buộc', async () => {
    await expectRejected(
      { worksheet: worksheet.id, answers: [{ questionKey: 'ghi-chu', value: 'x' }] },
      'answers',
    )
    await expectRejected({ worksheet: worksheet.id }, 'answers')
  })

  it('câu bắt buộc chỉ có khoảng trắng được coi là trống', async () => {
    await expectRejected(
      { worksheet: worksheet.id, answers: [{ questionKey: 'muc-tieu', value: ' \n\t ' }] },
      'answers',
    )
  })

  it('từ chối mã câu hỏi không thuộc worksheet', async () => {
    await expectRejected(
      { worksheet: worksheet.id, answers: [...validAnswers(), { questionKey: 'la', value: 'x' }] },
      'answers.2.questionKey',
    )
  })

  it('từ chối mã câu hỏi trùng trong một bài nộp', async () => {
    await expectRejected(
      {
        worksheet: worksheet.id,
        answers: [...validAnswers(), { questionKey: 'muc-tieu', value: 'lần hai' }],
      },
      'answers.2.questionKey',
    )
  })

  it('từ chối câu trả lời không phải văn bản', async () => {
    for (const value of [123, true, { text: 'x' }, ['x']]) {
      await expectRejected(
        { worksheet: worksheet.id, answers: [{ questionKey: 'muc-tieu', value }] },
        'answers.0.value',
      )
    }
  })

  it(`từ chối câu trả lời dài hơn ${ANSWER_MAX_LENGTH} ký tự`, async () => {
    await expectRejected(
      {
        worksheet: worksheet.id,
        answers: [{ questionKey: 'muc-tieu', value: 'a'.repeat(ANSWER_MAX_LENGTH + 1) }],
      },
      'answers.0.value',
    )

    const response = await submit({
      worksheet: worksheet.id,
      answers: [{ questionKey: 'muc-tieu', value: 'a'.repeat(ANSWER_MAX_LENGTH) }],
    })
    expect(response.status).toBe(201)
  })

  it('từ chối answers không phải danh sách hoặc thiếu mã câu hỏi', async () => {
    await expectRejected({ worksheet: worksheet.id, answers: 'không phải mảng' }, 'answers')
    await expectRejected({ worksheet: worksheet.id, answers: [{ value: 'x' }] }, 'answers.0.questionKey')
  })

  it('từ chối khi thiếu worksheet hoặc worksheet không tồn tại', async () => {
    await expectRejected({ answers: validAnswers() }, 'worksheet')
    await expectRejected({ worksheet: 999999, answers: validAnswers() }, 'worksheet')
    await expectRejected({ worksheet: 'abc', answers: validAnswers() }, 'worksheet')
  })
})

describe('Quyền đọc', () => {
  let submissionA: WorksheetSubmission
  let submissionB: WorksheetSubmission

  beforeEach(async () => {
    submissionA = await submitValid(tokenA, 'BAI-CUA-A')
    submissionB = await submitValid(await loginToken(teacherB.email), 'BAI-CUA-B')
  })

  it('Giáo viên chỉ thấy bài của mình trong danh sách (REST)', async () => {
    const response = await rest(`/${SLUG}`, { token: tokenA })
    expect(response.status).toBe(200)
    const text = await response.text()

    expect((JSON.parse(text) as { docs: WorksheetSubmission[] }).docs.map((doc) => doc.id)).toEqual([
      submissionA.id,
    ])
    expect(text).not.toContain('BAI-CUA-B')
  })

  it('Giáo viên không lọc ra được bài của người khác bằng ?where', async () => {
    const response = await rest(`/${SLUG}?where[teacher][equals]=${teacherB.id}`, { token: tokenA })
    const text = await response.text()

    expect((JSON.parse(text) as { docs: unknown[] }).docs).toEqual([])
    expect(text).not.toContain('BAI-CUA-B')
  })

  it('Giáo viên A không đọc được bài của Giáo viên B bằng ID (REST, GraphQL, Local API)', async () => {
    const own = await rest(`/${SLUG}/${submissionA.id}`, { token: tokenA })
    expect(own.status).toBe(200)

    const other = await rest(`/${SLUG}/${submissionB.id}`, { token: tokenA })
    expect(other.status).not.toBe(200)
    expect(await other.text()).not.toContain('BAI-CUA-B')

    const response = await graphql(
      `{ WorksheetSubmission(id: ${submissionB.id}) { id answers { value } } }`,
      tokenA,
    )
    const text = await response.text()
    expect(JSON.parse(text).data?.WorksheetSubmission ?? null).toBeNull()
    expect(text).not.toContain('BAI-CUA-B')

    await expect(
      payload.findByID({
        collection: SLUG,
        id: submissionB.id,
        overrideAccess: false,
        user: asUser(teacherA),
      }),
    ).rejects.toThrow()

    const local = await payload.find({ collection: SLUG, overrideAccess: false, user: asUser(teacherA) })
    expect(local.docs.map((doc) => doc.id)).toEqual([submissionA.id])
  })

  it('Admin đọc được tất cả bài nộp, kể cả theo ID', async () => {
    const token = await loginToken(admin.email)

    const list = await rest(`/${SLUG}`, { token })
    const { docs } = (await list.json()) as { docs: WorksheetSubmission[] }
    expect(docs.map((doc) => doc.id).sort()).toEqual([submissionA.id, submissionB.id].sort())

    const detail = await rest(`/${SLUG}/${submissionB.id}`, { token })
    expect(detail.status).toBe(200)
    expect(await detail.text()).toContain('BAI-CUA-B')

    const response = await graphql(`{ WorksheetSubmissions { totalDocs } }`, token)
    expect((await response.json()).data.WorksheetSubmissions.totalDocs).toBe(2)
  })

  it('Local API mặc định (overrideAccess: true) bỏ qua access control — chỉ dùng trong code server tin cậy', async () => {
    const all = await payload.find({ collection: SLUG })
    expect(all.totalDocs).toBe(2)
  })
})

describe('Người không có quyền', () => {
  it('Giáo viên pending không tạo hay đọc được bài nộp', async () => {
    await expect(
      payload.create({
        collection: SLUG,
        overrideAccess: false,
        user: asUser(pendingTeacher),
        data: { worksheet: worksheet.id, answers: validAnswers() } as never,
      }),
    ).rejects.toThrow()

    await expect(
      payload.find({ collection: SLUG, overrideAccess: false, user: asUser(pendingTeacher) }),
    ).rejects.toThrow()
  })

  it('token cấp khi còn active mất quyền nộp và đọc ngay khi tài khoản chuyển sang pending', async () => {
    const own = await submitValid()

    await payload.update({
      collection: 'users',
      id: teacherA.id,
      data: { accountStatus: 'pending' },
      overrideAccess: false,
      user: asUser(admin),
    })

    expect((await submit({ worksheet: worksheet.id, answers: validAnswers() })).status).toBe(403)

    for (const path of [`/${SLUG}`, `/${SLUG}/${own.id}`]) {
      const response = await rest(path, { token: tokenA })
      expect(response.status).toBe(403)
      expect(await response.text()).not.toContain(SECRET_ANSWER)
    }

    expect(await countSubmissions()).toBe(1)
  })

  it('Học sinh / Phụ huynh và khách không tạo hay đọc được bài nộp', async () => {
    const own = await submitValid()
    const studentToken = await loginToken(student.email)

    for (const token of [studentToken, undefined]) {
      // Gọi rest trực tiếp: submit(…, undefined) sẽ dùng token mặc định của Giáo viên A
      const created = await rest(`/${SLUG}`, {
        method: 'POST',
        token,
        body: { worksheet: worksheet.id, answers: validAnswers() },
      })
      expect(created.status).toBe(403)

      for (const path of [`/${SLUG}`, `/${SLUG}/${own.id}`]) {
        const response = await rest(path, { token })
        expect(response.status).toBe(403)
        expect(await response.text()).not.toContain(SECRET_ANSWER)
      }
    }

    const response = await graphql(`{ WorksheetSubmissions { docs { id answers { value } } } }`)
    const text = await response.text()
    expect(JSON.parse(text).data?.WorksheetSubmissions ?? null).toBeNull()
    expect(text).not.toContain(SECRET_ANSWER)

    expect(await countSubmissions()).toBe(1)
  })

  it('Admin không tạo được bài nộp (bài nộp luôn thuộc một Giáo viên)', async () => {
    const response = await submit(
      { worksheet: worksheet.id, answers: validAnswers() },
      await loginToken(admin.email),
    )
    expect(response.status).toBe(403)
  })
})

describe('Không sửa/xóa được bài đã nộp', () => {
  it('chủ bài và Admin đều không PATCH/DELETE được (REST, GraphQL)', async () => {
    const own = await submitValid()

    for (const token of [tokenA, await loginToken(admin.email)]) {
      const patched = await rest(`/${SLUG}/${own.id}`, {
        method: 'PATCH',
        token,
        body: { answers: [{ questionKey: 'muc-tieu', value: 'ĐÃ SỬA' }] },
      })
      expect(patched.status).toBe(403)

      const deleted = await rest(`/${SLUG}/${own.id}`, { method: 'DELETE', token })
      expect(deleted.status).toBe(403)

      const response = await graphql(
        `mutation { deleteWorksheetSubmission(id: ${own.id}) { id } }`,
        token,
      )
      expect((await response.json()).errors?.length).toBe(1)
    }

    const saved = await payload.findByID({ collection: SLUG, id: own.id })
    expect(JSON.stringify(saved.answers)).not.toContain('ĐÃ SỬA')
    expect(await countSubmissions()).toBe(1)
  })

  it('kể cả Local API với overrideAccess: true cũng không sửa được bài nộp', async () => {
    const own = await submitValid()

    await expect(
      payload.update({
        collection: SLUG,
        id: own.id,
        overrideAccess: true,
        user: asUser(teacherA),
        data: { answers: [{ questionKey: 'muc-tieu', value: 'ĐÃ SỬA' }] },
      }),
    ).rejects.toThrow()

    const saved = await payload.findByID({ collection: SLUG, id: own.id })
    expect(JSON.stringify(saved.answers)).not.toContain('ĐÃ SỬA')
  })
})

describe('Bảo vệ worksheet đã có bài nộp', () => {
  it('Admin không xóa được worksheet đã có bài nộp (REST và Local API)', async () => {
    await submitValid()

    const response = await rest(`/worksheets/${worksheet.id}`, {
      method: 'DELETE',
      token: await loginToken(admin.email),
    })
    expect(response.status).toBe(409)

    await expect(
      payload.delete({ collection: 'worksheets', id: worksheet.id, overrideAccess: true }),
    ).rejects.toThrow()

    expect(await payload.findByID({ collection: 'worksheets', id: worksheet.id })).toBeTruthy()
    expect(await countSubmissions()).toBe(1)
  })

  it('worksheet chưa có bài nộp vẫn xóa được', async () => {
    const response = await rest(`/worksheets/${worksheet.id}`, {
      method: 'DELETE',
      token: await loginToken(admin.email),
    })
    expect(response.status).toBe(200)
  })

  it('sửa worksheet không làm đổi bản chụp đề của bài nộp cũ; bài nộp mới dùng đề mới', async () => {
    const old = await submitValid()

    await payload.update({
      collection: 'worksheets',
      id: worksheet.id,
      overrideAccess: false,
      user: asUser(admin),
      data: {
        title: 'Tiêu đề mới',
        instructions: 'Hướng dẫn mới',
        questions: [
          { key: 'muc-tieu', label: 'Nhãn mới', required: false },
          { key: 'cau-moi', label: 'Câu mới', required: true },
        ],
      },
    })

    const oldSaved = await payload.findByID({ collection: SLUG, id: old.id })
    expect(oldSaved.worksheetSnapshot).toMatchObject({
      title: 'Worksheet mẫu',
      instructions: 'Điền các ô bên dưới.',
      questions: [
        { key: 'muc-tieu', label: 'Câu bắt buộc', required: true },
        { key: 'ghi-chu', label: 'Câu không bắt buộc', required: false },
      ],
    })
    expect(oldSaved.answers?.map((answer) => answer.questionKey)).toEqual(['muc-tieu', 'ghi-chu'])

    // Câu "ghi-chu" đã bị xóa khỏi worksheet nên bài mới không được trả lời nó nữa
    expect(
      (await submit({ worksheet: worksheet.id, answers: validAnswers() })).status,
    ).toBe(400)

    const response = await submit({
      worksheet: worksheet.id,
      answers: [{ questionKey: 'cau-moi', value: 'Trả lời câu mới' }],
    })
    expect(response.status).toBe(201)
    const { doc } = (await response.json()) as { doc: WorksheetSubmission }
    expect(doc.worksheetSnapshot.title).toBe('Tiêu đề mới')
    expect(doc.worksheetSnapshot.questions.map((q) => q.key)).toEqual(['muc-tieu', 'cau-moi'])
  })
})

describe('normalizeAnswers', () => {
  const questions = [
    { key: 'a', label: 'A', required: true },
    { key: 'b', label: 'B', required: false },
  ]

  it('chấp nhận undefined khi không có câu bắt buộc', () => {
    expect(normalizeAnswers(undefined, [questions[1]])).toEqual({ answers: [], errors: [] })
  })

  it('chuẩn hóa NFC và bỏ khoảng trắng đầu/cuối', () => {
    const decomposed = 'Tiếng Việt'
    const { answers, errors } = normalizeAnswers([{ questionKey: 'a', value: `  ${decomposed}  ` }], questions)

    expect(errors).toEqual([])
    expect(answers).toEqual([{ questionKey: 'a', value: decomposed.normalize('NFC') }])
  })
})
