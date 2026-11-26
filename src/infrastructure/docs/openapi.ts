/*
OpenAPI (Swagger) documentation of the ActiveBreak API.
Served at /api/docs (UI) and /api/docs.json (specification).

Tags are numbered in the recommended testing order (authentication first, then the
catalogs and finally what depends on them). The texts are in Spanish because they are
read by the team and the evaluators. Update this file whenever an endpoint changes.
*/

// ---------- Helpers ----------
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const responseRef = (name: string) => ({ $ref: `#/components/responses/${name}` });

const json = (schema: object, example?: unknown) => ({
    content: { "application/json": { schema, ...(example !== undefined && { example }) } }
});

const body = (schemaName: string, example: unknown) => ({ required: true, ...json(ref(schemaName), example) });

const pathId = (name = "id", description = "Identificador (entero positivo)") => ({
    name,
    in: "path",
    required: true,
    description,
    schema: { type: "integer", minimum: 1, example: 1 }
});

// Standard success format: { success: true, message, data }
const envelope = (data: object) => ({
    type: "object",
    properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data }
});
const ok = (description: string, schema: object) => ({ description, ...json(envelope(schema)) });
const list = (schemaName: string) => ({ type: "array", items: ref(schemaName) });
const noData = { nullable: true, example: null };

// POST returns the created record; PUT, the updated record; DELETE, data: null
const createdWith = (schemaName: string) => ({ "201": ok("Creado: data trae el registro", ref(schemaName)) });
const updatedWith = (text: string, schemaName: string) => ({ "200": ok(`${text}: data trae el registro`, ref(schemaName)) });
const deleted = (text: string) => ({ "200": ok(text, noData) });

// Common error responses
type ErrorCode = "400" | "401" | "403" | "404" | "409" | "429";
const errors = (...codes: ErrorCode[]) => {
    const names: Record<ErrorCode, string> = {
        "400": "BadRequest", "401": "Unauthorized", "403": "Forbidden",
        "404": "NotFound", "409": "Conflict", "429": "TooManyRequests"
    };
    return Object.fromEntries(codes.map(code => [code, responseRef(names[code])]));
};

const errorExample = (message: string, details: string[] = []) => ({ success: false, message, errors: details });

// ---------- Specification ----------
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
            "   `docker compose exec db psql -U activebreak -d activebreak -c \"UPDATE users SET role='admin' WHERE email='tu@correo.com';\"`",
            "3. Haz **login** en `POST /login` y copia `data.token`.",
            "4. Pulsa **Authorize** (arriba a la derecha), pega el token y acepta. Queda guardado aunque recargues.",
            "5. Prueba los módulos en el orden de las etiquetas.",
            "",
            "### Permisos",
            "- 🌐 público · 🔒 cualquier usuario autenticado · 👤 dueño del recurso o admin · 🛡️ solo admin",
            "",
            "### Formato de respuesta",
            "Todas las respuestas tienen la misma forma y el código HTTP se mantiene (201, 400, 404, 409...):",
            "- Éxito: `{ \"success\": true, \"message\": \"...\", \"data\": ... }`. Al crear o actualizar, `data` trae el registro; al eliminar, `null`.",
            "- Error: `{ \"success\": false, \"message\": \"...\", \"errors\": [\"...\"] }`. `errors` detalla cada dato inválido.",
            "",
            "Los borrados son **lógicos** (`active = false`), salvo el historial y los días de recordatorio."
        ].join("\n")
    },
    servers: [{ url: "/api", description: "Este servidor" }],
    tags: [
        { name: "1. Autenticación", description: "Registro e inicio de sesión (públicos)" },
        { name: "2. Usuarios", description: "Cuentas. role, active y organizationId solo los cambia un admin" },
        { name: "3. Organizaciones", description: "🛡️ Empresas o instituciones. NIT con dígito de verificación de la DIAN" },
        { name: "4. Categorías de pausa", description: "Clasificación del catálogo (cuello, ojos, piernas, respiración)" },
        { name: "5. Pausas activas", description: "Catálogo de ejercicios. Cada pausa pertenece a una categoría activa" },
        { name: "6. Recordatorios", description: "Avisos de cada usuario. Máximo 3 activos" },
        { name: "7. Días de recordatorio", description: "Días de la semana en que aplica un recordatorio" },
        { name: "8. Historial de actividad", description: "Pausas realizadas. Cada registro recalcula las metas del usuario" },
        { name: "9. Metas semanales", description: "Objetivo de pausas por semana con avance calculado" }
    ],
    security: [{ bearerAuth: [] }],
    components: {
        securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Token de POST /login (válido 1 hora)" }
        },
        responses: {
            BadRequest: { description: "Datos inválidos o regla de negocio incumplida", ...json(ref("Error"), errorExample("Datos inválidos", ["La duración debe estar entre 1 y 30 minutos"])) },
            Unauthorized: { description: "Sin token o token inválido/expirado", ...json(ref("Error"), errorExample("Token inválido o expirado")) },
            Forbidden: { description: "Autenticado pero sin permiso", ...json(ref("Error"), errorExample("No tienes permisos para realizar esta acción")) },
            NotFound: { description: "El recurso no existe", ...json(ref("Error"), errorExample("La categoría no existe")) },
            Conflict: { description: "Conflicto con el estado actual (duplicado, regla de negocio)", ...json(ref("Error"), errorExample("Ya existe una categoría con ese nombre")) },
            TooManyRequests: { description: "Se superó el límite de peticiones por IP", ...json(ref("Error"), errorExample("Demasiados intentos de inicio de sesión. Inténtalo de nuevo en 15 minutos")) }
        },
        schemas: {
            Error: {
                type: "object",
                description: "Formato estándar de error",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string" },
                    errors: { type: "array", items: { type: "string" }, description: "Detalle de cada dato inválido (vacío en los demás errores)" }
                }
            },

            // ----- Authentication -----
            Login: {
                type: "object",
                required: ["email", "password"],
                properties: { email: { type: "string", format: "email" }, password: { type: "string" } }
            },
            Token: { type: "object", properties: { token: { type: "string", description: "JWT para el botón Authorize" } } },

            // ----- Users -----
            UserRegister: {
                type: "object",
                required: ["name", "email", "password", "healthLevel"],
                properties: {
                    name: { type: "string", minLength: 5, maxLength: 150, description: "Solo letras y espacios" },
                    email: { type: "string", format: "email", maxLength: 150, description: "Se guarda en minúsculas" },
                    password: { type: "string", minLength: 8, maxLength: 64, description: "Al menos una letra y un número, sin espacios" },
                    healthLevel: { type: "string", enum: ["low", "medium", "high"] }
                }
            },
            UserUpdate: {
                type: "object",
                minProperties: 1,
                properties: {
                    name: { type: "string", minLength: 5, maxLength: 150 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8, maxLength: 64 },
                    healthLevel: { type: "string", enum: ["low", "medium", "high"] },
                    role: { type: "string", enum: ["user", "admin"], description: "🛡️ Solo admin" },
                    active: { type: "boolean", description: "🛡️ Solo admin" },
                    organizationId: { type: "integer", minimum: 1, description: "🛡️ Solo admin. Debe ser una organización activa" }
                }
            },
            User: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    name: { type: "string" },
                    email: { type: "string" },
                    role: { type: "string", enum: ["user", "admin"] },
                    healthLevel: { type: "string", enum: ["low", "medium", "high"] },
                    active: { type: "boolean" },
                    organizationId: { type: "integer", description: "Solo aparece si tiene organización" }
                }
            },

            // ----- Organizations -----
            OrganizationCreate: {
                type: "object",
                required: ["name", "taxId"],
                properties: {
                    name: { type: "string", minLength: 3, maxLength: 120 },
                    taxId: { type: "string", pattern: "^\\d{9}-\\d$", description: "NIT: 9 dígitos, guion y dígito de verificación correcto" },
                    sector: { type: "string", minLength: 3, maxLength: 80 },
                    active: { type: "boolean", default: true }
                }
            },
            OrganizationUpdate: {
                type: "object",
                minProperties: 1,
                properties: {
                    name: { type: "string", minLength: 3, maxLength: 120 },
                    taxId: { type: "string", pattern: "^\\d{9}-\\d$" },
                    sector: { type: "string" },
                    active: { type: "boolean", description: "No se puede desactivar con usuarios activos" }
                }
            },
            Organization: {
                type: "object",
                properties: { id: { type: "integer" }, name: { type: "string" }, taxId: { type: "string" }, sector: { type: "string" }, active: { type: "boolean" } }
            },

            // ----- Break categories -----
            BreakCategoryCreate: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string", minLength: 3, maxLength: 60, description: "Único. Letras, espacios y guiones" },
                    description: { type: "string", maxLength: 500 },
                    active: { type: "boolean", default: true }
                }
            },
            BreakCategoryUpdate: {
                type: "object",
                minProperties: 1,
                properties: {
                    name: { type: "string", minLength: 3, maxLength: 60 },
                    description: { type: "string", maxLength: 500 },
                    active: { type: "boolean", description: "No se puede desactivar con pausas activas" }
                }
            },
            BreakCategory: {
                type: "object",
                properties: { id: { type: "integer" }, name: { type: "string" }, description: { type: "string" }, active: { type: "boolean" } }
            },

            // ----- Active breaks -----
            ActiveBreakCreate: {
                type: "object",
                required: ["name", "durationMinutes", "intensity", "categoryId"],
                properties: {
                    name: { type: "string", minLength: 3, maxLength: 100, description: "Letras, números, espacios y . , ( ) -" },
                    description: { type: "string", maxLength: 1000 },
                    durationMinutes: { type: "integer", minimum: 1, maximum: 30 },
                    intensity: { type: "string", enum: ["low", "medium", "high"] },
                    categoryId: { type: "integer", minimum: 1, description: "Categoría existente y activa" },
                    active: { type: "boolean", default: true }
                }
            },
            ActiveBreakUpdate: {
                type: "object",
                minProperties: 1,
                properties: {
                    name: { type: "string", minLength: 3, maxLength: 100 },
                    description: { type: "string", maxLength: 1000 },
                    durationMinutes: { type: "integer", minimum: 1, maximum: 30 },
                    intensity: { type: "string", enum: ["low", "medium", "high"] },
                    categoryId: { type: "integer", minimum: 1 },
                    active: { type: "boolean" }
                }
            },
            ActiveBreak: {
                type: "object",
                properties: {
                    id: { type: "integer" }, name: { type: "string" }, description: { type: "string" },
                    durationMinutes: { type: "integer" }, intensity: { type: "string", enum: ["low", "medium", "high"] },
                    categoryId: { type: "integer" }, active: { type: "boolean" }
                }
            },

            // ----- Reminders -----
            ReminderCreate: {
                type: "object",
                required: ["userId", "frequencyMinutes", "startTime", "endTime"],
                properties: {
                    userId: { type: "integer", minimum: 1, description: "Tu propio id (un admin puede usar cualquiera)" },
                    frequencyMinutes: { type: "integer", minimum: 15, maximum: 240 },
                    startTime: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", example: "08:00" },
                    endTime: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", example: "17:00", description: "Posterior a startTime" },
                    active: { type: "boolean", default: true, description: "Máximo 3 recordatorios activos por usuario" }
                }
            },
            ReminderUpdate: {
                type: "object",
                minProperties: 1,
                properties: {
                    userId: { type: "integer", minimum: 1 },
                    frequencyMinutes: { type: "integer", minimum: 15, maximum: 240 },
                    startTime: { type: "string", example: "09:00" },
                    endTime: { type: "string", example: "18:00" },
                    active: { type: "boolean" }
                }
            },
            Reminder: {
                type: "object",
                properties: {
                    id: { type: "integer" }, userId: { type: "integer" }, frequencyMinutes: { type: "integer" },
                    startTime: { type: "string", example: "08:00" }, endTime: { type: "string", example: "17:00" }, active: { type: "boolean" }
                }
            },

            // ----- Reminder days -----
            ReminderDaysCreate: {
                type: "object",
                required: ["reminderId", "weekdays"],
                properties: {
                    reminderId: { type: "integer", minimum: 1 },
                    weekdays: {
                        type: "array",
                        minItems: 1,
                        description: "Sin repetidos, ni con los días que ya tiene el recordatorio",
                        items: { type: "string", enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] }
                    }
                }
            },
            ReminderDay: {
                type: "object",
                properties: { id: { type: "integer" }, reminderId: { type: "integer" }, weekday: { type: "string" } }
            },

            // ----- Activity history -----
            ActivityRecordCreate: {
                type: "object",
                required: ["userId", "breakId", "completed", "actualDurationMinutes"],
                properties: {
                    userId: { type: "integer", minimum: 1 },
                    breakId: { type: "integer", minimum: 1, description: "Pausa activa" },
                    performedAt: { type: "string", example: "2026-11-26T10:00", description: "Opcional (YYYY-MM-DDTHH:mm). Por defecto, ahora. No puede ser futura" },
                    completed: { type: "boolean" },
                    actualDurationMinutes: { type: "integer", minimum: 0, maximum: 60, description: "Si no se completó debe ser 0" }
                }
            },
            ActivityRecord: {
                type: "object",
                properties: {
                    id: { type: "integer" }, userId: { type: "integer" }, breakId: { type: "integer" },
                    performedAt: { type: "string", format: "date-time" }, completed: { type: "boolean" }, actualDurationMinutes: { type: "integer" }
                }
            },

            // ----- Goals -----
            GoalCreate: {
                type: "object",
                required: ["userId", "targetBreaks", "startDate", "endDate"],
                properties: {
                    userId: { type: "integer", minimum: 1 },
                    targetBreaks: { type: "integer", minimum: 1, maximum: 50 },
                    startDate: { type: "string", format: "date", example: "2026-11-30" },
                    endDate: { type: "string", format: "date", example: "2026-12-06", description: "Máximo 7 días desde el inicio y no en el pasado" }
                }
            },
            GoalUpdate: {
                type: "object",
                minProperties: 1,
                description: "Solo para metas en curso",
                properties: {
                    targetBreaks: { type: "integer", minimum: 1, maximum: 50 },
                    startDate: { type: "string", format: "date" },
                    endDate: { type: "string", format: "date" }
                }
            },
            Goal: {
                type: "object",
                properties: {
                    id: { type: "integer" }, userId: { type: "integer" }, targetBreaks: { type: "integer" },
                    startDate: { type: "string", format: "date" }, endDate: { type: "string", format: "date" },
                    status: { type: "string", enum: ["in_progress", "completed", "expired"] }, active: { type: "boolean" },
                    completedBreaks: { type: "integer", description: "Pausas completadas dentro del rango" },
                    progressPercentage: { type: "integer", minimum: 0, maximum: 100 }
                }
            }
        }
    },

    paths: {
        // ===================== 1. Authentication =====================
        "/users": {
            post: {
                tags: ["1. Autenticación"],
                summary: "🌐 Registrar usuario",
                description: "Siempre crea `role: user` y `active: true`. Límite: 20 registros por hora e IP.",
                security: [],
                requestBody: body("UserRegister", { name: "Ana María Pérez", email: "ana@example.com", password: "Clave2026", healthLevel: "medium" }),
                responses: { "201": ok("Usuario creado: data trae el usuario (sin contraseña)", ref("User")), ...errors("400", "409", "429") }
            },
            get: { tags: ["2. Usuarios"], summary: "🛡️ Listar usuarios", responses: { "200": ok("Usuarios", list("User")), ...errors("401", "403") } }
        },
        "/login": {
            post: {
                tags: ["1. Autenticación"],
                summary: "🌐 Iniciar sesión",
                description: "Devuelve un JWT válido 1 hora. Límite: 10 intentos fallidos cada 15 minutos por IP.",
                security: [],
                requestBody: body("Login", { email: "ana@example.com", password: "Clave2026" }),
                responses: { "200": ok("Inicio de sesión exitoso", ref("Token")), ...errors("400", "401", "429") }
            }
        },

        // ===================== 2. Users =====================
        "/users/active": {
            get: { tags: ["2. Usuarios"], summary: "🛡️ Listar usuarios activos", responses: { "200": ok("Usuarios activos", list("User")), ...errors("401", "403") } }
        },
        "/users/email/{email}": {
            get: {
                tags: ["2. Usuarios"],
                summary: "🛡️ Buscar usuario por correo",
                parameters: [{ name: "email", in: "path", required: true, schema: { type: "string", format: "email", example: "ana@example.com" } }],
                responses: { "200": ok("Usuario", ref("User")), ...errors("400", "401", "403", "404") }
            }
        },
        "/users/{id}": {
            get: { tags: ["2. Usuarios"], summary: "👤 Obtener usuario", parameters: [pathId()], responses: { "200": ok("Usuario", ref("User")), ...errors("400", "401", "403", "404") } },
            put: {
                tags: ["2. Usuarios"],
                summary: "👤 Actualizar usuario",
                description: "`role`, `active` y `organizationId` solo los cambia un admin. Un admin no puede desactivarse a sí mismo y siempre debe quedar un admin activo.",
                parameters: [pathId()],
                requestBody: body("UserUpdate", { name: "Ana María Pérez Gómez" }),
                responses: { ...updatedWith("Usuario actualizado", "User"), ...errors("400", "401", "403", "404", "409") }
            },
            delete: { tags: ["2. Usuarios"], summary: "👤 Desactivar usuario (borrado lógico)", parameters: [pathId()], responses: { ...deleted("Usuario desactivado"), ...errors("400", "401", "403", "404", "409") } }
        },

        // ===================== 3. Organizations =====================
        "/organizations": {
            post: {
                tags: ["3. Organizaciones"],
                summary: "🛡️ Crear organización",
                requestBody: body("OrganizationCreate", { name: "Bancolombia S.A.", taxId: "890903938-8", sector: "Financiero" }),
                responses: { ...createdWith("Organization"), ...errors("400", "401", "403", "409") }
            },
            get: { tags: ["3. Organizaciones"], summary: "🛡️ Listar organizaciones", responses: { "200": ok("Organizaciones", list("Organization")), ...errors("401", "403") } }
        },
        "/organizations/active": {
            get: { tags: ["3. Organizaciones"], summary: "🛡️ Listar organizaciones activas", responses: { "200": ok("Organizaciones activas", list("Organization")), ...errors("401", "403") } }
        },
        "/organizations/{id}": {
            get: { tags: ["3. Organizaciones"], summary: "🛡️ Obtener organización", parameters: [pathId()], responses: { "200": ok("Organización", ref("Organization")), ...errors("400", "401", "403", "404") } },
            put: {
                tags: ["3. Organizaciones"],
                summary: "🛡️ Actualizar organización",
                parameters: [pathId()],
                requestBody: body("OrganizationUpdate", { sector: "Banca" }),
                responses: { ...updatedWith("Organización actualizada", "Organization"), ...errors("400", "401", "403", "404", "409") }
            },
            delete: {
                tags: ["3. Organizaciones"],
                summary: "🛡️ Desactivar organización (borrado lógico)",
                description: "No se permite si tiene usuarios activos (409).",
                parameters: [pathId()],
                responses: { ...deleted("Organización desactivada"), ...errors("400", "401", "403", "404", "409") }
            }
        },

        // ===================== 4. Break categories =====================
        "/break-categories": {
            post: {
                tags: ["4. Categorías de pausa"],
                summary: "🛡️ Crear categoría",
                requestBody: body("BreakCategoryCreate", { name: "Espalda", description: "Estiramientos de la zona lumbar" }),
                responses: { ...createdWith("BreakCategory"), ...errors("400", "401", "403", "409") }
            },
            get: { tags: ["4. Categorías de pausa"], summary: "🔒 Listar categorías", responses: { "200": ok("Categorías", list("BreakCategory")), ...errors("401") } }
        },
        "/break-categories/active": {
            get: { tags: ["4. Categorías de pausa"], summary: "🔒 Listar categorías activas", responses: { "200": ok("Categorías activas", list("BreakCategory")), ...errors("401") } }
        },
        "/break-categories/{id}": {
            get: { tags: ["4. Categorías de pausa"], summary: "🔒 Obtener categoría", parameters: [pathId()], responses: { "200": ok("Categoría", ref("BreakCategory")), ...errors("400", "401", "404") } },
            put: {
                tags: ["4. Categorías de pausa"],
                summary: "🛡️ Actualizar categoría",
                parameters: [pathId()],
                requestBody: body("BreakCategoryUpdate", { description: "Movimientos suaves de cuello y hombros" }),
                responses: { ...updatedWith("Categoría actualizada", "BreakCategory"), ...errors("400", "401", "403", "404", "409") }
            },
            delete: {
                tags: ["4. Categorías de pausa"],
                summary: "🛡️ Desactivar categoría (borrado lógico)",
                description: "No se permite si tiene pausas activas (409).",
                parameters: [pathId()],
                responses: { ...deleted("Categoría desactivada"), ...errors("400", "401", "403", "404", "409") }
            }
        },

        // ===================== 5. Active breaks =====================
        "/active-breaks": {
            post: {
                tags: ["5. Pausas activas"],
                summary: "🛡️ Crear pausa",
                requestBody: body("ActiveBreakCreate", { name: "Estiramiento de hombros", description: "Subir y bajar los hombros 10 veces", durationMinutes: 3, intensity: "low", categoryId: 1 }),
                responses: { ...createdWith("ActiveBreak"), ...errors("400", "401", "403", "404") }
            },
            get: { tags: ["5. Pausas activas"], summary: "🔒 Listar todas las pausas", responses: { "200": ok("Pausas", list("ActiveBreak")), ...errors("401") } }
        },
        "/active-breaks/active": {
            get: {
                tags: ["5. Pausas activas"],
                summary: "🔒 Catálogo de pausas activas (con filtros)",
                parameters: [
                    { name: "categoryId", in: "query", schema: { type: "integer", minimum: 1 } },
                    { name: "intensity", in: "query", schema: { type: "string", enum: ["low", "medium", "high"] } },
                    { name: "maxDuration", in: "query", description: "Minutos (1 a 30)", schema: { type: "integer", minimum: 1, maximum: 30 } }
                ],
                responses: { "200": ok("Pausas activas", list("ActiveBreak")), ...errors("400", "401") }
            }
        },
        "/active-breaks/{id}": {
            get: { tags: ["5. Pausas activas"], summary: "🔒 Obtener pausa", parameters: [pathId()], responses: { "200": ok("Pausa", ref("ActiveBreak")), ...errors("400", "401", "404") } },
            put: {
                tags: ["5. Pausas activas"],
                summary: "🛡️ Actualizar pausa",
                parameters: [pathId()],
                requestBody: body("ActiveBreakUpdate", { durationMinutes: 4 }),
                responses: { ...updatedWith("Pausa actualizada", "ActiveBreak"), ...errors("400", "401", "403", "404") }
            },
            delete: { tags: ["5. Pausas activas"], summary: "🛡️ Desactivar pausa (borrado lógico)", parameters: [pathId()], responses: { ...deleted("Pausa desactivada"), ...errors("400", "401", "403", "404") } }
        },

        // ===================== 6. Reminders =====================
        "/reminders": {
            post: {
                tags: ["6. Recordatorios"],
                summary: "👤 Crear recordatorio",
                requestBody: body("ReminderCreate", { userId: 1, frequencyMinutes: 60, startTime: "08:00", endTime: "17:00", active: true }),
                responses: { ...createdWith("Reminder"), ...errors("400", "401", "403", "404", "409") }
            },
            get: { tags: ["6. Recordatorios"], summary: "🛡️ Listar recordatorios", responses: { "200": ok("Recordatorios", list("Reminder")), ...errors("401", "403") } }
        },
        "/reminders/active": {
            get: { tags: ["6. Recordatorios"], summary: "🛡️ Listar recordatorios activos", responses: { "200": ok("Recordatorios activos", list("Reminder")), ...errors("401", "403") } }
        },
        "/reminders/user/{userId}": {
            get: {
                tags: ["6. Recordatorios"],
                summary: "👤 Recordatorios de un usuario",
                parameters: [pathId("userId", "Id del usuario")],
                responses: { "200": ok("Recordatorios del usuario", list("Reminder")), ...errors("400", "401", "403", "404") }
            }
        },
        "/reminders/{id}": {
            get: { tags: ["6. Recordatorios"], summary: "👤 Obtener recordatorio", parameters: [pathId()], responses: { "200": ok("Recordatorio", ref("Reminder")), ...errors("400", "401", "403", "404") } },
            put: {
                tags: ["6. Recordatorios"],
                summary: "👤 Actualizar recordatorio",
                description: "Reactivarlo también respeta el máximo de 3 activos (409).",
                parameters: [pathId()],
                requestBody: body("ReminderUpdate", { frequencyMinutes: 45 }),
                responses: { ...updatedWith("Recordatorio actualizado", "Reminder"), ...errors("400", "401", "403", "404", "409") }
            },
            delete: { tags: ["6. Recordatorios"], summary: "👤 Desactivar recordatorio (borrado lógico)", parameters: [pathId()], responses: { ...deleted("Recordatorio desactivado"), ...errors("400", "401", "403", "404") } }
        },

        // ===================== 7. Reminder days =====================
        "/reminder-days": {
            post: {
                tags: ["7. Días de recordatorio"],
                summary: "👤 Asignar días a un recordatorio",
                requestBody: body("ReminderDaysCreate", { reminderId: 1, weekdays: ["monday", "wednesday", "friday"] }),
                responses: { "201": ok("Días creados: data trae la lista", list("ReminderDay")), ...errors("400", "401", "403", "404", "409") }
            },
            get: { tags: ["7. Días de recordatorio"], summary: "🛡️ Listar todos los días", responses: { "200": ok("Días", list("ReminderDay")), ...errors("401", "403") } }
        },
        "/reminder-days/reminder/{reminderId}": {
            get: {
                tags: ["7. Días de recordatorio"],
                summary: "👤 Días de un recordatorio",
                parameters: [pathId("reminderId", "Id del recordatorio")],
                responses: { "200": ok("Días del recordatorio", list("ReminderDay")), ...errors("400", "401", "403", "404") }
            }
        },
        "/reminder-days/{id}": {
            get: { tags: ["7. Días de recordatorio"], summary: "👤 Obtener día", parameters: [pathId()], responses: { "200": ok("Día", ref("ReminderDay")), ...errors("400", "401", "403", "404") } },
            delete: { tags: ["7. Días de recordatorio"], summary: "👤 Eliminar día (borrado físico)", parameters: [pathId()], responses: { ...deleted("Día eliminado"), ...errors("400", "401", "403", "404") } }
        },

        // ===================== 8. Activity history =====================
        "/activity-history": {
            post: {
                tags: ["8. Historial de actividad"],
                summary: "👤 Registrar pausa realizada",
                description: "Recalcula el estado y el avance de las metas del usuario.",
                requestBody: body("ActivityRecordCreate", { userId: 1, breakId: 1, completed: true, actualDurationMinutes: 3 }),
                responses: { ...createdWith("ActivityRecord"), ...errors("400", "401", "403", "404") }
            },
            get: { tags: ["8. Historial de actividad"], summary: "🛡️ Listar historial", responses: { "200": ok("Historial", list("ActivityRecord")), ...errors("401", "403") } }
        },
        "/activity-history/user/{userId}": {
            get: {
                tags: ["8. Historial de actividad"],
                summary: "👤 Historial de un usuario",
                parameters: [pathId("userId", "Id del usuario")],
                responses: { "200": ok("Historial del usuario", list("ActivityRecord")), ...errors("400", "401", "403", "404") }
            }
        },
        "/activity-history/break/{breakId}": {
            get: {
                tags: ["8. Historial de actividad"],
                summary: "🛡️ Historial de una pausa",
                parameters: [pathId("breakId", "Id de la pausa")],
                responses: { "200": ok("Historial de la pausa", list("ActivityRecord")), ...errors("400", "401", "403", "404") }
            }
        },
        "/activity-history/{id}": {
            get: { tags: ["8. Historial de actividad"], summary: "👤 Obtener registro", parameters: [pathId()], responses: { "200": ok("Registro", ref("ActivityRecord")), ...errors("400", "401", "403", "404") } },
            delete: { tags: ["8. Historial de actividad"], summary: "👤 Eliminar registro (borrado físico)", parameters: [pathId()], responses: { ...deleted("Registro eliminado"), ...errors("400", "401", "403", "404") } }
        },

        // ===================== 9. Goals =====================
        "/goals": {
            post: {
                tags: ["9. Metas semanales"],
                summary: "👤 Crear meta",
                description: "Máximo 7 días, no puede terminar en el pasado y no puede cruzarse con otra meta activa del usuario (409).",
                requestBody: body("GoalCreate", { userId: 1, targetBreaks: 10, startDate: "2026-11-30", endDate: "2026-12-06" }),
                responses: { ...createdWith("Goal"), ...errors("400", "401", "403", "404", "409") }
            },
            get: { tags: ["9. Metas semanales"], summary: "🛡️ Listar metas", responses: { "200": ok("Metas con avance", list("Goal")), ...errors("401", "403") } }
        },
        "/goals/user/{userId}": {
            get: {
                tags: ["9. Metas semanales"],
                summary: "👤 Metas de un usuario",
                parameters: [pathId("userId", "Id del usuario")],
                responses: { "200": ok("Metas del usuario con avance", list("Goal")), ...errors("400", "401", "403", "404") }
            }
        },
        "/goals/{id}": {
            get: { tags: ["9. Metas semanales"], summary: "👤 Obtener meta con su avance", parameters: [pathId()], responses: { "200": ok("Meta", ref("Goal")), ...errors("400", "401", "403", "404") } },
            put: {
                tags: ["9. Metas semanales"],
                summary: "👤 Actualizar meta en curso",
                description: "Una meta cumplida o vencida no se puede modificar (409).",
                parameters: [pathId()],
                requestBody: body("GoalUpdate", { targetBreaks: 12 }),
                responses: { ...updatedWith("Meta actualizada", "Goal"), ...errors("400", "401", "403", "404", "409") }
            },
            delete: { tags: ["9. Metas semanales"], summary: "👤 Desactivar meta (borrado lógico)", parameters: [pathId()], responses: { ...deleted("Meta desactivada"), ...errors("400", "401", "403", "404") } }
        }
    }
};
