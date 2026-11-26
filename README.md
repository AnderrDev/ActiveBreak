# ActiveBreak

API REST para gestionar **pausas activas** en el trabajo: usuarios, catálogo de ejercicios, recordatorios programados por día de la semana e historial de actividad.

Construida con **Node.js + TypeScript**, **Express 5**, **TypeORM** y **PostgreSQL**, siguiendo una **arquitectura hexagonal** (puertos y adaptadores).

## Tecnologías

| Área | Herramienta |
| --- | --- |
| Runtime | Node.js (ESM) + TypeScript |
| Framework HTTP | Express 5 |
| ORM / BD | TypeORM + PostgreSQL |
| Autenticación | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validación | Joi |
| Desarrollo | nodemon + tsx |

## Arquitectura

```
src/
├── domain/            # Entidades de dominio y puertos (interfaces *Port.ts)
├── application/       # Casos de uso (*Application.ts) y AuthApplication (JWT)
├── infraestructure/
│   ├── adapter/       # Implementación de los puertos con TypeORM
│   ├── controller/    # Controladores HTTP
│   ├── routes/        # Definición de rutas Express
│   ├── entities/      # Entidades TypeORM (tablas)
│   ├── util/          # Validaciones con Joi
│   ├── config/        # Variables de entorno y conexión a la BD
│   ├── web/           # App Express y middleware de autenticación
│   └── bootstrap/     # Arranque del servidor HTTP
└── index.ts           # Punto de entrada
```

Flujo de una petición: **Route → Controller → Application (caso de uso) → Port → Adapter → Base de datos**.

## Modelo de datos

```
organizaciones ──< usuarios ──< recordatorios ──< recordatorio_dias
                     │ │
                     │ └──< metas
                     └──< historial_actividad >── pausas_activas >── categorias_pausa
```

- **organizaciones**: `nombre`, `nit` (único, `#########-#`), `sector`, `activo`.
- **usuarios**: `nombre`, `correo` (único, en minúsculas), `contrasena_hash`, `rol` (`usuario` | `admin`), `nivel_salud` (`bajo` | `medio` | `alto`), organización (opcional, la asigna un admin), `activo`.
- **categorias_pausa**: `nombre` (único), `descripcion`, `activo`.
- **pausas_activas**: categoría, `nombre`, `descripcion`, `duracion_minutos`, `intensidad` (`baja` | `media` | `alta`), `activo`.
- **metas**: usuario, `pausas_objetivo`, `fecha_inicio`, `fecha_fin`, `estado` (`en_curso` | `cumplida` | `vencida`), `activo`.
- **recordatorios**: usuario, `frecuencia_minutos`, `hora_inicio`, `hora_fin`, `activo`.
- **recordatorio_dias**: recordatorio, `dia_semana` (`lunes` … `domingo`).
- **historial_actividad**: usuario, pausa, `fecha_hora`, `completado`, `duracion_real`.

> En `development` y `test`, TypeORM crea y actualiza las tablas automáticamente al arrancar (`synchronize`). En `production` esta opción se desactiva, así que las tablas deben existir antes del despliegue.

## Requisitos

- Node.js 20 o superior
- PostgreSQL

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
| `DB_HOST` | Host de PostgreSQL |
| `DB_PORT` | Puerto de PostgreSQL (por defecto `5432`) |
| `DB_USER` | Usuario de la BD |
| `DB_PASSWORD` | Contraseña de la BD |
| `DB_NAME` | Nombre de la base de datos |
| `JWT_SECRET` | Clave para firmar los tokens JWT (obligatoria, mínimo 32 caracteres) |
| `CORS_ORIGINS` | Orígenes permitidos por CORS, separados por comas. Si está vacío, en `development` se permite cualquiera y en `production` ninguno |
| `TRUST_PROXY` | Número de proxies inversos delante de la API (por defecto `0`); necesario para que el límite de peticiones use la IP real |

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
├── Dockerfile              # Imagen del backend: instala, compila TypeScript y ejecuta dist/index.js
├── docker-compose.yml      # Servicios: db (PostgreSQL 16) y backend
├── database/init/          # Scripts SQL que se ejecutan la PRIMERA vez que se crea la base
│   ├── 01_tablas.sql       #   tablas, enums y claves foráneas
│   └── 02_datos_iniciales.sql  # categorías y pausas de ejemplo
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
- En el contenedor la API corre con `NODE_ENV=production`, así que TypeORM **no** modifica las tablas: las crea `database/init/01_tablas.sql`. Si cambias una entidad, actualiza ese script y recrea la base con `docker compose down -v`.

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

El archivo `.github/workflows/ci.yml` se ejecuta en cada `push` a `main`:

1. **build-backend** (máquina Ubuntu de GitHub): instala dependencias, compila TypeScript, construye la imagen y la publica en Docker Hub como `<usuario>/activebreak-backend:latest`.
2. **deploy-backend** (tu equipo como *self-hosted runner*): descarga la imagen nueva y reinicia el contenedor (`docker compose pull backend` y `docker compose up -d backend`).

Configuración, una sola vez:

1. En Docker Hub crea un **Personal Access Token** (Account settings → Personal access tokens).
2. En GitHub → Settings → Secrets and variables → Actions:
   - Secrets: `DOCKER_USERNAME` (tu usuario de Docker Hub) y `DOCKER_TOKEN` (el token).
   - Variables: `DEPLOY_DIR`, la carpeta del proyecto en el equipo del runner (donde están `docker-compose.yml` y `.env`).
3. En el `.env` de ese equipo pon `DOCKERHUB_USUARIO=<tu usuario>` para que Compose use la imagen de Docker Hub.
4. Registra tu equipo en GitHub → Settings → Actions → Runners → *New self-hosted runner* y déjalo corriendo (`run.cmd` en Windows, `./run.sh` en macOS/Linux).

Sin el runner, el job `build-backend` igual publica la imagen; puedes actualizar a mano con `docker compose pull backend` y `docker compose up -d backend`.

## Swagger

La documentación interactiva está en **`/api/docs`** (y la especificación OpenAPI en `/api/docs.json`). Está organizada por etiquetas numeradas en el orden recomendado para probar:

1. Autenticación → 2. Usuarios → 3. Organizaciones → 4. Categorías de pausa → 5. Pausas activas → 6. Recordatorios → 7. Días de recordatorio → 8. Historial → 9. Metas semanales

Para probar: registra un usuario, haz login, pulsa **Authorize** y pega el `token`. El token se conserva al recargar la página. Cada endpoint trae un ejemplo de cuerpo listo para *Execute*. La especificación está en `src/infraestructure/docs/openapi.ts`: si agregas un endpoint, documéntalo ahí.

## Autenticación

1. Crea un usuario con `POST /api/users`. Siempre se crea con rol `usuario` y activo (el rol no se puede elegir al registrarse).
2. Inicia sesión con `POST /api/login`:

```json
{ "correo": "ana@example.com", "contrasena": "tu_contraseña" }
```

3. Usa el token recibido (válido 1 hora) en las rutas protegidas:

```
Authorization: Bearer <token>
```

Para tener el primer administrador, registra un usuario y cambia su `rol` a `admin` en la base de datos. Con Docker:

```bash
docker compose exec db psql -U activebreak -d activebreak -c "UPDATE usuarios SET rol='admin' WHERE correo='tu@correo.com';"
```

Después ese admin puede promover a otros con `PUT /api/users/:id`.

## Endpoints

Todas las rutas llevan el prefijo `/api` y requieren token, salvo las marcadas como 🌐 públicas.

- 👤 = el propio usuario (dueño del recurso) o un admin
- 🛡️ = solo admin
- 🔒 = cualquier usuario autenticado

Sin token se responde `401`; sin permisos, `403`.

Límites por IP: `POST /login` admite 10 intentos fallidos cada 15 minutos y `POST /users`, 20 registros por hora. Al superarlos se responde `429`.

### Formato de respuesta

Todas las respuestas tienen la misma forma (`src/infraestructure/web/response.ts`). El código HTTP se mantiene igual.

Éxito:

```json
{ "success": true, "message": "Meta creada exitosamente", "data": { "id": 3, "pausasObjetivo": 10, "...": "..." } }
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
| 429 | Demasiadas peticiones (login o registro) |
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
| PUT | `/users/:id` | 👤 | Actualizar usuario (cambiar `rol`, `activo` u `organizacionId`: solo admin) |
| DELETE | `/users/:id` | 👤 | Desactivar usuario |

Las respuestas de usuario no incluyen la contraseña.

Reglas: nombre de 5 a 150 caracteres (solo letras y espacios); contraseña de 8 a 64 caracteres con al menos una letra y un número; el correo se guarda en minúsculas. Un admin no puede desactivarse a sí mismo y siempre debe quedar al menos un admin activo.

### Organizaciones

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/organizaciones` | 🛡️ | Crear organización |
| GET | `/organizaciones` | 🛡️ | Listar organizaciones |
| GET | `/organizaciones/activas` | 🛡️ | Listar organizaciones activas |
| GET | `/organizaciones/:id` | 🛡️ | Obtener organización por id |
| PUT | `/organizaciones/:id` | 🛡️ | Actualizar organización |
| DELETE | `/organizaciones/:id` | 🛡️ | Desactivar organización |

Reglas: el NIT es único y su dígito de verificación se comprueba con el algoritmo de la DIAN. No se puede desactivar una organización con usuarios activos.

### Categorías de pausa

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/categorias-pausa` | 🛡️ | Crear categoría |
| GET | `/categorias-pausa` | 🔒 | Listar categorías |
| GET | `/categorias-pausa/activas` | 🔒 | Listar categorías activas |
| GET | `/categorias-pausa/:id` | 🔒 | Obtener categoría por id |
| PUT | `/categorias-pausa/:id` | 🛡️ | Actualizar categoría |
| DELETE | `/categorias-pausa/:id` | 🛡️ | Desactivar categoría |

Reglas: el nombre es único (sin distinguir mayúsculas). No se puede desactivar una categoría con pausas activas.

### Pausas activas

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/pausas-activas` | 🛡️ | Crear pausa activa |
| GET | `/pausas-activas` | 🔒 | Listar pausas |
| GET | `/pausas-activas/activas` | 🔒 | Catálogo de pausas activas; filtros opcionales `?categoriaId=&intensidad=&duracionMax=` |
| GET | `/pausas-activas/:id` | 🔒 | Obtener pausa por id |
| PUT | `/pausas-activas/:id` | 🛡️ | Actualizar pausa |
| DELETE | `/pausas-activas/:id` | 🛡️ | Desactivar pausa |

Reglas: cada pausa nueva necesita `categoriaId` de una categoría activa; duración de 1 a 30 minutos.

### Recordatorios

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/recordatorios` | 👤 | Crear recordatorio (para el propio `usuarioId`) |
| GET | `/recordatorios` | 🛡️ | Listar recordatorios |
| GET | `/recordatorios/active` | 🛡️ | Listar recordatorios activos |
| GET | `/recordatorios/:id` | 👤 | Obtener recordatorio por id |
| GET | `/recordatorios/user/:userId` | 👤 | Recordatorios de un usuario |
| PUT | `/recordatorios/:id` | 👤 | Actualizar recordatorio |
| DELETE | `/recordatorios/:id` | 👤 | Desactivar recordatorio |

Reglas: frecuencia de 15 a 240 minutos, hora de fin posterior a la de inicio y máximo 3 recordatorios activos por usuario.

### Días de recordatorio

El acceso depende del dueño del recordatorio al que pertenecen los días.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/recordatorio-dia` | 👤 | Asignar días a un recordatorio |
| GET | `/recordatorio-dia` | 🛡️ | Listar días |
| GET | `/recordatorio-dia/:id` | 👤 | Obtener por id |
| GET | `/recordatorio-dia/recordatorio/:recordatorioId` | 👤 | Días de un recordatorio |
| DELETE | `/recordatorio-dia/:id` | 👤 | Eliminar |

Un recordatorio no puede tener días repetidos.

### Historial de actividad

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/historial` | 👤 | Registrar una pausa realizada (para el propio `usuarioId`) |
| GET | `/historial` | 🛡️ | Listar historial |
| GET | `/historial/usuario/:usuarioId` | 👤 | Historial de un usuario |
| GET | `/historial/pausa/:pausaId` | 🛡️ | Historial de una pausa |
| GET | `/historial/:id` | 👤 | Obtener registro por id |
| DELETE | `/historial/:id` | 👤 | Eliminar registro |

Ejemplo de cuerpo para `POST /api/historial`:

```json
{
  "usuarioId": 1,
  "pausaId": 3,
  "fechaHora": "2026-11-14T10:00",
  "completado": true,
  "duracionReal": 5
}
```

Reglas: no se aceptan fechas futuras y la duración real va de 0 a 60 minutos. Cada registro recalcula el estado de las metas del usuario.

### Metas semanales

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/metas` | 👤 | Crear meta (para el propio `usuarioId`) |
| GET | `/metas` | 🛡️ | Listar metas |
| GET | `/metas/usuario/:usuarioId` | 👤 | Metas de un usuario |
| GET | `/metas/:id` | 👤 | Obtener meta por id |
| PUT | `/metas/:id` | 👤 | Actualizar meta (solo si está en curso) |
| DELETE | `/metas/:id` | 👤 | Desactivar meta |

Ejemplo de cuerpo para `POST /api/metas`:

```json
{
  "usuarioId": 1,
  "pausasObjetivo": 10,
  "fechaInicio": "2026-11-30",
  "fechaFin": "2026-12-06"
}
```

Reglas: objetivo de 1 a 50 pausas; la meta dura como máximo 7 días y no puede terminar en el pasado; un usuario no puede tener dos metas activas con fechas que se crucen. El estado se calcula con el historial: `cumplida` al llegar al objetivo, `vencida` si termina sin lograrlo y `en_curso` mientras tanto. Las respuestas incluyen `pausasCompletadas` y `porcentajeAvance`.

## Documentación adicional

En [`Artefactos_ActiveBreak.pdf`](Artefactos_ActiveBreak.pdf) se encuentran los artefactos de diseño del proyecto.
