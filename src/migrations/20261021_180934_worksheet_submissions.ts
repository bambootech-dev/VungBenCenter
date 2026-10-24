import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "worksheet_submissions_snapshot_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"required" boolean DEFAULT false
  );
  
  CREATE TABLE "worksheet_submissions_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question_key" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "worksheet_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"worksheet_id" integer NOT NULL,
  	"teacher_id" integer NOT NULL,
  	"submitted_at" timestamp(3) with time zone NOT NULL,
  	"worksheet_snapshot_title" varchar NOT NULL,
  	"worksheet_snapshot_instructions" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "worksheet_submissions_id" integer;
  ALTER TABLE "worksheet_submissions_snapshot_questions" ADD CONSTRAINT "worksheet_submissions_snapshot_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."worksheet_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "worksheet_submissions_answers" ADD CONSTRAINT "worksheet_submissions_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."worksheet_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "worksheet_submissions" ADD CONSTRAINT "worksheet_submissions_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "worksheet_submissions" ADD CONSTRAINT "worksheet_submissions_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "worksheet_submissions_snapshot_questions_order_idx" ON "worksheet_submissions_snapshot_questions" USING btree ("_order");
  CREATE INDEX "worksheet_submissions_snapshot_questions_parent_id_idx" ON "worksheet_submissions_snapshot_questions" USING btree ("_parent_id");
  CREATE INDEX "worksheet_submissions_answers_order_idx" ON "worksheet_submissions_answers" USING btree ("_order");
  CREATE INDEX "worksheet_submissions_answers_parent_id_idx" ON "worksheet_submissions_answers" USING btree ("_parent_id");
  CREATE INDEX "worksheet_submissions_worksheet_idx" ON "worksheet_submissions" USING btree ("worksheet_id");
  CREATE INDEX "worksheet_submissions_teacher_idx" ON "worksheet_submissions" USING btree ("teacher_id");
  CREATE INDEX "worksheet_submissions_submitted_at_idx" ON "worksheet_submissions" USING btree ("submitted_at");
  CREATE INDEX "worksheet_submissions_updated_at_idx" ON "worksheet_submissions" USING btree ("updated_at");
  CREATE INDEX "worksheet_submissions_created_at_idx" ON "worksheet_submissions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_worksheet_submissions_fk" FOREIGN KEY ("worksheet_submissions_id") REFERENCES "public"."worksheet_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_worksheet_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("worksheet_submissions_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "worksheet_submissions_snapshot_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "worksheet_submissions_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "worksheet_submissions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "worksheet_submissions_snapshot_questions" CASCADE;
  DROP TABLE "worksheet_submissions_answers" CASCADE;
  DROP TABLE "worksheet_submissions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_worksheet_submissions_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_worksheet_submissions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "worksheet_submissions_id";`)
}
