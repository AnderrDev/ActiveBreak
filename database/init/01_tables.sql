-- =====================================================================
-- ActiveBreak - Tables
-- PostgreSQL runs the files of this folder (docker-entrypoint-initdb.d)
-- ONLY the first time the database is created (empty data volume).
--
-- The schema matches the TypeORM entities (src/infrastructure/entities).
-- When an entity changes, update this file too.
-- =====================================================================

-- ---------- ENUM types ----------
CREATE TYPE "public"."users_role_enum" AS ENUM ('user', 'admin');
CREATE TYPE "public"."users_health_level_enum" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "public"."active_breaks_intensity_enum" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "public"."reminder_days_weekday_enum" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
CREATE TYPE "public"."goals_status_enum" AS ENUM ('in_progress', 'completed', 'expired');

-- ---------- Organizations ----------
CREATE TABLE "organizations" (
    "id"         SERIAL                 NOT NULL,
    "name"       character varying(120) NOT NULL,
    "tax_id"     character varying(15)  NOT NULL,
    "sector"     character varying(80),
    "active"     boolean                NOT NULL DEFAULT true,
    "created_at" TIMESTAMP              NOT NULL DEFAULT now(),
    CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_55913d0cdeb17729c1b132a3b7c" UNIQUE ("tax_id")
);

-- ---------- Users ----------
CREATE TABLE "users" (
    "id"              SERIAL                             NOT NULL,
    "name"            character varying(150)             NOT NULL,
    "email"           character varying(150)             NOT NULL,
    "password_hash"   character varying(255)             NOT NULL,
    "role"            "public"."users_role_enum"         NOT NULL DEFAULT 'user',
    "health_level"    "public"."users_health_level_enum" NOT NULL DEFAULT 'medium',
    "active"          boolean                            NOT NULL DEFAULT true,
    "organization_id" integer,
    "created_at"      TIMESTAMP                          NOT NULL DEFAULT now(),
    "updated_at"      TIMESTAMP                          NOT NULL DEFAULT now(),
    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
);

-- ---------- Break categories ----------
CREATE TABLE "break_categories" (
    "id"          SERIAL                NOT NULL,
    "name"        character varying(60) NOT NULL,
    "description" text,
    "active"      boolean               NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP             NOT NULL DEFAULT now(),
    CONSTRAINT "PK_476c4eda03de5a2bfa58c9d910c" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_d1a05b4d34de8d4afaa227bcedc" UNIQUE ("name")
);

-- ---------- Active breaks ----------
CREATE TABLE "active_breaks" (
    "id"               SERIAL                                  NOT NULL,
    "name"             character varying(100)                  NOT NULL,
    "description"      text,
    "duration_minutes" integer                                 NOT NULL,
    "intensity"        "public"."active_breaks_intensity_enum" NOT NULL,
    "category_id"      integer                                 NOT NULL,
    "active"           boolean                                 NOT NULL DEFAULT true,
    "created_at"       TIMESTAMP                               NOT NULL DEFAULT now(),
    CONSTRAINT "PK_e1930afe6dbde15f8001b51a7c4" PRIMARY KEY ("id")
);

-- ---------- Reminders ----------
CREATE TABLE "reminders" (
    "id"                SERIAL    NOT NULL,
    "user_id"           integer   NOT NULL,
    "frequency_minutes" integer   NOT NULL,
    "start_time"        TIME      NOT NULL,
    "end_time"          TIME      NOT NULL,
    "active"            boolean   NOT NULL DEFAULT true,
    "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_38715fec7f634b72c6cf7ea4893" PRIMARY KEY ("id")
);

-- ---------- Reminder days (a reminder cannot repeat a weekday) ----------
CREATE TABLE "reminder_days" (
    "id"          SERIAL                                NOT NULL,
    "reminder_id" integer                               NOT NULL,
    "weekday"     "public"."reminder_days_weekday_enum" NOT NULL,
    CONSTRAINT "PK_536b608357f6a3fa334a488577e" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_reminder_days_reminder_weekday" UNIQUE ("reminder_id", "weekday")
);

-- ---------- Activity history (insert-only log) ----------
CREATE TABLE "activity_history" (
    "id"                      SERIAL    NOT NULL,
    "user_id"                 integer   NOT NULL,
    "break_id"                integer   NOT NULL,
    "performed_at"            TIMESTAMP NOT NULL DEFAULT now(),
    "completed"               boolean   NOT NULL DEFAULT true,
    "actual_duration_minutes" integer   NOT NULL DEFAULT '0',
    CONSTRAINT "PK_70bf398f6c9e180f27229b13ab7" PRIMARY KEY ("id")
);

-- ---------- Weekly goals ----------
CREATE TABLE "goals" (
    "id"            SERIAL                       NOT NULL,
    "user_id"       integer                      NOT NULL,
    "target_breaks" integer                      NOT NULL,
    "start_date"    date                         NOT NULL,
    "end_date"      date                         NOT NULL,
    "status"        "public"."goals_status_enum" NOT NULL DEFAULT 'in_progress',
    "active"        boolean                      NOT NULL DEFAULT true,
    "created_at"    TIMESTAMP                    NOT NULL DEFAULT now(),
    CONSTRAINT "PK_26e17b251afab35580dff769223" PRIMARY KEY ("id")
);

-- ---------- Foreign keys (ON DELETE RESTRICT: no orphan records) ----------
ALTER TABLE "users" ADD CONSTRAINT "FK_21a659804ed7bf61eb91688dea7"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "active_breaks" ADD CONSTRAINT "FK_c738ac4b969b07d279810d5b0f3"
    FOREIGN KEY ("category_id") REFERENCES "break_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "reminders" ADD CONSTRAINT "FK_586e0b8e419125be507701cee2a"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "reminder_days" ADD CONSTRAINT "FK_cec29c0045cab298a457c39924c"
    FOREIGN KEY ("reminder_id") REFERENCES "reminders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "activity_history" ADD CONSTRAINT "FK_22ddbf06477c3f758fa593982d0"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "activity_history" ADD CONSTRAINT "FK_7367de086e0778f3b535a5fff15"
    FOREIGN KEY ("break_id") REFERENCES "active_breaks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "goals" ADD CONSTRAINT "FK_88b78010581f2d293699d064441"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
