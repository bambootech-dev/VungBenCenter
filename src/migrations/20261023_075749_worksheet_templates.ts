import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "worksheet_submissions_snapshot_questions" ALTER COLUMN "key" DROP NOT NULL;
  ALTER TABLE "worksheet_submissions_snapshot_questions" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "worksheet_submissions_answers" ALTER COLUMN "question_key" DROP NOT NULL;
  ALTER TABLE "worksheet_submissions_answers" ALTER COLUMN "value" DROP NOT NULL;
  ALTER TABLE "worksheet_submissions" ALTER COLUMN "worksheet_id" DROP NOT NULL;
  ALTER TABLE "worksheet_submissions" ALTER COLUMN "worksheet_snapshot_title" DROP NOT NULL;
  ALTER TABLE "worksheet_submissions" ADD COLUMN "title" varchar;
  ALTER TABLE "worksheet_submissions" ADD COLUMN "template_code" varchar;
  ALTER TABLE "worksheet_submissions" ADD COLUMN "template_version" numeric;
  ALTER TABLE "worksheet_submissions" ADD COLUMN "template_snapshot" jsonb;
  ALTER TABLE "worksheet_submissions" ADD COLUMN "data" jsonb;
  CREATE INDEX "worksheet_submissions_template_code_idx" ON "worksheet_submissions" USING btree ("template_code");`)

  // Bài nộp kiểu cũ: tên phiếu lấy từ bản chụp worksheet để danh sách /admin có tiêu đề (không đổi dữ liệu cũ)
  await db.execute(sql`
   UPDATE "worksheet_submissions" SET "title" = "worksheet_snapshot_title" WHERE "title" IS NULL;`)
}

// Lưu ý: down xóa dữ liệu phiếu theo mẫu (các cột mới) và chỉ chạy được khi không còn bài nộp theo mẫu
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "worksheet_submissions_template_code_idx";
  ALTER TABLE "worksheet_submissions_snapshot_questions" ALTER COLUMN "key" SET NOT NULL;
  ALTER TABLE "worksheet_submissions_snapshot_questions" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "worksheet_submissions_answers" ALTER COLUMN "question_key" SET NOT NULL;
  ALTER TABLE "worksheet_submissions_answers" ALTER COLUMN "value" SET NOT NULL;
  ALTER TABLE "worksheet_submissions" ALTER COLUMN "worksheet_id" SET NOT NULL;
  ALTER TABLE "worksheet_submissions" ALTER COLUMN "worksheet_snapshot_title" SET NOT NULL;
  ALTER TABLE "worksheet_submissions" DROP COLUMN IF EXISTS "title";
  ALTER TABLE "worksheet_submissions" DROP COLUMN IF EXISTS "template_code";
  ALTER TABLE "worksheet_submissions" DROP COLUMN IF EXISTS "template_version";
  ALTER TABLE "worksheet_submissions" DROP COLUMN IF EXISTS "template_snapshot";
  ALTER TABLE "worksheet_submissions" DROP COLUMN IF EXISTS "data";`)
}
