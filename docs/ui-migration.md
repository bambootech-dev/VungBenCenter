# UI migration: Tailwind/shadcn → Bootstrap 5.3 (NG Science style)

Status: **migrated** (branch `feat/bootstrap-ui`). Sections 1–3 are the original audit; sections 4–7 describe what was built.

## 1. Project map

| Area | Today |
| --- | --- |
| Framework | Next.js 16.3 (App Router, Turbopack) + Payload CMS 3.90 (Postgres). React 19. |
| Route groups | `src/app/(frontend)` = public site (UI to migrate). `src/app/(payload)` = Payload admin (has its own SCSS. **Out of scope, must not load Bootstrap**). |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss` (`postcss.config.js`), `tw-animate-css`, a shadcn token layer + `--lesson-*` green palette in `src/app/(frontend)/globals.css` (323 lines). |
| Class helpers | `cn()` = `clsx` + `tailwind-merge` (`src/utilities/ui.ts`). Shared Tailwind class strings in `src/components/ui/brand.ts` (re-exported by `giaovien/_components/teacherUi.ts`). |
| UI deps | shadcn/ui (`components.json`), `@radix-ui/react-{slot,checkbox,label,select}`, `class-variance-authority`, `lucide-react` icons, `geist` font (loaded but overridden), Nunito via `next/font/google`. |
| Sass | `sass` is already in `node_modules` (pulled in by Payload); `next.config.ts` already has `sassOptions`. A Sass entry is therefore the natural pipeline. |
| JS | No jQuery and no Bootstrap. All interactive bits are React state. |
| Tests | Vitest integration tests (`tests/int`, no UI selectors). Playwright e2e (`tests/e2e`, 78 role/test-id selectors, **no CSS-class selectors**), so markup can change freely as long as roles, labels and `data-testid`s stay. |
| Language | All UI copy is Vietnamese, so the font **must** ship the `vietnamese` subset. |

## 2. Screen & component inventory

### Layout / shared

| File | What it is | Becomes |
| --- | --- | --- |
| `(frontend)/layout.tsx` | Root html/body, fonts, header/footer | Loads `styles/main.scss`, Nunito via `next/font`, `data-bs-theme="light"`, skip-to-content link, `<main id="main">` |
| `(frontend)/globals.css` | Tailwind + tokens + `.lesson-prose` | **Deleted**, replaced by `styles/_variables.scss`, `styles/main.scss`, `styles/_custom.scss` (prose, step strip only) |
| `components/SiteHeader` | Logo + 3 links | Sticky `navbar navbar-expand-lg`, links left, right-aligned `Đăng ký` (outline) + `Đăng nhập` (solid primary); `offcanvas` on mobile |
| `components/SiteFooter` | One-row footer | Multi-column `row`: brand + contact, "Học tập" links, "Tài khoản" links; light bg, top border, Bootstrap Icons |
| `components/Logo` | "VB" badge + name | Same, styled with `bg-primary rounded-3 fw-bold` |
| `components/ui/brand.ts` | Tailwind class strings (button, card, input, alerts) | **Deleted**; replaced by Bootstrap classes (`btn btn-primary`, `card`, `form-control`, `alert`) |
| `components/ui/button.tsx` | shadcn Button (cva + Radix Slot) | **Deleted**; plain `<Link className="btn …">` |
| `components/ui/{card,input,textarea,label,select,checkbox}.tsx` | shadcn primitives | **Dead code today (imported nowhere)**; to delete along with Radix deps (needs your OK) |
| `utilities/ui.ts` `cn()` | clsx + tailwind-merge | Keep `cn` as plain `clsx` (drop `tailwind-merge`) |
| `components.json`, `postcss.config.js` | shadcn / Tailwind config | Deleted |

### New shared components (to extract)

| Component | Replaces repeated markup in |
| --- | --- |
| `PageHeader` (eyebrow `badge`, `h1`, lead, optional actions slot) | every page (pill + `pageTitleClass` pattern, 12×) |
| `BackLink` (`bi-chevron-left` + link) | lesson detail, worksheet picker, submission detail |
| `EmptyState` (already exists, restyle) | teacher pages, lesson search |
| `RoleCard` | home + `/login` role chooser (duplicated content) |
| `AuthCard` (centered `card` shell for forms) | `RoleLogin`, `RoleRegister` |

### Pages

| Route | File | Becomes |
| --- | --- | --- |
| `/` | `page.tsx` | Two-column hero (headline, lead, large CTA "Đăng nhập" + "Tạo tài khoản", decorative icon illustration) + `row row-cols-md-2 g-4` role cards |
| `/login` | `login/page.tsx` | `PageHeader` + 2 `RoleCard`s, admin link |
| `/login/giaovien`, `/login/hocsinh` | `components/RoleLogin` | `AuthCard` + `form-floating` inputs, `alert alert-danger`, `spinner-border` in submit button. Same fetch/redirect logic |
| `/register/giaovien`, `/register/hocsinh` | `components/RoleRegister` | Same as login + `alert alert-success`. Same server action |
| `/bai-hoc` | `bai-hoc/page.tsx`, `LessonList`, `LessonThumbnail` | `input-group` search (`bi-search`), `row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4` of `card h-100` with `card-img-top` (`object-fit-cover`, `ratio ratio-16x10`) + `stretched-link` |
| `/bai-hoc/[id]` | `bai-hoc/[id]/page.tsx` | Step strip as `nav nav-pills` (the NG "Kindergarten → Year 6" strip treatment), `card` for step body, `badge text-bg-accent` "Bước x / 9", prev/next `btn btn-lg`, `progress` bar for step position |
| `/hocsinh/dashboard` | `hocsinh/dashboard/page.tsx` | `PageHeader` + welcome `card`, quick-link card to `/bai-hoc` |
| `/giaovien/*` layout | `giaovien/layout.tsx`, `TeacherNav` | Secondary `nav nav-pills` bar under the navbar (`bi-grid`, `bi-clipboard`, `bi-file-earmark-check`) |
| `/giaovien/dashboard` | `giaovien/dashboard/page.tsx` | `PageHeader` + welcome card + shortcut cards |
| `/giaovien/phieu` | `phieu/page.tsx` | `PageHeader` with "Tạo phiếu" action, recent submissions as `list-group list-group-flush` inside a `card` |
| `/giaovien/phieu/moi` | `phieu/moi/page.tsx` | `row-cols-md-2 g-4` template cards |
| `/giaovien/phieu/moi/[code]` | `page.tsx`, `TemplateForm.tsx` (459 lines) | Section `card`s, `form-control`/`form-select`, `is-invalid` + `invalid-feedback`, editable tables in `.table-responsive > table table-bordered table-sm align-middle`, `btn-outline-danger btn-sm` row delete, `alert alert-danger` summary. Validation logic untouched |
| `/giaovien/bai-da-nop` | `bai-da-nop/page.tsx`, `Pagination` | `list-group` of submissions; Bootstrap `pagination` component (prev / "Trang x / y" / next) |
| `/giaovien/bai-da-nop/[id]` | `page.tsx`, `TemplateValuesView`, `TableHeader` | `alert alert-success` (just submitted), meta as inline `dl`, section cards, `table table-hover table-bordered` in `.table-responsive` |
| loading | `giaovien/loading.tsx` | Bootstrap `placeholder-glow` skeleton cards |
| error | `giaovien/error.tsx` | `alert alert-danger` card + retry button |
| 404 | `not-found.tsx` | Centered card, `display-1` "404", large CTA |
| (shared) | `components/WorksheetTemplate/TemplateChart.tsx` | SVG chart, **also rendered inside Payload admin**. Keeps hard-coded hex (can't rely on Bootstrap vars in admin), only the colours change |

Out of scope: `src/app/(payload)/**`, `collections/WorksheetSubmissions/SubmissionPreview.tsx` & `RowLabels.tsx` (admin UI).

## 3. NG Science: measured design tokens

Source: live HTML/CSS fetched 2026-10-26 (`ngscience.com` home, `/year-3/`; `/pricing/` served the home page to an anonymous client; sign-in is a modal in the home HTML). Stack: WordPress + GeneratePress + Elementor.

| Token | Live value | Where |
| --- | --- | --- |
| Font (all text) | **Quicksand** (Google Fonts, 300–700); Elementor typography: headings 600, body 400, accent 500 | Elementor kit `post-6.css`, `body{font-family:Quicksand}` |
| Body bg / text | `--base-2: #F7F8F9` / `--contrast: #222222` | GeneratePress inline vars |
| Muted text | `--contrast-2: #575760`; light border `--contrast-3: #B2B2BE`, `#CCC` | GeneratePress |
| Surfaces | `--base-3: #FFFFFF` (header, cards), `--base: #F0F0F0` | GeneratePress |
| Link / nav hover | `--accent: #1E73BE` | GeneratePress |
| Primary buttons | `#007BFF` → hover `#0056B3` (subscribe, change plan, forms) | child `style.css` |
| Brand palette (Elementor globals, used for grade tiles/sections) | blue `#3396F3`, purple `#3B196B`, periwinkle `#7E91F5`, green `#79AB31` / `#04B551` (sign-in submit), amber `#F9A520`, orange `#FE8018`, red `#C90620`, magenta `#B30059`, pink `#C54E7C` | `post-6.css` |
| Radii | Mostly **4–5px** (buttons, inputs), 8–10px (pricing buttons, panels), 20px occasional, pill only on WP block buttons | `style.css` tally |
| Shadows | `0 0 10px rgba(0,0,0,.1)`, `0 4px 6–8px rgba(0,0,0,.1)` (soft, neutral) | `style.css` |
| Type scale | body 16px, small UI 14px, buttons 18–20px | `style.css` |
| Container | 1140px max (Elementor boxed) | `post-6.css` |
| Header | White, logo left, menu, then "Register" + "Sign In" buttons right; grade strip (Kindergarten, Year 1 … Year 6) below | home HTML |
| Footer | Course menu links (`#AAAAAA` 14px) in a light footer | home HTML |

### Contrast check (WCAG AA = 4.5:1 for body text)

| Colour | on white | dark text `#222` on it | Verdict |
| --- | --- | --- | --- |
| `#3396F3` brand blue | 3.09 | 5.15 | ✗ with white text, so decorative/large only |
| `#007BFF` button blue | 3.98 | 4.00 | ✗ for white button text |
| `#1E73BE` link blue | **4.94** | – | ✓ usable as `$primary` |
| `#79AB31` / `#04B551` greens | 2.7 | 5.8 | ✗ with white text |
| `#2E7D32` darker green | **5.13** | – | ✓ `$secondary` |
| `#F9A520` amber | 2.01 | **7.90** | ✓ only with dark text |
| `#FE8018` orange | 2.53 | 6.30 | dark text only |
| `#575760` muted | **7.15** | – | ✓ (better than the brief's `#6B7280` = 4.83) |

## 4. Decisions (2026-10-26)

| Question | Decision |
| --- | --- |
| Main colour | **Keep green** (`#15803d`). NG blue becomes `$secondary`, NG amber the accent |
| Corner radius | **Match live site**: 5px buttons/inputs, 10px cards, 8px large buttons |
| Font | **Keep Nunito** (`next/font`, `latin` + `vietnamese`, 500–800) |
| Deletions | Approved: Tailwind, shadcn, Radix, cva, lucide, geist, autoprefixer removed |

## 5. Final tokens (`src/app/(frontend)/styles/_variables.scss`)

| Bootstrap var | Value | Contrast / note |
| --- | --- | --- |
| `$primary` | `#15803d` | white text 5.0:1 |
| `$secondary` | `#1e73be` (NG link blue) | white text 4.9:1 |
| `$accent` (new theme colour) | `#f9a520` (NG amber) | auto dark text `#222`, 7.9:1 → `.btn-accent`, `.text-bg-accent`, `.bg-accent-subtle`, `.text-accent-emphasis` |
| `$info` | `#3396f3` (NG brand blue) | dark text only |
| `$warning` / `$danger` / `$success` | `#fe8018` / `#c90620` / `#2e7d32` | |
| `$body-bg` / `$body-color` | `#f7f8f9` / `#222222` | live NG values |
| `$body-secondary-color` | `#575760` | 7.2:1 on white |
| `$headings-color` | `#14532d` | brand dark green |
| `$input-border-color` | `#8a8a93` | ≥ 3:1 vs white (WCAG 1.4.11) |
| `$font-family-sans-serif` | `var(--font-nunito)`, system stack | body 500, headings 800, line-height 1.6 |
| `$border-radius` / `-sm` / `-lg` / `-xl` | 5px / 4px / 10px / 20px | |
| `$box-shadow-sm` / `$box-shadow` / `-lg` | NG-style neutral rgba(0,0,0,.08–.12) | |
| `$container-max-widths` | xl 1140px, xxl 1200px | |
| `$enable-dark-mode` | on; `<html data-bs-theme="light">` | no toggle yet |
| `$enable-validation-icons` | off | worksheet table cells are too narrow for icons |

Only the Bootstrap Sass partials actually used are imported (`main.scss`); JS is limited to `bootstrap/js/dist/offcanvas` (mobile menu), loaded on the client. Icons: `bootstrap-icons` font CSS imported once in the layout.

Custom CSS (`_custom.scss`, ~200 lines) covers only what Bootstrap lacks: `.card-hover` (link cards), `.icon-circle`, `.step-nav` round step pills, `.w-step-1…9` progress widths, `.lesson-min-h`, `.text-pre-line`, `.cell-w-*` table column widths, `.lesson-thumb-placeholder`, `.lesson-prose` (rich text), reduced-motion overrides.

## 6. Component mapping (as built)

| Old | New |
| --- | --- |
| `globals.css`, `brand.ts`, `ui/*`, `cn()` | `styles/*.scss` + Bootstrap classes, `clsx` |
| Header | sticky `navbar-expand-lg` + `offcanvas-end`, `aria-current` on active link, Đăng ký (outline) + Đăng nhập (solid) |
| Footer | 3-column `row`: brand blurb, "Học tập", "Tài khoản" nav lists |
| Role cards (home, /login) | `RoleCard` (`card h-100`, `icon-circle`, `d-grid` buttons) |
| Login / register | `AuthCard` + `form-floating`, `alert-danger/success`, `spinner-border` |
| Page titles | `PageHeader` (badge eyebrow, single `h1`, lead, actions) |
| Back links | `BackLink` (`icon-link` + `bi-chevron-left`) |
| Empty states | `EmptyState` (moved to `src/components`, shared by lessons + teacher) |
| Lesson grid | `row-cols-1/sm-2/lg-3 g-4`, link `card` + `ratio-16x10` + `object-fit-cover` |
| Lesson search | `input-group input-group-lg` + `bi-search` |
| Lesson steps | `nav nav-pills step-nav` (5-col grid on mobile), `badge text-bg-accent`, `progress`, `card-footer` prev/next |
| Teacher nav | `nav nav-pills` sub-bar with icons |
| Recent / submitted lists | `list-group` |
| Pagination | Bootstrap `pagination` (prev · "Trang x / y" · next) |
| Worksheet form | section `card`s, `form-control`/`form-select`, `is-invalid` + `invalid-feedback`, `table table-bordered table-sm` in `.table-responsive` |
| Read-only worksheet | `card` + `dl.row`, `table table-hover` |
| Loading / error | `placeholder-glow` cards / danger card with retry |

## 7. Deliberate UX changes

- **Skip link** ("Bỏ qua, đến nội dung chính") and a single `<main id="main">` in the root layout; pages no longer render their own `<main>`.
- **Header** gains a "Đăng ký" button → `/register/hocsinh` (most common sign-up). Teacher sign-up stays on `/login` and in the footer.
- **Home hero** is two-column; the right column lists the platform's real features as icon tiles (there is no classroom photography in the project).
- **Dashboards** now show shortcut cards (teacher → Phiếu, Bài đã nộp; student → Bài học) under the greeting.
- **Lesson page** adds a progress bar next to "Bước x / 9" (decorative, `aria-hidden`; the heading already states the position).
- **Home carousel** (`HeroCarousel`, NG Science–style rotating banner): 3 slides with CC0 stock photos in `public/images/carousel/` (1920px JPEG, EXIF stripped; credits below), caption + accent CTA, prev/next, indicators, a pause/play button (WCAG 2.2.2) and no autoplay under `prefers-reduced-motion`. Uses only `bootstrap/js/dist/carousel`.
- Not built (no content/feature behind them): pricing / billing toggle, FAQ accordion, toasts, social icons, contact block.

## 8. Follow-ups

- Replace the stock carousel photos with the centre's own classroom photos (with parental consent) (same file names, or update `slides` in `src/app/(frontend)/page.tsx`); keep the subject away from the left caption box and the centre crop on mobile.
- Footer contact block and social links: need real address/phone/URLs.
- Dark-mode toggle: tokens support it, no UI switch yet.
- Payload admin theme (`src/app/(payload)/custom.scss`) still references the old Tailwind green scale in comments; colours still match `$primary`.
- The Bootstrap Icons font ships all ~2000 glyphs (~130 KB woff2); swap to inline SVG sprites if that matters.
- `package-lock.json` already had uncommitted changes before this migration; they are included in the dependency commit.
## 9. Original migration plan

1. **Tokens + shell** (commit 1): add `bootstrap@5.3.x`, `bootstrap-icons`, `sass` (explicit devDep); create `src/app/(frontend)/styles/{_variables,_custom,main}.scss`; Quicksand via `next/font`; rebuild `layout`, `SiteHeader` (offcanvas: only `bootstrap/js/dist/offcanvas` imported in a tiny client component), `SiteFooter`, skip link, `PageHeader`/`BackLink`. Tailwind and Bootstrap would briefly coexist on this commit only.
2. **Public + auth pages** (commit 2): home, `/login`, role login/register, 404.
3. **Lessons** (commit 3): `/bai-hoc`, `/bai-hoc/[id]`, `.lesson-prose` → `_custom.scss`.
4. **Teacher area** (commit 4): teacher nav, dashboards, worksheet list/picker/form, submissions, pagination, loading/error.
5. **Remove Tailwind/shadcn** (commit 5): delete `globals.css`, `brand.ts`, `ui/*`, `components.json`, `postcss.config.js`; uninstall `tailwindcss`, `@tailwindcss/postcss`, `tw-animate-css`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/*`, `lucide-react`, `geist`, `autoprefixer`; grep confirms no Tailwind classes remain.
6. **Verify + docs** (commit 6): `npm run lint`, `tsc`, `test:int`, `test:e2e`; Playwright screenshots at 360/768/1024/1440 of every page (logged in as teacher and student via the test seed helpers); update this doc with final tokens, UX changes and follow-ups.

Not building (no data or feature behind it, so I won't invent content): carousel, pricing table / monthly-yearly toggle, FAQ accordion, toasts. Auth stays as **dedicated pages** (routes unchanged); the header buttons link to them rather than opening modals.

## Image credits (carousel)

All three are **CC0** on Wikimedia Commons (no attribution required; listed for traceability). CC0 covers copyright only, not model releases: they show real, identifiable children, so treat them as temporary.

| File | Source | Author |
| --- | --- | --- |
| `slide-1.jpg` | [Geneaology Camp (28419774070) - blue pencil.jpg](https://commons.wikimedia.org/wiki/File:Geneaology_Camp_(28419774070)_-_blue_pencil.jpg) | Brogan Jackson / U.S. National Archives (Flickr) |
| `slide-2.jpg` | [Childrenschoolinsomalia.jpg](https://commons.wikimedia.org/wiki/File:Childrenschoolinsomalia.jpg) | AMISOM Public Information (Flickr) |
| `slide-3.jpg` | [Room-education-classroom-children-library-students-1237486.jpg](https://commons.wikimedia.org/wiki/File:Room-education-classroom-children-library-students-1237486.jpg) | pxhere.com/photo/1237486 |
