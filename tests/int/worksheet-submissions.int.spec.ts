// @vitest-environment node
import config from '@payload-config'
import { GRAPHQL_POST } from '@payloadcms/next/routes'
import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { User, WorksheetSubmission } from '@/payload-types'
import { PHIEU_AM_MUC_TIEU, PHIEU_THEO_DOI_CA, WORKSHEET_TEMPLATES } from '@/worksheetTemplates/definitions'
import { normalizeTemplateValues } from '@/worksheetTemplates/validate'

import { assertConnectedToLocalTestDatabase } from '../helpers/localTestDatabase'

// Chỉ chạy trên database local trong .env.test (guard trong vitest.setup.ts).
// Dữ liệu test là giá trị trung tính, không lấy từ ảnh mẫu trong docs/.

let payload: Payload

const PASSWORD = 'MatKhau123!'
const SLUG = 'worksheet-submissions'

// Chuỗi đánh dấu: không được xuất hiện trong phản hồi cho người không có quyền
const SECRET = 'DU-LIEU-PHIEU-CHI-CHU-BAI-VA-ADMIN-DUOC-XEM'

type CreateUserInput = Pick<User, 'role' | 'accountStatus'> & { email: string }

const createUser = ({ email, role, accountStatus }: CreateUserInput) =>
  payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { name: email, email, password: PASSWORD, role, accountStatus },
  })

const loginToken = async (email: string) => {
  const { token } = await payload.login({ collection: 'users', data: { email, password: PASSWORD } })

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
      headers: { ...authHeaders(token), ...(body ? { 'Content-Type': 'application/json' } : {}) },
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
const errorPaths = async (response: Response) => {
  const body = (await response.json()) as { errors?: { data?: { errors?: { path: string }[] } }[] }

  return (body.errors ?? []).flatMap((error) => error.data?.errors ?? []).map((error) => error.path)
}

const countSubmissions = async () => (await payload.count({ collection: SLUG, overrideAccess: true })).totalDocs

const resetData = async () => {
  // Bài nộp trước: teacher là NOT NULL nên không xóa được user còn bài nộp
  await payload.db.deleteMany({ collection: SLUG, where: {} })
  await payload.db.deleteMany({ collection: 'worksheets', where: {} })
  await payload.db.deleteMany({ collection: 'users', where: {} })
}

// Giá trị như form gửi lên: mọi ô là chuỗi, có khoảng trắng thừa và một dòng trống
const caData = (marker = SECRET) => ({
  tre: `  Trẻ thử nghiệm ${marker}  `,
  ngayCT: '2026-10-20',
  tuGio: '08:00',
  denGio: '09:30',
  mucTieu: [
    { soBaiHoc: '1', capDo: '2', mucTieuCuThe: 'Mục tiêu thử nghiệm', co1: '+', co2: '-', co10: '+', phanTramDung: '67' },
    { soBaiHoc: '', capDo: '', mucTieuCuThe: '   ' },
    { soBaiHoc: '2', mucTieuCuThe: 'Mục tiêu thứ hai', phanTramDung: 100 },
  ],
})

const amData = () => ({
  tenTre: 'Trẻ thử nghiệm',
  amMucTieu: 'Tr',
  thangNam: '2026-10',
  buoi: [{ ngay: '3', phanTram: '40' }, { ngay: '', phanTram: '' }, { ngay: 7, phanTram: 60 }],
  ghiChu: 'Ghi chú thử nghiệm',
})

let admin: User
let teacherA: User
let teacherB: User
let pendingTeacher: User
let student: User
let tokenA: string

const submit = (body: Record<string, unknown>, token: string | undefined = tokenA) =>
  rest(`/${SLUG}`, { method: 'POST', token, body })

const submitCa = async (token = tokenA, marker?: string) => {
  const response = await submit({ templateCode: PHIEU_THEO_DOI_CA.code, data: caData(marker) }, token)
  expect(response.status).toBe(201)

  return ((await response.json()) as { doc: WorksheetSubmission }).doc
}

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
  pendingTeacher = await createUser({ email: 'gv-pending@test.local', role: 'giaovien', accountStatus: 'pending' })
  student = await createUser({ email: 'hs@test.local', role: 'hocsinh', accountStatus: 'active' })

  tokenA = await loginToken(teacherA.email)
})

describe('Mẫu phiếu hệ thống', () => {
  it('có đúng 2 mẫu với mã và phiên bản ổn định', () => {
    expect(WORKSHEET_TEMPLATES.map(({ code, version }) => ({ code, version }))).toEqual([
      { code: 'phieu-theo-doi-ca', version: 1 },
      { code: 'phieu-am-muc-tieu', version: 1 },
    ])
  })

  it('mẫu "Phiếu theo dõi ca" có cột Số bài học, Cấp độ, Mục tiêu cụ thể, 10 cơ hội và % đúng', () => {
    const table = PHIEU_THEO_DOI_CA.sections.flatMap((s) => s.fields).find((f) => f.key === 'mucTieu')

    expect(table?.kind).toBe('table')
    expect(table && table.kind === 'table' ? table.columns.map((c) => c.key) : []).toEqual([
      'soBaiHoc',
      'capDo',
      'mucTieuCuThe',
      ...Array.from({ length: 10 }, (_, i) => `co${i + 1}`),
      'phanTramDung',
    ])
  })

  it('mẫu "Âm mục tiêu" có 15 buổi cố định và biểu đồ 0–100%', () => {
    const table = PHIEU_AM_MUC_TIEU.sections.flatMap((s) => s.fields).find((f) => f.key === 'buoi')

    expect(table).toMatchObject({ kind: 'table', mode: 'fixed', rows: 15, chart: { min: 0, max: 100 } })
  })
})

describe('Nộp hợp lệ', () => {
  it('lưu phiếu theo dõi ca: đúng giáo viên, thời gian server, bản chụp mẫu và dữ liệu đã chuẩn hóa', async () => {
    const before = Date.now()
    const doc = await submitCa()
    const after = Date.now()

    const saved = await payload.findByID({ collection: SLUG, id: doc.id, depth: 0 })

    expect(saved.teacher).toBe(teacherA.id)
    expect(saved.templateCode).toBe('phieu-theo-doi-ca')
    expect(saved.templateVersion).toBe(1)
    expect(saved.title).toBe(PHIEU_THEO_DOI_CA.title)
    expect(saved.templateSnapshot).toEqual(JSON.parse(JSON.stringify(PHIEU_THEO_DOI_CA)))
    expect(saved.worksheet ?? null).toBeNull()

    const data = saved.data as Record<string, unknown>
    expect(data.tre).toBe(`Trẻ thử nghiệm ${SECRET}`)
    expect(data).toMatchObject({ ngayCT: '2026-10-20', tuGio: '08:00', denGio: '09:30' })

    // Dòng trống bị bỏ; số lưu dạng số; mọi cột của mẫu đều có mặt
    const rows = data.mucTieu as Record<string, unknown>[]
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ soBaiHoc: '1', capDo: '2', co1: '+', co2: '-', co3: null, co10: '+', phanTramDung: 67 })
    expect(rows[1]).toMatchObject({ soBaiHoc: '2', capDo: null, phanTramDung: 100 })
    // 3 cột thông tin + 10 cơ hội + % đúng
    expect(Object.keys(rows[0])).toHaveLength(14)

    const submittedAt = new Date(saved.submittedAt).getTime()
    expect(submittedAt).toBeGreaterThanOrEqual(before - 1000)
    expect(submittedAt).toBeLessThanOrEqual(after + 1000)
  })

  it('lưu phiếu âm mục tiêu: luôn đủ 15 buổi, buổi trống là null', async () => {
    const response = await submit({ templateCode: PHIEU_AM_MUC_TIEU.code, data: amData() })
    expect(response.status).toBe(201)
    const { doc } = (await response.json()) as { doc: WorksheetSubmission }

    const data = doc.data as Record<string, unknown>
    const rows = data.buoi as Record<string, unknown>[]
    expect(rows).toHaveLength(15)
    expect(rows[0]).toEqual({ ngay: 3, phanTram: 40 })
    expect(rows[1]).toEqual({ ngay: null, phanTram: null })
    expect(rows[2]).toEqual({ ngay: 7, phanTram: 60 })
    expect(rows[14]).toEqual({ ngay: null, phanTram: null })
    expect(data).toMatchObject({ tenTre: 'Trẻ thử nghiệm', amMucTieu: 'Tr', thangNam: '2026-10' })
  })

  it('trường không có trong mẫu bị bỏ', async () => {
    const response = await submit({
      templateCode: PHIEU_AM_MUC_TIEU.code,
      data: { ...amData(), truongLa: 'x', buoi: [{ ngay: 1, phanTram: 10, cotLa: 'y' }] },
    })
    expect(response.status).toBe(201)
    const { doc } = (await response.json()) as { doc: WorksheetSubmission }

    expect(JSON.stringify(doc.data)).not.toMatch(/truongLa|cotLa/)
  })

  it('một giáo viên nộp được nhiều phiếu riêng biệt', async () => {
    const first = await submitCa()
    const second = await submitCa()

    expect(first.id).not.toBe(second.id)
    expect(await countSubmissions()).toBe(2)
  })

  it('Local API với overrideAccess: false và user Giáo viên active nộp được', async () => {
    const doc = await payload.create({
      collection: SLUG,
      overrideAccess: false,
      user: asUser(teacherA),
      data: { templateCode: PHIEU_AM_MUC_TIEU.code, data: amData() } as never,
    })

    expect(typeof doc.teacher === 'object' ? doc.teacher?.id : doc.teacher).toBe(teacherA.id)
  })
})

describe('Không giả mạo được', () => {
  it('teacher, submittedAt, title, templateVersion và templateSnapshot do client gửi đều bị bỏ', async () => {
    const response = await submit({
      templateCode: PHIEU_THEO_DOI_CA.code,
      data: caData(),
      teacher: teacherB.id,
      submittedAt: '2000-01-01T00:00:00.000Z',
      title: 'TIÊU ĐỀ GIẢ',
      templateVersion: 99,
      templateSnapshot: { ...PHIEU_THEO_DOI_CA, title: 'MẪU GIẢ', sections: [] },
    })
    expect(response.status).toBe(201)
    const { doc } = (await response.json()) as { doc: WorksheetSubmission }

    const saved = await payload.findByID({ collection: SLUG, id: doc.id, depth: 0 })
    expect(saved.teacher).toBe(teacherA.id)
    expect(new Date(saved.submittedAt).getFullYear()).toBeGreaterThan(2000)
    expect(saved.title).toBe(PHIEU_THEO_DOI_CA.title)
    expect(saved.templateVersion).toBe(1)
    expect(JSON.stringify(saved.templateSnapshot)).not.toContain('GIẢ')
  })

  it('Local API với overrideAccess: true nhưng không có user bị từ chối', async () => {
    await expect(
      payload.create({
        collection: SLUG,
        overrideAccess: true,
        data: { templateCode: PHIEU_AM_MUC_TIEU.code, data: amData(), teacher: teacherA.id } as never,
      }),
    ).rejects.toThrow()
    expect(await countSubmissions()).toBe(0)
  })

  it('không tạo được bài nộp kiểu cũ theo worksheet do Admin soạn', async () => {
    const worksheet = await payload.create({
      collection: 'worksheets',
      overrideAccess: true,
      data: { title: 'Worksheet cũ', questions: [{ key: 'cau-1', label: 'Câu 1', required: true }] },
    })

    const response = await submit({ worksheet: worksheet.id, answers: [{ questionKey: 'cau-1', value: 'x' }] })
    expect(response.status).toBe(400)
    expect(await errorPaths(response)).toContain('templateCode')
    expect(await countSubmissions()).toBe(0)
  })
})

describe('Validation', () => {
  const expectRejected = async (data: unknown, path: string, templateCode: string = PHIEU_THEO_DOI_CA.code) => {
    const response = await submit({ templateCode, data })
    expect(response.status).toBe(400)
    expect(await errorPaths(response)).toContain(path)
    expect(await countSubmissions()).toBe(0)
  }

  it('từ chối mẫu không tồn tại', async () => {
    await expectRejected(caData(), 'templateCode', 'mau-khong-ton-tai')
    await expectRejected(caData(), 'templateCode', '')
  })

  it('thiếu trường bắt buộc hoặc chỉ có khoảng trắng', async () => {
    await expectRejected({ ...caData(), tre: '   ' }, 'values.tre')
    await expectRejected({ ...caData(), ngayCT: undefined }, 'values.ngayCT')
    await expectRejected({ ...amData(), amMucTieu: ' ' }, 'values.amMucTieu', PHIEU_AM_MUC_TIEU.code)
    await expectRejected({ ...amData(), thangNam: '' }, 'values.thangNam', PHIEU_AM_MUC_TIEU.code)
  })

  it('trường không bắt buộc được bỏ trống', async () => {
    const response = await submit({
      templateCode: PHIEU_THEO_DOI_CA.code,
      data: { tre: 'Trẻ', ngayCT: '2026-10-20' },
    })
    expect(response.status).toBe(201)
    const { doc } = (await response.json()) as { doc: WorksheetSubmission }
    expect(doc.data).toMatchObject({ tuGio: null, denGio: null, mucTieu: [] })
  })

  it('ngày, giờ, tháng/năm sai định dạng bị từ chối', async () => {
    await expectRejected({ ...caData(), ngayCT: '2026-02-30' }, 'values.ngayCT')
    await expectRejected({ ...caData(), ngayCT: '20/10/2026' }, 'values.ngayCT')
    await expectRejected({ ...caData(), tuGio: '25:00' }, 'values.tuGio')
    await expectRejected({ ...amData(), thangNam: '2026-13' }, 'values.thangNam', PHIEU_AM_MUC_TIEU.code)
    await expectRejected({ ...amData(), thangNam: '2026-' }, 'values.thangNam', PHIEU_AM_MUC_TIEU.code)
  })

  it('số ngoài khoảng hoặc không phải số nguyên bị từ chối', async () => {
    await expectRejected(
      { ...caData(), mucTieu: [{ mucTieuCuThe: 'x', phanTramDung: '101' }] },
      'values.mucTieu.0.phanTramDung',
    )
    await expectRejected(
      { ...caData(), mucTieu: [{ mucTieuCuThe: 'x', phanTramDung: '12.5' }] },
      'values.mucTieu.0.phanTramDung',
    )
    await expectRejected(
      { ...amData(), buoi: [{}, { ngay: '32', phanTram: '10' }] },
      'values.buoi.1.ngay',
      PHIEU_AM_MUC_TIEU.code,
    )
    await expectRejected({ ...amData(), buoi: [{ ngay: 'abc' }] }, 'values.buoi.0.ngay', PHIEU_AM_MUC_TIEU.code)
  })

  it('văn bản quá dài hoặc sai kiểu bị từ chối', async () => {
    await expectRejected({ ...caData(), tre: 'a'.repeat(201) }, 'values.tre')
    await expectRejected({ ...caData(), tre: 123 }, 'values.tre')
    await expectRejected({ ...caData(), mucTieu: [{ co1: 'quá-mười-ký-tự' }] }, 'values.mucTieu.0.co1')
  })

  it('bảng quá số dòng, sai kiểu, hoặc dữ liệu phiếu không phải object bị từ chối', async () => {
    await expectRejected(
      { ...caData(), mucTieu: Array.from({ length: 16 }, () => ({ mucTieuCuThe: 'x' })) },
      'values.mucTieu',
    )
    await expectRejected({ ...caData(), mucTieu: 'không phải bảng' }, 'values.mucTieu')
    await expectRejected({ ...amData(), buoi: Array.from({ length: 16 }, () => ({})) }, 'values.buoi', PHIEU_AM_MUC_TIEU.code)
    await expectRejected('không phải object', 'values')
  })
})

describe('Quyền đọc', () => {
  let submissionA: WorksheetSubmission
  let submissionB: WorksheetSubmission

  beforeEach(async () => {
    submissionA = await submitCa(tokenA, 'BAI-CUA-A')
    submissionB = await submitCa(await loginToken(teacherB.email), 'BAI-CUA-B')
  })

  it('Giáo viên chỉ thấy bài của mình (danh sách, ?where, ID; REST, GraphQL, Local API)', async () => {
    const list = await rest(`/${SLUG}`, { token: tokenA })
    const text = await list.text()
    expect((JSON.parse(text) as { docs: WorksheetSubmission[] }).docs.map((doc) => doc.id)).toEqual([submissionA.id])
    expect(text).not.toContain('BAI-CUA-B')

    const filtered = await rest(`/${SLUG}?where[teacher][equals]=${teacherB.id}`, { token: tokenA })
    expect((JSON.parse(await filtered.text()) as { docs: unknown[] }).docs).toEqual([])

    const other = await rest(`/${SLUG}/${submissionB.id}`, { token: tokenA })
    expect(other.status).not.toBe(200)
    expect(await other.text()).not.toContain('BAI-CUA-B')

    const response = await graphql(`{ WorksheetSubmission(id: ${submissionB.id}) { id data } }`, tokenA)
    const graphText = await response.text()
    expect(JSON.parse(graphText).data?.WorksheetSubmission ?? null).toBeNull()
    expect(graphText).not.toContain('BAI-CUA-B')

    await expect(
      payload.findByID({ collection: SLUG, id: submissionB.id, overrideAccess: false, user: asUser(teacherA) }),
    ).rejects.toThrow()
  })

  it('Admin đọc được bài của cả A và B', async () => {
    const token = await loginToken(admin.email)

    const list = await rest(`/${SLUG}`, { token })
    const { docs } = (await list.json()) as { docs: WorksheetSubmission[] }
    expect(docs.map((doc) => doc.id).sort()).toEqual([submissionA.id, submissionB.id].sort())

    const detail = await rest(`/${SLUG}/${submissionB.id}`, { token })
    expect(detail.status).toBe(200)
    expect(await detail.text()).toContain('BAI-CUA-B')
  })
})

describe('Người không có quyền', () => {
  it('Giáo viên pending không tạo hay đọc được, kể cả với token cũ', async () => {
    await expect(
      payload.create({
        collection: SLUG,
        overrideAccess: false,
        user: asUser(pendingTeacher),
        data: { templateCode: PHIEU_AM_MUC_TIEU.code, data: amData() } as never,
      }),
    ).rejects.toThrow()

    const own = await submitCa()
    await payload.update({
      collection: 'users',
      id: teacherA.id,
      data: { accountStatus: 'pending' },
      overrideAccess: false,
      user: asUser(admin),
    })

    expect((await submit({ templateCode: PHIEU_THEO_DOI_CA.code, data: caData() })).status).toBe(403)
    for (const path of [`/${SLUG}`, `/${SLUG}/${own.id}`]) {
      const response = await rest(path, { token: tokenA })
      expect(response.status).toBe(403)
      expect(await response.text()).not.toContain(SECRET)
    }
    expect(await countSubmissions()).toBe(1)
  })

  it('Học sinh / Phụ huynh, khách và Admin không tạo được; học sinh và khách không đọc được', async () => {
    const own = await submitCa()
    const studentToken = await loginToken(student.email)

    for (const token of [studentToken, undefined, await loginToken(admin.email)]) {
      const created = await rest(`/${SLUG}`, {
        method: 'POST',
        token,
        body: { templateCode: PHIEU_AM_MUC_TIEU.code, data: amData() },
      })
      expect(created.status).toBe(403)
    }

    for (const token of [studentToken, undefined]) {
      for (const path of [`/${SLUG}`, `/${SLUG}/${own.id}`]) {
        const response = await rest(path, { token })
        expect(response.status).toBe(403)
        expect(await response.text()).not.toContain(SECRET)
      }
    }

    expect(await countSubmissions()).toBe(1)
  })
})

describe('Không sửa/xóa được bài đã nộp', () => {
  it('chủ bài và Admin đều không PATCH/DELETE được; Local API overrideAccess cũng không sửa được', async () => {
    const own = await submitCa()

    for (const token of [tokenA, await loginToken(admin.email)]) {
      expect(
        (await rest(`/${SLUG}/${own.id}`, { method: 'PATCH', token, body: { data: { tre: 'ĐÃ SỬA' } } })).status,
      ).toBe(403)
      expect((await rest(`/${SLUG}/${own.id}`, { method: 'DELETE', token })).status).toBe(403)
    }

    await expect(
      payload.update({
        collection: SLUG,
        id: own.id,
        overrideAccess: true,
        user: asUser(teacherA),
        data: { data: { tre: 'ĐÃ SỬA' } },
      }),
    ).rejects.toThrow()

    const saved = await payload.findByID({ collection: SLUG, id: own.id })
    expect(JSON.stringify(saved.data)).not.toContain('ĐÃ SỬA')
    expect(await countSubmissions()).toBe(1)
  })
})

describe('Bản chụp mẫu', () => {
  it('đổi định nghĩa mẫu trong code không làm đổi bài đã nộp', async () => {
    const doc = await submitCa()
    const originalTitle = PHIEU_THEO_DOI_CA.title

    try {
      PHIEU_THEO_DOI_CA.title = 'Tiêu đề mẫu đã đổi'
      PHIEU_THEO_DOI_CA.sections[0].title = 'Phần đã đổi'

      const saved = await payload.findByID({ collection: SLUG, id: doc.id })
      expect(saved.title).toBe(originalTitle)
      expect(JSON.stringify(saved.templateSnapshot)).not.toContain('đã đổi')
    } finally {
      PHIEU_THEO_DOI_CA.title = originalTitle
      PHIEU_THEO_DOI_CA.sections[0].title = 'Thông tin ca can thiệp'
    }
  })
})

describe('Bài nộp kiểu cũ (worksheet do Admin soạn)', () => {
  it('vẫn đọc được bài cũ với bản chụp câu hỏi và câu trả lời; worksheet của bài cũ không xóa được', async () => {
    const worksheet = await payload.create({
      collection: 'worksheets',
      overrideAccess: true,
      data: { title: 'Worksheet cũ', questions: [{ key: 'cau-1', label: 'Câu hỏi cũ', required: true }] },
    })

    // Ghi thẳng vào database (bỏ qua hook, nên phải tự đặt id cho dòng mảng) để mô phỏng dữ liệu
    // tạo trước khi đổi sang mẫu hệ thống
    const legacy = await payload.db.create({
      collection: SLUG,
      data: {
        answers: [{ id: 'legacy-answer-1', questionKey: 'cau-1', value: `Câu trả lời cũ ${SECRET}` }],
        submittedAt: '2026-10-20T08:00:00.000Z',
        teacher: teacherA.id,
        title: 'Worksheet cũ',
        worksheet: worksheet.id,
        worksheetSnapshot: {
          title: 'Worksheet cũ',
          instructions: 'Hướng dẫn cũ',
          questions: [{ id: 'legacy-question-1', key: 'cau-1', label: 'Câu hỏi cũ', required: true }],
        },
      },
    })

    const response = await rest(`/${SLUG}/${legacy.id}`, { token: tokenA })
    expect(response.status).toBe(200)
    const doc = (await response.json()) as WorksheetSubmission
    expect(doc.templateCode ?? null).toBeNull()
    expect(doc.worksheetSnapshot?.title).toBe('Worksheet cũ')
    expect(doc.worksheetSnapshot?.questions?.[0]).toMatchObject({ key: 'cau-1', label: 'Câu hỏi cũ', required: true })
    expect(doc.answers?.[0]?.value).toBe(`Câu trả lời cũ ${SECRET}`)

    // Giáo viên khác không đọc được bài cũ của A
    const other = await rest(`/${SLUG}/${legacy.id}`, { token: await loginToken(teacherB.email) })
    expect(other.status).not.toBe(200)

    const deleted = await rest(`/worksheets/${worksheet.id}`, { method: 'DELETE', token: await loginToken(admin.email) })
    expect(deleted.status).toBe(409)
  })
})

describe('normalizeTemplateValues', () => {
  it('chuẩn hóa NFC, bỏ khoảng trắng, chuỗi trống → null', () => {
    const decomposed = 'Tiếng Việt'
    const { errors, values } = normalizeTemplateValues(PHIEU_AM_MUC_TIEU, {
      ...amData(),
      tenTre: `  ${decomposed}  `,
      ghiChu: '   ',
    })

    expect(errors).toEqual([])
    expect(values.tenTre).toBe(decomposed.normalize('NFC'))
    expect(values.ghiChu).toBeNull()
  })

  it('trả lỗi theo đường dẫn ô, giữ chỉ số dòng gửi lên', () => {
    const { errors } = normalizeTemplateValues(PHIEU_THEO_DOI_CA, {
      tre: 'x',
      ngayCT: '2026-10-20',
      mucTieu: [{}, { phanTramDung: '-1' }],
    })

    expect(errors.map((error) => error.path)).toEqual(['values.mucTieu.1.phanTramDung'])
  })
})
