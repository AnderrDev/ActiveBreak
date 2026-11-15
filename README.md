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
usuarios ──< recordatorios ──< recordatorio_dias
    │
    └──< historial_actividad >── pausas_activas
```

- **usuarios**: `nombre`, `correo` (único), `contrasena_hash`, `rol` (`usuario` | `admin`), `nivel_salud` (`bajo` | `medio` | `alto`), `activo`.
- **pausas_activas**: `nombre`, `descripcion`, `duracion_minutos`, `intensidad` (`baja` | `media` | `alta`), `activo`.
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

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor en desarrollo con recarga automática |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run star` | Ejecuta la versión compilada (`dist/index.js`) |

El servidor queda disponible en `http://localhost:<PORT>/api`.

## Ambiente local con Docker

Levanta la API y PostgreSQL sin instalar nada más que Docker:

```bash
cp .env.example .env   # define al menos JWT_SECRET (openssl rand -hex 32)
docker compose up --build
```

- API en `http://localhost:3000/api` (puerto configurable con `API_PORT_HOST`), con recarga automática al guardar archivos de `src/`.
- PostgreSQL accesible desde tu máquina en `localhost:5433` (configurable con `DB_PORT_HOST`) con las credenciales `DB_USER` / `DB_PASSWORD` / `DB_NAME` del `.env` (por defecto `activebreak`).
- Dentro de Docker la API se conecta a la BD por el host `db`; el `DB_HOST` del `.env` no se usa.
- Los datos se guardan en el volumen `db-data`.

| Comando | Descripción |
| --- | --- |
| `docker compose up -d --build` | Levanta todo en segundo plano |
| `docker compose logs -f api` | Ver logs de la API |
| `docker compose down` | Detiene los contenedores (conserva los datos) |
| `docker compose down -v` | Detiene y borra la base de datos |
| `docker compose exec db psql -U activebreak activebreak` | Consola de PostgreSQL |

Para una imagen de producción (compila a `dist/` y ejecuta con `node`): `docker build --target prod -t activebreak .`

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

Para tener el primer administrador, registra un usuario y cambia su `rol` a `admin` en la base de datos. Después ese admin puede promover a otros con `PUT /api/users/:id`.

## Endpoints

Todas las rutas llevan el prefijo `/api` y requieren token, salvo las marcadas como 🌐 públicas.

- 👤 = el propio usuario (dueño del recurso) o un admin
- 🛡️ = solo admin
- 🔒 = cualquier usuario autenticado

Sin token se responde `401`; sin permisos, `403`.

Los errores siempre tienen el formato `{ "error": "mensaje" }`:

| Código | Cuándo |
| --- | --- |
| 400 | Datos inválidos o regla de negocio incumplida |
| 401 | Sin token, token inválido o credenciales incorrectas |
| 403 | Sin permisos sobre el recurso |
| 404 | El recurso o la ruta no existen |
| 409 | Conflicto, por ejemplo un correo ya registrado |
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
| PUT | `/users/:id` | 👤 | Actualizar usuario (cambiar `rol` o `activo`: solo admin) |
| DELETE | `/users/:id` | 👤 | Desactivar usuario |

Las respuestas de usuario no incluyen la contraseña.

### Pausas activas

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/pausas-activas` | 🛡️ | Crear pausa activa |
| GET | `/pausas-activas` | 🔒 | Listar pausas |
| GET | `/pausas-activas/activas` | 🔒 | Listar pausas activas |
| GET | `/pausas-activas/:id` | 🔒 | Obtener pausa por id |
| PUT | `/pausas-activas/:id` | 🛡️ | Actualizar pausa |
| DELETE | `/pausas-activas/:id` | 🛡️ | Desactivar pausa |

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

### Días de recordatorio

El acceso depende del dueño del recordatorio al que pertenecen los días.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/recordatorio-dia` | 👤 | Asignar días a un recordatorio |
| GET | `/recordatorio-dia` | 🛡️ | Listar días |
| GET | `/recordatorio-dia/:id` | 👤 | Obtener por id |
| GET | `/recordatorio-dia/recordatorio/:recordatorioId` | 👤 | Días de un recordatorio |
| DELETE | `/recordatorio-dia/:id` | 👤 | Eliminar |

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

## Documentación adicional

En [`Artefactos_ActiveBreak.pdf`](Artefactos_ActiveBreak.pdf) se encuentran los artefactos de diseño del proyecto.
