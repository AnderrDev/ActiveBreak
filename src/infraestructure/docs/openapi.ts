/*
Documentación OpenAPI (Swagger) de la API de ActiveBreak.
Se publica en /api/docs (interfaz) y /api/docs.json (especificación).

Organización: las etiquetas están numeradas en el orden recomendado para probar
(primero autenticación, luego catálogos y al final lo que depende de ellos).
Si agregas o cambias un endpoint, actualiza también este archivo.
*/

// ---------- Ayudas para no repetir ----------
const ref = (nombre: string) => ({ $ref: `#/components/schemas/${nombre}` });
const respuestaRef = (nombre: string) => ({ $ref: `#/components/responses/${nombre}` });

const json = (schema: object, example?: unknown) => ({
    content: { "application/json": { schema, ...(example !== undefined && { example }) } }
});

const cuerpo = (nombreSchema: string, example: unknown) => ({
    required: true,
    ...json(ref(nombreSchema), example)
});

const idPath = (nombre = "id", descripcion = "Identificador (entero positivo)") => ({
    name: nombre,
    in: "path",
    required: true,
    description: descripcion,
    schema: { type: "integer", minimum: 1, example: 1 }
});

// Formato estándar de éxito: { success: true, message, data }
const envoltorio = (data: object) => ({
    type: "object",
    properties: {
        success: { type: "boolean", example: true },
        message: { type: "string" },
        data
    }
});
const ok = (descripcion: string, schema: object) => ({ description: descripcion, ...json(envoltorio(schema)) });
const lista = (nombreSchema: string) => ({ type: "array", items: ref(nombreSchema) });

// Respuestas de error comunes según el tipo de endpoint
const errores = (...codigos: Array<"400" | "401" | "403" | "404" | "409" | "429">) => {
    const nombres = { "400": "Validacion", "401": "NoAutenticado", "403": "SinPermiso", "404": "NoEncontrado", "409": "Conflicto", "429": "DemasiadasPeticiones" };
    return Object.fromEntries(codigos.map(c => [c, respuestaRef(nombres[c])]));
};

const sinDatos = { nullable: true, example: null };
// POST devuelve el registro creado; PUT, el registro actualizado; DELETE, data: null
const creadoCon = (nombreSchema: string) => ({ "201": ok("Creado: data trae el registro", ref(nombreSchema)) });
const actualizadoCon = (texto: string, nombreSchema: string) => ({ "200": ok(`${texto}: data trae el registro`, ref(nombreSchema)) });
const eliminado = (texto: string) => ({ "200": ok(texto, sinDatos) });

// ---------- Especificación ----------
export const openapiSpec = {
    openapi: "3.0.3",
    info: {
        title: "ActiveBreak API",
        version: "1.0.0",
        description: [
            "API REST para gestionar **pausas activas** en el trabajo.",
            "",
            "### Cómo probar",
            "1. **Registra** un usuario en `POST /users` (etiqueta *1. Autenticación*).",
            "2. Para tener un **admin**, cambia su rol en la base de datos:",
            "   `docker compose exec db psql -U activebreak -d activebreak -c \"UPDATE usuarios SET rol='admin' WHERE correo='tu@correo.com';\"`",
            "3. Haz **login** en `POST /login` y copia el `token`.",
            "4. Pulsa **Authorize** (arriba a la derecha), pega el token y acepta. Queda guardado aunque recargues.",
            "5. Prueba los módulos en el orden de las etiquetas.",
            "",
            "### Permisos",
            "- 🌐 público · 🔒 cualquier usuario autenticado · 👤 dueño del recurso o admin · 🛡️ solo admin",
            "",
            "### Formato de respuesta",
            "Todas las respuestas tienen la misma forma, y el código HTTP se mantiene (201, 400, 404, 409...):",
            "- Éxito: `{ \"success\": true, \"message\": \"...\", \"data\": ... }`. Al crear o actualizar, `data` trae el registro; al eliminar, `null`.",
            "- Error: `{ \"success\": false, \"message\": \"...\", \"errors\": [\"...\"] }`. `errors` detalla cada dato inválido.",
            "",
            "Los borrados son **lógicos** (`activo = false`), salvo historial y días de recordatorio."
        ].join("\n")
    },
    servers: [{ url: "/api", description: "Este servidor" }],
    tags: [
        { name: "1. Autenticación", description: "Registro e inicio de sesión (públicos)" },
        { name: "2. Usuarios", description: "Gestión de cuentas. Rol, estado y organización solo los cambia un admin" },
        { name: "3. Organizaciones", description: "🛡️ Empresas o instituciones. NIT con dígito de verificación de la DIAN" },
        { name: "4. Categorías de pausa", description: "Clasificación del catálogo (cuello, ojos, piernas, respiración)" },
        { name: "5. Pausas activas", description: "Catálogo de ejercicios. Cada pausa pertenece a una categoría activa" },
        { name: "6. Recordatorios", description: "Avisos de cada usuario. Máximo 3 activos" },
        { name: "7. Días de recordatorio", description: "Días de la semana en que aplica un recordatorio" },
        { name: "8. Historial", description: "Pausas realizadas. Cada registro recalcula las metas del usuario" },
        { name: "9. Metas semanales", description: "Objetivo de pausas por semana con avance calculado" }
    ],
    security: [{ bearerAuth: [] }],
    components: {
        securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Token obtenido en POST /login (válido 1 hora)" }
        },
        responses: {
            Validacion: { description: "Datos inválidos o regla de negocio incumplida", ...json(ref("Error"), { success: false, message: "Datos inválidos", errors: ["La duración debe estar entre 1 y 30 minutos"] }) },
            NoAutenticado: { description: "Sin token o token inválido/expirado", ...json(ref("Error"), { success: false, message: "Token inválido o expirado", errors: [] }) },
            SinPermiso: { description: "Autenticado pero sin permiso", ...json(ref("Error"), { success: false, message: "No tienes permisos para realizar esta acción", errors: [] }) },
            NoEncontrado: { description: "El recurso no existe", ...json(ref("Error"), { success: false, message: "La categoría no existe", errors: [] }) },
            Conflicto: { description: "Conflicto con el estado actual (duplicado, regla de negocio)", ...json(ref("Error"), { success: false, message: "Ya existe una categoría con ese nombre", errors: [] }) },
            DemasiadasPeticiones: { description: "Se superó el límite de peticiones por IP", ...json(ref("Error"), { success: false, message: "Demasiados intentos de inicio de sesión. Inténtalo de nuevo en 15 minutos", errors: [] }) }
        },
        schemas: {
            // ----- Generales -----
            Error: {
                type: "object",
                description: "Formato estándar de error",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string" },
                    errors: { type: "array", items: { type: "string" }, description: "Detalle de cada dato inválido (vacío en los demás errores)" }
                }
            },

            // ----- Autenticación -----
            Login: {
                type: "object",
                required: ["correo", "contrasena"],
                properties: { correo: { type: "string", format: "email" }, contrasena: { type: "string" } }
            },
            Token: { type: "object", properties: { token: { type: "string", description: "JWT para el botón Authorize" } } },

            // ----- Usuarios -----
            UsuarioRegistro: {
                type: "object",
                required: ["nombre", "correo", "contrasena", "nivel_salud"],
                properties: {
                    nombre: { type: "string", minLength: 5, maxLength: 150, description: "Solo letras y espacios" },
                    correo: { type: "string", format: "email", maxLength: 150, description: "Se guarda en minúsculas" },
                    contrasena: { type: "string", minLength: 8, maxLength: 64, description: "Al menos una letra y un número, sin espacios" },
                    nivel_salud: { type: "string", enum: ["bajo", "medio", "alto"] }
                }
            },
            UsuarioActualizar: {
                type: "object",
                minProperties: 1,
                properties: {
                    nombre: { type: "string", minLength: 5, maxLength: 150 },
                    correo: { type: "string", format: "email" },
                    contrasena: { type: "string", minLength: 8, maxLength: 64 },
                    nivel_salud: { type: "string", enum: ["bajo", "medio", "alto"] },
                    rol: { type: "string", enum: ["usuario", "admin"], description: "🛡️ Solo admin" },
                    activo: { type: "boolean", description: "🛡️ Solo admin" },
                    organizacionId: { type: "integer", minimum: 1, description: "🛡️ Solo admin. Debe ser una organización activa" }
                }
            },
            Usuario: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    nombre: { type: "string" },
                    correo: { type: "string" },
                    rol: { type: "string", enum: ["usuario", "admin"] },
                    nivel_salud: { type: "string", enum: ["bajo", "medio", "alto"] },
                    activo: { type: "boolean" },
                    organizacionId: { type: "integer", description: "Solo aparece si tiene organización" }
                }
            },

            // ----- Organizaciones -----
            OrganizacionCrear: {
                type: "object",
                required: ["nombre", "nit"],
                properties: {
                    nombre: { type: "string", minLength: 3, maxLength: 120 },
                    nit: { type: "string", pattern: "^\\d{9}-\\d$", description: "9 dígitos, guion y dígito de verificación correcto" },
                    sector: { type: "string", minLength: 3, maxLength: 80 },
                    activo: { type: "boolean", default: true }
                }
            },
            OrganizacionActualizar: {
                type: "object",
                minProperties: 1,
                properties: {
                    nombre: { type: "string", minLength: 3, maxLength: 120 },
                    nit: { type: "string", pattern: "^\\d{9}-\\d$" },
                    sector: { type: "string" },
                    activo: { type: "boolean", description: "No se puede desactivar con usuarios activos" }
                }
            },
            Organizacion: {
                type: "object",
                properties: { id: { type: "integer" }, nombre: { type: "string" }, nit: { type: "string" }, sector: { type: "string" }, activo: { type: "boolean" } }
            },

            // ----- Categorías -----
            CategoriaCrear: {
                type: "object",
                required: ["nombre"],
                properties: {
                    nombre: { type: "string", minLength: 3, maxLength: 60, description: "Único. Letras, espacios y guiones" },
                    descripcion: { type: "string", maxLength: 500 },
                    activo: { type: "boolean", default: true }
                }
            },
            CategoriaActualizar: {
                type: "object",
                minProperties: 1,
                properties: {
                    nombre: { type: "string", minLength: 3, maxLength: 60 },
                    descripcion: { type: "string", maxLength: 500 },
                    activo: { type: "boolean", description: "No se puede desactivar con pausas activas" }
                }
            },
            Categoria: {
                type: "object",
                properties: { id: { type: "integer" }, nombre: { type: "string" }, descripcion: { type: "string" }, activo: { type: "boolean" } }
            },

            // ----- Pausas -----
            PausaCrear: {
                type: "object",
                required: ["nombre", "duracionMinutos", "intensidad", "activo", "categoriaId"],
                properties: {
                    nombre: { type: "string", minLength: 3, maxLength: 100, description: "Letras, números, espacios y . , ( ) -" },
                    descripcion: { type: "string", maxLength: 1000 },
                    duracionMinutos: { type: "integer", minimum: 1, maximum: 30 },
                    intensidad: { type: "string", enum: ["baja", "media", "alta"] },
                    activo: { type: "boolean" },
                    categoriaId: { type: "integer", minimum: 1, description: "Categoría existente y activa" }
                }
            },
            PausaActualizar: {
                type: "object",
                minProperties: 1,
                properties: {
                    nombre: { type: "string", minLength: 3, maxLength: 100 },
                    descripcion: { type: "string", maxLength: 1000 },
                    duracionMinutos: { type: "integer", minimum: 1, maximum: 30 },
                    intensidad: { type: "string", enum: ["baja", "media", "alta"] },
                    activo: { type: "boolean" },
                    categoriaId: { type: "integer", minimum: 1 }
                }
            },
            Pausa: {
                type: "object",
                properties: {
                    id: { type: "integer" }, nombre: { type: "string" }, descripcion: { type: "string" },
                    duracionMinutos: { type: "integer" }, intensidad: { type: "string", enum: ["baja", "media", "alta"] },
                    categoriaId: { type: "integer" }, activo: { type: "boolean" }
                }
            },

            // ----- Recordatorios -----
            RecordatorioCrear: {
                type: "object",
                required: ["usuarioId", "frecuenciaMinutos", "horaInicio", "horaFin", "activo"],
                properties: {
                    usuarioId: { type: "integer", minimum: 1, description: "Tu propio id (un admin puede usar cualquiera)" },
                    frecuenciaMinutos: { type: "integer", minimum: 15, maximum: 240 },
                    horaInicio: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", example: "08:00" },
                    horaFin: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", example: "17:00", description: "Posterior a horaInicio" },
                    activo: { type: "boolean", description: "Máximo 3 recordatorios activos por usuario" }
                }
            },
            RecordatorioActualizar: {
                type: "object",
                minProperties: 1,
                properties: {
                    usuarioId: { type: "integer", minimum: 1 },
                    frecuenciaMinutos: { type: "integer", minimum: 15, maximum: 240 },
                    horaInicio: { type: "string", example: "09:00" },
                    horaFin: { type: "string", example: "18:00" },
                    activo: { type: "boolean" }
                }
            },
            Recordatorio: {
                type: "object",
                properties: {
                    id: { type: "integer" }, usuarioId: { type: "integer" }, frecuenciaMinutos: { type: "integer" },
                    horaInicio: { type: "string", example: "08:00:00" }, horaFin: { type: "string", example: "17:00:00" }, activo: { type: "boolean" }
                }
            },

            // ----- Días de recordatorio -----
            DiasCrear: {
                type: "object",
                required: ["recordatorioId", "diaSemana"],
                properties: {
                    recordatorioId: { type: "integer", minimum: 1 },
                    diaSemana: {
                        type: "array",
                        minItems: 1,
                        description: "Sin repetidos, ni con los días que ya tiene el recordatorio",
                        items: { type: "string", enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] }
                    }
                }
            },
            Dia: {
                type: "object",
                properties: { id: { type: "integer" }, recordatorioId: { type: "integer" }, diaSemana: { type: "string" } }
            },

            // ----- Historial -----
            HistorialCrear: {
                type: "object",
                required: ["usuarioId", "pausaId", "completado", "duracionReal"],
                properties: {
                    usuarioId: { type: "integer", minimum: 1 },
                    pausaId: { type: "integer", minimum: 1, description: "Pausa activa" },
                    fechaHora: { type: "string", example: "2026-11-26T10:00", description: "Opcional (YYYY-MM-DDTHH:mm). Por defecto, ahora. No puede ser futura" },
                    completado: { type: "boolean" },
                    duracionReal: { type: "integer", minimum: 0, maximum: 60, description: "Si no se completó debe ser 0" }
                }
            },
            Historial: {
                type: "object",
                properties: {
                    id: { type: "integer" }, usuarioId: { type: "integer" }, pausaId: { type: "integer" },
                    fechaHora: { type: "string", format: "date-time" }, completado: { type: "boolean" }, duracionReal: { type: "integer" }
                }
            },

            // ----- Metas -----
            MetaCrear: {
                type: "object",
                required: ["usuarioId", "pausasObjetivo", "fechaInicio", "fechaFin"],
                properties: {
                    usuarioId: { type: "integer", minimum: 1 },
                    pausasObjetivo: { type: "integer", minimum: 1, maximum: 50 },
                    fechaInicio: { type: "string", format: "date", example: "2026-11-30" },
                    fechaFin: { type: "string", format: "date", example: "2026-12-06", description: "Máximo 7 días desde el inicio y no en el pasado" }
                }
            },
            MetaActualizar: {
                type: "object",
                minProperties: 1,
                description: "Solo para metas en curso",
                properties: {
                    pausasObjetivo: { type: "integer", minimum: 1, maximum: 50 },
                    fechaInicio: { type: "string", format: "date" },
                    fechaFin: { type: "string", format: "date" }
                }
            },
            Meta: {
                type: "object",
                properties: {
                    id: { type: "integer" }, usuarioId: { type: "integer" }, pausasObjetivo: { type: "integer" },
                    fechaInicio: { type: "string", format: "date" }, fechaFin: { type: "string", format: "date" },
                    estado: { type: "string", enum: ["en_curso", "cumplida", "vencida"] }, activo: { type: "boolean" },
                    pausasCompletadas: { type: "integer", description: "Pausas completadas dentro del rango" },
                    porcentajeAvance: { type: "integer", minimum: 0, maximum: 100 }
                }
            }
        }
    },

    paths: {
        // ===================== 1. Autenticación =====================
        "/users": {
            post: {
                tags: ["1. Autenticación"],
                summary: "🌐 Registrar usuario",
                description: "Siempre crea `rol: usuario` y `activo: true`. Límite: 20 registros por hora e IP.",
                security: [],
                requestBody: cuerpo("UsuarioRegistro", { nombre: "Ana María Pérez", correo: "ana@example.com", contrasena: "Clave2026", nivel_salud: "medio" }),
                responses: { "201": ok("Usuario creado: data trae el usuario (sin contraseña)", ref("Usuario")), ...errores("400", "409", "429") }
            },
            get: {
                tags: ["2. Usuarios"],
                summary: "🛡️ Listar usuarios",
                responses: { "200": ok("Lista de usuarios", lista("Usuario")), ...errores("401", "403") }
            }
        },
        "/login": {
            post: {
                tags: ["1. Autenticación"],
                summary: "🌐 Iniciar sesión",
                description: "Devuelve un JWT válido 1 hora. Límite: 10 intentos fallidos cada 15 minutos por IP.",
                security: [],
                requestBody: cuerpo("Login", { correo: "ana@example.com", contrasena: "Clave2026" }),
                responses: { "200": ok("Login exitoso", ref("Token")), ...errores("400", "401", "429") }
            }
        },

        // ===================== 2. Usuarios =====================
        "/users/active": {
            get: { tags: ["2. Usuarios"], summary: "🛡️ Listar usuarios activos", responses: { "200": ok("Usuarios activos", lista("Usuario")), ...errores("401", "403") } }
        },
        "/users/email/{email}": {
            get: {
                tags: ["2. Usuarios"],
                summary: "🛡️ Buscar usuario por correo",
                parameters: [{ name: "email", in: "path", required: true, schema: { type: "string", format: "email", example: "ana@example.com" } }],
                responses: { "200": ok("Usuario", ref("Usuario")), ...errores("400", "401", "403", "404") }
            }
        },
        "/users/{id}": {
            get: { tags: ["2. Usuarios"], summary: "👤 Obtener usuario", parameters: [idPath()], responses: { "200": ok("Usuario", ref("Usuario")), ...errores("400", "401", "403", "404") } },
            put: {
                tags: ["2. Usuarios"],
                summary: "👤 Actualizar usuario",
                description: "`rol`, `activo` y `organizacionId` solo los cambia un admin. Un admin no puede desactivarse a sí mismo y siempre debe quedar un admin activo.",
                parameters: [idPath()],
                requestBody: cuerpo("UsuarioActualizar", { nombre: "Ana María Pérez Gómez" }),
                responses: { ...actualizadoCon("Usuario actualizado", "Usuario"), ...errores("400", "401", "403", "404", "409") }
            },
            delete: {
                tags: ["2. Usuarios"],
                summary: "👤 Desactivar usuario (borrado lógico)",
                parameters: [idPath()],
                responses: { ...eliminado("Usuario desactivado"), ...errores("400", "401", "403", "404", "409") }
            }
        },

        // ===================== 3. Organizaciones =====================
        "/organizaciones": {
            post: {
                tags: ["3. Organizaciones"],
                summary: "🛡️ Crear organización",
                requestBody: cuerpo("OrganizacionCrear", { nombre: "Bancolombia S.A.", nit: "890903938-8", sector: "Financiero" }),
                responses: { ...creadoCon("Organizacion"), ...errores("400", "401", "403", "409") }
            },
            get: { tags: ["3. Organizaciones"], summary: "🛡️ Listar organizaciones", responses: { "200": ok("Organizaciones", lista("Organizacion")), ...errores("401", "403") } }
        },
        "/organizaciones/activas": {
            get: { tags: ["3. Organizaciones"], summary: "🛡️ Listar organizaciones activas", responses: { "200": ok("Organizaciones activas", lista("Organizacion")), ...errores("401", "403") } }
        },
        "/organizaciones/{id}": {
            get: { tags: ["3. Organizaciones"], summary: "🛡️ Obtener organización", parameters: [idPath()], responses: { "200": ok("Organización", ref("Organizacion")), ...errores("400", "401", "403", "404") } },
            put: {
                tags: ["3. Organizaciones"],
                summary: "🛡️ Actualizar organización",
                parameters: [idPath()],
                requestBody: cuerpo("OrganizacionActualizar", { sector: "Banca" }),
                responses: { ...actualizadoCon("Organización actualizada", "Organizacion"), ...errores("400", "401", "403", "404", "409") }
            },
            delete: {
                tags: ["3. Organizaciones"],
                summary: "🛡️ Desactivar organización (borrado lógico)",
                description: "No se permite si tiene usuarios activos (409).",
                parameters: [idPath()],
                responses: { ...eliminado("Organización desactivada"), ...errores("400", "401", "403", "404", "409") }
            }
        },

        // ===================== 4. Categorías de pausa =====================
        "/categorias-pausa": {
            post: {
                tags: ["4. Categorías de pausa"],
                summary: "🛡️ Crear categoría",
                requestBody: cuerpo("CategoriaCrear", { nombre: "Espalda", descripcion: "Estiramientos de la zona lumbar" }),
                responses: { ...creadoCon("Categoria"), ...errores("400", "401", "403", "409") }
            },
            get: { tags: ["4. Categorías de pausa"], summary: "🔒 Listar categorías", responses: { "200": ok("Categorías", lista("Categoria")), ...errores("401") } }
        },
        "/categorias-pausa/activas": {
            get: { tags: ["4. Categorías de pausa"], summary: "🔒 Listar categorías activas", responses: { "200": ok("Categorías activas", lista("Categoria")), ...errores("401") } }
        },
        "/categorias-pausa/{id}": {
            get: { tags: ["4. Categorías de pausa"], summary: "🔒 Obtener categoría", parameters: [idPath()], responses: { "200": ok("Categoría", ref("Categoria")), ...errores("400", "401", "404") } },
            put: {
                tags: ["4. Categorías de pausa"],
                summary: "🛡️ Actualizar categoría",
                parameters: [idPath()],
                requestBody: cuerpo("CategoriaActualizar", { descripcion: "Movimientos suaves de cuello y hombros" }),
                responses: { ...actualizadoCon("Categoría actualizada", "Categoria"), ...errores("400", "401", "403", "404", "409") }
            },
            delete: {
                tags: ["4. Categorías de pausa"],
                summary: "🛡️ Desactivar categoría (borrado lógico)",
                description: "No se permite si tiene pausas activas (409).",
                parameters: [idPath()],
                responses: { ...eliminado("Categoría desactivada"), ...errores("400", "401", "403", "404", "409") }
            }
        },

        // ===================== 5. Pausas activas =====================
        "/pausas-activas": {
            post: {
                tags: ["5. Pausas activas"],
                summary: "🛡️ Crear pausa",
                requestBody: cuerpo("PausaCrear", { nombre: "Estiramiento de hombros", descripcion: "Subir y bajar los hombros 10 veces", duracionMinutos: 3, intensidad: "baja", activo: true, categoriaId: 1 }),
                responses: { ...creadoCon("Pausa"), ...errores("400", "401", "403", "404") }
            },
            get: { tags: ["5. Pausas activas"], summary: "🔒 Listar todas las pausas", responses: { "200": ok("Pausas", lista("Pausa")), ...errores("401") } }
        },
        "/pausas-activas/activas": {
            get: {
                tags: ["5. Pausas activas"],
                summary: "🔒 Catálogo de pausas activas (con filtros)",
                parameters: [
                    { name: "categoriaId", in: "query", schema: { type: "integer", minimum: 1 } },
                    { name: "intensidad", in: "query", schema: { type: "string", enum: ["baja", "media", "alta"] } },
                    { name: "duracionMax", in: "query", description: "Minutos (1 a 30)", schema: { type: "integer", minimum: 1, maximum: 30 } }
                ],
                responses: { "200": ok("Pausas activas", lista("Pausa")), ...errores("400", "401") }
            }
        },
        "/pausas-activas/{id}": {
            get: { tags: ["5. Pausas activas"], summary: "🔒 Obtener pausa", parameters: [idPath()], responses: { "200": ok("Pausa", ref("Pausa")), ...errores("400", "401", "404") } },
            put: {
                tags: ["5. Pausas activas"],
                summary: "🛡️ Actualizar pausa",
                parameters: [idPath()],
                requestBody: cuerpo("PausaActualizar", { duracionMinutos: 4 }),
                responses: { ...actualizadoCon("Pausa actualizada", "Pausa"), ...errores("400", "401", "403", "404") }
            },
            delete: { tags: ["5. Pausas activas"], summary: "🛡️ Desactivar pausa (borrado lógico)", parameters: [idPath()], responses: { ...eliminado("Pausa desactivada"), ...errores("400", "401", "403", "404") } }
        },

        // ===================== 6. Recordatorios =====================
        "/recordatorios": {
            post: {
                tags: ["6. Recordatorios"],
                summary: "👤 Crear recordatorio",
                requestBody: cuerpo("RecordatorioCrear", { usuarioId: 1, frecuenciaMinutos: 60, horaInicio: "08:00", horaFin: "17:00", activo: true }),
                responses: { ...creadoCon("Recordatorio"), ...errores("400", "401", "403", "404", "409") }
            },
            get: { tags: ["6. Recordatorios"], summary: "🛡️ Listar recordatorios", responses: { "200": ok("Recordatorios", lista("Recordatorio")), ...errores("401", "403") } }
        },
        "/recordatorios/active": {
            get: { tags: ["6. Recordatorios"], summary: "🛡️ Listar recordatorios activos", responses: { "200": ok("Recordatorios activos", lista("Recordatorio")), ...errores("401", "403") } }
        },
        "/recordatorios/user/{userId}": {
            get: {
                tags: ["6. Recordatorios"],
                summary: "👤 Recordatorios de un usuario",
                parameters: [idPath("userId", "Id del usuario")],
                responses: { "200": ok("Recordatorios del usuario", lista("Recordatorio")), ...errores("400", "401", "403", "404") }
            }
        },
        "/recordatorios/{id}": {
            get: { tags: ["6. Recordatorios"], summary: "👤 Obtener recordatorio", parameters: [idPath()], responses: { "200": ok("Recordatorio", ref("Recordatorio")), ...errores("400", "401", "403", "404") } },
            put: {
                tags: ["6. Recordatorios"],
                summary: "👤 Actualizar recordatorio",
                description: "Reactivarlo también respeta el máximo de 3 activos (409).",
                parameters: [idPath()],
                requestBody: cuerpo("RecordatorioActualizar", { frecuenciaMinutos: 45 }),
                responses: { ...actualizadoCon("Recordatorio actualizado", "Recordatorio"), ...errores("400", "401", "403", "404", "409") }
            },
            delete: { tags: ["6. Recordatorios"], summary: "👤 Desactivar recordatorio (borrado lógico)", parameters: [idPath()], responses: { ...eliminado("Recordatorio desactivado"), ...errores("400", "401", "403", "404") } }
        },

        // ===================== 7. Días de recordatorio =====================
        "/recordatorio-dia": {
            post: {
                tags: ["7. Días de recordatorio"],
                summary: "👤 Asignar días a un recordatorio",
                requestBody: cuerpo("DiasCrear", { recordatorioId: 1, diaSemana: ["lunes", "miercoles", "viernes"] }),
                responses: { "201": ok("Días creados: data trae la lista", lista("Dia")), ...errores("400", "401", "403", "404", "409") }
            },
            get: { tags: ["7. Días de recordatorio"], summary: "🛡️ Listar todos los días", responses: { "200": ok("Días", lista("Dia")), ...errores("401", "403") } }
        },
        "/recordatorio-dia/recordatorio/{recordatorioId}": {
            get: {
                tags: ["7. Días de recordatorio"],
                summary: "👤 Días de un recordatorio",
                parameters: [idPath("recordatorioId", "Id del recordatorio")],
                responses: { "200": ok("Días del recordatorio", lista("Dia")), ...errores("400", "401", "403", "404") }
            }
        },
        "/recordatorio-dia/{id}": {
            get: { tags: ["7. Días de recordatorio"], summary: "👤 Obtener día", parameters: [idPath()], responses: { "200": ok("Día", ref("Dia")), ...errores("400", "401", "403", "404") } },
            delete: { tags: ["7. Días de recordatorio"], summary: "👤 Eliminar día (borrado físico)", parameters: [idPath()], responses: { ...eliminado("Día eliminado"), ...errores("400", "401", "403", "404") } }
        },

        // ===================== 8. Historial =====================
        "/historial": {
            post: {
                tags: ["8. Historial"],
                summary: "👤 Registrar pausa realizada",
                description: "Recalcula el estado y el avance de las metas del usuario.",
                requestBody: cuerpo("HistorialCrear", { usuarioId: 1, pausaId: 1, completado: true, duracionReal: 3 }),
                responses: { ...creadoCon("Historial"), ...errores("400", "401", "403", "404") }
            },
            get: { tags: ["8. Historial"], summary: "🛡️ Listar historial", responses: { "200": ok("Historial", lista("Historial")), ...errores("401", "403") } }
        },
        "/historial/usuario/{usuarioId}": {
            get: {
                tags: ["8. Historial"],
                summary: "👤 Historial de un usuario",
                parameters: [idPath("usuarioId", "Id del usuario")],
                responses: { "200": ok("Historial del usuario", lista("Historial")), ...errores("400", "401", "403", "404") }
            }
        },
        "/historial/pausa/{pausaId}": {
            get: {
                tags: ["8. Historial"],
                summary: "🛡️ Historial de una pausa",
                parameters: [idPath("pausaId", "Id de la pausa")],
                responses: { "200": ok("Historial de la pausa", lista("Historial")), ...errores("400", "401", "403", "404") }
            }
        },
        "/historial/{id}": {
            get: { tags: ["8. Historial"], summary: "👤 Obtener registro", parameters: [idPath()], responses: { "200": ok("Registro", ref("Historial")), ...errores("400", "401", "403", "404") } },
            delete: { tags: ["8. Historial"], summary: "👤 Eliminar registro (borrado físico)", parameters: [idPath()], responses: { ...eliminado("Registro eliminado"), ...errores("400", "401", "403", "404") } }
        },

        // ===================== 9. Metas semanales =====================
        "/metas": {
            post: {
                tags: ["9. Metas semanales"],
                summary: "👤 Crear meta",
                description: "Máximo 7 días, no puede terminar en el pasado y no puede cruzarse con otra meta activa del usuario (409).",
                requestBody: cuerpo("MetaCrear", { usuarioId: 1, pausasObjetivo: 10, fechaInicio: "2026-11-30", fechaFin: "2026-12-06" }),
                responses: { ...creadoCon("Meta"), ...errores("400", "401", "403", "404", "409") }
            },
            get: { tags: ["9. Metas semanales"], summary: "🛡️ Listar metas", responses: { "200": ok("Metas con avance", lista("Meta")), ...errores("401", "403") } }
        },
        "/metas/usuario/{usuarioId}": {
            get: {
                tags: ["9. Metas semanales"],
                summary: "👤 Metas de un usuario",
                parameters: [idPath("usuarioId", "Id del usuario")],
                responses: { "200": ok("Metas del usuario con avance", lista("Meta")), ...errores("400", "401", "403", "404") }
            }
        },
        "/metas/{id}": {
            get: { tags: ["9. Metas semanales"], summary: "👤 Obtener meta con su avance", parameters: [idPath()], responses: { "200": ok("Meta", ref("Meta")), ...errores("400", "401", "403", "404") } },
            put: {
                tags: ["9. Metas semanales"],
                summary: "👤 Actualizar meta en curso",
                description: "Una meta cumplida o vencida no se puede modificar (409).",
                parameters: [idPath()],
                requestBody: cuerpo("MetaActualizar", { pausasObjetivo: 12 }),
                responses: { ...actualizadoCon("Meta actualizada", "Meta"), ...errores("400", "401", "403", "404", "409") }
            },
            delete: { tags: ["9. Metas semanales"], summary: "👤 Desactivar meta (borrado lógico)", parameters: [idPath()], responses: { ...eliminado("Meta desactivada"), ...errores("400", "401", "403", "404") } }
        }
    }
};
