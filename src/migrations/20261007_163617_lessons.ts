import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "lessons" (
    "id" serial PRIMARY KEY NOT NULL,
    "sound" varchar NOT NULL,
    "order" numeric NOT NULL,
    "thumbnail_id" integer,
    "steps_step1" jsonb,
    "steps_step2" jsonb,
    "steps_step3" jsonb,
    "steps_step4" jsonb,
    "steps_step5" jsonb,
    "steps_step6" jsonb,
    "steps_step7" jsonb,
    "steps_step8" jsonb,
    "steps_step9" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lessons_id" integer;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "lessons_order_idx" ON "lessons" USING btree ("order");
  CREATE INDEX "lessons_thumbnail_idx" ON "lessons" USING btree ("thumbnail_id");
  CREATE INDEX "lessons_updated_at_idx" ON "lessons" USING btree ("updated_at");
  CREATE INDEX "lessons_created_at_idx" ON "lessons" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_lessons_id_idx" ON "payload_locked_documents_rels" USING btree ("lessons_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lessons" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "lessons" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_lessons_fk";

  DROP INDEX IF EXISTS "payload_locked_documents_rels_lessons_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "lessons_id";`)
}
