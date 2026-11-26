-- =====================================================================
-- ActiveBreak - Creación de tablas
-- PostgreSQL ejecuta automáticamente los archivos de esta carpeta
-- (docker-entrypoint-initdb.d) SOLO la primera vez que se crea la base,
-- es decir, cuando el volumen de datos está vacío.
--
-- El esquema coincide con las entidades de TypeORM
-- (src/infraestructure/entities). Si cambias una entidad, cambia también
-- este archivo.
-- =====================================================================

-- ---------- Tipos ENUM ----------
CREATE TYPE "public"."usuarios_rol_enum" AS ENUM ('usuario', 'admin');
CREATE TYPE "public"."pausas_activas_intensidad_enum" AS ENUM ('baja', 'media', 'alta');
CREATE TYPE "public"."recordatorio_dias_dia_semana_enum" AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');
CREATE TYPE "public"."metas_estado_enum" AS ENUM ('en_curso', 'cumplida', 'vencida');

-- ---------- Organizaciones ----------
CREATE TABLE "organizaciones" (
    "id"         SERIAL                 NOT NULL,
    "nombre"     character varying(120) NOT NULL,
    "nit"        character varying(15)  NOT NULL,
    "sector"     character varying(80),
    "activo"     boolean                NOT NULL DEFAULT true,
    "created_at" TIMESTAMP              NOT NULL DEFAULT now(),
    CONSTRAINT "PK_c4882b65ea18864261e7550c0ca" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_60d3a9c1bf78ef44c419d8b7d6b" UNIQUE ("nit")
);

-- ---------- Usuarios ----------
CREATE TABLE "usuarios" (
    "id"              SERIAL                       NOT NULL,
    "nombre"          character varying(150)       NOT NULL,
    "correo"          character varying(150)       NOT NULL,
    "contrasena_hash" character varying(255)       NOT NULL,
    "rol"             "public"."usuarios_rol_enum" NOT NULL,
    "nivel_salud"     character varying(20)        NOT NULL DEFAULT 'medio',
    "activo"          boolean                      NOT NULL DEFAULT true,
    "organizacion_id" integer,
    "created_at"      TIMESTAMP                    NOT NULL DEFAULT now(),
    "updated_at"      TIMESTAMP                    NOT NULL DEFAULT now(),
    CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_63665765c1a778a770c9bd585d3" UNIQUE ("correo")
);

-- ---------- Categorías de pausa ----------
CREATE TABLE "categorias_pausa" (
    "id"          SERIAL                NOT NULL,
    "nombre"      character varying(60) NOT NULL,
    "descripcion" text,
    "activo"      boolean               NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP             NOT NULL DEFAULT now(),
    CONSTRAINT "PK_7a0f521687d0387763cbaef4a13" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_ca6cdeb13413c2dde1c00d9dad5" UNIQUE ("nombre")
);

-- ---------- Pausas activas ----------
CREATE TABLE "pausas_activas" (
    "id"               SERIAL                                    NOT NULL,
    "nombre"           character varying(100)                    NOT NULL,
    "descripcion"      text,
    "duracion_minutos" integer                                   NOT NULL,
    "intensidad"       "public"."pausas_activas_intensidad_enum" NOT NULL,
    "categoria_id"     integer,
    "activo"           boolean                                   NOT NULL DEFAULT true,
    "created_at"       TIMESTAMP                                 NOT NULL DEFAULT now(),
    CONSTRAINT "PK_1ebe5d2647d9d099d558640afa7" PRIMARY KEY ("id")
);

-- ---------- Recordatorios ----------
CREATE TABLE "recordatorios" (
    "id"                 SERIAL    NOT NULL,
    "frecuencia_minutos" integer   NOT NULL,
    "hora_inicio"        TIME      NOT NULL,
    "hora_fin"           TIME      NOT NULL,
    "activo"             boolean   NOT NULL DEFAULT true,
    "created_at"         TIMESTAMP NOT NULL DEFAULT now(),
    "usuario_id"         integer,
    CONSTRAINT "PK_4688fe2e62f3dba3c366ab2a914" PRIMARY KEY ("id")
);

-- ---------- Días de recordatorio ----------
CREATE TABLE "recordatorio_dias" (
    "id"              SERIAL                                       NOT NULL,
    "dia_semana"      "public"."recordatorio_dias_dia_semana_enum" NOT NULL,
    "recordatorio_id" integer,
    CONSTRAINT "PK_10bea27de07dcc48c6771d2c135" PRIMARY KEY ("id")
);

-- ---------- Historial de actividad ----------
CREATE TABLE "historial_actividad" (
    "id"            SERIAL    NOT NULL,
    "fecha_hora"    TIMESTAMP NOT NULL DEFAULT now(),
    "completado"    boolean   NOT NULL DEFAULT true,
    "duracion_real" integer   NOT NULL DEFAULT '0',
    "usuario_id"    integer,
    "pausa_id"      integer,
    CONSTRAINT "PK_15105d65ef251620f37e8e99113" PRIMARY KEY ("id")
);

-- ---------- Metas semanales ----------
CREATE TABLE "metas" (
    "id"              SERIAL                       NOT NULL,
    "usuario_id"      integer                      NOT NULL,
    "pausas_objetivo" integer                      NOT NULL,
    "fecha_inicio"    date                         NOT NULL,
    "fecha_fin"       date                         NOT NULL,
    "estado"          "public"."metas_estado_enum" NOT NULL DEFAULT 'en_curso',
    "activo"          boolean                      NOT NULL DEFAULT true,
    "created_at"      TIMESTAMP                    NOT NULL DEFAULT now(),
    CONSTRAINT "PK_3a375a83dfcb41b974082b3b1ef" PRIMARY KEY ("id")
);

-- ---------- Claves foráneas ----------
ALTER TABLE "usuarios" ADD CONSTRAINT "FK_becad4f4783340a3e850cc206ab"
    FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "pausas_activas" ADD CONSTRAINT "FK_0f13a9e5be2abe4a5fbf467fff5"
    FOREIGN KEY ("categoria_id") REFERENCES "categorias_pausa"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "recordatorios" ADD CONSTRAINT "FK_1565473316752d3be1e85af01dd"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "recordatorio_dias" ADD CONSTRAINT "FK_033833eff4c498aed84178bf626"
    FOREIGN KEY ("recordatorio_id") REFERENCES "recordatorios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "historial_actividad" ADD CONSTRAINT "FK_c20eb9a9359e5d4a3cfb55c6985"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "historial_actividad" ADD CONSTRAINT "FK_02d5b9efff32f2c82bf7e8e8d6b"
    FOREIGN KEY ("pausa_id") REFERENCES "pausas_activas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "metas" ADD CONSTRAINT "FK_69b250db7f416272cc91af18671"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
