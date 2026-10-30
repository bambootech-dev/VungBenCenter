// Hằng số dùng chung giữa server (tạo key) và client (đồng bộ Header giữa các tab)

/** Key của trạng thái chưa đăng nhập */
export const GUEST_KEY = 'guest'

/** BroadcastChannel báo cho các tab khác khi trạng thái đăng nhập đổi */
export const AUTH_CHANNEL = 'vbc-auth'
