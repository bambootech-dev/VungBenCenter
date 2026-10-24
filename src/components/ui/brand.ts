// Lớp CSS thương hiệu dùng chung cho mọi trang, theo bảng màu xanh lá (--lesson-*) của trang /bai-hoc.
// Chữ trắng trên --lesson-primary đạt tương phản ≥ 4.5:1.

export const focusRing =
  'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lesson-primary-dark'

export const cardClass =
  'rounded-[1.375rem] border-2 border-lesson-border bg-lesson-surface shadow-[0_6px_20px_-12px_rgb(20_83_45/0.35)]'

export const primaryButtonClass = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-lesson-primary px-6 text-base font-extrabold text-white shadow-[0_8px_18px_-10px_rgb(21_128_61/0.9)] transition hover:bg-lesson-primary-dark disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`

export const secondaryButtonClass = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-lesson-border bg-lesson-surface px-6 text-base font-extrabold text-lesson-primary-dark transition hover:bg-lesson-primary-soft ${focusRing}`

export const pillClass =
  'inline-flex rounded-full bg-lesson-primary-soft px-4 py-1.5 text-sm font-bold text-lesson-primary-dark'

export const pageTitleClass =
  'text-3xl font-extrabold tracking-tight text-lesson-primary-dark md:text-4xl'

export const linkClass = `rounded font-extrabold text-lesson-primary underline underline-offset-4 hover:text-lesson-primary-dark ${focusRing}`

export const labelClass = 'mb-2 block text-base font-extrabold text-lesson-primary-dark'

export const inputClass =
  'block h-12 w-full rounded-2xl border-2 border-lesson-border bg-lesson-surface px-4 text-base font-semibold text-lesson-primary-dark transition placeholder:text-lesson-muted/70 focus:border-lesson-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-lesson-primary/25 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-400'

// Thông báo giữ màu theo ý nghĩa: lỗi đỏ, thành công xanh
export const errorAlertClass =
  'rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-base font-semibold text-red-900'

export const successAlertClass =
  'rounded-2xl border-2 border-lesson-primary/40 bg-lesson-primary-soft p-4 text-base font-bold text-lesson-primary-dark'
