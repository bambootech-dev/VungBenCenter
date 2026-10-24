import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "worksheets_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"required" boolean DEFAULT false
  );
  
  CREATE TABLE "worksheets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"instructions" varchar,
  	"lesson_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "worksheets_id" integer;
  ALTER TABLE "worksheets_questions" ADD CONSTRAINT "worksheets_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "worksheets_questions_order_idx" ON "worksheets_questions" USING btree ("_order");
  CREATE INDEX "worksheets_questions_parent_id_idx" ON "worksheets_questions" USING btree ("_parent_id");
  CREATE INDEX "worksheets_lesson_idx" ON "worksheets" USING btree ("lesson_id");
  CREATE INDEX "worksheets_updated_at_idx" ON "worksheets" USING btree ("updated_at");
  CREATE INDEX "worksheets_created_at_idx" ON "worksheets" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_worksheets_fk" FOREIGN KEY ("worksheets_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_worksheets_id_idx" ON "payload_locked_documents_rels" USING btree ("worksheets_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "worksheets_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "worksheets" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "worksheets_questions" CASCADE;
  DROP TABLE "worksheets" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_worksheets_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_worksheets_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "worksheets_id";`)
}
