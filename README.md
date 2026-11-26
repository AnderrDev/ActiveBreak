# ActiveBreak

API REST para gestionar **pausas activas** en el trabajo: usuarios y organizaciones, catálogo de ejercicios por categoría, recordatorios por día de la semana, historial de actividad y metas semanales.

Construida con **Node.js + TypeScript**, **Express 5**, **TypeORM** y **PostgreSQL**, siguiendo una **arquitectura hexagonal** (puertos y adaptadores).

> **Convención del código:** nombres, comentarios, rutas, campos JSON y tablas están en **inglés**. Los mensajes que ve el usuario final (respuestas y errores) están en **español**.

## Tecnologías

| Área | Herramienta |
| --- | --- |
| Runtime | Node.js (ESM) + TypeScript |
| Framework HTTP | Express 5 |
| ORM / BD | TypeORM + PostgreSQL |
| Autenticación | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validación | Joi |
| Documentación | Swagger (`swagger-ui-express`) |
| Desarrollo | nodemon + tsx |

## Arquitectura

```
src/
├── domain/              # Modelos, REGLAS DE NEGOCIO (*Rules) y puertos (*Port.ts). No depende de nada más
├── application/         # Casos de uso (*Application.ts): orquestan puertos + reglas del dominio
├── infrastructure/
│   ├── adapter/         # Implementación de los puertos con TypeORM (entidad <-> dominio)
│   ├── controller/      # Controladores HTTP: validan la entrada, autorizan y responden
│   ├── routes/          # Rutas Express: conectan Adapter -> Application -> Controller
│   ├── entities/        # Entidades TypeORM (tablas, columnas en snake_case)
│   ├── util/            # Validaciones con Joi
│   ├── config/          # Variables de entorno y conexión a la BD
│   ├── web/             # App Express, autenticación, errores, límites y formato de respuesta
│   ├── docs/            # Especificación OpenAPI (Swagger)
│   └── bootstrap/       # Arranque del servidor HTTP
└── index.ts             # Punto de entrada
```

Flujo de una petición: **Route → Controller → Application (caso de uso) → Port → Adapter → Base de datos**.

**Dónde va cada cosa:**

- **`domain/`**: cada modelo junto a sus reglas de negocio, como funciones puras (`GoalRules`, `ReminderRules`, `OrganizationRules`...). No consultan la base de datos: reciben los datos y lanzan errores de dominio (`ValidationError`, `ConflictError`...). Ejemplos: la duración de una pausa, el dígito de verificación del NIT, cuándo una meta está cumplida o vencida.
- **`application/`**: solo orquesta. Consulta por los puertos, aplica las reglas del dominio y guarda. También coordina lo que no es una regla: recalcular las metas cuando cambia el historial y serializar las operaciones simultáneas del mismo usuario (`KeyedLock`).
- **`infrastructure/`**: todo lo técnico (HTTP, TypeORM, Joi, Swagger).

## Modelo de datos

```
organizations ──< users ──< reminders ──< reminder_days
                    │ │
                    │ └──< goals
                    └──< activity_history >── active_breaks >── break_categories
```

| Tabla | Campos principales |
| --- | --- |
| `organizations` | `name`, `tax_id` (NIT, único), `sector`, `active` |
| `users` | `name`, `email` (único, en minúsculas), `password_hash`, `role` (`user` \| `admin`), `health_level` (`low` \| `medium` \| `high`), `organization_id`, `active` |
| `break_categories` | `name` (único), `description`, `active` |
| `active_breaks` | `name`, `description`, `duration_minutes`, `intensity` (`low` \| `medium` \| `high`), `category_id`, `active` |
| `reminders` | `user_id`, `frequency_minutes`, `start_time`, `end_time`, `active` |
| `reminder_days` | `reminder_id`, `weekday` (`monday` … `sunday`), único por recordatorio y día |
| `activity_history` | `user_id`, `break_id`, `performed_at`, `completed`, `actual_duration_minutes` |
| `goals` | `user_id`, `target_breaks`, `start_date`, `end_date`, `status` (`in_progress` \| `completed` \| `expired`), `active` |

Los borrados son **lógicos** (`active = false`), salvo `activity_history` y `reminder_days`, que se eliminan físicamente.

## Requisitos

- Node.js 20 o superior
- PostgreSQL (o Docker)

## Instalación

```bash
git clone https://github.com/AnderrDev/ActiveBreak.git
cd ActiveBreak
npm install
cp .env.example .env
```

Completa el `.env`:

| Variable | Descripción |
| --- | --- |
| `NODE_ENV` | `development`, `production` o `test` (por defecto `development`) |
| `PORT` | Puerto del servidor (obligatorio) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión a PostgreSQL |
| `JWT_SECRET` | Clave para firmar los tokens JWT (obligatoria, mínimo 32 caracteres) |
| `CORS_ORIGINS` | Orígenes permitidos por CORS, separados por comas (por ejemplo `http://localhost:4200`) |
| `TRUST_PROXY` | Número de proxies inversos delante de la API (por defecto `0`) |
| `API_DOCS_ENABLED` | Publica Swagger en `/api/docs` (por defecto `true`) |
| `TZ` | Zona horaria para calcular "hoy" en las metas (por defecto `America/Bogota` en Docker) |

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor en desarrollo con recarga automática |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run star` | Ejecuta la versión compilada (`dist/index.js`) |

El servidor queda disponible en `http://localhost:<PORT>/api`.

## Docker

El proyecto se levanta con **Docker Compose**: un contenedor con PostgreSQL y otro con el backend.

```
ActiveBreak/
├── Dockerfile                  # Imagen del backend: instala, compila TypeScript y ejecuta dist/index.js
├── docker-compose.yml          # Servicios: db (PostgreSQL 16) y backend
├── database/init/              # Scripts SQL que se ejecutan la PRIMERA vez que se crea la base
│   ├── 01_tables.sql           #   tablas, enums y claves foráneas
│   └── 02_seed_data.sql        #   categorías y pausas de ejemplo
└── .github/workflows/ci.yml    # CI/CD con GitHub Actions
```

| Servicio | Contenedor | Puerto en tu máquina → contenedor |
| --- | --- | --- |
| `db` | `activebreak-db` | `127.0.0.1:5433 → 5432` |
| `backend` | `activebreak-backend` | `3000 → 3000` |

### Levantar el proyecto

```bash
cp .env.example .env    # define al menos JWT_SECRET (openssl rand -hex 32)
docker compose up --build
```

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`
- Dentro de Docker el backend llega a la base por el nombre del servicio (`DB_HOST=db`).
- El contenedor usa la zona horaria `America/Bogota` (`TZ`), para que "hoy" en las metas sea el día de Colombia.
- CORS permite por defecto `http://localhost:4200` (frontend Angular). Cámbialo con `CORS_ORIGINS`.
- En el contenedor la API corre con `NODE_ENV=production`, así que TypeORM **no** modifica las tablas: las crea `database/init/01_tables.sql`. Si cambias una entidad, actualiza ese script y recrea la base con `docker compose down -v`.

> **Si ya habías levantado una versión anterior** (tablas en español), ejecuta una vez `docker compose down -v` y vuelve a levantar: así se crea la base nueva con los scripts.

| Comando | Qué hace |
| --- | --- |
| `docker compose up --build` | Construye la imagen del backend y levanta todo |
| `docker compose up -d` | Levanta en segundo plano |
| `docker ps` | Ver los contenedores en ejecución |
| `docker compose logs -f backend` | Ver los logs del backend |
| `docker compose down` | Detiene y elimina los contenedores (los datos se conservan) |
| `docker compose down -v` | Además borra la base (al volver a levantar se ejecutan otra vez los scripts) |
| `docker compose exec db psql -U activebreak -d activebreak` | Consola de PostgreSQL |

Para desarrollar con recarga automática puedes dejar solo la base en Docker (`docker compose up -d db`) y ejecutar `npm run dev` en tu máquina con `DB_HOST=localhost` y `DB_PORT=5433`.

### CI/CD con GitHub Actions y Docker Hub

El archivo `.github/workflows/ci.yml` se ejecuta:

- En cada **pull request** a `main`: instala, compila y construye la imagen (no publica nada).
- En cada **push** a `main`:
  1. **build-backend** (máquina Ubuntu de GitHub): compila y publica la imagen en Docker Hub como `<usuario>/activebreak-backend:latest`.
  2. **deploy-backend** (tu equipo como *self-hosted runner*): descarga la imagen nueva y reinicia el contenedor.

Configuración, una sola vez:

1. En Docker Hub crea un **Personal Access Token** (Account settings → Personal access tokens).
2. En GitHub → Settings → Secrets and variables → Actions:
   - Secrets: `DOCKER_USERNAME` (tu usuario de Docker Hub) y `DOCKER_TOKEN` (el token).
   - Variables: `DEPLOY_DIR`, la carpeta del proyecto en el equipo del runner (donde están `docker-compose.yml` y `.env`).
3. Registra tu equipo en GitHub → Settings → Actions → Runners → *New self-hosted runner* y déjalo corriendo (`run.cmd` en Windows, `./run.sh` en macOS/Linux).

El despliegue toma el nombre de la imagen del secreto `DOCKER_USERNAME`, así que siempre descarga la imagen del equipo. Para actualizar a mano en otro equipo, pon `BACKEND_IMAGE=<usuario>/activebreak-backend:latest` en el `.env` y ejecuta `docker compose pull backend` y `docker compose up -d backend`.

## Swagger

La documentación interactiva está en **`/api/docs`** (y la especificación OpenAPI en `/api/docs.json`). Es pública y de solo lectura, con su propio límite de peticiones; se desactiva con `API_DOCS_ENABLED=false`.

Está organizada por etiquetas numeradas en el orden recomendado para probar:

1. Autenticación → 2. Usuarios → 3. Organizaciones → 4. Categorías de pausa → 5. Pausas activas → 6. Recordatorios → 7. Días de recordatorio → 8. Historial de actividad → 9. Metas semanales

Para probar: registra un usuario, haz login, pulsa **Authorize** y pega `data.token`. El token se conserva al recargar la página. La especificación está en `src/infrastructure/docs/openapi.ts`: si agregas un endpoint, documéntalo ahí.

## Autenticación

1. Crea un usuario con `POST /api/users`. Siempre se crea con `role: "user"` y activo.
2. Inicia sesión con `POST /api/login`:

```json
{ "email": "ana@example.com", "password": "Clave2026" }
```

3. Usa el token de `data.token` (válido 1 hora) en las rutas protegidas:

```
Authorization: Bearer <token>
```

Para tener el primer administrador, registra un usuario y cambia su rol en la base de datos. Con Docker:

```bash
docker compose exec db psql -U activebreak -d activebreak -c "UPDATE users SET role='admin' WHERE email='tu@correo.com';"
```

Después ese admin puede promover a otros con `PUT /api/users/:id`.

## Endpoints

Todas las rutas llevan el prefijo `/api` y requieren token, salvo las marcadas como 🌐 públicas.

- 👤 = el propio usuario (dueño del recurso) o un admin
- 🛡️ = solo admin
- 🔒 = cualquier usuario autenticado

Límites por IP: `POST /login` admite 10 intentos fallidos cada 15 minutos y `POST /users`, 20 registros por hora. Al superarlos se responde `429`.

### Formato de respuesta

Todas las respuestas tienen la misma forma (`src/infrastructure/web/response.ts`). El código HTTP se mantiene igual.

Éxito:

```json
{ "success": true, "message": "Meta creada exitosamente", "data": { "id": 3, "targetBreaks": 10, "...": "..." } }
```

- Al **crear** (`201`) o **actualizar** (`200`), `data` trae el registro completo.
- Al **consultar** (`200`), `data` trae el registro o la lista.
- Al **eliminar** (`200`), `data` es `null`.
- En el login, `data` es `{ "token": "..." }`.

Error:

```json
{ "success": false, "message": "Datos inválidos", "errors": ["La duración debe estar entre 1 y 30 minutos", "La intensidad es obligatoria"] }
```

- `errors` trae un mensaje por cada dato inválido (validaciones Joi). En los demás errores va vacía y la causa está en `message`.
- Todos los errores salen del middleware global `errorHandler` (`web/errorMiddleware.ts`); los errores internos (`500`) no exponen detalles.

| Código | Cuándo |
| --- | --- |
| 400 | Datos inválidos o regla de negocio incumplida |
| 401 | Sin token, token inválido o credenciales incorrectas |
| 403 | Sin permisos sobre el recurso |
| 404 | El recurso o la ruta no existen |
| 409 | Conflicto, por ejemplo un correo ya registrado |
| 429 | Demasiadas peticiones (login, registro o documentación) |
| 500 | Error interno (sin detalles en la respuesta) |

### Usuarios

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/login` | 🌐 | Iniciar sesión y obtener token |
| POST | `/users` | 🌐 | Registrar usuario |
| GET | `/users` | 🛡️ | Listar usuarios |
| GET | `/users/active` | 🛡️ | Listar usuarios activos |
| GET | `/users/email/:email` | 🛡️ | Buscar usuario por correo |
| GET | `/users/:id` | 👤 | Obtener usuario por id |
| PUT | `/users/:id` | 👤 | Actualizar usuario (`role`, `active` u `organizationId`: solo admin) |
| DELETE | `/users/:id` | 👤 | Desactivar usuario |

Reglas: nombre de 5 a 150 caracteres (solo letras y espacios); contraseña de 8 a 64 caracteres con al menos una letra y un número; el correo se guarda en minúsculas. Un admin no puede desactivarse a sí mismo y siempre debe quedar al menos un admin activo. Las respuestas no incluyen la contraseña.

### Organizaciones

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/organizations` | 🛡️ | Crear organización |
| GET | `/organizations` | 🛡️ | Listar organizaciones |
| GET | `/organizations/active` | 🛡️ | Listar organizaciones activas |
| GET | `/organizations/:id` | 🛡️ | Obtener organización por id |
| PUT | `/organizations/:id` | 🛡️ | Actualizar organización |
| DELETE | `/organizations/:id` | 🛡️ | Desactivar organización |

Reglas: el NIT (`taxId`) es único y su dígito de verificación se comprueba con el algoritmo de la DIAN. No se puede desactivar una organización con usuarios activos.

### Categorías de pausa

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/break-categories` | 🛡️ | Crear categoría |
| GET | `/break-categories` | 🔒 | Listar categorías |
| GET | `/break-categories/active` | 🔒 | Listar categorías activas |
| GET | `/break-categories/:id` | 🔒 | Obtener categoría por id |
| PUT | `/break-categories/:id` | 🛡️ | Actualizar categoría |
| DELETE | `/break-categories/:id` | 🛡️ | Desactivar categoría |

Reglas: el nombre es único (sin distinguir mayúsculas). No se puede desactivar una categoría con pausas activas.

### Pausas activas

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/active-breaks` | 🛡️ | Crear pausa activa |
| GET | `/active-breaks` | 🔒 | Listar todas las pausas |
| GET | `/active-breaks/active` | 🔒 | Catálogo de pausas activas; filtros opcionales `?categoryId=&intensity=&maxDuration=` |
| GET | `/active-breaks/:id` | 🔒 | Obtener pausa por id |
| PUT | `/active-breaks/:id` | 🛡️ | Actualizar pausa |
| DELETE | `/active-breaks/:id` | 🛡️ | Desactivar pausa |

Reglas: cada pausa necesita una categoría activa (`categoryId`); duración de 1 a 30 minutos.

### Recordatorios

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/reminders` | 👤 | Crear recordatorio (para el propio `userId`) |
| GET | `/reminders` | 🛡️ | Listar recordatorios |
| GET | `/reminders/active` | 🛡️ | Listar recordatorios activos |
| GET | `/reminders/user/:userId` | 👤 | Recordatorios de un usuario |
| GET | `/reminders/:id` | 👤 | Obtener recordatorio por id |
| PUT | `/reminders/:id` | 👤 | Actualizar recordatorio |
| DELETE | `/reminders/:id` | 👤 | Desactivar recordatorio |

Reglas: frecuencia de 15 a 240 minutos, hora de fin posterior a la de inicio y máximo 3 recordatorios activos por usuario.

### Días de recordatorio

El acceso depende del dueño del recordatorio al que pertenecen los días.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/reminder-days` | 👤 | Asignar días a un recordatorio |
| GET | `/reminder-days` | 🛡️ | Listar días |
| GET | `/reminder-days/reminder/:reminderId` | 👤 | Días de un recordatorio |
| GET | `/reminder-days/:id` | 👤 | Obtener por id |
| DELETE | `/reminder-days/:id` | 👤 | Eliminar |

Un recordatorio no puede repetir días (lo garantiza también la base de datos).

### Historial de actividad

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/activity-history` | 👤 | Registrar una pausa realizada (para el propio `userId`) |
| GET | `/activity-history` | 🛡️ | Listar historial |
| GET | `/activity-history/user/:userId` | 👤 | Historial de un usuario |
| GET | `/activity-history/break/:breakId` | 🛡️ | Historial de una pausa |
| GET | `/activity-history/:id` | 👤 | Obtener registro por id |
| DELETE | `/activity-history/:id` | 👤 | Eliminar registro |

Ejemplo de cuerpo para `POST /api/activity-history`:

```json
{
  "userId": 1,
  "breakId": 3,
  "performedAt": "2026-11-26T10:00",
  "completed": true,
  "actualDurationMinutes": 5
}
```

Reglas: `performedAt` es opcional (por defecto, ahora) y no puede ser futura; la duración real va de 0 a 60 minutos. Cada registro recalcula el estado de las metas del usuario.

### Metas semanales

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/goals` | 👤 | Crear meta (para el propio `userId`) |
| GET | `/goals` | 🛡️ | Listar metas |
| GET | `/goals/user/:userId` | 👤 | Metas de un usuario |
| GET | `/goals/:id` | 👤 | Obtener meta por id |
| PUT | `/goals/:id` | 👤 | Actualizar meta (solo si está en curso) |
| DELETE | `/goals/:id` | 👤 | Desactivar meta |

Ejemplo de cuerpo para `POST /api/goals`:

```json
{
  "userId": 1,
  "targetBreaks": 10,
  "startDate": "2026-11-30",
  "endDate": "2026-12-06"
}
```

Reglas: objetivo de 1 a 50 pausas; la meta dura como máximo 7 días y no puede terminar en el pasado; un usuario no puede tener dos metas activas con fechas que se crucen. El estado se calcula con el historial: `completed` al llegar al objetivo, `expired` si termina sin lograrlo e `in_progress` mientras tanto. Las respuestas incluyen `completedBreaks` y `progressPercentage`.

## Documentación adicional

En [`Artefactos_ActiveBreak.pdf`](Artefactos_ActiveBreak.pdf) se encuentran los artefactos de diseño del proyecto.
